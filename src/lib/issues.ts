import type { IssueCategory, IssuePriority, IssueStatus } from '@/lib/types';

export const ISSUE_CATEGORY_OPTIONS: ReadonlyArray<{
  value: IssueCategory;
  label: string;
}> = [
  { value: 'mobility', label: '이동·외출' },
  { value: 'medication', label: '복약·건강관리' },
  { value: 'social_isolation', label: '사회적 고립' },
  { value: 'care_burden', label: '가족 돌봄 부담' },
  { value: 'service_access', label: '서비스 접근' },
  { value: 'other', label: '기타' },
];

export const ISSUE_STATUS_OPTIONS: ReadonlyArray<{
  value: IssueStatus;
  label: string;
}> = [
  { value: 'problem_defined', label: '문제정의' },
  { value: 'idea_selected', label: '아이디어 선정' },
  { value: 'prototype_ready', label: '프로토타입' },
  { value: 'field_testing', label: '현장 실증' },
  { value: 'policy_proposed', label: '정책 제안' },
  { value: 'completed', label: '완료' },
];

export const ISSUE_PRIORITY_OPTIONS: ReadonlyArray<{
  value: IssuePriority;
  label: string;
}> = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' },
];

export function getIssueCategoryLabel(category: IssueCategory) {
  return ISSUE_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category;
}

export function getIssueStatusLabel(status: IssueStatus) {
  return ISSUE_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

export function getIssuePriorityLabel(priority: IssuePriority) {
  return ISSUE_PRIORITY_OPTIONS.find((item) => item.value === priority)?.label ?? priority;
}
