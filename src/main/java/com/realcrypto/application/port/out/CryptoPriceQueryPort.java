package com.realcrypto.application.port.out;

import com.realcrypto.adapter.out.persistence.entity.CryptoPrice;
import java.util.List;

public interface CryptoPriceQueryPort {
    // 💡 헥사고날 아키텍처 규칙에 따라 사령실(Service) 영역에 정의하는 조회 아웃풋 포트
    List<CryptoPrice> findRecentPrices(String exchange, String market, int limit);
}
