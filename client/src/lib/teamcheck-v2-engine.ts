export interface Triad {
  impulsiv: number;
  intuitiv: number;
  analytisch: number;
}

export type ComponentKey = "impulsiv" | "intuitiv" | "analytisch";

export interface TensionItem {
  key: ComponentKey;
  title: string;
  teamValue: number;
  personValue: number;
  interpretation: string;
}

export interface ImpactItem {
  title: string;
  text: string;
}

export interface StressTexts {
  controlled: string;
  uncontrolled: string;
}

export interface AdviceItem {
  title: string;
  text: string;
}

export interface TeamCheckV2Result {
  passung: string;
  systemwirkung: string;
  teamLabel: string;
  personLabel: string;
  teamText: string;
  personText: string;
  systemwirkungText: string;
  reasons: string[];
  tension: TensionItem[];
  impacts: ImpactItem[];
  stress: StressTexts;
  chances: string[];
  risks: string[];
  advice: AdviceItem[];
  roleLabel: string;
  roleType: "leadership" | "member";
}

function round(v: number): number {
  return Math.round(Number(v || 0));
}

function diff(a: number, b: number): number {
  return Math.abs(round(a) - round(b));
}

function sortProfile(profile: Triad): { key: ComponentKey; value: number }[] {
  return [
    { key: "impulsiv" as ComponentKey, value: round(profile.impulsiv) },
    { key: "intuitiv" as ComponentKey, value: round(profile.intuitiv) },
    { key: "analytisch" as ComponentKey, value: round(profile.analytisch) },
  ].sort((a, b) => b.value - a.value);
}

function getPrimaryKey(profile: Triad): ComponentKey {
  return sortProfile(profile)[0].key;
}

function getSecondaryKey(profile: Triad): ComponentKey {
  return sortProfile(profile)[1].key;
}

function componentBusinessName(key: ComponentKey): string {
  if (key === "impulsiv") return "Umsetzung und Tempo";
  if (key === "intuitiv") return "Zusammenarbeit und Kommunikation";
  return "Struktur und Analyse";
}

function getBioLogicType(profile: Triad): string {
  const i = round(profile.impulsiv);
  const n = round(profile.intuitiv);
  const a = round(profile.analytisch);
  const dIN = diff(i, n);
  const dIA = diff(i, a);
  const dNA = diff(n, a);

  if (dIN <= 5 && dIA <= 5 && dNA <= 5) return "alle_gleich";

  if (i > n && i > a && dNA <= 5) return "impulsiv_mit_gleicher_nebenlage";
  if (n > i && n > a && dIA <= 5) return "intuitiv_mit_gleicher_nebenlage";
  if (a > i && a > n && dIN <= 5) return "analytisch_mit_gleicher_nebenlage";

  const sorted = sortProfile(profile).map((x) => x.key).join("_");

  if (sorted === "impulsiv_intuitiv_analytisch") return "impulsiv_intuitiv_analytisch";
  if (sorted === "impulsiv_analytisch_intuitiv") return "impulsiv_analytisch_intuitiv";
  if (sorted === "intuitiv_impulsiv_analytisch") return "intuitiv_impulsiv_analytisch";
  if (sorted === "intuitiv_analytisch_impulsiv") return "intuitiv_analytisch_impulsiv";
  if (sorted === "analytisch_impulsiv_intuitiv") return "analytisch_impulsiv_intuitiv";
  if (sorted === "analytisch_intuitiv_impulsiv") return "analytisch_intuitiv_impulsiv";

  if (dIN <= 5 && i > a && n > a) return "impulsiv_intuitiv_doppeldominanz";
  if (dIA <= 5 && i > n && a > n) return "impulsiv_analytisch_doppeldominanz";
  if (dNA <= 5 && n > i && a > i) return "intuitiv_analytisch_doppeldominanz";

  return "alle_gleich";
}

const PROFILE_LABELS: Record<string, string> = {
  impulsiv_intuitiv_analytisch: "Handlungsfokus mit Beziehungsanteil",
  impulsiv_analytisch_intuitiv: "Handlungsfokus mit Strukturanteil",
  intuitiv_impulsiv_analytisch: "Beziehungsfokus mit Umsetzungsanteil",
  intuitiv_analytisch_impulsiv: "Beziehungsfokus mit Strukturanteil",
  analytisch_impulsiv_intuitiv: "Strukturfokus mit Umsetzungsanteil",
  analytisch_intuitiv_impulsiv: "Strukturfokus mit Beziehungsanteil",
  impulsiv_intuitiv_doppeldominanz: "Doppeldominanz aus Tempo und Kommunikation",
  impulsiv_analytisch_doppeldominanz: "Doppeldominanz aus Tempo und Struktur",
  intuitiv_analytisch_doppeldominanz: "Doppeldominanz aus Kommunikation und Struktur",
  impulsiv_mit_gleicher_nebenlage: "Klare Umsetzungsorientierung mit ausgeglichener Nebenlage",
  intuitiv_mit_gleicher_nebenlage: "Klare Kommunikationsorientierung mit ausgeglichener Nebenlage",
  analytisch_mit_gleicher_nebenlage: "Klare Strukturausrichtung mit ausgeglichener Nebenlage",
  alle_gleich: "Ausgeglichenes Profil",
};

