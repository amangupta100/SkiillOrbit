// hooks/useSessionStorageInit.js
"use client"
import { useState, useEffect } from 'react';

export default function useLoadData() {
  const [questions, setQuestions] = useState([]);
  const [code, setCode] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeFromSessionStorage = () => {
      const savedQuestions = sessionStorage.getItem('questions');
      const savedAnswers = sessionStorage.getItem('answers');
      
      if (savedQuestions) {
        try {
          const parsedQuestions = JSON.parse(savedQuestions);
          setQuestions(parsedQuestions);
          
          if (parsedQuestions.length > 0) {
            let initialCode = parsedQuestions[0].codeSnippet || "";
            
            if (savedAnswers) {
              const parsedAnswers = JSON.parse(savedAnswers);
              if (parsedAnswers[0]?.code) {
                initialCode = parsedAnswers[0].code;
              }
            }
            
            setCode(initialCode);
          }
          setIsInitialized(true);
        } catch (error) {
          console.error("Failed to parse session storage data:", error);
          setIsInitialized(true); // Still mark as initialized to continue
        }
      } else {
        setIsInitialized(true); // No saved data, but initialized
      }
    };

    initializeFromSessionStorage();
  }, []);

  return {
    questions,
    setQuestions,
    code,
    setCode,
    isInitialized
  };
}