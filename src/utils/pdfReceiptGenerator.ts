import { jsPDF } from 'jspdf';
import { CurrencyCode, TaxBreakdown, RatesData } from '../types';
import { formatCurrency, formatRateNumber } from './calculator';

export interface ReceiptData {
  receiptNumber: string;
  date: string;
  time: string;
  clientName?: string;
  notes?: string;
  currency: CurrencyCode;
  subtotal: number;
  ivaRate: number;
  ivaAmount: number;
  igtfRate: number;
  igtfAmount: number;
  total: number;
  totalInVes: number;
  totalInUsd: number;
  totalInEur: number;
  bcvUsdRate: number;
  bcvEurRate: number;
  rateDate: string;
}

/**
 * Creates receipt data structure from current tax breakdown and active rates.
 */
export function buildReceiptData(
  breakdown: TaxBreakdown,
  rates: RatesData,
  clientName: string = 'Cliente General',
  notes: string = ''
): ReceiptData {
  const now = new Date();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const dateFormatted = now.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const receiptNumber = `BCV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}-${randomSuffix}`;

  return {
    receiptNumber,
    date: dateFormatted,
    time: timeFormatted,
    clientName,
    notes,
    currency: breakdown.currency,
    subtotal: breakdown.subtotal,
    ivaRate: breakdown.ivaRate,
    ivaAmount: breakdown.ivaAmount,
    igtfRate: breakdown.igtfRate,
    igtfAmount: breakdown.igtfAmount,
    total: breakdown.total,
    totalInVes: breakdown.totalInVes,
    totalInUsd: breakdown.totalInUsd,
    totalInEur: breakdown.totalInEur,
    bcvUsdRate: rates.bcvUsd.rate,
    bcvEurRate: rates.bcvEur.rate,
    rateDate: rates.bcvUsd.updatedAt ? rates.bcvUsd.updatedAt.slice(0, 10) : dateFormatted,
  };
}

/**
 * Generates and triggers download of a PDF receipt document.
 */
export function exportReceiptPdf(data: ReceiptData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // --- Header Banner ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Decorative emerald line
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 36, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COMPROBANTE DE COTIZACIÓN & ESTIMACIÓN', margin, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Calculadora y Conversor de Divisas • Tasas Oficiales BCV', margin, 23);
  doc.text(`N° Comprobante: ${data.receiptNumber}`, margin, 30);

  // Date and Time (Top Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Fecha: ${data.date}`, pageWidth - margin, 20, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Hora: ${data.time}`, pageWidth - margin, 27, { align: 'right' });

  // --- BCV Exchange Rate Banner ---
  let y = 46;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('TASAS OFICIALES BANCO CENTRAL DE VENEZUELA (BCV) APLICADAS', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `• Tasa Dólar BCV (USD): ${formatRateNumber(data.bcvUsdRate, 4)} Bs. / USD`,
    margin + 4,
    y + 12
  );
  doc.text(
    `• Tasa Euro BCV (EUR): ${formatRateNumber(data.bcvEurRate, 4)} Bs. / EUR`,
    margin + 4,
    y + 17
  );

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha valor tasa: ${data.rateDate}`, pageWidth - margin - 4, y + 14, { align: 'right' });

  // --- Client & Info Section ---
  y = 74;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('DATOS DE LA ESTIMACIÓN', margin, y);

  y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Cliente / Destinatario: ${data.clientName || 'Consumidor Final'}`, margin, y);

  if (data.notes) {
    y += 5;
    doc.text(`Observaciones: ${data.notes}`, margin, y);
  }

  // --- Breakdown Table ---
  y += 10;
  // Table Header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DESCRIPCIÓN / CONCEPTO FISCAL', margin + 4, y + 5.5);
  doc.text('PORCENTAJE', margin + 110, y + 5.5);
  doc.text(`MONTO (${data.currency})`, pageWidth - margin - 4, y + 5.5, { align: 'right' });

  y += 8;
  const drawRow = (
    label: string,
    percentage: string,
    amountStr: string,
    isStripe: boolean = false
  ) => {
    if (isStripe) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 8, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 8, pageWidth - margin, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(label, margin + 4, y + 5.5);
    doc.text(percentage, margin + 110, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(amountStr, pageWidth - margin - 4, y + 5.5, { align: 'right' });
    y += 8;
  };

  drawRow('Subtotal Base Imponible', '---', formatCurrency(data.subtotal, data.currency), false);

  if (data.ivaRate > 0) {
    drawRow(
      'IVA General (Ley Impuesto al Valor Agregado)',
      '16.00%',
      `+ ${formatCurrency(data.ivaAmount, data.currency)}`,
      true
    );
  }

  if (data.igtfRate > 0) {
    drawRow(
      'IGTF en Moneda Extranjera (Gaceta Oficial)',
      '3.00%',
      `+ ${formatCurrency(data.igtfAmount, data.currency)}`,
      data.ivaRate === 0
    );
  }

  // --- Subtotals & Totals Box ---
  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 70, y, contentWidth - 70, 28, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + 70, y, contentWidth - 70, 28, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total en ${data.currency}:`, margin + 74, y + 7);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(data.total, data.currency), pageWidth - margin - 4, y + 7, {
    align: 'right',
  });

  // Big Highlighted Row: Total in Bolívares (VES)
  y += 11;
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(margin + 72, y, contentWidth - 74, 13, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL EN BOLÍVARES (VES):', margin + 76, y + 8.5);
  doc.setFontSize(11);
  doc.text(formatCurrency(data.totalInVes, 'VES'), pageWidth - margin - 6, y + 8.5, {
    align: 'right',
  });

  // Cross conversion in Euro/USD if needed
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  if (data.currency === 'USD') {
    doc.text(
      `Equivalente en Euros al cambio oficial BCV: ${formatCurrency(data.totalInEur, 'EUR')}`,
      margin,
      y
    );
  } else if (data.currency === 'EUR') {
    doc.text(
      `Equivalente en Dólares al cambio oficial BCV: ${formatCurrency(data.totalInUsd, 'USD')}`,
      margin,
      y
    );
  } else {
    doc.text(
      `Equivalente en Dólares: ${formatCurrency(data.totalInUsd, 'USD')} | en Euros: ${formatCurrency(
        data.totalInEur,
        'EUR'
      )}`,
      margin,
      y
    );
  }

  // --- Payment methods hint box (Pago Móvil, Transferencia, Efectivo) ---
  y += 8;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('FORMAS DE PAGO SUGERIDAS EN VENEZUELA:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    '• Pago Móvil / Punto de Venta: Pagar exactamente el total en Bolívares (VES)',
    margin + 4,
    y + 11
  );
  doc.text(
    `• Divisas en Efectivo: ${formatCurrency(data.total, data.currency)} (vuelto en Bs. a tasa BCV)`,
    margin + 4,
    y + 16
  );

  // --- Legal / Regulatory Footer ---
  const footerY = 270;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const disclaimer =
    'Nota legal: Este documento es un comprobante de cotización y estimación comercial expedido con fines informativos. Los cálculos se efectúan tomando como base las tasas oficiales del Banco Central de Venezuela (BCV) y las alícuotas vigentes de IVA (16%) e IGTF (3%) estipuladas por la legislación tributaria venezolana.';
  const splitDisclaimer = doc.splitTextToSize(disclaimer, contentWidth);
  doc.text(splitDisclaimer, margin, footerY);

  return doc;
}
