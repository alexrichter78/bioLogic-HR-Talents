import { useLocation } from "wouter";
import { ArrowLeft, FileText, AlertTriangle, Check, Shield, TrendingUp, Target, Users, Zap, Brain, Scale, Clock, ChevronRight, CircleAlert, CircleCheck, CircleMinus, BarChart3, Lightbulb, CalendarDays } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";
import { hyphenateText } from "@/lib/hyphenate";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };

function GlassCard({ children, style, testId }: { children: React.ReactNode; style?: React.CSSProperties; testId?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.78)",
      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      borderRadius: 32, padding: "36px 32px",
      boxShadow: "0 2px 20px rgba(0,0,0,0.03), 0 12px 48px rgba(0,0,0,0.05)",
      border: "1px solid rgba(255,255,255,0.7)",
      ...style,
    }} data-testid={testId}>{children}</div>
  );
}

function ChapterBadge({ num, color }: { num: number; color: string }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 12,
      background: `linear-gradient(135deg, ${color}, ${color}CC)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginRight: 14, flexShrink: 0,
      boxShadow: `0 4px 12px ${color}30`,
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#FFF", fontVariantNumeric: "tabular-nums" }}>
        {String(num).padStart(2, "0")}
      </span>
    </div>
  );
}

function SoftBar({ items }: { items: { label: string; value: number; color: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map(bar => (
        <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6E6E73", width: 62, flexShrink: 0 }}>{bar.label}</span>
          <div style={{ flex: 1, height: 24, borderRadius: 6, background: "rgba(0,0,0,0.04)", overflow: "hidden", position: "relative" }}>
            <div style={{
              width: `${Math.max(bar.value, 2)}%`,
              height: "100%", borderRadius: 6, background: bar.color,
              transition: "width 600ms ease",
              display: "flex", alignItems: "center", paddingLeft: 8,
              minWidth: 40,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>{bar.value} %</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BulletList({ items, icon, color }: { items: string[]; icon?: "check" | "dot" | "arrow"; color?: string }) {
  const c = color || "#6E6E73";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {icon === "check" ? (
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
              background: `${c}12`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check style={{ width: 11, height: 11, color: c, strokeWidth: 2.5 }} />
            </div>
          ) : (
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: c, marginTop: 7, flexShrink: 0, opacity: 0.5 }} />
          )}
          <span style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.7, textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">{hyphenateText(item)}</span>
        </div>
      ))}
    </div>
  );
}

function CalloutBox({ text, color, icon: Icon }: { text: string; color: string; icon?: typeof Lightbulb }) {
  const IconComp = Icon || Lightbulb;
  return (
    <div style={{
      padding: "16px 20px", borderRadius: 18,
      background: `linear-gradient(135deg, ${color}0A, ${color}04)`,
      border: `1px solid ${color}15`,
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 9, flexShrink: 0,
        background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <IconComp style={{ width: 14, height: 14, color, strokeWidth: 2 }} />
      </div>
      <p style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.75, margin: 0, fontWeight: 450, textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">{hyphenateText(text)}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "geeignet" | "bedingt" | "kritisch" }) {
  const config = {
    geeignet: { icon: CircleCheck, color: "#34C759", bg: "rgba(52,199,89,0.08)", label: "Geeignet" },
    bedingt: { icon: CircleMinus, color: "#FF9500", bg: "rgba(255,149,0,0.08)", label: "Bedingt geeignet" },
    kritisch: { icon: CircleAlert, color: "#C41E3A", bg: "rgba(196,30,58,0.08)", label: "Kritisch" },
  }[status];
  const Icon = config.icon;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px", borderRadius: 10,
      background: config.bg, border: `1px solid ${config.color}20`,
    }}>
      <Icon style={{ width: 13, height: 13, color: config.color, strokeWidth: 2.2 }} />
      <span style={{ fontSize: 12, fontWeight: 650, color: config.color }}>{config.label}</span>
    </div>
  );
}

function MatrixRow({ bereich, status, begruendung }: { bereich: string; status: "geeignet" | "bedingt" | "kritisch"; begruendung: string }) {
  return (
    <div style={{
      padding: "16px 18px", borderRadius: 16,
      background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 650, color: "#1D1D1F" }}>{bereich}</span>
        <StatusBadge status={status} />
      </div>
      <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.65, margin: 0, textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">{hyphenateText(begruendung)}</p>
    </div>
  );
}

function TimelinePhase({ phase, title, items, ziel, color }: { phase: string; title: string; items: string[]; ziel: string; color: string }) {
  return (
    <div style={{
      position: "relative", paddingLeft: 32,
      borderLeft: `3px solid ${color}25`,
    }}>
      <div style={{
        position: "absolute", left: -8, top: 0,
        width: 14, height: 14, borderRadius: "50%",
        background: color, border: "3px solid #FFFFFF",
        boxShadow: `0 2px 8px ${color}40`,
      }} />
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: `${color}10`, borderRadius: 8, padding: "3px 10px", marginBottom: 10,
      }}>
        <CalendarDays style={{ width: 11, height: 11, color, strokeWidth: 2 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.02em" }}>{phase}</span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>{title}</p>
      <BulletList items={items} color={color} />
      <div style={{
        marginTop: 14, padding: "12px 16px", borderRadius: 14,
        background: `linear-gradient(135deg, ${color}08, ${color}04)`,
        borderLeft: `4px solid ${color}50`,
      }}>
        <p style={{ fontSize: 12.5, color: "#48484A", lineHeight: 1.7, margin: 0, fontWeight: 500, fontStyle: "italic" }} lang="de">{hyphenateText(ziel)}</p>
      </div>
    </div>
  );
}

export default function JobCheck() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden" lang="de" data-testid="jobcheck-page">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 20% 60%, rgba(252,205,210,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 100% 70% at 80% 30%, rgba(186,220,248,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(200,235,210,0.3) 0%, transparent 50%)",
          animation: "gradientShift 20s ease-in-out infinite alternate",
        }}
      />

      <style>{`
        @keyframes gradientShift {
          0% { transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.05) translate(-1%, 1%); }
          66% { transform: scale(1.02) translate(1%, -1%); }
          100% { transform: scale(1) translate(0, 0); }
        }
      `}</style>

      <div className="relative z-10">
        <div style={{ position: "sticky", top: 0, zIndex: 200 }}>
          <div style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", background: "rgba(255,255,255,0.75)", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
            <header className="flex items-center justify-between gap-4 px-6 py-3" data-testid="header-jobcheck">
              <div className="flex items-center gap-3">
                <button onClick={() => setLocation("/bericht")} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 10, background: "rgba(0,0,0,0.04)", border: "none", cursor: "pointer" }} data-testid="button-back-jobcheck">
                  <ArrowLeft style={{ width: 16, height: 16, color: "#6E6E73" }} />
                </button>
                <img src={logoSrc} alt="bioLogic Logo" className="h-6 w-auto" data-testid="logo-jobcheck" />
              </div>
            </header>
          </div>
        </div>

        <main className="flex-1 w-full max-w-2xl mx-auto px-5 pb-24 pt-10">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <GlassCard testId="jobcheck-header" style={{ padding: "36px 32px 30px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(52,170,220,0.04))", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,113,227,0.04), rgba(52,170,220,0.03))", pointerEvents: "none" }} />

              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "linear-gradient(135deg, rgba(0,113,227,0.1), rgba(52,170,220,0.06))",
                borderRadius: 20, padding: "5px 14px", marginBottom: 14,
              }}>
                <Shield style={{ width: 12, height: 12, color: "#0071E3" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.12em" }}>Recruiting-Entscheidungsgrundlage – Level 2</span>
              </div>

              <h1 style={{ fontSize: 28, fontWeight: 750, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1.15, marginBottom: 4 }} data-testid="text-jobcheck-title">
                bioLogic JobCheck
              </h1>
              <p style={{ fontSize: 15, color: "#6E6E73", marginBottom: 16, fontWeight: 500 }} data-testid="text-jobcheck-position">Vertriebsleiter B2C</p>

              <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#3A3A3C", background: "rgba(0,0,0,0.04)", padding: "6px 14px", borderRadius: 10 }}>
                  Vertrieb & Marketing › Vertrieb
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#3A3A3C", background: "rgba(0,0,0,0.04)", padding: "6px 14px", borderRadius: 10 }}>
                  Ergebnis-/Umsatzdruck, Führung & Koordination
                </span>
              </div>

              <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 14 }}>25.02.2026</p>
            </GlassCard>

            <GlassCard testId="jobcheck-summary" style={{ padding: "30px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <ChapterBadge num={1} color="#0071E3" />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Management Summary</span>
              </div>

              <div style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 18,
                padding: "16px 20px", borderRadius: 18,
                background: "linear-gradient(135deg, rgba(255,149,0,0.08), rgba(255,149,0,0.03))",
                border: "1px solid rgba(255,149,0,0.15)",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: "rgba(255,149,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <AlertTriangle style={{ width: 20, height: 20, color: "#FF9500", strokeWidth: 2 }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#FF9500", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Gesamteinstufung der strukturellen Passung</p>
                  <p style={{ fontSize: 18, fontWeight: 750, color: "#1D1D1F", margin: 0 }}>Bedingt geeignet</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <CalloutBox text="Die strukturelle Passung ist grundsätzlich gegeben, jedoch mit klar erkennbarer Dominanzabweichung in der primären Steuerungskomponente." color="#FF9500" icon={Lightbulb} />
                <p style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">
                  {hyphenateText("Die Rolle ist impulsiv-dominant geprägt und verlangt Tempo, Durchsetzungskraft und unmittelbare Ergebnisintervention.")}
                </p>
                <p style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">
                  {hyphenateText("Das Kandidatenprofil ist intuitiv-dominant und priorisiert Beziehungsstabilität, Konsens und Teamharmonie.")}
                </p>
                <p style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">
                  {hyphenateText("Eine Besetzung ist möglich, erfordert jedoch klare Steuerungsmechanismen, verbindliche KPI-Führung und ein strukturiertes Integrations-Setup.")}
                </p>
              </div>
            </GlassCard>

            <GlassCard testId="jobcheck-rollen-dna" style={{ padding: "30px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <ChapterBadge num={2} color="#0071E3" />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Rollen-DNA (Soll)</span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <SoftBar items={[
                  { label: "Impulsiv", value: 48, color: COLORS.imp },
                  { label: "Intuitiv", value: 30, color: COLORS.int },
                  { label: "Analytisch", value: 22, color: COLORS.ana },
                ]} />
              </div>

              <CalloutBox text="Die dominante Logik der Rolle ist impulsiv geprägt." color={COLORS.imp} icon={Zap} />

              <p style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.85, margin: "16px 0 0", textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">
                {hyphenateText("Tempo, Durchsetzungsfähigkeit und klare Richtungsentscheidungen stehen im Zentrum. Die Position wirkt steuernd über:")}
              </p>

              <div style={{ marginTop: 12 }}>
                <BulletList items={[
                  "Entscheidungsstärke",
                  "Konfliktfähigkeit",
                  "unmittelbare Umsetzung",
                ]} icon="check" color={COLORS.imp} />
              </div>

              <div style={{
                marginTop: 18, padding: "14px 18px", borderRadius: 14,
                background: "linear-gradient(135deg, rgba(196,30,58,0.06), rgba(196,30,58,0.02))",
                borderLeft: `4px solid ${COLORS.imp}50`,
              }}>
                <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.75, margin: 0, fontStyle: "italic", fontWeight: 450, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">
                  {hyphenateText("Risiken der Rolle entstehen typischerweise durch Übersteuerung, Ungeduld oder Regelverkürzung.")}
                </p>
              </div>
            </GlassCard>

            <GlassCard testId="jobcheck-kandidat" style={{ padding: "30px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <ChapterBadge num={3} color="#0071E3" />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Kandidatenprofil (Ist)</span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <SoftBar items={[
                  { label: "Impulsiv", value: 35, color: COLORS.imp },
                  { label: "Intuitiv", value: 37, color: COLORS.int },
                  { label: "Analytisch", value: 28, color: COLORS.ana },
                ]} />
              </div>

              <CalloutBox text="Die dominante Logik des Kandidaten ist intuitiv geprägt." color={COLORS.int} icon={Users} />

              <p style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.85, margin: "16px 0 0", textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">
                {hyphenateText("Anschlussfähigkeit, Kommunikationsstärke und Teamstabilität stehen im Vordergrund. Das Profil wirkt integrierend über:")}
              </p>

              <div style={{ marginTop: 12 }}>
                <BulletList items={[
                  "Beziehung",
                  "Moderation",
                  "situative Wahrnehmung",
                ]} icon="check" color={COLORS.int} />
              </div>

              <div style={{
                marginTop: 18, padding: "14px 18px", borderRadius: 14,
                background: "linear-gradient(135deg, rgba(243,146,0,0.06), rgba(243,146,0,0.02))",
                borderLeft: `4px solid ${COLORS.int}50`,
              }}>
                <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.75, margin: 0, fontStyle: "italic", fontWeight: 450, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">
                  {hyphenateText("Risiken entstehen typischerweise durch Konfliktvermeidung, Entscheidungsaufschub oder Unschärfe in Leistungsabgrenzung.")}
                </p>
              </div>
            </GlassCard>

            <GlassCard testId="jobcheck-dominanz" style={{ padding: "30px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <ChapterBadge num={4} color="#0071E3" />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Dominanz-Verschiebung</span>
              </div>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20,
                padding: "20px 24px", borderRadius: 18,
                background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)",
              }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Soll</p>
                  <div style={{
                    padding: "6px 16px", borderRadius: 10,
                    background: `${COLORS.imp}12`, border: `1px solid ${COLORS.imp}25`,
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.imp }}>Impulsiv</span>
                  </div>
                </div>

                <ChevronRight style={{ width: 20, height: 20, color: "#8E8E93" }} />

                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Ist</p>
                  <div style={{
                    padding: "6px 16px", borderRadius: 10,
                    background: `${COLORS.int}12`, border: `1px solid ${COLORS.int}25`,
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.int }}>Intuitiv</span>
                  </div>
                </div>
              </div>

              <CalloutBox text="Die dominante Steuerungslogik des Kandidaten unterscheidet sich strukturell von der dominanten Logik der Rolle." color="#FF9500" icon={Scale} />

              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 10 }}>Systemwirkung</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{
                    padding: "16px 18px", borderRadius: 16,
                    background: "rgba(52,199,89,0.04)", border: "1px solid rgba(52,199,89,0.12)",
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#34C759", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Kurzfristig</p>
                    <BulletList items={[
                      "positives Teamklima",
                      "erhöhte Motivation",
                      "integrative Führung",
                    ]} color="#34C759" />
                  </div>

                  <div style={{
                    padding: "16px 18px", borderRadius: 16,
                    background: "rgba(196,30,58,0.04)", border: "1px solid rgba(196,30,58,0.12)",
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.imp, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Langfristig möglich</p>
                    <BulletList items={[
                      "reduzierte Zielhärte",
                      "Entscheidungsaufschub",
                      "nachlassende Ergebnisdisziplin",
                    ]} color={COLORS.imp} />
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: 18, padding: "14px 18px", borderRadius: 14,
                background: "linear-gradient(135deg, rgba(255,149,0,0.06), rgba(255,149,0,0.02))",
                borderLeft: "4px solid rgba(255,149,0,0.5)",
              }}>
                <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.75, margin: 0, fontStyle: "italic", fontWeight: 450, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">
                  {hyphenateText("Die Position verschiebt sich von Leistungsarchitektur hin zu Beziehungsarchitektur.")}
                </p>
              </div>
            </GlassCard>

            <GlassCard testId="jobcheck-matrix" style={{ padding: "30px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <ChapterBadge num={5} color="#0071E3" />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Strukturelle Eignungsmatrix</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <MatrixRow bereich="Gesamtdominanz" status="bedingt" begruendung="Dominanzverschiebung vorhanden, jedoch Impulsiv-Anteil nicht kritisch niedrig. Steuerbar." />
                <MatrixRow bereich="Entscheidungslogik" status="bedingt" begruendung="Tendenz zur Absicherung statt Direktintervention. Erfordert klare Entscheidungsregeln." />
                <MatrixRow bereich="KPI- & Performance-Führung" status="bedingt" begruendung="Analytische Basis vorhanden. Muss strukturell verankert werden." />
                <MatrixRow bereich="Konfliktfähigkeit" status="kritisch" begruendung="Risiko von Konfliktvermeidung bei Low-Performance." />
                <MatrixRow bereich="Teamführung & Motivation" status="geeignet" begruendung="Hohe Anschlussfähigkeit und Teamstabilisierung." />
                <MatrixRow bereich="Wettbewerbsdynamik" status="bedingt" begruendung="Druckaufbau geringer als rollenseitig vorgesehen." />
                <MatrixRow bereich="Kulturelle Wirkung" status="bedingt" begruendung="Kann Kultur stabilisieren, aber Leistungsarchitektur abschwächen." />
              </div>
            </GlassCard>

            <GlassCard testId="jobcheck-kernbefund" style={{ padding: "30px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <ChapterBadge num={6} color="#0071E3" />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Entscheidungsrelevanter Kernbefund</span>
              </div>

              <CalloutBox text="Die dominante Logik des Kandidaten unterscheidet sich von der strukturellen Kernanforderung der Rolle." color="#0071E3" icon={Target} />

              <p style={{ fontSize: 14, fontWeight: 650, color: "#1D1D1F", margin: "18px 0 10px" }}>Dadurch verändert sich die Systemwirkung der Position:</p>

              <BulletList items={[
                "Entscheidungsrhythmen verlängern sich",
                "Leistungsdifferenzierung wird moderater",
                "Zielhärte kann nachlassen",
              ]} color="#0071E3" />

              <div style={{
                marginTop: 18, padding: "14px 18px", borderRadius: 14,
                background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(0,113,227,0.02))",
                borderLeft: "4px solid rgba(0,113,227,0.5)",
              }}>
                <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.75, margin: 0, fontStyle: "italic", fontWeight: 450, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">
                  {hyphenateText("Eine Besetzung ist möglich, jedoch nicht selbststabilisierend.")}
                </p>
              </div>
            </GlassCard>

            <GlassCard testId="jobcheck-risiko" style={{ padding: "30px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <ChapterBadge num={7} color="#0071E3" />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Konkrete Risikoausprägung</span>
              </div>

              <CalloutBox text="Die impulsive Komponente ist niedriger ausgeprägt als rollenseitig erforderlich." color={COLORS.imp} icon={AlertTriangle} />

              <p style={{ fontSize: 14, fontWeight: 650, color: "#1D1D1F", margin: "18px 0 10px" }}>Mögliche Effekte:</p>

              <BulletList items={[
                "Zögern bei Zielabweichungen",
                "reduzierte Durchsetzung",
                "ausweichende Konfliktführung",
                "schwächere Umsetzungsdynamik",
              ]} color={COLORS.imp} />

              <p style={{ fontSize: 14, fontWeight: 650, color: "#1D1D1F", margin: "20px 0 10px" }}>Führung muss stärker über:</p>

              <BulletList items={[
                "klare Entscheidungsbefugnisse",
                "verbindliche KPI-Rhythmen",
                "definierte Eskalationsregeln",
              ]} icon="check" color="#0071E3" />

              <div style={{
                marginTop: 18, padding: "14px 18px", borderRadius: 14,
                background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(0,113,227,0.02))",
                borderLeft: "4px solid rgba(0,113,227,0.5)",
              }}>
                <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.75, margin: 0, fontStyle: "italic", fontWeight: 450 }}>gesteuert werden.</p>
              </div>
            </GlassCard>

            <GlassCard testId="jobcheck-entwicklung" style={{ padding: "30px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <ChapterBadge num={8} color="#0071E3" />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Entwicklungsprognose</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{
                  padding: "16px 18px", borderRadius: 16,
                  background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)", textAlign: "center",
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Entwicklungswahrscheinlichkeit</p>
                  <p style={{ fontSize: 20, fontWeight: 750, color: "#FF9500", margin: 0 }}>Mittel</p>
                </div>
                <div style={{
                  padding: "16px 18px", borderRadius: 16,
                  background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)", textAlign: "center",
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Anpassungszeitraum</p>
                  <p style={{ fontSize: 20, fontWeight: 750, color: "#0071E3", margin: 0 }}>6–12 Monate</p>
                </div>
              </div>

              <CalloutBox text="Eine strukturelle Dominanzverschiebung ist stabiler als kurzfristige Trainingsimpulse." color="#FF9500" icon={TrendingUp} />

              <p style={{ fontSize: 14, fontWeight: 650, color: "#1D1D1F", margin: "18px 0 10px" }}>Eine erfolgreiche Integration setzt voraus:</p>

              <BulletList items={[
                "klare Führungsarchitektur",
                "regelmäßige Review-Rhythmen",
                "transparente Leistungsanforderungen",
              ]} icon="check" color="#0071E3" />

              <div style={{
                marginTop: 18, padding: "14px 18px", borderRadius: 14,
                background: "linear-gradient(135deg, rgba(196,30,58,0.06), rgba(196,30,58,0.02))",
                borderLeft: `4px solid ${COLORS.imp}50`,
              }}>
                <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.75, margin: 0, fontStyle: "italic", fontWeight: 450, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">
                  {hyphenateText("Ohne diese Rahmenbedingungen sinkt die Entwicklungswahrscheinlichkeit.")}
                </p>
              </div>
            </GlassCard>

            <GlassCard testId="jobcheck-90tage" style={{ padding: "30px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                <ChapterBadge num={9} color="#0071E3" />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Handlungsempfehlung – 90-Tage-Integrationsplan</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <TimelinePhase
                  phase="0–30 Tage"
                  title="Entscheidungs- und Durchsetzungslogik klären"
                  color="#0071E3"
                  items={[
                    "Schriftliche Definition der Entscheidungsbefugnisse",
                    "Klare Zieldefinition mit messbaren Ergebniserwartungen",
                    "Einführung verbindlicher KPI-Reviews",
                    "Wöchentliches strukturiertes 1:1 mit Fokus auf Entscheidungsverhalten",
                    "Dokumentation kritischer Entscheidungen",
                  ]}
                  ziel="Ziel: Entscheidungsstärke wird bewusst trainiert und reflektiert."
                />

                <TimelinePhase
                  phase="30–60 Tage"
                  title="Übersteuerung vs. Untersteuerung stabilisieren"
                  color="#F39200"
                  items={[
                    "Verbindliche Entscheidungsfristen",
                    "Sichtbare Verantwortungsübertragung",
                    "Vorbereitung/Nachbereitung von Konfliktgesprächen",
                    "Zielklarheit regelmäßig überprüfen",
                    "Training von Durchsetzungsfähigkeit in realen Situationen",
                  ]}
                  ziel="Ziel: Durchsetzung wird reproduzierbar und rollenkonform."
                />

                <TimelinePhase
                  phase="60–90 Tage"
                  title="Strukturelle Stabilisierung"
                  color="#34C759"
                  items={[
                    "Prüfen, ob Entscheidungen eigenständig und regelkonform getroffen werden",
                    "Ergebnisstabilität bewerten (nicht nur kurzfristige Performance)",
                    "Führungsintervention schrittweise reduzieren",
                    "Konfliktqualität beurteilen",
                    "Entscheidung über dauerhafte Stabilität oder weiteren Entwicklungsbedarf",
                  ]}
                  ziel="Ziel: Der Kandidat zeigt rollenkonformes Entscheidungsverhalten ohne permanente Steuerung."
                />
              </div>
            </GlassCard>

            <GlassCard testId="jobcheck-gesamtbewertung" style={{ padding: "30px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <ChapterBadge num={10} color="#0071E3" />
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Gesamtbewertung</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{
                  padding: "14px 18px", borderRadius: 16,
                  background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)",
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Strukturelle Grundpassung</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#FF9500", margin: 0 }}>Mittel</p>
                </div>
                <div style={{
                  padding: "14px 18px", borderRadius: 16,
                  background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)",
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Steuerungsbedarf</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.imp, margin: 0 }}>Hoch</p>
                </div>
                <div style={{
                  padding: "14px 18px", borderRadius: 16,
                  background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)",
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Kritischer Bereich</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Konflikt- und Durchsetzungsdominanz</p>
                </div>
                <div style={{
                  padding: "14px 18px", borderRadius: 16,
                  background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)",
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Empfehlung</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0071E3", margin: 0 }}>Besetzung möglich mit Integrations-Setup</p>
                </div>
              </div>

              <div style={{
                padding: "18px 22px", borderRadius: 18,
                background: "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.04))",
                border: "1px solid rgba(0,113,227,0.12)",
              }}>
                <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.85, margin: 0, fontWeight: 500, textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">
                  {hyphenateText("Die Besetzung ist nicht risikofrei, jedoch entwicklungsfähig, sofern klare Leistungsarchitektur etabliert wird.")}
                </p>
              </div>
            </GlassCard>

          </div>
        </main>
      </div>
    </div>
  );
}
