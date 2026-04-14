package com.smartcampus.operationshub.security;

import com.smartcampus.operationshub.config.AppProperties;
import com.smartcampus.operationshub.domain.User;
import com.smartcampus.operationshub.exception.ApiException;
import com.smartcampus.operationshub.features.access.service.OAuthAccountService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final OAuthAccountService oauthAccountService;
    private final SecurityContextRepository securityContextRepository;
    private final AppProperties appProperties;

    public OAuth2LoginSuccessHandler(
            OAuthAccountService oauthAccountService,
            SecurityContextRepository securityContextRepository,
            AppProperties appProperties) {
        this.oauthAccountService = oauthAccountService;
        this.securityContextRepository = securityContextRepository;
        this.appProperties = appProperties;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        try {
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
            Map<String, Object> attributes = oauth2User.getAttributes();
            User user = oauthAccountService.handleGoogleLogin(
                    stringValue(attributes.get("email")),
                    stringValue(attributes.get("sub")),
                    stringValue(attributes.get("name")),
                    stringValue(attributes.get("picture")),
                    request.getSession(false));

            UserPrincipal principal = UserPrincipal.fromUser(user);
            Authentication sessionAuthentication =
                    UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.authorities());

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(sessionAuthentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);

            response.sendRedirect(appProperties.getFrontendBaseUrl() + "/oauth/callback?status=success");
        } catch (ApiException exception) {
            String encodedMessage = URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);
            response.sendRedirect(
                    appProperties.getFrontendBaseUrl()
                            + "/oauth/callback?status=error&code="
                            + exception.getCode()
                            + "&message="
                            + encodedMessage);
        }
    }

    private String stringValue(Object value) {
        return value == null ? null : value.toString();
    }
}

