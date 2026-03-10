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
  impulsiv_intuitiv_analytisch: `Die Besetzung arbeitet primär über Umsetzung und Tempo. Themen werden zügig aufgegriffen, Entscheidungen konsequent nach vorn getrieben. Der zweite Schwerpunkt liegt in Zusammenarbeit und Kommunikation – dadurch bleibt die Besetzung trotz hoher Dynamik anschlussfähig an das Umfeld. Struktur und Analyse sind vorhanden, stehen jedoch nicht im Vordergrund.\n\nIm Arbeitsalltag zeigt sich dieses Profil in hoher Eigeninitiative, klarer Aktionsorientierung und einer spürbaren Umsetzungsdynamik. Chancen entstehen dort, wo operative Geschwindigkeit, Präsenz und direkte Wirkung gefragt sind. Risiken bestehen dort, wo konsequente Nachverfolgung, saubere Dokumentation und disziplinierte Prozessführung dauerhaft erforderlich sind.`,
  impulsiv_analytisch_intuitiv: `Die Besetzung arbeitet primär über Umsetzung und Tempo. Der zweite Schwerpunkt liegt auf Struktur und Analyse – dadurch verbindet sie hohe Aktivität mit einem ausgeprägten Blick für Zielklarheit, Prioritäten und sachliche Ordnung. Zusammenarbeit und Kommunikation sind vorhanden, stehen aber nicht an erster Stelle.\n\nIm Arbeitsalltag zeigt sich dieses Profil in konsequenter Zielorientierung, klarer Umsetzungsausrichtung und einer guten Fähigkeit, Themen nicht nur anzustoßen, sondern geordnet zu steuern. Chancen liegen in Durchsetzungskraft, Fokus und Verbindlichkeit. Risiken entstehen dort, wo Abstimmung oder sensible Teamkommunikation zu wenig Raum erhalten.`,
  intuitiv_impulsiv_analytisch: `Die Besetzung arbeitet primär über Zusammenarbeit und Kommunikation. Der zweite Schwerpunkt liegt auf Umsetzung und Tempo – dadurch verbindet sie Kontaktstärke mit Aktivität und wirkt häufig verbindend, motivierend und beweglich. Struktur und Analyse sind vorhanden, aber nicht die tragende Leitlinie.\n\nIm Arbeitsalltag zeigt sich dieses Profil in kundenorientierter Kommunikation, schneller Kontaktaufnahme und hoher Wirksamkeit in Gesprächen. Chancen liegen in Netzwerkaufbau, Beziehungspflege und positiver Präsenz. Risiken entstehen dort, wo konsequente Nachverfolgung, analytische Tiefe und Prozessdisziplin dauerhaft gefordert sind.`,
  intuitiv_analytisch_impulsiv: `Die Besetzung arbeitet primär über Zusammenarbeit und Kommunikation. Der zweite Schwerpunkt liegt auf Struktur und Analyse – dadurch verbindet sie Beziehungsstärke mit einem geordneten, reflektierten Vorgehen. Tempo und spontane Umsetzung sind vorhanden, stehen aber nicht im Vordergrund.\n\nIm Arbeitsalltag zeigt sich dieses Profil in ruhiger Gesprächsführung, sauberer Bedarfsaufnahme und konsistenter Abstimmung mit dem Umfeld. Chancen liegen in Vertrauensbildung, Verlässlichkeit und nachhaltiger Zusammenarbeit. Risiken entstehen dort, wo schnelle Entscheidungen, harte Priorisierung oder kurzfristiger Umsetzungsdruck erforderlich sind.`,
  analytisch_impulsiv_intuitiv: `Die Besetzung arbeitet primär über Struktur und Analyse. Der zweite Schwerpunkt liegt auf Umsetzung und Tempo – dadurch bringt sie eine klare Ordnung in Themen, denkt sachlich und zielbezogen und kann Entscheidungen auch konsequent in die Umsetzung überführen. Zusammenarbeit und Kommunikation sind vorhanden, aber nicht der primäre Antrieb.\n\nIm Arbeitsumfeld zeigt sich dieses Profil in sauberer Vorbereitung, klarer Argumentation und disziplinierter Arbeitsweise. Chancen liegen in Qualitätssicherung, Steuerbarkeit und belastbaren Entscheidungen. Risiken entstehen dort, wo hohe Flexibilität oder spontane Anpassung im Vordergrund stehen.`,
  analytisch_intuitiv_impulsiv: `Die Besetzung arbeitet primär über Struktur und Analyse. Der zweite Schwerpunkt liegt auf Zusammenarbeit und Kommunikation – dadurch verbindet sie Klarheit, Sorgfalt und nachvollziehbare Entscheidungen mit einem kooperativen Umgang. Tempo und spontane Umsetzung sind vorhanden, aber nicht die bevorzugte Linie.\n\nIm Arbeitsalltag zeigt sich dieses Profil in gut vorbereiteten Gesprächen, klarer Argumentation, verlässlicher Abstimmung und solider Prozessführung. Chancen liegen in Qualität, Stabilität und professioneller Wirkung. Risiken entstehen dort, wo ein sehr hohes Tempo oder spontane Marktreaktion gefordert sind.`,
  impulsiv_intuitiv_doppeldominanz: `Die Besetzung zeigt eine Doppeldominanz aus Umsetzung und Kommunikation. Sie bringt sowohl Tempo als auch Kontaktstärke mit. Entscheidungen werden häufig zügig getroffen, gleichzeitig bleibt die Wirkung auf das Umfeld wichtig. Struktur und Analyse sind vorhanden, stehen jedoch deutlich im Hintergrund.\n\nIm Arbeitsalltag kann dieses Profil sehr wirksam sein, wenn Aktivität, Sichtbarkeit und Beziehungsarbeit gebraucht werden. Risiken liegen vor allem in nachlassender Ordnung, geringer Dokumentationstiefe und wechselnden Prioritäten unter Belastung.`,
  impulsiv_analytisch_doppeldominanz: `Die Besetzung zeigt eine Doppeldominanz aus Umsetzung und Struktur. Sie verbindet Aktivität mit Sachorientierung und arbeitet häufig zugleich entschlossen und klar. Zusammenarbeit und Kommunikation sind vorhanden, haben aber weniger Gewicht als Ergebnisorientierung und Ordnung.\n\nIm Arbeitsalltag kann dieses Profil besonders stark sein, wenn Zielklarheit, Steuerung und Verbindlichkeit gefragt sind. Risiken entstehen dort, wo Abstimmung oder sensible Kommunikation eine größere Rolle spielen.`,
  intuitiv_analytisch_doppeldominanz: `Die Besetzung zeigt eine Doppeldominanz aus Kommunikation und Struktur. Sie verbindet kooperative Zusammenarbeit mit einem geordneten, nachvollziehbaren Vorgehen. Tempo ist vorhanden, aber nicht die bevorzugte erste Reaktion.\n\nIm Arbeitsalltag zeigt sich dieses Profil in verlässlicher Kommunikation, sauberer Vorbereitung und stabiler Zusammenarbeit. Chancen liegen in Qualität, Ruhe und Vertrauensbildung. Risiken entstehen dort, wo ein sehr hohes Umsetzungstempo gefordert ist.`,
  impulsiv_mit_gleicher_nebenlage: `Die Besetzung ist klar auf Umsetzung und Tempo ausgerichtet. Die beiden übrigen Bereiche sind in ähnlicher Stärke vorhanden, konkurrieren aber nicht um die Hauptlinie. Im Zentrum steht das konsequente Vorantreiben von Themen, zügiges Handeln und direkte Wirkung.\n\nIm Arbeitsalltag zeigt sich dieses Profil in hoher Energie, klarer Eigeninitiative und starker Umsetzungsdynamik. Chancen liegen in operativer Geschwindigkeit, Aktivität und sichtbarer Leistung. Risiken entstehen dort, wo das Umfeld mehr Abstimmung, Geduld oder strukturelle Sorgfalt verlangt.`,
  intuitiv_mit_gleicher_nebenlage: `Die Besetzung ist klar auf Zusammenarbeit und Kommunikation ausgerichtet. Die beiden übrigen Bereiche sind in ähnlicher Stärke vorhanden, stehen aber hinter der Hauptlinie zurück. Im Zentrum stehen Beziehung, Austausch, Vertrauen und zwischenmenschliche Wirkung.\n\nIm Arbeitsalltag zeigt sich dieses Profil in verbindender Kommunikation, guter Ansprache und kooperativer Teamwirkung. Chancen liegen in Beziehungsaufbau, Integration und nachhaltiger Zusammenarbeit. Risiken entstehen dort, wo konsequente Steuerung, operative Geschwindigkeit oder harte Priorisierung gefragt sind.`,
  analytisch_mit_gleicher_nebenlage: `Die Besetzung ist klar auf Struktur und Analyse ausgerichtet. Die beiden übrigen Bereiche sind in ähnlicher Stärke vorhanden, aber nicht führend. Im Zentrum stehen Klarheit, Nachvollziehbarkeit, sachliche Prüfung und geordnete Arbeitsweise.\n\nIm Arbeitsalltag zeigt sich dieses Profil in Verlässlichkeit, professioneller Vorbereitung und kontrolliertem Vorgehen. Chancen liegen in Qualitätssicherung, Stabilität und sauberer Steuerung. Risiken entstehen dort, wo spontane Anpassung, hohe Dynamik und offensive Umsetzungsenergie im Vordergrund stehen.`,
  alle_gleich: `Die Besetzung zeigt ein ausgeglichenes Profil. Umsetzung, Kommunikation und Struktur sind in ähnlicher Stärke ausgeprägt. Es gibt keine einseitige Hauptlinie, sondern eine breite Anschlussfähigkeit an unterschiedliche Anforderungen.\n\nIm Arbeitsalltag kann dieses Profil sehr flexibel wirken. Die Besetzung kann sich auf verschiedene Situationen einstellen und unterschiedliche Erwartungen verbinden. Chancen liegen in Vielseitigkeit und Balance. Risiken entstehen dort, wo das Umfeld eine besonders klare Kante oder eine sehr eindeutige Arbeitslogik verlangt.`,
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

