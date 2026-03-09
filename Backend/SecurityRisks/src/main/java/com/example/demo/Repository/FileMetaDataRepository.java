package com.example.demo.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.FileMetadata;

public interface  FileMetaDataRepository extends JpaRepository<FileMetadata, Long>{


	FileMetadata findByFileName(String filename);

	List<FileMetadata> findByEmail(String email);

	List<FileMetadata> findAllByEmail(String email);
	List<FileMetadata> findByStatus(String status);

}
