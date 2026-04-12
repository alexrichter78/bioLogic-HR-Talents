/*
  matchcheck_texts_complete_replit.ts
  ----------------------------------
  Fertige Text-Engine für Replit

  Zweck:
  - Textlogik für alle 13 Strukturvarianten
  - sauber gekoppelt an FitSubtype
  - Sonderlogik für Doppeldominanz
  - gleiche Berichtsstruktur wie bisher

  Einbindung:
  1) Diese Datei nach client/src/lib/ legen
  2) Aus deiner Core-Engine Fit-Daten an buildMatchTexts(...) übergeben
  3) Ergebnis in der UI rendern
*/

export type TriadKey = 'I' | 'N' | 'A';
export type VariantType = 'ALL_EQUAL' | 'TOP_PAIR' | 'BOTTOM_PAIR' | 'ORDER';
export type FitLabel = 'Geeignet' | 'Bedingt geeignet' | 'Nicht geeignet';
export type FitSubtype = 'PERFECT' | 'STRUCTURE_MATCH_INTENSITY_OFF' | 'PARTIAL_MATCH' | 'MISMATCH';
export type Severity = 'ok' | 'warning' | 'critical';
export type ControlLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TriadProfile {
  I: number;
  N: number;
  A: number;
}

export interface DominanceMeta {
  sorted: Array<{ key: TriadKey; value: number }>;
  top: TriadKey;
  second: TriadKey;
  third: TriadKey;
  gap1: number;
  gap2: number;
  spread: number;
}

export interface VariantInfo {
  type: VariantType;
  code: string;
  dominance: DominanceMeta;
}

export interface PairRelations {
  I_N: -1 | 0 | 1;
  I_A: -1 | 0 | 1;
  N_A: -1 | 0 | 1;
}

export interface StructureRelation {
  type: 'EXACT' | 'SOFT_CONFLICT' | 'HARD_CONFLICT';
  mismatchCount: number;
  directFlip: boolean;
  reason: string;
}

export interface MatchTextInput {
  roleName: string;
  candName: string;
  roleProfile: TriadProfile;
  candProfile: TriadProfile;
  fitLabel: FitLabel;
  fitSubtype: FitSubtype;
  controlLevel?: ControlLevel;
  maxDiff: number;
  totalGap: number;
  diffs: TriadProfile;
  sollVariant: VariantInfo;
  istVariant: VariantInfo;
  sollRelations: PairRelations;
  istRelations: PairRelations;
  structureRelation: StructureRelation;
  fuehrungsArt?: 'keine' | 'fachlich' | 'disziplinarisch';
}

export interface SummaryBlock {
  summary: string;
  managementSummary: string;
  whyResult: string[];
  risks: string[];
  profileCompareIntro: string;
  finalText: string;
}

export interface ImpactArea {
  key: 'decision' | 'workstyle' | 'leadership' | 'communication' | 'culture';
  title: string;
  label: 'Stimmig' | 'Mit Abweichung' | 'Kritisch';
  severity: Severity;
  roleNeed: string;
  personText: string;
  interpretation: string;
}

export interface StressBlock {
  controlledPressure: string;
  uncontrolledStress: string;
}

export interface DevelopmentBlock {
  title: string;
  subtitle: string;
  scoreText: string;
  text1: string;
  text2: string;
}

export interface IntegrationPhase {
  phase: 1 | 2 | 3;
  title: string;
  timeframe: string;
  goal: string;
  items: string[];
  focusTitle: string;
  focusText: string;
  focusBullets: string[];
}

export interface MatchTextResult {
  headerIntro: string;
  summary: SummaryBlock;
  impactAreas: ImpactArea[];
  stress: StressBlock;
  timeline: string[];
  development: DevelopmentBlock;
  integrationPlan: IntegrationPhase[];
  debug: Record<string, unknown>;
}

const EQ_TOL = 5;

const COMP_SHORT: Record<TriadKey, string> = {
  I: 'Umsetzung / Tempo',
  N: 'Zusammenarbeit / Kommunikation',
  A: 'Struktur / Analyse',
};

const COMP_NOUN: Record<TriadKey, string> = {
  I: 'Tempo und Umsetzung',
  N: 'Beziehungsgestaltung und Kommunikation',
  A: 'Ordnung und Verlässlichkeit',
};

const COMP_ADJ: Record<TriadKey, string> = {
  I: 'handlungsorientiert',
  N: 'beziehungsorientiert',
  A: 'analytisch',
};

function sortProfile(profile: TriadProfile): Array<{ key: TriadKey; value: number }> {
  return (['I', 'N', 'A'] as TriadKey[])
    .map((key) => ({ key, value: profile[key] }))
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.key.localeCompare(b.key);
    });
}

export function dominanceModeOf(profile: TriadProfile): DominanceMeta {
  const sorted = sortProfile(profile);
  const [p1, p2, p3] = sorted;
  return {
    sorted,
    top: p1.key,
    second: p2.key,
    third: p3.key,
    gap1: p1.value - p2.value,
    gap2: p2.value - p3.value,
    spread: p1.value - p3.value,
  };
}

export function getVariant(profile: TriadProfile): VariantInfo {
  const dom = dominanceModeOf(profile);

  if (dom.gap1 <= EQ_TOL && dom.gap2 <= EQ_TOL) {
    return { type: 'ALL_EQUAL', code: 'ALL_EQUAL', dominance: dom };
  }
  if (dom.gap1 <= EQ_TOL && dom.gap2 > EQ_TOL) {
    const pair = [dom.top, dom.second].sort().join('');
    return { type: 'TOP_PAIR', code: `TOP_PAIR_${pair}_${dom.third}`, dominance: dom };
  }
  if (dom.gap1 > EQ_TOL && dom.gap2 <= EQ_TOL) {
    const pair = [dom.second, dom.third].sort().join('');
    return { type: 'BOTTOM_PAIR', code: `BOTTOM_PAIR_${dom.top}_${pair}`, dominance: dom };
  }
  return { type: 'ORDER', code: `ORDER_${dom.top}${dom.second}${dom.third}`, dominance: dom };
}

