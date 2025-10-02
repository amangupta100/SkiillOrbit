"use client";
import { useRef } from "react";
import { MicOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

function ParticipantCard({
  isLocal,
  participant,
  localStreamRef,
  remoteStream,
  localVideoRef,
  isScreenSharing,
  screenLoading,
  onMonitor,
  onFullScreen,
  socketRef, // passed from parent
  roomId, // passed from parent
}) {
  const firstLetter = participant?.userName?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center w-[450px] h-[270px]">
      {/* Controls (always show dropdown; host clicking will trigger monitoring) */}
      <div className="absolute top-2 right-2 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-full hover:bg-gray-700/50 text-white">
              ⋮
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 bg-white">
            <DropdownMenuItem
              disabled={participant.isHost}
              onClick={() => {
                // Host should call start-monitor; participant will receive enable-monitor
                if (!socketRef?.current) {
                  console.warn("socketRef missing");
                  return;
                }
                // Emit start-monitor from host to server (server forwards enable-monitor to the target)
                socketRef.current.emit("start-monitor", {
                  targetId: participant.socketId,
                  roomId, // important: pass current roomId
                });
              }}
            >
              Monitor Activities
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onFullScreen?.(participant.socketId)}
            >
              View in Full Screen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Video / Avatar */}
      {isLocal && isScreenSharing ? (
        screenLoading ? (
          <div className="flex flex-col items-center justify-center text-white">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-2 text-sm">Starting screen share...</p>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-black text-white">
            <p className="text-sm">You are sharing your screen</p>
          </div>
        )
      ) : participant.cameraOn !== false ? (
        isLocal ? (
          <video
            ref={(el) => {
              if (el) {
                localVideoRef.current = el;
                if (localStreamRef.current && !el.srcObject) {
                  el.srcObject = localStreamRef.current;
                }
              }
            }}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : remoteStream ? (
          <>
            <video
              ref={(el) => {
                if (el && remoteStream && !el.srcObject)
                  el.srcObject = remoteStream;
              }}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <audio
              autoPlay
              ref={(el) => {
                if (el && remoteStream) el.srcObject = remoteStream;
              }}
              className="hidden"
            />
          </>
        ) : (
          <div className="text-white/80">Waiting for video...</div>
        )
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-200/90 text-3xl font-semibold text-gray-600">
          <div className="rounded-full p-1 w-16 h-16 flex justify-center items-center border border-zinc-400">
            <h1>{firstLetter}</h1>
          </div>
        </div>
      )}

      {/* Name + mic */}
      <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded flex items-center gap-2">
        <span>
          {participant.userName} {participant.isHost ? "(Host)" : ""}
        </span>
        {participant.isMuted && <MicOff className="w-4 h-4 text-red-400" />}
      </div>
    </div>
  );
}

export default ParticipantCard;
