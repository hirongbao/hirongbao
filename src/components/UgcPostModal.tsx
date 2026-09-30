import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { authRequest } from '../utils/auth';

interface UgcPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UgcPostModal({ isOpen, onClose, onSuccess }: UgcPostModalProps) {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [newMedia, setNewMedia] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaUrls.length === 0) {
      setError('内容或图片至少需要填写一项');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await authRequest('/api/posts/ugc/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          mediaType: mediaUrls.length > 0 ? 'image' : null,
          mediaUrls,
          categoryId: 'notes',
          categoryName: '随笔'
        })
      });
      setContent('');
      setMediaUrls([]);
      onSuccess();
      onClose();
      alert('动态发布成功！需要等待站长审核后才会公开显示。');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addMedia = () => {
    if (newMedia.trim() && mediaUrls.length < 9) {
      setMediaUrls([...mediaUrls, newMedia.trim()]);
      setNewMedia('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 tracking-wider">发布动态</h2>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="分享你的此刻想法 (不配图则为纯文字随笔)..."
                className="w-full bg-zinc-50 border-none rounded-2xl p-6 min-h-[150px] resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm mb-4"
              />

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center">
                    <ImageIcon size={14} className="mr-1" /> 配图 (最多9张)
                  </label>
                  <span className="text-xs font-mono text-zinc-400">{mediaUrls.length} / 9</span>
                </div>
                
                {mediaUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {mediaUrls.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 group">
                        <img src={url} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {mediaUrls.length < 9 && (
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      placeholder="输入图片 URL (支持外部图床)..."
                      value={newMedia}
                      onChange={e => setNewMedia(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMedia())}
                      className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                    />
                    <button
                      type="button"
                      onClick={addMedia}
                      disabled={!newMedia.trim()}
                      className="px-4 py-2 bg-zinc-100 text-zinc-700 font-medium rounded-xl disabled:opacity-50 text-sm"
                    >
                      添加
                    </button>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-red-500 font-medium mb-4">{error}</p>}

              <div className="flex justify-end pt-4 border-t border-zinc-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold tracking-widest flex items-center shadow-lg shadow-zinc-900/20 disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={18} className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
                  发 布
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
