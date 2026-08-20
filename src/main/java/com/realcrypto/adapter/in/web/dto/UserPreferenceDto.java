package com.realcrypto.adapter.in.web.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class UserPreferenceDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SyncFavoritesRequest {
        private List<String> symbols;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToggleFavoriteRequest {
        private String symbol;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateAlertRequest {
        private String symbol;
        private Double targetPremium;
        private String direction; // ABOVE, BELOW
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlertItem {
        private Long id;
        private String symbol;
        private Double targetPremium;
        private String direction;
        private boolean isTriggered;
        private LocalDateTime triggeredAt;
        private LocalDateTime createdAt;
    }
}
