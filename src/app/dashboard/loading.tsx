import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Welcome Banner Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Grid Cards Metrics Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden"
          >
            <div className="space-y-3 w-3/4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="w-12 h-12 shrink-0 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Charts Panels Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Panel 1 */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <Skeleton className="h-4 w-48" />
          <div className="h-80 bg-secondary/30 border border-border rounded-xl flex items-end justify-between p-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className="w-4 bg-secondary rounded-t-md animate-shimmer"
                style={{ height: `${20 + Math.random() * 60}%` }}
              />
            ))}
          </div>
        </div>

        {/* Chart Panel 2 */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <Skeleton className="h-4 w-48" />
          <div className="h-80 bg-secondary/30 border border-border rounded-xl flex items-center justify-center">
            <div className="w-40 h-40 border-8 border-secondary border-t-indigo-500/40 rounded-full animate-spin-slow" />
          </div>
        </div>

        {/* Chart Panel 3 */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <Skeleton className="h-4 w-48" />
          <div className="h-80 bg-secondary/30 border border-border rounded-xl space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <Skeleton className="h-3 w-16" />
                <div className="flex-1 h-3.5 bg-secondary rounded-full overflow-hidden relative">
                  <div
                    className="h-full animate-shimmer rounded-full"
                    style={{ width: `${30 + idx * 15}%` }}
                  />
                </div>
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>

        {/* Chart Panel 4 */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <Skeleton className="h-4 w-48" />
          <div className="h-80 bg-secondary/30 border border-border rounded-xl space-y-4 p-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-2.5 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaigns list Skeleton */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <Skeleton className="h-4 w-60" />
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="h-10 bg-secondary/40 border-b border-border" />
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-4 items-center">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
