"use client";
import { useEffect, useState, useRef } from "react";

export const useFaceDetection = (videoRef) => {
  const [faceAlignment, setFaceAlignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let faceMesh;
    let camera;
    let isMounted = true;

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initFaceDetection = async () => {
      try {
        // Preload WASM
        const wasmResponse = await fetch(
          "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh_solution_simd_wasm_bin.wasm"
        );
        const wasmBuffer = await wasmResponse.arrayBuffer();

        // Load scripts
        await Promise.all([
          loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js"
          ),
          loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js"
          ),
        ]);

        if (!isMounted) return;

        // Initialize FaceMesh
        faceMesh = new window.FaceMesh({
          locateFile: (file) => {
            if (file === "face_mesh_solution_simd_wasm_bin.wasm") {
              return URL.createObjectURL(new Blob([wasmBuffer]));
            }
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`;
          },
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.8,
          minTrackingConfidence: 0.8,
        });

        faceMesh.onResults((results) => {
          if (!isMounted || !results.multiFaceLandmarks?.[0]) {
            setFaceAlignment(null);
            return;
          }

          const landmarks = results.multiFaceLandmarks[0];

          const leftEye = landmarks[33];
          const rightEye = landmarks[263];
          const noseTip = landmarks[1];
          const chin = landmarks[152];
          const leftMouth = landmarks[61];
          const rightMouth = landmarks[291];

          const isFullyVisible = [
            leftEye,
            rightEye,
            noseTip,
            chin,
            leftMouth,
            rightMouth,
          ].every((p) => p.x > 0.1 && p.x < 0.9 && p.y > 0.1 && p.y < 0.9);

          setFaceAlignment({
            isAligned: isFullyVisible,
            confidence: 1.0,
            landmarks: {
              leftEye,
              rightEye,
              noseTip,
              chin,
            },
          });
        });

        // Initialize camera
        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (isMounted) await faceMesh.send({ image: videoRef.current });
          },
          width: 640,
          height: 480,
          facingMode: "user",
        });

        await camera.start();
        setIsLoading(false);
      } catch (err) {
        console.error("Face detection error:", err);
        setError("Please allow camera access and refresh the page.");
        setIsLoading(false);
      }
    };

    initFaceDetection();

    return () => {
      isMounted = false;
      if (faceMesh?.close) faceMesh.close();
      if (camera?.stop) camera.stop();
      document
        .querySelectorAll('script[src*="mediapipe"]')
        .forEach((el) => el.remove());
    };
  }, [videoRef]);

  return { faceAlignment, isLoading, error };
};
