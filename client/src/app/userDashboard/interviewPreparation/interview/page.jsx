"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import InterviewerAvatarWrapper from "@/components/userDashboard/interview_prep/InterviewerAvatar";
import { GoogleGenerativeAI } from "@google/generative-ai";
import API2 from "@/utils/interceptor2";
import { toast } from "sonner";
import NavigationGuard from "@/lib/common/NavigationGuard";
import ChatPanel from "@/components/userDashboard/interview_prep/ChatPanel";
import { useSTT } from "@/hooks/job-seeker/interview_prep/useSTTWebSocket";
import { useTTSWebsocket } from "@/hooks/job-seeker/interview_prep/useTTSWebsocket";

// ✅ Initialize Google AI
const genAI = new GoogleGenerativeAI("AIzaSyD9zE89oUuo-UBw4CPu4rLtZSQTx7bpDbE");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export default function InterviewPrep() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [role, setRole] = useState("Software Engineer");
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const [phonemeTimings, setPhonemeTimings] = useState([]);
  const [getDetails, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingSpeech, setPendingSpeech] = useState(null);

  const chatContainerRef = useRef(null);

  // hooks
  const { speak, speaking } = useTTSWebsocket();
  const {
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    transcript,
  } = useSTT();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // AI response generation
  const generateAIResponse = useCallback(async (userInput, getDetails) => {
    try {
      setLoading(true);

      const interviewType = getDetails?.interview_type?.toLowerCase() || "";
      const role = getDetails?.role || "candidate";

      let prompt = `You are a virtual interviewer named Jia. 
Your job is ONLY to ask clear, short questions in a conversational tone.
Do not mention or simulate candidate answers.`;

      if (interviewType === "technical interview") {
        const skillsText =
          getDetails?.skills?.length > 0
            ? ` Focus specifically on these skills: ${getDetails.skills.join(
                ", "
              )}.`
            : "";

        prompt += `
Ask a technical interview question based on "${userInput}".${skillsText}
Tailor the question to the role: ${role}.
`;
      } else if (interviewType === "hr interview") {
        prompt += `
Ask an HR-style interview question related to "${userInput}".
Examples: strengths, weaknesses, teamwork, leadership, motivation.
Keep it short and friendly.
Tailor tone to the role: ${role}.
`;
      } else if (interviewType === "behavioral interview") {
        prompt += `
Ask a behavioral interview question based on "${userInput}".
Examples: conflict resolution, teamwork, decision making.
Keep it scenario-based and concise.
Tailor tone to the role: ${role}.
`;
      } else {
        prompt += `
Ask a general interview question (could be HR, behavioral, or technical) about "${userInput}".
Keep it short, supportive, and role-relevant: ${role}.
`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;

      return response?.text() || "Sorry, I couldn’t generate a response.";
    } catch (e) {
      return "Sorry, I couldn't generate a response at the moment.";
    } finally {
      setLoading(false);
    }
  }, []);

  // Send message handler
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // add a placeholder AI message
    const aiPlaceholder = { text: "", sender: "ai", pending: true };
    setMessages((prev) => [...prev, aiPlaceholder]);

    try {
      const aiText = await generateAIResponse(input, getDetails);
      setMessages((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((m) => m.pending);
        if (idx !== -1) {
          updated[idx] = { text: aiText, sender: "ai", pending: false };
        }
        return updated;
      });
      setPendingSpeech(aiText);
    } catch {
      setMessages((prev) => [
        ...prev,
        { text: "Error generating response.", sender: "ai", pending: false },
      ]);
    }
  };

  // 🔑 Speech effect
  useEffect(() => {
    if (pendingSpeech && !loading) {
      speak(pendingSpeech, {
        onPhonemes: (phonemes) => setPhonemeTimings(phonemes),
      });
      setPendingSpeech(null);
      setLoading(false);
    }
  }, [pendingSpeech, speak]);

  // Keyboard handler
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Welcome message
  useEffect(() => {
    if (!hasWelcomed && getDetails) {
      const timer = setTimeout(() => {
        try {
          const interviewTypeText = getDetails?.interview_type || "interview";
          const roleText = getDetails?.role || "candidate";
          const skillsText =
            getDetails?.skills?.length > 0
              ? getDetails.skills.join(", ")
              : "general skills";
          const getname = getDetails?.name || "Candidate";

          let secondLine = "";

          switch (interviewTypeText.toLowerCase()) {
            case "technical interview": {
              if (getDetails?.skills && getDetails.skills.length > 0) {
                const topic = getDetails.skills[0]; // pick first skill (or random)
                secondLine = `Can you explain a key concept or use case of ${topic}?`;
              } else {
                secondLine = `Can you explain one of your general skills in detail?`;
              }
              break;
            }

            case "hr interview":
              secondLine = `Can you introduce yourself briefly?`;
              break;

            case "behavioral interview":
              secondLine = `Can you describe a time when you resolved a conflict at work?`;
              break;

            default:
              secondLine = `What motivated you to apply for this ${roleText} role?`;
          }

          const skillsPart =
            getDetails?.skills && getDetails.skills.length > 0
              ? ` with skills ${skillsText}`
              : "";

          const welcomeText = `Hey ${getname}, I am SkillOrbit's Virtual Interviewer named Jia. I am here to take your ${interviewTypeText} for the role of ${roleText}${skillsPart}. ${secondLine}`;

          setMessages((prev) => [...prev, { text: welcomeText, sender: "ai" }]);
          setPendingSpeech(welcomeText);
          setHasWelcomed(true);
        } catch (error) {
          toast.error("Failed to generate welcome message:", error);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [hasWelcomed, role, getDetails]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const getData = async () => {
      const req = await API2.get("/getInterviewDetails");
      const { success: succ } = req.data;
      if (succ) {
        setDetails(req.data.data);
      } else toast.error(req.data.message);
    };
    getData();
  }, []);

  const handleEndSession = async () => {
    const req = await API2.post("/stt/end-session");
    const { success: succ, message } = req.data;
    if (succ) {
      toast.success("Interview Ended Successfully");
      window.location.href = "/userDashboard/interviewPreparation";
    } else toast.error(message);
  };

  console.log(phonemeTimings);

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Avatar section */}
      <div className="w-[35%] flex justify-center items-center flex-shrink-0 relative">
        <InterviewerAvatarWrapper
          isSpeaking={speaking}
          phonemeTimings={phonemeTimings}
        />
      </div>

      {/* Chat panel */}
      <ChatPanel
        messages={messages}
        input={input}
        setInput={setInput}
        role={role}
        getDetails={getDetails}
        loading={loading}
        transcript={transcript}
        isSpeaking={speaking}
        interimTranscript={interimTranscript}
        isListening={isListening}
        startListening={startListening}
        stopListening={stopListening}
        handleSendMessage={handleSendMessage}
        handleKeyPress={handleKeyPress}
        handleEndSession={handleEndSession}
      />

      <NavigationGuard message="Your interview progress will be lost if you navigate away." />
    </div>
  );
}
