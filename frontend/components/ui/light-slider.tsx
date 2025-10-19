'use client'

import * as React from 'react';
import { cn } from './utils';

interface LightSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export function LightSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  ariaLabel,
  disabled = false,
}: LightSliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={Number.isFinite(value) ? Math.min(Math.max(value, min), max) : 0}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={cn('cursor-pointer h-2 w-full appearance-none bg-slate-700 rounded-full light-slider', className)}
      aria-label={ariaLabel}
      disabled={disabled}
    />
  );
}


