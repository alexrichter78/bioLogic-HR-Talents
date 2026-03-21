import type { Triad, ComponentKey } from "./jobcheck-engine";
import { computeTeamCheckV3, type TeamCheckV3Input, type TeamCheckV3Result, type TeamGoal } from "./teamcheck-v3-engine";
import { getPrimaryKey, getSecondaryKey } from "./teamcheck-v2-engine";

export interface V4WirkungBlock {
  title: string;
  text: string;
}

export interface V4AlltagsBox {
  title: string;
  text: string;
}

export interface TeamCheckV4Result {
  roleTitle: string;
  roleType: "leadership" | "member";
  roleLabel: string;
  teamGoal: TeamGoal;
  teamGoalLabel: string;

  gesamtbewertung: string;
  systemwirkung: string;
  steuerungsaufwand: string;
  risikoniveau: string;
  kurzfazit: string;
  ersteEmpfehlung: string;

  teamProfile: Triad;
  personProfile: Triad;
  teamLabel: string;
  personLabel: string;
  teamPersonAbweichung: number;
  teamGoalAbweichung: number | null;
  personGoalAbweichung: number | null;

  ausgangslage: string;
  gemeinsameStaerke: string;
  kritischeAbweichung: string;
  bedeutungFunktionsziel: string;
  warumFazit: string;

  wirkungTitle: string;
  wirkungBlocks: V4WirkungBlock[];

  chancen: string[];
  risiken: string[];
  chancenRisikenFazit: string;

  ohneBesetzung: string[];

  alltagsboxen: V4AlltagsBox[];

  kurzfristigeWirkung: string;
  mittelfristigeWirkung: string;
  ergebnisqualitaet: string;
  umsetzungsgeschwindigkeit: string;
  leistungFazit: string;

  druckverhalten: string;
  handlungsempfehlungen: { title: string; text: string }[];

  v3: TeamCheckV3Result;
}

const GOAL_LABELS: Record<string, string> = {
  umsetzung: "Umsetzung und Ergebnisse",
  analyse: "Analyse und Struktur",
  zusammenarbeit: "Zusammenarbeit und Kommunikation",
};

const COMP_NAMES: Record<ComponentKey, string> = {
  impulsiv: "Umsetzung und Tempo",
  intuitiv: "Zusammenarbeit und Kommunikation",
  analytisch: "Analyse und Struktur",
};

