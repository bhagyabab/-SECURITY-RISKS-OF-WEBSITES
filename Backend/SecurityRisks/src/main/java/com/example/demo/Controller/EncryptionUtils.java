package com.example.demo.Controller;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.Key;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

public class EncryptionUtils {

    // FIX V5b: Use AES/GCM instead of AES/ECB
    // ECB was broken — identical input blocks produce identical output blocks,
    // so patterns in the file content were visible in the encrypted output.
    // GCM fixes this AND adds an integrity check (authentication tag),
    // so tampered files are detected and rejected during decryption.
    private static final int GCM_IV_LENGTH  = 12;  // 96-bit IV — standard for GCM
    private static final int GCM_TAG_LENGTH = 128; // 128-bit auth tag

    public static SecretKey generateAESKey() throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256);
        return keyGen.generateKey();
    }

    public static Key createKey(String secretKey, String algorithm) throws NoSuchAlgorithmException {
        if ("AES".equals(algorithm)) {
            byte[] keyBytes = getKeyBytes(secretKey);
            return new SecretKeySpec(keyBytes, "AES");
        } else {
            throw new IllegalArgumentException("Unsupported algorithm: " + algorithm);
        }
    }

    private static byte[] getKeyBytes(String secretKey) throws NoSuchAlgorithmException {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        byte[] key = secretKey.getBytes();
        key = sha.digest(key);
        return Arrays.copyOf(key, 32); // AES-256 = 32 bytes
    }

    public static String encodeKey(Key key) {
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    // FIX V5b: AES/GCM/NoPadding — replaces AES/ECB/PKCS5Padding
    // A fresh random 12-byte IV is generated for every single encryption call.
    // The IV is prepended to the output so decryptData() can extract it.
    // Format of returned bytes:  [12-byte IV] + [ciphertext + 16-byte GCM tag]
    public static byte[] encryptData(byte[] data, Key key) throws Exception {
        byte[] iv = new byte[GCM_IV_LENGTH];
        new SecureRandom().nextBytes(iv); // random IV every time

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] encrypted = cipher.doFinal(data);

        // Prepend IV so we can extract it during decryption
        byte[] result = new byte[GCM_IV_LENGTH + encrypted.length];
        System.arraycopy(iv,        0, result, 0,             GCM_IV_LENGTH);
        System.arraycopy(encrypted, 0, result, GCM_IV_LENGTH, encrypted.length);
        return result;
    }

    // FIX V5b: Matching GCM decryption
    // Reads the first 12 bytes as IV, then decrypts the rest.
    // GCM automatically throws an exception if the file was tampered with.
    public static byte[] decryptData(byte[] encryptedData, Key key) throws Exception {
        // Extract IV from the first 12 bytes
        byte[] iv = new byte[GCM_IV_LENGTH];
        System.arraycopy(encryptedData, 0, iv, 0, GCM_IV_LENGTH);

        // The remaining bytes are ciphertext + GCM auth tag
        byte[] ciphertext = new byte[encryptedData.length - GCM_IV_LENGTH];
        System.arraycopy(encryptedData, GCM_IV_LENGTH, ciphertext, 0, ciphertext.length);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        return cipher.doFinal(ciphertext);
    }
}