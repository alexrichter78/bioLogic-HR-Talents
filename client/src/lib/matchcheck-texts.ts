/*
  matchcheck_texts_complete_replit.ts
  ----------------------------------
  Bilingual text engine (DE + EN) for all 13 structural variants.
  Language is controlled via MatchTextInput.lang ('de' | 'en', default 'de').
*/

import { textVariants, textVariantsEN, pickVariant, pickVariantSet, mapToVariantLevel } from './text-variants';

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
  lang?: 'de' | 'en' | 'fr';
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
  label: string;
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

/* ── Module-level language context (set by buildMatchTexts) ─────────────── */
let _lang: 'de' | 'en' | 'fr' = 'de';

/* ── Bilingual label constants ──────────────────────────────────────────── */
const COMP_SHORT: Record<TriadKey, string> = {
  I: 'Umsetzung / Tempo',
  N: 'Zusammenarbeit / Kommunikation',
  A: 'Struktur / Analyse',
};
const COMP_SHORT_EN: Record<TriadKey, string> = {
  I: 'Action / Pace',
  N: 'Collaboration / Communication',
  A: 'Structure / Analysis',
};

const COMP_NOUN: Record<TriadKey, string> = {
  I: 'Tempo und Umsetzung',
  N: 'Beziehungsgestaltung und Kommunikation',
  A: 'Ordnung und Verlässlichkeit',
};
const COMP_NOUN_EN: Record<TriadKey, string> = {
  I: 'pace and action',
  N: 'relationship-building and communication',
  A: 'structure and reliability',
};

const COMP_ADJ: Record<TriadKey, string> = {
  I: 'handlungsorientiert',
  N: 'beziehungsorientiert',
  A: 'analytisch',
};
const COMP_ADJ_EN: Record<TriadKey, string> = {
  I: 'action-oriented',
  N: 'relationship-oriented',
  A: 'analytical',
};

const COMP_SHORT_FR: Record<TriadKey, string> = {
  I: 'Rythme / Décision',
  N: 'Communication / Relations',
  A: 'Structure / Rigueur',
};
const COMP_NOUN_FR: Record<TriadKey, string> = {
  I: 'le rythme et la décision',
  N: 'la communication et les relations',
  A: 'la structure et la rigueur',
};
const COMP_ADJ_FR: Record<TriadKey, string> = {
  I: 'orientée action',
  N: 'orientée relations',
  A: 'analytique',
};

/* ── Language-aware accessors ───────────────────────────────────────────── */
function cs(key: TriadKey): string { return _lang === 'en' ? COMP_SHORT_EN[key] : _lang === 'fr' ? COMP_SHORT_FR[key] : COMP_SHORT[key]; }
function cn(key: TriadKey): string { return _lang === 'en' ? COMP_NOUN_EN[key] : _lang === 'fr' ? COMP_NOUN_FR[key] : COMP_NOUN[key]; }
function ca(key: TriadKey): string { return _lang === 'en' ? COMP_ADJ_EN[key] : _lang === 'fr' ? COMP_ADJ_FR[key] : COMP_ADJ[key]; }
function vars() { return _lang === 'en' ? textVariantsEN : textVariants; }

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
  const candIsBalFull = cDom.gap1 <= EQ_TOL && cDom.gap2 <= EQ_TOL;
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

function capSeverity(severity: Severity, fitSubtype: FitSubtype, fitLabel?: string): Severity {
  if (fitSubtype === 'PERFECT') return severity;
  if (fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') {
    return severity === 'ok' ? 'warning' : severity;
  }
  if (fitSubtype === 'PARTIAL_MATCH') {
    if (fitLabel === 'Nicht geeignet') {
      return severity === 'ok' ? 'warning' : 'critical';
    }
    return severity === 'ok' ? 'warning' : severity;
  }
  return 'critical';
}

