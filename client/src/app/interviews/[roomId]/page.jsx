"use client";

import React, { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PhoneOff, Info, Copy } from "lucide-react";
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
} from "@/components/ui/tooltip"; // ✅ import your custom tooltip
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participantSideBar, setPartSidebar] = useState(false);
  const [screenLoading, setScreenLoading] = useState(false);
  const [showMessSidebar, setshowMessSidebar] = useState(false);
  const [notif, setNotf] = useState(false);

  // refs
  const audioRef = useRef(null);

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

  // 🔹 use custom hook for connection
  const {
    participants,
    remoteStreamsMap,
    userCount,
    loading,
    localVideoRef,
    localStreamRef,
    socketRef,
    webrtcRef,
    monitorLogs,
  } = useRoomConnection({ roomId, userName, router, isMuted, cameraOn });

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

        const screenTrack = displayStream.getVideoTracks()[0];
        webrtcRef.current.replaceTrack(screenTrack);

        setIsScreenSharing(true);
        setScreenLoading(false);

        screenTrack.onended = () => {
          webrtcRef.current.replaceTrack(
            localStreamRef.current.getVideoTracks()[0]
          );
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error("Screen share error:", err);
        setScreenLoading(false);
      }
    } else {
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      webrtcRef.current.replaceTrack(camTrack);
      setIsScreenSharing(false);
    }
  };

  // 🔹 Render Video Cards Function
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
            onFullScreen={(socketId) => {
              console.log("Full screen clicked for", socketId);
            }}
            socketRef={socketRef} // 👈 pass socketRef here
            socketId={socketRef.current?.id}
            onMonitor={(socketId) => {
              console.log("Monitor clicked for", socketId);
            }}
            isLocal={isLocal}
            roomId={roomId}
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
          isHost={role === "recruiter"} // 👈 pass role as host flag
          onFullScreen={(socketId) => {
            console.log("Full screen clicked for", socketId);
          }}
          socketRef={socketRef} // 👈 pass socketRef here
          onMonitor={(socketId) => {
            console.log("Monitor clicked for", socketId);
          }}
          socketId={socketRef.current?.id}
          roomId={roomId}
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

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-gray-100 text-gray-900">
      <audio ref={audioRef} src="/interview_enter.mp3" preload="auto" />

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
                      className="w-6 h-6 text-blue-500"
                    />
                    {/* Optional red dot indicator */}
                    {/* <div className="w-3 h-3 bg-red-500 rounded-full absolute -top-1 -right-1 animate-pulse" /> */}
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
                  className="bg-gray-200 border border-zinc-300 w-8 h-8 text-black hover:bg-gray-500/40 rounded-lg cursor-pointer"
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
            />
          )}
        </div>
      </TooltipProvider>

      {/* main */}
      <div className="flex flex-1 overflow-hidden">
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
                      className={`${
                        participants.length === ind ? "hidden" : null
                      }  border-[1.1px] my-2 border-zinc-400`}
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
              Meeting Information
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
          </div>
        )}
      </div>

      {/* controls bar */}
      <ControlsBar
        isMuted={isMuted}
        cameraOn={cameraOn}
        toggleMute={toggleMute}
        toggleCamera={toggleCamera}
        userCount={userCount}
        isScreenSharing={isScreenSharing}
        toggleScreenShare={toggleScreenShare}
        setpartSidebarToggle={() => setPartSidebar(!participantSideBar)}
        setMessageSidebar={() => setshowMessSidebar(!showMessSidebar)}
      />

      <NavigationGuard
        url="/interviews"
        message="Session will be ended on performing the actions"
      />
    </div>
  );
}

const Notifications = ({ logs, notiBox, setnotBox }) => {
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

  return (
    <div
      className={`${
        logs.length === 0 ? "flex justify-center items-center" : ""
      } absolute top-16 right-5 w-80 h-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-1`}
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
          {logs.map((elem) => {
            return (
              <div
                key={elem}
                className="p-3 border-[1.6px] rounded-lg border-gray-200"
              >
                <p className="text-sm text-gray-700">{elem?.event}</p>
                <p> {formatTime(elem?.time)} </p>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
