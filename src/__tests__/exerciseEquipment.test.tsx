import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import ExerciseSelect from '../components/shared/ExerciseSelect';
import { defaultExercises } from '../data/defaultExercises';
import { mergeExerciseLibrary } from '../utils/exerciseLibrary';
import {
  filterByEquipment,
  countByEquipment,
  exerciseSubtitle,
  EQUIPMENT_ORDER,
} from '../utils/exerciseEquipment';
import { parseLibrary, applyOverrides } from '../../scripts/lib/library.mjs';
import { equipmentFromDataset } from '../../scripts/lib/equipment.mjs';
import type { Exercise } from '../types';

const ex = (id: string, name: string, equipment?: Exercise['equipment'], isCustom = false): Exercise => ({
  id, name, bodyPart: 'chest', isCustom, ...(equipment ? { equipment } : {}),
});

describe('filterByEquipment', () => {
  const list = [ex('a', 'A', 'machine'), ex('b', 'B', 'cable'), ex('c', 'C', undefined, true)];

  it('returns everything for Any, including exercises with no equipment', () => {
    expect(filterByEquipment(list, null)).toEqual(list);
  });

  it('keeps only the chosen kit, and never an exercise with none', () => {
    expect(filterByEquipment(list, 'machine').map((e) => e.id)).toEqual(['a']);
    for (const kit of EQUIPMENT_ORDER) {
      expect(filterByEquipment(list, kit).some((e) => e.id === 'c')).toBe(false);
    }
  });

  it('counts per kit and ignores exercises with none', () => {
    expect(countByEquipment(list)).toEqual({ machine: 1, cable: 1 });
  });

  it('words the subtitle with and without kit', () => {
    expect(exerciseSubtitle(list[0], 'Chest')).toBe('Chest · Machine');
    expect(exerciseSubtitle(list[2], 'Chest')).toBe('Chest');
  });
});

describe('shipped library equipment', () => {
  it('tags every shipped exercise with a known kit', () => {
    expect(
      defaultExercises.filter((e) => !e.equipment || !EQUIPMENT_ORDER.includes(e.equipment)),
    ).toEqual([]);
  });

  it('has chest machines to find', () => {
    const chest = defaultExercises.filter((e) => e.bodyPart === 'chest');
    expect(filterByEquipment(chest, 'machine').length).toBeGreaterThan(5);
  });
});

describe('equipment reaching accounts that stored the library earlier', () => {
  const shipped = [ex('a', 'Bench Press', 'barbell')];

  it('adds it to a stored copy that predates the field', () => {
    const stored = [ex('a', 'Bench Press')];
    expect(mergeExerciseLibrary(stored, { shipped })[0].equipment).toBe('barbell');
  });

  it('adds it to an exercise the owner renamed, without touching the name', () => {
    const stored = [ex('a', 'My Bench')];
    const merged = mergeExerciseLibrary(stored, { shipped, renamed: ['a'] })[0];
    expect(merged.name).toBe('My Bench');
    expect(merged.equipment).toBe('barbell');
  });

  it('lets a corrected shipped value replace a stale stored one', () => {
    const stored = [ex('a', 'Bench Press', 'machine')];
    expect(mergeExerciseLibrary(stored, { shipped })[0].equipment).toBe('barbell');
  });

  it('keeps custom exercises without any', () => {
    const custom = ex('mine', 'Mine', undefined, true);
    const merged = mergeExerciseLibrary([custom], { shipped }).find((e) => e.id === 'mine')!;
    expect(merged).toEqual(custom);
    expect('equipment' in merged).toBe(false);
  });
});

describe('the picker equipment chips', () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom has no scrollTo; the picker scrolls back to the top on opening a part.
    Element.prototype.scrollTo = () => {};
  });

  function renderPicker() {
    localStorage.setItem(
      'gym-tracker-data',
      JSON.stringify({
        exercises: [
          ...defaultExercises,
          { id: 'mine', name: 'Zzz Home Press', bodyPart: 'chest', isCustom: true },
        ],
        workouts: [],
      }),
    );
    return render(
      <MemoryRouter>
        <AppProvider>
          <ExerciseSelect onSelect={() => {}} onClose={() => {}} />
        </AppProvider>
      </MemoryRouter>,
    );
  }

  function openChest() {
    fireEvent.click(screen.getByText('Chest').closest('button')!);
  }

  it('shows no chips until a body part is open', () => {
    renderPicker();
    expect(screen.queryByRole('group', { name: 'Filter by equipment' })).toBeNull();
    openChest();
    expect(screen.getByRole('group', { name: 'Filter by equipment' })).toBeTruthy();
  });

  it('narrows Chest to machines, labels each result, and Any brings it all back', () => {
    renderPicker();
    openChest();
    const total = screen.getAllByRole('listitem').length;
    expect(screen.getByText('Zzz Home Press')).toBeTruthy();

    const chips = screen.getByRole('group', { name: 'Filter by equipment' });
    expect(within(chips).getByRole('button', { name: 'Any' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(chips).getByRole('button', { name: 'Machine' }));

    const rows = screen.getAllByRole('listitem');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(total);
    for (const row of rows) expect(row.textContent).toContain('Chest · Machine');
    expect(screen.queryByText('Zzz Home Press')).toBeNull();

    fireEvent.click(within(chips).getByRole('button', { name: 'Any' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(total);
  });

  it('applies the chosen kit to search results too', () => {
    renderPicker();
    openChest();
    fireEvent.click(screen.getByRole('button', { name: 'Cable' }));
    fireEvent.change(screen.getByPlaceholderText('SEARCH TYPE TO FILTER'), {
      target: { value: 'press' },
    });
    const rows = screen.getAllByRole('listitem');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.textContent).toContain('Cable');
  });
});

describe('library scripts', () => {
  it('reads equipment back from the generated file', () => {
    const rows = parseLibrary(
      `  { id: 'a', name: "Bench Press", bodyPart: 'chest', equipment: 'barbell', isCustom: false },\n` +
        `  { id: 'b', name: "Old", bodyPart: 'chest', isCustom: false },`,
    );
    expect(rows.map((r) => r.equipment)).toEqual(['barbell', undefined]);
  });

  it('lets overrides set equipment, and rejects one that is not a kit', () => {
    const rows = [{ id: 'a', name: 'A', bodyPart: 'chest' as const }];
    const out = applyOverrides(rows, { edit: { a: { equipment: 'cable' } }, add: [], remove: [] });
    expect(out[0].equipment).toBe('cable');
    expect(() =>
      applyOverrides(rows, { edit: { a: { equipment: 'laser' as never } }, add: [], remove: [] }),
    ).toThrow();
  });

  it('folds dataset values onto the fixed set and refuses unknown ones', () => {
    expect(equipmentFromDataset('leverage machine')).toBe('machine');
    expect(equipmentFromDataset('ez barbell')).toBe('barbell');
    expect(() => equipmentFromDataset('flux capacitor')).toThrow();
  });
});
