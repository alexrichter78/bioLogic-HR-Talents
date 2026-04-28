import {
  computeCoreFit,
  applyJobcheckBaseline,
  type Triad,
  type FitStatus,
  type CoreFitTolerances,
} from "../client/src/lib/jobcheck-engine";

type Profile = { name: string; raw: Triad };
type Expectation = "SUITABLE" | "CONDITIONAL" | "NOT_SUITABLE";

const ROLES: Profile[] = [
  { name: "Vertriebsleiter (impulsiv-stark)", raw: { impulsiv: 60, intuitiv: 25, analytisch: 15 } },
  { name: "Vertrieb-Hunter (impulsiv klar dom.)", raw: { impulsiv: 55, intuitiv: 28, analytisch: 17 } },
  { name: "HR-Beraterin (intuitiv-stark)", raw: { impulsiv: 22, intuitiv: 55, analytisch: 23 } },
  { name: "Customer Success Mgr. (int-imp gemischt)", raw: { impulsiv: 38, intuitiv: 45, analytisch: 17 } },
  { name: "Controller (analytisch-dom.)", raw: { impulsiv: 15, intuitiv: 25, analytisch: 60 } },
  { name: "Einkäufer (analytisch klar)", raw: { impulsiv: 20, intuitiv: 28, analytisch: 52 } },
  { name: "GF Mittelstand (ausgewogen)", raw: { impulsiv: 35, intuitiv: 35, analytisch: 30 } },
  { name: "Grundschullehrerin (intuitiv hoch)", raw: { impulsiv: 18, intuitiv: 62, analytisch: 20 } },
];

const PERSONS: Profile[] = [
  { name: "Hunter (impulsiv-stark)", raw: { impulsiv: 55, intuitiv: 28, analytisch: 17 } },
  { name: "Macher (impulsiv-mittel)", raw: { impulsiv: 45, intuitiv: 30, analytisch: 25 } },
  { name: "Empath (intuitiv-stark)", raw: { impulsiv: 22, intuitiv: 55, analytisch: 23 } },
  { name: "Beraterin (intuitiv-mittel)", raw: { impulsiv: 28, intuitiv: 45, analytisch: 27 } },
  { name: "Analytiker (analytisch-stark)", raw: { impulsiv: 15, intuitiv: 25, analytisch: 60 } },
  { name: "Stratege (analytisch-mittel)", raw: { impulsiv: 22, intuitiv: 30, analytisch: 48 } },
  { name: "Allrounder (ausgewogen)", raw: { impulsiv: 34, intuitiv: 33, analytisch: 33 } },
  { name: "Doppelpol (imp+ana)", raw: { impulsiv: 42, intuitiv: 18, analytisch: 40 } },
];

function expectedFor(role: Profile, person: Profile): Expectation {
  const r = role.raw;
  const p = person.raw;
  const rDom = topKey(r);
  const pDom = topKey(p);
  const rGap = topGap(r);
  const pGap = topGap(p);

  // Stelle ausgeglichen → fast jeder ist OK
  if (rGap < 8) return pGap < 8 ? "SUITABLE" : "CONDITIONAL";

  // Person ausgeglichen → bedingt für alle ausgeprägten Stellen
  if (pGap < 8) return "CONDITIONAL";

  // Klare Übereinstimmung der dominanten Komponente
  if (rDom === pDom) {
    const intensityDiff = Math.abs(r[rDom] - p[pDom]);
    if (intensityDiff <= 10) return "SUITABLE";
    return "CONDITIONAL";
  }

  // Sekundärkomponente trifft (z.B. Stelle imp-stark, Person imp+ana)
  const rSecond = secondKey(r);
  if (rDom === pSecondKey(p)) return "CONDITIONAL";

  // Klare Gegenpol-Bewegung
  return "NOT_SUITABLE";
}

function topKey(t: Triad): "impulsiv" | "intuitiv" | "analytisch" {
  const arr: Array<["impulsiv" | "intuitiv" | "analytisch", number]> = [
    ["impulsiv", t.impulsiv],
    ["intuitiv", t.intuitiv],
    ["analytisch", t.analytisch],
  ];
  arr.sort((a, b) => b[1] - a[1]);
  return arr[0][0];
}
function secondKey(t: Triad): "impulsiv" | "intuitiv" | "analytisch" {
  const arr: Array<["impulsiv" | "intuitiv" | "analytisch", number]> = [
    ["impulsiv", t.impulsiv],
    ["intuitiv", t.intuitiv],
    ["analytisch", t.analytisch],
  ];
  arr.sort((a, b) => b[1] - a[1]);
  return arr[1][0];
}
function pSecondKey(t: Triad): "impulsiv" | "intuitiv" | "analytisch" {
  return secondKey(t);
}
function topGap(t: Triad) {
  const arr = [t.impulsiv, t.intuitiv, t.analytisch].sort((a, b) => b - a);
  return arr[0] - arr[1];
}

