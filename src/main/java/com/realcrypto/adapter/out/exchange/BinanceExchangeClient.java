package com.realcrypto.adapter.out.exchange;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.realcrypto.adapter.out.exchange.dto.BinanceTickerDto;
import com.realcrypto.application.port.out.ExchangeClientPort;
import com.realcrypto.domain.CryptoPrice;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class BinanceExchangeClient implements ExchangeClientPort {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${binance.api.url:https://api.binance.com/api/v3/ticker/24hr}")
    private String binanceUrl;

    @Override
    public boolean supports(String exchangeName) {
        return "BINANCE".equalsIgnoreCase(exchangeName);
    }

    @Override
    public CryptoPrice fetchPrice(String market) {
        String url = binanceUrl + "?symbol=" + market;
        try {
            BinanceTickerDto response = restTemplate.getForObject(url, BinanceTickerDto.class);
            if (response == null) {
                throw new BusinessException("지원하지 않는 바이낸스 마켓입니다: " + market, ErrorCode.UNSUPPORTED_MARKET);
            }
            return CryptoPrice.builder()
                    .market(response.getMarket())
                    .exchange(response.getExchangeName())
                    .openingPrice(response.getOpeningPrice())
                    .highPrice(response.getHighPrice())
                    .lowPrice(response.getLowPrice())
                    .tradePrice(response.getTradePrice())
                    .changeRate(response.getChangeRate())
                    .accTradeValue(response.getAccTradeValue())
                    .timestamp(LocalDateTime.now())
                    .build();
        } catch (HttpStatusCodeException e) {
            if (e.getStatusCode().value() == 429) {
                throw new BusinessException("바이낸스 API 호출 제한을 초과했습니다.", ErrorCode.EXCHANGE_RATE_LIMIT_EXCEEDED);
            }
            if (e.getStatusCode().is4xxClientError()) {
                throw new BusinessException("바이낸스 마켓 요청이 올바르지 않습니다: " + market, ErrorCode.UNSUPPORTED_MARKET);
            }
            throw new BusinessException("바이낸스 서버 응답 실패: " + e.getResponseBodyAsString(), ErrorCode.EXCHANGE_RESPONSE_PARSE_ERROR);
        } catch (ResourceAccessException e) {
            throw new BusinessException("바이낸스 서버 연결 시간이 초과되었습니다.", ErrorCode.EXCHANGE_TIMEOUT);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("바이낸스 데이터 처리 중 에러 발생: " + e.getMessage(), ErrorCode.EXCHANGE_RESPONSE_PARSE_ERROR);
        }
    }

    @Override
    public List<CryptoPrice> fetchPrices(List<String> markets) {
        List<CryptoPrice> all = fetchAllPrices();
        List<CryptoPrice> filtered = new ArrayList<>();
        for (String m : markets) {
            all.stream()
                    .filter(p -> p.getMarket().equalsIgnoreCase(m) || p.getMarket().equalsIgnoreCase(m + "USDT"))
                    .findFirst()
                    .ifPresent(filtered::add);
        }
        return filtered;
    }

    private static final String BINANCE_VISION_FALLBACK_URL = "https://data-api.binance.vision/api/v3/ticker/24hr";

    @Override
    public List<CryptoPrice> fetchAllPrices() {
        List<CryptoPrice> prices = new ArrayList<>();
        try {
            BinanceTickerDto[] response;
            try {
                response = restTemplate.getForObject(binanceUrl, BinanceTickerDto[].class);
            } catch (HttpStatusCodeException ex) {
                if (ex.getStatusCode().value() == 451 || ex.getStatusCode().value() == 403) {
                    log.info("기본 바이낸스 엔드포인트 지역 제한 감지, 글로벌 미러(data-api.binance.vision)로 전환합니다.");
                    response = restTemplate.getForObject(BINANCE_VISION_FALLBACK_URL, BinanceTickerDto[].class);
                } else {
                    throw ex;
                }
            }

            if (response != null) {
                LocalDateTime now = LocalDateTime.now();
                for (BinanceTickerDto dto : response) {
                    // USDT 마켓만 필터링
                    if (dto.getMarket() != null && dto.getMarket().endsWith("USDT")) {
                        prices.add(CryptoPrice.builder()
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
            }
            return prices;
        } catch (HttpStatusCodeException e) {
            if (e.getStatusCode().value() == 429) {
                throw new BusinessException("바이낸스 API 호출 제한을 초과했습니다.", ErrorCode.EXCHANGE_RATE_LIMIT_EXCEEDED);
            }
            log.error("바이낸스 전체 티커 조회 실패: {}", e.getResponseBodyAsString());
            return prices;
        } catch (Exception e) {
            log.error("바이낸스 전체 티커 처리 중 에러: {}", e.getMessage());
            return prices;
        }
    }
}
