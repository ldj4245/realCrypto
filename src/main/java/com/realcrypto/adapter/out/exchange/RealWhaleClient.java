package com.realcrypto.adapter.out.exchange;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.realcrypto.adapter.in.web.dto.CryptoNewsDto;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class RealWhaleClient {

    private final RestTemplate restTemplate;
    private static final String BLOCKCHAIN_TX_URL = "https://blockchain.info/unconfirmed-transactions?format=json";

    public RealWhaleClient(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    @SuppressWarnings("unchecked")
    public List<CryptoNewsDto.WhaleAlertItem> fetchLiveWhaleTransactions(double btcPriceKrw) {
        List<CryptoNewsDto.WhaleAlertItem> candidates = new ArrayList<>();
        try {
            Map<String, Object> body = restTemplate.getForObject(BLOCKCHAIN_TX_URL, Map.class);
            if (body != null && body.containsKey("txs")) {
                List<Map<String, Object>> txs = (List<Map<String, Object>>) body.get("txs");
                for (Map<String, Object> tx : txs) {
                    List<Map<String, Object>> outs = (List<Map<String, Object>>) tx.get("out");
                    List<Map<String, Object>> inputs = (List<Map<String, Object>>) tx.get("inputs");
                    if (outs == null || outs.isEmpty()) continue;

                    double totalSatoshi = 0.0;
                    double maxOutSatoshi = -1.0;
                    String primaryToAddr = null;

                    for (Map<String, Object> out : outs) {
                        Number val = (Number) out.get("value");
                        String addr = (String) out.get("addr");
                        if (val != null) {
                            double v = val.doubleValue();
                            totalSatoshi += v;
                            if (v > maxOutSatoshi && addr != null && !addr.isBlank()) {
                                maxOutSatoshi = v;
                                primaryToAddr = addr;
                            }
                        }
                    }

                    double btcAmount = totalSatoshi / 100_000_000.0;
                    if (btcAmount < 0.05) continue;

                    String primaryFromAddr = null;
                    double maxInSatoshi = -1.0;
                    int inputCount = inputs != null ? inputs.size() : 1;
                    if (inputs != null) {
                        for (Map<String, Object> in : inputs) {
                            Map<String, Object> prevOut = (Map<String, Object>) in.get("prev_out");
                            if (prevOut != null) {
                                String addr = (String) prevOut.get("addr");
                                Number val = (Number) prevOut.get("value");
                                double v = val != null ? val.doubleValue() : 0.0;
                                if (addr != null && !addr.isBlank() && v > maxInSatoshi) {
                                    maxInSatoshi = v;
                                    primaryFromAddr = addr;
                                }
                            }
                        }
                    }

                    String hash = (String) tx.get("hash");
                    if (hash == null || hash.isBlank()) continue;

                    Number timeNum = (Number) tx.get("time");
                    long epochSec = timeNum != null ? timeNum.longValue() : System.currentTimeMillis() / 1000;
                    LocalDateTime txTime = LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSec), ZoneId.of("Asia/Seoul"));

                    Number feeNum = (Number) tx.get("fee");
                    long feeSats = feeNum != null ? feeNum.longValue() : 0L;

                    int outputCount = outs.size();
                    double effectiveBtcKrw = btcPriceKrw > 0 ? btcPriceKrw : 95_000_000.0;
                    double valueKrw = btcAmount * effectiveBtcKrw;

                    String transferType;
                    if (btcAmount >= 10.0) {
                        transferType = "MEGA";
                    } else if (btcAmount >= 1.0) {
                        transferType = "LARGE";
                    } else if (outputCount >= 5 || inputCount >= 5) {
                        transferType = "MULTI";
                    } else {
                        transferType = "STANDARD";
                    }

                    candidates.add(CryptoNewsDto.WhaleAlertItem.builder()
                            .id(hash)
                            .txHash(hash)
                            .symbol("BTC")
                            .amount(Math.round(btcAmount * 10000.0) / 10000.0)
                            .valueKrw((double) Math.round(valueKrw))
                            .fromAddress(primaryFromAddr != null ? primaryFromAddr : "SegWit/Taproot Input")
                            .toAddress(primaryToAddr != null ? primaryToAddr : "OP_RETURN / Script Output")
                            .inputCount(inputCount)
                            .outputCount(outputCount)
                            .feeSats(feeSats)
                            .transferType(transferType)
                            .timestamp(txTime)
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("실시간 온체인 고래 트랜잭션 조회 에러: {}", e.getMessage());
        }

        // BTC 전송량 기준 내림차순 정렬 후 상위 15건 반환
        candidates.sort((a, b) -> Double.compare(
                b.getAmount() != null ? b.getAmount() : 0.0,
                a.getAmount() != null ? a.getAmount() : 0.0));

        if (candidates.size() > 15) {
            return new ArrayList<>(candidates.subList(0, 15));
        }
        return candidates;
    }
}
