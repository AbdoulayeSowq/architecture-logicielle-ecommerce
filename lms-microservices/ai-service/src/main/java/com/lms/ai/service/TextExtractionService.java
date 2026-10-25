package com.lms.ai.service;

import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;

@Service
@RequiredArgsConstructor
public class TextExtractionService {

    private final TranscriptionService transcriptionService;

    @Value("${app.upload.dir:/Users/macbookpro/Documents/wk/dic2/dev-web3/lms-microservices/course-service/uploads}")
    private String uploadDir;

    public String extractTextFromMultipartFile(MultipartFile file) throws IOException {
        try (InputStream is = file.getInputStream();
             PDDocument document = Loader.loadPDF(is.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    public String extractTextFromUrl(String fileUrl) throws IOException {
        InputStream is = null;
        try {
            // Extract filename from URL (e.g. "http://localhost:8080/api/course/files/download/abc.pdf" -> "abc.pdf")
            String fileName = fileUrl;
            if (fileName.contains("/")) {
                fileName = fileName.substring(fileName.lastIndexOf("/") + 1);
            }
            File localFile = new File(uploadDir, fileName);
            if (localFile.exists()) {
                is = new FileInputStream(localFile);
            } else {
                is = new URL(fileUrl).openStream();
            }

            byte[] bytes = is.readAllBytes();
            String lowUrl = fileUrl.toLowerCase();

            // Support Multimédia (Phase 4)
            if (lowUrl.endsWith(".mp4") || lowUrl.endsWith(".mp3") || lowUrl.endsWith(".wav") || lowUrl.endsWith(".m4a")) {
                return transcriptionService.transcribe(localFile.exists() ? localFile : new File(fileName));
            }

            // Simple check: if it's a PDF, use PDFBox, otherwise treat as plain text
            if (lowUrl.endsWith(".pdf")) {
                try (PDDocument document = Loader.loadPDF(bytes)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    return stripper.getText(document);
                }
            } else {
                return new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
            }
        } finally {
            if (is != null) {
                is.close();
            }
        }
    }
}
