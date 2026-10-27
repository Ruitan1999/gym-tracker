# Ideas from openGym

Reviewed: <https://github.com/DuarteSantos8/openGym> (v1.4.3, 2026-10-26), read-only.
Compared against this app as of `1fb5d63`.

## Read this first: what can and can't be borrowed

| Thing | Licence | What it means for us |
|---|---|---|
| openGym's code | **AGPL-3.0** | Don't copy it. Copying code puts our app under AGPL too, and this one is served over the web, which is the case AGPL is strictest about. **Ideas and behaviour are free to reimplement in our own code.** |
| Exercise pictures / animations | Gym Visual, not AGPL | Not reusable. Their NOTICE.md says third parties have no right to extract them. |
| Body-map outlines | **MIT**, from [MuscleMap](https://github.com/melihcolpan/MuscleMap) by Melih Colpan | Usable, but take it **from MuscleMap directly** with its MIT notice, not from openGym's converted copy. |
| Exercise text catalogue | MIT-family upstream (same family our library already comes from) | Already ours in effect. |

Everything below is therefore "build our own version of this idea".

---

## Part 1: the six picks

### 1. Equipment filter in the exercise picker
**Why:** you asked for your gym's machines. Their catalogue tags every exercise with equipment. Counts from it: body weight 2,246, dumbbell 757, cable 446, barbell 389, **leverage machine 279**, band 261, kettlebell 187, Smith machine 94, EZ bar 50.
**What to build:** inside a body part (Chest, Back...) add a row of chips under the title: `Any · Machine · Cable · Dumbbell · Barbell · Bodyweight · Smith`. Pick Chest + Machine and you see only chest machines.
**Where we stand:** the build script reads an `equipment` field but our shipped `defaultExercises.ts` doesn't keep it, so there is a one-time regeneration of the library with equipment added to each entry, then the UI.
**Their screenshot:** body-part chips row, then an equipment chips row (`Any equipment` highlighted, `Barbell`, `Dumbbell`, `Sm…`), and each result shows its muscle and equipment as `Pectorals · Barbell`.
**Effort:** small-medium. **Value:** high, and the closest we get to "my gym's machines".

### 2. Rest timer
**Why:** we already have a finished `RestTimer.tsx` that nothing uses.
**What to build:** wire it in. Starts when a set is ticked, runs along the bottom of the workout screen.
**Their design to copy (the idea, not the code):** a docked bar at the bottom: big countdown `1:27`, a small `Rest` label, `−15s`, `+15s`, pause, and a green **Skip** button. Per-exercise rest time and a scroll wheel for custom times.
**Effort:** small. **Value:** high.

### 3. Keep the screen awake during a workout
**Why:** unlocking your phone between sets is friction.
**What to build:** the browser's Screen Wake Lock API while a session is open; release on save or leave. Re-acquire when the tab comes back to the foreground (the lock drops when you switch away).
**Honest limit:** this stops the screen sleeping. It does **not** stop Android discarding the app when you're in another app for a while; the cached-data change already shipped is what helps there.
**Effort:** small. **Value:** medium-high.

### 4. Export your data
**Why:** we have no export at all, and this session has had enough save and sync trouble to make a backup button worth having.
**What to build:** Settings, "Export". Two outputs:
- **JSON**: everything, as a backup.
- **CSV**: one row per set (date, workout, exercise, set, weight, reps, RPE), opens in Excel or Sheets.
Optional date range. Import from Strong/Hevy/FitNotes is a later step, not part of this.
**Effort:** small-medium. **Value:** high (safety).

### 5. Rotation mode (A, B, C, A...)
**Why:** you train every week but on varying days, and we just shipped fixed-weekday scheduling.
**What to build:** a second mode beside the weekday schedule. Templates sit in an order; "Next Up" is simply the next one you haven't done, however the week went. Missing Tuesday no longer makes Tuesday's session disappear.
**Their design:** a `How you train` card with a two-way switch, `Fixed Week | Rotation`, and a one-line explanation under it.
**Effort:** medium. **Value:** high for how you actually train.

### 6. Auto-fill weights from last time
**Why:** we show "LAST 10 × 80 KG, tap to use". They pre-fill it.
**What to build:** a setting, **off by default**, that fills reps and weight from last session when you start. Keep the suggestion line either way so you can see what it was.
**Caution:** this touches the exact code that had the wrong-set-removed bug, so it needs the same row-by-row tests.
**Effort:** small-medium. **Value:** medium.

---

## Part 2: graphics and UI elements worth borrowing

I looked at their five screenshots (Home, Workout, Stats, Plan, Exercises) and their component list. These are the pieces that stand out, with our equivalent.

### Graphics

**A. Body map on every session card.** *(biggest visual win)*
A tiny body, front and back, with the muscles that session works lit up. Shown on Home's "Today" card, every row of the Plan page, and in the workout header, so you know Leg Day is legs before opening it.
- Ours: we have `BodyMap.tsx` and a body-part list, but no per-session muscle highlighting on the Next Up card or template list.
- Needs the body-part data we already have (chest/back/legs...), plus MuscleMap outlines under MIT.

**B. Year activity heatmap with a Time/Volume switch.**
Weeks as columns, days as squares, shaded by how much you did. A segmented switch flips between time and volume. Today is outlined.
- Ours: the Log Book month calendar covers a month. A 12-month heatmap would show consistency at a glance, which suits "I work out every week".

**C. Muscle balance map with three modes: Muscle balance / Fatigue / Strength.**
Body shaded by sets worked, by what is still recovering, or by what has gone untrained, over Week / 30d / 90d / All.
- Ours: nothing like it. Needs body-part set counts, which we can already derive.

**D. Body-weight chart with a goal line.**
Area chart under a line, dashed goal line, big current number, change since last weigh-in, and a "Trend -0.56 kg a week" row.
- Ours: we don't track body weight. Only worth it if you want to.

**E. "Lifted in total" lifetime tonnage** as one big stat card.
- Ours: easy, since we already store weight × reps per set. Good for the Log Book stats row.

**F. Estimated 1RM curve per exercise**, and **progress photos with a before/after slider**.
- Ours: Progress already has 1RM charts. Photos are a separate, larger feature.

### UI patterns

**G. Stat tiles: icon + small label + big number.** Two-by-two grid on Stats (Workouts / This month / Week streak / Weight 30d). Cleaner than our single row of three and gives each number its own space.

**H. Segmented switches instead of tabs** for view modes (`Time | Volume`, `Fixed Week | Rotation`, `Schedule | Routines`). Pill with the selected side raised.

**I. A raised, centred primary action in the bottom nav.** Their nav is Home, Plan, **Start** (large round green button, standing above the bar), Stats, Exercises. Starting a workout is always one thumb-press away.
- Ours: a four-item nav (Log, Log Book, Progress, Settings). A raised centre Start button is a real option.

**J. Workout header with a progress bar and exercise chips.**
Title, `0:05 · 1/17 sets`, a thin progress bar with the running volume (`700 kg`) at the right end, and numbered chips `1 2 3 4 5` for jumping between exercises (the active one ringed, partly filled by progress).
- Ours: we have a done counter and a progress line; numbered chips would make jumping between exercises one tap.

**K. Progression explained in plain words.** One green line under the exercise: "Linear progression: every rep last time. 5 kg more." Tells you *why* the target is what it is.

**L. Last-time line with effort.** `Last time (last week): 65×10 (RIR 3.5), 65×10 (RIR 2)…`. All of last session's sets in one readable line.
- Ours: we show per-set suggestions; a single summary line above the sets would help.

**M. "Best: 65 kg" and muscle/equipment tags as small pills** under the exercise name (`Lats` `Cable` `Best: 65 kg`).

**N. Today card with a "Choose a different workout" link** under it, so the suggestion never traps you.
- Ours: Next Up has no alternative link; we only offer "also today".

**O. "At the gym / Check in" strip.** Optional, phone-app only; probably skip.

---

## Part 3: suggested order

1. **Rest timer** (2) and **wake lock** (3): small, noticeable straight away.
2. **Equipment filter** (1): needs the library regenerated first.
3. **Export** (4): safety net.
4. **Body map on session cards** (A) with **stat tiles** (G) and **lifetime tonnage** (E): the visible polish.
5. **Rotation** (5) and **auto-fill** (6): behaviour changes, so best after the above.
6. Bigger, optional: year heatmap (B), muscle balance (C), raised Start button (I), exercise chips (J).

## Probably skip

- **Swipe a set left to delete / right to copy.** You said no undo, and set removal has been the painful part of this app.
- **Supersets, warm-up sets, drop sets, progression rules, plate maths, Strong/Hevy import.** Real features, large, and not something you have asked for. Say if you use any.
- **Accounts, passkeys, Docker, Apple Watch, AI coach, MCP server.** Their self-hosting model, not ours.
