import type { Triad, ComponentKey } from "./jobcheck-engine";
import { computeTeamReport } from "./team-report-engine";
import type { TeamReportResult } from "./team-report-engine";
import { computeTeamCheckV2, getPrimaryKey, getSecondaryKey, componentBusinessNameFirst } from "./teamcheck-v2-engine";
import type { TeamCheckV2Result, TeamCheckV2Input, TensionItem, ImpactItem, AdviceItem } from "./teamcheck-v2-engine";

export interface V3RiskPhase {
  label: string;
  period: string;
  text: string;
}

export interface V3StressBehavior {
  controlled: string;
  uncontrolled: string;
}

export interface TeamCheckV3Result {
  roleTitle: string;
  passung: string;
  systemwirkung: string;
  teamLabel: string;
  personLabel: string;
  steuerungsaufwand: string;

  managementFazit: string;

  reasonLines: string[];

  systemwirkungText: string;

  teamProfile: Triad;
  personProfile: Triad;
  teamPersonAbweichung: number;

  tension: TensionItem[];

  impacts: ImpactItem[];
  kulturwirkung: string;

  stress: V3StressBehavior;

  riskTimeline: V3RiskPhase[];

  chances: string[];
  risks: string[];

  advice: AdviceItem[];

  strukturdiagnose: StructureDiagnosis;
  leistungswirkung: PerformanceImpact;
  integrationsfaktor: IntegrationFactor;
  alternativwirkung: string;
  integrationsrisiko: string;
  erfolgsfaktor: string;

  teamText: string;
  personText: string;
  roleType: "leadership" | "member";
  roleLabel: string;
  teamGoal: TeamGoal;
  strategicFit: "passend" | "teilweise" | "abweichend" | null;
  strategicText: string | null;
}

export interface StructureDiagnosis {
  teamDominant: string;
  personDominant: string;
  teamSecondary: string;
  personSecondary: string;
  strukturwirkung: string;
}

export interface PerformanceImpact {
  entscheidungsqualitaet: string;
  umsetzungsgeschwindigkeit: string;
  prioritaetensetzung: string;
  wirkungAufErgebnisse: string;
}

export interface IntegrationFactor {
  integrationsfaehigkeit: string;
  integrationsdauer: string;
  fuehrungsaufwand: string;
  stabilisierung: string;
}

export type TeamGoal = "umsetzung" | "analyse" | "zusammenarbeit" | null;

export interface TeamCheckV3Input {
  roleTitle: string;
  roleLevel: string;
  taskStructure: string;
  workStyle: string;
  successFocus: string[];
  teamProfile: Triad;
  personProfile: Triad;
  candidateName: string;
  teamGoal?: TeamGoal;
}

