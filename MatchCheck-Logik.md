# MatchCheck – Vollständige Soll-Ist-Logik

## Überblick

Der MatchCheck vergleicht ein **Soll-Profil** (Stelle) mit einem **Ist-Profil** (Person).
Beide Profile bestehen aus drei Komponenten, die zusammen immer 100 ergeben:

| Kürzel | Komponente | Bedeutung |
|--------|------------|-----------|
| I | **Impulsiv** | Tempo, Ergebnisorientierung, direkte Umsetzung |
| N | **Intuitiv** | Beziehungsarbeit, Dialog, Gespür für Situationen |
| A | **Analytisch** | Struktur, Analyse, systematisches Vorgehen |

---

## Schritt 1: Variante erkennen (13 Muster)

Jedes Profil wird anhand der Abstände zwischen den sortierten Werten in eine von **13 Strukturvarianten** eingeordnet. Die Gleichheits-Toleranz beträgt **EQ_TOL = 5**.

### Sortierung
Die drei Werte werden absteigend sortiert: `[höchster, mittlerer, niedrigster]`

### Abstände berechnen
```
d1 = höchster - mittlerer
d2 = mittlerer - niedrigster
```

### Klassifikation

| Bedingung | Variante | Muster | Anzahl |
|-----------|----------|--------|--------|
| d1 ≤ 5 **und** d2 ≤ 5 | `ALL_EQUAL` | I = N = A | 1 |
| d1 ≤ 5 **und** d2 > 5 | `TOP_PAIR` | z.B. I = N > A | 3 |
| d1 > 5 **und** d2 ≤ 5 | `BOTTOM_PAIR` | z.B. I > N = A | 3 |
| d1 > 5 **und** d2 > 5 | `ORDER` | z.B. I > N > A | 6 |

**Total: 13 Varianten**

### Varianten-String (Code)

Die Variante wird als eindeutiger String kodiert:

```
ALL_EQUAL                                → "ALL_EQUAL"
Zwei oben gleich, z.B. I=38, N=40, A=22 → "TOP_PAIR_impulsivintuitiv_analytisch"
Einer oben, zwei unten gleich            → "BOTTOM_PAIR_impulsiv_analytischintuitiv"
Alle verschieden, z.B. I=50, N=30, A=20 → "ORDER_impulsivintuitivanalytisch"
```

Bei TOP_PAIR und BOTTOM_PAIR werden die gleichwertigen Komponenten alphabetisch sortiert, damit die Reihenfolge irrelevant ist.

---

## Schritt 2: Strukturprüfung (3 Stufen)

Die Varianten werden verglichen. Es gibt drei mögliche Ergebnisse:

### A. Exakte Strukturgleichheit (EXACT)

Die Varianten-Codes sind identisch. → Weiter zur Abweichungsprüfung.

### B. Weicher Strukturkonflikt (SOFT_CONFLICT)

Die Variante ist nicht identisch, aber nur wegen eines Grenzfalls rund um die 5er-Toleranz. → Weiter zur Abweichungsprüfung, aber **maximal "bedingt geeignet"**.

Typische Fälle:

| Kombination | Bedingung |
|-------------|-----------|
| TOP_PAIR ↔ ORDER | Gleiche Top- und Zweitkomponente |
| BOTTOM_PAIR ↔ ORDER | Gleiche komplette Reihenfolge (top, second, third) |
| ALL_EQUAL ↔ TOP_PAIR | Immer weich (nahe an balanced) |
| ALL_EQUAL ↔ BOTTOM_PAIR | Immer weich (nahe an balanced) |

### C. Harter Strukturkonflikt (HARD_CONFLICT)

Die Denklogik kippt wirklich. → **Sofort "nicht geeignet"**.

Typische Fälle:
- Andere Hauptkomponente
- Anderer echter Doppelschwerpunkt oben
- Reihenfolge kippt klar (I>N>A vs I>A>N = Sekundärflip)
- ALL_EQUAL gegen klare ORDER-Dominanz
- TOP_PAIR ↔ BOTTOM_PAIR

---

## Schritt 3: Abweichungsprüfung

Wenn kein harter Strukturkonflikt vorliegt:

