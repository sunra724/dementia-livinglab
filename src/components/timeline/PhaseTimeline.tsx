'use client';

import { LivingLabPhase, ProgressStatus } from '@/lib/types';
import { Check, Circle } from 'lucide-react';

interface PhaseTimelineProps {
  currentPhase: LivingLabPhase;
  phaseStatuses: Partial<Record<LivingLabPhase, ProgressStatus>>;
  onPhaseClick?: (phase: LivingLabPhase) => void;
  showLabels?: boolean;
}

const phases = [
  { phase: 1 as LivingLabPhase, label: '준비', color: 'bg-indigo-500' },
  { phase: 2 as LivingLabPhase, label: '문제정의', color: 'bg-blue-500' },
  { phase: 3 as LivingLabPhase, label: '아이디어', color: 'bg-amber-500' },
  { phase: 4 as LivingLabPhase, label: '프로토', color: 'bg-emerald-500' },
  { phase: 5 as LivingLabPhase, label: '테스트', color: 'bg-red-500' },
  { phase: 6 as LivingLabPhase, label: '확산', color: 'bg-violet-500' },
];

export default function PhaseTimeline({
  currentPhase,
  phaseStatuses,
  onPhaseClick,
  showLabels = true,
}: PhaseTimelineProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[720px] items-start justify-between gap-3 pb-2">
        {phases.map((phaseInfo, index) => {
          const status = phaseStatuses[phaseInfo.phase] || 'not_started';
          const isCompleted = status === 'completed';
          const isInProgress = status === 'in_progress';
          const isCurrent = phaseInfo.phase === currentPhase;

          let iconColor = 'text-gray-400';
          let bgColor = 'bg-gray-200';
          let borderColor = 'border-gray-300';

          if (isCompleted || isInProgress || isCurrent) {
            iconColor = 'text-white';
            bgColor = phaseInfo.color;
            borderColor = phaseInfo.color;
          }

          return (
            <div key={phaseInfo.phase} className="flex flex-1 items-start">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onPhaseClick?.(phaseInfo.phase)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${borderColor} ${bgColor} transition-all ${
                    isInProgress ? 'animate-pulse' : ''
                  } ${onPhaseClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                >
                  {isCompleted ? <Check size={18} className={iconColor} /> : <Circle size={12} className={iconColor} />}
                </button>
                {showLabels && (
                  <div className="mt-3 text-center text-xs font-medium text-gray-600">
                    <div>{phaseInfo.phase}단계</div>
                    <div className="whitespace-nowrap">{phaseInfo.label}</div>
                  </div>
                )}
              </div>
              {index < phases.length - 1 && (
                <div className={`mt-5 h-0.5 flex-1 ${isCompleted ? phaseInfo.color : 'bg-gray-300'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
