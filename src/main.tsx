import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ShareView } from './components/ShareView';
import { ArticleView } from './components/ArticleView';
import { AuthWrapper } from './components/AuthWrapper';
import './index.css';

// 全局拦截 fetch，附带密码并处理 401
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const pwd = localStorage.getItem('site_password');
  const headers = new Headers(init?.headers);
  if (pwd) {
    headers.set('X-Site-Password', pwd);
  }
  const config = { ...init, headers };
  
  const response = await originalFetch(input, config);
  
  if (response.status === 401 && String(input).startsWith('/api/')) {
    localStorage.removeItem('site_password');
    window.dispatchEvent(new Event('auth-failed'));
  }
  return response;
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
      <AuthWrapper><ShareView postId={sharePostId} /></AuthWrapper>
    </StrictMode>
  );
} else if (isArticleRoute) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthWrapper><ArticleView /></AuthWrapper>
    </StrictMode>
  );
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthWrapper><App /></AuthWrapper>
    </StrictMode>,
  );
}