const PROFILE_TEXTS: Record<string, string> = {
  impulsiv_intuitiv_analytisch: `Die Person arbeitet in erster Linie über Umsetzung und Tempo. Themen werden zügig aufgegriffen, Entscheidungen werden eher nach vorne als nach hinten gedacht. Der zweite Schwerpunkt liegt in Zusammenarbeit und Kommunikation. Dadurch bleibt die Person trotz hoher Dynamik im Kontakt mit dem Umfeld anschlussfähig. Struktur und Analyse sind vorhanden, stehen jedoch nicht im Vordergrund.\n\nIm Arbeitsalltag zeigt sich dieses Profil häufig in hoher Aktivität, klarer Eigeninitiative und einer spürbaren Vorwärtsbewegung. Chancen entstehen dort, wo Geschwindigkeit, Präsenz und direkte Wirkung wichtig sind. Risiken entstehen dort, wo saubere Nachverfolgung, konsequente Dokumentation und disziplinierte Prozessführung dauerhaft nötig sind.`,
  impulsiv_analytisch_intuitiv: `Die Person arbeitet in erster Linie über Umsetzung und Tempo. Der zweite Schwerpunkt liegt auf Struktur und Analyse. Dadurch verbindet sie hohe Aktivität mit einem gewissen Blick für Zielklarheit, Prioritäten und sachliche Ordnung. Zusammenarbeit und Kommunikation sind vorhanden, stehen aber nicht an erster Stelle.\n\nIm Arbeitsalltag zeigt sich dieses Profil oft in konsequenter Zielorientierung, klarem Antrieb und einer guten Fähigkeit, Themen nicht nur anzustoßen, sondern auch geordnet zu steuern. Chancen liegen in Durchsetzung, Fokus und Verbindlichkeit. Risiken entstehen dort, wo Abstimmung oder sensible Teamkommunikation zu wenig Raum bekommen.`,
  intuitiv_impulsiv_analytisch: `Die Person arbeitet in erster Linie über Zusammenarbeit und Kommunikation. Der zweite Schwerpunkt liegt auf Umsetzung und Tempo. Dadurch verbindet sie Kontaktstärke mit Aktivität und wirkt häufig verbindend, motivierend und beweglich. Struktur und Analyse sind vorhanden, aber nicht die tragende Leitlinie.\n\nIm Alltag zeigt sich dieses Profil häufig in kundenorientierter Kommunikation, schneller Kontaktaufnahme und hoher Wirkung in Gesprächen. Chancen liegen in Netzwerken, Beziehungsaufbau und positiver Präsenz. Risiken entstehen dort, wo konsequente Nachhaltung, analytische Tiefe und Prozessdisziplin dauerhaft gefragt sind.`,
  intuitiv_analytisch_impulsiv: `Die Person arbeitet in erster Linie über Zusammenarbeit und Kommunikation. Der zweite Schwerpunkt liegt auf Struktur und Analyse. Dadurch verbindet sie Beziehungsstärke mit einem geordneten, reflektierten Vorgehen. Tempo und spontane Umsetzung sind vorhanden, stehen aber nicht im Vordergrund.\n\nIm Arbeitsalltag zeigt sich dieses Profil oft in ruhiger Gesprächsführung, guter Bedarfsaufnahme und einer sauberen Abstimmung mit dem Umfeld. Chancen liegen in Vertrauensaufbau, Verlässlichkeit und konsistenter Zusammenarbeit. Risiken entstehen dort, wo schnelle Entscheidungen, harte Priorisierung oder kurzfristiger Umsetzungsdruck gefragt sind.`,
  analytisch_impulsiv_intuitiv: `Die Person arbeitet in erster Linie über Struktur und Analyse. Der zweite Schwerpunkt liegt auf Umsetzung und Tempo. Dadurch bringt sie eine klare Ordnung in Themen, denkt sachlich und zielbezogen und kann Entscheidungen auch konsequent in die Umsetzung bringen. Zusammenarbeit und Kommunikation sind vorhanden, aber nicht der primäre Antrieb.\n\nIm Arbeitsumfeld zeigt sich dieses Profil häufig in sauberer Vorbereitung, klarer Argumentation und disziplinierter Arbeitsweise. Chancen liegen in Qualität, Steuerbarkeit und belastbaren Entscheidungen. Risiken entstehen dort, wo hohe Flexibilität oder spontane Anpassung im Vordergrund stehen.`,
  analytisch_intuitiv_impulsiv: `Die Person arbeitet in erster Linie über Struktur und Analyse. Der zweite Schwerpunkt liegt auf Zusammenarbeit und Kommunikation. Dadurch verbindet sie Klarheit, Sorgfalt und nachvollziehbare Entscheidungen mit einem kooperativen Umgang. Tempo und spontane Umsetzung sind vorhanden, aber nicht die bevorzugte Linie.\n\nIm Arbeitsalltag zeigt sich dieses Profil oft in gut vorbereiteten Gesprächen, klarer Argumentation, verlässlicher Abstimmung und solider Prozessführung. Chancen liegen in Qualität, Stabilität und professioneller Wirkung. Risiken entstehen dort, wenn ein sehr hohes Tempo oder spontane Marktreaktion im Vordergrund stehen.`,
  impulsiv_intuitiv_doppeldominanz: `Die Person zeigt eine Doppeldominanz aus Umsetzung und Kommunikation. Sie bringt sowohl Tempo als auch Kontaktstärke mit. Entscheidungen werden häufig zügig getroffen, gleichzeitig bleibt die Wirkung auf andere wichtig. Struktur und Analyse sind vorhanden, stehen jedoch deutlich im Hintergrund.\n\nIm Arbeitsalltag kann dieses Profil sehr wirksam sein, wenn Aktivität, Sichtbarkeit und Beziehungsarbeit gebraucht werden. Risiken liegen vor allem in nachlassender Ordnung, geringer Dokumentationstiefe und wechselnden Prioritäten unter Druck.`,
  impulsiv_analytisch_doppeldominanz: `Die Person zeigt eine Doppeldominanz aus Umsetzung und Struktur. Sie verbindet Aktivität mit Sachorientierung und arbeitet häufig zugleich entschlossen und klar. Zusammenarbeit und Kommunikation sind vorhanden, haben aber weniger Gewicht als Ergebnisorientierung und Ordnung.\n\nIm Arbeitsalltag kann dieses Profil besonders stark sein, wenn Zielklarheit, Steuerung und Verbindlichkeit gefragt sind. Risiken entstehen dort, wo Abstimmung oder sensible Kommunikation eine größere Rolle spielen.`,
  intuitiv_analytisch_doppeldominanz: `Die Person zeigt eine Doppeldominanz aus Kommunikation und Struktur. Sie verbindet kooperative Zusammenarbeit mit einem geordneten, nachvollziehbaren Vorgehen. Tempo ist vorhanden, aber nicht die bevorzugte erste Reaktion.\n\nIm Arbeitsalltag zeigt sich dieses Profil häufig in verlässlicher Kommunikation, sauberer Vorbereitung und stabiler Zusammenarbeit. Chancen liegen in Qualität, Ruhe und Vertrauensbildung. Risiken entstehen dort, wo ein sehr hohes Umsetzungstempo gefordert ist.`,
  impulsiv_mit_gleicher_nebenlage: `Die Person ist klar auf Umsetzung und Tempo ausgerichtet. Die beiden übrigen Bereiche sind in ähnlicher Stärke vorhanden, konkurrieren aber nicht um die Hauptlinie. Im Zentrum steht das Vorantreiben von Themen, das schnelle Handeln und die direkte Wirkung.\n\nIm Arbeitsalltag zeigt sich dieses Profil in hoher Energie, klarer Eigeninitiative und starkem Vorwärtsdrang. Chancen liegen in Dynamik, Aktivität und sichtbarer Leistung. Risiken entstehen dort, wo das Umfeld mehr Abstimmung, Geduld oder strukturelle Sorgfalt verlangt.`,
  intuitiv_mit_gleicher_nebenlage: `Die Person ist klar auf Zusammenarbeit und Kommunikation ausgerichtet. Die beiden übrigen Bereiche sind in ähnlicher Stärke vorhanden, stehen aber hinter der Hauptlinie zurück. Im Zentrum stehen Beziehung, Austausch, Vertrauen und Wirkung auf Menschen.\n\nIm Arbeitsalltag zeigt sich dieses Profil oft in verbindender Kommunikation, guter Ansprache und einer kooperativen Wirkung im Team. Chancen liegen in Beziehungsaufbau, Integration und Zusammenarbeit. Risiken entstehen dort, wo sehr konsequente Steuerung, Tempo oder harte Priorisierung gefragt sind.`,
  analytisch_mit_gleicher_nebenlage: `Die Person ist klar auf Struktur und Analyse ausgerichtet. Die beiden übrigen Bereiche sind in ähnlicher Stärke vorhanden, aber nicht führend. Im Zentrum stehen Klarheit, Nachvollziehbarkeit, sachliche Prüfung und geordnete Arbeitsweise.\n\nIm Arbeitsalltag zeigt sich dieses Profil oft in Verlässlichkeit, professioneller Vorbereitung und kontrolliertem Vorgehen. Chancen liegen in Qualität, Stabilität und sauberer Steuerung. Risiken entstehen dort, wo spontane Anpassung, hohe Dynamik und offensive Umsetzungsenergie im Vordergrund stehen.`,
  alle_gleich: `Die Person zeigt ein ausgeglichenes Profil. Umsetzung, Kommunikation und Struktur sind in ähnlicher Stärke ausgeprägt. Es gibt keine einseitige Hauptlinie, sondern eine breite Anschlussfähigkeit an unterschiedliche Anforderungen.\n\nIm Arbeitsalltag kann dieses Profil sehr flexibel wirken. Die Person kann sich auf verschiedene Situationen einstellen und unterschiedliche Erwartungen verbinden. Chancen liegen in Vielseitigkeit und Balance. Risiken entstehen dort, wo das Umfeld eine besonders klare Kante oder eine sehr eindeutige Arbeitslogik verlangt.`,
};

