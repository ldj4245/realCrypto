package com.realcrypto.adapter.out.persistence;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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

    @Query("SELECT p FROM Post p WHERE " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:position IS NULL OR p.position = :position) AND " +
           "(:query IS NULL OR p.title LIKE %:query% OR p.content LIKE %:query% OR p.authorNickname LIKE %:query% OR p.targetSymbol LIKE %:query%) " +
           "ORDER BY p.createdAt DESC")
    Page<Post> searchPosts(
            @Param("category") CategoryType category,
            @Param("position") PositionType position,
            @Param("query") String query,
            Pageable pageable);
}