// --- Stauchungsfunktionen ---
type Squeezer = (t: Triad) => Triad;

function identity(t: Triad): Triad {
  return { ...t };
}
function linearMix(mix: number): Squeezer {
  return (t: Triad) => {
    const triad = { imp: t.impulsiv, int: t.intuitiv, ana: t.analytisch };
    const mixed = applyJobcheckBaseline(triad, mix);
    return { impulsiv: mixed.imp, intuitiv: mixed.int, analytisch: mixed.ana };
  };
}
// Soft-Cap: Werte unter 50% bleiben fast unverändert, Werte darüber werden zur Mitte gezogen
function softCap(softness = 0.6): Squeezer {
  return (t: Triad) => {
    const base = 100 / 3;
    const transform = (v: number) => {
      const delta = v - base;
      // logistische Stauchung: bei delta=0 →0, bei delta=±33 →±maxDelta
      const maxDelta = softness * 33;
      const x = delta / 33;
      const compressed = maxDelta * Math.tanh(x * 1.2);
      return base + compressed;
    };
    let i = transform(t.impulsiv);
    let n = transform(t.intuitiv);
    let a = transform(t.analytisch);
    const sum = i + n + a;
    i = (i / sum) * 100;
    n = (n / sum) * 100;
    a = (a / sum) * 100;
    // round to integers, sum to 100
    const ri = Math.round(i);
    const rn = Math.round(n);
    const ra = 100 - ri - rn;
    return { impulsiv: ri, intuitiv: rn, analytisch: ra };
  };
}

// --- Varianten ---
type Variant = {
  id: string;
  description: string;
  squeezeRole: Squeezer;
  squeezePerson: Squeezer;
  tol: CoreFitTolerances;
};

const VARIANTS: Variant[] = [
  {
    id: "V0_Original",
    description: "Vor heute: keine Stauchung, alte Toleranzen 5/10",
    squeezeRole: identity,
    squeezePerson: identity,
    tol: { eq: 5, good: 5, cond: 10 },
  },
  {
    id: "V1_AktuellDeployt",
    description: "Pflaster: Stelle gestaucht 0.5, Toleranzen verschärft 3/7",
    squeezeRole: linearMix(0.5),
    squeezePerson: identity,
    tol: { good: 3, cond: 7 },
  },
  {
    id: "V2_Weg2_AlteToleranzen",
    description: "Weg 2: Stelle gestaucht 0.5, Toleranzen 5/10 (zurückgedreht)",
    squeezeRole: linearMix(0.5),
    squeezePerson: identity,
    tol: { good: 5, cond: 10 },
  },
  {
    id: "V3a_SymmStauchung_50",
    description: "Weg 1a: Beide Seiten gestaucht 0.5, EQ=5/GOOD=5/COND=10",
    squeezeRole: linearMix(0.5),
    squeezePerson: linearMix(0.5),
    tol: { eq: 5, good: 5, cond: 10 },
  },
  {
    id: "V3a_skaliertEQ",
    description: "Weg 1a + skalierte EQ_TOL=3 (passend zu komprimierter Skala)",
    squeezeRole: linearMix(0.5),
    squeezePerson: linearMix(0.5),
    tol: { eq: 3, good: 5, cond: 10 },
  },
  {
    id: "V3a_skaliertGood",
    description: "Weg 1a + skalierte Toleranzen EQ=3/GOOD=3/COND=7",
    squeezeRole: linearMix(0.5),
    squeezePerson: linearMix(0.5),
    tol: { eq: 3, good: 3, cond: 7 },
  },
  {
    id: "V3b_SymmStauchung_30",
    description: "Weg 1b: Beide Seiten gestaucht 0.3, Toleranzen 5/10",
    squeezeRole: linearMix(0.3),
    squeezePerson: linearMix(0.3),
    tol: { good: 5, cond: 10 },
  },
  {
    id: "V4_SoftCap",
    description: "Weg 1c: Soft-Cap (logistisch) auf Stelle, Toleranzen 5/10",
    squeezeRole: softCap(0.55),
    squeezePerson: identity,
    tol: { good: 5, cond: 10 },
  },
  {
    id: "V5_SoftCapBeide",
    description: "Weg 1d: Soft-Cap auf beide Seiten, Toleranzen 5/10",
    squeezeRole: softCap(0.55),
    squeezePerson: softCap(0.55),
    tol: { good: 5, cond: 10 },
  },
];

