import {
  type ComponentKey, type Triad, type DominanceResult,
  normalizeTriad, dominanceModeOf, labelComponent, dominanceLabel,
} from "./jobcheck-engine";

export type DominanceType = "IMPULSIV" | "INTUITIV" | "ANALYTISCH" | "MIX";
export type IntensityLevel = "NIEDRIG" | "MITTEL" | "HOCH";
export type ShiftType = "VERSTAERKUNG" | "ERGAENZUNG" | "REIBUNG" | "SPANNUNG" | "TRANSFORMATION" | "HYBRID";
export type TrafficLight = "GREEN" | "YELLOW" | "RED";
export type ViewMode = "CEO" | "HR" | "TEAMLEITUNG";

export type DepartmentType =
  | "VERTRIEB"
  | "ENTWICKLUNG"
  | "HR"
  | "FINANZEN"
  | "MARKETING"
  | "OPERATIONS"
  | "KUNDENSERVICE"
  | "STRATEGIE"
  | "ALLGEMEIN";

export type DepartmentWeight = {
  impulsiv: number;
  intuitiv: number;
  analytisch: number;
};

export type DepartmentInfo = {
  id: DepartmentType;
  label: string;
  focus: string;
  weight: DepartmentWeight;
  criticalComponent: ComponentKey;
  criticalLabel: string;
};

const DEPARTMENT_CATALOG: Record<DepartmentType, DepartmentInfo> = {
  VERTRIEB: {
    id: "VERTRIEB", label: "Vertrieb / Sales", focus: "Abschlussstärke, Tempo, Durchsetzung",
    weight: { impulsiv: 0.50, intuitiv: 0.30, analytisch: 0.20 },
    criticalComponent: "impulsiv", criticalLabel: "Abschlussstärke und Tempo",
  },
  ENTWICKLUNG: {
    id: "ENTWICKLUNG", label: "Entwicklung / Engineering", focus: "Struktur, Planung, Qualitätssicherung",
    weight: { impulsiv: 0.15, intuitiv: 0.25, analytisch: 0.60 },
    criticalComponent: "analytisch", criticalLabel: "Systematik und Prozessqualität",
  },
  HR: {
    id: "HR", label: "HR / People & Culture", focus: "Beziehungsaufbau, Kommunikation, Teamgefühl",
    weight: { impulsiv: 0.15, intuitiv: 0.55, analytisch: 0.30 },
    criticalComponent: "intuitiv", criticalLabel: "Beziehungsfähigkeit und Kommunikation",
  },
  FINANZEN: {
    id: "FINANZEN", label: "Finanzen / Controlling", focus: "Absicherung, Prozesse, Genauigkeit",
    weight: { impulsiv: 0.10, intuitiv: 0.20, analytisch: 0.70 },
    criticalComponent: "analytisch", criticalLabel: "Absicherung und Genauigkeit",
  },
  MARKETING: {
    id: "MARKETING", label: "Marketing / Kreativ", focus: "Gespür für Trends, schnelle Umsetzung",
    weight: { impulsiv: 0.35, intuitiv: 0.40, analytisch: 0.25 },
    criticalComponent: "intuitiv", criticalLabel: "Gespür und Kreativität",
  },
  OPERATIONS: {
    id: "OPERATIONS", label: "Operations / Produktion", focus: "Effizienz, Geschwindigkeit, Prozesse",
    weight: { impulsiv: 0.35, intuitiv: 0.15, analytisch: 0.50 },
    criticalComponent: "analytisch", criticalLabel: "Effizienz und Prozessstabilität",
  },
  KUNDENSERVICE: {
    id: "KUNDENSERVICE", label: "Kundenservice / Support", focus: "Empathie, Geduld, Lösungsorientierung",
    weight: { impulsiv: 0.20, intuitiv: 0.50, analytisch: 0.30 },
    criticalComponent: "intuitiv", criticalLabel: "Empathie und Lösungsorientierung",
  },
  STRATEGIE: {
    id: "STRATEGIE", label: "Strategie / Geschäftsführung", focus: "Entscheidungskraft, Weitblick, Steuerung",
    weight: { impulsiv: 0.40, intuitiv: 0.25, analytisch: 0.35 },
    criticalComponent: "impulsiv", criticalLabel: "Entscheidungskraft und Steuerung",
  },
  ALLGEMEIN: {
    id: "ALLGEMEIN", label: "Allgemein / Kein Fokus", focus: "Gleichgewichtige Anforderung",
    weight: { impulsiv: 0.33, intuitiv: 0.34, analytisch: 0.33 },
    criticalComponent: "intuitiv", criticalLabel: "Ausgeglichene Anforderung",
  },
};

function getDepartmentCatalog(): DepartmentInfo[] {
  return Object.values(DEPARTMENT_CATALOG);
}

function getDepartmentInfo(type: DepartmentType): DepartmentInfo {
  return DEPARTMENT_CATALOG[type] || DEPARTMENT_CATALOG.ALLGEMEIN;
}

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

export type TeamSize = "KLEIN" | "MITTEL" | "GROSS";

export type RollenDnaContext = {
  beruf: string;
  bereich: string;
  fuehrungstyp: string;
  aufgabencharakter: string;
  arbeitslogik: string;
  taetigkeiten: string[];
  erfolgsfokus: string[];
};

export type TeamDynamikInput = {
  teamName: string;
  teamProfile: Triad;
  teamSize: TeamSize;
  personProfile: Triad;
  isLeading: boolean;
  departmentType: DepartmentType;
  roleSoll?: { enabled: boolean; profile: Triad };
  tasks?: string[];
  kpiFocus?: string[];
  levers: Lever[];
  steeringOverride?: string | null;
  rollenDna?: RollenDnaContext | null;
};

export type StressShift = {
  controlledTeam: Triad;
  uncontrolledTeam: Triad;
  controlledPerson: Triad;
  uncontrolledPerson: Triad;
  stressIntensity: number;
  controlledTS: number;
  uncontrolledTS: number;
  tsDeltaControlled: number;
  tsDeltaUncontrolled: number;
  stabilityRating: "STABIL" | "LABIL" | "KRITISCH";
  summary: string;
};

export type Scores = {
  DG: number;
  DC: number;
  RG: number | null;
  TS: number;
  CI: number;
};

export type DepartmentFit = {
  department: DepartmentInfo;
  teamFitScore: number;
  personFitScore: number;
  teamGapComponent: ComponentKey | null;
  teamGapAmount: number;
  personGapComponent: ComponentKey | null;
  personGapAmount: number;
  warnings: string[];
  contextNote: string;
};

export type LeadershipLever = {
  title: string;
  description: string;
  priority: "hoch" | "mittel" | "niedrig";
};

export type IntegrationPhase = {
  phaseId: string;
  title: string;
  days: string;
  focus: string;
  actions: string[];
};

export type ComponentChanceRisk = {
  component: string;
  personValue: number;
  teamValue: number;
  delta: number;
  chance: string;
  risk: string;
};

export type LeadershipContext = {
  personLabel: string;
  personStrengths: string;
  teamLabel: string;
  teamCharacter: string;
  fitSummary: string;
  coreChallenge: string;
  coreChance: string;
  actionFocus: string;
  leadershipLevers: LeadershipLever[];
  integrationPlan30: IntegrationPhase[];
  componentChancesRisks: ComponentChanceRisk[];
  roleContext: {
    beruf: string;
    bereich: string;
    fuehrungstyp: string;
    aufgabencharakter: string;
    arbeitslogik: string;
    roleFitStatement: string;
    roleRisk: string;
    keyTasks: string[];
    erfolgsfokusContext: {
      labels: string[];
      fitStatement: string;
      teamAlignment: string;
      steeringHint: string;
    } | null;
  } | null;
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
  departmentFit: DepartmentFit | null;
  stressShift: StressShift;
  leadershipContext: LeadershipContext | null;
};

