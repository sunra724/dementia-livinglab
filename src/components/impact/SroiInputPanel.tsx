'use client';

import { calculateSroi, formatKRW, type SroiInput } from '@/lib/sroi';

interface SroiInputPanelProps {
  input: SroiInput;
  onChange: (input: SroiInput) => void;
  editable?: boolean;
}

const sliderFields = [
  {
    key: 'attributionRate',
    label: '귀인율',
    hint: '본 사업 기여 비중',
    min: 0.05,
    max: 0.5,
    step: 0.05,
  },
  {
    key: 'deadweightRate',
    label: '사중손실률',
    hint: '사업이 없어도 발생할 비중',
    min: 0,
    max: 0.5,
    step: 0.05,
  },
  {
    key: 'dropOffRate',
    label: '효과 감소율',
    hint: '연간 성과 감소분',
    min: 0,
    max: 0.3,
    step: 0.05,
  },
] as const;

const countFields = [
  { key: 'activistCount', label: '활동가 수' },
  { key: 'institutionCount', label: '참여기관 수' },
  { key: 'elderCount', label: '어르신 대상자 수' },
  { key: 'familyCount', label: '가족 돌봄자 수' },
  { key: 'promotionReach', label: '홍보 도달 수' },
] as const;

function toPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function SroiInputPanel({
  input,
  onChange,
  editable = true,
}: SroiInputPanelProps) {
  const sroi = calculateSroi(input);
  const valueItems = [
    { label: '① 활동가 역량 강화', value: sroi.activistValue, color: '#46549C' },
    { label: '② 대상자 삶의 질 개선', value: sroi.subjectValue, color: '#248DAC' },
    { label: '③ 기관 역량 강화', value: sroi.institutionValue, color: '#228D7B' },
    { label: '④ 지역사회 인프라', value: sroi.communityValue, color: '#E8A838' },
  ];

  const updateNumber = (key: keyof SroiInput, value: number) => {
    onChange({ ...input, [key]: value });
  };

  const updateBoolean = (key: keyof SroiInput, value: boolean) => {
    onChange({ ...input, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] p-5 text-white shadow-sm" style={{ background: '#46549C' }}>
        <p className="text-[11px] text-white/70">사회적투자수익률 (SROI)</p>
        <p className="mt-2 text-[36px] font-semibold leading-none">
          {sroi.sroi.toFixed(2)}
          <span className="text-[18px] font-normal text-white/80"> : 1</span>
        </p>
        <p className="mt-2 text-[12px] text-white/80">
          1원 투입 → {sroi.sroi.toFixed(2)}원의 사회적 가치 창출
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-4 text-[11px]">
          <div>
            <p className="text-white/60">총 사회적 가치</p>
            <p className="mt-1 font-medium text-white">{formatKRW(sroi.totalSocialValue)}</p>
          </div>
          <div>
            <p className="text-white/60">순 사회적 가치</p>
            <p className="mt-1 font-medium text-white">{formatKRW(sroi.netSocialValue)}</p>
          </div>
          <div>
            <p className="text-white/60">총 투입</p>
            <p className="mt-1 font-medium text-white">{formatKRW(sroi.totalInput)}</p>
          </div>
          <div>
            <p className="text-white/60">현금 투입</p>
            <p className="mt-1 font-medium text-white">{formatKRW(input.totalBudget)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[12px] font-semibold text-slate-900">이해관계자별 사회적 가치</p>
        <div className="mt-4 space-y-3">
          {valueItems.map((item) => {
            const ratio =
              sroi.totalSocialValue > 0
                ? Math.round((item.value / sroi.totalSocialValue) * 100)
                : 0;

            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-slate-700">{item.label}</span>
                  <span className="font-medium" style={{ color: item.color }}>
                    {formatKRW(item.value)} ({ratio}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${ratio}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-[12px] font-semibold text-slate-900">핵심 입력값</p>
          <p className="mt-1 text-[10px] text-slate-500">
            예산, 비현금 투입, 도달 수는 보고서 계산의 기본값으로 사용됩니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-[10px] text-slate-500">
            총예산
            <input
              type="number"
              min={0}
              value={input.totalBudget}
              onChange={(event) => updateNumber('totalBudget', Number(event.target.value) || 0)}
              disabled={!editable}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-right text-[12px] text-slate-700 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>
          <label className="text-[10px] text-slate-500">
            비현금 투입
            <input
              type="number"
              min={0}
              value={input.nonCashInput}
              onChange={(event) => updateNumber('nonCashInput', Number(event.target.value) || 0)}
              disabled={!editable}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-right text-[12px] text-slate-700 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </label>
        </div>

        <label className="mt-3 flex items-center gap-2 text-[11px] text-slate-600">
          <input
            type="checkbox"
            checked={input.guideBookCreated}
            onChange={(event) => updateBoolean('guideBookCreated', event.target.checked)}
            disabled={!editable}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 disabled:cursor-not-allowed"
          />
          가이드북 완성 여부
        </label>
      </div>

      {editable ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <p className="text-[12px] font-semibold text-slate-900">조정 계수 설정</p>
            <p className="mt-1 text-[10px] text-slate-500">
              보수적 추정을 위한 할인율 조정입니다.
            </p>
          </div>

          <div className="space-y-4">
            {sliderFields.map((field) => (
              <div key={field.key}>
                <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-slate-700">
                    {field.label}
                    <span className="ml-1 text-slate-400">({field.hint})</span>
                  </span>
                  <span className="font-medium text-slate-900">
                    {toPercent(input[field.key])}
                  </span>
                </div>
                <input
                  type="range"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={input[field.key]}
                  onChange={(event) =>
                    updateNumber(field.key, Number(event.target.value))
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            {countFields.map((field) => (
              <label key={field.key} className="text-[10px] text-slate-500">
                {field.label}
                <input
                  type="number"
                  min={0}
                  value={input[field.key]}
                  onChange={(event) =>
                    updateNumber(field.key, Number(event.target.value) || 0)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-right text-[12px] text-slate-700"
                />
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl bg-slate-50 p-3 text-[10px] text-slate-500">
        <p className="mb-1 font-medium text-slate-700">단가 출처 (공인 기준)</p>
        <p>• 활동가 역량: 한국직업능력연구원 현장실습 효과 분석(2023)</p>
        <p>• 대상자 서비스: 보건복지부 사회적 처방 원가 분석(2023)</p>
        <p>• 기관 역량교육: 한국사회복지협의회 원가 분석(2022)</p>
        <p>• 홍보 도달: 중앙치매센터 캠페인 비용·효과 분석(2022)</p>
        <p className="mt-1 text-slate-400">
          ※ 보수적 추정값 적용. 중증화 예방·장기 취업 효과는 미산입했습니다.
        </p>
      </div>
    </div>
  );
}
