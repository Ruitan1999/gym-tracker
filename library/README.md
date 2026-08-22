# Editing the exercise library

The library ships with the app, so anything changed here reaches **everyone**
on the next deploy. It is not per-account.

```
npm run library      # apply what's below, then commit and deploy
```

Safe to run repeatedly. It reads the committed library, applies these
overrides on top, and writes it back.

## Adding a picture

Drop the image in `library/images/`, named after the exercise id:

```
library/images/ex-legs-028.jpg
```

`.jpg`, `.jpeg`, `.png` and `.webp` all work. The source images are 180×180;
anything much larger is wasted, since the app never shows one above 72px.

`npm run library` lists every exercise still without a picture, with its id.

`library/images/` is an inbox, not the store: once applied, the picture lives
in `public/exercise-images/` and stays there. Taking a file back out of the
inbox does not remove it. To drop a picture entirely, delete it from
`public/exercise-images/` and re-run.

## Editing, adding and removing

`library/overrides.json`:

```json
{
  "edit": {
    "ex-legs-028": { "name": "Belt Squat", "bodyPart": "legs" }
  },
  "add": [
    { "id": "own-sled-push", "name": "Sled Push", "bodyPart": "cardio" }
  ],
  "remove": ["ex-gv-1234"]
}
```

- **edit** — `name`, `bodyPart` or both. Ids are never changed: logged workouts
  reference them, and renumbering would orphan every set ever recorded.
- **add** — pick an id that is yours (`own-` is a good habit; `ex-gv-` means
  "came from the dataset"). Body part must be one of chest, back, shoulders,
  arms, forearms, core, legs, calves, neck, cardio.
- **remove** — takes the exercise out of the library for everyone. Anyone who
  has already logged it keeps their history: workouts store the id, and the
  entry stays in their own copy of the library.

A typo in an id stops the script rather than being ignored, so a change that
was meant to happen can't silently not happen.
