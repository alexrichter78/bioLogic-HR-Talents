# TeamCheck-Bericht - Technische Dokumentation

## Zweck

Der TeamCheck analysiert die Passung einer Person (Kandidat oder Mitarbeiter) zu einem bestehenden Team. Er bewertet, wie gut die Persönlichkeitsstruktur der Person (Impulsiv/Intuitiv/Analytisch-Triad) zum Teamprofil passt und welche Integrationsdynamik zu erwarten ist.

---

## Architektur

### Dateien

| Datei | Rolle |
|---|---|
| `client/src/lib/teamcheck-v4-engine.ts` | Engine - Score-Berechnung, Logik und Textgenerierung (eigenständig) |
| `client/src/pages/teamcheck.tsx` | Interaktive Simulations-Seite |
| `client/src/pages/teamcheck-report-v4.tsx` | Bericht-Ansicht und PDF-Export |
| `client/src/lib/team-report-engine.ts` | Team-Report-Engine (nutzt V4 für gesamteinschaetzung/begleitungsbedarf) |
| `client/src/lib/teamcheck-v3-engine.ts` | V3-Engine (Legacy, nur noch für V3-Reports) |
| `client/src/lib/teamcheck-v2-engine.ts` | V2-Engine (Legacy, nur noch für V2/V3-Reports) |

### Engine-Architektur (V4 - aktuell)

V4 ist eigenständig und hat keine Abhängigkeit mehr zu V2/V3. Die Score-Berechnung und alle Textbausteine sind komplett in `teamcheck-v4-engine.ts` enthalten.

```
V4 (teamcheck-v4-engine.ts) — eigenständig
  ├── Score-Berechnung (Top1/Top2/Variant)
  ├── Profil-Klassifikation (BALANCED/DUAL/CLEAR/ORDER)
  ├── 15 Text-Builder-Funktionen
  └── Kein V2/V3-Import
```

V2/V3 bestehen weiterhin für Legacy-Reports (`teamcheck-report-v2.tsx`, `teamcheck-report-v3.tsx`, `teamcheck-pdf-builder.ts`).

---

## Eingabedaten (Input)

### `TeamCheckV4Input`

| Feld | Typ | Beschreibung |
|---|---|---|
| `teamProfile` | `Triad` | Triad-Werte des Teams (0-67) |
| `personProfile` | `Triad` | Triad-Werte der Person (0-67) |
| `roleTitle` | `string` | Stellenbezeichnung |
| `roleType` | `string` (optional) | "fuehrung" oder "teammitglied" |
| `teamGoal` | `TeamGoal` (optional) | "umsetzung" / "analyse" / "zusammenarbeit" / null |
| `roleLevel` | `string` (optional) | Hierarchie-Ebene |
| `taskStructure` | `string` (optional) | Aufgabenstruktur |
| `workStyle` | `string` (optional) | Arbeitslogik |
| `successFocus` | `string[]` (optional) | Erfolgsfokus-Labels |
| `candidateName` | `string` (optional) | Name der Person |

---

## Score-Formel

### Grundprinzip

Der Passungsscore setzt sich aus drei Komponenten zusammen (max. 100 Punkte):

| Komponente | Max. Punkte | Logik |
|---|---|---|
| **Top1-Match** | 60 | Stimmt die dominante Komponente von Team und Person überein? |
| **Top2-Match** | 30 | Stimmt die zweitstärkste Komponente überein? |
| **Variant-Kompatibilität** | 10 | Stimmt die Profilstruktur (Ausprägungsmuster) überein? |

### Profil-Klassifikation

| Klasse | Bedingung (EQ_TOL = 5) | Beschreibung |
|---|---|---|
| `BALANCED` | gap1 ≤ 5 UND gap2 ≤ 5 | Alle drei Werte ähnlich |
| `DUAL` | gap1 ≤ 5 UND gap2 > 5 | Zwei Werte oben, einer klar unten |
| `CLEAR` | gap1 > 5 UND gap2 ≤ 5 | Einer klar oben, zwei ähnlich unten |
| `ORDER` | gap1 > 5 UND gap2 > 5 | Klare Reihenfolge aller drei |

