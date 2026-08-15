'use client';

import React, { useState, useMemo } from 'react';
import {
  TripleArbitrage,
  ExchangeMode,
  SortField,
  SortOrder,
} from '../types/crypto';
import {
  Search,
  ArrowUpDown,
  Zap,
  Percent,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ArbitrageTableProps {
  items: TripleArbitrage[];
  exchangeRate: number;
  onSelectCoin: (coin: TripleArbitrage) => void;
  priceFlashMap: Record<string, 'up' | 'down' | undefined>;
}

export const ArbitrageTable: React.FC<ArbitrageTableProps> = ({
  items,
  exchangeRate,
  onSelectCoin,
  priceFlashMap,
}) => {
  const [exchangeMode, setExchangeMode] = useState<ExchangeMode>('UPBIT_BINANCE');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFundingRate, setShowFundingRate] = useState(false);

  // 거래대금 억원 단위 포맷팅
  const formatTradeValueKRW = (val: number | null | undefined) => {
    if (!val || val <= 0) return '-';
    const eok = Math.floor(val / 100_000_000);
    if (eok >= 10_000) {
      const jo = (eok / 10_000).toFixed(1);
      return `${jo}조`;
    }
    return `${eok.toLocaleString()}억`;
  };

  // 금액 포맷팅
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 필터링 및 정렬 처리
  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        item.symbol.toLowerCase().includes(q) ||
        (item.nameKr && item.nameKr.toLowerCase().includes(q))
      );
    });

    result.sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      switch (sortField) {
        case 'premium':
          if (exchangeMode === 'UPBIT_BINANCE') {
            valA = a.upbitBinancePremium ?? -999;
            valB = b.upbitBinancePremium ?? -999;
          } else if (exchangeMode === 'BITHUMB_BINANCE') {
            valA = a.bithumbBinancePremium ?? -999;
            valB = b.bithumbBinancePremium ?? -999;
          } else {
            valA = a.upbitBithumbGap ?? -999;
            valB = b.upbitBithumbGap ?? -999;
          }
          break;
        case 'price':
          if (exchangeMode === 'BITHUMB_BINANCE') {
            valA = a.bithumbPrice ?? 0;
            valB = b.bithumbPrice ?? 0;
          } else {
            valA = a.upbitPrice ?? 0;
            valB = b.upbitPrice ?? 0;
          }
          break;
        case 'change':
          if (exchangeMode === 'BITHUMB_BINANCE') {
            valA = a.bithumbChangeRate ?? 0;
            valB = b.bithumbChangeRate ?? 0;
          } else {
            valA = a.upbitChangeRate ?? 0;
            valB = b.upbitChangeRate ?? 0;
          }
          break;
        case 'volume':
          valA = (a.upbitTradeValue ?? 0) + (a.bithumbTradeValue ?? 0);
          valB = (b.upbitTradeValue ?? 0) + (b.bithumbTradeValue ?? 0);
          break;
        case 'symbol':
          return sortOrder === 'asc'
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [items, searchQuery, sortField, sortOrder, exchangeMode]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      
      {/* Top Filter & Exchange Tabs Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Exchange Mode Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 shrink-0">
            <button
              onClick={() => setExchangeMode('UPBIT_BINANCE')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                exchangeMode === 'UPBIT_BINANCE'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              업비트 vs 바이낸스
            </button>
            <button
              onClick={() => setExchangeMode('BITHUMB_BINANCE')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                exchangeMode === 'BITHUMB_BINANCE'
                  ? 'bg-white text-orange-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              빗썸 vs 바이낸스
            </button>
            <button
              onClick={() => setExchangeMode('UPBIT_BITHUMB')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                exchangeMode === 'UPBIT_BITHUMB'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              업비트 vs 빗썸 (국내)
            </button>
          </div>

          {/* Funding Rate Toggle Switch */}
          <button
            onClick={() => setShowFundingRate(!showFundingRate)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition border whitespace-nowrap ${
              showFundingRate
                ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-2xs'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-purple-600" />
            <span>선물 펀딩비 {showFundingRate ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Search & Stats count */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="코인명 / 심볼 검색 (BTC, 리플...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap hidden sm:inline">
            총 {filteredAndSortedItems.length}개 종목
          </span>
        </div>

      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-bold tracking-wider">
              
              {/* Symbol / Name */}
              <th
                onClick={() => handleSort('symbol')}
                className="py-3.5 px-4 sm:px-6 cursor-pointer hover:text-slate-900 transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>코인명</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              {/* Primary Exchange Price */}
              <th
                onClick={() => handleSort('price')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>
                    {exchangeMode === 'BITHUMB_BINANCE' ? '빗썸 현재가' : '업비트 현재가'}
                  </span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              {/* 24h Change */}
              <th
                onClick={() => handleSort('change')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>전일대비</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              {/* Secondary Exchange Price */}
              <th className="py-3.5 px-4 text-right">
                {exchangeMode === 'UPBIT_BITHUMB' ? '빗썸 가격' : '바이낸스 가격 (USD / KRW)'}
              </th>

              {/* Arbitrage Rate */}
              <th
                onClick={() => handleSort('premium')}
                className="py-3.5 px-4 sm:px-6 cursor-pointer hover:text-slate-900 transition select-none text-right min-w-[140px]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>
                    {exchangeMode === 'UPBIT_BITHUMB' ? '가격 격차율' : '김치 프리미엄'}
                  </span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              {/* Optional: Binance Futures Funding Rate Column */}
              {showFundingRate && (
                <th className="py-3.5 px-4 text-right min-w-[120px] bg-purple-50/40 text-purple-900">
                  <span>바이낸스 펀딩비 (8h / 연)</span>
                </th>
              )}

              {/* 24h Volume */}
              <th
                onClick={() => handleSort('volume')}
                className="py-3.5 px-4 sm:px-6 cursor-pointer hover:text-slate-900 transition select-none text-right hidden sm:table-cell"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>24시간 거래대금</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredAndSortedItems.length === 0 ? (
              <tr>
                <td colSpan={showFundingRate ? 7 : 6} className="py-12 text-center text-slate-400 font-medium">
                  검색된 코인 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              filteredAndSortedItems.map((item) => {
                const flash = priceFlashMap[item.symbol];

                // Exchange Mode Calculation
                let primaryPrice: number | null = null;
                let primaryChange: number | null = null;
                let secondaryPriceNode: React.ReactNode = null;
                let premium: number | null = null;

                if (exchangeMode === 'UPBIT_BINANCE') {
                  primaryPrice = item.upbitPrice;
                  primaryChange = item.upbitChangeRate;
                  premium = item.upbitBinancePremium;
                  secondaryPriceNode = (
                    <div className="text-right">
                      <span className="font-bold text-slate-800 tabular-nums block">
                        {formatKRW(item.binancePriceKrw)}
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums block">
                        {formatUSD(item.binancePriceUsd)}
                      </span>
                    </div>
                  );
                } else if (exchangeMode === 'BITHUMB_BINANCE') {
                  primaryPrice = item.bithumbPrice;
                  primaryChange = item.bithumbChangeRate;
                  premium = item.bithumbBinancePremium;
                  secondaryPriceNode = (
                    <div className="text-right">
                      <span className="font-bold text-slate-800 tabular-nums block">
                        {formatKRW(item.binancePriceKrw)}
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums block">
                        {formatUSD(item.binancePriceUsd)}
                      </span>
                    </div>
                  );
                } else {
                  // UPBIT_BITHUMB
                  primaryPrice = item.upbitPrice;
                  primaryChange = item.upbitChangeRate;
                  premium = item.upbitBithumbGap;
                  secondaryPriceNode = (
                    <div className="text-right">
                      <span className="font-bold text-slate-800 tabular-nums block">
                        {formatKRW(item.bithumbPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums block">
                        {item.bithumbChangeRate !== null
                          ? `${item.bithumbChangeRate >= 0 ? '+' : ''}${item.bithumbChangeRate.toFixed(2)}%`
                          : '-'}
                      </span>
                    </div>
                  );
                }

                const isPremiumPositive = (premium ?? 0) >= 0;
                const isChangePositive = (primaryChange ?? 0) >= 0;
                const totalVolume = (item.upbitTradeValue ?? 0) + (item.bithumbTradeValue ?? 0);

                return (
                  <tr
                    key={item.symbol}
                    onClick={() => onSelectCoin(item)}
                    className={`hover:bg-slate-50/80 transition duration-150 cursor-pointer ${
                      flash === 'up'
                        ? 'animate-flash-up'
                        : flash === 'down'
                        ? 'animate-flash-down'
                        : ''
                    }`}
                  >
                    {/* Symbol / Korean Name */}
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-[10px]">
                          {item.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs leading-tight">
                              {item.symbol}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" title="입출금 정상" />
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium block leading-tight">
                            {item.nameKr}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Primary Price */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-extrabold text-slate-900 text-xs tabular-nums">
                        {formatKRW(primaryPrice)}
                      </span>
                    </td>

                    {/* 24h Change */}
                    <td className="py-3 px-4 text-right">
                      {primaryChange !== null && primaryChange !== undefined ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-bold text-[11px] tabular-nums ${
                            isChangePositive
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {isChangePositive ? '+' : ''}
                          {primaryChange.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Secondary Price */}
                    <td className="py-3 px-4 text-right">{secondaryPriceNode}</td>

                    {/* Arbitrage Premium */}
                    <td className="py-3 px-4 sm:px-6 text-right">
                      {premium !== null && premium !== undefined ? (
                        <div className="inline-flex flex-col items-end">
                          <span
                            className={`font-black text-xs tabular-nums px-2.5 py-0.5 rounded-lg border ${
                              isPremiumPositive
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : 'bg-blue-50 text-blue-600 border-blue-200'
                            }`}
                          >
                            {isPremiumPositive ? '+' : ''}
                            {premium.toFixed(2)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>

                    {/* Optional Funding Rate Column */}
                    {showFundingRate && (
                      <td className="py-3 px-4 text-right bg-purple-50/20">
                        {item.fundingRatePercent !== null && item.fundingRatePercent !== undefined ? (
                          <div>
                            <span
                              className={`font-extrabold text-xs tabular-nums block ${
                                item.fundingRatePercent >= 0 ? 'text-rose-600' : 'text-blue-600'
                              }`}
                            >
                              {item.fundingRatePercent >= 0 ? '+' : ''}
                              {item.fundingRatePercent.toFixed(4)}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold tabular-nums block">
                              연 {item.fundingApr ? `${item.fundingApr.toFixed(1)}%` : '-'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    )}

                    {/* 24h Volume */}
                    <td className="py-3 px-4 sm:px-6 text-right hidden sm:table-cell">
                      <span className="font-semibold text-slate-600 text-xs tabular-nums">
                        {formatTradeValueKRW(totalVolume)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
