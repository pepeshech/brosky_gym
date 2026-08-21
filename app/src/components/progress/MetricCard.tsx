import React from 'react';
import type { MetricConfig } from '../../types';
import { TrendingDown, TrendingUp } from '../BroskyIcon';

export interface MetricCardProps {
  metric: MetricConfig;
  current: number | null;
  delta: string | null;
  isGood: boolean | null;
  isSelected: boolean;
  onClick: () => void;
}

export const hex2rgba = (hex: string, alpha: number) => {
  if (!hex || typeof hex !== 'string') return `rgba(0, 0, 0, ${alpha})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex[0] + cleanHex[0] + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2];
  }
  const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
  const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
  const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
};

export const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  current,
  delta,
  isGood,
  isSelected,
  onClick,
}) => {
  const color = metric.color ?? '#466bf7';
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left"
      style={{
        background: isSelected
          ? hex2rgba(color, 0.1)
          : 'rgba(255,255,255,0.5)',
        borderColor: isSelected ? `${color}80` : 'rgba(0,0,0,0.07)',
        boxShadow: isSelected ? `0 0 0 1px ${color}50, 0 4px 16px ${color}20` : 'none',
        minWidth: 110,
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {metric.name}
        </span>
      </div>
      <span className="text-xl font-bold text-gray-800 tabular-nums leading-none">
        {current != null ? current : '—'}
        <span className="text-xs font-normal text-gray-400 ml-1">{metric.unit}</span>
      </span>
      {delta != null && isGood != null && (
        <span
          className="flex items-center gap-0.5 text-xs font-semibold mt-1.5"
          style={{ color: isGood ? '#10b981' : '#ef4444' }}
        >
          {isGood ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
          {delta}
        </span>
      )}
    </button>
  );
};