export function computeTeamCheckV3(input: TeamCheckV3Input): TeamCheckV3Result {
  const v2Input: TeamCheckV2Input = {
    roleTitle: input.roleTitle,
    roleLevel: input.roleLevel,
    taskStructure: input.taskStructure,
    workStyle: input.workStyle,
    successFocus: input.successFocus,
    teamProfile: input.teamProfile,
    personProfile: input.personProfile,
  };
  const v2 = computeTeamCheckV2(v2Input);

  const v1 = computeTeamReport(
    input.roleTitle || "Rolle",
    input.candidateName || "Person",
    input.personProfile,
    input.teamProfile,
  );

  const totalGap = Math.round(
    Math.abs(input.personProfile.impulsiv - input.teamProfile.impulsiv) +
    Math.abs(input.personProfile.intuitiv - input.teamProfile.intuitiv) +
    Math.abs(input.personProfile.analytisch - input.teamProfile.analytisch)
  );

  let steuerungsaufwand: string;
  if (v2.passung === "Passend") steuerungsaufwand = "gering";
  else if (v2.passung === "Bedingt passend") steuerungsaufwand = "mittel";
  else steuerungsaufwand = "hoch";

  const managementFazit = buildManagementFazit(v2, v1, input.roleTitle);

  const kulturwirkung = buildKulturwirkung(v2, input);

  const riskTimeline = buildRiskTimeline(v2, v1, input);

  const enrichedImpacts = mergeImpacts(v2.impacts, v1, kulturwirkung);

  const mergedReasons = mergeReasons(v2.reasons, v1);

  const strukturdiagnose = buildStrukturdiagnose(input.teamProfile, input.personProfile, v2.roleType);
  const leistungswirkung = buildLeistungswirkung(input.teamProfile, input.personProfile);
  const integrationsfaktor = buildIntegrationsfaktor(input.teamProfile, input.personProfile, v2.passung, steuerungsaufwand);
  const alternativwirkung = buildAlternativwirkung(input.teamProfile, input.personProfile);

  const validGoals: TeamGoal[] = ["umsetzung", "analyse", "zusammenarbeit"];
  const safeGoal: TeamGoal = input.teamGoal && validGoals.includes(input.teamGoal) ? input.teamGoal : null;
  const { strategicFit, strategicText } = evaluateStrategicFit(safeGoal, input.teamProfile, input.personProfile, v2.roleType);

  let integrationsrisiko: string;
  if (v2.passung === "Kritisch") {
    integrationsrisiko = strategicFit === "passend" ? "mittel" : "hoch";
  } else if (v2.passung === "Bedingt passend") {
    if (totalGap > 35) {
      integrationsrisiko = strategicFit === "passend" ? "mittel" : "mittel";
    } else {
      integrationsrisiko = strategicFit === "passend" ? "gering" : "gering";
    }
  } else {
    integrationsrisiko = "gering";
  }

  let erfolgsfaktor: string;
  if (v2.passung === "Kritisch") erfolgsfaktor = "klare Prioritäten, definierte Entscheidungswege und regelmäßige Feedbackschleifen.";
  else if (v2.passung === "Bedingt passend") erfolgsfaktor = "regelmäßige Abstimmung und gezielte Unterstützung in den ersten Monaten.";
  else erfolgsfaktor = "stabile Rahmenbedingungen und kontinuierliche Aufgabenklarheit.";

  return {
    roleTitle: input.roleTitle,
    passung: v2.passung,
    systemwirkung: v2.systemwirkung,
    teamLabel: v2.teamLabel,
    personLabel: v2.personLabel,
    steuerungsaufwand,

    managementFazit,

    reasonLines: mergedReasons,

    systemwirkungText: v2.systemwirkungText,

    teamProfile: input.teamProfile,
    personProfile: input.personProfile,
    teamPersonAbweichung: totalGap,

    tension: v2.tension,

    impacts: enrichedImpacts,
    kulturwirkung,

    stress: v2.stress,

    riskTimeline,

    chances: v2.chances,
    risks: v2.risks,

    advice: v2.advice,

    strukturdiagnose,
    leistungswirkung,
    integrationsfaktor,
    alternativwirkung,
    integrationsrisiko,
    erfolgsfaktor,

    teamText: v2.teamText,
    personText: v2.personText,
    roleType: v2.roleType,
    roleLabel: v2.roleLabel,
    teamGoal: safeGoal,
    strategicFit,
    strategicText,
  };
}

function mergeImpacts(v2Impacts: ImpactItem[], v1: TeamReportResult, kulturwirkung: string): ImpactItem[] {
  const result = [...v2Impacts];
  const existingTitles = new Set(result.map(i => i.title.toLowerCase()));

  const v1AreaMap: Record<string, string> = {
    "entscheidungslogik": "Entscheidungslogik",
    "arbeitstempo": "Arbeitstempo",
    "arbeitssteuerung": "Arbeitssteuerung",
    "teamdynamik": "Teamdynamik",
    "kommunikation": "Kommunikation",
  };
  for (const area of v1.impactAreas) {
    const normId = area.id.toLowerCase();
    const title = v1AreaMap[normId] || area.label;
    if (!existingTitles.has(title.toLowerCase())) {
      result.push({
        title,
        text: `${area.teamExpectation} ${area.candidatePattern} ${area.risk}`.trim(),
      });
      existingTitles.add(title.toLowerCase());
    }
  }

  if (!existingTitles.has("kulturwirkung")) {
    result.push({ title: "Kulturwirkung", text: kulturwirkung });
  }

  return result;
}

