package com.realcrypto.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.realcrypto.adapter.out.persistence.entity.CryptoPrice;

@Repository
public interface CryptoPriceRepository extends JpaRepository<CryptoPrice, Long> {

}
