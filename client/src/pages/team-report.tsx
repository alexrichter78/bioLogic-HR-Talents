import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Download, Check, Users, ChevronDown, Zap } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "@/lib/jobcheck-engine";
import { computeTeamReport } from "@/lib/team-report-engine";
import { constellationLabel, detectConstellation } from "@/lib/soll-ist-engine";
import type { Triad, ComponentKey } from "@/lib/jobcheck-engine";
import type { TeamReportResult, SystemwirkungResult, GesamtpassungLevel, Severity } from "@/lib/team-report-engine";

type BG = { imp: number; int: number; ana: number };
type RoleDnaState = {
  beruf: string;
  fuehrung: string;
  erfolgsfokusIndices: number[];
  aufgabencharakter: string;
  arbeitslogik: string;
  taetigkeiten: { id: number; name: string; kategorie: string }[];
  bioGramGesamt?: BG;
  bioGramHaupt?: BG;
  bioGramNeben?: BG;
  bioGramFuehrung?: BG;
  bioGramRahmen?: BG;
};

const COMP_LABELS: Record<ComponentKey, string> = {
  impulsiv: "Umsetzung / Tempo",
  intuitiv: "Zusammenarbeit / Kommunikation",
  analytisch: "Struktur / Analyse",
};

const COMP_SHORT: Record<ComponentKey, string> = {
  impulsiv: "Umsetzung",
  intuitiv: "Zusammenarbeit",
  analytisch: "Struktur",
};

const BAR_CSS: Record<ComponentKey, string> = {
  impulsiv: "bg-red-500",
  intuitiv: "bg-amber-500",
  analytisch: "bg-blue-600",
};

const BAR_HEX: Record<ComponentKey, string> = {
  impulsiv: "#C41E3A",
  intuitiv: "#F39200",
  analytisch: "#1A5DAB",
};

function bgToTriad(bg: BG | undefined): Triad {
  if (!bg) return { impulsiv: 33, intuitiv: 33, analytisch: 34 };
  return { impulsiv: Math.round(bg.imp), intuitiv: Math.round(bg.int), analytisch: Math.round(bg.ana) };
}

function passungTone(level: GesamtpassungLevel) {
  if (level === "kritisch") return { text: "text-red-600", bg: "bg-red-50", border: "border-red-200", pill: "bg-red-50 text-red-700 border-red-200" };
  if (level === "bedingt") return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", pill: "bg-amber-50 text-amber-700 border-amber-200" };
  return { text: "text-green-600", bg: "bg-green-50", border: "border-green-200", pill: "bg-green-50 text-green-700 border-green-200" };
}

function passungBadge(level: GesamtpassungLevel) {
  if (level === "kritisch") return "Kritischer Fit";
  if (level === "bedingt") return "Bedingt passend";
  return "Guter Fit";
}

