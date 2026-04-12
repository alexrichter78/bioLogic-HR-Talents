import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent, computeCoreFit, calcControlIntensity, koRuleTriggered } from "./jobcheck-engine";
import type { Triad, ComponentKey, RoleAnalysis, CandidateInput } from "./jobcheck-engine";
import { buildMatchTexts, getVariant as getTextVariant } from "./matchcheck-texts";
import type { TriadKey, MatchTextInput, FitLabel as TextFitLabel, PairRelations as TextPairRelations } from "./matchcheck-texts";

export type FitRating = "GEEIGNET" | "BEDINGT" | "NICHT_GEEIGNET";
export type Severity = "ok" | "warning" | "critical";
export type FuehrungsArt = "keine" | "fachlich" | "disziplinarisch";

export type FitSubtype =
  | "PERFECT"
  | "STRUCTURE_MATCH_INTENSITY_OFF"
  | "PARTIAL_MATCH"
  | "MISMATCH";

export type StructureRelationType = "EXACT" | "SOFT_CONFLICT" | "HARD_CONFLICT";

export interface StructureRelation {
  type: StructureRelationType;
  mismatchCount: number;
  directFlip: boolean;
}

export type ConstellationType =
  | "H_DOM" | "B_DOM" | "S_DOM"
  | "H_GT_B" | "H_GT_S" | "B_GT_H" | "B_GT_S" | "S_GT_H" | "S_GT_B"
  | "H_NEAR_B" | "H_NEAR_S" | "B_NEAR_S"
  | "BALANCED";

export type ImpactArea = {
  id: string;
  label: string;
  severity: Severity;
  roleNeed: string;
  candidatePattern: string;
  risk: string;
};

export type RiskPhase = {
  label: string;
  period: string;
  text: string;
};

export type StressBehavior = {
  controlledPressure: string;
  uncontrolledStress: string;
};

type IntegrationFokus = {
  intro: string;
  bullets: string[];
};

type IntegrationPhase = {
  num: number;
  title: string;
  period: string;
  ziel: string;
  items: string[];
  fokus: IntegrationFokus;
};

export type SollIstResult = {
  roleName: string;
  candidateName: string;
  roleTriad: Triad;
  candTriad: Triad;
  roleDomLabel: string;
  candDomLabel: string;
  roleDomKey: ComponentKey;
  candDomKey: ComponentKey;
  candDom2Key: ComponentKey;
  candIsEqualDist: boolean;
  candIsDualDom: boolean;
  roleDom2Key: ComponentKey;
  roleIsBalFull: boolean;
  roleIsDualDom: boolean;
  roleConstellation: ConstellationType;
  candConstellation: ConstellationType;
  roleConstellationLabel: string;
  candConstellationLabel: string;
  totalGap: number;
  gapLevel: "gering" | "mittel" | "hoch";
  fitRating: FitRating;
  fitLabel: string;
  fitSubtype: FitSubtype;
  structureRelation: StructureRelation;
  fitColor: string;
  controlIntensity: "gering" | "mittel" | "hoch";
  summaryText: string;
  executiveBullets: string[];
  constellationRisks: string[];
  dominanceShiftText: string;
  stressBehavior: StressBehavior;
  impactAreas: ImpactArea[];
  riskTimeline: RiskPhase[];
  developmentLevel: number;
  developmentLabel: string;
  developmentText: string;
  actions: string[];
  integrationsplan: IntegrationPhase[] | null;
  finalText: string;
};

const compVariants: Record<ComponentKey, string[]> = {
  impulsiv: [
    "Entscheidungsstärke und Umsetzung",
    "Tempo und direkte Ergebnisorientierung",
    "schnelle Entscheidungen und operative Durchsetzung",
    "Handlungsorientierung und Umsetzungskraft",
  ],
  intuitiv: [
    "Beziehungsgestaltung und Kommunikation",
    "Austausch und persönliche Ansprache",
    "Zusammenarbeit und situatives Gespür",
    "Abstimmung und zwischenmenschliche Wirkung",
  ],
  analytisch: [
    "Struktur und Analyse",
    "Sorgfalt und systematische Prüfung",
    "Ordnung und verlässliche Prozesse",
    "analytische Tiefe und Qualitätssicherung",
  ],
};

let variantCounter: Record<ComponentKey, number> = { impulsiv: 0, intuitiv: 0, analytisch: 0 };

function resetVariants(): void {
  variantCounter = { impulsiv: 0, intuitiv: 0, analytisch: 0 };
}

function compDesc(k: ComponentKey): string {
  const variants = compVariants[k];
  const idx = variantCounter[k] % variants.length;
  variantCounter[k]++;
  return variants[idx];
}

function compDescFirst(k: ComponentKey): string {
  return compVariants[k][0];
}

function compShort(k: ComponentKey): string {
  if (k === "impulsiv") return "Handlungsorientierung";
  if (k === "intuitiv") return "Einfühlungsvermögen";
  return "Ordnung und Verlässlichkeit";
}

export function subj(name: string): string {
  const lower = name.toLowerCase();
  if (lower === "person" || lower === "die person") return "die Person";
  return name;
}

export function Subj(name: string): string {
  const lower = name.toLowerCase();
  if (lower === "person" || lower === "die person") return "Die Person";
  return name;
}

function severity(gap: number): Severity {
  if (gap > 10) return "critical";
  if (gap > 5) return "warning";
  return "ok";
}

type DualPair = "impulsiv_intuitiv" | "impulsiv_analytisch" | "intuitiv_analytisch";
const DUAL_PAIR_ORDER: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
function dualPairKey(k1: ComponentKey, k2: ComponentKey): DualPair {
  return [k1, k2].sort((a, b) => DUAL_PAIR_ORDER.indexOf(a) - DUAL_PAIR_ORDER.indexOf(b)).join("_") as DualPair;
}

function pairSign(a: number, b: number): -1 | 0 | 1 {
  const d = a - b;
  if (Math.abs(d) <= 5) return 0;
  return d > 0 ? 1 : -1;
}

export function computeStructureRelation(rt: Triad, ct: Triad): StructureRelation {
  const pairs = [
    { soll: pairSign(rt.impulsiv, rt.intuitiv), ist: pairSign(ct.impulsiv, ct.intuitiv) },
    { soll: pairSign(rt.impulsiv, rt.analytisch), ist: pairSign(ct.impulsiv, ct.analytisch) },
    { soll: pairSign(rt.intuitiv, rt.analytisch), ist: pairSign(ct.intuitiv, ct.analytisch) },
  ];

  let mismatchCount = 0;
  let directFlip = false;
  for (const p of pairs) {
    if (p.soll !== p.ist) {
      mismatchCount++;
      if (p.soll !== 0 && p.ist !== 0 && p.soll === -p.ist) directFlip = true;
    }
  }

  const type: StructureRelationType =
    mismatchCount === 0 ? "EXACT"
    : (mismatchCount === 1 && !directFlip) ? "SOFT_CONFLICT"
    : "HARD_CONFLICT";

  return { type, mismatchCount, directFlip };
}

export function deriveFitSubtype(
  rk: ComponentKey, ck: ComponentKey,
  structRel: StructureRelation,
  maxGap: number,
  candDualMatchesRole: boolean,
  candIsBalFull: boolean,
  roleIsBalFull: boolean,
  roleIsDualDom: boolean = false,
): FitSubtype {
  if (rk === ck) {
    if (structRel.type === "EXACT" && maxGap < 8) return "PERFECT";
    return "STRUCTURE_MATCH_INTENSITY_OFF";
  }
  if (candDualMatchesRole && roleIsDualDom) {
    if (structRel.type === "EXACT" && maxGap < 8) return "PERFECT";
    return "STRUCTURE_MATCH_INTENSITY_OFF";
  }
  if (roleIsBalFull && candIsBalFull) {
    if (structRel.type === "EXACT" && maxGap < 8) return "PERFECT";
    return "STRUCTURE_MATCH_INTENSITY_OFF";
  }
  if (candDualMatchesRole || candIsBalFull || roleIsBalFull || structRel.type === "SOFT_CONFLICT") {
    return "PARTIAL_MATCH";
  }
  return "MISMATCH";
}

const dualCandDecision: Record<DualPair, string> = {
  impulsiv_intuitiv: "entscheidet sowohl schnell und handlungsorientiert als auch kontextbezogen und abstimmungsorientiert. Je nach Situation überwiegt Tempo oder Einbindung.",
  impulsiv_analytisch: "entscheidet sowohl schnell und handlungsorientiert als auch analytisch und prüforientiert. Je nach Situation überwiegt Tempo oder Sorgfalt.",
  intuitiv_analytisch: "entscheidet sowohl kontextbezogen und abstimmungsorientiert als auch analytisch und prüforientiert. Je nach Situation überwiegt Einbindung oder Sorgfalt.",
};
const dualCandLeadership: Record<DualPair, string> = {
  impulsiv_intuitiv: "führt sowohl über Tempo und direkte Ansprache als auch über Dialog und Einbindung. Der Führungsstil wechselt situativ.",
  impulsiv_analytisch: "führt sowohl über Tempo und Entscheidungskraft als auch über Systematik und klare Vorgaben. Der Führungsstil wechselt situativ.",
  intuitiv_analytisch: "führt sowohl über Dialog und Vertrauen als auch über Systematik und Struktur. Der Führungsstil wechselt situativ.",
};
const dualCandCommunication: Record<DualPair, string> = {
  impulsiv_intuitiv: "kommuniziert sowohl direkt und ergebnisorientiert als auch dialogorientiert und empathisch. Der Kommunikationsstil wechselt situativ.",
  impulsiv_analytisch: "kommuniziert sowohl direkt und knapp als auch sachlich und faktenbasiert. Der Kommunikationsstil wechselt situativ.",
  intuitiv_analytisch: "kommuniziert sowohl dialogorientiert und empathisch als auch sachlich und faktenbasiert. Der Kommunikationsstil wechselt situativ.",
};
const dualCandCulture: Record<DualPair, string> = {
  impulsiv_intuitiv: "prägt die Kultur über Dynamik und Tempo einerseits, Zusammenhalt und Beziehungsarbeit andererseits. Beide Seiten wechseln sich ab.",
  impulsiv_analytisch: "prägt die Kultur über Dynamik und Tempo einerseits, Strukturklarheit und Verlässlichkeit andererseits. Beide Seiten stehen nebeneinander.",
  intuitiv_analytisch: "prägt die Kultur über Zusammenhalt und Beziehungsarbeit einerseits, Ordnung und Verlässlichkeit andererseits. Beide Seiten stehen nebeneinander.",
};

export function detectConstellation(t: Triad): ConstellationType {
  const sorted = ([
    { key: "impulsiv" as ComponentKey, val: t.impulsiv },
    { key: "intuitiv" as ComponentKey, val: t.intuitiv },
    { key: "analytisch" as ComponentKey, val: t.analytisch },
  ]).sort((a, b) => b.val - a.val);

  const top = sorted[0];
  const mid = sorted[1];
  const bot = sorted[2];
  const d12 = top.val - mid.val;
  const d23 = mid.val - bot.val;
  const range = top.val - bot.val;

  if (range <= 8) return "BALANCED";

  const pairKey = (a: ComponentKey, b: ComponentKey): string => {
    const m: Record<string, string> = {
      "impulsiv_intuitiv": "H_B", "intuitiv_impulsiv": "B_H",
      "impulsiv_analytisch": "H_S", "analytisch_impulsiv": "S_H",
      "intuitiv_analytisch": "B_S", "analytisch_intuitiv": "S_B",
    };
    return m[`${a}_${b}`] || "";
  };

  if (d12 >= 15) {
    if (top.key === "impulsiv") return "H_DOM";
    if (top.key === "intuitiv") return "B_DOM";
    return "S_DOM";
  }

  if (d12 <= 5) {
    const pk = pairKey(top.key, mid.key);
    if (pk === "H_B" || pk === "B_H") return "H_NEAR_B";
    if (pk === "H_S" || pk === "S_H") return "H_NEAR_S";
    return "B_NEAR_S";
  }

  const gtKey = pairKey(top.key, mid.key);
  const gtMap: Record<string, ConstellationType> = {
    "H_B": "H_GT_B", "H_S": "H_GT_S",
    "B_H": "B_GT_H", "B_S": "B_GT_S",
    "S_H": "S_GT_H", "S_B": "S_GT_B",
  };
  return gtMap[gtKey] || "BALANCED";
}

export function constellationLabel(c: ConstellationType): string {
  const labels: Record<ConstellationType, string> = {
    H_DOM: "Klarer Handlungsfokus",
    B_DOM: "Klarer Beziehungsfokus",
    S_DOM: "Klarer Strukturfokus",
    H_GT_B: "Handlungsfokus mit Beziehungsanteil",
    H_GT_S: "Handlungsfokus mit Strukturanteil",
    B_GT_H: "Beziehungsfokus mit Handlungsanteil",
    B_GT_S: "Beziehungsfokus mit Strukturanteil",
    S_GT_H: "Strukturfokus mit Handlungsanteil",
    S_GT_B: "Strukturfokus mit Beziehungsanteil",
    H_NEAR_B: "Doppelfokus Handlung und Beziehung",
    H_NEAR_S: "Doppelfokus Handlung und Struktur",
    B_NEAR_S: "Doppelfokus Beziehung und Struktur",
    BALANCED: "Ausgeglichenes Profil",
  };
  return labels[c];
}

function primaryKey(c: ConstellationType): ComponentKey {
  if (c.startsWith("H")) return "impulsiv";
  if (c.startsWith("B")) return "intuitiv";
  if (c.startsWith("S")) return "analytisch";
  return "intuitiv";
}

function secondaryKey(c: ConstellationType, t: Triad): ComponentKey {
  const pk = primaryKey(c);
  const rest = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== pk);
  return t[rest[0]] >= t[rest[1]] ? rest[0] : rest[1];
}

export function mapFuehrungsArt(fuehrung: string | undefined): FuehrungsArt {
  if (!fuehrung) return "keine";
  const lower = fuehrung.toLowerCase();
  if (lower.includes("keine")) return "keine";
  if (lower.includes("fachlich")) return "fachlich";
  return "disziplinarisch";
}

