import React, { useState } from 'react';
import { RatesData } from '../types';
import { formatRateNumber, calculateSpread } from '../utils/calculator';
import { RefreshCw, Check, Copy, TrendingUp, Sliders, ShieldCheck } from 'lucide-react';

interface HeaderRatesProps {
  rates: RatesData;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  hasCustomOverrides: boolean;
}

export const HeaderRates: React.FC<HeaderRatesProps> = ({
  rates,
  isLoading,
  onRefresh,
  onOpenSettings,
  hasCustomOverrides,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const usdRate = rates.bcvUsd.rate;
  const eurRate = rates.bcvEur.rate;
  const parUsd = rates.paraleloUsd?.rate;

  const usdSpread = parUsd ? calculateSpread(usdRate, parUsd) : null;

  // Format date readable
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('es-VE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {/* Top bar with Branding and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Oficial BCV
              </span>
              {rates.isCachedFallback && (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Caché local
                </span>
              )}
              {hasCustomOverrides && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Tasa personalizada
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Tasas de Cambio & Calculadora BCV
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Banco Central de Venezuela • Dólar y Euro actualizados
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer disabled:opacity-50"
              aria-label="Actualizar tasas de cambio"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isLoading ? 'Actualizando...' : 'Actualizar'}</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
              aria-label="Ajustar tasas personalizadas"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Ajustar Tasa</span>
            </button>
          </div>
        </div>

        {/* Live Rate Cards Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-5">
          {/* Card: Dólar BCV */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-850/80 border border-emerald-500/30 p-4 shadow-lg hover:border-emerald-500/50 transition-all">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                DÓLAR OFICIAL BCV (USD)
              </span>
              <span>{formatDate(rates.bcvUsd.updatedAt)}</span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {formatRateNumber(usdRate, 4)}
                </span>
                <span className="text-sm font-semibold text-slate-400">Bs.</span>
              </div>

              <button
                onClick={() => handleCopy(usdRate.toFixed(4), 'usd')}
                className="p-1.5 rounded-md hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
                title="Copiar tasa de dólar"
                aria-label="Copiar tasa de cambio de dólar BCV"
              >
                {copiedKey === 'usd' ? (
                  <span className="flex items-center text-xs text-emerald-400 font-medium">
                    <Check className="w-4 h-4 mr-0.5" /> Copiado
                  </span>
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-750 pt-1.5">
              <span>1 USD = {formatRateNumber(usdRate, 2)} Bs.</span>
              <span className="text-slate-400">Tasa oficial fija BCV</span>
            </div>
          </div>

          {/* Card: Euro BCV */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-850/80 border border-blue-500/30 p-4 shadow-lg hover:border-blue-500/50 transition-all">
            <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-blue-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                EURO OFICIAL BCV (EUR)
              </span>
              <span>{formatDate(rates.bcvEur.updatedAt)}</span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {formatRateNumber(eurRate, 4)}
                </span>
                <span className="text-sm font-semibold text-slate-400">Bs.</span>
              </div>

              <button
                onClick={() => handleCopy(eurRate.toFixed(4), 'eur')}
                className="p-1.5 rounded-md hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
                title="Copiar tasa de euro"
                aria-label="Copiar tasa de cambio de euro BCV"
              >
                {copiedKey === 'eur' ? (
                  <span className="flex items-center text-xs text-blue-400 font-medium">
                    <Check className="w-4 h-4 mr-0.5" /> Copiado
                  </span>
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-750 pt-1.5">
              <span>1 EUR = {formatRateNumber(eurRate, 2)} Bs.</span>
              <span className="text-slate-400">Relación EUR/USD: {(eurRate / usdRate).toFixed(4)}</span>
            </div>
          </div>

          {/* Card: Monitor Paralelo & Brecha Cambiaria */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-850/80 border border-amber-500/30 p-4 shadow-lg hover:border-amber-500/50 transition-all col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-amber-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                DÓLAR PARALELO (MONITOR)
              </span>
              <span>{parUsd ? formatDate(rates.paraleloUsd?.updatedAt || '') : 'Referencial'}</span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {parUsd ? formatRateNumber(parUsd, 2) : '---'}
                </span>
                <span className="text-sm font-semibold text-slate-400">Bs.</span>
              </div>

              {parUsd && (
                <button
                  onClick={() => handleCopy(parUsd.toFixed(2), 'par')}
                  className="p-1.5 rounded-md hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
                  title="Copiar tasa paralelo"
                  aria-label="Copiar tasa paralelo"
                >
                  {copiedKey === 'par' ? (
                    <span className="flex items-center text-xs text-amber-400 font-medium">
                      <Check className="w-4 h-4 mr-0.5" /> Copiado
                    </span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-750 pt-1.5">
              <span>Brecha cambiaria:</span>
              {usdSpread ? (
                <span className={`font-semibold ${usdSpread.percentage >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {usdSpread.percentage >= 0 ? '+' : ''}{usdSpread.percentage.toFixed(1)}% ({usdSpread.diff >= 0 ? '+' : ''}{formatRateNumber(usdSpread.diff, 2)} Bs.)
                </span>
              ) : (
                <span>No disponible</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
