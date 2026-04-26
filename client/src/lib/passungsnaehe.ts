import type { FitRating, StructureRelationType } from "./soll-ist-engine";

export type PassungsnaeheZone = "GEEIGNET" | "BEDINGT" | "NICHT_GEEIGNET";

export type PassungsnaehePoint =
  | 1 | 2 | 3
  | 4 | 5 | 6
  | 7 | 8 | 9;

export type PassungsnaeheInput = {
  fitRating: FitRating;
  structureType: StructureRelationType;
  maxDiff: number;
  totalGap: number;
};

export type PassungsnaeheResult = {
  point: PassungsnaehePoint;
  zone: PassungsnaeheZone;
  position01: number;
  captionKey:
    | "perfect"
    | "veryGood"
    | "borderlineGeeignet"
    | "veryCloseToGeeignet"
    | "clearlyConditional"
    | "borderlineNotSuitable"
    | "narrowlyNotSuitable"
    | "clearMismatch"
    | "extremeMismatch";
};

const CAPTIONS: Record<PassungsnaehePoint, PassungsnaeheResult["captionKey"]> = {
  1: "perfect",
  2: "veryGood",
  3: "borderlineGeeignet",
  4: "veryCloseToGeeignet",
  5: "clearlyConditional",
  6: "borderlineNotSuitable",
  7: "narrowlyNotSuitable",
  8: "clearMismatch",
  9: "extremeMismatch",
};

const ZONE_OF: Record<PassungsnaehePoint, PassungsnaeheZone> = {
  1: "GEEIGNET", 2: "GEEIGNET", 3: "GEEIGNET",
  4: "BEDINGT", 5: "BEDINGT", 6: "BEDINGT",
  7: "NICHT_GEEIGNET", 8: "NICHT_GEEIGNET", 9: "NICHT_GEEIGNET",
};

const ZONE_INDEX: Record<PassungsnaeheZone, number> = {
  GEEIGNET: 0,
  BEDINGT: 1,
  NICHT_GEEIGNET: 2,
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function computePosInZone(
  zone: PassungsnaeheZone,
  structureType: StructureRelationType,
  md: number,
  tg: number,
): number {
  if (zone === "GEEIGNET") {
    const a = md / 5.5;
    const b = tg / 16;
    return clamp(Math.max(a, b * 0.9), 0.06, 0.94);
  }
  if (zone === "BEDINGT") {
    if (structureType === "EXACT") {
      return clamp((md - 5.5) / 5.5, 0.06, 0.94);
    }
    if (structureType === "SOFT_CONFLICT") {
      return clamp(md / 10.5, 0.06, 0.94);
    }
    return clamp(md / 10.5, 0.06, 0.94);
  }
  if (structureType === "HARD_CONFLICT") {
    return clamp(md / 32, 0.06, 0.94);
  }
  return clamp((md - 10) / 25, 0.06, 0.94);
}

export function getVisualFitPoint(input: PassungsnaeheInput): PassungsnaeheResult {
  const { fitRating, structureType, maxDiff, totalGap } = input;
  const md = Math.max(0, Math.round(maxDiff));
  const tg = Math.max(0, Math.round(totalGap));

  let point: PassungsnaehePoint;

  if (fitRating === "GEEIGNET") {
    if (md === 0 && tg <= 1) point = 1;
    else if (md <= 2) point = 2;
    else point = 3;
  } else if (fitRating === "BEDINGT") {
    if (structureType === "SOFT_CONFLICT") {
      if (md === 0) point = 4;
      else if (md <= 3) point = 5;
      else point = 6;
    } else if (structureType === "EXACT") {
      if (md <= 7) point = 4;
      else if (md <= 9) point = 5;
      else point = 6;
    } else {
      if (md <= 5) point = 4;
      else if (md <= 8) point = 5;
      else point = 6;
    }
  } else {
    if (structureType === "HARD_CONFLICT") {
      if (md <= 15) point = 7;
      else if (md <= 30) point = 8;
      else point = 9;
    } else {
      if (md <= 18) point = 7;
      else if (md <= 30) point = 8;
      else point = 9;
    }
  }

  const zone = ZONE_OF[point];
  const posInZone = computePosInZone(zone, structureType, md, tg);
  const position01 = (ZONE_INDEX[zone] + posInZone) / 3;

  return { point, zone, captionKey: CAPTIONS[point], position01 };
}
