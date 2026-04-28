import {
  computeCoreFit,
  applyJobcheckBaseline,
  type Triad,
  type CoreFitTolerances,
} from "../client/src/lib/jobcheck-engine";

// ============================================================================
// Test-Setup: 8 Stellen × 8 Personen (= 64 Konstellationen)
// Drei Szenarien werden gegen die korrigierte Engine (V_Final) und gegen
// die vorherigen Versuche getestet.
// ============================================================================

type Case = {
  role: { name: string; profileRoh: Triad };
  person: { name: string; profileRoh: Triad };
  expected: "GE" | "BE" | "NI";
};

// Stellen sind als RAW (vor Stauchung) definiert. Das System staucht sie in
// calcBG/calcRahmen und legt sie gestaucht in localStorage ab.
const ROLES_ROH: Array<{ name: string; profile: Triad }> = [
  { name: "Vertrieb-Hunter", profile: { impulsiv: 65, intuitiv: 22, analytisch: 13 } },
  { name: "Vertriebsleiter", profile: { impulsiv: 60, intuitiv: 25, analytisch: 15 } },
  { name: "GF Mittelstand", profile: { impulsiv: 45, intuitiv: 35, analytisch: 20 } },
  { name: "HR-Beraterin", profile: { impulsiv: 25, intuitiv: 60, analytisch: 15 } },
  { name: "Customer Success", profile: { impulsiv: 35, intuitiv: 45, analytisch: 20 } },
  { name: "Stratege/Berater", profile: { impulsiv: 20, intuitiv: 50, analytisch: 30 } },
  { name: "Controller", profile: { impulsiv: 15, intuitiv: 25, analytisch: 60 } },
  { name: "QM/IT-Engineer", profile: { impulsiv: 20, intuitiv: 30, analytisch: 50 } },
];

// Personen-Profile aus Persönlichkeitstests (typischerweise ROH, max ~60-65 %).
// In der UI würde der User diese 1:1 in die Slider eingeben oder vom Test
// importieren.
const PERSONS_ROH: Array<{ name: string; profile: Triad }> = [
  { name: "Hunter", profile: { impulsiv: 60, intuitiv: 25, analytisch: 15 } },
  { name: "Macher", profile: { impulsiv: 50, intuitiv: 30, analytisch: 20 } },
  { name: "Empath", profile: { impulsiv: 20, intuitiv: 60, analytisch: 20 } },
  { name: "Beraterin", profile: { impulsiv: 25, intuitiv: 50, analytisch: 25 } },
  { name: "Analytiker", profile: { impulsiv: 15, intuitiv: 25, analytisch: 60 } },
  { name: "Stratege", profile: { impulsiv: 20, intuitiv: 30, analytisch: 50 } },
  { name: "Allrounder", profile: { impulsiv: 33, intuitiv: 34, analytisch: 33 } },
  { name: "Doppelspitze", profile: { impulsiv: 45, intuitiv: 45, analytisch: 10 } },
];

// Heuristische Erwartung (manuelle Begutachtung):
// GE = top1-Komponenten gleich UND Differenzen klein
// NI = klare Kreuz-Mismatches (Top-Komponente konträr)
// BE = sonst
function expectedRating(role: Triad, person: Triad): "GE" | "BE" | "NI" {
  const r = (["impulsiv", "intuitiv", "analytisch"] as const)
    .map(k => ({ k, v: role[k] }))
    .sort((a, b) => b.v - a.v);
  const p = (["impulsiv", "intuitiv", "analytisch"] as const)
    .map(k => ({ k, v: person[k] }))
    .sort((a, b) => b.v - a.v);
  if (r[0].k === p[0].k) {
    const diffTop = Math.abs(role[r[0].k] - person[r[0].k]);
    const diffSec = Math.abs(role[r[1].k] - person[r[1].k]);
    if (diffTop <= 15 && diffSec <= 15) return "GE";
    return "BE";
  }
  // Top-Komponente passt nicht
  if (p[0].k === r[2].k) return "NI"; // Person dominiert in der Schwächsten der Stelle
  return "BE";
}

