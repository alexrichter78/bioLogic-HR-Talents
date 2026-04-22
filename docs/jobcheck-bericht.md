# JobCheck-Bericht — Technische Dokumentation

## Zweck

Der JobCheck-Bericht bewertet die strukturelle Passung zwischen einem definierten Stellenprofil (Soll) und einem eingegebenen Personenprofil (Ist). Er liefert eine klare Besetzungsempfehlung, Entwicklungshinweise und führungsrelevante Handlungsfelder.

---

## Architektur

### Dateien

| Datei | Rolle |
|---|---|
| `client/src/pages/jobcheck.tsx` | Interaktive Eingabe- und Ergebnisseite |
| `client/src/lib/jobcheck-engine.ts` | Score-Berechnung, Passung, Profil-Klassifikation |
| `client/src/pages/rollenprofil.tsx` | Druckbare Profilansicht |
| `client/src/lib/rollenprofil-pdf-builder.ts` | PDF-Export |
| `server/kompetenzen-generic.ts` | Kompetenz-Mapping (berufsgruppenspezifisch) |
| `server/routes.ts` → `/api/generate-stellenanalyse-text` | Claude-Endpoint für KI-Berichtstexte |

---

## Eingabedaten (Input)

### Aus Rollen-DNA (Stellenanalyse)

| Feld | Typ | Beschreibung |
|---|---|---|
| `beruf` | `string` | Berufsbezeichnung / Stellentitel |
| `profil` | `Triad` | Soll-Profil (impulsiv / intuitiv / analytisch, Summe = 100) |
| `fuehrung` | `string` | Führungstyp (Keine / Projekt / Fachlich / Disziplinarisch) |
| `aufgabencharakter` | `string` | Aufgabenstruktur (operativ / systemisch / strategisch / Gemischt) |
| `arbeitslogik` | `string` | Arbeitslogik (Umsetzungs- / Daten- / Menschenorientiert / Ausgewogen) |
| `erfolgsfokusIndices` | `number[]` | Indices der gewählten Erfolgsfokus-Labels (0–5) |
| `taetigkeiten` | `Taetigkeit[]` | Klassifizierte Tätigkeiten (haupt / neben / human / fuehrung) |
| `kompetenzen` | `Kompetenz[]` | KI-generierte Kompetenzfelder pro Tätigkeitskategorie |

### Personenprofil (Ist-Eingabe durch Nutzer)

| Feld | Typ | Beschreibung |
|---|---|---|
| `impulsiv` | `number` | Anteil Impulsiv (5–67) |
| `intuitiv` | `number` | Anteil Intuitiv (5–67) |
| `analytisch` | `number` | Anteil Analytisch (5–67) |

---

## Score-Formel (jobcheck-engine)

```
totalGap = (|soll.imp - ist.imp| + |soll.int - ist.int| + |soll.ana - ist.ana|) / 2
```

| Gap | Passung |
|---|---|
| 0–12 | Geeignet (fitRating: "PASS") |
| 13–24 | Bedingt geeignet (fitRating: "CONDITIONAL") |
| > 24 | Kritisch (fitRating: "CRITICAL") |

### Entwicklungsstufe (developmentLevel)

| Stufe | Bedeutung | Gap-Bereich |
|---|---|---|
| 1 | Sehr gut passend | 0–6 |
| 2 | Gut passend | 7–12 |
| 3 | Entwicklungsbedarf | 13–24 |
| 4 | Erheblicher Aufwand | > 24 |

---

## Claude-Endpoint: `/api/generate-stellenanalyse-text`

### Zweck
Generiert die KI-Texte des JobCheck-Berichts als JSON-Objekt.

### Input-Payload

| Feld | Beschreibung |
|---|---|
| `beruf` | Stellentitel |
| `fuehrungstyp` | Führungsart |
| `aufgabencharakter` | Aufgabenstruktur |
| `arbeitslogik` | Arbeitslogik |
| `erfolgsfokus` | Liste der Erfolgsfokus-Labels |
| `triad` | Normalisiertes Soll-Profil |
| `taetigkeiten` | Klassifizierte Tätigkeiten |
| `kompetenzen` | Generierte Kompetenzfelder |
| `locale` | `"de"`, `"en"` oder `"fr"` |
| `region` | Region-Code |

### Output-Schema (JSON)

```json
{
  "rollencharakter": "string — 2–3 Sätze zum Kerncharakter der Stelle",
  "einleitung": "string — Einleitung zum Bericht",
  "gesamtprofil": "string — Gesamtprofil-Beschreibung",
  "schwerpunktProfil": "string — Schwerpunkt der Profil-Anforderung",
  "rahmenbedingungen": "string — strukturelle Rahmenbedingungen",
  "signalItems": ["string"] — Schlüsselsignale aus dem Profil,
  "handlungsfelder": ["string"] — empfohlene Führungs- und Entwicklungsfelder,
  "risiken": ["string"] — potenzielle Risiken bei Fehlbesetzung
}
```

### Sprachunterstützung

| Region | Prompt-Sprache | Feldwerte |
|---|---|---|
| DE / CH / AT | Deutsch | Deutsch |
| EN | Englisch (native) | Englisch |
| FR | Französisch (native) | Französisch |

---

## Profilklassen (profileClass)

| Klasse | Bedeutung |
|---|---|
| `BALANCED` | Ausgewogen (kein Wert > 45 %) |
| `CLEAR_IMP` | Klar Impulsiv-dominant |
| `CLEAR_INT` | Klar Intuitiv-dominant |
| `CLEAR_ANA` | Klar Analytisch-dominant |
| `DUAL_IMP_INT` | Dual Impulsiv/Intuitiv |
| `DUAL_IMP_ANA` | Dual Impulsiv/Analytisch |
| `DUAL_INT_ANA` | Dual Intuitiv/Analytisch |

---

## PDF-Export

- Erzeugt via `rollenprofil-pdf-builder.ts` mit `jsPDF`
- Enthält: Profil-Chart, Soll-/Ist-Vergleich, Kompetenzmatrix, Bericht-Texte
- Zweisprachig: Feldbezeichnungen passen sich an Region an
