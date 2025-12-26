'use client';

import { Card, ProgressBar, Badge } from '@tremor/react';
import type { QMScore } from '@/types/stock';
import { formatNumber, formatPercent } from '@/lib/qm-calculator';

interface QMScoreCardProps {
  qmScore: QMScore;
}

export default function QMScoreCard({ qmScore }: QMScoreCardProps) {
  const scorePercent = (qmScore.totalScore / qmScore.maxScore) * 100;

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'emerald';
    if (score >= 5) return 'yellow';
    if (score >= 3) return 'orange';
    return 'red';
  };

  const color = getScoreColor(qmScore.totalScore);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">QM-asteikko</h2>
        <Badge color={color} size="xl">
          {qmScore.totalScore}/{qmScore.maxScore}
        </Badge>
      </div>

      <ProgressBar value={scorePercent} color={color} className="mb-6" />

      <div className="space-y-3">
        {qmScore.pillars.map((pillar, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg ${
              pillar.passed ? 'bg-emerald-50' : 'bg-red-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  pillar.passed
                    ? 'bg-emerald-500 text-white'
                    : 'bg-red-400 text-white'
                }`}
              >
                {pillar.passed ? '✓' : '✗'}
              </span>
              <div>
                <p className="font-medium text-gray-900">{pillar.name}</p>
                <p className="text-sm text-gray-500">{pillar.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">
                {typeof pillar.value === 'number'
                  ? pillar.name.includes('%') || pillar.name.includes('ROIC')
                    ? formatPercent(pillar.value)
                    : pillar.name.includes('kasvu') || pillar.name.includes('Osakkeet')
                    ? formatNumber(pillar.value)
                    : pillar.value.toFixed(2)
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-400">{pillar.threshold}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Metrics */}
      <div className="mt-6 pt-4 border-t">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">Lisämetriikat</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">ROE</p>
            <p className={`text-lg font-bold ${
              qmScore.additionalMetrics.roe && qmScore.additionalMetrics.roe > 15
                ? 'text-emerald-600'
                : 'text-gray-900'
            }`}>
              {formatPercent(qmScore.additionalMetrics.roe)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Bruttokate</p>
            <p className={`text-lg font-bold ${
              qmScore.additionalMetrics.grossMargin && qmScore.additionalMetrics.grossMargin > 40
                ? 'text-emerald-600'
                : 'text-gray-900'
            }`}>
              {formatPercent(qmScore.additionalMetrics.grossMargin)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Liikevoittokate</p>
            <p className={`text-lg font-bold ${
              qmScore.additionalMetrics.operatingMargin && qmScore.additionalMetrics.operatingMargin > 15
                ? 'text-emerald-600'
                : 'text-gray-900'
            }`}>
              {formatPercent(qmScore.additionalMetrics.operatingMargin)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Current Ratio</p>
            <p className={`text-lg font-bold ${
              qmScore.additionalMetrics.currentRatio && qmScore.additionalMetrics.currentRatio > 1.5
                ? 'text-emerald-600'
                : 'text-gray-900'
            }`}>
              {qmScore.additionalMetrics.currentRatio?.toFixed(2) || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
