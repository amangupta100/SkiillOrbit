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

  // refs
  const audioRef = useRef(null);

  // load user info
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("data") || "null");
    if (!data?.name || !data?.role) {
      toast.error("Unauthorized. Please log in.");
      router.replace("/login");
      return;
    }
    setUserName(data.name);
    setRole(data.role);
  }, [router]);

  // 🔊 play sound on room enter
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4; // below normal volume
      audioRef.current.play().catch(() => {
        console.warn("Autoplay blocked, will retry on user action");
      });
    }
  }, []);

  const playEnterSound = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(() => {});
    }
  };

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
  } = useRoomConnection({ roomId, userName, role, router, isMuted, cameraOn });

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

  // 🔹 renderVideoCards using ParticipantCard
  const renderVideoCards = () => {
    const myId = socketRef.current?.id;

    return (participants || []).map((p) => {
      const isLocal = p.socketId === myId;

      if (isLocal && isScreenSharing) {
        return (
          <ParticipantCard
            key={p.socketId}
            isLocal={true}
            participant={{ ...p, cameraOn: true }}
            localStreamRef={localStreamRef}
            remoteStream={remoteStreamsMap[p.socketId]}
            localVideoRef={localVideoRef}
            isScreenSharing={true}
            screenLoading={screenLoading}
          />
        );
      }

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

      return (
        <ParticipantCard
          key={p.socketId}
          isLocal={isLocal}
          participant={participantWithFlags}
          localStreamRef={localStreamRef}
          remoteStream={remoteStreamsMap[p.socketId]}
          localVideoRef={localVideoRef}
        />
      );
    });
  };

  // 🔹 controls
  const toggleMute = () => {
    playEnterSound(); // ensure sound plays after first user interaction
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
    playEnterSound(); // also retry sound here
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
      <div className="h-12 flex items-center justify-between px-4 border-b-2 border-zinc-300">
        <div className="flex gap-2 items-center justify-center">
          <span className="text-sm font-mono">{time.toLocaleTimeString()}</span>
          <h1 className="text-lg">|</h1>
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
        </div>

        <div className="flex items-center gap-2">
          <IoInformation
            onClick={() => setShowSidebar((s) => !s)}
            className="bg-gray-200 border border-zinc-300 w-8 h-8 text-black hover:bg-gray-500/40 rounded-lg"
          />
          <Button
            size="icon"
            variant="destructive"
            onClick={() => {
              router.replace("/interviews");
            }}
          >
            <PhoneOff />
          </Button>
        </div>
      </div>

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
