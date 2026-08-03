package com.realcrypto.adapter.out.exchange.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.realcrypto.application.port.out.ExchangeTicker;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpbitTickerDto implements ExchangeTicker {

    @JsonProperty("market")
    private String market;

    @JsonProperty("opening_price")
    private Double openingPrice;

    @JsonProperty("high_price")
    private Double highPrice;

    @JsonProperty("low_price")
    private Double lowPrice;

    @JsonProperty("trade_price")
    private Double tradePrice;

    @JsonProperty("signed_change_rate")
    private Double signedChangeRate;

    @JsonProperty("acc_trade_price_24h")
    private Double accTradePrice24h;

    @Override
    public Double getChangeRate() {
        return this.signedChangeRate != null ? this.signedChangeRate * 100 : 0.0;
    }

    @Override
    public Double getAccTradeValue() {
        return this.accTradePrice24h != null ? this.accTradePrice24h : 0.0;
    }

    @Override
    public String getExchangeName() {
        return "UPBIT";
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
    public String getMarket() {
        return this.market;
    }

    @Override
    public Double getOpeningPrice() {
        return this.openingPrice;
    }

    @Override
    public Double getTradePrice() {
        return this.tradePrice;
    }

}
