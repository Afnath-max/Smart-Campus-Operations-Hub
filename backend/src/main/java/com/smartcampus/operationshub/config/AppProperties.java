package com.smartcampus.operationshub.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    @NotBlank
    private String frontendBaseUrl;

    @NotBlank
    private String csrfCookieName;

    @NotBlank
    private String uploadsDirectory;

    @Min(1)
    private int invitationExpiryDays = 7;

    private final Seed seed = new Seed();

    private final Cors cors = new Cors();

    public String getFrontendBaseUrl() {
        return frontendBaseUrl;
    }

    public void setFrontendBaseUrl(String frontendBaseUrl) {
        this.frontendBaseUrl = frontendBaseUrl;
    }

    public String getCsrfCookieName() {
        return csrfCookieName;
    }

    public void setCsrfCookieName(String csrfCookieName) {
        this.csrfCookieName = csrfCookieName;
    }

    public String getUploadsDirectory() {
        return uploadsDirectory;
    }

    public void setUploadsDirectory(String uploadsDirectory) {
        this.uploadsDirectory = uploadsDirectory;
    }

    public int getInvitationExpiryDays() {
        return invitationExpiryDays;
    }

    public void setInvitationExpiryDays(int invitationExpiryDays) {
        this.invitationExpiryDays = invitationExpiryDays;
    }

    public Seed getSeed() {
        return seed;
    }

    public Cors getCors() {
        return cors;
    }

    public static class Seed {
        private boolean enabled;
        private String userPassword;
        private String adminPassword;
        private String technicianPassword;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getAdminPassword() {
            return adminPassword;
        }

        public void setAdminPassword(String adminPassword) {
            this.adminPassword = adminPassword;
        }

        public String getUserPassword() {
            return userPassword;
        }

        public void setUserPassword(String userPassword) {
            this.userPassword = userPassword;
        }

        public String getTechnicianPassword() {
            return technicianPassword;
        }

        public void setTechnicianPassword(String technicianPassword) {
            this.technicianPassword = technicianPassword;
        }
    }

    public static class Cors {
        private List<String> allowedOrigins = new ArrayList<>();

        public List<String> getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(List<String> allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }
}
