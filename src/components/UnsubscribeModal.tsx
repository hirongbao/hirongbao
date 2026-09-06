import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UnsubscribeModalProps {
  isOpen: boolean;
  email: string;
  token: string;
  onClose: () => void;
}

export function UnsubscribeModal({ isOpen, email, token, onClose }: UnsubscribeModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => setToast(null), 300);
  };

  const handleConfirm = async () => {
    setIsSending(true);
    try {
      const res = await fetch('/api/subscribe/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        showToast('服务器开小差了，请稍后再试', 'error');
        setIsSending(false);
        return;
      }

      if (res.ok && data.code === 0) {
        showToast('您已成功退订', 'success');
        setTimeout(() => handleClose(), 2000);
      } else {
        showToast(data.message || '退订失败，请稍后再试', 'error');
        setIsSending(false);
      }
    } catch (error) {
      showToast('网络异常，请稍后再试', 'error');
      setIsSending(false);
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
              <h3 className="text-2xl font-serif italic text-zinc-900 mb-2">Unsubscribe</h3>
              <p className="text-sm text-zinc-500 font-light mt-4">
                您确定要取消订阅 <strong>{email}</strong> 吗？
              </p>
              <p className="text-xs text-zinc-400 mt-2">
                取消后，您将不再收到我们的新动态邮件通知。当然，您随时可以重新订阅。
              </p>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={handleClose}
                className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all"
              >
                我再想想
              </button>
              <button 
                onClick={handleConfirm}
                disabled={isSending}
                className="flex-1 py-4 bg-red-600 text-white rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {isSending ? '处理中...' : '确认退订'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
