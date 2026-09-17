import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Eye, Clock, Share2, Check, BookOpen, Home, RefreshCw } from 'lucide-react';
import { marked } from 'marked';
import '../assets/latex.css';

interface Article {
  id: number;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  content: string;
  status: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ArticleViewProps {
  initialArticleId?: string | null;
}

export function ArticleView({ initialArticleId }: ArticleViewProps) {
  const [currentId, setCurrentId] = useState<string | null>(() => {
    if (initialArticleId) return initialArticleId;
    const path = window.location.pathname;
    const match = path.match(/^\/articles?\/(\d+)/);
    if (match) return match[1];
    const params = new URLSearchParams(window.location.search);
    return params.get('articleId');
  });

  const [articles, setArticles] = useState<Article[]>([]);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 监听浏览器前进后退
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/articles?\/(\d+)/);
      if (match) {
        setCurrentId(match[1]);
      } else {
        const params = new URLSearchParams(window.location.search);
        setCurrentId(params.get('articleId') || null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 监听文章阅读滚动进度
  useEffect(() => {
    if (!currentId) return;
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentId]);

  // 加载数据
  useEffect(() => {
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (currentId) {
      // 加载单篇文章
      fetch(`/api/articles/${currentId}`)
        .then((res) => res.json())
        .then((res) => {
          if (res.code === 0 && res.data) {
            setArticle(res.data);
            document.title = `${res.data.title} - 文章阅读`;
          } else {
            setArticle(null);
          }
        })
        .catch((err) => {
          console.error(err);
          setArticle(null);
        })
        .finally(() => setLoading(false));
    } else {
      // 加载文章列表
      fetch('/api/articles?page=1&size=50')
        .then((res) => res.json())
        .then((res) => {
          if (res.code === 0 && res.data) {
            setArticles(res.data.records || res.data.items || []);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
      document.title = '文章列表 - 个人主页';
    }
  }, [currentId]);

  const navigateToArticle = (id: number) => {
    setCurrentId(String(id));
    window.history.pushState({}, '', `/articles/${id}`);
  };

  const navigateToList = () => {
    setCurrentId(null);
    window.history.pushState({}, '', '/articles');
  };

  const navigateToHome = () => {
    window.location.href = '/';
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // 计算预计阅读时长
  const calcReadTime = (content: string) => {
    const words = content ? content.length : 0;
    const mins = Math.max(1, Math.round(words / 400));
    return `约 ${mins} 分钟`;
  };

  // 单篇长文阅读视图
  if (currentId) {
    return (
      <div className="min-h-screen bg-[#fafaf9] text-zinc-800 selection:bg-zinc-900 selection:text-white flex flex-col">
        {/* 顶部阅读进度条 */}
        <div
          className="fixed top-0 left-0 h-[3px] bg-zinc-900 z-50 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />

        {/* 悬浮顶部操作栏 */}
        <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 border-b border-zinc-200/60 transition-all">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <button
              onClick={navigateToList}
              className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors py-1.5 px-3 rounded-full hover:bg-zinc-100"
            >
              <ArrowLeft size={15} />
              <span>文章列表</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors py-1.5 px-3 rounded-full hover:bg-zinc-100"
                title="复制文章链接"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                <span>{copied ? '已复制' : '分享'}</span>
              </button>
              <button
                onClick={navigateToHome}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors py-1.5 px-3 rounded-full hover:bg-zinc-100"
                title="返回主页"
              >
                <Home size={14} />
                <span>主页</span>
              </button>
            </div>
          </div>
        </header>

        {/* 主体文章内容 */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <RefreshCw size={24} className="animate-spin text-zinc-500" />
              <span className="text-xs font-serif italic">文章载入中...</span>
            </div>
          ) : !article ? (
            <div className="py-32 text-center text-zinc-400 font-serif">
              <p className="text-lg mb-4">文章不存在或已下线</p>
              <button
                onClick={navigateToList}
                className="text-xs text-zinc-900 underline underline-offset-4 hover:opacity-70"
              >
                返回全部文章
              </button>
            </div>
          ) : (
            <article className="animate-in fade-in duration-500">
              {/* 封面大图 */}
              {article.coverUrl && (
                <div className="w-full max-w-[21cm] mx-auto h-[240px] sm:h-[380px] rounded-2xl overflow-hidden mb-8 shadow-sm border border-zinc-200/50">
                  <img
                    src={article.coverUrl}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* 头部元信息 */}
              <div className="max-w-[21cm] mx-auto mb-6 px-4 text-center">
                <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-zinc-900 tracking-tight leading-tight mb-4">
                  {article.title}
                </h1>

                {article.summary && (
                  <p className="text-sm sm:text-base font-serif italic text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-6">
                    {article.summary}
                  </p>
                )}

                <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-400 font-serif">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    {formatDate(article.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {calcReadTime(article.content)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye size={13} />
                    {article.viewCount || 1} 次阅读
                  </span>
                </div>
              </div>

              {/* Typora LaTeX 正文渲染 */}
              <div id="write" className="article-content">
                <div
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(article.content || '', { gfm: true, breaks: true }) as string,
                  }}
                />
              </div>

              {/* 底部导航 */}
              <div className="max-w-[21cm] mx-auto mt-16 pt-8 border-t border-zinc-200/80 flex items-center justify-between text-xs text-zinc-500">
                <button
                  onClick={navigateToList}
                  className="flex items-center gap-2 hover:text-zinc-900 transition-colors font-medium"
                >
                  <ArrowLeft size={14} />
                  <span>返回文章列表</span>
                </button>
                <button
                  onClick={navigateToHome}
                  className="flex items-center gap-1.5 hover:text-zinc-900 transition-colors"
                >
                  <Home size={14} />
                  <span>个人主页</span>
                </button>
              </div>
            </article>
          )}
        </main>
      </div>
    );
  }

  // 文章列表视图 (/articles)
  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-800 selection:bg-zinc-900 selection:text-white flex flex-col">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-zinc-200/60">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={18} className="text-zinc-900" />
            <span className="text-sm font-serif font-bold tracking-wider text-zinc-900">ARTICLES</span>
          </div>

          <button
            onClick={navigateToHome}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors py-1.5 px-3 rounded-full hover:bg-zinc-100"
          >
            <Home size={14} />
            <span>返回主页</span>
          </button>
        </div>
      </header>

      {/* 主体列表 */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 tracking-tight mb-2">
            文章与长文沉浸
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-serif">
            深度思考、架构设计与工程实践记录。
          </p>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <RefreshCw size={24} className="animate-spin text-zinc-300" />
          </div>
        ) : articles.length === 0 ? (
          <div className="py-24 text-center text-zinc-400 font-serif italic">
            暂无已发布的公开文章。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map((item) => (
              <div
                key={item.id}
                onClick={() => navigateToArticle(item.id)}
                className="group cursor-pointer bg-white rounded-2xl border border-zinc-200/70 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {item.coverUrl ? (
                  <div className="h-48 w-full overflow-hidden bg-zinc-100">
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-28 w-full bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center border-b border-zinc-100">
                    <BookOpen size={24} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-zinc-900 group-hover:text-zinc-700 transition-colors mb-2 line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 line-clamp-2 leading-relaxed font-serif mb-4">
                      {item.summary || '点击阅读全文...'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-serif">
                    <span>{formatDate(item.createdAt)}</span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {item.viewCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
