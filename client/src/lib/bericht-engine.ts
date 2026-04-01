type BG = { imp: number; int: number; ana: number };

type ProfileType = "balanced_all" | "strong_imp" | "strong_ana" | "strong_int" |
  "dominant_imp" | "dominant_ana" | "dominant_int" |
  "light_imp" | "light_ana" | "light_int" |
  "hybrid_imp_ana" | "hybrid_ana_int" | "hybrid_imp_int";

type Intensity = "strong" | "clear" | "light" | "balanced";

type BerichtData = {
  rollencharakter: string;
  dominanteKomponente: string;
  einleitung: string;
  gesamtprofil: string;
  rahmenbedingungen: {
    beschreibung: string;
    verantwortungsfelder: string[];
    erfolgsmessung: string[];
    spannungsfelder_rahmen: string[];
  };
  fuehrungskontext: {
    beschreibung: string;
    wirkungshebel: string[];
    analytische_anforderungen?: string[];
    schlusssatz: string;
  };
  kompetenzanalyse: {
    taetigkeiten_text: string;
    taetigkeiten_anforderungen: string[];
    taetigkeiten_schluss: string;
    human_text: string;
    human_anforderungen: string[];
    human_schluss: string;
  };
  spannungsfelder: string[];
  spannungsfelder_schluss: string;
  risikobewertung: { label: string; bullets: string[]; alltagssatz: string }[];
  fazit: { kernsatz: string; persoenlichkeit: string[]; fehlbesetzung: string; schlusssatz: string };
};

type ProfileInput = {
  beruf: string;
  bereich: string;
  isLeadership: boolean;
  gesamt: BG;
  haupt: BG;
  neben: BG;
  fuehrung: BG;
  rahmen: BG;
  intensity: Intensity;
  profileType: ProfileType;
  fuehrungstyp: string;
  aufgabencharakter: string;
  arbeitslogik: string;
  erfolgsfokusIndices: number[];
  taetigkeiten: any[];
};

const ERFOLGSFOKUS_LABELS = [
  "Ergebnis-/ Umsatzwirkung",
  "Beziehungs- und Netzwerkstabilität",
  "Innovations- & Transformationsleistung",
  "Prozess- und Effizienzqualität",
  "Fachliche Exzellenz / Expertise",
  "Strategische Wirkung / Positionierung",
];

function dominant(bg: BG): { key: "imp" | "int" | "ana"; label: string; value: number } {
  const items = [
    { key: "imp" as const, label: "Impulsiv", value: bg.imp },
    { key: "int" as const, label: "Intuitiv", value: bg.int },
    { key: "ana" as const, label: "Analytisch", value: bg.ana },
  ].sort((a, b) => b.value - a.value);
  return items[0];
}

function secondary(bg: BG): { key: "imp" | "int" | "ana"; label: string; value: number } {
  const items = [
    { key: "imp" as const, label: "Impulsiv", value: bg.imp },
    { key: "int" as const, label: "Intuitiv", value: bg.int },
    { key: "ana" as const, label: "Analytisch", value: bg.ana },
  ].sort((a, b) => b.value - a.value);
  return items[1];
}

function weakest(bg: BG): { key: "imp" | "int" | "ana"; label: string; value: number } {
  const items = [
    { key: "imp" as const, label: "Impulsiv", value: bg.imp },
    { key: "int" as const, label: "Intuitiv", value: bg.int },
    { key: "ana" as const, label: "Analytisch", value: bg.ana },
  ].sort((a, b) => b.value - a.value);
  return items[2];
}

function kompLabel(k: string): string {
  if (k === "imp" || k === "Impulsiv" || k === "impulsiv") return "Handlungs- und Umsetzungskompetenz";
  if (k === "int" || k === "Intuitiv" || k === "intuitiv") return "Sozial- und Beziehungskompetenz";
  return "Fach- und Methodenkompetenz";
}

function kompShort(k: string): string {
  if (k === "imp" || k === "Impulsiv") return "Umsetzungsstärke";
  if (k === "int" || k === "Intuitiv") return "Beziehungsfähigkeit";
  return "Strukturkompetenz";
}

