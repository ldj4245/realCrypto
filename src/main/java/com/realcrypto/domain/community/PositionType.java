package com.realcrypto.domain.community;

import lombok.Getter;

@Getter
public enum PositionType {
    LONG("롱 🟢"),
    SHORT("숏 🔴"),
    NEUTRAL("중립 ⚪");

    private final String label;

    PositionType(String label) {
        this.label = label;
    }
}
