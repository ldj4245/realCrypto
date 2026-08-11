package com.realcrypto.adapter.out.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.realcrypto.domain.community.PostVote;

@Repository
public interface PostVoteRepository extends JpaRepository<PostVote, Long> {

    Optional<PostVote> findByPostIdAndUsername(Long postId, String username);

    int countByPostIdAndIsLikeTrue(Long postId);

    int countByPostIdAndIsLikeFalse(Long postId);
}