function getSpecialCases(roleProfile: TriadProfile, candProfile: TriadProfile) {
  const rDom = dominanceModeOf(roleProfile);
  const cDom = dominanceModeOf(candProfile);
  const roleIsBalFull = rDom.gap1 <= EQ_TOL && rDom.gap2 <= EQ_TOL;
  const candIsBalFull = cDom.spread <= EQ_TOL;
  const roleIsDualDom = !roleIsBalFull && rDom.gap1 <= EQ_TOL && rDom.gap2 > EQ_TOL;
  const candIsDualDom = !candIsBalFull && cDom.gap1 <= EQ_TOL && cDom.gap2 > EQ_TOL;
  const sameDualPair = roleIsDualDom && candIsDualDom && [rDom.top, rDom.second].sort().join('|') === [cDom.top, cDom.second].sort().join('|');
  const roleThird = rDom.third;
  const candThird = cDom.third;
  const roleThirdValue = roleProfile[roleThird];
  const candThirdValue = candProfile[roleThird];
  const thirdDiff = Math.abs(roleThirdValue - candThirdValue);
  const candThirdLower = candThirdValue < roleThirdValue;
  return {
    rDom,
    cDom,
    roleIsBalFull,
    candIsBalFull,
    roleIsDualDom,
    candIsDualDom,
    sameDualPair,
    roleThird,
    candThird,
    thirdDiff,
    candThirdLower,
  };
}

