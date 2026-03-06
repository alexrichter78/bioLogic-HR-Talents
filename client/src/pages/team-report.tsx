import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowDown,
  BarChart3,
  CheckCircle2,
  Download,
  Gauge,
  GitCompareArrows,
  Radar,
  ShieldAlert,
  Users,
  Workflow,
} from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "@/lib/jobcheck-engine";
import { computeTeamReport } from "@/lib/team-report-engine";
import type { Triad, ComponentKey } from "@/lib/jobcheck-engine";
import type {
  TeamReportResult,
  TopMetric,
  WirkungsmatrixRow,
  DeltaRowData,
  StressBarItem,
  RiskMeterData,
  ForecastItem,
  IntegrationPhase,
  MetricTone,
} from "@/lib/team-report-engine";

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

const BAR_CSS: Record<ComponentKey, string> = {
  impulsiv: "bg-rose-500",
  intuitiv: "bg-amber-500",
  analytisch: "bg-blue-600",
};

function bgToTriad(bg: BG | undefined): Triad {
  if (!bg) return { impulsiv: 33, intuitiv: 33, analytisch: 34 };
  return { impulsiv: Math.round(bg.imp), intuitiv: Math.round(bg.int), analytisch: Math.round(bg.ana) };
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
          <div className="flex items-center gap-3">
            <input
              type="range" min={5} max={80} value={val}
              onChange={(e) => setter(Number(e.target.value))}
              className="flex-1 accent-slate-600"
              data-testid={`slider-${testIdPrefix}-${key}`}
            />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 mt-1">
            <div className={`h-full rounded-full ${BAR_CSS[key]}`} style={{ width: `${profile[key]}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>;
}

function SectionEyebrow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">{icon}</span>
      {label}
    </div>
  );
}

function MetricTile({ label, value, tone = "neutral" }: TopMetric) {
  const toneMap: Record<MetricTone, string> = {
    neutral: "border-slate-200 bg-slate-50 text-slate-900",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone]}`} data-testid={`metric-${label.toLowerCase()}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}

function ShiftBox({ title, value, tone }: { title: string; value: string; tone: "amber" | "rose" | "emerald" | "blue" }) {
  const toneMap: Record<string, string> = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone]}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">{title}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
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

type ProfilePointData = { key: string; label: string; value: number; color: string };

function ProfileCard({ title, subtitle, profile, note }: {
  title: string; subtitle: string; profile: ProfilePointData[]; note: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="mb-4">
        <div className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</div>
        <div className="mt-1 text-base font-semibold text-slate-950">{subtitle}</div>
      </div>
      <div className="space-y-4">
        {profile.map((item) => (
          <div key={item.key}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <div className="font-medium text-slate-900">{item.label}</div>
              <div className="font-semibold text-slate-700">{item.value}%</div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">{note}</div>
    </div>
  );
}

function triadToPoints(t: Triad, cx: number, cy: number, r: number): string {
  const top = { x: cx, y: cy - r * (t.analytisch / 50) };
  const bl = { x: cx - r * (t.intuitiv / 50), y: cy + r * 0.6 };
  const br = { x: cx + r * (t.impulsiv / 50), y: cy + r * 0.6 };
  return `${top.x},${top.y} ${bl.x},${bl.y} ${br.x},${br.y}`;
}

function TripleTriangleChart({ soll, ist, team }: { soll: Triad; ist: Triad; team: Triad }) {
  const cx = 170, cy = 140, r = 110;
  return (
    <div className="flex flex-col items-center" data-testid="triangle-chart">
      <svg viewBox="0 0 340 270" className="h-[270px] w-full max-w-[380px]">
        <polygon points={`${cx},${cy - r} ${cx - r},${cy + r * 0.6} ${cx + r},${cy + r * 0.6}`} fill="none" stroke="#cbd5e1" strokeWidth="2" />
        <text x={cx} y="15" textAnchor="middle" className="fill-slate-500 text-[12px]">Struktur</text>
        <text x="12" y="245" className="fill-slate-500 text-[12px]">Kommunikation</text>
        <text x="255" y="245" className="fill-slate-500 text-[12px]">Tempo</text>
        <polygon points={triadToPoints(soll, cx, cy, r)} fill="rgba(37,99,235,0.10)" stroke="#2563eb" strokeWidth="3" />
        <polygon points={triadToPoints(team, cx, cy, r)} fill="rgba(245,158,11,0.10)" stroke="#f59e0b" strokeWidth="3" />
        <polygon points={triadToPoints(ist, cx, cy, r)} fill="rgba(244,63,94,0.10)" stroke="#f43f5e" strokeWidth="3" />
      </svg>
      <p className="mt-2 text-center text-sm leading-6 text-slate-600">
        Die Grafik zeigt die strukturelle Logik von Rolle, Team und neuer Person in einem Bild.
        Je weiter die Flächen auseinanderliegen, desto höher das Reibungspotenzial.
      </p>
    </div>
  );
}

function DeltaRow({ label, value, tone }: DeltaRowData) {
  const toneMap: Record<string, string> = {
    danger: "text-rose-700 bg-rose-50 border-rose-200",
    warning: "text-amber-700 bg-amber-50 border-amber-200",
    neutral: "text-slate-700 bg-slate-50 border-slate-200",
  };
  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone]}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value} Punkte</div>
    </div>
  );
}

function ListCard({ eyebrow, icon, title, items, tone }: {
  eyebrow: string; icon: ReactNode; title: string; items: string[]; tone: "success" | "danger" | "neutral";
}) {
  const dotTone: Record<string, string> = { success: "bg-emerald-500", danger: "bg-rose-500", neutral: "bg-blue-600" };
  return (
    <Card className="p-8">
      <SectionEyebrow icon={icon} label={eyebrow} />
      <h3 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h3>
      <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${dotTone[tone]}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StressCard({ title, items, text }: { title: string; items: StressBarItem[]; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-base font-semibold text-slate-950">{title}</h4>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
              <span>{item.label}</span>
              <span>{item.value}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white">
              <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

function RiskMeter({ label, value, color }: RiskMeterData) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-800">{label}</span>
        <span className="font-semibold text-slate-700">{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function TopProfile({ title, name, values }: { title: string; name: string; values: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</div>
      <div className="mt-1 text-base font-semibold text-slate-950">{name}</div>
      <div className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Profil</div>
      <div className="mt-1 text-sm font-medium text-slate-700">{values}</div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "danger" | "warning" | "neutral" | "success" }) {
  const toneMap: Record<string, string> = {
    danger: "text-rose-700", warning: "text-amber-700", neutral: "text-slate-900", success: "text-emerald-700",
  };
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${toneMap[tone]}`}>{value}</div>
    </div>
  );
}

