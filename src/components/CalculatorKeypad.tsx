import React from 'react';
import { Delete, RotateCcw, Equal } from 'lucide-react';

interface CalculatorKeypadProps {
  onKeyPress: (char: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onEvaluate: () => void;
  className?: string;
}

export const CalculatorKeypad: React.FC<CalculatorKeypadProps> = ({
  onKeyPress,
  onClear,
  onBackspace,
  onEvaluate,
  className = '',
}) => {
  const buttons = [
    { label: 'C', action: onClear, type: 'action', icon: RotateCcw, aria: 'Borrar todo' },
    { label: '(', char: '(', type: 'op', aria: 'Abrir paréntesis' },
    { label: ')', char: ')', type: 'op', aria: 'Cerrar paréntesis' },
    { label: '÷', char: '/', type: 'op', display: '÷', aria: 'Dividir' },

    { label: '7', char: '7', type: 'num' },
    { label: '8', char: '8', type: 'num' },
    { label: '9', char: '9', type: 'num' },
    { label: '×', char: '*', type: 'op', display: '×', aria: 'Multiplicar' },

    { label: '4', char: '4', type: 'num' },
    { label: '5', char: '5', type: 'num' },
    { label: '6', char: '6', type: 'num' },
    { label: '-', char: '-', type: 'op', display: '-', aria: 'Restar' },

    { label: '1', char: '1', type: 'num' },
    { label: '2', char: '2', type: 'num' },
    { label: '3', char: '3', type: 'num' },
    { label: '+', char: '+', type: 'op', display: '+', aria: 'Sumar' },

    { label: '0', char: '0', type: 'num' },
    { label: '.', char: '.', type: 'num', display: '.', aria: 'Punto decimal' },
    { label: '%', char: '%', type: 'op', display: '%', aria: 'Porcentaje' },
    { label: '⌫', action: onBackspace, type: 'action', icon: Delete, aria: 'Borrar último caracter' },
  ];

  return (
    <div className={`grid grid-cols-4 gap-1.5 sm:gap-2 ${className}`}>
      {buttons.map((btn, index) => {
        let btnStyle = 'bg-slate-800 text-slate-100 hover:bg-slate-700 active:scale-95';
        if (btn.type === 'op') {
          btnStyle = 'bg-slate-750 text-emerald-400 font-semibold hover:bg-slate-700 active:scale-95';
        } else if (btn.type === 'action') {
          btnStyle = 'bg-slate-800 text-amber-400 hover:bg-slate-700 active:scale-95';
        }

        const Icon = btn.icon;

        return (
          <button
            key={index}
            type="button"
            onClick={() => {
              if (btn.action) {
                btn.action();
              } else if (btn.char) {
                onKeyPress(btn.char);
              }
            }}
            className={`h-11 sm:h-12 rounded-xl text-base sm:text-lg font-medium flex items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-700/60 ${btnStyle}`}
            aria-label={btn.aria || btn.label}
          >
            {Icon ? <Icon className="w-5 h-5" /> : btn.display || btn.label}
          </button>
        );
      })}

      {/* Large Equal Button spanning full width or 4 columns */}
      <button
        type="button"
        onClick={onEvaluate}
        className="col-span-4 h-11 sm:h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer mt-1"
        aria-label="Calcular resultado"
      >
        <Equal className="w-5 h-5" />
        <span>Calcular (=)</span>
      </button>
    </div>
  );
};
