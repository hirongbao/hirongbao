import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Heart, MessageCircle, MessageSquare } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  sourceAuthor: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function NotificationModal({ isOpen, onClose, token }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      setLoading(true);
      fetch('/api/notifications/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.code === 0) {
            setNotifications(data.data);
          }
        })
        .finally(() => setLoading(false));

      // Mark as read
      fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  }, [isOpen, token]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return <Heart size={16} className="text-red-500" />;
      case 'COMMENT': return <MessageCircle size={16} className="text-blue-500" />;
      case 'GUESTBOOK': return <MessageSquare size={16} className="text-emerald-500" />;
      default: return <Bell size={16} className="text-zinc-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'LIKE': return '赞了你的动态';
      case 'COMMENT': return '评论了你';
      case 'GUESTBOOK': return '给你留言';
      default: return '发来一条通知';
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[70vh]"
          >
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Bell size={20} />
                消息中心
              </h3>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-zinc-400 text-sm">加载中...</div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
                  <Bell size={32} className="mb-3 opacity-20" />
                  <p className="text-sm">暂无消息通知</p>
                </div>
              ) : (
                notifications.map(item => (
                  <div key={item.id} className={`p-4 rounded-2xl flex gap-3 ${item.isRead ? 'bg-zinc-50/50' : 'bg-zinc-100'}`}>
                    <div className="mt-1 flex-shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-bold text-zinc-900 text-sm truncate">{item.sourceAuthor}</span>
                        <span className="text-xs text-zinc-400 ml-2 flex-shrink-0">{formatTime(item.createdAt)}</span>
                      </div>
                      <div className="text-xs text-zinc-500 mb-1">{getTypeLabel(item.type)}</div>
                      {item.content && (
                        <div className="text-sm text-zinc-700 bg-white/60 p-2 rounded-lg mt-2 break-words">
                          {item.content}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
