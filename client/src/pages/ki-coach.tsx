import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Download } from "lucide-react";
import GlobalNav from "@/components/global-nav";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const WELCOME_MSG: Message = {
  role: "assistant",
  content: "Willkommen beim bioLogic KI-Coach.\n\nIch unterstütze Sie bei Fragen rund um Führung, Personalentscheidungen, Assessment, Bewerbungsgespräche und Kommunikation.\n\nWie kann ich Ihnen helfen?",
};

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      inputRef.current.style.height = "24px";
    }

    try {
      const chatHistory = newMessages.filter(m => m !== WELCOME_MSG);

      const res = await fetch("/api/ki-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!res.ok) throw new Error("Fehler");
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
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
      text += `${label}:\n${msg.content}\n\n`;
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

      <main style={{ flex: 1, maxWidth: 820, width: "100%", margin: "0 auto", padding: "24px 16px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{
          background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: 32, flex: 1, display: "flex", flexDirection: "column",
          boxShadow: "0 2px 20px rgba(0,0,0,0.03), 0 12px 48px rgba(0,0,0,0.05)",
          border: "1px solid rgba(255,255,255,0.7)", overflow: "hidden",
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
              <p style={{ fontSize: 11, color: "#8E8E93", margin: "2px 0 0" }}>Führung · Personal · Assessment · Kommunikation</p>
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
                  <span style={{ fontSize: 13, color: "#8E8E93" }}>Antwort wird erstellt...</span>
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
                  lineHeight: 1.5, maxHeight: 120, minHeight: 24,
                  fontFamily: "inherit",
                }}
                onInput={e => {
                  const t = e.currentTarget;
                  t.style.height = "24px";
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
            <p style={{ fontSize: 10, color: "#C7C7CC", textAlign: "center", margin: "8px 0 0" }}>
              Themen: Führung · Personalentscheidungen · Assessment · Bewerbung · Kommunikation
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
