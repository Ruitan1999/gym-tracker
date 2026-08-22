import { describe, it, expect } from 'vitest';
// The admin tooling is plain node, but its rules are worth pinning down: a
// mistake here reaches every user on the next deploy.
import { applyOverrides, BODY_PARTS } from '../../scripts/lib/library.mjs';
import type { LibraryEntry, Overrides } from '../../scripts/lib/library.mjs';

const library = (): LibraryEntry[] => [
  { id: 'ex-legs-001', name: 'Squat', bodyPart: 'legs' },
  { id: 'ex-gv-0001', name: 'Sit-Up', bodyPart: 'core' },
];
const empty: Overrides = { edit: {}, add: [], remove: [] };

describe('applyOverrides', () => {
  it('renames and re-files an exercise', () => {
    const out = applyOverrides(library(), {
      ...empty,
      edit: { 'ex-legs-001': { name: 'Back Squat', bodyPart: 'calves' } },
    });
    expect(out.find((e) => e.id === 'ex-legs-001')).toEqual({
      id: 'ex-legs-001',
      name: 'Back Squat',
      bodyPart: 'calves',
    });
  });

  it('takes just a name, leaving the body part alone', () => {
    const out = applyOverrides(library(), { ...empty, edit: { 'ex-legs-001': { name: 'Back Squat' } } });
    expect(out.find((e) => e.id === 'ex-legs-001')!.bodyPart).toBe('legs');
  });

  it('adds and removes', () => {
    const out = applyOverrides(library(), {
      ...empty,
      add: [{ id: 'own-carry', name: 'Zercher Carry', bodyPart: 'core' }],
      remove: ['ex-gv-0001'],
    });
    expect(out.map((e) => e.id)).toEqual(['ex-legs-001', 'own-carry']);
  });

  it('does nothing at all when there is nothing to do', () => {
    expect(applyOverrides(library(), empty)).toEqual(library());
  });

  // Each of these would otherwise be a change that silently never happened.
  it('refuses to edit an id that is not there', () => {
    expect(() => applyOverrides(library(), { ...empty, edit: { nope: { name: 'X' } } })).toThrow(/no exercise with id/);
  });

  it('refuses to remove an id that is not there', () => {
    expect(() => applyOverrides(library(), { ...empty, remove: ['nope'] })).toThrow(/no exercise with id/);
  });

  it('refuses to add an id already in use', () => {
    expect(() =>
      applyOverrides(library(), { ...empty, add: [{ id: 'ex-legs-001', name: 'X', bodyPart: 'legs' }] }),
    ).toThrow(/already in the library/);
  });

  // These come from hand-edited JSON, so the types say nothing about them and
  // the runtime check is the only thing standing between a typo and a deploy.
  const malformed = (o: unknown) => o as Overrides;

  it('refuses an incomplete addition', () => {
    expect(() =>
      applyOverrides(library(), malformed({ ...empty, add: [{ id: 'own-x', name: 'X' }] })),
    ).toThrow(/needs id, name and bodyPart/);
  });

  it('refuses a body part that is not one of ours', () => {
    expect(() =>
      applyOverrides(
        library(),
        malformed({ ...empty, add: [{ id: 'own-x', name: 'X', bodyPart: 'biceps' }] }),
      ),
    ).toThrow(/is not a body part/);
    expect(() =>
      applyOverrides(library(), malformed({ ...empty, edit: { 'ex-legs-001': { bodyPart: 'biceps' } } })),
    ).toThrow(/is not a body part/);
  });

  it('offers the same body parts the app knows', () => {
    expect(BODY_PARTS).toContain('chest');
    expect(BODY_PARTS).toHaveLength(10);
  });
});
