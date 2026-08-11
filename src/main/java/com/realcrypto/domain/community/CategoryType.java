package com.realcrypto.domain.community;

import lombok.Getter;

@Getter
public enum CategoryType {
    FREE("자유게시판"),
    PROFIT_LOSS("익절/손절 인증소"),
    ARBITRAGE_INFO("김프/차익거래 팁"),
    ANALYSIS("코인 분석/전망");

    private final String description;

    CategoryType(String description) {
        this.description = description;
    }
}
