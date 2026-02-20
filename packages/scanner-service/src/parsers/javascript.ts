// ============================================
// CipherX – JavaScript/TypeScript AST Parser
// ============================================
// Uses Babel to parse JS/TS files and detect crypto patterns via AST walking

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { CryptoDetection, CryptoIssueType, SeverityLevel } from '@cipherx/common';
import { WEAK_HASH_ALGORITHMS, WEAK_ENCRYPTION_ALGORITHMS, INSECURE_MODES, MIN_KEY_LENGTHS, DEPRECATED_TLS } from '@cipherx/common';

/**
 * Parse JavaScript/TypeScript source code and detect cryptographic patterns
 */
export function parseJavaScript(sourceCode: string, filePath: string): CryptoDetection[] {
    const detections: CryptoDetection[] = [];

    let ast: ReturnType<typeof parser.parse>;
    try {
        ast = parser.parse(sourceCode, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator'],
            errorRecovery: true,
        });
    } catch {
        // If parsing fails, return empty (skip non-parseable files)
        return detections;
    }

    traverse(ast, {
        // Detect crypto.createHash('md5'), crypto.createHash('sha1'), etc.
        CallExpression(path) {
            const node = path.node;

            // --- Detect hash function calls ---
            if (isMemberCall(node, 'crypto', 'createHash') || isMemberCall(node, 'crypto', 'createHmac')) {
                const algoArg = node.arguments[0];
                if (t.isStringLiteral(algoArg)) {
                    const algo = algoArg.value.toUpperCase();
                    const weakHash = WEAK_HASH_ALGORITHMS.find(h => h.name.toUpperCase() === algo);
                    if (weakHash) {
                        detections.push({
                            type: CryptoIssueType.WeakAlgorithm,
                            algorithm: algoArg.value,
                            filePath,
                            lineNumber: node.loc?.start.line || 0,
                            columnNumber: node.loc?.start.column || 0,
                            codeSnippet: extractSnippet(sourceCode, node.loc?.start.line || 0),
                            usageContext: 'Hashing function',
                            exposureLevel: 'high',
                            severity: weakHash.severity,
                            description: weakHash.description,
                        });
                    }
                }
            }

            // --- Detect crypto.createCipher / crypto.createCipheriv ---
            if (isMemberCall(node, 'crypto', 'createCipher') || isMemberCall(node, 'crypto', 'createCipheriv')) {
                const algoArg = node.arguments[0];
                if (t.isStringLiteral(algoArg)) {
                    const algoStr = algoArg.value.toLowerCase();

                    // Check for weak algorithms
                    for (const weakAlgo of WEAK_ENCRYPTION_ALGORITHMS) {
                        if (algoStr.includes(weakAlgo.name.toLowerCase())) {
                            detections.push({
                                type: CryptoIssueType.WeakAlgorithm,
                                algorithm: algoArg.value,
                                filePath,
                                lineNumber: node.loc?.start.line || 0,
                                columnNumber: node.loc?.start.column || 0,
                                codeSnippet: extractSnippet(sourceCode, node.loc?.start.line || 0),
                                usageContext: 'Encryption cipher',
                                exposureLevel: 'high',
                                severity: weakAlgo.severity,
                                description: weakAlgo.description,
                            });
                        }
                    }

                    // Check for ECB mode
                    for (const mode of INSECURE_MODES) {
                        if (algoStr.includes(mode.name.toLowerCase())) {
                            detections.push({
                                type: CryptoIssueType.InsecureMode,
                                algorithm: algoArg.value,
                                filePath,
                                lineNumber: node.loc?.start.line || 0,
                                columnNumber: node.loc?.start.column || 0,
                                codeSnippet: extractSnippet(sourceCode, node.loc?.start.line || 0),
                                usageContext: 'Cipher mode',
                                exposureLevel: 'high',
                                severity: mode.severity,
                                description: mode.description,
                            });
                        }
                    }
                }

                // Detect deprecated crypto.createCipher (no IV = insecure)
                if (isMemberCall(node, 'crypto', 'createCipher') && !isMemberCall(node, 'crypto', 'createCipheriv')) {
                    detections.push({
                        type: CryptoIssueType.StaticIV,
                        filePath,
                        lineNumber: node.loc?.start.line || 0,
                        columnNumber: node.loc?.start.column || 0,
                        codeSnippet: extractSnippet(sourceCode, node.loc?.start.line || 0),
                        usageContext: 'Deprecated cipher without IV',
                        exposureLevel: 'high',
                        severity: SeverityLevel.High,
                        description: 'crypto.createCipher is deprecated. It uses an insecure key derivation and no IV. Use crypto.createCipheriv instead.',
                    });
                }
            }

            // --- Detect RSA key generation with weak key length ---
            if (isMemberCall(node, 'crypto', 'generateKeyPairSync') || isMemberCall(node, 'crypto', 'generateKeyPair')) {
                const typeArg = node.arguments[0];
                const optionsArg = node.arguments[1];
                if (t.isStringLiteral(typeArg) && typeArg.value === 'rsa' && t.isObjectExpression(optionsArg)) {
                    const modulusLengthProp = optionsArg.properties.find(
                        p => t.isObjectProperty(p) && t.isIdentifier(p.key) && p.key.name === 'modulusLength'
                    );
                    if (modulusLengthProp && t.isObjectProperty(modulusLengthProp) && t.isNumericLiteral(modulusLengthProp.value)) {
                        const keyLength = modulusLengthProp.value.value;
                        if (keyLength < MIN_KEY_LENGTHS.RSA.minLength) {
                            detections.push({
                                type: CryptoIssueType.WeakKeyLength,
                                algorithm: 'RSA',
                                keyLength,
                                filePath,
                                lineNumber: node.loc?.start.line || 0,
                                columnNumber: node.loc?.start.column || 0,
                                codeSnippet: extractSnippet(sourceCode, node.loc?.start.line || 0),
                                usageContext: 'RSA key generation',
                                exposureLevel: 'high',
                                severity: SeverityLevel.Critical,
                                description: `RSA key length ${keyLength} bits is below the minimum recommended ${MIN_KEY_LENGTHS.RSA.minLength} bits.`,
                            });
                        }
                    }
                }
            }

            // --- Detect TLS configuration ---
            if (isMemberCall(node, 'tls', 'createServer') || isMemberCall(node, 'https', 'createServer')) {
                const optionsArg = node.arguments[0];
                if (t.isObjectExpression(optionsArg)) {
                    checkTlsOptions(optionsArg, filePath, sourceCode, detections, node);
                }
            }
        },

        // --- Detect hardcoded keys/secrets ---
        VariableDeclarator(path) {
            const node = path.node;
            if (t.isIdentifier(node.id) && t.isStringLiteral(node.init)) {
                const name = node.id.name.toLowerCase();
                const value = node.init.value;
                const secretPatterns = ['key', 'secret', 'password', 'apikey', 'api_key', 'private_key', 'encryption_key'];

                if (secretPatterns.some(p => name.includes(p)) && value.length >= 8 && !value.startsWith('process.env')) {
                    detections.push({
                        type: CryptoIssueType.HardcodedKey,
                        filePath,
                        lineNumber: node.loc?.start.line || 0,
                        columnNumber: node.loc?.start.column || 0,
                        codeSnippet: extractSnippet(sourceCode, node.loc?.start.line || 0),
                        usageContext: 'Hardcoded secret in variable',
                        exposureLevel: 'high',
                        severity: SeverityLevel.Critical,
                        description: `Potential hardcoded secret found in variable "${node.id.name}". Secrets must be stored in environment variables.`,
                    });
                }
            }
        },

        // --- Detect hardcoded keys in object properties ---
        ObjectProperty(path) {
            const node = path.node;
            if (t.isIdentifier(node.key) && t.isStringLiteral(node.value)) {
                const name = node.key.name.toLowerCase();
                const value = node.value.value;
                const secretPatterns = ['key', 'secret', 'password', 'apikey', 'api_key', 'private_key'];

                if (secretPatterns.some(p => name.includes(p)) && value.length >= 8) {
                    detections.push({
                        type: CryptoIssueType.HardcodedKey,
                        filePath,
                        lineNumber: node.loc?.start.line || 0,
                        columnNumber: node.loc?.start.column || 0,
                        codeSnippet: extractSnippet(sourceCode, node.loc?.start.line || 0),
                        usageContext: 'Hardcoded secret in object property',
                        exposureLevel: 'high',
                        severity: SeverityLevel.Critical,
                        description: `Potential hardcoded secret in property "${node.key.name}". Use environment variables instead.`,
                    });
                }
            }
        },
    });

    return detections;
}

