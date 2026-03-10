# TASK_02 — 레이아웃 · 공통 컴포넌트

> Codex에 이 파일 전체를 붙여넣어 실행해.
> TASK_01이 완료된 상태에서 진행.

---

## 목표

사이드바 레이아웃과 재사용 공통 컴포넌트 전체를 구현해.
TASK_03~09에서 이 컴포넌트들을 import해서 사용할 예정이야.

---

## 구현 요청

### 1. `src/app/layout.tsx` — 루트 레이아웃

- Google Fonts Noto Sans KR `<link>` 태그 삽입
- 좌측 고정 사이드바 (w-64) + 우측 스크롤 가능 메인 영역
- 사이드바: `src/components/layout/Sidebar.tsx` 컴포넌트 사용
- 모바일(md 미만): 사이드바 숨김 + 상단 햄버거 버튼 (useState 토글)

### 2. `src/components/layout/Sidebar.tsx`

`'use client'` 사용. `usePathname()`으로 활성 메뉴 하이라이트.

메뉴 항목 (순서 고정):
```
🏠 종합 대시보드    →  /
👥 참가자·기관·대상자 →  /participants
🔬 워크숍·워크시트  →  /workshops
📊 KPI 성과관리    →  /kpi
💰 사업비 관리     →  /budget
📢 홍보 관리       →  /promotion
📖 가이드북 체크리스트 → /guidebook
[구분선]
⚙️ 관리자          →  /admin
```

사이드바 최하단에 현재 리빙랩 단계 표시:
```
─────────────────
현재 단계: 2단계
문제정의 진행중
```
(추후 API에서 받아오도록 — 지금은 하드코딩으로 2단계 표시)

### 3. `src/app/admin/layout.tsx` — 관리자 레이아웃

- 상단 주황색 배너: "🔧 관리자 모드 — 데이터 수정이 가능합니다"
- 우측에 "← 열람 모드" 링크 버튼 (pathname에서 `/admin` 제거하여 이동)

### 4. `src/components/dashboard/KpiCard.tsx`

```typescript
interface KpiCardProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  color?: string;          // Tailwind 색상 클래스 (기본 'blue')
  editable?: boolean;
  onEdit?: (newValue: number) => void;
}
```

UI 구조:
```
┌─────────────────────────────┐
│ 📊 워크숍 진행              │
│     4회  /  12회            │
│ ████░░░░░░░░  33%           │  ← 달성률 프로그레스 바
│ ▲ 이번 달 1회 추가          │  ← trend 아이콘 + 텍스트
└─────────────────────────────┘
```

- 달성률 = current / target * 100 (소수점 1자리)
- 바 색상: <50% → red-500, 50~79% → yellow-500, ≥80% → green-500
- trend: 'up' → ArrowUp(초록), 'down' → ArrowDown(빨강), 'stable' → Minus(회색) (lucide-react)
- `editable=true`면 카드 클릭 → current 수정 input 인라인 표시 → Enter/blur로 저장 → `onEdit` 호출

### 5. `src/components/dashboard/ProgressBar.tsx`

```typescript
interface ProgressBarProps {
  label: string;
  current: number;
  target: number;
  color?: string;
  showPercent?: boolean;
}
```

- 수평 바, mount 시 0 → current 애니메이션 (`transition-all duration-700`)
- 우측에 "current / target (달성률%)" 텍스트

### 6. `src/components/dashboard/StatusBadge.tsx`

ProgressStatus, RoleType, WorkshopType, DementiaStage 등 모든 enum의 뱃지 표시.

```typescript
interface StatusBadgeProps {
  type: 'status' | 'role' | 'workshop_type' | 'dementia_stage' | 'institution_type'
      | 'budget_category' | 'promotion_channel' | 'subject_type';
  value: string;
}
```

내부에 `config` 객체로 각 값 → `{ label, bg, text }` 매핑.

### 7. `src/components/timeline/PhaseTimeline.tsx`

리빙랩 6단계 가로 진행 바.

```typescript
interface PhaseTimelineProps {
  currentPhase: LivingLabPhase;
  phaseStatuses: Partial<Record<LivingLabPhase, ProgressStatus>>;
  onPhaseClick?: (phase: LivingLabPhase) => void;
  showLabels?: boolean;
}
```

UI:
```
[✅ 1.준비] ──── [🔄 2.문제정의] ──── [○ 3.아이디어] ──── [○ 4.프로토] ──── [○ 5.테스트] ──── [○ 6.확산]
```

- 완료: 해당 phase 색상 진하게 + 체크 아이콘
- 진행중: 해당 색상 + 펄스 애니메이션 테두리
- 예정: gray-200 배경
- 단계 클릭 시 `onPhaseClick(phase)` 호출
- 단계 간 연결선: 완료 단계 연결선은 색상, 나머지는 gray

### 8. `src/components/guidebook/ChecklistPanel.tsx`

