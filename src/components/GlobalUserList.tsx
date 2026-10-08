import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, ExternalLink } from 'lucide-react';

interface User {
  id: string;
  accountName: string;
  nickname: string;
  avatarUrl: string;
  bio?: string;
}

export function GlobalUserList({ onOpenChat }: { onOpenChat?: (userId: string, name: string) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [activeAvatar, setActiveAvatar] = useState<{ user: User; x: number; y: number } | null>(null);

  useEffect(() => {
    fetch('/api/user/public/list')
      .then(res => res.json())
      .then(res => {
        if (res.code === 0 && res.data) {
          setUsers(res.data);
        }
      })
      .catch(e => console.error('Failed to load users', e));
  }, []);

  const handleAvatarClick = (e: React.MouseEvent, user: User) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveAvatar({
      user,
      x: Math.min(rect.left, window.innerWidth - 130),
      y: rect.bottom
    });
  };

  return (
    <div className="w-full relative pt-2">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="flex flex-col space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">活跃用户 / USERS</h3>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[600px] overflow-y-auto hide-scrollbar pb-4">
          {users.map(user => (
            <div key={user.id} className="relative group aspect-square">
              <img 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.nickname || user.accountName}&background=random`} 
                alt={user.nickname || user.accountName}
                onClick={(e) => handleAvatarClick(e, user)}
                className="w-full h-full rounded-2xl object-cover cursor-pointer hover:shadow-md transition-all border border-zinc-100 group-hover:scale-[1.02]"
              />
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeAvatar && (
          <>
            <motion.div
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[130]"
              onClick={(e) => { e.stopPropagation(); setActiveAvatar(null); }}
            />
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              style={{ position: 'fixed', top: activeAvatar.y + 10, left: activeAvatar.x }}
              className="bg-white rounded-xl shadow-xl border border-zinc-100 overflow-hidden z-[140] w-32"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { window.location.href = `/${activeAvatar.user.accountName}/post`; }}
                className="w-full text-left px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2"
              >
                <ExternalLink size={14} /> 主页
              </button>
              <button
                onClick={() => {
                  if (onOpenChat) onOpenChat(activeAvatar.user.id, activeAvatar.user.accountName);
                  setActiveAvatar(null);
                }}
                className="w-full text-left px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2 border-t border-zinc-100"
              >
                <MessageSquare size={14} /> 私信
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
