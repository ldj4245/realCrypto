package com.realcrypto.global.error;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice // 🏥 요새 전역의 에러 비명소리를 듣는 중앙 병원 통제실!
public class GlobalExceptionHandler {

    // 1. 우리가 직접 던진 커스텀 예외(BusinessException)를 낚아채서 처리합니다.
    @ExceptionHandler(BusinessException.class)
    protected ResponseEntity<ErrorResponse> handleBusinessException(final BusinessException e) {
        log.error("handleBusinessException", e);
        
        final ErrorCode errorCode = e.getErrorCode();
        final ErrorResponse response = ErrorResponse.of(errorCode, e.getMessage());
        
        return new ResponseEntity<>(response, HttpStatusCode.valueOf(errorCode.getStatus()));
    }

    // 2. 그 외에 자바 시스템에서 예기치 못하게 발생한 일반 모든 예외(Exception)를 낚아챕니다.
    @ExceptionHandler(Exception.class)
    protected ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("handleException", e);
        
        final ErrorResponse response = ErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR);
        
        return new ResponseEntity<>(response, HttpStatusCode.valueOf(ErrorCode.INTERNAL_SERVER_ERROR.getStatus()));
    }
}
