import {
  computeCoreFit,
  applyJobcheckBaseline,
  type Triad,
} from "../client/src/lib/jobcheck-engine";

// Stellen sind im localStorage BEREITS gestaucht (durch calcBG/calcRahmen)
const ROLES: Array<{ name: string; profile: Triad }> = [
  { name: "Vertriebsleiter (impulsiv-stark)", profile: { impulsiv: 47, intuitiv: 29, analytisch: 24 } },
  { name: "HR-Beraterin (intuitiv-stark)", profile: { impulsiv: 28, intuitiv: 47, analytisch: 25 } },
  { name: "Controller (analytisch-stark)", profile: { impulsiv: 24, intuitiv: 29, analytisch: 47 } },
  { name: "GF Mittelstand (ausgewogen)", profile: { impulsiv: 35, intuitiv: 35, analytisch: 30 } },
];

// Personen kommen ROH aus Slidern oder Persönlichkeitstest
const PERSONS: Array<{ name: string; profile: Triad }> = [
  { name: "Hunter (impulsiv-stark)", profile: { impulsiv: 55, intuitiv: 28, analytisch: 17 } },
  { name: "Macher (impulsiv-mittel)", profile: { impulsiv: 45, intuitiv: 30, analytisch: 25 } },
  { name: "Empath (intuitiv-stark)", profile: { impulsiv: 22, intuitiv: 55, analytisch: 23 } },
  { name: "Analytiker (analytisch-stark)", profile: { impulsiv: 15, intuitiv: 25, analytisch: 60 } },
  { name: "Allrounder (ausgewogen)", profile: { impulsiv: 34, intuitiv: 33, analytisch: 33 } },
];

function adjustPerson(t: Triad): Triad {
  const blended = applyJobcheckBaseline({ imp: t.impulsiv, int: t.intuitiv, ana: t.analytisch });
  return { impulsiv: blended.imp, intuitiv: blended.int, analytisch: blended.ana };
}

console.log("\n=== Live-Validierung der neuen Engine-Logik ===\n");
console.log("Stellen sind in localStorage bereits gestaucht (max ~47%).");
console.log("Personen sind roh (max bis 60%) — runEngine staucht sie nun symmetrisch.\n");

console.log("┌──────────────────────────────────┬────────────────────────────┬─────────────────┬──────────────┐");
console.log("│ Stelle (in localStorage)         │ Person (Roh-Eingabe)       │ Person nach Adj │ Ergebnis     │");
console.log("├──────────────────────────────────┼────────────────────────────┼─────────────────┼──────────────┤");

let suitable = 0, conditional = 0, notSuitable = 0;
for (const r of ROLES) {
  for (const p of PERSONS) {
    const adj = adjustPerson(p.profile);
    const fit = computeCoreFit(r.profile, adj, false);
    const rs = `${r.profile.impulsiv}/${r.profile.intuitiv}/${r.profile.analytisch}`;
    const ps = `${p.profile.impulsiv}/${p.profile.intuitiv}/${p.profile.analytisch}`;
    const adjStr = `${adj.impulsiv}/${adj.intuitiv}/${adj.analytisch}`;
    if (fit.overallFit === "SUITABLE") suitable++;
    else if (fit.overallFit === "CONDITIONAL") conditional++;
    else notSuitable++;
    console.log(`│ ${(r.name + " " + rs).padEnd(32).slice(0, 32)} │ ${(p.name + " " + ps).padEnd(26).slice(0, 26)} │ ${adjStr.padEnd(15)} │ ${fit.overallFit.padEnd(12)} │`);
  }
  console.log("├──────────────────────────────────┼────────────────────────────┼─────────────────┼──────────────┤");
}
console.log("");
console.log(`Verteilung: ${suitable}× GEEIGNET, ${conditional}× BEDINGT, ${notSuitable}× NICHT GEEIGNET (von ${suitable + conditional + notSuitable})\n`);

console.log("=== Spotlight: Vertriebsleiter × Hunter — kritischer Test ===\n");
const role = ROLES[0];
const hunter = PERSONS[0];
const adjHunter = adjustPerson(hunter.profile);
const result = computeCoreFit(role.profile, adjHunter, false);
console.log(`Stelle (in localStorage):           ${role.profile.impulsiv}/${role.profile.intuitiv}/${role.profile.analytisch}`);
console.log(`Person Roh-Input:                   ${hunter.profile.impulsiv}/${hunter.profile.intuitiv}/${hunter.profile.analytisch}`);
console.log(`Person nach Adjust (in runEngine):  ${adjHunter.impulsiv}/${adjHunter.intuitiv}/${adjHunter.analytisch}`);
const maxGap = Math.max(
  Math.abs(role.profile.impulsiv - adjHunter.impulsiv),
  Math.abs(role.profile.intuitiv - adjHunter.intuitiv),
  Math.abs(role.profile.analytisch - adjHunter.analytisch)
);
console.log(`Max-Gap nach Adjust:                ${maxGap}`);
console.log(`\nErgebnis: ${result.overallFit}`);
console.log(`Erwartung: SUITABLE (zwei impulsiv-starke Profile, Top-Komponente passt, Gap < 5)`);
console.log(`✓ Erwartung erfüllt: ${result.overallFit === "SUITABLE" ? "JA" : "NEIN — PROBLEM!"}\n`);

console.log("=== Spotlight: Vertriebsleiter × Analytiker — Mismatch-Test ===\n");
const analyst = PERSONS[3];
const adjAnalyst = adjustPerson(analyst.profile);
const result2 = computeCoreFit(role.profile, adjAnalyst, false);
console.log(`Stelle:           ${role.profile.impulsiv}/${role.profile.intuitiv}/${role.profile.analytisch}`);
console.log(`Person:           ${analyst.profile.impulsiv}/${analyst.profile.intuitiv}/${analyst.profile.analytisch}`);
console.log(`Person nach Adj:  ${adjAnalyst.impulsiv}/${adjAnalyst.intuitiv}/${adjAnalyst.analytisch}`);
console.log(`Ergebnis: ${result2.overallFit}`);
console.log(`Erwartung: NOT_SUITABLE (analytisch-Person auf impulsiv-Stelle)`);
console.log(`✓ Erwartung erfüllt: ${result2.overallFit === "NOT_SUITABLE" ? "JA" : "NEIN — PROBLEM!"}`);
