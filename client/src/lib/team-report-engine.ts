import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "./jobcheck-engine";
import type { Triad, ComponentKey } from "./jobcheck-engine";
import { detectConstellation, constellationLabel } from "./soll-ist-engine";
import type { ConstellationType } from "./soll-ist-engine";

export type SystemwirkungType = "verstaerkung" | "ergaenzung" | "ausgleich" | "verschiebung" | "polarisierung" | "uebersteuerung";

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

function ampelText(a: "gruen" | "gelb" | "rot"): string {
  if (a === "gruen") return "Stabil";
  if (a === "gelb") return "Steuerbar";
  return "Spannungsfeld";
}

function totalGapOf(a: Triad, b: Triad): number {
  return Math.abs(a.impulsiv - b.impulsiv) + Math.abs(a.intuitiv - b.intuitiv) + Math.abs(a.analytisch - b.analytisch);
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

export function detectSystemwirkung(
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

  const decSev = severity(tk === "analytisch" && rk !== "analytisch" ? teamGapA + 5 : Math.max(teamGapI, teamGapA));
  let decTeam: string;
  let decCandPattern: string;
  let decRisk: string;
  if (tk === "analytisch") {
    decTeam = "Das Team arbeitet mit sorgfältiger, planvoller Entscheidungslogik. Optionen werden geprüft und Risiken abgewogen.";
    decCandPattern = rk === "impulsiv" ? `${cand} entscheidet schneller und handlungsorientierter. Entscheidungen fallen, bevor alle Informationen vorliegen.` : `${cand} entscheidet kontextbezogen und bezieht Stimmungen ein. Datenbasierte Prüfung steht weniger im Vordergrund.`;
    decRisk = rk !== "analytisch" ? `Im Team wirkt das als Tempowechsel. ${cand} und das Team kommen zu unterschiedlichen Entscheidungszeitpunkten.` : "Die Entscheidungslogik passt zum Team.";
  } else if (tk === "impulsiv") {
    decTeam = "Das Team arbeitet mit schneller, handlungsorientierter Entscheidungslogik. Tempo hat Vorrang vor langer Prüfung.";
    decCandPattern = rk === "analytisch" ? `${cand} prüft gründlich und braucht Daten. Das Tempo ist langsamer als das Team gewohnt ist.` : `${cand} bezieht bei Entscheidungen den menschlichen Kontext ein. Abstimmung dauert länger als das Team erwartet.`;
    decRisk = rk !== "impulsiv" ? `Im Team entsteht Spannung: ${cand} verlangsamt, während das Team Tempo erwartet.` : "Die Entscheidungslogik passt zum Team.";
  } else {
    decTeam = "Das Team trifft Entscheidungen kontextbezogen. Abstimmung und Zusammenarbeit stehen im Vordergrund.";
    decCandPattern = rk === "impulsiv" ? `${cand} trifft Entscheidungen schnell und direkt. Die Wirkung auf andere wird nicht immer berücksichtigt.` : `${cand} entscheidet über Fakten und Regeln. Die zwischenmenschliche Dimension steht weniger im Fokus.`;
    decRisk = rk !== "intuitiv" ? `Im Team wirkt das als Stilbruch. Das Team erwartet eine andere Entscheidungslogik.` : "Die Entscheidungslogik passt zum Team.";
  }
  areas.push({ id: "decision", label: "Entscheidungslogik", severity: decSev, teamExpectation: decTeam, candidatePattern: decCandPattern, risk: decRisk });

  const workSev = severity(teamGapA);
  let workTeam: string;
  if (team.analytisch >= 35) workTeam = "Das Team arbeitet mit klarer Struktur, Priorisierung und verlässlichen Abläufen.";
  else if (team.analytisch >= 25) workTeam = "Das Team hat eine grundlegende Ordnung in Abläufen und Prozessen.";
  else workTeam = "Das Team arbeitet flexibel und ergebnisorientiert.";
  let workCandPattern: string;
  if (ist.analytisch >= 35) workCandPattern = `${cand} arbeitet strukturiert mit klaren Abläufen. Planung hat hohe Priorität.`;
  else if (ist.analytisch >= 25) workCandPattern = `${cand} hat grundlegende Struktur, lässt aber Raum für Anpassungen.`;
  else workCandPattern = `${cand} arbeitet tempoorientiert und reagiert situationsbezogen.`;
  let workRisk: string;
  if (teamGapA >= 10 && ist.analytisch < team.analytisch) workRisk = `Prozessklarheit muss aktiv eingefordert werden. Im Team (${compShort(tk)}-Logik) kann das Strukturdefizit auffallen.`;
  else if (teamGapA >= 10 && ist.analytisch > team.analytisch) workRisk = `${cand} investiert mehr Zeit in Planung als das Team gewohnt ist. Das kann das Team bremsen.`;
  else workRisk = "Arbeitssteuerung passt grundsätzlich zum Team.";
  areas.push({ id: "work_structure", label: "Arbeitssteuerung", severity: workSev, teamExpectation: workTeam, candidatePattern: workCandPattern, risk: workRisk });

  const teamDynSev = severity(Math.max(teamGapI, teamGapN, teamGapA) * 0.8);
  let dynTeam: string;
  let dynCandPattern: string;
  let dynRisk: string;
  if (rk === tk) {
    dynTeam = `Das Team arbeitet mit ${compShort(tk)}-Fokus. Die neue Person sollte kompatibel sein.`;
    dynCandPattern = `${cand} bringt die gleiche Arbeitslogik mit. Die Integration ist unkompliziert.`;
    dynRisk = `Stärkung des Teamfokus. Risiko: Blinde Flecken im Bereich ${compDesc(weakestKey(team))} werden nicht ausgeglichen.`;
  } else {
    dynTeam = `Das Team arbeitet mit ${compShort(tk)}-Fokus. Eine neue Logik kann bereichernd oder störend wirken.`;
    dynCandPattern = `${cand} bringt ${compShort(rk)}-Fokus. Das unterscheidet sich von der Teamlogik.`;
    dynRisk = `Im Alltag entstehen unterschiedliche Prioritäten. ${cand} setzt auf ${compShort(rk)}, das Team auf ${compShort(tk)}. Steuerung durch die Führung ist nötig.`;
  }
  areas.push({ id: "team_dynamics", label: "Teamdynamik", severity: teamDynSev, teamExpectation: dynTeam, candidatePattern: dynCandPattern, risk: dynRisk });

  const tempoGap = Math.abs(ist.impulsiv - team.impulsiv);
  const tempoSev = severity(tempoGap);
  areas.push({
    id: "tempo",
    label: "Arbeitstempo",
    severity: tempoSev,
    teamExpectation: team.impulsiv >= 35 ? "Das Team arbeitet mit hohem Tempo und schneller Umsetzung." : team.impulsiv >= 25 ? "Das Team arbeitet in einem ausgeglichenen Rhythmus." : "Das Team arbeitet ruhig und gründlich.",
    candidatePattern: ist.impulsiv >= 35 ? `${cand} arbeitet mit hohem Tempo und treibt Themen schnell voran.` : ist.impulsiv >= 25 ? `${cand} arbeitet in einem ausgeglichenen Rhythmus.` : `${cand} arbeitet ruhig und gründlich. Schnelle Umsetzung hat keine Priorität.`,
    risk: tempoGap >= 15 ? `Tempounterschied zum Team: ${tempoGap} Punkte. ${ist.impulsiv > team.impulsiv ? "Das Team kann unter Druck geraten." : "Das Team empfindet die Person als bremsend."}` : "Arbeitstempo ist kompatibel.",
  });

  const kommSev = severity(teamGapN * 0.7);
  areas.push({
    id: "communication",
    label: "Kommunikation",
    severity: kommSev,
    teamExpectation: team.intuitiv >= 35 ? "Das Team lebt stark vom direkten Kontakt und reibungsarmer Zusammenarbeit." : "Das Team braucht ein grundlegendes Maß an Kommunikation und Abstimmung.",
    candidatePattern: ist.intuitiv >= 35 ? `${cand} baut schnell Vertrauen auf und sorgt für reibungsarme Zusammenarbeit.` : ist.intuitiv <= 25 ? `${cand} kommuniziert sachlich und knapp. Beziehungsorientierte Abstimmung hat geringe Priorität.` : `${cand} kommuniziert situativ angemessen.`,
    risk: teamGapN >= 12 ? `Kommunikationslogik weicht ab. Im Team kann das zu Missverständnissen führen.` : "Kommunikationslogik passt zum Team.",
  });

  const kultSev = severity(Math.max(teamGapI, teamGapN, teamGapA) * 0.5);
  areas.push({
    id: "culture",
    label: "Kulturwirkung",
    severity: kultSev,
    teamExpectation: tk === "analytisch" ? "Das Team pflegt Verlässlichkeit und nachvollziehbare Qualität." : tk === "impulsiv" ? "Das Team lebt eine ergebnisorientierte Kultur." : "Das Team pflegt eine kooperative Kultur.",
    candidatePattern: rk === "impulsiv" ? `${cand} prägt die Kultur über Dynamik und Ergebnisorientierung.` : rk === "intuitiv" ? `${cand} fördert Teamzusammenhalt und offenen Dialog.` : `${cand} stärkt Qualitätsbewusstsein und Regelklarheit.`,
    risk: rk !== tk ? `Die Teamkultur wird sich verändern. ${cand} bringt ${compShort(rk)}-Logik in ein ${compShort(tk)}-Team. Aktive Steuerung vermeidet Reibung.` : "Die Kulturwirkung passt zum bestehenden Team.",
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
      { label: "Mittelfristig", period: "3 - 12 Monate", text: "Stabile Leistung erwartbar. Regelmäßige Zielgespräche sichern die Feinsteuerung." },
      { label: "Langfristig", period: "12+ Monate", text: "Nachhaltige Besetzung wahrscheinlich. Halbjährliche Überprüfung genügt." },
    ];
  }

  let shortText: string;
  if (rk !== tk && teamIstGap > 25) {
    shortText = `Sichtbare Reibung in den ersten Wochen. ${cand} arbeitet mit ${compShort(rk)}-Logik, das Team mit ${compShort(tk)}. Prioritäten und Arbeitsweisen kollidieren. Aktive Steuerung ab Tag 1 nötig.`;
  } else {
    shortText = `Einarbeitung verläuft mit leichten Abstimmungsverlusten. ${cand} und das Team finden ihren Rhythmus. Klare Erwartungen beschleunigen die Integration.`;
  }

  let midText: string;
  if (rk !== tk && teamIstGap > 25) {
    midText = `Ohne Steuerung schleift sich die Reibung ein. ${cand} passt sich entweder an (Leistungsverlust) oder beharrt auf der eigenen Logik (Konflikte). Die Führungskraft muss die Balance aktiv moderieren.`;
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
      text: `Die Anpassung ans Team ist mit hoher Wahrscheinlichkeit erreichbar. Die Grundausrichtung stimmt bereits überein. ${cand} muss lediglich Feinabstimmung leisten.`,
    };
  }
  if (teamIstGap <= 30) {
    return {
      level: 3,
      label: "mittel",
      text: `Eine Entwicklung in Richtung besserer Teamkompatibilität ist möglich. Sie erfordert gezielte Führung und regelmäßige Rückmeldung. Der Zeitraum beträgt 6 bis 12 Monate.`,
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
      "Regelmäßige Zielvereinbarungen zur Feinsteuerung durchführen.",
      "Halbjährliche Überprüfung der Teampassung sicherstellen.",
    ];
  }

  const base: string[] = [];

  if (teamIstGap > 15) {
    base.push(`Kick-off mit dem Team: Arbeitsweise, Erwartungen und Spielregeln transparent machen. ${cand} und das Team müssen verstehen, was voneinander erwartet wird.`);
  }

  if (rk !== tk) {
    base.push(`Arbeitslogiken aktiv benennen. Dem Team erklären, warum ${cand} anders priorisiert. ${cand} erklären, warum das Team anders arbeitet.`);
  }

  if (tk === "analytisch" && rk !== "analytisch") {
    base.push("Klare Entscheidungsregeln und Dokumentationsstandards für die ersten 90 Tage festlegen.");
    base.push("Wöchentliche Review-Termine mit fester KPI-Logik durchführen.");
  } else if (tk === "impulsiv" && rk !== "impulsiv") {
    base.push("Klare Umsetzungsfristen und Entscheidungsdeadlines definieren.");
    base.push("Ergebnisorientierte KPIs statt Prozess-KPIs verwenden.");
  } else if (tk === "intuitiv" && rk !== "intuitiv") {
    base.push("Regelmäßige Team-Feedbackrunden und Kommunikationsformate einrichten.");
    base.push("Beziehungsarbeit als explizites Ziel in die Leistungsbewertung aufnehmen.");
  }

  if (teamIstGap > 30) {
    base.push("Wöchentliches Steuerungsmeeting: 30 Minuten zur Abstimmung von Prioritäten und Feedback. Konflikte früh ansprechen.");
  }

  base.push(`Nach 2 und 4 Wochen strukturiertes Feedback einholen, sowohl vom Team als auch von ${cand}.`);

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

  let controlledPressure: string;
  if (istConst === "BALANCED") {
    controlledPressure = `Wenn der Arbeitsdruck steigt, zeigt ${cand} keine klare Verhaltenstendenz. Die Reaktion hängt stark vom Kontext und der Führung ab. Das Team kann das Verhalten schwerer einschätzen.`;
  } else if (istConst.includes("NEAR")) {
    controlledPressure = `Wenn der Arbeitsdruck steigt, verstärkt sich bei ${cand} die im Moment führende Logik. Da beide Hauptanteile fast gleich stark sind, wechselt die Reaktion je nach Situation. Mal wird ${compShort(rk)} verstärkt, mal ${compShort(sk2)}.`;
  } else {
    controlledPressure = `Wenn der Arbeitsdruck steigt, verstärkt ${cand} die Tendenz zu ${compDesc(rk)}. Das hilft kurzfristig. Der sekundäre Bereich (${compShort(sk2)}) tritt in den Hintergrund.`;
  }
  if (rk !== tk) {
    controlledPressure += ` Für das Team bedeutet das: Unter Druck wird die Abweichung zur Teamlogik sichtbarer. ${cand} reagiert mit ${compShort(rk)}, das Team erwartet ${compShort(tk)}.`;
  }

  let uncontrolledStress: string;
  if (istConst === "BALANCED") {
    uncontrolledStress = `Wenn der Druck sehr hoch wird, kann das Verhalten von ${cand} kippen oder unvorhersagbar wechseln. Keine klare Hauptlogik gibt Halt. Das Team verliert Orientierung. Klare Leitplanken und direktes Feedback sind in dieser Phase wichtig.`;
  } else {
    const d12 = ist[rk] - ist[sk2];
    if (d12 <= 5) {
      uncontrolledStress = `Wenn die Belastung sehr hoch wird, kann sich der Schwerpunkt bei ${cand} verschieben. Die Person bleibt in ihrer Grundlogik erkennbar, nutzt aber spürbar stärker ${compShort(sk2)}. Für das Team wird das Verhalten weniger berechenbar.`;
    } else {
      uncontrolledStress = `Wenn die Belastung sehr hoch wird, verschiebt sich das Verhalten von ${cand} deutlich. Der sekundäre Bereich ${compShort(sk2)} tritt stärker hervor. Entscheidungen werden anders getroffen als im Normalzustand. Das Team sollte darauf vorbereitet sein.`;
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
    phase1Items.push(`Arbeitslogik transparent machen: Dem Team erklären, dass ${cand} eine andere Arbeitsweise mitbringt. Verständnis schaffen, nicht Anpassung erzwingen.`);
  }

  phase1Items.push(`${cand} soll in den ersten Tagen die Teamdynamik verstehen, bevor eigene Akzente gesetzt werden.`);

  if (teamIstGap > 25) {
    phase1Items.push(`Buddy benennen: Ein erfahrenes Teammitglied als informellen Ansprechpartner einsetzen.`);
  }

  phase2Items.push(`Strukturiertes Feedback vom Team und von ${cand} einholen. Was läuft gut? Wo gibt es Reibung?`);
  phase2Items.push("Prioritäten nachjustieren. Klare Vereinbarungen für die nächsten Wochen treffen.");

  if (rk !== tk) {
    phase2Items.push(`Stärken nutzen: Aufgaben zuordnen, die zur Arbeitslogik von ${cand} passen. Brücken zur Teamlogik bauen.`);
  }

  phase2Items.push(`${cand} früh Gelegenheit geben, sichtbare Ergebnisse zu erzielen. Das baut Akzeptanz auf.`);

  if (teamIstGap > 30) {
    phase2Items.push("Eskalationsmechanismus klären: Wer moderiert bei Konflikten? Wie wird Uneinigkeit gelöst?");
  }

  phase3Items.push("Evaluation der bisherigen Wirkung auf Entscheidungsrhythmus und Teamdynamik.");
  phase3Items.push("Feinabstimmung der Zusammenarbeit mit dem direkten Umfeld.");
  phase3Items.push("Prioritäten konsolidieren und Standards stabilisieren.");

  if (teamIstGap > 25) {
    phase3Items.push("Langfristiges Steuerungskonzept festlegen. Regelmäßige Checkpoints einplanen.");
  }

  return [
    { num: 1, title: "Orientierung", period: "Woche 1-2", items: phase1Items },
    { num: 2, title: "Wirkung entfalten", period: "Woche 3-4", items: phase2Items },
    { num: 3, title: "Konsolidierung", period: "Woche 5-8", items: phase3Items },
  ];
}

export function computeTeamReport(
  roleName: string,
  candidateName: string,
  istProfile: Triad,
  teamProfile: Triad
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

  const status = ampel(teamIstGap);

  const cn = candidateName || "Die neue Person";
  const rk = istDom.top1.key;
  const tk = teamDom.top1.key;

  const gesamtpassung: GesamtpassungLevel = status === "gruen" ? "geeignet" : status === "gelb" ? "bedingt" : "kritisch";
  const gesamtpassungLabel = gesamtpassung === "geeignet" ? "Geeignet" : gesamtpassung === "bedingt" ? "Bedingt geeignet" : "Kritisch";
  const entscheidungsfaktoren = buildEntscheidungsfaktoren(cn, ist, team, teamIstGap, rk, tk);

  const controlIntensity: "gering" | "mittel" | "hoch" = teamIstGap > 40 ? "hoch" : teamIstGap > 20 ? "mittel" : "gering";

  const managementSummary = buildManagementSummary(roleName, cn, ist, team, teamIstGap, teamIstLevel, status, rk, tk, istLabel, teamLabel);
  const teamstruktur = buildTeamstruktur(team, teamDom, teamConst, teamLabel, tk);
  const fuehrungsprofil = buildFuehrungsprofil(cn, ist, istDom, istConst, istLabel, rk);
  const systemwirkungResult = detectSystemwirkung(ist, team, cn, rk, tk, teamIstGap, istConst, teamConst);
  const systemwirkung = buildSystemwirkungText(cn, roleName, ist, team, rk, tk, teamIstGap, istConst, teamConst, systemwirkungResult);
  const teamdynamikAlltag = buildTeamdynamikAlltag(cn, ist, team, rk, tk, teamIstGap);
  const chancen = buildChancen(cn, ist, team, rk, tk, teamIstGap);
  const risiken = buildRisiken(cn, ist, team, rk, tk, teamIstGap);
  const verhaltenUnterDruck = buildVerhaltenUnterDruck(cn, ist, team, rk, tk, istConst, teamIstGap);
  const kulturwirkung = buildKulturwirkung(cn, ist, team, rk, tk, teamIstGap);
  const fuehrungshebel = buildFuehrungshebel(cn, rk, tk, teamIstGap);
  const integrationsplan = buildIntegrationsplan(cn, rk, tk, teamIstGap);
  const systemfazit = buildSystemfazit(roleName, cn, ist, team, teamIstGap, status, rk, tk);

  const impactAreas = buildTeamImpactAreas(rk, tk, ist, team, cn);
  const riskTimeline = buildTeamRiskTimeline(roleName, cn, rk, tk, teamIstGap);
  const { level: developmentLevel, label: developmentLabel, text: developmentText } = buildTeamDevelopment(teamIstGap, rk, tk, cn);
  const actions = buildTeamActions(rk, tk, teamIstGap, cn);
  const stressBehavior = buildTeamStressBehavior(ist, team, cn, rk, tk, istConst, teamIstGap);
  const integrationsplanPhasen = buildTeamIntegrationsplanPhasen(cn, rk, tk, teamIstGap);

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
    negative.push({ priority: teamIstGap, text: `Arbeitslogik verschieden: Kandidat setzt auf ${compShort(rk)}, Team arbeitet mit ${compShort(tk)}` });
  }

  const tempoGap = Math.abs(ist.impulsiv - team.impulsiv);
  if (tempoGap > 15) {
    negative.push({ priority: tempoGap, text: `Tempounterschied ${ist.impulsiv > team.impulsiv ? "zu hoch" : "zu niedrig"} (${tempoGap} Punkte Abweichung)` });
  }

  if (teamIstGap > 30) {
    negative.push({ priority: teamIstGap, text: `Teamintegration erschwert durch hohe Profilabweichung (${teamIstGap} Punkte)` });
  }

  if (rk === tk) {
    positive.push({ priority: 10, text: "Arbeitslogik von Kandidat und Team stimmen überein" });
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

function buildManagementSummary(
  role: string, cand: string,
  ist: Triad, team: Triad,
  teamIstGap: number, teamIstLevel: string,
  status: "gruen" | "gelb" | "rot",
  rk: ComponentKey, tk: ComponentKey,
  istLabel: string, teamLabel: string
): string {
  const lines: string[] = [];
  lines.push(`Rolle: ${role}`);
  lines.push(`Kandidat: ${cand}`);
  lines.push(`Kandidatenprofil: ${istLabel} (I ${ist.impulsiv}% / N ${ist.intuitiv}% / A ${ist.analytisch}%)`);
  lines.push(`Teamprofil: ${teamLabel} (I ${team.impulsiv}% / N ${team.intuitiv}% / A ${team.analytisch}%)`);
  lines.push("");
  lines.push(`Abweichung Team vs. Kandidat: ${teamIstGap} Punkte (${teamIstLevel})`);
  lines.push(`Gesamtstatus: ${ampelText(status)}`);
  lines.push("");

  if (status === "gruen") {
    lines.push(`${cand} passt strukturell zum bestehenden Team. Die Arbeitslogiken sind kompatibel. Die Integration wird voraussichtlich reibungsarm verlaufen.`);
  } else if (status === "gelb") {
    lines.push(`${cand} zeigt Abweichungen zum Teamprofil. Die Integration ist steuerbar, erfordert aber gezielte Aufmerksamkeit in den ersten Wochen. Entscheidend sind klare Erwartungen und regelmäßige Abstimmung.`);
  } else {
    lines.push(`${cand} weicht deutlich vom Teamprofil ab. Ohne aktive Steuerung sind Reibung, Konflikte und Leistungseinbrüche wahrscheinlich. Die ersten 30 Tage sind entscheidend.`);
  }

  return lines.join("\n");
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
  lines.push(`${cand} zeigt ${istLabel.toLowerCase()}. Der primäre Antrieb liegt bei ${compDesc(rk)} (${ist[rk]}%), der sekundäre bei ${compDesc(sk2)} (${ist[sk2]}%).`);
  lines.push("");

  if (rk === "impulsiv") {
    lines.push(`${cand} arbeitet mit hoher Umsetzungsenergie. Entscheidungen werden zügig getroffen, Themen schnell in Bewegung gebracht. In der Zusammenarbeit ist das Tempo spürbar. Langwierige Abstimmungsprozesse werden als bremsend empfunden.`);
  } else if (rk === "intuitiv") {
    lines.push(`${cand} arbeitet beziehungsorientiert. Zusammenarbeit, Kommunikation und das Erfassen von Situationen stehen im Vordergrund. Entscheidungen werden im Kontext der beteiligten Menschen getroffen. Reine Sachorientierung ohne Beziehungsebene wird als unvollständig empfunden.`);
  } else {
    lines.push(`${cand} arbeitet strukturiert und planvoll. Qualität entsteht über Ordnung, sorgfältige Prüfung und klare Abläufe. Schnelle, ungeprüfte Entscheidungen werden als riskant eingestuft. Verlässlichkeit hat Vorrang vor Geschwindigkeit.`);
  }

  lines.push("");
  if (istConst.includes("NEAR") || istConst === "BALANCED") {
    lines.push(`Durch die ausgeglichene Profilstruktur kann ${cand} situativ zwischen verschiedenen Arbeitsweisen wechseln. Das erhöht die Anpassungsfähigkeit, macht das Verhalten aber auch weniger vorhersagbar.`);
  } else {
    lines.push(`Der sekundäre Anteil (${compShort(sk2)}) stabilisiert die Hauptlogik. ${cand} nutzt ${compDesc(sk2)} als Ergänzung, nicht als Alternative. In Drucksituationen tritt die Hauptlogik noch deutlicher hervor.`);
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

  if (teamIstGap <= 15) {
    lines.push(`Die Arbeitslogik von ${cand} liegt nahe am Teamprofil. Die Integration verläuft voraussichtlich reibungsarm.`);
  } else if (teamIstGap <= 30) {
    lines.push(`Die Arbeitslogik von ${cand} weicht erkennbar vom Teamprofil ab (${teamIstGap} Punkte). In einzelnen Bereichen muss gezielt nachgesteuert werden.`);
  } else {
    lines.push(`Die Arbeitslogik von ${cand} weicht deutlich vom Teamprofil ab (${teamIstGap} Punkte). Ohne aktive Steuerung wird die Teamdynamik spürbar verändert.`);
  }

  return lines.join("\n");
}

function buildTeamdynamikAlltag(
  cand: string, ist: Triad, team: Triad,
  rk: ComponentKey, tk: ComponentKey, teamIstGap: number
): string {
  const lines: string[] = [];

  lines.push("Entscheidungen:");
  if (rk === tk) {
    lines.push(`${cand} und das Team treffen Entscheidungen nach ähnlicher Logik. Die Abstimmung ist unkompliziert, Prioritäten werden gleichartig gesetzt.`);
  } else if (rk === "impulsiv" && tk === "analytisch") {
    lines.push(`${cand} entscheidet schneller als das Team es gewohnt ist. Das Team prüft gründlich, ${cand} will zügig handeln. Es entsteht Spannung zwischen Tempo und Gründlichkeit.`);
  } else if (rk === "analytisch" && tk === "impulsiv") {
    lines.push(`${cand} bremst das Tempo des Teams. Wo das Team schnell entscheiden will, fordert ${cand} Prüfung und Absicherung. Das Team empfindet das als Verzögerung.`);
  } else if (rk === "intuitiv") {
    lines.push(`${cand} bezieht bei Entscheidungen stärker den menschlichen Kontext ein. Das Team ist stärker auf ${compShort(tk)} ausgerichtet. Abstimmungsprozesse können dadurch länger dauern.`);
  } else {
    lines.push(`Die Entscheidungslogik von ${cand} unterscheidet sich vom Team. ${cand} priorisiert ${compShort(rk)}, das Team setzt auf ${compShort(tk)}. Im Alltag führt das zu unterschiedlichen Bewertungen gleicher Situationen.`);
  }

  lines.push("");
  lines.push("Kommunikation:");
  if (teamIstGap <= 15) {
    lines.push(`Die Kommunikation verläuft voraussichtlich reibungsarm. ${cand} und das Team sprechen eine ähnliche Sprache. Missverständnisse sind selten.`);
  } else if (teamIstGap <= 30) {
    lines.push(`In der Kommunikation sind Abstimmungsverluste möglich. ${cand} betont andere Aspekte als das Team. Klare Kommunikationsregeln helfen, Missverständnisse zu vermeiden.`);
  } else {
    lines.push(`Die Kommunikationslogiken weichen deutlich voneinander ab. Was ${cand} als wichtig einstuft, priorisiert das Team anders. Ohne bewusste Steuerung entstehen regelmäßig Missverständnisse und Frustrationen.`);
  }

  lines.push("");
  lines.push("Arbeitstempo:");
  const tempoGap = Math.abs(ist.impulsiv - team.impulsiv);
  if (tempoGap <= 8) {
    lines.push(`Das Arbeitstempo ist kompatibel. ${cand} und das Team arbeiten in einem ähnlichen Rhythmus.`);
  } else if (tempoGap <= 18) {
    lines.push(`Es gibt spürbare Tempounterschiede. ${ist.impulsiv > team.impulsiv ? `${cand} arbeitet schneller als das Team.` : `Das Team arbeitet schneller als ${cand}.`} Das erfordert bewusste Abstimmung.`);
  } else {
    lines.push(`Das Arbeitstempo unterscheidet sich deutlich. ${ist.impulsiv > team.impulsiv ? `${cand} arbeitet erheblich schneller als das Team. Das Team kann unter Druck geraten.` : `${cand} arbeitet deutlich langsamer als das Team. Das Team empfindet das als Bremse.`}`);
  }

  return lines.join("\n");
}

function buildChancen(
  cand: string, ist: Triad, team: Triad,
  rk: ComponentKey, tk: ComponentKey, teamIstGap: number
): string {
  const items: string[] = [];

  if (rk !== tk) {
    const teamWeak = weakestKey(team);
    if (rk === teamWeak) {
      items.push(`${cand} stärkt den bisher schwächsten Bereich des Teams (${compDesc(teamWeak)}). Das gleicht eine strukturelle Lücke aus und macht das Team vielseitiger.`);
    }
    items.push(`Die unterschiedliche Arbeitslogik bringt eine neue Perspektive ins Team. Entscheidungen werden breiter abgestützt, wenn die Vielfalt bewusst genutzt wird.`);
  }

  if (rk === tk) {
    items.push(`${cand} verstärkt den Kernbereich des Teams (${compDesc(rk)}). Die Teamlogik wird konsequenter umgesetzt und stabilisiert.`);
  }

  if (ist.intuitiv >= 35) {
    items.push(`${cand} bringt hohe Beziehungsfähigkeit mit. Das kann die Teamkohäsion stärken und Konflikte frühzeitig entschärfen.`);
  }

  if (ist.analytisch >= 35) {
    items.push(`${cand} bringt hohe Strukturorientierung mit. Das kann Prozessqualität und Verlässlichkeit im Team verbessern.`);
  }

  if (ist.impulsiv >= 35) {
    items.push(`${cand} bringt hohe Umsetzungsenergie mit. Das kann das Arbeitstempo steigern und Ergebnisorientierung stärken.`);
  }

  if (items.length === 0) {
    items.push(`${cand} bringt ein ausgeglichenes Profil mit. Das sorgt für Flexibilität und situative Anpassungsfähigkeit.`);
  }

  return items.join("\n\n");
}

function buildRisiken(
  cand: string, ist: Triad, team: Triad,
  rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number
): string {
  const items: string[] = [];

  if (rk !== tk && teamIstGap > 25) {
    items.push(`Hohe Abweichung zum Teamprofil (${teamIstGap} Punkte): Die unterschiedliche Arbeitslogik kann im Alltag zu wiederkehrenden Konflikten führen. Das Team empfindet die Arbeitsweise von ${cand} als fremd oder störend.`);
  } else if (rk !== tk && teamIstGap > 15) {
    items.push(`Spürbare Abweichung zum Teamprofil (${teamIstGap} Punkte): In Drucksituationen können die unterschiedlichen Logiken aufeinanderprallen. Gezielte Steuerung reduziert das Risiko.`);
  }

  if (rk === tk) {
    const teamWeak = weakestKey(team);
    if (weakestKey(ist) === teamWeak) {
      items.push(`Verstärkung des blinden Flecks: ${cand} und das Team teilen die gleiche Schwäche im Bereich ${compDesc(teamWeak)}. Dieser Bereich wird weiter vernachlässigt.`);
    }
  }

  const strukturGap = Math.abs(ist.analytisch - team.analytisch);
  if (strukturGap > 15 && ist.analytisch < team.analytisch) {
    items.push(`${cand} bringt weniger Strukturorientierung mit als das Team. Qualitätsstandards und Dokumentation können darunter leiden.`);
  }

  const tempoGap = Math.abs(ist.impulsiv - team.impulsiv);
  if (tempoGap > 15 && ist.impulsiv > team.impulsiv) {
    items.push(`${cand} arbeitet deutlich tempoorientierter als das Team. Das Team kann unter Zeitdruck geraten und Fehlerquoten steigen.`);
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

  lines.push("Kontrollierter Druck:");
  lines.push("");
  if (istConst === "BALANCED") {
    lines.push(`Wenn der Arbeitsdruck steigt, zeigt ${cand} keine sehr klare Verhaltenstendenz. Da das Profil ausgeglichen ist, hängt die Reaktion stark vom Kontext und der Führung ab. Das Team kann das Verhalten schwerer einschätzen.`);
  } else if (istConst.includes("NEAR")) {
    lines.push(`Wenn der Arbeitsdruck steigt, verstärkt sich bei ${cand} die im Moment führende Logik. Da beide Hauptanteile fast gleich stark sind, kann die Reaktion je nach Situation unterschiedlich ausfallen. Mal wird stärker über ${compShort(rk)} gesteuert, mal über ${compShort(sk2)}.`);
  } else {
    lines.push(`Wenn der Arbeitsdruck steigt, verstärkt ${cand} die Tendenz zu ${compDesc(rk)}. Das hilft, die eigene Situation kurzfristig zu stabilisieren. Gleichzeitig tritt der sekundäre Bereich (${compShort(sk2)}) in den Hintergrund.`);
  }

  if (rk !== tk) {
    lines.push(`Für das Team bedeutet das: Unter Druck wird die Abweichung zur Teamlogik noch sichtbarer. ${cand} reagiert mit ${compShort(rk)}, das Team erwartet ${compShort(tk)}.`);
  }

  lines.push("");
  lines.push("Unkontrollierter Stress:");
  lines.push("");

  if (istConst === "BALANCED") {
    lines.push(`Wenn der Druck sehr hoch wird, kann das Verhalten von ${cand} kippen oder unvorhersagbar wechseln. Keine klare Hauptlogik gibt Halt. Das Team verliert Orientierung. Klare Leitplanken und direktes Feedback sind in dieser Phase besonders wichtig.`);
  } else {
    const d12 = ist[rk] - ist[sk2];
    if (d12 <= 5) {
      lines.push(`Wenn die Belastung sehr hoch wird, kann sich der Schwerpunkt bei ${cand} verschieben. Die Person bleibt in ihrer Grundlogik erkennbar, nutzt aber spürbar stärker ${compShort(sk2)}. Für das Team wird das Verhalten weniger berechenbar.`);
    } else {
      lines.push(`Wenn die Belastung sehr hoch wird, verschiebt sich das Verhalten von ${cand} deutlich. Der sekundäre Bereich ${compShort(sk2)} tritt stärker hervor. Entscheidungen werden anders getroffen als im Normalzustand. Das Team sollte darauf vorbereitet sein.`);
    }
  }

  return lines.join("\n");
}

function buildKulturwirkung(
  cand: string, ist: Triad, team: Triad,
  rk: ComponentKey, tk: ComponentKey, teamIstGap: number
): string {
  const lines: string[] = [];

  if (rk === tk && teamIstGap <= 15) {
    lines.push(`${cand} bestätigt die bestehende Teamkultur. Die Werte, Arbeitsweisen und Kommunikationsmuster bleiben stabil. Das Team wird die neue Person als passend empfinden.`);
  } else if (rk === tk && teamIstGap > 15) {
    lines.push(`${cand} teilt die Grundausrichtung des Teams, aber in einer anderen Intensität. Die Kultur bleibt in ihrer Richtung stabil, aber die Ausprägung verändert sich. ${ist[rk] > team[rk] ? `${cand} lebt die gemeinsame Logik konsequenter als das Team.` : `Das Team lebt die gemeinsame Logik konsequenter als ${cand}.`}`);
  } else {
    lines.push(`${cand} bringt eine andere Arbeitslogik mit als das Team. Das verändert die Teamkultur spürbar.`);

    if (rk === "impulsiv") {
      lines.push(`${cand} bringt mehr Tempo und Ergebnisorientierung ein. Das Team wird herausgefordert, schneller zu entscheiden und zu handeln. Für ein Team mit hoher ${compShort(tk)}-Orientierung kann das als Druck empfunden werden.`);
    } else if (rk === "intuitiv") {
      lines.push(`${cand} bringt mehr Beziehungsorientierung und Kommunikation ein. Das Team wird herausgefordert, stärker auf zwischenmenschliche Dynamiken zu achten. Das kann bereichernd sein, aber auch als langsam empfunden werden.`);
    } else {
      lines.push(`${cand} bringt mehr Struktur und Gründlichkeit ein. Das Team wird herausgefordert, sorgfältiger zu arbeiten und Abläufe stärker zu formalisieren. Das kann als einschränkend empfunden werden.`);
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
    items.push(`Erwartungsklärung: In der ersten Woche ein Kick-off mit dem gesamten Team durchführen. Prioritäten, Entscheidungswege und Qualitätsmaßstäbe transparent machen. ${cand} und das Team müssen verstehen, was voneinander erwartet wird.`);
  }

  if (rk !== tk) {
    items.push(`Übersetzungshilfe: Die unterschiedlichen Arbeitslogiken aktiv benennen. Dem Team erklären, warum ${cand} anders priorisiert. ${cand} erklären, warum das Team anders arbeitet. Verständnis reduziert Reibung.`);
  }

  if (teamIstGap > 30) {
    items.push(`Entscheidungszeitfenster definieren: Klare Fristen für Entscheidungen verhindern Endlosschleifen und reduzieren Reibung. Besonders wichtig bei unterschiedlichen Tempi.`);
    items.push(`Wöchentliches Steuerungsmeeting: 30 Minuten zur Abstimmung von Prioritäten, offenen Punkten und Feedback. Konflikte früh ansprechen, bevor sie eskalieren.`);
  }

  items.push(`Feedbackschleifen einbauen: Nach 2 und 4 Wochen strukturiertes Feedback einholen, sowohl vom Team als auch von ${cand}. Stimmungen und Reibungspunkte frühzeitig erkennen.`);

  if (rk === "impulsiv" && tk !== "impulsiv") {
    items.push(`Tempo steuern: ${cand} wird schneller arbeiten wollen als das Team. Klare Meilensteine und Prüfpunkte setzen, damit Tempo nicht auf Kosten der Qualität geht.`);
  }

  if (rk === "analytisch" && tk !== "analytisch") {
    items.push(`Struktur dosieren: ${cand} wird mehr Struktur einfordern als das Team gewohnt ist. Gemeinsam klären, welche Strukturen notwendig sind und welche Flexibilität bewahrt werden soll.`);
  }

  if (rk === "intuitiv" && tk !== "intuitiv") {
    items.push(`Kommunikationsraum schaffen: ${cand} braucht mehr Austausch und Abstimmung als das Team gewohnt ist. Feste Gesprächsformate einrichten, ohne das Team in endlose Meetings zu ziehen.`);
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
  lines.push(`- Kick-off-Gespräch: ${cand} stellt sich dem Team vor. Gemeinsam werden Arbeitsweise, Erwartungen und Spielregeln besprochen.`);
  lines.push(`- Rollenklärung: Aufgaben, Verantwortlichkeiten und Entscheidungsbefugnisse schriftlich festhalten.`);

  if (rk !== tk) {
    lines.push(`- Arbeitslogik transparent machen: Dem Team erklären, dass ${cand} eine andere Arbeitsweise mitbringt. Verständnis schaffen, nicht Anpassung erzwingen.`);
  }

  lines.push(`- Beobachten und Zuhören: ${cand} soll in den ersten Tagen die Teamdynamik verstehen, bevor eigene Akzente gesetzt werden.`);

  if (teamIstGap > 25) {
    lines.push(`- Buddy benennen: Ein erfahrenes Teammitglied als informellen Ansprechpartner für ${cand} einsetzen.`);
  }

  lines.push("");
  lines.push("Woche 3-4: Wirkung entfalten und nachjustieren");
  lines.push("");
  lines.push(`- Erste Feedbackrunde: Strukturiertes Feedback vom Team und von ${cand} einholen. Was läuft gut? Wo gibt es Reibung?`);
  lines.push(`- Prioritäten nachjustieren: Auf Basis des Feedbacks die Zusammenarbeit anpassen. Klare Vereinbarungen für die nächsten Wochen treffen.`);

  if (rk !== tk) {
    lines.push(`- Stärken nutzen: Bewusst Aufgaben zuordnen, die zur Arbeitslogik von ${cand} passen. Gleichzeitig Brücken zur Teamlogik bauen.`);
  }

  lines.push(`- Quick Wins sichern: ${cand} früh Gelegenheit geben, sichtbare Ergebnisse zu erzielen. Das baut Akzeptanz auf.`);

  if (teamIstGap > 30) {
    lines.push(`- Eskalationsmechanismus klären: Wer moderiert, wenn Konflikte auftreten? Wie wird Uneinigkeit gelöst?`);
  }

  return lines.join("\n");
}

function buildSystemfazit(
  role: string, cand: string,
  ist: Triad, team: Triad,
  teamIstGap: number,
  status: "gruen" | "gelb" | "rot",
  rk: ComponentKey, tk: ComponentKey
): string {
  const lines: string[] = [];

  if (status === "gruen") {
    lines.push(`${cand} passt strukturell zum bestehenden Team. Die Arbeitslogiken sind kompatibel. Die Integration wird voraussichtlich reibungsarm verlaufen. Normale Führungssteuerung ist ausreichend.`);
    lines.push("");
    lines.push(`Fokuspunkte: Teamkultur bestätigen, Ergänzungspotenziale bewusst nutzen, Feedbackschleifen einbauen.`);
  } else if (status === "gelb") {
    lines.push(`${cand} ist steuerbar ins Team integrierbar. Es gibt erkennbare Abweichungen zum Team (${teamIstGap} Punkte), die mit gezielter Steuerung ausgeglichen werden können.`);
    lines.push("");
    lines.push(`Entscheidend sind die ersten 30 Tage: Klare Erwartungen setzen, Kommunikation bewusst steuern, Feedback strukturiert einholen. Wenn die Integration aktiv begleitet wird, kann ${cand} die Rolle wirksam ausfüllen.`);
    if (rk !== tk) {
      lines.push("");
      lines.push(`Die unterschiedliche Arbeitslogik (${compShort(rk)} vs. ${compShort(tk)}) ist kein Ausschlusskriterium, erfordert aber bewusste Steuerung. In Drucksituationen muss die Führung aktiv moderieren.`);
    }
  } else {
    lines.push(`${cand} zeigt deutliche Abweichungen zum Team (${teamIstGap} Punkte). Ohne aktive und konsequente Steuerung sind Reibung, Konflikte und Leistungseinbrüche wahrscheinlich.`);
    lines.push("");
    lines.push(`Die Integration stellt eine erhebliche Herausforderung dar. Die Arbeitslogiken von ${cand} und dem Team sind grundlegend verschieden. Die ersten 30 Tage sind entscheidend: Klare Kommunikation, definierte Entscheidungswege und aktives Erwartungsmanagement sind Pflicht.`);
    lines.push("");
    lines.push(`Empfehlung: Nur mit Steuerungskonzept und aktiver Führungsbegleitung einsetzen. Regelmäßige Checkpoints einplanen. Eskalationsmechanismen vorab klären.`);
  }

  return lines.join("\n");
}
