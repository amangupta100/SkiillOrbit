"use client";
import React, { useRef, useEffect, useState } from "react";
import FaceOverlay from "@/components/userDashboard/FaceOverlay";
import API2 from "@/utils/interceptor2";
import useAuthStore from "@/store/authStore";
import { toast } from "sonner";
import API from "@/utils/interceptor";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyD9zE89oUuo-UBw4CPu4rLtZSQTx7bpDbE");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export default function FaceCapture() {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [faceAlignment, setFaceAlignment] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { user } = useAuthStore();
  const [testData, setTestData] = useState(null);
  const [loadSts, setLoadSts] = useState("Verifying");

  useEffect(() => {
    let faceMesh;
    let camera;
    let isMounted = true;

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

        // Initialize face mesh
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

          // Key points (using more stable landmarks)
          const leftEye = landmarks[33]; // Left eye outer corner
          const rightEye = landmarks[263]; // Right eye outer corner
          const noseTip = landmarks[1]; // More stable nose tip
          const chin = landmarks[152]; // Chin center
          const leftMouth = landmarks[61]; // Mouth left corner
          const rightMouth = landmarks[291]; // Mouth right corner

          // 1. Face containment check (more tolerant bounds)
          const isFullyVisible = [
            leftEye,
            rightEye,
            noseTip,
            chin,
            leftMouth,
            rightMouth,
          ].every((p) => p.x > 0.1 && p.x < 0.9 && p.y > 0.1 && p.y < 0.9);

          // Combined alignment check
          const isAligned = isFullyVisible;

          setFaceAlignment({
            isAligned,
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
          facingMode: "user", // Ensures front camera
        });

        await camera.start();
        setIsLoading(false);
      } catch (err) {
        console.error("Face detection error:", err);
        setError("Please allow camera access and refresh the page");
        setIsLoading(false);
      }
    };

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
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
  }, []);

  const handleVerify = async () => {
    if (!faceAlignment?.isAligned || !videoRef.current) {
      console.warn("Face not aligned or video reference missing");
      return;
    }

    setIsVerifying(true);

    try {
      // Capture frame
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const frameData = canvas.toDataURL("image/jpeg");
      if (!user?.image) throw new Error("User image data is missing");

      // Step 1: Verify face
      const response = await API2.post("/verify-face", {
        captured_image: frameData, // captured frame
        user_image: user.image.data, // stored reference image
      });

      const { success: succ, message } = response.data;
      if (!succ) return toast.error(message);

      // If verified -> proceed
      setLoadSts("Generating Questions ...");

      // Step 2: Load test details
      let testDetails;
      try {
        const testResponse = await API.get("/job-seeker/tests/gettestDet");
        testDetails = testResponse?.data?.data || {};
      } catch {
        return toast.error("Failed to load test configuration");
      }

      const skills = Array.isArray(testDetails.skills)
        ? testDetails.skills
        : (() => {
            try {
              return JSON.parse(testDetails.skills || "[]");
            } catch {
              return [];
            }
          })();

      const questionCount = Number(testDetails.questionCount) || 0;
      if (questionCount <= 0) return toast.warning("Invalid question count");

      // Step 3: Prepare AI prompt
      const prompt = `
        Generate ${questionCount} debugging questions for skills: ${
        skills.length ? skills.join(", ") : "general programming"
      }.

        Each question must have:
        - skill
        - title
        - description
        - codeSnippet (50-80 lines, with multiple bugs)
        - difficulty (medium or hard)

        Return ONLY valid JSON:
        {
          "questions": [
            {
              "skill": "string",
              "title": "string",
              "description": "string",
              "codeSnippet": "string",
              "difficulty": "medium|hard"
            }
          ]
        }
      `;

      // Step 4: Call AI
      let quiz;
      try {
        const result = await model.generateContent(prompt);
        const text = result?.response?.text?.() || "";
        const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
        quiz = JSON.parse(cleaned);
      } catch {
        return toast.error("Failed to generate questions. Try again.");
      }

      if (!quiz?.questions?.length) {
        return toast.warning("No questions generated");
      }

      // Step 5: Save and redirect
      const questions = JSON.stringify(quiz.questions);
      sessionStorage.setItem("questions", questions);

      const saveRes = await API.post("/job-seeker/tests/genTest", {
        questions,
      });
      if (saveRes.data?.success) {
        toast.success("Verification Successful");
        window.location.href = "/userDashboard/test/testEnvironment/";
      } else {
        toast.warning(saveRes.data?.message || "Test save failed");
      }
    } catch (error) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsVerifying(false);
    }
  };

  const overlayOpacity = faceAlignment ? "opacity-100" : "opacity-50";

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex  items-center justify-center min-h-screen p-8 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Face Verification
        </h1>

        <div className="relative mb-6">
          <video
            ref={videoRef}
            className="w-full h-96 object-cover rounded-lg bg-black"
            autoPlay
            playsInline
            muted
          />

          <FaceOverlay
            isAligned={faceAlignment?.isAligned || false}
            opacity={overlayOpacity}
          />

          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Initializing camera...</p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 text-center">
          {faceAlignment ? (
            <div
              className={`text-lg font-semibold ${
                faceAlignment.isAligned ? "text-green-600" : "text-red-600"
              }`}
            >
              {faceAlignment.isAligned ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Face aligned perfectly
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Please align your face with the guide
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-600 text-lg">
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                No face detected
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 text-center text-gray-600">
          <p className="mb-2">
            Position your face to match the face-shaped guide
          </p>
          <p className="text-sm">
            Look straight at the camera and align your face with the guide
          </p>
          <p className="text-sm">
            The guide will turn green when properly aligned
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={handleVerify}
            disabled={!faceAlignment?.isAligned || isVerifying}
            className={`
              px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200
              ${
                faceAlignment?.isAligned && !isVerifying
                  ? "bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl"
                  : "bg-gray-400 cursor-not-allowed"
              }
            `}
          >
            {isVerifying ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {loadSts}
              </div>
            ) : (
              "Verify Face"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
