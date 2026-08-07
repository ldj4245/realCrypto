package com.realcrypto.adapter.in.web;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.realcrypto.application.service.PriceCollectService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class PriceScheduler {

    private final PriceCollectService priceCollectService;

    // 10초마다 3대 거래소 전체 시세 및 김프 일괄 수집/연산/캐싱
    @Scheduled(fixedRate = 10000, initialDelay = 1000)
    public void collectPrices() {
        try {
            log.info("[3대 거래소 시세 수집기] 업비트, 바이낸스, 빗썸 시세 일괄 수집 및 공식 실시간 환율 적용 김프 갱신 시작");
            priceCollectService.collectAllAndCalculateArbitrage(0.0);
        } catch (Exception e) {
            log.error("[시세 수집 장애] {}", e.getMessage(), e);
        }
    }
}
