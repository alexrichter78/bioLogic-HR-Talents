import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Download, Lightbulb, ChevronDown, ChevronUp, ImageIcon, Mic, MicOff, ThumbsUp, ThumbsDown, Copy, Check, Search, X, FileText, Trash2, Bookmark, BookmarkCheck, History, Pin, PinOff, Pencil, Plus } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { useRegion, useLocalizedText } from "@/lib/region";
import { useUI } from "@/lib/ui-texts";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth";

type Message = {
  role: "user" | "assistant";
  content: string;
  image?: string;
  documentName?: string;
  overlayTitle?: string;
  overlaySubtitle?: string;
  feedback?: "up" | "down";
  errorReason?: "overloaded" | "tech";
  retryQuestion?: string;
};

const WELCOME_MSG: Message = {
  role: "assistant",
  content: "Willkommen bei Louis – deinem bioLogic Coach für Entscheidungen im richtigen Moment.\n\nIch unterstütze dich bei Fragen rund um Führung, Personalentscheidungen, Assessment, Bewerbungsgespräche und Kommunikation.\n\nWie kann ich dir helfen?",
};
const WELCOME_MSG_EN: Message = {
  role: "assistant",
  content: "Welcome to Louis – your bioLogic Coach for decisions at the right moment.\n\nI support you with questions around leadership, HR decisions, assessment, interviews and communication.\n\nHow can I help you?",
};
const WELCOME_MSG_FR: Message = {
  role: "assistant",
  content: "Bienvenue chez Louis – ton Coach bioLogic pour les décisions au bon moment.\n\nJe t'accompagne sur tes questions de leadership, de décisions RH, d'assessment, d'entretiens et de communication.\n\nComment puis-je t'aider ?",
};
const WELCOME_MSG_IT: Message = {
  role: "assistant",
  content: "Benvenuto da Louis – il tuo Coach bioLogic per le decisioni nel momento giusto.\n\nTi supporto nelle domande su leadership, decisioni HR, assessment, colloqui e comunicazione.\n\nCome posso aiutarti?",
};
const isWelcomeMsg = (m: Message) => m === WELCOME_MSG || m === WELCOME_MSG_EN || m === WELCOME_MSG_FR || m === WELCOME_MSG_IT;

function getWelcomeMsg(lang: string): Message {
  if (lang === "FR") return WELCOME_MSG_FR;
  if (lang === "EN") return WELCOME_MSG_EN;
  if (lang === "IT") return WELCOME_MSG_IT;
  return WELCOME_MSG;
}

const FR_COACH_UI = {
  pageTitle: "Louis",
  pageSubtitle: "Ton coach IA pour le leadership, les RH et les questions d'équipe",
  profileActive: "Profil actif",
  historyTitle: "Historique",
  historyButtonTitle: "Historique des conversations",
  newConvTitle: "Nouvelle conversation",
  newConvButton: "Nouvelle conversation",
  exportTitle: "Exporter la conversation en TXT",
  clearChatTitle: "Supprimer la conversation",
  clearChatConfirm: "Veux-tu vraiment supprimer la conversation en cours ?",
  historySearchPlaceholder: "Rechercher dans l'historique...",
  noHits: "Aucun résultat.",
  noConversations: "Aucune conversation enregistrée.",
  renameTitle: "Renommer",
  pinTitle: "Épingler",
  unpinTitle: "Désépingler",
  deleteTitle: "Supprimer",
  deleteConvConfirm: "Supprimer cette conversation ?",
  inputDesc: "Pose une question sur le leadership, la dynamique d'équipe ou choisis un prompt exemple.",
  promptSearchPlaceholder: "Rechercher des prompts...",
  examplePromptsBtn: "Prompts exemples",
  noPromptResults: (q: string) => `Aucun prompt trouvé pour « ${q} »`,
  requireAnalysisTitle: "Veuillez d'abord analyser un poste",
  copyAnswer: "Copier la réponse",
  goldenSaved: "Enregistré comme Golden Answer",
  goldenSave: "Enregistrer comme Golden Answer (admin)",
  suggestionsLabel: "Suggestions",
  loadingDefault: "Réponse en cours...",
  inputPlaceholder: "Pose ta question...",
  uploadImage: "Télécharger une image",
  uploadDoc: "Télécharger un PDF / document texte",
  errorOverloaded: "Le coach est momentanément surchargé – réessaie dans quelques secondes.",
  errorQuota: "Le quota IA de ton organisation est épuisé. Contacte ton administrateur pour augmenter la limite ou réinitialiser le compteur.",
  errorTimeout: "La requête a pris trop de temps. Réessaie – pour les questions complexes, reformule-la plus brièvement.",
  errorTimeoutShort: "La requête a pris trop de temps. Réessaie.",
  errorTech: "Désolé, un problème technique est survenu. Réessaie.",
  exportHeader: "Louis – Transcription de conversation",
  exportedAt: (d: string, t: string) => `Exporté le ${d} à ${t}`,
  exportLabelQuestion: "Question",
  exportLabelCoach: "Coach",
  welcome: "Bienvenue chez Louis – ton Coach bioLogic pour les décisions au bon moment.\n\nJe t'accompagne sur tes questions de leadership, de décisions RH, d'assessment, d'entretiens et de communication.\n\nComment puis-je t'aider ?",
  imageWithText: "Image avec texte",
  imageDownload: "Télécharger l'image",
  imageOnly: "Image seule (sans texte)",
  attachmentAlt: "Pièce jointe",
  docReading: "Lecture du document...",
  roleRequired: "(poste requis)",
  aiImageNote: "[Une image générée par IA a été créée dans cette étape]",
} as const;

type PromptCategory = { category: string; prompts: string[]; requiresAnalysis?: boolean };

const EXAMPLE_PROMPTS_DE: PromptCategory[] = [
  {
    category: "bioLogic-basierte Beratung",
    prompts: [
      "Mein Mitarbeiter hat einen starken impulsiven Anteil und unterbricht ständig andere im Meeting. Wie gehe ich damit um?",
      "Ich habe einen starken intuitiven Anteil und soll ein Kritikgespräch mit einem analytisch-dominanten Kollegen führen. Was muss ich beachten?",
      "Wie erkenne ich, ob jemand eher impulsiv, intuitiv oder analytisch geprägt ist, ohne einen Test zu machen?",
      "Mein Chef ist analytisch-dominant und gibt mir nie persönliches Feedback. Wie kann ich das ändern?",
      "Was bedeutet es für die Zusammenarbeit, wenn zwei impulsiv-dominante Personen im selben Projekt arbeiten?",
    ],
  },
  {
    category: "Fertige Formulierungen",
    prompts: [
      "Gib mir 3 Formulierungen, mit denen ich einem impulsiv-dominanten Mitarbeiter Grenzen setze, ohne ihn zu provozieren.",
      "Wie sage ich einem intuitiv-dominanten Teammitglied, dass die Qualität nicht stimmt, ohne die Beziehung zu beschädigen?",
      "Ich brauche eine Formulierung, um in einem Meeting einen analytisch-dominanten Kollegen höflich zu unterbrechen.",
      "Wie formuliere ich eine Absage an einen internen Bewerber mit starkem impulsiven Anteil, der schlecht mit Ablehnung umgeht?",
      "Gib mir einen Gesprächseinstieg für ein Jahresgespräch mit einem introvertierten, analytisch-dominanten Mitarbeiter.",
    ],
  },
  {
    category: "Gespräche durchspielen & üben",
    prompts: [
      "Spiel mit mir ein Gehaltsgespräch durch. Mein Gegenüber hat einen starken impulsiven Anteil und ist sehr fordernd. Übernimm seine Rolle und gib mir nach jeder Runde Feedback.",
      "Mein intuitiv-dominanter Mitarbeiter kommt ständig zu spät. Ich bin impulsiv-dominant. Spiel das Gespräch mit mir durch – du bist der Mitarbeiter.",
      "Simuliere ein Bewerbungsgespräch mit mir. Ich bin der Interviewer, die Person hat einen starken intuitiven Anteil. Reagiere wie ein echter Bewerber.",
      "Übe mit mir ein Feedbackgespräch. Ich muss einem langjährigen analytisch-dominanten Mitarbeiter sagen, dass er sich verändern muss. Du spielst ihn.",
      "Ich möchte meinem impulsiv-dominanten Chef eine Gehaltserhöhung vorschlagen. Lass uns das durchspielen – du bist mein Chef.",
    ],
  },
  {
    category: "Formulierungen prüfen & verbessern",
    prompts: [
      "Ich würde zu meinem intuitiv-dominanten Mitarbeiter sagen: 'Du kommst seit Wochen zu spät, das nervt das ganze Team.' – Was ist daran falsch und wie wäre es besser?",
      "Prüf meinen Satz für ein Kritikgespräch mit einer analytisch-dominanten Person: 'Ich habe das Gefühl, dass du dich nicht genug einbringst.' – Wie wirkt das?",
      "Wie würde eine impulsiv-dominante Person auf diesen Satz reagieren: 'Könnten wir vielleicht mal darüber sprechen, ob die Deadline realistisch ist?'",
      "Ich will meinem Team sagen: 'Ab sofort gilt: Wer zu spät kommt, muss sich erklären.' – Wie wirkt das auf die verschiedenen Typen?",
      "Formuliere mir drei verschiedene Einstiege für ein Kritikgespräch mit einer intuitiv-dominanten Person – ich wähle dann den besten.",
    ],
  },
  {
    category: "Teamkonstellations-Beratung",
    prompts: [
      "Mein Team besteht aus 3 analytisch-dominanten, 1 impulsiv-dominanten und 2 intuitiv-dominanten Personen. Was sind die typischen Dynamiken?",
      "Ich habe ein Team mit einem stark intuitiven Anteil. Welche Risiken gibt es und was fehlt uns?",
      "Wir sind 5 Leute: 2 impulsiv-analytische Hybride, 2 intuitiv-dominante Personen und 1 Balanced. Wie führe ich dieses Team am besten?",
      "In meinem Team gibt es nur impulsive und analytische Anteile, kein intuitives Gegengewicht. Was passiert da langfristig?",
      "Ich baue ein neues Projektteam auf. Welche Typenkonstellation wäre ideal für ein Innovationsprojekt?",
    ],
  },
  {
    category: "Gesprächs-Vorbereitung",
    prompts: [
      "Ich muss morgen ein Kündigungsgespräch mit einem intuitiv-dominanten Mitarbeiter führen. Hilf mir bei der Vorbereitung.",
      "Ich habe ein Konfliktgespräch mit einem impulsiv-dominanten Kollegen, der meine Autorität untergräbt. Wie bereite ich mich vor?",
      "Bereite mit mir ein Verhandlungsgespräch vor. Mein Gegenüber ist analytisch-dominant und will alles schriftlich.",
      "Ich muss meinem Team eine unpopuläre Entscheidung verkünden. Das Team hat eine stark impulsiv-intuitive Prägung. Wie gehe ich vor?",
      "Hilf mir, ein Rückkehrgespräch nach langer Krankheit vorzubereiten. Die Mitarbeiterin hat einen starken analytischen Anteil.",
    ],
  },
  {
    category: "Onboarding-Begleitung",
    prompts: [
      "Ein impulsiv-dominanter neuer Mitarbeiter kommt in mein eher analytisch geprägtes Team. Was muss ich in den ersten 90 Tagen beachten?",
      "Wir haben eine neue intuitiv-dominante Führungskraft eingestellt. Das Team ist überwiegend impulsiv geprägt. Wie gelingt die Integration?",
      "Ein analytisch-dominanter Experte wechselt in ein kreatives Team mit intuitiv-impulsiver Prägung. Welche Stolperfallen gibt es?",
      "Ich starte als neue Führungskraft in einem Team, das ich noch nicht kenne. Wie erkenne ich schnell die bioLogic-Typen?",
      "Drei neue Mitarbeiter kommen gleichzeitig. Wie gestalte ich die Einarbeitung, wenn alle unterschiedliche Typen sind?",
    ],
  },
  {
    category: "Konfliktmuster erkennen",
    prompts: [
      "Zwei Kollegen geraten ständig aneinander: einer will schnelle Entscheidungen, der andere braucht mehr Daten. Was steckt dahinter?",
      "In meinem Team gibt es eine Person, die immer alles persönlich nimmt, und eine, die nur sachlich argumentiert. Warum eskaliert das regelmässig?",
      "Mein Stellvertreter und ich blockieren uns gegenseitig. Ich habe einen starken intuitiven Anteil, er einen starken impulsiven. Wie durchbreche ich das Muster?",
      "Es gibt einen Dauerkonflikt zwischen Vertrieb (überwiegend impulsiv geprägt) und Qualitätssicherung (überwiegend analytisch geprägt). Wie löse ich das strukturell?",
      "Immer wenn wir unter Zeitdruck stehen, zerfällt mein Team in Lager. Was ist das bioLogic-Muster dahinter?",
    ],
  },
  {
    category: "Stellenanzeigen & Recruiting-Marketing",
    prompts: [
      "Ich suche einen Vertriebsleiter mit starkem impulsiven Anteil. Welche Wort- und Bildsprache sollte meine Stellenanzeige verwenden, um genau diesen Typ anzusprechen?",
      "Unsere Stellenanzeige für einen HR-Business-Partner spricht nur analytisch geprägte Bewerber an. Wie formuliere ich sie um, damit sich auch intuitiv-dominante Personen angesprochen fühlen?",
      "Wir suchen einen Qualitätsmanager mit starkem analytischen Anteil. Gib mir 5 konkrete Formulierungen für die Stellenanzeige, die diesen Typ anziehen.",
      "Ich möchte eine Stellenanzeige für eine Projektleitung schreiben, die ein impulsiv-intuitives Profil braucht. Wie kombiniere ich beide Ansprachen?",
      "Welche typischen Fehler machen Unternehmen in Stellenanzeigen, die dazu führen, dass sich die falschen bioLogic-Typen bewerben?",
    ],
  },
  {
    category: "Stammdaten-Kontext",
    requiresAnalysis: true,
    prompts: [
      "Schau dir die analysierte Stelle an und sag mir: Welche bioLogic-Typen passen am besten auf diese Rolle?",
      "Basierend auf dem analysierten Stellenprofil: Welche Art von Kandidat ergänzt das Anforderungsprofil am besten?",
      "Analysiere das Stellenprofil: Welche Stärken braucht der Stelleninhaber und wo liegen typische Risiken?",
      "Wie würde ein rotdominanter Kandidat auf diese Stelle wirken? Was sollte man bei der Besetzung beachten?",
      "Welche typischen Besetzungsfehler passieren bei diesem Stellenprofil, ohne dass man es merkt?",
    ],
  },
  {
    category: "Gesprächsleitfäden generieren",
    requiresAnalysis: true,
    prompts: [
      "Erstelle mir einen kompletten Interview-Leitfaden für die analysierte Stelle. Mit Einstieg, Kernfragen, bioLogic-spezifischen Beobachtungspunkten und Bewertungskriterien.",
      "Generiere einen strukturierten Gesprächsleitfaden für ein Erstgespräch mit einem Kandidaten für diese Rolle. Berücksichtige das analysierte Stellenprofil.",
      "Erstelle mir einen Onboarding-Gesprächsleitfaden für die ersten 90 Tage basierend auf dem Stellenprofil.",
      "Erstelle einen Feedbackgespräch-Leitfaden, der auf das bioLogic-Profil der Stelle zugeschnitten ist.",
      "Generiere einen Leitfaden für ein Probezeitgespräch basierend auf dem Stellenprofil und den Anforderungen.",
    ],
  },
  {
    category: "Zusammenfassungen",
    prompts: [
      "Fasse mir die wichtigsten Punkte aus unserem bisherigen Gespräch zusammen.",
    ],
  },
];

