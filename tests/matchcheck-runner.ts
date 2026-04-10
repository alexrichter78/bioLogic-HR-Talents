import { computeCoreFit, normalizeTriad, dominanceModeOf } from '../client/src/lib/jobcheck-engine';

type P = { I: number; N: number; A: number };
type Triad = { impulsiv: number; intuitiv: number; analytisch: number };

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function toTriad(p: P): Triad {
  return { impulsiv: p.I, intuitiv: p.N, analytisch: p.A };
}

function profileStr(p: P): string {
  return `I=${p.I} N=${p.N} A=${p.A}`;
}

function pad(s: string, len: number): string {
  return s.length >= len ? s : s + ' '.repeat(len - s.length);
}

function extractVariantCode(reasons: { rule: string }[], prefix: string): string {
  const entry = reasons.find(r => r.rule.startsWith(prefix));
  return entry ? entry.rule.replace(prefix + ' ', '') : '?';
}

function evaluateMatch(soll: P, ist: P) {
  const r = computeCoreFit(toTriad(soll), toTriad(ist));

  const sollVariant = extractVariantCode(r.reasons, 'Soll-Variante:');
  const istVariant = extractVariantCode(r.reasons, 'Ist-Variante:');

  const fitMap: Record<string, string> = {
    SUITABLE: 'geeignet',
    CONDITIONAL: 'bedingt geeignet',
    NOT_SUITABLE: 'nicht geeignet',
  };

  return {
    fitLabel: fitMap[r.overallFit] || r.overallFit,
    sollVariant,
    istVariant,
    structureRelation: { type: r.flags.structureRelation },
    diffs: {
      I: Math.abs(soll.I - ist.I),
      N: Math.abs(soll.N - ist.N),
      A: Math.abs(soll.A - ist.A),
    },
    maxDiff: r.flags.maxGapVal,
    controlIntensity: {
      points: r.controlPoints,
      level: r.controlIntensity === 'LOW' ? 'gering' : r.controlIntensity === 'MEDIUM' ? 'mittel' : 'hoch',
    },
  };
}

const variantProfiles: Record<string, P> = {
  ALL_EQUAL:        { I: 34, N: 33, A: 33 },
  TOP_PAIR_IN_A:    { I: 40, N: 40, A: 20 },
  TOP_PAIR_IA_N:    { I: 40, N: 20, A: 40 },
  TOP_PAIR_NA_I:    { I: 20, N: 40, A: 40 },
  BOTTOM_PAIR_I_NA: { I: 50, N: 25, A: 25 },
  BOTTOM_PAIR_N_IA: { I: 25, N: 50, A: 25 },
  BOTTOM_PAIR_A_IN: { I: 25, N: 25, A: 50 },
  ORDER_INA:        { I: 50, N: 30, A: 20 },
  ORDER_IAN:        { I: 50, N: 20, A: 30 },
  ORDER_NIA:        { I: 30, N: 50, A: 20 },
  ORDER_NAI:        { I: 20, N: 50, A: 30 },
  ORDER_AIN:        { I: 30, N: 20, A: 50 },
  ORDER_ANI:        { I: 20, N: 30, A: 50 },
};

const expectedVariantCodes: Record<string, string> = {
  ALL_EQUAL:        'ALL_EQUAL',
  TOP_PAIR_IN_A:    'TOP_PAIR_impulsivintuitiv_analytisch',
  TOP_PAIR_IA_N:    'TOP_PAIR_analytischimpulsiv_intuitiv',
  TOP_PAIR_NA_I:    'TOP_PAIR_analytischintuitiv_impulsiv',
  BOTTOM_PAIR_I_NA: 'BOTTOM_PAIR_impulsiv_analytischintuitiv',
  BOTTOM_PAIR_N_IA: 'BOTTOM_PAIR_intuitiv_analytischimpulsiv',
  BOTTOM_PAIR_A_IN: 'BOTTOM_PAIR_analytisch_impulsivintuitiv',
  ORDER_INA:        'ORDER_impulsivintuitivanalytisch',
  ORDER_IAN:        'ORDER_impulsivanalytischintuitiv',
  ORDER_NIA:        'ORDER_intuitivimpulsivanalytisch',
  ORDER_NAI:        'ORDER_intuitivanalytischimpulsiv',
  ORDER_AIN:        'ORDER_analytischimpulsivintuitiv',
  ORDER_ANI:        'ORDER_analytischintuitivimpulsiv',
};

