"use client";
import React from "react";

export default function ApplicantSkeleton({ count = 6 }) {
  return (
    <div className="border-[1.6px] rounded-lg p-2 bg-zinc-100 border-zinc-200 flex flex-wrap gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="border-[1.6px] md:max-w-72 w-full flex items-center rounded-lg border-zinc-200 bg-white p-3"
        >
          {/* Avatar skeleton */}
          <div className="w-20 h-14 rounded-full bg-gray-200"></div>

          {/* Text skeleton */}
          <div className="flex flex-col ml-3 w-full">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
