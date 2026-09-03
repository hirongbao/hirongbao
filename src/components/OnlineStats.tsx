import React, { useState, useEffect } from 'react';

export function OnlineStats() {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // 为浏览器生成并持久化匿名访客 ID，避免后端只能看到代理地址时统计失效
    const storageKey = 'hirongbao:visitor-id';
    let clientId = window.localStorage.getItem(storageKey);
    if (!clientId) {
      clientId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      window.localStorage.setItem(storageKey, clientId);
    }
    
    let isMounted = true;
    let timer: number;

    const fetchHeartbeat = async () => {
      try {
        const res = await fetch('/api/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ clientId })
        });
        
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              const data = await res.json();
              if (isMounted && data.code === 0) {
                setOnlineCount(data.data.onlineCount || 0);
                setIsLive(true);
              } else {
                setIsLive(false);
              }
            } catch (parseError) {
              console.error('Invalid JSON response:', parseError);
              setIsLive(false);
            }
          } else {
            setIsLive(false);
          }
        } else {
          setIsLive(false);
        }
      } catch (error) {
        console.error('Heartbeat failed:', error);
        setIsLive(false);
      }
    };

    // Initial fetch
    fetchHeartbeat();

    // Setup heartbeat interval (every 15 seconds)
    timer = window.setInterval(fetchHeartbeat, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
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
