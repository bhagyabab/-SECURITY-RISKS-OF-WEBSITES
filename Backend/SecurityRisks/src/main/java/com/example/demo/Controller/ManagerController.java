package com.example.demo.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.example.demo.Repository.FileMetaDataRepository;
import com.example.demo.Repository.ManagerRepository;
import com.example.demo.Repository.UserRepository;
import com.example.demo.entity.FileMetadata;
import com.example.demo.entity.Manager;
import com.example.demo.entity.User;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {

    @Autowired
    private FileMetaDataRepository fileMetaDataRepo;

    @Autowired
    private FileMetadataService fileMetadataService;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private ManagerRepository managerRepo;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    // Safe file map — no encryption keys exposed
    private Map<String, Object> safeFileMap(FileMetadata f) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",       f.getId());
        m.put("fileName", f.getFileName());
        m.put("email",    f.getEmail());
        m.put("status",   f.getStatus());
        return m;
    }

    // ─────────────────────────────────────
    // DASHBOARD SUMMARY
    // GET /api/manager/dashboard
    // ─────────────────────────────────────
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        long totalFiles    = fileMetaDataRepo.count();
        long totalUsers    = userRepo.count();
        long pendingFiles  = fileMetaDataRepo.findByStatus("PENDING").size();
        long approvedFiles = fileMetaDataRepo.findByStatus("APPROVED").size();
        long rejectedFiles = fileMetaDataRepo.findByStatus("REJECTED").size();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalFiles",    totalFiles);
        summary.put("totalUsers",    totalUsers);
        summary.put("pendingFiles",  pendingFiles);
        summary.put("approvedFiles", approvedFiles);
        summary.put("rejectedFiles", rejectedFiles);
        summary.put("message",       "Manager dashboard loaded successfully!");
        return ResponseEntity.ok(summary);
    }

    // ─────────────────────────────────────
    // GET ALL FILES (all statuses)
    // GET /api/manager/files
    // ─────────────────────────────────────
    @GetMapping("/files")
    public ResponseEntity<?> getAllFiles() {
        List<FileMetadata> files = fileMetaDataRepo.findAll();
        if (files.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No files uploaded yet."));

        List<Map<String, Object>> safeFiles = new ArrayList<>();
        for (FileMetadata f : files)
            safeFiles.add(safeFileMap(f));
        return ResponseEntity.ok(safeFiles);
    }

    // ─────────────────────────────────────
    // GET FILES BY STATUS
    // GET /api/manager/files/status/{status}
    // ─────────────────────────────────────
    @GetMapping("/files/status/{status}")
    public ResponseEntity<?> getFilesByStatus(@PathVariable String status) {
        List<FileMetadata> files = fileMetaDataRepo.findByStatus(status.toUpperCase());
        if (files.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No " + status + " files found."));

        List<Map<String, Object>> safeFiles = new ArrayList<>();
        for (FileMetadata f : files)
            safeFiles.add(safeFileMap(f));
        return ResponseEntity.ok(safeFiles);
    }

    // ─────────────────────────────────────
    // APPROVE FILE
    // PUT /api/manager/file/{id}/approve
    // ─────────────────────────────────────
    @PutMapping("/file/{id}/approve")
    public ResponseEntity<Map<String, String>> approveFile(@PathVariable Long id) {
        Optional<FileMetadata> optFile = fileMetaDataRepo.findById(id);
        if (optFile.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "File not found!"));

        FileMetadata file = optFile.get();
        file.setStatus("APPROVED");
        fileMetaDataRepo.save(file);

        return ResponseEntity.ok(Map.of(
                "message", "File '" + file.getFileName() + "' approved successfully!",
                "status",  "APPROVED"
        ));
    }

    // ─────────────────────────────────────
    // REJECT FILE
    // PUT /api/manager/file/{id}/reject
    // ─────────────────────────────────────
    @PutMapping("/file/{id}/reject")
    public ResponseEntity<Map<String, String>> rejectFile(@PathVariable Long id) {
        Optional<FileMetadata> optFile = fileMetaDataRepo.findById(id);
        if (optFile.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "File not found!"));

        FileMetadata file = optFile.get();
        file.setStatus("REJECTED");
        fileMetaDataRepo.save(file);

        return ResponseEntity.ok(Map.of(
                "message", "File '" + file.getFileName() + "' rejected.",
                "status",  "REJECTED"
        ));
    }

    // ─────────────────────────────────────
    // DELETE FILE
    // DELETE /api/manager/file/{id}
    // ─────────────────────────────────────
    @DeleteMapping("/file/{id}")
    public ResponseEntity<Map<String, String>> deleteFile(@PathVariable Long id) {
        if (!fileMetaDataRepo.existsById(id))
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "File not found!"));
        fileMetadataService.deleteFile(id);
        return ResponseEntity.ok(Map.of("message", "File deleted successfully!"));
    }

    // ─────────────────────────────────────
    // GET ALL USERS (read-only)
    // GET /api/manager/users
    // ─────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepo.findAll();
        if (users.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No users found."));

        List<Map<String, Object>> safeUsers = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> m = new HashMap<>();
            m.put("id",    u.getId());
            m.put("name",  u.getName());
            m.put("email", u.getEmail());
            m.put("role",  u.getRole());
            safeUsers.add(m);
        }
        return ResponseEntity.ok(safeUsers);
    }

    // ─────────────────────────────────────
    // GET NOTIFICATIONS
    // GET /api/manager/notifications
    // ─────────────────────────────────────
    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications() {
        List<Map<String, Object>> notifications = new ArrayList<>();

        List<User> users = userRepo.findAll();
        for (User u : users) {
            Map<String, Object> n = new HashMap<>();
            n.put("type",      "USER_REGISTER");
            n.put("icon",      "👤");
            n.put("title",     "New User Registered");
            n.put("message",   u.getName() + " (" + u.getEmail() + ") joined the platform.");
            n.put("userEmail", u.getEmail());
            n.put("userId",    u.getId());
            notifications.add(n);
        }

        List<FileMetadata> files = fileMetaDataRepo.findAll();
        for (FileMetadata f : files) {
            Map<String, Object> n = new HashMap<>();
            n.put("type",      "FILE_UPLOAD");
            n.put("icon",      "📁");
            n.put("title",     "File Upload — " + f.getStatus());
            n.put("message",   f.getEmail() + " uploaded \"" + f.getFileName() + "\" · " + f.getStatus());
            n.put("userEmail", f.getEmail());
            n.put("fileName",  f.getFileName());
            n.put("fileId",    f.getId());
            n.put("status",    f.getStatus());
            notifications.add(n);
        }

        if (notifications.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No notifications yet."));

        return ResponseEntity.ok(notifications);
    }

    // ─────────────────────────────────────
    // GET NOTIFICATIONS COUNT
    // GET /api/manager/notifications/count
    // ─────────────────────────────────────
    @GetMapping("/notifications/count")
    public ResponseEntity<Map<String, Object>> getNotificationsCount() {
        long userCount    = userRepo.count();
        long fileCount    = fileMetaDataRepo.count();
        long pendingCount = fileMetaDataRepo.findByStatus("PENDING").size();
        return ResponseEntity.ok(Map.of(
                "totalNotifications", userCount + fileCount,
                "userRegistrations",  userCount,
                "fileUploads",        fileCount,
                "pendingApprovals",   pendingCount
        ));
    }

    // ─────────────────────────────────────────────
    // GET PROFILE
    // GET /api/manager/profile
    // ─────────────────────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        String email = authentication.getName();

        Optional<Manager> optMgr = managerRepo.findByEmail(email);
        if (optMgr.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Manager not found!"));

        Manager m = optMgr.get();
        Map<String, Object> profile = new HashMap<>();
        profile.put("id",             m.getId());
        profile.put("name",           m.getName());
        profile.put("email",          m.getEmail());
        profile.put("approvalStatus", m.getApprovalStatus());
        profile.put("message",        "Profile loaded successfully!");
        return ResponseEntity.ok(profile);
    }

    // ─────────────────────────────────────────────
    // UPDATE PROFILE NAME
    // PUT /api/manager/profile/update
    // ─────────────────────────────────────────────
    @PutMapping("/profile/update")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String email = authentication.getName();
        String name  = body.get("name");

        if (name == null || name.isBlank())
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Name cannot be empty!"));

        Optional<Manager> optMgr = managerRepo.findByEmail(email);
        if (optMgr.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Manager not found!"));

        Manager m = optMgr.get();
        m.setName(name.trim());
        managerRepo.save(m);

        return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully!",
                "name",    m.getName(),
                "email",   m.getEmail()));
    }

    // ─────────────────────────────────────────────
    // CHANGE PASSWORD
    // PUT /api/manager/profile/password
    // ─────────────────────────────────────────────
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

        Optional<Manager> optMgr = managerRepo.findByEmail(email);
        if (optMgr.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Manager not found!"));

        Manager m = optMgr.get();
        if (!passwordEncoder.matches(currentPassword, m.getPassword()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Current password is incorrect!"));

        m.setPassword(passwordEncoder.encode(newPassword));
        managerRepo.save(m);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully!"));
    }
}