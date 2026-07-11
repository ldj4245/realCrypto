package com.realcrypto.global.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.realcrypto.adapter.out.persistence.CollectTargetRepository;
import com.realcrypto.adapter.out.persistence.entity.CollectTarget;

import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(CollectTargetRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                // 1. 업비트 비트코인 등록
                repository.save(CollectTarget.builder()
                        .exchange("UPBIT")
                        .market("KRW-BTC")
                        .isActive(true)
                        .build());

                repository.save(CollectTarget.builder()
                        .exchange("UPBIT")
                        .market("KRW-ETH")
                        .isActive(false)
                        .build());

                repository.save(CollectTarget.builder()
                        .exchange("BINANCE")
                        .market("BTCUSDT")
                        .isActive(true)
                        .build());

                log.info("초기 데이터 생성 완료.");

            }
        };

    }

}
