# TASK_01 — 데이터 모델 · DB · 시드 데이터

> Codex에 이 파일 전체를 붙여넣어 실행해.
> 완료 기준을 모두 통과해야 TASK_02로 넘어가.

---

## 목표

`src/lib/` 안에 타입 정의, DB 연결, 스키마, 시드 데이터를 완성하고
`npm run db:seed` 실행 시 `data/livinglab.db`가 정상 생성되도록 해.

---

## 구현 요청

### 1. `src/lib/types.ts` — 전체 타입 정의

아래 타입을 모두 작성해. `any` 사용 금지.

```typescript
// 공통
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';
export type LivingLabPhase = 1 | 2 | 3 | 4 | 5 | 6;
export type Month = 1|2|3|4|5|6|7|8|9|10|11|12;

// 참가자
export type RoleType = 'activist' | 'institution_staff' | 'subject_elder'
                     | 'subject_family' | 'facilitator' | 'expert';

export interface Participant {
  id: number;
  name: string;
  role: RoleType;
  affiliation: string;
  contact: string;
  joined_date: string;       // ISO date string
  active: boolean;
  notes: string;
}

// 기관
export type InstitutionType = 'dementia_center' | 'welfare_facility'
                             | 'university' | 'public' | 'ngo' | 'other';

export interface Institution {
  id: number;
  name: string;
  type: InstitutionType;
  representative: string;
  contact_person: string;
  contact: string;
  address: string;
  mou_signed: boolean;
  mou_date: string | null;
  participating_phases: number[];   // DB에는 JSON TEXT로 저장
  notes: string;
}

// 대상자 (개인정보 최소화 — 익명 코드 사용)
export type SubjectType = 'elder' | 'family_caregiver';
export type DementiaStage = 'normal' | 'mild_cognitive' | 'mild'
                           | 'moderate' | 'severe' | 'unknown';

export interface Subject {
  id: number;
  code: string;                      // E001, F001 형식
  type: SubjectType;
  dementia_stage: DementiaStage;
  age_group: string;                 // '60대', '70대' 등
  institution_id: number;
  consent_signed: boolean;
  participation_phases: number[];    // DB에는 JSON TEXT
  dropout: boolean;
  dropout_reason: string | null;
  notes: string;
}

// 워크숍
export type WorkshopType =
  | 'orientation' | 'field_observation' | 'problem_definition'
  | 'idea_generation' | 'prototype_design' | 'field_test'
  | 'reflection' | 'sharing';

export interface Workshop {
  id: number;
  title: string;
  type: WorkshopType;
  phase: LivingLabPhase;
  scheduled_date: string;
  actual_date: string | null;
  location: string;
  facilitator_id: number | null;
  participants_count: number;
  status: ProgressStatus;
  description: string;
  outcome_summary: string;
}

// 워크시트
export type WorksheetTemplateKey =
  | 'hmw' | 'persona' | 'empathy_map' | 'journey_map'
  | 'idea_card' | 'prototype_spec' | 'test_result' | 'reflection';

export interface WorksheetEntry {
  id: number;
  workshop_id: number;
  template_key: WorksheetTemplateKey;
  filled_by: number | null;
  content_json: string;   // JSON string
  submitted_at: string | null;
  reviewed: boolean;
}

// 체크리스트
export interface ChecklistItem {
  id: number;
  phase: LivingLabPhase;
  category: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  completed_date: string | null;
  completed_by: string | null;
  evidence_note: string;
}

// KPI
export interface KpiItem {
  id: number;
  category: string;
  indicator: string;
  target: number;
  current: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  phase_related: LivingLabPhase | null;
  notes: string;
}

// 사업비
export type BudgetCategory =
  | 'personnel' | 'activity' | 'workshop' | 'printing'
  | 'travel' | 'equipment' | 'consulting' | 'misc';

export interface BudgetItem {
  id: number;
  category: BudgetCategory;
  item_name: string;
  planned_amount: number;
  actual_amount: number;
  payment_date: string | null;
  payee: string;
  receipt_attached: boolean;
  phase: LivingLabPhase | null;
  active: boolean;         // soft delete용
  notes: string;
}

// 홍보
export type PromotionChannel =
  | 'sns_instagram' | 'sns_facebook' | 'press_release'
  | 'newsletter' | 'event' | 'video' | 'other';

export interface PromotionRecord {
  id: number;
  channel: PromotionChannel;
  title: string;
  published_date: string | null;
  phase: LivingLabPhase | null;
  reach_count: number;
  url: string;
  status: ProgressStatus;
  notes: string;
}
```

---

