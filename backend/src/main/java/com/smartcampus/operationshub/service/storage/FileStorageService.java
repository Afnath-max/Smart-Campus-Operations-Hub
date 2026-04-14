package com.smartcampus.operationshub.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    StoredFileDescriptor storeTicketImage(String ticketKey, MultipartFile file);

    Resource loadAsResource(String storagePath);

    void delete(String storagePath);
}

