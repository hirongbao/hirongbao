import React from 'react';

export function SkeletonCard({ height = "h-[300px]" }: { height?: string }) {
  return (
    <div className="bg-white rounded-[2rem] p-6 lg:p-8 xl:p-10 shadow-sm border border-zinc-100 flex flex-col gap-6 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-zinc-200 shrink-0"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
          <div className="h-3 bg-zinc-100 rounded w-1/4"></div>
        </div>
      </div>
      <div className={`w-full ${height} bg-zinc-100 rounded-3xl`}></div>
      <div className="space-y-3">
        <div className="h-4 bg-zinc-100 rounded w-full"></div>
        <div className="h-4 bg-zinc-100 rounded w-5/6"></div>
        <div className="h-4 bg-zinc-100 rounded w-4/6"></div>
      </div>
    </div>
  );
}
