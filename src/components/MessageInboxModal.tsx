import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { MessageSession } from '../types';
import { authRequest } from '../utils/auth';
import { formatRelativeTime } from '../utils/time';

interface MessageInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (userId: string, targetName: string) => void;
}

export function MessageInboxModal({ isOpen, onClose, onOpenChat }: MessageInboxModalProps) {
  const [sessions, setSessions] = useState<MessageSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
      const handleNotify = (e: any) => {
        if (e.detail?.type === 'MESSAGE') {
          loadSessions();
        }
      };
      window.addEventListener('ws_notify', handleNotify);
      return () => window.removeEventListener('ws_notify', handleNotify);
    }
  }, [isOpen]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await authRequest('/api/hirongbaohub/messages/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error('Failed to load sessions', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-medium text-zinc-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-zinc-400" />
                私信箱
              </h2>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center p-8 text-zinc-500">
                  暂无私信记录
                </div>
              ) : (
                sessions.map(session => (
                  <button
                    key={session.targetUserId}
                    onClick={() => {
                      onClose();
                      onOpenChat(session.targetUserId, session.targetNickname || session.targetAccountName);
                    }}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-50 transition-colors text-left"
                  >
                    <div className="relative">
                      {session.targetAvatarUrl ? (
                        <img src={session.targetAvatarUrl} alt={session.targetAccountName} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                          <span className="text-zinc-500 font-medium">
                            {(session.targetNickname || session.targetAccountName || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      {session.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
                          {session.unreadCount > 99 ? '99+' : session.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-medium text-zinc-900 truncate">
                          {session.targetNickname || session.targetAccountName}
                        </h3>
                        <span className="text-xs text-zinc-400 shrink-0 ml-2">
                          {formatRelativeTime(session.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 truncate">
                        {session.lastMessage}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
