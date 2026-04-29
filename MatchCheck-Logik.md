# MatchCheck – Vollständige Soll-Ist-Logik

> Stand: 29. April 2026
> Dateien: `client/src/lib/soll-ist-engine.ts`, `client/src/lib/jobcheck-engine.ts`, `client/src/lib/matchcheck-texts.ts`, `client/src/lib/text-variants.ts`, `client/src/lib/passungsnaehe.ts`, `client/src/pages/soll-ist-bericht.tsx`, `client/src/lib/pdf-direct-builder.ts`
>
> **Hinweis:** Die ältere, vereinfachte Version dieses Dokuments (`MatchCheck_Berechnungslogik.md`) ist überholt und wird nicht mehr aktualisiert. Das vorliegende Dokument ist die massgebliche Referenz.
>
> **Abgrenzung:** `client/src/lib/leader-team-match-engine.ts` gehört **nicht** zum klassischen MatchCheck (Stelle ↔ Person), sondern zur Teamdynamik (Führung ↔ Team) und wird in `teamdynamik.tsx` verwendet.

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

## Schritt 5: FitSubtype (für Soll-Ist-Bericht Texte)

Der FitSubtype steuert **nur die Textgenerierung**, nicht die Kernbewertung. Er wird strikt aus `fitLabel` und `structureRelation` abgeleitet:

| FitSubtype | Bedingung | Textliche Wirkung |
|---|---|---|
| **PERFECT** | fitLabel === "Geeignet" | "deckungsgleich mit der Stellenanforderung" |
| **STRUCTURE_MATCH_INTENSITY_OFF** | fitLabel === "Bedingt geeignet" UND EXACT | "in der Grundrichtung stimmig, Gewichtung nicht deckungsgleich" |
| **PARTIAL_MATCH** | fitLabel === "Bedingt geeignet" UND nicht EXACT (Fallback — typischerweise SOFT_CONFLICT) | Teilweise anschlussfähig, mit Abweichung |
| **MISMATCH** | fitLabel === "Nicht geeignet" (immer) | Grundpassung nicht gegeben |

### Wichtige Designentscheidungen

1. **PERFECT = Geeignet** (d.h. EXACT + maxDiff ≤ 5). Nicht mehr `rk === ck + maxGap < 8` — das war zu weit und fachlich falsch.
2. **HARD_CONFLICT = immer MISMATCH.** Keine Sonderbehandlung für "gleiche Top-Komponente" — das war zu weich und führte zu falschen Texten.
3. **FitSubtype ist 1:1 an fitLabel gebunden:** Geeignet → PERFECT, Bedingt → INTENSITY_OFF oder PARTIAL, Nicht geeignet → MISMATCH. Keine Kreuzfälle möglich.

### Sprachpräzision: PERFECT vs. STRUCTURE_MATCH_INTENSITY_OFF

Die Texte differenzieren **semantisch**, nicht nur quantitativ:

| Situation | PERFECT | STRUCTURE_MATCH_INTENSITY_OFF |
|---|---|---|
| **Entscheidung** | "ist deckungsgleich mit der Stellenanforderung" | "ist in der Grundrichtung stimmig, Gewichtung nicht deckungsgleich" |
| **Führung** | "ist deckungsgleich mit der Stellenanforderung" | "ist in der Grundausrichtung stimmig, Gewichtung nicht deckungsgleich" |
| **Kommunikation** | "ist deckungsgleich mit der Stellenanforderung" | "ist in der Grundrichtung stimmig, Gewichtung nicht deckungsgleich" |
| **Kultur** | "ist deckungsgleich mit der Stellenanforderung" | "ist stimmig, Gewichtung nicht deckungsgleich" |
| **Arbeitsweise** | "ist deckungsgleich mit der Stellenanforderung" | "ist in der Grundrichtung stimmig, Gewichtung nicht deckungsgleich" |

### Severity-Labels (Impact-Areas)

| Severity | Label |
|---|---|
| ok | **Weitgehend stimmig** |
| warning | **Mit Abweichung** |
| critical | **Kritisch** |

### capSeverity-Funktion

Die `capSeverity(severity, fitSubtype)` Funktion stellt sicher, dass Severity-Labels konsistent zum Gesamturteil sind:

| FitSubtype | Regel |
|---|---|
| PERFECT | ok bleibt ok |
| STRUCTURE_MATCH_INTENSITY_OFF | ok → warning |
| PARTIAL_MATCH | ok → warning |
| MISMATCH | ok → critical, warning → critical |

