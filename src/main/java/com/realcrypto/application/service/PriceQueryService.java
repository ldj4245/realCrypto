package com.realcrypto.application.service;

import com.realcrypto.adapter.out.persistence.entity.CryptoPrice;
import com.realcrypto.application.port.out.CryptoPriceQueryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 💡 팩트: 조회 성능 극대화를 위해 읽기 전용 트랜잭션 적용!
public class PriceQueryService {

    private final CryptoPriceQueryPort priceQueryPort; // 🔌 사령실 조회 단자 주입

    public List<CryptoPrice> getRecentPrices(String exchange, String market, int limit) {
        return priceQueryPort.findRecentPrices(exchange, market, limit);
    }
}
