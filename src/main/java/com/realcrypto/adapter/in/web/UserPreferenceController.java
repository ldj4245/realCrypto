package com.realcrypto.adapter.in.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.realcrypto.adapter.in.web.dto.UserPreferenceDto;
import com.realcrypto.application.service.UserPreferenceService;
import com.realcrypto.global.error.BusinessException;
import com.realcrypto.global.error.ErrorCode;
import com.realcrypto.global.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserPreferenceController {

    private final UserPreferenceService userPreferenceService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/favorites")
    public ResponseEntity<List<String>> getFavorites(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = extractUsername(authHeader);
        return ResponseEntity.ok(userPreferenceService.getFavorites(username));
    }

    @PostMapping("/favorites/sync")
    public ResponseEntity<List<String>> syncFavorites(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody UserPreferenceDto.SyncFavoritesRequest req) {
        String username = extractUsername(authHeader);
        return ResponseEntity.ok(userPreferenceService.syncFavorites(username, req.getSymbols()));
    }

    @PostMapping("/favorites/toggle")
    public ResponseEntity<List<String>> toggleFavorite(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody UserPreferenceDto.ToggleFavoriteRequest req) {
        String username = extractUsername(authHeader);
        return ResponseEntity.ok(userPreferenceService.toggleFavorite(username, req.getSymbol()));
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<UserPreferenceDto.AlertItem>> getAlerts(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = extractUsername(authHeader);
        return ResponseEntity.ok(userPreferenceService.getAlerts(username));
    }

    @PostMapping("/alerts")
    public ResponseEntity<UserPreferenceDto.AlertItem> createAlert(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody UserPreferenceDto.CreateAlertRequest req) {
        String username = extractUsername(authHeader);
        return ResponseEntity.ok(userPreferenceService.createAlert(username, req));
    }

    @PostMapping("/alerts/{id}/trigger")
    public ResponseEntity<UserPreferenceDto.AlertItem> markTriggered(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        String username = extractUsername(authHeader);
        return ResponseEntity.ok(userPreferenceService.markAlertTriggered(username, id));
    }

    @DeleteMapping("/alerts/{id}")
    public ResponseEntity<Void> deleteAlert(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        String username = extractUsername(authHeader);
        userPreferenceService.deleteAlert(username, id);
        return ResponseEntity.noContent().build();
    }

    private String extractUsername(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtTokenProvider.validateToken(token)) {
                return jwtTokenProvider.getUsernameFromToken(token);
            }
        }
        throw new BusinessException("로그인이 필요한 기능입니다.", ErrorCode.INVALID_INPUT_VALUE);
    }
}
