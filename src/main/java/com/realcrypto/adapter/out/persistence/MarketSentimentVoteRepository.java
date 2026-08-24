package com.realcrypto.adapter.out.persistence;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.realcrypto.domain.community.MarketSentimentVote;
import com.realcrypto.domain.community.PositionType;

@Repository
public interface MarketSentimentVoteRepository extends JpaRepository<MarketSentimentVote, Long> {

    Optional<MarketSentimentVote> findByVoteDateAndVoterKey(LocalDate voteDate, String voterKey);

    long countByVoteDateAndPosition(LocalDate voteDate, PositionType position);
}
