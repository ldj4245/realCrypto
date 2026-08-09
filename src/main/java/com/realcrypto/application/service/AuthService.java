package com.realcrypto.application.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.realcrypto.adapter.in.web.dto.AuthDto;
import com.realcrypto.adapter.out.persistence.UserRepository;
import com.realcrypto.domain.user.User;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;
import com.realcrypto.global.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthDto.AuthResponse signup(AuthDto.SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("이미 사용 중인 아이디입니다.", ErrorCode.INVALID_INPUT_VALUE);
        }
        if (userRepository.existsByNickname(request.getNickname())) {
            throw new BusinessException("이미 사용 중인 닉네임입니다.", ErrorCode.INVALID_INPUT_VALUE);
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .email(request.getEmail())
                .role("ROLE_USER")
                .build();

        userRepository.save(user);

        String token = jwtTokenProvider.createToken(user.getUsername(), user.getNickname());
        return AuthDto.AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .nickname(user.getNickname())
                .build();
    }

    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("존재하지 않는 아이디이거나 비밀번호가 올바르지 않습니다.", ErrorCode.INVALID_INPUT_VALUE));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("존재하지 않는 아이디이거나 비밀번호가 올바르지 않습니다.", ErrorCode.INVALID_INPUT_VALUE);
        }

        String token = jwtTokenProvider.createToken(user.getUsername(), user.getNickname());
        return AuthDto.AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .nickname(user.getNickname())
                .build();
    }

    @Transactional(readOnly = true)
    public AuthDto.UserInfo getMe(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다.", ErrorCode.INVALID_INPUT_VALUE));

        return AuthDto.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
