import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle, AlertTriangle, Shield, TrendingUp, Clock, Target,
  Zap, BarChart3, FileDown, ChevronRight,
} from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { hyphenateText } from "@/lib/hyphenate";
import {
  type TeamCheckInput, type TeamCheckResult, type UrteilBadge,
  computeTeamCheck,
} from "@/lib/teamcheck-engine";
import type { Triad, ComponentKey } from "@/lib/jobcheck-engine";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };
const MAX_BIO = 67;

const BADGE_CONFIG: Record<UrteilBadge, { label: string; color: string; bg: string }> = {
  STRATEGISCH_CHANCEN: { label: "Strategisch Chancen", color: "#34C759", bg: "rgba(52,199,89,0.10)" },
  ENTWICKLUNGSFAEHIG: { label: "Entwicklungsfähig", color: "#FF9500", bg: "rgba(255,149,0,0.10)" },
  NO_GO: { label: "No Go", color: "#FF3B30", bg: "rgba(255,59,48,0.10)" },
};

const VERSCHIEBUNG_COLORS: Record<string, string> = {
  VERSTAERKUNG: "#34C759",
  ERGAENZUNG: "#0071E3",
  REIBUNG: "#FF9500",
  SPANNUNG: "#FF6B35",
  TRANSFORMATION: "#FF3B30",
};

function GlassCard({ children, style, ...props }: { children: React.ReactNode; style?: React.CSSProperties; [k: string]: any }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      borderRadius: 32, padding: "36px 32px",
      boxShadow: "0 2px 20px rgba(0,0,0,0.03), 0 12px 48px rgba(0,0,0,0.05)",
      border: "1px solid rgba(255,255,255,0.7)", ...style,
    }} {...props}>{children}</div>
  );
}

function SectionHeader({ num, title, icon: Icon }: { num: number; title: string; icon: typeof CheckCircle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 12,
        background: "linear-gradient(135deg, #0071E3, #0071E3CC)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0,113,227,0.2)",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#FFF" }}>{String(num).padStart(2, "0")}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon style={{ width: 18, height: 18, color: "#0071E3", strokeWidth: 2 }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
    </div>
  );
}

