import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, RefreshCw, Send } from 'lucide-react';
import { authRequest, getUserInfo } from '../utils/auth';
import type { GuestbookMessage } from '../types';

export default function GuestbookSection({ onRequestLogin }: { onRequestLogin: () => void }) {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputContent, setInputContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const user = getUserInfo();

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/guestbook/list?page=1&size=50');
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
      await authRequest('/api/guestbook/add', {
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
    <div className="w-full max-w-4xl mx-auto pb-12">
      <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/40 border border-zinc-100 overflow-hidden mb-12">
        <div className="p-8 sm:p-12">
          <div className="flex items-center space-x-3 mb-6">
            <MessageSquare className="text-zinc-900" size={24} />
            <h3 className="text-2xl font-serif italic font-bold">留个言吧</h3>
          </div>
          
          <div className="bg-zinc-50 rounded-2xl p-6">
            <p className="text-sm text-zinc-500 mb-4 font-medium flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
              每个用户每天可以留言一句话。
            </p>
            
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={inputContent}
                onChange={e => setInputContent(e.target.value)}
                placeholder={user ? "写下你想说的话..." : "请先登录后再留言"}
                className="w-full bg-white border border-zinc-200 rounded-xl p-4 pr-16 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                maxLength={500}
                disabled={isSubmitting || !user}
              />
              {error && (
                <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>
              )}
              
              {!user ? (
                <button
                  type="button"
                  onClick={onRequestLogin}
                  className="absolute right-4 bottom-4 px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-lg shadow-md"
                >
                  登录留言
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !inputContent.trim()}
                  className="absolute right-4 bottom-4 w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center shadow-md disabled:opacity-50 transition-transform active:scale-95"
                >
                  {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} className="ml-1" />}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 ml-4">最新留言</h4>
        
        {loading ? (
          <div className="flex justify-center py-12 text-zinc-400">
            <RefreshCw className="animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-sm">
            暂无留言，来做第一个留言的人吧。
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-100 shadow-sm flex space-x-4"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center overflow-hidden">
                  {msg.avatarUrl ? (
                    <img src={msg.avatarUrl} alt={msg.accountName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-zinc-500">{msg.accountName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-2">
                    <h5 className="font-bold text-sm text-zinc-900">{msg.accountName}</h5>
                    <span className="text-xs text-zinc-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
