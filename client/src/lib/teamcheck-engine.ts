import {
  type ComponentKey, type Triad, normalizeTriad,
} from "./jobcheck-engine";

export type DominanceType = "IMPULSIV" | "INTUITIV" | "ANALYTISCH" | "MIX";
export type ShiftIntensity = "NIEDRIG" | "MITTEL" | "HOCH";
export type VerschiebungType = "VERSTAERKUNG" | "ERGAENZUNG" | "SPANNUNG" | "REIBUNG" | "TRANSFORMATION";
export type UrteilBadge = "STRATEGISCH_CHANCEN" | "ENTWICKLUNGSFAEHIG" | "NO_GO";

export type TeamCheckInput = {
  soll: Triad;
  kandidat: Triad;
  team: Triad;
  beruf: string;
  bereich: string;
  fuehrungstyp: string;
  isLeading: boolean;
};

export type DiagnoseResult = {
  sollDominanz: string;
  kandidatDominanz: string;
  teamDominanz: string;
  dominanzstruktur: string;
  deltaWert: number;
  verschiebung: VerschiebungType;
  verschiebungLabel: string;
  intensitaet: ShiftIntensity;
  verschiebungBeschreibung: string;
};

export type SystemwirkungResult = {
  headline: string;
  entscheidungslogik: { bisher: string; mitNeu: string; fuerFK: string };
  prozessWirkung: { positiv: string[]; negativ: string[] };
  qualitaetsWirkung: { positiv: string[]; negativ: string[] };
};

export type StressprofilResult = {
  normalState: string;
  unkontrolliert: string[];
  zweitKomponente: string;
  steuerung: string;
};

export type PrognosePhase = {
  label: string;
  description: string;
  bullets: string[];
};

export type PrognoseResult = {
  phases: PrognosePhase[];
};

export type HandlungsempfehlungenResult = {
  kernchancen: string[];
  kernrisiken: string[];
  topHebel: string[];
};

export type GesamturteilResult = {
  badges: UrteilBadge[];
  einschaetzung: string;
  eskalationsrisiko: string;
  risikoindikator: string;
  empfehlung: string;
};

export type EskalationsrisikoResult = {
  level: string;
  triggers: string[];
  description: string;
};

export type SteuerbarkeitResult = {
  bewertung: string;
  bedingungen: string[];
};

export type TeamCheckResult = {
  diagnose: DiagnoseResult;
  systemwirkung: SystemwirkungResult;
  stressprofil: StressprofilResult;
  prognose: PrognoseResult;
  handlungsempfehlungen: HandlungsempfehlungenResult;
  eskalationsrisiko: EskalationsrisikoResult;
  steuerbarkeit: SteuerbarkeitResult;
  gesamturteil: GesamturteilResult;
};

export function generateDiagnoseSummary(kandidat: Triad, team: Triad, isLeading: boolean): string {
  const domK = dominanceType(normalizeTriad(kandidat));
  const domT = dominanceType(normalizeTriad(team));
  const same = domK === domT;
  const rolle = isLeading ? "Die Führungskraft" : "Das Teammitglied";

  const labelMap: Record<DominanceType, string> = {
    IMPULSIV: "Ergebnis- und Umsetzungsorientierung",
    INTUITIV: "Beziehungs- und Konsensorientierung",
    ANALYTISCH: "Struktur- und Prüfungsorientierung",
    MIX: "situative Breite",
  };
  const effectMap: Record<string, string> = {
    "IMPULSIV-IMPULSIV": "Die Besetzung verstärkt die bestehende Ergebnis- und Umsetzungsorientierung. Tempo steigt, Reflexionstiefe bleibt kritisch.",
    "INTUITIV-INTUITIV": "Die Besetzung verstärkt die bestehende Beziehungs- und Konsensorientierung. Bindung steigt, Entscheidungstempo bleibt kritisch.",
    "ANALYTISCH-ANALYTISCH": "Die Besetzung verstärkt die bestehende Struktur- und Prüfungsorientierung. Qualität steigt, Entscheidungsgeschwindigkeit bleibt kritisch.",
    "MIX-MIX": "Die Besetzung verstärkt die bestehende Breite. Flexibilität steigt, klare Leitstruktur bleibt kritisch.",
    "IMPULSIV-INTUITIV": `${rolle} bringt Ergebnisdruck in ein beziehungsorientiertes System. Umsetzungstempo steigt, Teamklima kann unter Druck geraten.`,
    "IMPULSIV-ANALYTISCH": `${rolle} bringt Handlungsdynamik in ein strukturorientiertes System. Entscheidungen werden schneller, Prüftiefe kann sinken.`,
    "IMPULSIV-MIX": `${rolle} bringt klare Ergebnisorientierung in ein breit aufgestelltes System. Richtung entsteht, Flexibilität kann eingeschränkt werden.`,
    "INTUITIV-IMPULSIV": `${rolle} bringt Konsensorientierung in ein ergebnisorientiertes System. Zusammenhalt steigt, Entscheidungstempo kann sinken.`,
    "INTUITIV-ANALYTISCH": `${rolle} bringt Beziehungsfokus in ein strukturorientiertes System. Dialog steigt, Entscheidungsklarheit kann leiden.`,
    "INTUITIV-MIX": `${rolle} bringt Beziehungsstärke in ein breit aufgestelltes System. Teamkultur wird gestärkt, klare Ergebnisorientierung kann fehlen.`,
    "ANALYTISCH-IMPULSIV": `${rolle} bringt Strukturtiefe in ein ergebnisorientiertes System. Qualität steigt, Geschwindigkeit kann sinken.`,
    "ANALYTISCH-INTUITIV": `${rolle} bringt Prüflogik in ein beziehungsorientiertes System. Nachvollziehbarkeit steigt, Konsenskultur kann unter Druck geraten.`,
    "ANALYTISCH-MIX": `${rolle} bringt klare Standards in ein breit aufgestelltes System. Struktur entsteht, Anpassungsfähigkeit kann sinken.`,
    "MIX-IMPULSIV": `${rolle} bringt situative Breite in ein ergebnisorientiertes System. Flexibilität steigt, klare Richtung kann fehlen.`,
    "MIX-INTUITIV": `${rolle} bringt situative Breite in ein beziehungsorientiertes System. Anpassungsfähigkeit steigt, Konsistenz kann sinken.`,
    "MIX-ANALYTISCH": `${rolle} bringt situative Breite in ein strukturorientiertes System. Flexibilität steigt, Standards können verwässern.`,
  };
  return effectMap[`${domK}-${domT}`] || "Die Besetzung verändert die bestehende Systemdynamik.";
}

function dominanceType(p: Triad): DominanceType {
  const vals = [
    { key: "IMPULSIV" as DominanceType, v: p.impulsiv },
    { key: "INTUITIV" as DominanceType, v: p.intuitiv },
    { key: "ANALYTISCH" as DominanceType, v: p.analytisch },
  ].sort((a, b) => b.v - a.v);
  if (vals[0].v - vals[1].v <= 5) return "MIX";
  return vals[0].key;
}

function dominanceLabelDe(d: DominanceType): string {
  switch (d) {
    case "IMPULSIV": return "Impulsiv";
    case "INTUITIV": return "Intuitiv";
    case "ANALYTISCH": return "Analytisch";
    case "MIX": return "Ausgeglichen";
  }
}

function topComponent(p: Triad): ComponentKey {
  if (p.impulsiv >= p.intuitiv && p.impulsiv >= p.analytisch) return "impulsiv";
  if (p.intuitiv >= p.impulsiv && p.intuitiv >= p.analytisch) return "intuitiv";
  return "analytisch";
}

function secondComponent(p: Triad): ComponentKey {
  const sorted = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[])
    .sort((a, b) => p[b] - p[a]);
  return sorted[1];
}

function computeDelta(kandidat: Triad, team: Triad): number {
  return Math.round(
    (Math.abs(kandidat.impulsiv - team.impulsiv)
    + Math.abs(kandidat.intuitiv - team.intuitiv)
    + Math.abs(kandidat.analytisch - team.analytisch)) / 2
  );
}

function computeVerschiebung(domK: DominanceType, domT: DominanceType, delta: number): { type: VerschiebungType; label: string } {
  if (domK === domT && delta < 5) return { type: "VERSTAERKUNG", label: "Verstärkung" };
  if (domK === domT && delta <= 15) return { type: "ERGAENZUNG", label: "Ergänzung" };
  if (delta <= 10) return { type: "ERGAENZUNG", label: "Ergänzung" };
  if (delta <= 20) return { type: "REIBUNG", label: "Reibungsfall" };
  if (delta <= 35) return { type: "SPANNUNG", label: "Spannungsfall" };
  return { type: "TRANSFORMATION", label: "Transformationsfall" };
}

function computeIntensitaet(delta: number): ShiftIntensity {
  if (delta <= 12) return "NIEDRIG";
  if (delta <= 25) return "MITTEL";
  return "HOCH";
}

type DomPair = `${DominanceType}-${DominanceType}`;
function domPair(k: DominanceType, t: DominanceType): DomPair {
  return `${k}-${t}`;
}

