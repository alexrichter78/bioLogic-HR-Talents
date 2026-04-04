import { useState, useEffect, useRef, useCallback } from "react";
import {
  PlusCircle, FolderOpen, Bot, CheckCircle, Sparkles,
  Settings2, GripVertical, Eye, EyeOff, X, MessageSquare,
  TrendingUp, ThumbsUp, ThumbsDown, BarChart3, Users,
  Lightbulb, ArrowUpDown, ChevronUp, ChevronDown, RotateCcw,
  FileText, Activity
} from "lucide-react";
import { useLocation } from "wouter";
import logoSrc from "@assets/1_1773849007741.png";
import illustrationRollenanalyse from "@assets/stellenanalyse_v3.png";
import illustrationKiCoach from "@assets/ki_coach_v5.png";

import GlobalNav from "@/components/global-nav";
import { useIsMobile } from "@/hooks/use-mobile";

type WidgetId = "quick-actions" | "coach-activity" | "recent-topics" | "analysis-status" | "biologic-tip" | "team-health";

interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
}

const WIDGET_META: Record<WidgetId, { label: string; icon: any; description: string }> = {
  "quick-actions": { label: "Schnellzugriff", icon: Sparkles, description: "Neue Analyse starten, Analyse öffnen oder Louis nutzen" },
  "coach-activity": { label: "Coach-Aktivität", icon: Activity, description: "Deine Interaktionen mit Louis auf einen Blick" },
  "recent-topics": { label: "Letzte Themen", icon: MessageSquare, description: "Kürzlich mit Louis besprochene Themen" },
  "analysis-status": { label: "Analyse-Status", icon: FileText, description: "Stand deiner aktuellen Stellenanalyse" },
  "biologic-tip": { label: "bioLogic-Impuls", icon: Lightbulb, description: "Täglicher Impuls aus der bioLogic-Methodik" },
  "team-health": { label: "Team-Übersicht", icon: Users, description: "Überblick über aktuelle Teamdaten" },
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "quick-actions", visible: true },
  { id: "coach-activity", visible: true },
  { id: "recent-topics", visible: true },
  { id: "analysis-status", visible: true },
  { id: "biologic-tip", visible: true },
  { id: "team-health", visible: true },
];

const BIOLOGIC_TIPS = [
  { tip: "Wenn jemand im Gespräch plötzlich lauter und schneller wird, ist das oft ein Zeichen, dass die impulsive Seite übernimmt. Gib der Person Raum für eine klare Aussage – nicht bremsen, sondern kanalisieren.", category: "Kommunikation" },
  { tip: "Intuitiv-dominante Menschen brauchen zuerst Beziehung, dann Sachthemen. Starte dein nächstes 1:1 mit einer persönlichen Frage, bevor du zur Agenda kommst.", category: "Führung" },
  { tip: "Analytisch-dominante Personen wirken unter Druck nicht gestresst, sondern distanziert. Verwechsle Schweigen nicht mit Desinteresse – sie verarbeiten gerade.", category: "Teamdynamik" },
  { tip: "In Konflikten zwischen impulsiv und analytisch geprägten Personen geht es fast immer um Tempo vs. Gründlichkeit. Mach diese Spannung zum Thema, statt Schuld zu verteilen.", category: "Konfliktlösung" },
  { tip: "Stellenanzeigen für analytisch geprägte Rollen sollten Struktur zeigen: klare Aufgabenlisten, definierte Verantwortungsbereiche, nachvollziehbare Prozesse.", category: "Recruiting" },
  { tip: "Ein Team mit lauter gleichen Prägungen hat blinde Flecken. Vielfalt in der Triade ist kein Luxus – sie ist ein Schutz vor Gruppendenken.", category: "Teamdynamik" },
  { tip: "Bevor du Feedback gibst, frag dich: Welche Prägung hat mein Gegenüber? Impulsiv → kurz und direkt. Intuitiv → wertschätzend einbetten. Analytisch → mit Fakten begründen.", category: "Kommunikation" },
  { tip: "In Veränderungsprozessen reagieren die Prägungen unterschiedlich: Impulsive wollen sofort wissen 'Was ändert sich für mich?', Intuitive fragen 'Was wird aus dem Team?', Analytische fragen 'Wie ist der Plan?'", category: "Führung" },
  { tip: "Doppeldominanzen erzeugen innere Spannung – das ist kein Defizit, sondern eine Ressource. Die Leitfrage 'Was braucht es jetzt mehr?' bringt Klarheit.", category: "Methodik" },
  { tip: "Menschen zeigen in Alltag, Stress und Ruhe oft verschiedene Prägungen. Beobachte, wann sich das Verhalten deines Gegenübers verändert – da liegt der Schlüssel zum Verständnis.", category: "Methodik" },
];

