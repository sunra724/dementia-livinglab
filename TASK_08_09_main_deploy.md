# TASK_08 — 메인 대시보드 (열람 + 관리자)

> TASK_07 완료 후 진행.

---

## 목표

`/` (열람 메인) + `/admin` (관리자 메인) 구현.
모든 데이터를 통합해서 한눈에 보여주는 페이지.

---

## 1. `/page.tsx` (열람 메인)

병렬 SWR fetch:
```typescript
const { data: kpiData }       = useSWR('/api/kpi');
const { data: workshopData }  = useSWR('/api/workshops');
const { data: guidebookData } = useSWR('/api/guidebook');
const { data: promotionData } = useSWR('/api/promotion');
const { data: budgetData }    = useSWR('/api/budget');
```

**섹션 A — 사업 개요 헤더**

```
치매돌봄 리빙랩 통합 성과관리 대시보드
────────────────────────────────────────────
지역사회와 함께, 치매 어르신의 더 나은 일상을 설계합니다
사업기간: 2026.03 ~ 2026.11  |  현재: X월 (N개월차)
```

현재 날짜는 `new Date()`로 자동 계산. 개월차 = 현재 월 - 3 + 1.

**섹션 B — 리빙랩 단계 진행 (PhaseTimeline)**

전체 너비. 클릭 시 `/guidebook`으로 이동 (+ 해당 phase 쿼리 파라미터).
하단에 현재 단계 설명 텍스트:
```
📍 현재: 2단계 — 현장 이해·문제정의
"치매 어르신과 가족 돌봄자의 실제 문제를 현장에서 발견합니다"
```

**섹션 C — 핵심 KPI 카드 3열×3행 (9개, editable=false)**

**섹션 D — 이번 달 활동 요약 카드 3열**

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ 📅 이번 달 워크숍│  │ ✅ 완료된 체크  │  │ 💰 이번 달 지출 │
│   2회 예정      │  │   리스트 5개   │  │   420,000원    │
│   ✅ 1회 완료   │  │               │  │   집행률 18%   │
└────────────────┘  └────────────────┘  └────────────────┘
```

계산 방법:
- 이번 달 워크숍: workshops.filter(scheduled_date의 month === 현재월)
- 완료 체크리스트: guidebook의 이번 달 completed_date
- 이번 달 지출: budget의 이번 달 payment_date 합계

**섹션 E — 활동 캘린더 (ActivityCalendar)**

현재 년/월 기준. `events`는 workshops 데이터에서 생성.
우측 사이드: 이번 달 예정 워크숍 리스트.

**섹션 F — 예산 집행 현황 요약**

가로 1열 ProgressBar:
```
사업비 집행  ███░░░░░░░░░░  18%  (실지출 합계 / 계획 합계)
잔여 예산: X원
```

하단에 카테고리별 미니 바 (4개만 표시: 인건비/활동비/워크숍/여비)

**섹션 G — 최근 홍보 활동 (최신 3건 카드)**

```
┌──────────────────────────────────┐
│ 📸 인스타그램  |  2026.04.10      │
│ "치매안심센터 현장방문 스케치"    │
│ 도달: 380명  →  [링크 보기 ↗]   │
└──────────────────────────────────┘
```

URL 있으면 링크 표시, 없으면 버튼 비활성.

**섹션 H — 치매돌봄 현황 (배경 통계 + 지역 맥락)**

> 이 섹션은 외부 API 불필요. 모든 데이터를 상수로 하드코딩.
> 출처: 보건복지부·중앙치매센터 「2023년 치매역학조사 및 실태조사」 (2025.03 발표)

`src/lib/dementia-stats.ts` 파일 신규 생성 후 아래 상수 정의:

```typescript
// 출처: 보건복지부·중앙치매센터 「2023년 치매역학조사 및 실태조사」 2025년 3월 발표
export const NATIONAL_DEMENTIA_STATS = {
  source: '보건복지부·중앙치매센터 「2023년 치매역학조사 및 실태조사」',
  published: '2025년 3월',
  patients_2025: 970000,          // 2025년 추정 치매환자 수 (97만 명)
  patients_2026: 1010000,         // 2026년 100만 명 돌파 예상
  patients_2044: 2010000,         // 2044년 200만 명 예상
  prevalence_rate: 9.17,          // 2025년 치매 유병률 (%)
  mci_patients_2025: 2980000,     // 경도인지장애 추정 인구 (298만 명)
  family_burden_rate: 45.8,       // 가족 돌봄 부담 비율 (%)
  family_care_hours: 18,          // 비동거 가족 주당 평균 돌봄시간
  cost_per_patient: 22200000,     // 1인당 연간 관리비용 (원)
  national_total_cost: 20.8,      // 국가 치매 관리 비용 (조 원)
  severity_mild: 67.7,            // 경도 비율 (%)
  severity_moderate: 29.5,        // 중등도 비율 (%)
  severity_severe: 2.8,           // 중증 비율 (%)
} as const;

