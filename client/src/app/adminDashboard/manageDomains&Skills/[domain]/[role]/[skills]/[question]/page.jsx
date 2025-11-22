"use client";

import React, { useEffect, useState } from "react";
import API from "@/utils/interceptor";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function QuestionDetailPage() {
  const params = useParams();
  const { question: questionId } = params;

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQuestion = async () => {
    try {
      const res = await API.get(
        `/admin/genQuestion/getQtnDetails/${questionId}`
      );
      setQuestion(res.data.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!question) return <p>No Question Found</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">
        Q{question.serialNumber}. {question.title}
      </h1>

      <Badge className="mb-3 bg-gray-100 text-gray-600 border">
        {question.difficulty}
      </Badge>

      <p className="text-gray-600 mb-4">{question.description}</p>

      <h2 className="text-lg font-semibold mt-4">Skills</h2>
      <div className="flex gap-2 mt-1">
        {question.skills.map((s, i) => (
          <Badge key={i}>{s}</Badge>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-4">Topics Covered</h2>
      <div className="flex gap-2 mt-1">
        {question.topicsCovered.map((t, i) => (
          <Badge key={i}>{t}</Badge>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-4">Starter Code</h2>
      <pre className="border p-3 rounded bg-black text-white">
        {question.starterCode || "No starter code provided"}
      </pre>

      <h2 className="text-lg font-semibold mt-4">Solution Code</h2>
      <pre className="border p-3 rounded bg-gray-900 text-white">
        {question.solutionCode || "No solution provided"}
      </pre>
    </div>
  );
}
