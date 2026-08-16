'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { CategoryType, PositionType } from '@/types/community';
import {
  PenSquare,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Tag,
  Percent,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function WritePostPage() {
  const router = useRouter();
  const { isLoggedIn, token, openAuthModal } = useAuth();

  const [category, setCategory] = useState<CategoryType>('FREE');
  const [position, setPosition] = useState<PositionType>('NEUTRAL');
  const [targetSymbol, setTargetSymbol] = useState<string>('');
  const [profitRate, setProfitRate] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoggedIn) {
      openAuthModal('login');
    }
  }, [isLoggedIn, openAuthModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !token) {
      openAuthModal('login');
      return;
    }

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      setError('본문 내용을 입력해주세요.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        category,
        position,
        targetSymbol: targetSymbol.trim() ? targetSymbol.trim().toUpperCase() : null,
        title: title.trim(),
        content: content.trim(),
        profitRate: profitRate ? parseFloat(profitRate) : null,
      };

      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || '게시글 작성에 실패했습니다.');
      }

      const postId = await res.json();
      router.push(`/community/${postId}`);
    } catch (err: any) {
      setError(err.message || '게시글 작성 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Top Back Link */}
        <button
          onClick={() => router.push('/community')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>커뮤니티 목록으로 돌아가기</span>
        </button>

        {/* Write Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          
          <div className="flex items-center gap-2.5 pb-6 border-b border-slate-100 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
              <PenSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">새 게시글 작성</h1>
              <p className="text-xs text-slate-400 font-medium">코인 인사이트, 차트 분석, 익절 인증을 공유하세요</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-600 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Category Selection */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">카테고리</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'FREE', label: '자유게시판' },
                  { key: 'PROFIT_LOSS', label: '익절/손절 인증' },
                  { key: 'ARBITRAGE_INFO', label: '김프/차익 꿀팁' },
                  { key: 'ANALYSIS', label: '코인 분석/전망' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCategory(item.key as CategoryType)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      category === item.key
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Position & Target Symbol */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Position */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">포지션 뷰</label>
                <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPosition('LONG')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      position === 'LONG' ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    롱 🟢
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('NEUTRAL')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      position === 'NEUTRAL' ? 'bg-white text-slate-800 border border-slate-200 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    중립 ⚪
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('SHORT')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      position === 'SHORT' ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    숏 🔴
                  </button>
                </div>
              </div>

              {/* Target Symbol */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">
                  관련 코인 심볼 <span className="text-slate-400 font-medium">(선택)</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={targetSymbol}
                    onChange={(e) => setTargetSymbol(e.target.value.toUpperCase())}
                    placeholder="예: BTC, XRP, SOL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                  />
                </div>
              </div>

              {/* Profit Rate (for PROFIT_LOSS) */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">
                  수익률 (%) <span className="text-slate-400 font-medium">(인증글용)</span>
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="number"
                    step="0.1"
                    value={profitRate}
                    onChange={(e) => setProfitRate(e.target.value)}
                    placeholder="예: +45.2 또는 -10.5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tabular-nums"
                  />
                </div>
              </div>

            </div>

            {/* 3. Title */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">제목</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="게시글 제목을 입력하세요"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            {/* 4. Content */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">본문 내용</label>
              <textarea
                required
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="코인 시황, 차익거래 팁, 매매 경험담 등을 자유롭게 작성해주세요."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition leading-relaxed resize-y"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.push('/community')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-sm shadow-blue-500/20 disabled:opacity-50"
              >
                {isSubmitting ? '등록 중...' : '게시글 등록'}
              </button>
            </div>

          </form>

        </div>

      </main>
    </div>
  );
}
