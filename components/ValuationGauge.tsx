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
    if (status === 'undervalued') return 'var(--success)';
    if (status === 'fair') return 'var(--primary)';
    if (status === 'overvalued') return 'var(--danger)';
    return 'var(--foreground-muted)';
  };

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="56"
          cy="56"
          r="45"
          stroke="var(--background-secondary)"
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
          bg: 'bg-emerald-500/15',
          text: 'text-emerald-300',
          border: 'border-emerald-500/30',
        };
      case 'fair':
        return {
          icon: Minus,
          bg: 'bg-amber-500/15',
          text: 'text-amber-300',
          border: 'border-amber-500/30',
        };
      case 'overvalued':
        return {
          icon: TrendingDown,
          bg: 'bg-red-500/15',
          text: 'text-red-300',
          border: 'border-red-500/30',
        };
      default:
        return {
          icon: AlertCircle,
          bg: 'bg-[var(--background-secondary)]',
          text: 'text-[var(--foreground-muted)]',
          border: 'border-[var(--border)]',
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
          <h2 className="text-lg font-bold text-[var(--foreground)] font-heading">Valuation</h2>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">Based on quality-adjusted fair P/E</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.border} border`}>
          <StatusIcon className={`w-4 h-4 ${config.text}`} />
          <span className={`text-sm font-semibold ${config.text}`}>{valuation.statusText}</span>
        </div>
      </div>

      {/* Valuation Gauge */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-medium text-[var(--foreground-muted)] mb-2 px-1">
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
            <span className={`text-2xl font-bold font-mono ${config.text}`}>
              {valuation.valueGap > 0 ? '+' : ''}{valuation.valueGap.toFixed(1)}%
            </span>
          </div>
          <p className="text-sm mt-2 text-[var(--foreground-secondary)]">
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
        <div className="text-center p-4 bg-[var(--background-secondary)] rounded-xl">
          <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1">QM Score</p>
          <p className="text-2xl font-bold text-[var(--foreground)] font-mono">{valuation.qmScore}</p>
          <p className="text-xs text-[var(--foreground-muted)]">/ 8</p>
        </div>
        <div className="text-center p-4 bg-amber-500/10 rounded-xl">
          <p className="text-xs font-medium text-amber-300 mb-1">Fair P/E</p>
          <p className="text-2xl font-bold text-amber-300 font-mono">{valuation.fairPE.toFixed(1)}</p>
          <p className="text-xs text-amber-300/60">based on quality</p>
        </div>
        <div className="text-center p-4 bg-blue-500/10 rounded-xl">
          <p className="text-xs font-medium text-blue-300 mb-1">Current P/E</p>
          <p className="text-2xl font-bold text-blue-300 font-mono">
            {valuation.currentPE?.toFixed(1) || 'N/A'}
          </p>
          <p className="text-xs text-blue-300/60">market price</p>
        </div>
      </div>
    </div>
  );
}
