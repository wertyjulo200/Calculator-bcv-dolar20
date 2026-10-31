import React from 'react';
import { CalculationHistoryItem, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/calculator';
import { History, Trash2, ArrowUpRight } from 'lucide-react';

interface CalculationHistoryProps {
  history: CalculationHistoryItem[];
  onSelectHistoryItem: (amount: number, currency: CurrencyCode) => void;
  onClearHistory: () => void;
}

export const CalculationHistory: React.FC<CalculationHistoryProps> = ({
  history,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4 sm:p-6 text-white mt-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Historial de Cálculos Recientes ({history.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
          aria-label="Limpiar historial"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Limpiar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {history.slice(0, 6).map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectHistoryItem(item.amount, item.fromCurrency)}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between text-xs text-slate-400 mb-1">
              <span>{item.timestamp}</span>
              <span className="font-semibold text-emerald-400 group-hover:underline flex items-center gap-0.5">
                Cargar <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            <div>
              <div className="text-sm font-bold text-white">
                {formatCurrency(item.amount, item.fromCurrency)}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex flex-col gap-0.5">
                <span>= {formatCurrency(item.ves, 'VES')}</span>
                {item.fromCurrency !== 'USD' && <span>= {formatCurrency(item.usd, 'USD')}</span>}
                {item.fromCurrency !== 'EUR' && <span>= {formatCurrency(item.eur, 'EUR')}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
