import type { BodyPart } from '../../types';

export interface Shape {
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
}

/**
 * The one figure drawing: the saved-session BodyMap and the small session-card
 * map both draw from these shapes, so they can never drift apart.
 *
 * A blocky figure rather than an anatomical one. At the size this renders it
 * would be a smudge either way, and squared-off slabs sit with the rest of the
 * app better than a traced silhouette would.
 */
export const VIEW_W = 120;
export const VIEW_H = 190;

const ARMS: Shape[] = [
  { x: 26, y: 48, w: 13, h: 26, rx: 4 },
  { x: 81, y: 48, w: 13, h: 26, rx: 4 },
];
const FOREARMS: Shape[] = [
  { x: 26, y: 76, w: 12, h: 26, rx: 4 },
  { x: 82, y: 76, w: 12, h: 26, rx: 4 },
];
const SHOULDERS: Shape[] = [
  { x: 28, y: 34, w: 16, h: 12, rx: 3 },
  { x: 76, y: 34, w: 16, h: 12, rx: 3 },
];
const LEGS: Shape[] = [
  { x: 45, y: 100, w: 14, h: 42, rx: 4 },
  { x: 61, y: 100, w: 14, h: 42, rx: 4 },
];
const CALVES: Shape[] = [
  { x: 46, y: 144, w: 12, h: 38, rx: 4 },
  { x: 62, y: 144, w: 12, h: 38, rx: 4 },
];
const NECK: Shape[] = [{ x: 55, y: 27, w: 10, h: 6, rx: 2 }];
const UPPER_TORSO: Shape = { x: 44, y: 34, w: 32, h: 22, rx: 3 };
const LOWER_TORSO: Shape = { x: 46, y: 58, w: 28, h: 26, rx: 3 };

/** Head and hips belong to no muscle group, so they never light up. */
export const INERT: Shape[] = [
  { x: 50, y: 4, w: 20, h: 20, rx: 5 },
  { x: 44, y: 86, w: 32, h: 12, rx: 3 },
];

export const FRONT: Partial<Record<BodyPart, Shape[]>> = {
  neck: NECK,
  shoulders: SHOULDERS,
  chest: [UPPER_TORSO],
  core: [LOWER_TORSO],
  arms: ARMS,
  forearms: FOREARMS,
  legs: LEGS,
  calves: CALVES,
};

// From behind there is no chest and no abdomen: the whole trunk is back.
export const BACK: Partial<Record<BodyPart, Shape[]>> = {
  neck: NECK,
  shoulders: SHOULDERS,
  back: [UPPER_TORSO, LOWER_TORSO],
  arms: ARMS,
  forearms: FOREARMS,
  legs: LEGS,
  calves: CALVES,
};
