import React from 'react';

export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number | string }>;
  label?: string;
  unit: string;
  color: string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  unit,
  color,
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-2xl px-4 py-3 text-sm shadow-xl border"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          borderColor: `${color}40`,
          boxShadow: `0 4px 24px ${color}20`,
        }}
      >
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="font-bold text-gray-800 text-base">
          {payload[0].value} <span className="text-xs font-normal text-gray-500">{unit}</span>
        </p>
      </div>
    );
  }
  return null;
};
