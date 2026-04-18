const LB_PER_KG = 2.20462;

export function kgToLb(kg: number): number {
  return Math.round(kg * LB_PER_KG * 100) / 100;
}

export function lbToKg(lb: number): number {
  return Math.round((lb / LB_PER_KG) * 100) / 100;
}

const UNITS: Array<[number, string]> = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

export function formatVolume(value: number): string {
  if (!isFinite(value)) return '∞';
  const abs = Math.abs(value);
  if (abs >= 1e15) return value.toExponential(1).replace('+', '');
  for (const [threshold, suffix] of UNITS) {
    if (abs >= threshold) {
      const scaled = value / threshold;
      return `${scaled >= 100 ? Math.round(scaled) : scaled.toFixed(1)}${suffix}`;
    }
  }
  return String(Math.round(value));
}
