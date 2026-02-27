import type { TeamDynamikInput, TeamDynamikResult, ShiftType, IntensityLevel, TrafficLight } from "./teamdynamik-engine";
import { labelComponent } from "./teamdynamik-engine";
import type { ComponentKey } from "./jobcheck-engine";

const SHIFT_DESC: Record<ShiftType, string> = {
  VERSTAERKUNG: "Die neue Person verstärkt die bestehende Arbeitslogik des Teams. Es gibt keine grundlegende Verschiebung.",
  ERGAENZUNG: "Die neue Person ergänzt das Team in einem bisher unterrepräsentierten Bereich. Die Teambalance verbessert sich.",
  REIBUNG: "Die Arbeitslogik der neuen Person weicht erkennbar vom Teamprofil ab. Situative Anpassung ist erforderlich.",
  SPANNUNG: "Die Arbeitslogik der neuen Person steht in deutlichem Kontrast zum Team. Aktive Steuerung ist notwendig.",
  TRANSFORMATION: "Die neue Person verändert die Arbeitslogik des Teams grundlegend. Die bisherige Teamdynamik wird transformiert.",
  HYBRID: "Die neue Person bringt eine Mischung aus verstärkenden und kontrastierenden Elementen mit.",
};

const INTENSITY_DESC: Record<IntensityLevel, string> = {
  NIEDRIG: "Der Veränderungsimpuls ist gering. Das Team wird die Integration weitgehend ohne Reibung bewältigen.",
  MITTEL: "Der Veränderungsimpuls ist spürbar. Gezielte Steuerung beschleunigt die Integration und verhindert unnötige Konflikte.",
  HOCH: "Der Veränderungsimpuls ist erheblich. Ohne aktive Steuerung sind Leistungseinbrüche und Teamkonflikte wahrscheinlich.",
};

function domTypeLabel(dom: string): string {
  if (dom === "IMPULSIV") return "umsetzungs- und ergebnisorientiert";
  if (dom === "INTUITIV") return "beziehungs- und teamorientiert";
  if (dom === "ANALYTISCH") return "struktur- und methodenorientiert";
  return "ausgeglichen";
}

function topCompLabel(dom: any): string {
  if (dom?.top1) return labelComponent(dom.top1.key);
  return "Ausgeglichen";
}