export function computeTeamCheckV4(input: TeamCheckV3Input & { roleType?: string }): TeamCheckV4Result {
  const v3 = computeTeamCheckV3(input);

  const inputRoleType = (input as any).roleType;
  const isLeader = inputRoleType === "fuehrung" ? true : inputRoleType === "teammitglied" ? false : v3.roleType === "leadership";
  const roleLabel = isLeader ? "Führungskraft" : "Teammitglied";

  const gesamtbewertung = v3.passung === "Passend" ? "Stimmig"
    : v3.passung === "Bedingt passend" ? "Bedingt stimmig" : "Kritisch";

  const totalGap = v3.teamPersonAbweichung;
  const teamPrimary = getPrimaryKey(input.teamProfile);
  const personPrimary = getPrimaryKey(input.personProfile);
  const sameDominance = teamPrimary === personPrimary;

  let systemwirkung: string;
  if (gesamtbewertung === "Stimmig") {
    systemwirkung = sameDominance ? "Stabilisiert" : "Ergänzt";
  } else if (gesamtbewertung === "Bedingt stimmig") {
    systemwirkung = sameDominance ? "Ergänzt" : "Verändert";
  } else {
    systemwirkung = "Erzeugt Spannung";
  }

  let risikoniveau: string;
  if (v3.integrationsrisiko === "gering") risikoniveau = "niedrig";
  else if (v3.integrationsrisiko === "mittel") risikoniveau = "erhöht";
  else risikoniveau = "hoch";

  const teamGoalLabel = v3.teamGoal ? (GOAL_LABELS[v3.teamGoal] || "") : "Kein Funktionsziel";

  const kurzfazit = buildKurzfazit(gesamtbewertung, isLeader, systemwirkung, v3.steuerungsaufwand);
  const ersteEmpfehlung = buildErsteEmpfehlung(gesamtbewertung, isLeader);

  const ausgangslage = buildAusgangslage(v3, isLeader, teamGoalLabel);
  const gemeinsameStaerke = buildGemeinsameStaerke(v3, sameDominance, teamPrimary, personPrimary);
  const kritischeAbweichung = buildKritischeAbweichung(v3, sameDominance, teamPrimary, personPrimary);
  const bedeutungFunktionsziel = buildBedeutungFunktionsziel(v3);
  const warumFazit = "Das Ergebnis entsteht nicht nur aus der Person selbst, sondern aus dem Zusammenspiel von Person, Teamstruktur und Ziel der Abteilung. Je näher diese drei Ebenen zusammenliegen, desto leichter wird Zusammenarbeit. Je stärker sie auseinanderlaufen, desto mehr Führung, Klärung und Abstimmung werden notwendig.";

  const { wirkungTitle, wirkungBlocks } = buildWirkungImSystem(v3, isLeader, sameDominance, teamPrimary, personPrimary, gesamtbewertung);

  const chancen = buildChancen(v3, isLeader, sameDominance);
  const risiken = buildRisiken(v3, isLeader, gesamtbewertung);
  const chancenRisikenFazit = "Die Konstellation ist nicht nur mit Risiken verbunden. Entscheidend ist, ob Unterschiede aktiv geführt werden oder unklar bleiben. Frühe Klarheit erhöht die Chance, dass Ergänzung entsteht statt Reibung.";

  const ohneBesetzung = buildOhneBesetzung(v3, isLeader, sameDominance, teamPrimary, personPrimary);

  const alltagsboxen = buildAlltagsboxen(v3, isLeader, gesamtbewertung, sameDominance);

  const { kurzfristigeWirkung, mittelfristigeWirkung, ergebnisqualitaet, umsetzungsgeschwindigkeit: uGeschwindigkeit, leistungFazit } =
    buildLeistung(v3, isLeader, gesamtbewertung);

  const druckverhalten = buildDruckverhalten(v3, isLeader);
  const handlungsempfehlungen = buildEmpfehlungen(v3, isLeader, gesamtbewertung);

  return {
    roleTitle: v3.roleTitle,
    roleType: isLeader ? "leadership" : "member",
    roleLabel,
    teamGoal: v3.teamGoal,
    teamGoalLabel,
    gesamtbewertung,
    systemwirkung,
    steuerungsaufwand: v3.steuerungsaufwand,
    risikoniveau,
    kurzfazit,
    ersteEmpfehlung,
    teamProfile: v3.teamProfile,
    personProfile: v3.personProfile,
    teamLabel: v3.teamLabel,
    personLabel: v3.personLabel,
    teamPersonAbweichung: v3.teamPersonAbweichung,
    teamGoalAbweichung: v3.teamGoalAbweichung,
    personGoalAbweichung: v3.personGoalAbweichung,
    ausgangslage,
    gemeinsameStaerke,
    kritischeAbweichung,
    bedeutungFunktionsziel,
    warumFazit,
    wirkungTitle,
    wirkungBlocks,
    chancen,
    risiken,
    chancenRisikenFazit,
    ohneBesetzung,
    alltagsboxen,
    kurzfristigeWirkung,
    mittelfristigeWirkung,
    ergebnisqualitaet,
    umsetzungsgeschwindigkeit: uGeschwindigkeit,
    leistungFazit,
    druckverhalten,
    handlungsempfehlungen,
    v3,
  };
}

function buildKurzfazit(bewertung: string, isLeader: boolean, sw: string, aufwand: string): string {
  const context = isLeader ? "Führungskraft" : "Teammitglied";
  if (bewertung === "Stimmig") {
    return isLeader
      ? "Die Führungskraft bringt eine Arbeitsweise mit, die gut zum bestehenden Team passt. Der Integrations- und Steuerungsaufwand ist gering. Die Voraussetzungen für eine wirksame Zusammenarbeit sind gegeben."
      : "Die Person bringt eine Arbeitsweise mit, die gut an das bestehende Team anschliesst. Der Integrationsaufwand ist gering und die Voraussetzungen für eine reibungsarme Zusammenarbeit sind gegeben.";
  }
  if (bewertung === "Bedingt stimmig") {
    return isLeader
      ? "Die Führungskraft bringt Ansätze mit, die zum Team passen, zeigt aber auch relevante Abweichungen in der Arbeitsweise. Gezielte Steuerung und bewusste Kommunikation sind notwendig, um die Führungswirkung zu entfalten."
      : "Die Person bringt eine Arbeitsweise mit, die in Teilen gut an das bestehende Team anschliesst, an anderen Stellen aber spürbar abweicht. Dadurch entstehen sowohl Ergänzungschancen als auch erhöhter Abstimmungsbedarf. Entscheidend wird sein, ob Rolle, Erwartungen und Zusammenarbeit früh genug klar geführt werden.";
  }
  return isLeader
    ? "Die Führungslogik weicht deutlich von der Teamstruktur ab. Der Integrations- und Steuerungsaufwand ist entsprechend erhöht. Ohne aktive Begleitung besteht ein hohes Risiko für Spannungen und Leistungseinbussen."
    : "Die strukturelle Abweichung zwischen Person und Team ist deutlich. Der Integrations- und Steuerungsaufwand ist entsprechend erhöht. Ohne aktive Begleitung besteht ein hohes Risiko für Reibung und Leistungseinbussen.";
}

