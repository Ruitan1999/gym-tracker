# Setup Guide

Ship the app to the internet in three steps: Firebase → GitHub → Vercel.

## 1. Firebase

1. Go to <https://console.firebase.google.com> and create a new project (free Spark plan is fine).
2. In the project, **Build → Authentication → Get started**. Enable these sign-in methods:
   - **Google** (one-click, recommended)
   - **Email/Password** (optional)
   - **Anonymous** (optional — powers the "Continue as guest" button)
3. **Build → Firestore Database → Create database**. Start in **production mode**, pick a region.
4. Replace the default rules with the contents of `firestore.rules` in this repo:
   - Firestore → **Rules** tab → paste → **Publish**.
5. **Project settings (⚙️) → General → Your apps → Add app → Web**. Give it a nickname, register.
   You'll see a `firebaseConfig` object — copy the six values.
6. Locally, copy `.env.example` to `.env.local` and paste the values in:
   ```bash
   cp .env.example .env.local
   ```
   Fill in `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
7. Run `npm run dev` and confirm the sign-in page loads and Google sign-in works.

> **Note:** Firebase web config values are not secrets — they identify the project, and security
> is enforced by the Firestore rules in step 4. You can safely put them in Vercel env vars later.

## 2. GitHub

Create a repo and push. Easiest with the `gh` CLI:

```bash
# From the project root
gh auth login                       # one-time
gh repo create gym-tracker --public --source=. --remote=origin --push
```

Or manually:

1. Go to <https://github.com/new>, create an empty repo (no README, no .gitignore — we already have them).
2. Back in the terminal:
   ```bash
   git remote add origin git@github.com:<your-username>/<repo-name>.git
   git push -u origin main
   ```

## 3. Vercel

1. Go to <https://vercel.com/new> and import the GitHub repo.
2. Framework preset auto-detects **Vite** — leave build/output defaults alone.
3. **Environment Variables** — add the same six `VITE_FIREBASE_*` keys you put in `.env.local`.
   Set them for all environments (Production, Preview, Development).
4. Click **Deploy**. First build takes ~1 minute.
5. Once live, go back to Firebase Console → **Authentication → Settings → Authorized domains**
   and add your Vercel domain (e.g. `gym-tracker.vercel.app`) so Google sign-in works in prod.

Vercel will auto-redeploy on every push to `main` from now on.

## Troubleshooting

- **Blank page / "Firebase not configured" screen:** env vars are missing or not prefixed with
  `VITE_`. Restart the dev server after editing `.env.local`.
- **"Missing or insufficient permissions"** when saving: you forgot to publish the Firestore rules
  in step 1.4.
- **Google sign-in popup closes immediately in production:** the Vercel domain isn't in Firebase's
  authorized domains list (step 3.5).
- **Deep link 404 on Vercel:** `vercel.json` should handle this — make sure it was committed.
