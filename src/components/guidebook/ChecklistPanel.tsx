'use client';

import { useState } from 'react';
import { CheckCircle, Circle, Star } from 'lucide-react';
import type { ChecklistItem } from '@/lib/types';
import ProgressBar from '@/components/dashboard/ProgressBar';

interface ChecklistPanelProps {
  phase: number;
  items: ChecklistItem[];
  completionCount: number;
  title?: string;
  editable?: boolean;
  onCheck?: (id: number, data: { completed_by: string; evidence_note: string }) => void;
}

export default function ChecklistPanel({
  phase,
  items,
  completionCount,
  title,
  editable = false,
  onCheck,
}: ChecklistPanelProps) {
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [completedBy, setCompletedBy] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');

  const totalItems = items.length;
  const percentage = totalItems > 0 ? Math.round((completionCount / totalItems) * 100) : 0;

  const handleCheck = (item: ChecklistItem) => {
    if (!editable || item.completed) {
      return;
    }

    setEditingItem(item.id);
    setCompletedBy('');
    setEvidenceNote('');
  };

  const handleSave = () => {
    if (!editingItem || !onCheck) {
      return;
    }

    onCheck(editingItem, {
      completed_by: completedBy.trim(),
      evidence_note: evidenceNote.trim(),
    });
    setEditingItem(null);
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">
          📋 {title ?? `${phase}단계 체크리스트`}
        </h2>
        <ProgressBar
          label={`${completionCount}/${totalItems} 완료`}
          current={completionCount}
          target={Math.max(totalItems, 1)}
          showPercent={false}
        />
        <div className="mt-1 text-sm text-slate-600">{percentage}% 완료</div>
      </div>

      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleCheck(item)}
              className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left ${
                item.completed
                  ? 'bg-green-50'
                  : editable
                    ? 'bg-slate-50 transition hover:bg-slate-100'
                    : 'bg-slate-50'
              } ${editable && !item.completed ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="mt-0.5 shrink-0">
                {item.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : item.required ? (
                  <Star className="h-5 w-5 text-red-500" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${item.completed ? 'text-green-800' : 'text-slate-900'}`}>
                    {item.title}
                  </span>
                  {item.required ? <Star className="h-3 w-3 text-red-500" /> : null}
                </div>
                {item.description ? (
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                ) : null}
                {item.completed && item.completed_date ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(item.completed_date).toLocaleDateString('ko-KR')}
                    {item.completed_by ? ` · ${item.completed_by}` : ''}
                  </p>
                ) : null}
                {item.completed && item.evidence_note ? (
                  <p className="mt-1 text-xs text-slate-500">증빙: {item.evidence_note}</p>
                ) : null}
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
            등록된 항목이 없습니다.
          </div>
        )}
      </div>

      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">완료 정보 입력</h3>
            <div className="mt-4 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">완료자</span>
                <input
                  type="text"
                  value={completedBy}
                  onChange={(event) => setCompletedBy(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="이름 입력"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">증빙 메모</span>
                <textarea
                  value={evidenceNote}
                  onChange={(event) => setEvidenceNote(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="증빙 자료 설명"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!completedBy.trim()}
                className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