### Sprachregeln je FitSubtype

Die Text-Engine nutzt kontrollierte Variantenrotation (`text-variants.ts`). Pro Berichtssektion und FitSubtype-Level existieren 3–4 gleichwertige Formulierungen. Welche Variante gewählt wird, bestimmt ein stabiler Hash aus Rollen- und Personenname – derselbe Bericht klingt immer gleich, verschiedene Berichte klingen unterschiedlich.

**PERFECT:**
- Erlaubt: "deckungsgleich", "passt", "stimmig", "tragfähig"
- Verboten: "teilweise", "mit Abweichung", "Anpassungsbedarf"

**STRUCTURE_MATCH_INTENSITY_OFF (EXACT_YELLOW):**
- Erlaubt: "in der Grundrichtung stimmig", "andere Akzente", "Gewichtung weicht ab", "nicht ganz sauber"
- Verboten: "passt" (ohne Einschränkung), "deckungsgleich", "deutlich abweichend"

**PARTIAL_MATCH (SOFT_YELLOW):**
- Erlaubt: "teilweise anschlussfähig", "nicht durchgehend", "in Teilen passend", "bewusste Führung"
- Verboten: "passt", "deckungsgleich", "stimmig" (ohne Einschränkung)

**MISMATCH:**
- Erlaubt: "andere Logik", "deutlich abweichend", "nicht tragfähig", "anders als vorgesehen"
- Verboten: "stimmig", "anschlussfähig", "grundsätzlich passend"

**Sicherheitsregeln:**
1. Variation darf nie die fachliche Bedeutung ändern
2. Managementkurzfazit darf nie identisch mit Gesamtbewertung sein
3. Risiken dürfen keine Maßnahmen enthalten
4. Impact-Area-Interpretationen dürfen nie positiver klingen als das Gesamturteil

### Doppeldominanz-Sonderregel (Text-Interpretation, keine Bewertungsregel)

Wenn Rolle = TOP_PAIR, Person = TOP_PAIR, gleiches Dual-Paar, aber die 3. Komponente weicht erkennbar ab (`thirdDiff ≥ 4`):

- Das ist **kein Strukturbruch** im Sinne der Kernbewertung — die Kernbewertung selbst ist von dieser Regel nicht betroffen.
- Die Regel wirkt **rein textlich** (in `matchcheck-texts.ts`, Helfer `buildVariantFamilyText` / `buildDualDominanceText` mit Bedingung `sameDualPair`): Im Bericht wird die Konstellation als **Balanceproblem innerhalb derselben Logik** beschrieben statt als gröbere Abweichung.
- Inhaltliche Lesart: Die Rolle verlangt zwei gleich starke Hauptbereiche, die parallel stabil wirksam sein sollen. Die Person bringt diese Doppellogik ebenfalls mit, aber die 3. Komponente stabilisiert anders oder schwächer. Dadurch wechseln die Hauptbereiche im Alltag leichter, anstatt konstant parallel zu wirken.

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

### Führungsaufwand-Floor (Mindest-Stufen)

Um sicherzustellen, dass der angezeigte Führungsaufwand zum Gesamturteil passt, gelten Mindest-Stufen:

| fitLabel | Mindest-Stufe |
|---|---|
| **Nicht geeignet** | Hoch (wird immer auf "hoch" angehoben) |
| **Bedingt geeignet** | Mittel (wird mindestens auf "mittel" angehoben) |
| **Geeignet** | Keine Untergrenze |

---

## Entwicklungsaufwand

| Fit-Ergebnis | Entwicklungsaufwand | devLevel | devScore | UI-Balken (gefüllt) |
|-------------|---------------------|----------|----------|---------------------|
| Geeignet | Niedrig | 1 | 3 | 1 von 3 (grün) |
| Bedingt geeignet | Mittel | 2 | 2 | 2 von 3 (gelb) |
| Nicht geeignet | Hoch | 3 | 1 | 3 von 3 (rot) |

Direkte 1:1-Zuordnung, keine Sonderfälle.

**devScore-Formel:** `devScore = 4 - devLevel` (höherer Wert = bessere Passung)

