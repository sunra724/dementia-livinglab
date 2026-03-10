'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import useSWR from 'swr';
import { ArrowRight, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import KpiCard from '@/components/dashboard/KpiCard';
import MonthlyChart from '@/components/dashboard/MonthlyChart';
import StatusBadge from '@/components/dashboard/StatusBadge';
import DataTable, { type DataTableColumn } from '@/components/forms/DataTable';
import type { Institution, Participant, Subject } from '@/lib/types';

const ResponsiveContainer = dynamic(
  () => import('recharts').then((module) => module.ResponsiveContainer),
  { ssr: false }
);
const PieChart = dynamic(() => import('recharts').then((module) => module.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then((module) => module.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then((module) => module.Cell), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((module) => module.Tooltip), { ssr: false });

type ParticipantsResponse = {
  activists: Participant[];
  institution_staffs: Participant[];
  institutions: Institution[];
  subjects: Subject[];
};

type TabKey = 'activists' | 'institutions' | 'subjects';
type AffiliationFilter = '전체' | '경북대' | '계명대' | '대구가톨릭대' | '영남대' | '기타';

type SubjectRow = Subject & { institution_name: string };

const fetcher = async (url: string): Promise<ParticipantsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('participants_fetch_failed');
  }

  return response.json() as Promise<ParticipantsResponse>;
};

const phaseChartData = [
  { month: '1단계', 활동가: 15, 기관: 5, 대상자: 19 },
  { month: '2단계', 활동가: 13, 기관: 5, 대상자: 18 },
  { month: '3단계', 활동가: 10, 기관: 4, 대상자: 12 },
  { month: '4단계', 활동가: 6, 기관: 3, 대상자: 8 },
  { month: '5단계', 활동가: 4, 기관: 2, 대상자: 6 },
  { month: '6단계', 활동가: 2, 기관: 2, 대상자: 4 },
];

const affiliationFilterOptions: AffiliationFilter[] = ['전체', '경북대', '계명대', '대구가톨릭대', '영남대', '기타'];
const donutColors = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];
const donutSwatches = ['bg-indigo-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500'];

function formatDate(date: string | null) {
  if (!date) {
    return '-';
  }

  return format(parseISO(date), 'yyyy.MM.dd');
}

function getAffiliationGroup(affiliation: string): AffiliationFilter {
  if (affiliation.includes('경북대학교')) {
    return '경북대';
  }

  if (affiliation.includes('계명대학교')) {
    return '계명대';
  }

  if (affiliation.includes('대구가톨릭대학교')) {
    return '대구가톨릭대';
  }

  if (affiliation.includes('영남대학교')) {
    return '영남대';
  }

  return '기타';
}

function getInstitutionTypeLabel(type: Institution['type']) {
  switch (type) {
    case 'dementia_center':
      return '치매안심센터';
    case 'welfare_facility':
      return '복지시설';
    case 'university':
      return '대학';
    case 'public':
      return '공공기관';
    case 'ngo':
      return '비영리단체';
    default:
      return '기타';
  }
}

function getSubjectTypeLabel(type: Subject['type']) {
  return type === 'elder' ? '어르신' : '가족';
}

function getSubjectTypeBadge(type: Subject['type']) {
  return type === 'elder'
    ? 'bg-purple-100 text-purple-700'
    : 'bg-pink-100 text-pink-700';
}

function getDementiaStageLabel(stage: Subject['dementia_stage']) {
  switch (stage) {
    case 'normal':
      return '정상';
    case 'mild_cognitive':
      return '경도인지저하';
    case 'mild':
      return '경증 치매';
    case 'moderate':
      return '중등도 치매';
    case 'severe':
      return '중증 치매';
    default:
      return '미상';
  }
}

