# TASK_03 — 참가자·기관·대상자 페이지 + API

> TASK_02 완료 후 진행. Codex에 이 파일 전체를 붙여넣어 실행해.

---

## 목표

`/participants` (열람) + `/admin/participants` (관리자) + `/api/participants` 구현.

---

## 1. `/api/participants/route.ts`

### GET

DB에서 아래 3개 쿼리 실행 후 반환:
```typescript
{
  activists: Participant[],          // role IN ('activist', 'facilitator', 'expert')
  institution_staffs: Participant[], // role = 'institution_staff'
  institutions: Institution[],
  subjects: Subject[]
}
```

- `Institution.participating_phases`: DB TEXT → `JSON.parse()` 후 `number[]`로
- `Subject.participation_phases`: 동일

### PUT

body: `{ action, id, field, value }`

action별 처리:
- `update_participant`: `UPDATE participants SET {field}=? WHERE id=?`
- `toggle_active`: `UPDATE participants SET active=? WHERE id=?`
- `update_institution`: MOU 날짜, 참여단계 등 업데이트
  - `participating_phases`는 `JSON.stringify(value)` 후 저장
- `update_subject`: 동의서, 탈락 등 업데이트
  - `participation_phases`는 `JSON.stringify(value)` 후 저장

### POST

body: `{ type: 'participant'|'institution'|'subject', data: {...} }`
- `participant`: INSERT INTO participants (자동 id)
- `subject.code` 자동 생성: 기존 최대 코드 조회 후 +1

---

## 2. `/participants/page.tsx` (열람)

`'use client'`
`const { data } = useSWR('/api/participants')`

**레이아웃 구조:**

섹션 A — KPI 카드 3열 (KpiCard, editable=false):
- 활동가: activists.length / 20명
- 기관: institutions.filter(mou_signed).length / 5개소
- 대상자: subjects.filter(!dropout).length / 30명

섹션 B — 탭 3개 (useState로 전환):
```
[활동가] [참여기관] [대상자]
```

**탭1 — 활동가·퍼실리테이터·전문가**

상단: 소속별 필터 버튼 (전체 / 경북대 / 계명대 / 대구가톨릭대 / 영남대 / 기타)

DataTable:
- 컬럼: 이름 | 역할(badge) | 소속 | 연락처 | 참여일 | 활동상태(badge)
- editable=false
- searchable=true

하단: Recharts 도넛 차트 — 소속 대학별 분포 (dynamic import + ssr:false)

**탭2 — 참여기관**

카드 그리드 2열:
```
┌────────────────────────────────┐
│ 🏥 남구치매안심센터             │
│ 유형: 치매안심센터  MOU: ✅     │
│ 담당자: 박OO  |  010-XXXX     │
│ 참여단계: [1] [2] [3]          │
│ 소속 대상자: 7명  [▼ 목록 보기] │
└────────────────────────────────┘
```
카드 클릭 → 해당 기관 소속 subjects DataTable 아코디언 표시

**탭3 — 대상자**

상단 개인정보 보호 알림 배너 (파란색):
"대상자 정보는 익명 코드로 관리됩니다. 실명은 별도 오프라인 문서로 보관하세요."

필터: 유형별(어르신/가족) + 치매단계별 + 기관별

DataTable:
- 컬럼: 코드 | 유형(badge) | 치매단계(badge) | 연령대 | 소속기관 | 동의서(✅/❌) | 참여단계 | 탈락
- editable=false

섹션 C — 단계별 참여 현황 묶음 막대 차트:
- x축: 1단계~6단계
- series: 활동가 / 기관 / 대상자 (각 단계별 참여 수)
- (지금은 더미 데이터로 표시)

---

## 3. `/admin/participants/page.tsx` (관리자)

열람과 동일 레이아웃. 변경점:
- KpiCard: editable=true → PUT `/api/kpi` 호출
- DataTable(활동가): editable=true, onSave → PUT `/api/participants`, onAdd → EditModal 열기, onDelete → PUT toggle_active
- 기관 카드: MOU 날짜 인라인 수정, 참여단계 토글 버튼
- DataTable(대상자): editable=true, onSave → PUT `/api/participants`, onAdd → 코드 자동 생성 후 EditModal

우측 상단: "← 열람 모드" 버튼

---

## 완료 기준

- [ ] `/participants` 3탭 전환, 기관 카드 아코디언 동작
- [ ] `/admin/participants` 참가자 추가/수정/삭제 동작
- [ ] API GET 정상 JSON 반환
- [ ] 대상자 익명 코드 자동 생성 확인
- [ ] `npx tsc --noEmit` 에러 0개