// --- Auswertung ---
type Cell = {
  role: string;
  person: string;
  expected: Expectation;
  actual: FitStatus;
  match: boolean;
  roleSqueezed: Triad;
  personSqueezed: Triad;
  maxGap: number;
};

function runVariant(v: Variant): { cells: Cell[]; correct: number; total: number; valueRange: { roleMax: number; personMax: number; roleMin: number; personMin: number } } {
  const cells: Cell[] = [];
  let correct = 0;
  let roleMax = 0, personMax = 0, roleMin = 100, personMin = 100;

  for (const role of ROLES) {
    for (const person of PERSONS) {
      const rs = v.squeezeRole(role.raw);
      const ps = v.squeezePerson(person.raw);
      roleMax = Math.max(roleMax, rs.impulsiv, rs.intuitiv, rs.analytisch);
      personMax = Math.max(personMax, ps.impulsiv, ps.intuitiv, ps.analytisch);
      roleMin = Math.min(roleMin, rs.impulsiv, rs.intuitiv, rs.analytisch);
      personMin = Math.min(personMin, ps.impulsiv, ps.intuitiv, ps.analytisch);
      const fit = computeCoreFit(rs, ps, false, v.tol);
      const expected = expectedFor(role, person);
      const match = fit.overallFit === expected;
      if (match) correct++;
      const maxGap = Math.max(
        Math.abs(rs.impulsiv - ps.impulsiv),
        Math.abs(rs.intuitiv - ps.intuitiv),
        Math.abs(rs.analytisch - ps.analytisch)
      );
      cells.push({ role: role.name, person: person.name, expected, actual: fit.overallFit, match, roleSqueezed: rs, personSqueezed: ps, maxGap });
    }
  }
  return { cells, correct, total: cells.length, valueRange: { roleMax, personMax, roleMin, personMin } };
}

function distribution(cells: Cell[]): Record<FitStatus, number> {
  const d: Record<FitStatus, number> = { SUITABLE: 0, CONDITIONAL: 0, NOT_SUITABLE: 0 };
  for (const c of cells) d[c.actual]++;
  return d;
}

function expectedDistribution(cells: Cell[]): Record<Expectation, number> {
  const d: Record<Expectation, number> = { SUITABLE: 0, CONDITIONAL: 0, NOT_SUITABLE: 0 };
  for (const c of cells) d[c.expected]++;
  return d;
}

function pad(s: string, n: number) {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}
function padN(n: number, w: number) {
  return pad(String(n), w);
}

console.log("\n=== JobCheck Baseline-Korrektur Vergleichstest ===\n");
console.log(`Test-Setup: ${ROLES.length} Stellen × ${PERSONS.length} Personen = ${ROLES.length * PERSONS.length} Match-Fälle\n`);

console.log("Erwartete Verteilung (Ground Truth, heuristisch):");
const exp0 = expectedDistribution(runVariant(VARIANTS[0]).cells);
console.log(`  GEEIGNET: ${exp0.SUITABLE}  BEDINGT: ${exp0.CONDITIONAL}  NICHT: ${exp0.NOT_SUITABLE}\n`);

console.log("┌─────────────────────────┬──────────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐");
console.log("│ Variante                │ Genauigkeit  │ GE      │ BE      │ NI      │ Wert-Max│ Wert-Min│ ΔRol/Per│");
console.log("├─────────────────────────┼──────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤");

const results: Array<{ v: Variant; r: ReturnType<typeof runVariant> }> = [];
for (const v of VARIANTS) {
  const r = runVariant(v);
  results.push({ v, r });
  const dist = distribution(r.cells);
  const acc = ((r.correct / r.total) * 100).toFixed(1);
  console.log(
    `│ ${pad(v.id, 23)} │ ${pad(`${r.correct}/${r.total} (${acc}%)`, 12)} │ ${padN(dist.SUITABLE, 7)} │ ${padN(dist.CONDITIONAL, 7)} │ ${padN(dist.NOT_SUITABLE, 7)} │ ${pad(`R${r.valueRange.roleMax}/P${r.valueRange.personMax}`, 7)} │ ${pad(`R${r.valueRange.roleMin}/P${r.valueRange.personMin}`, 7)} │ ${pad(`${r.valueRange.roleMax - r.valueRange.roleMin}/${r.valueRange.personMax - r.valueRange.personMin}`, 7)} │`
  );
}
console.log("└─────────────────────────┴──────────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘\n");

