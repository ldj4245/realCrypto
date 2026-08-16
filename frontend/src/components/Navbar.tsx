'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArbitrageCalculatorModal } from '@/components/ArbitrageCalculatorModal';
import {
  RefreshCw,
  TrendingUp,
  DollarSign,
  Activity,
  MessageSquare,
  LayoutDashboard,
  Newspaper,
  Calculator,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';

interface NavbarProps {
  exchangeRate?: number;
  setExchangeRate?: (rate: number) => void;
  countdown?: number;
  onRefresh?: () => void;
  isLoading?: boolean;
  averagePremium?: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  exchangeRate = 1380,
  setExchangeRate,
  countdown,
  onRefresh,
  isLoading = false,
  averagePremium = null,
}) => {
  const pathname = usePathname();
  const { user, isLoggedIn, logout, openAuthModal } = useAuth();
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  const isDashboard = pathname === '/';
  const isNews = pathname.startsWith('/news');
  const isCommunity = pathname.startsWith('/community');

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Navigation Tabs */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  REAL<span className="text-blue-600">CRYPTO</span>
                </span>
              </div>
            </Link>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs font-extrabold">
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  isDashboard
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>실시간 김프</span>
              </Link>
              <Link
                href="/news"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  isNews
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Newspaper className="h-3.5 w-3.5" />
                <span>속보 & 고래 레이더</span>
              </Link>
              <Link
                href="/community"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  isCommunity
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>커뮤니티</span>
              </Link>
            </nav>
          </div>

          {/* Right: Stats & Controls & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Profit Calculator Modal Button */}
            <button
              onClick={() => setIsCalcOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-extrabold text-xs transition shadow-2xs"
              title="실순익 차익거래 계산기"
            >
              <Calculator className="h-3.5 w-3.5 text-amber-600" />
              <span className="hidden sm:inline">실순익 계산기</span>
            </button>

            {/* Dashboard specific controls */}
            {isDashboard && (
              <>
                {averagePremium !== null && (
                  <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
                    <TrendingUp className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-400 font-medium">평균김프:</span>
                    <span
                      className={`font-bold tabular-nums ${
                        averagePremium >= 0 ? 'text-rose-600' : 'text-blue-600'
                      }`}
                    >
                      {averagePremium >= 0 ? `+${averagePremium.toFixed(2)}%` : `${averagePremium.toFixed(2)}%`}
                    </span>
                  </div>
                )}

                {setExchangeRate && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                    <DollarSign className="h-3 w-3 text-emerald-600" />
                    <span className="text-slate-400 font-medium hidden md:inline text-[11px]">실시간환율:</span>
                    <input
                      type="number"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(Math.max(1, Number(e.target.value)))}
                      className="w-14 bg-white border border-slate-300 rounded-md px-1 py-0.5 font-bold text-right text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-[11px] tabular-nums"
                      step="1"
                    />
                    <span className="text-slate-400 font-medium text-[11px]">원</span>
                  </div>
                )}

                {countdown !== undefined && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold tabular-nums">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
                    </span>
                    <span>{countdown}s</span>
                  </div>
                )}

                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 hover:text-blue-600 transition shadow-2xs disabled:opacity-50"
                    title="즉시 새로고침"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                )}
              </>
            )}

            {/* User Auth Buttons */}
            {isLoggedIn && user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200/60 text-xs text-blue-900 font-extrabold">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  <span>{user.nickname}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="로그아웃"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm shadow-blue-500/20"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>로그인</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Calculator Modal */}
      <ArbitrageCalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
    </>
  );
};
