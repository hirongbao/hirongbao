import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { Profile } from './components/Profile';
import { PostCard } from './components/PostCard';
import { SubscribeModal } from './components/SubscribeModal';
import { PostDetailModal } from './components/PostDetailModal';
import { Post, ProfileData, ApiResponse, RawPost, Category } from './types';
import { formatRelativeTime } from './utils/time';
import { SkeletonCard } from './components/SkeletonCard';
import { ProfileSkeleton } from './components/ProfileSkeleton';

// 模拟分类数据（后端接入时可以从接口读取）
const MOCK_CATEGORIES: Category[] = [
  { id: 'all', name: '全部' },
  { id: 'food', name: '美食' },
  { id: 'scenery', name: '风景' },
  { id: 'notes', name: '随笔' },
];

// 后端动态原始数据映射为展示模型（时间转相对时间、id 转字符串）
const mapPost = (p: RawPost): Post => ({
  id: String(p.id),
  content: p.content || '',
  media: p.media || [],
  createdAt: formatRelativeTime(p.createdAt),
  likeCount: p.likeCount || 0,
  category: p.category ? { id: String(p.category.id), name: p.category.name } : null,
  comments: (p.comments || []).map(c => ({
    id: String(c.id),
    author: c.author,
    content: c.content,
    createdAt: formatRelativeTime(c.createdAt)
  }))
});

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [postsCache, setPostsCache] = useState<Record<string, Post[]>>({});
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | number>('all');
  
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const [numCols, setNumCols] = useState(1);

  // 获取当前选中的帖子列表
  const currentPosts = postsCache[selectedCategoryId] || [];

  useEffect(() => {
    const siteName = profile?.name || 'hirongbao';
    const categoryName = categories.find(category => category.id === selectedCategoryId)?.name;
    document.title = categoryName && categoryName !== '全部'
      ? `${categoryName} · ${siteName}`
      : `动态 · ${siteName}`;
  }, [profile?.name, categories, selectedCategoryId]);

  useEffect(() => {
    const updateCols = () => {
      const w = window.innerWidth;
      if (w >= 1536) setNumCols(3); // 2xl
      else if (w >= 1280) setNumCols(3); // xl
      else if (w >= 1024) setNumCols(2); // lg
      else if (w >= 640) setNumCols(2); // sm
      else setNumCols(1);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/posts')
        ]);

        if (profileRes.ok) {
          const contentType = profileRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const profileEnvelope: ApiResponse<ProfileData> = await profileRes.json();
            if (profileEnvelope.code === 0 && profileEnvelope.data) {
              setProfile(profileEnvelope.data);
            } else {
               setErrorMsg(profileEnvelope.message || '资料加载失败，请稍后再试');
            }
          } else {
             setErrorMsg('服务返回了异常内容，请稍后再试');
          }
        } else {
           setErrorMsg(profileRes.status >= 500
             ? '服务暂时不可用，请稍后再试'
             : `资料加载失败（${profileRes.status}）`);
        }

        if (postsRes.ok) {
          const contentType = postsRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const postsEnvelope: ApiResponse<RawPost[]> = await postsRes.json();
            if (postsEnvelope.code === 0 && postsEnvelope.data) {
              setPostsCache({ 'all': postsEnvelope.data.map(mapPost) });
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setErrorMsg('暂时无法连接服务，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [retryCount]);

  // 监听分类切换，如果没有缓存数据则发起新的请求
  useEffect(() => {
    // 等待首次全量加载完成
    if (loading) return;
    
    // 如果已有缓存，则直接使用，不再请求
    if (postsCache[selectedCategoryId]) return;

    const fetchCategoryPosts = async () => {
      setIsFetchingPosts(true);
      try {
        const query = selectedCategoryId === 'all' ? '' : `?category=${selectedCategoryId}`;
        const res = await fetch(`/api/posts${query}`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const env: ApiResponse<RawPost[]> = await res.json();
            if (env.code === 0 && env.data) {
              setPostsCache(prev => ({
                ...prev,
                [selectedCategoryId]: env.data.map(mapPost)
              }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch category posts:', err);
      } finally {
        setIsFetchingPosts(false);
      }
    };

    fetchCategoryPosts();
  }, [selectedCategoryId, loading, postsCache]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex">
        <aside className="hidden lg:block w-[320px] fixed h-screen bg-white/80 backdrop-blur-xl border-r border-zinc-200/50 z-30">
          <ProfileSkeleton />
        </aside>
        <div className="flex-1 lg:ml-[320px] min-h-screen flex justify-center">
          <main className="p-6 md:p-8 lg:p-12 xl:p-16 2xl:p-20 w-full max-w-[1920px]">
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-8 animate-pulse">
                <div className="h-4 w-32 bg-zinc-200 rounded"></div>
              </div>
              <div className="flex gap-4 mb-8 overflow-x-auto hide-scrollbar">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-24 bg-zinc-200 rounded-full animate-pulse shrink-0"></div>)}
              </div>
              <div className="flex gap-6 lg:gap-8 xl:gap-10 2xl:gap-12 items-start w-full">
                {Array.from({ length: numCols }).map((_, colIndex) => (
                  <div key={colIndex} className="flex-1 flex flex-col gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
                    <SkeletonCard height="h-[250px]" />
                    <SkeletonCard height="h-[400px]" />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle size={25} strokeWidth={1.8} />
          </div>
          <p className="mb-2 text-base font-semibold text-zinc-900">页面暂时无法加载</p>
          <p className="mb-6 text-sm leading-6 text-zinc-500">{errorMsg || '服务暂时不可用，请稍后再试。'}</p>
          <button type="button" onClick={() => { setErrorMsg(null); setProfile(null); setPostsCache({}); setLoading(true); setRetryCount(count => count + 1); }} className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700">
            <RefreshCw size={15} />
            重试
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] selection:bg-zinc-200 selection:text-zinc-900 flex">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Left Profile Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-screen w-full lg:w-[320px] bg-white border-r border-zinc-200 p-8 lg:p-12 shrink-0 overflow-y-auto z-50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl lg:shadow-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
      >
        <div className="lg:hidden absolute top-6 right-6">
          <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors bg-zinc-100 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>
        <Profile profile={profile} onSubscribe={() => setIsSubscribeOpen(true)} />
      </aside>

      {/* Feed Area */}
      <div className="flex-1 lg:ml-[320px] min-h-screen flex justify-center">
        <main className="p-6 md:p-8 lg:p-12 xl:p-16 2xl:p-20 w-full max-w-[1920px]">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-8"
            >
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 -ml-2 text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <Menu size={20} />
                </button>
                <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">信息流 / 动态</h2>
              </div>
            </motion.div>
            
            {/* 分类筛选器 */}
            <div className="flex gap-4 overflow-x-auto pb-4 mb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    selectedCategoryId === cat.id 
                      ? 'bg-zinc-900 text-white shadow-md scale-105' 
                      : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200/60'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex gap-6 lg:gap-8 xl:gap-10 2xl:gap-12 items-start w-full">
              {isFetchingPosts ? (
                Array.from({ length: numCols }).map((_, colIndex) => (
                  <div key={colIndex} className="flex-1 flex flex-col gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
                    <SkeletonCard height="h-[250px]" />
                    <SkeletonCard height="h-[400px]" />
                  </div>
                ))
              ) : (
                Array.from({ length: numCols }).map((_, colIndex) => {
                  const colPosts = currentPosts.filter((_, i) => i % numCols === colIndex);
                  return (
                    <div key={colIndex} className="flex-1 flex flex-col gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
                      {colPosts.map((post, index) => {
                        const globalIndex = currentPosts.findIndex(p => p.id === post.id);
                        return (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: globalIndex * 0.1 }}
                            className="w-full"
                          >
                            <PostCard 
                              post={post} 
                              authorName={profile.name} 
                              authorAvatar={profile.avatarUrl} 
                              onClick={() => setSelectedPost(post)}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="py-12 text-center text-sm text-zinc-400">
              <p>已经到底啦，没有更多内容了。</p>
            </div>
          </div>
        </main>
      </div>

      <SubscribeModal 
        isOpen={isSubscribeOpen} 
        onClose={() => setIsSubscribeOpen(false)} 
      />

      <PostDetailModal
        post={selectedPost}
        authorName={profile.name}
        authorAvatar={profile.avatarUrl}
        onClose={() => setSelectedPost(null)}
      />
    </div>
  );
}
