# Playbook: build your own web app by borrowing from LiftGauge

For someone who wants a tool like LiftGauge (an installable web app that one
person uses every day, keeps their own data in, and works on a phone) and would
rather start from a working example than from nothing.

You do not need to be a developer to follow the plan, but you will either write
code yourself or work with an AI coding assistant. Both are covered.

Time and cost figures here are rough planning numbers, not promises. Check the
current pricing pages of Firebase and Vercel before you commit to anything.

---

## 0. Read this first: what you may borrow

**This repository has no licence file.** Until its owner adds one, the default
in most countries is that nobody else may copy it. Ask the owner (Ruitan) for
permission, in writing, and ask which licence applies. Everything below assumes
you have that permission. A short message is enough:

> May I use LiftGauge's code as the starting point for my own app, and under
> which licence?

Some parts are not the owner's to hand out whatever the answer is:

| Part | Where it is | What to do |
| --- | --- | --- |
| Exercise pictures | `public/assets/exercise-images/` (about 1,400 files) | Credited in the app to Gym visual (gymvisual.com). Do not reuse them. Use your own pictures, or get your own licence from the owner of the pictures. |
| Exercise names and categories | `src/data/defaultExercises.ts` | Built from an MIT-licensed dataset (hasaneyldrm/exercises-dataset). Fine to reuse with its notice. Regenerate with `npm run library`. |
| Body-map outlines | `src/data/bodyPaths.ts` | From MuscleMap (MIT). Keep its notice (see `THIRD_PARTY_NOTICES.md`). |
| Logo, wordmark, screenshots on the website | `src/components/shared/Logo.tsx`, `public/logo.svg`, `public/assets/site/` | LiftGauge's own brand. Make your own. |
| openGym, Technogym | not in the repo | Do not copy anything from them. openGym is AGPL, which would force your whole app open. |
| `.claude/skills/ui-ux-pro-max/` | design helper for Claude Code | MIT. A development aid, not part of the app. Optional. |

Keep `THIRD_PARTY_NOTICES.md` and add to it for anything you bring in.

---

## 1. Decide whether this pattern fits

LiftGauge's design suits a tool that is:

- **personal**: one person, their own records (a log, a tracker, a journal)
- **used on a phone, often, in short bursts**: seconds per visit
- **mostly numbers and lists**: not documents, not chat, not video
- **fine with "my data is mine"**: no sharing between people, no feed

Good fits: a habit tracker, a meal or medication log, a reading log, a
plant-watering schedule, a running or cycling log, a mileage or expense log, a
baby-feeding log.

Poor fits: anything where people see each other's data (a marketplace, a
social app), anything with payments or heavy file uploads, anything needing
real-time collaboration.

**Write down, in plain words, before touching code:**

1. Who uses it, and what do they do in the first 10 seconds?
2. What is the one thing they record? (LiftGauge: a *set*, meaning reps and weight.)
3. What do they want to see afterwards? (LiftGauge: this week, a streak, a chart.)
4. What is the one-line name for each screen?

If you cannot answer these in half a page, stop and answer them first. Every
later step gets easier.

---

## 2. What LiftGauge is made of

| Layer | Tool | What it does here |
| --- | --- | --- |
| Screens | React 19 and TypeScript | The interface |
| Build | Vite | Builds the site; stamps each build with an id |
| Styling | Tailwind CSS v4 plus `src/index.css` | Colours and type are CSS variables in one place |
| Routing | React Router | One page per screen |
| Charts | Recharts | The stats screens |
| Icons | lucide-react | One icon family |
| Accounts and data | Firebase (Authentication and Firestore) | Sign-in, and one document per person |
| Hosting | Vercel | Serves the built site; redeploys on every push to `main` |
| Offline and speed | A service worker (`src/sw.js`) | Keeps the app and pictures on the phone |
| Tests | Vitest and Testing Library | About 630 tests; run before every push |

Folders worth knowing:

```
src/pages/          one file per screen
src/components/     pieces of screens, grouped by area
src/context/        AuthContext (who is signed in), AppContext (load and save the data)
src/utils/          plain logic with no screens (storage, merging, streaks)
src/data/           built-in content (the exercise list)
src/sw.js           the service worker
public/             manifest, icons, pictures
firestore.rules     who may read and write which data
vercel.json         hosting rules
SETUP.md            the original Firebase, GitHub and Vercel steps
docs/               design notes and the admin guide
```

