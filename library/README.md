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

Drop a `.jpg` or `.png` and it stays that format. Run `npm run library:compress`
to re-encode everything in the store as WebP — around 40% smaller on these
drawings with nothing visible to tell them apart at the size they are shown —
then `npm run library` to update the filename map. `--check` reports the saving
without touching anything. Pictures uploaded through the app are already
encoded this way on the way in.

`npm run library` lists every exercise still without a picture, with its id.

`library/images/` is an inbox, not the store: once applied, the picture lives
in `public/assets/exercise-images/` and stays there. Taking a file back out of the
inbox does not remove it. To drop a picture entirely, delete it from
`public/assets/exercise-images/` and re-run.

**Replacing a picture keeps the filename, and the filename is cached for a
year.** Everything under `/assets/` is served immutable, which is what makes
these load instantly on every visit after the first. The cost is that swapping
`ex-legs-028.jpg` for a different image leaves anyone who has already seen it
looking at the old one until their cache expires. To make a replacement reach
people, give it a new name: drop it in as `ex-legs-028-v2.jpg` and the
generator records the new filename against the same exercise.

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
