import React, { useState } from 'react';
import { CurrencyCode, RatesData } from '../types';
import {
  calculateTaxes,
  calculateChange,
  formatCurrency,
  formatRateNumber,
} from '../utils/calculator';
import { Receipt, Banknote, TableProperties, HelpCircle, Check, ArrowRight, FileDown, Printer, FileText } from 'lucide-react';
import { buildReceiptData, exportReceiptPdf } from '../utils/pdfReceiptGenerator';

interface CommercialToolsProps {
  rates: RatesData;
  onSelectAmount: (amount: number, currency: CurrencyCode) => void;
}

export const CommercialTools: React.FC<CommercialToolsProps> = ({
  rates,
  onSelectAmount,
}) => {
  const [activeTab, setActiveTab] = useState<'taxes' | 'change' | 'table'>('taxes');

  // Taxes state
  const [taxSubtotal, setTaxSubtotal] = useState<number>(50);
  const [taxCurrency, setTaxCurrency] = useState<CurrencyCode>('USD');
  const [applyIva, setApplyIva] = useState<boolean>(true);
  const [applyIgtf, setApplyIgtf] = useState<boolean>(true);

  // PDF receipt state
  const [showReceiptOptions, setShowReceiptOptions] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string>('Consumidor Final');
  const [receiptNotes, setReceiptNotes] = useState<string>('Cotización y estimación fiscal a tasa oficial BCV');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  // Change state
  const [billDue, setBillDue] = useState<number>(18.5);
  const [billDueCurrency, setBillDueCurrency] = useState<CurrencyCode>('USD');
  const [billPaid, setBillPaid] = useState<number>(20);
  const [billPaidCurrency, setBillPaidCurrency] = useState<CurrencyCode>('USD');

  const activeRates = {
    bcvUsd: rates.bcvUsd.rate,
    bcvEur: rates.bcvEur.rate,
  };

  const taxesBreakdown = calculateTaxes(
    taxSubtotal,
    taxCurrency,
    { applyIva, applyIgtf },
    activeRates
  );

  const changeResult = calculateChange(
    billDue,
    billPaid,
    billPaidCurrency,
    billDueCurrency,
    activeRates
  );

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      const receiptData = buildReceiptData(taxesBreakdown, rates, clientName, receiptNotes);
      const doc = exportReceiptPdf(receiptData);
      const filename = `Comprobante_${receiptData.receiptNumber}.pdf`;
      doc.save(filename);
      setPdfSuccess(true);
      setShowReceiptOptions(false);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const referenceAmountsUsd = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 100, 200];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4 sm:p-6 text-white mt-6">
      {/* Navigation tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
            Herramientas Comerciales
          </span>
          <h3 className="text-lg font-bold text-white">
            Cálculo de Impuestos, Vuelto y Referencias
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveTab('taxes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'taxes'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>IVA & IGTF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('change')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'change'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Vuelto / Cambio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'table'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>Tabla Rápida</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Taxes (IVA 16% + IGTF 3%) */}
      {activeTab === 'taxes' && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 space-y-4">
            <div>
              <label htmlFor="tax-subtotal" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Subtotal Base ({taxCurrency}):
              </label>
              <div className="flex gap-2">
                <input
                  id="tax-subtotal"
                  type="number"
                  min="0"
                  step="any"
                  value={taxSubtotal || ''}
                  onChange={(e) => setTaxSubtotal(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-lg font-bold text-white focus:outline-none focus:border-emerald-500"
                  placeholder="0.00"
                />
                <select
                  value={taxCurrency}
                  onChange={(e) => setTaxCurrency(e.target.value as CurrencyCode)}
                  aria-label="Moneda del subtotal"
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="VES">VES (Bs.)</option>
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2.5 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={applyIva}
                  onChange={(e) => setApplyIva(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 focus:ring-offset-slate-900 bg-slate-900 border-slate-700"
                />
                <div>
                  <div className="text-sm font-semibold text-white">Aplicar IVA General (16%)</div>
                  <div className="text-xs text-slate-400">Impuesto al Valor Agregado estipulado por SENIAT</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={applyIgtf}
                  onChange={(e) => setApplyIgtf(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 focus:ring-offset-slate-900 bg-slate-900 border-slate-700"
                />
                <div>
                  <div className="text-sm font-semibold text-white">Aplicar IGTF Divisas (3%)</div>
                  <div className="text-xs text-slate-400">
                    Aplica a pagos efectuados en moneda extranjera (USD/EUR)
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Tax Result Receipt */}
          <div className="md:col-span-6 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-sm">
            <div className="text-center pb-2 border-b border-dashed border-slate-700">
              <span className="font-bold tracking-wider text-slate-300 font-sans text-xs uppercase">
                Factura Estimada (BCV)
              </span>
            </div>

            <div className="flex justify-between text-slate-300">
              <span>Subtotal:</span>
              <span>{formatCurrency(taxesBreakdown.subtotal, taxCurrency)}</span>
            </div>

            {applyIva && (
              <div className="flex justify-between text-slate-400">
                <span>IVA (16%):</span>
                <span>+{formatCurrency(taxesBreakdown.ivaAmount, taxCurrency)}</span>
              </div>
            )}

            {applyIgtf && (taxCurrency === 'USD' || taxCurrency === 'EUR') && (
              <div className="flex justify-between text-amber-400">
                <span>IGTF Divisas (3%):</span>
                <span>+{formatCurrency(taxesBreakdown.igtfAmount, taxCurrency)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-dashed border-slate-700 flex justify-between text-base font-bold text-emerald-400 font-sans">
              <span>TOTAL A PAGAR:</span>
              <span>{formatCurrency(taxesBreakdown.total, taxCurrency)}</span>
            </div>

            <div className="pt-3 border-t border-slate-800/80 font-sans space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total en Bolívares (VES):</span>
                <span className="font-bold text-white">{formatCurrency(taxesBreakdown.totalInVes, 'VES')}</span>
              </div>
              {taxCurrency !== 'USD' && (
                <div className="flex justify-between text-slate-300">
                  <span>Total en Dólares (USD):</span>
                  <span className="font-bold text-white">{formatCurrency(taxesBreakdown.totalInUsd, 'USD')}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer font-sans active:scale-[0.98] disabled:opacity-50"
                aria-label="Exportar comprobante en PDF"
              >
                {pdfSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>¡Comprobante PDF Descargado!</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>{isExportingPdf ? 'Generando PDF...' : 'Exportar Recibo en PDF'}</span>
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReceiptOptions(!showReceiptOptions)}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 font-sans transition-colors cursor-pointer border border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>{showReceiptOptions ? 'Ocultar datos' : 'Datos del Recibo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectAmount(taxesBreakdown.total, taxCurrency)}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 font-sans transition-colors cursor-pointer border border-slate-700"
                >
                  <span>Al conversor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {showReceiptOptions && (
                <div className="mt-2 p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 font-sans text-xs">
                  <div>
                    <label htmlFor="pdf-client-name" className="block text-[11px] text-slate-400 mb-1">
                      Nombre o Razón Social (Opcional):
                    </label>
                    <input
                      id="pdf-client-name"
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ej. Comercial Los Andes C.A."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="pdf-notes" className="block text-[11px] text-slate-400 mb-1">
                      Notas u Observaciones:
                    </label>
                    <input
                      id="pdf-notes"
                      type="text"
                      value={receiptNotes}
                      onChange={(e) => setReceiptNotes(e.target.value)}
                      placeholder="Ej. Cotización válida por 24 horas"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Descargar con estos datos</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Change / Vuelto */}
      {activeTab === 'change' && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 space-y-4">
            <div>
              <label htmlFor="bill-due" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Monto de la Cuenta a Pagar:
              </label>
              <div className="flex gap-2">
                <input
                  id="bill-due"
                  type="number"
                  min="0"
                  step="any"
                  value={billDue || ''}
                  onChange={(e) => setBillDue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-lg font-bold text-white focus:outline-none focus:border-emerald-500"
                  placeholder="0.00"
                />
                <select
                  value={billDueCurrency}
                  onChange={(e) => setBillDueCurrency(e.target.value as CurrencyCode)}
                  aria-label="Moneda de la cuenta"
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="VES">VES (Bs.)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="bill-paid" className="block text-xs font-semibold text-slate-300 mb-1.5">
                ¿Con cuánto paga el cliente?
              </label>
              <div className="flex gap-2">
                <input
                  id="bill-paid"
                  type="number"
                  min="0"
                  step="any"
                  value={billPaid || ''}
                  onChange={(e) => setBillPaid(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-lg font-bold text-white focus:outline-none focus:border-emerald-500"
                  placeholder="0.00"
                />
                <select
                  value={billPaidCurrency}
                  onChange={(e) => setBillPaidCurrency(e.target.value as CurrencyCode)}
                  aria-label="Moneda de pago"
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="VES">VES (Bs.)</option>
                </select>
              </div>
            </div>

            {/* Quick Bill presets for payment */}
            <div className="pt-1">
              <span className="text-xs text-slate-400 block mb-1.5">Billetes comunes:</span>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 20, 50, 100].map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => {
                      setBillPaid(note);
                      setBillPaidCurrency('USD');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer"
                  >
                    ${note}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Change Display Card */}
          <div className="md:col-span-6 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs uppercase font-bold text-slate-400 mb-2">
                Resultado de Vuelto
              </div>

              {changeResult.isShort ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  <div className="font-bold text-base">Falta dinero para completar el pago</div>
                  <div className="text-xs mt-1">
                    Faltan: {formatCurrency(changeResult.shortAmount, billPaidCurrency)}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-xs text-emerald-400 font-semibold block">Vuelto en {billPaidCurrency}:</span>
                    <span className="text-3xl font-black text-white">
                      {formatCurrency(changeResult.changeInPaymentCurrency, billPaidCurrency)}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 font-semibold block">
                      Equivalente exacto en Bolívares (VES BCV):
                    </span>
                    <span className="text-2xl font-black text-emerald-400">
                      {formatCurrency(changeResult.changeInVes, 'VES')}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ideal para dar vuelto por Pago Móvil o Punto de Venta
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-850">
              Calculado según tasa oficial BCV: 1 USD = {formatRateNumber(rates.bcvUsd.rate, 2)} Bs.
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Quick Reference Matrix Table */}
      {activeTab === 'table' && (
        <div className="mt-5">
          <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
            <span>Valores de referencia calculados con la tasa oficial BCV actual:</span>
            <span className="text-emerald-400 font-medium">Haz clic en una fila para cargarla</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Dólares (USD)</th>
                  <th className="py-3 px-4">Bolívares (VES BCV)</th>
                  <th className="py-3 px-4">Euros (EUR BCV)</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                {referenceAmountsUsd.map((usdVal) => {
                  const vesVal = usdVal * rates.bcvUsd.rate;
                  const eurVal = (usdVal * rates.bcvUsd.rate) / rates.bcvEur.rate;
                  return (
                    <tr
                      key={usdVal}
                      onClick={() => onSelectAmount(usdVal, 'USD')}
                      className="hover:bg-slate-800/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-4 font-bold text-white">
                        ${usdVal}.00
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-emerald-400">
                        {formatCurrency(vesVal, 'VES')}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-blue-300">
                        {formatCurrency(eurVal, 'EUR')}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-400 transition-colors">
                          Cargar &rarr;
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
