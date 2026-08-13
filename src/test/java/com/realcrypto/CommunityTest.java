package com.realcrypto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;

import com.realcrypto.adapter.in.web.dto.AuthDto;
import com.realcrypto.adapter.in.web.dto.CommunityDto;
import com.realcrypto.application.service.AuthService;
import com.realcrypto.application.service.CommentService;
import com.realcrypto.application.service.PostService;
import com.realcrypto.domain.community.CategoryType;
import com.realcrypto.domain.community.PositionType;

@SpringBootTest
class CommunityTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private PostService postService;

    @Autowired
    private CommentService commentService;

    @Test
    @DisplayName("회원가입 및 로그인 JWT 발급 테스트")
    void testAuth() {
        String testUser = "testuser" + System.currentTimeMillis();
        AuthDto.SignupRequest signupReq = new AuthDto.SignupRequest(testUser, "password123", "테스터" + System.currentTimeMillis(), "test@test.com");
        AuthDto.AuthResponse signupRes = authService.signup(signupReq);
        assertThat(signupRes.getToken()).isNotNull();
        assertThat(signupRes.getUsername()).isEqualTo(testUser);

        AuthDto.LoginRequest loginReq = new AuthDto.LoginRequest(testUser, "password123");
        AuthDto.AuthResponse loginRes = authService.login(loginReq);
        assertThat(loginRes.getToken()).isNotNull();
    }

    @Test
    @DisplayName("게시글 작성, 조회, 추천, 댓글 테스트")
    void testCommunityFlow() {
        // 1. 글 작성
        CommunityDto.CreatePostRequest postReq = new CommunityDto.CreatePostRequest(
                CategoryType.PROFIT_LOSS,
                PositionType.LONG,
                "BTC",
                "비트코인 1억 달성 기념 익절 인증",
                "본문 내용입니다. 모두 성투하세요!",
                25.4
        );
        Long postId = postService.createPost(postReq, "testuser", "테스트작성자");
        assertThat(postId).isNotNull();

        // 2. 글 상세 조회
        CommunityDto.PostDetail detail = postService.getPostDetail(postId, "testuser");
        assertThat(detail.getTitle()).isEqualTo("비트코인 1억 달성 기념 익절 인증");
        assertThat(detail.getProfitRate()).isEqualTo(25.4);
        assertThat(detail.getPosition()).isEqualTo(PositionType.LONG);

        // 3. 댓글 작성
        CommunityDto.CommentItem comment = commentService.createComment(postId, "축하드립니다 부럽네요!", "replyuser", "댓글러");
        assertThat(comment.getId()).isNotNull();
        assertThat(comment.getContent()).isEqualTo("축하드립니다 부럽네요!");

        // 4. 추천(따봉) 테스트
        CommunityDto.VoteResponse voteRes = postService.votePost(postId, true, "voter1");
        assertThat(voteRes.getLikeCount()).isEqualTo(1);
        assertThat(voteRes.getMyVote()).isTrue();

        // 5. 목록 조회
        Page<CommunityDto.PostListItem> page = postService.getPosts(CategoryType.PROFIT_LOSS, null, null, false, 0, 10);
        assertThat(page.getContent()).isNotEmpty();
    }
}
