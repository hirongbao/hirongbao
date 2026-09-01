import React from 'react';

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center pt-20 animate-pulse">
      <div className="w-32 h-32 rounded-full bg-zinc-200 mb-8 border-[6px] border-[#F8F9FA] shadow-lg"></div>
      <div className="h-6 w-3/4 bg-zinc-200 rounded mb-4"></div>
      <div className="h-4 w-1/2 bg-zinc-200 rounded mb-8"></div>
      
      <div className="flex justify-center space-x-12 w-full mb-12">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-8 bg-zinc-200 rounded"></div>
          <div className="h-3 w-12 bg-zinc-100 rounded"></div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-8 bg-zinc-200 rounded"></div>
          <div className="h-3 w-12 bg-zinc-100 rounded"></div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-8 bg-zinc-200 rounded"></div>
          <div className="h-3 w-12 bg-zinc-100 rounded"></div>
        </div>
      </div>
      
      <div className="h-14 w-4/5 bg-zinc-900 rounded-full mb-16"></div>
      
      <div className="flex flex-col gap-6 w-4/5">
        <div className="h-10 w-full bg-zinc-200 rounded-full"></div>
        <div className="h-10 w-full bg-zinc-200 rounded-full"></div>
        <div className="h-10 w-full bg-zinc-200 rounded-full"></div>
      </div>
    </div>
  );
}
