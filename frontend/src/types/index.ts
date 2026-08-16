export interface TripleArbitrageDto {
  symbol: string;
  nameKr: string;
  upbitPrice: number | null;
  upbitChangeRate: number | null;
  upbitTradeValue: number;
  bithumbPrice: number | null;
  bithumbChangeRate: number | null;
  bithumbTradeValue: number;
  binancePriceUsd: number | null;
  binancePriceKrw: number | null;
  binanceChangeRate: number | null;
  binanceTradeValueUsd: number;
  upbitBinancePremium: number | null;
  bithumbBinancePremium: number | null;
  upbitBithumbGap: number | null;
  fundingRatePercent?: number | null;
  fundingApr?: number | null;
  nextFundingTime?: number | null;
  isWalletNormal?: boolean;
  updatedAt: string;
}

export interface FearGreedItem {
  value: number;
  classification: string;
  classificationKr: string;
  timestamp: string;
}

export interface FearGreedResponse {
  current: FearGreedItem;
  history: FearGreedItem[];
}

export interface FastNewsItem {
  id: string;
  category: 'BREAKING' | 'GOOD' | 'BAD' | 'NOTICE';
  categoryKr: string;
  title: string;
  summary: string;
  source: string;
  targetSymbol?: string;
  publishedAt: string;
}

export interface WhaleAlertItem {
  id: string;
  symbol: string;
  amount: number;
  valueKrw: number;
  fromAddress: string;
  toAddress: string;
  transferType: 'INFLOW' | 'OUTFLOW' | 'TRANSFER';
  timestamp: string;
}

export interface RouteRecommendation {
  coinSymbol: string;
  coinNameKr: string;
  transferFeeKrw: number;
  estimatedMinutes: number;
  premiumPercent: number;
  estimatedProfitKrw: number;
  netProfitRate: number;
  recommendationTag: string;
}

export interface ArbitrageCalcResponse {
  investmentKrw: number;
  routes: RouteRecommendation[];
}
