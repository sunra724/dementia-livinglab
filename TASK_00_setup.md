# TASK_00 — 레포 초기화 (로컬에서 한 번만 실행)

> ⚠️ 이 태스크는 **Codex가 아닌 로컬 터미널**에서 직접 실행해.
> 완료 후 GitHub에 push → Codex 연동 → TASK_01부터 Codex에서 진행.

---

## 실행 순서

### Step 1. 프로젝트 생성

```bash
npx create-next-app@latest dementia-livinglab \
  --typescript --tailwind --eslint --app --src-dir --no-import-alias
cd dementia-livinglab
```

### Step 2. 패키지 설치

```bash
npm install better-sqlite3 recharts date-fns lucide-react swr
npm install -D @types/better-sqlite3 tsx
```

### Step 3. 디렉토리 및 플레이스홀더 파일 생성

```bash
# 앱 라우트
mkdir -p src/app/participants
mkdir -p src/app/workshops
mkdir -p src/app/kpi
mkdir -p src/app/budget
mkdir -p src/app/promotion
mkdir -p src/app/guidebook
mkdir -p src/app/admin/participants
mkdir -p src/app/admin/workshops
mkdir -p src/app/admin/kpi
mkdir -p src/app/admin/budget
mkdir -p src/app/admin/promotion
mkdir -p src/app/admin/login
mkdir -p src/app/api/participants
mkdir -p src/app/api/workshops
mkdir -p src/app/api/kpi
mkdir -p src/app/api/budget
mkdir -p src/app/api/promotion
mkdir -p src/app/api/guidebook
mkdir -p src/app/api/export

# 컴포넌트
mkdir -p src/components/layout
mkdir -p src/components/dashboard
mkdir -p src/components/timeline
mkdir -p src/components/guidebook
mkdir -p src/components/forms

# 라이브러리
mkdir -p src/lib

# 데이터
mkdir -p data
```

```bash
# 플레이스홀더 page.tsx 일괄 생성
for route in participants workshops kpi budget promotion guidebook; do
  echo "export default function Page() { return <h1>${route}</h1>; }" \
    > src/app/${route}/page.tsx
done

for route in participants workshops kpi budget promotion; do
  echo "export default function Page() { return <h1>admin/${route}</h1>; }" \
    > src/app/admin/${route}/page.tsx
done

# API route 플레이스홀더
for api in participants workshops kpi budget promotion guidebook export; do
  echo "import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.json({}); }" \
    > src/app/api/${api}/route.ts
done
```

### Step 4. Tailwind 색상 설정

`tailwind.config.ts` 파일을 열어 `theme.extend.colors`에 아래 추가:

```typescript
colors: {
  phase: {
    p1: '#6366f1',
    p2: '#3b82f6',
    p3: '#f59e0b',
    p4: '#10b981',
    p5: '#ef4444',
    p6: '#8b5cf6',
  },
  role: {
    activist:    '#0ea5e9',
    institution: '#f97316',
    subject:     '#a855f7',
  },
  admin: {
    50:  '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
}
```

### Step 5. .gitignore 수정

`.gitignore` 파일에 아래 추가:
```
data/*.db
.env.local
```

### Step 6. .env.local 생성

```bash
echo "ADMIN_TOKEN=livinglab2026" > .env.local
```

### Step 7. package.json scripts 추가

`package.json`의 `"scripts"` 항목에 추가:
```json
"db:seed":  "tsx src/lib/seed.ts",
"db:reset": "rm -f data/livinglab.db && tsx src/lib/seed.ts"
```

### Step 8. AGENTS.md 복사

`AGENTS.md` 파일을 프로젝트 루트에 복사해둬.

### Step 9. 빌드 확인

```bash
npm run dev
# http://localhost:3000 접속 — 빈 페이지면 OK
```

### Step 10. GitHub push

```bash
git init
git add .
git commit -m "init: project scaffold"
git remote add origin https://github.com/soilabcoop/dementia-livinglab.git
git push -u origin main
```

---

## 완료 기준

- [ ] `npm run dev` 에러 없이 실행
- [ ] GitHub 레포에 코드 push 완료
- [ ] Codex에서 레포 연동 확인
- [ ] 이후 TASK_01부터 Codex에서 진행