```
diffI = |Soll_I - Ist_I|
diffN = |Soll_N - Ist_N|
diffA = |Soll_A - Ist_A|
maxDiff = grösster Wert davon
```

### Bei exakter Strukturgleichheit (EXACT)

| maxDiff | Ergebnis |
|---------|----------|
| ≤ 5 | **Geeignet** |
| > 5 und ≤ 10 | **Bedingt geeignet** |
| > 10 | **Nicht geeignet** |

### Bei weichem Strukturkonflikt (SOFT_CONFLICT)

| maxDiff | Ergebnis |
|---------|----------|
| ≤ 10 | **Bedingt geeignet** |
| > 10 | **Nicht geeignet** |

**Wichtig:** Bei weichem Strukturkonflikt gibt es nie "geeignet", weil die Struktur nicht ganz sauber passt.

---

## Zusammenfassung: Entscheidungsbaum

```
                    ┌─────────────────────┐
                    │  Externes KO?       │
                    │  (Führungs-KO)      │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │ ja → NICHT GEEIGNET │
                    └─────────────────────┘
                             │ nein
                    ┌────────▼────────────┐
                    │ Soll- und Ist-      │
                    │ Variante bestimmen  │
                    └────────┬────────────┘
                             │
                ┌────────────▼────────────────┐
                │ Strukturbeziehung prüfen    │
                └───┬──────────┬──────────┬───┘
                    │          │          │
              ┌─────▼────┐ ┌──▼───────┐ ┌▼──────────┐
              │ HARD     │ │ SOFT     │ │ EXACT     │
              │→ NICHT   │ │ maxDiff  │ │ maxDiff   │
              │ GEEIGNET │ │ prüfen   │ │ prüfen    │
              └──────────┘ └──┬───────┘ └──┬────────┘
                              │            │
                         ┌────▼─────┐ ┌────▼──────────┐
                         │≤10:BEDINGT│ │ ≤ 5: GEEIGNET │
                         │>10:NICHT  │ │ ≤10: BEDINGT  │
                         └──────────┘ │ >10: NICHT GEE.│
                                      └───────────────┘
```

---

## Kontrollintensität (Führungsaufwand)

Unabhängig vom Fit-Ergebnis wird eine **Kontrollintensität** berechnet:

### Punkteberechnung

| Bedingung | Punkte |
|-----------|--------|
| Harter Strukturkonflikt | +3 |
| Weicher Strukturkonflikt | +2 |
| Exakte Strukturgleichheit | +0 |
| maxDiff > 10 | +2 |
| maxDiff > 5 und ≤ 10 | +1 |
| Rolle hat klare Einzeldominanz (d1 > 10) | +1 |

### Stufen

| Punkte | Stufe |
|--------|-------|
| 0–2 | Gering |
| 3–4 | Mittel |
| ≥ 5 | Hoch |

---

## Entwicklungsaufwand

Einfach und sauber:

| Fit-Ergebnis | Kontrolle | Entwicklungsaufwand | Level |
|-------------|-----------|---------------------|-------|
| Nicht geeignet | (egal) | Hoch | 3 |
| Bedingt geeignet | (egal) | Mittel | 2 |
| Geeignet | gering | Niedrig | 1 |
| Geeignet | mittel/hoch | Mittel | 2 |

Keine Sonderfälle. Kein Sekundärflip-Override. Keine BAL_FULL-Speziallogik.

---

## Schwellenwerte im Überblick

| Parameter | Wert | Verwendung |
|-----------|------|------------|
| EQ_TOL | 5 | Wann gelten zwei Werte als "gleich"? |
| GOOD_TOL | 5 | Max. Abweichung für "geeignet" (nur bei EXACT) |
| COND_TOL | 10 | Max. Abweichung für "bedingt geeignet" |

---

## Kurzfassung der finalen Regel

| Ergebnis | Bedingung |
|----------|-----------|
| **Nicht geeignet** | Harter Strukturkonflikt, oder maxDiff > 10 |
| **Bedingt geeignet** | Weicher Strukturkonflikt mit maxDiff ≤ 10, oder exakte Struktur mit maxDiff 6–10 |
| **Geeignet** | Nur bei exakter Struktur und maxDiff ≤ 5 |

