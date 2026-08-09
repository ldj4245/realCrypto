package com.realcrypto.adapter.in.web;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.realcrypto.adapter.in.web.dto.AuthDto;
import com.realcrypto.application.service.AuthService;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;
import com.realcrypto.global.security.JwtTokenProvider;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Validated
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/signup")
    public ResponseEntity<AuthDto.AuthResponse> signup(@Valid @RequestBody AuthDto.SignupRequest request) {
        AuthDto.AuthResponse response = authService.signup(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        AuthDto.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDto.UserInfo> getMe(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BusinessException("로그인이 필요합니다.", ErrorCode.INVALID_INPUT_VALUE);
        }

        String token = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new BusinessException("유효하지 않거나 만료된 토큰입니다.", ErrorCode.INVALID_INPUT_VALUE);
        }

        String username = jwtTokenProvider.getUsernameFromToken(token);
        AuthDto.UserInfo user = authService.getMe(username);
        return ResponseEntity.ok(user);
    }
}
