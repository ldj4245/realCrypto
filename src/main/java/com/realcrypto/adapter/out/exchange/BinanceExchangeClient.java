package com.realcrypto.adapter.out.exchange;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;

import com.realcrypto.adapter.out.persistence.entity.CryptoPrice;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;
import com.realcrypto.adapter.out.exchange.dto.BinanceTickerDto;

@Component
public class BinanceExchangeClient implements ExchangeClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${binance.api.url}")
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
            
            return CryptoPrice.from(response);
            
        } catch (HttpStatusCodeException e) {
            // 1. API 호출 제한 (HTTP 429 Too Many Requests) 감지
            if (e.getStatusCode().value() == 429) {
                throw new BusinessException("바이낸스 API 호출 제한을 초과했습니다.", ErrorCode.EXCHANGE_RATE_LIMIT_EXCEEDED);
            }
            // 2. 잘못된 요청 (HTTP 400 Bad Request 등) 감지
            if (e.getStatusCode().is4xxClientError()) {
                throw new BusinessException("바이낸스 마켓 요청이 올바르지 않습니다: " + market, ErrorCode.UNSUPPORTED_MARKET);
            }
            // 3. 기타 서버 에러 응답 감지
            throw new BusinessException("바이낸스 서버 응답 실패: " + e.getResponseBodyAsString(), ErrorCode.EXCHANGE_RESPONSE_PARSE_ERROR);
            
        } catch (ResourceAccessException e) {
            // 4. 네트워크 지연 및 타임아웃 감지
            throw new BusinessException("바이낸스 서버 연결 시간이 초과되었습니다.", ErrorCode.EXCHANGE_TIMEOUT);
            
        } catch (Exception e) {
            // 5. 기타 파싱 실패나 예기치 못한 에러
            throw new BusinessException("바이낸스 데이터 처리 중 에러 발생: " + e.getMessage(), ErrorCode.EXCHANGE_RESPONSE_PARSE_ERROR);
        }
    }
}
