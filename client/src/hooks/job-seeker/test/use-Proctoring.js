import { useEffect } from "react";
import { toast } from "sonner";
import useAuthStore from "@/store/authStore";

// Notification getter helper functions
const getStoredNotifications = () => {
  try {
    const data = sessionStorage.getItem("proctoringNotifications");
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    toast.error("Error parsing notifications: " + e.message);
    return [];
  }
};

// Notification storage helper functions
const storeNotifications = (notifications) => {
  try {
    sessionStorage.setItem(
      "proctoringNotifications",
      JSON.stringify(notifications)
    );
    window.dispatchEvent(new Event("proctoringNotificationUpdate"));
  } catch (e) {
    toast.error("Error storing notifications: " + e.message);
  }
};

const addNotification = (message, messageType = "warning") => {
  const newNotification = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    message,
    messageType,
    timestamp: new Date().toISOString(),
    read: false,
  };
  const currentNotifications = getStoredNotifications();
  const updatedNotifications = [newNotification, ...currentNotifications].slice(
    0,
    50
  );
  storeNotifications(updatedNotifications);
  return newNotification;
};

export default function useProctoring(shouldShowInstructions) {
  const { user } = useAuthStore();

  useEffect(() => {
    if (shouldShowInstructions || !user?.image) return;

    let ws;
    let frameInterval;
    const video = document.createElement("video");
    video.setAttribute("autoplay", "");
    video.setAttribute("playsinline", "");
    video.style.display = "none";
    document.body.appendChild(video);

    const canvas = document.createElement("canvas");
    canvas.style.display = "none";
    document.body.appendChild(canvas);

    const handleWebSocketMessage = (msg) => {
      try {
        const res = JSON.parse(msg.data);
        if (res?.error) {
          toast.error(res.error);
          return;
        }

        // Remove phone_detected special branch
        const issues = Array.isArray(res?.issues) ? res.issues : [];
        issues.forEach((issue) => {
          const notification = addNotification(issue, "error"); // phone should be error
          toast.error(issue);
        });
      } catch (error) {
        toast.warning("Failed to process proctoring message");
      }
    };

    const setupProctoring = async () => {
      try {
        async function fetchImageAsBase64(url) {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        video.srcObject = stream;
        video.onloadedmetadata;

        ws = new WebSocket("ws://localhost:8000/api/v1/ws/proctor");
        let canSendFrames = false;

        ws.onopen = async () => {
          let refImg = await fetchImageAsBase64(user.image.data);
          ws.send(
            JSON.stringify({
              type: "init",
              referenceImage: refImg,
            })
          );
        };

        ws.onmessage = (msg) => {
          try {
            const res = JSON.parse(msg.data);

            // Only start sending frames if init succeeded
            if (
              res.type === "proctoring_result" &&
              res.success === true && // 👈 check success
              !canSendFrames
            ) {
              canSendFrames = true;
              frameInterval = setInterval(sendFrame, 1000);
            }

            handleWebSocketMessage(msg);
          } catch (error) {
            toast.warning("Failed to process proctoring message");
          }
        };

        ws.onerror = (error) => {
          toast.error("Proctoring connection error");
        };

        ws.onclose = (event) => {
          if (event.code !== 1000) {
            toast.warning("Connection lost. Reconnecting...");
            setTimeout(setupProctoring, 1000);
          }
        };

        const sendFrame = () => {
          if (
            !canSendFrames ||
            !video.videoWidth ||
            ws?.readyState !== WebSocket.OPEN
          ) {
            return;
          }
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (!blob || !canSendFrames) return;
              const reader = new FileReader();
              reader.onload = () => {
                ws.send(
                  JSON.stringify({
                    type: "frame",
                    image: reader.result,
                    timestamp: Date.now(),
                  })
                );
              };
              reader.readAsDataURL(blob);
            },
            "image/jpeg",
            0.8
          );
        };
      } catch (error) {
        if (error.name === "NotAllowedError") {
          toast.error("Camera access is required for proctoring");
        } else {
          toast.error("Failed to start proctoring: " + error.message);
        }
      }
    };

    setupProctoring();

    return () => {
      clearInterval(frameInterval);
      video.srcObject?.getTracks().forEach((track) => track.stop());
      video.remove();
      canvas.remove();
      if (ws?.readyState === WebSocket.OPEN) {
        ws.close(1000, "Component unmounted");
      }
    };
  }, [shouldShowInstructions, user?.id, user?.image]);
}
