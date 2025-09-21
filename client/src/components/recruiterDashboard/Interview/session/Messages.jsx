"use client";
import React, { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { IoIosSend } from "react-icons/io";

const Messages = ({ setshowMessSidebar, socketRef, roomId, userName }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true); // 🔹 loader state
  const chatEndRef = useRef(null);

  // Scroll to bottom when new message comes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;

    // 🔹 Load old messages (room messages from backend)
    socket.emit("get-messages", { roomId }, (resp) => {
      if (resp?.messages) {
        setMessages(resp.messages);
      }
      setLoading(false); // ✅ loader off once messages loaded
    });

    // 🔹 Listen for new incoming messages
    socket.on("new-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("new-message");
    };
  }, [socketRef, roomId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = {
      roomId,
      userName,
      message: input.trim(),
    };
    socketRef.current.emit("send-message", msg);
    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="w-[450px] overflow-x-hidden bg-gray-50 border-l border-gray-300 flex flex-col">
      {/* header */}
      <div className="p-3 border-b sticky justify-between flex items-center top-0 left-0 border-gray-300 bg-white font-semibold text-gray-800">
        <h1>Messages</h1>
        <IoMdClose
          onClick={() => setshowMessSidebar(false)}
          className="w-5 h-5 cursor-pointer"
        />
      </div>

      {/* chat list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 text-sm">
        {loading ? (
          // 🔹 Loader UI
          <div className="flex justify-center items-center h-full text-gray-500">
            <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="ml-2">Loading messages...</span>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-md max-w-[80%] ${
                  m.userName === userName
                    ? "ml-auto bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{m.userName}</p>
                  <span className="text-xs ml-3">{formatTime(m.time)}</span>
                </div>
                <p>{m.message}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* input box */}
      <div className="p-3 border-t flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring focus:ring-blue-200"
        />
        <button
          onClick={sendMessage}
          className="p-2 cursor-pointer bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <IoIosSend />
        </button>
      </div>
    </div>
  );
};

export default Messages;
