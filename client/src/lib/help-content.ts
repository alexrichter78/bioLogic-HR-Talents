import {
  HelpCircle, LogIn, LayoutDashboard, Briefcase, GitCompareArrows,
  Users, Bot, GraduationCap, UserCog, MessageCircleQuestion, LifeBuoy,
} from "lucide-react";
import type { Region } from "./region";

export type HelpLang = "de" | "en" | "fr" | "it";

export type HelpBlock =
  | { type: "p"; text: string }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "tip"; text: string }
  | { type: "warn"; text: string }
  | { type: "list"; items: string[] };

export type HelpSection = {
  id: string;
  title: string;
  shortTitle?: string;
  icon: typeof HelpCircle;
  intro: string;
  blocks: HelpBlock[];
};

export type HelpUi = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  sidebarNoResults: string;
  emptyTitle: string;
  emptyBody: string;
  tipPrefix: string;
  warnPrefix: string;
  previewLabel: string;
  scrollTop: string;
};

export function regionToHelpLang(region: Region): HelpLang {
  switch (region) {
    case "EN": return "en";
    case "FR": return "fr";
    case "IT": return "it";
    default: return "de";
  }
}

export const HELP_UI: Record<HelpLang, HelpUi> = {
  de: {
    title: "Benutzerhandbuch",
    subtitle: "Alles, was du brauchst, um bioLogic HR-Talents im Alltag souverän zu nutzen — Schritt für Schritt erklärt.",
    searchPlaceholder: "In der Hilfe suchen…",
    sidebarNoResults: "Keine Treffer",
    emptyTitle: "Nichts gefunden",
    emptyBody: "Versuch es mit einem anderen Suchbegriff.",
    tipPrefix: "Tipp:",
    warnPrefix: "Achtung:",
    previewLabel: "Vorschau",
    scrollTop: "Nach oben",
  },
  en: {
    title: "User guide",
    subtitle: "Everything you need to use bioLogic HR-Talents confidently in your day-to-day work — explained step by step.",
    searchPlaceholder: "Search the help…",
    sidebarNoResults: "No results",
    emptyTitle: "Nothing found",
    emptyBody: "Try a different search term.",
    tipPrefix: "Tip:",
    warnPrefix: "Note:",
    previewLabel: "Preview",
    scrollTop: "Back to top",
  },
  fr: {
    title: "Guide d'utilisation",
    subtitle: "Tout ce qu'il vous faut pour utiliser bioLogic HR-Talents au quotidien, en toute confiance — expliqué étape par étape.",
    searchPlaceholder: "Rechercher dans l'aide…",
    sidebarNoResults: "Aucun résultat",
    emptyTitle: "Aucun résultat",
    emptyBody: "Essayez un autre terme de recherche.",
    tipPrefix: "Astuce :",
    warnPrefix: "Attention :",
    previewLabel: "Aperçu",
    scrollTop: "Haut de page",
  },
  it: {
    title: "Manuale utente",
    subtitle: "Tutto ciò che ti serve per usare bioLogic HR-Talents nel lavoro quotidiano con sicurezza — spiegato passo per passo.",
    searchPlaceholder: "Cerca nella guida…",
    sidebarNoResults: "Nessun risultato",
    emptyTitle: "Nessun risultato",
    emptyBody: "Prova con un altro termine di ricerca.",
    tipPrefix: "Suggerimento:",
    warnPrefix: "Attenzione:",
    previewLabel: "Anteprima",
    scrollTop: "Torna su",
  },
};

