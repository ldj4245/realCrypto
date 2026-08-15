export interface TripleArbitrage {
  symbol: string;
  nameKr: string;
  
  // 업비트
  upbitPrice: number | null;
  upbitChangeRate: number | null;
  upbitTradeValue: number | null;

  // 빗썸
  bithumbPrice: number | null;
  bithumbChangeRate: number | null;
  bithumbTradeValue: number | null;

  // 바이낸스
  binancePriceUsd: number | null;
  binancePriceKrw: number | null;
  binanceChangeRate: number | null;
  binanceTradeValueUsd: number | null;

  // 김치 프리미엄
  upbitBinancePremium: number | null;
  bithumbBinancePremium: number | null;
  upbitBithumbGap: number | null;

  // 바이낸스 선물 펀딩비
  fundingRatePercent?: number | null;
  fundingApr?: number | null;
  nextFundingTime?: number | null;
  isWalletNormal?: boolean;

  updatedAt: string;
}

export type ExchangeMode = 'UPBIT_BINANCE' | 'BITHUMB_BINANCE' | 'UPBIT_BITHUMB';

export type SortField = 'premium' | 'price' | 'change' | 'volume' | 'symbol';
export type SortOrder = 'asc' | 'desc';