const SYSTEMWIRKUNG_HEADLINES: Record<string, string> = {
  "IMPULSIV-IMPULSIV": "Die Besetzung verstärkt das bestehende Tempo-System. Entscheidungsgeschwindigkeit und Umsetzungsdruck nehmen zu.",
  "IMPULSIV-INTUITIV": "Die Besetzung verschiebt den Fokus von Beziehung und Konsens in Richtung Ergebnis und Umsetzungstempo.",
  "IMPULSIV-ANALYTISCH": "Die Besetzung bringt Geschwindigkeit und Durchsetzungskraft in ein strukturorientiertes System. Tempo kollidiert mit Absicherung.",
  "INTUITIV-IMPULSIV": "Die Besetzung bringt Beziehungsorientierung und Konsensfokus in ein tempogetriebenes Umfeld.",
  "INTUITIV-INTUITIV": "Die Besetzung verstärkt die bestehende Beziehungs- und Konsensorientierung. Bindung steigt, Entscheidungstempo bleibt kritisch.",
  "INTUITIV-ANALYTISCH": "Die Besetzung bringt Beziehungs- und Dialogfokus in ein analytisch-strukturiertes Umfeld.",
  "ANALYTISCH-IMPULSIV": "Die Besetzung erhöht Prozessstabilität, erfordert jedoch klare Entscheidungsfenster, um Tempoverluste zu vermeiden.",
  "ANALYTISCH-INTUITIV": "Die Besetzung bringt Strukturklarheit und Prüflogik in ein beziehungsorientiertes Team.",
  "ANALYTISCH-ANALYTISCH": "Die Besetzung verstärkt die bestehende Struktur- und Qualitätsorientierung. Prozessstabilität steigt, Innovation wird gebremst.",
  "MIX-IMPULSIV": "Ein ausgeglichenes Profil trifft auf ein tempogetriebenes Team. Die fehlende klare Handschrift kann als Führungsschwäche wahrgenommen werden.",
  "MIX-INTUITIV": "Ein ausgeglichenes Profil trifft auf ein beziehungsorientiertes Team. Wechselnde Prioritäten können als Unsicherheit gelesen werden.",
  "MIX-ANALYTISCH": "Ein ausgeglichenes Profil trifft auf ein strukturorientiertes Team. Situative Entscheidungen kollidieren mit dem Absicherungsbedürfnis.",
  "IMPULSIV-MIX": "Tempo und Durchsetzung treffen auf ein Team ohne klare Dominanz. Umsetzungsdruck fehlt ein stabiler Gegenpol.",
  "INTUITIV-MIX": "Beziehungsorientierung trifft auf ein ausgeglichenes Team. Konsenssuche kann zu Endlosschleifen führen.",
  "ANALYTISCH-MIX": "Strukturorientierung trifft auf ein flexibles Team. Prozessanforderungen können als Übersteuerung wahrgenommen werden.",
  "MIX-MIX": "Beide Seiten haben kein klares Profil. Entscheidungslogik und Prioritäten wechseln situativ.",
};

function buildEntscheidungslogik(domK: DominanceType, domT: DominanceType, isLeading: boolean): { bisher: string; mitNeu: string; fuerFK: string } {
  const key = domPair(domK, domT);
  const catalog: Record<string, { bisher: string; mitNeu: string; fuerFKLead: string; fuerFKTeam: string }> = {
    "ANALYTISCH-IMPULSIV": {
      bisher: "Schnell, intuitiv, direkt entscheidend.",
      mitNeu: "Entscheidungen werden stärker geprüft, Argumente systematischer gewichtet, Risiken bewusster bewertet. Das führt zu mehr Stabilität – gleichzeitig kann das Entscheidungstempo moderat sinken.",
      fuerFKLead: "Die Führungskraft muss aktiv definieren, wann Geschwindigkeit Vorrang hat und wann vertiefte Prüfung notwendig ist.",
      fuerFKTeam: "Das Teammitglied sollte lernen, wann Geschwindigkeit Vorrang hat und wann vertiefte Prüfung notwendig ist.",
    },
    "IMPULSIV-ANALYTISCH": {
      bisher: "Strukturiert, abgesichert, faktenbasiert.",
      mitNeu: "Entscheidungen werden beschleunigt, Risikobewertung tritt in den Hintergrund. Tempo steigt, aber Absicherung sinkt.",
      fuerFKLead: "Die Führungskraft muss definieren, wo Tempo Vorrang hat und wo Absicherung unverzichtbar bleibt.",
      fuerFKTeam: "Das Teammitglied sollte sich bewusst machen, wo Tempo erwartet wird und wo Absicherung im Team Priorität hat.",
    },
    "IMPULSIV-INTUITIV": {
      bisher: "Konsensorientiert, beziehungsgetrieben, dialogreich.",
      mitNeu: "Entscheidungen werden direkter, ergebnisorientierter. Abstimmungsrunden werden kürzer, aber Beziehungsebene kann leiden.",
      fuerFKLead: "Die Führungskraft muss Balance finden zwischen Tempo und Beziehungspflege. Direkte Entscheidungen klar kommunizieren.",
      fuerFKTeam: "Das Teammitglied sollte beachten, dass das Team Abstimmung und Dialog schätzt. Direkte Vorgehen vorher kommunizieren.",
    },
    "INTUITIV-IMPULSIV": {
      bisher: "Schnell, direkt, ergebnisorientiert.",
      mitNeu: "Entscheidungen werden stärker abgestimmt, Konsens gewinnt an Bedeutung. Das Team erlebt mehr Dialog, aber potenziell langsamere Umsetzung.",
      fuerFKLead: "Die Führungskraft muss klar kommunizieren, wo Konsens wichtig ist und wo Geschwindigkeit Vorrang hat.",
      fuerFKTeam: "Das Teammitglied sollte sich bewusst machen, dass das Team Geschwindigkeit erwartet. Abstimmungsbedarf offen ansprechen.",
    },
    "INTUITIV-ANALYTISCH": {
      bisher: "Strukturiert, prozessorientiert, faktenbasiert.",
      mitNeu: "Entscheidungen werden dialogischer, Beziehungsaspekte gewinnen an Gewicht. Prozesseffizienz kann unter Abstimmungsschleifen leiden.",
      fuerFKLead: "Die Führungskraft muss definieren, wann Dialog notwendig ist und wann Prozessstandards gelten.",
      fuerFKTeam: "Das Teammitglied sollte verstehen, dass das Team klare Prozesse erwartet. Dialogbedarf gezielt einbringen.",
    },
    "ANALYTISCH-INTUITIV": {
      bisher: "Konsensorientiert, beziehungsgetrieben, empathisch.",
      mitNeu: "Entscheidungen werden faktenbasierter, emotionale Argumente verlieren an Gewicht. Transparenz steigt, aber das Team kann Distanz empfinden.",
      fuerFKLead: "Die Führungskraft muss aktiv Beziehungspflege in ihre strukturierte Arbeitsweise integrieren.",
      fuerFKTeam: "Das Teammitglied sollte aktiv den Kontakt zum Team suchen und die eigene Arbeitsweise erklären.",
    },
    "IMPULSIV-IMPULSIV": {
      bisher: "Schnell, direkt, umsetzungsorientiert.",
      mitNeu: "Das bestehende Tempo wird verstärkt. Entscheidungen fallen noch schneller, aber Reflexionsphasen werden systematisch übersprungen.",
      fuerFKLead: "Die Führungskraft muss bewusst Qualitäts-Gates einbauen und Reflexionsmomente institutionalisieren.",
      fuerFKTeam: "Das Teammitglied sollte bewusst Qualitätsmomente einplanen und nicht nur auf Geschwindigkeit setzen.",
    },
    "INTUITIV-INTUITIV": {
      bisher: "Konsensgetrieben, beziehungsorientiert, dialogreich.",
      mitNeu: "Die Konsensorientierung verstärkt sich. Bindung und Teamgefühl steigen, aber schwierige Entscheidungen werden aufgeschoben.",
      fuerFKLead: "Die Führungskraft muss Entscheidungsfristen setzen und Konfliktroutinen etablieren.",
      fuerFKTeam: "Das Teammitglied sollte darauf achten, klare Entscheidungen nicht aufzuschieben und Konflikte offen anzusprechen.",
    },
    "ANALYTISCH-ANALYTISCH": {
      bisher: "Strukturiert, qualitätsorientiert, prozessgetrieben.",
      mitNeu: "Die Strukturorientierung verstärkt sich. Qualität und Planbarkeit steigen, aber Innovationsgeschwindigkeit und Flexibilität sinken.",
      fuerFKLead: "Die Führungskraft muss Innovationsimpulse bewusst setzen und Veränderungsgeschwindigkeit aktiv steuern.",
      fuerFKTeam: "Das Teammitglied sollte offen für neue Ansätze bleiben und eigene Impulse für Veränderung einbringen.",
    },
    "MIX-IMPULSIV": {
      bisher: "Schnell, direkt, ergebnisorientiert.",
      mitNeu: "Die fehlende klare Handschrift erzeugt wechselnde Impulse. Das Team erwartet klare Richtung, erhält aber situative Entscheidungen.",
      fuerFKLead: "Die Führungskraft muss eine dominante Arbeitsweise als Standard definieren und konsequent beibehalten.",
      fuerFKTeam: "Das Teammitglied sollte sich an das Tempo des Teams anpassen und konsistentes Verhalten zeigen.",
    },
    "MIX-INTUITIV": {
      bisher: "Konsensorientiert, beziehungsgetrieben, empathisch.",
      mitNeu: "Wechselnde Prioritäten erzeugen Verunsicherung im Team. Die fehlende klare Linie kann irritierend wirken.",
      fuerFKLead: "Die Führungskraft muss Beziehungspflege ritualisieren und Verlässlichkeit durch feste Routinen herstellen.",
      fuerFKTeam: "Das Teammitglied sollte feste Routinen aufbauen und verlässliches Verhalten zeigen, um Vertrauen zu stärken.",
    },
    "MIX-ANALYTISCH": {
      bisher: "Strukturiert, prozessorientiert, absicherungsorientiert.",
      mitNeu: "Situative Entscheidungen kollidieren mit dem Bedürfnis nach klaren Standards. Inkonsistenz wird als Qualitätsmangel erlebt.",
      fuerFKLead: "Die Führungskraft muss Standards und Qualitäts-Gates klar definieren und Prozessrahmen vor Flexibilität stellen.",
      fuerFKTeam: "Das Teammitglied sollte sich an bestehende Standards halten und Änderungen transparent abstimmen.",
    },
    "IMPULSIV-MIX": {
      bisher: "Situativ, ohne klare dominante Logik.",
      mitNeu: "Umsetzungsdruck trifft auf ein Team ohne stabilen Gegenpol. Teile folgen, andere reagieren mit Rückzug.",
      fuerFKLead: "Die Führungskraft muss Teamstruktur klären und Rollen explizit machen.",
      fuerFKTeam: "Das Teammitglied sollte das eigene Tempo bewusst anpassen und Rollen im Team klären.",
    },
    "INTUITIV-MIX": {
      bisher: "Situativ, ohne klare dominante Logik.",
      mitNeu: "Konsenssuche trifft auf fehlende Teamstruktur. Abstimmungsrunden dauern länger, Entscheidungen werden aufgeschoben.",
      fuerFKLead: "Die Führungskraft muss Entscheidungsfristen setzen und Ergebnisorientierung stärken.",
      fuerFKTeam: "Das Teammitglied sollte klare Absprachen treffen und Ergebnisse sichtbar machen.",
    },
    "ANALYTISCH-MIX": {
      bisher: "Situativ, ohne klare dominante Logik.",
      mitNeu: "Strukturanforderungen treffen auf ein flexibles Team. Teile akzeptieren Vorgaben, andere empfinden sie als Einengung.",
      fuerFKLead: "Die Führungskraft muss den Strukturrahmen klar, aber flexibel gestalten.",
      fuerFKTeam: "Das Teammitglied sollte eigene Strukturvorschläge einbringen, ohne das Team einzuengen.",
    },
    "MIX-MIX": {
      bisher: "Situativ, ohne klare dominante Logik.",
      mitNeu: "Beide Seiten haben kein klares Profil. Richtungswechsel sind häufig, Vorhersagbarkeit ist gering.",
      fuerFKLead: "Die Führungskraft muss feste Entscheidungsregeln und Standards definieren.",
      fuerFKTeam: "Das Teammitglied sollte eigene Arbeitsstandards etablieren und verlässlich einhalten.",
    },
  };
  const entry = catalog[key];
  return { bisher: entry.bisher, mitNeu: entry.mitNeu, fuerFK: isLeading ? entry.fuerFKLead : entry.fuerFKTeam };
}

