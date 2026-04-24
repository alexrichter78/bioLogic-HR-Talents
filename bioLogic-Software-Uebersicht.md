# bioLogic HR Talents -- Software-Übersicht

> Stand: April 2026

## Was ist bioLogic HR Talents?

bioLogic HR Talents ist eine webbasierte HR-Plattform für **Präzision in Besetzung und Teamstruktur**. Die Software hilft Führungskräften, HR-Verantwortlichen und Beratern dabei, Stellenprofile systematisch zu analysieren, Kandidaten fundiert zu bewerten und Teamstrukturen gezielt zu optimieren.

Das System basiert auf dem **bioLogic-Modell** -- einem Drei-Dimensionen-Ansatz, der jede Rolle und jede Person in drei Grundprägungen beschreibt:

| Prägung | Fokus | Farbe |
|---|---|---|
| **Impulsiv** | Handlung, Entscheidung, Umsetzung | Rot |
| **Intuitiv** | Kommunikation, Empathie, Zusammenarbeit | Gelb |
| **Analytisch** | Struktur, Planung, Systematik | Blau |

Aus diesen drei Prägungen ergibt sich ein individuelles Profil -- die sogenannte **Rollen-DNA** bzw. das **Persönlichkeitsprofil** -- das die Grundlage für alle weiteren Analysen bildet.

---

## Die Module im Überblick

### 1. Rollen-DNA -- Das Stellenprofil definieren

Der Einstiegspunkt jeder Analyse. In einem geführten **3-Schritt-Wizard** wird eine Stelle systematisch beschrieben:

1. **Tätigkeiten** -- Welche Aufgaben prägen die Stelle (Haupttätigkeiten, Nebentätigkeiten, Führungstätigkeiten)?
2. **Humankompetenzen** -- Welche zwischenmenschlichen Fähigkeiten sind gefordert?
3. **Führungskompetenzen** -- Welche Art von Führung ist verlangt (fachlich, koordinierend, disziplinarisch)?

Jede Tätigkeit wird mit einer Gewichtung versehen (Niedrig / Mittel / Hoch) und einem bioLogic-Anteil (impulsiv / intuitiv / analytisch) zugeordnet. Daraus entsteht die **Rollen-DNA**: ein Prozentwert-Dreiklang (z.B. 45% Impulsiv / 30% Intuitiv / 25% Analytisch).

**Ergebnis:** Ein vollständiger **KI-generierter Strukturbericht** mit:
- Verhaltensanalyse (Alltag, Belastung, Stress, Entscheidungsverhalten)
- Teamwirkung und Spannungsfelder
- Führungstypbeschreibung und -anforderungen
- Fehlbesetzungsrisiken und Fazit

**PDF-Export:** Der Strukturbericht kann als vollständiges PDF exportiert werden.

---

### 2. JobCheck -- Kandidaten bewerten (Entscheidungsbericht)

Ist die Rollen-DNA definiert, kann ein Kandidat dagegen geprüft werden:

- **Kandidatenprofil** eingeben (Schieberegler oder Testwerte)
- **Automatische Passungsanalyse** mit klarem Ergebnis:
  - **Geeignet** -- Strukturelle Übereinstimmung, Abweichung ≤ 15 %
  - **Bedingt geeignet** -- Steuerbare Abweichungen, 15–25 %
  - **Nicht geeignet** -- Wesentliche Diskrepanz zwischen Rolle und Person, > 25 %
- **Detaillierte Auswertung** über verschiedene Arbeitsbereiche (Alltag, Belastung, Druck)
- **KI-generierter Entscheidungsbericht** mit:
  - Rollencharakter und Gesamtprofil
  - Rahmenbedingungen und Erfolgsmessung
  - Führungskontext und Wirkungshebel
  - Kompetenzanalyse, Spannungsfelder und Risikoabschätzung
  - Fazit mit Besetzungsempfehlung
- **Interviewfragen** automatisch generiert, zugeschnitten auf die erkannten Abweichungen

**Modell:** GPT-4.1 (Temperature 0.7, JSON-Format)

---

### 3. MatchCheck -- Soll-Ist-Vergleich (Passungsbericht)

Der MatchCheck vergleicht ein Kandidatenprofil (Ist) direkt und tiefer gehend mit der Rollen-DNA (Soll):

