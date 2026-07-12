package com.realcrypto.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.realcrypto.domain.CryptoPrice;

import com.realcrypto.application.port.out.CryptoPriceSavePort;

@Repository
public interface CryptoPriceRepository extends JpaRepository<CryptoPrice, Long>, CryptoPriceSavePort {

}