function ProfileCard({ title, num, triad, dominanz, color, onChange, testIdPrefix }: {
  title: string; num: number; triad: Triad; dominanz: string; color: string;
  onChange?: (t: Triad) => void; testIdPrefix?: string;
}) {
  return (
    <div style={{
      flex: 1, minWidth: 180, padding: "20px 18px", borderRadius: 20,
      background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)",
    }} data-testid={`profile-card-${num}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 8,
          background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{num}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>{title}</span>
      </div>
      {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
        const val = triad[k];
        const barColor = k === "impulsiv" ? COLORS.imp : k === "intuitiv" ? COLORS.int : COLORS.ana;
        const widthPct = (val / MAX_BIO) * 100;
        return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#6E6E73", width: 58, flexShrink: 0 }}>
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </span>
            <div style={{ flex: 1, height: 22, borderRadius: 6, background: "rgba(0,0,0,0.04)", overflow: "hidden", position: "relative" }}>
              <div style={{
                width: `${Math.min(Math.max(widthPct, 3), 100)}%`, height: "100%",
                borderRadius: 6, background: barColor, transition: "width 150ms ease",
                display: "flex", alignItems: "center", paddingLeft: 8,
              }}>
                {val >= 8 && <span style={{ fontSize: 9, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap" }}>{Math.round(val)} %</span>}
              </div>
              {onChange && (
                <input
                  type="range" min={0} max={MAX_BIO} value={val}
                  onChange={e => onChange({ ...triad, [k]: Number(e.target.value) })}
                  data-testid={testIdPrefix ? `${testIdPrefix}-${k}` : undefined}
                  style={{
                    position: "absolute", inset: 0, width: "100%", height: "100%",
                    appearance: "none", WebkitAppearance: "none",
                    background: "transparent", outline: "none", cursor: "pointer",
                    margin: 0, zIndex: 2,
                  }}
                />
              )}
            </div>
            {val < 8 && <span style={{ fontSize: 9, fontWeight: 600, color: "#8E8E93" }}>{Math.round(val)} %</span>}
          </div>
        );
      })}
    </div>
  );
}


function BulletList({ items, color, icon }: { items: string[]; color?: string; icon?: "check" | "dot" | "warning" }) {
  const c = color || "#6E6E73";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          {icon === "check" ? (
            <CheckCircle style={{ width: 14, height: 14, color: c, flexShrink: 0, marginTop: 3, strokeWidth: 2.5 }} />
          ) : icon === "warning" ? (
            <AlertTriangle style={{ width: 14, height: 14, color: c, flexShrink: 0, marginTop: 3, strokeWidth: 2.5 }} />
          ) : (
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: c, marginTop: 7, flexShrink: 0, opacity: 0.6 }} />
          )}
          <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.65 }} lang="de">{hyphenateText(item)}</span>
        </div>
      ))}
    </div>
  );
}

export default function TeamCheck() {
  const [soll, setSoll] = useState<Triad>({ impulsiv: 33, intuitiv: 34, analytisch: 33 });
  const [kandidat, setKandidat] = useState<Triad>({ impulsiv: 33, intuitiv: 34, analytisch: 33 });
  const [team, setTeam] = useState<Triad>({ impulsiv: 30, intuitiv: 50, analytisch: 20 });
  const [beruf, setBeruf] = useState("Neue Position");
  const [bereich, setBereich] = useState("");
  const [fuehrungstyp, setFuehrungstyp] = useState("Keine");
  const [isLeading, setIsLeading] = useState(true);

  useEffect(() => {
    try {
      const completed = localStorage.getItem("rollenDnaCompleted");
      if (completed === "true") {
        const raw = localStorage.getItem("rollenDnaState");
        if (raw) {
          const state = JSON.parse(raw);
          if (state.beruf) setBeruf(state.beruf);
          if (state.bereich) setBereich(state.bereich);
          const ft = state.fuehrung || "Keine";
          setFuehrungstyp(ft);
          setIsLeading(ft !== "Keine");

          const p = state.profil || state.profile;
          if (p && p.impulsiv != null) {
            setSoll({ impulsiv: p.impulsiv, intuitiv: p.intuitiv, analytisch: p.analytisch });
          }
        }
      }
    } catch {}

    try {
      const saved = localStorage.getItem("jobcheckCandProfile");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.impulsiv != null && p.intuitiv != null && p.analytisch != null) {
          setKandidat({ impulsiv: p.impulsiv, intuitiv: p.intuitiv, analytisch: p.analytisch });
        }
      }
    } catch {}
  }, []);

  const input: TeamCheckInput = useMemo(() => ({
    soll, kandidat, team, beruf, bereich, fuehrungstyp, isLeading,
  }), [soll, kandidat, team, beruf, bereich, fuehrungstyp, isLeading]);

  const result: TeamCheckResult = useMemo(() => computeTeamCheck(input), [input]);

  const rolleLabel = isLeading ? "Neue Führungskraft" : "Neues Teammitglied";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F5F5F7 0%, #FBFBFD 40%, #F5F5F7 100%)" }}>
      <GlobalNav rightSlot={
        <button
          data-testid="btn-export-pdf"
          onClick={() => window.print()}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 14px", borderRadius: 10,
            background: "rgba(0,113,227,0.08)", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "#0071E3",
          }}
        >
          <FileDown style={{ width: 13, height: 13, strokeWidth: 2 }} />
          Export (PDF)
        </button>
      } />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#0071E3", letterSpacing: "0.08em", textTransform: "uppercase" }}>bioLogic</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#8E8E93" }}>TeamAnalyse</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1D1D1F", margin: "0 0 8px", letterSpacing: "-0.03em" }} data-testid="page-title">
          Detailanalyse: {rolleLabel} · {beruf}
        </h1>

        <div style={{
          padding: "16px 22px", borderRadius: 16, marginBottom: 32, marginTop: 16,
          background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(0,113,227,0.02))",
          border: "1px solid rgba(0,113,227,0.12)",
        }} data-testid="headline-callout">
          <p style={{ fontSize: 14, fontWeight: 500, color: "#1D1D1F", margin: 0, lineHeight: 1.7 }} lang="de">
            {hyphenateText(result.systemwirkung.headline)}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* SECTION 1: DIAGNOSE */}
          <GlassCard data-testid="section-diagnose">
            <SectionHeader num={1} title="DIAGNOSE" icon={BarChart3} />

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <ProfileCard title="Rollen-DNA (Soll)" num={1} triad={soll} dominanz={result.diagnose.sollDominanz} color="#0071E3" onChange={setSoll} testIdPrefix="slider-soll" />
              <ProfileCard title="Kandidatenprofil (Ist)" num={2} triad={kandidat} dominanz={result.diagnose.kandidatDominanz} color="#F39200" onChange={setKandidat} testIdPrefix="slider-kand" />
              <ProfileCard title="Teamprofil (Ist)" num={3} triad={team} dominanz={result.diagnose.teamDominanz} color="#34C759" onChange={setTeam} testIdPrefix="slider-team" />
            </div>

            {/* Toggle Führung / Teammitglied */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: "#6E6E73" }}>Rolle:</span>
              <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
                {[true, false].map(val => (
                  <button key={String(val)}
                    data-testid={val ? "toggle-leading-yes" : "toggle-leading-no"}
                    onClick={() => setIsLeading(val)}
                    style={{
                      padding: "6px 16px", border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: isLeading === val ? 600 : 400,
                      background: isLeading === val ? "#0071E3" : "transparent",
                      color: isLeading === val ? "#FFF" : "#6E6E73",
                    }}
                  >{val ? "Führung" : "Teammitglied"}</button>
                ))}
              </div>
            </div>

            {/* Dominanzstruktur + Delta */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{
                flex: 1, minWidth: 200, padding: "14px 18px", borderRadius: 14,
                background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: "rgba(0,113,227,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#0071E3" }}>D</span>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#8E8E93", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>Dominanzstruktur</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "2px 0 0" }} data-testid="dominanzstruktur">{result.diagnose.dominanzstruktur}</p>
                </div>
              </div>
              <div style={{
                padding: "14px 18px", borderRadius: 14,
                background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: "#8E8E93", margin: 0, textTransform: "uppercase" }}>Δ-Wert</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#1D1D1F", margin: 0 }} data-testid="delta-wert">{result.diagnose.deltaWert} Punkte</p>
              </div>
            </div>

            {/* Verschiebung */}
            <div style={{
              marginTop: 16, padding: "14px 18px", borderRadius: 14,
              background: `${VERSCHIEBUNG_COLORS[result.diagnose.verschiebung]}08`,
              border: `1px solid ${VERSCHIEBUNG_COLORS[result.diagnose.verschiebung]}18`,
              display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
            }} data-testid="verschiebung-bar">
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 7,
                  background: VERSCHIEBUNG_COLORS[result.diagnose.verschiebung],
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#FFF" }}>V</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase" }}>Verschiebung</span>
              </div>
              <span style={{
                padding: "4px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                color: "#FFF", background: VERSCHIEBUNG_COLORS[result.diagnose.verschiebung],
              }} data-testid="verschiebung-badge">{result.diagnose.verschiebungLabel}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#48484A" }}>{result.diagnose.intensitaet}</span>
              <p style={{ fontSize: 12, color: "#6E6E73", margin: 0, flex: "1 1 100%", marginTop: 4, lineHeight: 1.5 }} lang="de">
                {hyphenateText(result.diagnose.verschiebungBeschreibung)}
              </p>
            </div>
          </GlassCard>

          {/* SECTION 2: SYSTEMWIRKUNG */}
          <GlassCard data-testid="section-systemwirkung">
            <SectionHeader num={2} title="SYSTEMWIRKUNG" icon={Zap} />

            {/* Entscheidungslogik */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <CheckCircle style={{ width: 16, height: 16, color: "#34C759", strokeWidth: 2.5 }} />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Entscheidungslogik</h3>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 6px", letterSpacing: "0.04em" }}>Bisher</p>
                  <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: 0 }} lang="de">{hyphenateText(result.systemwirkung.entscheidungslogik.bisher)}</p>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", margin: "14px 0 6px", letterSpacing: "0.04em" }}>Mit der neuen {isLeading ? "Führungskraft" : "Person"}</p>
                  <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: 0 }} lang="de">{hyphenateText(result.systemwirkung.entscheidungslogik.mitNeu)}</p>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", margin: "14px 0 6px", letterSpacing: "0.04em" }}>Für die {isLeading ? "Führungskraft" : "Person"}</p>
                  <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: 0 }} lang="de">{hyphenateText(result.systemwirkung.entscheidungslogik.fuerFK)}</p>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)", margin: "0 0 24px" }} />

            {/* Prozess- und Qualitätswirkung */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <CheckCircle style={{ width: 16, height: 16, color: "#34C759", strokeWidth: 2.5 }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Prozesswirkung</h3>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <BulletList items={result.systemwirkung.prozessWirkung.positiv} color="#34C759" icon="dot" />
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <BulletList items={result.systemwirkung.prozessWirkung.negativ} color="#FF9500" icon="dot" />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)", margin: "24px 0" }} />

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <CheckCircle style={{ width: 16, height: 16, color: "#34C759", strokeWidth: 2.5 }} />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Qualitäts- und Fehlerwirkung</h3>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <BulletList items={result.systemwirkung.qualitaetsWirkung.positiv} color="#34C759" icon="dot" />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <BulletList items={result.systemwirkung.qualitaetsWirkung.negativ} color="#FF9500" icon="dot" />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* SECTION 3: STRESSPROFIL */}
          <GlassCard data-testid="section-stressprofil">
            <SectionHeader num={3} title="STRESSPROFIL" icon={AlertTriangle} />
            <p style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.75, margin: "0 0 18px" }} lang="de">
              {hyphenateText(result.stressprofil.normalState)}
            </p>
            <div style={{
              padding: "16px 20px", borderRadius: 16,
              background: "rgba(255,59,48,0.04)", border: "1px solid rgba(255,59,48,0.10)",
              marginBottom: 16,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#FF3B30", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Unkontrollierter Stress
              </p>
              <BulletList items={result.stressprofil.unkontrolliert} color="#FF3B30" icon="warning" />
            </div>
            <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.7, margin: "0 0 14px" }} lang="de">
              {hyphenateText(result.stressprofil.zweitKomponente)}
            </p>
            <div style={{
              padding: "14px 18px", borderRadius: 14,
              background: "rgba(0,113,227,0.04)", border: "1px solid rgba(0,113,227,0.10)",
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#0071E3", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Steuerung</p>
              <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: 0 }} lang="de">
                {hyphenateText(result.stressprofil.steuerung)}
              </p>
            </div>
          </GlassCard>

          {/* SECTION 4: PROGNOSE */}
          <GlassCard data-testid="section-prognose">
            <SectionHeader num={4} title="PROGNOSE (90-TAGE-PERSPEKTIVE)" icon={Clock} />
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {result.prognose.phases.map((phase, i) => (
                <div key={i} style={{
                  padding: "18px 20px", borderRadius: 18,
                  background: i === 0 ? "rgba(255,149,0,0.04)" : i === 1 ? "rgba(0,113,227,0.04)" : "rgba(52,199,89,0.04)",
                  border: `1px solid ${i === 0 ? "rgba(255,149,0,0.10)" : i === 1 ? "rgba(0,113,227,0.10)" : "rgba(52,199,89,0.10)"}`,
                }} data-testid={`prognose-phase-${i}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 9,
                      background: i === 0 ? "#FF9500" : i === 1 ? "#0071E3" : "#34C759",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#FFF" }}>P{i + 1}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{phase.label}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: "0 0 8px" }} lang="de">
                    {hyphenateText(phase.description)}
                  </p>
                  {phase.bullets.length > 0 && (
                    <BulletList items={phase.bullets} color={i === 0 ? "#FF9500" : i === 1 ? "#0071E3" : "#34C759"} icon="dot" />
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* SECTION 5: HANDLUNGSEMPFEHLUNGEN */}
          <GlassCard data-testid="section-handlungsempfehlungen">
            <SectionHeader num={5} title="HANDLUNGSEMPFEHLUNGEN" icon={Target} />
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{
                flex: 1, minWidth: 180, padding: "18px 16px", borderRadius: 18,
                background: "rgba(52,199,89,0.04)", border: "1px solid rgba(52,199,89,0.10)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <CheckCircle style={{ width: 15, height: 15, color: "#34C759", strokeWidth: 2.5 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Kernchancen</span>
                </div>
                <BulletList items={result.handlungsempfehlungen.kernchancen} color="#34C759" icon="dot" />
              </div>
              <div style={{
                flex: 1, minWidth: 180, padding: "18px 16px", borderRadius: 18,
                background: "rgba(255,59,48,0.04)", border: "1px solid rgba(255,59,48,0.10)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <AlertTriangle style={{ width: 15, height: 15, color: "#FF3B30", strokeWidth: 2.5 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Risiken</span>
                </div>
                <BulletList items={result.handlungsempfehlungen.kernrisiken} color="#FF3B30" icon="dot" />
              </div>
              <div style={{
                flex: 1, minWidth: 180, padding: "18px 16px", borderRadius: 18,
                background: "rgba(0,113,227,0.04)", border: "1px solid rgba(0,113,227,0.10)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Zap style={{ width: 15, height: 15, color: "#0071E3", strokeWidth: 2.5 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Top 3 Hebel</span>
                </div>
                <BulletList items={result.handlungsempfehlungen.topHebel} color="#0071E3" icon="check" />
              </div>
            </div>
          </GlassCard>

          {/* SECTION 6: GESAMTURTEIL */}
          <GlassCard data-testid="section-gesamturteil">
            <SectionHeader num={6} title="GESAMTURTEIL" icon={Shield} />

            {/* Badges */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              {(["STRATEGISCH_CHANCEN", "ENTWICKLUNGSFAEHIG", "NO_GO"] as UrteilBadge[]).map(badge => {
                const active = result.gesamturteil.badges.includes(badge);
                const cfg = BADGE_CONFIG[badge];
                return (
                  <div key={badge} style={{
                    padding: "8px 18px", borderRadius: 10,
                    background: active ? cfg.bg : "rgba(0,0,0,0.03)",
                    border: `1px solid ${active ? cfg.color + "25" : "rgba(0,0,0,0.06)"}`,
                    display: "flex", alignItems: "center", gap: 6,
                  }} data-testid={`badge-${badge.toLowerCase()}`}>
                    <CheckCircle style={{ width: 14, height: 14, color: active ? cfg.color : "#C7C7CC", strokeWidth: 2.5 }} />
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 400, color: active ? cfg.color : "#C7C7CC" }}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Verdict items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Einschätzung", text: result.gesamturteil.einschaetzung, icon: "✓" },
                { label: "Eskalationsrisiko", text: result.gesamturteil.eskalationsrisiko, icon: "⚠" },
                { label: "Risikoindikator", text: result.gesamturteil.risikoindikator, icon: "◉" },
                { label: "Empfehlung", text: result.gesamturteil.empfehlung, icon: "→" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 12, marginTop: 2, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F" }}>{item.label}: </span>
                    <span style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65 }} lang="de">{hyphenateText(item.text)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 20, padding: "14px 18px", borderRadius: 14,
              background: "rgba(0,113,227,0.04)", border: "1px solid rgba(0,113,227,0.10)",
            }}>
              <p style={{ fontSize: 12, color: "#48484A", lineHeight: 1.6, margin: 0 }} lang="de">
                {hyphenateText("Die Konstellation ist kein strukturelles No-Go, sondern ein klarer Entwicklungs- und Führungsfall.")}
              </p>
            </div>
          </GlassCard>

        </div>
      </div>
    </div>
  );
}
