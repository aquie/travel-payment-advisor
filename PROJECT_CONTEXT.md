# Travel Payment Advisor — Project Context

## Goal

Build an installable mobile-first PWA that recommends the most economical
payment method for an overseas purchase. The user selects the destination and
enters the local-currency amount; the app compares expected KRW cost, fees,
cashback, and optionally the value of airline miles.

The initial target is travel in Japan after 2026-06-30.

## Initial payment methods

- Travel Wallet
- Toss Bank debit card connected to a foreign-currency account
- Naver Pay overseas QR payment
- Asiana Shinhan Card Air 1.5 (Mastercard)

## Confirmed comparison rules

### Travel Wallet

- JPY top-up uses the base exchange rate.
- Card payment fee is 0%.
- Treat this as the simple cash-cost baseline.

Official terms:
https://www.travel-wallet.com/ko/docs/terms/d54a9c60-a009-4089-baa4-346320ddadd9

### Toss Bank

- The special 3% Japan cashback ends on 2026-06-30.
- From 2026-07-01, use the normal 2% overseas cashback unless the terms change.
- International brand fee: 1%.
- Overseas service fee: USD 0.50 per transaction.
- Simplified net adjustment versus the underlying exchange rate:
  `purchase * (1 + 1% - 2%) + USD 0.50`.
- Toss and Travel Wallet break even at approximately USD 50 per transaction.
  Below that, Travel Wallet is normally better; above that, Toss is normally
  better by up to roughly 1%.

Official benefits:
https://www.tossbank.com/card/benefits

### Naver Pay overseas QR

- The 2026 overseas-travel event applies only to payments made after the user
  applies for the event. It does not retroactively apply to the prior China trip.
- Cashback: 10% after applying.
- Overseas QR cashback cap: KRW 5,000, corresponding to KRW 50,000 of spend.
- The cap increases to KRW 10,000 after completing the Naver Pay travel-insurance
  comparison during the relevant period, corresponding to KRW 100,000 of spend.
- Network-specific FX conversion, foreign exchange fees, international-card
  fees, or intermediary fees may be included in the KRW charge. The exact rate
  may therefore need manual input or a server-side data adapter.
- Japan PayPay's separate 10% instant discount is currently scheduled to end on
  2026-06-30 and must not be assumed for later travel unless renewed.

Official event:
https://campaign2.naver.com/global10save3/

Official exchange-rate guidance:
https://help.pay.naver.com/faq/content.help?faqId=14390

### Asiana Shinhan Card Air 1.5

- Requires KRW 500,000 of eligible spend in the previous month.
- Overseas Mastercard purchases earn 3 Asiana miles per KRW 1,000: 1.5 base
  miles plus 1.5 additional miles.
- The additional 1.5-mile portion is capped at 2,000 miles per calendar month,
  so the full 3-mile rate applies to approximately KRW 1,333,333 of monthly
  overseas spend.
- Mastercard fee: 1%.
- Shinhan overseas service fee: 0.18%.
- KRW conversion uses Shinhan Bank's telegraphic transfer selling rate at the
  applicable processing time.
- Mileage value is subjective and must be a user setting. Suggested presets:
  KRW 10, 15, or 20 per mile.

Official card benefits:
https://www.shinhancard.com/conts/person/card_info/dream/credit/travel/1366616_46600.jsp

Official overseas fees:
https://www.shinhancard.com/pconts/html/helpdesk/totalService/MOBFM12552/MOBFM12552H/MOBFM12552R10.html

## Product behavior

The result should show more than a single recommendation:

- Recommended payment method
- Expected effective KRW cost
- Runner-up and KRW difference
- Fee, cashback, and mileage-value breakdown
- A warning when the difference is small enough that convenience or acceptance
  may matter more
- The assumptions and exchange-rate timestamp used

Suggested calculation model:

```text
effectiveCost = convertedKRW
              + percentageFees
              + fixedFees
              - cashback
              - mileageValue
```

All payment rules should be data-driven and date-bounded rather than scattered
through UI code. The engine should support rules such as percentage fees, fixed
per-transaction fees, cumulative cashback caps, monthly mileage caps, required
previous-month spend, and promotion start/end dates.

## MVP inputs

- Destination/currency; start with Japan/JPY
- Purchase amount in local currency
- Payment-method-specific exchange rates, initially manually editable
- Naver Pay cashback remaining
- Whether the Naver Pay insurance comparison was completed
- Whether Shinhan's previous-month KRW 500,000 requirement was met
- Shinhan overseas spend already accumulated this month
- User valuation of one Asiana mile

## MVP state and privacy

- Store settings, limits, and purchase history locally in IndexedDB or
  `localStorage`.
- Do not send personal purchase history to a server.
- Add a clear reset/export option.
- Support offline use with the most recently entered rates.

## Recommended technical direction

- Mobile-first installable PWA
- TypeScript
- A small frontend stack suitable for static deployment; choose the exact stack
  during planning rather than assuming one here
- Pure, separately tested comparison engine
- GitHub repository for source control
- Start with GitHub Pages if the app remains static
- Prefer Cloudflare Pages if API proxying, secret keys, or scheduled rate
  collection becomes necessary

Do not put secret API keys in browser code.

## First implementation scope

1. Confirm requirements and document assumptions.
2. Select the minimal frontend stack and deployment target.
3. Define typed payment-rule and quote interfaces.
4. Implement and unit-test the comparison engine.
5. Build the mobile input and recommendation UI.
6. Add local persistence and PWA/offline support.
7. Test the rendered UI at iPhone-sized viewports.
8. Deploy a preview and document how to update dated promotions.

## Project workflow

Use Medium Mode unless the user asks otherwise. Follow the user's global
`AGENTS.md` instructions: create meaningful Git commits for each completed
action unit, use `_CLAUDE/Plans/` for substantial-task plans, and write a concise
completion report after meaningful multi-step work. Do not use code-team,
delegation, or subagents unless explicitly requested.

## Suggested prompt for a new Codex project session

```text
이 프로젝트는 해외여행 결제수단 추천 PWA야.
루트의 PROJECT_CONTEXT.md를 먼저 전부 읽고, git log와 현재 작업트리를
확인해줘. Medium Mode로 진행하고, 아직은 구현 전에 MVP 요구사항과 계산
규칙을 검토해서 짧은 구현 계획을 작성해줘. 공식 조건 중 날짜에 따라
바뀔 수 있는 항목은 최신 공식 자료로 다시 확인하고, 확인되지 않은 환율
API는 추정하지 말아줘. 계획을 내가 확인할 수 있게 요약한 뒤, 합리적인
기본값으로 구현·테스트·커밋까지 자율적으로 진행해줘.
```
