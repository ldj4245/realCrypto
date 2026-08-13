package com.realcrypto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.realcrypto.adapter.in.web.dto.TripleArbitrageDto;
import com.realcrypto.adapter.out.exchange.BinanceExchangeClient;
import com.realcrypto.adapter.out.exchange.BithumbExchangeClient;
import com.realcrypto.adapter.out.exchange.UpbitExchangeClient;
import com.realcrypto.application.service.PriceCollectService;
import com.realcrypto.domain.CryptoPrice;

@SpringBootTest
class ExchangeClientTest {

    @Autowired
    private UpbitExchangeClient upbitExchangeClient;

    @Autowired
    private BinanceExchangeClient binanceExchangeClient;

    @Autowired
    private BithumbExchangeClient bithumbExchangeClient;

    @Autowired
    private PriceCollectService priceCollectService;

    @Test
    @DisplayName("업비트 전체/다중 시세 조회 테스트")
    void testUpbitFetchPrices() {
        List<CryptoPrice> prices = upbitExchangeClient.fetchPrices(List.of("KRW-BTC", "KRW-ETH"));
        assertThat(prices).isNotEmpty();
        assertThat(prices.get(0).getTradePrice()).isGreaterThan(0.0);
    }

    @Test
    @DisplayName("빗썸 전체 시세 일괄 조회 테스트")
    void testBithumbFetchAll() {
        List<CryptoPrice> prices = bithumbExchangeClient.fetchAllPrices();
        assertThat(prices).isNotEmpty();
        boolean hasBtc = prices.stream().anyMatch(p -> p.getMarket().contains("BTC"));
        assertThat(hasBtc).isTrue();
    }

    @Test
    @DisplayName("바이낸스 전체 USDT 티커 조회 테스트")
    void testBinanceFetchAll() {
        List<CryptoPrice> prices = binanceExchangeClient.fetchAllPrices();
        assertThat(prices).isNotEmpty();
        boolean hasBtc = prices.stream().anyMatch(p -> p.getMarket().equalsIgnoreCase("BTCUSDT"));
        assertThat(hasBtc).isTrue();
    }

    @Test
    @DisplayName("3대 거래소 일괄 수집 및 김프 연산 테스트")
    void testCollectAndCalculateArbitrage() {
        List<TripleArbitrageDto> list = priceCollectService.collectAllAndCalculateArbitrage(1380.0);
        assertThat(list).isNotEmpty();
        
        // BTC가 포함되어 있는지 확인
        TripleArbitrageDto btc = list.stream()
                .filter(dto -> "BTC".equalsIgnoreCase(dto.getSymbol()))
                .findFirst()
                .orElse(null);

        assertThat(btc).isNotNull();
        assertThat(btc.getNameKr()).isEqualTo("비트코인");
        System.out.println("BTC 김프 결과: Upbit=" + btc.getUpbitPrice() + 
                ", Bithumb=" + btc.getBithumbPrice() + 
                ", Binance USD=" + btc.getBinancePriceUsd() + 
                ", Binance KRW=" + btc.getBinancePriceKrw() + 
                ", Upbit-Binance Premium=" + btc.getUpbitBinancePremium() + "%" +
                ", Bithumb-Binance Premium=" + btc.getBithumbBinancePremium() + "%");
    }
}