function MatrixRatingBadge({ rating }: { rating: WirkungsmatrixRow["rating"] }) {
  const map: Record<string, string> = {
    stabil: "bg-emerald-50 text-emerald-700 border-emerald-200",
    steuerbar: "bg-amber-50 text-amber-700 border-amber-200",
    kritisch: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wide ${map[rating]}`}>
      {rating}
    </span>
  );
}

function splitParagraphs(text: string): string[] {
  return text.split("\n").filter(l => l.trim().length > 0);
}

function TextBlock({ text }: { text: string }) {
  const paras = splitParagraphs(text);
  return (
    <div className="space-y-3 text-sm leading-7 text-slate-700">
      {paras.map((p, i) => {
        const isHeading = p.endsWith(":") && p.length < 60;
        if (isHeading) return <div key={i} className="font-semibold text-slate-900 mt-4">{p}</div>;
        return <p key={i}>{p}</p>;
      })}
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
  const teamProfile = normalizeTriad({ impulsiv: teamImp, intuitiv: teamInt, analytisch: teamAna });

  const result: TeamReportResult | null = useMemo(() => {
    if (!reportGenerated) return null;
    return computeTeamReport(
      roleName || "Rolle",
      candidateName || "Kandidat",
      sollProfile, istProfile, teamProfile
    );
  }, [reportGenerated, roleName, candidateName, sollProfile.impulsiv, sollProfile.intuitiv, sollProfile.analytisch, istProfile.impulsiv, istProfile.intuitiv, istProfile.analytisch, teamProfile.impulsiv, teamProfile.intuitiv, teamProfile.analytisch]);

  const rn = roleName || "Rolle";
  const cn = candidateName || "Kandidat";

  function toProfilePoints(t: Triad): ProfilePointData[] {
    return [
      { key: "tempo", label: "Umsetzung / Tempo", value: Math.round(t.impulsiv), color: "bg-rose-500" },
      { key: "kommunikation", label: "Zusammenarbeit / Kommunikation", value: Math.round(t.intuitiv), color: "bg-amber-500" },
      { key: "struktur", label: "Struktur / Analyse", value: Math.round(t.analytisch), color: "bg-blue-600" },
    ];
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <GlobalNav />
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">

        {!reportGenerated && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Analyse</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 mb-2" data-testid="text-page-title">
              Team-Systemreport konfigurieren
            </h1>
            <p className="text-sm text-slate-600 mb-8 max-w-2xl leading-6">
              Definieren Sie die drei Profile: Das Sollprofil der Rolle, das Ist-Profil des Kandidaten und das bestehende Teamprofil. Der Bericht analysiert die systemische Wirkung der neuen Person auf das Team.
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

        {result && (
          <>
            {/* Header */}
            <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-header">
              <div className="mb-6 max-w-4xl">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Team-Systemreport</p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950" data-testid="text-page-title">{rn} · Systemanalyse</h1>
                    <p className="mt-4 text-base leading-7 text-slate-600">
                      Strukturelle Teamdynamik-Analyse: Wie wirkt sich die neue Person auf das bestehende Team aus?
                    </p>
                  </div>
                  <button onClick={() => window.print()}
                    className="no-print inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                    data-testid="button-export-pdf">
                    <Download className="h-4 w-4" /> PDF
                  </button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-5 sm:grid-cols-3">
                    <TopProfile title="Rolle" name={rn} values={`I ${Math.round(sollProfile.impulsiv)}% / N ${Math.round(sollProfile.intuitiv)}% / A ${Math.round(sollProfile.analytisch)}%`} />
                    <TopProfile title="Neue Person" name={cn} values={`I ${Math.round(istProfile.impulsiv)}% / N ${Math.round(istProfile.intuitiv)}% / A ${Math.round(istProfile.analytisch)}%`} />
                    <TopProfile title="Teamprofil" name="Bestehendes Team" values={`I ${Math.round(teamProfile.impulsiv)}% / N ${Math.round(teamProfile.intuitiv)}% / A ${Math.round(teamProfile.analytisch)}%`} />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <MiniStat label="Abweichung Soll vs. Person" value={`${result.deltaRows[0].value} Punkte`} tone={result.deltaRows[0].tone} />
                    <MiniStat label="Abweichung Team vs. Person" value={`${result.deltaRows[1].value} Punkte`} tone={result.deltaRows[1].tone} />
                    <MiniStat label="Systemstatus" value={result.teamfitLabel} tone={result.teamfitLabel === "Stabil" ? "success" : result.teamfitLabel === "Steuerbar" ? "warning" : "danger"} />
                    <MiniStat label="30-Tage-Relevanz" value={result.integrationsrisiko === "Gering" ? "normal" : result.integrationsrisiko === "Erhöht" ? "erhöht" : "hoch"} tone={result.integrationsrisiko === "Gering" ? "neutral" : result.integrationsrisiko === "Erhöht" ? "warning" : "danger"} />
                  </div>
                </div>
              </div>
            </section>

            {/* Row 1: Management Summary + Systemwirkung */}
            <section className="mb-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]" data-testid="section-summary-row">
              <Card className="p-8">
                <SectionEyebrow icon={<ShieldAlert className="h-4 w-4" />} label="Management Summary" />
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950" data-testid="text-summary-headline">{result.summaryHeadline}</h2>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
                  {splitParagraphs(result.managementSummary).slice(-1)[0]}
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {result.topMetrics.map((metric) => (
                    <MetricTile key={metric.label} {...metric} />
                  ))}
                </div>
              </Card>

              <Card className="p-8">
                <SectionEyebrow icon={<GitCompareArrows className="h-4 w-4" />} label="Systemwirkung" />
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">{result.systemwirkungResult.label} der Teamlogik</h3>
                <div className="mt-6 space-y-4">
                  <ShiftBox title="Team heute" value={result.shiftFrom} tone="amber" />
                  <div className="flex justify-center text-slate-300"><ArrowDown className="h-8 w-8" /></div>
                  <ShiftBox title="Neue Person bringt" value={result.shiftTo} tone="rose" />
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-600">{result.systemwirkungResult.description}</p>
              </Card>
            </section>

            {/* Row 2: Strukturvergleich + Abweichung/Teamstruktur */}
            <section className="mb-8 grid gap-8 xl:grid-cols-[1.25fr_0.75fr]" data-testid="section-comparison">
              <Card className="p-8">
                <SectionEyebrow icon={<Radar className="h-4 w-4" />} label="Strukturvergleich" />
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-950">Rolle · Team · neue Person</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Die Visualisierung zeigt, wie weit Rollenanforderung, bestehendes Team und neue Person in ihrer Arbeitslogik voneinander entfernt sind.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <Legend color="bg-blue-600" label="Rolle" />
                    <Legend color="bg-amber-500" label="Team" />
                    <Legend color="bg-rose-500" label="Neue Person" />
                  </div>
                </div>
                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                  <ProfileCard title="Rollenprofil" subtitle={rn} profile={toProfilePoints(sollProfile)} note={result.sollNoteText} />
                  <ProfileCard title="Teamprofil" subtitle="Bestehendes Team" profile={toProfilePoints(teamProfile)} note={result.teamNoteText} />
                  <ProfileCard title="Profil neue Person" subtitle={cn} profile={toProfilePoints(istProfile)} note={result.istNoteText} />
                </div>
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <TripleTriangleChart soll={sollProfile} ist={istProfile} team={teamProfile} />
                </div>
              </Card>

              <div className="space-y-8">
                <Card className="p-8">
                  <SectionEyebrow icon={<BarChart3 className="h-4 w-4" />} label="Abweichung" />
                  <h3 className="mt-3 text-2xl font-semibold text-slate-950">Abweichungsprofil</h3>
                  <div className="mt-6 space-y-5">
                    {result.deltaRows.map((row) => <DeltaRow key={row.label} {...row} />)}
                  </div>
                  <div className={`mt-6 rounded-2xl border p-4 text-sm leading-6 ${
                    result.deltaRows[0].tone === "danger" ? "border-rose-200 bg-rose-50 text-rose-800" :
                    result.deltaRows[0].tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-800" :
                    "border-slate-200 bg-slate-50 text-slate-700"
                  }`}>
                    {result.riskCallout}
                  </div>
                </Card>

                <Card className="p-8">
                  <SectionEyebrow icon={<Users className="h-4 w-4" />} label="Teamstruktur" />
                  <h3 className="mt-3 text-2xl font-semibold text-slate-950">Ausgangslage des Teams</h3>
                  <div className="mt-4">
                    <TextBlock text={result.teamstruktur} />
                  </div>
                </Card>
              </div>
            </section>

            {/* Row 3: Führungsprofil + Teamdynamik im Alltag */}
            <section className="mb-8 grid gap-8 lg:grid-cols-2" data-testid="section-profiles">
              <Card className="p-8">
                <SectionEyebrow icon={<Workflow className="h-4 w-4" />} label="Führungsprofil" />
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">Arbeitslogik der neuen Person</h3>
                <div className="mt-4"><TextBlock text={result.fuehrungsprofil} /></div>
              </Card>

              <Card className="p-8">
                <SectionEyebrow icon={<Gauge className="h-4 w-4" />} label="Teamdynamik im Alltag" />
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">Wie sich die Unterschiede im Alltag zeigen</h3>
                <div className="mt-4"><TextBlock text={result.teamdynamikAlltag} /></div>
              </Card>
            </section>

            {/* Row 3b: Wirkungsmatrix */}
            <Card className="mb-8 p-8" data-testid="section-wirkungsmatrix">
              <SectionEyebrow icon={<BarChart3 className="h-4 w-4" />} label="Wirkungsmatrix" />
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">Bewertung nach Wirkungsbereich</h3>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="pb-3 pr-4 font-semibold text-slate-500 uppercase tracking-[0.14em] text-xs">Bereich</th>
                      <th className="pb-3 pr-4 font-semibold text-slate-500 uppercase tracking-[0.14em] text-xs">Bewertung</th>
                      <th className="pb-3 font-semibold text-slate-500 uppercase tracking-[0.14em] text-xs">Einschätzung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.wirkungsmatrix.map((row) => (
                      <tr key={row.area} className="border-b border-slate-100">
                        <td className="py-4 pr-4 font-semibold text-slate-900 whitespace-nowrap">{row.area}</td>
                        <td className="py-4 pr-4"><MatrixRatingBadge rating={row.rating} /></td>
                        <td className="py-4 text-slate-700">{row.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Row 4: Chancen + Risiken */}
            <section className="mb-8 grid gap-8 lg:grid-cols-2" data-testid="section-chances-risks">
              <ListCard eyebrow="Chancen" icon={<CheckCircle2 className="h-4 w-4" />}
                title="Potenziale dieser Konstellation" items={result.chancenItems} tone="success" />
              <ListCard eyebrow="Risiken" icon={<AlertTriangle className="h-4 w-4" />}
                title="Typische Reibungspunkte" items={result.risikenItems} tone="danger" />
            </section>

            {/* Row 5: Verhalten unter Druck + Kulturwirkung */}
            <section className="mb-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]" data-testid="section-stress">
              <Card className="p-8">
                <SectionEyebrow icon={<Gauge className="h-4 w-4" />} label="Verhalten unter Druck" />
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">Stressdynamik der Konstellation</h3>
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  <StressCard title="Normalzustand" items={result.stressBars.normal}
                    text={`${cn} arbeitet sichtbar über ${[...result.stressBars.normal].sort((a,b) => b.value - a.value)[0].label} und ${[...result.stressBars.normal].sort((a,b) => b.value - a.value)[1].label}.`} />
                  <StressCard title="Kontrollierter Druck" items={result.stressBars.pressure}
                    text={`Unter steigender Belastung verstärkt sich ${[...result.stressBars.pressure].sort((a,b) => b.value - a.value)[0].label}. Die Abweichung zum Team wird sichtbarer.`} />
                  <StressCard title="Unkontrollierter Stress" items={result.stressBars.stress}
                    text={`Wenn Belastung sehr hoch wird, tritt ${[...result.stressBars.stress].sort((a,b) => b.value - a.value)[0].label} stärker hervor. Entscheidungen werden anders getroffen.`} />
                </div>
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                  <p><span className="font-semibold text-slate-950">Für das Team bedeutet das:</span> {result.stressCallout.replace("Für das Team bedeutet das: ", "")}</p>
                </div>
              </Card>

              <Card className="p-8">
                <SectionEyebrow icon={<Users className="h-4 w-4" />} label="Kulturwirkung" />
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">Veränderung der Teamkultur</h3>
                <div className="mt-4"><TextBlock text={result.kulturwirkung} /></div>
              </Card>
            </section>

            {/* Row 6: Führungshebel + Integrationsrisiko */}
            <section className="mb-8 grid gap-8 lg:grid-cols-2" data-testid="section-levers-risk">
              <ListCard eyebrow="Führungshebel" icon={<Workflow className="h-4 w-4" />}
                title="Was die Führung jetzt aktiv steuern muss" items={result.fuehrungshebelItems} tone="neutral" />

              <Card className="p-8">
                <SectionEyebrow icon={<BarChart3 className="h-4 w-4" />} label="Integrationsrisiko" />
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">Reibungspotenzial auf einen Blick</h3>
                <div className="mt-6 space-y-5">
                  {result.riskMeters.map((meter) => <RiskMeter key={meter.label} {...meter} />)}
                </div>
                <p className="mt-6 text-sm leading-6 text-slate-600">
                  Diese Werte dienen als Management-Indikator für den Steuerungsaufwand in den ersten Wochen.
                </p>
              </Card>
            </section>

            {/* Row 7: Integrationsplan + Systemprognose */}
            <section className="mb-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]" data-testid="section-plan-forecast">
              <Card className="p-8">
                <SectionEyebrow icon={<Workflow className="h-4 w-4" />} label="Integrationsplan" />
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">Erste 30 Tage</h3>
                <div className="mt-6 space-y-6">
                  {result.integrationPhases.map((group, idx) => (
                    <div key={group.phase} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                          {idx + 1}
                        </div>
                        <h4 className="text-base font-semibold text-slate-950">{group.phase}</h4>
                      </div>
                      <ul className="space-y-2 text-sm leading-6 text-slate-700">
                        {group.bullets.map((bullet, bi) => (
                          <li key={bi} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8">
                <SectionEyebrow icon={<BarChart3 className="h-4 w-4" />} label="Systemprognose" />
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">Wie sich das System über Zeit entwickelt</h3>
                <div className="mt-6 space-y-4">
                  {result.systemForecast.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">{item.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{item.text}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            {/* Row 8: Systemfazit */}
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-fazit">
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                <div>
                  <SectionEyebrow icon={<ShieldAlert className="h-4 w-4" />} label="Systemfazit" />
                  <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{result.fazitHeadline}</h3>
                  <div className="mt-4"><TextBlock text={result.systemfazit} /></div>
                </div>
                <div className={`rounded-3xl border p-6 text-center ${
                  result.fazitTone === "success" ? "border-emerald-200 bg-emerald-50" :
                  result.fazitTone === "warning" ? "border-amber-200 bg-amber-50" :
                  "border-rose-200 bg-rose-50"
                }`}>
                  <div className={`text-sm font-semibold uppercase tracking-[0.18em] ${
                    result.fazitTone === "success" ? "text-emerald-700" :
                    result.fazitTone === "warning" ? "text-amber-700" :
                    "text-rose-700"
                  }`}>Empfehlung</div>
                  <div className={`mt-3 text-2xl font-semibold ${
                    result.fazitTone === "success" ? "text-emerald-700" :
                    result.fazitTone === "warning" ? "text-amber-700" :
                    "text-rose-700"
                  }`}>{result.fazitEmpfehlung}</div>
                  <div className="mt-3 text-sm leading-6 text-slate-700">
                    {result.fazitTone === "success"
                      ? "Feedbackschleifen einbauen und Ergänzungspotenziale bewusst nutzen."
                      : result.fazitTone === "warning"
                      ? "Aktive Steuerung in den ersten 30 Tagen. Klare Erwartungen und regelmäßiges Feedback."
                      : "Regelmäßige Checkpoints einplanen. Eskalationsmechanismen und Entscheidungswege vorab klären."}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-8 flex justify-center no-print">
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
            nav, [data-testid="global-nav"] { display: none !important; }
            div[style*="position: fixed"] { display: none !important; }
            div[style*="height: 56"] { display: none !important; }
            @page { size: A4 portrait; margin: 14mm 16mm; }
            section, header, [data-testid^="section-"] { break-inside: avoid; page-break-inside: avoid; }
            h1 { font-size: 22pt !important; }
            h3 { font-size: 14pt !important; }
            p, div { font-size: 10pt !important; line-height: 1.5 !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
