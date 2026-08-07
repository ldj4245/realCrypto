package com.realcrypto.adapter.out.exchange;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class BinanceFuturesClient {

    private final RestTemplate restTemplate;
    private static final String FUTURES_PREMIUM_URL = "https://fapi.binance.com/fapi/v1/premiumIndex";

    public BinanceFuturesClient(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FundingRateDto {
        private String symbol;
        private String lastFundingRate;
        private Long nextFundingTime;
        private Double fundingRatePercent; // % 단위 (예: 0.01%)
        private Double apr; // 연이율 환산 (365 * 3 * rate)
    }

    public Map<String, FundingRateDto> fetchFundingRates() {
        Map<String, FundingRateDto> result = new HashMap<>();
        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    FUTURES_PREMIUM_URL,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            if (response.getBody() != null) {
                for (Map<String, Object> item : response.getBody()) {
                    String symbol = (String) item.get("symbol");
                    if (symbol != null && symbol.endsWith("USDT")) {
                        String coinSymbol = symbol.replace("USDT", "").toUpperCase();
                        String rateStr = (String) item.get("lastFundingRate");
                        Number nextFundingTime = (Number) item.get("nextFundingTime");

                        double rate = 0.0;
                        if (rateStr != null) {
                            try {
                                rate = Double.parseDouble(rateStr) * 100.0; // %로 변환
                            } catch (NumberFormatException ignored) {}
                        }

                        double apr = rate * 3.0 * 365.0; // 8시간 주기 -> 연이율 환산

                        FundingRateDto dto = FundingRateDto.builder()
                                .symbol(coinSymbol)
                                .lastFundingRate(rateStr)
                                .nextFundingTime(nextFundingTime != null ? nextFundingTime.longValue() : 0L)
                                .fundingRatePercent(Math.round(rate * 10000.0) / 10000.0)
                                .apr(Math.round(apr * 100.0) / 100.0)
                                .build();

                        result.put(coinSymbol, dto);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("바이낸스 선물 펀딩비 조회 실패 (기본값 처리): {}", e.getMessage());
        }
        return result;
    }
}
