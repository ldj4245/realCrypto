package com.realcrypto.adapter.in.web;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.realcrypto.adapter.in.web.dto.CommunityDto;
import com.realcrypto.application.service.CommentService;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;
import com.realcrypto.global.security.JwtTokenProvider;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Validated
public class CommentController {

    private final CommentService commentService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<CommunityDto.CommentItem> createComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommunityDto.CreateCommentRequest request,
            @RequestHeader("Authorization") String authHeader) {

        String token = extractToken(authHeader);
        String username = jwtTokenProvider.getUsernameFromToken(token);
        String nickname = jwtTokenProvider.getNicknameFromToken(token);

        CommunityDto.CommentItem comment = commentService.createComment(postId, request.getContent(), username, nickname);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @RequestHeader("Authorization") String authHeader) {

        String token = extractToken(authHeader);
        String username = jwtTokenProvider.getUsernameFromToken(token);

        commentService.deleteComment(commentId, username);
        return ResponseEntity.ok().build();
    }

    private String extractToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BusinessException("로그인이 필요합니다.", ErrorCode.INVALID_INPUT_VALUE);
        }
        String token = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new BusinessException("유효하지 않거나 만료된 토큰입니다.", ErrorCode.INVALID_INPUT_VALUE);
        }
        return token;
    }
}
