// ============================================
// CipherX – Cryptographic Pattern Constants
// ============================================

import { SeverityLevel, CryptoIssueType } from '../types';

export interface CryptoPattern {
    name: string;
    type: CryptoIssueType;
    severity: SeverityLevel;
    description: string;
    recommendation: string;
}

// Weak hashing algorithms
export const WEAK_HASH_ALGORITHMS: CryptoPattern[] = [
    {
        name: 'MD5',
        type: CryptoIssueType.WeakAlgorithm,
        severity: SeverityLevel.High,
        description: 'MD5 is cryptographically broken and should not be used for security purposes.',
        recommendation: 'Use SHA-256 or SHA-3 for hashing. Use bcrypt/scrypt/Argon2 for passwords.',
    },
    {
        name: 'SHA-1',
        type: CryptoIssueType.WeakAlgorithm,
        severity: SeverityLevel.High,
        description: 'SHA-1 has known collision attacks and is deprecated for security use.',
        recommendation: 'Use SHA-256 or SHA-3 for hashing.',
    },
    {
        name: 'SHA1',
        type: CryptoIssueType.WeakAlgorithm,
        severity: SeverityLevel.High,
        description: 'SHA-1 has known collision attacks and is deprecated for security use.',
        recommendation: 'Use SHA-256 or SHA-3 for hashing.',
    },
];

// Weak encryption algorithms
export const WEAK_ENCRYPTION_ALGORITHMS: CryptoPattern[] = [
    {
        name: 'DES',
        type: CryptoIssueType.WeakAlgorithm,
        severity: SeverityLevel.Critical,
        description: 'DES uses a 56-bit key which can be brute-forced. It is completely insecure.',
        recommendation: 'Use AES-256-GCM for symmetric encryption.',
    },
    {
        name: 'RC4',
        type: CryptoIssueType.WeakAlgorithm,
        severity: SeverityLevel.Critical,
        description: 'RC4 has multiple known vulnerabilities and is prohibited by RFC 7465.',
        recommendation: 'Use AES-256-GCM or ChaCha20-Poly1305.',
    },
    {
        name: '3DES',
        type: CryptoIssueType.WeakAlgorithm,
        severity: SeverityLevel.High,
        description: 'Triple DES has an effective security of only 112 bits and is deprecated by NIST.',
        recommendation: 'Use AES-256-GCM for symmetric encryption.',
    },
    {
        name: 'Blowfish',
        type: CryptoIssueType.WeakAlgorithm,
        severity: SeverityLevel.Medium,
        description: 'Blowfish has a 64-bit block size, making it vulnerable to birthday attacks.',
        recommendation: 'Use AES-256-GCM for symmetric encryption.',
    },
];

// Insecure cipher modes
export const INSECURE_MODES: CryptoPattern[] = [
    {
        name: 'ECB',
        type: CryptoIssueType.InsecureMode,
        severity: SeverityLevel.High,
        description: 'ECB mode does not provide semantic security. Identical plaintext blocks produce identical ciphertext.',
        recommendation: 'Use GCM or CBC mode with proper IV management. Prefer AES-256-GCM.',
    },
];

// Minimum key lengths
export const MIN_KEY_LENGTHS: Record<string, { minLength: number; severity: SeverityLevel }> = {
    RSA: { minLength: 2048, severity: SeverityLevel.Critical },
    DSA: { minLength: 2048, severity: SeverityLevel.Critical },
    AES: { minLength: 128, severity: SeverityLevel.High },
    ECDSA: { minLength: 256, severity: SeverityLevel.High },
};

// Deprecated TLS versions
export const DEPRECATED_TLS: string[] = ['TLSv1', 'TLSv1.0', 'TLSv1.1', 'SSLv2', 'SSLv3', 'SSL'];

// JavaScript crypto function patterns (for AST matching)
export const JS_CRYPTO_PATTERNS = {
    hashFunctions: [
        'crypto.createHash',
        'crypto.createHmac',
        'CryptoJS.MD5',
        'CryptoJS.SHA1',
        'CryptoJS.SHA256',
    ],
    cipherFunctions: [
        'crypto.createCipher',
        'crypto.createCipheriv',
        'crypto.createDecipher',
        'crypto.createDecipheriv',
        'CryptoJS.AES.encrypt',
        'CryptoJS.DES.encrypt',
        'CryptoJS.TripleDES.encrypt',
        'CryptoJS.RC4.encrypt',
    ],
    keyFunctions: [
        'crypto.generateKeyPair',
        'crypto.generateKeyPairSync',
        'crypto.generateKey',
        'crypto.generateKeySync',
    ],
    tlsFunctions: [
        'tls.createServer',
        'tls.connect',
        'https.createServer',
    ],
};

// Python crypto patterns (for AST matching)
export const PYTHON_CRYPTO_PATTERNS = {
    hashModules: ['hashlib', 'hmac'],
    hashFunctions: ['hashlib.md5', 'hashlib.sha1', 'hashlib.new'],
    cryptoModules: ['cryptography', 'Crypto', 'PyCrypto', 'pycryptodome'],
    cipherClasses: [
        'Cipher', 'AES', 'DES', 'DES3', 'Blowfish', 'ARC4',
        'algorithms.AES', 'algorithms.TripleDES',
    ],
    keyFunctions: ['rsa.generate_private_key', 'dsa.generate_private_key'],
};

// Java crypto patterns (for AST matching)
export const JAVA_CRYPTO_PATTERNS = {
    cipherClasses: ['javax.crypto.Cipher', 'javax.crypto.KeyGenerator'],
    hashClasses: ['java.security.MessageDigest'],
    keyClasses: ['java.security.KeyPairGenerator', 'java.security.KeyFactory'],
    tlsClasses: ['javax.net.ssl.SSLContext'],
    bouncyCastle: ['org.bouncycastle'],
};

// Go crypto patterns (for AST matching)
export const GO_CRYPTO_PATTERNS = {
    hashPackages: ['crypto/md5', 'crypto/sha1', 'crypto/sha256', 'crypto/sha512'],
    cipherPackages: ['crypto/aes', 'crypto/des', 'crypto/rc4', 'crypto/cipher'],
    keyPackages: ['crypto/rsa', 'crypto/ecdsa', 'crypto/ed25519', 'crypto/dsa'],
    tlsPackage: 'crypto/tls',
};
