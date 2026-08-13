package com.realcrypto.adapter.in.web.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class CryptoNewsDto {

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FastNewsItem {
        private String id;
        private String category;    // BREAKING(속보), GOOD(호재), BAD(악재), NOTICE(공시)
        private String categoryKr;  // 긴급속보, 호재, 악재, 거래소공시
        private String title;
        private String summary;
        private String source;      // Coinness, Bloomberg, Cointelegraph 등
        private String targetSymbol;// BTC, ETH, XRP 등
        private LocalDateTime publishedAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WhaleAlertItem {
        private String id;
        private String symbol;
        private Double amount;
        private Double valueKrw;     // 원화 환산 가치
        private String fromAddress;  // 익명 지갑, 바이낸스, 업비트 등
        private String toAddress;    // 바이낸스, 콜드월렛 등
        private String transferType; // INFLOW(거래소 유입), OUTFLOW(거래소 유출), TRANSFER(지갑 간 이동)
        private LocalDateTime timestamp;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArbitrageCalcRequest {
        private double investmentKrw; // 투자 원화 금액 (예: 10,000,000)
        private String sourceExchange;// UPBIT, BITHUMB
        private String targetExchange;// BINANCE
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteRecommendation {
        private String coinSymbol;       // XRP, TRX, SOL 등
        private String coinNameKr;
        private double transferFeeKrw;   // 출금 네트워크 수수료 (원화)
        private int estimatedMinutes;    // 예상 전송 시간 (분)
        private double premiumPercent;   // 현재 김프 (%)
        private double estimatedProfitKrw;// 순수익 (원화)
        private double netProfitRate;    // 순수익률 (%)
        private String recommendationTag;// 🚀 가장 빠름, 💰 최대 마진, ⭐ 추천
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArbitrageCalcResponse {
        private double investmentKrw;
        private List<RouteRecommendation> routes;
    }
}
