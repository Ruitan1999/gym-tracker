import { describe, it, expect } from 'vitest';
import { buildJsonExport, buildCsvExport, exportFileName } from '../utils/exportData';
import { DEFAULT_PREFERENCES, type AppData } from '../types';

function data(over: Partial<AppData> = {}): AppData {
  return {
    exercises: [
      { id: 'bench', name: 'Bench Press', bodyPart: 'chest', isCustom: false },
      { id: 'sq', name: 'Squat, "Low Bar"', bodyPart: 'legs', isCustom: true },
    ],
    workouts: [
      {
        id: 'w1',
        date: '2026-10-02',
        name: 'Push day',
        notes: 'Rating: 8\nfelt good',
        createdAt: '2026-10-02T10:00:00Z',
        entries: [
          {
            id: 'e1',
            exerciseId: 'bench',
            sets: [
              { setNumber: 1, reps: 5, weightKg: 100 },
              { setNumber: 2, reps: 4, weightKg: 102.5 },
            ],
          },
        ],
      },
    ],
    groups: [],
    preferences: { ...DEFAULT_PREFERENCES },
    dataVersion: 3,
    ...over,
  };
}

const lines = (csv: string) => csv.slice(1).trimEnd().split('\r\n');

describe('buildCsvExport', () => {
  it('starts with a BOM and the header; empty data is header only', () => {
    const csv = buildCsvExport(data({ workouts: [] }));
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(lines(csv)).toEqual(['date,workout,exercise,set,weight,unit,reps,rpe']);
  });

  it('writes one row per set with the session rating', () => {
    expect(lines(buildCsvExport(data()))).toEqual([
      'date,workout,exercise,set,weight,unit,reps,rpe',
      '2026-10-02,Push day,Bench Press,1,100,kg,5,8',
      '2026-10-02,Push day,Bench Press,2,102.5,kg,4,8',
    ]);
  });

  it('leaves rpe empty without a rating, and a missing workout name empty', () => {
    const d = data();
    d.workouts[0] = { ...d.workouts[0], name: undefined, notes: 'just notes' };
    expect(lines(buildCsvExport(d))[1]).toBe('2026-10-02,,Bench Press,1,100,kg,5,');
  });

  it('converts to lb with a unit column', () => {
    const d = data({ preferences: { ...DEFAULT_PREFERENCES, weightUnit: 'lb' } });
    expect(lines(buildCsvExport(d))[1]).toBe('2026-10-02,Push day,Bench Press,1,220.46,lb,5,8');
  });

  it('escapes quotes, commas and newlines', () => {
    const d = data();
    d.workouts[0] = {
      ...d.workouts[0],
      name: 'Legs\nand "more"',
      entries: [{ id: 'e', exerciseId: 'sq', sets: [{ setNumber: 1, reps: 1, weightKg: 0 }] }],
    };
    expect(buildCsvExport(d)).toContain('"Legs\nand ""more""","Squat, ""Low Bar""",1,0,kg,1,8');
  });

  it('defuses formula injection in text cells only', () => {
    for (const bad of ['=SUM(A1)', '+1', '-2', '@x']) {
      const d = data();
      d.workouts[0] = { ...d.workouts[0], name: bad };
      expect(lines(buildCsvExport(d))[1].split(',')[1]).toBe(`'${bad}`);
    }
    expect(lines(buildCsvExport(data()))[1]).toContain(',100,kg,');
  });

  it('applies an inclusive date range', () => {
    const d = data();
    d.workouts = ['2026-10-01', '2026-10-05', '2026-10-09'].map((date, i) => ({
      ...d.workouts[0],
      id: `w${i}`,
      date,
    }));
    const dates = (r: { from?: string; to?: string }) =>
      lines(buildCsvExport(d, r))
        .slice(1)
        .map((l) => l.slice(0, 10));
    expect(new Set(dates({ from: '2026-10-05' }))).toEqual(new Set(['2026-10-05', '2026-10-09']));
    expect(new Set(dates({ to: '2026-10-05' }))).toEqual(new Set(['2026-10-01', '2026-10-05']));
    expect(new Set(dates({ from: '2026-10-05', to: '2026-10-05' }))).toEqual(new Set(['2026-10-05']));
    expect(dates({ from: '2027-01-01' })).toEqual([]);
  });

  it('falls back to Unknown exercise for ids missing from the library', () => {
    const d = data({ exercises: [] });
    expect(lines(buildCsvExport(d))[1]).toContain(',Unknown exercise,');
  });

  it('does not mutate app data', () => {
    const d = data();
    const before = JSON.stringify(d);
    buildCsvExport(d, { from: '2026-01-01' });
    buildJsonExport(d);
    expect(JSON.stringify(d)).toBe(before);
  });
});

describe('buildJsonExport', () => {
  it('is a pretty-printed full backup with a header', () => {
    const d = data({
      deletedExerciseIds: ['x'],
      renamedExerciseIds: ['y'],
      exerciseImages: { sq: 'https://example.com/a.png' },
    });
    const now = new Date('2026-10-28T12:00:00Z');
    const text = buildJsonExport(d, now);
    expect(text).toContain('\n  "app": "gym-tracker"');
    const parsed = JSON.parse(text);
    expect(parsed.app).toBe('gym-tracker');
    expect(parsed.exportedAt).toBe(now.toISOString());
    expect(parsed.dataVersion).toBe(3);
    expect(parsed.data).toEqual(d);
  });
});

describe('exportFileName', () => {
  it('uses the local date', () => {
    expect(exportFileName('csv', new Date(2026, 9, 28, 23, 59))).toBe('gym-tracker-2026-10-28.csv');
    expect(exportFileName('json', new Date(2026, 0, 5))).toBe('gym-tracker-2026-01-05.json');
  });
});
