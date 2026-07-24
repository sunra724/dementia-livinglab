import Link from 'next/link';

const policySections = [
  {
    title: '1. 처리 목적과 공개 원칙',
    paragraphs: [
      '협동조합 소이랩은 치매돌봄 리빙랩의 운영, 참여 동의 확인, 안전관리, 성과 집계와 사업 보고를 위해 필요한 범위에서만 정보를 처리합니다.',
      '외부 공개 화면에는 개인 단위 원자료를 제공하지 않습니다. 참가자 이름·연락처, 대상자 코드·치매 단계, 워크시트 원문, 안전 기록, 사진과 지급 대상 정보는 관리자 인증 후에만 접근할 수 있습니다.',
    ],
  },
  {
    title: '2. 처리하는 정보',
    paragraphs: [
      '공개 방문: 접속 시각, IP 주소, 브라우저·기기 정보, 요청 경로 등 보안 및 장애 대응에 필요한 접속 로그가 호스팅 과정에서 생성될 수 있습니다.',
      '워크시트 제출: 활동명 또는 역할 코드, 소속 그룹, 역할, 워크시트 내용, 개인정보·윤리 안내 확인 시각을 처리합니다. 실명, 연락처, 주소, 얼굴 사진, 대상자 코드와 직접적인 건강정보는 입력하지 않도록 안내합니다.',
      '관리자 업무: 별도 동의를 받은 범위에서 참가자·기관 연락 정보, 익명 대상자 코드, 참여 동의 여부와 치매 단계 등 사업 운영 자료를 처리할 수 있습니다.',
    ],
  },
  {
    title: '3. 보유 및 파기',
    paragraphs: [
      '워크시트와 사업 운영 기록은 사업 수행 및 결과 확인을 위해 사업 종료 후 1년까지 보유한 뒤 복구하기 어려운 방법으로 삭제합니다. 법령, 보조금 정산 또는 계약에서 더 긴 보관을 요구하는 자료는 해당 기간 동안 분리 보관합니다.',
      '민감정보 처리시스템의 관리자 접속·조회·수정·다운로드 감사 기록은 안전성 확보조치 기준에 따라 2년 동안 보관한 뒤 삭제합니다. 감사 기록에는 원문 개인정보 대신 세션과 접속 IP의 비가역 지문을 저장합니다.',
      '애플리케이션은 공개 방문자의 접속 로그를 별도 데이터베이스에 저장하지 않습니다. 호스팅·보안 서비스에서 생성되는 로그는 서비스 설정과 계약상 보관 기간이 끝나면 삭제됩니다.',
    ],
  },
  {
    title: '4. 민감정보와 사진',
    paragraphs: [
      '치매 단계와 같은 건강정보는 민감정보로 취급합니다. 당사자의 별도 동의나 법률상 근거가 확인된 경우에만 최소한으로 수집하고, 공개 화면에는 개인 단위로 표시하지 않습니다.',
      '얼굴이나 생활공간이 포함된 현장 사진은 촬영·활용 동의를 확인한 경우에만 관리자 영역에서 관리합니다. 공개 사용이 필요하면 목적과 매체를 특정한 별도 동의를 다시 확인합니다.',
    ],
  },
  {
    title: '5. 처리위탁·국외 처리',
    paragraphs: [
      '서비스 운영을 위해 Vercel(웹 호스팅·보안 로그), Supabase(서울 리전 데이터베이스), Anthropic(관리자 요청 시 비식별 집계 기반 보고서 생성) 서비스를 사용합니다.',
      'Vercel의 글로벌 인프라에서 접속 로그가 국외 처리될 수 있습니다. Anthropic에는 개인 단위 자료를 전송하지 않도록 집계 데이터만 사용합니다. 위탁 서비스 또는 처리 지역이 바뀌면 이 안내를 갱신합니다.',
    ],
  },
  {
    title: '6. 이용자의 권리와 문의',
    paragraphs: [
      '정보주체는 본인 정보의 열람, 정정, 삭제, 처리정지와 동의 철회를 요청할 수 있습니다. 본인 확인 후 법령상 예외가 없는 한 지체 없이 처리합니다.',
      '개인정보 보호 문의: 협동조합 소이랩 · 053-941-9003 · soilabcoop@gmail.com · 대구광역시 북구 대현로 3, 2층',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 pt-20 md:pt-10">
      <header className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold text-blue-600">개인정보·윤리 안내</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">개인정보 처리 안내</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          치매돌봄 리빙랩은 건강정보와 돌봄 경험을 다루는 특성을 고려해 공개 자료와 내부
          운영 자료를 분리하고, 소수집단이 다시 식별되지 않도록 개인 단위 정보의 외부 공개를
          제한합니다.
        </p>
        <p className="mt-3 text-xs text-slate-500">시행·최종 수정: 2026년 7월 24일</p>
      </header>

      <div className="space-y-5">
        {policySections.map((section) => (
          <section
            key={section.title}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
        <h2 className="font-semibold">공개 전 운영 확인 사항</h2>
        <p className="mt-2">
          이 안내는 대시보드의 현재 처리 흐름을 기준으로 작성했습니다. 실제 참여 동의서,
          보조사업 협약과 기관별 기록물 보존 기준이 더 엄격한 경우 해당 기준을 우선 적용합니다.
        </p>
      </section>

      <div className="flex flex-wrap gap-3 pb-10">
        <Link
          href="/"
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
        >
          대시보드로 돌아가기
        </Link>
        <a
          href="https://www.soilabcoop.kr/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
        >
          협동조합 소이랩 공식 사이트
        </a>
      </div>
    </div>
  );
}