- **Gap-Analyse** mit Abstandsberechnung auf Komponentenebene (Impulsiv / Intuitiv / Analytisch)
- **Fit-Status:** SUITABLE / CONDITIONAL / NOT_SUITABLE mit Steuerungsintensität (NIEDRIG / MITTEL / HOCH)
- **Systemwirkung** -- wie wirkt die Abweichung im Alltag konkret aus?
- **KI-generierter Passungsbericht** mit:
  - Executive Summary und Bewertungsmatrix
  - Konstellationsrisiken (kurz-, mittel-, langfristig)
  - Dominanzverschiebungsanalyse
  - Entwicklungsprognose und 90-Tage-Integrationsplan
- **Kritisch-Bereich-Identifikation** -- welche Kompetenzdimension belastet die Zusammenarbeit am stärksten?

**PDF-Export:** Vollständig programmatisch generierter, hochauflösender Passungsbericht.

---

### 4. TeamCheck -- Integration ins Team prüfen

Bevor ein Kandidat eingestellt wird, analysiert der TeamCheck die Auswirkungen auf das bestehende Team:

- **Teamprofil** eingeben (Durchschnittswerte des Teams)
- **Integrationsbewertung** mit Ampelsystem:
  - **Grün (Stabil)** -- Kandidat passt ohne erhöhten Steuerungsaufwand
  - **Gelb (Steuerbar)** -- Benachbarte Konstellation, Begleitung empfohlen
  - **Rot (Spannungsfeld)** -- Gegensätzliche Konstellation, aktive Steuerung nötig
- **Systemwirkung:** Verstärkt die Person das Team (VERSTÄRKUNG), ergänzt sie es (ERGÄNZUNG), bringt sie Spannung (REIBUNG) oder transformiert sie die Dynamik (TRANSFORMATION)?
- **Distribution Gap** und **Dominance Clash** als quantitative Kennzahlen
- **Shift-Analyse** mit Kategorie-Beschreibung und Empfehlungen
- **PDF-Export** des Team-Berichts

---

### 5. Louis -- Der KI-Coach

Ein KI-gestützter Sparringspartner für Führungskräfte und HR-Verantwortliche, der als **Mensch mit 20 Jahren HR-Erfahrung** auftritt -- nicht als Chatbot:

- **Themenfelder:** Führung, Recruiting, Teamkonflikte, Kommunikation, Onboarding, Employer Branding
- **Kontextbewusst:** Louis kennt die aktuellen Analysedaten (Rollen-DNA, JobCheck, MatchCheck, TeamCheck) und bezieht sie in seine Antworten ein
- **Spezial-Modi:**
  - Standard-Coaching: direkte, praxisnahe Antworten
  - Rollenspiel-Simulation: schwierige Gespräche vorbereiten
  - Kreativer Modus: Stellenanzeigen und Kommunikationsmaterial mit bioLogic-Sprache erstellen
- **Tools:**
  - **Web-Suche:** Aktuelle Arbeitsmarktdaten und Studien recherchieren
  - **Bildgenerierung:** Professionelle Stockfotos für Stellenanzeigen erstellen (DALL-E)
  - **Dokumenten-Upload:** PDFs und Bilder hochladen und analysieren lassen
- **Wissensbasis:** Über 50 Fachartikel, Praxisfälle und Checklisten der bioLogic-Methodik
- **Themenkomprimierung:** Bei langen Gesprächen (> 10 Nachrichten) wird die Gesprächshistorie automatisch komprimiert

**Modell:** Claude Sonnet (Anthropic, via Replit-Integration)

---

## Administration

### Admin-Bereich (/admin)

Für Administratoren und Subadmins steht ein vollständiger Verwaltungsbereich zur Verfügung:

| Bereich | Funktion |
|---------|----------|
| **Benutzerverwaltung** | Benutzer anlegen, Rollen (user / subadmin / admin) vergeben, KI-Limits setzen |
| **Organisationsverwaltung** | Firmenaccounts und AI-Quoten verwalten |
| **Wissensbasis** | Knowledge-Dokumente für Louis pflegen |
| **System-Prompt** | Louis' Verhalten anpassen |
| **Golden Answers** | Hochwertige Referenzantworten pflegen |
| **Feedback** | Nutzer-Feedback zu Louis einsehen |

### Übersetzungsverwaltung (/ubersetzung)

