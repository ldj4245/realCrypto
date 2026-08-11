package com.realcrypto.adapter.in.web;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.realcrypto.adapter.in.web.dto.CommunityDto;
import com.realcrypto.application.service.PostService;
import com.realcrypto.domain.community.CategoryType;
import com.realcrypto.domain.community.PositionType;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;
import com.realcrypto.global.security.JwtTokenProvider;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Validated
public class PostController {

    private final PostService postService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<Page<CommunityDto.PostListItem>> getPosts(
            @RequestParam(required = false) CategoryType category,
            @RequestParam(required = false) PositionType position,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "false") boolean onlyBest,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<CommunityDto.PostListItem> posts = postService.getPosts(category, position, query, onlyBest, page, size);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommunityDto.PostDetail> getPostDetail(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtTokenProvider.validateToken(token)) {
                username = jwtTokenProvider.getUsernameFromToken(token);
            }
        }

        CommunityDto.PostDetail detail = postService.getPostDetail(id, username);
        return ResponseEntity.ok(detail);
    }

    @PostMapping
    public ResponseEntity<Long> createPost(
            @Valid @RequestBody CommunityDto.CreatePostRequest request,
            @RequestHeader("Authorization") String authHeader) {

        String token = extractToken(authHeader);
        String username = jwtTokenProvider.getUsernameFromToken(token);
        String nickname = jwtTokenProvider.getNicknameFromToken(token);

        Long postId = postService.createPost(request, username, nickname);
        return ResponseEntity.ok(postId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {

        String token = extractToken(authHeader);
        String username = jwtTokenProvider.getUsernameFromToken(token);

        postService.deletePost(id, username);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<CommunityDto.VoteResponse> votePost(
            @PathVariable Long id,
            @Valid @RequestBody CommunityDto.VoteRequest request,
            @RequestHeader("Authorization") String authHeader) {

        String token = extractToken(authHeader);
        String username = jwtTokenProvider.getUsernameFromToken(token);

        CommunityDto.VoteResponse response = postService.votePost(id, request.getIsLike(), username);
        return ResponseEntity.ok(response);
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
