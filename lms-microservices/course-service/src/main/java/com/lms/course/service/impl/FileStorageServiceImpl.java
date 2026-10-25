package com.lms.course.service.impl;

import com.lms.course.service.FileStorageService;
import io.minio.CopyObjectArgs;
import io.minio.CopySource;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    public FileStorageServiceImpl(MinioClient minioClient) {
        this.minioClient = minioClient;
    }

    @Override
    public String storeFile(MultipartFile file) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        if (originalFileName.contains("..")) {
            throw new RuntimeException("Sorry! Filename contains invalid path sequence " + originalFileName);
        }

        String extension = "";
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            extension = originalFileName.substring(i);
        }
        String objectName = UUID.randomUUID() + extension;

        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
        } catch (Exception ex) {
            throw new RuntimeException("Could not store file " + originalFileName + ". Please try again!", ex);
        }

        // Asynchronously mirror video resolutions for player bandwidth savings
        mirrorVideoResolutions(objectName, extension);

        return objectName;
    }

    @Override
    public Resource loadFileAsResource(String fileName) {
        return new MinioObjectResource(minioClient, bucket, fileName);
    }

    private void mirrorVideoResolutions(String objectName, String extension) {
        String lower = objectName.toLowerCase();
        boolean isVideo = lower.endsWith(".mp4") || lower.endsWith(".mkv") || lower.endsWith(".mov") || lower.endsWith(".avi") || lower.endsWith(".webm");

        if (!isVideo) {
            return;
        }

        String baseName = objectName.substring(0, objectName.length() - extension.length());

        new Thread(() -> {
            try {
                for (String suffix : new String[]{"_240", "_480", "_720"}) {
                    // NB: copie serveur-à-serveur à l'identique, pas de vraie transcodification
                    // (comportement hérité de l'ancienne implémentation disque — à revoir un jour)
                    minioClient.copyObject(CopyObjectArgs.builder()
                            .bucket(bucket)
                            .object(baseName + suffix + extension)
                            .source(CopySource.builder().bucket(bucket).object(objectName).build())
                            .build());
                }
                System.out.println("Video resolutions mirrored for: " + objectName);
            } catch (Exception e) {
                System.err.println("Failed to mirror video resolutions: " + e.getMessage());
            }
        }).start();
    }
}