function sevLabel(severity: Severity): string {
  if (_lang === 'fr') {
    if (severity === 'ok') return 'Aligné';
    if (severity === 'warning') return 'Écart présent';
    return 'Critique';
  }
  if (_lang === 'en') {
    if (severity === 'ok') return 'Aligned';
    if (severity === 'warning') return 'Deviation present';
    return 'Critical';
  }
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

  if (_lang === 'en') {
    if (roleVariantType === 'ALL_EQUAL') {
      if (fitSubtype === 'PERFECT') return 'The role calls for a balanced profile with no single dominant focus. The person brings this versatility as well.';
      if (fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return 'The basic structure is balanced. However, minor weighting differences mean certain areas become slightly more prominent in practice.';
      if (fitSubtype === 'PARTIAL_MATCH') return 'The role requires broad balance. The person is broadly compatible but shows stronger emphasis in certain areas.';
      return 'The role calls for a balanced profile. The person brings a clearly stronger emphasis in one area.';
    }
    if (roleVariantType === 'TOP_PAIR') {
      if (fitSubtype === 'PERFECT') return 'The role calls for two equally strong priorities to operate in parallel. The person brings this dual logic as well.';
      if (fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') {
        if (sameDualPair && roleThirdDiff >= 4) {
          return candThirdLower
            ? 'The same dual dominance is present. The third area is less pronounced in the actual profile. As a result, the two main areas appear more prominently and less equally balanced in practice.'
            : 'The same dual dominance is present. The third area is more pronounced in the actual profile. As a result, the two main areas are more strongly stabilised but less consistently lived in parallel.';
        }
        return 'The same dual dominance is present. The weighting within this structure is not fully congruent.';
      }
      if (fitSubtype === 'PARTIAL_MATCH') return 'The role requires a stable dual logic from two equally important areas. The person is broadly compatible but does not consistently reflect this balance.';
      return 'The role calls for two equally strong priorities. The person does not bring this dual logic in the required form.';
    }
    if (roleVariantType === 'BOTTOM_PAIR') {
      if (fitSubtype === 'PERFECT') return 'The role requires a clear priority flanked by two similarly strong secondary areas. The person reflects this structure consistently.';
      if (fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return 'The main priority matches. The flanking areas are also present but weighted differently.';
      if (fitSubtype === 'PARTIAL_MATCH') return 'The person is broadly compatible in the main logic. However, the supporting secondary areas are not present in the required balance.';
      return 'The role requires a clear priority with stable flanking by two similar secondary areas. The person does not adequately reflect this structure.';
    }
    if (fitSubtype === 'PERFECT') return 'The role requires a clear sequence in work logic. The person brings this sequence in a matching form.';
    if (fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return 'The sequence of work logic matches. However, the intensity of individual areas deviates.';
    if (fitSubtype === 'PARTIAL_MATCH') return 'The person is partly compatible but does not consistently meet the required sequence.';
    return 'The role requires a clear ranking of work logic. The person brings a different sequence.';
  }

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

  if (_lang === 'en') {
    if (fitSubtype === 'PERFECT') return 'The role calls for two equally strong priorities. The person brings this dual logic as well. Both areas operate in parallel and stable.';
    if (fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') {
      if (sameDualPair && thirdDiff >= 4) {
        return candThirdLower
          ? 'The same dual dominance is present. The third area is less pronounced. As a result, the two main areas appear more prominently and less equally balanced in practice.'
          : 'The same dual dominance is present. The third area is more pronounced. As a result, the two main areas are more strongly stabilised in practice.';
      }
      return 'Dual dominance is basically present. The balance within this structure is not fully congruent.';
    }
    if (fitSubtype === 'PARTIAL_MATCH') return 'The role calls for two equally strong areas. The person is broadly compatible but does not reflect this balance stably enough.';
    return 'The role requires stable dual dominance. The person does not bring this structure in the required form.';
  }

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
  if (_lang === 'fr') {
    return 'Cette analyse montre dans quelle mesure une personne et un poste s\'alignent dans leur logique de travail. Elle révèle où les modes de travail et les exigences concordent, où des écarts apparaissent et ce que cela implique pour l\'effort de management et d\'intégration au quotidien.';
  }
  if (_lang === 'en') {
    return 'This analysis shows how well the person and position fit together. It makes visible where working style and requirements align, where deviations arise, and what this means for leadership and integration effort in practice.';
  }
  return 'Diese Analyse zeigt, wie gut Person und Position zusammenpassen. Sie macht sichtbar, wo Arbeitsweise und Anforderung übereinstimmen, wo Abweichungen entstehen und was das für den Führungs- und Integrationsaufwand im Alltag bedeutet.';
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
  const level = mapToVariantLevel(input.fitSubtype, input.fitLabel);
  const seed = input.roleName + ':' + input.candName;

  const tv = vars();
  const summary = pickVariant(tv.overall[level], seed + ':overall');
  const managementSummary = familyText + ' ' + pickVariant(tv.management[level], seed + ':mgmt');

  let whyResult = pickVariantSet(tv.why[level], seed + ':why');
  if (level === 'SOFT_YELLOW' || level === 'MISMATCH') {
    whyResult = _lang === 'fr'
      ? [whyResult[0], `L'écart individuel le plus important se situe dans le domaine de ${cs(leadKey)}.`, whyResult[1]]
      : _lang === 'en'
      ? [whyResult[0], `The largest single deviation lies in the area of ${cs(leadKey)}.`, whyResult[1]]
      : [whyResult[0], `Die größte Einzelabweichung liegt im Bereich ${cs(leadKey)}.`, whyResult[1]];
  }

  const risks = pickVariantSet(tv.risks[level], seed + ':risks');

  let profileCompareIntro = '';
  if (_lang === 'fr') {
    if (level === 'PERFECT') {
      profileCompareIntro = 'Les profils ne présentent pas d\'écart significatif dans aucun des trois domaines. La structure de base est alignée.';
    } else if (level === 'EXACT_YELLOW') {
      profileCompareIntro = 'Les profils ne présentent pas d\'écart significatif dans aucun des trois domaines. La structure de base est alignée.';
    } else if (level === 'SOFT_YELLOW') {
      profileCompareIntro = 'La structure de base est globalement compatible. Des écarts perceptibles apparaissent néanmoins dans certains domaines.';
    } else {
      profileCompareIntro = 'Le mode de travail de la personne diffère trop significativement de ce que le poste requiert.';
    }
  } else if (_lang === 'en') {
    if (level === 'PERFECT') {
      profileCompareIntro = 'The profiles do not deviate significantly in any of the three areas. The basic structure fits.';
    } else if (level === 'EXACT_YELLOW') {
      profileCompareIntro = 'The profiles do not deviate significantly in any of the three areas. The basic structure fits.';
    } else if (level === 'SOFT_YELLOW') {
      profileCompareIntro = 'The basic structure is broadly compatible. However, recognisable deviations appear in certain areas.';
    } else {
      profileCompareIntro = 'The person\'s working style differs too significantly from what the role requires.';
    }
  } else {
    if (level === 'PERFECT') {
      profileCompareIntro = 'Die Profile weichen in keinem der drei Bereiche wesentlich voneinander ab. Die Grundstruktur passt.';
    } else if (level === 'EXACT_YELLOW') {
      profileCompareIntro = 'Die Profile weichen in keinem der drei Bereiche wesentlich voneinander ab. Die Grundstruktur passt.';
    } else if (level === 'SOFT_YELLOW') {
      profileCompareIntro = 'Die Grundstruktur ist grundsätzlich anschlussfähig. In einzelnen Bereichen zeigen sich jedoch erkennbare Abweichungen.';
    } else {
      profileCompareIntro = 'Die Arbeitsweise der Person unterscheidet sich zu deutlich von dem, was die Stelle verlangt.';
    }
  }

  let finalText = '';
  if (_lang === 'fr') {
    if (level === 'PERFECT') {
      finalText = 'La personne est adaptée au poste. Le mode de travail, les décisions et l\'approche professionnelle sont alignés.';
    } else if (level === 'EXACT_YELLOW') {
      finalText = `Le poste ${input.roleName} exige ${cn(sp.rDom.top)} et ${cn(sp.rDom.second)} à parts égales. La personne travaille dans la même direction, mais la pondération des domaines secondaires n'est pas entièrement congruente. Avec un management ciblé et une structure claire, la collaboration peut être stabilisée.`;
    } else if (level === 'SOFT_YELLOW') {
      finalText = `Le poste ${input.roleName} est couvert en grande partie par la personne. Simultanément, des différences structurelles existent qui peuvent générer des frictions au quotidien et nécessitent l'attention du management.`;
    } else {
      finalText = `La personne travaille de façon significativement différente de ce que le poste ${input.roleName} requiert. Une prise de poste stable est peu probable dans ces conditions.`;
    }
  } else if (_lang === 'en') {
    if (level === 'PERFECT') {
      finalText = 'The person fits the role. Working style, decisions, and work approach are aligned.';
    } else if (level === 'EXACT_YELLOW') {
      finalText = `The ${input.roleName} role requires ${cn(sp.rDom.top)} and ${cn(sp.rDom.second)} equally. The person works in the same direction, but the weighting of secondary areas is not fully congruent. With targeted leadership and clear structure, collaboration can be stabilised.`;
    } else if (level === 'SOFT_YELLOW') {
      finalText = `The ${input.roleName} role is covered in substantial parts by the person. At the same time, structural differences exist that can create friction in daily practice and require leadership attention.`;
    } else {
      finalText = `The person works significantly differently than the ${input.roleName} role requires. A stable placement is unlikely under these conditions.`;
    }
  } else {
    if (level === 'PERFECT') {
      finalText = 'Die Person passt zur Stelle. Arbeitsweise, Entscheidungen und Arbeitsstil stimmen überein.';
    } else if (level === 'EXACT_YELLOW') {
      finalText = `Die Stelle ${input.roleName} erfordert ${cn(sp.rDom.top)} und ${cn(sp.rDom.second)} gleichermaßen. Die Person arbeitet in dieselbe Richtung, die Gewichtung der Nebenbereiche ist jedoch nicht vollständig deckungsgleich. Mit gezielter Führung und klarer Struktur lässt sich die Zusammenarbeit stabilisieren.`;
    } else if (level === 'SOFT_YELLOW') {
      finalText = `Die Stelle ${input.roleName} wird von der Person in wesentlichen Teilen abgebildet. Gleichzeitig bestehen strukturelle Unterschiede, die im Alltag Reibung erzeugen können und die Führung im Blick behalten muss.`;
    } else {
      finalText = `Die Person arbeitet deutlich anders, als es die Stelle ${input.roleName} verlangt. Eine stabile Besetzung ist unter diesen Bedingungen nicht wahrscheinlich.`;
    }
  }

  return { summary, managementSummary, whyResult, risks, profileCompareIntro, finalText };
}

function dualPairLabel(top: TriadKey, second: TriadKey): string {
  const pair = [top, second].sort().join('|');
  if (_lang === 'fr') {
    if (pair === 'A|I') return 'le rythme et la décision d\'un côté, l\'analyse rigoureuse et la structure de l\'autre';
    if (pair === 'A|N') return 'la communication et les relations d\'un côté, l\'analyse rigoureuse et la structure de l\'autre';
    return 'le rythme et la décision d\'un côté, la communication et les relations de l\'autre';
  }
  if (_lang === 'en') {
    if (pair === 'A|I') return 'action and pace on one hand, careful analysis and structure on the other';
    if (pair === 'A|N') return 'relationship-building and engagement on one hand, analytical rigour and structure on the other';
    return 'action and pace on one hand, collaboration and relationship-building on the other';
  }
  if (pair === 'A|I') return 'Tempo und Umsetzung einerseits, sorgfältige Prüfung und Struktur andererseits';
  if (pair === 'A|N') return 'Beziehungsgestaltung und Einbindung einerseits, analytische Prüfung und Ordnung andererseits';
  return 'Tempo und Umsetzung einerseits, Beziehungsgestaltung und Einbindung andererseits';
}

function roleNeedForArea(area: ImpactArea['key'], rDom: ReturnType<typeof dominanceModeOf>, isDual: boolean, isBal: boolean): string {
  const top = rDom.top;
  const second = rDom.second;
  if (_lang === 'fr') {
    if (area === 'decision') {
      if (isBal) return 'Logique décisionnelle large et équilibrée. Les trois domaines doivent peser de façon égale.';
      if (isDual) return `Décisions qui tiennent compte de ${dualPairLabel(top, second)} à parts égales. Les deux logiques doivent opérer en parallèle.`;
      if (top === 'I') return 'Décisions rapides et orientées résultats. Évaluer brièvement les options, puis agir de façon décisive.';
      if (top === 'N') return 'Décisions qui prennent en compte le contexte, la collaboration et l\'impact interpersonnel.';
      return 'Décisions soigneuses et orientées analyse. Peser les options, vérifier les risques, puis agir.';
    }
    if (area === 'workstyle') {
      if (isBal) return 'Profil de travail large et équilibré. L\'exécution, la coordination et la structure doivent être également représentées.';
      if (isDual) return `Mode de travail qui relie ${cn(top)} et ${cn(second)} de façon parallèle et stable.`;
      if (top === 'I') return 'Rythme élevé, exécution directe et priorisation pragmatique. Mener les tâches rapidement à terme.';
      if (top === 'N') return 'Collaboration, coordination et implication. Travailler ensemble, pas seul.';
      return 'Structure claire, priorisation et processus fiables. Étapes de travail planifiées et suivies de façon transparente.';
    }
    if (area === 'communication') {
      if (isBal) return 'Communication large qui doit être à la fois factuelle, inclusive et orientée action à parts égales.';
      if (isDual) return `Communication à la fois ${ca(top)} et ${ca(second)}. Les deux styles doivent être visiblement présents en parallèle.`;
      if (top === 'I') return 'Communication directe et orientée résultats. Voies courtes, messages clairs.';
      if (top === 'N') return 'Communication inclusive et contextuelle. Écouter, arbitrer, créer l\'alignement.';
      return 'Communication factuelle et basée sur les faits. Argumentation claire, partage d\'information structuré.';
    }
    if (area === 'culture') {
      if (isBal) return 'Culture d\'équipe polyvalente qui ancre de façon égale le rythme, la collaboration et la qualité.';
      if (isDual) return `Culture d\'équipe qui ancre de façon stable ${cn(top)} et ${cn(second)}.`;
      if (top === 'I') return 'Dynamisme, responsabilisation et résultats rapides. La compétition et le rythme définissent l\'équipe.';
      if (top === 'N') return 'Cohésion, confiance et collaboration appréciative. La qualité des relations est centrale.';
      return 'Fiabilité, calme et qualité traçable. Processus stables et résultats prévisibles.';
    }
    if (isBal) return 'Management à travers un impact large et équilibré. Les trois domaines doivent être également représentés.';
    if (isDual) return `Management qui transmet ${cn(top)} et ${cn(second)} à parts égales.`;
    if (top === 'I') return 'Management par le rythme, la capacité décisionnelle et une direction claire.';
    if (top === 'N') return 'Management par la relation, l\'implication et la confiance.';
    return 'Management par l\'orientation, la priorisation et des standards fiables.';
  }
  if (_lang === 'en') {
    if (area === 'decision') {
      if (isBal) return 'Broad, balanced decision logic. All three areas should be equally weighted.';
      if (isDual) return `Decisions that take ${dualPairLabel(top, second)} into account equally. Both logics should operate in parallel.`;
      if (top === 'I') return 'Fast, results-oriented decisions. Assess options briefly, then act decisively.';
      if (top === 'N') return 'Decisions that consider context, collaboration, and interpersonal impact.';
      return 'Careful, analysis-oriented decisions. Weigh options, check risks, then act.';
    }
    if (area === 'workstyle') {
      if (isBal) return 'Broad, balanced work profile. Execution, coordination, and structure should be equally represented.';
      if (isDual) return `Working style that links ${cn(top)} and ${cn(second)} in parallel and stable.`;
      if (top === 'I') return 'High pace, direct execution, and pragmatic prioritisation. Tasks completed quickly.';
      if (top === 'N') return 'Collaboration, coordination, and involvement. Working together, not alone.';
      return 'Clear structure, prioritisation, and reliable processes. Work steps planned and monitored transparently.';
    }
    if (area === 'communication') {
      if (isBal) return 'Broad communication that should be factual, inclusive, and action-oriented in equal measure.';
      if (isDual) return `Communication that is both ${ca(top)} and ${ca(second)}. Both styles should be visibly present in parallel.`;
      if (top === 'I') return 'Direct, results-oriented communication. Short routes, clear messages.';
      if (top === 'N') return 'Inclusive, contextual communication. Listen, mediate, create alignment.';
      return 'Factual, evidence-based communication. Clear argumentation, structured information sharing.';
    }
    if (area === 'culture') {
      if (isBal) return 'Versatile team culture that anchors pace, collaboration, and quality equally.';
      if (isDual) return `Team culture that anchors both ${cn(top)} and ${cn(second)} stably.`;
      if (top === 'I') return 'Dynamism, accountability, and fast results. Competition and pace define the team.';
      if (top === 'N') return 'Cohesion, trust, and appreciative collaboration. Relationship quality is central.';
      return 'Reliability, calmness, and traceable quality. Stable processes and predictable results.';
    }
    if (isBal) return 'Leadership through broad, balanced impact. All three areas should be equally represented.';
    if (isDual) return `Leadership that conveys ${cn(top)} and ${cn(second)} equally.`;
    if (top === 'I') return 'Leadership through pace, decisiveness, and clear direction.';
    if (top === 'N') return 'Leadership through relationship, involvement, and trust.';
    return 'Leadership through orientation, prioritisation, and reliable standards.';
  }

  if (area === 'decision') {
    if (isBal) return 'Breite, ausgewogene Entscheidungslogik. Alle drei Bereiche sollen gleich stark einfließen.';
    if (isDual) return `Entscheidungen, die ${dualPairLabel(top, second)} gleichermaßen berücksichtigen. Beide Logiken sollen parallel wirksam sein.`;
    if (top === 'I') return 'Schnelle, ergebnisorientierte Entscheidungen. Optionen kurz prüfen, dann konsequent handeln.';
    if (top === 'N') return 'Entscheidungen, die Kontext, Zusammenarbeit und zwischenmenschliche Wirkung berücksichtigen.';
    return 'Sorgfältige, prüforientierte Entscheidungen. Optionen abwägen, Risiken prüfen, erst dann handeln.';
  }
  if (area === 'workstyle') {
    if (isBal) return 'Breites, ausgewogenes Arbeitsprofil. Umsetzung, Abstimmung und Struktur sollen gleich stark vertreten sein.';
    if (isDual) return `Arbeitsweise, die ${cn(top)} und ${cn(second)} parallel und stabil verbindet.`;
    if (top === 'I') return 'Hohes Tempo, direkte Umsetzung und pragmatische Priorisierung. Aufgaben schnell abschließen.';
    if (top === 'N') return 'Zusammenarbeit, Abstimmung und Einbindung. Arbeit im Miteinander, nicht im Alleingang.';
    return 'Klare Struktur, Priorisierung und verlässliche Abläufe. Arbeitsschritte nachvollziehbar planen und kontrollieren.';
  }
  if (area === 'communication') {
    if (isBal) return 'Breite Kommunikation, die sowohl sachlich, einbindend als auch handlungsorientiert sein soll.';
    if (isDual) return `Kommunikation, die sowohl ${ca(top)} als auch ${ca(second)} geprägt ist. Beide Stile sollen parallel erkennbar sein.`;
    if (top === 'I') return 'Direkte, ergebnisorientierte Kommunikation. Kurze Wege, klare Ansagen.';
    if (top === 'N') return 'Einbindende, kontextbezogene Kommunikation. Zuhören, vermitteln, Abstimmung schaffen.';
    return 'Sachliche, faktenbasierte Kommunikation. Klare Argumentation, strukturierte Informationsweitergabe.';
  }
  if (area === 'culture') {
    if (isBal) return 'Vielseitige Teamkultur, die Tempo, Zusammenarbeit und Qualität gleich stark verankert.';
    if (isDual) return `Teamkultur, die sowohl ${cn(top)} als auch ${cn(second)} stabil verankert.`;
    if (top === 'I') return 'Dynamik, Eigenverantwortung und schnelle Ergebnisse. Wettbewerb und Tempo prägen das Team.';
    if (top === 'N') return 'Zusammenhalt, Vertrauen und wertschätzende Zusammenarbeit. Beziehungsqualität steht im Zentrum.';
    return 'Verlässlichkeit, Ruhe und nachvollziehbare Qualität. Stabile Abläufe und planbare Ergebnisse.';
  }
  if (isBal) return 'Führung über eine breite, ausgewogene Wirkung. Alle drei Bereiche sollen gleich stark vertreten sein.';
  if (isDual) return `Führung, die ${cn(top)} und ${cn(second)} gleichermaßen vermittelt.`;
  if (top === 'I') return 'Führung über Tempo, Entscheidungsstärke und klare Richtung.';
  if (top === 'N') return 'Führung über Beziehung, Einbindung und Vertrauen.';
  return 'Führung über Orientierung, Priorisierung und verlässliche Standards.';
}

function personTextForArea(area: ImpactArea['key'], input: MatchTextInput): string {
  const sp = getSpecialCases(input.roleProfile, input.candProfile);
  const cTop = sp.cDom.top;
  const cSecond = sp.cDom.second;

  if (_lang === 'fr') {
    if (area === 'decision') {
      if (sp.candIsBalFull) return 'La personne décide de façon largement fondée et pondère diverses perspectives de façon égale.';
      if (sp.candIsDualDom) {
        const pair = [cTop, cSecond].sort().join('|');
        if (pair === 'A|N') return 'La personne décide selon la situation soit plus par la coordination et l\'implication, soit par l\'analyse et la rigueur.';
        if (pair === 'A|I') return 'La personne décide selon la situation soit par une analyse approfondie, soit par une action rapide.';
        return 'La personne décide selon la situation soit par le rythme et l\'action directe, soit par la coordination et l\'implication.';
      }
      if (cTop === 'I') return 'La personne décide rapidement, directement et de façon orientée action.';
      if (cTop === 'N') return 'La personne décide de façon contextuelle, implique les autres et recherche l\'alignement.';
      return 'La personne décide de façon analytique et examine les décisions en profondeur.';
    }
    if (area === 'workstyle') {
      if (sp.candIsBalFull) return 'La personne travaille de façon polyvalente et passe situativement entre le rythme, la coordination et la rigueur.';
      if (sp.candIsDualDom) return `La personne travaille en parallèle par ${cn(cTop)} et ${cn(cSecond)}. Les deux domaines façonnent le mode de travail.`;
      if (cTop === 'I') return 'La personne travaille à un rythme élevé, agit de façon pragmatique et met en oeuvre rapidement.';
      if (cTop === 'N') return 'La personne travaille de façon coopérative, implique les autres et recherche des solutions communes.';
      return 'La personne travaille de façon structurée avec des processus clairs et des étapes fixes. La planification a une haute priorité.';
    }
    if (area === 'communication') {
      if (sp.candIsBalFull) return 'La personne communique de façon polyvalente et adapte son style situativement.';
      if (sp.candIsDualDom) return `La personne communique à la fois ${ca(cTop)} et ${ca(cSecond)}. Le style change selon la situation.`;
      if (cTop === 'I') return 'La personne communique directement, de façon concise et orientée résultats.';
      if (cTop === 'N') return 'La personne communique de façon inclusive, empathique et recherche la compréhension.';
      return 'La personne communique de façon factuelle, structurée et avec un regard clair sur le contexte.';
    }
    if (area === 'culture') {
      if (sp.candIsBalFull) return 'La personne apporte un impact culturel large sans dominer fortement un domaine particulier.';
      if (sp.candIsDualDom) return `La personne façonne la culture de façon égale par ${cn(cTop)} et ${cn(cSecond)}.`;
      if (cTop === 'I') return 'La personne renforce le dynamisme, la responsabilisation et l\'orientation résultats dans l\'équipe.';
      if (cTop === 'N') return 'La personne renforce la cohésion, la confiance et la qualité des relations dans l\'équipe.';
      return 'La personne renforce la conscience qualité, la clarté des processus et la structure. La culture devient plus factuelle et organisée.';
    }
    if (sp.candIsBalFull) return 'La personne manage de façon polyvalente et arbitre de façon équilibrée entre les trois domaines.';
    if (sp.candIsDualDom) return `La personne manage en parallèle par ${cn(cTop)} et ${cn(cSecond)}.`;
    if (cTop === 'I') return 'La personne manage par le rythme, des directives directes et des décisions rapides.';
    if (cTop === 'N') return 'La personne manage par la relation, l\'implication et la confiance.';
    return 'La personne manage plutôt par la clarté, la structure et des directives traçables.';
  }

  if (_lang === 'en') {
    if (area === 'decision') {
      if (sp.candIsBalFull) return 'The person decides in a broadly grounded way, weighing different perspectives evenly.';
      if (sp.candIsDualDom) {
        const pair = [cTop, cSecond].sort().join('|');
        if (pair === 'A|N') return 'The person decides depending on the situation either more through coordination and involvement or through analysis and diligence.';
        if (pair === 'A|I') return 'The person decides depending on the situation either through thorough analysis or fast action.';
        return 'The person decides depending on the situation either through action and pace or through coordination and involvement.';
      }
      if (cTop === 'I') return 'The person decides quickly, directly, and in an action-oriented way.';
      if (cTop === 'N') return 'The person decides contextually, involves others, and seeks alignment.';
      return 'The person decides analytically and examines decisions thoroughly.';
    }
    if (area === 'workstyle') {
      if (sp.candIsBalFull) return 'The person works across a broad range and shifts situationally between pace, coordination, and diligence.';
      if (sp.candIsDualDom) return `The person works in parallel through ${cn(cTop)} and ${cn(cSecond)}. Both areas shape the working style.`;
      if (cTop === 'I') return 'The person works at high pace, acts pragmatically, and implements quickly.';
      if (cTop === 'N') return 'The person works cooperatively, involves others, and seeks joint solutions.';
      return 'The person works in a structured way with clear processes and fixed steps. Planning has high priority.';
    }
    if (area === 'communication') {
      if (sp.candIsBalFull) return 'The person communicates versatilely and adapts their style situationally.';
      if (sp.candIsDualDom) return `The person communicates both ${ca(cTop)} and ${ca(cSecond)}. The style shifts situationally.`;
      if (cTop === 'I') return 'The person communicates directly, concisely, and results-oriented.';
      if (cTop === 'N') return 'The person communicates inclusively, empathetically, and seeks understanding.';
      return 'The person communicates factually, in a structured way, with a clear eye for context.';
    }
    if (area === 'culture') {
      if (sp.candIsBalFull) return 'The person brings a broad cultural impact without strongly dominating any single area.';
      if (sp.candIsDualDom) return `The person shapes the culture through ${cn(cTop)} and ${cn(cSecond)} equally.`;
      if (cTop === 'I') return 'The person strengthens dynamism, accountability, and results-focus in the team.';
      if (cTop === 'N') return 'The person strengthens cohesion, trust, and relationship quality in the team.';
      return 'The person strengthens quality awareness, process clarity, and structure. Culture becomes more factual and organised.';
    }
    if (sp.candIsBalFull) return 'The person leads across a broad range and mediates evenly between all three areas.';
    if (sp.candIsDualDom) return `The person leads in parallel through ${cn(cTop)} and ${cn(cSecond)}.`;
    if (cTop === 'I') return 'The person leads through pace, direct guidance, and quick decisions.';
    if (cTop === 'N') return 'The person leads through relationship, involvement, and trust.';
    return 'The person leads more through clarity, structure, and traceable guidance.';
  }

  if (area === 'decision') {
    if (sp.candIsBalFull) return 'Die Person entscheidet breit abgestützt und wägt verschiedene Perspektiven gleichmäßig ab.';
    if (sp.candIsDualDom) {
      const pair = [cTop, cSecond].sort().join('|');
      if (pair === 'A|N') return 'Die Person entscheidet je nach Situation entweder stärker über Abstimmung und Einbindung oder über Analyse und Sorgfalt.';
      if (pair === 'A|I') return 'Die Person entscheidet je nach Situation entweder über gründliche Prüfung oder über schnelles Handeln.';
      return 'Die Person entscheidet je nach Situation entweder über Tempo und direkte Umsetzung oder über Abstimmung und Einbindung.';
    }
    if (cTop === 'I') return 'Die Person entscheidet schnell, direkt und umsetzungsorientiert.';
    if (cTop === 'N') return 'Die Person entscheidet kontextbezogen, bezieht das Umfeld ein und sucht Abstimmung.';
    return 'Die Person entscheidet analytisch und prüft Entscheidungen gründlich.';
  }
  if (area === 'workstyle') {
    if (sp.candIsBalFull) return 'Die Person arbeitet breit aufgestellt und wechselt situativ zwischen Tempo, Abstimmung und Sorgfalt.';
    if (sp.candIsDualDom) return `Die Person arbeitet parallel über ${cn(cTop)} und ${cn(cSecond)}. Beide Bereiche prägen den Arbeitsstil.`;
    if (cTop === 'I') return 'Die Person arbeitet mit hohem Tempo, handelt pragmatisch und setzt schnell um.';
    if (cTop === 'N') return 'Die Person arbeitet kooperativ, bezieht andere ein und sucht gemeinsame Lösungen.';
    return 'Die Person arbeitet strukturiert mit klaren Abläufen und festen Arbeitsschritten. Planung hat hohe Priorität.';
  }
  if (area === 'communication') {
    if (sp.candIsBalFull) return 'Die Person kommuniziert vielseitig und passt ihren Stil situativ an.';
    if (sp.candIsDualDom) return `Die Person kommuniziert sowohl ${ca(cTop)} als auch ${ca(cSecond)}. Der Stil wechselt situativ.`;
    if (cTop === 'I') return 'Die Person kommuniziert direkt, kurz und ergebnisorientiert.';
    if (cTop === 'N') return 'Die Person kommuniziert einbindend, empathisch und sucht Verständigung.';
    return 'Die Person kommuniziert sachlich, strukturiert und mit erkennbarem Blick für Abstimmung und Umfeld.';
  }
  if (area === 'culture') {
    if (sp.candIsBalFull) return 'Die Person bringt eine breite kulturelle Wirkung mit, ohne einzelne Bereiche stark zu dominieren.';
    if (sp.candIsDualDom) return `Die Person prägt die Kultur durch ${cn(cTop)} und ${cn(cSecond)} gleichermaßen.`;
    if (cTop === 'I') return 'Die Person stärkt Dynamik, Eigenverantwortung und Ergebnisorientierung im Team.';
    if (cTop === 'N') return 'Die Person stärkt Zusammenhalt, Vertrauen und Beziehungsqualität im Team.';
    return 'Die Person stärkt Qualitätsbewusstsein, Regelklarheit und Ordnung. Die Kultur wird sachlicher und strukturierter.';
  }
  if (sp.candIsBalFull) return 'Die Person führt breit aufgestellt und vermittelt ausgewogen zwischen allen drei Bereichen.';
  if (sp.candIsDualDom) return `Die Person führt parallel über ${cn(cTop)} und ${cn(cSecond)}.`;
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

    if (_lang === 'fr') {
      if (key === 'decision') {
        if (input.fitSubtype === 'PERFECT') return 'Le comportement décisionnel est pleinement congruent avec les exigences du poste. Les deux priorités requises sont portées en parallèle.';
        if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Par conséquent, toutes les situations ne sont pas traitées avec le même équilibre constant.`;
        if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return `${dualText} Cependant, la simultanéité requise des deux logiques n'est pas atteinte de façon suffisamment stable.`;
        return `${dualText} La double logique requise du poste n'est donc pas atteinte de façon stable.`;
      }
      if (key === 'workstyle') {
        if (input.fitSubtype === 'PERFECT') return 'Le mode de travail est pleinement congruent avec les exigences du poste. Les deux priorités requises sont reflétées en parallèle et de façon stable.';
        if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Dans la pratique, les accents varient davantage plutôt que d'agir constamment en parallèle.`;
        if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return 'Le mode de travail est globalement compatible mais n\'atteint pas constamment l\'équilibre requis des deux logiques principales.';
        return 'Le mode de travail ne reflète pas suffisamment la double logique requise.';
      }
      if (key === 'communication') {
        if (input.fitSubtype === 'PERFECT') return 'Le comportement communicationnel est cohérent et bien compatible. Les deux exigences sont bien couvertes.';
        if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Par conséquent, la constance de l'articulation entre implication et structure factuelle varie.`;
        if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return 'La communication couvre le poste en partie mais ne maintient pas constamment l\'équilibre requis.';
        return 'La logique de communication diffère significativement du poste. La coordination et les échanges se déroulent différemment de ce qui est requis.';
      }
      if (key === 'culture') {
        if (input.fitSubtype === 'PERFECT') return 'L\'impact sur la culture d\'équipe soutient la direction souhaitée du poste. Les deux aspects sont portés en parallèle.';
        if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Par conséquent, la culture vécue peut différer des attentes du poste sur certains aspects.`;
        if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return 'L\'impact sur la collaboration et la culture d\'équipe est globalement viable mais ne reste pas congruent.';
        return 'L\'impact culturel modifierait sensiblement la direction d\'équipe souhaitée. La collaboration évolue différemment de ce qui est prévu pour le poste.';
      }
      if (key === 'leadership') {
        if (input.fitSubtype === 'PERFECT') return 'L\'impact managérial est cohérent et bien compatible. Les deux priorités requises sont portées en parallèle et de façon stable.';
        if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Par conséquent, l'impact managérial au quotidien peut être pondéré légèrement différemment de ce que le poste requiert.`;
        if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return 'L\'impact managérial est globalement compatible mais n\'atteint pas constamment l\'équilibre requis des deux logiques principales.';
        return 'L\'impact managérial ne reflète pas suffisamment la double logique requise.';
      }
    }

    if (_lang === 'en') {
      if (key === 'decision') {
        if (input.fitSubtype === 'PERFECT') return 'Decision-making is fully congruent with the role requirement. Both required priorities are carried in parallel.';
        if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} As a result, not every situation is decided with the same consistent balance.`;
        if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return `${dualText} However, the required simultaneity of both logics is not consistently achieved.`;
        return `${dualText} The required dual logic of the role is therefore not stably reached.`;
      }
      if (key === 'workstyle') {
        if (input.fitSubtype === 'PERFECT') return 'Working style is fully congruent with the role requirement. Both required priorities are reflected in parallel and stably.';
        if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} In practice, the accents shift more than acting constantly in parallel.`;
        if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return 'Working style is broadly compatible but does not consistently achieve the required balance of both main logics.';
        return 'Working style does not adequately reflect the required dual logic.';
      }
      if (key === 'communication') {
        if (input.fitSubtype === 'PERFECT') return 'Communication behaviour is consistent and well compatible. Both requirements are well covered.';
        if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} As a result, how consistently mediation happens between involvement and factual structure differs.`;
        if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return 'Communication covers the role in part but does not consistently maintain the required balance.';
        return 'Communication logic differs significantly from the role. Coordination and exchange happen differently than required.';
      }
      if (key === 'culture') {
        if (input.fitSubtype === 'PERFECT') return 'Cultural impact supports the desired direction of the role. Both sides are carried in parallel.';
        if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} As a result, the lived culture can differ from the role expectation in certain aspects.`;
        if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return 'Impact on collaboration and team culture is broadly viable but does not remain congruent.';
        return 'Cultural impact would noticeably change the desired team direction. Collaboration develops differently than intended for the role.';
      }
      if (key === 'leadership') {
        if (input.fitSubtype === 'PERFECT') return 'Leadership impact is consistent and well compatible. Both required priorities are carried in parallel and stably.';
        if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} As a result, leadership impact in practice can be slightly differently weighted than the role requires.`;
        if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return 'Leadership impact is broadly compatible but does not consistently achieve the required balance of both main logics.';
        return 'Leadership impact does not adequately reflect the required dual logic.';
      }
    }

    if (key === 'decision') {
      if (input.fitSubtype === 'PERFECT') return 'Das Entscheidungsverhalten ist deckungsgleich mit der Stellenanforderung. Beide geforderten Schwerpunkte werden parallel getragen.';
      if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Dadurch wird nicht jede Situation mit derselben konstanten Balance entschieden.`;
      if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return `${dualText} Die geforderte Gleichzeitigkeit beider Logiken wird jedoch nicht stabil genug getroffen.`;
      return `${dualText} Die geforderte Doppellogik der Stelle wird dadurch nicht stabil erreicht.`;
    }

    if (key === 'workstyle') {
      if (input.fitSubtype === 'PERFECT') return 'Die Arbeitsweise ist deckungsgleich mit der Stellenanforderung. Beide geforderten Schwerpunkte werden parallel und stabil abgebildet.';
      if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Im Alltag wechseln die Akzente dadurch stärker, anstatt konstant parallel zu wirken.`;
      if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return 'Die Arbeitsweise ist grundsätzlich anschlussfähig, erreicht aber nicht durchgehend die geforderte Balance beider Hauptlogiken.';
      return 'Die Arbeitsweise bildet die geforderte Doppellogik nicht ausreichend ab.';
    }

    if (key === 'communication') {
      if (input.fitSubtype === 'PERFECT') return 'Das Kommunikationsverhalten ist stimmig und gut anschlussfähig. Beide Anforderungen werden gut abgedeckt.';
      if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Dadurch unterscheidet sich, wie konstant zwischen Einbindung und sachlicher Struktur vermittelt wird.`;
      if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return 'Die Kommunikation deckt die Stelle teilweise ab, bleibt aber nicht durchgehend in der geforderten Balance.';
      return 'Die Kommunikationslogik unterscheidet sich deutlich von der Rolle. Abstimmung und Austausch verlaufen anders als erforderlich.';
    }

    if (key === 'culture') {
      if (input.fitSubtype === 'PERFECT') return 'Die Wirkung auf die Teamkultur unterstützt die gewünschte Ausrichtung der Rolle. Beide Seiten werden parallel getragen.';
      if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Dadurch kann sich die gelebte Kultur in einzelnen Aspekten von der Stellenerwartung unterscheiden.`;
      if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return 'Die Wirkung auf Zusammenarbeit und Teamkultur ist grundsätzlich tragfähig, bleibt aber nicht deckungsgleich.';
      return 'Die kulturelle Wirkung würde die gewünschte Teamrichtung spürbar verändern. Zusammenarbeit entwickelt sich anders als für die Rolle vorgesehen.';
    }

    if (key === 'leadership') {
      if (input.fitSubtype === 'PERFECT') return 'Die Führungswirkung ist stimmig und gut anschlussfähig. Beide geforderten Schwerpunkte werden parallel und stabil getragen.';
      if (input.fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return `${dualText} Dadurch kann sich die Führungswirkung im Alltag leicht anders gewichten als die Rolle es verlangt.`;
      if (input.fitSubtype === 'PARTIAL_MATCH' && input.fitLabel !== 'Nicht geeignet') return 'Die Führungswirkung ist grundsätzlich anschlussfähig, erreicht aber nicht durchgehend die geforderte Balance beider Hauptlogiken.';
      return 'Die Führungswirkung bildet die geforderte Doppellogik nicht ausreichend ab.';
    }
  }

  if (_lang === 'fr') {
    const fsub = input.fitSubtype;
    const notSuitable = input.fitLabel === 'Nicht geeignet';
    if (key === 'decision') {
      if (fsub === 'PERFECT') return 'Le comportement décisionnel est pleinement aligné avec les exigences du poste.';
      if (!notSuitable) return 'Le comportement décisionnel est globalement compatible, mais présente des écarts dans la pondération.';
      return 'Le comportement décisionnel s\'écarte significativement des exigences du poste.';
    }
    if (key === 'workstyle') {
      if (fsub === 'PERFECT') return 'Le mode de travail est pleinement aligné avec les exigences du poste.';
      if (!notSuitable) return 'Le mode de travail est globalement compatible, mais présente des écarts dans certains domaines.';
      return 'Le mode de travail s\'écarte significativement des exigences du poste.';
    }
    if (key === 'communication') {
      if (fsub === 'PERFECT') return 'Le comportement communicationnel est cohérent et bien compatible avec le poste.';
      if (!notSuitable) return 'La communication est globalement compatible, mais ne reste pas constamment dans l\'équilibre requis.';
      return 'La logique de communication diffère significativement des exigences du poste.';
    }
    if (key === 'culture') {
      if (fsub === 'PERFECT') return 'L\'impact sur la culture d\'équipe soutient la direction souhaitée du poste.';
      if (!notSuitable) return 'L\'impact sur la culture d\'équipe est globalement compatible, mais peut s\'écarter dans certains aspects.';
      return 'L\'impact culturel modifierait sensiblement la direction d\'équipe souhaitée.';
    }
    if (fsub === 'PERFECT') return 'L\'impact managérial est cohérent et bien compatible avec les exigences du poste.';
    if (!notSuitable) return 'L\'impact managérial est globalement compatible, mais ne reflète pas constamment l\'équilibre requis.';
    return 'L\'impact managérial ne reflète pas suffisamment la logique du poste.';
  }

  const level = mapToVariantLevel(input.fitSubtype, input.fitLabel);
  const tv = vars();
  const areaKey = key as keyof typeof tv.impact;
  const areaVariants = tv.impact[areaKey];
  if (areaVariants) {
    const seed = input.roleName + ':' + input.candName + ':' + key;
    return pickVariant(areaVariants[level], seed);
  }
  return pickVariant(tv.impact.decision[level], input.roleName + ':' + input.candName + ':fallback');
}

function buildImpactAreas(input: MatchTextInput): ImpactArea[] {
  const sp = getSpecialCases(input.roleProfile, input.candProfile);
  const rDom = dominanceModeOf(input.roleProfile);
  const isDual = sp.roleIsDualDom;
  const isBal = sp.roleIsBalFull;

  const decisionSev = capSeverity(severityFromGap(input.maxDiff), input.fitSubtype, input.fitLabel);
  const workSev = capSeverity(severityFromGap(Math.abs(input.roleProfile.A - input.candProfile.A)), input.fitSubtype, input.fitLabel);
  const commSev = capSeverity(severityFromGap(Math.abs(input.roleProfile.N - input.candProfile.N)), input.fitSubtype, input.fitLabel);
  const cultSev = commSev;

  const areaTitle = (key: ImpactArea['key']) => {
    if (_lang === 'fr') {
      if (key === 'decision') return 'Comportement décisionnel';
      if (key === 'workstyle') return 'Mode de travail';
      if (key === 'communication') return 'Communication';
      if (key === 'culture') return 'Impact sur la culture d\'équipe';
      return 'Impact managérial';
    }
    if (_lang === 'en') {
      if (key === 'decision') return 'Decision-making';
      if (key === 'workstyle') return 'Work style';
      if (key === 'communication') return 'Communication behaviour';
      if (key === 'culture') return 'Team culture impact';
      return 'Leadership impact';
    }
    if (key === 'decision') return 'Entscheidungsverhalten';
    if (key === 'workstyle') return 'Arbeitsweise';
    if (key === 'communication') return 'Kommunikationsverhalten';
    if (key === 'culture') return 'Wirkung auf Zusammenarbeit und Teamkultur';
    return 'Führungswirkung';
  };

  const areas: ImpactArea[] = [
    {
      key: 'decision',
      title: areaTitle('decision'),
      label: sevLabel(decisionSev),
      severity: decisionSev,
      roleNeed: roleNeedForArea('decision', rDom, isDual, isBal),
      personText: personTextForArea('decision', input),
      interpretation: areaInterpretation('decision', input),
    },
    {
      key: 'workstyle',
      title: areaTitle('workstyle'),
      label: sevLabel(workSev),
      severity: workSev,
      roleNeed: roleNeedForArea('workstyle', rDom, isDual, isBal),
      personText: personTextForArea('workstyle', input),
      interpretation: areaInterpretation('workstyle', input),
    },
    {
      key: 'communication',
      title: areaTitle('communication'),
      label: sevLabel(commSev),
      severity: commSev,
      roleNeed: roleNeedForArea('communication', rDom, isDual, isBal),
      personText: personTextForArea('communication', input),
      interpretation: areaInterpretation('communication', input),
    },
    {
      key: 'culture',
      title: areaTitle('culture'),
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
      title: areaTitle('leadership'),
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

  if (_lang === 'fr') {
    if (sp.candIsBalFull) {
      return {
        controlledPressure: "Sous une pression modérée, cette personne ne montre pas de priorité clairement définie. Les trois composantes étant presque égales, la réaction varie selon la situation : parfois par le rythme, parfois par la coordination, parfois par la structure. Le comportement paraît ainsi peu prévisible.",
        uncontrolledStress: "Sous une charge élevée, il n'y a pas d'ancre stable. La personne peut passer d'une logique à l'autre, parfois plus impulsive, parfois plus orientée relations, parfois plus contrôlée. Ce basculement devient clairement perceptible au quotidien et peut déstabiliser l'entourage.",
      };
    }
    if (sp.candIsDualDom) {
      return {
        controlledPressure: `Quand la pression augmente, la personne s'appuie sur la logique actuellement dominante. Les deux composantes principales étant presque aussi fortes, la réaction varie selon la situation : parfois davantage via ${cn(sp.cDom.top)}, parfois via ${cn(sp.cDom.second)}.`,
        uncontrolledStress: sp.cDom.third === 'N'
          ? "Sous très forte charge, l'accent peut se déplacer vers l'écoute, la médiation et la coordination interpersonnelle."
          : sp.cDom.third === 'A'
            ? "Sous très forte charge, l'accent peut se déplacer vers l'ordre, la vérification et la sécurisation. Les décisions deviennent plus lentes mais plus contrôlées."
            : "Sous très forte charge, l'accent peut se déplacer vers le rythme et l'action directe. Les décisions deviennent plus rapides et plus immédiates.",
      };
    }
    const candIsBottomPair = sp.cDom.gap1 > EQ_TOL && sp.cDom.gap2 <= EQ_TOL;
    if (candIsBottomPair) {
      return {
        controlledPressure: `Quand la pression monte, la tendance vers ${cn(sp.cDom.top)} se renforce dans un premier temps. La personne cherche à maintenir contrôle et vue d'ensemble via sa logique principale.`,
        uncontrolledStress: `Sous très forte charge, le comportement peut évoluer selon les situations. ${cn(sp.cDom.second)} et ${cn(sp.cDom.third)} étant presque aussi prononcées, ces deux composantes secondaires entrent en concurrence. Selon la situation, la réaction passe alors davantage par ${cn(sp.cDom.second)} ou par ${cn(sp.cDom.third)}. Le comportement devient ainsi plus variable et moins prévisible.`,
      };
    }
    return {
      controlledPressure: `Sous une pression modérée, la tendance vers ${cn(sp.cDom.top)} se renforce dans un premier temps.`,
      uncontrolledStress: `Sous une charge élevée, le comportement peut se déplacer vers ${cn(sp.cDom.second)}. La hiérarchie des priorités de travail bascule alors en faveur de la deuxième logique la plus forte.`,
    };
  }

  if (_lang === 'en') {
    if (sp.candIsBalFull) {
      return {
        controlledPressure: 'Under moderate pressure, no clear priority emerges from this person. Since all three areas are almost equally pronounced, the reaction shifts situationally: sometimes steering through pace, sometimes coordination, sometimes structure. Behaviour appears difficult to predict as a result.',
        uncontrolledStress: 'Under high load, there is no stable anchor. The person may switch between the three logics — sometimes more impulsive, sometimes more relationship-focused, sometimes more controlled. In practice, this switching becomes clearly noticeable and can unsettle those around them.',
      };
    }
    if (sp.candIsDualDom) {
      return {
        controlledPressure: `As work pressure rises, the person falls back on the currently leading logic. Since both main areas are almost equally strong, the reaction varies situationally: sometimes steering more through ${cn(sp.cDom.top)}, sometimes through ${cn(sp.cDom.second)}.`,
        uncontrolledStress: sp.cDom.third === 'N'
          ? 'As load increases significantly, the focus can shift noticeably. Empathy comes more to the fore. More mediating, explaining, and aligning takes place.'
          : sp.cDom.third === 'A'
            ? 'As load increases significantly, the focus can shift more towards order, checking, and securing. Decisions become slower but more controlled.'
            : 'As load increases significantly, the focus can shift more towards pace and direct action. Decisions become faster and more immediate.',
      };
    }
    const candIsBottomPair = sp.cDom.gap1 > EQ_TOL && sp.cDom.gap2 <= EQ_TOL;
    if (candIsBottomPair) {
      return {
        controlledPressure: `As work pressure rises, the tendency towards ${cn(sp.cDom.top)} initially intensifies. The person tries to maintain control and overview through their main logic.`,
        uncontrolledStress: `As load increases significantly, behaviour can shift situationally. Since ${cn(sp.cDom.second)} and ${cn(sp.cDom.third)} are almost equally pronounced, these two secondary areas compete with each other. Depending on the situation, the reaction is then either more through ${cn(sp.cDom.second)} or through ${cn(sp.cDom.third)}. Behaviour appears more variable and less predictable as a result.`,
      };
    }
    return {
      controlledPressure: `Under moderate pressure, the tendency towards ${cn(sp.cDom.top)} initially intensifies.`,
      uncontrolledStress: `Under high load, behaviour can shift towards ${cn(sp.cDom.second)}. The clear ranking of work priorities then tips in favour of the second-strongest logic.`,
    };
  }

  if (sp.candIsBalFull) {
    return {
      controlledPressure: 'Unter moderatem Druck zeigt sich bei dieser Person kein klarer Schwerpunkt. Da alle drei Bereiche fast gleich stark ausgeprägt sind, wechselt die Reaktion situativ: Mal wird stärker über Tempo gesteuert, mal über Abstimmung, mal über Struktur. Das Verhalten wirkt dadurch wenig vorhersehbar.',
      uncontrolledStress: 'Unter hoher Belastung fehlt ein stabiler Anker. Die Person kann zwischen den drei Logiken springen – mal impulsiver, mal beziehungsorientierter, mal kontrollierter. Im Alltag wird dieses Wechseln deutlich spürbar und kann das Umfeld verunsichern.',
    };
  }

  if (sp.candIsDualDom) {
    return {
      controlledPressure: `Steigt der Arbeitsdruck, greift die Person auf die gerade führende Logik zurück. Da beide Hauptanteile fast gleich stark sind, fällt die Reaktion situationsabhängig aus: Mal wird stärker über ${cn(sp.cDom.top)} gesteuert, mal über ${cn(sp.cDom.second)}.`,
      uncontrolledStress: sp.cDom.third === 'N'
        ? 'Wird die Belastung sehr hoch, kann sich der Schwerpunkt merklich verschieben. Einfühlungsvermögen tritt stärker in den Vordergrund. Es wird mehr moderiert, erklärt und abgestimmt.'
        : sp.cDom.third === 'A'
          ? 'Wird die Belastung sehr hoch, kann sich der Schwerpunkt stärker auf Ordnung, Prüfung und Absicherung verschieben. Entscheidungen werden langsamer, aber kontrollierter.'
          : 'Wird die Belastung sehr hoch, kann sich der Schwerpunkt stärker auf Tempo und direkte Umsetzung verschieben. Entscheidungen werden schneller und unmittelbarer getroffen.',
    };
  }

  const candIsBottomPair = sp.cDom.gap1 > EQ_TOL && sp.cDom.gap2 <= EQ_TOL;
  if (candIsBottomPair) {
    return {
      controlledPressure: `Steigt der Arbeitsdruck, verstärkt sich zunächst die Tendenz zu ${cn(sp.cDom.top)}. Die Person versucht, über ihre Hauptlogik Kontrolle und Übersicht zu behalten.`,
      uncontrolledStress: `Wird die Belastung sehr hoch, kann sich das Verhalten situativ verschieben. Da ${cn(sp.cDom.second)} und ${cn(sp.cDom.third)} fast gleich stark ausgeprägt sind, konkurrieren diese beiden Nebenbereiche miteinander. Je nach Situation wird dann entweder stärker über ${cn(sp.cDom.second)} oder über ${cn(sp.cDom.third)} reagiert. Das Verhalten wirkt dadurch wechselhafter und weniger berechenbar.`,
    };
  }

  return {
    controlledPressure: `Unter moderatem Druck verstärkt sich zunächst die Tendenz zu ${cn(sp.cDom.top)}.`,
    uncontrolledStress: `Unter hoher Belastung kann sich das Verhalten in Richtung ${cn(sp.cDom.second)} verschieben. Die klare Rangfolge der Arbeitsschwerpunkte kippt dann zugunsten der zweitstärksten Logik.`,
  };
}

