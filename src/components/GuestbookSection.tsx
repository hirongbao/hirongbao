import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Send, Sparkles } from 'lucide-react';
import { authRequest, getUserInfo } from '../utils/auth';
import type { GuestbookMessage } from '../types';

export default function GuestbookSection({ onRequestLogin, targetAccount }: { onRequestLogin: () => void, targetAccount?: string }) {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputContent, setInputContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const user = getUserInfo();

  const fetchMessages = async () => {
    try {
      const res = await fetch(targetAccount ? `/api/guestbook/list/user/${targetAccount}?page=1&size=50` : '/api/guestbook/list?page=1&size=50');
      const json = await res.json();
      if (json.code === 0) {
        setMessages(json.data.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequestLogin();
      return;
    }
    if (!inputContent.trim()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await authRequest(targetAccount ? `/api/guestbook/add/user/${targetAccount}` : '/api/guestbook/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputContent })
      });
      setInputContent('');
      fetchMessages(); // refresh list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-12 pt-4">
      <div className="mb-10">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-zinc-200 to-zinc-100 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative bg-white rounded-[2rem] shadow-sm border border-zinc-100/80 p-4 transition-all duration-300 focus-within:border-zinc-300 focus-within:shadow-md">
            <textarea
              value={inputContent}
              onChange={e => setInputContent(e.target.value)}
              placeholder={user ? "写下你想说的话 (每天一条)..." : "请先登录后再留言..."}
              className="w-full bg-transparent border-none rounded-xl p-2 pr-16 min-h-[80px] resize-none focus:outline-none text-zinc-800 placeholder-zinc-300 text-[15px] leading-relaxed"
              maxLength={500}
              disabled={isSubmitting || !user}
            />
            {error && <p className="text-xs text-red-500 mt-2 px-2 font-medium">{error}</p>}
            
            <div className="flex justify-between items-center mt-2 px-2">
              <div className="flex items-center space-x-2 text-zinc-400">
                <Sparkles size={14} />
                <span className="text-[11px] font-medium tracking-wide">GUESTBOOK</span>
              </div>
              {!user ? (
                <button
                  type="button"
                  onClick={onRequestLogin}
                  className="px-5 py-2 bg-zinc-900 text-white text-[13px] font-bold tracking-wider rounded-full hover:bg-zinc-800 transition-colors"
                >
                  登录
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !inputContent.trim()}
                  className="w-10 h-10 bg-zinc-900 text-white rounded-full flex items-center justify-center hover:bg-zinc-800 hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100"
                >
                  {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12 text-zinc-300">
            <RefreshCw className="animate-spin w-6 h-6" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 text-sm italic font-serif">
            暂无留言，来做第一个留言的人吧。
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-100 before:to-transparent">
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-zinc-100 text-zinc-500 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 overflow-hidden ml-0 md:ml-0">
                  {msg.avatarUrl ? (
                    <img src={msg.avatarUrl} alt={msg.accountName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm uppercase">{msg.accountName.charAt(0)}</span>
                  )}
                </div>
                <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-[2rem] bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-sm text-zinc-900">{msg.accountName}</h5>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-tighter">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