function besetzungRef(roleTitle: string): string {
  const title = String(roleTitle || "").trim();
  return title ? `die Besetzung in der Rolle ${title}` : "die Besetzung";
}

function BesetzungRef(roleTitle: string): string {
  const title = String(roleTitle || "").trim();
  return title ? `Die Besetzung in der Rolle ${title}` : "Die Besetzung";
}

function rolleRef(roleTitle: string): string {
  const title = String(roleTitle || "").trim();
  return title ? `die Rolle ${title}` : "die Rolle";
}

function RolleRef(roleTitle: string): string {
  const title = String(roleTitle || "").trim();
  return title ? `Die Rolle ${title}` : "Die Rolle";
}

function getTeamProfileText(teamProfile: Triad, roleTitle: string): string {
  const type = getBioLogicType(teamProfile);
  const primary = getPrimaryKey(teamProfile);

  if (type === "alle_gleich") {
    return `${RolleRef(roleTitle)} trifft auf ein Team mit ausgeglichenem Profil. Umsetzung, Zusammenarbeit und Struktur sind in ähnlicher Stärke vorhanden. Dadurch besteht eine breite Anschlussfähigkeit an unterschiedliche Anforderungen. Gleichzeitig besteht die Gefahr, dass keine Arbeitslogik konsequent genug getragen wird, wenn Prioritäten nicht klar verankert werden.`;
  }
  if (primary === "impulsiv") {
    return `${RolleRef(roleTitle)} trifft auf ein Team, das primär auf Umsetzung und Tempo ausgerichtet ist. Im Alltag zeigt sich dies in hoher Aktivität, schneller Themenbearbeitung und einer klaren operativen Taktung. Entscheidungen werden pragmatisch und zügig getroffen. Das ist besonders wertvoll, wenn sichtbare Ergebnisse und direkte Wirkung gefragt sind. Gleichzeitig steigt das Risiko, dass Abstimmung, Sorgfalt und konsequente Nachverfolgung zu wenig Aufmerksamkeit erhalten.`;
  }
  if (primary === "intuitiv") {
    return `${RolleRef(roleTitle)} trifft auf ein Team, das primär auf Zusammenarbeit und Kommunikation ausgerichtet ist. Im Alltag zeigt sich dies in ausgeprägter Abstimmung, starker Beziehungsorientierung und einem eher gemeinsamen als rein individuellen Vorgehen. Das ist besonders wertvoll, wenn Kundennähe, Vertrauen und Teamabstimmung tragende Erfolgsfaktoren sind. Gleichzeitig steigt das Risiko, dass Entscheidungen zu lange abgestimmt werden und klare Prioritäten nicht konsequent genug umgesetzt werden.`;
  }
  return `${RolleRef(roleTitle)} trifft auf ein Team, das primär auf Struktur und Analyse ausgerichtet ist. Im Alltag zeigt sich dies in geordneten Abläufen, nachvollziehbaren Entscheidungen und einer sachlich geprägten Herangehensweise. Das ist besonders wertvoll, wenn Qualität, Verlässlichkeit und saubere Steuerung entscheidend sind. Gleichzeitig steigt das Risiko, dass operative Dynamik und schnelle Umsetzung an Kraft verlieren.`;
}

