package com.realcrypto.adapter.out.exchange.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.realcrypto.application.port.out.ExchangeTicker;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BinanceTickerDto implements ExchangeTicker {

    @JsonProperty("symbol")
    private String symbol;

    @JsonProperty("openPrice")
    private Double openPrice;

    @JsonProperty("highPrice")
    private Double highPrice;

    @JsonProperty("lowPrice")
    private Double lowPrice;

    @JsonProperty("lastPrice")
    private Double lastPrice;

    // 🔌 C타입 단자(ExchangeTicker) 규칙 구현하기!
    @Override
    public String getMarket() {
        return this.symbol; // 바이낸스는 symbol이 마켓명(예: BTCUSDT)입니다.
    }

    @Override
    public String getExchangeName() {
        return "BINANCE";
    }

    @Override
    public Double getOpeningPrice() {
        return this.openPrice;
    }

    @Override
    public Double getHighPrice() {
        return this.highPrice;
    }

    @Override
    public Double getLowPrice() {
        return this.lowPrice;
    }

    @Override
    public Double getTradePrice() {
        return this.lastPrice; // 바이낸스는 lastPrice가 현재 종가(현재가)입니다.
    }
}
