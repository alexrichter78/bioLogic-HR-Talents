import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "./jobcheck-engine";
import type { Triad, ComponentKey } from "./jobcheck-engine";
import { detectConstellation, constellationLabel, subj, Subj } from "./soll-ist-engine";
import type { ConstellationType } from "./soll-ist-engine";
import { computeTeamCheckV4 } from "./teamcheck-v4-engine";
import { calculateLeadershipAssessment } from "./leadership-system-impact";
import type { LeadershipAssessmentResult } from "./leadership-system-impact";

type SystemwirkungType = "verstaerkung" | "ergaenzung" | "ausgleich" | "verschiebung" | "polarisierung" | "uebersteuerung";

export type SystemwirkungResult = {
  type: SystemwirkungType;
  label: string;
  description: string;
  intensity: "gering" | "mittel" | "hoch";
  intensityLabel: string;
  chancen: string[];
  risiken: string[];
  narrative: string;
};

export type GesamtpassungLevel = "geeignet" | "bedingt" | "kritisch";

export type Severity = "ok" | "warning" | "critical";

export type ImpactArea = {
  id: string;
  label: string;
  severity: Severity;
  teamExpectation: string;
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
  fuehrungsfokus: string;
  erfolgskriterium: string;
  items: string[];
};

export type TeamReportResult = {
  gesamtpassung: GesamtpassungLevel;
  gesamtpassungLabel: string;
  entscheidungsfaktoren: string[];
  controlIntensity: "gering" | "mittel" | "hoch";
  teamIstGap: number;
  managementSummary: string;
  teamstruktur: string;
  fuehrungsprofil: string;
  systemwirkung: string;
  systemwirkungResult: SystemwirkungResult;
  teamdynamikAlltag: string;
  chancen: string;
  risiken: string;
  verhaltenUnterDruck: string;
  kulturwirkung: string;
  fuehrungshebel: string;
  integrationsplan: string;
  systemfazit: string;
  impactAreas: ImpactArea[];
  riskTimeline: RiskPhase[];
  developmentLevel: number;
  developmentLabel: string;
  developmentText: string;
  actions: string[];
  stressBehavior: StressBehavior;
  integrationsplanPhasen: IntegrationPhase[];
  istConstellationLabel: string;
  teamConstellationLabel: string;
  leadershipAssessment?: LeadershipAssessmentResult;
  v4Passung?: string;
  v4Beitrag?: string;
  v4Begleitung?: string;
  v4GesamtLabel?: string;
  teamGoalLabel?: string;
  isFK?: boolean;
};