const SECTIONS_DE: HelpSection[] = [
  {
    id: "erste-schritte",
    title: "Erste Schritte",
    icon: LogIn,
    intro: "So meldest du dich an, stellst die Sprache ein und findest dich in der Software zurecht.",
    blocks: [
      { type: "p", text: "bioLogic HR-Talents ist deine Software für die strukturelle Analyse von Stellen, Personen und Teams. Du arbeitest komplett im Browser — es muss nichts installiert werden." },
      { type: "steps", items: [
        { title: "Anmelden", text: "Öffne https://www.my-biologic.de/, gib deinen Benutzernamen und dein Passwort ein und klicke auf „Anmelden”. Die Zugangsdaten hast du per E-Mail erhalten." },
        { title: "Sprache schon beim Login wählen", text: "Auf der Anmeldemaske findest du rechts ein Sprach-Auswahlfeld mit Länderflaggen (DE / AT / CH / EN / FR / IT). Wähle hier die Sprache, in der die Software nach dem Login startet." },
        { title: "Passwort ändern (empfohlen)", text: "Wir empfehlen, das Standardpasswort beim ersten Login zu ändern. Klicke dazu auf der Anmeldemaske auf „Passwort vergessen?”, trage die hinterlegte E-Mail-Adresse ein und klicke auf „Link anfordern”. Du bekommst eine E-Mail mit einem Link, über den du ein neues Passwort vergeben kannst (mindestens 4 Zeichen)." },
        { title: "Navigation kennenlernen", text: "Die Hauptnavigation oben enthält: Home, JobCheck (Stellenprofil), MatchCheck (Stelle ↔ Person), TeamCheck (Teamstruktur) und Louis (KI-Coach). Wenn dein Konto für den Kursbereich freigeschaltet ist, erscheint zusätzlich „Kurs”." },
      ]},
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
      { type: "list", items: [
        "Karte „Stellenprofil”: startet eine neue Stellenanalyse oder lädt eine zuvor gespeicherte Analyse aus einer Datei.",
        "Karte „Louis”: öffnet den KI-Coach für Fragen zu Führung, Recruiting, Teamthemen und Gesprächsvorbereitung.",
      ]},
      { type: "tip", text: "Wenn schon Daten aus einer früheren Analyse im Browser gespeichert sind, fragt dich die Software bei „Neue Analyse” zuerst „Bist du sicher? Alle eingegebenen Daten werden gelöscht.”, bevor sie zurücksetzt." },
      { type: "tip", text: "Mit „Analyse öffnen” kannst du eine zuvor exportierte Stellenprofil-Datei (.json) wieder einlesen und damit weiterarbeiten." },
    ],
  },
  {
    id: "jobcheck",
    title: "JobCheck — Stellenprofil definieren",
    shortTitle: "JobCheck",
    icon: Briefcase,
    intro: "Mit dem JobCheck definierst du ein Stellenprofil in drei Schritten. Das Stellenprofil ist die Grundlage für den MatchCheck und den TeamCheck.",
    blocks: [
      { type: "p", text: "Das Stellenprofil beschreibt, was die Stelle wirklich braucht — Aufgabenstruktur, Arbeitsweise, Erfolgsfokus, Führungsverantwortung und die konkreten Tätigkeiten. Plane für eine sorgfältige Erfassung etwa 10–15 Minuten ein." },
      { type: "steps", items: [
        { title: "1. Welche Stelle?", text: "Gib die Stellenbezeichnung ein (z.B. „Vertriebsleiter Region Süd”) und wähle das Land/Region. Optional kannst du Besonderheiten der Stelle ergänzen — was sie von einem Standardberuf unterscheidet." },
        { title: "2. Rahmenbedingungen", text: "Wähle die Aufgabenstruktur (überwiegend operativ / systemisch / strategisch / gemischt), die Arbeitsweise (umsetzungs-, daten- oder menschenorientiert), zwei Erfolgsfokus-Schwerpunkte und die Führungsverantwortung (keine / Projekt-Koordination / fachliche Führung / Personalverantwortung)." },
        { title: "3. Tätigkeiten", text: "Die Software schlägt typische Tätigkeiten für die Stelle vor. Du kannst sie übernehmen, ändern, ergänzen oder löschen. Jede Tätigkeit bekommt eine Kompetenz-Zuordnung (Impulsiv / Intuitiv / Analytisch) und ein Niveau (Niedrig / Mittel / Hoch). Daraus berechnet sich das Sollprofil." },
      ]},
      { type: "p", text: "Wenn du fertig bist, klickst du auf „Stelle analysieren” — du landest direkt im Stellenprofil-Bericht mit dem berechneten Sollprofil und einer Kurzbeschreibung der dominanten Logik der Stelle." },
      { type: "tip", text: "Du kannst ein Stellenprofil als Datei speichern und später wieder öffnen — über die Buttons „Analyse öffnen” auf der Startseite. So baust du dir nach und nach eine Sammlung deiner geprüften Stellen auf." },
      { type: "warn", text: "Beantworte die Fragen so realistisch wie möglich. Wenn du nur „nett klingende” Antworten anklickst, wird das Sollprofil ungenau — und damit auch der spätere Vergleich mit einer Person." },
    ],
  },
  {
    id: "matchcheck",
    title: "MatchCheck — Passung Stelle ↔ Person",
    shortTitle: "MatchCheck",
    icon: GitCompareArrows,
    intro: "Der MatchCheck zeigt dir, wie gut eine Person strukturell auf die Stelle passt — mit Begründung und Hinweisen zu Führungsaufwand und Risiken.",
    blocks: [
      { type: "p", text: "Voraussetzung: Du hast bereits ein Stellenprofil im JobCheck erstellt. Im MatchCheck siehst du dann das Sollprofil der Stelle und gibst daneben das Ist-Profil der Person ein." },
      { type: "steps", items: [
        { title: "Profile vergleichen", text: "Im Bereich „Passungsanalyse konfigurieren” siehst du links das Sollprofil (aus dem Stellenprofil) und rechts das Ist-Profil der Person. Verschiebe die Schieberegler beim Ist-Profil so, dass sie der Person entsprechen — die Werte werden automatisch normalisiert (max. 67 % pro Komponente)." },
        { title: "Bericht erstellen", text: "Klicke auf „Bericht erstellen”. Der MatchCheck wird auf Basis der beiden Profile generiert. Das dauert in der Regel 15–25 Sekunden." },
        { title: "Bericht lesen", text: "Du erhältst eine Gesamtbewertung (Geeignet / Bedingt geeignet / Nicht geeignet) mit ausführlicher Begründung, einer Risikoprognose, Hinweisen zum Führungs- und Entwicklungsaufwand sowie einem 30-Tage-Integrationsplan." },
      ]},
      { type: "tip", text: "Lies immer die Abschnitte „Worauf es ankommt” und „Risikoprognose” — sie sagen dir konkret, worauf du im Vorstellungsgespräch und in der Einarbeitung besonders achten solltest." },
      { type: "tip", text: "Den Bericht kannst du als PDF speichern: Klick auf „Drucken” und im Druckdialog „Als PDF speichern” wählen." },
    ],
  },
  {
    id: "teamcheck",
    title: "TeamCheck — Teamstruktur analysieren",
    shortTitle: "TeamCheck",
    icon: Users,
    intro: "Der TeamCheck zeigt dir, wie eine neue Person in ein bestehendes Team passt — und welche Wirkung sie auf die Teamdynamik hat.",
    blocks: [
      { type: "p", text: "Auch eine fachlich passende Person kann ein Team aus dem Gleichgewicht bringen, wenn die Konstellation nicht stimmt. Der TeamCheck hilft dir, das vor der Besetzung zu sehen." },
      { type: "steps", items: [
        { title: "Team-Kontext erfassen", text: "Trage die Stellenbezeichnung ein. Füge dann die bestehenden Teammitglieder hinzu — pro Person eine Rolle (Teammitglied oder Führungskraft) und ihr Profil (Impulsiv / Intuitiv / Analytisch über Schieberegler)." },
        { title: "Teamziel wählen", text: "Wähle, was das Team aktuell am meisten braucht: Umsetzung und Ergebnisse, Analyse und Struktur, Zusammenarbeit und Kommunikation — oder „Keins”, wenn es kein klares Schwerpunktziel gibt." },
        { title: "Person eintragen und Bericht erstellen", text: "Trage die Person ein, deren Wirkung aufs Team du prüfen willst (Profil per Schieberegler). Klicke auf „Bericht erstellen”." },
      ]},
      { type: "warn", text: "Eine kritische Bewertung heißt nicht automatisch „nicht besetzen”. Sie heißt: Schau dir die genannten Punkte vorher genau an und plane konkrete Gegenmaßnahmen ein — der Integrationsplan im Bericht ist genau dafür da." },
    ],
  },
  {
    id: "ki-coach",
    title: "Louis (KI-Coach)",
    shortTitle: "Louis",
    icon: Bot,
    intro: "Louis ist dein bioLogic Coach für Entscheidungen im richtigen Moment — direkt im Chat, jederzeit verfügbar, auch ohne vorhandene Analyse.",
    blocks: [
      { type: "p", text: "Louis unterstützt dich bei Fragen rund um Führung, Personalentscheidungen, Assessment, Bewerbungsgespräche und Kommunikation. Er kennt die bioLogic-Methodik und kann seine Antworten an deine konkrete Situation anpassen." },
      { type: "list", items: [
        "Recruiting und Stellenanzeigen formulieren lassen",
        "Bewerbungs-, Feedback- und Konfliktgespräche vorbereiten",
        "Teamkonstellationen analysieren und Konfliktmuster verstehen",
        "Rollenspiele und Gesprächssimulationen durchspielen",
        "Quellenbasierte Antworten zu Führungsthemen",
      ]},
      { type: "steps", items: [
        { title: "Louis öffnen", text: "Klicke in der Hauptnavigation auf „Louis (KI-Coach)” oder auf der Startseite auf den Button „Louis öffnen”." },
        { title: "Frage stellen — oder Musterprompt nutzen", text: "Schreib deine Frage einfach ins Eingabefeld unten. Über den Button „Musterprompts” findest du fertige Beispielfragen, die du als Startpunkt verwenden und anpassen kannst." },
        { title: "Stelle als Kontext anhängen (optional)", text: "Über das Plus-Symbol neben dem Eingabefeld kannst du ein bereits analysiertes Stellenprofil als Kontext mitgeben. Außerdem kannst du Bilder oder PDF-/Textdokumente hochladen — Louis bezieht sie in seine Antwort ein." },
        { title: "Mit dem Verlauf arbeiten", text: "Über das Verlauf-Symbol siehst du frühere Unterhaltungen. Du kannst sie suchen, umbenennen, anpinnen oder löschen. Mit „Neue Unterhaltung” startest du ein frisches Gespräch." },
        { title: "Antworten weiterverwenden", text: "Über die Buttons unter jeder Antwort kannst du den Text kopieren oder das ganze Gespräch als TXT-Datei exportieren." },
      ]},
      { type: "tip", text: "Beschreibe Louis immer die Situation und die beteiligten Personen — je mehr Kontext, desto präziser die Antwort. „Bereite mich auf ein Konfliktgespräch mit einer analytisch geprägten Mitarbeiterin vor, die meint, ihre Vorschläge würden ignoriert” funktioniert besser als „Hilfe bei Konflikt”." },
      { type: "tip", text: "Wenn das Thema wechselt: Starte eine neue Unterhaltung. Das hält den Fokus scharf und vermeidet, dass alte Inhalte die Antworten beeinflussen." },
    ],
  },
  {
    id: "kurs",
    title: "Kursbereich",
    shortTitle: "Kurs",
    icon: GraduationCap,
    intro: "Im Kursbereich findest du die bioLogic-Lernmodule. Sichtbar nur für Konten mit Kurs-Freischaltung.",
    blocks: [
      { type: "p", text: "Es gibt drei mögliche Ansichten — abhängig davon, ob dein Konto für den Kursbereich freigeschaltet ist und welche Rolle du hast:" },
      { type: "steps", items: [
        { title: "Kein Zugang", text: "Wenn dein Konto nicht freigeschaltet ist, siehst du eine Hinweisseite mit dem Symbol eines Schlosses und dem Text „Der Kursbereich ist für dein Konto nicht freigeschaltet. Bitte wende dich an deinen Administrator.”" },
        { title: "Mit Zugang (Standard-Nutzer)", text: "Du siehst die Übersicht der vier Module: bioLogic Kompaktkurs, bioLogic Leadership, bioLogic Recruiting und bioLogic Sales (insgesamt 4 Module mit 20 Lektionen und ca. 4 Stunden Video). Aktuell ist die Notiz „Inhalte in Vorbereitung” zu sehen — die Module werden hier automatisch erscheinen, sobald sie verfügbar sind." },
        { title: "Admin / Subadmin", text: "Wenn du Administrator oder Subadmin bist, kannst du im Kursbereich zusätzlich Teilnehmer freischalten: Vorname, Nachname und E-Mail-Adresse eintragen, beliebig viele Personen hinzufügen und mit „Zugänge freischalten” gesammelt absenden." },
      ]},
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
      { type: "steps", items: [
        { title: "Sprache umstellen", text: "Klicke oben in der Navigation auf das Sprach-Symbol (Globus). Im Aufklapp-Menü wählst du DE, AT, CH, EN, FR oder IT. Die Umstellung gilt sofort für alle Bereiche der Software." },
        { title: "Passwort ändern", text: "Melde dich ab, klicke auf der Anmeldemaske auf „Passwort vergessen?”, gib deine hinterlegte E-Mail-Adresse ein und klicke auf „Link anfordern”. Du bekommst eine E-Mail mit einem Link, über den du ein neues Passwort vergeben kannst (mindestens 4 Zeichen)." },
        { title: "Abmelden", text: "Klicke oben in der Navigation auf das Abmelde-Symbol. Aus Sicherheitsgründen empfehlen wir, dich nach jeder Sitzung abzumelden — vor allem auf Geräten, die mehrere Personen nutzen." },
      ]},
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
      { type: "steps", items: [
        { title: "Mein Zugang funktioniert nicht — was tun?", text: "Prüfe zuerst, ob du Benutzername und Passwort exakt so eingibst, wie sie dir per E-Mail mitgeteilt wurden (Groß-/Kleinschreibung beachten). Wenn das Passwort nicht mehr stimmt, nutze „Passwort vergessen?”. Bleibt der Zugang verschlossen, wende dich an deinen Administrator oder per E-Mail an support@foresmind.de." },
        { title: "Wie speichere ich einen Bericht?", text: "Jeder Bericht (Stellenprofil, MatchCheck, TeamCheck) hat oben einen „Drucken”-Button. Im Druckdialog deines Browsers wählst du dann „Als PDF speichern” und kannst die Datei beliebig weiterleiten." },
        { title: "Wie sichere ich ein Stellenprofil für später?", text: "Stellenprofile kannst du als Datei exportieren und über die Startseite mit „Analyse öffnen” wieder einlesen. So baust du dir eine eigene Sammlung deiner geprüften Stellen auf." },
        { title: "Funktioniert die Software auf Smartphone und Tablet?", text: "Ja — die Hauptbereiche sind für Smartphone und Tablet optimiert. Für lange Berichte und für die Erfassung der Tätigkeiten im Stellenprofil empfehlen wir aber einen Laptop oder Desktop." },
        { title: "Werden meine Daten weitergegeben?", text: "Nein. Deine Eingaben werden ausschließlich für deine Analysen verwendet. Details findest du im Datenschutzhinweis (Link unten auf der Anmeldeseite oder im Footer)." },
        { title: "Was bedeuten Impulsiv, Intuitiv und Analytisch?", text: "Das sind die drei Grunddimensionen der bioLogic-Methodik. Impulsiv steht für Umsetzung und Tempo, Intuitiv für Zusammenarbeit und Kommunikation, Analytisch für Struktur und Planung. Die Mischung dieser drei Werte ergibt das Sollprofil einer Stelle bzw. das Ist-Profil einer Person." },
        { title: "Wo finde ich „JobCheck”, „MatchCheck” und „TeamCheck” im Menü?", text: "JobCheck führt dich zur Stellenprofil-Definition (Stelle erfassen). MatchCheck führt dich zur Passungsanalyse Stelle ↔ Person (Soll-/Ist-Vergleich). TeamCheck führt dich zur Teamstruktur-Analyse." },
      ]},
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
      { type: "list", items: [
        "Hilfe-Bot unten rechts in der Software — kleines Sprechblasen-Symbol; oft die schnellste Antwort.",
        "E-Mail an support@foresmind.de — wir antworten in der Regel innerhalb eines Werktags.",
      ]},
      { type: "tip", text: "Beschreibe dein Anliegen so konkret wie möglich: In welchem Bereich bist du (z.B. JobCheck, MatchCheck, Louis)? Was hast du erwartet, was ist passiert? Ein Screenshot hilft uns enorm." },
      { type: "p", text: "Bei dringenden technischen Störungen wende dich bitte direkt per E-Mail an support@foresmind.de." },
    ],
  },
];

