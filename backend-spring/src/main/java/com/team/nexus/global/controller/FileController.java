package com.team.nexus.global.controller;

import com.team.nexus.global.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true")
public class FileController {

    private final FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false) String category) {
        String fileUrl = fileService.uploadFile(file, category);
        return ResponseEntity.ok(Map.of("url", "http://localhost:8080" + fileUrl));
    }

    @GetMapping("/display/{*fileName}")
    public ResponseEntity<Resource> displayFile(@PathVariable String fileName) {
        try {
            // {*fileName} captures leading slash, remove it
            String cleanPath = fileName.startsWith("/") ? fileName.substring(1) : fileName;
            Path path = Paths.get("uploads/" + cleanPath);
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = "application/octet-stream";
                String name = path.getFileName().toString().toLowerCase();
                
                if (name.endsWith(".png")) contentType = "image/png";
                else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) contentType = "image/jpeg";
                else if (name.endsWith(".gif")) contentType = "image/gif";
                else if (name.endsWith(".webp")) contentType = "image/webp";

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType)
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/download/{*fileName}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            String cleanPath = fileName.startsWith("/") ? fileName.substring(1) : fileName;
            Path path = Paths.get("uploads/" + cleanPath);
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() || resource.isReadable()) {
                String originalName = path.getFileName().toString();
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalName + "\"")
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
