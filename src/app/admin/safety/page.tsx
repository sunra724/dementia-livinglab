'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { ArrowLeft, CheckCircle2, Plus } from 'lucide-react';
import ChecklistPanel from '@/components/guidebook/ChecklistPanel';
import { PHASES, SAFETY_LOG_TYPE_LABELS, SAFETY_SEVERITY_LABELS, SAFETY_SEVERITY_STYLES } from '@/lib/safety';
import type {
  ChecklistItem,
  PhaseGateResult,
  SafetyLog,
  SafetyLogType,
  SafetySeverity,
} from '@/lib/types';

interface SafetyResponse {
  logs: SafetyLog[];
  checklist_safety: ChecklistItem[];
  gate_status: PhaseGateResult[];
}

const fetcher = async <T,>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}_fetch_failed`);
  }

  return (await response.json()) as T;
};

function phaseLabel(phase: number) {
  return `${phase}단계`;
}

export default function AdminSafetyPage() {
  const { data, error, isLoading, mutate } = useSWR<SafetyResponse>('/api/safety', fetcher);
  const [createOpen, setCreateOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<SafetyLog | null>(null);
  const [createForm, setCreateForm] = useState({
    phase: 2,
    workshop_id: '',
    log_type: 'consent' as SafetyLogType,
    description: '',
    recorder: '',
    severity: 'info' as SafetySeverity,
  });
  const [resolveNote, setResolveNote] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 pt-20 md:pt-6">
        <div className="h-40 animate-pulse rounded-[32px] bg-orange-100" />
        <div className="h-[520px] animate-pulse rounded-[32px] bg-orange-100" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 pt-20 md:pt-6">
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-base font-semibold">안전·윤리 관리자 데이터를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void mutate()}
            className="mt-4 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const handleChecklistComplete = async (
    id: number,
    meta: { completed_by: string; evidence_note: string }
  ) => {
    const response = await fetch('/api/guidebook', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        changes: {
          completed: true,
          completed_by: meta.completed_by,
          evidence_note: meta.evidence_note,
        },
      }),
    });

    if (!response.ok) {
      window.alert('안전 체크리스트를 저장하지 못했습니다.');
      return;
    }

    await mutate();
  };

  const createSafetyLog = async () => {
    const response = await fetch('/api/safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phase: createForm.phase,
        workshop_id: createForm.workshop_id ? Number(createForm.workshop_id) : undefined,
        log_type: createForm.log_type,
        description: createForm.description.trim(),
        recorder: createForm.recorder.trim(),
        severity: createForm.severity,
      }),
    });

    if (!response.ok) {
      window.alert('안전 로그를 저장하지 못했습니다.');
      return;
    }

    await mutate();
    setCreateOpen(false);
    setCreateForm({
      phase: 2,
      workshop_id: '',
      log_type: 'consent',
      description: '',
      recorder: '',
      severity: 'info',
    });
  };

  const resolveSafetyLog = async () => {
    if (!resolveTarget || !resolveNote.trim()) {
      return;
    }

    const response = await fetch('/api/safety', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: resolveTarget.id,
        resolved_note: resolveNote.trim(),
      }),
    });

    if (!response.ok) {
      window.alert('안전 로그 해결 처리를 저장하지 못했습니다.');
      return;
    }

    await mutate();
    setResolveTarget(null);
    setResolveNote('');
  };

  return (
    <div className="space-y-8 p-6 pt-20 md:pt-6">
      <section className="rounded-[32px] border border-orange-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              관리자 안전·윤리 관리
            </span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">안전 로그 및 게이팅 관리</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              안전 체크리스트 완료 처리와 현장 로그 해결 처리를 함께 관리합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/safety"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              열람 모드
            </Link>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />
              안전 로그 추가
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {PHASES.map((phase) => {
          const items = data.checklist_safety.filter((item) => item.phase === phase);
          return (
            <ChecklistPanel
              key={phase}
              phase={phase}
              title={`${phaseLabel(phase)} 안전·윤리 체크리스트`}
              items={items}
              completionCount={items.filter((item) => item.completed).length}
              editable
              onCheck={(id, meta) => void handleChecklistComplete(id, meta)}
            />
          );
        })}
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900">안전 로그</h2>
          <p className="mt-1 text-sm text-slate-500">미해결 로그는 해결 메모를 남기고 닫을 수 있습니다.</p>
        </div>
        <div className="space-y-4">
          {data.logs.map((log) => (
            <div key={log.id} className={`rounded-[24px] border px-5 py-4 ${SAFETY_SEVERITY_STYLES[log.severity]}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                    <span>{SAFETY_SEVERITY_LABELS[log.severity]}</span>
                    <span>{log.created_at.slice(0, 16).replace('T', ' ')}</span>
                    <span>{SAFETY_LOG_TYPE_LABELS[log.log_type]}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{log.description}</p>
                  <p className="mt-1 text-xs">기록자 {log.recorder}</p>
                  {log.resolved ? (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-4 w-4" />
                      해결: {log.resolved_note || '완료'}
                    </div>
                  ) : null}
                </div>
                {!log.resolved ? (
                  <button
                    type="button"
                    onClick={() => {
                      setResolveTarget(log);
                      setResolveNote('');
                    }}
                    className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    해결 처리
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">안전 로그 추가</h2>
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">단계</span>
                  <select
                    value={String(createForm.phase)}
                    onChange={(event) =>
                      setCreateForm((previous) => ({ ...previous, phase: Number(event.target.value) }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    {PHASES.map((phase) => (
                      <option key={phase} value={phase}>
                        {phaseLabel(phase)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">워크숍 ID</span>
                  <input
                    type="text"
                    value={createForm.workshop_id}
                    onChange={(event) =>
                      setCreateForm((previous) => ({ ...previous, workshop_id: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="선택"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">로그 유형</span>
                  <select
                    value={createForm.log_type}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        log_type: event.target.value as SafetyLogType,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    {Object.entries(SAFETY_LOG_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">심각도</span>
                  <select
                    value={createForm.severity}
                    onChange={(event) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        severity: event.target.value as SafetySeverity,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    {Object.entries(SAFETY_SEVERITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">기록자</span>
                <input
                  type="text"
                  value={createForm.recorder}
                  onChange={(event) =>
                    setCreateForm((previous) => ({ ...previous, recorder: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">설명</span>
                <textarea
                  value={createForm.description}
                  onChange={(event) =>
                    setCreateForm((previous) => ({ ...previous, description: event.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void createSafetyLog()}
                disabled={!createForm.description.trim() || !createForm.recorder.trim()}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {resolveTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">안전 로그 해결 처리</h2>
            <p className="mt-3 text-sm text-slate-600">{resolveTarget.description}</p>
            <textarea
              value={resolveNote}
              onChange={(event) => setResolveNote(event.target.value)}
              rows={4}
              className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="해결 메모"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setResolveTarget(null)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void resolveSafetyLog()}
                disabled={!resolveNote.trim()}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                해결 완료
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
