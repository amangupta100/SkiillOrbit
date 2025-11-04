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
import API from "@/utils/interceptor";
import { toast } from "sonner";

const COLORS = ["#4ade80", "#f87171"];

export default function TestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch test details
  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await API.get(`/job-seeker/tests/getTestDetails/${id}`);
        if (res.data?.success) {
          setTestData(res.data.data);
        } else {
          toast.error("Failed to fetch test details");
        }
      } catch (err) {
        console.error("Error fetching test:", err);
        toast.error("Error fetching test details");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchDetails();
  }, [id]);

  // 🔄 Darker skeleton loader for entire page
  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse min-h-screen ">
        <div className="flex justify-between items-center">
          <div className="h-8 w-1/3 bg-zinc-400 rounded-md"></div>
          <div className="h-10 w-28 bg-zinc-400 rounded-md"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 w-full bg-zinc-400 rounded-lg"></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-72 w-full bg-zinc-400 rounded-lg"></div>
          ))}
        </div>

        <div className="space-y-6 mt-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-1/3 bg-zinc-400 rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-64 w-full bg-zinc-400 rounded-lg"></div>
                <div className="h-64 w-full bg-zinc-400 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!testData)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-400 bg-zinc-900">
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
    canswer = [],
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
      correct: canswer[i]?.code?.trim() === ans?.code?.trim() ? 100 : 0,
      incorrect: canswer[i]?.code?.trim() !== ans?.code?.trim() ? 100 : 0,
    })),
  };

  return (
    <div className="p-6 min-h-screen">
      {/* === Header === */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Test Details</h1>
        <Button
          onClick={() => router.push("/job-seekerDashboard/test")}
          className="bg-zinc-800 hover:bg-zinc-700 text-white"
        >
          Back
        </Button>
      </div>

      {/* === Test Info === */}
      <div className="mb-6  space-y-2">
        <p>
          <span className="font-medium ">Skills:</span>{" "}
          {skills.length ? skills.join(", ") : "N/A"}
        </p>
        <p>
          <span className="font-medium ">Duration:</span> {duration || "N/A"}
        </p>
        <p>
          <span className="font-medium">Attempted At:</span>{" "}
          {submittedAt
            ? new Date(submittedAt).toLocaleString()
            : "Not submitted"}
        </p>
      </div>

      {/* === Summary Cards === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className=" border-zinc-400">
          <CardHeader className="pb-2">
            <h3 className="font-medium">Total Questions</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold ">{totalQuestions}</p>
          </CardContent>
        </Card>

        <Card className=" border-zinc-400">
          <CardHeader className="pb-2">
            <h3 className="font-medium">Correct Answers</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-400">{correctCount}</p>
          </CardContent>
        </Card>

        <Card className=" border-zinc-400">
          <CardHeader className="pb-2">
            <h3 className="font-medium">Score</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-400">{scorePercent}%</p>
          </CardContent>
        </Card>
      </div>

      {/* === Charts === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className=" border-zinc-400 p-4">
          <h3 className="text-lg font-medium mb-4 ">Answer Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {chartData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#27272a",
                    border: "none",
                    color: "#fff",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className=" border-zinc-400 p-4">
          <h3 className="text-lg font-medium mb-4 ">Question Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="name" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#27272a",
                    border: "none",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar dataKey="correct" fill="#4ade80" />
                <Bar dataKey="incorrect" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* === Code Comparison === */}
      <h2 className="mt-10 mb-4 text-lg font-semibold">Answer Comparison</h2>
      {uanswer.length ? (
        uanswer.map((ans, i) => {
          const isCorrect = canswer[i]?.code?.trim() === ans?.code?.trim();
          const title =
            questions && questions[i]?.title
              ? questions[i].title
              : `Question ${i + 1}`;
          return (
            <div
              key={i}
              className={`p-4 border relative rounded mb-4 border-zinc-400`}
            >
              <h2> Question {i + 1} </h2>
              <h3 className="font-semibold mb-1 ">{title}</h3>
              <span
                className={`absolute -top-[12px] right-3  px-3 py-1 text-xs font-semibold rounded-full border ${
                  isCorrect
                    ? "bg-green-100 text-green-600 border-green-600"
                    : "bg-red-100 text-red-600 border-red-600"
                }`}
              >
                {isCorrect ? "Correct" : "Incorrect"}
              </span>
              <details>
                <summary className="cursor-pointer">
                  View Code Comparison
                </summary>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Correct Answer */}
                  <div className="border border-zinc-800 rounded overflow-hidden">
                    <div className="p-2 border-b border-zinc-700">
                      <h4 className="font-medium">Correct Answer</h4>
                    </div>
                    <div className="h-64">
                      <Editor
                        height="100%"
                        defaultValue={canswer[i]?.code || ""}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 14,
                          lineNumbers: "off",
                        }}
                      />
                    </div>
                  </div>

                  {/* User Answer */}
                  <div
                    className={`border rounded overflow-hidden ${
                      isCorrect ? "border-green-800" : "border-red-800"
                    }`}
                  >
                    <div
                      className={`p-2 border-b ${
                        isCorrect ? "bg-green-950/60" : "bg-red-950/60"
                      }`}
                    >
                      <h4 className="font-medium">Your Answer</h4>
                    </div>
                    <div className="h-64">
                      <Editor
                        height="100%"
                        defaultValue={ans?.code || ""}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 14,
                          lineNumbers: "off",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </details>
            </div>
          );
        })
      ) : (
        <p className="text-zinc-400">No answers available</p>
      )}
    </div>
  );
}
