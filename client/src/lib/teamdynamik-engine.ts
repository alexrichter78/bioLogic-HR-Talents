import {
  type ComponentKey, type Triad, type DominanceResult,
  normalizeTriad, dominanceModeOf, labelComponent, dominanceLabel,
} from "./jobcheck-engine";

export type DominanceType = "IMPULSIV" | "INTUITIV" | "ANALYTISCH" | "MIX";
export type IntensityLevel = "NIEDRIG" | "MITTEL" | "HOCH";
export type ShiftType = "VERSTAERKUNG" | "ERGAENZUNG" | "REIBUNG" | "SPANNUNG" | "TRANSFORMATION" | "HYBRID";
export type TrafficLight = "GREEN" | "YELLOW" | "RED";
export type ViewMode = "CEO" | "HR" | "TEAMLEITUNG";

export type Lever = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

export type MatrixCell = {
  id: string;
  label: string;
  micro: string;
  systemlage: string;
  alltag: string;
  tun: string;
};

export type TeamDynamikInput = {
  teamName: string;
  teamProfile: Triad;
  membersCount: number;
  personProfile: Triad;
  isLeading: boolean;
  roleSoll?: { enabled: boolean; profile: Triad };
  tasks?: string[];
  kpiFocus?: string[];
  levers: Lever[];
  steeringOverride?: string | null;
};

export type Scores = {
  DG: number;
  DC: number;
  RG: number | null;
  TS: number;
  CI: number;
};

export type TeamDynamikResult = {
  dominanceTeam: DominanceType;
  dominancePerson: DominanceType;
  dominanceRoleSoll: DominanceType | null;
  teamDom: DominanceResult;
  personDom: DominanceResult;
  scores: Scores;
  intensityLevel: IntensityLevel;
  shiftType: ShiftType;
  shiftAxis: string;
  steeringNeed: IntensityLevel;
  trafficLight: TrafficLight;
  leverEffects: { enabledCount: number; reductionLevels: number };
  activeMatrixCell: MatrixCell;
  headline: string;
  leadershipBehavior: {
    axisLabel: string;
    statement: string;
    possiblePerception: string;
    blindSpot: string;
  };
  systemEffect: string;
  chances: string[];
  risks: string[];
  integrationPlan: { phaseId: string; title: string; days: string; actions: string[] }[];
};

const DEFAULT_LEVERS: Lever[] = [
  { id: "timebox", label: "Entscheidungszeitfenster definiert", description: "Klare Fristen für Entscheidungen verhindern Endlosschleifen und Konsensverschleppung.", enabled: false },
  { id: "8020", label: "80/20-Qualitätsstandard festgelegt", description: "Definierter Qualitätsstandard verhindert Über-Perfektionierung und hält das Tempo.", enabled: false },
  { id: "weekly_review", label: "Wöchentlicher Priorisierungsreview", description: "Regelmäßige Überprüfung schafft Steuerungssicherheit und verhindert stille Abweichungen.", enabled: false },
  { id: "role_boundaries", label: "Entscheidungs- und Verantwortungsgrenzen", description: "Klare Rollen- und Entscheidungsgrenzen reduzieren Konflikte und Doppelarbeit.", enabled: false },
  { id: "comm_rules", label: "Sach-/Beziehungsebene, Feedbackregeln", description: "Feste Kommunikationsregeln trennen Sachfragen von Beziehungsdynamik.", enabled: false },
  { id: "pulse_check", label: "Teamtemperatur-Check", description: "Regelmäßiger Pulse-Check macht Stimmung und Belastung messbar.", enabled: false },
];