function domTone(k: ComponentKey) {
  if (k === "impulsiv") return "border-red-200 bg-red-50 text-red-700";
  if (k === "intuitiv") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function severityTone(s: Severity) {
  if (s === "critical") return "bg-red-50 text-red-700 border-red-200";
  if (s === "warning") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-green-50 text-green-700 border-green-200";
}

function severityLabel(s: Severity) {
  if (s === "critical") return "kritisch";
  if (s === "warning") return "bedingt";
  return "passend";
}

function Metric({ label, value, valueClass = "text-slate-900" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div data-testid={`metric-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${valueClass}`} data-testid={`metric-${label.toLowerCase().replace(/\s+/g, "-")}-value`}>{value}</div>
    </div>
  );
}

function ShiftPill({ title, value, tone }: { title: string; value: string; tone: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.15em] opacity-80">{title}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}

function ProfileCard({ title, subtitle, profile, description }: {
  title: string; subtitle: string;
  profile: { label: string; short: string; value: number; color: string }[];
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="mb-5">
        <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</div>
        <div className="mt-1 text-base font-semibold text-slate-950">{subtitle}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {profile.map(item => {
          const hex = BAR_HEX[item.label.toLowerCase() as ComponentKey];
          const widthPct = (item.value / 67) * 100;
          const isSmall = widthPct < 18;
          return (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#6E6E73", width: 72, flexShrink: 0 }}>
                {item.label}
              </span>
              <div style={{ flex: 1, position: "relative", height: 26 }}>
                <div style={{
                  position: "absolute", inset: 0,
                  borderRadius: 13, background: "rgba(0,0,0,0.06)",
                }} />
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${Math.min(Math.max(widthPct, 4), 100)}%`,
                  borderRadius: 13, background: hex,
                  transition: "width 600ms ease",
                  display: "flex", alignItems: "center", paddingLeft: 10,
                  minWidth: isSmall ? 8 : 50,
                }}>
                  {!isSmall && <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap" }}>{Math.round(item.value)} %</span>}
                </div>
                {isSmall && (
                  <span style={{
                    position: "absolute", top: "50%", transform: "translateY(-50%)",
                    left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 8px)`,
                    fontSize: 13, fontWeight: 600, color: "#8E8E93", whiteSpace: "nowrap",
                    transition: "left 600ms ease",
                  }}>{Math.round(item.value)} %</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        {description}
      </div>
    </div>
  );
}

function DualTriangleChart({ ist, team }: { ist: Triad; team: Triad }) {
  const top = { x: 160, y: 25 };
  const left = { x: 35, y: 220 };
  const right = { x: 285, y: 220 };
  const cx = 160, cy = 155;

  function triadToTriangle(t: Triad) {
    const total = t.analytisch + t.intuitiv + t.impulsiv || 1;
    const scale = 0.85;
    const pts = [
      { frac: t.analytisch / total, ref: top },
      { frac: t.intuitiv / total, ref: left },
      { frac: t.impulsiv / total, ref: right },
    ];
    return pts.map(p => {
      const dx = p.ref.x - cx;
      const dy = p.ref.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) * p.frac * 2.5 * scale;
      const angle = Math.atan2(dy, dx);
      return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
    }).join(" ");
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 320 260" className="h-[260px] w-full max-w-[360px]">
        <polygon points="160,25 35,220 285,220" fill="none" stroke="#cbd5e1" strokeWidth="2" />
        <text x="160" y="16" textAnchor="middle" className="fill-slate-500 text-[12px]">Struktur</text>
        <text x="15" y="235" className="fill-slate-500 text-[12px]">Zusammenarbeit</text>
        <text x="250" y="235" className="fill-slate-500 text-[12px]">Umsetzung</text>
        <polygon points={triadToTriangle(team)} fill="rgba(16,185,129,0.10)" stroke="#10b981" strokeWidth="3" />
        <polygon points={triadToTriangle(ist)} fill="rgba(245,158,11,0.14)" stroke="#f59e0b" strokeWidth="3" />
      </svg>
      <div className="mt-2 flex items-center gap-6 text-sm text-slate-500">
        <Legend color="bg-emerald-500" label="Team" />
        <Legend color="bg-amber-500" label="Person" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function Prose({ text }: { text: string }) {
  const paragraphs = text.split("\n").filter(l => l.trim().length > 0);
  return (
    <div className="space-y-3 text-sm leading-7 text-slate-700">
      {paragraphs.map((p, i) => {
        if (p.startsWith("- ")) {
          return (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
              <span>{p.slice(2)}</span>
            </div>
          );
        }
        const isHeading = p.endsWith(":") && p.length < 60;
        if (isHeading) return <div key={i} className="font-semibold text-slate-900 mt-4">{p}</div>;
        return <p key={i}>{p}</p>;
      })}
    </div>
  );
}

function StaticBarGroup({ title, triad }: {
  title: string;
  triad: { impulsiv: number; intuitiv: number; analytisch: number };
}) {
  const dom = dominanceModeOf(triad);
  return (
    <div>
      <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">{title}</div>
      <div className="text-xs text-slate-500 mb-4">{dominanceLabel(dom)}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(key => {
          const val = triad[key];
          const hex = BAR_HEX[key];
          const widthPct = (val / 67) * 100;
          const isSmall = widthPct < 18;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#6E6E73", width: 72, flexShrink: 0 }}>
                {labelComponent(key)}
              </span>
              <div style={{ flex: 1, position: "relative", height: 26 }}>
                <div style={{
                  position: "absolute", inset: 0,
                  borderRadius: 13, background: "rgba(0,0,0,0.06)",
                }} />
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${Math.min(Math.max(widthPct, 4), 100)}%`,
                  borderRadius: 13, background: hex,
                  transition: "width 600ms ease",
                  display: "flex", alignItems: "center", paddingLeft: 10,
                  minWidth: isSmall ? 8 : 50,
                }}>
                  {!isSmall && <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap" }}>{val} %</span>}
                </div>
                {isSmall && (
                  <span style={{
                    position: "absolute", top: "50%", transform: "translateY(-50%)",
                    left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 8px)`,
                    fontSize: 13, fontWeight: 600, color: "#8E8E93", whiteSpace: "nowrap",
                    transition: "left 600ms ease",
                  }}>{val} %</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SliderGroup({
  title, triad, onTriadChange, testIdPrefix,
}: {
  title: string;
  triad: { impulsiv: number; intuitiv: number; analytisch: number };
  onTriadChange: (key: ComponentKey, val: number) => void;
  testIdPrefix: string;
}) {
  const dom = dominanceModeOf(triad);

  return (
    <div>
      <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">{title}</div>
      <div className="text-xs text-slate-500 mb-4">{dominanceLabel(dom)}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(key => {
          const val = triad[key];
          const hex = BAR_HEX[key];
          const widthPct = (val / 67) * 100;
          const isSmall = widthPct < 18;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#6E6E73", width: 72, flexShrink: 0 }}>
                {labelComponent(key)}
              </span>
              <div style={{ flex: 1, position: "relative", height: 26 }}>
                <div style={{
                  position: "absolute", inset: 0,
                  borderRadius: 13, background: "rgba(0,0,0,0.06)",
                }} />
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${Math.min(Math.max(widthPct, 4), 100)}%`,
                  borderRadius: 13, background: hex,
                  transition: "width 150ms ease",
                  display: "flex", alignItems: "center", paddingLeft: 10,
                  minWidth: isSmall ? 8 : 50,
                }}>
                  {!isSmall && <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap" }}>{val} %</span>}
                </div>
                <div
                  data-testid={`slider-${testIdPrefix}-${key}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const track = e.currentTarget.parentElement!;
                    const rect = track.getBoundingClientRect();
                    const move = (ev: MouseEvent) => {
                      const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                      onTriadChange(key, Math.round(ratio * 67));
                    };
                    const up = () => {
                      window.removeEventListener("mousemove", move);
                      window.removeEventListener("mouseup", up);
                    };
                    window.addEventListener("mousemove", move);
                    window.addEventListener("mouseup", up);
                  }}
                  onTouchStart={(e) => {
                    const track = e.currentTarget.parentElement!;
                    const rect = track.getBoundingClientRect();
                    const move = (ev: TouchEvent) => {
                      const touch = ev.touches[0];
                      const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                      onTriadChange(key, Math.round(ratio * 67));
                    };
                    const up = () => {
                      window.removeEventListener("touchmove", move);
                      window.removeEventListener("touchend", up);
                    };
                    window.addEventListener("touchmove", move);
                    window.addEventListener("touchend", up);
                  }}
                  style={{
                    position: "absolute",
                    left: `${Math.min(Math.max(widthPct, 4), 100)}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 28, height: 28, borderRadius: "50%",
                    background: hex,
                    border: "3px solid #F0F0F2",
                    transition: "left 80ms ease",
                    zIndex: 3,
                    cursor: "grab",
                  }}
                />
                {isSmall && (
                  <span style={{
                    position: "absolute", top: "50%", transform: "translateY(-50%)",
                    left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 20px)`,
                    fontSize: 13, fontWeight: 600, color: "#8E8E93", whiteSpace: "nowrap",
                    transition: "left 150ms ease",
                    zIndex: 4,
                  }}>{val} %</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TeamReport() {
  const [, setLocation] = useLocation();

  const [istTriad, setIstTriad] = useState({ impulsiv: 33, intuitiv: 34, analytisch: 33 });
  const [teamTriad, setTeamTriad] = useState({ impulsiv: 33, intuitiv: 34, analytisch: 33 });

  const makeTriadUpdater = useCallback((setter: React.Dispatch<React.SetStateAction<{ impulsiv: number; intuitiv: number; analytisch: number }>>) => {
    return (key: ComponentKey, newVal: number) => {
      setter(prev => {
        const clamped = Math.max(5, Math.min(67, Math.round(newVal)));
        const others = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== key);
        const remaining = 100 - clamped;
        const otherSum = prev[others[0]] + prev[others[1]];
        let o1: number, o2: number;
        if (otherSum === 0) {
          o1 = Math.round(remaining / 2);
          o2 = remaining - o1;
        } else {
          o1 = Math.round((prev[others[0]] / otherSum) * remaining);
          o2 = remaining - o1;
        }
        o1 = Math.max(5, Math.min(67, o1));
        o2 = Math.max(5, Math.min(67, o2));
        const total = clamped + o1 + o2;
        if (total !== 100) {
          const diff = 100 - total;
          if (o2 + diff >= 5 && o2 + diff <= 67) o2 += diff;
          else if (o1 + diff >= 5 && o1 + diff <= 67) o1 += diff;
        }
        return { [key]: clamped, [others[0]]: o1, [others[1]]: o2 } as typeof prev;
      });
    };
  }, []);

  const updateIstTriad = useMemo(() => makeTriadUpdater(setIstTriad), [makeTriadUpdater]);
  const updateTeamTriad = useMemo(() => makeTriadUpdater(setTeamTriad), [makeTriadUpdater]);
  const [configOpen, setConfigOpen] = useState(true);
  const [roleName, setRoleName] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [matchCheckOpen, setMatchCheckOpen] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (raw) {
      try {
        const dna = JSON.parse(raw) as RoleDnaState;
        if (dna.beruf) setRoleName(dna.beruf);
      } catch {}
    }
    const candRaw = localStorage.getItem("jobcheckCandProfile");
    if (candRaw) {
      try {
        const cand = JSON.parse(candRaw);
        if (cand.name) setCandidateName(cand.name);
        if (cand.impulsiv != null && cand.intuitiv != null && cand.analytisch != null) {
          setIstTriad({ impulsiv: cand.impulsiv, intuitiv: cand.intuitiv, analytisch: cand.analytisch });
        }
      } catch {}
    }
    const teamRaw = localStorage.getItem("teamProfile");
    if (teamRaw) {
      try {
        const tp = JSON.parse(teamRaw);
        if (tp.impulsiv != null && tp.intuitiv != null && tp.analytisch != null) {
          setTeamTriad({ impulsiv: tp.impulsiv, intuitiv: tp.intuitiv, analytisch: tp.analytisch });
        }
      } catch {}
    }
  }, []);

  const istProfile = istTriad;
  const teamProfileN = teamTriad;

  const istDomKey = dominanceModeOf(istProfile).top1.key;
  const teamDomKey = dominanceModeOf(teamProfileN).top1.key;

  const istConstLabel = constellationLabel(detectConstellation(istProfile));
  const teamConstLabel = constellationLabel(detectConstellation(teamProfileN));

  const liveResult: TeamReportResult = useMemo(() => {
    return computeTeamReport(roleName || "Rolle", candidateName || "Person", istProfile, teamProfileN);
  }, [roleName, candidateName, istProfile.impulsiv, istProfile.intuitiv, istProfile.analytisch, teamProfileN.impulsiv, teamProfileN.intuitiv, teamProfileN.analytisch]);

  const result: TeamReportResult | null = reportGenerated ? liveResult : null;

  const liveSw = liveResult.systemwirkungResult;
  const sw = result?.systemwirkungResult;
  const tone = result ? passungTone(result.gesamtpassung) : passungTone("geeignet");

  const istProfileArr = [
    { label: "Impulsiv", short: "Umsetzung", value: istProfile.impulsiv, color: BAR_CSS.impulsiv },
    { label: "Intuitiv", short: "Zusammenarbeit", value: istProfile.intuitiv, color: BAR_CSS.intuitiv },
    { label: "Analytisch", short: "Struktur", value: istProfile.analytisch, color: BAR_CSS.analytisch },
  ];
  const teamProfileArr = [
    { label: "Impulsiv", short: "Umsetzung", value: teamProfileN.impulsiv, color: BAR_CSS.impulsiv },
    { label: "Intuitiv", short: "Zusammenarbeit", value: teamProfileN.intuitiv, color: BAR_CSS.intuitiv },
    { label: "Analytisch", short: "Struktur", value: teamProfileN.analytisch, color: BAR_CSS.analytisch },
  ];

  const deltas: { label: string; team: number; ist: number; delta: string; deltaTone: string }[] = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
    const d = Math.round(istProfile[k] - teamProfileN[k]);
    return {
      label: COMP_LABELS[k],
      team: Math.round(teamProfileN[k]),
      ist: Math.round(istProfile[k]),
      delta: d >= 0 ? `+${d}` : `${d}`,
      deltaTone: Math.abs(d) >= 15 ? "text-red-600" : Math.abs(d) >= 8 ? "text-amber-600" : "text-slate-600",
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <GlobalNav />

      <div style={{ position: "fixed", top: 56, left: 0, right: 0, zIndex: 8999 }}>
        <div className="dark:!bg-background" style={{ background: "#F1F5F9", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "5px 0 10px" }}>
          <div className="w-full mx-auto px-6" style={{ maxWidth: 1100 }}>
            <div className="text-center">
              <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#1D1D1F" }} data-testid="text-teamreport-title">
                Teamstruktur analysieren
              </h1>
              <p style={{ fontSize: 13, color: "#8E8E93", fontWeight: 450, margin: 0 }} data-testid="text-teamreport-subtitle">
                Analysieren Sie die Zusammensetzung des Teams und erkennen Sie systemische Wirkungen, Entscheidungslogiken und mögliche Spannungsfelder.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-5" style={{ maxWidth: 1100, paddingTop: 135, paddingBottom: 40 }}>

        <div className="mb-8 rounded-[20px] border border-slate-200 bg-white shadow-sm overflow-hidden" data-testid="accordion-teamcheck">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 24px", background: "none", border: "none", cursor: "pointer",
              gap: 12,
            }}
            data-testid="accordion-teamcheck-toggle"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: "linear-gradient(135deg, rgba(52,199,89,0.15), rgba(52,199,89,0.08))",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Users style={{ width: 18, height: 18, color: "#34C759", strokeWidth: 2 }} />
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#1D1D1F" }} data-testid="text-teamcheck-label">Profilvergleich Rolle vs. Team</span>
            </div>
            <ChevronDown style={{
              width: 18, height: 18, color: "#8E8E93", strokeWidth: 2,
              transition: "transform 300ms ease",
              transform: configOpen ? "rotate(180deg)" : "rotate(0deg)",
            }} />
          </button>
          <div style={{
            maxHeight: configOpen ? 5000 : 0,
            overflow: "hidden",
            transition: "max-height 400ms ease",
          }}>
            <div style={{ padding: "0 24px 24px" }}>
              <div className="grid gap-8 lg:grid-cols-2">
                <StaticBarGroup title="Ist-Profil (Person)" triad={istTriad} />
                <SliderGroup title="Teamprofil" triad={teamTriad}
                  onTriadChange={updateTeamTriad} testIdPrefix="team" />
              </div>
              <div className="mt-8 flex justify-center">
                <button onClick={() => setReportGenerated(true)}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-[15px] font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
                  data-testid="button-generate-report">
                  Bericht erstellen
                </button>
              </div>
            </div>
          </div>
        </div>

        {(() => {
          const teamDom = dominanceModeOf(teamProfileN);
          const candDom = dominanceModeOf(istProfile);
          const teamDomKeyFit = teamDom.top1.key;
          const candDomKeyFit = candDom.top1.key;
          const sameDom = teamDomKeyFit === candDomKeyFit;
          const totalGap = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).reduce((sum, k) => sum + Math.abs(teamProfileN[k] - istProfile[k]), 0);

          const teamSorted = [teamProfileN.impulsiv, teamProfileN.intuitiv, teamProfileN.analytisch].sort((a, b) => b - a);
          const candSorted = [istProfile.impulsiv, istProfile.intuitiv, istProfile.analytisch].sort((a, b) => b - a);
          const secondaryFlip = sameDom && teamDom.top2.key !== candDom.top2.key;
          const candSecGap = candSorted[1] - candSorted[2];

          const geignetLimit = sameDom ? 28 : 20;
          let fitLabel = totalGap > 40 ? "Nicht geeignet" : totalGap > geignetLimit ? "Bedingt geeignet" : "Geeignet";
          if (secondaryFlip && candSecGap > 5) {
            fitLabel = "Nicht geeignet";
          } else if (secondaryFlip && fitLabel === "Geeignet") {
            fitLabel = "Bedingt geeignet";
          } else if (fitLabel === "Geeignet" && sameDom && candSecGap <= 5) {
            fitLabel = "Bedingt geeignet";
          }
          const fitColor = fitLabel === "Nicht geeignet" ? "#D64045" : fitLabel === "Bedingt geeignet" ? "#E5A832" : "#3A9A5C";

          const fazitText = secondaryFlip && candSecGap > 5
            ? "Die dominante Arbeitslogik stimmt überein, aber die Sekundärausrichtung passt nicht. Die Person bringt die falsche zweite Stärke klar ausgeprägt mit. Arbeitsstil und Prioritätensetzung weichen strukturell ab."
            : secondaryFlip && totalGap <= geignetLimit
            ? "Die dominante Arbeitslogik stimmt überein, aber die Sekundärstruktur ist unklar. Die zweite und dritte Komponente der Person liegen nah beieinander – das macht das Verhalten in Drucksituationen weniger vorhersehbar."
            : sameDom && candSecGap <= 5 && totalGap <= geignetLimit
            ? "Die dominante Arbeitslogik stimmt überein, aber die Sekundärstruktur ist unklar. Die zweite und dritte Komponente der Person liegen nah beieinander – das macht das Verhalten in Drucksituationen weniger vorhersehbar."
            : sameDom && totalGap <= geignetLimit
            ? "Arbeitslogiken stimmen überein. Die natürliche Arbeitsweise der Person entspricht den Anforderungen des Teams."
            : sameDom
            ? "Die Grundausrichtung ist ähnlich, es bestehen jedoch spürbare Unterschiede in der Intensität. Mit gezielter Führung lässt sich die Zusammenarbeit stabil gestalten."
            : totalGap > 40
            ? "Die Arbeits- und Entscheidungslogiken von Team und Person unterscheiden sich deutlich. Im Arbeitsalltag entsteht dadurch erhöhter Abstimmungs- und Steuerungsbedarf."
            : "Unterschiedliche Arbeitslogiken treffen aufeinander. Die Person arbeitet und entscheidet anders, als es das Team erfordert. Im Alltag entsteht dadurch erhöhter Abstimmungsbedarf.";

          let devScore: number;
          if (sameDom && totalGap <= 20) devScore = 6;
          else if (sameDom && totalGap <= 28) devScore = 5;
          else if (totalGap <= 20 || (sameDom && totalGap <= 35)) devScore = 4;
          else if (totalGap <= 35 || (sameDom && totalGap <= 45)) devScore = 3;
          else if (totalGap <= 50) devScore = 2;
          else devScore = 1;

          if (devScore === 6 && candSecGap <= 5) devScore = 5;
          if (secondaryFlip) {
            if (candSecGap > 5) devScore = Math.min(devScore, 2);
            else devScore = Math.min(devScore, 4);
          }

          const devTexts: Record<number, string> = {
            1: "Die grundlegende Arbeitslogik der Person unterscheidet sich stark von der Teamstruktur. Eine stabile Anpassung ist daher nur sehr eingeschränkt zu erwarten.",
            2: "Die Teamstruktur unterscheidet sich deutlich von der natürlichen Arbeitsweise der Person. Eine Entwicklung ist grundsätzlich möglich, erfordert jedoch intensive Führung und klare Rahmenbedingungen.",
            3: "Die Person kann sich teilweise an die Anforderungen des Teams anpassen. Eine stabile Umsetzung erfordert jedoch Zeit, Erfahrung und unterstützende Strukturen.",
            4: "Die Person kann sich grundsätzlich gut an die Teamstruktur entwickeln. Mit klaren Entscheidungswegen und Feedback ist eine stabile Zusammenarbeit gut erreichbar.",
            5: "Die Arbeits- und Entscheidungslogik der Person passt bereits weitgehend zur Teamstruktur. Eine Entwicklung zu einer stabilen und erfolgreichen Umsetzung ist sehr wahrscheinlich.",
            6: "Die Person kann sich sehr schnell und stabil ins Team einfügen. Arbeitsweise, Entscheidungslogik und Teamstruktur passen sehr gut zusammen.",
          };

          const devLabels: Record<number, string> = {
            1: "Entwicklung praktisch nicht erreichbar",
            2: "Entwicklung sehr schwierig",
            3: "Entwicklung möglich mit hohem Aufwand",
            4: "Entwicklung gut möglich",
            5: "Entwicklung sehr wahrscheinlich",
            6: "Entwicklung sehr schnell erreichbar",
          };

          const devGaugeColor = devScore >= 5 ? "#3A9A5C" : devScore >= 3 ? "#E5A832" : "#D64045";

          return (
            <div className="mb-8" data-testid="section-matchcheck-team">
              <div style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden" }}>
                <button
                  onClick={() => setMatchCheckOpen(!matchCheckOpen)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", border: "none", background: "transparent", cursor: "pointer", transition: "background 150ms" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.02)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  data-testid="button-toggle-matchcheck-team"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Zap style={{ width: 22, height: 22, color: "#3A9A5C", flexShrink: 0 }} />
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F" }}>
                      TeamCheck — Systemwirkung
                    </span>
                  </div>
                  <ChevronDown style={{
                    width: 18, height: 18, color: "#8E8E93", strokeWidth: 2,
                    transition: "transform 300ms ease",
                    transform: matchCheckOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }} />
                </button>

                <div style={{
                  maxHeight: matchCheckOpen ? 5000 : 0,
                  overflow: "hidden",
                  transition: "max-height 400ms ease",
                }}>
                <div style={{ padding: "0 32px 28px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 9, background: fitColor, flexShrink: 0, boxShadow: `0 0 0 4px ${fitColor}20` }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F" }} data-testid="text-matchcheck-team-name">{roleName || "Team"}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: fitColor, letterSpacing: "0.03em" }} data-testid="text-matchcheck-team-fit">
                          {fitLabel}
                        </span>
                      </div>
                      <div style={{ background: `${fitColor}08`, borderLeft: `3px solid ${fitColor}`, borderRadius: "0 8px 8px 0", padding: "12px 16px" }}>
                        <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.75, margin: 0 }} data-testid="text-matchcheck-team-fazit">{fazitText}</p>
                      </div>
                    </div>

                    <div style={{ borderLeft: "1px solid rgba(0,0,0,0.06)", paddingLeft: 24 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>
                        Entwicklungsprognose
                      </p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }} data-testid="text-matchcheck-team-dev">
                        {devScore} von 6 <span style={{ fontWeight: 400, fontSize: 14, color: "#48484A" }}>– {devLabels[devScore]}</span>
                      </p>
                      <div style={{ display: "flex", gap: 5, marginBottom: 18 }} data-testid="gauge-matchcheck-team-dev">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} style={{ flex: 1, height: 10, borderRadius: 3, background: i < devScore ? devGaugeColor : "rgba(0,0,0,0.08)" }} />
                        ))}
                      </div>
                      <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.75, margin: 0 }} data-testid="text-matchcheck-team-devtext">{devTexts[devScore]}</p>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="mb-8 rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-kompakt">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
              background: liveResult.gesamtpassung === "geeignet" ? "#34C759" : liveResult.gesamtpassung === "bedingt" ? "#FF9500" : "#C41E3A",
            }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F" }} data-testid="kompakt-rolle">{roleName || "Rolle"}</span>
            <span style={{
              fontSize: 12, fontWeight: 650, letterSpacing: "0.02em",
              padding: "3px 10px", borderRadius: 8,
              background: liveResult.gesamtpassung === "geeignet" ? "rgba(52,199,89,0.10)" : liveResult.gesamtpassung === "bedingt" ? "rgba(255,149,0,0.10)" : "rgba(196,30,58,0.10)",
              color: liveResult.gesamtpassung === "geeignet" ? "#34C759" : liveResult.gesamtpassung === "bedingt" ? "#FF9500" : "#C41E3A",
              border: `1px solid ${liveResult.gesamtpassung === "geeignet" ? "rgba(52,199,89,0.20)" : liveResult.gesamtpassung === "bedingt" ? "rgba(255,149,0,0.20)" : "rgba(196,30,58,0.20)"}`,
            }} data-testid="kompakt-badge">
              {liveResult.controlIntensity === "gering" ? "Stabil" : liveResult.controlIntensity === "mittel" ? "Steuerbar" : "Kritisch"}
            </span>
          </div>
          <p style={{ fontSize: 13.5, color: "#6E6E73", lineHeight: 1.7, margin: "0 0 24px", paddingLeft: 24 }} data-testid="kompakt-summary">
            {liveSw.description}
          </p>

          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 20 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }} data-testid="kompakt-title">
              {liveSw.label} – {liveResult.controlIntensity === "gering" ? "stabil halten" : liveResult.controlIntensity === "mittel" ? "aktiv steuern" : "gezielt eingreifen"}
            </h3>
            <p style={{ fontSize: 13.5, color: "#6E6E73", lineHeight: 1.7, margin: "0 0 16px" }} data-testid="kompakt-narrative">
              {liveSw.narrative}
            </p>

            <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
              Was bedeutet das konkret?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {liveResult.entscheidungsfaktoren.slice(0, 3).map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }} data-testid={`kompakt-punkt-${i}`}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6E6E73", marginTop: 7, flexShrink: 0, opacity: 0.5 }} />
                  <span style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.7 }}>{f}</span>
                </div>
              ))}
            </div>

            <div style={{
              padding: "14px 18px", borderRadius: 14,
              background: "rgba(255,149,0,0.04)", border: "1px solid rgba(255,149,0,0.12)",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#FF9500", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
                Was ist zu tun?
              </p>
              <p style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.7, margin: 0 }} data-testid="kompakt-action">
                {liveResult.actions[0] || "Klare Erwartungen und Rahmenvorgaben etablieren."}
              </p>
            </div>
          </div>
        </div>

        {result && sw && (
          <>
            {/* ── Header ── */}
            <header className="mb-8 rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-header">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Team-Systemreport · Organisationsdiagnose
                  </p>
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl" data-testid="text-page-title">
                      {roleName || "Rolle"} · Systemanalyse
                    </h1>
                    <button onClick={() => window.print()}
                      className="no-print inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                      data-testid="button-export-pdf">
                      <Download className="h-4 w-4" /> PDF
                    </button>
                  </div>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                    Strukturelle Teamdynamik-Analyse: Wie wirkt sich die neue Person auf das bestehende Team aus?
                  </p>
                </div>
                <div className="grid min-w-[280px] grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" data-testid="metrics-grid">
                  <Metric label="Gesamtpassung" value={result.gesamtpassungLabel} valueClass={tone.text} />
                  <Metric label="Systemwirkung" value={sw.label} valueClass={sw.intensity === "hoch" ? "text-red-600" : "text-slate-900"} />
                  <Metric label="Teamprofil" value={teamConstLabel} />
                  <Metric label="Personenprofil" value={istConstLabel} />
                </div>
              </div>
            </header>

            {/* ── Decision + Systemwirkung ── */}
            <section className="mb-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]" data-testid="section-decision-banner">
              <div className={`rounded-[20px] border ${tone.border} bg-white p-8 shadow-sm`}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Entscheidung</p>
                    <h2 className={`mt-2 text-3xl font-semibold ${tone.text}`} data-testid="text-gesamtpassung">
                      {result.gesamtpassungLabel}
                    </h2>
                  </div>
                  <div className={`rounded-full border px-3 py-1 text-sm font-medium ${tone.pill}`} data-testid="indicator-gesamtpassung">
                    {passungBadge(result.gesamtpassung)}
                  </div>
                </div>

                {result.entscheidungsfaktoren.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 mb-5" data-testid="box-entscheidungsfaktoren">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-3">
                      {result.gesamtpassung === "geeignet" ? "Warum geeignet?" : result.gesamtpassung === "bedingt" ? "Warum bedingt?" : "Warum kritisch?"}
                    </div>
                    <ol className="space-y-2">
                      {result.entscheidungsfaktoren.map((f, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm leading-6 text-slate-800" data-testid={`factor-${i}`}>
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">{i + 1}</span>
                          {f}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <p className="max-w-3xl text-base leading-7 text-slate-700">
                  {result.managementSummary.split("\n").filter(l => l.trim() && !l.includes(":") || l.length > 60).pop() || ""}
                </p>
              </div>

              <div className="rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-systemwirkung-shift">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Systemwirkung</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">{sw.label}</h3>
                <div className={`mt-3 inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${sw.intensity === "hoch" ? "border-red-200 text-red-700" : sw.intensity === "mittel" ? "border-amber-200 text-amber-700" : "border-slate-200 text-slate-500"}`}>
                  Intensität: {sw.intensity}
                </div>
                <div className="mt-5 grid gap-4">
                  <ShiftPill title="Team aktuell" value={COMP_LABELS[teamDomKey]} tone={domTone(teamDomKey)} />
                  <div className="flex items-center justify-center text-2xl text-slate-300">↓</div>
                  <ShiftPill title="Neue Person bringt" value={COMP_LABELS[istDomKey]} tone={domTone(istDomKey)} />
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-600">
                  {sw.description}
                </p>
              </div>
            </section>

            {/* ── Profile Comparison + Deltas ── */}
            <section className="mb-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-strukturvergleich">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Strukturvergleich</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">Team · Neue Person</h3>
                  </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <ProfileCard title="Teamprofil" subtitle="Bestehendes Team" profile={teamProfileArr}
                    description={`Das Team zeigt ${teamConstLabel.toLowerCase()}. Der stärkste Anteil liegt bei ${COMP_SHORT[teamDomKey]}.`}
                  />
                  <ProfileCard title="Person" subtitle={candidateName || "Person"} profile={istProfileArr}
                    description={`Die Person arbeitet stärker über ${COMP_SHORT[istDomKey]}, ${istDomKey === "impulsiv" ? "direkte Umsetzung und schnelle Entscheidungen" : istDomKey === "analytisch" ? "strukturierte Planung und Prüftiefe" : "Kommunikation und Beziehungsarbeit"}.`}
                  />
                </div>
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5" data-testid="chart-triangle">
                  <DualTriangleChart ist={istProfile} team={teamProfileN} />
                </div>
              </div>

              <div className="rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-deltas">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Team-Person-Abweichung</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Abweichung je Wirkdimension</h3>
                <div className="mt-6 space-y-5">
                  {deltas.map(item => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-800">{item.label}</span>
                        <span className={`font-semibold ${item.deltaTone}`}>{item.delta}</span>
                      </div>
                      <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="bg-emerald-400 rounded-full" style={{ width: `${item.team}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Team {item.team}%</span>
                        <span>Person {item.ist}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 mb-4">Arbeitslogik</p>
                  <Prose text={result.fuehrungsprofil} />
                </div>
              </div>
            </section>

            {/* ── Impact Areas + Risk Timeline ── */}
            <section className="mb-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]" data-testid="section-impact-risk">
              <div className="rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-impact-areas">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Wirkungsfelder</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Auswirkung nach Bereich</h3>
                <div className="mt-6 space-y-4">
                  {result.impactAreas.map((area, i) => (
                    <div key={i} className={`rounded-2xl border p-5 ${severityTone(area.severity)}`} data-testid={`impact-area-${i}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-base font-semibold" data-testid={`impact-area-label-${i}`}>{area.label}</h4>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${severityTone(area.severity)}`} data-testid={`impact-area-severity-${i}`}>
                          {severityLabel(area.severity)}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm leading-6">
                        <p data-testid={`impact-area-teamexpect-${i}`}><span className="font-medium">Team erwartet:</span> {area.teamExpectation}</p>
                        <p data-testid={`impact-area-candidate-${i}`}><span className="font-medium">Person zeigt:</span> {area.candidatePattern}</p>
                        <p data-testid={`impact-area-risk-${i}`}><span className="font-medium">Risiko:</span> {area.risk}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-risk-timeline">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Risiko-Zeitleiste</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Kritische Phasen</h3>
                <div className="mt-6 relative">
                  <div className="absolute left-3 top-3 bottom-3 w-px bg-slate-200" />
                  <div className="space-y-6">
                    {result.riskTimeline.map((phase, i) => {
                      const dotColor = i === 0 ? "border-red-400 bg-red-50 text-red-700" : i === 1 ? "border-amber-400 bg-amber-50 text-amber-700" : "border-green-400 bg-green-50 text-green-700";
                      return (
                        <div key={i} className="flex items-start gap-5 relative" data-testid={`risk-phase-${i}`}>
                          <div className={`relative z-10 mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${dotColor}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-slate-950" data-testid={`risk-phase-label-${i}`}>{phase.label}</span>
                              <span className="text-xs text-slate-500" data-testid={`risk-phase-period-${i}`}>{phase.period}</span>
                            </div>
                            <p className="text-sm leading-6 text-slate-600" data-testid={`risk-phase-text-${i}`}>{phase.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Systemwirkung Detail + Teamdynamik ── */}
            <section className="mb-8 rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-systemwirkung">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Strukturelle Wirkungsanalyse</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Wirkung im System</h3>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 mb-8">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                  <h4 className="text-base font-semibold text-slate-950 mb-3">Teamstruktur</h4>
                  <Prose text={result.teamstruktur} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                  <h4 className="text-base font-semibold text-slate-950 mb-3">Teamdynamik im Alltag</h4>
                  <Prose text={result.teamdynamikAlltag} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                <h4 className="text-base font-semibold text-slate-950 mb-3">Kulturwirkung</h4>
                <Prose text={result.kulturwirkung} />
              </div>

              <div className="mt-8">
                <Prose text={result.systemwirkung} />
              </div>
            </section>

            {/* ── Development Gauge ── */}
            <section className="mb-8 rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-development">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Entwicklungsbedarf</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Steuerungsintensität</h3>
              </div>
              <div className="flex items-center gap-6 mb-5">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map(level => (
                    <div key={level}
                      className={`h-8 w-10 rounded-lg ${level <= result.developmentLevel
                        ? result.developmentLevel >= 3 ? "bg-green-500" : result.developmentLevel === 2 ? "bg-amber-500" : "bg-red-500"
                        : "bg-slate-100"}`}
                      data-testid={`dev-bar-${level}`}
                    />
                  ))}
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-950" data-testid="text-development-label">{result.developmentLabel}</div>
                  <div className="text-xs text-slate-500" data-testid="text-development-level">Stufe {result.developmentLevel} von 4</div>
                </div>
              </div>
              <p className="text-sm leading-7 text-slate-700 max-w-3xl">{result.developmentText}</p>
              <div className={`mt-5 inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${result.controlIntensity === "hoch" ? "border-red-200 text-red-700" : result.controlIntensity === "mittel" ? "border-amber-200 text-amber-700" : "border-green-200 text-green-700"}`}>
                Steuerungsaufwand: {result.controlIntensity}
              </div>
            </section>

            {/* ── Stress Behavior (structured) ── */}
            <section className="mb-8 grid gap-8 lg:grid-cols-2" data-testid="section-stress">
              <div className="rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-2 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Kontrollierter Druck</p>
                </div>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Verhalten bei steigendem Arbeitsdruck</h3>
                <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/40 p-5">
                  <p className="text-sm leading-7 text-slate-700">{result.stressBehavior.controlledPressure}</p>
                </div>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-2 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Unkontrollierter Stress</p>
                </div>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Verhalten bei starker Belastung</h3>
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/40 p-5">
                  <p className="text-sm leading-7 text-slate-700">{result.stressBehavior.uncontrolledStress}</p>
                </div>
              </div>
            </section>

            {/* ── Chancen / Risiken side by side ── */}
            <section className="mb-8 grid gap-8 lg:grid-cols-2" data-testid="section-chancen-risiken">
              <div className="rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Chancen</p>
                <h3 className="text-xl font-semibold text-slate-950 mb-5">Potenziale der Besetzung</h3>
                <ul className="space-y-3">
                  {(sw.chancen).map((c, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-6 text-slate-700" data-testid={`chance-${i}`}>
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <Prose text={result.chancen} />
                </div>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Risiken</p>
                <h3 className="text-xl font-semibold text-slate-950 mb-5">Strukturelle Risiken</h3>
                <ul className="space-y-3">
                  {(sw.risiken).map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-6 text-slate-700" data-testid={`risk-${i}`}>
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <Prose text={result.risiken} />
                </div>
              </div>
            </section>

            {/* ── Actions + Integrationsplan (structured) ── */}
            <section className="mb-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-fuehrungshebel">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Handlungsempfehlung</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Führungshebel</h3>
                <ul className="mt-6 space-y-4">
                  {result.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-6 text-slate-700" data-testid={`lever-${i}`}>
                      <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                        <Check className="h-3 w-3" />
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-integrationsplan">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Integrationsplan</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">8-Wochen-Plan</h3>
                <div className="mt-8 space-y-6">
                  {result.integrationsplanPhasen.map((phase, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6" data-testid={`integration-phase-${i}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {phase.num}
                        </span>
                        <div>
                          <h4 className="text-base font-semibold text-slate-950">{phase.title}</h4>
                          <span className="text-xs text-slate-500">{phase.period}</span>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {phase.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Final Assessment ── */}
            <section className="mb-8 rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-systemfazit">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Gesamtbewertung</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">Abschließende Empfehlung</h3>
                  <div className="mt-4 max-w-3xl">
                    <Prose text={result.systemfazit} />
                  </div>
                </div>
                <div className={`rounded-2xl border px-6 py-5 text-center ${tone.border} ${tone.bg}`} data-testid="text-final-rating">
                  <div className={`text-sm font-semibold uppercase tracking-[0.18em] ${tone.text}`}>Ergebnis</div>
                  <div className={`mt-2 text-2xl font-semibold ${tone.text}`}>{result.gesamtpassungLabel}</div>
                  <div className="mt-3 text-sm text-slate-600">Systemwirkung · {sw.label}</div>
                </div>
              </div>
            </section>

            <div className="flex justify-center no-print pb-8">
              <button onClick={() => setReportGenerated(false)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                data-testid="button-reconfigure">
                Profil anpassen
              </button>
            </div>
          </>
        )}

        <style>{`
          @media print {
            body { background: #FFFFFF !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            nav { display: none !important; }
            @page { size: A4 landscape; margin: 12mm; }
            section { break-inside: avoid; page-break-inside: avoid; }
          }
        `}</style>
      </div>
    </div>
  );
}
