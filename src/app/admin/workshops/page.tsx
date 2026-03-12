'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, ChevronDown, ChevronUp, ClipboardCheck } from 'lucide-react';
import DataTable, { type DataTableColumn } from '@/components/forms/DataTable';
import PhotoGallery from '@/components/photos/PhotoGallery';
import PhotoUploader from '@/components/photos/PhotoUploader';
import RoleBoard from '@/components/roles/RoleBoard';
import TokenManager from '@/components/worksheets/TokenManager';
import {
  WORKSHOP_TEMPLATE_MAP,
  type FacilitatorRole,
  type FacilitatorRoleAssignment,
  type FieldPhoto,
  type LivingLabPhase,
  type Participant,
  type ProgressStatus,
  type Workshop,
  type WorksheetEntry,
  type WorksheetTemplateKey,
  type WorksheetToken,
} from '@/lib/types';
import { getWorksheetTemplateLabel } from '@/lib/worksheets';

interface WorkshopsResponse {
  workshops: Workshop[];
  worksheetEntries: WorksheetEntry[];
}

interface WorksheetsResponse {
  entries: WorksheetEntry[];
  tokens: WorksheetToken[];
}

interface RolesResponse {
  assignments: FacilitatorRoleAssignment[];
  available_participants: Participant[];
}

interface PhotosResponse {
  photos: FieldPhoto[];
}

interface WorkshopTableRow {
  id: number;
  title: string;
  phase: LivingLabPhase;
  scheduled_date: string;
  actual_date: string | null;
  location: string;
  participants_count: number;
  status: ProgressStatus;
  templates: string;
  worksheet_summary: string;
  description: string;
  outcome_summary: string;
}

interface AdminWorkshopDetailProps {
  workshop: Workshop;
  entries: WorksheetEntry[];
  tokens: WorksheetToken[];
  onCreateToken: (workshopId: number, templateKey: WorksheetTemplateKey) => Promise<{ token: string; url: string }>;
  onDeactivateToken: (tokenId: number) => Promise<void>;
}

