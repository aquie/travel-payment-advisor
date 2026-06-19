# MVP UI design spec

## Reference

- `mobile-concept.png` is the visual reference for the implementation.
- It defines layout, hierarchy, spacing, palette, typography character, and row anatomy.
- Values shown in the concept are illustrative; the implemented UI must render live engine results.

## Visual system

- Background: true white.
- Text: deep navy-black with slate secondary text.
- Primary accent: saturated cobalt blue.
- Informational surface: pale blue; warning accent: coral.
- Typography: Korean sans-serif system stack with tabular numerals for money.
- Geometry: small radii on controls, fine dividers, circular rank markers, and one slim
  cobalt rule beside the recommendation. Avoid nested cards and decorative gradients.

## Component inventory

- Compact header with title and privacy/offline reassurance.
- Primary inputs for date, JPY amount, and common `100 JPY` rate.
- Strong comparison action.
- Recommendation summary with effective cost, runner-up difference, and close-call notice.
- Open ranked rows with disclosure details for fees, cashback, mileage, assumptions, and warnings.
- Advanced settings disclosure for method-specific rates and benefit state.
- Recent comparisons, data management, and official-source sections below the calculator.

## Responsive rules

- Mobile is the source of truth at 320, 375, and 390 CSS pixels.
- Desktop uses a centered two-column composition: inputs/settings beside results/history.
- No horizontal scrolling; controls retain at least 44px touch height.
- The action may remain visible near the bottom on narrow screens without covering content.

## Allowed first-viewport copy

- `어떻게 결제할까?`
- `일본 결제비용을 한눈에 비교해요`
- `결제 예정일`
- `결제 금액`
- `100 JPY`
- `원`
- `비교하기`
- `이번 결제는`
- Live method name, effective cost, runner-up difference, and applicable warnings.

## Intentional implementation differences

- The concept's hamburger is replaced by a compact `데이터` anchor because the MVP is a
  single-page tool and should not imply unavailable navigation.
- The concept's sample date and values are never shipped as factual rates; defaults are
  clearly editable and labeled as user-entered values.
- All icons are code-native SVGs or semantic disclosure markers; no raster UI is shipped.
