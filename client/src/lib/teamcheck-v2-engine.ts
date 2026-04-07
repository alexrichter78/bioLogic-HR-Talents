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
  integrationEffort: string;
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

export function getPrimaryKey(profile: Triad): ComponentKey {
  return sortProfile(profile)[0].key;
}

export function getSecondaryKey(profile: Triad): ComponentKey {
  return sortProfile(profile)[1].key;
}

const COMP_VARIANTS: Record<ComponentKey, string[]> = {
  impulsiv: [
    "Umsetzung und Tempo",
    "operative Dynamik und Entscheidungsdichte",
    "Handlungsorientierung und Geschwindigkeit",
    "Aktivität und Ergebnisorientierung",
  ],
  intuitiv: [
    "Zusammenarbeit und Kommunikation",
    "Austausch und persönliche Ansprache",
    "Abstimmung und Beziehungsorientierung",
    "Dialog und zwischenmenschliche Wirkung",
  ],
  analytisch: [
    "Struktur und Analyse",
    "Ordnung und sachliche Prüfung",
    "Systematik und Prozesssicherheit",
    "Nachvollziehbarkeit und Qualitätsorientierung",
  ],
};

const variantCounter: Record<ComponentKey, number> = { impulsiv: 0, intuitiv: 0, analytisch: 0 };

function resetVariants() {
  variantCounter.impulsiv = 0;
  variantCounter.intuitiv = 0;
  variantCounter.analytisch = 0;
}

function componentBusinessName(key: ComponentKey): string {
  const variants = COMP_VARIANTS[key];
  const idx = variantCounter[key] % variants.length;
  variantCounter[key]++;
  return variants[idx];
}

