package com.realcrypto.application.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.realcrypto.adapter.in.web.dto.CommunityDto;
import com.realcrypto.adapter.out.persistence.CommentRepository;
import com.realcrypto.adapter.out.persistence.PostRepository;
import com.realcrypto.adapter.out.persistence.PostVoteRepository;
import com.realcrypto.domain.community.CategoryType;
import com.realcrypto.domain.community.Comment;
import com.realcrypto.domain.community.PositionType;
import com.realcrypto.domain.community.Post;
import com.realcrypto.domain.community.PostVote;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostVoteRepository postVoteRepository;

    @Transactional(readOnly = true)
    public Page<CommunityDto.PostListItem> getPosts(
            CategoryType category,
            PositionType position,
            String query,
            boolean onlyBest,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage;

        if (onlyBest) {
            postPage = postRepository.findByIsBestTrueOrderByCreatedAtDesc(pageable);
        } else if (query != null && !query.trim().isEmpty()) {
            postPage = postRepository.searchPosts(category, position, query.trim(), pageable);
        } else if (category != null && position != null) {
            postPage = postRepository.findByCategoryAndPositionOrderByCreatedAtDesc(category, position, pageable);
        } else if (category != null) {
            postPage = postRepository.findByCategoryOrderByCreatedAtDesc(category, pageable);
        } else {
            postPage = postRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return postPage.map(p -> CommunityDto.PostListItem.builder()
                .id(p.getId())
                .category(p.getCategory())
                .position(p.getPosition())
                .targetSymbol(p.getTargetSymbol())
                .title(p.getTitle())
                .profitRate(p.getProfitRate())
                .authorNickname(p.getAuthorNickname())
                .viewCount(p.getViewCount())
                .likeCount(p.getLikeCount())
                .commentCount(p.getCommentCount())
                .isBest(p.isBest())
                .createdAt(p.getCreatedAt())
                .build());
    }

    public CommunityDto.PostDetail getPostDetail(Long id, String currentUsername) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new BusinessException("존재하지 않는 게시글입니다.", ErrorCode.INVALID_INPUT_VALUE));

        post.incrementViewCount();

        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(id);
        List<CommunityDto.CommentItem> commentItems = comments.stream()
                .map(c -> CommunityDto.CommentItem.builder()
                        .id(c.getId())
                        .postId(c.getPostId())
                        .authorUsername(c.getAuthorUsername())
                        .authorNickname(c.getAuthorNickname())
                        .content(c.getContent())
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        Boolean myVote = null;
        if (currentUsername != null) {
            Optional<PostVote> vote = postVoteRepository.findByPostIdAndUsername(id, currentUsername);
            if (vote.isPresent()) {
                myVote = vote.get().getIsLike();
            }
        }

        return CommunityDto.PostDetail.builder()
                .id(post.getId())
                .category(post.getCategory())
                .position(post.getPosition())
                .targetSymbol(post.getTargetSymbol())
                .title(post.getTitle())
                .content(post.getContent())
                .profitRate(post.getProfitRate())
                .authorUsername(post.getAuthorUsername())
                .authorNickname(post.getAuthorNickname())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .dislikeCount(post.getDislikeCount())
                .commentCount(comments.size())
                .isBest(post.isBest())
                .myVote(myVote)
                .createdAt(post.getCreatedAt())
                .comments(commentItems)
                .build();
    }

    public Long createPost(CommunityDto.CreatePostRequest req, String username, String nickname) {
        Post post = Post.builder()
                .category(req.getCategory())
                .position(req.getPosition())
                .targetSymbol(req.getTargetSymbol())
                .title(req.getTitle())
                .content(req.getContent())
                .profitRate(req.getProfitRate())
                .authorUsername(username)
                .authorNickname(nickname)
                .build();

        Post saved = postRepository.save(post);
        return saved.getId();
    }

    public void deletePost(Long id, String username) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new BusinessException("존재하지 않는 게시글입니다.", ErrorCode.INVALID_INPUT_VALUE));

        if (!post.getAuthorUsername().equals(username)) {
            throw new BusinessException("본인이 작성한 글만 삭제할 수 있습니다.", ErrorCode.INVALID_INPUT_VALUE);
        }

        postRepository.delete(post);
    }

    public CommunityDto.VoteResponse votePost(Long id, boolean isLike, String username) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new BusinessException("존재하지 않는 게시글입니다.", ErrorCode.INVALID_INPUT_VALUE));

        Optional<PostVote> existingVote = postVoteRepository.findByPostIdAndUsername(id, username);
        Boolean currentMyVote = null;

        if (existingVote.isPresent()) {
            PostVote vote = existingVote.get();
            if (vote.getIsLike() == isLike) {
                // 동일 버튼 다시 누르면 투표 취소
                postVoteRepository.delete(vote);
                currentMyVote = null;
            } else {
                // 반대 버튼 누르면 투표 변경
                vote.updateVote(isLike);
                currentMyVote = isLike;
            }
        } else {
            // 신규 투표
            PostVote newVote = PostVote.builder()
                    .postId(id)
                    .username(username)
                    .isLike(isLike)
                    .build();
            postVoteRepository.save(newVote);
            currentMyVote = isLike;
        }

        int likes = postVoteRepository.countByPostIdAndIsLikeTrue(id);
        int dislikes = postVoteRepository.countByPostIdAndIsLikeFalse(id);
        post.updateLikeCounts(likes, dislikes);

        return CommunityDto.VoteResponse.builder()
                .likeCount(likes)
                .dislikeCount(dislikes)
                .myVote(currentMyVote)
                .isBest(post.isBest())
                .build();
    }
}
