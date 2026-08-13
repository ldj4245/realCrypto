package com.realcrypto.adapter.out.exchange;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class FearGreedClient {

    private final RestTemplate restTemplate;
    private static final String FNG_API_URL = "https://api.alternative.me/fng/?limit=7";

    public FearGreedClient(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FearGreedItem {
        private int value;
        private String classification;
        private String classificationKr;
        private String timestamp;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FearGreedResponse {
        private FearGreedItem current;
        private List<FearGreedItem> history;
    }

    public FearGreedResponse fetchFearGreedIndex() {
        try {
            Map<String, Object> body = restTemplate.getForObject(FNG_API_URL, Map.class);
            if (body != null && body.containsKey("data")) {
                List<Map<String, String>> dataList = (List<Map<String, String>>) body.get("data");
                List<FearGreedItem> items = new ArrayList<>();

                for (Map<String, String> data : dataList) {
                    int val = Integer.parseInt(data.get("value"));
                    String classification = data.get("value_classification");
                    String classificationKr = translateClassification(classification);
                    String ts = data.get("timestamp");

                    items.add(FearGreedItem.builder()
                            .value(val)
                            .classification(classification)
                            .classificationKr(classificationKr)
                            .timestamp(ts)
                            .build());
                }

                if (!items.isEmpty()) {
                    return FearGreedResponse.builder()
                            .current(items.get(0))
                            .history(items)
                            .build();
                }
            }
        } catch (Exception e) {
            log.warn("공포·탐욕 지수 조회 실패 (기본값 제공): {}", e.getMessage());
        }

        // 기본 폴백 데이터 (65 - 탐욕)
        FearGreedItem fallback = FearGreedItem.builder()
                .value(65)
                .classification("Greed")
                .classificationKr("탐욕")
                .timestamp(String.valueOf(System.currentTimeMillis() / 1000))
                .build();

        return FearGreedResponse.builder()
                .current(fallback)
                .history(List.of(fallback))
                .build();
    }

    private String translateClassification(String classification) {
        if (classification == null) return "중립";
        switch (classification.toLowerCase()) {
            case "extreme fear": return "극단적 공포";
            case "fear": return "공포";
            case "neutral": return "중립";
            case "greed": return "탐욕";
            case "extreme greed": return "극단적 탐욕";
            default: return classification;
        }
    }
}
