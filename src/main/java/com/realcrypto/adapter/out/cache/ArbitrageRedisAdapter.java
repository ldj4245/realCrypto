package com.realcrypto.adapter.out.cache;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.realcrypto.adapter.in.web.dto.TripleArbitrageDto;
import com.realcrypto.application.port.out.ArbitrageCachePort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ArbitrageRedisAdapter implements ArbitrageCachePort {

    private static final String REDIS_KEY_PREFIX = "realcrypto:arbitrage:";
    private static final String REDIS_ALL_KEY = "realcrypto:arbitrage_list";

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Redis 연결 실패 시 무중단 동작을 위한 로컬 인메모리 폴백 캐시
    private final Map<String, TripleArbitrageDto> localFallbackMap = new ConcurrentHashMap<>();

    @Override
    public void saveAll(List<TripleArbitrageDto> list) {
        if (list == null || list.isEmpty()) {
            return;
        }

        // 1. 로컬 메모리 즉시 갱신
        for (TripleArbitrageDto item : list) {
            localFallbackMap.put(item.getSymbol().toUpperCase(), item);
        }

        // 2. Redis 캐시 갱신 시도
        try {
            redisTemplate.opsForValue().set(REDIS_ALL_KEY, list, 30, TimeUnit.SECONDS);
            for (TripleArbitrageDto item : list) {
                redisTemplate.opsForValue().set(REDIS_KEY_PREFIX + item.getSymbol().toUpperCase(), item, 30, TimeUnit.SECONDS);
            }
        } catch (Exception e) {
            log.debug("Redis 저장 중 경고 (로컬 메모리 캐시 사용 중): {}", e.getMessage());
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<TripleArbitrageDto> findAll() {
        try {
            Object cached = redisTemplate.opsForValue().get(REDIS_ALL_KEY);
            if (cached != null) {
                if (cached instanceof List) {
                    List<?> rawList = (List<?>) cached;
                    List<TripleArbitrageDto> result = new ArrayList<>();
                    for (Object obj : rawList) {
                        if (obj instanceof TripleArbitrageDto) {
                            result.add((TripleArbitrageDto) obj);
                        } else {
                            TripleArbitrageDto converted = objectMapper.convertValue(obj, TripleArbitrageDto.class);
                            result.add(converted);
                        }
                    }
                    return result;
                }
            }
        } catch (Exception e) {
            log.debug("Redis 조회 중 경고 (로컬 메모리 캐시에서 조회): {}", e.getMessage());
        }

        // 로컬 폴백 반환
        List<TripleArbitrageDto> result = new ArrayList<>(localFallbackMap.values());
        result.sort(Comparator.comparing(TripleArbitrageDto::getUpbitTradeValue, Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    public Optional<TripleArbitrageDto> findBySymbol(String symbol) {
        if (symbol == null) return Optional.empty();
        String upper = symbol.toUpperCase();

        try {
            Object cached = redisTemplate.opsForValue().get(REDIS_KEY_PREFIX + upper);
            if (cached != null) {
                if (cached instanceof TripleArbitrageDto) {
                    return Optional.of((TripleArbitrageDto) cached);
                } else {
                    return Optional.of(objectMapper.convertValue(cached, TripleArbitrageDto.class));
                }
            }
        } catch (Exception e) {
            log.debug("Redis 단건 조회 경고: {}", e.getMessage());
        }

        return Optional.ofNullable(localFallbackMap.get(upper));
    }
}
