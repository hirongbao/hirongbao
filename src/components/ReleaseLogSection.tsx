import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, Tag } from 'lucide-react';
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
      <div className="flex items-start gap-4 my-3 group/line">
        <div className={`mt-1.5 shrink-0 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${badgeClass}`}>
          <span className={`w-1 h-1 rounded-full ${dotClass}`} />
          {rawTag}
        </div>
        <span className="text-zinc-700 text-sm md:text-base leading-relaxed">{restText}</span>
      </div>
    );
  }

  // 列表符号前缀（-、*、• 等）
  if (/^[-*•]\s+/.test(trimmed)) {
    const text = trimmed.replace(/^[-*•]\s+/, '');
    return (
      <div className="flex items-start gap-4 my-2.5">
        <div className="w-1 h-1 rounded-full bg-zinc-300 mt-2.5 shrink-0" />
        <span className="text-zinc-600 text-sm md:text-base leading-relaxed">{text}</span>
      </div>
    );
  }

  // 普通文本段落
  return (
    <p className="text-zinc-600 text-sm md:text-base leading-relaxed my-2.5">
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
    <section className="mx-auto w-full max-w-4xl pb-24">
      
      {/* 顶部 Header：极致排版 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12 md:mb-20 flex flex-col items-center text-center"
      >
        <div className="w-px h-16 md:h-20 bg-gradient-to-b from-transparent to-zinc-300 mb-8"></div>
        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-400 mb-6 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Changelog & Updates
        </span>
        <h3 className="text-4xl md:text-6xl font-serif tracking-tighter text-zinc-900 leading-[1.2] mb-6 max-w-3xl">
          持续进化，<span className="italic font-light text-zinc-500">见证每一次生长。</span>
        </h3>
        <p className="text-base text-zinc-500 font-light max-w-xl mx-auto leading-relaxed">
          这里记录了产品架构、设计语言与核心体验的演进史。当前已完成 <span className="font-mono font-bold text-zinc-900 mx-1">{stats.total}</span> 次重要迭代，最新版本停留在 <span className="font-mono font-bold text-zinc-900 mx-1">{stats.latestVersion}</span>。
        </p>
      </motion.div>

      {/* 时间轴与日志列表 */}
      {releaseLogs && releaseLogs.length > 0 ? (
        <div className="relative space-y-0">
          {releaseLogs.map((log, index) => {
            const isLatest = index === 0;
            const contentLines = log.content ? log.content.split('\n') : [];

            return (
              <motion.article 
                key={log.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex flex-col md:flex-row gap-6 md:gap-12 py-10 md:py-16 border-b border-zinc-200/60 last:border-0 group"
              >
                {/* 左侧：日期与版本 */}
                <div className="w-full md:w-[200px] shrink-0 flex flex-col gap-3">
                  {isLatest && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="relative flex items-center justify-center w-2 h-2">
                        <span className="absolute w-2 h-2 rounded-full bg-emerald-500/40 animate-ping" />
                        <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-emerald-600">
                        Latest
                      </span>
                    </div>
                  )}
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 font-mono">
                    {formatDate(log.publishedAt)}
                  </div>
                  {log.version && (
                    <div className="inline-flex items-center gap-1.5 self-start px-2 py-0.5 mt-1 rounded text-zinc-500 border border-zinc-200/80 bg-zinc-50">
                      <Tag size={10} className="opacity-60" />
                      <span className="font-mono text-[10px] font-bold tracking-widest">{log.version}</span>
                    </div>
                  )}
                </div>

                {/* 右侧：标题与内容 */}
                <div className="flex-1">
                  <h4 className="text-2xl md:text-3xl font-serif tracking-tight text-zinc-900 mb-4 group-hover:text-zinc-700 transition-colors leading-snug">
                    {log.title}
                  </h4>

                  {log.summary && (
                    <div className="mb-6 pl-4 border-l-2 border-zinc-900/80">
                      <p className="text-lg font-serif leading-[1.6] italic text-zinc-600">
                        "{log.summary}"
                      </p>
                    </div>
                  )}

                  {contentLines.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {contentLines.map((line, lIdx) => (
                        <React.Fragment key={lIdx}>
                          {renderFormattedContentLine(line)}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
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
