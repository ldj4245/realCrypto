'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { FearGreedResponse, FastNewsItem } from '@/types';
import { TripleArbitrage } from '@/types/crypto';
import { ExternalLink, ChevronRight } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface LiveMarqueeProps {
  items?: TripleArbitrage[];
  exchangeRate?: number;
  averagePremium?: number | null;
}

export const LiveMarquee: React.FC<LiveMarqueeProps> = ({
  items: propItems,
  exchangeRate: propRate,
  averagePremium: propAvgPremium,
}) => {
  const [fearGreed, setFearGreed] = useState<FearGreedResponse | null>(null);
  const [latestNews, setLatestNews] = useState<FastNewsItem[]>([]);
  const [fallbackItems, setFallbackItems] = useState<TripleArbitrage[]>([]);
  const [currentNewsIdx, setCurrentNewsIdx] = useState(0);

  const activeItems = propItems && propItems.length > 0 ? propItems : fallbackItems;
  const effectiveRate = propRate && propRate > 0 ? propRate : 1415;

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/insights/fear-greed`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setFearGreed(data))
      .catch(() => {});

    fetch(`${API_BASE_URL}/api/insights/news`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLatestNews(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => {});

    if (!propItems || propItems.length === 0) {
      fetch(`${API_BASE_URL}/api/arbitrage/all`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setFallbackItems(data);
        })
        .catch(() => {});
    }
  }, [propItems]);

  useEffect(() => {
    if (latestNews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentNewsIdx((prev) => (prev + 1) % latestNews.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [latestNews]);

  const metrics = useMemo(() => {
    const btc = activeItems.find((i) => i.symbol === 'BTC');
    const usdt = activeItems.find((i) => i.symbol === 'USDT');

    // 실효 테더(USDT) 원화 환산가: USDT 마켓이 있으면 직접 사용, 없으면 BTC(업비트 KRW / 바이낸스 USDT) 역산
    let tetherKrw: number | null = null;
    if (usdt?.upbitPrice && usdt.upbitPrice > 0) {
      tetherKrw = Math.round(usdt.upbitPrice);
    } else if (btc?.upbitPrice && btc?.binancePriceUsd && btc.binancePriceUsd > 0) {
      tetherKrw = Math.round(btc.upbitPrice / btc.binancePriceUsd);
    }

    const tetherGapPercent =
      tetherKrw && effectiveRate > 0
        ? ((tetherKrw / effectiveRate - 1) * 100)
        : null;

    let avgPrem = propAvgPremium;
    if (avgPrem === undefined || avgPrem === null) {
      const normal = activeItems.filter(
        (i) =>
          i.isWalletNormal !== false &&
          i.upbitBinancePremium !== null &&
          i.upbitBinancePremium !== undefined &&
          i.upbitBinancePremium >= -20 &&
          i.upbitBinancePremium <= 20
      );
      if (normal.length > 0) {
        avgPrem = normal.reduce((acc, c) => acc + (c.upbitBinancePremium || 0), 0) / normal.length;
      } else {
        avgPrem = btc?.upbitBinancePremium ?? null;
      }
    }

    return {
      btc,
      tetherKrw,
      tetherGapPercent,
      avgPrem,
      btcFundingRate: btc?.fundingRatePercent ?? null,
    };
  }, [activeItems, effectiveRate, propAvgPremium]);

  const activeNews = latestNews[currentNewsIdx];

  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 text-[11px]">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-8 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        
        {/* Left: Real-time Global Market Metrics (Kimpga Terminal Bar) */}
        <div className="flex items-center gap-3.5 shrink-0">
          {/* 1. USD/KRW */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">환율(USD)</span>
            <span className="font-bold text-white tabular-nums">
              {effectiveRate.toLocaleString('ko-KR')}원
            </span>
          </div>

          <span className="h-2.5 w-px bg-slate-700" />

          {/* 2. Implied USDT/KRW */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">테더(USDT)</span>
            {metrics.tetherKrw ? (
              <div className="flex items-center gap-1 tabular-nums">
                <span className="font-bold text-white">
                  {metrics.tetherKrw.toLocaleString('ko-KR')}원
                </span>
                {metrics.tetherGapPercent !== null && (
                  <span
                    className={`font-bold ${
                      metrics.tetherGapPercent >= 0 ? 'text-red-400' : 'text-blue-400'
                    }`}
                  >
                    ({metrics.tetherGapPercent >= 0 ? '+' : ''}
                    {metrics.tetherGapPercent.toFixed(2)}%)
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-500">-</span>
            )}
          </div>

          <span className="h-2.5 w-px bg-slate-700" />

          {/* 3. Average Kimchi Premium */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">평균김프</span>
            {metrics.avgPrem !== null && metrics.avgPrem !== undefined ? (
              <span
                className={`font-bold tabular-nums ${
                  metrics.avgPrem >= 0 ? 'text-red-400' : 'text-blue-400'
                }`}
              >
                {metrics.avgPrem >= 0 ? '+' : ''}
                {metrics.avgPrem.toFixed(2)}%
              </span>
            ) : (
              <span className="text-slate-500">-</span>
            )}
          </div>

          <span className="hidden sm:block h-2.5 w-px bg-slate-700" />

          {/* 4. Real BTC 8h Funding Rate */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">BTC 펀딩비(8h)</span>
            {metrics.btcFundingRate !== null && metrics.btcFundingRate !== undefined ? (
              <span
                className={`font-bold tabular-nums ${
                  metrics.btcFundingRate >= 0 ? 'text-red-400' : 'text-blue-400'
                }`}
              >
                {metrics.btcFundingRate >= 0 ? '+' : ''}
                {metrics.btcFundingRate.toFixed(4)}%
              </span>
            ) : (
              <span className="text-slate-500">-</span>
            )}
          </div>

          <span className="hidden md:block h-2.5 w-px bg-slate-700" />

          {/* 5. Fear & Greed Index */}
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">공포·탐욕</span>
            {fearGreed?.current ? (
              <span
                className={`font-bold tabular-nums ${
                  fearGreed.current.value >= 55
                    ? 'text-red-400'
                    : fearGreed.current.value <= 45
                    ? 'text-blue-400'
                    : 'text-amber-400'
                }`}
              >
                {fearGreed.current.value} ({fearGreed.current.classificationKr})
              </span>
            ) : (
              <span className="text-slate-500">-</span>
            )}
          </div>
        </div>

        {/* Right: Rolling Real-Time News Headline with Original Link */}
        <div className="hidden lg:flex items-center gap-2 min-w-0 max-w-md xl:max-w-lg">
          <span className="px-1.5 py-0.5 rounded-xs bg-slate-800 text-slate-300 font-bold text-[10px] border border-slate-700 shrink-0">
            실시간 속보
          </span>

          {activeNews ? (
            <a
              href={activeNews.url || '/news'}
              target={activeNews.url ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white transition truncate flex items-center gap-1.5 min-w-0"
              title={activeNews.title}
            >
              <span className="text-slate-400 shrink-0">[{activeNews.source}]</span>
              <span className="truncate font-medium">{activeNews.title}</span>
              <ExternalLink className="h-2.5 w-2.5 text-slate-500 shrink-0" />
            </a>
          ) : (
            <span className="text-slate-500 truncate">속보 수신 중...</span>
          )}

          <Link
            href="/news"
            className="text-slate-400 hover:text-white shrink-0 flex items-center text-[10px] font-semibold ml-1"
          >
            <span>더보기</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

      </div>
    </div>
  );
};