function buildReasonLines(teamProfile: Triad, personProfile: Triad, roleTitle: string, roleType: string): string[] {
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);
  const delta = getDelta(teamProfile, personProfile);
  const distance = getDistanceScore(teamProfile, personProfile);
  const reasons: string[] = [];

  if (teamPrimary === personPrimary) {
    reasons.push(`Die Besetzung teilt die Hauptarbeitslogik des Teams: Beide setzen primär auf ${componentBusinessName(teamPrimary).toLowerCase()}. Dadurch besteht eine grundsätzliche Anschlussfähigkeit im Arbeitsalltag.`);
  } else {
    reasons.push(`Die Besetzung setzt andere Schwerpunkte als das bestehende Team. Während das Team stärker über ${componentBusinessName(teamPrimary).toLowerCase()} arbeitet, bringt die Besetzung mehr ${componentBusinessName(personPrimary).toLowerCase()} mit.`);
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
      reasons.push(`${componentBusinessName(key)} ist bei der Besetzung deutlich stärker ausgeprägt als im Team. Dadurch verschieben sich Prioritäten, Entscheidungswege und die operative Taktung spürbar.`);
    } else {
      reasons.push(`${componentBusinessName(key)} ist bei der Besetzung deutlich schwächer ausgeprägt als im Team. Dadurch entstehen Erwartungsunterschiede in Arbeitsrhythmus und Qualitätsanspruch.`);
    }
  }

  if (distance >= 60) {
    reasons.push("Die Gesamtabweichung zum Teamprofil ist erheblich. Im Arbeitsalltag ist mit substanzieller Reibung in Prioritätensetzung und Arbeitssteuerung zu rechnen.");
  } else if (distance >= 35) {
    reasons.push("Die Besetzung weicht in mehreren Bereichen sichtbar vom Team ab. Das kann bereichernd wirken, verlangt aber bewusste Steuerung und klare Vereinbarungen.");
  } else {
    reasons.push("Die Besetzung liegt in ihrer Arbeitslogik nah am Team. Dadurch ist eine stabile Einbindung grundsätzlich gut möglich.");
  }

  if (roleType === "leadership") {
    reasons.push(`In einer Führungsfunktion wirken diese Unterschiede nicht nur individuell, sondern prägen Prioritätensetzung, Entscheidungsverankerung und die Teamkultur insgesamt. Führungsstabilität und Orientierung im Team hängen direkt davon ab, wie diese Konstellation gesteuert wird.`);
  } else {
    reasons.push(`Als Teammitglied wirkt die Besetzung vor allem über die alltägliche Zusammenarbeit, Abstimmung und Integration in das bestehende Team. Die Steuerungswirkung ist begrenzter, aber im direkten Umfeld dennoch spürbar.`);
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
      interpretation = "In diesem Bereich liegt die Besetzung nah am Team. Dadurch ist hier eher Stabilität als Reibung zu erwarten.";
    } else if (status === "moderat_mehr") {
      interpretation = "Die Besetzung bringt in diesem Bereich etwas mehr Gewicht ein als das Team. Das kann das bestehende Profil sinnvoll ergänzen, ohne sofort starken Gegendruck auszulösen.";
    } else if (status === "moderat_weniger") {
      interpretation = "Die Besetzung bringt in diesem Bereich etwas weniger mit als das Team. Das ist grundsätzlich ausgleichbar, wird im Arbeitsalltag aber sichtbar sein.";
    } else if (status === "deutlich_mehr") {
      interpretation = "Die Besetzung bringt in diesem Bereich deutlich mehr ein als das Team. Hier entsteht ein klarer Veränderungsimpuls, der aktiv gesteuert werden muss.";
    } else {
      interpretation = "Die Besetzung bringt in diesem Bereich deutlich weniger mit als das Team. Hier ist mit spürbaren Erwartungsunterschieden zu rechnen.";
    }

    return { key, title: componentBusinessName(key), teamValue, personValue, interpretation };
  });
}

