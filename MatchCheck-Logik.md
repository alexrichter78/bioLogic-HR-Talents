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

---

## Schritt 2: Paarrelationen bilden

Für jedes Profil werden **3 Paarvergleiche** gebildet:

| Paar | Berechnung |
|------|------------|
| I vs N | Differenz I - N |
| I vs A | Differenz I - A |
| N vs A | Differenz N - A |

Jeder Vergleich ergibt einen Wert:

| Differenz | Relation | Bedeutung |
|-----------|----------|-----------|
| \|diff\| ≤ 5 | **0** | Gleich stark |
| diff > 5 | **1** | Erste Komponente klar stärker |
| diff < -5 | **-1** | Zweite Komponente klar stärker |

### Beispiel

```
I = N > A  (I=40, N=40, A=20)
→ I:N = 0, I:A = 1, N:A = 1

I > N > A  (I=50, N=30, A=20)
→ I:N = 1, I:A = 1, N:A = 1
```

---

## Schritt 3: Strukturvergleich über Paarrelationen

Die 3 Paarrelationen von Soll und Ist werden verglichen:

### A. Exakt (EXACT)

Alle 3 Relationen sind identisch.

→ Weiter zur Abweichungsprüfung.

### B. Weicher Strukturkonflikt (SOFT_CONFLICT)

**Genau 1** der 3 Relationen ist unterschiedlich **und** es ist kein direkter Flip (1↔-1).

Erlaubte Übergänge:
- 0 ↔ 1 (Gleichheit kippt leicht nach oben)
- 0 ↔ -1 (Gleichheit kippt leicht nach unten)

→ Weiter zur Abweichungsprüfung, aber **maximal "bedingt geeignet"**.

### C. Harter Strukturkonflikt (HARD_CONFLICT)

Sobald:
- **Mehr als 1** Relation abweicht, oder
- Irgendwo ein **direkter Flip** 1 ↔ -1 vorkommt

→ **Sofort "nicht geeignet"**.

### Warum Paarrelationen besser sind als Variantentyp-Vergleiche

| Fall | Alt (Variantentypen) | Neu (Paarrelationen) | Korrekt? |
|------|---------------------|---------------------|----------|
| ALL_EQUAL ↔ BOTTOM_PAIR | Fälschlich weich | Hart (2 Relationen kippen) | Neu ✓ |
| ALL_EQUAL ↔ TOP_PAIR | Fälschlich weich | Hart (2 Relationen kippen) | Neu ✓ |
| TOP_PAIR (I=N>A) ↔ ORDER (N>I>A) | Fälschlich hart | Weich (nur I:N kippt 0→-1) | Neu ✓ |
| Sekundärflip (I>N>A ↔ I>A>N) | Korrekt hart | Hart (N:A flippt 1→-1) | Beide ✓ |

---

## Schritt 4: Abweichungsprüfung

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

**Wichtig:** Bei weichem Strukturkonflikt gibt es nie "geeignet".

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
                    │ Paarrelationen      │
                    │ bilden (Soll + Ist) │
                    └────────┬────────────┘
                             │
                ┌────────────▼────────────────┐
                │ Relationen vergleichen      │
                └───┬──────────┬──────────┬───┘
                    │          │          │
              ┌─────▼────┐ ┌──▼───────┐ ┌▼──────────┐
              │ HARD     │ │ SOFT     │ │ EXACT     │
              │ >1 Diff  │ │ 1 Diff   │ │ 0 Diff    │
              │ oder Flip│ │ kein Flip│ │           │
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

### Punkteberechnung

| Bedingung | Punkte |
|-----------|--------|
| Harter Strukturkonflikt | +3 |
| Weicher Strukturkonflikt | +2 |
| Exakte Strukturgleichheit | +0 |
| maxDiff > 10 | +2 |
| maxDiff > 5 und ≤ 10 | +1 |
| Rolle hat klare Einzeldominanz (ORDER/BOTTOM_PAIR mit d1 > 10) | +1 |

### Stufen

| Punkte | Stufe |
|--------|-------|
| 0–2 | Gering |
| 3–4 | Mittel |
| ≥ 5 | Hoch |

---

## Entwicklungsaufwand

