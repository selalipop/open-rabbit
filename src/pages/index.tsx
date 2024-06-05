import Image from "next/image";
import { Inter } from "next/font/google";
import { useEffect, useState } from "react";
import { useMicVAD, utils } from "@ricky0123/vad-react";
import { useRef } from "react";
const inter = Inter({ subsets: ["latin"] });
import { useAsyncEffect } from "use-async-effect";
import { playTextToSpeech } from "../frontendUtil/tts";
import WebcamCapture from "../components/webcamCapture";
import { Button, Link } from "@radix-ui/themes";
import React from "react";

function DeviceIcon({
  onClick: onCaptureClicked,
  imageSrc,
}: {
  onClick: () => void;
  imageSrc: string;
}) {
  return (
    <div className="w-8 h-8 md:w-12 md:h-12 p-1 bg-purple-700 rounded-lg shadow-inner-lifted active:shadow-inner-depressed transition-shadow duration-200">
      <img
        className="cursor-pointer object-contain w-full h-full"
        src={imageSrc}
        onClick={onCaptureClicked}
      ></img>
    </div>
  );
}

const OrangeDevice = ({
  screenContent,
  onCaptureClicked,
}: {
  screenContent: React.ReactNode;
  onCaptureClicked: () => void;
}) => {
  return (
    <div className="aspect-square relative w-full h-full">
      <div className="w-full h-full min-h-32 min-w-32 max-h-96 max-w-96 justify-center align-middle">
        <div className="relative bg-purple-500 rounded-xl w-full h-full flex items-center justify-center shadow-dramatic">
          {/* Main Flex Container */}
          <div className="flex w-full h-full">
            {/* Screen */}
            <div className="bg-black rounded-lg m-4 flex-grow">
              {screenContent}
            </div>
            {/* Right Cutouts */}
            <div className="flex flex-col justify-start mt-4 mr-4 space-y-4">
              <DeviceIcon
                onClick={onCaptureClicked}
                imageSrc="/images/rabbit.png"
              />
              <div className="opacity-90">
                <DeviceIcon
                  onClick={() => {
                    window.location.href = "/api/spotify/login";
                  }}
                  imageSrc="/images/spotify.png"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [mostRecentAudio, setMostRecentAudio] =
    useState<HTMLAudioElement | null>(null);
  const [toolUse, setToolUse] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [mostRecentUtterance, setMostRecentUtterance] = useState<string>("");
  const [mostRecentResponse, setMostRecentResponse] = useState<string>("");

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
      const arrayBuffer = utils.encodeWAV(audio);
      const base64 = utils.arrayBufferToBase64(arrayBuffer);

      let text = "";
      const transcription = await fetch("/api/sst", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audio: base64 }),
      });
      const result = await transcription.json();
      text = result.transcription;
      if (!image || !text) {
        return;
      }
      console.log("Transcript", text);
      setToolUse([]);
      setMostRecentUtterance(text);
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
            console.log(result.toolUse);
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
    console.log(toolUse);
  }, [toolUse]);

  useEffect(() => {
    micVad.pause();
  }, [mostRecentUtterance]);
  const webcamRef = useRef<{ captureImage: () => void } | null>(null);
  return (
    <div
      className="flex flex-row flex-shrink w-full"
      // style={{ overflowY: "hidden" }}
    >
      <div className="flex-1 p-10">
        <OrangeDevice
          onCaptureClicked={() => webcamRef.current?.captureImage()}
          screenContent={
            <div
              style={{ width: "100%", height: "100%", position: "relative" }}
            >
              <WebcamCapture
                onCapture={handleCapture}
                onRef={(ref) => (webcamRef.current = ref)}
              />
              <img
                src={image ?? undefined}
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  objectFit: "contain",
                  width: "100%",
                  height: "100%",
                  display: image ? "block" : "none",
                }}
              />
            </div>
          }
        />
      </div>
      {/* <div className="flex flex-col">
        <div className="flex flex-col">Utterance: {mostRecentUtterance}</div>
        <div className="flex flex-col">
          Errored: {JSON.stringify(micVad.errored)}
        </div>
        <div className="flex flex-col">Response: {mostRecentResponse}</div>
      </div> */}
      {/* <div className="flex flex-col  ml-sm space-y-4 "> */}
      <div className="flex flex-col space-y-4 flex-1">
        <div className="flex flex-col">
          {mostRecentUtterance !== "" ? (
            <>
              <span className="mb-2">Utterance:</span>
              <div style={{}} className="bg-gray-200 rounded-md p-2">
                {mostRecentUtterance}
              </div>
            </>
          ) : (
            <span className="mb-2">
              Hey there, I'm Open Rabbit! <br />
              <br /> Click the Rabbit and give me a try...
            </span>
          )}
        </div>
        {mostRecentResponse !== "" && (
          <div className="flex flex-col">
            <span className="mb-2">Response:</span>
            <div className="bg-gray-200 rounded-md p-2">
              {mostRecentResponse}
            </div>
          </div>
        )}
        {toolUse?.length > 0 && (
          <>
            <h3>Agent Actions:</h3>
            {toolUse?.map((_t, i) => {
              return <h4 key={i}>{_t}</h4>;
            })}
          </>
        )}
      </div>
    </div>
  );
}
