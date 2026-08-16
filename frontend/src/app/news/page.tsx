'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { LiveMarquee } from '@/components/LiveMarquee';
import { FearGreedResponse, FastNewsItem, WhaleAlertItem } from '@/types';
import {
  Newspaper,
  Flame,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Share2,
  Check,
  Tag,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function NewsAndWhalePage() {
  const [fearGreed, setFearGreed] = useState<FearGreedResponse | null>(null);
  const [newsList, setNewsList] = useState<FastNewsItem[]>([]);
  const [whaleList, setWhaleList] = useState<WhaleAlertItem[]>([]);
  const [activeNewsCategory, setActiveNewsCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      try {
        const [fgRes, newsRes, whaleRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/insights/fear-greed`),
          fetch(`${API_BASE_URL}/api/insights/news`),
          fetch(`${API_BASE_URL}/api/insights/whale-alerts`),
        ]);

        if (fgRes.ok) setFearGreed(await fgRes.json());
        if (newsRes.ok) setNewsList(await newsRes.json());
        if (whaleRes.ok) setWhaleList(await whaleRes.json());
      } catch (err) {
        console.error('인사이트 로드 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, []);

  const handleCopyLink = (id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredNews = newsList.filter((item) => {
    if (activeNewsCategory === 'ALL') return true;
    return item.category === activeNewsCategory;
  });

  const getNewsBadge = (cat: string) => {
    switch (cat) {
      case 'BREAKING':
        return 'bg-rose-500 text-white font-black';
      case 'GOOD':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      case 'BAD':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
      case 'NOTICE':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 font-medium';
    }
  };

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const formatMoneyKrw = (val: number) => {
    const eok = Math.floor(val / 100_000_000);
    return `${eok.toLocaleString()}억원`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased">
      <Navbar />
      <LiveMarquee />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Top Fear & Greed Dashboard Hero */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Fear Greed Status Box */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-2xs shrink-0">
                <Flame className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400">CRYPTO FEAR & GREED INDEX</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200">
                    LIVE
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                    {fearGreed?.current.value ?? 65}점
                  </span>
                  <span className="text-base font-extrabold text-emerald-600">
                    {fearGreed?.current.classificationKr ?? '탐욕 (Greed)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  시장 매수 심리가 활발한 구간입니다. 급격한 단기 과열에 유의하세요.
                </p>
              </div>
            </div>

            {/* Fear Greed Progress Bar */}
            <div className="w-full lg:w-96 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                <span className="text-blue-600">0 극단적 공포</span>
                <span className="text-slate-400">50 중립</span>
                <span className="text-rose-600">100 극단적 탐욕</span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-amber-500 to-rose-500 transition-all duration-500"
                  style={{ width: `${fearGreed?.current.value ?? 65}%` }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* 2-Column Layout: Fast News (Left 2/3) & Whale Alerts (Right 1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Fast News Feed */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* News Header & Category Filters */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-black text-slate-900">24시 실시간 크립토 속보</h2>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto p-0.5 bg-slate-100 rounded-xl">
                {[
                  { key: 'ALL', label: '전체' },
                  { key: 'BREAKING', label: '긴급 🚨' },
                  { key: 'GOOD', label: '호재 🚀' },
                  { key: 'BAD', label: '악재 ⚠️' },
                  { key: 'NOTICE', label: '공시 📢' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveNewsCategory(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      activeNewsCategory === tab.key
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* News Cards List */}
            <div className="space-y-3">
              {filteredNews.map((news) => (
                <div
                  key={news.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-200 transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] ${getNewsBadge(news.category)}`}>
                        {news.categoryKr}
                      </span>
                      {news.targetSymbol && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-200">
                          #{news.targetSymbol}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">{news.source}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-[11px] font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(news.publishedAt)}
                      </span>
                      <button
                        onClick={() => handleCopyLink(news.id)}
                        className="p-1 hover:text-slate-700 transition"
                        title="기사 공유"
                      >
                        {copiedId === news.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Share2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug mb-2">
                    {news.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {news.summary}
                  </p>
                </div>
              ))}
            </div>

          </div>

          {/* Right 1 Col: On-Chain Whale Alerts */}
          <div className="space-y-4">
            
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-purple-600" />
                <h2 className="text-base font-black text-slate-900">온체인 고래 이동 레이더</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                100억+ 대형 이체
              </span>
            </div>

            {/* Whale Alert Cards */}
            <div className="space-y-3">
              {whaleList.map((whale) => {
                const isInflow = whale.transferType === 'INFLOW';
                return (
                  <div
                    key={whale.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 font-black text-xs flex items-center justify-center border border-purple-200">
                          {whale.symbol}
                        </span>
                        <span className="font-black text-xs text-slate-900">
                          {whale.amount.toLocaleString()} {whale.symbol}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          isInflow
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}
                      >
                        {isInflow ? '거래소 유입 (매도주의)' : '지갑 출금 (매집신호)'}
                      </span>
                    </div>

                    <div className="text-right mb-2">
                      <span className="text-xs font-black text-slate-800 tabular-nums">
                        약 {formatMoneyKrw(whale.valueKrw)}
                      </span>
                    </div>

                    {/* From / To Trace */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="truncate max-w-[120px] font-medium">{whale.fromAddress}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[120px] font-bold text-slate-800">{whale.toAddress}</span>
                    </div>

                    <div className="text-right mt-2 text-[10px] text-slate-400 font-medium flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(whale.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