function buildErsteEmpfehlung(bewertung: string, isLeader: boolean): string {
  if (bewertung === "Stimmig") {
    return isLeader
      ? "Klare Rollenerwartungen setzen und die ersten Wochen gezielt für den Beziehungsaufbau nutzen."
      : "Stabile Rahmenbedingungen sicherstellen und die Einarbeitung begleitend unterstützen.";
  }
  if (bewertung === "Bedingt stimmig") {
    return isLeader
      ? "Führungsrolle vor Fachrolle priorisieren. Erwartungen in den ersten 30 Tagen explizit klären und regelmässige Feedbackpunkte setzen."
      : "Rolle und Erwartungen in den ersten 30 Tagen explizit klären. Regelmässige Abstimmung und gezielte Unterstützung einplanen.";
  }
  return isLeader
    ? "Engmaschige Begleitung in den ersten 90 Tagen einplanen. Entscheidungsräume, Kommunikationswege und Feedbackstrukturen von Anfang an sichtbar machen."
    : "Engmaschige Begleitung in den ersten 90 Tagen einplanen. Teamregeln, Schnittstellen und Erwartungen von Anfang an explizit machen.";
}

function buildAusgangslage(v3: TeamCheckV3Result, isLeader: boolean, goalLabel: string): string {
  const context = isLeader ? "als Führungskraft" : "als Teammitglied";
  let base = `Die Person wird ${context} in ein ${v3.teamLabel}-Team eingebunden. Das persönliche Profil ist ${v3.personLabel}.`;
  if (v3.teamGoal) {
    base += ` Das Funktionsziel der Abteilung liegt im Bereich ${goalLabel}.`;
  }
  base += ` Die Team–Person-Abweichung beträgt ${v3.teamPersonAbweichung} Punkte.`;
  return base;
}

function buildGemeinsameStaerke(v3: TeamCheckV3Result, sameDom: boolean, teamPrim: ComponentKey, personPrim: ComponentKey): string {
  if (sameDom) {
    return `Person und Team teilen dieselbe Primärausrichtung (${COMP_NAMES[teamPrim]}). Das schafft eine gemeinsame Arbeitslogik und erleichtert die gegenseitige Anschlussfähigkeit. Erwartungen an Tempo, Kommunikation und Prioritäten sind von Beginn an ähnlich ausgerichtet.`;
  }
  const teamSec = getSecondaryKey(v3.teamProfile);
  const personSec = getSecondaryKey(v3.personProfile);
  if (teamSec === personPrim || personSec === teamPrim) {
    return `Obwohl die Primärausrichtungen unterschiedlich sind, gibt es Überschneidungen in den Nebenkomponenten. Die Person bringt als Nebenkomponente ${COMP_NAMES[teamPrim]} mit, was einen Anknüpfungspunkt an die Teamlogik bietet.`;
  }
  return `Die stärkste Verbindung liegt in der grundsätzlichen Bereitschaft zur Zusammenarbeit. Auch wenn die Primärausrichtungen unterschiedlich sind, können gezielte Absprachen und klare Rollenverteilung eine produktive Basis schaffen.`;
}

function buildKritischeAbweichung(v3: TeamCheckV3Result, sameDom: boolean, teamPrim: ComponentKey, personPrim: ComponentKey): string {
  if (sameDom && v3.teamPersonAbweichung <= 20) {
    return "Die Abweichungen sind gering und betreffen vor allem die Gewichtung der Nebenkomponenten. Im Alltag sollten diese Unterschiede kaum spürbar sein.";
  }
  if (sameDom) {
    return `Trotz gleicher Primärausrichtung bestehen relevante Unterschiede in der Gewichtung der Nebenkomponenten. Diese können sich in der Praxis durch unterschiedliche Herangehensweisen bei Detailentscheidungen oder in Stresssituationen zeigen.`;
  }
  return `Die grösste Abweichung liegt in der Primärausrichtung: Das Team priorisiert ${COMP_NAMES[teamPrim]}, die Person ${COMP_NAMES[personPrim]}. Das kann im Alltag zu unterschiedlichen Erwartungen an Tempo, Kommunikation und Prioritäten führen.`;
}

