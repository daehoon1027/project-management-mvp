# Prisma + PostgreSQL 아키텍처 전환 가이드

## 1. 현재 프로젝트 상태 요약

이 프로젝트는 현재 아래 구조로 동작한다.

- 프레임워크: `Next.js 15` + `app router`
- 상태 관리: `zustand` + `persist(localStorage)`
- 데이터 소스: `lib/sample-data.ts`, `lib/mock-company-data.ts`
- UI 기준 데이터 타입: `types/index.ts`
- Prisma 상태: `prisma/schema.prisma`는 존재하지만 실제 앱 읽기/쓰기에는 연결되지 않음
- DB provider: 현재는 `sqlite`

즉, 지금 앱은 "Prisma schema가 일부 준비된 프론트 중심 MVP"이고, 아직 "서버 중심 데이터 아키텍처"로 넘어가지는 않은 상태다.

이 앱에 맞는 전환 목표는 아래다.

- `zustand`를 "정답 데이터 저장소"에서 "UI 상태 저장소"로 축소
- 프로젝트/태스크/승인/댓글/알림을 `PostgreSQL + Prisma`로 이동
- `app/page.tsx`에 몰린 화면 조립을 feature 단위로 분리
- Prisma 모델을 그대로 클라이언트에 넘기지 않고, 화면용 DTO를 별도로 둠

---

## 2. 이 앱에 맞는 권장 아키텍처

### 핵심 원칙

이 프로젝트는 단순 블로그가 아니라 아래 특성이 있다.

- 프로젝트 트리 계층 구조
- 태스크와 서브태스크
- 승인 상태
- 부서/담당자
- 활동 로그/댓글/알림
- 대시보드/보드/타임라인 등 여러 화면 표현

그래서 추천 구조는 `계층형 프로젝트 관리 도메인 + 서버 우선 아키텍처`다.

### 책임 분리

#### 1) DB 계층

Prisma와 PostgreSQL만 담당한다.

- Prisma schema
- migration
- seed
- Prisma client singleton

#### 2) Repository 계층

Prisma query를 모은다.

- `projectRepository`
- `taskRepository`
- `userRepository`
- `notificationRepository`

여기서는 "DB에서 어떻게 읽고 쓰는가"만 책임진다.

#### 3) Service 계층

비즈니스 규칙을 담당한다.

- 프로젝트 depth 제한
- 프로젝트 진행률 rollup
- task 완료 시 status 동기화
- 승인 필요 여부 판단
- 활동 로그 생성
- 알림 생성

즉, 지금 `store/use-project-store.ts` 안에 들어 있는 규칙들이 대부분 여기로 이동해야 한다.

#### 4) Server Action / Query 계층

Next.js 앱 내부에서 화면과 서버를 연결한다.

- 생성/수정/삭제: `server actions`
- 상세 조회/목록 조회: 서버 함수(query) 또는 서버 컴포넌트

이 앱은 외부 공개 API가 핵심이 아니므로, 기본은 `Server Actions` 중심이 가장 잘 맞는다.

`Route Handler(app/api/*)`는 아래 경우에만 추가한다.

- 외부 시스템 연동
- CSV 다운로드 전용 API
- 웹훅
- 모바일/외부 클라이언트에서 직접 호출해야 하는 엔드포인트

#### 5) Client UI 계층

클라이언트는 UI 상호작용만 담당한다.

- 모달 열기/닫기
- 필터 상태
- 선택된 프로젝트 ID
- 보드/리스트/타임라인 탭 상태
- 낙관적 UI가 필요한 임시 상태

중요: `projects`, `tasks` 전체를 더 이상 `zustand`에 영구 저장하지 않는다.

---

## 3. 이 프로젝트에 맞는 권장 폴더 구조

아래 구조를 추천한다.

