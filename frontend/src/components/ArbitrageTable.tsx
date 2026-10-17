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
  Star,
  MessageSquare,
} from 'lucide-react';
import { usePreference } from '@/context/PreferenceContext';

interface ArbitrageTableProps {
  items: TripleArbitrage[];
  exchangeRate: number;
  selectedSymbol?: string;
  onSelectCoin: (coin: TripleArbitrage) => void;
  onOpenDetailModal?: (coin: TripleArbitrage) => void;
  priceFlashMap: Record<string, 'up' | 'down' | undefined>;
}

export const ArbitrageTable: React.FC<ArbitrageTableProps> = ({
  items,
  selectedSymbol,
  onSelectCoin,
  onOpenDetailModal,
  priceFlashMap,
}) => {
  const { favorites, isFavorite, toggleFavorite } = usePreference();
  const [exchangeMode, setExchangeMode] = useState<ExchangeMode>('UPBIT_BINANCE');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFundingRate, setShowFundingRate] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const formatTradeValueKRW = (val: number | null | undefined) => {
    if (!val || val <= 0) return '-';
    const eok = Math.floor(val / 100_000_000);
    if (eok >= 10_000) {
      const jo = (eok / 10_000).toFixed(1);
      return `${jo}조`;
    }
    return `${eok.toLocaleString('ko-KR')}억`;
  };

  const formatKRW = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-';
    if (num >= 100) {
      return Math.round(num).toLocaleString('ko-KR');
    }
    return num.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const formatDiffKRW = (diff: number | null | undefined) => {
    if (diff === null || diff === undefined) return '';
    const sign = diff > 0 ? '+' : '';
    if (Math.abs(diff) >= 100) {
      return `${sign}${Math.round(diff).toLocaleString('ko-KR')}원`;
    }
    return `${sign}${diff.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}원`;
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

  const filteredAndSortedItems = useMemo(() => {
    const result = items.filter((item) => {
      if (showFavoritesOnly && !favorites.includes(item.symbol.toUpperCase())) {
        return false;
      }
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        item.symbol.toLowerCase().includes(q) ||
        (item.nameKr && item.nameKr.toLowerCase().includes(q))
      );
    });

    result.sort((a, b) => {
      const favA = favorites.includes(a.symbol.toUpperCase());
      const favB = favorites.includes(b.symbol.toUpperCase());
      if (favA !== favB) {
        return favA ? -1 : 1;
      }

      let valA = 0;
      let valB = 0;

      switch (sortField) {
        case 'premium': {
          const normalA = a.isWalletNormal !== false;
          const normalB = b.isWalletNormal !== false;
          if (normalA !== normalB) {
            return normalA ? -1 : 1;
          }
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
        }
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
  }, [items, searchQuery, sortField, sortOrder, exchangeMode, showFavoritesOnly, favorites]);

  return (
    <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
      
      {/* Top Control & Filter Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Left: Exchange Mode Selector & Toggle Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center border border-slate-300 rounded-xs bg-white overflow-hidden shrink-0 text-xs font-bold">
            <button
              type="button"
              onClick={() => setExchangeMode('UPBIT_BINANCE')}
              className={`px-3 py-1.5 transition ${
                exchangeMode === 'UPBIT_BINANCE'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              업비트 · 바이낸스
            </button>
            <button
              type="button"
              onClick={() => setExchangeMode('BITHUMB_BINANCE')}
              className={`px-3 py-1.5 border-l border-slate-300 transition ${
                exchangeMode === 'BITHUMB_BINANCE'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              빗썸 · 바이낸스
            </button>
            <button
              type="button"
              onClick={() => setExchangeMode('UPBIT_BITHUMB')}
              className={`px-3 py-1.5 border-l border-slate-300 transition ${
                exchangeMode === 'UPBIT_BITHUMB'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              업비트 · 빗썸
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xs text-xs font-bold border transition whitespace-nowrap ${
              showFavoritesOnly
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Star className={`h-3 w-3 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
            <span>관심 ({favorites.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFundingRate(!showFundingRate)}
            className={`px-2.5 py-1.5 rounded-xs text-xs font-bold border transition whitespace-nowrap ${
              showFundingRate
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            펀딩비 {showFundingRate ? '표시' : '숨김'}
          </button>
        </div>

        {/* Right: Search Input & Count */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="종목명 또는 심볼 검색 (BTC, 리플)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xs pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition"
            />
          </div>
          <span className="text-[11px] text-slate-500 font-bold tabular-nums whitespace-nowrap hidden sm:inline">
            {filteredAndSortedItems.length}종목
          </span>
        </div>

      </div>

      {/* High-Density Arbitrage Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
              <th
                onClick={() => handleSort('symbol')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>종목명</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('price')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 transition select-none text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>
                    {exchangeMode === 'BITHUMB_BINANCE' ? '빗썸 현재가(원)' : '업비트 현재가(원)'}
                  </span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th className="py-2.5 px-3 text-right">
                {exchangeMode === 'UPBIT_BITHUMB' ? '빗썸 현재가(원)' : '바이낸스 (원화환산 / USD)'}
              </th>

              <th
                onClick={() => handleSort('change')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 transition select-none text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>전일대비</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('premium')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 transition select-none text-right min-w-[130px]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>{exchangeMode === 'UPBIT_BITHUMB' ? '국내 격차 (차액)' : '김프 (차액)'}</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              {showFundingRate && (
                <th className="py-2.5 px-3 text-right hidden lg:table-cell">
                  <span>펀딩비(8h)</span>
                </th>
              )}

              <th
                onClick={() => handleSort('volume')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 transition select-none text-right hidden sm:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>거래대금(24h)</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/70">
            {filteredAndSortedItems.length === 0 ? (
              <tr>
                <td colSpan={showFundingRate ? 7 : 6} className="py-12 text-center text-slate-400 font-medium">
                  조건에 일치하는 종목이 없습니다.
                </td>
              </tr>
            ) : (
              filteredAndSortedItems.map((item) => {
                const flash = priceFlashMap[item.symbol];
                const isSelected = selectedSymbol === item.symbol;

                let primaryPrice: number | null = null;
                let primaryChange: number | null = null;
                let secondaryPriceNode: React.ReactNode = null;
                let premium: number | null = null;
                let diffKrw: number | null = null;

                if (exchangeMode === 'UPBIT_BINANCE') {
                  primaryPrice = item.upbitPrice;
                  primaryChange = item.upbitChangeRate;
                  premium = item.upbitBinancePremium;
                  diffKrw =
                    item.upbitPrice && item.binancePriceKrw
                      ? item.upbitPrice - item.binancePriceKrw
                      : null;
                  secondaryPriceNode = (
                    <div className="text-right tabular-nums">
                      <span className="font-semibold text-slate-800 block leading-tight">
                        {formatKRW(item.binancePriceKrw)}
                      </span>
                      <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                        {formatUSD(item.binancePriceUsd)}
                      </span>
                    </div>
                  );
                } else if (exchangeMode === 'BITHUMB_BINANCE') {
                  primaryPrice = item.bithumbPrice;
                  primaryChange = item.bithumbChangeRate;
                  premium = item.bithumbBinancePremium;
                  diffKrw =
                    item.bithumbPrice && item.binancePriceKrw
                      ? item.bithumbPrice - item.binancePriceKrw
                      : null;
                  secondaryPriceNode = (
                    <div className="text-right tabular-nums">
                      <span className="font-semibold text-slate-800 block leading-tight">
                        {formatKRW(item.binancePriceKrw)}
                      </span>
                      <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                        {formatUSD(item.binancePriceUsd)}
                      </span>
                    </div>
                  );
                } else {
                  primaryPrice = item.upbitPrice;
                  primaryChange = item.upbitChangeRate;
                  premium = item.upbitBithumbGap;
                  diffKrw =
                    item.upbitPrice && item.bithumbPrice
                      ? item.upbitPrice - item.bithumbPrice
                      : null;
                  secondaryPriceNode = (
                    <div className="text-right tabular-nums">
                      <span className="font-semibold text-slate-800 block leading-tight">
                        {formatKRW(item.bithumbPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
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
                const favorited = isFavorite(item.symbol);

                return (
                  <tr
                    key={item.symbol}
                    onClick={() => onSelectCoin(item)}
                    className={`transition duration-100 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/40'
                        : 'hover:bg-slate-50'
                    } ${
                      flash === 'up'
                        ? 'animate-flash-up'
                        : flash === 'down'
                        ? 'animate-flash-down'
                        : ''
                    }`}
                  >
                    {/* 1. Symbol & Korean Name */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.symbol);
                          }}
                          className="p-0.5 text-slate-300 hover:text-amber-500 transition"
                          title={favorited ? '관심종목 해제' : '관심종목 등록'}
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              favorited ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                            }`}
                          />
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs leading-tight">
                              {item.nameKr}
                            </span>
                            {item.isWalletNormal === false && (
                              <span
                                className="px-1 py-0.2 rounded-xs text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-300 leading-none"
                                title="거래소 간 심볼 불일치 또는 입출금 중단으로 인한 시세 괴리"
                              >
                                괴리주의
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-bold leading-tight">
                              {item.symbol}
                            </span>
                            {onOpenDetailModal && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenDetailModal(item);
                                }}
                                className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-0.5"
                                title="종목 뉴스 및 토론"
                              >
                                <MessageSquare className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Primary Price */}
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <span
                        className={`font-bold text-xs ${
                          primaryChange !== null && primaryChange > 0
                            ? 'text-red-600'
                            : primaryChange !== null && primaryChange < 0
                            ? 'text-blue-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {formatKRW(primaryPrice)}
                      </span>
                    </td>

                    {/* 3. Secondary Price */}
                    <td className="py-2.5 px-3 text-right">{secondaryPriceNode}</td>

                    {/* 4. 24h Change Rate */}
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {primaryChange !== null && primaryChange !== undefined ? (
                        <span
                          className={`font-bold text-xs ${
                            isChangePositive ? 'text-red-600' : 'text-blue-600'
                          }`}
                        >
                          {isChangePositive ? '+' : ''}
                          {primaryChange.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* 5. Kimchi Premium % + KRW Diff (Kimpga Signature Column) */}
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {premium !== null && premium !== undefined ? (
                        <div>
                          <span
                            className={`font-extrabold text-xs block leading-tight ${
                              isPremiumPositive ? 'text-red-600' : 'text-blue-600'
                            }`}
                          >
                            {isPremiumPositive ? '+' : ''}
                            {premium.toFixed(2)}%
                          </span>
                          {diffKrw !== null && (
                            <span className="text-[10px] text-slate-400 font-medium block leading-tight mt-0.5">
                              {formatDiffKRW(diffKrw)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* 6. Binance Futures Funding Rate */}
                    {showFundingRate && (
                      <td className="py-2.5 px-3 text-right tabular-nums hidden lg:table-cell">
                        {item.fundingRatePercent !== null && item.fundingRatePercent !== undefined ? (
                          <div>
                            <span
                              className={`font-bold text-[11px] block leading-tight ${
                                item.fundingRatePercent >= 0 ? 'text-red-600' : 'text-blue-600'
                              }`}
                            >
                              {item.fundingRatePercent >= 0 ? '+' : ''}
                              {item.fundingRatePercent.toFixed(4)}%
                            </span>
                            <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                              연 {item.fundingApr ? `${item.fundingApr.toFixed(1)}%` : '-'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    )}

                    {/* 7. 24h Trade Volume */}
                    <td className="py-2.5 px-3 text-right tabular-nums hidden sm:table-cell">
                      <span className="font-semibold text-slate-600 text-[11px]">
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
