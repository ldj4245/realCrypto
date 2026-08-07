package com.realcrypto.adapter.in.web;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.realcrypto.adapter.in.web.dto.TripleArbitrageDto;
import com.realcrypto.application.port.out.CryptoPriceQueryPort;
import com.realcrypto.application.service.PriceCollectService;
import com.realcrypto.domain.CryptoPrice;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CryptoPriceController {

    private final CryptoPriceQueryPort priceQueryPort;
    private final PriceCollectService priceCollectService;

    /**
     * 3대 거래소(업비트, 빗썸, 바이낸스) 전체 종목 실시간 김프 목록 조회
     */
    @GetMapping("/api/arbitrage/all")
    public List<TripleArbitrageDto> getAllArbitrage(
            @RequestParam(defaultValue = "1380.0") double rate,
            @RequestParam(defaultValue = "false") boolean refresh) {
        
        if (refresh) {
            return priceCollectService.collectAllAndCalculateArbitrage(rate);
        }
        
        List<TripleArbitrageDto> cached = priceCollectService.getAllArbitrage();
        if (cached == null || cached.isEmpty()) {
            return priceCollectService.collectAllAndCalculateArbitrage(rate);
        }
        return cached;
    }

    /**
     * 주요 메이저 코인(BTC, ETH, SOL, XRP) 요약 김프 조회
     */
    @GetMapping("/api/arbitrage/summary")
    public List<TripleArbitrageDto> getSummaryArbitrage() {
        return priceCollectService.getSummaryArbitrage();
    }

    /**
     * 공식 실시간 USD/KRW 환율 조회
     */
    @GetMapping("/api/arbitrage/exchange-rate")
    public java.util.Map<String, Object> getExchangeRate() {
        double liveRate = priceCollectService.getLiveExchangeRate();
        return java.util.Map.of("rate", liveRate, "updatedAt", java.time.LocalDateTime.now());
    }

    /**
     * 기존 단건/리밋 시세 히스토리 조회
     */
    @GetMapping("/api/prices")
    public List<CryptoPrice> getPrices(
            @RequestParam(required = false) String exchange,
            @RequestParam(required = false) String market,
            @RequestParam(defaultValue = "50") int limit) {
        return priceQueryPort.findRecentPrices(exchange, market, limit);
    }
}
