// ============================================
// CipherX – Compliance Service: Routes & Logic
// ============================================

import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { successResponse, errorResponse, getComplianceMappings, getAffectedFrameworks, ALL_COMPLIANCE_MAPPINGS, getPool } from '@cipherx/common';

const pool = getPool();

const router = Router();

/**
 * GET /compliance/report
 * Generate compliance report for an organization
 */
router.get('/report', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).user?.orgId || req.headers['x-org-id'] as string;
        if (!orgId) {
            res.status(401).json(errorResponse('AUTH_REQUIRED', 'Organization context required.'));
            return;
        }

        const framework = req.query.framework as string; // 'owasp', 'nist', 'pci_dss', 'iso_27001'

        // Get all open findings for the org
        const findingsResult = await pool.query(
            `SELECT f.*, r.name as repo_name, ra.risk_score as ai_risk_score, ra.severity as ai_severity
       FROM findings f
       JOIN repositories r ON f.repo_id = r.id
       LEFT JOIN risk_assessments ra ON f.id = ra.finding_id
       WHERE f.org_id = $1 AND f.status = 'open'
       ORDER BY f.severity DESC, f.created_at DESC`,
            [orgId]
        );

        const findings = findingsResult.rows;

        // Build compliance mapping
        const complianceReport: Record<string, any> = {};
        const frameworks = framework ? [framework.toUpperCase()] : ['OWASP', 'NIST SP 800-57', 'PCI-DSS', 'ISO 27001'];

        for (const fw of frameworks) {
            const controls = ALL_COMPLIANCE_MAPPINGS.filter(m => m.framework === fw);
            complianceReport[fw] = controls.map(control => {
                const affectedFindings = findings.filter(f => {
                    // Match findings to controls based on detected issue type
                    const findingType = inferIssueType(f.detected_issue, f.algorithm);
                    return control.cryptoIssueTypes.includes(findingType);
                });

                return {
                    controlId: control.controlId,
                    controlName: control.controlName,
                    description: control.description,
                    status: affectedFindings.length === 0 ? 'compliant' : 'non_compliant',
                    findingsCount: affectedFindings.length,
                    criticalFindings: affectedFindings.filter(f => f.severity === 'critical').length,
                    highFindings: affectedFindings.filter(f => f.severity === 'high').length,
                };
            });
        }

        // Summary stats
        const summary = {
            totalFindings: findings.length,
            criticalCount: findings.filter(f => f.severity === 'critical').length,
            highCount: findings.filter(f => f.severity === 'high').length,
            mediumCount: findings.filter(f => f.severity === 'medium').length,
            lowCount: findings.filter(f => f.severity === 'low').length,
            compliantControls: Object.values(complianceReport).flat().filter((c: any) => c.status === 'compliant').length,
            nonCompliantControls: Object.values(complianceReport).flat().filter((c: any) => c.status === 'non_compliant').length,
            generatedAt: new Date().toISOString(),
        };

        res.json(successResponse({ summary, compliance: complianceReport }));
    } catch (error) {
        console.error('Compliance report error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to generate compliance report.'));
    }
});

/**
 * GET /compliance/export
 * Export compliance report as PDF or CSV
 */
router.get('/export', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).user?.orgId || req.headers['x-org-id'] as string;
        const format = (req.query.format as string) || 'csv';

        if (!orgId) {
            res.status(401).json(errorResponse('AUTH_REQUIRED', 'Organization context required.'));
            return;
        }

        const findingsResult = await pool.query(
            `SELECT f.file_path, f.line_number, f.algorithm, f.detected_issue, f.severity,
              f.status, f.risk_score, f.code_snippet, f.language,
              r.name as repo_name, r.full_name as repo_full_name
       FROM findings f
       JOIN repositories r ON f.repo_id = r.id
       WHERE f.org_id = $1
       ORDER BY f.severity DESC, f.created_at DESC`,
            [orgId]
        );

        if (format === 'csv') {
            const csv = generateCSV(findingsResult.rows);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=cipherx-compliance-report.csv');
            res.send(csv);
        } else if (format === 'pdf') {
            const pdf = generatePDF(findingsResult.rows);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=cipherx-compliance-report.pdf');
            pdf.pipe(res);
            pdf.end();
        } else {
            res.status(400).json(errorResponse('INVALID_FORMAT', 'Supported formats: csv, pdf'));
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Export failed.'));
    }
});