function kompAdj(k: string): string {
  if (k === "imp" || k === "Impulsiv") return "umsetzungsorientiert";
  if (k === "int" || k === "Intuitiv") return "beziehungsorientiert";
  return "strukturorientiert";
}

function intensityAdj(intensity: Intensity): string {
  switch (intensity) {
    case "strong": return "klar dominiert";
    case "clear": return "deutlich ausgerichtet";
    case "light": return "erkennbar ausgerichtet";
    case "balanced": return "vielseitig angelegt";
  }
}

function hochItems(taetigkeiten: any[]): any[] {
  return (taetigkeiten || []).filter((t: any) => t.niveau === "Hoch");
}

function mittelItems(taetigkeiten: any[]): any[] {
  return (taetigkeiten || []).filter((t: any) => t.niveau === "Mittel");
}

export function generateBerichtLocal(input: ProfileInput): BerichtData {
  const { beruf, bereich, isLeadership, gesamt, haupt, neben, fuehrung, rahmen, intensity, profileType, fuehrungstyp, aufgabencharakter, arbeitslogik, erfolgsfokusIndices, taetigkeiten } = input;
  const dom = dominant(gesamt);
  const sec = secondary(gesamt);
  const wk = weakest(gesamt);
  const hoch = hochItems(taetigkeiten);
  const mittel = mittelItems(taetigkeiten);
  const hauptDom = dominant(haupt);
  const nebenDom = dominant(neben);
  const rahmenDom = dominant(rahmen);
  const erfolgsfokusLabels = erfolgsfokusIndices.map(i => ERFOLGSFOKUS_LABELS[i]).filter(Boolean);
  const hauptTaetigkeiten = (taetigkeiten || []).filter((t: any) => t.kategorie === "haupt");
  const nebenTaetigkeiten = (taetigkeiten || []).filter((t: any) => t.kategorie === "neben");

  const rollencharakter = buildRollencharakter(profileType, intensity, arbeitslogik);
  const dominanteKomponente = buildDominanteKomponente(profileType, dom, sec);
  const einleitung = buildEinleitung(beruf, bereich, dom, sec, intensity, isLeadership, aufgabencharakter);
  const gesamtprofil = buildGesamtprofil(gesamt, dom, sec, wk, intensity, profileType, beruf);
  const rahmenbedingungen = buildRahmenbedingungen(beruf, rahmen, rahmenDom, aufgabencharakter, arbeitslogik, fuehrungstyp, erfolgsfokusLabels, isLeadership);
  const fuehrungskontext = buildFuehrungskontext(beruf, fuehrung, fuehrungstyp, isLeadership, dom);
  const kompetenzanalyse = buildKompetenzanalyse(beruf, haupt, neben, hauptDom, nebenDom, hauptTaetigkeiten, nebenTaetigkeiten, hoch, mittel, isLeadership);
  const spannungsfelder = buildSpannungsfelder(profileType, dom, sec, wk, isLeadership, beruf);
  const spannungsfelder_schluss = `Die gleichzeitige Steuerung dieser Spannungsfelder erfordert eine Persönlichkeit, die zwischen ${kompShort(dom.key)} und ${kompShort(sec.key)} flexibel wechseln kann, ohne dabei an Klarheit zu verlieren.`;
  const risikobewertung = buildRisikobewertung(profileType, dom, sec, wk, beruf, isLeadership);
  const fazit = buildFazit(beruf, dom, sec, wk, intensity, profileType, isLeadership, hoch);

  return {
    rollencharakter, dominanteKomponente, einleitung, gesamtprofil,
    rahmenbedingungen, fuehrungskontext, kompetenzanalyse,
    spannungsfelder, spannungsfelder_schluss, risikobewertung, fazit,
  };
}

