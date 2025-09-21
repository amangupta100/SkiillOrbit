"use client";
import { MicOff } from "lucide-react";

export default function ParticipantCard({
  isLocal,
  participant,
  localStreamRef,
  remoteStream,
  localVideoRef,
  isScreenSharing,
  screenLoading,
}) {
  const firstLetter = participant?.userName?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center w-[450px] h-[270px]">
      {/* 🔹 If local & screen sharing */}
      {isLocal && isScreenSharing ? (
        screenLoading ? (
          // Loader during start
          <div className="flex flex-col items-center justify-center text-white">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-2 text-sm">Starting screen share...</p>
          </div>
        ) : (
          // After screen share is live
          <div className="flex items-center justify-center w-full h-full bg-black text-white">
            <p className="text-sm">You are sharing your screen</p>
          </div>
        )
      ) : participant.cameraOn !== false ? (
        // 🔹 Normal video mode
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
                if (el && remoteStream && !el.srcObject) {
                  el.srcObject = remoteStream;
                }
              }}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <audio
              autoPlay
              ref={(el) => {
                if (el && remoteStream) {
                  el.srcObject = remoteStream;
                }
              }}
              className="hidden"
            />
          </>
        ) : (
          <div className="text-white/80">Waiting for video...</div>
        )
      ) : (
        // 🔹 Avatar fallback
        <div className="flex items-center justify-center w-full h-full bg-gray-200/90 text-3xl font-semibold text-gray-600">
          <div className="rounded-full p-1 w-16 h-16 flex justify-center items-center border border-zinc-400">
            <h1>{firstLetter}</h1>
          </div>
        </div>
      )}

      {/* 🔹 Name + Mic Icon */}
      <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded flex items-center gap-2">
        <span>
          {participant.userName} {participant.isHost ? "(Host)" : ""}
        </span>
        {participant.isMuted && <MicOff className="w-4 h-4 text-red-400" />}
      </div>
    </div>
  );
}
