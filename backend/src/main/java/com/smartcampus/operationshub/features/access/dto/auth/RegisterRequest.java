package com.smartcampus.operationshub.features.access.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 40) String campusId,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 3, max = 120) String fullName,
        @NotBlank
        @Size(min = 8, max = 120)
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).+$",
                message = "Password must contain uppercase, lowercase, number, and special character")
                String password) {
}