function mergeReasons(v2Reasons: string[], v1: TeamReportResult): string[] {
  const reasons = [...v2Reasons];

  for (const factor of v1.entscheidungsfaktoren) {
    const alreadyCovered = reasons.some(r => {
      const rLow = r.toLowerCase();
      const fLow = factor.toLowerCase();
      const words = fLow.split(/\s+/).filter(w => w.length > 4);
      return words.some(w => rLow.includes(w));
    });
    if (!alreadyCovered && reasons.length < 5) {
      reasons.push(factor);
    }
  }

  return reasons;
}

function buildManagementFazit(v2: TeamCheckV2Result, v1: TeamReportResult, roleTitle: string): string {
  const lines: string[] = [];

  if (v1.managementSummary) {
    const firstSentences = v1.managementSummary.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
    if (firstSentences.length > 20) {
      lines.push(firstSentences);
    }
  }

  if (lines.length === 0) {
    if (v2.passung === "Kritisch") {
      lines.push(`Die Besetzung weicht deutlich vom bestehenden Teamprofil ab.`);
    } else if (v2.passung === "Bedingt passend") {
      lines.push(`Die Besetzung zeigt in einigen Bereichen Abweichungen zum Teamprofil.`);
    } else {
      lines.push(`Die Besetzung passt grundsätzlich zum bestehenden Teamprofil.`);
    }
  }

  if (v2.systemwirkung === "Spannung" || v2.systemwirkung === "Transformation") {
    lines.push(`Dadurch entstehen unterschiedliche Erwartungen an Entscheidungsrhythmus, Abstimmung und Prioritätensetzung.`);
  } else if (v2.systemwirkung === "Ergänzung") {
    lines.push(`Die Besetzung bringt eine Qualität ein, die dem Team bisher fehlt.`);
  } else {
    lines.push(`Die Besetzung verstärkt das bestehende Arbeitsmuster des Teams.`);
  }

  if (v1.controlIntensity === "hoch" || v2.passung === "Kritisch") {
    lines.push(`Ohne aktive Steuerung sind Reibung, Konflikte und Leistungseinbrüche wahrscheinlich.`);
  } else if (v1.controlIntensity === "mittel" || v2.passung === "Bedingt passend") {
    lines.push(`Bei bewusster Führung kann die Konstellation produktiv wirken. Ohne Steuerung drohen wiederkehrende Spannungen.`);
  } else {
    lines.push(`Die Einbindung kann zügig erfolgen. Der Steuerungsaufwand bleibt überschaubar.`);
  }

  return lines.join(" ");
}

function buildKulturwirkung(v2: TeamCheckV2Result, input: TeamCheckV3Input): string {
  if (v2.systemwirkung === "Transformation") {
    return `Die Besetzung verändert die Teamkultur grundlegend. Bestehende Arbeitsgewohnheiten, Entscheidungsmuster und Abstimmungsroutinen werden in Frage gestellt. Das kann gewollt sein, verlangt aber klare Führung und eine transparente Veränderungskommunikation.`;
  }
  if (v2.systemwirkung === "Spannung") {
    return `Die Besetzung bringt einen anderen Arbeitsstil ein als das Team gewohnt ist. Dadurch entstehen kulturelle Reibungspunkte, die im Alltag sichtbar werden. Wichtig ist, diese Unterschiede offen zu benennen und gemeinsame Spielregeln zu verankern.`;
  }
  if (v2.systemwirkung === "Ergänzung") {
    return `Die Besetzung erweitert die Teamkultur um neue Impulse. Das kann bereichernd wirken, wenn der Beitrag anerkannt und in die bestehenden Abläufe integriert wird.`;
  }
  return `Die Besetzung fügt sich kulturell gut ein. Das bestehende Arbeitsmuster wird bestätigt und weiter stabilisiert. Gleichzeitig besteht die Gefahr, dass blinde Flecken im Team nicht adressiert werden.`;
}

