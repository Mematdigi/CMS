import React from "react";

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Welcome Banner Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-800 rounded-xl" />
          <div className="h-4 w-96 bg-slate-800/60 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-slate-800 rounded-xl" />
      </div>

      {/* Grid Cards Metrics Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden"
          >
            <div className="space-y-3 w-3/4">
              <div className="h-3 w-24 bg-slate-800 rounded-md" />
              <div className="h-8 w-20 bg-slate-850 rounded-lg" />
              <div className="h-3 w-36 bg-slate-800/60 rounded-md" />
            </div>
            <div className="w-12 h-12 bg-slate-800/50 rounded-xl shrink-0" />
          </div>
        ))}
      </div>

      {/* Charts Panels Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Panel 1 */}
        <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="h-4 w-48 bg-slate-800 rounded-md" />
          <div className="h-80 bg-slate-900/20 border border-slate-850 rounded-xl flex items-end justify-between p-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className="w-4 bg-slate-800/40 rounded-t-md"
                style={{ height: `${20 + Math.random() * 60}%` }}
              />
            ))}
          </div>
        </div>

        {/* Chart Panel 2 */}
        <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="h-4 w-48 bg-slate-800 rounded-md" />
          <div className="h-80 bg-slate-900/20 border border-slate-850 rounded-xl flex items-center justify-center">
            {/* Donut shape skeleton */}
            <div className="w-40 h-40 border-8 border-slate-800/40 border-t-indigo-500/20 rounded-full animate-spin" />
          </div>
        </div>

        {/* Chart Panel 3 */}
        <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="h-4 w-48 bg-slate-800 rounded-md" />
          <div className="h-80 bg-slate-900/20 border border-slate-850 rounded-xl space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="h-3 w-16 bg-slate-800 rounded-md" />
                <div className="flex-1 h-3.5 bg-slate-850 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-slate-800/50 rounded-full"
                    style={{ width: `${30 + idx * 15}%` }}
                  />
                </div>
                <div className="h-3 w-8 bg-slate-800 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Chart Panel 4 */}
        <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="h-4 w-48 bg-slate-800 rounded-md" />
          <div className="h-80 bg-slate-900/20 border border-slate-850 rounded-xl space-y-4 p-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800/50 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 bg-slate-800 rounded-md" />
                  <div className="h-2.5 w-2/3 bg-slate-850 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaigns list Skeleton */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="h-4 w-60 bg-slate-800 rounded-md" />
        <div className="border border-slate-850 rounded-xl overflow-hidden">
          <div className="h-10 bg-slate-850/40 border-b border-slate-850" />
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-4 items-center">
                <div className="h-3 w-3/4 bg-slate-800 rounded-md" />
                <div className="h-3 w-1/2 bg-slate-850 rounded-md" />
                <div className="h-3 w-1/3 bg-slate-850 rounded-md" />
                <div className="h-5 w-12 bg-slate-800/50 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
