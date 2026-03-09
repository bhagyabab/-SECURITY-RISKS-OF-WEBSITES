package com.example.demo.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.Repository.FileAccessRequestRepository;
import com.example.demo.Repository.FileMetaDataRepository;
import com.example.demo.Repository.UserRepository;
import com.example.demo.entity.FileAccessRequest;
import com.example.demo.entity.FileMetadata;
import com.example.demo.entity.User;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired private S3Service                      s3Service;
    @Autowired private FileMetadataService            fileMetadataService;
    @Autowired private FileMetaDataRepository         fileMetaDataRepo;
    @Autowired private UserRepository                 userRepo;
    @Autowired private BCryptPasswordEncoder          passwordEncoder;
    @Autowired private FileAccessRequestRepository    accessRequestRepo;

    // ─────────────────────────────────────────────────────────
    // UPLOAD FILE
    // POST /api/user/upload
    // ─────────────────────────────────────────────────────────
    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("secretKey") String secretKey,
            Authentication authentication) {

        String email = authentication.getName();

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank())
            return ResponseEntity.badRequest().body("Invalid file name!");

        String extension = originalFilename
                .substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();

        List<String> allowedTypes = List.of("jpg", "jpeg", "png", "pdf", "docx", "txt");
        if (!allowedTypes.contains(extension))
            return ResponseEntity.badRequest().body(
                    "File type '" + extension + "' not allowed! "
                    + "Only jpg, png, pdf, docx, txt are permitted.");

        if (file.getSize() > 10 * 1024 * 1024)
            return ResponseEntity.badRequest()
                    .body("File size exceeds 10MB limit! "
                    + "Your file: " + (file.getSize() / (1024 * 1024)) + "MB");

        List<FileMetadata> existing = fileMetaDataRepo.findByEmail(email);
        for (FileMetadata f : existing) {
            if (f.getFileName().equals(originalFilename))
                return ResponseEntity.badRequest()
                        .body("File already exists! Please rename your file.");
        }

        return s3Service.uploadFile(file, email, secretKey);
    }

    @GetMapping("/files")
    public ResponseEntity<?> getMyFiles(Authentication authentication) {
        String email = authentication.getName();
        List<FileMetadata> files = fileMetadataService.getFilesByEmail(email);
        if (files.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No files uploaded yet."));
        return ResponseEntity.ok(files);
    }

    // ─────────────────────────────────────────────────────────
    // GET ALL FILES (every user's files — browse + request view)
    // GET /api/user/all-files
    // Returns safe map — no secret keys
    // Each file includes: isOwner, canDownload, requestStatus
    // ─────────────────────────────────────────────────────────
    @GetMapping("/all-files")
    public ResponseEntity<?> getAllFiles(Authentication authentication) {
        String loggedInEmail = authentication.getName();

        List<FileMetadata> files = fileMetaDataRepo.findAll();
        if (files.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No files uploaded yet."));

        List<Map<String, Object>> result = new ArrayList<>();
        for (FileMetadata f : files) {
            boolean isOwner = f.getEmail().equals(loggedInEmail);

            // Check if requester already has APPROVED access
            boolean hasApprovedAccess = accessRequestRepo
                    .findByFileIdAndRequesterEmailAndStatus(f.getId(), loggedInEmail, "APPROVED")
                    .isPresent();

            // Check if any request already exists (PENDING / APPROVED / REJECTED)
            Optional<FileAccessRequest> existingRequest = accessRequestRepo
                    .findByFileIdAndRequesterEmail(f.getId(), loggedInEmail);

            Map<String, Object> m = new HashMap<>();
            m.put("id",            f.getId());
            m.put("fileName",      f.getFileName());
            m.put("ownerEmail",    f.getEmail());
            m.put("status",        f.getStatus());         // file approval status
            m.put("isOwner",       isOwner);
            m.put("canDownload",   isOwner || hasApprovedAccess);
            m.put("requestStatus", existingRequest.map(FileAccessRequest::getStatus).orElse(null));
            // requestStatus: null = not requested yet, PENDING, APPROVED, REJECTED
            result.add(m);
        }

        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────
    // REQUEST ACCESS TO A FILE
    // POST /api/user/request-access/{fileId}
    // ─────────────────────────────────────────────────────────
    @PostMapping("/request-access/{fileId}")
    public ResponseEntity<Map<String, String>> requestAccess(
            @PathVariable Long fileId,
            Authentication authentication) {

        String requesterEmail = authentication.getName();

        Optional<FileMetadata> optFile = fileMetaDataRepo.findById(fileId);
        if (optFile.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "File not found!"));

        FileMetadata file = optFile.get();

        // Owner cannot request their own file
        if (file.getEmail().equals(requesterEmail))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "You already own this file!"));

        // Check for existing request
        Optional<FileAccessRequest> existing = accessRequestRepo
                .findByFileIdAndRequesterEmail(fileId, requesterEmail);

        if (existing.isPresent()) {
            String currentStatus = existing.get().getStatus();
            if ("PENDING".equals(currentStatus))
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Access request already sent! Waiting for owner approval."));
            if ("APPROVED".equals(currentStatus))
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "You already have access to this file!"));
            // REJECTED — allow re-request
            existing.get().setStatus("PENDING");
            accessRequestRepo.save(existing.get());
            return ResponseEntity.ok(Map.of("message",
                    "Access re-requested for '" + file.getFileName() + "'. Waiting for owner approval."));
        }

        // Create new request
        FileAccessRequest request = new FileAccessRequest(
                fileId, file.getFileName(), requesterEmail, file.getEmail());
        accessRequestRepo.save(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message",
                        "Access requested for '" + file.getFileName() + "'. Waiting for owner approval."));
    }

    // ─────────────────────────────────────────────────────────
    // GET INCOMING REQUESTS (owner sees who wants their files)
    // GET /api/user/access-requests/incoming
    // ─────────────────────────────────────────────────────────
    @GetMapping("/access-requests/incoming")
    public ResponseEntity<?> getIncomingRequests(Authentication authentication) {
        String ownerEmail = authentication.getName();
        List<FileAccessRequest> requests = accessRequestRepo.findByOwnerEmail(ownerEmail);

        if (requests.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No incoming access requests."));

        List<Map<String, Object>> result = new ArrayList<>();
        for (FileAccessRequest r : requests) {
            Map<String, Object> m = new HashMap<>();
            m.put("requestId",      r.getId());
            m.put("fileId",         r.getFileId());
            m.put("fileName",       r.getFileName());
            m.put("requesterEmail", r.getRequesterEmail());
            m.put("ownerEmail",     r.getOwnerEmail());
            m.put("status",         r.getStatus());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────
    // GET OUTGOING REQUESTS (requester sees their own requests)
    // GET /api/user/access-requests/outgoing
    // ─────────────────────────────────────────────────────────
    @GetMapping("/access-requests/outgoing")
    public ResponseEntity<?> getOutgoingRequests(Authentication authentication) {
        String requesterEmail = authentication.getName();
        List<FileAccessRequest> requests = accessRequestRepo.findByRequesterEmail(requesterEmail);

        if (requests.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No outgoing access requests."));

        List<Map<String, Object>> result = new ArrayList<>();
        for (FileAccessRequest r : requests) {
            Map<String, Object> m = new HashMap<>();
            m.put("requestId",      r.getId());
            m.put("fileId",         r.getFileId());
            m.put("fileName",       r.getFileName());
            m.put("requesterEmail", r.getRequesterEmail());
            m.put("ownerEmail",     r.getOwnerEmail());
            m.put("status",         r.getStatus());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────
    // APPROVE ACCESS REQUEST (owner action)
    // PUT /api/user/access-requests/{requestId}/approve
    // ─────────────────────────────────────────────────────────
    @PutMapping("/access-requests/{requestId}/approve")
    public ResponseEntity<Map<String, String>> approveAccessRequest(
            @PathVariable Long requestId,
            Authentication authentication) {

        String loggedInEmail = authentication.getName();

        Optional<FileAccessRequest> opt = accessRequestRepo.findById(requestId);
        if (opt.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Access request not found!"));

        FileAccessRequest req = opt.get();

        // Only the file owner can approve
        if (!req.getOwnerEmail().equals(loggedInEmail))
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only the file owner can approve this request!"));

        if ("APPROVED".equals(req.getStatus()))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Request is already approved!"));

        req.setStatus("APPROVED");
        accessRequestRepo.save(req);

        return ResponseEntity.ok(Map.of(
                "message", "Access granted to " + req.getRequesterEmail()
                           + " for file '" + req.getFileName() + "'.",
                "status",  "APPROVED"
        ));
    }

    // ─────────────────────────────────────────────────────────
    // REJECT ACCESS REQUEST (owner action)
    // PUT /api/user/access-requests/{requestId}/reject
    // ─────────────────────────────────────────────────────────
    @PutMapping("/access-requests/{requestId}/reject")
    public ResponseEntity<Map<String, String>> rejectAccessRequest(
            @PathVariable Long requestId,
            Authentication authentication) {

        String loggedInEmail = authentication.getName();

        Optional<FileAccessRequest> opt = accessRequestRepo.findById(requestId);
        if (opt.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Access request not found!"));

        FileAccessRequest req = opt.get();

        // Only the file owner can reject
        if (!req.getOwnerEmail().equals(loggedInEmail))
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only the file owner can reject this request!"));

        if ("REJECTED".equals(req.getStatus()))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Request is already rejected!"));

        req.setStatus("REJECTED");
        accessRequestRepo.save(req);

        return ResponseEntity.ok(Map.of(
                "message", "Access request from " + req.getRequesterEmail()
                           + " for '" + req.getFileName() + "' has been rejected.",
                "status",  "REJECTED"
        ));
    }

    // ─────────────────────────────────────────────────────────
    // DOWNLOAD OWN FILE
    // GET /api/user/download/{filename}
    // Only the file owner can use this endpoint
    // ─────────────────────────────────────────────────────────
    @GetMapping("/download/{filename}")
    public ResponseEntity<?> downloadFile(
            @PathVariable String filename,
            Authentication authentication) {

        if (filename == null || filename.isBlank())
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Filename is required!"));

        String loggedInEmail = authentication.getName();

        FileMetadata meta = fileMetaDataRepo.findByFileName(filename);
        if (meta == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "File not found!"));

        if (!meta.getEmail().equals(loggedInEmail))
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied! You do not own this file."));

        ByteArrayInputStream fileStream = s3Service.downloadFile(filename);
        if (fileStream == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "File not found or decryption failed!"));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new InputStreamResource(fileStream));
    }

    // ─────────────────────────────────────────────────────────
    // DOWNLOAD SHARED FILE (approved non-owner)
    // GET /api/user/download/shared/{fileId}
    // Works only if APPROVED FileAccessRequest exists for this user + fileId
    // ─────────────────────────────────────────────────────────
    @GetMapping("/download/shared/{fileId}")
    public ResponseEntity<?> downloadSharedFile(
            @PathVariable Long fileId,
            Authentication authentication) {

        String requesterEmail = authentication.getName();

        // Must have an APPROVED access request
        Optional<FileAccessRequest> approvedRequest = accessRequestRepo
                .findByFileIdAndRequesterEmailAndStatus(fileId, requesterEmail, "APPROVED");

        if (approvedRequest.isEmpty())
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied! You do not have approved access to this file."));

        Optional<FileMetadata> optFile = fileMetaDataRepo.findById(fileId);
        if (optFile.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "File not found!"));

        FileMetadata meta = optFile.get();

        // Use owner's stored secret key to decrypt and download
        ByteArrayInputStream fileStream = s3Service.downloadFile(meta.getFileName());
        if (fileStream == null)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "File download or decryption failed!"));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + meta.getFileName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new InputStreamResource(fileStream));
    }

    // ─────────────────────────────────────────────────────────
    // DELETE MY FILE
    // DELETE /api/user/file/{id}
    // ─────────────────────────────────────────────────────────
    @DeleteMapping("/file/{id}")
    public ResponseEntity<Map<String, String>> deleteFile(
            @PathVariable Long id,
            Authentication authentication) {

        String loggedInEmail = authentication.getName();

        Optional<FileMetadata> optFile = fileMetaDataRepo.findById(id);
        if (optFile.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "File not found!"));

        if (!optFile.get().getEmail().equals(loggedInEmail))
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied! You do not own this file."));

        fileMetadataService.deleteFile(id);
        return ResponseEntity.ok(Map.of("message", "File deleted successfully!"));
    }

    // ─────────────────────────────────────────────────────────
    // GET FILE COUNT
    // GET /api/user/filecount
    // ─────────────────────────────────────────────────────────
    @GetMapping("/filecount")
    public ResponseEntity<Map<String, Object>> getFileCount(Authentication authentication) {
        String email = authentication.getName();
        List<FileMetadata> files = fileMetadataService.getFilesByEmail(email);
        return ResponseEntity.ok(Map.of("email", email, "fileCount", files.size()));
    }

    // ─────────────────────────────────────────────────────────
    // VIEW PROFILE
    // GET /api/user/profile
    // ─────────────────────────────────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        String email = authentication.getName();

        Optional<User> optUser = userRepo.findByEmail(email);
        if (optUser.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found!"));

        User u = optUser.get();
        int fileCount = fileMetaDataRepo.findByEmail(email).size();

        Map<String, Object> profile = new HashMap<>();
        profile.put("id",        u.getId());
        profile.put("name",      u.getName());
        profile.put("email",     u.getEmail());
        profile.put("role",      u.getRole());
        profile.put("fileCount", fileCount);
        profile.put("message",   "Profile loaded successfully!");

        return ResponseEntity.ok(profile);
    }

    // ─────────────────────────────────────────────────────────
    // UPDATE PROFILE NAME
    // PUT /api/user/profile/update
    // ─────────────────────────────────────────────────────────
    @PutMapping("/profile/update")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String email = authentication.getName();
        String name  = body.get("name");

        if (name == null || name.isBlank())
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Name cannot be empty!"));

        Optional<User> optUser = userRepo.findByEmail(email);
        if (optUser.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found!"));

        User u = optUser.get();
        u.setName(name.trim());
        userRepo.save(u);

        return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully!",
                "name",    u.getName(),
                "email",   u.getEmail()));
    }

    // ─────────────────────────────────────────────────────────
    // CHANGE PASSWORD
    // PUT /api/user/profile/password
    // ─────────────────────────────────────────────────────────
    @PutMapping("/profile/password")
    public ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String email           = authentication.getName();
        String currentPassword = body.get("currentPassword");
        String newPassword     = body.get("newPassword");

        if (currentPassword == null || currentPassword.isBlank())
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Current password is required!"));

        if (newPassword == null || newPassword.length() < 6)
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "New password must be at least 6 characters!"));

        Optional<User> optUser = userRepo.findByEmail(email);
        if (optUser.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found!"));

        User u = optUser.get();
        if (!passwordEncoder.matches(currentPassword, u.getPassword()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Current password is incorrect!"));

        u.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(u);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully!"));
    }
}