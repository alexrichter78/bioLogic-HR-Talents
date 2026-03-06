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
  dominanceShiftText: string;
  stressBehavior: StressBehavior;
  impactAreas: ImpactArea[];
  riskTimeline: RiskPhase[];
  developmentLevel: number;
  developmentLabel: string;
  developmentText: string;
  actions: string[];
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
  fuehrungsArt: FuehrungsArt = "keine"
): SollIstResult {
  const rt = normalizeTriad(roleProfile);
  const ct = normalizeTriad(candProfile);
  const rDom = dominanceModeOf(rt);
  const cDom = dominanceModeOf(ct);

  const totalGap = Math.abs(rt.impulsiv - ct.impulsiv) + Math.abs(rt.intuitiv - ct.intuitiv) + Math.abs(rt.analytisch - ct.analytisch);
  const gapLevel: "gering" | "mittel" | "hoch" = totalGap > 40 ? "hoch" : totalGap > 20 ? "mittel" : "gering";

  let fitRating: FitRating;
  let fitLabel: string;
  let fitColor: string;
  if (totalGap > 40) { fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#C41E3A"; }
  else if (totalGap > 20) { fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#F39200"; }
  else { fitRating = "GEEIGNET"; fitLabel = "Geeignet"; fitColor = "#34C759"; }

  const controlIntensity: "gering" | "mittel" | "hoch" = totalGap > 35 ? "hoch" : totalGap > 15 ? "mittel" : "gering";

  const rk = rDom.top1.key;
  const ck = cDom.top1.key;
  const cn = candidateName || "Der Kandidat";

  const rConst = detectConstellation(rt);
  const cConst = detectConstellation(ct);

  const summaryText = buildSummary(roleName, cn, fitLabel, rk, ck, gapLevel, rt, ct, rConst, cConst);
  const dominanceShiftText = buildDominanceShift(roleName, cn, rk, ck, rt, ct, rConst, cConst);
  const stressBehavior = buildStressBehavior(cConst, ct, cn, gapLevel);
  const impactAreas = buildImpactAreas(rk, ck, rt, ct, cn, fuehrungsArt);
  const riskTimeline = buildRiskTimeline(roleName, cn, rk, ck, gapLevel);
  const { level: developmentLevel, label: developmentLabel, text: developmentText } = buildDevelopment(gapLevel, rk, ck, controlIntensity, cn);
  const actions = buildActions(rk, ck, gapLevel, controlIntensity);
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
    dominanceShiftText,
    stressBehavior,
    impactAreas,
    riskTimeline,
    developmentLevel,
    developmentLabel,
    developmentText,
    actions,
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
  const texts: Record<ConstellationType, string> = {
    H_DOM: `${cand} arbeitet mit hoher Umsetzungsenergie, trifft Entscheidungen zügig und bringt Themen schnell ins Handeln.`,
    B_DOM: `${cand} baut schnell Vertrauen auf, erkennt Bedürfnisse früh und sorgt für reibungsarme Zusammenarbeit.`,
    S_DOM: `${cand} arbeitet planvoll und präzise, sorgt für verlässliche Abläufe und prüft sorgfältig.`,
    H_GT_B: `${cand} setzt auf Tempo und direkte Umsetzung, kann aber gleichzeitig Menschen einbinden und situative Zusammenarbeit leisten.`,
    H_GT_S: `${cand} arbeitet schnell und entscheidungsorientiert, sichert Ergebnisse aber zusätzlich über klare Abläufe und Struktur ab.`,
    B_GT_H: `${cand} wirkt primär über Beziehung und Kommunikation, kann aber bei Bedarf schnell entscheiden und handeln.`,
    B_GT_S: `${cand} ist stark in Zusammenarbeit und situativem Gespür, nutzt gleichzeitig Struktur als Absicherung.`,
    S_GT_H: `${cand} arbeitet vorwiegend strukturiert und planvoll, kann aber bei Bedarf schnell umschalten und handeln.`,
    S_GT_B: `${cand} legt Wert auf Struktur, Ordnung und Verlässlichkeit. Gleichzeitig sorgt ein Beziehungsanteil dafür, dass Strukturen kommunikativ vermittelt werden.`,
    H_NEAR_B: `${cand} zeigt eine Doppelausrichtung: starke Umsetzungsenergie und hohe soziale Beweglichkeit wechseln sich je nach Situation ab.`,
    H_NEAR_S: `${cand} zeigt eine Doppelausrichtung: Umsetzungskraft und Strukturorientierung stehen fast gleichwertig nebeneinander. Je nach Situation wird entweder schnell gehandelt oder gründlich geprüft.`,
    B_NEAR_S: `${cand} zeigt eine Doppelausrichtung: Zusammenarbeit und Struktur stehen fast gleichwertig nebeneinander. Je nach Situation wird moderiert oder geordnet.`,
    BALANCED: `${cand} zeigt ein ausgeglichenes Profil ohne klare Einseitigkeit. Das Verhalten passt sich situativ an, ist aber weniger eindeutig steuerbar.`,
  };
  return texts[c];
}

function buildSummary(role: string, cand: string, fit: string, rk: ComponentKey, ck: ComponentKey, gap: string, rt: Triad, ct: Triad, rConst: ConstellationType, cConst: ConstellationType): string {
  const rLabel = constellationLabel(rConst);
  const cLabel = constellationLabel(cConst);

  if (rk === ck && gap === "gering") {
    return `${cand} zeigt eine ${fit.toLowerCase()}e Passung für die Rolle ${role}. Die Arbeitslogik stimmt in der Grundausrichtung überein. Die Rolle erwartet ${rLabel.toLowerCase()}, ${cand} bringt ${cLabel.toLowerCase()} mit. Die Abweichung betrifft die Gewichtung der sekundären Bereiche und ist ${gap}.`;
  }

  if (gap === "hoch") {
    return `Die Arbeitslogik von ${cand} weicht deutlich von der strukturellen Anforderung der Rolle ${role} ab. Die Rolle erwartet ${rLabel.toLowerCase()}: ${constellationRoleText(rConst)} ${cand} bringt dagegen ${cLabel.toLowerCase()} mit: ${constellationCandText(cConst, cand)} Dadurch verschiebt sich die Wirkung der Rolle sichtbar.`;
  }

  return `${cand} ist für die Rolle ${role} als ${fit.toLowerCase()} einzustufen. Die Rolle erwartet ${rLabel.toLowerCase()}. ${cand} bringt ${cLabel.toLowerCase()} mit. Bei gezielter Steuerung kann die Abweichung ausgeglichen werden.`;
}

function buildDominanceShift(role: string, cand: string, rk: ComponentKey, ck: ComponentKey, rt: Triad, ct: Triad, rConst: ConstellationType, cConst: ConstellationType): string {
  if (rk === ck) {
    if (rConst === cConst) {
      return `Die Grundausrichtung stimmt überein. Sowohl die Rolle als auch ${cand} zeigen ${constellationLabel(rConst).toLowerCase()}. Im Alltag bedeutet das, dass die Grundrichtung der Arbeit passt, einzelne Situationen aber unterschiedlich angegangen werden.`;
    }
    return `Die Hauptrichtung stimmt überein, aber die Profilstruktur unterscheidet sich. Die Rolle erwartet ${constellationLabel(rConst).toLowerCase()}, ${cand} zeigt ${constellationLabel(cConst).toLowerCase()}. Die sekundären Anteile verschieben sich, was in bestimmten Situationen zu unterschiedlichem Verhalten führt.`;
  }

  const isDoubleDom = cConst.includes("NEAR") || cConst === "BALANCED";
  const roleRichText = constellationRoleText(rConst);
  const candRichText = constellationCandText(cConst, cand);

  if (isDoubleDom) {
    return `Die Rolle ${role} erwartet ${constellationLabel(rConst).toLowerCase()}: ${roleRichText} ${candRichText} Durch die Doppelausrichtung kann das Verhalten je nach Situation wechseln, was die Steuerbarkeit erschwert.`;
  }

  return `Die Rolle ${role} erwartet ${constellationLabel(rConst).toLowerCase()}: ${roleRichText} ${candRichText} Dadurch verschiebt sich die Wirkung der Position weg von ${compShort(rk)} hin zu ${compShort(ck)}.`;
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

  let controlledPressure: string;
  if (cConst === "BALANCED") {
    controlledPressure = `Wenn der Arbeitsdruck steigt, verstärkt sich bei ${cand} meist die situativ naheliegendste Arbeitslogik. Da das Profil ausgeglichen ist, gibt es keinen sehr klaren Automatismus. Die tatsächliche Reaktion hängt stärker vom Kontext und der Führung ab.`;
  } else if (cConst.includes("NEAR")) {
    controlledPressure = `Wenn der Arbeitsdruck steigt, verstärkt sich bei ${cand} meist die im Moment führende Logik. Da beide Hauptanteile fast gleich stark sind, kann die Reaktion je nach Situation unterschiedlich ausfallen. Das bedeutet: Mal wird stärker über ${compShort(pk)} gesteuert, mal über ${compShort(sk)}.`;
  } else {
    controlledPressure = `Wenn der Arbeitsdruck steigt, verstärkt sich bei ${cand} zunächst die Tendenz, ${primaryBehavior[pk]}. Das hilft, die Situation kurzfristig zu stabilisieren. Gleichzeitig steigt damit das Risiko, dass die sekundären Anteile (${compShort(sk)}) in den Hintergrund treten.`;
  }

  let uncontrolledStress: string;
  if (cConst === "BALANCED") {
    uncontrolledStress = `Wenn der Druck sehr hoch wird, kann das Verhalten von ${cand} kippen oder wechseln, weil keine sehr klare Hauptlogik trägt. Die Reaktion wird weniger vorhersagbar. Für die Führungskraft bedeutet das: Die Person braucht in Stressphasen besonders klare Orientierung und Leitplanken.`;
  } else if (d12 <= 5) {
    uncontrolledStress = `Wenn die Belastung sehr hoch wird, kann sich der Schwerpunkt bei ${cand} leicht verschieben. Die Person bleibt in ihrer Grundlogik erkennbar, nutzt aber spürbar stärker ${compShort(sk)}. ${secondaryBehavior[sk]}. Für die Führungskraft bedeutet das: Die Arbeitsweise verändert sich, aber die Grundrichtung bleibt steuerbar.`;
  } else {
    uncontrolledStress = `Wenn die Belastung sehr hoch wird und viele Anforderungen gleichzeitig auftreten, verschiebt sich das Verhalten von ${cand} deutlich. Dann tritt stärker ${compShort(sk)} in den Vordergrund. ${secondaryBehavior[sk]}. Entscheidungen werden dadurch ${secondaryDecision[sk]}. Für die Führungskraft bedeutet das: Unter starkem Stress arbeitet die Person anders als im Normalzustand. Darauf sollte man vorbereitet sein.`;
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
    buildDocumentationImpact(rk, ck, rt, ct, gapA, cand),
    buildLeadershipImpact(rk, ck, gapI, gapN, gapA, cand, fuehrungsArt),
    buildConflictImpact(rk, ck, gapI, gapN, cand),
    buildCultureImpact(rk, ck, gapI, gapN, gapA, cand),
  ];

  return areas;
}

function buildDecisionImpact(rk: ComponentKey, ck: ComponentKey, gapI: number, gapA: number, cand: string): ImpactArea {
  const sev = severity(rk === "analytisch" && ck !== "analytisch" ? gapA + 5 : Math.max(gapI, gapA));

  let roleNeed: string;
  let candidatePattern: string;
  let risk: string;

  if (rk === "analytisch") {
    roleNeed = "Die Rolle verlangt sorgfältige, planvolle und prüforientierte Entscheidungen. Bevor gehandelt wird, sollen Optionen geprüft und Risiken abgewogen werden.";
    if (ck === "impulsiv") {
      candidatePattern = `${cand} entscheidet deutlich schneller und stärker aus dem Handeln heraus. Entscheidungen werden zügig getroffen, oft noch bevor alle Informationen vorliegen.`;
      risk = "Im Alltag bedeutet das: Entscheidungen können schneller getroffen werden, aber wichtige Prüfschritte werden möglicherweise übersprungen. Gerade bei komplexeren Aufgaben kann das zu Fehlern oder Nacharbeit führen.";
    } else {
      candidatePattern = `${cand} entscheidet stärker aus dem Kontext heraus und bezieht dabei vor allem Stimmungen und Beziehungen ein. Datenbasierte Prüfung steht weniger im Vordergrund.`;
      risk = "Im Alltag bedeutet das: Entscheidungen werden von zwischenmenschlichen Faktoren geprägt statt von sachlicher Analyse. Technische Details oder Risikoabwägungen können dabei zu kurz kommen.";
    }
  } else if (rk === "impulsiv") {
    roleNeed = "Die Rolle verlangt schnelle, handlungsorientierte Entscheidungen. Tempo und klare Richtung haben Vorrang vor langer Prüfung.";
    if (ck === "analytisch") {
      candidatePattern = `${cand} prüft gründlich und braucht eine solide Datengrundlage, bevor eine Entscheidung getroffen wird. Das Tempo ist langsamer als die Rolle verlangt.`;
      risk = "Im Alltag bedeutet das: In Situationen, die schnelles Handeln erfordern, kann es zu Verzögerungen kommen. Chancen werden möglicherweise verpasst, weil die Entscheidung zu spät fällt.";
    } else {
      candidatePattern = `${cand} bezieht bei Entscheidungen stark den Kontext und die beteiligten Menschen ein. Abstimmungsprozesse dauern länger als die Rolle erlaubt.`;
      risk = "Im Alltag bedeutet das: Entscheidungen, die eigentlich sofort fallen müssten, werden durch Abstimmungsrunden verzögert. Das Umsetzungstempo der Rolle leidet darunter.";
    }
  } else {
    roleNeed = "Die Rolle verlangt Entscheidungen, die Kontext, Zusammenarbeit und zwischenmenschliche Wirkung berücksichtigen. Abstimmung im Team ist wichtiger als Geschwindigkeit.";
    if (ck === "impulsiv") {
      candidatePattern = `${cand} trifft Entscheidungen schnell und handlungsorientiert. Die Wirkung auf andere Menschen wird dabei nicht immer berücksichtigt.`;
      risk = "Im Alltag bedeutet das: Entscheidungen werden getroffen, ohne das Team ausreichend einzubinden. Betroffene fühlen sich übergangen, was langfristig die Zusammenarbeit belastet.";
    } else {
      candidatePattern = `${cand} entscheidet über Fakten und Regeln. Die zwischenmenschliche Dimension von Entscheidungen steht weniger im Fokus.`;
      risk = "Im Alltag bedeutet das: Entscheidungen sind sachlich korrekt, aber die Auswirkungen auf Motivation und Teamdynamik werden nicht ausreichend berücksichtigt.";
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
    roleNeed = "Die Rolle braucht klare Struktur, Priorisierung und verlässliche Abläufe. Arbeitsschritte müssen nachvollziehbar geplant und kontrolliert werden.";
  } else if (rt.analytisch >= 25) {
    roleNeed = "Die Rolle braucht eine grundlegende Ordnung in Abläufen und Prozessen. Aufgaben sollten strukturiert abgearbeitet werden.";
  } else {
    roleNeed = "Die Rolle erlaubt eine flexible, ergebnisorientierte Arbeitsweise. Formale Planung ist weniger wichtig als schnelle Anpassung.";
  }

  if (ct.analytisch >= 35) {
    candidatePattern = `${cand} arbeitet strukturiert mit klaren Abläufen und festen Arbeitsschritten. Planung hat hohe Priorität.`;
  } else if (ct.analytisch >= 25) {
    candidatePattern = `${cand} hat eine grundlegende Struktur in der Arbeitsweise, lässt aber Raum für situative Anpassungen.`;
  } else {
    candidatePattern = `${cand} arbeitet stark tempoorientiert und reagiert situationsbezogen. Formale Planung und Dokumentation haben geringe Priorität.`;
  }

  if (gapA >= 10 && ct.analytisch < rt.analytisch) {
    risk = `Im Alltag bedeutet das: Wenn mehrere Aufgaben gleichzeitig auftreten, wird ${cand} eher schnell entscheiden und handeln. Die Rolle verlangt jedoch, dass zuerst geprüft wird, welche Schritte notwendig sind. Wichtige Prüfschritte können verkürzt werden. Für die Führungskraft bedeutet das: Prozessklarheit muss aktiv eingefordert werden.`;
  } else if (gapA >= 10 && ct.analytisch > rt.analytisch) {
    risk = `Im Alltag bedeutet das: Aufgaben, die schnell erledigt werden könnten, werden länger geprüft als notwendig. ${cand} investiert mehr Zeit in Planung und Absicherung als die Rolle erlaubt. Das bremst das Gesamttempo der Position. Die Führungskraft sollte klare Zeitvorgaben setzen.`;
  } else {
    risk = "Im Alltag bedeutet das: Die Arbeitssteuerung passt grundsätzlich zur Rolle. Feinabstimmung kann notwendig sein, aber die Grundlogik stimmt.";
  }

  return { id: "work_structure", label: "Arbeitssteuerung", severity: sev, roleNeed, candidatePattern, risk };
}

function buildDocumentationImpact(rk: ComponentKey, ck: ComponentKey, rt: Triad, ct: Triad, gapA: number, cand: string): ImpactArea {
  const sev = severity(rt.analytisch > ct.analytisch ? gapA : Math.max(0, gapA - 10));

  let roleNeed: string;
  let candidatePattern: string;
  let risk: string;

  if (rt.analytisch >= 35) {
    roleNeed = "Die Position verlangt nachvollziehbare Dokumentation und saubere Nachweise. Entscheidungen, Prozesse und Ergebnisse müssen schriftlich festgehalten werden.";
  } else {
    roleNeed = "Die Rolle erfordert ein grundlegendes Maß an Dokumentation. Wichtige Entscheidungen sollten nachvollziehbar sein.";
  }

  if (ct.analytisch >= 35) {
    candidatePattern = `${cand} dokumentiert gründlich und systematisch. Nachvollziehbarkeit hat hohe Bedeutung.`;
  } else {
    candidatePattern = `Dokumentation hat für ${cand} keine natürliche Priorität. Die Arbeit ist stärker auf direkte Ergebnisse ausgerichtet als auf schriftliche Nachweise.`;
  }

  if (rt.analytisch > ct.analytisch && gapA >= 10) {
    risk = `Im Alltag bedeutet das: Nachvollziehbarkeit sinkt. Fehler und Abweichungen werden später sichtbar, weil Entscheidungswege nicht dokumentiert werden. Für die Führungskraft wird es schwieriger, die Arbeit von ${cand} zu überprüfen und bei Bedarf zu korrigieren. Klare Dokumentationsregeln sollten von Anfang an vereinbart werden.`;
  } else if (ct.analytisch > rt.analytisch && gapA >= 10) {
    risk = `Im Alltag bedeutet das: Die Dokumentation ist gründlicher als die Rolle verlangt. ${cand} investiert Zeit in schriftliche Nachweise, die in dieser Position nicht gebraucht werden. Die Führungskraft sollte den Dokumentationsumfang klar eingrenzen.`;
  } else {
    risk = "Im Alltag bedeutet das: Das Dokumentationsverhalten passt grundsätzlich zur Rolle. Keine wesentliche Abweichung erkennbar.";
  }

  return { id: "documentation", label: "Dokumentation", severity: sev, roleNeed, candidatePattern, risk };
}

function buildLeadershipImpact(rk: ComponentKey, ck: ComponentKey, gapI: number, gapN: number, gapA: number, cand: string, fuehrungsArt: FuehrungsArt): ImpactArea {
  const sev = severity(rk !== ck ? Math.max(gapI, gapN, gapA) * 0.7 : 0);

  let roleNeed: string;
  let candidatePattern: string;
  let risk: string;

  if (fuehrungsArt === "disziplinarisch") {
    roleNeed = rk === "analytisch"
      ? "Die Rolle trägt disziplinarische Führungsverantwortung. Führung wirkt hier über Standards, Klarheit und verlässliche Struktur. Das Team braucht konsistente Prioritäten und nachvollziehbare Entscheidungen."
      : rk === "impulsiv"
        ? "Die Rolle trägt disziplinarische Führungsverantwortung. Führung wirkt hier über Entscheidungskraft, klare Richtung und schnelle Steuerung. Das Team erwartet sichtbare Leistungsorientierung."
        : "Die Rolle trägt disziplinarische Führungsverantwortung. Führung wirkt hier über Einbindung, offene Kommunikation und Gespür für Teamdynamik. Das Team braucht Sicherheit durch persönliche Ansprache.";
  } else if (fuehrungsArt === "fachlich") {
    roleNeed = rk === "analytisch"
      ? "Die Rolle hat fachliche Führungsverantwortung. Teammitglieder suchen hier klare Einschätzung, Qualitätssicherheit und verlässliche Priorisierung. Formale Autorität ist weniger wichtig als fachliche Orientierung."
      : rk === "impulsiv"
        ? "Die Rolle hat fachliche Führungsverantwortung. Teammitglieder erwarten schnelle Orientierung, praxisnahe Entscheidungen und klare fachliche Richtung."
        : "Die Rolle hat fachliche Führungsverantwortung. Teammitglieder erwarten Dialog, fachlichen Austausch und gemeinsame Lösungsfindung.";
  } else {
    roleNeed = rk === "analytisch"
      ? "Die Rolle verlangt Orientierung über Struktur, Standards und klare Vorgaben. Die eigene Arbeitsweise wirkt als Vorbild für Qualität und Verlässlichkeit."
      : rk === "impulsiv"
        ? "Die Rolle verlangt Wirkung über Tempo, Entscheidungsstärke und direkte Umsetzung. Die eigene Arbeitsweise prägt das Umfeld durch Ergebnisorientierung."
        : "Die Rolle verlangt Wirkung über Kommunikation, Zusammenarbeit und situatives Gespür. Die eigene Arbeitsweise prägt das Umfeld durch Beziehungsarbeit.";
  }

  if (ck === "impulsiv") {
    candidatePattern = `${cand} führt eher über Tempo, direkte Ansprache und Aktivierung. Entscheidungen werden schnell kommuniziert und umgesetzt.`;
  } else if (ck === "intuitiv") {
    candidatePattern = `${cand} führt über Beziehung, Dialog und aktives Zuhören. Entscheidungen werden im Gespräch entwickelt und abgestimmt.`;
  } else {
    candidatePattern = `${cand} führt über Struktur, klare Regeln und nachvollziehbare Vorgaben. Entscheidungen werden sachlich begründet und dokumentiert.`;
  }

  if (rk !== ck) {
    const leadershipSuffix = fuehrungsArt === "disziplinarisch"
      ? " Da die Rolle disziplinarische Verantwortung trägt, wirkt sich diese Abweichung nicht nur auf Arbeitsergebnisse, sondern auch auf Führungskosten, Eskalationen und Teamstabilität aus."
      : fuehrungsArt === "fachlich"
        ? " Da die Rolle fachliche Führungsverantwortung trägt, wirkt sich die Abweichung auf die Teamklarheit und fachliche Sicherheit der Mitarbeiter aus."
        : "";

    if (rk === "analytisch" && ck === "impulsiv") {
      risk = `Im Alltag bedeutet das: Dem Team fehlen auf Dauer klare Leitlinien und verlässliche Prioritäten. Entscheidungen wirken impulsiv statt durchdacht. Mitarbeiter, die Orientierung durch Struktur brauchen, verlieren den Halt.${leadershipSuffix}`;
    } else if (rk === "analytisch" && ck === "intuitiv") {
      risk = `Im Alltag bedeutet das: Führungsentscheidungen werden stärker von Beziehungsdynamik geprägt als von fachlichen Standards. Das Team kann den Eindruck bekommen, dass persönliche Nähe wichtiger ist als Leistung.${leadershipSuffix}`;
    } else if (rk === "impulsiv" && ck === "analytisch") {
      risk = `Im Alltag bedeutet das: Das Team wartet auf klare Ansagen, die nicht schnell genug kommen. In Drucksituationen fehlt die entschlossene Führung, die das Team erwartet.${leadershipSuffix}`;
    } else if (rk === "impulsiv" && ck === "intuitiv") {
      risk = `Im Alltag bedeutet das: Statt schneller Entscheidungen wird viel abgestimmt. Das Team erwartet Tempo, bekommt aber Gesprächsrunden. In zeitkritischen Situationen kann das zu Frustration führen.${leadershipSuffix}`;
    } else if (rk === "intuitiv" && ck === "impulsiv") {
      risk = `Im Alltag bedeutet das: Mitarbeiter fühlen sich übergangen, weil Entscheidungen ohne ausreichende Einbindung getroffen werden. Beziehungsarbeit kommt zu kurz. Teamzusammenhalt kann darunter leiden.${leadershipSuffix}`;
    } else {
      risk = `Im Alltag bedeutet das: Die Führung wirkt formal und distanziert. Das Team erwartet persönliche Nähe und offene Kommunikation, bekommt aber Regeln und Prozesse.${leadershipSuffix}`;
    }
  } else {
    risk = "Der Führungsstil passt zur Rollenanforderung. Die Art, wie Orientierung gegeben wird, stimmt mit den Erwartungen des Teams überein.";
  }

  return { id: "leadership", label: "Führungswirkung", severity: sev, roleNeed, candidatePattern, risk };
}

function buildConflictImpact(rk: ComponentKey, ck: ComponentKey, gapI: number, gapN: number, cand: string): ImpactArea {
  const sev = severity(Math.max(gapI, gapN) * 0.6);

  let roleNeed: string;
  let candidatePattern: string;
  let risk: string;

  if (rk === "analytisch") {
    roleNeed = "Konflikte sollen sachlich, ruhig und präzise geklärt werden. Die Rolle verlangt faktenbasierte Auseinandersetzung, nicht emotionale Konfrontation.";
  } else if (rk === "impulsiv") {
    roleNeed = "Konflikte sollen direkt und schnell angesprochen werden. Lange Abstimmungsprozesse sind in der Rolle nicht vorgesehen.";
  } else {
    roleNeed = "Konflikte sollen über Dialog, Vermittlung und Beziehungsarbeit gelöst werden. Die Rolle verlangt ein Gespür für Stimmungen und Bedürfnisse.";
  }

  if (ck === "impulsiv") {
    candidatePattern = `${cand} geht Konflikte eher direkt und kurzfristig an. Auseinandersetzungen werden schnell auf den Punkt gebracht und entschieden.`;
  } else if (ck === "intuitiv") {
    candidatePattern = `${cand} sucht bei Konflikten Ausgleich und Kompromiss. Direkte Konfrontation wird vermieden, stattdessen wird auf Verständigung gesetzt.`;
  } else {
    candidatePattern = `${cand} klärt Konflikte über Fakten, Regeln und klare Zuständigkeiten. Emotionale Aspekte werden weniger berücksichtigt.`;
  }

  if (gapI >= 12 || gapN >= 12) {
    if (rk === "analytisch" && ck === "impulsiv") {
      risk = "Im Alltag bedeutet das: Konflikte werden schneller und direkter ausgetragen als die Rolle vorsieht. Schnelle Entscheidungen sind möglich, nachhaltige Klärung aber nicht immer gesichert. Im Team kann der Eindruck entstehen, dass Probleme nicht gründlich durchdacht werden.";
    } else if (rk === "impulsiv" && ck === "analytisch") {
      risk = "Im Alltag bedeutet das: Konflikte werden zu lange analysiert statt gelöst. In Situationen, die schnelle Klärung brauchen, verzögert sich die Lösung durch zu viel Abwägung.";
    } else if (rk === "intuitiv" && ck === "impulsiv") {
      risk = "Im Alltag bedeutet das: Konflikte werden zu schnell entschieden, ohne die Beteiligten ausreichend einzubinden. Betroffene fühlen sich nicht gehört. Das belastet die Zusammenarbeit langfristig.";
    } else {
      risk = "Im Alltag bedeutet das: Das Konfliktverhalten passt nicht zur Erwartung der Rolle. Spannungen in der Zusammenarbeit sind wahrscheinlich, weil die Art der Konfliktlösung nicht den Bedürfnissen des Umfelds entspricht.";
    }
  } else {
    risk = "Das Konfliktverhalten passt grundsätzlich zur Rolle. Kleinere Unterschiede können im Alltag auftreten, sind aber steuerbar.";
  }

  return { id: "conflict", label: "Konfliktfähigkeit", severity: sev, roleNeed, candidatePattern, risk };
}

function buildCultureImpact(rk: ComponentKey, ck: ComponentKey, gapI: number, gapN: number, gapA: number, cand: string): ImpactArea {
  const sev = severity(Math.max(gapI, gapN, gapA) * 0.5);

  let roleNeed: string;
  let candidatePattern: string;
  let risk: string;

  if (rk === "analytisch") {
    roleNeed = "Die Rolle soll Verlässlichkeit, Ruhe und nachvollziehbare Qualität fördern. Das Umfeld erwartet stabile Abläufe und planbare Ergebnisse.";
  } else if (rk === "impulsiv") {
    roleNeed = "Die Rolle soll eine leistungs- und ergebnisorientierte Kultur stärken. Tempo und Wirkung stehen im Vordergrund.";
  } else {
    roleNeed = "Die Rolle soll eine kooperative, beziehungsorientierte Kultur fördern. Zusammenhalt und gegenseitige Unterstützung prägen das Arbeitsumfeld.";
  }

  if (ck === "impulsiv") {
    candidatePattern = `${cand} prägt die Kultur stärker über Dynamik und unmittelbare Bewegung. Kurzfristig kann dadurch mehr Tempo entstehen.`;
  } else if (ck === "intuitiv") {
    candidatePattern = `${cand} fördert Teamzusammenhalt, offenen Dialog und eine einladende Arbeitsatmosphäre. Beziehungen stehen im Mittelpunkt.`;
  } else {
    candidatePattern = `${cand} stärkt Qualitätsbewusstsein, Regelklarheit und Ordnung. Die Kultur wird sachlicher und strukturierter.`;
  }

  if (rk !== ck) {
    if (rk === "analytisch" && ck === "impulsiv") {
      risk = "Im Alltag bedeutet das: Die gewünschte Stabilität in Abläufen kann verloren gehen, wenn Entscheidungen schneller getroffen werden als sie strukturell abgesichert sind. Kurzfristig entsteht Zug, langfristig kann Verlässlichkeit leiden.";
    } else if (rk === "analytisch" && ck === "intuitiv") {
      risk = "Im Alltag bedeutet das: Die Kultur verschiebt sich von sachlicher Qualität hin zu persönlicher Verbindung. Standards und Regeln können aufgeweicht werden, wenn Beziehungen wichtiger werden als Prozesse.";
    } else if (rk === "impulsiv" && ck === "analytisch") {
      risk = "Im Alltag bedeutet das: Das Tempo der Abteilung sinkt. Statt schneller Umsetzung entsteht eine Kultur der Prüfung und Absicherung. In einem dynamischen Umfeld kann das zum Wettbewerbsnachteil werden.";
    } else if (rk === "impulsiv" && ck === "intuitiv") {
      risk = "Im Alltag bedeutet das: Ergebnisorientierung weicht einer Konsenskultur. Entscheidungen werden länger diskutiert statt umgesetzt. Die Dynamik der Rolle geht verloren.";
    } else if (rk === "intuitiv" && ck === "impulsiv") {
      risk = "Im Alltag bedeutet das: Die kooperative Kultur wird durch Ergebnisorientierung verdrängt. Mitarbeiter erleben weniger persönliche Ansprache und mehr Leistungsdruck. Bindung und Motivation können sinken.";
    } else {
      risk = "Im Alltag bedeutet das: Die Kultur wird formaler und distanzierter. Persönliche Verbindung und offener Austausch nehmen ab. Das Teamgefühl kann darunter leiden.";
    }
  } else {
    risk = "Die Kulturwirkung stimmt mit der Rollenanforderung überein. Die Art, wie der Kandidat das Arbeitsumfeld prägt, passt zu den Erwartungen.";
  }

  return { id: "culture", label: "Kulturwirkung", severity: sev, roleNeed, candidatePattern, risk };
}

function buildRiskTimeline(role: string, cand: string, rk: ComponentKey, ck: ComponentKey, gap: string): RiskPhase[] {
  if (rk === ck || gap === "gering") {
    return [
      { label: "Kurzfristig", period: "0 - 3 Monate", text: "Die Einarbeitung verläuft voraussichtlich reibungslos. Die Arbeitslogik stimmt mit der Rollenanforderung überein. Die Führungskraft muss nur in Einzelfällen nachsteuern." },
      { label: "Mittelfristig", period: "3 - 12 Monate", text: "Stabile Leistung ist erwartbar. In den sekundären Bereichen können kleinere Abweichungen auftreten. Regelmäßige Zielgespräche helfen, diese frühzeitig zu erkennen." },
      { label: "Langfristig", period: "12+ Monate", text: "Eine nachhaltige Besetzung ist wahrscheinlich. Der Steuerungsbedarf bleibt gering. Halbjährliche Überprüfungen genügen, um die Passung sicherzustellen." },
    ];
  }

  const shortRisks: Record<ComponentKey, Record<ComponentKey, string>> = {
    impulsiv: {
      intuitiv: `In der Einarbeitung investiert ${cand} mehr Zeit in Abstimmung als die Rolle erlaubt. Erste Verzögerungen beim Umsetzungstempo werden sichtbar. Die Führungskraft muss aktiv Tempo einfordern.`,
      analytisch: `In der Einarbeitung werden Entscheidungen langsamer getroffen als die Rolle verlangt. ${cand} prüft mehr als nötig und verliert dabei an Geschwindigkeit. Die Führungskraft sollte klare Fristen setzen.`,
      impulsiv: "",
    },
    intuitiv: {
      impulsiv: `In der Einarbeitung treibt ${cand} schneller voran als die Rolle vorsieht. Beziehungsarbeit und Abstimmung können darunter leiden. Die Führungskraft sollte frühzeitig auf Teamfeedback achten.`,
      analytisch: `In der Einarbeitung werden formale Prozesse stärker betont als nötig. Die zwischenmenschliche Wirkung der Rolle kann in den Hintergrund treten. Die Führungskraft sollte den Fokus auf Kommunikation lenken.`,
      intuitiv: "",
    },
    analytisch: {
      impulsiv: `In der Einarbeitung entstehen erste Reibungen, weil Tempo und Arbeitslogik von ${cand} nicht zur geforderten Prüftiefe passen. Fehler und Nacharbeiten können auftreten, weil Abläufe nicht ausreichend geprüft werden. Die Führungskraft muss Qualitätsstandards aktiv einfordern.`,
      intuitiv: `In der Einarbeitung werden Entscheidungen stärker beziehungsorientiert getroffen als die Rolle vorsieht. Die strukturelle Präzision kann nachlassen. Die Führungskraft sollte klare Dokumentationserwartungen formulieren.`,
      analytisch: "",
    },
  };

  const midRisks: Record<ComponentKey, Record<ComponentKey, string>> = {
    impulsiv: {
      intuitiv: `Prioritäten, Entscheidungen und Arbeitsweise folgen zunehmend der persönlichen Beziehungslogik von ${cand}. Die Umsetzungsgeschwindigkeit sinkt weiter. Die Führungskraft muss regelmäßig Tempo und Ergebnisorientierung einfordern.`,
      analytisch: `Die Rolle wird zunehmend über Prüfung und Kontrolle gesteuert statt über Tempo. Die Dynamik der Position geht verloren. Ohne Korrektur durch die Führungskraft wird die Rolle langsamer als vorgesehen.`,
      impulsiv: "",
    },
    intuitiv: {
      impulsiv: `Die kooperative Kultur der Rolle wird durch Ergebnisorientierung verdrängt. Mitarbeiterbindung kann sinken, weil die persönliche Ansprache abnimmt. Die Führungskraft sollte gezielt Teamformate einsetzen.`,
      analytisch: `Die Rolle verliert ihren zwischenmenschlichen Charakter. Prozesse ersetzen zunehmend den persönlichen Kontakt. Das Team kann den Eindruck bekommen, dass Nähe nicht mehr gewünscht ist.`,
      intuitiv: "",
    },
    analytisch: {
      impulsiv: `Prioritäten, Entscheidungen und Arbeitsweise folgen zunehmend der persönlichen Arbeitslogik von ${cand}. Struktur und Prozessqualität werden instabil. Die Qualitätsstandards der Rolle erodieren schrittweise.`,
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
      text: midRisks[rk]?.[ck] || `Die persönliche Arbeitslogik von ${cand} prägt zunehmend die Rolle. Ohne gezielte Steuerung verschiebt sich die Wirkung der Position dauerhaft.`,
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
      text: `Die Anpassung an die Rollenanforderung ist mit hoher Wahrscheinlichkeit erreichbar. Die Grundausrichtung stimmt bereits überein. ${cand} muss lediglich in den sekundären Bereichen Feinabstimmung leisten. Bei klarer Erwartungssetzung ist das realistisch.`,
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

function buildFinal(role: string, cand: string, fit: string, control: string, rk: ComponentKey, ck: ComponentKey, fuehrungsArt: FuehrungsArt): string {
  const leadSuffix = fuehrungsArt === "disziplinarisch"
    ? ` Da die Rolle disziplinarische Führungsverantwortung trägt, wirkt sich die Abweichung nicht nur auf die eigene Arbeitsweise aus, sondern auch auf die Führungskultur und Teamstabilität.`
    : fuehrungsArt === "fachlich"
      ? ` Da die Rolle fachliche Führung beinhaltet, beeinflusst die Profilabweichung auch die fachliche Orientierung des Teams.`
      : "";

  if (fit === "Geeignet") {
    return `${cand} zeigt eine gute Passung für die Rolle ${role}. Die Arbeitslogik stimmt in der Grundausrichtung überein. Der Steuerungsbedarf ist ${control}. Eine stabile Besetzung ist unter diesen Bedingungen wahrscheinlich. Die Führungskraft sollte dennoch regelmäßig prüfen, ob die sekundären Bereiche zur Rolle passen.${leadSuffix}`;
  }
  if (fit === "Bedingt geeignet") {
    return `${cand} kann die Rolle ${role} unter Bedingungen ausfüllen. Der Steuerungsbedarf ist ${control}. Die Arbeitslogik weicht in einzelnen Bereichen von der Rollenanforderung ab, kann aber mit gezielter Führung und klarer Struktur stabilisiert werden. Die Führungskraft sollte konkrete Steuerungsmaßnahmen festlegen und den Fortschritt regelmäßig überprüfen.${leadSuffix}`;
  }
  return `${cand} zeigt eine starke Ausrichtung auf ${compDesc(ck)}, während die Rolle einen Schwerpunkt auf ${compDesc(rk)} erfordert. Die Grundpassung ist nicht gegeben. Eine stabile Besetzung wäre nur mit hohem Steuerungsaufwand möglich. Die Führungskraft sollte realistisch bewerten, ob dieser Aufwand langfristig tragbar ist.${leadSuffix}`;
}
