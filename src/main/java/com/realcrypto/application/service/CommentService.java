package com.realcrypto.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.realcrypto.adapter.in.web.dto.CommunityDto;
import com.realcrypto.adapter.out.persistence.CommentRepository;
import com.realcrypto.adapter.out.persistence.PostRepository;
import com.realcrypto.domain.community.Comment;
import com.realcrypto.domain.community.Post;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    public CommunityDto.CommentItem createComment(Long postId, String content, String username, String nickname) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException("존재하지 않는 게시글입니다.", ErrorCode.INVALID_INPUT_VALUE));

        Comment comment = Comment.builder()
                .postId(postId)
                .authorUsername(username)
                .authorNickname(nickname)
                .content(content)
                .build();

        Comment saved = commentRepository.save(comment);

        int count = commentRepository.countByPostId(postId);
        post.updateCommentCount(count);

        return CommunityDto.CommentItem.builder()
                .id(saved.getId())
                .postId(saved.getPostId())
                .authorUsername(saved.getAuthorUsername())
                .authorNickname(saved.getAuthorNickname())
                .content(saved.getContent())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    public void deleteComment(Long commentId, String username) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException("존재하지 않는 댓글입니다.", ErrorCode.INVALID_INPUT_VALUE));

        if (!comment.getAuthorUsername().equals(username)) {
            throw new BusinessException("본인이 작성한 댓글만 삭제할 수 있습니다.", ErrorCode.INVALID_INPUT_VALUE);
        }

        Long postId = comment.getPostId();
        commentRepository.delete(comment);

        postRepository.findById(postId).ifPresent(post -> {
            int count = commentRepository.countByPostId(postId);
            post.updateCommentCount(count);
        });
    }
}
