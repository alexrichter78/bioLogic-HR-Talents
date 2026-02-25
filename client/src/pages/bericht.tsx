import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, Briefcase, Heart, Shield, AlertTriangle, FileText, Lightbulb, CheckCircle2, Check, Users } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };

type BG = { imp: number; int: number; ana: number };

function calcBioGram(taetigkeiten: any[]): BG {
  if (!taetigkeiten.length) return { imp: 33.3, int: 33.3, ana: 33.4 };
  const weights: Record<string, number> = { Niedrig: 1, Mittel: 2, Hoch: 3 };
  let sI = 0, sN = 0, sA = 0;
  for (const t of taetigkeiten) {
    const w = weights[t.niveau] || 1;
    if (t.kompetenz === "Impulsiv") sI += w;
    else if (t.kompetenz === "Intuitiv") sN += w;
    else sA += w;
  }
  const total = sI + sN + sA;
  if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  return roundBG((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
}

function roundBG(a: number, b: number, c: number): BG {
  const raw = [a, b, c];
  const floored = raw.map(Math.floor);
  let remainder = 100 - floored.reduce((s, v) => s + v, 0);
  const fracs = raw.map((v, i) => ({ i, f: v - floored[i] })).sort((a, b) => b.f - a.f);
  for (const f of fracs) { if (remainder <= 0) break; floored[f.i]++; remainder--; }
  return { imp: floored[0], int: floored[1], ana: floored[2] };
}

function computeGesamt(haupt: BG, neben: BG, fuehrung: BG, rahmen: BG): BG {
  const all = [haupt, neben, fuehrung, rahmen];
  let vals = [
    all.reduce((s, g) => s + g.imp, 0) / 4,
    all.reduce((s, g) => s + g.int, 0) / 4,
    all.reduce((s, g) => s + g.ana, 0) / 4,
  ];
  const CAP = 53;
  let changed = true;
  while (changed) {
    changed = false;
    const capped: number[] = [], uncapped: number[] = [];
    vals.forEach((v, i) => { if (v > CAP) capped.push(i); else uncapped.push(i); });
    if (capped.length > 0 && uncapped.length > 0) {
      let excess = 0;
      for (const i of capped) { excess += vals[i] - CAP; vals[i] = CAP; }
      const uT = uncapped.reduce((s, i) => s + vals[i], 0);
      if (uT > 0) for (const i of uncapped) vals[i] += excess * (vals[i] / uT);
      changed = true;
    }
  }
  return roundBG(vals[0], vals[1], vals[2]);
}

function computeRahmen(state: any): BG {
  let sI = 0, sN = 0, sA = 0;
  const f = state.fuehrung || "";
  if (f === "Fachliche Führung") sA += 1;
  else if (f === "Projekt-/Teamkoordination") sN += 1;
  else if (f.startsWith("Disziplinarische")) sI += 1;
  for (const idx of (state.erfolgsfokusIndices || [])) {
    if (idx === 0 || idx === 2) sI += 1;
    else if (idx === 1 || idx === 5) sN += 1;
    else if (idx === 3 || idx === 4) sA += 1;
  }
  if (state.aufgabencharakter === "überwiegend operativ") sI += 1;
  else if (state.aufgabencharakter === "überwiegend systemisch") sN += 1;
  else if (state.aufgabencharakter === "überwiegend strategisch") sA += 1;
  if (state.arbeitslogik === "Umsetzungsorientiert") sI += 1;
  else if (state.arbeitslogik === "Menschenorientiert") sN += 1;
  else if (state.arbeitslogik === "Daten-/prozessorientiert") sA += 1;
  const total = sI + sN + sA;
  if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  return roundBG((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
}

type ProfileType = "balanced_all" | "strong_imp" | "strong_ana" | "strong_int" |
  "dominant_imp" | "dominant_ana" | "dominant_int" |
  "light_imp" | "light_ana" | "light_int" |
  "hybrid_imp_ana" | "hybrid_ana_int" | "hybrid_imp_int";

type Intensity = "strong" | "clear" | "light" | "balanced";

function classifyProfile(bg: BG): { type: ProfileType; intensity: Intensity; top1: string; top2: string } {
  const vals = [
    { key: "imp", value: bg.imp },
    { key: "int", value: bg.int },
    { key: "ana", value: bg.ana },
  ].sort((a, b) => b.value - a.value);
  const [max, second, third] = vals;
  const gap12 = max.value - second.value;
  const gap23 = second.value - third.value;
  const abII = Math.abs(bg.imp - bg.int);
  const abIA = Math.abs(bg.imp - bg.ana);
  const abNA = Math.abs(bg.int - bg.ana);

  if (abII <= 6 && abIA <= 6 && abNA <= 6) {
    return { type: "balanced_all", intensity: "balanced", top1: "none", top2: "none" };
  }
  if (max.value >= 55) {
    return { type: `strong_${max.key}` as ProfileType, intensity: "strong", top1: max.key, top2: second.key };
  }
  if (gap12 >= 8) {
    return { type: `dominant_${max.key}` as ProfileType, intensity: "clear", top1: max.key, top2: second.key };
  }
  if (gap12 <= 5 && gap23 > 5) {
    const k1 = max.key, k2 = second.key;
    const hybridKey = `hybrid_${k1}_${k2}`;
    const validHybrids = ["hybrid_imp_ana", "hybrid_ana_int", "hybrid_imp_int"];
    const reverseMap: Record<string, string> = {
      "hybrid_ana_imp": "hybrid_imp_ana",
      "hybrid_int_ana": "hybrid_ana_int",
      "hybrid_int_imp": "hybrid_imp_int",
    };
    const resolved = validHybrids.includes(hybridKey) ? hybridKey : (reverseMap[hybridKey] || "hybrid_imp_ana");
    return { type: resolved as ProfileType, intensity: "clear", top1: k1, top2: k2 };
  }
  if (gap12 >= 5) {
    return { type: `light_${max.key}` as ProfileType, intensity: "light", top1: max.key, top2: second.key };
  }
  return { type: "balanced_all", intensity: "balanced", top1: "none", top2: "none" };
}

interface OverweightEffect {
  label: string;
  color: string;
  bullets: string[];
  text: string;
}

interface ReportTexts {
  intro: string;
  overall: string;
  tasks: string;
  human: string;
  leadership_section?: string;
  overweight: OverweightEffect[];
  conclusion: string;
}

function getReportTexts(roleTitle: string, isLeadership: boolean, profileType: ProfileType, intensity: Intensity): ReportTexts {
  const r = (s: string) => s.replace(/\{\{roleTitle\}\}/g, roleTitle);

  const allTexts: Record<string, { noLeadership: any; leadership: any }> = {
    balanced_all: {
      noLeadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Rolle {{roleTitle}}. Er zeigt, wie Entscheidungen vorbereitet werden, wie Zusammenarbeit stattfindet und wie stark Struktur im Arbeitsalltag gefordert ist."),
        overall: "Das Rollenbild ist ausgewogen. Die Funktion verlangt sowohl verlässliche Organisation als auch passende Abstimmung im Umfeld. Umsetzung ist notwendig, ohne dass Geschwindigkeit allein zum Treiber wird.",
        tasks: "Die Aufgaben verbinden geordnete Arbeitsweise mit situationsgerechter Abstimmung. Es geht darum, zuverlässig zu liefern und gleichzeitig anschlussfähig im Arbeitskontext zu bleiben.",
        human: "Gefordert ist ein ruhiges, strukturiertes Vorgehen mit der Fähigkeit, unterschiedliche Anforderungen einzuordnen und sauber zu priorisieren.",
        overweight: {
          structure_over: { bullets: ["Entscheidungen werden stärker geprüft", "Detailtiefe nimmt zu", "Anpassungsfähigkeit sinkt", "Abstimmung tritt in den Hintergrund"], text: "Im Alltag bleibt die Arbeit sauber und korrekt, jedoch sinkt die Beweglichkeit in wechselnden Situationen." },
          collaboration_over: { bullets: ["Abstimmung wird priorisiert", "Prioritäten werden situativ angepasst", "Verbindlichkeit kann abnehmen", "Struktur verliert an Schärfe"], text: "Im Alltag funktioniert das Miteinander, gleichzeitig kann Klarheit in Planung und Zuständigkeit nachlassen." },
          speed_over: { bullets: ["Entscheidungen werden beschleunigt", "Prozesse werden verkürzt", "Prioritäten wechseln häufiger", "Absicherung nimmt ab"], text: "Im Alltag steigt die Dynamik, während Ordnung und Abstimmung an Stabilität verlieren können." },
        },
        conclusion: "Die Rolle ist auf Balance angelegt. Sie verlangt klare Organisation, saubere Abstimmung und verlässliche Umsetzung im gleichen Maß.",
      },
      leadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Führungsrolle {{roleTitle}}. Er zeigt, wie Ziele gesetzt, Entscheidungen getroffen und Zusammenarbeit im Team gestaltet werden."),
        overall: "Das Rollenbild ist ausgewogen. Die Führungsaufgabe verlangt Orientierung über Struktur, Stabilität in der Zusammenarbeit und verlässliche Umsetzung im Alltag.",
        tasks: "Die Aufgaben verbinden Steuerung über klare Abläufe mit ausreichender Anpassungsfähigkeit. Entscheidungen müssen tragfähig sein und zugleich im Umfeld funktionieren.",
        human: "Gefordert ist ein klarer Kopf unter Druck, saubere Priorisierung und die Fähigkeit, unterschiedliche Erwartungen zu ordnen, ohne an Verbindlichkeit zu verlieren.",
        leadership_section: "Führung entsteht hier durch Klarheit und Verlässlichkeit. Ziele werden eindeutig, Entscheidungen nachvollziehbar, Verantwortung wird sauber verteilt.",
        overweight: {
          speed_over: { bullets: ["Druck im Team steigt", "Abstimmung wird verkürzt", "Prioritäten wechseln häufiger", "Fehlsteuerung nimmt zu"], text: "Im Alltag entsteht Tempo, gleichzeitig sinkt die Stabilität in Richtung und Verantwortlichkeit." },
          structure_over: { bullets: ["Entscheidungen werden verzögert", "Kontrolle nimmt zu", "Reaktionsgeschwindigkeit sinkt", "Chancen werden später genutzt"], text: "Im Alltag steigt die Absicherung, jedoch verliert die Führung an Dynamik." },
          collaboration_over: { bullets: ["Konsens wird priorisiert", "Konflikte werden vertagt", "Leistungsorientierung verwässert", "Verbindlichkeit nimmt ab"], text: "Im Alltag bleibt das Klima stabil, jedoch sinkt die Klarheit in Ziel und Konsequenz." },
        },
        conclusion: "Die Führungsrolle verlangt Balance. Sie verbindet klare Steuerung, stabile Zusammenarbeit und verlässliche Umsetzung.",
      },
    },
    strong_imp: {
      noLeadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Rolle {{roleTitle}}. Im Mittelpunkt steht, wie konsequent umgesetzt wird, wie entschieden wird und wie stark Ziele den Alltag bestimmen."),
        overall: "Die Rolle ist klar auf Ergebnis und Umsetzung ausgerichtet. Entscheidungen werden getroffen und verfolgt. Struktur unterstützt die Zielerreichung, bleibt aber Mittel zum Zweck. Zusammenarbeit ist vorhanden, jedoch nicht der Haupttreiber der Funktion.",
        tasks: "Die Aufgaben sind stark handlungsorientiert. Es geht um Tempo, Konsequenz und Nachverfolgung. Planung dient der Steuerung, nicht der Absicherung.",
        human: "Gefordert sind Entschlossenheit, Verantwortungsübernahme und ein klarer Fokus auf Ergebnisse. Prioritäten werden gesetzt und gehalten.",
        overweight: {
          speed_over: { bullets: ["Prozesse werden verkürzt", "Absicherung sinkt", "Prioritäten wechseln häufiger", "Nacharbeit nimmt zu"], text: "Im Alltag steigt die Geschwindigkeit, gleichzeitig sinkt die Verlässlichkeit in Qualität und Abstimmung." },
          structure_over: { bullets: ["Entscheidungen werden verzögert", "Dynamik sinkt", "Handlungsspielraum wird enger", "Chancen werden später genutzt"], text: "Im Alltag steigt die Ordnung, gleichzeitig verliert die Rolle an Schlagkraft." },
          collaboration_over: { bullets: ["Abstimmung dominiert", "Konflikte werden moderiert statt entschieden", "Verbindlichkeit nimmt ab", "Zielklarheit verliert Schärfe"], text: "Im Alltag bleibt das Miteinander stabil, jedoch sinkt die Konsequenz in Richtung und Abschluss." },
        },
        conclusion: "Die Rolle ist auf konsequente Umsetzung und Ergebnisverantwortung angelegt. Struktur dient der Steuerung, nicht der Verzögerung.",
      },
      leadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Führungsrolle {{roleTitle}}. Im Mittelpunkt stehen Zielklarheit, Konsequenz und Ergebnisverantwortung."),
        overall: "Die Rolle ist deutlich ergebnis- und steuerungsorientiert. Führung erfolgt über klare Erwartungen, konsequentes Nachhalten und schnelle Entscheidungen. Struktur ist notwendig, um Transparenz zu sichern. Zusammenarbeit ist wichtig, bleibt aber nachgeordnet.",
        tasks: "Die Aufgaben verlangen klare Steuerung der Aktivitäten. Ergebnisse werden sichtbar gemacht und konsequent eingefordert.",
        human: "Gefordert sind Durchsetzung, Entscheidungsstärke und die Fähigkeit, Verantwortung eindeutig zuzuordnen.",
        leadership_section: "Führung entsteht hier über Richtung. Ziele sind messbar, Prioritäten eindeutig, Verantwortlichkeit klar geregelt.",
        overweight: {
          speed_over: { bullets: ["Druck im Team steigt", "Abstimmung wird verkürzt", "Fehlentscheidungen nehmen zu", "Fluktuationsrisiko steigt"], text: "Im Alltag entsteht Tempo, gleichzeitig steigt die Reibung im Team und die Fehlerquote." },
          structure_over: { bullets: ["Tempo sinkt", "Entscheidungen werden abgesichert", "Wirksamkeit wird langsamer sichtbar", "Steuerung wirkt bürokratisch"], text: "Im Alltag steigt die Kontrolle, jedoch sinkt die Dynamik in Abschluss und Umsetzung." },
          collaboration_over: { bullets: ["Konsens dominiert", "Konsequenz sinkt", "Ergebnisfokus verwässert", "Prioritäten werden verhandelbar"], text: "Im Alltag bleibt das Klima ruhig, jedoch leidet die Klarheit in Ziel und Leistung." },
        },
        conclusion: "Die Führungsrolle ist auf Richtung, Ergebnis und konsequente Umsetzung ausgelegt. Struktur sichert Transparenz, ersetzt aber nicht Entscheidung.",
      },
    },
    strong_ana: {
      noLeadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Rolle {{roleTitle}}. Im Vordergrund stehen Ordnung, Präzision und planbares Vorgehen."),
        overall: "Die Rolle ist klar auf Struktur und Genauigkeit ausgerichtet. Entscheidungen werden vorbereitet und nachvollziehbar abgesichert. Umsetzung erfolgt konsequent, jedoch innerhalb klarer Abläufe. Zusammenarbeit unterstützt die Funktion, steht aber nicht im Zentrum.",
        tasks: "Die Aufgaben verlangen saubere Planung, Dokumentation und Qualitätssicherung. Abweichungen werden erkannt und systematisch bearbeitet.",
        human: "Gefordert sind Sorgfalt, Verlässlichkeit und ein klares Qualitätsverständnis. Prioritäten werden strukturiert gesetzt und gehalten.",
        overweight: {
          structure_over: { bullets: ["Entscheidungen dauern länger", "Detailtiefe steigt", "Reaktionsgeschwindigkeit sinkt", "Absicherung wird dominant"], text: "Im Alltag steigt die Genauigkeit, gleichzeitig sinkt die Beweglichkeit in dynamischen Situationen." },
          speed_over: { bullets: ["Prozesse werden verkürzt", "Qualitätssicherung sinkt", "Nacharbeit nimmt zu", "Schnittstellenfehler steigen"], text: "Im Alltag steigt das Tempo, jedoch sinkt die Verlässlichkeit in Ordnung und Qualität." },
          collaboration_over: { bullets: ["Abstimmung dominiert", "Entscheidungen werden situativer", "Verbindlichkeit sinkt", "Struktur verliert an Schärfe"], text: "Im Alltag bleibt das Umfeld eingebunden, jedoch leidet die Klarheit in Prozess und Priorität." },
        },
        conclusion: "Die Rolle ist auf klare Abläufe, Präzision und verlässliche Qualität ausgelegt. Entscheidungen sollen nachvollziehbar und stabil sein.",
      },
      leadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Führungsrolle {{roleTitle}}. Im Vordergrund stehen klare Struktur, stabile Prozesse und verlässliche Entscheidungen."),
        overall: "Führung in dieser Rolle erfolgt über Ordnung, Planung und nachvollziehbare Steuerung. Erwartungen werden klar formuliert und über Transparenz gesichert. Umsetzung ist wichtig, bleibt jedoch an klare Standards gebunden.",
        tasks: "Die Aufgaben verlangen Prozessklarheit, Qualitätssicherung und strukturierte Steuerung der Ergebnisse.",
        human: "Gefordert sind Ruhe, Sorgfalt und die Fähigkeit, Komplexität zu ordnen und Entscheidungen zu begründen.",
        leadership_section: "Führung entsteht durch klare Rahmenbedingungen, definierte Zuständigkeiten und konsequentes Qualitätsniveau.",
        overweight: {
          structure_over: { bullets: ["Entscheidungen werden verzögert", "Kontrolle nimmt zu", "Tempo sinkt", "Team wirkt gebremst"], text: "Im Alltag steigt die Sicherheit, jedoch sinkt die Dynamik in Umsetzung und Anpassung." },
          speed_over: { bullets: ["Standards werden verkürzt", "Fehlerquote steigt", "Nacharbeit nimmt zu", "Planbarkeit sinkt"], text: "Im Alltag steigt die Geschwindigkeit, jedoch sinkt die Stabilität in Qualität und Prozess." },
          collaboration_over: { bullets: ["Konsens dominiert", "Prioritäten werden verhandelbar", "Verbindlichkeit sinkt", "Struktur wird weich"], text: "Im Alltag bleibt das Klima stabil, jedoch sinkt die Klarheit in Richtung und Standard." },
        },
        conclusion: "Die Führungsrolle ist auf Prozessklarheit, stabile Standards und nachvollziehbare Steuerung ausgerichtet.",
      },
    },
    strong_int: {
      noLeadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Rolle {{roleTitle}}. Im Vordergrund stehen Zusammenarbeit, Abstimmung und situationsgerechtes Handeln."),
        overall: "Die Rolle ist klar auf Zusammenarbeit und Kontext ausgerichtet. Entscheidungen sollen anschlussfähig sein und im Umfeld funktionieren. Struktur ist notwendig, bleibt aber nachgeordnet. Umsetzung erfolgt, jedoch weniger über Tempo als über Einbindung.",
        tasks: "Die Aufgaben verlangen laufende Abstimmung und ein gutes Gespür für Situationen. Schnittstellenarbeit und Kommunikation sind zentral.",
        human: "Gefordert sind Kommunikationsstärke, Kooperationsfähigkeit und die Fähigkeit, Spannungen früh zu erkennen und sauber zu klären.",
        overweight: {
          collaboration_over: { bullets: ["Abstimmung dominiert", "Entscheidungen werden verschoben", "Prioritäten werden situativer", "Verbindlichkeit sinkt"], text: "Im Alltag bleibt das Miteinander stabil, jedoch kann Klarheit in Priorität und Abschluss nachlassen." },
          speed_over: { bullets: ["Entscheidungen werden beschleunigt", "Abstimmung wird verkürzt", "Konflikte nehmen zu", "Akzeptanz sinkt"], text: "Im Alltag steigt die Dynamik, gleichzeitig steigt die Reibung im Umfeld." },
          structure_over: { bullets: ["Prozesse werden starrer", "Flexibilität sinkt", "Kontext wird weniger berücksichtigt", "Zusammenarbeit wird funktionaler"], text: "Im Alltag steigt die Ordnung, gleichzeitig sinkt die Anschlussfähigkeit im Umfeld." },
        },
        conclusion: "Die Rolle ist auf tragfähige Zusammenarbeit und situationsgerechtes Handeln ausgerichtet. Entscheidungen sollen im Umfeld funktionieren.",
      },
      leadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Führungsrolle {{roleTitle}}. Im Vordergrund stehen Zusammenarbeit, Stabilität im Team und situationsgerechte Steuerung."),
        overall: "Führung in dieser Rolle entsteht über Einbindung und klare Kommunikation. Entscheidungen werden so getroffen, dass sie getragen werden. Struktur und Ergebnisorientierung sind wichtig, bleiben jedoch nachgeordnet.",
        tasks: "Die Aufgaben verlangen Teamabstimmung, klare Kommunikation und aktive Arbeit an Schnittstellen.",
        human: "Gefordert sind Beziehungsstärke, Konfliktklarheit und ein gutes Gespür für Dynamiken im Team.",
        leadership_section: "Führung entsteht durch Stabilität im Miteinander und saubere Abstimmung, ohne Verbindlichkeit zu verlieren.",
        overweight: {
          collaboration_over: { bullets: ["Konsens dominiert", "Leistungsdruck sinkt", "Entscheidungen werden vertagt", "Richtung verliert Schärfe"], text: "Im Alltag bleibt das Klima stabil, jedoch sinkt die Konsequenz in Ziel und Abschluss." },
          speed_over: { bullets: ["Druck steigt", "Konflikte nehmen zu", "Abstimmung sinkt", "Akzeptanz sinkt"], text: "Im Alltag entsteht Tempo, gleichzeitig sinkt die Stabilität im Team." },
          structure_over: { bullets: ["Prozesse dominieren", "Flexibilität sinkt", "Kommunikation wird formaler", "Team fühlt sich eingeengt"], text: "Im Alltag steigt die Ordnung, jedoch sinkt die Anschlussfähigkeit im Team." },
        },
        conclusion: "Die Führungsrolle ist auf Teamstabilität und situationsgerechte Steuerung ausgerichtet. Entscheidungen sollen tragfähig sein.",
      },
    },
    hybrid_imp_ana: {
      noLeadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Rolle {{roleTitle}}. Im Vordergrund stehen konsequente Umsetzung und klare Struktur."),
        overall: "Die Rolle verbindet Ergebnisorientierung mit planbarer Steuerung. Entscheidungen werden zügig getroffen, aber entlang klarer Prioritäten und Kennzahlen. Umsetzung erfolgt konsequent, ohne dass Ordnung und Nachvollziehbarkeit verloren gehen. Zusammenarbeit unterstützt die Funktion, steht jedoch nicht im Zentrum.",
        tasks: "Die Aufgaben verlangen Geschwindigkeit in der Umsetzung und gleichzeitig saubere Steuerung über klare Vorgaben und messbare Ziele.",
        human: "Gefordert sind Entschlossenheit und Struktur. Prioritäten werden klar gesetzt und konsequent eingehalten.",
        overweight: {
          speed_over: { bullets: ["Absicherung sinkt", "Abstimmung wird verkürzt", "Fehlerquote steigt", "Nacharbeit nimmt zu"], text: "Im Alltag steigt die Dynamik, gleichzeitig sinkt die Verlässlichkeit der Steuerung." },
          structure_over: { bullets: ["Tempo sinkt", "Entscheidungen dauern länger", "Chancen werden später genutzt", "Wirksamkeit verzögert sich"], text: "Im Alltag steigt die Ordnung, jedoch verliert die Rolle an Abschlussstärke." },
          collaboration_over: { bullets: ["Konsens dominiert", "Konsequenz sinkt", "Ziele werden verhandelbar", "Prioritäten wechseln"], text: "Im Alltag bleibt das Umfeld eingebunden, jedoch sinkt Klarheit und Abschluss." },
        },
        conclusion: "Die Rolle verbindet konsequente Umsetzung mit klarer Steuerung. Sie ist auf Ergebnis und Struktur im gleichen Maß angelegt.",
      },
      leadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Führungsrolle {{roleTitle}}. Im Vordergrund stehen klare Zielsteuerung und verlässliche Struktur."),
        overall: "Führung in dieser Rolle verbindet Richtung und Umsetzung mit klaren Vorgaben. Ziele sind eindeutig, Entscheidungen konsequent, Steuerung erfolgt nachvollziehbar über Kennzahlen und Prioritäten. Zusammenarbeit ist wichtig, bleibt jedoch nachgeordnet zur Ergebnislogik.",
        tasks: "Die Aufgaben verlangen klare Steuerung der Aktivitäten und konsequentes Nachhalten der Ergebnisse.",
        human: "Gefordert sind Durchsetzung und Struktur. Verantwortung wird klar zugeordnet und konsequent verfolgt.",
        leadership_section: "Führung entsteht durch klare Ziele, messbare Erwartungen und konsequente Umsetzung innerhalb definierter Regeln.",
        overweight: {
          speed_over: { bullets: ["Druck steigt", "Reibung nimmt zu", "Absicherung sinkt", "Fehlsteuerung steigt"], text: "Im Alltag steigt Tempo, während Struktur und Teamstabilität an Verlässlichkeit verlieren." },
          structure_over: { bullets: ["Tempo sinkt", "Kontrolle steigt", "Entscheidungen verzögern sich", "Team wirkt gebremst"], text: "Im Alltag steigt Ordnung, jedoch sinkt die Abschlussstärke." },
          collaboration_over: { bullets: ["Konsens dominiert", "Konsequenz sinkt", "Ziele werden verhandelbar", "Prioritäten verlieren Stabilität"], text: "Im Alltag bleibt das Klima stabil, jedoch sinkt die Klarheit in Richtung und Ergebnis." },
        },
        conclusion: "Die Führungsrolle verbindet konsequente Ergebnissteuerung mit verlässlicher Struktur und klaren Prioritäten.",
      },
    },
    hybrid_ana_int: {
      noLeadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Rolle {{roleTitle}}. Im Vordergrund stehen klare Organisation und tragfähige Abstimmung im Umfeld."),
        overall: "Die Rolle verbindet Struktur mit Kontextsensibilität. Entscheidungen sollen nachvollziehbar vorbereitet werden und zugleich im Arbeitsumfeld funktionieren. Ordnung und Abstimmung stehen gleichwertig nebeneinander. Umsetzung erfolgt verlässlich, ohne dass Geschwindigkeit zum Haupttreiber wird.",
        tasks: "Die Aufgaben verlangen saubere Organisation, klare Prozesse und regelmäßige Abstimmung. Anforderungen werden eingeordnet und planbar bearbeitet.",
        human: "Gefordert sind Genauigkeit und Kommunikationsklarheit. Die Rolle verlangt ein strukturiertes Vorgehen und die Fähigkeit, Erwartungen sauber zu klären.",
        overweight: {
          structure_over: { bullets: ["Entscheidungen werden starrer", "Flexibilität sinkt", "Abstimmung tritt zurück", "Anschlussfähigkeit sinkt"], text: "Im Alltag steigt Ordnung, jedoch sinkt die Fähigkeit, Situationen flexibel einzuordnen." },
          collaboration_over: { bullets: ["Abstimmung dominiert", "Prioritäten werden situativer", "Verbindlichkeit sinkt", "Prozessklarheit nimmt ab"], text: "Im Alltag bleibt das Miteinander stabil, jedoch sinkt die Verlässlichkeit in Planung und Ablauf." },
          speed_over: { bullets: ["Tempo steigt", "Absicherung sinkt", "Abstimmung wird verkürzt", "Qualität schwankt"], text: "Im Alltag entsteht Dynamik, während Ordnung und Abstimmung an Stabilität verlieren können." },
        },
        conclusion: "Die Rolle verbindet klare Organisation mit tragfähiger Abstimmung. Entscheidungen sollen nachvollziehbar und zugleich anschlussfähig sein.",
      },
      leadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Führungsrolle {{roleTitle}}. Im Vordergrund stehen Orientierung über Struktur und Stabilität über Zusammenarbeit."),
        overall: "Führung in dieser Rolle verbindet klare Rahmenbedingungen mit tragfähiger Abstimmung. Entscheidungen sollen nachvollziehbar sein und im Team funktionieren. Steuerung erfolgt über klare Prioritäten, ergänzt durch stabile Kommunikation.",
        tasks: "Die Aufgaben verlangen Prozessklarheit, saubere Organisation und regelmäßige Einbindung des Umfelds.",
        human: "Gefordert sind Struktur und Kommunikationsfähigkeit, mit der Fähigkeit, Erwartungen zu klären und Ordnung zu sichern.",
        leadership_section: "Führung entsteht durch klare Regeln, saubere Abstimmung und verlässliche Prioritäten.",
        overweight: {
          structure_over: { bullets: ["Kontrolle steigt", "Flexibilität sinkt", "Team fühlt sich eingeengt", "Entscheidungen verzögern sich"], text: "Im Alltag steigt Ordnung, jedoch sinkt Beweglichkeit und Anschlussfähigkeit im Team." },
          collaboration_over: { bullets: ["Konsens dominiert", "Verbindlichkeit sinkt", "Prioritäten werden verhandelbar", "Tempo sinkt"], text: "Im Alltag bleibt das Klima stabil, jedoch sinkt die Klarheit in Ziel und Umsetzung." },
          speed_over: { bullets: ["Druck steigt", "Abstimmung sinkt", "Fehlsteuerung steigt", "Reibung nimmt zu"], text: "Im Alltag entsteht Tempo, während Ordnung und Teamstabilität nachlassen." },
        },
        conclusion: "Die Führungsrolle verbindet Struktur und Zusammenarbeit. Sie verlangt klare Organisation und tragfähige Entscheidungen im Teamkontext.",
      },
    },
    hybrid_imp_int: {
      noLeadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Rolle {{roleTitle}}. Im Vordergrund stehen Umsetzung und tragfähige Zusammenarbeit."),
        overall: "Die Rolle verbindet Handlungsfähigkeit mit enger Abstimmung. Entscheidungen werden getroffen und umgesetzt, müssen jedoch im Umfeld funktionieren. Geschwindigkeit ist wichtig, darf aber nicht zulasten von Anschlussfähigkeit gehen. Struktur unterstützt die Arbeit, steht jedoch nicht im Zentrum.",
        tasks: "Die Aufgaben verlangen schnelle Umsetzung und gleichzeitig laufende Abstimmung. Schnittstellen und Kommunikation sind zentral.",
        human: "Gefordert sind Eigeninitiative und Kommunikationsklarheit. Die Rolle verlangt Konsequenz in der Umsetzung und Stabilität in der Zusammenarbeit.",
        overweight: {
          speed_over: { bullets: ["Abstimmung sinkt", "Konflikte nehmen zu", "Qualität schwankt", "Nacharbeit steigt"], text: "Im Alltag steigt Tempo, während Zusammenarbeit und Stabilität im Umfeld leiden können." },
          collaboration_over: { bullets: ["Entscheidungen werden verschoben", "Konsequenz sinkt", "Prioritäten werden situativer", "Abschlussstärke sinkt"], text: "Im Alltag bleibt das Umfeld stabil, jedoch sinkt die Durchsetzung in Richtung und Ergebnis." },
          structure_over: { bullets: ["Tempo sinkt", "Handlungsspielraum wird enger", "Flexibilität sinkt", "Wirksamkeit verzögert sich"], text: "Im Alltag steigt Ordnung, jedoch sinkt die Dynamik in Umsetzung und Abschluss." },
        },
        conclusion: "Die Rolle verbindet konsequente Umsetzung mit tragfähiger Zusammenarbeit. Entscheidungen müssen wirksam und anschlussfähig sein.",
      },
      leadership: {
        intro: r("Dieser Bericht beschreibt die Anforderungen der Führungsrolle {{roleTitle}}. Im Vordergrund stehen klare Umsetzung und stabile Teamarbeit."),
        overall: "Führung in dieser Rolle verbindet Richtung und Tempo mit Einbindung. Entscheidungen werden getroffen und umgesetzt, müssen jedoch im Team getragen werden. Struktur unterstützt die Steuerung, ohne zum Haupttreiber zu werden.",
        tasks: "Die Aufgaben verlangen klare Steuerung und konsequentes Nachhalten, ergänzt durch aktive Kommunikation im Team und an Schnittstellen.",
        human: "Gefordert sind Durchsetzung und Kommunikationsstärke. Die Rolle verlangt Konsequenz in Ziel und Stabilität im Miteinander.",
        leadership_section: "Führung entsteht durch klare Richtung und verlässliche Zusammenarbeit. Entscheidungen sollen konsequent und zugleich tragfähig sein.",
        overweight: {
          speed_over: { bullets: ["Druck steigt", "Konflikte nehmen zu", "Abstimmung sinkt", "Akzeptanz sinkt"], text: "Im Alltag steigt Tempo, während Teamstabilität nachlassen kann." },
          collaboration_over: { bullets: ["Konsens dominiert", "Konsequenz sinkt", "Ziele werden verhandelbar", "Leistung verliert Schärfe"], text: "Im Alltag bleibt das Klima stabil, jedoch sinkt die Klarheit in Ziel und Ergebnis." },
          structure_over: { bullets: ["Tempo sinkt", "Kontrolle steigt", "Flexibilität sinkt", "Wirksamkeit verzögert sich"], text: "Im Alltag steigt Ordnung, jedoch sinkt die Dynamik in Umsetzung." },
        },
        conclusion: "Die Führungsrolle verbindet Tempo und Konsequenz mit Teamstabilität. Entscheidungen müssen umgesetzt und getragen werden.",
      },
    },
  };

  const inheritMap: Record<string, string> = {
    dominant_imp: "strong_imp", dominant_ana: "strong_ana", dominant_int: "strong_int",
    light_imp: "strong_imp", light_ana: "strong_ana", light_int: "strong_int",
  };

  const resolvedKey = inheritMap[profileType] || profileType;
  const textSet = allTexts[resolvedKey] || allTexts.balanced_all;
  const variant = isLeadership && textSet.leadership ? textSet.leadership : textSet.noLeadership;

  const owLabels: Record<string, { label: string; color: string }> = {
    speed_over: { label: "Wird zu viel Tempo gemacht", color: COLORS.imp },
    structure_over: { label: "Wird zu viel Struktur eingesetzt", color: COLORS.ana },
    collaboration_over: { label: "Wird zu viel Abstimmung priorisiert", color: COLORS.int },
  };

  const overweight: OverweightEffect[] = Object.entries(variant.overweight).map(([key, val]: [string, any]) => ({
    label: owLabels[key]?.label || key,
    color: owLabels[key]?.color || "#6E6E73",
    bullets: val.bullets,
    text: val.text,
  }));

  return {
    intro: variant.intro,
    overall: variant.overall,
    tasks: variant.tasks,
    human: variant.human,
    leadership_section: variant.leadership_section,
    overweight,
    conclusion: variant.conclusion,
  };
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  return (
    <div>
      {data.map((bar) => (
        <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: "#6E6E73", width: 72, flexShrink: 0 }}>{bar.label}</span>
          <div style={{ flex: 1, height: 26, borderRadius: 6, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <div style={{
              width: `${Math.max(bar.value, 2)}%`,
              height: "100%",
              borderRadius: 6,
              background: bar.color,
              transition: "width 600ms ease",
              display: "flex",
              alignItems: "center",
              paddingLeft: 8,
              minWidth: 40,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>
                {Math.round(bar.value)} %
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GlassCard({ children, style, testId }: { children: React.ReactNode; style?: React.CSSProperties; testId?: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 24,
        padding: "28px 28px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
        border: "1px solid rgba(0,0,0,0.04)",
        ...style,
      }}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color }: { icon: typeof BarChart3; title: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: color ? `linear-gradient(135deg, ${color}10, ${color}18)` : "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.06))",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon style={{ width: 16, height: 16, color: color || "#0071E3", strokeWidth: 1.8 }} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{title}</p>
    </div>
  );
}

function BarsForProfile(bg: BG) {
  return <BarChart data={[
    { label: "Impulsiv", value: bg.imp, color: COLORS.imp },
    { label: "Intuitiv", value: bg.int, color: COLORS.int },
    { label: "Analytisch", value: bg.ana, color: COLORS.ana },
  ]} />;
}

function EffectCard({ label, color, bullets, text }: OverweightEffect) {
  return (
    <div style={{ background: "rgba(0,0,0,0.02)", borderRadius: 16, padding: "20px 22px", border: `1px solid ${color}12` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 24, height: 24, borderRadius: 8, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AlertTriangle style={{ width: 12, height: 12, color, strokeWidth: 2 }} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{label}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {bullets.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <Check style={{ width: 12, height: 12, color: "#8E8E93", marginTop: 3, flexShrink: 0, strokeWidth: 2 }} />
            <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.6 }}>{e}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: "12px 14px", background: `${color}06`, borderRadius: 10, borderLeft: `3px solid ${color}` }}>
        <p style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.65, margin: 0 }}>{text}</p>
      </div>
    </div>
  );
}

export default function Bericht() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<{
    beruf: string; isLeadership: boolean;
    gesamt: BG; haupt: BG; neben: BG; fuehrung: BG;
    texts: ReportTexts; intensity: Intensity;
  } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      const beruf = state.beruf || "Unbenannte Rolle";
      const isLeadership = (state.fuehrung || "Keine") !== "Keine";
      const taetigkeiten = state.taetigkeiten || [];
      const haupt = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "haupt"));
      const neben = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "neben"));
      const fuehrung = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "fuehrung"));
      const rahmen = computeRahmen(state);
      const gesamt = computeGesamt(haupt, neben, fuehrung, rahmen);
      const { type, intensity } = classifyProfile(gesamt);
      const texts = getReportTexts(beruf, isLeadership, type, intensity);
      setData({ beruf, isLeadership, gesamt, haupt, neben, fuehrung, texts, intensity });
    } catch {}
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #f0f2f5 0%, #e8eaef 100%)" }}>
        <GlassCard testId="bericht-no-data">
          <div className="text-center" style={{ padding: "20px 40px" }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1D1D1F", marginBottom: 8 }}>Keine Analyse vorhanden</p>
            <p style={{ fontSize: 14, color: "#6E6E73", marginBottom: 16 }}>Bitte erfassen Sie zuerst die Rollendaten.</p>
            <button
              onClick={() => setLocation("/rollen-dna")}
              style={{ background: "#0071E3", color: "white", border: "none", borderRadius: 12, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              data-testid="button-goto-rollen-dna"
            >
              Zur Datenerfassung
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const { beruf, isLeadership, gesamt, haupt, neben, fuehrung, texts, intensity } = data;

  const intensityNote = intensity === "strong"
    ? "Der Schwerpunkt ist eindeutig."
    : intensity === "clear"
      ? "Die Ausrichtung ist klar erkennbar."
      : intensity === "light"
        ? "Der Schwerpunkt ist erkennbar, jedoch nicht exklusiv."
        : "";

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background:
          "radial-gradient(ellipse 120% 80% at 20% 60%, rgba(186,220,248,0.35) 0%, transparent 50%), " +
          "radial-gradient(ellipse 100% 70% at 80% 30%, rgba(252,205,210,0.25) 0%, transparent 50%), " +
          "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(200,235,210,0.3) 0%, transparent 50%)",
      }} />

      <div className="relative z-10">
        <div style={{ position: "sticky", top: 0, zIndex: 200 }}>
          <div style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "rgba(255,255,255,0.82)" }}>
            <header className="flex items-center justify-between gap-4 px-6 py-4" data-testid="header-bericht">
              <div className="flex items-center gap-3">
                <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-bericht">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <img src={logoSrc} alt="bioLogic Logo" className="h-7 w-auto" data-testid="logo-bericht" />
                <span className="text-sm text-muted-foreground/70 font-light tracking-wide hidden sm:inline">RoleDynamics</span>
              </div>
            </header>
          </div>
        </div>

        <main className="flex-1 w-full max-w-3xl mx-auto px-6 pb-20 pt-6">
          <div className="text-center mb-10">
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1.1 }} data-testid="text-bericht-title">
              Entscheidungsbericht
            </h1>
            <p style={{ fontSize: 15, color: "#6E6E73", fontWeight: 400, lineHeight: 1.5, marginTop: 8 }}>
              Strukturelle Anforderungsanalyse: {beruf}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <GlassCard testId="bericht-intro">
              <SectionHeader icon={Users} title="Warum dieser Bericht" />
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75 }}>
                Fachliche Qualifikation allein sichert keine Leistung. Mitarbeitende, die persönlich zur Stelle passen, arbeiten wirksamer, bleiben länger und stabilisieren ihr Umfeld. Dieser Bericht beschreibt, welche strukturellen Anforderungen die Rolle {beruf} stellt – unabhängig von Lebenslauf und Zertifikaten.
              </p>
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 8 }}>
                {texts.intro}
              </p>
              {intensityNote && (
                <p style={{ fontSize: 13, color: "#0071E3", fontWeight: 500, marginTop: 10 }}>{intensityNote}</p>
              )}
            </GlassCard>

            <GlassCard testId="bericht-gesamtprofil">
              <SectionHeader icon={BarChart3} title="Gesamtprofil" />
              {BarsForProfile(gesamt)}
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 16 }}>{texts.overall}</p>
            </GlassCard>

            <GlassCard testId="bericht-taetigkeitsstruktur">
              <SectionHeader icon={Briefcase} title="Tätigkeitsstruktur" color="#F39200" />
              {BarsForProfile(haupt)}
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 16 }}>{texts.tasks}</p>
            </GlassCard>

            <GlassCard testId="bericht-humankompetenzen">
              <SectionHeader icon={Heart} title="Humankompetenzen" color="#C41E3A" />
              {BarsForProfile(neben)}
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 16 }}>{texts.human}</p>
            </GlassCard>

            {isLeadership && texts.leadership_section && (
              <GlassCard testId="bericht-fuehrungskompetenzen">
                <SectionHeader icon={Shield} title="Führungskompetenzen" color="#1A5DAB" />
                {BarsForProfile(fuehrung)}
                <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 16 }}>{texts.leadership_section}</p>
              </GlassCard>
            )}

            <GlassCard testId="bericht-ueberpraegung" style={{ padding: "32px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(255,149,0,0.10), rgba(255,59,48,0.08))",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <AlertTriangle style={{ width: 16, height: 16, color: "#FF9500", strokeWidth: 1.8 }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Wirkung bei struktureller Abweichung</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {texts.overweight.map((ow, i) => (
                  <EffectCard key={i} {...ow} />
                ))}
              </div>
            </GlassCard>

            <GlassCard testId="bericht-fazit" style={{
              background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(52,170,220,0.04), rgba(255,255,255,0.65))",
              border: "1px solid rgba(0,113,227,0.10)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(0,113,227,0.12), rgba(52,170,220,0.12))",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Lightbulb size={16} style={{ color: "#0071E3" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.06em" }}>Fazit</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.6 }}>
                {texts.conclusion}
              </p>
            </GlassCard>

          </div>
        </main>
      </div>
    </div>
  );
}
