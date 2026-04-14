package com.smartcampus.operationshub.service.storage;

public record StoredFileDescriptor(
        String originalFileName,
        String storedFileName,
        String storagePath,
        String contentType,
        long sizeBytes) {
}

