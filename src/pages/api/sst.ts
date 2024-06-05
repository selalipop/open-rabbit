import type { NextApiRequest, NextApiResponse } from "next";

import { createClient } from "@deepgram/sdk";
import fs from "fs";
type Data =
  | {
      transcription: string;
    }
  | {
      error: string;
    };

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const base64Audio = req.body.audio;

  // Convert base64 encoded string to a buffer
  const audioBuffer = Buffer.from(base64Audio, "base64");

  // STEP 2: Call the transcribeFile method with the audio payload and options
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    // audio buffer
    audioBuffer,
    // STEP 3: Configure Deepgram options for audio analysis
    {
      model: "nova-2",
      smart_format: true,
    }
  );

  if (error) {
    console.error("Error transcribing audio:", error);
    res.status(500).json({
      error: JSON.stringify(error.message),
    });
  } else {
    console.log("Transcription result:", result);
  }
  console.log("completed");
  const transcript = result?.results.channels[0].alternatives[0].transcript;
  if (!transcript) {
    res.status(500).json({
      error: "No transcript found",
    });
  }
  res.status(200).json({
    transcription: transcript!,
  });
}