function buildProzessWirkung(domK: DominanceType, domT: DominanceType): { positiv: string[]; negativ: string[] } {
  const catalog: Record<string, { positiv: string[]; negativ: string[] }> = {
    "ANALYTISCH-IMPULSIV": {
      positiv: ["Struktur in Abläufen", "Verbindlichkeit von Standards", "Fehlerprävention", "Nachvollziehbarkeit von Entscheidungen"],
      negativ: ["Entscheidungszyklen verlängern sich", "Abstimmungsrunden erhöhen sich", "Operative Durchlaufzeiten können kurzfristig steigen"],
    },
    "IMPULSIV-ANALYTISCH": {
      positiv: ["Schnellere Umsetzung", "Kürzere Entscheidungswege", "Höhere Handlungsgeschwindigkeit"],
      negativ: ["Qualitätsstandards können sinken", "Absicherungslogik wird umgangen", "Fehlerquote steigt kurzfristig"],
    },
    "IMPULSIV-INTUITIV": {
      positiv: ["Klarere Ergebnisorientierung", "Schnellere Umsetzungszyklen", "Direkte Verantwortlichkeiten"],
      negativ: ["Beziehungsdynamik wird belastet", "Konsenskultur wird verdrängt", "Teamzusammenhalt kann leiden"],
    },
    "INTUITIV-IMPULSIV": {
      positiv: ["Bessere Teamkommunikation", "Höhere Mitarbeiterbindung", "Stärkere Konsenskultur"],
      negativ: ["Entscheidungstempo sinkt", "Ergebnisorientierung wird weicher", "Durchsetzung wird schwieriger"],
    },
    "INTUITIV-ANALYTISCH": {
      positiv: ["Stärkere Teamkommunikation", "Bessere Abstimmung", "Empathischere Führungskultur"],
      negativ: ["Prozesseffizienz kann sinken", "Analytische Standards verlieren Gewicht", "Abstimmungsschleifen nehmen zu"],
    },
    "ANALYTISCH-INTUITIV": {
      positiv: ["Prozessqualität steigt", "Struktur nehmen wenig Fahrt auf", "Nachvollziehbarkeit steigt"],
      negativ: ["Prozessrouten verlängern sich", "Spontane Entscheidungen sinken", "Team kann Distanz empfinden"],
    },
    "IMPULSIV-IMPULSIV": {
      positiv: ["Maximales Tempo", "Schnellste Umsetzung", "Klare Ergebnisorientierung"],
      negativ: ["Qualitätsrisiken steigen", "Reflexion wird vernachlässigt", "Fehleranfälligkeit nimmt zu"],
    },
    "INTUITIV-INTUITIV": {
      positiv: ["Starke Bindung", "Hohe Teamzufriedenheit", "Exzellente Kommunikation"],
      negativ: ["Entscheidungsverzögerung", "Konfliktvermeidung", "Schwierige Themen werden aufgeschoben"],
    },
    "ANALYTISCH-ANALYTISCH": {
      positiv: ["Höchste Prozessqualität", "Beste Planbarkeit", "Minimale Fehlerquote"],
      negativ: ["Innovation wird gebremst", "Veränderungen werden verlangsamt", "Flexibilität sinkt deutlich"],
    },
    "MIX-IMPULSIV": {
      positiv: ["Breite Perspektive ergänzt Tempo", "Situative Anpassung möglich"],
      negativ: ["Fehlende klare Linie erzeugt Reibung", "Wechselnde Impulse irritieren tempostarkes Team", "Entscheidungslogik inkonsistent"],
    },
    "MIX-INTUITIV": {
      positiv: ["Vielseitigkeit ergänzt Beziehungskultur", "Flexible Führung"],
      negativ: ["Wechselnde Prioritäten erzeugen Verunsicherung", "Fehlende Verlässlichkeit in der Teamdynamik", "Konsens wird erschwert"],
    },
    "MIX-ANALYTISCH": {
      positiv: ["Flexibilität kann Starrheit lösen", "Neue Impulse für Prozessoptimierung"],
      negativ: ["Inkonsistente Entscheidungen kollidieren mit Strukturbedürfnis", "Standards werden situativ umgangen"],
    },
    "IMPULSIV-MIX": {
      positiv: ["Klare Richtung für orientierungsloses Team", "Tempo-Impuls setzt Bewegung"],
      negativ: ["Druck ohne Gegenpol erzeugt Widerstand", "Teile des Teams werden überrollt"],
    },
    "INTUITIV-MIX": {
      positiv: ["Beziehungsaufbau in unstrukturiertem Umfeld", "Kommunikation verbessert sich"],
      negativ: ["Konsenssuche ohne Gegengewicht verlängert Prozesse", "Entscheidungen werden aufgeschoben"],
    },
    "ANALYTISCH-MIX": {
      positiv: ["Strukturgebung für flexibles Team", "Klarere Prozesse und Standards"],
      negativ: ["Prozessanforderungen werden als Einengung empfunden", "Inkonsistente Teamreaktion auf Vorgaben"],
    },
    "MIX-MIX": {
      positiv: ["Maximale Anpassungsfähigkeit", "Keine Dominanzkonflikte"],
      negativ: ["Fehlende Vorhersagbarkeit", "Wechselnde Prioritäten", "Keine stabile Arbeitsweise"],
    },
  };
  return catalog[domPair(domK, domT)]!;
}

function buildQualitaetsWirkung(domK: DominanceType, domT: DominanceType): { positiv: string[]; negativ: string[] } {
  const catalog: Record<string, { positiv: string[]; negativ: string[] }> = {
    "ANALYTISCH-IMPULSIV": {
      positiv: ["Fehlerveränderung, Risikokontrolle gewinnen", "Durchlaufzeiten verlängern, Prüfschritte nehmen zu"],
      negativ: ["System wird kurzfristig langsamer", "Längere Entscheidungen sinken", "System reagiert langsamer bei Zeitdruck"],
    },
    "IMPULSIV-ANALYTISCH": {
      positiv: ["Schnellere Entscheidungen bei Qualitätsfragen", "Weniger Prüfschleifen"],
      negativ: ["Qualitätsstandards können erodieren", "Risikoeinschätzung wird oberflächlicher", "Fehlertoleranz steigt unbeabsichtigt"],
    },
    "IMPULSIV-INTUITIV": {
      positiv: ["Ergebnisorientierung stärkt Outcome-Qualität", "Verantwortlichkeiten werden klarer"],
      negativ: ["Prozessqualität kann sinken", "Sorgfalt in Abstimmung leidet", "Beziehungsfehler nehmen zu"],
    },
    "INTUITIV-IMPULSIV": {
      positiv: ["Kommunikationsqualität steigt", "Fehler durch Missverständnisse sinken"],
      negativ: ["Ergebnisqualität kann unter Konsenssuche leiden", "Tempo bei Qualitätsprüfungen sinkt"],
    },
    "ANALYTISCH-INTUITIV": {
      positiv: ["Prozessqualität, Struktur nehmen zu", "Fehlervermeidung verbessert sich"],
      negativ: ["System wird kurzfristig kontrollierter, aber distanzierter", "Spontanität und kreative Lösungen sinken"],
    },
    "INTUITIV-ANALYTISCH": {
      positiv: ["Kommunikationsqualität verbessert sich", "Teamfehler durch Dialog reduziert"],
      negativ: ["Analytische Qualitätsstandards können aufweichen", "Prozessstrenge lässt nach"],
    },
    "IMPULSIV-IMPULSIV": {
      positiv: ["Hohe Ergebnisorientierung", "Schnelle Qualitätsentscheidungen"],
      negativ: ["Prüftiefe wird systematisch übersprungen", "Fehlerquote steigt", "Qualitäts-Gates fehlen"],
    },
    "INTUITIV-INTUITIV": {
      positiv: ["Kommunikationsqualität exzellent", "Wenige Missverständnisse"],
      negativ: ["Qualitätsstandards werden emotional bewertet", "Harte Entscheidungen werden vermieden"],
    },
    "ANALYTISCH-ANALYTISCH": {
      positiv: ["Höchste Prüfqualität", "Beste Fehlervermeidung", "Maximale Nachvollziehbarkeit"],
      negativ: ["Überprüfung wird zum Selbstzweck", "Innovation leidet unter Kontrollbedürfnis"],
    },
    "MIX-IMPULSIV": {
      positiv: ["Situative Qualitätsanpassung möglich"],
      negativ: ["Wechselnde Qualitätsmassstäbe irritieren", "Standards nicht durchsetzbar"],
    },
    "MIX-INTUITIV": {
      positiv: ["Flexible Qualitätsbewertung"],
      negativ: ["Inkonsistente Standards erzeugen Unsicherheit", "Qualitätskultur fehlt"],
    },
    "MIX-ANALYTISCH": {
      positiv: ["Situative Impulse für Qualitätsthemen"],
      negativ: ["Standards werden nicht konsequent eingehalten", "Prüftiefe schwankt"],
    },
    "IMPULSIV-MIX": {
      positiv: ["Klare Qualitätsentscheidungen durch Tempo"],
      negativ: ["Fehlende Gegenkontrolle", "Qualität wird Geschwindigkeit geopfert"],
    },
    "INTUITIV-MIX": {
      positiv: ["Dialog verbessert Qualitätsverständnis"],
      negativ: ["Standards werden nicht durchgesetzt", "Konsens statt Qualität"],
    },
    "ANALYTISCH-MIX": {
      positiv: ["Strukturierte Qualitätsvorgaben", "Klare Standards"],
      negativ: ["Team setzt Standards nicht konsequent um", "Inkonsistente Umsetzung"],
    },
    "MIX-MIX": {
      positiv: ["Situative Qualitätsanpassung", "Flexible Standards"],
      negativ: ["Inkonsistente Qualitätsmassstäbe", "Wechselnde Prioritäten bei Prüftiefe"],
    },
  };
  return catalog[domPair(domK, domT)]!;
}