function getSystemwirkungText(teamProfile: Triad, personProfile: Triad, roleTitle: string, roleType: string): string {
  const systemwirkung = getSystemwirkung(teamProfile, personProfile);
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);

  const intro = roleType === "leadership"
    ? `Die Besetzung wirkt in der Führungsfunktion nicht nur als einzelne Stellenbesetzung, sondern setzt im Team spürbare Schwerpunkte. Die Arbeitslogik beeinflusst Prioritätensetzung, Entscheidungsverankerung und die Art, wie Leistung im Alltag gesteuert und bewertet wird.`
    : `Die Besetzung wirkt im Teamalltag vor allem über den täglichen Kontakt, den Arbeitsrhythmus und die Art, wie Aufgaben umgesetzt und koordiniert werden.`;

  if (systemwirkung === "Verstärkung") {
    return `${intro}\n\nDie Konstellation wirkt insgesamt als Verstärkung. Die Besetzung bringt eine Arbeitslogik mit, die zum Grundmuster des Teams passt. Dadurch werden bestehende Stärken weiter ausgebaut.\n\nFür ${rolleRef(roleTitle)} bedeutet das: ${componentBusinessName(teamPrimary)} wird durch die Besetzung zusätzlich getragen. Das fördert Stabilität, Klarheit und eine schnellere Eingliederung. Gleichzeitig ist darauf zu achten, dass das Team nicht noch einseitiger wird und schwächere Bereiche weiter an Gewicht verlieren.`;
  }
  if (systemwirkung === "Ergänzung") {
    return `${intro}\n\nDie Konstellation wirkt insgesamt als Ergänzung. Die Besetzung bringt eine Qualität ins Team, die bisher weniger stark ausgeprägt ist. Dadurch kann das Team breiter, beweglicher und leistungsfähiger werden.\n\nFür ${rolleRef(roleTitle)} bedeutet das: Das Team erhält durch die Besetzung mehr Gewicht in ${componentBusinessName(personPrimary).toLowerCase()}. Das ist grundsätzlich eine Chance. Gleichzeitig entsteht eine natürliche Reibung, weil das Team andere Schwerpunkte gewohnt ist. Der Nutzen dieser Ergänzung zeigt sich nur dann voll, wenn Unterschiede transparent gemacht, Erwartungen geklärt und gemeinsame Spielregeln verankert werden.`;
  }
  if (systemwirkung === "Transformation") {
    return `${intro}\n\nDie Konstellation wirkt insgesamt als deutliche Veränderung. Die Besetzung bringt eine Arbeitslogik mit, die das Team spürbar in eine neue Richtung ziehen kann. Das ist kein moderater Impuls, sondern ein struktureller Eingriff in das bestehende System.\n\nFür ${rolleRef(roleTitle)} bedeutet das: ${componentBusinessName(personPrimary)} gewinnt deutlich an Gewicht, während das bisherige Teammuster relativiert wird. Das kann eine bewusste strategische Entscheidung sein, verlangt aber in jedem Fall aktive Führung, konsequente Kommunikation und eine klare Steuerungsarchitektur.`;
  }
  return `${intro}\n\nDie Konstellation erzeugt Spannung. Die Besetzung bringt eine Arbeitslogik mit, die in wichtigen Punkten vom Team abweicht. Diese Unterschiede können produktiv sein, wenn sie bewusst genutzt werden. Ohne klare Steuerung besteht jedoch die Gefahr, dass Arbeitsweisen gegeneinander statt miteinander wirken.\n\nFür ${rolleRef(roleTitle)} bedeutet das: Das Team setzt stärker auf ${componentBusinessName(teamPrimary).toLowerCase()}, die Besetzung stärker auf ${componentBusinessName(personPrimary).toLowerCase()}. Dadurch entstehen unterschiedliche Erwartungen an Prioritätensetzung, Abstimmungstiefe und Umsetzungsgeschwindigkeit.`;
}