export function computeSollIst(
  roleName: string,
  candidateName: string,
  roleProfile: Triad,
  candProfile: Triad,
  fuehrungsArt: FuehrungsArt = "keine",
  roleAnalysis?: RoleAnalysis
): SollIstResult {
  resetVariants();
  const rt = normalizeTriad(roleProfile);
  const ct = normalizeTriad(candProfile);
  const rDom = dominanceModeOf(rt);
  const cDom = dominanceModeOf(ct);

  const totalGap = Math.abs(rt.impulsiv - ct.impulsiv) + Math.abs(rt.intuitiv - ct.intuitiv) + Math.abs(rt.analytisch - ct.analytisch);

  let externalKo = false;
  let effectiveControlLevel: "LOW" | "MEDIUM" | "HIGH" | undefined;
  if (roleAnalysis) {
    const candInput: CandidateInput = { candidate_name: candidateName, candidate_profile: candProfile };
    externalKo = koRuleTriggered(roleAnalysis, candInput);
    effectiveControlLevel = calcControlIntensity(roleAnalysis, candInput).level;
  }

  const coreFit = computeCoreFit(roleProfile, candProfile, externalKo);
  const baseControlLevel = coreFit.controlIntensity;
  if (!effectiveControlLevel) effectiveControlLevel = coreFit.controlIntensity;

  let fitRating: FitRating;
  let fitLabel: string;
  let fitColor: string;
  let gapLevel: "gering" | "mittel" | "hoch";
  let controlIntensity: "gering" | "mittel" | "hoch";

  if (coreFit.overallFit === "SUITABLE") { fitRating = "GEEIGNET"; fitLabel = "Geeignet"; fitColor = "#34C759"; gapLevel = "gering"; }
  else if (coreFit.overallFit === "CONDITIONAL") { fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832"; gapLevel = "mittel"; }
  else { fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#D64045"; gapLevel = "hoch"; }

  controlIntensity = effectiveControlLevel === "HIGH" ? "hoch" : effectiveControlLevel === "MEDIUM" ? "mittel" : "gering";
  const baseControlStr: "gering" | "mittel" | "hoch" = baseControlLevel === "HIGH" ? "hoch" : baseControlLevel === "MEDIUM" ? "mittel" : "gering";

  const rk = rDom.top1.key;
  const rk2 = rDom.top2.key;
  const ck = cDom.top1.key;
  const ck2Main = cDom.top2.key;
  const cn = candidateName || "Die Person";
  const isDualDomRole = rDom.gap1 <= 5 && rDom.gap2 > 5;
  const candSpreadMain = Math.max(ct.impulsiv, ct.intuitiv, ct.analytisch) - Math.min(ct.impulsiv, ct.intuitiv, ct.analytisch);
  const candIsBalFullMain = candSpreadMain <= 5;
  const candIsDualDomMain = !candIsBalFullMain && cDom.gap1 <= 5 && cDom.gap2 > 5;

  const rConst = detectConstellation(rt);
  const cConst = detectConstellation(ct);
  const roleIsBalFull = rDom.gap1 <= 5 && rDom.gap2 <= 5;

  const structureRelation = computeStructureRelation(rt, ct);
  const maxGapVal = Math.max(Math.abs(rt.impulsiv - ct.impulsiv), Math.abs(rt.intuitiv - ct.intuitiv), Math.abs(rt.analytisch - ct.analytisch));
  const candDualMatchesRoleMain = candIsDualDomMain && (rk === ck || rk === ck2Main);
  const fitSubtype = deriveFitSubtype(rk, ck, structureRelation, maxGapVal, candDualMatchesRoleMain, candIsBalFullMain, roleIsBalFull, isDualDomRole);

  const toTriadKey = (k: ComponentKey): TriadKey => k === "impulsiv" ? "I" : k === "intuitiv" ? "N" : "A";
  const roleP = { I: rt.impulsiv, N: rt.intuitiv, A: rt.analytisch };
  const candP = { I: ct.impulsiv, N: ct.intuitiv, A: ct.analytisch };
  const diffs = { I: Math.abs(rt.impulsiv - ct.impulsiv), N: Math.abs(rt.intuitiv - ct.intuitiv), A: Math.abs(rt.analytisch - ct.analytisch) };

  function pairSignLocal(a: number, b: number): -1 | 0 | 1 {
    const d = a - b;
    if (Math.abs(d) <= 5) return 0;
    return d > 0 ? 1 : -1;
  }
  const sollRelations: TextPairRelations = {
    I_N: pairSignLocal(rt.impulsiv, rt.intuitiv),
    I_A: pairSignLocal(rt.impulsiv, rt.analytisch),
    N_A: pairSignLocal(rt.intuitiv, rt.analytisch),
  };
  const istRelations: TextPairRelations = {
    I_N: pairSignLocal(ct.impulsiv, ct.intuitiv),
    I_A: pairSignLocal(ct.impulsiv, ct.analytisch),
    N_A: pairSignLocal(ct.intuitiv, ct.analytisch),
  };

  const textFitLabel: TextFitLabel = fitLabel as TextFitLabel;
  const textInput: MatchTextInput = {
    roleName,
    candName: cn,
    roleProfile: roleP,
    candProfile: candP,
    fitLabel: textFitLabel,
    fitSubtype,
    controlLevel: effectiveControlLevel,
    maxDiff: maxGapVal,
    totalGap,
    diffs,
    sollVariant: getTextVariant(roleP),
    istVariant: getTextVariant(candP),
    sollRelations,
    istRelations,
    structureRelation: { ...structureRelation, reason: '' },
    fuehrungsArt,
  };
  const texts = buildMatchTexts(textInput);

  const summaryText = texts.summary.summary + "\n\n" + texts.summary.managementSummary;
  const executiveBullets = texts.summary.whyResult;
  const constellationRisks = texts.summary.risks;
  const dominanceShiftText = texts.summary.profileCompareIntro;
  const stressBehavior: StressBehavior = {
    controlledPressure: texts.stress.controlledPressure,
    uncontrolledStress: texts.stress.uncontrolledStress,
  };
  const impactAreas: ImpactArea[] = texts.impactAreas.map(a => ({
    id: a.key,
    label: a.title,
    severity: a.severity,
    roleNeed: a.roleNeed,
    candidatePattern: a.personText,
    risk: a.interpretation,
  }));
  const riskTimeline: RiskPhase[] = texts.timeline.map((text, i) => ({
    label: i === 0 ? "Kurzfristig" : i === 1 ? "Mittelfristig" : "Langfristig",
    period: i === 0 ? "0 - 3 Monate" : i === 1 ? "3 - 12 Monate" : "12+ Monate",
    text,
  }));
  const developmentLevel = texts.development.scoreText === "niedrig" ? 1 : texts.development.scoreText === "mittel" ? 2 : 3;
  const developmentLabel = texts.development.subtitle;
  const developmentText = texts.development.text1 + "\n\n" + texts.development.text2;
  const actions = buildActions(rk, ck, gapLevel, controlIntensity, roleIsBalFull, ct);
  const integrationsplan: IntegrationPhase[] | null = texts.integrationPlan.map(p => ({
    num: p.phase,
    title: p.title,
    period: p.timeframe,
    ziel: p.goal,
    items: p.items,
    fokus: {
      intro: p.focusText,
      bullets: p.focusBullets,
    },
  }));
  const finalText = texts.summary.finalText;

  return {
    roleName,
    candidateName: cn,
    roleTriad: rt,
    candTriad: ct,
    roleDomLabel: dominanceLabel(rDom),
    candDomLabel: dominanceLabel(cDom),
    roleDomKey: rk,
    candDomKey: ck,
    candDom2Key: cDom.top2.key,
    candIsEqualDist: cDom.mode === "BAL_FULL",
    candIsDualDom: cDom.mode !== "BAL_FULL" && cDom.gap1 <= 5,
    roleDom2Key: rDom.top2.key,
    roleIsBalFull,
    roleIsDualDom: isDualDomRole,
    roleConstellation: rConst,
    candConstellation: cConst,
    roleConstellationLabel: constellationLabel(rConst),
    candConstellationLabel: constellationLabel(cConst),
    totalGap,
    gapLevel,
    fitRating,
    fitLabel,
    fitSubtype,
    structureRelation,
    fitColor,
    controlIntensity,
    summaryText,
    executiveBullets,
    constellationRisks,
    dominanceShiftText,
    stressBehavior,
    impactAreas,
    riskTimeline,
    developmentLevel,
    developmentLabel,
    developmentText,
    actions,
    integrationsplan,
    finalText,
  };
}

function constellationRoleText(c: ConstellationType): string {
  const texts: Record<ConstellationType, string> = {
    H_DOM: "Diese Stelle wirkt vor allem über Geschwindigkeit, klare Priorisierung und direkte Umsetzung. Entscheidungen werden zügig getroffen, Themen schnell in Bewegung gebracht.",
    B_DOM: "Diese Stelle lebt vom direkten Kontakt mit Menschen, vom Gespür für Situationen und von tragfähiger Zusammenarbeit. Wirksamkeit entsteht über Vertrauen und Beziehungsarbeit.",
    S_DOM: "Diese Stelle verlangt analytisches Denken, sorgfältige Planung und verlässliche Prüftiefe. Qualität entsteht über Ordnung, Systematik und Nachvollziehbarkeit.",
    H_GT_B: "Die Stelle wird vor allem durch schnelle Entscheidungen und direkte Umsetzung getragen, braucht aber gleichzeitig die Fähigkeit, Menschen mitzunehmen und Situationen sozial klug zu lesen.",
    H_GT_S: "Die Stelle lebt von zügiger Umsetzung, braucht aber eine stabile Struktur im Hintergrund. Geschwindigkeit allein reicht nicht; sie muss in klare Abläufe eingebettet sein.",
    B_GT_H: "Die Stelle wirkt primär über Vertrauen, Einfühlungsvermögen und Gesprächsführung, braucht aber eine klare Fähigkeit, bei Bedarf zu entscheiden und in Handlung zu kommen.",
    B_GT_S: "Die Stelle braucht vor allem Beziehungsgestaltung, situatives Gespür und tragfähigen Dialog. Analytische Absicherung dient hier als stabilisierendes Fundament.",
    S_GT_H: "Die Stelle verlangt in erster Linie analytisches Denken, Sorgfalt und systematische Ordnung, braucht aber gleichzeitig die Fähigkeit, Entscheidungen rechtzeitig umzusetzen.",
    S_GT_B: "Die Stelle wird vor allem über analytische Tiefe, Verlässlichkeit und klare Prozesse getragen. Gleichzeitig braucht sie ausreichend Kommunikationsfähigkeit, damit Strukturen auch angenommen werden.",
    H_NEAR_B: "Die Stelle verbindet hohe Ergebnisdynamik mit sozialer Beweglichkeit. Sie wirkt zugleich über schnelle Entscheidungen und Kontaktfähigkeit.",
    H_NEAR_S: "Die Stelle verbindet Umsetzungskraft mit Struktur. Sie kann stark sein, wenn Geschwindigkeit und saubere Planung gemeinsam wirken.",
    B_NEAR_S: "Die Stelle verbindet Beziehungsgestaltung und analytische Absicherung. Sie wirkt über Orientierung, saubere Abstimmung und verlässliche Standards.",
    BALANCED: "Die Stelle zeigt keine klare strukturelle Einseitigkeit. Umsetzung, Zusammenarbeit und Struktur wirken in relativ ausgeglichener Form zusammen.",
  };
  return texts[c];
}

function constellationCandText(c: ConstellationType, cand: string): string {
  const s = Subj(cand);
  const texts: Record<ConstellationType, string> = {
    H_DOM: `${s} arbeitet mit hoher Umsetzungsenergie, trifft Entscheidungen zügig und bringt Themen schnell ins Handeln.`,
    B_DOM: `${s} baut schnell Vertrauen auf, erkennt Bedürfnisse früh und schafft ein kooperatives Arbeitsumfeld.`,
    S_DOM: `${s} arbeitet analytisch und präzise, sorgt für verlässliche Abläufe und prüft gründlich.`,
    H_GT_B: `${s} setzt auf schnelle Entscheidungen und direkte Ergebnisse, kann aber gleichzeitig Menschen einbinden und situative Zusammenarbeit leisten.`,
    H_GT_S: `${s} arbeitet schnell und entscheidungsorientiert, sichert Ergebnisse aber zusätzlich über klare Abläufe und Struktur ab.`,
    B_GT_H: `${s} wirkt vor allem über Vertrauen und Einfühlungsvermögen, kann aber bei Bedarf schnell entscheiden und handeln.`,
    B_GT_S: `${s} ist stark in Beziehungsgestaltung und situativem Gespür und nutzt gleichzeitig analytische Absicherung als Fundament.`,
    S_GT_H: `${s} arbeitet vorwiegend analytisch und systematisch, kann aber bei Bedarf schnell umschalten und handeln.`,
    S_GT_B: `${s} legt Wert auf Analyse, Ordnung und Verlässlichkeit. Gleichzeitig sorgt ein erkennbarer Beziehungsanteil dafür, dass Ergebnisse auch kommunikativ vermittelt werden.`,
    H_NEAR_B: `Bei ${subj(cand)} wechseln sich hohe Ergebnisdynamik und soziale Beweglichkeit je nach Situation ab.`,
    H_NEAR_S: `Bei ${subj(cand)} stehen Umsetzungskraft und Strukturorientierung fast gleichwertig nebeneinander. Je nach Situation wird entweder schnell gehandelt oder gründlich geprüft.`,
    B_NEAR_S: `Bei ${subj(cand)} stehen Beziehungsgestaltung und analytisches Denken fast gleichwertig nebeneinander. Je nach Situation wird moderiert oder systematisch geordnet.`,
    BALANCED: `${s} zeigt ein ausgeglichenes Profil ohne klare Einseitigkeit. Das Verhalten passt sich situativ an, ist aber weniger eindeutig vorhersagbar.`,
  };
  return texts[c];
}

function dualRoleDesc(rk: ComponentKey, rk2: ComponentKey): string {
  return `${compShort(rk)} und ${compShort(rk2)} gleichermassen`;
}

function buildExecutiveBullets(rk: ComponentKey, ck: ComponentKey, gapLevel: string, fitLabel: string, cand: string, rt: Triad, ct: Triad, isDualDomRole = false, rk2?: ComponentKey, fitSubtype: FitSubtype = "MISMATCH"): string[] {
  const bullets: string[] = [];
  const roleDesc = isDualDomRole && rk2 ? dualRoleDesc(rk, rk2) : compDesc(rk);

  if (fitSubtype === "PERFECT") {
    bullets.push(`Die Stelle erfordert ${roleDesc}. ${Subj(cand)} bringt dieselbe Arbeitsweise mit. Die Gewichtung passt.`);
  } else if (fitSubtype === "STRUCTURE_MATCH_INTENSITY_OFF") {
    bullets.push(`Die Stelle erfordert ${roleDesc}. ${Subj(cand)} arbeitet in dieselbe Richtung, die Gewichtung der Nebenbereiche weicht jedoch ab.`);
  } else if (isDualDomRole && rk2 && (ck === rk || ck === rk2)) {
    bullets.push(`Die Stelle erfordert ${roleDesc}. ${Subj(cand)} bringt ${compDesc(ck)} als Schwerpunkt mit – deckt damit einen der beiden Kernbereiche ab.`);
  } else {
    bullets.push(`Die Stelle erfordert ${roleDesc}. ${Subj(cand)} setzt auf ${compDesc(ck)}.`);
  }

  const gapI = Math.abs(rt.impulsiv - ct.impulsiv);
  const gapN = Math.abs(rt.intuitiv - ct.intuitiv);
  const gapA = Math.abs(rt.analytisch - ct.analytisch);
  const maxGapKey = gapI >= gapN && gapI >= gapA ? "impulsiv" : gapN >= gapA ? "intuitiv" : "analytisch";
  const maxGap = Math.max(gapI, gapN, gapA);

  if (maxGap >= 10) {
    bullets.push(`Grösste Abweichung im Bereich ${labelComponent(maxGapKey)}.`);
  } else {
    bullets.push("Alle drei Arbeitsbereiche liegen nah beieinander. Geringe Abweichung.");
  }

  if (fitLabel === "Nicht geeignet") {
    bullets.push("Hoher Führungsaufwand erforderlich. Grundlegende Abweichung zur Stellenanforderung.");
  } else if (fitLabel === "Bedingt geeignet") {
    bullets.push("Moderater Führungsaufwand. Gezielte Führung und klare Erwartungen gleichen Differenzen aus.");
  } else {
    bullets.push("Geringer Führungsaufwand. Natürliche Passung vorhanden.");
  }

  return bullets;
}

function buildConstellationRisks(rk: ComponentKey, ck: ComponentKey, gapLevel: string, rt: Triad, ct: Triad, fitSubtype: FitSubtype = "MISMATCH"): string[] {
  if (fitSubtype === "PERFECT") return [];

  const gapI = Math.abs(rt.impulsiv - ct.impulsiv);
  const gapN = Math.abs(rt.intuitiv - ct.intuitiv);
  const gapA = Math.abs(rt.analytisch - ct.analytisch);
  const risks: string[] = [];

  if (fitSubtype === "STRUCTURE_MATCH_INTENSITY_OFF") {
    risks.push("Grundrichtung stimmt, aber die Gewichtung innerhalb dieser Struktur weicht ab");
    if (gapA >= 8) risks.push("Unterschiedliches Mass an Strukturorientierung erfordert Abstimmung");
    if (gapI >= 8) risks.push("Unterschiedliches Umsetzungstempo erfordert klare Erwartungen");
    if (gapN >= 8) risks.push("Unterschiedlicher Kommunikationsstil erfordert gezielte Führung");
    if (gapA < 8 && gapI < 8 && gapN < 8) {
      risks.push("Feinabstimmung in den Nebenbereichen nötig");
      risks.push("Regelmässiges Feedback sichert die Passung langfristig");
    }
    return risks;
  }

  if (rk === "analytisch" && ck === "impulsiv") {
    risks.push("Entscheidungen werden schneller getroffen als Prozesse geprüft werden");
    risks.push("Struktur und Dokumentation verlieren an Priorität");
    risks.push("Qualitätsstandards müssen stärker eingefordert werden");
  } else if (rk === "analytisch" && ck === "intuitiv") {
    risks.push("Beziehungsdynamik dominiert über sachliche Prüfung");
    risks.push("Standards weichen auf, wenn persönliche Nähe wichtiger wird");
    risks.push("Qualitätssicherung erfordert klare Leitlinien");
  } else if (rk === "impulsiv" && ck === "analytisch") {
    risks.push("Entscheidungsgeschwindigkeit bleibt hinter der Stellenanforderung zurück");
    risks.push("Chancen werden durch zu lange Prüfphasen verpasst");
    risks.push("Klare Fristen und Zeitvorgaben sind notwendig");
  } else if (rk === "impulsiv" && ck === "intuitiv") {
    risks.push("Abstimmungsrunden verzögern Entscheidungen, die sofort fallen müssten");
    risks.push("Umsetzungstempo leidet unter Konsensbedürfnis");
    risks.push("Direkte Zielvorgaben sind wichtiger als Teamdiskussionen");
  } else if (rk === "intuitiv" && ck === "impulsiv") {
    risks.push("Betroffene fühlen sich übergangen, weil Entscheidungen ohne Einbindung fallen");
    risks.push("Beziehungsarbeit und Teamzusammenhalt kommen zu kurz");
    risks.push("Kommunikationsregeln müssen aktiv etabliert werden");
  } else if (rk === "intuitiv" && ck === "analytisch") {
    risks.push("Zwischenmenschliche Wirkung tritt hinter formale Prozesse zurück");
    risks.push("Teamdynamik leidet unter zu sachlicher Kommunikation");
    risks.push("Persönliche Ansprache muss aktiv eingefordert werden");
  }

  return risks;
}

function buildSummary(role: string, cand: string, fit: string, rk: ComponentKey, ck: ComponentKey, gap: string, rt: Triad, ct: Triad, rConst: ConstellationType, cConst: ConstellationType, fitSubtype: FitSubtype = "MISMATCH"): string {
  const s = Subj(cand);

  if (fitSubtype === "PERFECT") {
    return `${constellationRoleText(rConst)} ${s} arbeitet nach demselben Grundprinzip. Arbeitsweise und Prioritäten passen zur Stelle ${role}. Kleinere Unterschiede in der Gewichtung der Nebenbereiche sind im Alltag gut handhabbar.`;
  }

  if (fitSubtype === "STRUCTURE_MATCH_INTENSITY_OFF") {
    if (gap === "hoch") {
      return `${constellationRoleText(rConst)} ${s} arbeitet in dieselbe Richtung, aber die Gewichtung der Nebenbereiche weicht erheblich ab. Im Alltag führt das zu Reibung bei Tempo, Kommunikation und Arbeitsstruktur. Der Führungsaufwand ist hoch.`;
    }
    return `${constellationRoleText(rConst)} ${s} arbeitet in dieselbe Grundrichtung. Die Gewichtung innerhalb dieser Struktur weicht jedoch ab. ${constellationCandText(cConst, cand)} Im Alltag zeigen sich die Unterschiede bei Tempo, Kommunikation oder Arbeitsstruktur. Gezielte Führung gleicht das aus.`;
  }

  if (fitSubtype === "MISMATCH") {
    if (gap === "hoch") {
      return `${constellationRoleText(rConst)} ${constellationCandText(cConst, cand)} Stelle und ${subj(cand)} arbeiten nach unterschiedlichen Prinzipien. Im Alltag führt das zu Reibung bei Entscheidungen, Arbeitsweise und Zusammenarbeit.`;
    }
    return `${constellationRoleText(rConst)} ${s} bringt eine andere Arbeitslogik mit als die Stelle ${role} erfordert. ${constellationCandText(cConst, cand)} Die Unterschiede sind deutlich und erfordern gezielte Führung und klare Erwartungen.`;
  }

  return `${constellationRoleText(rConst)} ${s} bringt eine teilweise passende Arbeitslogik mit. ${constellationCandText(cConst, cand)} Die Unterschiede sind erkennbar, lassen sich aber bei gezielter Führung und klaren Erwartungen ausgleichen.`;
}

function buildDominanceShift(role: string, cand: string, rk: ComponentKey, ck: ComponentKey, rt: Triad, ct: Triad, rConst: ConstellationType, cConst: ConstellationType, fitSubtype: FitSubtype = "MISMATCH"): string {
  const s = Subj(cand);

  if (fitSubtype === "PERFECT") {
    return `${constellationRoleText(rConst)} ${s} setzt auf dieselbe Arbeitslogik. Die Grundrichtung und Gewichtung passen. Einzelne Situationen werden ähnlich angegangen.`;
  }

  if (fitSubtype === "STRUCTURE_MATCH_INTENSITY_OFF") {
    const gapI = Math.abs(rt.impulsiv - ct.impulsiv);
    const gapN = Math.abs(rt.intuitiv - ct.intuitiv);
    const gapA = Math.abs(rt.analytisch - ct.analytisch);
    const maxGapKey = gapI >= gapN && gapI >= gapA ? "impulsiv" : gapN >= gapA ? "intuitiv" : "analytisch";
    const abweichung = maxGapKey === "impulsiv" ? "Umsetzungstempo" : maxGapKey === "intuitiv" ? "Kommunikation und Abstimmung" : "analytische Tiefe und Struktur";
    return `${constellationRoleText(rConst)} ${s} arbeitet in dieselbe Grundrichtung, gewichtet aber die Nebenbereiche anders: ${constellationCandText(cConst, cand)} Die grösste Abweichung zeigt sich bei ${abweichung}. Das kann im Arbeitsalltag zu unterschiedlichem Verhalten führen.`;
  }

  if (rk !== ck) {
    const isDoubleDom = cConst.includes("NEAR") || cConst === "BALANCED";
    if (isDoubleDom) {
      return `${constellationRoleText(rConst)} ${s} bringt jedoch eine andere Arbeitsweise mit: ${constellationCandText(cConst, cand)} Da ${subj(cand)} zwischen zwei Ausrichtungen wechselt, ist das Verhalten weniger vorhersehbar. Klare Rahmenvorgaben und regelmässiges Feedback sind besonders wichtig.`;
    }
    return `${constellationRoleText(rConst)} ${s} arbeitet aber anders: ${constellationCandText(cConst, cand)} Dadurch verschiebt sich im Alltag der Schwerpunkt weg von ${compShort(rk)} hin zu ${compShort(ck)}.`;
  }

  return `${constellationRoleText(rConst)} ${s} arbeitet in dieselbe Richtung, gewichtet aber anders: ${constellationCandText(cConst, cand)} Das kann in bestimmten Situationen zu unterschiedlichem Verhalten führen.`;
}

function buildStressBehavior(cConst: ConstellationType, ct: Triad, cand: string, gapLevel: string): StressBehavior {
  const pk = primaryKey(cConst);
  const sk = secondaryKey(cConst, ct);
  const rest = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== pk);
  const tk = rest.find(k => k !== sk)!;
  const d12 = ct[pk] - ct[sk];
  const competing23 = Math.abs(ct[rest[0]] - ct[rest[1]]) <= 5 && Math.min(ct[rest[0]], ct[rest[1]]) > 15;

  const primaryBehavior: Record<ComponentKey, string> = {
    impulsiv: "Themen schnell voranzutreiben, Entscheidungen zügig zu treffen und Tempo zu erhöhen",
    intuitiv: "Menschen einzubinden, Orientierung über Kommunikation zu geben und Abstimmung zu suchen",
    analytisch: "Abläufe zu sichern, Prioritäten sauber zu ordnen und Fehlerquellen zu kontrollieren",
  };

  const secondaryBehavior: Record<ComponentKey, string> = {
    impulsiv: "Entscheidungen werden direkter und schneller getroffen. Das Verhalten wird handlungsorientierter und weniger gründlich abgesichert",
    intuitiv: "Es wird mehr moderiert, erklärt und abgestimmt. Der Fokus verschiebt sich stärker auf zwischenmenschliche Absicherung",
    analytisch: "Es wird stärker geordnet, geprüft und abgesichert. Entscheidungen werden langsamer, aber kontrollierter",
  };

  const secondaryDecision: Record<ComponentKey, string> = {
    impulsiv: "schneller, aber weniger abgesichert",
    intuitiv: "kontextbezogener, aber weniger faktenbasiert",
    analytisch: "gründlicher, aber langsamer",
  };

  const sn = Subj(cand);
  let controlledPressure: string;
  if (cConst === "BALANCED") {
    controlledPressure = `Steigt der Arbeitsdruck, greift ${subj(cand)} auf die situativ naheliegendste Arbeitslogik zurück. Da das Profil ausgeglichen ist, gibt es keinen klaren Automatismus. Die Reaktion hängt stärker vom Kontext und der Führung ab.`;
  } else if (cConst.includes("NEAR")) {
    controlledPressure = `Steigt der Arbeitsdruck, greift ${subj(cand)} auf die gerade führende Logik zurück. Da beide Hauptanteile fast gleich stark sind, fällt die Reaktion situationsabhängig aus: Mal wird stärker über ${compShort(pk)} gesteuert, mal über ${compShort(sk)}.`;
  } else if (competing23) {
    controlledPressure = `Steigt der Arbeitsdruck, verstärkt sich zunächst die Tendenz, ${primaryBehavior[pk]}. Da ${compShort(sk)} und ${compShort(tk)} fast gleich stark ausgeprägt sind, entsteht kein klarer Ausgleich – beide Nebenbereiche konkurrieren unter Druck.`;
  } else {
    controlledPressure = `Steigt der Arbeitsdruck, verstärkt sich zunächst die Tendenz, ${primaryBehavior[pk]}. Kurzfristig stabilisiert das die Situation, gleichzeitig steigt das Risiko, dass ${compShort(sk)} in den Hintergrund tritt.`;
  }

  let uncontrolledStress: string;
  if (cConst === "BALANCED") {
    uncontrolledStress = `Wird der Druck sehr hoch, kann das Verhalten kippen oder wechseln, weil kein klarer Schwerpunkt dominiert. Die Reaktion wird weniger vorhersagbar. ${sn} braucht in Stressphasen besonders klare Orientierung und Leitplanken.`;
  } else if (competing23) {
    uncontrolledStress = `Wird die Belastung sehr hoch, konkurrieren ${compShort(sk)} und ${compShort(tk)} als Ausweichreaktionen. ${sn} wechselt zwischen beiden Nebenbereiche, ohne sich auf eine festzulegen. Das Verhalten wird weniger berechenbar. Die Führungskraft muss klare Prioritäten und Leitplanken setzen.`;
  } else if (d12 <= 5) {
    uncontrolledStress = `Wird die Belastung sehr hoch, kann sich der Schwerpunkt leicht verschieben. ${sn} bleibt im Grundverhalten erkennbar, nutzt aber merklich stärker ${compShort(sk)}. ${secondaryBehavior[sk]}. Die Arbeitsweise verändert sich, die Grundrichtung bleibt aber erkennbar.`;
  } else {
    uncontrolledStress = `Wird die Belastung sehr hoch und treten viele Anforderungen gleichzeitig auf, verschiebt sich das Verhalten merklich. ${compShort(sk)} tritt stärker in den Vordergrund. ${secondaryBehavior[sk]}. Entscheidungen werden ${secondaryDecision[sk]}.`;
  }

  return { controlledPressure, uncontrolledStress };
}

function buildImpactAreas(rk: ComponentKey, ck: ComponentKey, rt: Triad, ct: Triad, cand: string, fuehrungsArt: FuehrungsArt, roleIsBalFull = false, fitLabel = "", fitSubtype: FitSubtype = "MISMATCH"): ImpactArea[] {
  const gapI = Math.abs(rt.impulsiv - ct.impulsiv);
  const gapN = Math.abs(rt.intuitiv - ct.intuitiv);
  const gapA = Math.abs(rt.analytisch - ct.analytisch);
  const candSpread = Math.max(ct.impulsiv, ct.intuitiv, ct.analytisch) - Math.min(ct.impulsiv, ct.intuitiv, ct.analytisch);
  const candIsBalFull = candSpread <= 5;

  const cSorted = ([
    { key: "impulsiv" as ComponentKey, val: ct.impulsiv },
    { key: "intuitiv" as ComponentKey, val: ct.intuitiv },
    { key: "analytisch" as ComponentKey, val: ct.analytisch },
  ] as { key: ComponentKey; val: number }[]).sort((a, b) => b.val - a.val);
  const candGap1 = cSorted[0].val - cSorted[1].val;
  const candGap2 = cSorted[1].val - cSorted[2].val;
  const candIsDualDom = !candIsBalFull && candGap1 <= 5 && candGap2 > 5;
  const ck2: ComponentKey = cSorted[1].key;
  const candDualMatchesRole = candIsDualDom && (rk === ck || rk === ck2);

  const areas: ImpactArea[] = [
    buildDecisionImpact(rk, ck, gapI, gapA, gapN, cand, roleIsBalFull, ct, candIsBalFull, candIsDualDom, ck2, fitSubtype),
    buildWorkStructureImpact(rk, ck, rt, ct, gapA, cand, candIsBalFull, candIsDualDom, ck2, fitSubtype),
  ];

  if (fuehrungsArt !== "keine") {
    areas.push(buildLeadershipImpact(rk, ck, gapI, gapN, gapA, cand, fuehrungsArt, roleIsBalFull, ct, candIsBalFull, candIsDualDom, ck2, fitSubtype));
  }

  areas.push(buildCommunicationImpact(rk, ck, gapI, gapN, gapA, cand, roleIsBalFull, ct, candIsBalFull, candIsDualDom, ck2, fitSubtype));
  areas.push(buildCultureImpact(rk, ck, gapI, gapN, gapA, cand, roleIsBalFull, ct, candIsBalFull, candIsDualDom, ck2, fitSubtype));

  if (rk !== ck && !roleIsBalFull && !candIsBalFull && !candDualMatchesRole) {
    for (const area of areas) {
      if (area.severity === "ok") {
        area.severity = "warning";
      }
    }
  }

  if (fitLabel === "Nicht geeignet") {
    for (const area of areas) {
      if (area.severity === "ok") {
        area.severity = "warning";
      }
    }
  } else if (fitLabel === "Bedingt geeignet") {
    const okCount = areas.filter(a => a.severity === "ok").length;
    if (okCount > 2) {
      let lifted = 0;
      for (let i = areas.length - 1; i >= 0 && lifted < okCount - 2; i--) {
        if (areas[i].severity === "ok") {
          areas[i].severity = "warning";
          lifted++;
        }
      }
    }
  }

  return areas;
}

function buildDecisionImpact(rk: ComponentKey, ck: ComponentKey, gapI: number, gapA: number, gapN: number, cand: string, roleIsBalFull = false, ct?: Triad, candIsBalFull = false, candIsDualDom = false, ck2?: ComponentKey, fitSubtype: FitSubtype = "MISMATCH"): ImpactArea {
  const maxGap = Math.max(gapI, gapA, gapN);
  const s = Subj(cand);

  let roleNeed: string;
  let candidatePattern: string;
  let risk: string;

  if (candIsDualDom && ck2 && !roleIsBalFull) {
    const pair = dualPairKey(ck, ck2);
    const dualMatchesRole = rk === ck || rk === ck2;
    const sev = severity(dualMatchesRole ? maxGap * 0.45 : maxGap * 0.75);
    roleNeed = rk === "impulsiv"
      ? "Schnelle, ergebnisorientierte Entscheidungen. Klare Richtung und direkte Umsetzung vor langer Prüfung."
      : rk === "intuitiv"
        ? "Entscheidungen, die Kontext, Zusammenarbeit und zwischenmenschliche Wirkung berücksichtigen. Abstimmung im Team vor Geschwindigkeit."
        : "Sorgfältige, prüforientierte Entscheidungen. Optionen abwägen, Risiken prüfen, erst dann handeln.";
    candidatePattern = `${s} ${dualCandDecision[pair]}`;
    const third = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).find(k => k !== ck && k !== ck2)!;
    const thirdLabel = third === "impulsiv" ? "Handlungstempo" : third === "intuitiv" ? "Einbindung und Abstimmung" : "analytische Tiefe";
    if (dualMatchesRole) {
      risk = maxGap >= 10
        ? `Die Entscheidungslogik passt in einer der beiden Ausprägungen. Da ${subj(cand)} zwischen zwei Stilen wechselt, kann die geforderte Konsequenz schwanken. ${thirdLabel} bleibt untervertreten. Klare Entscheidungsrahmen helfen.`
        : `Die Entscheidungslogik passt grundsätzlich. ${s} deckt die Stellenanforderung über eine der beiden Stärken ab. Der Wechsel zwischen zwei Stilen erfordert bewusste Steuerung.`;
    } else {
      risk = `Die Stelle erfordert eine Entscheidungslogik, die weder der ersten noch der zweiten Ausprägung der Person entspricht. ${thirdLabel} bleibt untervertreten. Der Führungsaufwand ist erhöht.`;
    }
    return { id: "decision", label: "Entscheidungsverhalten", severity: sev, roleNeed, candidatePattern, risk };
  }

  if (candIsBalFull && !roleIsBalFull) {
    const totalGap = gapI + gapN + gapA;
    const sev = severity(totalGap * 0.35);
    const rkLabel = rk === "impulsiv" ? "schnelle, handlungsorientierte" : rk === "intuitiv" ? "kontextbezogene, abstimmungsorientierte" : "analytische, prüforientierte";
    roleNeed = rk === "impulsiv"
      ? "Schnelle, ergebnisorientierte Entscheidungen. Klare Richtung und direkte Umsetzung vor langer Prüfung."
      : rk === "intuitiv"
        ? "Entscheidungen, die Kontext, Zusammenarbeit und zwischenmenschliche Wirkung berücksichtigen. Abstimmung im Team vor Geschwindigkeit."
        : "Sorgfältige, prüforientierte Entscheidungen. Optionen abwägen, Risiken prüfen, erst dann handeln.";
    candidatePattern = `${s} entscheidet situativ und vielseitig – je nach Kontext analytisch, handlungsorientiert oder abstimmungsorientiert. Keine einzelne Entscheidungslogik dominiert.`;
    risk = totalGap >= 15
      ? `Die Stelle erfordert ${rkLabel} Entscheidungen. ${s} verteilt die Entscheidungslogik gleichmässig und verfolgt den geforderten Schwerpunkt nicht konsequent genug. Gezielte Führung nötig.`
      : `${s} bringt eine vielseitige Entscheidungsbasis mit. Die Stellenanforderung wird grundsätzlich abgedeckt, auch wenn kein klarer Schwerpunkt erkennbar ist.`;
    return { id: "decision", label: "Entscheidungsverhalten", severity: sev, roleNeed, candidatePattern, risk };
  }

  if (roleIsBalFull) {
    const totalGap = gapI + gapN + gapA;
    const sev = severity(totalGap * 0.35);
    roleNeed = "Situative Entscheidungsfähigkeit. Die Stelle verlangt, je nach Situation analytisch, handlungsorientiert oder kontextbezogen zu entscheiden. Keine einzelne Logik dominiert.";
    if (ct && Math.max(ct.impulsiv, ct.intuitiv, ct.analytisch) - Math.min(ct.impulsiv, ct.intuitiv, ct.analytisch) <= 10) {
      candidatePattern = `${s} bringt ebenfalls eine breite Entscheidungsbasis mit. Die Vielseitigkeit passt zur Stellenanforderung.`;
      risk = totalGap >= 15
        ? "Die Grundrichtung passt, aber die Gewichtung der drei Entscheidungslogiken unterscheidet sich. In einzelnen Situationen kann die Reaktion anders ausfallen als erwartet."
        : "Die Entscheidungslogik passt zur Stellenanforderung. Sowohl Stelle als auch Person arbeiten situativ und vielseitig.";
    } else {
      const ckLabel = ck === "impulsiv" ? "schnelle, handlungsorientierte" : ck === "intuitiv" ? "kontextbezogene, abstimmungsorientierte" : "analytische, prüfungsorientierte";
      const weakAreas = [];
      if (ct && ct.impulsiv < 20) weakAreas.push("Handlungstempo");
      if (ct && ct.intuitiv < 20) weakAreas.push("Kontextgespür");
      if (ct && ct.analytisch < 20) weakAreas.push("Analysefähigkeit");
      const weakStr = weakAreas.length > 0 ? ` Besonders ${weakAreas.join(" und ")} liegt erheblich unter der Stellenanforderung.` : "";
      candidatePattern = `${s} entscheidet bevorzugt über ${ckLabel} Logik. Die Stelle verlangt jedoch Vielseitigkeit, nicht Spezialisierung.`;
      risk = `Die einseitige Entscheidungslogik führt dazu, dass bestimmte Situationen nicht mit der passenden Herangehensweise bearbeitet werden.${weakStr} Die Führungskraft muss gezielt gegensteuern.`;
    }
    return { id: "decision", label: "Entscheidungsverhalten", severity: sev, roleNeed, candidatePattern, risk };
  }

  const sev = rk === ck ? severity(maxGap * 0.4) : severity(rk === "analytisch" ? Math.max(maxGap, gapA + 5) : maxGap);

  const decRest = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== ck);
  const decCompeting23 = ct ? Math.abs(ct[decRest[0]] - ct[decRest[1]]) <= 5 && Math.min(ct[decRest[0]], ct[decRest[1]]) > 15 : false;

  if (rk === ck) {
    const isPerfect = fitSubtype === "PERFECT";
    if (rk === "analytisch") {
      roleNeed = "Sorgfältige, prüforientierte Entscheidungen. Optionen abwägen, Risiken prüfen, erst dann handeln.";
      candidatePattern = isPerfect
        ? `${s} arbeitet ebenfalls analytisch und prüft Entscheidungen gründlich. Der Grundansatz ist deckungsgleich.`
        : `${s} arbeitet ebenfalls analytisch und prüft Entscheidungen gründlich. Die Grundrichtung ist stimmig, die Gewichtung der Nebenbereiche weicht jedoch ab.`;
      if (decCompeting23) {
        risk = "Die Entscheidungslogik ist in der Grundrichtung stimmig. Da die beiden Nebenbereiche fast gleich stark sind, kann unter Druck die Ausweichreaktion wechselnd ausfallen – mal handlungsorientierter, mal abstimmungsorientierter.";
      } else {
        risk = isPerfect
          ? "Entscheidungslogik ist deckungsgleich mit der Stellenanforderung."
          : "Die Entscheidungslogik ist in der Grundrichtung stimmig. Die Gewichtung der Nebenbereiche ist jedoch nicht deckungsgleich – Tempo oder Kommunikation werden unterschiedlich priorisiert.";
      }
    } else if (rk === "impulsiv") {
      roleNeed = "Schnelle, ergebnisorientierte Entscheidungen. Klare Richtung und direkte Umsetzung vor langer Prüfung.";
      candidatePattern = isPerfect
        ? `${s} entscheidet ebenfalls schnell und handlungsorientiert. Grunddynamik und Gewichtung sind deckungsgleich.`
        : `${s} entscheidet ebenfalls schnell und handlungsorientiert. Die Grunddynamik ist stimmig, die Gewichtung der Nebenbereiche weicht jedoch ab.`;
      if (decCompeting23) {
        risk = "Die Entscheidungsgeschwindigkeit ist in der Grundrichtung stimmig. Da die Nebenbereiche konkurrieren, schwankt die Absicherungsstrategie: Mal wird eher abgestimmt, mal eher geprüft. Das erzeugt wechselndes Verhalten im Detail.";
      } else {
        risk = isPerfect
          ? "Entscheidungslogik ist deckungsgleich mit der Stellenanforderung."
          : "Die Entscheidungsgeschwindigkeit ist in der Grundrichtung stimmig. Die Gewichtung der Nebenbereiche ist jedoch nicht deckungsgleich – Absicherung oder Abstimmung werden unterschiedlich priorisiert.";
      }
    } else {
      roleNeed = "Entscheidungen, die Kontext, Zusammenarbeit und zwischenmenschliche Wirkung berücksichtigen. Abstimmung im Team vor Geschwindigkeit.";
      candidatePattern = isPerfect
        ? `${s} entscheidet ebenfalls kontextbezogen und bezieht das Umfeld aktiv ein. Grundhaltung und Gewichtung sind deckungsgleich.`
        : `${s} entscheidet ebenfalls kontextbezogen und bezieht das Umfeld aktiv ein. Die Grundhaltung ist stimmig, die Gewichtung der Nebenbereiche weicht jedoch ab.`;
      if (decCompeting23) {
        risk = "Die Kommunikationsorientierung ist in der Grundrichtung stimmig. Da die Nebenbereiche konkurrieren, kann die Abstützung der Entscheidung wechseln – mal faktenbasierter, mal handlungsorientierter.";
      } else {
        risk = isPerfect
          ? "Entscheidungslogik ist deckungsgleich mit der Stellenanforderung."
          : "Die Kommunikationsorientierung ist in der Grundrichtung stimmig. Die Gewichtung der Nebenbereiche ist jedoch nicht deckungsgleich – Strukturklarheit oder Umsetzungstempo werden unterschiedlich priorisiert.";
      }
    }
  } else if (rk === "analytisch") {
    roleNeed = "Sorgfältige, prüforientierte Entscheidungen. Optionen abwägen, Risiken prüfen, erst dann handeln.";
    if (ck === "impulsiv") {
      candidatePattern = `${s} entscheidet wesentlich schneller und handelt oft, bevor alle Informationen vorliegen.`;
      risk = decCompeting23
        ? "Prüfschritte werden verkürzt oder übersprungen. Da die Nebenbereiche konkurrieren, fehlt ein stabiler Ausgleich – die Absicherung schwankt zwischen Kontextgespür und Faktenprüfung, ohne eine Linie konsequent durchzuhalten."
        : "Prüfschritte werden verkürzt oder übersprungen. Bei komplexen Aufgaben steigt das Risiko für Fehler oder Nacharbeit.";
    } else {
      candidatePattern = `${s} entscheidet stärker aus dem Kontext heraus und bezieht Stimmungen und Beziehungen ein. Datenbasierte Prüfung steht weniger im Vordergrund.`;
      risk = decCompeting23
        ? "Technische Details und Risikoabwägungen kommen zu kurz. Da die Nebenbereiche konkurrieren, wechselt die Ausweichstrategie unter Druck – mal wird schnell gehandelt, mal stärker geprüft. Das erzeugt ein inkonsistentes Entscheidungsmuster."
        : "Technische Details und Risikoabwägungen kommen zu kurz, wenn zwischenmenschliche Faktoren die Entscheidung bestimmen.";
    }
  } else if (rk === "impulsiv") {
    roleNeed = "Schnelle, ergebnisorientierte Entscheidungen. Klare Richtung und direkte Umsetzung vor langer Prüfung.";
    if (ck === "analytisch") {
      candidatePattern = `${s} prüft gründlich und braucht eine solide Datengrundlage vor jeder Entscheidung. Das Tempo bleibt unter dem Stellenbedarf.`;
      risk = decCompeting23
        ? "In Situationen, die schnelles Handeln erfordern, entstehen Verzögerungen. Da die Nebenbereiche konkurrieren, schwankt die Reaktion unter Druck – mal wird abgestimmt, mal weiter geprüft. Klare Handlungsimpulse fehlen dauerhaft."
        : "In Situationen, die schnelles Handeln erfordern, entstehen Verzögerungen. Chancen werden verpasst, weil die Entscheidung zu spät fällt.";
    } else {
      candidatePattern = `${s} bezieht bei Entscheidungen stark den Kontext und die beteiligten Menschen ein. Abstimmungsprozesse dauern länger als die Stelle erlaubt.`;
      risk = decCompeting23
        ? "Entscheidungen verzögern sich durch Abstimmungsrunden. Da die Nebenbereiche konkurrieren, pendelt die Absicherung zwischen Faktenprüfung und schnellem Handeln, ohne eine klare Linie zu finden. Das Umsetzungstempo leidet zusätzlich."
        : "Entscheidungen, die sofort fallen müssten, verzögern sich durch Abstimmungsrunden. Das Umsetzungstempo leidet.";
    }
  } else {
    roleNeed = "Entscheidungen, die Kontext, Zusammenarbeit und zwischenmenschliche Wirkung berücksichtigen. Abstimmung im Team vor Geschwindigkeit.";
    if (ck === "impulsiv") {
      candidatePattern = `${s} trifft Entscheidungen schnell und handlungsorientiert. Die Wirkung auf andere wird dabei selten berücksichtigt.`;
      risk = decCompeting23
        ? "Betroffene fühlen sich übergangen. Da die Nebenbereiche konkurrieren, schwankt das Verhalten unter Druck zwischen sachlicher Kontrolle und weiterem Tempodruck. Einbindung findet in keinem Fall ausreichend statt."
        : "Betroffene fühlen sich übergangen. Entscheidungen fallen ohne ausreichende Einbindung. Das belastet langfristig die Zusammenarbeit.";
    } else {
      candidatePattern = `${s} entscheidet über Fakten und Regeln. Der zwischenmenschliche Arbeitsbereich steht weniger im Fokus.`;
      risk = decCompeting23
        ? "Sachlich korrekte Entscheidungen, aber die Wirkung auf Motivation und Teamdynamik wird unterschätzt. Da die Nebenbereiche konkurrieren, wechselt das Verhalten unter Druck zwischen Tempo und weiterer Analyse – persönliche Einbindung bleibt in beiden Fällen nachrangig."
        : "Sachlich korrekte Entscheidungen, aber Auswirkungen auf Motivation und Teamdynamik werden unterschätzt.";
    }
  }

  return { id: "decision", label: "Entscheidungsverhalten", severity: sev, roleNeed, candidatePattern, risk };
}

