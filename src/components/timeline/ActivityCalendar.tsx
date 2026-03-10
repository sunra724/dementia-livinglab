'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { WorkshopType, ProgressStatus, LivingLabPhase } from '@/lib/types';
import StatusBadge from '../dashboard/StatusBadge';

export interface ActivityCalendarEvent {
  date: string;
  title: string;
  type: WorkshopType;
  phase: LivingLabPhase;
  status: ProgressStatus;
}

interface ActivityCalendarProps {
  year: number;
  month: number;
  events: ActivityCalendarEvent[];
  onDateClick?: (date: string) => void;
}

function formatDateKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export default function ActivityCalendar({
  year,
  month,
  events,
  onDateClick,
}: ActivityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

  const days = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDateKey(date);
    return events.filter(event => event.date === dateStr);
  };

  const getStatusColor = (status: ProgressStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDateKey(date);
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
    onDateClick?.(dateStr);
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(new Date(selectedDate)) : [];

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {year}년 {month}월 활동 캘린더
        </h3>
      </div>

      <div className="overflow-x-auto">
        <div className="mb-4 grid min-w-[720px] grid-cols-7 gap-1">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}

          {days.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentMonth = date.getMonth() === month - 1;
            const isToday = date.toDateString() === new Date().toDateString();
            const dateStr = formatDateKey(date);
            const isSelected = selectedDate === dateStr;

            return (
              <div
                key={index}
                className={`min-h-[96px] cursor-pointer border p-2 hover:bg-gray-50 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday ? 'border-blue-200 bg-blue-50' : 'border-gray-200'} ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleDateClick(date)}
              >
                <div className="mb-1 text-sm font-medium">
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`rounded px-1 py-0.5 text-xs text-white ${getStatusColor(event.status)}`}
                      title={event.title}
                    >
                      {event.title.length > 10 ? `${event.title.substring(0, 10)}...` : event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 2}개
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDateEvents.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            {new Date(selectedDate!).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })} 일정
          </h4>
          <div className="space-y-2">
            {selectedDateEvents.map((event, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{event.title}</div>
                  <div className="text-xs text-gray-600">
                    <StatusBadge type="phase" value={event.phase} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
