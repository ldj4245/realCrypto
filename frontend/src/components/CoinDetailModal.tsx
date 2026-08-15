'use client';

import React from 'react';
import { TripleArbitrage } from '../types/crypto';
import { X, Scale, ArrowUpRight, ArrowDownRight, Building2 } from 'lucide-react';

interface CoinDetailModalProps {
  coin: TripleArbitrage | null;
  onClose: () => void;
  exchangeRate: number;
}

export const CoinDetailModal: React.FC<CoinDetailModalProps> = ({
  coin,
  onClose,
  exchangeRate,
}) => {
  if (!coin) return null;

  const formatKRW = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-';
    if (num >= 100) {
      return Math.round(num).toLocaleString('ko-KR') + ' ₩';
    }
    return num.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' ₩';
  };

  const formatUSD = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-';
    return (
      '$' +
      num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: num < 1 ? 4 : 2,
      })
    );
  };

  const formatTradeValueKRW = (val: number | null | undefined) => {
    if (!val || val <= 0) return '-';
    const eok = Math.floor(val / 100_000_000);
    return `${eok.toLocaleString()}억원`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 sm:p-8 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header: Coin Info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-black text-lg flex items-center justify-center border border-blue-200/60">
            {coin.symbol.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{coin.symbol}</h2>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                {coin.nameKr}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">3대 거래소 실시간 시세 및 프리미엄 분석</p>
          </div>
        </div>

        {/* 3 Exchange Price Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          
          {/* Upbit */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-700">
                업비트 (UPBIT)
              </span>
              {coin.upbitChangeRate !== null && (
                <span
                  className={`text-[11px] font-bold ${
                    coin.upbitChangeRate >= 0 ? 'text-rose-600' : 'text-blue-600'
                  }`}
                >
                  {coin.upbitChangeRate >= 0 ? '+' : ''}
                  {coin.upbitChangeRate.toFixed(2)}%
                </span>
              )}
            </div>
            <span className="text-base font-black text-slate-900 block tabular-nums">
              {formatKRW(coin.upbitPrice)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              거래대금: {formatTradeValueKRW(coin.upbitTradeValue)}
            </span>
          </div>

          {/* Bithumb */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-100 text-orange-700">
                빗썸 (BITHUMB)
              </span>
              {coin.bithumbChangeRate !== null && (
                <span
                  className={`text-[11px] font-bold ${
                    coin.bithumbChangeRate >= 0 ? 'text-rose-600' : 'text-blue-600'
                  }`}
                >
                  {coin.bithumbChangeRate >= 0 ? '+' : ''}
                  {coin.bithumbChangeRate.toFixed(2)}%
                </span>
              )}
            </div>
            <span className="text-base font-black text-slate-900 block tabular-nums">
              {formatKRW(coin.bithumbPrice)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              거래대금: {formatTradeValueKRW(coin.bithumbTradeValue)}
            </span>
          </div>

          {/* Binance */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-yellow-100 text-yellow-800">
                바이낸스 (BINANCE)
              </span>
              {coin.binanceChangeRate !== null && (
                <span
                  className={`text-[11px] font-bold ${
                    coin.binanceChangeRate >= 0 ? 'text-rose-600' : 'text-blue-600'
                  }`}
                >
                  {coin.binanceChangeRate >= 0 ? '+' : ''}
                  {coin.binanceChangeRate.toFixed(2)}%
                </span>
              )}
            </div>
            <span className="text-base font-black text-slate-900 block tabular-nums">
              {formatKRW(coin.binancePriceKrw)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              {formatUSD(coin.binancePriceUsd)} (환율 {exchangeRate}원)
            </span>
          </div>

        </div>

        {/* Arbitrage Summary Section */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              거래소 간 프리미엄 격차 분석
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Upbit vs Binance */}
            <div className="p-3 bg-white rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block text-[11px] font-medium mb-1">
                업비트 vs 바이낸스 김프
              </span>
              <span
                className={`text-lg font-black tabular-nums ${
                  (coin.upbitBinancePremium ?? 0) >= 0 ? 'text-rose-600' : 'text-blue-600'
                }`}
              >
                {coin.upbitBinancePremium !== null
                  ? `${(coin.upbitBinancePremium ?? 0) >= 0 ? '+' : ''}${coin.upbitBinancePremium.toFixed(2)}%`
                  : '-'}
              </span>
            </div>

            {/* Bithumb vs Binance */}
            <div className="p-3 bg-white rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block text-[11px] font-medium mb-1">
                빗썸 vs 바이낸스 김프
              </span>
              <span
                className={`text-lg font-black tabular-nums ${
                  (coin.bithumbBinancePremium ?? 0) >= 0 ? 'text-rose-600' : 'text-blue-600'
                }`}
              >
                {coin.bithumbBinancePremium !== null
                  ? `${(coin.bithumbBinancePremium ?? 0) >= 0 ? '+' : ''}${coin.bithumbBinancePremium.toFixed(2)}%`
                  : '-'}
              </span>
            </div>

            {/* Upbit vs Bithumb */}
            <div className="p-3 bg-white rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block text-[11px] font-medium mb-1">
                업비트 vs 빗썸 가격차
              </span>
              <span
                className={`text-lg font-black tabular-nums ${
                  (coin.upbitBithumbGap ?? 0) >= 0 ? 'text-rose-600' : 'text-blue-600'
                }`}
              >
                {coin.upbitBithumbGap !== null
                  ? `${(coin.upbitBithumbGap ?? 0) >= 0 ? '+' : ''}${coin.upbitBithumbGap.toFixed(2)}%`
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
