package com.example.demo.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.User;

public interface UserRepository extends JpaRepository<User, Long>{

	boolean existsByEmail(String email);

	Optional<User> findByEmail(String email);

}
