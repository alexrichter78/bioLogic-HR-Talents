import { useState, useRef, useEffect } from "react";
import { HelpCircle, X, Send, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useRegion } from "@/lib/region";

type Message = { role: "assistant" | "user"; content: string };

const WELCOME_DE = "Hallo! Ich bin der bioLogic Hilfe-Assistent. Wie kann ich dir weiterhelfen?\n\nIch kann dir bei Fragen zur Plattform helfen – z.B. zu JobCheck, MatchCheck, TeamCheck oder Louis (KI-Coach).";
const WELCOME_EN = "Hello! I'm the bioLogic Help Assistant. How can I help you?\n\nI can assist with questions about the platform – e.g. JobCheck, MatchCheck, TeamCheck or Louis (AI Coach).";

export default function HelpBot() {
  const { user } = useAuth();
  const { region } = useRegion();
  const welcome = region === "EN" ? WELCOME_EN : WELCOME_DE;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: welcome }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [escalateLoading, setEscalateLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && (prev[0].content === WELCOME_DE || prev[0].content === WELCOME_EN)) {
        return [{ role: "assistant", content: region === "EN" ? WELCOME_EN : WELCOME_DE }];
      }
      return prev;
    });
  }, [region]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  if (!user) return null;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setShowEscalate(false);

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await apiRequest("POST", "/api/help-bot", {
        messages: updated.filter((m) => m.content !== WELCOME_DE && m.content !== WELCOME_EN),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.cannotHelp) {
        setShowEscalate(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: region === "EN" ? "An error occurred. Please try again." : "Es ist ein Fehler aufgetreten. Bitte versuche es erneut." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    setEscalateLoading(true);
    try {
      const conversation = messages
        .filter((m) => m.content !== WELCOME_DE && m.content !== WELCOME_EN)
        .map((m) => `${m.role === "user" ? (region === "EN" ? "Customer" : "Kunde") : "Bot"}: ${m.content}`)
        .join("\n\n");

      let supportEmail = "alexander.richter@foresmind.de";
      try {
        const raw = localStorage.getItem("analyseTexte");
        if (raw) {
          const data = JSON.parse(raw);
          if (data.supportEmail) supportEmail = data.supportEmail;
        }
      } catch {}

      await apiRequest("POST", "/api/help-bot/escalate", {
        userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username,
        userEmail: user.email || "",
        conversation,
        supportEmail,
      });
      setEmailSent(true);
      setShowEscalate(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: region === "EN"
            ? "Your request has been forwarded successfully. Our team will get back to you as soon as possible."
            : "Deine Anfrage wurde erfolgreich weitergeleitet. Unser Team wird sich so schnell wie möglich bei dir melden.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: region === "EN" ? "The email could not be sent. Please try again later." : "Die E-Mail konnte leider nicht gesendet werden. Bitte versuche es später erneut." },
      ]);
    } finally {
      setEscalateLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (user?.coachOnly) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, #0071E3, #34AADC)",
            border: "none", cursor: "pointer",
            boxShadow: "0 6px 24px rgba(0,113,227,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 200ms ease, box-shadow 200ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          data-testid="button-help-bot-open"
        >
          <HelpCircle style={{ width: 26, height: 26, color: "#FFF" }} />
        </button>
      )}

      {open && (
        <div
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            width: 380, maxWidth: "calc(100vw - 32px)",
            height: 520, maxHeight: "calc(100vh - 48px)",
            borderRadius: 20, overflow: "hidden",
            background: "#FFFFFF",
            boxShadow: "0 12px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
            display: "flex", flexDirection: "column",
          }}
          data-testid="panel-help-bot"
        >
          <div style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #0071E3, #34AADC)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#FFF", margin: 0 }}>{region === "EN" ? "Help & Support" : "Hilfe & Support"}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: "2px 0 0" }}>{region === "EN" ? "How can we help you?" : "Wie können wir dir helfen?"}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              data-testid="button-help-bot-close"
            >
              <X style={{ width: 16, height: 16, color: "#FFF" }} />
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div style={{
                  maxWidth: "82%", padding: "10px 14px", borderRadius: 14,
                  fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap",
                  ...(msg.role === "user"
                    ? { background: "#0071E3", color: "#FFF", borderBottomRightRadius: 4 }
                    : { background: "#F2F2F7", color: "#1D1D1F", borderBottomLeftRadius: 4 }),
                }} data-testid={`message-help-${msg.role}-${i}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
                <div style={{ background: "#F2F2F7", padding: "10px 14px", borderRadius: 14, borderBottomLeftRadius: 4 }}>
                  <Loader2 style={{ width: 16, height: 16, color: "#8E8E93", animation: "spin 1s linear infinite" }} />
                </div>
              </div>
            )}
            {showEscalate && !emailSent && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <button
                  onClick={handleEscalate}
                  disabled={escalateLoading}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(0,113,227,0.2)",
                    background: "rgba(0,113,227,0.06)", color: "#0071E3",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                  data-testid="button-help-escalate"
                >
                  {escalateLoading ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Mail style={{ width: 14, height: 14 }} />}
                  {region === "EN" ? "Send request to support" : "Anfrage an Support senden"}
                </button>
              </div>
            )}
            {emailSent && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#34C759", fontWeight: 600 }}>
                  <CheckCircle2 style={{ width: 14, height: 14 }} /> {region === "EN" ? "Email sent" : "E-Mail wurde gesendet"}
                </span>
              </div>
            )}
          </div>

          <div style={{ padding: "8px 12px 12px", borderTop: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={region === "EN" ? "Ask a question..." : "Frage eingeben..."}
                rows={1}
                style={{
                  flex: 1, resize: "none", border: "1.5px solid rgba(0,0,0,0.08)",
                  borderRadius: 12, padding: "10px 14px", fontSize: 13,
                  fontFamily: "Inter, sans-serif", outline: "none",
                  maxHeight: 80, lineHeight: 1.4,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,113,227,0.4)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
                data-testid="input-help-message"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: "none",
                  background: input.trim() ? "#0071E3" : "rgba(0,0,0,0.06)",
                  cursor: input.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 200ms ease", flexShrink: 0,
                }}
                data-testid="button-help-send"
              >
                <Send style={{ width: 16, height: 16, color: input.trim() ? "#FFF" : "#8E8E93" }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