**Balken-Semantik:** Die UI zeigt **Aufwand**, nicht Erfolg — *mehr gefüllte Balken = mehr Aufwand*. Berechnet als `filledBars = 4 - devScore`. Bei Geeignet ist also nur ein Balken gefüllt (wenig Aufwand), bei Nicht geeignet alle drei (viel Aufwand).

Diese Formel wird konsistent in `soll-ist-bericht.tsx` und `pdf-direct-builder.ts` verwendet.

### Entwicklungsprognose-Texte (Untertitel im Bericht)

Die Kurztexte werden lokalisiert über `ui.matchcheck.devShortLow / devShortMedium / devShortHigh` ausgespielt. Beispiel Deutsch:

| devLevel | Kurzlabel (devLow/Medium/High) | Untertitel (devShortLow/Medium/High) |
|---|---|---|
| 1 (niedrig) | „niedrig" | „Gute Aussichten · Wenig Aufwand" |
| 2 (mittel) | „mittel" | „Machbar · Gezielte Führung nötig" |
| 3 (hoch) | „hoch" | „Hoher Aufwand · Ergebnis unsicher" |

Alle vier Sprachregionen (DE/EN/FR/IT — CH und AT nutzen die DE-Texte) haben äquivalente Übersetzungen.

### Individuelle Bereichsbewertung (Impact Areas)

Die 4–5 Bereiche im Bericht (Entscheidungsverhalten, Arbeitsweise, Führungswirkung*, Kommunikation, Teamkultur) berechnen eigene Severity-Werte. Die Schwellen sind an die Fit-Engine angeglichen: 0–5 = ok, 6–10 = warning, >10 = critical.

*Führungswirkung nur bei fuehrungsArt ≠ "keine".

| Severity | Label | Bedeutung |
|----------|-------|-----------|
| ok | Weitgehend stimmig | Bereich liegt nah an der Stellenanforderung |
| warning | Mit Abweichung | Erkennbare Abweichung, steuerbar mit Führung |
| critical | Kritisch | Deutliche Abweichung, hoher Aufwand nötig |

**Master-Regel:** Kein Teilbereich darf positiver klingen als das Gesamturteil. Bei MISMATCH werden alle Bereiche mindestens kritisch dargestellt.

**Berichtsdarstellung:** Für die Berichtsdarstellung wird bei PARTIAL_MATCH und STRUCTURE_MATCH_INTENSITY_OFF die Zahl der als „ok" dargestellten Teilbereiche begrenzt, damit die Detailansicht nicht positiver wirkt als das Gesamturteil.

---

## 30-Tage-Integrationsplan

Der Integrationsplan ist profilabhängig und wird in drei Varianten generiert – **ohne Nennung von Komponentennamen** (kein "analytisch", "impulsiv", "intuitiv", "Struktur / Analyse").

### Drei Plan-Varianten

| fitLabel / fitSubtype | Variante | Tonalität |
|---|---|---|
| **Geeignet** (PERFECT) | Positiv | Schnelle Einarbeitung, "Arbeitsweise passt zur Stelle" |
| **Nicht geeignet** | Kritisch | Ehrliche Bewertung, "Tragfähigkeit ehrlich bewerten", "Ist die Lücke überbrückbar?" |
| **Bedingt geeignet** (Fallback) | Anpassungsorientiert | "Unterschiede erkennen", "Anpassungsbedarf gezielt steuern" |

### Personenbeschreibung (profilabhängig)

Die Person wird je nach Profiltyp beschrieben:

| Profiltyp | Beschreibung |
|---|---|
| **Gleichverteilung** (candIsBalFull) | "Die Person zeigt keine klare Schwerpunktsetzung und arbeitet breit aufgestellt." |
| **Doppeldominanz** (candIsDualDom) | "Die Person hat zwei fast gleich starke Arbeitsschwerpunkte und wechselt situativ zwischen ihnen." |
| **Einzeldominanz** (default) | "Die Person hat einen klar erkennbaren Arbeitsschwerpunkt." |

### Phasen-Struktur (alle drei Varianten)

| Phase | Titel | Zeitraum | Fokus |
|---|---|---|---|
| 1 | Orientierung | Tag 1–10 | Erwartungen klären, Unterschiede erkennen |
| 2 | Wirkung | Tag 11–20 | Erste Ergebnisse, Feedback, Steuerung |
| 3 | Stabilisierung | Tag 21–30 | Bewertung, langfristige Tragfähigkeit |

### Unterschiede zwischen den Varianten