const EXAMPLE_PROMPTS_EN: PromptCategory[] = [
  {
    category: "bioLogic-based advice",
    prompts: [
      "My team member has a strong impulsive share and constantly interrupts others in meetings. How do I deal with this?",
      "I have a strong intuitive share and need to give critical feedback to an analytically dominant colleague. What do I need to keep in mind?",
      "How can I tell whether someone is more impulsive, intuitive or analytical, without running a test?",
      "My boss is analytically dominant and never gives me personal feedback. How can I change that?",
      "What does it mean for collaboration when two impulsive-dominant people work on the same project?",
    ],
  },
  {
    category: "Ready-made phrasings",
    prompts: [
      "Give me 3 phrasings I can use to set boundaries with an impulsive-dominant employee without provoking them.",
      "How do I tell an intuitive-dominant team member that the quality isn't right, without damaging the relationship?",
      "I need a phrasing to politely interrupt an analytically dominant colleague in a meeting.",
      "How do I phrase a rejection to an internal applicant with a strong impulsive share who handles rejection badly?",
      "Give me an opener for an annual review with an introverted, analytically dominant employee.",
    ],
  },
  {
    category: "Role-play & practice conversations",
    prompts: [
      "Run a salary negotiation with me. My counterpart has a strong impulsive share and is very demanding. Take their role and give me feedback after each round.",
      "My intuitive-dominant employee is constantly late. I'm impulsive-dominant. Run the conversation with me – you play the employee.",
      "Simulate a job interview with me. I'm the interviewer, the candidate has a strong intuitive share. React like a real applicant.",
      "Practise a feedback conversation with me. I have to tell a long-serving analytically dominant employee that they need to change. You play them.",
      "I want to ask my impulsive-dominant boss for a raise. Let's role-play it – you're my boss.",
    ],
  },
  {
    category: "Check & improve phrasings",
    prompts: [
      "I would say to my intuitive-dominant employee: 'You've been late for weeks, it's annoying the whole team.' – What's wrong with that and how would it be better?",
      "Check my sentence for a critical conversation with an analytically dominant person: 'I have the feeling that you're not contributing enough.' – How does that come across?",
      "How would an impulsive-dominant person react to this sentence: 'Could we maybe talk about whether the deadline is realistic?'",
      "I want to tell my team: 'From now on, anyone who's late has to explain themselves.' – How does that land with the different types?",
      "Draft three different openers for a critical conversation with an intuitive-dominant person – I'll pick the best one.",
    ],
  },
  {
    category: "Team constellation advice",
    prompts: [
      "My team consists of 3 analytically dominant, 1 impulsive-dominant and 2 intuitive-dominant people. What are the typical dynamics?",
      "I have a team with a strong intuitive share. What are the risks and what are we missing?",
      "We're 5 people: 2 impulsive-analytical hybrids, 2 intuitive-dominant people and 1 balanced. How do I best lead this team?",
      "My team only has impulsive and analytical shares, no intuitive counterweight. What happens long-term?",
      "I'm building a new project team. Which type constellation would be ideal for an innovation project?",
    ],
  },
  {
    category: "Conversation preparation",
    prompts: [
      "Tomorrow I have a termination conversation with an intuitive-dominant employee. Help me prepare.",
      "I have a conflict conversation with an impulsive-dominant colleague who undermines my authority. How do I prepare?",
      "Prepare a negotiation with me. My counterpart is analytically dominant and wants everything in writing.",
      "I have to announce an unpopular decision to my team. The team is strongly impulsive-intuitive. How do I approach it?",
      "Help me prepare a return-to-work conversation after a long illness. The employee has a strong analytical share.",
    ],
  },
  {
    category: "Onboarding support",
    prompts: [
      "An impulsive-dominant new employee is joining my mostly analytical team. What do I need to keep in mind in the first 90 days?",
      "We've hired a new intuitive-dominant manager. The team is predominantly impulsive. How do we make the integration work?",
      "An analytically dominant expert is moving into a creative team with an intuitive-impulsive profile. What pitfalls are there?",
      "I'm starting as a new manager in a team I don't know yet. How do I quickly recognise the bioLogic types?",
      "Three new employees are joining at the same time. How do I design onboarding when they're all different types?",
    ],
  },
  {
    category: "Spotting conflict patterns",
    prompts: [
      "Two colleagues constantly clash: one wants quick decisions, the other needs more data. What's behind this?",
      "In my team there's one person who always takes everything personally and one who only argues factually. Why does this regularly escalate?",
      "My deputy and I keep blocking each other. I have a strong intuitive share, he has a strong impulsive one. How do I break the pattern?",
      "There's an ongoing conflict between sales (mostly impulsive) and quality assurance (mostly analytical). How do I resolve this structurally?",
      "Whenever we're under time pressure, my team splits into camps. What's the bioLogic pattern behind this?",
    ],
  },
  {
    category: "Job ads & recruiting marketing",
    prompts: [
      "I'm looking for a sales lead with a strong impulsive share. Which wording and imagery should my job ad use to attract exactly this type?",
      "Our job ad for an HR business partner only attracts analytically shaped applicants. How do I rephrase it so intuitive-dominant people also feel addressed?",
      "We're looking for a quality manager with a strong analytical share. Give me 5 concrete phrasings for the job ad that attract this type.",
      "I want to write a job ad for a project lead role that needs an impulsive-intuitive profile. How do I combine both audiences?",
      "What typical mistakes do companies make in job ads that lead to the wrong bioLogic types applying?",
    ],
  },
  {
    category: "Master data context",
    requiresAnalysis: true,
    prompts: [
      "Look at the analysed role and tell me: which bioLogic types fit this role best?",
      "Based on the analysed role profile: what kind of candidate best complements the requirements?",
      "Analyse the role profile: what strengths does the role holder need and where are the typical risks?",
      "How would a red-dominant candidate fit this role? What should be considered when filling it?",
      "What typical hiring mistakes happen with this role profile without anyone noticing?",
    ],
  },
  {
    category: "Generate interview guides",
    requiresAnalysis: true,
    prompts: [
      "Create a complete interview guide for the analysed role. With opener, core questions, bioLogic-specific observation points and evaluation criteria.",
      "Generate a structured guide for a first conversation with a candidate for this role. Take the analysed role profile into account.",
      "Create an onboarding conversation guide for the first 90 days based on the role profile.",
      "Create a feedback conversation guide tailored to the bioLogic profile of the role.",
      "Generate a guide for a probation-period review based on the role profile and requirements.",
    ],
  },
  {
    category: "Summaries",
    prompts: [
      "Summarise the most important points from our conversation so far.",
    ],
  },
];

const EXAMPLE_PROMPTS_FR: PromptCategory[] = [
  {
    category: "Conseil bioLogic",
    prompts: [
      "J'ai un collaborateur avec une forte dominante Orienté action qui coupe constamment la parole en réunion. Comment je gère ça ?",
      "Je dois mener un entretien de recadrage avec quelqu'un de très orienté Analytique. Qu'est-ce que je dois garder en tête ?",
      "Comment reconnaître le profil dominant de quelqu'un sans lui faire passer un test ?",
      "Mon manager est très orienté Analytique et ne me donne jamais de feedback personnel. Comment je change ça ?",
      "Je dois gérer deux personnes avec des profils opposés dans mon équipe. Par où je commence ?",
    ],
  },
  {
    category: "Tester et affiner ses formulations",
    prompts: [
      "Je dirais à mon collaborateur très orienté Relationnel : 'Tu arrives en retard depuis des semaines, ça énerve toute l'équipe.' – Qu'est-ce qui cloche et comment reformuler ?",
      "Vérifie cette phrase pour un entretien délicat avec une personne très orientée Analytique : 'J'ai l'impression que tu ne t'impliques pas assez.' – Quel effet ça produit ?",
      "Comment une personne avec une forte composante Orienté action réagirait-elle à cette phrase : 'On pourrait peut-être discuter du réalisme de la deadline ?'",
      "Je veux dire à mon équipe : 'Dorénavant, quiconque arrive en retard devra s'expliquer.' – Quel effet ça a sur les différents profils ?",
      "Propose-moi trois amorces différentes pour un entretien de recadrage avec une personne très orientée Relationnel – je choisirai ensuite la meilleure.",
    ],
  },
  {
    category: "Jeux de rôle et entraînement",
    prompts: [
      "Entraîne-toi avec moi à une négociation salariale. Mon interlocuteur a une forte composante Orienté action et est très exigeant. Joue son rôle et donne-moi un retour après chaque échange.",
      "Mon collaborateur orienté Relationnel arrive sans cesse en retard. Moi, j'ai une forte composante Orienté action. Jouons la scène ensemble – tu es le collaborateur.",
      "Simule un entretien de recrutement avec moi. Je suis le recruteur, le candidat a une forte composante Relationnel. Réagis comme un vrai candidat.",
      "Entraîne-toi avec moi à un entretien de feedback. Je dois dire à un collaborateur de longue date très orienté Analytique qu'il doit évoluer. Tu joues son rôle.",
      "Je veux demander une augmentation à mon responsable avec une forte composante Orienté action. Jouons la scène – tu es mon responsable.",
    ],
  },
  {
    category: "Leadership et management",
    prompts: [
      "Comment déléguer efficacement à quelqu'un avec une forte composante Relationnel ?",
      "Mon équipe résiste au changement. Comment présenter une décision difficile selon les profils ?",
      "Quels sont les signaux d'alarme d'une équipe en situation de stress selon les profils bioLogic ?",
      "Comment donner un feedback constructif à une personne très orientée Orienté action sans qu'elle le vive comme une attaque ?",
      "Je dois faire passer quelqu'un d'un rôle opérationnel à un rôle de coordination. Quels risques et comment l'accompagner ?",
    ],
  },
  {
    category: "Dynamique d'équipe",
    prompts: [
      "Mon équipe est très orientée Orienté action. Quels sont les angles morts collectifs ?",
      "Nous sommes 5 : 2 avec une forte dominante Orienté action, 2 Relationnel, 1 équilibré. Comment je pilote cette équipe ?",
      "Mon équipe manque de profils Relationnel. Quelles sont les conséquences à long terme ?",
      "Je constitue une nouvelle équipe projet. Quelle constellation est idéale pour un projet d'innovation ?",
      "Comment gérer les tensions entre profils très différents lors de prises de décision sous pression ?",
    ],
  },
  {
    category: "Préparation d'entretiens",
    prompts: [
      "Demain j'ai un entretien de licenciement avec un collaborateur très orienté Relationnel. Aide-moi à me préparer.",
      "J'ai un entretien de recrutement avec un candidat très orienté Analytique. Quelles questions poser ?",
      "Comment annoncer une décision impopulaire à une équipe avec une forte composante Orienté action ?",
      "Aide-moi à préparer une négociation avec quelqu'un de très orienté Analytique qui veut tout par écrit.",
      "Je dois mener un entretien de retour après une longue absence. Le collaborateur est très orienté Analytique.",
    ],
  },
  {
    category: "Accompagnement à l'intégration",
    prompts: [
      "Un nouveau collaborateur avec une forte composante Orienté action rejoint mon équipe très orientée Analytique. Qu'est-ce que je dois surveiller durant les 90 premiers jours ?",
      "Nous avons recruté un nouveau manager très orienté Relationnel. L'équipe est majoritairement à dominante Orienté action. Comment réussir l'intégration ?",
      "Un expert très orienté Analytique rejoint une équipe créative avec un profil Orienté action/Relationnel. Quels sont les pièges à éviter ?",
      "Je prends la tête d'une équipe que je ne connais pas encore. Comment identifier rapidement les profils bioLogic de chaque membre ?",
      "Trois nouveaux collaborateurs arrivent en même temps avec des profils très différents. Comment organiser leur intégration sans les perdre ?",
    ],
  },
  {
    category: "Identification des conflits",
    prompts: [
      "Deux collègues s'affrontent sans cesse : l'un veut décider vite, l'autre a besoin de plus de données. Qu'est-ce qui se passe ?",
      "Il y a un conflit récurrent entre le commerce (très Orienté action) et l'assurance qualité (très Analytique). Comment le résoudre structurellement ?",
      "Sous pression, mon équipe se divise en clans. Quel est le schéma bioLogic derrière ça ?",
      "Mon adjoint(e) et moi nous bloquons mutuellement. Comment briser ce schéma ?",
      "Dans mon équipe, une personne prend tout personnellement et une autre n'argumente que sur les faits. Pourquoi ça dégénère à chaque fois ?",
    ],
  },
  {
    category: "Recrutement et offres d'emploi",
    prompts: [
      "Je cherche un responsable commercial avec une forte composante Orienté action. Quel message et quelle tonalité pour l'offre d'emploi ?",
      "Notre annonce pour un RH business partner n'attire que des profils Analytique. Comment la reformuler pour toucher aussi les profils Relationnel ?",
      "Donne-moi 5 formulations concrètes pour une offre d'emploi de chef de projet avec un profil mixte Orienté action / Relationnel.",
      "Quelles erreurs typiques font les entreprises dans leurs offres d'emploi en matière d'adéquation des profils ?",
      "Je veux publier une annonce pour un poste de direction qui nécessite un fort profil Analytique. Quels mots et quel ton utiliser ?",
    ],
  },
  {
    category: "Données de contexte",
    requiresAnalysis: true,
    prompts: [
      "Regarde le poste analysé et dis-moi : quels profils bioLogic correspondent le mieux à ce rôle ?",
      "D'après le DNA du poste : quel type de candidat complète le mieux le profil d'exigences ?",
      "Quels points forts doit avoir le titulaire du poste et où sont les risques typiques ?",
      "Comment un candidat à forte dominante Orienté action s'inscrirait-il dans ce rôle ? Qu'est-ce qu'il faut anticiper ?",
      "Quelles erreurs de recrutement typiques passe-t-on à côté avec ce profil de poste ?",
    ],
  },
  {
    category: "Générer des guides d'entretien",
    requiresAnalysis: true,
    prompts: [
      "Crée un guide d'entretien complet pour le poste analysé. Avec une introduction, des questions clés, des points d'observation spécifiques bioLogic et des critères d'évaluation.",
      "Génère un guide structuré pour un premier entretien avec un candidat pour ce rôle. Tiens compte du profil de poste analysé.",
      "Crée un guide d'entretien d'intégration pour les 90 premiers jours, basé sur le profil du poste.",
      "Crée un guide d'entretien de feedback adapté au profil bioLogic du poste.",
      "Génère un guide pour un entretien de fin de période d'essai, basé sur le profil et les exigences du poste.",
    ],
  },
  {
    category: "Résumés",
    prompts: [
      "Résume les points les plus importants de notre conversation.",
    ],
  },
];

