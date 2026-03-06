import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Download, Check } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "@/lib/jobcheck-engine";
import { computeSollIst } from "@/lib/soll-ist-engine";
import type { Triad, ComponentKey } from "@/lib/jobcheck-engine";
import type { SollIstResult, Severity, ImpactArea } from "@/lib/soll-ist-engine";

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

function fitToneClasses(rating: string) {
  if (rating === "Nicht geeignet") return { text: "text-red-600", bg: "bg-red-50", border: "border-red-200", pill: "bg-red-50 text-red-700 border-red-200" };
  if (rating === "Bedingt geeignet") return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", pill: "bg-amber-50 text-amber-700 border-amber-200" };
  return { text: "text-green-600", bg: "bg-green-50", border: "border-green-200", pill: "bg-green-50 text-green-700 border-green-200" };
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

function domTone(k: ComponentKey) {
  if (k === "impulsiv") return "border-red-200 bg-red-50 text-red-700";
  if (k === "intuitiv") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function biggestGapText(rt: Triad, ct: Triad): string {
  const keys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
  let maxGap = 0, maxKey: ComponentKey = "analytisch";
  for (const k of keys) {
    const g = Math.abs(rt[k] - ct[k]);
    if (g > maxGap) { maxGap = g; maxKey = k; }
  }
  return `Die größte Abweichung liegt im Bereich ${COMP_LABELS[maxKey]}. Genau dort liegt die Kernanforderung der Rolle.`;
}

function fitBadgeLabel(rating: string) {
  if (rating === "Nicht geeignet") return "Kritischer Fit";
  if (rating === "Bedingt geeignet") return "Bedingt passend";
  return "Guter Fit";
}

function Metric({ label, value, valueClass = "text-slate-900" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${valueClass}`}>{value}</div>
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

function ProfileCard({ title, subtitle, profile, accent, description }: {
  title: string; subtitle: string;
  profile: { label: string; short: string; value: number; color: string }[];
  accent: "blue" | "amber";
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

function TriangleChart({ role, candidate }: { role: Triad; candidate: Triad }) {
  const top = { x: 160, y: 25 };
  const left = { x: 35, y: 220 };
  const right = { x: 285, y: 220 };

  function triadToPoint(t: Triad) {
    const total = t.analytisch + t.intuitiv + t.impulsiv || 1;
    const pA = t.analytisch / total;
    const pN = t.intuitiv / total;
    const pI = t.impulsiv / total;
    return {
      x: pA * top.x + pN * left.x + pI * right.x,
      y: pA * top.y + pN * left.y + pI * right.y,
    };
  }

  function triadToTriangle(t: Triad) {
    const total = t.analytisch + t.intuitiv + t.impulsiv || 1;
    const cx = 160, cy = 155;
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
        <polygon points={triadToTriangle(role)} fill="rgba(37,99,235,0.10)" stroke="#2563eb" strokeWidth="3" />
        <polygon points={triadToTriangle(candidate)} fill="rgba(245,158,11,0.14)" stroke="#f59e0b" strokeWidth="3" />
      </svg>
      <div className="mt-2 text-center text-sm text-slate-600">
        Die blaue Fläche zeigt die Rollenanforderung. Die orange Fläche zeigt die Arbeitslogik des Kandidaten.
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

export default function SollIstBericht() {
  const [, setLocation] = useLocation();
  const [candidateName, setCandidateName] = useState("");
  const [candImp, setCandImp] = useState(33);
  const [candInt, setCandInt] = useState(34);
  const [candAna, setCandAna] = useState(33);
  const [roleName, setRoleName] = useState("");
  const [roleTriad, setRoleTriad] = useState<Triad | null>(null);
  const [hasRollenDna, setHasRollenDna] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (!raw) return;
    try {
      const dna = JSON.parse(raw) as RoleDnaState;
      if (dna.beruf && dna.bioGramGesamt) {
        setHasRollenDna(true);
        setRoleName(dna.beruf);
        setRoleTriad(bgToTriad(dna.bioGramGesamt));
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

  const candidateProfile = normalizeTriad({ impulsiv: candImp, intuitiv: candInt, analytisch: candAna });
  const candDom = dominanceModeOf(candidateProfile);

  const result: SollIstResult | null = useMemo(() => {
    if (!roleTriad || !reportGenerated) return null;
    return computeSollIst(roleName, candidateName || "Kandidat", roleTriad, candidateProfile);
  }, [roleTriad, roleName, candidateName, candidateProfile.impulsiv, candidateProfile.intuitiv, candidateProfile.analytisch, reportGenerated]);

  if (!hasRollenDna || !roleTriad) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <GlobalNav />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h2 className="text-xl font-semibold text-slate-950 mb-3">Keine Rollen-DNA vorhanden</h2>
          <p className="text-sm text-slate-600 mb-6 leading-6">
            Bitte erstellen Sie zuerst eine Rollenanalyse, um den Soll-Ist-Bericht generieren zu können.
          </p>
          <button
            onClick={() => setLocation("/rollen-dna")}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            data-testid="button-go-to-rolle"
          >
            Zur Rollenanalyse
          </button>
        </div>
      </div>
    );
  }

  const roleProfile = [
    { label: "Impulsiv", short: "Umsetzung", value: roleTriad.impulsiv, color: BAR_CSS.impulsiv },
    { label: "Intuitiv", short: "Zusammenarbeit", value: roleTriad.intuitiv, color: BAR_CSS.intuitiv },
    { label: "Analytisch", short: "Struktur / Analyse", value: roleTriad.analytisch, color: BAR_CSS.analytisch },
  ];
  const candProfileArr = [
    { label: "Impulsiv", short: "Umsetzung", value: candidateProfile.impulsiv, color: BAR_CSS.impulsiv },
    { label: "Intuitiv", short: "Zusammenarbeit", value: candidateProfile.intuitiv, color: BAR_CSS.intuitiv },
    { label: "Analytisch", short: "Struktur / Analyse", value: candidateProfile.analytisch, color: BAR_CSS.analytisch },
  ];
  const roleDomKey = dominanceModeOf(roleTriad).top1.key;
  const candDomKey = candDom.top1.key;

  const deltas: { label: string; target: number; candidate: number; delta: string; tone: string }[] = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
    const d = Math.round(candidateProfile[k] - roleTriad[k]);
    return {
      label: COMP_LABELS[k],
      target: Math.round(roleTriad[k]),
      candidate: Math.round(candidateProfile[k]),
      delta: d >= 0 ? `+${d}` : `${d}`,
      tone: Math.abs(d) >= 15 ? "text-red-600" : Math.abs(d) >= 8 ? "text-amber-600" : "text-slate-600",
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <GlobalNav />
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">

        {/* === INPUT: Slider area before report === */}
        {!reportGenerated && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Konfiguration
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 mb-6">
              Soll-Ist-Bericht konfigurieren
            </h1>
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 mb-3">Soll-Profil (Rolle)</div>
                <div className="text-lg font-semibold text-slate-950 mb-1">{roleName}</div>
                <div className="text-sm text-slate-500 mb-4">{dominanceLabel(dominanceModeOf(roleTriad))}</div>
                {roleProfile.map(item => (
                  <div key={item.label} className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-slate-800">{item.label} <span className="text-slate-500">{item.short}</span></span>
                      <span className="font-semibold text-slate-700">{Math.round(item.value)}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 mb-3">Ist-Profil (Kandidat)</div>
                <input
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Name des Kandidaten"
                  className="w-full h-9 px-3 text-sm font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-blue-400 mb-4"
                  data-testid="input-candidate-name"
                />
                {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
                  const val = k === "impulsiv" ? candImp : k === "intuitiv" ? candInt : candAna;
                  const setter = k === "impulsiv" ? setCandImp : k === "intuitiv" ? setCandInt : setCandAna;
                  return (
                    <div key={k} className="mb-3 flex items-center gap-3">
                      <span className="w-20 text-right text-sm font-medium text-slate-600">{labelComponent(k)}</span>
                      <input
                        type="range" min={5} max={80} value={val}
                        onChange={(e) => setter(Number(e.target.value))}
                        className="flex-1 accent-slate-600"
                        data-testid={`slider-${k}`}
                      />
                      <span className="w-8 text-right text-sm font-semibold text-slate-700">{Math.round(candidateProfile[k])}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setReportGenerated(true)}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-[15px] font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
                data-testid="button-generate-report"
              >
                Bericht erstellen
              </button>
            </div>
          </div>
        )}

        {/* === REPORT OUTPUT === */}
        {result && (
          <>
            {/* ── Header ── */}
            <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm no-print-hide" data-testid="section-header">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Soll-Ist-Vergleich · Rollenpassung
                  </p>
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl" data-testid="text-page-title">
                      {result.roleName} · Passungsbericht
                    </h1>
                    <button
                      onClick={() => window.print()}
                      className="no-print inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                      data-testid="button-export-pdf"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </button>
                  </div>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                    {result.summaryText}
                  </p>
                </div>

                <div className="grid min-w-[280px] grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" data-testid="metrics-grid">
                  <Metric label="Gesamtpassung" value={result.fitLabel} valueClass={fitToneClasses(result.fitLabel).text} />
                  <Metric label="Steuerungsintensität" value={result.controlIntensity.charAt(0).toUpperCase() + result.controlIntensity.slice(1)} valueClass={result.controlIntensity === "hoch" ? "text-amber-600" : "text-slate-900"} />
                  <Metric label="Kritischer Bereich" value="Dominanzstruktur" />
                  <Metric label="Entwicklung" value={result.developmentLabel.charAt(0).toUpperCase() + result.developmentLabel.slice(1)} />
                </div>
              </div>
            </header>

            {/* ── Decision + Dominance Shift ── */}
            <section className="mb-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]" data-testid="section-decision-banner">
              <div className={`rounded-3xl border ${fitToneClasses(result.fitLabel).border} bg-white p-8 shadow-sm`}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Entscheidung</p>
                    <h2 className={`mt-2 text-3xl font-semibold ${fitToneClasses(result.fitLabel).text}`} data-testid="text-fit-rating">
                      {result.fitLabel}
                    </h2>
                  </div>
                  <div className={`rounded-full border px-3 py-1 text-sm font-medium ${fitToneClasses(result.fitLabel).pill}`}>
                    {fitBadgeLabel(result.fitLabel)}
                  </div>
                </div>
                <p className="max-w-3xl text-base leading-7 text-slate-700">
                  {result.summaryText}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-dominance-shift">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Dominanz-Verschiebung</p>
                <div className="mt-5 grid gap-4">
                  <ShiftPill title="Rolle" value={COMP_LABELS[result.roleDomKey]} tone={domTone(result.roleDomKey)} />
                  <div className="flex items-center justify-center text-2xl text-slate-300">↓</div>
                  <ShiftPill title="Kandidat" value={COMP_LABELS[result.candDomKey]} tone={domTone(result.candDomKey)} />
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-600">
                  {result.dominanceShiftText}
                </p>
              </div>
            </section>

            {/* ── Profile Comparison + Delta ── */}
            <section className="mb-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-radar">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Profilvergleich</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">Rolle vs. Kandidat</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <Legend color="bg-blue-600" label="Rolle" />
                    <Legend color="bg-amber-500" label="Kandidat" />
                  </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <ProfileCard
                    title="Soll-Profil Rolle" subtitle={result.roleName}
                    profile={roleProfile} accent="blue"
                    description={`Die Rolle verlangt vor allem ${COMP_SHORT[result.roleDomKey]}, ${result.roleDomKey === "analytisch" ? "Prüftiefe und verlässliche Planung" : result.roleDomKey === "impulsiv" ? "schnelle Umsetzung und Entscheidungsstärke" : "Kommunikation und Zusammenarbeit"}.`}
                  />
                  <ProfileCard
                    title="Ist-Profil Kandidat" subtitle={result.candidateName}
                    profile={candProfileArr} accent="amber"
                    description={`Der Kandidat arbeitet stärker über ${COMP_SHORT[result.candDomKey]}, ${result.candDomKey === "impulsiv" ? "direkte Umsetzung und schnelle Entscheidungen" : result.candDomKey === "analytisch" ? "strukturierte Planung und Prüftiefe" : "Kommunikation und Beziehungsarbeit"}.`}
                  />
                </div>
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5" data-testid="chart-triangle">
                  <TriangleChart role={result.roleTriad} candidate={result.candTriad} />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-comparison-bars">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Soll-Ist-Abweichung</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Abweichung je Wirkdimension</h3>
                <div className="mt-6 space-y-5">
                  {deltas.map(item => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-800">{item.label}</span>
                        <span className={`font-semibold ${item.tone}`}>{item.delta}</span>
                      </div>
                      <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="bg-slate-300 rounded-full" style={{ width: `${item.target}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Soll {item.target}%</span>
                        <span>Ist {item.candidate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`mt-6 rounded-2xl border p-4 text-sm leading-6 ${result.fitRating === "GEEIGNET" ? "border-green-100 bg-green-50 text-green-800" : result.fitRating === "BEDINGT" ? "border-amber-100 bg-amber-50 text-amber-800" : "border-red-100 bg-red-50 text-red-800"}`}>
                  {biggestGapText(result.roleTriad, result.candTriad)}
                </div>
              </div>
            </section>

            {/* ── Impact Matrix ── */}
            <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-impact-matrix">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Strukturelle Wirkungsanalyse</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">Auswirkungen der Abweichung</h3>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                  Erst Matrix, dann Detailanalyse
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[1.5fr_0.6fr] bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-600">
                  <div>Bereich</div>
                  <div className="text-right">Bewertung</div>
                </div>
                <div className="divide-y divide-slate-200">
                  {result.impactAreas.map(area => (
                    <div key={area.id} className="grid grid-cols-[1.5fr_0.6fr] items-center px-5 py-4 text-sm" data-testid={`matrix-row-${area.id}`}>
                      <div className="font-medium text-slate-900">{area.label}</div>
                      <div className="flex justify-end">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${severityTone(area.severity)}`}>
                          {severityLabel(area.severity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {result.impactAreas.map(area => (
                  <div key={area.id} className={`rounded-2xl border p-5 ${area.severity === "critical" ? "border-red-100 bg-red-50/40" : area.severity === "warning" ? "border-amber-100 bg-amber-50/40" : "border-green-100 bg-green-50/40"}`} data-testid={`impact-detail-${area.id}`}>
                    <h4 className="text-base font-semibold text-slate-950">{area.label}</h4>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                      <div><span className="font-semibold text-slate-900">Rolle braucht:</span> {area.roleNeed}</div>
                      <div><span className="font-semibold text-slate-900">Kandidat bringt:</span> {area.candidatePattern}</div>
                      <div>
                        <span className={`font-semibold ${area.severity === "critical" ? "text-red-700" : area.severity === "warning" ? "text-amber-700" : "text-green-700"}`}>
                          Risiko:
                        </span>{" "}
                        {area.risk}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Risk Timeline + Development + Actions ── */}
            <section className="mb-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-risk-timeline">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Risikoprognose</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Zeitliche Entwicklung der Risiken</h3>
                <div className="mt-8 space-y-6">
                  {result.riskTimeline.map((phase, i) => {
                    const dot = i === 0 ? "bg-green-500" : i === 1 ? "bg-amber-500" : "bg-red-500";
                    const border = i === 0 ? "border-l-green-500" : i === 1 ? "border-l-amber-500" : "border-l-red-500";
                    return (
                      <div key={i} className="relative pl-8">
                        {i < result.riskTimeline.length - 1 && <div className="absolute left-[7px] top-4 h-[calc(100%+12px)] w-px bg-slate-200" />}
                        <div className={`absolute left-0 top-1.5 h-4 w-4 rounded-full ${dot}`} />
                        <div className={`rounded-2xl border-l-4 bg-slate-50 p-4 ${border}`}>
                          <div className="mb-1 text-sm font-semibold text-slate-950">{phase.label} <span className="font-normal text-slate-500">{phase.period}</span></div>
                          <p className="text-sm leading-6 text-slate-700">{phase.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-development">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Entwicklungsprognose</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">Anpassungswahrscheinlichkeit</h3>
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">Entwicklungschance</span>
                      <span className={`font-semibold ${result.developmentLevel <= 2 ? "text-red-600" : result.developmentLevel <= 3 ? "text-amber-600" : "text-green-600"}`}>
                        {result.developmentLabel}
                      </span>
                    </div>
                    <div className="flex gap-2" data-testid="gauge-development">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-3 flex-1 rounded-full ${i < result.developmentLevel
                            ? result.developmentLevel <= 2 ? "bg-red-500" : result.developmentLevel <= 3 ? "bg-amber-500" : "bg-green-500"
                            : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-700">
                      {result.developmentText}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-actions">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Handlungsempfehlung</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">Konkrete Steuerungsmaßnahmen</h3>
                  <ul className="mt-6 space-y-3">
                    {result.actions.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                        <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                          <Check className="h-3 w-3" />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* ── Final Assessment ── */}
            <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-final-assessment">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Gesamtbewertung</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">Abschließende Empfehlung</h3>
                  <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
                    {result.finalText}
                  </p>
                </div>
                <div className={`rounded-2xl border px-6 py-5 text-center ${fitToneClasses(result.fitLabel).border} ${fitToneClasses(result.fitLabel).bg}`} data-testid="text-final-rating">
                  <div className={`text-sm font-semibold uppercase tracking-[0.18em] ${fitToneClasses(result.fitLabel).text}`}>Ergebnis</div>
                  <div className={`mt-2 text-2xl font-semibold ${fitToneClasses(result.fitLabel).text}`}>{result.fitLabel}</div>
                  <div className="mt-3 text-sm text-slate-600">Dominanzstruktur · {result.controlIntensity}er Steuerungsbedarf</div>
                </div>
              </div>
            </section>

            {/* ── Back / Re-configure button ── */}
            <div className="flex justify-center no-print">
              <button
                onClick={() => setReportGenerated(false)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                data-testid="button-reconfigure"
              >
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
          }
        `}</style>
      </div>
    </div>
  );
}