function buildTimeline(input: MatchTextInput): string[] {
  const rTop = dominanceModeOf(input.roleProfile).top;
  if (_lang === 'fr') {
    if (input.fitSubtype === 'PERFECT') {
      return [
        `Le poste ${input.roleName} exige ${cs(rTop)}. Le mode de travail est adapté. La prise de poste devrait se dérouler sans difficulté. Des ajustements ne sont nécessaires que dans des cas isolés.`,
        'Les exigences du poste sont couvertes de façon stable. Des écarts mineurs apparaissent dans les domaines secondaires. Des entretiens d\'objectifs réguliers permettent de les identifier rapidement.',
        'Les exigences du poste sont satisfaites de façon stable à long terme. L\'effort de management reste faible. Des révisions semestrielles suffisent.',
      ];
    }
    if (input.fitLabel === 'Nicht geeignet') {
      return [
        `Le poste ${input.roleName} exige ${cs(rTop)}. La personne pondère ses priorités de travail de façon significativement différente. Dès la prise de poste, les différences deviennent visibles et nécessitent un accompagnement intensif.`,
        'Les écarts deviennent de plus en plus perceptibles dans la pratique. Sans un management très proche, les priorités et le mode de travail s\'éloignent davantage des exigences du poste. Cela consomme du temps de management et génère des frictions dans l\'équipe.',
        'À long terme, une adéquation stable n\'est possible qu\'avec un effort de management durablement élevé. La question de la viabilité de la prise de poste devrait être régulièrement et critiquement réévaluée.',
      ];
    }
    return [
      `Le poste ${input.roleName} exige ${cs(rTop)}. La personne travaille dans la même direction, mais pondère différemment les domaines secondaires. Il convient d'être attentif à ces différences dès la prise de poste.`,
      'La direction générale est juste, mais les écarts dans les domaines secondaires deviennent perceptibles dans la pratique. Sans pilotage ciblé, ces différences peuvent se consolider. Des entretiens d\'objectifs réguliers et des attentes claires sont nécessaires.',
      'Avec un management ciblé, les différences dans les domaines secondaires peuvent être durablement compensées. Révision semestrielle recommandée pour s\'assurer que l\'adéquation reste stable.',
    ];
  }
  if (_lang === 'en') {
    if (input.fitSubtype === 'PERFECT') {
      return [
        `The ${input.roleName} role requires ${cs(rTop)}. Working style is aligned. Onboarding is expected to proceed smoothly. Adjustment is only needed in isolated cases.`,
        'Role requirements are covered in a stable manner. Minor deviations appear in secondary areas. Regular target discussions help to identify these early.',
        'Role requirements are fulfilled in a stable manner long-term. Management effort remains low. Half-yearly reviews are sufficient.',
      ];
    }
    if (input.fitLabel === 'Nicht geeignet') {
      return [
        `The ${input.roleName} role requires ${cs(rTop)}. The person weights their work priorities significantly differently. Differences become visible already during onboarding and require intensive guidance.`,
        'Deviations become increasingly noticeable in practice. Without very close management, priorities and working style shift further from the role requirement. This costs leadership time and creates friction in the team.',
        'Long-term, stable fit is only achievable with permanently high management effort. The question of whether the placement remains viable should be reviewed regularly and critically.',
      ];
    }
    return [
      `The ${input.roleName} role requires ${cs(rTop)}. The person works in the same direction but weights secondary areas differently. Targeted attention to these differences is needed already during onboarding.`,
      'The basic direction is right, but deviations in secondary areas become noticeable in practice. Without targeted guidance, these differences can become entrenched. Regular target discussions and clear expectations are necessary.',
      'With targeted leadership, the differences in secondary areas can be lastingly balanced. Half-yearly review recommended to ensure fit remains stable.',
    ];
  }

  if (input.fitSubtype === 'PERFECT') {
    return [
      `Die Stelle ${input.roleName} verlangt ${cs(rTop)}. Die Arbeitsweise passt. Die Einarbeitung verläuft voraussichtlich reibungslos. Nur in Einzelfällen ist Nachjustierung nötig.`,
      'Die Stellenanforderungen werden stabil abgedeckt. In den Nebenbereichen treten kleinere Abweichungen auf. Regelmäßige Zielgespräche helfen, diese frühzeitig zu erkennen.',
      'Die Stellenanforderungen werden langfristig stabil erfüllt. Der Führungsaufwand bleibt gering. Halbjährliche Überprüfungen genügen.',
    ];
  }
  if (input.fitLabel === 'Nicht geeignet') {
    return [
      `Die Stelle ${input.roleName} verlangt ${cs(rTop)}. Die Person gewichtet die Arbeitsschwerpunkte deutlich anders. Bereits in der Einarbeitung werden die Unterschiede sichtbar und erfordern intensive Begleitung.`,
      'Die Abweichungen werden im Alltag zunehmend spürbar. Ohne sehr enge Führung verschieben sich Prioritäten und Arbeitsweise weiter von der Stellenanforderung weg. Das kostet Führungszeit und erzeugt im Team Reibung.',
      'Langfristig ist eine stabile Passung nur mit dauerhaft hohem Führungsaufwand erreichbar. Die Frage, ob die Besetzung tragfähig bleibt, sollte regelmäßig und kritisch überprüft werden.',
    ];
  }
  return [
    `Die Stelle ${input.roleName} verlangt ${cs(rTop)}. Die Person arbeitet in dieselbe Richtung, gewichtet aber die Nebenbereiche anders. Bereits in der Einarbeitung sollte gezielt auf diese Unterschiede geachtet werden.`,
    'Die Grundrichtung stimmt, aber die Abweichungen in den Nebenbereichen werden im Alltag bemerkbar. Ohne gezielte Steuerung können sich diese Unterschiede verfestigen. Regelmäßige Zielgespräche und klare Erwartungen sind notwendig.',
    'Mit gezielter Führung lassen sich die Unterschiede in den Nebenbereichen dauerhaft ausgleichen. Halbjährliche Überprüfung empfohlen, um sicherzustellen, dass die Passung stabil bleibt.',
  ];
}

