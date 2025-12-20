/**
 * Encryption utilities for sensitive employee data
 * Uses AES encryption for client-side encryption before storing sensitive data
 */

// Simple AES encryption implementation using Web Crypto API
// In production, consider using a more robust server-side encryption solution

/**
 * Generates a cryptographic key from password
 * @param {string} password - The password to derive key from
 * @param {Uint8Array} salt - The salt value
 * @returns {Promise<CryptoKey>} The derived key
 */
async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts sensitive data
 * @param {string} data - The data to encrypt
 * @param {string} key - Encryption key (should come from environment variable in production)
 * @returns {Promise<string>} Encrypted data as base64 string
 */
export async function encryptData(data, key = import.meta.env.VITE_ENCRYPTION_KEY) {
    if (!data || !key) {
        throw new Error('Data and key are required for encryption');
    }

    try {
        // Generate a random salt and IV for each encryption
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Derive the key
        const cryptoKey = await deriveKey(key, salt);

        // Encrypt the data
        const enc = new TextEncoder();
        const encryptedData = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            cryptoKey,
            enc.encode(data)
        );

        // Combine salt, iv, and encrypted data
        const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

        // Return as base64 string with metadata
        const base64 = btoa(String.fromCharCode(...combined));
        return `enc:${base64}`;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypts sensitive data
 * @param {string} encryptedData - The encrypted data (base64 with prefix)
 * @param {string} key - Decryption key (should come from environment variable in production)
 * @returns {Promise<string>} Decrypted data
 */
export async function decryptData(encryptedData, key = import.meta.env.VITE_ENCRYPTION_KEY) {
    if (!encryptedData || !key) {
        throw new Error('Encrypted data and key are required for decryption');
    }

    try {
        // Check if data is encrypted
        if (!encryptedData.startsWith('enc:')) {
            // Data is not encrypted, return as is
            return encryptedData;
        }

        // Remove prefix and decode base64
        const base64Data = encryptedData.substring(4);
        const combined = new Uint8Array(
            atob(base64Data).split('').map(char => char.charCodeAt(0))
        );

        // Extract salt, iv, and encrypted data
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const encrypted = combined.slice(28);

        // Derive the key
        const cryptoKey = await deriveKey(key, salt);

        // Decrypt the data
        const decryptedData = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            cryptoKey,
            encrypted
        );

        // Convert back to string
        const dec = new TextDecoder();
        return dec.decode(decryptedData);
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Masks sensitive data for display (e.g., in logs or previews)
 * @param {string} data - The data to mask
 * @param {number} visibleChars - Number of characters to show at the beginning and end
 * @returns {string} Masked data
 */
export function maskSensitiveData(data, visibleChars = 4) {
    if (!data || data.length <= visibleChars * 2) {
        return '****';
    }

    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(Math.min(data.length - (visibleChars * 2), 8));

    return `${start}${middle}${end}`;
}

/**
 * Encrypts banking information
 * @param {Object} bankingInfo - Banking information object
 * @returns {Promise<Object>} Encrypted banking information
 */
export async function encryptBankingInfo(bankingInfo) {
    if (!bankingInfo) return null;

    const encrypted = { ...bankingInfo, encrypted: true };

    // Encrypt sensitive fields
    if (bankingInfo.accountNumber) {
        encrypted.accountNumber = await encryptData(bankingInfo.accountNumber);
    }

    if (bankingInfo.routingNumber) {
        encrypted.routingNumber = await encryptData(bankingInfo.routingNumber);
    }

    return encrypted;
}

/**
 * Decrypts banking information
 * @param {Object} encryptedBankingInfo - Encrypted banking information object
 * @returns {Promise<Object>} Decrypted banking information
 */
export async function decryptBankingInfo(encryptedBankingInfo) {
    if (!encryptedBankingInfo || !encryptedBankingInfo.encrypted) {
        return encryptedBankingInfo;
    }

    const decrypted = { ...encryptedBankingInfo };

    // Decrypt sensitive fields
    if (encryptedBankingInfo.accountNumber) {
        try {
            decrypted.accountNumber = await decryptData(encryptedBankingInfo.accountNumber);
        } catch (error) {
            console.error('Failed to decrypt account number:', error);
            decrypted.accountNumber = '****';
        }
    }

    if (encryptedBankingInfo.routingNumber) {
        try {
            decrypted.routingNumber = await decryptData(encryptedBankingInfo.routingNumber);
        } catch (error) {
            console.error('Failed to decrypt routing number:', error);
            decrypted.routingNumber = '****';
        }
    }

    // Remove encryption flag
    delete decrypted.encrypted;

    return decrypted;
}

/**
 * Encrypts tax information
 * @param {Object} taxInfo - Tax information object
 * @returns {Promise<Object>} Encrypted tax information
 */
export async function encryptTaxInfo(taxInfo) {
    if (!taxInfo) return null;

    const encrypted = { ...taxInfo, encrypted: true };

    // Encrypt sensitive fields
    if (taxInfo.ssn) {
        encrypted.ssn = await encryptData(taxInfo.ssn);
    }

    return encrypted;
}

/**
 * Decrypts tax information
 * @param {Object} encryptedTaxInfo - Encrypted tax information object
 * @returns {Promise<Object>} Decrypted tax information
 */
export async function decryptTaxInfo(encryptedTaxInfo) {
    if (!encryptedTaxInfo || !encryptedTaxInfo.encrypted) {
        return encryptedTaxInfo;
    }

    const decrypted = { ...encryptedTaxInfo };

    // Decrypt sensitive fields
    if (encryptedTaxInfo.ssn) {
        try {
            decrypted.ssn = await decryptData(encryptedTaxInfo.ssn);
        } catch (error) {
            console.error('Failed to decrypt SSN:', error);
            decrypted.ssn = '***-**-****';
        }
    }

    // Remove encryption flag
    delete decrypted.encrypted;

    return decrypted;
}

/**
 * Check if encryption is available (Web Crypto API support)
 * @returns {boolean} True if encryption is available
 */
export function isEncryptionAvailable() {
    return !!(crypto && crypto.subtle && crypto.getRandomValues);
}

/**
 * Fallback encryption for environments without Web Crypto API
 * Note: This is less secure and should only be used for development
 * @param {string} data - Data to encode
 * @returns {string} Simple encoded string
 */
export function fallbackEncode(data) {
    if (!data) return data;

    // Simple obfuscation (NOT secure encryption)
    return btoa(unescape(encodeURIComponent(data)));
}

/**
 * Fallback decryption for environments without Web Crypto API
 * @param {string} encodedData - Data to decode
 * @returns {string} Decoded string
 */
export function fallbackDecode(encodedData) {
    if (!encodedData) return encodedData;

    try {
        return decodeURIComponent(escape(atob(encodedData)));
    } catch {
        return encodedData;
    }
}

/**
 * Simple synchronous encrypt function for document metadata
 * Note: This is a simplified version that uses fallback encoding
 * For true encryption, use encryptData/decryptData
 * @param {string} data - Data to encrypt
 * @returns {string} Encrypted data
 */
export function encrypt(data) {
    if (!data) return data;

    try {
        // Use fallback encoding for simplicity in document metadata
        // In production, you might want to use the full encryptData function
        return btoa(unescape(encodeURIComponent(data)));
    } catch (error) {
        console.error('Encryption error:', error);
        return data; // Return original data if encryption fails
    }
}

/**
 * Simple synchronous decrypt function for document metadata
 * Note: This is a simplified version that uses fallback decoding
 * For true decryption, use encryptData/decryptData
 * @param {string} encryptedData - Data to decrypt
 * @returns {string} Decrypted data
 */
export function decrypt(encryptedData) {
    if (!encryptedData) return encryptedData;

    try {
        // Try to decode - if it fails, return original data
        return decodeURIComponent(escape(atob(encryptedData)));
    } catch (error) {
        // Data might not be encrypted, return as is
        return encryptedData;
    }
}

// Default export
export default {
    encryptData,
    decryptData,
    encrypt,
    decrypt,
    maskSensitiveData,
    encryptBankingInfo,
    decryptBankingInfo,
    encryptTaxInfo,
    decryptTaxInfo,
    isEncryptionAvailable,
    fallbackEncode,
    fallbackDecode
};