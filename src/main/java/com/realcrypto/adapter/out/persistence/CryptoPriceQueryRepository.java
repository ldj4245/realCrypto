package com.realcrypto.adapter.out.persistence;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.realcrypto.adapter.out.persistence.entity.CryptoPrice;
import com.realcrypto.adapter.out.persistence.entity.QCryptoPrice;
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

        return queryFactory.selectFrom(cryptoPrice)
                .where(
                        exchangeEq(exchange),
                        marketEq(market)
                )
                .orderBy(cryptoPrice.timestamp.desc())
                .limit(limit)
                .fetch();
    }

    private BooleanExpression exchangeEq(String exchange) {
        return StringUtils.hasText(exchange) ? QCryptoPrice.cryptoPrice.exchange.equalsIgnoreCase(exchange) : null;
    }

    private BooleanExpression marketEq(String market) {
        return StringUtils.hasText(market) ? QCryptoPrice.cryptoPrice.market.equalsIgnoreCase(market) : null;
    }
}