// ============================================================================
// Drei Szenarien für die Person-Eingabe
// ============================================================================

// Szenario A (LEGACY): Person kommt aus dem Persönlichkeitstest mit ROH-Werten.
// Vor Slider-Cap noch möglich; nach Slider-Cap (5–50) nicht mehr eingebbar.
function inputA_PersonRoh(p: Triad): Triad {
  return p;
}

// Szenario B (LEGACY): User stellt die Person-Slider VISUELL zur (gestauchten)
// Stelle ein. Person ist bereits ungefähr in der gestauchten Skala der Stelle.
function inputB_PersonAusgerichtet(p: Triad, _role: Triad): Triad {
  const blended = applyJobcheckBaseline({
    imp: p.impulsiv,
    int: p.intuitiv,
    ana: p.analytisch,
  });
  return { impulsiv: blended.imp, intuitiv: blended.int, analytisch: blended.ana };
}

// Szenario C (NEU NACH SLIDER-CAP 5–50):
// Egal woher der User die Werte hat — die Slider erzwingen die gestauchte
// Skala. Roh-Werte (z. B. 60/25/15) werden auf [5..50] geclampt und auf
// Summe 100 normalisiert (analog zu updateCandTriad in jobcheck.tsx).
function inputC_SliderCap50(p: Triad): Triad {
  // Simuliert die State-Initialisierung in jobcheck.tsx (Migration alter Werte)
  const sum = p.impulsiv + p.intuitiv + p.analytisch;
  let i = Math.round((p.impulsiv / sum) * 100);
  let n = Math.round((p.intuitiv / sum) * 100);
  let a = 100 - i - n;
  i = Math.max(5, Math.min(50, i));
  n = Math.max(5, Math.min(50, n));
  a = Math.max(5, Math.min(50, a));
  const total = i + n + a;
  if (total !== 100) {
    const diff = 100 - total;
    if (i >= n && i >= a) i = Math.max(5, Math.min(50, i + diff));
    else if (n >= i && n >= a) n = Math.max(5, Math.min(50, n + diff));
    else a = Math.max(5, Math.min(50, a + diff));
  }
  return { impulsiv: i, intuitiv: n, analytisch: a };
}

// ============================================================================
// Engine-Varianten
// ============================================================================

type EngineVariant = {
  id: string;
  description: string;
  tol: CoreFitTolerances;
  // Ob die Engine selbst die Person noch zusätzlich staucht
  autoStauchPerson: boolean;
};

const ENGINES: EngineVariant[] = [
  {
    id: "V0_Original",
    description: "Status vor heute (keine Stauchung in Engine, EQ=5/GOOD=5/COND=10)",
    tol: { eq: 5, good: 5, cond: 10 },
    autoStauchPerson: false,
  },
  {
    id: "V1_Pflaster_3_7",
    description: "Pflaster vom Vormittag (Tol verschärft 3/7, keine Person-Stauchung in Engine)",
    tol: { eq: 5, good: 3, cond: 7 },
    autoStauchPerson: false,
  },
  {
    id: "V_PersonStauchen_5_10",
    description: "Mein 1. Versuch (Engine staucht Person mit, Tol 5/10, EQ=3)",
    tol: { eq: 3, good: 5, cond: 10 },
    autoStauchPerson: true,
  },
  {
    id: "V_Final_5_10",
    description: "JETZT AKTIV: keine Engine-Stauchung, Tol 5/10",
    tol: { eq: 5, good: 5, cond: 10 },
    autoStauchPerson: false,
  },
];

function runEngineLike(role: Triad, person: Triad, eng: EngineVariant): "GE" | "BE" | "NI" {
  let p = person;
  if (eng.autoStauchPerson) {
    const blended = applyJobcheckBaseline({
      imp: p.impulsiv,
      int: p.intuitiv,
      ana: p.analytisch,
    });
    p = { impulsiv: blended.imp, intuitiv: blended.int, analytisch: blended.ana };
  }
  const fit = computeCoreFit(role, p, false, eng.tol);
  if (fit.overallFit === "SUITABLE") return "GE";
  if (fit.overallFit === "CONDITIONAL") return "BE";
  return "NI";
}