function buildRollencharakter(profileType: ProfileType, intensity: Intensity, arbeitslogik: string): string {
  const base: Record<string, string> = {
    "balanced_all": "Vielseitig-ausgewogen",
    "strong_imp": "Steuernd-umsetzungsorientiert",
    "strong_ana": "Strategisch-analytisch",
    "strong_int": "Beziehungsorientiert-vermittelnd",
    "dominant_imp": "Umsetzungsorientiert mit Steuerungsfokus",
    "dominant_ana": "Analytisch-strukturiert",
    "dominant_int": "Beziehungsgestaltend mit Teamfokus",
    "light_imp": "Handlungsorientiert mit Breitenprofil",
    "light_ana": "Strukturorientiert mit Breitenprofil",
    "light_int": "Beziehungsorientiert mit Breitenprofil",
    "hybrid_imp_ana": "Umsetzungsstark mit analytischer Absicherung",
    "hybrid_ana_int": "Analytisch-empathisch",
    "hybrid_imp_int": "Durchsetzungsstark mit Beziehungskompetenz",
  };
  let result = base[profileType] || "Vielseitig";
  if (arbeitslogik) {
    if (arbeitslogik.includes("Umsetzung")) result += " · Umsetzungslogik";
    else if (arbeitslogik.includes("Menschen")) result += " · Beziehungslogik";
    else if (arbeitslogik.includes("Daten")) result += " · Prozesslogik";
  }
  return result;
}

function buildDominanteKomponente(profileType: ProfileType, dom: ReturnType<typeof dominant>, sec: ReturnType<typeof secondary>): string {
  if (profileType === "balanced_all") return "Ausgeglichenes Dreiklangprofil";
  if (profileType.startsWith("hybrid_")) {
    return `${dom.label}-${sec.label} Doppelstruktur`;
  }
  if (profileType.startsWith("strong_")) return `${dom.label} stark dominant`;
  if (profileType.startsWith("dominant_")) return `${dom.label} mit ${sec.label.toLowerCase()}er Ergänzung`;
  return `${dom.label} mit ${sec.label.toLowerCase()}er Tendenz`;
}

function buildEinleitung(beruf: string, bereich: string, dom: ReturnType<typeof dominant>, sec: ReturnType<typeof secondary>, intensity: Intensity, isLeadership: boolean, aufgabencharakter: string): string {
  const p1 = `Die Wirkung ${isLeadership ? "einer Führungskraft" : "einer Fachkraft"} in der Rolle ${beruf}${bereich ? ` (${bereich})` : ""} entscheidet sich nicht allein über fachliches Wissen oder Berufserfahrung. Entscheidend ist, ob die Arbeitsweise der Person zur Rollenanforderung passt.`;

  const aufgChar = aufgabencharakter ? ` Der Aufgabencharakter ist ${aufgabencharakter.toLowerCase()}.` : "";
  const p2 = `Diese Rolle ist ${intensityAdj(intensity)} auf ${kompLabel(dom.key)} und verlangt eine Persönlichkeit, die ${kompShort(dom.key)} als natürliche Stärke mitbringt.${aufgChar} Ergänzend wird ${kompLabel(sec.key)} benötigt, um die Rolle vollständig auszufüllen.`;

  const p3 = `Passt die Arbeitsweise nicht zur Rolle, zeigt sich das im Alltag durch steigenden Abstimmungsbedarf, Konflikte im Team und wachsenden Führungsaufwand. Eine Fehlbesetzung wird damit nicht nur zum personellen, sondern zum wirtschaftlichen Risiko.`;

  const p4 = `Dieser Bericht beschreibt die strukturellen Anforderungen der Rolle, unabhängig von Lebenslauf, Branchenerfahrung oder bisherigen Leistungskennzahlen.`;

  return `${p1}\n\n${p2}\n\n${p3}\n\n${p4}`;
}

