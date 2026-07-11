package com.realcrypto.adapter.out.exchange;

import com.realcrypto.adapter.out.persistence.entity.CryptoPrice;

public interface ExchangeClient {

    // 1. 내가 지원하는 거래소 이름이 맞는지 확인하는 기능 Upbit, Binance인지
    boolean supports(String exchangeName);

    // 2. 실제 외부 API에서 시세를 가져와서 DB Entity로 변환하는 기능
    CryptoPrice fetchPrice(String market);

}