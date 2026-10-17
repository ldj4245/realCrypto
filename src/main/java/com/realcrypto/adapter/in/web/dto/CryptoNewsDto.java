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
        private String category;    // BREAKING(속보), GOOD(호재), BAD(악재), NOTICE(뉴스)
        private String categoryKr;  // 속보, 상승, 하락, 뉴스
        private String title;
        private String summary;
        private String source;      // 언론사명
        private String url;         // 원문 기사 링크
        private String targetSymbol;// BTC, ETH, XRP 등
        private LocalDateTime publishedAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WhaleAlertItem {
        private String id;
        private String txHash;       // 실제 비트코인 트랜잭션 해시 (64자리 hex)
        private String symbol;
        private Double amount;
        private Double valueKrw;     // 원화 환산 가치
        private String fromAddress;  // 실제 송신 지갑 주소
        private String toAddress;    // 실제 수신 지갑 주소
        private Integer inputCount;  // UTXO 입력 개수
        private Integer outputCount; // UTXO 출력 개수
        private Long feeSats;        // 네트워크 수수료 (satoshi)
        private String transferType; // MEGA(초대형), LARGE(대량), MULTI(다중출력), STANDARD(일반)
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
