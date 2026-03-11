'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { Minus, Plus, Star } from 'lucide-react';
import type { ObservationItem, Subject, WorksheetEntry, WorksheetTemplateKey } from '@/lib/types';
import {
  WORKSHEET_TEMPLATE_DESCRIPTIONS,
  getDefaultWorksheetData,
  getWorksheetTemplateLabel,
  parseWorksheetContent,
} from '@/lib/worksheets';

const ResponsiveContainer = dynamic(
  () => import('recharts').then((module) => module.ResponsiveContainer),
  { ssr: false }
);
const LineChart = dynamic(() => import('recharts').then((module) => module.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((module) => module.Line), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((module) => module.CartesianGrid), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((module) => module.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((module) => module.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((module) => module.Tooltip), { ssr: false });

interface WorksheetFormProps {
  templateKey: WorksheetTemplateKey;
  initialData?: Record<string, unknown>;
  onChange?: (data: Record<string, unknown>) => void;
  readOnly?: boolean;
  workshopId?: number;
}

interface ParticipantsResponse {
  subjects: Subject[];
}

interface WorksheetsResponse {
  entries: WorksheetEntry[];
}

interface StageRecord {
  name: string;
  action: string;
  emotion: number;
  pain_point: string;
  opportunity: string;
}

function createObservationItem(): ObservationItem {
  return {
    time: '',
    who: '',
    what: '',
    how: '',
    note: '',
    emotion_hint: '',
  };
}

const fetcher = async <T,>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}_fetch_failed`);
  }

  return (await response.json()) as T;
};

const sectionClass = 'space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm';

function inputClass(readOnly: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${
    readOnly
      ? 'border-slate-200 bg-slate-50 text-slate-700'
      : 'border-slate-200 bg-white text-slate-900 focus:border-blue-300 focus:ring-2 focus:ring-blue-100'
  }`;
}

function renderValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '-';
  }

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

