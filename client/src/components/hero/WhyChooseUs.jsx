"use client";

import { Card } from "@/components/ui/card";

export default function WhyChooseUs() {
  const comparisonData = [
    {
      label: "Test-to-Interview Pipeline",
      ours: "One test* → Apply → Interview → Get hired — all in one flow.",
      others: "Multiple platforms, external tests, broken process.",
    },
    {
      label: "Application Method",
      ours: "Apply only after proving your skills — fair & focused.",
      others:
        "Apply with resume, hope someone reads it And Mostly Recruiters spends 3-5 seconds on resumes.",
    },
    {
      label: "Mock Interview",
      ours: "AI-driven mock interviews with SkillOrbit's Virtual Interviewer Jia — practice real-world questions before facing recruiters.",
      others:
        "No structured mock interviews. Candidates enter interviews unprepared and anxious.",
    },
    {
      label: "Feedback",
      ours: "Instant score + feedback after test. Know where you stand.",
      others: "No response, no feedback — stuck guessing.",
    },
  ];

  return (
    <div className="w-full py-8 mx-auto p-4">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-tr from-neutral-800 to-neutral-200 font-bold mb-4">
          Why Choose Us?
        </h2>
        <p className="text-gray-500 text-lg mb-20 max-w-2xl mx-auto">
          We built this platform to fix what's broken in hiring — transparency,
          skill-first filtering, and fast recruiter response.
        </p>
      </div>
      <Card className="rounded-xl overflow-hidden bg-gradient-to-b from-[#2A956B] to-gray-500 text-white shadow-lg">
        {/* 👇 overflow-x allows scrolling on small screens */}
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/10 text-white text-base sm:text-lg">
                <th className="p-4 border-b border-r border-white font-bold text-center">
                  Feature
                </th>
                <th className="p-4 border-b border-r border-white font-bold text-center">
                  SkillOrbit
                </th>
                <th className="p-4 border-b border-white font-bold text-center">
                  Other Platforms
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-white/10 transition align-top"
                >
                  <td className="p-4 border-b border-r border-white text-center align-middle whitespace-normal break-words">
                    {item.label}
                  </td>
                  <td className="p-4 border-b border-r border-white text-center align-middle whitespace-normal break-words">
                    {item.ours}
                  </td>
                  <td className="p-4 border-b border-white text-center align-middle whitespace-normal break-words">
                    {item.others}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