function buildStressprofil(domK: DominanceType, kandidat: Triad): StressprofilResult {
  const sec = secondComponent(kandidat);
  const secLabel = sec === "impulsiv" ? "impulsiver Druck oder Durchsetzung" :
                   sec === "intuitiv" ? "intuitives Beziehungsbedürfnis oder Konsensschwäche" :
                   "analytische Detailtiefe oder Kontrollbedürfnis";

  const normalTexts: Record<DominanceType, string> = {
    IMPULSIV: "Im Alltag und unter normaler Belastung sorgt die Umsetzungsorientierung für klare Entscheidungen und schnelles Handeln. Die Wirkung ist steuerbar, sofern klare Qualitäts-Gates definiert sind.",
    INTUITIV: "Im Alltag und unter normaler Belastung sorgt die Beziehungsorientierung für gute Teamdynamik und stabile Kommunikation. Die Wirkung ist steuerbar, sofern Entscheidungsfristen definiert sind.",
    ANALYTISCH: "Im Alltag und unter normaler Belastung ergänzt die Strukturorientierung das vorhandene System. Die Wirkung ist steuerbar, sofern klare Entscheidungsfenster definiert sind.",
    MIX: "Im Alltag und unter normaler Belastung passt sich das ausgeglichene Profil situativ an. Die Wirkung ist steuerbar, sofern klare Leitplanken definiert sind.",
  };

  const unkontrolliertBase: Record<DominanceType, string[]> = {
    IMPULSIV: [
      "Entscheidungsdruck nimmt deutlich zu",
      "Durchsetzung wird konfrontativer",
      "Delegation sinkt, Mikromanagement-Tendenz steigt",
      "Reflexionsphasen werden komplett übersprungen",
    ],
    INTUITIV: [
      "Konsensbedürfnis steigt drastisch",
      "Entscheidungen werden aufgeschoben",
      "Konfliktvermeidung nimmt zu",
      "Emotionale Reaktionen werden häufiger",
    ],
    ANALYTISCH: [
      "Detailtiefe nimmt zu",
      "Prüf- und Validierungsschleifen häufen sich",
      "Entscheidungen werden stärker abgesichert",
      "Geschwindigkeit sinkt deutlicher",
    ],
    MIX: [
      "Verhalten wird unvorhersagbar",
      "Entscheidungslogik wechselt kurzfristig",
      "Stabilität sinkt",
      "Klare Leitlinie fehlt unter Druck",
    ],
  };

  const steuerungTexts: Record<DominanceType, string> = {
    IMPULSIV: "Klare Qualitäts-Gates, Feedback-Routinen und bewusste Verlangsamung bei kritischen Entscheidungen sind entscheidend, um Übersteuerung zu vermeiden.",
    INTUITIV: "Klare Entscheidungsfristen, Konfliktroutinen und Ergebnisorientierung sind entscheidend, um Entscheidungsblockaden zu vermeiden.",
    ANALYTISCH: "Klare Entscheidungsgrenzen, Zeitlimits und Priorisierungsregeln sind entscheidend, um Übersteuerung oder Blockade zu vermeiden.",
    MIX: "Feste Entscheidungsregeln, konsistente Standards und klare Prioritäten sind entscheidend, um Orientierungsverlust zu vermeiden.",
  };

  return {
    normalState: normalTexts[domK],
    unkontrolliert: unkontrolliertBase[domK],
    zweitKomponente: `Neben der dominanten Ausprägung kann sich situativ wieder ${secLabel} verstärken – jedoch nicht immer konsistent. Das System kann dann schwanken.`,
    steuerung: steuerungTexts[domK],
  };
}

function buildPrognose(domK: DominanceType, domT: DominanceType, intensity: ShiftIntensity): PrognoseResult {
  const isHigh = intensity === "HOCH";
  const isSame = domK === domT;

  const phase1Desc = isSame
    ? "Verstärkungseffekte werden sofort spürbar."
    : isHigh ? "Erhöhte Irritation im Team." : "Moderate Anpassungsphase.";

  const phase1Bullets = isSame
    ? ["Bestehende Muster verstärken sich", "Blinde Flecken werden deutlicher", "Korrekturmechanismen fehlen"]
    : [
      "Entscheidungsprozesse werden hinterfragt",
      isHigh ? "Strukturaufbau beginnt unter Spannung" : "Erste Anpassungen greifen",
      "Team orientiert sich neu",
    ];

  const phase2Desc = isSame
    ? "Verstärkung stabilisiert sich oder kippt in Einseitigkeit."
    : "Entweder Stabilisierung durch klare Regeln oder zunehmende Spannungen.";

  const phase2Bullets = isSame
    ? ["Einseitige Dynamik wird Normalzustand", "Gegengewichte müssen bewusst gesetzt werden", "Ohne Korrektur: blinde Flecken verfestigen sich"]
    : [
      "Klare Regeln führen zu Akzeptanz",
      `Ohne Steuerung: ${isHigh ? "zunehmende Spannungen" : "schleichende Reibung"}`,
      "Entscheidend: Führungskraft zeigt konsistentes Verhalten",
    ];

  const domKLabel = dominanceLabelDe(domK).toLowerCase();

  const phase3Positive = isSame
    ? `Bei bewusster Gegensteuerung: stabiles, leistungsstarkes System mit ${domKLabel}er Handschrift.`
    : `Bei aktiver Steuerung: deutlich höhere Leistungsfähigkeit und nachhaltigere Umsetzung.`;

  const phase3Negative = isSame
    ? "Ohne Korrektur: Einseitigkeit, blinde Flecken, steigende Fehleranfälligkeit."
    : "Ohne Steuerung: Tempoverlust, Frustration im Team und Wahrnehmung als Störfaktor.";

  return {
    phases: [
      { label: "0–30 Tage", description: phase1Desc, bullets: phase1Bullets },
      { label: "30–90 Tage", description: phase2Desc, bullets: phase2Bullets },
      { label: "> 90 Tage", description: `${phase3Positive}\n${phase3Negative}`, bullets: [] },
    ],
  };
}