function getProfileLabel(profile: Triad): string {
  return PROFILE_LABELS[getBioLogicType(profile)] || "Ausgeglichenes Profil";
}

function getDelta(teamProfile: Triad, personProfile: Triad) {
  return {
    impulsiv: round(personProfile.impulsiv) - round(teamProfile.impulsiv),
    intuitiv: round(personProfile.intuitiv) - round(teamProfile.intuitiv),
    analytisch: round(personProfile.analytisch) - round(teamProfile.analytisch),
  };
}

function getDistanceScore(teamProfile: Triad, personProfile: Triad): number {
  const d = getDelta(teamProfile, personProfile);
  return Math.abs(d.impulsiv) + Math.abs(d.intuitiv) + Math.abs(d.analytisch);
}

function getSystemwirkung(teamProfile: Triad, personProfile: Triad): string {
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);
  const distance = getDistanceScore(teamProfile, personProfile);

  if (distance <= 24) return "Verstärkung";
  if (teamPrimary === personPrimary && distance <= 42) return "Verstärkung";

  if (teamPrimary !== personPrimary) {
    const teamWeakest = sortProfile(teamProfile)[2].key;
    if (personPrimary === teamWeakest) return "Ergänzung";
  }

  if (distance >= 70) return "Transformation";
  return "Spannung";
}

