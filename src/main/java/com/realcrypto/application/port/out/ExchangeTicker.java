package com.realcrypto.application.port.out;

public interface ExchangeTicker {
    String getMarket();          // 코인 마켓명 (예: KRW-BTC)
    String getExchangeName();    // 거래소 이름 (예: UPBIT, BINANCE)
    Double getOpeningPrice();    // 시가
    Double getHighPrice();       // 고가
    Double getLowPrice();        // 저가
    Double getTradePrice();      // 종가 (현재가)
}
