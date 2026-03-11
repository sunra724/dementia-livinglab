'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import type { FieldPhoto, WorksheetContributorRole, WorksheetEntry, WorksheetTemplateKey } from '@/lib/types';
import { getDefaultWorksheetData, getWorksheetTemplateLabel } from '@/lib/worksheets';
import WorksheetForm from '@/components/guidebook/WorksheetForm';
import PhotoGallery from '@/components/photos/PhotoGallery';
import PhotoUploader from '@/components/photos/PhotoUploader';
import WorksheetEntryDialog from '@/components/worksheets/WorksheetEntryDialog';

interface TokenLookupResponse {
  valid: boolean;
  workshop: { id: number; title: string; phase: number; scheduled_date: string } | null;
  template_key: WorksheetTemplateKey | null;
  existing_entry: WorksheetEntry | null;
}

interface PhotosResponse {
  photos: FieldPhoto[];
}

const fetcher = async <T,>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}_fetch_failed`);
  }

  return (await response.json()) as T;
};

export default function WorksheetTokenPage() {
  const params = useParams<{ token: string }>();
  const [token, setToken] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [role, setRole] = useState<WorksheetContributorRole>('activist');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [step, setStep] = useState<'loading' | 'invalid' | 'already' | 'form' | 'done'>('loading');
  const [submittedEntry, setSubmittedEntry] = useState<WorksheetEntry | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const restoredRef = useRef(false);

  useEffect(() => {
    const paramToken = Array.isArray(params.token) ? params.token[0] : params.token;
    setToken(paramToken ?? '');
  }, [params]);

  const { data, error, isLoading } = useSWR<TokenLookupResponse>(
    token ? `/api/worksheets?token=${token}` : null,
    fetcher
  );
  const { data: photoData, mutate: mutatePhotos } = useSWR<PhotosResponse>(
    submittedEntry ? `/api/photos?worksheet_id=${submittedEntry.id}` : null,
    fetcher
  );

  useEffect(() => {
    if (isLoading || !token) {
      setStep('loading');
      return;
    }

    if (error || !data || !data.valid || !data.workshop || !data.template_key) {
      setStep('invalid');
      return;
    }

    if (data.existing_entry) {
      setSubmittedEntry(data.existing_entry);
      setStep('already');
      return;
    }

    setFormData((current) =>
      Object.keys(current).length ? current : getDefaultWorksheetData(data.template_key as WorksheetTemplateKey)
    );
    setStep('form');
  }, [data, error, isLoading, token]);

  useEffect(() => {
    if (!token || step !== 'form' || restoredRef.current) {
      return;
    }

    const saved = window.localStorage.getItem(`ws_draft_${token}`);
    if (!saved) {
      restoredRef.current = true;
      return;
    }

    const restore = window.confirm('이전에 저장한 초안이 있습니다. 복원할까요?');
    restoredRef.current = true;

    if (!restore) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        authorName?: string;
        groupName?: string;
        role?: WorksheetContributorRole;
        formData?: Record<string, unknown>;
      };
      setAuthorName(parsed.authorName ?? '');
      setGroupName(parsed.groupName ?? '');
      setRole(parsed.role === 'facilitator' ? 'facilitator' : 'activist');
      setFormData(parsed.formData ?? {});
    } catch {
      window.localStorage.removeItem(`ws_draft_${token}`);
    }
  }, [step, token]);

  const saveDraft = () => {
    if (!token) {
      return;
    }

    window.localStorage.setItem(
      `ws_draft_${token}`,
      JSON.stringify({ authorName, groupName, role, formData })
    );
  };

  const submitWorksheet = async () => {
    if (!data?.workshop || !data.template_key || !authorName.trim()) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          token,
          workshop_id: data.workshop.id,
          template_key: data.template_key,
          group_name: groupName.trim(),
          filled_by_name: authorName.trim(),
          filled_by_role: role,
          content_json: JSON.stringify(formData),
        }),
      });

      if (!response.ok) {
        throw new Error('submit_failed');
      }

      const result = (await response.json()) as { entry: WorksheetEntry | null };
      if (token) {
        window.localStorage.removeItem(`ws_draft_${token}`);
      }
      setSubmittedEntry(result.entry);
      setStep('done');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'loading') {
    return <div className="h-72 animate-pulse rounded-[32px] bg-slate-200" />;
  }

  if (step === 'invalid' || !data?.workshop || !data.template_key) {
    return (
      <div className="rounded-[32px] border border-red-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">유효하지 않은 링크입니다.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          링크가 만료되었거나 비활성화되었습니다. 해당 퍼실리테이터에게 새 링크를 요청해 주세요.
        </p>
      </div>
    );
  }

  if (step === 'already' && submittedEntry) {
    return (
      <>
        <div className="space-y-6">
          <div className="rounded-[32px] border border-blue-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">이미 제출된 워크시트입니다.</h2>
            <p className="mt-3 text-sm text-slate-600">
              {submittedEntry.filled_by_name} {submittedEntry.group_name ? `(${submittedEntry.group_name})` : ''} 님이 이미 제출했습니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                제출 내용 보기
              </button>
            </div>
          </div>
          <div className="space-y-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">첨부된 현장 사진</h3>
              <p className="mt-1 text-sm text-slate-500">이 워크시트와 연결된 사진입니다.</p>
            </div>
            <PhotoGallery photos={photoData?.photos ?? []} />
          </div>
        </div>
        {showPreview ? (
          <WorksheetEntryDialog
            entry={submittedEntry}
            workshopTitle={data.workshop.title}
            onClose={() => setShowPreview(false)}
          />
        ) : null}
      </>
    );
  }

  if (step === 'done' && submittedEntry) {
    return (
      <>
        <div className="space-y-6">
          <div className="rounded-[32px] border border-green-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">워크시트가 제출되었습니다.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              제출자 {submittedEntry.filled_by_name} {submittedEntry.group_name ? `(${submittedEntry.group_name})` : ''}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              템플릿 {getWorksheetTemplateLabel(submittedEntry.template_key)}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                제출 내용 확인
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <PhotoUploader
              worksheetId={submittedEntry.id}
              onUpload={() => {
                void mutatePhotos();
              }}
              maxFiles={5}
            />
            <PhotoGallery photos={photoData?.photos ?? []} />
          </div>
        </div>
        {showPreview ? (
          <WorksheetEntryDialog
            entry={submittedEntry}
            workshopTitle={data.workshop.title}
            onClose={() => setShowPreview(false)}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          워크숍 [{data.workshop.id}] {data.workshop.title} ({data.workshop.scheduled_date})
        </p>
        <h2 className="mt-3 text-3xl font-bold text-slate-900">{getWorksheetTemplateLabel(data.template_key)}</h2>
        <p className="mt-2 text-sm text-slate-600">작성자 정보를 먼저 입력한 뒤 워크시트를 제출해 주세요.</p>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-800">이름 *</span>
            <input
              type="text"
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                authorName.trim()
                  ? 'border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100'
                  : 'border-amber-300 bg-amber-50'
              }`}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-800">조명</span>
            <input
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { value: 'activist', label: '활동가' },
            { value: 'facilitator', label: '퍼실리테이터' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value as WorksheetContributorRole)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                role === option.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {!authorName.trim() ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            이름을 먼저 입력해 주세요. 제출 시 작성자 정보로 사용됩니다.
          </div>
        ) : null}
      </section>

      <WorksheetForm
        key={`${token}-${data.template_key}`}
        templateKey={data.template_key}
        initialData={formData}
        onChange={setFormData}
        workshopId={data.workshop.id}
      />

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={saveDraft}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          초안 저장
        </button>
        <button
          type="button"
          onClick={() => void submitWorksheet()}
          disabled={!authorName.trim() || saving}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {saving ? '제출 중...' : '최종 제출'}
        </button>
      </div>
    </div>
  );
}