export function componentBusinessNameFirst(key: ComponentKey): string {
  return COMP_VARIANTS[key][0];
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
  impulsiv_intuitiv_analytisch: `Die Besetzung arbeitet primär über Handlungsorientierung und Geschwindigkeit. Themen werden zügig aufgegriffen, Entscheidungen konsequent nach vorn getrieben.\n\nDer zweite Schwerpunkt liegt im Austausch und in der persönlichen Ansprache. Dadurch bleibt die Besetzung trotz hoher Dynamik anschlussfähig an das Umfeld. Ordnung und sachliche Prüfung sind vorhanden, stehen jedoch nicht im Vordergrund.\n\nIm Arbeitsalltag zeigt sich das in hoher Eigeninitiative und klarer Aktionsorientierung. Chancen entstehen dort, wo operative Geschwindigkeit und direkte Wirkung gefragt sind. Risiken bestehen dort, wo konsequente Nachverfolgung und disziplinierte Prozessführung dauerhaft erforderlich sind.`,
  impulsiv_analytisch_intuitiv: `Die Besetzung arbeitet primär über operative Dynamik und Entscheidungsdichte. Der zweite Schwerpunkt liegt auf Systematik und Prozesssicherheit.\n\nDadurch verbindet sie hohe Aktivität mit einem ausgeprägten Blick für Zielklarheit und sachliche Ordnung. Austausch und Beziehungspflege sind vorhanden, stehen aber nicht an erster Stelle.\n\nIm Arbeitsalltag zeigt sich das in konsequenter Zielorientierung und einer guten Fähigkeit, Themen nicht nur anzustossen, sondern geordnet zu steuern. Chancen liegen in Durchsetzungskraft und Verbindlichkeit. Risiken entstehen dort, wo Abstimmung oder sensible Teamdynamik zu wenig Raum erhalten.`,
  intuitiv_impulsiv_analytisch: `Die Besetzung arbeitet primär über Austausch und persönliche Ansprache. Der zweite Schwerpunkt liegt auf Handlungsorientierung und Geschwindigkeit.\n\nDadurch verbindet sie Kontaktstärke mit Aktivität und wirkt häufig verbindend und beweglich. Ordnung und sachliche Prüfung sind vorhanden, aber nicht die tragende Leitlinie.\n\nIm Arbeitsalltag zeigt sich das in schneller Kontaktaufnahme und hoher Wirksamkeit in Gesprächen. Chancen liegen in Netzwerkaufbau und positiver Präsenz. Risiken entstehen dort, wo konsequente Nachverfolgung und analytische Tiefe dauerhaft gefordert sind.`,
  intuitiv_analytisch_impulsiv: `Die Besetzung arbeitet primär über Dialog und zwischenmenschliche Wirkung. Der zweite Schwerpunkt liegt auf Nachvollziehbarkeit und Qualitätsorientierung.\n\nDadurch verbindet sie Beziehungsstärke mit einem geordneten, reflektierten Vorgehen. Geschwindigkeit und spontane Aktivität sind vorhanden, stehen aber nicht im Vordergrund.\n\nIm Arbeitsalltag zeigt sich das in ruhiger Gesprächsführung und konsistenter Abstimmung mit dem Umfeld. Chancen liegen in Vertrauensbildung und Verlässlichkeit. Risiken entstehen dort, wo schnelle Entscheidungen oder kurzfristiger Handlungsdruck erforderlich sind.`,
  analytisch_impulsiv_intuitiv: `Die Besetzung arbeitet primär über Ordnung und sachliche Prüfung. Der zweite Schwerpunkt liegt auf Handlungsorientierung und Geschwindigkeit.\n\nDadurch bringt sie eine klare Ordnung in Themen und kann Entscheidungen auch konsequent in die Umsetzung überführen. Austausch und Beziehungspflege sind vorhanden, aber nicht der primäre Antrieb.\n\nIm Arbeitsumfeld zeigt sich das in sauberer Vorbereitung und disziplinierter Arbeitsweise. Chancen liegen in Steuerbarkeit und belastbaren Entscheidungen. Risiken entstehen dort, wo hohe Flexibilität oder spontane Anpassung im Vordergrund stehen.`,
  analytisch_intuitiv_impulsiv: `Die Besetzung arbeitet primär über Systematik und Prozesssicherheit. Der zweite Schwerpunkt liegt auf Abstimmung und Beziehungsorientierung.\n\nDadurch verbindet sie Sorgfalt und nachvollziehbare Entscheidungen mit einem kooperativen Umgang. Geschwindigkeit und spontane Aktivität sind vorhanden, aber nicht die bevorzugte Linie.\n\nIm Arbeitsalltag zeigt sich das in gut vorbereiteten Gesprächen und verlässlicher Abstimmung. Chancen liegen in Qualität und professioneller Wirkung. Risiken entstehen dort, wo ein sehr hohes Tempo oder spontane Marktreaktion gefordert sind.`,
  impulsiv_intuitiv_doppeldominanz: `Die Besetzung zeigt eine Doppeldominanz aus Handlungsorientierung und Austausch. Sie bringt sowohl Geschwindigkeit als auch Kontaktstärke mit.\n\nEntscheidungen werden häufig zügig getroffen, gleichzeitig bleibt die Wirkung auf das Umfeld wichtig. Ordnung und sachliche Prüfung stehen deutlich im Hintergrund.\n\nIm Arbeitsalltag kann dieses Profil sehr wirksam sein, wenn Aktivität und Beziehungsarbeit gebraucht werden. Risiken liegen vor allem in nachlassender Ordnung und wechselnden Prioritäten unter Belastung.`,
  impulsiv_analytisch_doppeldominanz: `Die Besetzung zeigt eine Doppeldominanz aus operativer Dynamik und Systematik. Sie verbindet Aktivität mit Sachorientierung und arbeitet häufig zugleich entschlossen und klar.\n\nAustausch und Beziehungspflege sind vorhanden, haben aber weniger Gewicht als Ergebnisorientierung und Ordnung.\n\nIm Arbeitsalltag kann dieses Profil besonders stark sein, wenn Zielklarheit und Verbindlichkeit gefragt sind. Risiken entstehen dort, wo Abstimmung oder sensible zwischenmenschliche Dynamik eine grössere Rolle spielen.`,
  intuitiv_analytisch_doppeldominanz: `Die Besetzung zeigt eine Doppeldominanz aus Dialog und Systematik. Sie verbindet kooperative Abstimmung mit einem geordneten, nachvollziehbaren Vorgehen.\n\nGeschwindigkeit ist vorhanden, aber nicht die bevorzugte erste Reaktion.\n\nIm Arbeitsalltag zeigt sich das in verlässlicher Gesprächsführung und stabiler Prozessführung. Chancen liegen in Qualität und Vertrauensbildung. Risiken entstehen dort, wo ein sehr hohes Handlungstempo gefordert ist.`,
  impulsiv_mit_gleicher_nebenlage: `Die Besetzung ist klar auf Handlungsorientierung und Geschwindigkeit ausgerichtet. Die beiden übrigen Bereiche sind in ähnlicher Stärke vorhanden, konkurrieren aber nicht um die Hauptlinie.\n\nIm Zentrum steht das konsequente Vorantreiben von Themen und direkte Wirkung.\n\nIm Arbeitsalltag zeigt sich das in hoher Energie und klarer Eigeninitiative. Chancen liegen in operativer Geschwindigkeit und sichtbarer Leistung. Risiken entstehen dort, wo das Umfeld mehr Abstimmung oder strukturelle Sorgfalt verlangt.`,
  intuitiv_mit_gleicher_nebenlage: `Die Besetzung ist klar auf Austausch und Beziehungsorientierung ausgerichtet. Die beiden übrigen Bereiche sind in ähnlicher Stärke vorhanden, stehen aber hinter der Hauptlinie zurück.\n\nIm Zentrum stehen Beziehung, Vertrauen und zwischenmenschliche Wirkung.\n\nIm Arbeitsalltag zeigt sich das in verbindender Gesprächsführung und kooperativer Teamwirkung. Chancen liegen in Beziehungsaufbau und nachhaltiger Integration. Risiken entstehen dort, wo konsequente Steuerung oder harte Priorisierung gefragt sind.`,
  analytisch_mit_gleicher_nebenlage: `Die Besetzung ist klar auf Nachvollziehbarkeit und Qualitätsorientierung ausgerichtet. Die beiden übrigen Bereiche sind in ähnlicher Stärke vorhanden, aber nicht führend.\n\nIm Zentrum stehen Klarheit, sachliche Prüfung und geordnete Arbeitsweise.\n\nIm Arbeitsalltag zeigt sich das in Verlässlichkeit und kontrolliertem Vorgehen. Chancen liegen in Stabilität und sauberer Steuerung. Risiken entstehen dort, wo spontane Anpassung und offensive Handlungsenergie im Vordergrund stehen.`,
  alle_gleich: `Die Besetzung zeigt ein ausgeglichenes Profil. Aktivität, Austausch und Ordnung sind in ähnlicher Stärke ausgeprägt.\n\nEs gibt keine einseitige Hauptlinie, sondern eine breite Anschlussfähigkeit an unterschiedliche Anforderungen.\n\nIm Arbeitsalltag kann dieses Profil sehr flexibel wirken. Chancen liegen in Vielseitigkeit und Balance. Risiken entstehen dort, wo das Umfeld eine besonders klare Kante oder eine sehr eindeutige Arbeitslogik verlangt.`,
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

export function getSystemwirkung(teamProfile: Triad, personProfile: Triad): string {
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);
  const distance = getDistanceScore(teamProfile, personProfile);

  const personSorted = sortProfile(personProfile);
  const personTop2Gap = personSorted[0].value - personSorted[1].value;
  const personTop2Keys = new Set([personSorted[0].key, personSorted[1].key]);
  const teamSorted = sortProfile(teamProfile);
  const teamTop2Gap = teamSorted[0].value - teamSorted[1].value;
  const teamTop2Keys = new Set([teamSorted[0].key, teamSorted[1].key]);
  const effectiveSamePrimary = teamPrimary === personPrimary ||
    (personTop2Gap < 3 && personTop2Keys.has(teamPrimary)) ||
    (teamTop2Gap < 3 && teamTop2Keys.has(personPrimary));

  if (distance <= 16) return "Verstärkung";
  if (effectiveSamePrimary && distance <= 42) return "Verstärkung";

  if (!effectiveSamePrimary) {
    const teamSecTerGap = teamSorted[1].value - teamSorted[2].value;
    const personSecTerGap = personSorted[1].value - personSorted[2].value;
    const sameTop2 = teamSecTerGap >= 3 && personSecTerGap >= 3 &&
      teamTop2Keys.size === personTop2Keys.size &&
      [...teamTop2Keys].every(k => personTop2Keys.has(k));
    if (sameTop2 && distance <= 50) return "Verstärkung";
  }

  if (distance >= 70) return "Transformation";
  return "Spannung";
}

