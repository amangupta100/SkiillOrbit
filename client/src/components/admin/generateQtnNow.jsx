"use client";

import API from "@/utils/interceptor";
import { X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const GenerateNow = ({ closeModal, skill, domain }) => {
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);

  const [difficulty, setDifficulty] = useState("medium"); // default

  const difficultyOptions = ["easy", "medium", "hard", "expert"];

  const handleCountChange = (value) => {
    if (value > 10) {
      toast.warning("Maximum 10 questions allowed");
      value = 10;
    }
    if (value < 1) value = 1;

    setCount(value);
  };

  const handleGenQuestion = async () => {
    try {
      setLoading(true);

      await API.post("/admin/genQuestion/genQtnInstantly", {
        skills: decodeURIComponent(skill),
        questionCount: count,
        difficulty: difficulty, // ⬅ included
        domain,
      });

      toast.success(`Generated ${count} ${difficulty} questions`);
      closeModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center items-center h-screen overflow-y-auto py-8 backdrop-blur-md bg-black/60">
      <div className="w-[90%] sm:w-[75%] md:w-[60%] lg:w-[35%] rounded-lg relative py-6 px-5 bg-white max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Close Button */}
        <X
          onClick={closeModal}
          className="absolute top-3 right-3 cursor-pointer hover:scale-110 transition"
        />

        {/* Heading */}
        <h1 className="text-center text-lg mb-4 font-semibold">
          Generate Questions
        </h1>

        {/* Skill Info */}
        <p className="text-sm text-gray-500 text-center mb-6">
          Skill:{" "}
          <span className="font-semibold">{decodeURIComponent(skill)}</span>
        </p>

        {/* Difficulty Dropdown */}
        <div className="flex flex-col gap-2 mb-5 px-2">
          <label className="text-sm font-medium text-gray-700">
            Select Difficulty
          </label>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between text-gray-700"
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                <span>▼</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-full z-[1001] bg-white"
              align="start"
            >
              {difficultyOptions.map((d) => (
                <DropdownMenuItem
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="capitalize cursor-pointer"
                >
                  {d}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Question Count Input */}
        <div className="flex flex-col gap-4 px-2">
          <label className="text-sm font-medium text-gray-700">
            Number of Questions: <span className="font-semibold">{count}</span>
          </label>

          <input
            type="range"
            min={1}
            max={10}
            value={count}
            onChange={(e) => handleCountChange(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />

          <input
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={(e) => handleCountChange(Number(e.target.value))}
            className="border rounded-md px-3 py-2 w-24 mx-auto text-center shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <p className="text-xs text-gray-400 text-center">
            Maximum allowed: <strong>10</strong> questions.
          </p>
        </div>

        {/* Generate Button */}
        <div className="mt-6 flex justify-center">
          <Button
            disabled={loading}
            onClick={handleGenQuestion}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
          >
            {loading
              ? "Generating..."
              : `Generate ${count} ${difficulty} questions`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateNow;
