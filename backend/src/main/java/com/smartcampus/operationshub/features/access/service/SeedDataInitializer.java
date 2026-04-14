package com.smartcampus.operationshub.features.access.service;

import com.smartcampus.operationshub.config.AppProperties;
import com.smartcampus.operationshub.domain.AccountStatus;
import com.smartcampus.operationshub.domain.AuthProviderType;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.features.access.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class SeedDataInitializer implements ApplicationRunner {

    private final AppProperties appProperties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public SeedDataInitializer(
            AppProperties appProperties, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.appProperties = appProperties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!appProperties.getSeed().isEnabled()) {
            return;
        }
        createIfMissing(
                "user001",
                "user@smartcampus.local",
                "Campus User",
                UserRole.USER,
                appProperties.getSeed().getUserPassword());
        createIfMissing(
                "admin001",
                "admin@smartcampus.local",
                "Campus Administrator",
                UserRole.ADMIN,
                appProperties.getSeed().getAdminPassword());
        createIfMissing(
                "tech001",
                "technician@smartcampus.local",
                "Lead Technician",
                UserRole.TECHNICIAN,
                appProperties.getSeed().getTechnicianPassword());
    }

    private void createIfMissing(
            String campusId, String email, String fullName, UserRole role, String password) {
        if (userRepository.existsByEmail(email) || userRepository.existsByCampusId(campusId)) {
            return;
        }
        User user = new User();
        user.setCampusId(campusId);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setRole(role);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setAuthProviderType(AuthProviderType.LOCAL);
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);
    }
}