function getImpactTexts(teamProfile: Triad, personProfile: Triad, roleTitle: string, roleType: string): ImpactItem[] {
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);
  const delta = getDelta(teamProfile, personProfile);
  const prefix = roleType === "leadership" ? `Die Besetzung prägt in der Führungsfunktion` : `Die Besetzung zeigt im Teamalltag`;

  const decisionText = `${prefix} Entscheidungen stärker aus ${componentBusinessName(personPrimary).toLowerCase()} heraus. Das Team ist hingegen stärker an ${componentBusinessName(teamPrimary).toLowerCase()} orientiert. Im Alltag zeigt sich das vor allem darin, wie schnell entschieden wird, wie viel Abstimmung eingeholt wird und woran Entscheidungsqualität gemessen wird.`;

  let steeringText = `Die Besetzung setzt andere Akzente als das Team. Dadurch verschieben sich Prioritäten, operative Taktung und die Art, wie Aufgaben verfolgt und bewertet werden.`;
  if (delta.analytisch < -15) {
    steeringText += " Besonders sichtbar wird das in der Nachverfolgung, in der Dokumentation und in der Frage, wie konsequent Prozesse und Standards eingehalten werden.";
  } else if (delta.analytisch > 15) {
    steeringText += " Besonders sichtbar wird das in klarerer Ordnung, nachvollziehbareren Entscheidungen und höherer Prozesssicherheit.";
  }

  let dynamicText = "In der Teamdynamik werden Unterschiede im Alltag deutlich spürbar. Das betrifft vor allem Abstimmungstiefe, Erwartungshaltung und die Frage, was als leistungsfähiges Arbeiten gilt.";
  if (personPrimary === "impulsiv" && teamPrimary === "intuitiv") {
    dynamicText += " Die Besetzung wird stärker auf unmittelbare Umsetzung und höhere operative Taktung drängen, während das Team stärker über Abstimmung und gemeinsame Einordnung arbeitet.";
  } else if (personPrimary === "analytisch" && teamPrimary === "impulsiv") {
    dynamicText += " Die Besetzung wird stärker auf Ordnung, Qualitätssicherung und nachvollziehbare Entscheidungen achten, während das Team eher auf Geschwindigkeit und direkte Wirkung setzt.";
  } else if (personPrimary === "intuitiv" && teamPrimary === "analytisch") {
    dynamicText += " Die Besetzung wird stärker auf Austausch und Beziehungspflege achten, während das Team eher über Sachlogik, Klarheit und Struktur arbeitet.";
  } else if (personPrimary === "impulsiv" && teamPrimary === "analytisch") {
    dynamicText += " Die Besetzung wird stärker auf Geschwindigkeit und Entscheidungsbeschleunigung setzen, während das Team eher auf Gründlichkeit, Absicherung und Nachvollziehbarkeit achtet.";
  } else if (personPrimary === "intuitiv" && teamPrimary === "impulsiv") {
    dynamicText += " Die Besetzung wird stärker auf Abstimmung und Kommunikation setzen, während das Team eher über direkte Umsetzung und schnelle Ergebnisse arbeitet.";
  } else if (personPrimary === "analytisch" && teamPrimary === "intuitiv") {
    dynamicText += " Die Besetzung wird stärker auf Strukturierung und sachliche Prüfung setzen, während das Team eher über Beziehung und dialogorientierte Abstimmung arbeitet.";
  }

  let tempoText = `Die Besetzung setzt einen anderen Rhythmus als das bestehende Team.`;
  if (delta.impulsiv > 12) {
    tempoText += " Dadurch entsteht spürbar mehr Umsetzungsdynamik, erhöhte operative Taktung und direktere Bewegung in Themen. Das kann Leistung freisetzen, aber auch als Druck empfunden werden.";
  } else if (delta.impulsiv < -12) {
    tempoText += " Dadurch kann die Besetzung im Umfeld eines sehr dynamischen Teams als zu bedacht oder zu vorsichtig wahrgenommen werden.";
  } else {
    tempoText += " Hier ist keine starke Abweichung zu erwarten. Der Arbeitsrhythmus dürfte grundsätzlich anschlussfähig sein.";
  }

  let communicationText = "Die Kommunikationsstruktur im Team wird ebenfalls beeinflusst. Dabei geht es nicht nur um Gesprächsstil, sondern auch darum, wie offen abgestimmt wird, wie viel Erklärung notwendig ist und wie Konflikte adressiert werden.";
  if (delta.intuitiv > 12) {
    communicationText += " Die Besetzung bringt mehr Beziehungs- und Abstimmungsorientierung ein. Das kann Vertrauen stärken und die Schnittstellenqualität verbessern.";
  } else if (delta.intuitiv < -12) {
    communicationText += " Die Besetzung bringt weniger Abstimmungsorientierung mit als das Team. Dadurch kann sie direkter, knapper oder weniger anschlussfähig wirken.";
  } else {
    communicationText += " Die Kommunikationslogik liegt nah am Team. Dadurch besteht in diesem Bereich eine solide Basis für die Zusammenarbeit.";
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
  const roleStart = roleType === "leadership" ? `Die Besetzung verstärkt in der Führungsfunktion` : `Die Besetzung verstärkt im Arbeitsalltag`;

  const controlled = `${roleStart} unter kontrolliertem Druck in der Regel die Hauptlogik. Im vorliegenden Profil tritt daher ${componentBusinessName(primary).toLowerCase()} noch deutlicher in den Vordergrund. Entscheidungen werden klarer aus dieser Linie heraus getroffen, Prioritäten werden stärker verdichtet und das Verhalten wirkt eindeutiger als im Normalzustand.\n\nFür das Team bedeutet das: Unter Ziel- und Leistungsdruck wird der Unterschied zur gewohnten Teamlogik sichtbarer. Das kann positiv sein, wenn genau diese Stärke gebraucht wird. Es kann aber auch Reibung auslösen, wenn das Team unter Belastung ein anderes Muster erwartet.`;

  const uncontrolled = `Wenn Belastung sehr hoch wird oder über längere Zeit anhält, verliert die Hauptlinie an Stabilität. Dann tritt der zweite Bereich des Profils stärker hervor. Im vorliegenden Fall gewinnt ${componentBusinessName(secondary).toLowerCase()} an Einfluss. Dadurch kann das Verhalten für das Umfeld wechselhafter und weniger berechenbar wirken als im Normalzustand.\n\nFür das Team ist wichtig, diese Verschiebung frühzeitig zu erkennen. Unter hoher Belastung braucht es klare Vereinbarungen, kurze Entscheidungswege und eine bewusste Steuerung der Zusammenarbeit. Ohne diese Maßnahmen kann aus Leistungsdruck schnell Orientierungsverlust werden.`;

  return { controlled, uncontrolled };
}

