import { markRetry, reloadFresh, retriesExhausted } from './lazyWithRetry';

/**
 * Recovers a page whose stylesheet never arrived.
 *
 * A deploy replaces the hashed assets and removes the previous ones. A browser
 * still holding the old index.html then asks for a CSS file that is no longer
 * there, gets a 404, and renders the whole app unstyled — every screen, no
 * error, nothing to act on.
 *
 * lazyWithRetry already covers this for route chunks, but a stylesheet is not
 * loaded through JavaScript so nothing noticed it. It shares that retry guard
 * rather than keeping its own, so a stylesheet reload and a chunk reload can't
 * take turns reloading forever.
 */

/**
 * Whether a stylesheet this document asked for failed to load.
 *
 * `link.sheet` is null for a stylesheet that 404'd or was blocked, and a
 * CSSStyleSheet once it has parsed — so this only means anything after load.
 * A document that links no stylesheet at all is not broken, just bare.
 */
export function stylesheetMissing(doc: Document = document): boolean {
  const links = Array.from(
    doc.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]'),
  ).filter((link) => !link.disabled && !!link.getAttribute('href'));

  if (links.length === 0) return false;
  return links.every((link) => !link.sheet);
}

/**
 * Reloads once, cache-bust and all, if the stylesheet is missing.
 *
 * Returns whether a reload was started, which is what makes it testable —
 * nothing else about it is observable.
 */
export function recoverMissingStylesheet(doc: Document = document): boolean {
  if (!stylesheetMissing(doc)) return false;
  // Reloading has already been tried and the styles are still not here, so the
  // problem is not a stale document. Unstyled beats a reload loop.
  if (retriesExhausted()) return false;
  markRetry();
  reloadFresh();
  return true;
}

/** Checks once the page has settled, when link.sheet is meaningful. */
export function guardStylesheet(): void {
  if (typeof window === 'undefined') return;
  const check = () => recoverMissingStylesheet();
  if (document.readyState === 'complete') check();
  else window.addEventListener('load', check, { once: true });
}
