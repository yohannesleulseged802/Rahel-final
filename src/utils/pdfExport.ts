import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SaleTransaction, StoreSettings } from '../types';
import { formatLocalDateTime } from './dateTime';

export interface PDFSummaryMetric {
  label: string;
  value: string;
}

export interface PDFReportConfig {
  filename: string;
  title: string;
  subtitle?: string;
  metaRight?: string;
  metrics?: PDFSummaryMetric[];
  headers: string[];
  rows: (string | number)[][];
  orientation?: 'portrait' | 'landscape';
}

/**
 * Generates and downloads a branded Obsidian & Gold executive PDF report.
 */
export function generateBrandedPDFReport(config: PDFReportConfig): void {
  const {
    filename,
    title,
    subtitle = 'Rahel Stationary & Print Services — Internal Records & Catalog',
    metaRight,
    metrics = [],
    headers,
    rows,
    orientation = 'landscape',
  } = config;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Top Obsidian Header Banner
  doc.setFillColor(15, 15, 18); // Obsidian #0f0f12
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold accent trim line
  doc.setFillColor(245, 158, 11); // Amber-500 #f59e0b
  doc.rect(0, 28, pageWidth, 1.2, 'F');

  // Brand Name & Report Title
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('RAHEL STATIONARY & PRINT SERVICES', 14, 9);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title, 14, 17);

  doc.setTextColor(180, 180, 190);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(subtitle, 14, 23.5);

  // Right-side Metadata & Timestamp
  const timestampStr = `Generated: ${new Date().toLocaleString()}`;
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  if (metaRight) {
    doc.text(metaRight, pageWidth - 14, 14, { align: 'right' });
  }
  doc.setTextColor(180, 180, 190);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(timestampStr, pageWidth - 14, 21, { align: 'right' });

  let currentY = 35;

  // 2. Executive KPI Summary Strip (if provided)
  if (metrics.length > 0) {
    const gap = 4;
    const totalAvailableWidth = pageWidth - 28;
    const cardWidth = (totalAvailableWidth - gap * (metrics.length - 1)) / metrics.length;
    const cardHeight = 16;

    metrics.forEach((m, idx) => {
      const x = 14 + idx * (cardWidth + gap);
      // Card background
      doc.setFillColor(248, 248, 250);
      doc.setDrawColor(220, 220, 226);
      doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'FD');

      // Label
      doc.setTextColor(100, 100, 110);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(m.label.toUpperCase(), x + 3.5, currentY + 5.5);

      // Value
      doc.setTextColor(20, 20, 25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(String(m.value), x + 3.5, currentY + 12.5);
    });

    currentY += cardHeight + 6;
  }

  // 3. Data Table via jspdf-autotable
  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [30, 30, 35],
      lineColor: [225, 225, 230],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [20, 20, 24],
      textColor: [245, 190, 60],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [249, 249, 252],
    },
    margin: { left: 14, right: 14, bottom: 16 },
    didDrawPage: () => {
      // Footer on each page
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(7.5);
      doc.setTextColor(130, 130, 140);
      doc.text(
        'Rahel Stationary & Print Services — Official Document',
        14,
        pageHeight - 7
      );
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth - 14,
        pageHeight - 7,
        { align: 'right' }
      );
    },
  });

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(cleanFilename);
}

/**
 * Generates an official, high-fidelity customer sales receipt PDF in Ethiopian Birr (ETB).
 * Supports standard thermal slip layout (80mm) or portable voucher.
 */
