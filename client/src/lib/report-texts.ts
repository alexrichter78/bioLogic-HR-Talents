// Statische, NICHT von der KI generierte Berichts-Texte.
// Werden in Stellenanalyse, Soll-Ist-Bericht, TeamCheck und PDF-Export gleichermaßen verwendet.

export const REPORT_INTRO_DISCLAIMER =
  "Dieser Bericht beschreibt typische Verhaltensmuster im Arbeitsalltag, kein festes Persönlichkeitsbild und keine Bewertung der Person. Er soll die Einschätzung unterstützen, nicht ersetzen – die Beurteilung des Einzelfalls bleibt Teil jeder Entscheidung.";

export const REPORT_INTRO_DISCLAIMER_EN =
  "This report describes typical patterns of behaviour in everyday work — not a fixed personality profile and not a judgement of the person. It is meant to support the assessment, not replace it; the individual case always remains part of the decision.";

export const REPORT_INTRO_DISCLAIMER_FR =
  "Ce rapport décrit des schémas de comportement typiques dans le travail quotidien, il ne constitue pas un profil de personnalité figé ni un jugement de valeur sur la personne. Il est conçu pour soutenir l'évaluation, non la remplacer. Le cas individuel fait toujours partie de la décision.";

export const REPORT_INTRO_DISCLAIMER_IT =
  "Questo rapporto descrive schemi di comportamento tipici nell'attività lavorativa quotidiana. Non costituisce un profilo di personalità fisso né una valutazione della persona. Intende supportare la valutazione, non sostituirla: il caso individuale rimane sempre parte di ogni decisione.";

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
  fr: {
    pageLang: "fr",
    dateLocale: "fr-FR",

    // Header
    kicker: "ANALYSE DE POSTE",
    title: "Profil de poste",
    printButton: "Imprimer",
    printTooltip: "Qualité 1:1 — dans la boîte d'impression, choisir « Enregistrer en PDF »",

    // Empty-State
    noProfileTitle: "Aucun profil de poste disponible",
    noProfileBody: "Merci de créer d'abord un profil de poste pour pouvoir générer le rapport.",
    noProfileButton: "Créer un profil de poste",

    // Loading
    loadingTitle: "Analyse de poste en cours",
    loadingBody: "Les textes sont générés sur la base de ton profil. Cela prend généralement 15 à 25 secondes.",

    // Section 1
    section1: "Profil de poste · Base de décision",
    section1Headline: "Quelle personnalité ce poste requiert-il ?",
    sub1ShortDescription: "Brève description du poste",
    coreTasksIntro: "Les tâches centrales de ce poste :",
    sub2StructureProfile: "Profil structurel du poste",
    structureExplanation:
      "Chaque personne possède les trois modes fondamentaux de pensée et d'action : Rythme et Décision, Communication et Relations, Structure et Rigueur. Les trois sont toujours présents. Ce qui diffère, c'est leur ordre et leur pondération.",
    structureExplanation2:
      "Cette structure façonne la façon dont les personnes décident, communiquent et agissent au quotidien. L'effet visible peut évoluer selon la situation : au quotidien, sous pression ou dans des moments détendus.",
    componentMeaning: "Signification des composantes",
    barLabelImp: "Rythme et Décision",
    barLabelInt: "Communication et Relations",
    barLabelAna: "Structure et Rigueur",
    sub3WorkLogic: "Logique de travail du poste",
    sub4Framework: "Conditions-cadres",
    successFocusLabel: "Critères de succès",

    // Section 2
    section2: "Comportement · Quotidien et pression",
    section2Headline: "Comportement au quotidien et sous pression",
    section2Sub:
      "La présentation suivante montre comment les exigences du poste s'expriment typiquement au quotidien, sous pression et lors d'un stress intense.",
    behaviourDaily: "Comportement au quotidien",
    behaviourPressure: "Comportement sous pression",
    behaviourStress: "Comportement lors d'un stress intense",

    // Section 3
    section3: "Impact sur l'équipe & risques de mauvais recrutement",
    section3Headline: "Impact, tensions et risques",
    section3SubLeadership:
      "Cette section décrit l'impact de ce poste sur l'équipe, les tensions typiques qui en découlent et les risques pouvant résulter d'un mauvais recrutement.",
    section3SubNonLeadership:
      "Cette section décrit l'impact de ce poste dans l'environnement de travail, les tensions typiques qui en découlent et les risques pouvant résulter d'un mauvais recrutement.",
    sub1LeadershipImpact: "Impact managérial du poste",
    sub1TeamImpact: "Impact sur l'équipe",
    sub2Tensions: "Tensions du poste",
    tensionsIntro: "Les tensions typiques de ce poste sont :",
    sub3MiscastRisks: "Risques de mauvais recrutement",
    sub4TypicalPerson: "Profil type pour ce poste",
    candidateLoading: "Génération en cours...",
    candidateError: "Le profil de la personne n'a pas pu être chargé.",

    // Section 4
    section4: "Conclusion de la décision",

    // Footer
    footerLabel: "Analyse de poste",
    footerCreatedOn: "Créé le",
  },
  it: {
    pageLang: "it",
    dateLocale: "it-IT",

    // Header
    kicker: "ANALISI DEL RUOLO",
    title: "Profilo del ruolo",
    printButton: "Stampa",
    printTooltip: "Qualità 1:1 — nella finestra di stampa scegli 'Salva come PDF'",

    // Empty-State
    noProfileTitle: "Nessun profilo del ruolo disponibile",
    noProfileBody: "Crea prima un profilo del ruolo per poter generare il rapporto.",
    noProfileButton: "Crea profilo del ruolo",

    // Loading
    loadingTitle: "Analisi del ruolo in corso",
    loadingBody: "I testi vengono generati in base al tuo profilo. Di solito ci vogliono 15-25 secondi.",

    // Section 1
    section1: "Profilo del ruolo · Base decisionale",
    section1Headline: "Quale personalità richiede questo ruolo?",
    sub1ShortDescription: "Breve descrizione del ruolo",
    coreTasksIntro: "I compiti principali di questo ruolo:",
    sub2StructureProfile: "Profilo strutturale del ruolo",
    structureExplanation:
      "Ogni persona dispone dei tre modi fondamentali di pensiero e azione: Ritmo e Decisione, Comunicazione e Relazioni, Struttura e Rigore. Tutti e tre sono sempre presenti. Ciò che varia è il loro ordine e la loro ponderazione.",
    structureExplanation2:
      "Questa struttura determina come le persone decidono, comunicano e agiscono nella vita quotidiana. L'effetto visibile può cambiare a seconda della situazione: nella routine lavorativa, sotto pressione o in momenti rilassati.",
    componentMeaning: "Significato delle componenti",
    barLabelImp: "Ritmo e Decisione",
    barLabelInt: "Comunicazione e Relazioni",
    barLabelAna: "Struttura e Rigore",
    sub3WorkLogic: "Logica di lavoro del ruolo",
    sub4Framework: "Condizioni quadro",
    successFocusLabel: "Focus sul successo",

    // Section 2
    section2: "Comportamento · Quotidiano e pressione",
    section2Headline: "Comportamento nel quotidiano e sotto pressione",
    section2Sub:
      "La seguente rappresentazione mostra come i requisiti del ruolo si esprimono tipicamente nella routine lavorativa, sotto pressione e in situazioni di forte stress.",
    behaviourDaily: "Comportamento nel quotidiano",
    behaviourPressure: "Comportamento sotto pressione",
    behaviourStress: "Comportamento sotto forte stress",

    // Section 3
    section3: "Impatto sul team e rischi di selezione errata",
    section3Headline: "Impatto, tensioni e rischi",
    section3SubLeadership:
      "Questa sezione descrive l'impatto del ruolo sul team, le tensioni tipiche che ne derivano e i rischi che possono emergere da una selezione errata.",
    section3SubNonLeadership:
      "Questa sezione descrive l'impatto del ruolo nell'ambiente lavorativo, le tensioni tipiche che ne derivano e i rischi che possono emergere da una selezione errata.",
    sub1LeadershipImpact: "Impatto di leadership del ruolo",
    sub1TeamImpact: "Impatto sul team",
    sub2Tensions: "Tensioni del ruolo",
    tensionsIntro: "Le tensioni tipiche di questo ruolo sono:",
    sub3MiscastRisks: "Rischi di selezione errata",
    sub4TypicalPerson: "Profilo tipico per questo ruolo",
    candidateLoading: "Generazione in corso...",
    candidateError: "Il profilo della persona non ha potuto essere caricato.",

    // Section 4
    section4: "Conclusione decisionale",

    // Footer
    footerLabel: "Analisi del ruolo",
    footerCreatedOn: "Creato il",
  },
} as const;

export type ReportLabels = typeof REPORT_LABELS.de;
