package com.realcrypto.application.port.in;

import com.realcrypto.domain.CryptoPrice;
import java.util.List;

public interface PriceQueryUseCase {
    // 💡 최신 수집된 시세를 조건에 따라 필터링하여 사용자에게 보여주는 규칙
    List<CryptoPrice> getRecentPrices(String exchange, String market, int limit);
}
