package com.smartcampus.operationshub.security;

import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.exception.UnauthorizedException;
import com.smartcampus.operationshub.features.access.repository.UserRepository;
import java.util.Locale;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class LocalAuthenticationProvider implements AuthenticationProvider {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public LocalAuthenticationProvider(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String email = authentication.getName() == null
                ? ""
                : authentication.getName().trim().toLowerCase(Locale.ROOT);
        String password = authentication.getCredentials() == null ? "" : authentication.getCredentials().toString();

        User user = userRepository.findByEmail(email).orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!user.isActive()) {
            throw new DisabledException("This account is disabled");
        }

        if (!user.supportsLocalLogin() || user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new UnauthorizedException("LOCAL_LOGIN_UNAVAILABLE", "Local login is not enabled for this account");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        UserPrincipal principal = UserPrincipal.fromUser(user);
        return UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.authorities());
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}

