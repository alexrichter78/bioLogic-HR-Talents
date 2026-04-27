import { useEffect, useMemo, useRef, useState } from "react";
import GlobalNav from "@/components/global-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  HelpCircle, Search, BookOpen, LogIn, LayoutDashboard, Briefcase, GitCompareArrows,
  Users, Bot, GraduationCap, UserCog, MessageCircleQuestion, LifeBuoy,
  Lightbulb, AlertTriangle, ChevronRight, Image as ImageIcon, ChevronUp,
} from "lucide-react";

type Block =
  | { type: "p"; text: string }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "tip"; text: string }
  | { type: "warn"; text: string }
  | { type: "image"; src: string; caption: string; mock?: { title: string; bullets: string[] } }
  | { type: "list"; items: string[] };

type Section = {
  id: string;
  title: string;
  shortTitle?: string;
  icon: typeof HelpCircle;
  intro: string;
  blocks: Block[];
};

const SECTIONS: Section[] = [
  {
    id: "erste-schritte",
    title: "Erste Schritte",
    icon: LogIn,
    intro:
      "So meldest du dich an, stellst die Sprache ein und findest dich in der Software zurecht.",
    blocks: [
      { type: "p", text: "bioLogic HR-Talents ist deine Software für die strukturelle Analyse von Stellen, Personen und Teams. Du arbeitest komplett im Browser — es muss nichts installiert werden." },
      {
        type: "steps",
        items: [
          { title: "Anmelden", text: "Öffne https://www.my-biologic.de/, gib deinen Benutzernamen und dein Passwort ein und klicke auf „Anmelden”. Die Zugangsdaten hast du per E-Mail erhalten." },
          { title: "Sprache schon beim Login wählen", text: "Auf der Anmeldemaske findest du rechts ein Sprach-Auswahlfeld mit Länderflaggen (DE / AT / CH / EN / FR / IT). Wähle hier die Sprache, in der die Software nach dem Login startet." },
          { title: "Passwort ändern (empfohlen)", text: "Wir empfehlen, das Standardpasswort beim ersten Login zu ändern. Klicke dazu auf der Anmeldemaske auf „Passwort vergessen?”, trage die hinterlegte E-Mail-Adresse ein und klicke auf „Link anfordern”. Du bekommst eine E-Mail mit einem Link, über den du ein neues Passwort vergeben kannst (mindestens 4 Zeichen)." },
          { title: "Navigation kennenlernen", text: "Die Hauptnavigation oben enthält: Home, JobCheck (Stellenprofil), MatchCheck (Stelle ↔ Person), TeamCheck (Teamstruktur) und Louis (KI-Coach). Wenn dein Konto für den Kursbereich freigeschaltet ist, erscheint zusätzlich „Kurs”." },
        ],
      },
      {
        type: "image",
        src: "/help/01-anmeldung.png",
        caption: "Anmelde-Maske",
        mock: { title: "Anmeldung", bullets: ["bioLogic-Logo + Untertitel „HR Talents”", "Feld: Benutzername", "Feld: Passwort (mit Augen-Symbol zum Anzeigen)", "Sprach-Auswahl mit Länderflaggen", "Link „Passwort vergessen?”", "Blauer Button „Anmelden”"] },
      },
      { type: "tip", text: "Sprache später wechseln: Wenn du eingeloggt bist, findest du oben in der Navigation einen Sprach-Schalter (Globus-Symbol). Damit kannst du jederzeit zwischen DE, AT, CH, EN, FR und IT umschalten." },
    ],
  },
  {
    id: "startseite",
    title: "Startseite",
    icon: LayoutDashboard,
    intro: "Die Startseite ist dein Einstiegspunkt. Von hier startest du deine Analysen.",
    blocks: [
      { type: "p", text: "Die Startseite ist bewusst schlicht gehalten: Sie zeigt zwei große Karten, mit denen du sofort loslegen kannst — alles Weitere erreichst du über die Navigation oben." },
      {
        type: "list",
        items: [
          "Karte „Stellenprofil”: startet eine neue Stellenanalyse oder lädt eine zuvor gespeicherte Analyse aus einer Datei.",
          "Karte „Louis”: öffnet den KI-Coach für Fragen zu Führung, Recruiting, Teamthemen und Gesprächsvorbereitung.",
        ],
      },
      {
        type: "image",
        src: "/help/02-startseite.png",
        caption: "Startseite mit den beiden Hauptkarten",
        mock: { title: "Startseite", bullets: ["Karte „Stellenprofil” mit Beschreibung und Bullet-Liste", "Buttons „Neue Analyse” und „Analyse öffnen” (lädt eine gespeicherte Datei)", "Karte „Louis” mit Button „Louis öffnen”", "Hauptnavigation oben mit allen Bereichen"] },
      },
      { type: "tip", text: "Wenn schon Daten aus einer früheren Analyse im Browser gespeichert sind, fragt dich die Software bei „Neue Analyse” zuerst „Bist du sicher? Alle eingegebenen Daten werden gelöscht.”, bevor sie zurücksetzt." },
      { type: "tip", text: "Mit „Analyse öffnen” kannst du eine zuvor exportierte Stellenprofil-Datei (.json) wieder einlesen und damit weiterarbeiten." },
    ],
  },
  {
    id: "jobcheck",
    title: "JobCheck — Stellenprofil definieren",
    shortTitle: "JobCheck",
    icon: Briefcase,
    intro:
      "Mit dem JobCheck definierst du ein Stellenprofil in drei Schritten. Das Stellenprofil ist die Grundlage für den MatchCheck und den TeamCheck.",
    blocks: [
      { type: "p", text: "Das Stellenprofil beschreibt, was die Stelle wirklich braucht — Aufgabenstruktur, Arbeitsweise, Erfolgsfokus, Führungsverantwortung und die konkreten Tätigkeiten. Plane für eine sorgfältige Erfassung etwa 10–15 Minuten ein." },
      {
        type: "steps",
        items: [
          { title: "1. Welche Stelle?", text: "Gib die Stellenbezeichnung ein (z.B. „Vertriebsleiter Region Süd”) und wähle das Land/Region. Optional kannst du Besonderheiten der Stelle ergänzen — was sie von einem Standardberuf unterscheidet." },
          { title: "2. Rahmenbedingungen", text: "Wähle die Aufgabenstruktur (überwiegend operativ / systemisch / strategisch / gemischt), die Arbeitsweise (umsetzungs-, daten- oder menschenorientiert), zwei Erfolgsfokus-Schwerpunkte und die Führungsverantwortung (keine / Projekt-Koordination / fachliche Führung / Personalverantwortung)." },
          { title: "3. Tätigkeiten", text: "Die Software schlägt typische Tätigkeiten für die Stelle vor. Du kannst sie übernehmen, ändern, ergänzen oder löschen. Jede Tätigkeit bekommt eine Kompetenz-Zuordnung (Impulsiv / Intuitiv / Analytisch) und ein Niveau (Niedrig / Mittel / Hoch). Daraus berechnet sich das Sollprofil." },
        ],
      },
      {
        type: "image",
        src: "/help/03-jobcheck.png",
        caption: "JobCheck — Tätigkeiten erfassen",
        mock: { title: "Schritt 3: Tätigkeiten", bullets: ["Liste mit Tätigkeitskarten (Hauptaufgabe / Nebenaufgabe / Führung)", "Pro Tätigkeit: Kompetenz-Auswahl (Impulsiv / Intuitiv / Analytisch) und Niveau (Niedrig / Mittel / Hoch)", "Buttons „Neue Tätigkeit” und „Stelle analysieren”", "Sollprofil-Vorschau mit drei Werten"] },
      },
      { type: "p", text: "Wenn du fertig bist, klickst du auf „Stelle analysieren” — du landest direkt im Stellenprofil-Bericht mit dem berechneten Sollprofil und einer Kurzbeschreibung der dominanten Logik der Stelle." },
      {
        type: "image",
        src: "/help/04-rollenprofil.png",
        caption: "Stellenprofil-Bericht",
        mock: { title: "Stellenprofil-Bericht", bullets: ["Kurzprofil der Stelle in Klartext", "Drei Werte (Impulsiv / Intuitiv / Analytisch) als Prozentzahlen", "Erläuterung der dominanten Logik der Stelle", "Buttons „Stellenprofil ändern” und „Stellenprofil speichern”"] },
      },
      { type: "tip", text: "Du kannst ein Stellenprofil als Datei speichern und später wieder öffnen — über die Buttons „Analyse öffnen” auf der Startseite. So baust du dir nach und nach eine Sammlung deiner geprüften Stellen auf." },
      { type: "warn", text: "Beantworte die Fragen so realistisch wie möglich. Wenn du nur „nett klingende” Antworten anklickst, wird das Sollprofil ungenau — und damit auch der spätere Vergleich mit einer Person." },
    ],
  },
  {
    id: "matchcheck",
    title: "MatchCheck — Passung Stelle ↔ Person",
    shortTitle: "MatchCheck",
    icon: GitCompareArrows,
    intro:
      "Der MatchCheck zeigt dir, wie gut eine Person strukturell auf die Stelle passt — mit Begründung und Hinweisen zu Führungsaufwand und Risiken.",
    blocks: [
      { type: "p", text: "Voraussetzung: Du hast bereits ein Stellenprofil im JobCheck erstellt. Im MatchCheck siehst du dann das Sollprofil der Stelle und gibst daneben das Ist-Profil der Person ein." },
      {
        type: "steps",
        items: [
          { title: "Profile vergleichen", text: "Im Bereich „Passungsanalyse konfigurieren” siehst du links das Sollprofil (aus dem Stellenprofil) und rechts das Ist-Profil der Person. Verschiebe die Schieberegler beim Ist-Profil so, dass sie der Person entsprechen — die Werte werden automatisch normalisiert (max. 67 % pro Komponente)." },
          { title: "Bericht erstellen", text: "Klicke auf „Bericht erstellen”. Der MatchCheck wird auf Basis der beiden Profile generiert. Das dauert in der Regel 15–25 Sekunden." },
          { title: "Bericht lesen", text: "Du erhältst eine Gesamtbewertung (Geeignet / Bedingt geeignet / Nicht geeignet) mit ausführlicher Begründung, einer Risikoprognose, Hinweisen zum Führungs- und Entwicklungsaufwand sowie einem 30-Tage-Integrationsplan." },
        ],
      },
      {
        type: "image",
        src: "/help/05-matchcheck.png",
        caption: "MatchCheck — Bericht",
        mock: { title: "MatchCheck-Bericht", bullets: ["Kopfzeile mit Gesamteinschätzung (Geeignet / Bedingt / Nicht geeignet)", "Kennzahlen: Grundpassung, Führungsaufwand, Profilabweichung, Entwicklungsaufwand", "Vergleich der Profile (Soll vs. Ist) mit Erklärungen", "Abschnitte: Stärken, Auffällig, Kritisch, Verhalten unter Druck, Risikoprognose", "30-Tage-Integrationsplan", "Button „Drucken” (im Druckdialog „Als PDF speichern” wählen)"] },
      },
      { type: "tip", text: "Lies immer die Abschnitte „Worauf es ankommt” und „Risikoprognose” — sie sagen dir konkret, worauf du im Vorstellungsgespräch und in der Einarbeitung besonders achten solltest." },
      { type: "tip", text: "Den Bericht kannst du als PDF speichern: Klick auf „Drucken” und im Druckdialog „Als PDF speichern” wählen." },
    ],
  },
  {
    id: "teamcheck",
    title: "TeamCheck — Teamstruktur analysieren",
    shortTitle: "TeamCheck",
    icon: Users,
    intro:
      "Der TeamCheck zeigt dir, wie eine neue Person in ein bestehendes Team passt — und welche Wirkung sie auf die Teamdynamik hat.",
    blocks: [
      { type: "p", text: "Auch eine fachlich passende Person kann ein Team aus dem Gleichgewicht bringen, wenn die Konstellation nicht stimmt. Der TeamCheck hilft dir, das vor der Besetzung zu sehen." },
      {
        type: "steps",
        items: [
          { title: "Team-Kontext erfassen", text: "Trage die Stellenbezeichnung ein. Füge dann die bestehenden Teammitglieder hinzu — pro Person eine Rolle (Teammitglied oder Führungskraft) und ihr Profil (Impulsiv / Intuitiv / Analytisch über Schieberegler)." },
          { title: "Teamziel wählen", text: "Wähle, was das Team aktuell am meisten braucht: Umsetzung und Ergebnisse, Analyse und Struktur, Zusammenarbeit und Kommunikation — oder „Keins”, wenn es kein klares Schwerpunktziel gibt." },
          { title: "Person eintragen und Bericht erstellen", text: "Trage die Person ein, deren Wirkung aufs Team du prüfen willst (Profil per Schieberegler). Klicke auf „Bericht erstellen”." },
        ],
      },
      {
        type: "image",
        src: "/help/06-teamcheck.png",
        caption: "TeamCheck — Bericht",
        mock: { title: "TeamCheck-Bericht", bullets: ["Vergleich der Profile (Person vs. Team)", "Kennzahlen: Systemwirkung, Integrationsaufwand, Teampassung, Wirkung aufs Teamziel", "Abschnitte: Stärke der Besetzung, Risiko der Besetzung, Chancen, Risiken", "Verhalten unter Druck, Hinweise für die Führungskraft", "Integrationsplan in Phasen mit Zielen, Praxisbezug, Warnsignalen, Leitfragen", "Button „Drucken” (PDF-Export)"] },
      },
      { type: "warn", text: "Eine kritische Bewertung heißt nicht automatisch „nicht besetzen”. Sie heißt: Schau dir die genannten Punkte vorher genau an und plane konkrete Gegenmaßnahmen ein — der Integrationsplan im Bericht ist genau dafür da." },
    ],
  },
  {
    id: "ki-coach",
    title: "Louis (KI-Coach)",
    shortTitle: "Louis",
    icon: Bot,
    intro:
      "Louis ist dein bioLogic Coach für Entscheidungen im richtigen Moment — direkt im Chat, jederzeit verfügbar, auch ohne vorhandene Analyse.",
    blocks: [
      { type: "p", text: "Louis unterstützt dich bei Fragen rund um Führung, Personalentscheidungen, Assessment, Bewerbungsgespräche und Kommunikation. Er kennt die bioLogic-Methodik und kann seine Antworten an deine konkrete Situation anpassen." },
      {
        type: "list",
        items: [
          "Recruiting und Stellenanzeigen formulieren lassen",
          "Bewerbungs-, Feedback- und Konfliktgespräche vorbereiten",
          "Teamkonstellationen analysieren und Konfliktmuster verstehen",
          "Rollenspiele und Gesprächssimulationen durchspielen",
          "Quellenbasierte Antworten zu Führungsthemen",
        ],
      },
      {
        type: "steps",
        items: [
          { title: "Louis öffnen", text: "Klicke in der Hauptnavigation auf „Louis (KI-Coach)” oder auf der Startseite auf den Button „Louis öffnen”." },
          { title: "Frage stellen — oder Musterprompt nutzen", text: "Schreib deine Frage einfach ins Eingabefeld unten. Über den Button „Musterprompts” findest du fertige Beispielfragen, die du als Startpunkt verwenden und anpassen kannst." },
          { title: "Stelle als Kontext anhängen (optional)", text: "Über das Plus-Symbol neben dem Eingabefeld kannst du ein bereits analysiertes Stellenprofil als Kontext mitgeben. Außerdem kannst du Bilder oder PDF-/Textdokumente hochladen — Louis bezieht sie in seine Antwort ein." },
          { title: "Mit dem Verlauf arbeiten", text: "Über das Verlauf-Symbol siehst du frühere Unterhaltungen. Du kannst sie suchen, umbenennen, anpinnen oder löschen. Mit „Neue Unterhaltung” startest du ein frisches Gespräch." },
          { title: "Antworten weiterverwenden", text: "Über die Buttons unter jeder Antwort kannst du den Text kopieren oder das ganze Gespräch als TXT-Datei exportieren." },
        ],
      },
      {
        type: "image",
        src: "/help/07-ki-coach.png",
        caption: "Louis — Chat-Oberfläche",
        mock: { title: "Louis-Chat", bullets: ["Begrüßungstext von Louis", "Eingabefeld unten mit Symbolen für Bild- und Dokument-Upload (Büroklammer)", "Buttons: Musterprompts, Neue Unterhaltung, Verlauf, Gespräch exportieren, Gespräch löschen", "Tipps-Bereich für bessere Antworten"] },
      },
      { type: "tip", text: "Beschreibe Louis immer die Situation und die beteiligten Personen — je mehr Kontext, desto präziser die Antwort. „Bereite mich auf ein Konfliktgespräch mit einer analytisch geprägten Mitarbeiterin vor, die meint, ihre Vorschläge würden ignoriert” funktioniert besser als „Hilfe bei Konflikt”." },
      { type: "tip", text: "Wenn das Thema wechselt: Starte eine neue Unterhaltung. Das hält den Fokus scharf und vermeidet, dass alte Inhalte die Antworten beeinflussen." },
    ],
  },
  {
    id: "kurs",
    title: "Kursbereich",
    shortTitle: "Kurs",
    icon: GraduationCap,
    intro:
      "Im Kursbereich findest du die bioLogic-Lernmodule. Sichtbar nur für Konten mit Kurs-Freischaltung.",
    blocks: [
      { type: "p", text: "Es gibt drei mögliche Ansichten — abhängig davon, ob dein Konto für den Kursbereich freigeschaltet ist und welche Rolle du hast:" },
      {
        type: "steps",
        items: [
          { title: "Kein Zugang", text: "Wenn dein Konto nicht freigeschaltet ist, siehst du eine Hinweisseite mit dem Symbol eines Schlosses und dem Text „Der Kursbereich ist für dein Konto nicht freigeschaltet. Bitte wende dich an deinen Administrator.”" },
          { title: "Mit Zugang (Standard-Nutzer)", text: "Du siehst die Übersicht der vier Module: bioLogic Kompaktkurs, bioLogic Leadership, bioLogic Recruiting und bioLogic Sales (insgesamt 4 Module mit 20 Lektionen und ca. 4 Stunden Video). Aktuell ist die Notiz „Inhalte in Vorbereitung” zu sehen — die Module werden hier automatisch erscheinen, sobald sie verfügbar sind." },
          { title: "Admin / Subadmin", text: "Wenn du Administrator oder Subadmin bist, kannst du im Kursbereich zusätzlich Teilnehmer freischalten: Vorname, Nachname und E-Mail-Adresse eintragen, beliebig viele Personen hinzufügen und mit „Zugänge freischalten” gesammelt absenden." },
        ],
      },
      {
        type: "image",
        src: "/help/08-kurs.png",
        caption: "Kursbereich — Modulübersicht",
        mock: { title: "Kursbereich", bullets: ["Vier Modulkarten (Kompaktkurs, Leadership, Recruiting, Sales) mit Vorschaubildern", "Hinweis-Box „Inhalte in Vorbereitung”", "Bei Admin/Subadmin: Zusätzliche Eingabefelder für Teilnehmer (Vorname, Nachname, E-Mail) mit Buttons „Teilnehmer hinzufügen” und „Zugänge freischalten”"] },
      },
    ],
  },
  {
    id: "profil",
    title: "Konto & Einstellungen",
    shortTitle: "Konto",
    icon: UserCog,
    intro: "So änderst du dein Passwort, deine Sprache und meldest dich ab.",
    blocks: [
      { type: "p", text: "Es gibt aktuell keine eigene Profil-Seite — alle Einstellungen findest du direkt in der Hauptnavigation oben oder über die Anmeldemaske." },
      {
        type: "steps",
        items: [
          { title: "Sprache umstellen", text: "Klicke oben in der Navigation auf das Sprach-Symbol (Globus). Im Aufklapp-Menü wählst du DE, AT, CH, EN, FR oder IT. Die Umstellung gilt sofort für alle Bereiche der Software." },
          { title: "Passwort ändern", text: "Melde dich ab, klicke auf der Anmeldemaske auf „Passwort vergessen?”, gib deine hinterlegte E-Mail-Adresse ein und klicke auf „Link anfordern”. Du bekommst eine E-Mail mit einem Link, über den du ein neues Passwort vergeben kannst (mindestens 4 Zeichen)." },
          { title: "Abmelden", text: "Klicke oben in der Navigation auf das Abmelde-Symbol. Aus Sicherheitsgründen empfehlen wir, dich nach jeder Sitzung abzumelden — vor allem auf Geräten, die mehrere Personen nutzen." },
        ],
      },
      { type: "warn", text: "Gib deine Zugangsdaten niemals weiter. Wenn jemand anderes ebenfalls mit der Software arbeiten soll, lass deinen Administrator einen eigenen Account anlegen." },
    ],
  },
  {
    id: "faq",
    title: "Häufige Fragen",
    shortTitle: "FAQ",
    icon: MessageCircleQuestion,
    intro: "Antworten auf die häufigsten Fragen.",
    blocks: [
      {
        type: "steps",
        items: [
          { title: "Mein Zugang funktioniert nicht — was tun?", text: "Prüfe zuerst, ob du Benutzername und Passwort exakt so eingibst, wie sie dir per E-Mail mitgeteilt wurden (Groß-/Kleinschreibung beachten). Wenn das Passwort nicht mehr stimmt, nutze „Passwort vergessen?”. Bleibt der Zugang verschlossen, wende dich an deinen Administrator oder per E-Mail an support@foresmind.de." },
          { title: "Wie speichere ich einen Bericht?", text: "Jeder Bericht (Stellenprofil, MatchCheck, TeamCheck) hat oben einen „Drucken”-Button. Im Druckdialog deines Browsers wählst du dann „Als PDF speichern” und kannst die Datei beliebig weiterleiten." },
          { title: "Wie sichere ich ein Stellenprofil für später?", text: "Stellenprofile kannst du als Datei exportieren und über die Startseite mit „Analyse öffnen” wieder einlesen. So baust du dir eine eigene Sammlung deiner geprüften Stellen auf." },
          { title: "Funktioniert die Software auf Smartphone und Tablet?", text: "Ja — die Hauptbereiche sind für Smartphone und Tablet optimiert. Für lange Berichte und für die Erfassung der Tätigkeiten im Stellenprofil empfehlen wir aber einen Laptop oder Desktop." },
          { title: "Werden meine Daten weitergegeben?", text: "Nein. Deine Eingaben werden ausschließlich für deine Analysen verwendet. Details findest du im Datenschutzhinweis (Link unten auf der Anmeldeseite oder im Footer)." },
          { title: "Was bedeuten Impulsiv, Intuitiv und Analytisch?", text: "Das sind die drei Grunddimensionen der bioLogic-Methodik. Impulsiv steht für Umsetzung und Tempo, Intuitiv für Zusammenarbeit und Kommunikation, Analytisch für Struktur und Planung. Die Mischung dieser drei Werte ergibt das Sollprofil einer Stelle bzw. das Ist-Profil einer Person." },
          { title: "Wo finde ich „JobCheck”, „MatchCheck” und „TeamCheck” im Menü?", text: "JobCheck führt dich zur Stellenprofil-Definition (Stelle erfassen). MatchCheck führt dich zur Passungsanalyse Stelle ↔ Person (Soll-/Ist-Vergleich). TeamCheck führt dich zur Teamstruktur-Analyse." },
        ],
      },
    ],
  },
  {
    id: "support",
    title: "Support & Kontakt",
    shortTitle: "Support",
    icon: LifeBuoy,
    intro: "Du kommst nicht weiter? So erreichst du uns.",
    blocks: [
      { type: "p", text: "Es gibt zwei Wege, schnell Hilfe zu bekommen:" },
      {
        type: "list",
        items: [
          "Hilfe-Bot unten rechts in der Software — kleines Sprechblasen-Symbol; oft die schnellste Antwort.",
          "E-Mail an support@foresmind.de — wir antworten in der Regel innerhalb eines Werktags.",
        ],
      },
      { type: "tip", text: "Beschreibe dein Anliegen so konkret wie möglich: In welchem Bereich bist du (z.B. JobCheck, MatchCheck, Louis)? Was hast du erwartet, was ist passiert? Ein Screenshot hilft uns enorm." },
      { type: "p", text: "Bei dringenden technischen Störungen wende dich bitte direkt per E-Mail an support@foresmind.de." },
    ],
  },
];

