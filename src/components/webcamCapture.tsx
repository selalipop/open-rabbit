import React, { useRef, useState, useEffect } from "react";

const WebcamCapture = ({
  onCapture,
}: {
  onCapture: (dataUrl: string) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const startStreaming = async () => {
      if (!videoRef.current) {
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
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

  const handleCapture = () => {
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
  };

  return (
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
        style={{
          display: isStreaming ? "block" : "none",
          width: "100%",
          height: "100%",
        }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <button onClick={handleCapture}>Capture</button>
    </div>
  );
};

export default WebcamCapture;