export function generateTeamReportLocal(input: TeamDynamikInput, result: TeamDynamikResult): string {
  const { teamName, isLeading, teamProfile, personProfile } = input;
  const { scores, intensityLevel, shiftType, shiftAxis, trafficLight, dominanceTeam, dominancePerson, chances, risks, integrationPlan, leadershipBehavior, steeringNeed } = result;
  const personRole = isLeading ? "die neue Führungskraft" : "das neue Teammitglied";
  const PersonRole = isLeading ? "Die neue Führungskraft" : "Das neue Teammitglied";

  const lines: string[] = [];

  lines.push("1. Executive System Summary");
  lines.push("");
  lines.push(`Team: ${teamName}`);
  lines.push(`Transformationsscore (TS): ${Math.round(scores.TS)} / 100 — Intensität: ${intensityLevel}`);
  lines.push(`Verschiebungstyp: ${shiftType} — ${SHIFT_DESC[shiftType]}`);
  lines.push(`Ampelstatus: ${trafficLight === "GREEN" ? "Grün (Stabil)" : trafficLight === "YELLOW" ? "Gelb (Steuerbar)" : "Rot (Spannungsfeld)"}`);
  lines.push(`Steuerungsbedarf: ${steeringNeed}`);
  lines.push(`DG: ${Math.round(scores.DG)} | DC: ${Math.round(scores.DC)} | RG: ${scores.RG !== null ? Math.round(scores.RG) : "—"} | CI: ${Math.round(scores.CI)}`);
  lines.push("");

  lines.push("2. Profile im Überblick");
  lines.push("");
  lines.push(`Teamprofil: Impulsiv ${teamProfile.impulsiv}% / Intuitiv ${teamProfile.intuitiv}% / Analytisch ${teamProfile.analytisch}% — ${domTypeLabel(dominanceTeam)}`);
  lines.push(`${isLeading ? "Neue Führungskraft" : "Neues Teammitglied"}: Impulsiv ${personProfile.impulsiv}% / Intuitiv ${personProfile.intuitiv}% / Analytisch ${personProfile.analytisch}% — ${domTypeLabel(dominancePerson)}`);
  lines.push("");

  lines.push("3. Systemtyp & Verschiebungsachse");
  lines.push("");
  lines.push(`Verschiebungsachse: ${shiftAxis}`);
  lines.push(SHIFT_DESC[shiftType]);
  lines.push(INTENSITY_DESC[intensityLevel]);
  if (leadershipBehavior) {
    lines.push("");
    lines.push(`Wirkungsachse: ${leadershipBehavior.axisLabel}`);
    lines.push(leadershipBehavior.statement);
    lines.push(`Mögliche Wahrnehmung im Team: ${leadershipBehavior.possiblePerception}`);
    lines.push(`Blinder Fleck: ${leadershipBehavior.blindSpot}`);
  }
  lines.push("");

  lines.push("4. Systemwirkung im Alltag");
  lines.push("");
  if (shiftType === "VERSTAERKUNG") {
    lines.push(`- Entscheidungen & Prioritäten: ${PersonRole} arbeitet nach der gleichen Logik wie das Team. Entscheidungswege bleiben stabil und vorhersehbar.`);
    lines.push(`- Qualität: Die bestehenden Qualitätsstandards werden bestätigt und fortgeführt. Keine Verschiebung der Qualitätslogik.`);
    lines.push(`- Tempo: Das Arbeitstempo bleibt weitgehend unverändert. ${PersonRole} passt sich dem bestehenden Rhythmus an.`);
    lines.push(`- Zusammenarbeit: Die Integration verläuft reibungsarm. Das Team erkennt die Arbeitslogik wieder.`);
  } else if (shiftType === "ERGAENZUNG") {
    lines.push(`- Entscheidungen & Prioritäten: ${PersonRole} bringt eine ergänzende Perspektive ein. Entscheidungen werden breiter abgestützt.`);
    lines.push(`- Qualität: Neue Qualitätsaspekte kommen hinzu. Die Bewertungsmaßstäbe erweitern sich konstruktiv.`);
    lines.push(`- Tempo: Leichte Anpassungen im Arbeitsrhythmus sind möglich, da unterschiedliche Tempi aufeinandertreffen.`);
    lines.push(`- Zusammenarbeit: Die Zusammenarbeit profitiert von der breiteren Kompetenzabdeckung. Gegenseitiges Lernen ist wahrscheinlich.`);
  } else if (shiftType === "REIBUNG" || shiftType === "HYBRID") {
    lines.push(`- Entscheidungen & Prioritäten: Unterschiedliche Arbeitslogiken führen zu Abstimmungsbedarf. Prioritäten werden teilweise unterschiedlich gesetzt.`);
    lines.push(`- Qualität: Qualitätsverständnis kann variieren. Was das Team als „gut genug" empfindet, sieht ${personRole} möglicherweise anders.`);
    lines.push(`- Tempo: Spürbare Tempounterschiede. ${PersonRole} arbeitet in einem anderen Rhythmus als das Team.`);
    lines.push(`- Zusammenarbeit: Konstruktive Reibung möglich. Mit klarer Kommunikation wird die Zusammenarbeit produktiv, ohne Steuerung entstehen Missverständnisse.`);
  } else {
    lines.push(`- Entscheidungen & Prioritäten: Die Entscheidungslogik verändert sich spürbar. ${PersonRole} setzt andere Prioritäten als das Team gewohnt ist.`);
    lines.push(`- Qualität: Qualitätsmaßstäbe verschieben sich. ${isLeading ? "Die neue Führung definiert Qualität anders als das Team." : "Das neue Teammitglied hat andere Qualitätsvorstellungen."}`);
    lines.push(`- Tempo: Deutliche Tempoveränderung. ${isLeading ? "Die neue Führung steuert in einem anderen Rhythmus." : "Das neue Teammitglied arbeitet in einem anderen Takt."}`);
    lines.push(`- Zusammenarbeit: Ohne aktive Steuerung entstehen Konflikte. Die unterschiedlichen Arbeitslogiken erfordern klare Regeln und Erwartungsmanagement.`);
  }
  lines.push("");

  lines.push("5. Aufgaben- & KPI-Impact");
  lines.push("");
  if (input.tasks && input.tasks.length > 0) {
    lines.push(`Aufgabenbereiche: ${input.tasks.join(", ")}`);
  }
  if (input.kpiFocus && input.kpiFocus.length > 0) {
    lines.push(`KPI-Schwerpunkte: ${input.kpiFocus.join(", ")}`);
  }
  if (dominanceTeam !== dominancePerson) {
    lines.push(`Die Verschiebung von ${domTypeLabel(dominanceTeam)} zu ${domTypeLabel(dominancePerson)} wirkt sich auf die operative Steuerung aus. ${isLeading ? "Die Führungslogik verändert Priorisierung und Ergebnismessung." : "Die unterschiedliche Arbeitslogik beeinflusst Teamabstimmung und Arbeitsteilung."}`);
  } else {
    lines.push(`Team und ${isLeading ? "neue Führungskraft" : "neues Teammitglied"} teilen die gleiche Arbeitslogik. Die operative Wirkung bleibt konsistent. KPI-Steuerung und Aufgabenpriorisierung bleiben stabil.`);
  }
  lines.push("");

  lines.push("6. Konflikt- & Druckprognose");
  lines.push("");
  if (scores.CI <= 30) {
    lines.push("Konfliktrisiko: Gering. Die Arbeitslogiken sind kompatibel. Konflikte entstehen eher aus Sachfragen als aus strukturellen Spannungen.");
  } else if (scores.CI <= 60) {
    lines.push("Konfliktrisiko: Mittel. Strukturelle Unterschiede können unter Druck zu Reibung führen. Besonders bei knappen Deadlines oder unklaren Prioritäten steigt das Spannungspotenzial.");
  } else {
    lines.push("Konfliktrisiko: Hoch. Die grundlegend verschiedenen Arbeitslogiken erzeugen systemische Spannung. Ohne klare Steuerung entstehen wiederkehrende Konflikte um Prioritäten, Qualität und Tempo.");
  }
  lines.push("");

  lines.push("7. Team-Reifegrad");
  lines.push("");
  lines.push("- Entscheidungsklarheit: " + (trafficLight === "GREEN" ? "Hoch — Entscheidungswege sind etabliert und bleiben stabil." : trafficLight === "YELLOW" ? "Mittel — Entscheidungslogiken müssen explizit abgestimmt werden." : "Niedrig — Entscheidungsprozesse müssen neu definiert werden."));
  lines.push("- Kommunikationsqualität: " + (shiftType === "VERSTAERKUNG" ? "Stabil — gleiche Sprache und Logik." : shiftType === "ERGAENZUNG" ? "Ausbaufähig — neue Perspektiven bereichern, erfordern aber Übersetzung." : "Kritisch — unterschiedliche Logiken erfordern aktive Kommunikationssteuerung."));
  lines.push("- Konfliktfähigkeit: " + (scores.CI <= 30 ? "Gut — geringe strukturelle Spannung." : scores.CI <= 60 ? "Entwicklungsfähig — situative Konflikte wahrscheinlich." : "Herausfordernd — systemische Konflikte ohne Steuerung vorprogrammiert."));
  lines.push("- Leistungsstabilität: " + (intensityLevel === "NIEDRIG" ? "Hoch — keine Leistungseinbrüche zu erwarten." : intensityLevel === "MITTEL" ? "Mittel — temporäre Produktivitätsschwankungen möglich." : "Gefährdet — ohne Steuerung drohen spürbare Leistungseinbrüche."));
  lines.push("- Integrationsbereitschaft: " + (shiftType === "VERSTAERKUNG" || shiftType === "ERGAENZUNG" ? "Hoch — das Team ist für die Integration offen." : "Eingeschränkt — aktive Maßnahmen zur Integrationsförderung notwendig."));
  lines.push("");

  lines.push("8. Chancen");
  lines.push("");
  for (const c of chances) {
    lines.push(`- ${c}`);
  }
  lines.push("");

  lines.push("9. Risiken");
  lines.push("");
  for (const r of risks) {
    lines.push(`- ${r}`);
  }
  lines.push("");

  lines.push("10. Führungshebel");
  lines.push("");
  const levers = buildLevers(shiftType, intensityLevel, isLeading);
  for (const l of levers) {
    lines.push(`- ${l}`);
  }
  lines.push("");

  lines.push("11. Integrationsplan (30 Tage)");
  lines.push("");
  for (const phase of integrationPlan) {
    lines.push(`**${phase.title} (${phase.days})**`);
    for (const a of phase.actions) {
      lines.push(`- ${a}`);
    }
    lines.push("");
  }

  lines.push("12. Messpunkte");
  lines.push("");
  lines.push(`- Teamzufriedenheit nach 30 Tagen messen (Kurzumfrage, 5 Fragen)`);
  lines.push(`- Anzahl offener Konflikte oder Eskalationen dokumentieren`);
  lines.push(`- Produktivitätskennzahlen vor und nach Integration vergleichen`);
  if (isLeading) {
    lines.push(`- Führungsakzeptanz: Feedbackgespräch mit 2-3 Teammitgliedern nach Woche 3`);
  } else {
    lines.push(`- Integrationsgespräch mit dem neuen Teammitglied nach Woche 3`);
  }
  lines.push(`- Abstimmungsaufwand bewerten: Steigt oder sinkt die Anzahl notwendiger Meetings?`);
  lines.push("");

  lines.push("13. Gesamtbewertung");
  lines.push("");
  if (trafficLight === "GREEN") {
    lines.push(`Die Integration von ${personRole} in das Team ${teamName} ist strukturell unproblematisch. Die Arbeitslogiken sind kompatibel, der Veränderungsimpuls gering. Das Team wird die Integration weitgehend selbstständig bewältigen. Normale Steuerung ist ausreichend. Die Fokuspunkte liegen auf der Sicherstellung der Teamkultur und der Nutzung möglicher Ergänzungspotenziale.`);
  } else if (trafficLight === "YELLOW") {
    lines.push(`Die Integration von ${personRole} in das Team ${teamName} ist steuerbar, erfordert aber aktive Aufmerksamkeit. Die Arbeitslogiken weichen erkennbar voneinander ab, was ohne Steuerung zu Reibung führen kann. Mit klarer Kommunikation, definierten Erwartungen und situativer Steuerung wird die Integration gelingen. Der Transformationsscore von ${Math.round(scores.TS)} zeigt, dass der Veränderungsimpuls spürbar, aber handhabbar ist.`);
  } else {
    lines.push(`Die Integration von ${personRole} in das Team ${teamName} stellt eine erhebliche Herausforderung dar. Die Arbeitslogiken sind grundlegend verschieden, der Transformationsscore von ${Math.round(scores.TS)} signalisiert hohe Veränderungsintensität. Ohne aktive und konsequente Steuerung sind Leistungseinbrüche, Konflikte und Integrationsprobleme wahrscheinlich. Die ersten 30 Tage sind entscheidend: Klare Kommunikation, definierte Entscheidungswege und aktives Erwartungsmanagement sind Pflicht, nicht Kür.`);
  }

  return lines.join("\n");
}

