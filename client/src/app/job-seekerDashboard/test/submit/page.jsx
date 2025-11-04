"use client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import React, { useState, useEffect, useRef } from "react";
import Editor, { loader } from "@monaco-editor/react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useRecordingStore } from "@/store/test/useRecordingStore";
import useEvaluationStore from "@/store/test/useEvaluationState";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import API from "@/utils/interceptor";

const genAI = new GoogleGenerativeAI("AIzaSyD9zE89oUuo-UBw4CPu4rLtZSQTx7bpDbE");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const COLORS = ["#0088FE", "#FF8042", "#FFBB28"];

const DebugEvaluationPage = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const { submitRecording, isRecording, submissionStatus, recordingId } =
    useRecordingStore();
  const { setLoading, setLoaderStatus, loading, loaderStatus } =
    useEvaluationStore();
  const router = useRouter();
  const submittedRef = useRef(false);

  console.log(evaluations);

  useEffect(() => {
    const handleSubmissionAndEvaluation = async () => {
      if (submittedRef.current) return;
      submittedRef.current = true;

      try {
        setLoading(true);
        setLoaderStatus("Submitting your answers...");

        // Check if evaluations already exist in session
        const cachedEvaluations = sessionStorage.getItem("evaluations");
        if (cachedEvaluations) {
          setEvaluations(JSON.parse(cachedEvaluations));
          return;
        }

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
          const { questions, answers } = getEvaluationData();
          const evaluationResults = await evaluateAllAtOnce(questions, answers);

          // Prepare submission data for backend
          const uanswer = answers.map((a) => ({
            code: a.code || "",
          }));

          const canswer = evaluationResults.map((r) => ({
            code: r.answerCode || "",
          }));

          setLoaderStatus("Submitting your session...");

          // ✅ Submit evaluated results to backend
          const resp = await API.post("/job-seeker/tests/submitTest", {
            uanswer,
            canswer,
          });

          if (!resp.data?.success) {
            toast.error("Failed to save test results");
          } else {
            toast.success("Test submitted successfully!");
          }

          // Store results in state and session
          setEvaluations(evaluationResults);
          sessionStorage.setItem(
            "evaluations",
            JSON.stringify(evaluationResults)
          );
        }
      } catch (error) {
        toast.error("Submission failed: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    // Helper functions
    const getEvaluationData = () => {
      try {
        const questions = JSON.parse(
          sessionStorage.getItem("questions") || "[]"
        );
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

    const evaluateAllAtOnce = async (questions, answers) => {
      try {
        const prompt = createBulkEvaluationPrompt(questions, answers);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return parseBulkAIResponse(text);
      } catch (error) {
        console.error("Bulk evaluation error:", error);
        throw error;
      }
    };

    const createBulkEvaluationPrompt = (questions, answers) => {
      return `
    Evaluate ALL debugging solutions in a SINGLE response. Follow this format exactly:

    For EACH question, provide:
    1. questionId: Original question identifier
    2. isCorrect: Boolean if solution is fully correct
    3. score: 0-100 based on bug fixes and code quality
    4. feedback: Technical analysis of the solution
    5. fixedBugs: List of successfully fixed issues
    6. remainingIssues: List of unresolved problems

    Questions Data:
    ${questions
      .map(
        (q, i) => `
    Question ${i + 1}:
    - ID: ${q.id || i}
    - Title: ${q.title}
    - Description: ${q.description}
    - Original Code: ${q.codeSnippet}
    - User Solution: ${answers[i]?.code || "No answer provided"}
    `
      )
      .join("\n")}

    Required JSON output format:
     {
      "evaluations": [
        {
          "questionId": "string",
          "title": "string",
          "isCorrect": boolean,
          "score": number,
          "description": "string",
          "feedback": "string",
          "fixedBugs": ["string"],
          "remainingIssues": ["string"],
          "answerCode": "string",
          "userCode": "string"
        }
      ]
    }
    Make sure generate the overall report for the test result only. No additional commentary.
    `;
    };

    const parseBulkAIResponse = (text) => {
      try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        // Force attach user answers serially if missing
        const answers = JSON.parse(sessionStorage.getItem("answers") || "[]");

        return parsed.evaluations.map((evalObj, i) => ({
          ...evalObj,
          userCode:
            evalObj.userCode || answers[i]?.code || "No answer provided",
        }));
      } catch (error) {
        throw new Error("Invalid evaluation response format");
      }
    };

    handleSubmissionAndEvaluation();
  }, [
    isRecording,
    submissionStatus,
    submitRecording,
    setLoading,
    setLoaderStatus,
    router,
  ]);

  useEffect(() => {
    if (evaluations.length > 0) {
      // Transform evaluations into chart data
      const summary = {
        total: evaluations.length,
        correct: evaluations.filter((e) => e.isCorrect).length,
        avgScore:
          evaluations.reduce((sum, e) => sum + (e.score || 0), 0) /
          evaluations.length,
      };

      const pieData = [
        { name: "Correct", value: summary.correct },
        { name: "Incorrect", value: summary.total - summary.correct },
      ];

      const barData = evaluations.map((e, i) => ({
        name: `Q${i + 1}`,
        score: e.score || 0,
        correct: e.isCorrect ? 100 : 0,
        incorrect: e.isCorrect ? 0 : 100,
      }));

      setChartData({
        summary,
        pieData,
        barData,
      });
    }
  }, [evaluations]);

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
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Test Results</h1>
        <Button className="hover:bg-black/70" onClick={() => handleReturn()}>
          Return to Dashboard
        </Button>
      </div>

      {/* Summary Cards */}
      {chartData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-green-200">
            <CardHeader className="pb-2">
              <h3 className="font-medium">Total Questions</h3>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{chartData.summary.total}</p>
            </CardContent>
          </Card>
          <Card className="border border-green-200">
            <CardHeader className="pb-2">
              <h3 className="font-medium">Correct Answers</h3>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {chartData.summary.correct} (
                {Math.round(
                  (chartData.summary.correct / chartData.summary.total) * 100
                )}
                %)
              </p>
            </CardContent>
          </Card>
          <Card className="border border-green-200">
            <CardHeader className="pb-2">
              <h3 className="font-medium">Average Score</h3>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {chartData.summary.avgScore.toFixed(1)}/100
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {chartData && (
        <div className="grid grid-cols-1 mt-8 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">
              Correct vs Incorrect Answers
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {chartData.pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">
              Question Scores Breakdown
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.barData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" name="Score" fill="#8884d8" />
                  <Bar
                    dataKey="correct"
                    name="Correct"
                    fill="#82ca9d"
                    stackId="a"
                  />
                  <Bar
                    dataKey="incorrect"
                    name="Incorrect"
                    fill="#ff8042"
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      <h1 className="mt-8 mb-4 text-lg font-semibold">Result Details</h1>

      {evaluations.length > 0 ? (
        <div className="space-y-4">
          {evaluations.map((result, index) => (
            <div
              key={index}
              className={`p-4 border rounded ${
                result.isCorrect
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <h3 className="font-medium">Question {index + 1}</h3>
              <h3 className="font-semibold">{result.title}</h3>
              <section className="font-semibold">
                <h1 className="font-semibold inline-block">Feedback:</h1>
                <p className="font-light inline-block"> {result.feedback}</p>
              </section>

              {result.fixedBugs?.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Fixed issues:</p>
                  <ul className="list-disc pl-5 text-sm">
                    {result.fixedBugs.map((bug, i) => (
                      <li key={i}>{bug}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.remainingIssues?.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Remaining issues:</p>
                  <ul className="list-disc pl-5 text-sm">
                    {result.remainingIssues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <details className="mt-2 text-sm">
                <summary className="cursor-pointer">Code Comparison</summary>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded overflow-hidden">
                    <div className="bg-gray-100 p-2 border-b">
                      <h4 className="font-medium">Original Solution</h4>
                    </div>
                    <div className="h-64">
                      <Editor
                        height="100%"
                        defaultValue={result.answerCode}
                        options={{
                          minimap: { enabled: false },
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 14,
                          lineNumbers: "off",
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className={`border rounded overflow-hidden ${
                      result.isCorrect ? "border-green-200" : "border-red-200"
                    }`}
                  >
                    <div
                      className={`p-2 border-b ${
                        result.isCorrect ? "bg-green-50" : "bg-red-50"
                      }`}
                    >
                      <h4 className="font-medium">Your Solution</h4>
                    </div>
                    <div className="h-64">
                      <Editor
                        height="100%"
                        defaultValue={result.userCode}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 14,
                          lineNumbers: "off",
                        }}
                        theme={result.isCorrect ? "vs" : "hc-light"}
                      />
                    </div>
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No evaluation results available</p>
      )}
    </div>
  );
};

export default DebugEvaluationPage;
