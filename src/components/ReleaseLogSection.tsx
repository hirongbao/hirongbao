import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, Rocket, Calendar, Tag, Layers } from 'lucide-react';
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

    let badgeClass = 'bg-zinc-100 text-zinc-700 border-zinc-200/80';
    if (/新增|功能|feat/i.test(rawTag)) {
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    } else if (/优化|改进|perf|improve/i.test(rawTag)) {
      badgeClass = 'bg-sky-50 text-sky-700 border-sky-200/60';
    } else if (/修复|fix|bug/i.test(rawTag)) {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200/60';
    }

    return (
      <div className="flex items-start gap-2.5 my-1.5 leading-relaxed">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border shrink-0 mt-0.5 ${badgeClass}`}>
          {rawTag}
        </span>
        <span className="text-zinc-600 text-sm md:text-base leading-relaxed">{restText}</span>
      </div>
    );
  }

  // 列表符号前缀（-、*、• 等）
  if (/^[-*•]\s+/.test(trimmed)) {
    const text = trimmed.replace(/^[-*•]\s+/, '');
    return (
      <div className="flex items-start gap-2.5 my-1.5 leading-relaxed">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-2.5 shrink-0" />
        <span className="text-zinc-600 text-sm md:text-base leading-relaxed">{text}</span>
      </div>
    );
  }

  // 普通文本段落
  return (
    <p className="text-zinc-600 text-sm md:text-base leading-relaxed my-1.5">
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
    <section className="mx-auto max-w-4xl pb-16">
      {/* 顶部 Header 与概览统计 */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-200/70">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">
                02 / CHANGELOG ARCHIVE
              </p>
            </div>
            <h3 className="text-4xl md:text-5xl font-serif tracking-tight text-zinc-900 leading-tight">
              持续更新，<span className="italic font-normal">保持生长。</span>
            </h3>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-zinc-500">
              这里记录网站、服务与产品的每一次重要变化、功能上线与演进历程。
            </p>
          </div>

          {/* 概览统计指标 */}
          {stats.latestVersion && (
            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
              <div className="bg-white rounded-2xl px-4 py-3 border border-zinc-100 shadow-lg shadow-zinc-200/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                  <Rocket size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">最新版本</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-sm font-mono font-bold text-zinc-900 leading-tight">
                    {stats.latestVersion}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl px-4 py-3 border border-zinc-100 shadow-lg shadow-zinc-200/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-50 text-zinc-700 flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">累计迭代</span>
                  <p className="text-sm font-mono font-bold text-zinc-900 leading-tight">
                    {stats.total} 次
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 时间轴与日志列表 */}
      {releaseLogs && releaseLogs.length > 0 ? (
        <div className="relative ml-3 md:ml-4 border-l-2 border-zinc-200/70 pl-8 md:pl-12 space-y-12">
          {releaseLogs.map((log, index) => {
            const isLatest = index === 0;
            const contentLines = log.content ? log.content.split('\n') : [];

            return (
              <motion.article 
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group"
              >
                {/* 时间轴节点标记 */}
                {isLatest ? (
                  <div className="absolute -left-[2.75rem] md:-left-[3.75rem] top-7 flex items-center justify-center">
                    <span className="absolute w-6 h-6 rounded-full bg-zinc-900/10 animate-ping" />
                    <span className="relative w-4 h-4 rounded-full bg-zinc-900 ring-8 ring-[#F8F9FA] shadow-md shadow-zinc-900/20" />
                  </div>
                ) : (
                  <div className="absolute -left-[2.5rem] md:-left-[3.5rem] top-7">
                    <span className="block w-3 h-3 rounded-full bg-zinc-300 ring-6 ring-[#F8F9FA] transition-colors group-hover:bg-zinc-600" />
                  </div>
                )}

                {/* 卡片主体 */}
                <div className="rounded-[2rem] lg:rounded-[2.5rem] bg-white border border-zinc-100 shadow-xl shadow-zinc-200/35 p-7 md:p-10 transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-300/40 hover:-translate-y-1">
                  {/* 卡片头部 Meta 信息 */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-100 mb-6">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {log.version && (
                        <span className="inline-flex items-center gap-1 bg-zinc-900 text-white text-xs font-mono font-semibold px-3 py-1 rounded-full shadow-sm">
                          <Tag size={12} className="opacity-70" />
                          {log.version}
                        </span>
                      )}
                      {isLatest && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          LATEST
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 ml-1">
                        <Calendar size={13} className="text-zinc-400" />
                        <time>{formatDate(log.publishedAt)}</time>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-300 hidden sm:inline">
                        02 / RELEASE LOG
                      </span>
                      <div className="w-2 h-2 bg-zinc-900 rounded-full animate-pulse" />
                    </div>
                  </div>

                  {/* 标题 */}
                  <h4 className="text-2xl md:text-3xl font-serif tracking-tight text-zinc-900 transition-colors group-hover:text-zinc-800">
                    {log.title}
                  </h4>

                  {/* 摘要引用条 */}
                  {log.summary && (
                    <div className="mt-4 border-l-2 border-zinc-900 pl-4 py-2 bg-zinc-50/70 rounded-r-2xl">
                      <p className="text-sm md:text-base text-zinc-700 italic font-serif leading-relaxed">
                        “{log.summary}”
                      </p>
                    </div>
                  )}

                  {/* 正文条目结构化渲染 */}
                  {contentLines.length > 0 && (
                    <div className="mt-6 space-y-1.5 pt-2">
                      {contentLines.map((line, lIdx) => (
                        <React.Fragment key={lIdx}>
                          {renderFormattedContentLine(line)}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* 卡片底栏与品牌水印 */}
                  <div className="mt-8 pt-5 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>已验证并同步部署至生产环境</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold tracking-widest text-zinc-300 uppercase">
                      HIRONGBAO · CHANGELOG
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      ) : (
        /* 空状态卡片 */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] bg-white border border-zinc-100 shadow-xl shadow-zinc-200/30 p-12 text-center max-w-lg mx-auto"
        >
          <img 
            src="/hirongbao.svg" 
            alt="暂无更新" 
            className="mx-auto mb-6 h-36 w-36 object-contain opacity-80" 
          />
          <h4 className="text-lg font-serif font-semibold text-zinc-800">
            暂无更新记录
          </h4>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            每一次功能迭代与体验优化都会同步在这里展示，敬请期待。
          </p>
        </motion.div>
      )}
    </section>
  );
}