### BALANCED-Sonderfall

Wenn ein oder beide Profile BALANCED sind, greift eine separate Scoring-Logik:

| Konstellation | Score | Match-Case |
|---|---|---|
| Beide BALANCED | 95 | TOP1_TOP2 |
| Team BAL + Person eng | 80 | TOP1_TOP2 |
| Team BAL + Person nah | 70 | TOP1_ONLY |
| Team BAL + Person fern | 60 | TOP2_ONLY |
| Person BAL + Team nah | 75 | TOP1_ONLY |
| Person BAL + Team fern | 60 | TOP2_ONLY |

### 4 Text-Fälle (MatchCase)

| Case | Bedingung | Bedeutung |
|---|---|---|
| `TOP1_TOP2` | top1 ≥ 45 UND top2 ≥ 15 | Sehr hohe Passung |
| `TOP1_ONLY` | top1 ≥ 45 | Grundlogik passt, Arbeitsweise verschieden |
| `TOP2_ONLY` | top2 ≥ 15 | Alltagsverhalten ähnlich, Grundlogik verschieden |
| `NONE` | sonst | Deutliche Abweichung |

### Score → Qualitative Bewertung

| Score-Bereich | Passung (teamFit) | Begleitungsbedarf |
|---|---|---|
| ≥ 85 | hoch | gering |
| 60–84 | mittel | mittel |
| < 60 | gering | hoch |

---

## Ausgabedaten (Output)

### `TeamCheckV4Result`

| Feld | Typ | Beschreibung |
|---|---|---|
| `score` | `number` | Gesamtscore (0-100) |
| `scoreBreakdown` | `{top1, top2, variant}` | Aufschlüsselung der Punkteverteilung |
| `matchCase` | `MatchCase` | TOP1_TOP2 / TOP1_ONLY / TOP2_ONLY / NONE |
| `passungZumTeam` | `"hoch" / "mittel" / "gering"` | Qualitative Team-Passung |
| `beitragZurAufgabe` | `string` | Qualitative Aufgaben-Passung |
| `gesamteinschaetzung` | `string` | Gesamt-Label (z.B. "Sehr passend", "Gut passend") |
| `begleitungsbedarf` | `string` | Steuerungsaufwand |
| `systemwirkung` | `string` | Verstärkung / Stabile Ergänzung / Ergänzung mit Spannung / Transformation |
| `gesamtbewertungText` | `string` | Narrative Gesamtbewertung |
| `hauptstaerke` | `string` | Größte Stärke der Kombination |
| `hauptabweichung` | `string` | Größte Abweichung |
| `warumText` | `string` | Begründung der Bewertung |
| `wirkungAlltagText` | `string` | Alltagswirkung |
| `chancen` | `V4Block[]` | Chancen der Besetzung |
| `risiken` | `V4Block[]` | Risiken der Besetzung |
| `chancenRisikenEinordnung` | `string` | Einordnung Chancen/Risiken-Verhältnis |
| `druckText` | `string` | Verhalten unter Druck |
| `fuehrungshinweis` | `V4Block[] / null` | FK-Hinweise (nur bei Leadership) |
| `risikoprognose` | `V4RiskPhase[]` | 12-Monats-Timeline |
| `integrationsplan` | `V4IntegrationPhase[]` | 30-Tage-Onboarding-Plan |
| `intWarnsignale` | `string[]` | Warnsignale für Integration |
| `intLeitfragen` | `string[]` | Leitfragen für Führung |
| `intVerantwortung` | `string` | Verantwortungshinweis |
| `empfehlungen` | `V4Block[]` | Handlungsempfehlungen |
| `teamOhnePersonText` | `string` | Was passiert ohne die Person |
| `schlussfazit` | `string` | Abschließendes Fazit |
| `teamKontext` | `string` | Kurze Einordnung Team/Person-Vergleich |
| `sameDominance` | `boolean` | Gleiche Hauptdominanz |
| `teamPrimary / personPrimary` | `ComponentKey` | Dominante Komponenten |
| `teamTriad / personTriad` | `Triad` | Kopie der Input-Profile |

