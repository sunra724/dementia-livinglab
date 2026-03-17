import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { calculateSroi, formatKRW, type SroiInput, type SroiResult } from '@/lib/sroi';
import {
  IMPACT_SECTIONS,
  type ImpactContextResponse,
  type ImpactSectionKey,
} from '@/lib/impact';

export const runtime = 'nodejs';

const impactSectionKeys = new Set<ImpactSectionKey>(
  IMPACT_SECTIONS.map((section) => section.key)
);

function createTextStreamResponse(text: string) {
  const encoder = new TextEncoder();
  const chunks = text.match(/[\s\S]{1,120}/g) ?? [text];

  return new Response(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    }),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Accel-Buffering': 'no',
      },
    }
  );
}

function buildProjectSummary(context: ImpactContextResponse) {
  return `
[사업 기본 정보]
- 사업명: ${context.projectName}
- 운영기관: ${context.organization}
- 사업기간: ${context.period}
- 현재 리빙랩 단계: ${context.currentPhase}단계 진행 중

[주요 수치]
- 활동가(대학생): ${context.participantStats.activist_count}명
- 어르신 대상자: ${context.subjectStats.elder_count}명 (동의서 ${context.subjectStats.consent_count}명)
- 가족 돌봄자: ${context.subjectStats.family_count}명
- 참여기관 MOU: ${context.institutionStats.mou_count}개소
- 워크숍: ${context.workshopStats.completed}회 완료 (전체 ${context.workshopStats.total}회 예정)
- 워크시트: ${context.worksheetTotal}건 제출, ${context.worksheetReviewed}건 검토 완료
- 홍보 총 도달: ${context.promotionStats.total_reach.toLocaleString('ko-KR')}명
- 사업비 집행: ${formatKRW(context.budgetStats.total_actual)} / ${formatKRW(
    context.budgetStats.total_planned
  )}
  `.trim();
}