function buildKernchancen(domK: DominanceType, domT: DominanceType): string[] {
  const catalog: Record<string, string[]> = {
    "ANALYTISCH-IMPULSIV": [
      "Nachhaltige Qualitätssteigerung",
      "Reduktion von Schnellschüssen",
      "Bessere Planbarkeit",
      "Höhere Prozessstabilität",
      "Klarere Entscheidungsstrukturen",
      "Nachvollziehbare Priorisierung",
      "Langfristig geringere Fehlerquote",
    ],
    "IMPULSIV-ANALYTISCH": [
      "Höhere Umsetzungsgeschwindigkeit",
      "Schnellere Marktreaktion",
      "Stärkere Ergebnisorientierung",
      "Direktere Verantwortlichkeiten",
      "Weniger Absicherungsschleifen",
      "Klarere Prioritäten",
    ],
    "IMPULSIV-INTUITIV": [
      "Klare Ergebnisorientierung",
      "Schnellere Entscheidungen",
      "Höhere Umsetzungskraft",
      "Direktere Kommunikation",
      "Stärkere Zielorientierung",
    ],
    "INTUITIV-IMPULSIV": [
      "Verbesserte Teamkommunikation",
      "Höhere Mitarbeiterbindung",
      "Bessere Konfliktlösung",
      "Stärkere Teamidentität",
      "Nachhaltigere Zusammenarbeit",
    ],
    "INTUITIV-ANALYTISCH": [
      "Bessere Teamdynamik",
      "Empathischere Führungskultur",
      "Stärkere Bindung an Standards",
      "Dialogorientierte Entscheidungen",
      "Weniger Kommunikationsfehler",
    ],
    "ANALYTISCH-INTUITIV": [
      "Höhere Prozessqualität",
      "Nachvollziehbarere Entscheidungen",
      "Bessere Dokumentation",
      "Klarere Standards",
      "Systematischere Fehlervermeidung",
    ],
    "IMPULSIV-IMPULSIV": [
      "Maximale Geschwindigkeit",
      "Starke Ergebnisorientierung",
      "Schnelle Marktreaktion",
      "Hohe Durchsetzungskraft",
    ],
    "INTUITIV-INTUITIV": [
      "Exzellente Teamkultur",
      "Höchste Bindung",
      "Sehr gute Kommunikation",
      "Starke Konsenskultur",
    ],
    "ANALYTISCH-ANALYTISCH": [
      "Höchste Prozessqualität",
      "Beste Planbarkeit",
      "Minimale Fehlerquote",
      "Maximale Nachvollziehbarkeit",
    ],
    "MIX-IMPULSIV": ["Breite Perspektive als Gegengewicht", "Situative Anpassungsfähigkeit", "Vielseitige Lösungsansätze"],
    "MIX-INTUITIV": ["Flexibilität in der Beziehungspflege", "Situative Führungsstärke", "Vielseitige Kompetenz"],
    "MIX-ANALYTISCH": ["Impulse für Innovation", "Flexibilität löst Starrheit", "Neue Perspektiven"],
    "IMPULSIV-MIX": ["Klare Richtung und Tempo", "Orientierung für unstrukturiertes Team", "Schnelle Entscheidungsfähigkeit"],
    "INTUITIV-MIX": ["Beziehungsaufbau und Bindung", "Kommunikationsverbesserung", "Teamidentität stärken"],
    "ANALYTISCH-MIX": ["Strukturgebung und Klarheit", "Prozessverbesserung", "Qualitätssteigerung"],
    "MIX-MIX": ["Maximale Anpassungsfähigkeit", "Keine Dominanzkonflikte", "Breite Flexibilität", "Offenheit für Veränderung"],
  };
  return catalog[domPair(domK, domT)]!;
}

function buildKernrisiken(domK: DominanceType, domT: DominanceType): string[] {
  const catalog: Record<string, string[]> = {
    "ANALYTISCH-IMPULSIV": [
      "Wahrnehmung als zu kontrollierend oder bremsend",
      "Konflikt zwischen Tempo und Validierung",
      "Verlängerte Entscheidungszyklen",
      "Frustration bei stark ergebnisorientierten Teammitgliedern",
      "Mikromanagement-Tendenz unter hohem Druck",
      "Operative Verlangsamung bei fehlenden Zeitlimits",
    ],
    "IMPULSIV-ANALYTISCH": [
      "Qualitätsverluste durch Geschwindigkeit",
      "Absicherungslogik wird umgangen",
      "Team fühlt sich übergangen",
      "Risikoeinschätzung wird oberflächlicher",
      "Standards erodieren unter Tempodruck",
    ],
    "IMPULSIV-INTUITIV": [
      "Beziehungsebene wird vernachlässigt",
      "Team fühlt sich unter Druck gesetzt",
      "Konsenskultur geht verloren",
      "Konflikte durch zu direkte Kommunikation",
      "Bindungsverlust bei empfindlichen Teammitgliedern",
    ],
    "INTUITIV-IMPULSIV": [
      "Wahrnehmung als zögerlich oder zu weich",
      "Entscheidungstempo sinkt kritisch",
      "Ergebnisorientierung leidet",
      "Team verliert Geduld bei Konsenssuche",
      "Durchsetzungsprobleme bei Widerstand",
    ],
    "INTUITIV-ANALYTISCH": [
      "Prozesseffizienz sinkt durch Dialog",
      "Analytische Standards verlieren Gewicht",
      "Abstimmungsschleifen verzögern Ergebnisse",
      "Faktenbasierte Entscheidungen werden emotionalisiert",
    ],
    "ANALYTISCH-INTUITIV": [
      "Team empfindet emotionale Distanz",
      "Beziehungsebene wird vernachlässigt",
      "Kreativität wird eingeschränkt",
      "Spontane Lösungen werden blockiert",
    ],
    "IMPULSIV-IMPULSIV": [
      "Qualitätsrisiken steigen massiv",
      "Reflexion fehlt komplett",
      "Blinde Flecken verstärken sich",
      "Fehleranfälligkeit nimmt exponentiell zu",
    ],
    "INTUITIV-INTUITIV": [
      "Entscheidungsblockaden",
      "Konfliktvermeidung wird chronisch",
      "Schwierige Themen werden dauerhaft aufgeschoben",
      "Ergebnisorientierung fehlt",
    ],
    "ANALYTISCH-ANALYTISCH": [
      "Innovation wird systematisch verhindert",
      "Veränderungen werden extrem verlangsamt",
      "Flexibilität fehlt komplett",
      "Übersteuerung durch doppelte Kontrolle",
    ],
    "MIX-IMPULSIV": ["Wahrnehmung als führungsschwach", "Wechselnde Impulse irritieren", "Fehlende Durchsetzung", "Richtungswechsel erzeugen Widerstand"],
    "MIX-INTUITIV": ["Wechselnde Prioritäten verunsichern", "Fehlende emotionale Konsistenz", "Bindungsverlust durch Unberechenbarkeit"],
    "MIX-ANALYTISCH": ["Inkonsistente Standards", "Qualitätslücken durch Flexibilität", "Fehlende Prozesstreue"],
    "IMPULSIV-MIX": ["Druck ohne Gegenpol", "Teile des Teams werden überrollt", "Widerstand in Teilen des Teams"],
    "INTUITIV-MIX": ["Endlosschleifen bei Abstimmung", "Fehlende Entscheidungskraft", "Konsens unmöglich ohne klare Struktur"],
    "ANALYTISCH-MIX": ["Übersteuerung wird wahrgenommen", "Teile des Teams fühlen sich eingeengt", "Inkonsistente Reaktion auf Vorgaben"],
    "MIX-MIX": ["Fehlende Vorhersagbarkeit", "Inkonsistente Führung", "Wechselnde Prioritäten erzeugen Unsicherheit", "Klare Handschrift fehlt"],
  };
  return catalog[domPair(domK, domT)]!;
}

function buildTopHebel(domK: DominanceType, domT: DominanceType): string[] {
  const catalog: Record<string, string[]> = {
    "ANALYTISCH-IMPULSIV": [
      "Entscheidungsfenster definieren (z.B. gleicher Tag)",
      "80/20-Standard festlegen",
      "Regelmässige Reviews für Priorisierung (alle 14 Tage)",
    ],
    "IMPULSIV-ANALYTISCH": [
      "Qualitäts-Gates vor kritischen Entscheidungen einführen",
      "Review-Rhythmus beibehalten",
      "Absicherungsstandards definieren",
    ],
    "IMPULSIV-INTUITIV": [
      "Wöchentliche Beziehungsrunde einführen",
      "Feedback-Routinen etablieren",
      "Entscheidungen transparent kommunizieren",
    ],
    "INTUITIV-IMPULSIV": [
      "Entscheidungsfristen verbindlich machen",
      "Ergebnis-KPIs definieren",
      "Klare Eskalationswege einrichten",
    ],
    "INTUITIV-ANALYTISCH": [
      "Prozess-Standards definieren",
      "Dialog vs. Vorgabe klar regeln",
      "Review-Format standardisieren",
    ],
    "ANALYTISCH-INTUITIV": [
      "Beziehungspflege ritualisieren",
      "Kommunikationsregeln festlegen",
      "Entscheidungszeitfenster setzen",
    ],
    "IMPULSIV-IMPULSIV": [
      "Qualitäts-Gates einbauen",
      "Reflexionsmomente institutionalisieren",
      "Externe Gegengewichte einplanen",
    ],
    "INTUITIV-INTUITIV": [
      "Entscheidungsfristen setzen",
      "Konfliktroutinen etablieren",
      "Ergebnisorientierung stärken",
    ],
    "ANALYTISCH-ANALYTISCH": [
      "Innovationsimpulse setzen",
      "Veränderungsgeschwindigkeit definieren",
      "Externe Perspektiven einplanen",
    ],
    "MIX-IMPULSIV": ["Klare Priorisierungslogik definieren", "Dominante Arbeitsweise als Standard setzen", "Entscheidungstempo-Regeln festlegen"],
    "MIX-INTUITIV": ["Beziehungspflege ritualisieren", "Verlässlichkeit durch feste Routinen", "Kommunikationsregeln etablieren"],
    "MIX-ANALYTISCH": ["Standards und Qualitäts-Gates klar definieren", "Entscheidungskriterien festlegen", "Prozessrahmen vor Flexibilität stellen"],
    "IMPULSIV-MIX": ["Teamstruktur klären", "Rollen explizit machen", "Entscheidungslogik vereinheitlichen"],
    "INTUITIV-MIX": ["Entscheidungsfristen setzen", "Verantwortlichkeiten definieren", "Ergebnisorientierung stärken"],
    "ANALYTISCH-MIX": ["Strukturrahmen klar aber flexibel", "Entscheidungsautonomie in Grenzen", "Standards minimal aber verbindlich"],
    "MIX-MIX": ["Feste Entscheidungsregeln definieren", "Prioritäten regelmässig reviewen", "Klare Verantwortungsstrukturen setzen"],
  };
  return catalog[domPair(domK, domT)]!;
}

