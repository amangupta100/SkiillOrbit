"use client";
import AppHeader from "@/components/userDashboard/test/Header";
import DescriptionPanel from "@/components/userDashboard/test/ProblemDesc";
import CodeEditorPanel from "@/components/userDashboard/test/CodePanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useEffect, useState, useCallback, useRef } from "react";
import { InstructionsPage } from "@/components/userDashboard/test/Instructions";
import { toast } from "sonner";
import Cookies from "js-cookie";
import useProctoring from "@/hooks/job-seeker/test/use-Proctoring";
import { useProgressSidebarStore } from "@/store/test/useProgressSidebar";
import ProgressSidebar from "@/components/userDashboard/test/ProgressSidebar";
import { useNotificationStore } from "@/store/test/useNotification";
import TestNotification from "@/components/userDashboard/test/TestNotification";
import { useRecordingStore } from "@/store/test/useRecordingStore";
import { useRouter } from "next/navigation";

export default function TestPage() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [code, setCode] = useState("");
  const [isCodeChanged, setIsCodeChanged] = useState(false);
  const { isSidebarVisible } = useProgressSidebarStore();
  const [timeLeft, setTimeLeft] = useState(null);
  const { isNotificationContentVisible } = useNotificationStore();
  const router = useRouter();

  // Check if instructions were already shown
  const shouldShowInstructions = !Cookies.get("isInstructionsShown");

  //handling proctoring using WebSocket
  useProctoring(shouldShowInstructions);

  // Load saved answers from sessionStorage on initial render
  useEffect(() => {
    const savedQuestions = sessionStorage.getItem("questions");
    const savedAnswers = sessionStorage.getItem("answers");
    const timerFromCookie = Cookies.get("tt"); // Get timer from 'tt' cookie

    if (savedQuestions) {
      try {
        const parsedQuestions = JSON.parse(savedQuestions);
        setQuestions(parsedQuestions);

        // Initialize code with saved answer or question's default code
        if (parsedQuestions.length > 0) {
          let initialCode = parsedQuestions[0].starterCode || "";

          if (savedAnswers) {
            const parsedAnswers = JSON.parse(savedAnswers);
            if (parsedAnswers[0]?.code) {
              initialCode = parsedAnswers[0].code;
            }
          }

          setCode(initialCode);
        }
      } catch (error) {
        toast.error("Failed to parse questions:", error);
      }
    }

    // Initialize timer if duration exists in cookie
    if (timerFromCookie) {
      setTimeLeft(parseInt(timerFromCookie, 10));
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (!timeLeft) return;

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        // Update the cookie with remaining time
        Cookies.set("tt", newTime.toString(), { expires: 1 }); // Expires in 1 day

        if (newTime <= 0) {
          clearInterval(timerId);
          Cookies.remove("isInstructionsShown");
          Cookies.remove("tt");
          // Time's up - redirect to submit page
          router.push("/job-seekerDashboard/test/submit");
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setIsCodeChanged(true);

    // Get current answers from sessionStorage
    const savedAnswers = sessionStorage.getItem("answers");
    let answers = [];

    if (savedAnswers) {
      answers = JSON.parse(savedAnswers);
    }

    // Ensure answers array has the same length as questions
    while (answers.length < questions.length) {
      answers.push({ code: "" });
    }

    // Update the current answer
    answers[currentQuestionIndex] = {
      ...answers[currentQuestionIndex],
      code: newCode,
      questionId: questions[currentQuestionIndex]?.id || null,
      timestamp: new Date().toISOString(),
    };

    // Save to sessionStorage
    sessionStorage.setItem("answers", JSON.stringify(answers));
  };

  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      const options = {
        navigationUI: "hide",
      };

      if (elem.requestFullscreen) {
        await elem.requestFullscreen(options);
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen(options);
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  // Load questions and test state from sessionStorage
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.classList.add("dark:bg-black");

    let hasMounted = false; // Prevent triggering right on mount
    let isUnmounting = false; // Prevent triggering during unmount

    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement && isFullscreen && !isUnmounting) {
        toast.warning(
          "Exiting fullscreen is not allowed as mentioned in instructions."
        );

        sessionStorage.setItem(
          "flags",
          JSON.stringify([
            "Performed exiting full screen as it is strictly prohibited.",
          ])
        );

        router.push("/job-seekerDashboard/test/submit");
        Cookies.remove("tt");
        setTimeout(() => {
          Cookies.remove("isInstructionsShown");
        }, 1500);
      }
      setIsFullscreen(!!document.fullscreenElement);
    };

    // const handleVisibilityChange = () => {
    //   // ⛔ Ignore first mount and unmount
    //   if (!hasMounted || isUnmounting) return;

    //   if (document.hidden) {
    //     toast.warning(
    //       "Switching tabs or minimizing the window is not allowed during the test."
    //     );

    //     sessionStorage.setItem(
    //       "flags",
    //       JSON.stringify([
    //         "Attempted to switch browser tab or minimize the window during test.",
    //       ])
    //     );

    //     router.push("/job-seekerDashboard/test/submit");

    //     setTimeout(() => {
    //       Cookies.remove("isInstructionsShown");
    //     }, 1500);
    //   }
    // };

    // Attach listeners
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
    // document.addEventListener("visibilitychange", handleVisibilityChange);

    // Allow visibility detection only after a short delay
    const mountTimer = setTimeout(() => {
      hasMounted = true;
    }, 1000);

    // Cleanup
    return () => {
      isUnmounting = true; // ✅ prevents visibility event firing on unmount
      clearTimeout(mountTimer);
      document.body.style.overflow = "";
      document.body.classList.remove("dark:bg-black");
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
      // document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isFullscreen, router]);

  const handleQuestionChange = (newIndex) => {
    if (newIndex >= 0 && newIndex < questions.length) {
      setCurrentQuestionIndex(newIndex);

      // Check if we have a saved answer for this question
      const savedAnswers = sessionStorage.getItem("answers");
      let newCode = questions[newIndex].starterCode || "";

      if (savedAnswers) {
        const parsedAnswers = JSON.parse(savedAnswers);
        if (parsedAnswers[newIndex]?.code) {
          newCode = parsedAnswers[newIndex].code;
        }
      }

      setCode(newCode);
      setIsCodeChanged(false);
    }
  };

  const initializeKioskMode = useCallback(() => {
    const handleKeyDown = (e) => {
      if (["F11", "F5", "Escape"].includes(e.key)) e.preventDefault();
      if (e.ctrlKey && ["r", "R", "w", "W"].includes(e.key)) e.preventDefault();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleStartTest = async () => {
    try {
      Cookies.set("isInstructionsShown", "true", { expires: 1 });
      initializeKioskMode();

      const fullscreenSuccess = await enterFullscreen();
      if (!fullscreenSuccess) {
        toast.warning("Fullscreen not enabled - some features may be limited");
      }
    } catch (error) {
      toast.error("Failed to initialize test environment");
    }
  };

  const currentQuestion = questions[currentQuestionIndex] || {
    title: "",
    description: "",
    starterCode: "",
    difficulty: "medium",
    skill: "",
  };

  if (shouldShowInstructions) {
    return <InstructionsPage onStartTest={handleStartTest} />;
  }

  return (
    <div className="flex dark:bg-black relative flex-col h-screen">
      {isSidebarVisible && (
        <div className="absolute z-[100]">
          <ProgressSidebar />
        </div>
      )}

      {isNotificationContentVisible && <TestNotification />}

      <AppHeader
        questions={questions.length}
        isInstructionShown={shouldShowInstructions}
      />
      <main className="flex flex-1 w-full pt-16 pb-0 overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="flex flex-1 h-full p-4"
        >
          <ResizablePanel defaultSize={50} className="h-full">
            <DescriptionPanel
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              onQuestionChange={handleQuestionChange}
            />
          </ResizablePanel>
          <ResizableHandle
            withHandle
            className="w-2 bg-transparent hover:bg-muted rounded-lg transition-colors duration-200"
          />
          <ResizablePanel defaultSize={50} className="h-full">
            <CodeEditorPanel
              code={code}
              onCodeChange={handleCodeChange}
              isCodeChanged={isCodeChanged}
              questionTitle={currentQuestion.title}
              questionId={currentQuestionIndex}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
