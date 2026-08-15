'use client';

import React, { useState, useEffect } from 'react';
import { ArbitrageCalcResponse, RouteRecommendation } from '@/types';
import { X, Calculator, ArrowRight, CheckCircle2, Zap, Clock, ShieldCheck, DollarSign } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface ArbitrageCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvestment?: number;
}

export const ArbitrageCalculatorModal: React.FC<ArbitrageCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialInvestment = 10000000,
}) => {
  const [investment, setInvestment] = useState<number>(initialInvestment);
  const [calcData, setCalcData] = useState<ArbitrageCalcResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCalc = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/insights/arbitrage-calculator?investment=${investment}`);
        if (res.ok) {
          const data = await res.json();
          setCalcData(data);
        }
      } catch (err) {
        console.error('차익 계산기 로드 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchCalc, 200);
    return () => clearTimeout(timer);
  }, [isOpen, investment]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shadow-2xs">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">원클릭 실순익 차익거래 계산기</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                실수령액 계산
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              국내외 매매수수료 + 네트워크 가스비 + 실시간 김프를 차감한 진짜 내 손의 순수익
            </p>
          </div>
        </div>

        {/* Investment Input Section */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-6">
          <label className="block text-xs font-black text-slate-700 mb-2">투자 원화 금액 (KRW)</label>
          <div className="relative mb-3">
            <input
              type="number"
              step="100000"
              value={investment}
              onChange={(e) => setInvestment(Math.max(100000, Number(e.target.value)))}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tabular-nums"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: '100만원', val: 1000000 },
              { label: '500만원', val: 5000000 },
              { label: '1,000만원', val: 10000000 },
              { label: '3,000만원', val: 30000000 },
              { label: '5,000만원', val: 50000000 },
              { label: '1억원', val: 100000000 },
            ].map((btn) => (
              <button
                key={btn.val}
                type="button"
                onClick={() => setInvestment(btn.val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                  investment === btn.val
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Route Recommendations List */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="flex items-center justify-between mb-3 text-xs font-black text-slate-700">
            <span>추천 전송 코인 랭킹 (순수익순)</span>
            <span className="text-slate-400 text-[11px] font-medium">수수료·가스비 포함 산출</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              실시간 수수료 및 김프를 연산하는 중입니다...
            </div>
          ) : (
            <div className="space-y-3">
              {calcData?.routes.map((route, idx) => {
                const isPositive = route.estimatedProfitKrw >= 0;
                return (
                  <div
                    key={route.coinSymbol}
                    className={`p-4 rounded-2xl border transition ${
                      idx === 0
                        ? 'bg-blue-50/50 border-blue-200 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-extrabold text-sm text-slate-900">
                          {route.coinNameKr} ({route.coinSymbol})
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                          {route.recommendationTag}
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-sm font-black tabular-nums block ${
                            isPositive ? 'text-rose-600' : 'text-blue-600'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {route.estimatedProfitKrw.toLocaleString()}원
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                          순수익률: {route.netProfitRate >= 0 ? `+${route.netProfitRate}%` : `${route.netProfitRate}%`}
                        </span>
                      </div>
                    </div>

                    {/* Sub Details: Kimp, Transfer Fee, Time */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <span>
                          현재 김프: <b className="text-slate-800 font-bold">{route.premiumPercent}%</b>
                        </span>
                        <span>
                          출금 수수료: <b className="text-slate-800 font-bold">{route.transferFeeKrw.toLocaleString()}원</b>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-slate-700">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>예상 전송 {route.estimatedMinutes}분</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>* 업비트 매수(0.05%) + 바이낸스 매도(0.04%) + 네트워크 출금 수수료 반영 기준</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