const EXAMPLE_PROMPTS_IT: PromptCategory[] = [
  {
    category: "Consulenza bioLogic",
    prompts: [
      "Un mio collaboratore ha una forte componente Orientato all'azione e interrompe continuamente gli altri in riunione. Come gestisco la situazione?",
      "Ho una forte componente Relazionale e devo dare un feedback critico a un collega dominato da Analitico. Cosa devo tenere a mente?",
      "Come riconosco se qualcuno tende più verso Orientato all'azione, Relazionale o Analitico, senza fargli fare un test?",
      "Il mio responsabile ha una forte componente Analitico e non mi dà mai feedback personale. Come posso cambiare questa situazione?",
      "Cosa significa per la collaborazione avere due persone dominate da Orientato all'azione nello stesso progetto?",
    ],
  },
  {
    category: "Formulazioni pronte",
    prompts: [
      "Dammi 3 formulazioni per fissare dei limiti a un collaboratore con forte Orientato all'azione senza provocarlo.",
      "Come dico a un membro del team dominato da Relazionale che la qualità non è accettabile, senza danneggiare il rapporto?",
      "Ho bisogno di una formulazione per interrompere educatamente un collega dominato da Analitico in una riunione.",
      "Come formulo un rifiuto a un candidato interno con forte Orientato all'azione che gestisce male il diniego?",
      "Dammi un'apertura per un colloquio annuale con un collaboratore introverso dominato da Analitico.",
    ],
  },
  {
    category: "Simulazioni e pratica",
    prompts: [
      "Facciamo una simulazione di trattativa salariale. Il mio interlocutore ha una forte componente Orientato all'azione ed è molto esigente. Interpreta il suo ruolo e dammi feedback dopo ogni turno.",
      "Il mio collaboratore dominato da Relazionale arriva sempre in ritardo. Io ho una forte componente Orientato all'azione. Simuliamo il colloquio – sei tu il collaboratore.",
      "Simula un colloquio di selezione con me. Sono io l'intervistatore, il candidato ha una forte componente Relazionale. Rispondi come un vero candidato.",
      "Esercitati con me in un colloquio di feedback. Devo dire a un collaboratore di lunga data dominato da Analitico che deve cambiare. Tu lo interpreti.",
      "Voglio chiedere al mio responsabile con forte Orientato all'azione un aumento. Facciamo una simulazione – tu sei il mio responsabile.",
    ],
  },
  {
    category: "Verificare e migliorare le formulazioni",
    prompts: [
      "Direi al mio collaboratore dominato da Relazionale: 'Sei in ritardo da settimane, stai innervosendo tutto il team.' – Cosa c'è di sbagliato e come sarebbe meglio?",
      "Controlla questa frase per un colloquio critico con una persona dominata da Analitico: 'Ho la sensazione che tu non ti impegni abbastanza.' – Che effetto fa?",
      "Come reagirebbe una persona con forte Orientato all'azione a questa frase: 'Potremmo forse parlare di se la scadenza è realistica?'",
      "Voglio dire al mio team: 'Da ora in poi: chi arriva in ritardo deve spiegare il perché.' – Che effetto ha sui diversi tipi?",
      "Scrivimi tre aperture diverse per un colloquio critico con una persona dominata da Relazionale – poi scelgo la migliore.",
    ],
  },
  {
    category: "Consulenza sulle dinamiche di team",
    prompts: [
      "Il mio team è composto da 3 persone dominate da Analitico, 1 da Orientato all'azione e 2 da Relazionale. Quali sono le dinamiche tipiche?",
      "Ho un team con una forte componente Relazionale. Quali sono i rischi e cosa ci manca?",
      "Siamo in 5: 2 con un profilo misto Orientato all'azione-Analitico, 2 con forte Relazionale e 1 equilibrato. Come guido al meglio questo team?",
      "Nel mio team ci sono solo componenti Orientato all'azione e Analitico, senza un contrappeso Relazionale. Cosa succede a lungo termine?",
      "Sto costruendo un nuovo team di progetto. Quale combinazione di tipi sarebbe ideale per un progetto di innovazione?",
    ],
  },
  {
    category: "Preparazione ai colloqui",
    prompts: [
      "Domani devo condurre un colloquio di licenziamento con un collaboratore dominato da Relazionale. Aiutami a prepararmi.",
      "Ho un colloquio di conflitto con un collega dominato da Orientato all'azione che mina la mia autorità. Come mi preparo?",
      "Preparami una trattativa. Il mio interlocutore ha forte Analitico e vuole tutto per iscritto.",
      "Devo comunicare al mio team una decisione impopolare. Il team è a forte impronta Orientato all'azione-Relazionale. Come procedo?",
      "Aiutami a preparare un colloquio di rientro dopo una lunga malattia. La collaboratrice ha una forte componente Analitico.",
    ],
  },
  {
    category: "Supporto all'onboarding",
    prompts: [
      "Un nuovo collaboratore con forte Orientato all'azione entra nel mio team prevalentemente Analitico. Cosa devo considerare nei primi 90 giorni?",
      "Abbiamo assunto un nuovo responsabile con forte Relazionale. Il team è a forte dominanza Orientato all'azione. Come riusciamo nell'integrazione?",
      "Un esperto con forte Analitico passa in un team creativo con profilo Relazionale-Orientato all'azione. Quali sono le insidie?",
      "Comincio come nuovo responsabile in un team che non conosco ancora. Come riconosco rapidamente i tipi bioLogic?",
      "Tre nuovi collaboratori entrano contemporaneamente. Come struttura l'inserimento quando sono tutti di tipo diverso?",
    ],
  },
  {
    category: "Riconoscere i pattern di conflitto",
    prompts: [
      "Due colleghi si scontrano continuamente: uno vuole decisioni rapide, l'altro ha bisogno di più dati. Cosa c'è dietro?",
      "Nel mio team c'è una persona che prende tutto sul personale e un'altra che argomenta solo in modo razionale. Perché si intensifica regolarmente?",
      "Il mio vice e io ci blocchiamo a vicenda. Io ho una forte Relazionale, lui forte Orientato all'azione. Come rompo lo schema?",
      "C'è un conflitto permanente tra il commerciale (prevalentemente Orientato all'azione) e il controllo qualità (prevalentemente Analitico). Come lo risolvo strutturalmente?",
      "Ogni volta che siamo sotto pressione di tempo, il mio team si divide in fazioni. Qual è lo schema bioLogic dietro questo?",
    ],
  },
  {
    category: "Annunci e marketing del recruiting",
    prompts: [
      "Cerco un responsabile commerciale con forte Orientato all'azione. Quale linguaggio verbale e visivo dovrebbe usare il mio annuncio per attirare esattamente questo tipo?",
      "Il nostro annuncio per un HR Business Partner attira solo candidati orientati a Analitico. Come lo riformulo per far sentire coinvolte anche le persone con forte Relazionale?",
      "Cerchiamo un quality manager con forte Analitico. Dammi 5 formulazioni concrete per l'annuncio che attirino questo tipo.",
      "Voglio scrivere un annuncio per una posizione di project lead che richiede un profilo misto Orientato all'azione-Relazionale. Come combino i due target?",
      "Quali errori tipici fanno le aziende negli annunci di lavoro, portando a candidature dei tipi bioLogic sbagliati?",
    ],
  },
  {
    category: "Contesto dati di base",
    requiresAnalysis: true,
    prompts: [
      "Guarda la posizione analizzata e dimmi: quali tipi bioLogic sono più adatti a questo ruolo?",
      "Basandoti sul profilo del ruolo analizzato: che tipo di candidato completa meglio il profilo dei requisiti?",
      "Analizza il profilo del ruolo: quali punti di forza deve avere chi ricopre questa posizione e dove si trovano i rischi tipici?",
      "Come si comporterebbe un candidato dominato da Orientato all'azione in questo ruolo? Cosa considerare nella selezione?",
      "Quali errori di selezione tipici accadono per questo profilo di ruolo senza che nessuno se ne accorga?",
    ],
  },
  {
    category: "Generare guide ai colloqui",
    requiresAnalysis: true,
    prompts: [
      "Crea una guida completa al colloquio per la posizione analizzata. Con apertura, domande chiave, punti di osservazione bioLogic specifici e criteri di valutazione.",
      "Genera una guida strutturata per un primo colloquio con un candidato per questo ruolo. Tieni conto del profilo del ruolo analizzato.",
      "Crea una guida al colloquio di onboarding per i primi 90 giorni basandoti sul profilo del ruolo.",
      "Crea una guida al colloquio di feedback calibrata sul profilo bioLogic del ruolo.",
      "Genera una guida per un colloquio di periodo di prova basandoti sul profilo del ruolo e sui requisiti.",
    ],
  },
  {
    category: "Riepiloghi",
    prompts: [
      "Riassumi i punti più importanti della nostra conversazione fino ad ora.",
    ],
  },
];

