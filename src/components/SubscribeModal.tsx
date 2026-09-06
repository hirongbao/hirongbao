import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscribeModal({ isOpen, onClose }: SubscribeModalProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setEmail('');
      setCode('');
      setCountdown(0);
      setToast(null);
    }, 300);
  };

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleRequestCode = async () => {
    if (!email) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/subscribe/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      // Attempt to parse JSON response, fallback if Nginx returns HTML error page
      let data;
      try {
        data = await res.json();
      } catch (e) {
        showToast('服务器开小差了，请稍后再试', 'error');
        setIsSending(false);
        return;
      }

      if (res.ok && data.code === 0) {
        showToast('验证码已发送至邮箱，请查收', 'success');
        setCountdown(60);
      } else {
        showToast(data.message || '发送失败，请稍后再试', 'error');
      }
    } catch (error) {
      showToast('网络异常，请稍后再试', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubscribe = async () => {
    if (!email || !code) return;
    try {
      const res = await fetch('/api/subscribe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        showToast('服务器开小差了，请稍后再试', 'error');
        return;
      }

      if (res.ok && data.code === 0) {
        showToast('订阅成功！', 'success');
        setTimeout(() => handleClose(), 1500);
      } else {
        showToast(data.message || '验证码错误，请重新输入', 'error');
      }
    } catch (error) {
      showToast('网络异常，请稍后再试', 'error');
    }
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
            {/* Toast Notification */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full flex items-center space-x-2 text-[13px] font-medium z-10 shadow-xl bg-zinc-900 text-white whitespace-nowrap"
                >
                  {toast.type === 'error' ? <AlertCircle size={15} className="text-zinc-400" /> : <CheckCircle2 size={15} className="text-zinc-400" />}
                  <span>{toast.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

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
                    onClick={handleRequestCode}
                    disabled={!email || isSending || countdown > 0}
                    className="whitespace-nowrap px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center space-x-2 min-w-[120px] justify-center"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      countdown > 0 ? <span>{countdown}s 后重试</span> : <><Send size={14} /><span>获取验证码</span></>
                    )}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleSubscribe}
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