const SECTIONS_EN: HelpSection[] = [
  {
    id: "erste-schritte",
    title: "Getting started",
    icon: LogIn,
    intro: "How to sign in, set your language and find your way around the software.",
    blocks: [
      { type: "p", text: "bioLogic HR-Talents is your software for the structural analysis of roles, individuals and teams. Everything runs in the browser — there's nothing to install." },
      { type: "steps", items: [
        { title: "Sign in", text: "Open https://www.my-biologic.de/, enter your username and password and click 'Sign in'. You will have received your login details by email." },
        { title: "Choose your language right at sign-in", text: "On the sign-in screen you will see a language selector with country flags (DE / AT / CH / EN / FR / IT) on the right. Pick the language the software should start in after sign-in." },
        { title: "Change your password (recommended)", text: "We recommend changing the default password the first time you sign in. To do so, click 'Forgot password?' on the sign-in screen, enter the email address registered for your account and click 'Request link'. You will receive an email with a link to set a new password (at least 4 characters)." },
        { title: "Get to know the navigation", text: "The main navigation at the top includes: Home, JobCheck (role profile), MatchCheck (role ↔ person), TeamCheck (team structure) and Louis (AI Coach). If your account is enabled for the Courses area, 'Courses' will appear as well." },
      ]},
      { type: "tip", text: "Switch language later: once you are signed in, you'll find a language switcher (globe icon) at the top of the navigation. Use it to switch between DE, AT, CH, EN, FR and IT at any time." },
    ],
  },
  {
    id: "startseite",
    title: "Home screen",
    icon: LayoutDashboard,
    intro: "The Home screen is your starting point. From here you launch your analyses.",
    blocks: [
      { type: "p", text: "The Home screen is deliberately kept simple: it shows two large cards that let you get going straight away — everything else is reachable through the navigation at the top." },
      { type: "list", items: [
        "'Role Profile' card: starts a new role analysis or loads a previously saved analysis from a file.",
        "'Louis' card: opens the AI Coach for questions about leadership, recruiting, team topics and conversation preparation.",
      ]},
      { type: "tip", text: "If data from an earlier analysis is already stored in the browser, the software will ask 'Are you sure? All entered data will be deleted.' before resetting when you click 'New analysis'." },
      { type: "tip", text: "With 'Open analysis' you can re-open a previously exported role profile file (.json) and carry on from where you left off." },
    ],
  },
  {
    id: "jobcheck",
    title: "JobCheck — defining a role profile",
    shortTitle: "JobCheck",
    icon: Briefcase,
    intro: "JobCheck lets you define a role profile in three steps. The role profile is the foundation for both MatchCheck and TeamCheck.",
    blocks: [
      { type: "p", text: "The role profile describes what the role really requires — task structure, way of working, success focus, leadership responsibility and the actual day-to-day activities. Plan around 10–15 minutes for a careful entry." },
      { type: "steps", items: [
        { title: "1. Which role?", text: "Enter the role title (e.g. 'Sales Manager South') and pick the country/region. Optionally, add anything that makes this role distinctive — what sets it apart from a textbook job." },
        { title: "2. Framework conditions", text: "Choose the task structure (predominantly operational / systemic / strategic / mixed), the way of working (delivery-, data- or people-oriented), two success-focus priorities and the leadership responsibility (none / project coordination / functional leadership / line management)." },
        { title: "3. Activities", text: "The software suggests typical activities for the role. You can keep, change, add or remove them. Each activity is tagged with a competence (Impulsive / Intuitive / Analytical) and a level (Low / Medium / High). The target profile is calculated from these inputs." },
      ]},
      { type: "p", text: "Once you're done, click 'Analyse role' — you'll land directly on the role profile report with the calculated target profile and a short description of the role's dominant logic." },
      { type: "tip", text: "You can save a role profile as a file and reopen it later via 'Open analysis' on the Home screen. That's how you build up a personal library of the roles you've worked on." },
      { type: "warn", text: "Answer the questions as realistically as possible. If you only pick the 'nice-sounding' options, the target profile will be inaccurate — and so will the later comparison with a person." },
    ],
  },
  {
    id: "matchcheck",
    title: "MatchCheck — role ↔ person fit",
    shortTitle: "MatchCheck",
    icon: GitCompareArrows,
    intro: "MatchCheck shows you how well a person structurally fits the role — with reasoning and notes on leadership effort and risks.",
    blocks: [
      { type: "p", text: "Prerequisite: you have already created a role profile in JobCheck. In MatchCheck you then see the role's target profile and enter the person's actual profile next to it." },
      { type: "steps", items: [
        { title: "Compare profiles", text: "In the 'Configure fit analysis' area you'll see the target profile (from the role profile) on the left and the person's actual profile on the right. Move the actual-profile sliders to match the person — values are normalised automatically (max. 67% per component)." },
        { title: "Generate report", text: "Click 'Generate report'. MatchCheck is generated from both profiles. This usually takes 15–25 seconds." },
        { title: "Read the report", text: "You receive an overall verdict (Suitable / Conditionally suitable / Not suitable) with a detailed rationale, a risk forecast, notes on leadership and development effort and a 30-day integration plan." },
      ]},
      { type: "tip", text: "Always read the 'What matters most' and 'Risk forecast' sections — they tell you in concrete terms what to pay extra attention to in the interview and during onboarding." },
      { type: "tip", text: "You can save the report as PDF: click 'Print' and choose 'Save as PDF' in the print dialog." },
    ],
  },
  {
    id: "teamcheck",
    title: "TeamCheck — analysing team structure",
    shortTitle: "TeamCheck",
    icon: Users,
    intro: "TeamCheck shows you how a new person fits into an existing team — and what effect they will have on the team dynamic.",
    blocks: [
      { type: "p", text: "Even a technically qualified person can throw a team off balance if the constellation isn't right. TeamCheck helps you see this before you make the appointment." },
      { type: "steps", items: [
        { title: "Capture the team context", text: "Enter the role title. Then add the existing team members — one role per person (team member or leader) and their profile (Impulsive / Intuitive / Analytical, set via sliders)." },
        { title: "Pick a team goal", text: "Choose what the team needs most right now: delivery and results, analysis and structure, collaboration and communication — or 'None' if there's no clear focus goal." },
        { title: "Add the person and generate the report", text: "Add the person whose impact on the team you want to assess (profile via sliders). Click 'Generate report'." },
      ]},
      { type: "warn", text: "A critical verdict does not automatically mean 'don't appoint'. It means: look closely at the points raised beforehand and plan concrete countermeasures — that's exactly what the integration plan in the report is for." },
    ],
  },
  {
    id: "ki-coach",
    title: "Louis (AI Coach)",
    shortTitle: "Louis",
    icon: Bot,
    intro: "Louis is your bioLogic coach for decisions in the moment they matter — directly in the chat, available any time, even without an existing analysis.",
    blocks: [
      { type: "p", text: "Louis supports you with questions around leadership, hiring decisions, assessment, interviews and communication. He knows the bioLogic methodology and tailors his answers to your specific situation." },
      { type: "list", items: [
        "Drafting recruiting briefs and job adverts",
        "Preparing for interviews, feedback and difficult conversations",
        "Analysing team constellations and understanding conflict patterns",
        "Working through role-plays and conversation simulations",
        "Source-based answers on leadership topics",
      ]},
      { type: "steps", items: [
        { title: "Open Louis", text: "Click 'Louis (AI Coach)' in the main navigation, or click the 'Open Louis' button on the Home screen." },
        { title: "Ask a question — or use a sample prompt", text: "Just type your question in the input field at the bottom. The 'Sample prompts' button gives you ready-made example questions you can use as a starting point and adjust." },
        { title: "Attach a role as context (optional)", text: "Use the plus icon next to the input field to pass a previously analysed role profile to Louis as context. You can also upload images or PDF/text documents — Louis takes them into account in his answer." },
        { title: "Work with the history", text: "The history icon shows you previous conversations. You can search, rename, pin or delete them. 'New conversation' starts a fresh thread." },
        { title: "Reuse the answers", text: "Use the buttons under each answer to copy the text or export the whole conversation as a TXT file." },
      ]},
      { type: "tip", text: "Always describe the situation and the people involved to Louis — the more context, the more precise the answer. 'Prepare me for a difficult conversation with an analytically-minded employee who feels her suggestions are being ignored' works much better than 'help with conflict'." },
      { type: "tip", text: "When the topic changes: start a new conversation. That keeps the focus sharp and stops earlier content from biasing the answers." },
    ],
  },
  {
    id: "kurs",
    title: "Courses",
    shortTitle: "Courses",
    icon: GraduationCap,
    intro: "The Courses area is where you'll find the bioLogic learning modules. Visible only to accounts with course access enabled.",
    blocks: [
      { type: "p", text: "There are three possible views — depending on whether your account has access to Courses and what role you have:" },
      { type: "steps", items: [
        { title: "No access", text: "If your account isn't enabled, you'll see a notice page with a padlock icon and the text 'The Courses area isn't enabled for your account. Please contact your administrator.'" },
        { title: "With access (standard user)", text: "You'll see the overview of the four modules: bioLogic Compact Course, bioLogic Leadership, bioLogic Recruiting and bioLogic Sales (4 modules in total with 20 lessons and roughly 4 hours of video). The note 'Content in preparation' is currently shown — modules will appear here automatically as soon as they're available." },
        { title: "Admin / Sub-admin", text: "If you're an administrator or sub-admin, you can also enable participants from within Courses: enter first name, last name and email address, add as many people as you like and submit them in a batch with 'Enable access'." },
      ]},
    ],
  },
  {
    id: "profil",
    title: "Account & settings",
    shortTitle: "Account",
    icon: UserCog,
    intro: "How to change your password, your language, and how to sign out.",
    blocks: [
      { type: "p", text: "There is no separate profile page right now — all settings are reachable directly from the main navigation at the top, or via the sign-in screen." },
      { type: "steps", items: [
        { title: "Change language", text: "Click the language icon (globe) in the top navigation. Pick DE, AT, CH, EN, FR or IT from the drop-down menu. The change applies immediately across the whole software." },
        { title: "Change password", text: "Sign out, click 'Forgot password?' on the sign-in screen, enter the email address registered for your account and click 'Request link'. You'll receive an email with a link to set a new password (at least 4 characters)." },
        { title: "Sign out", text: "Click the sign-out icon in the top navigation. For security reasons, we recommend signing out at the end of every session — especially on shared devices." },
      ]},
      { type: "warn", text: "Never share your login details. If someone else needs to use the software too, ask your administrator to create a separate account for them." },
    ],
  },
  {
    id: "faq",
    title: "Frequently asked questions",
    shortTitle: "FAQ",
    icon: MessageCircleQuestion,
    intro: "Answers to the most common questions.",
    blocks: [
      { type: "steps", items: [
        { title: "My login isn't working — what now?", text: "First, check that you're entering your username and password exactly as they were sent to you by email (case-sensitive). If the password no longer works, use 'Forgot password?'. If you still can't get in, contact your administrator or email support@foresmind.de." },
        { title: "How do I save a report?", text: "Every report (role profile, MatchCheck, TeamCheck) has a 'Print' button at the top. In your browser's print dialog, choose 'Save as PDF' — you can then forward the file however you like." },
        { title: "How do I save a role profile for later?", text: "You can export role profiles as a file and re-open them via 'Open analysis' on the Home screen. That way you build up your own library of the roles you've worked on." },
        { title: "Does the software work on smartphone and tablet?", text: "Yes — the main areas are optimised for smartphone and tablet. For long reports and for entering activities in the role profile, however, we recommend a laptop or desktop." },
        { title: "Is my data shared anywhere?", text: "No. Your inputs are used solely for your analyses. You'll find the details in the privacy notice (link at the bottom of the sign-in screen and in the footer)." },
        { title: "What do Impulsive, Intuitive and Analytical mean?", text: "These are the three core dimensions of the bioLogic methodology. Impulsive stands for delivery and pace, Intuitive for collaboration and communication, Analytical for structure and planning. The mix of these three values gives you the target profile of a role and the actual profile of a person." },
        { title: "Where do I find 'JobCheck', 'MatchCheck' and 'TeamCheck' in the menu?", text: "JobCheck takes you to the role profile definition (capture the role). MatchCheck takes you to the fit analysis between role and person (target/actual comparison). TeamCheck takes you to the team structure analysis." },
      ]},
    ],
  },
  {
    id: "support",
    title: "Support & contact",
    shortTitle: "Support",
    icon: LifeBuoy,
    intro: "Stuck? Here's how to reach us.",
    blocks: [
      { type: "p", text: "There are two ways to get help quickly:" },
      { type: "list", items: [
        "Help bot at the bottom right of the software — small speech-bubble icon; often the fastest answer.",
        "Email support@foresmind.de — we usually reply within one business day.",
      ]},
      { type: "tip", text: "Describe your issue as concretely as possible: which area are you in (e.g. JobCheck, MatchCheck, Louis)? What did you expect, and what actually happened? A screenshot helps us enormously." },
      { type: "p", text: "For urgent technical issues please email us directly at support@foresmind.de." },
    ],
  },
];

