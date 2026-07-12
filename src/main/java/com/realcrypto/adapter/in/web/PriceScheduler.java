package com.realcrypto.adapter.in.web;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.realcrypto.domain.CollectTarget;
import com.realcrypto.application.service.PriceCollectService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class PriceScheduler {

    private final PriceCollectService priceCollectService;

    // 10초 마다 작동
    @Scheduled(fixedRate = 10000)
    public void collectPrices() {
        log.info("[시세 수집 알람] 수집 활성화된 코인 리스트를 조회합니다.");

        // 💡 DB 직접 조회가 아닌, UseCase의 입력 포트를 통해 대상을 가져옴!
        List<CollectTarget> activeTargets = priceCollectService.getActiveTargets();

        for (CollectTarget target : activeTargets) {
            try {
                priceCollectService.collect(target);
            } catch (Exception e) {
                log.error("[{}] {} 시세 수집 중 장애 발생 : {}", target.getExchange(), target.getMarket(), e.getMessage());
            }
        }
    }
}