/**
 * GET /compliance/dashboard
 * Dashboard stats for executive view
 */
router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).user?.orgId || req.headers['x-org-id'] as string;
        if (!orgId) {
            res.status(401).json(errorResponse('AUTH_REQUIRED', 'Organization context required.'));
            return;
        }

        // Aggregate stats
        const [findingStats, repoStats, scanStats, trendData] = await Promise.all([
            pool.query(
                `SELECT severity, COUNT(*) as count FROM findings
         WHERE org_id = $1 AND status = 'open' GROUP BY severity`,
                [orgId]
            ),
            pool.query(
                `SELECT COUNT(*) as total, COUNT(CASE WHEN last_scanned_at IS NOT NULL THEN 1 END) as scanned
         FROM repositories WHERE org_id = $1`,
                [orgId]
            ),
            pool.query(
                `SELECT COUNT(*) as total,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
         FROM scans WHERE org_id = $1`,
                [orgId]
            ),
            pool.query(
                `SELECT DATE(created_at) as date, severity, COUNT(*) as count
         FROM findings WHERE org_id = $1 AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at), severity
         ORDER BY date`,
                [orgId]
            ),
        ]);

        const dashboard = {
            findings: {
                bySeverity: findingStats.rows.reduce((acc: any, r: any) => {
                    acc[r.severity] = parseInt(r.count);
                    return acc;
                }, {}),
            },
            repositories: repoStats.rows[0],
            scans: scanStats.rows[0],
            trend: trendData.rows,
            generatedAt: new Date().toISOString(),
        };

        res.json(successResponse(dashboard));
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to generate dashboard data.'));
    }
});

// --- Helper Functions ---

function inferIssueType(detectedIssue: string, algorithm?: string): string {
    const lower = (detectedIssue || '').toLowerCase();
    if (lower.includes('hardcoded') || lower.includes('secret')) return 'hardcoded_key';
    if (lower.includes('static iv') || lower.includes('initialization vector')) return 'static_iv';
    if (lower.includes('unsalted') || lower.includes('without salt')) return 'unsalted_hash';
    if (lower.includes('weak key') || lower.includes('key size') || lower.includes('key length')) return 'weak_key_length';
    if (lower.includes('ecb') || lower.includes('insecure mode')) return 'insecure_mode';
    if (lower.includes('tls') || lower.includes('ssl') || lower.includes('deprecated')) return 'deprecated_tls';
    if (lower.includes('md5') || lower.includes('sha-1') || lower.includes('sha1') || lower.includes('des') || lower.includes('rc4')) return 'weak_algorithm';
    return 'weak_algorithm';
}

function generateCSV(findings: any[]): string {
    const headers = ['Repository', 'File', 'Line', 'Algorithm', 'Issue', 'Severity', 'Status', 'Risk Score', 'Language'];
    const rows = findings.map(f => [
        f.repo_name,
        f.file_path,
        f.line_number,
        f.algorithm || '',
        `"${(f.detected_issue || '').replace(/"/g, '""')}"`,
        f.severity,
        f.status,
        f.risk_score || '',
        f.language || '',
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
}

function generatePDF(findings: any[]): PDFDocument {
    const doc = new PDFDocument({ margin: 50 });

    // Title
    doc.fontSize(24).text('CipherX Compliance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    const medCount = findings.filter(f => f.severity === 'medium').length;

    doc.fontSize(16).text('Executive Summary');
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Findings: ${findings.length}`);
    doc.text(`Critical: ${criticalCount}`);
    doc.text(`High: ${highCount}`);
    doc.text(`Medium: ${medCount}`);
    doc.moveDown(2);

    // Findings table
    doc.fontSize(16).text('Findings Detail');
    doc.moveDown();

    for (const finding of findings.slice(0, 50)) { // Limit to 50 for PDF
        doc.fontSize(10);
        doc.text(`[${finding.severity.toUpperCase()}] ${finding.file_path}:${finding.line_number}`);
        doc.text(`  Algorithm: ${finding.algorithm || 'N/A'}`);
        doc.text(`  Issue: ${finding.detected_issue}`);
        doc.text(`  Repository: ${finding.repo_name}`);
        doc.moveDown(0.5);
    }

    return doc;
}

export default router;