const MATRIX_CELLS: MatrixCell[] = [
  { id: "IMP-IMP", label: "Verstärkung", micro: "Tempo-System", systemlage: "Führung und Team teilen dieselbe Umsetzungslogik. Entscheidungen fallen schnell, Ergebnisdruck wird als Normalzustand erlebt.", alltag: "Hohes Tempo, kurze Entscheidungswege, aber Risiko blinder Flecken bei Qualität und Abstimmung. Reflexion wird systematisch vernachlässigt.", tun: "Qualitäts-Gates definieren, Review-Rhythmus einführen, bewusst Verlangsamung bei kritischen Entscheidungen einplanen." },
  { id: "IMP-INT", label: "Dynamik-Konflikt", micro: "Tempo vs Beziehung", systemlage: "Führung priorisiert Umsetzung und Ergebnis. Das Team arbeitet beziehungsorientiert und konsensgetrieben.", alltag: "Führung empfindet Team als zu langsam. Team empfindet Führung als druckvoll und distanziert. Entscheidungen werden unterschiedlich bewertet.", tun: "Entscheidungszeitfenster definieren, 80/20-Standards setzen, Beziehungsebene ritualisieren (z.B. wöchentliche Teamrunde)." },
  { id: "IMP-ANA", label: "Tempo vs Struktur", micro: "Schnell vs Absicherung", systemlage: "Führung will schnelle Ergebnisse. Das Team arbeitet strukturiert und absicherungsorientiert.", alltag: "Führung empfindet Prozesse als Bremse. Team empfindet Führung als unstrukturiert und risikobereit. Qualitätsansprüche kollidieren mit Tempoforderung.", tun: "80/20-Standard festlegen, klare Priorisierungsregeln definieren, Review-Rhythmus mit Zeitlimit einführen." },
  { id: "INT-IMP", label: "Beziehung vs Tempo", micro: "Harmonie vs Druck", systemlage: "Führung priorisiert Beziehung und Konsens. Das Team arbeitet umsetzungs- und ergebnisorientiert.", alltag: "Team empfindet Führung als zögerlich. Führung empfindet Team als zu direkt und konfrontativ. Entscheidungstempo wird zum Reibungspunkt.", tun: "Entscheidungsfristen verbindlich machen, Klarheit über Eskalationswege, Führung muss Ergebnisorientierung sichtbar integrieren." },
  { id: "INT-INT", label: "Harmonie-System", micro: "Konsens stabil", systemlage: "Führung und Team teilen dieselbe Beziehungslogik. Konsens, Abstimmung und Teamdynamik stehen im Zentrum.", alltag: "Stabile Zusammenarbeit, hohe Bindung, aber Risiko bei Konfliktvermeidung und Entscheidungsverzögerung. Schwierige Themen werden aufgeschoben.", tun: "Entscheidungsfristen setzen, Konfliktroutinen etablieren, externe Impulse für Ergebnisorientierung einplanen." },
  { id: "INT-ANA", label: "Konsens vs Kontrolle", micro: "Abstimmung vs Gate", systemlage: "Führung priorisiert Beziehung und Abstimmung. Das Team arbeitet analytisch und prozessorientiert.", alltag: "Team erwartet klare Vorgaben und Struktur. Führung setzt auf Dialog und Konsens. Prozesseffizienz leidet unter Abstimmungsschleifen.", tun: "Prozess-Standards definieren, Entscheidungslogik klären (wann Konsens, wann Vorgabe), Review-Format standardisieren." },
  { id: "ANA-IMP", label: "Struktur vs Tempo", micro: "Gate vs Speed", systemlage: "Führung priorisiert Struktur und Absicherung. Das Team arbeitet umsetzungs- und tempoorientiert.", alltag: "Team empfindet Führung als Bremse. Führung empfindet Team als unstrukturiert. Qualitätsansprüche und Geschwindigkeit kollidieren.", tun: "80/20-Standard festlegen, Entscheidungszeitfenster definieren, klare Priorisierungsregeln für Qualität vs. Tempo." },
  { id: "ANA-INT", label: "Logik vs Beziehung", micro: "Struktur vs Nähe", systemlage: "Führung priorisiert Struktur und Fakten. Das Team arbeitet beziehungs- und konsensorientiert.", alltag: "Entscheidungen werden faktenbasierter, Tempo sinkt kurzfristig. Team nimmt Distanz wahr, Führung nimmt emotionale Dynamik als Störung wahr.", tun: "Entscheidungszeitfenster setzen, 80/20-Standard definieren, Reviews einführen, Beziehungsebene ritualisieren." },
  { id: "ANA-ANA", label: "Stabilitäts-System", micro: "Qualität & Planbarkeit", systemlage: "Führung und Team teilen dieselbe analytische Logik. Struktur, Qualität und Planbarkeit dominieren.", alltag: "Hohe Prozessstabilität und Qualität, aber Risiko bei Innovationsgeschwindigkeit und Flexibilität. Veränderungen werden systematisch verlangsamt.", tun: "Innovationsimpulse bewusst setzen, Entscheidungstempo für Veränderungen definieren, externe Perspektiven einplanen." },
];

