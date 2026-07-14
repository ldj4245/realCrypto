package com.realcrypto.adapter.out.persistence;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.realcrypto.domain.CryptoPrice;
import com.realcrypto.domain.QCryptoPrice;
import com.realcrypto.domain.QCollectTarget;
import com.realcrypto.application.port.out.CryptoPriceQueryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class CryptoPriceQueryRepository implements CryptoPriceQueryPort {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<CryptoPrice> findRecentPrices(String exchange, String market, int limit) {
        QCryptoPrice cryptoPrice = QCryptoPrice.cryptoPrice;
        QCollectTarget collectTarget = QCollectTarget.collectTarget;

        return queryFactory.selectFrom(cryptoPrice)
                .join(cryptoPrice.collectTarget, collectTarget)
                .where(
                        exchangeEq(exchange, collectTarget),
                        marketEq(market, collectTarget)
                )
                .orderBy(cryptoPrice.timestamp.desc())
                .limit(limit)
                .fetch();
    }

    private BooleanExpression exchangeEq(String exchange, QCollectTarget collectTarget) {
        return StringUtils.hasText(exchange) ? collectTarget.exchange.equalsIgnoreCase(exchange) : null;
    }

    private BooleanExpression marketEq(String market, QCollectTarget collectTarget) {
        return StringUtils.hasText(market) ? collectTarget.market.equalsIgnoreCase(market) : null;
    }
}
