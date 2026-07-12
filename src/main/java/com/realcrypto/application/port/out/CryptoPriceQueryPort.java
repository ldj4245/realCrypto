package com.realcrypto.application.port.out;

import java.util.List;

import com.realcrypto.domain.CryptoPrice;

public interface CryptoPriceQueryPort {

    List<CryptoPrice> findRecentPrices(String exchange, String market, int limit);
}
