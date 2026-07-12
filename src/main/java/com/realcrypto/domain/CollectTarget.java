package com.realcrypto.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "collect_targets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CollectTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String exchange;

    @Column(nullable = false)
    private String market;

    @Column(nullable = false)
    private Boolean isActive = true; // 수집 여부 크기 끄기

    @Builder
    public CollectTarget(String exchange, String market, Boolean isActive) {
        this.exchange = exchange;
        this.market = market;
        this.isActive = (isActive != null) ? isActive : true;
    }

}