function getWidgetConfig(): WidgetConfig[] {
  try {
    const raw = localStorage.getItem("dashboardWidgets");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [...DEFAULT_WIDGETS];
      const allIds = Object.keys(WIDGET_META) as WidgetId[];
      const seen = new Set<string>();
      const deduped = parsed.filter((w: any) => {
        if (!w || typeof w !== "object" || !allIds.includes(w.id) || seen.has(w.id)) return false;
        seen.add(w.id);
        return true;
      }).map((w: any) => ({ id: w.id as WidgetId, visible: typeof w.visible === "boolean" ? w.visible : true }));
      allIds.forEach(id => { if (!seen.has(id)) deduped.push({ id, visible: true }); });
      return deduped;
    }
  } catch {}
  return [...DEFAULT_WIDGETS];
}

function saveWidgetConfig(config: WidgetConfig[]) {
  localStorage.setItem("dashboardWidgets", JSON.stringify(config));
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 700ms cubic-bezier(0.4, 0, 0.2, 1), transform 700ms cubic-bezier(0.4, 0, 0.2, 1)",
    }}>
      {children}
    </div>
  );
}

function ConfirmResetModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.15)" }} onClick={onCancel} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 420, maxWidth: "90vw", background: "#FFFFFF", borderRadius: 20, padding: "28px", boxShadow: "0 24px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)", zIndex: 9999, textAlign: "center" }} data-testid="modal-confirm-reset">
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", marginBottom: 12 }}>Sind Sie sich sicher?</h3>
        <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.6, marginBottom: 24 }}>Alle eingegebenen Daten werden gelöscht.</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <button onClick={onCancel} style={{ height: 44, paddingLeft: 24, paddingRight: 24, fontSize: 14, fontWeight: 600, borderRadius: 12, border: "1.5px solid rgba(0,0,0,0.12)", background: "transparent", color: "#1D1D1F", cursor: "pointer" }} data-testid="button-cancel-reset">Abbrechen</button>
          <button onClick={onConfirm} style={{ height: 44, paddingLeft: 24, paddingRight: 24, fontSize: 14, fontWeight: 600, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFFFFF", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,113,227,0.3)" }} data-testid="button-confirm-reset">Weiter</button>
        </div>
      </div>
    </>
  );
}

interface DashboardStats {
  recentTopics: { topic: string; date: string }[];
  totalTopics: number;
  feedback: { up: number; down: number; total: number };
  topTopics: { topic: string; count: number }[];
}

function WidgetQuickActions({ isMobile, onNewAnalyse, onOpenFile, onOpenCoach }: { isMobile: boolean; onNewAnalyse: () => void; onOpenFile: () => void; onOpenCoach: () => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
      <button onClick={onNewAnalyse} data-testid="widget-btn-new-analyse" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 16px", background: "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.08))", border: "1px solid rgba(0,113,227,0.12)", borderRadius: 16, cursor: "pointer", transition: "all 200ms ease" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #0071E3, #34AADC)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PlusCircle style={{ width: 22, height: 22, color: "#fff" }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>Neue Analyse</span>
      </button>
      <button onClick={onOpenFile} data-testid="widget-btn-open-analyse" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 16px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, cursor: "pointer", transition: "all 200ms ease" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FolderOpen style={{ width: 22, height: 22, color: "#48484A" }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>Analyse öffnen</span>
      </button>
      <button onClick={onOpenCoach} data-testid="widget-btn-open-coach" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 16px", background: "linear-gradient(135deg, rgba(52,199,89,0.08), rgba(48,209,88,0.08))", border: "1px solid rgba(52,199,89,0.12)", borderRadius: 16, cursor: "pointer", transition: "all 200ms ease" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #34C759, #30D158)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot style={{ width: 22, height: 22, color: "#fff" }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>Louis öffnen</span>
      </button>
    </div>
  );
}

