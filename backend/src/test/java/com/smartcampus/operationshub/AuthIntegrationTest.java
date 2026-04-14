package com.smartcampus.operationshub;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.operationshub.domain.AccountStatus;
import com.smartcampus.operationshub.domain.AuthProviderType;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.features.access.dto.auth.LoginRequest;
import com.smartcampus.operationshub.features.access.dto.auth.RegisterRequest;
import com.smartcampus.operationshub.features.bookings.repository.BookingRepository;
import com.smartcampus.operationshub.features.access.repository.InvitationRepository;
import com.smartcampus.operationshub.features.access.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        invitationRepository.deleteAll();
        userRepository.deleteAll();
        createUser("user001", "user@campus.edu", "Campus User", UserRole.USER, AccountStatus.ACTIVE, "User@12345");
        createUser("tech001", "tech@campus.edu", "Campus Technician", UserRole.TECHNICIAN, AccountStatus.ACTIVE, "Tech@12345");
        createUser("admin001", "admin@campus.edu", "Campus Admin", UserRole.ADMIN, AccountStatus.ACTIVE, "Admin@12345");
        createUser("disabled001", "disabled@campus.edu", "Disabled User", UserRole.USER, AccountStatus.DISABLED, "User@12345");
    }

    @Test
    void userLoginLoadsProfileAndDashboardRoute() throws Exception {
        MockHttpSession session = login("user@campus.edu", "User@12345");

        mockMvc.perform(get("/api/users/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.email").value("user@campus.edu"));
    }

    @Test
    void technicianLoginLoadsTechnicianRole() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequest("tech@campus.edu", "Tech@12345"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redirectTo").value("/technician/dashboard"))
                .andExpect(jsonPath("$.user.role").value("TECHNICIAN"));
    }

    @Test
    void adminLoginCanReachAdminEndpoint() throws Exception {
        MockHttpSession session = login("admin@campus.edu", "Admin@12345");

        mockMvc.perform(get("/api/admin/users").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].role").exists());
    }

    @Test
    void registerCreatesUserSession() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("new001", "new@campus.edu", "New User", "Strong@123"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.redirectTo").value("/dashboard"))
                .andExpect(jsonPath("$.user.role").value("USER"));
    }

    @Test
    void duplicateRegistrationIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("user001", "user@campus.edu", "Duplicate User", "Strong@123"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    void disabledUserCannotLogIn() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequest("disabled@campus.edu", "User@12345"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_DISABLED"));
    }

    @Test
    void loginRequiresEmailNotCampusId() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequest("user001", "User@12345"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists());
    }

    @Test
    void unauthenticatedProfileRequestIsRejected() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void wrongRoleEndpointIsRejected() throws Exception {
        MockHttpSession session = login("user@campus.edu", "User@12345");

        mockMvc.perform(get("/api/admin/users").session(session))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCannotDisableOwnAccount() throws Exception {
        MockHttpSession session = login("admin@campus.edu", "Admin@12345");
        String adminId = userRepository.findByCampusId("admin001").orElseThrow().getId().toString();

        mockMvc.perform(put("/api/admin/users/{id}/status", adminId)
                        .with(csrf())
                        .session(session)
                        .contentType("application/json")
                        .content("""
                                {"status":"DISABLED"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SELF_ADMIN_STATUS_CHANGE_FORBIDDEN"));
    }

    @Test
    void lastActiveAdminCannotLoseAdminRole() throws Exception {
        MockHttpSession session = login("admin@campus.edu", "Admin@12345");
        String adminId = userRepository.findByCampusId("admin001").orElseThrow().getId().toString();

        mockMvc.perform(put("/api/admin/users/{id}/role", adminId)
                        .with(csrf())
                        .session(session)
                        .contentType("application/json")
                        .content("""
                                {"role":"USER"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SELF_ADMIN_ROLE_CHANGE_FORBIDDEN"));
    }

    @Test
    void logoutInvalidatesTheAuthenticatedSession() throws Exception {
        MockHttpSession session = login("user@campus.edu", "User@12345");

        mockMvc.perform(post("/api/auth/logout").session(session))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/users/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void googleAuthorizationUrlFailsSafelyWhenOAuthIsNotConfigured() throws Exception {
        mockMvc.perform(get("/api/auth/google/authorization-url"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("GOOGLE_AUTH_NOT_CONFIGURED"));
    }

    @Test
    void linkGoogleFailsSafelyInsteadOfCsrfBlockingWhenOAuthIsNotConfigured() throws Exception {
        MockHttpSession session = login("admin@campus.edu", "Admin@12345");

        mockMvc.perform(post("/api/auth/link-google").session(session))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("GOOGLE_AUTH_NOT_CONFIGURED"));
    }

    private MockHttpSession login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn();

        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private void createUser(
            String campusId,
            String email,
            String fullName,
            UserRole role,
            AccountStatus status,
            String rawPassword) {
        User user = new User();
        user.setCampusId(campusId);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setRole(role);
        user.setAccountStatus(status);
        user.setAuthProviderType(AuthProviderType.LOCAL);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        userRepository.save(user);
    }
}

