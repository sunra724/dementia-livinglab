'use client';

import { format, parseISO } from 'date-fns';
import { CheckCircle2, Clock3 } from 'lucide-react';
import type { WorksheetEntry } from '@/lib/types';
import {
  WORKSHEET_TEMPLATE_BADGES,
  getWorksheetTemplateLabel,
} from '@/lib/worksheets';

interface WorksheetCardProps {
  entry: WorksheetEntry;
  workshopTitle: string;
  onClick: () => void;
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  return format(parseISO(value), 'yyyy.MM.dd HH:mm');
}

export default function WorksheetCard({ entry, workshopTitle, onClick }: WorksheetCardProps) {
  const reviewed = entry.reviewed;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[28px] border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        reviewed ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${WORKSHEET_TEMPLATE_BADGES[entry.template_key]}`}
        >
          {getWorksheetTemplateLabel(entry.template_key)}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
            reviewed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {reviewed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
          {reviewed ? '검토 완료' : '검토 대기'}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-sm font-semibold text-slate-900">{workshopTitle}</p>
        <p className="text-sm text-slate-600">
          {entry.filled_by_name} {entry.group_name ? `(${entry.group_name})` : ''}
        </p>
        <p className="text-xs text-slate-500">제출일 {formatDate(entry.submitted_at)}</p>
      </div>
    </button>
  );
}