function WidgetCoachActivity({ stats, isLoading, isLoggedIn, hasError, onRetry }: { stats: DashboardStats | null; isLoading: boolean; isLoggedIn: boolean; hasError: boolean; onRetry: () => void }) {
  if (isLoading) return <div style={{ padding: 20, textAlign: "center", color: "#8E8E93", fontSize: 13 }}>Lädt...</div>;
  if (!isLoggedIn) return <div style={{ padding: 20, textAlign: "center", color: "#8E8E93", fontSize: 13 }}>Melde dich an, um deine Statistiken zu sehen.</div>;
  if (hasError) return <div style={{ padding: 20, textAlign: "center" }}><p style={{ fontSize: 13, color: "#8E8E93", margin: "0 0 8px" }}>Statistiken konnten nicht geladen werden.</p><button onClick={onRetry} style={{ fontSize: 13, fontWeight: 600, color: "#0071E3", background: "none", border: "none", cursor: "pointer" }} data-testid="widget-retry-stats">Erneut versuchen</button></div>;
  if (!stats) return <div style={{ padding: 20, textAlign: "center", color: "#8E8E93", fontSize: 13 }}>Keine Daten verfügbar.</div>;
  const total = stats.totalTopics;
  const upRate = stats.feedback.total > 0 ? Math.round((stats.feedback.up / stats.feedback.total) * 100) : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
      <div style={{ textAlign: "center", padding: "12px 8px" }} data-testid="stat-total-topics">
        <div style={{ fontSize: 28, fontWeight: 700, color: "#0071E3", lineHeight: 1 }}>{total}</div>
        <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 4, fontWeight: 500 }}>Gespräche</div>
      </div>
      <div style={{ textAlign: "center", padding: "12px 8px" }} data-testid="stat-feedback-total">
        <div style={{ fontSize: 28, fontWeight: 700, color: "#34C759", lineHeight: 1 }}>{stats.feedback.total}</div>
        <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 4, fontWeight: 500 }}>Bewertungen</div>
      </div>
      <div style={{ textAlign: "center", padding: "12px 8px" }} data-testid="stat-satisfaction">
        <div style={{ fontSize: 28, fontWeight: 700, color: stats.feedback.total > 0 ? "#FF9500" : "#8E8E93", lineHeight: 1 }}>{stats.feedback.total > 0 ? `${upRate}%` : "–"}</div>
        <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 4, fontWeight: 500 }}>Zufriedenheit</div>
      </div>
      {stats.topTopics.length > 0 && (
        <div style={{ gridColumn: "1 / -1", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 12, marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Top-Themen</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {stats.topTopics.map((t, i) => (
              <span key={i} style={{ fontSize: 12, padding: "4px 10px", background: "rgba(0,113,227,0.08)", color: "#0071E3", borderRadius: 8, fontWeight: 500 }} data-testid={`top-topic-${i}`}>
                {t.topic} ({t.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WidgetRecentTopics({ stats, isLoading, isLoggedIn, hasError, onRetry, onOpenCoach }: { stats: DashboardStats | null; isLoading: boolean; isLoggedIn: boolean; hasError: boolean; onRetry: () => void; onOpenCoach: () => void }) {
  if (isLoading) return <div style={{ padding: 20, textAlign: "center", color: "#8E8E93", fontSize: 13 }}>Lädt...</div>;
  if (!isLoggedIn) return <div style={{ padding: 20, textAlign: "center", color: "#8E8E93", fontSize: 13 }}>Melde dich an, um deine Themen zu sehen.</div>;
  if (hasError) return <div style={{ padding: 20, textAlign: "center" }}><p style={{ fontSize: 13, color: "#8E8E93", margin: "0 0 8px" }}>Themen konnten nicht geladen werden.</p><button onClick={onRetry} style={{ fontSize: 13, fontWeight: 600, color: "#0071E3", background: "none", border: "none", cursor: "pointer" }} data-testid="widget-retry-topics">Erneut versuchen</button></div>;
  if (!stats || stats.recentTopics.length === 0) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>
        <MessageSquare style={{ width: 32, height: 32, color: "#D1D1D6", marginBottom: 8 }} />
        <p style={{ fontSize: 13, color: "#8E8E93", margin: "0 0 12px" }}>Noch keine Themen besprochen.</p>
        <button onClick={onOpenCoach} style={{ fontSize: 13, fontWeight: 600, color: "#0071E3", background: "none", border: "none", cursor: "pointer" }} data-testid="widget-btn-start-coaching">Erstes Gespräch mit Louis starten →</button>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {stats.recentTopics.slice(0, 5).map((t, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < Math.min(stats.recentTopics.length, 5) - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }} data-testid={`recent-topic-${i}`}>
          <span style={{ fontSize: 13, color: "#1D1D1F", fontWeight: 500 }}>{t.topic}</span>
          <span style={{ fontSize: 11, color: "#8E8E93", flexShrink: 0, marginLeft: 12 }}>{new Date(t.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</span>
        </div>
      ))}
    </div>
  );
}

function WidgetAnalysisStatus({ isMobile }: { isMobile: boolean }) {
  const [analysisData, setAnalysisData] = useState<any>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("rollenDnaState");
      if (raw) setAnalysisData(JSON.parse(raw));
    } catch {}
    const handler = () => {
      try {
        const raw = localStorage.getItem("rollenDnaState");
        if (raw) setAnalysisData(JSON.parse(raw));
        else setAnalysisData(null);
      } catch {}
    };
    window.addEventListener("rollenDnaUpdated", handler);
    return () => window.removeEventListener("rollenDnaUpdated", handler);
  }, []);

  const [, setLocation] = useLocation();

  if (!analysisData || !analysisData.beruf) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>
        <FileText style={{ width: 32, height: 32, color: "#D1D1D6", marginBottom: 8 }} />
        <p style={{ fontSize: 13, color: "#8E8E93", margin: "0 0 12px" }}>Keine aktive Analyse vorhanden.</p>
        <button onClick={() => setLocation("/rollen-dna")} style={{ fontSize: 13, fontWeight: 600, color: "#0071E3", background: "none", border: "none", cursor: "pointer" }} data-testid="widget-btn-start-analysis">Jetzt Stellenanalyse starten →</button>
      </div>
    );
  }

  const steps = [
    { label: "Stellendefinition", done: !!(analysisData.beruf) },
    { label: "Tätigkeiten", done: !!(analysisData.taetigkeiten?.length > 0) },
    { label: "Kompetenzanalyse", done: analysisData.currentStep >= 3 },
  ];
  const completedSteps = steps.filter(s => s.done).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>{analysisData.beruf}</span>
        <span style={{ fontSize: 12, color: "#0071E3", fontWeight: 600 }}>{completedSteps}/{steps.length}</span>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: s.done ? "#34C759" : "rgba(0,0,0,0.08)" }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle style={{ width: 14, height: 14, color: s.done ? "#34C759" : "#D1D1D6", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: s.done ? "#1D1D1F" : "#8E8E93", fontWeight: s.done ? 500 : 400 }}>{s.label}</span>
          </div>
        ))}
      </div>
      <button onClick={() => setLocation("/rollen-dna")} style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "#0071E3", background: "none", border: "none", cursor: "pointer", padding: 0 }} data-testid="widget-btn-continue-analysis">Analyse fortsetzen →</button>
    </div>
  );
}

