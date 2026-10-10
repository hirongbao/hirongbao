import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, AlertTriangle, RefreshCw, ChevronDown, User } from 'lucide-react';
import { Profile } from './components/Profile';
import { PostCard } from './components/PostCard';
import { SubscribeModal } from './components/SubscribeModal';
import { UnsubscribeModal } from './components/UnsubscribeModal';
import { PostDetailModal } from './components/PostDetailModal';
import { Post, ProfileData, ApiResponse, RawPost, Category, PostPageData, ReleaseLog } from './types';
import { formatRelativeTime } from './utils/time';
import { SkeletonCard } from './components/SkeletonCard';
import { ProfileSkeleton } from './components/ProfileSkeleton';
import { ReleaseLogSection } from './components/ReleaseLogSection';
import { AnniversariesSection } from './components/AnniversariesSection';
import AuthModal from './components/AuthModal';
import UserCenterModal from './components/UserCenterModal';
import NotificationModal from './components/NotificationModal';
import GuestbookSection from './components/GuestbookSection';
import UgcPostModal from './components/UgcPostModal';
import AnniversaryModal from './components/AnniversaryModal';
import { MessageInboxModal } from './components/MessageInboxModal';
import { ChatModal } from './components/ChatModal';
import { getUserInfo } from './utils/auth';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';


// 后端动态原始数据映射为展示模型（时间转相对时间、id 转字符串）
const mapComment = (c: any): import('./types').Comment => ({
  id: String(c.id),
  author: c.author,
  authorAvatar: c.authorAvatar || null,
  userId: c.userId ? String(c.userId) : undefined,
  content: c.content,
  createdAt: formatRelativeTime(c.createdAt),
  parentId: c.parentId ? String(c.parentId) : null,
  replyToAuthor: c.replyToAuthor || null,
  children: (c.children || []).map(mapComment)
});

const mapComments = (raw: any[]): import('./types').Comment[] => raw.map(mapComment);

