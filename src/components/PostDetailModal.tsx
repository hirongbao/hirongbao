import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, MessageCircle, Share, Send, Loader2, CheckCircle, Reply, CornerDownRight, User } from 'lucide-react';
import { Post, Comment } from '../types';
import { PostMedia } from './PostMedia';
import { formatRelativeTime } from '../utils/time';

interface PostDetailModalProps {
  post: Post | null;
  authorName: string;
  authorAvatar: string;
  onClose: () => void;
}

const MinimalAvatar = ({ name, size = 'normal' }: { name: string, size?: 'normal' | 'small' }) => {
  const isVisitor = name === '访客' || !name;
  const dimensionClass = size === 'small' ? 'w-7 h-7' : 'w-9 h-9';
  const iconSize = size === 'small' ? 12 : 14;
  const textSize = size === 'small' ? 'text-[10px]' : 'text-xs';
  
  if (isVisitor) {
    return (
      <div className={`${dimensionClass} rounded-full bg-zinc-100/80 border border-zinc-200/80 flex items-center justify-center shrink-0`}>
        <User size={iconSize} className="text-zinc-400" />
      </div>
    );
  }
  
  return (
    <div className={`${dimensionClass} rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-sm`}>
      <span className={`text-white font-serif italic ${textSize}`}>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

export function PostDetailModal({ post, authorName, authorAvatar, onClose }: PostDetailModalProps) {
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post?.comments || []);
  const [likes, setLikes] = useState(post?.likeCount || 0);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null);
  const commentInputRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (post) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [post]);
  const likeBusy = React.useRef(false);

  // Update local state when post changes (e.g. when opening a new post)
  React.useEffect(() => {
    if (post) {
      setComments(post.comments);
      setLikes(post.likeCount);
      setIsLiked(false);
      setNewComment('');
      setSubmitSuccess(false);
      setReplyTo(null);
    }
  }, [post]);

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && post) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [post, onClose]);

  // 提交评论或回复到后端并展示审核提示
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || !post) return;
    try {
      const body: Record<string, any> = { content };
      if (replyTo) {
        body.parentId = Number(replyTo.id);
      }
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const payload = await res.json();
      if (res.ok && payload.code === 0) {
        setNewComment('');
        setReplyTo(null);
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 4000);
      } else {
        alert(payload.message || '评论失败，请稍后重试');
      }
    } catch {
      alert('评论失败，请稍后重试');
    }
  };

  // 点击回复按钮
  const handleReply = (comment: Comment) => {
    setReplyTo({ id: comment.id, author: comment.author });
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  // 计算评论总数（含子回复）
  const countComments = (list: Comment[]): number => {
    return list.reduce((sum, c) => sum + 1 + countComments(c.children || []), 0);
  };
  const totalComments = countComments(comments);

  // 点赞/取消点赞，以后端返回的计数为准
  const handleLike = async () => {
    if (!post || likeBusy.current) return;
    likeBusy.current = true;
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
    } finally {
      likeBusy.current = false;
    }
  };

  return (
    <AnimatePresence>
      {post && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-[100] overflow-y-auto p-4 sm:p-8"
          onClick={onClose}
        >
          <div className="min-h-full flex items-center justify-center">
            {/* Close Button - Outside the modal on Desktop, absolute top right */}
            <button 
              onClick={onClose}
              className="fixed top-6 right-6 lg:top-8 lg:right-8 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-md transition-colors z-[110]"
            >
              <X size={24} />
            </button>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[1200px] lg:h-[85vh] flex flex-col lg:flex-row gap-6 mt-16 lg:mt-0"
            >
              {/* Box 1: Media Player */}
              <div className="w-full lg:flex-1 bg-black rounded-[1.5rem] lg:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative pointer-events-auto aspect-square sm:aspect-auto sm:min-h-[50vh] lg:h-full">
                {post.media.length > 0 ? (
                  <div className="w-full h-full relative flex flex-col overflow-hidden">
                    <PostMedia media={post.media} mode="detail" />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-12 text-center">
                    <p className="whitespace-pre-wrap text-3xl lg:text-5xl font-serif leading-[1.3] italic text-zinc-100">
                      "{post.content}"
                    </p>
                  </div>
                )}
              </div>

              {/* Box 2: Info & Comments */}
              <div className="w-full lg:w-[400px] xl:w-[480px] h-auto lg:h-full bg-white rounded-[1.5rem] lg:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden shrink-0 pointer-events-auto">
                
                {/* Scrollable Content (Header + Comments) */}
                <div className="flex-1 overflow-y-visible lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  
                  {/* Header Info (Author + Content) */}
                  <div className="p-4 sm:p-8 pb-4 sm:pb-6 border-b border-zinc-100">
                    <div className="flex items-center space-x-4 mb-6">
                      <img referrerPolicy="no-referrer" src={authorAvatar} alt={authorName} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <h4 className="font-bold text-zinc-900">{authorName}</h4>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mt-1">
                          {post.createdAt}
                        </p>
                      </div>
                    </div>

                    {post.content && post.media.length > 0 && (
                      <p className="whitespace-pre-wrap text-zinc-800 leading-relaxed text-sm">
                        {post.content}
                      </p>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div className="p-4 sm:p-8">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6">访客留言 ({totalComments})</h5>
                    <div className="space-y-6">
                      {comments.length > 0 ? (
                        comments.map(comment => (
                          <div key={comment.id} className="relative">
                            {comment.children && comment.children.length > 0 && (
                              <div className="absolute top-10 left-[17px] bottom-0 w-[2px] bg-zinc-100 rounded-full" />
                            )}
                            {/* Top-level comment */}
                            <div className="flex gap-3 relative z-10">
                              <MinimalAvatar name={comment.author} />
                              <div className="flex-1 pb-2">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-semibold text-zinc-900 text-[13px]">
                                    {comment.author === '访客' ? 'Anonymous' : comment.author}
                                  </span>
                                  {comment.author === '访客' && (
                                    <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[9px] font-bold tracking-widest uppercase">Guest</span>
                                  )}
                                  <span className="text-[10px] text-zinc-400 font-medium ml-auto">{comment.createdAt}</span>
                                </div>
                                <p className="text-[13px] text-zinc-700 leading-relaxed mb-2">{comment.content}</p>
                                <button 
                                  onClick={() => handleReply(comment)}
                                  className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-900 transition-colors"
                                >
                                  <Reply size={12} />
                                  <span>回复</span>
                                </button>
                              </div>
                            </div>
                            
                            {/* Child replies */}
                            {comment.children && comment.children.length > 0 && (
                              <div className="pl-10 space-y-4 pt-2 relative z-10">
                                {comment.children.map(reply => (
                                  <div key={reply.id} className="relative flex gap-3">
                                    <MinimalAvatar name={reply.author} size="small" />
                                    <div className="flex-1 pb-1">
                                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <span className="font-semibold text-zinc-900 text-[13px]">
                                          {reply.author === '访客' ? 'Anonymous' : reply.author}
                                        </span>
                                        {reply.author === '访客' && (
                                          <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[9px] font-bold tracking-widest uppercase">Guest</span>
                                        )}
                                        {reply.replyToAuthor && (
                                          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                                            <CornerDownRight size={10} className="text-zinc-300" />
                                            <span className="text-zinc-500 font-medium">@{reply.replyToAuthor === '访客' ? 'Anonymous' : reply.replyToAuthor}</span>
                                          </span>
                                        )}
                                        <span className="text-[10px] text-zinc-400 font-medium ml-auto">{reply.createdAt}</span>
                                      </div>
                                      <p className="text-[13px] text-zinc-700 leading-relaxed mb-2">{reply.content}</p>
                                      <button 
                                        onClick={() => handleReply(reply)}
                                        className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-900 transition-colors"
                                      >
                                        <Reply size={11} />
                                        <span>回复</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-400 font-light italic">暂无评论，留下第一条想法吧。</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fixed Footer for Actions & Comment Input */}
                <div className="shrink-0 bg-white border-t border-zinc-100">
                  <div className="px-6 py-4 flex items-center space-x-6 border-b border-zinc-50">
                    <button 
                      onClick={handleLike}
                      className="group flex items-center space-x-2 text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      <Heart size={20} className={isLiked ? "fill-zinc-900 text-zinc-900" : ""} />
                      <span className="text-sm font-bold">{likes}</span>
                    </button>
                    <div className="flex items-center space-x-2 text-zinc-600">
                      <MessageCircle size={20} />
                      <span className="text-sm font-bold">{totalComments}</span>
                    </div>
                  </div>
                  <div className="p-4 relative">
                    <AnimatePresence>
                      {submitSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute -top-12 left-0 right-0 flex justify-center z-10 pointer-events-none"
                        >
                          <div className="bg-zinc-900 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 border border-zinc-800">
                            <CheckCircle size={14} className="text-emerald-400" />
                            <span>评论已提交，审核通过后将公开展示</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {replyTo && (
                      <div className="flex items-center justify-between mb-2 px-2">
                        <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                          <CornerDownRight size={12} className="text-zinc-400" />
                          回复 <span className="font-bold text-zinc-900">@{replyTo.author}</span>
                        </span>
                        <button onClick={() => setReplyTo(null)} className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">取消</button>
                      </div>
                    )}
                    <form onSubmit={handleAddComment} className="relative">
                      <input
                        ref={commentInputRef}
                        type="text"
                        placeholder={replyTo ? `回复 @${replyTo.author}...` : "写下评论..."}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200/80 rounded-full pl-6 pr-14 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-all placeholder:text-zinc-400 font-light"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-900 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-all"
                      >
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