function getPassung(teamProfile: Triad, personProfile: Triad, roleType: string): string {
  const distance = getDistanceScore(teamProfile, personProfile);
  const systemwirkung = getSystemwirkung(teamProfile, personProfile);
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);

  let score = 100;
  score -= Math.min(distance, 80) * 0.65;
  if (teamPrimary !== personPrimary) score -= 8;
  if (systemwirkung === "Spannung") score -= 10;
  if (systemwirkung === "Transformation") score -= 18;
  if (systemwirkung === "Ergänzung") score -= 4;

  if (roleType === "leadership") {
    if (systemwirkung === "Transformation") score -= 8;
    if (diff(teamProfile.analytisch, personProfile.analytisch) > 25) score -= 6;
  }

  if (score >= 76) return "Passend";
  if (score >= 56) return "Bedingt passend";
  return "Kritisch";
}

function normalizeRoleLevel(value: string): "leadership" | "member" {
  const text = String(value || "").toLowerCase();
  if (
    (text.includes("führung") && !text.includes("keine")) ||
    text.includes("fachliche führung") ||
    text.includes("disziplinarische führung") ||
    text.includes("projekt") ||
    text.includes("koordination") ||
    text.includes("leiter") ||
    text.includes("lead")
  ) {
    return "leadership";
  }
  return "member";
}

function getRoleRef(roleTitle: string, lower = false): string {
  const title = String(roleTitle || "die Rolle").trim();
  if (!title) return lower ? "die Rolle" : "Die Rolle";
  return lower ? `die Rolle ${title}` : `Die Rolle ${title}`;
}

function getTeamProfileText(teamProfile: Triad, roleTitle: string): string {
  const type = getBioLogicType(teamProfile);
  const primary = getPrimaryKey(teamProfile);
  const ref = getRoleRef(roleTitle, false);

  if (type === "alle_gleich") {
    return `${ref} trifft auf ein Team mit ausgeglichenem Profil. Umsetzung, Zusammenarbeit und Struktur sind in ähnlicher Stärke vorhanden. Dadurch besteht eine breite Anschlussfähigkeit an unterschiedliche Anforderungen. Gleichzeitig besteht die Gefahr, dass keine Arbeitslogik konsequent genug getragen wird, wenn Prioritäten nicht klar gesetzt werden.`;
  }
  if (primary === "impulsiv") {
    return `${ref} trifft auf ein Team, das vor allem auf Umsetzung und Tempo ausgerichtet ist. Im Alltag zeigt sich dies in hoher Aktivität, schneller Themenbearbeitung und einer klaren Vorwärtsbewegung. Entscheidungen werden eher pragmatisch und zügig getroffen. Das ist besonders wertvoll, wenn sichtbare Ergebnisse und direkte Wirkung gefragt sind. Gleichzeitig steigt das Risiko, dass Abstimmung, Sorgfalt und saubere Nachverfolgung zu wenig Aufmerksamkeit erhalten.`;
  }
  if (primary === "intuitiv") {
    return `${ref} trifft auf ein Team, das vor allem auf Zusammenarbeit und Kommunikation ausgerichtet ist. Im Alltag zeigt sich dies in hoher Abstimmung, starker Beziehungsorientierung und einem eher gemeinsamen als rein individuellen Vorgehen. Das ist besonders wertvoll, wenn Kundennähe, Vertrauen und Teamabstimmung tragende Erfolgsfaktoren sind. Gleichzeitig steigt das Risiko, dass Entscheidungen zu lange abgestimmt werden und klare Prioritäten nicht konsequent genug umgesetzt werden.`;
  }
  return `${ref} trifft auf ein Team, das vor allem auf Struktur und Analyse ausgerichtet ist. Im Alltag zeigt sich dies in geordneten Abläufen, nachvollziehbaren Entscheidungen und einer eher sachlichen Herangehensweise. Das ist besonders wertvoll, wenn Qualität, Verlässlichkeit und saubere Steuerung wichtig sind. Gleichzeitig steigt das Risiko, dass Dynamik und schnelle Umsetzung an Kraft verlieren.`;
}

function buildReasonLines(teamProfile: Triad, personProfile: Triad, roleTitle: string, roleType: string): string[] {
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);
  const delta = getDelta(teamProfile, personProfile);
  const distance = getDistanceScore(teamProfile, personProfile);
  const ref = getRoleRef(roleTitle, false);
  const reasons: string[] = [];

  reasons.push(`${ref} bringt eine andere Arbeitslogik mit als das bestehende Team: Das Team arbeitet stärker über ${componentBusinessName(teamPrimary).toLowerCase()}, die Person stärker über ${componentBusinessName(personPrimary).toLowerCase()}.`);

  if (distance >= 60) {
    reasons.push("Die Abweichung zum Teamprofil ist deutlich. Dadurch ist im Alltag mit spürbarer Reibung zu rechnen.");
  } else if (distance >= 35) {
    reasons.push("Die Person weicht in mehreren Bereichen sichtbar vom Team ab. Das kann bereichernd sein, verlangt aber bewusste Steuerung.");
  } else {
    reasons.push("Die Person liegt in ihrer Arbeitslogik nah am Team. Dadurch ist eine stabile Einbindung grundsätzlich gut möglich.");
  }

  const strongestDelta = ([
    { key: "impulsiv" as ComponentKey, value: Math.abs(delta.impulsiv) },
    { key: "intuitiv" as ComponentKey, value: Math.abs(delta.intuitiv) },
    { key: "analytisch" as ComponentKey, value: Math.abs(delta.analytisch) },
  ] as { key: ComponentKey; value: number }[]).sort((a, b) => b.value - a.value)[0];

  if (strongestDelta.value > 18) {
    const key = strongestDelta.key;
    const teamValue = round(teamProfile[key]);
    const personValue = round(personProfile[key]);
    if (personValue > teamValue) {
      reasons.push(`${componentBusinessName(key)} ist bei der Person deutlich stärker ausgeprägt als im Team. Das verändert Prioritäten und Arbeitsrhythmus spürbar.`);
    } else {
      reasons.push(`${componentBusinessName(key)} ist bei der Person deutlich schwächer ausgeprägt als im Team. Dadurch kann es zu Erwartungsunterschieden im Alltag kommen.`);
    }
  }

  if (roleType === "leadership") {
    reasons.push(`${ref} wirkt in einer Führungsfunktion nicht nur individuell, sondern prägt Entscheidungswege, Prioritäten und die Teamkultur insgesamt.`);
  } else {
    reasons.push(`${ref} wirkt als Teammitglied vor allem über Zusammenarbeit, Abstimmung, Tempo und die alltägliche Integration in das bestehende Team.`);
  }

  return reasons.slice(0, 4);
}

