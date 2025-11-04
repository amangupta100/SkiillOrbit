// roomConnection.js
"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { toast } from "sonner";
import { createWebRTCManager } from "./webrtc";

export default function useRoomConnection({
  roomId,
  userName,
  router,
  isMuted,
  cameraOn,
}) {
  const [participants, setParticipants] = useState([]);
  const [remoteStreamsMap, setRemoteStreamsMap] = useState({});
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [monitorLogs, setMonitorLogs] = useState([]);

  // 🔑 keep a ref of participants to avoid stale closures
  const participantsRef = useRef([]);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const webrtcRef = useRef(null);

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

  useEffect(() => {
    if (!roomId || !userName) return;
    let mounted = true;

    const backendSocketURL = process.env.NEXT_PUBLIC_SOCKET_URL + "/interview";
    socketRef.current = io(backendSocketURL, { withCredentials: true });

    // Wait for socket connection
    const waitForSocketConnect = new Promise((res) => {
      if (socketRef.current.connected) res();
      else socketRef.current.once("connect", res);
    });

    waitForSocketConnect.then(() => {
      const socket = socketRef.current;
      if (!socket) return;

      // === PARTICIPANT: enable-monitor ===
      socket.on("enable-monitor", ({ roomId: rid }) => {
        console.log("✅ enable-monitor received (participant). roomId:", rid);

        const sendEvent = (event) => {
          console.log("emitting monitor-event:", event, "for", socket.id);
          socket.emit("monitor-event", {
            roomId: rid,
            socketId: socket.id,
            event,
          });
        };

        // emit on both hidden and visible for better tracking
        const handleVisibility = () => {
          const eventType = document.hidden ? "tab-hidden" : "tab-visible";
          sendEvent(eventType);
        };

        // attach listener
        window.addEventListener("visibilitychange", handleVisibility);

        // initial state check
        handleVisibility();

        // ack back (optional, server doesn't use it currently)
        socket.emit("monitor-enabled", { roomId: rid, socketId: socket.id });

        // disable hook
        socket.once("disable-monitor", () => {
          window.removeEventListener("visibilitychange", handleVisibility);
          console.log("❌ Monitoring stopped for me (participant)");
        });
      });

      // === After handlers are ready, request camera/mic ===
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (!mounted) return;
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          // create-room
          socket.emit("create-room", { roomId, userName }, (res) => {
            if (res?.error) {
              toast.error(res.error);
              setLoading(false);
              return;
            }
            updateMembers(res.members || []);

            // join-room
            socket.emit(
              "join-room",
              { roomId, userName, isMuted, cameraOn },
              (resp) => {
                if (resp?.error) {
                  toast.error(resp.error);
                  setLoading(false);
                  return;
                }
                updateMembers(resp.members || []);
                setLoading(false);
              }
            );
          });

          // WebRTC manager
          webrtcRef.current = createWebRTCManager({
            socket,
            roomId,
            localStream: localStreamRef.current,
            onRemoteStream: handleRemoteStream,
            onParticipantsList: updateMembers,
          });
          webrtcRef.current.attach();

          // other socket listeners
          socket.on(
            "user-joined",
            ({ socketId, userName, isMuted, cameraOn }) => {
              setParticipants((prev) => {
                if (prev.find((p) => p.socketId === socketId)) return prev;
                return [
                  ...prev,
                  {
                    socketId,
                    userName,
                    isHost: false,
                    isMuted: typeof isMuted === "boolean" ? isMuted : false,
                    cameraOn: typeof cameraOn === "boolean" ? cameraOn : true,
                  },
                ];
              });
            }
          );

          socket.on("user-left", ({ socketId }) => {
            setRemoteStreamsMap((prev) => {
              const copy = { ...prev };
              delete copy[socketId];
              return copy;
            });

            setParticipants((prev) =>
              prev.filter((p) => p.socketId !== socketId)
            );

            if (webrtcRef.current) {
              webrtcRef.current.closePeer(socketId);
            }
          });

          socket.on("user-connecting", ({ socketId, userName }) => {
            setParticipants((prev) => {
              if (prev.find((p) => p.socketId === socketId)) return prev;
              return [
                ...prev,
                {
                  socketId,
                  userName,
                  isHost: false,
                  status: "connecting",
                  isMuted: false,
                  cameraOn: true,
                },
              ];
            });

            setTimeout(() => {
              webrtcRef.current && webrtcRef.current.createOfferTo(socketId);
            }, 100);
          });

          socket.on("user-count", ({ count }) => {
            setUserCount(count);
          });

          socket.on("room-closed", () => {
            toast.error("Host ended the meeting");
            try {
              webrtcRef.current?.destroy();
              socket.disconnect();
            } catch (e) {}
            router.replace("/interviews");
          });

          socket.on("participant-update", ({ socketId, isMuted, cameraOn }) => {
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
        })
        .catch((err) => {
          toast.error("Could not access camera/mic");
          console.error(err);
          setLoading(false);
        });
    });

    return () => {
      mounted = false;
      try {
        if (socketRef.current) {
          socketRef.current.emit("leave-room", { roomId });
          socketRef.current.off(); // remove all listeners
          socketRef.current.disconnect();
        }
        webrtcRef.current?.destroy();
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
          localStreamRef.current = null;
        }
      } catch (e) {
        console.warn(e);
      }
    };
  }, [roomId, userName, router]);

  return {
    participants,
    remoteStreamsMap,
    userCount,
    loading,
    localVideoRef,
    localStreamRef,
    socketRef,
    webrtcRef,
    monitorLogs,
    setMonitorLogs,
    clearMonitorLogs: () => setMonitorLogs([]),
  };
}
