package com.smartcampus.operationshub.repository;

import com.smartcampus.operationshub.domain.Resource;
import java.util.UUID;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface ResourceRepository extends JpaRepository<Resource, UUID>, JpaSpecificationExecutor<Resource> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Resource r where r.id = :id")
    Optional<Resource> findByIdForUpdate(UUID id);
}
