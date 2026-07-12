package com.realcrypto.application.port.in;

import com.realcrypto.domain.CollectTarget;
import java.util.List;

public interface PriceCollectUseCase {
    // 💡 1. 활성화된 모든 코인 수집 대상을 조회하는 규칙
    List<CollectTarget> getActiveTargets();

    // 💡 2. 특정 대상을 외부에서 긁어와 저장하는 규칙
    void collect(CollectTarget target);
}
