// Updated roomConnection.js
"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { toast } from "sonner";
import { createWebRTCManager } from "./webrtc";

export default function useRoomConnection({
  roomId,
  userName,
  router,
  isMuted: initialMuted,
  cameraOn: initialCameraOn,
  role,
}) {
  const [participants, setParticipants] = useState([]);
  const [remoteStreamsMap, setRemoteStreamsMap] = useState({});
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // New: for UI
  const [monitorLogs, setMonitorLogs] = useState([]); // Now used for host

  // 🔑 keep a ref of participants to avoid stale closures
  const participantsRef = useRef([]);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const webrtcRef = useRef(null);
  const screenshotIntervalRef = useRef(null);
  const monitorVideoRef = useRef(null); // For cleanup
  const monitorCanvasRef = useRef(null);

  function updateMembers(members) {
    setParticipants(members);
    setUserCount(members.length);
  }

  function handleRemoteStream(socketId, stream) {
    setRemoteStreamsMap((prev) => ({ ...prev, [socketId]: stream }));
    setParticipants((prev) =>
      prev.map((p) =>
        p.socketId === socketId ? { ...p, status: "connected" } : p
      )
    );
  }

  // 🔹 Updated: Log monitor events for host UI (use prop role)
  function logMonitorEvent(eventData) {
    setMonitorLogs((prev) => [
      ...prev.slice(-50),
      { ...eventData, timestamp: new Date() },
    ]); // Keep last 50
  }

  useEffect(() => {
    if (!roomId || !userName || !role) return;
    let mounted = true;

    const backendSocketURL = process.env.NEXT_PUBLIC_SOCKET_URL + "/interview";
    socketRef.current = io(backendSocketURL, { withCredentials: true });
    const socket = socketRef.current;

    // In the main useEffect, update handleHostArrived:
    const handleHostArrived = ({ members, messages }) => {
      console.log("[DEBUG] Received host-arrived:", members.length, "members");

      // 🔹 FIX: Immediately hide waiting/loading on host arrival (before media)
      setPending(false);
      setLoading(false); // Move out – don't block on media

      // Sync members early
      updateMembers(members || []);

      if (!localStreamRef.current) {
        // 🔹 NEW: Toast for media feedback
        toast.info("Starting your camera and microphone...");

        // Delay media for early participants (non-blocking now)
        navigator.mediaDevices
          .getUserMedia({ video: initialCameraOn, audio: !initialMuted })
          .then((stream) => {
            if (!mounted) return;
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
            webrtcRef.current = createWebRTCManager({
              socket,
              roomId,
              localStream: stream,
              onRemoteStream: handleRemoteStream,
              onParticipantsList: updateMembers,
            });
            webrtcRef.current.attach();

            // Initiate offer to host
            const host = members.find((m) => m.isHost);
            if (host && webrtcRef.current) {
              setTimeout(
                () => webrtcRef.current.createOfferTo(host.socketId),
                100
              );
            }
          })
          .catch((err) => {
            console.error("[ERROR] Media access failed:", err);
            toast.error(
              "Could not access camera/mic – continuing without video/audio"
            );
            setConnectionStatus("connected"); // 🔹 FIX: Proceed even without media
          });
      }
    };
    socket.on("host-arrived", handleHostArrived);
    const handleUserConnecting = ({
      socketId,
      userName,
      isHost,
      isMuted,
      cameraOn,
    }) => {
      console.log("[DEBUG] Received user-connecting:", userName, socketId);

      setParticipants((prev) => {
        if (prev.find((p) => p.socketId === socketId)) return prev;
        return [
          ...prev,
          {
            socketId,
            userName,
            isHost,
            status: "connecting",
            isMuted: typeof isMuted === "boolean" ? isMuted : true, // Default muted for pending
            cameraOn: typeof cameraOn === "boolean" ? cameraOn : false, // No preview initially
          },
        ];
      });

      // Only offer if WebRTC ready
      if (webrtcRef.current && localStreamRef.current) {
        setTimeout(() => webrtcRef.current.createOfferTo(socketId), 100);
      }
    };
    socket.on("user-connecting", handleUserConnecting);

    const handleUserLeft = (data) => {
      const { socketId, userName: leavingName, isHost } = data || {};
      console.log("[DEBUG] Received user-left:", socketId, leavingName);
      const leavingUser =
        leavingName ||
        participantsRef.current.find((p) => p.socketId === socketId)
          ?.userName ||
        "Unknown";
      toast.info(`${leavingUser} ${isHost ? "(Host) " : ""}left the room`);

      setRemoteStreamsMap((prev) => {
        const copy = { ...prev };
        const stream = copy[socketId];
        if (stream) {
          stream.getTracks().forEach((track) => track.stop()); // Stop tracks to prevent ghosting
          delete copy[socketId];
        }
        return copy;
      });

      setParticipants((prev) => {
        const newList = prev.filter((p) => p.socketId !== socketId);
        console.log(
          "[DEBUG] Participants filtered: old",
          prev.length,
          "-> new",
          newList.length
        );
        return newList;
      });

      if (webrtcRef.current) {
        webrtcRef.current.closePeer(socketId);
      }
    };
    socket.on("user-left", handleUserLeft);

    // 🔹 NEW: Full sync after updates (leave, remove, etc.)
    const handleParticipantsUpdated = ({ members }) => {
      console.log(
        "[DEBUG] Received participants-updated:",
        members.length,
        "members"
      );
      updateMembers(members || []);
    };
    socket.on("participants-updated", handleParticipantsUpdated);

    socket.on("user-count", ({ count }) => {
      console.log("[DEBUG] Received user-count:", count);
      setUserCount(count);
    });

    const handleRoomClosed = () => {
      console.log("[DEBUG] Received room-closed");
      toast.error("Host ended the meeting");
      setConnectionStatus("error");
      router.replace("/interviews");
    };
    socket.on("room-closed", handleRoomClosed);

    socket.on("participant-update", ({ socketId, isMuted, cameraOn }) => {
      console.log("[DEBUG] Received participant-update:", socketId);
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === socketId
            ? {
                ...p,
                ...(typeof isMuted === "boolean" ? { isMuted } : {}),
                ...(typeof cameraOn === "boolean" ? { cameraOn } : {}),
              }
            : p
        )
      );
    });

    // 🔹 Monitoring listeners (host receives)
    // 🔹 UPDATED: Overlay result - Only log if detected=true
    socket.on("overlay-detection-result", (data) => {
      console.log("[DEBUG] Overlay result:", data);
      if (data.detected) {
        // 🔹 NEW: Conditional push
        logMonitorEvent({
          type: "overlay-detected",
          socketId: data.socketId,
          detected: data.detected,
          coords: data.coords, // For potential UI zoom/review
          processedScreenshotB64: data.processedScreenshotB64, // Optional: Could render in UI
          description: `AI overlay detected in screenshot (coords: ${
            data.coords ? JSON.stringify(data.coords) : "full"
          })`,
          time: new Date().toISOString(),
        });
        toast.warning(`Overlay detected for ${data.socketId}!`); // 🔹 NEW: Alert host
      } else {
        console.log("[DEBUG] No overlay in screenshot - skipping log"); // Silent for false negatives
      }
    });

    socket.on("overlay-detection-error", (data) => {
      console.log("[DEBUG] Overlay error:", data);
      logMonitorEvent({ type: "overlay-error", ...data });
      toast.error(`Overlay detection failed: ${data.error}`);
    });

    socket.on("monitor-event", (data) => {
      const payload = {
        socketId: data.socketId,
        event: data.event, // ← Keep full object { type: "tab-hidden", ... }
        time: new Date().toISOString(), // Or use data.time if reliable
        rawData: data, // ← Optional: Store everything for deep dives
      };
      console.log("[DEBUG] Monitor event:", data);
      logMonitorEvent(payload);
    });

    socket.on("monitoring-error", (data) => {
      console.log("[DEBUG] Monitoring error:", data);
      toast.error(data.error || "Monitoring failed");
    });

    socket.on("monitoring-updated", (data) => {
      console.log("[DEBUG] Monitoring updated:", data);
      toast.success(
        `Monitoring ${data.action === "start" ? "started" : "stopped"} for user`
      );
    });

    // === PARTICIPANT: enable-monitor ===
    socket.on("enable-monitor", ({ roomId: rid }) => {
      console.log("[DEBUG] Enable monitor requested");
      toast.info("Monitoring enabled - please keep this tab active");
      const sendEvent = (event) => {
        socket.emit("monitor-event", {
          roomId: rid,
          socketId: socket.id,
          event,
        });
      };

      // --- TAB SWITCH DETECTION ---
      const handleVisibility = () => {
        const eventType = document.hidden ? "tab-hidden" : "tab-visible";
        sendEvent({ type: eventType });
      };
      window.addEventListener("visibilitychange", handleVisibility);
      handleVisibility();

      // ✅ CAMERA SCREENSHOT SYSTEM
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      video.setAttribute("autoplay", "");
      video.setAttribute("playsinline", "");
      video.style.display = "none";
      canvas.style.display = "none";
      document.body.appendChild(video);
      document.body.appendChild(canvas);
      monitorVideoRef.current = video;
      monitorCanvasRef.current = canvas;

      // Attach stream if available
      if (localStreamRef.current) {
        video.srcObject = localStreamRef.current;
        video.onloadedmetadata = () => video.play();
      }

      const captureScreenshot = () => {
        if (!video.videoWidth || !localStreamRef.current) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

        sendEvent({
          type: "screenshot",
          data: base64,
          timestamp: Date.now(),
        });
      };

      // Initial screenshot
      setTimeout(captureScreenshot, 500);

      // Every 5 seconds
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current);
      }
      screenshotIntervalRef.current = setInterval(captureScreenshot, 5000);

      // Ack
      socket.emit("monitor-enabled", { roomId: rid, socketId: socket.id });

      // --- DISABLE MONITOR ---
      const handleDisableMonitor = () => {
        console.log("[DEBUG] Disable monitor");
        toast.info("Monitoring disabled");
        window.removeEventListener("visibilitychange", handleVisibility);
        if (screenshotIntervalRef.current) {
          clearInterval(screenshotIntervalRef.current);
          screenshotIntervalRef.current = null;
        }
        if (video.parentNode) video.remove();
        if (canvas.parentNode) canvas.remove();
        monitorVideoRef.current = null;
        monitorCanvasRef.current = null;
      };
      socket.once("disable-monitor", handleDisableMonitor);
    });

    // Wait for socket connection (now only for emits)
    const waitForSocketConnect = new Promise((res) => {
      if (socket.connected) res();
      else socket.once("connect", res);
    });

    waitForSocketConnect.then(() => {
      setConnectionStatus("connected");

      // 🔹 UPDATED: Use prop role consistently (no sessionStorage)
      const sessionRole = sessionStorage.getItem("role");
      const isHost = sessionRole === "host";
      const mediaOptions = { video: initialCameraOn, audio: !initialMuted };

      if (isHost) {
        // Host: Media first, then create
        navigator.mediaDevices
          .getUserMedia(mediaOptions)
          .then((stream) => {
            if (!mounted) return;
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }

            socket.emit(
              "create-room",
              {
                roomId,
                userName,
                isHost: true,
                isMuted: initialMuted,
                cameraOn: initialCameraOn,
              },
              (res) => {
                console.log("[DEBUG] Host create-room res:", res);
                if (res?.error) {
                  toast.error(res.error);
                  setLoading(false);
                  setConnectionStatus("error");
                  return;
                }
                if (res.pending) {
                  setPending(true); // Rare for host
                }
                updateMembers(res.members || []);
                setLoading(false);

                // WebRTC
                webrtcRef.current = createWebRTCManager({
                  socket,
                  roomId,
                  localStream: stream,
                  onRemoteStream: handleRemoteStream,
                  onParticipantsList: updateMembers,
                });
                webrtcRef.current.attach();
              }
            );
          })
          .catch((err) => {
            console.error("[ERROR] Host media failed:", err);
            toast.error("Could not access camera/mic");
            setLoading(false);
            setConnectionStatus("error");
          });
      } else {
        // Participant: Emit first, then media if ready
        socket.emit(
          "create-room",
          {
            roomId,
            userName,
            isHost: false,
            isMuted: initialMuted,
            cameraOn: initialCameraOn,
          },
          (res) => {
            console.log("[DEBUG] Participant create-room res:", res);
            if (res?.error) {
              toast.error(res.error);
              setLoading(false);
              setConnectionStatus("error");
              return;
            }
            if (res.pending) {
              setPending(true);
              setLoading(false);
              setConnectionStatus("pending");
              // Default no media/preview
              return;
            }
            // Not pending: Request media
            navigator.mediaDevices
              .getUserMedia(mediaOptions)
              .then((stream) => {
                if (!mounted) return;
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                  localVideoRef.current.srcObject = stream;
                }
                updateMembers(res.members || []);
                setLoading(false);
                setConnectionStatus("connected");

                // WebRTC (peers will initiate offers via user-connecting)
                webrtcRef.current = createWebRTCManager({
                  socket,
                  roomId,
                  localStream: stream,
                  onRemoteStream: handleRemoteStream,
                  onParticipantsList: updateMembers,
                });
                webrtcRef.current.attach();
              })
              .catch((err) => {
                console.error("[ERROR] Participant media failed:", err);
                toast.error("Could not access camera/mic");
                setLoading(false);
                setConnectionStatus("error");
              });
          }
        );
      }
    });

    return () => {
      mounted = false;
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current);
        screenshotIntervalRef.current = null;
      }
      if (monitorVideoRef.current?.parentNode) monitorVideoRef.current.remove();
      if (monitorCanvasRef.current?.parentNode)
        monitorCanvasRef.current.remove();
      try {
        if (socketRef.current) {
          socketRef.current.emit("leave-room", { roomId });
          // 🔹 UPDATED: Precise off() for attached handlers
          socketRef.current.off("host-arrived", handleHostArrived);
          socketRef.current.off("user-connecting", handleUserConnecting);
          socketRef.current.off("user-left", handleUserLeft);
          socketRef.current.off(
            "participants-updated",
            handleParticipantsUpdated
          );
          socketRef.current.off("user-count");
          socketRef.current.off("room-closed", handleRoomClosed);
          socketRef.current.off("participant-update");
          socketRef.current.off("overlay-detection-result");
          socketRef.current.off("overlay-detection-error");
          socketRef.current.off("monitor-event");
          socketRef.current.off("monitoring-error");
          socketRef.current.off("monitoring-updated");
          socketRef.current.off("enable-monitor");
          socketRef.current.off("disable-monitor");
          socketRef.current.disconnect();
        }
        webrtcRef.current?.destroy();
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
          localStreamRef.current = null;
        }
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    };
  }, [roomId, userName, router, role]); // Removed isMuted, cameraOn from deps

  useEffect(() => {
    console.log("Pending state updated to:", pending);
  }, [pending]);

  return {
    participants,
    remoteStreamsMap,
    userCount,
    loading,
    pending,
    connectionStatus, // New: for UI (e.g., disable toggles if 'pending')
    localVideoRef,
    localStreamRef,
    socketRef,
    webrtcRef,
    monitorLogs,
    setMonitorLogs,
    clearMonitorLogs: () => setMonitorLogs([]),
  };
}
