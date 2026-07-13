package com.realcrypto.adapter.in.web;

import com.realcrypto.application.port.out.CryptoPriceQueryPort;
import com.realcrypto.domain.CryptoPrice;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class PriceViewController {

    private final CryptoPriceQueryPort priceQueryPort;

    @GetMapping("/")
    public String index(Model model) {
        List<CryptoPrice> prices = priceQueryPort.findRecentPrices(null, null, 50);
        model.addAttribute("prices", prices);
        return "index";
    }
}
