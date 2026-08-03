package com.realcrypto.adapter.out.exchange;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.realcrypto.application.port.out.ExchangeClientPort;
import com.realcrypto.domain.CryptoPrice;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class BithumbExchangeClient implements ExchangeClientPort {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${bithumb.api.url:https://api.bithumb.com/public/ticker/ALL_KRW}")
    private String bithumbUrl;

    @Override
    public boolean supports(String exchangeName) {
        return "BITHUMB".equalsIgnoreCase(exchangeName);
    }

    @Override
    public CryptoPrice fetchPrice(String market) {
        String symbol = market.toUpperCase().replace("_KRW", "").replace("KRW-", "");
        List<CryptoPrice> all = fetchAllPrices();
        return all.stream()
                .filter(p -> p.getMarket().equalsIgnoreCase(symbol + "_KRW") || p.getMarket().equalsIgnoreCase(market))
                .findFirst()
                .orElseThrow(() -> new BusinessException("지원하지 않는 빗썸 마켓입니다: " + market, ErrorCode.UNSUPPORTED_MARKET));
    }

    @Override
    public List<CryptoPrice> fetchPrices(List<String> markets) {
        List<CryptoPrice> all = fetchAllPrices();
        List<CryptoPrice> filtered = new ArrayList<>();
        for (String m : markets) {
            String symbol = m.toUpperCase().replace("_KRW", "").replace("KRW-", "");
            all.stream()
                    .filter(p -> p.getMarket().equalsIgnoreCase(symbol + "_KRW") || p.getMarket().equalsIgnoreCase(m))
                    .findFirst()
                    .ifPresent(filtered::add);
        }
        return filtered;
    }

    @Override
    public List<CryptoPrice> fetchAllPrices() {
        List<CryptoPrice> prices = new ArrayList<>();
        try {
            String jsonStr = restTemplate.getForObject(bithumbUrl, String.class);
            if (jsonStr == null || jsonStr.isEmpty()) {
                throw new BusinessException("빗썸 응답이 비어 있습니다.", ErrorCode.EXCHANGE_RESPONSE_PARSE_ERROR);
            }

            JsonNode root = objectMapper.readTree(jsonStr);
            String status = root.path("status").asText();
            if (!"0000".equals(status)) {
                throw new BusinessException("빗썸 API 호출 실패 status: " + status, ErrorCode.EXCHANGE_RESPONSE_PARSE_ERROR);
            }

            JsonNode dataNode = root.path("data");
            LocalDateTime now = LocalDateTime.now();

            Iterator<Map.Entry<String, JsonNode>> fields = dataNode.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                String symbol = entry.getKey();
                if ("date".equalsIgnoreCase(symbol)) {
                    continue;
                }

                JsonNode coinNode = entry.getValue();
                try {
                    double opening = coinNode.path("opening_price").asDouble();
                    double closing = coinNode.path("closing_price").asDouble();
                    double min = coinNode.path("min_price").asDouble();
                    double max = coinNode.path("max_price").asDouble();
                    double changeRate = coinNode.path("fluctate_rate_24H").asDouble();
                    double accTradeValue = coinNode.path("acc_trade_value_24H").asDouble();

                    CryptoPrice price = CryptoPrice.builder()
                            .market(symbol + "_KRW")
                            .exchange("BITHUMB")
                            .openingPrice(opening)
                            .highPrice(max)
                            .lowPrice(min)
                            .tradePrice(closing)
                            .changeRate(changeRate)
                            .accTradeValue(accTradeValue)
                            .timestamp(now)
                            .build();

                    prices.add(price);
                } catch (Exception e) {
                    log.trace("빗썸 코인 파싱 스킵 {}: {}", symbol, e.getMessage());
                }
            }
            return prices;
        } catch (HttpStatusCodeException e) {
            if (e.getStatusCode().value() == 429) {
                throw new BusinessException("빗썸 API 호출 제한을 초과했습니다.", ErrorCode.EXCHANGE_RATE_LIMIT_EXCEEDED);
            }
            throw new BusinessException("빗썸 서버 응답 실패: " + e.getResponseBodyAsString(), ErrorCode.EXCHANGE_RESPONSE_PARSE_ERROR);
        } catch (ResourceAccessException e) {
            throw new BusinessException("빗썸 서버 연결 시간이 초과되었습니다.", ErrorCode.EXCHANGE_TIMEOUT);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("빗썸 데이터 파싱 에러: " + e.getMessage(), ErrorCode.EXCHANGE_RESPONSE_PARSE_ERROR);
        }
    }
}
