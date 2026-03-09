package com.example.demo.Repository;

import com.example.demo.entity.FileAccessRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileAccessRequestRepository extends JpaRepository<FileAccessRequest, Long> {

    // All requests made BY this user (outgoing — requester's view)
    List<FileAccessRequest> findByRequesterEmail(String requesterEmail);

    // All requests FOR this user's files (incoming — owner's view)
    List<FileAccessRequest> findByOwnerEmail(String ownerEmail);

    // Check if a request already exists for this file by this user (prevent duplicates)
    Optional<FileAccessRequest> findByFileIdAndRequesterEmail(Long fileId, String requesterEmail);

    // Check if access is APPROVED before allowing shared download
    Optional<FileAccessRequest> findByFileIdAndRequesterEmailAndStatus(
            Long fileId, String requesterEmail, String status);
}