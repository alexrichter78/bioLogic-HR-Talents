import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Download, Lightbulb, ChevronDown, ChevronUp, ImageIcon, Mic, MicOff, ThumbsUp, ThumbsDown, Copy, Check, Search, X, FileText, Trash2 } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { useRegion, useLocalizedText } from "@/lib/region";
import { useIsMobile } from "@/hooks/use-mobile";

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

const EXAMPLE_PROMPTS: { category: string; prompts: string[]; requiresAnalysis?: boolean }[] = [
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
      "Basierend auf der Rollen-DNA: Welche Art von Kandidat ergänzt das Anforderungsprofil am besten?",
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
      "Generiere einen strukturierten Gesprächsleitfaden für ein Erstgespräch mit einem Kandidaten für diese Rolle. Berücksichtige die Rollen-DNA.",
      "Erstelle mir einen Onboarding-Gesprächsleitfaden für die ersten 90 Tage basierend auf dem Stellenprofil.",
      "Erstelle einen Feedbackgespräch-Leitfaden, der auf das bioLogic-Profil der Stelle zugeschnitten ist.",
      "Generiere einen Leitfaden für ein Probezeitgespräch basierend auf der Rollen-DNA und den Anforderungen.",
    ],
  },
  {
    category: "Zusammenfassungen",
    prompts: [
      "Fasse mir die wichtigsten Punkte aus unserem bisherigen Gespräch zusammen.",
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
  const LOUIS_STORAGE_KEY = "louis_chat_v1";
  const LOUIS_TTL_MS = 24 * 60 * 60 * 1000;
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem(LOUIS_STORAGE_KEY);
      if (!raw) return [WELCOME_MSG];
      const parsed = JSON.parse(raw) as { savedAt: number; messages: Message[] };
      if (!parsed.savedAt || Date.now() - parsed.savedAt > LOUIS_TTL_MS) {
        localStorage.removeItem(LOUIS_STORAGE_KEY);
        return [WELCOME_MSG];
      }
      if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) return [WELCOME_MSG];
      return parsed.messages;
    } catch {
      return [WELCOME_MSG];
    }
  });

  useEffect(() => {
    try {
      const toSave = messages.filter(m => m !== WELCOME_MSG);
      if (toSave.length === 0) {
        localStorage.removeItem(LOUIS_STORAGE_KEY);
        return;
      }
      localStorage.setItem(LOUIS_STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), messages: toSave }));
    } catch {
      // localStorage full or disabled — ignore
    }
  }, [messages]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const [showPrompts, setShowPrompts] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [promptSearch, setPromptSearch] = useState("");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!promptSearch.trim()) return;
    const term = promptSearch.trim().toLowerCase();
    const hasMatch = EXAMPLE_PROMPTS.some(cat => {
      if (cat.requiresAnalysis && !hasAnalysisData()) return false;
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

  const toggleListening = useCallback(() => {
    if (!speechSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;

    let baseText = "";
    setInput(prev => { baseText = prev; return prev; });
    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      const raw = finalTranscript + interim;
      const cleaned = raw
        .replace(/\s*[Pp]unkt\s*/g, ". ")
        .replace(/\s*[Kk]omma\s*/g, ", ")
        .replace(/\s*[Aa]usrufezeichen\s*/g, "! ")
        .replace(/\s*[Ff]ragezeichen\s*/g, "? ")
        .replace(/\s*[Dd]oppelpunkt\s*/g, ": ")
        .replace(/\s*[Ss]emikolon\s*/g, "; ")
        .replace(/\s*[Nn]eue [Zz]eile\s*/g, "\n")
        .replace(/([.!?])\s+(\w)/g, (_, p, c) => p + " " + c.toUpperCase())
        .replace(/\s{2,}/g, " ")
        .trim();
      const prefix = baseText ? baseText + " " : "";
      setInput(prefix + cleaned);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (inputRef.current) {
        inputRef.current.style.height = "48px";
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "aborted") {
        setIsListening(false);
        recognitionRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, speechSupported]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      const chatHistory = newMessages.filter(m => m !== WELCOME_MSG).map(m => ({
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

      const hasStammdaten = Object.keys(stammdaten).length > 0;
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
                  ? "Der Coach ist gerade kurz überlastet – bitte in ein paar Sekunden nochmal probieren."
                  : "Entschuldigung, es ist ein technisches Problem aufgetreten. Bitte versuche es erneut.");
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
        errorContent = "Das KI-Kontingent eurer Organisation ist leider aufgebraucht. Bitte wende dich an euren Administrator, um das Limit zu erhöhen oder den Zähler zurückzusetzen.";
      } else if (isTimeout) {
        errorContent = "Die Anfrage hat zu lange gedauert. Bitte versuche es erneut – bei komplexen Fragen kann es helfen, die Frage kürzer zu formulieren.";
        errorReason = "tech";
      } else if (isOverloaded) {
        errorContent = "Der Coach ist gerade kurz überlastet – bitte in ein paar Sekunden nochmal probieren.";
        errorReason = "overloaded";
      } else {
        errorContent = "Entschuldigung, es ist ein technisches Problem aufgetreten. Bitte versuche es erneut.";
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
      .filter(m => m !== WELCOME_MSG)
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

        const hasStammdaten = Object.keys(stammdaten).length > 0;
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
                    ? "Der Coach ist gerade kurz überlastet – bitte in ein paar Sekunden nochmal probieren."
                    : "Entschuldigung, es ist ein technisches Problem aufgetreten. Bitte versuche es erneut.");
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
          errorContent = "Das KI-Kontingent eurer Organisation ist leider aufgebraucht. Bitte wende dich an euren Administrator, um das Limit zu erhöhen oder den Zähler zurückzusetzen.";
        } else if (isTimeout) {
          errorContent = "Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.";
          errorReason = "tech";
        } else if (isOverloaded) {
          errorContent = "Der Coach ist gerade kurz überlastet – bitte in ein paar Sekunden nochmal probieren.";
          errorReason = "overloaded";
        } else {
          errorContent = "Entschuldigung, es ist ein technisches Problem aufgetreten. Bitte versuche es erneut.";
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
    return content.replace(/\s*<<BUTTONS:[\s\S]*?>>\s*$/, "").replace(/\s*<<BUTTONS:[\s\S]*$/, "").trim();
  }, []);

  const parseButtonsFromContent = useCallback((content: string): { cleanContent: string; buttons: string[] } => {
    const buttonMatch = content.match(/<<BUTTONS:\s*([\s\S]+?)>>\s*$/);
    if (buttonMatch) {
      const cleanContent = content.replace(/\s*<<BUTTONS:[\s\S]+?>>\s*$/, "").trim();
      const raw = buttonMatch[1].replace(/\n/g, " ");
      const buttons = raw
        .split("|")
        .map(b => b.trim().replace(/^[\u201E\u201C\u201D""„]/g, "").replace(/[\u201E\u201C\u201D""„]$/g, "").trim())
        .filter(b => b.length > 0 && b.length <= 50);
      return { cleanContent, buttons: buttons.slice(0, 4) };
    }
    if (/<<BUTTONS:/.test(content)) {
      return { cleanContent: content.replace(/\s*<<BUTTONS:[\s\S]*$/, "").trim(), buttons: [] };
    }
    return { cleanContent: content, buttons: [] };
  }, []);

  const extractQuickReplies = useCallback((content: string, msgIndex: number, totalMessages: number, _hasImage?: boolean): string[] => {
    const isLastAssistant = msgIndex === totalMessages - 1;
    if (!isLastAssistant || loading) return [];
    const { buttons } = parseButtonsFromContent(content);
    return buttons;
  }, [parseButtonsFromContent, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exportChat = () => {
    const chatMessages = messages.filter(m => m !== WELCOME_MSG);
    if (chatMessages.length === 0) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    let text = `Louis – Gesprächsprotokoll\n`;
    text += `Exportiert am ${dateStr} um ${timeStr}\n`;
    text += `${"─".repeat(50)}\n\n`;
    for (const msg of chatMessages) {
      const label = msg.role === "user" ? "Frage" : "Coach";
      text += `${label}:\n${parseButtonsFromContent(msg.content).cleanContent}\n`;
      if (msg.image) {
        text += `[KI-generiertes Bild wurde in diesem Schritt erstellt]\n`;
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
    <div className="page-gradient-bg" style={{ display: "flex", flexDirection: "column" }} lang="de">
      <GlobalNav />

      <div style={{ position: "fixed", top: isMobile ? 48 : 56, left: 0, right: 0, zIndex: 8999 }}>
        <div className="dark:!bg-background" style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: isMobile ? "4px 0 6px" : "5px 0 10px", minHeight: isMobile ? 48 : 62 }}>
          <div className="w-full mx-auto" style={{ maxWidth: 1100, padding: isMobile ? "0 12px" : "0 24px" }}>
            <div className="text-center">
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#34C759" }} data-testid="text-page-title">Louis</h1>
              <p style={{ fontSize: 14, color: "#48484A", fontWeight: 450, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Dein KI-Coach für Führung, HR und Teamfragen</p>
            </div>
          </div>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: 1100, width: "100%", margin: "0 auto", paddingTop: isMobile ? 110 : 135, paddingLeft: isMobile ? 6 : 16, paddingRight: isMobile ? 6 : 16, paddingBottom: isMobile ? 80 : 24, display: "flex", flexDirection: "column" }}>
        <div style={{
          background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: 20, flex: 1, display: "flex", flexDirection: "column",
          boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
          border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden",
          minHeight: "calc(100vh - 220px)",
        }}>
          <div style={{
            padding: isMobile ? "10px 14px" : "12px 28px",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              {hasAnalysisData() && (
                <span data-testid="badge-context-active" style={{
                  fontSize: 10, fontWeight: 600, color: "#34C759",
                  background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.25)",
                  borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap",
                }}>Profil aktiv</span>
              )}
            </div>
            <button
              onClick={exportChat}
              disabled={messages.filter(m => m !== WELCOME_MSG).length === 0}
              data-testid="button-export-chat"
              title="Gespräch als TXT exportieren"
              style={{
                width: 36, height: 36, borderRadius: 10, border: "none",
                background: messages.filter(m => m !== WELCOME_MSG).length > 0 ? "rgba(0,113,227,0.08)" : "rgba(0,0,0,0.03)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: messages.filter(m => m !== WELCOME_MSG).length > 0 ? "pointer" : "default",
                transition: "all 200ms ease", flexShrink: 0,
              }}
            >
              <Download style={{
                width: 16, height: 16,
                color: messages.filter(m => m !== WELCOME_MSG).length > 0 ? "#0071E3" : "#C7C7CC",
              }} />
            </button>
          </div>

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

            const allPrompts = isSearching ? EXAMPLE_PROMPTS.filter(cat => !(cat.requiresAnalysis && !hasAnalysisData())).flatMap(cat => {
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
              <p style={{ fontSize: 14, color: "#48484A", margin: 0, fontWeight: 600, lineHeight: 1.65 }} data-testid="text-input-desc">Stell eine Frage zu Führung, Teamdynamik, Kommunikation oder nutze einen Musterprompt.</p>
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
                    placeholder="Musterprompt suchen…"
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
                  Musterprompts
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
                    <p style={{ fontSize: 13, color: "#8E8E93", textAlign: "center", padding: "12px 0" }} data-testid="text-no-prompt-results">Keine Prompts gefunden für „{promptSearch}"</p>
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
                    const isDisabled = cat.requiresAnalysis && !hasAnalysisData();
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
                        title={isDisabled ? "Bitte zuerst eine Stelle analysieren" : undefined}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {cat.category}
                          {isDisabled && <span style={{ fontSize: 11, fontWeight: 400, color: "#8E8E93" }}>(Stelle erforderlich)</span>}
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
                <div style={{
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #0071E3, #34AADC)"
                    : "rgba(0,0,0,0.04)",
                  color: msg.role === "user" ? "#FFFFFF" : "#1D1D1F",
                  fontSize: 14, lineHeight: 1.6,
                }}>
                  {formatMessage(parseButtonsFromContent(msg.content).cleanContent)}
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
                          {msg.overlayTitle ? "Bild mit Text" : "Bild herunterladen"}
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
                            Nur Bild (ohne Text)
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {msg.role === "assistant" && msg !== WELCOME_MSG && msg.content && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6, paddingLeft: 4 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(parseButtonsFromContent(msg.content).cleanContent);
                          setCopiedIndex(i);
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                        data-testid={`copy-${i}`}
                        title="Antwort kopieren"
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
                    </div>
                    {!loading && msg.errorReason === "overloaded" && msg.retryQuestion && (
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
                  <span style={{ fontSize: 13, color: "#6E6E73" }} data-testid="text-loading">{loadingStatus || "Antwort wird erstellt..."}</span>
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
              accept=".pdf,.txt,.md,application/pdf,text/plain"
              style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleDocumentSelect(f); e.target.value = ""; }}
              data-testid="input-doc-upload"
            />

            {(pendingImage || pendingDoc || docLoading) && (
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                {pendingImage && (
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <img src={pendingImage.dataUrl} alt="Anhang" style={{ height: 64, maxWidth: 120, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(0,0,0,0.1)" }} />
                    <button onClick={() => setPendingImage(null)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#FF3B30", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X style={{ width: 10, height: 10, color: "#fff" }} />
                    </button>
                  </div>
                )}
                {docLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,113,227,0.08)", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#0071E3" }}>
                    <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
                    Dokument wird gelesen...
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
                placeholder="Frage stellen..."
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
                title="Bild hochladen"
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
                title="PDF / Textdokument hochladen"
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
