# MatchCheck-Bericht — Technische Dokumentation

## Zweck

Der MatchCheck (Soll-Ist-Bericht) vergleicht ein definiertes Stellenprofil (Soll) mit dem Personenprofil eines Kandidaten (Ist). Er liefert eine qualitative Passungsanalyse mit KI-generierten Narrativen, Handlungsempfehlungen und einer Besetzungsempfehlung.

---

## Architektur

### Dateien

| Datei | Rolle |
|---|---|
| `client/src/pages/soll-ist-bericht.tsx` | Interaktive Eingabe, Ergebnisanzeige, PDF-Export |
| `client/src/lib/soll-ist-engine.ts` | Score-Berechnung, Passung, Konstellationsanalyse |
| `server/routes.ts` → `/api/generate-soll-ist-narrative` | Claude-Endpoint für KI-Berichtstexte |

---

## Eingabedaten (Input)

### Soll-Profil (aus Rollen-DNA)

| Feld | Typ | Beschreibung |
|---|---|---|
| `roleName` | `string` | Stellenbezeichnung |
| `roleTriad` | `Triad` | Profil der Stelle (impulsiv / intuitiv / analytisch) |
| `roleAnalysisObj` | `object` | Vollständiges Analyseobjekt (Tätigkeiten, Kompetenzen) |
| `fuehrungsArt` | `FuehrungsArt` | Führungsart der Stelle |

### Ist-Profil (manuelle Eingabe)

| Feld | Typ | Beschreibung |
|---|---|---|
| `candidateName` | `string` | Name der Person |
| `candidateProfile` | `Triad` | Profil der Person (impulsiv / intuitiv / analytisch) |

---

## Score-Formel (soll-ist-engine)

```
totalGap = (|soll.imp - ist.imp| + |soll.int - ist.int| + |soll.ana - ist.ana|) / 2
```

### Passung (fitRating)

| Gap | Ergebnis |
|---|---|
| 0–12 | Passend |
| 13–24 | Teilweise passend |
| > 24 | Kritisch |

### Entwicklungsstufe (developmentLevel)

| Stufe | Bedeutung |
|---|---|
| 1 | Kaum Aufwand |
| 2 | Geringer Aufwand |
| 3 | Mittlerer Aufwand |
| 4 | Hoher Aufwand |

### Steuerungsintensität (controlIntensity)

Abgeleitet aus Entwicklungsstufe:

| Stufe | Steuerung |
|---|---|
| 1–2 | gering |
| 3 | mittel |
| 4 | hoch |

---

## Claude-Endpoint: `/api/generate-soll-ist-narrative`

### Zweck
Generiert alle KI-Texte des MatchCheck-Berichts als JSON.

### Input-Payload

| Feld | Beschreibung |
|---|---|
| `context.roleName` | Stellenbezeichnung |
| `context.candidateName` | Name der Person |
| `profiles.role` | Soll-Triade (absolut) |
| `profiles.candidate` | Ist-Triade (absolut) |
| `calculated.fitLabel` | Passung-Label |
| `calculated.fitRating` | PASS / CONDITIONAL / CRITICAL |
| `calculated.totalGap` | Gesamtabweichung |
| `calculated.gapLevel` | Qualitatives Abweichungsniveau |
| `calculated.developmentLevel` | Entwicklungsstufe 1–4 |
| `calculated.developmentLabel` | Entwicklungs-Label |
| `calculated.controlIntensity` | Steuerungsintensität |
| `calculated.roleConstellationLabel` | Profilkonstellation Stelle |
| `calculated.candConstellationLabel` | Profilkonstellation Person |
| `region` | Region-Code (DE/CH/AT/EN/FR) |

### Output-Schema (JSON)

```json
{
  "summaryText": "string — 3–4 Sätze Managementzusammenfassung",
  "executiveBullets": ["string", "string", "string"],
  "constellationRisks": ["string", "string"],
  "dominanceShiftText": "string — Zusammenspiel der dominanten Schwerpunkte",
  "developmentText": "string — Entwicklungsaufwand und Steuerungsintensität",
  "actions": ["string", "string", "string"],
  "finalText": "string — Gesamtfazit und Besetzungsempfehlung"
}
```

### Stil-Regeln (verbindlich für alle Sprachen)

1. Aktiv formulieren. Kein Passiv.
2. Keine Zahlen / Prozentwerte im Ausgabetext.
3. Keine Modelljargon: statt "impulsiv/intuitiv/analytisch" → Klartextlabels je Sprache:
   - DE: "Tempo und Entscheidung" / "Kommunikation und Beziehung" / "Struktur und Sorgfalt"
   - EN: "Pace and Decision" / "Communication and Relationships" / "Structure and Diligence"
   - FR: "Rythme et Décision" / "Communication et Relations" / "Structure et Rigueur"
4. Keine Gedankenstriche / em-dashes.
5. Kernaussage zuerst → kurze Begründung → konkrete Konsequenz.

### Sprachunterstützung

| Region | Prompt-Sprache |
|---|---|
| DE / CH / AT | Deutsch |
| EN | Englisch (native) |
| FR | Französisch (native) |

---

## Passung-Caching (Frontend)

Generierte Narratives werden pro Sprachregion im Arbeitsspeicher gecacht (`narrativeCacheRef`). Sprachenwechsel zeigt die gecachte Version der Zielsprache, falls vorhanden, ohne erneute API-Anfrage. Bei Eingabeänderung wird der Cache geleert.

---

## Bericht-Aufbau (Frontend)

| Abschnitt | Datenquelle |
|---|---|
| Profilvergleich (Chart) | soll-ist-engine (algorithmisch) |
| Managementzusammenfassung | Claude (summaryText + executiveBullets) |
| Konstellationsrisiken | Claude (constellationRisks) |
| Schwerpunkt-Interaktion | Claude (dominanceShiftText) |
| Entwicklung & Steuerung | Claude (developmentText) |
| Handlungsempfehlungen | Claude (actions) |
| Gesamtfazit | Claude (finalText) |
