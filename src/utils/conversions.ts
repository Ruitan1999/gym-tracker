const LB_PER_KG = 2.20462;

export function kgToLb(kg: number): number {
  return Math.round(kg * LB_PER_KG * 100) / 100;
}

export function lbToKg(lb: number): number {
  return Math.round((lb / LB_PER_KG) * 100) / 100;
}
