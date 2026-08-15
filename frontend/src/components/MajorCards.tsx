'use client';

import React from 'react';
import { TripleArbitrage } from '../types/crypto';
import { ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

interface MajorCardsProps {
  items: TripleArbitrage[];
  onSelectCoin: (coin: TripleArbitrage) => void;
  priceFlashMap: Record<string, 'up' | 'down' | undefined>;
}

export const MajorCards: React.FC<MajorCardsProps> = ({
  items,
  onSelectCoin,
  priceFlashMap,
}) => {
  const majorSymbols = ['BTC', 'ETH', 'SOL', 'XRP'];
  const majorCoins = majorSymbols
    .map((sym) => items.find((item) => item.symbol.toUpperCase() === sym))
    .filter((c): c is TripleArbitrage => c !== undefined);

  if (majorCoins.length === 0) {
    return null;
  }

  const formatKRW = (num: number | null) => {
    if (num === null || num === undefined) return '-';
    return Math.round(num).toLocaleString('ko-KR') + ' ₩';
  };

  const formatUSD = (num: number | null) => {
    if (num === null || num === undefined) return '-';
    return (
      '$' +
      num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: num < 1 ? 4 : 2,
      })
    );
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">주요 암호화폐 3사 시세 요약</h2>
        </div>
        <span className="text-xs text-slate-400">클릭 시 상세 비교</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {majorCoins.map((coin) => {
          const flash = priceFlashMap[coin.symbol];
          const premium = coin.upbitBinancePremium ?? coin.bithumbBinancePremium ?? 0;
          const isPositive = premium >= 0;

          return (
            <div
              key={coin.symbol}
              onClick={() => onSelectCoin(coin)}
              className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-300 transition duration-200 cursor-pointer relative overflow-hidden group ${
                flash === 'up' ? 'animate-flash-up' : flash === 'down' ? 'animate-flash-down' : ''
              }`}
            >
              {/* Header: Symbol & Premium Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                    {coin.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {coin.symbol}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium leading-tight">
                      {coin.nameKr}
                    </p>
                  </div>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-xl text-xs font-black tracking-tight border flex items-center gap-0.5 tabular-nums ${
                    isPositive
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-blue-50 text-blue-600 border-blue-200'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" />
                  )}
                  <span>{isPositive ? `+${premium.toFixed(2)}%` : `${premium.toFixed(2)}%`}</span>
                </div>
              </div>

              {/* Main Price: Upbit KRW */}
              <div className="mb-4">
                <span className="text-[11px] text-slate-400 font-medium block mb-0.5">
                  업비트 현재가
                </span>
                <span className="text-xl font-black text-slate-900 tracking-tight tabular-nums block">
                  {formatKRW(coin.upbitPrice)}
                </span>
              </div>

              {/* Multi-Exchange Sub Info */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">빗썸</span>
                  <span className="font-bold text-slate-700 tabular-nums">
                    {formatKRW(coin.bithumbPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">바이낸스 (USD)</span>
                  <span className="font-bold text-slate-700 tabular-nums">
                    {formatUSD(coin.binancePriceUsd)}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
};
