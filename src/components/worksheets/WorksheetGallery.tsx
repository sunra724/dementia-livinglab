'use client';

import { useState } from 'react';
import type { Workshop, WorksheetEntry, WorksheetTemplateKey } from '@/lib/types';
import { getWorksheetTemplateLabel } from '@/lib/worksheets';
import WorksheetCard from '@/components/worksheets/WorksheetCard';

interface WorksheetGalleryProps {
  entries: WorksheetEntry[];
  workshops: Workshop[];
  onCardClick: (entry: WorksheetEntry) => void;
}

const templateOptions: Array<'all' | WorksheetTemplateKey> = [
  'all',
  'observation_log',
  'hmw',
  'persona',
  'empathy_map',
  'journey_map',
  'idea_card',
  'prototype_spec',
  'test_result',
  'reflection',
];

export default function WorksheetGallery({
  entries,
  workshops,
  onCardClick,
}: WorksheetGalleryProps) {
  const [templateFilter, setTemplateFilter] = useState<'all' | WorksheetTemplateKey>('all');
  const [workshopFilter, setWorkshopFilter] = useState<'all' | number>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'reviewed' | 'pending'>('all');

  const filteredEntries = entries.filter((entry) => {
    if (templateFilter !== 'all' && entry.template_key !== templateFilter) {
      return false;
    }

    if (workshopFilter !== 'all' && entry.workshop_id !== workshopFilter) {
      return false;
    }

    if (reviewFilter === 'reviewed' && !entry.reviewed) {
      return false;
    }

    if (reviewFilter === 'pending' && entry.reviewed) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex flex-wrap gap-2">
            {templateOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTemplateFilter(option)}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  templateFilter === option
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {option === 'all' ? '전체' : getWorksheetTemplateLabel(option)}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:ml-auto">
            <select
              value={String(workshopFilter)}
              onChange={(event) =>
                setWorkshopFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
            >
              <option value="all">모든 워크숍</option>
              {workshops.map((workshop) => (
                <option key={workshop.id} value={workshop.id}>
                  [{workshop.id}] {workshop.title}
                </option>
              ))}
            </select>
            <select
              value={reviewFilter}
              onChange={(event) =>
                setReviewFilter(event.target.value as 'all' | 'reviewed' | 'pending')
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
            >
              <option value="all">모든 상태</option>
              <option value="reviewed">검토 완료</option>
              <option value="pending">검토 대기</option>
            </select>
          </div>
        </div>
      </div>

      {filteredEntries.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEntries.map((entry) => (
            <WorksheetCard
              key={entry.id}
              entry={entry}
              workshopTitle={workshops.find((workshop) => workshop.id === entry.workshop_id)?.title ?? '-'}
              onClick={() => onCardClick(entry)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
          조건에 맞는 워크시트가 없습니다.
        </div>
      )}
    </div>
  );
}