function buildGesamtprofil(gesamt: BG, dom: ReturnType<typeof dominant>, sec: ReturnType<typeof secondary>, wk: ReturnType<typeof weakest>, intensity: Intensity, profileType: ProfileType, beruf: string): string {
  let p1: string;
  if (profileType === "balanced_all") {
    p1 = `Das Gesamtprofil der Rolle ${beruf} zeigt eine ausgeglichene Verteilung aller drei Kompetenzbereiche. Keine einzelne Kompetenz dominiert, stattdessen wird eine breite Vielseitigkeit gefordert. Die Rolle verlangt gleichermassen Handlungsfähigkeit, Beziehungsgestaltung und analytisches Denken.`;
  } else if (profileType.startsWith("hybrid_")) {
    p1 = `Das Gesamtprofil zeigt eine Doppelstruktur: ${dom.label} und ${sec.label} bilden ein gleichwertiges Tandem. Beide Kompetenzen sind nahezu gleichauf und prägen die Rollenanforderung gemeinsam. ${wk.label} ist erkennbar nachrangig und spielt eine ergänzende Rolle.`;
  } else {
    const adj = intensityAdj(intensity);
    p1 = `Das Gesamtprofil der Rolle ist ${adj} auf ${kompLabel(dom.key)}. Mit einem Anteil von ${dom.value} Prozent bildet die ${dom.label.toLowerCase()}e Komponente den Kern der Rollenanforderung.`;
  }

  let p2: string;
  if (profileType === "balanced_all") {
    p2 = `Für die Besetzung bedeutet das: Gesucht wird keine Spezialisierung, sondern eine Persönlichkeit mit breiter Kompetenz in allen drei Bereichen. Einseitigkeit in einer Richtung wäre für diese Rolle problematisch.`;
  } else {
    p2 = `Die sekundäre Kompetenz ${sec.label} stabilisiert das Profil und sorgt für die notwendige Ergänzung. ${wk.label} ist in dieser Rolle erkennbar nachrangig, sollte aber als Basiskompetenz vorhanden sein, um blinde Flecken zu vermeiden.`;
  }

  const p3 = profileType === "balanced_all"
    ? `Leistungsfähigkeit entsteht über die Fähigkeit, situativ zwischen allen drei Arbeitsweisen zu wechseln und je nach Anforderung das passende Vorgehen zu wählen.`
    : `Leistungsfähigkeit entsteht in erster Linie über ${kompShort(dom.key)}, ergänzt durch ${kompShort(sec.key)} als ausgleichende Komponente.`;

  return `${p1}\n\n${p2}\n\n${p3}`;
}

function buildRahmenbedingungen(beruf: string, rahmen: BG, rahmenDom: ReturnType<typeof dominant>, aufgabencharakter: string, arbeitslogik: string, fuehrungstyp: string, erfolgsfokusLabels: string[], isLeadership: boolean) {
  const aufgText = aufgabencharakter ? `Der Aufgabencharakter der Rolle ist ${aufgabencharakter.toLowerCase()}.` : "";
  const logikText = arbeitslogik ? ` Die Arbeitslogik ist ${arbeitslogik.toLowerCase()}.` : "";
  const fuehrText = isLeadership ? ` Die Rolle umfasst ${fuehrungstyp.toLowerCase()}.` : " Die Rolle hat keine direkte Führungsverantwortung.";

  const beschreibung = `Die Rahmenbedingungen der Rolle ${beruf} stehen im Zeichen von ${kompLabel(rahmenDom.key)}. ${aufgText}${logikText}${fuehrText}\n\nDie Anforderungen verlangen eine klare Ausrichtung auf ${kompShort(rahmenDom.key)} im täglichen Arbeitsumfeld. Entscheidungswege, Prioritäten und Qualitätsmassstäbe werden durch diese Rahmenbedingungen definiert.`;

  const verantwortungsfelder = [
    `Steuerung und Priorisierung der operativen ${kompAdj(rahmenDom.key)}en Aufgaben`,
    `Sicherstellung der Ergebnisqualität im Verantwortungsbereich`,
    isLeadership ? `Führung und Entwicklung des zugeordneten Teams` : `Eigenverantwortliche Aufgabensteuerung und Abstimmung mit Schnittstellen`,
    `Einhaltung von Standards und Prozessvorgaben`,
    `Kommunikation und Abstimmung mit internen und externen Stakeholdern`,
    ...(erfolgsfokusLabels.length > 0 ? [`Fokus auf ${erfolgsfokusLabels[0]}`] : []),
  ];

  const erfolgsmessung = [
    ...(erfolgsfokusLabels.length > 0 ? erfolgsfokusLabels.map(e => `Beitrag zu ${e}`) : []),
    "Qualität und Konsistenz der Arbeitsergebnisse",
    "Termintreue und Prozessstabilität",
    isLeadership ? "Teamperformance und Mitarbeiterbindung" : "Zuverlässigkeit in der Zusammenarbeit",
    "Proaktive Problemlösung und Eskalationsfähigkeit",
  ];

  const spannungsfelder_rahmen = buildRahmenSpannungsfelder(rahmenDom.key, aufgabencharakter, isLeadership);

  return { beschreibung, verantwortungsfelder, erfolgsmessung, spannungsfelder_rahmen };
}