function getChances(teamProfile: Triad, personProfile: Triad, roleTitle: string, roleType: string): string[] {
  const systemwirkung = getSystemwirkung(teamProfile, personProfile);
  const personPrimary = getPrimaryKey(personProfile);
  const list: string[] = [];

  if (systemwirkung === "Ergänzung") {
    list.push(`Die Besetzung stärkt einen Bereich, der im Team bisher weniger Gewicht hat. Dadurch kann das Team breiter, widerstandsfähiger und in der Gesamtwirkung leistungsfähiger aufgestellt werden.`);
  } else if (systemwirkung === "Verstärkung") {
    list.push(`Die Besetzung baut eine bestehende Stärke des Teams weiter aus. Dadurch können Klarheit, Stabilität und Verbindlichkeit im Alltag zunehmen.`);
  } else {
    list.push("Die Unterschiede zwischen Team und Besetzung eröffnen neue Perspektiven. Bei bewusster Steuerung kann daraus eine nachhaltige Weiterentwicklung des Teamsystems entstehen.");
  }

  if (personPrimary === "impulsiv") {
    list.push(`Die höhere Umsetzungsorientierung der Besetzung kann dem Team mehr operative Geschwindigkeit, Entscheidungsbeschleunigung und direktere Ergebnisorientierung geben, wenn diese Energie klar in Prioritäten und Standards eingebettet wird.`);
  }
  if (personPrimary === "intuitiv") {
    list.push(`Die stärkere Kommunikationsorientierung der Besetzung kann die Zusammenarbeit an Schnittstellen stärken, die Abstimmungsqualität erhöhen und die Anschlussfähigkeit des Teams nach innen und außen verbessern.`);
  }
  if (personPrimary === "analytisch") {
    list.push(`Die stärkere Strukturorientierung der Besetzung kann mehr Ordnung, Nachvollziehbarkeit und Prozesssicherheit in den Arbeitsalltag bringen. Das erhöht Qualitätsstandards und Verbindlichkeit.`);
  }

  list.push("Die Konstellation bietet die Möglichkeit, bisher schwächere Arbeitsbereiche im Team gezielt zu stärken und dadurch die Gesamtleistungsfähigkeit auf eine breitere Basis zu stellen.");

  list.push(roleType === "leadership"
    ? `In der Führungsfunktion kann die Besetzung neue Standards setzen und dem Team eine klarere Richtung geben, wenn Erwartungen frühzeitig und eindeutig verankert werden.`
    : `Als Teammitglied kann die Besetzung neue Impulse geben, ohne die bestehende Struktur sofort grundsätzlich zu verändern.`);

  return list.slice(0, 5);
}

