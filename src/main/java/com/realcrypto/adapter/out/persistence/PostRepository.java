package com.realcrypto.adapter.out.persistence;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.realcrypto.domain.community.CategoryType;
import com.realcrypto.domain.community.PositionType;
import com.realcrypto.domain.community.Post;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Post> findByCategoryOrderByCreatedAtDesc(CategoryType category, Pageable pageable);

    Page<Post> findByIsBestTrueOrderByCreatedAtDesc(Pageable pageable);

    Page<Post> findByCategoryAndPositionOrderByCreatedAtDesc(CategoryType category, PositionType position, Pageable pageable);

    Page<Post> findByTargetSymbolIgnoreCaseOrderByCreatedAtDesc(String targetSymbol, Pageable pageable);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    int incrementViewCountAtomically(@Param("id") Long id);

    @Query("SELECT p FROM Post p WHERE " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:position IS NULL OR p.position = :position) AND " +
           "(:symbol IS NULL OR UPPER(p.targetSymbol) = UPPER(:symbol)) AND " +
           "(:authorUsername IS NULL OR p.authorUsername = :authorUsername) AND " +
           "(:query IS NULL OR p.title LIKE %:query% OR p.content LIKE %:query% OR p.authorNickname LIKE %:query% OR p.targetSymbol LIKE %:query%) " +
           "ORDER BY p.createdAt DESC")
    Page<Post> searchPosts(
            @Param("category") CategoryType category,
            @Param("position") PositionType position,
            @Param("symbol") String symbol,
            @Param("authorUsername") String authorUsername,
            @Param("query") String query,
            Pageable pageable);
}