function getGapMetrics(person: Triad, team: Triad) {
  const gapImpulsiv = diff(person.impulsiv, team.impulsiv);
  const gapIntuitiv = diff(person.intuitiv, team.intuitiv);
  const gapAnalytisch = diff(person.analytisch, team.analytisch);
  const totalGap = gapImpulsiv + gapIntuitiv + gapAnalytisch;
  const maxGap = Math.max(gapImpulsiv, gapIntuitiv, gapAnalytisch);
  return { gapImpulsiv, gapIntuitiv, gapAnalytisch, totalGap, maxGap };
}

type ProfileKind = "BALANCED" | "CLEAR" | "MIXED";

function getSpread(profile: Triad): number {
  const values = [round(profile.impulsiv), round(profile.intuitiv), round(profile.analytisch)];
  return Math.max(...values) - Math.min(...values);
}

function getProfileKind(profile: Triad): ProfileKind {
  const spread = getSpread(profile);
  const topGap = sortProfile(profile)[0].value - sortProfile(profile)[1].value;
  if (spread <= 10) return "BALANCED";
  if (topGap >= 8) return "CLEAR";
  return "MIXED";
}

function buildFitMetrics(personProfile: Triad, teamProfile: Triad) {
  const g = getGapMetrics(personProfile, teamProfile);
  const personKind = getProfileKind(personProfile);
  const teamKind = getProfileKind(teamProfile);
  const sameTop = getPrimaryKey(personProfile) === getPrimaryKey(teamProfile);
  const bothBalanced = personKind === "BALANCED" && teamKind === "BALANCED";
  const oneBalanced = (personKind === "BALANCED") !== (teamKind === "BALANCED");
  const bothClear = personKind === "CLEAR" && teamKind === "CLEAR";
  const bothClearDifferentTop = bothClear && !sameTop;
  const bothClearSameTop = bothClear && sameTop;
  return { ...g, personKind, teamKind, sameTop, bothBalanced, oneBalanced, bothClear, bothClearDifferentTop, bothClearSameTop };
}

