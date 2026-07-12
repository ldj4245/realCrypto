package com.realcrypto.application.service;

import com.realcrypto.domain.CryptoPrice;
import com.realcrypto.application.port.in.PriceQueryUseCase;
import com.realcrypto.application.port.out.CryptoPriceQueryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PriceQueryService implements PriceQueryUseCase {

    private final CryptoPriceQueryPort priceQueryPort;

    @Override
    public List<CryptoPrice> getRecentPrices(String exchange, String market, int limit) {
        return priceQueryPort.findRecentPrices(exchange, market, limit);
    }
}
