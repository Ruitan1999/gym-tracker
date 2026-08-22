import { describe, it, expect } from 'vitest';
import { describeFailure } from '../utils/remoteLibrary';

/** What Firebase actually throws: an Error carrying a `code`. */
const fail = (code: string) => Object.assign(new Error(code), { code });

describe('describeFailure', () => {
  it('names the rules when the rules are what refused it', () => {
    expect(describeFailure(fail('permission-denied'), 'Saving')).toContain('security rules');
    expect(describeFailure(fail('storage/unauthorized'), 'The upload')).toContain('security rules');
  });

  it('points at the account id, which is the half people get wrong', () => {
    expect(describeFailure(fail('permission-denied'), 'Saving')).toContain('Settings');
  });

  it('separates being signed out from being refused', () => {
    const message = describeFailure(fail('unauthenticated'), 'Saving');
    expect(message).toContain('signed in');
    expect(message).not.toContain('security rules');
  });

  it('separates a network problem from a permissions one', () => {
    const message = describeFailure(fail('unavailable'), 'Saving');
    expect(message).toContain('connection');
    expect(message).not.toContain('security rules');
  });

  it('suggests Storage is off when Storage answers like it is', () => {
    expect(describeFailure(fail('storage/unknown'), 'The upload')).toContain('Storage');
  });

  it('still shows an unrecognised code rather than swallowing it', () => {
    expect(describeFailure(fail('resource-exhausted'), 'Saving')).toBe(
      'Saving failed (resource-exhausted).',
    );
  });

  it('says something sensible for a throw that carries no code at all', () => {
    expect(describeFailure(new Error('boom'), 'Saving')).toBe('Saving failed.');
    expect(describeFailure(undefined, 'Saving')).toBe('Saving failed.');
    expect(describeFailure({ code: 42 }, 'Saving')).toBe('Saving failed.');
  });

  it('always leads with what was being attempted', () => {
    for (const code of ['permission-denied', 'unavailable', 'nonsense', '']) {
      expect(describeFailure(fail(code), 'The upload').startsWith('The upload')).toBe(true);
    }
  });
});