function dominanceType(p: Triad): DominanceType {
  const maxVal = Math.max(p.impulsiv, p.intuitiv, p.analytisch);
  const winners: DominanceType[] = [];
  if (p.impulsiv === maxVal) winners.push("IMPULSIV");
  if (p.intuitiv === maxVal) winners.push("INTUITIV");
  if (p.analytisch === maxVal) winners.push("ANALYTISCH");
  if (winners.length >= 2) return "MIX";
  return winners[0];
}

function distributionGap(team: Triad, person: Triad): number {
  const s = Math.abs(team.impulsiv - person.impulsiv)
    + Math.abs(team.intuitiv - person.intuitiv)
    + Math.abs(team.analytisch - person.analytisch);
  return Math.round((s / 2.0) * 10) / 10;
}

function dominanceClash(domTeam: DominanceType, domPerson: DominanceType): number {
  if (domTeam === domPerson && domTeam !== "MIX") return 0;
  if (domTeam === "MIX" || domPerson === "MIX") return 50;
  return 100;
}

function roleGap(roleSollEnabled: boolean, roleSoll: Triad | null, person: Triad): number | null {
  if (!roleSollEnabled || !roleSoll) return null;
  const s = Math.abs(roleSoll.impulsiv - person.impulsiv)
    + Math.abs(roleSoll.intuitiv - person.intuitiv)
    + Math.abs(roleSoll.analytisch - person.analytisch);
  return Math.round((s / 2.0) * 10) / 10;
}

function leadershipFactor(isLeading: boolean): number {
  return isLeading ? 15 : 0;
}

function scaleFactor(n: number): number {
  if (n < 6) return 0;
  if (n < 12) return 5;
  return 10;
}

function transformationScore(DG: number, DC: number, RG: number | null, isLeading: boolean, n: number): number {
  const LF = leadershipFactor(isLeading);
  const SF = scaleFactor(n);

  let TS: number;
  if (RG !== null) {
    TS = 0.45 * DG + 0.25 * DC + 0.20 * RG + 0.07 * LF + 0.03 * SF;
  } else {
    TS = 0.55 * DG + 0.25 * DC + 0.17 * LF + 0.03 * SF;
  }

  return Math.round(Math.min(100, Math.max(0, TS)));
}

function intensityLevel(TS: number): IntensityLevel {
  if (TS <= 33) return "NIEDRIG";
  if (TS <= 66) return "MITTEL";
  return "HOCH";
}

function conflictIndex(TS: number, DC: number): number {
  return Math.round(Math.min(100, Math.max(0, 0.6 * TS + 0.4 * DC)));
}

function axisLabel(domFrom: DominanceType, domTo: DominanceType): string {
  if (domFrom === domTo) return "Keine dominante Verschiebung";
  if (domFrom === "MIX" || domTo === "MIX") return "Hybrid-Verschiebung";
  const map: Record<DominanceType, string> = {
    IMPULSIV: "Tempo & Entscheidung",
    INTUITIV: "Beziehung & Abstimmung",
    ANALYTISCH: "Struktur & Absicherung",
    MIX: "Hybrid",
  };
  return `${map[domFrom]} → ${map[domTo]}`;
}

function shiftType(domTeam: DominanceType, domPerson: DominanceType, DG: number, DC: number, TS: number, isLeading: boolean): ShiftType {
  const level = intensityLevel(TS);

  if (DC === 0) {
    if (DG < 20) return "VERSTAERKUNG";
    return "ERGAENZUNG";
  }

  if (domTeam === "MIX" || domPerson === "MIX") {
    if (level === "NIEDRIG") return "ERGAENZUNG";
    if (level === "MITTEL") return "HYBRID";
    return isLeading ? "TRANSFORMATION" : "SPANNUNG";
  }

  if (level === "NIEDRIG") return "ERGAENZUNG";
  if (level === "MITTEL") return "REIBUNG";
  return isLeading ? "TRANSFORMATION" : "SPANNUNG";
}

