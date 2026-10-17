'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { ArbitrageCalculatorModal } from '@/components/ArbitrageCalculatorModal';
import {
  RefreshCw,
  Calculator,
  LogIn,
  LogOut,
  User,
  Bell,
  Volume2,
  VolumeX,
  Trash2,
  Plus,
} from 'lucide-react';

interface NavbarProps {
  exchangeRate?: number;
  setExchangeRate?: (rate: number) => void;
  isStreamConnected?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
  averagePremium?: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  exchangeRate = 1415,
  setExchangeRate,
  isStreamConnected = false,
  onRefresh,
  isLoading = false,
}) => {
  const pathname = usePathname();
  const { user, isLoggedIn, logout, openAuthModal } = useAuth();
  const { alerts, soundEnabled, setSoundEnabled, addAlert, removeAlert } = usePreference();
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const [alertSymbol, setAlertSymbol] = useState('BTC');
  const [alertPremium, setAlertPremium] = useState('3.0');
  const [alertDirection, setAlertDirection] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  const isDashboard = pathname === '/';
  const isNews = pathname.startsWith('/news');
  const isCommunity = pathname.startsWith('/community');

  const activeAlertCount = alerts.filter((a) => !a.isTriggered).length;

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const sym = alertSymbol.trim().toUpperCase();
    const prem = parseFloat(alertPremium);
    if (!sym || isNaN(prem)) return;
    await addAlert(sym, prem, alertDirection);
    setAlertSymbol('');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-12 flex items-center justify-between gap-4">
          
          {/* Left: Brand Identity & Terminal Tabs */}
          <div className="flex items-center gap-6 h-full">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="font-black text-base tracking-tight text-slate-900">
                REAL<span className="text-blue-700">CRYPTO</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-xs">
                PRO
              </span>
            </Link>

            {/* Navigation Links (Upbit / Kimpga style underline tabs) */}
            <nav className="flex items-center h-full text-xs font-bold">
              <Link
                href="/"
                className={`h-full flex items-center px-3 border-b-2 transition ${
                  isDashboard
                    ? 'border-slate-900 text-slate-900 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                시세·김프 터미널
              </Link>
              <Link
                href="/news"
                className={`h-full flex items-center px-3 border-b-2 transition ${
                  isNews
                    ? 'border-slate-900 text-slate-900 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                실시간 속보·온체인
              </Link>
              <Link
                href="/community"
                className={`h-full flex items-center px-3 border-b-2 transition ${
                  isCommunity
                    ? 'border-slate-900 text-slate-900 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                종목 토론·커뮤니티
              </Link>
            </nav>
          </div>

          {/* Right: Terminal Controls & Auth */}
          <div className="flex items-center gap-2">
            
            {/* Custom Exchange Rate Input on Dashboard */}
            {isDashboard && setExchangeRate && (
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px]">
                <span className="text-slate-500 font-semibold">적용환율</span>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Math.max(1, Number(e.target.value)))}
                  className="w-14 bg-white border border-slate-300 rounded-xs px-1.5 py-0.5 font-bold text-right text-slate-900 focus:outline-none focus:border-blue-600 text-[11px] tabular-nums"
                  step="1"
                />
                <span className="text-slate-500">원</span>
              </div>
            )}

            {/* Profit Calculator Button */}
            <button
              onClick={() => setIsCalcOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs transition"
              title="차익거래 실수령 계산기"
            >
              <Calculator className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden sm:inline">차익 계산기</span>
            </button>

            {/* Target Kimchi Premium Alert Popover */}
            <div className="relative">
              <button
                onClick={() => setIsAlertOpen((prev) => !prev)}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-bold transition ${
                  isAlertOpen
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                }`}
                title="목표 김프 도달 알림"
              >
                <Bell className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">김프 알림</span>
                {activeAlertCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-xs bg-blue-600 text-white text-[10px] font-extrabold tabular-nums">
                    {activeAlertCount}
                  </span>
                )}
              </button>

              {isAlertOpen && (
                <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-md border border-slate-300 shadow-lg z-50 p-3.5">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">목표 김치 프리미엄 알림</h4>
                      <p className="text-[11px] text-slate-500">지정 구간 도달 시 즉시 브라우저 알림</p>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`p-1.5 rounded-xs border text-xs transition ${
                        soundEnabled
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                      title={soundEnabled ? '알림음 켜짐' : '알림음 꺼짐'}
                    >
                      {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <form onSubmit={handleAddAlert} className="space-y-2 mb-3">
                    <div className="grid grid-cols-3 gap-1.5">
                      <input
                        type="text"
                        placeholder="심볼 (BTC)"
                        value={alertSymbol}
                        onChange={(e) => setAlertSymbol(e.target.value.toUpperCase())}
                        className="bg-slate-50 border border-slate-300 rounded-xs px-2 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                        maxLength={12}
                        required
                      />
                      <input
                        type="number"
                        step="0.1"
                        placeholder="목표 %"
                        value={alertPremium}
                        onChange={(e) => setAlertPremium(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xs px-2 py-1.5 text-xs font-bold text-slate-900 tabular-nums focus:outline-none focus:border-slate-900"
                        required
                      />
                      <select
                        value={alertDirection}
                        onChange={(e) => setAlertDirection(e.target.value as 'ABOVE' | 'BELOW')}
                        className="bg-slate-50 border border-slate-300 rounded-xs px-1.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900"
                      >
                        <option value="ABOVE">이상 도달</option>
                        <option value="BELOW">이하 도달</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-xs bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>알림 등록</span>
                    </button>
                  </form>

                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                    {alerts.length === 0 ? (
                      <p className="py-5 text-center text-[11px] text-slate-400">
                        등록된 알림이 없습니다.
                      </p>
                    ) : (
                      alerts.map((item) => (
                        <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{item.symbol}</span>
                            <span className="text-slate-600 tabular-nums font-semibold">
                              {item.targetPremium >= 0 ? `+${item.targetPremium}%` : `${item.targetPremium}%`}{' '}
                              {item.direction === 'ABOVE' ? '이상' : '이하'}
                            </span>
                            {item.isTriggered && (
                              <span className="px-1.5 py-0.5 rounded-xs bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold">
                                도달완료
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeAlert(item.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition"
                            title="알림 삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stream Status & Manual Refresh */}
            {isDashboard && (
              <>
                <div
                  className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold border ${
                    isStreamConnected
                      ? 'bg-white text-slate-800 border-slate-300'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                  title={isStreamConnected ? 'SSE 실시간 스트리밍 연결됨' : '연결 대기 중'}
                >
                  <span
                    className={`inline-block rounded-full h-1.5 w-1.5 ${
                      isStreamConnected ? 'bg-emerald-600' : 'bg-slate-400'
                    }`}
                  />
                  <span>{isStreamConnected ? 'LIVE' : 'WAIT'}</span>
                </div>

                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="p-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition disabled:opacity-50"
                    title="시세 수동 갱신"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                )}
              </>
            )}

            {/* User Auth */}
            {isLoggedIn && user ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-900 font-bold">
                  <User className="h-3 w-3 text-slate-600" />
                  <span>{user.nickname}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-slate-100 transition"
                  title="로그아웃"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>로그인</span>
              </button>
            )}

          </div>

        </div>
      </header>

      <ArbitrageCalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
    </>
  );
};
