import Image from "next/image";
import { Inter } from "next/font/google";
import { useEffect, useState } from "react";
import { useMicVAD, utils } from "@ricky0123/vad-react";
import { useRef } from "react";
import {
  initialize,
  SessionManager,
  DecodingOptionsBuilder,
  Segment,
  AvailableModels,
  Task,
  InferenceSession,
} from "whisper-turbo";
const inter = Inter({ subsets: ["latin"] });
import { useAsyncEffect } from "use-async-effect";
import { playTextToSpeech } from "../frontendUtil/tts";
import WebcamCapture from "../components/webcamCapture";
import { Button } from "@radix-ui/themes";

export default function Home() {
  const [mostRecentAudio, setMostRecentAudio] =
    useState<HTMLAudioElement | null>(null);
  const [toolUse, setToolUse] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [session, setSession] = useState<InferenceSession | null>(null);
  const [mostRecentUtterance, setMostRecentUtterance] = useState<string>("");
  const [mostRecentResponse, setMostRecentResponse] = useState<string>("");

  useAsyncEffect(async () => {
    await initialize();
    const session = await new SessionManager().loadModel(
      AvailableModels.WHISPER_BASE,
      () => {
        console.log("Model loaded successfully");
      },
      (p: number) => {
        console.log(`Loading: ${p}%`);
      }
    );
    if (!session.isOk) {
      console.error("Failed to load model", session.error);
      return;
    }
    setSession(session.value);
  }, []);

  const micVad = useMicVAD({
    positiveSpeechThreshold: 0.9,
    negativeSpeechThreshold: 0.5,
    onSpeechStart() {
      console.log("Speech started");
      if (mostRecentAudio) {
        mostRecentAudio.pause();
      }
    },
    onSpeechEnd: async (audio) => {
      console.log("Speech ended");
      micVad.pause();
      if (!session) {
        return;
      }
      const arrayBuffer = utils.encodeWAV(audio);
      const base64 = utils.arrayBufferToBase64(arrayBuffer);
      const url = `data:audio/wav;base64,${base64}`;

      let options = new DecodingOptionsBuilder()
        .setTask(Task.Transcribe)
        .setPrompt("Selali")
        .setTemperature(0)
        .build();

      let text = "";
      await session.transcribe(
        new Uint8Array(arrayBuffer),
        true,
        options,
        (segment: Segment) => {
          text += segment.text;
        }
      );
      console.log("Transcript", text);
      setToolUse([]);
      setMostRecentUtterance(text);
      if (!image) {
        return;
      }
      const response = await fetch("/api/openAi/imageAnswer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: image, prompt: text }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const newPart = decoder.decode(value, { stream: true });
        buffer += newPart;

        let startIndex = 0;
        let endIndex;

        while ((endIndex = buffer.indexOf("}", startIndex)) !== -1) {
          const jsonString = buffer.slice(startIndex, endIndex + 1);
          startIndex = endIndex + 1;

          try {
            const result = JSON.parse(jsonString);

            if (result.text) {
              setMostRecentResponse(result.text);
              await playTextToSpeech(
                result.text,
                "weight_0wy66r5adw60xcgw7xj6t21ma"
              );
            }
            if (result.audio) {
              if (mostRecentAudio) {
                mostRecentAudio.pause();
              }
              const audio = new Audio(result.audio);
              audio.play();
              setMostRecentAudio(audio);
            }
            if (result.toolUse) {
              setToolUse((prev) => [...prev, result.toolUse]);
            }
          } catch (error) {
            // Incomplete JSON object, continue reading
          }
        }

        // Store any remaining incomplete JSON in the buffer
        buffer = buffer.slice(startIndex);
      }
      setImage(null);
    },
  });

  const handleCapture = (dataUrl: string) => {
    setImage(dataUrl);
    micVad.start();
  };

  useEffect(() => {
    micVad.pause();
  }, [mostRecentUtterance]);
  const webcamRef = useRef<{ captureImage: () => void } | null>(null);
  return (
    <div>
      <div style={{ width: "100%", height: "40rem", position: "relative" }}>
        <WebcamCapture
          onCapture={handleCapture}
          onRef={(ref) => (webcamRef.current = ref)}
        />
        <img
          src={image}
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            objectFit: "contain",
            width: "100%",
            height: "100%",
          }}
        />
      </div>
      <Button onClick={() => webcamRef.current?.captureImage()}>Capture</Button>

      <div>Utterance: {mostRecentUtterance}</div>
      <div>Is User Speaking: {micVad.userSpeaking}</div>
      <div>Is Listening: {micVad.listening}</div>
      <div>Errored: {JSON.stringify(micVad.errored)}</div>
      <div>Loading: {micVad.loading}</div>
      <div>Response: {mostRecentResponse}</div>
      <div>Tool Use: {JSON.stringify(toolUse)}</div>
    </div>
  );
}
