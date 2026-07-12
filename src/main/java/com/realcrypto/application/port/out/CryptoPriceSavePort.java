package com.realcrypto.application.port.out;

import com.realcrypto.domain.CryptoPrice;

public interface CryptoPriceSavePort {
    CryptoPrice save(CryptoPrice price);
}
