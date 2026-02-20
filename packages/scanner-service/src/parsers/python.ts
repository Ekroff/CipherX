// ============================================
// CipherX – Python Source Code Parser
// ============================================
// Pattern-based analysis for Python crypto usage
// In production, this would use tree-sitter-python for full AST parsing

import { CryptoDetection, CryptoIssueType, SeverityLevel } from '@cipherx/common';
import { WEAK_HASH_ALGORITHMS, WEAK_ENCRYPTION_ALGORITHMS, MIN_KEY_LENGTHS } from '@cipherx/common';

interface LineInfo {
    content: string;
    lineNumber: number;
    trimmed: string;
}

/**
 * Parse Python source code and detect cryptographic patterns
 */
export function parsePython(sourceCode: string, filePath: string): CryptoDetection[] {
    const detections: CryptoDetection[] = [];
    const lines: LineInfo[] = sourceCode.split('\n').map((content, i) => ({
        content,
        lineNumber: i + 1,
        trimmed: content.trim(),
    }));

    for (const line of lines) {
        if (line.trimmed.startsWith('#')) continue; // skip comments

        // --- Detect hashlib usage with weak algorithms ---
        detectHashlib(line, filePath, sourceCode, detections);

        // --- Detect PyCrypto / cryptography weak ciphers ---
        detectWeakCiphers(line, filePath, sourceCode, detections);

        // --- Detect weak RSA key generation ---
        detectWeakRSA(line, filePath, sourceCode, detections);

        // --- Detect hardcoded secrets ---
        detectHardcodedSecrets(line, filePath, sourceCode, detections);

        // --- Detect static IVs ---
        detectStaticIV(line, filePath, sourceCode, detections);

        // --- Detect unsalted hash usage ---
        detectUnsaltedHash(line, filePath, sourceCode, detections);

        // --- Detect deprecated TLS ---
        detectDeprecatedTLS(line, filePath, sourceCode, detections);
    }

    return detections;
}