function HelpImage({ src, caption, mock }: { src: string; caption: string; mock?: { title: string; bullets: string[] } }) {
  const [errored, setErrored] = useState(false);
  return (
    <figure style={{ margin: "12px 0 18px", padding: 0 }}>
      <div style={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", background: "#FAFAFC", overflow: "hidden" }}>
        {!errored ? (
          <img
            src={src}
            alt={caption}
            onError={() => setErrored(true)}
            style={{ display: "block", width: "100%", height: "auto" }}
          />
        ) : (
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#86868B", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <ImageIcon style={{ width: 14, height: 14 }} />
              Vorschau
            </div>
            {mock && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{mock.title}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {mock.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#48484A", display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: "#0071E3", marginTop: 7, flexShrink: 0 }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
      <figcaption style={{ marginTop: 6, fontSize: 12, color: "#8E8E93", fontStyle: "italic" }}>{caption}</figcaption>
    </figure>
  );
}

function StepsList({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol style={{ margin: "8px 0 16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((s, i) => (
        <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", borderRadius: 10, background: "#F9FAFB", border: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 13, background: "#0071E3", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 2 }}>{s.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "#48484A" }}>{s.text}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function TipBox({ text, kind }: { text: string; kind: "tip" | "warn" }) {
  const isTip = kind === "tip";
  const Icon = isTip ? Lightbulb : AlertTriangle;
  const color = isTip ? "#3B82F6" : "#D97706";
  const bg = isTip ? "rgba(59,130,246,0.06)" : "rgba(245,158,11,0.06)";
  const border = isTip ? "rgba(59,130,246,0.18)" : "rgba(245,158,11,0.22)";
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 14px", borderRadius: 10, background: bg, border: `1px solid ${border}`, margin: "10px 0 16px" }}>
      <Icon style={{ width: 16, height: 16, color, flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: 13, lineHeight: 1.55, color: isTip ? "#1E3A8A" : "#92400E" }}>
        <strong style={{ marginRight: 4 }}>{isTip ? "Tipp:" : "Achtung:"}</strong>
        {text}
      </div>
    </div>
  );
}

function PlainList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "8px 0 16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((it, i) => (
        <li key={i} style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.55, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <ChevronRight style={{ width: 14, height: 14, color: "#0071E3", flexShrink: 0, marginTop: 4 }} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case "p":
      return <p key={key} style={{ fontSize: 14, lineHeight: 1.65, color: "#1D1D1F", margin: "0 0 14px" }}>{block.text}</p>;
    case "steps":
      return <StepsList key={key} items={block.items} />;
    case "tip":
      return <TipBox key={key} kind="tip" text={block.text} />;
    case "warn":
      return <TipBox key={key} kind="warn" text={block.text} />;
    case "image":
      return <HelpImage key={key} src={block.src} caption={block.caption} mock={block.mock} />;
    case "list":
      return <PlainList key={key} items={block.items} />;
  }
}

function blockText(b: Block): string {
  switch (b.type) {
    case "p": case "tip": case "warn": return b.text;
    case "steps": return b.items.map(s => `${s.title} ${s.text}`).join(" ");
    case "image": return `${b.caption} ${b.mock ? b.mock.title + " " + b.mock.bullets.join(" ") : ""}`;
    case "list": return b.items.join(" ");
  }
}

export default function Hilfe() {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.filter(s => {
      const haystack = (s.title + " " + s.intro + " " + s.blocks.map(blockText).join(" ")).toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  useEffect(() => {
    if (filtered.length === 0) return;
    if (!filtered.find(s => s.id === activeId)) {
      setActiveId(filtered[0].id);
    }
  }, [filtered, activeId]);

  function scrollToSection(id: string) {
    setActiveId(id);
    const el = sectionRefs.current[id];
    if (el) {
      const offset = isMobile ? 110 : 80;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  useEffect(() => {
    function onScroll() {
      const offset = isMobile ? 130 : 100;
      let current = filtered[0]?.id;
      for (const s of filtered) {
        const el = sectionRefs.current[s.id];
        if (el && el.getBoundingClientRect().top - offset <= 0) {
          current = s.id;
        }
      }
      if (current && current !== activeId) setActiveId(current);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [filtered, activeId, isMobile]);

  return (
    <div className="page-gradient-bg" style={{ fontFamily: "Inter, Arial, Helvetica, sans-serif", minHeight: "100vh" }}>
      <GlobalNav />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "64px 12px 80px" : "80px 24px 64px" }}>
        <header style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <BookOpen style={{ width: 22, height: 22, color: "#0071E3" }} />
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }} data-testid="text-help-title">Benutzerhandbuch</h1>
          </div>
          <p style={{ fontSize: 14, color: "#48484A", margin: 0, lineHeight: 1.6, maxWidth: 720 }}>
            Alles, was du brauchst, um bioLogic HR-Talents im Alltag souverän zu nutzen — Schritt für Schritt erklärt.
          </p>
        </header>

        <div style={{ position: "relative", marginBottom: 20 }}>
          <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#8E8E93" }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="In der Hilfe suchen…"
            data-testid="input-help-search"
            style={{
              width: "100%", padding: "12px 14px 12px 40px", borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
              fontSize: 14, color: "#1D1D1F", outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "240px 1fr", gap: 24, alignItems: "start" }}>
          <aside style={isMobile
            ? { background: "#fff", borderRadius: 12, padding: 6, border: "1px solid rgba(0,0,0,0.05)", display: "flex", overflowX: "auto", gap: 4 }
            : { position: "sticky", top: 80, background: "#fff", borderRadius: 14, padding: 8, border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: 2 }
          }>
            {filtered.length === 0 && (
              <div style={{ padding: "10px 12px", fontSize: 13, color: "#8E8E93" }}>Keine Treffer</div>
            )}
            {filtered.map(s => {
              const Icon = s.icon;
              const active = s.id === activeId;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  data-testid={`nav-help-${s.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: isMobile ? "8px 12px" : "9px 12px",
                    borderRadius: 10, border: "none",
                    background: active ? "rgba(0,113,227,0.08)" : "transparent",
                    color: active ? "#0071E3" : "#1D1D1F",
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    cursor: "pointer", textAlign: "left", whiteSpace: "nowrap",
                    transition: "all 150ms ease",
                  }}
                >
                  <Icon style={{ width: 15, height: 15, color: active ? "#0071E3" : "#86868B", flexShrink: 0 }} />
                  <span>{s.shortTitle ?? s.title}</span>
                </button>
              );
            })}
          </aside>

          <main ref={contentRef} style={{ minWidth: 0 }}>
            {filtered.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: 32, border: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
                <Search style={{ width: 32, height: 32, color: "#C7C7CC", margin: "0 auto 12px" }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1D1D1F", margin: "0 0 6px" }}>Nichts gefunden</h3>
                <p style={{ fontSize: 13, color: "#8E8E93", margin: 0 }}>Versuch es mit einem anderen Suchbegriff.</p>
              </div>
            ) : (
              filtered.map(section => {
                const Icon = section.icon;
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    ref={el => { sectionRefs.current[section.id] = el; }}
                    style={{ background: "#fff", borderRadius: 14, padding: isMobile ? 18 : 24, marginBottom: 16, border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", scrollMarginTop: 80 }}
                    data-testid={`section-help-${section.id}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,113,227,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon style={{ width: 18, height: 18, color: "#0071E3" }} />
                      </div>
                      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.01em" }}>{section.title}</h2>
                    </div>
                    <p style={{ fontSize: 14, color: "#48484A", margin: "0 0 14px", lineHeight: 1.6 }}>{section.intro}</p>
                    {section.blocks.map((b, i) => renderBlock(b, i))}
                  </section>
                );
              })
            )}

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              data-testid="button-scroll-top"
              style={{ display: "flex", alignItems: "center", gap: 6, margin: "16px auto 0", padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", fontSize: 12, fontWeight: 600, color: "#48484A", cursor: "pointer" }}
            >
              <ChevronUp style={{ width: 14, height: 14 }} />
              Nach oben
            </button>
          </main>
        </div>
      </div>
    </div>
  );
}