---

## 3. Accounts you need (all free to start)

| Account | For | Cost |
| --- | --- | --- |
| GitHub | Holding your code; Vercel deploys from it | Free |
| Firebase (Google) | Sign-in and your data | Free "Spark" plan is enough to start |
| Vercel | Putting the site on the internet | Free "Hobby" plan to start; check its terms if the app earns money |
| A domain name | A proper address (optional, later) | Roughly 10 to 20 per year |
| An AI coding assistant | If you are not writing the code yourself | Varies |

Set up these three and note their login details somewhere safe. Never paste
passwords or keys into a chat or commit them to the repository.

---

## 4. The plan, phase by phase

Each phase ends with something you can see working. Do not skip ahead.

### Phase 1: get the original running (an evening)

1. Get permission (section 0).
2. Copy the repository to your own GitHub account (fork, or copy the files into
   a new repository).
3. Install Node.js, then in the project folder run `npm install`.
4. Follow **`SETUP.md` step 1** (Firebase): create a project, turn on Google
   sign-in, create a Firestore database, publish the rules from
   `firestore.rules`, register a web app, and copy the six values into
   `.env.local`.
5. Run `npm run dev` and open the address it prints. Sign in, log something,
   reload, and check it is still there.

**You are done when:** you can sign in on your own copy and your data survives a reload.

> Two gotchas straight from the Firestore rules file: deploying it *replaces*
> the live rules, and the admin line contains `REPLACE_WITH_ADMIN_UID`. If you
> do not want an admin screen, leave the library part out of your rules.

### Phase 2: decide what to keep (half a day)

Walk through every screen in the running app and mark each one **keep**,
**change** or **delete**. Then do the same for the data. The data shape is one
type in `src/types/index.ts` called `AppData` (workouts, templates, exercises,
preferences). Yours will be different; write your own version on paper first.

Rules of thumb:

- Keep the screen *structure* (home, plan, log, history, stats, settings) if it
  fits; rename things to your subject.
- Delete the exercise library, body map and pictures unless your subject has
  an equivalent. They are the biggest and the most licence-encumbered part.
- Keep Settings, export, sign-in and the first-run guide: every tool needs them.

**You are done when:** you have a one-page list of screens and a drawn-out
data shape.

### Phase 3: make it yours, without breaking it (one to three weeks)

Work in small steps. After each, run the checks and fix what breaks before the
next. The checks are:

```bash
npx tsc --noEmit -p .   # types
npx eslint .            # style problems
npx vitest run          # the tests
npm run build           # the real build
```

Suggested order:

1. **Rename.** App name, `index.html` title and description, `public/manifest.webmanifest`
   (name, colours, icons), the logo component, `package.json` name.
2. **Colours and type.** Change the CSS variables at the top of `src/index.css`
   (and the `lp-` variables in `src/pages/landing.css` for the public site).
   Everything else follows.
3. **Data shape.** Edit `AppData` and the pieces that build it. Do not touch the
   loading and saving logic yet (see section 6).
4. **Screens, one at a time.** Replace the gym language, then the fields, then the
   charts. Delete a screen's test along with the screen, and write a test for
   anything new.
5. **Delete what you do not use.** Dead code confuses you and your assistant.

**You are done when:** the app is about your subject, and all four checks pass.

### Phase 4: put it online (an afternoon)

1. Follow **`SETUP.md` steps 2 and 3**: push to GitHub, import the repository into
   Vercel, and add the six `VITE_FIREBASE_*` values as environment variables.
2. In Firebase, add your Vercel address under **Authentication → Settings →
   Authorized domains**, or Google sign-in will fail on the live site.
3. Open the live site on your phone and use it for a day.

**You are done when:** you can sign in on the live site, on your phone.

### Phase 5: make it feel like an app (a day)

1. Replace the icons in `public/` (192, 512, maskable, Apple touch icon).
2. Set the colours in `index.html` (`theme-color`) and the manifest to match your
   page background. A dark colour gives a black bar at the top on Android.
