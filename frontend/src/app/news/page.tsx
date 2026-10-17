'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { LiveMarquee } from '@/components/LiveMarquee';
import { FearGreedResponse, FastNewsItem, WhaleAlertItem } from '@/types';
import {
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function NewsAndWhalePage() {
  const [fearGreed, setFearGreed] = useState<FearGreedResponse | null>(null);
  const [newsList, setNewsList] = useState<FastNewsItem[]>([]);
  const [whaleList, setWhaleList] = useState<WhaleAlertItem[]>([]);
  const [activeNewsCategory, setActiveNewsCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadAll = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCopyText = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const filteredNews = newsList.filter((item) => {
    if (activeNewsCategory === 'ALL') return true;
    return item.category === activeNewsCategory;
  });

  const getNewsBadge = (cat: string) => {
    switch (cat) {
      case 'BREAKING':
        return 'bg-red-600 text-white border-red-600 font-bold';
      case 'GOOD':
        return 'bg-red-50 text-red-700 border-red-200 font-bold';
      case 'BAD':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 font-semibold';
    }
  };

  const getWhaleTypeBadge = (type: string) => {
    switch (type) {
      case 'MEGA':
        return { label: '초대형 이체 (10+ BTC)', cls: 'bg-red-50 text-red-700 border-red-200' };
      case 'LARGE':
        return { label: '대량 이체 (1+ BTC)', cls: 'bg-slate-900 text-white border-slate-900' };
      case 'MULTI':
        return { label: '다중 입출력 (배치)', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
      default:
        return { label: '온체인 전송', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const formatClock = (iso: string) => {
    if (!iso) return '--:--';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatRelativeTime = (iso: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
  };

  const formatMoneyKrw = (val: number) => {
    if (!val || val <= 0) return '-';
    const eok = val / 100_000_000;
    if (eok >= 1) {
      return `약 ${eok >= 10 ? Math.round(eok).toLocaleString('ko-KR') : eok.toFixed(2)}억원`;
    }
    const man = Math.round(val / 10_000);
    return `약 ${man.toLocaleString('ko-KR')}만원`;
  };

  const shortenAddr = (addr: string) => {
    if (!addr) return '-';
    if (addr.length <= 18) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col font-sans antialiased">
      <LiveMarquee />
      <Navbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-5 py-4">
        
        {/* Top Market Sentiment & Fear-Greed Strip */}
        <div className="bg-white rounded-md p-4 border border-slate-200 mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">
                ALTERNATIVE.ME 공포·탐욕 지수
              </span>
              <div className="flex items-baseline gap-2 mt-0.5 tabular-nums">
                <span className="text-2xl font-black text-slate-900">
                  {fearGreed?.current?.value ?? '-'}
                </span>
                <span
                  className={`text-sm font-extrabold ${
                    (fearGreed?.current?.value ?? 50) >= 55
                      ? 'text-red-600'
                      : (fearGreed?.current?.value ?? 50) <= 45
                      ? 'text-blue-600'
                      : 'text-slate-700'
                  }`}
                >
                  {fearGreed?.current?.classificationKr ?? '집계 중'}
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <p className="text-xs text-slate-600 max-w-xl">
              구글 뉴스(Google News RSS) 실시간 크립토 기사 원문과 비트코인 메인넷 미승인 멤풀(Blockchain.info / Mempool.space) 대형 UTXO 트랜잭션을 실시간으로 수집합니다.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-80">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1 tabular-nums">
                <span className="text-blue-600">0 공포</span>
                <span>50 중립</span>
                <span className="text-red-600">100 탐욕</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-xs overflow-hidden">
                <div
                  className="h-full bg-slate-900 transition-all duration-500"
                  style={{ width: `${fearGreed?.current?.value ?? 50}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={loadAll}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xs border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shrink-0 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              <span>새로고침</span>
            </button>
          </div>
        </div>

        {/* 12-Column Split Layout: Left 7 Cols News Timeline (CoinNess Style) & Right 5 Cols BTC Mempool Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Left 7 Columns: Real-Time Crypto News Timeline */}
          <section className="lg:col-span-7 bg-white rounded-md border border-slate-200 overflow-hidden">
            
            {/* Section Header & Category Filter */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h1 className="text-sm font-black text-slate-900">실시간 크립토 뉴스 타임라인</h1>
                <p className="text-[11px] text-slate-500">
                  클릭 시 각 언론사 원문 기사로 이동합니다
                </p>
              </div>

              <div className="flex items-center border border-slate-300 rounded-xs bg-white overflow-x-auto no-scrollbar max-w-full text-xs font-bold self-start sm:self-auto whitespace-nowrap">
                {[
                  { key: 'ALL', label: '전체' },
                  { key: 'BREAKING', label: '속보' },
                  { key: 'GOOD', label: '상승·호재' },
                  { key: 'BAD', label: '하락·규제' },
                  { key: 'NOTICE', label: '일반뉴스' },
                ].map((tab, idx) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveNewsCategory(tab.key)}
                    className={`px-2.5 py-1 transition whitespace-nowrap shrink-0 ${idx > 0 ? 'border-l border-slate-300' : ''} ${
                      activeNewsCategory === tab.key
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CoinNess-style Timestamped Feed */}
            <div className="divide-y divide-slate-200/70">
              {filteredNews.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  수집된 뉴스 데이터가 없습니다.
                </div>
              ) : (
                filteredNews.map((news) => (
                  <article
                    key={news.id}
                    className="p-3.5 hover:bg-slate-50/80 transition flex items-start gap-3.5"
                  >
                    {/* Left Timestamp Gutter */}
                    <div className="w-14 shrink-0 text-right tabular-nums pt-0.5">
                      <span className="text-xs font-extrabold text-slate-800 block leading-tight">
                        {formatClock(news.publishedAt)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        {formatRelativeTime(news.publishedAt)}
                      </span>
                    </div>

                    {/* Right Article Content */}
                    <div className="flex-1 min-w-0 border-l border-slate-200 pl-3.5">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span
                          className={`px-1.5 py-0.2 rounded-xs text-[10px] border ${getNewsBadge(
                            news.category
                          )}`}
                        >
                          {news.categoryKr}
                        </span>
                        {news.targetSymbol && (
                          <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-300">
                            {news.targetSymbol}
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-slate-500">
                          {news.source}
                        </span>
                      </div>

                      <a
                        href={news.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-start gap-1.5 text-left"
                      >
                        <h2 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 leading-snug transition">
                          {news.title}
                        </h2>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-700 shrink-0 mt-0.5" />
                      </a>

                      {news.summary && news.summary.trim().length > 0 && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {news.summary}
                        </p>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>

          </section>

          {/* Right 5 Columns: Live Bitcoin Mempool Large Transactions */}
          <section className="lg:col-span-5 bg-white rounded-md border border-slate-200 overflow-hidden">
            
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  비트코인(BTC) 온체인 실시간 대량 트랜잭션
                </h2>
                <p className="text-[11px] text-slate-500">
                  메인넷 멤풀(Unconfirmed TX) 상위 거래 · 클릭 시 mempool.space 검증
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-extrabold bg-slate-900 text-white shrink-0">
                MAINNET LIVE
              </span>
            </div>

            <div className="divide-y divide-slate-200/70">
              {whaleList.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  실시간 온체인 트랜잭션을 조회 중입니다...
                </div>
              ) : (
                whaleList.map((whale) => {
                  const hash = whale.txHash || whale.id;
                  const explorerUrl = `https://mempool.space/tx/${hash}`;
                  const badge = getWhaleTypeBadge(whale.transferType);

                  return (
                    <div key={whale.id} className="p-3.5 hover:bg-slate-50/60 transition text-xs">
                      {/* Row 1: Amount & Value */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 sm:gap-2 tabular-nums">
                          <span className="px-1.5 py-0.5 rounded-xs bg-slate-100 border border-slate-300 font-black text-[11px] text-slate-900">
                            {whale.symbol}
                          </span>
                          <span className="font-black text-sm text-slate-900">
                            {whale.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })} BTC
                          </span>
                          <span className="text-xs font-bold text-red-600">
                            ({formatMoneyKrw(whale.valueKrw)})
                          </span>
                        </div>

                        <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold border whitespace-nowrap ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Row 2: Real Bitcoin From -> To Addresses */}
                      <div className="bg-slate-50 p-2.5 rounded-xs border border-slate-200 mb-2">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                          <div className="min-w-0">
                            <span className="text-[10px] font-sans font-bold text-slate-400 block">
                              송신 주소 (입력 {whale.inputCount ?? 1}개)
                            </span>
                            <span
                              className="text-slate-700 font-semibold truncate block"
                              title={whale.fromAddress}
                            >
                              {shortenAddr(whale.fromAddress)}
                            </span>
                          </div>

                          <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />

                          <div className="min-w-0 text-right">
                            <span className="text-[10px] font-sans font-bold text-slate-400 block">
                              수신 주소 (출력 {whale.outputCount ?? 1}개)
                            </span>
                            <span
                              className="text-slate-900 font-bold truncate block"
                              title={whale.toAddress}
                            >
                              {shortenAddr(whale.toAddress)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Row 3: TX Hash, Fee, Time & Explorer Link */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-600">
                            TX: {shortenAddr(hash)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(hash, whale.id)}
                            className="p-0.5 text-slate-400 hover:text-slate-800 transition"
                            title="트랜잭션 해시 복사"
                          >
                            {copiedId === whale.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          {whale.feeSats !== undefined && whale.feeSats > 0 && (
                            <span className="text-[10px] text-slate-400">
                              수수료 {whale.feeSats.toLocaleString()} sats
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400">{formatClock(whale.timestamp)}</span>
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
                          >
                            <span>블록탐색기</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </section>

        </div>

      </main>
    </div>
  );
}
