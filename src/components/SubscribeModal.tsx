import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send } from 'lucide-react';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscribeModal({ isOpen, onClose }: SubscribeModalProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setEmail('');
      setCode('');
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2rem] overflow-hidden shadow-2xl max-w-[400px] w-full p-8 relative"
          >
            <button 
              onClick={handleClose}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="mb-8">
              <h3 className="text-2xl font-serif italic text-zinc-900 mb-2">Subscribe</h3>
              <p className="text-sm text-zinc-500 font-light">
                留下您的邮箱，随时获取最新数字动态与灵感更新。
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 pl-1">
                  电子邮箱
                </label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 pl-1">
                  验证码
                </label>
                <div className="flex space-x-2">
                  <input 
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="输入 6 位验证码"
                    className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                  <button 
                    onClick={() => {
                      setIsSending(true);
                      setTimeout(() => setIsSending(false), 2000); // Simulate API call
                    }}
                    disabled={!email || isSending}
                    className="whitespace-nowrap px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send size={14} />
                    )}
                    <span>{isSending ? '发送中' : '获取验证码'}</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={handleClose}
                disabled={!email || !code}
                className="w-full mt-4 py-4 bg-zinc-900 text-white rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-900 transition-all"
              >
                确认订阅
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
