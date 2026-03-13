# MatchCheck Systemwirkung - Texte zur Überarbeitung

Dieser Bereich hat zwei Textblöcke: **Fazit-Text** (links) und **Entwicklungsprognose** (rechts).

---

## 1. Fazit-Text (links unter dem Rollennamen)

| # | Konstellation | Text |
|---|---------------|------|
| F1 | **Geeignet** | Die Arbeitsweise der Person passt gut zu den Anforderungen der Rolle. Aufgaben, Entscheidungen und Arbeitsstil stimmen weitgehend überein. |
| F2 | **Bedingt geeignet** + Gap **gering** | Die Grundausrichtung ist ähnlich, jedoch unterscheidet sich die Gewichtung der sekundären Bereiche. Mit klaren Erwartungen und gezielter Führung ist die Zusammenarbeit stabil möglich. |
| F3 | **Bedingt geeignet** + Gap **mittel/hoch** | Die Grundausrichtung ist ähnlich. In einzelnen Punkten unterscheidet sich die Arbeitsweise jedoch. Mit klaren Erwartungen und guter Führung kann die Zusammenarbeit stabil funktionieren. |
| F4 | **Nicht geeignet** + Gap **nicht hoch** (moderat) | Die strukturelle Abweichung zwischen Rolle und Person ist deutlich. Obwohl der Gesamtabstand moderat ist, weicht die Gewichtung der Arbeitsbereiche erheblich ab. |
| F5 | **Nicht geeignet** + Gap **hoch** | Die Anforderungen der Rolle und die natürliche Arbeitsweise der Person unterscheiden sich deutlich. Im Arbeitsalltag entsteht dadurch ein erhöhter Abstimmungsbedarf. |

**Datei:** `client/src/pages/soll-ist-bericht.tsx`, Zeilen 466-476

---

## 2. Entwicklungsprognose-Text (rechts)

Variablen in den Texten:
- `{Rolle-Bereich}` = z.B. "Umsetzung und Tempo" (impulsiv), "Zusammenarbeit und Kommunikation" (intuitiv), "Struktur und Planung" (analytisch)
- `{Person-Bereich}` = gleiches Schema wie Rolle-Bereich, basierend auf dominanter Komponente der Person
- `{Person}` = Name der Person oder "Die Person"

| # | Konstellation | Anzeige | Text |
|---|---------------|---------|------|
| E1 | Gap **gering** (alle Fit-Stufen) | 3 von 3 - Entwicklung sehr wahrscheinlich | Die Anpassung an die Rollenanforderung ist mit hoher Wahrscheinlichkeit erreichbar. Die Grundausrichtung stimmt bereits überein. {Person} muss lediglich in den sekundären Bereichen Feinabstimmung leisten. Bei klarer Erwartungssetzung ist das realistisch. |
| E2 | Gap **mittel** + Rolle und Person **gleiche** Dominanz | 2 von 3 - Entwicklung mit Unterstützung möglich | Die Grundrichtung stimmt, aber die Ausprägung im Bereich {Rolle-Bereich} liegt unter dem, was die Rolle braucht. Eine gezielte Stärkung ist möglich und erfordert klare Erwartungen und regelmäßige Rückmeldung über 6 bis 12 Monate. Die Führungskraft sollte konkrete Entwicklungsziele definieren und den Fortschritt regelmäßig überprüfen. |
| E3 | Gap **mittel** + Rolle und Person **verschiedene** Dominanz | 2 von 3 - Entwicklung mit Unterstützung möglich | Eine Entwicklung in Richtung stärkerer {Rolle-Bereich} ist möglich. Sie erfordert gezielte Führung, klare Erwartungen und regelmäßige Rückmeldung. Der Zeitraum beträgt erfahrungsgemäß 6 bis 12 Monate. Die Führungskraft sollte konkrete Entwicklungsziele definieren und den Fortschritt regelmäßig überprüfen. |
| E4 | Gap **hoch** + Rolle und Person **gleiche** Dominanz | 1 von 3 - Entwicklung unwahrscheinlich | Die Grundrichtung stimmt formal, aber die Ausprägung im Bereich {Rolle-Bereich} ist deutlich zu schwach. Eine tragfähige Entwicklung erfordert intensive Führung, klare Standards und konsequente Nachsteuerung über einen längeren Zeitraum. Der Erfolg ist nicht sicher. Die Führungskraft sollte realistisch abwägen, ob der notwendige Aufwand im Verhältnis zum erwarteten Ergebnis steht. |
| E5 | Gap **hoch** + Rolle und Person **verschiedene** Dominanz | 1 von 3 - Entwicklung unwahrscheinlich | Eine Entwicklung von {Person-Bereich} hin zu {Rolle-Bereich} ist grundsätzlich möglich, erfordert jedoch intensive Führung, klare Standards und konsequente Nachsteuerung über einen längeren Zeitraum. Der Erfolg ist nicht sicher. Die Führungskraft sollte realistisch abwägen, ob der notwendige Aufwand im Verhältnis zum erwarteten Ergebnis steht. |

**Datei:** `client/src/lib/soll-ist-engine.ts`, Funktion `buildDevelopment`, Zeilen 813-835

---

## 3. Bereichs-Bezeichnungen (Variablen-Auflösung)

| Dominante Komponente | {Rolle-Bereich} / {Person-Bereich} |
|----------------------|-------------------------------------|
| Impulsiv | Umsetzung und Tempo |
| Intuitiv | Zusammenarbeit und Kommunikation |
| Analytisch | Struktur und Planung |

---

## 4. Gap-Bestimmung (Wann welcher Gap?)

| Bedingung | Gap |
|-----------|-----|
| Fit = "Nicht geeignet" | immer **hoch** |
| Fit = "Bedingt"/"Geeignet" + MatchCheck vorhanden | Steuerungsintensität aus MatchCheck |
| Fit = "Bedingt"/"Geeignet" + kein MatchCheck | gapLevel aus Soll-Ist-Berechnung |