function buildBedeutungFunktionsziel(v3: TeamCheckV3Result): string {
  if (!v3.teamGoal) return "Es wurde kein spezifisches Funktionsziel definiert. Die Bewertung basiert ausschliesslich auf der strukturellen Passung zwischen Person und Team.";
  if (v3.strategicFit === "passend") return "Das Funktionsziel verstärkt die Passung: Die Person arbeitet primär in der Richtung, die auch die Abteilung braucht. Entstehende Unterschiede zum Team können dadurch als strategisch sinnvolle Ergänzung bewertet werden.";
  if (v3.strategicFit === "teilweise") return "Das Funktionsziel wird durch die Person als Nebenkomponente abgedeckt. Das bedeutet einen begrenzten, aber relevanten Beitrag in Richtung des Ziels. Die entstehende Wirkung hängt davon ab, wie bewusst diese Teilqualität eingesetzt wird.";
  return "Das Funktionsziel verstärkt die Reibung: Die Person zeigt keine primäre Ausrichtung auf das definierte Ziel. Die Abweichung betrifft damit sowohl die teamdynamische als auch die strategische Ebene.";
}

function buildWirkungImSystem(v3: TeamCheckV3Result, isLeader: boolean, sameDom: boolean, teamPrim: ComponentKey, personPrim: ComponentKey, bewertung: string): { wirkungTitle: string; wirkungBlocks: V4WirkungBlock[] } {
  if (isLeader) {
    const fuehrungsstil = personPrim === "analytisch"
      ? "strukturiert und regelorientiert. Entscheidungen werden sorgfältig abgewogen, Prozesse klar definiert."
      : personPrim === "impulsiv"
        ? "direkt und ergebnisorientiert. Entscheidungen werden schnell getroffen, Tempo hat Priorität."
        : "beziehungsorientiert und kommunikativ. Der Fokus liegt auf Einbindung, Austausch und Teamzusammenhalt.";

    const anschluss = sameDom
      ? "Der Führungsstil passt grundsätzlich zur Teamlogik. Das erleichtert den Zugang und die Akzeptanz im Team."
      : `Der Führungsstil weicht von der Teamlogik ab. Das Team priorisiert ${COMP_NAMES[teamPrim]}, die Führungskraft ${COMP_NAMES[personPrim]}. Das erfordert bewusste Anpassung, um Akzeptanz aufzubauen.`;

    const spannungsfelder: string[] = [];
    if (personPrim === "impulsiv") {
      spannungsfelder.push("Zu viel operative Facharbeit statt strategischer Führung");
      spannungsfelder.push("Zu schnelles Entscheiden ohne ausreichende Einbindung");
    }
    if (personPrim === "analytisch") {
      spannungsfelder.push("Zu viel Kontrolle und zu wenig Vertrauen in Eigenverantwortung");
      spannungsfelder.push("Verzögertes Entscheiden durch übermässige Analyse");
    }
    if (personPrim === "intuitiv") {
      spannungsfelder.push("Zu wenig Rollenklarheit durch beziehungsorientierte Führung");
      spannungsfelder.push("Zu spätes Durchgreifen bei notwendigen Entscheidungen");
    }
    if (bewertung === "Kritisch") {
      spannungsfelder.push("Fehlende Übereinstimmung zwischen Führungslogik und Teamerwartung");
    }
    spannungsfelder.push("Zu wenig Feedback oder zu spätes Eingreifen bei Problemen");

    const fuehrungsbedarf = sameDom
      ? "Das Team braucht vor allem Kontinuität und klare Orientierung. Die Führungskraft kann hier gut anknüpfen."
      : `Das Team braucht primär ${COMP_NAMES[teamPrim]}. Die Führungskraft muss bewusst entscheiden, wie viel eigene Prägung eingebracht wird und wo Anpassung notwendig ist.`;

    return {
      wirkungTitle: "Was diese Person als Führungskraft auslöst",
      wirkungBlocks: [
        { title: "Voraussichtliche Führungswirkung", text: `Der Führungsstil der Person ist ${fuehrungsstil}` },
        { title: "Anschluss an das bestehende Team", text: anschluss },
        { title: "Typische Spannungsfelder", text: spannungsfelder.join(". ") + "." },
        { title: "Führungsbedarf des Systems", text: fuehrungsbedarf },
      ],
    };
  }

  const wirkungStruktur = sameDom
    ? "Die Person verstärkt die bestehende Teamlogik. Das bringt Stabilität und Vorhersehbarkeit, kann aber auch bestehende Einseitigkeiten vertiefen."
    : bewertung === "Kritisch"
      ? "Die Person bringt eine deutlich andere Arbeitslogik mit. Das kann zu Reibung und Irritation führen, aber auch bisher fehlende Perspektiven ergänzen."
      : "Die Person bringt eine ergänzende Arbeitslogik mit. Das kann neue Impulse setzen, erfordert aber bewusste Integration.";

  const anschluss = sameDom
    ? "Die Person findet voraussichtlich schnell Zugang zum Team, da die Arbeitslogiken ähnlich sind. Die Einarbeitung dürfte reibungsarm verlaufen."
    : bewertung === "Kritisch"
      ? "Die Integration könnte stocken, da Person und Team unterschiedliche Prioritäten und Arbeitsweisen haben. Ohne aktive Begleitung besteht das Risiko, dass die Person isoliert bleibt."
      : "Die Person kann Zugang finden, braucht aber bewusste Einbindung. Unterschiede in der Arbeitsweise können anfangs zu Missverständnissen führen.";

  const rollenWirkung = sameDom
    ? "Die Person macht bestehende Abläufe stabiler und vorhersehbarer."
    : "Die Person könnte bestehende Abläufe in Frage stellen oder anders priorisieren. Das kann produktiv sein, wenn es geführt wird.";

  const balanceWirkung = sameDom
    ? "Die bestehende Teambalance wird verstärkt. Ergänzende Perspektiven bleiben weiterhin unterrepräsentiert."
    : `Die Person verschiebt das Teamgleichgewicht in Richtung ${COMP_NAMES[personPrim]}. Das verändert die Teamdynamik und kann sowohl bereichernd als auch destabilisierend wirken.`;

  return {
    wirkungTitle: "Was diese Person im Team auslöst",
    wirkungBlocks: [
      { title: "Wirkung auf die bestehende Teamstruktur", text: wirkungStruktur },
      { title: "Wirkung auf Zusammenarbeit und Anschlussfähigkeit", text: anschluss },
      { title: "Wirkung auf Rollen und Erwartungen", text: rollenWirkung },
      { title: "Wirkung auf die bestehende Balance", text: balanceWirkung },
    ],
  };
}

