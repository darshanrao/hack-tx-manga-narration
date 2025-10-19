"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "./utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  speedControl = false,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & { speedControl?: boolean }) {
  const rootProps: React.ComponentProps<typeof SliderPrimitive.Root> = {
    "data-slot": "slider",
    min,
    max,
    className: cn(
      "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
      className,
    ),
    ...props,
  };

  // Ensure we don't pass both value and defaultValue at the same time
  if (typeof value !== "undefined") {
    (rootProps as any).value = value;
  } else if (typeof defaultValue !== "undefined") {
    (rootProps as any).defaultValue = defaultValue;
  }

  return (
    <SliderPrimitive.Root
      {...rootProps}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-slate-700 relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-4 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            speedControl 
              ? "bg-gradient-to-r from-green-400 to-emerald-500 absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
              : "bg-gradient-to-r from-blue-400 to-purple-500 absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className="border-blue-400 bg-white ring-ring/50 block size-4 shrink-0 rounded-full border shadow-lg transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
      />
    </SliderPrimitive.Root>
  );
}

export { Slider };


