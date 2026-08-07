package com.realcrypto.application.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.realcrypto.adapter.in.web.dto.TripleArbitrageDto;
import com.realcrypto.application.port.out.ArbitrageCachePort;
import com.realcrypto.application.port.out.CollectTargetQueryPort;
import com.realcrypto.application.port.out.CryptoPriceSavePort;
import com.realcrypto.application.port.out.ExchangeClientPort;
import com.realcrypto.domain.CollectTarget;
import com.realcrypto.domain.CryptoPrice;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PriceCollectService {

    private final List<ExchangeClientPort> clients;
    private final CryptoPriceSavePort cryptoPriceSavePort;
    private final CollectTargetQueryPort collectTargetQueryPort;
    private final ArbitrageCachePort arbitrageCachePort;
    private final com.realcrypto.adapter.out.exchange.BinanceFuturesClient binanceFuturesClient;
    private final com.realcrypto.adapter.out.exchange.ExchangeRateClient exchangeRateClient;

    // 코인 한글명 매핑 맵
    private static final Map<String, String> KOREAN_NAME_MAP = new ConcurrentHashMap<>();

    static {
        KOREAN_NAME_MAP.put("BTC", "비트코인");
        KOREAN_NAME_MAP.put("ETH", "이더리움");
        KOREAN_NAME_MAP.put("XRP", "리플");
        KOREAN_NAME_MAP.put("SOL", "솔라나");
        KOREAN_NAME_MAP.put("DOGE", "도지코인");
        KOREAN_NAME_MAP.put("ADA", "에이다");
        KOREAN_NAME_MAP.put("AVAX", "아발란체");
        KOREAN_NAME_MAP.put("DOT", "폴카닷");
        KOREAN_NAME_MAP.put("NEAR", "니어프로토콜");
        KOREAN_NAME_MAP.put("LINK", "체인링크");
        KOREAN_NAME_MAP.put("SHIB", "시바이누");
        KOREAN_NAME_MAP.put("ETC", "이더리움클래식");
        KOREAN_NAME_MAP.put("SUI", "수이");
        KOREAN_NAME_MAP.put("APT", "앱토스");
        KOREAN_NAME_MAP.put("TRX", "트론");
        KOREAN_NAME_MAP.put("BCH", "비트코인캐시");
        KOREAN_NAME_MAP.put("SAND", "샌드박스");
        KOREAN_NAME_MAP.put("MANA", "디센트럴랜드");
        KOREAN_NAME_MAP.put("AXS", "엑시인피니티");
        KOREAN_NAME_MAP.put("MATIC", "폴리곤");
        KOREAN_NAME_MAP.put("POL", "폴리곤");
        KOREAN_NAME_MAP.put("SEI", "세이");
        KOREAN_NAME_MAP.put("PEPE", "페페");
        KOREAN_NAME_MAP.put("ARB", "아비트럼");
        KOREAN_NAME_MAP.put("OP", "옵티미즘");
        KOREAN_NAME_MAP.put("ATOM", "코스모스");
        KOREAN_NAME_MAP.put("RENDER", "렌더토큰");
        KOREAN_NAME_MAP.put("STX", "스택스");
        KOREAN_NAME_MAP.put("INJ", "인젝티브");
        KOREAN_NAME_MAP.put("WLD", "월드코인");
        KOREAN_NAME_MAP.put("ENA", "에테나");
        KOREAN_NAME_MAP.put("JUP", "주피터");
        KOREAN_NAME_MAP.put("UNI", "유니스왑");
        KOREAN_NAME_MAP.put("ICP", "인터넷컴퓨터");
        KOREAN_NAME_MAP.put("FIL", "파일코인");
        KOREAN_NAME_MAP.put("KAS", "카스파");
        KOREAN_NAME_MAP.put("TIA", "셀레스티아");
        KOREAN_NAME_MAP.put("ALGO", "알고랜드");
        KOREAN_NAME_MAP.put("EOS", "이오스");
    }

    @Transactional(readOnly = true)
    public List<CollectTarget> getActiveTargets() {
        return collectTargetQueryPort.findActiveTargets();
    }

    public void collect(CollectTarget target) {
        for (ExchangeClientPort client : clients) {
            if (client.supports(target.getExchange())) {
                CryptoPrice price = client.fetchPrice(target.getMarket());
                price.setCollectTarget(target);
                cryptoPriceSavePort.save(price);
                return;
            }
        }
        throw new BusinessException("지원하지 않는 거래소입니다: " + target.getExchange(), ErrorCode.UNSUPPORTED_EXCHANGE);
    }

    /**
     * 업비트, 바이낸스, 빗썸 3대 거래소 전체 시세를 일괄 수집하고
     * 베이스 심볼 기준으로 자동 페어링하여 3자 김프를 계산 및 Redis에 캐싱합니다.
     */
    public List<TripleArbitrageDto> collectAllAndCalculateArbitrage(double exchangeRate) {
        if (exchangeRate <= 0) {
            exchangeRate = exchangeRateClient.fetchLiveUsdKrwRate();
        }
        Map<String, CryptoPrice> upbitMap = new HashMap<>();
        Map<String, CryptoPrice> bithumbMap = new HashMap<>();
        Map<String, CryptoPrice> binanceMap = new HashMap<>();

        // 1. 거래소별 전체 시세 일괄 수집
        for (ExchangeClientPort client : clients) {
            try {
                List<CryptoPrice> prices = client.fetchAllPrices();
                for (CryptoPrice p : prices) {
                    String rawSymbol = extractBaseSymbol(p.getMarket(), p.getExchange());
                    if (rawSymbol == null || rawSymbol.isEmpty()) continue;

                    if ("UPBIT".equalsIgnoreCase(p.getExchange())) {
                        upbitMap.put(rawSymbol, p);
                    } else if ("BITHUMB".equalsIgnoreCase(p.getExchange())) {
                        bithumbMap.put(rawSymbol, p);
                    } else if ("BINANCE".equalsIgnoreCase(p.getExchange())) {
                        binanceMap.put(rawSymbol, p);
                    }
                }
            } catch (Exception e) {
                log.error("거래소 시세 일괄 수집 중 에러 발생: {}", e.getMessage());
            }
        }

        // 2. 전체 심볼 목록 수집 및 바이낸스 선물 펀딩비 조회
        Map<String, com.realcrypto.adapter.out.exchange.BinanceFuturesClient.FundingRateDto> fundingMap = Collections.emptyMap();
        try {
            fundingMap = binanceFuturesClient.fetchFundingRates();
        } catch (Exception e) {
            log.warn("펀딩비 조회 실패: {}", e.getMessage());
        }

        Set<String> allSymbols = new HashSet<>();
        allSymbols.addAll(upbitMap.keySet());
        allSymbols.addAll(bithumbMap.keySet());

        List<TripleArbitrageDto> resultList = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (String symbol : allSymbols) {
            CryptoPrice upbit = upbitMap.get(symbol);
            CryptoPrice bithumb = bithumbMap.get(symbol);
            CryptoPrice binance = binanceMap.get(symbol);

            Double upbitPrice = (upbit != null) ? upbit.getTradePrice() : null;
            Double upbitChange = (upbit != null) ? upbit.getChangeRate() : null;
            Double upbitValue = (upbit != null) ? upbit.getAccTradeValue() : 0.0;

            Double bithumbPrice = (bithumb != null) ? bithumb.getTradePrice() : null;
            Double bithumbChange = (bithumb != null) ? bithumb.getChangeRate() : null;
            Double bithumbValue = (bithumb != null) ? bithumb.getAccTradeValue() : 0.0;

            Double binancePriceUsd = (binance != null) ? binance.getTradePrice() : null;
            Double binanceChange = (binance != null) ? binance.getChangeRate() : null;
            Double binanceValueUsd = (binance != null) ? binance.getAccTradeValue() : 0.0;

            Double binancePriceKrw = (binancePriceUsd != null && binancePriceUsd > 0)
                    ? binancePriceUsd * exchangeRate
                    : null;

            // 김치 프리미엄 연산
            Double upbitBinancePremium = null;
            if (upbitPrice != null && upbitPrice > 0 && binancePriceKrw != null && binancePriceKrw > 0) {
                upbitBinancePremium = Math.round(((upbitPrice / binancePriceKrw) - 1.0) * 10000.0) / 100.0;
            }

            Double bithumbBinancePremium = null;
            if (bithumbPrice != null && bithumbPrice > 0 && binancePriceKrw != null && binancePriceKrw > 0) {
                bithumbBinancePremium = Math.round(((bithumbPrice / binancePriceKrw) - 1.0) * 10000.0) / 100.0;
            }

            Double upbitBithumbGap = null;
            if (upbitPrice != null && upbitPrice > 0 && bithumbPrice != null && bithumbPrice > 0) {
                upbitBithumbGap = Math.round(((upbitPrice / bithumbPrice) - 1.0) * 10000.0) / 100.0;
            }

            // 펀딩비 매핑
            com.realcrypto.adapter.out.exchange.BinanceFuturesClient.FundingRateDto funding = fundingMap.get(symbol);
            Double fundingRatePercent = (funding != null) ? funding.getFundingRatePercent() : null;
            Double fundingApr = (funding != null) ? funding.getApr() : null;
            Long nextFundingTime = (funding != null) ? funding.getNextFundingTime() : null;

            String nameKr = KOREAN_NAME_MAP.getOrDefault(symbol, symbol);

            TripleArbitrageDto dto = TripleArbitrageDto.builder()
                    .symbol(symbol)
                    .nameKr(nameKr)
                    .upbitPrice(upbitPrice)
                    .upbitChangeRate(upbitChange)
                    .upbitTradeValue(upbitValue)
                    .bithumbPrice(bithumbPrice)
                    .bithumbChangeRate(bithumbChange)
                    .bithumbTradeValue(bithumbValue)
                    .binancePriceUsd(binancePriceUsd)
                    .binancePriceKrw(binancePriceKrw)
                    .binanceChangeRate(binanceChange)
                    .binanceTradeValueUsd(binanceValueUsd)
                    .upbitBinancePremium(upbitBinancePremium)
                    .bithumbBinancePremium(bithumbBinancePremium)
                    .upbitBithumbGap(upbitBithumbGap)
                    .fundingRatePercent(fundingRatePercent)
                    .fundingApr(fundingApr)
                    .nextFundingTime(nextFundingTime)
                    .isWalletNormal(true)
                    .updatedAt(now)
                    .build();

            resultList.add(dto);
        }

        // 거래대금 기준 기본 정렬 (업비트 + 빗썸 거래대금 합산 높은 순)
        resultList.sort((a, b) -> {
            double valA = (a.getUpbitTradeValue() != null ? a.getUpbitTradeValue() : 0.0)
                    + (a.getBithumbTradeValue() != null ? a.getBithumbTradeValue() : 0.0);
            double valB = (b.getUpbitTradeValue() != null ? b.getUpbitTradeValue() : 0.0)
                    + (b.getBithumbTradeValue() != null ? b.getBithumbTradeValue() : 0.0);
            return Double.compare(valB, valA);
        });

        // 3. 캐시에 저장
        arbitrageCachePort.saveAll(resultList);

        log.info("3대 거래소 총 {}개 코인 시세 및 김프 계산/캐싱 완료 (환율: {} KRW)", resultList.size(), exchangeRate);
        return resultList;
    }

    @Transactional(readOnly = true)
    public List<TripleArbitrageDto> getAllArbitrage() {
        return arbitrageCachePort.findAll();
    }

    @Transactional(readOnly = true)
    public List<TripleArbitrageDto> getSummaryArbitrage() {
        List<TripleArbitrageDto> all = arbitrageCachePort.findAll();
        List<String> majorSymbols = List.of("BTC", "ETH", "SOL", "XRP");
        List<TripleArbitrageDto> summary = new ArrayList<>();
        for (String major : majorSymbols) {
            all.stream()
                    .filter(item -> major.equalsIgnoreCase(item.getSymbol()))
                    .findFirst()
                    .ifPresent(summary::add);
        }
        return summary;
    }

    @Transactional(readOnly = true)
    public double getLiveExchangeRate() {
        return exchangeRateClient.fetchLiveUsdKrwRate();
    }

    private String extractBaseSymbol(String market, String exchange) {
        if (market == null) return "";
        String upper = market.toUpperCase().trim();
        if ("UPBIT".equalsIgnoreCase(exchange)) {
            return upper.replace("KRW-", "").replace("USDT-", "").replace("BTC-", "");
        } else if ("BITHUMB".equalsIgnoreCase(exchange)) {
            return upper.replace("_KRW", "").replace("_BTC", "");
        } else if ("BINANCE".equalsIgnoreCase(exchange)) {
            if (upper.endsWith("USDT")) {
                return upper.substring(0, upper.length() - 4);
            }
        }
        return upper;
    }
}
