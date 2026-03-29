import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Download, Lightbulb, ChevronDown, ChevronUp, ImageIcon, Mic, MicOff } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { useRegion } from "@/lib/region";

type Message = {
  role: "user" | "assistant";
  content: string;
  image?: string;
  overlayTitle?: string;
  overlaySubtitle?: string;
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
    category: "Zusammenfassungen",
    prompts: [
      "Fasse mir die wichtigsten Punkte aus unserem bisherigen Gespräch zusammen.",
    ],
  },
];

function formatMessage(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: { text: string; indent: boolean }[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} style={{ margin: "8px 0", paddingLeft: 18, listStyle: "none" }}>
          {listItems.map((item, i) => (
            <li key={i} style={{
              marginBottom: 6, lineHeight: 1.65, position: "relative", paddingLeft: item.indent ? 16 : 0,
            }}>
              <span style={{ position: "absolute", left: item.indent ? 0 : -16, color: "#0071E3", fontWeight: 600 }}>•</span>
              {renderInline(item.text)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
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

    if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || /^\d+\.\s/.test(trimmed)) {
      listItems.push({
        text: trimmed.replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, ""),
        indent: isIndented,
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

  return <>{elements}</>;
}

export default function KICoach() {
  const { region } = useRegion();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
      const analyseRaw = localStorage.getItem("analyseTexte");
      const rollenDna = localStorage.getItem("rollenDnaState");
      return !!(analyseRaw || rollenDna);
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

      let stammdaten: Record<string, string> = {};
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
        }
      } catch {}

      const hasStammdaten = Object.keys(stammdaten).length > 0;

      const res = await fetch("/api/ki-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory, ...(hasStammdaten ? { stammdaten } : {}), region }),
      });

      if (!res.ok) throw new Error("Fehler");
      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.reply };
      if (data.image) {
        assistantMsg.image = `data:image/png;base64,${data.image}`;
      }
      if (data.overlayTitle) assistantMsg.overlayTitle = data.overlayTitle;
      if (data.overlaySubtitle) assistantMsg.overlaySubtitle = data.overlaySubtitle;
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages, isListening]);

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

      <main style={{ flex: 1, maxWidth: 1100, width: "100%", margin: "0 auto", padding: "24px 16px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{
          background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: 20, flex: 1, display: "flex", flexDirection: "column",
          boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
          border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden",
          minHeight: "calc(100vh - 140px)",
        }}>
          <div style={{
            padding: "20px 28px 16px",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", gap: 14,
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
              <p style={{ fontSize: 11, color: "#6E6E73", margin: "2px 0 0" }}>Führung · Personal · Assessment · Kommunikation</p>
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
            flex: 1, overflowY: "auto", padding: "20px 28px",
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
                <div style={{
                  maxWidth: "75%",
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #0071E3, #34AADC)"
                    : "rgba(0,0,0,0.04)",
                  color: msg.role === "user" ? "#FFFFFF" : "#1D1D1F",
                  fontSize: 14, lineHeight: 1.6,
                }}>
                  {formatMessage(msg.content)}
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
                  <span style={{ fontSize: 13, color: "#6E6E73" }} data-testid="text-loading">Antwort wird erstellt...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: "16px 28px 20px",
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
              padding: "12px 28px 16px",
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