### Hilfstypen

```typescript
V4Block = { title: string; text: string }

V4RiskPhase = { label: string; period: string; text: string }

V4IntegrationPhase = {
  num: number;
  title: string;
  period: string;
  ziel: string;
  beschreibung: string;
  praxis: string[];
  signale: string[];
  fuehrungstipp: string;
  fokus: { intro: string; bullets: string[] };
}
```

---

## Engine-Funktionen (V4)

### Hauptfunktion

**`computeTeamCheckV4(input: TeamCheckV4Input): TeamCheckV4Result`**

Berechnet den Score, klassifiziert Profile, leitet qualitative Fits ab und generiert alle Textblöcke.

### Interne Funktionen

| Funktion | Erzeugt | Logik |
|---|---|---|
| `computeScore` | Score + MatchCase | Top1/Top2/Variant-Punkte mit BALANCED-Sonderfall |
| `getProfileClass` | Profilklasse | BALANCED/DUAL/CLEAR/ORDER |
| `computeTaskFit` | Aufgabenfit | Vergleicht Person- vs. Team-Wert auf der Zielkomponente |
| `computeSystemwirkung` | Systemwirkung | Verstärkung/Stabile Ergänzung/Ergänzung mit Spannung/Transformation aus MatchCase |
| `buildIntroText` | Einleitungstext | FK vs. Teammitglied Variante |
| `buildGesamtbewertungText` | Narrative Gesamtbewertung | 4 MatchCases + 3 BALANCED-Fälle + Teamziel |
| `buildHauptstaerke` | Stärke-Satz | Pro MatchCase |
| `buildHauptabweichung` | Abweichungs-Satz | Pro MatchCase |
| `buildWarumText` | Begründung | BALANCED-aware + Score-Ausgabe |
| `buildWirkungAlltagText` | Alltagswirkung | BALANCED-aware + MatchCase |
| `buildChancenRisiken` | Chancen + Risiken + Einordnung | BALANCED-Zusätze |
| `buildDruckText` | Druckverhalten | BALANCED-aware |
| `buildFuehrungshinweis` | FK-Tipps | Nur für Leadership, null sonst |
| `buildRisikoprognose` | 3 Phasen-Timeline | Pro MatchCase |
| `buildIntegrationsplan` | 30-Tage-Plan | 3 Phasen, score-abhängig |
| `buildIntegrationZusatz` | Warnsignale + Leitfragen | Score-abhängig |
| `buildEmpfehlungen` | Empfehlungen | Pro MatchCase + Teamziel |
| `buildTeamOhnePerson` | Ohne-Person-Text | Pro MatchCase |
| `buildSchlussfazit` | Fazit | Score-Bereiche + FK/Mitglied |

---

## Interaktive Seite (`teamcheck.tsx`)

### Bedienelemente

- **Profil-Slider**: Soll (Stellenprofil), Kandidat, Team
- **Kontext-Einstellungen**: Jobtitel, Abteilung, Führungstyp, Teamziel
- **teamGoal-Selector**: Keins / Umsetzung / Analyse / Zusammenarbeit

### Tabs (Detail-Ansicht)

| Tab | Inhalt |
|---|---|
| `bewertung` | Gesamtbewertung mit Passung |
| `alltag` | Wirkung im Arbeitsalltag und unter Druck |
| `chancen` | Chancen und Risiken |
| `prognose` | Risikoprognose (Timeline) |
| `empfehlung` | Handlungsempfehlungen |

