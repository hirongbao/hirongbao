import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus, Edit2, Trash2, Calendar, Heart, Briefcase, Plane, Flag, Gift, Clock, Loader2, Image as ImageIcon } from 'lucide-react';
import { SiteAnniversary } from '../types';
import { authRequest } from '../utils/auth';

const iconMap: Record<string, React.FC<any>> = {
  Calendar, Heart, Briefcase, Plane, Flag, Gift, Clock
};

const typeMap: Record<string, string> = {
  'countdown': '倒计时',
  'countup': '正计时',
  'annual': '每年重复',
  'milestone': '里程碑'
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnniversaryModal({ isOpen, onClose }: Props) {
  const [anniversaries, setAnniversaries] = useState<SiteAnniversary[]>([]);
  const [loadingAnniversaries, setLoadingAnniversaries] = useState(true);
  
  // Editing state
  const [editingAnniversary, setEditingAnniversary] = useState<Partial<SiteAnniversary> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadAnniversaries();
      setEditingAnniversary(null);
    }
  }, [isOpen]);

  const loadAnniversaries = async () => {
    setLoadingAnniversaries(true);
    try {
      const data = await authRequest('/api/anniversaries/ugc/list');
      setAnniversaries(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnniversaries(false);
    }
  };

  const saveAnniversary = async () => {
    if (!editingAnniversary?.title?.trim()) {
      setError('请输入标题');
      return;
    }
    if (!editingAnniversary?.eventDate?.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setError('日期格式必须为 YYYY-MM-DD');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await authRequest('/api/anniversaries/ugc/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAnniversary)
      });
      await loadAnniversaries();
      setEditingAnniversary(null);
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const deleteAnniversary = async (id: string) => {
    if (!confirm('确定要删除这个纪念日吗？')) return;
    try {
      await authRequest(`/api/anniversaries/ugc/delete/${id}`, { method: 'POST' });
      setAnniversaries(anniversaries.filter(a => a.id !== id));
    } catch (err) {
      console.error('删除失败', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const fileRecord = await authRequest('/api/posts/ugc/upload', {
        method: 'POST',
        body: formData
      });
      if (fileRecord && fileRecord.fileUrl) {
        setEditingAnniversary(prev => prev ? { ...prev, coverUrl: fileRecord.fileUrl } : null);
      }
    } catch (err: any) {
      setError(`上传失败: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <h2 className="text-xl font-serif text-zinc-900">
                {editingAnniversary ? (editingAnniversary.id ? '编辑纪念日' : '新增纪念日') : '管理纪念日'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1 min-h-[400px]">
              <div className="space-y-6">
                {editingAnniversary ? (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[11px] text-zinc-500 font-bold tracking-widest mb-2 block">标题 *</label>
                      <input
                        value={editingAnniversary.title || ''}
                        onChange={e => setEditingAnniversary({...editingAnniversary, title: e.target.value})}
                        placeholder="例如：下一个假期"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[11px] text-zinc-500 font-bold tracking-widest mb-2 block">类型</label>
                        <div className="flex bg-zinc-100/80 p-1 rounded-xl">
                          {Object.entries(typeMap).map(([val, label]) => (
                            <button
                              key={val}
                              onClick={() => setEditingAnniversary({...editingAnniversary, type: val})}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editingAnniversary.type === val ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[11px] text-zinc-500 font-bold tracking-widest mb-2 block">日期 (YYYY-MM-DD)</label>
                        <input
                          type="text"
                          value={editingAnniversary.eventDate || ''}
                          onChange={e => setEditingAnniversary({...editingAnniversary, eventDate: e.target.value})}
                          placeholder="2026-10-01"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[11px] text-zinc-500 font-bold tracking-widest mb-2 block">图标</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(iconMap).map(([iconName, IconComp]) => (
                            <button
                              key={iconName}
                              onClick={() => setEditingAnniversary({...editingAnniversary, icon: iconName})}
                              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${editingAnniversary.icon === iconName ? 'bg-zinc-900 text-white shadow-md' : 'bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'}`}
                            >
                              <IconComp size={18} />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[11px] text-zinc-500 font-bold tracking-widest mb-2 block">背景大图 (仅倒数/正数)</label>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 bg-white hover:bg-zinc-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                            上传图片
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleFileUpload}
                          />
                          {editingAnniversary.coverUrl && (
                            <div className="relative group">
                              <img src={editingAnniversary.coverUrl} className="w-12 h-12 object-cover rounded-xl border border-zinc-200 shadow-sm" />
                              <button
                                onClick={() => setEditingAnniversary({...editingAnniversary, coverUrl: ''})}
                                className="absolute -top-2 -right-2 bg-zinc-900 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                      <button
                        onClick={() => setEditingAnniversary(null)}
                        className="px-6 py-2.5 text-sm font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={saveAnniversary}
                        disabled={loading}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-lg shadow-zinc-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                        保存
                      </button>
                    </div>
                    {error && <p className="text-sm text-red-500 font-bold text-right">{error}</p>}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-end mb-6">
                      <button
                        onClick={() => setEditingAnniversary({ title: '', eventDate: new Date().toISOString().split('T')[0], type: 'countdown', icon: 'Calendar' })}
                        className="text-sm text-white bg-zinc-900 hover:bg-zinc-800 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-zinc-900/20 transition-all"
                      >
                        <Plus size={16} /> 新增纪念日
                      </button>
                    </div>
                    
                    {loadingAnniversaries ? (
                      <div className="py-16 flex justify-center text-zinc-400">
                        <Loader2 size={32} className="animate-spin" />
                      </div>
                    ) : anniversaries.length === 0 ? (
                      <div className="text-sm text-zinc-400 text-center py-16 bg-zinc-50 rounded-3xl border border-zinc-100 flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm border border-zinc-100">
                          <Calendar size={28} className="text-zinc-300" />
                        </div>
                        <p>暂无纪念日记录</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {anniversaries.map((ann) => {
                          const IconCmp = iconMap[ann.icon || 'Calendar'] || Calendar;
                          return (
                            <div key={ann.id} className="group relative overflow-hidden flex items-center p-4 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-400 hover:shadow-md transition-all">
                              {ann.coverUrl && (
                                <div className="absolute inset-0 opacity-10">
                                  <img src={ann.coverUrl} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="relative flex-1 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-100 text-zinc-700 shadow-sm">
                                  <IconCmp size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-zinc-900 text-sm truncate">{ann.title}</h4>
                                    <span className="shrink-0 px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[10px] font-bold tracking-widest">{typeMap[ann.type || 'countdown']}</span>
                                  </div>
                                  <p className="text-xs font-mono text-zinc-500">{ann.eventDate}</p>
                                </div>
                              </div>
                              <div className="relative flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                                <button
                                  onClick={() => setEditingAnniversary(ann)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 shadow-sm border border-zinc-200 transition-all"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => ann.id && deleteAnniversary(ann.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-red-500 hover:text-red-600 hover:bg-red-50 shadow-sm border border-zinc-200 hover:border-red-200 transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
