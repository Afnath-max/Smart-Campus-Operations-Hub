package com.smartcampus.operationshub.features.access.controller;

import com.smartcampus.operationshub.domain.UserRole;
import com.smartcampus.operationshub.features.access.dto.admin.CreateInvitationRequest;
import com.smartcampus.operationshub.features.access.dto.admin.UpdateAuthProviderRequest;
import com.smartcampus.operationshub.features.access.dto.admin.UpdateRoleRequest;
import com.smartcampus.operationshub.features.access.dto.admin.UpdateStatusRequest;
import com.smartcampus.operationshub.features.access.dto.user.InvitationResponse;
import com.smartcampus.operationshub.features.access.dto.user.UserDetailResponse;
import com.smartcampus.operationshub.security.UserPrincipal;
import com.smartcampus.operationshub.features.access.service.AdminUserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDetailResponse>> listUsers() {
        return ResponseEntity.ok(adminUserService.listUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDetailResponse> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(adminUserService.getUser(id));
    }

    @PostMapping("/users/invite-technician")
    public ResponseEntity<InvitationResponse> inviteTechnician(
            @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CreateInvitationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminUserService.createInvitation(principal, request, UserRole.TECHNICIAN));
    }

    @PostMapping("/users/invite-admin")
    public ResponseEntity<InvitationResponse> inviteAdmin(
            @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CreateInvitationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminUserService.createInvitation(principal, request, UserRole.ADMIN));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserDetailResponse> updateRole(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(adminUserService.updateRole(id, request.role(), principal));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<UserDetailResponse> updateStatus(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(adminUserService.updateStatus(id, request.status(), principal));
    }

    @PutMapping("/users/{id}/auth-provider")
    public ResponseEntity<UserDetailResponse> updateAuthProvider(
            @PathVariable UUID id, @Valid @RequestBody UpdateAuthProviderRequest request) {
        return ResponseEntity.ok(adminUserService.updateAuthProvider(id, request));
    }

    @DeleteMapping("/invitations/{id}")
    public ResponseEntity<Void> deleteInvitation(@PathVariable UUID id) {
        adminUserService.deleteInvitation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invitations")
    public ResponseEntity<List<InvitationResponse>> listInvitations() {
        return ResponseEntity.ok(adminUserService.listInvitations());
    }
}

