"use client";
import Image from "next/image";
import { FeaturesData } from "./FeaturesData";
import { useEffect } from "react";

export default function Features() {
  useEffect(() => {
    document.body.style.overflowX = "hidden";
  }, []);

  return (
    <section className="min-h-fit bg-white flex flex-col gap-10 md:gap-20 px-4 sm:px-6 md:px-14 py-12 md:py-16">
      {/* Features Section - Redesigned */}
      <div className="w-full max-w-8xl mx-auto text-center">
        <h2 className="text-3xl animate- sm:text-4xl md:text-5xl font-bold leading-tight  bg-clip-text text-transparent bg-gradient-to-tr from-neutral-800 to-neutral-200  mb-3 sm:mb-4">
          What Makes Us Different?
        </h2>

        <p className="text-gray-500 text-base sm:text-lg mb-8 sm:mb-12 max-w-3xl md:max-w-5xl mx-auto px-2 sm:px-0">
          We built this platform for smoother and quick hiring. Every applicant
          takes a skill-based test before applying, receives instant feedback.
          No ghosting, no spam — just a smarter & faster hiring pipeline.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 px-2 sm:px-0">
          {FeaturesData.map((elem) => (
            <div
              className="flex justify-center min-h-[180px] sm:min-h-[200px] pb-4 sm:pb-5 rounded-xl py-3 sm:py-4 px-3 sm:px-4 flex-col border-[1.5px] border-zinc-300 hover:border-zinc-500 duration-300 transition-colors"
              key={elem.id}
            >
              <Image
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto"
                alt={elem.title}
                src={elem.image}
                width={64}
                height={64}
              />
              <h1 className="text-lg sm:text-xl font-bold mt-2 sm:mt-3">
                {elem.title}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {elem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
