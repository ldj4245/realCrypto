package com.realcrypto.application.port.out;

import java.util.List;
import java.util.Optional;
import com.realcrypto.adapter.in.web.dto.TripleArbitrageDto;

public interface ArbitrageCachePort {

    void saveAll(List<TripleArbitrageDto> list);

    List<TripleArbitrageDto> findAll();

    Optional<TripleArbitrageDto> findBySymbol(String symbol);
}