function leverReductionLevels(levers: Lever[]): number {
  const enabled = levers.filter(l => l.enabled).length;
  if (enabled >= 4) return 2;
  if (enabled >= 2) return 1;
  return 0;
}

function applyLevelReduction(level: IntensityLevel, reduction: number): IntensityLevel {
  if (reduction === 0) return level;
  if (reduction === 1) {
    if (level === "HOCH") return "MITTEL";
    return "NIEDRIG";
  }
  return "NIEDRIG";
}

function calcSteeringNeed(level: IntensityLevel, RG: number | null, levers: Lever[], override?: string | null): { final: IntensityLevel; enabledCount: number; reductionLevels: number } {
  if (override && override !== "NONE") {
    return { final: override as IntensityLevel, enabledCount: levers.filter(l => l.enabled).length, reductionLevels: 0 };
  }

  let base = level;
  if (RG !== null && RG > 50) {
    if (base === "NIEDRIG") base = "MITTEL";
    else base = "HOCH";
  }

  const red = leverReductionLevels(levers);
  const final = applyLevelReduction(base, red);
  return { final, enabledCount: levers.filter(l => l.enabled).length, reductionLevels: red };
}

function trafficLight(st: ShiftType, level: IntensityLevel, steeringNeed: IntensityLevel): TrafficLight {
  if (st === "TRANSFORMATION" || st === "SPANNUNG") {
    return steeringNeed === "NIEDRIG" ? "YELLOW" : "RED";
  }
  if (steeringNeed === "HOCH" || level === "HOCH") return "RED";
  if (steeringNeed === "MITTEL" || level === "MITTEL") return "YELLOW";
  return "GREEN";
}

function matrixCellId(leadDom: DominanceType, teamDom: DominanceType): string {
  const map: Record<DominanceType, string> = { IMPULSIV: "IMP", INTUITIV: "INT", ANALYTISCH: "ANA", MIX: "INT" };
  return `${map[leadDom]}-${map[teamDom]}`;
}

function buildHeadline(st: ShiftType, domTeam: DominanceType, domPerson: DominanceType, isLeading: boolean): string {
  const tMap: Record<DominanceType, string> = { IMPULSIV: "umsetzungsorientiertes", INTUITIV: "beziehungsorientiertes", ANALYTISCH: "strukturorientiertes", MIX: "ausgeglichenes" };
  const cMap: Record<DominanceType, string> = { IMPULSIV: "Umsetzungslogik", INTUITIV: "Beziehungslogik", ANALYTISCH: "Strukturlogik", MIX: "Mischlogik" };
  const role = isLeading ? "Führung" : "Neue Person";

  switch (st) {
    case "VERSTAERKUNG": return `${role} verstärkt die bestehende Dynamik des Teams. Gleichgerichtete Arbeitslogik.`;
    case "ERGAENZUNG": return `${role} ergänzt das ${tMap[domTeam]} Team mit ${cMap[domPerson]}. Komplementärer Effekt.`;
    case "REIBUNG": return `${cMap[domPerson]} trifft auf ${tMap[domTeam]} Team. Reibung in Steuerungslogik und Priorisierung.`;
    case "SPANNUNG": return `Strukturelle Spannung: ${cMap[domPerson]} im ${tMap[domTeam]} Team. Steuerung erforderlich.`;
    case "TRANSFORMATION": return `${cMap[domPerson]} als Führungslogik transformiert ${tMap[domTeam]} Team. Hohe Steuerungsintensität.`;
    case "HYBRID": return `Hybride Verschiebung: Mischlogik trifft auf ${tMap[domTeam]} Team.`;
  }
}

