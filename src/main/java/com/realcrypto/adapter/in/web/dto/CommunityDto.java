package com.realcrypto.adapter.in.web.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.realcrypto.domain.community.CategoryType;
import com.realcrypto.domain.community.PositionType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class CommunityDto {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreatePostRequest {
        @NotNull(message = "카테고리를 선택해주세요.")
        private CategoryType category;

        private PositionType position; // LONG, SHORT, NEUTRAL
        private String targetSymbol;   // BTC, XRP 등

        @NotBlank(message = "제목을 입력해주세요.")
        @Size(min = 2, max = 100, message = "제목은 2~100자 사이여야 합니다.")
        private String title;

        @NotBlank(message = "내용을 입력해주세요.")
        private String content;

        private Double profitRate; // 익절/손절 수익률 (%)
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostListItem {
        private Long id;
        private CategoryType category;
        private PositionType position;
        private String targetSymbol;
        private String title;
        private Double profitRate;
        private String authorNickname;
        private int viewCount;
        private int likeCount;
        private int commentCount;
        private boolean isBest;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostDetail {
        private Long id;
        private CategoryType category;
        private PositionType position;
        private String targetSymbol;
        private String title;
        private String content;
        private Double profitRate;
        private String authorUsername;
        private String authorNickname;
        private int viewCount;
        private int likeCount;
        private int dislikeCount;
        private int commentCount;
        private boolean isBest;
        private Boolean myVote; // null: 미투표, true: 추천, false: 비추천
        private LocalDateTime createdAt;
        private List<CommentItem> comments;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateCommentRequest {
        @NotBlank(message = "댓글 내용을 입력해주세요.")
        private String content;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommentItem {
        private Long id;
        private Long postId;
        private String authorUsername;
        private String authorNickname;
        private String content;
        private LocalDateTime createdAt;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoteRequest {
        @NotNull
        private Boolean isLike; // true: 추천, false: 비추천
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoteResponse {
        private int likeCount;
        private int dislikeCount;
        private Boolean myVote;
        private boolean isBest;
    }
}
