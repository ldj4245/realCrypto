'use client';

import React, { useState, useEffect } from 'react';
import { ArbitrageCalcResponse } from '@/types';
import { X, Clock } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-in fade-in duration-150">
      <div className="bg-white rounded-md border border-slate-300 shadow-2xl max-w-2xl w-full p-5 sm:p-6 relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">차익거래 실수령 계산기</h2>
              <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                수수료·네트워크 비용 반영
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              국내 매수(0.05%) + 바이낸스 매도(0.04%) + 출금 수수료 차감 기준 코인별 순수익 시뮬레이션
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xs bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Investment Input Section */}
        <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">투자 원금 (KRW)</label>
          <div className="relative mb-2.5">
            <input
              type="number"
              step="100000"
              value={investment}
              onChange={(e) => setInvestment(Math.max(100000, Number(e.target.value)))}
              className="w-full bg-white border border-slate-300 rounded-xs px-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 tabular-nums"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: '100만', val: 1000000 },
              { label: '500만', val: 5000000 },
              { label: '1,000만', val: 10000000 },
              { label: '3,000만', val: 30000000 },
              { label: '5,000만', val: 50000000 },
              { label: '1억', val: 100000000 },
            ].map((btn) => (
              <button
                key={btn.val}
                type="button"
                onClick={() => setInvestment(btn.val)}
                className={`px-2.5 py-1 rounded-xs text-xs font-bold transition border ${
                  investment === btn.val
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Route Recommendations Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto border border-slate-200 rounded-xs">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              실시간 김프 및 수수료 연산 중...
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                  <th className="py-2 px-2.5 sm:px-3">순위 · 코인</th>
                  <th className="py-2 px-2 sm:px-3 text-right">현재 김프</th>
                  <th className="py-2 px-2 sm:px-3 text-right hidden sm:table-cell">출금 수수료 · 소요시간</th>
                  <th className="py-2 px-2.5 sm:px-3 text-right">예상 순수익 (수익률)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {calcData?.routes.map((route, idx) => {
                  const isPositive = route.estimatedProfitKrw >= 0;
                  return (
                    <tr
                      key={route.coinSymbol}
                      className={idx === 0 ? 'bg-blue-50/30' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-xs bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {route.coinNameKr} ({route.coinSymbol})
                            </span>
                            <span className="text-[10px] text-slate-400">{route.recommendationTag}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 text-right tabular-nums font-bold text-slate-800">
                        {route.premiumPercent >= 0 ? `+${route.premiumPercent}%` : `${route.premiumPercent}%`}
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 text-right tabular-nums text-slate-600 hidden sm:table-cell">
                        <span className="block font-semibold">{route.transferFeeKrw.toLocaleString()}원</span>
                        <span className="text-[10px] text-slate-400 inline-flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" /> 약 {route.estimatedMinutes}분
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 sm:px-3 text-right tabular-nums">
                        <span
                          className={`font-extrabold block ${
                            isPositive ? 'text-red-600' : 'text-blue-600'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {route.estimatedProfitKrw.toLocaleString()}원
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          ({route.netProfitRate >= 0 ? `+${route.netProfitRate}%` : `${route.netProfitRate}%`})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>* 네트워크 혼잡도에 따라 실제 입출금 소요 시간은 변동될 수 있습니다.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xs bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