function buildRiskTimeline(v2: TeamCheckV2Result, v1: TeamReportResult, _input: TeamCheckV3Input): V3RiskPhase[] {
  if (v1.riskTimeline && v1.riskTimeline.length >= 3) {
    return v1.riskTimeline.map(p => ({
      label: p.label,
      period: p.period,
      text: p.text,
    }));
  }

  const phases: V3RiskPhase[] = [];

  if (v2.passung === "Kritisch") {
    phases.push({
      label: "Erste Reibungen",
      period: "0–3 Monate",
      text: "Unterschiedliche Arbeitslogiken werden sichtbar. Erwartungsunterschiede an Geschwindigkeit, Abstimmungstiefe und Entscheidungsstil führen zu ersten Konflikten. Ohne frühzeitige Klärung verfestigen sich Muster.",
    });
    phases.push({
      label: "Konflikt oder Anpassung",
      period: "3–12 Monate",
      text: "Die Konstellation entscheidet sich: Entweder werden Unterschiede aktiv gesteuert und produktiv genutzt, oder es entsteht eine dauerhafte Reibungsfläche mit wiederkehrenden Konflikten und sinkendem Engagement.",
    });
    phases.push({
      label: "Kulturverschiebung",
      period: "12+ Monate",
      text: "Langfristig beeinflusst die Besetzung das Arbeitsmuster des gesamten Teams. Das kann eine bewusste Weiterentwicklung sein, aber auch zu schleichendem Kulturkonflikt und Fluktuation führen.",
    });
  } else if (v2.passung === "Bedingt passend") {
    phases.push({
      label: "Orientierungsphase",
      period: "0–3 Monate",
      text: "Kleine Unterschiede im Arbeitsstil werden spürbar. Die Besetzung muss sich auf die Teamlogik einstellen, das Team auf die neuen Impulse. In dieser Phase ist aktive Begleitung wichtig.",
    });
    phases.push({
      label: "Konsolidierung",
      period: "3–12 Monate",
      text: "Bei guter Steuerung stabilisiert sich die Zusammenarbeit. Ohne Begleitung bleiben Reibungspunkte bestehen und können sich zu wiederkehrenden Spannungen entwickeln.",
    });
    phases.push({
      label: "Langfristige Wirkung",
      period: "12+ Monate",
      text: "Die Besetzung prägt das Team nachhaltig. Die Unterschiede können das Team breiter aufstellen oder bei fehlender Steuerung zu kultureller Drift führen.",
    });
  } else {
    phases.push({
      label: "Schnelle Einbindung",
      period: "0–3 Monate",
      text: "Die Besetzung passt gut zum Arbeitsmuster des Teams. Die Eingliederung kann zügig erfolgen. Fokus sollte auf klaren Erwartungen und Rollendefinition liegen.",
    });
    phases.push({
      label: "Stabilisierung",
      period: "3–12 Monate",
      text: "Die Besetzung festigt die bestehende Teamlogik. Wichtig ist, darauf zu achten, dass das Team nicht einseitiger wird und schwächere Bereiche weiter an Gewicht verlieren.",
    });
    phases.push({
      label: "Langfristige Wirkung",
      period: "12+ Monate",
      text: "Die Besetzung stärkt das bestehende Profil dauerhaft. Das ist positiv für Stabilität, kann aber langfristig zu blinden Flecken führen.",
    });
  }

  return phases;
}

const ENTSCHEIDUNGSLOGIK: Record<ComponentKey, string> = {
  impulsiv: "unmittelbarer Wirkung und schneller Umsetzung",
  intuitiv: "Abstimmung, Einbindung und gemeinsamer Orientierung",
  analytisch: "Struktur, Genauigkeit und fundierter Analyse",
};