function getPassung(teamProfile: Triad, personProfile: Triad, _roleType: string): string {
  const m = buildFitMetrics(personProfile, teamProfile);

  if (m.bothBalanced) {
    if (m.maxGap <= 5 && m.totalGap <= 12) return "Passend";
    if (m.maxGap <= 10 && m.totalGap <= 24) return "Bedingt passend";
    return "Kritisch";
  }

  if (m.oneBalanced) {
    if (m.maxGap <= 5 && m.totalGap <= 15) return "Passend";
    if (m.maxGap <= 10 && m.totalGap <= 26) return "Bedingt passend";
    return "Kritisch";
  }

  if (m.bothClearDifferentTop) {
    if (m.totalGap >= 24 || m.maxGap >= 12) return "Kritisch";
    return "Bedingt passend";
  }

  if (m.bothClearSameTop) {
    if (m.totalGap <= 20 && m.maxGap <= 10) return "Passend";
    if (m.totalGap <= 30 && m.maxGap <= 14) return "Bedingt passend";
    return "Kritisch";
  }

  if (m.sameTop) {
    if (m.totalGap <= 20 && m.maxGap <= 10) return "Passend";
    if (m.totalGap <= 30 && m.maxGap <= 14) return "Bedingt passend";
    return "Kritisch";
  }

  if (m.totalGap >= 30 || m.maxGap >= 14) return "Kritisch";
  return "Bedingt passend";
}

