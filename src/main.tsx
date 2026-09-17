import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ShareView } from './components/ShareView';
import { ArticleView } from './components/ArticleView';
import './index.css';

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
