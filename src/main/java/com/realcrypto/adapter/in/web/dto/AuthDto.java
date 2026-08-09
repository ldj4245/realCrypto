package com.realcrypto.adapter.in.web.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class AuthDto {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignupRequest {
        @NotBlank(message = "아이디를 입력해주세요.")
        @Size(min = 3, max = 20, message = "아이디는 3~20자 사이여야 합니다.")
        private String username;

        @NotBlank(message = "비밀번호를 입력해주세요.")
        @Size(min = 4, max = 30, message = "비밀번호는 4~30자 사이여야 합니다.")
        private String password;

        @NotBlank(message = "닉네임을 입력해주세요.")
        @Size(min = 2, max = 15, message = "닉네임은 2~15자 사이여야 합니다.")
        private String nickname;

        private String email;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "아이디를 입력해주세요.")
        private String username;

        @NotBlank(message = "비밀번호를 입력해주세요.")
        private String password;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String username;
        private String nickname;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String username;
        private String nickname;
        private String email;
        private String role;
        private LocalDateTime createdAt;
    }
}
