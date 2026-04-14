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
import com.smartcampus.operationshub.domain.Booking;
import com.smartcampus.operationshub.domain.BookingStatus;
import com.smartcampus.operationshub.domain.Resource;
import com.smartcampus.operationshub.domain.ResourceStatus;
import com.smartcampus.operationshub.domain.ResourceType;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.dto.auth.LoginRequest;
import com.smartcampus.operationshub.dto.booking.CreateBookingRequest;
import com.smartcampus.operationshub.repository.BookingRepository;
import com.smartcampus.operationshub.repository.ResourceRepository;
import com.smartcampus.operationshub.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
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
class BookingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Resource resource;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        resourceRepository.deleteAll();
        userRepository.deleteAll();

        createUser("admin001", "admin@campus.edu", UserRole.ADMIN, "Admin@12345");
        createUser("tech001", "tech@campus.edu", UserRole.TECHNICIAN, "Tech@12345");
        createUser("user001", "user@campus.edu", UserRole.USER, "User@12345");
        createUser("user002", "user2@campus.edu", UserRole.USER, "User@12345");

        Resource bookingResource = new Resource();
        bookingResource.setName("Advanced Lab");
        bookingResource.setType(ResourceType.LAB);
        bookingResource.setDescription("High demand lab");
        bookingResource.setCapacity(30);
        bookingResource.setLocation("Block C");
        bookingResource.setAvailableFrom(LocalTime.of(8, 0));
        bookingResource.setAvailableTo(LocalTime.of(18, 0));
        bookingResource.setStatus(ResourceStatus.ACTIVE);
        resource = resourceRepository.save(bookingResource);
    }

    @Test
    void userCanCreateBookingAndSeeItInOwnList() throws Exception {
        MockHttpSession userSession = login("user@campus.edu", "User@12345");

        mockMvc.perform(post("/api/bookings")
                        .with(csrf())
                        .session(userSession)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new CreateBookingRequest(
                                resource.getId(),
                                LocalDate.now().plusDays(1),
                                LocalTime.of(10, 0),
                                LocalTime.of(12, 0),
                                "Project workshop",
                                20))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"));

        mockMvc.perform(get("/api/bookings/my").session(userSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].resourceName").value("Advanced Lab"));
    }

    @Test
    void overlappingBookingReturnsConflict() throws Exception {
        User existingOwner = userRepository.findByEmail("user001@campus.edu").orElse(null);
        if (existingOwner == null) {
            existingOwner = userRepository.findByEmail("user@campus.edu").orElseThrow();
        }
        Booking booking = new Booking();
        booking.setResource(resource);
        booking.setUser(existingOwner);
        booking.setBookingDate(LocalDate.now().plusDays(2));
        booking.setStartTime(LocalTime.of(11, 0));
        booking.setEndTime(LocalTime.of(12, 0));
        booking.setPurpose("Existing reservation");
        booking.setExpectedAttendees(10);
        booking.setStatus(BookingStatus.APPROVED);
        bookingRepository.save(booking);

        MockHttpSession otherUserSession = login("user2@campus.edu", "User@12345");

        mockMvc.perform(post("/api/bookings")
                        .with(csrf())
                        .session(otherUserSession)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new CreateBookingRequest(
                                resource.getId(),
                                LocalDate.now().plusDays(2),
                                LocalTime.of(11, 30),
                                LocalTime.of(12, 30),
                                "Conflicting session",
                                8))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("BOOKING_CONFLICT"));
    }

    @Test
    void rejectWithoutReasonFailsValidation() throws Exception {
        MockHttpSession adminSession = login("admin@campus.edu", "Admin@12345");
        MockHttpSession userSession = login("user@campus.edu", "User@12345");

        MvcResult createResult = mockMvc.perform(post("/api/bookings")
                        .with(csrf())
                        .session(userSession)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new CreateBookingRequest(
                                resource.getId(),
                                LocalDate.now().plusDays(3),
                                LocalTime.of(9, 0),
                                LocalTime.of(10, 0),
                                "Class practice",
                                12))))
                .andExpect(status().isCreated())
                .andReturn();

        String bookingId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(put("/api/admin/bookings/{id}/reject", bookingId)
                        .with(csrf())
                        .session(adminSession)
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void nonAdminsCannotViewAdminBookings() throws Exception {
        MockHttpSession userSession = login("user@campus.edu", "User@12345");

        mockMvc.perform(get("/api/admin/bookings").session(userSession))
                .andExpect(status().isForbidden());
    }

    @Test
    void techniciansCannotCreateUserBookings() throws Exception {
        MockHttpSession technicianSession = login("tech@campus.edu", "Tech@12345");

        mockMvc.perform(post("/api/bookings")
                        .with(csrf())
                        .session(technicianSession)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new CreateBookingRequest(
                                resource.getId(),
                                LocalDate.now().plusDays(4),
                                LocalTime.of(13, 0),
                                LocalTime.of(14, 0),
                                "Technician should not book from user flow",
                                6))))
                .andExpect(status().isForbidden());
    }

    @Test
    void approvedBookingsExposeQrCodesToTheOwner() throws Exception {
        User owner = userRepository.findByEmail("user@campus.edu").orElseThrow();
        Booking booking = new Booking();
        booking.setResource(resource);
        booking.setUser(owner);
        booking.setBookingDate(LocalDate.now().plusDays(5));
        booking.setStartTime(LocalTime.of(15, 0));
        booking.setEndTime(LocalTime.of(16, 0));
        booking.setPurpose("Capstone review");
        booking.setExpectedAttendees(18);
        booking.setStatus(BookingStatus.APPROVED);
        booking = bookingRepository.save(booking);

        MockHttpSession userSession = login("user@campus.edu", "User@12345");

        mockMvc.perform(get("/api/bookings/{id}/qr", booking.getId()).session(userSession))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String contentType = result.getResponse().getContentType();
                    if (contentType == null || !contentType.startsWith("image/svg+xml")) {
                        throw new AssertionError("Expected image/svg+xml response but was " + contentType);
                    }
                    String body = result.getResponse().getContentAsString();
                    if (!body.contains("<svg") || !body.contains("rect")) {
                        throw new AssertionError("Expected QR SVG markup in response body");
                    }
                });
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

    private void createUser(String campusId, String email, UserRole role, String password) {
        User user = new User();
        user.setCampusId(campusId);
        user.setEmail(email);
        user.setFullName(email);
        user.setRole(role);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setAuthProviderType(AuthProviderType.LOCAL);
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);
    }
}