function formatMessage(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: { text: string; indent: boolean; ordered: boolean; number?: number }[] = [];
  let tableRows: string[][] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      const isOrdered = listItems[0].ordered;
      const Tag = isOrdered ? "ol" : "ul";
      elements.push(
        <Tag key={`list-${elements.length}`} style={{ margin: "8px 0", paddingLeft: isOrdered ? 22 : 18, listStyle: isOrdered ? "decimal" : "none" }}>
          {listItems.map((item, i) => (
            <li key={i} style={{
              marginBottom: 6, lineHeight: 1.65, position: "relative",
              paddingLeft: item.indent ? 16 : 0,
            }}>
              {!isOrdered && (
                <span style={{ position: "absolute", left: item.indent ? 0 : -16, color: "currentColor", fontWeight: 600 }}>•</span>
              )}
              {renderInline(item.text)}
            </li>
          ))}
        </Tag>
      );
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length >= 2) {
      const header = tableRows[0];
      const body = tableRows.slice(1).filter(r => !r.every(c => /^[-:]+$/.test(c.trim())));
      elements.push(
        <div key={`tbl-${elements.length}`} style={{ margin: "10px 0", overflowX: "auto", borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, lineHeight: 1.5 }}>
            <thead>
              <tr>
                {header.map((cell, ci) => (
                  <th key={ci} style={{
                    padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#0071E3",
                    borderBottom: "2px solid rgba(0,113,227,0.2)", background: "rgba(0,113,227,0.04)",
                  }}>{renderInline(cell.trim())}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: "6px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)",
                    }}>{renderInline(cell.trim())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableRows = [];
  };

  const renderInline = (str: string): React.ReactNode => {
    const parts = str.split(/(\*\*.*?\*\*|".*?"|\[.*?\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s),]+)/g);
    if (parts.length === 1) return str;
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('"') && part.endsWith('"') && part.length > 10) {
        return <span key={i} style={{ fontStyle: "italic", color: "#3A3A3C" }}>{part}</span>;
      }
      const mdLink = part.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
      if (mdLink) {
        return <a key={i} href={mdLink[2]} target="_blank" rel="noopener noreferrer" style={{ color: "#0071E3", textDecoration: "underline" }}>{mdLink[1]}</a>;
      }
      if (/^https?:\/\/[^\s),]+$/.test(part)) {
        const cleanUrl = part.replace(/[.;:!?]+$/, "");
        const displayUrl = cleanUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
        const shortDisplay = displayUrl.length > 40 ? displayUrl.slice(0, 37) + "..." : displayUrl;
        return <a key={i} href={cleanUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0071E3", textDecoration: "underline", fontSize: "0.92em" }}>{shortDisplay}</a>;
      }
      return part;
    });
  };

  let inDialogueBlock = false;
  let dialogueLines: string[] = [];
  let dialogueIsRoleplay = false;

  const flushDialogue = () => {
    if (dialogueLines.length === 0) return;
    const isBlue = dialogueIsRoleplay;
    const color = isBlue ? "#0071E3" : "#34C759";
    const bg = isBlue ? "rgba(0,113,227,0.04)" : "rgba(52,199,89,0.04)";
    elements.push(
      <div key={`q-${elements.length}`} style={{
        margin: "10px 0",
        padding: "10px 14px",
        borderLeft: `3px solid ${color}`,
        background: bg,
        borderRadius: "0 8px 8px 0",
        fontStyle: "italic",
        lineHeight: 1.65,
        color: "#1D1D1F",
      }}>
        {dialogueLines.map((dl, di) => (
          <p key={di} style={{ margin: di === 0 ? 0 : "8px 0 0" }}>{renderInline(dl)}</p>
        ))}
      </div>
    );
    dialogueLines = [];
    inDialogueBlock = false;
    dialogueIsRoleplay = false;
  };

  const isRoleplayLine = (t: string) => {
    return /^\[Als\s/i.test(t) ||
      /^\[.*?(Person|Stimme|Ton|gereizt|ungeduldig|eingeschüchtert|betroffen|sachlich|emotional|ruhig|aufgebracht|fordernd|dominant|ärgerlich|wütend|genervt|skeptisch|verunsichert|impulsiv|lauter|leiser|geprägt|Mitarbeiter|Kollege|Kollegin|Chef|Vorgesetzte|Gegenüber)/i.test(t);
  };

  const isDialogueLine = (t: string) => {
    return (t.startsWith('"') && t.endsWith('"')) ||
      (t.startsWith('„') && (t.endsWith('"') || t.endsWith('"'))) ||
      (t.startsWith('>') && t.length > 2) ||
      (t.startsWith('[') && t.endsWith(']') && t.length > 4) ||
      /^\[.*?\]\s*.+/.test(t);
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx];
    const trimmed = raw.trim();
    const isIndented = raw.startsWith("    ") || raw.startsWith("\t");

    if (trimmed === "" && inDialogueBlock) {
      const nextNonEmpty = lines.slice(idx + 1).find(l => l.trim() !== "");
      if (nextNonEmpty && (isDialogueLine(nextNonEmpty.trim()) || inDialogueBlock)) {
        continue;
      }
      flushDialogue();
      continue;
    }
    if (trimmed === "" && dialogueLines.length > 0) {
      flushDialogue();
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList(); flushDialogue();
      const cells = trimmed.slice(1, -1).split("|");
      tableRows.push(cells);
      continue;
    } else if (tableRows.length > 0) {
      flushTable();
    }

    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      flushList(); flushDialogue();
      elements.push(<hr key={`hr-${elements.length}`} style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.08)", margin: "14px 0" }} />);
    } else if (/^#{1,4}\s+/.test(trimmed)) {
      flushList(); flushDialogue();
      const headingText = trimmed.replace(/^#{1,4}\s+/, "").replace(/:$/, "");
      elements.push(
        <p key={`h-${elements.length}`} style={{
          margin: elements.length > 0 ? "16px 0 6px" : "0 0 6px",
          lineHeight: 1.5,
          fontWeight: 700,
          fontSize: 14,
          color: "#0071E3",
          borderBottom: "1px solid rgba(0,113,227,0.12)",
          paddingBottom: 4,
        }}>{renderInline(headingText)}</p>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (listItems.length > 0 && !listItems[0].ordered) flushList();
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        listItems.push({
          text: numMatch[2],
          indent: isIndented,
          ordered: true,
          number: parseInt(numMatch[1]),
        });
      }
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      if (listItems.length > 0 && listItems[0].ordered) flushList();
      listItems.push({
        text: trimmed.replace(/^[-•]\s*/, ""),
        indent: isIndented,
        ordered: false,
      });
    } else {
      flushList();
      if (trimmed === "") {
        elements.push(<div key={`sp-${elements.length}`} style={{ height: 10 }} />);
      } else if (trimmed.endsWith(":") && trimmed.length < 80 && !trimmed.startsWith('"')) {
        elements.push(
          <p key={`h-${elements.length}`} style={{
            margin: elements.length > 0 ? "16px 0 6px" : "0 0 6px",
            lineHeight: 1.5,
            fontWeight: 700,
            fontSize: 14,
            color: "#0071E3",
            borderBottom: "1px solid rgba(0,113,227,0.12)",
            paddingBottom: 4,
          }}>{renderInline(trimmed.slice(0, -1))}</p>
        );
      } else if (isDialogueLine(trimmed) || inDialogueBlock) {
        if (trimmed.startsWith('[') && (trimmed.endsWith(']') || /^\[.*?\]\s/.test(trimmed))) {
          inDialogueBlock = true;
          if (isRoleplayLine(trimmed)) {
            dialogueIsRoleplay = true;
          }
        }
        const displayText = trimmed.startsWith('>') ? trimmed.slice(1).trim() : trimmed;
        dialogueLines.push(displayText);
      } else if (isIndented) {
        elements.push(
          <div key={`indent-${elements.length}`} style={{
            margin: "6px 0",
            padding: "8px 14px",
            background: "rgba(0,0,0,0.025)",
            borderRadius: 8,
            borderLeft: "3px solid rgba(0,0,0,0.08)",
            lineHeight: 1.65,
          }}>{renderInline(trimmed)}</div>
        );
      } else {
        flushDialogue();
        elements.push(
          <p key={`p-${elements.length}`} style={{ margin: "0 0 6px", lineHeight: 1.65 }}>{renderInline(trimmed)}</p>
        );
      }
    }
  }
  flushList();
  flushTable();
  flushDialogue();

  {
    const lastLine = lines.filter(l => l.trim().length > 0).pop()?.trim() || "";
    if (lastLine) {
      const isActionable = /\?\s*\**\s*$/.test(lastLine) || /soll ich|willst du|möchtest du|wollen wir|wie reagierst|magst du|lass uns|probier/i.test(lastLine);
      if (isActionable) {
        for (let i = elements.length - 1; i >= 0; i--) {
          const el = elements[i] as React.ReactElement;
          if (el && el.type === "p" && el.key && (el.key as string).startsWith("p-")) {
            elements[i] = (
              <p key={el.key} style={{ ...el.props.style, fontWeight: 700 }}>
                {el.props.children}
              </p>
            );
            break;
          }
        }
      }
    }
  }


  return <>{elements}</>;
}

