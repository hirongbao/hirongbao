import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { authRequest, getUserInfo } from '../utils/auth';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetName: string;
}

export function ChatModal({ isOpen, onClose, targetUserId, targetName }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getUserInfo();

  useEffect(() => {
    if (isOpen && targetUserId) {
      loadHistory();
      // Optional: Polling or WebSocket could be added here
      const interval = setInterval(() => {
        loadHistory(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, targetUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await authRequest(`/api/hirongbaohub/messages/history/${targetUserId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      const res = await authRequest('/api/hirongbaohub/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: targetUserId, content: inputText.trim() })
      });
      if (res.ok) {
        setInputText('');
        loadHistory(false);
      }
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      setSending(false);
    }
  };

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
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[80vh]"
          >
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white z-10">
              <h2 className="text-lg font-medium text-zinc-900">
                与 {targetName} 的私信
              </h2>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center p-8 text-zinc-400 text-sm">
                  暂无消息，打个招呼吧
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[15px] ${
                          isMe
                            ? 'bg-zinc-900 text-white rounded-br-sm'
                            : 'bg-white border border-zinc-100 text-zinc-900 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-zinc-100">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="发送私信..."
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="w-11 h-11 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
