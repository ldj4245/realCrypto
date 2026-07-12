package com.realcrypto.adapter.out.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.realcrypto.domain.CollectTarget;
import com.realcrypto.application.port.out.CollectTargetQueryPort;

@Repository
public interface CollectTargetRepository extends JpaRepository<CollectTarget, Long>, CollectTargetQueryPort {

    @Override
    @Query("select c from CollectTarget c where c.isActive = true")
    List<CollectTarget> findActiveTargets();
}
