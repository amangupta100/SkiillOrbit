"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";

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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import API from "@/utils/interceptor";
import { toast } from "sonner";

const COLORS = ["#4ade80", "#f87171"];

export default function TestDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Toggles
  const [showFullDesc, setShowFullDesc] = useState({});
  const [showFullStarter, setShowFullStarter] = useState({});

  const toggleDesc = (i) =>
    setShowFullDesc((prev) => ({ ...prev, [i]: !prev[i] }));

  const toggleStarter = (i) =>
    setShowFullStarter((prev) => ({ ...prev, [i]: !prev[i] }));

  // Fetch data
  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await API.get(`/job-seeker/tests/getTestDetails/${id}`);
        if (res.data?.success) {
          setTestData(res.data.data);
        } else toast.error("Failed to fetch test details");
      } catch (err) {
        console.error("Error fetching test:", err);
        toast.error("Error fetching test details");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 animate-pulse min-h-screen text-center text-zinc-400">
        Loading test...
      </div>
    );
  }

  if (!testData)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-400">
        <p>Test details not found.</p>
        <Button
          className="mt-4 bg-zinc-700 hover:bg-zinc-600 text-white"
          onClick={() => router.push("/job-seekerDashboard/test")}
        >
          Back to Tests
        </Button>
      </div>
    );

  const {
    uanswer = [],
    cAnswer = [],
    scorePercent,
    correctCount,
    incorrectCount,
    totalQuestions,
    questions = [],
    skills = [],
    duration,
    submittedAt,
  } = testData;

  const chartData = {
    pieData: [
      { name: "Correct", value: correctCount },
      { name: "Incorrect", value: incorrectCount },
    ],
    barData: uanswer.map((ans, i) => ({
      name: `Q${i + 1}`,
      correct: ans.isCorrect ? 100 : 0,
      incorrect: ans.isCorrect ? 0 : 100,
    })),
  };

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Test Details</h1>
        <Button
          onClick={() => router.push("/job-seekerDashboard/test")}
          className="bg-zinc-800 hover:bg-zinc-700 text-white"
        >
          Back
        </Button>
      </div>

      {/* BASIC TEST INFO */}
      <div className="mb-6 space-y-2">
        <p>
          <span className="font-medium">Skills:</span>{" "}
          {skills?.length ? skills.join(", ") : "N/A"}
        </p>

        <p>
          <span className="font-medium">Duration:</span> {duration}
        </p>

        <p>
          <span className="font-medium">Attempted At:</span>{" "}
          {new Date(submittedAt).toLocaleString()}
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-zinc-400">
          <CardHeader>
            <h3>Total Questions</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalQuestions}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-400">
          <CardHeader>
            <h3>Correct Answers</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-400">{correctCount}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-400">
          <CardHeader>
            <h3>Score</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-400">{scorePercent}%</p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
        {/* Pie Chart */}
        <Card className="border-zinc-400 p-4">
          <h3 className="text-lg font-medium mb-4">Answer Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {chartData.pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar Chart */}
        <Card className="border-zinc-400 p-4">
          <h3 className="text-lg font-medium mb-4">Question Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="correct" fill="#4ade80" />
                <Bar dataKey="incorrect" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ========================================================= */}
      {/*      QUESTION DETAILS + STARTER CODE + COMPARISON UI     */}
      {/* ========================================================= */}

      <h2 className="text-xl font-semibold mt-12 mb-6">
        Question Details & Comparison
      </h2>

      {questions.map((q, i) => {
        const userAns = uanswer[i];
        const correctAns = cAnswer[i];
        const isCorrect = userAns?.isCorrect;

        const shortDesc = q.description.slice(0, 180);

        const shortStarter = q.starterCode
          ? q.starterCode.slice(0, 200)
          : "// no starter code";

        return (
          <div
            key={q._id}
            className="p-5 mb-10 relative rounded border border-zinc-600 "
          >
            {/* QUESTION TITLE */}
            <h3 className="text-lg font-semibold mb-2">
              {i + 1}. {q.title}
            </h3>

            {/* TOPICS COVERED */}
            <div className="flex flex-wrap gap-2 mb-3">
              {q.topicsCovered?.map((t, idx) => (
                <Badge key={idx} className="bg-zinc-800 text-zinc-200">
                  {t}
                </Badge>
              ))}
            </div>

            {/* DESCRIPTION */}
            <p className="text-sm text-zinc-400 whitespace-pre-line">
              {showFullDesc[i] ? q.description : shortDesc + "..."}
            </p>

            <button
              onClick={() => toggleDesc(i)}
              className="text-xs mt-1 text-blue-400 hover:underline"
            >
              {showFullDesc[i] ? "Read Less" : "Read More"}
            </button>

            {/* STARTER CODE */}
            <div className="mt-4">
              <h4 className="font-medium mb-1">Starter Code:</h4>

              {!showFullStarter[i] ? (
                <pre className="bg-zinc-800 p-3 rounded text-xs text-zinc-300 whitespace-pre-wrap">
                  {shortStarter}...
                </pre>
              ) : (
                <div className="border border-zinc-800 rounded h-64 overflow-hidden">
                  <Editor
                    height="100%"
                    defaultValue={q.starterCode}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      wordWrap: "on",
                    }}
                  />
                </div>
              )}

              <button
                onClick={() => toggleStarter(i)}
                className="text-xs mt-1 text-blue-400 hover:underline"
              >
                {showFullStarter[i] ? "Hide Code" : "View Full Code"}
              </button>
            </div>

            {/* RESULT BADGE */}
            <span
              className={`absolute -top-6 right-2 mt-3 px-3 py-1 text-xs font-semibold rounded-lg border ${
                isCorrect
                  ? "bg-green-100 text-green-700 border-green-600"
                  : "bg-red-100 text-red-700 border-red-600"
              }`}
            >
              {isCorrect ? "Correct" : "Incorrect"}
            </span>

            {/* CODE COMPARISON */}
            <details className="mt-6">
              <summary className="cursor-pointer text-sm ">
                View Code Comparison
              </summary>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Correct Answer */}
                <div className="border border-zinc-700 rounded h-64 overflow-hidden">
                  <Editor
                    height="100%"
                    defaultValue={
                      correctAns?.correctAnswer || "// No correct answer"
                    }
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      wordWrap: "on",
                    }}
                  />
                </div>

                {/* User Answer */}
                <div
                  className={`border rounded h-64 overflow-hidden ${
                    isCorrect ? "border-green-700" : "border-red-700"
                  }`}
                >
                  <Editor
                    height="100%"
                    defaultValue={userAns?.code || "// No answer provided"}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      wordWrap: "on",
                    }}
                  />
                </div>
              </div>

              {/* REASON */}
              {correctAns?.reason && (
                <p className="text-xs text-zinc-300 mt-3 bg-zinc-800 p-2 rounded">
                  <strong>Reason:</strong> {correctAns.reason}
                </p>
              )}
            </details>
          </div>
        );
      })}
    </div>
  );
}