function buildEskalationsrisiko(domK: DominanceType, domT: DominanceType, intensity: ShiftIntensity): EskalationsrisikoResult {
  const isHigh = intensity === "HOCH";
  const isSame = domK === domT;

  const level = isSame ? "Mittel" : (isHigh ? "Hoch" : "Moderat");

  const baseTriggers: string[] = isSame
    ? ["Fehlende Gegengewichte", "Blinde Flecken verstärken sich", "Einseitige Dynamik wird chronisch"]
    : ["Fehlende Entscheidungsgrenzen", "Unklare Prioritätensetzung", "Hohe Zielspannung", "Druck ohne definierte Zeitfenster"];

  const domKLabel = dominanceLabelDe(domK).toLowerCase();
  const descSame = `Bei fehlender Gegensteuerung verstärkt sich die ${domKLabel}e Einseitigkeit bis zur Dysfunktionalität.`;
  const descDiff = isHigh
    ? "In solchen Situationen kann die Führungskraft unbeabsichtigt in eine Übersteuerungsrolle geraten."
    : "Bei klaren Regeln bleibt das Risiko kontrollierbar.";

  return {
    level,
    triggers: baseTriggers,
    description: isSame ? descSame : descDiff,
  };
}

function buildSteuerbarkeit(domK: DominanceType, domT: DominanceType, intensity: ShiftIntensity): SteuerbarkeitResult {
  const isHigh = intensity === "HOCH";
  const isSame = domK === domT;

  const bewertung = isSame
    ? "Gut steuerbar, wenn bewusste Gegengewichte gesetzt werden."
    : isHigh
    ? "Trotz hoher Verschiebungsintensität gut steuerbar, wenn klare Regeln definiert werden."
    : "Gut steuerbar bei moderater Anpassung der Führungsroutinen.";

  const bedingungen: string[] = [
    "Entscheidungszeitfenster klar definiert sind",
    "80/20-Qualitätsstandards verbindlich festgelegt werden",
    "Verantwortlichkeiten eindeutig geregelt sind",
    "Regelmässige Review-Routinen etabliert werden",
  ];

  return { bewertung, bedingungen };
}

function buildGesamturteil(domK: DominanceType, domT: DominanceType, intensity: ShiftIntensity, isLeading: boolean): GesamturteilResult {
  const isHigh = intensity === "HOCH";
  const isSame = domK === domT;
  const domKLabel = dominanceLabelDe(domK);
  const domTLabel = dominanceLabelDe(domT);

  const badges: UrteilBadge[] = [];
  if (isSame) {
    badges.push("ENTWICKLUNGSFAEHIG");
  } else if (isHigh) {
    badges.push("STRATEGISCH_CHANCEN", "ENTWICKLUNGSFAEHIG");
  } else {
    badges.push("STRATEGISCH_CHANCEN");
  }

  const rolleLabel = isLeading ? "Führungskraft" : "Teammitglied";

  const einschaetzung = isSame
    ? `Strategisch nachvollziehbar – verstärkt bestehende ${domKLabel.toLowerCase()}e Stärken. Gegensteuerung erforderlich.`
    : isHigh
    ? `Strategisch sinnvoll – gut, steuerbar bei klaren Regeln.`
    : `Strategisch sinnvoll – ergänzt das bestehende Profil mit klarer Mehrwert.`;

  const eskalationsrisiko = isSame
    ? `Mittel – bei fehlenden Gegengewichten steigt Einseitigkeit.`
    : isHigh
    ? `Hoch bei fehlenden Entscheidungsgrenzen, unklarer Prioritätensetzung und hoher Zielspannung.`
    : `Moderat – bei klaren Regeln gut kontrollierbar.`;

  const risikoindikator = isSame
    ? `Moderates Risiko durch verstärkte Einseitigkeit ohne Korrekturmechanismen.`
    : isHigh
    ? `Akutes Risiko ohne klare Entscheidungsstruktur.`
    : `Niedriges Risiko bei aktiver Steuerung.`;

  const empfehlung = isSame
    ? `Besetzung möglich, wenn bewusste Gegengewichte und Diversitätsimpulse geplant werden.`
    : isHigh
    ? `Entwicklungspotenzial, bei klarer Strukturführung und aktiver Steuerung sinnvoll.`
    : `Empfehlenswert – die ${rolleLabel} ergänzt das System nachhaltig.`;

  return { badges, einschaetzung, eskalationsrisiko, risikoindikator, empfehlung };
}

function plainLabel(d: DominanceType): string {
  switch (d) {
    case "IMPULSIV": return "ergebnis- und umsetzungsorientiert";
    case "INTUITIV": return "beziehungs- und konsensorientiert";
    case "ANALYTISCH": return "struktur- und prüfungsorientiert";
    case "MIX": return "breit aufgestellt, ohne klare Einzeldominanz";
  }
}

function plainShort(d: DominanceType): string {
  switch (d) {
    case "IMPULSIV": return "Umsetzungsfokus";
    case "INTUITIV": return "Beziehungsfokus";
    case "ANALYTISCH": return "Strukturfokus";
    case "MIX": return "Situativer Fokus";
  }
}

function plainAdj(d: DominanceType): string {
  switch (d) {
    case "IMPULSIV": return "umsetzungsorientiert";
    case "INTUITIV": return "beziehungsorientiert";
    case "ANALYTISCH": return "strukturorientiert";
    case "MIX": return "situativ anpassend";
  }
}

export type ReportSection = {
  num: number;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: { title: string; paragraphs?: string[]; bullets?: string[]; highlight?: string }[];
};