function buildChancen(v3: TeamCheckV3Result, isLeader: boolean, sameDom: boolean): string[] {
  const chancen: string[] = [];
  if (sameDom) {
    chancen.push("Schnelle Anschlussfähigkeit durch ähnliche Arbeitslogik und gemeinsame Prioritäten.");
    chancen.push("Stärkung der bestehenden Teamstärken und Erhöhung der Verlässlichkeit.");
  } else {
    chancen.push("Ergänzung bisher fehlender Perspektiven und Kompetenzen im Team.");
    chancen.push("Möglichkeit, blinde Flecken im Team sichtbar zu machen und neue Impulse zu setzen.");
  }
  if (isLeader) {
    chancen.push("Chance, durch klare Führung bestehende Teamdynamiken gezielt weiterzuentwickeln.");
    chancen.push("Möglichkeit, Entscheidungsprozesse und Verantwortlichkeiten neu zu ordnen.");
  } else {
    chancen.push("Positiver Einfluss auf die Teamkultur durch neue Herangehensweisen.");
    chancen.push("Möglichkeit, bestehende Lücken in der operativen Umsetzung zu schliessen.");
  }
  if (v3.strategicFit === "passend") {
    chancen.push("Strategische Verstärkung: Die Person arbeitet primär in der Richtung des Funktionsziels.");
  }
  return chancen.slice(0, 5);
}

function buildRisiken(v3: TeamCheckV3Result, isLeader: boolean, bewertung: string): string[] {
  const risiken: string[] = [];
  if (bewertung === "Kritisch") {
    risiken.push("Hohes Risiko für wiederkehrende Missverständnisse und Abstimmungsprobleme.");
    risiken.push("Gefahr von Vertrauensverlust und sinkender Motivation im Team.");
    risiken.push("Erhöhtes Risiko für verdeckte Konflikte und Lagerbildung.");
  } else if (bewertung === "Bedingt stimmig") {
    risiken.push("Erhöhter Abstimmungsaufwand in den ersten Monaten.");
    risiken.push("Risiko, dass unterschiedliche Erwartungen zu Frustration führen.");
  } else {
    risiken.push("Gefahr einer zu starken Gleichförmigkeit, die Innovation bremsen kann.");
  }
  if (isLeader) {
    risiken.push("Risiko, dass die Führungskraft im operativen Modus verbleibt statt strategisch zu führen.");
    risiken.push("Gefahr, dass notwendige Veränderungen zu langsam oder zu schnell umgesetzt werden.");
  } else {
    risiken.push("Risiko, dass die Integration zu wenig aktiv begleitet wird.");
    if (bewertung !== "Stimmig") {
      risiken.push("Gefahr, dass frühe Spannungen ausgesessen statt adressiert werden.");
    }
  }
  return risiken.slice(0, 5);
}