### 2. `src/lib/db.ts` — DB 연결 싱글턴

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'livinglab.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}
```

---

### 3. `src/lib/schema.ts` — 테이블 생성

9개 테이블 CREATE TABLE IF NOT EXISTS 문 모두 작성.

규칙:
- `participating_phases`, `participation_phases`는 `TEXT DEFAULT '[]'` (JSON)
- boolean 값은 `INTEGER DEFAULT 0` (SQLite에 boolean 없음)
- 금액은 `INTEGER` (원 단위)
- `active INTEGER DEFAULT 1` — BudgetItem 소프트 삭제용

`initDb()` 함수로 모든 CREATE TABLE 실행:

```typescript
export function initDb() {
  const db = getDb();
  // 9개 테이블 CREATE TABLE IF NOT EXISTS ...
  // participants, institutions, subjects,
  // workshops, worksheet_entries, checklist_items,
  // kpi_items, budget_items, promotion_records
}
```

---

### 4. `src/lib/seed.ts` — 시드 데이터

`initDb()` 호출 후 아래 데이터를 INSERT OR IGNORE로 삽입.
(재실행해도 중복 삽입 안 되도록 id 명시)

**참가자 20명**
- 활동가(대학생) 12명: 경북대 4명, 계명대 3명, 대구가톨릭대 3명, 영남대 2명
- 기관 담당자 5명 (각 기관 1명씩)
- 퍼실리테이터 2명 (리빙랩 전문)
- 전문가 1명 (치매케어)

**기관 5개소**
```
1. 남구치매안심센터    (dementia_center,  MOU 완료, 2026-03-02)
2. 수성구치매안심센터  (dementia_center,  MOU 완료, 2026-03-05)
3. 대구사회복지관      (welfare_facility, MOU 완료, 2026-03-10)
4. 경북대학교 간호학과 (university,       MOU 완료, 2026-03-15)
5. 남구지역사회보장협의체 (ngo,           MOU 완료, 2026-03-20)
```

**대상자 20명**
- 어르신 E001~E015 (치매단계 분산: mild_cognitive 5, mild 6, moderate 4)
- 가족 돌봄자 F001~F005

**워크숍 12회** (phase별)
```
id:1  오리엔테이션              phase:1  2026-03-25  completed
id:2  현장이해 기관방문          phase:2  2026-04-08  completed
id:3  심층인터뷰 실습            phase:2  2026-04-22  completed
id:4  문제정의 워크숍            phase:2  2026-05-14  completed
id:5  공감지도 작성              phase:2  2026-05-28  in_progress
id:6  고객여정지도               phase:2  2026-06-11  not_started
id:7  아이디어 발산 워크숍       phase:3  2026-06-25  not_started
id:8  아이디어 수렴·투표         phase:3  2026-07-09  not_started
id:9  프로토타입 설계            phase:4  2026-08-06  not_started
id:10 현장 파일럿 테스트 A       phase:5  2026-09-10  not_started
id:11 현장 파일럿 테스트 B       phase:5  2026-10-08  not_started
id:12 성과공유 및 사례집         phase:6  2026-11-12  not_started
```

**워크시트 샘플 3건** (완료 워크숍에 대해)
- workshop_id:4, template_key:'hmw', 내용은 JSON 예시
- workshop_id:4, template_key:'persona' × 2건

**체크리스트** (6단계 × 6~8개 = 42개 항목)

1단계 (6개):
```
리빙랩 목적·범위 설정          required:true
참여기관 MOU 체결              required:true  completed:true
활동가 모집 및 OT              required:true  completed:true
기관 담당자 역할 분장           required:false completed:true
윤리심의/동의서 준비            required:true  completed:true
운영 일정표 확정               required:false completed:true
```

2단계 (8개):
```
현장관찰 계획 수립             required:false completed:true
기관 방문 현장관찰 (3회 이상)  required:true  completed:true
이해관계자 심층인터뷰           required:true  completed:true
관찰·인터뷰 기록지 작성        required:true  completed:true
문제정의 워크숍 진행            required:true  completed:true
HMW 질문 도출                 required:false completed:false
핵심 문제 3개 이상 선정        required:true  completed:false
페르소나 2개 이상 작성         required:false completed:false
```

3~6단계: 모두 completed:false (아직 진행 전)

**KPI 9개**
```
참가자 / 활동가 모집     / target:20 / current:12 / unit:명
참가자 / 기관 참여       / target:5  / current:5  / unit:개소
참가자 / 대상자          / target:30 / current:20 / unit:명
워크숍 / 워크숍 진행     / target:12 / current:4  / unit:회
워크숍 / 워크시트 완성률 / target:80 / current:25 / unit:%
성과   / 프로토타입 개발  / target:3  / current:0  / unit:건
성과   / 현장 테스트     / target:3  / current:0  / unit:건
홍보   / SNS/보도자료    / target:10 / current:2  / unit:건
예산   / 사업비 집행률   / target:90 / current:18 / unit:%
```

**사업비 12개** (planned_amount는 원 단위, actual_amount는 실제 지출된 것만)
```
인건비 / 퍼실리테이터 활동비    / planned:1200000 / actual:800000
인건비 / 전문가 자문비 1차      / planned:500000  / actual:500000
인건비 / 전문가 자문비 2차      / planned:500000  / actual:0
활동비 / 활동가 교통비 (1~2월)  / planned:360000  / actual:240000
활동비 / 대상자 참여 사례비     / planned:600000  / actual:400000
워크숍 / 장소 대관비            / planned:400000  / actual:300000
워크숍 / 재료비                / planned:200000  / actual:120000
워크숍 / 다과비                / planned:150000  / actual:80000
여비   / 현장방문 교통비        / planned:200000  / actual:150000
인쇄비 / 가이드북 인쇄         / planned:300000  / actual:0
인쇄비 / 홍보물 제작           / planned:200000  / actual:0
기타   / 소모품비              / planned:100000  / actual:45000
```

**홍보 5건**
```
Instagram / "리빙랩 킥오프 현장"           / 2026-03-28 / reach:520
Instagram / "치매안심센터 현장방문 스케치"  / 2026-04-10 / reach:380
press_release / "소이랩-치매안심센터 협력" / 2026-03-20 / reach:1200
newsletter / "리빙랩 1개월 활동 소식"      / 2026-04-30 / reach:230
video / "리빙랩 소개 영상"                / 2026-03-15 / reach:890
```

---

## 완료 기준

- [ ] `npm run db:seed` 실행 시 `data/livinglab.db` 생성 + 에러 없음
- [ ] `npx tsc --noEmit` 타입 에러 0개
- [ ] `src/lib/types.ts` 모든 타입 export 확인
- [ ] `npm run lint` 에러 0개
