import { generatePhonemeData } from "@/lib/userDashboard/phonemeService";
import { useState, useEffect, useCallback } from "react";

export const useTTSWebsocket = () => {
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      if (!availableVoices.length) return;

      // Prefer Google UK English Female
      const targetVoice = availableVoices.find(
        (voice) => voice.name === "Google UK English Female"
      );
      setSelectedVoice(targetVoice || availableVoices[0]);
    };

    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const speak = useCallback(
    (
      text,
      { onPhonemes, onEnd, onBoundary, rate = 0.9, pitch = 1, volume = 1 } = {}
    ) => {
      if (!text.trim()) return;
      if (!selectedVoice) {
        console.warn("No voice selected yet. Skipping speak.");
        return;
      }

      // cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);

        // generate approximate phoneme data
        const phonemeData = generatePhonemeData(text, rate);
        onPhonemes?.(phonemeData);
      };

      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
        onEnd?.();
      };

      utterance.onboundary = (event) => {
        if (onBoundary) {
          const charIndex = event.charIndex;
          const nextSpace = text.indexOf(" ", charIndex);
          const word =
            nextSpace === -1
              ? text.slice(charIndex)
              : text.slice(charIndex, nextSpace);
          onBoundary({ ...event, word });
        }
      };

      utterance.onerror = (err) => {
        console.error("TTS error:", err);
        setSpeaking(false);
        setPaused(false);
      };

      speechSynthesis.speak(utterance);
    },
    [selectedVoice]
  );

  const pause = useCallback(() => {
    if (speaking && !paused) {
      speechSynthesis.pause();
      setPaused(true);
    }
  }, [speaking, paused]);

  const resume = useCallback(() => {
    if (speaking && paused) {
      speechSynthesis.resume();
      setPaused(false);
    }
  }, [speaking, paused]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  return {
    selectedVoice,
    speaking,
    paused,
    speak,
    pause,
    resume,
    stop,
  };
};
