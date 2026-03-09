package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "file_access_requests")
public class FileAccessRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long   fileId;         // FK reference to FileMetadata.id
    private String fileName;       // copied for display — no DB join needed
    private String requesterEmail; // who wants access (JWT user)
    private String ownerEmail;     // who owns the file (FileMetadata.email)
    private String status;         // PENDING / APPROVED / REJECTED

    public FileAccessRequest() {}

    public FileAccessRequest(Long fileId, String fileName,
                              String requesterEmail, String ownerEmail) {
        this.fileId         = fileId;
        this.fileName       = fileName;
        this.requesterEmail = requesterEmail;
        this.ownerEmail     = ownerEmail;
        this.status         = "PENDING"; // always starts as PENDING
    }

    // ── Getters & Setters ──

    public Long getId()                          { return id; }
    public void setId(Long id)                   { this.id = id; }

    public Long getFileId()                      { return fileId; }
    public void setFileId(Long fileId)           { this.fileId = fileId; }

    public String getFileName()                  { return fileName; }
    public void setFileName(String fileName)     { this.fileName = fileName; }

    public String getRequesterEmail()                        { return requesterEmail; }
    public void setRequesterEmail(String requesterEmail)     { this.requesterEmail = requesterEmail; }

    public String getOwnerEmail()                            { return ownerEmail; }
    public void setOwnerEmail(String ownerEmail)             { this.ownerEmail = ownerEmail; }

    public String getStatus()                    { return status; }
    public void setStatus(String status)         { this.status = status; }

    @Override
    public String toString() {
        return "FileAccessRequest [id=" + id + ", fileId=" + fileId
                + ", fileName=" + fileName + ", requesterEmail=" + requesterEmail
                + ", ownerEmail=" + ownerEmail + ", status=" + status + "]";
    }
}