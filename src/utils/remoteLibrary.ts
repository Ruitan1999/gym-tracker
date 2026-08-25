import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { readOverrides, EMPTY_OVERRIDES, type LibraryOverrides } from './libraryOverrides';

/** One document, read by everyone, written by an admin. */
const DOC = ['library', 'overrides'] as const;
const IMAGE_PATH = 'library-images';

/**
 * Turns a failure into something worth reading on a phone.
 *
 * Setting this up means getting two sets of security rules right, and every way
 * of getting them wrong produces the same silence. The Firebase error code is
 * the one thing that separates "your rules rejected this" from "you are
 * offline", so it goes on screen rather than only into the console.
 */
export function describeFailure(err: unknown, subject: string): string {
  const code = (err as { code?: unknown })?.code;
  switch (typeof code === 'string' ? code : '') {
    case 'permission-denied':
    case 'storage/unauthorized':
      return `${subject} was refused by the security rules. Check the uid in them matches the account id at the bottom of Settings.`;
    case 'unauthenticated':
    case 'storage/unauthenticated':
      return `${subject} needs you signed in. Sign out and back in, then try again.`;
    case 'unavailable':
    case 'storage/retry-limit-exceeded':
      return `${subject} couldn't reach Firebase. Check your connection and try again.`;
    case 'storage/unknown':
    case 'storage/object-not-found':
      return `${subject} failed — Storage may not be turned on for this project yet.`;
    default:
      return typeof code === 'string' && code
        ? `${subject} failed (${code}).`
        : `${subject} failed.`;
  }
}

/**
 * The admin layer, or nothing at all.
 *
 * Never throws: the shipped library has to work whatever the network or the
 * security rules are doing, and an app that won't open because a corrections
 * document is unreachable is worse than one showing last week's names.
 */
export async function loadLibraryOverrides(): Promise<LibraryOverrides> {
  if (!db) return EMPTY_OVERRIDES;
  try {
    const snap = await getDoc(doc(db, ...DOC));
    return snap.exists() ? readOverrides(snap.data()) : EMPTY_OVERRIDES;
  } catch (err) {
    console.error('Failed to load library overrides:', err);
    return EMPTY_OVERRIDES;
  }
}

export async function saveLibraryOverrides(overrides: LibraryOverrides): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  await setDoc(doc(db, ...DOC), { ...overrides, updatedAt: new Date().toISOString() });
}

/**
 * Shrinks a picture to the size the app actually shows before it goes
 * anywhere. A photo off a phone is several megabytes and would be handed to
 * every user of the app at full size for a 72px thumbnail.
 */
export interface PreparedImage {
  blob: Blob;
  /** The extension the blob was actually encoded as, not the one asked for. */
  ext: 'webp' | 'jpg';
  type: string;
}

export async function prepareImage(file: File, size = 180): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not read the image');

  // Square, cropped from the middle, so nothing is stretched.
  const side = Math.min(bitmap.width, bitmap.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );
  bitmap.close?.();

  // WebP first: on these drawings it comes out around 40% smaller than JPEG
  // for no visible difference at the size they are shown. toBlob falls back to
  // PNG rather than failing on a browser that cannot encode it, so the type is
  // checked rather than assumed.
  const webp = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', 0.86),
  );
  if (webp && webp.type === 'image/webp') {
    return { blob: webp, ext: 'webp', type: 'image/webp' };
  }

  const jpeg = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85),
  );
  if (!jpeg) throw new Error('Could not prepare the image');
  return { blob: jpeg, ext: 'jpg', type: 'image/jpeg' };
}

/**
 * Without this, Storage serves an uploaded file with no caching at all — every
 * request for it, including the exact same URL on a screen the owner just
 * left and came back to, goes out over the network again. A day is long
 * enough to make that disappear in normal use, short enough that replacing a
 * picture is not stuck behind a stale copy for long.
 */
const IMAGE_CACHE_CONTROL = 'public, max-age=86400';

export async function uploadExerciseImage(exerciseId: string, file: File): Promise<string> {
  if (!storage) throw new Error('Firebase Storage is not configured');
  const { blob, ext, type } = await prepareImage(file);
  const target = ref(storage, `${IMAGE_PATH}/${exerciseId}.${ext}`);
  await uploadBytes(target, blob, { contentType: type, cacheControl: IMAGE_CACHE_CONTROL });
  return getDownloadURL(target);
}

/**
 * A picture for one of the owner's own exercises.
 *
 * Kept under their uid rather than alongside the shared ones: nobody else has
 * the exercise, so nobody else should be carrying the picture — and it means
 * the write rule is the one they already have for their own data.
 */
export async function uploadOwnExerciseImage(
  uid: string,
  exerciseId: string,
  file: File,
): Promise<string> {
  if (!storage) throw new Error('Firebase Storage is not configured');
  const { blob, ext, type } = await prepareImage(file);
  const target = ref(storage, `users/${uid}/${IMAGE_PATH}/${exerciseId}.${ext}`);
  await uploadBytes(target, blob, { contentType: type, cacheControl: IMAGE_CACHE_CONTROL });
  return getDownloadURL(target);
}
