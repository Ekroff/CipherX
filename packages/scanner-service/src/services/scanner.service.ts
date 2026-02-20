// ============================================
// CipherX – Scan Orchestrator Service (Supabase)
// ============================================

import { v4 as uuidv4 } from 'uuid';
import { ScanStatus, SeverityLevel, CryptoDetection, getPool } from '@cipherx/common';
import { parseJavaScript, parsePython, parseJava, parseGo } from '../parsers';

const pool = getPool();

// Map file extensions to parser functions
const PARSER_MAP: Record<string, (source: string, filePath: string) => CryptoDetection[]> = {
    '.js': parseJavaScript,
    '.jsx': parseJavaScript,
    '.ts': parseJavaScript,
    '.tsx': parseJavaScript,
    '.mjs': parseJavaScript,
    '.cjs': parseJavaScript,
    '.py': parsePython,
    '.java': parseJava,
    '.go': parseGo,
};

const SUPPORTED_EXTENSIONS = Object.keys(PARSER_MAP);

export interface FileEntry {
    path: string;
    content: string;
}

/**
 * Create a new scan record
 */
export async function createScan(orgId: string, repoId: string, userId: string, branch?: string): Promise<string> {
    const result = await pool.query(
        `INSERT INTO scans (org_id, repo_id, triggered_by, status, branch)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [orgId, repoId, userId, ScanStatus.Pending, branch || 'main']
    );
    return result.rows[0].id;
}

/**
 * Execute a scan on a list of files
 */
export async function executeScan(scanId: string, orgId: string, repoId: string, files: FileEntry[]): Promise<void> {
    await pool.query(
        `UPDATE scans SET status = $1, started_at = NOW() WHERE id = $2`,
        [ScanStatus.Running, scanId]
    );

    try {
        const allDetections: CryptoDetection[] = [];
        let filesScanned = 0;

        for (const file of files) {
            const ext = getFileExtension(file.path);
            if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

            const parser = PARSER_MAP[ext];
            try {
                const detections = parser(file.content, file.path);
                allDetections.push(...detections);
                filesScanned++;
            } catch (err) {
                console.error(`Error parsing ${file.path}:`, err);
            }
        }

        const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };

        for (const detection of allDetections) {
            await pool.query(
                `INSERT INTO findings (org_id, scan_id, repo_id, file_path, line_number, column_number,
         algorithm, key_length, usage_context, exposure_level, detected_issue, code_snippet,
         language, severity, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'open')`,
                [
                    orgId, scanId, repoId,
                    detection.filePath, detection.lineNumber, detection.columnNumber,
                    detection.algorithm || null, detection.keyLength || null,
                    detection.usageContext, detection.exposureLevel,
                    detection.description, detection.codeSnippet,
                    getLanguageFromExt(getFileExtension(detection.filePath)),
                    detection.severity,
                ]
            );

            switch (detection.severity) {
                case SeverityLevel.Critical: severityCounts.critical++; break;
                case SeverityLevel.High: severityCounts.high++; break;
                case SeverityLevel.Medium: severityCounts.medium++; break;
                case SeverityLevel.Low: severityCounts.low++; break;
            }
        }

        await pool.query(
            `UPDATE scans SET status = $1, completed_at = NOW(), total_files_scanned = $2,
       total_findings = $3, critical_count = $4, high_count = $5, medium_count = $6, low_count = $7
       WHERE id = $8`,
            [ScanStatus.Completed, filesScanned, allDetections.length,
            severityCounts.critical, severityCounts.high, severityCounts.medium, severityCounts.low, scanId]
        );

        await pool.query(`UPDATE repositories SET last_scanned_at = NOW() WHERE id = $1`, [repoId]);

        await pool.query(
            `INSERT INTO usage_metrics (org_id, metric_type, metric_value, period_start, period_end)
       VALUES ($1, 'scans', 1, date_trunc('month', NOW()), date_trunc('month', NOW()) + interval '1 month' - interval '1 day')
       ON CONFLICT (org_id, metric_type, period_start)
       DO UPDATE SET metric_value = usage_metrics.metric_value + 1`,
            [orgId]
        );

        await pool.query(
            `INSERT INTO audit_logs (org_id, action, resource_type, resource_id, details)
       VALUES ($1, 'scan.completed', 'scan', $2, $3)`,
            [orgId, scanId, JSON.stringify({ filesScanned, totalFindings: allDetections.length, severityCounts })]
        );

    } catch (error) {
        await pool.query(
            `UPDATE scans SET status = $1, completed_at = NOW(), error_message = $2 WHERE id = $3`,
            [ScanStatus.Failed, (error as Error).message, scanId]
        );
        throw error;
    }
}

export async function getScanStatus(scanId: string) {
    const result = await pool.query(`SELECT * FROM scans WHERE id = $1`, [scanId]);
    return result.rows[0] || null;
}

export async function getFindings(
    orgId: string,
    filters: { scanId?: string; repoId?: string; severity?: string; status?: string; algorithm?: string; page?: number; pageSize?: number; }
) {
    const conditions: string[] = ['f.org_id = $1'];
    const params: any[] = [orgId];
    let paramIndex = 2;

    if (filters.scanId) { conditions.push(`f.scan_id = $${paramIndex++}`); params.push(filters.scanId); }
    if (filters.repoId) { conditions.push(`f.repo_id = $${paramIndex++}`); params.push(filters.repoId); }
    if (filters.severity) { conditions.push(`f.severity = $${paramIndex++}`); params.push(filters.severity); }
    if (filters.status) { conditions.push(`f.status = $${paramIndex++}`); params.push(filters.status); }
    if (filters.algorithm) { conditions.push(`f.algorithm ILIKE $${paramIndex++}`); params.push(`%${filters.algorithm}%`); }

    const page = filters.page || 1;
    const pageSize = Math.min(filters.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;
    const whereClause = conditions.join(' AND ');

    const countResult = await pool.query(`SELECT COUNT(*) FROM findings f WHERE ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
        `SELECT f.*, r.name as repo_name, r.full_name as repo_full_name
     FROM findings f JOIN repositories r ON f.repo_id = r.id
     WHERE ${whereClause} ORDER BY f.severity DESC, f.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, pageSize, offset]
    );

    return { findings: result.rows, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function connectRepository(
    orgId: string, data: { name: string; fullName: string; provider: string; cloneUrl?: string; isPublic?: boolean }
) {
    const result = await pool.query(
        `INSERT INTO repositories (org_id, name, full_name, provider, clone_url, is_public)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (org_id, provider, full_name) DO UPDATE
     SET clone_url = EXCLUDED.clone_url, updated_at = NOW() RETURNING *`,
        [orgId, data.name, data.fullName, data.provider, data.cloneUrl, data.isPublic || false]
    );
    return result.rows[0];
}

export async function listRepositories(orgId: string) {
    const result = await pool.query(`SELECT * FROM repositories WHERE org_id = $1 ORDER BY created_at DESC`, [orgId]);
    return result.rows;
}

function getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot >= 0 ? filePath.substring(lastDot) : '';
}

function getLanguageFromExt(ext: string): string {
    const map: Record<string, string> = {
        '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
        '.mjs': 'javascript', '.cjs': 'javascript', '.py': 'python', '.java': 'java', '.go': 'go',
    };
    return map[ext] || 'unknown';
}

export { pool };
