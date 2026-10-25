package com.lms.course.controller;

import com.lms.course.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/course/files")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        String fileName = fileStorageService.storeFile(file);
        String fileDownloadUri = "/api/course/files/download/" + fileName;
        return ResponseEntity.ok(Map.of("url", fileDownloadUri, "fileName", fileName));
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<ResourceRegion> downloadFile(@PathVariable String fileName,
                                                         @RequestHeader HttpHeaders requestHeaders) {
        Resource resource = fileStorageService.loadFileAsResource(fileName);
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        MediaType mediaType = resolveMediaType(fileName);

        try {
            long contentLength = resource.contentLength();
            List<HttpRange> ranges = requestHeaders.getRange();

            ResourceRegion region;
            HttpStatus status;
            if (ranges.isEmpty()) {
                region = new ResourceRegion(resource, 0, contentLength);
                status = HttpStatus.OK;
            } else {
                // Lecture vidéo : le lecteur HTML5 a besoin du support Range/206 pour pouvoir seeker.
                HttpRange range = ranges.get(0);
                long start = range.getRangeStart(contentLength);
                long end = range.getRangeEnd(contentLength);
                region = new ResourceRegion(resource, start, end - start + 1);
                status = HttpStatus.PARTIAL_CONTENT;
            }

            return ResponseEntity.status(status)
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(region);
        } catch (IOException ex) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private MediaType resolveMediaType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".pdf")) return MediaType.APPLICATION_PDF;
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return MediaType.IMAGE_JPEG;
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    @GetMapping("/video-qualities/{fileName:.+}")
    public ResponseEntity<?> getVideoQualities(@PathVariable String fileName) {
        String lower = fileName.toLowerCase();
        boolean isVideo = lower.endsWith(".mp4") || lower.endsWith(".mkv") || lower.endsWith(".mov") || lower.endsWith(".avi") || lower.endsWith(".webm") || lower.endsWith(".m3u8");

        if (!isVideo) {
            return ResponseEntity.badRequest().body("Le fichier spécifié n'est pas un format vidéo supporté.");
        }

        String baseDownloadUrl = "/api/course/files/download/";
        java.util.Map<String, String> qualities = new java.util.HashMap<>();

        int extIdx = fileName.lastIndexOf('.');
        String baseName = extIdx > 0 ? fileName.substring(0, extIdx) : fileName;
        String extension = extIdx > 0 ? fileName.substring(extIdx) : "";

        qualities.put("Auto (Original)", baseDownloadUrl + fileName);
        qualities.put("Éco (240p)", baseDownloadUrl + baseName + "_240" + (extension.equals(".m3u8") ? ".mp4" : extension));
        qualities.put("Standard (480p)", baseDownloadUrl + baseName + "_480" + (extension.equals(".m3u8") ? ".mp4" : extension));
        qualities.put("HD (720p)", baseDownloadUrl + baseName + "_720" + (extension.equals(".m3u8") ? ".mp4" : extension));

        return ResponseEntity.ok(new com.lms.course.dto.VideoQualityDto(fileName, baseDownloadUrl + fileName, qualities));
    }
}
