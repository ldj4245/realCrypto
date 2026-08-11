package com.realcrypto.domain.community;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "post_votes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"postId", "username"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long postId;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false)
    private Boolean isLike; // true: 추천, false: 비추천

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public PostVote(Long postId, String username, Boolean isLike) {
        this.postId = postId;
        this.username = username;
        this.isLike = isLike;
        this.createdAt = LocalDateTime.now();
    }

    public void updateVote(Boolean isLike) {
        this.isLike = isLike;
    }
}
