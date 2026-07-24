'use client';

import { useMemo, useState, type FormEvent } from 'react';
import useSWR from 'swr';
import { FileCheck2, GitBranch, Pencil, Plus, ShieldCheck } from 'lucide-react';
import {
  getIssueCategoryLabel,
  getIssuePriorityLabel,
  getIssueStatusLabel,
  ISSUE_CATEGORY_OPTIONS,
  ISSUE_PRIORITY_OPTIONS,
  ISSUE_STATUS_OPTIONS,
} from '@/lib/issues';
import type {
  IssueCategory,
  IssueInstitutionOption,
  IssueItem,
  IssuePriority,
  IssueStatus,
  IssueWorksheetSource,
} from '@/lib/types';
import { getWorksheetTemplateLabel } from '@/lib/worksheets';

interface IssueTrackerProps {
  editable: boolean;
}

interface IssuesResponse {
  issues: IssueItem[];
  institutions: IssueInstitutionOption[];
  worksheet_sources: IssueWorksheetSource[];
}

interface IssueDraft {
  id?: number;
  title: string;
  category: IssueCategory;
  problem_statement: string;
  status: IssueStatus;
  priority: IssuePriority;
  owner_institution_id: number | null;
  source_worksheet_id: number | null;
  idea_summary: string;
  prototype_summary: string;
  test_summary: string;
  policy_proposal: string;
}

