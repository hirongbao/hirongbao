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

const PREDEFINED_SOCIALS = [
  { platform: '微信', iconName: 'MessageCircle', type: 'qrcode' },
  { platform: 'QQ', iconName: 'MessageSquare', type: 'qrcode' },
  { platform: '抖音', iconName: 'Music', type: 'qrcode' },
  { platform: 'GitHub', iconName: 'Github', type: 'url' }
];

export default function ProfileEditModal({ isOpen, onClose, onSuccess, initialProfile }: ProfileEditModalProps) {
  // Basic info state
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl || '');
  const [bio, setBio] = useState(initialProfile?.bio === '这个人很懒，什么都没写~' ? '' : initialProfile?.bio || '');
  const [nickname, setNickname] = useState(initialProfile?.name || '');
  const [socials, setSocials] = useState<any[]>(initialProfile?.socials || []);
  
  // QR Upload State
  const [uploadingQrIndex, setUploadingQrIndex] = useState<number | null>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  
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
      setError('');
    }
  }, [isOpen, initialProfile]);

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authRequest('/api/profile/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl, bio, nickname, socials })
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

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (qrFileInputRef.current) qrFileInputRef.current.value = '';
    if (!files.length || uploadingQrIndex === null) return;
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      
      const fileRecord = await authRequest('/api/posts/ugc/upload', {
        method: 'POST',
        body: formData
      });
      
      if (fileRecord && fileRecord.fileUrl) {
        updateSocial(uploadingQrIndex, 'qrCodeUrl', fileRecord.fileUrl);
      }
    } catch (err: any) {
      setError(`二维码上传失败: ${err.message}`);
    } finally {
      setLoading(false);
      setUploadingQrIndex(null);
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
            {/* Header */}
            <div className="px-6 pt-4 border-b border-zinc-200/50 bg-white/50 flex flex-col gap-4 shrink-0">
              <div className="flex items-center justify-between pb-4">
                <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  编辑个人资料
                </h2>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1 min-h-[400px]">
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
                      <input ref={qrFileInputRef} type="file" accept="image/*" hidden onChange={handleQrUpload} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">显示昵称</label>
                  <input
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="你的昵称（选填）"
                    className="w-full bg-zinc-50/80 border border-zinc-200/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900 text-sm transition-all mb-6"
                    maxLength={20}
                  />
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
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block font-semibold">平台名称</label>
                            <select
                              value={social.platform || ''}
                              onChange={e => {
                                const selected = PREDEFINED_SOCIALS.find(p => p.platform === e.target.value);
                                if (selected) {
                                  updateSocial(idx, 'platform', selected.platform);
                                  updateSocial(idx, 'iconName', selected.iconName);
                                  if (selected.type === 'url') {
                                    const newSocials = [...socials];
                                    delete newSocials[idx].qrCodeUrl;
                                    setSocials(newSocials);
                                  } else {
                                    const newSocials = [...socials];
                                    delete newSocials[idx].url;
                                    setSocials(newSocials);
                                  }
                                }
                              }}
                              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-900 transition-colors"
                            >
                              <option value="" disabled>选择平台</option>
                              {PREDEFINED_SOCIALS.map(p => (
                                <option key={p.platform} value={p.platform}>{p.platform}</option>
                              ))}
                            </select>
                          </div>

                          {PREDEFINED_SOCIALS.find(p => p.platform === social.platform)?.type === 'url' ? (
                            <div>
                              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block font-semibold">主页 URL</label>
                              <input
                                value={social.url || ''}
                                onChange={e => updateSocial(idx, 'url', e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-900 transition-colors"
                              />
                            </div>
                          ) : social.platform ? (
                            <div>
                              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block font-semibold">上传二维码</label>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadingQrIndex(idx);
                                    qrFileInputRef.current?.click();
                                  }}
                                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <ImageIcon size={14} /> 上传图片
                                </button>
                                {social.qrCodeUrl && (
                                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                    已上传
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : null}
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
            </div>

            <div className="px-6 py-4 bg-zinc-50/80 border-t border-zinc-200/50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-zinc-600 hover:bg-zinc-200/80 transition-colors"
              >
                关闭
              </button>
              <button
                type="submit"
                form="profile-form"
                disabled={loading}
                className="px-8 py-2.5 bg-zinc-900 text-white rounded-xl font-bold tracking-widest flex items-center shadow-md disabled:opacity-50 hover:bg-zinc-800 transition-colors active:scale-95"
              >
                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                保存资料
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