function buildRahmenSpannungsfelder(domKey: string, aufgabencharakter: string, isLeadership: boolean): string[] {
  const fields: string[] = [];
  if (domKey === "imp") {
    fields.push("Geschwindigkeit vs. Sorgfalt", "Ergebnisorientierung vs. Prozesstreue");
    if (isLeadership) fields.push("Durchsetzung vs. Teamakzeptanz");
    else fields.push("Eigeninitiative vs. Abstimmungsbedarf");
  } else if (domKey === "int") {
    fields.push("Beziehungspflege vs. Ergebnisorientierung", "Konsensorientierung vs. Entscheidungsgeschwindigkeit");
    if (isLeadership) fields.push("Empathie vs. Konsequenz");
    else fields.push("Teamorientierung vs. Eigenbeitrag");
  } else {
    fields.push("Gründlichkeit vs. Pragmatismus", "Standardtreue vs. Flexibilität");
    if (isLeadership) fields.push("Kontrolle vs. Vertrauen");
    else fields.push("Detailtiefe vs. Gesamtblick");
  }
  if (aufgabencharakter?.includes("strategisch")) fields.push("Langfristplanung vs. Tagesgeschäft");
  return fields;
}

function buildFuehrungskontext(beruf: string, fuehrung: BG, fuehrungstyp: string, isLeadership: boolean, dom: ReturnType<typeof dominant>) {
  if (isLeadership) {
    const fDom = dominant(fuehrung);
    const fSec = secondary(fuehrung);
    const beschreibung = `Die Rolle ${beruf} umfasst ${fuehrungstyp}. Die Führungskompetenz zeigt sich vor allem in ${kompLabel(fDom.key)}. Die Führungswirkung entsteht vorrangig über ${kompShort(fDom.key)}, ergänzt durch ${kompShort(fSec.key)}.\n\nDas bedeutet: ${fDom.key === "imp"
      ? "Die Führungskraft setzt auf klare Vorgaben, schnelle Entscheidungen und verbindliche Ergebnisorientierung. Das Team erlebt eine direktive, tempoorientierte Führung."
      : fDom.key === "int"
        ? "Die Führungskraft wirkt über Beziehungsgestaltung, Vertrauen und Konsensbildung. Das Team erlebt eine partizipative, empathische Führung."
        : "Die Führungskraft arbeitet über Strukturen, Prozesse und fachliche Expertise. Das Team erlebt eine methodische, standardorientierte Führung."
    }`;

    const wirkungshebel = fDom.key === "imp"
      ? ["Klare Zielvorgaben und Priorisierung", "Entscheidungsgeschwindigkeit und Verbindlichkeit", "Leistungsorientierte Steuerung", "Eskalationsfähigkeit bei Zielabweichungen"]
      : fDom.key === "int"
        ? ["Vertrauensaufbau und Beziehungsstabilität", "Moderieren und Vermitteln bei Konflikten", "Individuelle Förderung und Stärkenorientierung", "Teamkultur und Zusammenhalt"]
        : ["Prozessklarheit und Strukturvorgaben", "Fachliche Qualitätssicherung", "Datenbasierte Entscheidungsfindung", "Systematische Leistungssteuerung"];

    const analytische_anforderungen = [
      `Regelmässige Reflexion der eigenen Führungswirkung`,
      `Bewusster Ausgleich der ${kompShort(weakest(fuehrung).key)} als Entwicklungsfeld`,
      `Strukturierte Feedbackprozesse mit dem Team`,
    ];

    const schlusssatz = `Fehlt diese Führungsstruktur, verliert das Team die ${kompShort(fDom.key)} als Orientierung. Die Folge: Unsicherheit, fehlende Priorisierung und sinkende Ergebnisqualität.`;

    return { beschreibung, wirkungshebel, analytische_anforderungen, schlusssatz };
  } else {
    const beschreibung = `Die Rolle ${beruf} hat keine direkte Führungsverantwortung. Einfluss und Wirkung entstehen nicht über hierarchische Steuerung, sondern über fachliche Kompetenz, Zuverlässigkeit und die Qualität der Zusammenarbeit.\n\nDer zentrale Wirkungshebel der Rolle ist ${kompShort(dom.key)}. Die Rolleninhaberin bzw. der Rolleninhaber konzentriert sich auf direkte Leistung und indirekte Einflussnahme.`;

    const wirkungshebel = [
      "Fachliche Überzeugungskraft und Expertise",
      "Qualität und Zuverlässigkeit der eigenen Arbeit",
      "Konstruktive Zusammenarbeit mit Schnittstellen",
    ];

    const schlusssatz = `Die Wirkung der Rolle konzentriert sich auf direkte Leistung, Expertise und die Fähigkeit, über fachliche Qualität Einfluss zu nehmen.`;

    return { beschreibung, wirkungshebel, schlusssatz };
  }
}

