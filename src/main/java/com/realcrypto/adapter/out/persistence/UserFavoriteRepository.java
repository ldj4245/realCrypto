package com.realcrypto.adapter.out.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.realcrypto.domain.user.UserFavorite;

public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {

    List<UserFavorite> findByUsernameOrderByCreatedAtAsc(String username);

    Optional<UserFavorite> findByUsernameAndSymbol(String username, String symbol);

    void deleteByUsernameAndSymbol(String username, String symbol);
}