function runVariantRecognitionTest(): number {
  console.log(`\n${BOLD}${CYAN}=== 1) VARIANTEN-ERKENNUNG ===${RESET}`);
  let failures = 0;

  for (const [label, profile] of Object.entries(variantProfiles)) {
    const result = evaluateMatch(profile, profile);
    const expected = expectedVariantCodes[label];
    const ok = result.sollVariant === expected && result.istVariant === expected;

    if (ok) {
      console.log(`  ${GREEN}✅${RESET} ${pad(label, 18)} → ${DIM}${result.sollVariant}${RESET}`);
    } else {
      failures++;
      console.log(`  ${RED}❌${RESET} ${pad(label, 18)}`);
      if (result.sollVariant !== expected)
        console.log(`     ${RED}Fehler: Soll-Variante erkannt als "${result.sollVariant}", erwartet "${expected}"${RESET}`);
      if (result.istVariant !== expected)
        console.log(`     ${RED}Fehler: Ist-Variante erkannt als "${result.istVariant}", erwartet "${expected}"${RESET}`);
    }
  }

  console.log(failures === 0
    ? `  ${GREEN}${BOLD}Alle 13 Varianten korrekt erkannt${RESET}`
    : `  ${RED}${BOLD}${failures} Erkennungsfehler${RESET}`);
  return failures;
}

function runSelfMatchTest(): number {
  console.log(`\n${BOLD}${CYAN}=== 2) SELBSTMATCH-TEST (13x13 Diagonale) ===${RESET}`);
  let failures = 0;

  for (const [label, profile] of Object.entries(variantProfiles)) {
    const result = evaluateMatch(profile, profile);
    if (result.fitLabel !== 'geeignet') {
      failures++;
      console.log(`  ${RED}❌${RESET} ${pad(label, 18)} Selbstmatch = ${RED}${result.fitLabel}${RESET} (erwartet: geeignet)`);
      console.log(`     ${RED}Fehler: Identisches Profil wird nicht als geeignet erkannt${RESET}`);
    }
  }

  if (failures === 0) console.log(`  ${GREEN}${BOLD}Alle 13 Selbstmatches = geeignet${RESET}`);
  return failures;
}

function runCrossVariantTest(): number {
  console.log(`\n${BOLD}${CYAN}=== 3) KREUZTEST: Strukturkonflikte ===${RESET}`);
  let failures = 0;

  const crossTests = [
    { s: 'ALL_EQUAL', i: 'ORDER_INA', expect: 'nicht geeignet', reason: 'ALL_EQUAL vs ORDER = HARD_CONFLICT' },
    { s: 'ALL_EQUAL', i: 'BOTTOM_PAIR_I_NA', expect: 'nicht geeignet', reason: 'ALL_EQUAL vs BOTTOM_PAIR = HARD_CONFLICT' },
    { s: 'TOP_PAIR_IN_A', i: 'BOTTOM_PAIR_A_IN', expect: 'nicht geeignet', reason: 'TOP_PAIR vs BOTTOM_PAIR = HARD_CONFLICT' },
    { s: 'ORDER_INA', i: 'ORDER_IAN', expect: 'nicht geeignet', reason: 'Sekundärflip N↔A = HARD_CONFLICT' },
    { s: 'TOP_PAIR_IN_A', i: 'ORDER_NIA', expect: 'bedingt geeignet', reason: 'TOP_PAIR→ORDER (1 Relation ändert) = SOFT_CONFLICT' },
  ];

  for (const t of crossTests) {
    const result = evaluateMatch(variantProfiles[t.s], variantProfiles[t.i]);
    const ok = result.fitLabel === t.expect;

    if (ok) {
      console.log(`  ${GREEN}✅${RESET} ${pad(t.s, 18)} vs ${pad(t.i, 18)} → ${result.fitLabel} ${DIM}(${t.reason})${RESET}`);
    } else {
      failures++;
      console.log(`  ${RED}❌${RESET} ${pad(t.s, 18)} vs ${pad(t.i, 18)} → ${RED}${result.fitLabel}${RESET}`);
      console.log(`     ${RED}Fehler: Erwartet "${t.expect}" wegen ${t.reason}${RESET}`);
      console.log(`     ${RED}StructureRelation: ${result.structureRelation.type}, maxDiff: ${result.maxDiff}${RESET}`);
    }
  }

  if (failures === 0) console.log(`  ${GREEN}${BOLD}Alle Kreuztests korrekt${RESET}`);
  return failures;
}

