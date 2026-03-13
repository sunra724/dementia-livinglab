import { format, parseISO } from 'date-fns';
import type {
  BudgetCategory,
  KpiItem,
  LivingLabPhase,
  ProgressStatus,
  PromotionChannel,
  PromotionRecord,
} from '@/lib/types';

export const PHASE_LABELS: Record<LivingLabPhase, string> = {
  1: '준비',
  2: '문제정의',
  3: '아이디어',
  4: '프로토타입',
  5: '테스트',
  6: '확산',
};

export const PHASE_SELECT_OPTIONS = [
  { value: '', label: '전체 단계' },
  { value: '1', label: '1단계 준비' },
  { value: '2', label: '2단계 문제정의' },
  { value: '3', label: '3단계 아이디어' },
  { value: '4', label: '4단계 프로토타입' },
  { value: '5', label: '5단계 테스트' },
  { value: '6', label: '6단계 확산' },
] as const;

export const KPI_CATEGORY_OPTIONS = [
  { value: '참여', label: '참여' },
  { value: '워크숍', label: '워크숍' },
  { value: '워크시트', label: '워크시트' },
  { value: '성과', label: '성과' },
  { value: '홍보', label: '홍보' },
  { value: '예산', label: '예산' },
] as const;

export const KPI_TREND_OPTIONS = [
  { value: 'up', label: '상승' },
  { value: 'stable', label: '유지' },
  { value: 'down', label: '하락' },
] as const;

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  personnel: '인건비',
  activity: '활동비',
  workshop: '워크숍',
  printing: '인쇄물',
  travel: '교통',
  equipment: '장비',
  consulting: '자문',
  misc: '기타',
};

export const BUDGET_CATEGORY_OPTIONS = (
  Object.entries(BUDGET_CATEGORY_LABELS) as Array<[BudgetCategory, string]>
).map(([value, label]) => ({ value, label }));

export const PROMOTION_CHANNEL_LABELS: Record<PromotionChannel, string> = {
  sns_instagram: '인스타그램',
  sns_facebook: '페이스북',
  press_release: '보도자료',
  newsletter: '뉴스레터',
  event: '행사',
  video: '영상',
  other: '기타',
};

export const PROMOTION_CHANNEL_OPTIONS = (
  Object.entries(PROMOTION_CHANNEL_LABELS) as Array<[PromotionChannel, string]>
).map(([value, label]) => ({ value, label }));

export const STATUS_LABELS: Record<ProgressStatus, string> = {
  not_started: '미착수',
  in_progress: '진행중',
  completed: '완료',
  delayed: '지연',
};

export const STATUS_OPTIONS = (
  Object.entries(STATUS_LABELS) as Array<[ProgressStatus, string]>
).map(([value, label]) => ({ value, label }));

export function formatDisplayDate(value: string | null) {
  if (!value) {
    return '-';
  }

  return format(parseISO(value), 'yyyy.MM.dd');
}

export function formatCurrency(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

export function formatInteger(value: number) {
  return value.toLocaleString('ko-KR');
}

export function formatPercent(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded.toLocaleString('ko-KR')}%`;
}

export function getKpiAchievement(item: Pick<KpiItem, 'current' | 'target'>) {
  if (item.target <= 0) {
    return 0;
  }

  return (item.current / item.target) * 100;
}

export function getBudgetExecutionRate(plannedAmount: number, actualAmount: number) {
  if (plannedAmount <= 0) {
    return 0;
  }

  return (actualAmount / plannedAmount) * 100;
}

export function getPromotionCompletionRate(items: PromotionRecord[]) {
  if (!items.length) {
    return 0;
  }

  const completedCount = items.filter((item) => item.status === 'completed').length;
  return (completedCount / items.length) * 100;
}
