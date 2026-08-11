package com.realcrypto.domain.community;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CategoryType category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PositionType position = PositionType.NEUTRAL;

    @Column(length = 20)
    private String targetSymbol; // 선택된 코인 심볼 (예: BTC, XRP)

    @Column(nullable = false, length = 150)
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private Double profitRate; // 익절/손절 인증 수익률 (%)

    @Column(nullable = false, length = 50)
    private String authorUsername;

    @Column(nullable = false, length = 50)
    private String authorNickname;

    private int viewCount = 0;
    private int likeCount = 0;
    private int dislikeCount = 0;
    private int commentCount = 0;

    private boolean isBest = false; // 베스트(념글) 여부

    @Column(nullable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder
    public Post(CategoryType category, PositionType position, String targetSymbol,
            String title, String content, Double profitRate, String authorUsername, String authorNickname) {
        this.category = (category != null) ? category : CategoryType.FREE;
        this.position = (position != null) ? position : PositionType.NEUTRAL;
        this.targetSymbol = (targetSymbol != null) ? targetSymbol.toUpperCase() : null;
        this.title = title;
        this.content = content;
        this.profitRate = profitRate;
        this.authorUsername = authorUsername;
        this.authorNickname = authorNickname;
        this.viewCount = 0;
        this.likeCount = 0;
        this.dislikeCount = 0;
        this.commentCount = 0;
        this.isBest = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void incrementViewCount() {
        this.viewCount++;
    }

    public void updateLikeCounts(int likes, int dislikes) {
        this.likeCount = likes;
        this.dislikeCount = dislikes;
        if (this.likeCount >= 5) {
            this.isBest = true;
        }
    }

    public void updateCommentCount(int count) {
        this.commentCount = count;
    }

    public void update(String title, String content, CategoryType category, PositionType position, String targetSymbol, Double profitRate) {
        this.title = title;
        this.content = content;
        if (category != null) this.category = category;
        if (position != null) this.position = position;
        this.targetSymbol = targetSymbol;
        this.profitRate = profitRate;
        this.updatedAt = LocalDateTime.now();
    }
}
