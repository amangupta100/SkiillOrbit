"use client";

import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageCircle,
  Users,
} from "lucide-react";
import { LuScreenShare } from "react-icons/lu";
import { FaStop } from "react-icons/fa";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"; // ✅ import your custom tooltip

export default function ControlsBar({
  isMuted,
  cameraOn,
  toggleMute,
  toggleCamera,
  userCount,
  setpartSidebarToggle,
  setMessageSidebar,
  toggleScreenShare,
  isScreenSharing,
}) {
  return (
    <TooltipProvider>
      <div className="h-16 flex items-center justify-center gap-4 border-b-2 border-zinc-300 text-white shadow-inner">
        {/* 🎙️ Mute / Unmute */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="bg-gray-200 border-zinc-300 border text-black hover:bg-gray-400/40"
              onClick={toggleMute}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {isMuted ? "Unmute Microphone" : "Mute Microphone"}
          </TooltipContent>
        </Tooltip>

        {/* 📷 Toggle Camera */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="bg-gray-200 border border-zinc-300 text-black hover:bg-gray-400/40"
              onClick={toggleCamera}
            >
              {cameraOn ? <Video /> : <VideoOff />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
          </TooltipContent>
        </Tooltip>

        {/* 💬 Messages */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setMessageSidebar()}
              size="icon"
              className="bg-gray-200 border-zinc-300 border text-black hover:bg-gray-400/40"
            >
              <MessageCircle />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Open Chat</TooltipContent>
        </Tooltip>

        {/* 👥 Participants */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setpartSidebarToggle()}
              variant="outline"
              size="icon"
              className="bg-gray-200 cursor-pointer border-zinc-300 relative hover:bg-gray-400/40 text-black border"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm absolute -top-5 -right-2 bg-gray-400 text-white rounded-full px-2 py-1 font-medium">
                {userCount}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">View Participants</TooltipContent>
        </Tooltip>

        {/* 🖥️ Screen Share */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => toggleScreenShare()}
              variant="outline"
              size="icon"
              className="bg-gray-200 cursor-pointer border-zinc-300 relative hover:bg-gray-400/40 text-black border"
            >
              {isScreenSharing ? (
                <FaStop className="w-4 h-4" />
              ) : (
                <LuScreenShare className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {isScreenSharing ? "Stop Sharing" : "Share Screen"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
