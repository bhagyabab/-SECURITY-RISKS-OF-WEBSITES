package com.example.demo.Controller;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import com.example.demo.Repository.FileMetaDataRepository;
import com.example.demo.entity.FileMetadata;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.security.Key;
import java.util.List;

@Service
public class S3Service {

    private static final Logger logger = LoggerFactory.getLogger(S3Service.class);

    @Autowired
    private AmazonS3 s3Client;

    @Autowired
    private FileMetaDataRepository fileMetadataRepository;

    private String bucketName = "databuckets12";

    private String buildS3Key(String email, String filename) {
        return email + "/" + filename;
    }

    // Check if the file with the same name already exists for the given email
    private boolean isFileAlreadyExists(String filename, String email) {
        List<FileMetadata> existingFiles = fileMetadataRepository.findByEmail(email);
        for (FileMetadata fileMetadata : existingFiles) {
            if (fileMetadata.getFileName().equals(filename)) {
                return true;
            }
        }
        return false;
    }

    // ─────────────────────────────────────
    // UPLOAD FILE
    // ─────────────────────────────────────
    public ResponseEntity<String> uploadFile(MultipartFile file, String email, String secretKey) {
        try {
            String filename = file.getOriginalFilename();

            if (isFileAlreadyExists(filename, email)) {
                return new ResponseEntity<>(
                        "Duplicate file: A file with the same name already exists.",
                        HttpStatus.BAD_REQUEST);
            }

            byte[] fileBytes      = file.getBytes();
            Key    aesKeySpec     = EncryptionUtils.createKey(secretKey, "AES");
            byte[] encryptedBytes = EncryptionUtils.encryptData(fileBytes, aesKeySpec);

            // FIX V4: Use user-scoped key so two users never share the same S3 path
            String s3Key = buildS3Key(email, filename);

            // Pass content length so S3 SDK doesn't need to buffer the whole stream
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(encryptedBytes.length);

            try (InputStream encryptedStream = new ByteArrayInputStream(encryptedBytes)) {
                s3Client.putObject(bucketName, s3Key, encryptedStream, metadata);
            }

            String encryptedKeyStore = EncryptionUtils.encodeKey(aesKeySpec);
            FileMetadata fileMetadata = new FileMetadata(
                    filename, email, secretKey, encryptedKeyStore, null);
            fileMetadataRepository.save(fileMetadata);

            return new ResponseEntity<>("File uploaded successfully.", HttpStatus.OK);

        } catch (Exception e) {
            logger.error("Error during file upload: ", e);
            return new ResponseEntity<>(
                    "Error during file upload: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ─────────────────────────────────────
    // DOWNLOAD FILE
    // Ownership check is done in UserController BEFORE this is called.
    // ─────────────────────────────────────
    public ByteArrayInputStream downloadFile(String filename) {
        try {
            FileMetadata fileMetadata = fileMetadataRepository.findByFileName(filename);
            if (fileMetadata == null) {
                logger.error("File metadata not found for: {}", filename);
                return null;
            }

            // FIX V4: Reconstruct the user-scoped S3 key using the stored owner email
            String s3Key = buildS3Key(fileMetadata.getEmail(), filename);

            S3ObjectInputStream s3InputStream =
                    s3Client.getObject(bucketName, s3Key).getObjectContent();
            byte[] encryptedBytes = s3InputStream.readAllBytes();
            s3InputStream.close();

            Key    aesKeySpec     = EncryptionUtils.createKey(fileMetadata.getSecretKey(), "AES");
            byte[] decryptedBytes = EncryptionUtils.decryptData(encryptedBytes, aesKeySpec);

            return new ByteArrayInputStream(decryptedBytes);

        } catch (Exception e) {
            logger.error("Error during decryption/download: ", e);
            return null;
        }
    }
}