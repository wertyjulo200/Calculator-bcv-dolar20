import React, { useState } from 'react';
import { RatesData } from '../types';
import { CustomRateOverrides } from '../services/ratesService';
import { X, RotateCcw, Check, Sliders } from 'lucide-react';

interface CustomRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: RatesData;
  customOverrides: CustomRateOverrides;
  onSaveOverrides: (overrides: CustomRateOverrides) => void;
}

export const CustomRateModal: React.FC<CustomRateModalProps> = ({
  isOpen,
  onClose,
  rates,
  customOverrides,
  onSaveOverrides,
}) => {
  const [customUsd, setCustomUsd] = useState<string>(
    customOverrides.bcvUsd ? String(customOverrides.bcvUsd) : String(rates.bcvUsd.rate)
  );
  const [customEur, setCustomEur] = useState<string>(
    customOverrides.bcvEur ? String(customOverrides.bcvEur) : String(rates.bcvEur.rate)
  );
  const [enableCustom, setEnableCustom] = useState<boolean>(customOverrides.isActive);

  if (!isOpen) return null;

  const handleSave = () => {
    const usdVal = parseFloat(customUsd);
    const eurVal = parseFloat(customEur);

    onSaveOverrides({
      isActive: enableCustom,
      bcvUsd: !isNaN(usdVal) && usdVal > 0 ? usdVal : undefined,
      bcvEur: !isNaN(eurVal) && eurVal > 0 ? eurVal : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setCustomUsd(String(rates.bcvUsd.rate));
    setCustomEur(String(rates.bcvEur.rate));
    setEnableCustom(false);
    onSaveOverrides({ isActive: false });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Sliders className="w-5 h-5" />
          </div>
          <h2 id="modal-title" className="text-lg font-bold text-white">
            Ajustar Tasas Manualmente
          </h2>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Si necesitas calcular con una tasa acordada o personalizada, puedes activarla aquí. Al desactivar, se volverá automáticamente a la tasa en vivo del BCV.
        </p>

        <div className="space-y-4">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={enableCustom}
              onChange={(e) => setEnableCustom(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-900 border-slate-700"
            />
            <span className="text-sm font-semibold text-white">
              Activar tasas personalizadas
            </span>
          </label>

          <div className={`space-y-3 ${!enableCustom ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <label htmlFor="custom-usd" className="block text-xs font-semibold text-slate-300 mb-1">
                Tasa Dólar (Bs. por USD):
              </label>
              <input
                id="custom-usd"
                type="number"
                step="any"
                value={customUsd}
                onChange={(e) => setCustomUsd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 font-bold text-white focus:outline-none focus:border-emerald-500"
                placeholder="Ej. 889.25"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Tasa oficial actual BCV: {rates.bcvUsd.rate.toFixed(4)} Bs.
              </span>
            </div>

            <div>
              <label htmlFor="custom-eur" className="block text-xs font-semibold text-slate-300 mb-1">
                Tasa Euro (Bs. por EUR):
              </label>
              <input
                id="custom-eur"
                type="number"
                step="any"
                value={customEur}
                onChange={(e) => setCustomEur(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 font-bold text-white focus:outline-none focus:border-emerald-500"
                placeholder="Ej. 992.80"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Tasa oficial actual BCV: {rates.bcvEur.rate.toFixed(4)} Bs.
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer BCV</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
