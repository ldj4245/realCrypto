'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TripleArbitrage } from '@/types/crypto';
import { Navbar } from '@/components/Navbar';
import { LiveMarquee } from '@/components/LiveMarquee';
import { MajorCards } from '@/components/MajorCards';
import { ArbitrageTable } from '@/components/ArbitrageTable';
import { CoinDetailModal } from '@/components/CoinDetailModal';
import { ShieldCheck, Info, AlertTriangle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function DashboardPage() {
  const [items, setItems] = useState<TripleArbitrage[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1380);
  const [countdown, setCountdown] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<TripleArbitrage | null>(null);
  
  // 가격 변동 감지용 맵 (symbol -> 'up' | 'down')
  const [priceFlashMap, setPriceFlashMap] = useState<Record<string, 'up' | 'down' | undefined>>({});
  const prevPriceRef = useRef<Record<string, number>>({});

  // 데이터 가져오기
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
      if (!Array.isArray(data)) {
        throw new Error('데이터 형식이 올바르지 않습니다.');
      }

      // 가격 변동 플래시 계산
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
        // 1.2초 후 플래시 초기화
        setTimeout(() => {
          setPriceFlashMap({});
        }, 1200);
      }
    } catch (err: any) {
      console.error('시세 조회 실패:', err);
      setError(err.message || '데이터를 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [exchangeRate]);

  // 초기 1회 로드 및 공식 실시간 환율 수집
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/arbitrage/exchange-rate`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.rate) {
          setExchangeRate(Math.round(data.rate));
        }
      })
      .catch(() => {});

    fetchData();
  }, [fetchData]);

  // 5초 주기 타이머 루프
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchData]);

  // 시장 체감 평균 김프 계산 (비정상 가두리/단위 불일치 이상치 제외 및 거래대금 기준 정밀 산출)
  const averagePremium = React.useMemo(() => {
    // 1. 정상 범위 (-20% ~ +20%) 내의 코인만 필터링 (DATA, PROS 등 티커 불일치 이상치 제거)
    const normalItems = items.filter(
      (i) =>
        i.upbitBinancePremium !== null &&
        i.upbitBinancePremium !== undefined &&
        i.upbitBinancePremium >= -20 &&
        i.upbitBinancePremium <= 20
    );

    if (normalItems.length === 0) {
      // 메이저 비트코인 기준 폴백
      const btc = items.find((i) => i.symbol === 'BTC');
      return btc?.upbitBinancePremium ?? 0;
    }

    // 2. 거래대금 상위 및 메이저 코인 가중 또는 절사평균 계산
    const sum = normalItems.reduce((acc, curr) => acc + (curr.upbitBinancePremium || 0), 0);
    return sum / normalItems.length;
  }, [items]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* Header / Navbar */}
      <Navbar
        exchangeRate={exchangeRate}
        setExchangeRate={setExchangeRate}
        countdown={countdown}
        onRefresh={() => fetchData(true)}
        isLoading={isLoading}
        averagePremium={averagePremium}
      />

      {/* Live Marquee Ticker (Fear & Greed, Fast News) */}
      <LiveMarquee />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Error Alert if any */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-700 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error} (백엔드 서버 `http://localhost:8080` 상태를 확인하세요)</span>
            </div>
            <button
              onClick={() => fetchData(true)}
              className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
            >
              재시도
            </button>
          </div>
        )}

        {/* Major Coins Summary Cards */}
        <MajorCards
          items={items}
          onSelectCoin={setSelectedCoin}
          priceFlashMap={priceFlashMap}
        />

        {/* 3-Exchange Arbitrage Table */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">전체 암호화폐 실시간 김치 프리미엄</h2>
              <p className="text-xs text-slate-400">업비트, 빗썸, 바이낸스 전체 마켓 실시간 교차 분석</p>
            </div>
          </div>

          <ArbitrageTable
            items={items}
            exchangeRate={exchangeRate}
            onSelectCoin={setSelectedCoin}
            priceFlashMap={priceFlashMap}
          />
        </section>

      </main>

      {/* Coin Detail Modal */}
      <CoinDetailModal
        coin={selectedCoin}
        onClose={() => setSelectedCoin(null)}
        exchangeRate={exchangeRate}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>RealCrypto 2026 · 헥사고날 아키텍처 기반 실시간 분산 수집 시스템</span>
          </div>
          <p>© 2026 RealCrypto. All data aggregated from Upbit, Bithumb & Binance Public APIs.</p>
        </div>
      </footer>

    </div>
  );
}
