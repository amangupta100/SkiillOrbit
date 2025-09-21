"use client";
import { Button } from "@/components/ui/button";
import { GoogleGenerativeAI } from "@google/generative-ai";

export function InstructionsPage({ onStartTest }) {
  const startTest = async () => {
    await onStartTest();
  };

  return (
    <div className="flex items-center justify-center min-h-[100vh] overflow-y-auto py-6">
      <div className=" text-black px-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-4 mt-20 text-center">
          Instructions for test
        </h1>

        <div className="mb-6 mt-2 text-black text-left space-y-4">
          <h2 className="text-xl font-semibold">Before you begin:</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Ensure you're in a quiet, well-lit room alone</li>
            <li>Close all other applications and browser tabs</li>
            <li>
              Make sure your face is clearly visible to the camera and focused
              towards the camera. After 1 warning by the system,you will be
              terminated from the test.
            </li>
          </ul>
        </div>

        <div className="my-4 text-left">
          <h1 className="text-lg font-semibold">Not to do during test</h1>
          <ul className="list-disc mt-4 pl-5 space-y-2">
            <li>
              Exiting full-screen mode is strictly prohibited. The system will
              automatically reconnect you even in case of network disconnection
              - no manual action is required. Any attempt to exit full-screen
              mode will result in immediate test termination. Accumulating more
              than two cheating violations will permanently block you from
              taking future tests.
            </li>
            <li>Copying, pasting, or taking screenshots</li>
            <li>Using secondary devices (phones, tablets, etc.)</li>
            <li>Receiving assistance from another person</li>
            <li>Looking away from screen for extended periods</li>
          </ul>
        </div>

        <div className="my-4">
          <h1 className="font-semibold text-lg italic">Note that :</h1>
          <h1>
            We are just strictly securing the environment just for you because
            it helps you to stand you from under-qualified profiles and help you
            to easily reached out by recruiters.
          </h1>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 text-black rounded-lg">
          <h3 className="font-medium mb-2">⚠️ Important Security Notice:</h3>
          <p>
            Our system will automatically detect (AI proctored) and flag any
            suspicious activity.
          </p>
        </div>

        <div className="mb-6">
          <Button onClick={startTest}>Start Test</Button>
        </div>
      </div>
    </div>
  );
}
