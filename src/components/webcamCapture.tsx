import React, { useRef, useState, useEffect } from "react";
import styles from "./webcamCapture.module.css"; // Import the CSS file
import { Flex } from "@radix-ui/themes";

const WebcamCapture = ({ onCapture, onRef }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    onRef({
      captureImage: () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) {
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");

        if (!context) {
          console.error("Error getting canvas context");
          return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/png");
        onCapture(dataUrl);
        console.log("Captured", dataUrl);

        // Trigger the flash animation
        setFlash(true);
        setTimeout(() => setFlash(false), 500); // Adjust timing to match CSS animation duration
      },
    });
  }, [onCapture, onRef]);

  useEffect(() => {
    const startStreaming = async () => {
      if (!videoRef.current) {
        return;
      }
      var config = { video: { width: 1280/*320-640-1280*/ } };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(config);
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      } catch (err) {
        console.error("Error accessing webcam: ", err);
      }
    };

    startStreaming();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <Flex direction={"column"} height={"30rem"} width={"100%"}>
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
        }}
      >
        <video
          ref={videoRef}
          className={flash ? styles.flash : ""}
          style={{
            display: isStreaming ? "block" : "none",
            width: "100%",
            height: "100%",
          }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </Flex>
  );
};

export default WebcamCapture;