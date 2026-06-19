# Travel Payment Advisor MVP 구현 완료보고서

## 결과

- 상태: 구현 완료, Strong Mode 검토 대기
- 브랜치: `codex/2026_06_19-travel-payment-advisor-mvp`
- 범위: 일본/JPY, Travel Wallet, Toss Bank, Naver Pay 해외 QR, 아시아나 신한카드 Air 1.5
- 배포: GitHub Pages 워크플로만 구성했으며 push·PR·실제 배포는 수행하지 않음
- 기존 확정 계획서는 수정하지 않음

## 구현 요약

1. Vite + React + TypeScript 정적 PWA와 GitHub Pages base path를 구성했다.
2. 날짜 제한·공식 출처·확인일을 가진 데이터 규칙과 순수 비교 엔진을 구현했다.
3. 모바일 입력, 고급 혜택 설정, 추천·차선·차이, 네 수단 순위와 상세 내역을 구현했다.
4. 버전형 `localStorage`, 7일 기록 정리, JSON 내보내기, 2단계 전체 초기화를 구현했다.
5. 서비스 워커 앱 셸 캐시, 설치용 아이콘, GitHub Pages Actions 워크플로를 추가했다.

## 계획 대비 실제

| 계획 | 실제 |
|---|---|
| Vite + React + TypeScript | 동일하게 구현 |
| Vitest 순수 계산 엔진 | 엔진 21개, 저장 6개, UI 3개, 환경 1개 테스트 구현 |
| 수동 환율 입력 | 자동 API 없이 JPY·USD/KRW와 선택적 전용 환율 입력 구현 |
| 최근 결과 7일 보관 | 최대 30개 안전 상한과 함께 구현 |
| 모바일 PWA | 320·375·390px, 설치 manifest, 오프라인 재실행 검증 |
| GitHub Pages | workflow만 구성, 사용자 지시에 따라 push·배포하지 않음 |

## 계산 규칙과 공식 재확인

2026-06-19 구현 직전과 최종 QA 직전에 공식 자료를 다시 확인했다.

- Travel Wallet: JPY 매매기준율, 카드 결제 수수료 0% 유지
- Toss Bank: 일본 3%는 2026-06-30 종료, 2026-07-01부터 2%; 2% 공식 확인 기간은 2026-09-30까지
- Naver Pay: 2026-01-01~12-31 신청 후 10%, QR 5천원 한도, 보험 비교 시 1만원
- 신한 Air 1.5: 전월 50만원, 기본·추가 각 1.5마일, 추가 월 2,000마일, Mastercard 1%, 신한 0.18%

신한카드의 기존 직접 URL 두 개가 최종 확인 시 404로 연결되어 같은 공식 사이트의 현재 카드 페이지와 해외이용 계산 안내로 출처 링크를 갱신했다. 확인되지 않은 PayPay 연장 할인과 환율 API는 포함하지 않았다.

## QA 결과

| 검증 | 결과 |
|---|---|
| `npm test` | 통과: 4개 파일, 31개 테스트 |
| `npm run build` | 통과: PWA precache 12개 항목 |
| `git diff --check` | 통과 |
| 브라우저 제목·의미 있는 DOM | 통과 |
| 콘솔 warning/error | 없음 |
| 핵심 비교·순위·최근 기록 | 통과 |
| 결과 상세 펼침 | 통과 |
| JSON 내보내기 코드 경로 | 저장 계층 테스트 통과 |
| 2단계 전체 초기화 | 브라우저 및 UI 테스트 통과 |
| 320·375·390px 가로 넘침 | 없음 |
| 터치 대상 | 보조 버튼 포함 최소 44px, 체크박스는 44px 이상 레이블 행 안에 배치 |
| 오프라인 앱 재실행 | 서버 중단 후 앱·마지막 입력 복원 확인 |
| 오프라인 재계산 | 서버 중단 상태에서 비교·상세 펼침 확인 |

인앱 브라우저 런타임이 Tab 키 입력을 페이지 포커스로 전달하지 않아 자동 탭 순서 실행은 완료하지 못했다. 대신 연결된 레이블, 네이티브 폼 컨트롤과 `details/summary`, `:focus-visible`, `role="alert"`·`aria-live`를 DOM과 코드에서 확인했다. Strong Mode 검토에서 VoiceOver 또는 실제 Safari 키보드 테스트를 권장한다.

## 시각 검증

- 기준: `docs/2026_06_19_mvp-design/mobile-concept.png`
- 구현 캡처: 인앱 브라우저의 데스크톱 및 모바일 결과 화면
- 직접 비교 항목: 첫 화면 위계, 흰 배경·코발트 팔레트, 세로 추천선, 큰 금액 타이포, 순위 원형 마커, 얇은 구분선, 고급 설정, 모바일 재배치
- 첫 화면 문구 차이: 디자인 명세에 기록한 대로 햄버거 대신 `공식 조건` 링크와 개인정보 문구를 사용
- 남은 수정 가능한 시각 불일치: 없음

## 구현 중 이슈와 결정

- 빠른 연속 입력이 오래된 React 상태로 앞선 값을 덮는 문제를 브라우저에서 발견해 함수형 상태 업데이트로 수정했다.
- 초기화 후 확인 UI가 남는 문제를 발견해 초기화와 동시에 확인 상태를 닫도록 수정했다.
- 실제 환율처럼 보이는 기본값을 제공하지 않고 사용자가 확인한 값이 없으면 비교를 거부한다.
- Toss 2%는 현재 공식 확인된 2026-09-30까지만 적용하고 이후에는 0%와 경고를 사용한다.
- PWA 앱 셸은 초기화 대상에서 제외하고 입력·설정·기록만 삭제한다.

## Strong Mode 후속 검토

1. iOS Safari에서 설치, VoiceOver, 실제 날짜 선택기와 키보드 포커스 순서를 확인한다.
2. GitHub 저장소 Pages 설정을 Actions로 지정한 뒤 별도 검토 승인 후 push한다.
3. 배포 당일 Toss 2% 기간 연장과 기타 프로모션 변경을 공식 페이지에서 다시 확인한다.
4. 실제 승인 내역 표본으로 수동 입력 환율과 근사 오차를 점검한다.

## 커밋

- `[designer][p1] define: MVP mobile interface reference`
- `[builder][p2] scaffold: React TypeScript PWA foundation`
- `[engineer][p3] implement: dated payment comparison engine`
- `[frontend][p4] implement: mobile payment recommendation interface`
- `[frontend][p5] implement: local persistence history and data controls`
- `[qa][p6] verify: PWA deployment offline and mobile behavior`
