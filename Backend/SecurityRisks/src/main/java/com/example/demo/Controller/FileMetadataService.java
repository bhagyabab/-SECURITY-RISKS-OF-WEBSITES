package com.example.demo.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Repository.FileMetaDataRepository;
import com.example.demo.entity.FileMetadata;

import java.util.List;


@Service
public class FileMetadataService {

    @Autowired
    private FileMetaDataRepository fileMetadataRepository;

    public void saveFileMetadata(String fileName, String email, String secretKey) {
        FileMetadata fileMetadata = new FileMetadata();
        fileMetadata.setFileName(fileName);
        fileMetadata.setEmail(email);
        fileMetadata.setSecretKey(secretKey);
        fileMetadataRepository.save(fileMetadata);
    }

    public List<FileMetadata> getFilesByEmail(String email) {
        return fileMetadataRepository.findAllByEmail(email);
    }

    public void deleteFile(Long id) {
        fileMetadataRepository.deleteById(id);
    }
}
