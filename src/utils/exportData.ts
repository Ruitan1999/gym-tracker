import type { AppData } from '../types';
import { kgToLb } from './conversions';
import { parseRating } from './rating';
import { localDateKey } from './dateKey';

/**
 * Getting your data out. Two shapes, for two jobs: JSON is the whole backup
 * (restorable, nothing left out), CSV is the log flattened for a spreadsheet.
 * Both builders are pure and never touch what they are given.
 */

export interface JsonExportHeader {
  app: 'gym-tracker';
  exportedAt: string;
  dataVersion: number;
}

/**
 * Always everything. A backup that quietly leaves things out is worse than no
 * backup, so there is deliberately no range option here.
 */
export function buildJsonExport(appData: AppData, now: Date = new Date()): string {
  const header: JsonExportHeader = {
    app: 'gym-tracker',
    exportedAt: now.toISOString(),
    dataVersion: appData.dataVersion,
  };
  return JSON.stringify({ ...header, data: appData }, null, 2);
}

export const CSV_HEADER = ['date', 'workout', 'exercise', 'set', 'weight', 'unit', 'reps', 'rpe'];

/**
 * Spreadsheets run a cell that starts with = + - @ (or a tab / CR) as a
 * formula, and a workout name is free text. Prefixing a quote makes it plain
 * text. Only text cells go through this: weights are numbers and never
 * negative, so a plain number is never altered.
 */
function guardFormula(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function cell(value: string | number | null | undefined, isText = false): string {
  if (value == null) return '';
  let text = String(value);
  if (isText) text = guardFormula(text);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export interface CsvRange {
  /** YYYY-MM-DD, inclusive. Empty or absent means open-ended. */
  from?: string;
  to?: string;
}

/**
 * One row per set. The session rating lives in the workout's notes, so it is
 * repeated on each of that workout's rows (empty when there is none).
 * A deleted library exercise still shows up in history, so a missing one
 * falls back to "Unknown exercise" rather than dropping its sets.
 * The BOM is what makes Excel read the file as UTF-8; CRLF is the CSV norm.
 */
export function buildCsvExport(appData: AppData, range: CsvRange = {}): string {
  const unit = appData.preferences.weightUnit;
  const names = new Map(appData.exercises.map((e) => [e.id, e.name]));
  const rows: string[] = [CSV_HEADER.join(',')];

  const workouts = appData.workouts
    .filter((w) => (!range.from || w.date >= range.from) && (!range.to || w.date <= range.to))
    // slice() so the caller's array is not sorted in place. Array sort is
    // stable, so same-day workouts keep the order they were saved in.
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  for (const w of workouts) {
    const rpe = parseRating(w.notes);
    for (const entry of w.entries) {
      const exercise = names.get(entry.exerciseId) || 'Unknown exercise';
      for (const s of entry.sets) {
        const weight = unit === 'lb' ? kgToLb(s.weightKg) : s.weightKg;
        rows.push(
          [
            cell(w.date),
            cell(w.name ?? '', true),
            cell(exercise, true),
            cell(s.setNumber),
            cell(weight),
            cell(unit),
            cell(s.reps),
            cell(rpe),
          ].join(','),
        );
      }
    }
  }
  return '﻿' + rows.join('\r\n') + '\r\n';
}

/** Local date, not UTC: an evening export shouldn't be filed under tomorrow. */
export function exportFileName(ext: 'json' | 'csv', now: Date = new Date()): string {
  return `gym-tracker-${localDateKey(now)}.${ext}`;
}

/** Hand a string to the browser as a file. The URL is revoked straight after. */
export function downloadText(content: string, fileName: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking in the same tick can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
