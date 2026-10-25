package com.lms.course.service.impl;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.StatObjectArgs;
import org.springframework.core.io.AbstractResource;

import java.io.IOException;
import java.io.InputStream;

/**
 * Resource Spring adossée à un objet MinIO. Permet de réutiliser telles quelles
 * les capacités standard de Spring MVC (streaming, Range/206 pour la lecture vidéo)
 * sans réimplémenter la logique de pagination par octets.
 */
public class MinioObjectResource extends AbstractResource {

    private final MinioClient minioClient;
    private final String bucket;
    private final String objectName;
    private Long cachedContentLength;

    public MinioObjectResource(MinioClient minioClient, String bucket, String objectName) {
        this.minioClient = minioClient;
        this.bucket = bucket;
        this.objectName = objectName;
    }

    @Override
    public String getDescription() {
        return "MinIO resource [" + bucket + "/" + objectName + "]";
    }

    @Override
    public String getFilename() {
        return objectName;
    }

    @Override
    public boolean exists() {
        try {
            cachedContentLength = minioClient.statObject(
                    StatObjectArgs.builder().bucket(bucket).object(objectName).build()
            ).size();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public long contentLength() throws IOException {
        if (cachedContentLength == null) {
            try {
                cachedContentLength = minioClient.statObject(
                        StatObjectArgs.builder().bucket(bucket).object(objectName).build()
                ).size();
            } catch (Exception e) {
                throw new IOException("Impossible de lire les métadonnées de " + objectName + " sur MinIO", e);
            }
        }
        return cachedContentLength;
    }

    @Override
    public InputStream getInputStream() throws IOException {
        try {
            return minioClient.getObject(GetObjectArgs.builder().bucket(bucket).object(objectName).build());
        } catch (Exception e) {
            throw new IOException("Impossible de lire " + objectName + " sur MinIO", e);
        }
    }
}