### Engine-Integration

Die Seite nutzt `useMemo` um `computeTeamCheckV4` bei jeder Input-Änderung neu zu berechnen (Echtzeit-Feedback).

---

## Bericht-Ansicht (`teamcheck-report-v4.tsx`)

### Detail-Bericht (11 Sektionen)

1. **Einleitung** - Kontext der Integrationsanalyse
2. **Gesamtbewertung** - Ergebnis-Card mit Zwei-Achsen-Scores
3. **Kurzübersicht** - Visueller Vergleich Person vs. Team Dominanz
4. **Profilvergleich** - Balkendiagramme der Triad-Werte
5. **Bedeutung der Komponenten** - Drei Karten (Impulsiv, Analytisch, Intuitiv) mit Beschreibungstext
6. **Warum diese Bewertung** - Begründung der Fit-Logik
7. **Wirkung im Alltag** - Verhalten in Meetings und Entscheidungsfindung
8. **Chancen & Risiken** - Auflistung mit Titeln und Details
9. **Risikoprognose** - 12-Monats-Timeline (0-3, 3-12, 12+ Monate)
10. **Integrationsplan** - Strukturierter Onboarding-Plan
11. **Fazit** - Abschließende Bewertung

### PDF-Export

- Nutzt `html2canvas` und `jspdf`
- Mehrseitig mit automatischen Seitenumbrüchen (`data-pdf-block`)
- Print-optimiertes CSS

---

## Text-Builder: Inhaltsdokumentation

Jede Builder-Funktion erzeugt ausführliche, kontextspezifische deutsche Texte. Die Texte unterscheiden sich nach **MatchCase** (TOP1_TOP2, TOP1_ONLY, TOP2_ONLY, NONE), **BALANCED-Sonderfällen** (both-balanced, team-balanced, person-balanced) und **Rollentyp** (Führungskraft vs. Teammitglied).

### Textlänge und -stil

- Jeder Builder erzeugt **2–3 substantielle Absätze** pro Fall (getrennt durch `\n\n`)
- Texte sind in **sachlich-beratendem Ton** verfasst, nicht wertend, aber klar in der Einschätzung
- Alle Texte verwenden **"ss"** als neutrale Basis (wird per `localizeDeep()` zu ß konvertiert)
- **Dynamische Einfügungen**: Komponenten-Labels (`COMP_DOMAIN`, `COMP_SHORT`, `COMP_ADJ`), Score-Werte, Teamziel-Labels

### Builder-Übersicht

| Builder | Absätze | Branching | Inhaltsschwerpunkt |
|---|---|---|---|
| `buildIntroText` | 3 | FK/Mitglied | Zweck des Berichts, Hinweis auf Ergänzungspotential, Gliederungsübersicht |
| `buildGesamtbewertungText` | 2–3 | 7 Fälle + Teamziel | Strukturelle Passung, Übereinstimmung/Abweichung, Aufgabenbezug |
| `buildHauptstaerke` | 1 (Satz) | 5 Fälle | Kernstärke der Kombination |
| `buildHauptabweichung` | 1 (Satz) | 4 Fälle | Kernabweichung der Kombination |
| `buildWarumText` | 2–3 | 7 Fälle | Begründung der Bewertung, Score-Erläuterung |
| `buildWirkungAlltagText` | 2 | 7 Fälle, FK/Mitglied | Konkrete Alltagswirkung in Meetings, Kommunikation, Entscheidungen |
| `buildChancenRisiken` | Blöcke | 4 MatchCases + BALANCED | Chancen/Risiken-Paare mit Titeln, Einordnung nach Score-Bereich |
| `buildDruckText` | 2 | 5 Fälle | Verhalten unter Stress, Verstärkungsmuster, Eskalationshinweise |
| `buildFuehrungshinweis` | Blöcke | 3 FK-Fälle | Vertrauensaufbau, Feedback, Schutzraum (nur bei Leadership, sonst null) |
| `buildRisikoprognose` | 3 Phasen | 4 Fälle | 0–3/3–12/12+ Monate Prognose mit Risikobewertung |
| `buildIntegrationsplan` | 3 Phasen | Score/MatchCase | 30-Tage-Onboarding: Ziel, Beschreibung, Praxis, Signale, Führungstipp, Fokus |
| `buildIntegrationZusatz` | Listen | Score-abhängig | Warnsignale (6–10), Leitfragen (7), Verantwortungshinweis FK/Mitglied |
| `buildEmpfehlungen` | Blöcke | 4 Fälle + Teamziel | Konkrete Handlungsempfehlungen mit Titeln und ausführlichen Erläuterungen |
| `buildTeamOhnePerson` | 2 | 3 Fälle | Auswirkung auf Team bei Weggang, strategische Reflexion |
| `buildSchlussfazit` | 2 | 3 Score-Bereiche × FK/Mitglied | Abschliessende Empfehlung, Reflexionshinweis nach 90 Tagen |

