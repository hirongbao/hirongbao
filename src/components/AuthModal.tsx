import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Key, RefreshCw } from 'lucide-react';
import { authRequest, setToken, setUserInfo } from '../utils/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login fields
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  
  // Register fields
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setAccount('');
      setPassword('');
      setEmail('');
      setCode('');
      setAccountName('');
      setRegPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email) {
      setError('请输入邮箱');
      return;
    }
    setError('');
    try {
      await authRequest('/api/user/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      setCountdown(60);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authRequest('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, password })
      });
      setToken(data.token);
      setUserInfo(data);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authRequest('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, code, accountName, password: regPassword, confirmPassword
        })
      });
      setIsLogin(true);
      setAccount(accountName);
      setError('注册成功，请登录');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="relative w-full max-w-md bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition-colors">
              <X size={20} strokeWidth={2} />
            </button>
            
            <div className="p-10">
              <div className="flex justify-center space-x-8 mb-8 pb-2">
                <button
                  className={`relative text-[17px] tracking-widest pb-2 transition-all ${isLogin ? 'text-[#0f172a] font-bold after:content-[""] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-[3px] after:bg-[#0f172a] after:rounded-full' : 'text-slate-400 font-medium'}`}
                  onClick={() => { setIsLogin(true); setError(''); }}
                >
                  登录
                </button>
                <button
                  className={`relative text-[17px] tracking-widest pb-2 transition-all ${!isLogin ? 'text-[#0f172a] font-bold after:content-[""] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-[3px] after:bg-[#0f172a] after:rounded-full' : 'text-slate-400 font-medium'}`}
                  onClick={() => { setIsLogin(false); setError(''); }}
                >
                  注册
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-4 mt-2">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={2} />
                    <input
                      type="text"
                      placeholder="账号名或邮箱"
                      value={account}
                      onChange={e => setAccount(e.target.value)}
                      className="w-full pl-12 pr-4 py-[14px] bg-[#f8fafc] border-transparent rounded-[18px] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/5 focus:bg-[#f1f5f9] transition-all text-[14px] text-slate-700 placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={2} />
                    <input
                      type="password"
                      placeholder="密码"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-[14px] bg-[#f8fafc] border-transparent rounded-[18px] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/5 focus:bg-[#f1f5f9] transition-all text-[14px] text-slate-700 placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-[15px] mt-6 bg-[#0f172a] text-white rounded-[18px] font-bold tracking-[0.2em] flex items-center justify-center space-x-2 disabled:opacity-50 shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:bg-[#1e293b] transition-all"
                  >
                    {loading && <RefreshCw size={16} className="animate-spin" />}
                    <span>{loading ? '登录中...' : '登 录'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4 mt-2">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={2} />
                    <input
                      type="email"
                      placeholder="邮箱"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-[14px] bg-[#f8fafc] border-transparent rounded-[18px] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/5 focus:bg-[#f1f5f9] transition-all text-[14px] text-slate-700 placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <div className="flex space-x-3">
                    <div className="relative flex-1">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={2} />
                      <input
                        type="text"
                        placeholder="验证码"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        className="w-full pl-12 pr-4 py-[14px] bg-[#f8fafc] border-transparent rounded-[18px] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/5 focus:bg-[#f1f5f9] transition-all text-[14px] text-slate-700 placeholder:text-slate-400"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      disabled={countdown > 0}
                      onClick={handleSendCode}
                      className="px-5 py-[14px] bg-[#f1f5f9] text-[#475569] font-bold rounded-[18px] whitespace-nowrap disabled:opacity-50 text-[14px] hover:bg-[#e2e8f0] transition-colors"
                    >
                      {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                    </button>
                  </div>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={2} />
                    <input
                      type="text"
                      placeholder="唯一账号名 (注册后不可修改)"
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                      className="w-full pl-12 pr-4 py-[14px] bg-[#f8fafc] border-transparent rounded-[18px] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/5 focus:bg-[#f1f5f9] transition-all text-[14px] text-slate-700 placeholder:text-slate-400"
                      pattern="^[a-zA-Z0-9_]{3,20}$"
                      title="3-20位字母、数字或下划线"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={2} />
                    <input
                      type="password"
                      placeholder="密码"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-[14px] bg-[#f8fafc] border-transparent rounded-[18px] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/5 focus:bg-[#f1f5f9] transition-all text-[14px] text-slate-700 placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={2} />
                    <input
                      type="password"
                      placeholder="确认密码"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-[14px] bg-[#f8fafc] border-transparent rounded-[18px] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/5 focus:bg-[#f1f5f9] transition-all text-[14px] text-slate-700 placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-[15px] mt-6 bg-[#0f172a] text-white rounded-[18px] font-bold tracking-[0.2em] flex items-center justify-center space-x-2 disabled:opacity-50 shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:bg-[#1e293b] transition-all"
                  >
                    {loading && <RefreshCw size={16} className="animate-spin" />}
                    <span>{loading ? '注册中...' : '注 册'}</span>
                  </button>
                  <p className="mt-8 text-center text-[12px] text-slate-400">
                    注册即代表同意 <a href="#" className="text-slate-600 font-medium">用户协议</a> 和 <a href="#" className="text-slate-600 font-medium">隐私政策</a>
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
