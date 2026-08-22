import type { BodyPart } from '../../src/types';

export interface LibraryEntry {
  id: string;
  name: string;
  bodyPart: BodyPart;
}

export interface Overrides {
  edit: Record<string, { name?: string; bodyPart?: BodyPart }>;
  add: { id: string; name: string; bodyPart: BodyPart }[];
  remove: string[];
}

export declare const BODY_PARTS: BodyPart[];

export declare function applyOverrides(
  exercises: LibraryEntry[],
  overrides: Overrides,
  options?: { log?: (message: string) => void },
): LibraryEntry[];

export declare function parseLibrary(source?: string): LibraryEntry[];
export declare function readOverrides(): Overrides;
export declare function syncImages(
  exercises: LibraryEntry[],
  options?: { log?: (message: string) => void },
): Record<string, string>;
export declare function writeLibrary(
  exercises: LibraryEntry[],
  ownImages: Record<string, string>,
  options?: { imported?: number },
): void;

export declare const PUBLIC_IMAGES: string;
export declare const DROP_DIR: string;
export declare const OVERRIDES: string;
