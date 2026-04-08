# MatchCheck – Berechnungslogik

## 1. Eignungsbewertung (Fit-Rating)

### Schritt 1: KO-Regeln (sofort "Nicht geeignet")

| Regel | Bedingung | Ergebnis |
|-------|-----------|----------|
| Extreme Abweichung I | Rolle = EXTREME_I (Imp ≥ 65) UND Person Imp ≤ 35 | KO → Nicht geeignet |
| Extreme Abweichung N | Rolle = EXTREME_N (Int ≥ 55) UND Person Int ≤ 30 | KO → Nicht geeignet |
| Extreme Abweichung A | Rolle = EXTREME_A (Ana ≥ 65) UND Person Ana ≤ 35 | KO → Nicht geeignet |
| Dominanzwechsel groß | Andere Primärdominanz UND Hauptdifferenz ≥ 18 | KO → Nicht geeignet |
| Dominanzwechsel + klare Rolle | Andere Primärdominanz UND Rolle gap1 ≥ 20 UND Hauptdiff ≥ 15 | KO → Nicht geeignet |
| Dual-Dominanz Untergrenze | Rolle = DUAL UND Person < 75% der Rollenwerte in den Dual-Komponenten | KO → Nicht geeignet |
| Führungs-KO | Führung gefordert UND Führungsprofil Imp ≥ 60 UND Person Imp ≤ 35 | KO → Nicht geeignet |

### Schritt 2: Mismatch-Score (wenn kein KO)

| Bedingung | Ergebnis |
|-----------|----------|
| Gleiche Primärdominanz UND Mismatch ≤ 12 | Geeignet |
| Gleiche Primärdominanz UND Mismatch ≤ 20 | Bedingt geeignet |
| Gleiche Primärdominanz UND Mismatch > 20 | Nicht geeignet |
| Andere Primärdominanz UND Mismatch ≤ 10 | Geeignet |
| Andere Primärdominanz UND Mismatch ≤ 18 | Bedingt geeignet |
| Andere Primärdominanz UND Mismatch > 18 | Nicht geeignet |

### Schritt 3: Sonderfälle (überschreiben Schritt 2)

| Situation | Bedingung | Ergebnis |
|-----------|-----------|----------|
| **Rolle = BAL_FULL** (ausgeglichen) | Person Spread ≤ 5 | Geeignet |
| **Rolle = BAL_FULL** | Person Spread 6–11 | Bedingt geeignet |
| **Rolle = BAL_FULL** | Person Spread ≥ 12 | Nicht geeignet |
| **Person = BAL_FULL**, Rolle nicht | – | Nicht geeignet |
| **Verschiedene Primärdominanz** | – | Nicht geeignet |
| **Einzelwert-Abweichung** | max. Einzeldifferenz > 25 | Nicht geeignet |
| **Person Dual, Rolle klar** | Rollendominanz in Persons Dual enthalten | Bedingt geeignet |
| **Person Dual, Rolle klar** | Rollendominanz NICHT in Persons Dual | Nicht geeignet |
| **Person = BAL_FULL, Rolle klar** | – | Nicht geeignet |
| **Sekundärflip** (2. Dominanz getauscht) | gap2 > 5 bei beiden Seiten | Nicht geeignet |
| **Sekundärflip** | gap2 ≤ 5 bei einer Seite | Bedingt geeignet |
| **Person fast-Dual** | gap2 ≤ 5 | Bedingt geeignet |
| **Große Einzelabweichung** | max. Einzeldiff > 18 | Bedingt geeignet |
| **Person fast-Dual** | gap1 ≤ 5 | Bedingt geeignet |

---

## 2. Kontrollintensität / Führungsaufwand (Basis)

Punkteberechnung für den Basis-Führungsaufwand:

