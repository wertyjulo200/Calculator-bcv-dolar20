import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generate30DayHistoricalData,
  calculateTrendMetrics,
  filterPointsByRange,
} from './historyAnalysis';

test('generate30DayHistoricalData generates exactly 30 data points', () => {
  const points = generate30DayHistoricalData(889.2553, 992.8002);
  assert.equal(points.length, 30);
});

test('generate30DayHistoricalData ends with the current rate on day 30', () => {
  const points = generate30DayHistoricalData(889.2553, 992.8002);
  const last = points[points.length - 1];
  assert.equal(last.bcvUsd, 889.2553);
  assert.equal(last.bcvEur, 992.8002);
});

test('generate30DayHistoricalData has valid dates and displays', () => {
  const points = generate30DayHistoricalData(889.2553, 992.8002);
  for (const p of points) {
    assert.ok(p.date.length === 10);
    assert.ok(p.displayDate.length > 0);
    assert.ok(p.bcvUsd > 0);
    assert.ok(p.bcvEur > 0);
  }
});

test('calculateTrendMetrics calculates correct min, max, and percentage change', () => {
  const mockPoints = [
    { date: '2026-10-01', displayDate: '01 oct', bcvUsd: 800, bcvEur: 900 },
    { date: '2026-10-15', displayDate: '15 oct', bcvUsd: 840, bcvEur: 940 },
    { date: '2026-10-30', displayDate: '30 oct', bcvUsd: 880, bcvEur: 990 },
  ];

  const metrics = calculateTrendMetrics(mockPoints);
  assert.equal(metrics.minUsd, 800);
  assert.equal(metrics.maxUsd, 880);
  assert.equal(metrics.startUsd, 800);
  assert.equal(metrics.endUsd, 880);
  assert.equal(metrics.changeUsd, 80);
  assert.equal(metrics.changeUsdPct, 10); // (80 / 800) * 100 = 10%

  assert.equal(metrics.minEur, 900);
  assert.equal(metrics.maxEur, 990);
  assert.equal(metrics.changeEur, 90);
  assert.equal(metrics.changeEurPct, 10); // (90 / 900) * 100 = 10%
});

test('filterPointsByRange slices correctly', () => {
  const points = generate30DayHistoricalData(889.2553, 992.8002);
  const week = filterPointsByRange(points, 7);
  assert.equal(week.length, 7);
  assert.equal(week[week.length - 1].bcvUsd, 889.2553);

  const twoWeeks = filterPointsByRange(points, 14);
  assert.equal(twoWeeks.length, 14);

  const full = filterPointsByRange(points, 30);
  assert.equal(full.length, 30);
});