// 대구 지역 협력기관 관련 뉴스 (하드코딩 — 정기 업데이트 필요)
export const LOCAL_CONTEXT_NEWS = [
  {
    id: 1,
    institution: '수성구 치매안심센터',
    title: '2025 치매관리사업 우수사례 공모전 보건복지부장관상 수상',
    description: '독거 치매환자 방문 맞춤형 프로그램 "독거 치매 도망쳐, 건강수호대가 간다!" — 간호대학 동아리 연계',
    date: '2026-01-02',
    badge: '🏆 장관상',
    badgeColor: 'yellow',
  },
  {
    id: 2,
    institution: '수성구 치매안심센터',
    title: '치매환자 단기 쉼터 프로그램 "기억튼튼! 인지튼튼!" 운영',
    description: '경증 치매 환자 대상 인지훈련·회상훈련·실버 레크리에이션 등 주 3회, 3개월 과정',
    date: '2025-04-01',
    badge: '📋 프로그램',
    badgeColor: 'blue',
  },
] as const;
```

**섹션 H UI 구조:**

```
┌──────────────────────────────────────────────────────────────┐
│  📊 치매돌봄, 왜 지금인가                                      │
│  출처: 보건복지부·중앙치매센터 「2023년 치매역학조사」(2025.03) │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [카드 1]          [카드 2]           [카드 3]               │
│  97만 명           45.8%              2,220만 원             │
│  2025년 치매환자   가족 돌봄 부담률    1인당 연간 관리비용     │
│  2026년 100만 돌파  지역사회 거주 기준  국가 총 20.8조 원     │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  좌측 (2/3 너비)                  우측 (1/3 너비)            │
│  ┌─────────────────────────────┐  ┌────────────────────────┐ │
│  │ 치매 중증도 분포 비교         │  │ 🏆 협력기관 소식       │ │
│  │                             │  │                        │ │
│  │  전국 평균  우리 대상자       │  │ 수성구 치매안심센터    │ │
│  │  경도 67.7%  경도인지 33%   │  │ 보건복지부장관상 수상  │ │
│  │  중등도 29.5% 경증  40%     │  │ 2026.01.02             │ │
│  │  중증 2.8%   중등도 27%     │  │                        │ │
│  │                             │  │ 수성구 치매안심센터    │ │
│  │  [Recharts 묶음 막대 차트]   │  │ 단기 쉼터 프로그램    │ │
│  └─────────────────────────────┘  │ 기억튼튼! 인지튼튼!   │ │
│                                   └────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**치매 중증도 비교 차트 구현 상세:**

```typescript
// 전국 데이터 (NATIONAL_DEMENTIA_STATS에서)
const nationalData = [
  { name: '경도', 전국평균: 67.7 },
  { name: '중등도', 전국평균: 29.5 },
  { name: '중증', 전국평균: 2.8 },
];

// 우리 대상자 실시간 집계 (subjectsData에서)
// dementia_stage 값 매핑:
//   'mild_cognitive' → 경도인지장애  → '경도' 그룹
//   'mild'           → 경증          → '경도' 그룹
//   'moderate'       → 중등도
//   'severe'         → 중증

const ourData = subjects.reduce((acc, s) => {
  if (s.dementia_stage === 'mild_cognitive' || s.dementia_stage === 'mild')
    acc['경도'] = (acc['경도'] || 0) + 1;
  else if (s.dementia_stage === 'moderate')
    acc['중등도'] = (acc['중등도'] || 0) + 1;
  else if (s.dementia_stage === 'severe')
    acc['중증'] = (acc['중증'] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const total = Object.values(ourData).reduce((a, b) => a + b, 0);
const chartData = nationalData.map(d => ({
  name: d.name,
  전국평균: d.전국평균,
  우리대상자: total > 0 ? Math.round((ourData[d.name] || 0) / total * 100 * 10) / 10 : 0,
}));
```