| Faktor | Bedingung | Punkte |
|--------|-----------|--------|
| Dominanzwechsel oder Dual-Unterschied | Primärdominanz verschieden ODER Dual ↔ Nicht-Dual | +2 |
| Extreme Rolle | Rolle = EXTREME_* | +1 |
| Klare Rollendominanz | gap1 ≥ 12 | +1 |
| Große Hauptdifferenz | Hauptdiff ≥ 25 | +3 |
| Mittlere Hauptdifferenz | Hauptdiff 15–24 | +2 |

| Punkte | Führungsaufwand |
|--------|----------------|
| 0–2 | Gering (LOW) |
| 3–5 | Mittel (MEDIUM) |
| 6+ | Hoch (HIGH) |

### Erweiterte Kontrollintensität (mit Rollenkontext)

Zusätzlich zu den Basispunkten:

| Faktor | Bedingung | Punkte |
|--------|-----------|--------|
| Führungsprofil-Abweichung | Führungsprofil Hauptdiff ≥ 15 | +2 |
| Führung gefordert, kein Profil | – | +1 |
| Starkes Rahmenprofil | Rahmen top1 ≥ 75 UND Person andere Dominanz | +2 |
| Deutliches Rahmenprofil | Rahmen top1 65–74 UND Person andere Dominanz | +1 |

---

## 3. Entwicklungsaufwand

### Eingabe: devGap

| Fit-Rating | devGap-Quelle |
|------------|---------------|
| Nicht geeignet | immer "hoch" |
| Geeignet / Bedingt geeignet | = Basis-Kontrollintensität (LOW/MEDIUM/HIGH → gering/mittel/hoch) |

### Normalfall (Rolle hat klare Dominanz)

| devGap | devLevel | devScore | Anzeige | Balken | Farbe |
|--------|----------|----------|---------|--------|-------|
| gering | 4 | 3 | niedrig (Wenig Aufwand) | ■ □ □ | Grün |
| mittel | 3 | 2 | mittel (Machbar) | ■ ■ □ | Gelb |
| hoch | 1 | 1 | hoch (Ergebnis unsicher) | ■ ■ ■ | Rot |

### Sonderfall: Rolle = BAL_FULL (ausgeglichenes Rollenprofil)

| Person-Spread | devGap | devLevel | devScore | Anzeige |
|---------------|--------|----------|----------|---------|
| ≤ 10 (auch ausgeglichen) | egal | 4 | 3 | niedrig |
| > 10, devGap gering/mittel | gering/mittel | 3 | 2 | mittel |
| > 10, devGap hoch | hoch | 1 | 1 | hoch |

---

## 4. Zusammenfassung: Typische Konstellationen

| Konstellation | Fit-Rating | Basis-Kontrolle | Entwicklungsaufwand |
|---------------|------------|-----------------|---------------------|
| Gleiche Dominanz, kleiner Abstand | Geeignet | Gering (0–2 Pkt) | niedrig (1 Balken) |
| Gleiche Dominanz, mittlerer Abstand | Bedingt geeignet | Mittel (3–5 Pkt) | mittel (2 Balken) |
| Gleiche Dominanz, großer Abstand | Nicht geeignet | Hoch (6+ Pkt) | hoch (3 Balken) |
| Sekundärflip, kleiner gap2 | Bedingt geeignet | Gering (0–2 Pkt) | niedrig (1 Balken) |
| Sekundärflip, klarer gap2 beidseitig | Nicht geeignet | – | hoch (3 Balken) |
| Verschiedene Dominanz | Nicht geeignet | – | hoch (3 Balken) |
| Person BAL_FULL, Rolle klar | Nicht geeignet | – | hoch (3 Balken) |
| Rolle BAL_FULL, Person ausgeglichen | Geeignet | Gering | niedrig (1 Balken) |
| Rolle BAL_FULL, Person einseitig, kleiner Gap | Bedingt geeignet | Gering/Mittel | mittel (2 Balken) |
| Rolle BAL_FULL, Person stark einseitig | Nicht geeignet | – | hoch (3 Balken) |
