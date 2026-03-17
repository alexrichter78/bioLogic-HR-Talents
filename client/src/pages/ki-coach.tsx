import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Download, Lightbulb, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import GlobalNav from "@/components/global-nav";

type Message = {
  role: "user" | "assistant";
  content: string;
  image?: string;
};

const WELCOME_MSG: Message = {
  role: "assistant",
  content: "Willkommen beim bioLogic KI-Coach.\n\nIch unterstütze Sie bei Fragen rund um Führung, Personalentscheidungen, Assessment, Bewerbungsgespräche und Kommunikation.\n\nWie kann ich Ihnen helfen?",
};

const EXAMPLE_PROMPTS: { category: string; prompts: string[]; requiresAnalysis?: boolean }[] = [
  {
    category: "bioLogic-basierte Beratung",
    prompts: [
      "Mein Mitarbeiter ist rotdominant und unterbricht ständig andere im Meeting. Wie gehe ich damit um?",
      "Ich bin gelbdominant und soll ein Kritikgespräch mit einem blauen Kollegen führen. Was muss ich beachten?",
      "Wie erkenne ich, ob jemand eher rot, gelb oder blau tickt, ohne einen Test zu machen?",
      "Mein Chef ist blaudominant und gibt mir nie persönliches Feedback. Wie kann ich das ändern?",
      "Was bedeutet es für die Zusammenarbeit, wenn zwei Rotdominante im selben Projekt arbeiten?",
    ],
  },
  {
    category: "Fertige Formulierungen",
    prompts: [
      "Gib mir 3 Formulierungen, mit denen ich einem impulsiven Mitarbeiter Grenzen setze, ohne ihn zu provozieren.",
      "Wie sage ich einem gelbdominanten Teammitglied, dass die Qualität nicht stimmt, ohne die Beziehung zu beschädigen?",
      "Ich brauche eine Formulierung, um in einem Meeting einen analytischen Kollegen höflich zu unterbrechen.",
      "Wie formuliere ich eine Absage an einen internen Bewerber, der rotdominant ist und schlecht mit Ablehnung umgeht?",
      "Gib mir einen Gesprächseinstieg für ein Jahresgespräch mit einem introvertierten, blaudominanten Mitarbeiter.",
    ],
  },
  {
    category: "Gespräche durchspielen & üben",
    prompts: [
      "Spiel mit mir ein Gehaltsgespräch durch. Mein Gegenüber ist rotdominant und sehr fordernd. Übernimm seine Rolle und gib mir nach jeder Runde Feedback.",
      "Mein gelbdominanter Mitarbeiter kommt ständig zu spät. Ich bin rotdominant. Spiel das Gespräch mit mir durch – du bist der Mitarbeiter.",
      "Simuliere ein Bewerbungsgespräch mit mir. Ich bin der Interviewer, die Person ist gelbdominant. Reagiere wie ein echter Bewerber.",
      "Übe mit mir ein Feedbackgespräch. Ich muss einem langjährigen blaudominanten Mitarbeiter sagen, dass er sich verändern muss. Du spielst ihn.",
      "Ich möchte meinem rotdominanten Chef eine Gehaltserhöhung vorschlagen. Lass uns das durchspielen – du bist mein Chef.",
    ],
  },
  {
    category: "Formulierungen prüfen & verbessern",
    prompts: [
      "Ich würde zu meinem gelbdominanten Mitarbeiter sagen: 'Du kommst seit Wochen zu spät, das nervt das ganze Team.' – Was ist daran falsch und wie wäre es besser?",
      "Prüf meinen Satz für ein Kritikgespräch mit einem Blauen: 'Ich habe das Gefühl, dass du dich nicht genug einbringst.' – Wie wirkt das auf ihn?",
      "Wie würde ein Roter auf diesen Satz reagieren: 'Könnten wir vielleicht mal darüber sprechen, ob die Deadline realistisch ist?'",
      "Ich will meinem Team sagen: 'Ab sofort gilt: Wer zu spät kommt, muss sich erklären.' – Wie wirkt das auf die verschiedenen Typen?",
      "Formuliere mir drei verschiedene Einstiege für ein Kritikgespräch mit einem Gelben – ich wähle dann den besten.",
    ],
  },
  {
    category: "Teamkonstellations-Beratung",
    prompts: [
      "Mein Team besteht aus 3 Blauen, 1 Roten und 2 Gelben. Was sind die typischen Dynamiken?",
      "Ich habe ein rein gelbdominantes Team. Welche Risiken gibt es und was fehlt uns?",
      "Wir sind 5 Leute: 2 rot-blau Hybride, 2 Gelbe und 1 Balanced. Wie führe ich dieses Team am besten?",
      "In meinem Team gibt es nur Rot und Blau, kein Gelb. Was passiert da langfristig?",
      "Ich baue ein neues Projektteam auf. Welche Farbkonstellation wäre ideal für ein Innovationsprojekt?",
    ],
  },
  {
    category: "Gesprächs-Vorbereitung",
    prompts: [
      "Ich muss morgen ein Kündigungsgespräch mit einem gelbdominanten Mitarbeiter führen. Hilf mir bei der Vorbereitung.",
      "Ich habe ein Konfliktgespräch mit einem rotdominanten Kollegen, der meine Autorität untergräbt. Wie bereite ich mich vor?",
      "Bereite mit mir ein Verhandlungsgespräch vor. Mein Gegenüber ist analytisch und will alles schriftlich.",
      "Ich muss meinem Team eine unpopuläre Entscheidung verkünden. Das Team ist gemischt rot-gelb. Wie gehe ich vor?",
      "Hilf mir, ein Rückkehrgespräch nach langer Krankheit vorzubereiten. Die Mitarbeiterin ist blaudominant.",
    ],
  },
  {
    category: "Onboarding-Begleitung",
    prompts: [
      "Ein rotdominanter neuer Mitarbeiter kommt in mein eher blaues Team. Was muss ich in den ersten 90 Tagen beachten?",
      "Wir haben eine neue gelbdominante Führungskraft eingestellt. Das Team ist überwiegend rot. Wie gelingt die Integration?",
      "Ein blaudominanter Experte wechselt in ein kreatives, gelb-rotes Team. Welche Stolperfallen gibt es?",
      "Ich starte als neue Führungskraft in einem Team, das ich noch nicht kenne. Wie erkenne ich schnell die bioLogic-Typen?",
      "Drei neue Mitarbeiter kommen gleichzeitig. Wie gestalte ich die Einarbeitung, wenn alle unterschiedliche Typen sind?",
    ],
  },
  {
    category: "Konfliktmuster erkennen",
    prompts: [
      "Zwei Kollegen geraten ständig aneinander: einer will schnelle Entscheidungen, der andere braucht mehr Daten. Was steckt dahinter?",
      "In meinem Team gibt es eine Person, die immer alles persönlich nimmt, und eine, die nur sachlich argumentiert. Warum eskaliert das regelmäßig?",
      "Mein Stellvertreter und ich blockieren uns gegenseitig. Ich bin eher gelb, er ist rot. Wie durchbreche ich das Muster?",
      "Es gibt einen Dauerkonflikt zwischen Vertrieb (überwiegend rot) und Qualitätssicherung (überwiegend blau). Wie löse ich das strukturell?",
      "Immer wenn wir unter Zeitdruck stehen, zerfällt mein Team in Lager. Was ist das bioLogic-Muster dahinter?",
    ],
  },
  {
    category: "Stellenanzeigen & Recruiting-Marketing",
    prompts: [
      "Ich suche einen Vertriebsleiter (rotdominant). Welche Wort- und Bildsprache sollte meine Stellenanzeige verwenden, um genau diesen Typ anzusprechen?",
      "Unsere Stellenanzeige für einen HR-Business-Partner spricht nur analytische Bewerber an. Wie formuliere ich sie um, damit sich auch gelbdominante Personen angesprochen fühlen?",
      "Wir suchen einen Qualitätsmanager (blaudominant). Gib mir 5 konkrete Formulierungen für die Stellenanzeige, die diesen Typ anziehen.",
      "Ich möchte eine Stellenanzeige für eine Projektleitung schreiben, die ein rot-gelbes Profil braucht. Wie kombiniere ich beide Ansprachen?",
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
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} style={{ margin: "6px 0", paddingLeft: 20 }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ marginBottom: 3, lineHeight: 1.6 }}>{renderBold(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const renderBold = (str: string): React.ReactNode => {
    const parts = str.split(/\*\*(.+?)\*\*/g);
    if (parts.length === 1) return str;
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || /^\d+\.\s/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, ""));
    } else {
      flushList();
      if (trimmed === "") {
        elements.push(<div key={`sp-${elements.length}`} style={{ height: 8 }} />);
      } else {
        elements.push(
          <p key={`p-${elements.length}`} style={{ margin: "0 0 4px", lineHeight: 1.6 }}>{renderBold(trimmed)}</p>
        );
      }
    }
  }
  flushList();
  return <>{elements}</>;
}

export default function KICoach() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
        body: JSON.stringify({ messages: chatHistory, ...(hasStammdaten ? { stammdaten } : {}) }),
      });

      if (!res.ok) throw new Error("Fehler");
      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.reply };
      if (data.image) {
        assistantMsg.image = `data:image/png;base64,${data.image}`;
      }
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
  }, [input, loading, messages]);

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
                      <img
                        src={msg.image}
                        alt="KI-generiertes Bild"
                        data-testid={`image-generated-${i}`}
                        style={{
                          width: "100%",
                          maxWidth: 480,
                          borderRadius: 12,
                          border: "1px solid rgba(0,0,0,0.08)",
                          display: "block",
                        }}
                      />
                      <button
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = msg.image!;
                          a.download = `bioLogic-Coach-Bild_${new Date().toISOString().slice(0, 10)}.png`;
                          a.click();
                        }}
                        data-testid={`button-download-image-${i}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 8,
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
                        Bild herunterladen
                      </button>
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
