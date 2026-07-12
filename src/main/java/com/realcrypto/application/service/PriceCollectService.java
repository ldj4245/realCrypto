package com.realcrypto.application.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.realcrypto.adapter.out.persistence.CryptoPriceRepository;
import com.realcrypto.domain.CollectTarget;
import com.realcrypto.domain.CryptoPrice;
import com.realcrypto.application.port.in.PriceCollectUseCase;
import com.realcrypto.application.port.out.CollectTargetQueryPort;
import com.realcrypto.application.port.out.ExchangeClientPort;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PriceCollectService implements PriceCollectUseCase {

    private final List<ExchangeClientPort> clients;
    private final CryptoPriceRepository cryptoPriceRepository;
    private final CollectTargetQueryPort collectTargetQueryPort; // 💡 DB 직접 의존을 포트로 대체!

    @Override
    @Transactional(readOnly = true)
    public List<CollectTarget> getActiveTargets() {
        return collectTargetQueryPort.findActiveTargets();
    }

    @Override
    public void collect(CollectTarget target) {
        for (ExchangeClientPort client : clients) {
            if (client.supports(target.getExchange())) {
                CryptoPrice price = client.fetchPrice(target.getMarket());
                cryptoPriceRepository.save(price);
                return;
            }
        }
        throw new BusinessException("지원하지 않는 거래소입니다: " + target.getExchange(), ErrorCode.UNSUPPORTED_EXCHANGE);
    }
}
