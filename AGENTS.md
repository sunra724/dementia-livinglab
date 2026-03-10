# 치매돌봄 리빙랩 대시보드 — Codex Agent Context

> 이 파일은 Codex가 작업 시작 전 자동으로 읽는 프로젝트 컨텍스트입니다.
> 모든 태스크에서 아래 규칙을 반드시 준수해줘.

---

## 프로젝트 개요

- **앱명**: 치매돌봄 리빙랩 통합 성과관리 대시보드
- **목적**: 리빙랩 6단계(준비→문제정의→아이디어→프로토타입→테스트→확산) 전 과정 관리
- **관리 주체**: 협동조합 소이랩 (soilabcoop.kr)

---

## 기술 스택 (고정 — 변경 금지)

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript (strict mode) |
| 스타일 | Tailwind CSS |
| DB | SQLite via better-sqlite3 |
| 차트 | Recharts (dynamic import + ssr:false 필수) |
| 데이터 fetch | SWR |
| 아이콘 | lucide-react |
| 날짜 | date-fns |

---

## 디렉토리 구조 (고정)

```
src/
├── app/
│   ├── layout.tsx              # 공용 레이아웃 (사이드바)
│   ├── page.tsx                # 메인 대시보드 (열람)
│   ├── participants/page.tsx   # 참가자·기관·대상자
│   ├── workshops/page.tsx      # 워크숍·워크시트
│   ├── kpi/page.tsx            # KPI 성과관리
│   ├── budget/page.tsx         # 사업비 관리
│   ├── promotion/page.tsx      # 홍보 관리
│   ├── guidebook/page.tsx      # 가이드북 체크리스트
│   ├── admin/
│   │   ├── layout.tsx          # 주황 배너 레이아웃
│   │   ├── page.tsx
│   │   ├── participants/page.tsx
│   │   ├── workshops/page.tsx
│   │   ├── kpi/page.tsx
│   │   ├── budget/page.tsx
│   │   └── promotion/page.tsx
│   └── api/
│       ├── participants/route.ts
│       ├── workshops/route.ts
│       ├── kpi/route.ts
│       ├── budget/route.ts
│       ├── promotion/route.ts
│       ├── guidebook/route.ts
│       └── export/route.ts
├── components/
│   ├── layout/Sidebar.tsx
│   ├── dashboard/KpiCard.tsx
│   ├── dashboard/ProgressBar.tsx
│   ├── dashboard/StatusBadge.tsx
│   ├── dashboard/MonthlyChart.tsx
│   ├── timeline/PhaseTimeline.tsx
│   ├── timeline/ActivityCalendar.tsx
│   ├── guidebook/ChecklistPanel.tsx
│   ├── guidebook/WorksheetForm.tsx
│   ├── forms/DataTable.tsx
│   └── forms/EditModal.tsx
└── lib/
    ├── db.ts
    ├── schema.ts
    ├── seed.ts
    └── types.ts
```

---

## 코딩 규칙 (반드시 준수)

### 필수 규칙
1. **모든 컴포넌트는 TypeScript + 명시적 Props 타입**으로 작성
2. **Recharts 컴포넌트**는 반드시 `dynamic(() => import(...), { ssr: false })` 사용
3. **DB 접근**은 반드시 `src/lib/db.ts`의 `getDb()` 함수를 통해서만
4. **API route**는 GET + PUT (+ 필요시 POST, DELETE) 모두 구현
5. **'use client'** 지시어 — 클라이언트 컴포넌트에만 명시, Server Component 기본
6. **SWR**으로 클라이언트 데이터 fetch, 수정 후 `mutate()` 호출

### 금지 사항
- `any` 타입 사용 금지 (불가피시 `unknown` + 타입 가드)
- `useEffect`로 fetch 금지 → SWR 사용
- 인라인 스타일 금지 → Tailwind 클래스만
- `console.log` 남기지 말 것 (에러 로그는 `console.error` 허용)

### UI 패턴
- 열람 페이지: `editable={false}` — 데이터 수정 UI 완전 숨김
- 관리자 페이지: `editable={true}` — 수정 UI 표시
- 관리자↔열람 전환: 각 페이지 우측 상단 버튼
- 로딩: Tailwind animate-pulse 스켈레톤
- 에러: 재시도 버튼 포함

---

## 색상 시스템

```
리빙랩 단계 색상:
  1단계 준비:      #6366f1 (인디고)
  2단계 문제정의:  #3b82f6 (블루)
  3단계 아이디어:  #f59e0b (앰버)
  4단계 프로토:    #10b981 (에메랄드)
  5단계 테스트:    #ef4444 (레드)
  6단계 확산:      #8b5cf6 (바이올렛)

참가자 역할 색상:
  활동가:  #0ea5e9 (스카이)
  기관:    #f97316 (오렌지)
  대상자:  #a855f7 (퍼플)
```

---

## DB 테이블 목록

| 테이블명 | 설명 |
|----------|------|
| participants | 참가자 (활동가·기관담당자·퍼실리테이터·전문가) |
| institutions | 참여 기관 |
| subjects | 대상자 (익명 코드 E001~/F001~) |
| workshops | 워크숍 일정·결과 |
| worksheet_entries | 워크시트 제출 기록 |
| checklist_items | 가이드북 단계별 체크리스트 |
| kpi_items | KPI 항목·현황 |
| budget_items | 사업비 내역 |
| promotion_records | 홍보 기록 |

---

## 환경 변수 (`.env.local`)

```
ADMIN_TOKEN=livinglab2026
```

---

## 검증 명령어

각 태스크 완료 후 반드시 실행:
```bash
npx tsc --noEmit      # 타입 에러 0개 확인
npm run lint          # ESLint 에러 0개 확인
npm run dev           # 로컬 실행 확인
```