function buildWorkStructureImpact(rk: ComponentKey, ck: ComponentKey, rt: Triad, ct: Triad, gapA: number, cand: string, candIsBalFull = false, candIsDualDom = false, ck2?: ComponentKey, fitSubtype: FitSubtype = "MISMATCH"): ImpactArea {
  const maxGapAll = Math.max(Math.abs(rt.impulsiv - ct.impulsiv), Math.abs(rt.intuitiv - ct.intuitiv), gapA);
  const candDualMatchesRole = candIsDualDom && ck2 && (rk === ck || rk === ck2);
  const structureBoost = (rk !== ck && !candIsBalFull && !candDualMatchesRole) ? Math.min(maxGapAll * 0.65, gapA + 10) : 0;
  const sev = severity((rk !== ck && !candIsBalFull && !candDualMatchesRole) ? Math.max(gapA, structureBoost) : gapA);

  let roleNeed: string;
  let candidatePattern: string;
  let risk: string;

  if (rt.analytisch >= 35) {
    roleNeed = "Klare Struktur, Priorisierung und verlässliche Abläufe. Arbeitsschritte nachvollziehbar planen und kontrollieren.";
  } else if (rt.analytisch >= 25) {
    roleNeed = "Grundlegende Ordnung in Abläufen und Prozessen. Aufgaben strukturiert abarbeiten.";
  } else {
    roleNeed = "Flexible, ergebnisorientierte Arbeitsweise. Schnelle Anpassung vor formaler Planung.";
  }

  const s = Subj(cand);
  if (candIsBalFull) {
    candidatePattern = `${s} arbeitet situativ und vielseitig. Je nach Anforderung wird strukturiert, tempoorientiert oder abstimmungsorientiert gearbeitet. Kein einzelner Arbeitsstil dominiert.`;
  } else if (ct.analytisch >= 35) {
    candidatePattern = `${s} arbeitet strukturiert mit klaren Abläufen und festen Arbeitsschritten. Planung hat hohe Priorität.`;
  } else if (ct.analytisch >= 25) {
    candidatePattern = `${s} arbeitet grundlegend strukturiert, lässt aber Raum für situative Anpassungen.`;
  } else {
    candidatePattern = `${s} arbeitet situativ und tempoorientiert. Strukturierte Planung und Dokumentation haben geringe Priorität.`;
  }

  const secI = ct.impulsiv;
  const secN = ct.intuitiv;
  const secA = ct.analytisch;
  const sec2 = ck === "impulsiv" ? Math.max(secN, secA) : ck === "intuitiv" ? Math.max(secI, secA) : Math.max(secI, secN);
  const sec3 = ck === "impulsiv" ? Math.min(secN, secA) : ck === "intuitiv" ? Math.min(secI, secA) : Math.min(secI, secN);
  const competing23 = Math.abs(sec2 - sec3) <= 5 && sec2 > 15;

  if (candIsDualDom && ck2) {
    const pair = dualPairKey(ck, ck2);
    const hasAnalytisch = ck === "analytisch" || ck2 === "analytisch";
    if (gapA >= 10 && ct.analytisch < rt.analytisch) {
      risk = hasAnalytisch
        ? `${s} bringt analytische Fähigkeiten als eine von zwei Stärken mit. Die Stelle erfordert aber eine konsequentere Strukturtiefe. Da ${subj(cand)} zwischen zwei Arbeitsstilen wechselt, wird die analytische Linie nicht durchgehend gehalten. Klare Prozessvorgaben nötig.`
        : `${s} priorisiert weder Struktur noch Analyse konsequent. Prüfschritte werden verkürzt oder übersprungen. Die Führungskraft muss Prozessklarheit aktiv einfordern.`;
    } else if (gapA >= 10 && ct.analytisch > rt.analytisch) {
      risk = `${s} bringt mehr Strukturorientierung mit als die Stelle erfordert. Der Wechsel zwischen zwei Arbeitsstilen kann das Tempo zusätzlich bremsen. Klare Priorisierung durch Führung empfohlen.`;
    } else {
      risk = candDualMatchesRole
        ? `Die Arbeitsweise passt über eine der beiden Ausprägungen. Der Wechsel zwischen zwei Stilen kann situativ zu unterschiedlichem Arbeitstempo führen. Feinabstimmung durch Führung empfohlen.`
        : `Die strukturelle Arbeitsweise weicht nicht stark ab, aber die Doppelausprägung beeinflusst, wie Aufgaben priorisiert und umgesetzt werden. Feinabstimmung durch Führung nötig.`;
    }
  } else if (candIsBalFull) {
    if (gapA >= 10 && ct.analytisch < rt.analytisch) {
      risk = `Die Stelle erfordert ein klares Mass an Struktur. ${s} arbeitet vielseitig und kann sich anpassen, liefert aber nicht die konsequente Strukturtiefe, die erwartet wird. Die Führungskraft sollte Prozessstandards vorgeben.`;
    } else if (gapA >= 10 && ct.analytisch > rt.analytisch) {
      risk = `${s} bringt mehr Strukturorientierung mit als die Stelle erfordert. Das kann das Tempo bremsen, wird aber durch die vielseitige Arbeitsweise teilweise kompensiert.`;
    } else {
      risk = `${s} arbeitet vielseitig und passt sich der Situation an. Die Arbeitsweise deckt die Stellenanforderung grundsätzlich ab. Feinabstimmung durch Führung empfohlen.`;
    }
  } else if (gapA >= 10 && ct.analytisch < rt.analytisch) {
    if (ck === "analytisch") {
      if (competing23) {
        risk = `${s} arbeitet grundsätzlich strukturiert, aber die beiden Nebenbereiche sind fast gleich stark. Unter Druck konkurrieren Handlungsimpulse und Abstimmungsbedürfnisse – die analytische Linie wird instabil. Die Führungskraft muss klare Prozessvorgaben setzen.`;
      } else {
        risk = `${s} arbeitet strukturiert, aber der analytische Anteil reicht nicht vollständig für die Stellenanforderung. Bei hoher Komplexität fehlt die letzte Tiefe in Prüfung und Dokumentation. Die Führungskraft sollte Qualitätsstandards klar definieren.`;
      }
    } else if (ck === "impulsiv") {
      if (competing23) {
        risk = `${s} priorisiert Tempo vor Struktur. Da die beiden Nebenbereiche konkurrieren, fehlt ein stabiler Ausgleich zur Handlungsorientierung. Prüfschritte werden verkürzt oder übersprungen. Die Führungskraft muss Prozessklarheit aktiv einfordern.`;
      } else {
        risk = `Bei parallelen Aufgaben handelt ${subj(cand)} eher schnell statt Schritte zu prüfen. Prüfschritte werden verkürzt oder übersprungen. Die Führungskraft muss Prozessklarheit aktiv einfordern.`;
      }
    } else {
      if (competing23) {
        risk = `${s} steuert über Abstimmung und Kommunikation statt über Struktur. Da die beiden Nebenbereiche konkurrieren, wechselt die Arbeitsweise situativ. Verbindliche Abläufe entstehen nicht von allein. Die Führungskraft muss Prozessrahmen vorgeben.`;
      } else {
        risk = `${s} arbeitet kontextbezogen und stimmt sich lieber ab, statt Abläufe strukturiert zu planen. Dokumentation und formale Prüfung haben geringe Priorität. Die Führungskraft muss Prozessstandards einfordern.`;
      }
    }
  } else if (gapA >= 10 && ct.analytisch > rt.analytisch) {
    if (competing23) {
      risk = `Aufgaben werden gründlicher geprüft als die Stelle erfordert. Da die Nebenbereiche konkurrieren, fehlt ein klarer Impuls zum Abschluss. ${s} investiert zu viel Zeit in Absicherung. Das bremst das Gesamttempo.`;
    } else {
      risk = `Aufgaben werden länger geprüft als notwendig. ${s} investiert mehr Zeit in Planung und Absicherung als die Stelle erlaubt. Das bremst das Gesamttempo.`;
    }
  } else {
    if (rk !== ck && !candIsBalFull) {
      if (competing23) {
        risk = "Die strukturelle Arbeitsweise weicht nicht stark ab, aber die unterschiedliche Grunddynamik beeinflusst Tempo und Prioritäten. Die konkurrierenden Nebenbereiche können situativ zu wechselndem Arbeitsstil führen. Führung muss Erwartungen klar setzen.";
      } else {
        risk = "Die strukturelle Arbeitsweise weicht nicht stark ab, aber die unterschiedliche Grunddynamik beeinflusst, wie Aufgaben priorisiert und umgesetzt werden. Feinabstimmung durch Führung nötig.";
      }
    } else {
      const isPerfectWork = fitSubtype === "PERFECT";
      if (competing23) {
        risk = isPerfectWork
          ? "Arbeitsweise ist deckungsgleich mit der Stellenanforderung. Die konkurrierenden Nebenbereiche können situativ zu leicht wechselndem Arbeitsstil führen."
          : "Arbeitsweise ist in der Grundrichtung stimmig. Die konkurrierenden Nebenbereiche können situativ zu wechselndem Arbeitsstil führen. Feinabstimmung durch Führung empfohlen.";
      } else {
        risk = isPerfectWork
          ? "Arbeitsweise ist deckungsgleich mit der Stellenanforderung."
          : "Arbeitsweise ist in der Grundrichtung stimmig, die Gewichtung ist jedoch nicht vollständig deckungsgleich. Feinabstimmung durch Führung empfohlen.";
      }
    }
  }

  return { id: "work_structure", label: "Arbeitsweise", severity: sev, roleNeed, candidatePattern, risk };
}

