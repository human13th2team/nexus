package com.team.nexus.global.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
public class FileService {

    private final String uploadPath = "uploads/";

    public FileService() {
        // 업로드 폴더 생성
        File directory = new File(uploadPath);
        if (!directory.exists()) {
            directory.mkdirs();
        }
    }

    public String uploadFile(MultipartFile file, String category) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String savedFilename = UUID.randomUUID().toString() + extension;
            
            // 카테고리(폴더) 처리
            String subPath = (category != null && !category.isEmpty()) ? category + "/" : "";
            File directory = new File(uploadPath + subPath);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            Path path = Paths.get(uploadPath + subPath + savedFilename);
            
            Files.write(path, file.getBytes());
            log.info("File uploaded successfully to {}: {}", subPath, savedFilename);
            
            // 브라우저에서 접근 가능한 URL 경로 반환
            return "/api/v1/files/display/" + subPath + savedFilename;
        } catch (IOException e) {
            log.error("Failed to upload file", e);
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.");
        }
    }
}
