import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MediaItem } from '../types';

// 长图判定阈值：高宽比超过 2 视为长图（4:3、3:4、9:16 等常规比例都完整展示）
const TALL_RATIO = 2;

interface SlideImageProps {
  src: string;
  mode: 'card' | 'detail';
  onViewFull: () => void;
}

// 单张图片：卡片按原比例完整展示；详情统一 1:1 方框裁切，点击查看原图
function SlideImage({ src, mode, onViewFull }: SlideImageProps) {
  const [tall, setTall] = useState(false);

  // 切换到新图片时重置长图标记
  useEffect(() => { setTall(false); }, [src]);

  // 按图片原始宽高比判断是否长图
  const classify = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setTall(img.naturalHeight / Math.max(img.naturalWidth, 1) > TALL_RATIO);
  };

  if (mode === 'detail') {
    return (
      <div
        className="relative mx-auto w-full h-full flex flex-col items-center justify-center overflow-hidden cursor-zoom-in bg-zinc-950"
        onClick={e => { e.stopPropagation(); onViewFull(); }}
      >
        {/* Ambient blurred background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img referrerPolicy="no-referrer" src={src} alt="" className="w-full h-full object-cover blur-3xl opacity-50 scale-110" />
        </div>
        
        <img referrerPolicy="no-referrer" src={src} onLoad={classify} alt="" className="relative z-10 w-full h-full object-contain drop-shadow-2xl pointer-events-none" />
        
        {tall && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-4 py-1.5 rounded-full whitespace-nowrap pointer-events-none z-20">
            长图 · 点击查看原图
          </div>
        )}
      </div>
    );
  }

  if (tall) {
    return (
      <div
        className="relative w-full cursor-zoom-in overflow-hidden max-h-[560px]"
        onClick={e => { e.stopPropagation(); onViewFull(); }}
      >
        <img referrerPolicy="no-referrer" src={src} onLoad={classify} alt="" className="w-full object-cover object-top" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-4 py-1.5 rounded-full whitespace-nowrap">
          长图 · 点击查看大图
        </div>
      </div>
    );
  }

  return (
    <img
      referrerPolicy="no-referrer"
      src={src}
      onLoad={classify}
      alt=""
      className="w-full h-auto"
    />
  );
}

// 全屏大图查看：长图可上下滚动看原图，点击背景关闭
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [tall, setTall] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 select-none" 
      onClick={onClose}
    >
      <div className="absolute top-5 right-5 flex items-center gap-3 z-30">
        <span className="text-xs text-zinc-400 bg-white/10 px-3 py-1.5 rounded-full font-mono hidden sm:block">
          ESC / 点击背景退出
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/15 text-white hover:bg-white/30 flex items-center justify-center transition-colors shadow-lg cursor-pointer"
          title="关闭"
        >
          <X size={20} />
        </button>
      </div>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`w-full max-w-4xl h-full flex flex-col items-center justify-start overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full py-12 px-2`} 
        onClick={e => e.stopPropagation()}
      >
        <img
          referrerPolicy="no-referrer"
          src={src}
          onLoad={e => {
            const img = e.currentTarget;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              setTall(img.naturalHeight / img.naturalWidth > 1.6);
            }
          }}
          alt=""
          className={tall ? 'w-full max-w-2xl h-auto rounded-xl shadow-2xl block my-auto' : 'max-w-full max-h-[88vh] w-auto h-auto object-contain rounded-xl shadow-2xl my-auto'}
        />
      </motion.div>
    </motion.div>
  );
}

interface PostMediaProps {
  media: MediaItem[];
  mode: 'card' | 'detail';
}

// 动态媒体：卡片只展示封面（多图带角标），详情为左右切换轮播；长图可查看大图
export function PostMedia({ media, mode }: PostMediaProps) {
  const video = media.find(m => m.mediaType === 'video');
  const images = media.filter(m => m.mediaType === 'image');
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (video) {
    return (
      <div className={mode === 'card'
        ? 'mb-8 rounded-[2rem] overflow-hidden bg-zinc-100 border border-zinc-100'
        : 'relative w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden'}>
        <video referrerPolicy="no-referrer" src={video.mediaUrl} controls className={mode === 'card' ? "w-full h-auto object-cover" : "relative z-10 w-full h-full object-contain drop-shadow-2xl"} />
      </div>
    );
  }

  if (!images.length) return null;

  // 卡片模式：只展示封面
  if (mode === 'card') {
    return (
      <div className="mb-8 rounded-[2rem] overflow-hidden bg-zinc-100 border border-zinc-100 relative">
        <SlideImage src={images[0].mediaUrl} mode="card" onViewFull={() => setLightbox(true)} />
        {images.length > 1 && (
          <span className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-mono px-2.5 py-1 rounded-full tracking-widest">
            {images.length} 图
          </span>
        )}
        <AnimatePresence>
          {lightbox && <Lightbox src={images[0].mediaUrl} onClose={() => setLightbox(false)} />}
        </AnimatePresence>
      </div>
    );
  }

  // 详情模式：左右切换轮播
  const current = images[Math.min(idx, images.length - 1)];
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="relative bg-zinc-950 flex-1 flex flex-col items-center justify-center overflow-hidden min-h-[240px]">
        <SlideImage src={current.mediaUrl} mode="detail" onViewFull={() => setLightbox(true)} />

        {images.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 hover:bg-white text-zinc-800 shadow-lg flex items-center justify-center transition-colors z-30"
              title="上一张"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 hover:bg-white text-zinc-800 shadow-lg flex items-center justify-center transition-colors z-30"
              title="下一张"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/35 backdrop-blur-sm px-2.5 py-1.5 rounded-full z-30">
              {images.map((m, i) => (
                <button
                  key={m.mediaUrl}
                  onClick={e => { e.stopPropagation(); setIdx(i); }}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
            <span className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-mono px-2.5 py-1 rounded-full z-30">
              {idx + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      <AnimatePresence>
        {lightbox && <Lightbox src={current.mediaUrl} onClose={() => setLightbox(false)} />}
      </AnimatePresence>
    </div>
  );
}
