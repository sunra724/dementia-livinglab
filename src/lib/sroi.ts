export interface SroiInput {
  totalBudget: number;
  nonCashInput: number;
  activistCount: number;
  elderCount: number;
  familyCount: number;
  institutionCount: number;
  promotionReach: number;
  guideBookCreated: boolean;
  attributionRate: number;
  deadweightRate: number;
  dropOffRate: number;
}

export interface SroiResult {
  activistValue: number;
  subjectValue: number;
  institutionValue: number;
  communityValue: number;
  totalSocialValue: number;
  totalInput: number;
  netSocialValue: number;
  sroi: number;
  unitRates: {
    activist: number;
    elder: number;
    family: number;
    institution: number;
    promotionPerReach: number;
    guideBook: number;
  };
}

export const DEFAULT_SROI_INPUT: SroiInput = {
  totalBudget: 4_510_000,
  nonCashInput: 8_694_000,
  activistCount: 12,
  elderCount: 15,
  familyCount: 5,
  institutionCount: 5,
  promotionReach: 3200,
  guideBookCreated: false,
  attributionRate: 0.15,
  deadweightRate: 0.2,
  dropOffRate: 0.1,
};

export const BASE_UNIT_RATES = {
  activist: 270_000,
  elder: 300_000,
  family: 200_000,
  institution: 600_000,
  promotionPerReach: 100,
  guideBook: 5_000_000,
} as const;

export function calculateSroi(input: SroiInput): SroiResult {
  const adjustmentFactor =
    input.attributionRate * (1 - input.deadweightRate) * (1 - input.dropOffRate);

  const activistValue = input.activistCount * BASE_UNIT_RATES.activist * adjustmentFactor;
  const subjectValue =
    (input.elderCount * BASE_UNIT_RATES.elder + input.familyCount * BASE_UNIT_RATES.family) *
    adjustmentFactor;
  const institutionValue =
    input.institutionCount * BASE_UNIT_RATES.institution * adjustmentFactor;
  const communityValue =
    (input.promotionReach * BASE_UNIT_RATES.promotionPerReach +
      (input.guideBookCreated ? BASE_UNIT_RATES.guideBook : 0)) *
    adjustmentFactor;

  const totalSocialValue =
    activistValue + subjectValue + institutionValue + communityValue;
  const totalInput = input.totalBudget + input.nonCashInput;
  const netSocialValue = totalSocialValue - totalInput;
  const sroi = totalInput > 0 ? totalSocialValue / totalInput : 0;

  return {
    activistValue,
    subjectValue,
    institutionValue,
    communityValue,
    totalSocialValue,
    totalInput,
    netSocialValue,
    sroi,
    unitRates: { ...BASE_UNIT_RATES },
  };
}

export function formatKRW(value: number): string {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 100_000_000) {
    return `약 ${(value / 100_000_000).toFixed(1)}억원`;
  }

  if (absoluteValue >= 10_000) {
    return `약 ${Math.round(value / 10_000).toLocaleString('ko-KR')}만원`;
  }

  return `${value.toLocaleString('ko-KR')}원`;
}