---

---

# TASK_04 — 워크숍·워크시트 페이지 + API

> TASK_03 완료 후 진행.

---

## 목표

`/workshops` + `/admin/workshops` + `/api/workshops` 구현.
워크시트 작성/조회가 핵심.

---

## 1. `/api/workshops/route.ts`

### GET

```typescript
{
  workshops: Workshop[],
  worksheets: WorksheetEntry[]
}
```

### PUT

- `update_workshop`: status, actual_date, participants_count, outcome_summary 수정
- `update_worksheet`: content_json, reviewed 수정
- `toggle_reviewed`: reviewed 토글

### POST

- `add_worksheet`: INSERT INTO worksheet_entries
  - `submitted_at`: new Date().toISOString()
- `add_workshop`: INSERT INTO workshops

---

## 2. `/workshops/page.tsx` (열람)

섹션 A — KPI 카드 3열:
- 전체 워크숍: data.workshops.length / 12회
- 완료: completed 수
- 워크시트 완성률: (submitted worksheets / expected) * 100 %

섹션 B — PhaseTimeline (onPhaseClick → 해당 아코디언 열기)

아코디언 6개 (phase 1~6):
각 패널 내부에 해당 phase의 workshop 카드 목록:
```
┌────────────────────────────────────────────┐
│  [4] 문제정의 워크숍   2026.05.14  ✅ 완료  │
│  참여: 18명  |  퍼실: 김OO                  │
│  결과: "경증 치매 어르신의 외출 불안..."     │
│  워크시트: HMW (3건 제출) ✅                │
└────────────────────────────────────────────┘
```
workshop 카드 클릭 → 하단에 해당 workshop의 worksheet 목록 표시 (아코디언)

섹션 C — 탭 2개:

**탭1 — 워크숍 일정 전체** (DataTable):
- 컬럼: 회차 | 제목 | 유형(badge) | 단계 | 예정일 | 실시일 | 장소 | 참여자수 | 상태(badge)
- 행 클릭 → 하단 상세 (설명 + 결과요약 + 워크시트 목록)

**탭2 — 워크시트 갤러리**:
- 필터: 템플릿별 (HMW/페르소나/공감지도/아이디어카드/테스트결과)
- 카드 3열 그리드
- 각 카드: 템플릿키(badge) + 워크숍명 + 제출일 + [내용 보기] 버튼
- 버튼 클릭 → WorksheetForm (readOnly=true) 모달 표시

섹션 D — 월별 워크숍 + 워크시트 차트 (MonthlyChart, bar + line 복합)

---

## 3. `/admin/workshops/page.tsx` (관리자)

열람과 동일 + 변경점:
- 워크숍 카드에 상태 변경 드롭다운, 실시일 date input, 결과요약 textarea
- "워크시트 추가" 버튼 → EditModal (templateKey 선택) → WorksheetForm 모달 → POST
- 워크시트 카드에 "수정" + "검토완료" 버튼
- "워크숍 추가" 버튼 (우측 상단) → EditModal

---

## 완료 기준

- [ ] `/workshops` 6단계 아코디언, 탭 전환, 워크시트 갤러리
- [ ] WorksheetForm readOnly 모달 동작
- [ ] `/admin/workshops` 워크시트 작성 → 갤러리 즉시 반영
- [ ] `npx tsc --noEmit` 에러 0개

---

---

# TASK_05 — KPI 성과관리 + 가이드북 체크리스트 페이지 + API

> TASK_04 완료 후 진행.

---

## 목표

`/kpi` + `/admin/kpi` + `/guidebook` + `/api/kpi` + `/api/guidebook` 구현.
체크리스트 완료 처리가 달성률에 자동 반영되는 것이 핵심.

---

## 1. `/api/kpi/route.ts`

### GET

DB 실시간 집계 후 KpiItem[] 반환:

```typescript
// 활동가 수: 실시간 집계
const activist_count = db.prepare(`
  SELECT COUNT(*) as cnt FROM participants
  WHERE role='activist' AND active=1
`).get().cnt;

// 워크숍 완료 수
const workshop_done = db.prepare(`
  SELECT COUNT(*) as cnt FROM workshops WHERE status='completed'
`).get().cnt;

// 워크시트 완성률 (제출 수 / 워크숍수 * 예상 참여자 * 100)
// 단순화: 완료 워크숍당 평균 참여자수 기반
// ... 나머지 지표도 실시간 집계

// 체크리스트 단계별 완성도
const checklist_by_phase = db.prepare(`
  SELECT phase, COUNT(*) as total, SUM(completed) as done
  FROM checklist_items GROUP BY phase