const SECTIONS_FR: HelpSection[] = [
  {
    id: "erste-schritte",
    title: "Premiers pas",
    icon: LogIn,
    intro: "Comment vous connecter, choisir la langue et vous repérer dans le logiciel.",
    blocks: [
      { type: "p", text: "bioLogic HR-Talents est votre logiciel d'analyse structurelle des postes, des personnes et des équipes. Tout fonctionne dans le navigateur — rien à installer." },
      { type: "steps", items: [
        { title: "Se connecter", text: "Ouvrez https://www.my-biologic.de/, saisissez votre nom d'utilisateur et votre mot de passe, puis cliquez sur « Se connecter ». Vos identifiants vous ont été envoyés par e-mail." },
        { title: "Choisir la langue dès la connexion", text: "Sur l'écran de connexion, vous trouverez à droite un sélecteur de langue avec drapeaux (DE / AT / CH / EN / FR / IT). Choisissez ici la langue dans laquelle le logiciel démarrera après la connexion." },
        { title: "Changer le mot de passe (recommandé)", text: "Nous vous conseillons de modifier le mot de passe par défaut dès la première connexion. Cliquez pour cela sur « Mot de passe oublié ? » sur l'écran de connexion, indiquez l'adresse e-mail enregistrée pour votre compte et cliquez sur « Demander le lien ». Vous recevrez un e-mail contenant un lien pour définir un nouveau mot de passe (au moins 4 caractères)." },
        { title: "Découvrir la navigation", text: "La barre de navigation principale en haut comprend : Accueil, JobCheck (profil du poste), MatchCheck (poste ↔ personne), TeamCheck (structure de l'équipe) et Louis (Coach IA). Si votre compte a accès à la formation, « Formation » apparaît également." },
      ]},
      { type: "tip", text: "Changer de langue plus tard : une fois connecté, vous trouverez en haut de la navigation un sélecteur de langue (icône globe). Vous pouvez basculer à tout moment entre DE, AT, CH, EN, FR et IT." },
    ],
  },
  {
    id: "startseite",
    title: "Page d'accueil",
    icon: LayoutDashboard,
    intro: "La page d'accueil est votre point d'entrée. C'est d'ici que vous lancez vos analyses.",
    blocks: [
      { type: "p", text: "La page d'accueil reste volontairement épurée : elle affiche deux grandes cartes pour démarrer immédiatement — tout le reste est accessible par la navigation en haut." },
      { type: "list", items: [
        "Carte « Profil du poste » : démarre une nouvelle analyse de poste ou ouvre une analyse précédemment enregistrée à partir d'un fichier.",
        "Carte « Louis » : ouvre le Coach IA pour vos questions de leadership, de recrutement, de dynamique d'équipe et de préparation d'entretien.",
      ]},
      { type: "tip", text: "Si des données d'une analyse précédente sont déjà enregistrées dans le navigateur, le logiciel vous demande « Êtes-vous sûr ? Toutes les données saisies seront supprimées. » avant de réinitialiser, lorsque vous cliquez sur « Nouvelle analyse »." },
      { type: "tip", text: "Avec « Ouvrir une analyse », vous pouvez recharger un fichier de profil de poste précédemment exporté (.json) et reprendre votre travail." },
    ],
  },
  {
    id: "jobcheck",
    title: "JobCheck — définir un profil de poste",
    shortTitle: "JobCheck",
    icon: Briefcase,
    intro: "JobCheck vous permet de définir un profil de poste en trois étapes. Ce profil est la base du MatchCheck et du TeamCheck.",
    blocks: [
      { type: "p", text: "Le profil de poste décrit ce que le poste exige réellement — structure des tâches, façon de travailler, focus de réussite, responsabilité hiérarchique et activités concrètes au quotidien. Comptez environ 10 à 15 minutes pour une saisie soignée." },
      { type: "steps", items: [
        { title: "1. Quel poste ?", text: "Saisissez l'intitulé du poste (par ex. « Directeur des ventes Région Sud ») et choisissez le pays/la région. Vous pouvez ajouter en option ce qui rend ce poste particulier — ce qui le distingue d'un métier standard." },
        { title: "2. Conditions cadres", text: "Choisissez la structure des tâches (à dominante opérationnelle / systémique / stratégique / mixte), la façon de travailler (orientée exécution, données ou personnes), deux priorités de focus de réussite et la responsabilité hiérarchique (aucune / coordination de projet / encadrement fonctionnel / management direct)." },
        { title: "3. Activités", text: "Le logiciel propose des activités typiques pour ce poste. Vous pouvez les conserver, les modifier, en ajouter ou les supprimer. Chaque activité reçoit une compétence (Impulsif / Intuitif / Analytique) et un niveau (Faible / Moyen / Élevé). Le profil cible est calculé à partir de ces données." },
      ]},
      { type: "p", text: "Une fois terminé, cliquez sur « Analyser le poste » — vous arrivez directement sur le rapport de profil de poste, avec le profil cible calculé et une courte description de la logique dominante du poste." },
      { type: "tip", text: "Vous pouvez enregistrer un profil de poste sous forme de fichier et le rouvrir plus tard via « Ouvrir une analyse » sur la page d'accueil. C'est ainsi que vous constituez peu à peu votre propre bibliothèque de postes analysés." },
      { type: "warn", text: "Répondez aux questions le plus honnêtement possible. Si vous ne cochez que les réponses « bien-pensantes », le profil cible sera imprécis — et la comparaison ultérieure avec une personne le sera aussi." },
    ],
  },
  {
    id: "matchcheck",
    title: "MatchCheck — adéquation poste ↔ personne",
    shortTitle: "MatchCheck",
    icon: GitCompareArrows,
    intro: "Le MatchCheck vous montre dans quelle mesure une personne correspond structurellement au poste — avec justification et indications sur l'effort de pilotage et les risques.",
    blocks: [
      { type: "p", text: "Pré-requis : vous avez déjà créé un profil de poste dans JobCheck. Dans MatchCheck, vous voyez le profil cible du poste et vous saisissez à côté le profil réel de la personne." },
      { type: "steps", items: [
        { title: "Comparer les profils", text: "Dans la zone « Configurer l'analyse d'adéquation », vous voyez à gauche le profil cible (issu du profil de poste) et à droite le profil réel de la personne. Déplacez les curseurs du profil réel pour qu'ils correspondent à la personne — les valeurs sont automatiquement normalisées (max. 67 % par composante)." },
        { title: "Générer le rapport", text: "Cliquez sur « Générer le rapport ». Le MatchCheck est produit à partir des deux profils. Cela prend généralement 15 à 25 secondes." },
        { title: "Lire le rapport", text: "Vous obtenez un verdict global (Adapté / Adapté sous conditions / Non adapté) avec une argumentation détaillée, une prévision des risques, des indications sur l'effort de pilotage et de développement, ainsi qu'un plan d'intégration sur 30 jours." },
      ]},
      { type: "tip", text: "Lisez toujours les sections « Ce qui compte vraiment » et « Prévision des risques » — elles vous indiquent concrètement à quoi prêter une attention particulière en entretien et pendant l'intégration." },
      { type: "tip", text: "Vous pouvez enregistrer le rapport en PDF : cliquez sur « Imprimer » et choisissez « Enregistrer en PDF » dans la boîte de dialogue." },
    ],
  },
  {
    id: "teamcheck",
    title: "TeamCheck — analyser la structure d'équipe",
    shortTitle: "TeamCheck",
    icon: Users,
    intro: "Le TeamCheck vous montre comment une nouvelle personne s'intègre à une équipe existante — et quel impact elle aura sur la dynamique de l'équipe.",
    blocks: [
      { type: "p", text: "Même une personne techniquement adaptée peut déséquilibrer une équipe si la constellation n'est pas la bonne. Le TeamCheck vous aide à le voir avant de recruter." },
      { type: "steps", items: [
        { title: "Saisir le contexte de l'équipe", text: "Saisissez l'intitulé du poste. Ajoutez ensuite les membres actuels de l'équipe — pour chaque personne, un rôle (membre d'équipe ou manager) et son profil (Impulsif / Intuitif / Analytique, via curseurs)." },
        { title: "Choisir l'objectif d'équipe", text: "Choisissez ce dont l'équipe a le plus besoin actuellement : exécution et résultats, analyse et structure, collaboration et communication — ou « Aucun » s'il n'y a pas d'objectif prioritaire clair." },
        { title: "Saisir la personne et générer le rapport", text: "Saisissez la personne dont vous voulez évaluer l'impact sur l'équipe (profil via curseurs). Cliquez sur « Générer le rapport »." },
      ]},
      { type: "warn", text: "Un verdict critique ne signifie pas automatiquement « ne pas recruter ». Il signifie : examinez de près les points soulevés en amont et planifiez des contre-mesures concrètes — c'est précisément à cela que sert le plan d'intégration du rapport." },
    ],
  },
  {
    id: "ki-coach",
    title: "Louis (Coach IA)",
    shortTitle: "Louis",
    icon: Bot,
    intro: "Louis est votre coach bioLogic pour les décisions au bon moment — directement dans le chat, disponible à tout moment, même sans analyse préalable.",
    blocks: [
      { type: "p", text: "Louis vous accompagne sur les questions de leadership, de décisions RH, d'évaluation, d'entretiens et de communication. Il connaît la méthodologie bioLogic et adapte ses réponses à votre situation concrète." },
      { type: "list", items: [
        "Rédaction de briefs de recrutement et d'annonces",
        "Préparation d'entretiens d'embauche, de feedback et de conversations difficiles",
        "Analyse des constellations d'équipe et compréhension des schémas de conflit",
        "Jeux de rôle et simulations d'entretien",
        "Réponses sourcées sur les sujets de leadership",
      ]},
      { type: "steps", items: [
        { title: "Ouvrir Louis", text: "Cliquez sur « Louis (Coach IA) » dans la navigation principale, ou sur le bouton « Ouvrir Louis » sur la page d'accueil." },
        { title: "Poser une question — ou utiliser un modèle de prompt", text: "Tapez simplement votre question dans le champ de saisie en bas. Le bouton « Modèles de prompts » vous propose des exemples prêts à l'emploi, à utiliser comme point de départ et à adapter." },
        { title: "Joindre un poste comme contexte (facultatif)", text: "Avec l'icône plus à côté du champ de saisie, vous pouvez transmettre à Louis un profil de poste déjà analysé en tant que contexte. Vous pouvez également déposer des images ou des documents PDF/texte — Louis les prend en compte dans sa réponse." },
        { title: "Travailler avec l'historique", text: "L'icône d'historique affiche vos conversations précédentes. Vous pouvez les rechercher, les renommer, les épingler ou les supprimer. « Nouvelle conversation » lance un échange vierge." },
        { title: "Réutiliser les réponses", text: "Les boutons sous chaque réponse permettent de copier le texte ou d'exporter toute la conversation au format TXT." },
      ]},
      { type: "tip", text: "Décrivez toujours à Louis la situation et les personnes concernées — plus le contexte est riche, plus la réponse est précise. « Prépare-moi à un entretien tendu avec une collaboratrice au profil analytique qui estime que ses propositions sont ignorées » fonctionne nettement mieux que « aide-moi sur un conflit »." },
      { type: "tip", text: "Quand le sujet change : démarrez une nouvelle conversation. Cela garde le focus net et empêche les anciens contenus de biaiser les réponses." },
    ],
  },
  {
    id: "kurs",
    title: "Formation",
    shortTitle: "Formation",
    icon: GraduationCap,
    intro: "La rubrique Formation regroupe les modules d'apprentissage bioLogic. Visible uniquement pour les comptes ayant accès à la formation.",
    blocks: [
      { type: "p", text: "Trois affichages possibles selon que votre compte a accès à la Formation et selon votre rôle :" },
      { type: "steps", items: [
        { title: "Pas d'accès", text: "Si votre compte n'est pas activé, une page d'information apparaît avec un cadenas et le texte « La rubrique Formation n'est pas activée pour votre compte. Contactez votre administrateur. »" },
        { title: "Avec accès (utilisateur standard)", text: "Vous voyez l'aperçu des quatre modules : bioLogic Cours compact, bioLogic Leadership, bioLogic Recruiting et bioLogic Sales (au total 4 modules, 20 leçons et environ 4 heures de vidéo). La mention « Contenu en préparation » est affichée pour le moment — les modules apparaîtront ici automatiquement dès qu'ils seront disponibles." },
        { title: "Administrateur / Sous-administrateur", text: "Si vous êtes administrateur ou sous-administrateur, vous pouvez en plus activer des participants depuis la rubrique Formation : saisir prénom, nom et adresse e-mail, ajouter autant de personnes que nécessaire et envoyer le tout en lot avec « Activer les accès »." },
      ]},
    ],
  },
  {
    id: "profil",
    title: "Compte & paramètres",
    shortTitle: "Compte",
    icon: UserCog,
    intro: "Comment changer votre mot de passe, votre langue et vous déconnecter.",
    blocks: [
      { type: "p", text: "Il n'existe pas de page de profil distincte pour le moment — tous les paramètres sont accessibles directement depuis la navigation principale en haut, ou via l'écran de connexion." },
      { type: "steps", items: [
        { title: "Changer la langue", text: "Cliquez sur l'icône de langue (globe) en haut de la navigation. Dans le menu déroulant, choisissez DE, AT, CH, EN, FR ou IT. Le changement s'applique immédiatement à l'ensemble du logiciel." },
        { title: "Changer le mot de passe", text: "Déconnectez-vous, cliquez sur « Mot de passe oublié ? » sur l'écran de connexion, indiquez l'adresse e-mail enregistrée et cliquez sur « Demander le lien ». Vous recevrez un e-mail contenant un lien pour définir un nouveau mot de passe (au moins 4 caractères)." },
        { title: "Se déconnecter", text: "Cliquez sur l'icône de déconnexion en haut de la navigation. Pour des raisons de sécurité, nous recommandons de vous déconnecter à la fin de chaque session — surtout sur des appareils partagés." },
      ]},
      { type: "warn", text: "Ne partagez jamais vos identifiants. Si une autre personne doit utiliser le logiciel, demandez à votre administrateur de lui créer un compte distinct." },
    ],
  },
  {
    id: "faq",
    title: "Questions fréquentes",
    shortTitle: "FAQ",
    icon: MessageCircleQuestion,
    intro: "Réponses aux questions les plus courantes.",
    blocks: [
      { type: "steps", items: [
        { title: "Mon accès ne fonctionne pas — que faire ?", text: "Vérifiez d'abord que vous saisissez le nom d'utilisateur et le mot de passe exactement comme ils vous ont été communiqués par e-mail (les majuscules comptent). Si le mot de passe ne fonctionne plus, utilisez « Mot de passe oublié ? ». Si l'accès reste bloqué, contactez votre administrateur ou écrivez à support@foresmind.de." },
        { title: "Comment enregistrer un rapport ?", text: "Chaque rapport (profil de poste, MatchCheck, TeamCheck) dispose en haut d'un bouton « Imprimer ». Dans la boîte de dialogue d'impression de votre navigateur, choisissez « Enregistrer en PDF » — vous pouvez ensuite transmettre le fichier librement." },
        { title: "Comment sauvegarder un profil de poste pour plus tard ?", text: "Vous pouvez exporter les profils de poste sous forme de fichier et les recharger via « Ouvrir une analyse » sur la page d'accueil. Vous constituez ainsi votre propre bibliothèque de postes analysés." },
        { title: "Le logiciel fonctionne-t-il sur smartphone et tablette ?", text: "Oui — les zones principales sont optimisées pour smartphone et tablette. Pour les rapports longs et la saisie des activités du profil de poste, nous recommandons toutefois un ordinateur portable ou de bureau." },
        { title: "Mes données sont-elles partagées ?", text: "Non. Vos saisies servent exclusivement à vos analyses. Les détails figurent dans la politique de confidentialité (lien en bas de l'écran de connexion et dans le pied de page)." },
        { title: "Que signifient Impulsif, Intuitif et Analytique ?", text: "Ce sont les trois dimensions fondamentales de la méthodologie bioLogic. Impulsif renvoie à l'exécution et au rythme, Intuitif à la collaboration et à la communication, Analytique à la structure et à la planification. La combinaison de ces trois valeurs forme le profil cible d'un poste ou le profil réel d'une personne." },
        { title: "Où trouver « JobCheck », « MatchCheck » et « TeamCheck » dans le menu ?", text: "JobCheck vous mène à la définition du profil de poste (saisir le poste). MatchCheck vous mène à l'analyse d'adéquation poste ↔ personne (comparaison cible/réel). TeamCheck vous mène à l'analyse de la structure d'équipe." },
      ]},
    ],
  },
  {
    id: "support",
    title: "Support & contact",
    shortTitle: "Support",
    icon: LifeBuoy,
    intro: "Vous bloquez ? Voici comment nous joindre.",
    blocks: [
      { type: "p", text: "Deux moyens d'obtenir rapidement de l'aide :" },
      { type: "list", items: [
        "Bot d'assistance en bas à droite du logiciel — petite icône en forme de bulle de dialogue ; souvent la réponse la plus rapide.",
        "E-mail à support@foresmind.de — nous répondons en général sous un jour ouvré.",
      ]},
      { type: "tip", text: "Décrivez votre demande de la façon la plus précise possible : dans quelle rubrique êtes-vous (par ex. JobCheck, MatchCheck, Louis) ? Qu'attendiez-vous, que s'est-il passé ? Une capture d'écran nous aide énormément." },
      { type: "p", text: "Pour les incidents techniques urgents, écrivez-nous directement à support@foresmind.de." },
    ],
  },
];

