package com.smartcampus.operationshub.service;

import com.smartcampus.operationshub.domain.Resource;
import com.smartcampus.operationshub.domain.ResourceStatus;
import com.smartcampus.operationshub.domain.ResourceType;
import com.smartcampus.operationshub.dto.resource.ResourceResponse;
import com.smartcampus.operationshub.dto.resource.UpdateResourceStatusRequest;
import com.smartcampus.operationshub.dto.resource.UpsertResourceRequest;
import com.smartcampus.operationshub.exception.NotFoundException;
import com.smartcampus.operationshub.repository.ResourceRepository;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> searchResources(String query, ResourceType type, Integer minCapacity, String location, ResourceStatus status) {
        Specification<Resource> specification = (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query != null && !query.isBlank()) {
                String likeValue = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), likeValue),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), likeValue),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("location")), likeValue)));
            }

            if (type != null) {
                predicates.add(criteriaBuilder.equal(root.get("type"), type));
            }

            if (minCapacity != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
            }

            if (location != null && !location.isBlank()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("location")),
                        "%" + location.trim().toLowerCase(Locale.ROOT) + "%"));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        return resourceRepository.findAll(specification).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ResourceResponse getResource(UUID id) {
        return toResponse(getResourceEntity(id));
    }

    @Transactional
    public ResourceResponse createResource(UpsertResourceRequest request) {
        Resource resource = new Resource();
        applyRequest(resource, request);
        return toResponse(resourceRepository.save(resource));
    }

    @Transactional
    public ResourceResponse updateResource(UUID id, UpsertResourceRequest request) {
        Resource resource = getResourceEntity(id);
        applyRequest(resource, request);
        return toResponse(resourceRepository.save(resource));
    }

    @Transactional
    public ResourceResponse updateStatus(UUID id, UpdateResourceStatusRequest request) {
        Resource resource = getResourceEntity(id);
        resource.setStatus(request.status());
        return toResponse(resourceRepository.save(resource));
    }

    @Transactional
    public void deleteResource(UUID id) {
        Resource resource = getResourceEntity(id);
        resourceRepository.delete(resource);
    }

    private Resource getResourceEntity(UUID id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("RESOURCE_NOT_FOUND", "Resource not found"));
    }

    private void applyRequest(Resource resource, UpsertResourceRequest request) {
        resource.setName(request.name());
        resource.setType(request.type());
        resource.setDescription(request.description());
        resource.setCapacity(request.capacity());
        resource.setLocation(request.location());
        resource.setAvailableFrom(request.availableFrom());
        resource.setAvailableTo(request.availableTo());
        resource.setStatus(request.status());
    }

    private ResourceResponse toResponse(Resource resource) {
        return new ResourceResponse(
                resource.getId(),
                resource.getName(),
                resource.getType(),
                resource.getDescription(),
                resource.getCapacity(),
                resource.getLocation(),
                resource.getAvailableFrom(),
                resource.getAvailableTo(),
                resource.getStatus(),
                resource.getCreatedAt(),
                resource.getUpdatedAt());
    }
}
