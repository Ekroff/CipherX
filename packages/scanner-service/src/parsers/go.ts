// ============================================
// CipherX – Go Source Code Parser
// ============================================

import { CryptoDetection, CryptoIssueType, SeverityLevel } from '@cipherx/common';
import { MIN_KEY_LENGTHS } from '@cipherx/common';

interface LineInfo {
    content: string;
    lineNumber: number;
    trimmed: string;
}

/**
 * Parse Go source code and detect cryptographic patterns
 */
export function parseGo(sourceCode: string, filePath: string): CryptoDetection[] {
    const detections: CryptoDetection[] = [];
    const lines: LineInfo[] = sourceCode.split('\n').map((content, i) => ({
        content,
        lineNumber: i + 1,
        trimmed: content.trim(),
    }));

    // Check imports for weak crypto packages
    const imports = extractGoImports(sourceCode);

    let inBlockComment = false;

    for (const line of lines) {
        if (line.trimmed.startsWith('/*')) inBlockComment = true;
        if (line.trimmed.includes('*/')) { inBlockComment = false; continue; }
        if (inBlockComment || line.trimmed.startsWith('//')) continue;

        // --- Weak hash usage: md5.New(), sha1.New() ---
        if (/md5\.New\s*\(/.test(line.content) || /md5\.Sum\s*\(/.test(line.content)) {
            detections.push({
                type: CryptoIssueType.WeakAlgorithm,
                algorithm: 'MD5',
                filePath,
                lineNumber: line.lineNumber,
                columnNumber: 0,
                codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                usageContext: 'Go crypto/md5',
                exposureLevel: 'high',
                severity: SeverityLevel.High,
                description: 'MD5 is cryptographically broken. Use crypto/sha256 or crypto/sha512.',
            });
        }

        if (/sha1\.New\s*\(/.test(line.content) || /sha1\.Sum\s*\(/.test(line.content)) {
            detections.push({
                type: CryptoIssueType.WeakAlgorithm,
                algorithm: 'SHA-1',
                filePath,
                lineNumber: line.lineNumber,
                columnNumber: 0,
                codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                usageContext: 'Go crypto/sha1',
                exposureLevel: 'high',
                severity: SeverityLevel.High,
                description: 'SHA-1 has known collision attacks. Use crypto/sha256.',
            });
        }

        // --- DES usage ---
        if (/des\.NewCipher\s*\(/.test(line.content) || /des\.NewTripleDESCipher\s*\(/.test(line.content)) {
            const isDES3 = line.content.includes('TripleDES');
            detections.push({
                type: CryptoIssueType.WeakAlgorithm,
                algorithm: isDES3 ? '3DES' : 'DES',
                filePath,
                lineNumber: line.lineNumber,
                columnNumber: 0,
                codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                usageContext: 'Go crypto/des',
                exposureLevel: 'high',
                severity: SeverityLevel.Critical,
                description: `${isDES3 ? '3DES' : 'DES'} is deprecated. Use crypto/aes with GCM mode.`,
            });
        }

        // --- RC4 usage ---
        if (/rc4\.NewCipher\s*\(/.test(line.content)) {
            detections.push({
                type: CryptoIssueType.WeakAlgorithm,
                algorithm: 'RC4',
                filePath,
                lineNumber: line.lineNumber,
                columnNumber: 0,
                codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                usageContext: 'Go crypto/rc4',
                exposureLevel: 'high',
                severity: SeverityLevel.Critical,
                description: 'RC4 is broken. Use AES-GCM or ChaCha20-Poly1305.',
            });
        }

        // --- ECB-like pattern (using cipher.NewECBEncrypter doesn't exist in stdlib, but custom implementations) ---
        if (/cipher\.NewCBCEncrypter\s*\(/.test(line.content) || /cipher\.NewCBCDecrypter\s*\(/.test(line.content)) {
            // CBC is acceptable but check for static IV
            // If IV appears to be hardcoded nearby
            const nearbyLines = getNearbyLines(sourceCode, line.lineNumber, 3);
            if (nearbyLines.some(l => /\[\]byte\s*\{/.test(l) || /\[\d+\]byte\s*\{/.test(l))) {
                detections.push({
                    type: CryptoIssueType.StaticIV,
                    filePath,
                    lineNumber: line.lineNumber,
                    columnNumber: 0,
                    codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                    usageContext: 'Go CBC cipher with possible static IV',
                    exposureLevel: 'high',
                    severity: SeverityLevel.High,
                    description: 'Possible static IV detected near CBC cipher. Use crypto/rand to generate IVs.',
                });
            }
        }

        // --- Weak RSA key size ---
        const rsaPattern = /rsa\.GenerateKey\s*\(\s*\w+\s*,\s*(\d+)\s*\)/;
        const rsaMatch = line.content.match(rsaPattern);
        if (rsaMatch) {
            const keySize = parseInt(rsaMatch[1]);
            if (keySize < MIN_KEY_LENGTHS.RSA.minLength) {
                detections.push({
                    type: CryptoIssueType.WeakKeyLength,
                    algorithm: 'RSA',
                    keyLength: keySize,
                    filePath,
                    lineNumber: line.lineNumber,
                    columnNumber: 0,
                    codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                    usageContext: 'Go RSA key generation',
                    exposureLevel: 'high',
                    severity: SeverityLevel.Critical,
                    description: `RSA key size ${keySize} is below minimum ${MIN_KEY_LENGTHS.RSA.minLength} bits.`,
                });
            }
        }

        // --- Hardcoded secrets ---
        const secretPattern = /(?:var|const)\s+\w*(?:password|secret|key|apiKey|privateKey)\w*\s*=\s*"(.{8,})"/i;
        if (secretPattern.test(line.content) && !line.content.includes('os.Getenv')) {
            detections.push({
                type: CryptoIssueType.HardcodedKey,
                filePath,
                lineNumber: line.lineNumber,
                columnNumber: 0,
                codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                usageContext: 'Hardcoded secret',
                exposureLevel: 'high',
                severity: SeverityLevel.Critical,
                description: 'Hardcoded secret detected. Use os.Getenv() or a secrets manager.',
            });
        }

        // --- Deprecated TLS ---
        const tlsPatterns = [
            /tls\.VersionTLS10/,
            /tls\.VersionTLS11/,
            /tls\.VersionSSL30/,
        ];
        for (const pattern of tlsPatterns) {
            if (pattern.test(line.content)) {
                detections.push({
                    type: CryptoIssueType.DeprecatedTLS,
                    filePath,
                    lineNumber: line.lineNumber,
                    columnNumber: 0,
                    codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                    usageContext: 'Go TLS configuration',
                    exposureLevel: 'high',
                    severity: SeverityLevel.Critical,
                    description: 'Deprecated TLS version. Use tls.VersionTLS12 or tls.VersionTLS13.',
                });
            }
        }
    }

    // Warn if importing weak crypto packages
    if (imports.includes('crypto/md5')) {
        // Already caught by function call detection above
    }
    if (imports.includes('crypto/des')) {
        if (!detections.some(d => d.algorithm === 'DES' || d.algorithm === '3DES')) {
            detections.push({
                type: CryptoIssueType.DeprecatedLibrary,
                algorithm: 'DES',
                filePath,
                lineNumber: 1,
                columnNumber: 0,
                codeSnippet: 'import "crypto/des"',
                usageContext: 'Deprecated crypto package import',
                exposureLevel: 'medium',
                severity: SeverityLevel.Medium,
                description: 'crypto/des package imported. DES is deprecated; use crypto/aes.',
            });
        }
    }
    if (imports.includes('crypto/rc4')) {
        if (!detections.some(d => d.algorithm === 'RC4')) {
            detections.push({
                type: CryptoIssueType.DeprecatedLibrary,
                algorithm: 'RC4',
                filePath,
                lineNumber: 1,
                columnNumber: 0,
                codeSnippet: 'import "crypto/rc4"',
                usageContext: 'Deprecated crypto package import',
                exposureLevel: 'medium',
                severity: SeverityLevel.Medium,
                description: 'crypto/rc4 package imported. RC4 is broken; use AES-GCM.',
            });
        }
    }

    return detections;
}

function extractGoImports(source: string): string[] {
    const imports: string[] = [];
    // Single import: import "package"
    const singleImportRegex = /import\s+"([^"]+)"/g;
    let match;
    while ((match = singleImportRegex.exec(source)) !== null) {
        imports.push(match[1]);
    }
    // Block import
    const blockImportRegex = /import\s*\(([\s\S]*?)\)/g;
    while ((match = blockImportRegex.exec(source)) !== null) {
        const block = match[1];
        const lineRegex = /["']([^"']+)["']/g;
        let lineMatch;
        while ((lineMatch = lineRegex.exec(block)) !== null) {
            imports.push(lineMatch[1]);
        }
    }
    return imports;
}

function extractSnippet(source: string, line: number, context = 2): string {
    const lines = source.split('\n');
    const start = Math.max(0, line - context - 1);
    const end = Math.min(lines.length, line + context);
    return lines.slice(start, end).join('\n');
}

function getNearbyLines(source: string, line: number, range: number): string[] {
    const lines = source.split('\n');
    const start = Math.max(0, line - range - 1);
    const end = Math.min(lines.length, line + range);
    return lines.slice(start, end);
}
