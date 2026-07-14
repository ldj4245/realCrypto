package com.realcrypto.domain;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.AccessLevel;

@Entity
@Table(name = "crypto_prices")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CryptoPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String market; // KRW-BTC, BTCUSDT

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collect_target_id")
    @Setter
    private CollectTarget collectTarget;

    @Column(nullable = false)
    private String exchange; // upbit, binance

    private Double openingPrice;
    private Double highPrice;
    private Double lowPrice;
    private Double tradePrice;

    @Column(nullable = false)
    private LocalDateTime timestamp; // 데이터 수집 시간

    // 1. 내부 조립용 빌더
    @Builder
    private CryptoPrice(String market, String exchange, Double openingPrice,
            Double highPrice, Double lowPrice, Double tradePrice, LocalDateTime timestamp) {
        this.market = market;
        this.exchange = exchange;
        this.openingPrice = openingPrice;
        this.highPrice = highPrice;
        this.lowPrice = lowPrice;
        this.tradePrice = tradePrice;
        this.timestamp = timestamp;
    }
}