Recharts `BarChart` (dynamic import + ssr:false):
- `BarChart` + `Bar` × 2 (전국평균: gray-400, 우리대상자: #46549C)
- `Legend` + `Tooltip`
- `XAxis dataKey="name"`, `YAxis tickFormatter={(v) => v + '%'}`
- 차트 높이 200px

**협력기관 소식 카드:**

```typescript
LOCAL_CONTEXT_NEWS.map(news => (
  <div key={news.id} className="border rounded-lg p-3 mb-3">
    <div className="flex items-center gap-2 mb-1">
      <span className={`text-xs px-2 py-0.5 rounded-full
        ${news.badgeColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}
      `}>{news.badge}</span>
      <span className="text-xs text-gray-500">{news.institution}</span>
    </div>
    <p className="text-sm font-medium text-gray-900 mb-1">{news.title}</p>
    <p className="text-xs text-gray-500 leading-relaxed">{news.description}</p>
    <p className="text-xs text-gray-400 mt-1">{news.date}</p>
  </div>
))
```

**배경 통계 카드 3개 — 금액 포맷 헬퍼 함수:**

```typescript
// src/lib/format.ts (기존 파일에 추가 또는 신규)
export function formatLargeNumber(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(0) + '억';
  if (n >= 10000) return (n / 10000).toFixed(0) + '만';
  return n.toLocaleString('ko-KR');
}
// 970000 → "97만"
// 22200000 → "2,220만"
```

카드 표시:
- 97만 명 → `formatLargeNumber(970000) + ' 명'`
- 2,220만 원 → `formatLargeNumber(22200000) + ' 원'`
- 45.8% → `45.8 + '%'`

섹션 전체 하단에 출처 표기:
```
출처: 보건복지부·중앙치매센터 「2023년 치매역학조사 및 실태조사」, 2025년 3월 발표
협력기관 소식: 대구일보 (2026.01.02), 국민일보 (2024.02.13)
```

---

## 2. `/admin/page.tsx` (관리자 메인)

열람과 동일 레이아웃 + 관리 기능:

- KpiCard: editable=true → PUT /api/kpi override_kpi → mutate
- PhaseTimeline: 클릭 → 관리자 `/admin/kpi`로 이동
- 이번 달 요약 카드 하단에 "관리" 링크 버튼

**빠른 이동 버튼 그리드 (3열)**:
```
[👥 참가자 관리]  [🔬 워크숍 관리]  [📊 KPI·체크리스트]
[💰 사업비 관리]  [📢 홍보 관리]   [📖 가이드북]
```

**CSV 내보내기 버튼 3개 (우측 상단)**:
```
[📥 KPI CSV]  [📥 사업비 CSV]  [📥 참가자 CSV]
```
각각 `/api/export?type=kpi|budget|participants` 링크.

---

## 완료 기준

- [ ] `/` 메인: PhaseTimeline + 9개 KPI + 캘린더 + 예산요약 + 최근홍보 3건
- [ ] 섹션 H — 배경 통계 카드 3개 (97만 명 / 45.8% / 2,220만 원) 정상 표시
- [ ] 섹션 H — 치매 중증도 묶음 막대 차트 (전국 vs 우리 대상자) 동작
- [ ] 섹션 H — 협력기관 소식 카드 2건 표시
- [ ] 출처 텍스트 하단 표기 확인
- [ ] 사업 개월차 자동 계산 확인
- [ ] `/admin` 빠른 이동 버튼, CSV 다운로드 3종
- [ ] `npx tsc --noEmit` 에러 0개

---

---

# TASK_09 — 인증·에러처리·반응형·빌드

> TASK_08 완료 후 진행. 마지막 태스크.

---

## 목표

관리자 비밀번호 보호, 에러/로딩 처리, 반응형 최종 점검, 빌드 성공.

---

## 1. 관리자 비밀번호 보호

**`src/middleware.ts`**:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();

    const token = request.cookies.get('admin_token');
    if (!token || token.value !== process.env.ADMIN_TOKEN) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: '/admin/:path*' };
