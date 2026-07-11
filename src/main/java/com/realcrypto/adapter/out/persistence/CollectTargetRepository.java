package com.realcrypto.adapter.out.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.realcrypto.adapter.out.persistence.entity.CollectTarget;

public interface CollectTargetRepository extends JpaRepository<CollectTarget, Long> {

    List<CollectTarget> findByIsActiveTrue();
}
