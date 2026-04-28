// Brute-force Test des solveTriad / migrateLegacyTriad in jobcheck.tsx.
// Wir importieren die Funktionen nicht direkt (jobcheck.tsx ist eine .tsx-React-Datei
// mit Imports, die im Node-Kontext nicht laufen). Stattdessen replizieren wir die
// REINEN Logik-Funktionen 1:1 hier (Quelle: client/src/pages/jobcheck.tsx).

type TriadKey = "impulsiv" | "intuitiv" | "analytisch";
type Triad = { impulsiv: number; intuitiv: number; analytisch: number };

function solveTriad(prev: Triad, key: TriadKey, newVal: number): Triad {
  const all: TriadKey[] = ["impulsiv", "intuitiv", "analytisch"];
  const others = all.filter(k => k !== key) as [TriadKey, TriadKey];
  const clamped = Math.max(5, Math.min(50, Math.round(newVal)));
  const remaining = 100 - clamped;

  const otherSum = prev[others[0]] + prev[others[1]];
  let o1Raw: number;
  if (otherSum <= 0) {
    o1Raw = remaining / 2;
  } else {
    o1Raw = (prev[others[0]] / otherSum) * remaining;
  }

  let o1 = Math.max(5, Math.min(50, Math.round(o1Raw)));
  let o2 = remaining - o1;

  if (o2 < 5) { o2 = 5; o1 = remaining - 5; }
  else if (o2 > 50) { o2 = 50; o1 = remaining - 50; }

  o1 = Math.max(5, Math.min(50, o1));
  o2 = remaining - o1;
  if (o2 < 5) { o2 = 5; o1 = remaining - 5; }
  if (o2 > 50) { o2 = 50; o1 = remaining - 50; }

  return { [key]: clamped, [others[0]]: o1, [others[1]]: o2 } as Triad;
}

function migrateLegacyTriad(impRaw: number, intRaw: number, anaRaw: number): Triad {
  const sum = (impRaw || 0) + (intRaw || 0) + (anaRaw || 0);
  if (!isFinite(sum) || sum <= 0) return { impulsiv: 33, intuitiv: 34, analytisch: 33 };
  const i = (impRaw / sum) * 100;
  const n = (intRaw / sum) * 100;
  const a = (anaRaw / sum) * 100;
  const triad: Triad = { impulsiv: i, intuitiv: n, analytisch: a };
  const keys: TriadKey[] = ["impulsiv", "intuitiv", "analytisch"];
  const dominant = keys.reduce((best, k) => (triad[k] > triad[best] ? k : best), keys[0]);
  return solveTriad(triad, dominant, triad[dominant]);
}

function isValid(t: Triad): { ok: boolean; why?: string } {
  if (t.impulsiv < 5 || t.impulsiv > 50) return { ok: false, why: `imp=${t.impulsiv} out of [5..50]` };
  if (t.intuitiv < 5 || t.intuitiv > 50) return { ok: false, why: `int=${t.intuitiv} out of [5..50]` };
  if (t.analytisch < 5 || t.analytisch > 50) return { ok: false, why: `ana=${t.analytisch} out of [5..50]` };
  const sum = t.impulsiv + t.intuitiv + t.analytisch;
  if (sum !== 100) return { ok: false, why: `sum=${sum} != 100` };
  if (!Number.isInteger(t.impulsiv) || !Number.isInteger(t.intuitiv) || !Number.isInteger(t.analytisch)) {
    return { ok: false, why: "non-integer values" };
  }
  return { ok: true };
}

// ────────────────────────────────────────────────────────────────────────────
// Test 1: solveTriad — vollständiger Sweep über alle gültigen Vorzustände
// und alle möglichen Slider-Eingaben.
// ────────────────────────────────────────────────────────────────────────────
console.log("\n=== Test 1: solveTriad — alle gültigen Übergänge ===");
let total = 0, fails = 0;
const failExamples: Array<{ from: Triad; key: string; newVal: number; got: Triad; why: string }> = [];

const validStates: Triad[] = [];
for (let i = 5; i <= 50; i++) {
  for (let n = 5; n <= 50; n++) {
    const a = 100 - i - n;
    if (a >= 5 && a <= 50) validStates.push({ impulsiv: i, intuitiv: n, analytisch: a });
  }
}
console.log(`Gültige Vorzustände: ${validStates.length}`);