const DEFAULT_LEVERS: Lever[] = [
  { id: "timebox", label: "Entscheidungszeitfenster definiert", description: "Klare Fristen für Entscheidungen verhindern Endlosschleifen und Konsensverschleppung.", enabled: false },
  { id: "8020", label: "80/20-Qualitätsstandard festgelegt", description: "Definierter Qualitätsstandard verhindert Über-Perfektionierung und hält das Tempo.", enabled: false },
  { id: "weekly_review", label: "Wöchentlicher Priorisierungsreview", description: "Regelmässige Überprüfung schafft Steuerungssicherheit und verhindert stille Abweichungen.", enabled: false },
  { id: "role_boundaries", label: "Entscheidungs- und Verantwortungsgrenzen", description: "Klare Rollen- und Entscheidungsgrenzen reduzieren Konflikte und Doppelarbeit.", enabled: false },
  { id: "comm_rules", label: "Sach-/Beziehungsebene, Feedbackregeln", description: "Feste Kommunikationsregeln trennen Sachfragen von Beziehungsdynamik.", enabled: false },
  { id: "pulse_check", label: "Teamtemperatur-Check", description: "Regelmässiger Pulse-Check macht Stimmung und Belastung messbar.", enabled: false },
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
  { id: "MIX-IMP", label: "Hybrid trifft Tempo", micro: "Flexibel vs Druck", systemlage: "Ausgeglichenes Profil trifft auf tempogetriebenes Umfeld. Fehlende Leitstärke kann bei hohem Umsetzungsdruck zum Engpass werden.", alltag: "Entscheidungen werden situativ statt systematisch getroffen. Das Team erwartet klare Richtung, erhält aber wechselnde Impulse.", tun: "Klare Priorisierungslogik definieren, Entscheidungstempo-Regeln setzen, eine dominante Arbeitsweise als Standard festlegen." },
  { id: "MIX-INT", label: "Hybrid trifft Beziehung", micro: "Flexibel vs Konsens", systemlage: "Ausgeglichenes Profil trifft auf beziehungsorientiertes Umfeld. Die fehlende klare Handschrift kann als Unsicherheit wahrgenommen werden.", alltag: "Das Team erwartet emotionale Führung und Klarheit. Wechselnde Prioritäten erzeugen Verunsicherung statt Stabilität.", tun: "Beziehungspflege ritualisieren, Kommunikationsregeln festlegen, Verlässlichkeit durch feste Routinen herstellen." },
  { id: "MIX-ANA", label: "Hybrid trifft Struktur", micro: "Flexibel vs Absicherung", systemlage: "Ausgeglichenes Profil trifft auf strukturorientiertes Umfeld. Fehlende Prozessklarheit kollidiert mit dem Absicherungsbedürfnis des Teams.", alltag: "Das Team erwartet klare Standards und Prozesse. Situative Entscheidungen werden als inkonsequent erlebt.", tun: "Standards und Qualitäts-Gates klar definieren, Entscheidungskriterien festlegen, Prozessrahmen vor Flexibilität stellen." },
  { id: "IMP-MIX", label: "Tempo trifft Hybrid", micro: "Druck vs Flexibel", systemlage: "Tempo und Durchsetzung treffen auf ein ausgeglichenes Team ohne klare Dominanz. Umsetzungsdruck fehlt ein stabiler Gegenpol.", alltag: "Führungsdruck wird unterschiedlich aufgenommen. Teile des Teams folgen, andere reagieren mit Rückzug oder Widerstand.", tun: "Teamstruktur klären, Rollen und Verantwortungen explizit machen, Entscheidungslogik vereinheitlichen." },
  { id: "INT-MIX", label: "Beziehung trifft Hybrid", micro: "Konsens vs Flexibel", systemlage: "Beziehungsorientierung trifft auf ein ausgeglichenes Team. Konsenssuche kann bei fehlender Teamstruktur zu Endlosschleifen führen.", alltag: "Abstimmungsrunden dauern länger, weil kein klarer Gegenpol existiert. Entscheidungen werden aufgeschoben.", tun: "Entscheidungsfristen setzen, klare Verantwortlichkeiten definieren, Ergebnisorientierung stärken." },
  { id: "ANA-MIX", label: "Struktur trifft Hybrid", micro: "Absicherung vs Flexibel", systemlage: "Strukturorientierung trifft auf ein ausgeglichenes Team. Prozessanforderungen können als Übersteuerung wahrgenommen werden.", alltag: "Teile des Teams akzeptieren Strukturvorgaben, andere empfinden sie als Einengung. Inkonsistente Reaktion auf Standards.", tun: "Strukturrahmen klar, aber flexibel gestalten. Entscheidungsautonomie in definierten Grenzen ermöglichen." },
  { id: "MIX-MIX", label: "Doppelte Hybridlage", micro: "Flexibel trifft Flexibel", systemlage: "Beide Seiten haben kein klares Profil. Entscheidungslogik und Prioritäten wechseln situativ – Vorhersagbarkeit ist gering.", alltag: "Hohe Anpassungsfähigkeit, aber keine stabile Arbeitsweise. Richtungswechsel sind häufig, klare Leitplanken fehlen.", tun: "Feste Entscheidungsregeln und Standards definieren. Prioritäten regelmässig reviewen. Klare Verantwortungsstrukturen setzen." },
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

function sizeAmplifier(size: TeamSize): number {
  if (size === "KLEIN") return 1.20;
  if (size === "MITTEL") return 1.00;
  return 0.85;
}

function transformationScore(DG: number, DC: number, RG: number | null, isLeading: boolean, teamSize: TeamSize): number {
  const LF = leadershipFactor(isLeading);
  const amp = sizeAmplifier(teamSize);

  let TS: number;
  if (RG !== null) {
    TS = amp * (0.45 * DG + 0.25 * DC + 0.20 * RG) + 0.07 * LF;
  } else {
    TS = amp * (0.55 * DG + 0.25 * DC) + 0.17 * LF;
  }

  return Math.round(Math.min(100, Math.max(0, TS)));
}

function intensityLevel(TS: number): IntensityLevel {
  if (TS <= 25) return "NIEDRIG";
  if (TS <= 50) return "MITTEL";
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

function profileExtremity(p: Triad): number {
  return Math.max(p.impulsiv, p.intuitiv, p.analytisch);
}

function shiftType(domTeam: DominanceType, domPerson: DominanceType, DG: number, DC: number, TS: number, isLeading: boolean, personProfile?: Triad): ShiftType {
  const level = intensityLevel(TS);
  const extP = personProfile ? profileExtremity(personProfile) : 0;

  if (DG < 5) {
    return "VERSTAERKUNG";
  }

  if (DC === 100 && DG >= 30) {
    return isLeading ? "TRANSFORMATION" : "SPANNUNG";
  }

  if (DC === 100) {
    return "REIBUNG";
  }

  if (DC === 0 && DG >= 40) {
    return isLeading ? "TRANSFORMATION" : "SPANNUNG";
  }

  if (DC === 0 && DG >= 25) {
    return "REIBUNG";
  }

  if (DC === 0 && extP >= 75 && DG >= 20) {
    return "REIBUNG";
  }

  if (DC === 0) {
    if (DG < 15) return "VERSTAERKUNG";
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
  if (st === "TRANSFORMATION" || st === "SPANNUNG") return "RED";
  if (st === "REIBUNG" && level === "HOCH") return "RED";
  if (st === "REIBUNG" || level === "MITTEL" || steeringNeed === "MITTEL") return "YELLOW";
  if (steeringNeed === "HOCH" || level === "HOCH") return "RED";
  return "GREEN";
}

function matrixCellId(leadDom: DominanceType, teamDom: DominanceType): string {
  const map: Record<DominanceType, string> = { IMPULSIV: "IMP", INTUITIV: "INT", ANALYTISCH: "ANA", MIX: "MIX" };
  return `${map[leadDom]}-${map[teamDom]}`;
}

function buildHeadline(st: ShiftType, domTeam: DominanceType, domPerson: DominanceType, isLeading: boolean): string {
  const tMap: Record<DominanceType, string> = { IMPULSIV: "umsetzungsorientiertes", INTUITIV: "beziehungsorientiertes", ANALYTISCH: "strukturorientiertes", MIX: "ausgeglichenes" };
  const role = isLeading ? "Die neue Führung" : "Die neue Person";

  switch (st) {
    case "VERSTAERKUNG": return `Arbeitsweisen passen gut zusammen. Führung und Team verfolgen ähnliche Prioritäten und Entscheidungslogiken.`;
    case "ERGAENZUNG": return `${role} bringt eine ergänzende Arbeitsweise ins ${tMap[domTeam]} Team. Zusammenarbeit stabil.`;
    case "REIBUNG": return `Unterschiedliche Arbeitsweisen treffen aufeinander. ${role} arbeitet anders als das Team es gewohnt ist. Das führt zu mehr Abstimmung und gelegentlichen Spannungen.`;
    case "SPANNUNG":
    case "TRANSFORMATION": return isLeading
      ? `Die neue Führung verändert die bisherige Arbeitsweise deutlich. Entscheidungen, Prioritäten und Qualitätsmassstäbe werden anders gesetzt als bisher.`
      : `Arbeitslogiken unterscheiden sich stark. Ohne Führung entstehen Leistungs- und Konfliktrisiken.`;
    case "HYBRID": return `Unterschiedliche Arbeitsweisen treffen aufeinander. ${role} arbeitet anders als das Team es gewohnt ist. Mehr Abstimmungsbedarf im Alltag.`;
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
  const role = isLeading ? "der neuen Führung" : "der neuen Person";

  switch (st) {
    case "VERSTAERKUNG": return `Arbeitsweisen passen gut zusammen. Entscheidungen werden schnell akzeptiert. Abstimmungen verlaufen reibungslos. Keine besonderen Anpassungen notwendig. Normale Führung ist ausreichend.`;
    case "ERGAENZUNG": return `Die neue Arbeitsweise ergänzt das Team um fehlende Perspektiven. Moderate Abstimmung empfehlenswert.`;
    case "REIBUNG": return `Unterschiedliche Arbeitsweisen treffen aufeinander. Entscheidungen dauern teilweise länger. Prioritäten müssen klarer erklärt werden. Mehr Abstimmungsbedarf im Alltag. Mit klaren Regeln bleibt das System stabil.`;
    case "SPANNUNG":
    case "TRANSFORMATION": return `Gewohnte Abläufe verändern sich spürbar. Diskussionen über Prioritäten nehmen zu. Widerstand oder Unsicherheit im Team möglich. Ohne klare Führung entsteht Instabilität.`;
    default: return `Unterschiedliche Arbeitsweisen treffen aufeinander. Mehr Abstimmungsbedarf im Alltag. Mit klaren Regeln bleibt das System stabil.`;
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
      "Steuerungsmassnahmen verstetigen.",
      "Gesamtbewertung der Integration.",
    ]},
  ];
}

function buildLeadershipLevers(domPerson: DominanceType, domTeam: DominanceType, shiftT: ShiftType): LeadershipLever[] {
  const levers: LeadershipLever[] = [];

  const comboLevers: Record<string, LeadershipLever[]> = {
    "IMPULSIV-INTUITIV": [
      { title: "Beziehungsrituale einführen", description: "Wöchentliche Teamrunde mit persönlichem Check-in. Das Team braucht Beziehungszeit, die die Führungskraft von sich aus nicht priorisiert.", priority: "hoch" },
      { title: "Entscheidungstempo regulieren", description: "Für Kernentscheidungen bewusst 24h Reflexionszeit einplanen. Das Team muss Tempo akzeptieren, aber die Führungskraft muss Dialog zulassen.", priority: "hoch" },
      { title: "Delegationsklarheit schaffen", description: "Entscheidungsbefugnisse schriftlich definieren: Was entscheidet die Führungskraft allein, was im Team? Reduziert stille Frustration.", priority: "mittel" },
      { title: "Feedback-Asymmetrie ausgleichen", description: "Aktiv nach emotionaler Stimmung fragen, nicht nur nach Ergebnissen. Das Team kommuniziert Belastung über Beziehungssignale.", priority: "mittel" },
    ],
    "IMPULSIV-ANALYTISCH": [
      { title: "80/20-Qualitätsstandard definieren", description: "Gemeinsam festlegen, welche Prozesse 100% Qualität brauchen und wo 80% reichen. Verhindert Überkontrolle und Tempoverlust.", priority: "hoch" },
      { title: "Entscheidungszeitfenster setzen", description: "Maximale Entscheidungsdauer pro Thema definieren. Das Team braucht Analysezeit, die Führungskraft will Geschwindigkeit.", priority: "hoch" },
      { title: "Priorisierung visualisieren", description: "Kanban oder ähnliches Tool einführen: Das Team sieht Prioritäten, die Führungskraft sieht Fortschritt. Reduziert Nachfragen.", priority: "mittel" },
      { title: "Review-Rhythmus mit Zeitlimit", description: "Feste Review-Termine mit klarem Zeitrahmen. Das Team bekommt Qualitätsraum, die Führungskraft behält das Tempo.", priority: "mittel" },
    ],
    "INTUITIV-IMPULSIV": [
      { title: "Entscheidungsfristen verbindlich machen", description: "Das Team erwartet schnelle Ansagen. Konsenssuche als Führungsstil wird als Zögern interpretiert. Klare Deadlines setzen.", priority: "hoch" },
      { title: "Ergebnisorientierung sichtbar integrieren", description: "Jedes Meeting mit konkretem Ergebnis beenden. Das Team misst Führung an Output, nicht an Prozessqualität.", priority: "hoch" },
      { title: "Eskalationswege definieren", description: "Wann wird diskutiert, wann entscheidet die Führungskraft allein? Klare Regeln verhindern Blockaden und Frust.", priority: "mittel" },
      { title: "Erfolge sichtbar machen", description: "Quick Wins dokumentieren und kommunizieren. Stärkt die Akzeptanz der Führungskraft im ergebnisorientierten Team.", priority: "mittel" },
    ],
    "INTUITIV-ANALYTISCH": [
      { title: "Prozess-Standards definieren", description: "Das Team erwartet klare Vorgaben, nicht Gesprächsangebote. Verbindliche Prozesse für Kernthemen etablieren.", priority: "hoch" },
      { title: "Entscheidungslogik klären", description: "Wann wird im Konsens entschieden, wann per Vorgabe? Das Team braucht Vorhersehbarkeit, die Führungskraft Flexibilität.", priority: "hoch" },
      { title: "Review-Format standardisieren", description: "Feste Struktur für Rückmeldungen: Kennzahlen + Feedback. Das Team will Daten, die Führungskraft will Dialog.", priority: "mittel" },
      { title: "Beziehung über Kompetenz aufbauen", description: "Im analytischen Team entsteht Vertrauen über fachliche Qualität. Beziehungsangebote erst nach bewiesener Kompetenz.", priority: "mittel" },
    ],
    "ANALYTISCH-IMPULSIV": [
      { title: "Tempo-Standards balancieren", description: "Nicht alles absichern – klare Bereiche definieren, wo Geschwindigkeit vor Qualität geht. Das Team erwartet Bewegung.", priority: "hoch" },
      { title: "Kontrollmechanismen reduzieren", description: "Mikromanagement wird als Misstrauen gewertet. Ergebniskontrolle statt Prozesskontrolle einführen.", priority: "hoch" },
      { title: "Entscheidungsgeschwindigkeit erhöhen", description: "Bei 80% Datenlage entscheiden. Das Team verliert Respekt bei zu langer Analyse. Nachsteuern ist erlaubt.", priority: "mittel" },
      { title: "Innovation zulassen", description: "Strukturierte Freiräume für Experimente schaffen. Das Team braucht Raum für schnelle Tests ohne Genehmigungsschleifen.", priority: "mittel" },
    ],
    "ANALYTISCH-INTUITIV": [
      { title: "Beziehungsebene ritualisieren", description: "Wöchentliches persönliches Gespräch, nicht nur Sachthemen. Das Team braucht emotionale Anschlussfähigkeit.", priority: "hoch" },
      { title: "Feedback mit Wärme verbinden", description: "Sachliche Rückmeldung wird als Kälte empfunden. Feedback immer mit persönlicher Wertschätzung rahmen.", priority: "hoch" },
      { title: "Emotionale Signale lesen lernen", description: "Das Team kommuniziert Probleme über Stimmungsschwankungen, nicht über Berichte. Achtsame Beobachtung schulen.", priority: "mittel" },
      { title: "Teamevents nicht streichen", description: "Informelle Teamzeit ist kein Luxus, sondern Arbeitsinfrastruktur in beziehungsorientierten Teams.", priority: "mittel" },
    ],
  };

  const key = `${domPerson}-${domTeam}`;
  const specific = comboLevers[key];

  if (specific) {
    levers.push(...specific);
  } else if (domPerson === domTeam) {
    levers.push(
      { title: "Diversität bewusst einbauen", description: "Gleiche Dominanz verstärkt sich. Bewusst Gegenperspektiven einholen, z.B. durch externe Sparringspartner oder Rollen-Rotation.", priority: "hoch" },
      { title: "Blinde Flecken identifizieren", description: "Gemeinsam benennen, welche Kompetenzen im System fehlen. Entwicklungsmassnahmen gezielt auf schwächere Bereiche ausrichten.", priority: "hoch" },
      { title: "Korrektiv-Rolle definieren", description: "Eine Person im Team als bewusstes Korrektiv benennen, die andere Perspektiven einbringt.", priority: "mittel" },
      { title: "Regelmässige Systemreflexion", description: "Quartalsweise prüfen, ob einseitige Verstärkung zu Fehlentwicklungen führt.", priority: "niedrig" },
    );
  } else {
    levers.push(
      { title: "Erwartungen explizit klären", description: "Unterschiedliche Arbeitslogiken brauchen explizite Kommunikation über Prioritäten und Entscheidungswege.", priority: "hoch" },
      { title: "Erste 30 Tage strukturieren", description: "Klare Meilensteine für die Integration definieren. Ohne Struktur entsteht Unsicherheit auf beiden Seiten.", priority: "hoch" },
      { title: "Kommunikationsrhythmus festlegen", description: "Feste Formate für Update, Feedback und Eskalation vereinbaren.", priority: "mittel" },
      { title: "Erfolgsmetriken gemeinsam definieren", description: "Was bedeutet Erfolg für die Führungskraft und was für das Team? Alignment herstellen.", priority: "mittel" },
    );
  }

  if (shiftT === "TRANSFORMATION" || shiftT === "SPANNUNG") {
    levers.push({ title: "Change-Kommunikation etablieren", description: "Bei hoher Systemveränderung: Regelmässig den Stand kommunizieren, Unsicherheiten adressieren, Widerstände ernst nehmen.", priority: "hoch" });
  }

  return levers;
}

function buildIntegrationPlan30(domPerson: DominanceType, domTeam: DominanceType, shiftT: ShiftType): IntegrationPhase[] {
  const pLabel: Record<DominanceType, string> = {
    IMPULSIV: "ergebnisorientiert",
    INTUITIV: "beziehungsorientiert",
    ANALYTISCH: "strukturorientiert",
    MIX: "situativ",
  };
  const tLabel: Record<DominanceType, string> = {
    IMPULSIV: "tempoorientierten",
    INTUITIV: "beziehungsorientierten",
    ANALYTISCH: "strukturorientierten",
    MIX: "heterogenen",
  };

  const needsIntensiveSteering = shiftT === "SPANNUNG" || shiftT === "TRANSFORMATION";

  const phase1Actions: string[] = [
    "Einzelgespräche mit jedem Teammitglied führen – Erwartungen, Sorgen, aktuelle Prioritäten erfassen.",
    `Eigenen Führungsstil (${pLabel[domPerson]}) transparent machen: „So arbeite ich, das erwarte ich, das biete ich."`,
    `Teamlogik (${tLabel[domTeam]}) verstehen: Wie werden Entscheidungen bisher getroffen? Was funktioniert, was nicht?`,
    "Entscheidungswege und Eskalationsregeln definieren und kommunizieren.",
  ];
  if (needsIntensiveSteering) {
    phase1Actions.push("Veränderungsbereitschaft im Team einschätzen – Widerstände früh identifizieren, nicht ignorieren.");
  }

  const phase2Actions: string[] = [
    "Ein priorisiertes Thema auswählen und sichtbar voranbringen – nicht alles gleichzeitig verändern.",
    "Ersten Feedback-Loop etablieren: Kurzes wöchentliches Teamformat (max. 30 Min).",
    "Eigene Stärken gezielt einsetzen, um schnelle Wirkung zu zeigen.",
  ];
  if (domPerson !== domTeam) {
    phase2Actions.push(`Brücke bauen: Bewusst Elemente der ${tLabel[domTeam]} Teamlogik in die eigene Führung integrieren.`);
  }
  phase2Actions.push("Erste Erfolge dokumentieren und kommunizieren – Akzeptanz entsteht über Wirkung.");
  if (needsIntensiveSteering) {
    phase2Actions.push("Widerstände adressieren: Nicht umgehen, sondern ansprechen. Klarheit schafft Vertrauen.");
  }

  const phase3Actions: string[] = [
    "Reflexion: Was funktioniert, was nicht? Ehrliche Selbsteinschätzung und Team-Feedback einholen.",
    "Übersteuerung vermeiden – Kontrollgrad auf das notwendige Mass zurückfahren.",
    "Teamdynamik evaluieren: Hat sich das Zusammenspiel stabilisiert oder gibt es weiterhin Reibung?",
    "Steuerungsmassnahmen aus Phase 1-2 verstetigen oder anpassen.",
    "30-Tage-Bilanz ziehen: Integration bewertet, nächste Quartals-Ziele definieren.",
  ];
  if (needsIntensiveSteering) {
    phase3Actions.push("Transformationsfortschritt bewerten: Ist die Richtung klar? Braucht es externe Unterstützung?");
  }

  return [
    { phaseId: "P1", title: "Ankommen & Verstehen", days: "Tag 1–10", focus: "Die Führungskraft lernt das System kennen, baut erste Beziehungen auf und klärt Erwartungen.", actions: phase1Actions },
    { phaseId: "P2", title: "Wirken & Steuern", days: "Tag 11–20", focus: "Erste sichtbare Wirkung erzeugen, Führungslogik etablieren, Konflikte proaktiv adressieren.", actions: phase2Actions },
    { phaseId: "P3", title: "Stabilisieren & Justieren", days: "Tag 21–30", focus: "Ergebnisse sichern, Steuerung anpassen, Integration bewerten.", actions: phase3Actions },
  ];
}

function buildComponentChancesRisks(person: Triad, team: Triad): ComponentChanceRisk[] {
  const components: { key: ComponentKey; label: string }[] = [
    { key: "impulsiv", label: "Impulsiv (Umsetzung)" },
    { key: "intuitiv", label: "Intuitiv (Beziehung)" },
    { key: "analytisch", label: "Analytisch (Struktur)" },
  ];

  return components.map(({ key, label }) => {
    const pv = Math.round(person[key]);
    const tv = Math.round(team[key]);
    const delta = pv - tv;
    const absDelta = Math.abs(delta);

    let chance: string;
    let risk: string;

    if (absDelta <= 5) {
      chance = `Gleichlauf: Führungskraft und Team teilen die ${label.split(" ")[0]}-Ausprägung. Schnelle Anschlussfähigkeit in diesem Bereich.`;
      risk = `Kein Korrektiv: Wenn beide Seiten gleich stark (oder schwach) ausgeprägt sind, fehlt die gegenseitige Ergänzung.`;
    } else if (delta > 5) {
      if (key === "impulsiv") {
        chance = `Die Führungskraft bringt mehr Umsetzungsdruck als das Team. Das kann Tempo und Ergebnisorientierung steigern.`;
        risk = `Das Team empfindet den höheren Umsetzungsdruck als Stress. Ohne Dosierung entstehen Überforderung und Widerstand.`;
      } else if (key === "intuitiv") {
        chance = `Die Führungskraft bringt stärkere Beziehungskompetenz als das Team. Das kann Zusammenhalt und Kommunikation verbessern.`;
        risk = `Das Team erwartet Sachlichkeit und bekommt Beziehungsangebote. Führung wird möglicherweise als „zu weich" wahrgenommen.`;
      } else {
        chance = `Die Führungskraft bringt mehr Strukturkompetenz als das Team. Das kann Prozessqualität und Nachvollziehbarkeit erhöhen.`;
        risk = `Das Team empfindet zusätzliche Struktur als Kontrolle. Innovationsbereitschaft und Eigeninitiative können sinken.`;
      }
    } else {
      if (key === "impulsiv") {
        chance = `Das Team bringt mehr Umsetzungsstärke mit als die Führungskraft. Die Führungskraft kann sich auf Steuerung und Richtung konzentrieren.`;
        risk = `Das Team überholt die Führungskraft im Tempo. Entscheidungsautorität wird untergraben, wenn die Führungskraft nicht mithalten kann.`;
      } else if (key === "intuitiv") {
        chance = `Das Team hat stärkere Beziehungskompetenz als die Führungskraft. Teamdynamik reguliert sich teilweise selbst.`;
        risk = `Das Team erwartet emotionale Führung, die die Führungskraft nicht natürlich bietet. Bindungsverlust ist möglich.`;
      } else {
        chance = `Das Team bringt mehr Strukturkompetenz mit als die Führungskraft. Prozesse laufen auch ohne starke Kontrolle stabil.`;
        risk = `Die Führungskraft kann strukturelle Standards des Teams nicht halten. Qualitätserwartungen werden enttäuscht.`;
      }
    }

    if (absDelta >= 15) {
      risk += ` Δ${absDelta} Punkte – kritische Differenz: Gezielte Steuerung in diesem Bereich zwingend notwendig.`;
    } else if (absDelta >= 10) {
      risk += ` Δ${absDelta} Punkte – relevante Differenz: Bewusste Steuerung empfehlenswert.`;
    }

    return { component: label, personValue: pv, teamValue: tv, delta, chance, risk };
  });
}

function buildLeadershipContext(domPerson: DominanceType, domTeam: DominanceType, person: Triad, team: Triad, isLeading: boolean, shiftT: ShiftType, rollenDna?: RollenDnaContext | null): LeadershipContext | null {
  if (!isLeading) return null;

  const personTraits: Record<DominanceType, { label: string; strengths: string }> = {
    IMPULSIV: { label: "Impulsiv-dominant", strengths: "Tempo, Entscheidungsstärke, Ergebnisorientierung und Durchsetzungskraft" },
    INTUITIV: { label: "Intuitiv-dominant", strengths: "Beziehungsfähigkeit, Teamgefühl, Kommunikation und Konsensfindung" },
    ANALYTISCH: { label: "Analytisch-dominant", strengths: "Struktur, Planung, Qualitätssicherung und systematisches Vorgehen" },
    MIX: { label: "Ausgeglichen", strengths: "Situative Anpassungsfähigkeit, breites Handlungsspektrum, aber keine klare Leitlinie" },
  };

  const teamTraits: Record<DominanceType, { label: string; character: string }> = {
    IMPULSIV: { label: "tempoorientiert", character: "Das Team arbeitet schnell, entscheidet direkt und priorisiert Ergebnisse. Abstimmung passiert kurz und pragmatisch." },
    INTUITIV: { label: "beziehungsorientiert", character: "Das Team arbeitet über Abstimmung, Dialog und gemeinsame Entscheidungsfindung. Beziehungen sind die Basis der Zusammenarbeit." },
    ANALYTISCH: { label: "strukturorientiert", character: "Das Team arbeitet prozessorientiert, absichernd und qualitätsbewusst. Standards und Nachvollziehbarkeit stehen im Fokus." },
    MIX: { label: "ohne klare Dominanz", character: "Das Team hat kein einheitliches Arbeitsmuster. Reaktionen und Prioritäten variieren je nach Situation und Person." },
  };

  const pT = personTraits[domPerson];
  const tT = teamTraits[domTeam];

  const sorted = [
    { k: "impulsiv" as ComponentKey, v: person.impulsiv },
    { k: "intuitiv" as ComponentKey, v: person.intuitiv },
    { k: "analytisch" as ComponentKey, v: person.analytisch },
  ].sort((a, b) => b.v - a.v);
  const second = sorted[1];
  const secondLabel: Record<ComponentKey, string> = {
    impulsiv: "Umsetzungsorientierung",
    intuitiv: "Beziehungsorientierung",
    analytisch: "Strukturorientierung",
  };

  const personStrengths = domPerson === "MIX"
    ? pT.strengths
    : `${pT.strengths}. Sekundär: ${secondLabel[second.k]} (${Math.round(second.v)} %)`;

  let fitSummary: string;
  let coreChallenge: string;
  let coreChance: string;
  let actionFocus: string;

  if (domPerson === domTeam && domPerson !== "MIX") {
    fitSummary = "Führungskraft und Team teilen dieselbe Arbeitslogik. Die Führung wird schnell akzeptiert, weil Prioritäten und Entscheidungsstil übereinstimmen.";
    coreChallenge = "Einseitige Verstärkung: Blinde Flecken bei den nachrangigen Kompetenzen bleiben unbearbeitet. Fehlende Korrektive können sich langfristig auswirken.";
    coreChance = "Schnelle Integration, hohe Akzeptanz, stabile Entscheidungswege. Die Führungskraft kann sofort wirksam steuern.";
    actionFocus = "Bewusst Impulse für die schwächeren Bereiche setzen, um langfristige Einseitigkeit zu vermeiden.";
  } else if (shiftT === "ERGAENZUNG") {
    fitSummary = "Die Führungskraft ergänzt das Team um fehlende Perspektiven. Die Zusammenarbeit braucht anfangs mehr Abstimmung, wird aber langfristig breiter aufgestellt.";
    coreChallenge = "Das Team muss sich auf einen neuen Führungsstil einstellen. Erwartungen an Tempo, Kommunikation oder Struktur können kurzfristig kollidieren.";
    coreChance = "Neue Impulse für Entscheidungsfindung. Blinde Flecken werden adressiert. Langfristig entsteht ein ausgewogeneres Gesamtsystem.";
    actionFocus = "Erwartungen früh klären, Kommunikationswege definieren, erste Erfolge sichtbar machen.";
  } else {
    const fitPairs: Record<string, { fit: string; challenge: string; chance: string; action: string }> = {
      "IMPULSIV-INTUITIV": {
        fit: "Die Führungskraft priorisiert Tempo und Ergebnisse. Das Team arbeitet über Beziehung und Dialog. Diese Kombination erzeugt Spannung zwischen Ergebnisdruck und Abstimmungsbedarf.",
        challenge: "Das Team empfindet die Führung als zu direkt und druckvoll. Wichtige Beziehungspflege droht unter dem Ergebnisfokus zu leiden.",
        chance: "Wenn Ergebnisorientierung mit Beziehungspflege kombiniert wird, entsteht ein leistungsstarkes und gleichzeitig stabiles Team.",
        action: "Beziehungsebene ritualisieren (z.B. wöchentliche Teamrunde), Ergebnisziele klar kommunizieren, Entscheidungszeitfenster setzen.",
      },
      "IMPULSIV-ANALYTISCH": {
        fit: "Die Führungskraft will schnelle Ergebnisse. Das Team braucht Struktur und Absicherung. Tempo trifft auf Qualitätsanspruch.",
        challenge: "Das Team empfindet die Führung als unstrukturiert. Qualitätsverlust durch überhöhtes Tempo ist ein reales Risiko.",
        chance: "Wenn Tempo durch klare Standards abgesichert wird, entsteht ein effizientes System mit hoher Umsetzungsgeschwindigkeit und Qualität.",
        action: "80/20-Qualitätsstandard festlegen, Priorisierungsregeln definieren, Review-Rhythmus mit klarem Zeitlimit einführen.",
      },
      "INTUITIV-IMPULSIV": {
        fit: "Die Führungskraft setzt auf Dialog und Konsens. Das Team arbeitet umsetzungs- und ergebnisorientiert. Das Team erwartet schnelle, klare Ansagen.",
        challenge: "Das Team empfindet die Führung als zögerlich. Entscheidungsverzögerung durch Konsensbedürfnis bremst die Umsetzung.",
        chance: "Wenn die Führungskraft klare Entscheidungen mit Beziehungsintelligenz verbindet, steigt sowohl Akzeptanz als auch Bindung im Team.",
        action: "Entscheidungsfristen verbindlich machen, Ergebnisorientierung sichtbar integrieren, Klarheit über Eskalationswege schaffen.",
      },
      "INTUITIV-ANALYTISCH": {
        fit: "Die Führungskraft priorisiert Beziehung und Abstimmung. Das Team erwartet klare Strukturen und Prozesse. Abstimmungsschleifen kollidieren mit Prozesseffizienz.",
        challenge: "Das Team erwartet klare Vorgaben und bekommt Gesprächsangebote. Prozesseffizienz leidet unter zu viel Abstimmung.",
        chance: "Wenn Struktur und Beziehungspflege zusammenwirken, entsteht ein Team mit hoher Verbindlichkeit und gleichzeitig stabiler Qualität.",
        action: "Prozess-Standards definieren, Entscheidungslogik klären (wann Konsens, wann Vorgabe), Review-Format standardisieren.",
      },
      "ANALYTISCH-IMPULSIV": {
        fit: "Die Führungskraft bringt Struktur und Absicherung. Das Team ist tempoorientiert und ergebnisorientiert. Prozessqualität kollidiert mit Geschwindigkeitserwartung.",
        challenge: "Das Team empfindet neue Prozesse als Bremse. Kontrolle wird als Misstrauen interpretiert. Innovationsverlust durch Über-Strukturierung.",
        chance: "Wenn Standards und Tempo ausbalanciert werden, entsteht ein leistungsstarkes System mit klarer Prozessqualität.",
        action: "80/20-Standard festlegen, Entscheidungszeitfenster definieren, Priorisierungsregeln für Qualität vs. Tempo vereinbaren.",
      },
      "ANALYTISCH-INTUITIV": {
        fit: "Die Führungskraft priorisiert Fakten und Struktur. Das Team lebt über Beziehung und Kommunikation. Sachlichkeit trifft auf Nähe-Bedürfnis.",
        challenge: "Das Team nimmt emotionale Distanz wahr. Faktenorientierung wird als Kälte empfunden. Bindungsverlust ist ein reales Risiko.",
        chance: "Wenn Sachlichkeit mit bewusster Beziehungspflege kombiniert wird, entsteht ein professionelles und gleichzeitig menschliches Arbeitsumfeld.",
        action: "Beziehungsebene ritualisieren, regelmässiges Feedback einführen, emotionale Anschlussfähigkeit bewusst gestalten.",
      },
    };

    const key = `${domPerson}-${domTeam}`;
    const pair = fitPairs[key] || {
      fit: "Die Führungskraft und das Team arbeiten in unterschiedlichen Logiken. Das erfordert bewusste Steuerung und klare Kommunikation.",
      challenge: "Unterschiedliche Erwartungen an Arbeitsweise und Entscheidungsfindung erzeugen Reibungspunkte im Alltag.",
      chance: "Die unterschiedliche Perspektive kann das System bereichern, wenn die Zusammenarbeit aktiv gestaltet wird.",
      action: "Klare Rollen, Entscheidungswege und Kommunikationsregeln von Anfang an etablieren.",
    };

    fitSummary = pair.fit;
    coreChallenge = pair.challenge;
    coreChance = pair.chance;
    actionFocus = pair.action;
  }

  let roleCtx: LeadershipContext["roleContext"] = null;

  if (rollenDna && rollenDna.beruf) {
    const beruf = rollenDna.beruf;
    const bereich = rollenDna.bereich;
    const fuehrungstyp = rollenDna.fuehrungstyp;
    const aufgabencharakter = rollenDna.aufgabencharakter;
    const arbeitslogik = rollenDna.arbeitslogik;
    const keyTasks = rollenDna.taetigkeiten.slice(0, 5);

    const arbeitslogikMap: Record<string, string> = {
      "Ergebnis & Umsetzung": "ergebnisorientiert – Geschwindigkeit, Abschlüsse und messbare Resultate stehen im Fokus",
      "Beziehung & Zusammenarbeit": "beziehungsorientiert – Kommunikation, Teamdynamik und gemeinsame Entscheidungsfindung stehen im Fokus",
      "Struktur & Analyse": "strukturorientiert – Planung, Qualitätssicherung und systematisches Vorgehen stehen im Fokus",
    };

    const aufgabenMap: Record<string, string> = {
      "Operativ": "operativer Fokus",
      "Strategisch": "strategischer Fokus",
      "Beides": "operativer und strategischer Fokus",
    };

    const logikDesc = arbeitslogikMap[arbeitslogik] || `Arbeitslogik: ${arbeitslogik}`;
    const aufgabenDesc = aufgabenMap[aufgabencharakter] || aufgabencharakter;

    const roleLogikDom: DominanceType = arbeitslogik === "Ergebnis & Umsetzung" ? "IMPULSIV"
      : arbeitslogik === "Beziehung & Zusammenarbeit" ? "INTUITIV"
      : arbeitslogik === "Struktur & Analyse" ? "ANALYTISCH" : "MIX";

    let roleFitStatement: string;
    let roleRisk: string;

    if (roleLogikDom === domPerson) {
      roleFitStatement = `Die Rolle „${beruf}" verlangt eine ${logikDesc}. Das Profil der Führungskraft passt direkt zu dieser Anforderung – die Kernkompetenzen decken sich mit dem Rollenfokus.`;
      if (roleLogikDom !== domTeam) {
        roleRisk = `Die Rolle passt zur Führungskraft, aber das Team arbeitet in einer anderen Logik. Die Führungskraft muss das Team mitnehmen, ohne den Rollenfokus zu verlieren.`;
      } else {
        roleRisk = `Führungskraft, Team und Rolle arbeiten in derselben Logik. Risiko: Einseitige Verstärkung ohne Korrektur der blinden Flecken.`;
      }
    } else if (roleLogikDom === domTeam) {
      roleFitStatement = `Die Rolle „${beruf}" verlangt eine ${logikDesc}. Das Team bringt diese Kompetenz mit, aber die Führungskraft arbeitet in einer anderen Logik. Sie muss die Rollenanforderung aktiv steuern, ohne sie selbst natürlich auszufüllen.`;
      roleRisk = `Die Führungskraft kann die Rollenanforderung nicht aus dem eigenen Profil heraus bedienen. Ohne bewusste Anpassung entsteht eine Steuerungslücke.`;
    } else {
      roleFitStatement = `Die Rolle „${beruf}" verlangt eine ${logikDesc}. Weder Führungskraft noch Team bringen diese Kompetenz als Schwerpunkt mit. Das erfordert bewusste Steuerung und klare Prioritätensetzung.`;
      roleRisk = `Kernkompetenz der Rolle ist weder bei der Führungskraft noch im Team dominant. Ohne externe Unterstützung oder gezielte Entwicklung droht eine strukturelle Lücke.`;
    }

    const fuehrungsHint = fuehrungstyp !== "Keine"
      ? ` Die Rolle ist als ${fuehrungstyp}-Führung definiert (${aufgabenDesc}).`
      : ` Die Rolle hat ${aufgabenDesc}.`;

    roleFitStatement += fuehrungsHint;

    let erfolgsfokusCtx: { labels: string[]; fitStatement: string; teamAlignment: string; steeringHint: string } | null = null;
    const ef = rollenDna.erfolgsfokus;
    if (ef && ef.length > 0) {
      const fokusMap: Record<string, { dom: DominanceType; short: string }> = {
        "Ergebnis-/ Umsatzwirkung": { dom: "IMPULSIV", short: "Ergebnis & Umsatz" },
        "Beziehungs- und Netzwerkstabilität": { dom: "INTUITIV", short: "Beziehung & Netzwerk" },
        "Innovations- & Transformationsleistung": { dom: "IMPULSIV", short: "Innovation & Transformation" },
        "Prozess- und Effizienzqualität": { dom: "ANALYTISCH", short: "Prozess & Effizienz" },
        "Fachliche Exzellenz / Expertise": { dom: "ANALYTISCH", short: "Fachliche Exzellenz" },
        "Strategische Wirkung / Positionierung": { dom: "INTUITIV", short: "Strategische Wirkung" },
      };

      const mapped = ef.map(f => fokusMap[f]).filter((x): x is { dom: DominanceType; short: string } => !!x);
      const fokusDomsUnique: DominanceType[] = Array.from(new Set(mapped.map(m => m.dom)));
      const fokusLabels = mapped.map(m => m.short);

      const domLabels: Record<DominanceType, string> = {
        IMPULSIV: "Umsetzungsstärke und Geschwindigkeit",
        INTUITIV: "Beziehungskompetenz und Kommunikation",
        ANALYTISCH: "Struktur, Analyse und Prozessqualität",
        MIX: "ausgeglichene Kompetenzen",
      };

      const personCovers = fokusDomsUnique.filter(d => d === domPerson);
      const teamCovers = fokusDomsUnique.filter(d => d === domTeam);

      let fitStatement: string;
      let teamAlignment: string;
      let steeringHint: string;

      if (personCovers.length === fokusDomsUnique.length) {
        fitStatement = `Der Erfolgsfokus (${fokusLabels.join(", ")}) verlangt ${domLabels[fokusDomsUnique[0]]}. Das Profil der Führungskraft deckt diese Anforderung ab – sie kann den Erfolgsfokus aus eigener Stärke heraus bedienen.`;
      } else if (personCovers.length > 0) {
        const missing = fokusDomsUnique.filter(d => d !== domPerson).map(d => domLabels[d]);
        fitStatement = `Der Erfolgsfokus (${fokusLabels.join(", ")}) erfordert teilweise Kompetenzen ausserhalb des Führungsprofils. Die Führungskraft deckt einen Teil ab, aber ${missing.join(" und ")} muss sie aktiv steuern oder delegieren.`;
      } else {
        fitStatement = `Der Erfolgsfokus (${fokusLabels.join(", ")}) verlangt ${fokusDomsUnique.map(d => domLabels[d]).join(" und ")}. Die Führungskraft bringt diese Schwerpunkte nicht natürlich mit – sie muss den Erfolg über bewusste Steuerung und Teamressourcen sicherstellen.`;
      }

      if (teamCovers.length === fokusDomsUnique.length) {
        teamAlignment = `Das Team ist für den definierten Erfolgsfokus gut aufgestellt – die vorhandenen Kompetenzen passen zur geforderten Leistung.`;
      } else if (teamCovers.length > 0) {
        const teamMissing = fokusDomsUnique.filter(d => d !== domTeam).map(d => domLabels[d]);
        teamAlignment = `Das Team deckt den Erfolgsfokus teilweise ab. ${teamMissing.join(" und ")} ist im Team weniger ausgeprägt und muss gezielt gestärkt werden.`;
      } else {
        teamAlignment = `Der Erfolgsfokus liegt ausserhalb der natürlichen Teamstärke. Die Führungskraft muss die fehlende Kompetenz entweder selbst einbringen oder durch Strukturmassnahmen kompensieren.`;
      }

      if (personCovers.length === fokusDomsUnique.length && teamCovers.length === fokusDomsUnique.length) {
        steeringHint = `Führungskraft und Team passen beide zum Erfolgsfokus. Steuerungsbedarf ist gering – Fokus auf Richtung halten und Verstärkung nutzen.`;
      } else if (personCovers.length === 0 && teamCovers.length === 0) {
        steeringHint = `Weder Führungskraft noch Team passen natürlich zum Erfolgsfokus. Hoher Steuerungsbedarf: Externe Kompetenz, klare Prozesse und enge Zielverfolgung notwendig.`;
      } else {
        steeringHint = `Teilweise Abdeckung des Erfolgsfokus vorhanden. Steuerungsbedarf: Lücken gezielt schliessen – durch Delegation, Entwicklung oder Prozessanpassung.`;
      }

      erfolgsfokusCtx = { labels: fokusLabels, fitStatement, teamAlignment, steeringHint };
    }

    roleCtx = { beruf, bereich, fuehrungstyp, aufgabencharakter, arbeitslogik, roleFitStatement, roleRisk, keyTasks, erfolgsfokusContext: erfolgsfokusCtx };
  }

  return {
    personLabel: pT.label,
    personStrengths,
    teamLabel: tT.label,
    teamCharacter: tT.character,
    fitSummary,
    coreChallenge,
    coreChance,
    actionFocus,
    leadershipLevers: buildLeadershipLevers(domPerson, domTeam, shiftT),
    integrationPlan30: buildIntegrationPlan30(domPerson, domTeam, shiftT),
    componentChancesRisks: buildComponentChancesRisks(person, team),
    roleContext: roleCtx,
  };
}

function computeDepartmentFit(teamProfile: Triad, personProfile: Triad, deptType: DepartmentType, isLeading: boolean): DepartmentFit | null {
  if (deptType === "ALLGEMEIN") return null;

  const dept = getDepartmentInfo(deptType);
  const w = dept.weight;
  const MAX = 67;

  const compKeys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];

  function weightedFit(profile: Triad): number {
    let score = 0;
    for (const k of compKeys) {
      const normalized = profile[k] / MAX;
      score += w[k] * normalized;
    }
    return Math.round(score * 100);
  }

  function findGap(profile: Triad): { component: ComponentKey | null; amount: number } {
    const crit = dept.criticalComponent;
    const critValue = profile[crit];
    const critWeight = w[crit];

    if (critWeight >= 0.40 && critValue < 25) {
      return { component: crit, amount: Math.round(25 - critValue) };
    }
    if (critWeight >= 0.30 && critValue < 18) {
      return { component: crit, amount: Math.round(18 - critValue) };
    }
    return { component: null, amount: 0 };
  }

  const teamFit = weightedFit(teamProfile);
  const personFit = weightedFit(personProfile);
  const teamGap = findGap(teamProfile);
  const personGap = findGap(personProfile);

  const warnings: string[] = [];
  const compLabel: Record<ComponentKey, string> = { impulsiv: "Impulsiv", intuitiv: "Intuitiv", analytisch: "Analytisch" };

  if (teamGap.component) {
    warnings.push(`Team: ${compLabel[teamGap.component]} ist für ${dept.label} zu niedrig (fehlen ${teamGap.amount} Punkte). ${dept.criticalLabel} könnte leiden.`);
  }
  if (personGap.component) {
    const role = isLeading ? "Führungskraft" : "Neue Person";
    warnings.push(`${role}: ${compLabel[personGap.component]} ist für ${dept.label} zu niedrig (fehlen ${personGap.amount} Punkte). ${dept.criticalLabel} wird nicht ausreichend abgedeckt.`);
  }

  const teamDom = dominanceType(teamProfile);
  const personDom = dominanceType(personProfile);
  const critDom = dept.criticalComponent === "impulsiv" ? "IMPULSIV" : dept.criticalComponent === "intuitiv" ? "INTUITIV" : "ANALYTISCH";

  if (teamDom !== critDom && teamDom !== "MIX" && w[dept.criticalComponent] >= 0.40) {
    warnings.push(`Abteilungsziel erfordert ${dept.criticalLabel}, aber das Team ist ${compLabel[teamProfile.impulsiv >= teamProfile.intuitiv && teamProfile.impulsiv >= teamProfile.analytisch ? "impulsiv" : teamProfile.intuitiv >= teamProfile.analytisch ? "intuitiv" : "analytisch"]}-geprägt. Es fehlt strukturell an der nötigen Kernkompetenz.`);
  }

  let contextNote = "";
  if (deptType === "VERTRIEB") {
    contextNote = "Im Vertrieb sind Abschlussstärke und Entscheidungsgeschwindigkeit zentral. Ein zu stark analytisches oder intuitives Profil bremst den Umsetzungsdruck.";
  } else if (deptType === "ENTWICKLUNG") {
    contextNote = "In der Entwicklung stehen Systematik und Prozessqualität im Vordergrund. Zu viel Impulsivität kann Qualitätsstandards gefährden.";
  } else if (deptType === "HR") {
    contextNote = "Im HR-Bereich ist Beziehungsfähigkeit und Kommunikationsklarheit entscheidend. Ein zu stark impulsives oder analytisches Profil kann Distanz erzeugen.";
  } else if (deptType === "FINANZEN") {
    contextNote = "In Finanzen und Controlling stehen Absicherung und Genauigkeit im Mittelpunkt. Tempo ohne Struktur erzeugt hier Fehlerrisiken.";
  } else if (deptType === "MARKETING") {
    contextNote = "Im Marketing braucht es Gespür für Trends und kreative Impulse. Reine Strukturorientierung kann Innovationskraft bremsen.";
  } else if (deptType === "OPERATIONS") {
    contextNote = "In Operations zählen Effizienz und Prozessstabilität. Zu starke Beziehungsorientierung kann Tempo und Standards verwässern.";
  } else if (deptType === "KUNDENSERVICE") {
    contextNote = "Im Kundenservice sind Empathie und Lösungsorientierung entscheidend. Zu viel Tempo ohne Einfühlungsvermögen wirkt abweisend.";
  } else if (deptType === "STRATEGIE") {
    contextNote = "In der Strategieebene braucht es Entscheidungskraft und Weitblick. Zu starke Konsenorientierung verlangsamt notwendige Kursänderungen.";
  }

  return {
    department: dept,
    teamFitScore: teamFit,
    personFitScore: personFit,
    teamGapComponent: teamGap.component,
    teamGapAmount: teamGap.amount,
    personGapComponent: personGap.component,
    personGapAmount: personGap.amount,
    warnings,
    contextNote,
  };
}

export function getDefaultLevers(): Lever[] {
  return DEFAULT_LEVERS.map(l => ({ ...l }));
}

const STRESS_K = 8;
const MAX_BIO = 67;

function clamp(x: number, min = 0, max = MAX_BIO): number {
  return Math.max(min, Math.min(max, x));
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function sortKeysByValueDesc(p: Triad): ComponentKey[] {
  const keys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
  return [...keys].sort((a, b) => p[b] - p[a]);
}

function stdDev3(a: number, b: number, c: number): number {
  const m = (a + b + c) / 3;
  const v = ((a - m) ** 2 + (b - m) ** 2 + (c - m) ** 2) / 3;
  return Math.sqrt(v);
}

function estimateStressIntensity(team: Triad, person: Triad): number {
  const biL = 1 - stdDev3(person.impulsiv, person.intuitiv, person.analytisch) / MAX_BIO;
  const biT = 1 - stdDev3(team.impulsiv, team.intuitiv, team.analytisch) / MAX_BIO;
  const unbalance = ((1 - biL) + (1 - biT)) / 2;
  return clamp01(unbalance);
}

function applyControlledStressLocal(profile: Triad, intensity: number): Triad {
  const p = { ...profile };
  const i = clamp01(intensity);
  const keys = sortKeysByValueDesc(p);
  const delta = STRESS_K * i;
  p[keys[0]] = clamp(p[keys[0]] + delta);
  p[keys[2]] = clamp(p[keys[2]] - delta);
  p[keys[1]] = clamp(p[keys[1]] - 0.15 * delta);
  return p;
}

function applyUncontrolledStressLocal(profile: Triad, intensity: number): Triad {
  const p = { ...profile };
  const i = clamp01(intensity);
  const delta = STRESS_K * i;
  const keys = sortKeysByValueDesc(profile);
  const top1Loss = 0.6 * delta;
  const lowLoss = 0.2 * delta;
  p[keys[1]] = clamp(p[keys[1]] + delta);
  p[keys[0]] = clamp(p[keys[0]] - top1Loss);
  p[keys[2]] = clamp(p[keys[2]] - lowLoss);
  return p;
}

function computeStressShift(team: Triad, person: Triad, normalTS: number, isLeading: boolean, teamSize: TeamSize, roleSollEnabled: boolean, roleSoll: Triad | null): StressShift {
  const intensity = estimateStressIntensity(team, person);

  const cTeam = applyControlledStressLocal(team, intensity);
  const cPerson = applyControlledStressLocal(person, intensity);
  const uTeam = applyUncontrolledStressLocal(team, intensity);
  const uPerson = applyUncontrolledStressLocal(person, intensity);

  const cDG = distributionGap(cTeam, cPerson);
  const cDC = dominanceClash(dominanceType(cTeam), dominanceType(cPerson));
  const cRG = roleGap(roleSollEnabled, roleSoll, cPerson);
  const controlledTS = transformationScore(cDG, cDC, cRG, isLeading, teamSize);

  const uDG = distributionGap(uTeam, uPerson);
  const uDC = dominanceClash(dominanceType(uTeam), dominanceType(uPerson));
  const uRG = roleGap(roleSollEnabled, roleSoll, uPerson);
  const uncontrolledTS = transformationScore(uDG, uDC, uRG, isLeading, teamSize);

  const deltaC = controlledTS - normalTS;
  const deltaU = uncontrolledTS - normalTS;

  let stabilityRating: StressShift["stabilityRating"];
  if (Math.abs(deltaC) <= 5 && Math.abs(deltaU) <= 8) {
    stabilityRating = "STABIL";
  } else if (Math.abs(deltaU) > 15 || (deltaU > 0 && uncontrolledTS > 50)) {
    stabilityRating = "KRITISCH";
  } else {
    stabilityRating = "LABIL";
  }

  const directionC = deltaC > 2 ? "steigt" : deltaC < -2 ? "sinkt" : "bleibt stabil";
  const directionU = deltaU > 2 ? "steigt" : deltaU < -2 ? "sinkt" : "bleibt stabil";

  let summary: string;
  if (stabilityRating === "STABIL") {
    summary = `Unter Stress bleibt die Konstellation stabil. Kontrolliert: TS ${directionC} (${deltaC > 0 ? "+" : ""}${deltaC}), unkontrolliert: TS ${directionU} (${deltaU > 0 ? "+" : ""}${deltaU}).`;
  } else if (stabilityRating === "KRITISCH") {
    summary = `Unter unkontrolliertem Stress verschlechtert sich die Dynamik deutlich. TS ${directionU} um ${Math.abs(deltaU)} Punkte auf ${uncontrolledTS}. Klare Eskalationsregeln und Stressmonitoring sind zwingend erforderlich.`;
  } else {
    summary = `Unter Stress verändert sich die Dynamik spürbar. Kontrolliert: TS ${directionC} (${deltaC > 0 ? "+" : ""}${deltaC}), unkontrolliert: TS ${directionU} (${deltaU > 0 ? "+" : ""}${deltaU}). Proaktive Steuerung empfohlen.`;
  }

  return {
    controlledTeam: cTeam, uncontrolledTeam: uTeam,
    controlledPerson: cPerson, uncontrolledPerson: uPerson,
    stressIntensity: Math.round(intensity * 100),
    controlledTS, uncontrolledTS,
    tsDeltaControlled: deltaC, tsDeltaUncontrolled: deltaU,
    stabilityRating, summary,
  };
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

  const TS = transformationScore(DG, DC, RG, input.isLeading, input.teamSize);
  const level = intensityLevel(TS);
  const CI = conflictIndex(TS, DC);

  const axis = axisLabel(domT, domP);
  const st = shiftType(domT, domP, DG, DC, TS, input.isLeading, input.personProfile);

  const steer = calcSteeringNeed(level, RG, input.levers, input.steeringOverride);
  const tl = trafficLight(st, level, steer.final);

  const cellId = input.isLeading ? matrixCellId(domP, domT) : matrixCellId(domT, domP);
  const activeCell = MATRIX_CELLS.find(c => c.id === cellId) || MATRIX_CELLS[4];

  const deptFit = computeDepartmentFit(input.teamProfile, input.personProfile, input.departmentType, input.isLeading);

  const stressShift = computeStressShift(team, person, TS, input.isLeading, input.teamSize, !!input.roleSoll?.enabled, roleSoll);

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
    departmentFit: deptFit,
    stressShift,
    leadershipContext: buildLeadershipContext(domP, domT, person, team, input.isLeading, st, input.rollenDna),
  };
}

export type SystemVariant = { id: number; title: string; text: string };

const VARIANT_DATA: Record<number, { title: string; text: string }> = {
  1:  { title: "Struktur passt zu Struktur", text: "Das System ist stark auf Klarheit, Planung und Absicherung ausgerichtet. Entscheidungen sind nachvollziehbar, Standards werden eingehalten, Qualität ist stabil." },
  2:  { title: "Struktur mit Abstimmung", text: "Struktur und Qualitätsdenken sind dominant, werden aber durch Abstimmung und Teamfokus ergänzt. Das System ist stabil, wirkt weniger hart und bleibt anschlussfähig für Zusammenarbeit." },
  3:  { title: "Struktur mit Tempo", text: "Struktur und Absicherung bilden die Basis, zusätzlich ist Umsetzungsdruck vorhanden. Entscheidungen sind grundsätzlich sauber, gleichzeitig steigt Geschwindigkeit und Durchsetzungsstärke." },
  4:  { title: "Struktur fehlt im Muster", text: "Das System ist weniger über Absicherung und Standards geprägt, stärker über Abstimmung und Tempo. Ohne klare Leitplanken steigt das Risiko für Unschärfe bei Qualität, Prioritäten und Reporting." },
  5:  { title: "Abstimmung passt zu Abstimmung", text: "Zusammenarbeit, Harmonie und Abstimmung sind der zentrale Treiber. Entscheidungen entstehen im Dialog. Risiko: fehlende Klarheit, wenn Standards und Prioritäten nicht sauber gesetzt werden." },
  6:  { title: "Abstimmung mit Struktur", text: "Beziehung und Zusammenarbeit bleiben stark, werden aber durch Struktur und Qualitätsorientierung ergänzt. Entscheidungen werden belastbarer, ohne dass Teamanschluss verloren geht." },
  7:  { title: "Abstimmung mit Tempo", text: "Das System ist kontakt- und dialogorientiert, gleichzeitig dynamisch in der Umsetzung. Es kann schnell werden, wenn Prioritäten klar sind – ohne Rahmen droht Verzettelung." },
  8:  { title: "Struktur/Tempo trifft auf Konsenslogik", text: "Hier treffen unterschiedliche Entscheidungsrhythmen aufeinander: schnell und faktenorientiert versus abstimmungsorientiert. Ohne klare Entscheidungsregeln entstehen Reibung und Priorisierungskonflikte." },
  9:  { title: "Tempo passt zu Tempo", text: "Schnelle Entscheidungen und Umsetzungsdruck dominieren. Das erzeugt Dynamik, aber auch Konfliktpotenzial, wenn Standards, Rollen und Prioritäten nicht klar geregelt sind." },
  10: { title: "Tempo mit Struktur", text: "Hohe Umsetzungskraft trifft auf klare Standards. Das System kann leistungsstark sein, aber fordernd: Tempo bleibt hoch, Qualität muss über klare Regeln abgesichert werden." },
  11: { title: "Tempo mit Abstimmung", text: "Dynamik und Durchsetzung treffen auf starke Kommunikation und Teamfokus. Das wirkt energievoll, kann aber instabil werden, wenn Entscheidungen zu stark situativ statt nach Kriterien getroffen werden." },
  12: { title: "Struktur/Abstimmung trifft auf Tempo-System", text: "Ein System mit stärkerer Absicherung und Abstimmung trifft auf eine dynamische, schnelle Logik. Das kann Tempo bremsen oder Qualität stabilisieren – je nach Klarheit der Erwartungen." },
  13: { title: "Hybrid / keine klare Dominanz", text: "Es gibt keine eindeutige Hauptlogik. Wirkung und Verhalten wechseln stärker je nach Situation. Das erhöht Anpassungsfähigkeit, aber erschwert Verlässlichkeit ohne klare Regeln." },
};

function secondDominance(triad: Triad): DominanceType {
  const arr: [DominanceType, number][] = [
    ["IMPULSIV", triad.impulsiv],
    ["INTUITIV", triad.intuitiv],
    ["ANALYTISCH", triad.analytisch],
  ];
  arr.sort((a, b) => b[1] - a[1]);
  return arr[1][0];
}

export function computeVariantId(teamDom: DominanceType, personPrimary: DominanceType, personSecondary: DominanceType): number {
  if (teamDom === "MIX" || personPrimary === "MIX") return 13;

  if (teamDom === "ANALYTISCH") {
    if (personPrimary === "ANALYTISCH") return personSecondary === "INTUITIV" ? 2 : personSecondary === "IMPULSIV" ? 3 : 1;
    return 4;
  }
  if (teamDom === "INTUITIV") {
    if (personPrimary === "INTUITIV") return personSecondary === "ANALYTISCH" ? 6 : personSecondary === "IMPULSIV" ? 7 : 5;
    return 8;
  }
  if (personPrimary === "IMPULSIV") return personSecondary === "ANALYTISCH" ? 10 : personSecondary === "INTUITIV" ? 11 : 9;
  return 12;
}

export function getSystemVariant(teamProfile: Triad, personProfile: Triad, teamDom: DominanceType, personDom: DominanceType): SystemVariant {
  const personSecond = secondDominance(personProfile);
  const vid = computeVariantId(teamDom, personDom, personSecond);
  const data = VARIANT_DATA[vid] || VARIANT_DATA[13];
  return { id: vid, title: data.title, text: data.text };
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
        { title: "Konkrete Massnahmen", text: selectedCell.tun },
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
  const dept = getDepartmentInfo(input.departmentType);
  const deptPayload = input.departmentType !== "ALLGEMEIN" ? { type: input.departmentType, label: dept.label, focus: dept.focus } : null;
  return {
    context: {
      team_name: input.teamName,
      team_size: input.teamSize,
      is_leading: input.isLeading,
      person_role: input.isLeading ? "Führungskraft" : "Teammitglied",
      ...(deptPayload ? { department: deptPayload } : {}),
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
