import type { Triad } from "./jobcheck-engine";
import { computeTeamReport } from "./team-report-engine";
import type { TeamReportResult } from "./team-report-engine";
import { computeTeamCheckV2 } from "./teamcheck-v2-engine";
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

  teamText: string;
  personText: string;
  roleType: "leadership" | "member";
  roleLabel: string;
}

export interface TeamCheckV3Input {
  roleTitle: string;
  roleLevel: string;
  taskStructure: string;
  workStyle: string;
  successFocus: string[];
  teamProfile: Triad;
  personProfile: Triad;
  candidateName: string;
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

    teamText: v2.teamText,
    personText: v2.personText,
    roleType: v2.roleType,
    roleLabel: v2.roleLabel,
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
