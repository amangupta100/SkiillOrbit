"use client";

import React from "react";

const JobDetailsSkeleton = () => {
  return (
    <div className="animate-pulse px-6 py-4 space-y-8 w-full">
      {/* ============ Header Card ============ */}
      <div className="border border-zinc-200 p-6 rounded-xl shadow-sm space-y-4">
        {/* Logo + Title + Company + Tags */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-zinc-300 rounded-full" />
            <div className="space-y-2">
              <div className="w-48 h-5 bg-zinc-300 rounded" />
              <div className="w-32 h-3 bg-zinc-200 rounded" />
            </div>
          </div>

          {/* Right section badges */}
          <div className="flex gap-2">
            <div className="w-16 h-6 bg-zinc-200 rounded-full" />
            <div className="w-20 h-6 bg-zinc-200 rounded-full" />
          </div>
        </div>

        {/* Tech tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="w-16 h-6 bg-zinc-200 rounded-full" />
          <div className="w-20 h-6 bg-zinc-200 rounded-full" />
          <div className="w-24 h-6 bg-zinc-200 rounded-full" />
          <div className="w-16 h-6 bg-zinc-200 rounded-full" />
        </div>

        {/* Info Row */}
        <div className="flex flex-wrap justify-between mt-6">
          <div className="w-28 h-4 bg-zinc-200 rounded" />
          <div className="w-32 h-4 bg-zinc-200 rounded" />
          <div className="w-24 h-4 bg-zinc-200 rounded" />
          <div className="w-28 h-4 bg-zinc-200 rounded" />
        </div>

        {/* Benchmark + small details */}
        <div className="w-40 h-4 bg-zinc-300 rounded mt-4" />
      </div>

      {/* ============ Grid Layout ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: About + Requirements */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="border border-zinc-200 p-5 rounded-xl space-y-3">
            <div className="w-44 h-5 bg-zinc-300 rounded" />
            <div className="space-y-2">
              <div className="w-full h-3 bg-zinc-200 rounded" />
              <div className="w-full h-3 bg-zinc-200 rounded" />
              <div className="w-4/5 h-3 bg-zinc-200 rounded" />
              <div className="w-3/4 h-3 bg-zinc-200 rounded" />
              <div className="w-1/2 h-3 bg-zinc-200 rounded" />
            </div>
          </div>

          {/* Requirements */}
          <div className="border border-zinc-200 p-5 rounded-xl space-y-3">
            <div className="w-44 h-5 bg-zinc-300 rounded" />
            <div className="space-y-2">
              <div className="w-full h-3 bg-zinc-200 rounded" />
              <div className="w-5/6 h-3 bg-zinc-200 rounded" />
              <div className="w-4/6 h-3 bg-zinc-200 rounded" />
              <div className="w-2/3 h-3 bg-zinc-200 rounded" />
            </div>
          </div>
        </div>

        {/* Right: Skills & Preferences */}
        <div className="space-y-5">
          {/* Skills Mandatory */}
          <div className="border border-zinc-200 p-4 rounded-xl space-y-3">
            <div className="w-40 h-4 bg-zinc-300 rounded" />
            <div className="flex flex-wrap gap-2">
              <div className="w-20 h-6 bg-zinc-200 rounded-full" />
              <div className="w-16 h-6 bg-zinc-200 rounded-full" />
              <div className="w-24 h-6 bg-zinc-200 rounded-full" />
            </div>
          </div>

          {/* Skills Optional */}
          <div className="border border-zinc-200 p-4 rounded-xl space-y-3">
            <div className="w-40 h-4 bg-zinc-300 rounded" />
            <div className="flex flex-wrap gap-2">
              <div className="w-24 h-6 bg-zinc-200 rounded-full" />
              <div className="w-16 h-6 bg-zinc-200 rounded-full" />
              <div className="w-20 h-6 bg-zinc-200 rounded-full" />
            </div>
          </div>

          {/* Preferences */}
          <div className="border border-zinc-200 p-4 rounded-xl space-y-3">
            <div className="w-40 h-4 bg-zinc-300 rounded" />
            <div className="space-y-2">
              <div className="w-28 h-3 bg-zinc-200 rounded" />
              <div className="w-36 h-3 bg-zinc-200 rounded" />
            </div>
          </div>

          {/* Perks */}
          <div className="border border-zinc-200 p-4 rounded-xl space-y-3">
            <div className="w-40 h-4 bg-zinc-300 rounded" />
            <div className="space-y-2">
              <div className="w-28 h-3 bg-zinc-200 rounded" />
              <div className="w-36 h-3 bg-zinc-200 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* ============ Bottom Buttons ============ */}
      <div className="flex justify-end gap-4 mt-6">
        <div className="w-28 h-10 bg-zinc-300 rounded-lg" />
        <div className="w-28 h-10 bg-zinc-300 rounded-lg" />
      </div>
    </div>
  );
};

export default JobDetailsSkeleton;
