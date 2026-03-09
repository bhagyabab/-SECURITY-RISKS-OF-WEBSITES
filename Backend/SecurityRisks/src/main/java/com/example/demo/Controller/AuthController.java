package com.example.demo.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.example.demo.Repository.ManagerRepository;
import com.example.demo.Repository.UserRepository;
import com.example.demo.entity.Manager;
import com.example.demo.entity.User;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private ManagerRepository managerRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    // ─────────────────────────────────────
    // HARDCODED ADMIN CREDENTIALS
    // ─────────────────────────────────────
    private static final String ADMIN_EMAIL    = "admin@gmail.com";
    private static final String ADMIN_PASSWORD = "Admin@123";
    private static final String ADMIN_NAME     = "Administrator";

    // ─────────────────────────────────────
    // USER REGISTER
    // POST /api/auth/register
    // ─────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(
            @RequestBody Map<String, String> request) {

        String name     = request.get("name");
        String email    = request.get("email");
        String password = request.get("password");

        if (name == null || name.isBlank())
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Name is required!"));

        if (email == null || email.isBlank())
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email is required!"));

        if (password == null || password.length() < 6)
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password must be at least 6 characters!"));

        if (email.equalsIgnoreCase(ADMIN_EMAIL))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "This email is not allowed for registration!"));

        if (userRepo.existsByEmail(email))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email already registered!"));

        // Block manager emails from registering as user
        if (managerRepo.existsByEmail(email))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email already registered as a manager!"));

        User user = new User(
                name,
                email,
                passwordEncoder.encode(password),
                User.Role.USER
        );
        userRepo.save(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Registration successful! Please login."));
    }

    // ─────────────────────────────────────
    // MANAGER REGISTER
    // POST /api/auth/manager/register
    // Manager registers separately — saved as PENDING until Admin approves
    // ─────────────────────────────────────
    @PostMapping("/manager/register")
    public ResponseEntity<Map<String, String>> managerRegister(
            @RequestBody Map<String, String> request) {

        String name     = request.get("name");
        String email    = request.get("email");
        String password = request.get("password");

        if (name == null || name.isBlank())
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Name is required!"));

        if (email == null || email.isBlank())
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email is required!"));

        if (password == null || password.length() < 6)
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password must be at least 6 characters!"));

        if (email.equalsIgnoreCase(ADMIN_EMAIL))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "This email is not allowed!"));

        // Block if already registered as user
        if (userRepo.existsByEmail(email))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email already registered as a user!"));

        // Block duplicate manager registration
        if (managerRepo.existsByEmail(email))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Manager email already registered!"));

        Manager manager = new Manager(
                name,
                email,
                passwordEncoder.encode(password)
        );
        managerRepo.save(manager);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message",
                        "Manager registration submitted! Please wait for Admin approval before logging in."));
    }

    // ─────────────────────────────────────
    // LOGIN (Admin + User + Manager)
    // POST /api/auth/login
    // ─────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @RequestBody Map<String, String> request) {

        String email    = request.get("email");
        String password = request.get("password");

        if (email == null || email.isBlank())
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email is required!"));

        if (password == null || password.isBlank())
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password is required!"));

        // ── ADMIN LOGIN ──
        if (email.equalsIgnoreCase(ADMIN_EMAIL)) {
            if (!password.equals(ADMIN_PASSWORD))
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid admin password!"));

            String token = jwtService.generateToken(ADMIN_EMAIL, "ADMIN");
            return ResponseEntity.ok(Map.of(
                    "token",   token,
                    "role",    "ADMIN",
                    "name",    ADMIN_NAME,
                    "email",   ADMIN_EMAIL,
                    "message", "Admin login successful!"
            ));
        }

        // ── MANAGER LOGIN ──
        // Check manager table first before user table
        Optional<Manager> managerOpt = managerRepo.findByEmail(email);
        if (managerOpt.isPresent()) {
            Manager manager = managerOpt.get();

            if (!passwordEncoder.matches(password, manager.getPassword()))
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid password!"));

            // Check approval status — block login if not APPROVED
            if ("PENDING".equals(manager.getApprovalStatus()))
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error",
                                "Your manager account is pending Admin approval. Please wait."));

            if ("REJECTED".equals(manager.getApprovalStatus()))
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error",
                                "Your manager registration was rejected by Admin."));

            // APPROVED — generate token
            String token = jwtService.generateToken(email, "MANAGER");
            return ResponseEntity.ok(Map.of(
                    "token",   token,
                    "role",    "MANAGER",
                    "name",    manager.getName(),
                    "email",   manager.getEmail(),
                    "message", "Manager login successful!"
            ));
        }

        // ── NORMAL USER LOGIN ──
        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty())
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not found!"));

        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid password!"));

        String token = jwtService.generateToken(email, user.getRole().name());
        return ResponseEntity.ok(Map.of(
                "token",   token,
                "role",    user.getRole().name(),
                "name",    user.getName(),
                "email",   user.getEmail(),
                "message", "Login successful!"
        ));
    }
}