import type { Triad, ComponentKey } from "./bio-types";
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
  teamGoalAbweichung: number | null;
  personGoalAbweichung: number | null;

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
  strategicWirkung: string | null;
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

const OPERATIVE_KEYWORDS = [
  "pflege", "reinigung", "raumpflege", "lager", "logistik", "montage",
  "produktion", "fertigung", "küche", "service", "hauswart", "hausdienst",
  "empfang", "rezeption", "fahrer", "transport", "handwerk", "technik",
  "werkstatt", "bau", "garten", "unterhalt", "betrieb", "maschine",
];

function isOperativeRole(roleTitle: string): boolean {
  const t = (roleTitle || "").toLowerCase();
  return OPERATIVE_KEYWORDS.some(kw => t.includes(kw));
}

function goalLabelForRole(goalLabel: string, roleTitle: string): string {
  if (!isOperativeRole(roleTitle)) return goalLabel;
  if (goalLabel === "Analyse und Struktur") return "Ordnung und Qualitätsstabilität";
  if (goalLabel === "Umsetzung und Ergebnisse") return "verlässliche Ausführung und klare Ergebnisse";
  if (goalLabel === "Zusammenarbeit und Kommunikation") return "Abstimmung und saubere Zusammenarbeit";
  return goalLabel;
}

interface GoalContext {
  goal: TeamGoal;
  goalKey: ComponentKey | null;
  goalLabel: string | null;
  teamGoalAbweichung: number | null;
  personGoalAbweichung: number | null;
  personCloserToGoal: boolean;
  personDivergesFromGoal: boolean;
  personNotHelpingGoal: boolean;
  teamAligned: boolean;
  personAligned: boolean;
  operative: boolean;
  totalGap: number;
  steuerungsaufwand: string;
  personPrimary: ComponentKey;
  teamPrimary: ComponentKey;
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

  const validGoals: TeamGoal[] = ["umsetzung", "analyse", "zusammenarbeit"];
  const safeGoal: TeamGoal = input.teamGoal && validGoals.includes(input.teamGoal) ? input.teamGoal : null;

  const goalKey = safeGoal ? GOAL_DOMINANT[safeGoal] : null;
  const rawGoalLabel = safeGoal ? GOAL_LABELS[safeGoal] : null;
  const goalLabel = rawGoalLabel ? goalLabelForRole(rawGoalLabel, input.roleTitle) : null;

  let teamGoalAbweichung: number | null = null;
  let personGoalAbweichung: number | null = null;
  if (safeGoal && goalKey) {
    const goalTriad = GOAL_TRIADS[safeGoal];
    teamGoalAbweichung = Math.round(
      Math.abs(input.teamProfile.impulsiv - goalTriad.impulsiv) +
      Math.abs(input.teamProfile.intuitiv - goalTriad.intuitiv) +
      Math.abs(input.teamProfile.analytisch - goalTriad.analytisch)
    );
    personGoalAbweichung = Math.round(
      Math.abs(input.personProfile.impulsiv - goalTriad.impulsiv) +
      Math.abs(input.personProfile.intuitiv - goalTriad.intuitiv) +
      Math.abs(input.personProfile.analytisch - goalTriad.analytisch)
    );
  }

  const operative = isOperativeRole(input.roleTitle);
  const teamAligned = goalKey ? getPrimaryKey(input.teamProfile) === goalKey : false;
  const personAligned = goalKey ? getPrimaryKey(input.personProfile) === goalKey : false;
  const personCloserToGoal = (personGoalAbweichung !== null && teamGoalAbweichung !== null) ? personGoalAbweichung < teamGoalAbweichung : false;
  const personDivergesFromGoal = !!(safeGoal && teamAligned && !personAligned);
  const personNotHelpingGoal = !!(safeGoal && !personAligned && !personCloserToGoal);

  const personPrimary = getPrimaryKey(input.personProfile);
  const teamPrimary = getPrimaryKey(input.teamProfile);

  const ctx: GoalContext = {
    goal: safeGoal,
    goalKey,
    goalLabel,
    teamGoalAbweichung,
    personGoalAbweichung,
    personCloserToGoal,
    personDivergesFromGoal,
    personNotHelpingGoal,
    teamAligned,
    personAligned,
    operative,
    totalGap,
    steuerungsaufwand,
    personPrimary,
    teamPrimary,
  };

  const { strategicFit, strategicText } = evaluateStrategicFit(safeGoal, input.teamProfile, input.personProfile, v2.roleType, ctx);

  const systemwirkungLabel = refineSystemwirkungLabel(v2.systemwirkung, ctx, strategicFit);
  const strategicWirkung = computeStrategicWirkung(ctx, strategicFit, v2.passung);

  const managementFazit = buildManagementFazit(v2, v1, input.roleTitle, ctx);
  const kulturwirkung = buildKulturwirkung(v2, input, ctx, systemwirkungLabel);
  const riskTimeline = buildRiskTimeline(v2, v1, input, ctx);
  const enrichedImpacts = mergeImpacts(v2.impacts, v1, kulturwirkung);
  const mergedReasons = mergeReasons(v2.reasons, v1, ctx);

  const strukturdiagnose = buildStrukturdiagnose(input.teamProfile, input.personProfile, v2.roleType, ctx);
  const leistungswirkung = buildLeistungswirkung(input.teamProfile, input.personProfile, ctx);
  const integrationsfaktor = buildIntegrationsfaktor(input.teamProfile, input.personProfile, v2.passung, steuerungsaufwand, ctx);
  const alternativwirkung = buildAlternativwirkung(input.teamProfile, input.personProfile, ctx);

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

  if (personNotHelpingGoal && integrationsrisiko === "gering") {
    integrationsrisiko = "mittel";
  }

  let erfolgsfaktor: string;
  if (v2.passung === "Kritisch") erfolgsfaktor = "klare Prioritäten, definierte Entscheidungswege und regelmässige Feedbackschleifen.";
  else if (v2.passung === "Bedingt passend") erfolgsfaktor = "regelmässige Abstimmung und gezielte Unterstützung in den ersten Monaten.";
  else erfolgsfaktor = "stabile Rahmenbedingungen und kontinuierliche Aufgabenklarheit.";

  const chances = buildChances(v2.chances, ctx, input.personProfile);
  const risks = buildRisks(v2.risks, ctx);
  const advice = enrichAdvice(v2.advice, ctx);

  return {
    roleTitle: input.roleTitle,
    passung: v2.passung,
    systemwirkung: systemwirkungLabel,
    teamLabel: v2.teamLabel,
    personLabel: v2.personLabel,
    steuerungsaufwand,
    managementFazit,
    reasonLines: mergedReasons,
    systemwirkungText: enrichSystemwirkungText(v2.systemwirkungText, ctx, systemwirkungLabel),
    teamProfile: input.teamProfile,
    personProfile: input.personProfile,
    teamPersonAbweichung: totalGap,
    teamGoalAbweichung,
    personGoalAbweichung,
    tension: enrichTension(v2.tension, ctx),
    impacts: enrichedImpacts,
    kulturwirkung,
    stress: v2.stress,
    riskTimeline,
    chances,
    risks,
    advice,
    strukturdiagnose,
    leistungswirkung,
    integrationsfaktor,
    alternativwirkung,
    integrationsrisiko,
    erfolgsfaktor,
    teamText: enrichTeamText(v2.teamText, ctx),
    personText: enrichPersonText(v2.personText, ctx),
    roleType: v2.roleType,
    roleLabel: v2.roleLabel,
    teamGoal: safeGoal,
    strategicFit,
    strategicText,
    strategicWirkung,
  };
}

function refineSystemwirkungLabel(base: string, ctx: GoalContext, strategicFit: "passend" | "teilweise" | "abweichend" | null): string {
  if (ctx.personDivergesFromGoal && base === "Ergänzung") {
    if (strategicFit === "abweichend") return "Kritische Spannung";
    return "Spannungsreiche Abweichung";
  }

  if (base === "Ergänzung" && ctx.totalGap >= 50) {
    if (ctx.personCloserToGoal && !ctx.teamAligned) return "Korrekturimpuls";
    return "Spannungsreiche Ergänzung";
  }
  if (base === "Ergänzung" && ctx.totalGap >= 35) {
    if (ctx.personCloserToGoal && !ctx.teamAligned) return "Strategische Ergänzung";
    return "Strategische Ergänzung";
  }
  return base;
}

