package com.smartcampus.operationshub.service;

import com.smartcampus.operationshub.domain.AccountStatus;
import com.smartcampus.operationshub.domain.AuthProviderType;
import com.smartcampus.operationshub.domain.InvitationStatus;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.dto.auth.AuthSessionResponse;
import com.smartcampus.operationshub.dto.auth.LinkGoogleStartResponse;
import com.smartcampus.operationshub.dto.auth.LoginRequest;
import com.smartcampus.operationshub.dto.auth.RegisterRequest;
import com.smartcampus.operationshub.dto.user.UserSummaryResponse;
import com.smartcampus.operationshub.exception.BadRequestException;
import com.smartcampus.operationshub.exception.ConflictException;
import com.smartcampus.operationshub.mapper.UserResponseMapper;
import com.smartcampus.operationshub.repository.InvitationRepository;
import com.smartcampus.operationshub.repository.UserRepository;
import com.smartcampus.operationshub.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.Locale;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    public static final String GOOGLE_LINK_USER_ID = "GOOGLE_LINK_USER_ID";

    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final ObjectProvider<ClientRegistrationRepository> clientRegistrationRepositoryProvider;

    public AuthService(
            UserRepository userRepository,
            InvitationRepository invitationRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository,
            ObjectProvider<ClientRegistrationRepository> clientRegistrationRepositoryProvider) {
        this.userRepository = userRepository;
        this.invitationRepository = invitationRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.clientRegistrationRepositoryProvider = clientRegistrationRepositoryProvider;
    }

    @Transactional
    public AuthSessionResponse register(
            RegisterRequest request, HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        String email = normalize(request.email());
        String campusId = normalize(request.campusId());

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("EMAIL_ALREADY_EXISTS", "An account with this email already exists");
        }

        if (userRepository.existsByCampusId(campusId)) {
            throw new ConflictException("CAMPUS_ID_ALREADY_EXISTS", "An account with this campus ID already exists");
        }

        boolean reservedByInvite = invitationRepository.existsByInviteeEmailAndInvitationStatusAndInvitedRole(
                email, InvitationStatus.PENDING, UserRole.TECHNICIAN)
                || invitationRepository.existsByInviteeEmailAndInvitationStatusAndInvitedRole(
                        email, InvitationStatus.PENDING, UserRole.ADMIN);
        if (reservedByInvite) {
            throw new ConflictException(
                    "EMAIL_RESERVED_BY_INVITATION",
                    "This email is already reserved for an invited technician or admin account");
        }

        User user = new User();
        user.setCampusId(campusId);
        user.setEmail(email);
        user.setFullName(request.fullName());
        user.setRole(UserRole.USER);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setAuthProviderType(AuthProviderType.LOCAL);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        UserPrincipal principal = UserPrincipal.fromUser(user);
        saveSession(principal, servletRequest, servletResponse);
        return new AuthSessionResponse(UserResponseMapper.toSummary(principal), redirectForRole(principal.role()));
    }

    public AuthSessionResponse login(
            LoginRequest request, HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(request.email(), request.password()));

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        saveSession(principal, servletRequest, servletResponse);
        return new AuthSessionResponse(UserResponseMapper.toSummary(principal), redirectForRole(principal.role()));
    }

    public void logout(Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
    }

    public UserSummaryResponse currentUser(UserPrincipal principal) {
        return UserResponseMapper.toSummary(principal);
    }

    public LinkGoogleStartResponse beginGoogleLink(UserPrincipal principal, HttpSession session) {
        if (session == null) {
            throw new BadRequestException("SESSION_REQUIRED", "An active session is required to link Google");
        }
        if (!principal.authProviderType().supportsLocal()) {
            throw new BadRequestException(
                    "GOOGLE_LINK_NOT_ALLOWED",
                    "Only accounts with local access can start the Google linking flow");
        }
        if (principal.googleLinked()) {
            throw new ConflictException("GOOGLE_ALREADY_LINKED", "This account is already linked to Google");
        }
        LinkGoogleStartResponse authorizationUrl = googleAuthorizationUrl();
        session.setAttribute(GOOGLE_LINK_USER_ID, principal.id());
        return authorizationUrl;
    }

    public LinkGoogleStartResponse googleAuthorizationUrl() {
        ClientRegistrationRepository clientRegistrationRepository = clientRegistrationRepositoryProvider.getIfAvailable();
        if (clientRegistrationRepository == null
                || clientRegistrationRepository.findByRegistrationId("google") == null) {
            throw new BadRequestException(
                    "GOOGLE_AUTH_NOT_CONFIGURED",
                    "Google sign-in is not configured for this environment yet");
        }
        return new LinkGoogleStartResponse("/oauth2/authorization/google");
    }

    private void saveSession(UserPrincipal principal, HttpServletRequest request, HttpServletResponse response) {
        Authentication sessionAuthentication = UsernamePasswordAuthenticationToken.authenticated(
                principal, null, principal.authorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(sessionAuthentication);
        SecurityContextHolder.setContext(context);
        request.getSession(true);
        securityContextRepository.saveContext(context, request, response);
    }

    private String normalize(String input) {
        return input == null ? null : input.trim().toLowerCase(Locale.ROOT);
    }

    private String redirectForRole(UserRole role) {
        return switch (role) {
            case USER -> "/dashboard";
            case TECHNICIAN -> "/technician/dashboard";
            case ADMIN -> "/admin/dashboard";
        };
    }
}
