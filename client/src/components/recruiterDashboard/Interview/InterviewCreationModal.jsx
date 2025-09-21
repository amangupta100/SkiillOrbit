"use client";
import React, { useEffect, useState } from "react";
import { RxCross1, RxCopy, RxCheck } from "react-icons/rx";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CreateRoomModal({ onClose, data }) {
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    generateRoomId();
  }, []);

  // Generate random room ID locally
  const generateRoomId = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10);
    setRoomId(newRoomId);
  };

  const handleCopy = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleEnterRoom = () => {
    if (!roomId) return;

    // save user info so [roomId].jsx can pick it up
    localStorage.setItem("data", JSON.stringify(data));

    // redirect directly (room creation happens in [roomId].jsx)
    router.replace(`/interviews/${roomId}`);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center w-screen h-screen bg-black/70 backdrop-blur-md px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 relative animate-in fade-in slide-in-from-bottom-4">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 cursor-pointer right-3 p-1 rounded-full hover:bg-gray-100 transition"
        >
          <RxCross1 className="w-5 h-5 text-gray-600" />
        </button>

        <h2 className="text-xl font-semibold text-center mb-6">
          Create a New Room
        </h2>

        {!roomId && (
          <div className="flex flex-col items-center py-6">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin mb-3"></div>
            <p className="text-gray-600 text-sm">Generating room ID...</p>
          </div>
        )}

        {roomId && (
          <div className="space-y-6">
            <div className="bg-gray-100 px-4 py-3 rounded-lg flex items-center justify-between">
              <span className="font-mono text-lg tracking-wide">{roomId}</span>
              <button
                onClick={handleCopy}
                className="p-2 rounded-md hover:bg-gray-200 transition"
              >
                {copied ? (
                  <RxCheck className="w-5 h-5 text-green-600" />
                ) : (
                  <RxCopy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handleEnterRoom} className="w-full">
                Enter Room
              </Button>
              <Button
                variant="outline"
                onClick={generateRoomId}
                className="w-full"
              >
                Generate Another ID
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