```text
app/
  layout.tsx
  page.tsx
  globals.css
  api/
    export/
      tasks/
        route.ts

features/
  project-management/
    components/
      dashboard/
        dashboard.tsx
      project/
        project-detail.tsx
        project-form.tsx
        project-tree.tsx
      task/
        task-board.tsx
        task-detail-drawer.tsx
        task-form.tsx
        task-timeline.tsx
        today-focus.tsx
      system/
        system-foundation-panel.tsx
    server/
      actions/
        project-actions.ts
        task-actions.ts
        comment-actions.ts
      queries/
        get-dashboard-data.ts
        get-project-tree.ts
        get-project-detail.ts
        get-task-detail.ts
      dto/
        project.dto.ts
        task.dto.ts
      mappers/
        project-mapper.ts
        task-mapper.ts
      services/
        project.service.ts
        task.service.ts
        notification.service.ts
        activity-log.service.ts
      validators/
        project.validator.ts
        task.validator.ts
    hooks/
      use-project-filters.ts
      use-task-detail-drawer.ts
    store/
      use-project-ui-store.ts
    types/
      project-management.types.ts

server/
  db/
    prisma.ts
  repositories/
    department.repository.ts
    project.repository.ts
    task.repository.ts
    user.repository.ts
    comment.repository.ts
    notification.repository.ts
    activity-log.repository.ts
  auth/
    current-user.ts
  permissions/
    project-permissions.ts
    task-permissions.ts

prisma/
  schema.prisma
  migrations/
  seeds/
    seed.ts

lib/
  constants/
    project.ts
    task.ts
  formatters/
    date.ts
    progress.ts
  utils/
    cn.ts
    csv.ts

types/
  api.ts
  common.ts
```

### 왜 이 구조가 이 앱에 맞는가

- 지금 `components/`, `lib/`, `utils/`, `store/`에 흩어진 책임을 정리할 수 있다.
- `project-management`라는 하나의 핵심 도메인 아래에 화면과 서버 로직을 같이 묶을 수 있다.
- 지금처럼 `page.tsx`와 `zustand store`에 업무 규칙이 몰리는 것을 막을 수 있다.
- 나중에 `approval`, `attachment`, `notification` 기능이 커져도 확장하기 쉽다.

---

## 4. 상태별로 어디서 무엇을 해야 하는가

아래는 실제 작업 순서다.

## Phase 0. 작업 시작 전 상태

### 시작 위치

- 작업 디렉터리: 프로젝트 루트
- 현재 파일 기준: `C:\Users\plus0\OneDrive\바탕 화면\AI\프로젝트 관리`

### 이 상태에서 확인할 것

- `node_modules` 설치 여부
- `.env` 파일 존재 여부
- PostgreSQL 준비 여부
- Prisma 패키지 설치 여부

### 목표 상태

- 앱은 아직 mock data 기반이어도 괜찮다
- 먼저 DB 연결 기반만 준비한다

---

## Phase 1. PostgreSQL + Prisma 런타임 준비

### 여기서 해야 하는 일

1. PostgreSQL 데이터베이스를 준비한다.
2. `.env`에 `DATABASE_URL`을 넣는다.
3. Prisma 관련 패키지를 설치한다.
4. `schema.prisma`의 datasource를 postgres로 바꾼다.

### 권장 `.env`

```env
DATABASE_URL="postgresql://postgres:비밀번호@localhost:5432/project_management?schema=public"
```

### 필요한 패키지

```powershell
npm install @prisma/client
npm install -D prisma
```

### `schema.prisma`에서 바꿔야 할 것

현재:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

목표:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 이 단계 완료 기준

- `npx prisma generate`가 성공한다
- `npx prisma validate`가 성공한다

---

## Phase 2. Prisma 모델 정리

현재 schema는 꽤 잘 시작돼 있지만, 이 앱 기준으로 아래 관점에서 정리해야 한다.

### 유지해도 좋은 모델

- `Department`
- `User`
- `Project`
- `Task`
- `ChecklistItem`
- `ApprovalStep`
- `Comment`
- `ActivityLog`

### 다시 점검할 포인트

#### 1) Attachment 모델

현재 schema 일부에서 relation은 보이지만 실제 모델 정의가 완결되지 않았는지 확인이 필요하다.

- `Project.attachments`
- `Task.attachments`

이 부분은 실제 `Attachment` 모델과 relation이 schema 내에 완전히 정의돼 있어야 한다.

#### 2) Notification relation

`User.notifications`와 `Notification[]` relation이 명확한지 다시 확인해야 한다.

#### 3) approval 표현 방식

현재 UI 타입은 `approval: { status, approverId, approvedAt }`이고 DB는 `ApprovalStep[]`다.

이건 좋은 방향이다. 다만 화면으로 내려줄 때는 아래처럼 변환해야 한다.

- DB: `ApprovalStep[]`
- UI DTO: `approvalSummary`

즉, Prisma 모델과 화면 타입을 1:1로 맞추지 말고 mapper를 둬야 한다.

#### 4) Task.assignee

현재 UI 타입에는 `assignee: string`와 `assigneeId`가 같이 있다.

