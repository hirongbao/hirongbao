import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, MessageCircle, Share, Send, Loader2, CheckCircle } from 'lucide-react';
import { Post, Comment } from '../types';
import { PostMedia } from './PostMedia';
import { formatRelativeTime } from '../utils/time';

interface PostDetailModalProps {
  post: Post | null;
  authorName: string;
  authorAvatar: string;
  onClose: () => void;
}

export function PostDetailModal({ post, authorName, authorAvatar, onClose }: PostDetailModalProps) {
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post?.comments || []);
  const [likes, setLikes] = useState(post?.likeCount || 0);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const likeBusy = React.useRef(false);

  // Update local state when post changes (e.g. when opening a new post)
  React.useEffect(() => {
    if (post) {
      setComments(post.comments);
      setLikes(post.likeCount);
      setIsLiked(false);
      setNewComment('');
      setSubmitSuccess(false);
    }
  }, [post]);

  // 提交评论到后端并展示审核提示
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || !post) return;
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const payload = await res.json();
      if (res.ok && payload.code === 0) {
        setNewComment('');
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 4000);
      } else {
        alert(payload.message || '评论失败，请稍后重试');
      }
    } catch {
      alert('评论失败，请稍后重试');
    }
  };

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
              <div className="w-full lg:flex-1 bg-black rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative pointer-events-auto">
                {post.media.length > 0 ? (
                  <div className="w-full h-full relative flex flex-col overflow-hidden">
                    <PostMedia media={post.media} mode="detail" />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-12 text-center">
                    <p className="text-3xl lg:text-5xl font-serif leading-[1.3] italic text-zinc-100">
                      "{post.content}"
                    </p>
                  </div>
                )}
              </div>

              {/* Box 2: Info & Comments */}
              <div className="w-full lg:w-[400px] xl:w-[480px] h-[75vh] lg:h-auto bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden shrink-0 pointer-events-auto">
                
                {/* Scrollable Content (Header + Comments) */}
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  
                  {/* Header Info (Author + Content) */}
                  <div className="p-8 pb-6 border-b border-zinc-100">
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
                      <p className="text-zinc-800 leading-relaxed text-sm">
                        {post.content}
                      </p>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div className="p-8">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6">访客留言 ({comments.length})</h5>
                    <div className="space-y-6">
                      {comments.length > 0 ? (
                        comments.map(comment => (
                          <div key={comment.id} className="flex space-x-4 text-sm">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                              <span className="text-zinc-900 font-serif italic text-sm">
                                {comment.author.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-baseline space-x-3 mb-1">
                                <span className="font-bold text-zinc-900 tracking-tight">{comment.author}</span>
                                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">{comment.createdAt}</span>
                              </div>
                              <p className="text-zinc-600 leading-relaxed">{comment.content}</p>
                            </div>
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
                      <span className="text-sm font-bold">{comments.length}</span>
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
                    <form onSubmit={handleAddComment} className="relative">
                      <input
                        type="text"
                        placeholder="写下评论..."
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
