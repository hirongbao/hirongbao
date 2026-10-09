import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ShareView } from './components/ShareView';
import { ArticleView } from './components/ArticleView';
import './index.css';

// 全局 fetch 拦截：若本地存在用户登录 Token 且请求本站 API，自动附带 Authorization 请求头
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem('site_token');
  if (token) {
    const url = typeof input === 'string'
      ? input
      : input instanceof Request
        ? input.url
        : input.toString();

    // 仅拦截本站以 /api 开头的内部接口，避免凭证泄露给第三方 CDN 或外部服务
    if (url.startsWith('/api') || url.includes('/api/')) {
      const options = init ? { ...init } : {};
      const headers = new Headers(options.headers || (input instanceof Request ? input.headers : {}));
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      options.headers = headers;
      return originalFetch(input, options);
    }
  }
  return originalFetch(input, init);
};

const urlParams = new URLSearchParams(window.location.search);
const sharePostId = urlParams.get('sharePostId');
const pathname = window.location.pathname;

const isArticleRoute =
  pathname.startsWith('/articles') ||
  pathname.startsWith('/article') ||
  urlParams.has('articleId') ||
  urlParams.get('view') === 'articles';

if (sharePostId) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ShareView postId={sharePostId} />
    </StrictMode>
  );
} else if (isArticleRoute) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ArticleView />
    </StrictMode>
  );
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
