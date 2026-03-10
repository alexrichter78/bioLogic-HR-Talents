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
  items: string[];
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
  fuehrungsArt: FuehrungsArt = "keine"
): SollIstResult {
  const rt = normalizeTriad(roleProfile);
  const ct = normalizeTriad(candProfile);
  const rDom = dominanceModeOf(rt);
  const cDom = dominanceModeOf(ct);

  const totalGap = Math.abs(rt.impulsiv - ct.impulsiv) + Math.abs(rt.intuitiv - ct.intuitiv) + Math.abs(rt.analytisch - ct.analytisch);
  const sameDom = rDom.top1.key === cDom.top1.key;
  const geignetLimit = sameDom ? 28 : 20;
  const gapLevel: "gering" | "mittel" | "hoch" = totalGap > 40 ? "hoch" : totalGap > geignetLimit ? "mittel" : "gering";

  const secondaryFlip = sameDom && rDom.top2.key !== cDom.top2.key;
  const candSecGap = cDom.gap2;

  let fitRating: FitRating;
  let fitLabel: string;
  let fitColor: string;
  if (totalGap > 40) { fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#D64045"; }
  else if (totalGap > geignetLimit) { fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832"; }
  else { fitRating = "GEEIGNET"; fitLabel = "Geeignet"; fitColor = "#3A9A5C"; }

  if (fitLabel === "Geeignet") {
    if (secondaryFlip && candSecGap > 5) {
      fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#D64045";
    } else if (secondaryFlip) {
      fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832";
    } else if (sameDom && candSecGap <= 5) {
      fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#E5A832";
    }
  }

  const controlIntensity: "gering" | "mittel" | "hoch" = totalGap > 35 ? "hoch" : totalGap > 15 ? "mittel" : "gering";

  const rk = rDom.top1.key;
  const ck = cDom.top1.key;
  const cn = candidateName || "Die Person";

  const rConst = detectConstellation(rt);
  const cConst = detectConstellation(ct);

  const summaryText = buildSummary(roleName, cn, fitLabel, rk, ck, gapLevel, rt, ct, rConst, cConst);
  const dominanceShiftText = buildDominanceShift(roleName, cn, rk, ck, rt, ct, rConst, cConst);
  const stressBehavior = buildStressBehavior(cConst, ct, cn, gapLevel);
  const impactAreas = buildImpactAreas(rk, ck, rt, ct, cn, fuehrungsArt);
  const riskTimeline = buildRiskTimeline(roleName, cn, rk, ck, gapLevel);
  const { level: developmentLevel, label: developmentLabel, text: developmentText } = buildDevelopment(gapLevel, rk, ck, controlIntensity, cn);
  const actions = buildActions(rk, ck, gapLevel, controlIntensity);
  const integrationsplan = buildIntegrationsplan(cn, fitLabel, rk, ck, gapLevel, controlIntensity, fuehrungsArt);
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

function buildSummary(role: string, cand: string, fit: string, rk: ComponentKey, ck: ComponentKey, gap: string, rt: Triad, ct: Triad, rConst: ConstellationType, cConst: ConstellationType): string {
  const s = Subj(cand);
  if (rk === ck && gap === "gering") {
    return `${s} passt in der Grundausrichtung gut zur Rolle ${role}. Beide setzen auf dieselbe Arbeitslogik. ${constellationRoleText(rConst)} ${s} arbeitet ähnlich — kleinere Unterschiede zeigen sich vor allem in der Gewichtung der sekundären Bereiche und sind im Alltag gut steuerbar.`;
  }

  if (gap === "hoch") {
    return `${s} und die Rolle ${role} funktionieren grundlegend unterschiedlich.\n\nWas die Rolle braucht: ${constellationRoleText(rConst)}\n\nWas ${subj(cand)} mitbringt: ${constellationCandText(cConst, cand)}\n\nDiese Unterschiede wirken sich im Alltag spürbar aus — bei Entscheidungen, Arbeitsweise und Zusammenarbeit.`;
  }

  return `${s} bringt eine andere Arbeitslogik mit, als die Rolle ${role} erfordert. ${constellationRoleText(rConst)} ${s} geht dagegen anders vor: ${constellationCandText(cConst, cand)} Die Unterschiede sind erkennbar, lassen sich aber bei gezielter Führung und klaren Erwartungen im Alltag ausgleichen.`;
}

function buildDominanceShift(role: string, cand: string, rk: ComponentKey, ck: ComponentKey, rt: Triad, ct: Triad, rConst: ConstellationType, cConst: ConstellationType): string {
  const s = Subj(cand);
  if (rk === ck) {
    if (rConst === cConst) {
      return `Die Grundausrichtung stimmt überein. Sowohl die Rolle als auch ${subj(cand)} setzen auf dieselbe Arbeitslogik. Im Alltag bedeutet das, dass die Grundrichtung passt — einzelne Situationen werden aber unterschiedlich angegangen.`;
    }
    return `Die Hauptrichtung stimmt überein, aber die Gewichtung unterscheidet sich. ${constellationRoleText(rConst)} ${s} arbeitet zwar in dieselbe Richtung, gewichtet aber anders: ${constellationCandText(cConst, cand)} Das kann in bestimmten Situationen zu unterschiedlichem Verhalten führen.`;
  }

  const isDoubleDom = cConst.includes("NEAR") || cConst === "BALANCED";

  if (isDoubleDom) {
    return `${constellationRoleText(rConst)} ${s} bringt jedoch eine andere Arbeitsweise mit: ${constellationCandText(cConst, cand)} Da ${subj(cand)} zwischen zwei Ausrichtungen wechselt, ist das Verhalten weniger vorhersehbar. Für die Führungskraft bedeutet das: klare Rahmenvorgaben und regelmäßiges Feedback sind besonders wichtig.`;
  }

  return `${constellationRoleText(rConst)} ${s} arbeitet aber anders: ${constellationCandText(cConst, cand)} Dadurch verschiebt sich im Alltag der Schwerpunkt — weg von ${compShort(rk)}, hin zu ${compShort(ck)}.`;
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

  const sn = subj(cand);
  let controlledPressure: string;
  if (cConst === "BALANCED") {
    controlledPressure = `Wenn der Arbeitsdruck steigt, verstärkt sich bei ${sn} meist die situativ naheliegendste Arbeitslogik. Da das Profil ausgeglichen ist, gibt es keinen klaren Automatismus. Die tatsächliche Reaktion hängt stärker vom Kontext und der Führung ab.`;
  } else if (cConst.includes("NEAR")) {
    controlledPressure = `Wenn der Arbeitsdruck steigt, verstärkt sich bei ${sn} meist die im Moment führende Logik. Da beide Hauptanteile fast gleich stark sind, kann die Reaktion je nach Situation unterschiedlich ausfallen. Das bedeutet: Mal wird stärker über ${compShort(pk)} gesteuert, mal über ${compShort(sk)}.`;
  } else {
    controlledPressure = `Wenn der Arbeitsdruck steigt, verstärkt sich bei ${sn} zunächst die Tendenz, ${primaryBehavior[pk]}. Das hilft, die Situation kurzfristig zu stabilisieren. Gleichzeitig steigt damit das Risiko, dass die sekundären Anteile (${compShort(sk)}) in den Hintergrund treten.`;
  }

  let uncontrolledStress: string;
  if (cConst === "BALANCED") {
    uncontrolledStress = `Wenn der Druck sehr hoch wird, kann das Verhalten von ${sn} kippen oder wechseln, weil keine klare Hauptlogik trägt. Die Reaktion wird weniger vorhersagbar. Für die Führungskraft bedeutet das: ${Subj(cand)} braucht in Stressphasen besonders klare Orientierung und Leitplanken.`;
  } else if (d12 <= 5) {
    uncontrolledStress = `Wenn die Belastung sehr hoch wird, kann sich der Schwerpunkt bei ${sn} leicht verschieben. ${Subj(cand)} bleibt in der Grundlogik erkennbar, nutzt aber spürbar stärker ${compShort(sk)}. ${secondaryBehavior[sk]}. Für die Führungskraft bedeutet das: Die Arbeitsweise verändert sich, aber die Grundrichtung bleibt steuerbar.`;
  } else {
    uncontrolledStress = `Wenn die Belastung sehr hoch wird und viele Anforderungen gleichzeitig auftreten, verschiebt sich das Verhalten von ${sn} deutlich. Dann tritt stärker ${compShort(sk)} in den Vordergrund. ${secondaryBehavior[sk]}. Entscheidungen werden dadurch ${secondaryDecision[sk]}. Für die Führungskraft bedeutet das: Unter starkem Stress arbeitet ${subj(cand)} anders als im Normalzustand. Darauf sollte man vorbereitet sein.`;
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
  const s = Subj(cand);

  let roleNeed: string;
  let candidatePattern: string;
  let risk: string;

  if (rk === "analytisch") {
    roleNeed = "Sorgfältige, planvolle und prüforientierte Entscheidungen. Optionen prüfen, Risiken abwägen — erst dann handeln.";
    if (ck === "impulsiv") {
      candidatePattern = `${s} entscheidet deutlich schneller und stärker aus dem Handeln heraus — oft noch bevor alle Informationen vorliegen.`;
      risk = "Wichtige Prüfschritte können übersprungen werden. Gerade bei komplexeren Aufgaben steigt das Risiko für Fehler oder Nacharbeit.";
    } else {
      candidatePattern = `${s} entscheidet stärker aus dem Kontext heraus und bezieht vor allem Stimmungen und Beziehungen ein. Datenbasierte Prüfung steht weniger im Vordergrund.`;
      risk = "Technische Details und Risikoabwägungen können zu kurz kommen, wenn zwischenmenschliche Faktoren die Entscheidung dominieren.";
    }
  } else if (rk === "impulsiv") {
    roleNeed = "Schnelle, handlungsorientierte Entscheidungen. Tempo und klare Richtung haben Vorrang vor langer Prüfung.";
    if (ck === "analytisch") {
      candidatePattern = `${s} prüft gründlich und braucht eine solide Datengrundlage, bevor eine Entscheidung fällt. Das Tempo bleibt unter dem Rollenbedarf.`;
      risk = "In Situationen, die schnelles Handeln erfordern, entstehen Verzögerungen. Chancen werden möglicherweise verpasst, weil die Entscheidung zu spät fällt.";
    } else {
      candidatePattern = `${s} bezieht bei Entscheidungen stark den Kontext und die beteiligten Menschen ein. Abstimmungsprozesse dauern länger als die Rolle erlaubt.`;
      risk = "Entscheidungen, die sofort fallen müssten, werden durch Abstimmungsrunden verzögert. Das Umsetzungstempo leidet.";
    }
  } else {
    roleNeed = "Entscheidungen, die Kontext, Zusammenarbeit und zwischenmenschliche Wirkung berücksichtigen. Abstimmung im Team vor Geschwindigkeit.";
    if (ck === "impulsiv") {
      candidatePattern = `${s} trifft Entscheidungen schnell und handlungsorientiert. Die Wirkung auf andere wird dabei nicht immer berücksichtigt.`;
      risk = "Betroffene fühlen sich übergangen, weil Entscheidungen ohne ausreichende Einbindung fallen. Das belastet langfristig die Zusammenarbeit.";
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
    candidatePattern = `${s} hat eine grundlegende Struktur in der Arbeitsweise, lässt aber Raum für situative Anpassungen.`;
  } else {
    candidatePattern = `${s} arbeitet stark tempoorientiert und reagiert situationsbezogen. Formale Planung und Dokumentation haben geringe Priorität.`;
  }

  if (gapA >= 10 && ct.analytisch < rt.analytisch) {
    risk = `Bei parallelen Aufgaben wird ${subj(cand)} eher schnell handeln statt Schritte zu prüfen. Wichtige Prüfschritte können verkürzt werden. Die Führungskraft muss Prozessklarheit aktiv einfordern.`;
  } else if (gapA >= 10 && ct.analytisch > rt.analytisch) {
    risk = `Aufgaben werden länger geprüft als notwendig. ${s} investiert mehr Zeit in Planung und Absicherung als die Rolle erlaubt — das bremst das Gesamttempo. Klare Zeitvorgaben helfen.`;
  } else {
    risk = "Arbeitssteuerung passt grundsätzlich zur Rolle. Feinabstimmung kann notwendig sein, aber die Grundlogik stimmt.";
  }

  return { id: "work_structure", label: "Arbeitssteuerung", severity: sev, roleNeed, candidatePattern, risk };
}

function buildDocumentationImpact(rk: ComponentKey, ck: ComponentKey, rt: Triad, ct: Triad, gapA: number, cand: string): ImpactArea {
  const sev = severity(rt.analytisch > ct.analytisch ? gapA : Math.max(0, gapA - 10));

  let roleNeed: string;
  let candidatePattern: string;
  let risk: string;

  if (rt.analytisch >= 35) {
    roleNeed = "Nachvollziehbare Dokumentation und saubere Nachweise. Entscheidungen, Prozesse und Ergebnisse schriftlich festhalten.";
  } else {
    roleNeed = "Grundlegendes Maß an Dokumentation. Wichtige Entscheidungen nachvollziehbar halten.";
  }

  const s = Subj(cand);
  if (ct.analytisch >= 35) {
    candidatePattern = `${s} dokumentiert gründlich und systematisch. Nachvollziehbarkeit hat hohe Bedeutung.`;
  } else {
    candidatePattern = `Dokumentation hat für ${subj(cand)} keine natürliche Priorität. Der Fokus liegt auf direkten Ergebnissen statt auf schriftlichen Nachweisen.`;
  }

  if (rt.analytisch > ct.analytisch && gapA >= 10) {
    risk = `Nachvollziehbarkeit sinkt. Fehler und Abweichungen werden später sichtbar, weil Entscheidungswege nicht dokumentiert werden. Die Führungskraft kann die Arbeit von ${subj(cand)} schwerer überprüfen. Klare Dokumentationsregeln von Anfang an vereinbaren.`;
  } else if (ct.analytisch > rt.analytisch && gapA >= 10) {
    risk = `Dokumentation ist gründlicher als nötig. ${s} investiert Zeit in Nachweise, die in dieser Position nicht gebraucht werden. Den Dokumentationsumfang klar eingrenzen.`;
  } else {
    risk = "Dokumentationsverhalten passt grundsätzlich zur Rolle. Keine wesentliche Abweichung erkennbar.";
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
      risk = `Dem Team fehlen klare Leitlinien und verlässliche Prioritäten. Entscheidungen wirken impulsiv statt durchdacht — struktursuchende Mitarbeiter verlieren den Halt.${leadershipSuffix}`;
    } else if (rk === "analytisch" && ck === "intuitiv") {
      risk = `Führungsentscheidungen werden stärker von Beziehungsdynamik geprägt als von fachlichen Standards. Es kann der Eindruck entstehen, dass persönliche Nähe wichtiger ist als Leistung.${leadershipSuffix}`;
    } else if (rk === "impulsiv" && ck === "analytisch") {
      risk = `Das Team wartet auf klare Ansagen, die nicht schnell genug kommen. In Drucksituationen fehlt die entschlossene Führung, die erwartet wird.${leadershipSuffix}`;
    } else if (rk === "impulsiv" && ck === "intuitiv") {
      risk = `Statt schneller Entscheidungen wird abgestimmt. Das Team erwartet Tempo, bekommt Gesprächsrunden. Zeitkritische Situationen erzeugen Frustration.${leadershipSuffix}`;
    } else if (rk === "intuitiv" && ck === "impulsiv") {
      risk = `Mitarbeiter fühlen sich übergangen — Entscheidungen fallen ohne ausreichende Einbindung. Beziehungsarbeit kommt zu kurz, Teamzusammenhalt leidet.${leadershipSuffix}`;
    } else {
      risk = `Führung wirkt formal und distanziert. Erwartet werden persönliche Nähe und offene Kommunikation — geliefert werden Regeln und Prozesse.${leadershipSuffix}`;
    }
  } else {
    risk = "Führungsstil passt zur Rollenanforderung. Die Art, wie Orientierung gegeben wird, stimmt mit den Erwartungen des Teams überein.";
  }

  return { id: "leadership", label: "Führungswirkung", severity: sev, roleNeed, candidatePattern, risk };
}

function buildConflictImpact(rk: ComponentKey, ck: ComponentKey, gapI: number, gapN: number, cand: string): ImpactArea {
  const sev = severity(Math.max(gapI, gapN) * 0.6);

  let roleNeed: string;
  let candidatePattern: string;
  let risk: string;

  if (rk === "analytisch") {
    roleNeed = "Sachliche, ruhige und präzise Konfliktklärung. Faktenbasierte Auseinandersetzung statt emotionaler Konfrontation.";
  } else if (rk === "impulsiv") {
    roleNeed = "Direkte und schnelle Konfliktansprache. Kein Raum für lange Abstimmungsprozesse.";
  } else {
    roleNeed = "Konfliktlösung über Dialog, Vermittlung und Beziehungsarbeit. Gespür für Stimmungen und Bedürfnisse gefragt.";
  }

  const s = Subj(cand);
  if (ck === "impulsiv") {
    candidatePattern = `${s} geht Konflikte direkt und kurzfristig an. Auseinandersetzungen werden schnell auf den Punkt gebracht.`;
  } else if (ck === "intuitiv") {
    candidatePattern = `${s} sucht bei Konflikten Ausgleich und Kompromiss. Direkte Konfrontation wird vermieden.`;
  } else {
    candidatePattern = `${s} klärt Konflikte über Fakten, Regeln und klare Zuständigkeiten. Emotionale Aspekte bleiben untergeordnet.`;
  }

  if (gapI >= 12 || gapN >= 12) {
    if (rk === "analytisch" && ck === "impulsiv") {
      risk = "Konflikte werden schneller und direkter ausgetragen als vorgesehen. Schnelle Klärung möglich, aber nachhaltige Lösung nicht gesichert — Probleme wirken nicht gründlich durchdacht.";
    } else if (rk === "impulsiv" && ck === "analytisch") {
      risk = "Konflikte werden zu lange analysiert statt gelöst. Wo schnelle Klärung gebraucht wird, verzögert sich die Lösung durch zu viel Abwägung.";
    } else if (rk === "intuitiv" && ck === "impulsiv") {
      risk = "Konflikte werden zu schnell entschieden, ohne Beteiligte einzubinden. Betroffene fühlen sich nicht gehört — das belastet die Zusammenarbeit langfristig.";
    } else {
      risk = "Konfliktverhalten passt nicht zur Rollenerwartung. Spannungen wahrscheinlich, weil die Art der Konfliktlösung nicht den Bedürfnissen des Umfelds entspricht.";
    }
  } else {
    risk = "Konfliktverhalten passt grundsätzlich zur Rolle. Kleinere Unterschiede steuerbar.";
  }

  return { id: "conflict", label: "Konfliktfähigkeit", severity: sev, roleNeed, candidatePattern, risk };
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
      risk = "Stabilität in Abläufen kann verloren gehen, wenn Entscheidungen schneller fallen als sie strukturell abgesichert sind. Kurzfristig entsteht Zug, langfristig leidet Verlässlichkeit.";
    } else if (rk === "analytisch" && ck === "intuitiv") {
      risk = "Die Kultur verschiebt sich von sachlicher Qualität hin zu persönlicher Verbindung. Standards und Regeln können aufweichen, wenn Beziehungen wichtiger werden als Prozesse.";
    } else if (rk === "impulsiv" && ck === "analytisch") {
      risk = "Das Tempo sinkt. Statt schneller Umsetzung entsteht eine Kultur der Prüfung und Absicherung — in einem dynamischen Umfeld ein Wettbewerbsnachteil.";
    } else if (rk === "impulsiv" && ck === "intuitiv") {
      risk = "Ergebnisorientierung weicht einer Konsenskultur. Entscheidungen werden diskutiert statt umgesetzt. Die Dynamik der Rolle geht verloren.";
    } else if (rk === "intuitiv" && ck === "impulsiv") {
      risk = "Kooperative Kultur wird durch Ergebnisorientierung verdrängt. Weniger persönliche Ansprache, mehr Leistungsdruck — Bindung und Motivation können sinken.";
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
      { label: "Mittelfristig", period: "3 - 12 Monate", text: "Stabile Leistung ist erwartbar. In den sekundären Bereichen können kleinere Abweichungen auftreten. Regelmäßige Zielgespräche helfen, diese frühzeitig zu erkennen." },
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
      impulsiv: `In der Einarbeitung treibt ${subj(cand)} schneller voran als die Rolle vorsieht. Beziehungsarbeit und Abstimmung können darunter leiden. Die Führungskraft sollte frühzeitig auf Teamfeedback achten.`,
      analytisch: `In der Einarbeitung werden formale Prozesse stärker betont als nötig. Die zwischenmenschliche Wirkung der Rolle kann in den Hintergrund treten. Die Führungskraft sollte den Fokus auf Kommunikation lenken.`,
      intuitiv: "",
    },
    analytisch: {
      impulsiv: `In der Einarbeitung entstehen erste Reibungen, weil Tempo und Arbeitslogik von ${subj(cand)} nicht zur geforderten Prüftiefe passen. Fehler und Nacharbeiten können auftreten, weil Abläufe nicht ausreichend geprüft werden. Die Führungskraft muss Qualitätsstandards aktiv einfordern.`,
      intuitiv: `In der Einarbeitung werden Entscheidungen stärker beziehungsorientiert getroffen als die Rolle vorsieht. Die strukturelle Präzision kann nachlassen. Die Führungskraft sollte klare Dokumentationserwartungen formulieren.`,
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

function buildIntegrationsplan(cand: string, fit: string, rk: ComponentKey, ck: ComponentKey, gap: string, control: string, fuehrungsArt: FuehrungsArt): IntegrationPhase[] | null {
  if (fit === "Nicht geeignet") return null;

  const rkDesc = compDesc(rk);
  const ckDesc = compDesc(ck);
  const sameDom = rk === ck;
  const isLeader = fuehrungsArt !== "keine";

  const phase1Items: string[] = [];
  const phase2Items: string[] = [];
  const phase3Items: string[] = [];

  if (sameDom && gap === "gering") {
    phase1Items.push(`Klärung von Rolle, Erwartungshaltung und Qualitätsstandard.`);
    phase1Items.push(`Transparenz über bestehende Entscheidungs- und Kommunikationsstrukturen.`);
    phase1Items.push(`Abstimmung der individuellen Arbeitsprioritäten mit dem Team.`);
    if (isLeader) phase1Items.push(`Führungsrolle und Verantwortungsrahmen klar definieren.`);

    phase2Items.push(`Eigenständige Übernahme erster Arbeitspakete mit Ergebnisprüfung.`);
    phase2Items.push(`Feedback zur Wirkung auf Tempo, Qualität und Zusammenarbeit aktiv einholen.`);
    if (isLeader) phase2Items.push(`Erste Führungsentscheidungen beobachten und reflektieren.`);
    phase2Items.push(`Schnittstellenarbeit mit angrenzenden Bereichen etablieren.`);

    phase3Items.push(`Evaluation der bisherigen Wirkung auf Entscheidungsrhythmus und Belastung.`);
    phase3Items.push(`Feinabstimmung der Zusammenarbeit mit dem direkten Umfeld.`);
    phase3Items.push(`Prioritäten konsolidieren und Standards stabilisieren.`);
    if (isLeader) phase3Items.push(`Führungswirkung und Teamstabilität überprüfen.`);
  } else {
    if (rk === "analytisch" && ck !== "analytisch") {
      phase1Items.push(`Klärung von Rolle, Erwartungshaltung und Qualitätsstandard.`);
      phase1Items.push(`Transparenz über bestehende Entscheidungs- und Kommunikationsstrukturen.`);
      phase1Items.push(`Frühe Abstimmung von Prioritäten, Qualitätskriterien und Entscheidungslogik.`);
      phase1Items.push(`Klärung operativer Prozesse, Schnittstellen und Definition von 'Done'.`);

      phase2Items.push(`Ein priorisiertes Thema wird strukturiert analysiert und verbessert.`);
      phase2Items.push(`Feedback zur Wirkung auf Tempo, Qualität und Zusammenarbeit wird aktiv eingeholt.`);
      phase2Items.push(`Ein klarer Standard (Checkliste/Playbook) wird eingeführt oder geschärft.`);
      phase2Items.push(`Fehlerquellen identifizieren und beheben.`);

      phase3Items.push(`Evaluation der Wirkung auf Entscheidungsrhythmus, Priorisierung und Belastung.`);
      phase3Items.push(`Anpassung von Regeln, Schnittstellen und Qualitätsstandards.`);
      phase3Items.push(`Prioritäten konsolidieren und Standards stabilisieren.`);
      phase3Items.push(`Prozessstabilität und Durchlaufzeiten prüfen.`);
    } else if (rk === "impulsiv" && ck !== "impulsiv") {
      phase1Items.push(`Erwartungen an Tempo, Entscheidungsgeschwindigkeit und Ergebnisorientierung klären.`);
      phase1Items.push(`Klare Umsetzungsfristen und Deadlines für die ersten Aufgaben definieren.`);
      phase1Items.push(`Verantwortungsbereiche und Entscheidungsfreiräume klar abgrenzen.`);
      if (isLeader) phase1Items.push(`Führungsstil und gewünschte Reaktionszeiten transparent machen.`);

      phase2Items.push(`Erste eigenverantwortliche Umsetzungsprojekte mit messbaren Zielen starten.`);
      phase2Items.push(`Entscheidungsgeschwindigkeit und Ergebnisorientierung beobachten und steuern.`);
      phase2Items.push(`Feedbackschleifen verkürzen, schnelle Rückmeldungen etablieren.`);
      phase2Items.push(`Priorisierung zwischen Schnelligkeit und Sorgfalt kalibrieren.`);

      phase3Items.push(`Ergebnisqualität und Tempo über die ersten 30 Tage auswerten.`);
      phase3Items.push(`Nachsteuerung bei Übertaktung oder Unterforderung.`);
      phase3Items.push(`Umsetzungserfolge sichtbar machen und verankern.`);
      phase3Items.push(`Langfristige KPIs und Meilensteine definieren.`);
    } else if (rk === "intuitiv" && ck !== "intuitiv") {
      phase1Items.push(`Kommunikationserwartungen und Teamkultur transparent machen.`);
      phase1Items.push(`Beziehungsaufbau mit Schlüsselpersonen aktiv einplanen.`);
      phase1Items.push(`Feedback- und Gesprächsformate klären und terminieren.`);
      if (isLeader) phase1Items.push(`Erwartungen an Teamführung und Mitarbeiterentwicklung besprechen.`);

      phase2Items.push(`Regelmäßige Team-Feedbackrunden durchführen und moderieren.`);
      phase2Items.push(`Kommunikationsstil und Wirkung auf das Team reflektieren.`);
      phase2Items.push(`Beziehungsarbeit als konkretes Ziel verfolgen.`);
      phase2Items.push(`Konfliktsituationen proaktiv ansprechen und lösen.`);

      phase3Items.push(`Wirkung der Kommunikation auf Teamdynamik und Zusammenarbeit bewerten.`);
      phase3Items.push(`Teamzufriedenheit und Bindung erheben.`);
      phase3Items.push(`Kommunikationsstandards dauerhaft verankern.`);
      phase3Items.push(`Offene Punkte in der Beziehungsarbeit klären.`);
    } else {
      phase1Items.push(`Klärung von Rolle, Arbeitslogik und Erwartungshaltung.`);
      phase1Items.push(`Transparenz über bestehende Arbeitsweisen und Entscheidungsstrukturen.`);
      phase1Items.push(`Schnittstellenklärung mit relevanten Partnern und Bereichen.`);
      if (isLeader) phase1Items.push(`Führungsverantwortung und Entscheidungsrahmen definieren.`);

      phase2Items.push(`Erste eigenverantwortliche Arbeitspakete mit Ergebniskontrolle.`);
      phase2Items.push(`Feedback zur Wirkung in ${rkDesc} aktiv einholen.`);
      phase2Items.push(`Zusammenarbeit mit dem direkten Umfeld reflektieren.`);
      phase2Items.push(`Abgleich zwischen Ist-Arbeitsweise und Rollenanforderung.`);

      phase3Items.push(`Evaluation der bisherigen Wirkung und Zielerreichung.`);
      phase3Items.push(`Nachjustierung der Arbeitsweise Richtung ${rkDesc}.`);
      phase3Items.push(`Standards und Routinen für die Rolle dauerhaft etablieren.`);
      phase3Items.push(`Langfristige Entwicklungsziele und Meilensteine festlegen.`);
    }

    if (control === "hoch") {
      phase1Items.push(`Engmaschige Führungsbegleitung von Tag 1 sicherstellen.`);
      phase3Items.push(`Überprüfung, ob Steuerungsintensität reduziert werden kann.`);
    }
  }

  return [
    { num: 1, title: "Orientierung", period: "Tag 1\u201310", items: phase1Items },
    { num: 2, title: "Wirkung", period: "Tag 11\u201320", items: phase2Items },
    { num: 3, title: "Stabilisierung", period: "Tag 21\u201330", items: phase3Items },
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