function buildLeadershipBehavior(domPerson: DominanceType, domTeam: DominanceType, isLeading: boolean) {
  const role = isLeading ? "Die Führung" : "Die neue Person";
  const axis = axisLabel(domTeam, domPerson);

  const key = `${domPerson}-${domTeam}`;
  const texts: Record<string, { s: string; p: string; b: string }> = {
    "IMPULSIV-INTUITIV": { s: `${role} bringt Umsetzungsdruck in ein beziehungsorientiertes Team. Entscheidungstempo steigt, Abstimmungstiefe sinkt.`, p: "Das Team nimmt Druck und Ungeduld wahr. Beziehungsdynamik wird als zweitrangig empfunden.", b: "Bindungsverlust durch fehlende Beziehungspflege. Stille Demotivation im Team." },
    "IMPULSIV-ANALYTISCH": { s: `${role} bringt Umsetzungsdruck in ein strukturorientiertes Team. Tempo kollidiert mit Absicherungsbedürfnis.`, p: "Das Team nimmt Hektik und fehlende Struktur wahr. Qualitätsansprüche werden als Bremse interpretiert.", b: "Qualitätsverlust durch überhöhtes Tempo. Prozessabkürzungen werden zur Gewohnheit." },
    "INTUITIV-IMPULSIV": { s: `${role} bringt Beziehungsorientierung in ein tempogetriebenes Team. Abstimmungsbedarf steigt, Entscheidungstempo sinkt.`, p: "Das Team empfindet Führung als zögerlich und konsensorientiert. Ergebnisorientierung wird vermisst.", b: "Entscheidungsverzögerung durch Konsensbedürfnis. Klare Ansagen bleiben aus." },
    "INTUITIV-ANALYTISCH": { s: `${role} bringt Beziehungslogik in ein strukturorientiertes Team. Abstimmung und Dialog ersetzen Prozessvorgaben.`, p: "Das Team erwartet klare Vorgaben und bekommt Gesprächsangebote. Prozesseffizienz leidet.", b: "Strukturverlust durch fehlende Standardisierung. Individuelle Absprachen ersetzen systematische Prozesse." },
    "ANALYTISCH-IMPULSIV": { s: `${role} bringt Struktur und Absicherung in ein tempogetriebenes Team. Prozessqualität steigt, Geschwindigkeit sinkt kurzfristig.`, p: "Das Team empfindet neue Prozesse als Bremse. Kontrolle wird als Misstrauen interpretiert.", b: "Innovationsverlust durch Über-Strukturierung. Handlungsspielräume werden eingeengt." },
    "ANALYTISCH-INTUITIV": { s: `${role} bringt Struktur und Faktenorientierung in ein beziehungsorientiertes Team. Entscheidungen werden sachlicher, Distanz steigt.`, p: "Das Team nimmt emotionale Distanz wahr. Faktenorientierung wird als Kälte empfunden.", b: "Bindungsverlust durch fehlende emotionale Anschlussfähigkeit. Teamdynamik wird unterschätzt." },
  };

  if (domPerson === domTeam) {
    return {
      axisLabel: axis,
      statement: `${role} arbeitet in derselben Steuerungslogik wie das Team. Entscheidungswege und Priorisierung werden verstärkt.`,
      possiblePerception: "Das Team erlebt Bestätigung der eigenen Arbeitsweise. Bestehende Muster werden stabilisiert.",
      blindSpot: "Einseitige Verstärkung: Fehlende Korrektive für die nachrangigen Kompetenzen.",
    };
  }

  const entry = texts[key] || { s: `${role} bringt eine andere Arbeitslogik ins Team.`, p: "Unterschiedliche Erwartungen an Arbeitsweise und Entscheidungsfindung.", b: "Gegenseitige Fehlinterpretation von Arbeitsstil und Prioritäten." };
  return { axisLabel: axis, statement: entry.s, possiblePerception: entry.p, blindSpot: entry.b };
}

