import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "./jobcheck-engine";
import type { Triad, ComponentKey } from "./jobcheck-engine";

export type FitRating = "GEEIGNET" | "BEDINGT" | "NICHT_GEEIGNET";
export type Severity = "ok" | "warning" | "critical";

export type ImpactArea = {
  id: string;
  label: string;
  severity: Severity;
  roleNeed: string;
  candidatePattern: string;
  risk: string;
};

export type RiskPhase = {
  label: string;
  period: string;
  text: string;
};

export type SollIstResult = {
  roleName: string;
  candidateName: string;
  roleTriad: Triad;
  candTriad: Triad;
  roleDomLabel: string;
  candDomLabel: string;
  roleDomKey: ComponentKey;
  candDomKey: ComponentKey;
  totalGap: number;
  gapLevel: "gering" | "mittel" | "hoch";
  fitRating: FitRating;
  fitLabel: string;
  fitColor: string;
  controlIntensity: "gering" | "mittel" | "hoch";
  summaryText: string;
  dominanceShiftText: string;
  impactAreas: ImpactArea[];
  riskTimeline: RiskPhase[];
  developmentLevel: number;
  developmentLabel: string;
  developmentText: string;
  actions: string[];
  finalText: string;
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

function severity(gap: number): Severity {
  if (gap >= 15) return "critical";
  if (gap >= 8) return "warning";
  return "ok";
}

export function computeSollIst(
  roleName: string,
  candidateName: string,
  roleProfile: Triad,
  candProfile: Triad
): SollIstResult {
  const rt = normalizeTriad(roleProfile);
  const ct = normalizeTriad(candProfile);
  const rDom = dominanceModeOf(rt);
  const cDom = dominanceModeOf(ct);

  const totalGap = Math.abs(rt.impulsiv - ct.impulsiv) + Math.abs(rt.intuitiv - ct.intuitiv) + Math.abs(rt.analytisch - ct.analytisch);
  const gapLevel: "gering" | "mittel" | "hoch" = totalGap > 40 ? "hoch" : totalGap > 20 ? "mittel" : "gering";

  let fitRating: FitRating;
  let fitLabel: string;
  let fitColor: string;
  if (totalGap > 40) { fitRating = "NICHT_GEEIGNET"; fitLabel = "Nicht geeignet"; fitColor = "#C41E3A"; }
  else if (totalGap > 20) { fitRating = "BEDINGT"; fitLabel = "Bedingt geeignet"; fitColor = "#F39200"; }
  else { fitRating = "GEEIGNET"; fitLabel = "Geeignet"; fitColor = "#34C759"; }

  const controlIntensity: "gering" | "mittel" | "hoch" = totalGap > 35 ? "hoch" : totalGap > 15 ? "mittel" : "gering";

  const rk = rDom.top1.key;
  const ck = cDom.top1.key;

  const summaryText = buildSummary(roleName, candidateName, fitLabel, rk, ck, gapLevel, rt, ct);
  const dominanceShiftText = buildDominanceShift(roleName, rk, ck, rt, ct);
  const impactAreas = buildImpactAreas(rk, ck, rt, ct);
  const riskTimeline = buildRiskTimeline(roleName, rk, ck, gapLevel);
  const { level: developmentLevel, label: developmentLabel, text: developmentText } = buildDevelopment(gapLevel, rk, ck, controlIntensity);
  const actions = buildActions(rk, ck, gapLevel, controlIntensity);
  const finalText = buildFinal(roleName, candidateName, fitLabel, controlIntensity, rk);

  return {
    roleName,
    candidateName: candidateName || "Kandidat",
    roleTriad: rt,
    candTriad: ct,
    roleDomLabel: dominanceLabel(rDom),
    candDomLabel: dominanceLabel(cDom),
    roleDomKey: rk,
    candDomKey: ck,
    totalGap,
    gapLevel,
    fitRating,
    fitLabel,
    fitColor,
    controlIntensity,
    summaryText,
    dominanceShiftText,
    impactAreas,
    riskTimeline,
    developmentLevel,
    developmentLabel,
    developmentText,
    actions,
    finalText,
  };
}

function buildSummary(role: string, cand: string, fit: string, rk: ComponentKey, ck: ComponentKey, gap: string, rt: Triad, ct: Triad): string {
  const candName = cand || "Der Kandidat";
  if (rk === ck) {
    return `${candName} zeigt eine ${fit.toLowerCase()}e Passung für die Rolle ${role}. Die Arbeitslogik stimmt in der Grundausrichtung überein. Beide Profile betonen ${compDesc(rk)}. Die Abweichung ist ${gap} und betrifft vor allem die Gewichtung der sekundären Komponenten.`;
  }
  return `${candName} ist für die Rolle ${role} als ${fit.toLowerCase()} einzustufen. Die Rolle verlangt schwerpunktmäßig ${compDesc(rk)}. ${candName} arbeitet stärker über ${compDesc(ck)}. Die Abweichung der Arbeitslogik ist ${gap}.`;
}

function buildDominanceShift(role: string, rk: ComponentKey, ck: ComponentKey, rt: Triad, ct: Triad): string {
  if (rk === ck) {
    return `Die Grundausrichtung stimmt überein. Sowohl die Rolle als auch der Kandidat betonen ${compDesc(rk)}. Unterschiede bestehen in der Ausprägung der sekundären Komponenten.`;
  }
  return `Die Rolle ${role} verlangt eine Arbeitsweise, die auf ${compDesc(rk)} ausgerichtet ist. Der Kandidat bringt stattdessen eine stärkere Orientierung an ${compDesc(ck)} mit. Dadurch verschiebt sich die Wirkung der Position weg von ${compShort(rk)} hin zu ${compShort(ck)}.`;
}

function buildImpactAreas(rk: ComponentKey, ck: ComponentKey, rt: Triad, ct: Triad): ImpactArea[] {
  const gapI = Math.abs(rt.impulsiv - ct.impulsiv);
  const gapN = Math.abs(rt.intuitiv - ct.intuitiv);
  const gapA = Math.abs(rt.analytisch - ct.analytisch);

  const areas: ImpactArea[] = [
    {
      id: "decision",
      label: "Entscheidungslogik",
      severity: severity(rk === "analytisch" && ck !== "analytisch" ? gapA + 5 : Math.max(gapI, gapA)),
      roleNeed: rk === "analytisch" ? "Sorgfältige, datenbasierte Entscheidungen" : rk === "impulsiv" ? "Schnelle, handlungsorientierte Entscheidungen" : "Konsensorientierte, kontextbezogene Entscheidungen",
      candidatePattern: ck === "analytisch" ? "Prüft gründlich, braucht Datengrundlage" : ck === "impulsiv" ? "Entscheidet schnell, handelt direkt" : "Bezieht Kontext und Menschen ein",
      risk: rk !== ck ? `Entscheidungen werden stärker durch ${compShort(ck)} geprägt als durch ${compShort(rk)}.` : "Entscheidungslogik stimmt überein.",
    },
    {
      id: "work_structure",
      label: "Arbeitssteuerung",
      severity: severity(gapA),
      roleNeed: rt.analytisch >= 35 ? "Klare Planungsstruktur und systematische Steuerung" : rt.analytisch >= 25 ? "Grundlegende Prozessordnung" : "Flexible, ergebnisorientierte Steuerung",
      candidatePattern: ct.analytisch >= 35 ? "Arbeitet strukturiert mit klaren Abläufen" : ct.analytisch >= 25 ? "Grundlegende Struktur vorhanden" : "Arbeitet flexibel, wenig formale Planung",
      risk: gapA >= 10 ? `Die Arbeitssteuerung weicht um ${Math.round(gapA)} Punkte ab. ${ct.analytisch < rt.analytisch ? "Planung und Dokumentation können zu kurz kommen." : "Übermäßige Planung kann Tempo kosten."}` : "Arbeitssteuerung passt zur Rolle.",
    },
    {
      id: "documentation",
      label: "Dokumentation",
      severity: severity(rt.analytisch > ct.analytisch ? gapA : 0),
      roleNeed: rt.analytisch >= 35 ? "Lückenlose Dokumentation und Nachvollziehbarkeit" : "Grundlegende Dokumentation",
      candidatePattern: ct.analytisch >= 35 ? "Dokumentiert gründlich und systematisch" : "Dokumentation hat geringere Priorität",
      risk: rt.analytisch > ct.analytisch && gapA >= 10 ? "Nachvollziehbarkeit von Entscheidungen und Arbeitsschritten kann leiden." : "Dokumentationsverhalten passt.",
    },
    {
      id: "leadership",
      label: "Führungswirkung",
      severity: severity(rk !== ck ? Math.max(gapI, gapN, gapA) * 0.7 : 0),
      roleNeed: rk === "impulsiv" ? "Klare Ansagen, schnelle Richtungsentscheidungen" : rk === "intuitiv" ? "Empathische Führung, Teamorientierung" : "Strukturgebende Führung, klare Vorgaben",
      candidatePattern: ck === "impulsiv" ? "Führt über Tempo und direkte Anweisung" : ck === "intuitiv" ? "Führt über Beziehung und Dialog" : "Führt über Struktur und klare Regeln",
      risk: rk !== ck ? `Führungsstil wirkt stärker über ${compShort(ck)} als die Rolle verlangt.` : "Führungswirkung passt zur Rollenanforderung.",
    },
    {
      id: "conflict",
      label: "Konfliktfähigkeit",
      severity: severity(Math.max(gapI, gapN) * 0.6),
      roleNeed: rk === "impulsiv" ? "Direkte Konfrontation und schnelle Klärung" : rk === "intuitiv" ? "Vermittelnde, beziehungsorientierte Klärung" : "Sachliche, regelbasierte Konfliktlösung",
      candidatePattern: ck === "impulsiv" ? "Geht Konflikte direkt an" : ck === "intuitiv" ? "Sucht Ausgleich und Kompromiss" : "Löst Konflikte über Fakten und Regeln",
      risk: gapI >= 12 || gapN >= 12 ? "Das Konfliktverhalten kann Spannungen in der Zusammenarbeit erzeugen." : "Konfliktverhalten passt grundsätzlich.",
    },
    {
      id: "culture",
      label: "Kulturwirkung",
      severity: severity(Math.max(gapI, gapN, gapA) * 0.5),
      roleNeed: rk === "impulsiv" ? "Leistungs- und ergebnisorientierte Kultur" : rk === "intuitiv" ? "Kooperative, beziehungsorientierte Kultur" : "Qualitäts- und regelorientierte Kultur",
      candidatePattern: ck === "impulsiv" ? "Bringt Dynamik und Ergebnisorientierung" : ck === "intuitiv" ? "Fördert Teamzusammenhalt und Dialog" : "Stärkt Qualitätsbewusstsein und Ordnung",
      risk: rk !== ck ? `Die Kulturwirkung verschiebt sich von ${compShort(rk)} hin zu ${compShort(ck)}.` : "Kulturwirkung stimmt mit der Rollenanforderung überein.",
    },
  ];

  return areas;
}

function buildRiskTimeline(role: string, rk: ComponentKey, ck: ComponentKey, gap: string): RiskPhase[] {
  if (rk === ck || gap === "gering") {
    return [
      { label: "Kurzfristig", period: "0 - 3 Monate", text: "Einarbeitung verläuft voraussichtlich reibungslos. Die Arbeitslogik stimmt mit der Rollenanforderung überein." },
      { label: "Mittelfristig", period: "3 - 12 Monate", text: "Stabile Leistung erwartbar. Feinabstimmung in den sekundären Bereichen möglich." },
      { label: "Langfristig", period: "12+ Monate", text: "Nachhaltige Besetzung wahrscheinlich. Geringe Steuerung notwendig." },
    ];
  }

  const shortRisks: Record<ComponentKey, Record<ComponentKey, string>> = {
    impulsiv: {
      intuitiv: "Der Kandidat investiert mehr Zeit in Abstimmung als die Rolle erlaubt. Erste Verzögerungen bei Umsetzungstempo sind wahrscheinlich.",
      analytisch: "Entscheidungen werden langsamer getroffen als die Rolle verlangt. Detailprüfung nimmt mehr Raum ein als vorgesehen.",
      impulsiv: "",
    },
    intuitiv: {
      impulsiv: "Der Kandidat treibt schneller voran als die Rolle vorsieht. Beziehungsarbeit und Abstimmung können darunter leiden.",
      analytisch: "Formale Prozesse werden stärker betont als nötig. Die zwischenmenschliche Wirkung der Rolle kann in den Hintergrund treten.",
      intuitiv: "",
    },
    analytisch: {
      impulsiv: "Fehler und Nacharbeiten können entstehen, weil Abläufe nicht ausreichend geprüft werden. Dokumentation leidet unter dem hohen Tempo.",
      intuitiv: "Entscheidungen werden stärker beziehungsorientiert getroffen. Die strukturelle Präzision der Rolle kann nachlassen.",
      analytisch: "",
    },
  };

  const midRisks: Record<ComponentKey, Record<ComponentKey, string>> = {
    impulsiv: {
      intuitiv: "Entscheidungen folgen zunehmend der persönlichen Beziehungslogik des Kandidaten. Die Umsetzungsgeschwindigkeit sinkt weiter.",
      analytisch: "Die Rolle wird zunehmend über Prüfung und Kontrolle gesteuert statt über Tempo. Die Dynamik der Position geht verloren.",
      impulsiv: "",
    },
    intuitiv: {
      impulsiv: "Die kooperative Kultur der Rolle wird durch Ergebnisorientierung verdrängt. Mitarbeiterbindung kann sinken.",
      analytisch: "Die Rolle verliert ihren zwischenmenschlichen Charakter. Prozesse ersetzen zunehmend den persönlichen Kontakt.",
      intuitiv: "",
    },
    analytisch: {
      impulsiv: "Entscheidungen folgen zunehmend dem persönlichen Arbeitstempo des Kandidaten. Die Qualitätsstandards der Rolle erodieren.",
      intuitiv: "Die analytische Schärfe der Rolle wird durch Konsensentscheidungen aufgeweicht. Prüftiefe nimmt ab.",
      analytisch: "",
    },
  };

  return [
    {
      label: "Kurzfristig",
      period: "0 - 3 Monate",
      text: shortRisks[rk]?.[ck] || "Die Einarbeitung zeigt erste Abweichungen von der Rollenanforderung.",
    },
    {
      label: "Mittelfristig",
      period: "3 - 12 Monate",
      text: midRisks[rk]?.[ck] || "Die persönliche Arbeitslogik des Kandidaten prägt zunehmend die Rolle.",
    },
    {
      label: "Langfristig",
      period: "12+ Monate",
      text: gap === "hoch"
        ? "Die Wirkung der Rolle kann sich dauerhaft von der ursprünglichen Struktur entfernen. Eine Korrektur wird mit der Zeit schwieriger."
        : "Ohne gezielte Steuerung kann sich die Rollenausübung allmählich verschieben. Regelmäßige Überprüfung ist ratsam.",
    },
  ];
}

function buildDevelopment(gap: string, rk: ComponentKey, ck: ComponentKey, control: string): { level: number; label: string; text: string } {
  if (gap === "gering") {
    return {
      level: 4,
      label: "hoch",
      text: "Die Anpassung an die Rollenanforderung ist mit hoher Wahrscheinlichkeit erreichbar. Die Grundausrichtung stimmt bereits überein.",
    };
  }
  if (gap === "mittel") {
    return {
      level: 3,
      label: "mittel",
      text: `Eine Entwicklung in Richtung stärkerer ${compDesc(rk)} ist möglich. Sie erfordert gezielte Führung und klare Erwartungen. Der Zeitraum beträgt erfahrungsgemäß 6 bis 12 Monate.`,
    };
  }
  return {
    level: 1,
    label: "niedrig",
    text: `Eine Entwicklung von ${compDesc(ck)} hin zu ${compDesc(rk)} ist grundsätzlich möglich, aber aufwändig. Sie erfordert intensive Führung und klare Vorgaben über einen längeren Zeitraum. Der Erfolg ist nicht sicher.`,
  };
}

function buildActions(rk: ComponentKey, ck: ComponentKey, gap: string, control: string): string[] {
  if (gap === "gering") {
    return [
      "Regelmäßige Zielvereinbarungen zur Feinsteuerung",
      "Halbjährliche Überprüfung der Rollenpassung",
    ];
  }

  const base = [
    "Klare Erwartungsdefinition in den ersten 30 Tagen",
    "Strukturierte Einarbeitung mit definierten Meilensteinen",
  ];

  if (rk === "analytisch" && ck !== "analytisch") {
    base.push("Dokumentationspflicht für alle wesentlichen Entscheidungen");
    base.push("Wöchentliche Review-Termine zur Qualitätskontrolle");
    base.push("Klare KPI-Vorgaben mit messbaren Zielwerten");
  } else if (rk === "impulsiv" && ck !== "impulsiv") {
    base.push("Tempo-Vorgaben und Umsetzungsfristen definieren");
    base.push("Schnelle Entscheidungswege sicherstellen");
    base.push("Ergebnisorientierte KPIs statt Prozess-KPIs");
  } else if (rk === "intuitiv" && ck !== "intuitiv") {
    base.push("Regelmäßige Team-Feedbackrunden einrichten");
    base.push("Kommunikationserwartungen klar formulieren");
    base.push("Beziehungsarbeit als explizites Ziel definieren");
  }

  if (control === "hoch") {
    base.push("Engmaschige Führungsbegleitung in den ersten 90 Tagen");
  }

  return base;
}

function buildFinal(role: string, cand: string, fit: string, control: string, rk: ComponentKey): string {
  const candName = cand || "Der Kandidat";
  if (fit === "Geeignet") {
    return `${candName} zeigt eine gute Passung für die Rolle ${role}. Der Steuerungsbedarf ist ${control}. Eine stabile Besetzung ist unter diesen Bedingungen wahrscheinlich.`;
  }
  if (fit === "Bedingt geeignet") {
    return `${candName} kann die Rolle ${role} unter Bedingungen ausfüllen. Der Steuerungsbedarf ist ${control}. Die Rolle kann mit gezielter Führung und klarer Struktur stabilisiert werden.`;
  }
  return `${candName} weicht deutlich von den Anforderungen der Rolle ${role} ab. Der Steuerungsbedarf ist ${control}. Eine stabile Besetzung ist unter diesen Bedingungen nur eingeschränkt wahrscheinlich.`;
}
