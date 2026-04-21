// Statische, NICHT von der KI generierte Berichts-Texte.
// Werden in Stellenanalyse, Soll-Ist-Bericht, TeamCheck und PDF-Export gleichermaßen verwendet.

export const REPORT_INTRO_DISCLAIMER =
  "Dieser Bericht beschreibt typische Verhaltensmuster im Arbeitsalltag, kein festes Persönlichkeitsbild und keine Bewertung der Person. Er soll die Einschätzung unterstützen, nicht ersetzen – die Beurteilung des Einzelfalls bleibt Teil jeder Entscheidung.";

export const REPORT_INTRO_DISCLAIMER_EN =
  "This report describes typical patterns of behaviour in everyday work — not a fixed personality profile and not a judgement of the person. It is meant to support the assessment, not replace it; the individual case always remains part of the decision.";

// Statische Labels und Überschriften für den Stellenanalyse-Bericht (rollenprofil.tsx).
// Einmalig hier hinterlegt, damit zukünftige Sprach-Anpassungen nur an EINER Stelle erfolgen.
export const REPORT_LABELS = {
  de: {
    pageLang: "de",
    dateLocale: "de-DE",

    // Header
    kicker: "STELLENANALYSE",
    title: "Stellenprofil",
    printButton: "Drucken",
    printTooltip: "1:1 Qualität — im Druckdialog 'Als PDF speichern' wählen",

    // Empty-State
    noProfileTitle: "Kein Stellenprofil vorhanden",
    noProfileBody: "Bitte erstelle zuerst ein Stellenprofil, um den Bericht generieren zu können.",
    noProfileButton: "Stellenprofil erstellen",

    // Lade-Bildschirm
    loadingTitle: "Stellenanalyse wird erstellt",
    loadingBody: "Die Texte werden gerade auf Basis deines Profils generiert. Das dauert in der Regel 15–25 Sekunden.",

    // Sektion 1
    section1: "Stellenprofil · Entscheidungsgrundlage",
    section1Headline: "Welche Persönlichkeit braucht diese Stelle?",
    sub1ShortDescription: "Kurzbeschreibung der Stelle",
    coreTasksIntro: "Die zentralen Aufgaben dieser Stelle:",
    sub2StructureProfile: "Strukturprofil der Stelle",
    structureExplanation:
      "Jeder Mensch verfügt über die drei grundlegenden Denk- und Handlungsweisen Impulsiv, Intuitiv und Analytisch. Alle drei Anteile sind immer vorhanden. Der Unterschied liegt in ihrer Reihenfolge und Gewichtung.",
    structureExplanation2:
      "Diese Struktur prägt, wie Menschen im Alltag entscheiden, kommunizieren und handeln. Je nach Situation kann sich die sichtbare Wirkung verändern: im Arbeitsalltag, unter Stress oder in entspannten Situationen.",
    componentMeaning: "Bedeutung der Komponenten",
    barLabelImp: "Impulsiv",
    barLabelInt: "Intuitiv",
    barLabelAna: "Analytisch",
    sub3WorkLogic: "Arbeitslogik der Stelle",
    sub4Framework: "Rahmenbedingungen",
    successFocusLabel: "Erfolgsfokus",

    // Sektion 2
    section2: "Verhalten · Alltag und Stress",
    section2Headline: "Verhalten im Alltag und unter Druck",
    section2Sub:
      "Die folgende Darstellung zeigt, wie sich die Stellenanforderung im regulären Arbeitsalltag, unter Druck und bei starkem Stress typischerweise ausdrückt.",
    behaviourDaily: "Verhalten im Alltag",
    behaviourPressure: "Verhalten unter Druck",
    behaviourStress: "Verhalten bei starkem Stress",

    // Sektion 3
    section3: "Teamwirkung & Fehlbesetzungsrisiken",
    section3Headline: "Wirkung, Spannungsfelder und Risiken",
    section3SubLeadership:
      "Dieser Abschnitt beschreibt, welche Wirkung von der Stelle im Team ausgeht, welche typischen Spannungsfelder sich ergeben und welche Risiken bei einer Fehlbesetzung entstehen können.",
    section3SubNonLeadership:
      "Dieser Abschnitt beschreibt, welche Wirkung die Stelle im Arbeitsumfeld entfaltet, welche typischen Spannungsfelder sich ergeben und welche Risiken bei einer Fehlbesetzung entstehen können.",
    sub1LeadershipImpact: "Führungswirkung der Stelle",
    sub1TeamImpact: "Teamwirkung der Stelle",
    sub2Tensions: "Spannungsfelder der Stelle",
    tensionsIntro: "Typische Spannungen dieser Stelle sind:",
    sub3MiscastRisks: "Fehlbesetzungsrisiken",
    sub4TypicalPerson: "Typische Person für diese Stelle",
    candidateLoading: "Wird generiert...",
    candidateError: "Personenprofil konnte nicht geladen werden.",

    // Sektion 4
    section4: "Entscheidungsfazit",

    // Footer
    footerLabel: "Stellenanalyse",
    footerCreatedOn: "Erstellt am",
  },
  en: {
    pageLang: "en",
    dateLocale: "en-US",

    // Header
    kicker: "JOB ANALYSIS",
    title: "Job Profile",
    printButton: "Print",
    printTooltip: "True 1:1 quality — choose 'Save as PDF' in the print dialog",

    // Empty-State
    noProfileTitle: "No job profile found",
    noProfileBody: "Please create a job profile first so the report can be generated.",
    noProfileButton: "Create job profile",

    // Loading
    loadingTitle: "Generating job analysis",
    loadingBody: "We're writing the report based on your profile. This usually takes 15–25 seconds.",

    // Section 1
    section1: "Job Profile · Decision Basis",
    section1Headline: "What kind of personality does this role need?",
    sub1ShortDescription: "Brief description of the role",
    coreTasksIntro: "The core tasks of this role:",
    sub2StructureProfile: "Structural profile of the role",
    structureExplanation:
      "Every person carries the three fundamental modes of thinking and acting: Impulsive, Intuitive and Analytical. All three are always present. What differs is their order and weighting.",
    structureExplanation2:
      "This structure shapes how people decide, communicate and act in everyday life. The visible effect can shift with the situation: in regular work, under pressure, or in relaxed moments.",
    componentMeaning: "Meaning of the components",
    barLabelImp: "Impulsive",
    barLabelInt: "Intuitive",
    barLabelAna: "Analytical",
    sub3WorkLogic: "Work logic of the role",
    sub4Framework: "Context",
    successFocusLabel: "Success focus",

    // Section 2
    section2: "Behaviour · Daily work and stress",
    section2Headline: "Behaviour in daily work and under pressure",
    section2Sub:
      "The following shows how the role's requirements typically express themselves in regular work, under pressure, and during high stress.",
    behaviourDaily: "Behaviour in daily work",
    behaviourPressure: "Behaviour under pressure",
    behaviourStress: "Behaviour under high stress",

    // Section 3
    section3: "Team impact & miscast risks",
    section3Headline: "Impact, tensions and risks",
    section3SubLeadership:
      "This section describes the impact this role has on the team, the typical tensions that arise, and the risks that can emerge from a miscast.",
    section3SubNonLeadership:
      "This section describes the impact this role has on the work environment, the typical tensions that arise, and the risks that can emerge from a miscast.",
    sub1LeadershipImpact: "Leadership impact of the role",
    sub1TeamImpact: "Team impact of the role",
    sub2Tensions: "Tensions in the role",
    tensionsIntro: "Typical tensions in this role are:",
    sub3MiscastRisks: "Miscast risks",
    sub4TypicalPerson: "Typical person for this role",
    candidateLoading: "Generating...",
    candidateError: "The candidate profile could not be loaded.",

    // Section 4
    section4: "Decision summary",

    // Footer
    footerLabel: "Job Analysis",
    footerCreatedOn: "Created on",
  },
} as const;

export type ReportLabels = typeof REPORT_LABELS.de;