console.log("Beschreibungen der Varianten:");
for (const v of VARIANTS) console.log(`  ${v.id}: ${v.description}`);

console.log("\n--- Detaillierte Trefferquote pro Erwartungsklasse ---\n");
console.log("┌─────────────────────────┬───────────────┬───────────────┬───────────────┐");
console.log("│ Variante                │ GE korr/total │ BE korr/total │ NI korr/total │");
console.log("├─────────────────────────┼───────────────┼───────────────┼───────────────┤");
for (const { v, r } of results) {
  const ge = r.cells.filter(c => c.expected === "SUITABLE");
  const be = r.cells.filter(c => c.expected === "CONDITIONAL");
  const ni = r.cells.filter(c => c.expected === "NOT_SUITABLE");
  const geC = ge.filter(c => c.match).length;
  const beC = be.filter(c => c.match).length;
  const niC = ni.filter(c => c.match).length;
  console.log(`│ ${pad(v.id, 23)} │ ${pad(`${geC}/${ge.length}`, 13)} │ ${pad(`${beC}/${be.length}`, 13)} │ ${pad(`${niC}/${ni.length}`, 13)} │`);
}
console.log("└─────────────────────────┴───────────────┴───────────────┴───────────────┘\n");

console.log("--- Stark abweichende Ergebnisse (V1 vs V0): ---\n");
const v0Cells = results[0].r.cells;
const v1Cells = results[1].r.cells;
let countDiff = 0;
for (let i = 0; i < v0Cells.length; i++) {
  if (v0Cells[i].actual !== v1Cells[i].actual) {
    countDiff++;
    if (countDiff <= 8) {
      console.log(`  ${pad(v0Cells[i].role, 32)} × ${pad(v0Cells[i].person, 28)}: V0=${v0Cells[i].actual.padEnd(13)} → V1=${v1Cells[i].actual}`);
    }
  }
}
console.log(`  Gesamt: ${countDiff} von ${v0Cells.length} Bewertungen verschoben\n`);

console.log("--- Beispiel-Spotlight: Stark ausgeprägter Hunter auf impulsiven Vertriebsleiter ---\n");
const role = ROLES[0]; // Vertriebsleiter
const person = PERSONS[0]; // Hunter
console.log(`Stelle:  ${role.name}  →  raw ${JSON.stringify(role.raw)}`);
console.log(`Person:  ${person.name}  →  raw ${JSON.stringify(person.raw)}\n`);
for (const v of VARIANTS) {
  const rs = v.squeezeRole(role.raw);
  const ps = v.squeezePerson(person.raw);
  const fit = computeCoreFit(rs, ps, false, v.tol);
  const gap = Math.max(
    Math.abs(rs.impulsiv - ps.impulsiv),
    Math.abs(rs.intuitiv - ps.intuitiv),
    Math.abs(rs.analytisch - ps.analytisch)
  );
  console.log(
    `  ${pad(v.id, 23)} | Stelle ${pad(`${rs.impulsiv}/${rs.intuitiv}/${rs.analytisch}`, 12)} | Person ${pad(`${ps.impulsiv}/${ps.intuitiv}/${ps.analytisch}`, 12)} | maxGap=${pad(String(gap), 3)} | ${fit.overallFit}`
  );
}

console.log("\n--- Empfehlung (Auswertung) ---\n");
const best = [...results].sort((a, b) => b.r.correct - a.r.correct)[0];
console.log(`Höchste Genauigkeit: ${best.v.id} mit ${best.r.correct}/${best.r.total} (${((best.r.correct / best.r.total) * 100).toFixed(1)}%)`);
const realisticRange = results.filter(({ r }) => r.valueRange.roleMax <= 55);
console.log(`\nIm "realistischen Wertebereich" (Stelle max ≤ 55):`);
for (const { v, r } of realisticRange) {
  console.log(`  - ${v.id}: ${r.correct}/${r.total} korrekt, Stelle max=${r.valueRange.roleMax}, Person max=${r.valueRange.personMax}`);
}
