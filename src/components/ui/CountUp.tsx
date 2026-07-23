"use client";

import React, { useEffect, useRef } from "react";
import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";

export interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  formatter?: (n: number) => string;
}

export function CountUp({ value, duration = 1, className, prefix = "", suffix = "", formatter }: CountUpProps) {
  const motionValue = useMotionValue(0);
  const spanRef = useRef<HTMLSpanElement>(null);

  useMotionValueEvent(motionValue, "change", (latest) => {
    if (spanRef.current) {
      const rounded = Math.round(latest);
      spanRef.current.textContent = `${prefix}${formatter ? formatter(rounded) : rounded.toLocaleString()}${suffix}`;
    }
  });

  useEffect(() => {
    const controls = animate(motionValue, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [value, duration, motionValue]);

  return <span ref={spanRef} className={className}>{prefix}0{suffix}</span>;
}