function fixComponentCapitalization(text: string): string {
  return text
    .replace(/\bdialog und zwischenmenschliche wirkung\b/gi, "Dialog und zwischenmenschliche Wirkung")
    .replace(/\boperative dynamik und entscheidungsdichte\b/gi, "Operative Dynamik und Entscheidungsdichte")
    .replace(/\bzusammenarbeit und kommunikation\b/gi, "Zusammenarbeit und Kommunikation")
    .replace(/\bumsetzung und tempo\b/gi, "Umsetzung und Tempo")
    .replace(/\bordnung und sachliche prüfung\b/gi, "Ordnung und sachliche Prüfung")
    .replace(/\bhandlungsorientierung und geschwindigkeit\b/gi, "Handlungsorientierung und Geschwindigkeit")
    .replace(/\baktivität und ergebnisorientierung\b/gi, "Aktivität und Ergebnisorientierung")
    .replace(/\babstimmung und beziehungsorientierung\b/gi, "Abstimmung und Beziehungsorientierung")
    .replace(/\bsystematik und prozesssicherheit\b/gi, "Systematik und Prozesssicherheit")
    .replace(/\bnachvollziehbarkeit und qualitätsorientierung\b/gi, "Nachvollziehbarkeit und Qualitätsorientierung")
    .replace(/\bstruktur und analyse\b/gi, "Struktur und Analyse")
    .replace(/dynamik und entscheidungsdichte ist\b/gi, "Dynamik und Entscheidungsdichte sind");
}

function cleanV2BaseText(text: string, ctx: GoalContext): string {
  let cleaned = fixComponentCapitalization(text);

  if (ctx.personNotHelpingGoal) {
    cleaned = cleaned
      .replace(/Dadurch kann das Team breiter und leistungsfähiger werden\.?/g, "Dadurch entsteht ein zusätzlicher Impuls, der jedoch nicht in der primären Zielrichtung der Abteilung liegt.")
      .replace(/Das ist grundsätzlich eine Chance\.?/g, "Dieser Impuls kann punktuell hilfreich sein, muss aber im Kontext der funktionalen Ausrichtung eingeordnet werden.");
  }

  return cleaned;
}

function enrichSystemwirkungText(text: string, ctx: GoalContext, systemwirkung: string): string {
  const baseText = cleanV2BaseText(text, ctx);

  let socialLabel: string;
  if (ctx.totalGap >= 50 || ctx.steuerungsaufwand === "hoch") {
    socialLabel = "Die soziale Systemwirkung ist deutlich: Unterschiedliche Arbeitslogiken erzeugen erhöhte Reibung in Arbeitsrhythmus, Abstimmung und Erwartungshaltung.";
  } else if (ctx.totalGap >= 30 || ctx.steuerungsaufwand === "mittel") {
    socialLabel = "Die soziale Systemwirkung ist spürbar: Im Arbeitsalltag entstehen Reibungspunkte in Abstimmung und Erwartungshaltung, die aktive Steuerung erfordern.";
  } else if (systemwirkung === "Transformation" || systemwirkung === "Spannung" || systemwirkung === "Korrekturimpuls" || systemwirkung === "Spannungsreiche Ergänzung" || systemwirkung === "Kritische Spannung" || systemwirkung === "Spannungsreiche Abweichung") {
    socialLabel = "Die soziale Systemwirkung zeigt Reibungspunkte in Arbeitsrhythmus und Abstimmung.";
  } else {
    socialLabel = "Die soziale Systemwirkung ist gering: Die Besetzung fügt sich weitgehend nahtlos ein.";
  }

  if (!ctx.goal || !ctx.goalLabel) {
    return baseText + "\n\n" + socialLabel;
  }

  let functionalLabel: string;
  if (ctx.personDivergesFromGoal) {
    functionalLabel = `Funktional bringt die Besetzung keine primäre Verstärkung in Richtung ${ctx.goalLabel}. Die Person kann in Teilbereichen ergänzend wirken, unterstützt aber nicht die dominante Zielrichtung der Abteilung. Die Systemwirkung ist deshalb insgesamt spannungsreich und nur begrenzt funktional anschlussfähig.`;
  } else if (ctx.personNotHelpingGoal) {
    functionalLabel = `Funktional bringt die Besetzung keine primäre Verstärkung in Richtung ${ctx.goalLabel}. Die Wirkung auf die strategische Ausrichtung bleibt begrenzt. Die Person kann punktuell zusätzliche Qualität einbringen, unterstützt aber nicht die zentrale Zielrichtung der Abteilung.`;
  } else if (ctx.personCloserToGoal && !ctx.teamAligned) {
    functionalLabel = `Die funktionale Systemwirkung ist dagegen positiv: Die Person verstärkt genau die Wirkung, die das Ziel der Abteilung (${ctx.goalLabel}) erfordert. Soziale Reibung und funktionale Stärkung bestehen gleichzeitig und müssen als Einheit bewertet werden.`;
  } else if (ctx.personAligned && ctx.teamAligned) {
    functionalLabel = `Funktional bestätigt die Besetzung die bestehende Ausrichtung auf das Abteilungsziel (${ctx.goalLabel}). Die Wirkung ist systemstabilisierend.`;
  } else {
    functionalLabel = `Funktional bringt die Besetzung keine primäre Verstärkung in Richtung ${ctx.goalLabel}. Die Wirkung auf die strategische Ausrichtung bleibt begrenzt.`;
  }

  return baseText + "\n\n" + socialLabel + " " + functionalLabel;
}

function enrichTeamText(text: string, ctx: GoalContext): string {
  const fixed = fixComponentCapitalization(text);
  if (!ctx.goal || !ctx.goalLabel) return fixed;
  if (!ctx.teamAligned) {
    return fixed + `\n\nIm Hinblick auf das funktionale Ziel der Abteilung (${ctx.goalLabel}) bleibt das Team in diesem Bereich vergleichsweise schwächer ausgeprägt. Diese Untergewichtung kann durch eine gezielte Besetzung adressiert werden.`;
  }
  return fixed + `\n\nDas Team ist bereits auf das funktionale Ziel der Abteilung (${ctx.goalLabel}) ausgerichtet. Die bestehende Arbeitslogik unterstützt die funktionalen Anforderungen.`;
}

function enrichPersonText(text: string, ctx: GoalContext): string {
  if (!ctx.goal || !ctx.goalLabel) return fixComponentCapitalization(text);

  let adapted = fixComponentCapitalization(text);
  if (ctx.operative) {
    adapted = adapted
      .replace(/spontane Marktreaktion/g, "schnelle Reaktion auf veränderte Anforderungen")
      .replace(/gut vorbereiteten Gesprächen/g, "sorgfältiger Vorbereitung")
      .replace(/professioneller Wirkung im Gespräch/g, "verlässlicher Arbeitsqualität")
      .replace(/Netzwerkaufbau und positiver Präsenz/g, "Teamzusammenhalt und verlässlicher Abstimmung")
      .replace(/Marktreaktion/g, "Reaktion auf veränderte Anforderungen");
  }

  if (ctx.personDivergesFromGoal) {
    const personBereich = componentBusinessNameFirst(ctx.personPrimary);
    return adapted + `\n\nDie Person ist nicht primär auf das funktionale Ziel der Abteilung (${ctx.goalLabel}) ausgerichtet. Sie bringt Qualitäten im Bereich ${personBereich} mit, die punktuell nützlich sein können. Die Hauptzielrichtung der Abteilung wird dadurch jedoch nicht verstärkt, sondern bleibt auf die Steuerung durch das bestehende Team angewiesen.`;
  }

  if (ctx.personAligned && !ctx.teamAligned) {
    return adapted + `\n\nDie Arbeitsweise der Person liegt näher am funktionalen Ziel der Abteilung (${ctx.goalLabel}) als die aktuelle Teamstruktur. Damit bringt sie eine Wirkung mit, die strategisch gewünscht ist.`;
  }
  if (ctx.personAligned && ctx.teamAligned) {
    return adapted + `\n\nDie Person ist — wie das Team — auf das funktionale Ziel (${ctx.goalLabel}) ausgerichtet. Die bestehende Arbeitslogik wird durch die Besetzung weiter verstärkt.`;
  }
  if (!ctx.personAligned && ctx.personCloserToGoal) {
    return adapted + `\n\nDie Person ist nicht primär auf das funktionale Ziel der Abteilung (${ctx.goalLabel}) ausgerichtet, liegt aber strukturell näher daran als das bestehende Team. Ihr Beitrag in Richtung dieses Ziels ist begrenzt, geht aber in die richtige Richtung.`;
  }
  if (!ctx.personAligned) {
    return adapted + `\n\nDie Person ist nicht primär auf das funktionale Ziel der Abteilung (${ctx.goalLabel}) ausgerichtet. Ihr Beitrag in Richtung dieses Ziels bleibt begrenzt.`;
  }
  return adapted;
}

