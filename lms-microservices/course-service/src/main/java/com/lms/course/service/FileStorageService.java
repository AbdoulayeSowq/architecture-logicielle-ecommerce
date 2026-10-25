package com.lms.course.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeFile(MultipartFile file);

    /**
     * Résout un fichier stocké en Resource Spring (lazy — n'ouvre le flux qu'à la lecture).
     * Appeler {@link Resource#exists()} avant toute lecture pour gérer le cas "introuvable".
     */
    Resource loadFileAsResource(String fileName);
}
