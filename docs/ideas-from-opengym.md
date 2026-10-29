# Ideas from openGym

Reviewed: <https://github.com/DuarteSantos8/openGym> (v1.4.3, 2026-10-26), read-only.
Compared against this app as of `1fb5d63`.

**Contents:** Part 1 the six picks, Part 2 graphics and UI worth borrowing, Part 3 the nine you chose with build notes, Part 4 suggested order.

## Status

Built on 2026-10-28/29 and shipped to `main`. Every item passed type check, lint, the full test suite and a production build before it was merged, and was looked at in a real mobile-sized browser.

| Item | State | Notes |
|---|---|---|
| Part 1.2 Rest timer | Done | Docked bar at the bottom of a live session: countdown, -15, +15, pause, Skip. There is no per-set tick in the app, so a set counts as logged when its reps go from nothing to something; marking an exercise done starts a rest only if none is running. 90 s default, last length remembered. Removes itself when finished. The timer is not kept across a page reload. |
| Part 1.3 Keep screen awake | Done | Wake Lock while a new session is open; re-taken when the page comes back. Does not stop Android discarding the app. Not checked on a real phone. |
| Part 3.1 Stat tiles | Done | 2x2 tiles in the Log Book. Hidden with no history, as before. |
| Part 3.2 Lifetime tonnage | Done | "Lifted in total", plus "this month" under it. |
| Part 3.5 Choose a different workout | Done | Quiet link under the Next Up card; scrolls to the template list, changes nothing. Hidden with one template. |
| Part 1.1 Equipment filter | Done | Chips in the picker, under a body part and above search results. All 1,427 shipped exercises now carry equipment (from the same MIT dataset the library already came from). Own exercises have none and show only under Any. Some dataset oddities, e.g. "Hands Bike" under Chest. |
| Part 1.4 Export | Done | Settings: JSON (full backup, wrapped in a small header) and CSV (one row per set, Excel-safe, optional date range). |
| Part 3.3 Body map on session cards | Done | Mini figure on Next Up, template rows (Home and Manage) and the session strip. |
| Part 3.4 Raised Start button | Done | Fifth tab, per your decision (a). Opens today's template, or the picker if none is due or one is already logged today; resumes an open session. The label reads Resume while a session is open. The Home "Start workout" bar was removed at your request. |
| Part 3.6 Header and exercise chips | Done | Sticky strip under the title: time, sets done, volume, a progress bar and a numbered chip per exercise. It is about 113 px tall. |
| Part 3.7 Plain-words target line | Built, then removed | Sentence version was built and shipped, then taken out at your request (you did not like the subtext under each exercise). The code and tests were deleted; it is in the git history (commit `6d5a77b`) if you ever want it back. |
| Part 1.5 Rotation mode | Done | `Fixed Week | Rotation` on Manage templates. Workouts do not record their template, so the last-trained one is inferred by name, then by exercise set. Weekday labels are hidden in rotation but kept in the data. |
| Part 1.6 Auto-fill weights | Done | Setting, off by default. Filled-in sets do not count as work or as done until touched. |
| Part 3.8 Year heatmap | Done | On Progress, Time / Volume switch, scrolls sideways inside its card. |
| Part 3.9 Muscle balance map | Done | On Progress: Balance / Untrained / Recovering over Week, 30d, 90d, All. Coarse body parts only. |
| Body figure artwork | Done, changed approach | Replaced our blocky figure with the MuscleMap outlines (MIT), taken directly from MuscleMap with its notice in `THIRD_PARTY_NOTICES.md`. Nothing from openGym's code or images was used. |

Not part of this run: Part 2 items not picked, and everything under "Probably skip".

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
- Ours: `BodyMap.tsx` already draws front and back, shaded by sets worked, but it is only shown on the saved-session page. Nothing shows it on the Next Up card or template list. See Part 3, item 3.
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

## Part 3: your nine picks, with how each would be built

You chose these nine from Part 2. Each one is below with what we already have in this repo, what is missing, and a rough size. Items 1 to 9 are in the order I'd build them.

Two things I found in our own code while checking, both good news:

