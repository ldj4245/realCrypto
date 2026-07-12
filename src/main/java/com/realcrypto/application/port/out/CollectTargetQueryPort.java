package com.realcrypto.application.port.out;

import com.realcrypto.domain.CollectTarget;
import java.util.List;

public interface CollectTargetQueryPort {
    // 💡 헥사고날 규칙에 맞춰 사령실에 정의하는 수집 대상 조회용 출력 포트
    List<CollectTarget> findActiveTargets();
}
