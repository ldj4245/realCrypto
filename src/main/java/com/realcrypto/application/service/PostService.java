package com.realcrypto.application.service;

import java.time.LocalDate;
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
import com.realcrypto.adapter.out.persistence.MarketSentimentVoteRepository;
import com.realcrypto.adapter.out.persistence.PostRepository;
import com.realcrypto.adapter.out.persistence.PostVoteRepository;
import com.realcrypto.domain.community.CategoryType;
import com.realcrypto.domain.community.Comment;
import com.realcrypto.domain.community.MarketSentimentVote;
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
    private final MarketSentimentVoteRepository sentimentVoteRepository;

    @Transactional(readOnly = true)
    public Page<CommunityDto.PostListItem> getPosts(
            CategoryType category,
            PositionType position,
            String query,
            boolean onlyBest,
            int page,
            int size) {
        return getPosts(category, position, null, null, query, onlyBest, page, size);
    }

    @Transactional(readOnly = true)
    public Page<CommunityDto.PostListItem> getPosts(
            CategoryType category,
            PositionType position,
            String symbol,
            String query,
            boolean onlyBest,
            int page,
            int size) {
        return getPosts(category, position, symbol, null, query, onlyBest, page, size);
    }

    @Transactional(readOnly = true)
    public Page<CommunityDto.PostListItem> getPosts(
            CategoryType category,
            PositionType position,
            String symbol,
            String authorUsername,
            String query,
            boolean onlyBest,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage;
        String cleanSymbol = (symbol != null && !symbol.trim().isEmpty()) ? symbol.trim().toUpperCase() : null;
        String cleanAuthor = (authorUsername != null && !authorUsername.trim().isEmpty()) ? authorUsername.trim() : null;
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;

        if (onlyBest) {
            postPage = postRepository.findByIsBestTrueOrderByCreatedAtDesc(pageable);
        } else if (cleanQuery != null || cleanSymbol != null || cleanAuthor != null) {
            postPage = postRepository.searchPosts(category, position, cleanSymbol, cleanAuthor, cleanQuery, pageable);
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
                .authorUsername(p.getAuthorUsername())
                .authorNickname(p.getAuthorNickname())
                .viewCount(p.getViewCount())
                .likeCount(p.getLikeCount())
                .commentCount(p.getCommentCount())
                .isBest(p.isBest())
                .createdAt(p.getCreatedAt())
                .build());
    }

    public CommunityDto.PostDetail getPostDetail(Long id, String currentUsername) {
        int updated = postRepository.incrementViewCountAtomically(id);
        if (updated == 0) {
            throw new BusinessException("존재하지 않는 게시글입니다.", ErrorCode.INVALID_INPUT_VALUE);
        }

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new BusinessException("존재하지 않는 게시글입니다.", ErrorCode.INVALID_INPUT_VALUE));

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

    public Long updatePost(Long id, CommunityDto.CreatePostRequest req, String username) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new BusinessException("존재하지 않는 게시글입니다.", ErrorCode.INVALID_INPUT_VALUE));

        if (!post.getAuthorUsername().equals(username)) {
            throw new BusinessException("본인이 작성한 글만 수정할 수 있습니다.", ErrorCode.INVALID_INPUT_VALUE);
        }

        String normalizedSymbol = (req.getTargetSymbol() != null && !req.getTargetSymbol().trim().isEmpty())
                ? req.getTargetSymbol().trim().toUpperCase()
                : null;

        post.update(
                req.getTitle(),
                req.getContent(),
                req.getCategory(),
                req.getPosition() != null ? req.getPosition() : PositionType.NEUTRAL,
                normalizedSymbol,
                req.getProfitRate()
        );
        return post.getId();
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
                postVoteRepository.delete(vote);
                currentMyVote = null;
            } else {
                vote.updateVote(isLike);
                currentMyVote = isLike;
            }
        } else {
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

    @Transactional(readOnly = true)
    public CommunityDto.SentimentVoteResponse getDailySentiment(String voterKey) {
        LocalDate today = LocalDate.now();
        long longCount = sentimentVoteRepository.countByVoteDateAndPosition(today, PositionType.LONG);
        long shortCount = sentimentVoteRepository.countByVoteDateAndPosition(today, PositionType.SHORT);
        long total = longCount + shortCount;

        int longPct = total > 0 ? (int) Math.round((longCount * 100.0) / total) : 50;
        int shortPct = total > 0 ? (100 - longPct) : 50;

        PositionType myPos = null;
        if (voterKey != null && !voterKey.isBlank()) {
            Optional<MarketSentimentVote> vote = sentimentVoteRepository.findByVoteDateAndVoterKey(today, voterKey);
            if (vote.isPresent()) {
                myPos = vote.get().getPosition();
            }
        }

        return CommunityDto.SentimentVoteResponse.builder()
                .longCount(longCount)
                .shortCount(shortCount)
                .longPercent(longPct)
                .shortPercent(shortPct)
                .myPosition(myPos)
                .build();
    }

    public CommunityDto.SentimentVoteResponse voteDailySentiment(String voterKey, PositionType position) {
        if (position != PositionType.LONG && position != PositionType.SHORT) {
            throw new BusinessException("롱 또는 숏 포지션만 투표할 수 있습니다.", ErrorCode.INVALID_INPUT_VALUE);
        }
        if (voterKey == null || voterKey.isBlank()) {
            throw new BusinessException("투표 식별자가 필요합니다.", ErrorCode.INVALID_INPUT_VALUE);
        }

        LocalDate today = LocalDate.now();
        Optional<MarketSentimentVote> existing = sentimentVoteRepository.findByVoteDateAndVoterKey(today, voterKey);

        if (existing.isPresent()) {
            MarketSentimentVote vote = existing.get();
            if (vote.getPosition() == position) {
                sentimentVoteRepository.delete(vote);
            } else {
                vote.updatePosition(position);
            }
        } else {
            MarketSentimentVote created = MarketSentimentVote.builder()
                    .voteDate(today)
                    .voterKey(voterKey)
                    .position(position)
                    .build();
            sentimentVoteRepository.save(created);
        }

        sentimentVoteRepository.flush();
        return getDailySentiment(voterKey);
    }
}
