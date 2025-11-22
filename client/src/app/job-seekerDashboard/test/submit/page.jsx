"use client";
import React, { useState, useEffect, useRef } from "react";
import useEvaluationStore from "@/store/test/useEvaluationState";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import API from "@/utils/interceptor";
import Image from "next/image";
import preparing from "@/assests/preparing_scoreCard.svg";

const DebugEvaluationPage = () => {
  const [errorMessage, setErrorMessage] = useState(null);
  const { setLoading, setLoaderStatus, loading, loaderStatus } =
    useEvaluationStore();
  const router = useRouter();
  const submittedRef = useRef(false);

  // Helper functions
  const getEvaluationData = () => {
    try {
      const questions = JSON.parse(sessionStorage.getItem("questions") || "[]");
      const answers = JSON.parse(sessionStorage.getItem("answers") || "[]");

      if (!questions.length || !answers.length) {
        throw new Error("No test data found");
      }

      return { questions, answers };
    } catch (error) {
      console.error("Session data error:", error);
      throw error;
    }
  };

  useEffect(() => {
    const handleSubmissionAndEvaluation = async () => {
      if (submittedRef.current) return;
      submittedRef.current = true;

      try {
        setLoading(true);
        setLoaderStatus("Submitting your answers...");

        // If no cached evaluations, run evaluation
        setLoaderStatus("Evaluating your solutions...");
        const flags = sessionStorage.getItem("flags");
        if (flags) {
          try {
            setLoaderStatus("Submitting your session...");
            const parsedFlags = JSON.parse(flags); // ✅ convert back to array/object
            await API.post("/job-seeker/tests/submitTest", {
              flags: parsedFlags,
            });

            sessionStorage.removeItem("flags");
          } catch (err) {
            toast.error(err.message);
          }
        } else {
          const { answers } = getEvaluationData();

          // Prepare submission data for backend
          const uanswer = answers.map((a) => ({
            code: a.code || "",
          }));

          setLoaderStatus("Submitting your session...");

          // ✅ Submit evaluated results to backend
          const resp = await API.post("/job-seeker/tests/submitTest", {
            uanswer,
          });

          if (!resp.data?.success) {
            toast.error("Failed to save test results");
          } else {
            toast.success("Test submitted successfully!");
          }
        }
      } catch (error) {
        toast.error("Submission failed: " + error.message);
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    };

    handleSubmissionAndEvaluation();
  }, [setLoading, setLoaderStatus, router]);

  // useEffect(() => {
  //   if (evaluations.length > 0) {
  //     // Transform evaluations into chart data
  //     const summary = {
  //       total: evaluations.length,
  //       correct: evaluations.filter((e) => e.isCorrect).length,
  //       avgScore:
  //         evaluations.reduce((sum, e) => sum + (e.score || 0), 0) /
  //         evaluations.length,
  //     };

  //     const pieData = [
  //       { name: "Correct", value: summary.correct },
  //       { name: "Incorrect", value: summary.total - summary.correct },
  //     ];

  //     const barData = evaluations.map((e, i) => ({
  //       name: `Q${i + 1}`,
  //       score: e.score || 0,
  //       correct: e.isCorrect ? 100 : 0,
  //       incorrect: e.isCorrect ? 0 : 100,
  //     }));

  //     setChartData({
  //       summary,
  //       pieData,
  //       barData,
  //     });
  //   }
  // }, [evaluations]);

  const handleReturn = () => {
    sessionStorage.removeItem("evaluations");
    sessionStorage.removeItem("questions");
    sessionStorage.removeItem("answers");
    sessionStorage.removeItem("recording-store");
    sessionStorage.removeItem("evaluation-store");
    sessionStorage.removeItem("proctoringNotifications");
    window.location.href = "/job-seekerDashboard/test";
  };

  // Render results
  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-lg font-medium">{loaderStatus}</p>
        <p className="text-sm text-muted-foreground">
          Please wait, this may take a moment...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Test Results</h1>
        <Button className="hover:bg-black/70" onClick={() => handleReturn()}>
          Return to Dashboard
        </Button>
      </div>

      {errorMessage && <h1>{errorMessage}</h1>}
      <div className="flex items-center justify-center flex-col">
        <Image src={preparing} alt="Preparing Image" width={350} height={350} />
        <h1 className="text-sm text-gray-400">
          We are preparing your test results, as soon as it's ready we inform to
          you to the registered email.
        </h1>
      </div>
    </div>
  );
};

export default DebugEvaluationPage;
