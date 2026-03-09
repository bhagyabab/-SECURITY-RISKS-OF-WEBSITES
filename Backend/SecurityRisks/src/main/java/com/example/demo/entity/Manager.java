package com.example.demo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "managers")
public class Manager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    @Column(unique = true)
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
    private String approvalStatus = "PENDING";

    public Manager() {}

    public Manager(String name, String email, String password) {
        this.name           = name;
        this.email          = email;
        this.password       = password;
        this.approvalStatus = "PENDING";
    }

    public Long getId()                                      { return id; }
    public void setId(Long id)                               { this.id = id; }

    public String getName()                                  { return name; }
    public void setName(String name)                         { this.name = name; }

    public String getEmail()                                 { return email; }
    public void setEmail(String email)                       { this.email = email; }

    public String getPassword()                              { return password; }
    public void setPassword(String password)                 { this.password = password; }

    public String getApprovalStatus()                        { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus)     { this.approvalStatus = approvalStatus; }
}