const keys: TriadKey[] = ["impulsiv", "intuitiv", "analytisch"];
for (const prev of validStates) {
  for (const key of keys) {
    // Slider-Eingabe: simuliere alle ganzzahligen Werte 0..100 (User kann auch
    // außerhalb von [5..50] dragen, der Solver muss clampen)
    for (let v = 0; v <= 100; v++) {
      total++;
      const got = solveTriad(prev, key, v);
      const check = isValid(got);
      if (!check.ok) {
        fails++;
        if (failExamples.length < 5) {
          failExamples.push({ from: prev, key, newVal: v, got, why: check.why || "?" });
        }
      }
    }
  }
}
console.log(`Übergänge getestet: ${total}`);
console.log(`Verletzungen: ${fails}`);
if (fails > 0) {
  console.log("Beispiele:");
  for (const e of failExamples) {
    console.log(`  von ${JSON.stringify(e.from)} → ${e.key}=${e.newVal}: ${JSON.stringify(e.got)} (${e.why})`);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Test 2: migrateLegacyTriad — alle realistischen Legacy-Triaden aus dem alten
// Slider-Bereich (0..67) durchspielen.
// ────────────────────────────────────────────────────────────────────────────
console.log("\n=== Test 2: migrateLegacyTriad — Legacy-Daten (max=67) ===");
let mTotal = 0, mFails = 0;
const mFailExamples: Array<{ legacy: Triad; got: Triad; why: string }> = [];

for (let i = 0; i <= 67; i += 2) {
  for (let n = 0; n <= 67; n += 2) {
    for (let a = 0; a <= 67; a += 2) {
      if (i + n + a === 0) continue;
      mTotal++;
      const got = migrateLegacyTriad(i, n, a);
      const check = isValid(got);
      if (!check.ok) {
        mFails++;
        if (mFailExamples.length < 10) {
          mFailExamples.push({ legacy: { impulsiv: i, intuitiv: n, analytisch: a }, got, why: check.why || "?" });
        }
      }
    }
  }
}
console.log(`Legacy-Triaden getestet: ${mTotal}`);
console.log(`Verletzungen: ${mFails}`);
if (mFails > 0) {
  console.log("Beispiele:");
  for (const e of mFailExamples) {
    console.log(`  legacy ${JSON.stringify(e.legacy)} → ${JSON.stringify(e.got)} (${e.why})`);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Test 3: Spezifische Edge-Cases vom Architect-Review
// ────────────────────────────────────────────────────────────────────────────
console.log("\n=== Test 3: Edge-Cases vom Reviewer ===");
const cases: Array<{ desc: string; legacy?: Triad; trans?: { from: Triad; key: TriadKey; newVal: number } }> = [
  { desc: "Legacy 67/0/33", legacy: { impulsiv: 67, intuitiv: 0, analytisch: 33 } },
  { desc: "Legacy 67/0/0", legacy: { impulsiv: 67, intuitiv: 0, analytisch: 0 } },
  { desc: "Legacy 0/0/0 → Default", legacy: { impulsiv: 0, intuitiv: 0, analytisch: 0 } },
  { desc: "Legacy 100/100/100 → 33/33/33", legacy: { impulsiv: 100, intuitiv: 100, analytisch: 100 } },
  { desc: "Update {5,45,50} → intuitiv=5", trans: { from: { impulsiv: 5, intuitiv: 45, analytisch: 50 }, key: "intuitiv", newVal: 5 } },
  { desc: "Update {50,5,45} → impulsiv=50", trans: { from: { impulsiv: 50, intuitiv: 5, analytisch: 45 }, key: "impulsiv", newVal: 50 } },
  { desc: "Update {33,34,33} → impulsiv=80 (over-cap)", trans: { from: { impulsiv: 33, intuitiv: 34, analytisch: 33 }, key: "impulsiv", newVal: 80 } },
  { desc: "Update {33,34,33} → impulsiv=-10 (under-cap)", trans: { from: { impulsiv: 33, intuitiv: 34, analytisch: 33 }, key: "impulsiv", newVal: -10 } },
];

for (const c of cases) {
  let got: Triad;
  if (c.legacy) got = migrateLegacyTriad(c.legacy.impulsiv, c.legacy.intuitiv, c.legacy.analytisch);
  else got = solveTriad(c.trans!.from, c.trans!.key, c.trans!.newVal);
  const check = isValid(got);
  const flag = check.ok ? "✓" : "✗";
  console.log(`  ${flag} ${c.desc.padEnd(50)} → ${JSON.stringify(got)} ${check.ok ? "" : "(" + check.why + ")"}`);
}

console.log("\n=== Zusammenfassung ===");
const allOk = fails === 0 && mFails === 0;
console.log(allOk ? "✓ ALLE TESTS BESTANDEN" : `✗ FAILED: ${fails} Übergangs-Verletzungen, ${mFails} Migrations-Verletzungen`);
process.exit(allOk ? 0 : 1);