---

## Rechenbeispiele

### Beispiel 1: Geeignet (EXACT)
```
Soll: I=42  N=35  A=23   → ORDER_impulsivintuitivanalytisch
Ist:  I=44  N=34  A=22   → ORDER_impulsivintuitivanalytisch
Strukturbeziehung: EXACT
maxDiff = MAX(2, 1, 1) = 2
2 ≤ 5 → GEEIGNET
Kontrollintensität: 0 Punkte → gering
Entwicklungsaufwand: geeignet + gering → niedrig
```

### Beispiel 2: Bedingt geeignet (SOFT_CONFLICT)
```
Soll: I=45  N=32  A=23   → ORDER_impulsivintuitivanalytisch (d1=13, d2=9)
Ist:  I=38  N=35  A=27   → TOP_PAIR_impulsivintuitiv_analytisch (d1=3, d2=8)
Strukturbeziehung: SOFT_CONFLICT (TOP_PAIR↔ORDER, gleiche Top+Second)
maxDiff = MAX(7, 3, 4) = 7
7 ≤ 10 → BEDINGT GEEIGNET
Kontrollintensität: 2+1 = 3 Punkte → mittel
Entwicklungsaufwand: bedingt → mittel
```

### Beispiel 3: Nicht geeignet (HARD_CONFLICT – Sekundärflip)
```
Soll: I=50  N=30  A=20   → ORDER_impulsivintuitivanalytisch
Ist:  I=50  A=30  N=20   → ORDER_impulsivanalytischintuitiv
Strukturbeziehung: HARD_CONFLICT (andere Reihenfolge)
→ NICHT GEEIGNET
Kontrollintensität: 3+2 = 5 Punkte → hoch
Entwicklungsaufwand: nicht geeignet → hoch
```

### Beispiel 4: Bedingt geeignet (SOFT_CONFLICT – Grenzfall)
```
Soll: I=40  N=35  A=25   → TOP_PAIR_impulsivintuitiv_analytisch (d1=5, d2=10)
Ist:  I=40  N=34  A=26   → ORDER_impulsivintuitivanalytisch (d1=6, d2=8)
Strukturbeziehung: SOFT_CONFLICT (TOP_PAIR↔ORDER, gleiche Top+Second)
maxDiff = MAX(0, 1, 1) = 1
1 ≤ 10 → BEDINGT GEEIGNET
Kontrollintensität: 2 Punkte → gering
Entwicklungsaufwand: bedingt → mittel
```

### Beispiel 5: Nicht geeignet (HARD_CONFLICT – ALL_EQUAL vs ORDER)
```
Soll: I=34  N=33  A=33   → ALL_EQUAL
Ist:  I=50  N=30  A=20   → ORDER_impulsivintuitivanalytisch
Strukturbeziehung: HARD_CONFLICT (ALL_EQUAL vs ORDER)
→ NICHT GEEIGNET
Kontrollintensität: 3+2+1 = 6 Punkte → hoch
Entwicklungsaufwand: nicht geeignet → hoch
```

### Beispiel 6: Bedingt geeignet (SOFT_CONFLICT – ALL_EQUAL vs TOP_PAIR)
```
Soll: I=34  N=33  A=33   → ALL_EQUAL
Ist:  I=37  N=35  A=28   → TOP_PAIR_impulsivintuitiv_analytisch
Strukturbeziehung: SOFT_CONFLICT (ALL_EQUAL↔TOP_PAIR, immer weich)
maxDiff = MAX(3, 2, 5) = 5
5 ≤ 10 → BEDINGT GEEIGNET
Kontrollintensität: 2 Punkte → gering
Entwicklungsaufwand: bedingt → mittel
```

---

## Dateien

| Datei | Inhalt |
|-------|--------|
| `client/src/lib/jobcheck-engine.ts` | `getVariantMeta()`, `isSoftConflict()`, `computeCoreFit()` — Kernlogik |
| `client/src/lib/soll-ist-engine.ts` | `computeSollIst()` — Berichtsaufbau, Texte, Entwicklungsaufwand |
| `client/src/pages/soll-ist-bericht.tsx` | UI-Komponente mit Slidern und Berichtsdarstellung |
