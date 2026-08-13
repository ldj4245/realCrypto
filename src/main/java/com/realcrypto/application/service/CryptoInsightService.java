package com.realcrypto.application.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.realcrypto.adapter.in.web.dto.CryptoNewsDto;
import com.realcrypto.adapter.in.web.dto.TripleArbitrageDto;
import com.realcrypto.adapter.out.exchange.RealNewsClient;
import com.realcrypto.adapter.out.exchange.RealWhaleClient;
import com.realcrypto.application.port.out.ArbitrageCachePort;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CryptoInsightService {

    private final ArbitrageCachePort arbitrageCachePort;
    private final RealNewsClient realNewsClient;
    private final RealWhaleClient realWhaleClient;

    private final List<CryptoNewsDto.FastNewsItem> newsFeed = new CopyOnWriteArrayList<>();
    private final List<CryptoNewsDto.WhaleAlertItem> whaleAlertFeed = new CopyOnWriteArrayList<>();

    @PostConstruct
    public void initFeeds() {
        refreshLiveInsights();
    }

    /**
     * 1분마다 실제 구글 크립토 뉴스 RSS 및 온체인 비트코인 고래 트랜잭션을 실시간 수집합니다.
     */
    @Scheduled(fixedDelay = 60000, initialDelay = 10000)
    public void refreshLiveInsights() {
        try {
            // 1. 실제 구글 크립토 실시간 한국어 뉴스 수집
            List<CryptoNewsDto.FastNewsItem> liveNews = realNewsClient.fetchLiveNews();
            if (liveNews != null && !liveNews.isEmpty()) {
                newsFeed.clear();
                newsFeed.addAll(liveNews);
                log.info("실제 실시간 크립토 뉴스 총 {}건 수집 완료", liveNews.size());
            }

            // 2. 실제 블록체인 온체인 비트코인 고래 대형 트랜잭션 수집
            double btcPriceKrw = 89000000.0;
            List<TripleArbitrageDto> all = arbitrageCachePort.findAll();
            for (TripleArbitrageDto dto : all) {
                if ("BTC".equalsIgnoreCase(dto.getSymbol()) && dto.getUpbitPrice() != null) {
                    btcPriceKrw = dto.getUpbitPrice();
                    break;
                }
            }

            List<CryptoNewsDto.WhaleAlertItem> liveWhales = realWhaleClient.fetchLiveWhaleTransactions(btcPriceKrw);
            if (liveWhales != null && !liveWhales.isEmpty()) {
                whaleAlertFeed.clear();
                whaleAlertFeed.addAll(liveWhales);
                log.info("실제 온체인 고래 대형 트랜잭션 총 {}건 수집 완료", liveWhales.size());
            }
        } catch (Exception e) {
            log.error("실시간 인사이트 수집 중 에러: {}", e.getMessage());
        }
    }

    public List<CryptoNewsDto.FastNewsItem> getFastNews() {
        if (newsFeed.isEmpty()) {
            refreshLiveInsights();
        }
        return new ArrayList<>(newsFeed);
    }

    public List<CryptoNewsDto.WhaleAlertItem> getWhaleAlerts() {
        if (whaleAlertFeed.isEmpty()) {
            refreshLiveInsights();
        }
        return new ArrayList<>(whaleAlertFeed);
    }

    /**
     * 실순익 차익거래 계산기:
     * 투자 원화 금액과 거래소별 수수료(0.05%), 네트워크 출금 수수료, 실시간 김프를 적용하여
     * 코인별 순수익(KRW, %)과 최적 루트 랭킹을 반환합니다.
     */
    public CryptoNewsDto.ArbitrageCalcResponse calculateArbitrage(double investmentKrw) {
        if (investmentKrw <= 0) {
            investmentKrw = 10000000.0; // 기본 1,000만원
        }

        List<TripleArbitrageDto> allPrices = arbitrageCachePort.findAll();
        List<CryptoNewsDto.RouteRecommendation> routes = new ArrayList<>();

        addRouteOption(routes, allPrices, "XRP", "리플", 850.0, 2, investmentKrw, "🚀 가장 빠르고 저렴");
        addRouteOption(routes, allPrices, "TRX", "트론", 2000.0, 1, investmentKrw, "⚡ 초고속 전송");
        addRouteOption(routes, allPrices, "SOL", "솔라나", 2400.0, 3, investmentKrw, "⭐ 인기 전송 코인");
        addRouteOption(routes, allPrices, "DOGE", "도지코인", 1000.0, 5, investmentKrw, "🐕 알트 전송");
        addRouteOption(routes, allPrices, "BTC", "비트코인", 44000.0, 20, investmentKrw, "👑 대규모 자금용");
        addRouteOption(routes, allPrices, "ETH", "이더리움", 8000.0, 10, investmentKrw, "💎 메이저");

        // 순수익률 높은 순으로 정렬
        routes.sort((a, b) -> Double.compare(b.getNetProfitRate(), a.getNetProfitRate()));

        return CryptoNewsDto.ArbitrageCalcResponse.builder()
                .investmentKrw(investmentKrw)
                .routes(routes)
                .build();
    }

    private void addRouteOption(
            List<CryptoNewsDto.RouteRecommendation> list,
            List<TripleArbitrageDto> prices,
            String symbol,
            String nameKr,
            double feeKrw,
            int minutes,
            double investment,
            String defaultTag) {

        TripleArbitrageDto item = prices.stream()
                .filter(p -> symbol.equalsIgnoreCase(p.getSymbol()))
                .findFirst()
                .orElse(null);

        double premium = 2.5; // 기본 폴백 김프 (%)
        if (item != null && item.getUpbitBinancePremium() != null) {
            premium = item.getUpbitBinancePremium();
        }

        // 매매 수수료: 업비트 매수(0.05%) + 바이낸스 매도(0.04%) + 환전 스프레드(약 0.1%) = 약 0.19%
        double tradeFeeRate = 0.0019;
        double totalTradeFee = investment * tradeFeeRate;

        // 조수익 = 투자금 * (김프 / 100)
        double grossProfit = investment * (premium / 100.0);

        // 순수익 = 조수익 - 총 매매수수료 - 네트워크 출금 수수료
        double netProfit = grossProfit - totalTradeFee - feeKrw;
        double netRate = Math.round((netProfit / investment) * 10000.0) / 100.0;

        String tag = defaultTag;
        if (netRate > 2.0 && minutes <= 3) {
            tag = "🔥 실시간 최적 추천 (BEST)";
        }

        list.add(CryptoNewsDto.RouteRecommendation.builder()
                .coinSymbol(symbol)
                .coinNameKr(nameKr)
                .transferFeeKrw(feeKrw)
                .estimatedMinutes(minutes)
                .premiumPercent(Math.round(premium * 100.0) / 100.0)
                .estimatedProfitKrw(Math.round(netProfit))
                .netProfitRate(netRate)
                .recommendationTag(tag)
                .build());
    }
}
