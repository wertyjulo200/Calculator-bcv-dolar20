import { RatesData, ExchangeRate } from '../types';

const STORAGE_KEY_RATES = 'bcv_calculator_rates_v1';
const STORAGE_KEY_CUSTOM_RATES = 'bcv_calculator_custom_rates';

// Fallback rates based on actual recent BCV data
const FALLBACK_RATES: RatesData = {
  bcvUsd: {
    currency: 'USD',
    source: 'oficial',
    name: 'Dólar BCV',
    rate: 889.2553,
    updatedAt: new Date().toISOString(),
  },
  bcvEur: {
    currency: 'EUR',
    source: 'oficial',
    name: 'Euro BCV',
    rate: 992.8002,
    updatedAt: new Date().toISOString(),
  },
  paraleloUsd: {
    currency: 'USD',
    source: 'paralelo',
    name: 'Dólar Paralelo',
    rate: 993.64,
    updatedAt: new Date().toISOString(),
  },
  paraleloEur: {
    currency: 'EUR',
    source: 'paralelo',
    name: 'Euro Paralelo',
    rate: 1110.43,
    updatedAt: new Date().toISOString(),
  },
  lastChecked: new Date().toISOString(),
  isCachedFallback: true,
};

interface DolarApiResponseItem {
  moneda: string;
  fuente: string;
  nombre: string;
  compra: number | null;
  venta: number | null;
  promedio: number;
  fechaActualizacion: string;
}

export async function fetchLiveRates(): Promise<RatesData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const [dolaresRes, eurosRes] = await Promise.all([
      fetch('https://ve.dolarapi.com/v1/dolares', { signal: controller.signal }),
      fetch('https://ve.dolarapi.com/v1/euros', { signal: controller.signal }),
    ]);

    clearTimeout(timeoutId);

    if (!dolaresRes.ok || !eurosRes.ok) {
      throw new Error(`Error en API: USD (${dolaresRes.status}), EUR (${eurosRes.status})`);
    }

    const dolaresData: DolarApiResponseItem[] = await dolaresRes.json();
    const eurosData: DolarApiResponseItem[] = await eurosRes.json();

    const oficialDolar = dolaresData.find((d) => d.fuente === 'oficial') || dolaresData[0];
    const paraleloDolar = dolaresData.find((d) => d.fuente === 'paralelo');

    const oficialEuro = eurosData.find((e) => e.fuente === 'oficial') || eurosData[0];
    const paraleloEuro = eurosData.find((e) => e.fuente === 'paralelo');

    if (!oficialDolar || !oficialEuro) {
      throw new Error('No se encontraron las tasas oficiales en la respuesta');
    }

    const ratesData: RatesData = {
      bcvUsd: {
        currency: 'USD',
        source: 'oficial',
        name: 'Dólar BCV Oficial',
        rate: oficialDolar.promedio,
        updatedAt: oficialDolar.fechaActualizacion,
      },
      bcvEur: {
        currency: 'EUR',
        source: 'oficial',
        name: 'Euro BCV Oficial',
        rate: oficialEuro.promedio,
        updatedAt: oficialEuro.fechaActualizacion,
      },
      paraleloUsd: paraleloDolar
        ? {
            currency: 'USD',
            source: 'paralelo',
            name: 'Dólar Paralelo',
            rate: paraleloDolar.promedio,
            updatedAt: paraleloDolar.fechaActualizacion,
          }
        : undefined,
      paraleloEur: paraleloEuro
        ? {
            currency: 'EUR',
            source: 'paralelo',
            name: 'Euro Paralelo',
            rate: paraleloEuro.promedio,
            updatedAt: paraleloEuro.fechaActualizacion,
          }
        : undefined,
      lastChecked: new Date().toISOString(),
      isCachedFallback: false,
    };

    // Cache to localStorage
    try {
      localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(ratesData));
    } catch {
      // Ignore localStorage quotas/disabled
    }

    return ratesData;
  } catch (err) {
    console.warn('Fallo al obtener tasas en vivo, intentando caché local:', err);

    // Try reading cached data
    try {
      const cached = localStorage.getItem(STORAGE_KEY_RATES);
      if (cached) {
        const parsed = JSON.parse(cached) as RatesData;
        return {
          ...parsed,
          isCachedFallback: true,
        };
      }
    } catch {
      // Ignore parsing errors
    }

    return FALLBACK_RATES;
  }
}

export function getCachedRates(): RatesData | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_RATES);
    if (cached) {
      return JSON.parse(cached) as RatesData;
    }
  } catch {
    // Ignore error
  }
  return FALLBACK_RATES;
}

export interface CustomRateOverrides {
  bcvUsd?: number;
  bcvEur?: number;
  isActive: boolean;
}

export function getCustomRateOverrides(): CustomRateOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_RATES);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { isActive: false };
}

export function saveCustomRateOverrides(overrides: CustomRateOverrides) {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_RATES, JSON.stringify(overrides));
  } catch {
    // ignore
  }
}
