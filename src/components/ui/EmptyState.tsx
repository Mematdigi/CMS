"use client";

import React from "react";
import { motion } from "framer-motion";
import { type LucideIcon, Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center gap-3 py-12 text-center"
    >
      <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center text-muted-foreground">
        <Icon className="w-7 h-7" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground text-sm">{title}</p>
        {description && <p className="text-muted-foreground text-xs max-w-xs">{description}</p>}
      </div>
      {action}
    </motion.div>
  );
}