function buildKompetenzanalyse(beruf: string, haupt: BG, neben: BG, hauptDom: ReturnType<typeof dominant>, nebenDom: ReturnType<typeof dominant>, hauptTaetigkeiten: any[], nebenTaetigkeiten: any[], hoch: any[], mittel: any[], isLeadership: boolean) {
  const hochHaupt = hauptTaetigkeiten.filter((t: any) => t.niveau === "Hoch");
  const hochNeben = nebenTaetigkeiten.filter((t: any) => t.niveau === "Hoch");

  let taetigkeiten_text: string;
  if (hochHaupt.length > 0) {
    const namen = hochHaupt.map((t: any) => t.name).join(", ");
    taetigkeiten_text = `Das Tätigkeitsprofil der Rolle ${beruf} wird bestimmt von ${kompLabel(hauptDom.key)}. Besonders kritisch für den Rollenerfolg sind: ${namen}. Diese Tätigkeiten erfordern eine individuelle Eignungsprüfung und sind im Besetzungsprozess entscheidend.\n\nDie weiteren Tätigkeiten ergänzen das Profil auf Standardniveau und sind grundsätzlich erlernbar.`;
  } else {
    taetigkeiten_text = `Das Tätigkeitsprofil der Rolle ${beruf} wird bestimmt von ${kompLabel(hauptDom.key)}. Die Anforderungen verteilen sich auf Standardniveau und verlangen eine solide Grundkompetenz in den definierten Bereichen.\n\nKeine einzelne Tätigkeit wurde als besonders kritisch eingestuft, was auf ein breites, aber nicht hochspezialisiertes Anforderungsprofil hinweist.`;
  }

  const taetigkeiten_anforderungen = hauptTaetigkeiten.slice(0, 5).map((t: any) =>
    `${t.name} (${t.kompetenz}${t.niveau === "Hoch" ? ", hohe Priorität" : ""})`
  );

  const taetigkeiten_schluss = hochHaupt.length >= 3
    ? `Die Kombination mehrerer hochpriorisierter Tätigkeiten macht das Anforderungsprofil besonders anspruchsvoll. Fehlende Passung in einem dieser Bereiche wirkt sich unmittelbar auf die Rollenleistung aus.`
    : `Die Tätigkeitsstruktur erfordert eine Persönlichkeit mit ${kompShort(hauptDom.key)} als zentraler Stärke.`;

  let human_text: string;
  if (hochNeben.length > 0) {
    const namen = hochNeben.map((t: any) => t.name).join(", ");
    human_text = `Die Humankompetenzen der Rolle basieren auf ${kompLabel(nebenDom.key)}. Besonders kritisch sind: ${namen}. Diese sozialen und persönlichen Fähigkeiten sind für die Wirksamkeit in der Rolle unverzichtbar.\n\n${isLeadership ? "Als Führungskraft" : "In der Zusammenarbeit"} entscheiden diese Kompetenzen darüber, wie effektiv die fachlichen Fähigkeiten im Team zur Wirkung kommen.`;
  } else {
    human_text = `Die Humankompetenzen der Rolle basieren auf ${kompLabel(nebenDom.key)}. Die Anforderungen liegen auf Standardniveau und verlangen eine solide Grundlage im zwischenmenschlichen Bereich.\n\n${isLeadership ? "Als Führungskraft" : "Im Arbeitsalltag"} sind diese Kompetenzen die Basis für konstruktive Zusammenarbeit und stabile Arbeitsbeziehungen.`;
  }

  const human_anforderungen = nebenTaetigkeiten.slice(0, 5).map((t: any) =>
    `${t.name} (${t.kompetenz}${t.niveau === "Hoch" ? ", hohe Priorität" : ""})`
  );

  const human_schluss = `Die Humankompetenzen sind kein Zusatz, sondern fester Bestandteil der Rollenwirkung. Fehlt ${kompShort(nebenDom.key)} als Basis, verliert die Rolle ihre soziale Verankerung.`;

  return { taetigkeiten_text, taetigkeiten_anforderungen, taetigkeiten_schluss, human_text, human_anforderungen, human_schluss };
}

