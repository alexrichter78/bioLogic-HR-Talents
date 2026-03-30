import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Download, Lightbulb, ChevronDown, ChevronUp, ImageIcon, Mic, MicOff, ThumbsUp, ThumbsDown, Copy, Check } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { useRegion } from "@/lib/region";
import { useIsMobile } from "@/hooks/use-mobile";

type Message = {
  role: "user" | "assistant";
  content: string;
  image?: string;
  overlayTitle?: string;
  overlaySubtitle?: string;
  feedback?: "up" | "down";
};

const WELCOME_MSG: Message = {
  role: "assistant",
  content: "Willkommen beim bioLogic KI-Coach.\n\nIch unterstütze Sie bei Fragen rund um Führung, Personalentscheidungen, Assessment, Bewerbungsgespräche und Kommunikation.\n\nWie kann ich Ihnen helfen?",
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
      "In meinem Team gibt es eine Person, die immer alles persönlich nimmt, und eine, die nur sachlich argumentiert. Warum eskaliert das regelmäßig?",
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

function formatMessage(text: string, isStreaming?: boolean) {
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
              paddingLeft: item.indent ? 16 : (isOrdered ? 0 : 0),
              ...(isOrdered ? { color: "#0071E3", fontWeight: 500 } : {}),
            }}>
              {!isOrdered && (
                <span style={{ position: "absolute", left: item.indent ? 0 : -16, color: "#0071E3", fontWeight: 600 }}>•</span>
              )}
              <span style={isOrdered ? { color: "#1D1D1F", fontWeight: 400 } : undefined}>{renderInline(item.text)}</span>
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
    const parts = str.split(/(\*\*.*?\*\*|".*?")/g);
    if (parts.length === 1) return str;
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('"') && part.endsWith('"') && part.length > 10) {
        return <span key={i} style={{ fontStyle: "italic", color: "#3A3A3C" }}>{part}</span>;
      }
      return part;
    });
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx];
    const trimmed = raw.trim();
    const isIndented = raw.startsWith("    ") || raw.startsWith("\t");

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      const cells = trimmed.slice(1, -1).split("|");
      tableRows.push(cells);
      continue;
    } else if (tableRows.length > 0) {
      flushTable();
    }

    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      flushList();
      elements.push(<hr key={`hr-${elements.length}`} style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.08)", margin: "14px 0" }} />);
    } else if (/^#{1,4}\s+/.test(trimmed)) {
      flushList();
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
      } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        elements.push(
          <div key={`q-${elements.length}`} style={{
            margin: "10px 0",
            padding: "10px 14px",
            borderLeft: "3px solid #0071E3",
            background: "rgba(0,113,227,0.04)",
            borderRadius: "0 8px 8px 0",
            fontStyle: "italic",
            lineHeight: 1.65,
            color: "#1D1D1F",
          }}>{renderInline(trimmed)}</div>
        );
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
        elements.push(
          <p key={`p-${elements.length}`} style={{ margin: "0 0 6px", lineHeight: 1.65 }}>{renderInline(trimmed)}</p>
        );
      }
    }
  }
  flushList();
  flushTable();

  if (!isStreaming) {
    let lastTextIdx = -1;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i] as React.ReactElement;
      if (el && el.type === "p" && el.key && (el.key as string).startsWith("p-")) {
        lastTextIdx = i;
        break;
      }
    }
    if (lastTextIdx >= 0) {
      const el = elements[lastTextIdx] as React.ReactElement;
      elements[lastTextIdx] = (
        <p key={el.key} style={{ ...el.props.style, fontWeight: 700 }}>
          {el.props.children}
        </p>
      );
    }
  }

  if (isStreaming) {
    elements.push(
      <span key="cursor" className="streaming-cursor" style={{
        display: "inline-block", width: 2, height: 16, background: "#0071E3",
        marginLeft: 2, verticalAlign: "text-bottom", borderRadius: 1,
      }} />
    );
  }

  return <>{elements}</>;
}

