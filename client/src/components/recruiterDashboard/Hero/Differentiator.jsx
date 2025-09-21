"use client";

import { Card } from "@/components/ui/card";

export default function Differentiator() {
  const comparisons = [
    {
      title: "Test Before Apply",
      skillOrbit:
        "Required for job — ensures candidate quality upfront. Once give the test for required skill set and it's test score is valid for 2weeks or may retake a skill test",
      others:
        "Absent — recruiters must filter manually by reading resume which is time-consuming and increases recruiter's effort by 50%.",
    },
    {
      title: "Built-in Interview Tools",
      skillOrbit:
        "Live coding + video + chat in one place. and in a most secured anti-cheating environment",
      others:
        "Requires external tools like Zoom, Google Meet and cheating is possible as there are many AI tools which can output the interviewer's question in real-time.",
    },
    {
      title: "Cheat-Proof Testing",
      skillOrbit: "Tab detection, copy-blocking, optional webcam proctoring.",
      others: "Basic MCQs — often easy to bypass.",
    },
    {
      title: "Hiring Efficiency",
      skillOrbit: "80% less screening time, 3x faster shortlist.",
      others: "Slow funnel, recruiter burden high.",
    },
    {
      title: "Faster Hiring Cycle",
      skillOrbit: "Save 80% of manual effort. Hire in days, not weeks",
      others: "300+ resumes → 20-25 interviews → 1 hire — pure time drain",
    },
    {
      title: "Score-Based Filtering",
      skillOrbit: "Score-Based Filtering",
      others: "No such filters — manual shortlisting",
    },
    {
      title: "ATS Resume Filtering",
      skillOrbit: "Auto-sort resumes with >90% ATS score",
      others: "Recruiters have to manually scan resumes",
    },
  ];

  return (
    <div className="w-full py-20 sm:py-8 max-w-[1450px] mx-auto p-4">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-tr from-neutral-800 to-neutral-200 font-bold mb-4">
          Why Choose Us?
        </h2>
        <p className="text-gray-500 text-lg mb-20 max-w-2xl mx-auto">
          We built this platform to reduce the hiring duration by 50% and also
          reduces the recruiter effort
        </p>
      </div>
      <Card className="rounded-xl overflow-hidden bg-gradient-to-b from-[#2A956B] to-gray-500 text-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left border-collapse">
            <colgroup>
              <col className="w-1/3" />
              <col className="w-1/3" />
              <col className="w-1/3" />
            </colgroup>
            <thead>
              <tr className="bg-white/10 text-white text-lg">
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
              {comparisons.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-white/10 transition align-top"
                >
                  <td className="p-4 border-b border-r border-white text-center align-middle whitespace-normal break-words">
                    {item.title}
                  </td>
                  <td className="p-4 border-b border-r border-white text-center align-middle whitespace-normal break-words">
                    {item.skillOrbit}
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
