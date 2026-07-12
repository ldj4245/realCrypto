package com.realcrypto.application.port.out;

import com.realcrypto.domain.CryptoPrice;

public interface ExchangeClientPort {

    // 1. 내가 지원하는 거래소 이름이 맞는지 확인하는 기능
    boolean supports(String exchangeName);

    // 2. 실제 외부 API에서 시세를 가져와서 도메인 엔티티로 변환하는 기능
    CryptoPrice fetchPrice(String market);

}
