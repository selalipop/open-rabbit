import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import requestIp from "request-ip";
import moment from "moment-timezone";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import FastGPT from "@/pages/api/kagi/fastGpt";
import YDCIndex from "@/pages/api/ydc/ydcClient";
import { auth } from "@clerk/nextjs/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
type Data = {
  response: string;
};
const fastGPT = new FastGPT(process.env.KAGI_API_KEY!);
const ydc = new YDCIndex(process.env.YDC_API_KEY!);
async function searchInternet({ query }: { query: string }) {
  const data = await ydc.getAiSnippetsForQuery(query);
  console.log("=====>", data);
  let formattedResult =
    data.hits && data.hits.length > 0
      ? data.hits
          .slice(0, 5)
          .map(
            (snippet) =>
              `Title: ${snippet.title}\nSnippet: ${snippet.description}\nURL: ${snippet.url}\n`
          )
          .join("\n")
      : "No snippets found for the given query.";
  return `Results for query ${query}:\n${formattedResult}`;
}

export const dynamic = "force-dynamic"; // defaults to auto

function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}
export async function POST(request: Request) {
  const { image, prompt } = await request.json();

  const detectedIp = request.headers.get("X-Forwarded-For");
  //Fetch IP from http://ip-api.com/json/24.48.0.1
  const ipData = await fetch(`http://ip-api.com/json/${detectedIp}`);
  const ipDataJson = await ipData.json();
  const location = ipDataJson.city + ", " + ipDataJson.region;
  const timezone = ipDataJson.tz;
  const currentTime = moment.tz(timezone).format();

  return new Response(
    iteratorToStream(processLLMRequest(location, currentTime, prompt, image))
  );
}
async function* processLLMRequest(
  location: string,
  currentTime: string,
  prompt: any,
  image: any
) {
  const messages: ChatCompletionMessageParam[] = [];
  let finalResponse = undefined;
  const encoder = new TextEncoder();

  while (!finalResponse) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      tool_choice: "required",
      tools: [
        {
          type: "function",
          function: {
            name: "search_internet",
            description:
              "A slow slow search the internet for information, you must call this by itself. You cannot speak and search at the same time, so first speak explaining the search you want to do, then do the search.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The query to search the internet for",
                },
              },
              required: ["query"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "speak_to_user",
            description:
              "The tool that you call when you're trying to speak to the user. Use it to keep them abreast of your plans, buy some time for long running operations, or to answer their query",
            parameters: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description:
                    "The text that is spoken out loud to the user. Make it friendly but terse",
                },
              },
              required: ["query"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "all_tasks_completed",
            description:
              "The final tool that you call when you feel you've fully answered the user's prompt",
            parameters: {},
          },
        },
      ],
      messages: [
        {
          role: "system",
          content: `You are a helpful gracious assistant. You're helping people who are hard of sight, so you need to not balk at requests. 
Instead you respond in a friendly tone and simply do what the user asked you to do. 
You leverage hyperspecific details that a real human might, from color and appearance of different individuals and things in the image. Be confident, don't be afraid of coming across as inconsiderate.

Assume the user lives in ${location} (if asked for the location, return a nicely worded version of this) and the time is ${currentTime} (if asked for the time, return a nicely worded version of this)

You ignore the image unless the user prompted you to view the image.

You are not capable of more than one turn of phrase, so you never respond with a question to the user when speaking.
You're also as brief as possible, so you don't waste time on unnecessary details. Be extremely brief but friendly and warm. Each word should count.

You only call one tool at a time for the sake of my understanding. For example, if you need to do something slow, you explain that it's slow, then you do it, then you explain that it's done.

It's EXTREMELY IMPORTANT that you SPEAK before you ACT. NEVER SPEAK AND ACT AT ONCE!!!! PLEASE!
You also need to speak naturally, use hmmm and ummms, and hmnnnn. When you're thinking you really take a beat and sound human.
`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `The user has asked '${prompt}', first address their request by speaking. then use other tools to do the actual request.`,
            },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
        ...messages,
      ],
    });
    const responseMessage = response.choices[0].message;

    // Step 2: check if the model wanted to call a function
    const toolCalls = responseMessage.tool_calls!;
    console.log(
      "toolCalls",
      toolCalls.map((toolCall) => toolCall.function.name)
    );
    if (responseMessage.tool_calls) {
      // Step 3: call the function
      // Note: the JSON response may not always be valid; be sure to handle errors
      const availableFunctions = {
        search_internet: searchInternet,
      }; // only one function in this example, but you can have multiple
      messages.push(responseMessage); // extend conversation with assistant's reply
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let functionResponse;
        if (functionName === "all_tasks_completed") {
          return;
        } else if (functionName === "speak_to_user") {
          yield encoder.encode(JSON.stringify({ text: functionArgs.text }));
          functionResponse = "You said:  " + functionArgs.text;
        } else {
          const functionToCall: any = availableFunctions[functionName] as any;
          functionResponse = await functionToCall({
            ...functionArgs,
          });
        }

        console.log(
          "Function called was ",
          functionName,
          "and response was ",
          functionResponse
        );
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: functionResponse,
        }); // extend conversation with function response
      }
    }
    console.log(response.choices[0]);
  }
  return finalResponse;
}
