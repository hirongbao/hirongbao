import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Send, Share, Loader2, X, Download, QrCode } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Post, Comment } from '../types';
import { PostMedia } from './PostMedia';
import { formatRelativeTime } from '../utils/time';

import { getProxiedImageUrl } from '../utils/image';

interface PostCardProps {
  post: Post;
  authorName: string;
  authorAvatar: string;
  onClick?: () => void;
}

export function PostCard({ post, authorName, authorAvatar, onClick }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likeCount);

  const posterRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);

  // 封面图与分类文案（视频优先，其次图片，纯文字为随笔）
  const coverImage = post.media.find(m => m.mediaType === 'image');
  const hasVideo = post.media.some(m => m.mediaType === 'video');
  const categoryLabel = hasVideo ? '动态影像' : post.media.length ? '视觉日志' : '日常随笔';

  // 点赞/取消点赞，以后端返回的计数为准
  const handleLike = async () => {
    const action = isLiked ? 'unlike' : 'like';
    setIsLiked(!isLiked);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const payload = await res.json();
      if (res.ok && payload.code === 0) {
        setLikes(payload.data.likes);
      } else {
        setLikes(prev => Math.max(prev + (action === 'like' ? 1 : -1), 0));
        setIsLiked(isLiked);
      }
    } catch {
      setLikes(prev => Math.max(prev + (action === 'like' ? 1 : -1), 0));
      setIsLiked(isLiked);
    }
  };



  const handleShare = async () => {
    if (!posterRef.current || isSharing) return;
    setIsSharing(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/png');
      setShareImageUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('生成分享图片失败，请稍后重试。可能由于图片跨域限制。');
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadImage = () => {
    if (!shareImageUrl) return;
    const link = document.createElement('a');
    link.download = `hirongbao_feed_${post.id}.png`;
    link.href = shareImageUrl;
    link.click();
  };

  return (
    <>
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-[2rem] lg:rounded-[3rem] shadow-xl shadow-zinc-200/40 border border-zinc-100 overflow-hidden flex flex-col"
      >
        <div className="p-8 lg:p-12 flex flex-col">
          <div 
            className="flex flex-col cursor-pointer group"
            onClick={onClick}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300">
                {categoryLabel} / {post.createdAt}
              </span>
              <div className="w-2 h-2 bg-zinc-900 rounded-full animate-pulse"></div>
            </div>

            {/* Content */}
            {post.content && post.media.length > 0 && (
              <p className="text-xl text-zinc-800 leading-snug mb-8">
                {post.content}
              </p>
            )}
            {post.content && !post.media.length && (
              <p className="text-3xl lg:text-4xl font-serif leading-[1.2] italic text-zinc-800 mb-8">
                "{post.content}"
              </p>
            )}

            {/* Media（多图只展示封面，点击进入详情查看全部） */}
            {post.media.length > 0 && (
              <PostMedia media={post.media} mode="card" />
            )}
          </div>

          {/* Actions */}
          <div className="mt-auto pt-6 border-t border-zinc-100 mb-6 w-full"></div>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex space-x-6">
              <div 
                onClick={handleLike}
                className="group flex items-center space-x-3 cursor-pointer"
              >
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className={`w-10 h-10 rounded-full border border-zinc-100 flex items-center justify-center transition-all ${isLiked ? 'bg-zinc-900 text-white' : 'group-hover:bg-zinc-900 group-hover:text-white text-zinc-900'}`}
                >
                  <Heart size={16} className={isLiked ? "fill-current" : ""} />
                </motion.div>
                <span className="text-xs font-bold font-mono text-zinc-700">{likes}</span>
              </div>
              
              <div 
                onClick={onClick}
                className="group flex items-center space-x-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full border border-zinc-100 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white text-zinc-900 transition-all shadow-xs">
                  <MessageCircle size={16} />
                </div>
                <span className="text-xs font-bold font-mono text-zinc-700">{post.comments.length}</span>
              </div>

              <div 
                onClick={handleShare}
                className="group flex items-center space-x-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full border border-zinc-100 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white text-zinc-900 transition-all">
                  {isSharing ? <Loader2 size={16} className="animate-spin" /> : <Share size={16} />}
                </div>
                <span className="text-xs font-bold font-mono text-zinc-700 hidden sm:inline-block">Share</span>
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {authorName}
            </div>
          </div>
        </div>

      </motion.div>

      {/* Hidden Poster Generation Element */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none z-0">
        <div 
          ref={posterRef} 
          className="w-[800px] bg-white p-16 flex flex-col border border-[#f4f4f5] text-[#18181b]"
          style={{ fontFamily: "inherit" }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-16">
            <div className="flex items-center space-x-6">
              <img crossOrigin="anonymous" src={getProxiedImageUrl(authorAvatar)} alt="author" loading="lazy" className="w-16 h-16 rounded-full object-cover border border-[#f4f4f5]" />
              <div>
                <h3 className="text-2xl font-serif italic text-[#18181b]">{authorName}</h3>
                <p className="text-[#a1a1aa] font-bold uppercase tracking-widest text-xs mt-1">@hirongbao</p>
              </div>
            </div>
            <div className="w-4 h-4 bg-[#18181b] rounded-full"></div>
          </div>

          {/* Media Content */}
          {coverImage && (
             <div className="mb-12 rounded-[2rem] overflow-hidden bg-[#f4f4f5] border border-[#f4f4f5] flex items-center justify-center">
              <img crossOrigin="anonymous" src={getProxiedImageUrl(coverImage.mediaUrl)} alt="Post content" loading="lazy" className="w-full h-auto max-h-[600px] object-cover" />
            </div>
          )}
          
          {hasVideo && (
            <div className="mb-12 rounded-[2rem] overflow-hidden bg-[#18181b] border border-[#18181b] h-[400px] flex flex-col items-center justify-center relative">
              <div className="text-[rgba(255,255,255,0.3)] font-serif italic text-4xl mb-4">Motion Asset</div>
              <div className="w-16 h-16 rounded-full border border-[rgba(255,255,255,0.2)] flex items-center justify-center">
                <div className="w-0 h-0 border-t-8 border-b-8 border-l-[12px] border-t-transparent border-b-transparent border-l-[rgba(255,255,255,0.3)] ml-1"></div>
              </div>
            </div>
          )}

          {/* Text Content */}
          <div className="flex-1 mb-16">
            {post.media.length > 0 && post.content && (
              <p className="text-3xl text-[#27272a] leading-snug">
                {post.content}
              </p>
            )}
            {!post.media.length && (
              <p className="text-5xl font-serif leading-[1.2] italic text-[#27272a]">
                "{post.content}"
              </p>
            )}
          </div>

          <div className="h-[1px] w-full bg-[#f4f4f5] mb-8"></div>
          
          {/* Footer */}
          <div className="flex justify-between items-end">
            <div className="flex flex-col space-y-4">
              <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-[#a1a1aa]">
                {categoryLabel} / {post.createdAt}
              </span>
              <div>
                <div className="text-sm font-bold tracking-[0.2em] uppercase text-[#18181b]">Personal Feed</div>
                <div className="text-[10px] text-[#a1a1aa] mt-1 uppercase tracking-widest">hrb.design</div>
              </div>
            </div>
            
            {/* QR Code Placeholder */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#18181b]">Scan to View</div>
                <div className="text-[9px] text-[#a1a1aa] mt-1 uppercase tracking-widest">扫码查看原动态</div>
              </div>
              <div className="w-[68px] h-[68px] bg-[#f4f4f5] border border-[#e4e4e7] p-2 rounded-xl flex items-center justify-center text-[#a1a1aa]">
                <QrCode size={36} strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {shareImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-8"
            onClick={() => setShareImageUrl(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-[600px] w-full max-h-[90vh] flex items-center justify-center"
            >
              <button 
                onClick={() => setShareImageUrl(null)}
                className="absolute -top-12 sm:-top-4 sm:-right-12 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
              >
                <X size={20} />
              </button>
              
              <div className="relative w-full h-full rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-2xl group">
                <img 
                  src={shareImageUrl} 
                  alt="Generated Poster" 
                  className="w-full h-auto max-h-[85vh] object-contain" 
                />
                
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={handleDownloadImage}
                    className="bg-zinc-900/90 backdrop-blur-sm border border-white/10 text-white px-6 py-3 rounded-full text-sm font-bold tracking-wide hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center space-x-2 shadow-2xl"
                  >
                    <Download size={16} />
                    <span>保存海报</span>
                  </button>
                </div>
              </div>
              
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-xs whitespace-nowrap sm:hidden">
                长按图片即可保存
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
