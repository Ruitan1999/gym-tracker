import type { BodyPart, Exercise } from '../types';
import { defaultExercises } from '../data/defaultExercises';

/**
 * Admin changes to the shipped library, held in one document everybody reads.
 *
 * The library itself ships with the app, so this is the layer that lets it be
 * corrected without a deploy: a picture for an exercise that has none, a name
 * that was wrong, an exercise nobody should see.
 */
export interface LibraryOverrides {
  edits: Record<string, { name?: string; bodyPart?: BodyPart; image?: string }>;
  added: { id: string; name: string; bodyPart: BodyPart; image?: string }[];
  removed: string[];
}

export const EMPTY_OVERRIDES: LibraryOverrides = { edits: {}, added: [], removed: [] };

/** Anything stored is whatever was written last, so nothing here is assumed. */
export function readOverrides(raw: unknown): LibraryOverrides {
  const o = (raw ?? {}) as Partial<LibraryOverrides>;
  return {
    edits: o.edits && typeof o.edits === 'object' ? o.edits : {},
    added: Array.isArray(o.added) ? o.added.filter((e) => e && e.id && e.name && e.bodyPart) : [],
    removed: Array.isArray(o.removed) ? o.removed.filter((id) => typeof id === 'string') : [],
  };
}

export interface AppliedLibrary {
  exercises: Exercise[];
  /** Pictures the admin has set, which win over anything shipped. */
  images: Record<string, string>;
}

/**
 * The shipped library as everyone should currently see it.
 *
 * Removals are applied last so an exercise can be edited and then retired
 * without the two steps having to know about each other.
 */
export function applyLibraryOverrides(
  overrides: LibraryOverrides,
  base: Exercise[] = defaultExercises,
): AppliedLibrary {
  const images: Record<string, string> = {};

  const edited = base.map((exercise) => {
    const change = overrides.edits[exercise.id];
    if (!change) return exercise;
    if (change.image) images[exercise.id] = change.image;
    if (!change.name && !change.bodyPart) return exercise;
    return {
      ...exercise,
      ...(change.name ? { name: change.name } : {}),
      ...(change.bodyPart ? { bodyPart: change.bodyPart } : {}),
    };
  });

  const known = new Set(edited.map((e) => e.id));
  for (const entry of overrides.added) {
    if (known.has(entry.id)) continue;
    if (entry.image) images[entry.id] = entry.image;
    edited.push({ id: entry.id, name: entry.name, bodyPart: entry.bodyPart, isCustom: false });
    known.add(entry.id);
  }

  const removed = new Set(overrides.removed);
  return {
    exercises: removed.size === 0 ? edited : edited.filter((e) => !removed.has(e.id)),
    images,
  };
}