function getIntegrationEffort(teamProfile: Triad, personProfile: Triad, roleType: string): string {
  const m = buildFitMetrics(personProfile, teamProfile);
  const teamFit = getPassung(teamProfile, personProfile, roleType);
  const isLeader = roleType === "leadership";

  let label: string;

  if (m.bothBalanced) {
    if (m.maxGap <= 5 && m.totalGap <= 12) label = "gering";
    else if (m.maxGap <= 10 && m.totalGap <= 24) label = "mittel";
    else label = "hoch";
  } else if (m.oneBalanced) {
    if (m.maxGap <= 5 && m.totalGap <= 15) label = "gering";
    else if (m.maxGap <= 10 && m.totalGap <= 26) label = "mittel";
    else label = "hoch";
  } else if (m.bothClearDifferentTop) {
    if (m.totalGap >= 24 || m.maxGap >= 12) label = "hoch";
    else label = "mittel";
  } else {
    if (m.totalGap <= 20 && m.maxGap <= 10) label = "gering";
    else if (m.totalGap <= 30 && m.maxGap <= 14) label = "mittel";
    else label = "hoch";
  }

  if (isLeader && (teamFit === "Kritisch" || m.bothClearDifferentTop || m.totalGap >= 30)) {
    label = "hoch";
  }

  if (teamFit === "Kritisch" && label === "gering") {
    label = "mittel";
  }
  if (teamFit === "Kritisch" && (m.bothClearDifferentTop || m.totalGap >= 24)) {
    label = "hoch";
  }

  return label;
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
    return `${RolleRef(roleTitle)} trifft auf ein Team mit ausgeglichenem Profil. Aktivität, Austausch und Ordnung sind in ähnlicher Stärke vorhanden.\n\nDadurch besteht eine breite Anschlussfähigkeit an unterschiedliche Anforderungen. Gleichzeitig besteht die Gefahr, dass keine Arbeitslogik konsequent genug getragen wird, wenn Prioritäten nicht klar verankert werden.`;
  }
  if (primary === "impulsiv") {
    return `${RolleRef(roleTitle)} trifft auf ein Team, das primär auf Handlungsorientierung und Geschwindigkeit ausgerichtet ist. Im Alltag zeigt sich das in hoher Aktivität, schneller Themenbearbeitung und einer klaren operativen Taktung.\n\nEntscheidungen werden pragmatisch und zügig getroffen. Das ist besonders wertvoll, wenn sichtbare Ergebnisse und direkte Wirkung gefragt sind. Gleichzeitig steigt das Risiko, dass Abstimmung und konsequente Nachverfolgung zu wenig Aufmerksamkeit erhalten.`;
  }
  if (primary === "intuitiv") {
    return `${RolleRef(roleTitle)} trifft auf ein Team, das primär auf Austausch und Beziehungsorientierung ausgerichtet ist. Im Alltag zeigt sich das in ausgeprägter Abstimmung und einem eher gemeinsamen als rein individuellen Vorgehen.\n\nDas ist besonders wertvoll, wenn Kundennähe und Vertrauensbildung tragende Erfolgsfaktoren sind. Gleichzeitig steigt das Risiko, dass Entscheidungen zu lange abgestimmt werden und klare Prioritäten nicht konsequent genug durchgesetzt werden.`;
  }
  return `${RolleRef(roleTitle)} trifft auf ein Team, das primär auf Ordnung und sachliche Prüfung ausgerichtet ist. Im Alltag zeigt sich das in geordneten Abläufen, nachvollziehbaren Entscheidungen und einer sachlich geprägten Herangehensweise.\n\nDas ist besonders wertvoll, wenn Qualität und Verlässlichkeit entscheidend sind. Gleichzeitig steigt das Risiko, dass operative Dynamik und schnelle Handlungsfähigkeit an Kraft verlieren.`;
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

    return { key, title: componentBusinessNameFirst(key), teamValue, personValue, interpretation };
  });
}

