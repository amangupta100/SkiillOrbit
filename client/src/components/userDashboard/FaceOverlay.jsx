import React from 'react';

export default function FaceOverlay({ isAligned, opacity }) {
  const strokeColor = isAligned ? 'text-green-500' : 'text-red-500';

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        width="280"
        height="320"
        viewBox="0 0 280 320"
        className={`transition-all duration-300 ease-in-out ${opacity}`}
      >
        <ellipse
          cx="140"
          cy="160"
          rx="120"
          ry="160"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="10,8"
          className={strokeColor}
        />
      </svg>
    </div>
  );
}
