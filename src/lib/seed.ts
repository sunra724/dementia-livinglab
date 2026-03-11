import { getDb } from './db';
import { initDb } from './schema';

let seeded = false;

function hasRows(tableName: string) {
  const db = getDb();
  const result = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as { count: number };
  return result.count > 0;
}

export function seedDb() {
  initDb();

  if (seeded) {
    return;
  }

  const db = getDb();

  if (!hasRows('participants')) {
    const participants = [
      { id: 1, name: '김민수', role: 'activist', affiliation: '경북대학교', contact: '010-1000-0001', joined_date: '2026-03-01', active: 1, notes: '' },
      { id: 2, name: '이서연', role: 'activist', affiliation: '경북대학교', contact: '010-1000-0002', joined_date: '2026-03-01', active: 1, notes: '' },
      { id: 3, name: '박지훈', role: 'activist', affiliation: '경북대학교', contact: '010-1000-0003', joined_date: '2026-03-01', active: 1, notes: '' },
      { id: 4, name: '최예린', role: 'activist', affiliation: '경북대학교', contact: '010-1000-0004', joined_date: '2026-03-01', active: 1, notes: '' },
      { id: 5, name: '정우진', role: 'activist', affiliation: '계명대학교', contact: '010-1000-0005', joined_date: '2026-03-05', active: 1, notes: '' },
      { id: 6, name: '강하늘', role: 'activist', affiliation: '계명대학교', contact: '010-1000-0006', joined_date: '2026-03-05', active: 1, notes: '' },
      { id: 7, name: '서다미', role: 'activist', affiliation: '계명대학교', contact: '010-1000-0007', joined_date: '2026-03-05', active: 1, notes: '' },
      { id: 8, name: '유수빈', role: 'activist', affiliation: '대구가톨릭대학교', contact: '010-1000-0008', joined_date: '2026-03-10', active: 1, notes: '' },
      { id: 9, name: '손예준', role: 'activist', affiliation: '대구가톨릭대학교', contact: '010-1000-0009', joined_date: '2026-03-10', active: 1, notes: '' },
      { id: 10, name: '조세아', role: 'activist', affiliation: '대구가톨릭대학교', contact: '010-1000-0010', joined_date: '2026-03-10', active: 1, notes: '' },
      { id: 11, name: '황태영', role: 'activist', affiliation: '영남대학교', contact: '010-1000-0011', joined_date: '2026-03-15', active: 1, notes: '' },
      { id: 12, name: '오예진', role: 'activist', affiliation: '영남대학교', contact: '010-1000-0012', joined_date: '2026-03-15', active: 1, notes: '' },
      { id: 13, name: '대구센터 담당자', role: 'institution_staff', affiliation: '대구치매안심센터', contact: '010-2100-0001', joined_date: '2026-03-02', active: 1, notes: '' },
      { id: 14, name: '수성센터 담당자', role: 'institution_staff', affiliation: '수성구치매안심센터', contact: '010-2100-0002', joined_date: '2026-03-05', active: 1, notes: '' },
      { id: 15, name: '복지관 담당자', role: 'institution_staff', affiliation: '대구사회복지관', contact: '010-2100-0003', joined_date: '2026-03-10', active: 1, notes: '' },
      { id: 16, name: '간호학과 담당자', role: 'institution_staff', affiliation: '경북대학교 간호학과', contact: '010-2100-0004', joined_date: '2026-03-15', active: 1, notes: '' },
      { id: 17, name: '지역보호단체 담당자', role: 'institution_staff', affiliation: '대구지역사회돌봄협의체', contact: '010-2100-0005', joined_date: '2026-03-20', active: 1, notes: '' },
      { id: 18, name: '퍼실리테이터 A', role: 'facilitator', affiliation: '소이랩', contact: '010-3100-0001', joined_date: '2026-03-01', active: 1, notes: '' },
      { id: 19, name: '퍼실리테이터 B', role: 'facilitator', affiliation: '소이랩', contact: '010-3100-0002', joined_date: '2026-03-01', active: 1, notes: '' },
      { id: 20, name: '치매 전문위원', role: 'expert', affiliation: '치매케어연구소', contact: '010-4100-0001', joined_date: '2026-03-01', active: 1, notes: '' },
    ] as const;

    const insertParticipant = db.prepare(`
      INSERT INTO participants (id, name, role, affiliation, contact, joined_date, active, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    participants.forEach((participant) => {
      insertParticipant.run(
        participant.id,
        participant.name,
        participant.role,
        participant.affiliation,
        participant.contact,
        participant.joined_date,
        participant.active,
        participant.notes
      );
    });
  }

  if (!hasRows('institutions')) {
    const institutions = [
      {
        id: 1,
        name: '대구치매안심센터',
        type: 'dementia_center',
        representative: '대구센터장',
        contact_person: '박OO',
        contact: '053-100-0001',
        address: '대구광역시 중구 중앙대로 123',
        mou_signed: 1,
        mou_date: '2026-03-02',
        participating_phases: '[1,2,3,4,5,6]',
        notes: '',
      },
      {
        id: 2,
        name: '수성구치매안심센터',
        type: 'dementia_center',
        representative: '수성센터장',
        contact_person: '김OO',
        contact: '053-100-0002',
        address: '대구광역시 수성구 달구벌대로 234',
        mou_signed: 1,
        mou_date: '2026-03-05',
        participating_phases: '[1,2,3,4,5,6]',
        notes: '',
      },
      {
        id: 3,
        name: '대구사회복지관',
        type: 'welfare_facility',
        representative: '복지관장',
        contact_person: '최OO',
        contact: '053-100-0003',
        address: '대구광역시 중구 국채보상로 345',
        mou_signed: 1,
        mou_date: '2026-03-10',
        participating_phases: '[1,2,3,4,5,6]',
        notes: '',
      },
      {
        id: 4,
        name: '경북대학교 간호학과',
        type: 'university',
        representative: '학과장',
        contact_person: '정OO',
        contact: '053-100-0004',
        address: '대구광역시 북구 대학로 80',
        mou_signed: 1,
        mou_date: '2026-03-15',
        participating_phases: '[1,2,3,4,5,6]',
        notes: '',
      },
      {
        id: 5,
        name: '대구지역사회돌봄협의체',
        type: 'ngo',
        representative: '협의체장',
        contact_person: '송OO',
        contact: '053-100-0005',
        address: '대구광역시 동구 이천로 90',
        mou_signed: 1,
        mou_date: '2026-03-20',
        participating_phases: '[1,2,3,4,5,6]',
        notes: '',
      },
    ] as const;

    const insertInstitution = db.prepare(`
      INSERT INTO institutions (
        id, name, type, representative, contact_person, contact, address,
        mou_signed, mou_date, participating_phases, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    institutions.forEach((institution) => {
      insertInstitution.run(
        institution.id,
        institution.name,
        institution.type,
        institution.representative,
        institution.contact_person,
        institution.contact,
        institution.address,
        institution.mou_signed,
        institution.mou_date,
        institution.participating_phases,
        institution.notes
      );
    });
  }

  if (!hasRows('subjects')) {
    const elderSubjects = Array.from({ length: 15 }, (_, index) => ({
      id: index + 1,
      code: `E${String(index + 1).padStart(3, '0')}`,
      type: 'elder',
      dementia_stage: index < 5 ? 'mild_cognitive' : index < 11 ? 'mild' : 'moderate',
      age_group: index % 2 === 0 ? '70대' : '80대',
      institution_id: (index % 5) + 1,
      consent_signed: 1,
      participation_phases: index < 10 ? '[1,2,3]' : '[1,2]',
      dropout: index === 13 ? 1 : 0,
      dropout_reason: index === 13 ? '건강 악화로 중도 중단' : null,
      notes: '',
    }));

    const familySubjects = Array.from({ length: 5 }, (_, index) => ({
      id: index + 16,
      code: `F${String(index + 1).padStart(3, '0')}`,
      type: 'family_caregiver',
      dementia_stage: 'unknown',
      age_group: index % 2 === 0 ? '50대' : '60대',
      institution_id: (index % 5) + 1,
      consent_signed: 1,
      participation_phases: index < 3 ? '[1,2,3]' : '[1,2]',
      dropout: 0,
      dropout_reason: null,
      notes: '',
    }));

    const insertSubject = db.prepare(`
      INSERT INTO subjects (
        id, code, type, dementia_stage, age_group, institution_id,
        consent_signed, participation_phases, dropout, dropout_reason, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    [...elderSubjects, ...familySubjects].forEach((subject) => {
      insertSubject.run(
        subject.id,
        subject.code,
        subject.type,
        subject.dementia_stage,
        subject.age_group,
        subject.institution_id,
        subject.consent_signed,
        subject.participation_phases,
        subject.dropout,
        subject.dropout_reason,
        subject.notes
      );
    });
  }

  if (!hasRows('workshops')) {
    const workshops = [
      { id: 1, title: '오리엔테이션', type: 'orientation', phase: 1, scheduled_date: '2026-03-25', actual_date: '2026-03-25', location: '대구사회복지관', facilitator_id: 18, participants_count: 25, status: 'completed', description: '리빙랩 소개와 역할 안내', outcome_summary: '참여자 역할과 일정 공유 완료' },
      { id: 2, title: '현장 이해 기관 방문', type: 'field_observation', phase: 2, scheduled_date: '2026-04-08', actual_date: '2026-04-08', location: '대구치매안심센터', facilitator_id: 18, participants_count: 20, status: 'completed', description: '현장 관찰과 기관 인터뷰', outcome_summary: '현장 운영 구조와 주요 이슈 파악' },
      { id: 3, title: '인터뷰 기초 실습', type: 'problem_definition', phase: 2, scheduled_date: '2026-04-22', actual_date: '2026-04-22', location: '경북대학교', facilitator_id: 19, participants_count: 15, status: 'completed', description: '대상자 인터뷰 연습', outcome_summary: '인터뷰 질문지 초안 도출' },
      { id: 4, title: '문제정의 워크숍', type: 'problem_definition', phase: 2, scheduled_date: '2026-05-14', actual_date: '2026-05-14', location: '대구사회복지관', facilitator_id: 18, participants_count: 25, status: 'completed', description: '핵심 문제 정의와 HMW 도출', outcome_summary: '주요 문제 3개 합의' },
      { id: 5, title: '공감지도 작성', type: 'problem_definition', phase: 2, scheduled_date: '2026-05-28', actual_date: null, location: '수성구치매안심센터', facilitator_id: 19, participants_count: 20, status: 'in_progress', description: '공감지도 기반 사용자 이해', outcome_summary: '' },
      { id: 6, title: '고객여정지도', type: 'problem_definition', phase: 2, scheduled_date: '2026-06-11', actual_date: null, location: '경북대학교', facilitator_id: 18, participants_count: 15, status: 'not_started', description: '서비스 경험 여정 설계', outcome_summary: '' },
      { id: 7, title: '아이디어 발산 워크숍', type: 'idea_generation', phase: 3, scheduled_date: '2026-06-25', actual_date: null, location: '대구사회복지관', facilitator_id: 19, participants_count: 25, status: 'not_started', description: '브레인스토밍과 아이디어 카드 작성', outcome_summary: '' },
      { id: 8, title: '아이디어 선호도 투표', type: 'idea_generation', phase: 3, scheduled_date: '2026-07-09', actual_date: null, location: '대구치매안심센터', facilitator_id: 18, participants_count: 20, status: 'not_started', description: '우선순위 선정', outcome_summary: '' },
      { id: 9, title: '프로토타입 설계', type: 'prototype_design', phase: 4, scheduled_date: '2026-08-06', actual_date: null, location: '경북대학교', facilitator_id: 19, participants_count: 15, status: 'not_started', description: '프로토타입 명세 작성', outcome_summary: '' },
      { id: 10, title: '현장 파일럿 테스트 A', type: 'field_test', phase: 5, scheduled_date: '2026-09-10', actual_date: null, location: '수성구치매안심센터', facilitator_id: 18, participants_count: 10, status: 'not_started', description: '1차 파일럿 테스트', outcome_summary: '' },
      { id: 11, title: '현장 파일럿 테스트 B', type: 'field_test', phase: 5, scheduled_date: '2026-10-08', actual_date: null, location: '대구사회복지관', facilitator_id: 19, participants_count: 10, status: 'not_started', description: '2차 파일럿 테스트', outcome_summary: '' },
      { id: 12, title: '성과공유 및 회고', type: 'sharing', phase: 6, scheduled_date: '2026-11-12', actual_date: null, location: '대구지역사회돌봄협의체', facilitator_id: 18, participants_count: 30, status: 'not_started', description: '성과 정리와 공유회', outcome_summary: '' },
    ] as const;

    const insertWorkshop = db.prepare(`
      INSERT INTO workshops (
        id, title, type, phase, scheduled_date, actual_date, location,
        facilitator_id, participants_count, status, description, outcome_summary
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    workshops.forEach((workshop) => {
      insertWorkshop.run(
        workshop.id,
        workshop.title,
        workshop.type,
        workshop.phase,
        workshop.scheduled_date,
        workshop.actual_date,
        workshop.location,
        workshop.facilitator_id,
        workshop.participants_count,
        workshop.status,
        workshop.description,
        workshop.outcome_summary
      );
    });
  }

  const worksheetTokens = [
    { token: 'ws-demo01', workshop_id: 4, template_key: 'hmw', created_at: '2026-05-13T09:00:00', expires_at: null, active: 1 },
    { token: 'ws-demo02', workshop_id: 4, template_key: 'persona', created_at: '2026-05-13T09:00:00', expires_at: null, active: 1 },
    { token: 'ws-demo03', workshop_id: 5, template_key: 'empathy_map', created_at: '2026-05-27T09:00:00', expires_at: null, active: 1 },
    { token: 'ws-demo04', workshop_id: 2, template_key: 'observation_log', created_at: '2026-04-07T09:00:00', expires_at: null, active: 1 },
  ] as const;

  const insertWorksheetToken = db.prepare(`
    INSERT OR IGNORE INTO worksheet_tokens (token, workshop_id, template_key, created_at, expires_at, active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  worksheetTokens.forEach((worksheetToken) => {
    insertWorksheetToken.run(
      worksheetToken.token,
      worksheetToken.workshop_id,
      worksheetToken.template_key,
      worksheetToken.created_at,
      worksheetToken.expires_at,
      worksheetToken.active
    );
  });

  if (!hasRows('worksheet_entries')) {
    const worksheetEntries = [
      {
        id: 1,
        token_id: null,
        workshop_id: 4,
        template_key: 'hmw',
        group_name: 'A조',
        filled_by_name: '이현주',
        filled_by_role: 'activist',
        content_json: JSON.stringify({
          problem_context:
            '어르신이 외출을 원하지만 이동 과정과 대중교통 이용에 대한 불안이 커서 가족이 항상 동행해야 한다.',
          target_subject: 'E003',
          questions: [
            '어떻게 하면 어르신이 안전하게 혼자 동네 산책을 시작할 수 있을까요?',
            '어떻게 하면 가족의 부담 없이 외출 의지를 지지할 수 있을까요?',
          ],
          key_insight: '이동 지원보다 심리적 안정감과 익숙한 동선이 더 중요했다.',
        }),
        submitted_at: '2026-05-14T14:32:00',
        reviewed: 1,
        reviewed_by: '김소이',
        reviewed_at: '2026-05-15T10:00:00',
        review_note: '질문의 초점이 명확하고 현장 상황이 잘 드러난다.',
      },
      {
        id: 2,
        token_id: null,
        workshop_id: 4,
        template_key: 'persona',
        group_name: 'A조',
        filled_by_name: '이현주',
        filled_by_role: 'activist',
        content_json: JSON.stringify({
          subject_code: 'E003',
          age_group: '70대',
          daily_routine: '오전에는 TV를 보고 오후에는 복지관 산책을 원하지만 혼자 이동하는 것을 두려워한다.',
          needs: ['익숙한 동선', '말벗', '반복 가능한 안내'],
          pains: ['버스 이용 불안', '길을 잃을까 걱정', '가족에게 부담을 주고 싶지 않음'],
          gains: '예전처럼 스스로 가까운 곳을 다니며 일상 감각을 회복하고 싶다.',
          quote: '나도 혼자 다녀보고 싶은데 자꾸 겁이 나.',
        }),
        submitted_at: '2026-05-14T15:10:00',
        reviewed: 0,
        reviewed_by: '',
        reviewed_at: null,
        review_note: '',
      },
      {
        id: 3,
        token_id: null,
        workshop_id: 4,
        template_key: 'hmw',
        group_name: 'B조',
        filled_by_name: '김민아',
        filled_by_role: 'activist',
        content_json: JSON.stringify({
          problem_context:
            '경증 치매 어르신이 약 복용 시간을 자주 놓쳐 가족이 매번 전화로 확인해야 하는 상황이 반복된다.',
          target_subject: 'E007',
          questions: [
            '어떻게 하면 약 복용 시간을 스스로 기억하도록 도울 수 있을까요?',
            '어떻게 하면 가족이 멀리 있어도 복용 여부를 쉽게 확인할 수 있을까요?',
            '어떻게 하면 약 복용을 하루 일과와 자연스럽게 연결할 수 있을까요?',
          ],
          key_insight: '기억 보조장치보다 생활 루틴과 정서적 안심을 함께 설계하는 접근이 필요하다.',
        }),
        submitted_at: '2026-05-14T16:00:00',
        reviewed: 0,
        reviewed_by: '',
        reviewed_at: null,
        review_note: '',
      },
    ] as const;

    const insertWorksheetEntry = db.prepare(`
      INSERT INTO worksheet_entries (
        id, token_id, workshop_id, template_key, group_name, filled_by_name, filled_by_role,
        content_json, submitted_at, reviewed, reviewed_by, reviewed_at, review_note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    worksheetEntries.forEach((worksheetEntry) => {
      insertWorksheetEntry.run(
        worksheetEntry.id,
        worksheetEntry.token_id,
        worksheetEntry.workshop_id,
        worksheetEntry.template_key,
        worksheetEntry.group_name,
        worksheetEntry.filled_by_name,
        worksheetEntry.filled_by_role,
        worksheetEntry.content_json,
        worksheetEntry.submitted_at,
        worksheetEntry.reviewed,
        worksheetEntry.reviewed_by,
        worksheetEntry.reviewed_at,
        worksheetEntry.review_note
      );
    });
  }

  if (!hasRows('checklist_items')) {
    const checklistItems = [
      { id: 1, phase: 1, category: '준비', title: '운영 목적 정리', description: '리빙랩의 목적과 범위를 정의한다.', required: 1, completed: 1, completed_date: '2026-03-01', completed_by: '퍼실리테이터 A', evidence_note: '기획 회의록' },
      { id: 2, phase: 1, category: '준비', title: '참여기관 MOU 체결', description: '핵심 기관과 협력 체계를 정리한다.', required: 1, completed: 1, completed_date: '2026-03-20', completed_by: '퍼실리테이터 A', evidence_note: 'MOU 원본' },
      { id: 3, phase: 1, category: '준비', title: '오리엔테이션 운영', description: '참여자 역할과 일정 안내를 완료한다.', required: 1, completed: 1, completed_date: '2026-03-25', completed_by: '퍼실리테이터 B', evidence_note: '참석자 명단' },
      { id: 4, phase: 2, category: '문제정의', title: '현장 관찰 계획 수립', description: '기관 방문 계획과 역할을 나눈다.', required: 1, completed: 1, completed_date: '2026-04-01', completed_by: '퍼실리테이터 A', evidence_note: '방문 계획서' },
      { id: 5, phase: 2, category: '문제정의', title: '문제정의 워크숍 운영', description: '핵심 문제와 질문 초안을 도출한다.', required: 1, completed: 1, completed_date: '2026-05-14', completed_by: '퍼실리테이터 A', evidence_note: '워크숍 사진' },
      { id: 6, phase: 2, category: '문제정의', title: '공감지도 작성', description: '대상자 관점의 감정과 맥락을 정리한다.', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
      { id: 7, phase: 3, category: '아이디어', title: '아이디어 발산 워크숍', description: '문제 해결 아이디어를 폭넓게 수집한다.', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
      { id: 8, phase: 3, category: '아이디어', title: '우선순위 투표', description: '현장 적합성과 실행성을 기준으로 선별한다.', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
      { id: 9, phase: 3, category: '아이디어', title: '핵심 아이디어 3건 선정', description: '프로토타입 후보를 확정한다.', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
      { id: 10, phase: 4, category: '프로토타입', title: '프로토타입 명세 작성', description: '핵심 기능과 구성요소를 정의한다.', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
      { id: 11, phase: 4, category: '프로토타입', title: '테스트 시나리오 설계', description: '현장 테스트 흐름과 성공 기준을 정한다.', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
      { id: 12, phase: 4, category: '프로토타입', title: '프로토타입 제작', description: '현장 적용 가능한 시안을 준비한다.', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
      { id: 13, phase: 5, category: '테스트', title: '파일럿 테스트 계획', description: '참여자, 장소, 도구를 확정한다.', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
      { id: 14, phase: 5, category: '테스트', title: '파일럿 테스트 A 운영', description: '첫 번째 현장 적용을 진행한다.', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
      { id: 15, phase: 5, category: '테스트', title: '테스트 결과 반영', description: '피드백을 분석하고 개선한다.', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
      { id: 16, phase: 6, category: '확산', title: '성과 보고서 작성', description: '핵심 성과와 데이터 정리본을 만든다.', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
      { id: 17, phase: 6, category: '확산', title: '성과공유회 준비', description: '발표자료와 참여기관 안내를 준비한다.', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
      { id: 18, phase: 6, category: '확산', title: '지속 운영 계획 수립', description: '후속 운영 및 확산 전략을 정리한다.', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    ] as const;

    const insertChecklistItem = db.prepare(`
      INSERT INTO checklist_items (
        id, phase, category, title, description, required,
        completed, completed_date, completed_by, evidence_note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    checklistItems.forEach((checklistItem) => {
      insertChecklistItem.run(
        checklistItem.id,
        checklistItem.phase,
        checklistItem.category,
        checklistItem.title,
        checklistItem.description,
        checklistItem.required,
        checklistItem.completed,
        checklistItem.completed_date,
        checklistItem.completed_by,
        checklistItem.evidence_note
      );
    });
  }

  const safetyItems = [
    { id: 50, phase: 1, category: 'safety', title: '전체 참가자 개인정보 동의서 수령', required: true, completed: true, completed_date: '2026-03-22' },
    { id: 51, phase: 1, category: 'safety', title: '대상자 촬영·녹음 동의서 징구', required: true, completed: true, completed_date: '2026-03-25' },
    { id: 52, phase: 1, category: 'safety', title: '익명 코드 부여 및 실명 대조표 오프라인 보관', required: true, completed: true, completed_date: '2026-03-25' },
    { id: 53, phase: 1, category: 'safety', title: '비상 연락망 및 현장 중단 기준 공유', required: false, completed: true, completed_date: '2026-03-25' },
    { id: 54, phase: 2, category: 'safety', title: '현장 방문 전 기관 담당자 안전 브리핑', required: true, completed: true, completed_date: '2026-04-07' },
    { id: 55, phase: 2, category: 'safety', title: '개별 인터뷰 시 녹음 동의 재확인', required: true, completed: true, completed_date: '2026-04-22' },
    { id: 56, phase: 2, category: 'safety', title: '관찰 기록지 비식별 처리 확인', required: true, completed: false, completed_date: null },
    { id: 57, phase: 2, category: 'safety', title: '사진·영상 동의 여부 전수 확인', required: true, completed: false, completed_date: null },
    { id: 58, phase: 3, category: 'safety', title: '아이디어 발산 시 대상자 비하 표현 금지 안내', required: true, completed: false, completed_date: null },
    { id: 59, phase: 3, category: 'safety', title: '공유 자료 익명화 처리 확인', required: true, completed: false, completed_date: null },
    { id: 60, phase: 4, category: 'safety', title: '프로토타입 안전성 최우선 점검 체크리스트 완료', required: true, completed: false, completed_date: null },
    { id: 61, phase: 4, category: 'safety', title: '실물 프로토타입 위험 요소 제거 확인', required: true, completed: false, completed_date: null },
    { id: 62, phase: 4, category: 'safety', title: '프로토타입 테스트 중단 기준 팀 공유', required: false, completed: false, completed_date: null },
    { id: 63, phase: 5, category: 'safety', title: '현장 실증 전 안전 담당자 지정 확인', required: true, completed: false, completed_date: null },
    { id: 64, phase: 5, category: 'safety', title: '대상자 신체·심리 이상 징후 모니터링 프로토콜 숙지', required: true, completed: false, completed_date: null },
    { id: 65, phase: 5, category: 'safety', title: '실증 중단 후 회복 지원 절차 확인', required: true, completed: false, completed_date: null },
    { id: 66, phase: 6, category: 'safety', title: '최종 공유 자료 전체 비식별 처리 완료', required: true, completed: false, completed_date: null },
    { id: 67, phase: 6, category: 'safety', title: '참가자 초상권 사용 동의 최종 확인', required: true, completed: false, completed_date: null },
  ] as const;

  const insertSafetyChecklistItem = db.prepare(`
    INSERT OR IGNORE INTO checklist_items
    (id, phase, category, title, description, required, completed, completed_date, completed_by, evidence_note)
    VALUES (?, ?, ?, ?, '', ?, ?, ?, '', '')
  `);

  safetyItems.forEach((item) => {
    insertSafetyChecklistItem.run(
      item.id,
      item.phase,
      item.category,
      item.title,
      item.required ? 1 : 0,
      item.completed ? 1 : 0,
      item.completed_date
    );
  });

  if (!hasRows('safety_logs')) {
    const safetyLogs = [
      {
        phase: 1,
        workshop_id: 1,
        log_type: 'consent',
        description: '전체 참가자 동의서 수령 완료 확인',
        recorder: '김퍼실',
        severity: 'info',
        resolved: 1,
        resolved_note: '완료',
        created_at: '2026-03-25T10:00:00',
      },
      {
        phase: 2,
        workshop_id: 2,
        log_type: 'anonymization',
        description: 'E005 대상자 사진 동의서 미확인 — 재확인 필요',
        recorder: '박관찰',
        severity: 'warning',
        resolved: 1,
        resolved_note: '동의서 재확인 완료',
        created_at: '2026-04-08T11:30:00',
      },
      {
        phase: 2,
        workshop_id: 2,
        log_type: 'incident',
        description: '기관 방문 중 어르신 낙상 위험 징후 발생 — 즉시 활동 일시 중단',
        recorder: '이활동',
        severity: 'critical',
        resolved: 1,
        resolved_note: '환경 정비 후 안전 확인 완료, 재개',
        created_at: '2026-04-15T14:10:00',
      },
    ] as const;

    const insertSafetyLog = db.prepare(`
      INSERT INTO safety_logs (
        phase, workshop_id, log_type, description, recorder, severity, resolved, resolved_note, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    safetyLogs.forEach((log) => {
      insertSafetyLog.run(
        log.phase,
        log.workshop_id,
        log.log_type,
        log.description,
        log.recorder,
        log.severity,
        log.resolved,
        log.resolved_note,
        log.created_at
      );
    });
  }

  if (!hasRows('facilitator_roles')) {
    const facilitatorRoles = [
      { workshop_id: 4, participant_id: 18, role: 'facilitator', notes: '문제정의 세션 메인 진행' },
      { workshop_id: 4, participant_id: 1, role: 'recorder', notes: '팀별 메모 수합' },
      { workshop_id: 4, participant_id: 2, role: 'safety_officer', notes: '현장 안전 확인' },
      { workshop_id: 4, participant_id: 3, role: 'photographer', notes: '촬영 동의 확인 후 기록' },
      { workshop_id: 5, participant_id: 19, role: 'facilitator', notes: '공감지도 워크숍 진행' },
      { workshop_id: 5, participant_id: 5, role: 'recorder', notes: '관찰 메모 정리' },
    ] as const;

    const insertRole = db.prepare(`
      INSERT INTO facilitator_roles (workshop_id, participant_id, role, notes)
      VALUES (?, ?, ?, ?)
    `);

    facilitatorRoles.forEach((assignment) => {
      insertRole.run(
        assignment.workshop_id,
        assignment.participant_id,
        assignment.role,
        assignment.notes
      );
    });
  }

  if (!hasRows('kpi_items')) {
    const kpiItems = [
      { id: 1, category: '참가자', indicator: '활동가', target: 20, current: 15, unit: '명', trend: 'stable', phase_related: null, notes: '' },
      { id: 2, category: '참가자', indicator: '기관', target: 5, current: 5, unit: '개소', trend: 'stable', phase_related: null, notes: '' },
      { id: 3, category: '참가자', indicator: '대상자', target: 30, current: 19, unit: '명', trend: 'stable', phase_related: null, notes: '' },
      { id: 4, category: '워크숍', indicator: '워크숍 진행', target: 12, current: 4, unit: '회', trend: 'stable', phase_related: null, notes: '' },
      { id: 5, category: '워크시트', indicator: '워크시트 완성률', target: 80, current: 25, unit: '%', trend: 'up', phase_related: null, notes: '' },
      { id: 6, category: '성과', indicator: '프로토타입 개발', target: 3, current: 0, unit: '건', trend: 'stable', phase_related: 4, notes: '' },
      { id: 7, category: '성과', indicator: '현장 테스트', target: 3, current: 0, unit: '건', trend: 'stable', phase_related: 5, notes: '' },
      { id: 8, category: '홍보', indicator: 'SNS/보도자료', target: 10, current: 2, unit: '건', trend: 'stable', phase_related: null, notes: '' },
      { id: 9, category: '예산', indicator: '사업비 집행률', target: 90, current: 18, unit: '%', trend: 'stable', phase_related: null, notes: '' },
    ] as const;

    const insertKpiItem = db.prepare(`
      INSERT INTO kpi_items (
        id, category, indicator, target, current, unit, trend, phase_related, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    kpiItems.forEach((kpiItem) => {
      insertKpiItem.run(
        kpiItem.id,
        kpiItem.category,
        kpiItem.indicator,
        kpiItem.target,
        kpiItem.current,
        kpiItem.unit,
        kpiItem.trend,
        kpiItem.phase_related,
        kpiItem.notes
      );
    });
  }

  if (!hasRows('budget_items')) {
    const budgetItems = [
      { id: 1, category: 'personnel', item_name: '퍼실리테이터 운영비', planned_amount: 4000000, actual_amount: 1200000, payment_date: '2026-03-30', payee: '소이랩', receipt_attached: 1, phase: 1, active: 1, notes: '' },
      { id: 2, category: 'workshop', item_name: '문제정의 워크숍 운영비', planned_amount: 1800000, actual_amount: 540000, payment_date: '2026-05-14', payee: '대구사회복지관', receipt_attached: 1, phase: 2, active: 1, notes: '' },
      { id: 3, category: 'printing', item_name: '워크시트 인쇄물', planned_amount: 600000, actual_amount: 180000, payment_date: '2026-05-12', payee: '동네인쇄소', receipt_attached: 1, phase: 2, active: 1, notes: '' },
      { id: 4, category: 'travel', item_name: '기관 방문 교통비', planned_amount: 500000, actual_amount: 120000, payment_date: '2026-04-08', payee: '활동가 팀', receipt_attached: 1, phase: 2, active: 1, notes: '' },
      { id: 5, category: 'activity', item_name: '아이디어 워크숍 다과', planned_amount: 300000, actual_amount: 0, payment_date: null, payee: '예정', receipt_attached: 0, phase: 3, active: 1, notes: '' },
      { id: 6, category: 'equipment', item_name: '프로토타입 재료비', planned_amount: 1500000, actual_amount: 0, payment_date: null, payee: '예정', receipt_attached: 0, phase: 4, active: 1, notes: '' },
      { id: 7, category: 'consulting', item_name: '전문가 자문비', planned_amount: 800000, actual_amount: 300000, payment_date: '2026-04-25', payee: '치매케어연구소', receipt_attached: 1, phase: 2, active: 1, notes: '' },
    ] as const;

    const insertBudgetItem = db.prepare(`
      INSERT INTO budget_items (
        id, category, item_name, planned_amount, actual_amount, payment_date,
        payee, receipt_attached, phase, active, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    budgetItems.forEach((budgetItem) => {
      insertBudgetItem.run(
        budgetItem.id,
        budgetItem.category,
        budgetItem.item_name,
        budgetItem.planned_amount,
        budgetItem.actual_amount,
        budgetItem.payment_date,
        budgetItem.payee,
        budgetItem.receipt_attached,
        budgetItem.phase,
        budgetItem.active,
        budgetItem.notes
      );
    });
  }

  if (!hasRows('promotion_records')) {
    const promotionRecords = [
      { id: 1, channel: 'sns_instagram', title: '리빙랩 오리엔테이션 카드뉴스', published_date: '2026-03-26', phase: 1, reach_count: 320, url: 'https://soilabcoop.kr/instagram/orientation', status: 'completed', notes: '' },
      { id: 2, channel: 'press_release', title: '치매돌봄 리빙랩 시작 보도자료', published_date: '2026-03-27', phase: 1, reach_count: 780, url: 'https://soilabcoop.kr/press/start', status: 'completed', notes: '' },
      { id: 3, channel: 'newsletter', title: '4월 현장 방문 뉴스레터', published_date: '2026-04-30', phase: 2, reach_count: 210, url: 'https://soilabcoop.kr/newsletter/april', status: 'completed', notes: '' },
      { id: 4, channel: 'sns_facebook', title: '문제정의 워크숍 현장 스케치', published_date: '2026-05-16', phase: 2, reach_count: 430, url: 'https://soilabcoop.kr/facebook/problem-definition', status: 'completed', notes: '' },
      { id: 5, channel: 'video', title: '리빙랩 참여자 인터뷰 영상', published_date: null, phase: 3, reach_count: 0, url: 'https://soilabcoop.kr/video/interview', status: 'in_progress', notes: '' },
    ] as const;

    const insertPromotionRecord = db.prepare(`
      INSERT INTO promotion_records (
        id, channel, title, published_date, phase, reach_count, url, status, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    promotionRecords.forEach((promotionRecord) => {
      insertPromotionRecord.run(
        promotionRecord.id,
        promotionRecord.channel,
        promotionRecord.title,
        promotionRecord.published_date,
        promotionRecord.phase,
        promotionRecord.reach_count,
        promotionRecord.url,
        promotionRecord.status,
        promotionRecord.notes
      );
    });
  }

  seeded = true;
}
