import { useState, useRef, useEffect, useCallback } from "react";
import { HelpCircle, X, Send, Loader2, Mail, CheckCircle2, Mic, MicOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useRegion } from "@/lib/region";
import { useUI } from "@/lib/ui-texts";
import { useToast } from "@/hooks/use-toast";
import { regionToBcp47Lang, cleanDictation, classifySpeechError, isSpeechRecognitionAvailable } from "@/lib/speech-input";

type Message = { role: "assistant" | "user"; content: string; isWelcome?: boolean };

export default function HelpBot() {
  const { user } = useAuth();
  const { region } = useRegion();
  const ui = useUI();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: ui.helpbot.welcome, isWelcome: true }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [escalateLoading, setEscalateLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const userStoppedRef = useRef(false);
  const baseTextRef = useRef("");
  const accumulatedFinalRef = useRef("");
  const lastMicErrorAtRef = useRef(0);
  const startedRef = useRef(false);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const speechSupported = isSpeechRecognitionAvailable();

  const showMicErrorToast = useCallback((title: string, description: string) => {
    const now = Date.now();
    if (now - lastMicErrorAtRef.current < 3000) return;
    lastMicErrorAtRef.current = now;
    toast({ title, description, variant: "destructive" });
  }, [toast]);

  useEffect(() => {
    if (recognitionRef.current) {
      userStoppedRef.current = true;
      try { recognitionRef.current.stop(); } catch {}
      try { recognitionRef.current.abort?.(); } catch {}
      recognitionRef.current = null;
      setIsListening(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  const startRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = regionToBcp47Lang(region);
    recognition.continuous = true;
    recognition.interimResults = true;
    console.log("[Mic][HelpBot] startRecognition() lang=", recognition.lang);

    recognition.onstart = () => {
      startedRef.current = true;
      console.log("[Mic][HelpBot] onstart fired");
      if (startTimeoutRef.current) { clearTimeout(startTimeoutRef.current); startTimeoutRef.current = null; }
    };
    recognition.onaudiostart = () => console.log("[Mic][HelpBot] onaudiostart");
    recognition.onspeechstart = () => console.log("[Mic][HelpBot] onspeechstart");

    recognition.onresult = (event: any) => {
      let interim = "";
      let newFinal = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) newFinal += transcript;
        else interim += transcript;
      }
      if (newFinal) {
        accumulatedFinalRef.current += (accumulatedFinalRef.current && !accumulatedFinalRef.current.endsWith(" ") ? " " : "") + newFinal;
      }
      const composed = accumulatedFinalRef.current + (interim ? " " + interim : "");
      const cleaned = cleanDictation(composed, region);
      const prefix = baseTextRef.current ? baseTextRef.current + (baseTextRef.current.endsWith(" ") || baseTextRef.current.endsWith("\n") ? "" : " ") : "";
      setInput(prefix + cleaned);
    };

    recognition.onend = () => {
      if (userStoppedRef.current) {
        recognitionRef.current = null;
        setIsListening(false);
        return;
      }
      try {
        const next = new SR();
        next.lang = regionToBcp47Lang(region);
        next.continuous = true;
        next.interimResults = true;
        next.onresult = recognition.onresult;
        next.onend = recognition.onend;
        next.onerror = recognition.onerror;
        baseTextRef.current = baseTextRef.current + (accumulatedFinalRef.current ? (baseTextRef.current.endsWith(" ") ? "" : " ") + cleanDictation(accumulatedFinalRef.current, region) : "");
        accumulatedFinalRef.current = "";
        recognitionRef.current = next;
        next.start();
      } catch {
        recognitionRef.current = null;
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      const kind = classifySpeechError(event.error);
      console.warn("[Mic][HelpBot] onerror code=", event.error, "kind=", kind, "message=", event.message);
      if (kind === "ignored") return;
      if (startTimeoutRef.current) { clearTimeout(startTimeoutRef.current); startTimeoutRef.current = null; }
      userStoppedRef.current = true;
      setIsListening(false);
      recognitionRef.current = null;
      if (kind === "permission") showMicErrorToast(ui.mic.permissionDeniedTitle, ui.mic.permissionDeniedDescription);
      else if (kind === "no-mic") showMicErrorToast(ui.mic.noMicTitle, ui.mic.noMicDescription);
      else if (kind === "network") showMicErrorToast(ui.mic.networkErrorTitle, ui.mic.networkErrorDescription);
      else showMicErrorToast(ui.mic.errorTitle, `${ui.mic.errorDescription} [${event.error}]`);
    };

    recognitionRef.current = recognition;
    startedRef.current = false;
    try {
      recognition.start();
      console.log("[Mic][HelpBot] recognition.start() called — waiting for onstart…");
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = setTimeout(() => {
        if (!startedRef.current && recognitionRef.current === recognition) {
          console.warn("[Mic][HelpBot] onstart did NOT fire within 4s — likely blocked");
          userStoppedRef.current = true;
          try { recognition.abort?.(); } catch {}
          try { recognition.stop(); } catch {}
          recognitionRef.current = null;
          setIsListening(false);
          showMicErrorToast(ui.mic.notStartingTitle, ui.mic.notStartingDescription);
        }
      }, 4000);
    } catch (e: any) {
      console.error("[Mic][HelpBot] recognition.start() THREW:", e?.name, e?.message, e);
      recognitionRef.current = null;
      setIsListening(false);
      showMicErrorToast(ui.mic.errorTitle, `${ui.mic.errorDescription} [${e?.name || "exception"}]`);
    }
  }, [region, showMicErrorToast, ui.mic]);

  const toggleListening = useCallback(() => {
    console.log("[Mic][HelpBot] toggleListening clicked — supported=", speechSupported, "isListening=", isListening, "region=", region, "secureContext=", typeof window !== "undefined" ? window.isSecureContext : "n/a");
    if (!speechSupported) {
      console.warn("[Mic][HelpBot] SpeechRecognition not available in window");
      return;
    }
    if (isListening) {
      userStoppedRef.current = true;
      try { recognitionRef.current?.stop(); } catch (e) { console.warn("[Mic][HelpBot] stop() threw", e); }
      setIsListening(false);
      return;
    }
    userStoppedRef.current = false;
    setInput((prev) => { baseTextRef.current = prev; return prev; });
    accumulatedFinalRef.current = "";
    setIsListening(true);
    startRecognition();
  }, [isListening, speechSupported, region, startRecognition]);

  useEffect(() => {
    return () => {
      userStoppedRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.onend = null; } catch {}
        try { recognitionRef.current.onresult = null; } catch {}
        try { recognitionRef.current.onerror = null; } catch {}
        try { recognitionRef.current.stop(); } catch {}
        try { recognitionRef.current.abort?.(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].isWelcome) {
        return [{ role: "assistant", content: ui.helpbot.welcome, isWelcome: true }];
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
    if (isListening) {
      userStoppedRef.current = true;
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
    }
    setInput("");
    setShowEscalate(false);

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await apiRequest("POST", "/api/help-bot", {
        messages: updated.filter((m) => !m.isWelcome),
        region,
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.cannotHelp) {
        setShowEscalate(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: ui.helpbot.error },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    setEscalateLoading(true);
    try {
      const conversation = messages
        .filter((m) => !m.isWelcome)
        .map((m) => `${m.role === "user" ? ui.helpbot.customer : "Bot"}: ${m.content}`)
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
        { role: "assistant", content: ui.helpbot.requestForwarded },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: ui.helpbot.emailFail },
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
              <p style={{ fontSize: 16, fontWeight: 700, color: "#FFF", margin: 0 }}>{ui.helpbot.title}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: "2px 0 0" }}>{ui.helpbot.subtitle}</p>
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
                  {ui.helpbot.sendSupport}
                </button>
              </div>
            )}
            {emailSent && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#34C759", fontWeight: 600 }}>
                  <CheckCircle2 style={{ width: 14, height: 14 }} /> {ui.helpbot.emailSent}
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
                placeholder={ui.helpbot.placeholder}
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
              {speechSupported ? (
                <button
                  onClick={toggleListening}
                  title={isListening ? ui.mic.stop : ui.mic.start}
                  aria-label={isListening ? ui.mic.stop : ui.mic.start}
                  style={{
                    width: 38, height: 38, borderRadius: 10, border: "none",
                    background: isListening
                      ? "linear-gradient(135deg, #FF3B30, #FF6B6B)"
                      : "rgba(0,0,0,0.06)",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 200ms ease", flexShrink: 0,
                    animation: isListening ? "micPulse 1.5s ease-in-out infinite" : "none",
                  }}
                  data-testid="button-help-mic"
                >
                  {isListening
                    ? <MicOff style={{ width: 16, height: 16, color: "#FFF" }} />
                    : <Mic style={{ width: 16, height: 16, color: "#8E8E93" }} />
                  }
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title={ui.mic.notSupported}
                  aria-label={ui.mic.notSupported}
                  style={{
                    width: 38, height: 38, borderRadius: 10, border: "none",
                    background: "rgba(0,0,0,0.04)",
                    cursor: "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, opacity: 0.5,
                  }}
                  data-testid="button-help-mic-unsupported"
                >
                  <MicOff style={{ width: 16, height: 16, color: "#8E8E93" }} />
                </button>
              )}
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