function buildSystemEffect(st: ShiftType, domPerson: DominanceType, domTeam: DominanceType, isLeading: boolean): string {
  const pMap: Record<DominanceType, string> = { IMPULSIV: "Umsetzungs", INTUITIV: "Beziehungs", ANALYTISCH: "Struktur", MIX: "Misch" };
  const tMap: Record<DominanceType, string> = { IMPULSIV: "umsetzungsorientierte", INTUITIV: "beziehungsorientierte", ANALYTISCH: "strukturorientierte", MIX: "ausgeglichene" };
  const role = isLeading ? "der Führung" : "der neuen Person";

  switch (st) {
    case "VERSTAERKUNG": return `Die ${pMap[domPerson]}logik wird durch den Eintritt ${role} verstärkt. Bestehende Stärken werden ausgebaut, bestehende Schwächen werden nicht kompensiert. Systemisch: stabil, aber einseitig.`;
    case "ERGAENZUNG": return `${pMap[domPerson]}kompetenz ergänzt das ${tMap[domTeam]} Team. Neue Perspektiven und Arbeitsweisen werden eingebracht. Systemisch: bereichernd, Integrationsaufwand moderat.`;
    case "REIBUNG": return `${pMap[domPerson]}logik trifft auf ${tMap[domTeam]}s Team. Unterschiedliche Priorisierung erzeugt Reibung in Entscheidungsfindung und Alltagssteuerung. Systemisch: steuerbar, aber Aufmerksamkeit erforderlich.`;
    case "SPANNUNG": return `Strukturelle Spannung zwischen ${pMap[domPerson]}logik und ${tMap[domTeam]}m Team. Arbeitslogik, Kommunikation und Erwartungshaltung weichen deutlich voneinander ab. Systemisch: aktive Steuerung notwendig.`;
    case "TRANSFORMATION": return `${pMap[domPerson]}logik als Führungsansatz verändert die ${tMap[domTeam]} Teamdynamik grundlegend. Arbeitslogik, Entscheidungskultur und Priorisierung werden transformiert. Systemisch: hohe Steuerungsintensität, aktives Change-Management erforderlich.`;
    default: return `Hybride Verschiebung: Die Teamdynamik verändert sich auf mehreren Ebenen gleichzeitig. Gezielte Steuerung erforderlich.`;
  }
}

function buildChances(st: ShiftType, domPerson: DominanceType, domTeam: DominanceType): string[] {
  const pLabel = { IMPULSIV: "Umsetzungs", INTUITIV: "Beziehungs", ANALYTISCH: "Struktur", MIX: "Misch" }[domPerson];
  const tLabel = { IMPULSIV: "Umsetzungs", INTUITIV: "Beziehungs", ANALYTISCH: "Struktur", MIX: "Misch" }[domTeam];

  if (st === "VERSTAERKUNG") return [
    `Verstärkte ${pLabel}kompetenz beschleunigt Kernprozesse.`,
    "Hohe Anschlussfähigkeit reduziert Einarbeitungszeit.",
    "Teamidentität und Arbeitsrhythmus bleiben stabil.",
    "Entscheidungslogik wird konsistenter.",
  ];
  if (st === "ERGAENZUNG") return [
    `${pLabel}kompetenz ergänzt fehlende Perspektive im Team.`,
    "Neue Impulse für Entscheidungsfindung und Problemlösung.",
    `Blinde Flecken der ${tLabel}dominanz werden adressiert.`,
    "Breitere Kompetenzabdeckung im Gesamtteam.",
  ];
  return [
    `${pLabel}impulse können bestehende Routinen aufbrechen.`,
    "Neue Perspektive erzwingt bewusstere Entscheidungsfindung.",
    "Potenziell höhere Anpassungsfähigkeit des Teams.",
    st === "TRANSFORMATION" ? "Chance auf grundlegende Erneuerung von Prozessen und Kultur." : "Moderate Systemveränderung bei gezielter Steuerung möglich.",
    "Qualitätssteigerung durch neue Standards.",
    "Professionalisierung der Entscheidungswege.",
  ];
}

