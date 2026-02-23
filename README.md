# ShiftMate Front

ShiftMate 프론트엔드(Next.js App Router) 프로젝트입니다.  
매장 운영팀의 스케줄/근태/대타 관리 플로우를 웹 UI로 제공합니다.

## 1. 프로젝트 목적

- 외부 사용자가 프론트 구조를 빠르게 이해할 수 있도록 구성
- 도메인 기능(매장, 스케줄, 근태, 대타, 급여)을 화면 흐름으로 연결
- 백엔드 API 응답 변형(중첩 `data`, 필드명 차이)에 대해 프론트에서 방어적으로 파싱

## 2. 기술 스택

- Framework: `Next.js 16` (App Router), `React 19`, `TypeScript`
- Styling: `Tailwind CSS 4`, 공통 UI 컴포넌트(`components/ui/*`)
- API 통신: 내장 `fetch` 기반 커스텀 클라이언트(`lib/api/client.ts`)
- Alert/Modal 보조: `sweetalert2`
- 배포: Docker 이미지 빌드 + GitHub Actions + EC2 배포

## 3. 실행 방법

### 로컬 개발

```bash
npm ci
npm run dev
```

- 기본 접속: `http://localhost:3000`
- 기본 API 서버: `http://localhost:8081` (`NEXT_PUBLIC_API_URL` 미설정 시)

### 프로덕션 빌드

```bash
npm run build
npm run start
```

## 4. 환경 변수

`.env` 파일:

```env
NEXT_PUBLIC_API_URL=http://localhost:8081
```

- `NEXT_PUBLIC_` 접두어이므로 브라우저 번들에 포함됩니다.
- Docker 빌드 시 `build-arg`로도 주입됩니다.

## 5. 디렉터리 구조

```text
shiftmate-front
├── app/                      # App Router 페이지
│   ├── page.tsx              # 랜딩
│   ├── auth/login/page.tsx   # 로그인/회원가입
│   ├── dashboard/page.tsx    # 매장 목록 대시보드
│   ├── wizard/page.tsx       # 매장 생성 위저드
│   ├── profile/page.tsx      # 내 정보/비밀번호/급여
│   └── store/*               # 매장 운영 도메인 화면
├── components/
│   ├── ui/                   # Button, Card, Table, Modal 등 공통 UI
│   ├── layout/               # Header, Sidebar
│   ├── auth/                 # 로그인/회원가입 폼
│   └── domain/               # 스토어/대타/급여/위저드 도메인 컴포넌트
├── lib/
│   ├── api/                  # 도메인별 API 클라이언트
│   └── utils.ts
├── types/                    # 도메인 타입 정의
├── public/
│   └── API 명세서.pdf
└── .github/workflows/deploy.yml
```

## 6. 라우트 맵 (주요 화면)

- `/` : 서비스 소개 랜딩
- `/auth/login` : 로그인/회원가입 토글
- `/dashboard` : 내 매장 목록/상태
- `/wizard` : 매장 생성 5단계 위저드
- `/profile` : 프로필 조회/수정, 비밀번호 변경, 월별 예상 급여
- `/store?storeId=:id` : 매장 주간 로스터(템플릿+스케줄)
- `/store/status?storeId=:id` : 근무 상태(일간/주간)
- `/store/attendance?storeId=:id` : PIN 출퇴근
- `/store/my-schedule?storeId=:id` : 내 주간 근무/대타 요청
- `/store/substitutes?storeId=:id` : 대타 요청/지원/내역
- `/store/requests?storeId=:id` : 관리자 대타 승인/거절/취소
- `/store/staff?storeId=:id` : 직원 목록/초대
- `/store/staff/preferences?storeId=:id&memberId=:memberId` : 직원 선호도 설정
- `/store/schedule?storeId=:id` : 인건비 현황 화면(현재 목업 데이터)
- `/store/open-shifts?storeId=:id` : 오픈시프트 화면(현재 목업 데이터)

## 7. API 레이어 구조

`lib/api/client.ts`

- 공통 베이스 URL 관리
- `Authorization: Bearer <token>` 자동 부착
- JSON/텍스트 응답 분기 처리
- 표준 `ApiResponse<T>` 형태로 성공/실패 반환

도메인별 모듈:

- `authApi`: 로그인/회원가입/로그아웃/내 정보/비밀번호 변경
- `storeApi`: 매장, 멤버, 템플릿, 스케줄 생성/조회/삭제, 사업자 검증
- `attendanceApi`: 출퇴근 처리, 일간/주간/내 주간 근태
- `substituteApi`: 대타 요청/지원/승인/거절/취소 전체 플로우
- `scheduleApi`: 내 시프트/대타 요청 생성 보조, 오픈시프트(기존 경로)
- `salaryApi`: 월 목록, 월별 예상 급여 집계
- `userApi`: 이메일 기반 사용자 조회, 내 매장 프로필 조회

## 8. 상태 관리/인증 규칙

- 전역 상태 라이브러리 없이 페이지 단위 `useState`, `useEffect`, `useMemo` 사용
- 인증 토큰 저장 키:
  - `auth_token`
  - `refresh_token`
  - `auth_user_name`
- 여러 화면에서 JWT payload를 직접 decode하여 사용자 식별/표시명 fallback 처리
- 대부분의 매장 화면은 `storeId`를 쿼리 스트링으로 전달받아 동작

## 9. 컴포넌트 설계 원칙

- `components/ui/*`: 도메인 독립적인 재사용 컴포넌트
- `components/domain/*`: 업무 도메인 전용 컴포넌트
- `components/layout/*`: 헤더/사이드바 등 공통 레이아웃
- Tailwind 유틸 + `cn()`(`clsx` + `tailwind-merge`)로 클래스 병합

## 10. 현재 구현 상태

실 API 연동 중심:

- 인증(로그인/회원가입/로그아웃)
- 매장 조회 및 위저드 기반 생성
- 근태(출퇴근, 일간/주간 조회)
- 대타 요청/지원/승인/거절/취소
- 직원 조회/초대 및 선호도 저장
- 급여 월별 조회

목업 또는 부분 구현:

- `/store/open-shifts` : 목업 배열 기반 (TODO 주석 존재)
- `/store/schedule` : 샘플 인건비 데이터 기반
- 일부 화면에서 `window.alert/confirm` 기반 UX 사용(추후 통합 가능)

## 11. 배포 파이프라인

`.github/workflows/deploy.yml`

- 트리거: `main` 브랜치 push 또는 수동 실행
- 단계:
  - DockerHub 로그인
  - 이미지 빌드/푸시 (`latest`, `sha` 태그)
  - EC2 SSH 접속 후 기존 컨테이너 교체 실행
- 런타임 환경 파일: 서버 내 `/home/ubuntu/shiftmate-front/.env` 참조

## 12. 함께 보면 좋은 문서

- API 명세: `public/API 명세서.pdf`
- 백엔드 레포/문서: 상위 프로젝트의 `ShiftMate_Back`

---

문의/협업 시에는 이 README 기준으로 **화면 경로 + API 모듈 경로 + storeId 파라미터**를 함께 공유하면 커뮤니케이션 비용을 줄일 수 있습니다.
