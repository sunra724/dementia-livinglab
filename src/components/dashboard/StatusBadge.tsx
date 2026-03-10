import { ProgressStatus, RoleType, LivingLabPhase } from '@/lib/types';

interface StatusBadgeProps {
  type: 'status' | 'role' | 'phase';
  value: string | number;
}

const config = {
  status: {
    not_started: { label: '미시작', bg: 'bg-gray-100', text: 'text-gray-800' },
    in_progress: { label: '진행중', bg: 'bg-blue-100', text: 'text-blue-800' },
    completed: { label: '완료', bg: 'bg-green-100', text: 'text-green-800' },
    delayed: { label: '지연', bg: 'bg-red-100', text: 'text-red-800' },
  } as Record<ProgressStatus, { label: string; bg: string; text: string }>,
  role: {
    activist: { label: '활동가', bg: 'bg-sky-100', text: 'text-sky-800' },
    institution_staff: { label: '기관담당자', bg: 'bg-orange-100', text: 'text-orange-800' },
    subject_elder: { label: '어르신', bg: 'bg-purple-100', text: 'text-purple-800' },
    subject_family: { label: '가족돌봄자', bg: 'bg-pink-100', text: 'text-pink-800' },
    facilitator: { label: '퍼실리테이터', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    expert: { label: '전문가', bg: 'bg-teal-100', text: 'text-teal-800' },
  } as Record<RoleType, { label: string; bg: string; text: string }>,
  phase: {
    1: { label: '준비', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    2: { label: '문제정의', bg: 'bg-blue-100', text: 'text-blue-800' },
    3: { label: '아이디어', bg: 'bg-amber-100', text: 'text-amber-800' },
    4: { label: '프로토타입', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    5: { label: '테스트', bg: 'bg-red-100', text: 'text-red-800' },
    6: { label: '확산', bg: 'bg-violet-100', text: 'text-violet-800' },
  } as Record<LivingLabPhase, { label: string; bg: string; text: string }>,
};

export default function StatusBadge({ type, value }: StatusBadgeProps) {
  const typeConfig = config[type] as Record<string, { label: string; bg: string; text: string }>;
  const badgeConfig = typeConfig?.[value];
  if (!badgeConfig) {
    return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">{value}</span>;
  }

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${badgeConfig.bg} ${badgeConfig.text}`}>
      {badgeConfig.label}
    </span>
  );
}