function getSystemwirkungText(teamProfile: Triad, personProfile: Triad, roleTitle: string, roleType: string): string {
  const systemwirkung = getSystemwirkung(teamProfile, personProfile);
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);

  const intro = roleType === "leadership"
    ? `Die Besetzung wirkt in der Führungsfunktion nicht nur als einzelne Stellenbesetzung, sondern setzt im Team spürbare Schwerpunkte. Die Arbeitslogik beeinflusst Prioritäten, Entscheidungen und die Art, wie Leistung im Alltag gesteuert wird.`
    : `Die Besetzung wirkt im Teamalltag vor allem über den täglichen Kontakt, den Arbeitsrhythmus und die Art, wie Aufgaben koordiniert werden.`;

  if (systemwirkung === "Verstärkung") {
    return `${intro}\n\nDie Konstellation wirkt als Verstärkung. Die Besetzung bringt eine Arbeitslogik mit, die zum Grundmuster des Teams passt. Bestehende Stärken werden dadurch weiter ausgebaut.\n\nFür ${rolleRef(roleTitle)} bedeutet das: ${componentBusinessName(teamPrimary)} wird durch die Besetzung zusätzlich getragen. Das fördert Stabilität und eine schnellere Eingliederung.\n\nGleichzeitig ist darauf zu achten, dass das Team nicht noch einseitiger wird und schwächere Bereiche weiter an Gewicht verlieren.`;
  }
  if (systemwirkung === "Ergänzung") {
    return `${intro}\n\nDie Konstellation wirkt als Ergänzung. Die Besetzung bringt eine Qualität ins Team, die bisher weniger stark ausgeprägt ist. Dadurch kann das Team breiter und leistungsfähiger werden.\n\nFür ${rolleRef(roleTitle)} bedeutet das: Das Team erhält mehr Gewicht in ${componentBusinessName(personPrimary).toLowerCase()}. Das ist grundsätzlich eine Chance.\n\nGleichzeitig entsteht eine natürliche Reibung, weil das Team andere Schwerpunkte gewohnt ist. Der Nutzen zeigt sich nur dann voll, wenn Unterschiede transparent gemacht und gemeinsame Spielregeln verankert werden.`;
  }
  if (systemwirkung === "Transformation") {
    return `${intro}\n\nDie Konstellation wirkt als deutliche Veränderung. Die Besetzung bringt eine Arbeitslogik mit, die das Team spürbar in eine neue Richtung ziehen kann. Das ist kein moderater Impuls, sondern ein struktureller Eingriff.\n\nFür ${rolleRef(roleTitle)} bedeutet das: ${componentBusinessName(personPrimary)} gewinnt deutlich an Gewicht, während das bisherige Teammuster relativiert wird.\n\nDas kann eine bewusste strategische Entscheidung sein, verlangt aber in jedem Fall aktive Führung und eine klare Steuerungsarchitektur.`;
  }
  return `${intro}\n\nDie Konstellation erzeugt Spannung. Die Besetzung bringt eine Arbeitslogik mit, die in wichtigen Punkten vom Team abweicht. Diese Unterschiede können produktiv sein, wenn sie bewusst genutzt werden.\n\nOhne klare Steuerung besteht die Gefahr, dass Arbeitsweisen gegeneinander statt miteinander wirken.\n\nFür ${rolleRef(roleTitle)} bedeutet das: Das Team setzt stärker auf ${componentBusinessName(teamPrimary).toLowerCase()}, die Besetzung stärker auf ${componentBusinessName(personPrimary).toLowerCase()}. Dadurch entstehen unterschiedliche Erwartungen an Prioritäten und Handlungsgeschwindigkeit.`;
}

