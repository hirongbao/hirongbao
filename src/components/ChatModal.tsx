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
  targetAvatarUrl?: string | null;
}

export function ChatModal({ isOpen, onClose, targetUserId, targetName, targetAvatarUrl }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getUserInfo();

  useEffect(() => {
    if (isOpen && targetUserId) {
      loadHistory();
      const handleNotify = (e: any) => {
        if (e.detail?.type === 'MESSAGE') {
          if (e.detail?.message) {
            const newMsg = e.detail.message as ChatMessage;
            if (String(newMsg.senderId) === String(targetUserId)) {
              setMessages(prev => {
                if (prev.some(m => String(m.id) === String(newMsg.id))) return prev;
                return [...prev, newMsg];
              });
              return;
            }
          }
          loadHistory(false);
        }
      };
      window.addEventListener('ws_notify', handleNotify);
      return () => window.removeEventListener('ws_notify', handleNotify);
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
      const data = await authRequest(`/api/hirongbaohub/messages/history/${targetUserId}`);
      const rawRecords: ChatMessage[] = data.records || [];
      const sorted = [...rawRecords].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(sorted);
    } catch (e) {
      console.error('Failed to load chat history', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const contentToSend = inputText.trim();
    setSending(true);
    try {
      const sentMsg = await authRequest('/api/hirongbaohub/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: targetUserId, receiverAccount: targetName, content: contentToSend })
      });
      setInputText('');
      if (sentMsg && sentMsg.id) {
        setMessages(prev => {
          if (prev.some(m => String(m.id) === String(sentMsg.id))) return prev;
          return [...prev, sentMsg];
        });
      } else {
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
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[80vh]"
          >
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white z-10">
              <div className="flex items-center gap-3 min-w-0">
                {targetAvatarUrl ? (
                  <img src={targetAvatarUrl} alt={targetName} className="w-9 h-9 rounded-full object-cover shrink-0 border border-zinc-100" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-semibold text-xs shrink-0">
                    {(targetName || 'U')[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-zinc-900 truncate leading-tight">
                    {targetName}
                  </h2>
                  <span className="text-[11px] text-zinc-400">私信对话</span>
                </div>
              </div>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors p-1 rounded-full hover:bg-zinc-100">
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
                  const isMe = String(msg.senderId) === String(user?.id);
                  const otherAvatar = msg.senderAvatar || targetAvatarUrl;

                  return (
                    <div key={msg.id} className={`flex gap-2.5 items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        otherAvatar ? (
                          <img src={otherAvatar} alt={targetName} className="w-7 h-7 rounded-full object-cover shrink-0 border border-zinc-100 mb-1" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 font-semibold text-[10px] shrink-0 mb-1">
                            {(targetName || 'U')[0]?.toUpperCase()}
                          </div>
                        )
                      )}

                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed break-words ${
                          isMe
                            ? 'bg-zinc-900 text-white rounded-br-xs'
                            : 'bg-white border border-zinc-100 text-zinc-900 rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {isMe && (
                        user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="我" className="w-7 h-7 rounded-full object-cover shrink-0 border border-zinc-100 mb-1" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-white font-semibold text-[10px] shrink-0 mb-1">
                            我
                          </div>
                        )
                      )}
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
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-sm"
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
