package com.smartcampus.operationshub;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import com.smartcampus.operationshub.domain.Ticket;
import com.smartcampus.operationshub.domain.TicketCategory;
import com.smartcampus.operationshub.domain.TicketPriority;
import com.smartcampus.operationshub.domain.TicketStatus;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.features.access.dto.auth.LoginRequest;
import com.smartcampus.operationshub.features.bookings.repository.BookingRepository;
import com.smartcampus.operationshub.features.notifications.repository.NotificationPreferenceRepository;
import com.smartcampus.operationshub.features.notifications.repository.NotificationRepository;
import com.smartcampus.operationshub.features.resources.repository.ResourceRepository;
import com.smartcampus.operationshub.features.tickets.repository.TicketCommentRepository;
import com.smartcampus.operationshub.features.tickets.repository.TicketImageRepository;
import com.smartcampus.operationshub.features.tickets.repository.TicketRepository;
import com.smartcampus.operationshub.features.access.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.AfterEach;
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
class AdminAnalyticsIntegrationTest {

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

    @BeforeEach
    void setUp() {
        clearData();

        User admin = createUser("admin001", "admin@campus.edu", UserRole.ADMIN, "Admin@12345");
        User technician = createUser("tech001", "tech@campus.edu", UserRole.TECHNICIAN, "Tech@12345");
        User user = createUser("user001", "user@campus.edu", UserRole.USER, "User@12345");

        Resource resource = new Resource();
        resource.setName("Innovation Lab");
        resource.setType(ResourceType.LAB);
        resource.setDescription("Advanced systems laboratory");
        resource.setCapacity(48);
        resource.setLocation("Engineering Annex");
        resource.setAvailableFrom(LocalTime.of(8, 0));
        resource.setAvailableTo(LocalTime.of(20, 0));
        resource.setStatus(ResourceStatus.ACTIVE);
        resource = resourceRepository.save(resource);

        Booking approvedBooking = new Booking();
        approvedBooking.setResource(resource);
        approvedBooking.setUser(user);
        approvedBooking.setBookingDate(LocalDate.now().plusDays(2));
        approvedBooking.setStartTime(LocalTime.of(10, 0));
        approvedBooking.setEndTime(LocalTime.of(11, 0));
        approvedBooking.setPurpose("Robotics workshop");
        approvedBooking.setExpectedAttendees(30);
        approvedBooking.setStatus(BookingStatus.APPROVED);
        bookingRepository.save(approvedBooking);

        Booking pendingBooking = new Booking();
        pendingBooking.setResource(resource);
        pendingBooking.setUser(user);
        pendingBooking.setBookingDate(LocalDate.now().plusDays(3));
        pendingBooking.setStartTime(LocalTime.of(13, 0));
        pendingBooking.setEndTime(LocalTime.of(14, 30));
        pendingBooking.setPurpose("Faculty training");
        pendingBooking.setExpectedAttendees(20);
        pendingBooking.setStatus(BookingStatus.PENDING);
        bookingRepository.save(pendingBooking);

        Ticket openTicket = new Ticket();
        openTicket.setResource(resource);
        openTicket.setReporter(user);
        openTicket.setAssignedTechnician(technician);
        openTicket.setCategory(TicketCategory.EQUIPMENT);
        openTicket.setDescription("Printer controller is unresponsive.");
        openTicket.setPriority(TicketPriority.HIGH);
        openTicket.setPreferredContact("user@campus.edu");
        openTicket.setStatus(TicketStatus.OPEN);
        ticketRepository.save(openTicket);

        Ticket resolvedTicket = new Ticket();
        resolvedTicket.setResource(resource);
        resolvedTicket.setReporter(user);
        resolvedTicket.setAssignedTechnician(technician);
        resolvedTicket.setCategory(TicketCategory.FACILITY);
        resolvedTicket.setDescription("Lighting issue in the lab corridor.");
        resolvedTicket.setPriority(TicketPriority.MEDIUM);
        resolvedTicket.setPreferredContact("user@campus.edu");
        resolvedTicket.setStatus(TicketStatus.RESOLVED);
        resolvedTicket.setResolvedAt(Instant.now());
        ticketRepository.save(resolvedTicket);
    }

    @AfterEach
    void tearDown() {
        clearData();
    }

    private void clearData() {
        notificationRepository.deleteAll();
        notificationPreferenceRepository.deleteAll();
        ticketCommentRepository.deleteAll();
        ticketImageRepository.deleteAll();
        ticketRepository.deleteAll();
        bookingRepository.deleteAll();
        resourceRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void adminCanReadOverviewAndResourceAnalytics() throws Exception {
        MockHttpSession adminSession = login("admin@campus.edu", "Admin@12345");

        mockMvc.perform(get("/api/admin/stats/overview").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalResources").value(1))
                .andExpect(jsonPath("$.activeResources").value(1))
                .andExpect(jsonPath("$.totalUsers").value(3))
                .andExpect(jsonPath("$.activeTechnicians").value(1))
                .andExpect(jsonPath("$.pendingBookings").value(1))
                .andExpect(jsonPath("$.approvedBookings").value(1))
                .andExpect(jsonPath("$.openTickets").value(1));

        mockMvc.perform(get("/api/admin/stats/resources/top").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].resourceName").value("Innovation Lab"))
                .andExpect(jsonPath("$[0].totalRequests").value(2))
                .andExpect(jsonPath("$[0].approvedBookings").value(1));

        mockMvc.perform(get("/api/admin/stats/sla").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priorityBreakdown.length()").value(3));
    }

    @Test
    void nonAdminCannotAccessAnalyticsEndpoints() throws Exception {
        MockHttpSession userSession = login("user@campus.edu", "User@12345");

        mockMvc.perform(get("/api/admin/stats/overview").session(userSession))
                .andExpect(status().isForbidden());
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

    private User createUser(String campusId, String email, UserRole role, String password) {
        User user = new User();
        user.setCampusId(campusId);
        user.setEmail(email);
        user.setFullName(email);
        user.setRole(role);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setAuthProviderType(AuthProviderType.LOCAL);
        user.setPasswordHash(passwordEncoder.encode(password));
        return userRepository.save(user);
    }
}