function getRisks(teamProfile: Triad, personProfile: Triad, roleTitle: string, roleType: string): string[] {
  const systemwirkung = getSystemwirkung(teamProfile, personProfile);
  const delta = getDelta(teamProfile, personProfile);
  const list: string[] = [];

  list.push("Unterschiedliche Arbeitslogiken können im Alltag zu Missverständnissen führen, wenn nicht klar definiert wird, wie Entscheidungen getroffen, Prioritäten gesetzt und Ergebnisse bewertet werden.");

  if (Math.abs(delta.impulsiv) > 15) {
    list.push("Die abweichende operative Taktung kann im Team als unangemessener Druck oder als fehlende Umsetzungsgeschwindigkeit wahrgenommen werden. Das erzeugt unnötige Spannungen in der täglichen Zusammenarbeit.");
  }
  if (Math.abs(delta.intuitiv) > 15) {
    list.push("Die Unterschiede in Kommunikation und Abstimmungstiefe können zu struktureller Reibung führen. Was für die eine Seite effizient wirkt, kann für die andere als zu knapp oder zu abstimmungsintensiv empfunden werden.");
  }
  if (Math.abs(delta.analytisch) > 15) {
    list.push("Abweichungen in Struktur und Analyse wirken sich direkt auf Nachverfolgung, Dokumentation, Qualitätsanspruch und die Verbindlichkeit von Vereinbarungen aus.");
  }

  if (systemwirkung === "Transformation") {
    list.push(`Die Besetzung verändert das Teamsystem deutlich. Ohne aktive Steuerung kann dies zu Orientierungsverlust, Widerstand oder einem schleichenden Kulturkonflikt führen.`);
  } else if (systemwirkung === "Spannung") {
    list.push("Die Konstellation erzeugt eine dauerhafte Reibungsfläche. Wird diese nicht aktiv geführt, steigt das Risiko wiederkehrender Konflikte und sinkender Teamstabilität.");
  } else {
    list.push("Auch eine grundsätzlich passende Konstellation birgt das Risiko, dass das Team einseitiger wird und schwächere Bereiche weiter an Gewicht verlieren.");
  }

  list.push(roleType === "leadership"
    ? `In einer Führungsfunktion wirkt die Besetzung mit hoher Hebelwirkung. Unklare Führungspräsenz verstärkt Orientierungsverlust, Prioritätenkonflikte und nachlassende Teamstabilität.`
    : `Ohne aktive Integration kann die Besetzung entweder gebremst werden oder dauerhaft gegen das bestehende Muster arbeiten, was zu schleichendem Leistungsverlust führt.`);

  return list.slice(0, 5);
}