function detectHashlib(line: LineInfo, filePath: string, source: string, detections: CryptoDetection[]) {
    // hashlib.md5(, hashlib.sha1(, hashlib.new('md5'
    const hashPatterns = [
        { regex: /hashlib\.md5\s*\(/, algo: 'MD5' },
        { regex: /hashlib\.sha1\s*\(/, algo: 'SHA-1' },
        { regex: /hashlib\.new\s*\(\s*['"]md5['"]/, algo: 'MD5' },
        { regex: /hashlib\.new\s*\(\s*['"]sha1['"]/, algo: 'SHA-1' },
    ];

    for (const pattern of hashPatterns) {
        if (pattern.regex.test(line.content)) {
            const weakHash = WEAK_HASH_ALGORITHMS.find(h => h.name.toUpperCase() === pattern.algo.replace('-', '').toUpperCase());
            detections.push({
                type: CryptoIssueType.WeakAlgorithm,
                algorithm: pattern.algo,
                filePath,
                lineNumber: line.lineNumber,
                columnNumber: 0,
                codeSnippet: extractSnippet(source, line.lineNumber),
                usageContext: 'Python hashlib',
                exposureLevel: 'high',
                severity: weakHash?.severity || SeverityLevel.High,
                description: weakHash?.description || `Weak hash algorithm ${pattern.algo} detected.`,
            });
        }
    }
}

function detectWeakCiphers(line: LineInfo, filePath: string, source: string, detections: CryptoDetection[]) {
    const cipherPatterns = [
        { regex: /DES\.new\s*\(/, algo: 'DES' },
        { regex: /DES3\.new\s*\(/, algo: '3DES' },
        { regex: /ARC4\.new\s*\(/, algo: 'RC4' },
        { regex: /Blowfish\.new\s*\(/, algo: 'Blowfish' },
        { regex: /algorithms\.TripleDES\s*\(/, algo: '3DES' },
        { regex: /AES\.new\(.*MODE_ECB/, algo: 'AES-ECB' },
        { regex: /modes\.ECB\s*\(/, algo: 'AES-ECB' },
    ];

    for (const pattern of cipherPatterns) {
        if (pattern.regex.test(line.content)) {
            const isECB = pattern.algo.includes('ECB');
            const weakAlgo = WEAK_ENCRYPTION_ALGORITHMS.find(a => pattern.algo.includes(a.name));

            detections.push({
                type: isECB ? CryptoIssueType.InsecureMode : CryptoIssueType.WeakAlgorithm,
                algorithm: pattern.algo,
                filePath,
                lineNumber: line.lineNumber,
                columnNumber: 0,
                codeSnippet: extractSnippet(source, line.lineNumber),
                usageContext: 'Python encryption',
                exposureLevel: 'high',
                severity: weakAlgo?.severity || SeverityLevel.High,
                description: isECB
                    ? 'ECB mode does not provide semantic security.'
                    : weakAlgo?.description || `Weak cipher ${pattern.algo} detected.`,
            });
        }
    }
}

function detectWeakRSA(line: LineInfo, filePath: string, source: string, detections: CryptoDetection[]) {
    const rsaPattern = /rsa\.generate_private_key\s*\(.*?key_size\s*=\s*(\d+)/;
    const match = line.content.match(rsaPattern);
    if (match) {
        const keySize = parseInt(match[1]);
        if (keySize < MIN_KEY_LENGTHS.RSA.minLength) {
            detections.push({
                type: CryptoIssueType.WeakKeyLength,
                algorithm: 'RSA',
                keyLength: keySize,
                filePath,
                lineNumber: line.lineNumber,
                columnNumber: 0,
                codeSnippet: extractSnippet(source, line.lineNumber),
                usageContext: 'RSA key generation',
                exposureLevel: 'high',
                severity: SeverityLevel.Critical,
                description: `RSA key size ${keySize} is below the minimum ${MIN_KEY_LENGTHS.RSA.minLength} bits.`,
            });
        }
    }
}

function detectHardcodedSecrets(line: LineInfo, filePath: string, source: string, detections: CryptoDetection[]) {
    const secretPattern = /(?:password|secret|key|api_key|apikey|private_key|encryption_key)\s*=\s*['"]((?!os\.environ|os\.getenv).{8,})['"]/i;
    const match = line.content.match(secretPattern);
    if (match && !line.trimmed.startsWith('#')) {
        detections.push({
            type: CryptoIssueType.HardcodedKey,
            filePath,
            lineNumber: line.lineNumber,
            columnNumber: 0,
            codeSnippet: extractSnippet(source, line.lineNumber),
            usageContext: 'Hardcoded secret',
            exposureLevel: 'high',
            severity: SeverityLevel.Critical,
            description: 'Potential hardcoded secret detected. Use environment variables (os.environ) instead.',
        });
    }
}

function detectStaticIV(line: LineInfo, filePath: string, source: string, detections: CryptoDetection[]) {
    // Detect iv= or IV= with a hardcoded byte string
    const ivPattern = /(?:iv|IV|nonce)\s*=\s*b['"]/;
    if (ivPattern.test(line.content)) {
        detections.push({
            type: CryptoIssueType.StaticIV,
            filePath,
            lineNumber: line.lineNumber,
            columnNumber: 0,
            codeSnippet: extractSnippet(source, line.lineNumber),
            usageContext: 'Static initialization vector',
            exposureLevel: 'high',
            severity: SeverityLevel.High,
            description: 'Static IV/nonce detected. IVs must be randomly generated for each encryption operation.',
        });
    }
}

function detectUnsaltedHash(line: LineInfo, filePath: string, source: string, detections: CryptoDetection[]) {
    // Detect hashlib usage without salt (common pattern: hashlib.sha256(password.encode()))
    const unsaltedPattern = /hashlib\.\w+\(\s*(?:password|passwd|pw|user_password)/i;
    if (unsaltedPattern.test(line.content) && !line.content.includes('salt') && !line.content.includes('bcrypt') && !line.content.includes('scrypt')) {
        detections.push({
            type: CryptoIssueType.UnsaltedHash,
            filePath,
            lineNumber: line.lineNumber,
            columnNumber: 0,
            codeSnippet: extractSnippet(source, line.lineNumber),
            usageContext: 'Password hashing without salt',
            exposureLevel: 'high',
            severity: SeverityLevel.Critical,
            description: 'Password hashed without salt detected. Use bcrypt, scrypt, or Argon2id for password hashing.',
        });
    }
}

function detectDeprecatedTLS(line: LineInfo, filePath: string, source: string, detections: CryptoDetection[]) {
    const tlsPatterns = [
        /ssl\.PROTOCOL_TLSv1\b/,
        /ssl\.PROTOCOL_TLSv1_1/,
        /ssl\.PROTOCOL_SSLv2/,
        /ssl\.PROTOCOL_SSLv3/,
        /ssl\.PROTOCOL_SSLv23/,
        /TLSVersion\.TLSv1\b/,
        /TLSVersion\.TLSv1_1/,
    ];

    for (const pattern of tlsPatterns) {
        if (pattern.test(line.content)) {
            detections.push({
                type: CryptoIssueType.DeprecatedTLS,
                filePath,
                lineNumber: line.lineNumber,
                columnNumber: 0,
                codeSnippet: extractSnippet(source, line.lineNumber),
                usageContext: 'TLS configuration',
                exposureLevel: 'high',
                severity: SeverityLevel.Critical,
                description: 'Deprecated TLS/SSL version detected. Use TLS 1.2 or higher.',
            });
        }
    }
}

function extractSnippet(source: string, line: number, context = 2): string {
    const lines = source.split('\n');
    const start = Math.max(0, line - context - 1);
    const end = Math.min(lines.length, line + context);
    return lines.slice(start, end).join('\n');
}
