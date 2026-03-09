import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Download, ChevronLeft } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { dominanceModeOf, labelComponent } from "@/lib/jobcheck-engine";
import { computeSollIst, mapFuehrungsArt } from "@/lib/soll-ist-engine";
import type { Triad, ComponentKey } from "@/lib/jobcheck-engine";
import type { SollIstResult, Severity, FuehrungsArt } from "@/lib/soll-ist-engine";

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

const BAR_HEX: Record<ComponentKey, string> = {
  impulsiv: "#C41E3A",
  intuitiv: "#F39200",
  analytisch: "#1A5DAB",
};

function bgToTriad(bg: BG | undefined): Triad {
  if (!bg) return { impulsiv: 33, intuitiv: 33, analytisch: 34 };
  return { impulsiv: Math.round(bg.imp), intuitiv: Math.round(bg.int), analytisch: Math.round(bg.ana) };
}

function severityLabel(s: Severity) {
  if (s === "critical") return "kritisch";
  if (s === "warning") return "bedingt";
  return "passend";
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



function TriangleChart({ role, candidate }: { role: Triad; candidate: Triad }) {
  const top = { x: 160, y: 25 };
  const left = { x: 35, y: 220 };
  const right = { x: 285, y: 220 };

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

export default function SollIstBericht() {
  const [, setLocation] = useLocation();
  const [candidateName, setCandidateName] = useState("");
  const [candTriad, setCandTriad] = useState<{impulsiv: number; intuitiv: number; analytisch: number}>({ impulsiv: 33, intuitiv: 34, analytisch: 33 });

  const updateCandTriad = useCallback((key: ComponentKey, newVal: number) => {
    setCandTriad(prev => {
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
  }, []);
  const [roleName, setRoleName] = useState("");
  const [roleTriad, setRoleTriad] = useState<Triad | null>(null);
  const [hasRollenDna, setHasRollenDna] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [fuehrungsArt, setFuehrungsArt] = useState<FuehrungsArt>("keine");

  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (!raw) return;
    try {
      const dna = JSON.parse(raw) as RoleDnaState;
      if (dna.beruf && dna.bioGramGesamt) {
        setHasRollenDna(true);
        setRoleName(dna.beruf);
        setRoleTriad(bgToTriad(dna.bioGramGesamt));
        if (dna.fuehrung) setFuehrungsArt(mapFuehrungsArt(dna.fuehrung));
      }
    } catch {}

    const candRaw = localStorage.getItem("jobcheckCandProfile");
    if (candRaw) {
      try {
        const cand = JSON.parse(candRaw);
        if (cand.name) setCandidateName(cand.name);
        if (cand.impulsiv != null && cand.intuitiv != null && cand.analytisch != null) {
          setCandTriad({ impulsiv: cand.impulsiv, intuitiv: cand.intuitiv, analytisch: cand.analytisch });
        }
      } catch {}
    }
  }, []);

  const candidateProfile = candTriad;
  const candDom = dominanceModeOf(candidateProfile);

  const result: SollIstResult | null = useMemo(() => {
    if (!roleTriad || !reportGenerated) return null;
    return computeSollIst(roleName, candidateName || "Kandidat", roleTriad, candidateProfile, fuehrungsArt);
  }, [roleTriad, roleName, candidateName, candidateProfile.impulsiv, candidateProfile.intuitiv, candidateProfile.analytisch, reportGenerated, fuehrungsArt]);

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

  const roleProfile = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => ({
    label: labelComponent(k),
    value: roleTriad[k],
    hex: BAR_HEX[k],
    key: k,
  }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <GlobalNav />
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">

        {/* === INPUT: Slider area before report === */}
        {!reportGenerated && (<>
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Konfiguration
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 mb-3">
              Soll-Ist-Bericht konfigurieren
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-2">
              <span className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Rolle:</span> {roleName}</span>
              <span className="text-sm text-slate-500">Führungsverantwortung: {fuehrungsArt === "keine" ? "Nein" : "Ja"}</span>
            </div>
            <p className="text-sm text-slate-500 mb-8" data-testid="text-config-description">
              Vergleichen Sie das Rollenprofil mit dem Kandidatenprofil, um die Passung für diese Position zu analysieren.
            </p>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Profilvergleich</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="card-soll-profil">
                <p className="text-base font-semibold text-slate-900 mb-6">Soll-Profil <span className="font-normal text-slate-500">(Rolle)</span></p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {roleProfile.map(item => {
                    const hex = item.hex;
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
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="card-ist-profil">
                <p className="text-base font-semibold text-slate-900 mb-6">Ist-Profil <span className="font-normal text-slate-500">(Kandidat)</span></p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
                    const val = candTriad[k];
                    const hex = BAR_HEX[k];
                    const pct = val;
                    const widthPct = (val / 67) * 100;
                    const isSmall = widthPct < 18;
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 12 }} data-testid={`slider-row-${k}`}>
                        <span style={{ fontSize: 13, color: "#6E6E73", width: 72, flexShrink: 0 }}>
                          {labelComponent(k)}
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
                            {!isSmall && <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap" }}>{pct} %</span>}
                          </div>
                          <div
                            data-testid={`slider-${k}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const track = e.currentTarget.parentElement!;
                              const rect = track.getBoundingClientRect();
                              const move = (ev: MouseEvent) => {
                                const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                                const raw = Math.round(ratio * 67);
                                updateCandTriad(k, raw);
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
                                const raw = Math.round(ratio * 67);
                                updateCandTriad(k, raw);
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
                            }}>{pct} %</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setLocation("/jobcheck")}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-blue-600 hover:bg-slate-50 transition-colors"
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4" /> Zurück
              </button>
              <button
                onClick={() => setReportGenerated(true)}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-[15px] font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
                data-testid="button-generate-report"
              >
                Bericht erstellen
              </button>
            </div>
          </div>

          {(() => {
            const roleDomKey = dominanceModeOf(roleTriad).top1.key;
            const candDomKey = candDom.top1.key;
            const sameDom = roleDomKey === candDomKey;
            const totalGap = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).reduce((sum, k) => sum + Math.abs(roleTriad[k] - candTriad[k]), 0);

            const fitLabel = totalGap > 40 ? "Nicht geeignet" : totalGap > 20 ? "Bedingt geeignet" : "Geeignet";
            const fitColor = totalGap > 40 ? "#D64045" : totalGap > 20 ? "#E5A832" : "#3A9A5C";

            const fazitText = sameDom && totalGap <= 20
              ? "Arbeitslogiken stimmen überein. Die natürliche Arbeitsweise der Person entspricht den Anforderungen der Rolle."
              : sameDom
              ? "Die Grundausrichtung ist ähnlich, es bestehen jedoch spürbare Unterschiede in der Intensität. Mit gezielter Führung lässt sich die Zusammenarbeit stabil gestalten."
              : totalGap > 40
              ? "Die Arbeits- und Entscheidungslogiken von Rolle und Person unterscheiden sich deutlich. Im Arbeitsalltag entsteht dadurch erhöhter Abstimmungs- und Steuerungsbedarf."
              : "Unterschiedliche Arbeitslogiken treffen aufeinander. Die Person arbeitet und entscheidet anders, als es die Rolle erfordert. Im Alltag entsteht dadurch erhöhter Abstimmungsbedarf.";

            let devScore: number;
            if (sameDom && totalGap <= 15) devScore = 6;
            else if (sameDom && totalGap <= 25) devScore = 5;
            else if (totalGap <= 20) devScore = 4;
            else if (totalGap <= 30) devScore = 3;
            else if (totalGap <= 40) devScore = 2;
            else devScore = 1;

            const devTexts: Record<number, string> = {
              1: "Die grundlegende Arbeitslogik der Person unterscheidet sich stark von den Anforderungen der Rolle. Eine stabile Anpassung ist daher nur sehr eingeschränkt zu erwarten.",
              2: "Die Anforderungen der Rolle unterscheiden sich deutlich von der natürlichen Arbeitsweise der Person. Eine Entwicklung ist grundsätzlich möglich, erfordert jedoch intensive Führung und klare Rahmenbedingungen.",
              3: "Die Person kann sich teilweise an die Anforderungen der Rolle anpassen. Eine stabile Umsetzung erfordert jedoch Zeit, Erfahrung und unterstützende Strukturen.",
              4: "Die Person kann sich grundsätzlich gut an die Anforderungen der Rolle entwickeln. Mit klaren Entscheidungswegen und Feedback ist eine stabile Zusammenarbeit gut erreichbar.",
              5: "Die Arbeits- und Entscheidungslogik der Person passt bereits weitgehend zu den Anforderungen der Rolle. Eine Entwicklung zu einer stabilen und erfolgreichen Umsetzung ist sehr wahrscheinlich.",
              6: "Die Person kann die Anforderungen der Rolle sehr schnell und stabil erfüllen. Arbeitsweise, Entscheidungslogik und Umfeld der Rolle passen sehr gut zusammen.",
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
              <div style={{ marginTop: 20 }} data-testid="section-summary-card">
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "center", margin: "0 0 12px" }}>
                  MatchCheck — Systemwirkung
                </p>
                <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "28px 32px", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 9, background: fitColor, flexShrink: 0, boxShadow: `0 0 0 4px ${fitColor}20` }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F" }} data-testid="text-summary-role">{roleName || "Rolle"}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: fitColor, letterSpacing: "0.03em" }} data-testid="text-summary-fit">
                      {fitLabel}
                    </span>
                  </div>

                  <div style={{ background: `${fitColor}08`, borderLeft: `3px solid ${fitColor}`, borderRadius: "0 8px 8px 0", padding: "12px 16px", marginBottom: 0 }}>
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.75, margin: 0 }} data-testid="text-summary-fazit">{fazitText}</p>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 24, paddingTop: 24 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>
                      Entwicklungsprognose
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }} data-testid="text-dev-prognose">
                      {devScore} von 6 <span style={{ fontWeight: 400, fontSize: 14, color: "#48484A" }}>– {devLabels[devScore]}</span>
                    </p>
                    <div style={{ display: "flex", gap: 5, marginBottom: 18 }} data-testid="gauge-dev-prognose">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 10, borderRadius: 3, background: i < devScore ? devGaugeColor : "rgba(0,0,0,0.08)" }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.75, margin: 0 }} data-testid="text-dev-description">{devTexts[devScore]}</p>
                  </div>

                </div>
              </div>
            );
          })()}
        </>)}

        {/* === REPORT OUTPUT === */}
        {result && (() => {
          const fitCol = result.fitRating === "GEEIGNET" ? "#34C759" : result.fitRating === "BEDINGT" ? "#FF9500" : "#FF3B30";
          const rc = BAR_HEX[result.roleDomKey];
          const cc = BAR_HEX[result.candDomKey];
          const sameDom = result.roleDomKey === result.candDomKey;
          const sep = { borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: 28, marginBottom: 28 } as const;

          return (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ position: "relative", background: "#FFFFFF", borderRadius: 4, padding: "48px 44px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>

              <div style={{ textAlign: "center", marginBottom: 40 }} data-testid="section-header">
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 12px" }}>Soll-Ist-Vergleich · Rollenpassung</p>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1D1D1F", margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1.2 }} data-testid="text-page-title">
                  {result.roleName} · Passungsbericht
                </h1>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
                  {[
                    { label: result.fitLabel, bg: `${fitCol}15`, color: fitCol, border: `${fitCol}30` },
                    { label: result.roleConstellationLabel, bg: "rgba(0,0,0,0.04)", color: "#1D1D1F", border: "rgba(0,0,0,0.08)" },
                    { label: result.candConstellationLabel, bg: "rgba(0,0,0,0.04)", color: "#1D1D1F", border: "rgba(0,0,0,0.08)" },
                  ].map((b, i) => (
                    <span key={i} style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: b.color, background: b.bg, border: `1px solid ${b.border}` }}>{b.label}</span>
                  ))}
                </div>
                <button
                  onClick={() => window.print()}
                  className="no-print"
                  style={{ position: "absolute", right: 44, top: 48, display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,113,227,0.06)", fontSize: 13, fontWeight: 600, color: "#0071E3", cursor: "pointer" }}
                  data-testid="button-export-pdf"
                >
                  <Download style={{ width: 14, height: 14 }} />
                  PDF
                </button>
              </div>

              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">
                  {result.summaryText}
                </p>
              </div>

              <div style={sep} data-testid="section-dominance-shift">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>1. Dominanz-Verschiebung</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 14, padding: "16px 20px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Rolle</p>
                    <div style={{ padding: "5px 14px", borderRadius: 10, background: `${rc}12`, border: `1px solid ${rc}25` }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: rc }}>{COMP_LABELS[result.roleDomKey]}</span>
                    </div>
                  </div>
                  {sameDom ? (
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#34C759" }}>=</span>
                  ) : (
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#FF3B30" }}>→</span>
                  )}
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Kandidat</p>
                    <div style={{ padding: "5px 14px", borderRadius: 10, background: `${cc}12`, border: `1px solid ${cc}25` }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: cc }}>{COMP_LABELS[result.candDomKey]}</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">{result.dominanceShiftText}</p>
              </div>

              <div style={sep} data-testid="section-comparison-bars">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>2. Dimensionsvergleich</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420, marginBottom: 14 }}>
                  {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
                    const sollVal = Math.round(roleTriad![k]);
                    const istVal = Math.round(candidateProfile[k]);
                    const delta = istVal - sollVal;
                    const hex = BAR_HEX[k];
                    return (
                      <div key={k}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: hex }}>{labelComponent(k)}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: delta === 0 ? "#34C759" : Math.abs(delta) <= 5 ? "#8E8E93" : Math.abs(delta) <= 15 ? "#FF9500" : "#FF3B30" }}>
                            Δ {delta > 0 ? "+" : ""}{delta}
                          </span>
                        </div>
                        <div style={{ position: "relative", height: 28, borderRadius: 8, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
                          <div style={{ position: "absolute", top: 0, left: 0, height: "50%", width: `${(Math.min(sollVal, 67) / 67) * 100}%`, background: `${hex}40`, borderRadius: "8px 8px 0 0", transition: "width 0.4s ease" }} />
                          <div style={{ position: "absolute", bottom: 0, left: 0, height: "50%", width: `${(Math.min(istVal, 67) / 67) * 100}%`, background: hex, borderRadius: "0 0 8px 8px", transition: "width 0.4s ease" }} />
                          <div style={{ position: "absolute", top: 0, left: 8, height: "50%", display: "flex", alignItems: "center" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#1D1D1F" }}>Soll {sollVal}%</span>
                          </div>
                          <div style={{ position: "absolute", bottom: 0, left: 8, height: "50%", display: "flex", alignItems: "center" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>Ist {istVal}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">
                  {biggestGapText(result.roleTriad, result.candTriad)}
                </p>
              </div>

              <div style={sep} data-testid="section-radar">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>3. Profilvergleich</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: "#2563eb" }} />
                    <span style={{ fontSize: 12, color: "#6E6E73" }}>Rolle</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: "#f59e0b" }} />
                    <span style={{ fontSize: 12, color: "#6E6E73" }}>Kandidat</span>
                  </div>
                </div>
                <TriangleChart role={result.roleTriad} candidate={result.candTriad} />
              </div>

              <div style={sep} data-testid="section-impact-matrix">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>4. Strukturelle Wirkungsanalyse</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.impactAreas.map(area => {
                    const sevCol = area.severity === "critical" ? "#FF3B30" : area.severity === "warning" ? "#FF9500" : "#34C759";
                    return (
                      <div key={area.id} style={{ padding: "14px 16px", borderRadius: 12, background: `${sevCol}06`, border: `1px solid ${sevCol}15` }} data-testid={`impact-detail-${area.id}`}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>{area.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: sevCol, textTransform: "uppercase", letterSpacing: "0.05em" }}>{severityLabel(area.severity)}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, lineHeight: 1.7, color: "#48484A" }}>
                          <div><span style={{ fontWeight: 700, color: "#1D1D1F" }}>Rolle braucht:</span> {area.roleNeed}</div>
                          <div><span style={{ fontWeight: 700, color: "#1D1D1F" }}>Kandidat bringt:</span> {area.candidatePattern}</div>
                          <div><span style={{ fontWeight: 700, color: sevCol }}>Risiko:</span> {area.risk}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={sep} data-testid="section-stress-behavior">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>5. Stressverhalten</p>
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#FF9500", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>Kontrollierter Druck</p>
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">{result.stressBehavior.controlledPressure}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#FF3B30", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>Unkontrollierter Stress</p>
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">{result.stressBehavior.uncontrolledStress}</p>
                </div>
              </div>

              <div style={sep} data-testid="section-risk-timeline">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>6. Risikoprognose</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.riskTimeline.map((phase, i) => {
                    const phaseCol = i === 0 ? "#34C759" : i === 1 ? "#FF9500" : "#C41E3A";
                    return (
                      <div key={i} style={{ padding: "12px 16px", borderRadius: 12, background: `${phaseCol}06`, border: `1px solid ${phaseCol}15` }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: phaseCol, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{phase.label} <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: "0" }}>{phase.period}</span></p>
                        <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.7, margin: 0 }}>{phase.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={sep} data-testid="section-development">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>7. Entwicklungsprognose</p>
                <div style={{ display: "flex", gap: 4, marginBottom: 10 }} data-testid="gauge-development">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 10, borderRadius: 5, background: i < result.developmentLevel ? (result.developmentLevel <= 2 ? "#FF3B30" : result.developmentLevel <= 3 ? "#FF9500" : "#34C759") : "rgba(0,0,0,0.06)" }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: "#8E8E93" }}>Entwicklungschance: <span style={{ fontWeight: 700, color: result.developmentLevel <= 2 ? "#FF3B30" : result.developmentLevel <= 3 ? "#FF9500" : "#34C759" }}>{result.developmentLabel}</span></span>
                  <span style={{ fontSize: 13, color: "#8E8E93" }}>Steuerungsbedarf: <span style={{ fontWeight: 700, color: result.controlIntensity === "hoch" ? "#FF9500" : "#1D1D1F" }}>{result.controlIntensity.charAt(0).toUpperCase() + result.controlIntensity.slice(1)}</span></span>
                </div>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">{result.developmentText}</p>
              </div>

              <div style={sep} data-testid="section-actions">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>8. Handlungsempfehlung</p>
                <ul style={{ margin: 0, paddingLeft: 20, listStyleType: "disc" }}>
                  {result.actions.map((item, i) => (
                    <li key={i} style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, marginBottom: 3 }}>{item}</li>
                  ))}
                </ul>
              </div>

              {result.integrationsplan && (
                <div style={sep} data-testid="section-integrationsplan">
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>9. 30-Tage-Integrationsplan</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {result.integrationsplan.map(phase => {
                      const phaseCol = phase.num === 1 ? "#0071E3" : phase.num === 2 ? "#F39200" : "#34C759";
                      return (
                        <div key={phase.num} data-testid={`integration-phase-${phase.num}`}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>
                            Phase {phase.num}: {phase.title} <span style={{ fontWeight: 500, color: "#8E8E93" }}>({phase.period})</span>
                          </p>
                          <ul style={{ margin: 0, paddingLeft: 20, listStyleType: "disc" }}>
                            {phase.items.map((item, i) => (
                              <li key={i} style={{ fontSize: 13, color: "#48484A", lineHeight: 1.7, marginBottom: 2 }}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div data-testid="section-final-assessment">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>{result.integrationsplan ? "10" : "9"}. Gesamtbewertung</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: "#8E8E93" }}>Grundpassung: <span style={{ fontWeight: 700, color: fitCol }}>{result.fitLabel}</span></span>
                  <span style={{ fontSize: 13, color: "#8E8E93" }}>Steuerungsbedarf: <span style={{ fontWeight: 700, color: result.controlIntensity === "hoch" ? "#FF9500" : "#1D1D1F" }}>{result.controlIntensity.charAt(0).toUpperCase() + result.controlIntensity.slice(1)}</span></span>
                </div>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de" data-testid="text-final-rating-text">{result.finalText}</p>
              </div>

            </div>

            <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }} className="no-print">
              <button
                onClick={() => setReportGenerated(false)}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 20px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", background: "#FFF", fontSize: 14, fontWeight: 600, color: "#6E6E73", cursor: "pointer" }}
                data-testid="button-reconfigure"
              >
                Profil anpassen
              </button>
            </div>
          </div>
          );
        })()}

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