```

**`/admin/login/page.tsx`**:

```
┌─────────────────────────────────┐
│   🔐 관리자 로그인               │
│   비밀번호: [•••••••••]         │
│   [로그인] 버튼                 │
│   (오류 시 빨간 텍스트 표시)     │
└─────────────────────────────────┘
```

로그인 처리 (`/api/auth/route.ts` 추가):
- POST body: `{ password }`
- `password === process.env.ADMIN_TOKEN` → cookie `admin_token` 설정 → 200
- 불일치 → 401

로그인 성공 → `router.push('/admin')`

**각 관리자 페이지 상단 배너에 "로그아웃" 버튼 추가**:
- 클릭 → cookie 삭제 → `/` 이동

---

## 2. 로딩 상태 (`loading.tsx`)

아래 경로에 각각 `loading.tsx` 추가:
- `src/app/loading.tsx`
- `src/app/participants/loading.tsx`
- `src/app/workshops/loading.tsx`
- `src/app/kpi/loading.tsx`
- `src/app/budget/loading.tsx`
- `src/app/promotion/loading.tsx`
- `src/app/guidebook/loading.tsx`

공통 내용 (Tailwind animate-pulse 스켈레톤):
```typescript
export default function Loading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded-lg" />
    </div>
  );
}
```

---

## 3. 에러 처리 (`error.tsx`)

아래 경로에 각각 `error.tsx` 추가 (같은 경로 목록):

```typescript
'use client';
export default function Error({
  error, reset
}: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 text-center">
      <p className="text-red-600 mb-4">데이터를 불러오는 중 오류가 발생했습니다.</p>
      <p className="text-gray-500 text-sm mb-4">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        다시 시도
      </button>
    </div>
  );
}
```

---

## 4. 반응형 최종 점검

아래 브레이크포인트에서 동작 확인 및 수정:

**데스크톱 (1280px+)**:
- 사이드바 고정 (w-64)
- KPI 카드 3열
- DataTable 전체 컬럼 표시

**태블릿 (768px~1279px)**:
- 사이드바: 숨김 + 상단 햄버거 버튼
- KPI 카드: 2열 (`md:grid-cols-2`)
- DataTable: 가로 스크롤 (`overflow-x-auto`)

**모바일 (375px~767px)**:
- KPI 카드: 1열
- DataTable: 가로 스크롤
- PhaseTimeline: 가로 스크롤 (`overflow-x-auto`)
- 아코디언: 전체 너비

---

## 5. SWR 설정

`src/app/layout.tsx`에 SWRConfig 추가:
```typescript
import { SWRConfig } from 'swr';
// ...
<SWRConfig value={{ refreshInterval: 30000 }}>
  {children}
</SWRConfig>
```

---

## 6. 빌드 & 최종 확인

```bash
npx tsc --noEmit   # 타입 에러 0개
npm run lint        # ESLint 에러 0개
npm run build       # 빌드 성공
npm run start       # 프로덕션 모드 정상 동작
```

---

## 7. 최종 테스트 체크리스트

```
□ 메인 — PhaseTimeline + 9개 KPI + 캘린더 + 예산요약 + 최근 홍보 3건
□ 메인 — 사업 개월차 자동 계산
□ 참가자 — 3탭 전환, 기관 카드 아코디언, 대상자 익명 코드
□ 워크숍 — 6단계 아코디언, 워크시트 갤러리, 워크시트 상세 모달
□ 워크숍(관리자) — WorksheetForm 작성 → 갤러리 즉시 반영
□ KPI — 단계별 체크리스트 달성률, 원형 게이지
□ 가이드북 — 체크박스 완료 처리 → 달성률 갱신 → 인쇄 동작
□ KPI(관리자) — 수동 오버라이드 저장
□ 사업비 — 카테고리별 집행현황, 합계 행, 금액 포맷
□ 사업비(관리자) — 지출 추가/삭제 → 집행률 갱신
□ 홍보 — 채널별 카드 아코디언
□ CSV 내보내기 3종 — 한글 정상 출력
□ 관리자 로그인/로그아웃
□ 로딩 스켈레톤 표시
□ 에러 상태 + 재시도 버튼
□ 모바일 반응형
□ npm run build 에러 없이 성공
```

---

## 완료 기준

- [ ] 최종 체크리스트 전 항목 통과
- [ ] `npm run build` 성공
- [ ] GitHub에 최종 커밋 push
