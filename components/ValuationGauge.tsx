'use client';

import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import type { ValuationAnalysis } from '@/types/stock';

interface ValuationGaugeProps {
  valuation: ValuationAnalysis;
}

function ValuationRing({ percentage, status }: { percentage: number; status: string }) {
  const circumference = 2 * Math.PI * 45;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  const getColor = () => {
    if (status === 'undervalued') return '#10b981';
    if (status === 'fair') return '#f59e0b';
    if (status === 'overvalued') return '#ef4444';
    return '#94a3b8';
  };

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="56"
          cy="56"
          r="45"
          stroke="#e2e8f0"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="56"
          cy="56"
          r="45"
          stroke={getColor()}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="score-ring"
        />
      </svg>
    </div>
  );
}

export default function ValuationGauge({ valuation }: ValuationGaugeProps) {
  const getStatusConfig = (status: ValuationAnalysis['status']) => {
    switch (status) {
      case 'undervalued':
        return {
          icon: TrendingUp,
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          iconBg: 'bg-emerald-100',
        };
      case 'fair':
        return {
          icon: Minus,
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          iconBg: 'bg-amber-100',
        };
      case 'overvalued':
        return {
          icon: TrendingDown,
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          iconBg: 'bg-red-100',
        };
      default:
        return {
          icon: AlertCircle,
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          iconBg: 'bg-gray-100',
        };
    }
  };

  const config = getStatusConfig(valuation.status);
  const StatusIcon = config.icon;

  // Calculate gauge position (0-100)
  // valueGap > 0 = undervalued, valueGap < 0 = overvalued
  let gaugePosition = 50;
  if (valuation.valueGap !== null) {
    gaugePosition = 50 - (valuation.valueGap / 2);
    gaugePosition = Math.max(5, Math.min(95, gaugePosition));
  }

  return (
    <div className="card-professional p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Valuation</h2>
          <p className="text-sm text-gray-500 mt-1">Based on quality-adjusted fair P/E</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.border} border`}>
          <StatusIcon className={`w-4 h-4 ${config.text}`} />
          <span className={`text-sm font-semibold ${config.text}`}>{valuation.statusText}</span>
        </div>
      </div>

      {/* Valuation Gauge */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-medium text-gray-400 mb-2 px-1">
          <span>Undervalued</span>
          <span>Fair Value</span>
          <span>Overvalued</span>
        </div>
        <div className="value-gauge">
          <div
            className="value-gauge-marker"
            style={{ left: `${gaugePosition}%` }}
          />
        </div>
      </div>

      {/* Value Gap */}
      {valuation.valueGap !== null && (
        <div className={`p-4 rounded-xl ${config.bg} ${config.border} border mb-6`}>
          <div className="flex items-center justify-between">
            <span className={`font-medium ${config.text}`}>Value Gap</span>
            <span className={`text-2xl font-bold ${config.text}`}>
              {valuation.valueGap > 0 ? '+' : ''}{valuation.valueGap.toFixed(1)}%
            </span>
          </div>
          <p className="text-sm mt-2 text-gray-600">
            {valuation.status === 'undervalued' &&
              'Trading below intrinsic value. Potential buying opportunity.'}
            {valuation.status === 'fair' &&
              'Trading near fair value. No significant mispricing detected.'}
            {valuation.status === 'overvalued' &&
              'Trading above intrinsic value. Exercise caution.'}
            {valuation.status === 'unknown' &&
              'Unable to determine valuation due to missing data.'}
          </p>
        </div>
      )}

      {/* P/E Comparison */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <p className="text-xs font-medium text-gray-500 mb-1">QM Score</p>
          <p className="text-2xl font-bold text-gray-900">{valuation.qmScore}</p>
          <p className="text-xs text-gray-400">/ 8</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <p className="text-xs font-medium text-blue-600 mb-1">Fair P/E</p>
          <p className="text-2xl font-bold text-blue-700">{valuation.fairPE.toFixed(1)}</p>
          <p className="text-xs text-blue-400">based on quality</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-xl">
          <p className="text-xs font-medium text-purple-600 mb-1">Current P/E</p>
          <p className="text-2xl font-bold text-purple-700">
            {valuation.currentPE?.toFixed(1) || 'N/A'}
          </p>
          <p className="text-xs text-purple-400">market price</p>
        </div>
      </div>
    </div>
  );
}
