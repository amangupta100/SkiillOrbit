import React from "react";

const ProfileSkeleton = () => {
  return (
    <div className="ml-0 p-3">
      {" "}
      {/* keep left padding same as sidebar width */}
      {/* Profile Header */}
      <div className="bg-white shadow rounded-2xl p-6 mb-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-300" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/4 bg-gray-300 rounded" />
            <div className="h-3 w-1/6 bg-gray-200 rounded" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="h-3 w-5/6 bg-gray-200 rounded" />
          <div className="h-3 w-4/6 bg-gray-200 rounded" />
          <div className="h-3 w-3/6 bg-gray-200 rounded" />
        </div>

        <div className="mt-4 h-10 w-40 bg-gray-300 rounded" />
      </div>
      {/* Education Section */}
      <div className="bg-white shadow rounded-2xl p-6 mb-6 animate-pulse">
        <div className="h-4 w-1/5 bg-gray-300 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-1/2 bg-gray-200 rounded" />
        </div>
      </div>
      {/* Skills Section */}
      <div className="bg-white shadow rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-1/5 bg-gray-300 rounded mb-4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 w-20 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
