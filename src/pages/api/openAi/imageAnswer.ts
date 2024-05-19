import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import requestIp from "request-ip";
import moment from "moment-timezone";
import { BraveSearchAPI } from "../brave/brave";
import FastGPT from "../kagi/fastGpt";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
type Data = {
  response: string;
};
const fastGPT = new FastGPT(process.env.KAGI_API_KEY!);

async function searchInternet({ query }: { query: string }) {
  console.log("Searching the internet for:", query);
  const answer = await fastGPT.answerQuery(`Return a terse answer to the query ${query}`);
  console.log("Answer:", answer.output);
  console.log("References:", answer.references);
  return `${answer.output} Sources: -${answer.references
    .map((r) => r.url)
    .join("\n-")}`;
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const image = req.body.image;
  const prompt = req.body.prompt;

  const detectedIp = requestIp.getClientIp(req);
  //Fetch IP from http://ip-api.com/json/24.48.0.1
  const ipData = await fetch(`http://ip-api.com/json/${detectedIp}`);
  const ipDataJson = await ipData.json();
  const location = ipDataJson.city + ", " + ipDataJson.region;
  const timezone = ipDataJson.tz;
  const currentTime = moment.tz(timezone).format();

  const messages: ChatCompletionMessageParam[] = [];
  let finalResponse = undefined;

  while (!finalResponse) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      tool_choice: "required",
      tools: [
        {
          type: "function",
          function: {
            name: "search_internet",
            description: "Search the internet for information",
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
              "The final tool that you call when you're ready to produce a final answer to the user's prompt",
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
`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `The user has asked '${prompt}', use tools and then speak out an answer that's directly to their question.`,
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
        if (functionName === "speak_to_user") {
          finalResponse = functionArgs.text;
          continue;
        }
        const functionToCall: any = availableFunctions[functionName] as any;
        const functionResponse = await functionToCall({
          ...functionArgs,
        });
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
  res.status(200).json({ response: finalResponse });
}
