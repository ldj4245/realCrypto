package com.realcrypto.global.error;

import lombok.Getter;

@Getter
public enum ErrorCode {

    // Common (공통 에러)
    INVALID_INPUT_VALUE(400, "C001", "올바르지 않은 입력값입니다."),
    INTERNAL_SERVER_ERROR(500, "C002", "서버 내부에서 에러가 발생했습니다."),

    // Exchange / Crypto (크립토 도메인 특화 에러)
    UNSUPPORTED_EXCHANGE(400, "E101", "지원하지 않는 거래소입니다."),
    UNSUPPORTED_MARKET(400, "E102", "지원하지 않는 코인 마켓 심볼입니다."),
    EXCHANGE_RATE_LIMIT_EXCEEDED(429, "E103", "거래소 API 호출 빈도 제한을 초과했습니다. 잠시 후 시도하세요."),
    EXCHANGE_TIMEOUT(504, "E104", "거래소 서버 응답 시간이 초과되었습니다."),
    EXCHANGE_RESPONSE_PARSE_ERROR(502, "E105", "거래소 응답 데이터 해석에 실패했습니다.");

    private final int status;
    private final String code;
    private final String message;

    ErrorCode(int status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
