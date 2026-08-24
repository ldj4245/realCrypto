package com.realcrypto.domain.community;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "market_sentiment_votes",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_sentiment_vote_date_voter", columnNames = {"voteDate", "voterKey"})
    },
    indexes = {
        @Index(name = "idx_sentiment_vote_date", columnList = "voteDate")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketSentimentVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate voteDate;

    @Column(nullable = false, length = 80)
    private String voterKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PositionType position;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public MarketSentimentVote(LocalDate voteDate, String voterKey, PositionType position) {
        this.voteDate = voteDate;
        this.voterKey = voterKey;
        this.position = position;
        this.updatedAt = LocalDateTime.now();
    }

    public void updatePosition(PositionType newPosition) {
        this.position = newPosition;
        this.updatedAt = LocalDateTime.now();
    }
}
