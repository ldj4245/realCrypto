'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { LiveMarquee } from '@/components/LiveMarquee';
import { PostListItem, CategoryType, PositionType } from '@/types/community';
import {
  PenSquare,
  Search,
  ThumbsUp,
  Eye,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface SentimentStats {
  longCount: number;
  shortCount: number;
  longPercent: number;
  shortPercent: number;
  myPosition: 'LONG' | 'SHORT' | null;
}

const MAJOR_SYMBOLS = ['ALL', 'BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'SUI', 'TRX'];

export default function CommunityPage() {
  const router = useRouter();
  const { user, token, isLoggedIn, openAuthModal } = useAuth();

  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryType | 'ALL' | 'BEST'>('ALL');
  const [activePosition, setActivePosition] = useState<PositionType | 'ALL'>('ALL');
  const [activeSymbol, setActiveSymbol] = useState<string>('ALL');
  const [onlyMyPosts, setOnlyMyPosts] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [sentiment, setSentiment] = useState<SentimentStats>({
    longCount: 0,
    shortCount: 0,
    longPercent: 50,
    shortPercent: 50,
    myPosition: null,
  });
  const [clientKey, setClientKey] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let key = localStorage.getItem('rc_client_key');
      if (!key) {
        key = 'anon_' + Math.random().toString(36).substring(2, 12);
        localStorage.setItem('rc_client_key', key);
      }
      setClientKey(key);

      const urlParams = new URLSearchParams(window.location.search);
      const symParam = urlParams.get('symbol');
      if (symParam) {
        setActiveSymbol(symParam.toUpperCase());
      }
    }
  }, []);

  const fetchSentiment = useCallback(async () => {
    if (!clientKey) return;
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(
        `${API_BASE_URL}/api/posts/sentiment?clientKey=${encodeURIComponent(clientKey)}`,
        { headers }
      );
      if (res.ok) {
        const data: SentimentStats = await res.json();
        setSentiment(data);
      }
    } catch (e) {
      console.error('심리 투표 조회 실패:', e);
    }
  }, [clientKey, token]);

  useEffect(() => {
    fetchSentiment();
  }, [fetchSentiment]);

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
        const data: SentimentStats = await res.json();
        setSentiment(data);
      }
    } catch (e) {
      console.error('심리 투표 반영 실패:', e);
    }
  };

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('size', '20');

      if (activeCategory === 'BEST') {
        params.set('onlyBest', 'true');
      } else if (activeCategory !== 'ALL') {
        params.set('category', activeCategory);
      }

      if (activePosition !== 'ALL') {
        params.set('position', activePosition);
      }

      if (activeSymbol !== 'ALL') {
        params.set('symbol', activeSymbol);
      }

      if (onlyMyPosts && user?.username) {
        params.set('author', user.username);
      }

      if (searchQuery.trim()) {
        params.set('query', searchQuery.trim());
      }

      const res = await fetch(`${API_BASE_URL}/api/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.content || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('게시글 목록 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, activePosition, activeSymbol, onlyMyPosts, user?.username, searchQuery, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleWriteClick = () => {
    if (!isLoggedIn) {
      openAuthModal('login');
    } else {
      const suffix = activeSymbol !== 'ALL' ? `?symbol=${encodeURIComponent(activeSymbol)}` : '';
      router.push(`/community/write${suffix}`);
    }
  };

  const getCategoryLabel = (cat: CategoryType) => {
    switch (cat) {
      case 'FREE': return '자유';
      case 'PROFIT_LOSS': return '손익인증';
      case 'ARBITRAGE_INFO': return '차익정보';
      case 'ANALYSIS': return '시황분석';
    }
  };

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return '방금 전';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
    if (diffSec < 86400) return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
  };

  const totalVotes = sentiment.longCount + sentiment.shortCount;

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col font-sans antialiased">
      <LiveMarquee />
      <Navbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-5 py-4">
        
        {/* Top Sentiment & Write Bar */}
        <div className="bg-white rounded-md p-4 border border-slate-200 mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-black text-slate-900">
              종목 토론 · 실전 투자자 커뮤니티
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              종목별 롱/숏 관점, 매매 손익 인증, 거래소 차익거래 정보를 공유하는 게시판입니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Daily Position Poll */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xs border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">일일 포지션({totalVotes}명)</span>
              <button
                type="button"
                onClick={() => handleSentimentVote('LONG')}
                className={`px-2 py-0.5 rounded-xs font-bold border transition tabular-nums flex items-center gap-1 ${
                  sentiment.myPosition === 'LONG'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                }`}
              >
                <TrendingUp className="h-3 w-3" />
                <span>롱 {sentiment.longPercent}%</span>
              </button>
              <div className="w-20 h-2 bg-slate-200 rounded-xs overflow-hidden hidden sm:flex">
                <div className="h-full bg-red-600" style={{ width: `${sentiment.longPercent}%` }} />
                <div className="h-full bg-blue-600" style={{ width: `${sentiment.shortPercent}%` }} />
              </div>
              <button
                type="button"
                onClick={() => handleSentimentVote('SHORT')}
                className={`px-2 py-0.5 rounded-xs font-bold border transition tabular-nums flex items-center gap-1 ${
                  sentiment.myPosition === 'SHORT'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                }`}
              >
                <TrendingDown className="h-3 w-3" />
                <span>숏 {sentiment.shortPercent}%</span>
              </button>
            </div>

            <button
              onClick={handleWriteClick}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xs bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shrink-0"
            >
              <PenSquare className="h-3.5 w-3.5" />
              <span>글쓰기</span>
            </button>
          </div>
        </div>

        {/* Board Container */}
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
          
          {/* Filter & Search Header */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              
              {/* Category Tabs */}
              <div className="flex items-center border border-slate-300 rounded-xs bg-white overflow-x-auto no-scrollbar text-xs font-bold self-start">
                {[
                  { key: 'ALL', label: '전체' },
                  { key: 'BEST', label: '인기·베스트' },
                  { key: 'FREE', label: '자유토론' },
                  { key: 'PROFIT_LOSS', label: '손익인증' },
                  { key: 'ARBITRAGE_INFO', label: '차익정보' },
                  { key: 'ANALYSIS', label: '시황분석' },
                ].map((cat, idx) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => { setActiveCategory(cat.key as any); setPage(0); }}
                    className={`px-3 py-1.5 whitespace-nowrap transition ${
                      idx > 0 ? 'border-l border-slate-300' : ''
                    } ${
                      activeCategory === cat.key
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Right Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => { setOnlyMyPosts(!onlyMyPosts); setPage(0); }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xs text-xs font-bold border transition ${
                      onlyMyPosts
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>내 게시글</span>
                  </button>
                )}

                <div className="flex items-center border border-slate-300 rounded-xs bg-white overflow-hidden text-xs font-bold">
                  {[
                    { key: 'ALL', label: '전체관점' },
                    { key: 'LONG', label: '매수(롱)' },
                    { key: 'SHORT', label: '매도(숏)' },
                  ].map((pos, idx) => (
                    <button
                      key={pos.key}
                      type="button"
                      onClick={() => { setActivePosition(pos.key as any); setPage(0); }}
                      className={`px-2.5 py-1.5 transition ${idx > 0 ? 'border-l border-slate-300' : ''} ${
                        activePosition === pos.key
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="제목/내용/작성자 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setPage(0); fetchPosts(); } }}
                    className="w-full bg-white border border-slate-300 rounded-xs pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Symbol Tags */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
              <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0">종목 필터:</span>
              {MAJOR_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => { setActiveSymbol(sym); setPage(0); }}
                  className={`px-2 py-0.5 rounded-xs text-[11px] font-bold border transition whitespace-nowrap ${
                    activeSymbol === sym
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {sym === 'ALL' ? '전체' : sym}
                </button>
              ))}
            </div>
          </div>

          {/* High-Density Korean Board Table */}
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              게시글을 불러오는 중입니다...
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              조건에 해당하는 게시글이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <th className="py-2.5 px-3 w-20 text-center">분류</th>
                    <th className="py-2.5 px-3">제목</th>
                    <th className="py-2.5 px-3 w-28 text-center hidden sm:table-cell">작성자</th>
                    <th className="py-2.5 px-3 w-20 text-center hidden md:table-cell">작성일</th>
                    <th className="py-2.5 px-3 w-16 text-right">조회</th>
                    <th className="py-2.5 px-3 w-16 text-right">추천</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          {getCategoryLabel(post.category)}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <Link href={`/community/${post.id}`} className="flex flex-wrap items-center gap-1.5 group">
                          {post.isBest && (
                            <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-extrabold bg-red-600 text-white">
                              인기
                            </span>
                          )}
                          {post.targetSymbol && (
                            <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-300">
                              {post.targetSymbol}
                            </span>
                          )}
                          {post.position === 'LONG' && (
                            <span className="text-[11px] font-bold text-red-600">[매수]</span>
                          )}
                          {post.position === 'SHORT' && (
                            <span className="text-[11px] font-bold text-blue-600">[매도]</span>
                          )}
                          {post.profitRate !== null && post.profitRate !== undefined && (
                            <span
                              className={`px-1.5 py-0.2 rounded-xs text-[10px] font-bold border tabular-nums ${
                                post.profitRate >= 0
                                  ? 'bg-red-50 text-red-600 border-red-200'
                                  : 'bg-blue-50 text-blue-600 border-blue-200'
                              }`}
                            >
                              {post.profitRate >= 0 ? `+${post.profitRate}%` : `${post.profitRate}%`}
                            </span>
                          )}

                          <span className="font-bold text-slate-900 group-hover:text-blue-700 transition">
                            {post.title}
                          </span>

                          {post.commentCount > 0 && (
                            <span className="text-[11px] font-extrabold text-blue-600 tabular-nums">
                              [{post.commentCount}]
                            </span>
                          )}
                        </Link>
                      </td>

                      <td className="py-2.5 px-3 text-center text-slate-700 font-semibold hidden sm:table-cell">
                        {post.authorNickname}
                      </td>

                      <td className="py-2.5 px-3 text-center text-slate-400 tabular-nums hidden md:table-cell">
                        {formatTime(post.createdAt)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-500 tabular-nums">
                        <span className="inline-flex items-center gap-0.5">
                          <Eye className="h-3 w-3 text-slate-300 sm:hidden" />
                          {post.viewCount}
                        </span>
                      </td>

                      <td
                        className={`py-2.5 px-3 text-right tabular-nums font-bold ${
                          post.likeCount > 0 ? 'text-red-600' : 'text-slate-400'
                        }`}
                      >
                        <span className="inline-flex items-center gap-0.5">
                          <ThumbsUp className="h-3 w-3 sm:hidden" />
                          {post.likeCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-200 flex items-center justify-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-xs border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-2 tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-xs border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
