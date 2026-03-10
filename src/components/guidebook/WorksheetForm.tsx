'use client';

import { useState } from 'react';
import { WorksheetTemplateKey } from '@/lib/types';

interface WorksheetFormProps {
  templateKey: WorksheetTemplateKey;
  initialData?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void;
  readOnly?: boolean;
}

export default function WorksheetForm({
  templateKey,
  initialData = {},
  onSubmit,
  readOnly = false,
}: WorksheetFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);

  const handleChange = (key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const renderField = (key: string, label: string, type: 'text' | 'textarea' | 'select' | 'number', options?: string[]) => {
    if (readOnly) {
      return (
        <div key={key} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
            {formData[key] as string || '미입력'}
          </div>
        </div>
      );
    }

    return (
      <div key={key} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {type === 'textarea' ? (
          <textarea
            value={(formData[key] as string) || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        ) : type === 'select' ? (
          <select
            value={(formData[key] as string) || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택하세요</option>
            {options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={(formData[key] as string) || ''}
            onChange={(e) => handleChange(key, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>
    );
  };

  const renderTemplate = () => {
    switch (templateKey) {
      case 'hmw':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">How Might We 질문 도출</h3>
            {renderField('problem_situation', '문제 상황', 'textarea')}
            {renderField('related_subjects', '관련 대상자', 'text')}
            {renderField('hmw_question_1', 'HMW 질문 1', 'text')}
            {renderField('hmw_question_2', 'HMW 질문 2', 'text')}
            {renderField('hmw_question_3', 'HMW 질문 3', 'text')}
            {renderField('core_insight', '핵심 통찰', 'textarea')}
          </div>
        );

      case 'persona':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">페르소나 작성</h3>
            {renderField('code', '코드', 'text')}
            {renderField('age_group', '연령대', 'select', ['60대', '70대', '80대', '90대'])}
            {renderField('daily_routine', '하루 일과', 'textarea')}
            {renderField('needs', 'Needs (쉼표로 구분)', 'text')}
            {renderField('pains', 'Pains (쉼표로 구분)', 'text')}
            {renderField('gains', 'Gains', 'textarea')}
          </div>
        );

      case 'empathy_map':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">공감지도 작성</h3>
            {renderField('says', 'Says (말하는 것)', 'textarea')}
            {renderField('thinks', 'Thinks (생각하는 것)', 'textarea')}
            {renderField('does', 'Does (하는 것)', 'textarea')}
            {renderField('feels', 'Feels (느끼는 것)', 'textarea')}
            {renderField('core_pain', '핵심 고통', 'text')}
            {renderField('core_gain', '핵심 이득', 'text')}
          </div>
        );

      case 'idea_card':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">아이디어 카드</h3>
            {renderField('title', '제목', 'text')}
            {renderField('problem_solved', '해결하는 문제', 'text')}
            {renderField('content', '내용', 'textarea')}
            {renderField('resources_needed', '필요 자원', 'text')}
            {renderField('feasibility', '실현가능성 (1-5)', 'number')}
            {renderField('field_relevance', '현장성 (1-5)', 'number')}
          </div>
        );

      case 'test_result':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">테스트 결과</h3>
            {renderField('date', '일시', 'text')}
            {renderField('location', '장소', 'text')}
            {renderField('participants', '참여자 (쉼표로 구분)', 'text')}
            {renderField('summary', '진행 요약', 'textarea')}
            {renderField('good_points', '잘된 점', 'textarea')}
            {renderField('improvements', '개선점', 'textarea')}
            {renderField('feedback_summary', '피드백 요약', 'textarea')}
            {renderField('next_actions', '다음 액션', 'textarea')}
          </div>
        );

      default:
        return <div>지원되지 않는 템플릿입니다.</div>;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border">
      {renderTemplate()}
      {!readOnly && (
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            저장
          </button>
        </div>
      )}
    </form>
  );
}