function buildDevelopment(input: MatchTextInput): DevelopmentBlock {
  const rDom = dominanceModeOf(input.roleProfile);
  if (_lang === 'fr') {
    if (input.fitSubtype === 'PERFECT') {
      return {
        title: 'Perspectives de développement',
        subtitle: '3 sur 3 — Bonnes perspectives, faible effort',
        scoreText: 'niedrig',
        text1: `Le poste exige ${cn(rDom.top)} et ${cn(rDom.second)} à parts égales. La personne couvre cette exigence de façon cohérente.`,
        text2: `Le poste ${input.roleName} exige ${cn(rDom.top)} et ${cn(rDom.second)} à parts égales. La personne apporte ce mode de travail. La direction générale et la pondération sont alignées. L'effort de management est faible. Une prise de poste stable est probable dans ces conditions.`,
      };
    }
    if (input.fitLabel === 'Nicht geeignet') {
      return {
        title: 'Perspectives de développement',
        subtitle: '1 sur 3 — Effort élevé, résultat incertain',
        scoreText: 'hoch',
        text1: `Le poste exige ${cn(rDom.top)} et ${cn(rDom.second)} à parts égales. La personne pondère ses priorités de travail de façon significativement différente. Une adaptation n'est possible qu'avec un effort de management élevé et durable.`,
        text2: `Les exigences du poste ${input.roleName} et le mode de travail de la personne ne sont pas compatibles. Sans management étroit, une prise de poste stable est peu probable.`,
      };
    }
    return {
      title: 'Perspectives de développement',
      subtitle: '2 sur 3 — Réalisable, nécessite un management ciblé',
      scoreText: 'mittel',
      text1: `Le poste exige ${cn(rDom.top)} et ${cn(rDom.second)} à parts égales. La personne travaille dans la même direction, mais doit encore apprendre de façon ciblée dans certains domaines. Avec des objectifs clairs et un retour régulier, c'est bien réalisable.`,
      text2: buildSummary(input).finalText,
    };
  }
  if (_lang === 'en') {
    if (input.fitSubtype === 'PERFECT') {
      return {
        title: 'Development outlook',
        subtitle: '3 of 3 \u2014 Good prospects, low effort',
        scoreText: 'niedrig',
        text1: `The role requires ${cn(rDom.top)} and ${cn(rDom.second)} equally. The person covers this requirement in a consistent way.`,
        text2: `The ${input.roleName} role requires ${cn(rDom.top)} and ${cn(rDom.second)} equally. The person brings this working style. Basic direction and weighting are aligned. Management effort is low. A stable placement is likely under these conditions.`,
      };
    }
    if (input.fitLabel === 'Nicht geeignet') {
      return {
        title: 'Development outlook',
        subtitle: '1 of 3 \u2014 High effort, outcome uncertain',
        scoreText: 'hoch',
        text1: `The role requires ${cn(rDom.top)} and ${cn(rDom.second)} equally. The person weights their work priorities significantly differently. Adaptation is only possible with high and sustained management effort.`,
        text2: `The requirements of the ${input.roleName} role and the person's working style are incompatible. Without close management, a stable placement is unlikely.`,
      };
    }
    return {
      title: 'Development outlook',
      subtitle: '2 of 3 \u2014 Manageable, requires targeted leadership',
      scoreText: 'mittel',
      text1: `The role requires ${cn(rDom.top)} and ${cn(rDom.second)} equally. The person works in the same direction but still needs targeted learning in certain areas. With clear goals and regular feedback this is well achievable.`,
      text2: buildSummary(input).finalText,
    };
  }

  if (input.fitSubtype === 'PERFECT') {
    return {
      title: 'Entwicklungsprognose',
      subtitle: '3 von 3 Gute Aussichten, wenig Aufwand',
      scoreText: 'niedrig',
      text1: `Die Stelle verlangt ${cn(rDom.top)} und ${cn(rDom.second)} gleichermaßen. Die Person deckt diese Anforderung in stimmiger Form ab.`,
      text2: `Die Stelle ${input.roleName} erfordert ${cn(rDom.top)} und ${cn(rDom.second)} gleichermaßen. Die Person bringt diese Arbeitsweise mit. Grundrichtung und Gewichtung passen. Der Führungsaufwand ist gering. Eine stabile Besetzung ist unter diesen Bedingungen wahrscheinlich.`,
    };
  }

  if (input.fitLabel === 'Nicht geeignet') {
    return {
      title: 'Entwicklungsprognose',
      subtitle: '1 von 3 Hoher Aufwand, Ergebnis unsicher',
      scoreText: 'hoch',
      text1: `Die Stelle verlangt ${cn(rDom.top)} und ${cn(rDom.second)} gleichermaßen. Die Person gewichtet ihre Arbeitsschwerpunkte deutlich anders. Eine Anpassung ist nur mit hohem und dauerhaftem Führungsaufwand möglich.`,
      text2: `Die Anforderungen der Stelle ${input.roleName} und die Arbeitsweise der Person passen nicht zusammen. Ohne enge Führung ist eine stabile Besetzung nicht wahrscheinlich.`,
    };
  }

  return {
    title: 'Entwicklungsprognose',
    subtitle: '2 von 3 Machbar, braucht gezielte Führung',
    scoreText: 'mittel',
    text1: `Die Stelle verlangt ${cn(rDom.top)} und ${cn(rDom.second)} gleichermaßen. Die Person arbeitet in dieselbe Richtung, muss aber in einzelnen Bereichen noch gezielt dazulernen. Mit klaren Zielen und regelmäßigem Feedback ist das gut machbar.`,
    text2: buildSummary(input).finalText,
  };
}

