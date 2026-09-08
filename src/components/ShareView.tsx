import React, { useEffect, useState } from 'react';
import { Post, ProfileData } from '../types';
import QRCode from 'qrcode';
import { QrCode } from 'lucide-react';

interface ShareViewProps {
  postId: string;
}

export function ShareView({ postId }: ShareViewProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [postRes, profileRes] = await Promise.all([
          fetch(`/api/posts/${postId}`).then(r => r.json()),
          fetch(`/api/profile`).then(r => r.json())
        ]);
        
        if (postRes.code === 0 && postRes.data) {
          const p = postRes.data;
          const cat = p.category
            ? { id: String(p.category.id), name: p.category.name }
            : (p.categoryId || p.categoryName)
            ? { id: String(p.categoryId || 'notes'), name: p.categoryName || '随笔' }
            : null;
          setPost({
            id: String(p.id),
            content: p.content || '',
            media: p.media || [],
            createdAt: p.createdAt, // Just need raw string for this view
            likeCount: p.likeCount || 0,
            category: cat,
            comments: []
          });
        }
        
        if (profileRes.code === 0 && profileRes.data) {
          setProfile(profileRes.data);
        }

        // Generate QR Code
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hirongbao.com';
        const shareUrl = `${origin}/?postId=${postId}`;
        try {
          const qrDataUrl = await QRCode.toDataURL(shareUrl, {
            width: 180,
            margin: 1,
            color: { dark: '#18181b', light: '#ffffff' }
          });
          setQrCodeUrl(qrDataUrl);
        } catch (qrErr) {
          console.error('QR Generate Error', qrErr);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [postId]);

  if (loading || !post || !profile) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  const coverImage = post.media.find(m => m.mediaType === 'image');
  const hasVideo = post.media.some(m => m.mediaType === 'video');

  return (
    <div className="bg-[#f4f4f5] min-h-screen flex items-center justify-center p-8 font-sans">
      <div 
        id="share-poster-root" 
        className="w-[800px] bg-white p-16 flex flex-col border border-[#e4e4e7] text-[#18181b] shadow-2xl relative"
        style={{ fontFamily: "'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif" }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-16">
          <div className="flex items-center space-x-6">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="author" className="w-16 h-16 rounded-full object-cover border border-[#f4f4f5]" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#e4e4e7] border border-[#f4f4f5]" />
            )}
            <div>
              <h3 className="text-2xl font-serif italic text-[#18181b]">{profile.name}</h3>
              <p className="text-[#a1a1aa] font-bold uppercase tracking-widest text-xs mt-1">@hirongbao</p>
            </div>
          </div>
          <div className="w-4 h-4 bg-[#18181b] rounded-full"></div>
        </div>

        {/* Media Content */}
        {coverImage && coverImage.mediaUrl && (
          <div className="mb-12 rounded-[2rem] overflow-hidden bg-[#f4f4f5] border border-[#f4f4f5] flex items-center justify-center">
            <img src={coverImage.mediaUrl} alt="Post content" className="w-full h-auto max-h-[600px] object-cover" />
          </div>
        )}
        
        {hasVideo && !coverImage && (
          <div className="mb-12 rounded-[2rem] overflow-hidden bg-[#18181b] border border-[#18181b] h-[400px] flex flex-col items-center justify-center relative">
            <div className="text-[rgba(255,255,255,0.3)] font-serif italic text-4xl mb-4">Motion Asset</div>
            <div className="w-16 h-16 rounded-full border border-[rgba(255,255,255,0.2)] flex items-center justify-center">
              <div className="w-0 h-0 border-t-8 border-b-8 border-l-[12px] border-t-transparent border-b-transparent border-l-[rgba(255,255,255,0.3)] ml-1"></div>
            </div>
          </div>
        )}

        {/* Text section for Poster */}
        <div className="p-12 pb-16 flex-1 flex flex-col justify-center">
          {post.media.length > 0 && post.content && (
            <p className="whitespace-pre-wrap text-3xl text-[#27272a] leading-snug mb-12">
              {post.content}
            </p>
          )}
          {!post.media.length && post.content && (
            <p className="whitespace-pre-wrap text-4xl font-serif leading-[1.3] italic text-[#27272a] mb-12">
              "{post.content}"
            </p>
          )}
        </div>

        <div className="h-[1px] w-full bg-[#f4f4f5] mb-8"></div>
        
        <div className="flex justify-between items-end">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] mb-2">Platform</div>
            <div className="font-serif italic text-2xl text-[#18181b]">ServiceHub</div>
            
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] mt-6 mb-2">Date</div>
            <div className="font-mono text-sm text-[#18181b]">{new Date().toISOString().split('T')[0].replace(/-/g, '.')}</div>
          </div>
          
          {/* QR Code */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#18181b]">Scan to View</div>
              <div className="text-[9px] text-[#a1a1aa] mt-1 uppercase tracking-widest">扫码查看原动态</div>
            </div>
            <div className="w-[68px] h-[68px] bg-white border border-[#e4e4e7] p-1 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <QrCode size={36} strokeWidth={1.5} className="text-[#a1a1aa]" />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