function runBoundaryTests(): number {
  console.log(`\n${BOLD}${CYAN}=== 4) GRENZFALL-TESTS ===${RESET}`);
  let failures = 0;

  const tests = [
    {
      name: 'BOTTOM_PAIR A-dominant: kleine Abweichung → geeignet',
      soll: { I: 27, N: 26, A: 47 },
      ist:  { I: 29, N: 28, A: 43 },
      expectedFit: 'geeignet',
      expectedSoll: 'BOTTOM_PAIR_analytisch_impulsivintuitiv',
      expectedIst: 'BOTTOM_PAIR_analytisch_impulsivintuitiv',
    },
    {
      name: 'TOP_PAIR IN: A weicht 7 ab → bedingt geeignet',
      soll: { I: 38, N: 41, A: 22 },
      ist:  { I: 35, N: 36, A: 29 },
      expectedFit: 'bedingt geeignet',
      expectedSoll: 'TOP_PAIR_impulsivintuitiv_analytisch',
      expectedIst: 'TOP_PAIR_impulsivintuitiv_analytisch',
    },
    {
      name: 'ORDER INA: minimale Schwankung → geeignet',
      soll: { I: 42, N: 35, A: 23 },
      ist:  { I: 44, N: 34, A: 22 },
      expectedFit: 'geeignet',
      expectedSoll: 'ORDER_impulsivintuitivanalytisch',
      expectedIst: 'ORDER_impulsivintuitivanalytisch',
    },
    {
      name: 'Sekundärflip N↔A bei gleichem Top → HARD',
      soll: { I: 50, N: 30, A: 20 },
      ist:  { I: 50, N: 20, A: 30 },
      expectedFit: 'nicht geeignet',
      expectedSoll: 'ORDER_impulsivintuitivanalytisch',
      expectedIst: 'ORDER_impulsivanalytischintuitiv',
    },
    {
      name: 'ALL_EQUAL vs klares ORDER → nicht geeignet',
      soll: { I: 34, N: 33, A: 33 },
      ist:  { I: 50, N: 30, A: 20 },
      expectedFit: 'nicht geeignet',
      expectedSoll: 'ALL_EQUAL',
      expectedIst: 'ORDER_impulsivintuitivanalytisch',
    },
    {
      name: 'ALL_EQUAL vs BOTTOM_PAIR → nicht geeignet',
      soll: { I: 35, N: 33, A: 32 },
      ist:  { I: 41, N: 30, A: 29 },
      expectedFit: 'nicht geeignet',
      expectedSoll: 'ALL_EQUAL',
      expectedIst: 'BOTTOM_PAIR_impulsiv_analytischintuitiv',
    },
    {
      name: 'TOP_PAIR vs ORDER (Soft-Conflict) → bedingt geeignet',
      soll: { I: 40, N: 40, A: 20 },
      ist:  { I: 34, N: 40, A: 26 },
      expectedFit: 'bedingt geeignet',
      expectedSoll: 'TOP_PAIR_impulsivintuitiv_analytisch',
      expectedIst: 'ORDER_intuitivimpulsivanalytisch',
    },
  ];

  for (const t of tests) {
    const result = evaluateMatch(t.soll, t.ist);
    const fitOk = result.fitLabel === t.expectedFit;
    const sollOk = result.sollVariant === t.expectedSoll;
    const istOk = result.istVariant === t.expectedIst;
    const allOk = fitOk && sollOk && istOk;

    if (allOk) {
      console.log(`  ${GREEN}✅${RESET} ${t.name}`);
      console.log(`     ${DIM}Soll: ${profileStr(t.soll)} → ${result.sollVariant}${RESET}`);
      console.log(`     ${DIM}Ist:  ${profileStr(t.ist)} → ${result.istVariant}${RESET}`);
      console.log(`     ${DIM}Fit: ${result.fitLabel} | ${result.structureRelation.type} | maxDiff=${result.maxDiff}${RESET}`);
    } else {
      failures++;
      console.log(`  ${RED}❌${RESET} ${t.name}`);
      console.log(`     Soll: ${profileStr(t.soll)} → ${result.sollVariant}`);
      console.log(`     Ist:  ${profileStr(t.ist)} → ${result.istVariant}`);
      console.log(`     Fit: ${result.fitLabel} | ${result.structureRelation.type} | maxDiff=${result.maxDiff}`);
      if (!fitOk)
        console.log(`     ${RED}Fehler: FitLabel ist "${result.fitLabel}", erwartet "${t.expectedFit}"${RESET}`);
      if (!sollOk)
        console.log(`     ${RED}Fehler: Soll-Variante "${result.sollVariant}" statt "${t.expectedSoll}"${RESET}`);
      if (!istOk)
        console.log(`     ${RED}Fehler: Ist-Variante "${result.istVariant}" statt "${t.expectedIst}"${RESET}`);
    }
  }

  if (failures === 0) console.log(`  ${GREEN}${BOLD}Alle Grenzfälle korrekt${RESET}`);
  return failures;
}