export function generateDetailReport(input: TeamCheckInput, result: TeamCheckResult): ReportSection[] {
  const nKandidat = normalizeTriad(input.kandidat);
  const nTeam = normalizeTriad(input.team);
  const domK = dominanceType(nKandidat);
  const domT = dominanceType(nTeam);
  const delta = computeDelta(nKandidat, nTeam);
  const intensity = computeIntensitaet(delta);
  const rolleNom = input.isLeading ? "die Führungskraft" : "das neue Teammitglied";
  const rolleGen = input.isLeading ? "der Führungskraft" : "des neuen Teammitglieds";
  const rolleDat = input.isLeading ? "der Führungskraft" : "dem neuen Teammitglied";
  const rolleAkk = input.isLeading ? "die Führungskraft" : "das neue Teammitglied";
  const rolleLabel = input.isLeading ? "Führungskraft" : "neues Teammitglied";
  const rolleAdj = input.isLeading ? "Führungsposition" : "Stelle";
  const beruf = input.beruf || "die offene Rolle";
  const kLabel = plainLabel(domK);
  const tLabel = plainLabel(domT);
  const kShort = plainShort(domK);
  const tShort = plainShort(domT);
  const intensityLabel = intensity === "HOCH" ? "hoch" : intensity === "MITTEL" ? "mittel" : "gering";

  const sections: ReportSection[] = [];

  sections.push({
    num: 1,
    title: "Ziel dieses Berichts",
    paragraphs: [
      `Dieser Bericht bewertet, wie sich die Besetzung der ${rolleAdj} „${beruf}" auf das bestehende Team auswirken wird.`,
      "Im Mittelpunkt steht nicht die Persönlichkeit, sondern die Frage:",
    ],
    bullets: [
      "Wie verändert sich das System?",
      "Welche Spannungen entstehen?",
      "Wo liegen Chancen?",
      "Wie steuerbar ist die Konstellation?",
      `Was bedeutet das konkret für ${rolleAkk} im Alltag?`,
    ],
  });

  sections.push({
    num: 2,
    title: "Ausgangslage",
    subsections: [
      {
        title: "Rollenanforderung",
        paragraphs: [
          `Die Rolle „${beruf}" verlangt:`,
        ],
        bullets: input.isLeading ? [
          "klare Ergebnisverantwortung",
          "operative Steuerung",
          "strukturierte Entscheidungsfindung",
          "Führung eines leistungsorientierten Teams",
        ] : [
          "klare Ergebnisverantwortung",
          "operative Mitarbeit",
          "strukturierte Zusammenarbeit",
          "verlässlichen Beitrag zum Teamergebnis",
        ],
      },
      {
        title: `Profil ${rolleGen}`,
        paragraphs: [
          `${rolleNom.charAt(0).toUpperCase() + rolleNom.slice(1)} ist stark ${kLabel}.`,
          "Das bedeutet:",
        ],
        bullets: domK === "ANALYTISCH" ? [
          "Entscheidungen werden sorgfältig geprüft",
          "Risiken werden bewusst abgewogen",
          "Prozesse sollen nachvollziehbar und stabil sein",
          "Qualität hat hohen Stellenwert",
          "Tempo entsteht nicht aus Impuls, sondern aus Klarheit.",
        ] : domK === "IMPULSIV" ? [
          "Entscheidungen werden schnell und direkt getroffen",
          "Umsetzung steht im Vordergrund",
          "Geschwindigkeit ist wichtiger als Perfektion",
          "Ergebnisse zählen mehr als Prozesse",
          "Tempo entsteht aus Handlungsdrang und Zielorientierung.",
        ] : domK === "INTUITIV" ? [
          "Entscheidungen werden im Dialog entwickelt",
          "Beziehungen und Zusammenarbeit stehen im Vordergrund",
          "Konsens wird aktiv angestrebt",
          "Teamstimmung hat hohen Stellenwert",
          "Tempo entsteht aus gemeinsamer Überzeugung.",
        ] : [
          "Entscheidungen werden situativ getroffen",
          "Keine einzelne Arbeitslogik dominiert dauerhaft",
          "Flexibilität steht im Vordergrund",
          "Anpassungsfähigkeit ist eine Stärke, kann aber als Unberechenbarkeit wirken.",
        ],
      },
      {
        title: "Profil des bestehenden Teams",
        paragraphs: [
          `Das Team ist überwiegend ${tLabel}.`,
          "Das bedeutet:",
        ],
        bullets: domT === "IMPULSIV" ? [
          "Entscheidungen werden schnell getroffen",
          "Umsetzung steht im Vordergrund",
          "Pragmatismus ist wichtiger als Perfektion",
          "Dynamik wird geschätzt",
          "Das Team arbeitet direkt und handlungsorientiert.",
        ] : domT === "ANALYTISCH" ? [
          "Entscheidungen werden sorgfältig geprüft",
          "Struktur und Qualität stehen im Vordergrund",
          "Prozesse müssen nachvollziehbar sein",
          "Absicherung hat Vorrang vor Geschwindigkeit",
          "Das Team arbeitet planvoll und qualitätsbewusst.",
        ] : domT === "INTUITIV" ? [
          "Entscheidungen werden im Konsens getroffen",
          "Teamzusammenhalt und Beziehungen stehen im Vordergrund",
          "Dialog und Abstimmung sind wichtiger als schnelle Ergebnisse",
          "Das Team arbeitet kooperativ und empathisch.",
        ] : [
          "Das Team hat keine klare dominante Arbeitsweise",
          "Entscheidungen werden situativ getroffen",
          "Flexibilität, aber auch Orientierungsbedarf prägen den Alltag.",
        ],
      },
    ],
  });

  const isVerstaerkung = result.diagnose.verschiebung === "VERSTAERKUNG";
  sections.push({
    num: 3,
    title: "Zentrale Verschiebung",
    paragraphs: [
      `Mit ${rolleDat} trifft eine ${plainAdj(domK)}e Arbeitsweise auf ein ${plainAdj(domT)}es System.`,
      "Diese Konstellation erzeugt eine " + (isVerstaerkung ? "Verstärkung der bestehenden Dynamik." : `deutliche Verschiebung im Entscheidungs- und Arbeitsrhythmus.`),
      `Die Intensität dieser Verschiebung ist ${intensityLabel}.`,
    ],
    subsections: [{
      title: "",
      highlight: isVerstaerkung
        ? "Das ist eine Verstärkung, kein Spannungsfall. Es bedeutet jedoch, dass Gegengewichte bewusst gesetzt werden müssen."
        : input.isLeading
          ? "Das ist kein grundsätzliches Problem. Es bedeutet jedoch, dass Führung aktiv gestaltet werden muss."
          : "Das ist kein grundsätzliches Problem. Es bedeutet jedoch, dass die Integration aktiv begleitet werden muss.",
    }],
  });

  sections.push({
    num: 4,
    title: "Systemwirkung",
    subsections: [
      {
        title: "Veränderung der Entscheidungslogik",
        paragraphs: [
          `Bisher: ${result.systemwirkung.entscheidungslogik.bisher}`,
          `Mit ${rolleDat}: ${result.systemwirkung.entscheidungslogik.mitNeu}`,
        ],
        bullets: [
          ...result.systemwirkung.prozessWirkung.positiv.map(p => `✓ ${p}`),
          ...result.systemwirkung.prozessWirkung.negativ.map(n => `⚠ ${n}`),
        ],
      },
      {
        title: "Veränderung von Prioritäten",
        paragraphs: [
          `Das Team priorisiert bisher: ${tShort}.`,
          `${rolleNom.charAt(0).toUpperCase() + rolleNom.slice(1)} priorisiert: ${kShort}.`,
          domK === domT
            ? "Das verstärkt bestehende Stärken, aber auch bestehende blinde Flecken."
            : "Das verändert die Reihenfolge von Aufgaben, die Tiefe der Vorbereitung und den Umgang mit Unsicherheit.",
          "Wenn diese Prioritäten nicht klar kommuniziert werden, entsteht Frustration.",
        ],
      },
      {
        title: "Prozess- und Qualitätsauswirkungen",
        paragraphs: ["Positive Effekte:"],
        bullets: [
          ...result.systemwirkung.qualitaetsWirkung.positiv.map(p => `✓ ${p}`),
          ...result.systemwirkung.qualitaetsWirkung.negativ.map(n => `⚠ ${n}`),
        ],
      },
    ],
  });

  sections.push({
    num: 5,
    title: "Verhalten unter Druck",
    paragraphs: [
      result.stressprofil.normalState,
      "Wenn Stress jedoch nicht mehr kontrollierbar wird — etwa bei starkem Zeitdruck oder hohem Zielstress — verändert sich das Verhalten spürbar.",
      "Typische Reaktionen können sein:",
    ],
    bullets: result.stressprofil.unkontrolliert,
    subsections: [{
      title: "",
      paragraphs: [
        result.stressprofil.zweitKomponente,
        `Für ${rolleAkk} bedeutet das:`,
      ],
      highlight: result.stressprofil.steuerung,
    }],
  });

  sections.push({
    num: 6,
    title: "Entwicklung in den ersten 90 Tagen",
    subsections: result.prognose.phases.map((phase, i) => ({
      title: phase.label,
      paragraphs: [phase.description],
      bullets: phase.bullets,
    })),
  });

  sections.push({
    num: 7,
    title: "Zentrale Chancen",
    bullets: result.handlungsempfehlungen.kernchancen,
    paragraphs: [
      "Diese Konstellation kann das Team langfristig stärker machen.",
    ],
  });

  sections.push({
    num: 8,
    title: "Zentrale Risiken",
    bullets: result.handlungsempfehlungen.kernrisiken,
    paragraphs: [
      "Diese Risiken sind steuerbar — aber nicht von selbst.",
    ],
  });

  sections.push({
    num: 9,
    title: input.isLeading ? "Führungsverantwortung" : "Verantwortung im Team",
    paragraphs: [
      `${rolleNom.charAt(0).toUpperCase() + rolleNom.slice(1)} trägt eine klare Verantwortung${input.isLeading ? "" : " im Team"}:`,
    ],
    bullets: result.handlungsempfehlungen.topHebel,
    subsections: [{
      title: "",
      highlight: input.isLeading
        ? (domK === domT
          ? "Führung bedeutet hier: Gegengewichte setzen, ohne die eigene Stärke zu verlieren."
          : "Führung bedeutet hier: Struktur geben, ohne Dynamik zu ersticken.")
        : (domK === domT
          ? "Integration bedeutet hier: eigene Stärken einbringen, ohne die Teambalance zu gefährden."
          : "Integration bedeutet hier: die eigene Arbeitsweise mit dem Team abstimmen, ohne sich zu verlieren."),
    }],
  });

  sections.push({
    num: 10,
    title: "90-Tage-Integrationsplan",
    subsections: input.isLeading ? [
      {
        title: "Phase 1 – Orientierung (Tag 1–30)",
        paragraphs: ["Ziel: Das System verstehen und klare Spielregeln definieren."],
        bullets: [
          "Einzelgespräche mit allen Teammitgliedern",
          "Analyse der bestehenden Entscheidungswege",
          "Klärung operativer Kernprozesse",
          "Definition klarer Entscheidungszeitfenster",
          "Einführung eines einfachen Entscheidungsmodells",
          "Festlegung von Verantwortlichkeiten",
          "Definition von Qualitätsstandards",
          "Transparente Kommunikation der eigenen Führungslogik",
          "Einführung eines regelmässigen Priorisierungsformats",
          "Dokumentation aller vereinbarten Regeln",
        ],
      },
      {
        title: "Phase 2 – Wirkung (Tag 31–60)",
        paragraphs: ["Ziel: Struktur sichtbar wirksam machen."],
        bullets: [
          "Auswahl eines priorisierten Kernprojekts",
          "Strukturierte Analyse dieses Projekts",
          "Einführung klarer Qualitäts-Gates",
          "Reduktion unnötiger Prüfschleifen",
          "Messung von Entscheidungsdauer",
          "Definition klarer Eskalationsregeln",
          "Feedbackgespräche zur Wahrnehmung der Führung",
          "Anpassung der Kontrolltiefe",
          "Sichtbare Kommunikation erster Verbesserungen",
          "Klare Priorisierung laufender Themen",
        ],
      },
      {
        title: "Phase 3 – Stabilisierung (Tag 61–90)",
        paragraphs: ["Ziel: Balance zwischen Tempo und Qualität herstellen."],
        bullets: [
          "KPI-Review",
          "Analyse von Durchlaufzeiten",
          "Analyse von Fehlerquoten",
          "Bewertung der Teamzufriedenheit",
          "Reduktion überflüssiger Kontrollen",
          "Feinjustierung der Entscheidungslogik",
          "Verstetigung des Review-Rhythmus",
          "Offene Feedbackrunde",
          "Klare Definition langfristiger Prioritäten",
          "Persönliche Selbstreflexion der Führungskraft",
        ],
      },
    ] : [
      {
        title: "Phase 1 – Ankommen (Tag 1–30)",
        paragraphs: ["Ziel: Das Team kennenlernen und die eigene Rolle klären."],
        bullets: [
          "Kennenlerngespräche mit allen Teammitgliedern",
          "Bestehende Arbeitsweisen beobachten und verstehen",
          "Eigene Aufgaben und Verantwortlichkeiten klären",
          "Absprachen zu Zusammenarbeit und Erreichbarkeit treffen",
          "Einarbeitung in laufende Prozesse",
          "Dokumentation eigener Beobachtungen",
          "Rückfragen aktiv stellen",
          "Eigene Stärken sichtbar einbringen",
        ],
      },
      {
        title: "Phase 2 – Beitragen (Tag 31–60)",
        paragraphs: ["Ziel: Sichtbar zum Teamergebnis beitragen."],
        bullets: [
          "Übernahme eines eigenen Verantwortungsbereichs",
          "Aktive Beteiligung an Teamentscheidungen",
          "Feedback einholen zur eigenen Wirkung",
          "Zusammenarbeit mit Kernkollegen vertiefen",
          "Qualität der eigenen Arbeit sicherstellen",
          "Verbesserungsvorschläge einbringen",
          "Eigene Arbeitsweise an das Team anpassen",
        ],
      },
      {
        title: "Phase 3 – Etablieren (Tag 61–90)",
        paragraphs: ["Ziel: Fester Bestandteil des Teams werden."],
        bullets: [
          "Eigenständige Arbeitsweise zeigen",
          "Ergebnisse sichtbar machen",
          "Teamzufriedenheit reflektieren",
          "Langfristige Zusammenarbeit klären",
          "Offenes Feedback geben und nehmen",
          "Eigene Entwicklungsfelder identifizieren",
          "Verlässlichkeit im Alltag zeigen",
        ],
      },
    ],
  });

  sections.push({
    num: 11,
    title: "Gesamtbewertung",
    paragraphs: [
      result.gesamturteil.einschaetzung,
      `Die Konstellation ist ${intensity === "HOCH" ? "anspruchsvoll" : "gut handhabbar"}, aber ${intensity === "NIEDRIG" ? "unkritisch" : "steuerbar"}.`,
      input.isLeading
        ? "Voraussetzung ist eine Führungskraft, die:"
        : "Voraussetzung ist ein Teammitglied, das:",
    ],
    bullets: result.handlungsempfehlungen.topHebel,
    subsections: [{
      title: "",
      highlight: input.isLeading
        ? "Mit aktiver Führung entsteht ein leistungsstarkes, stabiles System."
        : "Mit guter Integration entsteht ein leistungsstarkes, stabiles Team.",
    }],
  });

  return sections;
}

