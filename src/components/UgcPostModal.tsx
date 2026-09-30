import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Image as ImageIcon, Link as LinkIcon, RefreshCw, Loader2 } from 'lucide-react';
import { authRequest } from '../utils/auth';

interface UgcPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UgcPostModal({ isOpen, onClose, onSuccess }: UgcPostModalProps) {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [newMedia, setNewMedia] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const addMediaUrl = () => {
    if (newMedia.trim() && mediaUrls.length < 9) {
      setMediaUrls([...mediaUrls, newMedia.trim()]);
      setNewMedia('');
      setShowLinkInput(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!files.length) return;
    
    setUploading(true);
    setError('');
    
    for (const file of files) {
      if (mediaUrls.length >= 9) break;
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // C端用户直接调用 UGC 上传接口
        const fileRecord = await authRequest('/api/posts/ugc/upload', {
          method: 'POST',
          body: formData
          // 注: 不要手动设置 Content-Type，fetch 会自动带上 boundary
        });
        
        if (fileRecord && fileRecord.fileUrl) {
          setMediaUrls(prev => [...prev, fileRecord.fileUrl]);
        }
      } catch (err: any) {
        setError(`图片 ${file.name} 上传失败: ${err.message}`);
      }
    }
    setUploading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
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
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 发说说
              </h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6">
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="分享你的此刻想法..."
                  className="w-full bg-transparent border-none p-0 min-h-[120px] resize-none focus:outline-none focus:ring-0 text-zinc-800 text-lg placeholder-zinc-300 leading-relaxed"
                />

                {mediaUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                    {mediaUrls.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 group border border-zinc-200/50">
                        <img src={url} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black hover:scale-110 backdrop-blur-md"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {error && <p className="text-sm text-red-500 font-medium mt-4">{error}</p>}
              </div>

              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || mediaUrls.length >= 9}
                    className="p-2.5 text-zinc-500 hover:text-emerald-600 bg-white border border-zinc-200 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-50 group flex items-center gap-2 relative tooltip"
                    title="上传图片"
                  >
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    onChange={handleFileUpload}
                  />

                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowLinkInput(!showLinkInput)}
                      disabled={uploading || mediaUrls.length >= 9}
                      className={`p-2.5 transition-all rounded-xl border flex items-center gap-2 ${showLinkInput ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-zinc-500 border-zinc-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'} disabled:opacity-50`}
                      title="添加图片链接"
                    >
                      <LinkIcon size={18} />
                    </button>
                    
                    <AnimatePresence>
                      {showLinkInput && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute left-full ml-3 flex items-center shadow-lg rounded-xl overflow-hidden border border-zinc-200 bg-white w-64 z-10"
                        >
                          <input
                            type="url"
                            placeholder="https://..."
                            value={newMedia}
                            onChange={e => setNewMedia(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMediaUrl())}
                            className="flex-1 px-3 py-2 text-sm focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={addMediaUrl}
                            disabled={!newMedia.trim()}
                            className="px-3 py-2 bg-blue-50 text-blue-600 font-bold text-sm disabled:opacity-50 hover:bg-blue-100 transition-colors"
                          >
                            添加
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <span className="text-xs font-mono text-zinc-400 hidden sm:inline-block">
                    {mediaUrls.length} / 9
                  </span>
                  <button
                    type="submit"
                    disabled={loading || (!content.trim() && mediaUrls.length === 0)}
                    className="w-full sm:w-auto px-8 py-2.5 bg-zinc-900 text-white rounded-xl font-bold tracking-widest flex items-center justify-center shadow-md disabled:opacity-50 hover:bg-zinc-800 transition-colors active:scale-95"
                  >
                    {loading ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                    发布
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
