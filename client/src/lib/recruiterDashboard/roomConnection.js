"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { toast } from "sonner";
import { createWebRTCManager } from "./webrtc";

export default function useRoomConnection({
  roomId,
  userName,
  role,
  router,
  isMuted,
  cameraOn,
}) {
  const [participants, setParticipants] = useState([]);
  const [remoteStreamsMap, setRemoteStreamsMap] = useState({});
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(async (stream) => {
        if (!mounted) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const backendSocketURL =
          process.env.NEXT_PUBLIC_SOCKET_URL + "/interview";

        socketRef.current = io(backendSocketURL, {
          withCredentials: true,
        });

        await new Promise((res) => {
          if (socketRef.current.connected) res();
          else socketRef.current.once("connect", res);
        });

        // create-room
        socketRef.current.emit("create-room", { roomId, userName }, (res) => {
          if (res?.error) {
            toast.error(res.error);
            setLoading(false);
            return;
          }
          updateMembers(res.members || []);

          // join-room
          socketRef.current.emit(
            "join-room",
            {
              roomId,
              userName,
              isMuted, // yeh add kar
              cameraOn, // yeh add kar
            },
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
          socket: socketRef.current,
          roomId,
          localStream: localStreamRef.current,
          onRemoteStream: (socketId, stream) => {
            handleRemoteStream(socketId, stream);
          },
          onParticipantsList: (members) => {
            updateMembers(members);
          },
        });
        webrtcRef.current.attach();

        // socket listeners
        socketRef.current.on(
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

        socketRef.current.on("user-left", ({ socketId }) => {
          // 1. Remote stream cleanup
          setRemoteStreamsMap((prev) => {
            const copy = { ...prev };
            delete copy[socketId];
            return copy;
          });

          // 2. Participants list update
          setParticipants((prev) =>
            prev.filter((p) => p.socketId !== socketId)
          );

          // 3. Close WebRTC peer connection
          if (webrtcRef.current) {
            webrtcRef.current.closePeer(socketId);
          }
        });

        socketRef.current.on("user-connecting", ({ socketId, userName }) => {
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

        socketRef.current.on("user-count", ({ count }) => {
          setUserCount(count);
        });

        socketRef.current.on("room-closed", () => {
          toast.error("Host ended the meeting");
          try {
            webrtcRef.current && webrtcRef.current.destroy(); // ✅ closes all peers
            socketRef.current && socketRef.current.disconnect();
          } catch (e) {}
          router.replace("/interviews");
        });

        // 🔹 listen for participant state updates
        socketRef.current.on(
          "participant-update",
          ({ socketId, isMuted, cameraOn }) => {
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
          }
        );
      })
      .catch((err) => {
        toast.error("Could not access camera/mic");
        console.error(err);
        setLoading(false);
      });

    return () => {
      mounted = false;
      try {
        socketRef.current && socketRef.current.emit("leave-room", { roomId });
        webrtcRef.current && webrtcRef.current.destroy();
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
          localStreamRef.current = null;
        }
        socketRef.current && socketRef.current.disconnect();
      } catch (e) {
        console.warn(e);
      }
    };
  }, [roomId, userName, role, router]);

  return {
    participants,
    remoteStreamsMap,
    userCount,
    loading,
    localVideoRef,
    localStreamRef,
    socketRef,
    webrtcRef, // 🔹 add this
  };
}
