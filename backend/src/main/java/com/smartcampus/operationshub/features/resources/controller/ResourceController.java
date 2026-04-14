package com.smartcampus.operationshub.features.resources.controller;

import com.smartcampus.operationshub.domain.ResourceStatus;
import com.smartcampus.operationshub.domain.ResourceType;
import com.smartcampus.operationshub.features.resources.dto.resource.ResourceResponse;
import com.smartcampus.operationshub.features.resources.dto.resource.UpdateResourceStatusRequest;
import com.smartcampus.operationshub.features.resources.dto.resource.UpsertResourceRequest;
import com.smartcampus.operationshub.features.resources.service.ResourceService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping("/api/resources")
    public ResponseEntity<List<ResourceResponse>> getResources(
            @RequestParam(required = false, name = "q") String query,
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) ResourceStatus status) {
        return ResponseEntity.ok(resourceService.searchResources(query, type, minCapacity, location, status));
    }

    @GetMapping("/api/resources/{id}")
    public ResponseEntity<ResourceResponse> getResource(@PathVariable UUID id) {
        return ResponseEntity.ok(resourceService.getResource(id));
    }

    @PostMapping("/api/admin/resources")
    public ResponseEntity<ResourceResponse> createResource(@Valid @RequestBody UpsertResourceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.createResource(request));
    }

    @PutMapping("/api/admin/resources/{id}")
    public ResponseEntity<ResourceResponse> updateResource(
            @PathVariable UUID id, @Valid @RequestBody UpsertResourceRequest request) {
        return ResponseEntity.ok(resourceService.updateResource(id, request));
    }

    @PatchMapping("/api/admin/resources/{id}/status")
    public ResponseEntity<ResourceResponse> updateResourceStatus(
            @PathVariable UUID id, @Valid @RequestBody UpdateResourceStatusRequest request) {
        return ResponseEntity.ok(resourceService.updateStatus(id, request));
    }

    @DeleteMapping("/api/admin/resources/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable UUID id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}

