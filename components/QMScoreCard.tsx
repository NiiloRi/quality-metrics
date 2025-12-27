'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import Image from 'next/image';
import type { QMScore } from '@/types/stock';
import { formatNumber, formatPercent } from '@/lib/qm-calculator';

// Icon mapping for each pillar (in order)
const PILLAR_ICONS = [
  '/icons/1-pe-5y.png',
  '/icons/2-roic-5y.png',
  '/icons/3-shares-buyback.png',
  '/icons/4-fcf-growth.png',
  '/icons/5-income-growth.png',
  '/icons/6-revenue-growth.png',
  '/icons/7-debt-ratio.png',
  '/icons/8-pfcf-5y.png',
];

interface QMScoreCardProps {
  qmScore: QMScore;
}

function ScoreRing({ score, maxScore }: { score: number; maxScore: number }) {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 7) return 'var(--success)';
    if (score >= 5) return 'var(--primary)';
    if (score >= 3) return '#f97316';
    return 'var(--danger)';
  };

  const color = getColor(score);

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="var(--background-secondary)"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="score-ring"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[var(--foreground)] font-mono">{score}</span>
        <span className="text-sm text-[var(--foreground-muted)]">/ {maxScore}</span>
      </div>
    </div>
  );
}

function PillarRow({ pillar, index }: { pillar: QMScore['pillars'][0]; index: number }) {
  const formatValue = (value: number | null, name: string): string => {
    if (value === null || value === undefined) return 'N/A';
    if (name.includes('ROIC') || name.includes('%')) return formatPercent(value);
    // For shares and growth, show percentage change with sign
    if (name.includes('kasvu') || name.includes('Osakkeet')) {
      const sign = value > 0 ? '+' : '';
      return `${sign}${value.toFixed(1)}%`;
    }
    return value.toFixed(2);
  };

  const iconSrc = PILLAR_ICONS[index] || PILLAR_ICONS[0];
  const hasIcon = index < PILLAR_ICONS.length;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
      <div className="relative w-10 h-10 flex-shrink-0">
        {hasIcon ? (
          <Image
            src={iconSrc}
            alt={pillar.name}
            width={40}
            height={40}
            className="object-contain"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pillar.passed ? 'bg-[var(--success)]/20' : 'bg-[var(--danger)]/20'}`}>
            {pillar.passed ? (
              <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
            ) : (
              <XCircle className="w-5 h-5 text-[var(--danger)]" />
            )}
          </div>
        )}
        {hasIcon && (
          <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ${pillar.passed ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`}>
            {pillar.passed ? (
              <CheckCircle2 className="w-3 h-3 text-white" />
            ) : (
              <XCircle className="w-3 h-3 text-white" />
            )}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--foreground)] text-sm">{pillar.name}</p>
        <p className="text-xs text-[var(--foreground-muted)]">{pillar.threshold}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold font-mono ${pillar.passed ? 'text-[var(--success-light)]' : 'text-[var(--danger-light)]'}`}>
          {formatValue(pillar.value, pillar.name)}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, isGood }: { label: string; value: string; isGood?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-[var(--background-secondary)]">
      <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${isGood ? 'text-[var(--success-light)]' : 'text-[var(--foreground)]'}`}>
        {value}
      </p>
    </div>
  );
}

export default function QMScoreCard({ qmScore }: QMScoreCardProps) {
  const getGrade = (score: number) => {
    if (score >= 7) return { grade: 'Excellent', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' };
    if (score >= 5) return { grade: 'Good', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/30' };
    if (score >= 3) return { grade: 'Fair', color: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/30' };
    return { grade: 'Poor', color: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/30' };
  };

  const gradeInfo = getGrade(qmScore.totalScore);

  return (
    <div className="card-professional p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)] font-heading">Quality Score</h2>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">Based on fundamental quality metrics</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${gradeInfo.bg} ${gradeInfo.color} ${gradeInfo.border} border`}>
          {gradeInfo.grade}
        </span>
      </div>

      {/* Score Ring */}
      <div className="flex justify-center mb-6">
        <ScoreRing score={qmScore.totalScore} maxScore={qmScore.maxScore} />
      </div>

      {/* QM Criteria */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3">QM Criteria</h3>
        <div className="bg-[var(--background-secondary)] rounded-xl p-4">
          {qmScore.pillars.map((pillar, index) => (
            <PillarRow key={index} pillar={pillar} index={index} />
          ))}
        </div>
      </div>

      {/* Additional Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3">Additional Metrics</h3>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="ROE"
            value={formatPercent(qmScore.additionalMetrics.roe)}
            isGood={qmScore.additionalMetrics.roe !== null && qmScore.additionalMetrics.roe > 15}
          />
          <MetricCard
            label="Gross Margin"
            value={formatPercent(qmScore.additionalMetrics.grossMargin)}
            isGood={qmScore.additionalMetrics.grossMargin !== null && qmScore.additionalMetrics.grossMargin > 40}
          />
          <MetricCard
            label="Operating Margin"
            value={formatPercent(qmScore.additionalMetrics.operatingMargin)}
            isGood={qmScore.additionalMetrics.operatingMargin !== null && qmScore.additionalMetrics.operatingMargin > 15}
          />
          <MetricCard
            label="Current Ratio"
            value={qmScore.additionalMetrics.currentRatio?.toFixed(2) || 'N/A'}
            isGood={qmScore.additionalMetrics.currentRatio !== null && qmScore.additionalMetrics.currentRatio > 1.5}
          />
        </div>
      </div>
    </div>
  );
}
