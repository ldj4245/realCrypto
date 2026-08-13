package com.realcrypto.adapter.out.exchange;

import java.io.StringReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import com.realcrypto.adapter.in.web.dto.CryptoNewsDto;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class RealNewsClient {

    private static final String GOOGLE_NEWS_RSS_URL = 
            "https://news.google.com/rss/search?q=%EB%B9%84%ED%8A%B8%EC%BD%94%EC%9D%B8%20OR%20%EA%B0%80%EC%83%81%EC%9E%90%EC%82%B0%20OR%20%EC%95%94%ED%98%B8%ED%99%94%ED%8F%90%20OR%20%EB%A6%AC%ED%94%8C%20OR%20%EC%9D%B4%EB%8D%94%EB%A6%AC%EC%9B%80&hl=ko&gl=KR&ceid=KR:ko";

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public List<CryptoNewsDto.FastNewsItem> fetchLiveNews() {
        List<CryptoNewsDto.FastNewsItem> items = new ArrayList<>();
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GOOGLE_NEWS_RSS_URL))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                String xml = response.body();
                DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
                DocumentBuilder builder = factory.newDocumentBuilder();
                Document doc = builder.parse(new InputSource(new StringReader(xml)));

                NodeList itemNodes = doc.getElementsByTagName("item");
                for (int i = 0; i < Math.min(itemNodes.getLength(), 25); i++) {
                    Element itemElem = (Element) itemNodes.item(i);
                    String rawTitle = getTagValue("title", itemElem);
                    String link = getTagValue("link", itemElem);
                    String pubDateStr = getTagValue("pubDate", itemElem);
                    String description = getTagValue("description", itemElem);

                    if (rawTitle == null || rawTitle.isEmpty()) continue;

                    // 언론사 분리 (제목 끝의 ' - 언론사명')
                    String title = rawTitle;
                    String source = "연합뉴스/크립토";
                    int lastDash = rawTitle.lastIndexOf(" - ");
                    if (lastDash > 0) {
                        title = rawTitle.substring(0, lastDash).trim();
                        source = rawTitle.substring(lastDash + 3).trim();
                    }

                    // 관련 코인 심볼 추출
                    String targetSymbol = detectSymbol(title);

                    // 카테고리 태깅 (속보, 호재, 악재, 공시)
                    String category = "NOTICE";
                    String categoryKr = "뉴스";
                    if (title.contains("속보") || title.contains("긴급") || title.contains("돌파")) {
                        category = "BREAKING";
                        categoryKr = "긴급속보";
                    } else if (title.contains("상승") || title.contains("급등") || title.contains("호재") || title.contains("승인") || title.contains("출시") || title.contains("상장")) {
                        category = "GOOD";
                        categoryKr = "호재";
                    } else if (title.contains("하락") || title.contains("급락") || title.contains("악재") || title.contains("해킹") || title.contains("유출") || title.contains("규제") || title.contains("퇴출")) {
                        category = "BAD";
                        categoryKr = "악재";
                    }

                    // 발행 시간 파싱
                    LocalDateTime publishedAt = LocalDateTime.now();
                    if (pubDateStr != null) {
                        try {
                            DateTimeFormatter formatter = DateTimeFormatter.RFC_1123_DATE_TIME;
                            ZonedDateTime zdt = ZonedDateTime.parse(pubDateStr, formatter);
                            publishedAt = zdt.toLocalDateTime();
                        } catch (Exception ignored) {}
                    }

                    // 요약 텍스트 정제
                    String cleanSummary = cleanHtml(description);
                    if (cleanSummary.length() > 150) {
                        cleanSummary = cleanSummary.substring(0, 150) + "...";
                    }
                    if (cleanSummary.isEmpty()) {
                        cleanSummary = title;
                    }

                    items.add(CryptoNewsDto.FastNewsItem.builder()
                            .id(UUID.randomUUID().toString())
                            .category(category)
                            .categoryKr(categoryKr)
                            .title(title)
                            .summary(cleanSummary)
                            .source(source)
                            .targetSymbol(targetSymbol)
                            .publishedAt(publishedAt)
                            .build());
                }
            }
        } catch (Exception e) {
            log.error("실시간 구글 크립토 뉴스 RSS 수집 실패: {}", e.getMessage());
        }
        return items;
    }

    private String getTagValue(String tag, Element element) {
        NodeList nl = element.getElementsByTagName(tag);
        if (nl != null && nl.getLength() > 0) {
            return nl.item(0).getTextContent();
        }
        return "";
    }

    private String cleanHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]*>", "").replaceAll("&nbsp;", " ").trim();
    }

    private String detectSymbol(String text) {
        String upper = text.toUpperCase();
        if (upper.contains("비트코인") || upper.contains("BTC")) return "BTC";
        if (upper.contains("이더리움") || upper.contains("ETH")) return "ETH";
        if (upper.contains("리플") || upper.contains("XRP")) return "XRP";
        if (upper.contains("솔라나") || upper.contains("SOL")) return "SOL";
        if (upper.contains("도지") || upper.contains("DOGE")) return "DOGE";
        if (upper.contains("트론") || upper.contains("TRX")) return "TRX";
        if (upper.contains("에이다") || upper.contains("ADA")) return "ADA";
        return null;
    }
}
