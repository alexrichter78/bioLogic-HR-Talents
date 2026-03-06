import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Loader2, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "@/lib/jobcheck-engine";
import type { Triad, ComponentKey, RoleAnalysis, CandidateInput } from "@/lib/jobcheck-engine";

const SECTION_META: { id: SectionId; title: string; goal: string; maxParagraphs: number }[] = [
  { id: "management_summary", title: "Management Summary", goal: "Gesamteinstufung und Kernaussage", maxParagraphs: 3 },
  { id: "target_profile", title: "Rollenprofil (Soll)", goal: "Arbeitslogik der Rolle", maxParagraphs: 2 },
  { id: "candidate_profile", title: "Kandidatenprofil (Ist)", goal: "Beobachtbare Verhaltenslogik", maxParagraphs: 2 },
  { id: "dominance_shift", title: "Dominanz-Verschiebung", goal: "Veränderung der Rollenwirkung", maxParagraphs: 2 },
  { id: "impact_analysis", title: "Strukturelle Wirkungsanalyse", goal: "Auswirkungen der Abweichung", maxParagraphs: 5 },
  { id: "stress_logic", title: "Wirkung unter Druck und Stress", goal: "Verhalten bei steigender Belastung", maxParagraphs: 4 },
  { id: "risk_timeline", title: "Risikoprognose", goal: "Zeitliche Entwicklung der Risiken", maxParagraphs: 3 },
  { id: "development", title: "Entwicklungsprognose", goal: "Anpassungswahrscheinlichkeit", maxParagraphs: 2 },
  { id: "actions", title: "Handlungsempfehlung", goal: "Konkrete Steuerungsmaßnahmen", maxParagraphs: 3 },
  { id: "final_assessment", title: "Gesamtbewertung", goal: "Abschließende Empfehlung", maxParagraphs: 1 },
];

type SectionId = "management_summary" | "target_profile" | "candidate_profile" | "dominance_shift" | "impact_analysis" | "stress_logic" | "risk_timeline" | "development" | "actions" | "final_assessment";

type SectionState = {
  text: string;
  loading: boolean;
  error: string | null;
};

type RoleDnaState = {
  beruf: string;
  fuehrung: string;
  erfolgsfokusIndices: number[];
  aufgabencharakter: string;
  arbeitslogik: string;
  taetigkeiten: { id: number; name: string; kategorie: string }[];
};

const ERFOLGSFOKUS_LABELS = [
  "Ergebnis-/ Umsatzwirkung",
  "Beziehungs- und Netzwerkstabilität",
  "Innovations- & Transformationsleistung",
  "Prozess- und Effizienzqualität",
  "Fachliche Exzellenz / Expertise",
  "Strategische Wirkung / Positionierung",
];

const BAR_COLORS: Record<ComponentKey, string> = {
  impulsiv: "#C41E3A",
  intuitiv: "#F39200",
  analytisch: "#1A5DAB",
};

function buildRoleAnalysisFromDna(dna: RoleDnaState): RoleAnalysis | null {
  if (!dna.beruf) return null;
  const raw = localStorage.getItem("berichtCache");
  if (!raw) return null;
  try {
    const cache = JSON.parse(raw);
    const bg = cache.bioGram;
    if (!bg) return null;
    return {
      job_title: dna.beruf,
      job_family: dna.aufgabencharakter || "",
      role_profile: { impulsiv: bg.gesamt?.impulsiv ?? 33, intuitiv: bg.gesamt?.intuitiv ?? 33, analytisch: bg.gesamt?.analytisch ?? 34 },
      frame_profile: { impulsiv: bg.rahmen?.impulsiv ?? 33, intuitiv: bg.rahmen?.intuitiv ?? 33, analytisch: bg.rahmen?.analytisch ?? 34 },
      tasks_profile: { impulsiv: bg.haupt?.impulsiv ?? 33, intuitiv: bg.haupt?.intuitiv ?? 33, analytisch: bg.haupt?.analytisch ?? 34 },
      human_profile: { impulsiv: bg.neben?.impulsiv ?? 33, intuitiv: bg.neben?.intuitiv ?? 33, analytisch: bg.neben?.analytisch ?? 34 },
      leadership: {
        required: dna.fuehrung !== "Keine",
        type: dna.fuehrung,
        profile: bg.fuehrung ? { impulsiv: bg.fuehrung.impulsiv, intuitiv: bg.fuehrung.intuitiv, analytisch: bg.fuehrung.analytisch } : undefined,
      },
      success_metrics: (dna.erfolgsfokusIndices || []).map((i: number) => ERFOLGSFOKUS_LABELS[i] || ""),
      tension_fields: [],
    };
  } catch { return null; }
}

function ProfileBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <span style={{ width: 72, fontSize: 12, color: "#6E6E73", fontWeight: 500, textAlign: "right" }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: "rgba(0,0,0,0.04)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: color, borderRadius: 4, transition: "width 400ms ease" }} />
      </div>
      <span style={{ width: 32, fontSize: 12, color: "#1D1D1F", fontWeight: 600, textAlign: "right" }}>{Math.round(value)}</span>
    </div>
  );
}

export default function SollIstBericht() {
  const [, setLocation] = useLocation();
  const [sections, setSections] = useState<Record<SectionId, SectionState>>(() => {
    const init: Record<string, SectionState> = {};
    SECTION_META.forEach(s => { init[s.id] = { text: "", loading: false, error: null }; });
    return init as Record<SectionId, SectionState>;
  });
  const [collapsed, setCollapsed] = useState<Record<SectionId, boolean>>(() => {
    const init: Record<string, boolean> = {};
    SECTION_META.forEach(s => { init[s.id] = false; });
    return init as Record<SectionId, boolean>;
  });
  const [generating, setGenerating] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [candImp, setCandImp] = useState(33);
  const [candInt, setCandInt] = useState(34);
  const [candAna, setCandAna] = useState(33);
  const [roleAnalysis, setRoleAnalysis] = useState<RoleAnalysis | null>(null);
  const [hasRollenDna, setHasRollenDna] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (!raw) return;
    try {
      const dna = JSON.parse(raw) as RoleDnaState;
      if (dna.beruf) {
        setHasRollenDna(true);
        const ra = buildRoleAnalysisFromDna(dna);
        setRoleAnalysis(ra);
      }
    } catch {}

    const candRaw = localStorage.getItem("jobcheckCandProfile");
    if (candRaw) {
      try {
        const cand = JSON.parse(candRaw);
        if (cand.name) setCandidateName(cand.name);
        if (cand.impulsiv != null) setCandImp(cand.impulsiv);
        if (cand.intuitiv != null) setCandInt(cand.intuitiv);
        if (cand.analytisch != null) setCandAna(cand.analytisch);
      } catch {}
    }
  }, []);

  const candidateProfile: Triad = normalizeTriad({ impulsiv: candImp, intuitiv: candInt, analytisch: candAna });
  const roleDom = roleAnalysis ? dominanceModeOf(normalizeTriad(roleAnalysis.role_profile)) : null;
  const candDom = dominanceModeOf(candidateProfile);

  const generateAllSections = async () => {
    if (!roleAnalysis) return;
    setGenerating(true);
    abortRef.current = new AbortController();

    const payload = {
      role: roleAnalysis,
      candidate: { candidate_name: candidateName || "Kandidat", candidate_profile: candidateProfile },
    };

    for (const section of SECTION_META) {
      if (abortRef.current?.signal.aborted) break;
      setSections(prev => ({ ...prev, [section.id]: { text: "", loading: true, error: null } }));
      try {
        const res = await fetch("/api/generate-soll-ist-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, sectionId: section.id }),
          signal: abortRef.current?.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSections(prev => ({ ...prev, [section.id]: { text: data.text, loading: false, error: null } }));
      } catch (err: any) {
        if (err.name === "AbortError") break;
        setSections(prev => ({ ...prev, [section.id]: { text: "", loading: false, error: err.message || "Fehler" } }));
      }
    }
    setGenerating(false);
  };

  const regenerateSection = async (sectionId: SectionId) => {
    if (!roleAnalysis) return;
    setSections(prev => ({ ...prev, [sectionId]: { text: "", loading: true, error: null } }));
    try {
      const res = await fetch("/api/generate-soll-ist-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: roleAnalysis,
          candidate: { candidate_name: candidateName || "Kandidat", candidate_profile: candidateProfile },
          sectionId,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSections(prev => ({ ...prev, [sectionId]: { text: data.text, loading: false, error: null } }));
    } catch (err: any) {
      setSections(prev => ({ ...prev, [sectionId]: { text: "", loading: false, error: err.message || "Fehler" } }));
    }
  };

  const allGenerated = SECTION_META.every(s => sections[s.id].text);

  if (!hasRollenDna) {
    return (
      <div style={{ minHeight: "100vh", background: "#F5F5F7" }}>
        <GlobalNav />
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <AlertTriangle style={{ width: 48, height: 48, color: "#F39200", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", marginBottom: 12 }}>Keine Rollen-DNA vorhanden</h2>
          <p style={{ fontSize: 14, color: "#6E6E73", marginBottom: 24, lineHeight: 1.6 }}>
            Bitte erstellen Sie zuerst eine Rollenanalyse, um den Soll-Ist-Bericht generieren zu können.
          </p>
          <button
            onClick={() => setLocation("/rollen-dna")}
            style={{
              height: 44, paddingLeft: 24, paddingRight: 24, fontSize: 14, fontWeight: 600,
              borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFFFFF",
              boxShadow: "0 4px 14px rgba(0,113,227,0.25)",
            }}
            data-testid="button-go-to-rolle"
          >
            Zur Rollenanalyse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F7" }}>
      <GlobalNav />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", marginBottom: 4 }} data-testid="text-page-title">
          Soll-Ist-Bericht
        </h1>
        <p style={{ fontSize: 14, color: "#8E8E93", marginBottom: 28, fontWeight: 450 }}>
          Strukturierte Diagnose für Besetzungsentscheidungen
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
          <div style={{
            background: "#FFFFFF", borderRadius: 16, padding: "20px 24px",
            border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }} data-testid="card-soll-profile">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#8E8E93", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Soll-Profil (Rolle)
            </h3>
            {roleAnalysis && (
              <>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", marginBottom: 4 }}>{roleAnalysis.job_title}</p>
                <p style={{ fontSize: 12, color: "#6E6E73", marginBottom: 14 }}>{roleDom ? dominanceLabel(roleDom) : ""}</p>
                <ProfileBar label="Impulsiv" value={normalizeTriad(roleAnalysis.role_profile).impulsiv} color={BAR_COLORS.impulsiv} />
                <ProfileBar label="Intuitiv" value={normalizeTriad(roleAnalysis.role_profile).intuitiv} color={BAR_COLORS.intuitiv} />
                <ProfileBar label="Analytisch" value={normalizeTriad(roleAnalysis.role_profile).analytisch} color={BAR_COLORS.analytisch} />
              </>
            )}
          </div>

          <div style={{
            background: "#FFFFFF", borderRadius: 16, padding: "20px 24px",
            border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }} data-testid="card-ist-profile">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#8E8E93", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Ist-Profil (Kandidat)
            </h3>
            <input
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Name des Kandidaten"
              style={{
                width: "100%", height: 36, padding: "0 12px", fontSize: 14, fontWeight: 500,
                borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", marginBottom: 14,
                outline: "none", color: "#1D1D1F", background: "#FAFAFA",
              }}
              data-testid="input-candidate-name"
            />
            <p style={{ fontSize: 12, color: "#6E6E73", marginBottom: 12 }}>{dominanceLabel(candDom)}</p>
            {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
              const val = k === "impulsiv" ? candImp : k === "intuitiv" ? candInt : candAna;
              const setter = k === "impulsiv" ? setCandImp : k === "intuitiv" ? setCandInt : setCandAna;
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 72, fontSize: 12, color: "#6E6E73", fontWeight: 500, textAlign: "right" }}>{labelComponent(k)}</span>
                  <input
                    type="range" min={5} max={80} value={val}
                    onChange={(e) => setter(Number(e.target.value))}
                    style={{ flex: 1, accentColor: BAR_COLORS[k] }}
                    data-testid={`slider-${k}`}
                  />
                  <span style={{ width: 32, fontSize: 12, fontWeight: 600, color: "#1D1D1F", textAlign: "right" }}>{Math.round(candidateProfile[k])}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <button
            onClick={generateAllSections}
            disabled={generating}
            style={{
              height: 48, paddingLeft: 28, paddingRight: 28, fontSize: 15, fontWeight: 600,
              borderRadius: 14, border: "none", cursor: generating ? "not-allowed" : "pointer",
              background: generating ? "#C7C7CC" : "linear-gradient(135deg, #0071E3, #34AADC)",
              color: "#FFFFFF", boxShadow: generating ? "none" : "0 4px 16px rgba(0,113,227,0.3)",
              transition: "all 200ms ease", display: "flex", alignItems: "center", gap: 8,
              opacity: generating ? 0.7 : 1,
            }}
            data-testid="button-generate-report"
          >
            {generating ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : null}
            {generating ? "Bericht wird erstellt ..." : "Bericht generieren"}
          </button>
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {SECTION_META.map(section => {
          const state = sections[section.id];
          const isCollapsed = collapsed[section.id];
          if (!state.text && !state.loading && !state.error) return null;

          return (
            <div
              key={section.id}
              style={{
                background: "#FFFFFF", borderRadius: 16, padding: "20px 24px",
                border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                marginBottom: 12,
              }}
              data-testid={`section-${section.id}`}
            >
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                onClick={() => setCollapsed(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
              >
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{section.title}</h3>
                  <p style={{ fontSize: 11, color: "#8E8E93", margin: "2px 0 0", fontWeight: 450 }}>{section.goal}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {state.text && !state.loading && (
                    <button
                      onClick={(e) => { e.stopPropagation(); regenerateSection(section.id); }}
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)",
                        background: "transparent", cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center",
                      }}
                      title="Neu generieren"
                      data-testid={`button-regenerate-${section.id}`}
                    >
                      <RefreshCw style={{ width: 13, height: 13, color: "#6E6E73" }} />
                    </button>
                  )}
                  {isCollapsed
                    ? <ChevronDown style={{ width: 18, height: 18, color: "#8E8E93" }} />
                    : <ChevronUp style={{ width: 18, height: 18, color: "#8E8E93" }} />
                  }
                </div>
              </div>

              {!isCollapsed && (
                <div style={{ marginTop: 16 }}>
                  {state.loading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0" }}>
                      <Loader2 style={{ width: 16, height: 16, color: "#0071E3", animation: "spin 1s linear infinite" }} />
                      <span style={{ fontSize: 13, color: "#8E8E93" }}>Wird generiert ...</span>
                    </div>
                  )}
                  {state.error && (
                    <div style={{ padding: "12px 16px", background: "rgba(196,30,58,0.06)", borderRadius: 10, fontSize: 13, color: "#C41E3A" }}>
                      Fehler: {state.error}
                    </div>
                  )}
                  {state.text && (
                    <div style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.7 }}>
                      {state.text.split("\n").filter(Boolean).map((para, i) => (
                        <p key={i} style={{ margin: "0 0 12px" }}>{para}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
