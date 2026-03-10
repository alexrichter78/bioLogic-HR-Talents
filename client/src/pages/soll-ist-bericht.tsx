import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Download, ChevronLeft, ChevronDown, SlidersHorizontal, Zap } from "lucide-react";
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
  const w = 340, h = 300;
  const cx = w / 2, cy = 168;
  const R = 120;
  const angles = [-Math.PI / 2, Math.PI / 2 - Math.PI / 3, Math.PI / 2 + Math.PI / 3];
  const verts = angles.map(a => ({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }));

  function triadPoly(t: Triad) {
    const total = t.analytisch + t.intuitiv + t.impulsiv || 1;
    const fracs = [t.analytisch / total, t.intuitiv / total, t.impulsiv / total];
    return fracs.map((f, i) => {
      const d = f * 2.5 * R * 0.82;
      return { x: cx + d * Math.cos(angles[i]), y: cy + d * Math.sin(angles[i]) };
    });
  }

  const rp = triadPoly(role);
  const cp = triadPoly(candidate);

  const toStr = (pts: { x: number; y: number }[]) => pts.map(p => `${p.x},${p.y}`).join(" ");
  const toPath = (pts: { x: number; y: number }[]) => `M${pts.map(p => `${p.x},${p.y}`).join("L")}Z`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxWidth: 380, height: "auto" }}>
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </radialGradient>
          <linearGradient id="rFill" x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="cFill" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        <polygon points={toStr(verts)} fill="none" stroke="#e2e8f0" strokeWidth="1" />
        {[0.33, 0.66].map(s => (
          <polygon key={s} points={verts.map(v => `${cx + (v.x - cx) * s},${cy + (v.y - cy) * s}`).join(" ")} fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3 4" />
        ))}

        <path d={toPath(rp)} fill="url(#rFill)" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" opacity="0.95" />
        <path d={toPath(cp)} fill="url(#cFill)" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" opacity="0.95" />

        {rp.map((p, i) => <circle key={`r${i}`} cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />)}
        {cp.map((p, i) => <circle key={`c${i}`} cx={p.x} cy={p.y} r="3.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />)}

        <text x={cx} y="28" textAnchor="middle" style={{ fontSize: 12, fontWeight: 600, fill: "#64748b", letterSpacing: "0.02em" }}>Analytisch</text>
        <text x="18" y={h - 12} textAnchor="start" style={{ fontSize: 12, fontWeight: 600, fill: "#64748b", letterSpacing: "0.02em" }}>Intuitiv</text>
        <text x={w - 18} y={h - 12} textAnchor="end" style={{ fontSize: 12, fontWeight: 600, fill: "#64748b", letterSpacing: "0.02em" }}>Impulsiv</text>
      </svg>
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
  const [profilvergleichOpen, setProfilvergleichOpen] = useState(true);
  const [systemwirkungOpen, setSystemwirkungOpen] = useState(true);
  const [fuehrungsArt, setFuehrungsArt] = useState<FuehrungsArt>("keine");

  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (raw) {
      try {
        const dna = JSON.parse(raw) as RoleDnaState;
        if (dna.beruf && dna.bioGramGesamt) {
          setHasRollenDna(true);
          setRoleName(dna.beruf);
          setRoleTriad(bgToTriad(dna.bioGramGesamt));
          if (dna.fuehrung) setFuehrungsArt(mapFuehrungsArt(dna.fuehrung));
        }
      } catch {}
    }

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
    return computeSollIst(roleName, candidateName || "Person", roleTriad, candidateProfile, fuehrungsArt);
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

      {!reportGenerated && (
        <div style={{ position: "fixed", top: 56, left: 0, right: 0, zIndex: 8999 }}>
          <div className="dark:!bg-background" style={{ background: "#F1F5F9", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "5px 0 10px" }}>
            <div className="w-full mx-auto px-6" style={{ maxWidth: 1100 }}>
              <div className="text-center">
                <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#1D1D1F" }} data-testid="text-matchcheck-title">
                  Passungsanalyse konfigurieren
                </h1>
                <p style={{ fontSize: 13, color: "#8E8E93", fontWeight: 450, margin: 0 }} data-testid="text-matchcheck-subtitle">
                  Vergleichen Sie das Rollenprofil mit dem Personenprofil, um die strukturelle Passung für diese Position zu analysieren.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto px-6" style={{ maxWidth: 1100, paddingTop: !reportGenerated ? 135 : 40, paddingBottom: 40 }}>

        {/* === INPUT: Slider area before report === */}
        {!reportGenerated && (<>
          <div style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden", marginBottom: 32 }}>
            <button
              onClick={() => setProfilvergleichOpen(!profilvergleichOpen)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", border: "none", background: "transparent", cursor: "pointer", transition: "background 150ms" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.02)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              data-testid="button-toggle-profilvergleich"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SlidersHorizontal style={{ width: 22, height: 22, color: "#3A9A5C", flexShrink: 0 }} />
                <span style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F" }}>
                  Profilvergleich
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${profilvergleichOpen ? "rotate-180" : ""}`} />
            </button>

            {profilvergleichOpen && (<div style={{ padding: "0 32px 32px" }}>
            <div className="grid gap-6 grid-cols-2">
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
                <p className="text-base font-semibold text-slate-900 mb-6">Ist-Profil <span className="font-normal text-slate-500">(Person)</span></p>
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
                              cursor: "default",
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

            <div className="mt-8 flex items-center justify-end">
              <button
                onClick={() => setReportGenerated(true)}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-[15px] font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
                data-testid="button-generate-report"
              >
                Bericht erstellen
              </button>
            </div>
            </div>)}
          </div>

          {(() => {
            const roleDom = dominanceModeOf(roleTriad);
            const roleDomKey = roleDom.top1.key;
            const candDomKey = candDom.top1.key;
            const sameDom = roleDomKey === candDomKey;
            const totalGap = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).reduce((sum, k) => sum + Math.abs(roleTriad[k] - candTriad[k]), 0);

            const roleSorted = [roleTriad.impulsiv, roleTriad.intuitiv, roleTriad.analytisch].sort((a, b) => b - a);
            const candSorted = [candTriad.impulsiv, candTriad.intuitiv, candTriad.analytisch].sort((a, b) => b - a);
            const secGapDiff = Math.abs((roleSorted[1] - roleSorted[2]) - (candSorted[1] - candSorted[2]));
            const secondaryFlip = sameDom && roleDom.top2.key !== candDom.top2.key;
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
              ? "Arbeitslogiken stimmen überein. Die natürliche Arbeitsweise der Person entspricht den Anforderungen der Rolle."
              : sameDom
              ? "Die Grundausrichtung ist ähnlich, es bestehen jedoch spürbare Unterschiede in der Intensität. Mit gezielter Führung lässt sich die Zusammenarbeit stabil gestalten."
              : totalGap > 40
              ? "Die Arbeits- und Entscheidungslogiken von Rolle und Person unterscheiden sich deutlich. Im Arbeitsalltag entsteht dadurch erhöhter Abstimmungs- und Steuerungsbedarf."
              : "Unterschiedliche Arbeitslogiken treffen aufeinander. Die Person arbeitet und entscheidet anders, als es die Rolle erfordert. Im Alltag entsteht dadurch erhöhter Abstimmungsbedarf.";

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
                <div style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden" }}>
                  <button
                    onClick={() => setSystemwirkungOpen(!systemwirkungOpen)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", border: "none", background: "transparent", cursor: "pointer", transition: "background 150ms" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.02)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    data-testid="button-toggle-systemwirkung"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Zap style={{ width: 22, height: 22, color: "#3A9A5C", flexShrink: 0 }} />
                      <span style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F" }}>
                        MatchCheck — Systemwirkung
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${systemwirkungOpen ? "rotate-180" : ""}`} />
                  </button>

                  {systemwirkungOpen && (
                  <div style={{ padding: "0 32px 28px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 9, background: fitColor, flexShrink: 0, boxShadow: `0 0 0 4px ${fitColor}20` }} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F" }} data-testid="text-summary-role">{roleName || "Rolle"}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: fitColor, letterSpacing: "0.03em" }} data-testid="text-summary-fit">
                            {fitLabel}
                          </span>
                        </div>
                        <div style={{ background: `${fitColor}08`, borderLeft: `3px solid ${fitColor}`, borderRadius: "0 8px 8px 0", padding: "12px 16px" }}>
                          <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.75, margin: 0 }} data-testid="text-summary-fazit">{fazitText}</p>
                        </div>
                      </div>

                      <div style={{ borderLeft: "1px solid rgba(0,0,0,0.06)", paddingLeft: 24 }}>
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
                  )}
                </div>
              </div>
            );
          })()}
        </>)}

        {/* === REPORT OUTPUT === */}
        {result && (() => {
          const fitCol = result.fitRating === "GEEIGNET" ? "#3A9A5C" : result.fitRating === "BEDINGT" ? "#E5A832" : "#D64045";
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
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Person</p>
                    <div style={{ padding: "5px 14px", borderRadius: 10, background: `${cc}12`, border: `1px solid ${cc}25` }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: cc }}>{COMP_LABELS[result.candDomKey]}</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">{result.dominanceShiftText}</p>
              </div>

              <div style={sep} data-testid="section-comparison-bars">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>2. Dimensionsvergleich</p>
                <div className="grid gap-6 grid-cols-2" style={{ marginBottom: 14 }}>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <p className="text-base font-semibold text-slate-900 mb-6">Soll-Profil <span className="font-normal text-slate-500">(Rolle)</span></p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
                        const val = Math.round(roleTriad![k]);
                        const hex = BAR_HEX[k];
                        const widthPct = (val / 67) * 100;
                        const isSmall = widthPct < 18;
                        return (
                          <div key={k} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 13, color: "#6E6E73", width: 72, flexShrink: 0 }}>{labelComponent(k)}</span>
                            <div style={{ flex: 1, position: "relative", height: 26 }}>
                              <div style={{ position: "absolute", inset: 0, borderRadius: 13, background: "rgba(0,0,0,0.06)" }} />
                              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(Math.max(widthPct, 4), 100)}%`, borderRadius: 13, background: hex, display: "flex", alignItems: "center", paddingLeft: 10, minWidth: isSmall ? 8 : 50 }}>
                                {!isSmall && <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap" }}>{val} %</span>}
                              </div>
                              {isSmall && (
                                <span style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 8px)`, fontSize: 13, fontWeight: 600, color: "#8E8E93", whiteSpace: "nowrap" }}>{val} %</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <p className="text-base font-semibold text-slate-900 mb-6">Ist-Profil <span className="font-normal text-slate-500">(Person)</span></p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
                        const val = Math.round(candidateProfile[k]);
                        const hex = BAR_HEX[k];
                        const widthPct = (val / 67) * 100;
                        const isSmall = widthPct < 18;
                        return (
                          <div key={k} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 13, color: "#6E6E73", width: 72, flexShrink: 0 }}>{labelComponent(k)}</span>
                            <div style={{ flex: 1, position: "relative", height: 26 }}>
                              <div style={{ position: "absolute", inset: 0, borderRadius: 13, background: "rgba(0,0,0,0.06)" }} />
                              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(Math.max(widthPct, 4), 100)}%`, borderRadius: 13, background: hex, display: "flex", alignItems: "center", paddingLeft: 10, minWidth: isSmall ? 8 : 50 }}>
                                {!isSmall && <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap" }}>{val} %</span>}
                              </div>
                              {isSmall && (
                                <span style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 8px)`, fontSize: 13, fontWeight: 600, color: "#8E8E93", whiteSpace: "nowrap" }}>{val} %</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">
                  {biggestGapText(result.roleTriad, result.candTriad)}
                </p>
              </div>

              <div style={sep} data-testid="section-radar">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>3. Profilvergleich</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 22, height: 3, borderRadius: 2, background: "#3b82f6" }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>Rolle</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 22, height: 3, borderRadius: 2, background: "#f59e0b" }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>Person</span>
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
                          <div><span style={{ fontWeight: 700, color: "#1D1D1F" }}>Person bringt:</span> {area.candidatePattern}</div>
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

              {(() => {
                const rTriad = result.roleTriad;
                const cTriad = result.candTriad;
                const rSorted = [rTriad.impulsiv, rTriad.intuitiv, rTriad.analytisch].sort((a, b) => b - a);
                const cSorted = [cTriad.impulsiv, cTriad.intuitiv, cTriad.analytisch].sort((a, b) => b - a);
                const rSecGapDiff = Math.abs((rSorted[1] - rSorted[2]) - (cSorted[1] - cSorted[2]));
                const tGap = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).reduce((s, k) => s + Math.abs(rTriad[k] - cTriad[k]), 0);
                const sameD = result.roleDomKey === result.candDomKey;
                const rRoleDom = dominanceModeOf(rTriad);
                const rCandDom = dominanceModeOf(cTriad);
                const rSecFlip = sameD && rRoleDom.top2.key !== rCandDom.top2.key;
                const rCandSecGap = cSorted[1] - cSorted[2];

                const rGeignetLimit = sameD ? 28 : 20;
                let rFitLabel = tGap > 40 ? "Nicht geeignet" : tGap > rGeignetLimit ? "Bedingt geeignet" : "Geeignet";
                if (rSecFlip && rCandSecGap > 5) {
                  rFitLabel = "Nicht geeignet";
                } else if (rSecFlip && rFitLabel === "Geeignet") {
                  rFitLabel = "Bedingt geeignet";
                } else if (rFitLabel === "Geeignet" && sameD && rCandSecGap <= 5) {
                  rFitLabel = "Bedingt geeignet";
                }
                const rFitColor = rFitLabel === "Nicht geeignet" ? "#D64045" : rFitLabel === "Bedingt geeignet" ? "#E5A832" : "#3A9A5C";

                const rFazit = rSecFlip && rCandSecGap > 5
                  ? "Die dominante Arbeitslogik stimmt überein, aber die Sekundärausrichtung passt nicht. Die Person bringt die falsche zweite Stärke klar ausgeprägt mit. Arbeitsstil und Prioritätensetzung weichen strukturell ab."
                  : rSecFlip && tGap <= rGeignetLimit
                  ? "Die dominante Arbeitslogik stimmt überein, aber die Sekundärstruktur ist unklar. Die zweite und dritte Komponente der Person liegen nah beieinander – das macht das Verhalten in Drucksituationen weniger vorhersehbar."
                  : sameD && rCandSecGap <= 5 && tGap <= rGeignetLimit
                  ? "Die dominante Arbeitslogik stimmt überein, aber die Sekundärstruktur ist unklar. Die zweite und dritte Komponente der Person liegen nah beieinander – das macht das Verhalten in Drucksituationen weniger vorhersehbar."
                  : sameD && tGap <= rGeignetLimit
                  ? "Arbeitslogiken stimmen überein. Die natürliche Arbeitsweise der Person entspricht den Anforderungen der Rolle."
                  : sameD
                  ? "Die Grundausrichtung ist ähnlich, es bestehen jedoch spürbare Unterschiede in der Intensität. Mit gezielter Führung lässt sich die Zusammenarbeit stabil gestalten."
                  : tGap > 40
                  ? "Die Arbeits- und Entscheidungslogiken von Rolle und Person unterscheiden sich deutlich. Im Arbeitsalltag entsteht dadurch erhöhter Abstimmungs- und Steuerungsbedarf."
                  : "Unterschiedliche Arbeitslogiken treffen aufeinander. Die Person arbeitet und entscheidet anders, als es die Rolle erfordert. Im Alltag entsteht dadurch erhöhter Abstimmungsbedarf.";

                let rDev: number;
                if (sameD && tGap <= 20) rDev = 6;
                else if (sameD && tGap <= 28) rDev = 5;
                else if (tGap <= 20 || (sameD && tGap <= 35)) rDev = 4;
                else if (tGap <= 35 || (sameD && tGap <= 45)) rDev = 3;
                else if (tGap <= 50) rDev = 2;
                else rDev = 1;
                if (rDev === 6 && rCandSecGap <= 5) rDev = 5;
                if (rSecFlip) {
                  if (rCandSecGap > 5) rDev = Math.min(rDev, 2);
                  else rDev = Math.min(rDev, 4);
                }

                const rDevTexts: Record<number, string> = {
                  1: "Die grundlegende Arbeitslogik der Person unterscheidet sich stark von den Anforderungen der Rolle. Eine stabile Anpassung ist daher nur sehr eingeschränkt zu erwarten.",
                  2: "Die Anforderungen der Rolle unterscheiden sich deutlich von der natürlichen Arbeitsweise der Person. Eine Entwicklung ist grundsätzlich möglich, erfordert jedoch intensive Führung und klare Rahmenbedingungen.",
                  3: "Die Person kann sich teilweise an die Anforderungen der Rolle anpassen. Eine stabile Umsetzung erfordert jedoch Zeit, Erfahrung und unterstützende Strukturen.",
                  4: "Die Person kann sich grundsätzlich gut an die Anforderungen der Rolle entwickeln. Mit klaren Entscheidungswegen und Feedback ist eine stabile Zusammenarbeit gut erreichbar.",
                  5: "Die Arbeits- und Entscheidungslogik der Person passt bereits weitgehend zu den Anforderungen der Rolle. Eine Entwicklung zu einer stabilen und erfolgreichen Umsetzung ist sehr wahrscheinlich.",
                  6: "Die Person kann die Anforderungen der Rolle sehr schnell und stabil erfüllen. Arbeitsweise, Entscheidungslogik und Umfeld der Rolle passen sehr gut zusammen.",
                };
                const rDevLabels: Record<number, string> = {
                  1: "Entwicklung praktisch nicht erreichbar",
                  2: "Entwicklung sehr schwierig",
                  3: "Entwicklung möglich mit hohem Aufwand",
                  4: "Entwicklung gut möglich",
                  5: "Entwicklung sehr wahrscheinlich",
                  6: "Entwicklung sehr schnell erreichbar",
                };
                const rGaugeCol = rDev >= 5 ? "#3A9A5C" : rDev >= 3 ? "#E5A832" : "#D64045";

                return (
                  <div style={sep} data-testid="section-development">
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 18px" }}>7. Systemwirkung & Entwicklungsprognose</p>

                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 8, background: rFitColor, flexShrink: 0, boxShadow: `0 0 0 3px ${rFitColor}20` }} />
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>{result.roleName}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: rFitColor }}>
                        {rFitLabel}
                      </span>
                    </div>

                    <div style={{ background: `${rFitColor}08`, borderLeft: `3px solid ${rFitColor}`, borderRadius: "0 8px 8px 0", padding: "12px 16px", marginBottom: 22 }}>
                      <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.75, margin: 0 }}>{rFazit}</p>
                    </div>

                    <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>
                      Entwicklungsprognose
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>
                      {rDev} von 6 <span style={{ fontWeight: 400, fontSize: 14, color: "#48484A" }}>– {rDevLabels[rDev]}</span>
                    </p>
                    <div style={{ display: "flex", gap: 5, marginBottom: 16 }} data-testid="gauge-development">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 10, borderRadius: 3, background: i < rDev ? rGaugeCol : "rgba(0,0,0,0.08)" }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">{rDevTexts[rDev]}</p>
                  </div>
                );
              })()}

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
