import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon, Plus, Loader2, Calendar, Edit2, Trash2 } from 'lucide-react';
import { authRequest, getUserInfo, setUserInfo } from '../utils/auth';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProfile: any;
}

interface Anniversary {
  id?: string;
  title: string;
  eventDate: string;
  type: string;
  icon?: string;
  coverUrl?: string;
}

export default function ProfileEditModal({ isOpen, onClose, onSuccess, initialProfile }: ProfileEditModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'anniversary'>('basic');
  
  // Basic info state
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl || '');
  const [bio, setBio] = useState(initialProfile?.bio === '这个人很懒，什么都没写~' ? '' : initialProfile?.bio || '');
  const [socials, setSocials] = useState<any[]>(initialProfile?.socials || []);
  
  // Anniversaries state
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [loadingAnniversaries, setLoadingAnniversaries] = useState(false);
  const [editingAnniversary, setEditingAnniversary] = useState<Anniversary | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialProfile) {
        setAvatarUrl(initialProfile.avatarUrl || '');
        setBio(initialProfile.bio === '这个人很懒，什么都没写~' ? '' : initialProfile.bio || '');
        setSocials(initialProfile.socials || []);
      }
      fetchAnniversaries();
      setActiveTab('basic');
      setEditingAnniversary(null);
      setError('');
    }
  }, [isOpen, initialProfile]);

  const fetchAnniversaries = async () => {
    setLoadingAnniversaries(true);
    try {
      const data = await authRequest('/api/anniversaries/ugc/list');
      setAnniversaries(Array.isArray(data) ? data : (data?.data || []));
    } catch (err: any) {
      console.error("Failed to fetch anniversaries", err);
    } finally {
      setLoadingAnniversaries(false);
    }
  };

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authRequest('/api/profile/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl, bio, socials })
      });
      
      const user = getUserInfo();
      if (user) {
        setUserInfo({ ...user, avatarUrl, bio });
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!files.length) return;
    
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      
      const fileRecord = await authRequest('/api/posts/ugc/upload', {
        method: 'POST',
        body: formData
      });
      
      if (fileRecord && fileRecord.fileUrl) {
        setAvatarUrl(fileRecord.fileUrl);
      }
    } catch (err: any) {
      setError(`头像上传失败: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const saveAnniversary = async () => {
    if (!editingAnniversary?.title || !editingAnniversary?.eventDate) {
      setError('请输入标题和日期');
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
      await fetchAnniversaries();
      setEditingAnniversary(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnniversary = async (id: string) => {
    if (!confirm('确定要删除这个纪念日吗？')) return;
    try {
      await authRequest(`/api/anniversaries/ugc/delete/${id}`, { method: 'POST' });
      await fetchAnniversaries();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addSocial = () => {
    setSocials([...socials, { platform: 'GitHub', iconName: 'Github', url: '', qrCodeUrl: '' }]);
  };

  const updateSocial = (index: number, key: string, value: string) => {
    const newSocials = [...socials];
    newSocials[index][key] = value;
    setSocials(newSocials);
  };

  const removeSocial = (index: number) => {
    setSocials(socials.filter((_, i) => i !== index));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-zinc-200/50"
          >
            {/* Header with Tabs */}
            <div className="px-6 pt-4 border-b border-zinc-200/50 bg-white/50 flex flex-col gap-4 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  编辑个人资料
                </h2>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="flex gap-6 border-b border-transparent">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'basic' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  基础资料
                  {activeTab === 'basic' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-t-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('anniversary')}
                  className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'anniversary' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  纪念日
                  {activeTab === 'anniversary' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-t-full" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1 min-h-[400px]">
              {activeTab === 'basic' ? (
                <form id="profile-form" onSubmit={handleBasicSubmit} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">头像</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-zinc-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                        {avatarUrl ? (
                          <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold uppercase">
                            {initialProfile?.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="px-4 py-2 bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-700 text-sm font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                          上传新头像
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileUpload} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">个人简介</label>
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="介绍一下你自己..."
                      className="w-full bg-zinc-50/80 border border-zinc-200/80 rounded-xl px-4 py-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900 text-sm transition-all"
                      maxLength={200}
                    />
                    <p className="text-xs text-zinc-400 text-right mt-1">{bio.length} / 200</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">社交媒体 / 链接</label>
                      <button type="button" onClick={addSocial} className="text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors">
                        <Plus size={14} /> 添加
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {socials.map((social, idx) => (
                        <div key={idx} className="p-4 bg-zinc-50/80 rounded-xl border border-zinc-200/80 relative group hover:border-zinc-300 transition-colors">
                          <button type="button" onClick={() => removeSocial(idx)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm">
                            <X size={12} />
                          </button>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block font-semibold">平台名称</label>
                              <input
                                value={social.platform}
                                onChange={e => updateSocial(idx, 'platform', e.target.value)}
                                placeholder="如 GitHub, Twitter"
                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-900 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block font-semibold">图标标识</label>
                              <input
                                value={social.iconName}
                                onChange={e => updateSocial(idx, 'iconName', e.target.value)}
                                placeholder="如 Github"
                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-900 transition-colors"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block font-semibold">链接 URL</label>
                              <input
                                value={social.url || ''}
                                onChange={e => updateSocial(idx, 'url', e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-900 transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {socials.length === 0 && (
                        <p className="text-sm text-zinc-400 text-center py-6 bg-zinc-50/50 rounded-xl border border-zinc-200/50 border-dashed">
                          暂无社交媒体链接
                        </p>
                      )}
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg">{error}</p>}
                </form>
              ) : (
                <div className="space-y-6">
                  {editingAnniversary ? (
                    <div className="bg-zinc-50/80 p-5 rounded-2xl border border-zinc-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-sm text-zinc-800">
                          {editingAnniversary.id ? '编辑纪念日' : '添加纪念日'}
                        </h3>
                        <button onClick={() => setEditingAnniversary(null)} className="text-zinc-400 hover:text-zinc-700">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block font-semibold">标题 *</label>
                          <input
                            value={editingAnniversary.title}
                            onChange={e => setEditingAnniversary({...editingAnniversary, title: e.target.value})}
                            placeholder="如：相识、结婚纪念日"
                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block font-semibold">日期 *</label>
                          <input
                            type="date"
                            value={editingAnniversary.eventDate.split('T')[0]}
                            onChange={e => setEditingAnniversary({...editingAnniversary, eventDate: e.target.value})}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block font-semibold">类型</label>
                          <select
                            value={editingAnniversary.type || 'DEFAULT'}
                            onChange={e => setEditingAnniversary({...editingAnniversary, type: e.target.value})}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 transition-colors"
                          >
                            <option value="DEFAULT">默认</option>
                            <option value="BIRTHDAY">生日</option>
                            <option value="LOVE">恋爱</option>
                            <option value="WORK">工作</option>
                          </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => setEditingAnniversary(null)}
                            className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-200/50 rounded-lg transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={saveAnniversary}
                            disabled={loading}
                            className="px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            保存
                          </button>
                        </div>
                        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">我的纪念日</h3>
                        <button
                          onClick={() => setEditingAnniversary({ title: '', eventDate: new Date().toISOString().split('T')[0], type: 'DEFAULT' })}
                          className="text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
                        >
                          <Plus size={14} /> 添加纪念日
                        </button>
                      </div>
                      
                      {loadingAnniversaries ? (
                        <div className="py-10 flex justify-center text-zinc-400">
                          <Loader2 size={24} className="animate-spin" />
                        </div>
                      ) : anniversaries.length === 0 ? (
                        <div className="text-sm text-zinc-400 text-center py-10 bg-zinc-50/50 rounded-2xl border border-zinc-200/50 border-dashed flex flex-col items-center gap-2">
                          <Calendar size={24} className="text-zinc-300" />
                          <p>暂无纪念日记录</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {anniversaries.map((ann) => (
                            <div key={ann.id} className="group flex items-center justify-between p-4 bg-zinc-50/80 rounded-2xl border border-zinc-200/80 hover:border-zinc-300 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-zinc-100 shadow-sm text-zinc-500">
                                  <Calendar size={18} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-zinc-900 text-sm">{ann.title}</h4>
                                  <p className="text-xs text-zinc-500 mt-0.5">{new Date(ann.eventDate).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setEditingAnniversary(ann)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-zinc-600 hover:text-zinc-900 hover:shadow-sm border border-transparent hover:border-zinc-200 transition-all"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => ann.id && deleteAnniversary(ann.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-red-500 hover:text-red-600 hover:shadow-sm border border-transparent hover:border-red-100 transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-zinc-50/80 border-t border-zinc-200/50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-zinc-600 hover:bg-zinc-200/80 transition-colors"
              >
                关闭
              </button>
              {activeTab === 'basic' && (
                <button
                  type="submit"
                  form="profile-form"
                  disabled={loading}
                  className="px-8 py-2.5 bg-zinc-900 text-white rounded-xl font-bold tracking-widest flex items-center shadow-md disabled:opacity-50 hover:bg-zinc-800 transition-colors active:scale-95"
                >
                  {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  保存资料
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