export type ExecutivePage = {
  pageNum: number;
  title: string;
  sections: { title: string; paragraphs?: string[]; bullets?: string[]; highlight?: string }[];
};

export function generateExecutiveReport(input: TeamCheckInput, result: TeamCheckResult): ExecutivePage[] {
  const nKandidat = normalizeTriad(input.kandidat);
  const nTeam = normalizeTriad(input.team);
  const domK = dominanceType(nKandidat);
  const domT = dominanceType(nTeam);
  const delta = computeDelta(nKandidat, nTeam);
  const intensity = computeIntensitaet(delta);
  const rolleNom = input.isLeading ? "die neue Führungskraft" : "das neue Teammitglied";
  const rolleDat = input.isLeading ? "der neuen Führungskraft" : "dem neuen Teammitglied";
  const beruf = input.beruf || "die offene Rolle";
  const kLabel = plainLabel(domK);
  const tLabel = plainLabel(domT);

  const page1: ExecutivePage = {
    pageNum: 1,
    title: `Executive Summary – ${beruf}`,
    sections: [
      {
        title: "Ausgangslage",
        paragraphs: [
          `${rolleNom.charAt(0).toUpperCase() + rolleNom.slice(1)} ist stark ${kLabel}.`,
          `Das bestehende Team arbeitet überwiegend ${tLabel}.`,
          domK === domT
            ? "Es entsteht eine Verstärkung der bestehenden Arbeitslogik."
            : `Es entsteht eine deutliche strukturelle Verschiebung: Von ${plainShort(domT)} hin zu ${plainShort(domK)}.`,
        ],
      },
      {
        title: "Zentrale Wirkung",
        paragraphs: [
          `Entscheidungen werden ${domK === "ANALYTISCH" ? "strukturierter, stärker geprüft und dokumentiert" : domK === "IMPULSIV" ? "schneller, direkter und ergebnisorientierter" : domK === "INTUITIV" ? "dialogischer, konsensorientierter und stärker abgestimmt" : "situativer und weniger vorhersagbar"}.`,
          domK === domT
            ? "Bestehende Stärken werden verstärkt, aber auch bestehende Schwächen."
            : `Das System verschiebt sich von „${plainShort(domT)}" zu „${plainShort(domK)}".`,
        ],
        bullets: [
          ...result.systemwirkung.prozessWirkung.positiv.slice(0, 3).map(p => `✓ ${p}`),
          ...result.systemwirkung.prozessWirkung.negativ.slice(0, 2).map(n => `⚠ ${n}`),
        ],
      },
      {
        title: "Verhalten unter Druck",
        paragraphs: [
          "Solange Belastung kontrollierbar ist, ergänzt die neue Arbeitsweise das System sinnvoll.",
          "Wenn Stress jedoch hoch wird (Zieldruck, Zeitdruck, Konflikte):",
        ],
        bullets: result.stressprofil.unkontrolliert.slice(0, 3),
      },
      {
        title: "Chancen",
        bullets: result.handlungsempfehlungen.kernchancen,
      },
      {
        title: "Risiken",
        bullets: result.handlungsempfehlungen.kernrisiken,
        paragraphs: ["Diese Risiken sind steuerbar – aber nicht automatisch."],
      },
      {
        title: "Gesamtbewertung",
        paragraphs: [
          `Die Konstellation ist ${intensity === "HOCH" ? "anspruchsvoll" : "gut handhabbar"}, aber strategisch sinnvoll.`,
        ],
        highlight: `Voraussetzung: ${result.handlungsempfehlungen.topHebel.slice(0, 2).join(" und ")}.`,
      },
    ],
  };

  const page2: ExecutivePage = {
    pageNum: 2,
    title: input.isLeading ? "Steuerbarkeit, Prognose und 90-Tage-Führungsauftrag" : "Steuerbarkeit, Prognose und 90-Tage-Integrationsplan",
    sections: [
      {
        title: "Prognose",
        paragraphs: [
          `0–30 Tage: ${result.prognose.phases[0]?.description || "Anpassungsphase."}`,
          `30–90 Tage: ${result.prognose.phases[1]?.description || "Stabilisierungsphase."}`,
          `Nach 90 Tagen: ${result.prognose.phases[2]?.description || "Reifephase."}`,
        ],
      },
      {
        title: "Messbare Steuerungsindikatoren",
        paragraphs: ["Zur objektiven Bewertung:"],
        bullets: [
          "Durchschnittliche Entscheidungsdauer",
          "Fehlerquote / Reklamationen",
          "Anzahl Eskalationen",
          "Einhaltung definierter Zeitfenster",
        ],
      },
      {
        title: input.isLeading ? "Führungsauftrag" : "Integrationsauftrag",
        paragraphs: [`${rolleNom.charAt(0).toUpperCase() + rolleNom.slice(1)} muss:`],
        bullets: result.handlungsempfehlungen.topHebel,
      },
      {
        title: "90-Tage-Plan (kompakt)",
        paragraphs: [
          ...(input.isLeading ? [
            "Phase 1 – Orientierung (Tag 1–30): Entscheidungswege analysieren, Verantwortlichkeiten klären, Zeitfenster definieren, Führungsprinzipien transparent machen.",
            "Phase 2 – Wirksamkeit (Tag 31–60): Einen Kernprozess strukturieren, Qualitäts-Gates einführen, Entscheidungsdauer messen, Feedback einholen.",
            "Phase 3 – Stabilisierung (Tag 61–90): KPI-Review, Kontrolltiefe anpassen, Tempo-Qualitäts-Balance justieren, Teamfeedback integrieren.",
          ] : [
            "Phase 1 – Ankommen (Tag 1–30): Team kennenlernen, Arbeitsweisen beobachten, eigene Rolle klären, Absprachen treffen.",
            "Phase 2 – Beitragen (Tag 31–60): Eigenen Verantwortungsbereich übernehmen, Feedback einholen, Zusammenarbeit vertiefen.",
            "Phase 3 – Etablieren (Tag 61–90): Eigenständigkeit zeigen, Ergebnisse sichtbar machen, langfristige Zusammenarbeit klären.",
          ]),
        ],
      },
      {
        title: "Abschliessendes Urteil",
        paragraphs: [result.gesamturteil.einschaetzung],
        highlight: input.isLeading
          ? "Bei aktiver Führung entsteht ein leistungsfähigeres, strukturierteres System. Ohne klare Rahmensetzung entsteht Spannungsdynamik."
          : "Bei guter Integration entsteht ein stärkeres, stabileres Team. Ohne aktive Einbindung entsteht Reibung.",
      },
    ],
  };

  return [page1, page2];
}

export function computeTeamCheck(input: TeamCheckInput): TeamCheckResult {
  const nKandidat = normalizeTriad(input.kandidat);
  const nTeam = normalizeTriad(input.team);
  const nSoll = normalizeTriad(input.soll);
  const domK = dominanceType(nKandidat);
  const domT = dominanceType(nTeam);
  const domS = dominanceType(nSoll);
  const delta = computeDelta(nKandidat, nTeam);
  const versch = computeVerschiebung(domK, domT, delta);
  const intensity = computeIntensitaet(delta);

  const diagnose: DiagnoseResult = {
    sollDominanz: dominanceLabelDe(domS),
    kandidatDominanz: dominanceLabelDe(domK),
    teamDominanz: dominanceLabelDe(domT),
    dominanzstruktur: `${dominanceLabelDe(domK)} ↔ ${dominanceLabelDe(domT)}`,
    deltaWert: delta,
    verschiebung: versch.type,
    verschiebungLabel: versch.label,
    intensitaet: intensity,
    verschiebungBeschreibung: SYSTEMWIRKUNG_HEADLINES[domPair(domK, domT)] || "Die Profilkombination erfordert situative Anpassung.",
  };

  const headline = SYSTEMWIRKUNG_HEADLINES[domPair(domK, domT)] || "Die Profilkombination erfordert situative Anpassung.";

  const systemwirkung: SystemwirkungResult = {
    headline,
    entscheidungslogik: buildEntscheidungslogik(domK, domT, input.isLeading),
    prozessWirkung: buildProzessWirkung(domK, domT),
    qualitaetsWirkung: buildQualitaetsWirkung(domK, domT),
  };

  const stressprofil = buildStressprofil(domK, nKandidat);
  const prognose = buildPrognose(domK, domT, intensity);

  const handlungsempfehlungen: HandlungsempfehlungenResult = {
    kernchancen: buildKernchancen(domK, domT),
    kernrisiken: buildKernrisiken(domK, domT),
    topHebel: buildTopHebel(domK, domT),
  };

  const eskalationsrisiko = buildEskalationsrisiko(domK, domT, intensity);
  const steuerbarkeit = buildSteuerbarkeit(domK, domT, intensity);
  const gesamturteil = buildGesamturteil(domK, domT, intensity, input.isLeading);

  return {
    diagnose,
    systemwirkung,
    stressprofil,
    prognose,
    handlungsempfehlungen,
    eskalationsrisiko,
    steuerbarkeit,
    gesamturteil,
  };
}
