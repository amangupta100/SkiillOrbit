import { useState, useEffect, useCallback, useRef } from "react";

export const useSTT = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();

      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimTranscript += transcriptText;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
        }
        setInterimTranscript(interimTranscript);
      };

      recognition.onerror = (event) => {
        let errorMessage = `Speech recognition error: ${event.error}`;

        switch (event.error) {
          case "not-allowed":
            errorMessage =
              "Microphone permission denied. Please allow microphone access.";
            break;
          case "no-speech":
            errorMessage = "No speech detected. Please speak clearly.";
            break;
          case "audio-capture":
            errorMessage =
              "No microphone found. Please check your audio setup.";
            break;
          case "network":
            errorMessage = "Network error occurred during speech recognition.";
            break;
          case "service-not-allowed":
            errorMessage =
              "Speech recognition service not allowed. Try using HTTPS.";
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        setError(errorMessage);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };
    } else {
      setIsSupported(false);
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      setInterimTranscript("");
      setError(null);

      try {
        recognitionRef.current.start();
      } catch (err) {
        setError(`Failed to start speech recognition: ${err.message}`);
      }
    }
  }, [isListening, isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
  };
};
