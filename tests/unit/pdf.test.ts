import { describe, it, expect } from 'vitest';
import { generateCertificatePdf } from '@certifier/pdf';
import { PDFDocument } from 'pdf-lib';

describe('Server-side PDF Certificate Generation', () => {
  it('generates a modern tech certificate PDF with embedded QR code', async () => {
    const pdfBytes = await generateCertificatePdf({
      recipientName: 'Dr. Jane Hopper',
      credentialTitle: 'Certified Cloud Security Architect',
      eventOrAchievement: 'Advanced Cloud Security Summit 2026',
      issuerOrganization: 'OpenTech Foundation',
      issuedAt: '2026-03-15T12:00:00.000Z',
      credentialId: 'cred_test_pdf_01',
      verificationUrl: 'https://certifier.platform.test/verify/cred_test_pdf_01',
      signerName: 'Alex Rivera',
      signerTitle: 'Head of Certification',
      templateType: 'modern_tech'
    });

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    // Verify it is a valid PDF by loading it back with pdf-lib
    const loadedDoc = await PDFDocument.load(pdfBytes);
    expect(loadedDoc.getPageCount()).toBe(1);
    const page = loadedDoc.getPage(0);
    // Landscape A4 dimensions: 841.89 x 595.28
    const { width, height } = page.getSize();
    expect(Math.round(width)).toBe(842);
    expect(Math.round(height)).toBe(595);
  });

  it('generates a minimal professional achievement certificate PDF', async () => {
    const pdfBytes = await generateCertificatePdf({
      recipientName: 'Robert Vance',
      credentialTitle: 'Executive Excellence Award',
      eventOrAchievement: 'Enterprise Systems Modernization',
      issuerOrganization: 'OpenTech Foundation',
      issuedAt: '2026-03-15T12:00:00.000Z',
      credentialId: 'cred_test_pdf_02',
      verificationUrl: 'https://certifier.platform.test/verify/cred_test_pdf_02',
      templateType: 'minimal_achievement'
    });

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    const loadedDoc = await PDFDocument.load(pdfBytes);
    expect(loadedDoc.getPageCount()).toBe(1);
  });
});
