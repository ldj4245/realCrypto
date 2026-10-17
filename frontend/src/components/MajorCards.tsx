'use client';

import React, { useState, useMemo } from 'react';
import { TripleArbitrage } from '../types/crypto';
import { usePreference } from '@/context/PreferenceContext';
import {
  Star,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Bell,
} from 'lucide-react';

interface MajorCardsProps {
  items: TripleArbitrage[];
  selectedCoin: TripleArbitrage | null;
  onSelectCoin: (coin: TripleArbitrage) => void;
  onOpenDetailModal?: (coin: TripleArbitrage) => void;
  priceFlashMap: Record<string, 'up' | 'down' | undefined>;
  exchangeRate?: number;
}

const QUICK_SYMBOLS = ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'SUI', 'TRX', 'ADA'];

export const MajorCards: React.FC<MajorCardsProps> = ({
  items,
  selectedCoin,
  onSelectCoin,
  onOpenDetailModal,
  priceFlashMap,
  exchangeRate = 1415,
}) => {
  const { isFavorite, toggleFavorite, addAlert } = usePreference();
  const [isChartOpen, setIsChartOpen] = useState<boolean>(true);
  const [chartExchange, setChartExchange] = useState<'BINANCE' | 'UPBIT'>('BINANCE');
  const [quickAlertInput, setQuickAlertInput] = useState<string>('');
  const [alertSavedMsg, setAlertSavedMsg] = useState<boolean>(false);

  const quickCoins = useMemo(() => {
    const list: TripleArbitrage[] = [];
    for (const sym of QUICK_SYMBOLS) {
      const found = items.find((i) => i.symbol === sym);
      if (found) list.push(found);
    }
    return list;
  }, [items]);

  const activeCoin = useMemo(() => {
    if (selectedCoin) {
      const updated = items.find((i) => i.symbol === selectedCoin.symbol);
      return updated || selectedCoin;
    }
    return items.find((i) => i.symbol === 'BTC') || items[0] || null;
  }, [items, selectedCoin]);

  const formatKRW = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    if (val >= 100) return Math.round(val).toLocaleString('ko-KR') + '원';
    return val.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + '원';
  };

  const formatDiffKRW = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    const sign = val > 0 ? '+' : '';
    if (Math.abs(val) >= 100) {
      return `${sign}${Math.round(val).toLocaleString('ko-KR')}원`;
    }
    return `${sign}${val.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}원`;
  };

  const formatUSD = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return (
      '$' +
      val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: val < 1 ? 4 : 2,
      })
    );
  };

  const formatVolumeEok = (val: number | null | undefined) => {
    if (!val || val <= 0) return '-';
    const eok = Math.floor(val / 100_000_000);
    if (eok >= 10_000) return `${(eok / 10_000).toFixed(1)}조원`;
    return `${eok.toLocaleString('ko-KR')}억원`;
  };

  if (!activeCoin) {
    return (
      <div className="mb-4 bg-white border border-slate-200 rounded-md p-4">
        <div className="h-8 bg-slate-100 animate-pulse rounded-xs" />
      </div>
    );
  }

  const sym = activeCoin.symbol.toUpperCase();
  const favorited = isFavorite(sym);
  const tvSymbol = chartExchange === 'BINANCE' ? `BINANCE:${sym}USDT` : `UPBIT:${sym}KRW`;
  const tvUrl = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
    tvSymbol
  )}&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=f8fafc&studies=%5B%5D&theme=light&style=1&timezone=Asia%2FSeoul&withdateranges=1&showpopupbutton=0&locale=kr`;

  const krwGap =
    activeCoin.upbitPrice && activeCoin.binancePriceKrw
      ? activeCoin.upbitPrice - activeCoin.binancePriceKrw
      : null;

  const domesticGapKrw =
    activeCoin.upbitPrice && activeCoin.bithumbPrice
      ? activeCoin.upbitPrice - activeCoin.bithumbPrice
      : null;

  const handleQuickAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(quickAlertInput);
    if (isNaN(target)) return;
    const currentPrem = activeCoin.upbitBinancePremium ?? 0;
    const dir = target >= currentPrem ? 'ABOVE' : 'BELOW';
    await addAlert(sym, target, dir);
    setQuickAlertInput('');
    setAlertSavedMsg(true);
    setTimeout(() => setAlertSavedMsg(false), 2000);
  };

  return (
    <section className="mb-4 bg-white border border-slate-200 rounded-md overflow-hidden">
      
      {/* Tier 1: Quick Major Coin Selector Strip (Kimpga / Upbit Ticker Bar) */}
      <div className="bg-slate-50 border-b border-slate-200 px-2.5 sm:px-3 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0">
          {quickCoins.map((coin) => {
            const isSelected = coin.symbol === activeCoin.symbol;
            const prem = coin.upbitBinancePremium ?? 0;
            const flash = priceFlashMap[coin.symbol];
            return (
              <button
                key={coin.symbol}
                type="button"
                onClick={() => onSelectCoin(coin)}
                className={`px-2.5 py-1 rounded-xs text-xs flex items-center gap-1.5 border transition tabular-nums whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                } ${flash === 'up' ? 'animate-flash-up' : flash === 'down' ? 'animate-flash-down' : ''}`}
              >
                <span className="font-extrabold">{coin.symbol}</span>
                <span className={isSelected ? 'text-slate-200' : 'text-slate-600'}>
                  {coin.upbitPrice ? Math.round(coin.upbitPrice).toLocaleString('ko-KR') : '-'}
                </span>
                <span
                  className={`text-[11px] font-bold ${
                    isSelected
                      ? prem >= 0
                        ? 'text-red-300'
                        : 'text-blue-300'
                      : prem >= 0
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}
                >
                  {prem >= 0 ? `+${prem.toFixed(2)}%` : `${prem.toFixed(2)}%`}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsChartOpen((prev) => !prev)}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xs bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:text-slate-900 shrink-0 whitespace-nowrap transition"
        >
          <span className="sm:hidden">{isChartOpen ? '차트 접기' : '차트 열기'}</span>
          <span className="hidden sm:inline">
            {isChartOpen ? '차트·호가 패널 접기' : '차트·호가 패널 펼치기'}
          </span>
          {isChartOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Tier 2: Selected Coin Summary Bar */}
      <div className="px-3 sm:px-3.5 py-2.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
        {/* Coin Title + Live Price */}
        <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => toggleFavorite(sym)}
              className="p-1 rounded-xs hover:bg-slate-100 text-slate-400 hover:text-amber-500 transition shrink-0"
              title={favorited ? '관심종목 해제' : '관심종목 등록'}
            >
              <Star className={`h-4 w-4 ${favorited ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>

            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                {activeCoin.nameKr}
              </h2>
              <span className="text-[11px] sm:text-xs font-bold text-slate-400">{sym}/KRW</span>
            </div>

            {activeCoin.isWalletNormal === false && (
              <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 whitespace-nowrap shrink-0">
                괴리주의
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1.5 sm:pl-3 sm:border-l sm:border-slate-200 tabular-nums whitespace-nowrap shrink-0">
            <span className="text-sm sm:text-base font-black text-slate-900">
              {formatKRW(activeCoin.upbitPrice)}
            </span>
            {activeCoin.upbitChangeRate !== null && activeCoin.upbitChangeRate !== undefined && (
              <span
                className={`text-xs font-bold ${
                  activeCoin.upbitChangeRate >= 0 ? 'text-red-600' : 'text-blue-600'
                }`}
              >
                {activeCoin.upbitChangeRate >= 0 ? '+' : ''}
                {activeCoin.upbitChangeRate.toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        {/* Right Controls: Exchange Chart Switcher & Detail Modal Button */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5">
          <div className="flex items-center border border-slate-300 rounded-xs overflow-hidden text-[11px] font-bold whitespace-nowrap shrink-0">
            <button
              type="button"
              onClick={() => setChartExchange('BINANCE')}
              className={`px-2 sm:px-2.5 py-1 transition whitespace-nowrap ${
                chartExchange === 'BINANCE'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="sm:hidden">바이낸스 USDT</span>
              <span className="hidden sm:inline">바이낸스 USDT 차트</span>
            </button>
            <button
              type="button"
              onClick={() => setChartExchange('UPBIT')}
              className={`px-2 sm:px-2.5 py-1 border-l border-slate-300 transition whitespace-nowrap ${
                chartExchange === 'UPBIT'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="sm:hidden">업비트 KRW</span>
              <span className="hidden sm:inline">업비트 KRW 차트</span>
            </button>
          </div>

          {onOpenDetailModal && (
            <button
              type="button"
              onClick={() => onOpenDetailModal(activeCoin)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xs border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[11px] font-bold transition whitespace-nowrap shrink-0"
            >
              <MessageSquare className="h-3 w-3 text-slate-500 shrink-0" />
              <span>종목 뉴스·토론</span>
            </button>
          )}
        </div>
      </div>

      {/* Tier 3: Collapsible TradingView Chart + 3-Exchange Spread Grid */}
      {isChartOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Left 8 Cols: TradingView Candle Chart */}
          <div className="lg:col-span-8 h-[260px] sm:h-[380px] bg-slate-50">
            <iframe
              key={tvSymbol}
              src={tvUrl}
              className="w-full h-full border-0"
              title={`${sym} 실시간 차트`}
              allowFullScreen
            />
          </div>

          {/* Right 4 Cols: High-Density 3-Exchange Arbitrage Spread & Quick Alert */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-white text-xs">
            <div className="divide-y divide-slate-200">
              
              {/* 1. Kimchi Premium Summary Block */}
              <div className="p-3 bg-slate-50/60">
                <div className="flex items-center justify-between mb-1 whitespace-nowrap">
                  <span className="text-[11px] font-bold text-slate-500">
                    김치 프리미엄 (업비트 vs 바이낸스)
                  </span>
                  <span className="text-[10px] text-slate-400 tabular-nums">
                    환율 {exchangeRate.toLocaleString('ko-KR')}원 기준
                  </span>
                </div>
                <div className="flex items-baseline justify-between tabular-nums whitespace-nowrap">
                  <span
                    className={`text-xl font-black ${
                      (activeCoin.upbitBinancePremium ?? 0) >= 0 ? 'text-red-600' : 'text-blue-600'
                    }`}
                  >
                    {activeCoin.upbitBinancePremium !== null && activeCoin.upbitBinancePremium !== undefined
                      ? `${activeCoin.upbitBinancePremium >= 0 ? '+' : ''}${activeCoin.upbitBinancePremium.toFixed(2)}%`
                      : '-'}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      (krwGap ?? 0) >= 0 ? 'text-red-600' : 'text-blue-600'
                    }`}
                  >
                    차액 {formatDiffKRW(krwGap)}
                  </span>
                </div>
              </div>

              {/* 2. 3-Exchange Price Comparison Table */}
              <div className="p-3 space-y-2 tabular-nums">
                <div className="flex items-center justify-between whitespace-nowrap">
                  <span className="text-slate-500 font-semibold">업비트 현재가</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatKRW(activeCoin.upbitPrice)}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">
                      ({formatVolumeEok(activeCoin.upbitTradeValue)})
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between whitespace-nowrap">
                  <span className="text-slate-500 font-semibold">빗썸 현재가</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatKRW(activeCoin.bithumbPrice)}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">
                      ({formatVolumeEok(activeCoin.bithumbTradeValue)})
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between whitespace-nowrap">
                  <span className="text-slate-500 font-semibold">바이낸스 (원화환산)</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatKRW(activeCoin.binancePriceKrw)}</span>
                    <span className="text-[11px] text-slate-500 ml-1.5">
                      ({formatUSD(activeCoin.binancePriceUsd)})
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 whitespace-nowrap">
                  <span className="text-slate-500 font-semibold">국내 격차 (업비트-빗썸)</span>
                  <div className="text-right">
                    <span
                      className={`font-bold ${
                        (activeCoin.upbitBithumbGap ?? 0) >= 0 ? 'text-red-600' : 'text-blue-600'
                      }`}
                    >
                      {activeCoin.upbitBithumbGap !== null && activeCoin.upbitBithumbGap !== undefined
                        ? `${activeCoin.upbitBithumbGap >= 0 ? '+' : ''}${activeCoin.upbitBithumbGap.toFixed(2)}%`
                        : '-'}
                    </span>
                    {domesticGapKrw !== null && (
                      <span className="text-[10px] text-slate-400 ml-1.5">
                        ({formatDiffKRW(domesticGapKrw)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between whitespace-nowrap">
                  <span className="text-slate-500 font-semibold">바이낸스 선물 펀딩비(8h)</span>
                  <div className="text-right">
                    {activeCoin.fundingRatePercent !== null && activeCoin.fundingRatePercent !== undefined ? (
                      <>
                        <span
                          className={`font-bold ${
                            activeCoin.fundingRatePercent >= 0 ? 'text-red-600' : 'text-blue-600'
                          }`}
                        >
                          {activeCoin.fundingRatePercent >= 0 ? '+' : ''}
                          {activeCoin.fundingRatePercent.toFixed(4)}%
                        </span>
                        {activeCoin.fundingApr !== null && activeCoin.fundingApr !== undefined && (
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            (연 {activeCoin.fundingApr.toFixed(1)}%)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* 3. Bottom Quick Target Kimp Alert Input */}
            <div className="p-3 bg-slate-50 border-t border-slate-200">
              <form onSubmit={handleQuickAlert} className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 shrink-0 whitespace-nowrap">
                  <Bell className="h-3 w-3 text-slate-500" />
                  <span>{sym} 김프 알림</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="목표 % (예: 2.5)"
                  value={quickAlertInput}
                  onChange={(e) => setQuickAlertInput(e.target.value)}
                  className="flex-1 min-w-0 bg-white border border-slate-300 rounded-xs px-2 py-1 text-xs font-bold text-slate-900 tabular-nums focus:outline-none focus:border-slate-900"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-xs bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shrink-0 whitespace-nowrap transition"
                >
                  {alertSavedMsg ? '등록됨' : '등록'}
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

    </section>
  );
};
