package com.smartcampus.operationshub;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import com.smartcampus.operationshub.dto.resource.UpdateResourceStatusRequest;
import com.smartcampus.operationshub.dto.resource.UpsertResourceRequest;
import com.smartcampus.operationshub.repository.BookingRepository;
import com.smartcampus.operationshub.repository.ResourceRepository;
import com.smartcampus.operationshub.repository.UserRepository;
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
class ResourceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        resourceRepository.deleteAll();
        userRepository.deleteAll();
        createUser("admin001", "admin@campus.edu", UserRole.ADMIN, "Admin@12345");
        createUser("user001", "user@campus.edu", UserRole.USER, "User@12345");
        createResource("Innovation Lab", ResourceType.LAB, 24, "Block A", ResourceStatus.ACTIVE);
        createResource("Senate Hall", ResourceType.LECTURE_HALL, 120, "Main Building", ResourceStatus.OUT_OF_SERVICE);
    }

    @Test
    void authenticatedUsersCanFilterResourceCatalogue() throws Exception {
        MockHttpSession userSession = login("user@campus.edu", "User@12345");

        mockMvc.perform(get("/api/resources")
                        .session(userSession)
                        .param("type", "LAB")
                        .param("minCapacity", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Innovation Lab"));
    }

    @Test
    void adminCanCreateAndUpdateResourceStatus() throws Exception {
        MockHttpSession adminSession = login("admin@campus.edu", "Admin@12345");

        MvcResult createResult = mockMvc.perform(post("/api/admin/resources")
                        .with(csrf())
                        .session(adminSession)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new UpsertResourceRequest(
                                "Design Studio",
                                ResourceType.MEETING_ROOM,
                                "Collaborative planning room",
                                18,
                                "Innovation Center",
                                LocalTime.of(9, 0),
                                LocalTime.of(17, 0),
                                ResourceStatus.ACTIVE))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Design Studio"))
                .andReturn();

        String resourceId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(patch("/api/admin/resources/{id}/status", resourceId)
                        .with(csrf())
                        .session(adminSession)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new UpdateResourceStatusRequest(ResourceStatus.OUT_OF_SERVICE))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OUT_OF_SERVICE"));
    }

    @Test
    void nonAdminsCannotCreateResources() throws Exception {
        MockHttpSession userSession = login("user@campus.edu", "User@12345");

        mockMvc.perform(post("/api/admin/resources")
                        .with(csrf())
                        .session(userSession)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new UpsertResourceRequest(
                                "Quiet Room",
                                ResourceType.MEETING_ROOM,
                                "Reserved for faculty meetings",
                                10,
                                "Block B",
                                LocalTime.of(8, 0),
                                LocalTime.of(12, 0),
                                ResourceStatus.ACTIVE))))
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

    private void createResource(String name, ResourceType type, int capacity, String location, ResourceStatus status) {
        Resource resource = new Resource();
        resource.setName(name);
        resource.setType(type);
        resource.setDescription(name + " description");
        resource.setCapacity(capacity);
        resource.setLocation(location);
        resource.setAvailableFrom(LocalTime.of(8, 0));
        resource.setAvailableTo(LocalTime.of(18, 0));
        resource.setStatus(status);
        resourceRepository.save(resource);
    }
}
