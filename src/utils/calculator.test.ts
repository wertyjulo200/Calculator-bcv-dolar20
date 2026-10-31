import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertCurrency,
  calculateAllConversions,
  formatCurrency,
  formatRateNumber,
  calculateTaxes,
  calculateChange,
  calculateSpread,
  evaluateExpression,
} from './calculator';

const mockRates = {
  bcvUsd: 889.2553,
  bcvEur: 992.800187,
};

test('convertCurrency: USD to VES at BCV rate', () => {
  const result = convertCurrency(10, 'USD', 'VES', mockRates);
  assert.equal(Math.round(result * 100) / 100, 8892.55);
});

test('convertCurrency: EUR to VES at BCV rate', () => {
  const result = convertCurrency(10, 'EUR', 'VES', mockRates);
  assert.equal(Math.round(result * 100) / 100, 9928.00);
});

test('convertCurrency: VES to USD at BCV rate', () => {
  const result = convertCurrency(889.2553, 'VES', 'USD', mockRates);
  assert.equal(Math.round(result * 100) / 100, 1.00);
});

test('convertCurrency: USD to EUR cross conversion', () => {
  // 100 USD = 88925.53 VES -> in EUR: 88925.53 / 992.800187 = 89.57
  const result = convertCurrency(100, 'USD', 'EUR', mockRates);
  assert.equal(Math.round(result * 100) / 100, 89.57);
});

test('convertCurrency: same currency returns original amount', () => {
  assert.equal(convertCurrency(50, 'USD', 'USD', mockRates), 50);
  assert.equal(convertCurrency(100, 'VES', 'VES', mockRates), 100);
});

test('calculateAllConversions returns accurate breakdown for base USD', () => {
  const conv = calculateAllConversions(20, 'USD', mockRates);
  assert.equal(conv.usd, 20);
  assert.equal(Math.round(conv.ves * 100) / 100, 17785.11);
  assert.equal(Math.round(conv.eur * 100) / 100, 17.91);
});

test('formatCurrency formats VES with Bs. and comma decimal', () => {
  const formatted = formatCurrency(1234.56, 'VES');
  assert.equal(formatted, 'Bs. 1.234,56');
});

test('formatCurrency formats USD with $ and point decimal', () => {
  const formatted = formatCurrency(1234.56, 'USD');
  assert.equal(formatted, '$ 1,234.56');
});

test('formatRateNumber formats rate without symbol', () => {
  assert.equal(formatRateNumber(889.2553, 2), '889,26');
});

test('calculateTaxes: IVA (16%) and IGTF (3%) calculation for USD purchase', () => {
  const taxes = calculateTaxes(100, 'USD', { applyIva: true, applyIgtf: true }, mockRates);
  // Subtotal: 100
  // IVA 16%: 16
  // Base for IGTF: 100 + 16 = 116
  // IGTF 3%: 116 * 0.03 = 3.48
  // Total: 119.48
  assert.equal(taxes.subtotal, 100);
  assert.equal(taxes.ivaAmount, 16);
  assert.equal(Math.round(taxes.igtfAmount * 100) / 100, 3.48);
  assert.equal(Math.round(taxes.total * 100) / 100, 119.48);
});

test('calculateTaxes: IGTF does not apply when paying in VES', () => {
  const taxes = calculateTaxes(1000, 'VES', { applyIva: true, applyIgtf: true }, mockRates);
  assert.equal(taxes.ivaAmount, 160);
  assert.equal(taxes.igtfAmount, 0); // IGTF is for foreign currency payments
  assert.equal(taxes.total, 1160);
});

test('calculateChange calculates exact vuelto in USD and VES', () => {
  // Amount due: 15 USD. Paid with 20 USD note.
  const change = calculateChange(15, 20, 'USD', 'USD', mockRates);
  assert.equal(change.isShort, false);
  assert.equal(change.changeInPaymentCurrency, 5);
  assert.equal(Math.round(change.changeInVes * 100) / 100, 4446.28);
});

test('calculateChange detects short payment (insufficient cash)', () => {
  const change = calculateChange(25, 20, 'USD', 'USD', mockRates);
  assert.equal(change.isShort, true);
  assert.equal(change.shortAmount, 5);
});

test('calculateSpread computes difference and gap percentage', () => {
  const spread = calculateSpread(889.25, 993.64);
  assert.equal(Math.round(spread.diff * 100) / 100, 104.39);
  assert.equal(Math.round(spread.percentage * 10) / 10, 11.7);
});

test('evaluateExpression handles basic arithmetic', () => {
  assert.equal(evaluateExpression('15 + 25').result, 40);
  assert.equal(evaluateExpression('10 * 3.5').result, 35);
  assert.equal(evaluateExpression('100 / 4').result, 25);
  assert.equal(evaluateExpression('50 - 12.5').result, 37.5);
});

test('evaluateExpression handles operator precedence', () => {
  assert.equal(evaluateExpression('10 + 5 * 2').result, 20);
  assert.equal(evaluateExpression('(10 + 5) * 2').result, 30);
});

test('evaluateExpression handles percentage additions', () => {
  // 50 + 10% = 55
  assert.equal(evaluateExpression('50 + 10%').result, 55);
});

test('evaluateExpression handles division by zero safely', () => {
  const res = evaluateExpression('50 / 0');
  assert.equal(res.error, 'División por cero');
});
