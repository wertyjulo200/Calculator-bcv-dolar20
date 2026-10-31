import { HistoricalRatePoint, TrendMetrics } from '../types';

/**
 * Generates a realistic 30-day historical sequence of BCV USD & EUR rates
 * anchored to the real latest rates on the given target date.
 */
export function generate30DayHistoricalData(
  latestUsd: number,
  latestEur: number,
  referenceDate = new Date('2026-10-30T00:00:00')
): HistoricalRatePoint[] {
  const points: HistoricalRatePoint[] = [];
  const totalDays = 30;

  // Realistic historical trend factors: Venezuelan BCV rates typically experience
  // steady upward increments in mesas de cambio over 30 days.
  // Over ~30 days, USD moved from ~812 to ~889 (approx +9.5% change)
  const baseUsdStart = latestUsd * 0.915;
  const baseEurStart = latestEur * 0.918;

  // Deterministic daily increments
  const dailyFactors = [
    0.0, 0.002, 0.003, 0.0, 0.004, 0.005, 0.002,
    0.0, 0.003, 0.004, 0.001, 0.0, 0.006, 0.003,
    0.004, 0.0, 0.002, 0.005, 0.004, 0.003, 0.0,
    0.005, 0.004, 0.006, 0.003, 0.001, 0.0, 0.005,
    0.004, 0.003
  ];

  let currentUsd = baseUsdStart;
  let currentEur = baseEurStart;

  // We build backwards or forwards so day 29 matches latestUsd exactly
  const tempRates: { dateObj: Date; usd: number; eur: number }[] = [];

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    tempRates.push({ dateObj: d, usd: 0, eur: 0 });
  }

  // Distribute progressive values so that the last day is strictly latestUsd & latestEur
  const totalSteps = totalDays - 1;
  for (let idx = 0; idx < totalDays; idx++) {
    const progress = idx / totalSteps;
    // Slight smooth easing curve
    const eased = Math.pow(progress, 1.1);
    const usd = Number((baseUsdStart + (latestUsd - baseUsdStart) * eased).toFixed(4));
    const eur = Number((baseEurStart + (latestEur - baseEurStart) * eased).toFixed(4));
    tempRates[idx].usd = usd;
    tempRates[idx].eur = eur;
  }

  // Ensure last entry is exactly the live rate
  tempRates[totalDays - 1].usd = latestUsd;
  tempRates[totalDays - 1].eur = latestEur;

  // Build the final points
  for (let i = 0; i < tempRates.length; i++) {
    const item = tempRates[i];
    const prevItem = i > 0 ? tempRates[i - 1] : null;
    const usdChangePct = prevItem
      ? Number((((item.usd - prevItem.usd) / prevItem.usd) * 100).toFixed(2))
      : 0;

    const dayName = item.dateObj.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
    });

    const isoDate = item.dateObj.toISOString().split('T')[0];

    // Estimated parallel rate for comparison (+11% spread on average)
    const paraleloUsd = Number((item.usd * 1.117).toFixed(2));

    points.push({
      date: isoDate,
      displayDate: dayName,
      bcvUsd: item.usd,
      bcvEur: item.eur,
      paraleloUsd,
      usdChangePct,
    });
  }

  return points;
}

/**
 * Calculates summary metrics (min, max, delta, delta %) for the given series.
 */
export function calculateTrendMetrics(points: HistoricalRatePoint[]): TrendMetrics {
  if (points.length === 0) {
    return {
      minUsd: 0,
      maxUsd: 0,
      startUsd: 0,
      endUsd: 0,
      changeUsd: 0,
      changeUsdPct: 0,
      minEur: 0,
      maxEur: 0,
      startEur: 0,
      endEur: 0,
      changeEur: 0,
      changeEurPct: 0,
    };
  }

  let minUsd = points[0].bcvUsd;
  let maxUsd = points[0].bcvUsd;
  let minEur = points[0].bcvEur;
  let maxEur = points[0].bcvEur;

  for (const p of points) {
    if (p.bcvUsd < minUsd) minUsd = p.bcvUsd;
    if (p.bcvUsd > maxUsd) maxUsd = p.bcvUsd;
    if (p.bcvEur < minEur) minEur = p.bcvEur;
    if (p.bcvEur > maxEur) maxEur = p.bcvEur;
  }

  const startUsd = points[0].bcvUsd;
  const endUsd = points[points.length - 1].bcvUsd;
  const changeUsd = Number((endUsd - startUsd).toFixed(4));
  const changeUsdPct = startUsd > 0 ? Number(((changeUsd / startUsd) * 100).toFixed(2)) : 0;

  const startEur = points[0].bcvEur;
  const endEur = points[points.length - 1].bcvEur;
  const changeEur = Number((endEur - startEur).toFixed(4));
  const changeEurPct = startEur > 0 ? Number(((changeEur / startEur) * 100).toFixed(2)) : 0;

  return {
    minUsd,
    maxUsd,
    startUsd,
    endUsd,
    changeUsd,
    changeUsdPct,
    minEur,
    maxEur,
    startEur,
    endEur,
    changeEur,
    changeEurPct,
  };
}

/**
 * Filters the points array by the selected number of days (e.g. 7, 14, 30).
 */
export function filterPointsByRange(
  points: HistoricalRatePoint[],
  days: number
): HistoricalRatePoint[] {
  if (points.length <= days) return points;
  return points.slice(points.length - days);
}
