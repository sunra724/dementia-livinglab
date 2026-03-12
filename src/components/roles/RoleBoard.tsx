'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type {
  FacilitatorRole,
  FacilitatorRoleAssignment,
  Participant,
} from '@/lib/types';
import {
  FACILITATOR_ROLE_DESCRIPTIONS,
  FACILITATOR_ROLE_ICON_LABELS,
  FACILITATOR_ROLE_ORDER,
} from '@/lib/safety';

interface RoleBoardProps {
  workshopId: number;
  workshopTitle: string;
  assignments: FacilitatorRoleAssignment[];
  availableParticipants: Participant[];
  editable?: boolean;
  onAssign?: (participantId: number, role: FacilitatorRole, notes: string) => Promise<void>;
  onRemove?: (id: number) => Promise<void>;
}

export default function RoleBoard({
  workshopTitle,
  assignments,
  availableParticipants,
  editable = false,
  onAssign,
  onRemove,
}: RoleBoardProps) {
  const [assigningRole, setAssigningRole] = useState<FacilitatorRole | null>(null);
  const [participantId, setParticipantId] = useState('');
  const [notes, setNotes] = useState('');
  const [savingRole, setSavingRole] = useState<FacilitatorRole | null>(null);

  const resetDraft = () => {
    setAssigningRole(null);
    setParticipantId('');
    setNotes('');
  };

  return (
    <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">역할 분담</h3>
        <p className="mt-1 text-sm text-slate-500">{workshopTitle} 운영을 위한 팀 역할 현황입니다.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FACILITATOR_ROLE_ORDER.map((role) => {
          const assignment = assignments.find((item) => item.role === role) ?? null;
          const participant = assignment
            ? availableParticipants.find((item) => item.id === assignment.participant_id) ?? null
            : null;
          const isDraft = assigningRole === role;

          return (
            <div
              key={role}
              className={`rounded-[24px] border p-4 ${
                assignment ? 'border-slate-200 bg-slate-50' : 'border-dashed border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{FACILITATOR_ROLE_ICON_LABELS[role]}</p>
                  <p className="mt-1 text-xs text-slate-500">{FACILITATOR_ROLE_DESCRIPTIONS[role]}</p>
                </div>
                {assignment && editable && onRemove ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm('이 역할 배정을 해제할까요?')) {
                        return;
                      }

                      void onRemove(assignment.id).catch(() => {
                        window.alert('역할 배정을 해제하지 못했습니다.');
                      });
                    }}
                    className="rounded-full bg-white p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {assignment ? (
                <div className="mt-5 space-y-2">
                  <p className="text-base font-semibold text-slate-900">{assignment.participant_name}</p>
                  <p className="text-sm text-slate-600">{participant?.affiliation ?? '소속 정보 없음'}</p>
                  <p className="text-xs text-slate-500">{assignment.notes || '메모 없음'}</p>
                </div>
              ) : isDraft && editable && onAssign ? (
                <div className="mt-5 space-y-3">
                  <select
                    value={participantId}
                    onChange={(event) => setParticipantId(event.target.value)}
                    className="min-h-11 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">참여자를 선택하세요</option>
                    {availableParticipants.map((participantOption) => (
                      <option key={participantOption.id} value={String(participantOption.id)}>
                        {participantOption.name} · {participantOption.affiliation}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="min-h-11 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    placeholder="메모"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextParticipantId = Number(participantId);
                        if (!nextParticipantId) {
                          return;
                        }

                        setSavingRole(role);
                        void onAssign(nextParticipantId, role, notes.trim())
                          .then(() => {
                            resetDraft();
                          })
                          .catch(() => {
                            window.alert('역할을 저장하지 못했습니다.');
                          })
                          .finally(() => setSavingRole(null));
                      }}
                      disabled={!participantId || savingRole === role}
                      className="min-h-11 flex-1 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                    >
                      {savingRole === role ? '저장 중...' : '배정'}
                    </button>
                    <button
                      type="button"
                      onClick={resetDraft}
                      className="min-h-11 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <p className="text-sm text-slate-400">(미배정)</p>
                  {editable && onAssign ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAssigningRole(role);
                        setParticipantId('');
                        setNotes('');
                      }}
                      className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
                    >
                      <Plus className="h-4 w-4" />
                      배정 +
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
