package com.realcrypto.adapter.out.exchange;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.realcrypto.adapter.out.exchange.dto.UpbitTickerDto;
import com.realcrypto.application.port.out.ExchangeClientPort;
import com.realcrypto.domain.CryptoPrice;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class UpbitExchangeClient implements ExchangeClientPort {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${upbit.api.url:https://api.upbit.com/v1/ticker}")
    private String upbitUrl;

    private List<String> cachedKrwMarkets = new ArrayList<>();
    private long lastMarketFetchTime = 0;

    @Override
    public boolean supports(String exchangeName) {
        return "UPBIT".equalsIgnoreCase(exchangeName);
    }

    @Override
    public CryptoPrice fetchPrice(String market) {
        List<CryptoPrice> prices = fetchPrices(List.of(market));
        if (prices.isEmpty()) {
            throw new BusinessException("지원하지 않는 업비트 마켓입니다: " + market, ErrorCode.UNSUPPORTED_MARKET);
        }
        return prices.get(0);
    }

    @Override
    public List<CryptoPrice> fetchPrices(List<String> markets) {
        if (markets == null || markets.isEmpty()) {
            return List.of();
        }

        List<CryptoPrice> result = new ArrayList<>();
        // 업비트 ticker API는 한 번에 여러 마켓을 콤마(,)로 연결해 요청 가능 (권장 50~100개씩 청크)
        int chunkSize = 80;
        for (int i = 0; i < markets.size(); i += chunkSize) {
            List<String> subList = markets.subList(i, Math.min(i + chunkSize, markets.size()));
            String marketsParam = String.join(",", subList);
            String url = upbitUrl + "?markets=" + marketsParam;

            try {
                UpbitTickerDto[] response = restTemplate.getForObject(url, UpbitTickerDto[].class);
                if (response != null) {
                    LocalDateTime now = LocalDateTime.now();
                    for (UpbitTickerDto dto : response) {
                        result.add(CryptoPrice.builder()
                                .market(dto.getMarket())
                                .exchange(dto.getExchangeName())
                                .openingPrice(dto.getOpeningPrice())
                                .highPrice(dto.getHighPrice())
                                .lowPrice(dto.getLowPrice())
                                .tradePrice(dto.getTradePrice())
                                .changeRate(dto.getChangeRate())
                                .accTradeValue(dto.getAccTradeValue())
                                .timestamp(now)
                                .build());
                    }
                }
            } catch (HttpStatusCodeException e) {
                if (e.getStatusCode().value() == 429) {
                    throw new BusinessException("업비트 API 호출 제한을 초과했습니다.", ErrorCode.EXCHANGE_RATE_LIMIT_EXCEEDED);
                }
                log.error("업비트 청크 시세 조회 실패: {}", e.getResponseBodyAsString());
            } catch (ResourceAccessException e) {
                throw new BusinessException("업비트 서버 연결 시간이 초과되었습니다.", ErrorCode.EXCHANGE_TIMEOUT);
            } catch (Exception e) {
                log.error("업비트 데이터 처리 중 에러 발생: {}", e.getMessage());
            }
        }
        return result;
    }

    @Override
    public List<CryptoPrice> fetchAllPrices() {
        List<String> krwMarkets = getKrwMarkets();
        return fetchPrices(krwMarkets);
    }

    private synchronized List<String> getKrwMarkets() {
        long now = System.currentTimeMillis();
        // 1시간마다 마켓 목록 갱신
        if (!cachedKrwMarkets.isEmpty() && (now - lastMarketFetchTime < 3600_000)) {
            return cachedKrwMarkets;
        }

        try {
            String marketUrl = "https://api.upbit.com/v1/market/all?isDetails=false";
            String response = restTemplate.getForObject(marketUrl, String.class);
            if (response != null) {
                JsonNode arrayNode = objectMapper.readTree(response);
                List<String> markets = new ArrayList<>();
                for (JsonNode item : arrayNode) {
                    String market = item.path("market").asText();
                    if (market.startsWith("KRW-")) {
                        markets.add(market);
                    }
                }
                if (!markets.isEmpty()) {
                    cachedKrwMarkets = markets;
                    lastMarketFetchTime = now;
                    return cachedKrwMarkets;
                }
            }
        } catch (Exception e) {
            log.warn("업비트 마켓 리스트 조회 실패, 기본 마켓 사용: {}", e.getMessage());
        }

        if (cachedKrwMarkets.isEmpty()) {
            cachedKrwMarkets = Arrays.asList(
                    "KRW-BTC", "KRW-ETH", "KRW-XRP", "KRW-SOL", "KRW-DOGE", "KRW-ADA", "KRW-AVAX", "KRW-DOT",
                    "KRW-NEAR", "KRW-LINK", "KRW-SHIB", "KRW-ETC", "KRW-SUI", "KRW-APT", "KRW-TRX", "KRW-BCH");
        }
        return cachedKrwMarkets;
    }
}
