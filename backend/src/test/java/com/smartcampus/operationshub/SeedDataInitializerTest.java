package com.smartcampus.operationshub;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartcampus.operationshub.config.AppProperties;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.repository.UserRepository;
import com.smartcampus.operationshub.service.SeedDataInitializer;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class SeedDataInitializerTest {

    @Mock
    private AppProperties appProperties;

    @Mock
    private AppProperties.Seed seed;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private SeedDataInitializer seedDataInitializer;

    @Captor
    private ArgumentCaptor<User> userCaptor;

    @Test
    void createsSeededUserAdminAndTechnicianAccountsWhenEnabled() throws Exception {
        when(appProperties.getSeed()).thenReturn(seed);
        when(seed.isEnabled()).thenReturn(true);
        when(seed.getUserPassword()).thenReturn("User@12345");
        when(seed.getAdminPassword()).thenReturn("Admin@12345");
        when(seed.getTechnicianPassword()).thenReturn("Tech@12345");
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByCampusId(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenAnswer(invocation -> "encoded-" + invocation.getArgument(0, String.class));

        seedDataInitializer.run(new DefaultApplicationArguments());

        verify(userRepository, times(3)).save(userCaptor.capture());

        List<User> savedUsers = userCaptor.getAllValues();
        assertThat(savedUsers)
                .extracting(User::getCampusId, User::getEmail, User::getRole)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("user001", "user@smartcampus.local", UserRole.USER),
                        org.assertj.core.groups.Tuple.tuple("admin001", "admin@smartcampus.local", UserRole.ADMIN),
                        org.assertj.core.groups.Tuple.tuple("tech001", "technician@smartcampus.local", UserRole.TECHNICIAN));
    }

    @Test
    void doesNothingWhenSeedModeIsDisabled() throws Exception {
        when(appProperties.getSeed()).thenReturn(seed);
        when(seed.isEnabled()).thenReturn(false);

        seedDataInitializer.run(new DefaultApplicationArguments());

        verify(userRepository, never()).save(any());
    }
}