function maxDiffKey(diffs: TriadProfile): TriadKey {
  const entries: Array<[TriadKey, number]> = [['I', diffs.I], ['N', diffs.N], ['A', diffs.A]];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function severityFromGap(gap: number): Severity {
  if (gap > 10) return 'critical';
  if (gap > 5) return 'warning';
  return 'ok';
}

function capSeverity(severity: Severity, fitSubtype: FitSubtype): Severity {
  if (fitSubtype === 'PERFECT') return severity;
  if (fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF' || fitSubtype === 'PARTIAL_MATCH') {
    return severity === 'ok' ? 'warning' : severity;
  }
  return 'critical';
}

function sevLabel(severity: Severity): ImpactArea['label'] {
  if (severity === 'ok') return 'Stimmig';
  if (severity === 'warning') return 'Mit Abweichung';
  return 'Kritisch';
}

export function buildVariantFamilyText(args: {
  roleVariantType: VariantType;
  fitSubtype: FitSubtype;
  roleThirdDiff?: number;
  sameDualPair?: boolean;
  candThirdLower?: boolean;
}): string {
  const { roleVariantType, fitSubtype, roleThirdDiff = 0, sameDualPair = false, candThirdLower = false } = args;

  if (roleVariantType === 'ALL_EQUAL') {
    if (fitSubtype === 'PERFECT') return 'Die Stelle verlangt ein ausgeglichenes Profil ohne klaren Einzelschwerpunkt. Die Person bringt diese Vielseitigkeit ebenfalls mit.';
    if (fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return 'Die Grundstruktur ist ausgeglichen. In der Gewichtung zeigen sich jedoch leichte Unterschiede, wodurch einzelne Bereiche im Alltag etwas stärker hervortreten.';
    if (fitSubtype === 'PARTIAL_MATCH') return 'Die Rolle verlangt breite Ausgewogenheit. Die Person ist grundsätzlich anschlussfähig, entwickelt aber in einzelnen Bereichen bereits stärkere Schwerpunkte.';
    return 'Die Stelle verlangt ein ausgeglichenes Profil. Die Person bringt dagegen einen deutlich stärkeren Schwerpunkt mit.';
  }

  if (roleVariantType === 'TOP_PAIR') {
    if (fitSubtype === 'PERFECT') return 'Die Stelle verlangt zwei gleich starke Schwerpunkte, die parallel wirksam sein sollen. Die Person bringt diese Doppellogik ebenfalls mit.';
    if (fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') {
      if (sameDualPair && roleThirdDiff >= 4) {
        return candThirdLower
          ? 'Die gleiche Doppeldominanz ist vorhanden. Der dritte Bereich ist im Ist-Profil schwächer ausgeprägt. Dadurch treten die beiden Hauptbereiche im Alltag stärker und weniger parallel ausbalanciert auf.'
          : 'Die gleiche Doppeldominanz ist vorhanden. Der dritte Bereich ist im Ist-Profil stärker ausgeprägt. Dadurch werden die beiden Hauptbereiche stärker stabilisiert und etwas weniger konsequent parallel gelebt.';
      }
      return 'Die gleiche Doppeldominanz ist vorhanden. Die Gewichtung innerhalb dieser Struktur ist jedoch nicht vollständig deckungsgleich.';
    }
    if (fitSubtype === 'PARTIAL_MATCH') return 'Die Rolle verlangt eine stabile Doppellogik aus zwei gleich wichtigen Bereichen. Die Person ist grundsätzlich anschlussfähig, bildet diese Balance jedoch nicht vollständig und konstant ab.';
    return 'Die Stelle verlangt zwei gleich starke Schwerpunkte. Die Person bringt diese Doppellogik nicht in der geforderten Form mit.';
  }

  if (roleVariantType === 'BOTTOM_PAIR') {
    if (fitSubtype === 'PERFECT') return 'Die Stelle verlangt einen klaren Schwerpunkt, der von zwei ähnlich starken Nebenbereichen ergänzt wird. Die Person bildet diese Struktur stimmig ab.';
    if (fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return 'Der Hauptschwerpunkt stimmt. Die flankierenden Bereiche sind ebenfalls vorhanden, werden jedoch anders gewichtet.';
    if (fitSubtype === 'PARTIAL_MATCH') return 'Die Person ist in der Hauptlogik grundsätzlich anschlussfähig. Die unterstützenden Nebenbereiche sind jedoch nicht in der geforderten Balance vorhanden.';
    return 'Die Stelle verlangt einen klaren Schwerpunkt mit stabiler Flankierung durch zwei ähnliche Nebenbereiche. Die Person bildet diese Struktur nicht ausreichend ab.';
  }

  if (fitSubtype === 'PERFECT') return 'Die Stelle verlangt eine klare Reihenfolge der Arbeitslogik. Die Person bringt diese Reihenfolge in passender Form mit.';
  if (fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return 'Die Reihenfolge der Arbeitslogik stimmt. Die Intensität einzelner Bereiche weicht jedoch ab.';
  if (fitSubtype === 'PARTIAL_MATCH') return 'Die Person ist in Teilen anschlussfähig, trifft die geforderte Reihenfolge jedoch nicht stabil genug.';
  return 'Die Stelle verlangt eine klare Rangfolge der Arbeitslogik. Die Person bringt eine andere Reihenfolge mit.';
}

export function buildDualDominanceText(args: {
  fitSubtype: FitSubtype;
  sameDualPair: boolean;
  thirdDiff: number;
  candThirdLower: boolean;
}): string {
  const { fitSubtype, sameDualPair, thirdDiff, candThirdLower } = args;

  if (fitSubtype === 'PERFECT') {
    return 'Die Stelle verlangt zwei gleich starke Schwerpunkte. Die Person bringt diese Doppellogik ebenfalls mit. Beide Bereiche wirken im Alltag parallel und stabil.';
  }
  if (fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') {
    if (sameDualPair && thirdDiff >= 4) {
      return candThirdLower
        ? 'Die gleiche Doppeldominanz ist vorhanden. Der dritte Bereich ist schwächer ausgeprägt. Dadurch treten die beiden Hauptbereiche im Alltag stärker und weniger parallel ausbalanciert auf.'
        : 'Die gleiche Doppeldominanz ist vorhanden. Der dritte Bereich ist stärker ausgeprägt. Dadurch werden die beiden Hauptbereiche im Alltag stärker stabilisiert.';
    }
    return 'Die Doppeldominanz stimmt grundsätzlich. Die Balance innerhalb dieser Struktur ist jedoch nicht vollständig deckungsgleich.';
  }
  if (fitSubtype === 'PARTIAL_MATCH') {
    return 'Die Rolle verlangt zwei gleich starke Bereiche. Die Person ist grundsätzlich anschlussfähig, bildet diese Balance jedoch nicht stabil genug ab.';
  }
  return 'Die Stelle verlangt eine stabile Doppeldominanz. Die Person bringt diese Struktur nicht in der geforderten Form mit.';
}

function buildHeaderIntro(): string {
  return 'Diese Passungsanalyse zeigt, wie gut Person und Position in ihrer Arbeitslogik zusammenpassen. Sie macht sichtbar, wo Übereinstimmungen bestehen, wo Abweichungen entstehen und welcher Führungs- oder Entwicklungsaufwand daraus im Alltag zu erwarten ist.';
}

function buildSummary(input: MatchTextInput): SummaryBlock {
  const sp = getSpecialCases(input.roleProfile, input.candProfile);
  const familyText = buildVariantFamilyText({
    roleVariantType: input.sollVariant.type,
    fitSubtype: input.fitSubtype,
    roleThirdDiff: sp.thirdDiff,
    sameDualPair: sp.sameDualPair,
    candThirdLower: sp.candThirdLower,
  });
  const leadKey = maxDiffKey(input.diffs);

  let summary = '';
  let managementSummary = '';
  let whyResult: string[] = [];
  let risks: string[] = [];
  let profileCompareIntro = '';
  let finalText = '';

  if (input.fitSubtype === 'PERFECT') {
    summary = 'Die Gesamtbewertung spricht für eine sehr gute Passung. Die strukturelle Übereinstimmung ist hoch, der Steuerungs- und Entwicklungsaufwand gering. Die Besetzung kann ohne besondere Maßnahmen erfolgen.';
    managementSummary = `${familyText} Arbeitsweise und Prioritäten passen zur Rolle ${input.roleName}. Kleinere Unterschiede in den Nebenbereichen sind im Alltag gut handhabbar.`;
    whyResult = [
      'Die Person bringt dieselbe Arbeitsweise mit. Die Gewichtung passt.',
      'Alle drei Arbeitsbereiche liegen nah beieinander. Geringe Abweichung.',
      'Geringer Führungsaufwand. Natürliche Passung vorhanden.',
    ];
    risks = [
      'Die Arbeitslogik passt. In der Einarbeitung ist nur punktuelle Nachjustierung nötig.',
      'Kleinere Unterschiede in Nebenbereichen sollten früh gespiegelt werden, ohne die Gesamtpassung infrage zu stellen.',
      'Langfristig ist bei gleichbleibendem Kontext eine stabile Besetzung wahrscheinlich.',
    ];
    profileCompareIntro = 'Die Profile weichen in keinem der drei Bereiche wesentlich voneinander ab. Die Grundstruktur passt.';
    finalText = `Die Arbeitsweise der Person ist weitgehend deckungsgleich mit den Anforderungen der Stelle. Aufgaben, Entscheidungen und Arbeitsstil sind stimmig.`;
  } else if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') {
    summary = 'Die Gesamtbewertung spricht für eine bedingte Passung. Die Arbeitslogik ist in ihrer Grundstruktur stimmig. In der Gewichtung zeigen sich jedoch leichte Abweichungen. Eine erfolgreiche Besetzung ist mit gezielter Führung realistisch.';
    managementSummary = `${familyText} Im Alltag zeigen sich die Unterschiede vor allem dort, wo die Rolle beide Hauptschwerpunkte gleichzeitig und konstant verlangt.`;
    whyResult = [
      'Die Person arbeitet in dieselbe Richtung, die Gewichtung der Nebenbereiche weicht jedoch ab.',
      'Alle drei Arbeitsbereiche liegen nah beieinander. Geringe Abweichung.',
      'Moderater Führungsaufwand. Gezielte Führung und klare Erwartungen gleichen Differenzen aus.',
    ];
    risks = [
      'Grundrichtung stimmt, aber die Gewichtung innerhalb dieser Struktur weicht ab.',
      'Feinabstimmung in den Nebenbereichen nötig.',
      'Regelmäßiges Feedback sichert die Passung langfristig.',
    ];
    profileCompareIntro = 'Die Profile weichen in keinem der drei Bereiche wesentlich voneinander ab. Die Grundstruktur passt.';
    finalText = `Die Stelle ${input.roleName} erfordert ${COMP_NOUN[sp.rDom.top]} und ${COMP_NOUN[sp.rDom.second]} gleichermaßen. Die Person arbeitet in dieselbe Richtung, die Gewichtung der Nebenbereiche ist jedoch nicht vollständig deckungsgleich. Mit gezielter Führung und klarer Struktur lässt sich die Zusammenarbeit stabilisieren. Der Führungsaufwand ist gering.`;
  } else if (input.fitSubtype === 'PARTIAL_MATCH') {
    summary = 'Die Gesamtbewertung spricht für eine bedingte Passung. Die Person ist grundsätzlich anschlussfähig, bildet die Stellenlogik aber nicht durchgehend deckungsgleich ab. Eine erfolgreiche Besetzung verlangt bewusste Steuerung.';
    managementSummary = `${familyText} Im Alltag braucht es klare Prioritäten, weil die Rolle nicht in allen Punkten konstant so gelebt wird wie vorgesehen.`;
    whyResult = [
      'Die Person deckt wichtige Teile der Rolle ab, trifft die geforderte Logik aber nicht vollständig.',
      `Die größte Einzelabweichung liegt im Bereich ${COMP_SHORT[leadKey]}.`,
      'Gezielte Führung und klare Erwartungen sind notwendig, damit die Passung stabil bleibt.',
    ];
    risks = [
      'Die Arbeitslogik ist anschlussfähig, aber nicht vollständig deckungsgleich.',
      'Im Alltag entstehen dadurch leichter Prioritätsverschiebungen.',
      'Ohne Steuerung kann sich die Rollenausübung schrittweise in eine andere Richtung entwickeln.',
    ];
    profileCompareIntro = 'Die Grundstruktur ist grundsätzlich anschlussfähig. In einzelnen Bereichen zeigen sich jedoch erkennbare Abweichungen.';
    finalText = `Die Stelle ${input.roleName} wird von der Person in wesentlichen Teilen abgebildet. Gleichzeitig bestehen strukturelle Unterschiede, die im Alltag bewusst geführt werden müssen.`;
  } else {
    summary = 'Die Gesamtbewertung spricht gegen eine Passung. Die Arbeitslogik weicht strukturell oder in ihrer Ausprägung deutlich von der Rolle ab. Ohne intensiven Steuerungsaufwand ist die Besetzung nicht tragfähig.';
    managementSummary = `${familyText} Die geforderte Logik wird nicht in stabiler Form erreicht.`;
    whyResult = [
      'Die Struktur der Arbeitslogik weicht klar von der Rolle ab.',
      `Die größte Einzelabweichung liegt bei ${input.maxDiff.toFixed(1)} Punkten und damit außerhalb eines tragfähigen Bereichs.`,
      'Die Unterschiede betreffen nicht nur Nuancen, sondern die Grundrichtung der Rollenwirkung.',
    ];
    risks = [
      'Die Person würde die Rolle im Alltag spürbar in eine andere Richtung verschieben.',
      'Zusammenarbeit, Führung und Ergebnislogik geraten dadurch leichter in Konflikt.',
      'Ohne sehr hohe Steuerung ist keine stabile Passung zu erwarten.',
    ];
    profileCompareIntro = 'Die Profile unterscheiden sich in ihrer Struktur oder Ausprägung zu deutlich für eine stabile Besetzung.';
    finalText = `Die Stelle ${input.roleName} und die Person arbeiten nicht in derselben Rollendynamik. Eine stabile Besetzung ist unter den gegebenen Bedingungen nicht wahrscheinlich.`;
  }

  return { summary, managementSummary, whyResult, risks, profileCompareIntro, finalText };
}

function dualPairLabel(top: TriadKey, second: TriadKey): string {
  const pair = [top, second].sort().join('|');
  if (pair === 'A|I') return 'Tempo und Umsetzung einerseits, sorgfältige Prüfung und Struktur andererseits';
  if (pair === 'A|N') return 'Beziehungsgestaltung und Einbindung einerseits, analytische Prüfung und Ordnung andererseits';
  return 'Tempo und Umsetzung einerseits, Beziehungsgestaltung und Einbindung andererseits';
}

function roleNeedForArea(area: ImpactArea['key'], rDom: ReturnType<typeof dominanceModeOf>, isDual: boolean, isBal: boolean): string {
  const top = rDom.top;
  const second = rDom.second;
  if (area === 'decision') {
    if (isBal) return 'Breite, ausgewogene Entscheidungslogik. Alle drei Bereiche sollen gleich stark einfließen.';
    if (isDual) return `Entscheidungen, die ${dualPairLabel(top, second)} gleichermaßen berücksichtigen. Beide Logiken sollen parallel wirksam sein.`;
    if (top === 'I') return 'Schnelle, ergebnisorientierte Entscheidungen. Optionen kurz prüfen, dann konsequent handeln.';
    if (top === 'N') return 'Entscheidungen, die Kontext, Zusammenarbeit und zwischenmenschliche Wirkung berücksichtigen.';
    return 'Sorgfältige, prüforientierte Entscheidungen. Optionen abwägen, Risiken prüfen, erst dann handeln.';
  }
  if (area === 'workstyle') {
    if (isBal) return 'Breites, ausgewogenes Arbeitsprofil. Umsetzung, Abstimmung und Struktur sollen gleich stark vertreten sein.';
    if (isDual) return `Arbeitsweise, die ${COMP_NOUN[top]} und ${COMP_NOUN[second]} parallel und stabil verbindet.`;
    if (top === 'I') return 'Hohes Tempo, direkte Umsetzung und pragmatische Priorisierung. Aufgaben schnell abschließen.';
    if (top === 'N') return 'Zusammenarbeit, Abstimmung und Einbindung. Arbeit im Miteinander, nicht im Alleingang.';
    return 'Klare Struktur, Priorisierung und verlässliche Abläufe. Arbeitsschritte nachvollziehbar planen und kontrollieren.';
  }
  if (area === 'communication') {
    if (isBal) return 'Breite Kommunikation, die sowohl sachlich, einbindend als auch handlungsorientiert sein soll.';
    if (isDual) return `Kommunikation, die sowohl ${COMP_ADJ[top]} als auch ${COMP_ADJ[second]} geprägt ist. Beide Stile sollen parallel erkennbar sein.`;
    if (top === 'I') return 'Direkte, ergebnisorientierte Kommunikation. Kurze Wege, klare Ansagen.';
    if (top === 'N') return 'Einbindende, kontextbezogene Kommunikation. Zuhören, vermitteln, Abstimmung schaffen.';
    return 'Sachliche, faktenbasierte Kommunikation. Klare Argumentation, strukturierte Informationsweitergabe.';
  }
  if (area === 'culture') {
    if (isBal) return 'Vielseitige Teamkultur, die Tempo, Zusammenarbeit und Qualität gleich stark verankert.';
    if (isDual) return `Teamkultur, die sowohl ${COMP_NOUN[top]} als auch ${COMP_NOUN[second]} stabil verankert.`;
    if (top === 'I') return 'Dynamik, Eigenverantwortung und schnelle Ergebnisse. Wettbewerb und Tempo prägen das Team.';
    if (top === 'N') return 'Zusammenhalt, Vertrauen und wertschätzende Zusammenarbeit. Beziehungsqualität steht im Zentrum.';
    return 'Verlässlichkeit, Ruhe und nachvollziehbare Qualität. Stabile Abläufe und planbare Ergebnisse.';
  }
  if (isBal) return 'Führung über eine breite, ausgewogene Wirkung. Alle drei Bereiche sollen gleich stark vertreten sein.';
  if (isDual) return `Führung, die ${COMP_NOUN[top]} und ${COMP_NOUN[second]} gleichermaßen vermittelt.`;
  if (top === 'I') return 'Führung über Tempo, Entscheidungsstärke und klare Richtung.';
  if (top === 'N') return 'Führung über Beziehung, Einbindung und Vertrauen.';
  return 'Führung über Orientierung, Priorisierung und verlässliche Standards.';
}

function personTextForArea(area: ImpactArea['key'], input: MatchTextInput): string {
  const sp = getSpecialCases(input.roleProfile, input.candProfile);
  const cTop = sp.cDom.top;
  const cSecond = sp.cDom.second;
  if (area === 'decision') {
    if (sp.candIsBalFull) return 'Die Person entscheidet breit abgestützt und wägt verschiedene Perspektiven gleichmäßig ab.';
    if (sp.candIsDualDom) {
      const pair = [cTop, cSecond].sort().join('|');
      if (pair === 'A|N') return 'Die Person entscheidet sowohl kontextbezogen und abstimmungsorientiert als auch analytisch und prüforientiert. Je nach Situation überwiegt Einbindung oder Sorgfalt.';
      if (pair === 'A|I') return 'Die Person entscheidet sowohl analytisch und prüforientiert als auch handlungsorientiert. Je nach Situation überwiegt Tempo oder Sorgfalt.';
      return 'Die Person entscheidet sowohl handlungsorientiert als auch kontextbezogen und abstimmungsorientiert. Je nach Situation überwiegt Tempo oder Einbindung.';
    }
    if (cTop === 'I') return 'Die Person entscheidet schnell, direkt und umsetzungsorientiert.';
    if (cTop === 'N') return 'Die Person entscheidet kontextbezogen, bezieht das Umfeld ein und sucht Abstimmung.';
    return 'Die Person entscheidet analytisch und prüft Entscheidungen gründlich.';
  }
  if (area === 'workstyle') {
    if (sp.candIsBalFull) return 'Die Person arbeitet breit aufgestellt und wechselt situativ zwischen Tempo, Abstimmung und Sorgfalt.';
    if (sp.candIsDualDom) return `Die Person arbeitet parallel über ${COMP_NOUN[cTop]} und ${COMP_NOUN[cSecond]}. Beide Bereiche prägen den Arbeitsstil.`;
    if (cTop === 'I') return 'Die Person arbeitet mit hohem Tempo, handelt pragmatisch und setzt schnell um.';
    if (cTop === 'N') return 'Die Person arbeitet kooperativ, bezieht andere ein und sucht gemeinsame Lösungen.';
    return 'Die Person arbeitet strukturiert mit klaren Abläufen und festen Arbeitsschritten. Planung hat hohe Priorität.';
  }
  if (area === 'communication') {
    if (sp.candIsBalFull) return 'Die Person kommuniziert vielseitig und passt ihren Stil situativ an.';
    if (sp.candIsDualDom) return `Die Person kommuniziert sowohl ${COMP_ADJ[cTop]} als auch ${COMP_ADJ[cSecond]}. Der Stil wechselt situativ.`;
    if (cTop === 'I') return 'Die Person kommuniziert direkt, kurz und ergebnisorientiert.';
    if (cTop === 'N') return 'Die Person kommuniziert einbindend, empathisch und sucht Verständigung.';
    return 'Die Person kommuniziert sachlich, strukturiert und mit erkennbarem Blick für Abstimmung und Umfeld.';
  }
  if (area === 'culture') {
    if (sp.candIsBalFull) return 'Die Person bringt eine breite kulturelle Wirkung mit, ohne einzelne Bereiche stark zu dominieren.';
    if (sp.candIsDualDom) return `Die Person prägt die Kultur durch ${COMP_NOUN[cTop]} und ${COMP_NOUN[cSecond]} gleichermaßen.`;
    if (cTop === 'I') return 'Die Person stärkt Dynamik, Eigenverantwortung und Ergebnisorientierung im Team.';
    if (cTop === 'N') return 'Die Person stärkt Zusammenhalt, Vertrauen und Beziehungsqualität im Team.';
    return 'Die Person stärkt Qualitätsbewusstsein, Regelklarheit und Ordnung. Die Kultur wird sachlicher und strukturierter.';
  }
  if (sp.candIsBalFull) return 'Die Person führt breit aufgestellt und vermittelt ausgewogen zwischen allen drei Bereichen.';
  if (sp.candIsDualDom) return `Die Person führt parallel über ${COMP_NOUN[cTop]} und ${COMP_NOUN[cSecond]}.`;
  if (cTop === 'I') return 'Die Person führt über Tempo, direkte Vorgaben und schnelle Entscheidungen.';
  if (cTop === 'N') return 'Die Person führt über Beziehung, Einbindung und Vertrauen.';
  return 'Die Person führt eher über Klarheit, Struktur und nachvollziehbare Vorgaben.';
}

function areaInterpretation(key: ImpactArea['key'], input: MatchTextInput): string {
  const sp = getSpecialCases(input.roleProfile, input.candProfile);

  if (sp.roleIsDualDom && sp.candIsDualDom) {
    const dualText = buildDualDominanceText({
      fitSubtype: input.fitSubtype,
      sameDualPair: sp.sameDualPair,
      thirdDiff: sp.thirdDiff,
      candThirdLower: sp.candThirdLower,
    });

    if (key === 'decision') {
      if (input.fitSubtype === 'PERFECT') return 'Die Entscheidungslogik ist weitgehend stimmig. Beide geforderten Schwerpunkte werden parallel getragen.';
      if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Dadurch wird nicht jede Situation mit derselben konstanten Balance entschieden.`;
      if (input.fitSubtype === 'PARTIAL_MATCH') return `${dualText} Die geforderte Gleichzeitigkeit beider Logiken wird jedoch nicht stabil genug getroffen.`;
      return `${dualText} Die geforderte Doppellogik der Stelle wird dadurch nicht stabil erreicht.`;
    }

    if (key === 'workstyle') {
      if (input.fitSubtype === 'PERFECT') return 'Die Arbeitsweise bildet beide geforderten Schwerpunkte parallel und stabil ab.';
      if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Im Alltag wechseln die Akzente dadurch stärker, anstatt konstant parallel zu wirken.`;
      if (input.fitSubtype === 'PARTIAL_MATCH') return 'Die Arbeitsweise ist grundsätzlich anschlussfähig, erreicht aber nicht durchgehend die geforderte Balance beider Hauptlogiken.';
      return 'Die Arbeitsweise bildet die geforderte Doppellogik nicht ausreichend ab.';
    }

    if (key === 'communication') {
      if (input.fitSubtype === 'PERFECT') return 'Die Kommunikation ist in ihrer Grundlogik stimmig und deckt beide Anforderungen gut ab.';
      if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Dadurch unterscheidet sich, wie konstant zwischen Einbindung und sachlicher Struktur vermittelt wird.`;
      if (input.fitSubtype === 'PARTIAL_MATCH') return 'Die Kommunikation deckt die Stelle teilweise ab, bleibt aber nicht durchgehend in der geforderten Balance.';
      return 'Die Kommunikationslogik entspricht nicht der stabilen Doppellogik, die die Stelle verlangt.';
    }

    if (key === 'culture') {
      if (input.fitSubtype === 'PERFECT') return 'Die kulturelle Grundrichtung ist stimmig. Beide Seiten der Rolle werden parallel getragen.';
      if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Dadurch kann sich die gelebte Kultur in einzelnen Aspekten von der Stellenerwartung unterscheiden.`;
      if (input.fitSubtype === 'PARTIAL_MATCH') return 'Die Kulturwirkung ist grundsätzlich anschlussfähig, bleibt aber nicht konstant in der geforderten Balance.';
      return 'Die Kulturwirkung trifft die geforderte Verbindung beider Hauptbereiche nicht stabil.';
    }

    if (key === 'leadership') {
      if (input.fitSubtype === 'PERFECT') return 'Die Führungswirkung ist stimmig. Beide geforderten Schwerpunkte werden in der Führung parallel und stabil getragen.';
      if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Dadurch kann sich die Führungswirkung im Alltag leicht anders gewichten als die Rolle es verlangt.`;
      if (input.fitSubtype === 'PARTIAL_MATCH') return 'Die Führungswirkung ist grundsätzlich anschlussfähig, erreicht aber nicht durchgehend die geforderte Balance beider Hauptlogiken.';
      return 'Die Führungswirkung bildet die geforderte Doppellogik nicht ausreichend ab.';
    }
  }

  if (input.fitSubtype === 'PERFECT') {
    if (key === 'decision') return 'Die Entscheidungslogik ist stimmig und deckt die Stellenanforderung gut ab.';
    if (key === 'workstyle') return 'Die Arbeitsweise ist stimmig und entspricht der Rolle in ihrem Grundansatz.';
    if (key === 'communication') return 'Der Kommunikationsstil ist stimmig und passt zur Rolle.';
    if (key === 'culture') return 'Die kulturelle Wirkung ist stimmig und verändert die gewünschte Teamrichtung nicht.';
    return 'Die Führungswirkung ist im Kern stimmig und gut anschlussfähig.';
  }

  if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') {
    if (key === 'decision') return 'Die Entscheidungslogik ist in der Grundrichtung stimmig. Die Gewichtung ist jedoch nicht vollständig deckungsgleich.';
    if (key === 'workstyle') return 'Die Arbeitsweise ist in der Grundrichtung stimmig, die Gewichtung ist jedoch nicht vollständig deckungsgleich.';
    if (key === 'communication') return 'Der Kommunikationsstil ist in der Grundrichtung stimmig. Die Gewichtung der Nebenbereiche ist jedoch nicht deckungsgleich.';
    if (key === 'culture') return 'Die kulturelle Grundrichtung ist stimmig. Die Gewichtung der Nebenbereiche ist jedoch nicht deckungsgleich.';
    return 'Die Führungswirkung ist grundsätzlich stimmig, wird im Alltag aber anders gewichtet.';
  }

  if (input.fitSubtype === 'PARTIAL_MATCH') {
    if (key === 'decision') return 'Die Entscheidungslogik ist teilweise anschlussfähig, aber nicht deckungsgleich.';
    if (key === 'workstyle') return 'Die Arbeitsweise ist grundsätzlich anschlussfähig, weicht aber in zentralen Anteilen von der Rolle ab.';
    if (key === 'communication') return 'Die Kommunikation ist grundsätzlich anschlussfähig, trifft die erwartete Logik aber nicht vollständig.';
    if (key === 'culture') return 'Die Kulturwirkung ist teilweise tragfähig, bleibt aber nicht deckungsgleich zur Stellenerwartung.';
    return 'Die Führungswirkung ist grundsätzlich anschlussfähig, aber nicht konsequent genug.';
  }

  if (key === 'decision') return 'Die Entscheidungslogik weicht deutlich von der Stellenanforderung ab.';
  if (key === 'workstyle') return 'Die Arbeitsweise liegt spürbar neben der Rollenanforderung.';
  if (key === 'communication') return 'Der Kommunikationsstil unterscheidet sich deutlich von der Rolle.';
  if (key === 'culture') return 'Die kulturelle Wirkung weicht spürbar von der Stellenerwartung ab.';
  return 'Die Führungswirkung entspricht nicht der Logik, die die Stelle verlangt.';
}

function buildImpactAreas(input: MatchTextInput): ImpactArea[] {
  const sp = getSpecialCases(input.roleProfile, input.candProfile);
  const rDom = dominanceModeOf(input.roleProfile);
  const isDual = sp.roleIsDualDom;
  const isBal = sp.roleIsBalFull;

  const decisionSev = capSeverity(severityFromGap(input.maxDiff), input.fitSubtype);
  const workSev = capSeverity(severityFromGap(Math.abs(input.roleProfile.A - input.candProfile.A)), input.fitSubtype);
  const commSev = capSeverity(severityFromGap(Math.abs(input.roleProfile.N - input.candProfile.N)), input.fitSubtype);
  const cultSev = commSev;

  const areas: ImpactArea[] = [
    {
      key: 'decision',
      title: 'Entscheidungsverhalten',
      label: sevLabel(decisionSev),
      severity: decisionSev,
      roleNeed: roleNeedForArea('decision', rDom, isDual, isBal),
      personText: personTextForArea('decision', input),
      interpretation: areaInterpretation('decision', input),
    },
    {
      key: 'workstyle',
      title: 'Arbeitsweise',
      label: sevLabel(workSev),
      severity: workSev,
      roleNeed: roleNeedForArea('workstyle', rDom, isDual, isBal),
      personText: personTextForArea('workstyle', input),
      interpretation: areaInterpretation('workstyle', input),
    },
    {
      key: 'communication',
      title: 'Kommunikationsverhalten',
      label: sevLabel(commSev),
      severity: commSev,
      roleNeed: roleNeedForArea('communication', rDom, isDual, isBal),
      personText: personTextForArea('communication', input),
      interpretation: areaInterpretation('communication', input),
    },
    {
      key: 'culture',
      title: 'Wirkung auf Zusammenarbeit und Teamkultur',
      label: sevLabel(cultSev),
      severity: cultSev,
      roleNeed: roleNeedForArea('culture', rDom, isDual, isBal),
      personText: personTextForArea('culture', input),
      interpretation: areaInterpretation('culture', input),
    },
  ];

  if ((input.fuehrungsArt ?? 'keine') !== 'keine') {
    areas.splice(2, 0, {
      key: 'leadership',
      title: 'Führungswirkung',
      label: sevLabel(decisionSev),
      severity: decisionSev,
      roleNeed: roleNeedForArea('leadership', rDom, isDual, isBal),
      personText: personTextForArea('leadership', input),
      interpretation: areaInterpretation('leadership', input),
    });
  }

  return areas;
}

function buildStress(input: MatchTextInput): StressBlock {
  const sp = getSpecialCases(input.roleProfile, input.candProfile);

  if (sp.candIsBalFull) {
    return {
      controlledPressure: 'Unter moderatem Druck zeigt sich bei dieser Person kein klarer Schwerpunkt. Da alle drei Bereiche fast gleich stark ausgeprägt sind, wechselt die Reaktion situativ: Mal wird stärker über Tempo gesteuert, mal über Abstimmung, mal über Struktur. Das Verhalten wirkt dadurch wenig vorhersehbar.',
      uncontrolledStress: 'Unter hoher Belastung fehlt ein stabiler Anker. Die Person kann zwischen den drei Logiken springen – mal impulsiver, mal beziehungsorientierter, mal kontrollierter. Im Alltag wird dieses Wechseln deutlich spürbar und kann das Umfeld verunsichern.',
    };
  }

  if (sp.candIsDualDom) {
    return {
      controlledPressure: `Steigt der Arbeitsdruck, greift die Person auf die gerade führende Logik zurück. Da beide Hauptanteile fast gleich stark sind, fällt die Reaktion situationsabhängig aus: Mal wird stärker über ${COMP_NOUN[sp.cDom.top]} gesteuert, mal über ${COMP_NOUN[sp.cDom.second]}.`,
      uncontrolledStress: sp.cDom.third === 'N'
        ? 'Wird die Belastung sehr hoch, kann sich der Schwerpunkt merklich verschieben. Einfühlungsvermögen tritt stärker in den Vordergrund. Es wird mehr moderiert, erklärt und abgestimmt.'
        : sp.cDom.third === 'A'
          ? 'Wird die Belastung sehr hoch, kann sich der Schwerpunkt stärker auf Ordnung, Prüfung und Absicherung verschieben. Entscheidungen werden langsamer, aber kontrollierter.'
          : 'Wird die Belastung sehr hoch, kann sich der Schwerpunkt stärker auf Tempo und direkte Umsetzung verschieben. Entscheidungen werden schneller und unmittelbarer getroffen.'
    };
  }

  return {
    controlledPressure: `Unter moderatem Druck verstärkt sich zunächst die Tendenz zu ${COMP_NOUN[sp.cDom.top]}.`,
    uncontrolledStress: `Unter hoher Belastung kann sich das Verhalten in Richtung ${COMP_NOUN[sp.cDom.second]} verschieben.`
  };
}

function buildTimeline(input: MatchTextInput): string[] {
  if (input.fitSubtype === 'PERFECT') {
    return [
      `Die Stelle ${input.roleName} verlangt ${COMP_SHORT[dominanceModeOf(input.roleProfile).top]}. Die Arbeitslogik passt. Die Einarbeitung verläuft voraussichtlich reibungslos. Nur in Einzelfällen ist Nachjustierung nötig.`,
      'Die Stellenanforderungen werden stabil abgedeckt. In den Nebenbereichen treten kleinere Abweichungen auf. Regelmäßige Zielgespräche helfen, diese frühzeitig zu erkennen.',
      'Die Stellenanforderungen werden langfristig stabil erfüllt. Der Führungsaufwand bleibt gering. Halbjährliche Überprüfungen genügen.',
    ];
  }
  return [
    `Die Stelle ${input.roleName} verlangt ${COMP_SHORT[dominanceModeOf(input.roleProfile).top]}. Die Person arbeitet in dieselbe Richtung, gewichtet aber die Nebenbereiche anders. Bereits in der Einarbeitung sollte gezielt auf diese Unterschiede geachtet werden.`,
    'Die Grundrichtung stimmt, aber die Abweichungen in den Nebenbereichen werden im Alltag bemerkbar. Ohne gezielte Steuerung können sich diese Unterschiede verfestigen. Regelmäßige Zielgespräche und klare Erwartungen sind notwendig.',
    'Mit gezielter Führung lassen sich die Unterschiede in den Nebenbereichen dauerhaft ausgleichen. Halbjährliche Überprüfung empfohlen, um sicherzustellen, dass die Passung stabil bleibt.',
  ];
}

function buildDevelopment(input: MatchTextInput): DevelopmentBlock {
  if (input.fitSubtype === 'PERFECT') {
    return {
      title: 'Entwicklungsprognose',
      subtitle: '3 von 3 Gute Aussichten, wenig Aufwand',
      scoreText: 'niedrig',
      text1: `Die Stelle verlangt ${COMP_NOUN[dominanceModeOf(input.roleProfile).top]} und ${COMP_NOUN[dominanceModeOf(input.roleProfile).second]} gleichermaßen. Die Person deckt diese Anforderung in stimmiger Form ab.`,
      text2: `Die Stelle ${input.roleName} erfordert ${COMP_NOUN[dominanceModeOf(input.roleProfile).top]} und ${COMP_NOUN[dominanceModeOf(input.roleProfile).second]} gleichermaßen. Die Person bringt diese Arbeitsweise mit. Grundrichtung und Gewichtung passen. Der Führungsaufwand ist gering. Eine stabile Besetzung ist unter diesen Bedingungen wahrscheinlich.`,
    };
  }

  return {
    title: 'Entwicklungsprognose',
    subtitle: '2 von 3 Machbar, braucht gezielte Führung',
    scoreText: 'mittel',
    text1: `Die Stelle verlangt ${COMP_NOUN[dominanceModeOf(input.roleProfile).top]} und ${COMP_NOUN[dominanceModeOf(input.roleProfile).second]} gleichermaßen. Die Person arbeitet in dieselbe Richtung, muss aber in einzelnen Bereichen noch gezielt dazulernen. Mit klaren Zielen und regelmäßigem Feedback ist das gut machbar.`,
    text2: buildSummary(input).finalText,
  };
}

function buildIntegrationPlan(input: MatchTextInput): IntegrationPhase[] {
  const sp = getSpecialCases(input.roleProfile, input.candProfile);

  if (input.fitSubtype === 'PERFECT') {
    return [
      {
        phase: 1,
        title: 'Orientierung',
        timeframe: 'Tag 1–10',
        goal: `Stellenanforderungen der Position ${input.roleName} verstehen und Erwartungen abstimmen.`,
        items: [
          `Klärung der Entscheidungswege und Verantwortungsbereiche in der Stelle ${input.roleName}.`,
          'Abstimmung der wichtigsten Arbeitsprioritäten mit dem direkten Umfeld.',
          'Transparenz über bestehende Abläufe, Prozesse und Qualitätsstandards.',
        ],
        focusTitle: 'Worauf es ankommt',
        focusText: 'Stelle und Person teilen denselben Grundansatz. Wichtig ist daher, schnell Klarheit zu schaffen über:',
        focusBullets: ['bestehende Abläufe und Schnittstellen', 'Entscheidungswege und Verantwortungsbereiche', 'Qualitätsstandards und Erwartungshaltung'],
      },
      {
        phase: 2,
        title: 'Wirkung',
        timeframe: 'Tag 11–20',
        goal: `Erste operative Verantwortung als ${input.roleName} übernehmen und Wirkung zeigen.`,
        items: ['Eigenständige Übernahme erster Arbeitspakete mit Ergebnisprüfung.', 'Feedback zur Wirkung auf Tempo, Qualität und Zusammenarbeit aktiv einholen.', 'Schnittstellenarbeit mit angrenzenden Bereichen etablieren.'],
        focusTitle: 'Worauf es ankommt',
        focusText: 'Die Person arbeitet bereits nach dem richtigen Grundansatz. Es geht jetzt darum:',
        focusBullets: [`Wirksamkeit in ${input.roleName} sichtbar zu machen`, 'erste Arbeitsergebnisse eigenständig zu liefern', 'belastbare Routinen zu entwickeln'],
      },
      {
        phase: 3,
        title: 'Stabilisierung',
        timeframe: 'Tag 21–30',
        goal: `Arbeitsweise und Arbeitsrhythmus als ${input.roleName} stabilisieren.`,
        items: ['Evaluation der bisherigen Wirkung auf Entscheidungsrhythmus und Belastung.', 'Feinabstimmung der Zusammenarbeit mit dem direkten Umfeld.', 'Prioritäten konsolidieren und Standards stabilisieren.'],
        focusTitle: 'Worauf es ankommt',
        focusText: 'Die Arbeitsweise ist stabil. Jetzt gilt es:',
        focusBullets: ['Stärken beibehalten und Routinen festigen', `langfristige Stabilität in ${input.roleName} sichern`],
      },
    ];
  }

  return [
    {
      phase: 1,
      title: 'Orientierung',
      timeframe: 'Tag 1–10',
      goal: `Qualitätsstandards und Entscheidungslogik der Stelle ${input.roleName} verstehen.`,
      items: [`Klärung von Stelle, Erwartungshaltung und Qualitätsstandard in ${input.roleName}.`, 'Transparenz über bestehende Entscheidungs- und Dokumentationsstrukturen.', "Frühe Abstimmung von Prioritäten, Qualitätskriterien und Definition von 'Done'.", 'Klärung operativer Prozesse und Schnittstellen.'],
      focusTitle: 'Worauf es ankommt',
      focusText: `Die Stelle ${input.roleName} stellt ${COMP_SHORT[sp.rDom.top]} in den Vordergrund. Die Person bringt ${COMP_SHORT[sp.cDom.top]} als Stärke mit. Zu klären ist:`,
      focusBullets: ['welche Arbeitstiefe erwartet wird', 'welche Standards und Prozesse gelten', 'wie Qualität gemessen wird'],
    },
    {
      phase: 2,
      title: 'Wirkung',
      timeframe: 'Tag 11–20',
      goal: `Erste strukturierte Arbeitsergebnisse als ${input.roleName} liefern und Standards etablieren.`,
      items: ['Ein priorisiertes Thema strukturiert analysieren und verbessern.', 'Feedback zur Wirkung auf Qualität, Nachvollziehbarkeit und Zusammenarbeit einholen.', 'Einen klaren Standard (Checkliste, Playbook oder Dokumentation) einführen oder schärfen.', 'Fehlerquellen identifizieren und systematisch beheben.'],
      focusTitle: 'Worauf es ankommt',
      focusText: 'Die Person sollte verstärkt auf analytische Tiefe achten. Konkret bedeutet das:',
      focusBullets: ['Ergebnisse sauber dokumentieren', 'analytische Prüfung nicht umgehen', 'Führungsbegleitung aktiv nutzen'],
    },
    {
      phase: 3,
      title: 'Stabilisierung',
      timeframe: 'Tag 21–30',
      goal: `Qualitätsstandards und Prozesssteuerung als ${input.roleName} dauerhaft verankern.`,
      items: ['Evaluation der Wirkung auf Entscheidungsrhythmus, Priorisierung und Belastung.', 'Anpassung von Regeln, Schnittstellen und Qualitätsstandards.', 'Prozessstabilität und Durchlaufzeiten prüfen.', 'Langfristige Qualitätsziele und Dokumentationsstandards festlegen.'],
      focusTitle: 'Worauf es ankommt',
      focusText: 'Struktur und Analyse bleiben erhalten, während die Arbeitsweise Richtung Sorgfalt und systematische Prüfung weiterentwickelt wird. Die Führungskraft prüft:',
      focusBullets: ['ob der Führungsaufwand langfristig tragbar ist', 'ob die Entwicklungsrichtung stimmt', 'ob die Stelle dauerhaft stabil besetzt werden kann'],
    },
  ];
}

export function buildMatchTexts(input: MatchTextInput): MatchTextResult {
  return {
    headerIntro: buildHeaderIntro(),
    summary: buildSummary(input),
    impactAreas: buildImpactAreas(input),
    stress: buildStress(input),
    timeline: buildTimeline(input),
    development: buildDevelopment(input),
    integrationPlan: buildIntegrationPlan(input),
    debug: {
      roleVariant: input.sollVariant.code,
      candVariant: input.istVariant.code,
      fitSubtype: input.fitSubtype,
      specialCases: getSpecialCases(input.roleProfile, input.candProfile),
    },
  };
}

/*
Beispiel:

import { buildMatchTexts, getVariant } from './matchcheck_texts_complete_replit';

const roleProfile = { I: 25, N: 35, A: 40 };
const candProfile = { I: 23, N: 34, A: 43 };

const texts = buildMatchTexts({
  roleName: 'Fachinformatiker Systemintegration',
  candName: 'Max Mustermann',
  roleProfile,
  candProfile,
  fitLabel: 'Bedingt geeignet',
  fitSubtype: 'STRUCTURE_MATCH_INTENSITY_OFF',
  controlLevel: 'LOW',
  maxDiff: 3,
  totalGap: 6,
  diffs: { I: 2, N: 1, A: 3 },
  sollVariant: getVariant(roleProfile),
  istVariant: getVariant(candProfile),
  sollRelations: { I_N: -1, I_A: -1, N_A: 0 },
  istRelations: { I_N: -1, I_A: -1, N_A: 0 },
  structureRelation: { type: 'EXACT', mismatchCount: 0, directFlip: false, reason: 'Die Paarrelationen sind identisch.' },
  fuehrungsArt: 'keine',
});

console.log(JSON.stringify(texts, null, 2));
*/
