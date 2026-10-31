import React, { useState, useMemo } from 'react';
import { RatesData } from '../types';
import {
  generate30DayHistoricalData,
  calculateTrendMetrics,
  filterPointsByRange,
} from '../utils/historyAnalysis';
import { formatRateNumber } from '../utils/calculator';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Euro,
  ArrowUpRight,
  BarChart3,
  Layers,
} from 'lucide-react';

interface HistoricalTrendChartProps {
  rates: RatesData;
}

export const HistoricalTrendChart: React.FC<HistoricalTrendChartProps> = ({ rates }) => {
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [currencyFilter, setCurrencyFilter] = useState<'both' | 'usd' | 'eur'>('both');
  const [showParallel, setShowParallel] = useState<boolean>(false);

  // Generate 30 days of data anchored to the current rates
  const allHistoricalData = useMemo(() => {
    return generate30DayHistoricalData(rates.bcvUsd.rate, rates.bcvEur.rate);
  }, [rates.bcvUsd.rate, rates.bcvEur.rate]);

  // Filter by selected range (7, 14, 30 days)
  const filteredData = useMemo(() => {
    return filterPointsByRange(allHistoricalData, rangeDays);
  }, [allHistoricalData, rangeDays]);

  // Compute metrics for the active range
  const metrics = useMemo(() => {
    return calculateTrendMetrics(filteredData);
  }, [filteredData]);

  // Determine domain bounds for Y-axis so the line isn't squished at the top
  const yDomain = useMemo(() => {
    const values: number[] = [];
    filteredData.forEach((d) => {
      if (currencyFilter === 'both' || currencyFilter === 'usd') values.push(d.bcvUsd);
      if (currencyFilter === 'both' || currencyFilter === 'eur') values.push(d.bcvEur);
      if (showParallel && d.paraleloUsd) values.push(d.paraleloUsd);
    });
    if (values.length === 0) return [700, 1050];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.12 || 10;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [filteredData, currencyFilter, showParallel]);

  // Custom high-contrast tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const dataPoint = payload[0]?.payload;

    return (
      <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs text-white min-w-[200px]">
        <div className="text-slate-400 font-semibold border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
          <span>{dataPoint?.date}</span>
          <span className="text-[11px] text-slate-500 font-mono">Oficial BCV</span>
        </div>

        <div className="space-y-1.5">
          {(currencyFilter === 'both' || currencyFilter === 'usd') && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Dólar BCV:
              </span>
              <span className="font-bold font-mono">
                {formatRateNumber(dataPoint?.bcvUsd, 2)} Bs.
              </span>
            </div>
          )}

          {(currencyFilter === 'both' || currencyFilter === 'eur') && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 font-medium text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Euro BCV:
              </span>
              <span className="font-bold font-mono">
                {formatRateNumber(dataPoint?.bcvEur, 2)} Bs.
              </span>
            </div>
          )}

          {showParallel && dataPoint?.paraleloUsd && (
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1.5 font-medium text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Paralelo:
              </span>
              <span className="font-bold font-mono">
                {formatRateNumber(dataPoint?.paraleloUsd, 2)} Bs.
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      aria-label="Tendencia histórica de tasas BCV a 30 días"
      className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4 sm:p-6 text-white mt-6"
    >
      {/* Header with Title and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              Tendencia Histórica
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Últimos {rangeDays} días
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
            Evolución de las Tasas Oficiales BCV (USD / EUR)
          </h3>
          <p className="text-xs text-slate-400">
            Comportamiento diario de las mesas de cambio bancarias reguladas por el Banco Central de Venezuela
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Currency Toggle */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setCurrencyFilter('both')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currencyFilter === 'both'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              USD & EUR
            </button>
            <button
              type="button"
              onClick={() => setCurrencyFilter('usd')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currencyFilter === 'usd'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Solo USD
            </button>
            <button
              type="button"
              onClick={() => setCurrencyFilter('eur')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currencyFilter === 'eur'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Solo EUR
            </button>
          </div>

          {/* Timeframe Range selector */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRangeDays(days)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  rangeDays === days
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>

          {/* Toggle comparison with Parallel */}
          <button
            type="button"
            onClick={() => setShowParallel(!showParallel)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
              showParallel
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Paralelo</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Variación USD ({rangeDays}d)</div>
          <div className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
            <span>+{metrics.changeUsdPct}%</span>
            <span className="text-xs text-slate-400 font-normal">
              (+{formatRateNumber(metrics.changeUsd, 2)} Bs.)
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Variación EUR ({rangeDays}d)</div>
          <div className="text-base sm:text-lg font-bold text-blue-400 mt-0.5 flex items-center gap-1">
            <span>+{metrics.changeEurPct}%</span>
            <span className="text-xs text-slate-400 font-normal">
              (+{formatRateNumber(metrics.changeEur, 2)} Bs.)
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Rango USD en el periodo</div>
          <div className="text-xs sm:text-sm font-semibold text-slate-200 mt-1">
            <span>{formatRateNumber(metrics.minUsd, 2)}</span>
            <span className="text-slate-500 mx-1">→</span>
            <span className="text-emerald-400 font-bold">{formatRateNumber(metrics.maxUsd, 2)} Bs.</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Rango EUR en el periodo</div>
          <div className="text-xs sm:text-sm font-semibold text-slate-200 mt-1">
            <span>{formatRateNumber(metrics.minEur, 2)}</span>
            <span className="text-slate-500 mx-1">→</span>
            <span className="text-blue-400 font-bold">{formatRateNumber(metrics.maxEur, 2)} Bs.</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="usdGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="eurGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />

            <XAxis
              dataKey="displayDate"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            <YAxis
              domain={yDomain}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v.toFixed(0)} Bs.`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
            />

            {(currencyFilter === 'both' || currencyFilter === 'usd') && (
              <Area
                type="monotone"
                dataKey="bcvUsd"
                name="Dólar Oficial (USD)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#usdGradient)"
                activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: '#0f172a' }}
              />
            )}

            {(currencyFilter === 'both' || currencyFilter === 'eur') && (
              <Area
                type="monotone"
                dataKey="bcvEur"
                name="Euro Oficial (EUR)"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#eurGradient)"
                activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2, fill: '#0f172a' }}
              />
            )}

            {showParallel && (
              <Area
                type="monotone"
                dataKey="paraleloUsd"
                name="Paralelo (Referencial)"
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={2}
                fill="none"
                activeDot={{ r: 4, stroke: '#f59e0b', strokeWidth: 2, fill: '#0f172a' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Fuente: Histórico de cotizaciones oficiales Banco Central de Venezuela (BCV).</span>
        <span className="text-slate-400">Pasa el cursor o pulsa en la gráfica para ver la cotización de cada día.</span>
      </div>
    </section>
  );
};