function buildRisks(st: ShiftType, domPerson: DominanceType, domTeam: DominanceType, isLeading: boolean): string[] {
  const pLabel = { IMPULSIV: "Umsetzungs", INTUITIV: "Beziehungs", ANALYTISCH: "Struktur", MIX: "Misch" }[domPerson];
  const tLabel = { IMPULSIV: "umsetzungsorientierten", INTUITIV: "beziehungsorientierten", ANALYTISCH: "strukturorientierten", MIX: "ausgeglichenen" }[domTeam];
  const role = isLeading ? "Führung" : "Neue Person";

  if (st === "VERSTAERKUNG") return [
    `Einseitige Verstärkung ohne Korrektiv. Im Alltag: blinde Flecken bei nachrangigen Kompetenzen.`,
    "Homogenität erhöht Anfälligkeit bei Systemveränderungen.",
    "Fehlende Diversität in Entscheidungslogik.",
  ];
  if (st === "ERGAENZUNG") return [
    `Integrationsphase erfordert bewusste Steuerung. Im Alltag: temporäre Reibung bei Priorisierung.`,
    `${role} muss Anschlussfähigkeit aktiv herstellen.`,
    "Unterschiedliche Arbeitsgeschwindigkeit in der Einarbeitung.",
  ];
  return [
    `${pLabel}logik der ${role} und ${tLabel}s Team priorisieren unterschiedlich. Im Alltag: Konflikte bei Entscheidungsgeschwindigkeit und -logik.`,
    `Gegenseitige Fehlinterpretation von Arbeitsstil. Im Alltag: stille Frustration und Rückzug.`,
    "Ohne Steuerung wird Reibung zu chronischem Spannungsfeld.",
    st === "TRANSFORMATION" || st === "SPANNUNG" ? `${isLeading ? "Führungsakzeptanz" : "Teamintegration"} gefährdet. Im Alltag: Widerstand und Abgrenzung.` : "Motivationsdelle bei stark betroffenen Teammitgliedern möglich.",
    st === "TRANSFORMATION" ? "Kulturelle Transformation braucht 6-12 Monate. Im Alltag: lange Unsicherheitsphase." : "Ohne bewusste Steuerung steigt der Konfliktgrad.",
    "Überstrukturierung oder Kontrollverlust je nach Dynamik.",
  ];
}

function buildIntegrationPlan(st: ShiftType, isLeading: boolean): { phaseId: string; title: string; days: string; actions: string[] }[] {
  const role = isLeading ? "Führungskraft" : "Teammitglied";
  return [
    { phaseId: "P1", title: "Architektur klären", days: "0–10 Tage", actions: [
      "Rollen- und Entscheidungsgrenzen definieren.",
      "Qualitäts-Gates und Reportingstruktur abstimmen.",
      `${role} definiert Arbeitslogik und Entscheidungswege explizit.`,
      "Erwartungsgespräche mit Team führen.",
    ]},
    { phaseId: "P2", title: "Wirkung erzeugen", days: "10–20 Tage", actions: [
      "Ein priorisiertes Thema strukturiert optimieren.",
      "Feedback-Loop etablieren.",
      "Erste Erfolge sichtbar machen und kommunizieren.",
      "Spannungsfelder identifizieren und benennen.",
    ]},
    { phaseId: "P3", title: "Stabilisieren", days: "20–30 Tage", actions: [
      "Übersteuerung vermeiden, Kontrollgrad anpassen.",
      "Belastung und Stimmung evaluieren.",
      "Steuerungsmaßnahmen verstetigen.",
      "Gesamtbewertung der Integration.",
    ]},
  ];
}

export function getDefaultLevers(): Lever[] {
  return DEFAULT_LEVERS.map(l => ({ ...l }));
}

export function computeTeamDynamics(input: TeamDynamikInput): TeamDynamikResult {
  const team = normalizeTriad(input.teamProfile);
  const person = normalizeTriad(input.personProfile);
  const roleSoll = input.roleSoll?.enabled ? normalizeTriad(input.roleSoll.profile) : null;

  const domT = dominanceType(team);
  const domP = dominanceType(person);
  const domS = roleSoll ? dominanceType(roleSoll) : null;

  const teamDom = dominanceModeOf(team);
  const personDom = dominanceModeOf(person);

  const DG = distributionGap(team, person);
  const DC = dominanceClash(domT, domP);
  const RG = roleGap(!!input.roleSoll?.enabled, roleSoll, person);

  const TS = transformationScore(DG, DC, RG, input.isLeading, input.membersCount);
  const level = intensityLevel(TS);
  const CI = conflictIndex(TS, DC);

  const axis = axisLabel(domT, domP);
  const st = shiftType(domT, domP, DG, DC, TS, input.isLeading);

  const steer = calcSteeringNeed(level, RG, input.levers, input.steeringOverride);
  const tl = trafficLight(st, level, steer.final);

  const cellId = input.isLeading ? matrixCellId(domP, domT) : matrixCellId(domT, domP);
  const activeCell = MATRIX_CELLS.find(c => c.id === cellId) || MATRIX_CELLS[4];

  return {
    dominanceTeam: domT,
    dominancePerson: domP,
    dominanceRoleSoll: domS,
    teamDom,
    personDom,
    scores: { DG, DC, RG, TS, CI },
    intensityLevel: level,
    shiftType: st,
    shiftAxis: axis,
    steeringNeed: steer.final,
    trafficLight: tl,
    leverEffects: { enabledCount: steer.enabledCount, reductionLevels: steer.reductionLevels },
    activeMatrixCell: activeCell,
    headline: buildHeadline(st, domT, domP, input.isLeading),
    leadershipBehavior: buildLeadershipBehavior(domP, domT, input.isLeading),
    systemEffect: buildSystemEffect(st, domP, domT, input.isLeading),
    chances: buildChances(st, domP, domT),
    risks: buildRisks(st, domP, domT, input.isLeading),
    integrationPlan: buildIntegrationPlan(st, input.isLeading),
  };
}