export function generateSaleReceiptPDF(tx: SaleTransaction, settings: StoreSettings): void {
  const isRoll = settings.receiptPaperSize === '80mm' || settings.receiptPaperSize === '58mm';
  const rollWidth = settings.receiptPaperSize === '58mm' ? 58 : 80;
  const estimatedHeight = Math.max(160, 110 + tx.items.length * 12);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isRoll ? [rollWidth, estimatedHeight] : 'a5',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header banner
  doc.setFillColor(15, 15, 18);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 22, pageWidth, 0.8, 'F');

  // Brand Name
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isRoll ? 9 : 11);
  doc.text((settings.storeName || 'RAHEL STATIONARY').toUpperCase(), pageWidth / 2, 8, { align: 'center' });

  doc.setTextColor(220, 220, 230);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isRoll ? 6.5 : 7.5);
  doc.text(settings.address || 'Addis Ababa, Ethiopia', pageWidth / 2, 13, { align: 'center' });
  doc.text(`Tel: ${settings.phone || '+251 911 382 749'}`, pageWidth / 2, 17.5, { align: 'center' });

  let y = 27;

  // Receipt Title & TIN
  doc.setTextColor(30, 30, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isRoll ? 8.5 : 10);
  doc.text(settings.receiptHeader || 'OFFICIAL SALES RECEIPT', pageWidth / 2, y, { align: 'center' });
  y += 5;

  if (settings.showTinOnReceipt && settings.tinNumber) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(isRoll ? 7 : 8);
    doc.setTextColor(80, 80, 90);
    doc.text(`TIN: ${settings.tinNumber}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
  }

  // Meta lines
  doc.setDrawColor(210, 210, 220);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(4, y, pageWidth - 4, y);
  doc.setLineDashPattern([], 0);
  y += 4;

  doc.setFontSize(isRoll ? 7 : 8);
  doc.setTextColor(70, 70, 80);
  doc.setFont('helvetica', 'normal');

  const dateStr = formatLocalDateTime(tx.timestamp);

  doc.text(`Receipt: ${tx.receiptNumber}`, 4, y);
  doc.text(dateStr, pageWidth - 4, y, { align: 'right' });
  y += 4;

  if (settings.showCashierOnReceipt) {
    doc.text(`Cashier: ${tx.cashierName}`, 4, y);
  }
  if (tx.customerName) {
    doc.text(`Client: ${tx.customerName}`, pageWidth - 4, y, { align: 'right' });
  }
  y += 5;

  // Items AutoTable
  const itemRows = tx.items.map(it => [
    it.name,
    it.quantity.toString(),
    `ETB ${it.unitPrice.toFixed(2)}`,
    `ETB ${(it.unitPrice * it.quantity).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Item Description', 'Qty', 'Price', 'Total']],
    body: itemRows,
    theme: 'plain',
    styles: {
      fontSize: isRoll ? 6.5 : 7.5,
      cellPadding: 1.5,
      textColor: [30, 30, 35],
    },
    headStyles: {
      fontStyle: 'bold',
      textColor: [20, 20, 25],
      fillColor: [240, 240, 245],
    },
    columnStyles: {
      0: { cellWidth: isRoll ? 34 : 50 },
      1: { halign: 'center', cellWidth: isRoll ? 10 : 15 },
      2: { halign: 'right', cellWidth: isRoll ? 16 : 25 },
      3: { halign: 'right', cellWidth: isRoll ? 16 : 25 },
    },
    margin: { left: 4, right: 4 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 3;

  doc.setDrawColor(210, 210, 220);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(4, finalY, pageWidth - 4, finalY);
  doc.setLineDashPattern([], 0);

  let curY = finalY + 4;
  doc.setFontSize(isRoll ? 7 : 8);
  doc.setTextColor(60, 60, 70);

  // Subtotal
  doc.text('Subtotal:', 4, curY);
  doc.text(`ETB ${tx.subtotal.toFixed(2)}`, pageWidth - 4, curY, { align: 'right' });
  curY += 4;

  if (tx.discountTotal > 0) {
    doc.text('Discount:', 4, curY);
    doc.text(`-ETB ${tx.discountTotal.toFixed(2)}`, pageWidth - 4, curY, { align: 'right' });
    curY += 4;
  }

  // Tax
  const effectiveTax = tx.taxRate !== undefined ? tx.taxRate : (settings.taxEnabled !== false ? (settings.taxRate ?? 0.15) : 0);
  const taxLabel = effectiveTax > 0 ? `VAT (${(effectiveTax * 100).toFixed(0)}%):` : 'VAT (Exempt):';
  doc.text(taxLabel, 4, curY);
  doc.text(`ETB ${tx.taxTotal.toFixed(2)}`, pageWidth - 4, curY, { align: 'right' });
  curY += 4.5;

  // Total
  doc.setDrawColor(20, 20, 25);
  doc.line(4, curY, pageWidth - 4, curY);
  curY += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isRoll ? 8.5 : 10);
  doc.setTextColor(15, 15, 20);
  doc.text('TOTAL PAID:', 4, curY);
  doc.text(`ETB ${tx.total.toFixed(2)}`, pageWidth - 4, curY, { align: 'right' });
  curY += 5;

  // Payment method
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isRoll ? 6.5 : 7.5);
  doc.setTextColor(90, 90, 100);
  doc.text(`Payment: ${tx.payment.method.toUpperCase()}`, 4, curY);
  curY += 6;

  // Footer note
  doc.setFontSize(isRoll ? 6 : 7);
  doc.setTextColor(100, 100, 110);
  const footerLines = doc.splitTextToSize(
    settings.receiptFooterMessage || 'Thank you for your business! Please visit again.',
    pageWidth - 8
  );
  doc.text(footerLines, pageWidth / 2, curY, { align: 'center' });

  const cleanFilename = `Receipt-${tx.receiptNumber}.pdf`;
  doc.save(cleanFilename);
}

