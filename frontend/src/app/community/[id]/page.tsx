'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { PostDetail, CategoryType } from '@/types/community';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Eye,
  MessageSquare,
  Clock,
  User,
  Flame,
  Trash2,
  Send,
  AlertCircle,
  Share2,
  Check,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { user, token, isLoggedIn, openAuthModal } = useAuth();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPostDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, { headers });
      if (!res.ok) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }

      const data: PostDetail = await res.json();
      setPost(data);
    } catch (err: any) {
      setError(err.message || '게시글 로드 실패');
    } finally {
      setIsLoading(false);
    }
  }, [postId, token]);

  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  // 추천 / 비추천 투표
  const handleVote = async (isLike: boolean) => {
    if (!isLoggedIn || !token) {
      openAuthModal('login');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isLike }),
      });

      if (res.ok) {
        const voteData = await res.json();
        setPost((prev) =>
          prev
            ? {
                ...prev,
                likeCount: voteData.likeCount,
                dislikeCount: voteData.dislikeCount,
                myVote: voteData.myVote,
                isBest: voteData.isBest,
              }
            : null
        );
      }
    } catch (err) {
      console.error('투표 실패:', err);
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !token) {
      openAuthModal('login');
      return;
    }

    if (!commentText.trim()) return;

    setIsCommentSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentText.trim() }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setPost((prev) =>
          prev
            ? {
                ...prev,
                commentCount: prev.commentCount + 1,
                comments: [...prev.comments, newComment],
              }
            : null
        );
        setCommentText('');
      }
    } catch (err) {
      console.error('댓글 작성 실패:', err);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  // 글 삭제
  const handleDeletePost = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.push('/community');
      }
    } catch (err) {
      alert('삭제에 실패했습니다.');
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPost((prev) =>
          prev
            ? {
                ...prev,
                commentCount: Math.max(0, prev.commentCount - 1),
                comments: prev.comments.filter((c) => c.id !== commentId),
              }
            : null
        );
      }
    } catch (err) {
      alert('댓글 삭제 실패');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const getCategoryLabel = (cat: CategoryType) => {
    switch (cat) {
      case 'FREE': return '자유게시판';
      case 'PROFIT_LOSS': return '익절/손절 인증';
      case 'ARBITRAGE_INFO': return '김프/차익 꿀팁';
      case 'ANALYSIS': return '코인 분석';
    }
  };

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-bold">
          게시글 불러오는 중...
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mb-2" />
          <h2 className="text-base font-extrabold text-slate-800">{error || '게시글을 찾을 수 없습니다.'}</h2>
          <button
            onClick={() => router.push('/community')}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            커뮤니티 목록으로
          </button>
        </div>
      </div>
    );
  }

  const isAuthor = user && user.username === post.authorUsername;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/community')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>목록으로</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-xs font-bold transition shadow-2xs"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{isCopied ? '링크 복사됨' : '공유'}</span>
            </button>

            {isAuthor && (
              <button
                onClick={handleDeletePost}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>삭제</span>
              </button>
            )}
          </div>
        </div>

        {/* Post Detail Card */}
        <article className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-8">
          
          {/* Post Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
            {post.isBest && (
              <span className="px-2.5 py-0.5 rounded-md font-black bg-rose-500 text-white flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" /> BEST 념글
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {getCategoryLabel(post.category)}
            </span>
            {post.position === 'LONG' && (
              <span className="px-2.5 py-0.5 rounded-md font-bold bg-rose-50 text-rose-600 border border-rose-200">
                포지션: 롱 🟢
              </span>
            )}
            {post.position === 'SHORT' && (
              <span className="px-2.5 py-0.5 rounded-md font-bold bg-blue-50 text-blue-600 border border-blue-200">
                포지션: 숏 🔴
              </span>
            )}
            {post.targetSymbol && (
              <span className="px-2.5 py-0.5 rounded-md font-black bg-slate-100 text-slate-800 border border-slate-200">
                #{post.targetSymbol}
              </span>
            )}
            {post.profitRate !== null && post.profitRate !== undefined && (
              <span
                className={`px-2.5 py-0.5 rounded-md font-black border tabular-nums ${
                  post.profitRate >= 0
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}
              >
                {post.profitRate >= 0 ? `수익률 +${post.profitRate}% 💰` : `손실률 ${post.profitRate}% 💧`}
              </span>
            )}
          </div>

          {/* Post Title */}
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-4">
            {post.title}
          </h1>

          {/* Author Meta Row */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <User className="h-4 w-4" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 block leading-tight">
                  {post.authorNickname}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {formatTime(post.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 font-semibold tabular-nums">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span>{post.viewCount}</span>
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{post.commentCount}</span>
              </span>
            </div>
          </div>

          {/* Post Body Content */}
          <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap mb-10 min-h-[140px]">
            {post.content}
          </div>

          {/* Like / Dislike Vote Section */}
          <div className="pt-6 border-t border-slate-100 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-3">
              
              {/* Upvote */}
              <button
                onClick={() => handleVote(true)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-xs transition border shadow-xs ${
                  post.myVote === true
                    ? 'bg-rose-600 text-white border-rose-600 scale-105'
                    : 'bg-rose-50/80 text-rose-600 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>추천</span>
                <span className="tabular-nums font-black">{post.likeCount}</span>
              </button>

              {/* Downvote */}
              <button
                onClick={() => handleVote(false)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-xs transition border shadow-xs ${
                  post.myVote === false
                    ? 'bg-blue-600 text-white border-blue-600 scale-105'
                    : 'bg-blue-50/80 text-blue-600 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <ThumbsDown className="h-4 w-4" />
                <span>비추천</span>
                <span className="tabular-nums font-black">{post.dislikeCount}</span>
              </button>

            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              추천 5개 이상 달성 시 🔥 베스트(념글)로 등록됩니다
            </span>
          </div>

        </article>

        {/* Comments Section */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-black text-slate-900">
              댓글 <span className="text-blue-600 tabular-nums">({post.comments.length})</span>
            </h2>
          </div>

          {/* Comment Write Form */}
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  isLoggedIn
                    ? `${user?.nickname}님, 건전한 토론 댓글을 남겨보세요.`
                    : '로그인 후 댓글을 작성할 수 있습니다.'
                }
                disabled={!isLoggedIn}
                className="w-full bg-transparent text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isLoggedIn ? `작성자: ${user?.nickname}` : '로그인이 필요합니다'}
                </span>
                {isLoggedIn ? (
                  <button
                    type="submit"
                    disabled={isCommentSubmitting || !commentText.trim()}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition disabled:opacity-40"
                  >
                    <Send className="h-3 w-3" />
                    <span>등록</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
                  >
                    로그인하기
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Comment List */}
          {post.comments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              첫 번째 댓글을 남겨보세요!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {post.comments.map((c) => {
                const isCommentAuthor = user && user.username === c.authorUsername;
                return (
                  <div key={c.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{c.authorNickname}</span>
                        {c.authorUsername === post.authorUsername && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                            작성자
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">{formatTime(c.createdAt)}</span>
                      </div>

                      {isCommentAuthor && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                          title="댓글 삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {c.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

        </section>

      </main>
    </div>
  );
}
