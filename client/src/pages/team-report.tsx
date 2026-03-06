import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Download, Check } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "@/lib/jobcheck-engine";
import { computeTeamReport } from "@/lib/team-report-engine";
import { constellationLabel, detectConstellation } from "@/lib/soll-ist-engine";
import type { Triad, ComponentKey } from "@/lib/jobcheck-engine";
import type { TeamReportResult, SystemwirkungResult, GesamtpassungLevel } from "@/lib/team-report-engine";

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
      <div className="space-y-4">
        {profile.map(item => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-slate-900">{item.label}</span>
                <span className="ml-2 text-slate-500">{item.short}</span>
              </div>
              <span className="font-semibold text-slate-700">{item.value}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        {description}
      </div>
    </div>
  );
}

function TripleTriangleChart({ soll, ist, team }: { soll: Triad; ist: Triad; team: Triad }) {
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
        <polygon points={triadToTriangle(soll)} fill="rgba(37,99,235,0.10)" stroke="#2563eb" strokeWidth="3" />
        <polygon points={triadToTriangle(team)} fill="rgba(16,185,129,0.10)" stroke="#10b981" strokeWidth="3" />
        <polygon points={triadToTriangle(ist)} fill="rgba(245,158,11,0.14)" stroke="#f59e0b" strokeWidth="3" />
      </svg>
      <div className="mt-2 flex items-center gap-6 text-sm text-slate-500">
        <Legend color="bg-blue-600" label="Rolle" />
        <Legend color="bg-emerald-500" label="Team" />
        <Legend color="bg-amber-500" label="Kandidat" />
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

function SliderGroup({
  title, imp, int, ana, onImpChange, onIntChange, onAnaChange, testIdPrefix,
}: {
  title: string; imp: number; int: number; ana: number;
  onImpChange: (v: number) => void; onIntChange: (v: number) => void; onAnaChange: (v: number) => void;
  testIdPrefix: string;
}) {
  const profile = normalizeTriad({ impulsiv: imp, intuitiv: int, analytisch: ana });
  const dom = dominanceModeOf(profile);
  const items: { key: ComponentKey; val: number; setter: (v: number) => void }[] = [
    { key: "impulsiv", val: imp, setter: onImpChange },
    { key: "intuitiv", val: int, setter: onIntChange },
    { key: "analytisch", val: ana, setter: onAnaChange },
  ];

  return (
    <div>
      <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">{title}</div>
      <div className="text-xs text-slate-500 mb-4">{dominanceLabel(dom)}</div>
      {items.map(({ key, val, setter }) => (
        <div key={key} className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-slate-800">{labelComponent(key)} <span className="text-slate-500">{COMP_LABELS[key]}</span></span>
            <span className="font-semibold text-slate-700">{Math.round(profile[key])}%</span>
          </div>
          <input type="range" min={5} max={80} value={val} onChange={(e) => setter(Number(e.target.value))}
            className="w-full accent-slate-600" data-testid={`slider-${testIdPrefix}-${key}`} />
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 mt-1">
            <div className={`h-full rounded-full ${BAR_CSS[key]}`} style={{ width: `${profile[key]}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TeamReport() {
  const [, setLocation] = useLocation();

  const [sollImp, setSollImp] = useState(33);
  const [sollInt, setSollInt] = useState(34);
  const [sollAna, setSollAna] = useState(33);
  const [istImp, setIstImp] = useState(33);
  const [istInt, setIstInt] = useState(34);
  const [istAna, setIstAna] = useState(33);
  const [teamImp, setTeamImp] = useState(33);
  const [teamInt, setTeamInt] = useState(34);
  const [teamAna, setTeamAna] = useState(33);
  const [roleName, setRoleName] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (raw) {
      try {
        const dna = JSON.parse(raw) as RoleDnaState;
        if (dna.beruf) setRoleName(dna.beruf);
        if (dna.bioGramGesamt) {
          const t = bgToTriad(dna.bioGramGesamt);
          setSollImp(t.impulsiv); setSollInt(t.intuitiv); setSollAna(t.analytisch);
        }
      } catch {}
    }
    const candRaw = localStorage.getItem("jobcheckCandProfile");
    if (candRaw) {
      try {
        const cand = JSON.parse(candRaw);
        if (cand.name) setCandidateName(cand.name);
        if (cand.impulsiv != null) setIstImp(cand.impulsiv);
        if (cand.intuitiv != null) setIstInt(cand.intuitiv);
        if (cand.analytisch != null) setIstAna(cand.analytisch);
      } catch {}
    }
    const teamRaw = localStorage.getItem("teamProfile");
    if (teamRaw) {
      try {
        const tp = JSON.parse(teamRaw);
        if (tp.impulsiv != null) setTeamImp(tp.impulsiv);
        if (tp.intuitiv != null) setTeamInt(tp.intuitiv);
        if (tp.analytisch != null) setTeamAna(tp.analytisch);
      } catch {}
    }
  }, []);

  const sollProfile = normalizeTriad({ impulsiv: sollImp, intuitiv: sollInt, analytisch: sollAna });
  const istProfile = normalizeTriad({ impulsiv: istImp, intuitiv: istInt, analytisch: istAna });
  const teamProfileN = normalizeTriad({ impulsiv: teamImp, intuitiv: teamInt, analytisch: teamAna });

  const sollDomKey = dominanceModeOf(sollProfile).top1.key;
  const istDomKey = dominanceModeOf(istProfile).top1.key;
  const teamDomKey = dominanceModeOf(teamProfileN).top1.key;

  const sollConstLabel = constellationLabel(detectConstellation(sollProfile));
  const istConstLabel = constellationLabel(detectConstellation(istProfile));
  const teamConstLabel = constellationLabel(detectConstellation(teamProfileN));

  const result: TeamReportResult | null = useMemo(() => {
    if (!reportGenerated) return null;
    return computeTeamReport(roleName || "Rolle", candidateName || "Kandidat", sollProfile, istProfile, teamProfileN);
  }, [reportGenerated, roleName, candidateName, sollProfile.impulsiv, sollProfile.intuitiv, sollProfile.analytisch, istProfile.impulsiv, istProfile.intuitiv, istProfile.analytisch, teamProfileN.impulsiv, teamProfileN.intuitiv, teamProfileN.analytisch]);

  const sw = result?.systemwirkungResult;
  const tone = result ? passungTone(result.gesamtpassung) : passungTone("geeignet");

  const sollProfileArr = [
    { label: "Impulsiv", short: "Umsetzung", value: sollProfile.impulsiv, color: BAR_CSS.impulsiv },
    { label: "Intuitiv", short: "Zusammenarbeit", value: sollProfile.intuitiv, color: BAR_CSS.intuitiv },
    { label: "Analytisch", short: "Struktur", value: sollProfile.analytisch, color: BAR_CSS.analytisch },
  ];
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

  const deltas: { label: string; soll: number; ist: number; team: number; sollIstDelta: string; sollIstTone: string }[] = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
    const d = Math.round(istProfile[k] - sollProfile[k]);
    return {
      label: COMP_LABELS[k],
      soll: Math.round(sollProfile[k]),
      ist: Math.round(istProfile[k]),
      team: Math.round(teamProfileN[k]),
      sollIstDelta: d >= 0 ? `+${d}` : `${d}`,
      sollIstTone: Math.abs(d) >= 15 ? "text-red-600" : Math.abs(d) >= 8 ? "text-amber-600" : "text-slate-600",
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <GlobalNav />
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">

        {!reportGenerated && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Konfiguration</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 mb-6" data-testid="text-page-title">Team-Systemreport konfigurieren</h1>
            <p className="text-sm text-slate-600 mb-8 max-w-2xl leading-6">
              Definieren Sie die drei Profile: Das Sollprofil der Rolle, das Ist-Profil des Kandidaten und das bestehende Teamprofil.
            </p>
            <div className="grid gap-6 mb-6 lg:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Rollenbezeichnung</label>
                <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="z.B. Teamleiter Vertrieb"
                  className="w-full h-9 px-3 text-sm font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-blue-400"
                  data-testid="input-role-name" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Name des Kandidaten</label>
                <input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="Name des Kandidaten"
                  className="w-full h-9 px-3 text-sm font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-blue-400"
                  data-testid="input-candidate-name" />
              </div>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              <SliderGroup title="Sollprofil (Rolle)" imp={sollImp} int={sollInt} ana={sollAna}
                onImpChange={setSollImp} onIntChange={setSollInt} onAnaChange={setSollAna} testIdPrefix="soll" />
              <SliderGroup title="Ist-Profil (Kandidat)" imp={istImp} int={istInt} ana={istAna}
                onImpChange={setIstImp} onIntChange={setIstInt} onAnaChange={setIstAna} testIdPrefix="ist" />
              <SliderGroup title="Teamprofil" imp={teamImp} int={teamInt} ana={teamAna}
                onImpChange={setTeamImp} onIntChange={setTeamInt} onAnaChange={setTeamAna} testIdPrefix="team" />
            </div>
            <div className="mt-8 flex justify-center">
              <button onClick={() => setReportGenerated(true)}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-[15px] font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
                data-testid="button-generate-report">
                Bericht erstellen
              </button>
            </div>
          </div>
        )}

        {result && sw && (
          <>
            {/* ── Header ── */}
            <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-header">
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
                  <Metric label="Rollenprofil" value={sollConstLabel} />
                  <Metric label="Kandidatenprofil" value={istConstLabel} />
                </div>
              </div>
            </header>

            {/* ── Decision + Systemwirkung ── */}
            <section className="mb-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]" data-testid="section-decision-banner">
              <div className={`rounded-3xl border ${tone.border} bg-white p-8 shadow-sm`}>
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

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-systemwirkung-shift">
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
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-strukturvergleich">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Strukturvergleich</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">Rolle · Team · Neue Person</h3>
                  </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                  <ProfileCard title="Soll-Profil" subtitle={roleName || "Rolle"} profile={sollProfileArr}
                    description={`Die Rolle verlangt vor allem ${COMP_SHORT[sollDomKey]}, ${sollDomKey === "analytisch" ? "Prüftiefe und verlässliche Planung" : sollDomKey === "impulsiv" ? "schnelle Umsetzung und Entscheidungsstärke" : "Kommunikation und Zusammenarbeit"}.`}
                  />
                  <ProfileCard title="Teamprofil" subtitle="Bestehendes Team" profile={teamProfileArr}
                    description={`Das Team zeigt ${teamConstLabel.toLowerCase()}. Der stärkste Anteil liegt bei ${COMP_SHORT[teamDomKey]}.`}
                  />
                  <ProfileCard title="Kandidat" subtitle={candidateName || "Kandidat"} profile={istProfileArr}
                    description={`Der Kandidat arbeitet stärker über ${COMP_SHORT[istDomKey]}, ${istDomKey === "impulsiv" ? "direkte Umsetzung und schnelle Entscheidungen" : istDomKey === "analytisch" ? "strukturierte Planung und Prüftiefe" : "Kommunikation und Beziehungsarbeit"}.`}
                  />
                </div>
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5" data-testid="chart-triangle">
                  <TripleTriangleChart soll={sollProfile} ist={istProfile} team={teamProfileN} />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-deltas">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Soll-Ist-Abweichung</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Abweichung je Wirkdimension</h3>
                <div className="mt-6 space-y-5">
                  {deltas.map(item => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-800">{item.label}</span>
                        <span className={`font-semibold ${item.sollIstTone}`}>{item.sollIstDelta}</span>
                      </div>
                      <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="bg-slate-300 rounded-full" style={{ width: `${item.soll}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Soll {item.soll}%</span>
                        <span>Ist {item.ist}%</span>
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

            {/* ── Systemwirkung Detail + Teamdynamik ── */}
            <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-systemwirkung">
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

            {/* ── Stress Behavior ── */}
            <section className="mb-8 grid gap-8 lg:grid-cols-2" data-testid="section-stress">
              {(() => {
                const stressLines = result.verhaltenUnterDruck.split("\n").filter(l => l.trim());
                const splitIdx = stressLines.findIndex(l => l.includes("Unkontrollierter Stress"));
                const controlled = stressLines.slice(0, splitIdx > 0 ? splitIdx : Math.floor(stressLines.length / 2))
                  .filter(l => !l.includes("Kontrollierter Druck:") && l.trim());
                const uncontrolled = stressLines.slice(splitIdx > 0 ? splitIdx : Math.floor(stressLines.length / 2))
                  .filter(l => !l.includes("Unkontrollierter Stress:") && l.trim());
                return (
                  <>
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                      <div className="mb-2 flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Kontrollierter Druck</p>
                      </div>
                      <h3 className="mt-2 text-xl font-semibold text-slate-950">Verhalten bei steigendem Arbeitsdruck</h3>
                      <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/40 p-5">
                        <div className="space-y-3 text-sm leading-7 text-slate-700">
                          {controlled.map((l, i) => <p key={i}>{l}</p>)}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                      <div className="mb-2 flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Unkontrollierter Stress</p>
                      </div>
                      <h3 className="mt-2 text-xl font-semibold text-slate-950">Verhalten bei starker Belastung</h3>
                      <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/40 p-5">
                        <div className="space-y-3 text-sm leading-7 text-slate-700">
                          {uncontrolled.map((l, i) => <p key={i}>{l}</p>)}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </section>

            {/* ── Chancen / Risiken side by side ── */}
            <section className="mb-8 grid gap-8 lg:grid-cols-2" data-testid="section-chancen-risiken">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
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
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
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

            {/* ── Führungshebel + Integrationsplan ── */}
            <section className="mb-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-fuehrungshebel">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Handlungsempfehlung</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Führungshebel</h3>
                <ul className="mt-6 space-y-3">
                  {result.fuehrungshebel.split("\n\n").filter(l => l.trim()).map((item, i) => {
                    const parts = item.split(": ");
                    const title = parts.length > 1 ? parts[0] : null;
                    const body = parts.length > 1 ? parts.slice(1).join(": ") : item;
                    return (
                      <li key={i} className="flex items-start gap-3 text-sm leading-6 text-slate-700" data-testid={`lever-${i}`}>
                        <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                          <Check className="h-3 w-3" />
                        </span>
                        <span>{title && <span className="font-semibold text-slate-900">{title}: </span>}{body}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-integrationsplan">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Integrationsplan</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">30-Tage-Plan</h3>
                <div className="mt-8 space-y-6">
                  {result.integrationsplan.split("\n\n").filter(l => l.trim()).reduce<{ title: string; items: string[] }[]>((acc, block) => {
                    const lines = block.split("\n").filter(l => l.trim());
                    if (lines.length === 0) return acc;
                    if (!lines[0].startsWith("- ") && lines[0].includes("Woche")) {
                      acc.push({ title: lines[0], items: lines.slice(1).map(l => l.replace(/^- /, "")) });
                    } else if (acc.length > 0) {
                      acc[acc.length - 1].items.push(...lines.map(l => l.replace(/^- /, "")));
                    } else {
                      acc.push({ title: "Phase", items: lines.map(l => l.replace(/^- /, "")) });
                    }
                    return acc;
                  }, []).map((phase, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6" data-testid={`integration-phase-${i}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {i + 1}
                        </span>
                        <h4 className="text-base font-semibold text-slate-950">{phase.title}</h4>
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
            <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-systemfazit">
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
