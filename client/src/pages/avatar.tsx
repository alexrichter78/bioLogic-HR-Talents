import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Loader2, Mic, MicOff, Video, VideoOff, MessageSquare, Send } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskMode, TaskType, VoiceEmotion } from "@heygen/streaming-avatar";

const AVATAR_ID = "Katya_ProfessionalLook2_public";

const BIOLOGIC_KNOWLEDGE = `Du bist ein bioLogic Trainer und Coach. Du schulst Menschen im bioLogic-System.

bioLogic-System:
- Rot/Impulsiv: Handlungs- und Umsetzungskompetenz. Schnelle Entscheidungen, Durchsetzung, Tempo, Ergebnisorientierung.
- Gelb/Intuitiv: Sozial- und Beziehungskompetenz. Teamarbeit, Empathie, Moderation, Harmoniebedürfnis.
- Blau/Analytisch: Fach- und Methodenkompetenz. Struktur, Datenanalyse, Prozessoptimierung, Gründlichkeit.

Doppeldominanzen:
- Rot-Blau: Macher+Struktur. Umsetzungsstark UND methodisch.
- Rot-Gelb: Macher+Mensch. Durchsetzungsstark UND empathisch.
- Gelb-Blau: Mensch+Struktur. Empathisch UND strukturiert.

Trainingsaufgaben:
- Wenn der Nutzer eine Formulierung übt, analysiere ob sie zum Zieltyp passt.
- Für Rote: direkt, kurz, ergebnisorientiert. Keine Umschweife.
- Für Gelbe: wertschätzend, beziehungsorientiert, erst Brücke bauen.
- Für Blaue: sachlich, faktenbasiert, strukturiert, nachvollziehbar.
- Gib konkretes Feedback: Was war gut? Was könnte besser sein? Liefere eine Alternativformulierung.

Sprich Deutsch. Antworte kurz und prägnant (3-5 Sätze), da du als Avatar sprichst. Sei freundlich aber direkt.`;

