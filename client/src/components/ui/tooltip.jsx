"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

function TooltipProvider({ delayDuration = 0, ...props }) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

function Tooltip({ ...props }) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({ ...props }) {
  return <TooltipPrimitive.Trigger {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 6, // small offset for arrow spacing
  children,
  ...props
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          // 🎨 Style: White box, black text, smooth animation
          "bg-white text-black border border-gray-200 shadow-md border-r-0 rounded-md px-3 py-1.5 text-xs font-medium " +
            "animate-in fade-in-0 zoom-in-95 " +
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 " +
            "data-[side=bottom]:slide-in-from-top-1 " +
            "data-[side=top]:slide-in-from-bottom-1 " +
            "data-[side=left]:slide-in-from-right-1 " +
            "data-[side=right]:slide-in-from-left-1 z-50",
          className
        )}
        {...props}
      >
        {children}

        {/* ✅ Arrow adjusted — matches tooltip box perfectly */}
        <TooltipPrimitive.Arrow
          width={10}
          height={10}
          className="fill-white strok stroke-gray-200"
          style={{
            stroke: "#e5e7eb", // light gray border (tailwind border-gray-200)
            strokeWidth: 1,
            margin: 0,
            left: 0, // ✅ ensures no left border gap
          }}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
