'use client';

import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { QMScore } from '@/types/stock';
import { formatNumber, formatPercent } from '@/lib/qm-calculator';

interface QMScoreCardProps {
  qmScore: QMScore;
}

function ScoreRing({ score, maxScore }: { score: number; maxScore: number }) {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 7) return '#10b981';
    if (score >= 5) return '#f59e0b';
    if (score >= 3) return '#f97316';
    return '#ef4444';
  };

  const color = getColor(score);

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="#e2e8f0"
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
        <span className="text-3xl font-bold text-gray-900">{score}</span>
        <span className="text-sm text-gray-500">/ {maxScore}</span>
      </div>
    </div>
  );
}

function PillarRow({ pillar }: { pillar: QMScore['pillars'][0] }) {
  const formatValue = (value: number | null, name: string): string => {
    if (value === null || value === undefined) return 'N/A';
    if (name.includes('ROIC') || name.includes('%')) return formatPercent(value);
    if (name.includes('kasvu') || name.includes('Osakkeet')) {
      return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
    }
    return value.toFixed(2);
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`p-1 rounded-full ${pillar.passed ? 'text-emerald-500' : 'text-red-400'}`}>
        {pillar.passed ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <XCircle className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm">{pillar.name}</p>
        <p className="text-xs text-gray-500">{pillar.threshold}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${pillar.passed ? 'text-emerald-600' : 'text-red-500'}`}>
          {formatValue(pillar.value, pillar.name)}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, isGood }: { label: string; value: string; isGood?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${isGood ? 'text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}

export default function QMScoreCard({ qmScore }: QMScoreCardProps) {
  const getGrade = (score: number) => {
    if (score >= 7) return { grade: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (score >= 5) return { grade: 'Good', color: 'text-amber-600', bg: 'bg-amber-50' };
    if (score >= 3) return { grade: 'Fair', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { grade: 'Poor', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const gradeInfo = getGrade(qmScore.totalScore);

  return (
    <div className="card-professional p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Quality Score</h2>
          <p className="text-sm text-gray-500 mt-1">Based on fundamental quality metrics</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${gradeInfo.bg} ${gradeInfo.color}`}>
          {gradeInfo.grade}
        </span>
      </div>

      {/* Score Ring */}
      <div className="flex justify-center mb-6">
        <ScoreRing score={qmScore.totalScore} maxScore={qmScore.maxScore} />
      </div>

      {/* Pillars */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">Quality Pillars</h3>
        <div className="bg-gray-50 rounded-xl p-4">
          {qmScore.pillars.map((pillar, index) => (
            <PillarRow key={index} pillar={pillar} />
          ))}
        </div>
      </div>

      {/* Additional Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-3">Additional Metrics</h3>
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