function buildLeadershipImpact(rk: ComponentKey, ck: ComponentKey, gapI: number, gapN: number, gapA: number, cand: string, fuehrungsArt: FuehrungsArt, roleIsBalFull = false, ct?: Triad, candIsBalFull = false, candIsDualDom = false, ck2?: ComponentKey, fitSubtype: FitSubtype = "MISMATCH"): ImpactArea {
  const maxGap = Math.max(gapI, gapN, gapA);
  const s = Subj(cand);

  if (candIsDualDom && ck2 && !roleIsBalFull && ct) {
    const pair = dualPairKey(ck, ck2);
    const dualMatchesRole = rk === ck || rk === ck2;
    const sev = severity(dualMatchesRole ? maxGap * 0.45 : maxGap * 0.7);
    const roleNeed = fuehrungsArt === "disziplinarisch"
      ? (rk === "analytisch"
        ? "Führung über klare Standards, verlässliche Struktur und nachvollziehbare Entscheidungen."
        : rk === "impulsiv"
          ? "Führung über Entscheidungskraft, klare Richtung und operative Geschwindigkeit."
          : "Führung über persönliche Ansprache, offene Kommunikation und Teamdynamik.")
      : fuehrungsArt === "fachlich"
        ? (rk === "analytisch"
          ? "Fachliche Führung mit klarer Einschätzung und verlässlicher Priorisierung."
          : rk === "impulsiv"
            ? "Fachliche Führung mit schneller Orientierung und klarer Richtung."
            : "Fachliche Führung über Dialog und gemeinsame Lösungsfindung.")
        : (rk === "analytisch"
          ? "Orientierung über Struktur, Standards und klare Vorgaben."
          : rk === "impulsiv"
            ? "Wirkung über schnelle Entscheidungen und hohe Ergebnisdynamik."
            : "Wirkung über Kommunikation, Zusammenarbeit und situatives Gespür.");
    const candidatePattern = `${s} ${dualCandLeadership[pair]}`;
    const third = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).find(k => k !== ck && k !== ck2)!;
    const thirdLabel = third === "impulsiv" ? "operative Geschwindigkeit" : third === "intuitiv" ? "persönliche Nähe" : "strukturierte Verlässlichkeit";
    const risk = dualMatchesRole
      ? (maxGap >= 10
        ? `Die Führungsrichtung passt über eine der beiden Stärken. Da ${subj(cand)} zwischen zwei Führungsstilen wechselt, kann die Wirkung inkonsistent wirken. ${thirdLabel} bleibt untervertreten. Regelmässiges Feedback zur Führungswirkung empfohlen.`
        : `Der Führungsstil passt grundsätzlich über eine der beiden Ausprägungen. Der situative Wechsel erfordert bewusste Steuerung.`)
      : `Die Stelle erfordert einen Führungsstil, der weder der ersten noch der zweiten Stärke entspricht. ${thirdLabel} bleibt untervertreten. Der Führungsaufwand ist erhöht.`;
    return { id: "leadership", label: "Führungswirkung", severity: sev, roleNeed, candidatePattern, risk };
  }

  if (candIsBalFull && !roleIsBalFull && ct) {
    const totalGap = gapI + gapN + gapA;
    const sev = severity(totalGap * 0.35);
    const roleNeed = fuehrungsArt === "disziplinarisch"
      ? (rk === "analytisch"
        ? "Führung über klare Standards, verlässliche Struktur und nachvollziehbare Entscheidungen. Das Team braucht konsistente Prioritäten und Orientierung."
        : rk === "impulsiv"
          ? "Führung über Entscheidungskraft, klare Richtung und operative Geschwindigkeit. Das Team erwartet sichtbare Ergebnisorientierung."
          : "Führung über persönliche Ansprache, offene Kommunikation und ein Gespür für Teamdynamik. Das Team braucht Nähe und Vertrauen.")
      : fuehrungsArt === "fachlich"
        ? (rk === "analytisch"
          ? "Fachliche Führung mit klarer Einschätzung, Qualitätssicherheit und verlässlicher Priorisierung."
          : rk === "impulsiv"
            ? "Fachliche Führung mit schneller Orientierung, praxisnahen Entscheidungen und klarer Richtung."
            : "Fachliche Führung über Dialog, Austausch und gemeinsame Lösungsfindung.")
        : (rk === "analytisch"
          ? "Orientierung über Struktur, Standards und klare Vorgaben."
          : rk === "impulsiv"
            ? "Wirkung über schnelle Entscheidungen, klare Richtung und hohe Ergebnisdynamik."
            : "Wirkung über Kommunikation, Zusammenarbeit und situatives Gespür.");
    const candidatePattern = `${s} führt situativ und vielseitig. Je nach Kontext wird über Tempo, Dialog oder Systematik geführt. Kein einzelner Führungsstil dominiert.`;
    const rkStyle = rk === "impulsiv" ? "operative Geschwindigkeit und Entscheidungskraft" : rk === "intuitiv" ? "persönliche Nähe und Einbindung" : "strukturierte Verlässlichkeit und klare Standards";
    const risk = totalGap >= 15
      ? `Die Stelle erfordert Führung über ${rkStyle}. ${s} verteilt die Führungswirkung gleichmässig und verfolgt den geforderten Schwerpunkt nicht konsequent genug. Gezielte Steuerung durch die nächsthöhere Führungsebene nötig.`
      : `${s} bringt ein breites Führungsrepertoire mit. Die Stellenanforderung wird grundsätzlich abgedeckt, auch wenn kein klarer Führungsschwerpunkt erkennbar ist.`;
    return { id: "leadership", label: "Führungswirkung", severity: sev, roleNeed, candidatePattern, risk };
  }

  if (roleIsBalFull) {
    const totalGap = gapI + gapN + gapA;
    const maxSingleGap = Math.max(gapI, gapN, gapA);
    const sev = severity(maxSingleGap * 0.65);
    const roleNeed = fuehrungsArt === "disziplinarisch"
      ? "Führung, die alle drei Ebenen abdeckt: operative Klarheit, persönliche Nähe und strukturierte Verlässlichkeit. Die Stelle verlangt situatives Führen, nicht einen einzelnen Stil."
      : fuehrungsArt === "fachlich"
        ? "Fachliche Orientierung, die sowohl über klare Entscheidungen als auch über Dialog und Struktur wirkt. Die Stelle verlangt situative Anpassung."
        : "Die Stelle wirkt in alle Richtungen – über Handlungsorientierung, Beziehungsarbeit und strukturierte Verlässlichkeit gleichermassen.";

    let candidatePattern: string;
    let risk: string;
    if (ct && Math.max(ct.impulsiv, ct.intuitiv, ct.analytisch) - Math.min(ct.impulsiv, ct.intuitiv, ct.analytisch) <= 10) {
      candidatePattern = `${s} bringt ebenfalls eine breite Führungsbasis mit und kann situativ zwischen verschiedenen Stilen wechseln.`;
      risk = totalGap >= 15
        ? "Die Grundrichtung passt, aber die Gewichtung der Führungsebenen unterscheidet sich. In bestimmten Situationen kann die Führungswirkung anders ausfallen als erwartet."
        : "Führungsstil passt zur Stellenanforderung. Die Vielseitigkeit wird abgedeckt.";
    } else {
      const ckStyle = ck === "impulsiv" ? "Tempo und direkte Ansprache" : ck === "intuitiv" ? "persönliche Nähe und Dialog" : "Systematik und klare Regeln";
      const weakAreas = [];
      if (ct && ct.impulsiv < 20) weakAreas.push("operative Klarheit und Tempo");
      if (ct && ct.intuitiv < 20) weakAreas.push("persönliche Nähe und Teamgespür");
      if (ct && ct.analytisch < 20) weakAreas.push("strukturierte Verlässlichkeit");
      const weakStr = weakAreas.length > 0 ? ` ${weakAreas.join(" und ")} fehlt dabei deutlich.` : "";
      candidatePattern = `${s} führt vorrangig über ${ckStyle}. Die Stelle verlangt jedoch ein breites Führungsrepertoire.`;
      risk = `Die einseitige Führungswirkung deckt nur einen Teil der Stellenanforderung ab.${weakStr} Ohne gezielte Steuerung entstehen blinde Flecken in der Führung.`;
    }
    return { id: "leadership", label: "Führungswirkung", severity: sev, roleNeed, candidatePattern, risk };
  }

  const sev = severity(rk !== ck ? maxGap * 0.7 : maxGap * 0.4);

  let roleNeed: string;
  let candidatePattern: string;
  let risk: string;

  if (fuehrungsArt === "disziplinarisch") {
    roleNeed = rk === "analytisch"
      ? "Führung über klare Standards, verlässliche Struktur und nachvollziehbare Entscheidungen. Das Team braucht konsistente Prioritäten und Orientierung."
      : rk === "impulsiv"
        ? "Führung über Entscheidungskraft, klare Richtung und operative Geschwindigkeit. Das Team erwartet sichtbare Ergebnisorientierung."
        : "Führung über persönliche Ansprache, offene Kommunikation und ein Gespür für Teamdynamik. Das Team braucht Nähe und Vertrauen.";
  } else if (fuehrungsArt === "fachlich") {
    roleNeed = rk === "analytisch"
      ? "Fachliche Führung mit klarer Einschätzung, Qualitätssicherheit und verlässlicher Priorisierung. Fachliche Orientierung vor formaler Autorität."
      : rk === "impulsiv"
        ? "Fachliche Führung mit schneller Orientierung, praxisnahen Entscheidungen und klarer Richtung."
        : "Fachliche Führung über Dialog, Austausch und gemeinsame Lösungsfindung.";
  } else {
    roleNeed = rk === "analytisch"
      ? "Orientierung über Struktur, Standards und klare Vorgaben. Die eigene Arbeitsweise wirkt als Vorbild für Qualität und Verlässlichkeit."
      : rk === "impulsiv"
        ? "Wirkung über schnelle Entscheidungen, klare Richtung und hohe Ergebnisdynamik. Die eigene Arbeitsweise prägt das Umfeld durch Handlungsorientierung."
        : "Wirkung über Kommunikation, Zusammenarbeit und situatives Gespür. Die eigene Arbeitsweise prägt das Umfeld durch Beziehungsarbeit.";
  }

  if (ck === "impulsiv") {
    candidatePattern = `${s} führt eher über Geschwindigkeit, direkte Ansprache und Aktivierung. Entscheidungen werden schnell kommuniziert und umgesetzt.`;
  } else if (ck === "intuitiv") {
    candidatePattern = `${s} führt über Vertrauen, Dialog und aktives Zuhören. Entscheidungen werden im Gespräch entwickelt und gemeinsam getragen.`;
  } else {
    candidatePattern = `${s} führt über Systematik, klare Regeln und nachvollziehbare Vorgaben. Entscheidungen werden analytisch begründet und dokumentiert.`;
  }

  if (rk !== ck) {
    const leadRest2 = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== ck);
    const leadComp23 = ct ? Math.abs(ct[leadRest2[0]] - ct[leadRest2[1]]) <= 5 && Math.min(ct[leadRest2[0]], ct[leadRest2[1]]) > 15 : false;
    const leadershipSuffix = fuehrungsArt === "disziplinarisch"
      ? " Da die Person Führungsverantwortung trägt, wirkt sich das direkt auf Teamstabilität und Zusammenarbeit aus."
      : fuehrungsArt === "fachlich"
        ? " Bei fachlicher Führung wirkt sich das auf Teamklarheit und fachliche Sicherheit der Mitarbeiter aus."
        : "";

    if (rk === "analytisch" && ck === "impulsiv") {
      risk = leadComp23
        ? `Dem Team fehlen klare Leitlinien und verlässliche Prioritäten. Da die Nebenbereiche konkurrieren, schwankt der Führungsstil unter Druck zwischen sachlicher Kontrolle und persönlicher Einbindung – ohne eine Linie stabil durchzuhalten.${leadershipSuffix}`
        : `Dem Team fehlen klare Leitlinien und verlässliche Prioritäten. Entscheidungen wirken impulsiv statt durchdacht. Struktursuchende Mitarbeiter verlieren den Halt.${leadershipSuffix}`;
    } else if (rk === "analytisch" && ck === "intuitiv") {
      risk = leadComp23
        ? `Führungsentscheidungen folgen stärker der Beziehungsdynamik als fachlichen Standards. Da die Nebenbereiche konkurrieren, wechselt die Führung unter Druck zwischen Tempo und Analyse – beides ohne ausreichende Tiefe.${leadershipSuffix}`
        : `Führungsentscheidungen folgen stärker der Beziehungsdynamik als fachlichen Standards. Es entsteht der Eindruck, dass persönliche Nähe wichtiger ist als Leistung.${leadershipSuffix}`;
    } else if (rk === "impulsiv" && ck === "analytisch") {
      risk = leadComp23
        ? `Das Team wartet auf klare Ansagen, die nicht schnell genug kommen. Da die Nebenbereiche konkurrieren, pendelt die Führung zwischen Abstimmung und noch mehr Prüfung – das Tempo bleibt dauerhaft unter dem Bedarf.${leadershipSuffix}`
        : `Das Team wartet auf klare Ansagen, die nicht schnell genug kommen. In Drucksituationen fehlt die entschlossene Führung, die erwartet wird.${leadershipSuffix}`;
    } else if (rk === "impulsiv" && ck === "intuitiv") {
      if (leadComp23) {
        risk = `Statt schneller Entscheidungen wird abgestimmt. Da die Nebenbereiche konkurrieren, wechselt die Führung unter Druck zwischen Faktenprüfung und weiterer Diskussion – in keinem Fall entsteht das erwartete Tempo.${leadershipSuffix}`;
      } else if (maxGap >= 15) {
        risk = `Statt schneller Entscheidungen wird abgestimmt. Das Team erwartet Tempo, bekommt Gesprächsrunden. Zeitkritische Situationen erzeugen Frustration. Die Führungskraft muss das direkt korrigieren.${leadershipSuffix}`;
      } else {
        risk = `Statt schneller Entscheidungen wird abgestimmt. Das Team erwartet Tempo, bekommt Gesprächsrunden. Die Führungskraft sollte klare Entscheidungserwartungen setzen, um das Tempo zu sichern.${leadershipSuffix}`;
      }
    } else if (rk === "intuitiv" && ck === "impulsiv") {
      risk = leadComp23
        ? `Mitarbeiter fühlen sich übergangen, weil Entscheidungen ohne ausreichende Einbindung fallen. Da die Nebenbereiche konkurrieren, schwankt das Verhalten unter Druck zwischen sachlicher Kontrolle und weiterem Tempo – persönliche Nähe kommt in keinem Fall ausreichend vor.${leadershipSuffix}`
        : `Mitarbeiter fühlen sich übergangen, weil Entscheidungen ohne ausreichende Einbindung fallen. Beziehungsarbeit kommt zu kurz, der Teamzusammenhalt leidet.${leadershipSuffix}`;
    } else {
      risk = leadComp23
        ? `Führung wirkt formal und distanziert. Da die Nebenbereiche konkurrieren, wechselt das Verhalten unter Druck zwischen Tempodruck und noch mehr Faktenprüfung – der persönliche Dialog bleibt in beiden Fällen auf der Strecke.${leadershipSuffix}`
        : `Führung wirkt formal und distanziert. Erwartet werden persönliche Nähe und offene Kommunikation, geliefert werden Regeln und Prozesse.${leadershipSuffix}`;
    }
  } else {
    const leadRest = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== ck);
    const leadCompeting23 = ct ? Math.abs(ct[leadRest[0]] - ct[leadRest[1]]) <= 5 && Math.min(ct[leadRest[0]], ct[leadRest[1]]) > 15 : false;
    const isPerfectLead = fitSubtype === "PERFECT";
    if (leadCompeting23) {
      risk = "Die Führungsrichtung ist in der Grundausrichtung stimmig. Da die beiden Nebenbereiche fast gleich stark sind, kann der Führungsstil unter Druck wechselnd wirken – situativ direkter oder empathischer. Das Team erlebt die Führung als weniger berechenbar. Regelmässiges Feedback ist besonders wichtig.";
    } else {
      risk = isPerfectLead
        ? "Führungsstil ist deckungsgleich mit der Stellenanforderung."
        : "Die Führungsrichtung ist in der Grundausrichtung stimmig. Die Gewichtung der Nebenbereiche ist jedoch nicht deckungsgleich – dadurch unterscheidet sich, wie Orientierung gegeben wird. Regelmässiges Feedback zur Führungswirkung ist ratsam.";
    }
  }

  return { id: "leadership", label: "Führungswirkung", severity: sev, roleNeed, candidatePattern, risk };
}