Die **Übersetzungsseite** ermöglicht es Administratoren, alle Oberflächentexte der Plattform direkt im Browser zu bearbeiten:

- **Inline-Editing:** Jeder Übersetzungsschlüssel kann per Klick bearbeitet werden
- **4 Sprachen:** DE, EN, FR, IT (vollständig unterstützt)
- **Datenbank-Overrides:** Geänderte Texte werden in der Datenbank gespeichert und haben Vorrang vor den Code-Defaults
- **CSV-Export:** Alle Übersetzungen können als CSV exportiert werden
- **Live-Sync:** Lokale Keys werden beim Laden automatisch mit der Datenbank synchronisiert

---

## Für wen ist die Software?

| Zielgruppe | Typischer Einsatz |
|---|---|
| **HR-Abteilungen** | Stellenprofile definieren, Kandidaten bewerten, Entscheidungsberichte erstellen |
| **Führungskräfte** | Teamzusammensetzung analysieren, Führungshinweise erhalten, Coaching mit Louis |
| **Personalberater** | Mandantenprofile erstellen, Passungsanalysen für Kandidaten durchführen |
| **Coaches & Trainer** | bioLogic-Methodik in Beratungsprojekten einsetzen |
| **Geschäftsführung** | Strategische Personalentscheidungen auf Datenbasis treffen |

---

## Was macht bioLogic HR Talents besonders?

1. **Strukturell, nicht subjektiv** -- Analysen basieren auf einem klaren Modell, nicht auf Bauchgefühl
2. **Durchgängiger Prozess** -- Von der Stellendefinition über die Kandidatenbewertung und den Soll-Ist-Vergleich bis zur Teamintegration
3. **KI-gestützt** -- Intelligente Berichte, Empfehlungen und ein persönlicher Coach
4. **Sofort einsetzbar** -- Webbasiert, kein Download, kein Training nötig
5. **Mehrsprachig** -- Vollständig in 6 Sprachregionen (DE, CH, AT, EN, FR, IT)
6. **Editierbar** -- Alle Oberflächentexte über die Übersetzungsverwaltung anpassbar
7. **Datenschutz** -- Alle Analysen laufen gesichert, Login-geschützt und organisationsgebunden

---

## Der typische Workflow

```
Rollen-DNA    -->    JobCheck    -->    MatchCheck    -->    TeamCheck    -->    Entscheidung
(Stelle               (Kandidat          (Soll-Ist-           (Team-              (Bericht +
 definieren)           bewerten)          Vergleich)            Integration)         Empfehlung)
                                                                          |
                                                                          v
                                                                   Louis (KI-Coach)
                                                              (Begleitung durch den
                                                               gesamten Prozess)
```

**Schritt 1:** Stelle analysieren und Rollen-DNA erstellen (Strukturbericht + PDF)
**Schritt 2:** Kandidat gegen die Rollen-DNA prüfen (JobCheck / Entscheidungsbericht)
**Schritt 3:** Tiefgehenden Soll-Ist-Vergleich erstellen (MatchCheck / Passungsbericht + PDF)
**Schritt 4:** Auswirkung auf das Team simulieren (TeamCheck + PDF)
**Begleitend:** Louis als KI-Coach für Rückfragen, Gesprächsvorbereitung und Strategieberatung

---

## Regionale Anpassung

Die Software unterstützt **6 Sprachregionen** mit vollständig angepasster Sprachausgabe:

| Region | Sprachausgabe | Besonderheiten |
|--------|---------------|----------------|
| **DE** | Deutsch | Standarddeutsch mit ß |
| **CH** | Deutsch | Schweizer Schreibweise (ss statt ß), landesspezifische Begriffe |
| **AT** | Deutsch | Österreichische Formulierungen und Begriffe |
| **EN** | Englisch | Vollständig englischsprachig, inkl. bioLogic-Termini auf Englisch |
| **FR** | Französisch | Vollständig französischsprachig |
| **IT** | Italienisch | Vollständig italienischsprachig |

Alle Oberflächentexte sind über die Übersetzungsverwaltung (`/ubersetzung`) anpassbar. KI-generierte Berichte (Entscheidungsbericht, Passungsbericht) erscheinen ebenfalls in der jeweiligen Sprache des Nutzers.

---

*bioLogic HR Talents -- Präzision in Besetzung und Teamstruktur.*
