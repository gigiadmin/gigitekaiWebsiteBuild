import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import { storagePut } from '../storage';

interface ReportData {
  domain: string;
  timestamp: string;
  overallScore: number;
  status: 'PASS' | 'WARNING' | 'FAIL';
  tools: any;
}

export async function generateEmailDiagnosticsReport(data: ReportData, userId: number): Promise<{ url: string; fileName: string }> {
  try {
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();

    // Define colors
    const darkBg = rgb(10 / 255, 14 / 255, 26 / 255); // #0A0E1A
    const cyan = rgb(0, 212 / 255, 255 / 255); // #00D4FF
    const white = rgb(1, 1, 1);
    const gray = rgb(148 / 255, 163 / 255, 184 / 255); // #94A3B8
    const green = rgb(34 / 255, 197 / 255, 94 / 255); // #22C55E
    const yellow = rgb(234 / 255, 179 / 255, 8 / 255); // #EAB308
    const red = rgb(239 / 255, 68 / 255, 68 / 255); // #EF4444

    // Helper function to draw text
    const drawText = (
      text: string,
      x: number,
      y: number,
      size: number,
      color: any = white,
      bold: boolean = false
    ) => {
      page.drawText(text, {
        x,
        y,
        size,
        color,
        font: bold ? undefined : undefined,
      });
    };

    // Header
    drawText('Email Diagnostics Report', 50, height - 50, 24, cyan, true);
    drawText(`Domain: ${data.domain}`, 50, height - 80, 12, gray);
    drawText(`Generated: ${new Date(data.timestamp).toLocaleString()}`, 50, height - 100, 12, gray);

    // Overall Score Section
    let yPosition = height - 140;
    drawText('Overall Assessment', 50, yPosition, 16, cyan, true);
    yPosition -= 30;

    const statusColor =
      data.status === 'PASS' ? green : data.status === 'WARNING' ? yellow : red;
    drawText(`Status: ${data.status}`, 50, yPosition, 14, statusColor, true);
    drawText(`Score: ${data.overallScore}/100`, 50, yPosition - 25, 14, statusColor, true);

    // Tools Results
    yPosition -= 70;
    drawText('Detailed Analysis', 50, yPosition, 16, cyan, true);
    yPosition -= 30;

    // SPF
    const spfStatus = data.tools.dkimSpfDmarc?.spf?.status === 'FOUND' ? '✓ PASS' : '✗ FAIL';
    const spfColor = data.tools.dkimSpfDmarc?.spf?.status === 'FOUND' ? green : red;
    drawText(`SPF Record: ${spfStatus}`, 50, yPosition, 12, spfColor);
    if (data.tools.dkimSpfDmarc?.spf?.record) {
      drawText(`  ${data.tools.dkimSpfDmarc.spf.record.substring(0, 60)}...`, 50, yPosition - 15, 10, gray);
      yPosition -= 15;
    }
    yPosition -= 20;

    // DKIM
    const dkimStatus = data.tools.dkimSpfDmarc?.dkim?.records?.length > 0 ? '✓ PASS' : '✗ FAIL';
    const dkimColor = data.tools.dkimSpfDmarc?.dkim?.records?.length > 0 ? green : red;
    drawText(`DKIM Records: ${dkimStatus} (${data.tools.dkimSpfDmarc?.dkim?.records?.length || 0} found)`, 50, yPosition, 12, dkimColor);
    yPosition -= 20;

    // DMARC
    const dmarcStatus = data.tools.dkimSpfDmarc?.dmarc?.status === 'FOUND' ? '✓ PASS' : '✗ FAIL';
    const dmarcColor = data.tools.dkimSpfDmarc?.dmarc?.status === 'FOUND' ? green : yellow;
    drawText(`DMARC Policy: ${dmarcStatus}`, 50, yPosition, 12, dmarcColor);
    yPosition -= 20;

    // MX Records
    const mxStatus = data.tools.mxRecords?.redundancy === 'MULTIPLE' ? '✓ PASS' : '⚠ WARNING';
    const mxColor = data.tools.mxRecords?.redundancy === 'MULTIPLE' ? green : yellow;
    drawText(`MX Records: ${mxStatus} (${data.tools.mxRecords?.mxRecords?.length || 0} servers)`, 50, yPosition, 12, mxColor);
    yPosition -= 20;

    // Deliverability
    const delivStatus = data.tools.deliverability?.blacklistStatus === 'CLEAN' ? '✓ CLEAN' : '✗ LISTED';
    const delivColor = data.tools.deliverability?.blacklistStatus === 'CLEAN' ? green : red;
    drawText(`Blacklist Status: ${delivStatus}`, 50, yPosition, 12, delivColor);
    yPosition -= 20;

    // Bounce Rate
    const bounceStatus = (data.tools.bounceRate?.bounceRate || 0) <= 5 ? '✓ NORMAL' : '✗ HIGH';
    const bounceColor = (data.tools.bounceRate?.bounceRate || 0) <= 5 ? green : red;
    drawText(`Bounce Rate: ${bounceStatus} (${data.tools.bounceRate?.bounceRate || 0}%)`, 50, yPosition, 12, bounceColor);
    yPosition -= 20;

    // TLS Support
    const tlsStatus = data.tools.sslTls?.tlsSupport?.length > 0 ? '✓ SUPPORTED' : '✗ NOT FOUND';
    const tlsColor = data.tools.sslTls?.tlsSupport?.length > 0 ? green : yellow;
    drawText(`TLS/SSL: ${tlsStatus}`, 50, yPosition, 12, tlsColor);

    // Footer
    drawText('GigitekAI Email Diagnostics Suite', 50, 30, 10, gray);
    drawText('https://gigitekai.com', width - 150, 30, 10, cyan);

    // Save PDF to buffer
    const pdfBytes = await pdfDoc.save();

    // Upload to S3
    const fileName = `email-diagnostics-${data.domain}-${Date.now()}.pdf`;
    const { url } = await storagePut(`email-diagnostics/${userId}/${fileName}`, pdfBytes, 'application/pdf');

    return { url, fileName };
  } catch (error) {
    console.error('[Report Generator] Failed to generate PDF:', error);
    throw error;
  }
}

export async function generateEmailReport(
  data: ReportData,
  userId: number,
  recipientEmails: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    // Generate PDF
    const { url, fileName } = await generateEmailDiagnosticsReport(data, userId);

    // In production, would send email with PDF attachment
    // For now, just return success
    console.log(`[Report Generator] Report generated: ${fileName}`);
    console.log(`[Report Generator] Recipients: ${recipientEmails.join(', ')}`);
    console.log(`[Report Generator] URL: ${url}`);

    return {
      success: true,
      message: `Report generated and ready to send to ${recipientEmails.length} recipient(s)`,
    };
  } catch (error) {
    console.error('[Report Generator] Failed to generate email report:', error);
    return {
      success: false,
      message: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
