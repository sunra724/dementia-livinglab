'use client';

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  editable?: boolean;
  onEdit?: (newValue: number) => void;
  color?: string;
}

export default function KpiCard({
  title,
  current,
  target,
  unit,
  trend,
  editable = false,
  onEdit,
  color,
}: KpiCardProps) {
  const percentage = target > 0 ? Math.round((current / target) * 100 * 10) / 10 : 0;
  const barColor = percentage < 50 ? 'bg-red-500' : percentage < 80 ? 'bg-yellow-500' : 'bg-green-500';

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleClick = () => {
    if (!editable || !onEdit) return;
    const newValue = prompt(`새 값 입력 (${unit}):`, current.toString());
    if (newValue !== null) {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue)) {
        onEdit(numValue);
      }
    }
  };

  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm transition-shadow ${
        editable ? 'ring-2 ring-blue-200' : ''
      } ${editable ? 'cursor-pointer hover:shadow-md' : ''}`}
      data-color={color ?? undefined}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {getTrendIcon()}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-2">
        {current}{unit} / {target}{unit}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-600">
        {percentage}% 달성
      </div>
    </div>
  );
}