function buildCommunicationImpact(rk: ComponentKey, ck: ComponentKey, gapI: number, gapN: number, gapA: number, cand: string, roleIsBalFull = false, ct?: Triad, candIsBalFull = false, candIsDualDom = false, ck2?: ComponentKey, fitSubtype: FitSubtype = "MISMATCH"): ImpactArea {
  const s = Subj(cand);
  const maxGap = Math.max(gapI, gapN, gapA);

  if (candIsDualDom && ck2 && !roleIsBalFull) {
    const pair = dualPairKey(ck, ck2);
    const dualMatchesRole = rk === ck || rk === ck2;
    const sev = severity(dualMatchesRole ? maxGap * 0.45 : maxGap * 0.7);
    const roleNeed = rk === "impulsiv"
      ? "Klare, direkte Kommunikation. Kurze Wege, schnelle Abstimmung, ergebnisorientierter Austausch."
      : rk === "intuitiv"
        ? "Empathische, dialogorientierte Kommunikation. Aktives Zuhören, Einbindung und persönliche Ansprache."
        : "Sachliche, faktenbasierte Kommunikation. Klare Argumentation, strukturierte Informationsweitergabe.";
    const candidatePattern = `${s} ${dualCandCommunication[pair]}`;
    const third = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).find(k => k !== ck && k !== ck2)!;
    const thirdComm = third === "impulsiv" ? "Direktheit und Knappheit" : third === "intuitiv" ? "Empathie und persönlicher Dialog" : "sachliche Präzision und Faktenorientierung";
    const risk = dualMatchesRole
      ? (maxGap >= 10
        ? `Der Kommunikationsstil passt über eine der beiden Ausprägungen. Der Wechsel zwischen zwei Stilen kann bei Gesprächspartnern unterschiedlich ankommen. ${thirdComm} bleibt untervertreten. Klare Kommunikationserwartungen setzen.`
        : `Der Kommunikationsstil passt grundsätzlich. Der situative Wechsel erfordert bewusste Steuerung, deckt aber die Stellenanforderung ab.`)
      : `Die Stelle erfordert einen Kommunikationsstil, der weder der ersten noch der zweiten Ausprägung entspricht. ${thirdComm} bleibt untervertreten. Klare Kommunikationserwartungen setzen.`;
    return { id: "communication", label: "Kommunikationsverhalten", severity: sev, roleNeed, candidatePattern, risk };
  }

  if (candIsBalFull && !roleIsBalFull) {
    const totalGap = gapI + gapN + gapA;
    const sev = severity(totalGap * 0.35);
    const roleNeed = rk === "impulsiv"
      ? "Klare, direkte Kommunikation. Kurze Wege, schnelle Abstimmung, ergebnisorientierter Austausch."
      : rk === "intuitiv"
        ? "Empathische, dialogorientierte Kommunikation. Aktives Zuhören, Einbindung und persönliche Ansprache."
        : "Sachliche, faktenbasierte Kommunikation. Klare Argumentation, strukturierte Informationsweitergabe.";
    const candidatePattern = `${s} kommuniziert situativ und flexibel. Je nach Kontext wird direkt, empathisch oder sachlich kommuniziert. Kein einzelner Kommunikationsstil dominiert.`;
    const rkComm = rk === "impulsiv" ? "direkte, knappe Kommunikation" : rk === "intuitiv" ? "empathische, dialogorientierte Kommunikation" : "sachliche, faktenbasierte Kommunikation";
    const risk = totalGap >= 15
      ? `Die Stelle erfordert ${rkComm}. ${s} verteilt den Kommunikationsstil gleichmässig und verfolgt den geforderten Schwerpunkt nicht konsequent genug. Klare Kommunikationserwartungen setzen.`
      : `${s} bringt einen vielseitigen Kommunikationsstil mit. Die Stellenanforderung wird grundsätzlich abgedeckt, auch wenn kein klarer Schwerpunkt erkennbar ist.`;
    return { id: "communication", label: "Kommunikationsverhalten", severity: sev, roleNeed, candidatePattern, risk };
  }

  if (roleIsBalFull && ct) {
    const maxSingleGap = Math.max(gapI, gapN, gapA);
    const sev = severity(maxSingleGap * 0.65);
    const roleNeed = "Situative Kommunikation, die je nach Kontext direkt, empathisch oder sachlich-präzise erfolgt. Die Stelle verlangt kommunikative Vielseitigkeit.";

    let candidatePattern: string;
    let risk: string;
    const spread = Math.max(ct.impulsiv, ct.intuitiv, ct.analytisch) - Math.min(ct.impulsiv, ct.intuitiv, ct.analytisch);
    if (spread <= 10) {
      candidatePattern = `${s} kommuniziert situativ und flexibel. Je nach Kontext wird direkt, empathisch oder sachlich kommuniziert.`;
      risk = "Kommunikationsverhalten passt zur Vielseitigkeit der Stelle. Feinabstimmung im Umgang mit verschiedenen Stakeholdern empfohlen.";
    } else {
      const domKey: ComponentKey = ct.impulsiv >= ct.intuitiv && ct.impulsiv >= ct.analytisch ? "impulsiv" : ct.intuitiv >= ct.analytisch ? "intuitiv" : "analytisch";
      const domComm = domKey === "impulsiv" ? "direkt, kurz und ergebnisorientiert" : domKey === "intuitiv" ? "dialogorientiert und empathisch" : "sachlich, präzise und faktenbasiert";
      const weakKeys = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== domKey);
      const weakComms = weakKeys.map(k => k === "impulsiv" ? "Direktheit" : k === "intuitiv" ? "Empathie" : "sachliche Präzision").join(" und ");
      candidatePattern = `${s} kommuniziert bevorzugt ${domComm}. Die Stelle erwartet jedoch kommunikative Vielseitigkeit.`;
      risk = `Die einseitige Kommunikation kann zu Missverständnissen führen, wenn ${weakComms} gefragt ist. Gesprächspartner mit anderem Kommunikationsstil fühlen sich möglicherweise nicht abgeholt.`;
    }
    return { id: "communication", label: "Kommunikationsverhalten", severity: sev, roleNeed, candidatePattern, risk };
  }

  const sev = severity(rk !== ck ? maxGap * 0.7 : maxGap * 0.35);

  let roleNeed: string;
  if (rk === "impulsiv") {
    roleNeed = "Klare, direkte Kommunikation. Kurze Wege, schnelle Abstimmung, ergebnisorientierter Austausch.";
  } else if (rk === "intuitiv") {
    roleNeed = "Empathische, dialogorientierte Kommunikation. Aktives Zuhören, Einbindung und persönliche Ansprache.";
  } else {
    roleNeed = "Sachliche, faktenbasierte Kommunikation. Klare Argumentation, strukturierte Informationsweitergabe.";
  }

  let candidatePattern: string;
  if (ck === "impulsiv") {
    candidatePattern = `${s} kommuniziert direkt, kurz und handlungsorientiert. Entscheidungen werden rasch mitgeteilt, Details eher knapp gehalten.`;
  } else if (ck === "intuitiv") {
    candidatePattern = `${s} kommuniziert offen, dialogorientiert und einbindend. Der persönliche Austausch steht im Vordergrund.`;
  } else {
    candidatePattern = `${s} kommuniziert sachlich, strukturiert und faktenbasiert. Informationen werden präzise und nachvollziehbar weitergegeben.`;
  }

  const commRest = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== ck);
  const commCompeting23 = ct ? Math.abs(ct[commRest[0]] - ct[commRest[1]]) <= 5 && Math.min(ct[commRest[0]], ct[commRest[1]]) > 15 : false;

  let risk: string;
  if (rk === ck) {
    const isPerfectComm = fitSubtype === "PERFECT";
    if (commCompeting23) {
      risk = "Der Kommunikationsstil ist in der Grundrichtung stimmig. Da die beiden Nebenbereiche fast gleich stark sind, wechselt die Kommunikation situativ – mal direkter, mal empathischer, mal sachlicher. Das kann bei Gesprächspartnern unterschiedlich ankommen.";
    } else {
      risk = isPerfectComm
        ? "Kommunikationsverhalten ist deckungsgleich mit der Stellenanforderung."
        : "Der Kommunikationsstil ist in der Grundrichtung stimmig. Die Gewichtung der Nebenbereiche ist jedoch nicht deckungsgleich – dadurch unterscheidet sich, wie intensiv und in welchem Stil kommuniziert wird.";
    }
  } else if (rk === "impulsiv" && ck === "intuitiv") {
    risk = commCompeting23
      ? `Die Stelle verlangt schnelle, direkte Kommunikation. ${s} investiert mehr Zeit in Dialog und Abstimmung. Da die Nebenbereiche konkurrieren, wechselt die Kommunikation unter Druck zwischen sachlicher Detailtiefe und schnellem Handeln – der erwartete direkte Stil entsteht in keinem Fall.`
      : `Die Stelle verlangt schnelle, direkte Kommunikation. ${s} investiert mehr Zeit in Dialog und Abstimmung. Entscheidungen werden verzögert kommuniziert. Klare Kommunikationserwartungen setzen.`;
  } else if (rk === "impulsiv" && ck === "analytisch") {
    risk = commCompeting23
      ? `Die Stelle verlangt kurze, direkte Kommunikation. ${s} kommuniziert ausführlicher und detaillierter als nötig. Da die Nebenbereiche konkurrieren, wechselt der Stil unter Druck zwischen persönlicher Einbindung und weiterer Analyse – die erwartete Knappheit fehlt dauerhaft.`
      : `Die Stelle verlangt kurze, direkte Kommunikation. ${s} kommuniziert ausführlicher und detaillierter als nötig. Die Informationsdichte kann das Tempo bremsen.`;
  } else if (rk === "intuitiv" && ck === "impulsiv") {
    risk = commCompeting23
      ? `Die Stelle verlangt empathische Kommunikation. ${s} kommuniziert eher direkt und knapp. Da die Nebenbereiche konkurrieren, schwankt die Ausweichstrategie unter Druck zwischen sachlicher Kontrolle und weiterem Tempo – persönliche Einbindung kommt in keinem Fall ausreichend vor.`
      : `Die Stelle verlangt empathische Kommunikation. ${s} kommuniziert eher direkt und knapp. Gesprächspartner können sich übergangen fühlen. Bewusstes Zuhören und Einbindung aktiv einfordern.`;
  } else if (rk === "intuitiv" && ck === "analytisch") {
    risk = commCompeting23
      ? `Die Stelle verlangt persönlichen Dialog. ${s} kommuniziert eher sachlich und distanziert. Da die Nebenbereiche konkurrieren, wechselt die Kommunikation unter Druck zwischen Tempodruck und noch mehr Detailtiefe – der persönliche Aspekt bleibt nachrangig.`
      : `Die Stelle verlangt persönlichen Dialog. ${s} kommuniziert eher sachlich und distanziert. Der zwischenmenschliche Aspekt kommt zu kurz. Gesprächsformate mit persönlichem Austausch einplanen.`;
  } else if (rk === "analytisch" && ck === "impulsiv") {
    risk = commCompeting23
      ? `Die Stelle verlangt sachliche Präzision. ${s} kommuniziert eher kurz und handlungsorientiert. Da die Nebenbereiche konkurrieren, schwankt die Ausweichstrategie zwischen Empathie und Faktenprüfung – beides ohne die nötige Tiefe und Konsistenz.`
      : `Die Stelle verlangt sachliche Präzision. ${s} kommuniziert eher kurz und handlungsorientiert. Details und Begründungen werden ausgelassen. Dokumentationserwartungen klar formulieren.`;
  } else {
    risk = commCompeting23
      ? `Die Stelle verlangt faktenbasierte Kommunikation. ${s} kommuniziert eher beziehungsorientiert. Da die Nebenbereiche konkurrieren, wechselt der Stil unter Druck zwischen Tempo und weiterer Abstimmung – sachliche Präzision entsteht in keinem Fall.`
      : `Die Stelle verlangt faktenbasierte Kommunikation. ${s} kommuniziert eher beziehungsorientiert. Sachliche Tiefe und Nachvollziehbarkeit können leiden. Klare Standards für Informationsweitergabe setzen.`;
  }

  return { id: "communication", label: "Kommunikationsverhalten", severity: sev, roleNeed, candidatePattern, risk };
}