function classifyTension(teamValue: number, personValue: number): string {
  const d = personValue - teamValue;
  const abs = Math.abs(d);
  if (abs <= 8) return "stabil";
  if (abs <= 18) return d > 0 ? "moderat_mehr" : "moderat_weniger";
  return d > 0 ? "deutlich_mehr" : "deutlich_weniger";
}

function getVisualTensionAnalysis(teamProfile: Triad, personProfile: Triad): TensionItem[] {
  return (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map((key) => {
    const teamValue = round(teamProfile[key]);
    const personValue = round(personProfile[key]);
    const status = classifyTension(teamValue, personValue);
    let interpretation = "";

    if (status === "stabil") {
      interpretation = "In diesem Bereich liegt die Person nah am Team. Dadurch ist hier eher Stabilität als Reibung zu erwarten.";
    } else if (status === "moderat_mehr") {
      interpretation = "Die Person bringt in diesem Bereich etwas mehr Stärke ein als das Team. Das kann das Team sinnvoll ergänzen, ohne sofort starken Gegendruck auszulösen.";
    } else if (status === "moderat_weniger") {
      interpretation = "Die Person bringt in diesem Bereich etwas weniger mit als das Team. Das ist grundsätzlich ausgleichbar, wird im Alltag aber sichtbar sein.";
    } else if (status === "deutlich_mehr") {
      interpretation = "Die Person bringt in diesem Bereich deutlich mehr ein als das Team. Hier entsteht ein klarer Veränderungsimpuls.";
    } else {
      interpretation = "Die Person bringt in diesem Bereich deutlich weniger mit als das Team. Hier ist mit spürbaren Erwartungsunterschieden zu rechnen.";
    }

    return { key, title: componentBusinessName(key), teamValue, personValue, interpretation };
  });
}

function getSystemwirkungText(teamProfile: Triad, personProfile: Triad, roleTitle: string, roleType: string): string {
  const systemwirkung = getSystemwirkung(teamProfile, personProfile);
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);
  const ref = getRoleRef(roleTitle, false);

  const intro = roleType === "leadership"
    ? `${ref} wirkt nicht nur als einzelne Besetzung, sondern setzt im Team spürbare Schwerpunkte. Die Arbeitslogik beeinflusst Prioritäten, Entscheidungswege und die Art, wie Leistung im Alltag gesteuert wird.`
    : `${ref} wirkt vor allem über den täglichen Kontakt im Team, über den Arbeitsrhythmus und über die Art, wie Aufgaben im Alltag umgesetzt werden.`;

  if (systemwirkung === "Verstärkung") {
    return `${intro}\n\nDie Konstellation wirkt insgesamt als Verstärkung. ${ref} bringt eine Arbeitslogik mit, die zum Grundmuster des Teams passt. Dadurch werden bestehende Stärken eher ausgebaut als grundlegend verändert.\n\nFür die Rolle bedeutet das: ${componentBusinessName(teamPrimary)} wird durch die Besetzung zusätzlich getragen. Das kann Stabilität, Klarheit und eine schnellere Eingliederung fördern. Gleichzeitig ist darauf zu achten, dass das Team nicht noch einseitiger wird.`;
  }
  if (systemwirkung === "Ergänzung") {
    return `${intro}\n\nDie Konstellation wirkt insgesamt als Ergänzung. ${ref} bringt eine Qualität ins Team, die bisher weniger stark ausgeprägt ist. Dadurch kann das Team breiter, beweglicher und leistungsfähiger werden.\n\nFür die Rolle bedeutet das: Das Team erhält durch die Besetzung mehr Gewicht in ${componentBusinessName(personPrimary).toLowerCase()}. Das ist grundsätzlich eine Chance. Gleichzeitig entsteht eine natürliche Reibung, weil das Team andere Schwerpunkte gewohnt ist. Der Nutzen dieser Ergänzung zeigt sich nur dann voll, wenn Unterschiede erklärt, Erwartungen geklärt und gemeinsame Spielregeln gesetzt werden.`;
  }
  if (systemwirkung === "Transformation") {
    return `${intro}\n\nDie Konstellation wirkt insgesamt als deutliche Veränderung. ${ref} bringt eine Arbeitslogik mit, die das Team spürbar in eine neue Richtung ziehen kann. Das ist keine kleine Ergänzung, sondern ein klarer Eingriff in das bestehende System.\n\nFür die Rolle bedeutet das: ${componentBusinessName(personPrimary)} gewinnt deutlich an Gewicht, während das bisherige Teammuster relativiert wird. Das kann eine bewusste strategische Entscheidung sein, verlangt aber in jedem Fall aktive Führung, klare Kommunikation und konsequente Begleitung.`;
  }
  return `${intro}\n\nDie Konstellation erzeugt Spannung. ${ref} bringt eine Arbeitslogik mit, die in wichtigen Punkten vom Team abweicht. Diese Unterschiede können produktiv sein, wenn sie bewusst genutzt werden. Ohne klare Steuerung besteht jedoch die Gefahr, dass Arbeitsweisen gegeneinander statt miteinander wirken.\n\nFür die Rolle bedeutet das: Das Team setzt stärker auf ${componentBusinessName(teamPrimary).toLowerCase()}, die Besetzung stärker auf ${componentBusinessName(personPrimary).toLowerCase()}. Dadurch entstehen unterschiedliche Erwartungen an Prioritäten, Abstimmung und Umsetzung.`;
}