function buildStrukturdiagnose(teamProfile: Triad, personProfile: Triad, roleType: string): StructureDiagnosis {
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);
  const teamSecondary = getSecondaryKey(teamProfile);
  const personSecondary = getSecondaryKey(personProfile);

  const teamDom = componentBusinessNameFirst(teamPrimary);
  const personDom = componentBusinessNameFirst(personPrimary);
  const teamSec = componentBusinessNameFirst(teamSecondary);
  const personSec = componentBusinessNameFirst(personSecondary);

  let strukturwirkung: string;
  if (teamPrimary === personPrimary) {
    strukturwirkung = "Treffen gleiche Dominanzstrukturen aufeinander, verstärkt sich die bestehende Arbeitslogik. Das stärkt Stabilität und Berechenbarkeit, kann aber auch dazu führen, dass alternative Perspektiven zu wenig Beachtung finden.";
  } else {
    strukturwirkung = "Treffen unterschiedliche Dominanzstrukturen aufeinander, entsteht im Alltag häufig eine Verschiebung der Arbeitslogik. Das bedeutet nicht automatisch, dass die Konstellation problematisch ist. Unterschiede können auch eine Ergänzung darstellen. Entscheidend ist jedoch, ob die unterschiedlichen Arbeitslogiken bewusst geführt und klar eingeordnet werden.";
  }

  if (roleType === "leadership") {
    strukturwirkung += "\n\nIn einer Führungsrolle verstärkt sich diese Wirkung zusätzlich, da die Arbeitsweise der Führungskraft Prioritäten, Entscheidungswege und Arbeitsrhythmen im Team prägt.";
  }

  return {
    teamDominant: teamDom,
    personDominant: personDom,
    teamSecondary: teamSec,
    personSecondary: personSec,
    strukturwirkung,
  };
}

function buildLeistungswirkung(teamProfile: Triad, personProfile: Triad): PerformanceImpact {
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);

  const teamLogik = ENTSCHEIDUNGSLOGIK[teamPrimary];
  const personLogik = ENTSCHEIDUNGSLOGIK[personPrimary];

  const entscheidungsqualitaet = teamPrimary === personPrimary
    ? `Team und Person bewerten Entscheidungen aus einer ähnlichen Logik heraus: Beide achten stärker auf ${teamLogik}. Das erleichtert die Abstimmung und beschleunigt Entscheidungsprozesse.`
    : `Unterschiedliche Arbeitslogiken führen häufig dazu, dass Entscheidungen aus verschiedenen Perspektiven bewertet werden. Während das Team stärker auf ${teamLogik} achtet, trifft die Person Entscheidungen stärker aus ${personLogik} heraus. Dadurch können Prioritäten unterschiedlich interpretiert werden.`;

  let umsetzungsgeschwindigkeit: string;
  if (personPrimary === "impulsiv") {
    umsetzungsgeschwindigkeit = "Die Person bringt in der Regel mehr operative Bewegung in Themen. Aufgaben werden schneller angestoßen und Ergebnisse stärker eingefordert. Das kann die Leistungsdynamik im Team erhöhen, kann aber auch zu Spannungen führen, wenn Abstimmung und gemeinsame Einordnung für das Team wichtiger sind.";
  } else if (personPrimary === "analytisch") {
    umsetzungsgeschwindigkeit = "Die Person setzt stärker auf gründliche Vorbereitung und klare Strukturen, bevor Umsetzung startet. Das kann die Ergebnisqualität steigern, aber auch die Geschwindigkeit im Team verlangsamen, wenn schnelle Entscheidungen gefragt sind.";
  } else {
    umsetzungsgeschwindigkeit = "Die Person orientiert sich an Abstimmung und gemeinsamer Ausrichtung. Umsetzung erfolgt über Einbindung statt über Tempo. Das stärkt den Teamzusammenhalt, kann aber operative Geschwindigkeit reduzieren.";
  }

  let prioritaetensetzung: string;
  if (teamPrimary === personPrimary) {
    prioritaetensetzung = "Team und Person gewichten Aufgaben nach ähnlichen Kriterien. Das reduziert Reibung bei der Priorisierung und erleichtert die tägliche Zusammenarbeit.";
  } else {
    const personFokus = personPrimary === "impulsiv" ? "unmittelbarer Wirkung und Fortschritt" : personPrimary === "analytisch" ? "Genauigkeit und langfristiger Qualität" : "gemeinsamer Abstimmung und Beziehungspflege";
    const teamFokus = teamPrimary === "impulsiv" ? "schnellem Fortschritt und sichtbaren Ergebnissen" : teamPrimary === "analytisch" ? "strukturierter Planung und Qualitätskontrolle" : "gemeinsamer Abstimmung und langfristiger Stabilität";
    prioritaetensetzung = `Die Person bewertet Aufgaben möglicherweise stärker nach ${personFokus}. Das Team orientiert sich hingegen stärker an ${teamFokus}. Dadurch kann sich verändern, welche Themen im Alltag Vorrang erhalten.`;
  }

  const wirkungAufErgebnisse = teamPrimary === personPrimary
    ? "Da beide Seiten ähnliche Arbeitslogiken teilen, können Ergebnisse effizient und mit hoher Konsistenz erzielt werden. Wichtig ist, blinde Flecken bewusst zu adressieren, die durch die gemeinsame Perspektive entstehen können."
    : "Wenn die unterschiedlichen Arbeitslogiken bewusst genutzt werden, kann die Konstellation sowohl Geschwindigkeit als auch Qualität stärken. Ohne klare Abstimmung besteht jedoch das Risiko, dass Energie eher in Abstimmungsprozesse als in Ergebnisse fließt.";

  return { entscheidungsqualitaet, umsetzungsgeschwindigkeit, prioritaetensetzung, wirkungAufErgebnisse };
}

