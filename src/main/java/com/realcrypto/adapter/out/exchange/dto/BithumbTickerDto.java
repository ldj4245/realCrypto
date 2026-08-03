package com.realcrypto.adapter.out.exchange.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.realcrypto.application.port.out.ExchangeTicker;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class BithumbTickerDto implements ExchangeTicker {

    private String symbol; // 예: BTC, ETH

    @JsonProperty("opening_price")
    private Double openingPrice;

    @JsonProperty("closing_price")
    private Double closingPrice;

    @JsonProperty("min_price")
    private Double minPrice;

    @JsonProperty("max_price")
    private Double maxPrice;

    @JsonProperty("fluctate_rate_24H")
    private Double fluctuateRate24H;

    @JsonProperty("acc_trade_value_24H")
    private Double accTradeValue24H;

    @Override
    public String getMarket() {
        return (this.symbol != null ? this.symbol : "") + "_KRW";
    }

    @Override
    public String getExchangeName() {
        return "BITHUMB";
    }

    @Override
    public Double getOpeningPrice() {
        return this.openingPrice;
    }

    @Override
    public Double getHighPrice() {
        return this.maxPrice;
    }

    @Override
    public Double getLowPrice() {
        return this.minPrice;
    }

    @Override
    public Double getTradePrice() {
        return this.closingPrice;
    }

    @Override
    public Double getChangeRate() {
        return this.fluctuateRate24H != null ? this.fluctuateRate24H : 0.0;
    }

    @Override
    public Double getAccTradeValue() {
        return this.accTradeValue24H != null ? this.accTradeValue24H : 0.0;
    }
}
