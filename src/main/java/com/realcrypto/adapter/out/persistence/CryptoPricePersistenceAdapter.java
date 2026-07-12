package com.realcrypto.adapter.out.persistence;

import com.realcrypto.application.port.out.CryptoPriceSavePort;
import com.realcrypto.domain.CryptoPrice;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CryptoPricePersistenceAdapter implements CryptoPriceSavePort {

    private final CryptoPriceRepository cryptoPriceRepository;

    @Override
    public CryptoPrice save(CryptoPrice price) {
        return cryptoPriceRepository.save(price);
    }
}