function buildSpannungsfelder(profileType: ProfileType, dom: ReturnType<typeof dominant>, sec: ReturnType<typeof secondary>, wk: ReturnType<typeof weakest>, isLeadership: boolean, beruf: string): string[] {
  const fields: string[] = [];

  if (dom.key === "imp") {
    fields.push("Tempo vs. Qualität", "Entscheidungsfreude vs. Absicherung");
    if (isLeadership) fields.push("Durchsetzung vs. Mitarbeiterbindung");
  } else if (dom.key === "int") {
    fields.push("Harmonie vs. Konfrontation", "Konsens vs. Geschwindigkeit");
    if (isLeadership) fields.push("Empathie vs. klare Kante");
  } else {
    fields.push("Perfektion vs. Pragmatismus", "Kontrolle vs. Delegation");
    if (isLeadership) fields.push("Detailsteuerung vs. strategischer Überblick");
  }

  if (profileType.startsWith("hybrid_")) {
    fields.push(`${dom.label} vs. ${sec.label} Prioritätenkonflikt`);
  }

  if (wk.key === "imp") fields.push("Reflexion vs. Handlungsdruck");
  else if (wk.key === "int") fields.push("Sachlogik vs. Beziehungspflege");
  else fields.push("Intuition vs. Strukturbedarf");

  return fields;
}