export default function KICoach() {
  const { region } = useRegion();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const [showPrompts, setShowPrompts] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

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

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      setInput(prev => {
        const base = prev.endsWith(finalTranscript) ? prev : (prev ? prev + " " : "") + finalTranscript;
        return interim ? base + interim : base;
      });
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = "48px";
    }

    try {
      const chatHistory = newMessages.filter(m => m !== WELCOME_MSG);

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

      const res = await fetch("/api/ki-coach?stream=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) throw new Error("Fehler");

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
                  setMessages(prev => { setStreamingIndex(prev.length); return [...prev, { role: "assistant", content: "" }]; });
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
                  setMessages(prev => { setStreamingIndex(prev.length); return [...prev, { role: "assistant", content: "" }]; });
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
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
      }]);
    } finally {
      setLoading(false);
      setLoadingStatus("");
      setStreamingIndex(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages, isListening]);

  const setFeedback = useCallback((index: number, value: "up" | "down") => {
    setMessages(prev => prev.map((msg, i) => i === index ? { ...msg, feedback: msg.feedback === value ? undefined : value } : msg));
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
      .map(m => ({ role: m.role, content: m.content }));

    (async () => {
      try {
        const stammdaten: Record<string, any> = {};
        try {
          const savedAnalyse = localStorage.getItem("analyseState");
          if (savedAnalyse) {
            const a = JSON.parse(savedAnalyse);
            if (a.bereich1) stammdaten.impulsiveDaten = a.bereich1;
            if (a.bereich2) stammdaten.intuitiveDaten = a.bereich2;
            if (a.bereich3) stammdaten.analytischeDaten = a.bereich3;
          }
        } catch {}

        const hasStammdaten = Object.keys(stammdaten).length > 0;
        const body = JSON.stringify({ messages: chatHistory, ...(hasStammdaten ? { stammdaten } : {}), region });

        const res = await fetch("/api/ki-coach?stream=1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (!res.ok) throw new Error("Fehler");

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
                    setMessages(prev => { setStreamingIndex(prev.length); return [...prev, { role: "assistant", content: "" }]; });
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
                    setMessages(prev => { setStreamingIndex(prev.length); return [...prev, { role: "assistant", content: "" }]; });
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
          setMessages(prev => [...prev, assistantMsg]);
        }
      } catch {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        }]);
      } finally {
        setLoading(false);
        setLoadingStatus("");
        setStreamingIndex(null);
      }
    })();
  }, [loading, messages, region]);

  const extractQuickReplies = useCallback((content: string, msgIndex: number, totalMessages: number): string[] => {
    const isLastAssistant = msgIndex === totalMessages - 1;
    if (!isLastAssistant) return [];
    const paragraphs = content.trim().split(/\n\n/);
    const lastTwo = paragraphs.slice(-2).join("\n\n");
    const hasQuestion = /\?\s*$/.test(lastTwo.trim()) || /\?["\u201C\u201D\u201E)]*\s*$/m.test(lastTwo);
    const asksForInput = /magst du|interesse|wollen wir|soll ich|willst du|möchtest du|beschreib.*mir|nenn.*mir|sag.*mir.*bescheid|gib.*mir.*info|teil.*mir.*mit/i.test(lastTwo);

    if (/durchspielen|rollenspiel|simulier|übernehme.*rolle|üben|ausprobier/i.test(lastTwo) && hasQuestion) {
      return ["Ja, lass uns das durchspielen!", "Nein, andere Frage"];
    }
    if (/zusammenfass|mitnehm|was nimmst du/i.test(lastTwo) && hasQuestion) {
      return ["Ja, bitte zusammenfassen", "Nein, ich habe noch eine Frage"];
    }
    if (/wie reagierst du|was sagst du/i.test(lastTwo)) {
      return [];
    }
    if (/bioLogic.*Prägung|bioLogic.*Profil|bioLogic.*Typ|impulsiv.*intuitiv.*analytisch|impulsiv.*analytisch.*intuitiv|Doppeldominanz|Persönlichkeitstyp.*zuschneid/i.test(content) && (hasQuestion || asksForInput)) {
      return ["Ich bin impulsiv-dominant", "Ich bin intuitiv-dominant", "Ich bin analytisch-dominant", "Ich habe eine Doppeldominanz", "Allgemeine Antwort bitte"];
    }
    if ((hasQuestion || asksForInput) && /interesse|wollen wir|soll ich|willst du|möchtest du|magst du/i.test(lastTwo)) {
      return ["Ja, gerne!", "Nein, andere Frage"];
    }
    if (content.length > 200 && !hasQuestion && !asksForInput) {
      const replies: string[] = [];
      if (/technik|methode|regel|strategie/i.test(content)) replies.push("Gib mir ein konkretes Beispiel dazu");
      if (/gespräch|formulierung|satz|sagen/i.test(content)) replies.push("Lass uns das durchspielen");
      if (content.length > 500) replies.push("Fasse die wichtigsten Punkte zusammen");
      if (replies.length === 0) replies.push("Erkläre das genauer");
      replies.push("Erstelle einen Gesprächsleitfaden dazu");
      return replies;
    }
    if (hasQuestion) {
      return ["Ja, gerne!", "Nein, andere Frage"];
    }
    return [];
  }, []);

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
    let text = `bioLogic KI-Coach – Gesprächsprotokoll\n`;
    text += `Exportiert am ${dateStr} um ${timeStr}\n`;
    text += `${"─".repeat(50)}\n\n`;
    for (const msg of chatMessages) {
      const label = msg.role === "user" ? "Frage" : "Coach";
      text += `${label}:\n${msg.content}\n`;
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
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)", display: "flex", flexDirection: "column" }} lang="de">
      <GlobalNav />

      <main style={{ flex: 1, maxWidth: 1100, width: "100%", margin: "0 auto", padding: isMobile ? "8px 6px 80px" : "24px 16px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{
          background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: 20, flex: 1, display: "flex", flexDirection: "column",
          boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
          border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden",
          minHeight: "calc(100vh - 140px)",
        }}>
          <div style={{
            padding: isMobile ? "12px 14px 10px" : "20px 28px 16px",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", gap: isMobile ? 10 : 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(0,113,227,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Bot style={{ width: 20, height: 20, color: "#0071E3" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }} data-testid="text-page-title">bioLogic KI-Coach</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <p style={{ fontSize: 11, color: "#6E6E73", margin: 0 }}>Führung · Personal · Assessment · Kommunikation</p>
                {hasAnalysisData() && (
                  <span data-testid="badge-context-active" style={{
                    fontSize: 10, fontWeight: 600, color: "#34C759",
                    background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.25)",
                    borderRadius: 6, padding: "1px 7px", whiteSpace: "nowrap",
                  }}>Profil aktiv</span>
                )}
              </div>
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
                    ? "#0071E3"
                    : "rgba(0,0,0,0.04)",
                  color: msg.role === "user" ? "#FFFFFF" : "#1D1D1F",
                  fontSize: 14, lineHeight: 1.6,
                }}>
                  {formatMessage(msg.content, streamingIndex === i)}
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
                          navigator.clipboard.writeText(msg.content);
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
                    {!loading && extractQuickReplies(msg.content, i, messages.length).length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {extractQuickReplies(msg.content, i, messages.length).map((reply, ri) => (
                          <button
                            key={ri}
                            onClick={() => sendQuickReply(reply)}
                            data-testid={`quick-reply-${ri}`}
                            style={{
                              padding: "8px 16px",
                              borderRadius: 999,
                              border: "1.5px solid rgba(0,113,227,0.25)",
                              background: "rgba(0,113,227,0.04)",
                              color: "#0071E3",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 200ms ease",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,113,227,0.10)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,113,227,0.04)"; }}
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
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
            <div style={{
              display: "flex", gap: 10, alignItems: "flex-end",
              background: "rgba(0,0,0,0.03)",
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
                disabled={loading || !input.trim()}
                data-testid="button-send"
                style={{
                  width: 36, height: 36, borderRadius: 12, border: "none",
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg, #0071E3, #34AADC)"
                    : "rgba(0,0,0,0.06)",
                  cursor: input.trim() && !loading ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 200ms ease",
                }}
              >
                <Send style={{
                  width: 16, height: 16,
                  color: input.trim() && !loading ? "#FFFFFF" : "#C7C7CC",
                }} />
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0 0", gap: 8 }}>
              <button
                onClick={() => { setShowPrompts(v => !v); if (showPrompts) setExpandedCategory(null); }}
                data-testid="button-example-prompts"
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: showPrompts ? "rgba(220,53,69,0.1)" : "rgba(220,53,69,0.06)",
                  border: showPrompts ? "1px solid rgba(220,53,69,0.3)" : "1px solid rgba(220,53,69,0.2)",
                  borderRadius: 12, padding: "8px 18px",
                  cursor: "pointer", fontSize: 14, color: "#DC3545",
                  fontWeight: 600, transition: "all 200ms ease",
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
          </div>

          {showPrompts && (
            <div style={{
              borderTop: "1px solid rgba(0,0,0,0.06)",
              background: "rgba(248,250,252,0.95)",
              maxHeight: 360, overflowY: "auto",
              padding: isMobile ? "8px 10px 12px" : "12px 28px 16px",
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
                          {prompt}
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
      </main>
    </div>
  );
}
