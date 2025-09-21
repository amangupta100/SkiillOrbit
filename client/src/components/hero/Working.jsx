import React from "react";
import { Timeline } from "@/components/ui/timeline";
import { ScrollTimeline } from "../lightswind/scroll-timeline";

export function Working() {
  const data = [
    {
      title: "Take Skill Test",
      description:
        "Every candidate starts by taking a skill-based test tailored to the job role. This ensures only capable applicants move forward, saving time for everyone involved.",
    },
    {
      title: "Apply to Jobs",
      description:
        " Once the candidate clears the job-required skills test they can apply to the job according to the benchmark score set by recruiter. Once the candidate completes the test they can apply with the previous score to future job postings or may retake the test.",
    },
    {
      title: "Get Interviewed",
      description:
        "Shortlisted candidates are invited directly for further rounds of interviews.",
    },
  ];

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 py-12">
      <ScrollTimeline
        events={data}
        title="How It Works"
        subtitle=""
        progressIndicator={true}
        cardAlignment="alternating"
        revealAnimation="fade"
        cardEffect="shadow"
        smoothScroll={true}
        lineColor="#2A956B"
      />
    </div>
  );
}
