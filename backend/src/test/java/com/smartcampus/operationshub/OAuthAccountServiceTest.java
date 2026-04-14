package com.smartcampus.operationshub;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.smartcampus.operationshub.domain.AccountStatus;
import com.smartcampus.operationshub.domain.AuthProviderType;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.exception.ConflictException;
import com.smartcampus.operationshub.exception.ForbiddenException;
import com.smartcampus.operationshub.repository.BookingRepository;
import com.smartcampus.operationshub.repository.UserRepository;
import com.smartcampus.operationshub.service.AuthService;
import com.smartcampus.operationshub.service.OAuthAccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;

@SpringBootTest
class OAuthAccountServiceTest {

    @Autowired
    private OAuthAccountService oAuthAccountService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void googleLoginCreatesNewUserAccountWhenEmailIsNew() {
        User user = oAuthAccountService.handleGoogleLogin(
                "googleuser@campus.edu",
                "google-id-123",
                "Google User",
                "https://image.example/user.png",
                null);

        assertEquals(UserRole.USER, user.getRole());
        assertEquals(AuthProviderType.GOOGLE, user.getAuthProviderType());
        assertEquals("googleuser@campus.edu", user.getEmail());
    }

    @Test
    void sameEmailGoogleLoginLinksLocalAccountAndUpgradesProvider() {
        User localUser = new User();
        localUser.setCampusId("user001");
        localUser.setEmail("local@campus.edu");
        localUser.setFullName("Local User");
        localUser.setRole(UserRole.USER);
        localUser.setAccountStatus(AccountStatus.ACTIVE);
        localUser.setAuthProviderType(AuthProviderType.LOCAL);
        localUser = userRepository.save(localUser);

        User linkedUser = oAuthAccountService.handleGoogleLogin(
                "local@campus.edu", "google-id-456", "Local User", null, null);

        assertEquals(localUser.getId(), linkedUser.getId());
        assertEquals(AuthProviderType.BOTH, linkedUser.getAuthProviderType());
        assertEquals("google-id-456", linkedUser.getGoogleId());
        assertEquals(1, userRepository.count());
    }

    @Test
    void disabledAccountIsRejectedForGoogleLogin() {
        User disabledUser = new User();
        disabledUser.setCampusId("user003");
        disabledUser.setEmail("disabled@campus.edu");
        disabledUser.setFullName("Disabled User");
        disabledUser.setRole(UserRole.USER);
        disabledUser.setAccountStatus(AccountStatus.DISABLED);
        disabledUser.setAuthProviderType(AuthProviderType.LOCAL);
        userRepository.save(disabledUser);

        assertThrows(
                ForbiddenException.class,
                () -> oAuthAccountService.handleGoogleLogin(
                        "disabled@campus.edu", "google-id-disabled", "Disabled User", null, null));
    }

    @Test
    void technicianOrAdminGoogleLoginPreservesExistingPrivilegedRole() {
        User technician = new User();
        technician.setCampusId("tech001");
        technician.setEmail("tech@campus.edu");
        technician.setFullName("Technician User");
        technician.setRole(UserRole.TECHNICIAN);
        technician.setAccountStatus(AccountStatus.ACTIVE);
        technician.setAuthProviderType(AuthProviderType.LOCAL);
        technician = userRepository.save(technician);

        User linkedTechnician = oAuthAccountService.handleGoogleLogin(
                "tech@campus.edu", "google-tech-001", "Technician User", null, null);

        assertEquals(technician.getId(), linkedTechnician.getId());
        assertEquals(UserRole.TECHNICIAN, linkedTechnician.getRole());
        assertEquals(AuthProviderType.BOTH, linkedTechnician.getAuthProviderType());
    }

    @Test
    void linkingFlowRejectsDifferentEmailAccounts() {
        User localUser = new User();
        localUser.setCampusId("user002");
        localUser.setEmail("link@campus.edu");
        localUser.setFullName("Link User");
        localUser.setRole(UserRole.USER);
        localUser.setAccountStatus(AccountStatus.ACTIVE);
        localUser.setAuthProviderType(AuthProviderType.LOCAL);
        localUser = userRepository.save(localUser);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(AuthService.GOOGLE_LINK_USER_ID, localUser.getId());

        assertThrows(
                ForbiddenException.class,
                () -> oAuthAccountService.handleGoogleLogin(
                        "different@campus.edu", "google-id-789", "Linked User", null, session));
    }

    @Test
    void alreadyLinkedGoogleAccountCannotBeRelinkedToAnotherUser() {
        User firstUser = new User();
        firstUser.setCampusId("user010");
        firstUser.setEmail("first@campus.edu");
        firstUser.setFullName("First User");
        firstUser.setRole(UserRole.USER);
        firstUser.setAccountStatus(AccountStatus.ACTIVE);
        firstUser.setAuthProviderType(AuthProviderType.BOTH);
        firstUser.setGoogleId("shared-google-id");
        userRepository.save(firstUser);

        User secondUser = new User();
        secondUser.setCampusId("user011");
        secondUser.setEmail("second@campus.edu");
        secondUser.setFullName("Second User");
        secondUser.setRole(UserRole.USER);
        secondUser.setAccountStatus(AccountStatus.ACTIVE);
        secondUser.setAuthProviderType(AuthProviderType.LOCAL);
        secondUser = userRepository.save(secondUser);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(AuthService.GOOGLE_LINK_USER_ID, secondUser.getId());

        assertThrows(
                ConflictException.class,
                () -> oAuthAccountService.handleGoogleLogin(
                        "second@campus.edu", "shared-google-id", "Second User", null, session));
    }

    @Test
    void linkingFlowMatchesEmailAndUpgradesProvider() {
        User localUser = new User();
        localUser.setCampusId("user012");
        localUser.setEmail("manual-link@campus.edu");
        localUser.setFullName("Manual Link User");
        localUser.setRole(UserRole.USER);
        localUser.setAccountStatus(AccountStatus.ACTIVE);
        localUser.setAuthProviderType(AuthProviderType.LOCAL);
        localUser = userRepository.save(localUser);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(AuthService.GOOGLE_LINK_USER_ID, localUser.getId());

        User linkedUser = oAuthAccountService.handleGoogleLogin(
                "manual-link@campus.edu", "google-id-999", "Linked User", null, session);

        assertEquals(AuthProviderType.BOTH, linkedUser.getAuthProviderType());
        assertEquals("google-id-999", linkedUser.getGoogleId());
    }
}
