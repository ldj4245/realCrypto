package com.realcrypto.adapter.in.web;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.realcrypto.adapter.in.web.dto.TripleArbitrageDto;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class ArbitrageSseBroadcaster {

    private static final long DEFAULT_TIMEOUT = 180_000L; // 3분 타임아웃 (클라이언트 EventSource 자동 재연결)
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe(List<TripleArbitrageDto> initialItems, double exchangeRate) {
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> {
            emitter.complete();
            emitters.remove(emitter);
        });
        emitter.onError((e) -> {
            emitter.complete();
            emitters.remove(emitter);
        });

        try {
            Map<String, Object> payload = Map.of(
                    "exchangeRate", exchangeRate,
                    "items", initialItems != null ? initialItems : List.of()
            );
            emitter.send(SseEmitter.event()
                    .name("init")
                    .data(payload, MediaType.APPLICATION_JSON));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcast(List<TripleArbitrageDto> items, double exchangeRate) {
        if (emitters.isEmpty()) {
            return;
        }

        Map<String, Object> payload = Map.of(
                "exchangeRate", exchangeRate,
                "items", items != null ? items : List.of()
        );

        List<SseEmitter> deadEmitters = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("price-update")
                        .data(payload, MediaType.APPLICATION_JSON));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
        }
    }
}
