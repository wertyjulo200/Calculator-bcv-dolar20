import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReceiptData, exportReceiptPdf } from './pdfReceiptGenerator';
import { RatesData, TaxBreakdown } from '../types';

const mockRates: RatesData = {
  bcvUsd: {
    currency: 'USD',
    source: 'oficial',
    name: 'Dólar BCV',
    rate: 889.2553,
    updatedAt: '2026-10-30T00:00:00',
  },
  bcvEur: {
    currency: 'EUR',
    source: 'oficial',
    name: 'Euro BCV',
    rate: 992.8002,
    updatedAt: '2026-10-30T00:00:00',
  },
  lastChecked: '2026-10-30T00:00:00',
};

const mockTaxBreakdown: TaxBreakdown = {
  subtotal: 100,
  ivaRate: 0.16,
  ivaAmount: 16,
  igtfRate: 0.03,
  igtfAmount: 3.48,
  total: 119.48,
  currency: 'USD',
  totalInVes: 106248.22,
  totalInUsd: 119.48,
  totalInEur: 107.01,
};

test('buildReceiptData constructs valid metadata and totals', () => {
  const receipt = buildReceiptData(mockTaxBreakdown, mockRates, 'Empresa Ejemplo C.A.', 'Pago de servicios');
  assert.ok(receipt.receiptNumber.startsWith('BCV-'));
  assert.equal(receipt.clientName, 'Empresa Ejemplo C.A.');
  assert.equal(receipt.notes, 'Pago de servicios');
  assert.equal(receipt.total, 119.48);
  assert.equal(receipt.bcvUsdRate, 889.2553);
  assert.equal(receipt.bcvEurRate, 992.8002);
});

test('exportReceiptPdf creates valid jsPDF instance with expected dimensions', () => {
  const receipt = buildReceiptData(mockTaxBreakdown, mockRates);
  const pdfDoc = exportReceiptPdf(receipt);
  assert.ok(pdfDoc);
  assert.equal(Math.round(pdfDoc.internal.pageSize.getWidth()), 210);
  assert.equal(Math.round(pdfDoc.internal.pageSize.getHeight()), 297);
});
