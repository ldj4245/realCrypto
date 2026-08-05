package com.realcrypto.adapter.in.web.dto;

import java.io.Serializable;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripleArbitrageDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private String symbol;             // BTC, ETH, XRP 등
    private String nameKr;             // 비트코인, 이더리움 등
    
    // 업비트 시세 정보
    private Double upbitPrice;
    private Double upbitChangeRate;
    private Double upbitTradeValue;

    // 빗썸 시세 정보
    private Double bithumbPrice;
    private Double bithumbChangeRate;
    private Double bithumbTradeValue;

    // 바이낸스 시세 정보
    private Double binancePriceUsd;
    private Double binancePriceKrw;
    private Double binanceChangeRate;
    private Double binanceTradeValueUsd;

    // 김치 프리미엄 (%)
    private Double upbitBinancePremium;   // (Upbit / BinanceKRW - 1) * 100
    private Double bithumbBinancePremium; // (Bithumb / BinanceKRW - 1) * 100
    private Double upbitBithumbGap;       // (Upbit / Bithumb - 1) * 100

    // 바이낸스 선물 펀딩비 정보 (8시간 주기)
    private Double fundingRatePercent;    // 예: +0.01%
    private Double fundingApr;            // 연이율 환산 APR (예: +10.95%)
    private Long nextFundingTime;

    // 지갑 입출금 상태 (가두리 모니터링: true면 정상 입출금 가능)
    @Builder.Default
    private Boolean isWalletNormal = true;

    private LocalDateTime updatedAt;
}
