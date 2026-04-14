package com.smartcampus.operationshub;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.operationshub.domain.AccountStatus;
import com.smartcampus.operationshub.domain.AuthProviderType;
import com.smartcampus.operationshub.domain.Resource;
import com.smartcampus.operationshub.domain.ResourceStatus;
import com.smartcampus.operationshub.domain.ResourceType;
import com.smartcampus.operationshub.domain.TicketCategory;
import com.smartcampus.operationshub.domain.TicketPriority;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.dto.auth.LoginRequest;
import com.smartcampus.operationshub.dto.booking.CreateBookingRequest;
import com.smartcampus.operationshub.dto.ticket.CreateTicketCommentRequest;
import com.smartcampus.operationshub.dto.ticket.CreateTicketRequest;
import com.smartcampus.operationshub.dto.ticket.UpdateTicketStatusRequest;
import com.smartcampus.operationshub.repository.BookingRepository;
import com.smartcampus.operationshub.repository.NotificationPreferenceRepository;
import com.smartcampus.operationshub.repository.NotificationRepository;
import com.smartcampus.operationshub.repository.ResourceRepository;
import com.smartcampus.operationshub.repository.TicketCommentRepository;
import com.smartcampus.operationshub.repository.TicketImageRepository;
import com.smartcampus.operationshub.repository.TicketRepository;
import com.smartcampus.operationshub.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class NotificationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Autowired
    private TicketCommentRepository ticketCommentRepository;

    @Autowired
    private TicketImageRepository ticketImageRepository;

    @Autowired
    private TicketRepository ticketRepository;

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
        notificationRepository.deleteAll();
        notificationPreferenceRepository.deleteAll();
        ticketCommentRepository.deleteAll();
        ticketImageRepository.deleteAll();
        ticketRepository.deleteAll();
        bookingRepository.deleteAll();
        resourceRepository.deleteAll();
        userRepository.deleteAll();

        createUser("admin001", "admin@campus.edu", UserRole.ADMIN, "Admin@12345");
        createUser("user001", "user@campus.edu", UserRole.USER, "User@12345");

        Resource bookingResource = new Resource();
        bookingResource.setName("Campus Hall");
        bookingResource.setType(ResourceType.LECTURE_HALL);
        bookingResource.setDescription("Main hall");
        bookingResource.setCapacity(120);
        bookingResource.setLocation("Main Building");
        bookingResource.setAvailableFrom(LocalTime.of(8, 0));
        bookingResource.setAvailableTo(LocalTime.of(18, 0));
        bookingResource.setStatus(ResourceStatus.ACTIVE);
        resource = resourceRepository.save(bookingResource);
    }

    @Test
    void bookingApprovalCreatesNotificationAndReadAllClearsUnreadCount() throws Exception {
        MockHttpSession adminSession = login("admin@campus.edu", "Admin@12345");
        MockHttpSession userSession = login("user@campus.edu", "User@12345");

        MvcResult createBooking = mockMvc.perform(post("/api/bookings")
                        .with(csrf())
                        .session(userSession)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new CreateBookingRequest(
                                resource.getId(),
                                LocalDate.now().plusDays(2),
                                LocalTime.of(10, 0),
                                LocalTime.of(11, 0),
                                "Faculty orientation session",
                                60))))
                .andExpect(status().isCreated())
                .andReturn();

        String bookingId = objectMapper.readTree(createBooking.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(put("/api/admin/bookings/{id}/approve", bookingId)
                        .with(csrf())
                        .session(adminSession))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/notifications/unread/count").session(userSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(1));

        mockMvc.perform(get("/api/notifications").session(userSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("BOOKING_APPROVED"));

        mockMvc.perform(put("/api/notifications/read-all")
                        .with(csrf())
                        .session(userSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));
    }

    @Test
    void disablingCommentNotificationsPreventsNewCommentAlerts() throws Exception {
        MockHttpSession adminSession = login("admin@campus.edu", "Admin@12345");
        MockHttpSession userSession = login("user@campus.edu", "User@12345");

        mockMvc.perform(put("/api/preferences/notifications")
                        .with(csrf())
                        .session(userSession)
                        .contentType("application/json")
                        .content("""
                                {
                                  "bookingUpdatesEnabled": true,
                                  "ticketAssignmentEnabled": true,
                                  "ticketStatusEnabled": true,
                                  "ticketCommentEnabled": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketCommentEnabled").value(false));

        MvcResult createTicket = mockMvc.perform(buildTicketRequest(
                        userSession,
                        new CreateTicketRequest(
                                resource.getId(),
                                TicketCategory.OTHER,
                                "The seminar room display controller needs inspection before the next scheduled class.",
                                TicketPriority.MEDIUM,
                                "user@campus.edu")))
                .andExpect(status().isCreated())
                .andReturn();

        String ticketId = objectMapper.readTree(createTicket.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(post("/api/tickets/{id}/comments", ticketId)
                        .with(csrf())
                        .session(adminSession)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(
                                new CreateTicketCommentRequest("Admin triage note for the display controller issue."))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/notifications/unread/count").session(userSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));
    }

    private org.springframework.test.web.servlet.RequestBuilder buildTicketRequest(
            MockHttpSession session, CreateTicketRequest request) throws Exception {
        MockMultipartFile ticketPart = new MockMultipartFile(
                "ticket",
                "ticket.json",
                "application/json",
                objectMapper.writeValueAsBytes(request));
        org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder builder =
                multipart("/api/tickets").file(ticketPart);
        builder.with(csrf());
        builder.session(session);
        return builder;
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
