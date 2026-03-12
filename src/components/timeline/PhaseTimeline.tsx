'use client';

import { Check, Circle, Lock } from 'lucide-react';
import type { LivingLabPhase, PhaseGateResult, ProgressStatus } from '@/lib/types';
import { getBlockingGateForPhase } from '@/lib/safety';

interface PhaseTimelineProps {
  currentPhase: LivingLabPhase;
  phaseStatuses: Partial<Record<LivingLabPhase, ProgressStatus>>;
  gateResults?: PhaseGateResult[];
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
  gateResults,
  onPhaseClick,
  showLabels = true,
}: PhaseTimelineProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[720px] items-start justify-between gap-3 pb-2">
        {phases.map((phaseInfo, index) => {
          const status = phaseStatuses[phaseInfo.phase] ?? 'not_started';
          const isCompleted = status === 'completed';
          const isInProgress = status === 'in_progress';
          const isCurrent = phaseInfo.phase === currentPhase;
          const blockingGate = getBlockingGateForPhase(phaseInfo.phase, gateResults);

          let iconColor = 'text-slate-400';
          let bgColor = 'bg-slate-200';
          let borderColor = 'border-slate-300';

          if (isCompleted || isInProgress || isCurrent) {
            iconColor = 'text-white';
            bgColor = phaseInfo.color;
            borderColor = phaseInfo.color;
          }

          return (
            <div key={phaseInfo.phase} className="flex flex-1 items-start">
              <div className="group relative flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onPhaseClick?.(phaseInfo.phase)}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 ${borderColor} ${bgColor} transition-all ${
                    isInProgress ? 'animate-pulse' : ''
                  } ${onPhaseClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                >
                  {isCompleted ? (
                    <Check size={18} className={iconColor} />
                  ) : (
                    <Circle size={12} className={iconColor} />
                  )}
                  {blockingGate ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow">
                      <Lock className="h-3 w-3" />
                    </span>
                  ) : null}
                </button>
                {blockingGate ? (
                  <div className="pointer-events-none absolute left-1/2 top-12 z-20 w-56 -translate-x-1/2 rounded-xl border border-red-200 bg-white p-3 text-left opacity-0 shadow-lg transition group-hover:opacity-100">
                    <p className="text-xs font-semibold text-red-600">⛔ 진행 불가</p>
                    <p className="mt-1 text-xs text-slate-600">미완료 필수 항목:</p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-700">
                      {blockingGate.blocking_items.map((item) => (
                        <li key={item.id}>• {item.title}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {showLabels ? (
                  <div className="mt-3 text-center text-xs font-medium text-slate-600">
                    <div>{phaseInfo.phase}단계</div>
                    <div className="whitespace-nowrap">{phaseInfo.label}</div>
                  </div>
                ) : null}
              </div>
              {index < phases.length - 1 ? (
                <div className={`mt-5 h-0.5 flex-1 ${isCompleted ? phaseInfo.color : 'bg-slate-300'}`} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
