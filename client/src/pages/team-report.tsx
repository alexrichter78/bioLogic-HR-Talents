import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Download } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "@/lib/jobcheck-engine";
import { computeTeamReport } from "@/lib/team-report-engine";
import type { Triad, ComponentKey } from "@/lib/jobcheck-engine";
import type { TeamReportResult, SystemwirkungResult } from "@/lib/team-report-engine";

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
  impulsiv: "bg-red-500",
  intuitiv: "bg-amber-500",
  analytisch: "bg-blue-600",
};

function bgToTriad(bg: BG | undefined): Triad {
  if (!bg) return { impulsiv: 33, intuitiv: 33, analytisch: 34 };
  return { impulsiv: Math.round(bg.imp), intuitiv: Math.round(bg.int), analytisch: Math.round(bg.ana) };
}

const SECTION_TITLES: { key: keyof TeamReportResult; num: number; title: string }[] = [
  { key: "managementSummary", num: 1, title: "Management Summary" },
  { key: "teamstruktur", num: 2, title: "Teamstruktur" },
  { key: "fuehrungsprofil", num: 3, title: "Führungsprofil" },
  { key: "systemwirkung", num: 4, title: "Systemwirkung" },
  { key: "teamdynamikAlltag", num: 5, title: "Teamdynamik im Alltag" },
  { key: "chancen", num: 6, title: "Chancen" },
  { key: "risiken", num: 7, title: "Risiken" },
  { key: "verhaltenUnterDruck", num: 8, title: "Verhalten unter Druck" },
  { key: "kulturwirkung", num: 9, title: "Kulturwirkung" },
  { key: "fuehrungshebel", num: 10, title: "Führungshebel" },
  { key: "integrationsplan", num: 11, title: "Integrationsplan" },
  { key: "systemfazit", num: 12, title: "Systemfazit" },
];

