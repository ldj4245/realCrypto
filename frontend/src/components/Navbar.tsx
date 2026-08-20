'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
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
  exchangeRate = 1380,
  setExchangeRate,
  isStreamConnected = false,
  onRefresh,
  isLoading = false,
  averagePremium = null,
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
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Quick Profit Calculator Modal Button */}
            <button
              onClick={() => setIsCalcOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-extrabold text-xs transition shadow-2xs"
              title="실순익 차익거래 계산기"
            >
              <Calculator className="h-3.5 w-3.5 text-amber-600" />
              <span className="hidden sm:inline">실순익 계산기</span>
            </button>

            {/* Target Kimchi Premium Alert Popover */}
            <div className="relative">
              <button
                onClick={() => setIsAlertOpen((prev) => !prev)}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition ${
                  isAlertOpen
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
                }`}
                title="김프 목표치 알림 설정"
              >
                <Bell className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">김프 알림</span>
                {activeAlertCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-extrabold tabular-nums">
                    {activeAlertCount}
                  </span>
                )}
              </button>

              {isAlertOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-4">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">목표 김프 도달 알림</h4>
                      <p className="text-[11px] text-slate-400">설정한 김프 도달 시 알림음 및 브라우저 푸시</p>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`p-1.5 rounded-lg border text-xs transition ${
                        soundEnabled
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
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
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                        maxLength={12}
                        required
                      />
                      <input
                        type="number"
                        step="0.1"
                        placeholder="목표 %"
                        value={alertPremium}
                        onChange={(e) => setAlertPremium(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 tabular-nums focus:outline-none focus:border-blue-500"
                        required
                      />
                      <select
                        value={alertDirection}
                        onChange={(e) => setAlertDirection(e.target.value as 'ABOVE' | 'BELOW')}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                      >
                        <option value="ABOVE">이상 도달</option>
                        <option value="BELOW">이하 도달</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>알림 추가</span>
                    </button>
                  </form>

                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                    {alerts.length === 0 ? (
                      <p className="py-6 text-center text-[11px] text-slate-400">
                        등록된 김프 알림이 없습니다.
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
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                도달완료
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeAlert(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
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

                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                    isStreamConnected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    {isStreamConnected && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                        isStreamConnected ? 'bg-emerald-600' : 'bg-slate-400'
                      }`}
                    ></span>
                  </span>
                  <span>{isStreamConnected ? '실시간 연결' : '연결 대기'}</span>
                </div>

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
