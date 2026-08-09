package com.realcrypto.domain.user;

import java.time.LocalDateTime;

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
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username; // 로그인 아이디

    @Column(nullable = false, length = 200)
    private String password; // 암호화된 비밀번호

    @Column(nullable = false, unique = true, length = 50)
    private String nickname; // 표시 닉네임

    @Column(length = 100)
    private String email;

    @Column(nullable = false)
    private String role; // ROLE_USER, ROLE_ADMIN

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public User(String username, String password, String nickname, String email, String role) {
        this.username = username;
        this.password = password;
        this.nickname = nickname;
        this.email = email;
        this.role = (role != null) ? role : "ROLE_USER";
        this.createdAt = LocalDateTime.now();
    }
}
