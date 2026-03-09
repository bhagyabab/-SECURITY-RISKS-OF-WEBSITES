package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class FileMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String email;

    private String status;

    @JsonIgnore
    private String secretKey;

    @JsonIgnore
    private String encryptedKeyStore;

    public FileMetadata() {}

    public FileMetadata(String fileName, String email, String secretKey,
            String encryptedKeyStore, String fileSignature) {
        this.fileName          = fileName;
        this.email             = email;
        this.secretKey         = secretKey;
        this.encryptedKeyStore = encryptedKeyStore;
        this.status            = "PENDING"; // every upload starts as PENDING
    }

    public Long getId()                              { return id; }
    public void setId(Long id)                       { this.id = id; }

    public String getFileName()                      { return fileName; }
    public void setFileName(String fileName)         { this.fileName = fileName; }

    public String getEmail()                         { return email; }
    public void setEmail(String email)               { this.email = email; }

    public String getStatus()                        { return status; }
    public void setStatus(String status)             { this.status = status; }

    public String getSecretKey()                     { return secretKey; }
    public void setSecretKey(String secretKey)       { this.secretKey = secretKey; }

    public String getEncryptedKeyStore()                             { return encryptedKeyStore; }
    public void setEncryptedKeyStore(String encryptedKeyStore)       { this.encryptedKeyStore = encryptedKeyStore; }

    @Override
    public String toString() {
        return "FileMetadata [id=" + id + ", fileName=" + fileName
                + ", email=" + email + ", status=" + status + "]";
    }
}