export function getMatrixCellById(id: string): MatrixCell | undefined {
  return MATRIX_CELLS.find(c => c.id === id);
}

export function getViewContent(viewMode: ViewMode, result: TeamDynamikResult, selectedCell: MatrixCell) {
  if (viewMode === "CEO") {
    return {
      insightSections: [{ title: "Systemwirkung", text: result.systemEffect }],
      risks: result.risks.slice(0, 3),
      chances: result.chances.slice(0, 3),
      showMatrix: false,
      showLevers: false,
      showInsights: false,
      actionTitle: "Kurzfazit",
    };
  }
  if (viewMode === "TEAMLEITUNG") {
    return {
      insightSections: [
        { title: "Führungsverhalten", text: result.leadershipBehavior.statement },
        { title: "Spannungsfeld", text: result.leadershipBehavior.possiblePerception },
        { title: "Alltagswirkung", text: selectedCell.alltag },
        { title: "Konkrete Maßnahmen", text: selectedCell.tun },
      ],
      risks: result.risks,
      chances: result.chances,
      showMatrix: true,
      showLevers: true,
      showInsights: true,
      actionTitle: "Routinen & Steuerung",
    };
  }
  return {
    insightSections: [
      { title: "Führungsverhalten", text: result.leadershipBehavior.statement },
      { title: "Spannungsfeld", text: result.leadershipBehavior.possiblePerception },
      { title: "Blinder Fleck", text: result.leadershipBehavior.blindSpot },
      { title: "Systemwirkung", text: result.systemEffect },
    ],
    risks: result.risks,
    chances: result.chances,
    showMatrix: true,
    showLevers: true,
    showInsights: true,
    actionTitle: "Kultur & Integration",
  };
}

export function buildAIPayload(input: TeamDynamikInput, result: TeamDynamikResult) {
  return {
    context: {
      team_name: input.teamName,
      members_count: input.membersCount,
      is_leading: input.isLeading,
      person_role: input.isLeading ? "Führungskraft" : "Teammitglied",
      tasks: input.tasks || [],
      kpi_focus: input.kpiFocus || [],
    },
    profiles: {
      team: input.teamProfile,
      person: input.personProfile,
      role_soll: input.roleSoll?.enabled ? { enabled: true, ...input.roleSoll.profile } : { enabled: false, impulsiv: 0, intuitiv: 0, analytisch: 0 },
    },
    computed: {
      dominance_team: result.dominanceTeam,
      dominance_person: result.dominancePerson,
      DG: result.scores.DG,
      DC: result.scores.DC,
      RG: result.scores.RG,
      TS: result.scores.TS,
      CI: result.scores.CI,
      intensity_level: result.intensityLevel,
      shift_type: result.shiftType,
      shift_axis: result.shiftAxis,
      steering_need: result.steeringNeed,
    },
    levers: input.levers.map(l => ({ id: l.id, enabled: l.enabled })),
  };
}

export { normalizeTriad, dominanceModeOf, labelComponent, dominanceLabel };
export type { ComponentKey, Triad, DominanceResult };
