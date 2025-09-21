"use client";
import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Wifi, WifiOff, Loader2 } from "lucide-react";
import { MdOutlineCallEnd } from "react-icons/md";
import { IoMicOutline } from "react-icons/io5";
import { HiOutlineSpeakerWave } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPanel({
  messages,
  input,
  setInput,
  role,
  getDetails,
  isGeneratingAI,
  isConnected,
  isLoading,
  listening,
  isSpeaking,
  isUploading,
  interimTranscript,
  isListening,
  startListening,
  stopListening,
  handleSendMessage,
  handleKeyPress,
  handleEndSession,
  loading,
  transcript,
}) {
  const chatContainerRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Check if any AI message is still pending (not ready)
  const hasPendingAI = messages.some(
    (m) => m.sender === "ai" && m.ready === false
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col justify-between p-2 border-l border-zinc-300">
      {/* Header */}
      <div className="border-[1.6px] flex justify-between items-center border-zinc-300 rounded-lg bg-gray/50 backdrop-blur-md px-4 py-3">
        <div className="flex flex-col items-start">
          <h1 className="text-base font-semibold">
            {getDetails?.interview_type}
          </h1>
          <h1 className="text-[14px] text-gray-400">{getDetails?.role}</h1>
        </div>

        <div className="flex gap-3 items-center">
          <div
            onClick={handleEndSession}
            className="flex gap-2 py-2 px-3 cursor-pointer rounded-lg bg-red-400 hover:bg-red-400/90 items-center"
          >
            <MdOutlineCallEnd className="text-white" />
            <h1 className="text-white">End</h1>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto bg-white rounded-lg shadow p-4"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 my-8">
            <p>Welcome to your {role} interview practice!</p>
            <p className="text-sm mt-2">Start by typing a message below.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.sender === "ai" ? (
                msg.pending ? (
                  <div className="flex items-center gap-1">
                    <span className="animate-pulse">•</span>
                    <span className="animate-pulse">•</span>
                    <span className="animate-pulse">•</span>
                  </div>
                ) : (
                  msg.text
                )
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {/* Loader for AI generation */}
        {loading && messages[messages.length - 1]?.sender !== "ai" && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-200 text-gray-800 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="animate-pulse mr-2">•</div>
                <div className="animate-pulse mr-2">•</div>
                <div className="animate-pulse">•</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input + Mic + Send */}
      <div className="flex gap-2 items-center mt-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1"
          disabled={loading || isSpeaking || hasPendingAI}
        />

        <div className="flex items-center gap-3">
          {/* Mic */}
          <div>
            {isSpeaking ? (
              <div className="flex justify-center w-10 h-10 p-2 border-2 border-zinc-400 rounded-full items-center bg-gray-100 cursor-not-allowed">
                <HiOutlineSpeakerWave className="w-full h-full text-gray-500" />
              </div>
            ) : (
              <div className="relative flex justify-center items-center">
                {listening && (
                  <AnimatePresence>
                    {[1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 1, opacity: 0.4 }}
                        animate={{ scale: 1.8 + i * 0.2, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          delay: i * 0.6,
                          ease: "easeInOut",
                        }}
                        className="absolute w-12 h-12 rounded-full border border-gray-400"
                      />
                    ))}
                  </AnimatePresence>
                )}

                {isUploading && (
                  <div className="absolute w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}

                <div
                  onClick={() => {
                    if (isSpeaking || hasPendingAI) return;
                    if (!isListening) startListening();
                    else {
                      stopListening();
                      setInput(interimTranscript);
                    }
                  }}
                  className={`relative z-10 rounded-full w-10 h-10 flex p-2 justify-center items-center cursor-pointer transition-all duration-300
                    ${
                      isListening
                        ? "border-4 border-gray-500 bg-gray-100"
                        : "border-[1.6px] border-zinc-300 bg-white"
                    }`}
                >
                  <IoMicOutline
                    className={`w-full h-full transition-colors duration-300 ${
                      isListening ? "text-gray-800" : "text-gray-700"
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || loading || isSpeaking || hasPendingAI}
            className="flex items-center gap-2"
          >
            {loading || hasPendingAI ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
