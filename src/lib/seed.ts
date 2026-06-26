import { closeSql, dbExecute, dbQueryOne, type DbValue } from './db';
import { initDb } from './schema';

let seedPromise: Promise<void> | null = null;

type CountRow = {
  count: string | number;
};

async function hasRows(tableName: string) {
  const result = await dbQueryOne<CountRow>(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return Number(result?.count ?? 0) > 0;
}

function isPostgresErrorCode(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}

async function hasRowsIfTableExists(tableName: string) {
  try {
    return await hasRows(tableName);
  } catch (error) {
    if (isPostgresErrorCode(error, '42P01')) {
      return null;
    }

    throw error;
  }
}

async function insertRows(
  tableName: string,
  columns: string[],
  rows: DbValue[][],
  conflictTarget: string
) {
  if (!rows.length) {
    return;
  }

  const placeholders = columns.map(() => '?').join(', ');
  const columnList = columns.join(', ');

  for (const row of rows) {
    await dbExecute(
      `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders}) ON CONFLICT (${conflictTarget}) DO NOTHING`,
      row
    );
  }
}

async function resetSequence(tableName: string) {
  await dbExecute(`
    SELECT setval(
      pg_get_serial_sequence('${tableName}', 'id'),
      GREATEST(COALESCE((SELECT MAX(id) FROM ${tableName}), 1), 1),
      (SELECT MAX(id) FROM ${tableName}) IS NOT NULL
    )
  `);
}

async function seedParticipants() {
  await insertRows(
    'participants',
    ['id', 'name', 'role', 'affiliation', 'contact', 'joined_date', 'active', 'notes'],
    [
      [1, '김민수', 'activist', '경북대학교', '010-1000-0001', '2026-03-01', 1, ''],
      [2, '이서연', 'activist', '경북대학교', '010-1000-0002', '2026-03-01', 1, ''],
      [3, '박지훈', 'activist', '경북대학교', '010-1000-0003', '2026-03-01', 1, ''],
      [4, '최예린', 'activist', '경북대학교', '010-1000-0004', '2026-03-01', 1, ''],
      [5, '정우진', 'activist', '계명대학교', '010-1000-0005', '2026-03-05', 1, ''],
      [6, '강하늘', 'activist', '계명대학교', '010-1000-0006', '2026-03-05', 1, ''],
      [7, '서다미', 'activist', '계명대학교', '010-1000-0007', '2026-03-05', 1, ''],
      [8, '윤수빈', 'activist', '대구가톨릭대학교', '010-1000-0008', '2026-03-10', 1, ''],
      [9, '오예준', 'activist', '대구가톨릭대학교', '010-1000-0009', '2026-03-10', 1, ''],
      [10, '조세아', 'activist', '대구가톨릭대학교', '010-1000-0010', '2026-03-10', 1, ''],
      [11, '한태윤', 'activist', '영남대학교', '010-1000-0011', '2026-03-15', 1, ''],
      [12, '문예지', 'activist', '영남대학교', '010-1000-0012', '2026-03-15', 1, ''],
      [13, '대구센터 담당자', 'institution_staff', '대구치매안심센터', '010-2100-0001', '2026-03-02', 1, ''],
      [14, '수성센터 담당자', 'institution_staff', '수성구치매안심센터', '010-2100-0002', '2026-03-05', 1, ''],
      [15, '복지관 담당자', 'institution_staff', '대구사회복지관', '010-2100-0003', '2026-03-10', 1, ''],
      [16, '간호학과 담당자', 'institution_staff', '경북대학교 간호학과', '010-2100-0004', '2026-03-15', 1, ''],
      [17, '지원단체 담당자', 'institution_staff', '대구지역사회돌봄협의체', '010-2100-0005', '2026-03-20', 1, ''],
      [18, '퍼실리테이터 A', 'facilitator', '소이랩', '010-3100-0001', '2026-03-01', 1, ''],
      [19, '퍼실리테이터 B', 'facilitator', '소이랩', '010-3100-0002', '2026-03-01', 1, ''],
      [20, '치매 케어 전문가', 'expert', '치매케어연구소', '010-4100-0001', '2026-03-01', 1, ''],
    ],
    'id'
  );
}

async function seedInstitutions() {
  await insertRows(
    'institutions',
    [
      'id',
      'name',
      'type',
      'representative',
      'contact_person',
      'contact',
      'address',
      'mou_signed',
      'mou_date',
      'participating_phases',
      'notes',
    ],
    [
      [1, '대구치매안심센터', 'dementia_center', '센터장', '박OO', '053-100-0001', '대구광역시 중구 중앙대로 123', 1, '2026-03-02', '[1,2,3,4,5,6]', ''],
      [2, '수성구치매안심센터', 'dementia_center', '센터장', '김OO', '053-100-0002', '대구광역시 수성구 범어로 234', 1, '2026-03-05', '[1,2,3,4,5,6]', ''],
      [3, '대구사회복지관', 'welfare_facility', '복지관장', '최OO', '053-100-0003', '대구광역시 중구 복지로 345', 1, '2026-03-10', '[1,2,3,4,5,6]', ''],
      [4, '경북대학교 간호학과', 'university', '학과장', '정OO', '053-100-0004', '대구광역시 북구 대학로 80', 1, '2026-03-15', '[1,2,3,4,5,6]', ''],
      [5, '대구지역사회돌봄협의체', 'ngo', '협의체장', '윤OO', '053-100-0005', '대구광역시 동구 이천로 90', 1, '2026-03-20', '[1,2,3,4,5,6]', ''],
    ],
    'id'
  );
}

async function seedSubjects() {
  const elderSubjects: DbValue[][] = Array.from({ length: 15 }, (_, index) => [
    index + 1,
    `E${String(index + 1).padStart(3, '0')}`,
    'elder',
    index < 5 ? 'mild_cognitive' : index < 11 ? 'mild' : 'moderate',
    index % 2 === 0 ? '70대' : '80대',
    (index % 5) + 1,
    1,
    index < 10 ? '[1,2,3]' : '[1,2]',
    index === 13 ? 1 : 0,
    index === 13 ? '건강 악화로 중도 중단' : null,
    '',
  ]);

  const familySubjects: DbValue[][] = Array.from({ length: 5 }, (_, index) => [
    index + 16,
    `F${String(index + 1).padStart(3, '0')}`,
    'family_caregiver',
    'unknown',
    index % 2 === 0 ? '50대' : '60대',
    (index % 5) + 1,
    1,
    index < 3 ? '[1,2,3]' : '[1,2]',
    0,
    null,
    '',
  ]);

  await insertRows(
    'subjects',
    [
      'id',
      'code',
      'type',
      'dementia_stage',
      'age_group',
      'institution_id',
      'consent_signed',
      'participation_phases',
      'dropout',
      'dropout_reason',
      'notes',
    ],
    [...elderSubjects, ...familySubjects],
    'id'
  );
}

async function seedWorkshops() {
  await insertRows(
    'workshops',
    [
      'id',
      'title',
      'type',
      'phase',
      'scheduled_date',
      'actual_date',
      'location',
      'facilitator_id',
      'participants_count',
      'status',
      'description',
      'outcome_summary',
    ],
    [
      [1, '오리엔테이션', 'orientation', 1, '2026-03-25', '2026-03-25', '대구사회복지관', 18, 25, 'completed', '리빙랩 소개와 역할 안내', '참여자 역할과 일정 공유 완료'],
      [2, '현장 이해 기관 방문', 'field_observation', 2, '2026-04-08', '2026-04-08', '대구치매안심센터', 18, 20, 'completed', '현장 관찰과 기관 인터뷰', '현장 운영 구조와 주요 이슈 파악'],
      [3, '인터뷰 기초 실습', 'problem_definition', 2, '2026-04-22', '2026-04-22', '경북대학교', 19, 15, 'completed', '대상자 인터뷰 연습', '인터뷰 질문지 초안 도출'],
      [4, '문제정의 워크숍', 'problem_definition', 2, '2026-05-14', '2026-05-14', '대구사회복지관', 18, 25, 'completed', '통합 문제 정의와 HMW 도출', '주요 문제 3개 합의'],
      [5, '공감지도 작성', 'problem_definition', 2, '2026-05-28', null, '수성구치매안심센터', 19, 20, 'in_progress', '공감지도 기반 사용자 이해', ''],
      [6, '고객여정지도 작성', 'problem_definition', 2, '2026-06-11', null, '경북대학교', 18, 15, 'not_started', '서비스 경험 여정 설계', ''],
      [7, '아이디어 발산 워크숍', 'idea_generation', 3, '2026-06-25', null, '대구사회복지관', 19, 25, 'not_started', '브레인스토밍과 아이디어 카드 작성', ''],
      [8, '아이디어 선호도 투표', 'idea_generation', 3, '2026-07-09', null, '대구치매안심센터', 18, 20, 'not_started', '우선순위 선정', ''],
      [9, '프로토타입 설계', 'prototype_design', 4, '2026-08-06', null, '경북대학교', 19, 15, 'not_started', '프로토타입 명세 작성', ''],
      [10, '현장 파일럿 테스트 A', 'field_test', 5, '2026-09-10', null, '수성구치매안심센터', 18, 10, 'not_started', '1차 파일럿 테스트', ''],
      [11, '현장 파일럿 테스트 B', 'field_test', 5, '2026-10-08', null, '대구사회복지관', 19, 10, 'not_started', '2차 파일럿 테스트', ''],
      [12, '성과공유 및 회고', 'sharing', 6, '2026-11-12', null, '대구지역사회돌봄협의체', 18, 30, 'not_started', '성과 정리와 공유회', ''],
    ],
    'id'
  );
}

async function seedWorksheets() {
  await insertRows(
    'worksheet_tokens',
    ['id', 'token', 'workshop_id', 'template_key', 'created_at', 'expires_at', 'active'],
    [
      [1, 'ws-demo01', 4, 'hmw', '2026-05-13T09:00:00.000Z', null, 1],
      [2, 'ws-demo02', 4, 'persona', '2026-05-13T09:00:00.000Z', null, 1],
      [3, 'ws-demo03', 5, 'empathy_map', '2026-05-27T09:00:00.000Z', null, 1],
      [4, 'ws-demo04', 2, 'observation_log', '2026-04-07T09:00:00.000Z', null, 1],
    ],
    'id'
  );

  await insertRows(
    'worksheet_entries',
    [
      'id',
      'token_id',
      'workshop_id',
      'template_key',
      'group_name',
      'filled_by_name',
      'filled_by_role',
      'content_json',
      'submitted_at',
      'reviewed',
      'reviewed_by',
      'reviewed_at',
      'review_note',
    ],
    [
      [
        1,
        null,
        4,
        'hmw',
        'A조',
        '이현주',
        'activist',
        JSON.stringify({
          problem_context: '어르신이 외출을 원하지만 이동 과정과 대중교통 이용에 대한 불안이 커 가족 동행이 반복된다.',
          target_subject: 'E003',
          questions: [
            '어떻게 하면 어르신이 안전하게 일상 외출을 시작할 수 있을까?',
            '어떻게 하면 가족의 부담 없이 외출을 지원할 수 있을까?',
          ],
          key_insight: '이동 지원보다 심리적 안정감과 익숙한 동선이 중요하다.',
        }),
        '2026-05-14T14:32:00.000Z',
        1,
        '김소이',
        '2026-05-15T10:00:00.000Z',
        '질문의 초점이 명확하고 현장 상황이 잘 드러남',
      ],
      [
        2,
        null,
        4,
        'persona',
        'A조',
        '이현주',
        'activist',
        JSON.stringify({
          subject_code: 'E003',
          age_group: '70대',
          daily_routine: '오전에는 TV를 보고 오후에는 복지관 방문을 원하지만 혼자 이동하는 것을 어려워한다.',
          needs: ['익숙한 동선', '말벗', '반복 가능한 안내'],
          pains: ['버스 이용 불안', '길을 잃을까 걱정', '가족에게 부담을 주고 싶지 않음'],
          gains: '예전처럼 스스로 가까운 곳을 다니며 일상 감각을 회복하고 싶다.',
          quote: '나도 혼자 한번 다녀보고 싶은 마음이 있어.',
        }),
        '2026-05-14T15:10:00.000Z',
        0,
        '',
        null,
        '',
      ],
      [
        3,
        null,
        4,
        'hmw',
        'B조',
        '김민아',
        'activist',
        JSON.stringify({
          problem_context: '경증 치매 어르신이 약 복용 시간을 자주 놓쳐 가족이 매번 전화로 확인해야 한다.',
          target_subject: 'E007',
          questions: [
            '어떻게 하면 약 복용 시간을 스스로 기억하도록 도울 수 있을까?',
            '어떻게 하면 가족이 부담 없이 복용 여부를 확인할 수 있을까?',
          ],
          key_insight: '기억 보조보다 생활 루틴과 정서적 안심을 함께 설계해야 한다.',
        }),
        '2026-05-14T16:00:00.000Z',
        0,
        '',
        null,
        '',
      ],
    ],
    'id'
  );
}

async function seedChecklist() {
  await insertRows(
    'checklist_items',
    [
      'id',
      'phase',
      'category',
      'title',
      'description',
      'required',
      'completed',
      'completed_date',
      'completed_by',
      'evidence_note',
    ],
    [
      [1, 1, '준비', '운영 목적 정리', '리빙랩의 목적과 범위를 정의한다.', 1, 1, '2026-03-01', '퍼실리테이터 A', '기획 회의록'],
      [2, 1, '준비', '참여기관 MOU 체결', '협력 기관과 참여 범위를 합의한다.', 1, 1, '2026-03-20', '퍼실리테이터 A', 'MOU 원본'],
      [3, 1, '준비', '오리엔테이션 운영', '참여자 역할과 일정을 안내한다.', 1, 1, '2026-03-25', '퍼실리테이터 B', '참석자 명단'],
      [4, 2, '문제정의', '현장 관찰 계획 수립', '기관 방문 계획과 역할을 나눈다.', 1, 1, '2026-04-01', '퍼실리테이터 A', '방문 계획서'],
      [5, 2, '문제정의', '문제정의 워크숍 운영', '통합 문제와 질문 초안을 도출한다.', 1, 1, '2026-05-14', '퍼실리테이터 A', '워크숍 사진'],
      [6, 2, '문제정의', '공감지도 작성', '대상자 관점의 감정과 맥락을 정리한다.', 0, 0, null, null, ''],
      [7, 3, '아이디어', '아이디어 발산 워크숍', '문제 해결 아이디어를 폭넓게 수집한다.', 1, 0, null, null, ''],
      [8, 3, '아이디어', '우선순위 투표', '현장 적합성과 실행 가능성을 기준으로 선정한다.', 1, 0, null, null, ''],
      [9, 3, '아이디어', '통합 아이디어 3건 선정', '프로토타입 후보를 확정한다.', 1, 0, null, null, ''],
      [10, 4, '프로토타입', '프로토타입 명세 작성', '기능과 구성 요소를 정의한다.', 1, 0, null, null, ''],
      [11, 4, '프로토타입', '테스트 시나리오 설계', '현장 테스트 흐름과 성공 기준을 정한다.', 0, 0, null, null, ''],
      [12, 4, '프로토타입', '프로토타입 제작', '현장 적용 가능한 시안을 준비한다.', 1, 0, null, null, ''],
      [13, 5, '테스트', '파일럿 테스트 계획', '참여자, 장소, 도구를 확정한다.', 1, 0, null, null, ''],
      [14, 5, '테스트', '파일럿 테스트 A 운영', '첫 번째 현장 적용을 진행한다.', 1, 0, null, null, ''],
      [15, 5, '테스트', '테스트 결과 반영', '피드백을 분석하고 개선한다.', 1, 0, null, null, ''],
      [16, 6, '확산', '성과 보고서 작성', '통합 성과와 데이터를 정리한다.', 1, 0, null, null, ''],
      [17, 6, '확산', '성과공유회 준비', '발표 자료와 기관 안내를 준비한다.', 1, 0, null, null, ''],
      [18, 6, '확산', '지속 운영 계획 수립', '후속 운영과 확산 전략을 정리한다.', 0, 0, null, null, ''],
      [50, 1, 'safety', '전체 참가자 개인정보 동의서 수령', '', 1, 1, '2026-03-22', '', ''],
      [51, 1, 'safety', '대상자 촬영/녹음 동의 범위 확인', '', 1, 1, '2026-03-25', '', ''],
      [52, 1, 'safety', '익명 코드 부여 및 대응표 분리 보관', '', 1, 1, '2026-03-25', '', ''],
      [53, 1, 'safety', '비상 연락망 및 현장 중단 기준 공유', '', 0, 1, '2026-03-25', '', ''],
      [54, 2, 'safety', '기관 방문 전 안전 브리핑', '', 1, 1, '2026-04-07', '', ''],
      [55, 2, 'safety', '개별 인터뷰 녹음 동의 재확인', '', 1, 1, '2026-04-22', '', ''],
      [56, 2, 'safety', '관찰 기록지 비식별 처리 확인', '', 1, 0, null, '', ''],
      [57, 2, 'safety', '사진/영상 동의 여부 확인', '', 1, 0, null, '', ''],
      [58, 3, 'safety', '아이디어 발산 중 대상자 비하 표현 금지 안내', '', 1, 0, null, '', ''],
      [59, 3, 'safety', '공유 자료 익명화 처리 확인', '', 1, 0, null, '', ''],
      [60, 4, 'safety', '프로토타입 안전성 체크리스트 완료', '', 1, 0, null, '', ''],
      [61, 4, 'safety', '도구/프로토타입 위험 요소 제거 확인', '', 1, 0, null, '', ''],
      [62, 4, 'safety', '테스트 중단 기준 공유', '', 0, 0, null, '', ''],
      [63, 5, 'safety', '현장 실증 전 안전 담당자 지정', '', 1, 0, null, '', ''],
      [64, 5, 'safety', '대상자 신체/심리 이상 징후 모니터링 프로토콜 공유', '', 1, 0, null, '', ''],
      [65, 5, 'safety', '실증 중단 및 회복 지원 절차 확인', '', 1, 0, null, '', ''],
      [66, 6, 'safety', '최종 공유 자료 비식별 처리 완료', '', 1, 0, null, '', ''],
      [67, 6, 'safety', '참가자 초상권 사용 동의 최종 확인', '', 1, 0, null, '', ''],
    ],
    'id'
  );
}

async function seedSafetyAndRoles() {
  await insertRows(
    'safety_logs',
    ['id', 'phase', 'workshop_id', 'log_type', 'description', 'recorder', 'severity', 'resolved', 'resolved_note', 'created_at'],
    [
      [1, 1, 1, 'consent', '전체 참가자 동의서 수령 완료 확인', '김소이', 'info', 1, '완료', '2026-03-25T10:00:00.000Z'],
      [2, 2, 2, 'anonymization', 'E005 대상자 사진 동의 범위 재확인 필요', '박기찬', 'warning', 1, '동의 범위 재확인 완료', '2026-04-08T11:30:00.000Z'],
      [3, 2, 2, 'incident', '기관 방문 중 이동 동선 위험 징후로 일시 중단', '이활동', 'critical', 1, '환경 정비 후 안전 확인 완료', '2026-04-15T14:10:00.000Z'],
    ],
    'id'
  );

  await insertRows(
    'facilitator_roles',
    ['id', 'workshop_id', 'participant_id', 'role', 'notes'],
    [
      [1, 4, 18, 'facilitator', '문제정의 세션 메인 진행'],
      [2, 4, 1, 'recorder', '발언 메모 취합'],
      [3, 4, 2, 'safety_officer', '현장 안전 확인'],
      [4, 4, 3, 'photographer', '촬영 동의 확인 및 기록'],
      [5, 5, 19, 'facilitator', '공감지도 워크숍 진행'],
      [6, 5, 5, 'recorder', '관찰 메모 정리'],
    ],
    'id'
  );
}

async function seedMetrics() {
  await insertRows(
    'kpi_items',
    ['id', 'category', 'indicator', 'target', 'current', 'unit', 'trend', 'phase_related', 'notes'],
    [
      [1, '참여', '활동가', 20, 15, '명', 'stable', null, ''],
      [2, '참여', '기관', 5, 5, '개소', 'stable', null, ''],
      [3, '참여', '대상자', 30, 19, '명', 'stable', null, ''],
      [4, '워크숍', '워크숍 진행', 12, 4, '회', 'stable', null, ''],
      [5, '워크시트', '워크시트 완성률', 80, 25, '%', 'up', null, ''],
      [6, '성과', '프로토타입 개발', 3, 0, '건', 'stable', 4, ''],
      [7, '성과', '현장 테스트', 3, 0, '건', 'stable', 5, ''],
      [8, '홍보', 'SNS/보도자료', 10, 2, '건', 'stable', null, ''],
      [9, '예산', '사업비 집행률', 90, 18, '%', 'stable', null, ''],
    ],
    'id'
  );

  await insertRows(
    'budget_items',
    ['id', 'category', 'item_name', 'planned_amount', 'actual_amount', 'payment_date', 'payee', 'receipt_attached', 'phase', 'active', 'notes'],
    [
      [1, 'personnel', '퍼실리테이터 운영비', 4000000, 1200000, '2026-03-30', '소이랩', 1, 1, 1, ''],
      [2, 'workshop', '문제정의 워크숍 운영비', 1800000, 540000, '2026-05-14', '대구사회복지관', 1, 2, 1, ''],
      [3, 'printing', '워크시트 인쇄물', 600000, 180000, '2026-05-12', '동네인쇄소', 1, 2, 1, ''],
      [4, 'travel', '기관 방문 교통비', 500000, 120000, '2026-04-08', '활동가 팀', 1, 2, 1, ''],
      [5, 'activity', '아이디어 워크숍 다과', 300000, 0, null, '예정', 0, 3, 1, ''],
      [6, 'equipment', '프로토타입 재료비', 1500000, 0, null, '예정', 0, 4, 1, ''],
      [7, 'consulting', '전문가 자문비', 800000, 300000, '2026-04-25', '치매케어연구소', 1, 2, 1, ''],
    ],
    'id'
  );

  await insertRows(
    'promotion_records',
    ['id', 'channel', 'title', 'published_date', 'phase', 'reach_count', 'url', 'status', 'notes'],
    [
      [1, 'sns_instagram', '리빙랩 오리엔테이션 카드뉴스', '2026-03-26', 1, 320, 'https://soilabcoop.kr/instagram/orientation', 'completed', ''],
      [2, 'press_release', '치매돌봄 리빙랩 시작 보도자료', '2026-03-27', 1, 780, 'https://soilabcoop.kr/press/start', 'completed', ''],
      [3, 'newsletter', '4월 현장 방문 뉴스레터', '2026-04-30', 2, 210, 'https://soilabcoop.kr/newsletter/april', 'completed', ''],
      [4, 'sns_facebook', '문제정의 워크숍 현장 스케치', '2026-05-16', 2, 430, 'https://soilabcoop.kr/facebook/problem-definition', 'completed', ''],
      [5, 'video', '리빙랩 참여자 인터뷰 영상', null, 3, 0, 'https://soilabcoop.kr/video/interview', 'in_progress', ''],
    ],
    'id'
  );
}

async function resetSequences() {
  await Promise.all(
    [
      'participants',
      'institutions',
      'subjects',
      'workshops',
      'worksheet_tokens',
      'worksheet_entries',
      'checklist_items',
      'safety_logs',
      'facilitator_roles',
      'field_photos',
      'kpi_items',
      'budget_items',
      'promotion_records',
    ].map(resetSequence)
  );
}

export async function seedDb() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const alreadySeeded = await hasRowsIfTableExists('participants');
      if (alreadySeeded) {
        return;
      }

      await initDb();

      if (!(await hasRows('participants'))) {
        await seedParticipants();
        await seedInstitutions();
        await seedSubjects();
        await seedWorkshops();
        await seedWorksheets();
        await seedChecklist();
        await seedSafetyAndRoles();
        await seedMetrics();
        await resetSequences();
      }
    })();
  }

  await seedPromise;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/src/lib/seed.ts')) {
  seedDb()
    .then(() => closeSql())
    .catch((error: unknown) => {
      console.error('db:seed failed:', error);
      process.exit(1);
    });
}
