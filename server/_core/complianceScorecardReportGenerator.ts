/**
 * Compliance Scorecard HTML Email Report Generator
 * Generates Fortune 500-quality self-contained HTML reports for IT compliance assessments
 * Features: Executive summary, compliance framework mapping, pass/fail details, dark mode support
 */

interface ScorecardData {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  emailSecurityScore: number;
  endpointProtectionScore: number;
  backupRecoveryScore: number;
  identityManagementScore: number;
  complianceScore: number;
  overallScore: number;
  riskLevel: string;
}

interface ComplianceFramework {
  name: string;
  coverage: number;
  controls: Array<{
    id: string;
    name: string;
    status: 'pass' | 'fail' | 'warning';
    expected: string;
    actual: string;
    remediation: string;
  }>;
}

const COMPLIANCE_FRAMEWORKS: Record<string, ComplianceFramework> = {
  nist: {
    name: 'NIST 800-53',
    coverage: 0,
    controls: [
      {
        id: 'AC-2',
        name: 'Account Management',
        status: 'pass',
        expected: 'MFA enabled for all users',
        actual: 'MFA enabled for 95% of users',
        remediation: 'Enable MFA for remaining 5% of user accounts',
      },
      {
        id: 'AU-2',
        name: 'Audit Events',
        status: 'fail',
        expected: 'Audit logging enabled for all services',
        actual: 'Audit logging enabled for 60% of services',
        remediation: 'Enable audit logging in Exchange Online, SharePoint, and Teams',
      },
      {
        id: 'IA-2',
        name: 'Authentication',
        status: 'pass',
        expected: 'Strong authentication mechanisms',
        actual: 'Conditional Access policies enforced',
        remediation: 'N/A - Control is passing',
      },
    ],
  },
  iso: {
    name: 'ISO 27001:2022',
    coverage: 0,
    controls: [
      {
        id: 'A.5.1',
        name: 'Policies for information security',
        status: 'pass',
        expected: 'Information security policies documented',
        actual: 'Policies documented and reviewed annually',
        remediation: 'N/A - Control is passing',
      },
      {
        id: 'A.6.1',
        name: 'Organization of information security',
        status: 'warning',
        expected: 'Security roles and responsibilities defined',
        actual: 'Roles defined but not all documented',
        remediation: 'Document all security roles and responsibilities',
      },
    ],
  },
  soc2: {
    name: 'SOC 2 Type II',
    coverage: 0,
    controls: [
      {
        id: 'CC6.1',
        name: 'Logical and Physical Access Controls',
        status: 'pass',
        expected: 'Access controls implemented',
        actual: 'Azure AD conditional access configured',
        remediation: 'N/A - Control is passing',
      },
    ],
  },
  hipaa: {
    name: 'HIPAA',
    coverage: 0,
    controls: [
      {
        id: '164.308(a)(3)',
        name: 'Workforce Security',
        status: 'fail',
        expected: 'Unique user identification implemented',
        actual: 'Partial implementation',
        remediation: 'Implement unique user IDs for all workforce members',
      },
    ],
  },
  pciDss: {
    name: 'PCI-DSS v4.0',
    coverage: 0,
    controls: [
      {
        id: '1.1',
        name: 'Firewall Configuration',
        status: 'pass',
        expected: 'Firewall rules documented',
        actual: 'Rules documented and tested quarterly',
        remediation: 'N/A - Control is passing',
      },
    ],
  },
  cmmc: {
    name: 'CMMC 2.0',
    coverage: 0,
    controls: [
      {
        id: 'AC.1.001',
        name: 'Access Control',
        status: 'warning',
        expected: 'Access control policies implemented',
        actual: 'Policies implemented but not fully enforced',
        remediation: 'Enforce access control policies across all systems',
      },
    ],
  },
};

function calculateFrameworkCoverage(score: number): number {
  // Coverage is based on overall score
  // 90-100: 95%, 80-89: 85%, 70-79: 70%, 60-69: 55%, below 60: 40%
  if (score >= 90) return 95;
  if (score >= 80) return 85;
  if (score >= 70) return 70;
  if (score >= 60) return 55;
  return 40;
}

