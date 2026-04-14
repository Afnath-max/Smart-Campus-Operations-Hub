package com.smartcampus.operationshub.service;

import com.smartcampus.operationshub.config.AppProperties;
import com.smartcampus.operationshub.domain.AccountStatus;
import com.smartcampus.operationshub.domain.AuthProviderType;
import com.smartcampus.operationshub.domain.Invitation;
import com.smartcampus.operationshub.domain.InvitationStatus;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.dto.admin.CreateInvitationRequest;
import com.smartcampus.operationshub.dto.admin.UpdateAuthProviderRequest;
import com.smartcampus.operationshub.dto.user.InvitationResponse;
import com.smartcampus.operationshub.dto.user.UserDetailResponse;
import com.smartcampus.operationshub.exception.BadRequestException;
import com.smartcampus.operationshub.exception.ConflictException;
import com.smartcampus.operationshub.exception.NotFoundException;
import com.smartcampus.operationshub.mapper.UserResponseMapper;
import com.smartcampus.operationshub.repository.InvitationRepository;
import com.smartcampus.operationshub.repository.UserRepository;
import com.smartcampus.operationshub.security.UserPrincipal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    public AdminUserService(
            UserRepository userRepository,
            InvitationRepository invitationRepository,
            PasswordEncoder passwordEncoder,
            AppProperties appProperties) {
        this.userRepository = userRepository;
        this.invitationRepository = invitationRepository;
        this.passwordEncoder = passwordEncoder;
        this.appProperties = appProperties;
    }

    @Transactional(readOnly = true)
    public List<UserDetailResponse> listUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream().map(UserResponseMapper::toDetail).toList();
    }

    @Transactional(readOnly = true)
    public UserDetailResponse getUser(UUID id) {
        return UserResponseMapper.toDetail(getUserEntity(id));
    }

    @Transactional
    public InvitationResponse createInvitation(UserPrincipal admin, CreateInvitationRequest request, UserRole role) {
        validateRole(role);
        String email = normalize(request.email());
        String campusId = normalize(request.campusId());

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("EMAIL_ALREADY_EXISTS", "A user with this email already exists");
        }
        if (userRepository.existsByCampusId(campusId)) {
            throw new ConflictException("CAMPUS_ID_ALREADY_EXISTS", "A user with this campus ID already exists");
        }
        if (invitationRepository.existsByInviteeEmailAndInvitationStatusAndInvitedRole(email, InvitationStatus.PENDING, role)) {
            throw new ConflictException("INVITATION_ALREADY_EXISTS", "There is already a pending invitation for this email");
        }

        validateInvitationAuthProviderSetup(request.authProviderType(), request.initialPassword());

        User user = new User();
        user.setCampusId(campusId);
        user.setEmail(email);
        user.setFullName(request.fullName());
        user.setRole(role);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setAuthProviderType(request.authProviderType());
        if (request.authProviderType().supportsLocal()) {
            user.setPasswordHash(passwordEncoder.encode(request.initialPassword()));
        }
        userRepository.save(user);

        Invitation invitation = new Invitation();
        invitation.setInviteeEmail(email);
        invitation.setInvitedRole(role);
        invitation.setInviterUserId(admin.id());
        invitation.setInvitationStatus(InvitationStatus.PENDING);
        invitation.setInviteToken(UUID.randomUUID().toString().replace("-", ""));
        invitation.setExpiresAt(Instant.now().plus(appProperties.getInvitationExpiryDays(), ChronoUnit.DAYS));
        invitationRepository.save(invitation);

        return UserResponseMapper.toInvitation(invitation, invitationUrl(invitation.getInviteToken()));
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> listInvitations() {
        return invitationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(invitation -> UserResponseMapper.toInvitation(invitation, invitationUrl(invitation.getInviteToken())))
                .toList();
    }

    @Transactional
    public UserDetailResponse updateRole(UUID id, UserRole role, UserPrincipal principal) {
        User user = getUserEntity(id);
        preventUnsafeAdminRoleChange(user, role, principal);
        user.setRole(role);
        return UserResponseMapper.toDetail(userRepository.save(user));
    }

    @Transactional
    public UserDetailResponse updateStatus(UUID id, AccountStatus status, UserPrincipal principal) {
        User user = getUserEntity(id);
        preventUnsafeAdminStatusChange(user, status, principal);
        user.setAccountStatus(status);
        return UserResponseMapper.toDetail(userRepository.save(user));
    }

    @Transactional
    public UserDetailResponse updateAuthProvider(UUID id, UpdateAuthProviderRequest request) {
        User user = getUserEntity(id);
        validateAuthProviderUpdate(user, request);
        user.setAuthProviderType(request.authProviderType());

        if (request.authProviderType().supportsLocal()) {
            if (request.initialPassword() != null && !request.initialPassword().isBlank()) {
                user.setPasswordHash(passwordEncoder.encode(request.initialPassword()));
            } else if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
                throw new BadRequestException(
                        "PASSWORD_REQUIRED",
                        "A password is required when enabling local login for an account without one");
            }
        } else {
            user.setPasswordHash(null);
        }

        return UserResponseMapper.toDetail(userRepository.save(user));
    }

    @Transactional
    public void deleteInvitation(UUID id) {
        Invitation invitation = invitationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("INVITATION_NOT_FOUND", "Invitation not found"));
        invitationRepository.delete(invitation);
    }

    private void validateRole(UserRole role) {
        if (role == UserRole.USER) {
            throw new BadRequestException("INVALID_INVITED_ROLE", "Only technician and admin invitations are supported");
        }
    }

    private void validateInvitationAuthProviderSetup(AuthProviderType authProviderType, String initialPassword) {
        if (authProviderType.supportsLocal() && (initialPassword == null || initialPassword.isBlank())) {
            throw new BadRequestException(
                    "PASSWORD_REQUIRED",
                    "An initial password is required when local login is enabled");
        }
        if (!authProviderType.supportsLocal() && initialPassword != null && !initialPassword.isBlank()) {
            throw new BadRequestException(
                    "PASSWORD_NOT_ALLOWED",
                    "Do not provide a password when local login is disabled for the invited account");
        }
    }

    private void validateAuthProviderUpdate(User user, UpdateAuthProviderRequest request) {
        if (!request.authProviderType().supportsLocal()
                && request.initialPassword() != null
                && !request.initialPassword().isBlank()) {
            throw new BadRequestException(
                    "PASSWORD_NOT_ALLOWED",
                    "Do not provide a password when local login is disabled for this account");
        }

        if (request.authProviderType().supportsLocal()
                && (user.getPasswordHash() == null || user.getPasswordHash().isBlank())
                && (request.initialPassword() == null || request.initialPassword().isBlank())) {
            throw new BadRequestException(
                    "PASSWORD_REQUIRED",
                    "A password is required when enabling local login for an account without one");
        }
    }

    private void preventUnsafeAdminRoleChange(User targetUser, UserRole nextRole, UserPrincipal principal) {
        if (targetUser.getRole() != UserRole.ADMIN || nextRole == UserRole.ADMIN) {
            return;
        }

        if (targetUser.getId().equals(principal.id())) {
            throw new BadRequestException(
                    "SELF_ADMIN_ROLE_CHANGE_FORBIDDEN",
                    "Use another admin account to change your own admin role");
        }

        if (targetUser.getAccountStatus() == AccountStatus.ACTIVE
                && userRepository.countByRoleAndAccountStatus(UserRole.ADMIN, AccountStatus.ACTIVE) <= 1) {
            throw new BadRequestException(
                    "LAST_ACTIVE_ADMIN_REQUIRED",
                    "At least one active admin account must remain in the system");
        }
    }

    private void preventUnsafeAdminStatusChange(User targetUser, AccountStatus nextStatus, UserPrincipal principal) {
        if (targetUser.getRole() != UserRole.ADMIN || nextStatus == AccountStatus.ACTIVE) {
            return;
        }

        if (targetUser.getId().equals(principal.id())) {
            throw new BadRequestException(
                    "SELF_ADMIN_STATUS_CHANGE_FORBIDDEN",
                    "Use another admin account to disable your own admin access");
        }

        if (targetUser.getAccountStatus() == AccountStatus.ACTIVE
                && userRepository.countByRoleAndAccountStatus(UserRole.ADMIN, AccountStatus.ACTIVE) <= 1) {
            throw new BadRequestException(
                    "LAST_ACTIVE_ADMIN_REQUIRED",
                    "At least one active admin account must remain in the system");
        }
    }

    private User getUserEntity(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
    }

    private String invitationUrl(String token) {
        return appProperties.getFrontendBaseUrl() + "/login?invite=" + token;
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }
}