function buildCultureImpact(rk: ComponentKey, ck: ComponentKey, gapI: number, gapN: number, gapA: number, cand: string, roleIsBalFull = false, ct?: Triad, candIsBalFull = false, candIsDualDom = false, ck2?: ComponentKey, fitSubtype: FitSubtype = "MISMATCH"): ImpactArea {
  const s = Subj(cand);

  if (candIsDualDom && ck2 && !roleIsBalFull) {
    const pair = dualPairKey(ck, ck2);
    const dualMatchesRole = rk === ck || rk === ck2;
    const sev = severity(dualMatchesRole ? Math.max(gapI, gapN, gapA) * 0.45 : Math.max(gapI, gapN, gapA) * 0.65);
    const roleNeed = rk === "impulsiv"
      ? "Leistungs- und ergebnisorientierte Kultur. Tempo und Wirkung im Vordergrund."
      : rk === "intuitiv"
        ? "Kooperative, beziehungsorientierte Kultur. Zusammenhalt und gegenseitige Unterstützung."
        : "Verlässlichkeit, Ruhe und nachvollziehbare Qualität. Stabile Abläufe und planbare Ergebnisse.";
    const candidatePattern = `${s} ${dualCandCulture[pair]}`;
    const third = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).find(k => k !== ck && k !== ck2)!;
    const thirdCult = third === "impulsiv" ? "Leistungsdynamik" : third === "intuitiv" ? "persönlicher Zusammenhalt" : "Regelklarheit und Verlässlichkeit";
    const risk = dualMatchesRole
      ? (Math.max(gapI, gapN, gapA) >= 10
        ? `Die kulturelle Grundrichtung passt über eine der beiden Stärken. Der Wechsel kann das Arbeitsumfeld unberechenbar wirken lassen. ${thirdCult} bleibt untervertreten.`
        : `Die Kulturwirkung passt grundsätzlich über eine der beiden Ausprägungen. Der situative Wechsel kann das Arbeitsumfeld leicht verändern.`)
      : `Die Kulturwirkung der Person entspricht in keiner der beiden Ausprägungen der Stellenanforderung. ${thirdCult} bleibt untervertreten. Die Führungskraft muss aktiv gegensteuern.`;
    return { id: "culture", label: "Wirkung auf Zusammenarbeit und Teamkultur", severity: sev, roleNeed, candidatePattern, risk };
  }

  if (candIsBalFull && !roleIsBalFull) {
    const totalGap = gapI + gapN + gapA;
    const sev = severity(totalGap * 0.35);
    const roleNeed = rk === "impulsiv"
      ? "Leistungsorientierte Kultur mit Tempo, Wettbewerb und sichtbaren Ergebnissen."
      : rk === "intuitiv"
        ? "Kultur geprägt von Zusammenarbeit, persönlicher Verbindung und Teamzusammenhalt."
        : "Kultur geprägt von Qualität, Verlässlichkeit und regelbasierter Zusammenarbeit.";
    const candidatePattern = `${s} bringt eine vielseitige Kulturprägung mit. Je nach Umfeld wird über Dynamik, Zusammenarbeit oder Verlässlichkeit gesteuert. Kein einzelner Kulturaspekt dominiert.`;
    const rkCult = rk === "impulsiv" ? "Leistungsdynamik und Ergebnisorientierung" : rk === "intuitiv" ? "persönliche Verbindung und Teamzusammenhalt" : "Qualität, Ordnung und Verlässlichkeit";
    const risk = totalGap >= 15
      ? `Die Stelle erfordert eine klare Kulturwirkung über ${rkCult}. ${s} verteilt die Kulturprägung gleichmässig und verfolgt den geforderten Schwerpunkt nicht konsequent genug.`
      : `${s} bringt eine vielseitige Kulturwirkung mit. Die Stellenanforderung wird grundsätzlich abgedeckt, auch wenn kein klarer kultureller Schwerpunkt erkennbar ist.`;
    return { id: "culture", label: "Wirkung auf Zusammenarbeit und Teamkultur", severity: sev, roleNeed, candidatePattern, risk };
  }

  if (roleIsBalFull) {
    const totalGap = gapI + gapN + gapA;
    const maxSingleGap = Math.max(gapI, gapN, gapA);
    const sev = severity(maxSingleGap * 0.65);
    const roleNeed = "Ausgewogene Kultur, die Leistungsorientierung, Zusammenarbeit und Verlässlichkeit verbindet. Kein einzelner Kulturaspekt dominiert.";

    let candidatePattern: string;
    let risk: string;
    if (ct && Math.max(ct.impulsiv, ct.intuitiv, ct.analytisch) - Math.min(ct.impulsiv, ct.intuitiv, ct.analytisch) <= 10) {
      candidatePattern = `${s} bringt eine ähnlich breite kulturelle Prägung mit. Die Vielseitigkeit passt zur Stellenerwartung.`;
      risk = totalGap >= 15
        ? "Die kulturelle Grundrichtung stimmt, aber einzelne Aspekte werden unterschiedlich gewichtet. Feinabstimmung ist sinnvoll."
        : "Kulturwirkung passt zur Stellenanforderung. Die gelebte Kultur entspricht den Erwartungen.";
    } else {
      const ckCulture = ck === "impulsiv" ? "Dynamik und Ergebnisorientierung" : ck === "intuitiv" ? "persönliche Verbindung und Teamzusammenhalt" : "Ordnung, Qualität und Regelklarheit";
      const weakAreas = [];
      if (ct && ct.impulsiv < 20) weakAreas.push("Leistungsdynamik");
      if (ct && ct.intuitiv < 20) weakAreas.push("Teamverbundenheit");
      if (ct && ct.analytisch < 20) weakAreas.push("Verlässlichkeit und Struktur");
      const weakStr = weakAreas.length > 0 ? ` ${weakAreas.join(" und ")} wird dabei kaum gelebt.` : "";
      candidatePattern = `${s} beeinflusst die Kultur vorrangig über ${ckCulture}. Die Stelle erwartet jedoch eine ausgewogene Kulturwirkung.`;
      risk = `Die einseitige Kulturprägung verschiebt das Arbeitsumfeld in eine Richtung, die nur einen Teil der Stellenanforderung abdeckt.${weakStr}`;
    }
    return { id: "culture", label: "Wirkung auf Zusammenarbeit und Teamkultur", severity: sev, roleNeed, candidatePattern, risk };
  }

  const sev = severity(rk !== ck ? Math.max(gapI, gapN, gapA) * 0.65 : Math.max(gapI, gapN, gapA) * 0.4);

  let roleNeed: string;
  let candidatePattern: string;
  let risk: string;

  if (rk === "analytisch") {
    roleNeed = "Verlässlichkeit, Ruhe und nachvollziehbare Qualität. Stabile Abläufe und planbare Ergebnisse.";
  } else if (rk === "impulsiv") {
    roleNeed = "Leistungs- und ergebnisorientierte Kultur. Tempo und Wirkung im Vordergrund.";
  } else {
    roleNeed = "Kooperative, beziehungsorientierte Kultur. Zusammenhalt und gegenseitige Unterstützung.";
  }

  if (ck === "impulsiv") {
    candidatePattern = `${s} prägt die Kultur über Dynamik und unmittelbare Bewegung. Kurzfristig entsteht mehr Tempo.`;
  } else if (ck === "intuitiv") {
    candidatePattern = `${s} fördert Teamzusammenhalt, offenen Dialog und eine einladende Atmosphäre. Beziehungen stehen im Mittelpunkt.`;
  } else {
    candidatePattern = `${s} stärkt Qualitätsbewusstsein, Regelklarheit und Ordnung. Die Kultur wird sachlicher und strukturierter.`;
  }

  if (rk !== ck) {
    const culRest2 = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== ck);
    const culComp23 = ct ? Math.abs(ct[culRest2[0]] - ct[culRest2[1]]) <= 5 && Math.min(ct[culRest2[0]], ct[culRest2[1]]) > 15 : false;
    if (rk === "analytisch" && ck === "impulsiv") {
      risk = culComp23
        ? "Stabilität in Abläufen geht verloren, wenn Entscheidungen schneller fallen als sie strukturell abgesichert sind. Da die Nebenbereiche konkurrieren, schwankt die Kulturwirkung unter Druck zwischen Empathie und Faktenprüfung – beides ohne die nötige Konsistenz für stabile Abläufe."
        : "Stabilität in Abläufen geht verloren, wenn Entscheidungen schneller fallen als sie strukturell abgesichert sind. Kurzfristig entsteht Zug, langfristig leidet Verlässlichkeit.";
    } else if (rk === "analytisch" && ck === "intuitiv") {
      risk = culComp23
        ? "Die Kultur verschiebt sich von sachlicher Qualität hin zu persönlicher Verbindung. Da die Nebenbereiche konkurrieren, wechselt der Einfluss unter Druck zwischen Tempo und Strukturkontrolle – Standards weichen in beiden Fällen auf."
        : "Die Kultur verschiebt sich von sachlicher Qualität hin zu persönlicher Verbindung. Standards und Regeln weichen auf, wenn Beziehungen wichtiger werden als Prozesse.";
    } else if (rk === "impulsiv" && ck === "analytisch") {
      risk = culComp23
        ? "Die operative Geschwindigkeit sinkt. Da die Nebenbereiche konkurrieren, pendelt die Kultur unter Druck zwischen persönlicher Abstimmung und weiterem Prüfen – das erwartete Tempo entsteht in keinem Fall."
        : "Die operative Geschwindigkeit sinkt. Statt direkter Umsetzung entsteht eine Kultur der Prüfung und Absicherung. In einem dynamischen Umfeld ein Wettbewerbsnachteil.";
    } else if (rk === "impulsiv" && ck === "intuitiv") {
      const cMaxGap = Math.max(gapI, gapN, gapA);
      if (culComp23) {
        risk = "Ergebnisorientierung weicht einer Konsenskultur. Da die Nebenbereiche konkurrieren, schwankt der Einfluss unter Druck zwischen Faktenprüfung und schnellem Handeln – die Dynamik der Stelle geht in beiden Richtungen verloren.";
      } else if (cMaxGap >= 15) {
        risk = "Ergebnisorientierung weicht einer Konsenskultur. Entscheidungen werden diskutiert statt umgesetzt. Die Dynamik der Stelle geht verloren.";
      } else {
        risk = "Ergebnisorientierung weicht teilweise einer Konsenskultur. Entscheidungen werden diskutiert statt umgesetzt. Die Dynamik der Stelle kann darunter leiden. Klare Ergebnisvorgaben helfen, den Fokus zu halten.";
      }
    } else if (rk === "intuitiv" && ck === "impulsiv") {
      risk = culComp23
        ? "Kooperative Kultur wird durch Ergebnisorientierung verdrängt. Da die Nebenbereiche konkurrieren, schwankt die Kulturwirkung unter Druck zwischen sachlicher Kontrolle und weiterem Tempo – persönliche Verbindung entsteht in keinem Fall."
        : "Kooperative Kultur wird durch Ergebnisorientierung verdrängt. Weniger persönliche Ansprache, mehr Leistungsdruck. Bindung und Motivation sinken.";
    } else {
      risk = culComp23
        ? "Kultur wird formaler und distanzierter. Da die Nebenbereiche konkurrieren, wechselt der Einfluss unter Druck zwischen Tempodruck und weiterer Analyse – der persönliche Austausch bleibt dauerhaft nachrangig."
        : "Kultur wird formaler und distanzierter. Persönliche Verbindung und offener Austausch nehmen ab, das Teamgefühl leidet.";
    }
  } else {
    const cMaxGap = Math.max(gapI, gapN, gapA);
    const culRest = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== ck);
    const culCompeting23 = ct ? Math.abs(ct[culRest[0]] - ct[culRest[1]]) <= 5 && Math.min(ct[culRest[0]], ct[culRest[1]]) > 15 : false;
    const isPerfectCul = fitSubtype === "PERFECT";
    if (culCompeting23) {
      risk = "Die kulturelle Grundrichtung ist stimmig. Da die beiden Nebenbereiche fast gleich stark sind, kann die gelebte Kultur situativ schwanken – mal dynamischer, mal empathischer, mal strukturierter. Das erzeugt ein wechselhaftes Arbeitsumfeld.";
    } else {
      risk = isPerfectCul
        ? "Kulturwirkung ist deckungsgleich mit der Stellenanforderung."
        : "Die kulturelle Grundrichtung ist stimmig. Die Gewichtung der Nebenbereiche ist jedoch nicht deckungsgleich – dadurch kann sich die gelebte Kultur in einzelnen Aspekten von der Stellenerwartung unterscheiden.";
    }
  }

  return { id: "culture", label: "Wirkung auf Zusammenarbeit und Teamkultur", severity: sev, roleNeed, candidatePattern, risk };
}

function buildRiskTimeline(role: string, cand: string, rk: ComponentKey, ck: ComponentKey, gap: string, roleIsBalFull = false, rt?: Triad, ct?: Triad): RiskPhase[] {
  if (roleIsBalFull && ct) {
    const s = Subj(cand);
    const spread = Math.max(ct.impulsiv, ct.intuitiv, ct.analytisch) - Math.min(ct.impulsiv, ct.intuitiv, ct.analytisch);
    const candBalanced = spread <= 10;
    const totalGap = (rt ? Math.abs(rt.impulsiv - ct.impulsiv) + Math.abs(rt.intuitiv - ct.intuitiv) + Math.abs(rt.analytisch - ct.analytisch) : 0);

    if (candBalanced) {
      return [
        { label: "Kurzfristig", period: "0 - 3 Monate", text: `Die Stelle ${role} verlangt Vielseitigkeit in der Arbeitsweise. ${s} bringt ein ausgeglichenes Profil mit. Die Einarbeitung verläuft voraussichtlich reibungslos.` },
        { label: "Mittelfristig", period: "3 - 12 Monate", text: `Die vielseitige Arbeitsweise passt zur Stellenanforderung. Kleinere Gewichtungsunterschiede bleiben im Alltag gut handhabbar. Regelmässige Zielgespräche sichern die Passung.` },
        { label: "Langfristig", period: "12+ Monate", text: `Die Stellenanforderungen werden langfristig stabil abgedeckt. Der Führungsaufwand bleibt gering. Halbjährliche Überprüfungen genügen.` },
      ];
    }

    const domKey: ComponentKey = ct.impulsiv >= ct.intuitiv && ct.impulsiv >= ct.analytisch ? "impulsiv" : ct.intuitiv >= ct.analytisch ? "intuitiv" : "analytisch";
    const domDesc = domKey === "impulsiv" ? "Tempo und direkte Ergebnisorientierung" : domKey === "intuitiv" ? "Beziehungsarbeit und Dialog" : "Struktur und analytische Prüfung";
    const weakKeys = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== domKey);
    const weakDescs = weakKeys.map(k => compShort(k)).join(" und ");

    return [
      { label: "Kurzfristig", period: "0 - 3 Monate", text: `Die Stelle ${role} verlangt eine vielseitige Arbeitsweise über alle drei Bereiche. ${s} arbeitet bevorzugt über ${domDesc}. Bereits in der Einarbeitung sollte auf die einseitige Schwerpunktsetzung geachtet werden.` },
      { label: "Mittelfristig", period: "3 - 12 Monate", text: `Die einseitige Ausrichtung wird im Alltag zunehmend bemerkbar. ${weakDescs} werden nicht ausreichend abgedeckt. Ohne gezielte Steuerung verschiebt sich die Stellenausübung in eine einzelne Richtung. Regelmässige Zielgespräche und klare Erwartungen sind notwendig.` },
      { label: "Langfristig", period: "12+ Monate", text: totalGap > 40
        ? `Die Vielseitigkeitsanforderung der Stelle wird dauerhaft verfehlt. Die einseitige Prägung erschwert die Wirkung in allen geforderten Bereichen. Es muss entschieden werden, ob der Führungsaufwand langfristig tragbar ist.`
        : `Mit gezielter Führung lässt sich die einseitige Ausrichtung teilweise kompensieren. Halbjährliche Überprüfung empfohlen, um sicherzustellen, dass die Vielseitigkeit gewährleistet bleibt.` },
    ];
  }

  if (rk === ck && gap === "gering") {
    return [
      { label: "Kurzfristig", period: "0 - 3 Monate", text: `Die Stelle ${role} verlangt ${compDesc(rk)}. Die Arbeitslogik passt. Die Einarbeitung verläuft voraussichtlich reibungslos. Nur in Einzelfällen ist Nachjustierung nötig.` },
      { label: "Mittelfristig", period: "3 - 12 Monate", text: `Die Stellenanforderungen werden stabil abgedeckt. In den Nebenbereichen treten kleinere Abweichungen auf. Regelmässige Zielgespräche helfen, diese frühzeitig zu erkennen.` },
      { label: "Langfristig", period: "12+ Monate", text: `Die Stellenanforderungen werden langfristig stabil erfüllt. Der Führungsaufwand bleibt gering. Halbjährliche Überprüfungen genügen.` },
    ];
  }

  if (rk === ck && gap !== "gering") {
    return [
      { label: "Kurzfristig", period: "0 - 3 Monate", text: `Die Stelle ${role} verlangt ${compDesc(rk)}. ${Subj(cand)} arbeitet in dieselbe Richtung, gewichtet aber die Nebenbereiche anders. Bereits in der Einarbeitung sollte gezielt auf diese Unterschiede geachtet werden.` },
      { label: "Mittelfristig", period: "3 - 12 Monate", text: `Die Grundrichtung stimmt, aber die Abweichungen in den Nebenbereichen werden im Alltag bemerkbar. Ohne gezielte Steuerung können sich diese Unterschiede verfestigen. Regelmässige Zielgespräche und klare Erwartungen sind notwendig.` },
      { label: "Langfristig", period: "12+ Monate", text: gap === "hoch"
          ? `Trotz gleicher Arbeitsweise bleibt der Führungsaufwand erhöht. Die Nebenbereich-Abweichungen erfordern dauerhafte Aufmerksamkeit. Es sollte geprüft werden, ob der Steuerungsaufwand langfristig tragbar ist.`
          : `Mit gezielter Führung lassen sich die Unterschiede in den Nebenbereichen dauerhaft ausgleichen. Halbjährliche Überprüfung empfohlen, um sicherzustellen, dass die Passung stabil bleibt.` },
    ];
  }

  if (gap === "gering" && rk !== ck) {
    return [
      { label: "Kurzfristig", period: "0 - 3 Monate", text: `Die Stelle ${role} verlangt ${compDesc(rk)}. ${Subj(cand)} bringt eine andere Grundausrichtung mit. Auch wenn die numerischen Abweichungen gering sind, zeigt sich der unterschiedliche Schwerpunkt in der Art, wie Aufgaben angegangen werden. Frühzeitiges Alignment empfohlen.` },
      { label: "Mittelfristig", period: "3 - 12 Monate", text: `Die unterschiedliche Grundausrichtung wird im Alltag spürbar. Gezielte Führung und regelmässiges Feedback sind nötig, um sicherzustellen, dass Prioritäten im Sinne der Stelle gesetzt werden.` },
      { label: "Langfristig", period: "12+ Monate", text: `Die Grundausrichtung bleibt unterschiedlich. Der Führungsaufwand ist zwar handhabbar, aber dauerhafte Aufmerksamkeit ist nötig. Halbjährliche Überprüfungen empfohlen.` },
    ];
  }

  const shortRisks: Record<ComponentKey, Record<ComponentKey, string>> = {
    impulsiv: {
      intuitiv: `Die Stelle verlangt schnelle Umsetzung und operative Geschwindigkeit. ${Subj(cand)} investiert stattdessen mehr Zeit in Abstimmung. Erste Verzögerungen werden sichtbar. Ergebnisorientierung muss aktiv eingefordert werden.`,
      analytisch: `Die Stelle verlangt zügige Entscheidungen und direktes Handeln. ${Subj(cand)} prüft gründlicher als nötig und verliert dabei an Geschwindigkeit. Klare Fristen sollten gesetzt werden.`,
      impulsiv: "",
    },
    intuitiv: {
      impulsiv: `Die Stelle verlangt Beziehungsarbeit und sorgfältige Abstimmung. ${Subj(cand)} treibt schneller voran als vorgesehen. Beziehungspflege und Teamdynamik leiden. Frühzeitig auf Teamfeedback achten.`,
      analytisch: `Die Stelle verlangt zwischenmenschliche Wirkung und Kommunikation. Stattdessen werden formale Prozesse stärker betont. Der Fokus auf Dialog und Beziehungsgestaltung muss aktiv gelenkt werden.`,
      intuitiv: "",
    },
    analytisch: {
      impulsiv: `Die Stelle verlangt Prüftiefe, Sorgfalt und strukturierte Abläufe. ${Subj(cand)} arbeitet tempogetrieben. Fehler und Nacharbeiten treten auf, weil Abläufe nicht ausreichend geprüft werden. Qualitätsstandards müssen aktiv eingefordert werden.`,
      intuitiv: `Die Stelle verlangt strukturelle Präzision und analytische Schärfe. Entscheidungen werden stattdessen stärker beziehungsorientiert getroffen. Klare Dokumentationserwartungen sollten formuliert werden.`,
      analytisch: "",
    },
  };

  const midRisks: Record<ComponentKey, Record<ComponentKey, string>> = {
    impulsiv: {
      intuitiv: `Die Stelle braucht operative Geschwindigkeit und Ergebnisorientierung. Stattdessen folgen Prioritäten und Entscheidungen zunehmend einer Beziehungslogik. Klare Ergebnisziele müssen regelmässig eingefordert werden.`,
      analytisch: `Die Stelle braucht Tempo und direkte Umsetzung. Stattdessen wird zunehmend über Prüfung und Kontrolle gesteuert. Die Dynamik der Stelle geht verloren. Ohne Korrektur wird die Stelle langsamer als vorgesehen.`,
      impulsiv: "",
    },
    intuitiv: {
      impulsiv: `Die Stelle braucht kooperative Kultur und persönliche Ansprache. Stattdessen wird die Kultur durch Ergebnisorientierung verdrängt. Mitarbeiterbindung kann sinken. Gezielt Teamformate einsetzen.`,
      analytisch: `Die Stelle braucht zwischenmenschlichen Charakter und persönlichen Kontakt. Stattdessen ersetzen Prozesse zunehmend den Dialog. Das Team kann den Eindruck bekommen, dass Nähe nicht mehr gewünscht ist.`,
      intuitiv: "",
    },
    analytisch: {
      impulsiv: `Die Stelle braucht Struktur und Prozessqualität. Stattdessen folgen Prioritäten und Entscheidungen zunehmend einer tempogetriebenen Arbeitslogik. Die Qualitätsstandards der Stelle erodieren schrittweise.`,
      intuitiv: `Die Stelle braucht analytische Schärfe und faktenbasierte Entscheidungen. Stattdessen werden Entscheidungen durch Konsensdynamik aufgeweicht. Prüftiefe nimmt ab.`,
      analytisch: "",
    },
  };

  return [
    {
      label: "Kurzfristig",
      period: "0 - 3 Monate",
      text: shortRisks[rk]?.[ck] || `Die Stelle ${role} stellt klare Anforderungen. Erste Abweichungen zeigen sich in der Einarbeitung. Aufmerksam beobachten und frühzeitig gegensteuern.`,
    },
    {
      label: "Mittelfristig",
      period: "3 - 12 Monate",
      text: midRisks[rk]?.[ck] || `Die Stellenanforderungen werden zunehmend von der persönlichen Arbeitslogik überlagert. Ohne gezielte Führung verschiebt sich die Wirkung der Stelle dauerhaft.`,
    },
    {
      label: "Langfristig",
      period: "12+ Monate",
      text: gap === "hoch"
        ? `Die Stellenanforderungen können dauerhaft verfehlt werden. Qualitäts- und Führungsrisiken steigen erheblich. Eine Korrektur wird mit der Zeit schwieriger. Es muss entschieden werden, ob der Führungsaufwand langfristig tragbar ist.`
        : `Ohne gezielte Führung kann sich die Stellenausübung allmählich verschieben. Halbjährliche Überprüfung der Stellenanforderungen ist ratsam.`,
    },
  ];
}