function getImpactTexts(teamProfile: Triad, personProfile: Triad, roleTitle: string, roleType: string): ImpactItem[] {
  const teamPrimary = getPrimaryKey(teamProfile);
  const personPrimary = getPrimaryKey(personProfile);
  const delta = getDelta(teamProfile, personProfile);
  const prefix = roleType === "leadership" ? `Die Besetzung prägt in der Führungsfunktion` : `Die Besetzung zeigt im Teamalltag`;

  const decisionText = `${prefix} Entscheidungen stärker aus ${componentBusinessName(personPrimary).toLowerCase()} heraus. Das Team ist hingegen stärker an ${componentBusinessName(teamPrimary).toLowerCase()} orientiert. Im Alltag zeigt sich das vor allem darin, wie schnell entschieden wird, wie viel Abstimmung eingeholt wird und woran Entscheidungsqualität gemessen wird.`;

  let steeringText = `Die Besetzung setzt andere Akzente als das Team. Dadurch verschieben sich Prioritäten und die Art, wie Aufgaben verfolgt und bewertet werden.`;
  if (delta.analytisch < -15) {
    steeringText += " Besonders sichtbar wird das in der Nachverfolgung und in der Frage, wie konsequent Prozesse und Standards eingehalten werden.";
  } else if (delta.analytisch > 15) {
    steeringText += " Besonders sichtbar wird das in klarerer Ordnung und höherer Prozesssicherheit.";
  }

  let dynamicText = "In der Teamdynamik werden Unterschiede im Alltag spürbar. Das betrifft vor allem Erwartungshaltung und die Frage, was als leistungsfähiges Arbeiten gilt.";
  if (personPrimary === "impulsiv" && teamPrimary === "intuitiv") {
    dynamicText += " Die Besetzung drängt stärker auf unmittelbare Ergebnisse und höhere operative Taktung. Das Team arbeitet hingegen stärker über gemeinsame Einordnung.";
  } else if (personPrimary === "analytisch" && teamPrimary === "impulsiv") {
    dynamicText += " Die Besetzung achtet stärker auf Ordnung und Nachvollziehbarkeit. Das Team setzt hingegen eher auf Geschwindigkeit und direkte Wirkung.";
  } else if (personPrimary === "intuitiv" && teamPrimary === "analytisch") {
    dynamicText += " Die Besetzung achtet stärker auf Austausch und Beziehungspflege. Das Team arbeitet hingegen eher über Sachlogik und Systematik.";
  } else if (personPrimary === "impulsiv" && teamPrimary === "analytisch") {
    dynamicText += " Die Besetzung setzt stärker auf Geschwindigkeit und Entscheidungsbeschleunigung. Das Team achtet hingegen eher auf Gründlichkeit und Nachvollziehbarkeit.";
  } else if (personPrimary === "intuitiv" && teamPrimary === "impulsiv") {
    dynamicText += " Die Besetzung setzt stärker auf Dialog und Abstimmung. Das Team arbeitet hingegen eher über direkte Aktivität und schnelle Ergebnisse.";
  } else if (personPrimary === "analytisch" && teamPrimary === "intuitiv") {
    dynamicText += " Die Besetzung setzt stärker auf Strukturierung und sachliche Prüfung. Das Team arbeitet hingegen eher über Beziehung und dialogorientierte Abstimmung.";
  }

  let tempoText = `Die Besetzung setzt einen anderen Rhythmus als das bestehende Team.`;
  if (delta.impulsiv > 12) {
    tempoText += " Dadurch entsteht spürbar mehr Umsetzungsdynamik, erhöhte operative Taktung und direktere Bewegung in Themen. Das kann Leistung freisetzen, aber auch als Druck empfunden werden.";
  } else if (delta.impulsiv < -12) {
    tempoText += " Dadurch kann die Besetzung im Umfeld eines sehr dynamischen Teams als zu bedacht oder zu vorsichtig wahrgenommen werden.";
  } else {
    tempoText += " Hier ist keine starke Abweichung zu erwarten. Der Arbeitsrhythmus dürfte grundsätzlich anschlussfähig sein.";
  }

  let communicationText = "Die Gesprächskultur im Team wird ebenfalls beeinflusst. Dabei geht es nicht nur um den Stil, sondern auch darum, wie offen abgestimmt wird und wie Konflikte adressiert werden.";
  if (delta.intuitiv > 12) {
    communicationText += " Die Besetzung bringt mehr Beziehungs- und Dialogorientierung ein. Das kann Vertrauen stärken und die Schnittstellenqualität verbessern.";
  } else if (delta.intuitiv < -12) {
    communicationText += " Die Besetzung bringt weniger Dialogorientierung mit als das Team. Dadurch kann sie direkter oder knapper wirken.";
  } else {
    communicationText += " Die Gesprächslogik liegt nah am Team. Dadurch besteht hier eine solide Basis.";
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

  const controlled = `${roleStart} unter kontrolliertem Druck in der Regel die Hauptlogik. Im vorliegenden Profil tritt daher ${componentBusinessName(primary).toLowerCase()} noch deutlicher in den Vordergrund.\n\nEntscheidungen werden klarer aus dieser Linie heraus getroffen, Prioritäten stärker verdichtet. Das Verhalten wirkt eindeutiger als im Normalzustand.\n\nFür das Team bedeutet das: Unter Leistungsdruck wird der Unterschied zur gewohnten Teamlogik sichtbarer. Das kann positiv sein, wenn genau diese Stärke gebraucht wird. Es kann aber auch Reibung auslösen, wenn das Team ein anderes Muster erwartet.`;

  const uncontrolled = `Wenn Belastung sehr hoch wird oder über längere Zeit anhält, verliert die Hauptlinie an Stabilität. Dann tritt der zweite Bereich des Profils stärker hervor.\n\nIm vorliegenden Fall gewinnt ${componentBusinessName(secondary).toLowerCase()} an Einfluss. Das Verhalten kann für das Umfeld wechselhafter und weniger berechenbar wirken.\n\nFür das Team ist wichtig, diese Verschiebung frühzeitig zu erkennen. Unter hoher Belastung braucht es klare Vereinbarungen und kurze Entscheidungswege. Ohne diese Massnahmen kann aus Leistungsdruck schnell Orientierungsverlust werden.`;

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
    list.push(`Die stärkere Handlungsorientierung der Besetzung kann dem Team mehr operative Geschwindigkeit und direktere Ergebnisorientierung geben, wenn diese Energie klar in Prioritäten und Standards eingebettet wird.`);
  }
  if (personPrimary === "intuitiv") {
    list.push(`Die ausgeprägtere Dialogorientierung der Besetzung kann die Abstimmungsqualität erhöhen und die Anschlussfähigkeit des Teams nach innen und aussen verbessern.`);
  }
  if (personPrimary === "analytisch") {
    list.push(`Die stärkere Qualitätsorientierung der Besetzung kann mehr Ordnung, Nachvollziehbarkeit und Prozesssicherheit in den Arbeitsalltag bringen. Das erhöht Verbindlichkeit und Steuerbarkeit.`);
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
    list.push("Die abweichende operative Taktung kann im Team als unangemessener Druck oder als fehlende Handlungsgeschwindigkeit wahrgenommen werden. Das erzeugt unnötige Spannungen im Arbeitsalltag.");
  }
  if (Math.abs(delta.intuitiv) > 15) {
    list.push("Die Unterschiede in Austausch und Abstimmungstiefe können zu struktureller Reibung führen. Was für die eine Seite effizient wirkt, kann für die andere als zu knapp oder zu abstimmungsintensiv empfunden werden.");
  }
  if (Math.abs(delta.analytisch) > 15) {
    list.push("Abweichungen in Ordnung und sachlicher Prüfung wirken sich direkt auf Nachverfolgung, Qualitätsanspruch und die Verbindlichkeit von Vereinbarungen aus.");
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
      text: `Zu Beginn sollte offen benannt werden, welche Arbeitslogik das Team heute prägt und welche Wirkung von der Besetzung erwartet wird. Handlungsgeschwindigkeit, Abstimmungstiefe und Qualitätsanspruch sollten nicht vorausgesetzt, sondern explizit definiert und verbindlich vereinbart werden.`,
    },
    {
      title: "Entscheidungsarchitektur klären",
      text: "Es sollte klar definiert werden, welche Themen schnell entschieden werden, wo Abstimmung notwendig ist und welche Standards verbindlich gelten. So wird verhindert, dass Unterschiede in der Arbeitslogik zu unnötiger Reibung und Orientierungsverlust führen.",
    },
    {
      title: "Stärken gezielt einsetzen",
      text: `Die Besetzung sollte nicht nur am Teamprofil gemessen, sondern gezielt in den stärksten Bereichen eingesetzt werden. Im vorliegenden Fall betrifft das vor allem ${componentBusinessName(personPrimary).toLowerCase()}. Dort liegt der wahrscheinlichste zusätzliche Nutzen für das Team.`,
    },
    {
      title: roleType === "leadership" ? "Führungspräsenz sichtbar machen" : "Integration aktiv steuern",
      text: roleType === "leadership"
        ? `Die Besetzung sollte in den ersten Wochen Prioritäten, Kommunikationsstandards und Entscheidungspraxis besonders klar machen. Das Team braucht frühzeitig erkennbare Orientierung und eine verlässliche Führungsarchitektur.`
        : `In den ersten Wochen braucht die Besetzung eine aktive Einbindung in Teamabläufe, Schnittstellen und Abstimmungsformate. Integration darf nicht dem Zufall überlassen werden.`,
    },
    {
      title: "Strukturierte Feedbackschleifen einbauen",
      text: "Nach zwei, vier und acht Wochen sollten strukturierte Rückmeldungen eingeholt werden. So lassen sich Erwartungsunterschiede und Spannungen im Arbeitsalltag frühzeitig erkennen und gezielt nachsteuern.",
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
  resetVariants();
  const roleType = normalizeRoleLevel(input.roleLevel);
  const passung = getPassung(input.teamProfile, input.personProfile, roleType);
  const integrationEffort = getIntegrationEffort(input.teamProfile, input.personProfile, roleType);
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
    integrationEffort,
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