function renderPhaseTags(phases: number[]) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {phases.map((phase) => (
        <span
          key={phase}
          className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
        >
          {phase}단계
        </span>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-[420px] animate-pulse rounded-3xl bg-slate-200" />
      <div className="h-[280px] animate-pulse rounded-3xl bg-slate-200" />
    </div>
  );
}

function AffiliationDonutChart({ participants }: { participants: Participant[] }) {
  const groups = affiliationFilterOptions
    .filter((option) => option !== '전체')
    .map((option) => ({
      name: option,
      value: participants.filter((participant) => getAffiliationGroup(participant.affiliation) === option).length,
    }))
    .filter((item) => item.value > 0);

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">소속 대학별 분포</h3>
        <p className="text-sm text-slate-500">활동가, 퍼실리테이터, 전문가 전체 기준</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={groups} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                {groups.map((entry, index) => (
                  <Cell key={entry.name} fill={donutColors[index % donutColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {groups.map((group, index) => (
            <div key={group.name} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className={`h-3 w-3 rounded-full ${donutSwatches[index % donutSwatches.length]}`} />
                {group.name}
              </div>
              <span className="text-sm font-semibold text-slate-900">{group.value}명</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ParticipantsPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR('/api/participants', fetcher);
  const [activeTab, setActiveTab] = useState<TabKey>('activists');
  const [affiliationFilter, setAffiliationFilter] = useState<AffiliationFilter>('전체');
  const [openInstitutionId, setOpenInstitutionId] = useState<number | null>(null);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-base font-semibold">참가자 데이터를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void mutate()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const { activists, institutions, subjects } = data;

  const filteredActivists =
    affiliationFilter === '전체'
      ? activists
      : activists.filter((participant) => getAffiliationGroup(participant.affiliation) === affiliationFilter);

  const subjectRows: SubjectRow[] = subjects.map((subject) => ({
    ...subject,
    institution_name: institutions.find((institution) => institution.id === subject.institution_id)?.name ?? '-',
  }));

  const activistColumns: DataTableColumn[] = [
    { key: 'name', label: '이름', sortable: true },
    {
      key: 'role',
      label: '역할',
      render: (value) => <StatusBadge type="role" value={String(value)} />,
    },
    { key: 'affiliation', label: '소속', sortable: true },
    { key: 'contact', label: '연락처' },
    {
      key: 'joined_date',
      label: '참여일',
      sortable: true,
      render: (value) => formatDate(typeof value === 'string' ? value : null),
    },
    {
      key: 'active',
      label: '활동상태',
      render: (value) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {value ? '활동중' : '비활성'}
        </span>
      ),
    },
  ];

  const subjectColumns: DataTableColumn[] = [
    { key: 'code', label: '코드', sortable: true },
    {
      key: 'type',
      label: '유형',
      render: (value) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getSubjectTypeBadge(value as Subject['type'])}`}>
          {getSubjectTypeLabel(value as Subject['type'])}
        </span>
      ),
    },
    {
      key: 'dementia_stage',
      label: '치매단계',
      render: (value) => (
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
          {getDementiaStageLabel(value as Subject['dementia_stage'])}
        </span>
      ),
    },
    { key: 'age_group', label: '연령대' },
    { key: 'institution_name', label: '소속기관' },
    {
      key: 'consent_signed',
      label: '동의서',
      render: (value) => (value ? '✅' : '❌'),
    },
    {
      key: 'participation_phases',
      label: '참여단계',
      render: (value) => renderPhaseTags(Array.isArray(value) ? (value as number[]) : []),
    },
    {
      key: 'dropout',
      label: '탈락',
      render: (value) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            value ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {value ? '탈락' : '참여중'}
        </span>
      ),
    },
  ];

  const subjectFilterOptions = [
    {
      key: 'type',
      label: '유형',
      options: [
        { value: 'elder', label: '어르신' },
        { value: 'family_caregiver', label: '가족' },
      ],
    },
    {
      key: 'dementia_stage',
      label: '치매단계',
      options: [
        { value: 'normal', label: '정상' },
        { value: 'mild_cognitive', label: '경도인지저하' },
        { value: 'mild', label: '경증 치매' },
        { value: 'moderate', label: '중등도 치매' },
        { value: 'severe', label: '중증 치매' },
        { value: 'unknown', label: '미상' },
      ],
    },
    {
      key: 'institution_name',
      label: '기관',
      options: institutions.map((institution) => ({
        value: institution.name,
        label: institution.name,
      })),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">참가자·기관·대상자</h1>
          <p className="mt-2 text-sm text-slate-500">리빙랩 참여 주체 현황과 대상자 참여 상태를 한 화면에서 확인합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/participants')}
          className="inline-flex items-center gap-2 self-start rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          관리자 모드
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="활동가" current={activists.length} target={20} unit="명" trend="stable" color="#0ea5e9" editable={false} />
        <KpiCard
          title="기관"
          current={institutions.filter((institution) => institution.mou_signed).length}
          target={5}
          unit="개소"
          trend="stable"
          color="#f97316"
          editable={false}
        />
        <KpiCard
          title="대상자"
          current={subjects.filter((subject) => !subject.dropout).length}
          target={30}
          unit="명"
          trend="stable"
          color="#a855f7"
          editable={false}
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 pt-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'activists', label: '활동가' },
              { key: 'institutions', label: '참여기관' },
              { key: 'subjects', label: '대상자' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`rounded-t-2xl px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 p-6">
          {activeTab === 'activists' && (
            <>
              <div className="flex flex-wrap gap-2">
                {affiliationFilterOptions.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setAffiliationFilter(filter)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      affiliationFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <DataTable
                data={filteredActivists}
                columns={activistColumns}
                editable={false}
                searchable
                emptyMessage="조건에 맞는 활동가가 없습니다."
              />

              <AffiliationDonutChart participants={filteredActivists} />
            </>
          )}

          {activeTab === 'institutions' && (
            <div className="grid gap-4 xl:grid-cols-2">
              {institutions.map((institution) => {
                const isOpen = openInstitutionId === institution.id;
                const institutionSubjects = subjectRows.filter((subject) => subject.institution_id === institution.id);

                return (
                  <div key={institution.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <button
                      type="button"
                      onClick={() => setOpenInstitutionId(isOpen ? null : institution.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🏥</span>
                            <h3 className="text-lg font-semibold text-slate-950">{institution.name}</h3>
                          </div>
                          <p className="mt-3 text-sm text-slate-600">
                            유형: {getInstitutionTypeLabel(institution.type)} | MOU: {institution.mou_signed ? '✅' : '❌'}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            담당자: {institution.contact_person} | {institution.contact}
                          </p>
                        </div>
                        <div className="rounded-full bg-white p-2 text-slate-500 shadow-sm">
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {institution.participating_phases.map((phase) => (
                          <StatusBadge key={phase} type="phase" value={phase} />
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                        <span>소속 대상자: {institutionSubjects.length}명</span>
                        <span className="font-medium text-slate-900">{isOpen ? '목록 닫기' : '목록 보기'}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mt-4">
                        <DataTable
                          data={institutionSubjects}
                          columns={subjectColumns.filter((column) =>
                            ['code', 'type', 'dementia_stage', 'age_group', 'consent_signed', 'dropout'].includes(column.key)
                          )}
                          editable={false}
                          emptyMessage="연결된 대상자가 없습니다."
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'subjects' && (
            <>
              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>대상자 정보는 익명 코드로 관리됩니다. 실명은 별도 오프라인 문서로 보관하세요.</p>
                </div>
              </div>

              <DataTable
                data={subjectRows}
                columns={subjectColumns}
                editable={false}
                searchable
                filterOptions={subjectFilterOptions}
                emptyMessage="조건에 맞는 대상자가 없습니다."
              />
            </>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-950">단계별 참여 현황</h2>
          <p className="text-sm text-slate-500">현재는 더미 데이터로 표시되는 단계별 참여 추이입니다.</p>
        </div>
        <MonthlyChart
          data={phaseChartData}
          dataKeys={['활동가', '기관', '대상자']}
          colors={['#0ea5e9', '#f97316', '#a855f7']}
          type="bar"
        />
      </div>
    </div>
  );
}