| Fit-Ergebnis | Kontrolle | Entwicklungsaufwand | Level |
|-------------|-----------|---------------------|-------|
| Nicht geeignet | (egal) | Hoch | 3 |
| Bedingt geeignet | (egal) | Mittel | 2 |
| Geeignet | gering | Niedrig | 1 |
| Geeignet | mittel/hoch | Mittel | 2 |

Keine Sonderfälle.

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
Soll: I=42  N=35  A=23
Ist:  I=44  N=34  A=22

Soll-Relationen: I:N=1, I:A=1, N:A=1
Ist-Relationen:  I:N=1, I:A=1, N:A=1
→ EXACT (0 Abweichungen)

maxDiff = MAX(2, 1, 1) = 2 ≤ 5 → GEEIGNET
```

### Beispiel 2: Bedingt geeignet (SOFT_CONFLICT)
```
Soll: I=40  N=40  A=20  (I = N > A)
Ist:  I=34  N=40  A=26  (N > I > A)

Soll-Relationen: I:N=0, I:A=1, N:A=1
Ist-Relationen:  I:N=-1, I:A=1, N:A=1
→ SOFT_CONFLICT (1 Abweichung: I:N kippt 0→-1, kein Flip)

maxDiff = MAX(6, 0, 6) = 6 ≤ 10 → BEDINGT GEEIGNET
```

### Beispiel 3: Nicht geeignet (HARD_CONFLICT – Sekundärflip)
```
Soll: I=50  N=30  A=20  (I > N > A)
Ist:  I=50  N=20  A=30  (I > A > N)

Soll-Relationen: I:N=1, I:A=1, N:A=1
Ist-Relationen:  I:N=1, I:A=1, N:A=-1
→ HARD_CONFLICT (N:A flippt direkt 1→-1)

→ NICHT GEEIGNET
```

### Beispiel 4: Nicht geeignet (HARD_CONFLICT – ALL_EQUAL vs BOTTOM_PAIR)
```
Soll: I=35  N=33  A=32  (ALL_EQUAL)
Ist:  I=41  N=30  A=29  (BOTTOM_PAIR)

Soll-Relationen: I:N=0, I:A=0, N:A=0
Ist-Relationen:  I:N=1, I:A=1, N:A=0
→ HARD_CONFLICT (2 Relationen kippen – nicht nur 1)

→ NICHT GEEIGNET
```

### Beispiel 5: Bedingt geeignet (SOFT_CONFLICT – Grenzfall TOP_PAIR vs ORDER)
```
Soll: I=40  N=35  A=25
Ist:  I=40  N=34  A=26

Soll-Relationen: I:N=0, I:A=1, N:A=1
Ist-Relationen:  I:N=1, I:A=1, N:A=1
→ SOFT_CONFLICT (1 Abweichung: I:N kippt 0→1, kein Flip)

maxDiff = MAX(0, 1, 1) = 1 ≤ 10 → BEDINGT GEEIGNET
```

### Beispiel 6: Bedingt geeignet (SOFT_CONFLICT – BOTTOM_PAIR vs ORDER)
```
Soll: I=46  N=28  A=26  (BOTTOM_PAIR)
Ist:  I=46  N=30  A=24  (ORDER)

Soll-Relationen: I:N=1, I:A=1, N:A=0
Ist-Relationen:  I:N=1, I:A=1, N:A=1
→ SOFT_CONFLICT (1 Abweichung: N:A kippt 0→1, kein Flip)

maxDiff = MAX(0, 2, 2) = 2 ≤ 10 → BEDINGT GEEIGNET
```

---

## Schwellenwerte im Überblick

| Parameter | Wert | Verwendung |
|-----------|------|------------|
| EQ_TOL | 5 | Wann gelten zwei Werte als "gleich" (Paarrelation = 0)? |
| GOOD_TOL | 5 | Max. Abweichung für "geeignet" (nur bei EXACT) |
| COND_TOL | 10 | Max. Abweichung für "bedingt geeignet" |

---

## Dateien

| Datei | Inhalt |
|-------|--------|
| `client/src/lib/jobcheck-engine.ts` | `getVariantMeta()`, `getPairRelations()`, `getStructureFromPairs()`, `computeCoreFit()` |
| `client/src/lib/soll-ist-engine.ts` | `computeSollIst()` — Berichtsaufbau, Texte, Entwicklungsaufwand |
| `client/src/pages/soll-ist-bericht.tsx` | UI-Komponente mit Slidern und Berichtsdarstellung |