const SECTIONS_IT: HelpSection[] = [
  {
    id: "erste-schritte",
    title: "Primi passi",
    icon: LogIn,
    intro: "Come accedere, impostare la lingua e orientarti nel software.",
    blocks: [
      { type: "p", text: "bioLogic HR-Talents è il tuo software per l'analisi strutturale di ruoli, persone e team. Tutto funziona nel browser — non c'è nulla da installare." },
      { type: "steps", items: [
        { title: "Accedere", text: "Apri https://www.my-biologic.de/, inserisci nome utente e password e clicca su «Accedi». Le credenziali ti sono state inviate via e-mail." },
        { title: "Scegliere la lingua già al login", text: "Nella schermata di accesso, a destra trovi un selettore di lingua con le bandiere (DE / AT / CH / EN / FR / IT). Scegli qui la lingua con cui il software si aprirà dopo l'accesso." },
        { title: "Cambiare la password (consigliato)", text: "Ti consigliamo di cambiare la password predefinita al primo accesso. Clicca su «Password dimenticata?» nella schermata di accesso, indica l'indirizzo e-mail registrato per il tuo account e clicca su «Richiedi link». Riceverai un'e-mail con un link per impostare una nuova password (almeno 4 caratteri)." },
        { title: "Conoscere la navigazione", text: "La navigazione principale in alto comprende: Home, JobCheck (profilo del ruolo), MatchCheck (ruolo ↔ persona), TeamCheck (struttura del team) e Louis (Coach AI). Se il tuo account ha accesso alla Formazione, compare anche la voce «Formazione»." },
      ]},
      { type: "tip", text: "Cambiare lingua dopo: una volta dentro, in alto nella navigazione trovi un selettore di lingua (icona globo). Lo usi quando vuoi per passare tra DE, AT, CH, EN, FR e IT." },
    ],
  },
  {
    id: "startseite",
    title: "Home",
    icon: LayoutDashboard,
    intro: "La Home è il tuo punto d'ingresso. Da qui avvii le tue analisi.",
    blocks: [
      { type: "p", text: "La Home è volutamente essenziale: mostra due grandi riquadri con cui puoi partire subito — tutto il resto si raggiunge dalla navigazione in alto." },
      { type: "list", items: [
        "Riquadro «Profilo del ruolo»: avvia una nuova analisi del ruolo o apre un'analisi precedentemente salvata da file.",
        "Riquadro «Louis»: apre il Coach AI per domande su leadership, recruiting, dinamiche di team e preparazione di colloqui.",
      ]},
      { type: "tip", text: "Se nel browser sono già salvati dati di un'analisi precedente, cliccando su «Nuova analisi» il software ti chiede prima «Sei sicuro? Tutti i dati inseriti verranno eliminati.» prima di azzerare." },
      { type: "tip", text: "Con «Apri analisi» puoi ricaricare un file di profilo di ruolo precedentemente esportato (.json) e proseguire da dove eri arrivato." },
    ],
  },
  {
    id: "jobcheck",
    title: "JobCheck — definire un profilo di ruolo",
    shortTitle: "JobCheck",
    icon: Briefcase,
    intro: "Con JobCheck definisci un profilo di ruolo in tre passaggi. Il profilo del ruolo è la base per MatchCheck e TeamCheck.",
    blocks: [
      { type: "p", text: "Il profilo del ruolo descrive ciò che il ruolo richiede davvero — struttura dei compiti, modalità di lavoro, focus di successo, responsabilità di leadership e attività concrete. Per una compilazione accurata calcola circa 10–15 minuti." },
      { type: "steps", items: [
        { title: "1. Quale ruolo?", text: "Inserisci la denominazione del ruolo (per es. «Direttore vendite Sud») e seleziona Paese/regione. Facoltativamente puoi aggiungere ciò che rende particolare questo ruolo — ciò che lo distingue da un mestiere standard." },
        { title: "2. Condizioni quadro", text: "Scegli la struttura dei compiti (prevalentemente operativa / sistemica / strategica / mista), la modalità di lavoro (orientata all'esecuzione, ai dati o alle persone), due priorità di focus di successo e la responsabilità di leadership (nessuna / coordinamento di progetto / leadership funzionale / responsabilità del personale)." },
        { title: "3. Attività", text: "Il software propone attività tipiche per il ruolo. Puoi confermarle, modificarle, aggiungerne o eliminarle. Ogni attività riceve una competenza (Impulsivo / Intuitivo / Analitico) e un livello (Basso / Medio / Alto). Da questi dati viene calcolato il profilo target." },
      ]},
      { type: "p", text: "Quando hai finito, clicca su «Analizza ruolo» — arrivi direttamente al rapporto del profilo del ruolo, con il profilo target calcolato e una breve descrizione della logica dominante del ruolo." },
      { type: "tip", text: "Puoi salvare un profilo del ruolo come file e riaprirlo in seguito tramite «Apri analisi» nella Home. Così costruisci progressivamente la tua biblioteca di ruoli analizzati." },
      { type: "warn", text: "Rispondi alle domande nel modo più realistico possibile. Se selezioni solo le risposte «che suonano bene», il profilo target risulterà impreciso — e così anche il successivo confronto con una persona." },
    ],
  },
  {
    id: "matchcheck",
    title: "MatchCheck — corrispondenza ruolo ↔ persona",
    shortTitle: "MatchCheck",
    icon: GitCompareArrows,
    intro: "Il MatchCheck ti mostra quanto una persona corrisponde strutturalmente al ruolo — con motivazione e indicazioni su impegno di leadership e rischi.",
    blocks: [
      { type: "p", text: "Premessa: hai già creato un profilo del ruolo in JobCheck. In MatchCheck vedi il profilo target del ruolo e accanto inserisci il profilo reale della persona." },
      { type: "steps", items: [
        { title: "Confronta i profili", text: "Nella sezione «Configura analisi di corrispondenza» vedi a sinistra il profilo target (dal profilo del ruolo) e a destra il profilo reale della persona. Sposta i cursori del profilo reale per rispecchiare la persona — i valori vengono normalizzati automaticamente (max. 67% per componente)." },
        { title: "Generare il rapporto", text: "Clicca su «Genera rapporto». Il MatchCheck viene prodotto a partire dai due profili. Di solito richiede 15–25 secondi." },
        { title: "Leggere il rapporto", text: "Ottieni una valutazione complessiva (Adatto / Adatto con riserva / Non adatto) con motivazione dettagliata, una previsione di rischio, indicazioni sull'impegno di leadership e di sviluppo, oltre a un piano di integrazione di 30 giorni." },
      ]},
      { type: "tip", text: "Leggi sempre le sezioni «Ciò che conta davvero» e «Previsione di rischio» — ti dicono in modo concreto a che cosa prestare particolare attenzione nel colloquio e nell'inserimento." },
      { type: "tip", text: "Puoi salvare il rapporto come PDF: clicca su «Stampa» e scegli «Salva come PDF» nella finestra di stampa." },
    ],
  },
  {
    id: "teamcheck",
    title: "TeamCheck — analizzare la struttura del team",
    shortTitle: "TeamCheck",
    icon: Users,
    intro: "Il TeamCheck ti mostra come una nuova persona si inserisce in un team esistente — e quale effetto avrà sulla dinamica del team.",
    blocks: [
      { type: "p", text: "Anche una persona tecnicamente adatta può sbilanciare un team se la costellazione non è quella giusta. Il TeamCheck ti aiuta a vederlo prima dell'inserimento." },
      { type: "steps", items: [
        { title: "Inserire il contesto del team", text: "Inserisci la denominazione del ruolo. Aggiungi poi i membri attuali del team — per ogni persona un ruolo (membro del team o leader) e il suo profilo (Impulsivo / Intuitivo / Analitico, tramite cursori)." },
        { title: "Scegliere l'obiettivo del team", text: "Scegli ciò di cui il team ha più bisogno in questo momento: esecuzione e risultati, analisi e struttura, collaborazione e comunicazione — oppure «Nessuno» se non c'è un obiettivo prioritario chiaro." },
        { title: "Inserire la persona e generare il rapporto", text: "Inserisci la persona di cui vuoi valutare l'impatto sul team (profilo tramite cursori). Clicca su «Genera rapporto»." },
      ]},
      { type: "warn", text: "Una valutazione critica non significa automaticamente «non inserire». Significa: guarda con attenzione i punti segnalati prima e pianifica contromisure concrete — il piano di integrazione del rapporto serve esattamente a questo." },
    ],
  },
  {
    id: "ki-coach",
    title: "Louis (Coach AI)",
    shortTitle: "Louis",
    icon: Bot,
    intro: "Louis è il tuo coach bioLogic per le decisioni nel momento giusto — direttamente in chat, sempre disponibile, anche senza un'analisi già fatta.",
    blocks: [
      { type: "p", text: "Louis ti supporta su domande di leadership, decisioni HR, valutazione, colloqui e comunicazione. Conosce la metodologia bioLogic e sa adattare le risposte alla tua situazione concreta." },
      { type: "list", items: [
        "Stesura di brief di recruiting e di annunci di lavoro",
        "Preparazione di colloqui di selezione, feedback e conversazioni difficili",
        "Analisi di costellazioni di team e comprensione di schemi di conflitto",
        "Role play e simulazioni di colloquio",
        "Risposte basate su fonti su temi di leadership",
      ]},
      { type: "steps", items: [
        { title: "Aprire Louis", text: "Clicca su «Louis (Coach AI)» nella navigazione principale, oppure sul pulsante «Apri Louis» nella Home." },
        { title: "Fare una domanda — o usare un prompt di esempio", text: "Scrivi semplicemente la tua domanda nel campo di inserimento in basso. Con il pulsante «Prompt di esempio» trovi domande pronte da usare come punto di partenza e da adattare." },
        { title: "Allegare un ruolo come contesto (facoltativo)", text: "Con l'icona più accanto al campo di inserimento puoi passare a Louis un profilo del ruolo già analizzato come contesto. Puoi inoltre caricare immagini o documenti PDF/testo — Louis ne tiene conto nella risposta." },
        { title: "Lavorare con la cronologia", text: "Con l'icona della cronologia vedi le conversazioni precedenti. Puoi cercarle, rinominarle, fissarle o eliminarle. Con «Nuova conversazione» avvii uno scambio nuovo." },
        { title: "Riutilizzare le risposte", text: "Con i pulsanti sotto ogni risposta puoi copiare il testo o esportare l'intera conversazione in formato TXT." },
      ]},
      { type: "tip", text: "Descrivi sempre a Louis la situazione e le persone coinvolte — più contesto fornisci, più precisa è la risposta. «Preparami a un colloquio difficile con una collaboratrice dal profilo analitico che ritiene che le sue proposte vengano ignorate» funziona molto meglio di «aiutami con un conflitto»." },
      { type: "tip", text: "Quando cambia l'argomento: avvia una nuova conversazione. In questo modo mantieni il focus chiaro ed eviti che i contenuti precedenti influenzino le risposte." },
    ],
  },
  {
    id: "kurs",
    title: "Formazione",
    shortTitle: "Formazione",
    icon: GraduationCap,
    intro: "Nella sezione Formazione trovi i moduli di apprendimento bioLogic. Visibile solo per gli account con accesso alla formazione.",
    blocks: [
      { type: "p", text: "Esistono tre possibili visualizzazioni — a seconda che il tuo account abbia accesso alla Formazione e del tuo ruolo:" },
      { type: "steps", items: [
        { title: "Nessun accesso", text: "Se il tuo account non è abilitato, vedi una pagina informativa con un'icona a forma di lucchetto e il testo «La sezione Formazione non è abilitata per il tuo account. Rivolgiti al tuo amministratore.»" },
        { title: "Con accesso (utente standard)", text: "Vedi la panoramica dei quattro moduli: bioLogic Corso compatto, bioLogic Leadership, bioLogic Recruiting e bioLogic Sales (in tutto 4 moduli con 20 lezioni e circa 4 ore di video). Al momento è visibile la nota «Contenuti in preparazione» — i moduli compariranno qui automaticamente non appena saranno disponibili." },
        { title: "Amministratore / Sotto-amministratore", text: "Se sei amministratore o sotto-amministratore, dalla sezione Formazione puoi anche abilitare partecipanti: inserisci nome, cognome e indirizzo e-mail, aggiungi quante persone vuoi e invia tutto in blocco con «Abilita accessi»." },
      ]},
    ],
  },
  {
    id: "profil",
    title: "Account & impostazioni",
    shortTitle: "Account",
    icon: UserCog,
    intro: "Come cambiare la password, la lingua e come uscire.",
    blocks: [
      { type: "p", text: "Al momento non c'è una pagina di profilo dedicata — tutte le impostazioni si raggiungono direttamente dalla navigazione principale in alto o dalla schermata di accesso." },
      { type: "steps", items: [
        { title: "Cambiare la lingua", text: "Clicca sull'icona della lingua (globo) in alto nella navigazione. Nel menu a tendina scegli DE, AT, CH, EN, FR o IT. Il cambio si applica subito a tutto il software." },
        { title: "Cambiare la password", text: "Esci, clicca su «Password dimenticata?» nella schermata di accesso, indica l'indirizzo e-mail registrato e clicca su «Richiedi link». Riceverai un'e-mail con un link per impostare una nuova password (almeno 4 caratteri)." },
        { title: "Uscire", text: "Clicca sull'icona di uscita in alto nella navigazione. Per motivi di sicurezza ti consigliamo di uscire al termine di ogni sessione — soprattutto su dispositivi condivisi." },
      ]},
      { type: "warn", text: "Non condividere mai le tue credenziali. Se anche un'altra persona deve usare il software, chiedi al tuo amministratore di creare un account separato per lei." },
    ],
  },
  {
    id: "faq",
    title: "Domande frequenti",
    shortTitle: "FAQ",
    icon: MessageCircleQuestion,
    intro: "Risposte alle domande più comuni.",
    blocks: [
      { type: "steps", items: [
        { title: "Il mio accesso non funziona — che faccio?", text: "Verifica innanzitutto di inserire nome utente e password esattamente come ti sono stati comunicati via e-mail (attenzione alle maiuscole/minuscole). Se la password non è più valida, usa «Password dimenticata?». Se l'accesso resta bloccato, rivolgiti al tuo amministratore o scrivi a support@foresmind.de." },
        { title: "Come salvo un rapporto?", text: "Ogni rapporto (profilo del ruolo, MatchCheck, TeamCheck) ha in alto un pulsante «Stampa». Nella finestra di stampa del browser scegli «Salva come PDF» — poi puoi inoltrare il file come preferisci." },
        { title: "Come conservo un profilo del ruolo per dopo?", text: "I profili del ruolo si possono esportare come file e ricaricare tramite «Apri analisi» nella Home. Così costruisci la tua biblioteca personale di ruoli analizzati." },
        { title: "Il software funziona su smartphone e tablet?", text: "Sì — le aree principali sono ottimizzate per smartphone e tablet. Per i rapporti lunghi e per inserire le attività nel profilo del ruolo consigliamo però un laptop o un desktop." },
        { title: "I miei dati vengono condivisi?", text: "No. I tuoi inserimenti sono usati esclusivamente per le tue analisi. I dettagli sono nell'informativa sulla privacy (link in fondo alla schermata di accesso e nel piè di pagina)." },
        { title: "Cosa significano Impulsivo, Intuitivo e Analitico?", text: "Sono le tre dimensioni di base della metodologia bioLogic. Impulsivo richiama l'esecuzione e la rapidità, Intuitivo la collaborazione e la comunicazione, Analitico la struttura e la pianificazione. La combinazione di questi tre valori dà il profilo target di un ruolo o il profilo reale di una persona." },
        { title: "Dove trovo «JobCheck», «MatchCheck» e «TeamCheck» nel menu?", text: "JobCheck ti porta alla definizione del profilo del ruolo (inserire il ruolo). MatchCheck ti porta all'analisi di corrispondenza ruolo ↔ persona (confronto target/reale). TeamCheck ti porta all'analisi della struttura del team." },
      ]},
    ],
  },
  {
    id: "support",
    title: "Supporto & contatti",
    shortTitle: "Supporto",
    icon: LifeBuoy,
    intro: "Sei bloccato? Ecco come raggiungerci.",
    blocks: [
      { type: "p", text: "Hai due strade per ottenere aiuto in fretta:" },
      { type: "list", items: [
        "Bot di assistenza in basso a destra nel software — piccola icona a fumetto; spesso la risposta più rapida.",
        "E-mail a support@foresmind.de — di solito rispondiamo entro un giorno lavorativo.",
      ]},
      { type: "tip", text: "Descrivi la tua richiesta nel modo più concreto possibile: in quale sezione ti trovi (per es. JobCheck, MatchCheck, Louis)? Cosa ti aspettavi e cosa è successo? Una schermata ci aiuta moltissimo." },
      { type: "p", text: "Per problemi tecnici urgenti scrivici direttamente a support@foresmind.de." },
    ],
  },
];

export const HELP_SECTIONS: Record<HelpLang, HelpSection[]> = {
  de: SECTIONS_DE,
  en: SECTIONS_EN,
  fr: SECTIONS_FR,
  it: SECTIONS_IT,
};
