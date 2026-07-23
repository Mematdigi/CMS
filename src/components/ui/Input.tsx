import React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-3.5 py-2 bg-secondary border border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-xs outline-none transition-all placeholder:text-muted-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full px-3.5 py-2 bg-secondary border border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-xs outline-none transition-all placeholder:text-muted-foreground min-h-20",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full px-3.5 py-2 bg-secondary border border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-xs outline-none transition-all font-medium",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";
