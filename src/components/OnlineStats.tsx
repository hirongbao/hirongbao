import React, { useState, useEffect } from 'react';

export function OnlineStats() {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // 监听 WebSocket 的实时在线人数广播
    const handleWsOnlineCount = (e: any) => {
      if (typeof e.detail === 'number') {
        setOnlineCount(e.detail);
        setIsLive(true);
      }
    };
    window.addEventListener('ws_online_count', handleWsOnlineCount);

    const storageKey = 'hirongbao:visitor-id';
    let clientId = window.localStorage.getItem(storageKey);
    if (!clientId) {
      clientId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      window.localStorage.setItem(storageKey, clientId);
    }

    // 只在组件挂载时发送一次心跳用于记录访客，后续依赖 WebSocket 实时更新
    let isMounted = true;
    const recordVisit = async () => {
      try {
        const res = await fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId })
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.code === 0 && onlineCount === 0) {
             setOnlineCount(data.data.onlineCount || 0);
             setIsLive(true);
          }
        }
      } catch (e) {}
    };
    recordVisit();

    return () => {
      isMounted = false;
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