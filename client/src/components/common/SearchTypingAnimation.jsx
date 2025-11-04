"use client";
import React, { useEffect, useState } from "react";

export default function SearchTypingAnimation({
  words = [],
  typingSpeed = 100,
  deletingSpeed = 60,
  pauseTime = 1500,
}) {
  const [displayText, setDisplayText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex] || "";
    let timer;

    if (isDeleting) {
      timer = setTimeout(() => {
        setDisplayText((prev) => prev.slice(0, -1));
      }, deletingSpeed);
    } else {
      timer = setTimeout(() => {
        setDisplayText(currentWord.slice(0, displayText.length + 1));
      }, typingSpeed);
    }

    // Pause when full word is typed
    if (!isDeleting && displayText === currentWord) {
      timer = setTimeout(() => setIsDeleting(true), pauseTime);
    }
    // Move to next word
    else if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    }

    return () => clearTimeout(timer);
  }, [
    displayText,
    isDeleting,
    words,
    wordIndex,
    typingSpeed,
    deletingSpeed,
    pauseTime,
  ]);

  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {displayText}
      <span
        style={{
          display: "inline-block",
          width: "2px",
          height: "1em",
          backgroundColor: "gray",
          marginLeft: "2px",
          animation: "blink 1s step-start infinite",
        }}
      ></span>

      {/* Inline blink animation */}
      <style jsx>{`
        @keyframes blink {
          0%,
          50%,
          100% {
            opacity: 1;
          }
          25%,
          75% {
            opacity: 0;
          }
        }
      `}</style>
    </span>
  );
}