DB 기준 정답값은 `assigneeId`만 두고, 화면용으로는 mapper에서 아래처럼 만든다.

- `assigneeId`: DB 필드
- `assigneeName`: DTO 필드

지금의 `assignee: string`는 서버 전환 시 제거하는 편이 안전하다.

---

## Phase 3. 서버 공용 인프라 만들기

이 단계부터는 실제 코드 구조를 만든다.

### 만들어야 하는 파일

#### 1) Prisma client singleton

파일:

- `server/db/prisma.ts`

역할:

- 개발 환경 hot reload에서 Prisma client가 중복 생성되지 않게 관리

#### 2) repository 기본 뼈대

예시 파일:

- `server/repositories/project.repository.ts`
- `server/repositories/task.repository.ts`

역할:

- Prisma query 집중 관리

예:

- 프로젝트 트리 조회
- 프로젝트 단건 조회
- 프로젝트 생성/수정/삭제
- 프로젝트별 task 조회
- task 생성/수정/상태 변경

#### 3) permission 함수

예시 파일:

- `server/permissions/project-permissions.ts`
- `server/permissions/task-permissions.ts`

역할:

- 누가 수정 가능한지
- 승인 권한이 있는지
- 부서 기준 접근 제한을 둘지

현재는 auth가 없어도 함수 뼈대는 미리 두는 게 좋다.

---

## Phase 4. 비즈니스 로직을 store에서 service로 이동

이 단계가 가장 중요하다.

현재 `store/use-project-store.ts` 안에는 아래가 섞여 있다.

- 데이터 저장
- 화면 상태
- 도메인 규칙
- 로그 생성
- 알림 생성
- 프로젝트 진행률 계산

이걸 아래처럼 분리한다.

### `project.service.ts`

담당:

- 프로젝트 생성
- depth 제한
- 하위 프로젝트 생성 규칙
- 프로젝트 복제
- 프로젝트 아카이브/복구
- 프로젝트 진행률 재계산 트리거

### `task.service.ts`

담당:

- task 생성/수정
- 완료 상태와 status 동기화
- subtask 생성
- checklist 처리
- due date 관련 규칙

### `activity-log.service.ts`

담당:

- 생성/수정/삭제 로그 기록

### `notification.service.ts`

담당:

- 담당자 변경 알림
- 승인 요청 알림
- due soon / overdue 알림

중요: `lib/progress.ts`의 계산 로직은 service 또는 formatter 레이어에서 재사용하되, 최종 저장은 서버에서 처리한다.

---

## Phase 5. 페이지 구조 변경

현재 `app/page.tsx`는 클라이언트 컴포넌트이며, 너무 많은 책임을 가진다.

### 목표

- `app/page.tsx`는 서버 컴포넌트로 바꾼다
- 초기 데이터는 서버에서 읽는다
- 상호작용이 많은 부분만 클라이언트 컴포넌트로 남긴다

### 권장 방식

#### `app/page.tsx`

담당:

- 서버에서 대시보드 초기 데이터 조회
- `ProjectManagementScreen` 같은 feature entry 컴포넌트 렌더링

#### `features/project-management/components/...`

담당:

- 실제 UI 렌더링

#### `features/project-management/server/queries/...`

담당:

- 화면에 필요한 조합 데이터를 서버에서 조회

예:

- 프로젝트 트리 + 선택 프로젝트 + task 목록
- dashboard 집계
- today focus 목록

---

## Phase 6. zustand 역할 축소

전환 후에도 zustand를 완전히 없앨 필요는 없다.

하지만 저장 대상은 바뀌어야 한다.

### zustand에 남겨도 되는 것

- 선택된 프로젝트 ID
- 펼쳐진 프로젝트 ID 목록
- task 필터
- drawer open 상태
- theme

### zustand에서 제거해야 하는 것

- `projects`
- `tasks`
- `comments`
- `notifications`
- `activityLogs`
- `users`
- `departments`

이 데이터는 서버 조회 결과를 props 또는 서버 fetch 결과로 받아야 한다.

---

## 5. 추천 구현 순서

가장 안전한 순서는 아래다.

### 1단계. DB 연결만 먼저 붙이기

목표:

- PostgreSQL 연결
- Prisma client 생성
- migration 성공

이때는 아직 화면을 바꾸지 않아도 된다.

### 2단계. Seed 데이터 작성

목표:

- 현재 `sample-data.ts`와 `mock-company-data.ts` 기반의 초기 데이터를 DB seed로 옮기기

