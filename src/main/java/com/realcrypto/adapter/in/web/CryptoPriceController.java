package com.realcrypto.adapter.in.web;

import com.realcrypto.adapter.out.persistence.entity.CryptoPrice;
import com.realcrypto.application.service.PriceQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CryptoPriceController {

    private final PriceQueryService priceQueryService;

    @GetMapping("/api/prices")
    public List<CryptoPrice> getPrices(
            @RequestParam(required = false) String exchange,
            @RequestParam(required = false) String market,
            @RequestParam(defaultValue = "10") int limit) {
        return priceQueryService.getRecentPrices(exchange, market, limit);
    }
}
