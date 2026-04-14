package com.smartcampus.operationshub.features.access.repository;

import com.smartcampus.operationshub.domain.AccountStatus;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByCampusId(String campusId);

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    boolean existsByCampusId(String campusId);

    boolean existsByEmail(String email);

    boolean existsByGoogleId(String googleId);

    List<User> findAllByOrderByCreatedAtDesc();

    long countByRoleAndAccountStatus(UserRole role, AccountStatus accountStatus);
}

