export type CurrencyCode = 'VES' | 'USD' | 'EUR';

export interface ExchangeRate {
  currency: CurrencyCode;
  source: 'oficial' | 'paralelo' | 'custom';
  name: string;
  rate: number;
  updatedAt: string;
}

export interface RatesData {
  bcvUsd: ExchangeRate;
  bcvEur: ExchangeRate;
  paraleloUsd?: ExchangeRate;
  paraleloEur?: ExchangeRate;
  lastChecked: string;
  isCachedFallback?: boolean;
}

export interface TaxOptions {
  applyIva: boolean; // 16%
  applyIgtf: boolean; // 3% for foreign currency transactions
}

export interface TaxBreakdown {
  subtotal: number;
  ivaRate: number;
  ivaAmount: number;
  igtfRate: number;
  igtfAmount: number;
  total: number;
  currency: CurrencyCode;
  totalInVes: number;
  totalInUsd: number;
  totalInEur: number;
}

export interface ConversionResult {
  fromCurrency: CurrencyCode;
  fromAmount: number;
  ves: number;
  usd: number;
  eur: number;
}

export interface CalculationHistoryItem {
  id: string;
  timestamp: string;
  expression?: string;
  fromCurrency: CurrencyCode;
  amount: number;
  ves: number;
  usd: number;
  eur: number;
}

export interface ChangeResult {
  amountDue: number;
  amountPaid: number;
  paymentCurrency: CurrencyCode;
  changeInPaymentCurrency: number;
  changeInVes: number;
  changeInUsd: number;
  isShort: boolean;
  shortAmount: number;
}

export interface HistoricalRatePoint {
  date: string;
  displayDate: string;
  bcvUsd: number;
  bcvEur: number;
  paraleloUsd?: number;
  usdChangePct?: number;
}

export interface TrendMetrics {
  minUsd: number;
  maxUsd: number;
  startUsd: number;
  endUsd: number;
  changeUsd: number;
  changeUsdPct: number;
  minEur: number;
  maxEur: number;
  startEur: number;
  endEur: number;
  changeEur: number;
  changeEurPct: number;
}

