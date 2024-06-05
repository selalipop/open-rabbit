

import type { NextApiRequest, NextApiResponse } from "next";

import { createClient } from "@deepgram/sdk";
import fs from "fs";
type Data = {
  audio: string;
} | {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const text = req.body.text;
  const audioBuffer = await getAudio(text);
  const base64Audio = audioBuffer?.toString('base64');
  if (!base64Audio) {
    console.log("failed")
    res.status(500).json({ error: "Failed to generate audio" });
    return;
  }
  console.log("completed")
  res.status(200).json({ audio: base64Audio });
}


// STEP 1: Create a Deepgram client with your API key
const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);


const getAudio = async (text: string) => {
  // STEP 2: Make a request and configure the request with options (such as model choice, audio configuration, etc.)
  const response = await deepgram.speak.request(
    { text },
    {
      model: "aura-zeus-en",
      encoding: "linear16",
      container: "wav",
    }
  );
  // STEP 3: Get the audio stream and headers from the response
  const stream = await response.getStream();
  const headers = await response.getHeaders();
  
  if (stream) {
    // STEP 4: Convert the stream to an audio buffer
    const buffer = await getAudioBuffer(stream);
    return buffer
  } else {
    console.error("Error generating audio:", stream);
  }
};

// helper function to convert stream to audio buffer
const getAudioBuffer = async (response) => {
  const reader = response.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
  }

  const dataArray = chunks.reduce(
    (acc, chunk) => Uint8Array.from([...acc, ...chunk]),
    new Uint8Array(0)
  );

  return Buffer.from(dataArray.buffer);
};

