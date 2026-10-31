/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RatesData, CalculationHistoryItem, CurrencyCode } from './types';
import {
  fetchLiveRates,
  getCachedRates,
  getCustomRateOverrides,
  saveCustomRateOverrides,
  CustomRateOverrides,
} from './services/ratesService';
import { HeaderRates } from './components/HeaderRates';
import { CurrencyConverter } from './components/CurrencyConverter';
import { CommercialTools } from './components/CommercialTools';
import { CalculationHistory } from './components/CalculationHistory';
import { HistoricalTrendChart } from './components/HistoricalTrendChart';
import { CustomRateModal } from './components/CustomRateModal';
import {
  Building2,
  Clock,
  Sparkles,
  ExternalLink,
  Shield,
  HelpCircle,
} from 'lucide-react';

const STORAGE_KEY_HISTORY = 'bcv_calc_history_v1';

export default function App() {
  const [rates, setRates] = useState<RatesData>(() => getCachedRates()!);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [customOverrides, setCustomOverrides] = useState<CustomRateOverrides>(() =>
    getCustomRateOverrides()
  );
  const [history, setHistory] = useState<CalculationHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [externalAmount, setExternalAmount] = useState<{
    amount: number;
    currency: CurrencyCode;
  } | null>(null);

  // Load live rates
  const loadRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const live = await fetchLiveRates();
      setRates(live);
    } catch (e) {
      console.error('Error cargando tasas:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();

    // Auto-refresh rates every 5 minutes
    const interval = setInterval(loadRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadRates]);

  // Compute effective rates taking into account custom overrides if active
  const effectiveRates: RatesData = React.useMemo(() => {
    if (!customOverrides.isActive) {
      return rates;
    }
    return {
      ...rates,
      bcvUsd: {
        ...rates.bcvUsd,
        rate: customOverrides.bcvUsd ?? rates.bcvUsd.rate,
        source: 'custom',
        name: 'Dólar (Personalizado)',
      },
      bcvEur: {
        ...rates.bcvEur,
        rate: customOverrides.bcvEur ?? rates.bcvEur.rate,
        source: 'custom',
        name: 'Euro (Personalizado)',
      },
    };
  }, [rates, customOverrides]);

  // History handlers
  const handleSaveHistory = (item: CalculationHistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev.filter((h) => h.id !== item.id)].slice(0, 12);
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch {
      // ignore
    }
  };

  const handleSelectAmount = (amount: number, currency: CurrencyCode) => {
    setExternalAmount({ amount, currency });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveOverrides = (overrides: CustomRateOverrides) => {
    setCustomOverrides(overrides);
    saveCustomRateOverrides(overrides);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header with Live BCV Rates & Monitor */}
      <HeaderRates
        rates={effectiveRates}
        isLoading={isLoading}
        onRefresh={loadRates}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasCustomOverrides={customOverrides.isActive}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Real-time Currency Converter & Calculator */}
        <section aria-label="Calculadora de conversión de divisas">
          <CurrencyConverter
            rates={effectiveRates}
            onSaveHistory={handleSaveHistory}
            externalAmount={externalAmount}
          />
        </section>

        {/* Commercial Tools: IVA, IGTF, Vuelto y Tabla Rápida */}
        <section aria-label="Herramientas comerciales de impuestos y cambio">
          <CommercialTools
            rates={effectiveRates}
            onSelectAmount={handleSelectAmount}
          />
        </section>

        {/* Calculation History */}
        <section aria-label="Historial de cálculos">
          <CalculationHistory
            history={history}
            onSelectHistoryItem={handleSelectAmount}
            onClearHistory={handleClearHistory}
          />
        </section>

        {/* 30-Day Historical Trend Chart */}
        <HistoricalTrendChart rates={effectiveRates} />

        {/* Information & Disclaimer Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs text-slate-400">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-200 text-sm mb-1">
                Tasa Oficial BCV
              </h4>
              <p>
                El Banco Central de Venezuela publica las tasas oficiales resultantes de las mesas de cambio bancarias al cierre de cada jornada operativa.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-200 text-sm mb-1">
                Actualización Automática
              </h4>
              <p>
                Los valores se sincronizan automáticamente en tiempo real mediante API pública y se almacenan en caché local para funcionar incluso con conexión inestable.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-200 text-sm mb-1">
                Cumplimiento y Cálculo Seguro
              </h4>
              <p>
                Incluye la estimación del IVA general (16%) y el IGTF (3%) para transacciones comerciales en moneda extranjera según normativa vigente.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 bg-slate-900/70 text-slate-400 text-xs py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Calculadora BCV Venezuela • Tasas Oficiales en Tiempo Real</span>
          </div>
          <div className="text-center sm:text-right text-slate-500">
            Dólar y Euro referencial Banco Central de Venezuela
          </div>
        </div>
      </footer>

      {/* Custom Rate Modal */}
      <CustomRateModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        rates={rates}
        customOverrides={customOverrides}
        onSaveOverrides={handleSaveOverrides}
      />
    </div>
  );
}