const mapPost = (p: RawPost): Post => {
  const cat = p.category
    ? { id: String(p.category.id), name: p.category.name }
    : (p.categoryId || p.categoryName)
    ? { id: String(p.categoryId || 'notes'), name: p.categoryName || '随笔' }
    : null;
  return {
    id: String(p.id),
    content: p.content || '',
    media: p.media || [],
    createdAt: formatRelativeTime(p.createdAt),
    likeCount: p.likeCount || 0,
    category: cat,
    comments: mapComments(p.comments || []),
    accountName: p.accountName,
    nickname: p.nickname,
    avatarUrl: p.avatarUrl
  };
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [unsubscribeData, setUnsubscribeData] = useState<{email: string, token: string} | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const targetAccount = useMemo(() => {
    const match = window.location.pathname.match(/^\/([a-zA-Z0-9_]+)\/post\/?$/);
    return match ? match[1] : null;
  }, []);
  const [activeSection, setActiveSection] = useState<'feed' | 'square' | 'releases' | 'anniversaries' | 'guestbook'>(targetAccount ? 'feed' : 'square');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUserCenterOpen, setIsUserCenterOpen] = useState(false);
  const [isUgcOpen, setIsUgcOpen] = useState(false);
  const [isAnniversaryOpen, setIsAnniversaryOpen] = useState(false);
  const [user, setUser] = useState(getUserInfo());
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ userId: string; name: string; avatarUrl?: string | null } | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    
    const token = localStorage.getItem('site_token') || '';

    // Fetch initial unread count
    fetch('/api/notifications/unread-count', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(r => r.json()).then(res => {
        if (res.code === 0 && typeof res.data === 'number') setUnreadCount(res.data);
      }).catch(() => {});

    // Fetch initial unread message count
    if (token) {
      fetch('/api/hirongbaohub/messages/unread', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json()).then(res => {
          if (res.code === 0 && typeof res.data === 'number') setUnreadMessageCount(res.data);
        }).catch(() => {});
    }

    const stompClient = new Client({
      webSocketFactory: () => new SockJS('/ws/notify'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = () => {
      stompClient.subscribe('/topic/online-count', (msg) => {
        try {
          window.dispatchEvent(new CustomEvent('ws_online_count', { detail: Number(msg.body) }));
        } catch (e) {}
      });
      if (user?.id) {
        stompClient.subscribe(`/topic/notify/${user.id}`, (msg) => {
          try {
            const data = JSON.parse(msg.body);
            if (data.type === 'MESSAGE') {
              if (data.unreadCount !== undefined) setUnreadMessageCount(data.unreadCount);
            } else {
              if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
            }
            window.dispatchEvent(new CustomEvent("ws_notify", { detail: data }));
          } catch (e) {}
        });
      }
    };
    stompClient.activate();
    return () => { stompClient.deactivate(); };
  }, [user?.id]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setIsAuthOpen(true);
    };
    window.addEventListener('auth_expired', handleAuthExpired);
    return () => window.removeEventListener('auth_expired', handleAuthExpired);
  }, []);
  const [releaseLogs, setReleaseLogs] = useState<ReleaseLog[]>([]);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  
  const [squarePosts, setSquarePosts] = useState<Post[]>([]);
  const [squarePage, setSquarePage] = useState<number>(1);
  const [hasMoreSquare, setHasMoreSquare] = useState<boolean>(true);
      
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const [numCols, setNumCols] = useState(1);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // 获取当前选中的帖子列表
  const currentPosts = activeSection === 'square' ? squarePosts : posts;

  useEffect(() => {
    const siteName = profile?.name || 'hirongbao';
    document.title = activeSection === 'releases' ? `更新日志 · ${siteName}` : activeSection === 'anniversaries' ? `纪念日 · ${siteName}` : activeSection === 'square' ? `动态广场 · ${siteName}` : `动态 · ${siteName}`;
  }, [profile?.name, activeSection]);

  useEffect(() => {
    const updateCols = () => {
      const w = window.innerWidth;
      if (w >= 1536) setNumCols(3); // 2xl
      else if (w >= 1280) setNumCols(3); // xl
      else if (w >= 1024) setNumCols(2); // lg
      else if (w >= 640) setNumCols(2); // sm
      else setNumCols(1); // mobile
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  // 处理从外部点进来的 URL 参数（postId 或 退订链接）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('postId');
    const unsubscribe = params.get('unsubscribe');
    const email = params.get('email');
    const token = params.get('token');

    if (postId) {
      fetch(`/api/posts/${postId}`)
        .then(res => res.json())
        .then((env: ApiResponse<RawPost>) => {
          if (env.code === 0 && env.data) {
            setSelectedPost(mapPost(env.data));
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch(console.error);
    }

    if (unsubscribe === 'true' && email && token) {
      setUnsubscribeData({ email, token });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);



  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, postsRes, releasesRes] = await Promise.all([
          fetch(targetAccount ? `/api/profile/user/${targetAccount}` : '/api/profile'),
          fetch(targetAccount ? `/api/posts/ugc/user/${targetAccount}?page=1&size=12` : '/api/posts/page?page=1&size=12'),
          fetch('/api/releases')
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

        if (releasesRes.ok) {
          const env: ApiResponse<ReleaseLog[]> = await releasesRes.json();
          if (env.code === 0 && env.data) setReleaseLogs(env.data);
        }

        if (postsRes.ok) {
          const contentType = postsRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const postsEnvelope = await postsRes.json();
            if (postsEnvelope.code === 0 && postsEnvelope.data) {
              const data = postsEnvelope.data;
              const items = data.items || data.records || [];
              const page = data.page || data.current || 1;
              const hasMore = data.hasMore !== undefined ? data.hasMore : (page * (data.size || 12) < (data.total || 0));
              setPosts(items.map((p: any) => mapPost(p)));
              setPage(page);
              setHasMore(hasMore);
            } else {
              setHasMore(false);
            }
          } else {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setErrorMsg('暂时无法连接服务，请稍后重试');
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [retryCount]);

  useEffect(() => {
    if (activeSection === 'square' && squarePosts.length === 0 && hasMoreSquare && !isFetchingPosts) {
      setIsFetchingPosts(true);
      fetch('/api/posts/square?page=1&size=12')
        .then(res => res.json())
        .then(env => {
          if (env.code === 0 && env.data) {
            const items = env.data.items || env.data.records || [];
            setSquarePosts(items.map(mapPost));
            setHasMoreSquare(env.data.hasMore !== false);
          }
        })
        .finally(() => setIsFetchingPosts(false));
    }
  }, [activeSection, squarePosts.length, hasMoreSquare, isFetchingPosts]);

  // 滚动到列表底部时自动加载下一页
  useEffect(() => {
    const target = loadMoreRef.current;
    const isSquare = activeSection === 'square';
    const currentHasMore = isSquare ? hasMoreSquare : hasMore;
    const currentPage = isSquare ? squarePage : page;

    if (!target || loading || isFetchingPosts || !currentHasMore) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      const nextPage = currentPage + 1;
      setIsFetchingPosts(true);
      const endpoint = isSquare
        ? `/api/posts/square?page=${nextPage}&size=12`
        : targetAccount 
          ? `/api/posts/ugc/user/${targetAccount}?page=${nextPage}&size=12` 
          : `/api/posts/page?page=${nextPage}&size=12`;
      fetch(endpoint)
        .then(res => res.json())
        .then(env => {
          if (env.code !== 0 || !env.data) {
            if (isSquare) setHasMoreSquare(false);
            else setHasMore(false);
            return;
          }
          const data = env.data;
          const items = data.items || data.records || [];
          const newPage = data.page || data.current || 1;
          const newHasMore = data.hasMore !== undefined ? data.hasMore : (newPage * (data.size || 12) < (data.total || 0));
          
          if (isSquare) {
            setSquarePosts(prev => [...prev, ...items.map((p: any) => mapPost(p))]);
            setSquarePage(newPage);
            setHasMoreSquare(newHasMore);
          } else {
            setPosts(prev => [...prev, ...items.map((p: any) => mapPost(p))]);
            setPage(newPage);
            setHasMore(newHasMore);
          }
        })
        .catch(error => {
          console.error('Failed to load more posts:', error);
          if (isSquare) setHasMoreSquare(false);
          else setHasMore(false);
        })
        .finally(() => setIsFetchingPosts(false));
    }, { rootMargin: '600px 0px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, isFetchingPosts, hasMore, hasMoreSquare, page, squarePage, targetAccount, activeSection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex">
        <aside className="hidden lg:block w-[320px] fixed h-screen bg-white/80 backdrop-blur-xl border-r border-zinc-200/50 z-30">
          <ProfileSkeleton />
        </aside>
        <div className="flex-1 min-w-0 lg:ml-[320px] min-h-screen flex justify-center">
          <main className="p-3 sm:p-6 md:p-8 lg:p-12 xl:p-16 2xl:p-20 w-full max-w-[1920px]">
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-8 animate-pulse">
                <div className="h-4 w-32 bg-zinc-200 rounded"></div>
              </div>
              <div className="flex gap-4 mb-8 overflow-x-auto hide-scrollbar">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-24 bg-zinc-200 rounded-full animate-pulse shrink-0"></div>)}
              </div>
              <div className="flex gap-4 sm:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12 items-start w-full min-w-0">
                {Array.from({ length: numCols }).map((_, colIndex) => (
                  <div key={colIndex} className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
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
          <button type="button" onClick={() => { setErrorMsg(null); setProfile(null); setPosts([]); setLoading(true); setRetryCount(count => count + 1); }} className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700">
            <RefreshCw size={15} />
            重试
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F8F9FA] selection:bg-zinc-200 selection:text-zinc-900 flex">
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
        className={`fixed top-0 bottom-0 left-0 w-[85vw] max-w-[320px] bg-white border-r border-zinc-200 p-6 lg:p-12 shrink-0 overflow-y-auto z-50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl lg:shadow-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
      >
        <div className="lg:hidden absolute top-6 right-6">
          <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors bg-zinc-100 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>
        <Profile profile={profile} onSubscribe={() => { setIsSidebarOpen(false); setIsSubscribeOpen(true); }} activeSection={activeSection} onSectionChange={(s) => { setActiveSection(s); setIsSidebarOpen(false); }} isMainSite={!targetAccount} />
      </aside>

      {/* Feed Area */}
      <div className="flex-1 min-w-0 lg:ml-[320px] min-h-screen flex justify-center">
        <main className="p-3 sm:p-6 md:p-8 lg:p-12 xl:p-16 2xl:p-20 w-full max-w-[1920px]">
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
                <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">
                  {activeSection === 'releases' ? '更新日志 / CHANGELOG' : activeSection === 'anniversaries' ? '纪念日 / ANNIVERSARIES' : activeSection === 'guestbook' ? '留言板 / GUESTBOOK' : activeSection === 'square' ? '动态广场 / SQUARE' : '信息流 / 动态'}
                </h2>
              </div>
              <div>
                {!user ? (
                  <button 
                    onClick={() => setIsAuthOpen(true)}
                    className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors flex items-center space-x-2"
                  >
                    <User size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">登录</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsUserCenterOpen(true)}
                    className="flex items-center space-x-2 p-1 pr-3 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-300 flex items-center justify-center overflow-hidden shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-zinc-500">{user.accountName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-zinc-700 hidden sm:inline truncate max-w-[100px]">{user.accountName}</span>
                  </button>
                )}
              </div>
            </motion.div>
            {activeSection === 'releases' ? (
              <ReleaseLogSection releaseLogs={releaseLogs} />
            ) : activeSection === 'anniversaries' ? (
              <AnniversariesSection targetAccount={targetAccount} />
            ) : activeSection === 'guestbook' ? (
              <GuestbookSection onRequestLogin={() => setIsAuthOpen(true)} targetAccount={targetAccount} />
            ) : <>
                        {currentPosts.length === 0 && !isFetchingPosts ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex w-full flex-col items-center justify-center py-24 px-4 text-center">
                
                {/* Illustration: Delicate Wireframe & Pastel Orbs */}
                <div className="w-32 h-32 mb-6 relative flex items-center justify-center">
                  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
                    <defs>
                      <filter id="glow-heavy" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="16" result="blur" />
                      </filter>
                      <filter id="glow-light" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                      </filter>
                    </defs>

                    <circle cx="80" cy="70" r="36" fill="#e0e7ff" filter="url(#glow-heavy)" className="animate-float" />
                    <circle cx="100" cy="100" r="24" fill="#fce7f3" filter="url(#glow-light)" className="animate-float-delayed" />
                    <circle cx="50" cy="90" r="20" fill="#ccfbf1" filter="url(#glow-light)" style={{ animationDelay: '1.5s' }} className="animate-float" />

                    <rect x="35" y="45" width="70" height="50" rx="12" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.6" />
                    
                    <rect x="55" y="65" width="70" height="50" rx="12" fill="white" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="1.5" className="animate-float" style={{ animationDuration: '8s' }} />
                    
                    <line x1="70" y1="85" x2="95" y2="85" stroke="#64748b" strokeWidth="2" strokeLinecap="round" className="animate-float" style={{ animationDuration: '8s' }} />
                    <line x1="70" y1="95" x2="110" y2="95" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" className="animate-float" style={{ animationDuration: '8s' }} />
                    
                    <circle cx="130" cy="50" r="3" fill="#cbd5e1" className="animate-float-delayed" />
                    <path d="M30 110 L35 115 L30 120 L25 115 Z" fill="#e2e8f0" className="animate-float" style={{ animationDelay: '2s' }} />
                  </svg>
                </div>

                {/* Text Content */}
                <div className="space-y-2 mb-8">
                  <h2 className="text-base font-semibold text-slate-800 tracking-tight">这里暂时没有动态</h2>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[240px] mx-auto">
                      已经到底啦，没有更多内容了。<br/>换个时间再来看看吧。
                  </p>
                </div>

                {/* Action Area */}
                <a href="https://hirongbao.com" className="inline-flex justify-center items-center px-6 py-2.5 rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 w-full max-w-[160px] bg-white/70 backdrop-blur-md border border-white/90 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]">
                  返回主站
                </a>

              </motion.div>
            ) : (
            <div className="flex gap-4 sm:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12 items-start w-full min-w-0">
              {isFetchingPosts ? (
                Array.from({ length: numCols }).map((_, colIndex) => (
                  <div key={colIndex} className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
                    <SkeletonCard height="h-[250px]" />
                    <SkeletonCard height="h-[400px]" />
                  </div>
                ))
              ) : (
                Array.from({ length: numCols }).map((_, colIndex) => {
                  const colPosts = currentPosts.filter((_, i) => i % numCols === colIndex);
                  return (
                    <div key={colIndex} className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
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
                              authorName={post.nickname || post.accountName || profile.name} 
                              authorAvatar={post.avatarUrl || profile.avatarUrl} 
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
            )}
            
            <div className="py-12 text-center text-sm text-zinc-400">
              <div ref={loadMoreRef} className="h-8" aria-hidden="true" />
              <p>{isFetchingPosts ? '正在加载更多动态…' : hasMore ? '继续下滑加载更多' : '已经到底啦，没有更多内容了。'}</p>
            </div>
            </>}
          </div>
        </main>
      </div>

      <SubscribeModal 
        isOpen={isSubscribeOpen} 
        onClose={() => setIsSubscribeOpen(false)} 
      />

      <UnsubscribeModal
        isOpen={unsubscribeData !== null}
        email={unsubscribeData?.email || ''}
        token={unsubscribeData?.token || ''}
        onClose={() => setUnsubscribeData(null)}
      />

      <PostDetailModal
        post={selectedPost}
        authorName={selectedPost?.nickname || selectedPost?.accountName || profile?.name || ''}
        authorAvatar={selectedPost?.avatarUrl || profile?.avatarUrl || ''}
        onClose={() => setSelectedPost(null)}
      />
      
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onSuccess={() => setUser(getUserInfo())} 
      />
      
            <NotificationModal 
        isOpen={isNotifOpen} 
        onClose={() => setIsNotifOpen(false)}
        token={localStorage.getItem('site_token') || ''}
      />
      <UserCenterModal 
        isOpen={isUserCenterOpen} 
        unreadCount={unreadCount}
        unreadMessageCount={unreadMessageCount}
        onOpenNotifications={() => {
          setIsUserCenterOpen(false);
          setIsNotifOpen(true);
          setUnreadCount(0);
        }}
        onOpenMessageInbox={() => {
          setIsUserCenterOpen(false);
          setIsInboxOpen(true);
        }}
        onClose={() => setIsUserCenterOpen(false)} 
        onLogout={() => setUser(null)}
        onPublish={() => setIsUgcOpen(true)}
        onPublishAnniversary={() => setIsAnniversaryOpen(true)}
      />

      <MessageInboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onOpenChat={(userId, name, avatarUrl) => {
          setChatTarget({ userId, name, avatarUrl });
        }}
      />

      {chatTarget && (
        <ChatModal
          isOpen={true}
          onClose={() => setChatTarget(null)}
          targetUserId={chatTarget.userId}
          targetName={chatTarget.name}
          targetAvatarUrl={chatTarget.avatarUrl}
        />
      )}
      
      <UgcPostModal
        isOpen={isUgcOpen}
        onClose={() => setIsUgcOpen(false)}
        onSuccess={() => {}}
      />

      <AnniversaryModal
        isOpen={isAnniversaryOpen}
        onClose={() => setIsAnniversaryOpen(false)}
      />
    </div>
  );
}
