import type { Triad } from "./bio-types";
import type { RoleAnalysis } from "./jobcheck-engine";

export const MAX_REALISTIC_SHARE = 55;

function roundPreservingSum(values: [number, number, number]): [number, number, number] {
  const sum = values[0] + values[1] + values[2];
  if (sum <= 0) return [33, 34, 33];
  const scaled: [number, number, number] = [
    (values[0] / sum) * 100,
    (values[1] / sum) * 100,
    (values[2] / sum) * 100,
  ];
  const floored: [number, number, number] = [
    Math.floor(scaled[0]),
    Math.floor(scaled[1]),
    Math.floor(scaled[2]),
  ];
  let missing = 100 - (floored[0] + floored[1] + floored[2]);
  const remainders: [number, number, number] = [
    scaled[0] - floored[0],
    scaled[1] - floored[1],
    scaled[2] - floored[2],
  ];
  while (missing > 0) {
    let maxIdx = 0;
    for (let i = 1; i < 3; i++) {
      if (remainders[i] > remainders[maxIdx]) maxIdx = i;
    }
    floored[maxIdx] += 1;
    remainders[maxIdx] = -1;
    missing -= 1;
  }
  return floored;
}

export function capRoleProfile(triad: Triad, maxShare: number = MAX_REALISTIC_SHARE): Triad {
  const safeImp = Math.max(0, triad.impulsiv || 0);
  const safeInt = Math.max(0, triad.intuitiv || 0);
  const safeAna = Math.max(0, triad.analytisch || 0);
  const sum = safeImp + safeInt + safeAna;
  let imp: number, int: number, ana: number;
  if (sum <= 0) {
    return { impulsiv: 33, intuitiv: 34, analytisch: 33 };
  } else if (Math.abs(sum - 100) > 0.5) {
    imp = (safeImp / sum) * 100;
    int = (safeInt / sum) * 100;
    ana = (safeAna / sum) * 100;
  } else {
    imp = safeImp;
    int = safeInt;
    ana = safeAna;
  }
  const maxVal = Math.max(imp, int, ana);
  if (maxVal <= maxShare) {
    const [I, N, A] = roundPreservingSum([imp, int, ana]);
    return { impulsiv: I, intuitiv: N, analytisch: A };
  }

  const isMax = (v: number) => v === maxVal;
  const capped: [number, number, number] = [
    isMax(imp) ? maxShare : imp,
    isMax(int) ? maxShare : int,
    isMax(ana) ? maxShare : ana,
  ];
  const overflowTotal = (imp + int + ana) - (capped[0] + capped[1] + capped[2]);

  const otherIndices: number[] = [];
  if (!isMax(imp)) otherIndices.push(0);
  if (!isMax(int)) otherIndices.push(1);
  if (!isMax(ana)) otherIndices.push(2);

  if (otherIndices.length === 0 || overflowTotal <= 0) {
    const [I, N, A] = roundPreservingSum(capped);
    return { impulsiv: I, intuitiv: N, analytisch: A };
  }

  const otherSum = otherIndices.reduce((s, idx) => s + capped[idx], 0);
  if (otherSum <= 0) {
    const share = overflowTotal / otherIndices.length;
    for (const idx of otherIndices) capped[idx] += share;
  } else {
    for (const idx of otherIndices) {
      capped[idx] += overflowTotal * (capped[idx] / otherSum);
    }
  }

  const [I, N, A] = roundPreservingSum(capped);
  return { impulsiv: I, intuitiv: N, analytisch: A };
}

export function capRoleAnalysis(role: RoleAnalysis, maxShare: number = MAX_REALISTIC_SHARE): RoleAnalysis {
  return {
    ...role,
    role_profile: capRoleProfile(role.role_profile, maxShare),
  };
}
