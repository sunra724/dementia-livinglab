'use client';

import { useState } from 'react';
import { ChecklistItem } from '@/lib/types';
import { Star, CheckCircle, Circle } from 'lucide-react';
import ProgressBar from '../dashboard/ProgressBar';

interface ChecklistPanelProps {
  phase: number;
  items: ChecklistItem[];
  completionCount: number;
  editable?: boolean;
  onCheck?: (id: number, data: { completed_by: string; evidence_note: string }) => void;
}

export default function ChecklistPanel({
  phase,
  items,
  completionCount,
  editable = false,
  onCheck,
}: ChecklistPanelProps) {
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [completedBy, setCompletedBy] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');

  const handleCheck = (item: ChecklistItem) => {
    if (!editable || item.completed) return;
    setEditingItem(item.id);
    setCompletedBy('');
    setEvidenceNote('');
  };

  const handleSave = () => {
    if (editingItem && onCheck) {
      onCheck(editingItem, { completed_by: completedBy, evidence_note: evidenceNote });
      setEditingItem(null);
    }
  };

  const totalItems = items.length;
  const percentage = totalItems > 0 ? Math.round((completionCount / totalItems) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          📋 {phase}단계: {items[0]?.category || '체크리스트'}
        </h2>
        <ProgressBar
          label={`${completionCount}/${totalItems} 완료`}
          current={completionCount}
          target={totalItems}
          showPercent={false}
        />
        <div className="text-sm text-gray-600 mt-1">{percentage}% 완료</div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start space-x-3 p-3 rounded-md ${
              item.completed ? 'bg-green-50' : editable ? 'bg-gray-50 hover:bg-gray-100 cursor-pointer' : 'bg-gray-50'
            }`}
            onClick={() => handleCheck(item)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {item.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : item.required ? (
                <Star className="w-5 h-5 text-red-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${item.completed ? 'text-green-800' : 'text-gray-900'}`}>
                  {item.title}
                </span>
                {item.required && <Star className="w-3 h-3 text-red-500" />}
              </div>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              )}
              {item.completed && item.completed_date && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(item.completed_date).toLocaleDateString('ko-KR')} - {item.completed_by}
                </p>
              )}
              {item.completed && item.evidence_note && (
                <p className="text-xs text-gray-500 mt-1">증빙: {item.evidence_note}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">완료 정보 입력</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  완료자
                </label>
                <input
                  type="text"
                  value={completedBy}
                  onChange={(e) => setCompletedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="이름 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  증빙 메모
                </label>
                <textarea
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="증빙 자료 설명"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!completedBy.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}