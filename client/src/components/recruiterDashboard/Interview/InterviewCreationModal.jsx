// Updated CreateRoomModal
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IoClose } from "react-icons/io5";

export default function CreateRoomModal({
  onClose,
  data,
  onChat,
  messageCreation,
}) {
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const router = useRouter();

  const BASE_URL =
    process.env.NODE_ENV === "production"
      ? "https://skillsorbit.in"
      : "http://localhost:3000";

  const roomUrl = `${BASE_URL}/interviews/${roomId}`;

  useEffect(() => {
    generateRoomId();
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  const generateRoomId = () => {
    const newRoomId = Math.random().toString(36).substring(2, 12).toUpperCase();
    setRoomId(newRoomId);
  };

  const handleCopy = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyURL = () => {
    navigator.clipboard.writeText(roomUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 1500);
  };

  const handleEnterRoom = () => {
    if (!roomId) return;
    sessionStorage.setItem("data", JSON.stringify(data));
    sessionStorage.setItem("role", "host");
    onChat ? onClose() : router.replace(`/interviews/${roomId}`);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center w-screen h-screen bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 relative animate-in fade-in slide-in-from-bottom-4">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-1 cursor-pointer right-3 p-1 rounded-full hover:bg-gray-100 transition"
        >
          <IoClose className="w-7 h-7 text-gray-600" />
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
            {/* Room ID */}
            <div className="bg-gray-100 px-4 py-3 rounded-lg flex items-center justify-between">
              <span className="font-mono text-lg tracking-wide">{roomId}</span>
              <button
                onClick={handleCopy}
                className="p-2 rounded-md hover:bg-gray-200 transition"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>

            {/* When message creation is TRUE */}
            {messageCreation ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Share the room link with the participant:
                </p>

                {/* URL Box */}
                <div className="bg-gray-100 px-4 py-3 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium truncate max-w-[70%]">
                    {roomUrl}
                  </span>
                  <button
                    onClick={handleCopyURL}
                    className="p-2 rounded-md hover:bg-gray-200 transition"
                  >
                    {urlCopied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // When NOT messageCreation → show normal buttons
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
