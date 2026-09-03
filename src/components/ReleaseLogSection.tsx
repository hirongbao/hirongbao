import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, Tag, ArrowRight } from 'lucide-react';
import { ReleaseLog } from '../types';

interface ReleaseLogSectionProps {
  releaseLogs: ReleaseLog[];
}

// 格式化日期为 YYYY.MM.DD
function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// 识别特性标签并渲染带样式的微徽章
function renderFormattedContentLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 匹配常见的日志标签前缀，如 [新增]、[优化]、[修复]、[功能] 等
  const tagMatch = trimmed.match(/^(\[([\u4e00-\u9fa5\w]+)\]|([a-zA-Z]+:))\s*(.*)$/);

  if (tagMatch) {
    const rawTag = tagMatch[2] || tagMatch[3]?.replace(':', '');
    const restText = tagMatch[4];

    let badgeClass = 'text-zinc-500 bg-zinc-100';
    let dotClass = 'bg-zinc-400';
    
    if (/新增|功能|feat/i.test(rawTag)) {
      badgeClass = 'text-emerald-700 bg-emerald-50';
      dotClass = 'bg-emerald-500';
    } else if (/优化|改进|perf|improve/i.test(rawTag)) {
      badgeClass = 'text-blue-700 bg-blue-50';
      dotClass = 'bg-blue-500';
    } else if (/修复|fix|bug/i.test(rawTag)) {
      badgeClass = 'text-amber-700 bg-amber-50';
      dotClass = 'bg-amber-500';
    }

    return (
      <div className="flex items-start gap-4 my-4 group/line">
        <div className={`mt-1.5 shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${badgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          {rawTag}
        </div>
        <span className="text-zinc-700 text-base md:text-lg leading-relaxed">{restText}</span>
      </div>
    );
  }

  // 列表符号前缀（-、*、• 等）
  if (/^[-*•]\s+/.test(trimmed)) {
    const text = trimmed.replace(/^[-*•]\s+/, '');
    return (
      <div className="flex items-start gap-4 my-3">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 mt-2.5 shrink-0" />
        <span className="text-zinc-600 text-base md:text-lg leading-relaxed">{text}</span>
      </div>
    );
  }

  // 普通文本段落
  return (
    <p className="text-zinc-600 text-base md:text-lg leading-relaxed my-3">
      {trimmed}
    </p>
  );
}

export function ReleaseLogSection({ releaseLogs }: ReleaseLogSectionProps) {
  // 统计信息
  const stats = useMemo(() => {
    if (!releaseLogs || releaseLogs.length === 0) {
      return { latestVersion: null, total: 0, lastDate: null };
    }
    const latest = releaseLogs[0];
    return {
      latestVersion: latest.version || 'v1.0.0',
      total: releaseLogs.length,
      lastDate: formatDate(latest.publishedAt)
    };
  }, [releaseLogs]);

  return (
    <section className="mx-auto w-full max-w-5xl pb-24">
      
      {/* 顶部 Header：极致排版 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-16 md:mb-24 flex flex-col items-center text-center"
      >
        <div className="w-px h-16 md:h-24 bg-gradient-to-b from-transparent to-zinc-300 mb-8"></div>
        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-400 mb-6 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Changelog & Updates
        </span>
        <h3 className="text-5xl md:text-7xl font-serif tracking-tighter text-zinc-900 leading-[1.1] mb-6 max-w-3xl">
          持续进化，<br className="md:hidden" /><span className="italic font-light text-zinc-500">见证每一次生长。</span>
        </h3>
        <p className="text-lg text-zinc-500 font-light max-w-xl mx-auto leading-relaxed">
          这里记录了产品架构、设计语言与核心体验的演进史。当前已完成 <span className="font-mono font-bold text-zinc-900 mx-1">{stats.total}</span> 次重要迭代，最新版本停留在 <span className="font-mono font-bold text-zinc-900 mx-1">{stats.latestVersion}</span>。
        </p>
      </motion.div>

      {/* 时间轴与日志列表 */}
      {releaseLogs && releaseLogs.length > 0 ? (
        <div className="relative space-y-16 md:space-y-24 before:absolute before:inset-0 before:ml-[28px] md:before:ml-[50%] md:before:-translate-x-px md:before:translate-y-20 before:h-full before:w-px before:-z-10 before:bg-gradient-to-b before:from-zinc-200 before:via-zinc-200 before:to-transparent">
          {releaseLogs.map((log, index) => {
            const isLatest = index === 0;
            const contentLines = log.content ? log.content.split('\n') : [];
            // Alternating sides for desktop
            const isEven = index % 2 === 0;

            return (
              <motion.article 
                key={log.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex flex-col md:flex-row justify-between items-start md:items-center w-full group"
              >
                {/* 居中时间轴节点 (Desktop) */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 justify-center items-center w-12 h-12 z-10">
                  {isLatest ? (
                    <div className="relative flex items-center justify-center">
                      <span className="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-ping" />
                      <span className="relative w-4 h-4 rounded-full bg-emerald-500 ring-[6px] ring-[#F8F9FA]" />
                    </div>
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-zinc-300 ring-[6px] ring-[#F8F9FA] group-hover:bg-zinc-500 transition-colors duration-500" />
                  )}
                </div>

                {/* 卡片容器 */}
                <div className={`w-full md:w-[45%] pl-[60px] md:pl-0 ${isEven ? 'md:pr-[5%]' : 'md:pl-[5%] md:ml-auto'}`}>
                  
                  {/* 时间节点 (Mobile) */}
                  <div className="absolute left-[28px] -translate-x-1/2 top-[48px] md:hidden z-10">
                    {isLatest ? (
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-6 h-6 rounded-full bg-emerald-500/20 animate-ping" />
                        <span className="relative w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-[#F8F9FA]" />
                      </div>
                    ) : (
                      <span className="block w-2.5 h-2.5 rounded-full bg-zinc-300 ring-4 ring-[#F8F9FA]" />
                    )}
                  </div>

                  <div className="bg-white rounded-[2rem] lg:rounded-[3rem] shadow-xl shadow-zinc-200/40 border border-zinc-100 overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-300/50 hover:-translate-y-2 group-hover:border-zinc-200">
                    
                    {/* Header: Date & Version */}
                    <div className="p-8 lg:p-12 pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300">
                            UPDATE / {formatDate(log.publishedAt)}
                          </span>
                        </div>
                        {log.version && (
                          <div className="px-4 py-1.5 rounded-full bg-zinc-900 text-white flex items-center gap-2 shadow-md">
                            <Tag size={12} className="opacity-70" />
                            <span className="font-mono text-xs font-bold tracking-wider">{log.version}</span>
                          </div>
                        )}
                      </div>

                      <h4 className="text-3xl lg:text-4xl font-serif tracking-tight text-zinc-900 mb-6 leading-[1.15]">
                        {log.title}
                      </h4>

                      {/* 摘要块 */}
                      {log.summary && (
                        <p className="text-xl lg:text-2xl font-serif leading-[1.4] italic text-zinc-500 mb-8">
                          "{log.summary}"
                        </p>
                      )}
                    </div>

                    {/* Content */}
                    {contentLines.length > 0 && (
                      <div className="px-8 lg:px-12 pb-8">
                        <div className="h-px w-16 bg-zinc-200 mb-8"></div>
                        <div className="space-y-2">
                          {contentLines.map((line, lIdx) => (
                            <React.Fragment key={lIdx}>
                              {renderFormattedContentLine(line)}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer bar */}
                    <div className="mt-auto pt-6 px-8 lg:px-12 pb-8 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                        {isLatest ? 'LATEST RELEASE' : 'ARCHIVED'}
                      </div>
                      <ArrowRight size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors -translate-x-2 group-hover:translate-x-0 duration-300" />
                    </div>

                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[3rem] bg-white border border-zinc-100 shadow-xl shadow-zinc-200/40 p-16 text-center max-w-2xl mx-auto mt-12"
        >
          <img src="/hirongbao.svg" alt="暂无更新" className="mx-auto mb-8 h-40 object-contain opacity-80" />
          <h4 className="text-2xl font-serif text-zinc-900 mb-3">暂无更新记录</h4>
          <p className="text-zinc-500 leading-relaxed font-light">
            每一次功能的进化与体验的重塑，都将在这里被刻录。
          </p>
        </motion.div>
      )}
    </section>
  );
}