**PERFECT (Geeignet):**
- Phase 1: "Arbeitsweise passt zur Stelle"
- Phase 2: "Person arbeitet bereits nach dem passenden Grundansatz"
- Phase 3: "Stärken beibehalten und Routinen festigen"

**Nicht geeignet:**
- Phase 1: "Abweichungen frühzeitig identifizieren", personalisierte Beschreibung + "Die Stelle verlangt eine andere Gewichtung"
- Phase 2: "engmaschig begleiten und steuern", "ehrlich prüfen, ob die Anpassung realistisch ist"
- Phase 3: "Tragfähigkeit der Besetzung ehrlich bewerten", "Ist die Lücke überbrückbar?"

**Bedingt geeignet:**
- Phase 1: "Unterschiede erkennen", personalisierte Beschreibung + "Die Stelle setzt andere Schwerpunkte"
- Phase 2: "Anpassungsbedarf gezielt steuern", "Fortschritte und Anpassungsbereitschaft beobachten"
- Phase 3: "Arbeitsweise entwickelt sich in die richtige Richtung"

---

## Stressverhalten (buildStress)

Das Stressverhalten wird profilabhängig generiert. Es gibt vier Profiltypen mit unterschiedlicher Stresslogik:

| Profiltyp | controlledPressure | uncontrolledStress |
|---|---|---|
| ALL_EQUAL | Kein klarer Schwerpunkt, Reaktion situativ wechselnd | Diffuses Springen zwischen allen drei Logiken |
| TOP_PAIR (Doppeldominanz) | Wechsel zwischen den beiden Hauptbereichen | Die dritte Komponente kann stärker sichtbar werden und die Balance der beiden Hauptbereiche stören |
| BOTTOM_PAIR | Hauptlogik verstärkt sich zunächst | Beide fast gleich starken Nebenlogiken konkurrieren situativ – Verhalten wird wechselhafter |
| ORDER (klare Rangfolge) | Hauptlogik verstärkt sich | Verhalten kippt in Richtung der zweitstärksten Komponente |

**BOTTOM_PAIR-Sonderregel:** Wenn eine Komponente klar führt und die beiden anderen innerhalb der Gleichheitstoleranz (≤ 5 Punkte Differenz) liegen, verstärkt sich unter kontrolliertem Druck zunächst die führende Komponente. Unter unkontrolliertem Stress konkurrieren die beiden fast gleich starken Nebenkomponenten situativ miteinander. Das Verhalten kann dann je nach Situation in unterschiedliche Richtungen kippen und wirkt weniger berechenbar.

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
FitSubtype: MISMATCH
```

### Beispiel 4: Nicht geeignet (HARD_CONFLICT – ALL_EQUAL vs BOTTOM_PAIR)
```
Soll: I=35  N=33  A=32  (ALL_EQUAL)
Ist:  I=41  N=30  A=29  (BOTTOM_PAIR)

Soll-Relationen: I:N=0, I:A=0, N:A=0
Ist-Relationen:  I:N=1, I:A=1, N:A=0
→ HARD_CONFLICT (2 Relationen kippen – nicht nur 1)

→ NICHT GEEIGNET
FitSubtype: MISMATCH
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

## Externes KO (koRuleTriggered)

Vor dem Paarrelationen-Vergleich prüft das System, ob ein **sofortiges KO** aus der erweiterten Rollenanalyse vorliegt. Diese Prüfung verwendet das `roleAnalysis`-Objekt (aus dem JobCheck) und überschreibt jedes andere Ergebnis mit "Nicht geeignet".

### KO-Regeln

| # | Bedingung | Erklärung |
|---|-----------|-----------|
| 1 | Rolle EXTREME_I (I ≥ 65) und Kandidat I ≤ 35 | Extreme Tempo-Stelle, Kandidat zu langsam |
| 2 | Rolle EXTREME_N (N ≥ 55) und Kandidat N ≤ 30 | Extreme Beziehungs-Stelle, Kandidat zu sachorientiert |
| 3 | Rolle EXTREME_A (A ≥ 65) und Kandidat A ≤ 35 | Extreme Analyse-Stelle, Kandidat zu unstrukturiert |
| 4 | Rolle und Kandidat haben verschiedene Hauptprägung UND Hauptdifferenz ≥ 18 | Fundamentaler Richtungswechsel |
| 5 | Rolle hat klare Dominanz (gap1 ≥ 20) UND verschiedene Hauptprägung UND Hauptdifferenz ≥ 15 | Starke Einzeldominanz wird nicht abgebildet |
| 6 | Rolle ist DUAL (Doppelschwerpunkt) UND Kandidat erreicht bei einem der beiden Dual-Werte weniger als 75% des Soll-Wertes | Doppelschwerpunkt wird nicht getragen |
| 7 | Führung erforderlich UND Führungsprofil I ≥ 60 UND Kandidat I ≤ 35 | Impulsive Führung verlangt, Kandidat kann nicht liefern |

