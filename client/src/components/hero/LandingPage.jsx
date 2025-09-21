"use client";
import { cn } from "@/lib/utils";
import React from "react";
import banner from "../../assests/programmer-animate.svg";
import Image from "next/image";
import { PointerHighlight } from "../ui/pointer-highlight";
import { Button } from "../ui/button";

export default function LandingPage() {
  return (
    <div className="relative lg:px-3 px-5 py-0 sm:px-7 flex flex-col-reverse lg:flex-row w-full mt-14 justify-center items-center  min-h-[calc(100vh-68px)]">
      {/* Grid background */}
      <div
        className={cn(
          "absolute inset-0 -z-10",
          "[background-size:32px_32px]",
          "opacity-[10%]",
          "[background-image:linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]"
        )}
      />

      {/* Content section */}
      <div className="w-full lg:w-[52%] flex flex-col justify-center">
        <h1 className="text-4xl z-[40] sm:text-5xl md:text-6xl leading-tight bg-clip-text text-transparent bg-gradient-to-tr from-neutral-800 to-neutral-300 font-bold">
          Take the Test, Land the
          <PointerHighlight
            rectangleClassName="bg-white border-neutral-400 rounded-lg z-[100] dark:border-neutral-800 leading-loose"
            pointerClassName="text-[#2A956B] h-5 w-5"
            containerClassName="inline-block mx-1"
          >
            <span className="relative px-3 z-[100] bg-clip-text text-transparent bg-gradient-to-tr from-neutral-800 to-neutral-200">
              Job Quickly.
            </span>
          </PointerHighlight>
        </h1>
        <div className="w-[85%] ">
          <p className="text-base sm:text-lg text-gray-500 mt-5">
            Prove your skills, and apply with confidence. Get faster responses
            from recruiters — no guesswork, just skill-first hiring.
          </p>
        </div>

        <Button
          className="text-base cursor-pointer font-light w-fit px-4 mt-4"
          onClick={() => (window.location.href = "/login/job-seeker")}
        >
          Get Started
        </Button>
      </div>

      {/* Image section */}
      <div className="flex items-center justify-center w-full lg:w-[45%]">
        <Image
          src={banner}
          className="w-full max-w-[500px] z-[40] h-auto lg:max-w-[600px]"
          alt="Banner_img"
          width={600}
          height={600}
        />
      </div>
    </div>
  );
}
