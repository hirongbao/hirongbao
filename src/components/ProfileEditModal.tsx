import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';
import { authRequest, getUserInfo, setUserInfo } from '../utils/auth';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProfile: any;
}

export default function ProfileEditModal({ isOpen, onClose, onSuccess, initialProfile }: ProfileEditModalProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl || '');
  const [bio, setBio] = useState(initialProfile?.bio === '这个人很懒，什么都没写~' ? '' : initialProfile?.bio || '');
  const [socials, setSocials] = useState<any[]>(initialProfile?.socials || []);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialProfile) {
      setAvatarUrl(initialProfile.avatarUrl || '');
      setBio(initialProfile.bio === '这个人很懒，什么都没写~' ? '' : initialProfile.bio || '');
      setSocials(initialProfile.socials || []);
    }
  }, [isOpen, initialProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
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
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                编辑个人资料
              </h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">头像</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} className="w-full h-full object-cover" />
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
                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
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
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm"
                    maxLength={200}
                  />
                  <p className="text-xs text-zinc-400 text-right mt-1">{bio.length} / 200</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">社交媒体 / 链接</label>
                    <button type="button" onClick={addSocial} className="text-xs text-blue-500 hover:text-blue-600 font-bold flex items-center gap-1">
                      <Plus size={14} /> 添加
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {socials.map((social, idx) => (
                      <div key={idx} className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 relative group">
                        <button type="button" onClick={() => removeSocial(idx)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                          <X size={12} />
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">平台名称</label>
                            <input
                              value={social.platform}
                              onChange={e => updateSocial(idx, 'platform', e.target.value)}
                              placeholder="如 GitHub, Twitter"
                              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-900"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">图标标识</label>
                            <input
                              value={social.iconName}
                              onChange={e => updateSocial(idx, 'iconName', e.target.value)}
                              placeholder="如 Github"
                              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-900"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">链接 URL</label>
                            <input
                              value={social.url || ''}
                              onChange={e => updateSocial(idx, 'url', e.target.value)}
                              placeholder="https://..."
                              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-900"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">二维码链接 (可选)</label>
                            <input
                              value={social.qrCodeUrl || ''}
                              onChange={e => updateSocial(idx, 'qrCodeUrl', e.target.value)}
                              placeholder="https://..."
                              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-900"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {socials.length === 0 && (
                      <p className="text-sm text-zinc-400 text-center py-4 bg-zinc-50 rounded-xl border border-zinc-200 border-dashed">
                        暂无社交媒体链接
                      </p>
                    )}
                  </div>
                </div>

                {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              </form>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-zinc-600 hover:bg-zinc-200 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                form="profile-form"
                disabled={loading}
                className="px-8 py-2.5 bg-zinc-900 text-white rounded-xl font-bold tracking-widest flex items-center shadow-md disabled:opacity-50 hover:bg-zinc-800 transition-colors active:scale-95"
              >
                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                保存
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
