import {
  type ComponentKey, type Triad, type DominanceResult,
  normalizeTriad, dominanceModeOf, labelComponent, dominanceLabel,
} from "./jobcheck-engine";

export type ShiftType = "VERSTAERKUNG" | "ERGAENZUNG" | "REIBUNG" | "SPANNUNG" | "TRANSFORMATION";
export type IntensityLevel = "NIEDRIG" | "MITTEL" | "HOCH";
export type TrafficLight = "GREEN" | "YELLOW" | "RED";
export type ViewMode = "CEO" | "HR" | "TEAMLEITUNG";

export type Lever = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  weight: number;
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
  roleProfile: Triad;
  candidateProfile: Triad;
  isLeading: boolean;
};

export type TeamDynamikResult = {
  teamDominance: DominanceResult;
  roleDominance: DominanceResult;
  candDominance: DominanceResult;
  shiftType: ShiftType;
  shiftAxis: string;
  intensityScore: number;
  intensityLevel: IntensityLevel;
  steeringNeed: IntensityLevel;
  trafficLight: TrafficLight;
  headline: string;
  activeMatrixCell: MatrixCell;
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
  levers: Lever[];
  fitTag: string;
};

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

function dominanceKey(dom: DominanceResult): ComponentKey {
  return dom.top1.key;
}

function matrixCellId(leadDom: ComponentKey, teamDom: ComponentKey): string {
  const map: Record<ComponentKey, string> = { impulsiv: "IMP", intuitiv: "INT", analytisch: "ANA" };
  return `${map[leadDom]}-${map[teamDom]}`;
}

