'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

export interface DataTableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'boolean' | 'date';
  editable?: boolean;
  options?: SelectOption[];
  sortable?: boolean;
  render?: (value: unknown, item: Record<string, unknown> & { id: number }) => ReactNode;
}

interface FilterOption {
  key: string;
  label: string;
  options: SelectOption[];
}

interface DataTableProps<T extends { id: number }> {
  data: T[];
  columns: DataTableColumn[];
  editable: boolean;
  onSave?: (id: number, field: string, value: unknown) => void | Promise<void>;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: number) => void;
  searchable?: boolean;
  filterOptions?: FilterOption[];
  emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export default function DataTable<T extends { id: number }>({
  data,
  columns,
  editable,
  onSave,
  onAdd,
  onEdit,
  onDelete,
  searchable = false,
  filterOptions = [],
  emptyMessage = '데이터가 없습니다.',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const filteredAndSortedData = useMemo(() => {
    const filtered = data.filter((item) => {
      const itemRecord = item as Record<string, unknown>;

      if (searchable && searchTerm) {
        const keyword = searchTerm.toLowerCase();
        const matched = columns.some((column) => {
          const value = itemRecord[column.key];
          return value !== undefined && value !== null && String(value).toLowerCase().includes(keyword);
        });

        if (!matched) {
          return false;
        }
      }

      return Object.entries(filters).every(([key, value]) => {
        if (!value) {
          return true;
        }

        return String(itemRecord[key] ?? '') === value;
      });
    });

    if (!sortColumn || !sortDirection) {
      return filtered;
    }

    return [...filtered].sort((left, right) => {
      const leftRecord = left as Record<string, unknown>;
      const rightRecord = right as Record<string, unknown>;
      const leftValue = String(leftRecord[sortColumn] ?? '');
      const rightValue = String(rightRecord[sortColumn] ?? '');

      const result = leftValue.localeCompare(rightValue, 'ko');
      return sortDirection === 'asc' ? result : result * -1;
    });
  }, [columns, data, filters, searchTerm, searchable, sortColumn, sortDirection]);

  const handleSort = (column: DataTableColumn) => {
    if (!column.sortable) {
      return;
    }

    if (sortColumn !== column.key) {
      setSortColumn(column.key);
      setSortDirection('asc');
      return;
    }

    if (sortDirection === 'asc') {
      setSortDirection('desc');
      return;
    }

    if (sortDirection === 'desc') {
      setSortColumn(null);
      setSortDirection(null);
      return;
    }

    setSortDirection('asc');
  };

  const openEditCell = (rowId: number, column: DataTableColumn) => {
    if (!editable || !column.editable || !onSave) {
      return;
    }

    const row = data.find((item) => Number(item.id) === rowId);
    const rowRecord = row as Record<string, unknown> | undefined;
    const currentValue = rowRecord?.[column.key];

    if (column.type === 'boolean') {
      const nextValue = !Boolean(currentValue);
      void onSave(rowId, column.key, nextValue);
      return;
    }

    setEditingCell({ rowId, columnKey: column.key });
    setEditValue(currentValue === undefined || currentValue === null ? '' : String(currentValue));
  };

  const coerceValue = (column: DataTableColumn, rawValue: string, currentValue: unknown) => {
    if (column.type === 'number') {
      return rawValue === '' ? null : Number(rawValue);
    }

    if (column.type === 'select' && typeof currentValue === 'number') {
      return Number(rawValue);
    }

    return rawValue;
  };

  const closeEditor = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEditCell = async (column: DataTableColumn) => {
    if (!editingCell || !onSave) {
      return;
    }

    const row = data.find((item) => Number(item.id) === editingCell.rowId);
    if (!row) {
      closeEditor();
      return;
    }

    const rowRecord = row as Record<string, unknown>;
    const value = coerceValue(column, editValue, rowRecord[column.key]);
    await onSave(editingCell.rowId, column.key, value);
    closeEditor();
  };

  const renderCell = (item: T, column: DataTableColumn) => {
    const itemRecord = item as Record<string, unknown>;
    const value = itemRecord[column.key];
    const isEditing = editingCell?.rowId === Number(item.id) && editingCell.columnKey === column.key;

    if (isEditing) {
      if (column.type === 'select') {
        return (
          <select
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
            onBlur={() => void saveEditCell(column)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void saveEditCell(column);
              }

              if (event.key === 'Escape') {
                closeEditor();
              }
            }}
            className="w-full rounded-lg border border-blue-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          >
            {column.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      return (
        <input
          type={column.type === 'date' ? 'date' : column.type === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(event) => setEditValue(event.target.value)}
          onBlur={() => void saveEditCell(column)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void saveEditCell(column);
            }

            if (event.key === 'Escape') {
              closeEditor();
            }
          }}
          className="w-full rounded-lg border border-blue-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      );
    }

    if (column.render) {
      return column.render(value, item as Record<string, unknown> & { id: number });
    }

    if (column.type === 'boolean') {
      return value ? '✅' : '❌';
    }

    return String(value ?? '');
  };

  const hasActions = editable && (onEdit || onDelete);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {searchable && (
              <label className="relative block min-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="검색"
                  className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            )}
            {filterOptions.map((filterOption) => (
              <select
                key={filterOption.key}
                value={filters[filterOption.key] ?? ''}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    [filterOption.key]: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{filterOption.label}</option>
                {filterOption.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
          {editable && onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />
              추가
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  <button
                    type="button"
                    onClick={() => handleSort(column)}
                    className={`flex items-center gap-1 ${column.sortable ? 'cursor-pointer hover:text-slate-700' : 'cursor-default'}`}
                  >
                    <span>{column.label}</span>
                    {sortColumn === column.key && sortDirection === 'asc' && <ChevronUp className="h-3.5 w-3.5" />}
                    {sortColumn === column.key && sortDirection === 'desc' && <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </th>
              ))}
              {hasActions && <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">관리</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAndSortedData.map((item) => (
              <tr key={String(item.id)} className="hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 align-top text-sm text-slate-700 ${editable && column.editable && onSave ? 'cursor-pointer' : ''}`}
                    onClick={() => openEditCell(Number(item.id), column)}
                  >
                    {renderCell(item, column)}
                  </td>
                ))}
                {hasActions && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(Number(item.id))}
                          className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedData.length === 0 && <div className="px-4 py-10 text-center text-sm text-slate-500">{emptyMessage}</div>}
    </div>
  );
}
