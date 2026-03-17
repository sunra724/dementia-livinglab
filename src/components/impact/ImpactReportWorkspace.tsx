'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  ChevronDown,
  ChevronUp,
  Printer,
  RefreshCw,
  Settings2,
  Sparkles,
} from 'lucide-react';
import RouteLoading from '@/components/feedback/RouteLoading';
import SroiInputPanel from '@/components/impact/SroiInputPanel';
import {
  IMPACT_SECTIONS,
  type ImpactContextResponse,
  type ImpactSectionKey,
} from '@/lib/impact';
import {
  DEFAULT_SROI_INPUT,
  calculateSroi,
  formatKRW,
  type SroiInput,
} from '@/lib/sroi';

interface ImpactReportWorkspaceProps {
  editable: boolean;
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}_fetch_failed`);
  }

  return (await response.json()) as T;
};

function toSectionErrorMessage(value: string) {
  try {
    const parsed = JSON.parse(value) as { error?: string };
    return parsed.error ?? value;
  } catch {
    return value;
  }
}

export default function ImpactReportWorkspace({
  editable,
}: ImpactReportWorkspaceProps) {
  const {
    data: context,
    error: contextError,
    isLoading: contextLoading,
    mutate,
  } = useSWR<ImpactContextResponse>('/api/impact/context', fetcher);
  const [sroiInput, setSroiInput] = useState<SroiInput>(DEFAULT_SROI_INPUT);
  const [generated, setGenerated] = useState<Partial<Record<ImpactSectionKey, string>>>({});
  const [sectionErrors, setSectionErrors] = useState<
    Partial<Record<ImpactSectionKey, string>>
  >({});
  const [generating, setGenerating] = useState<ImpactSectionKey | null>(null);
  const [activeSection, setActiveSection] = useState<ImpactSectionKey | null>(null);
  const [allGenerating, setAllGenerating] = useState(false);

  useEffect(() => {
    if (context?.sroiDefaults) {
      setSroiInput((previous) => ({ ...previous, ...context.sroiDefaults }));
    }
  }, [context]);

  const sroi = calculateSroi(sroiInput);
  const generatedCount = IMPACT_SECTIONS.filter((section) => Boolean(generated[section.key]))
    .length;
  const allGenerated = generatedCount === IMPACT_SECTIONS.length;

  const generateSection = async (sectionKey: ImpactSectionKey) => {
    if (!context) {
      return;
    }

    setGenerating(sectionKey);
    setActiveSection(sectionKey);
    setSectionErrors((previous) => ({ ...previous, [sectionKey]: '' }));
    setGenerated((previous) => ({ ...previous, [sectionKey]: '' }));

    try {
      const response = await fetch('/api/impact/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, sroiInput, section: sectionKey }),
      });

      if (!response.ok) {
        const message = toSectionErrorMessage(await response.text());
        throw new Error(message || '보고서 생성에 실패했습니다.');
      }

      if (!response.body) {
        const fallbackText = await response.text();
        setGenerated((previous) => ({ ...previous, [sectionKey]: fallbackText }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        setGenerated((previous) => ({
          ...previous,
          [sectionKey]: `${previous[sectionKey] ?? ''}${chunk}`,
        }));
      }
    } catch (error) {
      console.error(`Impact section generation failed for ${sectionKey}:`, error);
      setSectionErrors((previous) => ({
        ...previous,
        [sectionKey]:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류로 보고서 생성에 실패했습니다.',
      }));
    } finally {
      setGenerating(null);
    }
  };

  const generateAll = async () => {
    setAllGenerating(true);
    for (const section of IMPACT_SECTIONS) {
      await generateSection(section.key);
    }
    setAllGenerating(false);
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; }
          .no-print { display: none !important; }
          .print-break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      <div className="flex min-h-screen flex-col overflow-hidden">
        <div className="no-print border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-50 p-2 text-indigo-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-slate-900">
                  임팩트 보고서 생성기
                </h1>
                <p className="text-[11px] text-slate-500">
                  SROI · 정책부합성 · 확장가능성 3관점 자동 생성
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={editable ? '/impact-report' : '/admin/impact-report'}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${
                  editable
                    ? 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-900 text-white hover:bg-slate-700'
                }`}
              >
                <Settings2 className="h-3.5 w-3.5" />
                {editable ? '열람 모드' : '관리자 모드'}
              </Link>

              {generatedCount > 0 ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    allGenerated
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {generatedCount}/{IMPACT_SECTIONS.length} 섹션 완료
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
          <aside className="no-print w-full shrink-0 border-b border-slate-200 bg-slate-50 p-4 xl:w-80 xl:overflow-y-auto xl:border-b-0 xl:border-r">
            <p className="mb-3 text-[12px] font-medium text-slate-700">SROI 계산 설정</p>
            {contextLoading ? (
              <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 text-[12px] text-slate-400">
                데이터를 불러오는 중입니다...
              </div>
            ) : contextError || !context ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-[12px] text-red-700">
                컨텍스트를 불러오지 못했습니다.
                <button
                  type="button"
                  onClick={() => void mutate()}
                  className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-white"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <SroiInputPanel input={sroiInput} onChange={setSroiInput} editable={editable} />
            )}
          </aside>

          <div className="flex-1 overflow-y-auto p-5">
            {contextLoading ? (
              <RouteLoading />
            ) : contextError || !context ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-700">
                <p className="text-base font-semibold">임팩트 보고서용 데이터를 불러오지 못했습니다.</p>
                <button
                  type="button"
                  onClick={() => void mutate()}
                  className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <>
                <div className="no-print mb-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void generateAll()}
                    disabled={allGenerating}
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition disabled:opacity-50"
                    style={{ background: '#46549C' }}
                  >
                    <RefreshCw
                      size={14}
                      className={allGenerating ? 'animate-spin' : undefined}
                    />
                    {allGenerating ? '전체 생성 중...' : '전체 보고서 생성'}
                  </button>

                  {allGenerated ? (
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
                    >
                      <Printer size={14} />
                      PDF 인쇄
                    </button>
                  ) : null}
                </div>

                <div id="print-area">
                  <div
                    className="mb-6 rounded-[32px] p-8 text-white print-break-inside-avoid"
                    style={{ background: '#46549C' }}
                  >
                    <div className="text-[11px] text-white/60">
                      임팩트 보고서 · 협동조합 소이랩
                    </div>
                    <h1 className="mt-2 text-[24px] font-semibold leading-snug">
                      2026년 치매돌봄 리빙랩
                    </h1>
                    <p className="mt-1 text-[18px] text-white/85">
                      사회적 임팩트 분석 보고서
                    </p>
                    <p className="mt-1 text-[13px] text-white/60">
                      SROI · 정책부합성 · 확장가능성 3관점
                    </p>

                    <div className="mt-6 grid gap-4 border-t border-white/20 pt-5 md:grid-cols-3">
                      <div>
                        <p className="text-[11px] text-white/60">SROI</p>
                        <p className="mt-1 text-[20px] font-semibold text-white">
                          {sroi.sroi.toFixed(2)} : 1
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-white/60">사회적 가치 총액</p>
                        <p className="mt-1 text-[16px] font-medium text-white">
                          {formatKRW(sroi.totalSocialValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-white/60">운영기관</p>
                        <p className="mt-1 text-[13px] text-white">{context.organization}</p>
                        <p className="text-[11px] text-white/60">{context.period}</p>
                      </div>
                    </div>
                  </div>

                  {IMPACT_SECTIONS.map((section) => {
                    const isOpen =
                      activeSection === section.key ||
                      generating === section.key ||
                      Boolean(generated[section.key]);

                    return (
                      <section
                        key={section.key}
                        className="print-break-inside-avoid mb-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white"
                      >
                        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                generated[section.key]
                                  ? 'bg-emerald-500'
                                  : generating === section.key
                                    ? 'bg-blue-500'
                                    : 'bg-slate-300'
                              }`}
                            />
                            <h2 className="text-[14px] font-semibold text-slate-900">
                              {section.title}
                            </h2>
                          </div>

                          <div className="no-print flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveSection((previous) =>
                                  previous === section.key ? null : section.key
                                )
                              }
                              className="rounded-lg border border-slate-200 px-2 py-1 text-slate-500 hover:bg-slate-50"
                              aria-label={`${section.title} 열기 또는 닫기`}
                            >
                              {activeSection === section.key ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => void generateSection(section.key)}
                              disabled={Boolean(generating) || allGenerating}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:border-slate-300 disabled:opacity-40"
                            >
                              {generating === section.key
                                ? '생성 중...'
                                : generated[section.key]
                                  ? '재생성'
                                  : '생성'}
                            </button>
                          </div>
                        </div>

                        {isOpen ? (
                          <div className="px-5 pb-5 pt-4">
                            {generated[section.key] ? (
                              <>
                                {section.key === 'sroi' ? (
                                  <div className="mb-4 overflow-x-auto">
                                    <table className="w-full min-w-[640px] border-collapse text-[12px]">
                                      <thead>
                                        <tr className="bg-slate-50">
                                          <th className="border border-slate-200 px-3 py-2 text-left font-medium">
                                            항목
                                          </th>
                                          <th className="border border-slate-200 px-3 py-2 text-right font-medium">
                                            단가
                                          </th>
                                          <th className="border border-slate-200 px-3 py-2 text-right font-medium">
                                            적용 수량
                                          </th>
                                          <th className="border border-slate-200 px-3 py-2 text-right font-medium">
                                            사회적 가치
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {[
                                          {
                                            label: '① 활동가 역량 강화',
                                            unit: '27만원/인',
                                            qty: `${sroiInput.activistCount}명`,
                                            val: sroi.activistValue,
                                          },
                                          {
                                            label: '② 대상자 삶의 질 개선',
                                            unit: '30/20만원/인',
                                            qty: `어르신 ${sroiInput.elderCount}명 + 가족 ${sroiInput.familyCount}명`,
                                            val: sroi.subjectValue,
                                          },
                                          {
                                            label: '③ 기관 역량 강화',
                                            unit: '60만원/기관',
                                            qty: `${sroiInput.institutionCount}개소`,
                                            val: sroi.institutionValue,
                                          },
                                          {
                                            label: '④ 지역사회 인프라',
                                            unit: '100원/도달',
                                            qty: `${sroiInput.promotionReach.toLocaleString(
                                              'ko-KR'
                                            )}명 도달`,
                                            val: sroi.communityValue,
                                          },
                                        ].map((row) => (
                                          <tr key={row.label}>
                                            <td className="border border-slate-200 px-3 py-2">
                                              {row.label}
                                            </td>
                                            <td className="border border-slate-200 px-3 py-2 text-right text-slate-500">
                                              {row.unit}
                                            </td>
                                            <td className="border border-slate-200 px-3 py-2 text-right">
                                              {row.qty}
                                            </td>
                                            <td className="border border-slate-200 px-3 py-2 text-right font-medium">
                                              {formatKRW(row.val)}
                                            </td>
                                          </tr>
                                        ))}
                                        <tr className="bg-indigo-50">
                                          <td
                                            className="border border-slate-200 px-3 py-2 font-medium"
                                            colSpan={3}
                                          >
                                            총 사회적 가치
                                          </td>
                                          <td className="border border-slate-200 px-3 py-2 text-right font-semibold text-indigo-700">
                                            {formatKRW(sroi.totalSocialValue)}
                                          </td>
                                        </tr>
                                        <tr style={{ background: '#46549C' }}>
                                          <td
                                            className="px-3 py-2 font-semibold text-white"
                                            colSpan={3}
                                          >
                                            SROI (총가치 ÷ 총투입 {formatKRW(sroi.totalInput)})
                                          </td>
                                          <td className="px-3 py-2 text-right font-semibold text-white">
                                            {sroi.sroi.toFixed(2)} : 1
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                ) : null}

                                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                                  {generated[section.key]}
                                </p>
                              </>
                            ) : generating === section.key ? (
                              <div className="flex items-center gap-2 text-[12px] text-slate-400">
                                <RefreshCw size={14} className="animate-spin" />
                                AI가 {section.title} 섹션을 작성 중입니다...
                              </div>
                            ) : sectionErrors[section.key] ? (
                              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[12px] text-red-700">
                                {sectionErrors[section.key]}
                              </div>
                            ) : (
                              <p className="text-[12px] text-slate-400">
                                생성 버튼을 눌러 보고서 초안을 만들어주세요.
                              </p>
                            )}
                          </div>
                        ) : null}
                      </section>
                    );
                  })}

                  {allGenerated ? (
                    <div className="mt-6 border-t border-slate-200 py-6 text-center text-[11px] text-slate-400">
                      <p>
                        본 보고서는 협동조합 소이랩이 운영한 2026년 치매돌봄 리빙랩의 성과를
                        바탕으로 작성되었습니다.
                      </p>
                      <p>
                        발행: 협동조합 소이랩 · soilabcoop@gmail.com · 053-941-9003 ·
                        soilabcoop.kr
                      </p>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