function buildOhneBesetzung(v3: TeamCheckV3Result, isLeader: boolean, sameDom: boolean, teamPrim: ComponentKey, personPrim: ComponentKey): string[] {
  const items: string[] = [];
  if (isLeader) {
    items.push("Bestehende Führungsdefizite oder -vakanzen bleiben ungelöst.");
    items.push("Stabilität bleibt möglicherweise erhalten, aber ohne Weiterentwicklung.");
    if (!sameDom) {
      items.push("Die Chance auf neue Impulse und veränderte Dynamik wird verpasst.");
    }
    items.push("Entscheidungsstaus, Rollenunklarheit oder fehlende Richtung können bestehen bleiben.");
    items.push("Eine notwendige Veränderung wird möglicherweise nur vertagt, nicht vermieden.");
  } else {
    if (!sameDom) {
      items.push(`Die Perspektive ${COMP_NAMES[personPrim]} bleibt im Team weiterhin unterrepräsentiert.`);
    }
    items.push("Bestehende Aufgabenlücken oder Überlastungen bleiben ungelöst.");
    items.push("Das Team bleibt zwar ruhiger, aber auch unvollständiger.");
    if (sameDom) {
      items.push("Die Einseitigkeit des Teams wird nicht korrigiert — blinde Flecken bleiben bestehen.");
    }
    items.push("Nichtbesetzen ist keine neutrale Entscheidung. Auch die bestehende Struktur hat Folgen.");
  }
  return items.slice(0, 5);
}

function buildAlltagsboxen(v3: TeamCheckV3Result, isLeader: boolean, bewertung: string, sameDom: boolean): V4AlltagsBox[] {
  const boxes: V4AlltagsBox[] = [];

  if (bewertung === "Stimmig") {
    boxes.push({
      title: "Zusammenarbeit und Kommunikation",
      text: "Die Zusammenarbeit dürfte von Beginn an reibungsarm verlaufen. Absprachen und Abstimmungen folgen einer ähnlichen Logik, sodass wenig Klärungsbedarf entsteht.",
    });
    boxes.push({
      title: "Tempo und Prioritäten",
      text: "Person und Team setzen voraussichtlich ähnliche Prioritäten. Entscheidungen werden in einem vergleichbaren Tempo getroffen.",
    });
    boxes.push({
      title: "Abstimmung und Verantwortlichkeit",
      text: isLeader
        ? "Die Rollenverteilung dürfte schnell klar werden. Die Führungskraft kann sich auf strategische Steuerung konzentrieren."
        : "Die Rollenverteilung dürfte sich schnell einspielen. Zuständigkeiten werden intuitiv verstanden.",
    });
    boxes.push({
      title: "Typische Reibungspunkte",
      text: "Nennenswerte Reibungspunkte sind bei dieser Konstellation nicht zu erwarten. Aufmerksamkeit verdient eher die Gefahr zu grosser Gleichförmigkeit.",
    });
  } else if (bewertung === "Bedingt stimmig") {
    boxes.push({
      title: "Zusammenarbeit und Kommunikation",
      text: "Die Zusammenarbeit startet grundsätzlich anschlussfähig, braucht aber bewusste Abstimmung. Unterschiedliche Erwartungen an Kommunikationsform oder -häufigkeit können zu Irritationen führen.",
    });
    boxes.push({
      title: "Tempo und Prioritäten",
      text: "Person und Team haben teilweise unterschiedliche Vorstellungen von Tempo und Dringlichkeit. Das erfordert regelmässige Klärung, welche Themen Priorität haben.",
    });
    boxes.push({
      title: "Abstimmung und Verantwortlichkeit",
      text: isLeader
        ? "Die Führungsrolle muss aktiv eingenommen werden. Ohne klare Erwartungen an Entscheidungswege entstehen Unsicherheiten im Team."
        : "Abstimmungen werden häufiger nötig, weil Person und Team unterschiedliche Erwartungen an Vorgehen und Verantwortlichkeit haben.",
    });
    boxes.push({
      title: "Umgang mit Regeln und Freiräumen",
      text: sameDom
        ? "Die Person bewegt sich innerhalb der bestehenden Teamlogik, nutzt aber Freiräume anders als erwartet."
        : "Die Person braucht möglicherweise andere Leitplanken als das Team gewohnt ist. Das erfordert explizite Klärung.",
    });
    boxes.push({
      title: "Typische Reibungspunkte",
      text: "Im Alltag können Missverständnisse bei Prioritäten und Verantwortung entstehen. Ohne klare Zuständigkeiten steigt der informelle Abstimmungsaufwand.",
    });
  } else {
    boxes.push({
      title: "Zusammenarbeit und Kommunikation",
      text: "Die Zusammenarbeit wird von Beginn an Klärungsbedarf mit sich bringen. Unterschiedliche Kommunikationsstile und Erwartungen treffen aufeinander.",
    });
    boxes.push({
      title: "Tempo und Prioritäten",
      text: "Person und Team haben deutlich unterschiedliche Vorstellungen von Tempo und Dringlichkeit. Das führt voraussichtlich zu Frustration auf beiden Seiten.",
    });
    boxes.push({
      title: "Abstimmung und Verantwortlichkeit",
      text: isLeader
        ? "Die Führungsrolle wird von Anfang an herausgefordert. Ohne sofortige Klärung der Entscheidungswege drohen Autoritätskonflikte."
        : "Ohne klare Zuständigkeiten entstehen schnell Missverständnisse. Die Person braucht von Anfang an eine klare Orientierung.",
    });
    boxes.push({
      title: "Umgang mit Regeln und Freiräumen",
      text: "Die Person bewegt sich in einer grundlegend anderen Logik als das Team. Das erfordert explizite Leitplanken und regelmässige Rückkopplung.",
    });
    boxes.push({
      title: "Typische Reibungspunkte",
      text: "Konflikte um Prioritäten, Kommunikation und Entscheidungswege sind wahrscheinlich. Ohne aktive Steuerung eskalieren diese Reibungspunkte schnell.",
    });
  }
  return boxes;
}

