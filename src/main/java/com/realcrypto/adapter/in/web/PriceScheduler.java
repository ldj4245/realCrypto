package com.realcrypto.adapter.in.web;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.realcrypto.adapter.out.persistence.CollectTargetRepository;
import com.realcrypto.adapter.out.persistence.entity.CollectTarget;
import com.realcrypto.application.service.PriceCollectService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class PriceScheduler {

    private final PriceCollectService priceCollectService;
    private final CollectTargetRepository CollectTargetRepository;

    // 10초 마다 작성
    @Scheduled(fixedRate = 10000)
    public void collectPrices() {
        log.info("[시세 수집 알람] 수집 활성화된 코인 리스트를 DB에서 조회합니다.");

        List<CollectTarget> activeTargets = CollectTargetRepository.findByIsActiveTrue();

        for (CollectTarget target : activeTargets) {
            try {
                priceCollectService.collect(target);
            } catch (Exception e) {
                log.error("[{}] {} 시세 수집 중 장애 발생 : {}", target.getExchange(), target.getMarket(), e.getMessage());
            }
        }
    }

}