function SliderGroup({
  title,
  imp,
  int,
  ana,
  onImpChange,
  onIntChange,
  onAnaChange,
  testIdPrefix,
}: {
  title: string;
  imp: number;
  int: number;
  ana: number;
  onImpChange: (v: number) => void;
  onIntChange: (v: number) => void;
  onAnaChange: (v: number) => void;
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
              type="range"
              min={5}
              max={80}
              value={val}
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

const INTENSITY_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  gering: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  mittel: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  hoch: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
};

function SystemwirkungCard({ sw }: { sw: SystemwirkungResult }) {
  const style = INTENSITY_STYLES[sw.intensity];
  return (
    <div className="mt-6 space-y-5" data-testid="systemwirkung-detail">
      <div className={`rounded-2xl border ${style.border} ${style.bg} p-5`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${style.dot}`} />
            <span className="text-lg font-semibold text-slate-950">{sw.label}</span>
          </div>
          <span className={`rounded-full border ${style.border} px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style.text}`}>
            Intensität: {sw.intensity}
          </span>
        </div>
        <p className="text-sm leading-7 text-slate-700">{sw.description}</p>
        <p className="mt-2 text-sm leading-7 text-slate-600 italic">{sw.intensityLabel}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-green-100 bg-green-50/40 p-5">
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-green-700 mb-3">Chancen</h4>
          <ul className="space-y-2">
            {sw.chancen.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5">
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-red-700 mb-3">Risiken</h4>
          <ul className="space-y-2">
            {sw.risiken.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ReportSection({ num, title, content, testId }: { num: number; title: string; content: string; testId: string }) {
  const paragraphs = content.split("\n").filter(l => l.trim().length > 0);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid={testId}>
      <div className="flex items-start gap-4 mb-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
          {num}
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Abschnitt {num}</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">{title}</h3>
        </div>
      </div>
      <div className="space-y-3 text-sm leading-7 text-slate-700">
        {paragraphs.map((p, i) => {
          const isHeading = p.endsWith(":") && p.length < 60;
          if (isHeading) {
            return <div key={i} className="font-semibold text-slate-900 mt-4">{p}</div>;
          }
          return <p key={i}>{p}</p>;
        })}
      </div>
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
          setSollImp(t.impulsiv);
          setSollInt(t.intuitiv);
          setSollAna(t.analytisch);
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
      sollProfile,
      istProfile,
      teamProfile
    );
  }, [reportGenerated, roleName, candidateName, sollProfile.impulsiv, sollProfile.intuitiv, sollProfile.analytisch, istProfile.impulsiv, istProfile.intuitiv, istProfile.analytisch, teamProfile.impulsiv, teamProfile.intuitiv, teamProfile.analytisch]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <GlobalNav />
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">

        {!reportGenerated && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Analyse
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 mb-2">
              Team-Systemreport konfigurieren
            </h1>
            <p className="text-sm text-slate-600 mb-8 max-w-2xl leading-6">
              Definieren Sie die drei Profile: Das Sollprofil der Rolle, das Ist-Profil des Kandidaten und das bestehende Teamprofil. Der Bericht analysiert die systemische Wirkung der neuen Person auf das Team.
            </p>

            <div className="grid gap-6 mb-6 lg:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Rollenbezeichnung</label>
                <input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="z.B. Teamleiter Vertrieb"
                  className="w-full h-9 px-3 text-sm font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-blue-400"
                  data-testid="input-role-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Name des Kandidaten</label>
                <input
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Name des Kandidaten"
                  className="w-full h-9 px-3 text-sm font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-blue-400"
                  data-testid="input-candidate-name"
                />
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <SliderGroup
                title="Sollprofil (Rolle)"
                imp={sollImp} int={sollInt} ana={sollAna}
                onImpChange={setSollImp} onIntChange={setSollInt} onAnaChange={setSollAna}
                testIdPrefix="soll"
              />
              <SliderGroup
                title="Ist-Profil (Kandidat)"
                imp={istImp} int={istInt} ana={istAna}
                onImpChange={setIstImp} onIntChange={setIstInt} onAnaChange={setIstAna}
                testIdPrefix="ist"
              />
              <SliderGroup
                title="Teamprofil"
                imp={teamImp} int={teamInt} ana={teamAna}
                onImpChange={setTeamImp} onIntChange={setTeamInt} onAnaChange={setTeamAna}
                testIdPrefix="team"
              />
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

        {result && (
          <>
            <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-header">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Team-Systemreport
                  </p>
                  <div className="flex items-center gap-4 flex-wrap mb-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl" data-testid="text-page-title">
                      {roleName || "Rolle"} · Systemanalyse
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
                    Strukturelle Teamdynamik-Analyse: Wie wirkt sich die neue Person auf das bestehende Team aus?
                  </p>
                </div>
                <div className="grid min-w-[280px] grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" data-testid="metrics-grid">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Rolle</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{roleName || "Rolle"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Kandidat</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{candidateName || "Kandidat"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Sollprofil</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">I {sollProfile.impulsiv}% / N {sollProfile.intuitiv}% / A {sollProfile.analytisch}%</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Teamprofil</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">I {teamProfile.impulsiv}% / N {teamProfile.intuitiv}% / A {teamProfile.analytisch}%</div>
                  </div>
                </div>
              </div>
            </header>

            <div className="space-y-6">
              {SECTION_TITLES.map(({ key, num, title }) => {
                if (key === "systemwirkung") {
                  return (
                    <div key={key} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-systemwirkung">
                      <div className="flex items-start gap-4 mb-5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                          {num}
                        </div>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Abschnitt {num}</p>
                          <h3 className="mt-1 text-xl font-semibold text-slate-950">{title}</h3>
                        </div>
                      </div>
                      <SystemwirkungCard sw={result.systemwirkungResult} />
                      <div className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
                        {result.systemwirkung.split("\n").filter(l => l.trim()).map((p, i) => {
                          const isHeading = p.endsWith(":") && p.length < 60;
                          if (isHeading) return <div key={i} className="font-semibold text-slate-900 mt-4">{p}</div>;
                          return <p key={i}>{p}</p>;
                        })}
                      </div>
                    </div>
                  );
                }
                return (
                  <ReportSection
                    key={key}
                    num={num}
                    title={title}
                    content={result[key] as string}
                    testId={`section-${key}`}
                  />
                );
              })}
            </div>

            <div className="mt-8 flex justify-center no-print">
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