function buildLeistung(v3: TeamCheckV3Result, isLeader: boolean, bewertung: string) {
  let kurzfristigeWirkung: string;
  let mittelfristigeWirkung: string;
  let ergebnisqualitaet: string;
  let umsetzungsgeschwindigkeit: string;
  let leistungFazit: string;

  if (bewertung === "Stimmig") {
    kurzfristigeWirkung = "In den ersten Wochen ist eine schnelle Wirksamkeit zu erwarten. Die Person kann sich rasch einarbeiten und produktiv beitragen.";
    mittelfristigeWirkung = isLeader
      ? "Bei guter Rollenklärung kann die Führungskraft das Team mittelfristig stabilisieren und weiterentwickeln."
      : "Bei guter Integration stabilisiert die Person das Team und trägt verlässlich zu den Ergebnissen bei.";
    ergebnisqualitaet = "Die Ergebnisqualität dürfte stabil bleiben oder sich leicht verbessern. Die ähnliche Arbeitslogik reduziert Fehlerquellen durch Missverständnisse.";
    umsetzungsgeschwindigkeit = "Die Umsetzungsgeschwindigkeit bleibt hoch, da wenig Abstimmungsaufwand entsteht.";
    leistungFazit = "Gute Passung senkt Reibungskosten und ermöglicht schnelle Produktivität.";
  } else if (bewertung === "Bedingt stimmig") {
    kurzfristigeWirkung = "In den ersten Wochen ist mit einer Eingewöhnungsphase zu rechnen. Die Person wird produktiv beitragen, braucht aber Orientierung und Abstimmung.";
    mittelfristigeWirkung = isLeader
      ? "Bei guter Führungsarbeit kann die Konstellation mittelfristig Ergänzungspotenzial freisetzen. Bei schlechter Steuerung drohen wiederkehrende Spannungen."
      : "Bei gezielter Integration können die ergänzenden Stärken der Person mittelfristig die Teamleistung steigern. Ohne Steuerung bleiben Reibungsverluste bestehen.";
    ergebnisqualitaet = "Ergänzende Unterschiede können die Ergebnisqualität steigern, wenn sie bewusst genutzt werden. Ungeklärte Unterschiede kosten Energie und Fokus.";
    umsetzungsgeschwindigkeit = "Die Umsetzungsgeschwindigkeit kann anfangs sinken, da mehr Abstimmung notwendig ist. Mittelfristig kann sie sich normalisieren oder sogar steigen.";
    leistungFazit = "Ergänzende Unterschiede können Leistung steigern — wenn sie geführt werden. Ungeklärte Unterschiede kosten Energie, Fokus und Vertrauen.";
  } else {
    kurzfristigeWirkung = "In den ersten Wochen ist mit erheblichem Einarbeitungs- und Klärungsaufwand zu rechnen. Die Produktivität wird anfangs deutlich eingeschränkt sein.";
    mittelfristigeWirkung = isLeader
      ? "Ohne engmaschige Begleitung drohen mittelfristig dauerhafte Spannungen, sinkende Motivation und Vertrauensverlust im Team."
      : "Ohne aktive Integration drohen mittelfristig Isolation, sinkende Motivation und dauerhafte Leistungseinbussen.";
    ergebnisqualitaet = "Die Ergebnisqualität ist gefährdet, da Missverständnisse und Abstimmungsprobleme die Fehleranfälligkeit erhöhen.";
    umsetzungsgeschwindigkeit = "Die Umsetzungsgeschwindigkeit wird spürbar sinken. Der erhöhte Abstimmungsaufwand bindet Ressourcen, die für die eigentliche Arbeit fehlen.";
    leistungFazit = "Ungeklärte Unterschiede kosten Energie, Fokus und Vertrauen. Ohne aktive Steuerung sinken Motivation und Ergebnisqualität.";
  }

  return { kurzfristigeWirkung, mittelfristigeWirkung, ergebnisqualitaet, umsetzungsgeschwindigkeit, leistungFazit };
}

