package com.realcrypto.application.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.realcrypto.adapter.out.exchange.ExchangeClient;
import com.realcrypto.adapter.out.persistence.CryptoPriceRepository;
import com.realcrypto.adapter.out.persistence.entity.CollectTarget;
import com.realcrypto.adapter.out.persistence.entity.CryptoPrice;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PriceCollectService {

    private final List<ExchangeClient> clients;
    private final CryptoPriceRepository cryptoPriceRepository;

    public void collect(CollectTarget target) {
        for (ExchangeClient client : clients) {
            if (client.supports(target.getExchange())) {
                CryptoPrice price = client.fetchPrice(target.getMarket());
                cryptoPriceRepository.save(price);
                return;
            }
        }
        throw new BusinessException("지원하지 않는 거래소입니다: " + target.getExchange(), ErrorCode.UNSUPPORTED_EXCHANGE);

    }

}
