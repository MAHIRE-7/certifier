import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export interface CertificateData {
  recipientName: string;
  credentialTitle: string;
  eventOrAchievement: string;
  issuerOrganization: string;
  issuedAt: string;
  credentialId: string;
  verificationUrl: string;
  signerName?: string;
  signerTitle?: string;
  templateType?: 'modern_tech' | 'minimal_achievement';
}

/**
 * Generates a high-quality landscape A4 certificate PDF with embedded QR code.
 */
export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const template = data.templateType || 'modern_tech';
  const pdfDoc = await PDFDocument.create();

  // Landscape A4: 841.89 x 595.28
  const width = 841.89;
  const height = 595.28;
  const page = pdfDoc.addPage([width, height]);

  // Standard fonts
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTimesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Vector QR Code helper that does NOT require DOM canvas
  function drawQrCodeVector(
    targetPage: typeof page,
    text: string,
    x: number,
    y: number,
    size: number
  ) {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const moduleCount = qr.modules.size;
    const cellSize = size / moduleCount;

    // Draw white background
    targetPage.drawRectangle({
      x,
      y,
      width: size,
      height: size,
      color: rgb(1, 1, 1)
    });

    // Draw black square modules
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.modules.get(row, col)) {
          targetPage.drawRectangle({
            x: x + col * cellSize,
            y: y + (moduleCount - 1 - row) * cellSize,
            width: cellSize + 0.1,
            height: cellSize + 0.1,
            color: rgb(0, 0, 0)
          });
        }
      }
    }
  }

  if (template === 'modern_tech') {
    // --- Modern Tech Template ---
    // Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.98, 0.99, 1.0)
    });

    // Outer subtle border
    page.drawRectangle({
      x: 24,
      y: 24,
      width: width - 48,
      height: height - 48,
      borderColor: rgb(0.85, 0.9, 0.95),
      borderWidth: 1.5
    });

    // Inner tech border
    page.drawRectangle({
      x: 32,
      y: 32,
      width: width - 64,
      height: height - 64,
      borderColor: rgb(0.1, 0.3, 0.7),
      borderWidth: 2
    });

    // Top tech accent bar
    page.drawRectangle({
      x: 32,
      y: height - 42,
      width: width - 64,
      height: 10,
      color: rgb(0.15, 0.45, 0.95)
    });

    // Corner decorative accents
    page.drawRectangle({ x: 32, y: height - 64, width: 20, height: 4, color: rgb(0.05, 0.75, 0.75) });
    page.drawRectangle({ x: width - 52, y: height - 64, width: 20, height: 4, color: rgb(0.05, 0.75, 0.75) });

    // Issuer Organization Header
    const orgName = data.issuerOrganization.toUpperCase();
    const orgWidth = fontHelveticaBold.widthOfTextAtSize(orgName, 13);
    page.drawText(orgName, {
      x: (width - orgWidth) / 2,
      y: height - 85,
      size: 13,
      font: fontHelveticaBold,
      color: rgb(0.15, 0.45, 0.95)
    });

    // "CERTIFICATE OF RECOGNITION"
    const certTitle = (data.credentialTitle || 'CERTIFICATE OF ACHIEVEMENT').toUpperCase();
    const titleWidth = fontHelveticaBold.widthOfTextAtSize(certTitle, 26);
    page.drawText(certTitle, {
      x: (width - titleWidth) / 2,
      y: height - 125,
      size: 26,
      font: fontHelveticaBold,
      color: rgb(0.08, 0.12, 0.22)
    });

    // Subtitle
    const subText = 'THIS IS PROUDLY PRESENTED TO';
    const subWidth = fontHelvetica.widthOfTextAtSize(subText, 11);
    page.drawText(subText, {
      x: (width - subWidth) / 2,
      y: height - 165,
      size: 11,
      font: fontHelvetica,
      color: rgb(0.4, 0.45, 0.55)
    });

    // Recipient Name
    const name = data.recipientName;
    const nameWidth = fontHelveticaBold.widthOfTextAtSize(name, 32);
    page.drawText(name, {
      x: (width - nameWidth) / 2,
      y: height - 215,
      size: 32,
      font: fontHelveticaBold,
      color: rgb(0.05, 0.2, 0.5)
    });

    // Divider line under name
    page.drawLine({
      start: { x: (width - 400) / 2, y: height - 228 },
      end: { x: (width + 400) / 2, y: height - 228 },
      thickness: 1.5,
      color: rgb(0.15, 0.45, 0.95)
    });

    // Achievement description
    const descText = `for successfully participating in and completing`;
    const descWidth = fontHelvetica.widthOfTextAtSize(descText, 13);
    page.drawText(descText, {
      x: (width - descWidth) / 2,
      y: height - 260,
      size: 13,
      font: fontHelvetica,
      color: rgb(0.3, 0.35, 0.45)
    });

    // Event title
    const eventName = data.eventOrAchievement;
    const eventWidth = fontHelveticaBold.widthOfTextAtSize(eventName, 18);
    page.drawText(eventName, {
      x: (width - eventWidth) / 2,
      y: height - 295,
      size: 18,
      font: fontHelveticaBold,
      color: rgb(0.1, 0.15, 0.25)
    });

    // Footer section: Signer & Dates (Left), QR Code (Right)
    const issueDateStr = `Issued on: ${data.issuedAt.split('T')[0]}`;
    page.drawText(issueDateStr, {
      x: 75,
      y: 110,
      size: 11,
      font: fontHelvetica,
      color: rgb(0.3, 0.35, 0.45)
    });

    if (data.signerName) {
      page.drawLine({
        start: { x: 75, y: 155 },
        end: { x: 260, y: 155 },
        thickness: 1,
        color: rgb(0.6, 0.65, 0.7)
      });
      page.drawText(data.signerName, {
        x: 75,
        y: 140,
        size: 12,
        font: fontHelveticaBold,
        color: rgb(0.1, 0.15, 0.25)
      });
      if (data.signerTitle) {
        page.drawText(data.signerTitle, {
          x: 75,
          y: 125,
          size: 10,
          font: fontHelvetica,
          color: rgb(0.4, 0.45, 0.55)
        });
      }
    }

    // Credential ID Pill / Note
    const credIdText = `Credential ID: ${data.credentialId}`;
    page.drawText(credIdText, {
      x: 75,
      y: 80,
      size: 9,
      font: fontHelvetica,
      color: rgb(0.45, 0.5, 0.6)
    });

    // Cryptographic signature badge text
    page.drawText('Cryptographically Signed & Verifiable', {
      x: 75,
      y: 65,
      size: 9,
      font: fontHelveticaBold,
      color: rgb(0.05, 0.55, 0.4)
    });

    // QR Code on right
    const qrDim = 90;
    const qrX = width - 75 - qrDim;
    const qrY = 65;
    drawQrCodeVector(page, data.verificationUrl, qrX, qrY, qrDim);

    // Verification URL caption below QR
    const verifyNote = 'Scan to verify credential';
    const verifyNoteWidth = fontHelvetica.widthOfTextAtSize(verifyNote, 8);
    page.drawText(verifyNote, {
      x: qrX + (qrDim - verifyNoteWidth) / 2,
      y: qrY - 12,
      size: 8,
      font: fontHelvetica,
      color: rgb(0.3, 0.35, 0.45)
    });

  } else {
    // --- Minimal Professional Achievement Template ---
    // Background pure off-white
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.995, 0.995, 0.99)
    });

    // Classic double border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: rgb(0.2, 0.25, 0.35),
      borderWidth: 2
    });
    page.drawRectangle({
      x: 36,
      y: 36,
      width: width - 72,
      height: height - 72,
      borderColor: rgb(0.8, 0.75, 0.6),
      borderWidth: 1
    });

    // Organization Header
    const org = data.issuerOrganization;
    const orgW = fontTimesRoman.widthOfTextAtSize(org, 16);
    page.drawText(org, {
      x: (width - orgW) / 2,
      y: height - 90,
      size: 16,
      font: fontTimesRoman,
      color: rgb(0.35, 0.3, 0.25)
    });

    // Title
    const title = data.credentialTitle || 'Certificate of Excellence';
    const titleW = fontTimesRomanBold.widthOfTextAtSize(title, 28);
    page.drawText(title, {
      x: (width - titleW) / 2,
      y: height - 135,
      size: 28,
      font: fontTimesRomanBold,
      color: rgb(0.12, 0.15, 0.2)
    });

    // Recipient line
    const presText = 'This credential is awarded to';
    const presW = fontTimesRoman.widthOfTextAtSize(presText, 13);
    page.drawText(presText, {
      x: (width - presW) / 2,
      y: height - 180,
      size: 13,
      font: fontTimesRoman,
      color: rgb(0.45, 0.45, 0.45)
    });

    // Name
    const name = data.recipientName;
    const nameW = fontTimesRomanBold.widthOfTextAtSize(name, 34);
    page.drawText(name, {
      x: (width - nameW) / 2,
      y: height - 230,
      size: 34,
      font: fontTimesRomanBold,
      color: rgb(0.1, 0.15, 0.3)
    });

    // Gold accent divider
    page.drawLine({
      start: { x: (width - 320) / 2, y: height - 245 },
      end: { x: (width + 320) / 2, y: height - 245 },
      thickness: 1.5,
      color: rgb(0.75, 0.65, 0.35)
    });

    // Event/Achievement
    const eventText = `in recognition of outstanding achievement in ${data.eventOrAchievement}`;
    const eventW = fontTimesRoman.widthOfTextAtSize(eventText, 14);
    page.drawText(eventText, {
      x: (width - eventW) / 2,
      y: height - 280,
      size: 14,
      font: fontTimesRoman,
      color: rgb(0.25, 0.3, 0.35)
    });

    // Footer info
    page.drawText(`Issue Date: ${data.issuedAt.split('T')[0]}`, {
      x: 80,
      y: 110,
      size: 10,
      font: fontHelvetica,
      color: rgb(0.3, 0.3, 0.3)
    });
    page.drawText(`Credential ID: ${data.credentialId}`, {
      x: 80,
      y: 90,
      size: 9,
      font: fontHelvetica,
      color: rgb(0.4, 0.4, 0.4)
    });
    page.drawText(`Ed25519 Cryptographically Verifiable`, {
      x: 80,
      y: 72,
      size: 9,
      font: fontHelveticaBold,
      color: rgb(0.2, 0.5, 0.3)
    });

    // QR code on right
    const qrDim = 85;
    const qrX = width - 80 - qrDim;
    const qrY = 65;
    drawQrCodeVector(page, data.verificationUrl, qrX, qrY, qrDim);
    page.drawText('Scan to verify', {
      x: qrX + 16,
      y: qrY - 12,
      size: 8,
      font: fontHelvetica,
      color: rgb(0.4, 0.4, 0.4)
    });
  }

  return pdfDoc.save();
}
