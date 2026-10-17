package com.realcrypto.application.port.out;

import com.realcrypto.domain.CryptoPrice;

public interface ExchangeClientPort {

    // 1. 내가 지원하는 거래소 이름이 맞는지 확인하는 기능
    boolean supports(String exchangeName);

    // 2. 실제 외부 API에서 단건 시세를 가져와서 도메인 엔티티로 변환하는 기능
    CryptoPrice fetchPrice(String market);

    // 3. 여러 마켓 시세를 일괄 조회하는 기능
    java.util.List<CryptoPrice> fetchPrices(java.util.List<String> markets);

    // 4. 해당 거래소의 모든 지원 마켓 시세를 일괄 조회하는 기능
    java.util.List<CryptoPrice> fetchAllPrices();

    // 5. 심볼별 한글 종목명 매핑 데이터를 조회하는 기능
    default java.util.Map<String, String> fetchKoreanNames() {
        return java.util.Collections.emptyMap();
    }
}
