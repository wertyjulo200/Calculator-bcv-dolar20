import React, { useState, useEffect } from 'react';
import { CurrencyCode, RatesData, CalculationHistoryItem } from '../types';
import {
  calculateAllConversions,
  formatCurrency,
  evaluateExpression,
  calculateTaxes,
} from '../utils/calculator';
import { buildReceiptData, exportReceiptPdf } from '../utils/pdfReceiptGenerator';
import { CalculatorKeypad } from './CalculatorKeypad';
import {
  Calculator as CalcIcon,
  Copy,
  Check,
  ArrowRightLeft,
  DollarSign,
  Euro,
  Coins,
  History,
  AlertCircle,
  Delete,
  FileDown,
} from 'lucide-react';

interface CurrencyConverterProps {
  rates: RatesData;
  onSaveHistory: (item: CalculationHistoryItem) => void;
  externalAmount?: { amount: number; currency: CurrencyCode } | null;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  rates,
  onSaveHistory,
  externalAmount,
}) => {
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('USD');
  const [inputExpression, setInputExpression] = useState<string>('10');
  const [numericValue, setNumericValue] = useState<number>(10);
  const [showKeypad, setShowKeypad] = useState<boolean>(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  const handleExportPdf = () => {
    if (numericValue <= 0) return;
    setIsExportingPdf(true);
    try {
      const breakdown = calculateTaxes(
        numericValue,
        baseCurrency,
        { applyIva: false, applyIgtf: false },
        { bcvUsd: rates.bcvUsd.rate, bcvEur: rates.bcvEur.rate }
      );
      const receiptData = buildReceiptData(
        breakdown,
        rates,
        'Cliente General',
        `Conversión directa de ${formatCurrency(numericValue, baseCurrency)} a tasa oficial BCV`
      );
      const doc = exportReceiptPdf(receiptData);
      doc.save(`Cotizacion_${receiptData.receiptNumber}.pdf`);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Sync external amount if picked from history or quick table
  useEffect(() => {
    if (externalAmount) {
      setBaseCurrency(externalAmount.currency);
      setInputExpression(String(externalAmount.amount));
      setNumericValue(externalAmount.amount);
      setParseError(null);
    }
  }, [externalAmount]);

  // Evaluate expression whenever input changes
  useEffect(() => {
    if (!inputExpression.trim()) {
      setNumericValue(0);
      setParseError(null);
      return;
    }

    const { result, error } = evaluateExpression(inputExpression);
    if (error) {
      setParseError(error);
    } else {
      setNumericValue(result);
      setParseError(null);
    }
  }, [inputExpression]);

  const activeRates = {
    bcvUsd: rates.bcvUsd.rate,
    bcvEur: rates.bcvEur.rate,
  };

  const conversions = calculateAllConversions(numericValue, baseCurrency, activeRates);

  // Keypad actions
  const handleKeypadPress = (char: string) => {
    setInputExpression((prev) => {
      // If previous was '0' and adding digit, replace
      if (prev === '0' && /[0-9]/.test(char)) return char;
      return prev + char;
    });
  };

  const handleClear = () => {
    setInputExpression('0');
    setNumericValue(0);
    setParseError(null);
  };

  const handleBackspace = () => {
    setInputExpression((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleEvaluate = () => {
    const { result, error } = evaluateExpression(inputExpression);
    if (!error && result !== undefined) {
      setInputExpression(String(Number(result.toFixed(4))));
      setNumericValue(result);

      // Record to history
      if (result > 0) {
        onSaveHistory({
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
          expression: inputExpression,
          fromCurrency: baseCurrency,
          amount: result,
          ves: conversions.ves,
          usd: conversions.usd,
          eur: conversions.eur,
        });
      }
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Quick preset pills
  const presets: Record<CurrencyCode, number[]> = {
    USD: [1, 5, 10, 20, 50, 100],
    EUR: [1, 5, 10, 20, 50, 100],
    VES: [50, 100, 500, 1000, 5000, 10000],
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4 sm:p-6 text-white">
      {/* Header with Currency Selector and Keypad Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
            Conversor Automático
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>Calcular y Convertir</span>
          </h2>
        </div>

        {/* Currency Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setBaseCurrency('USD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              baseCurrency === 'USD'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            aria-label="Seleccionar Dólar como moneda base"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>USD Dólar</span>
          </button>

          <button
            type="button"
            onClick={() => setBaseCurrency('EUR')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              baseCurrency === 'EUR'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            aria-label="Seleccionar Euro como moneda base"
          >
            <Euro className="w-3.5 h-3.5" />
            <span>EUR Euro</span>
          </button>

          <button
            type="button"
            onClick={() => setBaseCurrency('VES')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              baseCurrency === 'VES'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            aria-label="Seleccionar Bolívares como moneda base"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Bs. Bolívares</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left Column: Input Display & Results (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Main Input Display */}
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 sm:p-5 focus-within:border-emerald-500/80 transition-all shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <label htmlFor="currency-input" className="font-medium text-slate-300">
                Monto o Expresión ({baseCurrency}):
              </label>
              <span className="text-[11px] text-slate-400">
                Puedes escribir o usar el teclado
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 select-none">
                {baseCurrency === 'USD' ? '$' : baseCurrency === 'EUR' ? '€' : 'Bs.'}
              </span>
              <input
                id="currency-input"
                type="text"
                value={inputExpression}
                onChange={(e) => setInputExpression(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEvaluate();
                }}
                className="w-full bg-transparent text-2xl sm:text-4xl font-extrabold text-white tracking-tight focus:outline-none placeholder:text-slate-600"
                placeholder="0.00"
                autoComplete="off"
              />
              {inputExpression.length > 0 && inputExpression !== '0' && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Limpiar entrada"
                >
                  <Delete className="w-5 h-5" />
                </button>
              )}
            </div>

            {parseError && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-2 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 mr-1">Rápidos:</span>
            {presets[baseCurrency].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setInputExpression(String(val));
                  setNumericValue(val);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer active:scale-95"
              >
                {baseCurrency === 'VES' ? `${val.toLocaleString('es-VE')} Bs.` : `${baseCurrency === 'USD' ? '$' : '€'}${val}`}
              </button>
            ))}
          </div>

          {/* Conversion Cards Breakdown */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-0.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Equivalencias en tiempo real (Tasa BCV)
              </span>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf || numericValue <= 0}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-40"
                aria-label="Exportar cotización en PDF"
              >
                {pdfSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡PDF Generado!</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5" />
                    <span>{isExportingPdf ? 'Exportando...' : 'Exportar Cotización PDF'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Result: VES Bolívares (if base is USD or EUR) */}
            {baseCurrency !== 'VES' && (
              <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/40 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-sm">
                    Bs.
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">En Bolívares (VES)</div>
                    <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {formatCurrency(conversions.ves, 'VES')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `${formatCurrency(conversions.ves, 'VES')} (${numericValue} ${baseCurrency} a tasa BCV)`,
                      'ves'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-slate-750 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-slate-650"
                  aria-label="Copiar monto en bolívares"
                >
                  {copiedKey === 'ves' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Result: USD Dólares (if base is VES or EUR) */}
            {baseCurrency !== 'USD' && (
              <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/40 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-sm">
                    $
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">En Dólares BCV (USD)</div>
                    <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {formatCurrency(conversions.usd, 'USD')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `${formatCurrency(conversions.usd, 'USD')} (Tasa BCV: ${rates.bcvUsd.rate.toFixed(2)} Bs.)`,
                      'usd'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-slate-750 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-slate-650"
                  aria-label="Copiar monto en dólares"
                >
                  {copiedKey === 'usd' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Result: EUR Euros (if base is VES or USD) */}
            {baseCurrency !== 'EUR' && (
              <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-blue-500/40 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-black text-sm">
                    €
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">En Euros BCV (EUR)</div>
                    <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {formatCurrency(conversions.eur, 'EUR')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `${formatCurrency(conversions.eur, 'EUR')} (Tasa BCV: ${rates.bcvEur.rate.toFixed(2)} Bs.)`,
                      'eur'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-slate-750 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-slate-650"
                  aria-label="Copiar monto en euros"
                >
                  {copiedKey === 'eur' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-blue-400 font-semibold">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: In-App Calculator Keypad (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/70">
            <div className="flex items-center gap-2">
              <CalcIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Teclado Calculadora
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowKeypad(!showKeypad)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              {showKeypad ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showKeypad ? (
            <CalculatorKeypad
              onKeyPress={handleKeypadPress}
              onClear={handleClear}
              onBackspace={handleBackspace}
              onEvaluate={handleEvaluate}
            />
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm">
              <button
                type="button"
                onClick={() => setShowKeypad(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 text-xs font-semibold"
              >
                Abrir Teclado
              </button>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 text-center">
            Soporta operaciones directas: <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300 font-mono">15*3+10%</code>
          </div>
        </div>
      </div>
    </div>
  );
};
