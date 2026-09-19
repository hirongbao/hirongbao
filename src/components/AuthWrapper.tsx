import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const handleAuthFailed = () => {
      setShowModal(true);
    };
    window.addEventListener('auth-failed', handleAuthFailed);
    return () => window.removeEventListener('auth-failed', handleAuthFailed);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    localStorage.setItem('site_password', password);
    setShowModal(false);
    window.location.reload();
  };

  return (
    <>
      {children}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-zinc-900/30 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-100 relative">
            <div className="p-8">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-zinc-900" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">访问受限</h3>
              <p className="text-sm text-zinc-500 mb-8">此站点为私有访问，请输入访问密码以继续。</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码..."
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all text-sm font-medium"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3 rounded-xl transition-colors text-sm"
                >
                  验证密码
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