function getImpactTexts(teamProfile: Triad, personProfile: Triad, roleTitle: string, roleType: string): ImpactItem[] {
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);
  const delta = getDelta(teamProfile, personProfile);
  const refLower = getRoleRef(roleTitle, true);
  const ref = getRoleRef(roleTitle, false);
  const prefix = roleType === "leadership" ? `${refLower} prägt in der Führungsrolle` : `${refLower} zeigt im Teamalltag`;

  const decisionText = `${prefix} Entscheidungen stärker aus ${componentBusinessName(personPrimary).toLowerCase()} heraus. Das Team ist hingegen stärker an ${componentBusinessName(teamPrimary).toLowerCase()} orientiert. Im Alltag zeigt sich das vor allem darin, wie schnell entschieden wird, wie viel Abstimmung eingeholt wird und woran Entscheidungen gemessen werden.`;

  let steeringText = `${ref} setzt andere Akzente als das Team. Dadurch verschieben sich Prioritäten, Arbeitsrhythmus und die Art, wie Aufgaben in der Rolle verfolgt werden.`;
  if (delta.analytisch < -15) {
    steeringText += " Besonders sichtbar wird das in der Nachverfolgung, in der Dokumentation und in der Frage, wie sauber Prozesse eingehalten werden.";
  } else if (delta.analytisch > 15) {
    steeringText += " Besonders sichtbar wird das in klarerer Ordnung, nachvollziehbareren Entscheidungen und höherer Prozesssicherheit.";
  }

  let dynamicText = "In der Teamdynamik werden Unterschiede im Alltag deutlich spürbar. Das betrifft vor allem Abstimmung, Erwartungshaltung und die Frage, was als gutes Arbeiten gilt.";
  if (personPrimary === "impulsiv" && teamPrimary === "intuitiv") {
    dynamicText += " Die Besetzung wird stärker auf Vorwärtsbewegung und unmittelbare Umsetzung drängen, während das Team stärker über Abstimmung und gemeinsame Einordnung arbeitet.";
  } else if (personPrimary === "analytisch" && teamPrimary === "impulsiv") {
    dynamicText += " Die Besetzung wird stärker auf Ordnung, Qualität und nachvollziehbare Entscheidungen achten, während das Team eher auf Geschwindigkeit und direkte Wirkung setzt.";
  } else if (personPrimary === "intuitiv" && teamPrimary === "analytisch") {
    dynamicText += " Die Besetzung wird stärker auf Austausch und Beziehung achten, während das Team eher über Klarheit, Sachlogik und Struktur arbeitet.";
  }

  let tempoText = `${ref} setzt einen anderen Rhythmus als das bestehende Team.`;
  if (delta.impulsiv > 12) {
    tempoText += " Dadurch entsteht spürbar mehr Dynamik, Aktivität und direkte Bewegung in Themen. Das kann Leistung freisetzen, aber auch als Druck empfunden werden.";
  } else if (delta.impulsiv < -12) {
    tempoText += " Dadurch kann die Besetzung im Umfeld eines sehr dynamischen Teams als zu vorsichtig oder zu langsam wahrgenommen werden.";
  } else {
    tempoText += " Hier ist keine starke Abweichung zu erwarten. Der Arbeitsrhythmus dürfte grundsätzlich anschlussfähig sein.";
  }

  let communicationText = "Die Kommunikation im Team wird ebenfalls beeinflusst. Dabei geht es nicht nur um Gesprächsstil, sondern auch darum, wie offen abgestimmt wird, wie viel Erklärung nötig ist und wie Konflikte angesprochen werden.";
  if (delta.intuitiv > 12) {
    communicationText += " Die Besetzung bringt mehr Beziehungs- und Abstimmungsorientierung ein. Das kann Vertrauen stärken und Schnittstellen verbessern.";
  } else if (delta.intuitiv < -12) {
    communicationText += " Die Besetzung bringt weniger Abstimmungsorientierung ein als das Team. Dadurch kann sie direkter, knapper oder weniger anschlussfähig wirken.";
  } else {
    communicationText += " Die Kommunikationslogik liegt nahe am Team. Dadurch besteht in diesem Bereich eine gute Basis für Zusammenarbeit.";
  }

  return [
    { title: "Entscheidungslogik", text: decisionText },
    { title: "Arbeitssteuerung", text: steeringText },
    { title: "Teamdynamik", text: dynamicText },
    { title: "Arbeitstempo", text: tempoText },
    { title: "Kommunikation", text: communicationText },
  ];
}

