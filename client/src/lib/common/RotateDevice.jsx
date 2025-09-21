"use client";
import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const RotateDevice = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 text-center">
      <div className="w-48 h-48 mb-4">
        <DotLottieReact
          src="https://lottie.host/b7ed8f8b-a88c-4187-8bde-cce61628c166/rDIlpfSfFb.lottie"
          loop
          autoplay
        />
      </div>
      <h1 className="text-2xl font-bold mb-2">Rotate Your Device</h1>
      <p className="text-gray-600 max-w-sm">
        Please open the interview environment on a larger screen device
        (Laptop/Desktop or Tablet ≥768px).
      </p>
    </div>
  );
};

export default RotateDevice;