### Wichtig: Slider-Synchronisation

Wenn der User den Soll-Profil-Slider bewegt, wird `roleAnalysis.role_profile` automatisch mit den neuen Slider-Werten synchronisiert. Dadurch arbeiten die KO-Regeln immer mit den angezeigten Werten, nicht mit den originalen JobCheck-Werten.

Die übrigen Profile im `roleAnalysis`-Objekt (frame_profile, leadership.profile, tasks_profile, human_profile) bleiben unverändert – diese kommen direkt aus dem JobCheck und sind nicht per Slider editierbar.

---

## Erweiterte Kontrollintensität (calcControlIntensity)

Wenn ein `roleAnalysis`-Objekt vorhanden ist, wird die Kontrollintensität zusätzlich durch diese Faktoren beeinflusst:

| Bedingung | Punkte |
|-----------|--------|
| Verschiedene Hauptprägung ODER Dual/Nicht-Dual-Mismatch | +2 |
| Rolle ist EXTREME | +1 |
| Rolle hat gap1 ≥ 12 | +1 |
| Hauptdifferenz ≥ 25 | +3 |
| Hauptdifferenz ≥ 15 | +2 |
| Führung erforderlich, Führungsprofil-Differenz ≥ 15 | +2 |
| Rahmen-Profil dominant (≥ 75%) und Kandidat hat andere Hauptprägung | +2 |
| Rahmen-Profil stark (≥ 65%) und Kandidat hat andere Hauptprägung | +1 |
| Marktdruck hoch und Rolle-I minus Kandidat-I ≥ 15 | +1 |
| Regulierung hoch und Rolle-A minus Kandidat-A ≥ 15 | +1 |
| Change-Rate hoch und Kandidat-A minus Rolle-A ≥ 15 | +1 |

Stufen: 0–2 = LOW, 3–5 = MEDIUM, ≥ 6 = HIGH

---

## Schwellenwerte im Überblick

| Parameter | Wert | Verwendung |
|-----------|------|------------|
| EQ_TOL | 5 | Wann gelten zwei Werte als "gleich" (Paarrelation = 0)? |
| GOOD_TOL | 5 | Max. Abweichung für "geeignet" (nur bei EXACT) |
| COND_TOL | 10 | Max. Abweichung für "bedingt geeignet" |

---

## Datenfluss im Detail

```
┌──────────────────────────────────────────────────────────┐
│ localStorage: "rollenDnaState"                           │
│ (Enthält bioGramGesamt, fuehrung, Tätigkeiten etc.)     │
└───────────┬──────────────────────────────────────────────┘
            │
  ┌─────────▼──────────┐    ┌─────────────────────────────┐
  │ bgToTriad(gesamt)  │    │ buildRoleAnalysisFromState() │
  │ → roleTriad        │    │ → roleAnalysisObj            │
  │ (angezeigt/Slider) │    │ (role_profile, leadership,   │
  └─────────┬──────────┘    │  frame_profile, tasks etc.)  │
            │               └───────────┬─────────────────┘
            │                           │
            │   ┌───────────────────────┘
            │   │
            │   │  useEffect: Wenn roleTriad sich ändert,
            │   │  wird roleAnalysisObj.role_profile
            │   │  automatisch synchronisiert
            │   │
  ┌─────────▼───▼──────────────────────────────────────┐
  │ computeSollIst(roleName, candName,                 │
  │   roleTriad, candProfile, fuehrungsArt,            │
  │   roleAnalysisObj)                                 │
  │                                                    │
  │   1. koRuleTriggered(roleAnalysisObj, candInput)   │
  │      → externalKo (true/false)                     │
  │   2. calcControlIntensity(roleAnalysisObj, cand)   │
  │      → effectiveControlLevel                       │
  │   3. computeCoreFit(roleTriad, candProfile,        │
  │      externalKo)                                   │
  │      → Paarrelationen → Strukturvergleich → Fit    │
  └────────────────────────┬───────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ SollIstResult│
                    │ (fitLabel,   │
                    │  control,    │
                    │  devLevel,   │
                    │  Texte...)   │
                    └─────────────┘
```

