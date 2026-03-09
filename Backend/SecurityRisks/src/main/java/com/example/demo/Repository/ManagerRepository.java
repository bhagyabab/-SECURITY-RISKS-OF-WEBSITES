package com.example.demo.Repository;

import com.example.demo.entity.Manager;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ManagerRepository extends JpaRepository<Manager, Long> {

    Optional<Manager> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Manager> findByApprovalStatus(String approvalStatus);
}