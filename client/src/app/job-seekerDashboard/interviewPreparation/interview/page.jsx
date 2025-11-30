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
  const [endLoadState, setendLoadState] = useState(false);

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
  const generateAIResponse = useCallback(
    async (userInput, getDetails) => {
      try {
        setLoading(true);

        const interviewType = getDetails?.interview_type?.toLowerCase() || "";
        const role = getDetails?.role || "candidate";

        // Base prompt for Jia, the Interview Coach
        let prompt = `You are Jia, SkillsOrbit's Virtual Interview Coach.
Your job is to conduct mock interviews in a friendly, coaching tone.
You should:
1. Ask relevant, clear, and conversational interview questions.
2. If the candidate makes a mistake (grammar, structure, or concept), correct them politely and explain briefly why it was incorrect.
3. Then, continue the conversation by asking the next appropriate question.
4. Encourage the candidate positively and maintain a professional yet supportive tone.
Do NOT answer as the candidate — always respond as the interviewer-coach.
If the user's input is off-topic or unclear, gently guide them back to the interview context.\n`;

        // === Include last 2 messages as chat history context ===
        if (messages.length > 0) {
          const lastTwo = messages.slice(-2);
          const contextText = lastTwo
            .map(
              (m) => `${m.sender === "user" ? "Candidate" : "Jia"}: ${m.text}`
            )
            .join("\n");
          prompt += `\nHere is the recent conversation for context:\n${contextText}\n`;
        }

        // Add interview-type–specific guidance
        if (interviewType === "technical interview") {
          const skillsText =
            getDetails?.skills?.length > 0
              ? `Focus mainly on these skills: ${getDetails.skills.join(", ")}.`
              : "";

          prompt += `
Now, considering the candidate's latest input: "${userInput}",
analyze if they made any conceptual or communication mistake. 
If yes, correct them kindly and explain briefly why.
Then, ask a follow-up or new technical interview question based on their response and the role: ${role}.
${skillsText}
Keep it short, natural, and encouraging.
`;
        } else if (interviewType === "hr interview") {
          prompt += `
Now, based on "${userInput}",
check for any communication or tone mistakes.
Give a short constructive correction if needed (e.g., how to express more clearly or professionally).
Then ask the next HR-style question about motivation, teamwork, strengths, or career growth.
Tone: friendly, confident, and supportive.
`;
        } else if (interviewType === "behavioral interview") {
          prompt += `
Now, based on "${userInput}",
evaluate if their behavioral story or response misses structure or clarity.
Briefly guide them how to improve (like using STAR method).
Then ask a follow-up behavioral question — concise and realistic.
`;
        } else {
          prompt += `
Now, based on "${userInput}",
if the answer contains any mistake, correct it gently and explain why.
Then, continue the interview by asking the next general question relevant to the role: ${role}.
`;
        }

        // Generate response from Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;

        return response?.text() || "Sorry, I couldn’t generate a response.";
      } catch (e) {
        console.error("AI generation error:", e);
        return "Sorry, I couldn't generate a response right now.";
      } finally {
        setLoading(false);
      }
    },
    [messages]
  );

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
  // In InterviewPrep.jsx, update the useEffect for speak:
  useEffect(() => {
    if (pendingSpeech && !loading) {
      speak(pendingSpeech, {
        onPhonemes: (phonemes) => setPhonemeTimings(phonemes),
        onEnd: () => {
          setPhonemeTimings([]); // ✅ Clear timings on actual end
          // Optional: Force neutral in avatar if needed
        },
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

          const skillsPart =
            getDetails?.skills && getDetails.skills.length > 0
              ? ` with skills ${skillsText}`
              : "";

          const welcomeText = `Hey ${getname}, I am SkillsOrbit's Virtual Interviewer named Jia. I am here to take your ${interviewTypeText} for the role of ${roleText}${skillsPart}. Let's get started by introducing yourself briefly.`;

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
    try {
      setendLoadState(true);
      const req = await API2.post("/tts/end-session");
      const { success: succ, message } = req.data;
      if (succ) {
        window.location.href = "/job-seekerDashboard/interviewPreparation";
        return toast.success("Interview Ended Successfully");
      } else toast.error(message);
    } catch (err) {
      return toast.error(
        "Error ending session. Please try again." + err.message
      );
    } finally {
      setendLoadState(false);
    }
  };

  console.log(phonemeTimings);

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Avatar section */}
      <div className="w-[35%] flex justify-center items-center flex-shrink-0 relative">
        <InterviewerAvatarWrapper
          isSpeaking={speaking}
          phonemeTimings={phonemeTimings}
          onSpeakComplete={() => setPhonemeTimings([])} // Fallback clear
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
        endLoadState={endLoadState}
      />

      <NavigationGuard
        EndIntervSession={handleEndSession}
        message="Your session will be lost if you navigate away."
      />
    </div>
  );
}
