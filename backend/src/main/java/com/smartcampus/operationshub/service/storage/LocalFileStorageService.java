package com.smartcampus.operationshub.service.storage;

import com.smartcampus.operationshub.config.AppProperties;
import com.smartcampus.operationshub.exception.BadRequestException;
import com.smartcampus.operationshub.exception.NotFoundException;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalFileStorageService implements FileStorageService {

    private final Path uploadsRoot;

    public LocalFileStorageService(AppProperties appProperties) {
        this.uploadsRoot = Paths.get(appProperties.getUploadsDirectory()).toAbsolutePath().normalize();
    }

    @PostConstruct
    void initializeDirectory() {
        try {
            Files.createDirectories(uploadsRoot.resolve("tickets"));
        } catch (IOException exception) {
            throw new IllegalStateException("Could not initialize uploads directory", exception);
        }
    }

    @Override
    public StoredFileDescriptor storeTicketImage(String ticketKey, MultipartFile file) {
        try {
            String originalFileName = sanitizeFileName(file.getOriginalFilename());
            Path ticketDirectory = uploadsRoot.resolve("tickets").resolve(ticketKey);
            Files.createDirectories(ticketDirectory);

            String storedFileName = UUID.randomUUID() + "-" + originalFileName;
            Path destination = ticketDirectory.resolve(storedFileName).normalize();
            ensureInsideUploadsRoot(destination);

            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            return new StoredFileDescriptor(
                    originalFileName,
                    storedFileName,
                    destination.toString(),
                    file.getContentType(),
                    file.getSize());
        } catch (IOException exception) {
            throw new IllegalStateException("Could not store uploaded file", exception);
        }
    }

    @Override
    public Resource loadAsResource(String storagePath) {
        Path path = Paths.get(storagePath).toAbsolutePath().normalize();
        ensureInsideUploadsRoot(path);
        Resource resource = new FileSystemResource(path);
        if (!resource.exists() || !resource.isReadable()) {
            throw new NotFoundException("IMAGE_NOT_FOUND", "Ticket image not found");
        }
        return resource;
    }

    @Override
    public void delete(String storagePath) {
        try {
            Path path = Paths.get(storagePath).toAbsolutePath().normalize();
            ensureInsideUploadsRoot(path);
            Files.deleteIfExists(path);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not delete stored file", exception);
        }
    }

    private String sanitizeFileName(String originalFileName) {
        String candidate = originalFileName == null || originalFileName.isBlank() ? "attachment" : originalFileName;
        String sanitized = candidate.replaceAll("[^A-Za-z0-9._-]", "-");
        if (sanitized.isBlank()) {
            throw new BadRequestException("INVALID_FILE_NAME", "Uploaded file name is invalid");
        }
        return sanitized;
    }

    private void ensureInsideUploadsRoot(Path path) {
        if (!path.startsWith(uploadsRoot)) {
            throw new BadRequestException("INVALID_STORAGE_PATH", "The requested file path is not valid");
        }
    }
}

