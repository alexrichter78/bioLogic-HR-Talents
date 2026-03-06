import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Download, ShieldAlert, GitCompareArrows, Radar, Activity, Target } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "@/lib/jobcheck-engine";
import { computeTeamReport } from "@/lib/team-report-engine";
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
  const items: { key: ComponentKey; val: number; setter: (v: number) => void; bar: string }[] = [
    { key: "impulsiv", val: imp, setter: onImpChange, bar: "bg-slate-500" },
    { key: "intuitiv", val: int, setter: onIntChange, bar: "bg-slate-400" },
    { key: "analytisch", val: ana, setter: onAnaChange, bar: "bg-blue-600" },
  ];

  return (
    <div>
      <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">{title}</div>
      <div className="text-xs text-slate-500 mb-4">{dominanceLabel(dom)}</div>
      {items.map(({ key, val, setter, bar }) => (
        <div key={key} className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-slate-800">{labelComponent(key)} <span className="text-slate-500">{COMP_LABELS[key]}</span></span>
            <span className="font-semibold text-slate-700">{Math.round(profile[key])}%</span>
          </div>
          <input type="range" min={5} max={80} value={val} onChange={(e) => setter(Number(e.target.value))}
            className="w-full accent-slate-600" data-testid={`slider-${testIdPrefix}-${key}`} />
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 mt-1">
            <div className={`h-full rounded-full ${bar}`} style={{ width: `${profile[key]}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Prose({ text }: { text: string }) {
  const paragraphs = text.split("\n").filter(l => l.trim().length > 0);
  return (
    <div className="space-y-3 text-[15px] leading-7 text-slate-700">
      {paragraphs.map((p, i) => {
        const isHeading = p.endsWith(":") && p.length < 60;
        if (isHeading) return <div key={i} className="font-semibold text-slate-900 mt-6 text-base">{p}</div>;
        return <p key={i}>{p}</p>;
      })}
    </div>
  );
}

function MetricTile({ label, value, tone }: { label: string; value: string; tone: "neutral" | "warning" | "danger" }) {
  const toneClass = tone === "danger" ? "text-red-700" : tone === "warning" ? "text-slate-700" : "text-slate-900";
  const tid = `metric-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4" data-testid={tid}>
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${toneClass}`} data-testid={`${tid}-value`}>{value}</div>
    </div>
  );
}

function ProfileBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 text-sm" data-testid={`bar-${label.toLowerCase()}`}>
      <span className="w-24 text-slate-600 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${value}%` }} />
      </div>
      <span className="w-10 text-right font-semibold text-slate-700">{value}%</span>
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

  const result: TeamReportResult | null = useMemo(() => {
    if (!reportGenerated) return null;
    return computeTeamReport(roleName || "Rolle", candidateName || "Kandidat", sollProfile, istProfile, teamProfileN);
  }, [reportGenerated, roleName, candidateName, sollProfile.impulsiv, sollProfile.intuitiv, sollProfile.analytisch, istProfile.impulsiv, istProfile.intuitiv, istProfile.analytisch, teamProfileN.impulsiv, teamProfileN.intuitiv, teamProfileN.analytisch]);

  const sw = result?.systemwirkungResult;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <GlobalNav />
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">

        {!reportGenerated && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Analyse</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 mb-2" data-testid="text-page-title">Team-Systemreport konfigurieren</h1>
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

        {result && (
          <>
            {/* ══ 1. SUMMARY CARD ══ */}
            <section className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-header">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-10">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldAlert className="h-5 w-5 text-slate-400" />
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Management Summary</p>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap mb-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl" data-testid="text-page-title">
                      {roleName || "Rolle"} · Systemanalyse
                    </h1>
                    <button onClick={() => window.print()}
                      className="no-print inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                      data-testid="button-export-pdf">
                      <Download className="h-4 w-4" /> PDF
                    </button>
                  </div>
                </div>

                <div className={`flex items-center gap-4 rounded-2xl border px-6 py-4 shrink-0 ${
                  result.gesamtpassung === "kritisch" ? "border-red-200 bg-red-50" :
                  result.gesamtpassung === "bedingt" ? "border-amber-200 bg-amber-50" :
                  "border-emerald-200 bg-emerald-50"
                }`} data-testid="indicator-gesamtpassung">
                  <div className={`h-4 w-4 rounded-full shrink-0 ${
                    result.gesamtpassung === "kritisch" ? "bg-red-500" :
                    result.gesamtpassung === "bedingt" ? "bg-amber-500" :
                    "bg-emerald-500"
                  }`} />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Gesamtpassung</div>
                    <div className={`text-lg font-bold ${
                      result.gesamtpassung === "kritisch" ? "text-red-700" :
                      result.gesamtpassung === "bedingt" ? "text-amber-700" :
                      "text-emerald-700"
                    }`} data-testid="text-gesamtpassung">{result.gesamtpassungLabel}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-8">
                <MetricTile label="Systemwirkung" value={sw?.label ?? "—"} tone={sw?.intensity === "hoch" ? "danger" : "warning"} />
                <MetricTile label="Intensität" value={sw ? sw.intensity.charAt(0).toUpperCase() + sw.intensity.slice(1) : "—"} tone={sw?.intensity === "hoch" ? "danger" : sw?.intensity === "mittel" ? "warning" : "neutral"} />
                <MetricTile label="Rolle" value={roleName || "Rolle"} tone="neutral" />
                <MetricTile label="Kandidat" value={candidateName || "Kandidat"} tone="neutral" />
              </div>

              {result.entscheidungsfaktoren.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 mb-8" data-testid="box-entscheidungsfaktoren">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-3">
                    {result.gesamtpassung === "geeignet" ? "Warum geeignet?" : result.gesamtpassung === "bedingt" ? "Warum bedingt?" : "Warum kritisch?"}
                  </div>
                  <ol className="space-y-2">
                    {result.entscheidungsfaktoren.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-[15px] leading-7 text-slate-800" data-testid={`factor-${i}`}>
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">{i + 1}</span>
                        {f}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <Prose text={result.managementSummary} />
            </section>

            {/* ══ 2. STRUKTURVERGLEICH CARD ══ */}
            <section className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-strukturvergleich">
              <div className="flex items-center gap-3 mb-6">
                <Radar className="h-5 w-5 text-slate-400" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Strukturvergleich</p>
              </div>
              <h2 className="text-2xl font-semibold text-slate-950 mb-8">Rolle · Team · Neue Person</h2>

              <div className="grid gap-8 lg:grid-cols-3 mb-8">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-4">Sollprofil (Rolle)</div>
                  <div className="space-y-3">
                    <ProfileBar label="Tempo" value={sollProfile.impulsiv} />
                    <ProfileBar label="Kommunikation" value={sollProfile.intuitiv} />
                    <ProfileBar label="Struktur" value={sollProfile.analytisch} />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-4">Ist-Profil (Kandidat)</div>
                  <div className="space-y-3">
                    <ProfileBar label="Tempo" value={istProfile.impulsiv} />
                    <ProfileBar label="Kommunikation" value={istProfile.intuitiv} />
                    <ProfileBar label="Struktur" value={istProfile.analytisch} />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-4">Teamprofil</div>
                  <div className="space-y-3">
                    <ProfileBar label="Tempo" value={teamProfileN.impulsiv} />
                    <ProfileBar label="Kommunikation" value={teamProfileN.intuitiv} />
                    <ProfileBar label="Struktur" value={teamProfileN.analytisch} />
                  </div>
                </div>
              </div>

              <Prose text={result.fuehrungsprofil} />
            </section>

            {/* ══ 3. SYSTEMWIRKUNG CARD ══ */}
            <section className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-systemwirkung">
              <div className="flex items-center gap-3 mb-6">
                <GitCompareArrows className="h-5 w-5 text-slate-400" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Systemwirkung</p>
              </div>
              <h2 className="text-2xl font-semibold text-slate-950 mb-2">{sw?.label ?? "Systemwirkung"}</h2>
              {sw && (
                <>
                  <div className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-6 ${sw.intensity === "hoch" ? "border-red-200 text-red-700" : sw.intensity === "mittel" ? "border-slate-300 text-slate-600" : "border-slate-200 text-slate-500"}`}>
                    Intensität: {sw.intensity}
                  </div>
                  <p className="text-[15px] leading-7 text-slate-700 mb-4">{sw.description}</p>
                  <p className="text-sm leading-6 text-slate-500 italic mb-8">{sw.intensityLabel}</p>
                </>
              )}

              <Prose text={result.systemwirkung} />
            </section>

            {/* ══ 4. WIRKUNG IM TEAM (borderless) ══ */}
            <section className="mb-12" data-testid="section-wirkung-team">
              <h2 className="text-2xl font-semibold text-slate-950 mb-8">Wirkung im Team</h2>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Teamstruktur</h3>
                <Prose text={result.teamstruktur} />
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Teamdynamik im Alltag</h3>
                <Prose text={result.teamdynamikAlltag} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Kulturwirkung</h3>
                <Prose text={result.kulturwirkung} />
              </div>
            </section>

            {/* ══ 5. CHANCEN & RISIKEN (side by side, borderless) ══ */}
            <section className="mb-12 grid gap-8 lg:grid-cols-2" data-testid="section-chancen-risiken">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950 mb-6">Chancen</h2>
                <ul className="space-y-3">
                  {(sw?.chancen ?? []).map((c, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] leading-7 text-slate-700">
                      <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Prose text={result.chancen} />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-950 mb-6">Risiken</h2>
                <ul className="space-y-3">
                  {(sw?.risiken ?? []).map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] leading-7 text-slate-700">
                      <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Prose text={result.risiken} />
                </div>
              </div>
            </section>

            {/* ══ 6. STRESS CARD ══ */}
            <section className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-stress">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="h-5 w-5 text-slate-400" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Verhalten unter Druck</p>
              </div>
              <Prose text={result.verhaltenUnterDruck} />
            </section>

            {/* ══ 7. FÜHRUNGSHEBEL (borderless) ══ */}
            <section className="mb-12" data-testid="section-fuehrungshebel">
              <h2 className="text-2xl font-semibold text-slate-950 mb-6">Führungshebel</h2>
              <Prose text={result.fuehrungshebel} />
            </section>

            {/* ══ 8. INTEGRATIONSPLAN CARD ══ */}
            <section className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-integrationsplan">
              <div className="flex items-center gap-3 mb-6">
                <Target className="h-5 w-5 text-slate-400" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Integrationsplan</p>
              </div>
              <h2 className="text-2xl font-semibold text-slate-950 mb-8">30-Tage-Plan</h2>
              <Prose text={result.integrationsplan} />
            </section>

            {/* ══ 9. SYSTEMFAZIT CARD ══ */}
            <section className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-systemfazit">
              <div className="flex items-center gap-3 mb-6">
                <ShieldAlert className="h-5 w-5 text-slate-400" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Systemfazit</p>
              </div>
              <h2 className="text-2xl font-semibold text-slate-950 mb-6">Gesamtbewertung</h2>
              <Prose text={result.systemfazit} />
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
            nav, [data-testid="global-nav"] { display: none !important; }
            div[style*="position: fixed"] { display: none !important; }
            div[style*="height: 56"] { display: none !important; }
            @page { size: A4 portrait; margin: 14mm 16mm; }
            section { break-inside: avoid; page-break-inside: avoid; }
            h1 { font-size: 22pt !important; }
            h2 { font-size: 16pt !important; }
            p, div, li { font-size: 10pt !important; line-height: 1.5 !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