function buildSectionPrompts(context: ImpactContextResponse, sroiInput: SroiInput, sroi: SroiResult) {
  return {
    overview: `
아래 사업 데이터를 바탕으로 임팩트 보고서의 1. 사업 개요 및 이해관계자 분석 섹션을 작성해주세요.

포함 내용:
1. 사업 추진 배경 (치매 100만 명 시대, 지역사회 돌봄의 필요성)
2. 리빙랩 방식의 의의 (전문가 주도에서 당사자·지역사회 주도 방식으로의 전환)
3. 활동가, 어르신·가족 돌봄자, 참여기관, 지역사회 4개 이해관계자 분석

분량: 600~800자. 전문적이되 읽기 쉬운 공문서 문체.
    `,
    logicmodel: `
아래 사업 데이터를 바탕으로 2. 투입·산출·성과 분석 (Logic Model) 섹션을 작성해주세요.

포함 내용:
- 투입(Input): 현금 ${formatKRW(sroiInput.totalBudget)}, 비현금 ${formatKRW(
      sroiInput.nonCashInput
    )}, 총 9개월 운영
- 산출(Output): 워크숍 ${context.workshopStats.completed}회, 워크시트 ${
      context.worksheetTotal
    }건, 홍보 ${context.promotionStats.total_reach.toLocaleString('ko-KR')}명 도달
- 성과(Outcome): 리빙랩 6단계별 주요 성과
- 임팩트(Impact): 치매 친화 지역사회 모델 구축 방향

표 형식 없이 서술형으로. 분량: 700~900자.
    `,
    sroi: `
아래 SROI 계산 결과를 바탕으로 3. 사회적투자수익률(SROI) 분석 섹션을 작성해주세요.

[SROI 계산 결과]
총 투입 (현금+비현금): ${formatKRW(sroi.totalInput)}
① 활동가 역량 강화: ${formatKRW(sroi.activistValue)} (${sroiInput.activistCount}명 × 27만원)
② 대상자 삶의 질 개선: ${formatKRW(sroi.subjectValue)} (어르신 ${
      sroiInput.elderCount
    }명 × 30만원 + 가족 ${sroiInput.familyCount}명 × 20만원)
③ 기관 역량 강화: ${formatKRW(sroi.institutionValue)} (${sroiInput.institutionCount}개소 × 60만원)
④ 지역사회 인프라: ${formatKRW(sroi.communityValue)} (홍보 ${sroiInput.promotionReach.toLocaleString(
      'ko-KR'
    )}명 도달 + 가이드북)
총 사회적 가치: ${formatKRW(sroi.totalSocialValue)}
SROI = ${sroi.sroi.toFixed(2)} : 1

다음 내용을 포함:
1. SROI 개념 간략 설명
2. 4개 항목별 가치의 의미
3. SROI 비율 해석 및 의의
4. 측정 한계와 보수적 추정 명시

분량: 900~1,100자. 숫자를 근거로 설득력 있게.
    `,
    policy: `
아래 사업 성과를 바탕으로 4. 정책부합성 분석 섹션을 작성해주세요.

[리빙랩 주요 성과]
- 현재 진행 단계: ${context.currentPhase}단계
- 완료 워크숍: ${context.workshopStats.completed}회
- 치매안심센터 및 협력기관 MOU: ${context.institutionStats.mou_count}개소
- 어르신 참여: ${context.subjectStats.elder_count}명

다음 정책과의 정합성을 구체적으로 분석:
1. 치매국가책임제
2. 지역사회 통합 돌봄(커뮤니티케어) 3단계
3. 제4차 치매관리종합계획 및 후속 계획
4. 대구광역시 및 남구 지역 정책

분량: 800~1,000자.
    `,
    scalability: `
아래 성과 데이터를 바탕으로 5. 확장가능성 및 지속가능성 분석 섹션을 작성해주세요.

[성과 데이터]
- 활동가: ${sroiInput.activistCount}명 (경북대·계명대·대구가톨릭대·영남대 4개교 기반)
- 참여기관: ${sroiInput.institutionCount}개소 MOU
- 워크시트: ${context.worksheetTotal}건
- 가이드북: ${sroiInput.guideBookCreated ? '완성' : '작성 중'}
- 대시보드: Next.js + SQLite 기반

다음 3단계 확장 시나리오를 포함해주세요.
1. 타 지역 치매안심센터 복제
2. 타 돌봄 대상자로 확장
3. 정부 위탁 사업 연계

각 시나리오별 전제 조건과 기대 성과를 함께 서술해주세요. 분량: 800~1,000자.
    `,
    highlights: `
아래 리빙랩 단계별 데이터를 바탕으로 6. 리빙랩 6단계 주요 성과 섹션을 작성해주세요.

[단계별 체크리스트 완료 현황]
${context.checklistByPhase
  .map(
    (item) =>
      `- ${item.phase}단계: ${item.done}/${item.total}개 완료 (필수 ${item.required_done}/${item.required_total})`
  )
  .join('\n')}

[워크시트 유형별 제출 현황]
${context.worksheetByTemplate
  .map(
    (item) =>
      `- ${item.template_key}: ${item.total}건 (검토 완료 ${item.reviewed_count}건)`
  )
  .join('\n')}

각 단계별 핵심 성과와 다음 단계로 이어지는 인사이트를 정리해주세요. 전체 분량: 700~900자.
    `,
    conclusion: `
앞서 작성된 SROI ${sroi.sroi.toFixed(2)}:1, 정책부합성, 확장가능성 시나리오를 종합해
7. 결론 및 제언 섹션을 작성해주세요.

포함 내용:
1. 핵심 성과 3줄 요약
2. 치매돌봄 리빙랩 모델의 차별성
3. 발주·협력기관에 대한 제언 3가지
4. 운영기관에 대한 후속 과제 2가지
5. 맺음말

분량: 700~900자.
    `,
  } satisfies Record<ImpactSectionKey, string>;
}

