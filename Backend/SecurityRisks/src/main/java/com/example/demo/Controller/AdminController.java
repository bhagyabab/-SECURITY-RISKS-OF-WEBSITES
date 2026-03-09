package com.example.demo.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private FileMetaDataRepository fileMetaDataRepo;

    @Autowired
    private FileMetadataService fileMetadataService;

    @Autowired
    private ManagerRepository managerRepo;                     // ← NEW

    // ─────────────────────────────────────
    // SAFE MAP HELPERS
    // ─────────────────────────────────────
    private Map<String, Object> safeFileMap(FileMetadata f) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",       f.getId());
        m.put("fileName", f.getFileName());
        m.put("email",    f.getEmail());
        m.put("status",   f.getStatus());
        // secretKey and encryptedKeyStore deliberately NOT included
        return m;
    }

    private Map<String, Object> safeManagerMap(Manager mg) {  // ← NEW
        Map<String, Object> m = new HashMap<>();
        m.put("id",             mg.getId());
        m.put("name",           mg.getName());
        m.put("email",          mg.getEmail());
        m.put("approvalStatus", mg.getApprovalStatus());
        // password deliberately NOT included
        return m;
    }

    // ═══════════════════════════════════════════
    // DASHBOARD
    // GET /api/admin/dashboard
    // ═══════════════════════════════════════════
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        long totalUsers       = userRepo.count();
        long totalFiles       = fileMetaDataRepo.count();
        long totalManagers    = managerRepo.count();
        long pendingManagers  = managerRepo.findByApprovalStatus("PENDING").size();
        long approvedManagers = managerRepo.findByApprovalStatus("APPROVED").size();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalUsers",       totalUsers);
        summary.put("totalFiles",       totalFiles);
        summary.put("totalManagers",    totalManagers);
        summary.put("pendingManagers",  pendingManagers);
        summary.put("approvedManagers", approvedManagers);
        summary.put("message",          "Dashboard loaded successfully!");
        return ResponseEntity.ok(summary);
    }

    // ═══════════════════════════════════════════
    // USER MANAGEMENT
    // ═══════════════════════════════════════════

    // GET /api/admin/users
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepo.findAll();
        if (users.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No users found."));
        return ResponseEntity.ok(users);
    }

    // GET /api/admin/user/{id}
    @GetMapping("/user/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> user = userRepo.findById(id);
        if (user.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found!"));
        return ResponseEntity.ok(user.get());
    }

    // DELETE /api/admin/user/{id}
    @DeleteMapping("/user/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        if (!userRepo.existsById(id))
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found!"));
        userRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully!"));
    }

    // GET /api/admin/users/count
    @GetMapping("/users/count")
    public ResponseEntity<Map<String, Object>> getUserCount() {
        return ResponseEntity.ok(Map.of("totalUsers", userRepo.count()));
    }

    // ═══════════════════════════════════════════
    // FILE MANAGEMENT
    // ═══════════════════════════════════════════

    // GET /api/admin/files
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

    // GET /api/admin/files/{email}
    @GetMapping("/files/{email}")
    public ResponseEntity<?> getFilesByEmail(@PathVariable String email) {
        List<FileMetadata> files = fileMetaDataRepo.findByEmail(email);
        if (files.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No files found for " + email));

        List<Map<String, Object>> safeFiles = new ArrayList<>();
        for (FileMetadata f : files)
            safeFiles.add(safeFileMap(f));
        return ResponseEntity.ok(safeFiles);
    }

    // DELETE /api/admin/file/{id}
    @DeleteMapping("/file/{id}")
    public ResponseEntity<Map<String, String>> deleteFile(@PathVariable Long id) {
        if (!fileMetaDataRepo.existsById(id))
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "File not found!"));
        fileMetadataService.deleteFile(id);
        return ResponseEntity.ok(Map.of("message", "File deleted successfully!"));
    }

    // GET /api/admin/files/count
    @GetMapping("/files/count")
    public ResponseEntity<Map<String, Object>> getFilesCount() {
        return ResponseEntity.ok(Map.of("totalFiles", fileMetaDataRepo.count()));
    }

    // ═══════════════════════════════════════════
    // MANAGER MANAGEMENT  ← NEW
    // ═══════════════════════════════════════════

    // GET /api/admin/managers
    // All managers — all statuses, no passwords
    @GetMapping("/managers")
    public ResponseEntity<?> getAllManagers() {
        List<Manager> managers = managerRepo.findAll();
        if (managers.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No managers registered yet."));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Manager mg : managers)
            result.add(safeManagerMap(mg));
        return ResponseEntity.ok(result);
    }

    // GET /api/admin/managers/pending
    // Only PENDING managers — quick action list
    @GetMapping("/managers/pending")
    public ResponseEntity<?> getPendingManagers() {
        List<Manager> managers = managerRepo.findByApprovalStatus("PENDING");
        if (managers.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No pending manager requests."));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Manager mg : managers)
            result.add(safeManagerMap(mg));
        return ResponseEntity.ok(result);
    }

    // GET /api/admin/managers/count
    @GetMapping("/managers/count")
    public ResponseEntity<Map<String, Object>> getManagersCount() {
        long total    = managerRepo.count();
        long pending  = managerRepo.findByApprovalStatus("PENDING").size();
        long approved = managerRepo.findByApprovalStatus("APPROVED").size();
        long rejected = managerRepo.findByApprovalStatus("REJECTED").size();
        return ResponseEntity.ok(Map.of(
                "total",    total,
                "pending",  pending,
                "approved", approved,
                "rejected", rejected
        ));
    }

    // PUT /api/admin/manager/{id}/approve
    // Admin approves manager — they can now login
    @PutMapping("/manager/{id}/approve")
    public ResponseEntity<Map<String, String>> approveManager(@PathVariable Long id) {
        Optional<Manager> opt = managerRepo.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Manager not found!"));

        Manager mg = opt.get();
        if ("APPROVED".equals(mg.getApprovalStatus()))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Manager is already approved!"));

        mg.setApprovalStatus("APPROVED");
        managerRepo.save(mg);
        return ResponseEntity.ok(Map.of(
                "message", "Manager '" + mg.getName() + "' approved! They can now login.",
                "status",  "APPROVED"
        ));
    }

    // PUT /api/admin/manager/{id}/reject
    // Admin rejects manager — they cannot login
    @PutMapping("/manager/{id}/reject")
    public ResponseEntity<Map<String, String>> rejectManager(@PathVariable Long id) {
        Optional<Manager> opt = managerRepo.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Manager not found!"));

        Manager mg = opt.get();
        if ("REJECTED".equals(mg.getApprovalStatus()))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Manager is already rejected!"));

        mg.setApprovalStatus("REJECTED");
        managerRepo.save(mg);
        return ResponseEntity.ok(Map.of(
                "message", "Manager '" + mg.getName() + "' has been rejected.",
                "status",  "REJECTED"
        ));
    }

    // DELETE /api/admin/manager/{id}
    // Admin permanently removes a manager record
    @DeleteMapping("/manager/{id}")
    public ResponseEntity<Map<String, String>> deleteManager(@PathVariable Long id) {
        if (!managerRepo.existsById(id))
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Manager not found!"));
        managerRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Manager deleted successfully!"));
    }

    // ═══════════════════════════════════════════
    // NOTIFICATIONS
    // ═══════════════════════════════════════════

    // GET /api/admin/notifications
    // All activity — users + files + manager requests
    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications() {
        List<Map<String, Object>> notifications = new ArrayList<>();

        // User registrations
        List<User> users = userRepo.findAll();
        for (User u : users) {
            Map<String, Object> n = new HashMap<>();
            n.put("type",      "USER_REGISTER");
            n.put("icon",      "👤");
            n.put("title",     "New User Registered");
            n.put("message",   u.getName() + " (" + u.getEmail() + ") joined the platform.");
            n.put("userName",  u.getName());
            n.put("userEmail", u.getEmail());
            n.put("userId",    u.getId());
            n.put("fileName",  null);
            n.put("fileId",    null);
            notifications.add(n);
        }

        // File uploads
        List<FileMetadata> files = fileMetaDataRepo.findAll();
        for (FileMetadata f : files) {
            Map<String, Object> n = new HashMap<>();
            n.put("type",      "FILE_UPLOAD");
            n.put("icon",      "📁");
            n.put("title",     "New File Uploaded");
            n.put("message",   f.getEmail() + " uploaded \"" + f.getFileName() + "\".");
            n.put("userName",  null);
            n.put("userEmail", f.getEmail());
            n.put("userId",    null);
            n.put("fileName",  f.getFileName());
            n.put("fileId",    f.getId());
            notifications.add(n);
        }

        // Manager registration requests ← NEW
        List<Manager> managers = managerRepo.findAll();
        for (Manager mg : managers) {
            Map<String, Object> n = new HashMap<>();
            n.put("type",           "MANAGER_REQUEST");
            n.put("icon",           "⚙️");
            n.put("title",          "Manager Registration Request");
            n.put("message",        mg.getName() + " (" + mg.getEmail() + ") requested Manager access — " + mg.getApprovalStatus() + ".");
            n.put("userName",       mg.getName());
            n.put("userEmail",      mg.getEmail());
            n.put("managerId",      mg.getId());
            n.put("approvalStatus", mg.getApprovalStatus());
            n.put("fileName",       null);
            n.put("fileId",         null);
            notifications.add(n);
        }

        if (notifications.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No notifications yet."));

        return ResponseEntity.ok(notifications);
    }

    // GET /api/admin/notifications/uploads
    @GetMapping("/notifications/uploads")
    public ResponseEntity<?> getUploadNotifications() {
        List<FileMetadata> files = fileMetaDataRepo.findAll();
        List<Map<String, Object>> notifications = new ArrayList<>();

        for (FileMetadata f : files) {
            Map<String, Object> n = new HashMap<>();
            n.put("type",      "FILE_UPLOAD");
            n.put("icon",      "📁");
            n.put("title",     "File Uploaded");
            n.put("message",   f.getEmail() + " uploaded \"" + f.getFileName() + "\".");
            n.put("userEmail", f.getEmail());
            n.put("fileName",  f.getFileName());
            n.put("fileId",    f.getId());
            notifications.add(n);
        }

        if (notifications.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No file upload notifications."));

        return ResponseEntity.ok(notifications);
    }

    // GET /api/admin/notifications/registrations
    @GetMapping("/notifications/registrations")
    public ResponseEntity<?> getRegistrationNotifications() {
        List<User> users = userRepo.findAll();
        List<Map<String, Object>> notifications = new ArrayList<>();

        for (User u : users) {
            Map<String, Object> n = new HashMap<>();
            n.put("type",      "USER_REGISTER");
            n.put("icon",      "👤");
            n.put("title",     "User Registered");
            n.put("message",   u.getName() + " (" + u.getEmail() + ") joined the platform.");
            n.put("userName",  u.getName());
            n.put("userEmail", u.getEmail());
            n.put("userId",    u.getId());
            notifications.add(n);
        }

        if (notifications.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No registration notifications."));

        return ResponseEntity.ok(notifications);
    }

    // GET /api/admin/notifications/managers  ← NEW
    // Only manager registration requests
    @GetMapping("/notifications/managers")
    public ResponseEntity<?> getManagerNotifications() {
        List<Manager> managers = managerRepo.findAll();
        List<Map<String, Object>> notifications = new ArrayList<>();

        for (Manager mg : managers) {
            Map<String, Object> n = new HashMap<>();
            n.put("type",           "MANAGER_REQUEST");
            n.put("icon",           "⚙️");
            n.put("title",          "Manager Request — " + mg.getApprovalStatus());
            n.put("message",        mg.getName() + " (" + mg.getEmail() + ") requested Manager access.");
            n.put("userName",       mg.getName());
            n.put("userEmail",      mg.getEmail());
            n.put("managerId",      mg.getId());
            n.put("approvalStatus", mg.getApprovalStatus());
            notifications.add(n);
        }

        if (notifications.isEmpty())
            return ResponseEntity.ok(Map.of("message", "No manager requests yet."));

        return ResponseEntity.ok(notifications);
    }

    // GET /api/admin/notifications/count
    @GetMapping("/notifications/count")
    public ResponseEntity<Map<String, Object>> getNotificationsCount() {
        long userCount    = userRepo.count();
        long fileCount    = fileMetaDataRepo.count();
        long managerCount = managerRepo.count();
        long pendingMgrs  = managerRepo.findByApprovalStatus("PENDING").size();
        return ResponseEntity.ok(Map.of(
                "totalNotifications", userCount + fileCount + managerCount,
                "userRegistrations",  userCount,
                "fileUploads",        fileCount,
                "managerRequests",    managerCount,
                "pendingManagers",    pendingMgrs
        ));
    }
}