function buildDevelopment(gap: string, rk: ComponentKey, ck: ComponentKey, control: string, cand: string, isDualDomRole = false, rk2?: ComponentKey, roleIsBalFull = false, ct?: Triad, candIsDualDom = false, candCk2?: ComponentKey): { level: number; label: string; text: string } {
  const s = Subj(cand);

  if (roleIsBalFull && ct) {
    const spread = Math.max(ct.impulsiv, ct.intuitiv, ct.analytisch) - Math.min(ct.impulsiv, ct.intuitiv, ct.analytisch);
    const candBalanced = spread <= 10;
    if (candBalanced) {
      if (gap === "mittel") {
        return {
          level: 3,
          label: "mittel",
          text: `Die Stelle verlangt Vielseitigkeit über alle drei Bereiche. ${s} bringt ein ausgeglichenes Profil mit, doch in einzelnen Bereichen zeigt sich eine leichte Abweichung. Mit gezielter Führung und klaren Erwartungen ist eine gute Entwicklung realistisch.`,
        };
      }
      if (gap === "hoch") {
        return {
          level: 1,
          label: "niedrig",
          text: `Die Stelle verlangt Vielseitigkeit über alle drei Bereiche. ${s} bringt zwar ein ausgeglichenes Profil mit, doch die Arbeitslogik weicht in wesentlichen Bereichen ab. Die nötige Anpassung wäre aufwendig.`,
        };
      }
      return {
        level: 4,
        label: "hoch",
        text: `Die Stelle verlangt Vielseitigkeit über alle drei Bereiche. ${s} bringt ein ausgeglichenes Profil mit. In einzelnen Bereichen ist Feinabstimmung nötig, aber die Grundlage stimmt. Mit klaren Erwartungen ist eine stabile Entwicklung realistisch.`,
      };
    }
    const domKey: ComponentKey = ct.impulsiv >= ct.intuitiv && ct.impulsiv >= ct.analytisch ? "impulsiv" : ct.intuitiv >= ct.analytisch ? "intuitiv" : "analytisch";
    const domDesc = domKey === "impulsiv" ? "Tempo und Ergebnisorientierung" : domKey === "intuitiv" ? "Beziehungsarbeit und Dialog" : "Struktur und Analyse";
    if (gap === "gering" || gap === "mittel") {
      return {
        level: 3,
        label: "mittel",
        text: `Die Stelle verlangt eine vielseitige Arbeitsweise. ${s} arbeitet bevorzugt über ${domDesc}. Die Anpassung hin zu mehr Vielseitigkeit ist möglich, braucht aber klare Führung und gezielte Entwicklungsziele.`,
      };
    }
    return {
      level: 1,
      label: "niedrig",
      text: `Die Stelle verlangt Vielseitigkeit über alle drei Bereiche. ${s} ist stark auf ${domDesc} spezialisiert. Die nötige Anpassung wäre aufwendig und im Ergebnis unsicher. Es sollte ehrlich geprüft werden, ob der Entwicklungsaufwand realistisch ist.`,
    };
  }

  const candIsBalanced = ct ? Math.max(ct.impulsiv, ct.intuitiv, ct.analytisch) - Math.min(ct.impulsiv, ct.intuitiv, ct.analytisch) <= 5 : false;
  const roleDesc = isDualDomRole && rk2 ? dualRoleDesc(rk, rk2) : compDesc(rk);
  const candDualMatchesRole = candIsDualDom && candCk2 && (rk === ck || rk === candCk2);

  if (candIsDualDom && candCk2 && !roleIsBalFull) {
    const candDesc = `${compDesc(ck)} und ${compDesc(candCk2)}`;
    if (gap === "gering") {
      return {
        level: 4,
        label: "hoch",
        text: candDualMatchesRole
          ? `Die Stelle verlangt ${roleDesc}. ${s} deckt diese Anforderung über eine von zwei Stärken ab (${candDesc}). Der situative Wechsel erfordert bewusste Steuerung, aber die Grundlage stimmt.`
          : `Die Stelle verlangt ${roleDesc}. ${s} arbeitet über ${candDesc}. Die Abweichung ist gering. Mit klaren Erwartungen und guter Einarbeitung ist eine stabile Entwicklung realistisch.`,
      };
    }
    if (gap === "mittel") {
      return {
        level: candDualMatchesRole ? 3 : 2,
        label: candDualMatchesRole ? "mittel" : "niedrig",
        text: candDualMatchesRole
          ? `Die Stelle verlangt ${roleDesc}. ${s} bringt dies als eine von zwei Stärken mit (${candDesc}). Der Wechsel zwischen beiden Ausprägungen kann die Konsequenz im geforderten Bereich schwächen. Klare Führung und konkrete Ziele empfohlen.`
          : `Die Stelle verlangt ${roleDesc}. ${s} arbeitet über ${candDesc} – keiner dieser Schwerpunkte deckt die Anforderung direkt ab. Die Anpassung ist möglich, braucht aber klare Führung und konkrete Ziele über mehrere Monate.`,
      };
    }
    return {
      level: 1,
      label: "niedrig",
      text: candDualMatchesRole
        ? `Die Stelle verlangt ${roleDesc} – deutlich stärker, als ${subj(cand)} es mitbringt. Eine der beiden Stärken (${candDesc}) geht in die richtige Richtung, reicht aber nicht aus. Intensive Begleitung wäre nötig.`
        : `Die Stelle verlangt ${roleDesc}. ${s} setzt auf ${candDesc}. Das sind andere Arbeitsweisen. Die Anpassung wäre aufwendig und im Ergebnis unsicher.`,
    };
  }

  if (gap === "gering") {
    return {
      level: 4,
      label: "hoch",
      text: candIsBalanced
        ? `Die Stelle verlangt ${roleDesc}. ${s} bringt ein ausgeglichenes Profil mit und kann sich flexibel anpassen. Die Grundlage stimmt. Mit klaren Erwartungen ist eine stabile Entwicklung realistisch.`
        : `Die Stelle verlangt ${roleDesc}. ${s} bringt genau das mit. In einzelnen Bereichen ist Feinabstimmung nötig, aber die Grundlage stimmt. Mit klaren Erwartungen und guter Einarbeitung ist eine stabile Entwicklung realistisch.`,
    };
  }
  if (gap === "mittel") {
    return {
      level: 3,
      label: "mittel",
      text: candIsBalanced
        ? `Die Stelle verlangt ${roleDesc}. ${s} bringt ein ausgeglichenes Profil ohne klaren Schwerpunkt mit. Die Vielseitigkeit ermöglicht eine Anpassung, braucht aber klare Führung und konkrete Ziele.`
        : rk === ck
          ? `Die Stelle verlangt ${roleDesc}. ${s} arbeitet in dieselbe Richtung, muss aber in einzelnen Bereichen noch gezielt dazulernen. Mit klaren Zielen und regelmässigem Feedback ist das gut machbar.`
          : `Die Stelle verlangt ${roleDesc}. ${s} arbeitet eher über ${compDesc(ck)}. Die Anpassung ist möglich, braucht aber klare Führung und konkrete Ziele über mehrere Monate.`,
    };
  }
  return {
    level: 1,
    label: "niedrig",
    text: candIsBalanced
      ? `Die Stelle verlangt ${roleDesc}. ${s} bringt ein ausgeglichenes Profil mit, aber die Arbeitslogik weicht in wesentlichen Bereichen ab. Der geforderte Schwerpunkt lässt sich aus einem vielseitigen Profil nur schwer konsequent aufbauen.`
      : rk === ck
        ? `Die Stelle verlangt ${roleDesc} – deutlich stärker, als ${subj(cand)} es mitbringt. Die Richtung passt zwar, reicht aber nicht aus. Es bräuchte intensive Begleitung über längere Zeit. Ob sich dieser Aufwand lohnt, sollte ehrlich geprüft werden.`
        : `Die Stelle verlangt ${roleDesc}. ${s} setzt auf ${compDesc(ck)}. Das sind zwei unterschiedliche Arbeitsweisen. Die Anpassung wäre aufwendig, langwierig und im Ergebnis unsicher.`,
  };
}

function buildActions(rk: ComponentKey, ck: ComponentKey, gap: string, control: string, roleIsBalFull = false, ct?: Triad): string[] {
  if (roleIsBalFull && ct) {
    const spread = Math.max(ct.impulsiv, ct.intuitiv, ct.analytisch) - Math.min(ct.impulsiv, ct.intuitiv, ct.analytisch);
    if (spread <= 10) {
      return [
        "Regelmässige Zielvereinbarungen zur Feinsteuerung der Vielseitigkeit durchführen.",
        "Halbjährliche Überprüfung der Stellenpassung sicherstellen.",
      ];
    }
    const domKey: ComponentKey = ct.impulsiv >= ct.intuitiv && ct.impulsiv >= ct.analytisch ? "impulsiv" : ct.intuitiv >= ct.analytisch ? "intuitiv" : "analytisch";
    const weakKeys = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== domKey);
    const weakDescs = weakKeys.map(k => compShort(k)).join(" und ");
    return [
      `Gezielte Entwicklung in den untervertretenen Bereichen (${weakDescs}) einleiten.`,
      "Regelmässige Zielgespräche mit Fokus auf Vielseitigkeit in der Arbeitsweise durchführen.",
      "Vierteljährliche Überprüfung, ob alle drei Bereiche im Arbeitsalltag abgedeckt werden.",
      "Klare Erwartungen an die situative Flexibilität formulieren und kommunizieren.",
    ];
  }

  if (gap === "gering") {
    return [
      "Regelmässige Zielvereinbarungen zur Feinsteuerung durchführen.",
      "Halbjährliche Überprüfung der Stellenpassung sicherstellen.",
    ];
  }

  const base: string[] = [];

  if (rk === ck) {
    base.push("Abweichungen in den Nebenbereichen identifizieren und gezielt ansprechen.");
    base.push("Regelmässige Zielgespräche zur Kalibrierung der Nebenbereich-Gewichtung durchführen.");
    if (rk === "analytisch") {
      base.push("Prüfen, ob Tempo und Kommunikation den Stellenanforderungen entsprechen.");
    } else if (rk === "impulsiv") {
      base.push("Prüfen, ob Struktur und Beziehungsarbeit ausreichend berücksichtigt werden.");
    } else {
      base.push("Prüfen, ob Entscheidungstempo und Prozessklarheit den Erwartungen entsprechen.");
    }
    base.push("Vierteljährliche Überprüfung der Gesamtpassung einplanen.");
  } else if (rk === "analytisch") {
    base.push("Klare Entscheidungsregeln für die ersten 90 Tage festlegen.");
    base.push("Schriftliche Standards für Dokumentation und Prüfschritte definieren.");
    base.push("Wöchentliche Review-Termine mit fester KPI-Logik durchführen.");
    base.push("Arbeitsfortschritt in überprüfbare Zwischenschritte unterteilen.");
  } else if (rk === "impulsiv") {
    base.push("Klare Umsetzungsfristen und Entscheidungsdeadlines definieren.");
    base.push("Schnelle Entscheidungswege einrichten und Abstimmungsrunden begrenzen.");
    base.push("Ergebnisorientierte KPIs statt Prozess-KPIs verwenden.");
    base.push("Wöchentliche Fortschrittsreviews mit messbaren Meilensteinen einführen.");
  } else if (rk === "intuitiv") {
    base.push("Regelmässige Team-Feedbackrunden fest im Kalender verankern.");
    base.push("Kommunikationserwartungen klar und schriftlich formulieren.");
    base.push("Beziehungsarbeit als explizites Ziel in die Leistungsbewertung aufnehmen.");
    base.push("Monatliche Einzelgespräche zur Reflexion der Teamdynamik einrichten.");
  }

  if (control === "hoch") {
    base.push("Engmaschige Führungsbegleitung in den ersten 90 Tagen sicherstellen.");
  }

  return base;
}

