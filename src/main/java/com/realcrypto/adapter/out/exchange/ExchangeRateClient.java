package com.realcrypto.adapter.out.exchange;

import java.util.Map;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ExchangeRateClient {

    private final RestTemplate restTemplate;
    // 글로벌 오픈 실시간 환율 API (인증키 무제한 무료, 1분 단위 갱신)
    private static final String PRIMARY_FOREX_URL = "https://open.er-api.com/v6/latest/USD";
    // 2차 백업 환율 API (유럽중앙은행 데이터 기반)
    private static final String BACKUP_FOREX_URL = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=KRW";

    private volatile double cachedRate = 1414.0;
    private volatile long lastFetchTime = 0L;

    public ExchangeRateClient(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    public double fetchLiveUsdKrwRate() {
        long now = System.currentTimeMillis();
        // 60초 캐싱
        if (now - lastFetchTime < 60000 && lastFetchTime > 0) {
            return cachedRate;
        }

        try {
            Map<String, Object> body = restTemplate.getForObject(PRIMARY_FOREX_URL, Map.class);
            if (body != null && body.containsKey("rates")) {
                Map<String, Number> rates = (Map<String, Number>) body.get("rates");
                if (rates.containsKey("KRW")) {
                    double rate = rates.get("KRW").doubleValue();
                    this.cachedRate = Math.round(rate * 100.0) / 100.0;
                    this.lastFetchTime = now;
                    log.info("공식 실시간 USD/KRW 환율 수집 완료: {} 원", this.cachedRate);
                    return this.cachedRate;
                }
            }
        } catch (Exception e) {
            log.warn("1차 환율 API 호출 실패, 백업 API 시도: {}", e.getMessage());
            try {
                Map<String, Object> backupBody = restTemplate.getForObject(BACKUP_FOREX_URL, Map.class);
                if (backupBody != null && backupBody.containsKey("rates")) {
                    Map<String, Number> rates = (Map<String, Number>) backupBody.get("rates");
                    if (rates.containsKey("KRW")) {
                        double rate = rates.get("KRW").doubleValue();
                        this.cachedRate = Math.round(rate * 100.0) / 100.0;
                        this.lastFetchTime = now;
                        return this.cachedRate;
                    }
                }
            } catch (Exception be) {
                log.error("백업 환율 API 호출 실패 (이전 캐시 유지: {} 원): {}", cachedRate, be.getMessage());
            }
        }

        return cachedRate;
    }
}