---

## Lokalisierung

Der MatchCheck unterstützt vollständig sechs Sprachregionen. Alle UI-Texte in `soll-ist-bericht.tsx` sind über `useUI()`-Keys aus der Datenbank konfigurierbar (editierbar über `/ubersetzung`):

| Region | Sprache | Besonderheiten |
|--------|---------|----------------|
| **DE** | Deutsch | Standarddeutsch mit ß |
| **CH** | Deutsch | ss statt ß, Schweizer Begriffe |
| **AT** | Deutsch | Österreichische Formulierungen |
| **EN** | Englisch | Alle Labels und Beschriftungen auf Englisch |
| **FR** | Französisch | Alle Labels und Beschriftungen auf Französisch |
| **IT** | Italienisch | Alle Labels und Beschriftungen auf Italienisch |

Der **KI-generierte Passungsbericht** (`/api/generate-soll-ist-narrative`) erscheint ebenfalls in der Sprache der eingestellten Region. Schreibregeln für DE und EN sind in `Entscheidungsbericht-Logik.md` (Abschnitt 18) dokumentiert.

---

## Dateien

| Datei | Inhalt |
|-------|--------|
| `client/src/lib/jobcheck-engine.ts` | `getVariantMeta()`, `getPairRelations()`, `getStructureFromPairs()`, `computeCoreFit()`, `koRuleTriggered()`, `calcControlIntensity()`, `buildRoleAnalysisFromState()` |
| `client/src/lib/soll-ist-engine.ts` | `computeSollIst()` — orchestriert KO + Engine + Berichtsaufbau, `deriveFitSubtype()`, `capSeverity()`, Stress- und 30-Tage-Plan-Generierung |
| `client/src/lib/matchcheck-texts.ts` | `buildMatchTexts()` — Textgenerierung für alle Berichtssektionen inkl. Integrationsplan, Doppeldominanz-Textinterpretation |
| `client/src/lib/text-variants.ts` | Kontrollierte Variantenrotation pro Sektion und FitSubtype-Level (3–4 gleichwertige Formulierungen, stabiler Hash aus Rollen-/Personenname) |
| `client/src/lib/passungsnaehe.ts` | Visual-Fit-Marker / Passungsnähe-Visualisierung im Bericht |
| `client/src/pages/soll-ist-bericht.tsx` | UI-Komponente mit Slidern, Slider-Sync, Berichtsdarstellung; **Click-to-Edit** der Prozent-Werte in Soll- und Ist-Profil (Direkt-Eingabe statt nur Slider); alle Texte via `useUI()`-Keys i18n-fähig |
| `client/src/lib/pdf-direct-builder.ts` | Programmatischer PDF-Export des Soll-Ist-Berichts (hochauflösend, keine Canvas-Umwandlung) |
| `tests/matchcheck-runner.ts` | Test-Runner für alle 13 Varianten + Grenzfälle |
| `tests/text-consistency-runner.ts` | 169 Cross-Variant-Tests (13×13 Matrix) + Konsistenz-Checks |

---

## Testabdeckung

Die Test-Suite prüft alle **169 Kombinationen** (13 Soll-Varianten × 13 Ist-Varianten):

| Test-Kategorie | Prüfungen |
|---|---|
| Symmetrischer Selbstvergleich | Jede Variante gegen sich selbst → PERFECT |
| Subtype-Verteilung (13×13) | PERFECT=13, PARTIAL=24, MISMATCH=132 |
| Text-Konsistenz | fitLabel, Führungsaufwand, Entwicklungsaufwand, severity, Integrationsplan müssen zusammenpassen |
| Grenzwert-Tests | maxGap=5 vs 6 vs 7, EXACT vs SOFT_CONFLICT an den Schwellen |

In der 13×13-Referenzmatrix werden nur Strukturvarianten gegeneinander getestet. Deshalb entstehen dort keine Fälle mit STRUCTURE_MATCH_INTENSITY_OFF, weil diese exakte Strukturgleichheit bei gleichzeitig erhöhter Intensitätsabweichung voraussetzen. Diese Fälle werden in separaten Intensitätstests geprüft.
