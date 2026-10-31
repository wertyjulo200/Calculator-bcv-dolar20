import { CurrencyCode, ConversionResult, TaxOptions, TaxBreakdown, ChangeResult } from '../types';

/**
 * Converts an amount from one currency to another using the provided BCV rates.
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: { bcvUsd: number; bcvEur: number }
): number {
  if (isNaN(amount) || amount === 0) return 0;
  if (from === to) return amount;

  const bcvUsd = rates.bcvUsd > 0 ? rates.bcvUsd : 1;
  const bcvEur = rates.bcvEur > 0 ? rates.bcvEur : 1;

  // Step 1: Normalize to VES
  let amountInVes = 0;
  switch (from) {
    case 'VES':
      amountInVes = amount;
      break;
    case 'USD':
      amountInVes = amount * bcvUsd;
      break;
    case 'EUR':
      amountInVes = amount * bcvEur;
      break;
  }

  // Step 2: Convert from VES to target currency
  switch (to) {
    case 'VES':
      return amountInVes;
    case 'USD':
      return amountInVes / bcvUsd;
    case 'EUR':
      return amountInVes / bcvEur;
  }
}

/**
 * Calculates conversion across all three supported currencies simultaneously.
 */
export function calculateAllConversions(
  amount: number,
  from: CurrencyCode,
  rates: { bcvUsd: number; bcvEur: number }
): ConversionResult {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return {
    fromCurrency: from,
    fromAmount: safeAmount,
    ves: convertCurrency(safeAmount, from, 'VES', rates),
    usd: convertCurrency(safeAmount, from, 'USD', rates),
    eur: convertCurrency(safeAmount, from, 'EUR', rates),
  };
}

/**
 * Formats currency values according to standard conventions:
 * VES: "Bs. 889,25" (comma for decimals, dot for thousands in Venezuela)
 * USD: "$ 100.00"
 * EUR: "€ 100,00"
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  decimals: number = 2
): string {
  if (isNaN(amount)) return '0,00';

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (currency === 'VES') {
    // Format in Venezuelan standard: 1.234.567,89
    const parts = absAmount.toFixed(decimals).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1] || '00';
    return `${sign}Bs. ${integerPart},${decimalPart}`;
  } else if (currency === 'EUR') {
    const parts = absAmount.toFixed(decimals).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1] || '00';
    return `${sign}€ ${integerPart},${decimalPart}`;
  } else {
    // USD standard: $ 1,234.56
    const parts = absAmount.toFixed(decimals).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decimalPart = parts[1] || '00';
    return `${sign}$ ${integerPart}.${decimalPart}`;
  }
}

/**
 * Formats exchange rate display (e.g. 889.2553 -> "889,26 Bs.")
 */
export function formatRateNumber(rate: number, decimals: number = 2): string {
  if (isNaN(rate)) return '0,00';
  const parts = rate.toFixed(decimals).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1] || '00';
  return `${integerPart},${decimalPart}`;
}

/**
 * Calculates Venezuelan commercial taxes:
 * - IVA (standard 16%)
 * - IGTF (standard 3% on payments in foreign currency)
 */
export function calculateTaxes(
  subtotal: number,
  currency: CurrencyCode,
  options: TaxOptions,
  rates: { bcvUsd: number; bcvEur: number }
): TaxBreakdown {
  const safeSubtotal = Math.max(0, isNaN(subtotal) ? 0 : subtotal);
  const ivaRate = options.applyIva ? 0.16 : 0;
  const ivaAmount = safeSubtotal * ivaRate;

  // IGTF 3% applies to transactions in foreign currency (USD/EUR) or foreign currency equivalents
  const isForeign = currency === 'USD' || currency === 'EUR';
  const igtfRate = (options.applyIgtf && isForeign) ? 0.03 : 0;
  const igtfAmount = (safeSubtotal + ivaAmount) * igtfRate;

  const total = safeSubtotal + ivaAmount + igtfAmount;

  const totalInVes = convertCurrency(total, currency, 'VES', rates);
  const totalInUsd = convertCurrency(total, currency, 'USD', rates);
  const totalInEur = convertCurrency(total, currency, 'EUR', rates);

  return {
    subtotal: safeSubtotal,
    ivaRate,
    ivaAmount,
    igtfRate,
    igtfAmount,
    total,
    currency,
    totalInVes,
    totalInUsd,
    totalInEur,
  };
}

/**
 * Calculates cash change (vuelto) when a customer pays in USD or EUR or VES.
 */
export function calculateChange(
  amountDue: number,
  amountPaid: number,
  paymentCurrency: CurrencyCode,
  dueCurrency: CurrencyCode,
  rates: { bcvUsd: number; bcvEur: number }
): ChangeResult {
  // Convert amount due to payment currency
  const dueInPaymentCurrency = convertCurrency(amountDue, dueCurrency, paymentCurrency, rates);
  const diff = amountPaid - dueInPaymentCurrency;

  const isShort = diff < -0.001;
  const changeInPaymentCurrency = Math.max(0, diff);

  return {
    amountDue,
    amountPaid,
    paymentCurrency,
    changeInPaymentCurrency,
    changeInVes: convertCurrency(changeInPaymentCurrency, paymentCurrency, 'VES', rates),
    changeInUsd: convertCurrency(changeInPaymentCurrency, paymentCurrency, 'USD', rates),
    isShort,
    shortAmount: isShort ? Math.abs(diff) : 0,
  };
}