function getAdvice(roleType: string, teamProfile: Triad, personProfile: Triad, roleTitle: string): AdviceItem[] {
  const personPrimary = getPrimaryKey(personProfile);

  return [
    {
      title: "Erwartungen verankern",
      text: `Zu Beginn sollte offen benannt werden, welche Arbeitslogik das Team heute prägt und welche Wirkung von der Besetzung erwartet wird. Tempo, Abstimmungstiefe und Qualitätsanspruch sollten nicht vorausgesetzt, sondern explizit definiert und verbindlich vereinbart werden.`,
    },
    {
      title: "Entscheidungsarchitektur klären",
      text: "Es sollte klar definiert werden, welche Themen schnell entschieden werden, wo Abstimmung notwendig ist und welche Standards verbindlich gelten. So wird verhindert, dass Unterschiede in der Arbeitslogik zu unnötiger Reibung und Orientierungsverlust führen.",
    },
    {
      title: "Stärken gezielt einsetzen",
      text: `Die Besetzung sollte nicht nur am Teamprofil gemessen, sondern gezielt in den stärksten Bereichen eingesetzt werden. Im vorliegenden Fall betrifft das vor allem ${componentBusinessName(personPrimary).toLowerCase()}. Dort entsteht der größte Mehrwert für das Gesamtsystem.`,
    },
    {
      title: roleType === "leadership" ? "Führungspräsenz sichtbar machen" : "Integration aktiv steuern",
      text: roleType === "leadership"
        ? `Die Besetzung sollte in den ersten Wochen Prioritäten, Kommunikationsstandards und Entscheidungspraxis besonders klar machen. Das Team braucht frühzeitig erkennbare Orientierung und eine verlässliche Führungsarchitektur.`
        : `In den ersten Wochen braucht die Besetzung eine aktive Einbindung in Teamabläufe, Schnittstellen und Abstimmungsformate. Integration darf nicht dem Zufall überlassen werden.`,
    },
    {
      title: "Strukturierte Feedbackschleifen einbauen",
      text: "Nach zwei, vier und acht Wochen sollten strukturierte Rückmeldungen eingeholt werden. So lassen sich Erwartungsunterschiede, Tempokonflikte und Reibung in der Zusammenarbeit frühzeitig erkennen und gezielt nachsteuern.",
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