const EMPTY_DRAFT: IssueDraft = {
  title: '',
  category: 'other',
  problem_statement: '',
  status: 'problem_defined',
  priority: 'medium',
  owner_institution_id: null,
  source_worksheet_id: null,
  idea_summary: '',
  prototype_summary: '',
  test_summary: '',
  policy_proposal: '',
};

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}_fetch_failed`);
  }

  return (await response.json()) as T;
};

function toDraft(issue: IssueItem): IssueDraft {
  return {
    id: issue.id,
    title: issue.title,
    category: issue.category,
    problem_statement: issue.problem_statement,
    status: issue.status,
    priority: issue.priority,
    owner_institution_id: issue.owner_institution_id,
    source_worksheet_id: issue.source_worksheet_id,
    idea_summary: issue.idea_summary,
    prototype_summary: issue.prototype_summary,
    test_summary: issue.test_summary,
    policy_proposal: issue.policy_proposal,
  };
}

function priorityClass(priority: IssuePriority) {
  if (priority === 'high') {
    return 'bg-red-100 text-red-700';
  }

  if (priority === 'medium') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-slate-100 text-slate-600';
}

function statusClass(status: IssueStatus) {
  if (status === 'completed') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'field_testing' || status === 'policy_proposed') {
    return 'bg-violet-100 text-violet-700';
  }

  return 'bg-blue-100 text-blue-700';
}

export default function IssueTracker({ editable }: IssueTrackerProps) {
  const { data, error, isLoading, mutate } = useSWR<IssuesResponse>('/api/issues', fetcher);
  const [categoryFilter, setCategoryFilter] = useState<'all' | IssueCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | IssueStatus>('all');
  const [draft, setDraft] = useState<IssueDraft>(EMPTY_DRAFT);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const filteredIssues = useMemo(() => {
    const issues = data?.issues ?? [];
    return issues.filter((issue) => {
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) {
        return false;
      }

      return statusFilter === 'all' || issue.status === statusFilter;
    });
  }, [categoryFilter, data?.issues, statusFilter]);

  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setSaveError('');
    setEditorOpen(true);
  };

  const openEdit = (issue: IssueItem) => {
    setDraft(toDraft(issue));
    setSaveError('');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) {
      return;
    }

    setEditorOpen(false);
    setDraft(EMPTY_DRAFT);
    setSaveError('');
  };

  const updateDraft = <Key extends keyof IssueDraft>(key: Key, value: IssueDraft[Key]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
  };

  const saveIssue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.title.trim() || !draft.problem_statement.trim()) {
      setSaveError('이슈 제목과 문제 정의를 입력해주세요.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const response = await fetch('/api/issues', {
        method: draft.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error('issue_save_failed');
      }

      await mutate();
      setEditorOpen(false);
      setDraft(EMPTY_DRAFT);
    } catch {
      setSaveError('이슈를 저장하지 못했습니다. 관리자 로그인 상태를 확인하고 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-[32px] border border-blue-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-semibold text-blue-700">리빙랩 이슈 추적기</p>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              문제에서 정책 제안까지 한 흐름으로 추적
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              현장에서 확인한 문제를 근거 워크시트와 연결하고, 아이디어·프로토타입·실증·정책 제안으로
              이어지는 과정을 기록합니다.
            </p>
          </div>
          {editable ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 self-start rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              새 이슈 등록
            </button>
          ) : null}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-xs leading-5 text-emerald-800">
            공개 추적기에는 개인 식별정보와 인터뷰 원문을 저장하지 않습니다. 익명화된 문제 정의와 사업
            진행 결과만 공유합니다.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as 'all' | IssueCategory)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
          >
            <option value="all">모든 문제 분야</option>
            {ISSUE_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | IssueStatus)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
          >
            <option value="all">모든 진행 단계</option>
            {ISSUE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {editorOpen && editable ? (
        <form onSubmit={(event) => void saveIssue(event)} className="rounded-[32px] border border-orange-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-orange-600">
                {draft.id ? '이슈 수정' : '새 이슈 등록'}
              </p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">익명화된 이슈 진행 정보</h3>
            </div>
            <button
              type="button"
              onClick={closeEditor}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
            >
              닫기
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">이슈 제목</span>
              <input
                value={draft.title}
                onChange={(event) => updateDraft('title', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">문제 분야</span>
              <select
                value={draft.category}
                onChange={(event) => updateDraft('category', event.target.value as IssueCategory)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              >
                {ISSUE_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">진행 단계</span>
              <select
                value={draft.status}
                onChange={(event) => updateDraft('status', event.target.value as IssueStatus)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              >
                {ISSUE_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">우선순위</span>
              <select
                value={draft.priority}
                onChange={(event) => updateDraft('priority', event.target.value as IssuePriority)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              >
                {ISSUE_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">담당 기관</span>
              <select
                value={draft.owner_institution_id ?? ''}
                onChange={(event) =>
                  updateDraft(
                    'owner_institution_id',
                    event.target.value ? Number(event.target.value) : null
                  )
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="">미지정</option>
                {(data?.institutions ?? []).map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">근거 워크시트</span>
              <select
                value={draft.source_worksheet_id ?? ''}
                onChange={(event) =>
                  updateDraft(
                    'source_worksheet_id',
                    event.target.value ? Number(event.target.value) : null
                  )
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="">연결하지 않음</option>
                {(data?.worksheet_sources ?? []).map((source) => (
                  <option key={source.id} value={source.id}>
                    #{source.id} · {source.workshop_title} · {getWorksheetTemplateLabel(source.template_key)}
                  </option>
                ))}
              </select>
            </label>

            {[
              { key: 'problem_statement', label: '문제 정의', rows: 4 },
              { key: 'idea_summary', label: '아이디어 요약', rows: 3 },
              { key: 'prototype_summary', label: '프로토타입 요약', rows: 3 },
              { key: 'test_summary', label: '현장 실증 결과', rows: 3 },
              { key: 'policy_proposal', label: '정책·제도 제안', rows: 3 },
            ].map((field) => (
              <label
                key={field.key}
                className={`space-y-2 ${field.key === 'problem_statement' ? 'md:col-span-2' : ''}`}
              >
                <span className="text-sm font-semibold text-slate-700">{field.label}</span>
                <textarea
                  value={draft[field.key as keyof Pick<
                    IssueDraft,
                    'problem_statement' | 'idea_summary' | 'prototype_summary' | 'test_summary' | 'policy_proposal'
                  >]}
                  onChange={(event) =>
                    updateDraft(
                      field.key as keyof Pick<
                        IssueDraft,
                        'problem_statement' | 'idea_summary' | 'prototype_summary' | 'test_summary' | 'policy_proposal'
                      >,
                      event.target.value
                    )
                  }
                  rows={field.rows}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  required={field.key === 'problem_statement'}
                />
              </label>
            ))}
          </div>

          {saveError ? <p className="mt-4 text-sm font-medium text-red-600">{saveError}</p> : null}

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeEditor}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? '저장 중...' : '이슈 저장'}
            </button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-80 animate-pulse rounded-[32px] bg-slate-200" />
          ))}
        </div>
      ) : error || !data ? (
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">이슈 추적 데이터를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void mutate()}
            className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            다시 시도
          </button>
        </div>
      ) : filteredIssues.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredIssues.map((issue) => {
            const statusIndex = ISSUE_STATUS_OPTIONS.findIndex((item) => item.value === issue.status);
            const summaries = [
              { label: '아이디어', value: issue.idea_summary },
              { label: '프로토타입', value: issue.prototype_summary },
              { label: '실증 결과', value: issue.test_summary },
              { label: '정책 제안', value: issue.policy_proposal },
            ].filter((item) => item.value.trim().length > 0);

            return (
              <article key={issue.id} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">{issue.code}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {getIssueCategoryLabel(issue.category)}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass(issue.priority)}`}>
                        우선순위 {getIssuePriorityLabel(issue.priority)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold leading-7 text-slate-900">{issue.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(issue.status)}`}>
                      {getIssueStatusLabel(issue.status)}
                    </span>
                    {editable ? (
                      <button
                        type="button"
                        onClick={() => openEdit(issue)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        수정
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-6 gap-1.5">
                  {ISSUE_STATUS_OPTIONS.map((stage, index) => (
                    <div key={stage.value} className="min-w-0 text-center">
                      <div
                        className={`mx-auto h-2.5 w-full rounded-full ${
                          index <= statusIndex ? 'bg-blue-500' : 'bg-slate-200'
                        }`}
                      />
                      <p className="mt-2 truncate text-[10px] font-medium text-slate-500">{stage.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">문제 정의</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{issue.problem_statement}</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500">담당 기관</p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {issue.owner_institution_name ?? '미지정'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <FileCheck2 className="h-3.5 w-3.5" />
                      근거 워크시트
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {issue.source_worksheet_id && issue.source_template_key
                        ? `#${issue.source_worksheet_id} · ${getWorksheetTemplateLabel(issue.source_template_key)}`
                        : '미연결'}
                    </p>
                    {issue.source_workshop_title ? (
                      <p className="mt-1 text-xs text-slate-500">{issue.source_workshop_title}</p>
                    ) : null}
                  </div>
                </div>

                {summaries.length ? (
                  <div className="mt-4 space-y-3">
                    {summaries.map((summary) => (
                      <div key={summary.label} className="border-l-2 border-blue-200 pl-3">
                        <p className="text-xs font-semibold text-blue-700">{summary.label}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{summary.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
          조건에 맞는 이슈가 없습니다.
        </div>
      )}
    </section>
  );
}
