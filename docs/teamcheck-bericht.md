# TeamCheck-Bericht - Technische Dokumentation

## Zweck

Der TeamCheck analysiert die Passung einer Person (Kandidat oder Mitarbeiter) zu einem bestehenden Team. Er bewertet, wie gut die Persönlichkeitsstruktur der Person (Impulsiv/Intuitiv/Analytisch-Triad) zum Teamprofil passt und welche Integrationsdynamik zu erwarten ist.

---

## Architektur

### Dateien

| Datei | Rolle |
|---|---|
| `client/src/lib/teamcheck-v4-engine.ts` | Engine - Logik und Textgenerierung |
| `client/src/pages/teamcheck.tsx` | Interaktive Simulations-Seite |
| `client/src/pages/teamcheck-report-v4.tsx` | Bericht-Ansicht und PDF-Export |
| `client/src/lib/teamcheck-v3-engine.ts` | V3-Engine (wird intern von V4 aufgerufen) |
| `client/src/lib/teamcheck-v2-engine.ts` | V2-Engine (wird intern von V3 aufgerufen) |
| `client/src/lib/team-report-engine.ts` | V1-Engine (Legacy, Systemwirkung + Impact Areas) |

### Engine-Abhängigkeitskette

```
V4 (teamcheck-v4-engine.ts)
  └── ruft V3 auf (teamcheck-v3-engine.ts)
        ├── ruft V2 auf (teamcheck-v2-engine.ts)
        └── ruft V1 auf (team-report-engine.ts)
```

V4 ist ein Wrapper um V3 mit eigener Text- und Berichtslogik. Die alte V1-Engine (`teamcheck-engine.ts`) wird von keiner aktiven Seite mehr verwendet.

---

## Eingabedaten (Input)

### `TeamCheckV3Input`

| Feld | Typ | Beschreibung |
|---|---|---|
| `teamProfile` | `{ impulsiv, intuitiv, analytisch }` | Triad-Werte des Teams (0-67) |
| `personProfile` | `{ impulsiv, intuitiv, analytisch }` | Triad-Werte der Person (0-67) |
| `roleTitle` | `string` | Stellenbezeichnung (z.B. "Senior Developer") |
| `roleType` | `"leadership" \| "member"` | Rolle im Team |
| `teamGoal` | `"umsetzung" \| "analyse" \| "zusammenarbeit"` | Funktionales Teamziel |
| `roleLevel` | `string` (optional) | Hierarchie-Ebene |
| `taskStructure` | `string` (optional) | Aufgabenstruktur |
| `successFocus` | `string` (optional) | Erfolgsfokus |

---

## Ausgabedaten (Output)

### `TeamCheckV4Result`

