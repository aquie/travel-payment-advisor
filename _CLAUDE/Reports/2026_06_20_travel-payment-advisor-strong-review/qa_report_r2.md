# Strong Review QA Report — Round 2

- 대상 브랜치: `codex/2026_06_19-travel-payment-advisor-mvp`
- 비교 기준: `main...HEAD`
- 수행일: 2026-06-19~20 (Asia/Seoul)
- 전체 판정: **PASS**

## 검토 범위

확정 계획과 구현 완료보고서를 기준으로 계산 규칙, React/TypeScript 구조,
날짜·금액 경계, 로컬 저장·개인정보, 단위 테스트, PWA 오프라인, iPhone
크기 반응형 UI와 접근성을 검증했다. 기존 계획은 수정하거나 재작성하지 않았다.

## 발견사항과 조치

| 심각도 | 발견사항 | 근거 | 조치 | 결과 |
|---|---|---|---|---|
| P1 | Naver 잔여 한도 입력으로 공식 10,000원 상한 초과 가능 | `src/domain/engine.ts` | 규칙 데이터의 공식 상한을 강제하고 테스트 추가 | PASS |
| P1 | 입력 변경 후 이전 추천이 남음 | `src/App.tsx` | 입력 변경 시 결과·오류 무효화 | PASS |
| P1 | 규칙값이 계산 코드에 분산 | `src/domain/rules.ts`, `src/domain/engine.ts` | 요율·고정 수수료·캐시백·마일 한도를 규칙 데이터로 이동 | PASS |
| P1 | iPhone PWA 헤더 safe area 누락 | `src/styles.css` | 상·좌·우 safe area 적용 | PASS |
| P2 | 존재하지 않는 달력 날짜 허용 | `src/domain/engine.ts` | UTC 구성요소 왕복 검증 추가 | PASS |
| P2 | 유한 입력의 계산 오버플로 | `src/domain/engine.ts` | 모든 숫자 산출물의 유한성 검증 | PASS |
| P2 | 손상된 중첩 저장 문서가 앱을 중단 | `src/storage/localStore.ts` | draft·입력·순위·수치·문자열을 깊게 검증 | PASS |
| P2 | 저장소 접근 거부 시 앱 중단 | `src/storage/localStore.ts` | get/set/remove 실패를 안전하게 격리 | PASS |
| P2 | 환율 시각·stale 경고가 실사용 환율과 불일치 | `QuoteForm.tsx`, `quoteDraft.ts` | 환율별 시각, 24시간 경고, 빈 override 시각 제거 | PASS |
| P2 | 규칙값과 계산 설명 문구 이중 관리 | `rules.ts`, `engine.ts` | 사용자 설명을 규칙값으로 생성 | PASS |
| P2 | reset 확인 전환의 포커스 유실 | `DataManagement.tsx` | 취소 버튼 진입·원래 버튼 복원 | PASS |
| P2 | Actions build job에 배포 권한 포함 | `deploy-pages.yml` | build/deploy job별 최소 권한 분리 | PASS |
| P2 | PWA 경로 계약이 CI에서 미검증 | `scripts/verify-pwa.mjs` | manifest·아이콘·precache·fallback 검사 추가 | PASS |
| P2 | 320px에서 가로 넘침 | `src/styles.css` | `body` 최소 폭 강제 제거 | PASS |
| P2 | 신한 수수료 공식 링크 404 | `src/domain/rules.ts` | 접근 가능한 신한 공식 페이지로 교체 | PASS |

P0 발견사항은 없었다. XSS, 비밀키, 구매 기록 외부 전송, 민감정보 로깅
경로도 발견되지 않았다.

## 자동화 검증

| 검증 | 결과 |
|---|---|
| `npm test` | PASS — 5 files, 46 tests |
| `npm run build` | PASS — TypeScript + Vite production build |
| PWA 생성 | PASS — 12 precache entries |
| `npm run verify:pwa` | PASS |
| `git diff --check` | PASS |
| 독립 구조 재검토 | PASS — 기존 P2 해소 |
| 독립 최종 eval | APPROVE — P0~P2 blocker 없음 |

## 브라우저 QA

대상 흐름: 앱 로드 → 수동 환율·금액 입력 → 비교 → 결과 포커스·기록 확인 →
production 서버 중단 → 오프라인 재실행 → 오프라인 재계산.

| 검사 | 결과 | 증거 |
|---|---|---|
| 페이지 식별 | PASS | 제목 `어떻게 결제할까?`, 예상 URL |
| 빈 화면·오버레이 | PASS | 의미 있는 main/폼/결과 DOM |
| 콘솔 | PASS | warning/error 0 |
| 320/375/390px overflow | PASS | 세 너비 모두 `scrollWidth <= clientWidth` |
| 결과 상호작용 | PASS | 토스뱅크 88,900원, 결과 제목 포커스, 기록 1건 |
| 서버 중단 후 재실행 | PASS | production preview 종료 후 동일 URL reload 성공 |
| 오프라인 재계산 | PASS | 토스뱅크 결과·기록 생성, 콘솔 오류 없음 |

## 남은 비차단 리스크

- 실제 iPhone Safari 설치와 notch 방향 전환은 에뮬레이션이 아니라 실기 확인이 필요하다.
- VoiceOver의 발화 순서는 실제 기기에서 추가 확인을 권장한다.
- 배포 당일에는 날짜 제한 프로모션의 공식 조건을 다시 확인해야 한다.

위 항목은 현재 계획의 정적 PWA·기본 접근성 완료 조건을 막는 구현 결함이
아니며, 배포 전 운영 확인 사항으로 분류한다.