function buildIntegrationPlan(input: MatchTextInput): IntegrationPhase[] {
  const sp = getSpecialCases(input.roleProfile, input.candProfile);
  const isNichtGeeignet = input.fitLabel === 'Nicht geeignet';
  const isPerfect = input.fitSubtype === 'PERFECT';
  const candBal = sp.candIsBalFull;
  const candDual = sp.candIsDualDom;

  if (_lang === 'fr') {
    const personDesc = candBal
      ? 'La personne n\'a pas de priorité clairement définie et travaille de façon polyvalente.'
      : candDual
        ? 'La personne a deux priorités de travail presque aussi fortes et passe situativement de l\'une à l\'autre.'
        : 'La personne a une priorité de travail clairement reconnaissable.';
    const focusTitle = 'Ce qui compte';

    if (isPerfect) {
      return [
        {
          phase: 1,
          title: 'Orientation',
          timeframe: 'Jours 1–10',
          goal: `Comprendre les exigences du poste ${input.roleName} et aligner les attentes.`,
          items: [
            `Clarifier les circuits décisionnels et les domaines de responsabilité dans le poste ${input.roleName}.`,
            'Aligner les priorités de travail les plus importantes avec l\'environnement direct.',
            'Assurer la transparence sur les processus, procédures et standards de qualité existants.',
          ],
          focusTitle,
          focusText: 'Le mode de travail est adapté au poste. L\'essentiel est d\'établir rapidement la clarté sur :',
          focusBullets: ['les processus et interfaces existants', 'les circuits décisionnels et domaines de responsabilité', 'les standards de qualité et les attentes'],
        },
        {
          phase: 2,
          title: 'Impact',
          timeframe: 'Jours 11–20',
          goal: `Prendre en charge les premières responsabilités opérationnelles en tant que ${input.roleName} et produire un impact.`,
          items: ['Traitement autonome des premiers lots de travail avec contrôle des résultats.', 'Rechercher activement un retour sur l\'impact concernant le rythme, la qualité et la collaboration.', 'Établir le travail d\'interface avec les domaines adjacents.'],
          focusTitle,
          focusText: 'La personne travaille déjà selon la bonne approche de base. Il s\'agit maintenant de :',
          focusBullets: [`rendre visible l'efficacité dans le poste ${input.roleName}`, 'livrer les premiers résultats de travail de façon autonome', 'développer des routines fiables'],
        },
        {
          phase: 3,
          title: 'Stabilisation',
          timeframe: 'Jours 21–30',
          goal: `Stabiliser le mode de travail et le rythme dans le poste ${input.roleName}.`,
          items: ['Évaluation de l\'impact sur le rythme décisionnel et la charge de travail.', 'Ajustement fin de la collaboration avec l\'environnement direct.', 'Consolider les priorités et stabiliser les standards.'],
          focusTitle,
          focusText: 'Le mode de travail est stable. Il s\'agit maintenant de :',
          focusBullets: ['maintenir les points forts et consolider les routines', `assurer la stabilité à long terme dans le poste ${input.roleName}`],
        },
      ];
    }

    if (isNichtGeeignet) {
      return [
        {
          phase: 1,
          title: 'Orientation',
          timeframe: 'Jours 1–10',
          goal: `Clarifier les attentes du poste ${input.roleName} et identifier les écarts rapidement.`,
          items: [
            `Clarifier les attentes centrales et les critères de succès du poste ${input.roleName}.`,
            'Assurer la transparence sur les processus de travail, circuits décisionnels et standards de qualité existants.',
            'Discussion ouverte sur les différences perceptibles entre les exigences du poste et le mode de travail.',
            'Définir des critères d\'observation concrets pour les premières semaines.',
          ],
          focusTitle,
          focusText: `${personDesc} Le poste requiert une pondération différente. Durant les premiers jours, il doit être clair :`,
          focusBullets: ['où précisément le mode de travail s\'écarte des attentes du poste', 'quelles attentes ne sont pas négociables', 'quel accompagnement et pilotage sont nécessaires'],
        },
        {
          phase: 2,
          title: 'Impact',
          timeframe: 'Jours 11–20',
          goal: `Livrer les premiers résultats de travail en tant que ${input.roleName} et gérer délibérément les écarts.`,
          items: ['Confier des tâches ciblées avec des critères de résultats clairs.', 'Rechercher régulièrement un retour sur l\'impact concernant la qualité, le rythme et la collaboration.', 'Discuter ouvertement des écarts entre le mode de travail et les attentes du poste.', 'Convenir et documenter des mesures de développement concrètes.'],
          focusTitle,
          focusText: 'Les différences entre le mode de travail et les exigences du poste deviennent visibles dans la pratique. Le manager devrait :',
          focusBullets: ['accompagner et piloter de près', 'définir des priorités claires et fournir un retour régulier', 'évaluer honnêtement si l\'adaptation est réaliste'],
        },
        {
          phase: 3,
          title: 'Stabilisation',
          timeframe: 'Jours 21–30',
          goal: `Évaluer honnêtement la viabilité de la prise de poste en tant que ${input.roleName}.`,
          items: ['Évaluation : les écarts identifiés ont-ils diminué ou se sont-ils consolidés ?', 'Recueillir les retours de l\'environnement direct sur l\'impact dans la pratique.', 'Prendre une décision : poursuivre avec un accompagnement intensif ou examiner des alternatives.', 'Ne fixer des objectifs de développement à long terme que si la direction générale est juste.'],
          focusTitle,
          focusText: 'La question centrale après 30 jours est : l\'écart entre le mode de travail et les exigences du poste est-il comblable ? Le manager évalue :',
          focusBullets: ['si le mode de travail évolue sensiblement vers les exigences du poste', 'si l\'effort de management est viable à long terme', 'si la prise de poste peut être maintenue de façon stable à long terme'],
        },
      ];
    }

    return [
      {
        phase: 1,
        title: 'Orientation',
        timeframe: 'Jours 1–10',
        goal: `Comprendre les attentes et exigences du poste ${input.roleName} et identifier les différences.`,
        items: [
          `Clarifier le poste, les attentes et les critères de succès dans ${input.roleName}.`,
          'Assurer la transparence sur les processus, circuits décisionnels et standards de qualité existants.',
          'Aligner rapidement les priorités et les attentes mutuelles.',
          'Clarifier les processus opérationnels et les interfaces.',
        ],
        focusTitle,
        focusText: `${personDesc} Le poste définit des priorités différentes. À clarifier :`,
        focusBullets: ['quel mode de travail le poste exige concrètement', 'en quoi les habitudes de la personne en diffèrent', 'quelles adaptations peuvent être raisonnablement attendues'],
      },
      {
        phase: 2,
        title: 'Impact',
        timeframe: 'Jours 11–20',
        goal: `Livrer les premiers résultats de travail en tant que ${input.roleName} et gérer délibérément le besoin d'adaptation.`,
        items: ['Traiter un sujet concret de façon autonome et contrôler le résultat.', 'Rechercher un retour sur l\'impact concernant la qualité, la collaboration et la fiabilité des résultats.', 'Formuler des attentes claires concernant les priorités et le mode de travail.', 'Proposer activement soutien et accompagnement.'],
        focusTitle,
        focusText: 'Les différences entre le mode de travail et les exigences du poste deviennent visibles dans la pratique. L\'essentiel est de :',
        focusBullets: ['donner un retour ciblé et formuler clairement les attentes', 'observer les progrès et la volonté d\'adaptation', 'assurer une coordination régulière avec le manager'],
      },
      {
        phase: 3,
        title: 'Stabilisation',
        timeframe: 'Jours 21–30',
        goal: `Aligner durablement le mode de travail et les attentes dans le poste ${input.roleName}.`,
        items: ['Évaluation de l\'impact sur le rythme décisionnel, la priorisation et la collaboration.', 'Ajustement des attentes, interfaces et standards de travail.', 'Définir des objectifs de développement à long terme et un rythme de retour.'],
        focusTitle,
        focusText: 'Le mode de travail évolue dans la bonne direction. Le manager évalue :',
        focusBullets: ['si l\'effort de management reste viable à long terme', 'si l\'adaptation est durable', 'si la prise de poste peut être maintenue de façon stable à long terme'],
      },
    ];
  }

  if (_lang === 'en') {
    const personDesc = candBal
      ? 'The person shows no clear focus and works across a broad range.'
      : candDual
        ? 'The person has two almost equally strong work priorities and shifts situationally between them.'
        : 'The person has one clearly recognisable work priority.';

    const focusTitle = 'What matters';

    if (isPerfect) {
      return [
        {
          phase: 1,
          title: 'Orientation',
          timeframe: 'Days 1\u201310',
          goal: `Understand the requirements of the ${input.roleName} role and align expectations.`,
          items: [
            `Clarify decision paths and areas of responsibility in the ${input.roleName} role.`,
            'Align the most important work priorities with the immediate environment.',
            'Create transparency on existing processes, workflows, and quality standards.',
          ],
          focusTitle,
          focusText: 'Working style fits the role. What is important is quickly establishing clarity on:',
          focusBullets: ['existing processes and interfaces', 'decision paths and areas of responsibility', 'quality standards and expectations'],
        },
        {
          phase: 2,
          title: 'Impact',
          timeframe: 'Days 11\u201320',
          goal: `Take on first operational responsibility as ${input.roleName} and demonstrate impact.`,
          items: ['Independent handling of initial work packages with outcome review.', 'Actively seek feedback on impact regarding pace, quality, and collaboration.', 'Establish interface work with adjacent areas.'],
          focusTitle,
          focusText: 'The person already operates using the right basic approach. Now the focus is on:',
          focusBullets: [`Making effectiveness visible in the ${input.roleName} role`, 'delivering first work results independently', 'developing reliable routines'],
        },
        {
          phase: 3,
          title: 'Stabilisation',
          timeframe: 'Days 21\u201330',
          goal: `Stabilise working style and work rhythm in the ${input.roleName} role.`,
          items: ['Evaluate impact so far on decision rhythm and workload.', 'Fine-tune collaboration with the immediate environment.', 'Consolidate priorities and stabilise standards.'],
          focusTitle,
          focusText: 'Working style is stable. Now it is about:',
          focusBullets: ['Maintaining strengths and consolidating routines', `securing long-term stability in the ${input.roleName} role`],
        },
      ];
    }

    if (isNichtGeeignet) {
      return [
        {
          phase: 1,
          title: 'Orientation',
          timeframe: 'Days 1\u201310',
          goal: `Clarify expectations for the ${input.roleName} role and identify deviations early.`,
          items: [
            `Clarify the central expectations and success criteria of the ${input.roleName} role.`,
            'Create transparency on existing workflows, decision paths, and quality standards.',
            'Open discussion about the recognisable differences between role requirements and working style.',
            'Define specific observation criteria for the first weeks.',
          ],
          focusTitle,
          focusText: `${personDesc} The role requires a different weighting. In the first days it must become clear:`,
          focusBullets: ['exactly where working style deviates from role expectations', 'which expectations are non-negotiable', 'what guidance and steering is required'],
        },
        {
          phase: 2,
          title: 'Impact',
          timeframe: 'Days 11\u201320',
          goal: `Deliver first work results as ${input.roleName} and steer deviations deliberately.`,
          items: ['Assign targeted tasks with clear outcome criteria.', 'Regularly seek feedback on impact regarding quality, pace, and collaboration.', 'Openly discuss deviations between working style and role expectation.', 'Agree and document concrete development measures.'],
          focusTitle,
          focusText: 'The differences between working style and role requirement are now becoming visible in practice. The manager should:',
          focusBullets: ['accompany and steer closely', 'set clear priorities and provide regular feedback', 'honestly assess whether adaptation is realistic'],
        },
        {
          phase: 3,
          title: 'Stabilisation',
          timeframe: 'Days 21\u201330',
          goal: `Honestly evaluate the viability of the ${input.roleName} placement.`,
          items: ['Evaluation: Have the identified deviations reduced or become entrenched?', 'Collect feedback from the immediate environment on practical impact.', 'Make a decision: continue with intensive guidance or examine alternatives.', 'Only set long-term development goals if the basic direction is right.'],
          focusTitle,
          focusText: 'The central question after 30 days is: Is the gap between working style and role requirement bridgeable? The manager should assess:',
          focusBullets: ['whether working style is developing noticeably towards the role requirement', 'whether management effort is sustainable long-term', 'whether the placement can be maintained stably long-term'],
        },
      ];
    }

    return [
      {
        phase: 1,
        title: 'Orientation',
        timeframe: 'Days 1\u201310',
        goal: `Understand the expectations and requirements of the ${input.roleName} role and identify differences.`,
        items: [
          `Clarify role, expectations, and success criteria in ${input.roleName}.`,
          'Create transparency on existing processes, decision paths, and quality standards.',
          'Early alignment of priorities and mutual expectations.',
          'Clarify operational processes and interfaces.',
        ],
        focusTitle,
        focusText: `${personDesc} The role sets different priorities. To clarify:`,
        focusBullets: ['what working style the role specifically requires', "where the person's habits differ from that", 'what adaptations can realistically be expected'],
      },
      {
        phase: 2,
        title: 'Impact',
        timeframe: 'Days 11\u201320',
        goal: `Deliver first work results as ${input.roleName} and steer adaptation needs deliberately.`,
        items: ['Handle one concrete topic independently and review the outcome.', 'Seek feedback on impact regarding quality, collaboration, and outcome accuracy.', 'Formulate clear expectations on priorities and working style.', 'Actively offer support and guidance.'],
        focusTitle,
        focusText: 'The differences between working style and role requirement are now becoming visible in practice. What is important:',
        focusBullets: ['provide targeted feedback and clearly state expectations', 'observe progress and willingness to adapt', 'ensure regular coordination with the manager'],
      },
      {
        phase: 3,
        title: 'Stabilisation',
        timeframe: 'Days 21\u201330',
        goal: `Align working style and expectations in the ${input.roleName} role sustainably.`,
        items: ['Evaluate impact on decision rhythm, prioritisation, and collaboration.', 'Adapt expectations, interfaces, and work standards.', 'Set long-term development goals and feedback rhythm.'],
        focusTitle,
        focusText: 'Working style is developing in the right direction. The manager should assess:',
        focusBullets: ['whether management effort remains sustainable long-term', 'whether adaptation is lasting', 'whether the role can be stably filled long-term'],
      },
    ];
  }

  const personBeschreibung = candBal
    ? 'Die Person zeigt keine klare Schwerpunktsetzung und arbeitet breit aufgestellt.'
    : candDual
      ? 'Die Person hat zwei fast gleich starke Arbeitsschwerpunkte und wechselt situativ zwischen ihnen.'
      : 'Die Person hat einen klar erkennbaren Arbeitsschwerpunkt.';

  if (isPerfect) {
    return [
      {
        phase: 1,
        title: 'Orientierung',
        timeframe: 'Tag 1\u201310',
        goal: `Stellenanforderungen der Position ${input.roleName} verstehen und Erwartungen abstimmen.`,
        items: [
          `Klärung der Entscheidungswege und Verantwortungsbereiche in der Stelle ${input.roleName}.`,
          'Abstimmung der wichtigsten Arbeitsprioritäten mit dem direkten Umfeld.',
          'Transparenz über bestehende Abläufe, Prozesse und Qualitätsstandards.',
        ],
        focusTitle: 'Worauf es ankommt',
        focusText: 'Die Arbeitsweise passt zur Stelle. Wichtig ist, schnell Klarheit zu schaffen über:',
        focusBullets: ['bestehende Abläufe und Schnittstellen', 'Entscheidungswege und Verantwortungsbereiche', 'Qualitätsstandards und Erwartungshaltung'],
      },
      {
        phase: 2,
        title: 'Wirkung',
        timeframe: 'Tag 11\u201320',
        goal: `Erste operative Verantwortung als ${input.roleName} übernehmen und Wirkung zeigen.`,
        items: ['Eigenständige Übernahme erster Arbeitspakete mit Ergebnisprüfung.', 'Feedback zur Wirkung auf Tempo, Qualität und Zusammenarbeit aktiv einholen.', 'Schnittstellenarbeit mit angrenzenden Bereichen etablieren.'],
        focusTitle: 'Worauf es ankommt',
        focusText: 'Die Person arbeitet bereits nach dem passenden Grundansatz. Jetzt geht es darum:',
        focusBullets: [`Wirksamkeit in ${input.roleName} sichtbar zu machen`, 'erste Arbeitsergebnisse eigenständig zu liefern', 'belastbare Routinen zu entwickeln'],
      },
      {
        phase: 3,
        title: 'Stabilisierung',
        timeframe: 'Tag 21\u201330',
        goal: `Arbeitsweise und Arbeitsrhythmus als ${input.roleName} stabilisieren.`,
        items: ['Evaluation der bisherigen Wirkung auf Entscheidungsrhythmus und Belastung.', 'Feinabstimmung der Zusammenarbeit mit dem direkten Umfeld.', 'Prioritäten konsolidieren und Standards stabilisieren.'],
        focusTitle: 'Worauf es ankommt',
        focusText: 'Die Arbeitsweise ist stabil. Jetzt gilt es:',
        focusBullets: ['Stärken beibehalten und Routinen festigen', `langfristige Stabilität in ${input.roleName} sichern`],
      },
    ];
  }

  if (isNichtGeeignet) {
    return [
      {
        phase: 1,
        title: 'Orientierung',
        timeframe: 'Tag 1\u201310',
        goal: `Erwartungen der Stelle ${input.roleName} klären und Abweichungen frühzeitig identifizieren.`,
        items: [
          `Klärung der zentralen Erwartungen und Erfolgskriterien in der Stelle ${input.roleName}.`,
          'Transparenz über bestehende Arbeitsabläufe, Entscheidungswege und Qualitätsstandards.',
          'Offenes Gespräch über die erkennbaren Unterschiede zwischen Stellenanforderung und Arbeitsweise.',
          'Festlegung konkreter Beobachtungskriterien für die ersten Wochen.',
        ],
        focusTitle: 'Worauf es ankommt',
        focusText: `${personBeschreibung} Die Stelle verlangt eine andere Gewichtung. In den ersten Tagen muss klar werden:`,
        focusBullets: ['wo genau die Arbeitsweise von der Stellenerwartung abweicht', 'welche Erwartungen nicht verhandelbar sind', 'welche Begleitung und Steuerung notwendig ist'],
      },
      {
        phase: 2,
        title: 'Wirkung',
        timeframe: 'Tag 11\u201320',
        goal: `Erste Arbeitsergebnisse als ${input.roleName} liefern und Abweichungen gezielt steuern.`,
        items: ['Gezielte Aufgabenstellung mit klaren Ergebniskriterien vergeben.', 'Regelmäßiges Feedback zur Wirkung auf Qualität, Tempo und Zusammenarbeit einholen.', 'Abweichungen zwischen Arbeitsweise und Stellenerwartung offen besprechen.', 'Konkrete Entwicklungsmaßnahmen vereinbaren und dokumentieren.'],
        focusTitle: 'Worauf es ankommt',
        focusText: 'Die Unterschiede zwischen Arbeitsweise und Stellenanforderung werden jetzt im Alltag sichtbar. Die Führungskraft sollte:',
        focusBullets: ['engmaschig begleiten und steuern', 'klare Prioritäten setzen und regelmäßig spiegeln', 'ehrlich prüfen, ob die Anpassung realistisch ist'],
      },
      {
        phase: 3,
        title: 'Stabilisierung',
        timeframe: 'Tag 21\u201330',
        goal: `Tragfähigkeit der Besetzung als ${input.roleName} ehrlich bewerten.`,
        items: ['Evaluation: Haben sich die erkannten Abweichungen verringert oder verfestigt?', 'Rückmeldung aus dem direkten Umfeld zur Wirkung im Alltag einholen.', 'Entscheidung treffen: Fortführung mit intensiver Begleitung oder Alternativen prüfen.', 'Langfristige Entwicklungsziele nur festlegen, wenn die Grundrichtung stimmt.'],
        focusTitle: 'Worauf es ankommt',
        focusText: 'Die zentrale Frage nach 30 Tagen lautet: Ist die Lücke zwischen Arbeitsweise und Stellenanforderung überbrückbar? Die Führungskraft prüft:',
        focusBullets: ['ob sich die Arbeitsweise erkennbar in Richtung Stellenanforderung entwickelt', 'ob der Führungsaufwand auf Dauer tragbar ist', 'ob die Besetzung langfristig stabil gehalten werden kann'],
      },
    ];
  }

  return [
    {
      phase: 1,
      title: 'Orientierung',
      timeframe: 'Tag 1\u201310',
      goal: `Erwartungen und Anforderungen der Stelle ${input.roleName} verstehen und Unterschiede erkennen.`,
      items: [`Klärung von Stelle, Erwartungshaltung und Erfolgskriterien in ${input.roleName}.`, 'Transparenz über bestehende Abläufe, Entscheidungswege und Qualitätsstandards.', 'Frühe Abstimmung von Prioritäten und gegenseitigen Erwartungen.', 'Klärung operativer Prozesse und Schnittstellen.'],
      focusTitle: 'Worauf es ankommt',
      focusText: `${personBeschreibung} Die Stelle setzt andere Schwerpunkte. Zu klären ist:`,
      focusBullets: ['welche Arbeitsweise die Stelle konkret verlangt', 'wo sich die Gewohnheiten der Person davon unterscheiden', 'welche Anpassungen realistisch erwartet werden können'],
    },
    {
      phase: 2,
      title: 'Wirkung',
      timeframe: 'Tag 11\u201320',
      goal: `Erste Arbeitsergebnisse als ${input.roleName} liefern und Anpassungsbedarf gezielt steuern.`,
      items: ['Ein konkretes Thema eigenverantwortlich bearbeiten und Ergebnis prüfen.', 'Feedback zur Wirkung auf Qualität, Zusammenarbeit und Ergebnistreue einholen.', 'Klare Erwartungen an Prioritäten und Arbeitsweise formulieren.', 'Unterstützung und Begleitung aktiv anbieten.'],
      focusTitle: 'Worauf es ankommt',
      focusText: 'Die Unterschiede zwischen Arbeitsweise und Stellenanforderung werden jetzt im Alltag sichtbar. Wichtig ist:',
      focusBullets: ['gezielt Feedback geben und Erwartungen klar benennen', 'Fortschritte und Anpassungsbereitschaft beobachten', 'regelmäßige Abstimmung mit der Führungskraft sicherstellen'],
    },
    {
      phase: 3,
      title: 'Stabilisierung',
      timeframe: 'Tag 21\u201330',
      goal: `Arbeitsweise und Erwartungen als ${input.roleName} dauerhaft abstimmen.`,
      items: ['Evaluation der Wirkung auf Entscheidungsrhythmus, Priorisierung und Zusammenarbeit.', 'Anpassung von Erwartungen, Schnittstellen und Arbeitsstandards.', 'Langfristige Entwicklungsziele und Feedbackrhythmus festlegen.'],
      focusTitle: 'Worauf es ankommt',
      focusText: 'Die Arbeitsweise entwickelt sich in die richtige Richtung. Die Führungskraft prüft:',
      focusBullets: ['ob der Führungsaufwand langfristig tragbar bleibt', 'ob die Anpassung nachhaltig ist', 'ob die Stelle dauerhaft stabil besetzt werden kann'],
    },
  ];
}

export function buildMatchTexts(input: MatchTextInput): MatchTextResult {
  _lang = input.lang ?? 'de';
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
