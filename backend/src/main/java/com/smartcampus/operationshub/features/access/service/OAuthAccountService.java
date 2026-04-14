package com.smartcampus.operationshub.features.access.service;

import com.smartcampus.operationshub.domain.AccountStatus;
import com.smartcampus.operationshub.domain.AuthProviderType;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.exception.BadRequestException;
import com.smartcampus.operationshub.exception.ConflictException;
import com.smartcampus.operationshub.exception.ForbiddenException;
import com.smartcampus.operationshub.exception.NotFoundException;
import com.smartcampus.operationshub.features.access.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OAuthAccountService {

    private final UserRepository userRepository;

    public OAuthAccountService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User handleGoogleLogin(
            String email, String googleId, String fullName, String profileImageUrl, HttpSession session) {
        if (email == null || email.isBlank() || googleId == null || googleId.isBlank()) {
            throw new BadRequestException("GOOGLE_PROFILE_INVALID", "Google profile is missing required account data");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        String normalizedGoogleId = googleId.trim();

        UUID linkingUserId = session != null ? (UUID) session.getAttribute(AuthService.GOOGLE_LINK_USER_ID) : null;
        if (session != null) {
            session.removeAttribute(AuthService.GOOGLE_LINK_USER_ID);
        }

        if (linkingUserId != null) {
            return linkGoogleAccount(linkingUserId, normalizedEmail, normalizedGoogleId, fullName, profileImageUrl);
        }

        User googleUser = userRepository.findByGoogleId(normalizedGoogleId).orElse(null);
        if (googleUser != null) {
            ensureActive(googleUser);
            updateGoogleProfile(googleUser, fullName, profileImageUrl);
            return userRepository.save(googleUser);
        }

        User existingByEmail = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (existingByEmail == null) {
            User user = new User();
            user.setCampusId(generateCampusId(normalizedEmail));
            user.setEmail(normalizedEmail);
            user.setFullName(fullName == null || fullName.isBlank() ? normalizedEmail : fullName);
            user.setRole(UserRole.USER);
            user.setAccountStatus(AccountStatus.ACTIVE);
            user.setAuthProviderType(AuthProviderType.GOOGLE);
            user.setGoogleId(normalizedGoogleId);
            user.setProfileImageUrl(profileImageUrl);
            return userRepository.save(user);
        }

        ensureActive(existingByEmail);
        if (existingByEmail.getGoogleId() != null && !existingByEmail.getGoogleId().equals(normalizedGoogleId)) {
            throw new ConflictException(
                    "GOOGLE_ACCOUNT_CONFLICT",
                    "This account is already linked to a different Google identity");
        }

        existingByEmail.setGoogleId(normalizedGoogleId);
        if (existingByEmail.getAuthProviderType() == AuthProviderType.LOCAL) {
            existingByEmail.setAuthProviderType(AuthProviderType.BOTH);
        }
        updateGoogleProfile(existingByEmail, fullName, profileImageUrl);
        return userRepository.save(existingByEmail);
    }

    private User linkGoogleAccount(
            UUID linkingUserId, String email, String googleId, String fullName, String profileImageUrl) {
        User user = userRepository.findById(linkingUserId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "The account to link could not be found"));
        ensureActive(user);

        if (!user.getEmail().equals(email)) {
            throw new ForbiddenException(
                    "GOOGLE_EMAIL_MISMATCH",
                    "The Google account email must match the signed-in account email");
        }

        userRepository.findByGoogleId(googleId)
                .filter(existing -> !existing.getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw new ConflictException(
                            "GOOGLE_ALREADY_LINKED",
                            "That Google account is already linked to another Smart Campus account");
                });

        if (!user.supportsLocalLogin()) {
            throw new ForbiddenException(
                    "GOOGLE_LINK_NOT_ALLOWED",
                    "Only local-enabled accounts can complete the Google linking flow");
        }

        user.setGoogleId(googleId);
        if (user.getAuthProviderType() == AuthProviderType.LOCAL) {
            user.setAuthProviderType(AuthProviderType.BOTH);
        }
        updateGoogleProfile(user, fullName, profileImageUrl);
        return userRepository.save(user);
    }

    private void ensureActive(User user) {
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("ACCOUNT_DISABLED", "This account is disabled");
        }
    }

    private void updateGoogleProfile(User user, String fullName, String profileImageUrl) {
        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName);
        }
        if (profileImageUrl != null && !profileImageUrl.isBlank()) {
            user.setProfileImageUrl(profileImageUrl);
        }
    }

    private String generateCampusId(String email) {
        String base = email.substring(0, email.indexOf('@')).replaceAll("[^a-zA-Z0-9]", "");
        if (base.isBlank()) {
            base = "user";
        }
        base = base.length() > 18 ? base.substring(0, 18) : base;

        String campusId;
        int counter = 1;
        do {
            campusId = ("g-" + base + "-" + counter).toLowerCase(Locale.ROOT);
            counter++;
        } while (userRepository.existsByCampusId(campusId) && counter < 10_000);

        if (userRepository.existsByCampusId(campusId)) {
            throw new ConflictException("CAMPUS_ID_GENERATION_FAILED", "Could not generate a unique campus ID");
        }

        return campusId;
    }
}