- **A body map already exists.** `src/components/workout/BodyMap.tsx` draws a front and a back figure, shaded by sets worked per body part. It is only used on the saved-session page (`WorkoutDetailPage`, via `workedBodyParts()`). So the "biggest win" is mostly about *reusing* it in small form, not drawing one from scratch.
- **The rest timer is built but unused** (`RestTimer.tsx` has no callers), which is item 2 in Part 1.

One constraint to keep in mind: our exercises only know a **coarse body part** (chest, back, shoulders, arms, forearms, core, legs, calves, neck, cardio), not individual muscles. Anything that lights up the body will be at that level, which is fine for "this is Leg Day" but not for "this hits the rear delts". Their catalogue has finer fields (`target`, `secondaryMuscles`) if we ever want that, and it would mean regenerating the library the same way as the equipment filter.

### 1. Stat tiles: icon, small label, big number (2×2 grid)
**What it is:** four tiles instead of our one row of three. Their set: Workouts, This month, Week streak, and a fourth.
**Ours today:** the Log Book has one card split into three (Streak, This month, Sessions).
**Build:** change the stats card to a 2×2 grid; give each tile a small icon, a faint label and a large number. Fourth tile is the lifetime tonnage (item 2). Keep the wide value-shrinking rule so a long number can't clip again (that bug already happened once on "THIS MONTH").
**Size:** small. Do this together with item 2.

### 2. Lifetime tonnage ("Lifted in total 307,450 kg")
**What it is:** every set's weight times reps, added up across all time, as one big number.
**Ours today:** we store both values on every set, so no new data is needed. `formatVolume()` already exists.
**Build:** sum `reps × weightKg` over all workouts; show it as the fourth stat tile, or as a wide card under the tiles like theirs. Consider a short second line such as "this month: 21,900 kg".
**Size:** small.

### 3. Body map on every session card
**What it is:** a tiny front-and-back figure with the muscles of that session lit up, so you know it is Leg Day before opening it.
**Where:** our **Next Up card** on Home, each row in the **template list** (Manage templates and the home list), and the workout header.
**Ours today:** the full-size `BodyMap` takes `worked={ chest: 5, arms: 7 }`. For a template there are no sets yet, only exercise ids, so we need a small helper that turns a template's exercise ids into body parts (one point per exercise is enough to light a region).
**Build:** (a) helper `bodyPartsOfTemplate(exerciseIds, exercises)`; (b) a `MiniBodyMap` that reuses the same shapes at about 36 px high with no labels, lit or dim only; (c) place it on the Next Up card and template rows.
**Size:** medium. **Licence note:** our blocky figure is our own drawing, so nothing needs borrowing. Only if we ever want realistic outlines would MuscleMap (MIT) come in.

### 4. Raised centre Start button in the bottom nav
**What it is:** the nav becomes Home, Plan, **Start** (a large round button standing above the bar), Stats, Exercises, so starting a workout is always one press away.
**Ours today:** four equal items: Log, Log Book, Progress, Settings.
**Decision needed:** a centre button needs an odd number of items. Options: (a) keep four and put Start in the middle as a fifth, giving Log, Log Book, **Start**, Progress, Settings; (b) fold Log into Start so the first tab *is* the button. I'd go with (a).
**Build:** one extra nav slot with a larger circular button in the accent colour that opens today's Next Up session (or the exercise picker if none), and a soft shadow so it reads as raised. Respect the safe-area inset the nav already uses.
**Size:** small-medium. Mostly layout, plus checking that pages with their own bottom padding still clear it.

### 5. "Choose a different workout" under the Today card
**What it is:** a link below the suggested session that opens the full list, so the suggestion never traps you.
**Ours today:** Next Up shows the suggested template and, when two share a day, "ALSO TODAY". There is no link to the rest of the templates.
**Build:** a text link under the card, "Choose a different workout", that scrolls to or opens the template list that already sits lower on Home. If the list is empty it hides.
**Size:** small.

### 6. Workout header with a progress bar and numbered exercise chips
**What it is:** the top of the workout shows the title, elapsed time and sets done (`0:05 · 1/17 sets`), a thin progress bar with the running volume at its right end, and chips `1 2 3 4 5` that jump to each exercise. The current one is ringed and partly filled by progress.
**Ours today:** we have the session time, a done counter ("2 EXERCISES LEFT TO MARK DONE") and a thin progress line near the save button. Moving between exercises means scrolling.
**Build:** a sticky strip under the page title: sets done / total, a progress bar, and one chip per exercise (filled when marked done). Tapping a chip scrolls to that card and expands it. Folded cards stay folded, so this also helps with long sessions.
**Watch out:** the chips must scroll sideways, not wrap, past about eight exercises; and tapping must not trigger the "delete the wrong set" guard we built (it only affects the set delete buttons).
**Size:** medium.