function buildIntegrationsfaktor(teamProfile: Triad, personProfile: Triad, passung: string, steuerungsaufwand: string): IntegrationFactor {
  const distance = Math.round(
    Math.abs(teamProfile.impulsiv - personProfile.impulsiv) +
    Math.abs(teamProfile.intuitiv - personProfile.intuitiv) +
    Math.abs(teamProfile.analytisch - personProfile.analytisch)
  );

  let integrationsfaehigkeit: string;
  if (passung === "Passend") {
    integrationsfaehigkeit = "Die Integration fällt voraussichtlich leicht, da die Arbeitslogiken von Team und Person gut zueinander passen. Erwartungen und Prioritäten sind von Beginn an ähnlich ausgerichtet.";
  } else if (passung === "Bedingt passend") {
    integrationsfaehigkeit = "Die Integration hängt vor allem davon ab, wie bewusst die unterschiedlichen Arbeitslogiken im Alltag geführt werden. Je klarer Erwartungen, Prioritäten und Entscheidungswege definiert sind, desto leichter gelingt die Zusammenarbeit.";
  } else {
    integrationsfaehigkeit = "Die Integration erfordert aktive Steuerung und bewusste Begleitung. Ohne klare Orientierung und regelmässige Abstimmung besteht das Risiko, dass Reibung und Frustration die Zusammenarbeit belasten.";
  }

  let integrationsdauer: string;
  if (distance <= 20) {
    integrationsdauer = "Bei dieser Profilkonstellation kann die Integration vergleichsweise schnell gelingen. Ein stabiler gemeinsamer Arbeitsrhythmus kann sich bereits innerhalb weniger Wochen entwickeln.";
  } else if (distance <= 40) {
    integrationsdauer = "Bei sichtbaren Strukturunterschieden benötigt ein Team in der Regel mehrere Monate, um einen stabilen gemeinsamen Arbeitsrhythmus zu entwickeln. In dieser Zeit sind klare Orientierung und regelmässige Abstimmung besonders wichtig.";
  } else {
    integrationsdauer = "Bei deutlichen Strukturunterschieden muss mit einer Integrationsphase von mindestens 3 bis 6 Monaten gerechnet werden. In dieser Zeit braucht es engmaschige Führung, klare Vereinbarungen und regelmässige Reflexion.";
  }

  let fuehrungsaufwand: string;
  if (steuerungsaufwand === "gering") {
    fuehrungsaufwand = "Der Führungsaufwand bleibt überschaubar. Es reicht, klare Erwartungen zu setzen und die Einarbeitung begleitend zu unterstützen.";
  } else if (steuerungsaufwand === "mittel") {
    fuehrungsaufwand = "Je stärker sich Team- und Personenprofil unterscheiden, desto wichtiger wird aktive Führung. Führung bedeutet in diesem Zusammenhang vor allem, Erwartungen zu klären, Prioritäten sichtbar zu machen und Entscheidungsprozesse transparent zu gestalten.";
  } else {
    fuehrungsaufwand = "Der Führungsaufwand ist hoch. Ohne aktive, bewusste Steuerung der unterschiedlichen Arbeitslogiken werden Spannungen und Missverständnisse im Alltag schnell zur Belastung für alle Beteiligten.";
  }

  let stabilisierung: string;
  if (passung === "Passend") {
    stabilisierung = "Eine bewusste Integration kann dazu führen, dass die bestehende Teamstabilität erhalten bleibt und gleichzeitig neue Impulse aufgenommen werden.";
  } else {
    stabilisierung = "Eine bewusste Integration kann dazu führen, dass neue Stärken in das Team eingebracht werden, ohne die bestehende Teamstabilität zu gefährden. Ohne diese bewusste Steuerung steigt das Risiko dauerhafter Spannungen im Arbeitsalltag.";
  }

  return { integrationsfaehigkeit, integrationsdauer, fuehrungsaufwand, stabilisierung };
}

