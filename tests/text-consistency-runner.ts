import { normalizeTriad, dominanceModeOf } from '../client/src/lib/jobcheck-engine';
import { computeSollIst, computeStructureRelation, deriveFitSubtype } from '../client/src/lib/soll-ist-engine';
import type { FitSubtype } from '../client/src/lib/soll-ist-engine';

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

function pad(s: string, len: number): string {
  return s.length >= len ? s : s + ' '.repeat(len - s.length);
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

function runSollIstForPair(soll: P, ist: P) {
  const rt = toTriad(soll);
  const ct = toTriad(ist);
  return computeSollIst("Teststelle", "Testperson", rt, ct, "disziplinarisch");
}

function fitLabelFromStructure(sr: { type: string }, maxGap: number): string {
  if (sr.type === "HARD_CONFLICT") return "Nicht geeignet";
  if (sr.type === "SOFT_CONFLICT") return maxGap <= 10 ? "Bedingt geeignet" : "Nicht geeignet";
  if (maxGap <= 5) return "Geeignet";
  if (maxGap <= 10) return "Bedingt geeignet";
  return "Nicht geeignet";
}

function expectedSubtype(soll: P, ist: P): FitSubtype {
  const rt = normalizeTriad(toTriad(soll));
  const ct = normalizeTriad(toTriad(ist));
  const rDom = dominanceModeOf(rt);
  const cDom = dominanceModeOf(ct);
  const rk = rDom.top1.key;
  const ck = cDom.top1.key;
  const sr = computeStructureRelation(rt, ct);
  const maxGap = Math.max(
    Math.abs(rt.impulsiv - ct.impulsiv),
    Math.abs(rt.intuitiv - ct.intuitiv),
    Math.abs(rt.analytisch - ct.analytisch)
  );
  const candSpread = Math.max(ct.impulsiv, ct.intuitiv, ct.analytisch) - Math.min(ct.impulsiv, ct.intuitiv, ct.analytisch);
  const candIsBalFull = candSpread <= 5;
  const candIsDualDom = !candIsBalFull && cDom.gap1 <= 5 && cDom.gap2 > 5;
  const candDualMatchesRole = candIsDualDom && (rk === ck || rk === cDom.top2.key);
  const roleIsBalFull = rDom.gap1 <= 5 && rDom.gap2 <= 5;
  const roleIsDualDom = !roleIsBalFull && rDom.gap1 <= 5 && rDom.gap2 > 5;
  const label = fitLabelFromStructure(sr, maxGap);
  return deriveFitSubtype(rk, ck, sr, maxGap, candDualMatchesRole, candIsBalFull, roleIsBalFull, roleIsDualDom, label);
}

function isNegatedDeckungs(text: string): boolean {
  return text.includes("nicht deckungsgleich") || text.includes("nicht vollständig deckungsgleich");
}

function hasAffirmativeDeckungs(text: string): boolean {
  return text.includes("deckungsgleich") && !isNegatedDeckungs(text);
}

function runConsistencyTests(): number {
  let totalFailures = 0;

  console.log(`\n${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${CYAN}  TEXT-KONSISTENZ-PRÜFUNG: Alle 13 Konstellationen${RESET}`);
  console.log(`${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}`);

  console.log(`\n${BOLD}${CYAN}=== 1) SELF-MATCH: Jede Variante gegen sich selbst ===${RESET}`);
  let selfFailures = 0;
  for (const [label, profile] of Object.entries(variantProfiles)) {
    const result = runSollIstForPair(profile, profile);
    const issues: string[] = [];

    if (result.fitSubtype !== "PERFECT") {
      issues.push(`fitSubtype ist "${result.fitSubtype}" statt "PERFECT"`);
    }
    if (result.fitRating !== "GEEIGNET") {
      issues.push(`fitRating ist "${result.fitRating}" statt "GEEIGNET"`);
    }
    for (const area of result.impactAreas) {
      if (area.severity !== "ok") {
        issues.push(`Impact "${area.label}": severity="${area.severity}" statt "ok" bei Self-Match`);
      }
      if (area.risk.includes("nicht deckungsgleich") || area.risk.includes("weicht ab")) {
        issues.push(`Impact "${area.label}": enthält Abweichungssprache bei Self-Match`);
      }
    }
    if (result.summaryText.includes("weicht") || result.summaryText.includes("anders")) {
      issues.push(`Summary enthält Abweichungssprache bei Self-Match`);
    }

    if (issues.length === 0) {
      console.log(`  ${GREEN}✅${RESET} ${pad(label, 20)} → PERFECT, Texte konsistent`);
    } else {
      selfFailures += issues.length;
      console.log(`  ${RED}❌${RESET} ${pad(label, 20)}`);
      for (const issue of issues) console.log(`     ${RED}${issue}${RESET}`);
    }
  }
  totalFailures += selfFailures;
  console.log(selfFailures === 0
    ? `  ${GREEN}${BOLD}Alle Self-Matches korrekt${RESET}`
    : `  ${RED}${BOLD}${selfFailures} Fehler bei Self-Match${RESET}`);

  console.log(`\n${BOLD}${CYAN}=== 2) STRUCTURE_MATCH_INTENSITY_OFF: Gleiche Dominanz, andere Gewichtung ===${RESET}`);
  let intOffFailures = 0;
  const intensityOffCases: { label: string; soll: P; ist: P; expectedSub: FitSubtype }[] = [
    { label: "ORDER_INA leicht", soll: { I: 50, N: 30, A: 20 }, ist: { I: 45, N: 25, A: 30 }, expectedSub: "PARTIAL_MATCH" },
    { label: "ORDER_AIN leicht", soll: { I: 30, N: 20, A: 50 }, ist: { I: 25, N: 30, A: 45 }, expectedSub: "PARTIAL_MATCH" },
    { label: "ORDER_NIA leicht", soll: { I: 30, N: 50, A: 20 }, ist: { I: 25, N: 45, A: 30 }, expectedSub: "PARTIAL_MATCH" },
    { label: "BOTTOM_PAIR_I gering", soll: { I: 50, N: 25, A: 25 }, ist: { I: 45, N: 30, A: 25 }, expectedSub: "PERFECT" },
    { label: "ORDER_INA gross", soll: { I: 50, N: 30, A: 20 }, ist: { I: 42, N: 20, A: 38 }, expectedSub: "MISMATCH" },
    { label: "EXACT maxGap=7", soll: { I: 50, N: 30, A: 20 }, ist: { I: 43, N: 33, A: 24 }, expectedSub: "STRUCTURE_MATCH_INTENSITY_OFF" },
  ];

  for (const tc of intensityOffCases) {
    const result = runSollIstForPair(tc.soll, tc.ist);
    const issues: string[] = [];

    if (result.fitSubtype !== tc.expectedSub) {
      issues.push(`fitSubtype ist "${result.fitSubtype}" statt "${tc.expectedSub}"`);
    }
    if (result.fitSubtype === "STRUCTURE_MATCH_INTENSITY_OFF") {
      for (const area of result.impactAreas) {
        if (hasAffirmativeDeckungs(area.risk)) {
          issues.push(`Impact "${area.label}": sagt affirmativ "deckungsgleich" bei STRUCTURE_MATCH_INTENSITY_OFF`);
        }
      }
    }

    if (issues.length === 0) {
      console.log(`  ${GREEN}✅${RESET} ${pad(tc.label, 25)} → ${result.fitRating} / ${result.fitSubtype}`);
    } else {
      intOffFailures += issues.length;
      console.log(`  ${RED}❌${RESET} ${pad(tc.label, 25)} → ${result.fitRating} / ${result.fitSubtype}`);
      for (const issue of issues) console.log(`     ${RED}${issue}${RESET}`);
    }
  }
  totalFailures += intOffFailures;
  console.log(intOffFailures === 0
    ? `  ${GREEN}${BOLD}Alle Intensity-Off-Fälle konsistent${RESET}`
    : `  ${RED}${BOLD}${intOffFailures} Fehler${RESET}`);

  console.log(`\n${BOLD}${CYAN}=== 3) MISMATCH: Verschiedene Dominanzen ===${RESET}`);
  let mismatchFailures = 0;
  const mismatchCases: { label: string; soll: P; ist: P }[] = [
    { label: "I-dom vs A-dom", soll: { I: 50, N: 30, A: 20 }, ist: { I: 20, N: 30, A: 50 } },
    { label: "I-dom vs N-dom", soll: { I: 50, N: 30, A: 20 }, ist: { I: 20, N: 50, A: 30 } },
    { label: "N-dom vs A-dom", soll: { I: 20, N: 50, A: 30 }, ist: { I: 30, N: 20, A: 50 } },
    { label: "A-dom vs I-dom", soll: { I: 20, N: 30, A: 50 }, ist: { I: 50, N: 30, A: 20 } },
    { label: "A-dom vs N-dom", soll: { I: 20, N: 30, A: 50 }, ist: { I: 20, N: 50, A: 30 } },
    { label: "N-dom vs I-dom", soll: { I: 30, N: 50, A: 20 }, ist: { I: 50, N: 20, A: 30 } },
  ];

  for (const tc of mismatchCases) {
    const result = runSollIstForPair(tc.soll, tc.ist);
    const issues: string[] = [];

    if (result.fitSubtype !== "MISMATCH") {
      issues.push(`fitSubtype ist "${result.fitSubtype}" statt "MISMATCH"`);
    }
    if (result.fitRating !== "NICHT_GEEIGNET") {
      issues.push(`fitRating ist "${result.fitRating}" statt "NICHT_GEEIGNET"`);
    }
    if (result.summaryText.includes("stimmig") || result.summaryText.includes("deckungsgleich")) {
      issues.push(`Summary klingt zu positiv für MISMATCH`);
    }
    if (result.finalText.includes("stimmig") || result.finalText.includes("deckungsgleich")) {
      issues.push(`Fazit klingt zu positiv für MISMATCH`);
    }
    for (const area of result.impactAreas) {
      if (area.severity === "ok") {
        issues.push(`Impact "${area.label}": Severity ist "ok" bei MISMATCH/NICHT_GEEIGNET`);
      }
    }

    if (issues.length === 0) {
      console.log(`  ${GREEN}✅${RESET} ${pad(tc.label, 20)} → ${result.fitRating} / ${result.fitSubtype}`);
    } else {
      mismatchFailures += issues.length;
      console.log(`  ${RED}❌${RESET} ${pad(tc.label, 20)} → ${result.fitRating} / ${result.fitSubtype}`);
      for (const issue of issues) console.log(`     ${RED}${issue}${RESET}`);
    }
  }
  totalFailures += mismatchFailures;
  console.log(mismatchFailures === 0
    ? `  ${GREEN}${BOLD}Alle Mismatch-Fälle konsistent${RESET}`
    : `  ${RED}${BOLD}${mismatchFailures} Fehler${RESET}`);

  console.log(`\n${BOLD}${CYAN}=== 4) PARTIAL_MATCH: Soft-Conflict und Dual-Dom ===${RESET}`);
  let partialFailures = 0;
  const partialCases: { label: string; soll: P; ist: P; expectedSub: FitSubtype }[] = [
    { label: "TOP_PAIR vs ORDER soft", soll: { I: 40, N: 40, A: 20 }, ist: { I: 34, N: 40, A: 26 }, expectedSub: "PARTIAL_MATCH" },
    { label: "BalFull-Cand same dom", soll: { I: 50, N: 30, A: 20 }, ist: { I: 34, N: 33, A: 33 }, expectedSub: "MISMATCH" },
    { label: "BalFull-Cand diff dom", soll: { I: 20, N: 50, A: 30 }, ist: { I: 34, N: 33, A: 33 }, expectedSub: "MISMATCH" },
    { label: "DualDom-Cand matching", soll: { I: 50, N: 30, A: 20 }, ist: { I: 40, N: 40, A: 20 }, expectedSub: "PARTIAL_MATCH" },
  ];

  for (const tc of partialCases) {
    const result = runSollIstForPair(tc.soll, tc.ist);
    const issues: string[] = [];

    if (result.fitSubtype !== tc.expectedSub) {
      issues.push(`fitSubtype ist "${result.fitSubtype}" statt "${tc.expectedSub}"`);
    }
    if (result.fitRating === "GEEIGNET" && result.summaryText.includes("nicht gegeben")) {
      issues.push(`Summary sagt "nicht gegeben" bei GEEIGNET`);
    }
    if (result.fitRating === "NICHT_GEEIGNET" && result.summaryText.includes("deckungsgleich") && !result.summaryText.includes("nicht")) {
      issues.push(`Summary sagt "deckungsgleich" bei NICHT_GEEIGNET`);
    }

    if (issues.length === 0) {
      console.log(`  ${GREEN}✅${RESET} ${pad(tc.label, 28)} → ${result.fitRating} / ${result.fitSubtype}`);
    } else {
      partialFailures += issues.length;
      console.log(`  ${RED}❌${RESET} ${pad(tc.label, 28)} → ${result.fitRating} / ${result.fitSubtype}`);
      for (const issue of issues) console.log(`     ${RED}${issue}${RESET}`);
    }
  }
  totalFailures += partialFailures;
  console.log(partialFailures === 0
    ? `  ${GREEN}${BOLD}Alle Partial-Match-Fälle konsistent${RESET}`
    : `  ${RED}${BOLD}${partialFailures} Fehler${RESET}`);

  console.log(`\n${BOLD}${CYAN}=== 5) GRENZWERT-TESTS: PERFECT-Schwelle (maxGap<8, EXACT) ===${RESET}`);
  let boundaryFailures = 0;
  const boundaryCases: { label: string; soll: P; ist: P; expectedSub: FitSubtype }[] = [
    { label: "maxGap=7 EXACT → OFF", soll: { I: 50, N: 30, A: 20 }, ist: { I: 43, N: 33, A: 24 }, expectedSub: "STRUCTURE_MATCH_INTENSITY_OFF" },
    { label: "maxGap=7 !EXACT → PARTIAL", soll: { I: 50, N: 30, A: 20 }, ist: { I: 50, N: 23, A: 27 }, expectedSub: "PARTIAL_MATCH" },
    { label: "maxGap=8 HARD → MISMATCH", soll: { I: 50, N: 30, A: 20 }, ist: { I: 50, N: 22, A: 28 }, expectedSub: "MISMATCH" },
    { label: "gap=5 → ok Severity", soll: { I: 50, N: 25, A: 25 }, ist: { I: 45, N: 30, A: 25 }, expectedSub: "PERFECT" },
    { label: "gap=6 SOFT → PARTIAL", soll: { I: 50, N: 25, A: 25 }, ist: { I: 44, N: 31, A: 25 }, expectedSub: "PARTIAL_MATCH" },
  ];

  for (const tc of boundaryCases) {
    const result = runSollIstForPair(tc.soll, tc.ist);
    const issues: string[] = [];

    if (result.fitSubtype !== tc.expectedSub) {
      issues.push(`fitSubtype ist "${result.fitSubtype}" statt "${tc.expectedSub}"`);
    }

    if (tc.expectedSub === "PERFECT") {
      for (const area of result.impactAreas) {
        if (area.severity === "critical") {
          issues.push(`Impact "${area.label}": severity="critical" bei PERFECT`);
        }
      }
    }

    if (issues.length === 0) {
      console.log(`  ${GREEN}✅${RESET} ${pad(tc.label, 25)} → ${result.fitSubtype}`);
    } else {
      boundaryFailures += issues.length;
      console.log(`  ${RED}❌${RESET} ${pad(tc.label, 25)} → ${result.fitSubtype}`);
      for (const issue of issues) console.log(`     ${RED}${issue}${RESET}`);
    }
  }
  totalFailures += boundaryFailures;
  console.log(boundaryFailures === 0
    ? `  ${GREEN}${BOLD}Alle Grenzwert-Tests bestanden${RESET}`
    : `  ${RED}${BOLD}${boundaryFailures} Grenzwert-Fehler${RESET}`);

  console.log(`\n${BOLD}${CYAN}=== 6) CROSS-VARIANT MATRIX: 13x13 mit Subtype-Verifikation ===${RESET}`);
  let matrixFailures = 0;
  const variants = Object.entries(variantProfiles);
  let matrixTotal = 0;
  const matrixIssues: string[] = [];
  const subtypeCoverage: Record<FitSubtype, number> = { PERFECT: 0, STRUCTURE_MATCH_INTENSITY_OFF: 0, PARTIAL_MATCH: 0, MISMATCH: 0 };

  for (const [sollLabel, sollP] of variants) {
    for (const [istLabel, istP] of variants) {
      matrixTotal++;
      const result = runSollIstForPair(sollP, istP);
      const expected = expectedSubtype(sollP, istP);

      subtypeCoverage[result.fitSubtype]++;

      if (result.fitSubtype !== expected) {
        matrixIssues.push(`${sollLabel}→${istLabel}: fitSubtype=${result.fitSubtype}, erwartet=${expected}`);
        matrixFailures++;
        continue;
      }

      if (result.fitSubtype === "PERFECT") {
        for (const area of result.impactAreas) {
          if (area.severity === "critical") {
            matrixIssues.push(`${sollLabel}→${istLabel} "${area.label}": severity=critical bei PERFECT`);
            matrixFailures++;
          }
        }
        if (result.finalText.includes("weicht") || result.finalText.includes("nicht deckungsgleich")) {
          matrixIssues.push(`${sollLabel}→${istLabel}: Fazit enthält Abweichungssprache bei PERFECT`);
          matrixFailures++;
        }
      }

      if (result.fitRating === "NICHT_GEEIGNET") {
        const posWords = ["deckungsgleich mit der Stellenanforderung", "Grundrichtung und Gewichtung passen"];
        for (const w of posWords) {
          if (result.finalText.includes(w)) {
            matrixIssues.push(`${sollLabel}→${istLabel}: Fazit enthält "${w}" bei NICHT_GEEIGNET`);
            matrixFailures++;
          }
        }
        for (const area of result.impactAreas) {
          if (area.severity === "ok") {
            matrixIssues.push(`${sollLabel}→${istLabel} "${area.label}": severity=ok bei NICHT_GEEIGNET`);
            matrixFailures++;
          }
        }
      }

      for (const area of result.impactAreas) {
        if (hasAffirmativeDeckungs(area.risk) && result.fitSubtype !== "PERFECT") {
          matrixIssues.push(`${sollLabel}→${istLabel} "${area.label}": affirmativ "deckungsgleich" bei ${result.fitSubtype}`);
          matrixFailures++;
        }
      }
    }
  }

  if (matrixIssues.length === 0) {
    console.log(`  ${GREEN}✅${RESET} ${matrixTotal} Kombinationen geprüft, alle konsistent`);
  } else {
    for (const issue of matrixIssues.slice(0, 25)) {
      console.log(`  ${RED}❌ ${issue}${RESET}`);
    }
    if (matrixIssues.length > 25) {
      console.log(`  ${RED}... und ${matrixIssues.length - 25} weitere Fehler${RESET}`);
    }
  }
  totalFailures += matrixFailures;
  console.log(matrixFailures === 0
    ? `  ${GREEN}${BOLD}Matrix: Alle ${matrixTotal} Kombinationen bestanden${RESET}`
    : `  ${RED}${BOLD}Matrix: ${matrixFailures} Fehler in ${matrixTotal} Kombinationen${RESET}`);

  console.log(`\n  ${DIM}Subtype-Verteilung: PERFECT=${subtypeCoverage.PERFECT}, INTENSITY_OFF=${subtypeCoverage.STRUCTURE_MATCH_INTENSITY_OFF}, PARTIAL=${subtypeCoverage.PARTIAL_MATCH}, MISMATCH=${subtypeCoverage.MISMATCH}${RESET}`);

  for (const [sub, count] of Object.entries(subtypeCoverage)) {
    if (count === 0 && sub !== "STRUCTURE_MATCH_INTENSITY_OFF") {
      console.log(`  ${YELLOW}⚠${RESET}  ${sub} hat 0 Treffer in 13x13 Matrix`);
    } else if (count === 0 && sub === "STRUCTURE_MATCH_INTENSITY_OFF") {
      console.log(`  ${DIM}ℹ  ${sub} hat 0 Treffer in 13x13 Matrix (erfordert EXACT + maxGap 6–10, separat getestet)${RESET}`);
    }
  }

  console.log(`\n${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}`);
  if (totalFailures === 0) {
    console.log(`${BOLD}${GREEN}  ✅ ALLE KONSISTENZ-TESTS BESTANDEN${RESET}`);
  } else {
    console.log(`${BOLD}${RED}  ❌ ${totalFailures} FEHLER GEFUNDEN${RESET}`);
  }
  console.log(`${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}\n`);

  return totalFailures;
}

const failures = runConsistencyTests();
process.exit(failures > 0 ? 1 : 0);
