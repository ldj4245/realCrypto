package com.realcrypto.domain.user;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
        name = "user_favorites",
        uniqueConstraints = @UniqueConstraint(name = "uk_user_favorite_username_symbol", columnNames = {"username", "symbol"}),
        indexes = @Index(name = "idx_user_favorite_username", columnList = "username")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserFavorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public UserFavorite(String username, String symbol) {
        this.username = username;
        this.symbol = symbol != null ? symbol.toUpperCase().trim() : "";
        this.createdAt = LocalDateTime.now();
    }
}