function buildRisikobewertung(profileType: ProfileType, dom: ReturnType<typeof dominant>, sec: ReturnType<typeof secondary>, wk: ReturnType<typeof weakest>, beruf: string, isLeadership: boolean) {
  const risks: { label: string; bullets: string[]; alltagssatz: string }[] = [];

  if (dom.key === "imp" || dom.value >= 45) {
    risks.push({
      label: "Tempo-Risiko",
      bullets: [
        "Zu schnelle Entscheidungen ohne ausreichende Prüfung",
        "Vernachlässigung von Prozessen und Standards zugunsten von Geschwindigkeit",
        isLeadership ? "Team kann das Tempo nicht mithalten, Frustration entsteht" : "Abstimmungsdefizite durch zu eigenständiges Vorgehen",
      ],
      alltagssatz: `Im Arbeitsalltag besteht die Gefahr, dass ${kompShort("imp")} zur Gewohnheit wird und notwendige Reflexionsphasen übersprungen werden.`,
    });
  }

  if (wk.key === "int" || (dom.key !== "int" && sec.key !== "int")) {
    risks.push({
      label: "Beziehungs-Risiko",
      bullets: [
        "Zwischenmenschliche Spannungen werden zu spät erkannt",
        isLeadership ? "Team fühlt sich nicht ausreichend gehört oder wertgeschätzt" : "Zusammenarbeit leidet unter fehlender Beziehungspflege",
        "Konflikte eskalieren, weil frühe Signale übersehen werden",
      ],
      alltagssatz: `Konkret zeigt sich das darin, dass sachliche Korrektheit über Beziehungsstabilität gestellt wird, bis Teamkonflikte offen ausbrechen.`,
    });
  }

  if (wk.key === "ana" || (dom.key !== "ana" && sec.key !== "ana")) {
    risks.push({
      label: "Struktur-Risiko",
      bullets: [
        "Mangelnde Dokumentation und Nachvollziehbarkeit von Entscheidungen",
        "Prozesse werden umgangen oder improvisiert",
        isLeadership ? "Qualitätsstandards werden nicht konsistent eingehalten" : "Fehlende Systematik führt zu wiederholten Fehlern",
      ],
      alltagssatz: `In der Praxis bedeutet das, dass fehlende Struktur zunächst als Flexibilität interpretiert wird, bis Qualitätsprobleme sichtbar werden.`,
    });
  }

  if (wk.key === "imp" || (dom.key !== "imp" && sec.key !== "imp")) {
    risks.push({
      label: "Umsetzungs-Risiko",
      bullets: [
        "Entscheidungen werden verzögert oder aufgeschoben",
        "Zu viel Analyse oder Abstimmung bremst die Umsetzung",
        isLeadership ? "Team wartet auf klare Ansagen, die ausbleiben" : "Wichtige Aufgaben werden nicht rechtzeitig priorisiert",
      ],
      alltagssatz: `Auf Dauer besteht die Gefahr, dass Gründlichkeit zum Selbstzweck wird und die operative Geschwindigkeit leidet.`,
    });
  }

  return risks.slice(0, 3);
}

function buildFazit(beruf: string, dom: ReturnType<typeof dominant>, sec: ReturnType<typeof secondary>, wk: ReturnType<typeof weakest>, intensity: Intensity, profileType: ProfileType, isLeadership: boolean, hoch: any[]) {
  let kernsatz: string;
  if (profileType === "balanced_all") {
    kernsatz = `Die Rolle ${beruf} verlangt eine vielseitige Persönlichkeit, die alle drei Kompetenzbereiche auf solidem Niveau mitbringt und situativ zwischen verschiedenen Arbeitslogiken wechseln kann.`;
  } else {
    kernsatz = `Die Rolle ${beruf} verlangt eine Persönlichkeit, die ${kompShort(dom.key)} als natürliche Stärke mitbringt und gleichzeitig ${kompShort(sec.key)} als stabilisierende Ergänzung einsetzt.`;
  }

  const persoenlichkeit = [
    `${kompShort(dom.key)} als zentrale Arbeitsweise lebt und authentisch verkörpert`,
    `${kompShort(sec.key)} als ergänzende Kompetenz bewusst einsetzt`,
    ...(hoch.length > 0 ? [`die kritischen Anforderungen (${hoch.slice(0, 3).map((t: any) => t.name).join(", ")}) auf hohem Niveau erfüllt`] : []),
    isLeadership ? `Führungswirkung über ${kompShort(dom.key)} entfaltet und dabei das Team mitnimmt` : `eigenverantwortlich arbeitet und über fachliche Qualität Einfluss nimmt`,
    `bewusst mit dem eigenen Entwicklungsfeld ${kompShort(wk.key)} umgeht`,
  ];

  const fehlbesetzung = `Eine Fehlbesetzung zeigt sich nicht sofort, sondern schleichend: Zunächst kompensiert die Person über Erfahrung und Anpassung. Nach wenigen Monaten werden Passungsprobleme sichtbar, wenn die natürliche Arbeitsweise nicht zur Rollenanforderung passt. Die Folge sind steigende Steuerungskosten, sinkende Ergebnisqualität und wachsende Unzufriedenheit auf beiden Seiten.`;

  const schlusssatz = `Eine passende Besetzung der Rolle ${beruf} sichert nachhaltige Leistungsfähigkeit, reduziert Führungsaufwand und schafft die Grundlage für stabile Ergebnisse. Die bioLogic Strukturanalyse liefert die Entscheidungsgrundlage, um genau diese Passung zu erkennen.`;

  return { kernsatz, persoenlichkeit, fehlbesetzung, schlusssatz };
}
