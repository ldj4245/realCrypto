package com.realcrypto.domain.user;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "price_alerts",
        indexes = @Index(name = "idx_price_alert_username_triggered", columnList = "username, isTriggered")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PriceAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Column(nullable = false)
    private Double targetPremium;

    @Column(nullable = false, length = 10)
    private String direction; // ABOVE (이상), BELOW (이하)

    @Column(nullable = false)
    private boolean isTriggered;

    private LocalDateTime triggeredAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public PriceAlert(String username, String symbol, Double targetPremium, String direction) {
        this.username = username;
        this.symbol = symbol != null ? symbol.toUpperCase().trim() : "";
        this.targetPremium = targetPremium;
        this.direction = "BELOW".equalsIgnoreCase(direction) ? "BELOW" : "ABOVE";
        this.isTriggered = false;
        this.createdAt = LocalDateTime.now();
    }

    public void markTriggered() {
        this.isTriggered = true;
        this.triggeredAt = LocalDateTime.now();
    }
}
