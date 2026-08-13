package com.realcrypto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.realcrypto.adapter.in.web.dto.CryptoNewsDto;
import com.realcrypto.adapter.out.exchange.BinanceFuturesClient;
import com.realcrypto.adapter.out.exchange.FearGreedClient;
import com.realcrypto.application.service.CryptoInsightService;

@SpringBootTest
class InsightTest {

    @Autowired
    private BinanceFuturesClient binanceFuturesClient;

    @Autowired
    private FearGreedClient fearGreedClient;

    @Autowired
    private CryptoInsightService cryptoInsightService;

    @Test
    @DisplayName("바이낸스 선물 펀딩비 조회 테스트")
    void testFundingRates() {
        Map<String, BinanceFuturesClient.FundingRateDto> rates = binanceFuturesClient.fetchFundingRates();
        assertThat(rates).isNotNull();
        // BTC 펀딩비 확인
        if (rates.containsKey("BTC")) {
            BinanceFuturesClient.FundingRateDto btc = rates.get("BTC");
            assertThat(btc.getSymbol()).isEqualTo("BTC");
            assertThat(btc.getFundingRatePercent()).isNotNull();
        }
    }

    @Test
    @DisplayName("공포·탐욕 지수 조회 테스트")
    void testFearGreedIndex() {
        FearGreedClient.FearGreedResponse res = fearGreedClient.fetchFearGreedIndex();
        assertThat(res).isNotNull();
        assertThat(res.getCurrent()).isNotNull();
        assertThat(res.getCurrent().getValue()).isBetween(0, 100);
    }

    @Test
    @DisplayName("속보, 고래 알림 및 차익거래 실순익 계산기 테스트")
    void testInsightsAndCalculator() {
        List<CryptoNewsDto.FastNewsItem> news = cryptoInsightService.getFastNews();
        assertThat(news).isNotEmpty();

        List<CryptoNewsDto.WhaleAlertItem> whales = cryptoInsightService.getWhaleAlerts();
        assertThat(whales).isNotEmpty();

        CryptoNewsDto.ArbitrageCalcResponse calc = cryptoInsightService.calculateArbitrage(10000000);
        assertThat(calc).isNotNull();
        assertThat(calc.getRoutes()).isNotEmpty();
        assertThat(calc.getRoutes().get(0).getCoinSymbol()).isNotNull();
    }
}
