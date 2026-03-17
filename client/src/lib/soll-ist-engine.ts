import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "./jobcheck-engine";
import type { Triad, ComponentKey } from "./jobcheck-engine";

export type FitRating = "GEEIGNET" | "BEDINGT" | "NICHT_GEEIGNET";
export type Severity = "ok" | "warning" | "critical";
export type FuehrungsArt = "keine" | "fachlich" | "disziplinarisch";

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

export type IntegrationFokus = {
  intro: string;
  bullets: string[];
};

export type IntegrationPhase = {
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
  roleConstellation: ConstellationType;
  candConstellation: ConstellationType;
  roleConstellationLabel: string;
  candConstellationLabel: string;
  totalGap: number;
  gapLevel: "gering" | "mittel" | "hoch";
  fitRating: FitRating;
  fitLabel: string;
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
  if (gap >= 15) return "critical";
  if (gap >= 8) return "warning";
  return "ok";
}

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
  matchCheckFit?: string,
  matchCheckControl?: string
): SollIstResult {
  resetVariants();
  const rt = normalizeTriad(roleProfile);
  const ct = normalizeTriad(candProfile);
  const rDom = dominanceModeOf(rt);
  const cDom = dominanceModeOf(ct);

  const totalGap = Math.abs(rt.impulsiv - ct.impulsiv) + Math.abs(rt.intuitiv - ct.intuitiv) + Math.abs(rt.analytisch - ct.analytisch);
  const sameDom = rDom.top1.key === cDom.top1.key;

  let fitRating: FitRating;
  let fitLabel: string;
  let fitColor: string;
  let gapLevel: "gering" | "mittel" | "hoch";
  let controlIntensity: "gering" | "mittel" | "hoch";

  if (matchCheckFit) {
    if (matchCheckFit === "SUITABLE") { fitRating = "GEEIGNET"; fitLabel = "Geeignet"; fitColor = "#3A9A5C"; gapLevel = "gering"; }
    else if (matchCheckFit === "CONDITIONAL") { fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832"; gapLevel = "mittel"; }
    else { fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#D64045"; gapLevel = "hoch"; }

    if (matchCheckControl) {
      controlIntensity = matchCheckControl === "HIGH" ? "hoch" : matchCheckControl === "MEDIUM" ? "mittel" : "gering";
    } else {
      controlIntensity = fitRating === "NICHT_GEEIGNET" ? "hoch" : fitRating === "BEDINGT" ? "mittel" : "gering";
    }
  } else {
    const geignetLimit = sameDom ? 28 : 20;
    gapLevel = totalGap > 40 ? "hoch" : totalGap > geignetLimit ? "mittel" : "gering";

    const candIsBalFull = cDom.gap1 <= 5 && cDom.gap2 <= 5;
    const roleIsBalFull = rDom.gap1 <= 5 && rDom.gap2 <= 5;
    const roleClearDominance = rDom.gap1 >= 15;
    const candDualDominance = !candIsBalFull && cDom.gap1 <= 5;
    const maxGapVal = Math.max(
      Math.abs(rt.impulsiv - ct.impulsiv),
      Math.abs(rt.intuitiv - ct.intuitiv),
      Math.abs(rt.analytisch - ct.analytisch)
    );
    const effectiveSameDom = sameDom || roleIsBalFull;
    const secondaryFlip = effectiveSameDom && rDom.top2.key !== cDom.top2.key;
    const candSecGap = cDom.gap2;

    const roleIsBalFull2 = rDom.gap1 <= 5 && rDom.gap2 <= 5;
    const candSpreadVal = cDom.top1.value - cDom.top3.value;
    if (roleIsBalFull2) {
      if (candSpreadVal <= 5) { fitRating = "GEEIGNET"; fitLabel = "Geeignet"; fitColor = "#3A9A5C"; }
      else if (candSpreadVal < 12) { fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832"; }
      else { fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#D64045"; }
    } else {
      if (totalGap > 40) { fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#D64045"; }
      else if (totalGap > geignetLimit) { fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832"; }
      else { fitRating = "GEEIGNET"; fitLabel = "Geeignet"; fitColor = "#3A9A5C"; }

      if (candIsBalFull && !roleIsBalFull) {
        fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#D64045";
      }

      if (!effectiveSameDom && fitRating !== "NICHT_GEEIGNET") {
        fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#D64045";
      }

      if (maxGapVal > 25 && fitRating !== "NICHT_GEEIGNET") {
        fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#D64045";
      }

      if (candDualDominance && roleClearDominance && fitRating !== "NICHT_GEEIGNET") {
        const roleKeyInDual = cDom.top1.key === rDom.top1.key || cDom.top2.key === rDom.top1.key;
        if (!roleKeyInDual) {
          fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#D64045";
        } else if (fitRating === "GEEIGNET") {
          fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832";
        }
      }

      if (fitLabel === "Geeignet") {
        if (secondaryFlip && candSecGap > 5 && rDom.gap2 > 5) {
          fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#D64045";
        } else if (secondaryFlip) {
          fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832";
        } else if (effectiveSameDom && candSecGap <= 5) {
          fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832";
        }
      }

      if (fitLabel === "Geeignet") {
        if (maxGapVal > 18) { fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832"; }
        else if (cDom.gap1 <= 5 && rDom.gap1 > 5) { fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832"; }
      }
    }

    controlIntensity = totalGap > 35 ? "hoch" : totalGap > 15 ? "mittel" : "gering";

    if (fitRating === "NICHT_GEEIGNET") { gapLevel = "hoch"; controlIntensity = "hoch"; }
    else if (fitRating === "BEDINGT" && gapLevel === "gering") { gapLevel = "mittel"; controlIntensity = controlIntensity === "gering" ? "mittel" : controlIntensity; }
  }

  const rk = rDom.top1.key;
  const ck = cDom.top1.key;
  const cn = candidateName || "Die Person";

  const rConst = detectConstellation(rt);
  const cConst = detectConstellation(ct);

  const summaryText = buildSummary(roleName, cn, fitLabel, rk, ck, gapLevel, rt, ct, rConst, cConst);
  const executiveBullets = buildExecutiveBullets(rk, ck, gapLevel, fitLabel, cn, rt, ct);
  const constellationRisks = buildConstellationRisks(rk, ck, gapLevel, rt, ct);
  const dominanceShiftText = buildDominanceShift(roleName, cn, rk, ck, rt, ct, rConst, cConst);
  const stressBehavior = buildStressBehavior(cConst, ct, cn, gapLevel);
  const impactAreas = buildImpactAreas(rk, ck, rt, ct, cn, fuehrungsArt);
  const riskTimeline = buildRiskTimeline(roleName, cn, rk, ck, gapLevel);
  const devGap = fitRating === "NICHT_GEEIGNET" ? "hoch" : (matchCheckFit ? controlIntensity : gapLevel);
  const { level: developmentLevel, label: developmentLabel, text: developmentText } = buildDevelopment(devGap, rk, ck, controlIntensity, cn);
  const actions = buildActions(rk, ck, gapLevel, controlIntensity);
  const integrationsplan = buildIntegrationsplan(roleName, cn, fitLabel, rk, ck, gapLevel, controlIntensity, fuehrungsArt, rt, ct);
  const finalText = buildFinal(roleName, cn, fitLabel, controlIntensity, rk, ck, fuehrungsArt);

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
    roleConstellation: rConst,
    candConstellation: cConst,
    roleConstellationLabel: constellationLabel(rConst),
    candConstellationLabel: constellationLabel(cConst),
    totalGap,
    gapLevel,
    fitRating,
    fitLabel,
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

export function constellationRoleText(c: ConstellationType): string {
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

export function constellationCandText(c: ConstellationType, cand: string): string {
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
    S_GT_B: `${s} legt Wert auf Analyse, Ordnung und Verlässlichkeit. Gleichzeitig sorgt ein spürbarer Beziehungsanteil dafür, dass Ergebnisse auch kommunikativ vermittelt werden.`,
    H_NEAR_B: `Bei ${subj(cand)} wechseln sich hohe Ergebnisdynamik und soziale Beweglichkeit je nach Situation ab.`,
    H_NEAR_S: `Bei ${subj(cand)} stehen Umsetzungskraft und Strukturorientierung fast gleichwertig nebeneinander. Je nach Situation wird entweder schnell gehandelt oder gründlich geprüft.`,
    B_NEAR_S: `Bei ${subj(cand)} stehen Beziehungsgestaltung und analytisches Denken fast gleichwertig nebeneinander. Je nach Situation wird moderiert oder systematisch geordnet.`,
    BALANCED: `${s} zeigt ein ausgeglichenes Profil ohne klare Einseitigkeit. Das Verhalten passt sich situativ an, ist aber weniger eindeutig steuerbar.`,
  };
  return texts[c];
}

function buildExecutiveBullets(rk: ComponentKey, ck: ComponentKey, gapLevel: string, fitLabel: string, cand: string, rt: Triad, ct: Triad): string[] {
  const bullets: string[] = [];

  if (rk === ck) {
    bullets.push(`Die Stelle erfordert ${compDesc(rk)}. ${Subj(cand)} bringt dieselbe Grundausrichtung mit.`);
  } else {
    bullets.push(`Die Stelle erfordert ${compDesc(rk)}. ${Subj(cand)} setzt auf ${compDesc(ck)}.`);
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

function buildConstellationRisks(rk: ComponentKey, ck: ComponentKey, gapLevel: string, rt: Triad, ct: Triad): string[] {
  if (rk === ck && gapLevel === "gering") return [];

  const gapI = Math.abs(rt.impulsiv - ct.impulsiv);
  const gapN = Math.abs(rt.intuitiv - ct.intuitiv);
  const gapA = Math.abs(rt.analytisch - ct.analytisch);
  const risks: string[] = [];

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
    risks.push("Persönliche Ansprache muss bewusst eingefordert werden");
  } else if (rk === ck) {
    if (gapI >= 10 || gapN >= 10 || gapA >= 10) {
      risks.push("Grundrichtung stimmt, aber die Gewichtung der Nebenbereiche weicht ab");
      if (gapA >= 10) risks.push("Unterschiedliches Mass an Strukturorientierung erfordert Abstimmung");
      if (gapI >= 10) risks.push("Unterschiedliches Umsetzungstempo erfordert klare Erwartungen");
      if (gapN >= 10) risks.push("Unterschiedlicher Kommunikationsstil erfordert bewusste Führung");
    } else {
      risks.push("Feinabstimmung in den Nebenbereichen nötig");
      risks.push("Regelmässiges Feedback sichert die Passung langfristig");
    }
  }

  return risks;
}

function buildSummary(role: string, cand: string, fit: string, rk: ComponentKey, ck: ComponentKey, gap: string, rt: Triad, ct: Triad, rConst: ConstellationType, cConst: ConstellationType): string {
  const s = Subj(cand);
  if (rk === ck && gap === "gering") {
    return `${constellationRoleText(rConst)} ${s} arbeitet nach derselben Grundlogik. Arbeitsweise und Prioritäten passen zur Stelle ${role}. Kleinere Unterschiede in der Gewichtung der sekundären Bereiche sind im Alltag gut steuerbar.`;
  }

  if (gap === "hoch") {
    return `${constellationRoleText(rConst)} ${constellationCandText(cConst, cand)} Stelle und ${subj(cand)} arbeiten nach unterschiedlichen Prinzipien. Im Alltag führt das zu Reibung bei Entscheidungen, Arbeitsweise und Zusammenarbeit.`;
  }

  return `${constellationRoleText(rConst)} ${s} bringt eine andere Arbeitslogik mit als die Stelle ${role} erfordert. ${constellationCandText(cConst, cand)} Die Unterschiede sind erkennbar, lassen sich aber bei gezielter Führung und klaren Erwartungen ausgleichen.`;
}

function buildDominanceShift(role: string, cand: string, rk: ComponentKey, ck: ComponentKey, rt: Triad, ct: Triad, rConst: ConstellationType, cConst: ConstellationType): string {
  const s = Subj(cand);
  if (rk === ck) {
    if (rConst === cConst) {
      return `${constellationRoleText(rConst)} ${s} setzt auf dieselbe Arbeitslogik. Die Grundrichtung passt. Einzelne Situationen werden aber unterschiedlich angegangen.`;
    }
    return `${constellationRoleText(rConst)} ${s} arbeitet in dieselbe Richtung, gewichtet aber anders: ${constellationCandText(cConst, cand)} Das kann in bestimmten Situationen zu unterschiedlichem Verhalten führen.`;
  }

  const isDoubleDom = cConst.includes("NEAR") || cConst === "BALANCED";

  if (isDoubleDom) {
    return `${constellationRoleText(rConst)} ${s} bringt jedoch eine andere Arbeitsweise mit: ${constellationCandText(cConst, cand)} Da ${subj(cand)} zwischen zwei Ausrichtungen wechselt, ist das Verhalten weniger vorhersehbar. Klare Rahmenvorgaben und regelmässiges Feedback sind besonders wichtig.`;
  }

  return `${constellationRoleText(rConst)} ${s} arbeitet aber anders: ${constellationCandText(cConst, cand)} Dadurch verschiebt sich im Alltag der Schwerpunkt weg von ${compShort(rk)} hin zu ${compShort(ck)}.`;
}

function buildStressBehavior(cConst: ConstellationType, ct: Triad, cand: string, gapLevel: string): StressBehavior {
  const pk = primaryKey(cConst);
  const sk = secondaryKey(cConst, ct);
  const d12 = ct[pk] - ct[sk];

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
  } else {
    controlledPressure = `Steigt der Arbeitsdruck, verstärkt sich zunächst die Tendenz, ${primaryBehavior[pk]}. Kurzfristig stabilisiert das die Situation, gleichzeitig steigt das Risiko, dass ${compShort(sk)} in den Hintergrund tritt.`;
  }

  let uncontrolledStress: string;
  if (cConst === "BALANCED") {
    uncontrolledStress = `Wird der Druck sehr hoch, kann das Verhalten kippen oder wechseln, weil keine klare Hauptlogik trägt. Die Reaktion wird weniger vorhersagbar. ${sn} braucht in Stressphasen besonders klare Orientierung und Leitplanken.`;
  } else if (d12 <= 5) {
    uncontrolledStress = `Wird die Belastung sehr hoch, kann sich der Schwerpunkt leicht verschieben. ${sn} bleibt in der Grundlogik erkennbar, nutzt aber spürbar stärker ${compShort(sk)}. ${secondaryBehavior[sk]}. Die Arbeitsweise verändert sich, die Grundrichtung bleibt aber steuerbar.`;
  } else {
    uncontrolledStress = `Wird die Belastung sehr hoch und treten viele Anforderungen gleichzeitig auf, verschiebt sich das Verhalten deutlich. ${compShort(sk)} tritt stärker in den Vordergrund. ${secondaryBehavior[sk]}. Entscheidungen werden ${secondaryDecision[sk]}.`;
  }

  return { controlledPressure, uncontrolledStress };
}

function buildImpactAreas(rk: ComponentKey, ck: ComponentKey, rt: Triad, ct: Triad, cand: string, fuehrungsArt: FuehrungsArt): ImpactArea[] {
  const gapI = Math.abs(rt.impulsiv - ct.impulsiv);
  const gapN = Math.abs(rt.intuitiv - ct.intuitiv);
  const gapA = Math.abs(rt.analytisch - ct.analytisch);

  const areas: ImpactArea[] = [
    buildDecisionImpact(rk, ck, gapI, gapA, cand),
    buildWorkStructureImpact(rk, ck, rt, ct, gapA, cand),
    buildLeadershipImpact(rk, ck, gapI, gapN, gapA, cand, fuehrungsArt),
    buildCultureImpact(rk, ck, gapI, gapN, gapA, cand),
  ];

  return areas;
}

function buildDecisionImpact(rk: ComponentKey, ck: ComponentKey, gapI: number, gapA: number, cand: string): ImpactArea {
  const sev = severity(rk === "analytisch" && ck !== "analytisch" ? gapA + 5 : Math.max(gapI, gapA));
  const s = Subj(cand);

  let roleNeed: string;
  let candidatePattern: string;
  let risk: string;

  if (rk === "analytisch") {
    roleNeed = "Sorgfältige, prüforientierte Entscheidungen. Optionen abwägen, Risiken prüfen, erst dann handeln.";
    if (ck === "impulsiv") {
      candidatePattern = `${s} entscheidet deutlich schneller und handelt oft, bevor alle Informationen vorliegen.`;
      risk = "Prüfschritte werden verkürzt oder übersprungen. Bei komplexen Aufgaben steigt das Risiko für Fehler oder Nacharbeit.";
    } else {
      candidatePattern = `${s} entscheidet stärker aus dem Kontext heraus und bezieht Stimmungen und Beziehungen ein. Datenbasierte Prüfung steht weniger im Vordergrund.`;
      risk = "Technische Details und Risikoabwägungen kommen zu kurz, wenn zwischenmenschliche Faktoren die Entscheidung bestimmen.";
    }
  } else if (rk === "impulsiv") {
    roleNeed = "Schnelle, ergebnisorientierte Entscheidungen. Klare Richtung und direkte Umsetzung vor langer Prüfung.";
    if (ck === "analytisch") {
      candidatePattern = `${s} prüft gründlich und braucht eine solide Datengrundlage vor jeder Entscheidung. Das Tempo bleibt unter dem Stellenbedarf.`;
      risk = "In Situationen, die schnelles Handeln erfordern, entstehen Verzögerungen. Chancen werden verpasst, weil die Entscheidung zu spät fällt.";
    } else {
      candidatePattern = `${s} bezieht bei Entscheidungen stark den Kontext und die beteiligten Menschen ein. Abstimmungsprozesse dauern länger als die Stelle erlaubt.`;
      risk = "Entscheidungen, die sofort fallen müssten, verzögern sich durch Abstimmungsrunden. Das Umsetzungstempo leidet.";
    }
  } else {
    roleNeed = "Entscheidungen, die Kontext, Zusammenarbeit und zwischenmenschliche Wirkung berücksichtigen. Abstimmung im Team vor Geschwindigkeit.";
    if (ck === "impulsiv") {
      candidatePattern = `${s} trifft Entscheidungen schnell und handlungsorientiert. Die Wirkung auf andere wird dabei selten berücksichtigt.`;
      risk = "Betroffene fühlen sich übergangen. Entscheidungen fallen ohne ausreichende Einbindung. Das belastet langfristig die Zusammenarbeit.";
    } else {
      candidatePattern = `${s} entscheidet über Fakten und Regeln. Der zwischenmenschliche Arbeitsbereich steht weniger im Fokus.`;
      risk = "Sachlich korrekte Entscheidungen, aber Auswirkungen auf Motivation und Teamdynamik werden unterschätzt.";
    }
  }

  return { id: "decision", label: "Entscheidungslogik", severity: sev, roleNeed, candidatePattern, risk };
}

function buildWorkStructureImpact(rk: ComponentKey, ck: ComponentKey, rt: Triad, ct: Triad, gapA: number, cand: string): ImpactArea {
  const sev = severity(gapA);

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
  if (ct.analytisch >= 35) {
    candidatePattern = `${s} arbeitet strukturiert mit klaren Abläufen und festen Arbeitsschritten. Planung hat hohe Priorität.`;
  } else if (ct.analytisch >= 25) {
    candidatePattern = `${s} arbeitet grundlegend strukturiert, lässt aber Raum für situative Anpassungen.`;
  } else {
    candidatePattern = `${s} arbeitet situativ und tempoorientiert. Strukturierte Planung und Dokumentation haben geringe Priorität.`;
  }

  if (gapA >= 10 && ct.analytisch < rt.analytisch) {
    risk = `Bei parallelen Aufgaben handelt ${subj(cand)} eher schnell statt Schritte zu prüfen. Prüfschritte werden verkürzt. Die Führungskraft muss Prozessklarheit aktiv einfordern.`;
  } else if (gapA >= 10 && ct.analytisch > rt.analytisch) {
    risk = `Aufgaben werden länger geprüft als notwendig. ${s} investiert mehr Zeit in Planung und Absicherung als die Stelle erlaubt. Das bremst das Gesamttempo.`;
  } else {
    risk = "Arbeitssteuerung passt grundsätzlich zur Stelle. Feinabstimmung nötig, aber die Grundlogik stimmt.";
  }

  return { id: "work_structure", label: "Arbeitssteuerung", severity: sev, roleNeed, candidatePattern, risk };
}

function buildLeadershipImpact(rk: ComponentKey, ck: ComponentKey, gapI: number, gapN: number, gapA: number, cand: string, fuehrungsArt: FuehrungsArt): ImpactArea {
  const sev = severity(rk !== ck ? Math.max(gapI, gapN, gapA) * 0.7 : 0);

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

  const s = Subj(cand);
  if (ck === "impulsiv") {
    candidatePattern = `${s} führt eher über Geschwindigkeit, direkte Ansprache und Aktivierung. Entscheidungen werden schnell kommuniziert und umgesetzt.`;
  } else if (ck === "intuitiv") {
    candidatePattern = `${s} führt über Vertrauen, Dialog und aktives Zuhören. Entscheidungen werden im Gespräch entwickelt und gemeinsam getragen.`;
  } else {
    candidatePattern = `${s} führt über Systematik, klare Regeln und nachvollziehbare Vorgaben. Entscheidungen werden analytisch begründet und dokumentiert.`;
  }

  if (rk !== ck) {
    const leadershipSuffix = fuehrungsArt === "disziplinarisch"
      ? " Da die Person Führungsverantwortung trägt, wirkt sich das direkt auf Teamstabilität und Zusammenarbeit aus."
      : fuehrungsArt === "fachlich"
        ? " Bei fachlicher Führung wirkt sich das auf Teamklarheit und fachliche Sicherheit der Mitarbeiter aus."
        : "";

    if (rk === "analytisch" && ck === "impulsiv") {
      risk = `Dem Team fehlen klare Leitlinien und verlässliche Prioritäten. Entscheidungen wirken impulsiv statt durchdacht. Struktursuchende Mitarbeiter verlieren den Halt.${leadershipSuffix}`;
    } else if (rk === "analytisch" && ck === "intuitiv") {
      risk = `Führungsentscheidungen werden stärker von Beziehungsdynamik geprägt als von fachlichen Standards. Es entsteht der Eindruck, dass persönliche Nähe wichtiger ist als Leistung.${leadershipSuffix}`;
    } else if (rk === "impulsiv" && ck === "analytisch") {
      risk = `Das Team wartet auf klare Ansagen, die nicht schnell genug kommen. In Drucksituationen fehlt die entschlossene Führung, die erwartet wird.${leadershipSuffix}`;
    } else if (rk === "impulsiv" && ck === "intuitiv") {
      risk = `Statt schneller Entscheidungen wird abgestimmt. Das Team erwartet Tempo, bekommt Gesprächsrunden. Zeitkritische Situationen erzeugen Frustration.${leadershipSuffix}`;
    } else if (rk === "intuitiv" && ck === "impulsiv") {
      risk = `Mitarbeiter fühlen sich übergangen, weil Entscheidungen ohne ausreichende Einbindung fallen. Beziehungsarbeit kommt zu kurz, der Teamzusammenhalt leidet.${leadershipSuffix}`;
    } else {
      risk = `Führung wirkt formal und distanziert. Erwartet werden persönliche Nähe und offene Kommunikation, geliefert werden Regeln und Prozesse.${leadershipSuffix}`;
    }
  } else {
    risk = "Führungsstil passt zur Stellenanforderung. Die Art, wie Orientierung gegeben wird, stimmt mit den Erwartungen des Teams überein.";
  }

  return { id: "leadership", label: "Führungswirkung", severity: sev, roleNeed, candidatePattern, risk };
}

function buildCultureImpact(rk: ComponentKey, ck: ComponentKey, gapI: number, gapN: number, gapA: number, cand: string): ImpactArea {
  const sev = severity(Math.max(gapI, gapN, gapA) * 0.5);

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

  const s = Subj(cand);
  if (ck === "impulsiv") {
    candidatePattern = `${s} prägt die Kultur über Dynamik und unmittelbare Bewegung. Kurzfristig entsteht mehr Tempo.`;
  } else if (ck === "intuitiv") {
    candidatePattern = `${s} fördert Teamzusammenhalt, offenen Dialog und eine einladende Atmosphäre. Beziehungen stehen im Mittelpunkt.`;
  } else {
    candidatePattern = `${s} stärkt Qualitätsbewusstsein, Regelklarheit und Ordnung. Die Kultur wird sachlicher und strukturierter.`;
  }

  if (rk !== ck) {
    if (rk === "analytisch" && ck === "impulsiv") {
      risk = "Stabilität in Abläufen geht verloren, wenn Entscheidungen schneller fallen als sie strukturell abgesichert sind. Kurzfristig entsteht Zug, langfristig leidet Verlässlichkeit.";
    } else if (rk === "analytisch" && ck === "intuitiv") {
      risk = "Die Kultur verschiebt sich von sachlicher Qualität hin zu persönlicher Verbindung. Standards und Regeln weichen auf, wenn Beziehungen wichtiger werden als Prozesse.";
    } else if (rk === "impulsiv" && ck === "analytisch") {
      risk = "Die operative Geschwindigkeit sinkt. Statt direkter Umsetzung entsteht eine Kultur der Prüfung und Absicherung. In einem dynamischen Umfeld ein Wettbewerbsnachteil.";
    } else if (rk === "impulsiv" && ck === "intuitiv") {
      risk = "Ergebnisorientierung weicht einer Konsenskultur. Entscheidungen werden diskutiert statt umgesetzt. Die Dynamik der Stelle geht verloren.";
    } else if (rk === "intuitiv" && ck === "impulsiv") {
      risk = "Kooperative Kultur wird durch Ergebnisorientierung verdrängt. Weniger persönliche Ansprache, mehr Leistungsdruck. Bindung und Motivation sinken.";
    } else {
      risk = "Kultur wird formaler und distanzierter. Persönliche Verbindung und offener Austausch nehmen ab, das Teamgefühl leidet.";
    }
  } else {
    risk = "Kulturwirkung stimmt mit der Stellenanforderung überein. Die Art, wie das Arbeitsumfeld geprägt wird, passt zu den Erwartungen.";
  }

  return { id: "culture", label: "Kulturwirkung", severity: sev, roleNeed, candidatePattern, risk };
}

function buildRiskTimeline(role: string, cand: string, rk: ComponentKey, ck: ComponentKey, gap: string): RiskPhase[] {
  if (rk === ck || gap === "gering") {
    return [
      { label: "Kurzfristig", period: "0 - 3 Monate", text: `Die Stelle ${role} verlangt ${compDesc(rk)}. Die Arbeitslogik passt. Die Einarbeitung verläuft voraussichtlich reibungslos. Nur in Einzelfällen muss nachgesteuert werden.` },
      { label: "Mittelfristig", period: "3 - 12 Monate", text: `Die Stellenanforderungen werden stabil abgedeckt. In den sekundären Bereichen treten kleinere Abweichungen auf. Regelmässige Zielgespräche helfen, diese frühzeitig zu erkennen.` },
      { label: "Langfristig", period: "12+ Monate", text: `Die Stellenanforderungen werden langfristig stabil erfüllt. Der Führungsaufwand bleibt gering. Halbjährliche Überprüfungen genügen.` },
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
        ? `Die Stellenanforderungen können dauerhaft verfehlt werden. Qualitäts- und Führungsrisiken steigen deutlich. Eine Korrektur wird mit der Zeit schwieriger. Es muss entschieden werden, ob der Führungsaufwand langfristig tragbar ist.`
        : `Ohne gezielte Führung kann sich die Stellenausübung allmählich verschieben. Halbjährliche Überprüfung der Stellenanforderungen ist ratsam.`,
    },
  ];
}

function buildDevelopment(gap: string, rk: ComponentKey, ck: ComponentKey, control: string, cand: string): { level: number; label: string; text: string } {
  const s = Subj(cand);
  if (gap === "gering") {
    return {
      level: 4,
      label: "hoch",
      text: `Die Stelle verlangt ${compDesc(rk)}. ${s} bringt genau das mit. In einzelnen Bereichen ist Feinabstimmung nötig, aber die Grundlage stimmt. Mit klaren Erwartungen und guter Einarbeitung ist eine stabile Entwicklung realistisch.`,
    };
  }
  if (gap === "mittel") {
    return {
      level: 3,
      label: "mittel",
      text: rk === ck
        ? `Die Stelle verlangt ${compDesc(rk)}. ${s} arbeitet in dieselbe Richtung, muss aber in einzelnen Bereichen noch gezielt dazulernen. Mit klaren Zielen und regelmässigem Feedback ist das gut machbar.`
        : `Die Stelle verlangt ${compDesc(rk)}. ${s} arbeitet eher über ${compDesc(ck)}. Die Anpassung ist möglich, braucht aber klare Führung und konkrete Ziele über mehrere Monate.`,
    };
  }
  return {
    level: 1,
    label: "niedrig",
    text: rk === ck
      ? `Die Stelle verlangt ${compDesc(rk)} – deutlich stärker, als ${subj(cand)} es mitbringt. Die Richtung passt zwar, reicht aber nicht aus. Es bräuchte intensive Begleitung über längere Zeit. Ob sich dieser Aufwand lohnt, sollte ehrlich geprüft werden.`
      : `Die Stelle verlangt ${compDesc(rk)}. ${s} setzt auf ${compDesc(ck)}. Das sind zwei unterschiedliche Arbeitsweisen. Die Anpassung wäre aufwendig, langwierig und im Ergebnis unsicher.`,
  };
}

function buildActions(rk: ComponentKey, ck: ComponentKey, gap: string, control: string): string[] {
  if (gap === "gering") {
    return [
      "Regelmäßige Zielvereinbarungen zur Feinsteuerung durchführen.",
      "Halbjährliche Überprüfung der Stellenpassung sicherstellen.",
    ];
  }

  const base: string[] = [];

  if (rk === "analytisch" && ck !== "analytisch") {
    base.push("Klare Entscheidungsregeln für die ersten 90 Tage festlegen.");
    base.push("Schriftliche Standards für Dokumentation und Prüfschritte definieren.");
    base.push("Wöchentliche Review-Termine mit fester KPI-Logik durchführen.");
    base.push("Arbeitsfortschritt in überprüfbare Zwischenschritte unterteilen.");
  } else if (rk === "impulsiv" && ck !== "impulsiv") {
    base.push("Klare Umsetzungsfristen und Entscheidungsdeadlines definieren.");
    base.push("Schnelle Entscheidungswege einrichten und Abstimmungsrunden begrenzen.");
    base.push("Ergebnisorientierte KPIs statt Prozess-KPIs verwenden.");
    base.push("Wöchentliche Fortschrittsreviews mit messbaren Meilensteinen einführen.");
  } else if (rk === "intuitiv" && ck !== "intuitiv") {
    base.push("Regelmäßige Team-Feedbackrunden fest im Kalender verankern.");
    base.push("Kommunikationserwartungen klar und schriftlich formulieren.");
    base.push("Beziehungsarbeit als explizites Ziel in die Leistungsbewertung aufnehmen.");
    base.push("Monatliche Einzelgespräche zur Reflexion der Teamdynamik einrichten.");
  }

  if (control === "hoch") {
    base.push("Engmaschige Führungsbegleitung in den ersten 90 Tagen sicherstellen.");
  }

  return base;
}

function buildIntegrationsplan(role: string, cand: string, fit: string, rk: ComponentKey, ck: ComponentKey, gap: string, control: string, fuehrungsArt: FuehrungsArt, rt: Triad, ct: Triad): IntegrationPhase[] | null {
  if (fit === "Nicht geeignet") return null;

  const s = Subj(cand);
  const rkDesc = compDesc(rk);
  const ckDesc = compDesc(ck);
  const sameDom = rk === ck;
  const isLeader = fuehrungsArt !== "keine";
  const isBedingt = fit === "Bedingt geeignet";

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
    p1Ziel = `Stellenanforderungen in ${role} verstehen und Erwartungen abstimmen.`;
    p1Items.push(`Klärung der Entscheidungswege und Verantwortungsbereiche in der Stelle ${role}.`);
    p1Items.push(`Abstimmung der wichtigsten Arbeitsprioritäten mit dem direkten Umfeld.`);
    p1Items.push(`Transparenz über bestehende Abläufe, Prozesse und Qualitätsstandards.`);
    if (isLeader) p1Items.push(`Führungsrolle, Verantwortungsrahmen und Erwartungen an die Teamsteuerung definieren.`);
    p1Fokus = {
      intro: `Die Stelle und ${s === "Die Person" ? "die Person" : cand} teilen dieselbe Grundlogik. Wichtig ist daher, schnell Klarheit zu schaffen über:`,
      bullets: [
        `bestehende Abläufe und Schnittstellen`,
        `Entscheidungswege und Verantwortungsbereiche`,
        `Qualitätsstandards und Erwartungshaltung`,
      ],
    };

    p2Ziel = `Erste operative Verantwortung in ${role} übernehmen und Wirkung zeigen.`;
    p2Items.push(`Eigenständige Übernahme erster Arbeitspakete mit Ergebnisprüfung.`);
    p2Items.push(`Feedback zur Wirkung auf Tempo, Qualität und Zusammenarbeit aktiv einholen.`);
    if (isLeader) p2Items.push(`Erste Führungsentscheidungen eigenständig treffen und reflektieren.`);
    p2Items.push(`Schnittstellenarbeit mit angrenzenden Bereichen etablieren.`);
    p2Fokus = {
      intro: `${s} arbeitet bereits in der richtigen Grundlogik. Es geht jetzt darum:`,
      bullets: [
        `Wirksamkeit in ${role} sichtbar zu machen`,
        `erste Arbeitsergebnisse eigenständig zu liefern`,
        `belastbare Routinen zu entwickeln`,
      ],
    };

    p3Ziel = `Arbeitsweise und ${isLeader ? "Führungsrhythmus" : "Arbeitsrhythmus"} in ${role} stabilisieren.`;
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
      p1Ziel = `Erwartungen an Tempo und Entscheidungsgeschwindigkeit in ${role} verstehen.`;
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

      p2Ziel = `Erste eigenverantwortliche Umsetzung in ${role} starten und Ergebnisse liefern.`;
      p2Items.push(`Erste eigenverantwortliche Umsetzungsprojekte mit messbaren Zielen starten.`);
      p2Items.push(`Entscheidungsgeschwindigkeit und Ergebnisorientierung beobachten und steuern.`);
      p2Items.push(`Feedbackschleifen verkürzen und schnelle Rückmeldungen etablieren.`);
      if (isLeader) p2Items.push(`Erste Vertriebsentscheidungen eigenständig treffen und auswerten.`);
      else p2Items.push(`Priorisierung zwischen Schnelligkeit und Sorgfalt kalibrieren.`);
      p2Fokus = isBedingt
        ? {
            intro: `${s} sollte bewusst darauf achten, Entscheidungen aktiv zu treiben. Konkret bedeutet das:`,
            bullets: [
              `Entscheidungen nicht zu lange prüfen`,
              `Umsetzung aktiv vorantreiben`,
              `regelmäßig Feedback zum Rhythmus einholen`,
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

      p3Ziel = `Umsetzungsrhythmus und ${isLeader ? "Führungswirkung" : "Arbeitsweise"} in ${role} stabilisieren.`;
      p3Items.push(`Ergebnisqualität und Tempo über die ersten 30 Tage auswerten.`);
      p3Items.push(`Nachsteuerung bei Übertaktung oder Unterforderung.`);
      p3Items.push(`Umsetzungserfolge sichtbar machen und verankern.`);
      if (isLeader) p3Items.push(`Führungswirkung auf Teamdynamik und Ergebnisqualität evaluieren.`);
      else p3Items.push(`Langfristige Meilensteine und Umsetzungsziele definieren.`);

    } else if (rk === "analytisch") {
      p1Ziel = `Qualitätsstandards und Entscheidungslogik in ${role} verstehen.`;
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

      p2Ziel = `Erste strukturierte Arbeitsergebnisse in ${role} liefern und Standards etablieren.`;
      p2Items.push(`Ein priorisiertes Thema strukturiert analysieren und verbessern.`);
      p2Items.push(`Feedback zur Wirkung auf Qualität, Nachvollziehbarkeit und Zusammenarbeit einholen.`);
      p2Items.push(`Einen klaren Standard (Checkliste, Playbook oder Dokumentation) einführen oder schärfen.`);
      p2Items.push(`Fehlerquellen identifizieren und systematisch beheben.`);
      p2Fokus = isBedingt
        ? {
            intro: `${s} sollte bewusst auf analytische Tiefe achten. Konkret bedeutet das:`,
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

      p3Ziel = `Qualitätsstandards und Prozesssteuerung in ${role} dauerhaft verankern.`;
      p3Items.push(`Evaluation der Wirkung auf Entscheidungsrhythmus, Priorisierung und Belastung.`);
      p3Items.push(`Anpassung von Regeln, Schnittstellen und Qualitätsstandards.`);
      p3Items.push(`Prozessstabilität und Durchlaufzeiten prüfen.`);
      if (isLeader) p3Items.push(`Wirkung der Qualitätssteuerung auf das Team evaluieren.`);
      else p3Items.push(`Langfristige Qualitätsziele und Dokumentationsstandards festlegen.`);

    } else {
      p1Ziel = `Kommunikationserwartungen und Teamkultur in ${role} verstehen.`;
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

      p2Ziel = `Kommunikationswirkung und Beziehungsarbeit in ${role} aktiv gestalten.`;
      p2Items.push(`Regelmäßige Team-Feedbackrunden durchführen und moderieren.`);
      p2Items.push(`Kommunikationsstil und Wirkung auf das Umfeld reflektieren.`);
      p2Items.push(`Beziehungsarbeit als konkretes, messbares Ziel verfolgen.`);
      p2Items.push(`Konfliktsituationen proaktiv ansprechen und lösen.`);
      p2Fokus = isBedingt
        ? {
            intro: `${s} sollte Kommunikation und Abstimmung bewusst priorisieren. Konkret bedeutet das:`,
            bullets: [
              `Kommunikation nicht als Nebensache behandeln`,
              `aktive Beziehungsarbeit als Erfolgsfaktor verstehen`,
              `regelmäßig Feedback zur Wirkung einholen`,
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

      p3Ziel = `Kommunikationsstandards und Teamwirkung in ${role} dauerhaft verankern.`;
      p3Items.push(`Wirkung der Kommunikation auf Teamdynamik und Zusammenarbeit bewerten.`);
      p3Items.push(`Teamzufriedenheit und Bindung erheben.`);
      p3Items.push(`Kommunikationsstandards dauerhaft verankern.`);
      if (isLeader) p3Items.push(`Führungswirkung auf Teamklima und Mitarbeiterbindung evaluieren.`);
      else p3Items.push(`Offene Punkte in der Beziehungsarbeit klären und abschließen.`);
    }

    if (control === "hoch") {
      p1Items.push(`Engmaschige Führungsbegleitung von Tag 1 sicherstellen.`);
      p3Items.push(`Überprüfen, ob der Führungsaufwand schrittweise reduziert werden kann.`);
    }

    p3Fokus = isBedingt
      ? {
          intro: `${candStrength} bleibt erhalten, während die Arbeitsweise Richtung ${rkDesc} weiterentwickelt wird. Die Führungskraft prüft:`,
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

function buildFinal(role: string, cand: string, fit: string, control: string, rk: ComponentKey, ck: ComponentKey, fuehrungsArt: FuehrungsArt): string {
  const leadSuffix = fuehrungsArt === "disziplinarisch"
    ? ` Da die Stelle Führungsverantwortung beinhaltet, wirkt sich die Abweichung auch auf Führungskultur und Teamstabilität aus.`
    : fuehrungsArt === "fachlich"
      ? ` Da die Stelle fachliche Führung beinhaltet, beeinflusst die Abweichung auch die fachliche Orientierung des Teams.`
      : "";

  const s = Subj(cand);
  if (fit === "Geeignet") {
    return `Die Stelle ${role} erfordert ${compDesc(rk)}. ${s} bringt diese Grundausrichtung mit. Der Führungsaufwand ist ${control}. Eine stabile Besetzung ist unter diesen Bedingungen wahrscheinlich.`;
  }
  if (fit === "Bedingt geeignet") {
    return `Die Stelle ${role} erfordert ${compDesc(rk)}. ${s} weicht in einzelnen Bereichen von der Stellenanforderung ab. Mit gezielter Führung und klarer Struktur lässt sich die Zusammenarbeit stabilisieren. Der Führungsaufwand ist ${control}.${leadSuffix}`;
  }
  return `Die Stelle ${role} erfordert einen Schwerpunkt auf ${compDesc(rk)}. ${s} ist stark auf ${compDesc(ck)} ausgerichtet. Die Grundpassung ist damit nicht gegeben. Eine stabile Besetzung wäre nur mit dauerhaft erhöhtem Führungsaufwand möglich.${leadSuffix}`;
}