function FieldShell({
  label,
  hint,
  readOnly,
  value,
  children,
}: {
  label: string;
  hint?: string;
  readOnly: boolean;
  value: unknown;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {readOnly ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm whitespace-pre-wrap text-slate-700">
          {renderValue(value)}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function RatingField({
  label,
  value,
  readOnly,
  onChange,
}: {
  label: string;
  value: number;
  readOnly: boolean;
  onChange: (value: number) => void;
}) {
  if (readOnly) {
    return <FieldShell label={label} readOnly value={`${value}/5점`}>{null}</FieldShell>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        {Array.from({ length: 5 }, (_, index) => {
          const nextValue = index + 1;
          const filled = nextValue <= value;

          return (
            <button
              key={nextValue}
              type="button"
              onClick={() => onChange(nextValue)}
              className="text-amber-400"
            >
              <Star className="h-5 w-5" fill={filled ? 'currentColor' : 'none'} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TagEditor({
  label,
  values,
  readOnly,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  readOnly: boolean;
  placeholder: string;
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  if (readOnly) {
    return <FieldShell label={label} readOnly value={values}>{null}</FieldShell>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {value} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') {
                return;
              }

              event.preventDefault();
              const next = draft.trim();
              if (!next || values.includes(next)) {
                return;
              }

              onChange([...values, next]);
              setDraft('');
            }}
            placeholder={placeholder}
            className={inputClass(false)}
          />
          <button
            type="button"
            onClick={() => {
              const next = draft.trim();
              if (!next || values.includes(next)) {
                return;
              }

              onChange([...values, next]);
              setDraft('');
            }}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

function StringListEditor({
  label,
  values,
  readOnly,
  buttonLabel,
  onChange,
}: {
  label: string;
  values: string[];
  readOnly: boolean;
  buttonLabel: string;
  onChange: (values: string[]) => void;
}) {
  if (readOnly) {
    return <FieldShell label={label} readOnly value={values}>{null}</FieldShell>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <div className="space-y-3">
        {values.map((value, index) => (
          <div key={`${label}-${index}`} className="flex gap-2">
            <input
              className={inputClass(false)}
              value={value}
              onChange={(event) => {
                const nextValues = [...values];
                nextValues[index] = event.target.value;
                onChange(nextValues);
              }}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, valueIndex) => valueIndex !== index))}
              disabled={values.length <= 1}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-slate-600 disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...values, ''])}
          className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
        >
          <Plus className="h-4 w-4" />
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

export default function WorksheetForm({
  templateKey,
  initialData,
  onChange,
  readOnly = false,
  workshopId,
}: WorksheetFormProps) {
  const [internalData, setInternalData] = useState<Record<string, unknown>>(
    initialData ?? getDefaultWorksheetData(templateKey)
  );
  const { data: participantsData } = useSWR<ParticipantsResponse>(
    templateKey === 'observation_log' ||
      templateKey === 'persona' ||
      templateKey === 'journey_map' ||
      templateKey === 'test_result'
      ? '/api/participants'
      : null,
    fetcher
  );
  const { data: worksheetData } = useSWR<WorksheetsResponse>(
    templateKey === 'idea_card' && workshopId ? `/api/worksheets?workshop_id=${workshopId}` : null,
    fetcher
  );

  const formData = initialData ?? internalData;

  const setField = (key: string, value: unknown) => {
    const nextData = { ...formData, [key]: value };
    setInternalData(nextData);
    onChange?.(nextData);
  };

  const subjects = participantsData?.subjects ?? [];
  const hmwOptions = Array.from(
    new Set(
      (worksheetData?.entries ?? [])
        .filter((entry) => entry.template_key === 'hmw')
        .flatMap((entry) => {
          const parsed = parseWorksheetContent('hmw', entry.content_json);
          return Array.isArray(parsed.questions)
            ? parsed.questions.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
            : [];
        })
    )
  );

  const subjectCodes = Array.isArray(formData.subject_codes)
    ? formData.subject_codes.filter((item): item is string => typeof item === 'string')
    : [];
  const observations = Array.isArray(formData.observations)
    ? formData.observations.map((observation) => {
        const item =
          typeof observation === 'object' && observation !== null
            ? (observation as Record<string, unknown>)
            : {};
        return {
          time: String(item.time ?? ''),
          who: String(item.who ?? ''),
          what: String(item.what ?? ''),
          how: String(item.how ?? ''),
          note: String(item.note ?? ''),
          emotion_hint: String(item.emotion_hint ?? ''),
        } satisfies ObservationItem;
      })
    : [createObservationItem(), createObservationItem(), createObservationItem()];
  const questions = Array.isArray(formData.questions)
    ? formData.questions.filter((item): item is string => typeof item === 'string')
    : [''];
  const needs = Array.isArray(formData.needs)
    ? formData.needs.filter((item): item is string => typeof item === 'string')
    : [];
  const pains = Array.isArray(formData.pains)
    ? formData.pains.filter((item): item is string => typeof item === 'string')
    : [];
  const components = Array.isArray(formData.components)
    ? formData.components.filter((item): item is string => typeof item === 'string')
    : [''];
  const participants = Array.isArray(formData.participants)
    ? formData.participants.filter((item): item is string => typeof item === 'string')
    : [];
  const stages = Array.isArray(formData.stages)
    ? formData.stages.map((stage) => {
        const item = typeof stage === 'object' && stage !== null ? (stage as Record<string, unknown>) : {};
        return {
          name: String(item.name ?? ''),
          action: String(item.action ?? ''),
          emotion: Number(item.emotion ?? 3),
          pain_point: String(item.pain_point ?? ''),
          opportunity: String(item.opportunity ?? ''),
        } satisfies StageRecord;
      })
    : [];

  const chartData = stages.map((stage, index) => ({
    label: stage.name || `단계 ${index + 1}`,
    emotion: stage.emotion,
  }));

  const ageGroupOptions = ['50대', '60대', '70대', '80대 이상', '가족 돌봄자'];
  const prototypeTypeOptions = [
    { value: 'physical', label: '물리형' },
    { value: 'digital', label: '디지털형' },
    { value: 'service', label: '서비스형' },
    { value: 'process', label: '프로세스형' },
  ] as const;

  const updateObservation = (index: number, field: keyof ObservationItem, value: string) => {
    const nextObservations = [...observations];
    nextObservations[index] = {
      ...nextObservations[index],
      [field]: value,
    };
    setField('observations', nextObservations);
  };

  const renderObservationLog = () => (
    <div className={sectionClass}>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldShell label="관찰 일시" readOnly={readOnly} value={formData.observation_date}>
          <input
            type="date"
            className={inputClass(false)}
            value={String(formData.observation_date ?? '')}
            onChange={(event) => setField('observation_date', event.target.value)}
          />
        </FieldShell>
        <FieldShell label="장소" readOnly={readOnly} value={formData.location}>
          <input
            className={inputClass(false)}
            value={String(formData.location ?? '')}
            onChange={(event) => setField('location', event.target.value)}
          />
        </FieldShell>
      </div>

      <FieldShell label="관찰 대상자" readOnly={readOnly} value={subjectCodes}>
        <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          {subjects.length ? (
            subjects.map((subject) => {
              const checked = subjectCodes.includes(subject.code);
              return (
                <label key={subject.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setField('subject_codes', [...subjectCodes, subject.code]);
                      } else {
                        setField(
                          'subject_codes',
                          subjectCodes.filter((code) => code !== subject.code)
                        );
                      }
                    }}
                  />
                  {subject.code}
                </label>
              );
            })
          ) : (
            <p className="text-sm text-slate-500">대상자 정보를 불러오는 중입니다.</p>
          )}
        </div>
      </FieldShell>

      <FieldShell label="관찰자 역할" readOnly={readOnly} value={formData.observer_role}>
        <input
          className={inputClass(false)}
          value={String(formData.observer_role ?? '')}
          onChange={(event) => setField('observer_role', event.target.value)}
        />
      </FieldShell>

      <FieldShell label="관찰 맥락" readOnly={readOnly} value={formData.context_description}>
        <textarea
          className={inputClass(false)}
          rows={4}
          value={String(formData.context_description ?? '')}
          onChange={(event) => setField('context_description', event.target.value)}
        />
      </FieldShell>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">시간대별 관찰 기록</p>
            <p className="text-xs text-slate-500">최소 3개, 최대 10개까지 작성할 수 있습니다.</p>
          </div>
          {!readOnly ? (
            <button
              type="button"
              onClick={() => setField('observations', [...observations, createObservationItem()])}
              disabled={observations.length >= 10}
              className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              관찰 항목 추가
            </button>
          ) : null}
        </div>

        {observations.map((observation, index) => (
          <div key={`observation-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">관찰 {index + 1}</p>
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      'observations',
                      observations.filter((_, observationIndex) => observationIndex !== index)
                    )
                  }
                  disabled={observations.length <= 3}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 disabled:opacity-40"
                >
                  삭제
                </button>
              ) : null}
            </div>

            {readOnly ? (
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { label: '시간', value: observation.time },
                  { label: '누가', value: observation.who },
                  { label: '무엇을', value: observation.what },
                  { label: '어떻게', value: observation.how },
                  { label: '감정 단서', value: observation.emotion_hint },
                  { label: '관찰 메모', value: observation.note },
                ].map((item) => (
                  <div
                    key={`${item.label}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <p className="mb-1 text-xs font-semibold text-slate-500">{item.label}</p>
                    <p className="whitespace-pre-wrap">{item.value || '-'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">시간</span>
                  <input
                    type="time"
                    className={inputClass(false)}
                    value={observation.time}
                    onChange={(event) => updateObservation(index, 'time', event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">누가</span>
                  <input
                    className={inputClass(false)}
                    value={observation.who}
                    onChange={(event) => updateObservation(index, 'who', event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">무엇을</span>
                  <input
                    className={inputClass(false)}
                    value={observation.what}
                    onChange={(event) => updateObservation(index, 'what', event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">어떻게</span>
                  <input
                    className={inputClass(false)}
                    value={observation.how}
                    onChange={(event) => updateObservation(index, 'how', event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">감정 단서</span>
                  <input
                    className={inputClass(false)}
                    value={observation.emotion_hint}
                    onChange={(event) => updateObservation(index, 'emotion_hint', event.target.value)}
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-800">관찰 메모</span>
                  <textarea
                    className={inputClass(false)}
                    rows={3}
                    value={observation.note}
                    onChange={(event) => updateObservation(index, 'note', event.target.value)}
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <FieldShell label="촬영 메모" readOnly={readOnly} value={formData.photos_note}>
        <input
          className={inputClass(false)}
          value={String(formData.photos_note ?? '')}
          onChange={(event) => setField('photos_note', event.target.value)}
        />
      </FieldShell>

      <FieldShell label="핵심 발견" readOnly={readOnly} value={formData.key_finding}>
        <textarea
          className={inputClass(false)}
          rows={3}
          value={String(formData.key_finding ?? '')}
          onChange={(event) => setField('key_finding', event.target.value)}
        />
      </FieldShell>

      <FieldShell label="추가 질문" readOnly={readOnly} value={formData.questions_raised}>
        <textarea
          className={inputClass(false)}
          rows={4}
          value={String(formData.questions_raised ?? '')}
          onChange={(event) => setField('questions_raised', event.target.value)}
        />
      </FieldShell>
    </div>
  );

  const renderHmw = () => (
    <div className={sectionClass}>
      <FieldShell label="관찰한 문제 상황" readOnly={readOnly} value={formData.problem_context}>
        <textarea
          className={inputClass(false)}
          rows={4}
          value={String(formData.problem_context ?? '')}
          onChange={(event) => setField('problem_context', event.target.value)}
        />
      </FieldShell>
      <FieldShell label="관련 대상자" readOnly={readOnly} value={formData.target_subject}>
        <input
          className={inputClass(false)}
          value={String(formData.target_subject ?? '')}
          onChange={(event) => setField('target_subject', event.target.value)}
        />
      </FieldShell>
      <StringListEditor
        label="HMW 질문"
        values={questions}
        readOnly={readOnly}
        buttonLabel="질문 추가"
        onChange={(values) => setField('questions', values)}
      />
      <FieldShell label="도출한 인사이트" readOnly={readOnly} value={formData.key_insight}>
        <textarea
          className={inputClass(false)}
          rows={4}
          value={String(formData.key_insight ?? '')}
          onChange={(event) => setField('key_insight', event.target.value)}
        />
      </FieldShell>
    </div>
  );

  const renderPersona = () => (
    <div className={sectionClass}>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldShell label="대상자 코드" readOnly={readOnly} value={formData.subject_code}>
          <select
            className={inputClass(false)}
            value={String(formData.subject_code ?? '')}
            onChange={(event) => setField('subject_code', event.target.value)}
          >
            <option value="">대상자를 선택하세요</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.code}>
                {subject.code}
              </option>
            ))}
          </select>
        </FieldShell>
        <FieldShell label="연령대" readOnly={readOnly} value={formData.age_group}>
          <select
            className={inputClass(false)}
            value={String(formData.age_group ?? '')}
            onChange={(event) => setField('age_group', event.target.value)}
          >
            <option value="">연령대를 선택하세요</option>
            {ageGroupOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FieldShell>
      </div>
      <FieldShell label="하루 일과" readOnly={readOnly} value={formData.daily_routine}>
        <textarea
          className={inputClass(false)}
          rows={4}
          value={String(formData.daily_routine ?? '')}
          onChange={(event) => setField('daily_routine', event.target.value)}
        />
      </FieldShell>
      <div className="grid gap-4 md:grid-cols-2">
        <TagEditor
          label="필요한 것(Needs)"
          values={needs}
          readOnly={readOnly}
          placeholder="예: 약 복용 알림"
          onChange={(values) => setField('needs', values)}
        />
        <TagEditor
          label="불편한 점(Pains)"
          values={pains}
          readOnly={readOnly}
          placeholder="예: 외출 시 불안"
          onChange={(values) => setField('pains', values)}
        />
      </div>
      <FieldShell label="바라는 점(Gains)" readOnly={readOnly} value={formData.gains}>
        <textarea
          className={inputClass(false)}
          rows={3}
          value={String(formData.gains ?? '')}
          onChange={(event) => setField('gains', event.target.value)}
        />
      </FieldShell>
      <FieldShell label="대표 인용문" readOnly={readOnly} value={formData.quote}>
        <input
          className={inputClass(false)}
          maxLength={150}
          value={String(formData.quote ?? '')}
          onChange={(event) => setField('quote', event.target.value)}
        />
      </FieldShell>
    </div>
  );

  const renderEmpathyMap = () => (
    <div className={`${sectionClass} grid gap-4 md:grid-cols-2`}>
      {[
        { key: 'says', label: '말하는 것(Says)' },
        { key: 'thinks', label: '생각하는 것(Thinks)' },
        { key: 'does', label: '행동하는 것(Does)' },
        { key: 'feels', label: '느끼는 것(Feels)' },
        { key: 'core_pain', label: '핵심 고통 요소' },
        { key: 'core_gain', label: '핵심 이득 요소' },
      ].map((item) => (
        <FieldShell key={item.key} label={item.label} readOnly={readOnly} value={formData[item.key]}>
          {item.key.startsWith('core_') ? (
            <input
              className={inputClass(false)}
              value={String(formData[item.key] ?? '')}
              onChange={(event) => setField(item.key, event.target.value)}
            />
          ) : (
            <textarea
              className={inputClass(false)}
              rows={4}
              value={String(formData[item.key] ?? '')}
              onChange={(event) => setField(item.key, event.target.value)}
            />
          )}
        </FieldShell>
      ))}
    </div>
  );

  const renderJourneyMap = () => (
    <div className={sectionClass}>
      <FieldShell label="대상자 코드" readOnly={readOnly} value={formData.persona_code}>
        <select
          className={inputClass(false)}
          value={String(formData.persona_code ?? '')}
          onChange={(event) => setField('persona_code', event.target.value)}
        >
          <option value="">대상자를 선택하세요</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.code}>
              {subject.code}
            </option>
          ))}
        </select>
      </FieldShell>
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={`stage-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">{index + 1}단계</h4>
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() => setField('stages', stages.filter((_, stageIndex) => stageIndex !== index))}
                  disabled={stages.length <= 3}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 disabled:opacity-40"
                >
                  삭제
                </button>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { key: 'name', label: '단계명' },
                { key: 'action', label: '행동' },
                { key: 'pain_point', label: '불편한 점' },
                { key: 'opportunity', label: '기회 요소' },
              ].map((item) => (
                <FieldShell key={item.key} label={item.label} readOnly={readOnly} value={stage[item.key as keyof StageRecord]}>
                  <input
                    className={inputClass(false)}
                    value={stage[item.key as keyof StageRecord] as string}
                    onChange={(event) => {
                      const nextStages = [...stages];
                      nextStages[index] = { ...stage, [item.key]: event.target.value };
                      setField('stages', nextStages);
                    }}
                  />
                </FieldShell>
              ))}
            </div>
            <RatingField
              label="감정 점수"
              value={stage.emotion}
              readOnly={readOnly}
              onChange={(value) => {
                const nextStages = [...stages];
                nextStages[index] = { ...stage, emotion: value };
                setField('stages', nextStages);
              }}
            />
          </div>
        ))}
        {!readOnly ? (
          <button
            type="button"
            onClick={() =>
              setField('stages', [...stages, { name: '', action: '', emotion: 3, pain_point: '', opportunity: '' }])
            }
            disabled={stages.length >= 7}
            className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            단계 추가
          </button>
        ) : null}
      </div>
      <div className="h-64 rounded-3xl border border-slate-200 bg-white p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
            <Tooltip />
            <Line type="monotone" dataKey="emotion" stroke="#3b82f6" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderIdeaCard = () => (
    <div className={sectionClass}>
      <FieldShell label="아이디어 제목" readOnly={readOnly} value={formData.title}>
        <input
          className={inputClass(false)}
          value={String(formData.title ?? '')}
          onChange={(event) => setField('title', event.target.value)}
        />
      </FieldShell>
      <FieldShell label="관련 HMW 질문" readOnly={readOnly} value={formData.related_hmw}>
        <div className="space-y-3">
          {hmwOptions.length ? (
            <select
              className={inputClass(false)}
              value={String(formData.related_hmw ?? '')}
              onChange={(event) => setField('related_hmw', event.target.value)}
            >
              <option value="">같은 워크숍의 HMW 질문을 선택하세요</option>
              {hmwOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : null}
          <input
            className={inputClass(false)}
            value={String(formData.related_hmw ?? '')}
            onChange={(event) => setField('related_hmw', event.target.value)}
            placeholder="직접 입력"
          />
        </div>
      </FieldShell>
      <FieldShell label="아이디어 설명" readOnly={readOnly} value={formData.description}>
        <textarea
          className={inputClass(false)}
          rows={4}
          value={String(formData.description ?? '')}
          onChange={(event) => setField('description', event.target.value)}
        />
      </FieldShell>
      <FieldShell label="필요 자원 / 조건" readOnly={readOnly} value={formData.required_resources}>
        <input
          className={inputClass(false)}
          value={String(formData.required_resources ?? '')}
          onChange={(event) => setField('required_resources', event.target.value)}
        />
      </FieldShell>
      <div className="grid gap-4 md:grid-cols-3">
        <RatingField
          label="실현 가능성"
          value={Number(formData.feasibility ?? 3)}
          readOnly={readOnly}
          onChange={(value) => setField('feasibility', value)}
        />
        <RatingField
          label="현장 적합성"
          value={Number(formData.field_relevance ?? 3)}
          readOnly={readOnly}
          onChange={(value) => setField('field_relevance', value)}
        />
        <FieldShell label="투표 수" readOnly={readOnly} value={formData.vote_count}>
          <input
            type="number"
            className={inputClass(false)}
            value={String(formData.vote_count ?? 0)}
            onChange={(event) => setField('vote_count', Number(event.target.value || 0))}
          />
        </FieldShell>
      </div>
    </div>
  );

  const renderPrototypeSpec = () => (
    <div className={sectionClass}>
      <FieldShell label="아이디어 제목" readOnly={readOnly} value={formData.idea_title}>
        <input
          className={inputClass(false)}
          value={String(formData.idea_title ?? '')}
          onChange={(event) => setField('idea_title', event.target.value)}
        />
      </FieldShell>
      <FieldShell label="해결하려는 문제" readOnly={readOnly} value={formData.problem_to_solve}>
        <textarea
          className={inputClass(false)}
          rows={4}
          value={String(formData.problem_to_solve ?? '')}
          onChange={(event) => setField('problem_to_solve', event.target.value)}
        />
      </FieldShell>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldShell label="주요 사용자" readOnly={readOnly} value={formData.target_users}>
          <input
            className={inputClass(false)}
            value={String(formData.target_users ?? '')}
            onChange={(event) => setField('target_users', event.target.value)}
          />
        </FieldShell>
        <FieldShell label="프로토타입 유형" readOnly={readOnly} value={formData.prototype_type}>
          <select
            className={inputClass(false)}
            value={String(formData.prototype_type ?? 'service')}
            onChange={(event) => setField('prototype_type', event.target.value)}
          >
            {prototypeTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldShell>
      </div>
      <FieldShell label="핵심 기능 / 내용" readOnly={readOnly} value={formData.core_function}>
        <textarea
          className={inputClass(false)}
          rows={4}
          value={String(formData.core_function ?? '')}
          onChange={(event) => setField('core_function', event.target.value)}
        />
      </FieldShell>
      <StringListEditor
        label="구성 요소"
        values={components}
        readOnly={readOnly}
        buttonLabel="구성 요소 추가"
        onChange={(values) => setField('components', values)}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FieldShell label="테스트 시나리오" readOnly={readOnly} value={formData.test_scenario}>
          <textarea
            className={inputClass(false)}
            rows={4}
            value={String(formData.test_scenario ?? '')}
            onChange={(event) => setField('test_scenario', event.target.value)}
          />
        </FieldShell>
        <FieldShell label="성공 기준" readOnly={readOnly} value={formData.success_criteria}>
          <textarea
            className={inputClass(false)}
            rows={4}
            value={String(formData.success_criteria ?? '')}
            onChange={(event) => setField('success_criteria', event.target.value)}
          />
        </FieldShell>
      </div>
    </div>
  );

  const renderTestResult = () => (
    <div className={sectionClass}>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldShell label="테스트 일시" readOnly={readOnly} value={formData.test_date}>
          <input
            type="date"
            className={inputClass(false)}
            value={String(formData.test_date ?? '')}
            onChange={(event) => setField('test_date', event.target.value)}
          />
        </FieldShell>
        <FieldShell label="장소" readOnly={readOnly} value={formData.location}>
          <input
            className={inputClass(false)}
            value={String(formData.location ?? '')}
            onChange={(event) => setField('location', event.target.value)}
          />
        </FieldShell>
      </div>
      <FieldShell label="참여 대상자" readOnly={readOnly} value={participants}>
        <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          {subjects.map((subject) => {
            const checked = participants.includes(subject.code);
            return (
              <label key={subject.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setField('participants', [...participants, subject.code]);
                    } else {
                      setField(
                        'participants',
                        participants.filter((item) => item !== subject.code)
                      );
                    }
                  }}
                />
                {subject.code}
              </label>
            );
          })}
        </div>
      </FieldShell>
      {[
        { key: 'process_summary', label: '진행 요약' },
        { key: 'went_well', label: '잘된 점' },
        { key: 'needs_improvement', label: '개선이 필요한 점' },
        { key: 'participant_feedback', label: '참여자 피드백' },
        { key: 'next_action', label: '다음 액션' },
      ].map((item) => (
        <FieldShell key={item.key} label={item.label} readOnly={readOnly} value={formData[item.key]}>
          <textarea
            className={inputClass(false)}
            rows={4}
            value={String(formData[item.key] ?? '')}
            onChange={(event) => setField(item.key, event.target.value)}
          />
        </FieldShell>
      ))}
      <RatingField
        label="종합 점수"
        value={Number(formData.overall_score ?? 3)}
        readOnly={readOnly}
        onChange={(value) => setField('overall_score', value)}
      />
    </div>
  );

  const renderReflection = () => (
    <div className={sectionClass}>
      {[
        { key: 'what_i_did', label: '내가 한 일' },
        { key: 'what_i_learned', label: '배운 점' },
        { key: 'what_was_hard', label: '어려웠던 점' },
        { key: 'what_i_want_to_try', label: '다음에 시도해 보고 싶은 점' },
        { key: 'message_to_team', label: '팀에게 남기는 말' },
      ].map((item) => (
        <FieldShell key={item.key} label={item.label} readOnly={readOnly} value={formData[item.key]}>
          <textarea
            className={inputClass(false)}
            rows={4}
            value={String(formData[item.key] ?? '')}
            onChange={(event) => setField(item.key, event.target.value)}
          />
        </FieldShell>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Worksheet</p>
        <h3 className="mt-3 text-2xl font-semibold text-slate-900">{getWorksheetTemplateLabel(templateKey)}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{WORKSHEET_TEMPLATE_DESCRIPTIONS[templateKey]}</p>
      </section>

      {templateKey === 'observation_log' ? renderObservationLog() : null}
      {templateKey === 'hmw' ? renderHmw() : null}
      {templateKey === 'persona' ? renderPersona() : null}
      {templateKey === 'empathy_map' ? renderEmpathyMap() : null}
      {templateKey === 'journey_map' ? renderJourneyMap() : null}
      {templateKey === 'idea_card' ? renderIdeaCard() : null}
      {templateKey === 'prototype_spec' ? renderPrototypeSpec() : null}
      {templateKey === 'test_result' ? renderTestResult() : null}
      {templateKey === 'reflection' ? renderReflection() : null}
    </div>
  );
}
