'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { TripleArbitrage } from '@/types/crypto';
import { FastNewsItem, WhaleAlertItem } from '@/types';
import { PostListItem } from '@/types/community';
import { Navbar } from '@/components/Navbar';
import { LiveMarquee } from '@/components/LiveMarquee';
import { MajorCards } from '@/components/MajorCards';
import { ArbitrageTable } from '@/components/ArbitrageTable';
import { CoinDetailModal } from '@/components/CoinDetailModal';
import { usePreference } from '@/context/PreferenceContext';
import { useAuth } from '@/context/AuthContext';
import {
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface SentimentStats {
  longCount: number;
  shortCount: number;
  longPercent: number;
  shortPercent: number;
  myPosition: 'LONG' | 'SHORT' | null;
}

export default function DashboardPage() {
  const { evaluateAlerts } = usePreference();
  const { token } = useAuth();
  const [items, setItems] = useState<TripleArbitrage[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1415);
  const [isStreamConnected, setIsStreamConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 상단 도킹 차트용 선택 코인 & 상세 모달용 선택 코인 분리
  const [activeChartCoin, setActiveChartCoin] = useState<TripleArbitrage | null>(null);
  const [modalCoin, setModalCoin] = useState<TripleArbitrage | null>(null);

  // 우측 사이드바 실시간 데이터 (속보, 온체인 멤풀, 커뮤니티, 롱숏 심리)
  const [sideNews, setSideNews] = useState<FastNewsItem[]>([]);
  const [sideWhales, setSideWhales] = useState<WhaleAlertItem[]>([]);
  const [sidePosts, setSidePosts] = useState<PostListItem[]>([]);
  const [sentiment, setSentiment] = useState<SentimentStats>({
    longCount: 0,
    shortCount: 0,
    longPercent: 50,
    shortPercent: 50,
    myPosition: null,
  });
  const [clientKey, setClientKey] = useState<string>('');

  // 가격 변동 감지용 맵 (symbol -> 'up' | 'down')
  const [priceFlashMap, setPriceFlashMap] = useState<Record<string, 'up' | 'down' | undefined>>({});
  const prevPriceRef = useRef<Record<string, number>>({});
  const customRateModifiedRef = useRef<boolean>(false);

  const applyIncomingItems = useCallback((data: TripleArbitrage[]) => {
    if (!Array.isArray(data)) return;

    const newFlashMap: Record<string, 'up' | 'down' | undefined> = {};
    const newPriceRef: Record<string, number> = {};

    data.forEach((coin) => {
      const currentPrice = coin.upbitPrice || coin.bithumbPrice || 0;
      const prevPrice = prevPriceRef.current[coin.symbol];

      if (prevPrice !== undefined && currentPrice > 0 && prevPrice > 0) {
        if (currentPrice > prevPrice) {
          newFlashMap[coin.symbol] = 'up';
        } else if (currentPrice < prevPrice) {
          newFlashMap[coin.symbol] = 'down';
        }
      }
      newPriceRef[coin.symbol] = currentPrice;
    });

    prevPriceRef.current = newPriceRef;
    setItems(data);

    if (Object.keys(newFlashMap).length > 0) {
      setPriceFlashMap(newFlashMap);
      setTimeout(() => {
        setPriceFlashMap({});
      }, 1200);
    }
  }, []);

  const fetchData = useCallback(async (isManual = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/arbitrage/all?rate=${exchangeRate}&refresh=${isManual}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`서버 응답 오류: ${res.status}`);
      }

      const data: TripleArbitrage[] = await res.json();
      applyIncomingItems(data);
    } catch (err: any) {
      console.error('시세 조회 실패:', err);
      setError(err.message || '데이터를 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [exchangeRate, applyIncomingItems]);

  // 사이드바 실시간 인사이트 및 커뮤니티 데이터 로드
  useEffect(() => {
    let key = '';
    if (typeof window !== 'undefined') {
      key = localStorage.getItem('rc_client_key') || '';
      if (!key) {
        key = 'anon_' + Math.random().toString(36).substring(2, 12);
        localStorage.setItem('rc_client_key', key);
      }
      setClientKey(key);
    }

    const loadSidebar = async () => {
      try {
        const [newsRes, whaleRes, postRes, sentRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/insights/news`),
          fetch(`${API_BASE_URL}/api/insights/whale-alerts`),
          fetch(`${API_BASE_URL}/api/posts?page=0&size=6`),
          key ? fetch(`${API_BASE_URL}/api/posts/sentiment?clientKey=${encodeURIComponent(key)}`) : Promise.resolve(null),
        ]);

        if (newsRes.ok) {
          const n = await newsRes.json();
          if (Array.isArray(n)) setSideNews(n.slice(0, 7));
        }
        if (whaleRes.ok) {
          const w = await whaleRes.json();
          if (Array.isArray(w)) setSideWhales(w.slice(0, 5));
        }
        if (postRes.ok) {
          const p = await postRes.json();
          if (p && Array.isArray(p.content)) setSidePosts(p.content.slice(0, 5));
        }
        if (sentRes && sentRes.ok) {
          setSentiment(await sentRes.json());
        }
      } catch (e) {
        console.error('사이드바 데이터 조회 오류:', e);
      }
    };

    loadSidebar();
    const timer = setInterval(loadSidebar, 45000);
    return () => clearInterval(timer);
  }, []);

  const handleSentimentVote = async (pos: 'LONG' | 'SHORT') => {
    if (!clientKey) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/api/posts/sentiment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ position: pos, clientKey }),
      });
      if (res.ok) {
        setSentiment(await res.json());
      }
    } catch (e) {
      console.error('포지션 투표 오류:', e);
    }
  };

  // SSE 실시간 스트리밍 연결
  useEffect(() => {
    fetchData(false);

    const eventSource = new EventSource(`${API_BASE_URL}/api/arbitrage/stream`);

    const handleStreamPayload = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed && Array.isArray(parsed.items)) {
          applyIncomingItems(parsed.items);
          setError(null);
          setIsStreamConnected(true);
        }
        if (parsed && parsed.exchangeRate && !customRateModifiedRef.current) {
          setExchangeRate(Math.round(parsed.exchangeRate));
        }
      } catch (e) {
        console.error('SSE 데이터 파싱 오류:', e);
      }
    };

    eventSource.onopen = () => {
      setIsStreamConnected(true);
      setError(null);
    };

    eventSource.addEventListener('init', handleStreamPayload);
    eventSource.addEventListener('price-update', handleStreamPayload);

    eventSource.onerror = () => {
      setIsStreamConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [applyIncomingItems, fetchData]);

  const handleExchangeRateChange = useCallback((newRate: number) => {
    customRateModifiedRef.current = true;
    setExchangeRate(newRate);
  }, []);

  // 사용자 설정 환율에 따른 실시간 김프 재계산
  const displayItems = React.useMemo(() => {
    if (!exchangeRate || exchangeRate <= 0) return items;
    return items.map((coin) => {
      if (!coin.binancePriceUsd || coin.binancePriceUsd <= 0) return coin;
      const binancePriceKrw = coin.binancePriceUsd * exchangeRate;
      const upbitBinancePremium =
        coin.upbitPrice && coin.upbitPrice > 0
          ? Math.round((coin.upbitPrice / binancePriceKrw - 1) * 10000) / 100
          : null;
      const bithumbBinancePremium =
        coin.bithumbPrice && coin.bithumbPrice > 0
          ? Math.round((coin.bithumbPrice / binancePriceKrw - 1) * 10000) / 100
          : null;
      return {
        ...coin,
        binancePriceKrw,
        upbitBinancePremium,
        bithumbBinancePremium,
      };
    });
  }, [items, exchangeRate]);

  useEffect(() => {
    if (displayItems.length > 0) {
      evaluateAlerts(displayItems);
    }
  }, [displayItems, evaluateAlerts]);

  const averagePremium = React.useMemo(() => {
    const normalItems = displayItems.filter(
      (i) =>
        i.isWalletNormal !== false &&
        i.upbitBinancePremium !== null &&
        i.upbitBinancePremium !== undefined &&
        i.upbitBinancePremium >= -20 &&
        i.upbitBinancePremium <= 20
    );

    if (normalItems.length === 0) {
      const btc = displayItems.find((i) => i.symbol === 'BTC');
      return btc?.upbitBinancePremium ?? 0;
    }

    const sum = normalItems.reduce((acc, curr) => acc + (curr.upbitBinancePremium || 0), 0);
    return sum / normalItems.length;
  }, [displayItems]);

  const formatClockTime = (iso: string) => {
    if (!iso) return '--:--';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const shortenAddress = (addr: string) => {
    if (!addr) return '-';
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-5)}`;
  };

  const formatKrwCompact = (val: number) => {
    if (!val || val <= 0) return '-';
    const eok = val / 100_000_000;
    if (eok >= 1) {
      return `약 ${eok >= 10 ? Math.round(eok).toLocaleString('ko-KR') : eok.toFixed(1)}억원`;
    }
    const man = Math.round(val / 10_000);
    return `약 ${man.toLocaleString('ko-KR')}만원`;
  };

  const activeSymbol = activeChartCoin?.symbol || 'BTC';

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* Tier 1: Top Global Market Metrics Strip (Kimpga Style) */}
      <LiveMarquee
        items={displayItems}
        exchangeRate={exchangeRate}
        averagePremium={averagePremium}
      />

      {/* Tier 2: Terminal Navigation Bar */}
      <Navbar
        exchangeRate={exchangeRate}
        setExchangeRate={handleExchangeRateChange}
        isStreamConnected={isStreamConnected}
        onRefresh={() => fetchData(true)}
        isLoading={isLoading}
        averagePremium={averagePremium}
      />

      {/* Main 12-Column Financial Terminal Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-5 py-4">
        
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error} (백엔드 서버 연결 상태를 확인하세요)</span>
            </div>
            <button
              onClick={() => fetchData(true)}
              className="px-2.5 py-1 rounded-xs bg-red-600 text-white font-bold hover:bg-red-700 transition"
            >
              재시도
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          
          {/* Left 9 Columns: Docked TradingView Chart + 3-Exchange Arbitrage Table */}
          <div className="xl:col-span-9 min-w-0">
            <MajorCards
              items={displayItems}
              selectedCoin={activeChartCoin}
              onSelectCoin={setActiveChartCoin}
              onOpenDetailModal={setModalCoin}
              priceFlashMap={priceFlashMap}
              exchangeRate={exchangeRate}
            />

            <ArbitrageTable
              items={displayItems}
              exchangeRate={exchangeRate}
              selectedSymbol={activeSymbol}
              onSelectCoin={setActiveChartCoin}
              onOpenDetailModal={setModalCoin}
              priceFlashMap={priceFlashMap}
            />
          </div>

          {/* Right 3 Columns: CoinNess-Style Live Breaking News, BTC Mempool & Community Sidebar */}
          <aside className="xl:col-span-3 space-y-4">
            
            {/* Widget 1: Market Long / Short Sentiment Bar */}
            <div className="bg-white border border-slate-200 rounded-md p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-slate-900">일일 포지션 심리</span>
                <span className="text-[11px] text-slate-400 font-semibold tabular-nums">
                  투표 {sentiment.longCount + sentiment.shortCount}명
                </span>
              </div>

              <div className="h-2 bg-slate-100 rounded-xs overflow-hidden flex mb-2.5">
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${sentiment.longPercent}%` }}
                />
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${sentiment.shortPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs font-bold tabular-nums">
                <button
                  type="button"
                  onClick={() => handleSentimentVote('LONG')}
                  className={`py-1.5 px-2 rounded-xs border flex items-center justify-center gap-1 transition ${
                    sentiment.myPosition === 'LONG'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                  }`}
                >
                  <TrendingUp className="h-3 w-3" />
                  <span>매수(롱) {sentiment.longPercent}%</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSentimentVote('SHORT')}
                  className={`py-1.5 px-2 rounded-xs border flex items-center justify-center gap-1 transition ${
                    sentiment.myPosition === 'SHORT'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  <TrendingDown className="h-3 w-3" />
                  <span>매도(숏) {sentiment.shortPercent}%</span>
                </button>
              </div>
            </div>

            {/* Widget 2: CoinNess-Style Live Breaking News Timeline */}
            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  <h3 className="text-xs font-extrabold text-slate-900">실시간 크립토 속보</h3>
                </div>
                <Link
                  href="/news"
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center"
                >
                  <span>전체</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {sideNews.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    실시간 뉴스 수신 중...
                  </div>
                ) : (
                  sideNews.map((news) => (
                    <a
                      key={news.id}
                      href={news.url || '/news'}
                      target={news.url ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="block p-3 hover:bg-slate-50 transition group"
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 mb-1 tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-600">{formatClockTime(news.publishedAt)}</span>
                          <span>·</span>
                          <span className="font-medium text-slate-500 truncate max-w-[110px]">
                            {news.source}
                          </span>
                          {news.targetSymbol && (
                            <span className="px-1 py-0.2 bg-slate-100 text-slate-700 font-bold rounded-xs">
                              {news.targetSymbol}
                            </span>
                          )}
                        </div>
                        <ExternalLink className="h-2.5 w-2.5 text-slate-300 group-hover:text-slate-600 shrink-0" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 leading-snug line-clamp-2">
                        {news.title}
                      </p>
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* Widget 3: Real-Time Bitcoin On-Chain Mempool Transactions */}
            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900">BTC 온체인 대량 체결</h3>
                </div>
                <Link
                  href="/news"
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center"
                >
                  <span>멤풀 상세</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {sideWhales.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    온체인 멤풀 스캔 중...
                  </div>
                ) : (
                  sideWhales.map((w) => {
                    const txUrl = w.txHash
                      ? `https://mempool.space/tx/${w.txHash}`
                      : `https://mempool.space/tx/${w.id}`;
                    return (
                      <a
                        key={w.id}
                        href={txUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 hover:bg-slate-50 transition group text-xs"
                        title="mempool.space에서 원본 트랜잭션 검증"
                      >
                        <div className="flex items-center justify-between mb-1 tabular-nums">
                          <span className="font-extrabold text-slate-900">
                            {w.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })} BTC
                          </span>
                          <span className="text-[11px] font-bold text-slate-600">
                            {formatKrwCompact(w.valueKrw)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span className="truncate max-w-[105px]">{shortenAddress(w.fromAddress)}</span>
                          <ArrowRight className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[105px] text-slate-700 font-semibold">
                            {shortenAddress(w.toAddress)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 tabular-nums">
                          <span>TX: {shortenAddress(w.txHash || w.id)}</span>
                          <span className="flex items-center gap-0.5 group-hover:text-blue-600">
                            <span>{formatClockTime(w.timestamp)}</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </a>
                    );
                  })
                )}
              </div>
            </div>

            {/* Widget 4: Community Recent Posts */}
            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900">종목 토론 · 라운지</h3>
                <Link
                  href="/community"
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center"
                >
                  <span>더보기</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {sidePosts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    등록된 게시글이 없습니다.
                  </div>
                ) : (
                  sidePosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/community/${post.id}`}
                      className="block p-3 hover:bg-slate-50 transition group"
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                        {post.targetSymbol && (
                          <span className="px-1 py-0.2 bg-slate-100 text-slate-800 font-bold rounded-xs">
                            #{post.targetSymbol}
                          </span>
                        )}
                        {post.position === 'LONG' && (
                          <span className="text-red-600 font-bold">매수관점</span>
                        )}
                        {post.position === 'SHORT' && (
                          <span className="text-blue-600 font-bold">매도관점</span>
                        )}
                        <span className="text-slate-400 ml-auto">{post.authorNickname}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                          {post.title}
                        </p>
                        {post.commentCount > 0 && (
                          <span className="text-[11px] font-bold text-blue-600 tabular-nums shrink-0">
                            [{post.commentCount}]
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

          </aside>

        </div>

      </main>

      {/* Coin Detail Modal (Symbol News & Community Discussion) */}
      <CoinDetailModal
        coin={modalCoin}
        onClose={() => setModalCoin(null)}
        exchangeRate={exchangeRate}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 mt-8 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-700">
            REALCRYPTO · 업비트 · 빗썸 · 바이낸스 실시간 시세 및 온체인 통합 터미널
          </span>
          <span className="text-[11px] text-slate-400">
            본 서비스의 시세 및 차익 데이터는 투자 참고용이며, 최종 매매 책임은 투자자 본인에게 있습니다.
          </span>
        </div>
      </footer>

    </div>
  );
}