// Stellen werden in calcBG/calcRahmen gestaucht und in localStorage abgelegt.
function stellenGestaucht(roh: Triad): Triad {
  const blended = applyJobcheckBaseline({
    imp: roh.impulsiv,
    int: roh.intuitiv,
    ana: roh.analytisch,
  });
  return { impulsiv: blended.imp, intuitiv: blended.int, analytisch: blended.ana };
}

// ============================================================================
// Auswertung
// ============================================================================

const results: Array<{
  scenarioId: string;
  engineId: string;
  hits: number;
  total: number;
  geCorrect: number; geTotal: number;
  beCorrect: number; beTotal: number;
  niCorrect: number; niTotal: number;
}> = [];

const scenarios: Array<{
  id: string;
  description: string;
  buildRole: (rRoh: Triad) => Triad;
  buildPerson: (pRoh: Triad, rRoh: Triad) => Triad;
}> = [
  {
    id: "A_PersonRoh_LEGACY",
    description: "LEGACY (vor Slider-Cap): Person ist ROH (aus Persönlichkeitstest, max ~60 %)",
    buildRole: stellenGestaucht,
    buildPerson: (p) => inputA_PersonRoh(p),
  },
  {
    id: "B_PersonAusgerichtet_LEGACY",
    description: "LEGACY: User stellt Person VISUELL zur Stelle (Person bereits gestaucht)",
    buildRole: stellenGestaucht,
    buildPerson: (p, r) => inputB_PersonAusgerichtet(p, r),
  },
  {
    id: "C_SliderCap50_NEU",
    description: "NEU NACH SLIDER-CAP 5–50: Eingabe wird zwangsweise in [5..50] gemappt",
    buildRole: stellenGestaucht,
    buildPerson: (p) => inputC_SliderCap50(p),
  },
];

for (const sc of scenarios) {
  for (const eng of ENGINES) {
    let hits = 0, total = 0;
    let geC = 0, geT = 0, beC = 0, beT = 0, niC = 0, niT = 0;
    for (const r of ROLES_ROH) {
      for (const p of PERSONS_ROH) {
        const role = sc.buildRole(r.profile);
        const person = sc.buildPerson(p.profile, r.profile);
        // Heuristik auf den TATSÄCHLICH eingegebenen Werten (was der Berater sieht)
        const exp = expectedRating(role, person);
        const got = runEngineLike(role, person, eng);
        total++;
        if (got === exp) hits++;
        if (exp === "GE") { geT++; if (got === exp) geC++; }
        if (exp === "BE") { beT++; if (got === exp) beC++; }
        if (exp === "NI") { niT++; if (got === exp) niC++; }
      }
    }
    results.push({
      scenarioId: sc.id, engineId: eng.id,
      hits, total,
      geCorrect: geC, geTotal: geT,
      beCorrect: beC, beTotal: beT,
      niCorrect: niC, niTotal: niT,
    });
  }
}

console.log("\n╔══════════════════════════════════════════════════════════════════════════╗");
console.log("║  FINALER VERGLEICH — 4 Engine-Varianten × 2 Eingabe-Szenarien            ║");
console.log("║  Heuristische Ground-Truth: 64 Konstellationen pro Lauf                  ║");
console.log("╚══════════════════════════════════════════════════════════════════════════╝\n");

for (const sc of scenarios) {
  console.log(`\n─── Szenario ${sc.id}: ${sc.description} ───\n`);
  console.log("┌─────────────────────────┬──────────────┬────────────┬────────────┬────────────┐");
  console.log("│ Engine-Variante         │ Gesamt-Hits  │ GE korr.   │ BE korr.   │ NI korr.   │");
  console.log("├─────────────────────────┼──────────────┼────────────┼────────────┼────────────┤");
  for (const eng of ENGINES) {
    const r = results.find(x => x.scenarioId === sc.id && x.engineId === eng.id)!;
    const pct = ((r.hits / r.total) * 100).toFixed(1);
    console.log(`│ ${eng.id.padEnd(23)} │ ${(r.hits + "/" + r.total + " (" + pct + "%)").padEnd(12)} │ ${(r.geCorrect + "/" + r.geTotal).padEnd(10)} │ ${(r.beCorrect + "/" + r.beTotal).padEnd(10)} │ ${(r.niCorrect + "/" + r.niTotal).padEnd(10)} │`);
  }
  console.log("└─────────────────────────┴──────────────┴────────────┴────────────┴────────────┘");
}