이 단계가 중요하다. 그래야 UI를 거의 안 바꿔도 기존 화면을 DB 기반으로 테스트할 수 있다.

### 3단계. 읽기 전용 조회부터 서버로 이동

우선순위:

1. 프로젝트 트리 조회
2. 선택 프로젝트 상세 조회
3. 프로젝트별 task 목록 조회
4. dashboard 집계

이 단계에서는 create/update/delete는 아직 zustand로 남겨도 된다.

### 4단계. 프로젝트/태스크 생성 수정 삭제 전환

우선순위:

1. 프로젝트 생성/수정
2. task 생성/수정
3. task 상태 변경
4. subtask
5. checklist

### 5단계. 부가 기능 전환

마지막으로 옮긴다.

- 댓글
- 승인
- 알림
- 활동 로그
- CSV export

---

## 6. 내가 할 수 있는 것 / 직접 해야 하는 것

## 내가 바로 할 수 있는 것

아래는 이 저장소 안에서 바로 작업 가능하다.

1. `schema.prisma`를 PostgreSQL 기준으로 정리
2. Prisma 패키지/seed/script 구조에 맞는 폴더 생성
3. `server/db/prisma.ts` 생성
4. repository/service/action/query 기본 골격 생성
5. `components`를 `features/project-management` 구조로 정리
6. `zustand store`를 UI 상태 store로 축소하는 리팩터링
7. `sample-data`를 `prisma/seeds/seed.ts`로 옮길 수 있게 변환
8. `app/page.tsx`를 서버 중심 구조로 재구성

## 직접 해야 할 가능성이 높은 것

아래는 환경/계정/외부 설치 때문에 직접 해야 하거나 승인 후 진행해야 한다.

1. PostgreSQL 설치 또는 사용 가능한 DB 제공
2. 실제 DB 계정/비밀번호 결정
3. `.env`에 실사용 `DATABASE_URL` 입력
4. 운영/개발 DB 분리 여부 결정
5. 배포 환경에서 DB 연결 정보 등록
6. 인증 체계 도입 여부 결정

### 내가 대신 도와줄 수 있는 방식

- 사용 중인 PostgreSQL이 로컬인지, Supabase/Neon/RDS 같은 외부 서비스인지 알려주면 그 기준으로 `DATABASE_URL`, migration, 배포 전략까지 맞춰서 잡아줄 수 있다.

---

## 7. 지금 바로 추천하는 실제 실행 순서

이 프로젝트에서는 아래 순서가 가장 현실적이다.

### Step 1. 먼저 내가 해도 되는 범위

추천 작업:

- Prisma 패키지 연결 전제하에 구조 정리
- `schema.prisma`를 PostgreSQL 기준으로 수정
- `server/`, `features/project-management/server/` 폴더 구조 생성
- 최소 `prisma.ts`, repository, service 뼈대 생성

### Step 2. 그 다음 직접 준비해야 하는 환경

해야 할 것:

- PostgreSQL 준비
- `.env` 설정

### Step 3. 환경이 준비되면 내가 이어서 할 것

추천 작업:

- migration
- seed
- read path 전환
- create/update/delete 전환

---

## 8. 지금 이 프로젝트에 대한 최종 권장안

이 프로젝트는 아래 방식이 가장 맞다.

- DB: `PostgreSQL`
- ORM: `Prisma`
- 앱 연결 방식: `Next.js Server Actions + Server Queries`
- UI 상태: `zustand`
- 비즈니스 로직 위치: `features/project-management/server/services`
- DB 접근 위치: `server/repositories`
- 화면 타입: `DTO + mapper`

즉, 방향은 이 한 줄로 정리된다.

`현재의 zustand 중심 프론트 앱`을 `Prisma/PostgreSQL 기반 서버 중심 앱`으로 바꾸되, `zustand`는 UI 상태만 남기는 구조로 전환한다.

---

## 9. 다음 단계 제안

바로 구현을 시작한다면 첫 작업 묶음은 아래가 가장 좋다.

1. `schema.prisma` PostgreSQL 전환
2. Prisma client 설치 및 생성
3. `server/db/prisma.ts` 추가
4. `project/task repository + service + actions` 뼈대 추가
5. `app/page.tsx` 데이터를 서버에서 읽는 구조 초안으로 변경

이 다섯 개를 먼저 끝내면, 이후부터는 기능별로 안정적으로 옮길 수 있다.
