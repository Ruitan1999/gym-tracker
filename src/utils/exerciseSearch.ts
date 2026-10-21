import type { BodyPart, Exercise } from '../types';
import { BODY_PART_LABELS } from './bodyParts';

/**
 * Names are matched on their words, not as one string.
 *
 * Typed into a search box, "press bench" and "bench press" mean the same
 * thing, and "inc bench" means the incline one. A plain substring test answers
 * none of those: it only finds a name that happens to contain the letters in
 * the order they were typed, so the right exercise is sitting there while the
 * list says there is nothing.
 */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    // Strip accents, so "preacher" matches however it was typed.
    .replace(/[̀-ͯ]/g, '')
    // Punctuation is a separator, not a character to match: "pull-up" and
    // "pull up" are the same exercise typed two ways.
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface Scored {
  exercise: Exercise;
  score: number;
}

/**
 * How well one word of the query matches one name, or 0 for not at all.
 *
 * A word that starts a word in the name counts for far more than one found in
 * the middle of one: typing "row" means the rows, not every exercise with
 * "narrow" in it.
 */
function scoreTerm(term: string, words: string[], haystack: string, bodyPart: string): number {
  if (words.some((word) => word === term)) return 60;
  if (words.some((word) => word.startsWith(term))) return 40;
  if (bodyPart.startsWith(term)) return 25;
  if (haystack.includes(term)) return 10;
  return 0;
}

/**
 * The exercises worth showing for what has been typed, best first.
 *
 * Every word typed has to be found somewhere, so each one narrows the list
 * rather than widening it, and the body part counts as a word — "chest" brings
 * up the chest exercises without anyone having to know what they are called.
 */
export function searchExercises(exercises: Exercise[], query: string): Exercise[] {
  const normalisedQuery = normalise(query);
  if (!normalisedQuery) return [];
  const terms = normalisedQuery.split(' ');

  const scored: Scored[] = [];
  for (const exercise of exercises) {
    const haystack = normalise(exercise.name);
    const words = haystack.split(' ');
    const bodyPart = normalise(BODY_PART_LABELS[exercise.bodyPart] ?? exercise.bodyPart);

    let score = 0;
    let matchedAll = true;
    for (const term of terms) {
      const termScore = scoreTerm(term, words, haystack, bodyPart);
      if (termScore === 0) {
        matchedAll = false;
        break;
      }
      score += termScore;
    }
    if (!matchedAll) continue;

    // The whole query as typed, sitting at the front of the name, is as close
    // to "this one" as a search gets.
    if (haystack === normalisedQuery) score += 200;
    else if (haystack.startsWith(normalisedQuery)) score += 100;

    // Between two that match equally well, the shorter name is the plainer
    // one — "Bench Press" ahead of "Bench Press Machine Converging".
    score -= Math.min(words.length, 8);

    scored.push({ exercise, score });
  }

  return scored
    .sort((a, b) =>
      b.score - a.score || a.exercise.name.localeCompare(b.exercise.name),
    )
    .map((s) => s.exercise);
}

/** The body parts that have anything in them, with their counts. */
export function countByBodyPart(exercises: Exercise[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const exercise of exercises) {
    counts[exercise.bodyPart] = (counts[exercise.bodyPart] ?? 0) + 1;
  }
  return counts;
}

export type { BodyPart };