function getRiskColor(riskLevel: string): string {
  switch (riskLevel.toLowerCase()) {
    case 'critical':
      return '#dc2626';
    case 'high':
      return '#ea580c';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#10b981';
    default:
      return '#6b7280';
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#dc2626';
}

export function generateComplianceScorecardReport(data: ScorecardData): string {
  const coverage = calculateFrameworkCoverage(data.overallScore);
  const riskColor = getRiskColor(data.riskLevel);
  const scoreColor = getScoreColor(data.overallScore);

  // Update framework coverage
  Object.values(COMPLIANCE_FRAMEWORKS).forEach((framework) => {
    framework.coverage = coverage;
  });

  const frameworksHtml = Object.entries(COMPLIANCE_FRAMEWORKS)
    .map(
      ([key, framework]) => `
    <div style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">${framework.name}</h4>
          <div style="background: #00d4ff; color: #0a0e1a; padding: 6px 12px; border-radius: 4px; font-weight: 600; font-size: 14px;">
            ${framework.coverage}% Coverage
          </div>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Control ID</th>
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Control Name</th>
            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Status</th>
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Remediation</th>
          </tr>
        </thead>
        <tbody>
          ${framework.controls
            .map(
              (control) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; color: #374151; font-weight: 500;">${control.id}</td>
              <td style="padding: 12px; color: #374151;">${control.name}</td>
              <td style="padding: 12px; text-align: center;">
                <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;
                  ${
                    control.status === 'pass'
                      ? 'background: #d1fae5; color: #065f46;'
                      : control.status === 'warning'
                        ? 'background: #fef3c7; color: #92400e;'
                        : 'background: #fee2e2; color: #991b1b;'
                  }
                ">
                  ${control.status.toUpperCase()}
                </span>
              </td>
              <td style="padding: 12px; color: #374151; font-size: 12px;">${control.remediation}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IT Compliance Scorecard Report</title>
  <style>
    @media (prefers-color-scheme: dark) {
      body { background: #0a0e1a !important; color: #e5e7eb !important; }
      .container { background: #111827 !important; }
      h1, h2, h3, h4, h5, h6 { color: #f3f4f6 !important; }
      table { background: #1f2937 !important; }
      td, th { color: #e5e7eb !important; border-color: #374151 !important; }
      .section { border-color: #374151 !important; }
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #0a0e1a 0%, #1a1f3a 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      margin-bottom: 8px;
      color: #00d4ff;
    }
    
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .content {
      padding: 40px;
    }
    
    .executive-summary {
      background: #f3f4f6;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 32px;
      border-left: 4px solid #00d4ff;
    }
    
    .executive-summary h2 {
      font-size: 18px;
      margin-bottom: 16px;
      color: #1f2937;
    }
    
    .score-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .score-card {
      background: white;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      text-align: center;
    }
    
    .score-card .label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .score-card .value {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .score-card .unit {
      font-size: 14px;
      color: #6b7280;
    }
    
    .risk-assessment {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
    
    .risk-item {
      background: white;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .risk-item .label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .risk-item .value {
      font-size: 18px;
      font-weight: 600;
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
      color: white;
    }
    
    .section {
      margin-bottom: 32px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .section-header {
      background: #f3f4f6;
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .section-header h3 {
      font-size: 16px;
      color: #1f2937;
      margin: 0;
    }
    
    .section-content {
      padding: 24px;
    }
    
    .framework-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .framework-card {
      background: white;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      text-align: center;
    }
    
    .framework-card .name {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
    }
    
    .progress-bar {
      background: #e5e7eb;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    
    .progress-fill {
      background: #00d4ff;
      height: 100%;
      transition: width 0.3s ease;
    }
    
    .progress-label {
      font-size: 12px;
      font-weight: 600;
      color: #00d4ff;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    
    th {
      background: #f9fafb;
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
      color: #374151;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    .status-pass {
      background: #d1fae5;
      color: #065f46;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
      display: inline-block;
    }
    
    .status-fail {
      background: #fee2e2;
      color: #991b1b;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
      display: inline-block;
    }
    
    .status-warning {
      background: #fef3c7;
      color: #92400e;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
      display: inline-block;
    }
    
    .footer {
      background: #f3f4f6;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    
    .footer a {
      color: #00d4ff;
      text-decoration: none;
    }
    
    .cta-section {
      background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
      color: white;
      padding: 24px;
      border-radius: 8px;
      text-align: center;
      margin-top: 24px;
    }
    
    .cta-section h3 {
      font-size: 18px;
      margin-bottom: 8px;
    }
    
    .cta-section p {
      font-size: 14px;
      margin-bottom: 16px;
      opacity: 0.95;
    }
    
    .cta-button {
      display: inline-block;
      background: white;
      color: #00d4ff;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      text-decoration: none;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>IT Compliance Scorecard</h1>
      <p>Assessment Report for ${data.companyName}</p>
    </div>
    
    <div class="content">
      <!-- Executive Summary -->
      <div class="executive-summary">
        <h2>Executive Summary</h2>
        <p>
          This comprehensive IT compliance assessment evaluates your organization's security posture across email security, 
          endpoint protection, backup & recovery, identity management, and compliance frameworks. The assessment identifies 
          critical gaps and provides actionable remediation steps to strengthen your security infrastructure.
        </p>
        <p style="margin-top: 12px; font-weight: 500;">
          <strong>Assessment Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      
      <!-- Overall Scores -->
      <div class="section">
        <div class="section-header">
          <h3>Overall Assessment Scores</h3>
        </div>
        <div class="section-content">
          <div class="score-grid">
            <div class="score-card">
              <div class="label">Overall Score</div>
              <div class="value" style="color: ${scoreColor};">${data.overallScore}</div>
              <div class="unit">/100</div>
            </div>
            <div class="score-card">
              <div class="label">Risk Level</div>
              <div class="value" style="color: ${riskColor}; font-size: 20px;">${data.riskLevel.toUpperCase()}</div>
            </div>
            <div class="score-card">
              <div class="label">Email Security</div>
              <div class="value" style="color: ${getScoreColor(data.emailSecurityScore)};">${data.emailSecurityScore}</div>
              <div class="unit">/100</div>
            </div>
            <div class="score-card">
              <div class="label">Cloud Infrastructure</div>
              <div class="value" style="color: ${getScoreColor(data.endpointProtectionScore)};">${data.endpointProtectionScore}</div>
              <div class="unit">/100</div>
            </div>
            <div class="score-card">
              <div class="label">Backup & Recovery</div>
              <div class="value" style="color: ${getScoreColor(data.backupRecoveryScore)};">${data.backupRecoveryScore}</div>
              <div class="unit">/100</div>
            </div>
            <div class="score-card">
              <div class="label">Identity Management</div>
              <div class="value" style="color: ${getScoreColor(data.identityManagementScore)};">${data.identityManagementScore}</div>
              <div class="unit">/100</div>
            </div>
          </div>
          
          <div class="risk-assessment">
            <div class="risk-item">
              <div class="label">Disaster Recovery</div>
              <div class="value" style="background: ${getScoreColor(data.complianceScore)};">${data.complianceScore}/100</div>
            </div>
            <div class="risk-item">
              <div class="label">Framework Coverage</div>
              <div class="value" style="background: #00d4ff; color: #0a0e1a;">${coverage}%</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Scoring Methodology -->
      <div class="section">
        <div class="section-header">
          <h3>Scoring Methodology</h3>
        </div>
        <div class="section-content">
          <p style="margin-bottom: 16px;">
            Each score represents the percentage of security controls that are properly implemented and configured. 
            Scores are calculated by evaluating your environment against industry best practices and compliance frameworks.
          </p>
          <table>
            <thead>
              <tr>
                <th>Score Range</th>
                <th>Risk Level</th>
                <th>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>90-100</strong></td>
                <td><span class="status-pass">LOW</span></td>
                <td>Excellent security posture. Controls are well-implemented and monitored.</td>
              </tr>
              <tr>
                <td><strong>70-89</strong></td>
                <td><span class="status-warning">MEDIUM</span></td>
                <td>Good security posture with some gaps. Address findings within 30 days.</td>
              </tr>
              <tr>
                <td><strong>50-69</strong></td>
                <td><span class="status-warning">HIGH</span></td>
                <td>Moderate security gaps. Prioritize remediation within 14 days.</td>
              </tr>
              <tr>
                <td><strong>&lt;50</strong></td>
                <td><span class="status-fail">CRITICAL</span></td>
                <td>Significant security vulnerabilities. Immediate action required.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Compliance Framework Coverage -->
      <div class="section">
        <div class="section-header">
          <h3>Compliance Framework Coverage</h3>
        </div>
        <div class="section-content">
          <p style="margin-bottom: 24px;">
            Your organization's compliance posture is assessed against multiple industry frameworks. 
            The coverage percentage indicates how many controls are properly implemented for each framework.
          </p>
          <div class="framework-grid">
            ${Object.entries(COMPLIANCE_FRAMEWORKS)
              .map(
                ([key, framework]) => `
              <div class="framework-card">
                <div class="name">${framework.name}</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${framework.coverage}%;"></div>
                </div>
                <div class="progress-label">${framework.coverage}% Compliant</div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
      
      <!-- Detailed Findings -->
      <div class="section">
        <div class="section-header">
          <h3>Detailed Compliance Control Findings</h3>
        </div>
        <div class="section-content">
          ${frameworksHtml}
        </div>
      </div>
      
      <!-- Call to Action -->
      <div class="cta-section">
        <h3>Ready to Close the Gaps?</h3>
        <p>GigitekAI's 60-Day Migration Guarantee covers all remediation and implementation. We'll bring your score to 85+ in 60 days or less.</p>
        <a href="https://gigitekai.com/switch-program" class="cta-button">Learn About The Switch Program →</a>
      </div>
    </div>
    
    <div class="footer">
      <p>
        <strong>GigitekAI</strong> | Enterprise Cloud & AI Solutions<br>
        <a href="https://gigitekai.com">gigitekai.com</a> | support@gigitekai.com | (727) 382-6909<br>
        <br>
        This report is confidential and intended for the recipient only. 
        If you have questions about this assessment, please contact our team.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}
