'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Lock, User, Sparkles, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState<boolean>(authModalMode === 'login');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 모달 모드 동기화
  React.useEffect(() => {
    setIsLoginMode(authModalMode === 'login');
    setError(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLoginMode) {
        // 로그인
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || '로그인에 실패했습니다.');
        }

        // 로그인 성공 -> 내 정보 조회 후 AuthContext 갱신
        const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        const userData = await meRes.json();
        login(data.token, userData);
      } else {
        // 회원가입
        const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, nickname }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || '회원가입에 실패했습니다.');
        }

        // 가입 성공 후 자동 로그인
        const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        const userData = await meRes.json();
        login(data.token, userData);
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-6 top-6 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-200/60 shadow-2xs">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {isLoginMode ? 'RealCrypto 로그인' : 'RealCrypto 간편 회원가입'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isLoginMode
              ? '로그인하고 코인 커뮤니티에서 실시간 토론에 참여하세요'
              : '30초 만에 가입하고 나만의 코인 인사이트를 공유하세요'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition ${
              isLoginMode ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition ${
              !isLoginMode ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* Error Message Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-600 font-bold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">아이디</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">닉네임</label>
              <div className="relative">
                <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="표시할 닉네임 (2~15자)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-sm shadow-blue-600/30 disabled:opacity-50 mt-2"
          >
            {isLoading ? '처리 중...' : isLoginMode ? '로그인' : '회원가입 완료'}
          </button>
        </form>

      </div>
    </div>
  );
};
