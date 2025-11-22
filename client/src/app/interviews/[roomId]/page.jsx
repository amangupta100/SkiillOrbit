// page.jsx
"use client";

import React, {
  use,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PhoneOff, Info, Copy, X, MicOff } from "lucide-react";
import { LuCopyCheck } from "react-icons/lu";
import NavigationGuard from "@/lib/common/NavigationGuard";
import { toast } from "sonner";
import { FaCrown } from "react-icons/fa";
import { IoInformation } from "react-icons/io5";
import { IoIosNotificationsOutline } from "react-icons/io";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
// 🔹 new imports
import ParticipantCard from "@/components/recruiterDashboard/Interview/session/ParticipantCard";
import ControlsBar from "@/components/recruiterDashboard/Interview/session/ControlsBar";
import useRoomConnection from "@/lib/recruiterDashboard/roomConnection";
import { IoMdClose } from "react-icons/io";
import Messages from "@/components/recruiterDashboard/Interview/session/Messages";

export default function Room({ params }) {
  const { roomId } = use(params);
  const router = useRouter();

  // user data
  const [userName, setUserName] = useState(null);
  const [role, setRole] = useState(null);

  // states
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [time, setTime] = useState(new Date());
  const [copy, setCopy] = useState(false);
  const [copyUrl, setCopyUrl] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participantSideBar, setPartSidebar] = useState(false);
  const [screenLoading, setScreenLoading] = useState(false);
  const [showMessSidebar, setshowMessSidebar] = useState(false);
  const [notif, setNotf] = useState(false);
  const [fullScreenId, setFullScreenId] = useState(null);
  // 🔹 NEW: Monitoring state (host only) - persists via server fetch
  const [monitoredParticipants, setMonitoredParticipants] = useState(new Set());

  // 🔹 REMOVED: screenshotInterval state (now in hook ref)

  // refs
  const audioRef = useRef(null);
  const displayStreamRef = useRef(null);

  // load user info
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const data = JSON.parse(sessionStorage.getItem("data") || "null");
    if (!data?.name || !data?.role) {
      toast.error("Unauthorized. Please log in.");
      return;
    }
    setUserName(data.name);
    setRole(data.role);
  }, []);

  // 🔹 use custom hook for connection (pass role)
  const {
    participants,
    remoteStreamsMap,
    userCount,
    loading,
    pending,
    localVideoRef,
    localStreamRef,
    socketRef,
    webrtcRef,
    monitorLogs,
    setMonitorLogs,
    clearMonitorLogs,
  } = useRoomConnection({ roomId, userName, router, isMuted, cameraOn, role });

  console.log(participants, userCount);

  // Play ping sound once at mid volume when entering the room (after loading and user info)
  useEffect(() => {
    if (!loading && !pending && userName && audioRef.current) {
      audioRef.current.volume = 0.3; // Mid volume
      audioRef.current.play().catch((err) => {
        console.error("Failed to play ping sound:", err);
      });
    }
  }, [loading, pending, userName]);

  // 🔹 NEW: Fetch current monitoring state on connect (host only)
  useEffect(() => {
    if (socketRef.current && role === "recruiter") {
      socketRef.current.emit("get-current-monitoring", { roomId });
    }
  }, [socketRef.current, role, roomId]);

  // 🔹 NEW: Listen for monitoring updates (host only)
  useEffect(() => {
    if (!socketRef.current || role !== "recruiter") return;

    const socket = socketRef.current;

    const handleMonitoringUpdated = ({ targetId, action }) => {
      setMonitoredParticipants((prev) => {
        const newSet = new Set(prev);
        if (action === "start") {
          newSet.add(targetId);
        } else {
          newSet.delete(targetId);
        }
        return newSet;
      });
    };

    const handleCurrentMonitoring = ({ monitoredIds }) => {
      setMonitoredParticipants(new Set(monitoredIds));
    };

    socket.on("monitoring-updated", handleMonitoringUpdated);
    socket.on("current-monitoring", handleCurrentMonitoring);

    return () => {
      socket.off("monitoring-updated", handleMonitoringUpdated);
      socket.off("current-monitoring", handleCurrentMonitoring);
    };
  }, [socketRef.current, role, roomId]);

  console.log(monitorLogs);

  // 🔹 UPDATED: Listen for monitoring updates and events (host-focused)
  useEffect(() => {
    if (!socketRef.current || !localStreamRef.current) return;

    let intervalId;
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");

    video.setAttribute("autoplay", "");
    video.setAttribute("playsinline", "");
    video.style.display = "none";
    canvas.style.display = "none";

    document.body.appendChild(video);
    document.body.appendChild(canvas);

    video.srcObject = localStreamRef.current;
    video.onloadedmetadata = () => video.play();

    const sendScreenshot = () => {
      const myId = socketRef.current?.id;
      const isBeingMonitored = monitoredParticipants.has(myId);
      if (!isBeingMonitored) return;

      if (!video.videoWidth) return;
      if (socketRef.current.readyState !== WebSocket.OPEN) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      const base64 = canvas.toDataURL("image/jpeg", 0.8);

      socketRef.current.emit("monitor-event", {
        roomId,
        socketId: myId,
        event: {
          type: "screenshot",
          data: base64,
        },
      });
    };

    // ✅ every 5 seconds
    intervalId = setInterval(sendScreenshot, 5000);

    // cleanup
    return () => {
      clearInterval(intervalId);
      video.remove();
      canvas.remove();
    };
  }, [
    socketRef.current,
    setMonitorLogs,
    localStreamRef.current,
    monitoredParticipants,
  ]);

  const handleCopy = async () => {
    try {
      setCopy(true);
      await navigator.clipboard.writeText(roomId);
      toast.success("Room Id copied to clipboard");
      setTimeout(() => setCopy(false), 1500);
    } catch (err) {
      toast.error(err?.message || "Copy failed");
    }
  };

  const handleCopyUrl = async () => {
    try {
      setCopyUrl(true);
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://skillsorbit.in";
      const fullUrl = `${baseUrl}/interviews/${roomId}`;
      await navigator.clipboard.writeText(fullUrl);

      setTimeout(() => setCopyUrl(false), 1500);
    } catch (err) {
      toast.error(err?.message || "Copy failed");
    }
  };

  const onFullScreen = useCallback((socketId) => {
    setFullScreenId(socketId);
  }, []);

  // 🔹 UPDATED: onMonitor - Emits ONCE per click (server toggles based on state)
  const onMonitor = useCallback(
    (socketId) => {
      if (role !== "recruiter") return; // Host only
      if (!socketRef.current) return;
      // Emit always - server checks current state and toggles accordingly
      socketRef.current.emit("start-monitor", {
        targetId: socketId,
        roomId,
      });
    },
    [role, roomId, socketRef]
  );

  const exitKioskMode = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error("Failed to exit fullscreen:", err);
      });
    }
  };

  const toggleScreenShare = async () => {
    if (!webrtcRef.current || !socketRef.current) return;

    if (!isScreenSharing) {
      try {
        setScreenLoading(true);
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        displayStreamRef.current = displayStream;

        const screenTrack = displayStream.getVideoTracks()[0];
        webrtcRef.current.replaceTrack(screenTrack);

        setIsScreenSharing(true);
        setScreenLoading(false);

        displayStream.getTracks().forEach((track) => {
          track.onended = () => {
            if (displayStreamRef.current) {
              displayStreamRef.current.getTracks().forEach((t) => t.stop());
              displayStreamRef.current = null;
            }
            webrtcRef.current.replaceTrack(
              localStreamRef.current.getVideoTracks()[0]
            );
            setIsScreenSharing(false);
          };
        });
      } catch (err) {
        console.error("Screen share error:", err);
        setScreenLoading(false);
      }
    } else {
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((track) => track.stop());
        displayStreamRef.current = null;
      }
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      webrtcRef.current.replaceTrack(camTrack);
      setIsScreenSharing(false);
    }
  };

  // 🔹 Render Video Cards Function - UPDATED: Pass isMonitoring
  const renderVideoCards = () => {
    const myId = socketRef.current?.id;

    return (participants || []).map((p) => {
      const isLocal = p.socketId === myId;

      const participantWithFlags = {
        ...p,
        cameraOn: isLocal
          ? cameraOn
          : typeof p.cameraOn === "boolean"
          ? p.cameraOn
          : true,
        isMuted: isLocal
          ? isMuted
          : typeof p.isMuted === "boolean"
          ? p.isMuted
          : false,
      };

      // Local screen sharing case
      if (isLocal && isScreenSharing) {
        return (
          <ParticipantCard
            key={p.socketId}
            participant={participantWithFlags}
            localStreamRef={localStreamRef}
            remoteStream={remoteStreamsMap[p.socketId]}
            localVideoRef={localVideoRef}
            isScreenSharing={true}
            screenLoading={screenLoading}
            onFullScreen={onFullScreen}
            socketRef={socketRef}
            socketId={socketRef.current?.id}
            onMonitor={onMonitor}
            isLocal={isLocal}
            roomId={roomId}
            isMonitoring={monitoredParticipants.has(p.socketId)}
          />
        );
      }

      // Normal case
      return (
        <ParticipantCard
          key={p.socketId}
          isLocal={isLocal}
          participant={participantWithFlags}
          localStreamRef={localStreamRef}
          remoteStream={remoteStreamsMap[p.socketId]}
          localVideoRef={localVideoRef}
          isHost={role === "recruiter"}
          onFullScreen={onFullScreen}
          socketRef={socketRef}
          onMonitor={onMonitor}
          socketId={socketRef.current?.id}
          roomId={roomId}
          isMonitoring={monitoredParticipants.has(p.socketId)}
        />
      );
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kiosk = params.get("kiosk") === "true";

    if (kiosk) {
      // Trigger fullscreen immediately after mount
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error("Failed to enter fullscreen:", err);
        });
      }
    }
  }, []);

  // 🔹 controls
  const toggleMute = () => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (localStreamRef.current) {
        localStreamRef.current
          .getAudioTracks()
          .forEach((t) => (t.enabled = !newMuted));
      }
      if (socketRef.current?.emit) {
        socketRef.current.emit("participant-update", {
          socketId: socketRef.current.id,
          roomId,
          isMuted: newMuted,
          cameraOn,
        });
      }
      return newMuted;
    });
  };

  const toggleCamera = () => {
    setCameraOn((prev) => {
      const newCamera = !prev;
      if (localStreamRef.current) {
        localStreamRef.current
          .getVideoTracks()
          .forEach((t) => (t.enabled = newCamera));
      }
      if (socketRef.current?.emit) {
        socketRef.current.emit("participant-update", {
          socketId: socketRef.current.id,
          roomId,
          isMuted,
          cameraOn: newCamera,
        });
      }
      return newCamera;
    });
  };

  if (pending) {
    console.log(pending);
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-700">
            Waiting for the host to join the room...
          </p>
          <p className="mt-2 text-sm text-gray-500">Room ID: {roomId}</p>
        </div>
      </div>
    );
  }

  if (loading || !userName) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-700">Joining room...</p>
        </div>
      </div>
    );
  }

  console.log(pending);

  const selectedParticipant = participants?.find(
    (p) => p.socketId === fullScreenId
  );
  const isLocalFullScreen = socketRef.current?.id === fullScreenId;
  const fullScreenParticipant = selectedParticipant
    ? {
        ...selectedParticipant,
        cameraOn: isLocalFullScreen
          ? cameraOn
          : selectedParticipant.cameraOn ?? true,
        isMuted: isLocalFullScreen
          ? isMuted
          : selectedParticipant.isMuted ?? false,
      }
    : null;

  return (
    <div className="flex flex-col w-screen h-screen overflow-x-hidden bg-gray-100 text-gray-900">
      <audio ref={audioRef} src="/ping_sound_effect.mp3" preload="auto" />

      {/* header */}
      <TooltipProvider>
        <div className="h-12 relative flex items-center justify-between px-4 border-b-2 border-zinc-300 bg-white">
          {/* === Left Section: Time & Room ID === */}
          <div className="flex gap-2 items-center justify-center">
            <span className="text-sm font-mono">
              {time.toLocaleTimeString()}
            </span>
            <h1 className="text-lg">|</h1>

            {/* Tooltip for Copy Room ID */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="text-sm font-medium flex items-center gap-3 cursor-pointer hover:text-gray-600"
                  onClick={handleCopy}
                >
                  <span className="font-mono">{roomId}</span>
                  {copy ? (
                    <LuCopyCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Copy Room ID</TooltipContent>
            </Tooltip>
          </div>

          {/* === Right Section: Controls === */}
          <div className="flex items-center gap-2">
            {/* 🔹 Host notification */}
            {participants?.find((p) => p.isHost) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative cursor-pointer">
                    <IoIosNotificationsOutline
                      onClick={() => setNotf(!notif)}
                      className="w-7 h-7 text-blue-500"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">Notifications</TooltipContent>
              </Tooltip>
            )}

            {/* ℹ️ Info Sidebar Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <IoInformation
                  onClick={() => setShowSidebar((s) => !s)}
                  className="w-8 h-8 text-black hover:text-black/60 cursor-pointer"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">Meeting Information</TooltipContent>
            </Tooltip>

            {/* 📞 Leave Meeting */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => {
                    exitKioskMode();
                    router.replace("/interviews");
                  }}
                >
                  <PhoneOff />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Leave Meeting</TooltipContent>
            </Tooltip>
          </div>

          {/* 🧾 Notifications Popup */}
          {notif && (
            <Notifications
              notiBox={notif}
              logs={monitorLogs}
              setnotBox={setNotf}
              clearLogs={clearMonitorLogs}
            />
          )}
        </div>
      </TooltipProvider>

      {/* main */}
      <div className="flex flex-1 overflow-y-auto">
        <div id="video-grid" className="flex-1 flex flex-wrap gap-8 p-5">
          {renderVideoCards()}
        </div>

        {showMessSidebar && (
          <Messages
            setshowMessSidebar={setshowMessSidebar}
            socketRef={socketRef}
            roomId={roomId}
            userName={userName}
            socketId={socketRef.current?.id}
          />
        )}

        {participantSideBar && (
          <div className="w-[350px] bg-gray-50 border-l border-gray-300 overflow-y-auto flex flex-col">
            <div className="p-3 border-b sticky justify-between flex items-center top-0 left-0 border-gray-300 bg-white font-semibold text-gray-800">
              <h1> Participants Information</h1>
              <IoMdClose
                onClick={() => setPartSidebar(false)}
                className="w-5 h-5 cursor-pointer"
              />
            </div>

            <div className="p-3 m-3 rounded-lg bg-zinc-200">
              {(participants || []).map((el, ind) => {
                return (
                  <div key={el.socketId}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h1>{el.userName}</h1>
                      </div>

                      <div className="flex items-center gap-2">
                        {el.isHost && <FaCrown className="text-yellow-500" />}
                        {!el.isHost && (
                          <button
                            onClick={() => {
                              if (socketRef.current?.emit) {
                                socketRef.current.emit("remove-participant", {
                                  socketId: el.socketId,
                                  roomId,
                                });
                              }
                            }}
                            className="text-red-500 cursor-pointer hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <hr
                      className={`
                        ${ind === participants.length - 1 ? "hidden" : ""}
                        border-[1.1px] my-2 border-zinc-400
                      `}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showSidebar && (
          <div className="w-80 bg-gray-50 border-l border-gray-300 flex flex-col">
            <div className="p-3 border-b border-gray-300 font-semibold text-gray-800">
              Meeting Details
            </div>
            <div className="flex-1 p-3 space-y-2 text-sm text-gray-700">
              <span
                className="text-sm font-medium flex items-center gap-3 cursor-pointer hover:text-gray-600"
                onClick={handleCopy}
              >
                <span className="font-mono">{roomId}</span>
                {copy ? (
                  <LuCopyCheck className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </span>
              <p>
                <strong>Participants:</strong> {userCount}
              </p>
            </div>

            <div className="bg-zinc-100 px-3 py-1 mb-4 m-1 rounded-lg border-[1.6px] border-zinc-200">
              <h1 className="text-sm font-semibold">Joining Info</h1>
              {process.env.NODE_ENV === "development"
                ? `http://localhost:3000/interviews/${roomId}`
                : `https://skillsorbit.in/interviews/${roomId}`}

              <span
                className="text-sm font-medium flex mt-4 gap-2 cursor-pointer hover:text-gray-600 justify-center w-full"
                onClick={handleCopyUrl}
              >
                Copy Joining URL
                {copyUrl ? (
                  <LuCopyCheck className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* controls bar */}
      <ControlsBar
        isMuted={isMuted}
        cameraOn={cameraOn}
        toggleMute={toggleMute}
        toggleCamera={toggleCamera}
        userCount={participants.length}
        isScreenSharing={isScreenSharing}
        toggleScreenShare={toggleScreenShare}
        setpartSidebarToggle={() => setPartSidebar(!participantSideBar)}
        setMessageSidebar={() => setshowMessSidebar(!showMessSidebar)}
      />

      <NavigationGuard
        url="/interviews"
        message="Session will be ended on performing the actions"
      />

      {/* Full Screen Participant View */}
      {fullScreenId && fullScreenParticipant && (
        <FullScreenParticipant
          participant={fullScreenParticipant}
          isLocal={isLocalFullScreen}
          localStreamRef={localStreamRef}
          remoteStreamsMap={remoteStreamsMap}
          isScreenSharing={isScreenSharing}
          displayStreamRef={displayStreamRef}
          onExit={() => setFullScreenId(null)}
          myId={socketRef.current?.id}
        />
      )}
    </div>
  );
}

// FullScreenParticipant component (updated with prevStreamRef and optimized deps)
const FullScreenParticipant = ({
  participant,
  isLocal,
  localStreamRef,
  remoteStreamsMap,
  isScreenSharing,
  displayStreamRef,
  onExit,
  myId,
}) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const prevStreamRef = useRef(null); // Track previous stream to avoid resets
  const firstLetter = participant?.userName?.charAt(0)?.toUpperCase() || "?";

  // Memoize the remote stream to stabilize deps
  const remoteStream = useMemo(
    () => remoteStreamsMap[participant.socketId],
    [remoteStreamsMap, participant.socketId]
  );

  useEffect(() => {
    if (videoRef.current) {
      let streamToSet = null;
      if (isLocal && isScreenSharing) {
        streamToSet = displayStreamRef.current;
      } else if (isLocal) {
        streamToSet = localStreamRef.current;
      } else {
        streamToSet = remoteStream;
      }

      // Only set if stream changed (prevents flicker on same ref)
      if (streamToSet && streamToSet !== prevStreamRef.current) {
        videoRef.current.srcObject = streamToSet;
        prevStreamRef.current = streamToSet;
      }
    }

    if (audioRef.current && !isLocal) {
      const audioStream = remoteStream;
      // Same check for audio to avoid glitches
      if (audioStream && audioStream !== prevStreamRef.current) {
        audioRef.current.srcObject = audioStream;
        prevStreamRef.current = audioStream; // Shared ref is fine since streams are typically unified
      }
    }
  }, [
    isLocal,
    isScreenSharing,
    localStreamRef,
    remoteStream, // Memoized – less volatile than full map
    participant.socketId,
    displayStreamRef,
  ]);

  const showVideo =
    participant.cameraOn !== false || (isLocal && isScreenSharing);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Exit Button */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-10 p-2 text-white hover:bg-white/20 rounded-full transition"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Video/Content Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {showVideo ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isLocal}
              className="w-full h-full object-cover"
            />
            {!isLocal && <audio ref={audioRef} autoPlay className="hidden" />}
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-200 text-9xl font-semibold text-gray-600">
            <div className="rounded-full p-4 w-48 h-48 flex justify-center items-center border border-zinc-400">
              <h1>{firstLetter}</h1>
            </div>
          </div>
        )}
      </div>

      {/* Name + Mic Bar */}
      <div className="absolute bottom-4 left-4 bg-black/60 text-white px-4 py-2 rounded flex items-center gap-2">
        <span className="text-lg">
          {participant.userName} {participant.isHost ? "(Host)" : ""}
        </span>
        {participant.isMuted && <MicOff className="w-5 h-5 text-red-400" />}
      </div>
    </div>
  );
};

// Notifications component (updated with clearLogs prop)
const Notifications = ({ logs, notiBox, setnotBox, clearLogs }) => {
  console.log(logs);
  function formatTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${String(hours).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
  }

  const handleClear = () => {
    if (clearLogs) {
      clearLogs();
    }
    setnotBox(false); // Close popup
  };

  return (
    <div
      className={`
        ${logs.length === 0 ? "flex justify-center items-center" : ""}
        absolute top-16 right-5 w-80 h-80 gap-2 p-3 overflow-y-auto flex flex-col bg-white border border-gray-300 rounded-lg shadow-lg z-[1001]
      `}
    >
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-center">No notifications yet. </h1>
          <h1 className="text-center text-[13px] text-gray-400 max-w-[75%] ">
            Want to monitor anyone ! Just enable it by clicking on three-dots
            and clicking on monitor activities
          </h1>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h1 className="font-semibold text-lg"> Monitoring Notification </h1>
            <Button
              onClick={handleClear}
              className="text-black bg-gray-200 hover:bg-gray-300"
            >
              Clear
            </Button>
          </div>
          {logs.map((elem, index) => {
            return (
              <div
                key={index}
                className="p-3 border-[1.6px] rounded-lg border-gray-200"
              >
                <p className="text-[12px] text-gray-700">
                  {elem?.event.type.toUpperCase()}
                </p>
                <p> {formatTime(elem?.time)} </p>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
