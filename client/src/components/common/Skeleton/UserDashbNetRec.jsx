"use client";
import React from "react";
import { usePathname } from "next/navigation";

export function DashboardSkeleton() {
  const pathname = usePathname();

  const pathsNottoShow = [
    "/userDashboard/test/instructions",
    "/userDashboard/test/verifyIdentity",
    "/userDashboard/test/testEnvironment",
    "/userDashboard/opportunities",
  ];

  if (pathsNottoShow.includes(pathname)) {
    return null;
  }
  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      {/* Sidebar - Exact replica of your screenshot */}
      <div className="w-[240px] bg-white border-r border-gray-200 p-6">
        <div className="space-y-6">
          {/* Skill section header */}
          <div className="h-5 w-16 bg-gray-200 rounded-sm mb-4"></div>

          {/* Menu items */}
          <div className="space-y-1">
            {[
              "Home",
              "Opportunities",
              "Skill Tests",
              "Applied",
              "Messages",
            ].map((item, index) => (
              <div key={index} className="flex items-center h-9">
                <div
                  className={`h-4 w-4 rounded-sm mr-3 bg-gray-200 ${
                    index === 1 ? "opacity-100" : "opacity-30"
                  }`}
                ></div>
                <div className="h-4 w-24 bg-gray-200 rounded-sm"></div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6"></div>

          {/* Start a Test section */}
          <div>
            <div className="h-5 w-32 bg-gray-200 rounded-sm mb-3"></div>
            <div className="h-9 w-full bg-gray-200 rounded-sm mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded-sm mb-4"></div>
            <div className="h-9 w-[104px] bg-gray-200 rounded-sm"></div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6"></div>

          {/* Previous Test Scores */}
          <div>
            <div className="h-5 w-40 bg-gray-200 rounded-sm mb-3"></div>
            <div className="h-4 w-32 bg-gray-200 rounded-sm"></div>
          </div>

          {/* Logout button */}
          <div className="absolute bottom-6 left-6 h-9 w-[192px] bg-gray-200 rounded-sm"></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Navbar - Exact replica */}
        <div className="h-16 border-b border-gray-200 bg-white flex items-center px-6">
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          </div>
        </div>

        {/* Main Content - Empty state matching your screenshot */}
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            {/* Empty state illustration placeholder */}
            <div className="h-64 w-full bg-gray-200 rounded-lg mb-6"></div>

            {/* "No tests taken yet" text */}
            <div className="text-center">
              <div className="h-5 w-48 bg-gray-200 rounded-sm mx-auto mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded-sm mx-auto"></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
