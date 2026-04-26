import type { FitRating, StructureRelationType } from "./soll-ist-engine";

export type PassungsnaeheZone = "GEEIGNET" | "BEDINGT" | "NICHT_GEEIGNET";

export type PassungsnaehePoint =
  | 1 | 2 | 3 | 4
  | 5 | 6 | 7 | 8
  | 9 | 10 | 11 | 12;

export type PassungsnaeheInput = {
  fitRating: FitRating;
  structureType: StructureRelationType;
  maxDiff: number;
  totalGap: number;
};

export type PassungsnaeheResult = {
  point: PassungsnaehePoint;
  zone: PassungsnaeheZone;
  captionKey:
    | "perfect"
    | "veryGood"
    | "good"
    | "borderlineGeeignet"
    | "veryCloseToGeeignet"
    | "clearlyConditional"
    | "conditionalWithEffort"
    | "borderlineNotSuitable"
    | "narrowlyNotSuitable"
    | "clearMismatch"
    | "strongMismatch"
    | "extremeMismatch";
};

const CAPTIONS: Record<PassungsnaehePoint, PassungsnaeheResult["captionKey"]> = {
  1: "perfect",
  2: "veryGood",
  3: "good",
  4: "borderlineGeeignet",
  5: "veryCloseToGeeignet",
  6: "clearlyConditional",
  7: "conditionalWithEffort",
  8: "borderlineNotSuitable",
  9: "narrowlyNotSuitable",
  10: "clearMismatch",
  11: "strongMismatch",
  12: "extremeMismatch",
};

const ZONE_OF: Record<PassungsnaehePoint, PassungsnaeheZone> = {
  1: "GEEIGNET", 2: "GEEIGNET", 3: "GEEIGNET", 4: "GEEIGNET",
  5: "BEDINGT", 6: "BEDINGT", 7: "BEDINGT", 8: "BEDINGT",
  9: "NICHT_GEEIGNET", 10: "NICHT_GEEIGNET", 11: "NICHT_GEEIGNET", 12: "NICHT_GEEIGNET",
};

export function getVisualFitPoint(input: PassungsnaeheInput): PassungsnaeheResult {
  const { fitRating, structureType, maxDiff, totalGap } = input;
  const md = Math.max(0, Math.round(maxDiff));
  const tg = Math.max(0, Math.round(totalGap));

  let point: PassungsnaehePoint;

  if (fitRating === "GEEIGNET") {
    if (md === 0 && tg <= 1) point = 1;
    else if (md <= 1) point = 2;
    else if (md <= 3) point = 3;
    else point = 4;
  } else if (fitRating === "BEDINGT") {
    if (structureType === "SOFT_CONFLICT") {
      if (md === 0) point = 5;
      else if (md <= 1) point = 6;
      else if (md <= 3) point = 7;
      else point = 8;
    } else if (structureType === "EXACT") {
      if (md <= 6) point = 5;
      else if (md <= 7) point = 6;
      else if (md <= 9) point = 7;
      else point = 8;
    } else {
      if (md <= 5) point = 5;
      else if (md <= 7) point = 6;
      else if (md <= 9) point = 7;
      else point = 8;
    }
  } else {
    if (structureType === "HARD_CONFLICT") {
      if (md <= 12) point = 9;
      else if (md <= 22) point = 10;
      else if (md <= 35) point = 11;
      else point = 12;
    } else {
      if (md <= 15) point = 9;
      else if (md <= 22) point = 10;
      else if (md <= 35) point = 11;
      else point = 12;
    }
  }

  return { point, zone: ZONE_OF[point], captionKey: CAPTIONS[point] };
}