function runRobustnessTests(): number {
  console.log(`\n${BOLD}${CYAN}=== 5) ROBUSTHEITS-TESTS ===${RESET}`);
  let failures = 0;

  const blocks = [
    { label: 'ALL_EQUAL', base: { I: 34, N: 33, A: 33 }, muts: [{ I: 35, N: 32, A: 33 }, { I: 36, N: 31, A: 33 }] },
    { label: 'TOP_PAIR_IN_A', base: { I: 40, N: 40, A: 20 }, muts: [{ I: 41, N: 39, A: 20 }, { I: 42, N: 40, A: 18 }] },
    { label: 'BOTTOM_PAIR_A_IN', base: { I: 25, N: 25, A: 50 }, muts: [{ I: 27, N: 23, A: 50 }, { I: 29, N: 24, A: 47 }] },
    { label: 'ORDER_INA', base: { I: 50, N: 30, A: 20 }, muts: [{ I: 49, N: 31, A: 20 }, { I: 47, N: 32, A: 21 }] },
  ];

  for (const b of blocks) {
    for (const m of b.muts) {
      const result = evaluateMatch(b.base, m);
      const bad = result.fitLabel === 'nicht geeignet';

      if (bad) {
        failures++;
        console.log(`  ${RED}❌${RESET} ${pad(b.label, 18)} base=${profileStr(b.base)} mut=${profileStr(m)}`);
        console.log(`     ${RED}Fehler: Kleine Variation wird als "nicht geeignet" erkannt (${result.structureRelation.type}, maxDiff=${result.maxDiff})${RESET}`);
      } else {
        console.log(`  ${GREEN}✅${RESET} ${pad(b.label, 18)} ${DIM}mut=${profileStr(m)} → ${result.fitLabel} (${result.structureRelation.type})${RESET}`);
      }
    }
  }

  if (failures === 0) console.log(`  ${GREEN}${BOLD}Alle Variationen bleiben plausibel${RESET}`);
  return failures;
}

console.log(`${BOLD}${'═'.repeat(50)}${RESET}`);
console.log(`${BOLD}${CYAN}  MATCHCHECK TEST-RUNNER – ALLE 13 VARIANTEN${RESET}`);
console.log(`${BOLD}${'═'.repeat(50)}${RESET}`);

const f1 = runVariantRecognitionTest();
const f2 = runSelfMatchTest();
const f3 = runCrossVariantTest();
const f4 = runBoundaryTests();
const f5 = runRobustnessTests();

const total = f1 + f2 + f3 + f4 + f5;

console.log(`\n${BOLD}${'═'.repeat(50)}${RESET}`);
if (total === 0) {
  console.log(`${GREEN}${BOLD}  ✅ ALLE TESTS BESTANDEN${RESET}`);
} else {
  console.log(`${RED}${BOLD}  ❌ ${total} FEHLER GEFUNDEN${RESET}`);
}
console.log(`${BOLD}${'═'.repeat(50)}${RESET}`);

process.exit(total === 0 ? 0 : 1);
