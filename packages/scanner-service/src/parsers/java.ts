// ============================================
// CipherX – Java Source Code Parser
// ============================================

import { CryptoDetection, CryptoIssueType, SeverityLevel } from '@cipherx/common';
import { MIN_KEY_LENGTHS } from '@cipherx/common';

interface LineInfo {
    content: string;
    lineNumber: number;
    trimmed: string;
}

/**
 * Parse Java source code and detect cryptographic patterns
 */
export function parseJava(sourceCode: string, filePath: string): CryptoDetection[] {
    const detections: CryptoDetection[] = [];
    const lines: LineInfo[] = sourceCode.split('\n').map((content, i) => ({
        content,
        lineNumber: i + 1,
        trimmed: content.trim(),
    }));

    let inBlockComment = false;

    for (const line of lines) {
        // Handle block comments
        if (line.trimmed.includes('/*')) inBlockComment = true;
        if (line.trimmed.includes('*/')) { inBlockComment = false; continue; }
        if (inBlockComment || line.trimmed.startsWith('//')) continue;

        // --- MessageDigest with weak algorithms ---
        const mdPattern = /MessageDigest\.getInstance\s*\(\s*["'](\w[\w-]*)['"]\s*\)/;
        const mdMatch = line.content.match(mdPattern);
        if (mdMatch) {
            const algo = mdMatch[1].toUpperCase();
            if (['MD5', 'SHA-1', 'SHA1', 'MD2', 'MD4'].includes(algo)) {
                detections.push({
                    type: CryptoIssueType.WeakAlgorithm,
                    algorithm: mdMatch[1],
                    filePath,
                    lineNumber: line.lineNumber,
                    columnNumber: 0,
                    codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                    usageContext: 'Java MessageDigest',
                    exposureLevel: 'high',
                    severity: SeverityLevel.High,
                    description: `Weak hash algorithm ${mdMatch[1]} used in MessageDigest. Use SHA-256 or SHA-3.`,
                });
            }
        }

        // --- Cipher.getInstance with weak algorithms or ECB mode ---
        const cipherPattern = /Cipher\.getInstance\s*\(\s*["']([\w/\-]+)['"]\s*\)/;
        const cipherMatch = line.content.match(cipherPattern);
        if (cipherMatch) {
            const transformation = cipherMatch[1].toUpperCase();

            // Check for weak algorithms
            if (transformation.includes('DES') && !transformation.includes('DESEDE') && !transformation.includes('3DES')) {
                detections.push({
                    type: CryptoIssueType.WeakAlgorithm,
                    algorithm: cipherMatch[1],
                    filePath,
                    lineNumber: line.lineNumber,
                    columnNumber: 0,
                    codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                    usageContext: 'Java Cipher',
                    exposureLevel: 'high',
                    severity: SeverityLevel.Critical,
                    description: 'DES cipher is insecure. Use AES/GCM/NoPadding.',
                });
            }

            if (transformation.includes('RC4') || transformation.includes('ARCFOUR')) {
                detections.push({
                    type: CryptoIssueType.WeakAlgorithm,
                    algorithm: cipherMatch[1],
                    filePath,
                    lineNumber: line.lineNumber,
                    columnNumber: 0,
                    codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                    usageContext: 'Java Cipher',
                    exposureLevel: 'high',
                    severity: SeverityLevel.Critical,
                    description: 'RC4 is cryptographically broken. Use AES/GCM/NoPadding.',
                });
            }

            // Check for ECB mode
            if (transformation.includes('ECB') || (!transformation.includes('/') && transformation.includes('AES'))) {
                detections.push({
                    type: CryptoIssueType.InsecureMode,
                    algorithm: cipherMatch[1],
                    filePath,
                    lineNumber: line.lineNumber,
                    columnNumber: 0,
                    codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                    usageContext: 'Java Cipher mode',
                    exposureLevel: 'high',
                    severity: SeverityLevel.High,
                    description: 'ECB mode (or no mode specified, defaulting to ECB) does not provide semantic security. Use AES/GCM/NoPadding.',
                });
            }
        }

        // --- KeyPairGenerator with weak key sizes ---
        const kpgInitPattern = /\.initialize\s*\(\s*(\d+)\s*\)/;
        const kpgMatch = line.content.match(kpgInitPattern);
        if (kpgMatch && (line.content.includes('KeyPairGenerator') || sourceCode.includes('KeyPairGenerator.getInstance("RSA")'))) {
            const keySize = parseInt(kpgMatch[1]);
            if (keySize < MIN_KEY_LENGTHS.RSA.minLength) {
                detections.push({
                    type: CryptoIssueType.WeakKeyLength,
                    algorithm: 'RSA',
                    keyLength: keySize,
                    filePath,
                    lineNumber: line.lineNumber,
                    columnNumber: 0,
                    codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                    usageContext: 'Java KeyPairGenerator',
                    exposureLevel: 'high',
                    severity: SeverityLevel.Critical,
                    description: `RSA key size ${keySize} is below minimum ${MIN_KEY_LENGTHS.RSA.minLength} bits.`,
                });
            }
        }

        // --- Hardcoded secrets ---
        const secretPattern = /(?:String|final\s+String)\s+\w*(?:password|secret|key|apiKey|api_key|privateKey)\w*\s*=\s*"(.{8,})"/i;
        const secretMatch = line.content.match(secretPattern);
        if (secretMatch) {
            detections.push({
                type: CryptoIssueType.HardcodedKey,
                filePath,
                lineNumber: line.lineNumber,
                columnNumber: 0,
                codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                usageContext: 'Hardcoded secret',
                exposureLevel: 'high',
                severity: SeverityLevel.Critical,
                description: 'Hardcoded secret detected in Java code. Use environment variables or a secrets manager.',
            });
        }

        // --- Static IV ---
        const ivPattern = /(?:IvParameterSpec|GCMParameterSpec)\s*\(\s*(?:new\s+byte\s*\[\s*\]\s*\{|")/;
        if (ivPattern.test(line.content)) {
            detections.push({
                type: CryptoIssueType.StaticIV,
                filePath,
                lineNumber: line.lineNumber,
                columnNumber: 0,
                codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                usageContext: 'Static initialization vector',
                exposureLevel: 'high',
                severity: SeverityLevel.High,
                description: 'Static IV detected. IVs must be randomly generated using SecureRandom.',
            });
        }

        // --- Deprecated TLS ---
        const tlsPattern = /SSLContext\.getInstance\s*\(\s*["'](TLSv1(?:\.1)?|SSLv[23])["']\s*\)/;
        const tlsMatch = line.content.match(tlsPattern);
        if (tlsMatch) {
            detections.push({
                type: CryptoIssueType.DeprecatedTLS,
                algorithm: tlsMatch[1],
                filePath,
                lineNumber: line.lineNumber,
                columnNumber: 0,
                codeSnippet: extractSnippet(sourceCode, line.lineNumber),
                usageContext: 'Java TLS configuration',
                exposureLevel: 'high',
                severity: SeverityLevel.Critical,
                description: `Deprecated TLS version "${tlsMatch[1]}". Use TLSv1.2 or TLSv1.3.`,
            });
        }
    }

    return detections;
}

function extractSnippet(source: string, line: number, context = 2): string {
    const lines = source.split('\n');
    const start = Math.max(0, line - context - 1);
    const end = Math.min(lines.length, line + context);
    return lines.slice(start, end).join('\n');
}