function buildLevers(shiftType: ShiftType, intensity: IntensityLevel, isLeading: boolean): string[] {
  const levers: string[] = [];

  if (intensity !== "NIEDRIG") {
    levers.push(isLeading
      ? "Erwartungsklärung: In der ersten Woche ein Kick-off mit dem gesamten Team durchführen. Prioritäten, Entscheidungswege und Qualitätsmaßstäbe transparent machen."
      : "Erwartungsklärung: Im ersten Gespräch mit dem neuen Teammitglied Arbeitslogik, Prioritäten und Zusammenarbeitsregeln besprechen."
    );
  }

  if (shiftType === "SPANNUNG" || shiftType === "TRANSFORMATION") {
    levers.push("Entscheidungszeitfenster definieren: Klare Fristen für Entscheidungen verhindern Endlosschleifen und reduzieren Reibung.");
    levers.push("Wöchentliches Steuerungsmeeting: 30 Minuten zur Abstimmung von Prioritäten, offenen Punkten und Feedback.");
  }

  if (shiftType === "REIBUNG" || shiftType === "HYBRID") {
    levers.push("Kommunikationsregeln vereinbaren: Wie werden Konflikte angesprochen? Wer moderiert bei Uneinigkeit?");
  }

  levers.push("Feedbackschleifen einbauen: Nach 2 und 4 Wochen strukturiertes Feedback einholen — sowohl vom Team als auch vom neuen Teammitglied.");

  if (isLeading) {
    levers.push("Quick Wins ermöglichen: Der neuen Führungskraft früh Gelegenheit geben, sichtbare Erfolge zu erzielen, um Akzeptanz aufzubauen.");
  } else {
    levers.push("Buddy-System: Ein erfahrenes Teammitglied als Ansprechpartner für informelle Fragen und Teamkultur benennen.");
  }

  return levers.slice(0, 6);
}
