import { getDb } from './db';
import { initDb } from './schema';

let seeded = false;

export function seedDb() {
  initDb();

  if (seeded) {
    return;
  }

  const db = getDb();

  const participants = [
    { id: 1, name: '김민수', role: 'activist', affiliation: '경북대학교', contact: '010-1000-0001', joined_date: '2026-03-01', active: 1, notes: '' },
    { id: 2, name: '이서연', role: 'activist', affiliation: '경북대학교', contact: '010-1000-0002', joined_date: '2026-03-01', active: 1, notes: '' },
    { id: 3, name: '박지훈', role: 'activist', affiliation: '경북대학교', contact: '010-1000-0003', joined_date: '2026-03-01', active: 1, notes: '' },
    { id: 4, name: '최예린', role: 'activist', affiliation: '경북대학교', contact: '010-1000-0004', joined_date: '2026-03-01', active: 1, notes: '' },
    { id: 5, name: '정우진', role: 'activist', affiliation: '계명대학교', contact: '010-1000-0005', joined_date: '2026-03-05', active: 1, notes: '' },
    { id: 6, name: '강하늘', role: 'activist', affiliation: '계명대학교', contact: '010-1000-0006', joined_date: '2026-03-05', active: 1, notes: '' },
    { id: 7, name: '윤지민', role: 'activist', affiliation: '계명대학교', contact: '010-1000-0007', joined_date: '2026-03-05', active: 1, notes: '' },
    { id: 8, name: '임수빈', role: 'activist', affiliation: '대구가톨릭대학교', contact: '010-1000-0008', joined_date: '2026-03-10', active: 1, notes: '' },
    { id: 9, name: '송민준', role: 'activist', affiliation: '대구가톨릭대학교', contact: '010-1000-0009', joined_date: '2026-03-10', active: 1, notes: '' },
    { id: 10, name: '한지우', role: 'activist', affiliation: '대구가톨릭대학교', contact: '010-1000-0010', joined_date: '2026-03-10', active: 1, notes: '' },
    { id: 11, name: '오태영', role: 'activist', affiliation: '영남대학교', contact: '010-1000-0011', joined_date: '2026-03-15', active: 1, notes: '' },
    { id: 12, name: '신예진', role: 'activist', affiliation: '영남대학교', contact: '010-1000-0012', joined_date: '2026-03-15', active: 1, notes: '' },
    { id: 13, name: '남구센터장', role: 'institution_staff', affiliation: '남구치매안심센터', contact: '010-2100-0001', joined_date: '2026-03-02', active: 1, notes: '' },
    { id: 14, name: '수성센터장', role: 'institution_staff', affiliation: '수성구치매안심센터', contact: '010-2100-0002', joined_date: '2026-03-05', active: 1, notes: '' },
    { id: 15, name: '복지관장', role: 'institution_staff', affiliation: '대구사회복지관', contact: '010-2100-0003', joined_date: '2026-03-10', active: 1, notes: '' },
    { id: 16, name: '간호학과장', role: 'institution_staff', affiliation: '경북대학교 간호학과', contact: '010-2100-0004', joined_date: '2026-03-15', active: 1, notes: '' },
    { id: 17, name: '협의체장', role: 'institution_staff', affiliation: '남구지역사회보장협의체', contact: '010-2100-0005', joined_date: '2026-03-20', active: 1, notes: '' },
    { id: 18, name: '퍼실리테이터A', role: 'facilitator', affiliation: '소이랩', contact: '010-3100-0001', joined_date: '2026-03-01', active: 1, notes: '' },
    { id: 19, name: '퍼실리테이터B', role: 'facilitator', affiliation: '소이랩', contact: '010-3100-0002', joined_date: '2026-03-01', active: 1, notes: '' },
    { id: 20, name: '치매전문가', role: 'expert', affiliation: '치매케어센터', contact: '010-4100-0001', joined_date: '2026-03-01', active: 1, notes: '' },
  ] as const;

  const insertParticipant = db.prepare(`
    INSERT OR IGNORE INTO participants (id, name, role, affiliation, contact, joined_date, active, notes)
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

  const institutions = [
    {
      id: 1,
      name: '남구치매안심센터',
      type: 'dementia_center',
      representative: '남구센터장',
      contact_person: '박OO',
      contact: '010-5100-0001',
      address: '대구광역시 남구 중앙대로 123',
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
      contact_person: '이OO',
      contact: '010-5100-0002',
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
      contact: '010-5100-0003',
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
      representative: '간호학과장',
      contact_person: '정OO',
      contact: '010-5100-0004',
      address: '대구광역시 북구 대학로 80',
      mou_signed: 1,
      mou_date: '2026-03-15',
      participating_phases: '[1,2,3,4,5,6]',
      notes: '',
    },
    {
      id: 5,
      name: '남구지역사회보장협의체',
      type: 'ngo',
      representative: '협의체장',
      contact_person: '한OO',
      contact: '010-5100-0005',
      address: '대구광역시 남구 이천로 90',
      mou_signed: 1,
      mou_date: '2026-03-20',
      participating_phases: '[1,2,3,4,5,6]',
      notes: '',
    },
  ] as const;

  const insertInstitution = db.prepare(`
    INSERT OR IGNORE INTO institutions (
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

  const subjects = [
    { id: 1, code: 'E001', type: 'elder', dementia_stage: 'mild_cognitive', age_group: '70대', institution_id: 1, consent_signed: 1, participation_phases: '[1,2]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 2, code: 'E002', type: 'elder', dementia_stage: 'mild_cognitive', age_group: '70대', institution_id: 1, consent_signed: 1, participation_phases: '[1,2]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 3, code: 'E003', type: 'elder', dementia_stage: 'mild_cognitive', age_group: '80대', institution_id: 2, consent_signed: 1, participation_phases: '[1,2]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 4, code: 'E004', type: 'elder', dementia_stage: 'mild_cognitive', age_group: '80대', institution_id: 2, consent_signed: 1, participation_phases: '[1,2]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 5, code: 'E005', type: 'elder', dementia_stage: 'mild_cognitive', age_group: '70대', institution_id: 3, consent_signed: 1, participation_phases: '[1,2]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 6, code: 'E006', type: 'elder', dementia_stage: 'mild', age_group: '70대', institution_id: 1, consent_signed: 1, participation_phases: '[1,2,3]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 7, code: 'E007', type: 'elder', dementia_stage: 'mild', age_group: '80대', institution_id: 1, consent_signed: 1, participation_phases: '[1,2,3]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 8, code: 'E008', type: 'elder', dementia_stage: 'mild', age_group: '70대', institution_id: 2, consent_signed: 1, participation_phases: '[1,2,3]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 9, code: 'E009', type: 'elder', dementia_stage: 'mild', age_group: '80대', institution_id: 2, consent_signed: 1, participation_phases: '[1,2,3]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 10, code: 'E010', type: 'elder', dementia_stage: 'mild', age_group: '70대', institution_id: 3, consent_signed: 1, participation_phases: '[1,2,3]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 11, code: 'E011', type: 'elder', dementia_stage: 'mild', age_group: '80대', institution_id: 3, consent_signed: 1, participation_phases: '[1,2,3]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 12, code: 'E012', type: 'elder', dementia_stage: 'moderate', age_group: '70대', institution_id: 1, consent_signed: 1, participation_phases: '[1,2]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 13, code: 'E013', type: 'elder', dementia_stage: 'moderate', age_group: '80대', institution_id: 2, consent_signed: 1, participation_phases: '[1,2]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 14, code: 'E014', type: 'elder', dementia_stage: 'moderate', age_group: '70대', institution_id: 3, consent_signed: 1, participation_phases: '[1,2]', dropout: 1, dropout_reason: '건강 악화로 중도 중단', notes: '' },
    { id: 15, code: 'E015', type: 'elder', dementia_stage: 'moderate', age_group: '80대', institution_id: 4, consent_signed: 1, participation_phases: '[1,2]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 16, code: 'F001', type: 'family_caregiver', dementia_stage: 'unknown', age_group: '50대', institution_id: 1, consent_signed: 1, participation_phases: '[1,2]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 17, code: 'F002', type: 'family_caregiver', dementia_stage: 'unknown', age_group: '60대', institution_id: 2, consent_signed: 1, participation_phases: '[1,2]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 18, code: 'F003', type: 'family_caregiver', dementia_stage: 'unknown', age_group: '50대', institution_id: 3, consent_signed: 1, participation_phases: '[1,2,3]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 19, code: 'F004', type: 'family_caregiver', dementia_stage: 'unknown', age_group: '60대', institution_id: 4, consent_signed: 1, participation_phases: '[1,2,3]', dropout: 0, dropout_reason: null, notes: '' },
    { id: 20, code: 'F005', type: 'family_caregiver', dementia_stage: 'unknown', age_group: '50대', institution_id: 5, consent_signed: 1, participation_phases: '[1,2,3]', dropout: 0, dropout_reason: null, notes: '' },
  ] as const;

  const insertSubject = db.prepare(`
    INSERT OR IGNORE INTO subjects (
      id, code, type, dementia_stage, age_group, institution_id,
      consent_signed, participation_phases, dropout, dropout_reason, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  subjects.forEach((subject) => {
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

  const workshops = [
    { id: 1, title: '오리엔테이션', type: 'orientation', phase: 1, scheduled_date: '2026-03-25', actual_date: '2026-03-25', location: '대구사회복지관', facilitator_id: 18, participants_count: 25, status: 'completed', description: '리빙랩 소개 및 팀 구성', outcome_summary: '참가자들 간 친목 형성' },
    { id: 2, title: '현장이해 기관방문', type: 'field_observation', phase: 2, scheduled_date: '2026-04-08', actual_date: '2026-04-08', location: '남구치매안심센터', facilitator_id: 18, participants_count: 20, status: 'completed', description: '치매안심센터 현장 방문', outcome_summary: '치매 케어 현장 이해' },
    { id: 3, title: '심층인터뷰 실습', type: 'problem_definition', phase: 2, scheduled_date: '2026-04-22', actual_date: '2026-04-22', location: '경북대학교', facilitator_id: 19, participants_count: 15, status: 'completed', description: '인터뷰 기법 실습', outcome_summary: '인터뷰 스킬 향상' },
    { id: 4, title: '문제정의 워크숍', type: 'problem_definition', phase: 2, scheduled_date: '2026-05-14', actual_date: '2026-05-14', location: '대구사회복지관', facilitator_id: 18, participants_count: 25, status: 'completed', description: '핵심 문제 도출', outcome_summary: '3개 주요 문제 선정' },
    { id: 5, title: '공감지도 작성', type: 'problem_definition', phase: 2, scheduled_date: '2026-05-28', actual_date: null, location: '수성구치매안심센터', facilitator_id: 19, participants_count: 20, status: 'in_progress', description: '공감지도 작성 워크숍', outcome_summary: '' },
    { id: 6, title: '고객여정지도', type: 'problem_definition', phase: 2, scheduled_date: '2026-06-11', actual_date: null, location: '경북대학교', facilitator_id: 18, participants_count: 15, status: 'not_started', description: '여정지도 작성', outcome_summary: '' },
    { id: 7, title: '아이디어 발산 워크숍', type: 'idea_generation', phase: 3, scheduled_date: '2026-06-25', actual_date: null, location: '대구사회복지관', facilitator_id: 19, participants_count: 25, status: 'not_started', description: '아이디어 브레인스토밍', outcome_summary: '' },
    { id: 8, title: '아이디어 수렴·투표', type: 'idea_generation', phase: 3, scheduled_date: '2026-07-09', actual_date: null, location: '남구치매안심센터', facilitator_id: 18, participants_count: 20, status: 'not_started', description: '아이디어 선정 투표', outcome_summary: '' },
    { id: 9, title: '프로토타입 설계', type: 'prototype_design', phase: 4, scheduled_date: '2026-08-06', actual_date: null, location: '경북대학교', facilitator_id: 19, participants_count: 15, status: 'not_started', description: '프로토타입 디자인', outcome_summary: '' },
    { id: 10, title: '현장 파일럿 테스트 A', type: 'field_test', phase: 5, scheduled_date: '2026-09-10', actual_date: null, location: '수성구치매안심센터', facilitator_id: 18, participants_count: 10, status: 'not_started', description: '프로토타입 테스트', outcome_summary: '' },
    { id: 11, title: '현장 파일럿 테스트 B', type: 'field_test', phase: 5, scheduled_date: '2026-10-08', actual_date: null, location: '대구사회복지관', facilitator_id: 19, participants_count: 10, status: 'not_started', description: '프로토타입 테스트', outcome_summary: '' },
    { id: 12, title: '성과공유 및 사례집', type: 'sharing', phase: 6, scheduled_date: '2026-11-12', actual_date: null, location: '남구지역사회보장협의체', facilitator_id: 18, participants_count: 30, status: 'not_started', description: '최종 성과 공유', outcome_summary: '' },
  ] as const;

  const insertWorkshop = db.prepare(`
    INSERT OR IGNORE INTO workshops (
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

  const worksheets = [
    {
      id: 1,
      workshop_id: 4,
      template_key: 'hmw',
      filled_by: 1,
      content_json:
        '{"questions":["How might we reduce anxiety during outdoor trips?","How might we improve caregiver communication during outings?"]}',
      submitted_at: '2026-05-14T10:00:00Z',
      reviewed: 1,
    },
    {
      id: 2,
      workshop_id: 4,
      template_key: 'persona',
      filled_by: 2,
      content_json:
        '{"name":"김할머니","age":75,"stage":"mild","needs":["간단한 일상 도움","가족과의 소통"]}',
      submitted_at: '2026-05-14T11:00:00Z',
      reviewed: 1,
    },
    {
      id: 3,
      workshop_id: 4,
      template_key: 'persona',
      filled_by: 3,
      content_json:
        '{"name":"이할아버지","age":78,"stage":"moderate","needs":["안전한 환경","정서적 지지"]}',
      submitted_at: '2026-05-14T12:00:00Z',
      reviewed: 1,
    },
  ] as const;

  const insertWorksheet = db.prepare(`
    INSERT OR IGNORE INTO worksheet_entries (
      id, workshop_id, template_key, filled_by, content_json, submitted_at, reviewed
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  worksheets.forEach((worksheet) => {
    insertWorksheet.run(
      worksheet.id,
      worksheet.workshop_id,
      worksheet.template_key,
      worksheet.filled_by,
      worksheet.content_json,
      worksheet.submitted_at,
      worksheet.reviewed
    );
  });

  const checklists = [
    { id: 1, phase: 1, category: '준비', title: '리빙랩 목적·범위 설정', description: '프로젝트 목표 및 범위 정의', required: 1, completed: 1, completed_date: '2026-03-01', completed_by: '퍼실리테이터A', evidence_note: '회의록 참조' },
    { id: 2, phase: 1, category: '준비', title: '참여기관 MOU 체결', description: '참여 기관과의 협약서 체결', required: 1, completed: 1, completed_date: '2026-03-20', completed_by: '퍼실리테이터A', evidence_note: 'MOU 문서' },
    { id: 3, phase: 1, category: '준비', title: '활동가 모집 및 OT', description: '대학생 활동가 모집 및 오리엔테이션', required: 1, completed: 1, completed_date: '2026-03-25', completed_by: '퍼실리테이터A', evidence_note: '참석자 명단' },
    { id: 4, phase: 1, category: '준비', title: '기관 담당자 역할 분장', description: '각 기관 담당자의 역할 명확화', required: 0, completed: 1, completed_date: '2026-03-10', completed_by: '퍼실리테이터B', evidence_note: '역할 분장표' },
    { id: 5, phase: 1, category: '준비', title: '윤리심의/동의서 준비', description: '연구 윤리 심의 및 동의서 양식 준비', required: 1, completed: 1, completed_date: '2026-03-15', completed_by: '치매전문가', evidence_note: '윤리심의 승인서' },
    { id: 6, phase: 1, category: '준비', title: '운영 일정표 확정', description: '전체 프로젝트 일정 확정', required: 0, completed: 1, completed_date: '2026-03-20', completed_by: '퍼실리테이터A', evidence_note: '일정표 문서' },
    { id: 7, phase: 2, category: '문제정의', title: '현장관찰 계획 수립', description: '현장 방문 계획 수립', required: 0, completed: 1, completed_date: '2026-04-01', completed_by: '퍼실리테이터A', evidence_note: '방문 계획서' },
    { id: 8, phase: 2, category: '문제정의', title: '기관 방문 현장관찰 (3회 이상)', description: '치매안심센터 등 현장 방문', required: 1, completed: 1, completed_date: '2026-04-22', completed_by: '퍼실리테이터A', evidence_note: '방문 기록' },
    { id: 9, phase: 2, category: '문제정의', title: '이해관계자 심층인터뷰', description: '어르신, 가족, 담당자 인터뷰', required: 1, completed: 1, completed_date: '2026-04-22', completed_by: '퍼실리테이터B', evidence_note: '인터뷰 녹취록' },
    { id: 10, phase: 2, category: '문제정의', title: '관찰·인터뷰 기록지 작성', description: '현장 관찰 및 인터뷰 기록', required: 1, completed: 1, completed_date: '2026-05-01', completed_by: '활동가', evidence_note: '기록지 파일' },
    { id: 11, phase: 2, category: '문제정의', title: '문제정의 워크숍 진행', description: '문제 도출 워크숍', required: 1, completed: 1, completed_date: '2026-05-14', completed_by: '퍼실리테이터A', evidence_note: '워크숍 자료' },
    { id: 12, phase: 2, category: '문제정의', title: 'HMW 질문 도출', description: 'How Might We 질문 작성', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 13, phase: 2, category: '문제정의', title: '핵심 문제 3개 이상 선정', description: '주요 문제 선정', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 14, phase: 2, category: '문제정의', title: '페르소나 2개 이상 작성', description: '사용자 페르소나 작성', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 15, phase: 3, category: '아이디어', title: '아이디어 발산 워크숍', description: '아이디어 생성 워크숍', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 16, phase: 3, category: '아이디어', title: '아이디어 수렴 및 투표', description: '아이디어 선정', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 17, phase: 3, category: '아이디어', title: '프로토타입 스케치', description: '초기 프로토타입 디자인', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 18, phase: 3, category: '아이디어', title: '아이디어 평가 기준 수립', description: '평가 기준 정의', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 19, phase: 3, category: '아이디어', title: '최종 아이디어 3개 선정', description: '프로토타입 대상 아이디어 선정', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 20, phase: 3, category: '아이디어', title: '아이디어 구체화', description: '선정된 아이디어 상세화', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 21, phase: 4, category: '프로토타입', title: '프로토타입 설계 워크숍', description: '프로토타입 디자인 워크숍', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 22, phase: 4, category: '프로토타입', title: '프로토타입 제작', description: '프로토타입 물리적 제작', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 23, phase: 4, category: '프로토타입', title: '프로토타입 테스트 계획', description: '테스트 시나리오 작성', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 24, phase: 4, category: '프로토타입', title: '프로토타입 검토', description: '프로토타입 품질 검토', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 25, phase: 4, category: '프로토타입', title: '프로토타입 수정', description: '필요시 프로토타입 개선', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 26, phase: 4, category: '프로토타입', title: '프로토타입 완성', description: '최종 프로토타입 준비', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 27, phase: 5, category: '테스트', title: '현장 테스트 계획 수립', description: '테스트 일정 및 방법 계획', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 28, phase: 5, category: '테스트', title: '테스트 참가자 모집', description: '테스트 참여자 확보', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 29, phase: 5, category: '테스트', title: '파일럿 테스트 A 진행', description: '첫 번째 현장 테스트', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 30, phase: 5, category: '테스트', title: '테스트 결과 분석', description: '테스트 데이터 분석', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 31, phase: 5, category: '테스트', title: '프로토타입 개선', description: '테스트 결과 기반 개선', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 32, phase: 5, category: '테스트', title: '파일럿 테스트 B 진행', description: '두 번째 현장 테스트', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 33, phase: 5, category: '테스트', title: '최종 테스트 결과 정리', description: '테스트 결과 보고서 작성', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 34, phase: 6, category: '확산', title: '성과 정리 및 보고서 작성', description: '프로젝트 성과 정리', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 35, phase: 6, category: '확산', title: '사례집 제작', description: '프로젝트 사례집 작성', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 36, phase: 6, category: '확산', title: '성과공유 워크숍', description: '최종 성과 공유 행사', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 37, phase: 6, category: '확산', title: '지속가능성 계획 수립', description: '프로젝트 지속 운영 계획', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 38, phase: 6, category: '확산', title: '확산 전략 수립', description: '성과 확산 방안 계획', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 39, phase: 6, category: '확산', title: '외부 홍보 및 공유', description: '외부 기관에 성과 공유', required: 0, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
    { id: 40, phase: 6, category: '확산', title: '프로젝트 종료 및 평가', description: '최종 프로젝트 평가', required: 1, completed: 0, completed_date: null, completed_by: null, evidence_note: '' },
  ] as const;

  const insertChecklist = db.prepare(`
    INSERT OR IGNORE INTO checklist_items (
      id, phase, category, title, description, required,
      completed, completed_date, completed_by, evidence_note
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  checklists.forEach((checklist) => {
    insertChecklist.run(
      checklist.id,
      checklist.phase,
      checklist.category,
      checklist.title,
      checklist.description,
      checklist.required,
      checklist.completed,
      checklist.completed_date,
      checklist.completed_by,
      checklist.evidence_note
    );
  });

  const kpis = [
    { id: 1, category: '참가자', indicator: '활동가', target: 20, current: 15, unit: '명', trend: 'stable', phase_related: null, notes: '' },
    { id: 2, category: '참가자', indicator: '기관', target: 5, current: 5, unit: '개소', trend: 'stable', phase_related: null, notes: '' },
    { id: 3, category: '참가자', indicator: '대상자', target: 30, current: 19, unit: '명', trend: 'stable', phase_related: null, notes: '' },
    { id: 4, category: '워크숍', indicator: '워크숍 진행', target: 12, current: 4, unit: '회', trend: 'stable', phase_related: null, notes: '' },
    { id: 5, category: '워크숍', indicator: '워크시트 완성률', target: 80, current: 25, unit: '%', trend: 'up', phase_related: null, notes: '' },
    { id: 6, category: '성과', indicator: '프로토타입 개발', target: 3, current: 0, unit: '건', trend: 'stable', phase_related: 4, notes: '' },
    { id: 7, category: '성과', indicator: '현장 테스트', target: 3, current: 0, unit: '건', trend: 'stable', phase_related: 5, notes: '' },
    { id: 8, category: '홍보', indicator: 'SNS/보도자료', target: 10, current: 2, unit: '건', trend: 'stable', phase_related: null, notes: '' },
    { id: 9, category: '예산', indicator: '사업비 집행률', target: 90, current: 18, unit: '%', trend: 'stable', phase_related: null, notes: '' },
  ] as const;

  const insertKpi = db.prepare(`
    INSERT OR IGNORE INTO kpi_items (
      id, category, indicator, target, current, unit, trend, phase_related, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  kpis.forEach((kpi) => {
    insertKpi.run(
      kpi.id,
      kpi.category,
      kpi.indicator,
      kpi.target,
      kpi.current,
      kpi.unit,
      kpi.trend,
      kpi.phase_related,
      kpi.notes
    );
  });

  const budgets = [
    { id: 1, category: 'personnel', item_name: '퍼실리테이터 활동비', planned_amount: 1200000, actual_amount: 800000, payment_date: '2026-04-01', payee: '퍼실리테이터A', receipt_attached: 1, phase: null, active: 1, notes: '' },
    { id: 2, category: 'personnel', item_name: '전문가 자문비 1차', planned_amount: 500000, actual_amount: 500000, payment_date: '2026-04-15', payee: '치매전문가', receipt_attached: 1, phase: null, active: 1, notes: '' },
    { id: 3, category: 'personnel', item_name: '전문가 자문비 2차', planned_amount: 500000, actual_amount: 0, payment_date: null, payee: '치매전문가', receipt_attached: 0, phase: null, active: 1, notes: '' },
    { id: 4, category: 'activity', item_name: '활동가 교통비 (1~2월)', planned_amount: 360000, actual_amount: 240000, payment_date: '2026-03-31', payee: '활동가', receipt_attached: 1, phase: null, active: 1, notes: '' },
    { id: 5, category: 'activity', item_name: '대상자 참여 사례비', planned_amount: 600000, actual_amount: 400000, payment_date: '2026-04-30', payee: '참여자', receipt_attached: 1, phase: null, active: 1, notes: '' },
    { id: 6, category: 'workshop', item_name: '장소 대관비', planned_amount: 400000, actual_amount: 300000, payment_date: '2026-04-20', payee: '대구사회복지관', receipt_attached: 1, phase: null, active: 1, notes: '' },
    { id: 7, category: 'workshop', item_name: '재료비', planned_amount: 200000, actual_amount: 120000, payment_date: '2026-04-25', payee: '문구점', receipt_attached: 1, phase: null, active: 1, notes: '' },
    { id: 8, category: 'workshop', item_name: '다과비', planned_amount: 150000, actual_amount: 80000, payment_date: '2026-04-25', payee: '카페', receipt_attached: 1, phase: null, active: 1, notes: '' },
    { id: 9, category: 'travel', item_name: '현장방문 교통비', planned_amount: 200000, actual_amount: 150000, payment_date: '2026-04-10', payee: '택시회사', receipt_attached: 1, phase: null, active: 1, notes: '' },
    { id: 10, category: 'printing', item_name: '가이드북 인쇄', planned_amount: 300000, actual_amount: 0, payment_date: null, payee: '인쇄소', receipt_attached: 0, phase: null, active: 1, notes: '' },
    { id: 11, category: 'printing', item_name: '홍보물 제작', planned_amount: 200000, actual_amount: 0, payment_date: null, payee: '디자인업체', receipt_attached: 0, phase: null, active: 1, notes: '' },
    { id: 12, category: 'misc', item_name: '소모품비', planned_amount: 100000, actual_amount: 45000, payment_date: '2026-04-05', payee: '문구점', receipt_attached: 1, phase: null, active: 1, notes: '' },
  ] as const;

  const insertBudget = db.prepare(`
    INSERT OR IGNORE INTO budget_items (
      id, category, item_name, planned_amount, actual_amount,
      payment_date, payee, receipt_attached, phase, active, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  budgets.forEach((budget) => {
    insertBudget.run(
      budget.id,
      budget.category,
      budget.item_name,
      budget.planned_amount,
      budget.actual_amount,
      budget.payment_date,
      budget.payee,
      budget.receipt_attached,
      budget.phase,
      budget.active,
      budget.notes
    );
  });

  const promotions = [
    { id: 1, channel: 'sns_instagram', title: '리빙랩 킥오프 현장', published_date: '2026-03-28', phase: 1, reach_count: 520, url: 'https://instagram.com/p/example1', status: 'completed', notes: '' },
    { id: 2, channel: 'sns_instagram', title: '치매안심센터 현장방문 스케치', published_date: '2026-04-10', phase: 2, reach_count: 380, url: 'https://instagram.com/p/example2', status: 'completed', notes: '' },
    { id: 3, channel: 'press_release', title: '소이랩-치매안심센터 협력', published_date: '2026-03-20', phase: 1, reach_count: 1200, url: 'https://news.example.com/livinglab', status: 'completed', notes: '' },
    { id: 4, channel: 'newsletter', title: '리빙랩 1개월 활동 소식', published_date: '2026-04-30', phase: 2, reach_count: 230, url: 'https://newsletter.example.com/livinglab', status: 'completed', notes: '' },
    { id: 5, channel: 'video', title: '리빙랩 소개 영상', published_date: '2026-03-15', phase: 1, reach_count: 890, url: 'https://youtube.com/watch?v=livinglab', status: 'completed', notes: '' },
  ] as const;

  const insertPromotion = db.prepare(`
    INSERT OR IGNORE INTO promotion_records (
      id, channel, title, published_date, phase, reach_count, url, status, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  promotions.forEach((promotion) => {
    insertPromotion.run(
      promotion.id,
      promotion.channel,
      promotion.title,
      promotion.published_date,
      promotion.phase,
      promotion.reach_count,
      promotion.url,
      promotion.status,
      promotion.notes
    );
  });

  seeded = true;
}

if (/src[\\/]+lib[\\/]+seed\.(ts|js)$/.test(process.argv[1] ?? '')) {
  seedDb();
}
