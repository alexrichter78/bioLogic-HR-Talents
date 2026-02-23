import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

export default function Analyse() {
  const [, setLocation] = useLocation();
  const [bereich1, setBereich1] = useState("");
  const [bereich2, setBereich2] = useState("");
  const [bereich3, setBereich3] = useState("");

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 20% 60%, rgba(252,205,210,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 100% 70% at 80% 30%, rgba(186,220,248,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(200,235,210,0.3) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="flex items-center justify-between gap-4 px-6 py-4" data-testid="header-analyse">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-back-analyse"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img src={logoSrc} alt="bioLogic Logo" className="h-7 w-auto" data-testid="logo-analyse" />
            <span className="text-sm text-muted-foreground/70 font-light tracking-wide hidden sm:inline">Analyse</span>
          </div>
        </header>

        <main className="flex-1 w-full max-w-3xl mx-auto px-6 pb-20">
          <div className="text-center mt-8 mb-10">
            <h1
              className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground/90 mb-2"
              data-testid="text-analyse-title"
            >
              Analyse
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-analyse-subtitle">
              Interne Analysebereiche
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div
              style={{
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderRadius: 20,
                padding: "24px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
                border: "1px solid rgba(0,0,0,0.04)",
              }}
            >
              <label style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 8, display: "block" }} data-testid="label-bereich1">
                Bereich 1
              </label>
              <textarea
                value={bereich1}
                onChange={(e) => setBereich1(e.target.value)}
                placeholder="Text eingeben..."
                rows={6}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1.5px solid rgba(0,0,0,0.08)",
                  padding: "12px 14px",
                  fontSize: 14,
                  fontFamily: "Inter, sans-serif",
                  color: "#1D1D1F",
                  background: "rgba(255,255,255,0.6)",
                  resize: "vertical",
                  outline: "none",
                  transition: "border-color 200ms ease",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,113,227,0.4)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
                data-testid="textarea-bereich1"
              />
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderRadius: 20,
                padding: "24px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
                border: "1px solid rgba(0,0,0,0.04)",
              }}
            >
              <label style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 8, display: "block" }} data-testid="label-bereich2">
                Bereich 2
              </label>
              <textarea
                value={bereich2}
                onChange={(e) => setBereich2(e.target.value)}
                placeholder="Text eingeben..."
                rows={6}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1.5px solid rgba(0,0,0,0.08)",
                  padding: "12px 14px",
                  fontSize: 14,
                  fontFamily: "Inter, sans-serif",
                  color: "#1D1D1F",
                  background: "rgba(255,255,255,0.6)",
                  resize: "vertical",
                  outline: "none",
                  transition: "border-color 200ms ease",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,113,227,0.4)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
                data-testid="textarea-bereich2"
              />
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderRadius: 20,
                padding: "24px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
                border: "1px solid rgba(0,0,0,0.04)",
              }}
            >
              <label style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 8, display: "block" }} data-testid="label-bereich3">
                Bereich 3
              </label>
              <textarea
                value={bereich3}
                onChange={(e) => setBereich3(e.target.value)}
                placeholder="Text eingeben..."
                rows={6}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1.5px solid rgba(0,0,0,0.08)",
                  padding: "12px 14px",
                  fontSize: 14,
                  fontFamily: "Inter, sans-serif",
                  color: "#1D1D1F",
                  background: "rgba(255,255,255,0.6)",
                  resize: "vertical",
                  outline: "none",
                  transition: "border-color 200ms ease",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,113,227,0.4)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
                data-testid="textarea-bereich3"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
