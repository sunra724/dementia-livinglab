'use client';

import { X } from 'lucide-react';
import type { WorksheetEntry } from '@/lib/types';
import WorksheetForm from '@/components/guidebook/WorksheetForm';
import { parseWorksheetContent } from '@/lib/worksheets';

interface WorksheetEntryDialogProps {
  entry: WorksheetEntry;
  workshopTitle: string;
  onClose: () => void;
  footer?: React.ReactNode;
}

export default function WorksheetEntryDialog({
  entry,
  workshopTitle,
  onClose,
  footer,
}: WorksheetEntryDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-slate-500">{workshopTitle}</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">
              {entry.filled_by_name} {entry.group_name ? `(${entry.group_name})` : ''}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <WorksheetForm
            key={`${entry.id}-${entry.template_key}`}
            templateKey={entry.template_key}
            initialData={parseWorksheetContent(entry.template_key, entry.content_json)}
            readOnly
            workshopId={entry.workshop_id}
          />
          {footer ? <div className="border-t border-slate-200 pt-6">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