// --- Helper Functions ---

function isMemberCall(node: t.CallExpression, obj: string, method: string): boolean {
    return (
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.object) &&
        node.callee.object.name === obj &&
        t.isIdentifier(node.callee.property) &&
        node.callee.property.name === method
    );
}

function extractSnippet(source: string, line: number, context = 2): string {
    const lines = source.split('\n');
    const start = Math.max(0, line - context - 1);
    const end = Math.min(lines.length, line + context);
    return lines.slice(start, end).join('\n');
}

function checkTlsOptions(
    options: t.ObjectExpression,
    filePath: string,
    sourceCode: string,
    detections: CryptoDetection[],
    node: t.CallExpression
) {
    for (const prop of options.properties) {
        if (!t.isObjectProperty(prop)) continue;
        if (!t.isIdentifier(prop.key)) continue;

        // Check for deprecated TLS versions
        if ((prop.key.name === 'secureProtocol' || prop.key.name === 'minVersion') && t.isStringLiteral(prop.value)) {
            const version = prop.value.value;
            if (DEPRECATED_TLS.some(d => version.includes(d))) {
                detections.push({
                    type: CryptoIssueType.DeprecatedTLS,
                    algorithm: version,
                    filePath,
                    lineNumber: prop.loc?.start.line || node.loc?.start.line || 0,
                    columnNumber: prop.loc?.start.column || 0,
                    codeSnippet: extractSnippet(sourceCode, prop.loc?.start.line || 0),
                    usageContext: 'TLS configuration',
                    exposureLevel: 'high',
                    severity: SeverityLevel.Critical,
                    description: `Deprecated TLS version "${version}" detected. Use TLS 1.2 or higher (preferably TLS 1.3).`,
                });
            }
        }
    }
}