function WidgetBiologicTip() {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % BIOLOGIC_TIPS.length;
  const tip = BIOLOGIC_TIPS[dayIndex];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#FF9500", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tip.category}</span>
      </div>
      <p style={{ fontSize: 13, color: "#1D1D1F", lineHeight: 1.6, margin: 0, fontWeight: 450 }} data-testid="tip-text">{tip.tip}</p>
    </div>
  );
}

function WidgetTeamHealth({ isMobile }: { isMobile: boolean }) {
  const [teamData, setTeamData] = useState<any>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("kompetenzenCache");
      if (raw) setTeamData(JSON.parse(raw));
    } catch {}
  }, []);

  const [, setLocation] = useLocation();

  if (!teamData) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>
        <Users style={{ width: 32, height: 32, color: "#D1D1D6", marginBottom: 8 }} />
        <p style={{ fontSize: 13, color: "#8E8E93", margin: "0 0 12px" }}>Noch keine Teamdaten vorhanden.</p>
        <button onClick={() => setLocation("/team-report")} style={{ fontSize: 13, fontWeight: 600, color: "#0071E3", background: "none", border: "none", cursor: "pointer" }} data-testid="widget-btn-team-report">Team-Systemreport erstellen →</button>
      </div>
    );
  }

  const triade = teamData.trpiResultPercent || teamData.gesamtTriade;
  if (!triade) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>
        <Users style={{ width: 32, height: 32, color: "#D1D1D6", marginBottom: 8 }} />
        <p style={{ fontSize: 13, color: "#8E8E93", margin: 0 }}>Analysedaten unvollständig.</p>
      </div>
    );
  }

  const colors = { impulsiv: "#E53E3E", intuitiv: "#ECC94B", analytisch: "#3182CE" };
  const labels = { impulsiv: "Impulsiv", intuitiv: "Intuitiv", analytisch: "Analytisch" };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["impulsiv", "intuitiv", "analytisch"] as const).map(key => {
          const val = Math.round(triade[key] || 0);
          return (
            <div key={key} style={{ flex: 1, textAlign: "center", padding: "10px 4px", background: `${colors[key]}10`, borderRadius: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors[key] }}>{val}%</div>
              <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 2, fontWeight: 500 }}>{labels[key]}</div>
            </div>
          );
        })}
      </div>
      <button onClick={() => setLocation("/team-report")} style={{ fontSize: 13, fontWeight: 600, color: "#0071E3", background: "none", border: "none", cursor: "pointer", padding: 0 }} data-testid="widget-btn-view-team">Team-Systemreport öffnen →</button>
    </div>
  );
}

