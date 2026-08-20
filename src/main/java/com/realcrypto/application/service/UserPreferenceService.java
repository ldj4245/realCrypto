package com.realcrypto.application.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.realcrypto.adapter.in.web.dto.UserPreferenceDto;
import com.realcrypto.adapter.out.persistence.PriceAlertRepository;
import com.realcrypto.adapter.out.persistence.UserFavoriteRepository;
import com.realcrypto.domain.user.PriceAlert;
import com.realcrypto.domain.user.UserFavorite;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserPreferenceService {

    private final UserFavoriteRepository userFavoriteRepository;
    private final PriceAlertRepository priceAlertRepository;

    public List<String> getFavorites(String username) {
        return userFavoriteRepository.findByUsernameOrderByCreatedAtAsc(username)
                .stream()
                .map(UserFavorite::getSymbol)
                .collect(Collectors.toList());
    }

    /**
     * 비로그인 상태(LocalStorage)에서 추가했던 관심 종목들을 로그인 시 단건 루프 쿼리(N+1) 없이
     * 기존 목록 1회 조회 후 누락된 심볼만 일괄 저장(saveAll)하여 병합합니다.
     */
    @Transactional
    public List<String> syncFavorites(String username, List<String> clientSymbols) {
        List<UserFavorite> existingList = userFavoriteRepository.findByUsernameOrderByCreatedAtAsc(username);
        Set<String> existingSymbols = existingList.stream()
                .map(UserFavorite::getSymbol)
                .collect(Collectors.toSet());

        if (clientSymbols != null && !clientSymbols.isEmpty()) {
            List<UserFavorite> toSave = new ArrayList<>();
            for (String raw : clientSymbols) {
                if (raw == null || raw.isBlank()) continue;
                String normalized = raw.toUpperCase().trim();
                if (!existingSymbols.contains(normalized)) {
                    existingSymbols.add(normalized);
                    toSave.add(UserFavorite.builder()
                            .username(username)
                            .symbol(normalized)
                            .build());
                }
            }
            if (!toSave.isEmpty()) {
                userFavoriteRepository.saveAll(toSave);
            }
        }

        return new ArrayList<>(existingSymbols);
    }

    @Transactional
    public List<String> toggleFavorite(String username, String symbol) {
        if (symbol == null || symbol.isBlank()) {
            throw new BusinessException("유효하지 않은 코인 심볼입니다.", ErrorCode.INVALID_INPUT_VALUE);
        }
        String normalized = symbol.toUpperCase().trim();
        Optional<UserFavorite> existing = userFavoriteRepository.findByUsernameAndSymbol(username, normalized);

        if (existing.isPresent()) {
            userFavoriteRepository.delete(existing.get());
        } else {
            try {
                userFavoriteRepository.saveAndFlush(UserFavorite.builder()
                        .username(username)
                        .symbol(normalized)
                        .build());
            } catch (DataIntegrityViolationException ignored) {
                // 따닥(동시 중복 요청) 발생 시 유니크 제약조건으로 방어하고 정상 처리
            }
        }
        return getFavorites(username);
    }

    public List<UserPreferenceDto.AlertItem> getAlerts(String username) {
        return priceAlertRepository.findByUsernameOrderByCreatedAtDesc(username)
                .stream()
                .map(this::toAlertItem)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserPreferenceDto.AlertItem createAlert(String username, UserPreferenceDto.CreateAlertRequest req) {
        if (req.getSymbol() == null || req.getSymbol().isBlank() || req.getTargetPremium() == null) {
            throw new BusinessException("알림 설정 값이 올바르지 않습니다.", ErrorCode.INVALID_INPUT_VALUE);
        }

        PriceAlert saved = priceAlertRepository.save(PriceAlert.builder()
                .username(username)
                .symbol(req.getSymbol())
                .targetPremium(req.getTargetPremium())
                .direction(req.getDirection())
                .build());

        return toAlertItem(saved);
    }

    @Transactional
    public UserPreferenceDto.AlertItem markAlertTriggered(String username, Long alertId) {
        PriceAlert alert = priceAlertRepository.findByIdAndUsername(alertId, username)
                .orElseThrow(() -> new BusinessException("존재하지 않는 알림입니다.", ErrorCode.INVALID_INPUT_VALUE));

        if (!alert.isTriggered()) {
            alert.markTriggered();
        }
        return toAlertItem(alert);
    }

    @Transactional
    public void deleteAlert(String username, Long alertId) {
        PriceAlert alert = priceAlertRepository.findByIdAndUsername(alertId, username)
                .orElseThrow(() -> new BusinessException("존재하지 않는 알림입니다.", ErrorCode.INVALID_INPUT_VALUE));
        priceAlertRepository.delete(alert);
    }

    private UserPreferenceDto.AlertItem toAlertItem(PriceAlert a) {
        return UserPreferenceDto.AlertItem.builder()
                .id(a.getId())
                .symbol(a.getSymbol())
                .targetPremium(a.getTargetPremium())
                .direction(a.getDirection())
                .isTriggered(a.isTriggered())
                .triggeredAt(a.getTriggeredAt())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
