package com.realcrypto.adapter.in.web;

import com.realcrypto.domain.CryptoPrice;
import com.realcrypto.application.port.out.CryptoPriceQueryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CryptoPriceController {

    private final CryptoPriceQueryPort priceQueryPort;

    @GetMapping("/api/prices")
    public List<CryptoPrice> getPrices(
            @RequestParam(required = false) String exchange,
            @RequestParam(required = false) String market,
            @RequestParam(defaultValue = "10") int limit) {
        return priceQueryPort.findRecentPrices(exchange, market, limit);
    }
}
