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

## Schritt 2: Varianten vergleichen (Strukturprüfung)

```
sollVariante === istVariante ?
```

**Wenn NEIN → „Nicht geeignet"** (Strukturkonflikt, keine weitere Prüfung nötig)

Die Grundstruktur der Arbeitsweise muss identisch sein. Beispiele für Strukturkonflikte:

| Soll | Ist | Ergebnis |
|------|-----|----------|
| I > N > A | I > A > N | Nicht geeignet (Sekundärflip) |
| I = N > A | I > N > A | Nicht geeignet (Paar vs. Einzeldominanz) |
| ALL_EQUAL | I > N = A | Nicht geeignet (Balance vs. Schwerpunkt) |
| I > N = A | I > N > A | Nicht geeignet (Gleichstand unten vs. klar) |

---

## Schritt 3: Abweichung prüfen (wenn Struktur passt)

Wenn die Varianten übereinstimmen, wird die **grösste Einzelabweichung** (maxDiff) geprüft:

```
maxDiff = MAX(|Soll_I - Ist_I|, |Soll_N - Ist_N|, |Soll_A - Ist_A|)
```

### Schwellen

| maxDiff | Ergebnis | Bedeutung |
|---------|----------|-----------|
| ≤ 5 | **Geeignet** | Arbeitsweise passt zur Stelle |
| > 5 und ≤ 10 | **Bedingt geeignet** | Arbeitsweise passt teilweise zur Stelle |
| > 10 | **Nicht geeignet** | Abweichung zu gross trotz gleicher Struktur |

---

## Zusammenfassung: Entscheidungsbaum

```
                    ┌─────────────────────┐
                    │  Externes KO?       │
                    │  (Führungs-KO)      │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │ ja                  │
                    │ → NICHT GEEIGNET    │
                    └─────────────────────┘
                             │ nein
                    ┌────────▼────────────┐
                    │ Soll-Variante       │
                    │ bestimmen           │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │ Ist-Variante        │
                    │ bestimmen           │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │ Varianten           │
                    │ identisch?          │
                    └────┬───────────┬────┘
                         │           │
                    ┌────▼───┐  ┌────▼────────────┐
                    │ NEIN   │  │ JA               │
                    │→ NICHT │  │ maxDiff prüfen   │
                    │GEEIGNET│  └────┬─────────────┘
                    └────────┘       │
                              ┌──────▼──────────┐
                              │ ≤ 5: GEEIGNET   │
                              │ ≤10: BEDINGT    │
                              │ >10: NICHT GEE. │
                              └─────────────────┘
```

---

## Kontrollintensität (Führungsaufwand)

Unabhängig vom Fit-Ergebnis wird eine **Kontrollintensität** berechnet, die den erwarteten Führungsaufwand beschreibt:

| Punkte | Stufe |
|--------|-------|
| 0–2 | Gering |
| 3–5 | Mittel |
| ≥ 6 | Hoch |

### Punkteberechnung

| Bedingung | Punkte |
|-----------|--------|
| Struktur passt nicht | +3 |
| maxDiff > 10 | +2 |
| maxDiff > 5 und ≤ 10 | +1 |
| Rolle hat klare Dominanz (gap1 ≥ 12) | +1 |

---

## Entwicklungsaufwand

Der Entwicklungsaufwand leitet sich aus dem Fit-Ergebnis und der Kontrollintensität ab:

### Bestimmung devGap

```
Nicht geeignet           → devGap = "hoch"
Sekundärflip (hart)      → devGap = "hoch"
Bedingt + Kontrolle gering → devGap = "mittel"
Sonst                    → devGap = Kontrollintensität
```

### Ergebnis

| devGap | Entwicklungsaufwand | Level |
|--------|---------------------|-------|
| gering | Niedrig | 4 |
| mittel | Mittel | 3 |
| hoch | Hoch | 1 |

Bei einer **Balanced-Rolle** (ALL_EQUAL) wird zusätzlich der Spread der Person geprüft:
- Person auch balanced (Spread ≤ 10): devGap entscheidet
- Person nicht balanced: mindestens "mittel", bei devGap "hoch" → "hoch"

---

## Schwellenwerte im Überblick

| Parameter | Wert | Verwendung |
|-----------|------|------------|
| EQ_TOL | 5 | Wann gelten zwei Werte als "gleich"? |
| GOOD_TOL | 5 | Max. Abweichung für "geeignet" |
| COND_TOL | 10 | Max. Abweichung für "bedingt geeignet" |

**Eine einzige, einheitliche Schwellenlogik für alle 13 Varianten.**

---

## Rechenbeispiele

### Beispiel 1: Geeignet
```
Soll: I=42  N=35  A=23   → ORDER_impulsivintuitivanalytisch
Ist:  I=44  N=34  A=22   → ORDER_impulsivintuitivanalytisch
Varianten identisch ✓
maxDiff = MAX(|42-44|, |35-34|, |23-22|) = MAX(2, 1, 1) = 2
2 ≤ 5 → GEEIGNET
```

### Beispiel 2: Bedingt geeignet
```
Soll: I=45  N=32  A=23   → ORDER_impulsivintuitivanalytisch
Ist:  I=38  N=35  A=27   → ORDER_impulsivintuitivanalytisch
Varianten identisch ✓
maxDiff = MAX(|45-38|, |32-35|, |23-27|) = MAX(7, 3, 4) = 7
7 > 5 und ≤ 10 → BEDINGT GEEIGNET
```

### Beispiel 3: Nicht geeignet (Strukturkonflikt)
```
Soll: I=46  N=28  A=26   → BOTTOM_PAIR_impulsiv_analytischintuitiv
Ist:  I=49  N=29  A=22   → ORDER_impulsivintuitivanalytisch
Varianten NICHT identisch (BOTTOM_PAIR ≠ ORDER)
→ NICHT GEEIGNET
```

### Beispiel 4: Nicht geeignet (Sekundärflip)
```
Soll: I=50  N=30  A=20   → ORDER_impulsivintuitivanalytisch
Ist:  I=50  A=30  N=20   → ORDER_impulsivanalytischintuitiv
Varianten NICHT identisch (andere Reihenfolge)
→ NICHT GEEIGNET
```

### Beispiel 5: Nicht geeignet (Balanced vs. Schwerpunkt)
```
Soll: I=35  N=33  A=32   → ALL_EQUAL
Ist:  I=32  N=39  A=29   → BOTTOM_PAIR_intuitiv_analytischimpulsiv
Varianten NICHT identisch (ALL_EQUAL ≠ BOTTOM_PAIR)
→ NICHT GEEIGNET
```

---

## Dateien

| Datei | Inhalt |
|-------|--------|
| `client/src/lib/jobcheck-engine.ts` | `getVariant()`, `computeCoreFit()` — Kernlogik |
| `client/src/lib/soll-ist-engine.ts` | `computeSollIst()` — Berichtsaufbau, Texte, Entwicklungsaufwand |
| `client/src/pages/soll-ist-bericht.tsx` | UI-Komponente mit Slidern und Berichtsdarstellung |
