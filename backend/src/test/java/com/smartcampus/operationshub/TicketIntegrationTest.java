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
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.dto.auth.LoginRequest;
import com.smartcampus.operationshub.dto.ticket.AssignTicketRequest;
import com.smartcampus.operationshub.dto.ticket.CreateTicketCommentRequest;
import com.smartcampus.operationshub.dto.ticket.CreateTicketRequest;
import com.smartcampus.operationshub.dto.ticket.UpdateTicketCommentRequest;
import com.smartcampus.operationshub.dto.ticket.UpdateTicketStatusRequest;
import com.smartcampus.operationshub.repository.BookingRepository;
import com.smartcampus.operationshub.repository.ResourceRepository;
import com.smartcampus.operationshub.repository.TicketCommentRepository;
import com.smartcampus.operationshub.repository.TicketImageRepository;
import com.smartcampus.operationshub.repository.TicketRepository;
import com.smartcampus.operationshub.repository.UserRepository;
import java.nio.charset.StandardCharsets;
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
class TicketIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
        ticketCommentRepository.deleteAll();
        ticketImageRepository.deleteAll();
        ticketRepository.deleteAll();
        bookingRepository.deleteAll();
        resourceRepository.deleteAll();
        userRepository.deleteAll();

        createUser("admin001", "admin@campus.edu", UserRole.ADMIN, "Admin@12345");
        createUser("tech001", "tech@campus.edu", UserRole.TECHNICIAN, "Tech@12345");
        createUser("user001", "user@campus.edu", UserRole.USER, "User@12345");
        createUser("user002", "user2@campus.edu", UserRole.USER, "User@12345");

        Resource ticketResource = new Resource();
        ticketResource.setName("Engineering Lab");
        ticketResource.setType(ResourceType.LAB);
        ticketResource.setDescription("Engineering lab");
        ticketResource.setCapacity(40);
        ticketResource.setLocation("Block D");
        ticketResource.setAvailableFrom(LocalTime.of(8, 0));
        ticketResource.setAvailableTo(LocalTime.of(18, 0));
        ticketResource.setStatus(ResourceStatus.ACTIVE);
        resource = resourceRepository.save(ticketResource);
    }

    @Test
    void userCanCreateTicketAndLoadOwnList() throws Exception {
        MockHttpSession userSession = login("user@campus.edu", "User@12345");

        mockMvc.perform(buildTicketRequest(userSession, new CreateTicketRequest(
                                resource.getId(),
                                com.smartcampus.operationshub.domain.TicketCategory.EQUIPMENT,
                                "The projector in the engineering lab is flickering during scheduled sessions.",
                                com.smartcampus.operationshub.domain.TicketPriority.HIGH,
                                "user@campus.edu / ext 145"), createImage("issue-1.png")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.imageCount").value(1));

        mockMvc.perform(get("/api/tickets/my").session(userSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].category").value("EQUIPMENT"));
    }

    @Test
    void uploadingFourthImageFailsValidation() throws Exception {
        MockHttpSession userSession = login("user@campus.edu", "User@12345");

        mockMvc.perform(buildTicketRequest(
                        userSession,
                        new CreateTicketRequest(
                                resource.getId(),
                                com.smartcampus.operationshub.domain.TicketCategory.FACILITY,
                                "The air conditioning unit in the seminar space is leaking onto the floor tiles.",
                                com.smartcampus.operationshub.domain.TicketPriority.MEDIUM,
                                "user@campus.edu"),
                        createImage("issue-1.png"),
                        createImage("issue-2.png"),
                        createImage("issue-3.png"),
                        createImage("issue-4.png")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("IMAGE_LIMIT_EXCEEDED"));
    }

    @Test
    void assignedTechnicianCanMoveTicketIntoProgress() throws Exception {
        MockHttpSession adminSession = login("admin@campus.edu", "Admin@12345");
        MockHttpSession technicianSession = login("tech@campus.edu", "Tech@12345");
        MockHttpSession userSession = login("user@campus.edu", "User@12345");

        MvcResult createResult = mockMvc.perform(buildTicketRequest(
                        userSession,
                        new CreateTicketRequest(
                                resource.getId(),
                                com.smartcampus.operationshub.domain.TicketCategory.NETWORK,
                                "The wired network port in the lab has stopped authenticating devices this morning.",
                                com.smartcampus.operationshub.domain.TicketPriority.HIGH,
                                "user@campus.edu")))
                .andExpect(status().isCreated())
                .andReturn();

        String ticketId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();
        String technicianId = userRepository.findByEmail("tech@campus.edu").orElseThrow().getId().toString();

        mockMvc.perform(put("/api/admin/tickets/{id}/assign", ticketId)
                        .with(csrf())
                        .session(adminSession)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new AssignTicketRequest(java.util.UUID.fromString(technicianId)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTechnicianId").value(technicianId));

        mockMvc.perform(put("/api/tickets/{id}/status", ticketId)
                        .with(csrf())
                        .session(technicianSession)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new UpdateTicketStatusRequest(
                                com.smartcampus.operationshub.domain.TicketStatus.IN_PROGRESS))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    void userEditingAnotherUsersCommentReturnsForbidden() throws Exception {
        MockHttpSession adminSession = login("admin@campus.edu", "Admin@12345");
        MockHttpSession userSession = login("user@campus.edu", "User@12345");

        MvcResult createResult = mockMvc.perform(buildTicketRequest(
                        userSession,
                        new CreateTicketRequest(
                                resource.getId(),
                                com.smartcampus.operationshub.domain.TicketCategory.OTHER,
                                "A recurring operational issue needs a maintenance record and follow-up note.",
                                com.smartcampus.operationshub.domain.TicketPriority.LOW,
                                "user@campus.edu")))
                .andExpect(status().isCreated())
                .andReturn();

        String ticketId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        MvcResult commentResult = mockMvc.perform(post("/api/tickets/{id}/comments", ticketId)
                        .with(csrf())
                        .session(adminSession)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(
                                new CreateTicketCommentRequest("Admin triage note for the maintenance queue."))))
                .andExpect(status().isCreated())
                .andReturn();

        String commentId = objectMapper.readTree(commentResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(put("/api/comments/{id}", commentId)
                        .with(csrf())
                        .session(userSession)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(
                                new UpdateTicketCommentRequest("Attempt to edit another author's comment."))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("COMMENT_FORBIDDEN"));
    }

    private org.springframework.test.web.servlet.RequestBuilder buildTicketRequest(
            MockHttpSession session, CreateTicketRequest request, MockMultipartFile... images) throws Exception {
        MockMultipartFile ticketPart = new MockMultipartFile(
                "ticket",
                "ticket.json",
                "application/json",
                objectMapper.writeValueAsBytes(request));

        org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder builder =
                multipart("/api/tickets").file(ticketPart);
        builder.with(csrf());
        builder.session(session);

        for (MockMultipartFile image : images) {
            builder.file(image);
        }

        return builder;
    }

    private MockMultipartFile createImage(String fileName) {
        return new MockMultipartFile(
                "images",
                fileName,
                "image/png",
                "fake-image-content".getBytes(StandardCharsets.UTF_8));
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