`).all();

return { kpis: KpiItem[], checklist_summary: {...}, checklist_by_phase: [...] }
```

수동 오버라이드는 `kpi_items.current`를 직접 업데이트:

### PUT

- `override_kpi`: `UPDATE kpi_items SET current=?, trend=? WHERE id=?`

---

## 2. `/api/guidebook/route.ts`

### GET

```typescript
{
  checklist: ChecklistItem[],
  completion_by_phase: {
    [phase: number]: { total: number; done: number; required_done: number; required_total: number }
  }
}
```

### PUT

body: `{ id, completed_by, evidence_note }`
```sql
UPDATE checklist_items
SET completed=1, completed_date=date('now'), completed_by=?, evidence_note=?
WHERE id=?
```

---

## 3. `/kpi/page.tsx` (열람)

섹션 A — 종합 달성률 헤더:
- 전체 KPI 평균 달성률 → 대형 원형 게이지 (Recharts RadialBarChart, dynamic import)
- "현재 단계: 2단계 문제정의 진행중"

섹션 B — KpiCard 3열×3행 (9개, editable=false):
카테고리별 색상 구분 (참가자/워크숍/성과/홍보/예산)

섹션 C — PhaseTimeline + 단계별 체크리스트 달성률:
```
1단계 준비     ████████████ 100%
2단계 문제정의 ██████░░░░░░  62%  ← required 기준
3단계 아이디어 ░░░░░░░░░░░░   0%
```

섹션 D — 월별 추이 탭 5개 (활동가/워크숍/워크시트/예산집행률/홍보):
각 탭: MonthlyChart (line + 목표 점선)

섹션 E — 카테고리별 달성률 가로 BarChart (Recharts, 5개 카테고리)

---

## 4. `/admin/kpi/page.tsx` (관리자)

열람 + 변경점:
- KpiCard: editable=true → PUT /api/kpi override_kpi
- PhaseTimeline: 단계 상태 변경 클릭 기능
- ChecklistPanel: editable=true → PUT /api/guidebook → SWR mutate

---

## 5. `/guidebook/page.tsx` (공용 — 관리자 인증 불필요)

섹션 A — PhaseTimeline (전체 너비, 클릭 시 해당 아코디언 열기)

섹션 B — 6단계 아코디언 (기본: 현재 진행 단계 열림):
각 패널: ChecklistPanel (editable=true, onCheck → PUT /api/guidebook → mutate)

섹션 C — 관련 워크숍 바로가기:
각 아코디언 패널 하단에 "📌 관련 워크숍: [링크]"

우측 상단: "🖨️ 인쇄하기" 버튼 (`window.print()`)

print CSS (`@media print`): 사이드바 숨김, 아코디언 모두 펼침, 배경 흰색

---

## 완료 기준

- [ ] `/kpi` 9개 KPI 카드, 단계별 달성률, 원형 게이지
- [ ] `/guidebook` 체크박스 클릭 → 저장 → 달성률 즉시 갱신
- [ ] `/admin/kpi` 수동 오버라이드, ChecklistPanel 완료 처리
- [ ] `npx tsc --noEmit` 에러 0개

---

---

# TASK_06 — 사업비 관리 페이지 + API

> TASK_05 완료 후 진행.

---

## 목표

`/budget` + `/admin/budget` + `/api/budget` 구현.

---

## 1. `/api/budget/route.ts`

### GET

```typescript
{
  items: BudgetItem[],           // active=1인 항목만
  summary: {
    total_planned: number,
    total_actual: number,
    by_category: Record<BudgetCategory, { planned: number; actual: number }>
  }
}
```

### PUT

- `update_item`: actual_amount, payment_date, receipt_attached 수정

### POST

- `add_item`: INSERT (active=1, actual_amount=0 기본)

### DELETE (soft)

- body: `{ id }` → `UPDATE budget_items SET active=0 WHERE id=?`

---

## 2. `/budget/page.tsx` (열람)

섹션 A — KPI 카드 4열 (ProgressBar 스타일):
- 총 계획 예산: summary.total_planned (원, 천원 단위 포맷)
- 총 집행액: summary.total_actual
- 집행률: (total_actual / total_planned * 100)% / 90%
- 잔여 예산: total_planned - total_actual

