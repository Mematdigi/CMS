"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLMotionProps<"div"> {
  hoverLift?: boolean;
  glow?: boolean;
  animate?: boolean;
  delay?: number;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverLift = false, glow = false, animate = true, delay = 0, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={animate ? { opacity: 0, y: 12 } : undefined}
        animate={animate ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "bg-card border border-border rounded-2xl shadow-sm",
          hoverLift && "hover-lift",
          glow && "card-glow",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";