### Branching-Logik der Texte

```
                    ┌── BALANCED × BALANCED (Sonderfall)
                    ├── Team BALANCED (3 Unterfälle nach Person-Spread)
Profil-Klasse ──────┤── Person BALANCED (2 Unterfälle nach Team-Distanz)
                    └── Normal ──┬── TOP1_TOP2 (hohe Passung)
                                ├── TOP1_ONLY (Grundlogik passt)
                                ├── TOP2_ONLY (Alltag passt)
                                └── NONE (deutliche Abweichung)

Zusätzliches Branching:
  - isLeader: ja/nein (Führungskraft vs. Teammitglied)
  - hasGoal × taskFit: hoch/mittel/gering (Funktionsziel-Bezug)
  - score-Bereiche: ≥85, 60–84, <60 (für Einordnungen und Fazit)
```

### Dynamische Labels (Konstanten)

| Konstante | Inhalt |
|---|---|
| `COMP_DOMAIN["impulsiv"]` | "Handlung und Umsetzung" |
| `COMP_DOMAIN["intuitiv"]` | "Kommunikation und Abstimmung" |
| `COMP_DOMAIN["analytisch"]` | "Struktur und Analyse" |
| `COMP_SHORT["impulsiv"]` | "Tempo und direkte Umsetzung" |
| `COMP_SHORT["intuitiv"]` | "Austausch und Miteinander" |
| `COMP_SHORT["analytisch"]` | "Struktur und Genauigkeit" |
| `COMP_ADJ["impulsiv"]` | "direkter und schneller" |
| `COMP_ADJ["intuitiv"]` | "stärker über Austausch und Abstimmung" |
| `COMP_ADJ["analytisch"]` | "genauer und strukturierter" |
| `GOAL_LABELS["umsetzung"]` | "Umsetzung und Ergebnisse" |
| `GOAL_LABELS["analyse"]` | "Analyse und Struktur" |
| `GOAL_LABELS["zusammenarbeit"]` | "Zusammenarbeit und Kommunikation" |

---

## Regionale Lokalisierung

Alle Engine-Texte verwenden "ss" als neutrale Basis. Die Lokalisierung erfolgt über `localizeDeep()` aus `region.tsx`:
- **DE/AT**: ss wird zu ß konvertiert (via `ssToSz()`)
- **CH**: ss bleibt erhalten

---

## Versionsgeschichte

| Version | Status | Beschreibung |
|---|---|---|
| V1 | Legacy | Grundlegende Systemwirkung und Impact Areas |
| V2 | Legacy | Fit-Metriken, Profilkategorisierung, Integrations-Aufwand |
| V3 | Legacy | Orchestrierung V1+V2, strategischer Fit nach Teamziel |
| V4 | **Aktiv** | Score-basiert (Top1+Top2+Variant), eigenständig, BALANCED-aware |