function buildIntegrationsplan(role: string, cand: string, fit: string, rk: ComponentKey, ck: ComponentKey, gap: string, control: string, fuehrungsArt: FuehrungsArt, rt: Triad, ct: Triad, roleIsBalFull = false): IntegrationPhase[] | null {
  if (fit === "Nicht geeignet") return null;

  const s = Subj(cand);
  const rkDesc = compDesc(rk);
  const ckDesc = compDesc(ck);
  const sameDom = rk === ck;
  const isLeader = fuehrungsArt !== "keine";
  const isBedingt = fit === "Bedingt geeignet";

  if (roleIsBalFull) {
    const spread = Math.max(ct.impulsiv, ct.intuitiv, ct.analytisch) - Math.min(ct.impulsiv, ct.intuitiv, ct.analytisch);
    const candBalanced = spread <= 10;
    const candLower = cand === "Die Person" ? "die Person" : cand;

    if (candBalanced) {
      return [
        {
          num: 1, title: "Orientierung & Erwartungsabgleich", period: "Woche 1 – 4",
          ziel: `Vielseitige Anforderungen der Stelle ${role} verstehen und Erwartungen abstimmen.`,
          items: [
            `Klärung, wie die drei Bereiche (Tempo, Dialog, Struktur) in ${role} gewichtet werden.`,
            `Abstimmung der Arbeitsprioritäten mit dem direkten Umfeld.`,
            `Transparenz über bestehende Abläufe und Qualitätsstandards.`,
            ...(isLeader ? [`Führungsrolle und Verantwortungsrahmen definieren.`] : []),
          ],
          fokus: {
            intro: `Die Stelle und ${candLower} teilen eine vielseitige Arbeitsweise. Wichtig ist, schnell Klarheit zu schaffen über:`,
            bullets: [`situative Gewichtung der drei Bereiche`, `Entscheidungswege und Verantwortungsbereiche`, `Qualitätsstandards und Erwartungshaltung`],
          },
        },
        {
          num: 2, title: "Wirkung & Anpassung", period: "Monat 2 – 3",
          ziel: `Vielseitige Wirkung als ${role} zeigen und situative Flexibilität unter Beweis stellen.`,
          items: [
            `Eigenständige Übernahme erster Aufgaben mit wechselnden Anforderungsprofilen.`,
            `Feedback zur Wirkung in allen drei Bereichen einholen.`,
            ...(isLeader ? [`Erste Führungsentscheidungen eigenständig treffen und reflektieren.`] : []),
          ],
          fokus: {
            intro: `${s} arbeitet bereits vielseitig. Es geht jetzt darum:`,
            bullets: [`Wirksamkeit in ${role} sichtbar zu machen`, `situative Flexibilität im Alltag zu beweisen`, `belastbare Routinen zu entwickeln`],
          },
        },
        {
          num: 3, title: "Stabilisierung", period: "Monat 4 – 6",
          ziel: `Arbeitsweise als ${role} stabilisieren und langfristige Passung sichern.`,
          items: [
            `Evaluation der bisherigen Wirkung in allen drei Bereichen.`,
            `Feinabstimmung der Zusammenarbeit mit dem direkten Umfeld.`,
            `Prioritäten konsolidieren und Standards stabilisieren.`,
            ...(isLeader ? [`Führungswirkung und Teamstabilität überprüfen.`] : []),
          ],
          fokus: {
            intro: `Die Arbeitsweise ist stabil. Jetzt gilt es:`,
            bullets: [`Vielseitigkeit beibehalten und Routinen festigen`, `langfristige Stabilität in ${role} sichern`, ...(isLeader ? [`Führungswirkung absichern`] : [])],
          },
        },
      ];
    }

    const domKey: ComponentKey = ct.impulsiv >= ct.intuitiv && ct.impulsiv >= ct.analytisch ? "impulsiv" : ct.intuitiv >= ct.analytisch ? "intuitiv" : "analytisch";
    const domDesc = domKey === "impulsiv" ? "Tempo und Ergebnisorientierung" : domKey === "intuitiv" ? "Beziehungsarbeit und Dialog" : "Struktur und Analyse";
    const weakKeys = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== domKey);
    const weakDescs = weakKeys.map(k => compShort(k)).join(" und ");

    return [
      {
        num: 1, title: "Orientierung & Erwartungsabgleich", period: "Woche 1 – 4",
        ziel: `Vielseitige Anforderungen der Stelle ${role} verstehen und eigene Einseitigkeit erkennen.`,
        items: [
          `Klärung, dass die Stelle Vielseitigkeit verlangt – nicht nur ${domDesc}.`,
          `Transparenz über Anforderungen in den untervertretenen Bereichen (${weakDescs}).`,
          `Klare Erwartungen an situatives Arbeiten formulieren.`,
          ...(isLeader ? [`Führungsrolle und Verantwortungsrahmen definieren.`] : []),
        ],
        fokus: {
          intro: `${s} bringt eine einseitige Ausrichtung auf ${domDesc} mit. In der Einarbeitung muss klar werden:`,
          bullets: [`welche Bereiche neben ${domDesc} erwartet werden`, `wo gezielt gegengesteuert werden muss`, `wie Fortschritte gemessen werden`],
        },
      },
      {
        num: 2, title: "Gezielter Ausgleich", period: "Monat 2 – 3",
        ziel: `Gezielte Entwicklung der untervertretenen Bereiche (${weakDescs}).`,
        items: [
          `Konkrete Aufgaben, die ${weakDescs} erfordern, gezielt zuweisen.`,
          `Regelmässiges Feedback zur Wirkung ausserhalb der Komfortzone einholen.`,
          ...(isLeader ? [`Führungswirkung in allen drei Bereichen bewusst steuern.`] : []),
          `Fortschritte dokumentieren und Erwartungen nachschärfen.`,
        ],
        fokus: {
          intro: `Der Schwerpunkt liegt auf dem Aufbau fehlender Fähigkeiten:`,
          bullets: [`${weakDescs} aktiv einfordern und begleiten`, `Komfortzone gezielt erweitern`, `Ergebnisse regelmässig überprüfen`],
        },
      },
      {
        num: 3, title: "Stabilisierung & Entscheid", period: "Monat 4 – 6",
        ziel: `Bewerten, ob die vielseitige Stellenanforderung dauerhaft erfüllt werden kann.`,
        items: [
          `Evaluation, ob die untervertretenen Bereiche ausreichend abgedeckt werden.`,
          `Entscheid, ob der Führungsaufwand langfristig tragbar ist.`,
          `Gegebenenfalls Rollenanpassung oder Begleitmassnahmen definieren.`,
          ...(isLeader ? [`Führungswirkung und Teamstabilität abschliessend bewerten.`] : []),
        ],
        fokus: {
          intro: `Jetzt zeigt sich, ob die Anpassung gelingt:`,
          bullets: [`Vielseitigkeit im Alltag messbar bewerten`, `Entscheid über langfristige Tragfähigkeit treffen`, ...(isLeader ? [`Führungswirkung absichern`] : [])],
        },
      },
    ];
  }

  const gaps = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => ({
    key: k,
    diff: rt[k] - ct[k],
    absDiff: Math.abs(rt[k] - ct[k]),
  })).sort((a, b) => b.absDiff - a.absDiff);
  const maxGap = gaps[0];
  const maxGapDesc = compDesc(maxGap.key);
  const maxGapDir = maxGap.diff > 0 ? "zu niedrig" : "zu hoch";
  const candStrength = compDesc(ck);

  const p1Items: string[] = [];
  const p2Items: string[] = [];
  const p3Items: string[] = [];
  let p1Ziel: string;
  let p2Ziel: string;
  let p3Ziel: string;
  let p1Fokus: IntegrationFokus;
  let p2Fokus: IntegrationFokus;
  let p3Fokus: IntegrationFokus;

  if (sameDom && !isBedingt) {
    p1Ziel = `Stellenanforderungen der Position ${role} verstehen und Erwartungen abstimmen.`;
    p1Items.push(`Klärung der Entscheidungswege und Verantwortungsbereiche in der Stelle ${role}.`);
    p1Items.push(`Abstimmung der wichtigsten Arbeitsprioritäten mit dem direkten Umfeld.`);
    p1Items.push(`Transparenz über bestehende Abläufe, Prozesse und Qualitätsstandards.`);
    if (isLeader) p1Items.push(`Führungsrolle, Verantwortungsrahmen und Erwartungen an die Teamsteuerung definieren.`);
    p1Fokus = {
      intro: `Stelle und ${s === "Die Person" ? "Person" : cand} teilen denselben Grundansatz. Wichtig ist daher, schnell Klarheit zu schaffen über:`,
      bullets: [
        `bestehende Abläufe und Schnittstellen`,
        `Entscheidungswege und Verantwortungsbereiche`,
        `Qualitätsstandards und Erwartungshaltung`,
      ],
    };

    p2Ziel = `Erste operative Verantwortung als ${role} übernehmen und Wirkung zeigen.`;
    p2Items.push(`Eigenständige Übernahme erster Arbeitspakete mit Ergebnisprüfung.`);
    p2Items.push(`Feedback zur Wirkung auf Tempo, Qualität und Zusammenarbeit aktiv einholen.`);
    if (isLeader) p2Items.push(`Erste Führungsentscheidungen eigenständig treffen und reflektieren.`);
    p2Items.push(`Schnittstellenarbeit mit angrenzenden Bereichen etablieren.`);
    p2Fokus = {
      intro: `${s} arbeitet bereits nach dem richtigen Grundansatz. Es geht jetzt darum:`,
      bullets: [
        `Wirksamkeit in ${role} sichtbar zu machen`,
        `erste Arbeitsergebnisse eigenständig zu liefern`,
        `belastbare Routinen zu entwickeln`,
      ],
    };

    p3Ziel = `Arbeitsweise und ${isLeader ? "Führungsrhythmus" : "Arbeitsrhythmus"} als ${role} stabilisieren.`;
    p3Items.push(`Evaluation der bisherigen Wirkung auf Entscheidungsrhythmus und Belastung.`);
    p3Items.push(`Feinabstimmung der Zusammenarbeit mit dem direkten Umfeld.`);
    p3Items.push(`Prioritäten konsolidieren und Standards stabilisieren.`);
    if (isLeader) p3Items.push(`Führungswirkung und Teamstabilität überprüfen.`);
    p3Fokus = {
      intro: `Die Arbeitsweise ist stabil. Jetzt gilt es:`,
      bullets: [
        `Stärken beibehalten und Routinen festigen`,
        `langfristige Stabilität in ${role} sichern`,
        ...(isLeader ? [`Führungswirkung und Teamstabilität absichern`] : []),
      ],
    };

  } else {

    if (rk === "impulsiv") {
      p1Ziel = `Erwartungen an Tempo und Entscheidungsgeschwindigkeit der Stelle ${role} verstehen.`;
      p1Items.push(`Erwartungen an Umsetzungstempo und Entscheidungsgeschwindigkeit in ${role} klären.`);
      p1Items.push(`Klare Umsetzungsfristen und Deadlines für die ersten Aufgaben definieren.`);
      p1Items.push(`Verantwortungsbereiche und Entscheidungsfreiräume abgrenzen.`);
      if (isLeader) p1Items.push(`Erwartungen an Führungstempo und Reaktionszeiten transparent machen.`);
      p1Fokus = maxGap.key === "impulsiv" && maxGap.diff > 0
        ? {
            intro: `Die Stelle ${role} verlangt ein hohes Umsetzungstempo. ${s} arbeitet von Natur aus über ${candStrength}. Wichtig ist daher, früh zu klären:`,
            bullets: [
              `wo schnelle Entscheidungen notwendig sind`,
              `wo strukturierte Prüfung erwartet wird`,
              `welche Reaktionszeiten gelten`,
            ],
          }
        : {
            intro: `Die Stelle ${role} stellt Umsetzungsgeschwindigkeit in den Vordergrund. ${s} bringt ${candStrength} als Stärke mit. Zu klären ist:`,
            bullets: [
              `welches Tempo erwartet wird`,
              `wo Entscheidungsfreiräume bestehen`,
              `wie Prioritäten gesetzt werden`,
            ],
          };

      p2Ziel = `Erste eigenverantwortliche Umsetzung als ${role} starten und Ergebnisse liefern.`;
      p2Items.push(`Erste eigenverantwortliche Umsetzungsprojekte mit messbaren Zielen starten.`);
      p2Items.push(`Entscheidungsgeschwindigkeit und Ergebnisorientierung beobachten und steuern.`);
      p2Items.push(`Feedbackschleifen verkürzen und schnelle Rückmeldungen etablieren.`);
      if (isLeader) p2Items.push(`Erste Führungsentscheidungen eigenständig treffen und auswerten.`);
      else p2Items.push(`Priorisierung zwischen Schnelligkeit und Sorgfalt kalibrieren.`);
      p2Fokus = isBedingt
        ? {
            intro: `${s} sollte gezielt darauf achten, Entscheidungen aktiv zu treiben. Konkret bedeutet das:`,
            bullets: [
              `Entscheidungen nicht zu lange prüfen`,
              `Umsetzung aktiv vorantreiben`,
              `regelmässig Feedback zum Rhythmus einholen`,
            ],
          }
        : {
            intro: `${s} zeigt bereits eine gute Grunddynamik. Jetzt geht es darum:`,
            bullets: [
              `das Umsetzungstempo in ${role} weiter zu schärfen`,
              `erste Ergebnisse sichtbar zu machen`,
              `Feedbackschleifen zu etablieren`,
            ],
          };

      p3Ziel = `Umsetzungsrhythmus und ${isLeader ? "Führungswirkung" : "Arbeitsweise"} als ${role} stabilisieren.`;
      p3Items.push(`Ergebnisqualität und Tempo über die ersten 30 Tage auswerten.`);
      p3Items.push(`Nachjustierung bei Übertaktung oder Unterforderung.`);
      p3Items.push(`Umsetzungserfolge sichtbar machen und verankern.`);
      if (isLeader) p3Items.push(`Führungswirkung auf Teamdynamik und Ergebnisqualität evaluieren.`);
      else p3Items.push(`Langfristige Meilensteine und Umsetzungsziele definieren.`);

    } else if (rk === "analytisch") {
      p1Ziel = `Qualitätsstandards und Entscheidungslogik der Stelle ${role} verstehen.`;
      p1Items.push(`Klärung von Stelle, Erwartungshaltung und Qualitätsstandard in ${role}.`);
      p1Items.push(`Transparenz über bestehende Entscheidungs- und Dokumentationsstrukturen.`);
      p1Items.push(`Frühe Abstimmung von Prioritäten, Qualitätskriterien und Definition von 'Done'.`);
      p1Items.push(`Klärung operativer Prozesse und Schnittstellen.`);
      if (isLeader) p1Items.push(`Führungserwartungen in Bezug auf Prozesssteuerung und Qualitätssicherung klären.`);
      p1Fokus = maxGap.key === "analytisch" && maxGap.diff > 0
        ? {
            intro: `Die Stelle ${role} verlangt eine starke analytische Orientierung. ${s} arbeitet primär über ${candStrength}. Wichtig ist, früh zu klären:`,
            bullets: [
              `wo strukturierte Prüfung erwartet wird`,
              `wo pragmatische Lösungen reichen`,
              `welche Dokumentationsstandards gelten`,
            ],
          }
        : {
            intro: `Die Stelle ${role} stellt Struktur und Analyse in den Vordergrund. ${s} bringt ${candStrength} als Stärke mit. Zu klären ist:`,
            bullets: [
              `welche Arbeitstiefe erwartet wird`,
              `welche Standards und Prozesse gelten`,
              `wie Qualität gemessen wird`,
            ],
          };

      p2Ziel = `Erste strukturierte Arbeitsergebnisse als ${role} liefern und Standards etablieren.`;
      p2Items.push(`Ein priorisiertes Thema strukturiert analysieren und verbessern.`);
      p2Items.push(`Feedback zur Wirkung auf Qualität, Nachvollziehbarkeit und Zusammenarbeit einholen.`);
      p2Items.push(`Einen klaren Standard (Checkliste, Playbook oder Dokumentation) einführen oder schärfen.`);
      p2Items.push(`Fehlerquellen identifizieren und systematisch beheben.`);
      p2Fokus = isBedingt
        ? {
            intro: `${s} sollte verstärkt auf analytische Tiefe achten. Konkret bedeutet das:`,
            bullets: [
              `Ergebnisse sauber dokumentieren`,
              `analytische Prüfung nicht umgehen`,
              `Führungsbegleitung aktiv nutzen`,
            ],
          }
        : {
            intro: `${s} zeigt bereits eine gute Grundstruktur. Jetzt geht es darum:`,
            bullets: [
              `die analytische Arbeitsweise in ${role} zu vertiefen`,
              `Standards einzuführen oder zu schärfen`,
              `Qualität systematisch sichtbar zu machen`,
            ],
          };

      p3Ziel = `Qualitätsstandards und Prozesssteuerung als ${role} dauerhaft verankern.`;
      p3Items.push(`Evaluation der Wirkung auf Entscheidungsrhythmus, Priorisierung und Belastung.`);
      p3Items.push(`Anpassung von Regeln, Schnittstellen und Qualitätsstandards.`);
      p3Items.push(`Prozessstabilität und Durchlaufzeiten prüfen.`);
      if (isLeader) p3Items.push(`Wirkung der Qualitätssteuerung auf das Team evaluieren.`);
      else p3Items.push(`Langfristige Qualitätsziele und Dokumentationsstandards festlegen.`);

    } else {
      p1Ziel = `Kommunikationserwartungen und Teamkultur der Stelle ${role} verstehen.`;
      p1Items.push(`Kommunikationserwartungen und Teamkultur in ${role} transparent machen.`);
      p1Items.push(`Beziehungsaufbau mit Schlüsselpersonen aktiv einplanen.`);
      p1Items.push(`Feedback- und Gesprächsformate klären und terminieren.`);
      if (isLeader) p1Items.push(`Erwartungen an Teamführung, Mitarbeiterentwicklung und Gesprächskultur besprechen.`);
      p1Fokus = maxGap.key === "intuitiv" && maxGap.diff > 0
        ? {
            intro: `Die Stelle ${role} verlangt stärkere Beziehungsorientierung. ${s} arbeitet primär über ${candStrength}. Wichtig ist, früh zu klären:`,
            bullets: [
              `wo aktive Beziehungsarbeit erwartet wird`,
              `welche Gesprächsformate gelten`,
              `wie Konflikte angesprochen werden`,
            ],
          }
        : {
            intro: `Die Stelle ${role} stellt Kommunikation und Beziehungsarbeit in den Vordergrund. ${s} bringt ${candStrength} als Stärke mit. Zu klären ist:`,
            bullets: [
              `welche Gesprächskultur erwartet wird`,
              `wie Beziehungsarbeit priorisiert wird`,
              `welche Abstimmungsformate existieren`,
            ],
          };

      p2Ziel = `Kommunikationswirkung und Beziehungsarbeit als ${role} aktiv gestalten.`;
      p2Items.push(`Regelmässige Team-Feedbackrunden durchführen und moderieren.`);
      p2Items.push(`Kommunikationsstil und Wirkung auf das Umfeld reflektieren.`);
      p2Items.push(`Beziehungsarbeit als konkretes, messbares Ziel verfolgen.`);
      p2Items.push(`Konfliktsituationen proaktiv ansprechen und lösen.`);
      p2Fokus = isBedingt
        ? {
            intro: `${s} sollte Kommunikation und Abstimmung aktiv priorisieren. Konkret bedeutet das:`,
            bullets: [
              `Kommunikation nicht als Nebensache behandeln`,
              `aktive Beziehungsarbeit als Erfolgsfaktor verstehen`,
              `regelmässig Feedback zur Wirkung einholen`,
            ],
          }
        : {
            intro: `${s} zeigt bereits eine gute Kommunikationsbasis. Jetzt geht es darum:`,
            bullets: [
              `die Wirkung im Team von ${role} auszubauen`,
              `Kommunikationsstandards zu etablieren`,
              `Teamdynamik aktiv zu gestalten`,
            ],
          };

      p3Ziel = `Kommunikationsstandards und Teamwirkung als ${role} dauerhaft verankern.`;
      p3Items.push(`Wirkung der Kommunikation auf Teamdynamik und Zusammenarbeit bewerten.`);
      p3Items.push(`Teamzufriedenheit und Bindung erheben.`);
      p3Items.push(`Kommunikationsstandards dauerhaft verankern.`);
      if (isLeader) p3Items.push(`Führungswirkung auf Teamklima und Mitarbeiterbindung evaluieren.`);
      else p3Items.push(`Offene Punkte in der Beziehungsarbeit klären und abschliessen.`);
    }

    if (control === "hoch") {
      p1Items.push(`Engmaschige Führungsbegleitung von Tag 1 sicherstellen.`);
      p3Items.push(`Überprüfen, ob der Führungsaufwand schrittweise reduziert werden kann.`);
    }

    p3Fokus = isBedingt
      ? {
          intro: `${candStrength} bleiben erhalten, während die Arbeitsweise Richtung ${rkDesc} weiterentwickelt wird. Die Führungskraft prüft:`,
          bullets: [
            `ob der Führungsaufwand langfristig tragbar ist`,
            `ob die Entwicklungsrichtung stimmt`,
            `ob die Stelle dauerhaft stabil besetzt werden kann`,
          ],
        }
      : {
          intro: `Die Arbeitsweise ist stabil. Jetzt gilt es:`,
          bullets: [
            `Stärken beibehalten und Routinen festigen`,
            `langfristige Stabilität in ${role} sichern`,
          ],
        };
  }

  return [
    { num: 1, title: "Orientierung", period: "Tag 1\u201310", ziel: p1Ziel, items: p1Items, fokus: p1Fokus },
    { num: 2, title: "Wirkung", period: "Tag 11\u201320", ziel: p2Ziel, items: p2Items, fokus: p2Fokus },
    { num: 3, title: "Stabilisierung", period: "Tag 21\u201330", ziel: p3Ziel, items: p3Items, fokus: p3Fokus },
  ];
}

function buildFinal(role: string, cand: string, fit: string, control: string, rk: ComponentKey, ck: ComponentKey, fuehrungsArt: FuehrungsArt, isDualDomRole = false, rk2?: ComponentKey, roleIsBalFull = false, ct?: Triad, fitSubtype: FitSubtype = "MISMATCH"): string {
  const leadSuffix = fuehrungsArt === "disziplinarisch"
    ? ` Da die Stelle Führungsverantwortung beinhaltet, wirkt sich die Abweichung auch auf Führungskultur und Teamstabilität aus.`
    : fuehrungsArt === "fachlich"
      ? ` Da die Stelle fachliche Führung beinhaltet, beeinflusst die Abweichung auch die fachliche Orientierung des Teams.`
      : "";

  const s = Subj(cand);

  if (roleIsBalFull && ct) {
    const spread = Math.max(ct.impulsiv, ct.intuitiv, ct.analytisch) - Math.min(ct.impulsiv, ct.intuitiv, ct.analytisch);
    const candBalanced = spread <= 10;
    if (fit === "Geeignet") {
      return candBalanced
        ? `Die Stelle ${role} erfordert Vielseitigkeit über alle drei Bereiche. ${s} bringt ein ausgeglichenes Profil mit. Der Führungsaufwand ist ${control}. Eine stabile Besetzung ist unter diesen Bedingungen wahrscheinlich.`
        : `Die Stelle ${role} erfordert Vielseitigkeit. ${s} bringt eine einseitige Ausrichtung mit, die Abweichungen sind aber handhabbar. Der Führungsaufwand ist ${control}. Mit gezielter Begleitung ist eine stabile Besetzung möglich.`;
    }
    if (fit === "Bedingt geeignet") {
      const domKey: ComponentKey = ct.impulsiv >= ct.intuitiv && ct.impulsiv >= ct.analytisch ? "impulsiv" : ct.intuitiv >= ct.analytisch ? "intuitiv" : "analytisch";
      const domDesc = domKey === "impulsiv" ? "Tempo und Ergebnisorientierung" : domKey === "intuitiv" ? "Beziehungsarbeit und Dialog" : "Struktur und Analyse";
      return `Die Stelle ${role} erfordert Vielseitigkeit über alle drei Bereiche. ${s} ist auf ${domDesc} fokussiert und deckt die geforderte Breite nicht ab. Mit gezielter Führung und klarer Entwicklungsbegleitung lässt sich die Zusammenarbeit stabilisieren. Der Führungsaufwand ist ${control}.${leadSuffix}`;
    }
    return `Die Stelle ${role} erfordert Vielseitigkeit über alle drei Bereiche. ${s} ist einseitig ausgerichtet und deckt die geforderte Breite nicht ab. Die Grundpassung ist damit nicht gegeben. Eine stabile Besetzung wäre nur mit dauerhaft erhöhtem Führungsaufwand möglich.${leadSuffix}`;
  }

  const roleDesc = isDualDomRole && rk2 ? dualRoleDesc(rk, rk2) : compDesc(rk);
  if (fit === "Geeignet") {
    if (fitSubtype === "PERFECT") {
      return `Die Stelle ${role} erfordert ${roleDesc}. ${s} bringt diese Arbeitsweise mit. Grundrichtung und Gewichtung passen. Der Führungsaufwand ist ${control}. Eine stabile Besetzung ist unter diesen Bedingungen wahrscheinlich.`;
    }
    if (fitSubtype === "STRUCTURE_MATCH_INTENSITY_OFF") {
      return `Die Stelle ${role} erfordert ${roleDesc}. ${s} arbeitet in dieselbe Richtung, die Gewichtung der Nebenbereiche ist jedoch nicht vollständig deckungsgleich. Der Führungsaufwand ist ${control}. Mit gezielter Feinsteuerung ist eine stabile Besetzung wahrscheinlich.`;
    }
    return `Die Stelle ${role} erfordert ${roleDesc}. ${s} bringt eine weitgehend passende Arbeitsweise mit. Der Führungsaufwand ist ${control}. Eine stabile Besetzung ist unter diesen Bedingungen wahrscheinlich.`;
  }
  if (fit === "Bedingt geeignet") {
    if (fitSubtype === "STRUCTURE_MATCH_INTENSITY_OFF") {
      return `Die Stelle ${role} erfordert ${roleDesc}. ${s} arbeitet in dieselbe Richtung, die Gewichtung der Nebenbereiche ist jedoch nicht vollständig deckungsgleich. Mit gezielter Führung und klarer Struktur lässt sich die Zusammenarbeit stabilisieren. Der Führungsaufwand ist ${control}.${leadSuffix}`;
    }
    return `Die Stelle ${role} erfordert ${roleDesc}. ${s} weicht in einzelnen Bereichen von der Stellenanforderung ab. Mit gezielter Führung und klarer Struktur lässt sich die Zusammenarbeit stabilisieren. Der Führungsaufwand ist ${control}.${leadSuffix}`;
  }
  if (fitSubtype === "STRUCTURE_MATCH_INTENSITY_OFF") {
    return `Die Stelle ${role} erfordert ${roleDesc}. ${s} arbeitet zwar in dieselbe Richtung, die Gewichtung weicht jedoch so stark ab, dass eine stabile Besetzung nur mit dauerhaft erhöhtem Führungsaufwand möglich wäre.${leadSuffix}`;
  }
  return `Die Stelle ${role} erfordert einen Schwerpunkt auf ${roleDesc}. ${s} ist stark auf ${compDesc(ck)} ausgerichtet. Die Grundpassung ist damit nicht gegeben. Eine stabile Besetzung wäre nur mit dauerhaft erhöhtem Führungsaufwand möglich.${leadSuffix}`;
}
