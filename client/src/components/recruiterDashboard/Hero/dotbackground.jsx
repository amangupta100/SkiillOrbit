import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";
import banner from '@/assests/resume-folder-animate.svg'
import { PointerHighlight } from "@/components/ui/pointer-highlight";

export function DotBackgroundDemo() {
  return (
    <div className="relative px-4 sm:px-6 py-8 sm:py-12 lg:py-0 flex flex-col-reverse lg:flex-row w-full justify-between items-center min-h-[calc(100vh-68px)]">
      {/* Dot background - should be behind everything */}
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:32px_32px]",
          "opacity-[10%]",
          "[background-image:linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]"
        )}
      />
    
      <div className="w-full flex flex-col justify-center z-10">
        <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-col-reverse lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Content - will appear second on mobile, first on lg+ */}
          <div className="w-full lg:w-[49%] flex flex-col justify-center lg:text-left px-2 sm:px-0">
            <h1 className="text-4xl mt-3  md:text-5xl lg:text-6xl leading-tight bg-clip-text text-transparent bg-gradient-to-tr from-neutral-800 to-neutral-300 font-bold">
              Hire Faster, Smarter & 
              <PointerHighlight 
                rectangleClassName="bg-white/50 border-neutral-300 px-5 dark:border-neutral-800 leading-loose"
                pointerClassName="text-[#2A956B] h-5 w-5"
                containerClassName="inline-block mx-3">            
                <span className="relative z-[100] bg-clip-text text-transparent bg-gradient-to-tr from-neutral-800 to-neutral-200">
                  Fairer.
                </span>
              </PointerHighlight>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 mt-4 sm:mt-5 max-w-2xl mx-auto lg:mx-0">
              Post jobs with clear skill requirements, get pre-tested and qualified candidates instantly.
              No more resume clutter. No more wasted interviews.
            </p>
            <button className="w-full sm:w-[150px] rounded-lg bg-primary hover:bg-primary/80 text-primary-foreground px-4 mt-4 sm:mt-5 py-3 mx-auto lg:mx-0">
              Post a Job Now
            </button>
          </div>

          {/* Right Image - will appear first on mobile, second on lg+ */}
          <div className="w-full lg:w-[45%] flex items-center justify-center">
            <Image
              src={banner} 
              alt="Recruiter dashboard"
              className="w-full max-w-md lg:max-w-none"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}