function buildAlternativwirkung(teamProfile: Triad, personProfile: Triad): string {
  const personPrimary = getPrimaryKey(personProfile);
  const teamPrimary = getPrimaryKey(teamProfile);
  const personBereich = componentBusinessNameFirst(personPrimary);

  const lines: string[] = [];

  lines.push("Ohne die aktuelle Besetzung bleibt die bestehende Arbeitslogik des Teams weitgehend stabil. Entscheidungswege, Zusammenarbeit und Arbeitsrhythmus verändern sich nur geringfügig.");

  lines.push("Gleichzeitig bleiben auch bestehende Stärken und Schwächen des Teams unverändert bestehen.");

  if (teamPrimary === personPrimary) {
    lines.push(`Die neue Besetzung verstärkt die bestehende Arbeitslogik des Teams im Bereich ${personBereich}. Dadurch wird das vorhandene Muster gefestigt, aber auch einseitiger.`);
  } else {
    lines.push(`Die neue Besetzung bringt eine andere Arbeitslogik in das System ein, insbesondere im Bereich ${personBereich}. Dadurch können neue Impulse entstehen, insbesondere in Bereichen, in denen das Team bislang weniger stark ausgeprägt ist.`);
  }

  lines.push("Ob diese Veränderung zu einer nachhaltigen Verbesserung führt, hängt massgeblich davon ab, wie bewusst die unterschiedlichen Arbeitsweisen im Alltag gesteuert werden.");

  return lines.join("\n\n");
}

const GOAL_DOMINANT: Record<string, ComponentKey> = {
  umsetzung: "impulsiv",
  analyse: "analytisch",
  zusammenarbeit: "intuitiv",
};

const GOAL_LABELS: Record<string, string> = {
  umsetzung: "Umsetzung und Ergebnisse",
  analyse: "Analyse und Struktur",
  zusammenarbeit: "Zusammenarbeit und Kommunikation",
};

