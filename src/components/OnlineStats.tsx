import React, { useState, useEffect } from 'react';

export function OnlineStats() {
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // 监听 WebSocket 的实时在线人数广播
    const handleWsOnlineCount = (e: any) => {
      if (typeof e.detail === 'number') {
        setOnlineCount(Math.max(1, e.detail));
        setIsLive(true);
      }
    };
    window.addEventListener('ws_online_count', handleWsOnlineCount);

    return () => {
      window.removeEventListener('ws_online_count', handleWsOnlineCount);
    };
  }, []);

  return (
    <div className="col-span-2 bg-zinc-50 p-3 rounded-2xl flex items-center justify-between">
      <div>
        <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest mb-1">当前在线人数</p>
        <p className="text-xl font-mono">{onlineCount.toLocaleString()}</p>
      </div>
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-colors ${isLive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`}>
        <div className="relative flex h-2 w-2">
          {isLive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
        </div>
        <span className="text-[10px] font-bold tracking-wider">{isLive ? 'LIVE' : 'OFFLINE'}</span>
      </div>
    </div>
  );
}