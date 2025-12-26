'use client';

import { Card, ProgressBar, Badge } from '@tremor/react';
import type { ValuationAnalysis } from '@/types/stock';

interface ValuationGaugeProps {
  valuation: ValuationAnalysis;
}

export default function ValuationGauge({ valuation }: ValuationGaugeProps) {
  const getStatusColor = (status: ValuationAnalysis['status']) => {
    switch (status) {
      case 'undervalued':
        return 'emerald';
      case 'fair':
        return 'yellow';
      case 'overvalued':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusBg = (status: ValuationAnalysis['status']) => {
    switch (status) {
      case 'undervalued':
        return 'bg-emerald-100 text-emerald-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'overvalued':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate progress bar value (0-100)
  // Undervalued: green side (0-40), Fair: middle (40-60), Overvalued: red side (60-100)
  let progressValue = 50;
  if (valuation.valueGap !== null) {
    // valueGap > 0 = undervalued, valueGap < 0 = overvalued
    // Map -50% to +50% range to 0-100 scale (inverted so undervalued is left/green)
    progressValue = 50 - (valuation.valueGap / 2);
    progressValue = Math.max(0, Math.min(100, progressValue));
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Arvostusanalyysi</h2>
        <Badge color={getStatusColor(valuation.status)} size="lg">
          {valuation.status === 'undervalued' && '🟢'}
          {valuation.status === 'fair' && '🟡'}
          {valuation.status === 'overvalued' && '🔴'}
          {valuation.status === 'unknown' && '⚪'}
          {' '}{valuation.statusText}
        </Badge>
      </div>

      {/* Value Gap Gauge */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Aliarvostettu</span>
          <span>Oikein hinnoiteltu</span>
          <span>Yliarvostettu</span>
        </div>
        <div className="relative h-4 bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-400 rounded-full">
          <div
            className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-800 rounded-full transform -translate-x-1/2 shadow-lg"
            style={{ left: `${progressValue}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">QM-pisteet</p>
          <p className="text-2xl font-bold text-gray-900">{valuation.qmScore}/8</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-500">Fair P/E</p>
          <p className="text-2xl font-bold text-blue-600">{valuation.fairPE.toFixed(1)}</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-gray-500">Current P/E</p>
          <p className="text-2xl font-bold text-purple-600">
            {valuation.currentPE?.toFixed(1) || 'N/A'}
          </p>
        </div>
      </div>

      {/* Value Gap Detail */}
      {valuation.valueGap !== null && (
        <div className={`mt-4 p-4 rounded-lg ${getStatusBg(valuation.status)}`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">Value Gap</span>
            <span className="text-xl font-bold">
              {valuation.valueGap > 0 ? '+' : ''}{valuation.valueGap.toFixed(1)}%
            </span>
          </div>
          <p className="text-sm mt-1 opacity-80">
            {valuation.status === 'undervalued' &&
              'Osake on halvempi kuin laatunsa perusteella pitäisi. Potentiaalinen ostokohde.'}
            {valuation.status === 'fair' &&
              'Osake on hinnoiteltu lähellä laatutasoaan. Ei merkittävää ali- tai yliarvostusta.'}
            {valuation.status === 'overvalued' &&
              'Osake on kalliimpi kuin laatunsa perusteella pitäisi. Varovaisuutta.'}
          </p>
        </div>
      )}
    </Card>
  );
}
