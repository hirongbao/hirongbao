import React, { useState } from 'react';
import { ProfileData } from '../types';
import { MessageCircle, Github, X, Send } from 'lucide-react';
import { RiQqLine, RiTiktokLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'motion/react';
import { formatCount } from '../utils/format';
import { OnlineStats } from './OnlineStats';

const IconMap: Record<string, React.ElementType> = {
  MessageCircle,
  MessageSquare: RiQqLine,
  Music: RiTiktokLine,
  Github
};

interface ProfileProps {
  profile: ProfileData;
  onSubscribe: () => void;
  activeSection: 'feed' | 'releases';
  onSectionChange: (section: 'feed' | 'releases') => void;
}

export function Profile({ profile, onSubscribe, activeSection, onSectionChange }: ProfileProps) {
  const [activeQr, setActiveQr] = useState<string | null>(null);

  const toggleQr = (platform: string) => {
    setActiveQr(prev => prev === platform ? null : platform);
  };

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-7">
        <div className="relative inline-block">
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-16 h-16 rounded-[1.5rem] object-cover shadow-2xl shadow-zinc-400/50"
          />
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-400 rounded-full border-[3px] border-white"></div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-serif italic tracking-tight leading-none text-zinc-900">
            {profile.name}
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed font-light">
            {profile.bio}
          </p>
        </div>

        {profile.socials && profile.socials.length > 0 && (
          <div className="flex flex-col space-y-4 pt-2">
            <div className="flex items-center space-x-4">
              {profile.socials.filter(s => s.qrCodeUrl).map((social, index, arr) => {
                const Icon = IconMap[social.iconName] || MessageCircle;
                const isActive = activeQr === social.platform;

                const isFirst = index === 0;
                const isLast = index === arr.length - 1 && arr.length > 1;

                const popupPositionClass = isFirst
                  ? "left-0"
                  : isLast
                    ? "right-0"
                    : "left-1/2 -translate-x-1/2";

                const trianglePositionClass = isFirst
                  ? "left-5 -translate-x-1/2"
                  : isLast
                    ? "right-5 translate-x-1/2"
                    : "left-1/2 -translate-x-1/2";

                const originClass = isFirst
                  ? "origin-bottom-left"
                  : isLast
                    ? "origin-bottom-right"
                    : "origin-bottom";

                return (
                  <div
                    key={social.platform}
                    className="relative"
                    onMouseEnter={() => setActiveQr(social.platform)}
                    onMouseLeave={() => setActiveQr(null)}
                  >
                    <button
                      onClick={() => toggleQr(social.platform)}
                      className="w-10 h-10 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors"
                    >
                      <Icon size={18} />
                    </button>

                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className={`absolute bottom-full mb-3 w-40 bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-2 z-50 ${popupPositionClass} ${originClass}`}
                        >
                          <img
                            src={social.qrCodeUrl!}
                            alt={`${social.platform} QR Code`}
                            className="w-full h-auto rounded-xl"
                          />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center mt-2 mb-1">
                            {social.platform}
                          </p>
                          <div className={`absolute -bottom-1.5 w-3 h-3 bg-white border-b border-r border-zinc-100 rotate-45 ${trianglePositionClass}`}></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {profile.socials.filter(s => s.url).map(social => {
              const Icon = IconMap[social.iconName] || MessageCircle;
              return (
                <a
                  key={social.platform}
                  href={social.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-zinc-600 hover:text-zinc-900 transition-colors group w-fit"
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium border-b border-transparent group-hover:border-zinc-900 transition-colors">
                    {social.url!.replace(/^https?:\/\//, '')}
                  </span>
                </a>
              );
            })}
          </div>
        )}

        <nav className="space-y-4 pt-2 hidden [@media(min-width:1024px)_and_(min-height:780px)]:block">
          <button type="button" onClick={() => onSectionChange('feed')} className={`w-full flex items-center space-x-4 group cursor-pointer text-left transition-opacity ${activeSection === 'feed' ? 'opacity-100' : 'opacity-35 hover:opacity-70'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${activeSection === 'feed' ? 'text-zinc-900' : 'text-zinc-400'}`}>01 / 信息流</span>
            <div className={`h-[1px] flex-1 ${activeSection === 'feed' ? 'bg-zinc-900' : 'bg-zinc-200'}`}></div>
          </button>
          <button type="button" onClick={() => onSectionChange('releases')} className={`w-full flex items-center space-x-4 group cursor-pointer text-left transition-opacity ${activeSection === 'releases' ? 'opacity-100' : 'opacity-35 hover:opacity-70'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${activeSection === 'releases' ? 'text-zinc-900' : 'text-zinc-400'}`}>02 / 更新日志</span>
            <div className={`h-[1px] flex-1 ${activeSection === 'releases' ? 'bg-zinc-900' : 'bg-zinc-200'}`}></div>
          </button>
          <div className="flex items-center space-x-4 group cursor-default opacity-30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">03 / 历史归档</span>
            <div className="h-[1px] flex-1 bg-zinc-200"></div>
          </div>
        </nav>
      </div>

      <div className="space-y-5 pt-4 lg:mt-auto">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-50 p-3 rounded-2xl">
            <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest mb-1">动态内容</p>
            <p className="text-xl font-mono">{profile.stats.posts}</p>
          </div>
          <div className="bg-zinc-50 p-3 rounded-2xl">
            <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest mb-1">触达用户</p>
            <p className="text-xl font-mono">{formatCount(profile.stats.followers)}</p>
          </div>
          <OnlineStats />
        </div>
        <button
          onClick={onSubscribe}
          className="w-full py-4 bg-zinc-900 text-white rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          订阅更新
        </button>
      </div>
    </div>
  );
}
