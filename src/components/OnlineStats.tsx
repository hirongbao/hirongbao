import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function OnlineStats() {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Create STOMP client
    const stompClient = new Client({
      // In development, server proxy is used for /ws/notify
      webSocketFactory: () => new SockJS('/ws/notify'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = (frame) => {
      if (isMounted) {
        setIsLive(true);
      }
      
      stompClient.subscribe('/topic/online-count', (message) => {
        if (message.body && isMounted) {
          try {
            const data = JSON.parse(message.body);
            setOnlineCount(data.onlineCount || 1);
          } catch (e) {
            console.error('Failed to parse STOMP message', e);
          }
        }
      });
    };

    stompClient.onWebSocketClose = () => {
      if (isMounted) setIsLive(false);
    };

    stompClient.onStompError = (frame) => {
      console.error('STOMP Error:', frame);
      if (isMounted) setIsLive(false);
    };

    stompClient.activate();

    return () => {
      isMounted = false;
      stompClient.deactivate();
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