3. Install it to your home screen (Android: browser menu, Install app; iPhone:
   Share, Add to Home Screen) and check it launches full-screen.
4. Turn airplane mode on and open it. It should still open.

### Phase 6: your own address and a proper sign-in (a day, once)

1. Buy a domain and add it in Vercel (Project, Settings, Domains).
2. **Fix Google sign-in for the installed app** (see "Lessons" below). In short:
   keep sign-in on your own address by pointing the Firebase auth domain at your
   site and proxying `/__/auth/` (it is already in `vercel.json`, aimed at the
   original's Firebase project; change it to yours).
3. Add the new address to Firebase's authorised domains and to the Google Cloud
   OAuth client's redirect list.

### Phase 7: launch and keep it healthy (ongoing)

- Use it yourself for two weeks before inviting anyone.
- Keep a short list of what annoyed you; fix those first.
- Update dependencies once a month: `npm outdated`, then update, run the four checks.
- Back up: use the app's export (Settings) every so often. Test that you can
  read the file.
- Watch the Firebase usage page. If you ever near the free limits, you will
  know before it costs anything.

---

## 5. What to copy, what to adapt, what to leave

**Copy nearly as is** (these are generic, and tested):

| File | Why it is worth keeping |
| --- | --- |
| `src/context/AuthContext.tsx` | Sign-in with Google, email, or guest; explains its own error messages |
| `src/utils/mergeAppData.ts` | Combines two copies of the data without losing either |
| `src/utils/storage.ts` | Mirrors each account's data on the phone |
| `src/sw.js` and `src/utils/registerServiceWorker.ts` | Makes the app open fast and stay fresh |
| `vite.config.ts` (the build-id parts) | Stamps each build so old copies are noticed |
| `src/components/layout/UpdateBanner.tsx`, `RouteErrorBoundary.tsx` | "New version available" and a safe error screen |
| `src/utils/lazyWithRetry.ts`, `buildVersion.ts` | Recovers from a stale copy after a deploy |
| `src/utils/exportData.ts` | JSON and CSV export |
| `src/components/guide/AppGuide.tsx` | First-run tour; change the words and pictures |
| `firestore.rules` (the `users/{userId}` part) | Each person can read and write only their own data |
| `SETUP.md` | The deployment steps |

**Copy and adapt:**

| File | What to change |
| --- | --- |
| `src/context/AppContext.tsx` | The data shape and any actions. Keep the load and save order (section 6). |
| `src/utils/remoteStorage.ts` | The default data and any migrations |
| `src/types/index.ts` | Your own types |
| `src/components/layout/BottomNav.tsx`, `PageShell.tsx` | Your tabs and titles |
| `src/index.css`, `src/pages/landing.css`, `src/pages/LandingPage.tsx` | Colours, wording, pictures |
| `public/manifest.webmanifest`, `index.html` | Name, colours, description |

**Leave:**

`src/data/` (exercise content), `public/assets/exercise-images/`, anything under
`src/components/workout/` that is about sets and reps, the body map, the admin
library screen and its docs (unless you really want a shared library), and
`.claude/skills/` (optional).

---

## 6. Lessons that cost this project real time

These are not theory; each one broke LiftGauge at some point. Reading them now
is cheaper.

1. **The first launch and an edit during loading can lose data.** The app opens
   on a copy saved on the phone, then fetches the account's copy. If you save
   before that fetch finishes, or if a first-ever launch ignores what was
   fetched, someone's data can be overwritten. The fix lives in `AppContext.tsx`
   and `mergeAppData.ts` and is covered by `firstLaunch.test.tsx`,
   `editDuringFetch.test.tsx` and `warmResume.test.tsx`. **Do not change the
   load and save order without reading those tests first.**
2. **Google sign-in can fail on an installed phone app.** Sign-in hands its
   result back through a page on `yourproject.firebaseapp.com`, which a phone
   browser treats as another website and may block. Fix: set
   `VITE_FIREBASE_AUTH_DOMAIN` to your own domain, proxy `/__/auth/*` to
   Firebase in `vercel.json`, and add `https://your-domain/__/auth/handler` as an
   authorised redirect in the Google Cloud OAuth client **before** changing the
   environment variable. In the other order, sign-in breaks for everyone.
3. **After a deploy, phones keep running the old version.** The service worker,
   the `version.json` file and the stale-build recovery code exist to stop that.
   `vercel.json` gives `sw.js` `no-cache` and everything under `/assets/` a
   one-year cache; do not change those.
4. **Environment values must have no quotes.** Vercel stores quote marks
   literally. Variables are read when the site is *built*, so changing one needs
   a new deploy.
5. **Android and iPhone draw their own bars.** The colour of the top status bar
   comes from `theme-color`; the strip at the bottom is drawn by the phone.
   Match the bar to your page, and test on a real phone.
6. **Real pictures slow things down.** LiftGauge stores its ~1,400 pictures on
   the phone ahead of time so lists open instantly. If your app has none, skip
   `storePictures.ts` and `prefetchImages.ts`.
7. **Never ship a change you have not run.** Run the four checks, then open it
   on a phone. Most bugs found after launch would have shown up in step one.
8. **Decide the app's tone early.** LiftGauge avoids lingering banners, undo
   prompts and anything that nags, because it is used mid-set with one thumb.
   Whatever your tone is, apply it everywhere; it is many small decisions, and
   easier to set once than to retrofit.

---

## 7. If you are working with an AI coding assistant

Give it the repository and tell it which phase you are in. Some prompts that
work well:

**Start of a session**

> Read `docs/build-your-own-playbook.md`, `SETUP.md`, `src/types/index.ts` and
> `src/context/AppContext.tsx`. Summarise how data is loaded and saved, in plain
> English, in 10 lines. Do not change anything.

**Making a change**

> I want to change [one thing]. Make the smallest change that does it. Run
> `npx tsc --noEmit -p .`, `npx eslint .`, `npx vitest run` and `npm run build`.
> Show me the results, and do not commit anything that fails.

**Replacing the subject**

> Replace the exercise/workout concept with [my concept] on the [screen name]
> screen only. Keep the layout. Update its test. Do not touch
> `AppContext.tsx`, `mergeAppData.ts` or the service worker.

**Before you launch**

> Review the whole change since [date] for data-loss risks, especially around
> sign-in, first launch and saving. List each as a short scenario and say
> whether a test covers it.

Ground rules to give it:

- Work on a branch, never on `main`, until you are happy.
- One change at a time, each with its own commit and a plain-English message
  that says *why*.
- No new dependencies without telling you why.
- Check the result in a real browser at phone width, not only in the tests.

---

## 8. Pre-launch checklist

**Ownership and licences**

- [ ] Written permission to use the code, and the licence noted
- [ ] No pictures or content you do not have the right to use
- [ ] `THIRD_PARTY_NOTICES.md` updated, and credits shown in the app

**Works**

- [ ] The four checks pass
- [ ] Sign in with Google, email and guest on the live site
- [ ] Sign out and in again: data is still there
- [ ] Open on a second device: the same data appears
- [ ] Airplane mode: opens; entries made offline appear after reconnecting
- [ ] A new account sees the first-run guide and an empty but sensible app

**Feels right**

- [ ] Installed to the home screen; icon, name and colours are yours
- [ ] No black or mismatched bars at the top or bottom of the phone
- [ ] Every button at least 48 pixels, text at least 11 pixels, contrast readable outdoors
- [ ] Reduced-motion setting respected

**Safe**

- [ ] `firestore.rules` published; try reading another person's data (it must fail)
- [ ] No keys or passwords in the repository
- [ ] You can export your data and open the file
- [ ] You know how to delete an account and what that removes

**Told people**

- [ ] A one-line description, a link, and what to do if something breaks

---

## 9. Words used here

- **Fork**: your own copy of a repository on GitHub.
- **Deploy**: putting a new version on the internet.
- **Environment variable**: a setting kept outside the code (for example the Firebase values).
- **Service worker**: a small program in the browser that keeps the app available offline and up to date.
- **PWA**: a website that can be installed like an app.
- **Firestore**: Google's database. LiftGauge keeps one document per person.
- **Route**: one address in the app, such as `/history`.
- **Component**: a reusable piece of a screen.
- **Test**: a small program that checks the app still does what it should.
