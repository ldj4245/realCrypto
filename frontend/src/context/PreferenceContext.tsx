'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { TripleArbitrage } from '@/types/crypto';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface PriceAlertItem {
  id: number;
  symbol: string;
  targetPremium: number;
  direction: 'ABOVE' | 'BELOW';
  isTriggered: boolean;
  triggeredAt?: string | null;
  createdAt: string;
}

interface PreferenceContextType {
  favorites: string[];
  alerts: PriceAlertItem[];
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isFavorite: (symbol: string) => boolean;
  toggleFavorite: (symbol: string) => Promise<void>;
  addAlert: (symbol: string, targetPremium: number, direction: 'ABOVE' | 'BELOW') => Promise<void>;
  removeAlert: (id: number) => Promise<void>;
  evaluateAlerts: (items: TripleArbitrage[]) => void;
}

const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined);

export const PreferenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoggedIn } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const alertsRef = useRef<PriceAlertItem[]>([]);
  const soundRef = useRef<boolean>(true);

  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  // 초기 LocalStorage 로드
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem('rc_favorites');
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
      const savedAlerts = localStorage.getItem('rc_alerts');
      if (savedAlerts) {
        setAlerts(JSON.parse(savedAlerts));
      }
      const savedSound = localStorage.getItem('rc_sound');
      if (savedSound !== null) {
        setSoundEnabledState(savedSound === 'true');
      }
    } catch (e) {
      console.error('설정 로드 오류:', e);
    }
  }, []);

  // 로그인 시 서버 DB와 동기화
  useEffect(() => {
    if (!isLoggedIn || !token) return;

    const syncWithServer = async () => {
      try {
        let localFavs: string[] = [];
        const raw = localStorage.getItem('rc_favorites');
        if (raw) {
          localFavs = JSON.parse(raw);
        }

        const favRes = await fetch(`${API_BASE_URL}/api/me/favorites/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ symbols: localFavs }),
        });

        if (favRes.ok) {
          const mergedFavs: string[] = await favRes.json();
          setFavorites(mergedFavs);
          localStorage.setItem('rc_favorites', JSON.stringify(mergedFavs));
        }

        const alertRes = await fetch(`${API_BASE_URL}/api/me/alerts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (alertRes.ok) {
          const serverAlerts: PriceAlertItem[] = await alertRes.json();
          setAlerts(serverAlerts);
          localStorage.setItem('rc_alerts', JSON.stringify(serverAlerts));
        }
      } catch (e) {
        console.error('관심종목/알림 동기화 실패:', e);
      }
    };

    syncWithServer();
  }, [isLoggedIn, token]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem('rc_sound', String(enabled));
  }, []);

  const isFavorite = useCallback(
    (symbol: string) => favorites.includes(symbol.toUpperCase()),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (symbol: string) => {
      const upper = symbol.toUpperCase();
      setFavorites((prev) => {
        const next = prev.includes(upper) ? prev.filter((s) => s !== upper) : [...prev, upper];
        localStorage.setItem('rc_favorites', JSON.stringify(next));
        return next;
      });

      if (isLoggedIn && token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/me/favorites/toggle`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ symbol: upper }),
          });
          if (res.ok) {
            const updated: string[] = await res.json();
            setFavorites(updated);
            localStorage.setItem('rc_favorites', JSON.stringify(updated));
          }
        } catch (e) {
          console.error('즐겨찾기 서버 반영 실패:', e);
        }
      }
    },
    [isLoggedIn, token]
  );

  const addAlert = useCallback(
    async (symbol: string, targetPremium: number, direction: 'ABOVE' | 'BELOW') => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }

      const upper = symbol.toUpperCase().trim();
      if (isLoggedIn && token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/me/alerts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ symbol: upper, targetPremium, direction }),
          });
          if (res.ok) {
            const created: PriceAlertItem = await res.json();
            setAlerts((prev) => {
              const next = [created, ...prev];
              localStorage.setItem('rc_alerts', JSON.stringify(next));
              return next;
            });
            return;
          }
        } catch (e) {
          console.error('알림 등록 실패:', e);
        }
      }

      const localItem: PriceAlertItem = {
        id: Date.now(),
        symbol: upper,
        targetPremium,
        direction,
        isTriggered: false,
        createdAt: new Date().toISOString(),
      };
      setAlerts((prev) => {
        const next = [localItem, ...prev];
        localStorage.setItem('rc_alerts', JSON.stringify(next));
        return next;
      });
    },
    [isLoggedIn, token]
  );

  const removeAlert = useCallback(
    async (id: number) => {
      setAlerts((prev) => {
        const next = prev.filter((a) => a.id !== id);
        localStorage.setItem('rc_alerts', JSON.stringify(next));
        return next;
      });

      if (isLoggedIn && token) {
        try {
          await fetch(`${API_BASE_URL}/api/me/alerts/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (e) {
          console.error('알림 삭제 실패:', e);
        }
      }
    },
    [isLoggedIn, token]
  );

  const playAlertChime = useCallback(() => {
    if (!soundRef.current || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // 브라우저 자동재생 정책 등으로 실패 시 무시
    }
  }, []);

  const evaluateAlerts = useCallback(
    (items: TripleArbitrage[]) => {
      const currentAlerts = alertsRef.current;
      if (!currentAlerts || currentAlerts.length === 0) return;

      const activeAlerts = currentAlerts.filter((a) => !a.isTriggered);
      if (activeAlerts.length === 0) return;

      const priceMap = new Map<string, number>();
      items.forEach((coin) => {
        if (coin.upbitBinancePremium !== null && coin.upbitBinancePremium !== undefined) {
          priceMap.set(coin.symbol.toUpperCase(), coin.upbitBinancePremium);
        }
      });

      const triggeredIds: number[] = [];
      let latestMessage: string | null = null;

      activeAlerts.forEach((alert) => {
        const currentPrem = priceMap.get(alert.symbol.toUpperCase());
        if (currentPrem === undefined) return;

        const isHit =
          (alert.direction === 'ABOVE' && currentPrem >= alert.targetPremium) ||
          (alert.direction === 'BELOW' && currentPrem <= alert.targetPremium);

        if (isHit) {
          triggeredIds.push(alert.id);
          const dirLabel = alert.direction === 'ABOVE' ? '이상' : '이하';
          latestMessage = `[김프 도달] ${alert.symbol} 현재 김프 ${currentPrem.toFixed(2)}% (목표 ${alert.targetPremium}% ${dirLabel})`;
        }
      });

      if (triggeredIds.length > 0) {
        const nowIso = new Date().toISOString();
        setAlerts((prev) => {
          const next = prev.map((a) =>
            triggeredIds.includes(a.id) ? { ...a, isTriggered: true, triggeredAt: nowIso } : a
          );
          localStorage.setItem('rc_alerts', JSON.stringify(next));
          return next;
        });

        playAlertChime();

        if (latestMessage) {
          setToastNotice(latestMessage);
          setTimeout(() => setToastNotice(null), 6000);

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('RealCrypto 김프 알림', { body: latestMessage });
          }
        }

        if (isLoggedIn && token) {
          triggeredIds.forEach((id) => {
            fetch(`${API_BASE_URL}/api/me/alerts/${id}/trigger`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
          });
        }
      }
    },
    [isLoggedIn, token, playAlertChime]
  );

  return (
    <PreferenceContext.Provider
      value={{
        favorites,
        alerts,
        soundEnabled,
        setSoundEnabled,
        isFavorite,
        toggleFavorite,
        addAlert,
        removeAlert,
        evaluateAlerts,
      }}
    >
      {children}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastNotice}</span>
          <button
            onClick={() => setToastNotice(null)}
            className="text-slate-400 hover:text-white ml-2 text-[11px]"
          >
            닫기
          </button>
        </div>
      )}
    </PreferenceContext.Provider>
  );
};

export const usePreference = () => {
  const ctx = useContext(PreferenceContext);
  if (!ctx) {
    throw new Error('usePreference must be used within PreferenceProvider');
  }
  return ctx;
};
