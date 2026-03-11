'use client';

import { useMemo, useState } from 'react';
import { Copy, QrCode, ShieldOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { WorksheetTemplateKey, WorksheetToken } from '@/lib/types';
import { buildWorksheetUrl, getWorksheetTemplateLabel } from '@/lib/worksheets';

interface TokenManagerProps {
  workshopId: number;
  workshopTitle: string;
  availableTemplates: WorksheetTemplateKey[];
  tokens: WorksheetToken[];
  onCreateToken: (templateKey: WorksheetTemplateKey) => Promise<{ token: string; url: string }>;
  onDeactivate: (tokenId: number) => Promise<void>;
}

export default function TokenManager({
  workshopTitle,
  availableTemplates,
  tokens,
  onCreateToken,
  onDeactivate,
}: TokenManagerProps) {
  const [copiedTokenId, setCopiedTokenId] = useState<number | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [creatingTemplate, setCreatingTemplate] = useState<WorksheetTemplateKey | null>(null);

  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const tokenMap = useMemo(
    () =>
      availableTemplates.reduce<Record<WorksheetTemplateKey, WorksheetToken[]>>((result, templateKey) => {
        result[templateKey] = tokens.filter((token) => token.template_key === templateKey);
        return result;
      }, {} as Record<WorksheetTemplateKey, WorksheetToken[]>),
    [availableTemplates, tokens]
  );

  const handleCopy = async (token: WorksheetToken) => {
    const url = buildWorksheetUrl(origin, token.token);
    await navigator.clipboard.writeText(url);
    setCopiedTokenId(token.id);
    window.setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const handlePrint = () => {
    document.body.classList.add('print-worksheet-qr');
    window.print();
    window.setTimeout(() => document.body.classList.remove('print-worksheet-qr'), 300);
  };

  return (
    <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">제출 링크 관리</h3>
        <p className="mt-1 text-sm text-slate-500">{workshopTitle}에서 사용하는 템플릿별 공개 제출 링크입니다.</p>
      </div>

      <div className="space-y-4">
        {availableTemplates.map((templateKey) => {
          const templateTokens = tokenMap[templateKey] ?? [];

          return (
            <div key={templateKey} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{getWorksheetTemplateLabel(templateKey)}</p>
                  <p className="text-xs text-slate-500">
                    {templateTokens.length ? `${templateTokens.length}개 링크` : '생성된 링크 없음'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setCreatingTemplate(templateKey);
                    try {
                      await onCreateToken(templateKey);
                    } finally {
                      setCreatingTemplate(null);
                    }
                  }}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
                  disabled={creatingTemplate === templateKey}
                >
                  {creatingTemplate === templateKey ? '생성 중...' : '새 링크 생성'}
                </button>
              </div>

              <div className="space-y-3">
                {templateTokens.length ? (
                  templateTokens.map((token) => {
                    const url = buildWorksheetUrl(origin, token.token);
                    return (
                      <div
                        key={token.id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{url}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {token.active ? '활성 링크' : '비활성화됨'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleCopy(token)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                          >
                            <Copy className="h-4 w-4" />
                            {copiedTokenId === token.id ? '복사됨' : '복사'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setQrUrl(url)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                          >
                            <QrCode className="h-4 w-4" />
                            QR
                          </button>
                          {token.active ? (
                            <button
                              type="button"
                              onClick={() => void onDeactivate(token.id)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600"
                            >
                              <ShieldOff className="h-4 w-4" />
                              비활성화
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
                    아직 생성된 링크가 없습니다.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {qrUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="worksheet-qr-modal w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">QR 코드</h4>
                <p className="mt-1 text-sm text-slate-500">모바일에서 링크를 바로 열 수 있습니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setQrUrl(null)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
              >
                닫기
              </button>
            </div>
            <div className="mt-6 flex flex-col items-center gap-4">
              <QRCodeSVG value={qrUrl} size={240} />
              <p className="break-all text-center text-xs text-slate-500">{qrUrl}</p>
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                QR 인쇄
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