export type TeamReportOptions = {
  teamGoal?: string | null;
  roleType?: string | null;
  roleLevel?: string;
  taskStructure?: string;
  workStyle?: string;
  successFocus?: string[];
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

function gapLabel(g: number): string {
  if (g <= 10) return "gering";
  if (g <= 25) return "mittel";
  return "hoch";
}

function ampel(totalGap: number): "gruen" | "gelb" | "rot" {
  if (totalGap <= 20) return "gruen";
  if (totalGap <= 40) return "gelb";
  return "rot";
}

function totalGapOf(a: Triad, b: Triad): number {
  return Math.round(Math.abs(a.impulsiv - b.impulsiv) + Math.abs(a.intuitiv - b.intuitiv) + Math.abs(a.analytisch - b.analytisch));
}

function weakestKey(t: Triad): ComponentKey {
  if (t.impulsiv <= t.intuitiv && t.impulsiv <= t.analytisch) return "impulsiv";
  if (t.intuitiv <= t.impulsiv && t.intuitiv <= t.analytisch) return "intuitiv";
  return "analytisch";
}

function strongestKey(t: Triad): ComponentKey {
  if (t.impulsiv >= t.intuitiv && t.impulsiv >= t.analytisch) return "impulsiv";
  if (t.intuitiv >= t.impulsiv && t.intuitiv >= t.analytisch) return "intuitiv";
  return "analytisch";
}

function detectSystemwirkung(
  ist: Triad, team: Triad, cn: string,
  rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number, istConst: ConstellationType, teamConst: ConstellationType
): SystemwirkungResult {
  const istRange = Math.max(ist.impulsiv, ist.intuitiv, ist.analytisch) - Math.min(ist.impulsiv, ist.intuitiv, ist.analytisch);
  const teamRange = Math.max(team.impulsiv, team.intuitiv, team.analytisch) - Math.min(team.impulsiv, team.intuitiv, team.analytisch);
  const teamWeak = weakestKey(team);
  const istStrong = strongestKey(ist);

  let type: SystemwirkungType;
  let label: string;
  let description: string;
  let chancen: string[];
  let risiken: string[];

  if (rk === tk && teamIstGap <= 15) {
    type = "verstaerkung";
    label = "Verstärkung";
    description = `${cn} bringt die gleiche Arbeitslogik wie das Team. Die vorhandene Dynamik im Bereich ${compDesc(rk)} wird stärker.`;
    chancen = ["Hohe Stabilität", "Klare Standards", "Sehr gute Qualität in der Kerndisziplin"];
    risiken = ["Entscheidungsverlangsamung bei einseitiger Logik", "Geringe Veränderungsfähigkeit", "Blinde Flecken im schwächsten Bereich"];
  } else if (istStrong === teamWeak && teamIstGap >= 15) {
    type = "ergaenzung";
    label = "Ergänzung";
    description = `${cn} bringt eine fehlende Qualität ins Team. Der Bereich ${compDesc(istStrong)}, der im Team bisher schwach ausgeprägt ist, wird durch die neue Person gestärkt. Das Team wird ausgeglichener.`;
    chancen = ["Bessere Entscheidungen durch neue Perspektive", "Mehr Balance im Team", "Höhere Problemlösungskompetenz"];
    risiken = ["Anfängliche Reibung durch unterschiedliche Arbeitslogik", "Erhöhter Abstimmungsbedarf", "Integrationswiderstand möglich"];
  } else if (istRange <= 12 && teamRange > 20) {
    type = "ausgleich";
    label = "Ausgleich";
    description = `${cn} hat ein ausgeglichenes Profil und stabilisiert das eher einseitige Teamprofil. Das System wird ruhiger und balancierter.`;
    chancen = ["Stabilere Entscheidungen", "Weniger Extremreaktionen", "Bessere Priorisierung"];
    risiken = ["Das Team empfindet die neue Person als bremsend", "Tempo kann sinken", "Klarheit der Teamidentität verwässert"];
  } else if (rk !== tk && istRange > 20 && teamIstGap > 35) {
    type = "polarisierung";
    label = "Polarisierung";
    description = `${cn} verstärkt die Gegensätze im Team. Die Arbeitslogik ${compDesc(rk)} steht der Teamlogik ${compDesc(tk)} deutlich gegenüber. Unterschiedliche Arbeitsweisen treten stärker hervor.`;
    chancen = ["Starke Innovationskraft durch Gegenpole", "Viele Perspektiven", "Hohe kreative Spannung"];
    risiken = ["Konflikte in der Zusammenarbeit", "Entscheidungsblockaden", "Lagerbildung im Team"];
  } else if (istRange > 25 && teamRange < 15 && teamIstGap > 25) {
    type = "uebersteuerung";
    label = "Übersteuerung";
    description = `${cn} bringt ein stark ausgeprägtes Profil in ein eher ausgeglichenes Team. Die Arbeitslogik des Teams wird von der neuen Person dominiert. Das System passt sich stark an.`;
    chancen = ["Schnelle Veränderungen", "Klare Richtung", "Hohe Durchsetzungskraft"];
    risiken = ["Team verliert Eigenständigkeit", "Fluktuation kann steigen", "Bestehende Teamkultur bricht"];
  } else {
    type = "verschiebung";
    label = "Verschiebung";
    description = `${cn} verändert die Grundlogik des Teams. Die bisherige Ausrichtung auf ${compDesc(tk)} verschiebt sich Richtung ${compDesc(rk)}. Das Team entwickelt eine neue Arbeitsweise.`;
    chancen = ["Neue Leistungsfähigkeit", "Strukturelle Weiterentwicklung", "Frische Impulse"];
    risiken = ["Kulturelle Reibung in der Übergangsphase", "Identitätsverlust im Team möglich", "Produktivitätsdelle in den ersten Wochen"];
  }

  const intensity: "gering" | "mittel" | "hoch" = teamIstGap <= 15 ? "gering" : teamIstGap <= 30 ? "mittel" : "hoch";
  const intensityLabel = intensity === "gering"
    ? "Die Veränderung ist subtil und gut integrierbar."
    : intensity === "mittel"
    ? "Die Veränderung ist deutlich spürbar, bleibt jedoch steuerbar."
    : "Die Veränderung ist stark. Aktive Steuerung durch die Führungskraft ist notwendig.";

  const narrative = `Systemwirkung: ${label}. ${description} Intensität: ${intensity}. ${intensityLabel}`;

  return { type, label, description, intensity, intensityLabel, chancen, risiken, narrative };
}

function severity(gap: number): Severity {
  if (gap >= 15) return "critical";
  if (gap >= 8) return "warning";
  return "ok";
}

function buildTeamImpactAreas(
  rk: ComponentKey, tk: ComponentKey,
  ist: Triad, team: Triad, cand: string
): ImpactArea[] {
  const teamGapI = Math.abs(team.impulsiv - ist.impulsiv);
  const teamGapN = Math.abs(team.intuitiv - ist.intuitiv);
  const teamGapA = Math.abs(team.analytisch - ist.analytisch);

  const areas: ImpactArea[] = [];

  const maxTeamGap = Math.max(teamGapI, teamGapA, teamGapN);
  const decSev = severity(tk === "analytisch" && rk !== "analytisch" ? Math.max(maxTeamGap, teamGapA + 5) : maxTeamGap);
  let decTeam: string;
  let decCandPattern: string;
  let decRisk: string;
  if (tk === "analytisch") {
    decTeam = "Das Team arbeitet mit sorgfältiger, planvoller Entscheidungslogik. Optionen werden geprüft und Risiken abgewogen.";
    const sc = Subj(cand);
    decCandPattern = rk === "impulsiv" ? `${sc} entscheidet schneller und handlungsorientierter. Entscheidungen fallen, bevor alle Informationen vorliegen.` : `${sc} entscheidet kontextbezogen und bezieht Stimmungen ein. Datenbasierte Prüfung steht weniger im Vordergrund.`;
    decRisk = rk !== "analytisch" ? `Im Team wirkt das als Tempowechsel. ${Subj(cand)} und das Team kommen zu unterschiedlichen Entscheidungszeitpunkten.` : "Die Entscheidungslogik passt zum Team.";
  } else if (tk === "impulsiv") {
    decTeam = "Das Team arbeitet mit schneller, handlungsorientierter Entscheidungslogik. Tempo hat Vorrang vor langer Prüfung.";
    const sc = Subj(cand);
    decCandPattern = rk === "analytisch" ? `${sc} prüft gründlich und braucht Daten. Das Tempo ist langsamer als das Team gewohnt ist.` : `${sc} bezieht bei Entscheidungen den menschlichen Kontext ein. Abstimmung dauert länger als das Team erwartet.`;
    decRisk = rk !== "impulsiv" ? `Im Team entsteht Spannung: ${Subj(cand)} verlangsamt, während das Team Tempo erwartet.` : "Die Entscheidungslogik passt zum Team.";
  } else {
    decTeam = "Das Team trifft Entscheidungen kontextbezogen. Abstimmung und Zusammenarbeit stehen im Vordergrund.";
    const sc = Subj(cand);
    decCandPattern = rk === "impulsiv" ? `${sc} trifft Entscheidungen schnell und direkt. Die Wirkung auf andere wird nicht immer berücksichtigt.` : `${sc} entscheidet über Fakten und Regeln. Die zwischenmenschliche Dimension steht weniger im Fokus.`;
    decRisk = rk !== "intuitiv" ? `Im Team wirkt das als Stilbruch. Das Team erwartet eine andere Entscheidungslogik.` : "Die Entscheidungslogik passt zum Team.";
  }
  areas.push({ id: "decision", label: "Entscheidungslogik", severity: decSev, teamExpectation: decTeam, candidatePattern: decCandPattern, risk: decRisk });

  const workSev = severity(teamGapA);
  let workTeam: string;
  if (team.analytisch >= 35) workTeam = "Das Team arbeitet mit klarer Struktur, Priorisierung und verlässlichen Abläufen.";
  else if (team.analytisch >= 25) workTeam = "Das Team hat eine grundlegende Ordnung in Abläufen und Prozessen.";
  else workTeam = "Das Team arbeitet flexibel und ergebnisorientiert.";
  const ws = Subj(cand);
  let workCandPattern: string;
  if (ist.analytisch >= 35) workCandPattern = `${ws} arbeitet strukturiert mit klaren Abläufen. Planung hat hohe Priorität.`;
  else if (ist.analytisch >= 25) workCandPattern = `${ws} hat grundlegende Struktur, lässt aber Raum für Anpassungen.`;
  else workCandPattern = `${ws} arbeitet tempoorientiert und reagiert situationsbezogen.`;
  let workRisk: string;
  if (teamGapA >= 10 && ist.analytisch < team.analytisch) workRisk = `Prozessklarheit muss aktiv eingefordert werden. Im Team (${compShort(tk)}-Logik) kann das Strukturdefizit auffallen.`;
  else if (teamGapA >= 10 && ist.analytisch > team.analytisch) workRisk = `${ws} investiert mehr Zeit in Planung als das Team gewohnt ist. Das kann das Team bremsen.`;
  else workRisk = "Arbeitssteuerung passt grundsätzlich zum Team.";
  areas.push({ id: "work_structure", label: "Arbeitssteuerung", severity: workSev, teamExpectation: workTeam, candidatePattern: workCandPattern, risk: workRisk });

  const teamDynSev = severity(Math.max(teamGapI, teamGapN, teamGapA) * 0.8);
  let dynTeam: string;
  let dynCandPattern: string;
  let dynRisk: string;
  if (rk === tk) {
    dynTeam = `Das Team arbeitet mit ${compShort(tk)}-Fokus. Die neue Person sollte kompatibel sein.`;
    dynCandPattern = `${Subj(cand)} bringt die gleiche Arbeitslogik mit. Die Integration ist unkompliziert.`;
    dynRisk = `Stärkung des Teamfokus. Risiko: Blinde Flecken im Bereich ${compDesc(weakestKey(team))} werden nicht ausgeglichen.`;
  } else {
    dynTeam = `Das Team arbeitet mit ${compShort(tk)}-Fokus. Eine neue Logik kann bereichernd oder störend wirken.`;
    dynCandPattern = `${Subj(cand)} bringt ${compShort(rk)}-Fokus. Das unterscheidet sich von der Teamlogik.`;
    dynRisk = `Im Alltag entstehen unterschiedliche Prioritäten. ${Subj(cand)} setzt auf ${compShort(rk)}, das Team auf ${compShort(tk)}. Steuerung durch die Führung ist nötig.`;
  }
  areas.push({ id: "team_dynamics", label: "Teamdynamik", severity: teamDynSev, teamExpectation: dynTeam, candidatePattern: dynCandPattern, risk: dynRisk });

  const tempoGap = Math.abs(ist.impulsiv - team.impulsiv);
  const tempoSev = severity(tempoGap);
  areas.push({
    id: "tempo",
    label: "Arbeitstempo",
    severity: tempoSev,
    teamExpectation: team.impulsiv >= 35 ? "Das Team arbeitet mit hohem Tempo und schneller Umsetzung." : team.impulsiv >= 25 ? "Das Team arbeitet in einem ausgeglichenen Rhythmus." : "Das Team arbeitet ruhig und gründlich.",
    candidatePattern: ist.impulsiv >= 35 ? `${Subj(cand)} arbeitet mit hohem Tempo und treibt Themen schnell voran.` : ist.impulsiv >= 25 ? `${Subj(cand)} arbeitet in einem ausgeglichenen Rhythmus.` : `${Subj(cand)} arbeitet ruhig und gründlich. Schnelle Umsetzung hat keine Priorität.`,
    risk: tempoGap >= 15 ? `Tempounterschied zum Team: ${tempoGap} Punkte. ${ist.impulsiv > team.impulsiv ? "Das Team kann unter Druck geraten." : "Das Team empfindet die Person als bremsend."}` : "Arbeitstempo ist kompatibel.",
  });

  const kommSev = severity(teamGapN * 0.7);
  areas.push({
    id: "communication",
    label: "Kommunikation",
    severity: kommSev,
    teamExpectation: team.intuitiv >= 35 ? "Das Team lebt stark vom direkten Kontakt und reibungsarmer Zusammenarbeit." : "Das Team braucht ein grundlegendes Mass an Kommunikation und Abstimmung.",
    candidatePattern: ist.intuitiv >= 35 ? `${Subj(cand)} baut schnell Vertrauen auf und sorgt für reibungsarme Zusammenarbeit.` : ist.intuitiv <= 25 ? `${Subj(cand)} kommuniziert sachlich und knapp. Beziehungsorientierte Abstimmung hat geringe Priorität.` : `${Subj(cand)} kommuniziert situativ angemessen.`,
    risk: teamGapN >= 12 ? `Kommunikationslogik weicht ab. Im Team kann das zu Missverständnissen führen.` : "Kommunikationslogik passt zum Team.",
  });

  const kultSev = severity(Math.max(teamGapI, teamGapN, teamGapA) * 0.5);
  areas.push({
    id: "culture",
    label: "Kulturwirkung",
    severity: kultSev,
    teamExpectation: tk === "analytisch" ? "Das Team pflegt Verlässlichkeit und nachvollziehbare Qualität." : tk === "impulsiv" ? "Das Team lebt eine ergebnisorientierte Kultur." : "Das Team pflegt eine kooperative Kultur.",
    candidatePattern: rk === "impulsiv" ? `${Subj(cand)} prägt die Kultur über Dynamik und Ergebnisorientierung.` : rk === "intuitiv" ? `${Subj(cand)} fördert Teamzusammenhalt und offenen Dialog.` : `${Subj(cand)} stärkt Qualitätsbewusstsein und Regelklarheit.`,
    risk: rk !== tk ? `Die Teamkultur wird sich verändern. ${Subj(cand)} bringt ${compShort(rk)}-Logik in ein ${compShort(tk)}-Team. Aktive Steuerung vermeidet Reibung.` : "Die Kulturwirkung passt zum bestehenden Team.",
  });

  return areas;
}

function buildTeamRiskTimeline(
  role: string, cand: string,
  rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number
): RiskPhase[] {
  if (rk === tk && teamIstGap <= 20) {
    return [
      { label: "Kurzfristig", period: "0 - 3 Monate", text: "Reibungslose Einarbeitung. Arbeitslogiken stimmen überein. Nur punktuelle Steuerung nötig." },
      { label: "Mittelfristig", period: "3 - 12 Monate", text: "Stabile Leistung erwartbar. Regelmässige Zielgespräche sichern die Feinsteuerung." },
      { label: "Langfristig", period: "12+ Monate", text: "Nachhaltige Besetzung wahrscheinlich. Halbjährliche Überprüfung genügt." },
    ];
  }

  let shortText: string;
  if (rk !== tk && teamIstGap > 25) {
    shortText = `Sichtbare Reibung in den ersten Wochen. ${Subj(cand)} arbeitet mit ${compShort(rk)}-Logik, das Team mit ${compShort(tk)}. Prioritäten und Arbeitsweisen kollidieren. Aktive Steuerung ab Tag 1 nötig.`;
  } else {
    shortText = `Einarbeitung verläuft mit leichten Abstimmungsverlusten. ${Subj(cand)} und das Team finden ihren Rhythmus. Klare Erwartungen beschleunigen die Integration.`;
  }

  let midText: string;
  if (rk !== tk && teamIstGap > 25) {
    midText = `Ohne Steuerung schleift sich die Reibung ein. ${Subj(cand)} passt sich entweder an (Leistungsverlust) oder beharrt auf der eigenen Logik (Konflikte). Die Führungskraft muss die Balance aktiv moderieren.`;
  } else {
    midText = `Stabile Zusammenarbeit möglich. In Einzelsituationen treten die Profilunterschiede hervor. Gezielte Feedbackschleifen halten die Dynamik steuerbar.`;
  }

  const longText = teamIstGap > 40
    ? `Ohne konsequente Steuerung droht eine dauerhafte Verschiebung der Teamkultur. Halbjährliche Überprüfung ist Pflicht. Bei anhaltender Reibung: Teamkonstellation neu bewerten.`
    : `Mit gezielter Steuerung ist eine stabile Integration erreichbar. Die Führungskraft sollte halbjährlich prüfen, ob die Teamdynamik stabil bleibt.`;

  return [
    { label: "Kurzfristig", period: "0 - 3 Monate", text: shortText },
    { label: "Mittelfristig", period: "3 - 12 Monate", text: midText },
    { label: "Langfristig", period: "12+ Monate", text: longText },
  ];
}

function buildTeamDevelopment(
  teamIstGap: number,
  rk: ComponentKey, tk: ComponentKey, cand: string
): { level: number; label: string; text: string } {
  if (teamIstGap <= 15) {
    return {
      level: 4,
      label: "hoch",
      text: `Die Anpassung ans Team ist mit hoher Wahrscheinlichkeit erreichbar. Die Grundausrichtung stimmt bereits überein. ${Subj(cand)} muss lediglich Feinabstimmung leisten.`,
    };
  }
  if (teamIstGap <= 30) {
    return {
      level: 3,
      label: "mittel",
      text: `Eine Entwicklung in Richtung besserer Teamkompatibilität ist möglich. Sie erfordert gezielte Führung und regelmässige Rückmeldung. Der Zeitraum beträgt 6 bis 12 Monate.`,
    };
  }
  if (teamIstGap <= 45) {
    return {
      level: 2,
      label: "eingeschränkt",
      text: `Eine Anpassung von ${compDesc(rk)} hin zu ${compDesc(tk)} ist möglich, aber aufwändig. Intensive Führung, klare Standards und konsequente Nachsteuerung sind Voraussetzung. Der Erfolg ist nicht sicher.`,
    };
  }
  return {
    level: 1,
    label: "niedrig",
    text: `Die Abweichung zum Team (${teamIstGap} Punkte) ist sehr hoch. Eine vollständige Anpassung ist unwahrscheinlich. Die Führungskraft sollte realistisch abwägen, ob der Steuerungsaufwand tragbar ist.`,
  };
}

function buildTeamActions(
  rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number, cand: string
): string[] {
  if (teamIstGap <= 15) {
    return [
      "Regelmässige Zielvereinbarungen zur Feinsteuerung durchführen.",
      "Halbjährliche Überprüfung der Teampassung sicherstellen.",
    ];
  }

  const base: string[] = [];

  if (teamIstGap > 15) {
    base.push(`Kick-off mit dem Team: Arbeitsweise, Erwartungen und Spielregeln transparent machen. ${Subj(cand)} und das Team müssen verstehen, was voneinander erwartet wird.`);
  }

  if (rk !== tk) {
    base.push(`Arbeitslogiken aktiv benennen. Dem Team erklären, warum ${subj(cand)} anders priorisiert. ${Subj(cand)} erklären, warum das Team anders arbeitet.`);
  }

  if (tk === "analytisch" && rk !== "analytisch") {
    base.push("Klare Entscheidungsregeln und Dokumentationsstandards für die ersten 90 Tage festlegen.");
    base.push("Wöchentliche Review-Termine mit fester KPI-Logik durchführen.");
  } else if (tk === "impulsiv" && rk !== "impulsiv") {
    base.push("Klare Umsetzungsfristen und Entscheidungsdeadlines definieren.");
    base.push("Ergebnisorientierte KPIs statt Prozess-KPIs verwenden.");
  } else if (tk === "intuitiv" && rk !== "intuitiv") {
    base.push("Regelmässige Team-Feedbackrunden und Kommunikationsformate einrichten.");
    base.push("Beziehungsarbeit als explizites Ziel in die Leistungsbewertung aufnehmen.");
  }

  if (teamIstGap > 30) {
    base.push("Wöchentliches Steuerungsmeeting: 30 Minuten zur Abstimmung von Prioritäten und Feedback. Konflikte früh ansprechen.");
  }

  base.push(`Nach 2 und 4 Wochen strukturiertes Feedback einholen, sowohl vom Team als auch von ${subj(cand)}.`);

  if (teamIstGap > 40) {
    base.push("Engmaschige Führungsbegleitung in den ersten 90 Tagen sicherstellen.");
  }

  return base.slice(0, 6);
}

function buildTeamStressBehavior(
  ist: Triad, team: Triad, cand: string,
  rk: ComponentKey, tk: ComponentKey,
  istConst: ConstellationType, teamIstGap: number
): StressBehavior {
  const istDom = dominanceModeOf(ist);
  const sk2 = istDom.top2.key;

  const sn = subj(cand);
  let controlledPressure: string;
  if (istConst === "BALANCED") {
    controlledPressure = `Wenn der Arbeitsdruck steigt, zeigt ${sn} keine klare Verhaltenstendenz. Die Reaktion hängt stark vom Kontext und der Führung ab. Das Team kann das Verhalten schwerer einschätzen.`;
  } else if (istConst.includes("NEAR")) {
    controlledPressure = `Wenn der Arbeitsdruck steigt, verstärkt sich bei ${sn} die im Moment führende Logik. Da beide Hauptanteile fast gleich stark sind, wechselt die Reaktion je nach Situation. Mal wird ${compShort(rk)} verstärkt, mal ${compShort(sk2)}.`;
  } else {
    controlledPressure = `Wenn der Arbeitsdruck steigt, verstärkt ${sn} die Tendenz zu ${compDesc(rk)}. Das hilft kurzfristig. Der sekundäre Bereich (${compShort(sk2)}) tritt in den Hintergrund.`;
  }
  if (rk !== tk) {
    controlledPressure += ` Für das Team bedeutet das: Unter Druck wird die Abweichung zur Teamlogik sichtbarer. ${Subj(cand)} reagiert mit ${compShort(rk)}, das Team erwartet ${compShort(tk)}.`;
  }

  let uncontrolledStress: string;
  if (istConst === "BALANCED") {
    uncontrolledStress = `Wenn der Druck sehr hoch wird, kann das Verhalten von ${sn} kippen oder unvorhersagbar wechseln. Keine klare Hauptlogik gibt Halt. Das Team verliert Orientierung. Klare Leitplanken und direktes Feedback sind in dieser Phase wichtig.`;
  } else {
    const d12 = ist[rk] - ist[sk2];
    if (d12 <= 5) {
      uncontrolledStress = `Wenn die Belastung sehr hoch wird, kann sich der Schwerpunkt bei ${sn} verschieben. ${Subj(cand)} bleibt in der Grundlogik erkennbar, nutzt aber spürbar stärker ${compShort(sk2)}. Für das Team wird das Verhalten weniger berechenbar.`;
    } else {
      uncontrolledStress = `Wenn die Belastung sehr hoch wird, verschiebt sich das Verhalten von ${sn} deutlich. Der sekundäre Bereich ${compShort(sk2)} tritt stärker hervor. Entscheidungen werden anders getroffen als im Normalzustand. Das Team sollte darauf vorbereitet sein.`;
    }
  }

  return { controlledPressure, uncontrolledStress };
}

function buildTeamIntegrationsplanPhasen(
  cand: string, rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number
): IntegrationPhase[] {
  const phase1Items: string[] = [];
  const phase2Items: string[] = [];
  const phase3Items: string[] = [];

  phase1Items.push("Klärung von Rolle, Erwartungshaltung und Qualitätsstandard.");
  phase1Items.push("Transparenz über bestehende Entscheidungs- und Kommunikationsstrukturen im Team.");

  if (rk !== tk) {
    phase1Items.push(`Arbeitslogik transparent machen: Dem Team erklären, dass ${subj(cand)} eine andere Arbeitsweise mitbringt. Verständnis schaffen, nicht Anpassung erzwingen.`);
  }

  phase1Items.push(`${Subj(cand)} soll in den ersten Tagen die Teamdynamik verstehen, bevor eigene Akzente gesetzt werden.`);

  if (teamIstGap > 25) {
    phase1Items.push(`Buddy benennen: Ein erfahrenes Teammitglied als informellen Ansprechpartner einsetzen.`);
  }

  phase2Items.push(`Strukturiertes Feedback vom Team und von ${subj(cand)} einholen. Was läuft gut? Wo gibt es Reibung?`);
  phase2Items.push("Prioritäten nachjustieren. Klare Vereinbarungen für die nächsten Wochen treffen.");

  if (rk !== tk) {
    phase2Items.push(`Stärken nutzen: Aufgaben zuordnen, die zur Arbeitslogik von ${subj(cand)} passen. Brücken zur Teamlogik bauen.`);
  }

  phase2Items.push(`${Subj(cand)} früh Gelegenheit geben, sichtbare Ergebnisse zu erzielen. Das baut Akzeptanz auf.`);

  if (teamIstGap > 30) {
    phase2Items.push("Eskalationsmechanismus klären: Wer moderiert bei Konflikten? Wie wird Uneinigkeit gelöst?");
  }

  phase3Items.push("Evaluation der bisherigen Wirkung auf Entscheidungsrhythmus und Teamdynamik.");
  phase3Items.push("Feinabstimmung der Zusammenarbeit mit dem direkten Umfeld.");
  phase3Items.push("Prioritäten konsolidieren und Standards stabilisieren.");

  if (teamIstGap > 25) {
    phase3Items.push("Langfristiges Steuerungskonzept festlegen. Regelmässige Checkpoints einplanen.");
  }

  const ziel1 = rk !== tk
    ? "Gegenseitiges Verständnis für Arbeitslogik und Erwartungen schaffen. Orientierung geben, ohne sofortige Anpassung zu erzwingen."
    : "Bestehende Teamlogik verstehen, eigene Arbeitsweise einordnen und erste Anschlussfähigkeit herstellen.";
  const fokus1 = teamIstGap > 30
    ? "Erwartungen aktiv klären, Buddy-System etablieren, erste Reibungspunkte offen benennen."
    : "Raum für Beobachtung geben, Grundregeln klären und Kommunikationswege transparent machen.";
  const erfolg1 = "Die Besetzung kennt die Teamlogik und weiss, wo Unterschiede bestehen. Das Team versteht die Arbeitsweise der Besetzung. Es gibt keine verdeckten Erwartungskonflikte.";

  const ziel2 = rk !== tk
    ? "Erste sichtbare Ergebnisse erzielen. Stärken der Besetzung gezielt in Aufgaben überführen und Brücken zur Teamlogik bauen."
    : "Eigenständige Wirkung aufbauen. Erste Erfolge nutzen, um Vertrauen und Akzeptanz im Team zu festigen.";
  const fokus2 = teamIstGap > 30
    ? "Strukturiertes Feedback einholen, Prioritäten nachjustieren, Eskalationsmechanismen klären."
    : "Feedback einholen, Stärken sichtbar machen, erste Verantwortungsbereiche klar definieren.";
  const erfolg2 = "Die Besetzung hat mindestens ein sichtbares Ergebnis erzielt. Feedback von Team und Besetzung liegt vor. Es gibt klare Vereinbarungen für die nächsten Wochen.";

  const ziel3 = "Zusammenarbeit stabilisieren, Standards konsolidieren und langfristige Steuerungsarchitektur verankern.";
  const fokus3 = teamIstGap > 25
    ? "Langfristiges Steuerungskonzept festlegen, regelmässige Checkpoints einplanen, Nachhaltigkeit sicherstellen."
    : "Feinabstimmung der Zusammenarbeit, Standardisierung der Routinen, Fokus auf Nachhaltigkeit.";
  const erfolg3 = "Die Zusammenarbeit läuft stabil. Entscheidungswege sind klar. Die Besetzung wird als integrierter Teil des Teams wahrgenommen.";

  return [
    { num: 1, title: "Orientierung", period: "Woche 1–2", ziel: ziel1, fuehrungsfokus: fokus1, erfolgskriterium: erfolg1, items: phase1Items },
    { num: 2, title: "Wirkung entfalten", period: "Woche 3–4", ziel: ziel2, fuehrungsfokus: fokus2, erfolgskriterium: erfolg2, items: phase2Items },
    { num: 3, title: "Konsolidierung", period: "Woche 5–8", ziel: ziel3, fuehrungsfokus: fokus3, erfolgskriterium: erfolg3, items: phase3Items },
  ];
}

function laToSystemwirkungResult(
  la: LeadershipAssessmentResult, cn: string,
  rk: ComponentKey, tk: ComponentKey, teamIstGap: number
): SystemwirkungResult {
  const siLabel = la.systemImpact.label || "Spannung";
  let type: SystemwirkungType;
  let label: string;
  let description: string;
  let chancen: string[];
  let risiken: string[];

  if (siLabel === "Verstärkung") {
    type = "verstaerkung";
    label = "Verstärkung";
    description = la.systemImpact.text || `${cn} bringt die gleiche Arbeitslogik wie das Team. Die vorhandene Dynamik wird stärker.`;
    chancen = ["Hohe Stabilität und klare Teamidentität", "Schnelle Integration ohne Reibungsverluste", "Verstärkung der Kernkompetenz des Teams"];
    risiken = ["Blinde Flecken im schwächsten Bereich werden nicht ausgeglichen", "Geringe Veränderungsfähigkeit", "Einseitige Entscheidungslogik"];
  } else if (siLabel === "Transformation") {
    type = "polarisierung";
    label = "Transformation";
    description = la.systemImpact.text || `${cn} bringt eine grundlegend andere Arbeitslogik mit. Das Team wird strukturell verändert.`;
    chancen = ["Neue Perspektiven und Innovationskraft", "Ausgleich struktureller Schwächen", "Weiterentwicklung der Teamkultur"];
    risiken = ["Hohe Reibung in der Anfangsphase", "Konflikte durch gegensätzliche Arbeitslogiken", "Risiko der Fragmentierung"];
  } else {
    type = "verschiebung";
    label = "Spannung";
    description = la.systemImpact.text || `${cn} erzeugt eine spürbare Veränderung im Team. Die Dynamik verschiebt sich, bleibt aber steuerbar.`;
    chancen = ["Produktive Reibung fördert Qualität", "Neue Impulse ohne radikale Veränderung", "Erweiterung des Handlungsspektrums"];
    risiken = ["Abstimmungsbedarf steigt", "Prioritätenkonflikte im Alltag", "Führung muss aktiv moderieren"];
  }

  const intensity: "gering" | "mittel" | "hoch" = teamIstGap <= 15 ? "gering" : teamIstGap <= 30 ? "mittel" : "hoch";
  const intensityLabel = intensity === "gering"
    ? "Die Veränderung ist subtil und gut integrierbar."
    : intensity === "mittel"
    ? "Die Veränderung ist deutlich spürbar, bleibt jedoch steuerbar."
    : "Die Veränderung ist stark. Aktive Steuerung durch die Führungskraft ist notwendig.";

  const narrative = `Systemwirkung: ${label}. ${description} Intensität: ${intensity}. ${intensityLabel}`;

  return { type, label, description, intensity, intensityLabel, chancen, risiken, narrative };
}

function buildSystemwirkungTextFromLA(
  cand: string, role: string,
  la: LeadershipAssessmentResult,
  teamIstGap: number,
  rk: ComponentKey, tk: ComponentKey
): string {
  const lines: string[] = [];
  const sn = subj(cand);

  if (la.systemImpact.text) {
    lines.push(la.systemImpact.text);
  }

  if (la.systemImpact.reasons.length > 0) {
    lines.push("");
    for (const r of la.systemImpact.reasons) {
      lines.push(`• ${r}`);
    }
  }

  lines.push("");
  lines.push("Abgleich mit Teamprofil:");
  lines.push("");

  if (teamIstGap <= 15) {
    lines.push(`Die Arbeitslogik von ${sn} liegt nahe am Teamprofil. Die Integration verläuft voraussichtlich reibungsarm.`);
  } else if (teamIstGap <= 30) {
    lines.push(`Die Arbeitslogik von ${sn} weicht erkennbar vom Teamprofil ab (${teamIstGap} Punkte). In einzelnen Bereichen muss gezielt nachgesteuert werden.`);
  } else {
    lines.push(`Die Arbeitslogik von ${sn} weicht deutlich vom Teamprofil ab (${teamIstGap} Punkte). Ohne aktive Steuerung wird die Teamdynamik spürbar verändert.`);
  }

  if (la.integrationEffort.text) {
    lines.push("");
    lines.push(`Integrationsaufwand: ${la.integrationEffort.label || ""}`);
    lines.push(la.integrationEffort.text);
  }

  if (la.teamGoalImpact.label && la.teamGoalImpact.text) {
    lines.push("");
    lines.push(`Wirkung aufs Teamziel: ${la.teamGoalImpact.label}`);
    lines.push(la.teamGoalImpact.text);
  }

  return lines.join("\n");
}

function buildManagementSummaryV2(
  role: string, cand: string,
  ist: Triad, team: Triad,
  teamIstGap: number, teamIstLevel: string,
  rk: ComponentKey, tk: ComponentKey,
  istLabel: string, teamLabel: string,
  gesamtpassung: GesamtpassungLevel, gesamtpassungLabel: string,
  v4: import("./teamcheck-v4-engine").TeamCheckV4Result | null,
  la: LeadershipAssessmentResult | undefined,
  isFK: boolean,
  teamGoal: import("./teamcheck-v3-engine").TeamGoal
): string {
  const lines: string[] = [];
  lines.push(`Rolle: ${role}`);
  lines.push(`Person: ${cand}`);
  lines.push(`Personenprofil: ${istLabel} (I ${ist.impulsiv}% / N ${ist.intuitiv}% / A ${ist.analytisch}%)`);
  lines.push(`Teamprofil: ${teamLabel} (I ${team.impulsiv}% / N ${team.intuitiv}% / A ${team.analytisch}%)`);
  if (isFK) lines.push("Rolle: Führungskraft");

  lines.push("");
  lines.push(`Abweichung Team vs. Person: ${teamIstGap} Punkte (${teamIstLevel})`);
  lines.push(`Gesamtbewertung: ${gesamtpassungLabel}`);

  if (v4) {
    lines.push(`Teampassung: ${v4.passungZumTeam}`);
    lines.push(`Beitrag zur Aufgabe: ${v4.beitragZurAufgabe}`);
    lines.push(`Begleitungsbedarf: ${v4.begleitungsbedarf}`);
  }

  if (isFK && la?.show) {
    if (la.systemImpact.label) lines.push(`Systemwirkung (FK): ${la.systemImpact.label}`);
    if (la.integrationEffort.label) lines.push(`Integrationsaufwand (FK): ${la.integrationEffort.label}`);
    if (la.teamGoalImpact.label) lines.push(`Wirkung aufs Teamziel: ${la.teamGoalImpact.label}`);
  }

  lines.push("");

  const s = Subj(cand);
  if (gesamtpassung === "geeignet") {
    lines.push(`${s} passt strukturell zum bestehenden Team. Die Arbeitslogiken sind kompatibel. Die Integration wird voraussichtlich reibungsarm verlaufen.`);
  } else if (gesamtpassung === "bedingt") {
    lines.push(`${s} zeigt Abweichungen zum Teamprofil. Die Integration ist steuerbar, erfordert aber gezielte Aufmerksamkeit in den ersten Wochen. Entscheidend sind klare Erwartungen und regelmässige Abstimmung.`);
  } else {
    lines.push(`${s} weicht deutlich vom Teamprofil ab. Ohne aktive Steuerung sind Reibung, Konflikte und Leistungseinbrüche wahrscheinlich. Die ersten 30 Tage sind entscheidend.`);
  }

  if (teamGoal && v4) {
    const GOAL_LABELS: Record<string, string> = { umsetzung: "Umsetzung und Ergebnisse", analyse: "Analyse und Struktur", zusammenarbeit: "Zusammenarbeit und Kommunikation" };
    const gl = GOAL_LABELS[teamGoal] || teamGoal;
    lines.push("");
    lines.push(`Funktionsziel „${gl}": ${v4.beitragZurAufgabe}`);
  }

  return lines.join("\n");
}

function buildSystemfazitV2(
  role: string, cand: string,
  ist: Triad, team: Triad,
  teamIstGap: number,
  rk: ComponentKey, tk: ComponentKey,
  gesamtpassung: GesamtpassungLevel,
  v4: import("./teamcheck-v4-engine").TeamCheckV4Result | null,
  la: LeadershipAssessmentResult | undefined,
  isFK: boolean,
  teamGoal: import("./teamcheck-v3-engine").TeamGoal
): string {
  const lines: string[] = [];
  const s = Subj(cand);
  const sn = subj(cand);

  if (gesamtpassung === "geeignet") {
    lines.push(`${s} passt strukturell zum bestehenden Team. Die Arbeitslogiken sind kompatibel. Die Integration wird voraussichtlich reibungsarm verlaufen. Normale Führungssteuerung ist ausreichend.`);
    lines.push("");
    lines.push(`Fokuspunkte: Teamkultur bestätigen, Ergänzungspotenziale bewusst nutzen, Feedbackschleifen einbauen.`);
  } else if (gesamtpassung === "bedingt") {
    lines.push(`${s} ist steuerbar ins Team integrierbar. Es gibt erkennbare Abweichungen zum Team (${teamIstGap} Punkte), die mit gezielter Steuerung ausgeglichen werden können.`);
    lines.push("");
    lines.push(`Entscheidend sind die ersten 30 Tage: Klare Erwartungen setzen, Kommunikation bewusst steuern, Feedback strukturiert einholen. Wenn die Integration aktiv begleitet wird, kann ${sn} die Rolle wirksam ausfüllen.`);
    if (rk !== tk) {
      lines.push("");
      lines.push(`Die unterschiedliche Arbeitslogik (${compShort(rk)} vs. ${compShort(tk)}) ist kein Ausschlusskriterium, erfordert aber bewusste Steuerung. In Drucksituationen muss die Führung aktiv moderieren.`);
    }
  } else {
    lines.push(`${s} zeigt deutliche Abweichungen zum Team (${teamIstGap} Punkte). Ohne aktive und konsequente Steuerung sind Reibung, Konflikte und Leistungseinbrüche wahrscheinlich.`);
    lines.push("");
    lines.push(`Die Integration stellt eine erhebliche Herausforderung dar. Die Arbeitslogiken von ${sn} und dem Team sind grundlegend verschieden. Die ersten 30 Tage sind entscheidend: Klare Kommunikation, definierte Entscheidungswege und aktives Erwartungsmanagement sind Pflicht.`);
    lines.push("");
    lines.push(`Empfehlung: Nur mit Steuerungskonzept und aktiver Führungsbegleitung einsetzen. Regelmässige Checkpoints einplanen. Eskalationsmechanismen vorab klären.`);
  }

  if (isFK && la?.show) {
    lines.push("");
    lines.push("--- Führungskraft-spezifisch ---");
    if (la.systemImpact.label && la.systemImpact.text) {
      lines.push("");
      lines.push(`Systemwirkung: ${la.systemImpact.label}`);
      lines.push(la.systemImpact.text);
    }
    if (la.integrationEffort.label && la.integrationEffort.text) {
      lines.push("");
      lines.push(`Integrationsaufwand: ${la.integrationEffort.label}`);
      lines.push(la.integrationEffort.text);
    }
    if (la.teamGoalImpact.label && la.teamGoalImpact.text) {
      lines.push("");
      lines.push(`Wirkung aufs Teamziel: ${la.teamGoalImpact.label}`);
      lines.push(la.teamGoalImpact.text);
    }
  } else if (teamGoal && v4) {
    const GOAL_LABELS: Record<string, string> = { umsetzung: "Umsetzung und Ergebnisse", analyse: "Analyse und Struktur", zusammenarbeit: "Zusammenarbeit und Kommunikation" };
    const gl = GOAL_LABELS[teamGoal] || teamGoal;
    lines.push("");
    lines.push(`Funktionsziel „${gl}": ${v4.beitragZurAufgabe}`);
  }

  return lines.join("\n");
}

export function computeTeamReport(
  roleName: string,
  candidateName: string,
  istProfile: Triad,
  teamProfile: Triad,
  options?: TeamReportOptions
): TeamReportResult {
  const ist = normalizeTriad(istProfile);
  const team = normalizeTriad(teamProfile);

  const istDom = dominanceModeOf(ist);
  const teamDom = dominanceModeOf(team);

  const istConst = detectConstellation(ist);
  const teamConst = detectConstellation(team);

  const istLabel = constellationLabel(istConst);
  const teamLabel = constellationLabel(teamConst);

  const teamIstGap = totalGapOf(team, ist);
  const teamIstLevel = gapLabel(teamIstGap);

  const cn = candidateName || "Die neue Person";
  const rk = istDom.top1.key;
  const tk = teamDom.top1.key;

  const isFK = options?.roleType === "fuehrung" || options?.roleType === "Führungskraft" || options?.roleType === "leadership";
  const teamGoalRaw = (options?.teamGoal || null) as import("./teamcheck-v3-engine").TeamGoal;

  let v4Result: import("./teamcheck-v4-engine").TeamCheckV4Result | null = null;
  let laResult: LeadershipAssessmentResult | undefined;

  if (options) {
    try {
      v4Result = computeTeamCheckV4({
        roleTitle: roleName || "",
        roleLevel: options.roleLevel || "-",
        taskStructure: options.taskStructure || "-",
        workStyle: options.workStyle || "-",
        successFocus: options.successFocus || [],
        teamProfile: team,
        personProfile: ist,
        candidateName: cn,
        teamGoal: teamGoalRaw,
        roleType: isFK ? "fuehrung" : "teammitglied",
      });
    } catch {}

    if (isFK) {
      laResult = calculateLeadershipAssessment(ist, team, "fuehrung", teamGoalRaw);
    }
  }

  let gesamtpassung: GesamtpassungLevel;
  let gesamtpassungLabel: string;
  if (v4Result) {
    const ge = v4Result.gesamteinschaetzung;
    if (ge === "Gut passend") { gesamtpassung = "geeignet"; gesamtpassungLabel = "Gut passend"; }
    else if (ge === "Kritisch") { gesamtpassung = "kritisch"; gesamtpassungLabel = "Kritisch"; }
    else { gesamtpassung = "bedingt"; gesamtpassungLabel = ge || "Bedingt passend"; }
  } else {
    const status = ampel(teamIstGap);
    gesamtpassung = status === "gruen" ? "geeignet" : status === "gelb" ? "bedingt" : "kritisch";
    gesamtpassungLabel = gesamtpassung === "geeignet" ? "Geeignet" : gesamtpassung === "bedingt" ? "Bedingt geeignet" : "Kritisch";
  }

  let controlIntensity: "gering" | "mittel" | "hoch";
  if (v4Result) {
    const bb = v4Result.begleitungsbedarf.toLowerCase();
    controlIntensity = bb === "hoch" ? "hoch" : bb === "gering" ? "gering" : "mittel";
  } else {
    controlIntensity = teamIstGap > 40 ? "hoch" : teamIstGap > 20 ? "mittel" : "gering";
  }

  const status = ampel(teamIstGap);
  const entscheidungsfaktoren = buildEntscheidungsfaktoren(cn, ist, team, teamIstGap, rk, tk);

  const managementSummary = buildManagementSummaryV2(roleName, cn, ist, team, teamIstGap, teamIstLevel, rk, tk, istLabel, teamLabel, gesamtpassung, gesamtpassungLabel, v4Result, laResult, isFK, teamGoalRaw);
  const teamstruktur = buildTeamstruktur(team, teamDom, teamConst, teamLabel, tk);
  const fuehrungsprofil = buildFuehrungsprofil(cn, ist, istDom, istConst, istLabel, rk);

  let systemwirkungResult: SystemwirkungResult;
  let systemwirkung: string;
  if (isFK && laResult?.show && laResult.systemImpact.label) {
    systemwirkungResult = laToSystemwirkungResult(laResult, cn, rk, tk, teamIstGap);
    systemwirkung = buildSystemwirkungTextFromLA(cn, roleName, laResult, teamIstGap, rk, tk);
  } else {
    systemwirkungResult = detectSystemwirkung(ist, team, cn, rk, tk, teamIstGap, istConst, teamConst);
    systemwirkung = buildSystemwirkungText(cn, roleName, ist, team, rk, tk, teamIstGap, istConst, teamConst, systemwirkungResult);
  }

  const teamdynamikAlltag = buildTeamdynamikAlltag(cn, ist, team, rk, tk, teamIstGap);
  const chancen = buildChancen(cn, ist, team, rk, tk, teamIstGap);
  const risiken = buildRisiken(cn, ist, team, rk, tk, teamIstGap);
  const verhaltenUnterDruck = buildVerhaltenUnterDruck(cn, ist, team, rk, tk, istConst, teamIstGap);
  const kulturwirkung = buildKulturwirkung(cn, ist, team, rk, tk, teamIstGap);
  const fuehrungshebel = buildFuehrungshebel(cn, rk, tk, teamIstGap);
  const integrationsplan = buildIntegrationsplan(cn, rk, tk, teamIstGap);
  const systemfazit = buildSystemfazitV2(roleName, cn, ist, team, teamIstGap, rk, tk, gesamtpassung, v4Result, laResult, isFK, teamGoalRaw);

  const impactAreas = buildTeamImpactAreas(rk, tk, ist, team, cn);
  const riskTimeline = buildTeamRiskTimeline(roleName, cn, rk, tk, teamIstGap);
  const { level: developmentLevel, label: developmentLabel, text: developmentText } = buildTeamDevelopment(teamIstGap, rk, tk, cn);
  const actions = buildTeamActions(rk, tk, teamIstGap, cn);
  const stressBehavior = buildTeamStressBehavior(ist, team, cn, rk, tk, istConst, teamIstGap);
  const integrationsplanPhasen = buildTeamIntegrationsplanPhasen(cn, rk, tk, teamIstGap);

  const GOAL_LABELS: Record<string, string> = {
    umsetzung: "Umsetzung und Ergebnisse",
    analyse: "Analyse und Struktur",
    zusammenarbeit: "Zusammenarbeit und Kommunikation",
  };

  return {
    gesamtpassung,
    gesamtpassungLabel,
    entscheidungsfaktoren,
    controlIntensity,
    teamIstGap,
    managementSummary,
    teamstruktur,
    fuehrungsprofil,
    systemwirkung,
    systemwirkungResult,
    teamdynamikAlltag,
    chancen,
    risiken,
    verhaltenUnterDruck,
    kulturwirkung,
    fuehrungshebel,
    integrationsplan,
    systemfazit,
    impactAreas,
    riskTimeline,
    developmentLevel,
    developmentLabel,
    developmentText,
    actions,
    stressBehavior,
    integrationsplanPhasen,
    istConstellationLabel: istLabel,
    teamConstellationLabel: teamLabel,
    leadershipAssessment: laResult,
    v4Passung: v4Result?.passungZumTeam || undefined,
    v4Beitrag: v4Result?.beitragZurAufgabe || undefined,
    v4Begleitung: v4Result?.begleitungsbedarf || undefined,
    v4GesamtLabel: v4Result?.gesamteinschaetzung || undefined,
    teamGoalLabel: teamGoalRaw ? (GOAL_LABELS[teamGoalRaw] || teamGoalRaw) : undefined,
    isFK,
  };
}

function buildEntscheidungsfaktoren(
  cand: string, ist: Triad, team: Triad,
  teamIstGap: number,
  rk: ComponentKey, tk: ComponentKey
): string[] {
  const status = ampel(teamIstGap);
  const negative: { priority: number; text: string }[] = [];
  const positive: { priority: number; text: string }[] = [];

  const keys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
  for (const k of keys) {
    const gap = Math.abs(ist[k] - team[k]);
    if (gap > 15) {
      negative.push({ priority: gap, text: `${compShort(k)}-Kompetenz weicht ${gap > 20 ? "deutlich" : "erkennbar"} vom Teamprofil ab (${ist[k]}% vs. ${team[k]}%)` });
    }
  }

  if (rk !== tk) {
    negative.push({ priority: teamIstGap, text: `Arbeitslogik verschieden: Person setzt auf ${compShort(rk)}, Team arbeitet mit ${compShort(tk)}` });
  }

  const tempoGap = Math.abs(ist.impulsiv - team.impulsiv);
  if (tempoGap > 15) {
    negative.push({ priority: tempoGap, text: `Tempounterschied ${ist.impulsiv > team.impulsiv ? "zu hoch" : "zu niedrig"} (${tempoGap} Punkte Abweichung)` });
  }

  if (teamIstGap > 30) {
    negative.push({ priority: teamIstGap, text: `Teamintegration erschwert durch hohe Profilabweichung (${teamIstGap} Punkte)` });
  }

  if (rk === tk) {
    positive.push({ priority: 10, text: "Arbeitslogik von Person und Team stimmen überein" });
  }

  if (teamIstGap <= 15) {
    positive.push({ priority: 5, text: `Hohe Teamkompatibilität (${teamIstGap} Punkte Abweichung)` });
  }

  negative.sort((a, b) => b.priority - a.priority);
  positive.sort((a, b) => b.priority - a.priority);

  if (status === "rot") {
    return negative.slice(0, 3).map(f => f.text);
  }
  if (status === "gruen") {
    const combined = [...positive, ...negative];
    combined.sort((a, b) => b.priority - a.priority);
    return combined.slice(0, 3).map(f => f.text);
  }
  const combined = [...negative, ...positive];
  combined.sort((a, b) => b.priority - a.priority);
  return combined.slice(0, 3).map(f => f.text);
}


function buildTeamstruktur(
  team: Triad, teamDom: ReturnType<typeof dominanceModeOf>,
  teamConst: ConstellationType, teamLabel: string, tk: ComponentKey
): string {
  const lines: string[] = [];
  lines.push(`Das Team zeigt aktuell ${teamLabel.toLowerCase()}. Der stärkste Anteil liegt bei ${compDesc(tk)} (${team[tk]}%).`);

  const wk = weakestKey(team);
  lines.push(`Der schwächste Bereich ist ${compDesc(wk)} (${team[wk]}%).`);
  lines.push("");

  if (teamConst.includes("DOM")) {
    lines.push(`Die klare Ausrichtung auf ${compShort(tk)} gibt dem Team eine eindeutige Arbeitslogik. Entscheidungen und Prioritäten folgen einer einheitlichen Linie. Gleichzeitig besteht das Risiko, dass der Bereich ${compDesc(wk)} systematisch vernachlässigt wird.`);
  } else if (teamConst.includes("NEAR")) {
    lines.push(`Das Team arbeitet mit einer Doppelausrichtung. Je nach Situation wird zwischen zwei Logiken gewechselt. Das gibt Flexibilität, kann aber zu Unklarheit führen, wenn Prioritäten nicht klar gesetzt werden.`);
  } else if (teamConst === "BALANCED") {
    lines.push(`Das Team zeigt keine klare Einseitigkeit. Alle drei Bereiche sind relativ ausgeglichen vertreten. Das sorgt für Vielseitigkeit, kann aber dazu führen, dass in keinem Bereich konsequent genug gearbeitet wird.`);
  } else {
    lines.push(`Das Team ist primär auf ${compShort(tk)} ausgerichtet, hat aber einen erkennbaren sekundären Anteil. Dieses Profil ermöglicht eine fokussierte Arbeitsweise mit zusätzlicher Flexibilität im Nebenbereich.`);
  }

  return lines.join("\n");
}

function buildFuehrungsprofil(
  cand: string, ist: Triad, istDom: ReturnType<typeof dominanceModeOf>,
  istConst: ConstellationType, istLabel: string, rk: ComponentKey
): string {
  const lines: string[] = [];
  const sk2 = istDom.top2.key;
  const s = Subj(cand);
  const sn = subj(cand);
  lines.push(`${s} zeigt ${istLabel.toLowerCase()}. Der primäre Antrieb liegt bei ${compDesc(rk)} (${ist[rk]}%), der sekundäre bei ${compDesc(sk2)} (${ist[sk2]}%).`);
  lines.push("");

  if (rk === "impulsiv") {
    lines.push(`${s} arbeitet mit hoher Umsetzungsenergie. Entscheidungen werden zügig getroffen, Themen schnell in Bewegung gebracht. In der Zusammenarbeit ist das Tempo spürbar. Langwierige Abstimmungsprozesse werden als bremsend empfunden.`);
  } else if (rk === "intuitiv") {
    lines.push(`${s} arbeitet beziehungsorientiert. Zusammenarbeit, Kommunikation und das Erfassen von Situationen stehen im Vordergrund. Entscheidungen werden im Kontext der beteiligten Menschen getroffen. Reine Sachorientierung ohne Beziehungsebene wird als unvollständig empfunden.`);
  } else {
    lines.push(`${s} arbeitet strukturiert und planvoll. Qualität entsteht über Ordnung, sorgfältige Prüfung und klare Abläufe. Schnelle, ungeprüfte Entscheidungen werden als riskant eingestuft. Verlässlichkeit hat Vorrang vor Geschwindigkeit.`);
  }

  lines.push("");
  if (istConst.includes("NEAR") || istConst === "BALANCED") {
    lines.push(`Durch die ausgeglichene Profilstruktur kann ${sn} situativ zwischen verschiedenen Arbeitsweisen wechseln. Das erhöht die Anpassungsfähigkeit, macht das Verhalten aber auch weniger vorhersagbar.`);
  } else {
    lines.push(`Der sekundäre Anteil (${compShort(sk2)}) stabilisiert die Hauptlogik. ${s} nutzt ${compDesc(sk2)} als Ergänzung, nicht als Alternative. In Drucksituationen tritt die Hauptlogik noch deutlicher hervor.`);
  }

  return lines.join("\n");
}

function buildSystemwirkungText(
  cand: string, role: string,
  ist: Triad, team: Triad,
  rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number,
  istConst: ConstellationType, teamConst: ConstellationType,
  sw: SystemwirkungResult
): string {
  const lines: string[] = [];

  lines.push(sw.description);

  lines.push("");
  lines.push("Abgleich mit Teamprofil:");
  lines.push("");

  const sn = subj(cand);
  if (teamIstGap <= 15) {
    lines.push(`Die Arbeitslogik von ${sn} liegt nahe am Teamprofil. Die Integration verläuft voraussichtlich reibungsarm.`);
  } else if (teamIstGap <= 30) {
    lines.push(`Die Arbeitslogik von ${sn} weicht erkennbar vom Teamprofil ab (${teamIstGap} Punkte). In einzelnen Bereichen muss gezielt nachgesteuert werden.`);
  } else {
    lines.push(`Die Arbeitslogik von ${sn} weicht deutlich vom Teamprofil ab (${teamIstGap} Punkte). Ohne aktive Steuerung wird die Teamdynamik spürbar verändert.`);
  }

  return lines.join("\n");
}

function buildTeamdynamikAlltag(
  cand: string, ist: Triad, team: Triad,
  rk: ComponentKey, tk: ComponentKey, teamIstGap: number
): string {
  const lines: string[] = [];

  const s = Subj(cand);
  const sn = subj(cand);
  lines.push("Entscheidungen:");
  if (rk === tk) {
    lines.push(`${s} und das Team treffen Entscheidungen nach ähnlicher Logik. Die Abstimmung ist unkompliziert, Prioritäten werden gleichartig gesetzt.`);
  } else if (rk === "impulsiv" && tk === "analytisch") {
    lines.push(`${s} entscheidet schneller als das Team es gewohnt ist. Das Team prüft gründlich, ${sn} will zügig handeln. Es entsteht Spannung zwischen Tempo und Gründlichkeit.`);
  } else if (rk === "analytisch" && tk === "impulsiv") {
    lines.push(`${s} bremst das Tempo des Teams. Wo das Team schnell entscheiden will, fordert ${sn} Prüfung und Absicherung. Das Team empfindet das als Verzögerung.`);
  } else if (rk === "intuitiv") {
    lines.push(`${s} bezieht bei Entscheidungen stärker den menschlichen Kontext ein. Das Team ist stärker auf ${compShort(tk)} ausgerichtet. Abstimmungsprozesse können dadurch länger dauern.`);
  } else {
    lines.push(`Die Entscheidungslogik von ${sn} unterscheidet sich vom Team. ${s} priorisiert ${compShort(rk)}, das Team setzt auf ${compShort(tk)}. Im Alltag führt das zu unterschiedlichen Bewertungen gleicher Situationen.`);
  }

  lines.push("");
  lines.push("Kommunikation:");
  if (teamIstGap <= 15) {
    lines.push(`Die Kommunikation verläuft voraussichtlich reibungsarm. ${s} und das Team sprechen eine ähnliche Sprache. Missverständnisse sind selten.`);
  } else if (teamIstGap <= 30) {
    lines.push(`In der Kommunikation sind Abstimmungsverluste möglich. ${s} betont andere Aspekte als das Team. Klare Kommunikationsregeln helfen, Missverständnisse zu vermeiden.`);
  } else {
    lines.push(`Die Kommunikationslogiken weichen deutlich voneinander ab. Was ${sn} als wichtig einstuft, priorisiert das Team anders. Ohne bewusste Steuerung entstehen regelmässig Missverständnisse und Frustrationen.`);
  }

  lines.push("");
  lines.push("Arbeitstempo:");
  const tempoGap = Math.abs(ist.impulsiv - team.impulsiv);
  if (tempoGap <= 8) {
    lines.push(`Das Arbeitstempo ist kompatibel. ${s} und das Team arbeiten in einem ähnlichen Rhythmus.`);
  } else if (tempoGap <= 18) {
    lines.push(`Es gibt spürbare Tempounterschiede. ${ist.impulsiv > team.impulsiv ? `${s} arbeitet schneller als das Team.` : `Das Team arbeitet schneller als ${sn}.`} Das erfordert bewusste Abstimmung.`);
  } else {
    lines.push(`Das Arbeitstempo unterscheidet sich deutlich. ${ist.impulsiv > team.impulsiv ? `${s} arbeitet erheblich schneller als das Team. Das Team kann unter Druck geraten.` : `${s} arbeitet deutlich langsamer als das Team. Das Team empfindet das als Bremse.`}`);
  }

  return lines.join("\n");
}

function buildChancen(
  cand: string, ist: Triad, team: Triad,
  rk: ComponentKey, tk: ComponentKey, teamIstGap: number
): string {
  const items: string[] = [];

  const s = Subj(cand);
  if (rk !== tk) {
    const teamWeak = weakestKey(team);
    if (rk === teamWeak) {
      items.push(`${s} stärkt den bisher schwächsten Bereich des Teams (${compDesc(teamWeak)}). Das gleicht eine strukturelle Lücke aus und macht das Team vielseitiger.`);
    }
    items.push(`Die unterschiedliche Arbeitslogik bringt eine neue Perspektive ins Team. Entscheidungen werden breiter abgestützt, wenn die Vielfalt bewusst genutzt wird.`);
  }

  if (rk === tk) {
    items.push(`${s} verstärkt den Kernbereich des Teams (${compDesc(rk)}). Die Teamlogik wird konsequenter umgesetzt und stabilisiert.`);
  }

  if (ist.intuitiv >= 35) {
    items.push(`${s} bringt hohe Beziehungsfähigkeit mit. Das kann die Teamkohäsion stärken und Konflikte frühzeitig entschärfen.`);
  }

  if (ist.analytisch >= 35) {
    items.push(`${s} bringt hohe Strukturorientierung mit. Das kann Prozessqualität und Verlässlichkeit im Team verbessern.`);
  }

  if (ist.impulsiv >= 35) {
    items.push(`${s} bringt hohe Umsetzungsenergie mit. Das kann das Arbeitstempo steigern und Ergebnisorientierung stärken.`);
  }

  if (items.length === 0) {
    items.push(`${s} bringt ein ausgeglichenes Profil mit. Das sorgt für Flexibilität und situative Anpassungsfähigkeit.`);
  }

  return items.join("\n\n");
}

function buildRisiken(
  cand: string, ist: Triad, team: Triad,
  rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number
): string {
  const items: string[] = [];

  const sn = subj(cand);
  const s = Subj(cand);
  if (rk !== tk && teamIstGap > 25) {
    items.push(`Hohe Abweichung zum Teamprofil (${teamIstGap} Punkte): Die unterschiedliche Arbeitslogik kann im Alltag zu wiederkehrenden Konflikten führen. Das Team empfindet die Arbeitsweise von ${sn} als fremd oder störend.`);
  } else if (rk !== tk && teamIstGap > 15) {
    items.push(`Spürbare Abweichung zum Teamprofil (${teamIstGap} Punkte): In Drucksituationen können die unterschiedlichen Logiken aufeinanderprallen. Gezielte Steuerung reduziert das Risiko.`);
  }

  if (rk === tk) {
    const teamWeak = weakestKey(team);
    if (weakestKey(ist) === teamWeak) {
      items.push(`Verstärkung des blinden Flecks: ${s} und das Team teilen die gleiche Schwäche im Bereich ${compDesc(teamWeak)}. Dieser Bereich wird weiter vernachlässigt.`);
    }
  }

  const strukturGap = Math.abs(ist.analytisch - team.analytisch);
  if (strukturGap > 15 && ist.analytisch < team.analytisch) {
    items.push(`${s} bringt weniger Strukturorientierung mit als das Team. Qualitätsstandards und Dokumentation können darunter leiden.`);
  }

  const tempoGap = Math.abs(ist.impulsiv - team.impulsiv);
  if (tempoGap > 15 && ist.impulsiv > team.impulsiv) {
    items.push(`${s} arbeitet deutlich tempoorientierter als das Team. Das Team kann unter Zeitdruck geraten und Fehlerquoten steigen.`);
  }

  if (items.length === 0) {
    items.push(`Die Risiken sind bei der aktuellen Konstellation gering. Die Profile sind kompatibel. Normale Steuerung ist ausreichend.`);
  }

  return items.join("\n\n");
}

function buildVerhaltenUnterDruck(
  cand: string, ist: Triad, team: Triad,
  rk: ComponentKey, tk: ComponentKey,
  istConst: ConstellationType, teamIstGap: number
): string {
  const lines: string[] = [];
  const istDom = dominanceModeOf(ist);
  const sk2 = istDom.top2.key;

  const sn = subj(cand);
  lines.push("Kontrollierter Druck:");
  lines.push("");
  if (istConst === "BALANCED") {
    lines.push(`Wenn der Arbeitsdruck steigt, zeigt ${sn} keine sehr klare Verhaltenstendenz. Da das Profil ausgeglichen ist, hängt die Reaktion stark vom Kontext und der Führung ab. Das Team kann das Verhalten schwerer einschätzen.`);
  } else if (istConst.includes("NEAR")) {
    lines.push(`Wenn der Arbeitsdruck steigt, verstärkt sich bei ${sn} die im Moment führende Logik. Da beide Hauptanteile fast gleich stark sind, kann die Reaktion je nach Situation unterschiedlich ausfallen. Mal wird stärker über ${compShort(rk)} gesteuert, mal über ${compShort(sk2)}.`);
  } else {
    lines.push(`Wenn der Arbeitsdruck steigt, verstärkt ${sn} die Tendenz zu ${compDesc(rk)}. Das hilft, die eigene Situation kurzfristig zu stabilisieren. Gleichzeitig tritt der sekundäre Bereich (${compShort(sk2)}) in den Hintergrund.`);
  }

  if (rk !== tk) {
    lines.push(`Für das Team bedeutet das: Unter Druck wird die Abweichung zur Teamlogik noch sichtbarer. ${Subj(cand)} reagiert mit ${compShort(rk)}, das Team erwartet ${compShort(tk)}.`);
  }

  lines.push("");
  lines.push("Unkontrollierter Stress:");
  lines.push("");

  if (istConst === "BALANCED") {
    lines.push(`Wenn der Druck sehr hoch wird, kann das Verhalten von ${sn} kippen oder unvorhersagbar wechseln. Keine klare Hauptlogik gibt Halt. Das Team verliert Orientierung. Klare Leitplanken und direktes Feedback sind in dieser Phase besonders wichtig.`);
  } else {
    const d12 = ist[rk] - ist[sk2];
    if (d12 <= 5) {
      lines.push(`Wenn die Belastung sehr hoch wird, kann sich der Schwerpunkt bei ${sn} verschieben. ${Subj(cand)} bleibt in der Grundlogik erkennbar, nutzt aber spürbar stärker ${compShort(sk2)}. Für das Team wird das Verhalten weniger berechenbar.`);
    } else {
      lines.push(`Wenn die Belastung sehr hoch wird, verschiebt sich das Verhalten von ${sn} deutlich. Der sekundäre Bereich ${compShort(sk2)} tritt stärker hervor. Entscheidungen werden anders getroffen als im Normalzustand. Das Team sollte darauf vorbereitet sein.`);
    }
  }

  return lines.join("\n");
}

function buildKulturwirkung(
  cand: string, ist: Triad, team: Triad,
  rk: ComponentKey, tk: ComponentKey, teamIstGap: number
): string {
  const lines: string[] = [];

  const s = Subj(cand);
  if (rk === tk && teamIstGap <= 15) {
    lines.push(`${s} bestätigt die bestehende Teamkultur. Die Werte, Arbeitsweisen und Kommunikationsmuster bleiben stabil. Das Team wird die neue Person als passend empfinden.`);
  } else if (rk === tk && teamIstGap > 15) {
    lines.push(`${s} teilt die Grundausrichtung des Teams, aber in einer anderen Intensität. Die Kultur bleibt in ihrer Richtung stabil, aber die Ausprägung verändert sich. ${ist[rk] > team[rk] ? `${s} lebt die gemeinsame Logik konsequenter als das Team.` : `Das Team lebt die gemeinsame Logik konsequenter als ${subj(cand)}.`}`);
  } else {
    lines.push(`${s} bringt eine andere Arbeitslogik mit als das Team. Das verändert die Teamkultur spürbar.`);

    if (rk === "impulsiv") {
      lines.push(`${s} bringt mehr Tempo und Ergebnisorientierung ein. Das Team wird herausgefordert, schneller zu entscheiden und zu handeln. Für ein Team mit hoher ${compShort(tk)}-Orientierung kann das als Druck empfunden werden.`);
    } else if (rk === "intuitiv") {
      lines.push(`${s} bringt mehr Beziehungsorientierung und Kommunikation ein. Das Team wird herausgefordert, stärker auf zwischenmenschliche Dynamiken zu achten. Das kann bereichernd sein, aber auch als langsam empfunden werden.`);
    } else {
      lines.push(`${s} bringt mehr Struktur und Gründlichkeit ein. Das Team wird herausgefordert, sorgfältiger zu arbeiten und Abläufe stärker zu formalisieren. Das kann als einschränkend empfunden werden.`);
    }
  }

  return lines.join("\n");
}

function buildFuehrungshebel(
  cand: string, rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number
): string {
  const items: string[] = [];

  if (teamIstGap > 15) {
    items.push(`Erwartungsklärung: In der ersten Woche ein Kick-off mit dem gesamten Team durchführen. Prioritäten, Entscheidungswege und Qualitätsmassstäbe transparent machen. ${Subj(cand)} und das Team müssen verstehen, was voneinander erwartet wird.`);
  }

  if (rk !== tk) {
    items.push(`Übersetzungshilfe: Die unterschiedlichen Arbeitslogiken aktiv benennen. Dem Team erklären, warum ${subj(cand)} anders priorisiert. ${Subj(cand)} erklären, warum das Team anders arbeitet. Verständnis reduziert Reibung.`);
  }

  if (teamIstGap > 30) {
    items.push(`Entscheidungszeitfenster definieren: Klare Fristen für Entscheidungen verhindern Endlosschleifen und reduzieren Reibung. Besonders wichtig bei unterschiedlichen Tempi.`);
    items.push(`Wöchentliches Steuerungsmeeting: 30 Minuten zur Abstimmung von Prioritäten, offenen Punkten und Feedback. Konflikte früh ansprechen, bevor sie eskalieren.`);
  }

  items.push(`Feedbackschleifen einbauen: Nach 2 und 4 Wochen strukturiertes Feedback einholen, sowohl vom Team als auch von ${subj(cand)}. Stimmungen und Reibungspunkte frühzeitig erkennen.`);

  if (rk === "impulsiv" && tk !== "impulsiv") {
    items.push(`Tempo steuern: ${Subj(cand)} wird schneller arbeiten wollen als das Team. Klare Meilensteine und Prüfpunkte setzen, damit Tempo nicht auf Kosten der Qualität geht.`);
  }

  if (rk === "analytisch" && tk !== "analytisch") {
    items.push(`Struktur dosieren: ${Subj(cand)} wird mehr Struktur einfordern als das Team gewohnt ist. Gemeinsam klären, welche Strukturen notwendig sind und welche Flexibilität bewahrt werden soll.`);
  }

  if (rk === "intuitiv" && tk !== "intuitiv") {
    items.push(`Kommunikationsraum schaffen: ${Subj(cand)} braucht mehr Austausch und Abstimmung als das Team gewohnt ist. Feste Gesprächsformate einrichten, ohne das Team in endlose Meetings zu ziehen.`);
  }

  return items.slice(0, 6).join("\n\n");
}

function buildIntegrationsplan(
  cand: string, rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number
): string {
  const lines: string[] = [];

  lines.push("Woche 1-2: Orientierung und Erwartungsklärung");
  lines.push("");
  const sn = subj(cand);
  const Sn = Subj(cand);
  lines.push(`- Kick-off-Gespräch: ${Sn} stellt sich dem Team vor. Gemeinsam werden Arbeitsweise, Erwartungen und Spielregeln besprochen.`);
  lines.push(`- Rollenklärung: Aufgaben, Verantwortlichkeiten und Entscheidungsbefugnisse schriftlich festhalten.`);

  if (rk !== tk) {
    lines.push(`- Arbeitslogik transparent machen: Dem Team erklären, dass ${sn} eine andere Arbeitsweise mitbringt. Verständnis schaffen, nicht Anpassung erzwingen.`);
  }

  lines.push(`- Beobachten und Zuhören: ${Sn} soll in den ersten Tagen die Teamdynamik verstehen, bevor eigene Akzente gesetzt werden.`);

  if (teamIstGap > 25) {
    lines.push(`- Buddy benennen: Ein erfahrenes Teammitglied als informellen Ansprechpartner für ${sn} einsetzen.`);
  }

  lines.push("");
  lines.push("Woche 3-4: Wirkung entfalten und nachjustieren");
  lines.push("");
  lines.push(`- Erste Feedbackrunde: Strukturiertes Feedback vom Team und von ${sn} einholen. Was läuft gut? Wo gibt es Reibung?`);
  lines.push(`- Prioritäten nachjustieren: Auf Basis des Feedbacks die Zusammenarbeit anpassen. Klare Vereinbarungen für die nächsten Wochen treffen.`);

  if (rk !== tk) {
    lines.push(`- Stärken nutzen: Bewusst Aufgaben zuordnen, die zur Arbeitslogik von ${sn} passen. Gleichzeitig Brücken zur Teamlogik bauen.`);
  }

  lines.push(`- Quick Wins sichern: ${Sn} früh Gelegenheit geben, sichtbare Ergebnisse zu erzielen. Das baut Akzeptanz auf.`);

  if (teamIstGap > 30) {
    lines.push(`- Eskalationsmechanismus klären: Wer moderiert, wenn Konflikte auftreten? Wie wird Uneinigkeit gelöst?`);
  }

  return lines.join("\n");
}