function enrichTension(v2Tension: TensionItem[], ctx: GoalContext): TensionItem[] {
  if (!ctx.goal || !ctx.goalKey || !ctx.goalLabel) {
    return v2Tension.map(t => ({ ...t, interpretation: fixComponentCapitalization(t.interpretation) }));
  }

  return v2Tension.map(orig => {
    const t = { ...orig, interpretation: fixComponentCapitalization(orig.interpretation) };
    const isGoalDimension = t.key === ctx.goalKey;
    const isNonGoalDimension = !isGoalDimension;
    const diff = t.personValue - t.teamValue;
    if (Math.abs(diff) < 10) return t;

    if (isNonGoalDimension && diff > 0 && ctx.personNotHelpingGoal) {
      const extraSuffix = " Dieser Veränderungsimpuls liegt jedoch nicht in der primären Zielrichtung der Abteilung und ist daher als steuerungsbedürftig einzuordnen, nicht als primäre Leistungsstärkung.";
      return { ...t, interpretation: t.interpretation + extraSuffix };
    }

    if (!isGoalDimension) return t;

    let suffix = "";
    if (diff > 0 && ctx.personAligned && !ctx.teamAligned) {
      suffix = ` Gleichzeitig liegt genau in diesem Bereich das funktionale Ziel der Abteilung (${ctx.goalLabel}), sodass die Abweichung nicht nur Spannungsquelle, sondern auch gezielte Leistungsstärkung sein kann.`;
    } else if (diff > 0 && !ctx.personAligned && ctx.personCloserToGoal) {
      suffix = ` Die Person liegt im Bereich ${ctx.goalLabel} strukturell näher am funktionalen Ziel als das Team. Der Impuls geht in die richtige Richtung, reicht aber allein nicht aus, um die Zielausrichtung zu verändern.`;
    } else if (diff < 0 && ctx.personDivergesFromGoal) {
      suffix = ` Da das funktionale Ziel der Abteilung (${ctx.goalLabel}) genau in diesem Bereich liegt, zeigt sich hier die eigentliche funktionale Lücke der Person. Die geringere Ausprägung muss aktiv adressiert werden.`;
    } else if (diff < 0 && ctx.personNotHelpingGoal) {
      suffix = ` Das funktionale Ziel der Abteilung (${ctx.goalLabel}) liegt in diesem Bereich. Die geringere Ausprägung der Person verstärkt die bestehende Lücke und muss aktiv adressiert werden.`;
    }

    if (!suffix) return t;
    return { ...t, interpretation: t.interpretation + suffix };
  });
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

function mergeReasons(v2Reasons: string[], v1: TeamReportResult, ctx: GoalContext): string[] {
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

  if (ctx.personNotHelpingGoal && ctx.goalLabel) {
    const personBereich = componentBusinessNameFirst(ctx.personPrimary);
    const alreadyMentioned = reasons.some(r => r.toLowerCase().includes("funktional") && r.toLowerCase().includes("ziel"));
    if (!alreadyMentioned) {
      reasons.push(`Die stärkere Ausprägung der Person im Bereich ${personBereich} ist nicht grundsätzlich negativ, liegt aber nicht im Zentrum des funktionalen Ziels dieser Abteilung (${ctx.goalLabel}). Die Abweichung betrifft somit Team und Funktionsziel zugleich.`);
    }
  } else if (ctx.goal && ctx.goalLabel && ctx.personCloserToGoal && !ctx.teamAligned) {
    const alreadyMentioned = reasons.some(r => r.toLowerCase().includes("funktional") && r.toLowerCase().includes("ziel"));
    if (!alreadyMentioned) {
      reasons.push(`Die Person setzt andere Schwerpunkte als das Team, arbeitet aber näher am funktionalen Ziel der Abteilung (${ctx.goalLabel}). Sie wirkt im Team zunächst fremd, bewegt sich fachlich jedoch in die richtige Richtung.`);
    }
  }

  return reasons.slice(0, 5);
}

function buildManagementFazit(v2: TeamCheckV2Result, v1: TeamReportResult, roleTitle: string, ctx: GoalContext): string {
  const lines: string[] = [];

  if (v2.passung === "Kritisch") {
    lines.push(`Die Besetzung weicht deutlich vom bestehenden Teamprofil ab. Dadurch entstehen unterschiedliche Erwartungen an Entscheidungsrhythmus, Abstimmung und Prioritätensetzung.`);
  } else if (v2.passung === "Bedingt passend") {
    lines.push(`Die Besetzung zeigt in einigen Bereichen Abweichungen zum Teamprofil. Es bestehen sowohl Übereinstimmungen als auch relevante Unterschiede in der Arbeitsweise.`);
  } else {
    lines.push(`Die Besetzung passt grundsätzlich zum bestehenden Teamprofil. Arbeitslogik, Prioritätensetzung und Abstimmungsrhythmus sind weitgehend kompatibel.`);
  }

  if (ctx.goal && ctx.goalLabel) {
    if (ctx.personDivergesFromGoal) {
      const personBereich = componentBusinessNameFirst(ctx.personPrimary);
      lines.push(`Das Team ist bereits auf das funktionale Ziel (${ctx.goalLabel}) ausgerichtet. Die Person bringt eine andere Arbeitslogik mit, insbesondere im Bereich ${personBereich}. Diese kann in Teilaspekten ergänzend wirken, verstärkt aber nicht die primäre Zielrichtung der Abteilung. Dadurch entsteht nicht nur Integrationsaufwand, sondern auch ein Risiko für die funktionale Klarheit des Systems.`);
    } else if (ctx.personCloserToGoal && !ctx.teamAligned) {
      lines.push(`Gleichzeitig entspricht die Arbeitsweise der Person dem funktionalen Ziel der Abteilung (${ctx.goalLabel}) stärker als die aktuelle Teamstruktur. Die Abweichung ist daher nicht nur als Integrationsrisiko, sondern auch als potenziell sinnvolle Weiterentwicklung des Teams zu bewerten.`);
    } else if (ctx.personAligned && ctx.teamAligned) {
      lines.push(`Sowohl das Team als auch die Person sind auf das funktionale Ziel (${ctx.goalLabel}) ausgerichtet. Die Integration stärkt die bestehende Arbeitslogik.`);
    } else if (ctx.personNotHelpingGoal) {
      const personBereich = componentBusinessNameFirst(ctx.personPrimary);
      lines.push(`Weder das Team noch die Person sind primär auf das funktionale Ziel (${ctx.goalLabel}) ausgerichtet. Die Person bringt punktuell zusätzliche Qualität im Bereich ${personBereich}, verstärkt aber nicht die zentrale Zielrichtung der Abteilung. Der Mehrwert liegt eher in Teilaspekten als in einer umfassenden Systemstärkung.`);
    }
  } else {
    if (v2.systemwirkung === "Spannung" || v2.systemwirkung === "Transformation") {
      lines.push(`Ohne aktive Steuerung sind Reibung und Abstimmungskonflikte wahrscheinlich.`);
    } else if (v2.systemwirkung === "Ergänzung") {
      lines.push(`Die Besetzung bringt eine Qualität ein, die dem Team bisher fehlt.`);
    } else {
      lines.push(`Die Einbindung kann zügig erfolgen. Der Steuerungsaufwand bleibt überschaubar.`);
    }
  }

  if (v1.controlIntensity === "hoch" || v2.passung === "Kritisch") {
    if (ctx.personNotHelpingGoal) {
      lines.push(`Ohne aktive Steuerung besteht das Risiko, dass die Abweichung die bestehende Teamlogik nicht ergänzt, sondern von ihrer eigentlichen Zielrichtung wegzieht.`);
    } else if (ctx.personCloserToGoal) {
      lines.push(`Die Führungsaufgabe liegt weniger in der Frage der fachlichen Eignung als in der bewussten Integration einer funktional sinnvollen, aber kulturell spannungsreichen Wirkung.`);
    } else {
      lines.push(`Ohne aktive Steuerung sind Reibung, wiederkehrende Spannungen und vermeidbare Leistungsverluste wahrscheinlich.`);
    }
  } else if (v1.controlIntensity === "mittel" || v2.passung === "Bedingt passend") {
    if (ctx.personNotHelpingGoal) {
      lines.push(`Bei bewusster Führung kann die Konstellation in Teilbereichen produktiv wirken. Ohne Steuerung droht eine Verschiebung der Teamausrichtung weg vom funktionalen Ziel.`);
    } else {
      lines.push(`Bei bewusster Führung kann die Konstellation produktiv wirken.`);
    }
  }

  return lines.join(" ");
}

function buildKulturwirkung(v2: TeamCheckV2Result, input: TeamCheckV3Input, ctx: GoalContext, refinedLabel: string): string {
  const goalSuffix = ctx.goal && ctx.personCloserToGoal && !ctx.teamAligned
    ? ` Gleichzeitig bringt die Besetzung genau die Arbeitsweise mit, die das funktionale Ziel der Abteilung erfordert. Die kulturelle Reibung ist damit nicht nur Belastung, sondern auch Ausdruck einer funktional sinnvollen Veränderung.`
    : "";

  const divergeSuffix = ctx.personNotHelpingGoal && ctx.goalLabel
    ? ` Die Person kann in Teilbereichen zusätzliche Qualität einbringen, unterstützt aber nicht die zentrale Zielrichtung der Abteilung (${ctx.goalLabel}). Die kulturelle Wirkung ist daher ambivalent: punktuell bereichernd, in der Gesamtlogik jedoch spannungsreich.`
    : "";

  if (v2.systemwirkung === "Transformation") {
    return `Die Besetzung verändert die Teamkultur grundlegend. Bestehende Arbeitsgewohnheiten, Entscheidungsmuster und Abstimmungsroutinen werden in Frage gestellt. Das verlangt klare Führung und transparente Veränderungskommunikation.${goalSuffix}${divergeSuffix}`;
  }
  if (v2.systemwirkung === "Spannung") {
    return `Die Besetzung bringt einen anderen Arbeitsstil ein als das Team gewohnt ist. Dadurch entstehen kulturelle Reibungspunkte, die im Alltag sichtbar werden. Entscheidend ist, diese Unterschiede offen zu benennen und gemeinsame Spielregeln zu verankern.${goalSuffix}${divergeSuffix}`;
  }
  if (v2.systemwirkung === "Ergänzung") {
    if (ctx.personNotHelpingGoal && ctx.goalLabel) {
      const personBereich = componentBusinessNameFirst(ctx.personPrimary);
      return `Die Besetzung bringt zusätzliche Qualität im Bereich ${personBereich} ins Team. Diese Wirkung kann in einzelnen Abläufen hilfreich sein. Sie verstärkt jedoch nicht die zentrale Zielrichtung der Abteilung (${ctx.goalLabel}). Die Kulturwirkung ist deshalb insgesamt spannungsreich und nur begrenzt funktional anschlussfähig.`;
    }
    if (refinedLabel === "Korrekturimpuls" || refinedLabel === "Spannungsreiche Ergänzung") {
      return `Die Besetzung erweitert die Teamkultur um deutlich andere Impulse. Obwohl sie eine funktional wichtige Lücke schliesst, ist die Reibung im Alltag spürbar und erfordert bewusste Steuerung.${goalSuffix}`;
    }
    if (refinedLabel === "Strategische Ergänzung") {
      return `Die Besetzung bringt eine ergänzende Arbeitslogik ein, die das Team in eine neue Richtung erweitern kann. Bei bewusster Führung entsteht daraus eine kulturelle Bereicherung.${goalSuffix}`;
    }
    return `Die Besetzung erweitert die Teamkultur um neue Impulse. Das kann bereichernd wirken, wenn der Beitrag anerkannt und in die bestehenden Abläufe integriert wird.${goalSuffix}`;
  }
  return `Die Besetzung fügt sich kulturell gut ein. Das bestehende Arbeitsmuster wird bestätigt und weiter stabilisiert. Gleichzeitig besteht die Gefahr, dass blinde Flecken im Team nicht adressiert werden.`;
}

function buildRiskTimeline(v2: TeamCheckV2Result, v1: TeamReportResult, _input: TeamCheckV3Input, ctx: GoalContext): V3RiskPhase[] {
  const goalPositive = ctx.goal && ctx.personCloserToGoal && !ctx.teamAligned;
  const phases: V3RiskPhase[] = [];

  if (v2.passung === "Kritisch") {
    phases.push({
      label: "Erste Reibungen",
      period: "0–3 Monate",
      text: goalPositive
        ? "Unterschiedliche Arbeitslogiken werden sichtbar. Die Person setzt andere Schwerpunkte als das Team. Diese Unterschiede können zunächst als Irritation wahrgenommen werden. Da die Person näher am funktionalen Ziel arbeitet, ist eine frühzeitige Einordnung dieser Wirkung durch die Führung entscheidend."
        : ctx.personNotHelpingGoal
        ? "Unterschiedliche Arbeitslogiken werden sichtbar. Die Person setzt andere Schwerpunkte als das Team, und diese liegen nicht in der primären Zielrichtung der Abteilung. Ohne frühzeitige Klärung verfestigen sich Muster, die das Team von seiner funktionalen Ausrichtung wegziehen können."
        : "Unterschiedliche Arbeitslogiken werden sichtbar. Erwartungsunterschiede an Geschwindigkeit, Abstimmungstiefe und Entscheidungsstil führen zu ersten Konflikten. Ohne frühzeitige Klärung verfestigen sich Muster.",
    });
    phases.push({
      label: "Einordnung oder Konflikt",
      period: "3–12 Monate",
      text: goalPositive
        ? "Die Konstellation entscheidet sich: Werden die Unterschiede als gezielte Weiterentwicklung in Richtung des Funktionsziels eingeordnet und aktiv geführt, entsteht funktionale Wirksamkeit. Ohne diese Einordnung droht eine dauerhafte Reibungsfläche."
        : ctx.personNotHelpingGoal
        ? "Die Konstellation entscheidet sich: Entweder werden die Teilqualitäten der Person gezielt genutzt und klar vom Hauptziel abgegrenzt, oder die Abweichung erzeugt eine dauerhafte Reibungsfläche mit dem Risiko einer schleichenden Zielverschiebung."
        : "Entweder werden Unterschiede aktiv gesteuert und produktiv genutzt, oder es entsteht eine dauerhafte Reibungsfläche mit wiederkehrenden Konflikten und sinkendem Engagement.",
    });
    phases.push({
      label: "Weiterentwicklung oder Drift",
      period: "12+ Monate",
      text: goalPositive
        ? "Bei erfolgreicher Integration entwickelt die Besetzung das Team langfristig in Richtung des funktionalen Ziels weiter. Die anfängliche Spannung weicht einer leistungsfähigeren Struktur. Ohne Steuerung bleibt das Risiko eines dauerhaften Kulturkonflikts."
        : ctx.personNotHelpingGoal
        ? "Langfristig beeinflusst die Besetzung das Arbeitsmuster des Teams. Ohne Steuerung kann die bestehende funktionale Ausrichtung verwässern. Bei gezielter Führung können die Teilqualitäten der Person als Zusatzressource genutzt werden, ohne die Hauptzielrichtung zu verändern."
        : "Langfristig beeinflusst die Besetzung das Arbeitsmuster des gesamten Teams. Das kann eine bewusste Weiterentwicklung sein, aber auch zu schleichendem Kulturkonflikt und Fluktuation führen.",
    });
  } else if (v2.passung === "Bedingt passend") {
    phases.push({
      label: "Orientierungsphase",
      period: "0–3 Monate",
      text: goalPositive
        ? "Unterschiede im Arbeitsstil werden spürbar. Die Person bringt Impulse mit, die näher am Funktionsziel liegen als die bestehende Teamstruktur. Aktive Begleitung hilft, die Wirkung richtig einzuordnen."
        : ctx.personNotHelpingGoal
        ? "Unterschiede im Arbeitsstil werden spürbar. Die Person bringt andere Schwerpunkte ein, die nicht in der primären Zielrichtung der Abteilung liegen. Aktive Begleitung ist wichtig, damit die Teilqualitäten gezielt genutzt und richtig eingeordnet werden."
        : "Unterschiede im Arbeitsstil werden spürbar. Die Besetzung muss sich auf die Teamlogik einstellen, das Team auf die neuen Impulse. In dieser Phase ist aktive Begleitung wichtig.",
    });
    phases.push({
      label: "Konsolidierung",
      period: "3–12 Monate",
      text: ctx.personNotHelpingGoal
        ? "Bei guter Steuerung stabilisiert sich die Zusammenarbeit, und die Teilqualitäten der Person können gezielt eingesetzt werden. Ohne Begleitung besteht das Risiko, dass die Teamausrichtung schleichend vom funktionalen Ziel abdriftet."
        : "Bei guter Steuerung stabilisiert sich die Zusammenarbeit. Ohne Begleitung bleiben Reibungspunkte bestehen und können sich zu wiederkehrenden Spannungen entwickeln.",
    });
    phases.push({
      label: "Langfristige Wirkung",
      period: "12+ Monate",
      text: goalPositive
        ? "Die Besetzung prägt das Team nachhaltig und kann die Ausrichtung in Richtung des funktionalen Ziels stärken. Bei fehlender Steuerung bleiben die Unterschiede als ungelöste Spannungsquelle bestehen."
        : ctx.personNotHelpingGoal
        ? "Die Besetzung prägt das Team nachhaltig. Die Teilqualitäten können bei gezielter Steuerung als Zusatzstärke wirken. Ohne Führung besteht das Risiko, dass die bestehende Zielausrichtung an Klarheit verliert."
        : "Die Besetzung prägt das Team nachhaltig. Die Unterschiede können das Team breiter aufstellen oder bei fehlender Steuerung zu einer schleichenden Verschiebung der Teamkultur führen.",
    });
  } else {
    phases.push({
      label: "Schnelle Einbindung",
      period: "0–3 Monate",
      text: "Die Besetzung passt gut zum Arbeitsmuster des Teams. Die Eingliederung kann zügig erfolgen. Der Fokus sollte auf klaren Erwartungen und Rollendefinition liegen.",
    });
    phases.push({
      label: "Stabilisierung",
      period: "3–12 Monate",
      text: "Die Besetzung festigt die bestehende Teamlogik. Wichtig ist, darauf zu achten, dass schwächere Bereiche nicht weiter an Gewicht verlieren.",
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

function buildStrukturdiagnose(teamProfile: Triad, personProfile: Triad, roleType: string, ctx: GoalContext): StructureDiagnosis {
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
    strukturwirkung = "Gleiche Dominanzstrukturen verstärken die bestehende Arbeitslogik. Das stärkt Stabilität und Berechenbarkeit, kann aber dazu führen, dass alternative Perspektiven zu wenig Beachtung finden.";
  } else {
    strukturwirkung = "Unterschiedliche Dominanzstrukturen erzeugen im Alltag eine Verschiebung der Arbeitslogik. Das ist nicht automatisch problematisch — Unterschiede können auch eine Ergänzung darstellen. Entscheidend ist, ob die verschiedenen Arbeitslogiken bewusst geführt und klar eingeordnet werden.";
  }

  if (ctx.goal && ctx.goalLabel && ctx.goalKey) {
    if (ctx.personDivergesFromGoal) {
      strukturwirkung += `\n\nDas Team ist bereits auf das funktionale Ziel (${ctx.goalLabel}) ausgerichtet. Die Person bringt eine andere Dominanz mit (${personDom}), die nicht in der primären Zielrichtung liegt. Dadurch kann die bestehende Ausrichtung verwässert werden, wenn die Unterschiede nicht bewusst gesteuert werden.`;
    } else if (!ctx.teamAligned && ctx.personAligned) {
      strukturwirkung += `\n\nIm Verhältnis zum funktionalen Ziel (${ctx.goalLabel}) zeigt das Team eine Untergewichtung. Die Person schliesst diese Lücke strukturell.`;
    } else if (ctx.teamAligned && ctx.personAligned) {
      strukturwirkung += `\n\nSowohl das Team als auch die Person sind auf das funktionale Ziel (${ctx.goalLabel}) ausgerichtet. Die Besetzung stärkt die bestehende Ausrichtung strukturell.`;
    } else if (!ctx.personAligned && ctx.personCloserToGoal) {
      strukturwirkung += `\n\nWeder das Team noch die Person sind primär auf das funktionale Ziel (${ctx.goalLabel}) ausgerichtet. Die Person liegt jedoch strukturell näher daran als das Team. Die Besetzung bewegt das System in die richtige Richtung, ohne die Lücke vollständig zu schliessen.`;
    } else if (ctx.personNotHelpingGoal) {
      strukturwirkung += `\n\nWeder das Team noch die Person sind primär auf das funktionale Ziel (${ctx.goalLabel}) ausgerichtet. Die Person bringt eine andere Dominanz mit (${personDom}), die nicht in der primären Zielrichtung liegt. Der strukturelle Beitrag zum Funktionsziel bleibt begrenzt.`;
    }
  }

  if (roleType === "leadership") {
    strukturwirkung += "\n\nIn einer Führungsrolle verstärkt sich diese Wirkung zusätzlich, da die Arbeitsweise der Führungskraft Prioritäten, Entscheidungswege und Arbeitsrhythmen im Team prägt.";
  }

  return { teamDominant: teamDom, personDominant: personDom, teamSecondary: teamSec, personSecondary: personSec, strukturwirkung };
}

function buildLeistungswirkung(teamProfile: Triad, personProfile: Triad, ctx: GoalContext): PerformanceImpact {
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);

  const teamLogik = ENTSCHEIDUNGSLOGIK[teamPrimary];
  const personLogik = ENTSCHEIDUNGSLOGIK[personPrimary];

  const entscheidungsqualitaet = teamPrimary === personPrimary
    ? `Team und Person bewerten Entscheidungen aus einer ähnlichen Logik heraus: Beide achten stärker auf ${teamLogik}. Das erleichtert die Abstimmung und beschleunigt Entscheidungsprozesse.`
    : `Unterschiedliche Arbeitslogiken führen dazu, dass Entscheidungen aus verschiedenen Perspektiven bewertet werden. Während das Team stärker auf ${teamLogik} achtet, orientiert sich die Person stärker an ${personLogik}. Bei klarer Führung kann das die Entscheidungsqualität erhöhen. Ohne Steuerung besteht das Risiko widersprüchlicher Prioritäten.`;

  let umsetzungsgeschwindigkeit: string;
  if (personPrimary === "impulsiv") {
    if (ctx.personNotHelpingGoal) {
      umsetzungsgeschwindigkeit = ctx.operative
        ? "Die Person bringt mehr operative Bewegung in den Arbeitsalltag. Das kann in Teilbereichen für mehr Tempo sorgen und kurzfristig mehr Ergebnisdruck erzeugen. Es unterstützt jedoch nicht automatisch die eigentliche Zielrichtung des Bereichs."
        : "Die Person bringt mehr operative Bewegung in Themen. Das kann in Teilbereichen für mehr Tempo sorgen und kurzfristig mehr Ergebnisdruck erzeugen. Es unterstützt jedoch nicht automatisch die eigentliche Zielrichtung des Bereichs.";
    } else {
      umsetzungsgeschwindigkeit = ctx.operative
        ? "Die Person bringt mehr operative Bewegung in den Arbeitsalltag. Aufgaben werden schneller angepackt und Ergebnisse konsequenter eingefordert. Bei klarer Führung kann das die Umsetzungsdynamik und Ergebnisverbindlichkeit spürbar stärken."
        : "Die Person bringt mehr operative Bewegung in Themen. Aufgaben werden schneller angestossen und Ergebnisse stärker eingefordert. Bei klarer Führung kann das die Umsetzungsdynamik und Ergebnisverbindlichkeit des Teams spürbar stärken.";
    }
  } else if (personPrimary === "analytisch") {
    if (ctx.personNotHelpingGoal) {
      umsetzungsgeschwindigkeit = ctx.operative
        ? "Die Person setzt stärker auf sorgfältige Vorbereitung und klare Abläufe. Das kann die Arbeitsqualität in Teilbereichen steigern, unterstützt aber nicht automatisch die eigentliche Zielrichtung des Bereichs."
        : "Die Person setzt stärker auf gründliche Vorbereitung und klare Strukturen. Das kann die Ergebnisqualität in einzelnen Themen steigern, unterstützt aber nicht automatisch die eigentliche Zielrichtung des Bereichs.";
    } else {
      umsetzungsgeschwindigkeit = ctx.operative
        ? "Die Person setzt stärker auf sorgfältige Vorbereitung und klare Abläufe, bevor Umsetzung startet. Das kann die Arbeitsqualität steigern, aber auch die Geschwindigkeit verlangsamen, wenn schnelle Reaktion gefragt ist."
        : "Die Person setzt stärker auf gründliche Vorbereitung und klare Strukturen, bevor Umsetzung startet. Das kann die Ergebnisqualität steigern, aber auch die Geschwindigkeit im Team verlangsamen, wenn schnelle Entscheidungen gefragt sind.";
    }
  } else {
    if (ctx.personNotHelpingGoal) {
      umsetzungsgeschwindigkeit = "Die Person orientiert sich an Abstimmung und gemeinsamer Ausrichtung. Das kann punktuell den Teamzusammenhalt stärken, unterstützt aber nicht automatisch die eigentliche Zielrichtung des Bereichs.";
    } else {
      umsetzungsgeschwindigkeit = "Die Person orientiert sich an Abstimmung und gemeinsamer Ausrichtung. Umsetzung erfolgt über Einbindung statt über Tempo. Das stärkt den Teamzusammenhalt, kann aber operative Geschwindigkeit reduzieren.";
    }
  }

  if (ctx.goal && ctx.goalKey && ctx.personAligned && !ctx.teamAligned) {
    umsetzungsgeschwindigkeit += ` Im Kontext des funktionalen Ziels (${ctx.goalLabel}) ist genau diese Arbeitsweise gewünscht und kann bei guter Integration die Leistungsfähigkeit gezielt stärken.`;
  }

  let prioritaetensetzung: string;
  if (teamPrimary === personPrimary) {
    prioritaetensetzung = "Team und Person gewichten Aufgaben nach ähnlichen Kriterien. Das reduziert Reibung bei der Priorisierung und erleichtert die tägliche Zusammenarbeit.";
  } else {
    const personFokus = personPrimary === "impulsiv" ? "unmittelbarer Wirkung und Fortschritt" : personPrimary === "analytisch" ? "Genauigkeit und langfristiger Qualität" : "gemeinsamer Abstimmung und Beziehungspflege";
    const teamFokus = teamPrimary === "impulsiv" ? "schnellem Fortschritt und sichtbaren Ergebnissen" : teamPrimary === "analytisch" ? "strukturierter Planung und Qualitätskontrolle" : "gemeinsamer Abstimmung und langfristiger Stabilität";
    prioritaetensetzung = `Die Person bewertet Aufgaben stärker nach ${personFokus}, das Team orientiert sich hingegen stärker an ${teamFokus}. Dadurch kann sich verändern, welche Themen im Alltag Vorrang erhalten.`;
  }

  let wirkungAufErgebnisse: string;
  if (teamPrimary === personPrimary) {
    wirkungAufErgebnisse = "Da beide Seiten ähnliche Arbeitslogiken teilen, können Ergebnisse effizient und mit hoher Konsistenz erzielt werden. Wichtig ist, blinde Flecken bewusst zu adressieren, die durch die gemeinsame Perspektive entstehen können.";
  } else if (ctx.personNotHelpingGoal) {
    const personBereich = componentBusinessNameFirst(personPrimary);
    wirkungAufErgebnisse = `Die Person kann punktuell mehr ${personBereich} in den Arbeitsalltag einbringen. Gleichzeitig besteht das Risiko von Abstimmungsbrüchen und einer schleichenden Verschiebung der Arbeitsprioritäten. Der Nutzen liegt in Teilaspekten, nicht in einer umfassenden Stärkung der Gesamtleistung. Die Konstellation unterstützt nicht automatisch die eigentliche Zielrichtung des Bereichs. Ohne klare Führung fliesst Energie eher in Anpassungsprozesse als in Ergebnisse.`;
  } else {
    wirkungAufErgebnisse = "Werden die unterschiedlichen Arbeitslogiken bewusst genutzt, kann die Konstellation in Teilbereichen sowohl Geschwindigkeit als auch Qualität stärken. Ohne klare Abstimmung fliesst Energie eher in Abstimmungsprozesse als in Ergebnisse.";
  }

  return { entscheidungsqualitaet, umsetzungsgeschwindigkeit, prioritaetensetzung, wirkungAufErgebnisse };
}

function buildIntegrationsfaktor(teamProfile: Triad, personProfile: Triad, passung: string, steuerungsaufwand: string, ctx: GoalContext): IntegrationFactor {
  const distance = Math.round(
    Math.abs(teamProfile.impulsiv - personProfile.impulsiv) +
    Math.abs(teamProfile.intuitiv - personProfile.intuitiv) +
    Math.abs(teamProfile.analytisch - personProfile.analytisch)
  );

  let integrationsfaehigkeit: string;
  if (passung === "Passend") {
    integrationsfaehigkeit = "Die Integration fällt voraussichtlich leicht, da die Arbeitslogiken gut zueinander passen. Erwartungen und Prioritäten sind von Beginn an ähnlich ausgerichtet.";
  } else if (passung === "Bedingt passend") {
    integrationsfaehigkeit = "Die Integration hängt davon ab, wie bewusst die unterschiedlichen Arbeitslogiken im Alltag geführt werden. Je klarer Erwartungen und Entscheidungswege definiert sind, desto leichter gelingt die Zusammenarbeit.";
    if (ctx.personNotHelpingGoal) {
      integrationsfaehigkeit += " Dabei ist zu berücksichtigen, dass die Person nicht in der primären Zielrichtung der Abteilung arbeitet. Die Integration muss deshalb besonders sorgfältig gesteuert werden, damit die Teilqualitäten gezielt genutzt werden, ohne die Hauptausrichtung zu verwässern.";
    }
  } else {
    integrationsfaehigkeit = "Die Integration erfordert aktive Steuerung und bewusste Begleitung. Ohne klare Orientierung und regelmässige Abstimmung besteht das Risiko, dass Reibung und Frustration die Zusammenarbeit belasten.";
    if (ctx.personCloserToGoal) {
      integrationsfaehigkeit += " Dabei ist zu berücksichtigen, dass die Person funktional in die richtige Richtung arbeitet. Die Integrationsaufgabe liegt stärker in der kulturellen Einbindung als in der fachlichen Ausrichtung.";
    }
  }

  let integrationsdauer: string;
  if (distance <= 20) {
    integrationsdauer = "Ein stabiler gemeinsamer Arbeitsrhythmus kann sich bereits innerhalb weniger Wochen entwickeln.";
  } else if (distance <= 40) {
    integrationsdauer = "Bei sichtbaren Strukturunterschieden benötigt das Team in der Regel mehrere Monate, um einen stabilen Arbeitsrhythmus zu finden. Klare Orientierung und regelmässige Abstimmung sind dabei besonders wichtig.";
  } else {
    integrationsdauer = "Bei deutlichen Strukturunterschieden muss mit einer Integrationsphase von mindestens 3 bis 6 Monaten gerechnet werden. In dieser Zeit braucht es engmaschige Führung und regelmässige Reflexion.";
  }

  let fuehrungsaufwand: string;
  if (steuerungsaufwand === "gering") {
    fuehrungsaufwand = "Der Führungsaufwand bleibt überschaubar. Es reicht, klare Erwartungen zu setzen und die Einarbeitung begleitend zu unterstützen.";
  } else if (steuerungsaufwand === "mittel") {
    fuehrungsaufwand = "Aktive Führung ist erforderlich: Erwartungen klären, Prioritäten sichtbar machen und Entscheidungsprozesse transparent gestalten.";
  } else {
    fuehrungsaufwand = "Der Führungsaufwand ist hoch. Ohne aktive Steuerung der unterschiedlichen Arbeitslogiken werden Spannungen und Missverständnisse schnell zur Belastung.";
  }

  let stabilisierung: string;
  if (passung === "Passend") {
    stabilisierung = "Die bestehende Teamstabilität kann erhalten bleiben, während gleichzeitig neue Impulse aufgenommen werden.";
  } else if (ctx.personNotHelpingGoal) {
    stabilisierung = "Bewusste Integration kann die Teilqualitäten der Person als Zusatzressource nutzbar machen. Ohne gezielte Steuerung besteht das Risiko, dass die bestehende Teamausrichtung an Klarheit verliert.";
  } else {
    stabilisierung = "Bewusste Integration kann neue Stärken ins Team einbringen, ohne die bestehende Stabilität zu gefährden. Ohne Steuerung steigt das Risiko dauerhafter Spannungen.";
  }

  return { integrationsfaehigkeit, integrationsdauer, fuehrungsaufwand, stabilisierung };
}

function buildAlternativwirkung(teamProfile: Triad, personProfile: Triad, ctx: GoalContext): string {
  const personPrimary = getPrimaryKey(personProfile);
  const teamPrimary = getPrimaryKey(teamProfile);
  const personBereich = componentBusinessNameFirst(personPrimary);
  const teamBereich = componentBusinessNameFirst(teamPrimary);

  const lines: string[] = [];

  if (ctx.personNotHelpingGoal && ctx.goalLabel) {
    lines.push(`Ohne die aktuelle Besetzung bleibt die bestehende Teamlogik stabil.`);
    lines.push(`Zusätzliche Impulse in Richtung ${personBereich} bleiben zwar aus. Zugleich entsteht jedoch auch kein zusätzlicher Anpassungsdruck in ${teamBereich} und im bestehenden Teamrhythmus.`);
    lines.push(`Die Frage ist, ob die punktuelle Qualität der Person den Steuerungsaufwand und das Risiko einer Zielverschiebung rechtfertigt.`);
  } else if (ctx.goal && ctx.goalLabel && ctx.personCloserToGoal && !ctx.teamAligned) {
    lines.push("Ohne die aktuelle Besetzung bleibt die bestehende Arbeitslogik des Teams weitgehend stabil.");
    lines.push(`Gleichzeitig bleibt die bestehende Lücke zum funktionalen Ziel (${ctx.goalLabel}) unverändert bestehen. Die Chance auf eine gezielte Weiterentwicklung in diese Richtung würde ungenutzt bleiben.`);
    if (teamPrimary !== personPrimary) {
      lines.push(`Die Besetzung bringt eine andere Arbeitslogik ins System ein, insbesondere im Bereich ${personBereich}. Dadurch entstehen neue Impulse in Bereichen, in denen das Team bislang weniger stark aufgestellt ist.`);
    }
    lines.push("Ob diese Veränderung zu einer nachhaltigen Verbesserung führt, hängt massgeblich davon ab, wie bewusst die unterschiedlichen Arbeitsweisen im Alltag gesteuert werden.");
  } else {
    lines.push("Ohne die aktuelle Besetzung bleibt die bestehende Arbeitslogik des Teams weitgehend stabil.");
    if (teamPrimary !== personPrimary) {
      lines.push(`Die Besetzung bringt eine andere Arbeitslogik ins System ein, insbesondere im Bereich ${personBereich}. Dadurch entstehen neue Impulse in Bereichen, in denen das Team bislang weniger stark aufgestellt ist.`);
    } else {
      lines.push(`Die Besetzung verstärkt die bestehende Arbeitslogik im Bereich ${personBereich}. Das festigt das vorhandene Muster, macht es aber auch einseitiger.`);
    }
    lines.push("Ob diese Veränderung zu einer nachhaltigen Verbesserung führt, hängt massgeblich davon ab, wie bewusst die unterschiedlichen Arbeitsweisen im Alltag gesteuert werden.");
  }

  return lines.join("\n\n");
}

function buildChances(v2Chances: string[], ctx: GoalContext, personProfile: Triad): string[] {
  const personPrimary = getPrimaryKey(personProfile);
  const result: string[] = [];

  if (ctx.personNotHelpingGoal) {
    if (personPrimary === "impulsiv") {
      result.push("Mehr Tempo und Handlungsenergie in einzelnen Alltagssituationen.");
      result.push("Stärkere Ergebnisorientierung in operativen Themen.");
    } else if (personPrimary === "analytisch") {
      result.push("Mehr Ordnung, klarere Standards und höhere Verlässlichkeit in einzelnen Arbeitsabläufen.");
      result.push("Punktuelle Stärkung von Nachvollziehbarkeit und Prozesssicherheit.");
    } else {
      result.push("Bessere Abstimmungsqualität und stärkerer Zusammenhalt in einzelnen Arbeitsbereichen.");
      result.push("Punktuell stärkere Dialogorientierung und Beziehungspflege im Arbeitsalltag.");
    }
    result.push("Zusätzlicher Impuls in Bereichen, in denen das Team bisher zu wenig Gewicht hat.");
    return result.slice(0, 3);
  }

  if (ctx.goal && ctx.goalLabel && ctx.personCloserToGoal && !ctx.teamAligned) {
    result.push(`Ausgleich einer funktionalen Untergewichtung: Die Person stärkt gezielt den Bereich ${ctx.goalLabel}, in dem das Team bislang weniger stark aufgestellt ist.`);
  }

  if (personPrimary === "impulsiv") {
    result.push(ctx.operative
      ? "Höhere Umsetzungsdynamik und stärkere Ergebnisverbindlichkeit im Arbeitsalltag."
      : "Stärkere Handlungsorientierung und höhere Ergebnisorientierung im Arbeitsalltag.");
  } else if (personPrimary === "analytisch") {
    result.push(ctx.operative
      ? "Mehr Ordnung, klarere Standards und höhere Verlässlichkeit in den Arbeitsabläufen."
      : "Mehr Struktur, Nachvollziehbarkeit und höhere Steuerbarkeit im Arbeitsalltag.");
  } else {
    result.push("Bessere Abstimmungsqualität und stärkerer Zusammenhalt im Team.");
  }

  if (ctx.goal && ctx.personCloserToGoal && !ctx.teamAligned) {
    result.push(`Gezielte Weiterentwicklung des Teams in Richtung des funktionalen Ziels der Abteilung.`);
  } else {
    result.push("Die Konstellation bietet die Möglichkeit, schwächere Arbeitsbereiche im Team gezielt zu stärken.");
  }

  const baseChance = v2Chances.find(c =>
    c.includes("neue Standards")
  );
  if (baseChance && result.length < 4) {
    result.push(baseChance);
  }

  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const item of result) {
    const norm = item.toLowerCase().replace(/[^a-zäöüß]+/g, " ").trim();
    const key = norm.split(/\s+/).slice(0, 6).join(" ");
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return deduped.slice(0, 4);
}

function buildRisks(v2Risks: string[], ctx: GoalContext): string[] {
  const result: string[] = [];

  result.push("Unterschiedliche Arbeitslogiken können im Alltag zu Missverständnissen führen, wenn nicht klar definiert wird, wie Entscheidungen getroffen, Prioritäten gesetzt und Ergebnisse bewertet werden.");

  const specificRisk = v2Risks.find(r =>
    r.includes("operative Taktung") || r.includes("Abstimmungstiefe") || r.includes("sachlicher Prüfung")
  );
  if (specificRisk) {
    result.push(specificRisk);
  }

  if (ctx.personNotHelpingGoal && ctx.goalLabel) {
    result.push(`Die Hauptgefahr ist nicht nur Reibung, sondern eine schleichende Zielverschiebung. Die Person unterstützt die zentrale Zielrichtung der Abteilung (${ctx.goalLabel}) nur begrenzt. Ohne Führung kann die Abweichung das Team nicht ergänzen, sondern von seiner eigentlichen Ausrichtung wegziehen.`);
    const personBereich = componentBusinessNameFirst(ctx.personPrimary);
    result.push(`Zusätzliche ${personBereich} kann im Teamalltag als hilfreich oder als Hemmnis erlebt werden. Ohne klare Einordnung durch die Führung entsteht Verunsicherung im Team.`);
  } else if (ctx.goal && ctx.personCloserToGoal && !ctx.teamAligned) {
    result.push("Es kann zu einer Polarisierung zwischen bestehender und neuer Arbeitsweise kommen. Bestehende Teamstärken und neue Anforderungen müssen bewusst verbunden werden, damit sie zusammenwirken statt nebeneinander stehen.");
    result.push("Das grösste Risiko besteht darin, dass eine funktional sinnvolle Wirkung als persönliche Störung fehlinterpretiert und ausgebremst wird, bevor sie ihren Beitrag entfalten kann.");
  } else {
    const systemRisk = v2Risks.find(r =>
      r.includes("Transformation") || r.includes("Reibungsfläche") || r.includes("Kulturkonflikt")
    );
    if (systemRisk) {
      result.push(systemRisk);
    }
    result.push("Ohne aktive Integration kann die Besetzung entweder gebremst werden oder dauerhaft gegen das bestehende Muster arbeiten, was zu schleichendem Leistungsverlust führt.");
  }

  return result.slice(0, 4);
}

function enrichAdvice(v2Advice: AdviceItem[], ctx: GoalContext): AdviceItem[] {
  const advice = v2Advice.map(a => ({ ...a, text: fixComponentCapitalization(a.text) }));

  if (ctx.personNotHelpingGoal && ctx.goalLabel) {
    advice.unshift({
      title: "Abweichende Wirkung klar einordnen",
      text: `Die Besetzung bringt eine andere Arbeitslogik mit, die einzelne Bereiche beleben kann, aber nicht die primäre Zielrichtung der Abteilung (${ctx.goalLabel}) verstärkt. Diese Abweichung sollte zu Beginn offen eingeordnet werden, damit Erwartungen realistisch bleiben und die Person nicht an einer Wirkung gemessen wird, die sie strukturell nicht primär unterstützt.`,
    });
  } else if (ctx.goal && ctx.goalLabel && ctx.personCloserToGoal && !ctx.teamAligned) {
    advice.unshift({
      title: "Strategische Wirkung offen einordnen",
      text: `Zu Beginn muss benannt werden, dass die Besetzung nicht nur auf Integration, sondern auch auf die funktionale Weiterentwicklung des Teams in Richtung ${ctx.goalLabel} einzahlt. Nur wenn diese Wirkung offen eingeordnet wird, kann die entstehende Spannung als gewollte Entwicklung statt als persönliche Störung verstanden werden.`,
    });
  }

  return advice;
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

const GOAL_TRIADS: Record<string, Triad> = {
  umsetzung: { impulsiv: 55, intuitiv: 25, analytisch: 20 },
  analyse: { impulsiv: 20, intuitiv: 25, analytisch: 55 },
  zusammenarbeit: { impulsiv: 20, intuitiv: 55, analytisch: 25 },
};

function computeStrategicWirkung(
  ctx: GoalContext,
  strategicFit: "passend" | "teilweise" | "abweichend" | null,
  passung: string,
): string | null {
  if (!ctx.goal || !ctx.goalLabel) return null;

  if (strategicFit === "passend" && ctx.personCloserToGoal && !ctx.teamAligned) {
    if (passung === "Kritisch") return "strategisch passende Korrektur";
    return "spannungsreiche Ergänzung";
  }
  if (strategicFit === "passend" && ctx.teamAligned) {
    return "stabil passend";
  }
  if (strategicFit === "teilweise") {
    if (ctx.personNotHelpingGoal) return "begrenzt anschlussfähig";
    return "gezielte Ergänzung";
  }
  if (strategicFit === "abweichend" && passung === "Kritisch") {
    return "kritische Abweichung";
  }
  if (strategicFit === "abweichend") {
    return "strukturelle Fehlpassung";
  }
  return "neutral";
}

function evaluateStrategicFit(
  goal: TeamGoal,
  teamProfile: Triad,
  personProfile: Triad,
  roleType: "leadership" | "member",
  ctx: GoalContext,
): { strategicFit: "passend" | "teilweise" | "abweichend" | null; strategicText: string | null } {
  if (!goal) return { strategicFit: null, strategicText: null };

  const goalKey = GOAL_DOMINANT[goal];
  const goalLabel = ctx.goalLabel || GOAL_LABELS[goal];
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
    const sorted = Object.entries(personProfile)
      .sort(([, a], [, b]) => b - a);
    const gap = sorted[0][1] - sorted[1][1];
    if (gap >= 12) {
      strategicFit = "passend";
    } else if (gap > 5) {
      strategicFit = "teilweise";
    } else {
      strategicFit = "abweichend";
    }
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
    lines.push(`Das bestehende Team bildet das funktionale Ziel aktuell nur teilweise ab. Die Person bringt dagegen genau die Arbeitsweise mit, die für dieses Ziel erforderlich ist. Die Abweichung zum Team ist deshalb nicht nur als Risiko zu bewerten, sondern auch als gezielte funktionale Ergänzung.`);
    if (roleType === "leadership") {
      lines.push(`Die Herausforderung liegt weniger in der fachlichen Eignung als in der wirksamen Integration in das bestehende Teamgefüge. In einer Führungsrolle kann die Person das Team gezielt in Richtung des Funktionsziels entwickeln.`);
    } else {
      lines.push(`Die Herausforderung liegt weniger in der fachlichen Eignung als in der wirksamen Integration in das bestehende Teamgefüge. Als Teammitglied braucht die Person Rückendeckung durch die Führung, damit die veränderte Arbeitsweise als gewollte Entwicklung wahrgenommen wird.`);
    }
  } else if (teamAligned && !personAligned) {
    const personBereich = componentBusinessNameFirst(personPrimary);
    if (strategicFit === "teilweise") {
      lines.push(`Das Team ist bereits auf das Funktionsziel ausgerichtet. Die Person bringt das Ziel als Nebenkomponente mit (${personGoalValue} %), arbeitet aber primär mit einer anderen Logik (${personBereich}). Dadurch ist der Beitrag zum funktionalen Ziel begrenzt und muss gezielt gesteuert werden.`);
    } else {
      lines.push(`Das Team ist bereits auf das Funktionsziel ausgerichtet. Die Person arbeitet jedoch mit einer anderen Hauptlogik (primär ${personBereich}). Diese Logik kann punktuell nützlich sein, verstärkt aber nicht die primäre Zielrichtung der Abteilung. Ohne gezielte Steuerung kann die bestehende Ausrichtung verwässert werden.`);
    }
  } else {
    if (strategicFit === "teilweise") {
      lines.push(`Weder das bestehende Team noch die Person sind primär auf das Funktionsziel ausgerichtet. Die Person bringt das Ziel als Nebenkomponente mit (${personGoalValue} %), was einen begrenzten Beitrag in diese Richtung leisten kann.`);
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
