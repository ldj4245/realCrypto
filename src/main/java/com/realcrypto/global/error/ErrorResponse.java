package com.realcrypto.global.error;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ErrorResponse {

    private int status;
    private String code;
    private String message;

    private ErrorResponse(ErrorCode code) {
        this.status = code.getStatus();
        this.code = code.getCode();
        this.message = code.getMessage();
    }

    private ErrorResponse(ErrorCode code, String message) {
        this.status = code.getStatus();
        this.code = code.getCode();
        this.message = message;
    }

    // 팩토리 메서드: ErrorCode를 받아서 약봉지 생성
    public static ErrorResponse of(ErrorCode code) {
        return new ErrorResponse(code);
    }

    // 팩토리 메서드: 커스텀 메시지를 담아 약봉지 생성
    public static ErrorResponse of(ErrorCode code, String customMessage) {
        return new ErrorResponse(code, customMessage);
    }
}
