'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type {
  DementiaStage,
  Institution,
  LivingLabPhase,
  Participant,
  RoleType,
  Subject,
  SubjectType,
} from '@/lib/types';

type ModalType = 'participant' | 'subject';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void | Promise<void>;
  initialData?: Record<string, unknown> | null;
  type: ModalType;
  institutions?: Institution[];
}

const phaseOptions: LivingLabPhase[] = [1, 2, 3, 4, 5, 6];

const roleOptions: { value: RoleType; label: string }[] = [
  { value: 'activist', label: '활동가' },
  { value: 'facilitator', label: '퍼실리테이터' },
  { value: 'expert', label: '전문가' },
  { value: 'institution_staff', label: '기관담당자' },
];

const subjectTypeOptions: { value: SubjectType; label: string }[] = [
  { value: 'elder', label: '어르신' },
  { value: 'family_caregiver', label: '가족 돌봄자' },
];

const dementiaStageOptions: { value: DementiaStage; label: string }[] = [
  { value: 'normal', label: '정상' },
  { value: 'mild_cognitive', label: '경도인지저하' },
  { value: 'mild', label: '경증 치매' },
  { value: 'moderate', label: '중등도 치매' },
  { value: 'severe', label: '중증 치매' },
  { value: 'unknown', label: '미상' },
];

function buildParticipantFormData(initialData?: Record<string, unknown> | null) {
  const participant = initialData as Partial<Participant> | null | undefined;

  return {
    name: participant?.name ?? '',
    role: participant?.role ?? 'activist',
    affiliation: participant?.affiliation ?? '',
    contact: participant?.contact ?? '',
    joined_date: participant?.joined_date ?? '2026-03-01',
    notes: participant?.notes ?? '',
  };
}

function buildSubjectFormData(initialData?: Record<string, unknown> | null) {
  const subject = initialData as Partial<Subject> | null | undefined;

  return {
    type: subject?.type ?? 'elder',
    dementia_stage: subject?.dementia_stage ?? 'mild_cognitive',
    age_group: subject?.age_group ?? '70대',
    institution_id: String(subject?.institution_id ?? 1),
    consent_signed: Boolean(subject?.consent_signed),
    participation_phases: Array.isArray(subject?.participation_phases)
      ? subject.participation_phases
      : [1],
    dropout: Boolean(subject?.dropout),
    dropout_reason: subject?.dropout_reason ?? '',
    notes: subject?.notes ?? '',
  };
}

function buildInitialFormData(type: ModalType, initialData?: Record<string, unknown> | null) {
  return type === 'participant' ? buildParticipantFormData(initialData) : buildSubjectFormData(initialData);
}

