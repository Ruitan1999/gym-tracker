# UI assessment (ui-ux-pro-max)

Run on 2026-10-29 against `main` at `f5ff8eb`, using the `ui-ux-pro-max` skill in
`.claude/skills/`: its design-system search for a fitness tracker, its UX rule
searches, and the pre-delivery checklist in `references/pro-rules.md`. Every
number below was measured in this repo or in a headless phone browser, not
guessed. Ranked by the skill's own priority order (accessibility and touch
first).

## Already in good shape

- No horizontal scroll at 360 px (a small Android phone) on Home, Plan, Log Book,
  Progress, Settings or an open session.
- Numeric fields bring up the number keypad (`inputMode="decimal"` / `numeric`).
- Icons are one family (lucide), no emoji used as icons.
- Bottom nav is five items, the skill's limit, with a raised primary action.
- Reduced motion is respected by the new pieces (rest bar, Choose a different
  workout, chips strip).
- Destructive actions confirm first. The skill also suggests undo; you have
  said no to undo prompts, so that rule is deliberately not followed.

## What to improve, most important first

| # | Finding (measured) | Skill rule | Suggested change | Size |
|---|---|---|---|---|
| 1 | The faint grey used on most labels, `--color-text-faint #9a9a9a`, is **2.8:1** on white and **2.6:1** on the page background. Needed: 4.5:1. It carries real information (dates, units, "SETS", set numbers). | Accessibility: color-contrast 4.5:1 (critical) | Darken the token to `#707070` (4.95:1 on white, 4.54:1 on the page). One-line change; everything that uses the token follows. | Small |
| 2 | Very small text: **114** uses of 9 px, **80** of 10 px, **67** of 11 px, almost all uppercase monospace with wide letter-spacing. Hard to read mid-set at arm's length. | Typography: readable-font-size, letter-spacing | Raise the floor to 11 px for labels and 13 px for anything read during a set; keep the caps style but lower tracking from 0.08–0.14em to about 0.04em. Do it through the `caps` / `caps-tight` classes so it is one change. | Small–medium |
| 3 | No dark mode. Gyms are often dim and the screen stays on (wake lock), so a bright white UI is glaring between sets. | Light/dark: design both together, test contrast separately | Add a dark token set behind `prefers-color-scheme: dark` (all colours are already CSS variables), plus a Settings switch: System / Light / Dark. Check the volt blue and the body-map shading on dark separately. | Medium |
| 4 | Several controls are 44 px, the iOS minimum. Android's is 48 dp, and the owner is on Android. The Start pills in Next Up are 36 px but sit inside a full-width row button, which is fine. | Touch target minimum (48 dp Android) | Move the shared 44 px controls (rep chips, steppers, ±15, Skip, segmented switches) to 48 px. | Small |
| 5 | Rest-timer finish and drag-reorder vibrate; logging a set or completing an exercise does not. | haptic-feedback for confirmations, not overused | One short `navigator.vibrate(10)` on Complete exercise and on Save session. Quiet, Android-only, no visual change. | Small |
| 6 | The design-system search lists "no gamification" as the thing to avoid for fitness apps. The streak covers part of that. | Product: fitness / gym app | A quiet personal-record marker: when a set beats the best weight for that exercise, show a small "PR" tag on the set and on the saved session. No banners. | Medium |
| 7 | The Settings unit switch offers lb, but the workout form, rest of the logging flow and its labels are kg-only. | Consistency | Either make the form honour the unit, or hide lb until it does. Hiding is the small, honest option. | Small (hide) / Large (support) |
| 8 | Text size is in px, so Android's system font size setting does not scale it, and fixed-height chips would clip if it did. | Dynamic Type / largest text | Move type to `rem` and let rows grow; test at 130% browser text zoom. | Medium |
| 9 | Icons mix lucide (round caps) with a few hand-written SVGs using square line caps (session form + and some chevrons). | Stroke and style consistency | Swap the hand-written ones for the lucide equivalents. | Small |
| 10 | Landscape and very large text were not tested. | Process checklist | Add both to the screenshot check before the next release. | Small |

## Recommended order

1, 2 and 4 together (one pass on tokens and the two label classes; biggest
readability gain for least risk), then 3 (dark mode), then 5 and 9 (tidy
polish), then 6 and 7 when you want new behaviour.

## Done

Items 1, 2 and 4 were applied together on 2026-10-29:

- The faint text token is now `#707070` (4.95:1 on white, 4.54:1 on the page).
- No text below 11 px: every 9 and 10 px label is now 11 px. The two label
  classes have tighter tracking: `.caps` 0.14em to 0.08em, `.caps-tight`
  0.08em to 0.04em; the nav labels use 0.02em.
- Shared 44 px controls are now 48 px (rep chips, ±15 / pause / Skip on the
  rest bar, segmented switches, icon buttons, Choose a different workout).
- Checked at 360 px and 430 px: no horizontal scroll and no clipped text. At
  360 px the balance list moves under the figure, and the streak line, tile
  labels and heatmap summary wrap instead of cutting off. Long exercise
  names still end in an ellipsis, as before. The rep chips wrapping onto a
  second row at 360 px predates this change.

Still open: 3 (dark mode) and 5 to 10.
