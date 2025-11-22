"use client";

import { useRef } from "react";
import { MicOff, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

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
  socketRef,
  roomId,
  isMonitoring = false, // 🔹 Receives from parent (monitoredParticipants.has(p.socketId))
  containerClass = "w-[450px] h-[270px]", // <-- new prop with default
}) {
  const firstLetter = participant?.userName?.charAt(0)?.toUpperCase() || "?";

  // 🔹 UPDATED: No emit here - only call onMonitor (which emits once)
  const handleMonitorClick = () => {
    if (!socketRef?.current) {
      console.warn("socketRef missing");
      return;
    }
    // Always call onMonitor - server toggles based on its state
    onMonitor?.(participant.socketId);
  };

  return (
    <TooltipProvider>
      <div
        className={`relative bg-black rounded-lg overflow-hidden flex items-center justify-center ${containerClass}`}
      >
        {/* Controls Dropdown with Tooltip */}
        <div className="absolute top-2 right-2 z-50">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Options"
                    className="px-2 py-2 cursor-pointer border-zinc-300 border rounded-full bg-gray-500/50 hover:bg-gray-700/50 text-white transition"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="bg-gray-100 text-black shadow-md border border-gray-200 rounded p-2 text-sm"
              >
                More options
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end" className="w-44 bg-white">
              <DropdownMenuItem
                disabled={participant.isHost} // Only disable for host (can't self-monitor)
                onClick={handleMonitorClick}
                className={isMonitoring ? "text-red-600 font-medium" : ""} // Optional: Style "Stop" in red
              >
                {isMonitoring ? "Stop Monitoring" : "Monitor Activities"}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled
                onClick={() => onFullScreen?.(participant.socketId)}
              >
                View in Full Screen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* === Video or Avatar === */}
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

        {/* === Name + Mic === */}
        <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded flex items-center gap-2">
          <span>
            {participant.userName} {participant.isHost ? "(Host)" : ""}
          </span>
          {participant.isMuted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <MicOff className="w-4 h-4 text-red-400 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-white text-black shadow-md border border-gray-200 rounded px-2 py-1"
              >
                Microphone muted
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default ParticipantCard;
