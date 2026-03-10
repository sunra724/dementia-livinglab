'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
  label: string;
  current: number;
  target: number;
  color?: 'indigo' | 'blue' | 'amber' | 'emerald' | 'red' | 'violet' | 'sky' | 'orange' | 'slate';
  showPercent?: boolean;
}

const colorClassMap = {
  indigo: 'bg-indigo-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
  violet: 'bg-violet-500',
  sky: 'bg-sky-500',
  orange: 'bg-orange-500',
  slate: 'bg-slate-500',
} as const;

export default function ProgressBar({
  label,
  current,
  target,
  color = 'blue',
  showPercent = true,
}: ProgressBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = target > 0 ? Math.round((current / target) * 100 * 10) / 10 : 0;
  const colorClassName = colorClassMap[color];

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showPercent && (
          <span className="text-sm text-gray-500">
            {current} / {target} ({percentage}%)
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-700 ease-out ${colorClassName}`}
          style={{ width: `${Math.min(animatedWidth, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}
