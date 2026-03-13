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

export type IntegrationPhase = {
  num: number;
  title: string;
  period: string;
  ziel: string;
  items: string[];
  fokus: string;
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

function compDesc(k: ComponentKey): string {
  if (k === "impulsiv") return "Umsetzung und Tempo";
  if (k === "intuitiv") return "Zusammenarbeit und Kommunikation";
  return "Struktur und Planung";
}

function compShort(k: ComponentKey): string {
  if (k === "impulsiv") return "Tempo";
  if (k === "intuitiv") return "Kommunikation";
  return "Struktur";
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

    if (totalGap > 40) { fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#D64045"; }
    else if (totalGap > geignetLimit) { fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832"; }
    else { fitRating = "GEEIGNET"; fitLabel = "Geeignet"; fitColor = "#3A9A5C"; }

    if (candIsBalFull && !roleIsBalFull) {
      fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#D64045";
    } else if (candIsBalFull && roleIsBalFull && fitRating === "GEEIGNET") {
      fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832";
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
      else if (cDom.gap1 <= 5) { fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832"; }
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

function constellationRoleText(c: ConstellationType): string {
  const texts: Record<ConstellationType, string> = {
    H_DOM: "Diese Rolle wirkt vor allem über Geschwindigkeit, klare Priorisierung und direkte Umsetzung. Entscheidungen werden zügig getroffen, Themen schnell in Bewegung gebracht.",
    B_DOM: "Diese Rolle lebt stark vom direkten Kontakt mit Menschen, vom schnellen Erfassen von Situationen und von reibungsarmer Zusammenarbeit.",
    S_DOM: "Diese Rolle verlangt vor allem Struktur, sorgfältige Planung und verlässliche Prüftiefe. Qualität entsteht über Ordnung, Disziplin und Nachvollziehbarkeit.",
    H_GT_B: "Die Rolle wird vor allem durch Umsetzung und Tempo getragen, braucht aber gleichzeitig die Fähigkeit, Menschen mitzunehmen und Situationen sozial klug zu lesen.",
    H_GT_S: "Die Rolle lebt von zügiger Umsetzung, braucht aber eine stabile Struktur im Hintergrund. Geschwindigkeit allein reicht nicht; sie muss in klare Abläufe eingebettet sein.",
    B_GT_H: "Die Rolle wirkt primär über Beziehung und Kommunikation, braucht aber eine klare Fähigkeit, bei Bedarf zu entscheiden und in Handlung zu kommen.",
    B_GT_S: "Die Rolle braucht vor allem Zusammenarbeit, situatives Gespür und tragfähige Kommunikation. Struktur dient hier als Stabilisierung und Absicherung.",
    S_GT_H: "Die Rolle verlangt in erster Linie Planung, Sorgfalt und Ordnung, braucht aber gleichzeitig die Fähigkeit, Entscheidungen rechtzeitig umzusetzen.",
    S_GT_B: "Die Rolle wird vor allem über Struktur, Planung und Verlässlichkeit getragen. Gleichzeitig braucht sie ausreichend Kommunikationsfähigkeit, damit die Struktur im System angenommen wird.",
    H_NEAR_B: "Die Rolle verbindet starke Umsetzungsenergie mit hoher sozialer Beweglichkeit. Sie wirkt zugleich über Tempo und Kontaktfähigkeit.",
    H_NEAR_S: "Die Rolle verbindet Umsetzungskraft mit Struktur. Sie kann stark sein, wenn Geschwindigkeit und saubere Planung gemeinsam wirken.",
    B_NEAR_S: "Die Rolle verbindet Zusammenarbeit und Struktur. Sie wirkt über Orientierung, saubere Abstimmung und verlässliche Standards.",
    BALANCED: "Die Rolle zeigt keine klare strukturelle Einseitigkeit. Umsetzung, Zusammenarbeit und Struktur wirken in relativ ausgeglichener Form zusammen.",
  };
  return texts[c];
}

function constellationCandText(c: ConstellationType, cand: string): string {
  const s = Subj(cand);
  const texts: Record<ConstellationType, string> = {
    H_DOM: `${s} arbeitet mit hoher Umsetzungsenergie, trifft Entscheidungen zügig und bringt Themen schnell ins Handeln.`,
    B_DOM: `${s} baut schnell Vertrauen auf, erkennt Bedürfnisse früh und sorgt für reibungsarme Zusammenarbeit.`,
    S_DOM: `${s} arbeitet planvoll und präzise, sorgt für verlässliche Abläufe und prüft sorgfältig.`,
    H_GT_B: `${s} setzt auf Tempo und direkte Umsetzung, kann aber gleichzeitig Menschen einbinden und situative Zusammenarbeit leisten.`,
    H_GT_S: `${s} arbeitet schnell und entscheidungsorientiert, sichert Ergebnisse aber zusätzlich über klare Abläufe und Struktur ab.`,
    B_GT_H: `${s} wirkt vor allem über Beziehung und Kommunikation, kann aber bei Bedarf schnell entscheiden und handeln.`,
    B_GT_S: `${s} ist stark in Zusammenarbeit und situativem Gespür und nutzt gleichzeitig Struktur als Absicherung.`,
    S_GT_H: `${s} arbeitet vorwiegend strukturiert und planvoll, kann aber bei Bedarf schnell umschalten und handeln.`,
    S_GT_B: `${s} legt Wert auf Struktur, Ordnung und Verlässlichkeit. Gleichzeitig sorgt ein spürbarer Beziehungsanteil dafür, dass Strukturen auch kommunikativ vermittelt werden.`,
    H_NEAR_B: `Bei ${subj(cand)} wechseln sich starke Umsetzungsenergie und hohe soziale Beweglichkeit je nach Situation ab.`,
    H_NEAR_S: `Bei ${subj(cand)} stehen Umsetzungskraft und Strukturorientierung fast gleichwertig nebeneinander. Je nach Situation wird entweder schnell gehandelt oder gründlich geprüft.`,
    B_NEAR_S: `Bei ${subj(cand)} stehen Zusammenarbeit und Struktur fast gleichwertig nebeneinander. Je nach Situation wird moderiert oder geordnet.`,
    BALANCED: `${s} zeigt ein ausgeglichenes Profil ohne klare Einseitigkeit. Das Verhalten passt sich situativ an, ist aber weniger eindeutig steuerbar.`,
  };
  return texts[c];
}

function buildExecutiveBullets(rk: ComponentKey, ck: ComponentKey, gapLevel: string, fitLabel: string, cand: string, rt: Triad, ct: Triad): string[] {
  const bullets: string[] = [];

  if (rk === ck) {
    bullets.push(`Gleiche Grundausrichtung: Rolle und ${subj(cand)} setzen auf ${compDesc(rk)}.`);
  } else {
    bullets.push(`Unterschiedliche Grundausrichtung: Rolle setzt auf ${compDesc(rk)}, ${subj(cand)} auf ${compDesc(ck)}.`);
  }

  const gapI = Math.abs(rt.impulsiv - ct.impulsiv);
  const gapN = Math.abs(rt.intuitiv - ct.intuitiv);
  const gapA = Math.abs(rt.analytisch - ct.analytisch);
  const maxGapKey = gapI >= gapN && gapI >= gapA ? "impulsiv" : gapN >= gapA ? "intuitiv" : "analytisch";
  const maxGap = Math.max(gapI, gapN, gapA);

  if (maxGap >= 10) {
    bullets.push(`Grösste Abweichung im Bereich ${labelComponent(maxGapKey)} (${maxGap} Punkte Differenz).`);
  } else {
    bullets.push("Alle drei Dimensionen liegen nah beieinander. Geringe Abweichung.");
  }

  if (fitLabel === "Nicht geeignet") {
    bullets.push("Hoher Steuerungsaufwand durch die Führungskraft erforderlich. Grundlegende Abweichung zur Rollenanforderung.");
  } else if (fitLabel === "Bedingt geeignet") {
    bullets.push("Moderater Steuerungsaufwand. Gezielte Führung und klare Erwartungen gleichen Differenzen aus.");
  } else {
    bullets.push("Geringer Steuerungsaufwand. Natürliche Passung vorhanden.");
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
    risks.push("Entscheidungsgeschwindigkeit bleibt hinter der Rollenanforderung zurück");
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
    return `${s} passt in der Grundausrichtung gut zur Rolle ${role}. Beide setzen auf dieselbe Arbeitslogik. ${constellationRoleText(rConst)} ${s} arbeitet ähnlich. Kleinere Unterschiede in der Gewichtung der sekundären Bereiche sind im Alltag gut steuerbar.`;
  }

  if (gap === "hoch") {
    return `Rolle und Person arbeiten nach unterschiedlichen Prinzipien. ${constellationRoleText(rConst)} ${constellationCandText(cConst, cand)} Diese Unterschiede wirken sich im Alltag spürbar aus: bei Entscheidungen, Arbeitsweise und Zusammenarbeit.`;
  }

  return `${s} bringt eine andere Arbeitslogik mit als die Rolle ${role} erfordert. ${constellationRoleText(rConst)} ${s} geht anders vor: ${constellationCandText(cConst, cand)} Die Unterschiede sind erkennbar, lassen sich aber bei gezielter Führung und klaren Erwartungen ausgleichen.`;
}

function buildDominanceShift(role: string, cand: string, rk: ComponentKey, ck: ComponentKey, rt: Triad, ct: Triad, rConst: ConstellationType, cConst: ConstellationType): string {
  const s = Subj(cand);
  if (rk === ck) {
    if (rConst === cConst) {
      return `Die Grundausrichtung stimmt überein. Sowohl die Rolle als auch ${subj(cand)} setzen auf dieselbe Arbeitslogik. Im Alltag bedeutet das, dass die Grundrichtung passt. Einzelne Situationen werden aber unterschiedlich angegangen.`;
    }
    return `Die Hauptrichtung stimmt überein, aber die Gewichtung unterscheidet sich. ${constellationRoleText(rConst)} ${s} arbeitet zwar in dieselbe Richtung, gewichtet aber anders: ${constellationCandText(cConst, cand)} Das kann in bestimmten Situationen zu unterschiedlichem Verhalten führen.`;
  }

  const isDoubleDom = cConst.includes("NEAR") || cConst === "BALANCED";

  if (isDoubleDom) {
    return `${constellationRoleText(rConst)} ${s} bringt jedoch eine andere Arbeitsweise mit: ${constellationCandText(cConst, cand)} Da ${subj(cand)} zwischen zwei Ausrichtungen wechselt, ist das Verhalten weniger vorhersehbar. Für die Führungskraft bedeutet das: klare Rahmenvorgaben und regelmäßiges Feedback sind besonders wichtig.`;
  }

  return `${constellationRoleText(rConst)} ${s} arbeitet aber anders: ${constellationCandText(cConst, cand)} Dadurch verschiebt sich im Alltag der Schwerpunkt, weg von ${compShort(rk)}, hin zu ${compShort(ck)}.`;
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
    roleNeed = "Schnelle, handlungsorientierte Entscheidungen. Tempo und klare Richtung vor langer Prüfung.";
    if (ck === "analytisch") {
      candidatePattern = `${s} prüft gründlich und braucht eine solide Datengrundlage vor jeder Entscheidung. Das Tempo bleibt unter dem Rollenbedarf.`;
      risk = "In Situationen, die schnelles Handeln erfordern, entstehen Verzögerungen. Chancen werden verpasst, weil die Entscheidung zu spät fällt.";
    } else {
      candidatePattern = `${s} bezieht bei Entscheidungen stark den Kontext und die beteiligten Menschen ein. Abstimmungsprozesse dauern länger als die Rolle erlaubt.`;
      risk = "Entscheidungen, die sofort fallen müssten, verzögern sich durch Abstimmungsrunden. Das Umsetzungstempo leidet.";
    }
  } else {
    roleNeed = "Entscheidungen, die Kontext, Zusammenarbeit und zwischenmenschliche Wirkung berücksichtigen. Abstimmung im Team vor Geschwindigkeit.";
    if (ck === "impulsiv") {
      candidatePattern = `${s} trifft Entscheidungen schnell und handlungsorientiert. Die Wirkung auf andere wird dabei selten berücksichtigt.`;
      risk = "Betroffene fühlen sich übergangen. Entscheidungen fallen ohne ausreichende Einbindung. Das belastet langfristig die Zusammenarbeit.";
    } else {
      candidatePattern = `${s} entscheidet über Fakten und Regeln. Die zwischenmenschliche Dimension steht weniger im Fokus.`;
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
    risk = `Aufgaben werden länger geprüft als notwendig. ${s} investiert mehr Zeit in Planung und Absicherung als die Rolle erlaubt. Das bremst das Gesamttempo.`;
  } else {
    risk = "Arbeitssteuerung passt grundsätzlich zur Rolle. Feinabstimmung nötig, aber die Grundlogik stimmt.";
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
      ? "Disziplinarische Führung über Standards, Klarheit und verlässliche Struktur. Das Team braucht konsistente Prioritäten und nachvollziehbare Entscheidungen."
      : rk === "impulsiv"
        ? "Disziplinarische Führung über Entscheidungskraft, klare Richtung und schnelle Steuerung. Das Team erwartet sichtbare Leistungsorientierung."
        : "Disziplinarische Führung über Einbindung, offene Kommunikation und Gespür für Teamdynamik. Sicherheit durch persönliche Ansprache.";
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
        ? "Wirkung über Tempo, Entscheidungsstärke und direkte Umsetzung. Die eigene Arbeitsweise prägt das Umfeld durch Ergebnisorientierung."
        : "Wirkung über Kommunikation, Zusammenarbeit und situatives Gespür. Die eigene Arbeitsweise prägt das Umfeld durch Beziehungsarbeit.";
  }

  const s = Subj(cand);
  if (ck === "impulsiv") {
    candidatePattern = `${s} führt eher über Tempo, direkte Ansprache und Aktivierung. Entscheidungen werden schnell kommuniziert und umgesetzt.`;
  } else if (ck === "intuitiv") {
    candidatePattern = `${s} führt über Beziehung, Dialog und aktives Zuhören. Entscheidungen werden im Gespräch entwickelt und abgestimmt.`;
  } else {
    candidatePattern = `${s} führt über Struktur, klare Regeln und nachvollziehbare Vorgaben. Entscheidungen werden sachlich begründet und dokumentiert.`;
  }

  if (rk !== ck) {
    const leadershipSuffix = fuehrungsArt === "disziplinarisch"
      ? " Bei disziplinarischer Verantwortung wirkt sich das auf Führungskosten, Eskalationen und Teamstabilität aus."
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
    risk = "Führungsstil passt zur Rollenanforderung. Die Art, wie Orientierung gegeben wird, stimmt mit den Erwartungen des Teams überein.";
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
      risk = "Das Tempo sinkt. Statt schneller Umsetzung entsteht eine Kultur der Prüfung und Absicherung. In einem dynamischen Umfeld ein Wettbewerbsnachteil.";
    } else if (rk === "impulsiv" && ck === "intuitiv") {
      risk = "Ergebnisorientierung weicht einer Konsenskultur. Entscheidungen werden diskutiert statt umgesetzt. Die Dynamik der Rolle geht verloren.";
    } else if (rk === "intuitiv" && ck === "impulsiv") {
      risk = "Kooperative Kultur wird durch Ergebnisorientierung verdrängt. Weniger persönliche Ansprache, mehr Leistungsdruck. Bindung und Motivation sinken.";
    } else {
      risk = "Kultur wird formaler und distanzierter. Persönliche Verbindung und offener Austausch nehmen ab, das Teamgefühl leidet.";
    }
  } else {
    risk = "Kulturwirkung stimmt mit der Rollenanforderung überein. Die Art, wie das Arbeitsumfeld geprägt wird, passt zu den Erwartungen.";
  }

  return { id: "culture", label: "Kulturwirkung", severity: sev, roleNeed, candidatePattern, risk };
}

function buildRiskTimeline(role: string, cand: string, rk: ComponentKey, ck: ComponentKey, gap: string): RiskPhase[] {
  if (rk === ck || gap === "gering") {
    return [
      { label: "Kurzfristig", period: "0 - 3 Monate", text: "Die Einarbeitung verläuft voraussichtlich reibungslos. Die Arbeitslogik stimmt mit der Rollenanforderung überein. Die Führungskraft muss nur in Einzelfällen nachsteuern." },
      { label: "Mittelfristig", period: "3 - 12 Monate", text: "Stabile Leistung ist erwartbar. In den sekundären Bereichen treten kleinere Abweichungen auf. Regelmäßige Zielgespräche helfen, diese frühzeitig zu erkennen." },
      { label: "Langfristig", period: "12+ Monate", text: "Eine nachhaltige Besetzung ist wahrscheinlich. Der Steuerungsbedarf bleibt gering. Halbjährliche Überprüfungen genügen, um die Passung sicherzustellen." },
    ];
  }

  const shortRisks: Record<ComponentKey, Record<ComponentKey, string>> = {
    impulsiv: {
      intuitiv: `In der Einarbeitung investiert ${subj(cand)} mehr Zeit in Abstimmung als die Rolle erlaubt. Erste Verzögerungen beim Umsetzungstempo werden sichtbar. Die Führungskraft muss aktiv Tempo einfordern.`,
      analytisch: `In der Einarbeitung werden Entscheidungen langsamer getroffen als die Rolle verlangt. ${Subj(cand)} prüft mehr als nötig und verliert dabei an Geschwindigkeit. Die Führungskraft sollte klare Fristen setzen.`,
      impulsiv: "",
    },
    intuitiv: {
      impulsiv: `In der Einarbeitung treibt ${subj(cand)} schneller voran als die Rolle vorsieht. Beziehungsarbeit und Abstimmung leiden darunter. Die Führungskraft sollte frühzeitig auf Teamfeedback achten.`,
      analytisch: `In der Einarbeitung werden formale Prozesse stärker betont als nötig. Die zwischenmenschliche Wirkung der Rolle tritt in den Hintergrund. Die Führungskraft sollte den Fokus auf Kommunikation lenken.`,
      intuitiv: "",
    },
    analytisch: {
      impulsiv: `In der Einarbeitung entstehen erste Reibungen, weil Tempo und Arbeitslogik von ${subj(cand)} nicht zur geforderten Prüftiefe passen. Fehler und Nacharbeiten treten auf, weil Abläufe nicht ausreichend geprüft werden. Die Führungskraft muss Qualitätsstandards aktiv einfordern.`,
      intuitiv: `In der Einarbeitung werden Entscheidungen stärker beziehungsorientiert getroffen als die Rolle vorsieht. Die strukturelle Präzision lässt nach. Die Führungskraft sollte klare Dokumentationserwartungen formulieren.`,
      analytisch: "",
    },
  };

  const midRisks: Record<ComponentKey, Record<ComponentKey, string>> = {
    impulsiv: {
      intuitiv: `Prioritäten, Entscheidungen und Arbeitsweise folgen zunehmend der persönlichen Beziehungslogik von ${subj(cand)}. Die Umsetzungsgeschwindigkeit sinkt weiter. Die Führungskraft muss regelmäßig Tempo und Ergebnisorientierung einfordern.`,
      analytisch: `Die Rolle wird zunehmend über Prüfung und Kontrolle gesteuert statt über Tempo. Die Dynamik der Position geht verloren. Ohne Korrektur durch die Führungskraft wird die Rolle langsamer als vorgesehen.`,
      impulsiv: "",
    },
    intuitiv: {
      impulsiv: `Die kooperative Kultur der Rolle wird durch Ergebnisorientierung verdrängt. Mitarbeiterbindung kann sinken, weil die persönliche Ansprache abnimmt. Die Führungskraft sollte gezielt Teamformate einsetzen.`,
      analytisch: `Die Rolle verliert ihren zwischenmenschlichen Charakter. Prozesse ersetzen zunehmend den persönlichen Kontakt. Das Team kann den Eindruck bekommen, dass Nähe nicht mehr gewünscht ist.`,
      intuitiv: "",
    },
    analytisch: {
      impulsiv: `Prioritäten, Entscheidungen und Arbeitsweise folgen zunehmend der persönlichen Arbeitslogik von ${subj(cand)}. Struktur und Prozessqualität werden instabil. Die Qualitätsstandards der Rolle erodieren schrittweise.`,
      intuitiv: `Die analytische Schärfe der Rolle wird durch Konsensentscheidungen aufgeweicht. Prüftiefe nimmt ab, Entscheidungen werden stärker von Beziehungsdynamik geprägt als von Fakten.`,
      analytisch: "",
    },
  };

  return [
    {
      label: "Kurzfristig",
      period: "0 - 3 Monate",
      text: shortRisks[rk]?.[ck] || `Die Einarbeitung zeigt erste Abweichungen von der Rollenanforderung. Die Führungskraft sollte aufmerksam beobachten und frühzeitig gegensteuern.`,
    },
    {
      label: "Mittelfristig",
      period: "3 - 12 Monate",
      text: midRisks[rk]?.[ck] || `Die persönliche Arbeitslogik von ${subj(cand)} prägt zunehmend die Rolle. Ohne gezielte Steuerung verschiebt sich die Wirkung der Position dauerhaft.`,
    },
    {
      label: "Langfristig",
      period: "12+ Monate",
      text: gap === "hoch"
        ? `Die Wirkung der Rolle kann sich dauerhaft von der ursprünglichen Anforderung entfernen. Qualitäts- und Führungsrisiken steigen deutlich. Eine Korrektur wird mit der Zeit schwieriger. Die Führungskraft muss entscheiden, ob der Steuerungsaufwand langfristig tragbar ist.`
        : `Ohne gezielte Steuerung kann sich die Rollenausübung allmählich verschieben. Regelmäßige Überprüfung ist ratsam. Die Führungskraft sollte halbjährlich prüfen, ob die Rollenanforderung noch erfüllt wird.`,
    },
  ];
}

function buildDevelopment(gap: string, rk: ComponentKey, ck: ComponentKey, control: string, cand: string): { level: number; label: string; text: string } {
  if (gap === "gering") {
    return {
      level: 4,
      label: "hoch",
      text: `Die Anpassung an die Rollenanforderung ist mit hoher Wahrscheinlichkeit erreichbar. Die Grundausrichtung stimmt bereits überein. ${Subj(cand)} muss lediglich in den sekundären Bereichen Feinabstimmung leisten. Bei klarer Erwartungssetzung ist das realistisch.`,
    };
  }
  if (gap === "mittel") {
    return {
      level: 3,
      label: "mittel",
      text: `Eine Entwicklung in Richtung stärkerer ${compDesc(rk)} ist möglich. Sie erfordert gezielte Führung, klare Erwartungen und regelmäßige Rückmeldung. Der Zeitraum beträgt erfahrungsgemäß 6 bis 12 Monate. Die Führungskraft sollte konkrete Entwicklungsziele definieren und den Fortschritt regelmäßig überprüfen.`,
    };
  }
  return {
    level: 1,
    label: "niedrig",
    text: `Eine Entwicklung von ${compDesc(ck)} hin zu ${compDesc(rk)} ist grundsätzlich möglich, erfordert jedoch intensive Führung, klare Standards und konsequente Nachsteuerung über einen längeren Zeitraum. Der Erfolg ist nicht sicher. Die Führungskraft sollte realistisch abwägen, ob der notwendige Aufwand im Verhältnis zum erwarteten Ergebnis steht.`,
  };
}

function buildActions(rk: ComponentKey, ck: ComponentKey, gap: string, control: string): string[] {
  if (gap === "gering") {
    return [
      "Regelmäßige Zielvereinbarungen zur Feinsteuerung durchführen.",
      "Halbjährliche Überprüfung der Rollenpassung sicherstellen.",
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
  let p1Fokus: string;
  let p2Fokus: string;
  let p3Fokus: string;

  if (sameDom && !isBedingt) {
    p1Ziel = `Rollenanforderungen in ${role} verstehen und Erwartungen abstimmen.`;
    p1Items.push(`Klärung der Entscheidungswege und Verantwortungsbereiche in der Rolle ${role}.`);
    p1Items.push(`Abstimmung der wichtigsten Arbeitsprioritäten mit dem direkten Umfeld.`);
    p1Items.push(`Transparenz über bestehende Abläufe, Prozesse und Qualitätsstandards.`);
    if (isLeader) p1Items.push(`Führungsrolle, Verantwortungsrahmen und Erwartungen an die Teamsteuerung definieren.`);
    p1Fokus = `Die Grundlogik der Rolle und ${s === "Die Person" ? "der Person" : cand + "s Arbeitsweise"} stimmt überein. Die Orientierung konzentriert sich auf schnelle Klarheit über Abläufe und Schnittstellen.`;

    p2Ziel = `Erste operative Verantwortung in ${role} übernehmen und Wirkung zeigen.`;
    p2Items.push(`Eigenständige Übernahme erster Arbeitspakete mit Ergebnisprüfung.`);
    p2Items.push(`Feedback zur Wirkung auf Tempo, Qualität und Zusammenarbeit aktiv einholen.`);
    if (isLeader) p2Items.push(`Erste Führungsentscheidungen eigenständig treffen und reflektieren.`);
    p2Items.push(`Schnittstellenarbeit mit angrenzenden Bereichen etablieren.`);
    p2Fokus = `${s} arbeitet bereits in der richtigen Grundlogik. Der Fokus liegt darauf, die Wirksamkeit in ${role} sichtbar zu machen und Routinen zu entwickeln.`;

    p3Ziel = `Arbeitsweise und ${isLeader ? "Führungsrhythmus" : "Arbeitsrhythmus"} in ${role} stabilisieren.`;
    p3Items.push(`Evaluation der bisherigen Wirkung auf Entscheidungsrhythmus und Belastung.`);
    p3Items.push(`Feinabstimmung der Zusammenarbeit mit dem direkten Umfeld.`);
    p3Items.push(`Prioritäten konsolidieren und Standards stabilisieren.`);
    if (isLeader) p3Items.push(`Führungswirkung und Teamstabilität überprüfen.`);
    p3Fokus = `Stärken beibehalten, Routinen festigen und langfristige Stabilität in ${role} sichern.`;

  } else {

    if (rk === "impulsiv") {
      p1Ziel = `Erwartungen an Tempo und Entscheidungsgeschwindigkeit in ${role} verstehen.`;
      p1Items.push(`Erwartungen an Umsetzungstempo und Entscheidungsgeschwindigkeit in ${role} klären.`);
      p1Items.push(`Klare Umsetzungsfristen und Deadlines für die ersten Aufgaben definieren.`);
      p1Items.push(`Verantwortungsbereiche und Entscheidungsfreiräume abgrenzen.`);
      if (isLeader) p1Items.push(`Erwartungen an Führungstempo und Reaktionszeiten transparent machen.`);
      p1Fokus = maxGap.key === "impulsiv" && maxGap.diff > 0
        ? `${s} arbeitet von Natur aus über ${candStrength}. In ${role} wird jedoch ein deutlich höheres Umsetzungstempo erwartet. Wichtig ist, früh zu klären, wo schnelle Entscheidungen notwendig sind und wo strukturierte Prüfung Raum hat.`
        : `${s} bringt ${candStrength} als Stärke mit. In ${role} steht Umsetzungsgeschwindigkeit im Vordergrund. Die Orientierungsphase stellt sicher, dass beide Erwartungen klar sind.`;

      p2Ziel = `Erste eigenverantwortliche Umsetzung in ${role} starten und Ergebnisse liefern.`;
      p2Items.push(`Erste eigenverantwortliche Umsetzungsprojekte mit messbaren Zielen starten.`);
      p2Items.push(`Entscheidungsgeschwindigkeit und Ergebnisorientierung beobachten und steuern.`);
      p2Items.push(`Feedbackschleifen verkürzen und schnelle Rückmeldungen etablieren.`);
      if (isLeader) p2Items.push(`Erste Vertriebsentscheidungen eigenständig treffen und auswerten.`);
      else p2Items.push(`Priorisierung zwischen Schnelligkeit und Sorgfalt kalibrieren.`);
      p2Fokus = isBedingt
        ? `${s} sollte bewusst darauf achten, Entscheidungen nicht zu lange zu prüfen und Umsetzung aktiv zu treiben. Regelmäßiges Feedback hilft, den richtigen Rhythmus zu finden.`
        : `${s} zeigt bereits eine gute Grunddynamik. Der Fokus liegt darauf, das Umsetzungstempo in ${role} weiter zu schärfen.`;

      p3Ziel = `Umsetzungsrhythmus und ${isLeader ? "Führungswirkung" : "Arbeitsweise"} in ${role} stabilisieren.`;
      p3Items.push(`Ergebnisqualität und Tempo über die ersten 30 Tage auswerten.`);
      p3Items.push(`Nachsteuerung bei Übertaktung oder Unterforderung.`);
      p3Items.push(`Umsetzungserfolge sichtbar machen und verankern.`);
      if (isLeader) p3Items.push(`Führungswirkung auf Teamdynamik und Ergebnisqualität evaluieren.`);
      else p3Items.push(`Langfristige Meilensteine und Umsetzungsziele definieren.`);

    } else if (rk === "analytisch") {
      p1Ziel = `Qualitätsstandards und Entscheidungslogik in ${role} verstehen.`;
      p1Items.push(`Klärung von Rolle, Erwartungshaltung und Qualitätsstandard in ${role}.`);
      p1Items.push(`Transparenz über bestehende Entscheidungs- und Dokumentationsstrukturen.`);
      p1Items.push(`Frühe Abstimmung von Prioritäten, Qualitätskriterien und Definition von 'Done'.`);
      p1Items.push(`Klärung operativer Prozesse und Schnittstellen.`);
      if (isLeader) p1Items.push(`Führungserwartungen in Bezug auf Prozesssteuerung und Qualitätssicherung klären.`);
      p1Fokus = maxGap.key === "analytisch" && maxGap.diff > 0
        ? `${s} arbeitet primär über ${candStrength}. Die Rolle ${role} verlangt jedoch eine deutlich stärkere analytische Orientierung. Wichtig ist, früh zu klären, wo strukturierte Prüfung erwartet wird und wo pragmatische Lösungen reichen.`
        : `${s} bringt ${candStrength} als Stärke mit. In ${role} steht Struktur und Analyse im Vordergrund. Die Orientierungsphase schafft Klarheit über die erwartete Arbeitstiefe.`;

      p2Ziel = `Erste strukturierte Arbeitsergebnisse in ${role} liefern und Standards etablieren.`;
      p2Items.push(`Ein priorisiertes Thema strukturiert analysieren und verbessern.`);
      p2Items.push(`Feedback zur Wirkung auf Qualität, Nachvollziehbarkeit und Zusammenarbeit einholen.`);
      p2Items.push(`Einen klaren Standard (Checkliste, Playbook oder Dokumentation) einführen oder schärfen.`);
      p2Items.push(`Fehlerquellen identifizieren und systematisch beheben.`);
      p2Fokus = isBedingt
        ? `${s} sollte bewusst darauf achten, analytische Tiefe nicht zu umgehen und Ergebnisse sauber zu dokumentieren. Führung sollte hier gezielt begleiten.`
        : `${s} zeigt bereits eine gute Grundstruktur. Der Fokus liegt darauf, die analytische Arbeitsweise in ${role} weiter zu vertiefen.`;

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
        ? `${s} arbeitet primär über ${candStrength}. Die Rolle ${role} verlangt eine stärkere Orientierung an Zusammenarbeit und Kommunikation. Wichtig ist, früh zu klären, wo aktive Beziehungsarbeit erwartet wird.`
        : `${s} bringt ${candStrength} als Stärke mit. In ${role} steht Kommunikation und Zusammenarbeit im Vordergrund. Die Orientierungsphase schafft Klarheit über die erwartete Gesprächskultur.`;

      p2Ziel = `Kommunikationswirkung und Beziehungsarbeit in ${role} aktiv gestalten.`;
      p2Items.push(`Regelmäßige Team-Feedbackrunden durchführen und moderieren.`);
      p2Items.push(`Kommunikationsstil und Wirkung auf das Umfeld reflektieren.`);
      p2Items.push(`Beziehungsarbeit als konkretes, messbares Ziel verfolgen.`);
      p2Items.push(`Konfliktsituationen proaktiv ansprechen und lösen.`);
      p2Fokus = isBedingt
        ? `${s} sollte bewusst darauf achten, Kommunikation und Abstimmung nicht als Nebensache zu behandeln. Aktive Beziehungsarbeit ist in ${role} ein zentraler Erfolgsfaktor.`
        : `${s} zeigt bereits eine gute Kommunikationsbasis. Der Fokus liegt darauf, die Wirkung im Team von ${role} weiter auszubauen.`;

      p3Ziel = `Kommunikationsstandards und Teamwirkung in ${role} dauerhaft verankern.`;
      p3Items.push(`Wirkung der Kommunikation auf Teamdynamik und Zusammenarbeit bewerten.`);
      p3Items.push(`Teamzufriedenheit und Bindung erheben.`);
      p3Items.push(`Kommunikationsstandards dauerhaft verankern.`);
      if (isLeader) p3Items.push(`Führungswirkung auf Teamklima und Mitarbeiterbindung evaluieren.`);
      else p3Items.push(`Offene Punkte in der Beziehungsarbeit klären und abschließen.`);
    }

    if (control === "hoch") {
      p1Items.push(`Engmaschige Führungsbegleitung von Tag 1 sicherstellen.`);
      p3Items.push(`Überprüfen, ob die Steuerungsintensität schrittweise reduziert werden kann.`);
    }

    p3Fokus = isBedingt
      ? `${candStrength} bleibt erhalten, während die Arbeitsweise gezielt Richtung ${rkDesc} weiterentwickelt wird. Die Führungskraft prüft, ob der Steuerungsaufwand langfristig tragbar ist.`
      : `Stärken beibehalten, Routinen in ${role} festigen und langfristige Stabilität sichern.`;
  }

  return [
    { num: 1, title: "Orientierung", period: "Tag 1\u201310", ziel: p1Ziel, items: p1Items, fokus: p1Fokus },
    { num: 2, title: "Wirkung", period: "Tag 11\u201320", ziel: p2Ziel, items: p2Items, fokus: p2Fokus },
    { num: 3, title: "Stabilisierung", period: "Tag 21\u201330", ziel: p3Ziel, items: p3Items, fokus: p3Fokus },
  ];
}

function buildFinal(role: string, cand: string, fit: string, control: string, rk: ComponentKey, ck: ComponentKey, fuehrungsArt: FuehrungsArt): string {
  const leadSuffix = fuehrungsArt === "disziplinarisch"
    ? ` Da die Rolle disziplinarische Führungsverantwortung trägt, wirkt sich die Abweichung nicht nur auf die eigene Arbeitsweise aus, sondern auch auf die Führungskultur und Teamstabilität.`
    : fuehrungsArt === "fachlich"
      ? ` Da die Rolle fachliche Führung beinhaltet, beeinflusst die Profilabweichung auch die fachliche Orientierung des Teams.`
      : "";

  const s = Subj(cand);
  if (fit === "Geeignet") {
    return `${s} zeigt eine gute Passung für die Rolle ${role}. Die Arbeitslogik stimmt in der Grundausrichtung überein und der Steuerungsbedarf ist ${control}. Eine stabile Besetzung ist unter diesen Bedingungen wahrscheinlich. Die Führungskraft sollte dennoch regelmäßig prüfen, ob die sekundären Bereiche zur Rolle passen.${leadSuffix}`;
  }
  if (fit === "Bedingt geeignet") {
    return `${s} kann die Rolle ${role} unter bestimmten Bedingungen ausfüllen. Der Steuerungsbedarf ist ${control}. Die Arbeitslogik weicht in einzelnen Bereichen von der Rollenanforderung ab, lässt sich aber mit gezielter Führung und klarer Struktur stabilisieren. Die Führungskraft sollte konkrete Steuerungsmaßnahmen festlegen und den Fortschritt regelmäßig überprüfen.${leadSuffix}`;
  }
  return `${s} ist stark auf ${compDesc(ck)} ausgerichtet, während die Rolle einen Schwerpunkt auf ${compDesc(rk)} erfordert. Die Grundpassung ist damit nicht gegeben. Eine stabile Besetzung wäre nur mit hohem Steuerungsaufwand möglich. Die Führungskraft sollte realistisch bewerten, ob dieser Aufwand langfristig tragbar ist.${leadSuffix}`;
}
