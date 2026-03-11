import type {
  ChecklistItem,
  FacilitatorRole,
  FieldPhoto,
  LivingLabPhase,
  PhaseGateResult,
  SafetySeverity,
  SafetyLogType,
} from '@/lib/types';

export const PHASES: LivingLabPhase[] = [1, 2, 3, 4, 5, 6];

export const FACILITATOR_ROLE_ORDER: FacilitatorRole[] = [
  'facilitator',
  'recorder',
  'safety_officer',
  'photographer',
];

export const FACILITATOR_ROLE_LABELS: Record<FacilitatorRole, string> = {
  facilitator: '진행(MC)',
  recorder: '기록',
  safety_officer: '안전 담당',
  photographer: '촬영',
};

export const FACILITATOR_ROLE_ICON_LABELS: Record<FacilitatorRole, string> = {
  facilitator: '🎤 진행(MC)',
  recorder: '📝 기록',
  safety_officer: '🛡️ 안전 담당',
  photographer: '📷 촬영',
};

export const FACILITATOR_ROLE_DESCRIPTIONS: Record<FacilitatorRole, string> = {
  facilitator: '전체 흐름을 진행하고 시간을 조율합니다.',
  recorder: '논의 내용과 관찰 메모를 정리합니다.',
  safety_officer: '안전·윤리 체크와 중단 기준을 확인합니다.',
  photographer: '동의 여부를 확인하고 현장 기록 사진을 남깁니다.',
};

export const SAFETY_LOG_TYPE_LABELS: Record<SafetyLogType, string> = {
  consent: '동의',
  anonymization: '익명화',
  incident: '사고·징후',
  stop_criterion: '중단 기준',
};

export const SAFETY_SEVERITY_LABELS: Record<SafetySeverity, string> = {
  info: 'info',
  warning: 'warning',
  critical: 'critical',
};

export const SAFETY_SEVERITY_STYLES: Record<SafetySeverity, string> = {
  info: 'border-green-200 bg-green-50 text-green-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  critical: 'border-red-200 bg-red-50 text-red-700',
};

export function isSafetyChecklistItem(item: ChecklistItem) {
  return item.category === 'safety';
}

export function calculatePhaseGateResults(items: ChecklistItem[]): PhaseGateResult[] {
  return PHASES.map((phase) => {
    const safetyItems = items.filter((item) => item.phase === phase && isSafetyChecklistItem(item));
    const blockingItems = safetyItems.filter((item) => item.required && !item.completed);
    const warningItems = safetyItems.filter((item) => !item.required && !item.completed);

    return {
      phase,
      can_proceed: blockingItems.length === 0,
      blocking_items: blockingItems,
      warning_items: warningItems,
    };
  });
}

export function getBlockingGateForPhase(
  phase: LivingLabPhase,
  gateResults?: PhaseGateResult[]
): PhaseGateResult | null {
  if (!gateResults || phase === 1) {
    return null;
  }

  const previousPhase = (phase - 1) as LivingLabPhase;
  const previousGate = gateResults.find((result) => result.phase === previousPhase) ?? null;

  return previousGate && !previousGate.can_proceed ? previousGate : null;
}

export function getPhotoUrl(photo: Pick<FieldPhoto, 'filename'>) {
  return `/uploads/photos/${photo.filename}`;
}