function calcIntensityScore(input: TeamDynamikInput): number {
  const team = normalizeTriad(input.teamProfile);
  const cand = normalizeTriad(input.candidateProfile);
  const role = normalizeTriad(input.roleProfile);

  const teamDom = dominanceModeOf(team);
  const candDom = dominanceModeOf(cand);

  const dominanceDiff = Math.abs(teamDom.top1.value - candDom.top1.value) * 0.8;

  const distributionDiff = (
    Math.abs(team.impulsiv - cand.impulsiv) +
    Math.abs(team.intuitiv - cand.intuitiv) +
    Math.abs(team.analytisch - cand.analytisch)
  ) * 0.4;

  const leadershipFactor = input.isLeading ? 18 : 6;

  const sollIstFactor = (
    Math.abs(role.impulsiv - cand.impulsiv) +
    Math.abs(role.intuitiv - cand.intuitiv) +
    Math.abs(role.analytisch - cand.analytisch)
  ) * 0.25;

  const teamSizeFactor = input.membersCount >= 12 ? 6 : 0;

  const raw = dominanceDiff + distributionDiff + leadershipFactor + sollIstFactor + teamSizeFactor;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

function calcIntensityLevel(score: number): IntensityLevel {
  if (score <= 33) return "NIEDRIG";
  if (score <= 66) return "MITTEL";
  return "HOCH";
}

function calcShiftType(
  teamDom: DominanceResult,
  candDom: DominanceResult,
  intensity: IntensityLevel,
  isLeading: boolean
): ShiftType {
  const sameDominance = teamDom.top1.key === candDom.top1.key;

  if (sameDominance && intensity === "NIEDRIG") return "VERSTAERKUNG";
  if (sameDominance && intensity === "MITTEL") return "VERSTAERKUNG";
  if (!sameDominance && intensity === "NIEDRIG") return "ERGAENZUNG";
  if (!sameDominance && intensity === "MITTEL" && !isLeading) return "REIBUNG";
  if (!sameDominance && intensity === "MITTEL" && isLeading) return "REIBUNG";
  if (intensity === "HOCH" && isLeading) return "TRANSFORMATION";
  if (intensity === "HOCH") return "SPANNUNG";
  return "REIBUNG";
}

function calcTrafficLight(intensity: IntensityLevel, shiftType: ShiftType): TrafficLight {
  if (shiftType === "SPANNUNG" || shiftType === "TRANSFORMATION") return "RED";
  if (intensity === "HOCH") return "RED";
  if (intensity === "MITTEL") return "YELLOW";
  return "GREEN";
}

function calcSteeringNeed(intensity: IntensityLevel, levers: Lever[]): IntensityLevel {
  const levelMap: Record<IntensityLevel, number> = { NIEDRIG: 20, MITTEL: 50, HOCH: 80 };
  let score = levelMap[intensity];

  const totalReduction = levers.filter(l => l.enabled).reduce((sum, l) => sum + l.weight, 0);
  score = Math.max(0, score - totalReduction);

  if (score <= 33) return "NIEDRIG";
  if (score <= 66) return "MITTEL";
  return "HOCH";
}

function buildLevers(): Lever[] {
  return [
    { id: "L1", label: "Entscheidungszeitfenster definiert", description: "Klare Fristen für Entscheidungen verhindern Endlosschleifen und Konsensverschleppung.", enabled: false, weight: 5 },
    { id: "L2", label: "80/20-Standard festgelegt", description: "Definierter Qualitätsstandard verhindert Über-Perfektionierung und hält das Tempo.", enabled: false, weight: 5 },
    { id: "L3", label: "Review-Rhythmus etabliert", description: "Regelmäßige Überprüfung schafft Steuerungssicherheit und verhindert stille Abweichungen.", enabled: false, weight: 5 },
    { id: "L4", label: "Beziehungsebene ritualisiert", description: "Feste Formate für Teamaustausch verhindern emotionale Distanzierung.", enabled: false, weight: 5 },
  ];
}

function buildHeadline(shiftType: ShiftType, teamDom: DominanceResult, candDom: DominanceResult, isLeading: boolean): string {
  const tLabel = labelComponent(teamDom.top1.key);
  const cLabel = labelComponent(candDom.top1.key);
  const role = isLeading ? "Führung" : "Neue Person";

  switch (shiftType) {
    case "VERSTAERKUNG": return `${role} verstärkt die bestehende ${tLabel}-Dynamik des Teams.`;
    case "ERGAENZUNG": return `${role} ergänzt das ${tLabel}-Team mit ${cLabel}-Kompetenz. Komplementärer Effekt.`;
    case "REIBUNG": return `${cLabel}-${role} trifft auf ${tLabel}-Team. Reibung in Steuerungslogik und Priorisierung.`;
    case "SPANNUNG": return `${cLabel}-Profil im ${tLabel}-Team erzeugt strukturelle Spannung. Steuerung erforderlich.`;
    case "TRANSFORMATION": return `${cLabel}-Führung transformiert ${tLabel}-Team. Hohe Steuerungsintensität.`;
  }
}

function buildLeadershipBehavior(candDom: DominanceResult, teamDom: DominanceResult, isLeading: boolean) {
  const cKey = candDom.top1.key;
  const tKey = teamDom.top1.key;
  const cLabel = labelComponent(cKey);
  const tLabel = labelComponent(tKey);
  const sameDom = cKey === tKey;
  const role = isLeading ? "Die Führung" : "Die neue Person";

  const axisLabel = sameDom ? `${cLabel} → ${cLabel}` : `${cLabel} → ${tLabel}`;

  let statement: string, possiblePerception: string, blindSpot: string;

  if (sameDom) {
    statement = `${role} arbeitet in derselben Steuerungslogik wie das Team (${cLabel}). Entscheidungswege und Priorisierung werden verstärkt.`;
    possiblePerception = `Das Team erlebt Bestätigung der eigenen Arbeitsweise. Bestehende Muster werden stabilisiert.`;
    blindSpot = `Einseitige Verstärkung: Wenn beide ${cLabel}-geprägt sind, fehlen Korrektive für die nachrangigen Kompetenzen.`;
  } else {
    const conflicts: Record<string, { s: string; p: string; b: string }> = {
      "impulsiv-intuitiv": { s: `${role} bringt Umsetzungsdruck in ein beziehungsorientiertes Team. Entscheidungstempo steigt, Abstimmungstiefe sinkt.`, p: "Das Team nimmt Druck und Ungeduld wahr. Beziehungsdynamik wird als zweitrangig empfunden.", b: "Bindungsverlust durch fehlende Beziehungspflege. Stille Demotivation im Team." },
      "impulsiv-analytisch": { s: `${role} bringt Umsetzungsdruck in ein strukturorientiertes Team. Tempo kollidiert mit Absicherungsbedürfnis.`, p: "Das Team nimmt Hektik und fehlende Struktur wahr. Qualitätsansprüche werden als Bremse interpretiert.", b: "Qualitätsverlust durch überhöhtes Tempo. Prozessabkürzungen werden zur Gewohnheit." },
      "intuitiv-impulsiv": { s: `${role} bringt Beziehungsorientierung in ein tempogetriebenes Team. Abstimmungsbedarf steigt, Entscheidungstempo sinkt.`, p: "Das Team empfindet Führung als zögerlich und konsensorientiert. Ergebnisorientierung wird vermisst.", b: "Entscheidungsverzögerung durch Konsensbedürfnis. Klare Ansagen bleiben aus." },
      "intuitiv-analytisch": { s: `${role} bringt Beziehungslogik in ein strukturorientiertes Team. Abstimmung und Dialog ersetzen Prozessvorgaben.`, p: "Das Team erwartet klare Vorgaben und bekommt Gesprächsangebote. Prozesseffizienz leidet.", b: "Strukturverlust durch fehlende Standardisierung. Individuelle Absprachen ersetzen systematische Prozesse." },
      "analytisch-impulsiv": { s: `${role} bringt Struktur und Absicherung in ein tempogetriebenes Team. Prozessqualität steigt, Geschwindigkeit sinkt kurzfristig.`, p: "Das Team empfindet neue Prozesse als Bremse. Kontrolle wird als Misstrauen interpretiert.", b: "Innovationsverlust durch Über-Strukturierung. Handlungsspielräume werden eingeengt." },
      "analytisch-intuitiv": { s: `${role} bringt Struktur und Faktenorientierung in ein beziehungsorientiertes Team. Entscheidungen werden sachlicher, Distanz steigt.`, p: "Das Team nimmt emotionale Distanz wahr. Faktenorientierung wird als Kälte empfunden.", b: "Bindungsverlust durch fehlende emotionale Anschlussfähigkeit. Teamdynamik wird unterschätzt." },
    };

    const key = `${cKey}-${tKey}`;
    const fallback = { s: `${role} (${cLabel}) trifft auf ${tLabel}-Team. Unterschiedliche Steuerungslogiken.`, p: "Unterschiedliche Erwartungen an Arbeitsweise und Entscheidungsfindung.", b: "Gegenseitige Fehlinterpretation von Arbeitsstil und Prioritäten." };
    const entry = conflicts[key] || fallback;
    statement = entry.s;
    possiblePerception = entry.p;
    blindSpot = entry.b;
  }

  return { axisLabel, statement, possiblePerception, blindSpot };
}

function buildSystemEffect(shiftType: ShiftType, candDom: DominanceResult, teamDom: DominanceResult, isLeading: boolean): string {
  const cLabel = labelComponent(candDom.top1.key);
  const tLabel = labelComponent(teamDom.top1.key);
  const role = isLeading ? "der Führung" : "der neuen Person";

  switch (shiftType) {
    case "VERSTAERKUNG": return `Die ${cLabel}-Dynamik wird durch den Eintritt ${role} verstärkt. Bestehende Stärken werden ausgebaut, bestehende Schwächen werden nicht kompensiert. Systemisch: stabil, aber einseitig.`;
    case "ERGAENZUNG": return `${cLabel}-Kompetenz ergänzt das ${tLabel}-Team. Neue Perspektiven und Arbeitsweisen werden eingebracht. Systemisch: bereichernd, Integrationsaufwand moderat.`;
    case "REIBUNG": return `${cLabel}-Logik trifft auf ${tLabel}-Team. Unterschiedliche Priorisierung erzeugt Reibung in Entscheidungsfindung und Alltagssteuerung. Systemisch: steuerbar, aber Aufmerksamkeit erforderlich.`;
    case "SPANNUNG": return `Strukturelle Spannung zwischen ${cLabel}-Profil und ${tLabel}-Team. Arbeitslogik, Kommunikation und Erwartungshaltung weichen deutlich voneinander ab. Systemisch: aktive Steuerung notwendig.`;
    case "TRANSFORMATION": return `${cLabel}-Führung verändert die ${tLabel}-Teamdynamik grundlegend. Arbeitslogik, Entscheidungskultur und Priorisierung werden transformiert. Systemisch: hohe Steuerungsintensität, aktives Change-Management erforderlich.`;
  }
}

function buildChances(shiftType: ShiftType, candDom: DominanceResult, teamDom: DominanceResult): string[] {
  const cLabel = labelComponent(candDom.top1.key);
  const tLabel = labelComponent(teamDom.top1.key);

  const base: string[] = [];
  if (shiftType === "VERSTAERKUNG") {
    base.push(`Verstärkte ${cLabel}-Kompetenz beschleunigt Kernprozesse.`);
    base.push("Hohe Anschlussfähigkeit reduziert Einarbeitungszeit.");
    base.push("Teamidentität und Arbeitsrhythmus bleiben stabil.");
    base.push("Entscheidungslogik wird konsistenter.");
  } else if (shiftType === "ERGAENZUNG") {
    base.push(`${cLabel}-Kompetenz ergänzt fehlende ${cLabel}-Perspektive im Team.`);
    base.push("Neue Impulse für Entscheidungsfindung und Problemlösung.");
    base.push(`Blinde Flecken der ${tLabel}-Dominanz werden adressiert.`);
    base.push("Breitere Kompetenzabdeckung im Gesamtteam.");
  } else {
    base.push(`${cLabel}-Impulse können ${tLabel}-Routinen aufbrechen.`);
    base.push("Neue Perspektive erzwingt bewusstere Entscheidungsfindung.");
    base.push("Potenziell höhere Anpassungsfähigkeit des Teams.");
    if (shiftType === "TRANSFORMATION") base.push("Chance auf grundlegende Erneuerung von Prozessen und Kultur.");
    else base.push("Moderate Systemveränderung bei gezielter Steuerung möglich.");
  }
  return base.slice(0, 6);
}

function buildRisks(shiftType: ShiftType, candDom: DominanceResult, teamDom: DominanceResult, isLeading: boolean): string[] {
  const cLabel = labelComponent(candDom.top1.key);
  const tLabel = labelComponent(teamDom.top1.key);
  const role = isLeading ? "Führung" : "Neue Person";

  const base: string[] = [];
  if (shiftType === "VERSTAERKUNG") {
    base.push(`Einseitige ${cLabel}-Verstärkung ohne Korrektiv. Im Alltag: blinde Flecken bei ${cLabel === "Impulsiv" ? "Qualität und Abstimmung" : cLabel === "Intuitiv" ? "Ergebnisorientierung und Tempo" : "Flexibilität und Geschwindigkeit"}.`);
    base.push("Homogenität erhöht Anfälligkeit bei Systemveränderungen.");
    base.push("Fehlende Diversität in Entscheidungslogik.");
  } else if (shiftType === "ERGAENZUNG") {
    base.push(`Integrationsphase erfordert bewusste Steuerung. Im Alltag: temporäre Reibung bei Priorisierung.`);
    base.push(`${role} muss Anschlussfähigkeit aktiv herstellen.`);
    base.push("Unterschiedliche Arbeitsgeschwindigkeit in der Einarbeitung.");
  } else if (shiftType === "REIBUNG") {
    base.push(`${cLabel}-${role} und ${tLabel}-Team priorisieren unterschiedlich. Im Alltag: Konflikte bei Entscheidungsgeschwindigkeit und -logik.`);
    base.push(`Gegenseitige Fehlinterpretation von Arbeitsstil. Im Alltag: stille Frustration und Rückzug.`);
    base.push("Ohne Steuerung wird Reibung zu chronischem Spannungsfeld.");
  } else {
    base.push(`Strukturelle Spannung zwischen ${cLabel} und ${tLabel}. Im Alltag: Kommunikationsbrüche und Erwartungsenttäuschung.`);
    base.push(`${isLeading ? "Führungsakzeptanz" : "Teamintegration"} gefährdet. Im Alltag: Widerstand und Abgrenzung.`);
    base.push("Ohne aktives Change-Management: Fluktuation und Leistungseinbruch.");
    base.push("Kulturelle Transformation braucht 6-12 Monate. Im Alltag: lange Unsicherheitsphase.");
  }
  return base.slice(0, 6);
}

function buildIntegrationPlan(shiftType: ShiftType, isLeading: boolean): { phaseId: string; title: string; days: string; actions: string[] }[] {
  const role = isLeading ? "Führungskraft" : "Teammitglied";

  if (shiftType === "VERSTAERKUNG" || shiftType === "ERGAENZUNG") {
    return [
      { phaseId: "P1", title: "Ankommen & Orientieren", days: "0–30 Tage", actions: [
        `${role} lernt Teamrhythmus und Entscheidungslogik kennen.`,
        "Erwartungsgespräch mit Team und Vorgesetztem.",
        "Erste operative Aufgaben mit direktem Feedback.",
        "Beziehungsaufbau durch informelle Formate.",
      ]},
      { phaseId: "P2", title: "Stabilisieren & Steuern", days: "30–60 Tage", actions: [
        "Eigene Arbeitslogik wird ins Team integriert.",
        "Erste Konflikte werden adressiert und geklärt.",
        "Review-Rhythmus wird etabliert.",
        "Zielerreichung wird gemeinsam überprüft.",
      ]},
      { phaseId: "P3", title: "Validieren & Entscheiden", days: "60–90 Tage", actions: [
        "Gesamtbewertung der Integration.",
        "Feedback von Team und Vorgesetztem einholen.",
        "Entscheidung über dauerhafte Passung.",
        "Steuerungsmaßnahmen bei Bedarf anpassen.",
      ]},
    ];
  }

  return [
    { phaseId: "P1", title: "Strukturierung & Rahmen setzen", days: "0–30 Tage", actions: [
      `${role} definiert Arbeitslogik und Entscheidungswege explizit.`,
      "Erwartungsgespräche mit jedem Teammitglied einzeln.",
      "Entscheidungszeitfenster und 80/20-Standards festlegen.",
      "Beziehungsformate etablieren (wöchentlich).",
      isLeading ? "Führungsanspruch klar kommunizieren, nicht diskutieren." : "Eigene Rolle im Team klar definieren.",
    ]},
    { phaseId: "P2", title: "Stabilisierung & Steuerung", days: "30–60 Tage", actions: [
      "Spannungsfelder identifizieren und benennen.",
      "Review-Rhythmus mit konkreten Metriken etablieren.",
      "Erste Erfolge sichtbar machen und kommunizieren.",
      "Teamdynamik bewusst beobachten und bei Bedarf intervenieren.",
    ]},
    { phaseId: "P3", title: "Validierung & Entscheidung", days: "60–90 Tage", actions: [
      "Gesamtbewertung: Passt die Dynamik oder braucht es Anpassung?",
      "360°-Feedback einholen.",
      "Steuerungsmaßnahmen verstetigen oder verschärfen.",
      "Entscheidung über langfristige Teamkonfiguration.",
    ]},
  ];
}

export function runTeamDynamik(input: TeamDynamikInput): TeamDynamikResult {
  const team = normalizeTriad(input.teamProfile);
  const role = normalizeTriad(input.roleProfile);
  const cand = normalizeTriad(input.candidateProfile);

  const teamDom = dominanceModeOf(team);
  const roleDom = dominanceModeOf(role);
  const candDom = dominanceModeOf(cand);

  const intensityScore = calcIntensityScore(input);
  const intensityLevel = calcIntensityLevel(intensityScore);
  const shiftType = calcShiftType(teamDom, candDom, intensityLevel, input.isLeading);

  const levers = buildLevers();
  const steeringNeed = calcSteeringNeed(intensityLevel, levers);
  const trafficLight = calcTrafficLight(intensityLevel, shiftType);

  const leadDomKey = input.isLeading ? candDom.top1.key : teamDom.top1.key;
  const teamDomKey = teamDom.top1.key;
  const cellId = input.isLeading ? matrixCellId(candDom.top1.key, teamDomKey) : matrixCellId(teamDomKey, candDom.top1.key);
  const activeMatrixCell = MATRIX_CELLS.find(c => c.id === cellId) || MATRIX_CELLS[0];

  const headline = buildHeadline(shiftType, teamDom, candDom, input.isLeading);
  const leadershipBehavior = buildLeadershipBehavior(candDom, teamDom, input.isLeading);
  const systemEffect = buildSystemEffect(shiftType, candDom, teamDom, input.isLeading);

  const shiftAxis = candDom.top1.key === teamDom.top1.key ? "Keine Verschiebung" : `${labelComponent(teamDom.top1.key)} → ${labelComponent(candDom.top1.key)}`;

  const sollIstDiff = Math.abs(role.impulsiv - cand.impulsiv) + Math.abs(role.intuitiv - cand.intuitiv) + Math.abs(role.analytisch - cand.analytisch);
  const fitTag = sollIstDiff <= 12 ? "Soll ≈ Ist" : "Abweichung";

  return {
    teamDominance: teamDom,
    roleDominance: roleDom,
    candDominance: candDom,
    shiftType,
    shiftAxis,
    intensityScore,
    intensityLevel,
    steeringNeed,
    trafficLight,
    headline,
    activeMatrixCell,
    leadershipBehavior,
    systemEffect,
    chances: buildChances(shiftType, candDom, teamDom),
    risks: buildRisks(shiftType, candDom, teamDom, input.isLeading),
    integrationPlan: buildIntegrationPlan(shiftType, input.isLeading),
    levers,
    fitTag,
  };
}

export function getMatrixCellById(id: string): MatrixCell | undefined {
  return MATRIX_CELLS.find(c => c.id === id);
}

export function getViewContent(viewMode: ViewMode, result: TeamDynamikResult) {
  if (viewMode === "CEO") {
    return {
      insightSections: [
        { title: "Systemwirkung", text: result.systemEffect },
      ],
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
        { title: "Alltagswirkung", text: result.activeMatrixCell.alltag },
        { title: "Konkrete Maßnahmen", text: result.activeMatrixCell.tun },
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

export { normalizeTriad, dominanceModeOf, labelComponent, dominanceLabel };
export type { ComponentKey, Triad, DominanceResult };