function buildDruckverhalten(v3: TeamCheckV3Result, isLeader: boolean): string {
  let base = v3.stress.controlled;
  if (v3.stress.uncontrolled) {
    base += "\n\n" + v3.stress.uncontrolled;
  }
  if (isLeader) {
    base += "\n\nGerade unter Druck werden typische Führungsfehler sichtbar: operative Rückfälle, Entscheidungsschwäche, zu viel Kontrolle, zu wenig Feedback oder fehlende Unterstützung. Diese Muster verstärken sich, wenn Rolle und Erwartungen nicht frühzeitig geklärt werden.";
  } else {
    base += "\n\nUnter zunehmendem Arbeitsdruck können sich unterschiedliche Arbeitsweisen verstärken. Dadurch entstehen im Alltag Risiken für Abstimmung, Zusammenarbeit und Vertrauen. Frühzeitige Klärung von Erwartungen und Zuständigkeiten kann diese Dynamik abfedern.";
  }
  return base;
}

function buildEmpfehlungen(v3: TeamCheckV3Result, isLeader: boolean, bewertung: string): { title: string; text: string }[] {
  const items: { title: string; text: string }[] = [];

  items.push({
    title: "Rolle klären",
    text: isLeader
      ? "Die Führungsrolle muss von Beginn an klar definiert sein. Führung vor Facharbeit priorisieren und Entscheidungsräume sichtbar machen."
      : "Die Rolle und die damit verbundenen Erwartungen sollten von Beginn an explizit gemacht werden. Zuständigkeiten und Schnittstellen klar benennen.",
  });

  items.push({
    title: "Erwartungen konkret machen",
    text: "Was wird in den ersten 30 Tagen erwartet? Was in 90 Tagen? Konkrete Ziele und Meilensteine helfen, Orientierung zu geben und Fortschritt messbar zu machen.",
  });

  items.push({
    title: "Zusammenarbeit aktiv steuern",
    text: isLeader
      ? "Regelmässige Einzelgespräche und Team-Check-ins fest verankern. Die Führungskraft braucht Feedback zur Wirkung ihres Führungsstils."
      : "Onboarding und Anschluss aktiv begleiten. Teamregeln und Schnittstellen explizit machen, damit die Person schnell Zugang findet.",
  });

  items.push({
    title: "Frühe Feedbackpunkte setzen",
    text: bewertung === "Stimmig"
      ? "Auch bei guter Passung sind regelmässige Rückmeldungen wichtig, um blinde Flecken zu vermeiden und die Zusammenarbeit weiterzuentwickeln."
      : "Regelmässiges Feedback in den ersten Wochen ist entscheidend. Frühe Spannungen nicht aussitzen, sondern aktiv ansprechen und klären.",
  });

  items.push({
    title: "Wirkung nach 30–60 Tagen prüfen",
    text: "Nach den ersten Wochen sollte bewusst reflektiert werden: Stimmt die Passung im Alltag? Wo gibt es Reibung? Was läuft besser als erwartet? Diese Reflexion schafft die Grundlage für gezielte Anpassungen.",
  });

  return items;
}