function buildFallbackSection(
  section: ImpactSectionKey,
  context: ImpactContextResponse,
  sroiInput: SroiInput,
  sroi: SroiResult
) {
  const completionSummary = context.checklistByPhase
    .map(
      (item) =>
        `${item.phase}단계는 전체 ${item.total}개 중 ${item.done}개를 완료했고, 필수 과업은 ${item.required_done}개를 이행했습니다.`
    )
    .join(' ');
  const worksheetSummary = context.worksheetByTemplate
    .map((item) => `${item.template_key} ${item.total}건`)
    .join(', ');

  switch (section) {
    case 'overview':
      return `치매돌봄 리빙랩은 치매 100만 명 시대에 지역사회 기반 돌봄 체계를 실험하고 검증하기 위해 추진된 사업입니다. ${context.organization}은 일회성 프로그램 제공을 넘어, 어르신과 가족 돌봄자, 활동가, 협력기관이 함께 문제를 정의하고 해법을 설계하는 리빙랩 방식을 적용했습니다.\n\n현재 사업에는 활동가 ${context.participantStats.activist_count}명, 어르신 ${context.subjectStats.elder_count}명, 가족 돌봄자 ${context.subjectStats.family_count}명, 협력기관 ${context.institutionStats.mou_count}개소가 참여하고 있습니다. 활동가는 현장조사와 워크시트 작성, 퍼실리테이션 보조를 통해 실천 역량을 강화하고, 어르신과 가족은 자신의 경험을 바탕으로 서비스 개선에 직접 참여합니다. 치매안심센터와 복지기관은 현장 접근성과 제도 연계의 기반을 제공하며, 지역사회는 홍보 도달 ${context.promotionStats.total_reach.toLocaleString('ko-KR')}명을 통해 치매 친화 환경 조성의 토대를 넓혀가고 있습니다.\n\n이 사업의 핵심 의의는 전문가가 해답을 정하는 방식이 아니라, 당사자의 경험과 생활 맥락을 해법 설계의 출발점으로 삼는 데 있습니다. 이러한 구조는 향후 지역 치매정책과 복지 실천을 연결하는 실증적 플랫폼으로 확장될 수 있다는 점에서 의미가 큽니다.`;
    case 'logicmodel':
      return `본 사업의 투입은 현금 ${formatKRW(sroiInput.totalBudget)}과 비현금 ${formatKRW(
        sroiInput.nonCashInput
      )}, 그리고 2026년 3월부터 11월까지 이어지는 9개월 운영 기간으로 구성됩니다. 이를 기반으로 활동가와 기관 실무자가 현장 워크숍과 조사, 기록, 해석 과정을 반복하며 리빙랩을 운영하고 있습니다.\n\n현재까지 워크숍은 ${context.workshopStats.completed}회 완료되었고, 워크시트는 총 ${context.worksheetTotal}건 제출되어 현장 문제와 사용자 경험이 구조화되었습니다. 홍보 활동은 ${context.promotionStats.total_reach.toLocaleString(
        'ko-KR'
      )}명에게 도달했고, 사업비는 ${formatKRW(
        context.budgetStats.total_actual
      )}이 집행되어 실험과 운영의 기반을 뒷받침했습니다. 이는 단순한 프로그램 집행 결과를 넘어, 향후 프로토타입 개발과 현장 실증으로 이어질 수 있는 중간 산출을 축적했다는 의미를 가집니다.\n\n성과 측면에서 리빙랩은 준비 단계의 협력체계 구축을 지나 문제정의 단계에서 실제 생활 문제를 구체화하고 있습니다. 향후 아이디어 발굴과 프로토타입 제작, 테스트 단계가 이어지면 치매친화적 서비스 모델을 지역 단위에서 재현 가능한 구조로 정리할 수 있을 것입니다. 즉, 본 사업은 개별 프로그램의 성공보다 지역사회 돌봄 전달체계를 실험하는 과정 자체를 성과로 축적하고 있습니다.`;
    case 'sroi':
      return `SROI는 투입 대비 사회적 가치가 얼마나 창출되었는지를 정량적으로 해석하는 방법론입니다. 본 사업에서는 활동가 역량 강화, 대상자 삶의 질 개선, 기관 역량 강화, 지역사회 인프라 구축이라는 네 개의 이해관계자 축을 기준으로 사회적 가치를 계산했습니다.\n\n분석 결과 총 투입은 ${formatKRW(
        sroi.totalInput
      )}이며, 총 사회적 가치는 ${formatKRW(
        sroi.totalSocialValue
      )}로 추정됩니다. 이에 따라 SROI는 ${sroi.sroi.toFixed(
        2
      )}:1로 산출되었고, 이는 1원의 투입이 약 ${sroi.sroi.toFixed(
        2
      )}원의 사회적 가치를 창출했음을 의미합니다. 세부적으로는 활동가 역량 강화 가치 ${formatKRW(
        sroi.activistValue
      )}, 대상자 삶의 질 개선 가치 ${formatKRW(
        sroi.subjectValue
      )}, 기관 역량 강화 가치 ${formatKRW(
        sroi.institutionValue
      )}, 지역사회 인프라 가치 ${formatKRW(
        sroi.communityValue
      )}가 반영되었습니다.\n\n이 수치는 귀인율 ${Math.round(
        sroiInput.attributionRate * 100
      )}%, 사중손실률 ${Math.round(
        sroiInput.deadweightRate * 100
      )}%, 효과 감소율 ${Math.round(
        sroiInput.dropOffRate * 100
      )}%를 적용한 보수적 추정값이라는 점에서 의미가 있습니다. 특히 중증화 예방 효과, 장기 취업 효과, 가족 돌봄 부담의 장기 감소 등은 본 계산에 포함하지 않았습니다. 따라서 현재 수치는 과장된 기대가 아니라, 확인 가능한 범위 안에서 본 사업이 이미 유의미한 사회적 가치를 창출하고 있음을 보여주는 최소 추정치로 해석할 수 있습니다.`;
    case 'policy':
      return `본 사업은 치매국가책임제가 강조하는 조기 발견, 예방, 가족 지원 강화 방향과 긴밀하게 맞닿아 있습니다. 치매안심센터와의 협업 구조를 바탕으로 어르신 ${context.subjectStats.elder_count}명과 가족 돌봄자를 리빙랩 과정에 참여시키고 있다는 점은, 서비스 수혜자를 정책 실행의 공동 설계자로 전환한다는 측면에서 의미가 큽니다.\n\n또한 2026년 보편화 단계로 진입하는 지역사회 통합 돌봄 정책과도 높은 정합성을 가집니다. 지역사회 안에서 생활을 지속하도록 지원하는 재가 중심 돌봄 체계는, 현장 문제를 생활 맥락에서 발견하고 해법을 설계하는 리빙랩 방식과 직접적으로 연결됩니다. 제4차 치매관리종합계획과 후속 계획이 강조해 온 돌봄 전달체계 구축, 치매 친화 환경 조성, 협력 네트워크 강화 역시 본 사업의 워크숍 ${context.workshopStats.completed}회, MOU ${context.institutionStats.mou_count}개소라는 성과와 맞물립니다.\n\n지역 정책 측면에서도 대구광역시와 남구가 추진하는 고령친화도시 전략, 지역사회보장계획, 치매안심센터 연계사업과 접점이 분명합니다. 특히 협력기관이 현장 실행과 행정 연계를 동시에 담당하고 있다는 점은 향후 지자체 단위 확산 가능성을 높입니다. 즉, 본 사업은 개별 프로그램을 넘어 중앙 정책과 지역 실행을 연결하는 실증적 중간모델로 기능하고 있습니다.`;
    case 'scalability':
      return `본 사업의 확장 가능성은 세 가지 축에서 검토할 수 있습니다. 첫째, 타 지역 치매안심센터 복제 시나리오입니다. 현재 활동가 ${sroiInput.activistCount}명과 협력기관 ${sroiInput.institutionCount}개소를 기반으로 축적한 운영 경험은 가이드북과 대시보드로 구조화될 수 있으며, 이를 통해 다른 치매안심센터도 비교적 짧은 교육과 적응 과정을 거쳐 동일한 방식을 적용할 수 있습니다.\n\n둘째, 타 돌봄 대상자로의 확장입니다. 이번 사업에서 검증된 워크시트 ${context.worksheetTotal}건과 템플릿 구조는 발달장애, 고립노인, 경증 우울 등 인접한 돌봄 분야에도 이식 가능성이 높습니다. 생활 맥락 기반 문제정의, 다주체 협업, 현장 실증이라는 방법론은 특정 질환에만 한정되지 않기 때문입니다.\n\n셋째, 정부 위탁 및 제도화 시나리오입니다. Next.js와 SQLite 기반의 비교적 가벼운 기술 스택, 활동가 양성 구조, 기관 협력 모델은 공공사업과 대학 교과과정, 지역 위탁사업에 접목하기에 유리합니다. 다만 확산을 위해서는 표준 운영매뉴얼, 퍼실리테이터 교육 체계, 성과 측정 지표의 표준화가 함께 구축되어야 합니다. 이러한 조건이 충족될 경우 본 모델은 단일 프로젝트를 넘어 치매친화 지역사회를 설계하는 플랫폼으로 성장할 수 있습니다.`;
    case 'highlights':
      return `리빙랩은 준비 단계에서 협력기관 MOU ${context.institutionStats.mou_count}개소를 확보하고, 활동가와 실무자의 역할 구조를 정비하는 것으로 출발했습니다. 문제정의 단계에서는 워크숍 ${context.workshopStats.completed}회를 통해 어르신과 가족의 실제 생활문제를 수집하고, 워크시트 ${worksheetSummary}를 축적하며 현장 기반 데이터를 구조화했습니다.\n\n현재까지의 체크리스트 진행 상황을 보면 ${completionSummary} 이는 사업이 단순 행사 운영을 넘어 단계별 학습과 검증 구조를 갖추고 있음을 보여줍니다. 특히 워크시트 제출 ${context.worksheetTotal}건과 검토 완료 ${context.worksheetReviewed}건은 현장의 목소리가 누적되고 있다는 증거입니다.\n\n앞으로 아이디어, 프로토타입, 테스트, 확산 단계가 이어지면서 본 사업은 보다 구체적인 솔루션 검증 단계로 이동하게 됩니다. 지금까지의 핵심 인사이트는 치매돌봄의 문제를 서비스 제공자의 관점이 아니라 당사자의 일상 경험에서 다시 정의해야 한다는 점이며, 이는 이후 모든 단계의 기준점으로 작동할 것입니다.`;
    case 'conclusion':
      return `본 사업은 활동가 ${sroiInput.activistCount}명, 어르신 ${context.subjectStats.elder_count}명, 협력기관 ${context.institutionStats.mou_count}개소를 기반으로 치매돌봄 문제를 지역사회 안에서 다시 설계하는 실험을 수행해 왔습니다. 현재까지 완료된 워크숍은 ${context.workshopStats.completed}회이며, SROI는 ${sroi.sroi.toFixed(2)}:1로 추정되어 공공성과 효율성을 함께 입증할 가능성을 보여주고 있습니다.\n\n치매돌봄 리빙랩 모델의 차별성은 수혜자를 단순 참여자가 아니라 해법 설계의 주체로 위치시킨다는 데 있습니다. 이는 기존 복지서비스가 제공 중심이었다면, 본 모델은 문제 발견과 해결의 전 과정을 공동 생산 방식으로 전환한다는 점에서 구별됩니다.\n\n향후 발주기관과 협력기관에는 첫째, 치매안심센터와 지역 복지기관을 잇는 상설 협업체계 구축, 둘째, 리빙랩 기반 실증사업의 예산 항목화, 셋째, 성과지표의 제도적 반영을 제안할 수 있습니다. 운영기관에는 후속 가이드북 완성과 표준 운영모델 정리, 퍼실리테이터 양성체계 구축이라는 과제가 남아 있습니다. 지역사회 기반 치매돌봄의 미래는 정답을 전달하는 방식이 아니라, 당사자와 함께 문제를 정의하고 실험하는 과정에서 더 구체적으로 열릴 것입니다.`;
    default:
      return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      context?: ImpactContextResponse;
      sroiInput?: SroiInput;
      section?: string;
    };

    if (!payload.context || !payload.sroiInput || !payload.section) {
      return NextResponse.json(
        { error: 'context, sroiInput and section are required' },
        { status: 400 }
      );
    }

    if (!impactSectionKeys.has(payload.section as ImpactSectionKey)) {
      return NextResponse.json({ error: 'invalid section' }, { status: 400 });
    }

    const context = payload.context;
    const sroiInput = payload.sroiInput;
    const section = payload.section as ImpactSectionKey;
    const sroi = calculateSroi(sroiInput);
    const projectSummary = buildProjectSummary(context);
    const sectionPrompts = buildSectionPrompts(context, sroiInput, sroi);
    const systemPrompt =
      '당신은 사회적 가치 평가와 임팩트 보고서 작성 전문가입니다. 한국의 사회적경제, 치매·노인복지 정책, 리빙랩 방법론에 깊은 이해가 있으며, 보고서는 공공기관과 시민 모두가 읽기 쉬운 단정한 문체로 작성합니다. 수치는 과장하지 않고, 보수적 가정과 한계를 솔직히 드러냅니다. 마크다운 목록 없이 순수 텍스트 문단 중심으로 답변합니다.';
    const userPrompt = `${projectSummary}\n\n${sectionPrompts[section]}`;
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    if (!apiKey) {
      return createTextStreamResponse(
        buildFallbackSection(section, context, sroiInput, sroi)
      );
    }

    const client = new Anthropic({ apiKey });
    let stream: Awaited<ReturnType<typeof client.messages.create>>;

    try {
      stream = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        stream: true,
      });
    } catch (error) {
      console.error('Anthropic request failed, falling back to local draft:', error);
      return createTextStreamResponse(
        buildFallbackSection(section, context, sroiInput, sroi)
      );
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (error) {
          console.error('Anthropic streaming failed, falling back to local draft:', error);
          controller.enqueue(
            encoder.encode(buildFallbackSection(section, context, sroiInput, sroi))
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('POST /api/impact/generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
