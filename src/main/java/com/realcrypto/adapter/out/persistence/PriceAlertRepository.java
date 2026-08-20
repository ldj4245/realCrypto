package com.realcrypto.adapter.out.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.realcrypto.domain.user.PriceAlert;

public interface PriceAlertRepository extends JpaRepository<PriceAlert, Long> {

    List<PriceAlert> findByUsernameOrderByCreatedAtDesc(String username);

    Optional<PriceAlert> findByIdAndUsername(Long id, String username);
}