### 7. A plain-words line explaining the target
**What it is:** one line under an exercise saying why the suggested number is what it is, e.g. "Linear progression: every rep last time. 5 kg more."
**Ours today:** we show "LAST 10 × 80 KG, tap to use" under each set and nothing about *why* or about moving up.
**Build (small version):** derive a sentence from last session only, with no progression engine: if every set hit its reps last time, say "You hit every rep last time. Try +2.5 kg"; if not, say "You missed reps on set 3 last time. Same weight again." Uses the step size already in Settings (`weightStepKg`).
**Build (large version):** per-exercise progression rules (linear, double progression, deloads). That is a big feature and I'd leave it for later.
**Caution:** it must never change a number on its own. It is advice, not auto-fill (that is Part 1, item 6).
**Size:** small for the sentence, large for real rules.

### 8. Year activity heatmap with a Time / Volume switch
**What it is:** the last 12 months as a grid of small squares, one per day (weeks as columns), shaded by how much you did. A two-way switch flips between time and volume. Today is outlined.
**Ours today:** the Log Book month calendar (which just got its full weeks). It shows one month at a time and only trained / not trained.
**Build:** a new card on the Progress page, or above the calendar. For each day compute either session minutes (from `startedAt` to save time where we have it) or volume (`reps × weight`). Five shade levels. A "Time | Volume" segmented switch. Tapping a square could jump the calendar to that month.
**Data gap:** older sessions have no `startedAt`, so "Time" will be empty for them. Volume works for all.
**Size:** medium.

### 9. Muscle balance map (sets worked / still recovering / untrained)
**What it is:** the body shaded three ways over Week, 30d, 90d or All: **Muscle balance** (sets per area), **Fatigue** (what is still recovering), **Strength** (their third lens).
**Ours today:** the full `BodyMap` shades by sets for one saved session. Nothing aggregates over a period.
**Build:** a card on Progress that aggregates `workedBodyParts()` across a chosen window, with the same figure and a switch. "Untrained" is just the regions with zero sets in the window, which is the most useful single view for you. A simple "recovering" rule (trained in the last 48 hours) is enough to start.
**Honest limit:** with only coarse body parts, "balance" will say "arms vs back", not finer. It is still useful for spotting a neglected region.
**Size:** medium-large. Do last.

---

## Part 4: suggested order

Combine Part 1 (the six picks) and Part 3 (your nine) like this:

1. **Rest timer** and **keep the screen awake** (Part 1, items 2 and 3). Small, and the timer is already written.
2. **Stat tiles + lifetime tonnage** (Part 3, items 1 and 2). Small, done together.
3. **"Choose a different workout"** (Part 3, item 5). Small.
4. **Equipment filter** (Part 1, item 1). Needs the library regenerated first.
5. **Export** (Part 1, item 4). Safety net.
6. **Body map on session cards** (Part 3, item 3). Reuses the existing map.
7. **Raised Start button** (Part 3, item 4). Needs your call on the nav layout.
8. **Workout header with exercise chips** (Part 3, item 6).
9. **Plain-words target line** (Part 3, item 7), sentence version only.
10. **Rotation mode** and **auto-fill** (Part 1, items 5 and 6). Behaviour changes, so after the visual work.
11. **Year heatmap** and **muscle balance map** (Part 3, items 8 and 9). Largest, and the least urgent.

## Probably skip

- **Swipe a set left to delete / right to copy.** You said no undo, and set removal has been the painful part of this app.
- **Supersets, warm-up sets, drop sets, full progression rules, plate maths, Strong/Hevy import.** Real features, large, and not something you have asked for. Say if you use any.
- **Accounts, passkeys, Docker, Apple Watch, AI coach, MCP server.** Their self-hosting model, not ours.
- **Body-weight chart with a goal line.** Only if you want to track body weight, which we don't today.