섹션 B — 카테고리별 집행 현황:
각 카테고리 행에 ProgressBar (계획 대비 집행률) + 금액 텍스트
카테고리 클릭 → 해당 카테고리 항목 DataTable 아코디언 펼침

한국어 카테고리명 매핑:
```
personnel → 인건비
activity  → 활동비
workshop  → 워크숍 운영비
printing  → 인쇄/홍보물
travel    → 여비
equipment → 재료/장비
consulting → 전문가 자문
misc      → 기타
```

섹션 C — 전체 지출 DataTable:
- 컬럼: 항목명 | 분류(badge) | 계획금액 | 실지출 | 지급일 | 지급처 | 영수증(✅/❌) | 관련단계
- 필터: 분류별 / 단계별 / 영수증 미첨부만
- 하단 합계 행: 계획합계 / 실지출합계
- 금액 컬럼: 숫자를 "1,200,000원" 포맷으로 표시

섹션 D — 월별 지출 추이 (MonthlyChart, bar + cumulative line)

---

## 3. `/admin/budget/page.tsx` (관리자)

열람 + 변경점:
- DataTable editable=true:
  - actual_amount, payment_date 수정 가능
  - receipt_attached boolean 토글
- "지출 추가" 버튼 → EditModal (항목명, 분류, 계획금액, 지급처, 관련단계)
- 항목 삭제 (soft delete)
- 우측 상단 "📥 사업비 CSV" 버튼: `<a href="/api/export?type=budget">📥 사업비 내역</a>`

---

## 완료 기준

- [ ] `/budget` 카테고리별 아코디언, 전체 내역, 합계 표시
- [ ] `/admin/budget` 지출 추가 → 합계 자동 갱신
- [ ] 금액 포맷 "1,200,000원" 정상 표시
- [ ] `npx tsc --noEmit` 에러 0개

---

---

# TASK_07 — 홍보 관리 페이지 + API + CSV 내보내기

> TASK_06 완료 후 진행.

---

## 목표

`/promotion` + `/admin/promotion` + `/api/promotion` + `/api/export` 구현.

---

## 1. `/api/promotion/route.ts`

### GET

```typescript
{ records: PromotionRecord[] }
```

### PUT, POST, DELETE

표준 CRUD (PUT=수정, POST=추가, DELETE=삭제)

---

## 2. `/promotion/page.tsx` (열람)

섹션 A — KPI 카드 3열:
- 홍보 게시물: completed 수 / 10건
- 총 도달 수: reach_count 합계 (명)
- 영상 콘텐츠: channel='video' 수

섹션 B — 채널별 현황 카드 그리드 2열:
각 카드:
```
📸 Instagram
게시물: 2건  |  총 도달: 900명
최근: 2026.04.10
[▼ 목록 보기]
```
카드 클릭 → 해당 채널 게시물 목록 펼침 (아코디언)

채널 한국어 매핑:
```
sns_instagram → 인스타그램
sns_facebook  → 페이스북
press_release → 보도자료
newsletter    → 뉴스레터
event         → 행사/이벤트
video         → 영상
other         → 기타
```

섹션 C — 전체 홍보 기록 DataTable:
- 컬럼: 제목 | 채널(badge) | 관련단계 | 게시일 | 도달수 | URL | 상태(badge)

섹션 D — 월별 홍보 건수 차트 (MonthlyChart, bar + 목표 10건 점선)

---

## 3. `/admin/promotion/page.tsx` (관리자)

열람 + 변경점:
- "홍보 추가" 버튼 → EditModal (채널, 제목, 게시일, 도달수, URL, 관련단계)
- DataTable editable=true (reach_count, status, published_date 수정)
- 삭제 버튼

---

## 4. `/api/export/route.ts`

GET params `?type=kpi|budget|participants`

각 type별 CSV 생성:

**kpi**:
```csv
카테고리,지표,목표,현재,달성률(%),단위
참가자,활동가 모집,20,12,60.0,명
...
```

**budget**:
```csv
항목명,분류,계획금액(원),실지출(원),지급일,지급처,영수증,관련단계
...
```

**participants** (대상자 제외 — 개인정보):
```csv
이름,역할,소속,참여일,활동상태
...
```

Response headers:
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="livinglab_export_YYYYMMDD.csv"
```

UTF-8 BOM(`\uFEFF`) 앞에 붙여 Excel 한글 깨짐 방지.

---

## 완료 기준

- [ ] `/promotion` 채널별 아코디언, 기록 목록
- [ ] CSV 3종 다운로드 (한글 깨짐 없음)
- [ ] `npx tsc --noEmit` 에러 0개