const fetcher = async <T,>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}_fetch_failed`);
  }

  return (await response.json()) as T;
};

const phaseBadgeClasses: Record<LivingLabPhase, string> = {
  1: 'bg-indigo-100 text-indigo-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-amber-100 text-amber-700',
  4: 'bg-emerald-100 text-emerald-700',
  5: 'bg-red-100 text-red-700',
  6: 'bg-violet-100 text-violet-700',
};

const phaseLabels: Record<LivingLabPhase, string> = {
  1: '준비',
  2: '문제정의',
  3: '아이디어',
  4: '프로토타입',
  5: '테스트',
  6: '확산',
};

const phaseOptions: LivingLabPhase[] = [1, 2, 3, 4, 5, 6];

const statusBadgeClasses: Record<ProgressStatus, string> = {
  not_started: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  delayed: 'bg-red-100 text-red-700',
};

const statusLabels: Record<ProgressStatus, string> = {
  not_started: '예정',
  in_progress: '진행 중',
  completed: '완료',
  delayed: '지연',
};

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  return format(parseISO(value), 'yyyy.MM.dd');
}

function buildTemplates(workshopId: number) {
  const templateKeys = WORKSHOP_TEMPLATE_MAP[workshopId] ?? [];
  return templateKeys.length
    ? templateKeys.map((templateKey) => getWorksheetTemplateLabel(templateKey)).join(', ')
    : '-';
}

function AdminWorkshopDetail({
  workshop,
  entries,
  tokens,
  onCreateToken,
  onDeactivateToken,
}: AdminWorkshopDetailProps) {
  const {
    data: roleData,
    mutate: mutateRoles,
  } = useSWR<RolesResponse>(`/api/roles?workshop_id=${workshop.id}`, fetcher);
  const {
    data: photoData,
    mutate: mutatePhotos,
  } = useSWR<PhotosResponse>(`/api/photos?workshop_id=${workshop.id}`, fetcher);

  const assignRole = async (participantId: number, role: FacilitatorRole, notes: string) => {
    const response = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workshop_id: workshop.id,
        participant_id: participantId,
        role,
        notes,
      }),
    });

    if (!response.ok) {
      throw new Error('assign_role_failed');
    }

    await mutateRoles();
  };

  const removeRole = async (id: number) => {
    const response = await fetch('/api/roles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error('remove_role_failed');
    }

    await mutateRoles();
  };

  const deletePhoto = async (id: number) => {
    const response = await fetch('/api/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error('delete_photo_failed');
    }

    await mutatePhotos();
  };

  const toggleConsent = async (id: number, verified: boolean) => {
    const response = await fetch('/api/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, consent_verified: verified }),
    });

    if (!response.ok) {
      throw new Error('toggle_consent_failed');
    }

    await mutatePhotos();
  };

  return (
    <div className="space-y-5 border-t border-slate-200 px-6 py-6">
      <RoleBoard
        workshopId={workshop.id}
        workshopTitle={workshop.title}
        assignments={roleData?.assignments ?? []}
        availableParticipants={roleData?.available_participants ?? []}
        editable
        onAssign={assignRole}
        onRemove={removeRole}
      />

      <TokenManager
        workshopId={workshop.id}
        workshopTitle={`[${workshop.id}] ${workshop.title}`}
        availableTemplates={WORKSHOP_TEMPLATE_MAP[workshop.id] ?? []}
        tokens={tokens}
        onCreateToken={(templateKey) => onCreateToken(workshop.id, templateKey)}
        onDeactivate={onDeactivateToken}
      />

      <div className="rounded-[28px] border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">워크시트 제출 목록</h3>
        <div className="mt-4 space-y-3">
          {entries.length ? (
            entries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{getWorksheetTemplateLabel(entry.template_key)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.filled_by_name} {entry.group_name ? `(${entry.group_name})` : ''} · {formatDate(entry.submitted_at)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      entry.reviewed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {entry.reviewed ? '검토 완료' : '검토 대기'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              아직 제출된 워크시트가 없습니다.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">결과 요약</h3>
        <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
          {workshop.outcome_summary || '결과 요약은 상단 테이블에서 수정할 수 있습니다.'}
        </p>
      </div>

      <PhotoUploader
        workshopId={workshop.id}
        phase={workshop.phase}
        onUpload={() => {
          void mutatePhotos();
        }}
      />

      <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">현장 사진</h3>
          <p className="mt-1 text-sm text-slate-500">동의 확인 상태를 토글하거나 사진을 삭제할 수 있습니다.</p>
        </div>
        <PhotoGallery
          photos={photoData?.photos ?? []}
          editable
          onDelete={deletePhoto}
          onConsentToggle={toggleConsent}
        />
      </div>
    </div>
  );
}

export default function AdminWorkshopsPage() {
  const {
    data: workshopData,
    error: workshopError,
    isLoading: workshopLoading,
    mutate: mutateWorkshops,
  } = useSWR<WorkshopsResponse>('/api/workshops', fetcher);
  const {
    data: worksheetData,
    error: worksheetError,
    isLoading: worksheetLoading,
    mutate: mutateWorksheets,
  } = useSWR<WorksheetsResponse>('/api/worksheets', fetcher);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [expandedWorkshopId, setExpandedWorkshopId] = useState<number | null>(null);

  if (workshopLoading || worksheetLoading) {
    return (
      <div className="space-y-6 p-6 pt-20 md:pt-6">
        <div className="h-40 animate-pulse rounded-[32px] bg-orange-100" />
        <div className="h-[480px] animate-pulse rounded-[32px] bg-orange-100" />
      </div>
    );
  }

  if (workshopError || worksheetError || !workshopData || !worksheetData) {
    return (
      <div className="p-6 pt-20 md:pt-6">
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-base font-semibold">워크숍 관리 데이터를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => {
              void Promise.all([mutateWorkshops(), mutateWorksheets()]);
            }}
            className="mt-4 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const workshops = workshopData.workshops;
  const worksheetEntries = workshopData.worksheetEntries;
  const tokens = worksheetData.tokens;
  const activeTokens = tokens.filter((token) => token.active).length;
  const pendingReviews = worksheetEntries.filter((entry) => !entry.reviewed).length;

  const rows: WorkshopTableRow[] = workshops.map((workshop) => {
    const entries = worksheetEntries.filter((entry) => entry.workshop_id === workshop.id);
    const reviewedCount = entries.filter((entry) => entry.reviewed).length;

    return {
      id: workshop.id,
      title: workshop.title,
      phase: workshop.phase,
      scheduled_date: workshop.scheduled_date,
      actual_date: workshop.actual_date,
      location: workshop.location,
      participants_count: workshop.participants_count,
      status: workshop.status,
      templates: buildTemplates(workshop.id),
      worksheet_summary: `${entries.length}건 / 검토 ${reviewedCount}건`,
      description: workshop.description,
      outcome_summary: workshop.outcome_summary,
    };
  });

  const columns: DataTableColumn[] = [
    {
      key: 'title',
      label: '워크숍',
      sortable: true,
      editable: true,
      render: (value, item) => <span className="font-medium text-slate-900">[{item.id}] {String(value)}</span>,
    },
    {
      key: 'phase',
      label: '단계',
      type: 'select',
      editable: true,
      sortable: true,
      options: phaseOptions.map((phase) => ({
        value: String(phase),
        label: `${phase}단계 ${phaseLabels[phase]}`,
      })),
      render: (value) => {
        const phase = Number(value) as LivingLabPhase;
        return (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${phaseBadgeClasses[phase]}`}>
            {phase}단계 {phaseLabels[phase]}
          </span>
        );
      },
    },
    {
      key: 'scheduled_date',
      label: '예정일',
      type: 'date',
      editable: true,
      sortable: true,
      render: (value) => formatDate(String(value)),
    },
    {
      key: 'actual_date',
      label: '실행일',
      type: 'date',
      editable: true,
      render: (value) => formatDate(typeof value === 'string' ? value : null),
    },
    { key: 'location', label: '장소', editable: true },
    {
      key: 'participants_count',
      label: '참여 인원',
      type: 'number',
      editable: true,
      sortable: true,
    },
    {
      key: 'status',
      label: '상태',
      type: 'select',
      editable: true,
      sortable: true,
      options: (Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map((status) => ({
        value: status,
        label: statusLabels[status],
      })),
      render: (value) => {
        const status = String(value) as ProgressStatus;
        return (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses[status]}`}>
            {statusLabels[status]}
          </span>
        );
      },
    },
    { key: 'templates', label: '사용 템플릿' },
    { key: 'worksheet_summary', label: '워크시트 제출' },
    { key: 'description', label: '설명', editable: true },
    { key: 'outcome_summary', label: '결과 요약', editable: true },
  ];

  const saveWorkshopField = async (id: number, field: string, value: unknown) => {
    const fieldKey = `${id}-${field}`;
    setSavingField(fieldKey);

    try {
      const response = await fetch('/api/workshops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_workshop',
          id,
          field,
          value,
        }),
      });

      if (!response.ok) {
        throw new Error('update_workshop_failed');
      }

      await mutateWorkshops();
    } catch {
      window.alert('워크숍 정보를 저장하지 못했습니다.');
    } finally {
      setSavingField(null);
    }
  };

  const createToken = async (workshopId: number, templateKey: WorksheetTemplateKey) => {
    const response = await fetch('/api/worksheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_token', workshop_id: workshopId, template_key: templateKey }),
    });

    if (!response.ok) {
      throw new Error('create_token_failed');
    }

    const result = (await response.json()) as { token: string; url: string };
    await mutateWorksheets();
    return result;
  };

  const deactivateToken = async (tokenId: number) => {
    const response = await fetch('/api/worksheets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deactivate_token', id: tokenId }),
    });

    if (!response.ok) {
      throw new Error('deactivate_token_failed');
    }

    await mutateWorksheets();
  };

  return (
    <div className="space-y-8 p-6 pt-20 md:pt-6">
      <section className="rounded-[32px] border border-orange-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              관리자 워크숍 관리
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">워크숍 일정·결과 및 제출 링크 관리</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              워크숍 기본 정보를 수정하고, 워크숍별 워크시트 공개 제출 링크를 생성하거나 비활성화합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/workshops"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              열람 모드
            </Link>
            <Link
              href="/admin/worksheets"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <ClipboardCheck className="h-4 w-4" />
              워크시트 관리자
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: '전체 워크숍', value: `${workshops.length}회`, note: '현재 등록된 일정 수' },
          { label: '활성 제출 링크', value: `${activeTokens}개`, note: '현재 사용 가능한 링크 수' },
          { label: '검토 대기 워크시트', value: `${pendingReviews}건`, note: '관리자 검토가 필요한 제출물' },
        ].map((card) => (
          <div key={card.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">워크숍 일정표</h2>
            <p className="mt-1 text-sm text-slate-500">
              셀을 클릭해 일정, 상태, 설명, 결과 요약을 바로 수정할 수 있습니다.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-2 text-sm text-orange-700">
            <ClipboardCheck className="h-4 w-4" />
            {savingField ? '저장 중...' : '인라인 수정 가능'}
          </div>
        </div>
        <DataTable
          data={rows}
          columns={columns}
          editable
          searchable
          onSave={(id, field, value) => void saveWorkshopField(id, field, value)}
          filterOptions={[
            {
              key: 'phase',
              label: '모든 단계',
              options: phaseOptions.map((phase) => ({
                value: String(phase),
                label: `${phase}단계 ${phaseLabels[phase]}`,
              })),
            },
            {
              key: 'status',
              label: '모든 상태',
              options: (Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map((status) => ({
                value: status,
                label: statusLabels[status],
              })),
            },
          ]}
          emptyMessage="등록된 워크숍이 없습니다."
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">워크숍 운영 상세</h2>
          <p className="mt-1 text-sm text-slate-500">역할 배정, 제출 링크, 사진 기록을 워크숍별로 관리합니다.</p>
        </div>
        {workshops.map((workshop) => {
          const isExpanded = expandedWorkshopId === workshop.id;
          const entries = worksheetEntries.filter((entry) => entry.workshop_id === workshop.id);
          const workshopTokens = tokens.filter((token) => token.workshop_id === workshop.id);

          return (
            <div key={workshop.id} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setExpandedWorkshopId((previous) => (previous === workshop.id ? null : workshop.id))}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    [{workshop.id}] {formatDate(workshop.scheduled_date)} · {workshop.location}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">{workshop.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses[workshop.status]}`}>
                    {statusLabels[workshop.status]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                </div>
              </button>
              {isExpanded ? (
                <AdminWorkshopDetail
                  workshop={workshop}
                  entries={entries}
                  tokens={workshopTokens}
                  onCreateToken={createToken}
                  onDeactivateToken={deactivateToken}
                />
              ) : null}
            </div>
          );
        })}
      </section>
    </div>
  );
}
