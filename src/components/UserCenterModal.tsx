import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, Edit3, Settings, Calendar, Bell, MessageSquare } from 'lucide-react';
import { getUserInfo, removeToken, removeUserInfo } from '../utils/auth';

interface UserCenterModalProps {
  unreadCount?: number;
  unreadMessageCount?: number;
  onOpenNotifications?: () => void;
  onOpenMessageInbox?: () => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onPublish: () => void;
  onPublishAnniversary: () => void;
}

export default function UserCenterModal({ isOpen, onClose, onLogout, onPublish, onPublishAnniversary, onOpenNotifications, onOpenMessageInbox, unreadCount = 0, unreadMessageCount = 0 }: UserCenterModalProps) {
  const user = getUserInfo();

  const handleLogout = () => {
    removeToken();
    removeUserInfo();
    onLogout();
    onClose();
  };

  const totalUnread = unreadCount + unreadMessageCount;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-900 transition-colors">
              <X size={20} />
            </button>
            
            <div className="p-8">
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-zinc-200 rounded-full flex items-center justify-center overflow-hidden shadow-lg border-4 border-white">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-zinc-400">{user?.accountName?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>
                  {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-zinc-900">{user?.accountName}</h3>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-1 px-3 py-1 bg-zinc-100 rounded-full">
                  {user?.role === 'ADMIN' ? '管理员' : '普通用户'}
                </span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => { window.location.href = `/${user?.accountName}/post`; }}
                  className="w-full py-4 flex items-center justify-center space-x-2 bg-zinc-100 text-zinc-900 rounded-2xl font-bold tracking-widest transition-all hover:bg-zinc-200 relative"
                >
                  <Settings size={18} />
                  <span>个人主页</span>
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { if(onOpenNotifications) onOpenNotifications(); }}
                    className="w-full py-4 flex items-center justify-center space-x-2 bg-zinc-100 text-zinc-900 rounded-2xl font-bold tracking-widest transition-all hover:bg-zinc-200 relative"
                  >
                    <Bell size={18} />
                    <span>消息通知</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => { if(onOpenMessageInbox) onOpenMessageInbox(); }}
                    className="w-full py-4 flex items-center justify-center space-x-2 bg-zinc-100 text-zinc-900 rounded-2xl font-bold tracking-widest transition-all hover:bg-zinc-200 relative"
                  >
                    <MessageSquare size={18} />
                    <span>私信箱</span>
                    {unreadMessageCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </span>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { onClose(); onPublish(); }}
                    className="w-full py-4 flex items-center justify-center space-x-2 bg-zinc-900 text-white rounded-2xl font-bold tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Edit3 size={18} />
                    <span>发布动态</span>
                  </button>
                  <button
                    onClick={() => { onClose(); onPublishAnniversary(); }}
                    className="w-full py-4 flex items-center justify-center space-x-2 bg-zinc-900 text-white rounded-2xl font-bold tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Calendar size={18} />
                    <span>发布纪念日</span>
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-4 flex items-center justify-center space-x-2 bg-red-50 text-red-600 rounded-2xl font-bold tracking-widest transition-all hover:bg-red-100"
                >
                  <LogOut size={18} />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