function evaluateStrategicFit(
  goal: TeamGoal,
  teamProfile: Triad,
  personProfile: Triad,
  roleType: "leadership" | "member",
): { strategicFit: "passend" | "teilweise" | "abweichend" | null; strategicText: string | null } {
  if (!goal) return { strategicFit: null, strategicText: null };

  const goalKey = GOAL_DOMINANT[goal];
  const goalLabel = GOAL_LABELS[goal];
  const personPrimary = getPrimaryKey(personProfile);
  const personSecondary = getSecondaryKey(personProfile);
  const teamPrimary = getPrimaryKey(teamProfile);

  const personGoalValue = personProfile[goalKey];
  const teamGoalValue = teamProfile[goalKey];
  const personDominantInGoal = personPrimary === goalKey;
  const personSecondaryInGoal = personSecondary === goalKey;
  const teamDominantInGoal = teamPrimary === goalKey;

  let strategicFit: "passend" | "teilweise" | "abweichend";
  if (personDominantInGoal) {
    strategicFit = "passend";
  } else if (personSecondaryInGoal && personGoalValue >= 30) {
    strategicFit = "teilweise";
  } else {
    strategicFit = "abweichend";
  }

  const teamAligned = teamDominantInGoal;
  const personAligned = strategicFit === "passend";

  const lines: string[] = [];

  lines.push(`Das funktionale Ziel dieser Abteilung liegt im Bereich ${goalLabel}.`);

  if (teamAligned && personAligned) {
    lines.push(`Sowohl das bestehende Teamprofil als auch die Person sind auf dieses Ziel ausgerichtet. Die Integration verstärkt die bestehende Arbeitslogik und stabilisiert die Ausrichtung des Teams.`);
  } else if (!teamAligned && personAligned) {
    lines.push(`Das Team arbeitet aktuell nicht primär in Richtung dieses Ziels. Die Person bringt jedoch genau die Arbeitsweise mit, die das funktionale Ziel erfordert. Damit schliesst sie eine strategische Lücke — auch wenn kurzfristig Anpassungsaufwand im Team entsteht.`);
    if (roleType === "leadership") {
      lines.push(`In einer Führungsrolle kann die Person als Katalysator wirken und das Team gezielt in Richtung des Funktionsziels entwickeln. Die resultierende Spannung ist dabei nicht destruktiv, sondern strategisch gewollt.`);
    } else {
      lines.push(`Als Teammitglied kann die Person neue Impulse setzen, braucht aber Rückendeckung durch die Führung, damit die veränderte Arbeitsweise nicht als Störung, sondern als gewollte Entwicklung wahrgenommen wird.`);
    }
  } else if (teamAligned && !personAligned) {
    if (strategicFit === "teilweise") {
      lines.push(`Das Team ist bereits auf das Funktionsziel ausgerichtet. Die Person bringt das Ziel als Nebenkomponente mit (${personGoalValue}%), was einen ergänzenden Beitrag leisten kann, ohne die bestehende Ausrichtung zu gefährden.`);
    } else {
      lines.push(`Das Team ist bereits auf das Funktionsziel ausgerichtet. Die Person arbeitet jedoch mit einer anderen Logik (primär ${componentBusinessNameFirst(personPrimary)}). Das kann die Teamausrichtung verwässern, wenn keine gezielte Steuerung erfolgt.`);
    }
  } else {
    if (strategicFit === "teilweise") {
      lines.push(`Weder das bestehende Team noch die Person sind primär auf das Funktionsziel ausgerichtet. Die Person bringt das Ziel als Nebenkomponente mit (${personGoalValue}%), was einen begrenzten Beitrag in diese Richtung leisten kann.`);
    } else {
      lines.push(`Weder das bestehende Team noch die Person sind auf das Funktionsziel ${goalLabel} ausgerichtet. Die Integration verändert die Teamdynamik, bewegt sie aber nicht in Richtung des gewünschten Ziels.`);
    }
  }

  if (!teamAligned && personAligned) {
    const gap = Math.abs(teamGoalValue - personGoalValue);
    if (gap > 20) {
      lines.push(`Der Unterschied zwischen Team und Person im Zielbereich beträgt ${gap} Prozentpunkte. Diese Differenz erzeugt Spannung, ist aber im Kontext des Funktionsziels als konstruktiv einzustufen.`);
    }
  }

  return { strategicFit, strategicText: lines.join("\n\n") };
}
