package com.realcrypto.adapter.in.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.realcrypto.adapter.in.web.dto.CryptoNewsDto;
import com.realcrypto.adapter.out.exchange.FearGreedClient;
import com.realcrypto.application.service.CryptoInsightService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CryptoInsightController {

    private final FearGreedClient fearGreedClient;
    private final CryptoInsightService cryptoInsightService;

    @GetMapping("/fear-greed")
    public ResponseEntity<FearGreedClient.FearGreedResponse> getFearGreedIndex() {
        FearGreedClient.FearGreedResponse response = fearGreedClient.fetchFearGreedIndex();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/news")
    public ResponseEntity<List<CryptoNewsDto.FastNewsItem>> getFastNews() {
        List<CryptoNewsDto.FastNewsItem> news = cryptoInsightService.getFastNews();
        return ResponseEntity.ok(news);
    }

    @GetMapping("/whale-alerts")
    public ResponseEntity<List<CryptoNewsDto.WhaleAlertItem>> getWhaleAlerts() {
        List<CryptoNewsDto.WhaleAlertItem> alerts = cryptoInsightService.getWhaleAlerts();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/arbitrage-calculator")
    public ResponseEntity<CryptoNewsDto.ArbitrageCalcResponse> calculateArbitrage(
            @RequestParam(defaultValue = "10000000") double investment) {
        CryptoNewsDto.ArbitrageCalcResponse response = cryptoInsightService.calculateArbitrage(investment);
        return ResponseEntity.ok(response);
    }
}
