# Editing the library from the app

Settings → **ADMIN · EXERCISE LIBRARY**. From there you can, for everyone:

- set or replace an exercise's picture (from the phone's camera or gallery)
- rename it, or move it to another muscle group
- take it out of the library

Changes are live for everyone the next time their app starts. No deploy.

Everything lands in one Firestore document, `library/overrides`, which every
app reads at startup. Pictures go to Firebase Storage under `library-images/`.

---

## One-time setup

Nothing below is optional — without it the screen is hidden, and saving fails.

### 1. Say who the admin is

Your account id is printed at the bottom of Settings — tap it to copy. It's
also in Firebase console → Authentication → Users → **User UID**.

It is *not* the `web:…` id in the Firebase config block or the console URL:
that identifies the app, not you, and is the same for everyone. An account id
is 28 characters, letters and digits, no dashes.

Set it in Vercel (Project → Settings → Environment Variables) and redeploy:

```
VITE_ADMIN_UIDS=<your uid>
```

No quotes around the value — Vercel stores them literally and the id won't
match. Several admins: comma-separate them. Nobody listed means no admin,
which is the right default for a build that doesn't need one.

The value is read when the app is *built*, so it takes a new deployment to
change, and the environment you set it in has to be the one you're visiting —
setting it on Preview alone leaves Production without an admin.

This only decides whether the screen is *offered*. What actually protects the
library is the two rule blocks below — a hidden button is not security.

**If the screen doesn't appear**, the line under your account id in Settings
says which half is wrong:

| It says | What happened |
| --- | --- |
| `ADMIN · NOT SET IN THIS BUILD` | the variable never reached the build — wrong environment, misspelt name, or the deploy predates it |
| `ADMIN · ANOTHER ACCOUNT` | the build has a uid, but not this one — a typo, stray quotes, or a different account |
| nothing at all | you are the admin; the screen is in the ADMIN section above |

### 2. Let everyone read the corrections, and only you write them

Firebase console → Firestore Database → Rules. Add this **inside** the
existing `match /databases/{database}/documents { ... }` block, alongside
whatever rule already covers `users`:

```
match /library/{document} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == '<your uid>';
}
```

Reading is open because every app needs the corrections, signed in or not.
It holds exercise names and picture URLs — nothing personal.

### 3. Turn on Storage, and the same rule for pictures

Firebase console → Storage → **Get started**. Then its Rules tab:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /library-images/{image} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == '<your uid>';
    }
  }
}
```

Check `VITE_FIREBASE_STORAGE_BUCKET` is set in Vercel too — it's in the same
Firebase config block as the other keys.

---

## What happens to people who already have the exercise

Every account keeps its own copy of the library, so that a name *they* changed
survives. That means corrections have to win over that copy, or they'd never
reach anyone. So:

- **Renaming** reaches everyone, except anyone who renamed that exercise
  themselves — their name is theirs.
- **Moving** a muscle group reaches everyone. It isn't something an individual
  can change, so there is nothing to protect.
- **Removing** takes it out of the library, but anyone who has already logged
  it keeps it, or their history would lose the name of a real session.

## If saving fails

The screen says so rather than pretending. It's almost always the rules: an
edit that won't save means the Firestore block, a picture that won't upload
means Storage isn't enabled or its rules don't have your uid.

## The other way to do this

`library/README.md` covers editing the library in the repo instead — a script,
a commit and a deploy. It's the better route for a large batch, since it costs
nothing at runtime and the images are versioned alongside the code. This screen
is for fixing one thing from your phone.