// ============================================================================
// Spotlight: die zwei kritischen Beispiele
// ============================================================================

console.log("\n\n╔══════════════════════════════════════════════════════════════════════════╗");
console.log("║  SPOTLIGHTS — die beiden Streit-Beispiele                                ║");
console.log("╚══════════════════════════════════════════════════════════════════════════╝\n");

const spotlights: Array<{ name: string; roleRoh: Triad; personRoh: Triad; szenario: "A" | "B"; expected: "GE" | "BE" | "NI" }> = [
  {
    name: "Hunter (60/25/15) auf Vertriebsleiter (60/25/15) — Person aus Test",
    roleRoh: { impulsiv: 60, intuitiv: 25, analytisch: 15 },
    personRoh: { impulsiv: 60, intuitiv: 25, analytisch: 15 },
    szenario: "A",
    expected: "GE",
  },
  {
    name: "Hunter (60/25/15) auf Vertriebsleiter — User stellt Person visuell ein",
    roleRoh: { impulsiv: 60, intuitiv: 25, analytisch: 15 },
    personRoh: { impulsiv: 60, intuitiv: 25, analytisch: 15 },
    szenario: "B",
    expected: "GE",
  },
  {
    name: "Einzelhandelskaufmann (analyt.) — User stellt Person 1:1 visuell ein (User-Bug-Beispiel)",
    roleRoh: { impulsiv: 14, intuitiv: 25, analytisch: 61 },
    personRoh: { impulsiv: 14, intuitiv: 25, analytisch: 61 },
    szenario: "B",
    expected: "GE",
  },
  {
    name: "Klar dominante Person (60% imp) auf eher ausgewogene Stelle (45% imp)",
    roleRoh: { impulsiv: 45, intuitiv: 35, analytisch: 20 },
    personRoh: { impulsiv: 60, intuitiv: 25, analytisch: 15 },
    szenario: "A",
    expected: "BE",
  },
  {
    name: "Klares Mismatch: Hunter auf Controller-Stelle",
    roleRoh: { impulsiv: 15, intuitiv: 25, analytisch: 60 },
    personRoh: { impulsiv: 60, intuitiv: 25, analytisch: 15 },
    szenario: "A",
    expected: "NI",
  },
];

for (const s of spotlights) {
  console.log(`\n■ ${s.name}`);
  console.log(`  Erwartung: ${s.expected}`);
  const role = stellenGestaucht(s.roleRoh);
  const person = s.szenario === "A" ? inputA_PersonRoh(s.personRoh) : inputB_PersonAusgerichtet(s.personRoh, s.roleRoh);
  console.log(`  Stelle (gestaucht): ${role.impulsiv.toFixed(0)}/${role.intuitiv.toFixed(0)}/${role.analytisch.toFixed(0)}`);
  console.log(`  Person (Szenario ${s.szenario}): ${person.impulsiv.toFixed(0)}/${person.intuitiv.toFixed(0)}/${person.analytisch.toFixed(0)}`);
  const maxGap = Math.max(
    Math.abs(role.impulsiv - person.impulsiv),
    Math.abs(role.intuitiv - person.intuitiv),
    Math.abs(role.analytisch - person.analytisch),
  );
  console.log(`  Max-Gap: ${maxGap.toFixed(1)}`);
  for (const eng of ENGINES) {
    const got = runEngineLike(role, person, eng);
    const flag = got === s.expected ? "✓" : "✗";
    console.log(`    ${flag} ${eng.id.padEnd(25)} → ${got}`);
  }
}

console.log("\n\n--- Beschreibungen der Engines ---\n");
for (const eng of ENGINES) {
  console.log(`  ${eng.id}: ${eng.description}`);
}
