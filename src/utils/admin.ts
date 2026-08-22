/**
 * Who sees the library admin screen.
 *
 * Set VITE_ADMIN_UIDS to a comma-separated list of Firebase uids. This only
 * decides whether the screen is offered — what actually protects the shared
 * library is the Firestore and Storage rules, which is where it belongs. A
 * build with nobody listed simply has no admin.
 */
const ADMIN_UIDS = (import.meta.env.VITE_ADMIN_UIDS ?? '')
  .split(',')
  .map((id: string) => id.trim())
  .filter(Boolean);

export function isAdmin(uid: string | null | undefined): boolean {
  return !!uid && ADMIN_UIDS.includes(uid);
}
