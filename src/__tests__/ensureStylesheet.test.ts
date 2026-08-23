import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { stylesheetMissing, recoverMissingStylesheet } from '../utils/ensureStylesheet';

const RETRY_KEY = 'liftgauge.chunkRetry.v2';

/**
 * jsdom never fetches a stylesheet, so `sheet` is null either way. These build
 * the document by hand and say outright which links loaded.
 */
function docWith(links: { href?: string; loaded: boolean; disabled?: boolean }[]): Document {
  const doc = document.implementation.createHTMLDocument('t');
  for (const spec of links) {
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    if (spec.href !== undefined) link.setAttribute('href', spec.href);
    if (spec.disabled) link.disabled = true;
    Object.defineProperty(link, 'sheet', {
      value: spec.loaded ? ({} as CSSStyleSheet) : null,
      configurable: true,
    });
    doc.head.appendChild(link);
  }
  return doc;
}

/** jsdom's location cannot be spied on, so it is replaced wholesale. */
let replace: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  replace = vi.fn();
  vi.stubGlobal('location', {
    href: 'https://example.test/history',
    replace,
    reload: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('stylesheetMissing', () => {
  it('is true when the only stylesheet failed to load', () => {
    expect(stylesheetMissing(docWith([{ href: '/assets/a.css', loaded: false }]))).toBe(true);
  });

  it('is false when it loaded', () => {
    expect(stylesheetMissing(docWith([{ href: '/assets/a.css', loaded: true }]))).toBe(false);
  });

  it('is false when any stylesheet loaded', () => {
    // One failing font sheet is not the app losing its styles.
    const doc = docWith([
      { href: '/assets/a.css', loaded: true },
      { href: 'https://fonts/x.css', loaded: false },
    ]);
    expect(stylesheetMissing(doc)).toBe(false);
  });

  it('is false for a document that links no stylesheet at all', () => {
    // Bare, not broken — reloading would achieve nothing.
    expect(stylesheetMissing(docWith([]))).toBe(false);
  });

  it('ignores links with no href, and disabled ones', () => {
    expect(stylesheetMissing(docWith([{ loaded: false }]))).toBe(false);
    expect(
      stylesheetMissing(docWith([{ href: '/a.css', loaded: false, disabled: true }])),
    ).toBe(false);
  });
});

describe('recoverMissingStylesheet', () => {
  it('reloads when the stylesheet is missing', () => {
    expect(recoverMissingStylesheet(docWith([{ href: '/assets/a.css', loaded: false }]))).toBe(true);
    expect(replace).toHaveBeenCalledOnce();
  });

  it('leaves a working page alone', () => {
    expect(recoverMissingStylesheet(docWith([{ href: '/assets/a.css', loaded: true }]))).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('busts the cache, since a stale document would just come back', () => {
    recoverMissingStylesheet(docWith([{ href: '/assets/a.css', loaded: false }]));
    const url = replace.mock.calls[0][0] as string;
    expect(url).toContain('_fresh=');
  });

  it('reloads once and then gives up, rather than looping forever', () => {
    const broken = () => docWith([{ href: '/assets/a.css', loaded: false }]);

    expect(recoverMissingStylesheet(broken())).toBe(true);
    // Same page, still broken, guard already spent.
    expect(recoverMissingStylesheet(broken())).toBe(false);
    expect(replace).toHaveBeenCalledOnce();
  });

  it('shares the guard with the chunk retry, so the two cannot take turns', () => {
    localStorage.setItem(RETRY_KEY, JSON.stringify({ at: Date.now(), count: 1 }));

    expect(recoverMissingStylesheet(docWith([{ href: '/assets/a.css', loaded: false }]))).toBe(
      false,
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it('tries again for a failure well after the last one', () => {
    localStorage.setItem(RETRY_KEY, JSON.stringify({ at: Date.now() - 120_000, count: 1 }));

    expect(recoverMissingStylesheet(docWith([{ href: '/assets/a.css', loaded: false }]))).toBe(true);
  });
});