function getStressTexts(profile: Triad, roleTitle: string, roleType: string): StressTexts {
  const primary = getPrimaryKey(profile);
  const secondary = getSecondaryKey(profile);
  const ref = getRoleRef(roleTitle, false);
  const roleStart = roleType === "leadership" ? `${ref} verstärkt in der Führungsrolle` : `${ref} verstärkt im Arbeitsalltag`;

  const controlled = `${roleStart} unter kontrolliertem Druck in der Regel die Hauptlogik. Im vorliegenden Profil tritt daher ${componentBusinessName(primary).toLowerCase()} noch deutlicher in den Vordergrund. Entscheidungen werden klarer aus dieser Linie heraus getroffen, Prioritäten werden stärker verdichtet und das Verhalten wirkt eindeutiger als im Normalzustand.\n\nFür das Team bedeutet das: Unter Ziel- und Leistungsdruck wird der Unterschied zur gewohnten Teamlogik sichtbarer. Das kann positiv sein, wenn genau diese Stärke gebraucht wird. Es kann aber auch Reibung auslösen, wenn das Team unter Druck ein anderes Muster erwartet.`;

  const uncontrolled = `Wenn Belastung sehr hoch wird oder über längere Zeit anhält, verliert die Hauptlinie an Stabilität. Dann tritt der zweite Bereich des Profils stärker hervor. Im vorliegenden Fall gewinnt ${componentBusinessName(secondary).toLowerCase()} an Einfluss. Dadurch kann das Verhalten für das Umfeld wechselhafter wirken als im Normalzustand.\n\nFür das Team ist wichtig, diese Verschiebung früh zu verstehen. Unter hoher Belastung braucht es klare Absprachen, kurze Entscheidungswege und eine bewusste Führung der Zusammenarbeit. Sonst kann aus Leistungsdruck schnell Missverständnisdruck werden.`;

  return { controlled, uncontrolled };
}

function getChances(teamProfile: Triad, personProfile: Triad, roleTitle: string, roleType: string): string[] {
  const systemwirkung = getSystemwirkung(teamProfile, personProfile);
  const personPrimary = getPrimaryKey(personProfile);
  const ref = getRoleRef(roleTitle, false);
  const list: string[] = [];

  if (systemwirkung === "Ergänzung") {
    list.push(`${ref} stärkt einen Bereich, der im Team bisher weniger Gewicht hat. Dadurch kann das Team breiter und wirksamer aufgestellt werden.`);
  } else if (systemwirkung === "Verstärkung") {
    list.push(`${ref} baut eine bestehende Stärke des Teams weiter aus. Dadurch kann mehr Klarheit, Tempo oder Stabilität im Alltag entstehen.`);
  } else {
    list.push("Die Unterschiede zwischen Team und Besetzung eröffnen neue Perspektiven. Richtig geführt kann daraus echte Weiterentwicklung entstehen.");
  }

  if (personPrimary === "impulsiv") {
    list.push(`${ref} kann mehr Zug, Aktivität und sichtbare Vorwärtsbewegung ins Team bringen. Das ist besonders wertvoll, wenn Umsetzungskraft gestärkt werden soll.`);
  }
  if (personPrimary === "intuitiv") {
    list.push(`${ref} kann die Zusammenarbeit im Team und an Schnittstellen stärken. Das verbessert Anschlussfähigkeit, Kommunikation und Beziehungsqualität.`);
  }
  if (personPrimary === "analytisch") {
    list.push(`${ref} kann mehr Ordnung, Nachvollziehbarkeit und Prozesssicherheit in den Arbeitsalltag bringen. Das erhöht Qualität und Verlässlichkeit.`);
  }

  list.push("Unterschiedliche Arbeitslogiken können die Qualität von Entscheidungen erhöhen, wenn sie bewusst genutzt werden und nicht gegeneinander arbeiten.");
  list.push("Das Team kann durch die neue Besetzung lernen, bisher schwächere Arbeitsweisen besser zu integrieren und dadurch an Breite gewinnen.");
  list.push(roleType === "leadership"
    ? `${ref} kann in der Führungsrolle neue Standards setzen und dem Team eine klarere Richtung geben, wenn Erwartungen früh und eindeutig geklärt werden.`
    : `${ref} kann als Teammitglied neue Impulse geben, ohne die bestehende Struktur sofort grundsätzlich zu verändern.`);

  return list.slice(0, 5);
}

