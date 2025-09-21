"use client";
import { useEffect, useRef, useState } from "react";
import { ModeToggle } from "@/components/ui/theme-toogle";
import Image from "next/image";
import logo from "@/assests/logo.png";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProgressSidebarStore } from "@/store/test/useProgressSidebar";
import { AlignEndHorizontal } from "lucide-react";
import { IoIosNotificationsOutline } from "react-icons/io";
import { useNotificationStore } from "@/store/test/useNotification";
import { toast } from "sonner";
import { useRecordingStore } from "@/store/test/useRecordingStore";
import useEvaluationStore from "@/store/test/useEvaluationState";
import API from "@/utils/interceptor";
import ButtonLoader from "@/utils/Loader";

export default function AppHeader({ questions = 0, isInstructionShown }) {
  const TIME_PER_QUESTION = 180; // 3 minutes per question in seconds
  const [remainingTime, setRemainingTime] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const { toggleSidebar } = useProgressSidebarStore();
  const { toggleContentVisibility } = useNotificationStore();
  const { setLoading, setLoaderStatus, loaderStatus, loading } =
    useEvaluationStore();
  const { submitRecording, isRecording, stopRecording } = useRecordingStore();

  useEffect(() => {
    const initializeTimer = () => {
      if (questions <= 0) {
        setShowTimer(false);
        return;
      }

      const totalTime = questions * TIME_PER_QUESTION;
      const cookie = Cookies.get("tt");

      if (cookie) {
        try {
          const { endTime } = JSON.parse(cookie);
          const currentRemaining = Math.max(
            0,
            Math.floor((endTime - Date.now()) / 1000)
          );

          setRemainingTime(currentRemaining);
          setShowTimer(currentRemaining > 0);
        } catch {
          startNewTimer(totalTime);
        }
      } else {
        startNewTimer(totalTime);
      }
    };

    const startNewTimer = (totalTime) => {
      const endTime = Date.now() + totalTime * 1000;
      Cookies.set("tt", JSON.stringify({ endTime }), {
        expires: new Date(endTime),
        secure: true,
        sameSite: "None",
      });
      setRemainingTime(totalTime);
      setShowTimer(true);
    };

    initializeTimer();

    const timerInterval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setShowTimer(false);
          Cookies.remove("tt");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [questions]);

  const formatTime = (seconds) => {
    if (isNaN(seconds)) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return (
      <div className="flex gap-1">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-mono">
            {mins.toString().padStart(2, "0")}
          </span>
          <span className="text-xs">min</span>
        </div>
        <span className="text-2xl">:</span>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-mono">
            {secs.toString().padStart(2, "0")}
          </span>
          <span className="text-xs">sec</span>
        </div>
      </div>
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    await API.get("/job-seeker/tests/submitTest");
    // Redirect to submit page
    window.location.href = "/userDashboard/test/submit";
    stopRecording();
    setLoading(false);
  };

  return (
    <header className="fixed dark:text-white top-0 left-0 w-full h-16 bg-background/80 backdrop-blur-sm border-b z-50 px-6">
      <div className="h-full flex items-center justify-between max-w-8xl mx-auto">
        <div className="flex gap-5 items-center">
          <Image
            src={logo}
            width={130}
            height={130}
            onDrag={(e) => e.preventDefault()}
            alt="Logo"
            priority
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={toggleSidebar}
                  className="p-2 cursor-pointer rounded-lg border-[1.6px] border-zinc-300 dark:border-zinc-700"
                >
                  <AlignEndHorizontal className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
              </TooltipTrigger>

              <TooltipContent>
                <p className="text-sm">Progress</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-4">
          <IoIosNotificationsOutline
            onClick={toggleContentVisibility}
            className="w-6 h-6 text-gray-600 dark:text-gray-300 cursor-pointer"
          />
          <ModeToggle />
          {showTimer && (
            <div className="bg-red-400 text-white dark:text-black font-semibold px-4 py-1.5 rounded-md flex items-center gap-2">
              <span>Time Left:</span>
              {formatTime(remainingTime)}
            </div>
          )}

          <Button
            disabled={loading}
            onClick={() => handleSubmit()}
            className="bg-red-400 text-base flex items-center gap-1 dark:text-black hover:bg-red-400/80"
          >
            {loading && <ButtonLoader />} Submit
          </Button>
        </div>
      </div>
    </header>
  );
}