export default function EditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  type,
  institutions = [],
}: EditModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => buildInitialFormData(type, initialData));

  if (!isOpen) {
    return null;
  }

  const updateField = (key: string, value: unknown) => {
    setFormData((previous) => ({ ...previous, [key]: value }));
  };

  const togglePhase = (phase: LivingLabPhase) => {
    const currentPhases = Array.isArray(formData.participation_phases)
      ? (formData.participation_phases as number[])
      : [];

    const nextPhases = currentPhases.includes(phase)
      ? currentPhases.filter((item) => item !== phase)
      : [...currentPhases, phase].sort((left, right) => left - right);

    updateField('participation_phases', nextPhases);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload =
      type === 'participant'
        ? {
            name: String(formData.name ?? '').trim(),
            role: formData.role,
            affiliation: String(formData.affiliation ?? '').trim(),
            contact: String(formData.contact ?? '').trim(),
            joined_date: String(formData.joined_date ?? ''),
            notes: String(formData.notes ?? '').trim(),
          }
        : {
            type: formData.type,
            dementia_stage: formData.dementia_stage,
            age_group: String(formData.age_group ?? '').trim(),
            institution_id: Number(formData.institution_id),
            consent_signed: Boolean(formData.consent_signed),
            participation_phases: Array.isArray(formData.participation_phases)
              ? formData.participation_phases
              : [1],
            dropout: Boolean(formData.dropout),
            dropout_reason: formData.dropout
              ? String(formData.dropout_reason ?? '').trim() || null
              : null,
            notes: String(formData.notes ?? '').trim(),
          };

    await onSave(payload);
  };

  const participantValid =
    type === 'participant' &&
    String(formData.name ?? '').trim() !== '' &&
    String(formData.affiliation ?? '').trim() !== '' &&
    String(formData.contact ?? '').trim() !== '' &&
    String(formData.joined_date ?? '').trim() !== '';

  const subjectValid =
    type === 'subject' &&
    String(formData.age_group ?? '').trim() !== '' &&
    String(formData.institution_id ?? '').trim() !== '' &&
    Array.isArray(formData.participation_phases) &&
    (formData.participation_phases as number[]).length > 0;

  const isValid = participantValid || subjectValid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {type === 'participant' ? '참가자' : '대상자'} {initialData ? '수정' : '추가'}
            </h2>
            <p className="text-sm text-slate-500">
              {type === 'participant'
                ? '활동가, 퍼실리테이터, 전문가 정보를 입력합니다.'
                : '익명 대상자 정보를 입력합니다.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          {type === 'participant' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">이름</span>
                <input
                  type="text"
                  value={String(formData.name ?? '')}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">역할</span>
                <select
                  value={String(formData.role ?? 'activist')}
                  onChange={(event) => updateField('role', event.target.value as RoleType)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">소속</span>
                <input
                  type="text"
                  value={String(formData.affiliation ?? '')}
                  onChange={(event) => updateField('affiliation', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">연락처</span>
                <input
                  type="text"
                  value={String(formData.contact ?? '')}
                  onChange={(event) => updateField('contact', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">참여일</span>
                <input
                  type="date"
                  value={String(formData.joined_date ?? '')}
                  onChange={(event) => updateField('joined_date', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">비고</span>
                <textarea
                  value={String(formData.notes ?? '')}
                  onChange={(event) => updateField('notes', event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-5">
              {initialData && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  코드: <span className="font-semibold">{String(initialData.code ?? '자동 생성')}</span>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">유형</span>
                  <select
                    value={String(formData.type ?? 'elder')}
                    onChange={(event) => updateField('type', event.target.value as SubjectType)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {subjectTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">치매 단계</span>
                  <select
                    value={String(formData.dementia_stage ?? 'mild_cognitive')}
                    onChange={(event) => updateField('dementia_stage', event.target.value as DementiaStage)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {dementiaStageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">연령대</span>
                  <input
                    type="text"
                    value={String(formData.age_group ?? '')}
                    onChange={(event) => updateField('age_group', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">소속 기관</span>
                  <select
                    value={String(formData.institution_id ?? '1')}
                    onChange={(event) => updateField('institution_id', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {institutions.map((institution) => (
                      <option key={institution.id} value={String(institution.id)}>
                        {institution.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 text-sm font-medium text-slate-700">참여 단계</div>
                <div className="flex flex-wrap gap-2">
                  {phaseOptions.map((phase) => {
                    const checked =
                      Array.isArray(formData.participation_phases) &&
                      (formData.participation_phases as number[]).includes(phase);

                    return (
                      <button
                        key={phase}
                        type="button"
                        onClick={() => togglePhase(phase)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                          checked
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {phase}단계
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.consent_signed)}
                    onChange={(event) => updateField('consent_signed', event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  동의서 확보
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.dropout)}
                    onChange={(event) => updateField('dropout', event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  탈락 처리
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">탈락 사유</span>
                <input
                  type="text"
                  value={String(formData.dropout_reason ?? '')}
                  onChange={(event) => updateField('dropout_reason', event.target.value)}
                  disabled={!Boolean(formData.dropout)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">비고</span>
                <textarea
                  value={String(formData.notes ?? '')}
                  onChange={(event) => updateField('notes', event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