function getRisks(teamProfile: Triad, personProfile: Triad, roleTitle: string, roleType: string): string[] {
  const systemwirkung = getSystemwirkung(teamProfile, personProfile);
  const delta = getDelta(teamProfile, personProfile);
  const ref = getRoleRef(roleTitle, false);
  const list: string[] = [];

  list.push("Unterschiedliche Arbeitslogiken können im Alltag zu Missverständnissen führen, wenn nicht klar benannt wird, wie Entscheidungen getroffen und Prioritäten gesetzt werden.");

  if (Math.abs(delta.impulsiv) > 15) {
    list.push("Das abweichende Arbeitstempo kann im Team als Druck, Langsamkeit oder mangelnde Passung wahrgenommen werden. Dadurch entstehen schnell unnötige Spannungen.");
  }
  if (Math.abs(delta.intuitiv) > 15) {
    list.push("Die Unterschiede in Kommunikation und Abstimmung können zu Reibung führen. Was für die eine Seite effizient wirkt, kann für die andere Seite als zu knapp oder zu abstimmungsintensiv empfunden werden.");
  }
  if (Math.abs(delta.analytisch) > 15) {
    list.push("Abweichungen in Struktur und Analyse wirken sich direkt auf Nachverfolgung, Dokumentation, Qualitätsanspruch und Verbindlichkeit aus.");
  }

  if (systemwirkung === "Transformation") {
    list.push(`${ref} verändert das Team deutlich. Ohne aktive Steuerung kann dies zu Unsicherheit, Widerstand oder einem schleichenden Kulturkonflikt führen.`);
  } else if (systemwirkung === "Spannung") {
    list.push("Die Konstellation erzeugt eine dauerhafte Reibungsfläche. Wird diese nicht geführt, steigt das Risiko wiederkehrender Konflikte im Arbeitsalltag.");
  } else {
    list.push("Auch eine grundsätzlich passende Konstellation birgt das Risiko, dass das Team einseitiger wird und schwächere Bereiche weiter an Gewicht verlieren.");
  }

  list.push(roleType === "leadership"
    ? `${ref} wirkt in einer Führungsfunktion mit hoher Hebelwirkung. Unklare Führung verstärkt Unruhe, Prioritätskonflikte und Orientierungsverlust im Team.`
    : `${ref} kann bei fehlender Integration entweder gebremst werden oder dauerhaft gegen das bestehende Muster arbeiten.`);

  return list.slice(0, 5);
}

function getAdvice(roleType: string, teamProfile: Triad, personProfile: Triad, roleTitle: string): AdviceItem[] {
  const personPrimary = getPrimaryKey(personProfile);
  const ref = getRoleRef(roleTitle, false);
  const refLower = getRoleRef(roleTitle, true);

  return [
    {
      title: "Erwartungen klar machen",
      text: `Zu Beginn sollte offen benannt werden, welche Arbeitsweise das Team heute prägt und welche Wirkung von ${refLower} erwartet wird. Tempo, Abstimmung und Qualitätsanspruch sollten nicht vorausgesetzt, sondern klar definiert werden.`,
    },
    {
      title: "Entscheidungswege festlegen",
      text: "Es sollte geklärt werden, welche Themen schnell entschieden werden, wo Abstimmung notwendig ist und welche Standards verbindlich gelten. So wird verhindert, dass Unterschiede in der Arbeitslogik zu unnötigen Reibungen führen.",
    },
    {
      title: "Stärken gezielt nutzen",
      text: `${ref} sollte nicht nur am Team gemessen, sondern gezielt in den stärksten Bereichen eingesetzt werden. Im vorliegenden Fall betrifft das vor allem ${componentBusinessName(personPrimary).toLowerCase()}. Dort entsteht der größte Mehrwert.`,
    },
    {
      title: roleType === "leadership" ? "Führung sichtbar machen" : "Integration aktiv steuern",
      text: roleType === "leadership"
        ? `${ref} sollte in den ersten Wochen Prioritäten, Kommunikationsstil und Entscheidungspraxis besonders klar machen. Das Team braucht früh erkennbare Orientierung.`
        : `In den ersten Wochen braucht ${refLower} eine aktive Einbindung in Teamabläufe, Schnittstellen und Abstimmungsformate. Integration darf nicht dem Zufall überlassen werden.`,
    },
    {
      title: "Frühe Feedbackschleifen einbauen",
      text: "Nach zwei, vier und acht Wochen sollten kurze Rückmeldungen eingeholt werden. So lassen sich Missverständnisse, Tempokonflikte und Friktionen in der Zusammenarbeit früh erkennen und sauber nachsteuern.",
    },
  ];
}

export interface TeamCheckV2Input {
  roleTitle: string;
  roleLevel: string;
  taskStructure: string;
  workStyle: string;
  successFocus: string[];
  teamProfile: Triad;
  personProfile: Triad;
}

export function computeTeamCheckV2(input: TeamCheckV2Input): TeamCheckV2Result {
  const roleType = normalizeRoleLevel(input.roleLevel);
  const passung = getPassung(input.teamProfile, input.personProfile, roleType);
  const systemwirkung = getSystemwirkung(input.teamProfile, input.personProfile);
  const teamLabel = getProfileLabel(input.teamProfile);
  const personLabel = getProfileLabel(input.personProfile);
  const personType = getBioLogicType(input.personProfile);
  const reasons = buildReasonLines(input.teamProfile, input.personProfile, input.roleTitle, roleType);
  const tension = getVisualTensionAnalysis(input.teamProfile, input.personProfile);
  const impacts = getImpactTexts(input.teamProfile, input.personProfile, input.roleTitle, roleType);
  const stress = getStressTexts(input.personProfile, input.roleTitle, roleType);
  const chances = getChances(input.teamProfile, input.personProfile, input.roleTitle, roleType);
  const risks = getRisks(input.teamProfile, input.personProfile, input.roleTitle, roleType);
  const advice = getAdvice(roleType, input.teamProfile, input.personProfile, input.roleTitle);
  const teamText = getTeamProfileText(input.teamProfile, input.roleTitle);
  const personText = PROFILE_TEXTS[personType] || "";
  const systemwirkungText = getSystemwirkungText(input.teamProfile, input.personProfile, input.roleTitle, roleType);
  const roleLabel = roleType === "leadership" ? "Führungskraft" : "Teammitglied";

  return {
    passung,
    systemwirkung,
    teamLabel,
    personLabel,
    teamText,
    personText,
    systemwirkungText,
    reasons,
    tension,
    impacts,
    stress,
    chances,
    risks,
    advice,
    roleLabel,
    roleType,
  };
}
