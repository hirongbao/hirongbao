import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Flag, Heart, Briefcase, Plane, Gift } from 'lucide-react';

// === Mock Data Types ===
type AnniversaryType = 'countdown' | 'countup' | 'milestone' | 'next_holiday' | 'annual';

interface Anniversary {
  id: string;
  title: string;
  date?: string; // MOCK ONLY
  eventDate?: string; // YYYY-MM-DD from API
  type: AnniversaryType;
  icon?: string;
  coverUrl?: string;
}

const MOCK_DATA: Anniversary[] = [
  { id: '1', title: '下一个假期 (国庆节)', date: '2026-10-01', type: 'countdown', coverUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop' },
  { id: '2', title: '相恋纪念', date: '2022-05-20', type: 'countup', icon: 'Heart' },
  { id: '3', title: '发薪日', date: '2026-10-15', type: 'countdown', icon: 'Briefcase' },
  { id: '4', title: '第一次去大理', date: '2024-08-15', type: 'milestone', icon: 'Plane' },
  { id: '5', title: '买车', date: '2023-11-11', type: 'milestone', icon: 'Flag' },
  { id: '6', title: '博客全新改版上线', date: '2026-09-01', type: 'milestone', icon: 'Gift' },
];

const iconMap: Record<string, React.ElementType> = {
  Heart, Briefcase, Plane, Flag, Gift, Calendar, Clock
};

export function AnniversariesSection({ targetAccount }: { targetAccount?: string }) {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState<Anniversary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(targetAccount ? `/api/hirongbaohub/anniversaries/user/${targetAccount}` : '/api/hirongbaohub/anniversaries')
      .then(res => res.json())
      .then(res => {
        if (res.code === 0 && res.data) {
          const fetchedData = (res.data as Anniversary[]).filter(d => {
            if (d.type === 'next_holiday') {
              if (!d.coverUrl) return false;
              d.type = 'countdown'; 
            }
            return true;
          });
          setData(fetchedData);
        }
      })
      .finally(() => setLoading(false));

    const timer = setInterval(() => setNow(new Date()), 1000 * 60 * 60);
    return () => clearInterval(timer);
  }, []);

  const calculateDaysInfo = (targetDate: string, type?: AnniversaryType) => {
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const current = new Date(now);
    current.setHours(0, 0, 0, 0);
    
    if (type === 'annual') {
      target.setFullYear(current.getFullYear());
      if (target.getTime() < current.getTime()) {
        target.setFullYear(current.getFullYear() + 1);
      }
    }
    
    const diff = target.getTime() - current.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  const widgets = data.filter(d => {
    if (d.type === 'milestone') return false;
    if (d.type === 'countdown') {
      const days = calculateDaysInfo((d.date || d.eventDate) as string, d.type);
      if (days < 0) return false; // 超过日期的倒数日不展示
    }
    return true;
  });
  
  const milestones = data.filter(d => d.type === 'milestone').sort((a, b) => new Date(b.date || b.eventDate).getTime() - new Date(a.date || a.eventDate).getTime());

  const groupedMilestones = milestones.reduce((acc, curr) => {
    const d = new Date(curr.date || curr.eventDate);
    const key = `${d.getFullYear()} / ${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(curr);
    return acc;
  }, {} as Record<string, Anniversary[]>);

  if (loading) {
    return <div className="text-center py-20 text-zinc-400 text-sm">加载中...</div>;
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      {/* 1. Bento Box Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {widgets.map((w, index) => {
          const days = calculateDaysInfo((w.date || w.eventDate) as string, w.type);
          const isToday = days === 0;
          const displayValue = isToday ? '今天' : Math.abs(days);
          
          const isCountdown = w.type === 'countdown' || w.type === 'annual';
          const Icon = w.icon && iconMap[w.icon] ? iconMap[w.icon] : Calendar;
          
          return (
            <motion.div 
              key={w.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-[2.5rem] bg-zinc-50 border border-zinc-100 p-8 shadow-sm group ${index === 0 ? 'md:col-span-2 xl:col-span-2 min-h-[280px]' : 'min-h-[200px]'}`}
            >
              {w.coverUrl && (
                <div className="absolute inset-0 z-0">
                  <img src={w.coverUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10"></div>
                </div>
              )}
              
              <div className={`relative z-10 flex flex-col h-full justify-between ${w.coverUrl ? 'text-white' : 'text-zinc-900'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${w.coverUrl ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-zinc-200/50 text-zinc-500'}`}>
                    <Icon size={18} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${w.coverUrl ? 'text-white/80' : 'text-zinc-400'}`}>
                    {w.type === 'annual' ? '每年重复 / ANNUAL' : isCountdown ? '倒数 / COUNTDOWN' : '正数 / COUNTUP'}
                  </span>
                </div>
                
                <div className="mt-auto pt-8">
                  <h3 className={`text-lg font-medium mb-2 ${w.coverUrl ? 'text-white/90' : 'text-zinc-500'}`}>{w.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-serif italic tracking-tighter ${isToday ? 'lg:text-5xl' : 'lg:text-7xl'}`}>
                      {displayValue}
                    </span>
                    {!isToday && (
                      <span className={`text-sm font-bold tracking-widest ${w.coverUrl ? 'text-white/70' : 'text-zinc-400'}`}>
                        天
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 2. Vertical Timeline */}
      <div className="max-w-3xl mx-auto pt-8">
        <div className="relative border-l border-zinc-200 ml-4 md:ml-24 pb-12">
          {Object.entries(groupedMilestones).map(([monthKey, items], groupIndex) => (
            <div key={monthKey} className="mb-16 last:mb-0">
              {/* Month Header */}
              <div className="relative flex items-center mb-8">
                <div className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-zinc-900 ring-4 ring-white"></div>
                <h4 className="ml-8 text-sm font-bold tracking-[0.2em] text-zinc-900 bg-white px-2 -translate-y-0.5">
                  {monthKey}
                </h4>
              </div>
              
              {/* Milestone Items */}
              <div className="space-y-8 pl-8">
                {(items as Anniversary[]).map((m, i) => {
                  const Icon = m.icon && iconMap[m.icon] ? iconMap[m.icon] : Flag;
                  const d = new Date(m.date || m.eventDate);
                  const day = String(d.getDate()).padStart(2, '0');
                  
                  return (
                    <motion.div 
                      key={m.id}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="group relative flex items-start md:items-center gap-6 p-6 rounded-[2rem] bg-white border border-zinc-100 hover:shadow-xl hover:border-zinc-200 transition-all"
                    >
                      <div className="flex-shrink-0 text-center w-12">
                        <span className="block text-2xl font-serif text-zinc-900">{day}</span>
                      </div>
                      
                      <div className="w-px h-8 bg-zinc-200 hidden md:block"></div>
                      
                      <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h5 className="text-lg font-medium text-zinc-800">{m.title}</h5>
                        <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                          <Icon size={16} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