```typescript
interface ChecklistPanelProps {
  phase: LivingLabPhase;
  items: ChecklistItem[];
  completionCount: number;
  editable?: boolean;
  onCheck?: (id: number, data: { completed_by: string; evidence_note: string }) => void;
}
```

UI:
```
📋 2단계: 현장 이해·문제정의  [5/8 완료 ██████░░ 62%]
──────────────────────────────────────────────────────
✅ 현장관찰 계획 수립         2026.04.10  이OO
✅ 기관 방문 현장관찰 ★       2026.04.15  박OO
◉  HMW 질문 도출              (진행중)
□  핵심 문제 3개 이상 선정 ★  (미완료)
```

- required=true → 빨간 별(★) 표시
- `editable=true`: 미완료 항목 체크박스 클릭 → 미니 인라인 폼 (완료자 이름, 증빙메모) → 저장 → `onCheck` 호출
- 완료/미완료 프로그레스 바 상단 표시

### 9. `src/components/guidebook/WorksheetForm.tsx`

```typescript
interface WorksheetFormProps {
  templateKey: WorksheetTemplateKey;
  initialData?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void;
  readOnly?: boolean;
}
```

템플릿별 입력 UI (templateKey에 따라 조건부 렌더링):

**'hmw'**: 문제상황(textarea) + 관련대상자(text) + HMW 질문 최대 5개(동적 추가) + 핵심통찰(textarea)

**'persona'**: 코드(text) + 나이대(select) + 하루일과(textarea) + Needs 태그 + Pains 태그 + Gains(textarea)

**'empathy_map'**: 4분면 (Says/Thinks/Does/Feels) 각각 textarea + 핵심고통(text) + 핵심이득(text)

**'idea_card'**: 제목(text) + 해결문제(text) + 핵심내용(textarea) + 필요자원(text) + 실현가능성(⭐1~5 클릭) + 현장성(⭐1~5 클릭)

**'test_result'**: 일시(date) + 장소(text) + 참여자(checkbox 목록) + 진행요약(textarea) + 잘된점(textarea) + 개선점(textarea) + 피드백요약(textarea) + 다음액션(textarea)

`readOnly=true`면 모든 input을 텍스트로 표시.

### 10. `src/components/forms/DataTable.tsx`

```typescript
interface Column {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'badge' | 'date';
  editable?: boolean;
  options?: { value: string; label: string }[];
  badgeType?: string;   // StatusBadge의 type prop
  width?: string;       // Tailwind width 클래스
}

interface DataTableProps {
  data: Record<string, unknown>[];
  columns: Column[];
  editable: boolean;
  onSave?: (id: number, field: string, value: unknown) => void;
  onAdd?: () => void;
  onDelete?: (id: number) => void;
  searchable?: boolean;
  filterOptions?: { key: string; label: string; options: { value: string; label: string }[] }[];
}
```

- 상단: 검색 input + 필터 드롭다운들 + (editable=true면) "추가" 버튼
- 컬럼 헤더 클릭 → 정렬 (asc/desc 토글)
- `editable=true`: 셀 클릭 → 해당 type의 인라인 에디터 (boolean=토글, select=드롭다운, date=date input)
- Enter/blur → `onSave(id, field, value)` 호출
- `editable=true` + `onDelete`: 각 행 맨 끝에 삭제 버튼

### 11. `src/components/forms/EditModal.tsx`

```typescript
interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'boolean';
  value: unknown;
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: FieldDef[];
  onSave: (data: Record<string, unknown>) => void;
}
```

- 오버레이 + 중앙 모달 (max-w-lg)
- ESC 키로 닫기 (useEffect addEventListener)
- 저장/취소 버튼
- required 필드 미입력 시 저장 버튼 비활성화

### 12. `src/components/dashboard/MonthlyChart.tsx`

```typescript
interface MonthlyChartProps {
  title: string;
  data: { month: string; value: number; target?: number }[];
  type: 'bar' | 'line' | 'area';
  color: string;
  showTarget?: boolean;
}
```

- `dynamic import + ssr: false` 필수
- `ResponsiveContainer` + 해당 차트 타입 (BarChart/LineChart/AreaChart)
- `showTarget=true`면 ReferenceLine으로 목표값 점선 표시

### 13. `src/components/timeline/ActivityCalendar.tsx`

```typescript
interface CalendarEvent {
  date: string;       // ISO date
  title: string;
  type: WorkshopType;
  status: ProgressStatus;
}

interface ActivityCalendarProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  onDateClick?: (date: string) => void;
}
```

- 7열 달력 그리드
- 이벤트 있는 날짜: 색상 도트 표시 (status별 색상)
- 날짜 클릭 시 팝오버(절대 위치)로 당일 이벤트 목록 표시

---

## 완료 기준

- [ ] `npm run dev` → http://localhost:3000 사이드바 7개 메뉴 표시
- [ ] `/admin` 접속 → 주황 배너 표시
- [ ] 각 컴포넌트 import가 TypeScript 에러 없이 동작
- [ ] `npx tsc --noEmit` 에러 0개
- [ ] `npm run lint` 에러 0개