export default function KICoach() {
  const { region } = useRegion();
  const t = useLocalizedText();
  const rawUI = useUI();
  const ui = region === "FR"
    ? { ...rawUI, coach: FR_COACH_UI as unknown as typeof rawUI.coach }
    : rawUI;
  const EXAMPLE_PROMPTS = region === "FR" ? EXAMPLE_PROMPTS_FR : region === "EN" ? EXAMPLE_PROMPTS_EN : region === "IT" ? EXAMPLE_PROMPTS_IT : EXAMPLE_PROMPTS_DE;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isMobile = useIsMobile();
  const LOUIS_STORAGE_KEY = user?.id ? `louis_chat_v1_u${user.id}` : "louis_chat_v1_anon";
  const LOUIS_TTL_MS = 24 * 60 * 60 * 1000;
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && isWelcomeMsg(prev[0])) return [getWelcomeMsg(region)];
      return prev;
    });
  }, [region]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOUIS_STORAGE_KEY);
      if (!raw) { setMessages([getWelcomeMsg(region)]); return; }
      const parsed = JSON.parse(raw) as { savedAt: number; messages: Message[] };
      if (!parsed.savedAt || Date.now() - parsed.savedAt > LOUIS_TTL_MS) {
        localStorage.removeItem(LOUIS_STORAGE_KEY);
        setMessages([getWelcomeMsg(region)]);
        return;
      }
      if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
        setMessages([getWelcomeMsg(region)]);
        return;
      }
      setMessages(parsed.messages);
    } catch {
      setMessages([getWelcomeMsg(region)]);
    }
  }, [LOUIS_STORAGE_KEY]);

  useEffect(() => {
    try {
      const toSave = messages.filter(m => !isWelcomeMsg(m));
      if (toSave.length === 0) {
        localStorage.removeItem(LOUIS_STORAGE_KEY);
        return;
      }
      localStorage.setItem(LOUIS_STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), messages: toSave }));
    } catch {
      // localStorage full or disabled — ignore
    }
  }, [messages, LOUIS_STORAGE_KEY]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedGoldenIndex, setSavedGoldenIndex] = useState<Set<number>>(new Set());
  const [savingGoldenIndex, setSavingGoldenIndex] = useState<number | null>(null);

  const saveAsGolden = useCallback(async (index: number) => {
    const assistantMsg = messages[index];
    if (!assistantMsg || assistantMsg.role !== "assistant") return;
    let userMsg: Message | undefined;
    for (let j = index - 1; j >= 0; j--) {
      if (messages[j]?.role === "user") { userMsg = messages[j]; break; }
    }
    if (!userMsg) return;
    setSavingGoldenIndex(index);
    try {
      const resp = await fetch("/api/golden-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userMessage: userMsg.content,
          assistantMessage: assistantMsg.content,
          category: "louis-rated",
        }),
      });
      if (resp.ok) {
        setSavedGoldenIndex(prev => { const next = new Set(prev); next.add(index); return next; });
      }
    } catch {} finally {
      setSavingGoldenIndex(null);
    }
  }, [messages]);

  type ConvSummary = { id: number; title: string; pinned: boolean; updatedAt: string };
  const currentConvKey = user?.id ? `louis_current_conv_v1_u${user.id}` : null;
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [conversations, setConversations] = useState<ConvSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renamingValue, setRenamingValue] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextPersistRef = useRef(false);

  useEffect(() => {
    if (!currentConvKey) { setCurrentConversationId(null); return; }
    try {
      const raw = localStorage.getItem(currentConvKey);
      const id = raw ? parseInt(raw, 10) : null;
      setCurrentConversationId(id && !isNaN(id) ? id : null);
    } catch { setCurrentConversationId(null); }
  }, [currentConvKey]);

  useEffect(() => {
    if (!currentConvKey) return;
    try {
      if (currentConversationId) localStorage.setItem(currentConvKey, String(currentConversationId));
      else localStorage.removeItem(currentConvKey);
    } catch {}
  }, [currentConversationId, currentConvKey]);

  const loadConversations = useCallback(async () => {
    try {
      const r = await fetch("/api/coach-conversations", { credentials: "include" });
      if (r.ok) setConversations(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (!user?.id) { setConversations([]); return; }
    loadConversations();
  }, [user?.id, loadConversations]);

  useEffect(() => {
    if (historyOpen && user?.id) {
      loadConversations();
    }
  }, [historyOpen, user?.id, loadConversations]);

  const persistConversation = useCallback(async (msgsToSave: Message[], convId: number | null) => {
    const real = msgsToSave.filter(m => !isWelcomeMsg(m));
    if (real.length === 0) return;
    const firstUser = real.find(m => m.role === "user");
    const autoTitle = (firstUser?.content || "Unterhaltung").replace(/\s+/g, " ").trim().slice(0, 60);
    try {
      if (convId) {
        await fetch(`/api/coach-conversations/${convId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ messages: real }),
        });
      } else {
        const r = await fetch("/api/coach-conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title: autoTitle, messages: real }),
        });
        if (r.ok) {
          const created = await r.json();
          setCurrentConversationId(created.id);
        }
      }
      loadConversations();
    } catch {}
  }, [loadConversations]);

  useEffect(() => {
    if (loading) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    const real = messages.filter(m => !isWelcomeMsg(m));
    if (real.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const idAtSchedule = currentConversationId;
    const msgsAtSchedule = messages;
    saveTimerRef.current = setTimeout(() => {
      persistConversation(msgsAtSchedule, idAtSchedule);
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [messages, loading, currentConversationId, persistConversation]);

  const startNewConversation = useCallback(() => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    skipNextPersistRef.current = true;
    setMessages([getWelcomeMsg(region)]);
    setCurrentConversationId(null);
    setInput("");
    setPendingImage(null);
    setPendingDoc(null);
    try { localStorage.removeItem(LOUIS_STORAGE_KEY); } catch {}
    setHistoryOpen(false);
  }, [region]);

  const loadConversation = useCallback(async (id: number) => {
    try {
      const r = await fetch(`/api/coach-conversations/${id}`, { credentials: "include" });
      if (!r.ok) return;
      const conv = await r.json();
      const msgs = Array.isArray(conv.messages) && conv.messages.length > 0 ? conv.messages : [WELCOME_MSG];
      if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
      skipNextPersistRef.current = true;
      setMessages(msgs);
      setCurrentConversationId(conv.id);
      setHistoryOpen(false);
      setSavedGoldenIndex(new Set());
    } catch {}
  }, []);

  const deleteConversation = useCallback(async (id: number) => {
    if (!window.confirm(ui.coach.deleteConvConfirm)) return;
    try {
      await fetch(`/api/coach-conversations/${id}`, { method: "DELETE", credentials: "include" });
      if (currentConversationId === id) {
        setMessages([getWelcomeMsg(region)]);
        setCurrentConversationId(null);
      }
      loadConversations();
    } catch {}
  }, [currentConversationId, loadConversations]);

  const togglePinConversation = useCallback(async (id: number, currentlyPinned: boolean) => {
    try {
      await fetch(`/api/coach-conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pinned: !currentlyPinned }),
      });
      loadConversations();
    } catch {}
  }, [loadConversations]);

  const renameConversation = useCallback(async (id: number, newTitle: string) => {
    const t = newTitle.trim().slice(0, 200);
    if (!t) { setRenamingId(null); return; }
    try {
      await fetch(`/api/coach-conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: t }),
      });
      loadConversations();
    } catch {}
    setRenamingId(null);
  }, [loadConversations]);

  const formatRelativeTime = useCallback((iso: string) => {
    const d = new Date(iso).getTime();
    const diff = Date.now() - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "gerade eben";
    if (mins < 60) return `vor ${mins} Min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `vor ${hours} Std`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `vor ${days} T`;
    return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }, []);

  const [showTips, setShowTips] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [promptSearch, setPromptSearch] = useState("");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!promptSearch.trim()) return;
    const term = promptSearch.trim().toLowerCase();
    const hasMatch = EXAMPLE_PROMPTS.some(cat => {
      if (cat.requiresAnalysis && (user?.coachOnly || !hasAnalysisData())) return false;
      if (cat.category.toLowerCase().includes(term)) return true;
      return cat.prompts.some(p => p.toLowerCase().includes(term));
    });
    if (!hasMatch && showPrompts) {
      setShowPrompts(false);
      setExpandedCategory(null);
    }
  }, [promptSearch]);

  const [pendingImage, setPendingImage] = useState<{ dataUrl: string; base64: string; mimeType: string } | null>(null);
  const [pendingDoc, setPendingDoc] = useState<{ name: string; text: string } | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const speechSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const userStoppedRef = useRef(false);
  const baseTextRef = useRef("");
  const accumulatedFinalRef = useRef("");

  const cleanDictation = useCallback((raw: string): string => {
    return raw
      .replace(/\s*[Pp]unkt\s*/g, ". ")
      .replace(/\s*[Kk]omma\s*/g, ", ")
      .replace(/\s*[Aa]usrufezeichen\s*/g, "! ")
      .replace(/\s*[Ff]ragezeichen\s*/g, "? ")
      .replace(/\s*[Dd]oppelpunkt\s*/g, ": ")
      .replace(/\s*[Ss]emikolon\s*/g, "; ")
      .replace(/\s*[Nn]eue [Zz]eile\s*/g, "\n")
      .replace(/\s*[Aa]bsatz\s*/g, "\n\n")
      .replace(/([.!?])\s+(\w)/g, (_, p, c) => p + " " + c.toUpperCase())
      .replace(/\s+([.,!?;:])/g, "$1")
      .replace(/\s{2,}/g, " ")
      .trim();
  }, []);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      let newFinal = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinal += transcript;
        } else {
          interim += transcript;
        }
      }
      if (newFinal) {
        accumulatedFinalRef.current += (accumulatedFinalRef.current && !accumulatedFinalRef.current.endsWith(" ") ? " " : "") + newFinal;
      }
      const composed = accumulatedFinalRef.current + (interim ? " " + interim : "");
      const cleaned = cleanDictation(composed);
      const prefix = baseTextRef.current ? baseTextRef.current + (baseTextRef.current.endsWith(" ") || baseTextRef.current.endsWith("\n") ? "" : " ") : "";
      setInput(prefix + cleaned);
    };

    recognition.onend = () => {
      if (userStoppedRef.current) {
        recognitionRef.current = null;
        setIsListening(false);
        if (inputRef.current) {
          inputRef.current.style.height = "48px";
          inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
        }
        return;
      }
      try {
        const next = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
        next.lang = "de-DE";
        next.continuous = true;
        next.interimResults = true;
        next.onresult = recognition.onresult;
        next.onend = recognition.onend;
        next.onerror = recognition.onerror;
        baseTextRef.current = baseTextRef.current + (accumulatedFinalRef.current ? (baseTextRef.current.endsWith(" ") ? "" : " ") + cleanDictation(accumulatedFinalRef.current) : "");
        accumulatedFinalRef.current = "";
        recognitionRef.current = next;
        next.start();
      } catch {
        recognitionRef.current = null;
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "audio-capture") return;
      if (event.error !== "aborted") {
        userStoppedRef.current = true;
        setIsListening(false);
        recognitionRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [cleanDictation]);

  const toggleListening = useCallback(() => {
    if (!speechSupported) return;
    if (isListening) {
      userStoppedRef.current = true;
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    userStoppedRef.current = false;
    setInput(prev => { baseTextRef.current = prev; return prev; });
    accumulatedFinalRef.current = "";
    setIsListening(true);
    startRecognition();
  }, [isListening, speechSupported, startRecognition]);

  useEffect(() => {
    return () => {
      userStoppedRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.onend = null as any; } catch {}
        try { recognitionRef.current.onresult = null as any; } catch {}
        try { recognitionRef.current.onerror = null as any; } catch {}
        try { recognitionRef.current.stop(); } catch {}
        try { recognitionRef.current.abort?.(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const hasAnalysisData = useCallback(() => {
    try {
      return !!(
        localStorage.getItem("analyseTexte") ||
        localStorage.getItem("rollenDnaState") ||
        localStorage.getItem("bioCheckIntroOverride") ||
        localStorage.getItem("bioCheckTextOverride") ||
        localStorage.getItem("bioCheckTextGenerated") ||
        localStorage.getItem("jobcheckLastResult") ||
        localStorage.getItem("teamdynamikState")
      );
    } catch { return false; }
  }, []);

  const handleImageSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      setPendingImage({ dataUrl, base64, mimeType: file.type });
      setPendingDoc(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDocumentSelect = useCallback(async (file: File) => {
    setPendingImage(null);
    setDocLoading(true);
    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const text = await file.text();
        setPendingDoc({ name: file.name, text: text.slice(0, 12000) });
      } else {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            resolve(dataUrl.split(",")[1]);
          };
          reader.readAsDataURL(file);
        });
        const res = await fetch("/api/parse-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mimeType: file.type }),
        });
        if (!res.ok) throw new Error("Parse failed");
        const data = await res.json();
        setPendingDoc({ name: file.name, text: data.text });
      }
    } catch {
      setPendingDoc({ name: file.name, text: "[Fehler beim Lesen des Dokuments]" });
    } finally {
      setDocLoading(false);
    }
  }, []);

  const prevMessageCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length !== prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const rawText = input.trim();
    const hasAttachment = !!(pendingImage || pendingDoc);
    if (!rawText && !hasAttachment) return;
    if (loading) return;
    const text = rawText || (pendingImage ? "Bitte analysiere dieses Bild." : "Bitte analysiere das Dokument.");

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const capturedImage = pendingImage;
    const capturedDoc = pendingDoc;
    const userMsg: Message = {
      role: "user",
      content: text,
      ...(capturedImage ? { image: capturedImage.dataUrl } : {}),
      ...(capturedDoc ? { documentName: capturedDoc.name } : {}),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setPendingImage(null);
    setPendingDoc(null);
    setLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = "48px";
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const chatHistory = newMessages.filter(m => !isWelcomeMsg(m)).map(m => ({
        ...m,
        content: stripButtonMarker(m.content),
      }));

      const stammdaten: Record<string, string> = {};
      try {
        const analyseRaw = localStorage.getItem("analyseTexte");
        if (analyseRaw) {
          const a = JSON.parse(analyseRaw);
          if (a.bereich1) stammdaten.impulsiveDaten = a.bereich1;
          if (a.bereich2) stammdaten.intuitiveDaten = a.bereich2;
          if (a.bereich3) stammdaten.analytischeDaten = a.bereich3;
        }
        const bioCheckIntro = localStorage.getItem("bioCheckIntroOverride");
        if (bioCheckIntro) stammdaten.bioCheckIntro = JSON.parse(bioCheckIntro);
        const bioCheckText = localStorage.getItem("bioCheckTextOverride") || localStorage.getItem("bioCheckTextGenerated");
        if (bioCheckText) stammdaten.bioCheckText = JSON.parse(bioCheckText);
        const rollenDna = localStorage.getItem("rollenDnaState");
        if (rollenDna) {
          const dna = JSON.parse(rollenDna);
          if (dna.beruf) stammdaten.beruf = dna.beruf;
          if (dna.fuehrung) stammdaten.fuehrung = dna.fuehrung;
          if (dna.taetigkeiten) stammdaten.taetigkeiten = dna.taetigkeiten.join(", ");
          if (dna.bereich) stammdaten.bereich = dna.bereich;
          if (dna.spiegel) stammdaten.profilSpiegel = JSON.stringify(dna.spiegel);
        }
        const jobcheckResult = localStorage.getItem("jobcheckLastResult");
        if (jobcheckResult) {
          const jc = JSON.parse(jobcheckResult);
          if (jc.fitStatus) stammdaten.jobcheckFit = jc.fitStatus;
          if (jc.controlIntensity) stammdaten.jobcheckSteuerung = jc.controlIntensity;
        }
        const teamState = localStorage.getItem("teamdynamikState");
        if (teamState) {
          const ts = JSON.parse(teamState);
          if (ts.teamName) stammdaten.teamName = ts.teamName;
          if (ts.teamProfile) stammdaten.teamProfil = JSON.stringify(ts.teamProfile);
          if (ts.personProfile) stammdaten.personProfil = JSON.stringify(ts.personProfile);
        }
      } catch {}

      const hasStammdaten = !user?.coachOnly && Object.keys(stammdaten).length > 0;
      const body = JSON.stringify({
        messages: chatHistory,
        ...(hasStammdaten ? { stammdaten } : {}),
        region,
        ...(capturedImage ? { uploadedImage: capturedImage.base64, uploadedImageMime: capturedImage.mimeType } : {}),
        ...(capturedDoc ? { uploadedDocumentText: capturedDoc.text, uploadedDocumentName: capturedDoc.name } : {}),
      });

      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 300000);

      const res = await fetch("/api/ki-coach?stream=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });

      if (!res.ok) {
        clearTimeout(timeout);
        if (res.status === 429) {
          let detail = "";
          try { const errData = await res.json(); detail = errData.error || ""; } catch {}
          throw new Error("LIMIT_REACHED:" + detail);
        }
        if (res.status === 503) {
          try { const errData = await res.json(); if (errData?.reason === "overloaded") throw new Error("OVERLOADED"); } catch (e: any) {
            if (e?.message === "OVERLOADED") throw e;
          }
          throw new Error("OVERLOADED");
        }
        throw new Error("Fehler");
      }

      if (res.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let streamedText = "";
        let streamedImage: string | undefined;
        let streamedOverlayTitle: string | undefined;
        let streamedOverlaySubtitle: string | undefined;
        let buffer = "";

        let streamingStarted = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "status") {
                setLoadingStatus(event.message || "");
              } else if (event.type === "text") {
                if (!streamingStarted) {
                  streamingStarted = true;
                  setMessages(prev => [...prev, { role: "assistant", content: "" }]);
                  setLoading(false);
                  setLoadingStatus("");
                }
                streamedText += event.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], content: streamedText };
                  return updated;
                });
              } else if (event.type === "image") {
                if (!streamingStarted) {
                  streamingStarted = true;
                  setMessages(prev => [...prev, { role: "assistant", content: "" }]);
                  setLoading(false);
                  setLoadingStatus("");
                }
                streamedImage = `data:image/png;base64,${event.image}`;
                streamedOverlayTitle = event.overlayTitle;
                streamedOverlaySubtitle = event.overlaySubtitle;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], image: streamedImage, overlayTitle: streamedOverlayTitle, overlaySubtitle: streamedOverlaySubtitle };
                  return updated;
                });
              } else if (event.type === "error") {
                const reason: "overloaded" | "tech" = event.reason === "overloaded" ? "overloaded" : "tech";
                const errMsg: string = event.message || (reason === "overloaded"
                  ? ui.coach.errorOverloaded
                  : ui.coach.errorTech);
                setMessages(prev => {
                  const updated = [...prev];
                  if (streamingStarted && updated[updated.length - 1]?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: errMsg,
                      errorReason: reason,
                      retryQuestion: text,
                    };
                  } else {
                    updated.push({ role: "assistant", content: errMsg, errorReason: reason, retryQuestion: text });
                  }
                  return updated;
                });
                streamingStarted = true;
                setLoading(false);
                setLoadingStatus("");
              } else if (event.type === "done") {
                break;
              }
            } catch {}
          }
        }
      } else {
        const data = await res.json();
        const assistantMsg: Message = { role: "assistant", content: data.reply };
        if (data.image) assistantMsg.image = `data:image/png;base64,${data.image}`;
        if (data.overlayTitle) assistantMsg.overlayTitle = data.overlayTitle;
        if (data.overlaySubtitle) assistantMsg.overlaySubtitle = data.overlaySubtitle;
        setMessages(prev => [...prev, assistantMsg]);
      }
      clearTimeout(timeout);
    } catch (err: any) {
      clearTimeout(timeout);
      const isTimeout = err?.name === "AbortError";
      const isLimit = err?.message?.startsWith("LIMIT_REACHED:");
      const isOverloaded = err?.message === "OVERLOADED";
      let errorContent: string;
      let errorReason: "overloaded" | "tech" | undefined;
      if (isLimit) {
        errorContent = ui.coach.errorQuota;
      } else if (isTimeout) {
        errorContent = ui.coach.errorTimeout;
        errorReason = "tech";
      } else if (isOverloaded) {
        errorContent = ui.coach.errorOverloaded;
        errorReason = "overloaded";
      } else {
        errorContent = ui.coach.errorTech;
        errorReason = "tech";
      }
      setMessages(prev => [...prev, {
        role: "assistant",
        content: errorContent,
        ...(errorReason ? { errorReason, retryQuestion: text } : {}),
      }]);
    } finally {
      setLoading(false);
      setLoadingStatus("");

      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages, isListening, region]);

  const setFeedback = useCallback((index: number, value: "up" | "down") => {
    setMessages(prev => {
      const updated = prev.map((msg, i) => i === index ? { ...msg, feedback: msg.feedback === value ? undefined : value } : msg);
      const msg = updated[index];
      if (msg && msg.feedback === value) {
        const userMsg = [...updated].slice(0, index).reverse().find(m => m.role === "user");
        fetch("/api/coach-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: userMsg?.content || "",
            assistantMessage: msg.content,
            feedbackType: value,
          }),
        }).catch(() => {});
      }
      return updated;
    });
  }, []);

  const sendQuickReply = useCallback((text: string) => {
    if (loading) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const chatHistory = newMessages
      .filter(m => !isWelcomeMsg(m))
      .map(m => ({ role: m.role, content: stripButtonMarker(m.content) }));

    (async () => {
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const stammdaten: Record<string, string> = {};
        try {
          const analyseRaw = localStorage.getItem("analyseTexte");
          if (analyseRaw) {
            const a = JSON.parse(analyseRaw);
            if (a.bereich1) stammdaten.impulsiveDaten = a.bereich1;
            if (a.bereich2) stammdaten.intuitiveDaten = a.bereich2;
            if (a.bereich3) stammdaten.analytischeDaten = a.bereich3;
          }
          const bioCheckIntro = localStorage.getItem("bioCheckIntroOverride");
          if (bioCheckIntro) stammdaten.bioCheckIntro = JSON.parse(bioCheckIntro);
          const bioCheckText = localStorage.getItem("bioCheckTextOverride") || localStorage.getItem("bioCheckTextGenerated");
          if (bioCheckText) stammdaten.bioCheckText = JSON.parse(bioCheckText);
          const rollenDna = localStorage.getItem("rollenDnaState");
          if (rollenDna) {
            const dna = JSON.parse(rollenDna);
            if (dna.beruf) stammdaten.beruf = dna.beruf;
            if (dna.fuehrung) stammdaten.fuehrung = dna.fuehrung;
            if (dna.taetigkeiten) stammdaten.taetigkeiten = dna.taetigkeiten.join(", ");
            if (dna.bereich) stammdaten.bereich = dna.bereich;
            if (dna.spiegel) stammdaten.profilSpiegel = JSON.stringify(dna.spiegel);
          }
          const jobcheckResult = localStorage.getItem("jobcheckLastResult");
          if (jobcheckResult) {
            const jc = JSON.parse(jobcheckResult);
            if (jc.fitStatus) stammdaten.jobcheckFit = jc.fitStatus;
            if (jc.controlIntensity) stammdaten.jobcheckSteuerung = jc.controlIntensity;
          }
          const teamState = localStorage.getItem("teamdynamikState");
          if (teamState) {
            const ts = JSON.parse(teamState);
            if (ts.teamName) stammdaten.teamName = ts.teamName;
            if (ts.teamProfile) stammdaten.teamProfil = JSON.stringify(ts.teamProfile);
            if (ts.personProfile) stammdaten.personProfil = JSON.stringify(ts.personProfile);
          }
        } catch {}

        const hasStammdaten = !user?.coachOnly && Object.keys(stammdaten).length > 0;
        const body = JSON.stringify({ messages: chatHistory, ...(hasStammdaten ? { stammdaten } : {}), region });

        const controller = new AbortController();
        timeout = setTimeout(() => controller.abort(), 300000);

        const res = await fetch("/api/ki-coach?stream=1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: controller.signal,
        });

        if (!res.ok) {
        clearTimeout(timeout);
        if (res.status === 429) {
          let detail = "";
          try { const errData = await res.json(); detail = errData.error || ""; } catch {}
          throw new Error("LIMIT_REACHED:" + detail);
        }
        if (res.status === 503) {
          try { const errData = await res.json(); if (errData?.reason === "overloaded") throw new Error("OVERLOADED"); } catch (e: any) {
            if (e?.message === "OVERLOADED") throw e;
          }
          throw new Error("OVERLOADED");
        }
        throw new Error("Fehler");
      }

        if (res.headers.get("content-type")?.includes("text/event-stream")) {
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let streamedText = "";
          let buffer = "";
          let streamingStarted = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === "status") {
                  setLoadingStatus(event.message || "");
                } else if (event.type === "text") {
                  if (!streamingStarted) {
                    streamingStarted = true;
                    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
                    setLoading(false);
                    setLoadingStatus("");
                  }
                  streamedText += event.text;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...updated[updated.length - 1], content: streamedText };
                    return updated;
                  });
                } else if (event.type === "image") {
                  if (!streamingStarted) {
                    streamingStarted = true;
                    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
                    setLoading(false);
                    setLoadingStatus("");
                  }
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      image: `data:image/png;base64,${event.image}`,
                      overlayTitle: event.overlayTitle,
                      overlaySubtitle: event.overlaySubtitle,
                    };
                    return updated;
                  });
                } else if (event.type === "error") {
                  const reason: "overloaded" | "tech" = event.reason === "overloaded" ? "overloaded" : "tech";
                  const errMsg: string = event.message || (reason === "overloaded"
                    ? ui.coach.errorOverloaded
                    : ui.coach.errorTech);
                  setMessages(prev => {
                    const updated = [...prev];
                    if (streamingStarted && updated[updated.length - 1]?.role === "assistant") {
                      updated[updated.length - 1] = {
                        ...updated[updated.length - 1],
                        content: errMsg,
                        errorReason: reason,
                        retryQuestion: text,
                      };
                    } else {
                      updated.push({ role: "assistant", content: errMsg, errorReason: reason, retryQuestion: text });
                    }
                    return updated;
                  });
                  streamingStarted = true;
                  setLoading(false);
                  setLoadingStatus("");
                } else if (event.type === "done") {
                  break;
                }
              } catch {}
            }
          }
        } else {
          const data = await res.json();
          const assistantMsg: Message = { role: "assistant", content: data.reply };
          if (data.image) assistantMsg.image = `data:image/png;base64,${data.image}`;
          if (data.overlayTitle) assistantMsg.overlayTitle = data.overlayTitle;
          if (data.overlaySubtitle) assistantMsg.overlaySubtitle = data.overlaySubtitle;
          setMessages(prev => [...prev, assistantMsg]);
        }
        clearTimeout(timeout);
      } catch (err: any) {
        clearTimeout(timeout);
        const isTimeout = err?.name === "AbortError";
        const isLimit = err?.message?.startsWith("LIMIT_REACHED:");
        const isOverloaded = err?.message === "OVERLOADED";
        let errorContent: string;
        let errorReason: "overloaded" | "tech" | undefined;
        if (isLimit) {
          errorContent = ui.coach.errorQuota;
        } else if (isTimeout) {
          errorContent = ui.coach.errorTimeoutShort;
          errorReason = "tech";
        } else if (isOverloaded) {
          errorContent = ui.coach.errorOverloaded;
          errorReason = "overloaded";
        } else {
          errorContent = ui.coach.errorTech;
          errorReason = "tech";
        }
        setMessages(prev => [...prev, {
          role: "assistant",
          content: errorContent,
          ...(errorReason ? { errorReason, retryQuestion: text } : {}),
        }]);
      } finally {
        setLoading(false);
        setLoadingStatus("");
      }
    })();
  }, [loading, messages, region]);

  const stripButtonMarker = useCallback((content: string): string => {
    return content
      .replace(/\s*<<BUTTONS:[\s\S]*?>>\s*$/, "")
      .replace(/\s*<<BUTTONS:[\s\S]*$/, "")
      .replace(/\s*<<FOLLOWUPS:[\s\S]*?>>\s*$/, "")
      .replace(/\s*<<FOLLOWUPS:[\s\S]*$/, "")
      .trim();
  }, []);

  const parseMarkersFromContent = useCallback((content: string): { cleanContent: string; buttons: string[]; followups: string[] } => {
    const parseList = (raw: string): string[] => raw
      .replace(/\n/g, " ")
      .split("|")
      .map(b => b.trim().replace(/^[\u201E\u201C\u201D""„]/g, "").replace(/[\u201E\u201C\u201D""„]$/g, "").trim())
      .filter(b => b.length > 0);

    let clean = content;
    let buttons: string[] = [];
    let followups: string[] = [];

    const buttonMatch = clean.match(/<<BUTTONS:\s*([\s\S]+?)>>\s*/);
    if (buttonMatch) {
      buttons = parseList(buttonMatch[1]).filter(b => b.length <= 50).slice(0, 4);
      clean = clean.replace(/\s*<<BUTTONS:[\s\S]+?>>\s*/g, " ").trim();
    } else if (/<<BUTTONS:/.test(clean)) {
      clean = clean.replace(/\s*<<BUTTONS:[\s\S]*$/, "").trim();
    }

    const followupMatch = clean.match(/<<FOLLOWUPS:\s*([\s\S]+?)>>\s*/);
    if (followupMatch) {
      followups = parseList(followupMatch[1]).filter(b => b.length <= 90).slice(0, 3);
      clean = clean.replace(/\s*<<FOLLOWUPS:[\s\S]+?>>\s*/g, " ").trim();
    } else if (/<<FOLLOWUPS:/.test(clean)) {
      clean = clean.replace(/\s*<<FOLLOWUPS:[\s\S]*$/, "").trim();
    }

    return { cleanContent: clean, buttons, followups };
  }, []);

  const parseButtonsFromContent = useCallback((content: string): { cleanContent: string; buttons: string[] } => {
    const { cleanContent, buttons } = parseMarkersFromContent(content);
    return { cleanContent, buttons };
  }, [parseMarkersFromContent]);

  const extractQuickReplies = useCallback((content: string, msgIndex: number, totalMessages: number, _hasImage?: boolean): string[] => {
    const isLastAssistant = msgIndex === totalMessages - 1;
    if (!isLastAssistant || loading) return [];
    const { buttons } = parseMarkersFromContent(content);
    return buttons;
  }, [parseMarkersFromContent, loading]);

  const extractFollowups = useCallback((content: string, msgIndex: number, totalMessages: number): string[] => {
    const isLastAssistant = msgIndex === totalMessages - 1;
    if (!isLastAssistant || loading) return [];
    const { buttons, followups } = parseMarkersFromContent(content);
    if (buttons.length > 0) return [];
    return followups;
  }, [parseMarkersFromContent, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exportChat = () => {
    const chatMessages = messages.filter(m => !isWelcomeMsg(m));
    if (chatMessages.length === 0) return;
    const now = new Date();
    const locale = region === "EN" ? "en-GB" : region === "FR" ? "fr-FR" : "de-DE";
    const dateStr = now.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    let text = `${ui.coach.exportHeader}\n`;
    text += `${ui.coach.exportedAt(dateStr, timeStr)}\n`;
    text += `${"─".repeat(50)}\n\n`;
    for (const msg of chatMessages) {
      const label = msg.role === "user" ? ui.coach.exportLabelQuestion : ui.coach.exportLabelCoach;
      text += `${label}:\n${parseButtonsFromContent(msg.content).cleanContent}\n`;
      if (msg.image) {
        text += `${ui.coach.aiImageNote}\n`;
      }
      text += `\n`;
    }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bioLogic-Coach_${now.toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-gradient-bg" style={{ display: "flex", flexDirection: "column" }} lang={region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>
      <GlobalNav />

      {historyOpen && (
        <>
          <div
            onClick={() => setHistoryOpen(false)}
            data-testid="history-backdrop"
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
              zIndex: 9998, animation: "fadeIn 200ms ease",
            }}
          />
          <div
            data-testid="history-drawer"
            style={{
              position: "fixed", top: 0, left: 0, bottom: 0,
              width: isMobile ? "85vw" : 360,
              maxWidth: "100vw",
              background: "#fff", zIndex: 9999,
              boxShadow: "4px 0 30px rgba(0,0,0,0.15)",
              display: "flex", flexDirection: "column",
              animation: "slideInLeft 250ms cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            <div style={{
              padding: "16px 18px 12px", borderBottom: "1px solid rgba(0,0,0,0.08)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>{ui.coach.historyTitle}</div>
              <button
                onClick={() => setHistoryOpen(false)}
                data-testid="button-close-history"
                style={{
                  width: 30, height: 30, borderRadius: 8, border: "none",
                  background: "rgba(0,0,0,0.04)", display: "flex",
                  alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}
              >
                <X style={{ width: 16, height: 16, color: "#86868B" }} />
              </button>
            </div>
            <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={startNewConversation}
                data-testid="button-new-conv-drawer"
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #34C759 0%, #30B350 100%)",
                  color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(52,199,89,0.25)",
                  transition: "all 200ms ease",
                }}
              >
                <Plus style={{ width: 16, height: 16 }} /> {ui.coach.newConvButton}
              </button>
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#AEAEB2" }} />
                <input
                  type="text"
                  placeholder={ui.coach.historySearchPlaceholder}
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  data-testid="input-history-search"
                  style={{
                    width: "100%", padding: "8px 10px 8px 32px",
                    borderRadius: 10, border: "1px solid rgba(0,0,0,0.10)",
                    fontSize: 13, background: "rgba(0,0,0,0.02)", outline: "none",
                  }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 16px" }}>
              {(() => {
                const term = historySearch.trim().toLowerCase();
                const filtered = term
                  ? conversations.filter(c => c.title.toLowerCase().includes(term))
                  : conversations;
                if (filtered.length === 0) {
                  return (
                    <div style={{ padding: "30px 18px", textAlign: "center", color: "#AEAEB2", fontSize: 13 }}>
                      {term ? ui.coach.noHits : ui.coach.noConversations}
                    </div>
                  );
                }
                return filtered.map(conv => {
                  const isActive = conv.id === currentConversationId;
                  const isRenaming = renamingId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      data-testid={`conv-item-${conv.id}`}
                      style={{
                        padding: "10px 12px", borderRadius: 10, marginBottom: 4,
                        background: isActive ? "rgba(0,113,227,0.08)" : "transparent",
                        border: isActive ? "1px solid rgba(0,113,227,0.20)" : "1px solid transparent",
                        cursor: isRenaming ? "default" : "pointer",
                        transition: "all 150ms ease",
                        display: "flex", alignItems: "flex-start", gap: 8,
                      }}
                      onMouseEnter={e => { if (!isActive && !isRenaming) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                      onMouseLeave={e => { if (!isActive && !isRenaming) e.currentTarget.style.background = "transparent"; }}
                      onClick={() => { if (!isRenaming) loadConversation(conv.id); }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isRenaming ? (
                          <input
                            autoFocus
                            value={renamingValue}
                            onChange={e => setRenamingValue(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            onBlur={() => renameConversation(conv.id, renamingValue)}
                            onKeyDown={e => {
                              if (e.key === "Enter") renameConversation(conv.id, renamingValue);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            data-testid={`input-rename-${conv.id}`}
                            style={{
                              width: "100%", padding: "4px 6px", borderRadius: 6,
                              border: "1px solid rgba(0,113,227,0.4)", fontSize: 13,
                              outline: "none", background: "#fff",
                            }}
                          />
                        ) : (
                          <div style={{
                            fontSize: 13, fontWeight: isActive ? 600 : 500,
                            color: isActive ? "#0071E3" : "#1D1D1F",
                            display: "flex", alignItems: "center", gap: 6,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {conv.pinned && <Pin style={{ width: 11, height: 11, color: "#FF9500", flexShrink: 0, transform: "rotate(45deg)" }} />}
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{conv.title}</span>
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: "#AEAEB2", marginTop: 2 }}>
                          {formatRelativeTime(conv.updatedAt)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 2, flexShrink: 0, opacity: 0.7 }}>
                        <button
                          onClick={e => { e.stopPropagation(); setRenamingId(conv.id); setRenamingValue(conv.title); }}
                          data-testid={`button-rename-${conv.id}`}
                          title={ui.coach.renameTitle}
                          style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Pencil style={{ width: 12, height: 12, color: "#86868B" }} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); togglePinConversation(conv.id, conv.pinned); }}
                          data-testid={`button-pin-${conv.id}`}
                          title={conv.pinned ? ui.coach.unpinTitle : ui.coach.pinTitle}
                          style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          {conv.pinned
                            ? <PinOff style={{ width: 12, height: 12, color: "#FF9500" }} />
                            : <Pin style={{ width: 12, height: 12, color: "#86868B" }} />}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                          data-testid={`button-delete-${conv.id}`}
                          title={ui.coach.deleteTitle}
                          style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Trash2 style={{ width: 12, height: 12, color: "#FF3B30" }} />
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}

      <div style={{ position: "fixed", top: isMobile ? 48 : 56, left: 0, right: 0, zIndex: 8999 }}>
        <div className="dark:!bg-background" style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: isMobile ? "4px 0 6px" : "5px 0 10px", minHeight: isMobile ? 48 : 62 }}>
          <div className="w-full mx-auto" style={{ maxWidth: 1100, padding: isMobile ? "0 12px" : "0 24px" }}>
            <div className="text-center">
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#34C759" }} data-testid="text-page-title">{ui.coach.pageTitle}</h1>
              <p style={{ fontSize: 14, color: "#48484A", fontWeight: 450, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ui.coach.pageSubtitle}</p>
            </div>
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          padding: isMobile ? "8px 12px" : "10px 24px",
        }}>
          <div className="w-full mx-auto" style={{
            maxWidth: 1100,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div>
              {!user?.coachOnly && hasAnalysisData() && (
                <span data-testid="badge-context-active" style={{
                  fontSize: 10, fontWeight: 600, color: "#34C759",
                  background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.25)",
                  borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap",
                }}>{ui.coach.profileActive}</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => { loadConversations(); setHistoryOpen(true); }}
                data-testid="button-open-history"
                title={ui.coach.historyButtonTitle}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: "none",
                  background: "rgba(0,113,227,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 200ms ease",
                  position: "relative",
                }}
              >
                <History style={{ width: 16, height: 16, color: "#0071E3" }} />
                {conversations.length > 0 && (
                  <span style={{
                    position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, padding: "0 4px",
                    borderRadius: 8, background: "#0071E3", color: "#fff", fontSize: 10, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #fff",
                  }}>{conversations.length > 99 ? "99+" : conversations.length}</span>
                )}
              </button>
              <button
                onClick={startNewConversation}
                data-testid="button-new-conversation"
                title={ui.coach.newConvTitle}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: "none",
                  background: "rgba(52,199,89,0.10)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 200ms ease",
                }}
              >
                <Plus style={{ width: 16, height: 16, color: "#34C759" }} />
              </button>
              <button
                onClick={exportChat}
                disabled={messages.filter(m => !isWelcomeMsg(m)).length === 0}
                data-testid="button-export-chat"
                title={ui.coach.exportTitle}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: "none",
                  background: messages.filter(m => !isWelcomeMsg(m)).length > 0 ? "rgba(0,113,227,0.08)" : "rgba(0,0,0,0.03)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: messages.filter(m => !isWelcomeMsg(m)).length > 0 ? "pointer" : "default",
                  transition: "all 200ms ease",
                }}
              >
                <Download style={{
                  width: 16, height: 16,
                  color: messages.filter(m => !isWelcomeMsg(m)).length > 0 ? "#0071E3" : "#C7C7CC",
                }} />
              </button>
              <button
                onClick={() => {
                  const hasChat = messages.filter(m => !isWelcomeMsg(m)).length > 0;
                  if (!hasChat) return;
                  if (!window.confirm(ui.coach.clearChatConfirm)) return;
                  setMessages([getWelcomeMsg(region)]);
                  try { localStorage.removeItem(LOUIS_STORAGE_KEY); } catch {}
                }}
                disabled={messages.filter(m => !isWelcomeMsg(m)).length === 0}
                data-testid="button-clear-chat"
                title={ui.coach.clearChatTitle}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: "none",
                  background: messages.filter(m => !isWelcomeMsg(m)).length > 0 ? "rgba(255,59,48,0.08)" : "rgba(0,0,0,0.03)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: messages.filter(m => !isWelcomeMsg(m)).length > 0 ? "pointer" : "default",
                  transition: "all 200ms ease",
                }}
              >
                <Trash2 style={{
                  width: 16, height: 16,
                  color: messages.filter(m => !isWelcomeMsg(m)).length > 0 ? "#FF3B30" : "#C7C7CC",
                }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: 1100, width: "100%", margin: "0 auto", paddingTop: isMobile ? 165 : 195, paddingLeft: isMobile ? 6 : 16, paddingRight: isMobile ? 6 : 16, paddingBottom: isMobile ? 80 : 24, display: "flex", flexDirection: "column" }}>
        <div style={{
          background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: 20, flex: 1, display: "flex", flexDirection: "column",
          boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
          border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden",
          minHeight: "calc(100vh - 280px)",
        }}>
          {(() => {
            const searchTerm = promptSearch.trim().toLowerCase();
            const isSearching = searchTerm.length > 0;

            const highlightMatch = (text: string) => {
              if (!isSearching) return t(text);
              const localized = t(text);
              const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              const parts = localized.split(new RegExp(`(${escaped})`, "gi"));
              if (parts.length === 1) return localized;
              return <>{parts.map((part, i) => part.toLowerCase() === searchTerm ? <mark key={i} style={{ background: "rgba(0,113,227,0.15)", color: "#0071E3", borderRadius: 2, padding: "0 1px" }}>{part}</mark> : part)}</>;
            };

            const matchesSearch = (text: string) => {
              return t(text).toLowerCase().includes(searchTerm) || text.toLowerCase().includes(searchTerm);
            };

            const allPrompts = isSearching ? EXAMPLE_PROMPTS.filter(cat => !(cat.requiresAnalysis && (user?.coachOnly || !hasAnalysisData()))).flatMap(cat => {
              const catMatch = cat.category.toLowerCase().includes(searchTerm);
              const matching = cat.prompts.filter(p => matchesSearch(p));
              if (catMatch) return cat.prompts.map(p => ({ prompt: p, category: cat.category }));
              return matching.map(p => ({ prompt: p, category: cat.category }));
            }) : [];

            return (<>
            <div style={{
              padding: isMobile ? "10px 10px 0" : "14px 28px 0",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 14, color: "#48484A", margin: 0, fontWeight: 600, lineHeight: 1.65 }} data-testid="text-input-desc">{ui.coach.inputDesc}</p>
            </div>

            <div style={{ padding: isMobile ? "8px 10px 0" : "8px 28px 0" }}>
              <button
                type="button"
                onClick={() => setShowTips(v => !v)}
                data-testid="button-coach-tips"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 12.5, fontWeight: 600, color: showTips ? "#0071E3" : "#6B7280",
                  background: showTips ? "rgba(0,113,227,0.07)" : "rgba(0,0,0,0.04)",
                  border: "none", borderRadius: 8, padding: "5px 12px",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 14 }}>💡</span>
                {ui.coach.tipsTitle}
                {showTips
                  ? <ChevronUp style={{ width: 12, height: 12 }} />
                  : <ChevronDown style={{ width: 12, height: 12 }} />}
              </button>

              {showTips && (
                <div
                  data-testid="panel-coach-tips"
                  style={{
                    marginTop: 8, borderRadius: 12,
                    background: "rgba(0,113,227,0.04)",
                    border: "1px solid rgba(0,113,227,0.10)",
                    padding: "12px 16px",
                    display: "flex", flexDirection: "column", gap: 8,
                  }}
                >
                  {[...ui.coach.tips].map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{
                        flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
                        background: "rgba(0,113,227,0.12)", color: "#0071E3",
                        fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                        marginTop: 1,
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.55 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{
              padding: isMobile ? "12px 10px 0" : "12px 28px 0",
              borderBottom: isSearching && allPrompts.length > 0 ? "1px solid rgba(0,0,0,0.06)" : "none",
              position: "relative",
            }} data-testid="card-prompt-search">
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#8E8E93", pointerEvents: "none" }} />
                  <input
                    type="text"
                    value={promptSearch}
                    onChange={e => setPromptSearch(e.target.value)}
                    placeholder={ui.coach.promptSearchPlaceholder}
                    data-testid="input-prompt-search"
                    style={{
                      width: "100%", padding: "10px 36px 10px 36px",
                      border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12,
                      fontSize: 13, color: "#1D1D1F", background: "rgba(255, 248, 225, 0.5)",
                      outline: "none", boxSizing: "border-box",
                      transition: "border-color 200ms ease",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,113,227,0.4)"; e.currentTarget.style.background = "#FFFFFF"; }}
                    onBlur={e => { setTimeout(() => { e.target.style.borderColor = "rgba(0,0,0,0.08)"; e.target.style.background = "rgba(255, 248, 225, 0.5)"; }, 200); }}
                  />
                  {promptSearch && (
                    <button
                      onClick={() => setPromptSearch("")}
                      data-testid="button-clear-prompt-search"
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
                    >
                      <X style={{ width: 11, height: 11, color: "#8E8E93" }} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => { setShowPrompts(v => !v); if (showPrompts) setExpandedCategory(null); }}
                  data-testid="button-example-prompts"
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: "linear-gradient(135deg, #0071E3, #34AADC)",
                    border: "none",
                    borderRadius: 12, padding: "10px 20px",
                    cursor: "pointer", fontSize: 13, color: "#FFFFFF",
                    fontWeight: 600, transition: "all 200ms ease",
                    boxShadow: "0 4px 12px rgba(0,113,227,0.25)",
                    flexShrink: 0, whiteSpace: "nowrap",
                  }}
                >
                  <Lightbulb style={{ width: 15, height: 15 }} />
                  {ui.coach.examplePromptsBtn}
                  {showPrompts
                    ? <ChevronUp style={{ width: 12, height: 12 }} />
                    : <ChevronDown style={{ width: 12, height: 12 }} />
                  }
                </button>
              </div>

              {isSearching && (
                <div style={{
                  marginTop: 8, maxHeight: 260, overflowY: "auto",
                  borderRadius: 12, background: "rgba(248,250,252,0.98)",
                  border: allPrompts.length > 0 ? "1px solid rgba(0,0,0,0.06)" : "none",
                  padding: allPrompts.length > 0 ? 6 : 0,
                }}>
                  {allPrompts.length === 0 && (
                    <p style={{ fontSize: 13, color: "#8E8E93", textAlign: "center", padding: "12px 0" }} data-testid="text-no-prompt-results">{ui.coach.noPromptResults(promptSearch)}</p>
                  )}
                  {allPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(item.prompt);
                        setPromptSearch("");
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      data-testid={`search-result-${idx}`}
                      style={{
                        width: "100%", textAlign: "left", padding: "8px 12px",
                        border: "none", borderRadius: 8, cursor: "pointer",
                        background: "transparent",
                        fontSize: 12.5, lineHeight: 1.5, color: "#3A3A3C",
                        transition: "all 150ms ease",
                        display: "block",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,113,227,0.06)"; e.currentTarget.style.color = "#0071E3"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#3A3A3C"; }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#34C759", letterSpacing: "0.02em" }}>{item.category}</span>
                      <br />
                      {highlightMatch(item.prompt)}
                    </button>
                  ))}
                </div>
              )}

              {showPrompts && (
                <div style={{
                  marginTop: 8, maxHeight: 320, overflowY: "auto",
                  borderRadius: 12, background: "rgba(248,250,252,0.98)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  padding: 6,
                }} data-testid="panel-example-prompts">
                  {EXAMPLE_PROMPTS.map((cat) => {
                    const isDisabled = cat.requiresAnalysis && (user?.coachOnly || !hasAnalysisData());
                    return (
                    <div key={cat.category} style={{ marginBottom: 4 }}>
                      <button
                        onClick={() => !isDisabled && setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                        data-testid={`category-${cat.category.replace(/\s+/g, "-").toLowerCase()}`}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 12px", border: "none",
                          cursor: isDisabled ? "default" : "pointer",
                          opacity: isDisabled ? 0.4 : 1,
                          background: expandedCategory === cat.category ? "rgba(0,113,227,0.06)" : "transparent",
                          borderRadius: 10, fontSize: 13, fontWeight: 600,
                          color: expandedCategory === cat.category ? "#0071E3" : "#1D1D1F",
                          transition: "all 150ms ease",
                        }}
                        title={isDisabled ? ui.coach.requireAnalysisTitle : undefined}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {cat.category}
                          {isDisabled && <span style={{ fontSize: 11, fontWeight: 400, color: "#8E8E93" }}>{ui.coach.roleRequired}</span>}
                        </span>
                        {expandedCategory === cat.category
                          ? <ChevronUp style={{ width: 14, height: 14, color: "#8E8E93" }} />
                          : <ChevronDown style={{ width: 14, height: 14, color: "#C7C7CC" }} />
                        }
                      </button>
                      {expandedCategory === cat.category && !isDisabled && (
                        <div style={{ padding: "4px 0 8px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
                          {cat.prompts.map((prompt, pi) => (
                            <button
                              key={pi}
                              onClick={() => {
                                setInput(prompt);
                                setShowPrompts(false);
                                setExpandedCategory(null);
                                setTimeout(() => inputRef.current?.focus(), 50);
                              }}
                              data-testid={`prompt-${cat.category.replace(/\s+/g, "-").toLowerCase()}-${pi}`}
                              style={{
                                textAlign: "left", padding: "8px 12px",
                                border: "1px solid rgba(0,0,0,0.05)",
                                borderRadius: 10, cursor: "pointer",
                                background: "rgba(255,255,255,0.8)",
                                fontSize: 12.5, lineHeight: 1.5, color: "#3A3A3C",
                                transition: "all 150ms ease",
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = "rgba(0,113,227,0.06)";
                                e.currentTarget.style.borderColor = "rgba(0,113,227,0.15)";
                                e.currentTarget.style.color = "#0071E3";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.8)";
                                e.currentTarget.style.borderColor = "rgba(0,0,0,0.05)";
                                e.currentTarget.style.color = "#3A3A3C";
                              }}
                            >
                              {t(prompt)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
            </>);
          })()}

          <div style={{ padding: isMobile ? "0 20px" : "0 60px", margin: "18px 0 12px" }}>
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.08) 70%, transparent 100%)" }} />
          </div>

          <div style={{
            flex: 1, overflowY: "auto", padding: isMobile ? "12px 10px" : "20px 28px",
            display: "flex", flexDirection: "column", gap: 16,
          }} data-testid="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex", gap: 12,
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                alignItems: "flex-start",
              }} data-testid={`message-${msg.role}-${i}`}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: msg.role === "user" ? "rgba(0,0,0,0.06)" : "rgba(0,113,227,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {msg.role === "user"
                    ? <User style={{ width: 15, height: 15, color: "#6E6E73" }} />
                    : <Bot style={{ width: 15, height: 15, color: "#0071E3" }} />
                  }
                </div>
                <div style={{ maxWidth: isMobile ? "88%" : "75%", display: "flex", flexDirection: "column" }}>
                <div className={msg.role === "user" ? "louis-user-bubble" : undefined} style={{
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #0071E3, #34AADC)"
                    : "rgba(0,0,0,0.04)",
                  color: msg.role === "user" ? "#FFFFFF" : "#1D1D1F",
                  fontSize: 14, lineHeight: 1.6,
                }}>
                  {formatMessage(parseButtonsFromContent(isWelcomeMsg(msg) ? ui.coach.welcome : msg.content).cleanContent)}
                  {msg.documentName && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 8px", fontSize: 11, color: msg.role === "user" ? "rgba(255,255,255,0.9)" : "#0071E3", maxWidth: "fit-content" }}>
                      <FileText style={{ width: 11, height: 11, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{msg.documentName}</span>
                    </div>
                  )}
                  {msg.image && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ position: "relative", display: "inline-block", maxWidth: 520, width: "100%" }}>
                        <img
                          src={msg.image}
                          alt="KI-generiertes Bild"
                          data-testid={`image-generated-${i}`}
                          style={{
                            width: "100%",
                            borderRadius: 12,
                            border: "1px solid rgba(0,0,0,0.08)",
                            display: "block",
                          }}
                        />
                        {msg.overlayTitle && (
                          <div
                            data-testid={`image-overlay-${i}`}
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              padding: "20px 24px 18px",
                              borderRadius: "0 0 12px 12px",
                              background: "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
                            }}
                          >
                            <div style={{
                              color: "#FFFFFF",
                              fontSize: 18,
                              fontWeight: 700,
                              lineHeight: 1.3,
                              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                            }}>
                              {msg.overlayTitle}
                            </div>
                            {msg.overlaySubtitle && (
                              <div style={{
                                color: "rgba(255,255,255,0.9)",
                                fontSize: 13,
                                fontWeight: 500,
                                marginTop: 4,
                                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                              }}>
                                {msg.overlaySubtitle}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => {
                            if (msg.overlayTitle) {
                              const canvas = document.createElement("canvas");
                              const img = new Image();
                              img.onload = () => {
                                canvas.width = img.naturalWidth;
                                canvas.height = img.naturalHeight;
                                const ctx = canvas.getContext("2d")!;
                                ctx.drawImage(img, 0, 0);
                                const gradH = canvas.height * 0.35;
                                const grad = ctx.createLinearGradient(0, canvas.height - gradH, 0, canvas.height);
                                grad.addColorStop(0, "rgba(0,0,0,0)");
                                grad.addColorStop(0.4, "rgba(0,0,0,0.4)");
                                grad.addColorStop(1, "rgba(0,0,0,0.7)");
                                ctx.fillStyle = grad;
                                ctx.fillRect(0, canvas.height - gradH, canvas.width, gradH);
                                const titleSize = Math.max(28, Math.round(canvas.width * 0.03));
                                ctx.font = `bold ${titleSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
                                ctx.fillStyle = "#FFFFFF";
                                ctx.shadowColor = "rgba(0,0,0,0.5)";
                                ctx.shadowBlur = 6;
                                ctx.shadowOffsetY = 2;
                                const lines = msg.overlayTitle!.split("\n");
                                const lineHeight = titleSize * 1.35;
                                let yBase = canvas.height - 30;
                                if (msg.overlaySubtitle) yBase -= titleSize * 0.8;
                                yBase -= (lines.length - 1) * lineHeight;
                                lines.forEach((line, idx) => {
                                  ctx.fillText(line, 36, yBase + idx * lineHeight);
                                });
                                if (msg.overlaySubtitle) {
                                  const subSize = Math.max(18, Math.round(titleSize * 0.65));
                                  ctx.font = `500 ${subSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
                                  ctx.fillStyle = "rgba(255,255,255,0.9)";
                                  ctx.fillText(msg.overlaySubtitle, 36, yBase + lines.length * lineHeight + 4);
                                }
                                const a = document.createElement("a");
                                a.href = canvas.toDataURL("image/png");
                                a.download = `bioLogic-Stellenanzeige_${new Date().toISOString().slice(0, 10)}.png`;
                                a.click();
                              };
                              img.src = msg.image!;
                            } else {
                              const a = document.createElement("a");
                              a.href = msg.image!;
                              a.download = `bioLogic-Coach-Bild_${new Date().toISOString().slice(0, 10)}.png`;
                              a.click();
                            }
                          }}
                          data-testid={`button-download-image-${i}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 14px",
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,0.1)",
                            background: "rgba(255,255,255,0.9)",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#0071E3",
                            transition: "all 200ms ease",
                          }}
                        >
                          <Download style={{ width: 13, height: 13 }} />
                          {msg.overlayTitle ? ui.coach.imageWithText : ui.coach.imageDownload}
                        </button>
                        {msg.overlayTitle && (
                          <button
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = msg.image!;
                              a.download = `bioLogic-Bild-ohne-Text_${new Date().toISOString().slice(0, 10)}.png`;
                              a.click();
                            }}
                            data-testid={`button-download-raw-${i}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 14px",
                              borderRadius: 10,
                              border: "1px solid rgba(0,0,0,0.1)",
                              background: "rgba(255,255,255,0.9)",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#6E6E73",
                              transition: "all 200ms ease",
                            }}
                          >
                            <ImageIcon style={{ width: 13, height: 13 }} />
                            {ui.coach.imageOnly}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {msg.role === "assistant" && !isWelcomeMsg(msg) && msg.content && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6, paddingLeft: 4 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(parseButtonsFromContent(msg.content).cleanContent);
                          setCopiedIndex(i);
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                        data-testid={`copy-${i}`}
                        title={ui.coach.copyAnswer}
                        style={{
                          width: 28, height: 28, borderRadius: 8, border: "none",
                          background: copiedIndex === i ? "rgba(52,199,89,0.12)" : "rgba(0,0,0,0.03)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", transition: "all 200ms ease",
                        }}
                      >
                        {copiedIndex === i
                          ? <Check style={{ width: 13, height: 13, color: "#34C759" }} />
                          : <Copy style={{ width: 13, height: 13, color: "#AEAEB2" }} />
                        }
                      </button>
                      <button
                        onClick={() => setFeedback(i, "up")}
                        data-testid={`feedback-up-${i}`}
                        style={{
                          width: 28, height: 28, borderRadius: 8, border: "none",
                          background: msg.feedback === "up" ? "rgba(0,113,227,0.12)" : "rgba(0,0,0,0.03)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", transition: "all 200ms ease",
                        }}
                      >
                        <ThumbsUp style={{ width: 13, height: 13, color: msg.feedback === "up" ? "#0071E3" : "#AEAEB2" }} />
                      </button>
                      <button
                        onClick={() => setFeedback(i, "down")}
                        data-testid={`feedback-down-${i}`}
                        style={{
                          width: 28, height: 28, borderRadius: 8, border: "none",
                          background: msg.feedback === "down" ? "rgba(255,59,48,0.12)" : "rgba(0,0,0,0.03)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", transition: "all 200ms ease",
                        }}
                      >
                        <ThumbsDown style={{ width: 13, height: 13, color: msg.feedback === "down" ? "#FF3B30" : "#AEAEB2" }} />
                      </button>
                      {isAdmin && !msg.errorReason && (
                        <button
                          onClick={() => saveAsGolden(i)}
                          disabled={savingGoldenIndex === i || savedGoldenIndex.has(i)}
                          data-testid={`button-save-golden-${i}`}
                          title={savedGoldenIndex.has(i) ? ui.coach.goldenSaved : ui.coach.goldenSave}
                          style={{
                            width: 28, height: 28, borderRadius: 8, border: "none",
                            background: savedGoldenIndex.has(i) ? "rgba(255,179,0,0.18)" : "rgba(0,0,0,0.03)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: savedGoldenIndex.has(i) ? "default" : "pointer",
                            transition: "all 200ms ease",
                            opacity: savingGoldenIndex === i ? 0.5 : 1,
                          }}
                        >
                          {savedGoldenIndex.has(i)
                            ? <BookmarkCheck style={{ width: 13, height: 13, color: "#FFB300" }} />
                            : <Bookmark style={{ width: 13, height: 13, color: "#AEAEB2" }} />
                          }
                        </button>
                      )}
                    </div>
                    {!loading && msg.errorReason && msg.retryQuestion && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} data-testid={`retry-container-${i}`}>
                        <button
                          onClick={() => sendQuickReply(msg.retryQuestion!)}
                          data-testid={`button-retry-${i}`}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 18,
                            border: "1.5px solid rgba(0,113,227,0.25)",
                            background: "rgba(0,113,227,0.04)",
                            color: "#0071E3",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Nochmal versuchen
                        </button>
                      </div>
                    )}
                    {!loading && !msg.errorReason && (() => {
                      const replies = extractQuickReplies(msg.content, i, messages.length, !!msg.image);
                      if (replies.length === 0) return null;
                      return (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {replies.map((reply, ri) => (
                            <button
                              key={ri}
                              onClick={() => sendQuickReply(reply)}
                              data-testid={`quick-reply-${ri}`}
                              style={{
                                padding: "8px 16px",
                                borderRadius: 18,
                                border: "1.5px solid rgba(0,113,227,0.25)",
                                background: "rgba(0,113,227,0.04)",
                                color: "#0071E3",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 200ms ease",
                                textAlign: "left",
                                lineHeight: 1.4,
                                maxWidth: "100%",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,113,227,0.10)"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,113,227,0.04)"; }}
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                    {!loading && !msg.errorReason && (() => {
                      const followups = extractFollowups(msg.content, i, messages.length);
                      if (followups.length === 0) return null;
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                          <div style={{ fontSize: 11, color: "#86868B", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", paddingLeft: 2 }}>
                            {ui.coach.suggestionsLabel}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                            {followups.map((sug, si) => (
                              <button
                                key={si}
                                onClick={() => sendQuickReply(sug)}
                                data-testid={`followup-${si}`}
                                style={{
                                  padding: "7px 14px",
                                  borderRadius: 14,
                                  border: "1px dashed rgba(0,113,227,0.35)",
                                  background: "rgba(0,113,227,0.02)",
                                  color: "#0071E3",
                                  fontSize: 12.5,
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  transition: "all 200ms ease",
                                  textAlign: "left",
                                  lineHeight: 1.4,
                                  maxWidth: "100%",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,113,227,0.08)"; e.currentTarget.style.borderStyle = "solid"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,113,227,0.02)"; e.currentTarget.style.borderStyle = "dashed"; }}
                              >
                                → {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: "rgba(0,113,227,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bot style={{ width: 15, height: 15, color: "#0071E3" }} />
                </div>
                <div style={{
                  padding: "12px 16px", borderRadius: "18px 18px 18px 4px",
                  background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Loader2 style={{ width: 16, height: 16, color: "#8E8E93", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: 13, color: "#6E6E73" }} data-testid="text-loading">{loadingStatus || ui.coach.loadingDefault}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: isMobile ? "10px 10px 14px" : "16px 28px 20px",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            background: "rgba(255,255,255,0.5)",
          }}>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); e.target.value = ""; }}
              data-testid="input-image-upload"
            />
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.txt,.md,.docx,.xlsx,.csv,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleDocumentSelect(f); e.target.value = ""; }}
              data-testid="input-doc-upload"
            />

            {(pendingImage || pendingDoc || docLoading) && (
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                {pendingImage && (
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <img src={pendingImage.dataUrl} alt={ui.coach.attachmentAlt} style={{ height: 64, maxWidth: 120, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(0,0,0,0.1)" }} />
                    <button onClick={() => setPendingImage(null)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#FF3B30", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X style={{ width: 10, height: 10, color: "#fff" }} />
                    </button>
                  </div>
                )}
                {docLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,113,227,0.08)", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#0071E3" }}>
                    <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
                    {ui.coach.docReading}
                  </div>
                )}
                {pendingDoc && !docLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,113,227,0.08)", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#0071E3", maxWidth: 220 }}>
                    <FileText style={{ width: 12, height: 12, flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pendingDoc.name}</span>
                    <button onClick={() => setPendingDoc(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
                      <X style={{ width: 10, height: 10, color: "#0071E3" }} />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{
              display: "flex", gap: 10, alignItems: "flex-end",
              background: "rgba(255, 248, 225, 0.5)",
              borderRadius: 20, padding: "10px 12px 10px 18px",
              border: "1px solid rgba(0,0,0,0.06)",
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={ui.coach.inputPlaceholder}
                data-testid="input-chat"
                rows={1}
                style={{
                  flex: 1, border: "none", outline: "none", background: "none",
                  fontSize: 14, color: "#1D1D1F", resize: "none",
                  lineHeight: 1.5, maxHeight: 120, minHeight: 48,
                  fontFamily: "inherit",
                }}
                onInput={e => {
                  const t = e.currentTarget;
                  t.style.height = "48px";
                  t.style.height = Math.min(t.scrollHeight, 120) + "px";
                }}
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={loading}
                title={ui.coach.uploadImage}
                data-testid="button-upload-image"
                style={{
                  width: 36, height: 36, borderRadius: 12, border: "none",
                  background: pendingImage ? "rgba(52,199,89,0.12)" : "rgba(0,0,0,0.06)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 200ms ease",
                }}
              >
                <ImageIcon style={{ width: 16, height: 16, color: pendingImage ? "#34C759" : "#8E8E93" }} />
              </button>
              <button
                onClick={() => docInputRef.current?.click()}
                disabled={loading || docLoading}
                title={ui.coach.uploadDoc}
                data-testid="button-upload-doc"
                style={{
                  width: 36, height: 36, borderRadius: 12, border: "none",
                  background: pendingDoc ? "rgba(0,113,227,0.12)" : "rgba(0,0,0,0.06)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 200ms ease",
                }}
              >
                <FileText style={{ width: 16, height: 16, color: pendingDoc ? "#0071E3" : "#8E8E93" }} />
              </button>
              {speechSupported && (
                <button
                  onClick={toggleListening}
                  data-testid="button-mic"
                  style={{
                    width: 36, height: 36, borderRadius: 12, border: "none",
                    background: isListening
                      ? "linear-gradient(135deg, #FF3B30, #FF6B6B)"
                      : "rgba(0,0,0,0.06)",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "all 200ms ease",
                    animation: isListening ? "micPulse 1.5s ease-in-out infinite" : "none",
                  }}
                >
                  {isListening
                    ? <MicOff style={{ width: 16, height: 16, color: "#FFFFFF" }} />
                    : <Mic style={{ width: 16, height: 16, color: "#8E8E93" }} />
                  }
                </button>
              )}
              <button
                onClick={sendMessage}
                disabled={loading || (!input.trim() && !pendingImage && !pendingDoc)}
                data-testid="button-send"
                style={{
                  width: 36, height: 36, borderRadius: 12, border: "none",
                  background: (input.trim() || pendingImage || pendingDoc) && !loading
                    ? "linear-gradient(135deg, #0071E3, #34AADC)"
                    : "rgba(0,0,0,0.06)",
                  cursor: (input.trim() || pendingImage || pendingDoc) && !loading ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 200ms ease",
                }}
              >
                <Send style={{
                  width: 16, height: 16,
                  color: (input.trim() || pendingImage || pendingDoc) && !loading ? "#FFFFFF" : "#C7C7CC",
                }} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
