import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ShareView } from './components/ShareView';
import './index.css';


const urlParams = new URLSearchParams(window.location.search);
const sharePostId = urlParams.get('sharePostId');

if (sharePostId) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ShareView postId={sharePostId} />
    </StrictMode>
  );
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

