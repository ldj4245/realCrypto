'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FearGreedResponse, FastNewsItem } from '@/types';
import { Flame, ShieldAlert, Newspaper, TrendingUp, Sparkles } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const LiveMarquee: React.FC = () => {
  const [fearGreed, setFearGreed] = useState<FearGreedResponse | null>(null);
  const [latestNews, setLatestNews] = useState<FastNewsItem[]>([]);
  const [currentNewsIdx, setCurrentNewsIdx] = useState(0);

  useEffect(() => {
    // 1. 공포탐욕지수 조회
    fetch(`${API_BASE_URL}/api/insights/fear-greed`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setFearGreed(data))
      .catch(() => {});

    // 2. 최신 속보 3건 조회
    fetch(`${API_BASE_URL}/api/insights/news`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLatestNews(data.slice(0, 5)))
      .catch(() => {});
  }, []);

  // 속보 4초마다 롤링
  useEffect(() => {
    if (latestNews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentNewsIdx((prev) => (prev + 1) % latestNews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [latestNews]);

  const activeNews = latestNews[currentNewsIdx];

  const getFearGreedBadgeColor = (val: number) => {
    if (val >= 75) return 'bg-rose-500 text-white';
    if (val >= 55) return 'bg-emerald-500 text-white';
    if (val >= 45) return 'bg-amber-500 text-white';
    return 'bg-blue-500 text-white';
  };

  return (
    <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        
        {/* Left: Fear & Greed Index Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-slate-500">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span>공포·탐욕 지수:</span>
          </div>

          {fearGreed?.current ? (
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full font-black text-[11px] tabular-nums shadow-2xs ${getFearGreedBadgeColor(
                  fearGreed.current.value
                )}`}
              >
                {fearGreed.current.value} {fearGreed.current.classificationKr}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 font-medium">조회 중...</span>
          )}

          <div className="hidden sm:block h-3.5 w-px bg-slate-200" />
          
          <div className="hidden sm:flex items-center gap-1 text-slate-500 font-medium">
            <span className="font-bold text-slate-700">선물 펀딩비:</span>
            <span className="text-emerald-600 font-bold">정상 (롱 우세)</span>
          </div>
        </div>

        {/* Right: Rolling Fast News Header */}
        <div className="flex items-center gap-2 overflow-hidden w-full md:w-auto">
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-[10px] border border-blue-200 shrink-0 flex items-center gap-1">
            <Newspaper className="h-3 w-3" /> 24시 속보
          </span>

          {activeNews ? (
            <Link
              href="/news"
              className="text-slate-700 hover:text-blue-600 font-bold transition truncate max-w-lg block"
            >
              {activeNews.category === 'BREAKING' && (
                <span className="text-rose-600 mr-1.5 font-extrabold">[긴급]</span>
              )}
              {activeNews.title}
            </Link>
          ) : (
            <span className="text-slate-400 font-medium truncate">속보 피드 연결 중...</span>
          )}
        </div>

      </div>
    </div>
  );
};