| Feld | Typ | Beschreibung |
|---|---|---|
| `v3` | `TeamCheckV3Result` | Vollständiges V3-Ergebnis (intern) |
| `passungZumTeam` | `"hoch" \| "mittel" \| "gering"` | Qualitative Team-Passung |
| `beitragZurAufgabe` | `"hoch" \| "mittel" \| "gering"` | Qualitative Aufgaben-Passung |
| `sameDominance` | `boolean` | Gleiche Hauptdominanz Person/Team |
| `gesamtbewertungText` | `string` | Narrative Gesamtbewertung |
| `warumText` | `string` | Begründung der Bewertung |
| `chancen` | `V4Block[]` | Chancen der Besetzung |
| `risiken` | `V4Block[]` | Risiken der Besetzung |
| `risikoprognose` | `V4RiskPhase[]` | 12-Monats-Timeline |
| `integrationsplan` | `V4IntegrationPhase[]` | 30-Tage-Onboarding-Plan |
| `empfehlungen` | `V4Block[]` | Handlungsempfehlungen |
| `fazitText` | `string` | Abschließendes Fazit |

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
  praxis: string;
  signale: string;
  fuehrungstipp: string;
  fokus: string;
}
```

---

## Engine-Funktionen (V4)

### Hauptfunktion

**`computeTeamCheckV4(input: TeamCheckV3Input): TeamCheckV4Result`**

Ruft intern `computeTeamCheckV3(input)` auf, berechnet `sameDominance`, leitet qualitative Fits ab und generiert alle Textblöcke.

### Interne Builder-Funktionen

| Funktion | Erzeugt | Logik |
|---|---|---|
| `buildGesamtbewertungText` | Narrative Gesamtbewertung | Basiert auf Kreuzung von Team-Fit und Aufgaben-Fit |
| `buildWarumText` | Begründung | Erklärt die Faktoren hinter der Bewertung |
| `buildChancenRisiken` | Chancen + Risiken | Spezifische Vor-/Nachteile der Besetzung |
| `buildRisikoprognose` | 12-Monats-Timeline | 3 Phasen: 0-3, 3-12, 12+ Monate |
| `buildIntegrationsplan` | Onboarding-Roadmap | 3-4 Phasen mit Zielen, Signalen, Tipps |

---

## Engine-Funktionen (V3)

**`computeTeamCheckV3(input: TeamCheckV3Input): TeamCheckV3Result`**

Orchestriert V2 und V1, fügt `strategicFit` hinzu (Passung zum Teamziel).

**`calculateFunctionGoalScore(profile, goal)`** - Misst Alignment zwischen Profil und Teamziel.

---

## Engine-Funktionen (V2)

| Funktion | Beschreibung |
|---|---|
| `computeTeamCheckV2(input)` | Fit-Labels, Integrations-Aufwand, Systemwirkung |
| `getPrimaryKey(profile)` | Dominante Komponente eines Profils |
| `getSecondaryKey(profile)` | Zweitstärkste Komponente |
| `getSystemwirkung(team, person)` | Verstärkung / Spannung / Transformation |

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

### Executive-Bericht (komprimiert)

- KPI-Indikatoren
- Chancen/Risiken (nur Titel)
- Timeline-Prognose
- Empfehlungen
- Fazit

### PDF-Export

- Nutzt `html2canvas` und `jspdf`
- Mehrseitig mit automatischen Seitenumbrüchen (`data-pdf-block`)
- Print-optimiertes CSS

---

## Bewertungslogik

### Passung zum Team

Basiert auf der Triad-Distanz zwischen Person und Team:
- **hoch**: Geringe Abweichung, gleiche Grundstruktur
- **mittel**: Moderate Abweichung, teilweise kompatibel
- **gering**: Große Abweichung, strukturelle Spannung

### Beitrag zur Aufgabe

Basiert auf Alignment zwischen Personenprofil und Teamziel:
- **umsetzung** (Umsetzung): Bevorzugt hohe Impulsiv-Werte
- **analyse** (Analyse): Bevorzugt hohe Analytisch-Werte
- **zusammenarbeit** (Zusammenarbeit): Bevorzugt hohe Intuitiv-Werte

### Systemwirkung (aus V2)

| Typ | Bedeutung |
|---|---|
| Verstärkung | Person verstärkt bestehende Teamdynamik |
| Spannung | Person erzeugt produktive/unproduktive Reibung |
| Transformation | Person verändert die Teamstruktur grundlegend |

---

## Regionale Lokalisierung

Alle Engine-Texte verwenden "ss" als neutrale Basis. Die Lokalisierung erfolgt über `localizeDeep()` aus `region.tsx`:
- **DE/AT**: ss wird zu ß konvertiert (via `ssToSz()`)
- **CH**: ss bleibt erhalten

---

## Versionsgeschichte

| Version | Status | Beschreibung |
|---|---|---|
| V1 | Legacy (Dependency) | Grundlegende Systemwirkung und Impact Areas |
| V2 | Dependency | Fit-Metriken, Profilkategorisierung, Integrations-Aufwand |
| V3 | Dependency | Orchestrierung V1+V2, strategischer Fit nach Teamziel |
| V4 | **Aktiv** | Management Summary, Risikoprognose, Integrationsplan |