/**
 * Calculates the spread and difference between official and parallel rate.
 */
export function calculateSpread(officialRate: number, parallelRate: number): {
  diff: number;
  percentage: number;
} {
  if (officialRate <= 0 || parallelRate <= 0) {
    return { diff: 0, percentage: 0 };
  }
  const diff = parallelRate - officialRate;
  const percentage = (diff / officialRate) * 100;
  return { diff, percentage };
}

/**
 * Safe expression evaluation for the in-app calculator without using eval().
 * Supports numbers, +, -, *, /, %, parentheses.
 */
export function evaluateExpression(expr: string): { result: number; error: string | null } {
  const sanitized = expr.replace(/\s+/g, '').replace(/,/g, '.').replace(/×/g, '*').replace(/÷/g, '/');
  if (!sanitized) {
    return { result: 0, error: null };
  }

  // Check valid characters
  if (!/^[0-9+\-*/.()%]+$/.test(sanitized)) {
    return { result: 0, error: 'Caracteres no válidos' };
  }

  try {
    // Tokenizer
    const tokens: string[] = [];
    let current = '';

    for (let i = 0; i < sanitized.length; i++) {
      const char = sanitized[i];
      if ('+-*/()%'.includes(char)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        tokens.push(char);
      } else {
        current += char;
      }
    }
    if (current) tokens.push(current);

    // Handle percentage: e.g., 50 + 10% => 50 + (50 * 0.1) or 100 * 15% => 100 * 0.15
    const processedTokens: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === '%') {
        const prev = processedTokens[processedTokens.length - 1];
        if (prev && !isNaN(Number(prev))) {
          // Check if preceded by an operator and an earlier base operand: e.g. [50, '+', 10, '%']
          if (processedTokens.length >= 3) {
            const op = processedTokens[processedTokens.length - 2];
            const base = processedTokens[processedTokens.length - 3];
            if (['+', '-'].includes(op) && !isNaN(Number(base))) {
              const pctVal = (Number(base) * Number(prev)) / 100;
              processedTokens[processedTokens.length - 1] = String(pctVal);
              continue;
            }
          }
          // Default percentage: just divide by 100
          processedTokens[processedTokens.length - 1] = String(Number(prev) / 100);
        }
      } else {
        processedTokens.push(tokens[i]);
      }
    }

    // Shunting-yard algorithm to RPN
    const outputQueue: string[] = [];
    const opStack: string[] = [];
    const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

    for (let i = 0; i < processedTokens.length; i++) {
      const token = processedTokens[i];
      if (!isNaN(Number(token))) {
        outputQueue.push(token);
      } else if (token in precedence) {
        // Handle unary minus if at start or after another operator / '('
        if (token === '-' && (i === 0 || ['+', '-', '*', '/', '('].includes(processedTokens[i - 1]))) {
          // Next token is negated
          if (i + 1 < processedTokens.length && !isNaN(Number(processedTokens[i + 1]))) {
            processedTokens[i + 1] = String(-Number(processedTokens[i + 1]));
            continue;
          }
        }

        while (
          opStack.length > 0 &&
          opStack[opStack.length - 1] !== '(' &&
          precedence[opStack[opStack.length - 1]] >= precedence[token]
        ) {
          outputQueue.push(opStack.pop()!);
        }
        opStack.push(token);
      } else if (token === '(') {
        opStack.push(token);
      } else if (token === ')') {
        while (opStack.length > 0 && opStack[opStack.length - 1] !== '(') {
          outputQueue.push(opStack.pop()!);
        }
        if (opStack.length > 0 && opStack[opStack.length - 1] === '(') {
          opStack.pop();
        }
      }
    }

    while (opStack.length > 0) {
      outputQueue.push(opStack.pop()!);
    }

    // Evaluate RPN
    const evalStack: number[] = [];
    for (const token of outputQueue) {
      if (!isNaN(Number(token))) {
        evalStack.push(Number(token));
      } else if (token in precedence) {
        if (evalStack.length < 2) return { result: 0, error: 'Expresión incompleta' };
        const b = evalStack.pop()!;
        const a = evalStack.pop()!;
        switch (token) {
          case '+': evalStack.push(a + b); break;
          case '-': evalStack.push(a - b); break;
          case '*': evalStack.push(a * b); break;
          case '/':
            if (b === 0) return { result: 0, error: 'División por cero' };
            evalStack.push(a / b);
            break;
        }
      }
    }

    if (evalStack.length === 1 && !isNaN(evalStack[0])) {
      return { result: evalStack[0], error: null };
    }
    return { result: 0, error: 'Expresión no válida' };
  } catch (err) {
    return { result: 0, error: 'Error en el cálculo' };
  }
}
