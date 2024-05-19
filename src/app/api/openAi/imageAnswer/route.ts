import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import requestIp from "request-ip";
import moment from "moment-timezone";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import FastGPT from "@/pages/api/kagi/fastGpt";
import YDCIndex from "@/pages/api/ydc/ydcClient";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getSpotifyAccessToken } from "@/backendUtil/spotify";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import * as FormData from 'form-data';
import Mailgun from 'mailgun.js';
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY || 'key-yourkeyhere'});

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
async function sendEmail({ content, userId }: { content: string, userId: string }) {
  const result = await getSpotifyAccessToken(userId!);
  if (!result) {
    return "You don't have a Spotify account connected to this app. Please connect your Spotify account to use this feature."
  }
  const { accessToken, refreshToken } = result;
  const sdk = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID!, {
    access_token: accessToken!,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken,
  });
  const user = await sdk.currentUser.profile();
  const email = user.email;
  await mg.messages.create('mg.openrabbit.dev', {
    from: "Excited User <mailgun@mg.openrabbit.dev>",
    to: ["dev@croc.studio"],
    subject: "Hello",
    text: content,
    html: content
  })
  return "Email sent to " + email
}
async function searchSpotify({ query, userId }: { query: string, userId: string }) {
  const result = await getSpotifyAccessToken(userId!);
  if (!result) {
    return "You don't have a Spotify account connected to this app. Please connect your Spotify account to use this feature."
  }
  const { accessToken, refreshToken } = result;

  const sdk = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID!, {
    access_token: accessToken!,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken,
  });
  const searchResults =  await sdk.search(query, ["album", "playlist", "track"]);
  return `You searched for ${query} and found ${searchResults.tracks.items.length} tracks, ${searchResults.playlists.items.length} playlists, and ${searchResults.albums.items.length} albums.
  The tracks are ${searchResults.tracks.items.map(track => `${track.name} (URI: ${track.uri}, Link: https://open.spotify.com/track/${track.uri.split(':')[2]})`).join(", ")}, 
  The playlists are ${searchResults.playlists.items.map(playlist => `${playlist.name} (URI: ${playlist.uri}, Link: https://open.spotify.com/playlist/${playlist.uri.split(':')[2]})`).join(", ")}, 
  And the albums are ${searchResults.albums.items.map(album => `${album.name} (URI: ${album.uri}, Link: https://open.spotify.com/album/${album.uri.split(':')[2]})`).join(", ")}.
  `
}
async function playSpotify({ uri, userId }: { uri: string, userId: string }) {
  const result = await getSpotifyAccessToken(userId!);
  if (!result) {
    return "You don't have a Spotify account connected to this app. Please connect your Spotify account to use this feature."
  }
  const { accessToken, refreshToken } = result;

  const sdk = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID!, {
    access_token: accessToken!,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken,
  });
  const devices = await sdk.player.getAvailableDevices()
  sdk.player.startResumePlayback(devices.devices[0].id!, uri )
  return "Playing the song with the uri " + uri

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
export async function POST(request: NextRequest) {
  const { image, prompt } = await request.json();
  const {userId} = auth()
  let location = request.geo?.city || "San Francisco, CA";
  let currentTime = moment().format();
  try {
    const detectedIp = request.headers.get("X-Forwarded-For");
    //Fetch IP from http://ip-api.com/json/24.48.0.1
    const ipData = await fetch(`http://ip-api.com/json/${detectedIp}`);
    const ipDataJson = await ipData.json();
    if (ipDataJson.city && ipDataJson.region) {
      location = ipDataJson.city + ", " + ipDataJson.region;
      const timezone = ipDataJson.tz;
      currentTime = moment.tz(timezone).format();
    }
  } catch (error) {
    console.error("Failed to fetch or process IP data:", error);
  }

  return new Response(
    iteratorToStream(processLLMRequest(userId!, location, currentTime, prompt, image))
  );
}
async function* processLLMRequest(
  userId: string,
  location: string,
  currentTime: string,
  prompt: any,
  image: any,
) {
  const messages: ChatCompletionMessageParam[] = [];
  let finalResponse = undefined;
  const encoder = new TextEncoder();
  console.log("Processing LLM Request", prompt);
  console.log("=>>>>>>>>>>>> location", location);

  while (!finalResponse) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      tool_choice: "required",
      temperature: 0.9,
      tools: [
        {
          type: "function",
          function: {
            name: "search_internet",
            description:
              "A slow slow search the internet for information, you must call this by itself. You cannot speak and search at the same time, so first speak explaining the search you want to do, then do the search. The user cannot see the result of this search, so you must speak the result",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description:
                    "The query to search the internet for. It needs to be extremely specific, assume the search engine needs you to reference any locales, countries, or specifics about the user.",
                },
              },
              required: ["query"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "search_spotify",
            description:
              "A slow search on Spotify for songs, you must call this by itself. You cannot speak and search at the same time, so first speak explaining the search you want to do, then do the search. The user cannot see the result of this search, so you must speak the result",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description:
                    "The query to search Spotify for. It needs to be extremely specific, assume the search engine needs you to reference any artists, genres etc.",
                },
              },
              required: ["query"],
            },
          },
        },{
          type: "function",
          function: {
            name: "send_email",
            description:
              "A slow email send to the user's email address. Use it when you need to send an email to the user. Always explain why you're ",
            parameters: {
              type: "object",
              properties: {
                content: {
                  type: "string",
                  description:
                    "The HTML content of the email sent. Format it very nicely",
                },
              },
              required: ["query"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "play_spotify",
            description:
              "You can play any song, playlist, or album on Spotify. You MUST get the URI from search_spotify before you can play it. After playing a song, explain to the user why you selected that song and why you played it",
            parameters: {
              type: "object",
              properties: {
                uri: {
                  type: "string",
                  description:
                    "The URI of the song, playlist, or album to play on Spotify. You MUST get this from search_spotify for it to work.",
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
        search_spotify: searchSpotify,
        play_spotify: playSpotify,
        send_email: sendEmail
      }; // only one function in this example, but you can have multiple
      messages.push(responseMessage); // extend conversation with assistant's reply
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = {
          ...JSON.parse(toolCall.function.arguments),
          userId: userId
        };
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