export default function Avatar() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [statusText, setStatusText] = useState("Avatar nicht verbunden");
  const [chatLog, setChatLog] = useState<{ role: "user" | "avatar"; text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const avatarRef = useRef<StreamingAvatar | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  const fetchToken = useCallback(async (): Promise<string> => {
    const res = await fetch("/api/heygen-token", { method: "POST" });
    if (!res.ok) throw new Error("Token-Erstellung fehlgeschlagen");
    const data = await res.json();
    return data.token;
  }, []);

  const startSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatusText("Verbindung wird aufgebaut...");
    try {
      const token = await fetchToken();
      const avatar = new StreamingAvatar({ token });
      avatarRef.current = avatar;

      avatar.on(StreamingEvents.STREAM_READY, (event: any) => {
        if (videoRef.current && event.detail) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.play().catch(() => {});
        }
        setIsConnected(true);
        setIsLoading(false);
        setStatusText("Avatar bereit");
      });

      avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
        setIsTalking(true);
        setStatusText("Avatar spricht...");
      });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        setIsTalking(false);
        setStatusText("Avatar bereit");
      });

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        setIsConnected(false);
        setIsLoading(false);
        setStatusText("Verbindung getrennt");
        avatarRef.current = null;
      });

      await avatar.createStartAvatar({
        quality: AvatarQuality.Medium,
        avatarName: AVATAR_ID,
        language: "de",
        voice: { voiceId: "", rate: 1.0, emotion: VoiceEmotion.FRIENDLY },
        knowledgeBase: BIOLOGIC_KNOWLEDGE,
      });
    } catch (err: any) {
      console.error("Avatar start error:", err);
      setError(err.message || "Verbindung fehlgeschlagen");
      setIsLoading(false);
      setStatusText("Fehler bei der Verbindung");
    }
  }, [fetchToken]);

  const endSession = useCallback(async () => {
    if (avatarRef.current) {
      await avatarRef.current.stopAvatar();
      avatarRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsConnected(false);
    setIsTalking(false);
    setStatusText("Avatar nicht verbunden");
  }, []);

  const sendText = useCallback(async () => {
    const text = textInput.trim();
    if (!text || !avatarRef.current || !isConnected) return;

    setChatLog(prev => [...prev, { role: "user", text }]);
    setTextInput("");

    try {
      await avatarRef.current.speak({
        text,
        taskType: TaskType.TALK,
        taskMode: TaskMode.SYNC,
      });
      setChatLog(prev => [...prev, { role: "avatar", text: "(Antwort gesprochen)" }]);
    } catch (err: any) {
      console.error("Speak error:", err);
      setChatLog(prev => [...prev, { role: "avatar", text: "Fehler: Konnte nicht antworten." }]);
    }
  }, [textInput, isConnected]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)", display: "flex", flexDirection: "column" }} lang="de">
      <GlobalNav />

      <main style={{ flex: 1, maxWidth: 960, width: "100%", margin: "0 auto", padding: "24px 16px 24px", display: "flex", flexDirection: "column" }}>
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
              background: "rgba(196,30,58,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Video style={{ width: 20, height: 20, color: "#C41E3A" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }} data-testid="text-page-title">bioLogic Avatar-Trainer</h1>
              <p style={{ fontSize: 11, color: "#8E8E93", margin: "2px 0 0" }}>Interaktives Training · bioLogic-System · Formulierungen üben</p>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "4px 12px", borderRadius: 20,
              background: isConnected ? "rgba(52,199,89,0.1)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${isConnected ? "rgba(52,199,89,0.2)" : "rgba(0,0,0,0.06)"}`,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: 3,
                background: isConnected ? "#34C759" : "#8E8E93",
              }} />
              <span style={{ fontSize: 11, color: isConnected ? "#34C759" : "#8E8E93", fontWeight: 500 }}>
                {statusText}
              </span>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{
              display: "flex", flex: 1, gap: 0,
            }}>
              <div style={{
                flex: "0 0 55%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: 20, background: "#000",
                position: "relative",
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  data-testid="avatar-video"
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "contain",
                    borderRadius: 0,
                    display: isConnected ? "block" : "none",
                  }}
                />
                {!isConnected && (
                  <div style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 16, padding: 40,
                  }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: 24,
                      background: "rgba(255,255,255,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Video style={{ width: 36, height: 36, color: "rgba(255,255,255,0.4)" }} />
                    </div>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: 280 }}>
                      Starte den Avatar-Trainer, um interaktiv das bioLogic-System zu üben.
                    </p>
                    <button
                      onClick={startSession}
                      disabled={isLoading}
                      data-testid="button-start-avatar"
                      style={{
                        padding: "12px 32px", borderRadius: 14, border: "none",
                        background: isLoading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #C41E3A, #E85D75)",
                        color: "#FFFFFF", fontSize: 15, fontWeight: 600,
                        cursor: isLoading ? "default" : "pointer",
                        display: "flex", alignItems: "center", gap: 8,
                        transition: "all 200ms ease",
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                          Verbindung wird aufgebaut...
                        </>
                      ) : (
                        <>
                          <Video style={{ width: 16, height: 16 }} />
                          Avatar starten
                        </>
                      )}
                    </button>
                    {error && (
                      <p style={{ fontSize: 12, color: "#FF6B6B", textAlign: "center", maxWidth: 300 }}>
                        {error}
                      </p>
                    )}
                  </div>
                )}
                {isConnected && (
                  <button
                    onClick={endSession}
                    data-testid="button-stop-avatar"
                    style={{
                      position: "absolute", bottom: 16, right: 16,
                      padding: "8px 16px", borderRadius: 10, border: "none",
                      background: "rgba(255,59,48,0.85)", color: "#FFFFFF",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <VideoOff style={{ width: 13, height: 13 }} />
                    Beenden
                  </button>
                )}
              </div>

              <div style={{
                flex: "0 0 45%", display: "flex", flexDirection: "column",
                borderLeft: "1px solid rgba(0,0,0,0.06)",
              }}>
                <div style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <MessageSquare style={{ width: 14, height: 14, color: "#6E6E73" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>Chat</span>
                </div>

                <div style={{
                  flex: 1, overflowY: "auto", padding: "16px 20px",
                  display: "flex", flexDirection: "column", gap: 10,
                  minHeight: 200,
                }} data-testid="avatar-chat">
                  {chatLog.length === 0 && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 20 }}>
                      <Bot style={{ width: 28, height: 28, color: "#C7C7CC" }} />
                      <p style={{ fontSize: 12, color: "#8E8E93", textAlign: "center", lineHeight: 1.5, maxWidth: 240 }}>
                        Starte den Avatar und stelle eine Frage oder übe eine Formulierung.
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginTop: 8 }}>
                        {[
                          "Erkläre mir das bioLogic-System kurz.",
                          "Ich soll einem Roten sagen, dass sein Projekt verschoben wird. Wie formuliere ich das?",
                          "Mein Satz an einen Gelben: 'Die Zahlen stimmen nicht, das muss sofort geändert werden.' War das gut?",
                        ].map((hint, i) => (
                          <button
                            key={i}
                            onClick={() => setTextInput(hint)}
                            data-testid={`hint-${i}`}
                            style={{
                              textAlign: "left", padding: "8px 12px",
                              border: "1px solid rgba(0,0,0,0.06)",
                              borderRadius: 10, cursor: "pointer",
                              background: "rgba(0,0,0,0.02)",
                              fontSize: 11.5, lineHeight: 1.4, color: "#3A3A3C",
                              transition: "all 150ms ease",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(196,30,58,0.05)"; e.currentTarget.style.borderColor = "rgba(196,30,58,0.15)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)"; }}
                          >
                            {hint}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {chatLog.map((msg, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 8,
                      flexDirection: msg.role === "user" ? "row-reverse" : "row",
                      alignItems: "flex-start",
                    }} data-testid={`chat-msg-${i}`}>
                      <div style={{
                        maxWidth: "80%",
                        padding: "8px 12px",
                        borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        background: msg.role === "user"
                          ? "linear-gradient(135deg, #C41E3A, #E85D75)"
                          : "rgba(0,0,0,0.04)",
                        color: msg.role === "user" ? "#FFFFFF" : "#1D1D1F",
                        fontSize: 12.5, lineHeight: 1.5,
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div style={{
                  padding: "12px 20px 16px",
                  borderTop: "1px solid rgba(0,0,0,0.06)",
                  background: "rgba(255,255,255,0.5)",
                }}>
                  <div style={{
                    display: "flex", gap: 8, alignItems: "flex-end",
                    background: "rgba(0,0,0,0.03)",
                    borderRadius: 16, padding: "8px 10px 8px 14px",
                    border: "1px solid rgba(0,0,0,0.06)",
                    opacity: isConnected ? 1 : 0.5,
                  }}>
                    <textarea
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isConnected ? "Frage stellen oder Formulierung üben..." : "Bitte erst den Avatar starten"}
                      disabled={!isConnected}
                      data-testid="input-avatar-chat"
                      rows={1}
                      style={{
                        flex: 1, border: "none", outline: "none", background: "none",
                        fontSize: 13, color: "#1D1D1F", resize: "none",
                        lineHeight: 1.5, maxHeight: 80, minHeight: 24,
                        fontFamily: "inherit",
                      }}
                      onInput={e => {
                        const t = e.currentTarget;
                        t.style.height = "24px";
                        t.style.height = Math.min(t.scrollHeight, 80) + "px";
                      }}
                    />
                    <button
                      onClick={sendText}
                      disabled={!isConnected || !textInput.trim() || isTalking}
                      data-testid="button-send-avatar"
                      style={{
                        width: 32, height: 32, borderRadius: 10, border: "none",
                        background: textInput.trim() && isConnected && !isTalking
                          ? "linear-gradient(135deg, #C41E3A, #E85D75)"
                          : "rgba(0,0,0,0.06)",
                        cursor: textInput.trim() && isConnected && !isTalking ? "pointer" : "default",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, transition: "all 200ms ease",
                      }}
                    >
                      <Send style={{
                        width: 14, height: 14,
                        color: textInput.trim() && isConnected && !isTalking ? "#FFFFFF" : "#C7C7CC",
                      }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
