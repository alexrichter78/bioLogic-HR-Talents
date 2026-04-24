# JobCheck – Entscheidungsbericht: Vollständige Logik-Dokumentation

> Stand: April 2026
> Dateien: `server/routes.ts` (Zeile 1429–1686), `client/src/lib/jobcheck-engine.ts`, `client/src/pages/jobcheck.tsx`

---

## Inhaltsverzeichnis

1. [Überblick & Architektur](#1-überblick--architektur)
2. [Datenfluss](#2-datenfluss)
3. [Profil-Berechnung (BioGramm)](#3-profil-berechnung-biogramm)
4. [Dominanzklassifikation](#4-dominanzklassifikation)
5. [Strukturvergleich (Paar-System)](#5-strukturvergleich-paar-system)
6. [KO-Regeln](#6-ko-regeln)
7. [Gesamtbewertung (computeCoreFit)](#7-gesamtbewertung-computecorefit)
8. [Führungsaufwand (calcControlIntensity)](#8-führungsaufwand-calccontrolintensity)
9. [10er-Bewertungsmatrix](#9-10er-bewertungsmatrix)
10. [Risikobewertung](#10-risikobewertung)
11. [Entwicklungsprognose](#11-entwicklungsprognose)
12. [Integrationsplan (90 Tage)](#12-integrationsplan-90-tage)
13. [Texterzeugung (keyReason & executiveSummary)](#13-texterzeugung-keyreason--executivesummary)
14. [Sekundärspannung](#14-sekundärspannung)
15. [AI-Strukturbericht (Backend)](#15-ai-strukturbericht-backend)
16. [Rollenspezifische Terminologie](#16-rollenspezifische-terminologie)
17. [Konstellationstexte](#17-konstellationstexte)
18. [KI-Schreibregeln (JobCheck & MatchCheck)](#18-ki-schreibregeln-jobcheck--matchcheck)
    - 18.1 Regeln – Deutsch (DE/CH/AT)
    - 18.2 Regeln – Englisch (EN)
    - 18.3 Regeln – Französisch (FR)
    - 18.4 Regeln – Italienisch (IT)
    - 18.5 Geltungsbereich je Report
    - 18.6 Checkliste vor jeder Prompt-Änderung

---

## 1. Überblick & Architektur

Der Entscheidungsbericht im JobCheck besteht aus **zwei unabhängigen Teilen**:

| Teil | Berechnung | Beschreibung |
|------|-----------|--------------|
| **AI-Strukturbericht** | Backend (`/api/generate-bericht`) | Beschreibt die Rolle an sich (ohne Kandidat). GPT-4.1 generiert eine Strukturanalyse basierend auf dem Rollenprofil. |
| **Soll-Ist-Vergleich** | Client (`jobcheck-engine.ts`) | Deterministischer Vergleich zwischen Rollenprofil (Soll) und Kandidatenprofil (Ist). Erzeugt Gesamtbewertung, Matrix, Risiken, Integrationsplan. |

### Ausgabe-Typ des Engine-Vergleichs (`EngineResult`)

```typescript
{
  roleDominance: DominanceResult;
  candDominance: DominanceResult;
  overallFit: FitStatus;              // "SUITABLE" | "CONDITIONAL" | "NOT_SUITABLE"
  mismatchScore: number;
  koTriggered: boolean;
  controlIntensity: ControlIntensity;  // "LOW" | "MEDIUM" | "HIGH"
  controlPoints: number;
  criticalArea: MatrixAreaId;
  criticalAreaLabel: string;
  equalDistribution: boolean;
  secondaryTension: { ... } | null;
  keyReason: string;
  executiveSummary: string;
  matrix: MatrixRow[];
  risks: { shortTerm: string[]; midTerm: string[]; longTerm: string[] };
  development: { likelihood: "hoch"|"mittel"|"gering"; timeframe: string; text: string };
  integrationPlan90: { phase_0_30: string[]; phase_30_60: string[]; phase_60_90: string[] };
}
```

---

## 2. Datenfluss

```
Stellenanalyse (Wizard)
    │
    ├── Tätigkeiten (haupt/neben/führung) → calcBG() → BioGramm-Werte (imp/int/ana %)
    ├── Rahmenbedingungen → calcRahmen() → BioGramm-Rahmen
    └── calcGesamt(haupt, neben, führung, rahmen) → Gesamtprofil
          │
          ├──→ buildRoleAnalysisFromState() → RoleAnalysis
          │         │
          │         └──→ runEngine(role, cand) → EngineResult
          │
          └──→ /api/generate-bericht → AI-Strukturbericht (JSON)
```

### Kandidat-Eingabe
Der Kandidat wird als einfache Triade eingegeben: `{ impulsiv, intuitiv, analytisch }` (Summe = 100).

---

## 3. Profil-Berechnung (BioGramm)

### calcBG(taetigkeiten)
Berechnet die BioGramm-Verteilung (Impulsiv / Intuitiv / Analytisch in %) aus einer Liste von Tätigkeiten.

**Gewichtung nach Niveau:**
| Niveau | Gewicht |
|--------|---------|
| Niedrig | 0.6 |
| Mittel | 1.0 |
| Hoch | 1.8 |

Jede Tätigkeit hat eine Kompetenz-Zuordnung (Impulsiv/Intuitiv/Analytisch). Die Gewichte werden summiert und auf 100% normalisiert.

### calcRahmen(state)
Berechnet das Rahmenprofil aus den Wizard-Eingaben:

| Eingabe (exakte Stringwerte) | Impulsiv (+1) | Intuitiv (+1) | Analytisch (+1) |
|------------------------------|---------------|----------------|------------------|
| Führung: `"Disziplinarische..."` (startsWith) | ✓ | | |
| Führung: `"Projekt-/Teamkoordination"` | | ✓ | |
| Führung: `"Fachliche Führung"` | | | ✓ |
| Erfolgsfokus-Index 0, 2 | ✓ | | |
| Erfolgsfokus-Index 1, 5 | | ✓ | |
| Erfolgsfokus-Index 3, 4 | | | ✓ |
| Aufgabencharakter: `"überwiegend operativ"` | ✓ | | |
| Aufgabencharakter: `"überwiegend systemisch"` | | ✓ | |
| Aufgabencharakter: `"überwiegend strategisch"` | | | ✓ |
| Arbeitslogik: `"Umsetzungsorientiert"` | ✓ | | |
| Arbeitslogik: `"Menschenorientiert"` | | ✓ | |
| Arbeitslogik: `"Daten-/prozessorientiert"` | | | ✓ |

### calcGesamt(haupt, neben, führung, rahmen)
- Durchschnitt aller 4 Bereiche
- **Cap bei 67%**: Wenn ein Wert > 67%, werden alle proportional skaliert
- Normalisierung auf 100% mittels `roundPct()`

---

## 4. Dominanzklassifikation

Funktion: `dominanceModeOf(triad)` → `DominanceResult`

Die drei Werte werden absteigend sortiert (top1 > top2 > top3). Dann:

| Bedingung | Modus | Bedeutung |
|-----------|-------|-----------|
| top1 ≥ 60% ODER gap1 ≥ 18 | `EXTREME_I/N/A` | Extreme Dominanz |
| gap1 ≤ 4 UND gap2 ≥ 6 | `DUAL_I_A/I_N/N_A` | Doppelschwerpunkt |
| gap1 ≥ 8 | `DOM_I/N/A` | Klare Dominanz |
| gap1 ≤ 5 UND gap2 ≤ 5 | `BAL_FULL` | Voll ausgeglichen |
| gap1 ≤ 7 UND gap2 ≤ 7 UND top1 > top2 | `BAL_I/N/A` | Ausgeglichen mit Tendenz |
| sonst | `BAL_FULL` | Fallback |

**Prüfreihenfolge**: EXTREME → DUAL → DOM → BAL_FULL → BAL_TENDENCY → Fallback

Ausgabe enthält: `{ mode, top1, top2, top3, gap1, gap2 }`

---

## 5. Strukturvergleich (Paar-System)

### Schritt 1: Varianten-Klassifikation (`getVariantMeta`)

Jedes Profil wird klassifiziert (EQ_TOL = 5):

| Bedingung | Typ | Code-Beispiel |
|-----------|-----|---------------|
| d1 ≤ 5 UND d2 ≤ 5 | `ALL_EQUAL` | `ALL_EQUAL` |
| d1 ≤ 5 (Top-Paar nah) | `TOP_PAIR` | `TOP_PAIR_analytischimpulsiv_intuitiv` |
| d2 ≤ 5 (Bottom-Paar nah) | `BOTTOM_PAIR` | `BOTTOM_PAIR_impulsiv_analytischintuitiv` |
| sonst | `ORDER` | `ORDER_impulsivanalytischintuitiv` |

### Schritt 2: Paar-Relationen (`getPairRelations`)

Drei Paare werden verglichen (I↔N, I↔A, N↔A):
- Differenz ≤ EQ_TOL → `0` (gleichwertig)
- A > B → `1`
- A < B → `-1`

### Schritt 3: Strukturvergleich (`getStructureFromPairs`)

Soll- und Ist-Relationen werden paarweise verglichen:

| Ergebnis | Bedingung |
|----------|-----------|
| `EXACT` | Alle 3 Paare identisch |
| `SOFT_CONFLICT` | Genau 1 Paar abweichend UND kein harter Flip (1↔-1) |
| `HARD_CONFLICT` | ≥2 Paare abweichend ODER mindestens 1 harter Flip |

---

## 6. KO-Regeln

Funktion: `koRuleTriggered(role, cand)` → `boolean`

Sofortiges "Nicht geeignet" wird ausgelöst bei:

| Regel | Bedingung |
|-------|-----------|
| Extreme Rolle + schwacher Kandidat | `EXTREME_I` + Rolle.imp ≥ 65% + Kand.imp ≤ 35% |
| | `EXTREME_N` + Rolle.int ≥ 55% + Kand.int ≤ 30% |
| | `EXTREME_A` + Rolle.ana ≥ 65% + Kand.ana ≤ 35% |
| Verschiedene Dominanz + grosse Abweichung | top1 verschieden + Hauptdiff ≥ 18 |
| | top1 verschieden + Rolle.gap1 ≥ 20 + Hauptdiff ≥ 15 |
| Dual-Dominanz der Rolle | Für jede Dual-Komponente: Kand < 75% des Rollenwerts |
| Führungs-KO | Führungsrolle + Führungsprofil.imp ≥ 60% + Kand.imp ≤ 35% |

---

## 7. Gesamtbewertung (computeCoreFit)

Funktion: `computeCoreFit(roleTriad, candTriad, externalKo?)` → `CoreFitResult`

### Entscheidungslogik (in Reihenfolge)

```
1. Externes KO (aus koRuleTriggered)?
   → JA: NOT_SUITABLE

2. HARD_CONFLICT (Strukturvergleich)?
   → JA: NOT_SUITABLE

3. SOFT_CONFLICT?
   → maxGap ≤ 10: CONDITIONAL
   → maxGap > 10: NOT_SUITABLE

4. EXACT (Strukturmatch):
   → maxGap ≤ 5:  SUITABLE
   → maxGap ≤ 10: CONDITIONAL
   → maxGap > 10: NOT_SUITABLE
```

### Zusätzliche Flags

| Flag | Berechnung |
|------|------------|
| `sameDom` | top1-Komponente identisch |
| `candIsBalFull` | gap1 ≤ 5 UND gap2 ≤ 5 |
| `roleIsBalFull` | gap1 ≤ 5 UND gap2 ≤ 5 |
| `effectiveSameDom` | EXACT oder SOFT_CONFLICT |
| `candDualDominance` | nicht BAL_FULL UND gap1 ≤ 5 |
| `roleClearDominance` | gap1 ≥ 15 |
| `dualConflict` | candDualDominance UND roleClearDominance UND HARD_CONFLICT |
| `equalDistConflict` | candEqualDist (BAL_FULL) UND roleClearDominance UND HARD_CONFLICT |
| `roleKeyInDual` | dualConflict UND (Rolle-top1 in Kandidat-Dual enthalten) |
| `secondaryFlipped` | EXACT UND top2-Komponenten verschieden |

### Steuerungsintensität (innerhalb computeCoreFit)

| Faktor | Punkte |
|--------|--------|
| HARD_CONFLICT | +3 |
| SOFT_CONFLICT | +2 |
| maxGap > 10 | +2 |
| maxGap > 5 (und ≤ 10) | +1 |
| Rolle ORDER/BOTTOM_PAIR + d1 > 10 | +1 |

Ergebnis: LOW (< 3), MEDIUM (3–4), HIGH (≥ 5)

---

## 8. Führungsaufwand (calcControlIntensity)

Funktion: `calcControlIntensity(role, cand)` → `{ points, level }`

Separates Punktesystem (unabhängig von computeCoreFit):

| Faktor | Punkte |
|--------|--------|
| Verschiedene effektive Dominanz ODER Dual-Modus-Mismatch | +2 |
| Rolle ist EXTREME | +1 |
| Rolle.gap1 ≥ 12 | +1 |
| Hauptabweichung ≥ 25 | +3 |
| Hauptabweichung ≥ 15 (und < 25) | +2 |
| Führungsprofil-Abweichung ≥ 15 | +2 |
| Führungsprofil vorhanden, aber kein Profil hinterlegt | +1 |
| Rahmenprofil-Top ≥ 75% + verschiedene Dominanz | +2 |
| Rahmenprofil-Top ≥ 65% (und < 75%) + verschiedene Dominanz | +1 |
| Marktdruck hoch + Impulsiv-Differenz ≥ 15 | +1 |
| Regulierung hoch + Analytisch-Differenz ≥ 15 | +1 |
| Wandel hoch + Kand.ana > Rolle.ana um ≥ 15 | +1 |

Ergebnis: **LOW** (< 3), **MEDIUM** (3–5), **HIGH** (≥ 6)

---

## 9. 10er-Bewertungsmatrix

Funktion: `buildMatrix(role, cand, t)` → `MatrixRow[]`

Jede Zeile hat: `{ areaId, areaLabel, roleDemand, candidatePattern, status, reasoning }`

### Feste Bereiche (immer enthalten)

| # | Area ID | Label |
|---|---------|-------|
| 1 | `dominance` | Dominanzstruktur |
| 2 | `decision_logic` | Entscheidungslogik |
| 3 | `kpi_work` | Arbeitssteuerung und Dokumentation |
| 4 | `conflict` | Konfliktfähigkeit |
| 5 | `competition` | Wettbewerbsdynamik |
| 6 | `culture` | Kulturwirkung |

### Dominanzstruktur – vollständige Entscheidungslogik

```
1. Kandidat ist BAL_FULL (Gleichverteilung)?
   a. Rolle.gap1 ≥ 12 → NOT_SUITABLE
   b. sonst → CONDITIONAL

2. Gleiche Dominanz? (gleicher Top1 ODER bei Dual: gleiche Dual-Paarung)
   a. diff ≤ 10 → SUITABLE
   b. diff ≤ 20 → CONDITIONAL
   c. sonst → NOT_SUITABLE (Fallthrough zu 3)

3. Verschiedene Dominanz:
   a. Rolle.gap1 ≥ 12 → NOT_SUITABLE
   b. diff ≤ 5 → CONDITIONAL
   c. diff > 20 → NOT_SUITABLE
   d. sonst → CONDITIONAL
```

### Entscheidungslogik – vollständige Entscheidungslogik

```
1. Rolle.imp ≥ 50 UND Kandidat-top1 = intuitiv → NOT_SUITABLE
2. Rolle.ana ≥ 50 UND Kandidat-top1 = impulsiv → NOT_SUITABLE
3. Gleicher top1 → SUITABLE
4. mainKeyDiff ≤ 8 → CONDITIONAL
5. mainKeyDiff ≤ 15 → CONDITIONAL
6. sonst → NOT_SUITABLE
```

### Arbeitssteuerung (KPI) – vollständige Entscheidungslogik

```
1. Rolle.ana < 20 → SUITABLE (kaum analytische Anforderung)
2. Kand.ana ≥ Rolle.ana - 5 → SUITABLE
3. Kand.ana ≥ Rolle.ana - 15 → CONDITIONAL
4. sonst → NOT_SUITABLE
```

### Konfliktfähigkeit – vollständige Entscheidungslogik

```
1. Rolle.imp ≥ 50 UND Kand.imp ≤ 35 → NOT_SUITABLE
2. Rolle.imp ≥ 45 UND Kand.imp ≤ 40 → CONDITIONAL
3. Kand.imp ≥ Rolle.imp + 20 → CONDITIONAL (Überschuss-Impulsivität)
4. |impDiff| ≤ 5 → SUITABLE
5. |impDiff| ≤ 10 → SUITABLE
6. impDiff > 10 (Rolle > Kand) → CONDITIONAL
7. sonst → SUITABLE
```

### Wettbewerbsdynamik – vollständige Entscheidungslogik

```
1. market_pressure = "hoch" UND (Rolle.imp - Kand.imp) ≥ 15 → NOT_SUITABLE
2. (Rolle.imp - Kand.imp) ≥ 10 → CONDITIONAL
3. Kand.imp ≥ Rolle.imp + 15 → CONDITIONAL (Impulsiv-Überschuss)
4. |impGap| ≤ 8 → SUITABLE
5. sonst → CONDITIONAL
```

### Kulturwirkung – vollständige Entscheidungslogik

```
1. Rolle.imp ≥ 60 UND Kand.int ≥ 50 → CONDITIONAL
2. Rolle.imp ≥ 55 UND Kand.imp < 30 → NOT_SUITABLE
3. Gleiche Dominanz UND |int-Diff| ≤ 10 → SUITABLE
4. Kand.int ≥ 45 UND Rolle.imp < 55 → SUITABLE
5. Gleiche Dominanz UND |top1-Diff| ≤ 8 → SUITABLE
6. sonst → CONDITIONAL
```

### Bedingte Bereiche (nur bei Führung / Umgebungstags)

| # | Area ID | Label | Bedingung |
|---|---------|-------|-----------|
| 7 | `leadership_effect` | Führungswirkung | Nur bei `role.leadership.required === true` |
| 8 | `strategy_complexity` | Strategische Komplexität | Nur bei `sales_cycle === "lang"` |
| 9 | `regulatory_precision` | Regulatorische Präzision | Nur bei `regulation === "hoch"` |
| 10 | `customer_orientation` | Kundenorientierung | Nur bei `customer_type` vorhanden |

### Führungswirkung – Detail

| Bedingung | Status |
|-----------|--------|
| Führungsprofil.imp ≥ 60% + Kand.imp ≤ 35% | NOT_SUITABLE |
| Führungsprofil.imp ≥ 55% + Kand ist intuitiv-dominant | CONDITIONAL |
| Lead-Diff ≤ 10 + gleiche Dominanz | SUITABLE |
| Lead-Diff ≤ 15 | CONDITIONAL |
| Lead-Diff > 15 | NOT_SUITABLE |

### Kritischster Bereich (`criticalAreaFromMatrix`)

Die Zeile mit dem schlechtesten Status wird als `criticalArea` zurückgegeben.
Scoring: NOT_SUITABLE = 2, CONDITIONAL = 1, SUITABLE = 0.

---

## 10. Risikobewertung

Funktion: `buildRisks(role, cand, engine, t)` → `{ shortTerm, midTerm, longTerm }`

### Grundstruktur nach overallFit

| overallFit | Kurz | Mittel | Lang |
|------------|------|--------|------|
| **SUITABLE** | Arbeitsweise passt, schnelle Einarbeitung | Eigenständiges Priorisieren, wenig Führungsaufwand | Langfristig stabil |
| **CONDITIONAL** | Höchste Anforderung = grösste Abweichung; guter Start möglich mit Führung | Prioritäten/Umsetzung werden weicher ohne Führung | Fokus verschiebt sich, Effektivität nimmt ab |
| **NOT_SUITABLE** | Bereits in Einarbeitung Reibung zu erwarten | Systematisches Abweichen von Rollenanforderungen | Kernanforderungen dauerhaft nicht erreicht |

### Sonderpfade bei NOT_SUITABLE

| Szenario | Spezialtexte |
|----------|--------------|
| `equalDistConflict` | Orientierungslosigkeit, situatives statt rollengerechtes Reagieren |
| `dualConflict + !roleKeyInDual` | Rolle-Top nicht in Kandidat-Stärken enthalten |
| generisch | Arbeitsweise weicht grundlegend ab, Reibung ab Einarbeitung |

> **Hinweis:** `dualConflict + roleKeyInDual` wird im `buildRisks`-Code über `overallFit` gesteuert, nicht über den Flag allein. Wenn `overallFit === "NOT_SUITABLE"`, greift der generische NOT_SUITABLE-Pfad. `dualConflict`-spezifische Texte erscheinen nur, wenn `overallFit === "CONDITIONAL"` ist.

### Sonderpfade bei CONDITIONAL

| Szenario | Spezialtexte |
|----------|--------------|
| `dualConflict` | Doppeldominanz: Wechsel zwischen zwei Prioritäten |

### Zusätzliche Risiken nach kritischem Bereich

Für jeden `criticalArea`-Wert (conflict, decision_logic, kpi_work, leadership_effect, competition, culture) werden je 1 midTerm- und 1 longTerm-Text hinzugefügt.

### Gleichverteilungs-Risiko

Wenn `candEqualDist === true`:
- midTerm: Unter Stress fehlt Leitstruktur → widersprüchliche Entscheidungen
- longTerm: Fehlende Vorhersagbarkeit der Stressreaktionen

### Umgebungs-Risiken

- `market_pressure === "hoch"` → longTerm-Zusatz
- `regulation === "hoch"` → longTerm-Zusatz

---

## 11. Entwicklungsprognose

Funktion: `developmentFromControl(control, points, criticalLabel, t, roleDom, candDom)`

### devControl-Ableitung (in runEngine)

| overallFit | devControl |
|------------|------------|
| NOT_SUITABLE | HIGH |
| CONDITIONAL | MEDIUM |
| SUITABLE + coreFit.controlIntensity LOW | LOW |
| SUITABLE + coreFit.controlIntensity nicht LOW | MEDIUM |

### Prognose-Ausgabe

| devControl | Wahrscheinlichkeit | Zeitrahmen | Textmuster |
|------------|-------------------|-----------|------------|
| LOW | hoch | 3–6 Monate | Grundlogik stimmt, regelmässiges Feedback reicht |
| MEDIUM | mittel | 6–12 Monate | Gezielte Nachjustierung im kritischen Bereich nötig |
| HIGH | gering | >12 Monate | Intensiver Begleitung nötig, Ergebnis nicht sicher |

---

## 12. Integrationsplan (90 Tage)

Funktion: `integrationPlan(role, criticalArea, control, t)`

### Grundstruktur (immer enthalten)

**Phase 0–30:**
- Onboarding: Verantwortungsbereich, Befugnisse, Eskalationswege, KPIs schriftlich
- 90-Tage-Ziele: messbar, terminiert, mit Abstimmungsterminen
- Top-3-Herausforderungen identifizieren

**Phase 60–90 (immer am Ende):**
- 90-Tage-Review mit KPIs und Prozessqualität (+ Führungswirkung bei Führungsrollen)

### Bereichsspezifische Massnahmen nach criticalArea

| criticalArea | Phase 0–30 | Phase 30–60 | Phase 60–90 |
|-------------|-----------|------------|-------------|
| `conflict` | Eskalationsregeln festlegen | Konfliktverhalten begleiten | Eigenständiges Ansprechen prüfen |
| `decision_logic` | Entscheidungsfristen festlegen | Entscheidungstempo beobachten | Tempo vs. Anforderungen prüfen |
| `kpi_work` | Reporting-Standards festlegen | Reporting-Disziplin prüfen | Transparenz über Zielerreichung prüfen |
| `leadership_effect` | Führungsanforderungen festhalten | Führungswirkung beobachten | Teamrichtung + Prioritäten prüfen |
| `competition` | Ziele mit Wettbewerbsmetriken festlegen | Proaktivität beobachten | Ergebnis im Zielkorridor? |
| `culture` | Kulturelle Erwartungen festlegen | Kulturelle Wirkung beobachten | Leistungskultur stabil? |

### Zusätzliche Massnahmen nach Umgebung

| Tag | Phase 0–30 | Phase 30–60 |
|-----|-----------|------------|
| `market_pressure === "hoch"` | Schnelle Entscheidungswege festlegen | Reaktionsgeschwindigkeit beobachten |
| `regulation === "hoch"` | Qualitäts-/Regelwerksstandards dokumentieren | Qualitätsprüfungen in Routine überführen |

### HIGH-Control-Zusatz

Bei `control === "HIGH"`:
- Phase 0–30: Wöchentliches Führungsgespräch
- Phase 30–60: Gezielt am kritischen Verhalten arbeiten
- Phase 60–90: Go/No-Go-Entscheidung anhand messbarer Kriterien

---

## 13. Texterzeugung (keyReason & executiveSummary)

### keyReason – Entscheidungspfade

| Priorität | Bedingung | Textinhalt |
|-----------|-----------|------------|
| 1 | `equalDistConflict` | Rolle braucht klare X-Ausrichtung, Person hat keinen Schwerpunkt |
| 2 | `dualConflict + roleKeyInDual` | Rolle-Kompetenz vorhanden, aber konkurrierende Zweitstärke |
| 3 | `dualConflict + !roleKeyInDual` | Rolle-Kompetenz nicht in Kandidat-Stärken enthalten |
| 4 | `overallFit === SUITABLE` | Gleiche Grundlogik, handhabbare Unterschiede |
| 5 | `secondaryFlipped + NOT_SUITABLE` | Gleiche Dominanz, aber falsche Zweitstärke (grundlegend) |
| 6 | `secondaryFlipped + sameDom + CONDITIONAL` | Gleiche Dominanz, Zweitstärke gemischt (mit Führung machbar) |
| 7 | `sameDom + CONDITIONAL` | Gleiche Dominanz, aber Ausprägung zu schwach |
| 8 | `CONDITIONAL (sonst)` | Andere Arbeitsweise, erhöhter Abstimmungsbedarf |
| 9 | Fallback | Unterschiedliche Prinzipien, erheblicher Führungsaufwand |

### executiveSummary – Aufbau

Drei Zeilen:
1. `Stelle: {jobTitle} | {candName}`
2. `Gesamteinstufung: {label} · Führungsaufwand: {label}`
3. Domänenbeschreibung (6 Pfade: equalDistConflict, dualConflict, sameDom+secFlipped+gap>5, sameDom+secFlipped, sameDom, sonst)

---

## 14. Sekundärspannung

Berechnung in `runEngine()`, nach der Gesamtbewertung.

**Voraussetzungen** (alle müssen gelten):
- `sameDom === true` (gleicher Top-1)
- Kein `equalDistConflict`
- Kein `dualConflict`
- Top-2 von Rolle ≠ Top-2 von Kandidat
- Differenz zwischen Kandidat-Top2 und Kandidat-Wert-der-Rolle-Top2 ≥ 3

**Ausgabe:**
- `text`: Beschreibt den Sekundärkonflikt (Hauptausrichtung stimmt, Zweitstärke weicht ab)
- `stressText`: Beschreibt Verhalten unter Stress (Kandidat greift auf andere Zweitstärke zurück)
- Wird zu `risks.midTerm` hinzugefügt

---

## 15. AI-Strukturbericht (Backend)

Endpunkt: `POST /api/generate-bericht`

### Input-Parameter

```typescript
{
  beruf: string;            // Berufsbezeichnung
  bereich?: string;         // Bereich/Abteilung
  fuehrungstyp?: string;    // Art der Führung
  aufgabencharakter?: string;
  arbeitslogik?: string;
  erfolgsfokusLabels?: string[];
  taetigkeiten?: Array<{ name, kategorie, kompetenz, niveau }>;
  gesamt?: BG;              // BioGramm-Werte
  haupt?: BG;
  neben?: BG;
  fuehrungBG?: BG;
  rahmen?: BG;
  profileType?: string;     // z.B. "strong_imp", "hybrid_imp_ana"
  intensity?: string;       // "strong" | "clear" | "light" | "balanced"
  isLeadership?: boolean;
  region?: string;
}
```

### Prompt-Aufbau

1. **Rollenkontext**: Beruf, Bereich, Führungsverantwortung, Aufgabencharakter, Arbeitslogik, Erfolgsfokus
2. **Profilklassifikation**: profileType + intensity + Textbeschreibung
3. **Abstandsanalyse** (`describeGaps`): Pro Bereich (Gesamt, Tätigkeiten, Human, Rahmen, ggf. Führung)
4. **Berechnete Profilwerte**: Exakte Prozentwerte
5. **Kompetenzbereiche**: Definition Impulsiv/Intuitiv/Analytisch
6. **Profildaten nach Niveau**: Hoch/Mittel/Gering geordnet
7. **Niveau-Regeln**: Wie Niveau-Hoch/-Mittel/-Gering in Texte einfliessen
8. **Stil und Ton**: Direkt, professionell, nüchtern
9. **Wichtige Regeln**: Keine Prozentzahlen, keine Gedankenstriche, Abstandsanalyse nutzen
10. **JSON-Ausgabeformat**: Exakte Struktur

### Abstandsanalyse-Schwellen (`describeGaps`)

| Bedingung | Label |
|-----------|-------|
| Gesamtspanne ≤ 6 | GLEICHGEWICHT |
| Top1 ≥ 55% | STARKE DOMINANZ |
| gap12 ≥ 15 | HOHE DOMINANZ |
| gap12 ≥ 8 | DEUTLICHE DOMINANZ |
| gap12 ≤ 5 UND gap23 > 5 | DOPPELSTRUKTUR |
| gap12 ≥ 5 | LEICHTE TENDENZ |
| sonst | AUSGEGLICHEN |

### Profiltypen (profileType)

| Code | Beschreibung |
|------|--------------|
| `balanced_all` | Ausgeglichen, keine Spezialisierung |
| `strong_imp` | Stark Impulsiv-dominiert (Handlungs-/Umsetzungskompetenz) |
| `strong_ana` | Stark Analytisch-dominiert (Fach-/Methodenkompetenz) |
| `strong_int` | Stark Intuitiv-dominiert (Sozial-/Beziehungskompetenz) |
| `dominant_imp/ana/int` | Deutliche Dominanz, nicht übermässig |
| `light_imp/ana/int` | Leichte Tendenz |
| `hybrid_imp_ana` | Impulsiv-Analytische Doppelstruktur |
| `hybrid_ana_int` | Analytisch-Intuitive Doppelstruktur |
| `hybrid_imp_int` | Impulsiv-Intuitive Doppelstruktur |

### JSON-Ausgabeformat

```json
{
  "rollencharakter": "Beschreibender Satz",
  "dominanteKomponente": "z.B. 'Impulsiv mit analytischer Stabilisierung'",
  "einleitung": "2-3 Absätze (\\n\\n getrennt)",
  "gesamtprofil": "3-4 Absätze",
  "rahmenbedingungen": {
    "beschreibung": "2-3 Absätze",
    "verantwortungsfelder": ["...", "... (min 5)"],
    "erfolgsmessung": ["...", "... (min 4)"],
    "spannungsfelder_rahmen": ["X vs. Y", "... (min 3)"]
  },
  "fuehrungskontext": {
    "beschreibung": "2-3 Absätze",
    "wirkungshebel": ["...", "... (min 4 bei Führung, min 3 ohne)"],
    "analytische_anforderungen": ["... (nur bei Führung, min 3)"],
    "schlusssatz": "1 Satz"
  },
  "kompetenzanalyse": {
    "taetigkeiten_text": "2 Absätze",
    "taetigkeiten_anforderungen": ["... (min 5)"],
    "taetigkeiten_schluss": "1 Satz",
    "human_text": "2 Absätze",
    "human_anforderungen": ["... (min 5)"],
    "human_schluss": "1 Satz"
  },
  "spannungsfelder": ["X vs. Y (min 4)"],
  "spannungsfelder_schluss": "Zusammenfassender Satz",
  "risikobewertung": [
    {
      "label": "Szenario-Name",
      "bullets": ["Konsequenz (min 4)"],
      "alltagssatz": "Im Alltag entsteht..."
    }
  ],
  "fazit": {
    "kernsatz": "1-2 Sätze",
    "persoenlichkeit": ["Eigenschaft (min 5)"],
    "fehlbesetzung": "1 Satz",
    "schlusssatz": "1 Satz"
  }
}
```

### AI-Konfiguration

- **Modell**: GPT-4.1
- **Temperature**: 0.7
- **Response-Format**: `json_object`
- **AI-Limit**: Pro User wird geprüft (`checkAiLimit`)
- **Usage-Tracking**: Event `"rollendna"` wird getrackt

### Stilregeln im Prompt

1. Keine Prozentzahlen in Texten (Grafiken zeigen sie)
2. Keine Gedankenstriche (–)
3. Abstandsanalyse exakt nutzen (GLEICHGEWICHT → kein Dominieren beschreiben)
4. Intensitäts-spezifische Sprache (strong/clear/light/balanced)
5. Führungsrollen: disziplinarisch vs. fachlich vs. Koordination unterscheiden
6. Ohne Führung: Wirkung über Expertise, Performance, Überzeugungskraft
7. Rollenspezifisches Vokabular (Branche beachten)
8. Niveau-Hoch besonders betonen, Niveau-Gering nur beiläufig
9. Risiko-Szenarien immer mit "Im Alltag entsteht…"
10. Fazit: "Entscheidend für die Besetzung ist eine Persönlichkeit, die:" + Bullet-Liste

---

## 16. Rollenspezifische Terminologie

Funktion: `detectRoleCategory(jobFamily, jobTitle)` → `RoleCategory`

11 Kategorien mit Regex-Pattern-Matching:

| Kategorie | Erkennung (Beispiele) | KPI-Vokabular |
|-----------|----------------------|---------------|
| `vertrieb` | vertrieb, sales, account | Abschlussquoten, Pipeline, Umsatz |
| `bildung` | ausbildung, lehre, dozent | Ausbildungsqualität, Lernfortschritt |
| `technik` | IT, software, engineering | Systemstabilität, Codequalität |
| `produktion` | fertigung, logistik, montage | Durchlaufzeit, Ausschuss, OEE |
| `pflege` | gesundheit, medizin, therapeut | Versorgungsqualität, Betreuungsschlüssel |
| `finanzen` | controlling, buchhaltung | Abschlussqualität, Audit-Ergebnisse |
| `hr` | personal, recruiting | Besetzungszeit, Fluktuation |
| `marketing` | marketing, werbung, content | Kampagnen-Performance, Conversion |
| `fuehrung` | geschäftsführer, CEO, vorstand | Unternehmensergebnisse, Strategieumsetzung |
| `verwaltung` | administration, sachbearbeitung | Bearbeitungszeit, Fehlerquote |
| `generic` | Fallback | Zielerreichung, Qualitätskennzahlen |

Jede Kategorie hat ein `RoleTerms`-Objekt mit:
`kpiExamples, forecastTerm, reportingDesc, qualityMetric, pipelineTerm, escalationExample, competitionMetrics, resultMetric, targetTerm, tempoContext`

---

## 17. Konstellationstexte

### Konstellationstypen (`detectConstellation`)

Basierend auf sortierter Triade (top, mid, bottom):

| Bedingung | Typ | Bedeutung |
|-----------|-----|-----------|
| range ≤ 8 | BALANCED | Keine Einseitigkeit |
| d12 ≥ 15 | H_DOM / B_DOM / S_DOM | Klare Dominanz |
| d12 ≤ 5 | H_NEAR_B / H_NEAR_S / B_NEAR_S | Doppeltendenz |
| sonst | H_GT_B / H_GT_S / B_GT_H / B_GT_S / S_GT_H / S_GT_B | Moderate Rangfolge |

Abkürzungen: H = Impulsiv (Handlung), B = Intuitiv (Beziehung), S = Analytisch (Struktur)

### Rollentext (`constellationRoleText`)

Beschreibt, wie die Stelle wirkt. Beispiele:
- `H_DOM`: "wirkt über Geschwindigkeit, Priorisierung und direkte Umsetzung"
- `B_NEAR_S`: "verbindet Beziehungsgestaltung und analytische Absicherung"

### Kandidatentext (`constellationCandText`)

Beschreibt, wie der Kandidat arbeitet. Beispiele:
- `H_GT_S`: "arbeitet schnell und entscheidungsorientiert, sichert aber über Struktur ab"
- `BALANCED`: "ausgeglichenes Profil ohne klare Einseitigkeit"

---

## Zusammenfassung: Entscheidungsbaum

```
Eingabe: Rollenprofil (Soll) + Kandidatenprofil (Ist)
    │
    ├── dominanceModeOf(Soll), dominanceModeOf(Ist)
    ├── koRuleTriggered? ──→ JA → NOT_SUITABLE
    │
    ├── getVariantMeta + getPairRelations + getStructureFromPairs
    │     ├── HARD_CONFLICT ──→ NOT_SUITABLE
    │     ├── SOFT_CONFLICT + maxGap ≤ 10 ──→ CONDITIONAL
    │     ├── SOFT_CONFLICT + maxGap > 10 ──→ NOT_SUITABLE
    │     ├── EXACT + maxGap ≤ 5 ──→ SUITABLE
    │     ├── EXACT + maxGap ≤ 10 ──→ CONDITIONAL
    │     └── EXACT + maxGap > 10 ──→ NOT_SUITABLE
    │
    ├── calcControlIntensity → LOW / MEDIUM / HIGH
    ├── buildMatrix → 6–10 Bewertungsbereiche
    ├── criticalAreaFromMatrix → Schwächster Bereich
    ├── keyReason → Textuelle Begründung
    ├── executiveSummary → 3-Zeilen-Zusammenfassung
    ├── secondaryTension → Zweitstärken-Konflikt (optional)
    ├── buildRisks → kurz/mittel/langfristige Risiken
    ├── developmentFromControl → Entwicklungsprognose
    └── integrationPlan → 90-Tage-Plan (3 Phasen)
```

---

## 18. KI-Schreibregeln (JobCheck & MatchCheck)

Diese Regeln gelten verbindlich für alle KI-generierten Texte in beiden Berichten: den **JobCheck-Entscheidungsbericht** (`/api/generate-bericht`) und den **MatchCheck-Passungsbericht** (`/api/generate-soll-ist-narrative`). Sie sind in den jeweiligen System-Prompts hinterlegt und müssen bei jeder Prompt-Änderung erhalten bleiben.

---

### 18.1 Regeln – Deutsch (DE/CH/AT)

#### Verboten

| Regel | Falsch | Richtig |
|-------|--------|---------|
| **Keine Prozentzahlen oder Zahlenwerte** im Ausgabetext | "Die impulsive Komponente liegt bei 52 %" | "Tempo und Entscheidung steht klar im Vordergrund" |
| | "Abstand von 3 Punkten" | "nahezu gleichauf" |
| | "knapp 40" | "erkennbar im Hintergrund" |
| **Keine Modellbegriffe** (bioLogic-intern) | "impulsiv", "intuitiv", "analytisch" | "Tempo und Entscheidung", "Kommunikation und Beziehung", "Struktur und Sorgfalt" |
| | "Komponente", "Triade", "Profilklasse" | "Schwerpunkt", "Hauptfokus", "begleitet die Stelle" |
| | "BAL_FULL", "DUAL_TOP", "CLEAR_TOP", "ORDER", "Gap" | Klartext-Beschreibung |
| **Keine Gedankenstriche** (– oder —) im Fließtext | "Die Person handelt schnell – manchmal zu schnell" | Satz aufteilen oder Doppelpunkt |
| **Kein Passiv** | "Es sollte sichergestellt werden, dass …" | "Wer hier sitzt, stellt sicher, dass …" |
| **Keine Disclaimer** im Berichtskörper | "wertfrei zu verstehen", "ersetzt keine Einzelfallbetrachtung", "Tendenzen, keine starren Bilder" | Dieser Hinweis steht separat im Bericht |
| **Keine Floskeln** | "im Rahmen eines ganzheitlichen Ansatzes", "ein signifikanter Mehrwert" | Direkter Satz mit konkreter Aussage |

#### Geboten: Qualitative Intensitätsvokabeln

Wenn über Verhältnisse zwischen den drei Schwerpunkten gesprochen wird:

| Verhältnis | Vokabeln (Beispiele) |
|------------|----------------------|
| Klare Dominanz | "deutlich im Vordergrund", "klar dominierend", "eindeutig prägend" |
| Mässige Dominanz | "erkennbar führend", "deutlich davor", "merklich stärker" |
| Leichte Tendenz | "leichte Ausrichtung", "knapp davor", "erkennbare Tendenz" |
| Nahezu gleichauf | "nahezu gleichauf", "praktisch gleichauf", "ähnlich stark ausgeprägt" |
| Sekundär | "klar mitprägend", "spürbar vorhanden", "begleitet den Schwerpunkt" |
| Im Hintergrund | "im Hintergrund", "erkennbar nachrangig", "deutlich sekundär" |

#### Drei Schwerpunkte – Klartext-Labels (DE)

| bioLogic-intern | Klartext im Bericht |
|-----------------|---------------------|
| Impulsiv | **Tempo und Entscheidung** |
| Intuitiv | **Kommunikation und Beziehung** |
| Analytisch | **Struktur und Sorgfalt** |

#### Tonalität

- Direkt, aktiv, haltungsstark. Keine akademische Umständlichkeit.
- Jeder Absatz endet mit einer klaren Aussage: Was bedeutet das für die Besetzung?
- Rollenspezifisches Vokabular verwenden (siehe Abschnitt 16 für Branchenterminologie).
- Für den JobCheck: Risikobeschreibungen enden immer mit "Im Alltag entsteht …"

---

### 18.2 Regeln – Englisch (EN)

#### Verboten

| Regel | Wrong | Right |
|-------|-------|-------|
| **No numbers or percentages** in output text | "Impulsive drive at 40% vs. 45%" | "both profiles are closely matched on pace" |
| | "a gap of 3 points" | "slightly ahead", "noticeably higher" |
| | "around 52" | "clearly in the foreground" |
| **No model jargon** (bioLogic-internal) | "impulsive", "intuitive", "analytical" | "Pace and Decision", "Communication and Relationships", "Structure and Diligence" |
| | "component", "triad", "profile class", "gap", "BAL_FULL", "top1/top2/top3" | plain-English labels |
| **No em-dashes** (– or —) in prose | "acts quickly — sometimes too quickly" | split into two sentences |
| **No passive voice** | "it should be ensured that …" | "whoever fills this role ensures …" |
| **No disclaimers** inside the report body | "value-free", "does not replace individual assessment" | shown separately in the report |
| **No filler phrases** | "in the context of a holistic approach", "a significant added value" | direct sentence with a concrete point |

#### Required: Qualitative Intensity Vocabulary

| Relationship | Vocabulary (examples) |
|-------------|----------------------|
| Clear dominance | "clearly in the foreground", "clearly dominant", "unmistakably shapes the role" |
| Moderate dominance | "noticeably ahead", "clearly stronger", "markedly more prominent" |
| Slight tendency | "slightly ahead", "a recognisable lean", "just ahead" |
| Practically on par | "practically on par", "closely matched", "similar in weight" |
| Secondary | "supports the role", "noticeably present", "plays a clear secondary part" |
| Background | "in the background", "clearly secondary", "plays a supporting role" |

#### Three Focus Areas – Plain-English Labels (EN)

| bioLogic-internal | Plain label in report |
|-------------------|-----------------------|
| Impulsiv | **Pace and Decision** |
| Intuitiv | **Communication and Relationships** |
| Analytisch | **Structure and Diligence** |

#### Tone

- Short sentences. Active voice. No coaching-speak, no intensifiers ("really", "extremely").
- Each section: key statement first → brief justification → one concrete implication.
- Refer concretely to role title, named tasks, context — never generic.
- No repetition between sections.

---

### 18.3 Regeln – Französisch (FR)

#### Interdit

| Règle | Faux | Correct |
|-------|------|---------|
| **Pas de chiffres ni de pourcentages** dans le texte de sortie | "La composante impulsive est à 40 %" | "le rythme et la décision sont clairement au premier plan" |
| | "un écart de 3 points" | "légèrement en tête", "nettement plus élevé" |
| **Pas de jargon de modèle** (interne bioLogic) | "impulsif", "intuitif", "analytique" | "Rythme et Décision", "Communication et Relations", "Structure et Rigueur" |
| | "composante", "triade", "classe de profil", "gap" | description en langage clair |
| **Pas de tirets cadratins** (– ou —) dans le texte courant | "agit vite — parfois trop" | séparer en deux phrases |
| **Pas de voix passive** | "il convient de s'assurer que …" | "celui qui occupe ce poste s'assure que …" |
| **Pas d'avertissements** dans le corps du rapport | "à comprendre sans jugement de valeur" | mentionné séparément dans le rapport |
| **Pas de formules creuses** | "dans le cadre d'une approche globale" | phrase directe avec une affirmation concrète |

#### Obligatoire : vocabulaire d'intensité qualitatif

| Relation | Vocabulaire (exemples) |
|----------|------------------------|
| Dominance claire | "clairement au premier plan", "nettement dominant", "marque indubitablement le rôle" |
| Dominance modérée | "nettement en tête", "clairement plus fort", "sensiblement plus marqué" |
| Légère tendance | "légèrement en tête", "tendance perceptible", "juste devant" |
| Pratiquement à égalité | "pratiquement à égalité", "très proches", "de force comparable" |
| Secondaire | "présent de manière perceptible", "accompagne clairement le profil dominant" |
| En retrait | "en arrière-plan", "clairement secondaire", "joue un rôle de soutien" |

#### Trois axes – Labels clairs (FR)

| Interne bioLogic | Label dans le rapport |
|------------------|-----------------------|
| Impulsiv | **Rythme et Décision** |
| Intuitiv | **Communication et Relations** |
| Analytisch | **Structure et Rigueur** |

#### Tonalité

- Phrases courtes. Voix active. Pas de langage de coaching ni de superlatifs ("vraiment", "extrêmement").
- Chaque section : affirmation clé en premier → brève justification → une implication concrète.
- Référence concrète au titre du poste, aux tâches nommées, au contexte — jamais de généralités.
- Pas de répétition entre les sections.

---

### 18.4 Regeln – Italienisch (IT)

#### Vietato

| Regola | Sbagliato | Corretto |
|--------|-----------|----------|
| **Nessun numero né percentuale** nel testo prodotto | "La componente impulsiva è al 40 %" | "il ritmo e la decisione sono chiaramente in primo piano" |
| | "una differenza di 3 punti" | "leggermente avanti", "notevolmente più elevato" |
| **Nessun gergo di modello** (interno a bioLogic) | "impulsivo", "intuitivo", "analitico" | "Ritmo e Decisione", "Comunicazione e Relazioni", "Struttura e Rigore" |
| | "componente", "triade", "classe di profilo", "gap" | descrizione in linguaggio chiaro |
| **Nessun trattino em** (– o —) nel testo corrente | "agisce rapidamente — a volte troppo" | separare in due frasi |
| **Nessun passivo** | "dovrebbe essere garantito che …" | "chi ricopre questo ruolo garantisce che …" |
| **Nessun disclaimer** nel corpo del rapporto | "da intendere senza giudizio di valore" | indicato separatamente nel rapporto |
| **Nessuna formula vuota** | "nell'ambito di un approccio olistico" | frase diretta con affermazione concreta |

#### Obbligatorio: vocabolario di intensità qualitativo

| Relazione | Vocabolario (esempi) |
|-----------|----------------------|
| Dominanza chiara | "chiaramente in primo piano", "nettamente dominante", "segna inequivocabilmente il ruolo" |
| Dominanza moderata | "chiaramente in testa", "sensibilmente più forte", "marcatamente più prominente" |
| Leggera tendenza | "leggermente in testa", "tendenza percettibile", "appena davanti" |
| Praticamente in parità | "praticamente in parità", "molto simili", "di forza comparabile" |
| Secondario | "presente in modo percettibile", "accompagna chiaramente il profilo dominante" |
| In secondo piano | "in secondo piano", "chiaramente secondario", "svolge un ruolo di supporto" |

#### Tre assi – Label chiari (IT)

| Interno bioLogic | Label nel rapporto |
|------------------|--------------------|
| Impulsiv | **Ritmo e Decisione** |
| Intuitiv | **Comunicazione e Relazioni** |
| Analytisch | **Struttura e Rigore** |

#### Tono

- Frasi brevi. Voce attiva. Nessun linguaggio da coaching né superlativi ("davvero", "estremamente").
- Ogni sezione: affermazione chiave prima → breve giustificazione → un'implicazione concreta.
- Riferimento concreto al titolo del ruolo, ai compiti nominati, al contesto — mai generico.
- Nessuna ripetizione tra le sezioni.

---

### 18.5 Geltungsbereich je Report

| Report | Endpunkt | Regeln gelten für |
|--------|----------|-------------------|
| JobCheck – Stellenanalyse | `POST /api/generate-bericht` | Alle Textfelder im JSON-Output (einleitung, gesamtprofil, rahmenbedingungen, fuehrungskontext, kompetenzanalyse, spannungsfelder, risikobewertung, fazit) |
| MatchCheck – Passungsbericht | `POST /api/generate-soll-ist-narrative` | Alle Textfelder im JSON-Output (summaryText, executiveBullets, constellationRisks, dominanceShiftText, developmentText, actions, finalText) |

> **Hinweis zur Umsetzung:** Die Prozentwerte werden dem Modell im User-Prompt als Eingabedaten übergeben, damit es die Verhältnisse korrekt einordnen kann. Das Modell muss diese Zahlen jedoch **nicht** in den generierten Text übernehmen — ausschliesslich qualitative Beschreibungen verwenden. Der System-Prompt enthält dazu den expliziten Hinweis: *"These numbers are for context only. DO NOT reproduce them in the text."*

---

### 18.6 Checkliste vor jeder Prompt-Änderung

Bevor ein System- oder User-Prompt in diesen Endpunkten geändert wird, sicherstellen:

- [ ] Verbot von Prozentzahlen und Zahlenwerten im Text vorhanden?
- [ ] Verbot der Modellbegriffe (impulsiv/intuitiv/analytisch/Komponente/Triade) vorhanden?
- [ ] Klartext-Labels definiert (DE: Tempo/Kommunikation/Struktur — EN: Pace/Communication/Structure — FR: Rythme/Communication/Structure — IT: Ritmo/Comunicazione/Struttura)?
- [ ] Qualitative Intensitätsvokabeln als Beispiele angegeben?
- [ ] Verbot von Gedankenstrichen (DE/FR/IT) / em-dashes (EN) vorhanden?
- [ ] Kein Passiv (alle Sprachen) / Active voice verlangt?
- [ ] Verbot von Disclaimern im Berichtstext vorhanden?
- [ ] Hinweis im User-Prompt: Zahlen sind nur Kontext, nicht für den Text übernehmen?
