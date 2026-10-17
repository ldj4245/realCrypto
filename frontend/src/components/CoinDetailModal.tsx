'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TripleArbitrage } from '../types/crypto';
import { usePreference } from '@/context/PreferenceContext';
import {
  X,
  Scale,
  Star,
  Bell,
  BarChart2,
  Newspaper,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface CoinDetailModalProps {
  coin: TripleArbitrage | null;
  onClose: () => void;
  exchangeRate: number;
}

interface ModalNewsItem {
  id: string;
  categoryKr: string;
  title: string;
  source: string;
  publishedAt: string;
}

interface ModalPostItem {
  id: number;
  title: string;
  authorNickname: string;
  position: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export const CoinDetailModal: React.FC<CoinDetailModalProps> = ({
  coin,
  onClose,
  exchangeRate,
}) => {
  const { isFavorite, toggleFavorite, addAlert } = usePreference();
  const [activeTab, setActiveTab] = useState<'CHART' | 'FEED'>('CHART');
  const [chartExchange, setChartExchange] = useState<'BINANCE' | 'UPBIT'>('BINANCE');
  const [chartInterval, setChartInterval] = useState<'15' | '60' | '240' | 'D'>('15');

  const [targetPremInput, setTargetPremInput] = useState<string>('');
  const [alertDir, setAlertDir] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [alertSavedMsg, setAlertSavedMsg] = useState<string | null>(null);

  const [newsList, setNewsList] = useState<ModalNewsItem[]>([]);
  const [postList, setPostList] = useState<ModalPostItem[]>([]);
  const [feedLoading, setFeedLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!coin) return;
    const basePrem = coin.upbitBinancePremium ?? 2.0;
    setTargetPremInput((Math.round((basePrem + 0.5) * 10) / 10).toFixed(1));
    setAlertSavedMsg(null);
  }, [coin?.symbol]);

  useEffect(() => {
    if (!coin || activeTab !== 'FEED') return;
    let cancelled = false;

    const loadSymbolFeed = async () => {
      setFeedLoading(true);
      try {
        const [newsRes, postsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/insights/news?symbol=${encodeURIComponent(coin.symbol)}`),
          fetch(`${API_BASE_URL}/api/posts?symbol=${encodeURIComponent(coin.symbol)}&size=5`),
        ]);

        if (!cancelled && newsRes.ok) {
          const nData = await newsRes.json();
          setNewsList(Array.isArray(nData) ? nData.slice(0, 5) : []);
        }
        if (!cancelled && postsRes.ok) {
          const pData = await postsRes.json();
          setPostList(pData && Array.isArray(pData.content) ? pData.content : []);
        }
      } catch (e) {
        console.error('종목 피드 조회 실패:', e);
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    };

    loadSymbolFeed();
    return () => {
      cancelled = true;
    };
  }, [coin?.symbol, activeTab]);

  if (!coin) return null;

  const favorited = isFavorite(coin.symbol);

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

  const tvSymbol =
    chartExchange === 'BINANCE'
      ? `BINANCE:${coin.symbol.toUpperCase()}USDT`
      : `UPBIT:${coin.symbol.toUpperCase()}KRW`;

  const tvIframeUrl = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
    tvSymbol
  )}&interval=${chartInterval}&theme=light&style=1&locale=kr&toolbar_bg=f8fafc&enable_publishing=false&hide_top_toolbar=true&hide_legend=false&save_image=false`;

  const handleQuickAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(targetPremInput);
    if (isNaN(parsed)) return;
    await addAlert(coin.symbol, parsed, alertDir);
    setAlertSavedMsg(`${coin.symbol} 김프 ${parsed}% ${alertDir === 'ABOVE' ? '이상' : '이하'} 알림이 등록되었습니다.`);
    setTimeout(() => setAlertSavedMsg(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 relative">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-800 font-black text-base flex items-center justify-center border border-slate-200/80">
              {coin.symbol.slice(0, 4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">{coin.symbol}</h2>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                  {coin.nameKr}
                </span>
                <button
                  type="button"
                  onClick={() => toggleFavorite(coin.symbol)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold transition ${
                    favorited
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Star className={`h-3 w-3 ${favorited ? 'fill-amber-400 text-amber-500' : ''}`} />
                  <span>{favorited ? '관심종목' : '관심추가'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                업비트 · 빗썸 · 바이낸스 실시간 교차 시세 및 차트
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setActiveTab('CHART')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'CHART'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                <span>실시간 차트 & 시세</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('FEED')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'FEED'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>종목 뉴스 & 의견</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
              title="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {activeTab === 'CHART' ? (
          <>
            {/* 3 Exchange Price Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {/* Upbit */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-700">
                    업비트 (KRW)
                  </span>
                  {coin.upbitChangeRate !== null && (
                    <span
                      className={`text-[11px] font-bold tabular-nums ${
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
                <span className="text-[10px] text-slate-400 block mt-0.5 tabular-nums">
                  24h 거래대금: {formatTradeValueKRW(coin.upbitTradeValue)}
                </span>
              </div>

              {/* Bithumb */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-100 text-orange-700">
                    빗썸 (KRW)
                  </span>
                  {coin.bithumbChangeRate !== null && (
                    <span
                      className={`text-[11px] font-bold tabular-nums ${
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
                <span className="text-[10px] text-slate-400 block mt-0.5 tabular-nums">
                  24h 거래대금: {formatTradeValueKRW(coin.bithumbTradeValue)}
                </span>
              </div>

              {/* Binance */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800">
                    바이낸스 (USDT)
                  </span>
                  {coin.binanceChangeRate !== null && (
                    <span
                      className={`text-[11px] font-bold tabular-nums ${
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
                <span className="text-[10px] text-slate-400 block mt-0.5 tabular-nums">
                  {formatUSD(coin.binancePriceUsd)} · 적용환율 {exchangeRate}원
                </span>
              </div>
            </div>

            {/* TradingView Chart Embed Section */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden mb-5 bg-white">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setChartExchange('BINANCE')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                      chartExchange === 'BINANCE'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    바이낸스 ({coin.symbol}/USDT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartExchange('UPBIT')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                      chartExchange === 'UPBIT'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    업비트 ({coin.symbol}/KRW)
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold">
                  {[
                    { id: '15', label: '15분' },
                    { id: '60', label: '1시간' },
                    { id: '240', label: '4시간' },
                    { id: 'D', label: '1일' },
                  ].map((tf) => (
                    <button
                      key={tf.id}
                      type="button"
                      onClick={() => setChartInterval(tf.id as '15' | '60' | '240' | 'D')}
                      className={`px-2 py-1 rounded-md transition ${
                        chartInterval === tf.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[340px] w-full bg-slate-50">
                <iframe
                  key={`${tvSymbol}-${chartInterval}`}
                  src={tvIframeUrl}
                  title={`${coin.symbol} 실시간 캔들 차트`}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Arbitrage Summary + Quick Alert Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Arbitrage Gap Card */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
                <div className="flex items-center gap-1.5 mb-3">
                  <Scale className="h-3.5 w-3.5 text-blue-600" />
                  <h3 className="text-xs font-extrabold text-slate-800">거래소 간 프리미엄 격차</h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 block text-[10px] font-medium mb-0.5">업비트 김프</span>
                    <span
                      className={`text-sm font-black tabular-nums ${
                        (coin.upbitBinancePremium ?? 0) >= 0 ? 'text-rose-600' : 'text-blue-600'
                      }`}
                    >
                      {coin.upbitBinancePremium !== null
                        ? `${(coin.upbitBinancePremium ?? 0) >= 0 ? '+' : ''}${coin.upbitBinancePremium.toFixed(2)}%`
                        : '-'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 block text-[10px] font-medium mb-0.5">빗썸 김프</span>
                    <span
                      className={`text-sm font-black tabular-nums ${
                        (coin.bithumbBinancePremium ?? 0) >= 0 ? 'text-rose-600' : 'text-blue-600'
                      }`}
                    >
                      {coin.bithumbBinancePremium !== null
                        ? `${(coin.bithumbBinancePremium ?? 0) >= 0 ? '+' : ''}${coin.bithumbBinancePremium.toFixed(2)}%`
                        : '-'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 block text-[10px] font-medium mb-0.5">국내 거래소 갭</span>
                    <span
                      className={`text-sm font-black tabular-nums ${
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

              {/* Quick Alert Registration Card */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-slate-700" />
                    <h3 className="text-xs font-extrabold text-slate-800">
                      {coin.symbol} 목표 김프 빠른 알림
                    </h3>
                  </div>
                  {coin.fundingRatePercent !== null && coin.fundingRatePercent !== undefined && (
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 tabular-nums">
                      펀딩비 {coin.fundingRatePercent >= 0 ? '+' : ''}
                      {coin.fundingRatePercent.toFixed(4)}%
                    </span>
                  )}
                </div>

                <form onSubmit={handleQuickAlertSubmit} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.1"
                      value={targetPremInput}
                      onChange={(e) => setTargetPremInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 tabular-nums focus:outline-none focus:border-blue-500"
                      placeholder="목표 김프 %"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                      %
                    </span>
                  </div>
                  <select
                    value={alertDir}
                    onChange={(e) => setAlertDir(e.target.value as 'ABOVE' | 'BELOW')}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ABOVE">이상 도달</option>
                    <option value="BELOW">이하 도달</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold whitespace-nowrap transition"
                  >
                    알림 등록
                  </button>
                </form>

                {alertSavedMsg && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1.5">{alertSavedMsg}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          /* FEED TAB: Symbol News & Community Posts */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Related News */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Newspaper className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs font-extrabold text-slate-900">
                    {coin.symbol} 관련 속보 및 시장 뉴스
                  </h3>
                </div>
                <Link
                  href="/news"
                  onClick={onClose}
                  className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-0.5"
                >
                  <span>전체 뉴스</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {feedLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">불러오는 중...</div>
              ) : newsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  현재 {coin.symbol} 키워드로 분류된 최근 속보가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-slate-200/70">
                  {newsList.map((n) => (
                    <div key={n.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                          {n.categoryKr || '속보'}
                        </span>
                        <span className="text-[10px] text-slate-400">{n.source}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                        {n.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Community Posts */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-xs font-extrabold text-slate-900">
                      #{coin.symbol} 커뮤니티 최신 글
                    </h3>
                  </div>
                  <Link
                    href={`/community?symbol=${encodeURIComponent(coin.symbol)}`}
                    onClick={onClose}
                    className="text-[11px] text-indigo-600 hover:underline font-bold flex items-center gap-0.5"
                  >
                    <span>더보기</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                {feedLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">불러오는 중...</div>
                ) : postList.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    아직 #{coin.symbol} 태그로 작성된 게시글이 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200/70">
                    {postList.map((p) => (
                      <Link
                        key={p.id}
                        href={`/community/${p.id}`}
                        onClick={onClose}
                        className="py-2.5 first:pt-0 last:pb-0 block hover:bg-white/80 rounded-lg px-1.5 -mx-1.5 transition"
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {p.title}
                          </span>
                          {p.commentCount > 0 && (
                            <span className="text-[11px] font-extrabold text-blue-600 shrink-0">
                              [{p.commentCount}]
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{p.authorNickname}</span>
                          <span>·</span>
                          <span>추천 {p.likeCount}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/70 flex justify-end">
                <Link
                  href={`/community/write?symbol=${encodeURIComponent(coin.symbol)}`}
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                >
                  #{coin.symbol} 종목 글쓰기
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