function WidgetConfigPanel({ widgets, onChange, onClose }: { widgets: WidgetConfig[]; onChange: (w: WidgetConfig[]) => void; onClose: () => void }) {
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...widgets];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };
  const moveDown = (idx: number) => {
    if (idx >= widgets.length - 1) return;
    const next = [...widgets];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  };
  const toggleVisibility = (idx: number) => {
    const next = [...widgets];
    next[idx] = { ...next[idx], visible: !next[idx].visible };
    onChange(next);
  };
  const resetToDefault = () => {
    onChange([...DEFAULT_WIDGETS]);
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 480, maxWidth: "92vw", maxHeight: "80vh", background: "#FFFFFF", borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)", zIndex: 9999, display: "flex", flexDirection: "column" }} data-testid="widget-config-panel">
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Dashboard anpassen</h3>
            <p style={{ fontSize: 13, color: "#8E8E93", margin: "4px 0 0" }}>Widgets ein-/ausblenden und neu anordnen</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(0,0,0,0.05)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} data-testid="widget-config-close">
            <X style={{ width: 16, height: 16, color: "#8E8E93" }} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "12px 24px" }}>
          {widgets.map((w, idx) => {
            const meta = WIDGET_META[w.id];
            const Icon = meta.icon;
            return (
              <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: idx < widgets.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none", opacity: w.visible ? 1 : 0.5 }} data-testid={`widget-config-item-${w.id}`}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", padding: 2, opacity: idx === 0 ? 0.2 : 0.6 }} data-testid={`widget-move-up-${w.id}`}>
                    <ChevronUp style={{ width: 14, height: 14, color: "#8E8E93" }} />
                  </button>
                  <button onClick={() => moveDown(idx)} disabled={idx >= widgets.length - 1} style={{ background: "none", border: "none", cursor: idx >= widgets.length - 1 ? "default" : "pointer", padding: 2, opacity: idx >= widgets.length - 1 ? 0.2 : 0.6 }} data-testid={`widget-move-down-${w.id}`}>
                    <ChevronDown style={{ width: 14, height: 14, color: "#8E8E93" }} />
                  </button>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: w.visible ? "rgba(0,113,227,0.08)" : "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 18, height: 18, color: w.visible ? "#0071E3" : "#8E8E93" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>{meta.label}</div>
                  <div style={{ fontSize: 12, color: "#8E8E93", marginTop: 1 }}>{meta.description}</div>
                </div>
                <button onClick={() => toggleVisibility(idx)} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: w.visible ? "rgba(52,199,89,0.1)" : "rgba(0,0,0,0.04)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} data-testid={`widget-toggle-${w.id}`}>
                  {w.visible ? <Eye style={{ width: 16, height: 16, color: "#34C759" }} /> : <EyeOff style={{ width: 16, height: 16, color: "#8E8E93" }} />}
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "12px 24px 20px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between" }}>
          <button onClick={resetToDefault} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#8E8E93", background: "none", border: "none", cursor: "pointer" }} data-testid="widget-config-reset">
            <RotateCcw style={{ width: 14, height: 14 }} /> Zurücksetzen
          </button>
          <button onClick={onClose} style={{ paddingLeft: 24, paddingRight: 24, height: 40, fontSize: 14, fontWeight: 600, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFFFFF", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,113,227,0.25)" }} data-testid="widget-config-done">Fertig</button>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(getWidgetConfig);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const fetchStats = useCallback(() => {
    setStatsLoading(true);
    setStatsError(false);
    fetch("/api/dashboard-stats", { credentials: "include" })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setStats(data))
      .catch(() => setStatsError(true))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => { if (r.ok) { setIsLoggedIn(true); fetchStats(); } else { setIsLoggedIn(false); } })
      .catch(() => setIsLoggedIn(false));
  }, [fetchStats]);

  const handleWidgetChange = useCallback((newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    saveWidgetConfig(newWidgets);
  }, []);

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const state = {
          currentStep: 3, allCollapsed: true,
          beruf: data.beruf ?? "", fuehrung: data.fuehrung ?? "",
          erfolgsfokusIndices: data.erfolgsfokusIndices ?? [],
          aufgabencharakter: data.aufgabencharakter ?? "", arbeitslogik: data.arbeitslogik ?? "",
          activeTab: "haupt", taetigkeiten: data.taetigkeiten ?? [], nextId: data.nextId ?? 1,
        };
        localStorage.setItem("rollenDnaState", JSON.stringify(state));
        localStorage.setItem("rollenDnaCompleted", "true");
        window.dispatchEvent(new Event("rollenDnaUpdated"));
      } catch { alert("Die Datei konnte nicht gelesen werden."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleNewAnalyse = () => {
    const raw = localStorage.getItem("rollenDnaState");
    let hasData = false;
    if (raw) {
      try {
        const state = JSON.parse(raw);
        hasData = !!(state.beruf || state.fuehrung || (state.erfolgsfokusIndices?.length > 0) || (state.taetigkeiten?.length > 0));
      } catch {}
    }
    if (hasData) { setShowResetConfirm(true); }
    else {
      localStorage.setItem("rollenDnaReset", "1");
      window.dispatchEvent(new Event("rollenDnaResetTriggered"));
      setLocation("/rollen-dna");
    }
  };

  const visibleWidgets = widgets.filter(w => w.visible);

  const renderWidget = (w: WidgetConfig, idx: number) => {
    const meta = WIDGET_META[w.id];
    const Icon = meta.icon;

    let content: React.ReactNode;
    switch (w.id) {
      case "quick-actions":
        content = <WidgetQuickActions isMobile={isMobile} onNewAnalyse={handleNewAnalyse} onOpenFile={() => fileInputRef.current?.click()} onOpenCoach={() => setLocation("/ki-coach")} />;
        break;
      case "coach-activity":
        content = <WidgetCoachActivity stats={stats} isLoading={statsLoading} isLoggedIn={isLoggedIn} hasError={statsError} onRetry={fetchStats} />;
        break;
      case "recent-topics":
        content = <WidgetRecentTopics stats={stats} isLoading={statsLoading} isLoggedIn={isLoggedIn} hasError={statsError} onRetry={fetchStats} onOpenCoach={() => setLocation("/ki-coach")} />;
        break;
      case "analysis-status":
        content = <WidgetAnalysisStatus isMobile={isMobile} />;
        break;
      case "biologic-tip":
        content = <WidgetBiologicTip />;
        break;
      case "team-health":
        content = <WidgetTeamHealth isMobile={isMobile} />;
        break;
    }

    return (
      <FadeIn key={w.id} delay={100 + idx * 80}>
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.04)", transition: "box-shadow 200ms ease" }} data-testid={`widget-${w.id}`}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Icon style={{ width: 16, height: 16, color: "#0071E3" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", letterSpacing: "-0.01em" }}>{meta.label}</span>
          </div>
          {content}
        </div>
      </FadeIn>
    );
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background:
          "radial-gradient(ellipse 120% 80% at 20% 60%, rgba(252,205,210,0.35) 0%, transparent 50%), " +
          "radial-gradient(ellipse 100% 70% at 80% 30%, rgba(186,220,248,0.35) 0%, transparent 50%), " +
          "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(200,235,210,0.3) 0%, transparent 50%)",
        animation: "homeGradientPulse 12s ease-in-out infinite alternate",
      }} />
      <style>{`
        @keyframes homeGradientPulse { 0% { opacity: 0.85; } 50% { opacity: 1; } 100% { opacity: 0.85; } }
      `}</style>

      <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleFileLoad} data-testid="input-file-home-load" />

      <div style={{ position: "relative", zIndex: 10 }}>
        <GlobalNav />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "20px 12px 100px" : "32px 24px 80px" }}>
          <FadeIn delay={0}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingLeft: 4 }}>
              <div>
                <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }} data-testid="text-dashboard-title">Dashboard</h1>
                <p style={{ fontSize: 13, color: "#8E8E93", margin: "2px 0 0", fontWeight: 450 }}>Dein persönlicher Überblick</p>
              </div>
              <button onClick={() => setShowWidgetConfig(true)} style={{ display: "flex", alignItems: "center", gap: 6, height: 36, paddingLeft: 14, paddingRight: 14, fontSize: 13, fontWeight: 600, borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.8)", color: "#48484A", cursor: "pointer", transition: "all 200ms ease", backdropFilter: "blur(8px)" }} data-testid="button-customize-dashboard">
                <Settings2 style={{ width: 15, height: 15 }} />
                {!isMobile && "Anpassen"}
              </button>
            </div>
          </FadeIn>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            {visibleWidgets.map((w, i) => renderWidget(w, i))}
          </div>

          {visibleWidgets.length === 0 && (
            <FadeIn delay={100}>
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <Settings2 style={{ width: 40, height: 40, color: "#D1D1D6", marginBottom: 12 }} />
                <p style={{ fontSize: 15, color: "#8E8E93", margin: "0 0 16px" }}>Alle Widgets sind ausgeblendet.</p>
                <button onClick={() => setShowWidgetConfig(true)} style={{ fontSize: 14, fontWeight: 600, color: "#0071E3", background: "none", border: "none", cursor: "pointer" }} data-testid="button-show-widgets">Widgets einblenden</button>
              </div>
            </FadeIn>
          )}
        </div>
      </div>

      {showResetConfirm && (
        <ConfirmResetModal
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={() => {
            localStorage.removeItem("rollenDnaState"); localStorage.removeItem("rollenDnaCompleted");
            localStorage.removeItem("kompetenzenCache"); localStorage.removeItem("berichtCache");
            localStorage.removeItem("bioCheckTextOverride"); localStorage.removeItem("bioCheckIntroOverride");
            localStorage.removeItem("bioCheckTextGenerated"); localStorage.removeItem("analyseTexte");
            localStorage.setItem("rollenDnaReset", "1");
            window.dispatchEvent(new Event("rollenDnaResetTriggered"));
            setShowResetConfirm(false); setLocation("/rollen-dna");
          }}
        />
      )}

      {showWidgetConfig && (
        <WidgetConfigPanel widgets={widgets} onChange={handleWidgetChange} onClose={() => setShowWidgetConfig(false)} />
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "24px 0 16px", marginTop: 16 }}>
        <a href="/impressum" data-testid="link-impressum-home" className="footer-link">Impressum</a>
        <a href="/datenschutz" data-testid="link-datenschutz-home" className="footer-link">Datenschutz</a>
        <a href="/disclaimer" data-testid="link-disclaimer-home" className="footer-link">Disclaimer</a>
      </div>
    </div>
  );
}
