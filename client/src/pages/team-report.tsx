import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Download, Check, CheckCircle2, Users, ChevronDown, Zap, BarChart3, Handshake, Rocket, Settings } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalizedText } from "@/lib/region";
import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "@/lib/jobcheck-engine";
import { computeTeamReport } from "@/lib/team-report-engine";
import { constellationLabel, detectConstellation } from "@/lib/soll-ist-engine";
import { getSystemwirkung } from "@/lib/teamcheck-v2-engine";
import { computeTeamCheckV4 } from "@/lib/teamcheck-v4-engine";
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
              <span style={{ fontSize: 14, color: "#48484A", width: 72, flexShrink: 0 }}>
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
                    fontSize: 14, fontWeight: 600, color: "#48484A", whiteSpace: "nowrap",
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


function SliderGroup({
  title, triad, onTriadChange, testIdPrefix,
}: {
  title: React.ReactNode;
  triad: { impulsiv: number; intuitiv: number; analytisch: number };
  onTriadChange: (key: ComponentKey, val: number) => void;
  testIdPrefix: string;
}) {
  const dom = dominanceModeOf(triad);

  return (
    <div style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", background: "#FFFFFF", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", margin: "0 0 20px" }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(key => {
          const val = triad[key];
          const hex = BAR_HEX[key];
          const widthPct = (val / 67) * 100;
          const isSmall = widthPct < 18;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, color: "#48484A", width: 72, flexShrink: 0 }}>
                {labelComponent(key)}
              </span>
              <div style={{ flex: 1, position: "relative", height: 28 }}>
                <div style={{
                  position: "absolute", inset: 0,
                  borderRadius: 14, background: "rgba(0,0,0,0.05)",
                }} />
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${Math.min(Math.max(widthPct, 4), 100)}%`,
                  borderRadius: 14, background: `linear-gradient(90deg, ${hex}, ${hex}CC)`,
                  display: "flex", alignItems: "center", paddingLeft: 10,
                  minWidth: isSmall ? 8 : 50,
                  boxShadow: `0 2px 8px ${hex}30`,
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
                    fontSize: 14, fontWeight: 600, color: "#48484A", whiteSpace: "nowrap",
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

type ClassificationReason = "gap" | "secFlip_strong" | "secFlip_weak" | "unclearSec";

const INDICATOR_TEXTS: Record<string, Record<string, Record<ClassificationReason, Record<string, string>>>> = {
  teammitglied: {
    Verstärkung: {
      gap: {
        geeignet: "Die Arbeitslogik der Besetzung entspricht der Teamstruktur. Bestehende Stärken werden weiter ausgebaut. Im Arbeitsalltag ist von einer schnellen Integration und einem stabilen Zusammenspiel auszugehen.",
        bedingt_low: "Die Grundlogik passt zur Teamstruktur, kleine Abweichungen bleiben steuerbar. Die Besetzung verstärkt das bestehende Muster, bringt aber in Drucksituationen leicht andere Akzente in Tempo und Priorisierung.",
        bedingt_high: "Die Besetzung passt im Kern zur Teamlogik, die Verstärkung ist aber nicht durchgehend stabil. Ohne klare Rahmung können punktuelle Unterschiede in der Umsetzung sichtbar werden.",
        nicht_low: "Die Besetzung weist trotz ähnlicher Grundlogik relevante Abweichungen auf. Die verstärkende Wirkung bleibt begrenzt und erfordert bewusste Steuerung.",
        nicht_high: "Trotz struktureller Nähe unterscheiden sich Arbeitsweisen in wichtigen Bereichen. Die angestrebte Verstärkung kommt nicht ohne erheblichen Steuerungsaufwand zustande.",
      },
      secFlip_strong: {
        default: "Die dominante Arbeitslogik stimmt überein und verstärkt die Teamstruktur. Die Sekundärausrichtung weicht jedoch deutlich ab. Arbeitsstil und Prioritätensetzung unterscheiden sich dadurch strukturell, obwohl die Grundrichtung passt.",
      },
      secFlip_weak: {
        default: "Die dominante Arbeitslogik stimmt überein und stützt das Teammuster. Die Sekundärstruktur ist jedoch unklar — das macht das Verhalten in Drucksituationen weniger vorhersehbar.",
      },
      unclearSec: {
        default: "Die dominante Arbeitslogik stimmt überein und wirkt verstärkend. Die zweite und dritte Komponente liegen nah beieinander — unter Druck kann das Verhalten schwerer einzuschätzen sein.",
      },
    },
    Ergänzung: {
      gap: {
        geeignet: "Die Besetzung bringt eine Qualität ins Team, die bisher weniger stark ausgeprägt ist. Das Team wird breiter aufgestellt und gewinnt an Leistungsfähigkeit.",
        bedingt_low: "Die Besetzung ergänzt das Team in einem bisher schwächeren Bereich. Die Passung ist im Grundsatz vorhanden, erfordert aber Klarheit in der gegenseitigen Erwartungshaltung.",
        bedingt_high: "Die ergänzende Wirkung ist strukturell gegeben, die Unterschiede in der Arbeitslogik sind aber spürbar. Ohne bewusste Rahmung können Reibungsverluste entstehen.",
        nicht_low: "Die Besetzung ergänzt das Team fachlich, die Arbeitslogik weicht jedoch deutlich ab. Die Ergänzung entfaltet ihre Wirkung nur mit aktiver Führung und klarer Abstimmung.",
        nicht_high: "Die ergänzende Qualität ist vorhanden, aber die Arbeitslogik unterscheidet sich grundlegend vom Team. Der Integrationsaufwand ist erheblich.",
      },
      secFlip_strong: {
        default: "Die Besetzung ergänzt das Team in einem wichtigen Bereich, bringt aber eine deutlich abweichende Sekundärausrichtung mit. Dadurch unterscheiden sich Arbeitsstil und Prioritäten strukturell vom Team.",
      },
      secFlip_weak: {
        default: "Die Besetzung ergänzt das Team, aber die Sekundärstruktur ist unklar. In Drucksituationen kann das Verhalten schwerer einzuschätzen sein, was die Ergänzungswirkung abschwächt.",
      },
      unclearSec: {
        default: "Die Besetzung ergänzt einen schwächeren Bereich im Team. Die Sekundärstruktur ist aber unklar — unter Druck kann das Verhalten weniger vorhersehbar sein.",
      },
    },
    Spannung: {
      gap: {
        geeignet: "Die Arbeitslogik weicht in wichtigen Punkten vom Team ab, bleibt aber integrierbar. Ohne bewusste Steuerung können Arbeitsweisen gegeneinander statt miteinander wirken.",
        bedingt_low: "Die Besetzung erzeugt Spannung im Teamsystem. Die Unterschiede sind spürbar, aber noch steuerbar — vor allem in Drucksituationen steigt der Abstimmungsbedarf deutlich.",
        bedingt_high: "Die Spannung zwischen Besetzung und Team ist deutlich. Ohne klare Rahmung und aktive Führung steigt die Wahrscheinlichkeit für Missverständnisse und Reibungsverluste.",
        nicht_low: "Die Besetzung weicht in der Arbeitslogik deutlich vom Team ab. Die Spannung ist im Alltag permanent spürbar und erfordert erhöhten Steuerungsaufwand.",
        nicht_high: "Die Arbeitslogik der Besetzung steht der Teamstruktur in wichtigen Bereichen entgegen. Eine stabile Integration ist nur mit erheblichem Führungsaufwand vorstellbar.",
      },
      secFlip_strong: {
        default: "Die dominante Arbeitslogik erzeugt Spannung zum Team. Die Sekundärausrichtung weicht zusätzlich ab — Arbeitsstil und Prioritätensetzung unterscheiden sich dadurch auf mehreren Ebenen.",
      },
      secFlip_weak: {
        default: "Die Arbeitslogik erzeugt Spannung im Team. Zusätzlich ist die Sekundärstruktur unklar — in Drucksituationen kann das Verhalten der Besetzung schwer einzuschätzen sein.",
      },
      unclearSec: {
        default: "Die Arbeitslogik erzeugt Spannung im Team. Die zweite und dritte Komponente liegen nah beieinander — unter Druck wird das Verhalten weniger vorhersehbar.",
      },
    },
    Transformation: {
      gap: {
        geeignet: "Die Besetzung verändert das Teamsystem strukturell. Das ist ein bewusster Eingriff, der aktive Führung und konsequente Steuerung erfordert.",
        bedingt_low: "Die Besetzung setzt einen transformativen Impuls im Team. Die Veränderung ist steuerbar, verlangt aber klare Kommunikation und bewusste Führung in der Übergangsphase.",
        bedingt_high: "Die Besetzung verändert die Teamlogik deutlich. Ohne konsequente Steuerungsarchitektur können bestehende Arbeitsweisen destabilisiert werden.",
        nicht_low: "Die Besetzung greift tief in die bestehende Teamstruktur ein. Die transformative Wirkung erfordert aktive Führung, klare Erwartungssteuerung und eine tragfähige Integrationsarchitektur.",
        nicht_high: "Die Besetzung verändert das Teamsystem grundlegend. Die bestehende Arbeitslogik wird in Frage gestellt. Ohne massive Führungsintervention ist eine stabile Integration nicht vorstellbar.",
      },
      secFlip_strong: {
        default: "Die Besetzung transformiert das Teamsystem und bringt zusätzlich eine abweichende Sekundärausrichtung mit. Der strukturelle Eingriff wirkt auf mehreren Ebenen gleichzeitig.",
      },
      secFlip_weak: {
        default: "Die Besetzung transformiert das Teamsystem. Die Sekundärstruktur ist zusätzlich unklar — das macht die Wirkung der Besetzung in Drucksituationen schwerer steuerbar.",
      },
      unclearSec: {
        default: "Die Besetzung transformiert das Teamsystem. Die zweite und dritte Komponente liegen nah beieinander — unter Druck kann das Verhalten der Besetzung schwer einzuschätzen sein.",
      },
    },
  },
  fuehrung: {
    Verstärkung: {
      gap: {
        geeignet: "Die Führungslogik passt sehr gut zur Teamstruktur und verstärkt das bestehende Muster. Entscheidungen, Orientierung und Zusammenarbeit können schnell stabil geführt werden.",
        bedingt_low: "Die Führungslogik verstärkt das Teammuster im Grundsatz, bleibt aber unter Druck nicht durchgehend stabil. Punktuelle Unterschiede in Tempo und Steuerungsanspruch können sichtbar werden.",
        bedingt_high: "Die Führungskraft verstärkt die bestehende Teamlogik, wird sie aber nicht automatisch stabilisieren. Ohne klare Führungslinien können punktuelle Irritationen entstehen.",
        nicht_low: "Die Führungslogik zeigt trotz ähnlicher Grundrichtung relevante Abweichungen. Die verstärkende Wirkung bleibt begrenzt und erfordert bewusste Führungsrahmung.",
        nicht_high: "Trotz struktureller Nähe in der Grundlogik weichen Führungs- und Teamlogik in wichtigen Bereichen ab. Eine stabile verstärkende Wirkung kommt nur mit erheblichem Steuerungsaufwand zustande.",
      },
      secFlip_strong: {
        default: "Die dominante Führungslogik stimmt mit der Teamstruktur überein und verstärkt sie. Die Sekundärausrichtung weicht jedoch deutlich ab. Steuerungsstil und Prioritätensetzung unterscheiden sich dadurch strukturell.",
      },
      secFlip_weak: {
        default: "Die dominante Führungslogik verstärkt die Teamstruktur. Die Sekundärstruktur ist jedoch unklar — das macht das Führungsverhalten in Drucksituationen weniger vorhersehbar.",
      },
      unclearSec: {
        default: "Die dominante Führungslogik verstärkt die Teamstruktur. Die zweite und dritte Komponente liegen nah beieinander — unter Druck kann das Führungsverhalten schwerer einzuschätzen sein.",
      },
    },
    Ergänzung: {
      gap: {
        geeignet: "Die Führungskraft ergänzt das Team in einem Bereich, der bisher weniger Gewicht hatte. Das Team gewinnt an Breite und Steuerungsfähigkeit.",
        bedingt_low: "Die Führungskraft ergänzt das Team in einem wichtigen Bereich. Die Passung erfordert aber Klarheit in der gegenseitigen Erwartungshaltung und bewusste Führungsrahmung.",
        bedingt_high: "Die ergänzende Führungswirkung ist strukturell gegeben, die Unterschiede in der Steuerungslogik aber spürbar. Ohne bewusste Führungslinien steigen Reibungsverluste.",
        nicht_low: "Die Führungskraft ergänzt das Team, die Steuerungslogik weicht aber deutlich ab. Der Führungsnutzen entfaltet sich nur mit aktiver Rahmung und klarer Erwartungssteuerung.",
        nicht_high: "Die ergänzende Qualität der Führungskraft ist vorhanden, die Steuerungslogik unterscheidet sich aber grundlegend. Der Integrationsaufwand auf Führungsebene ist erheblich.",
      },
      secFlip_strong: {
        default: "Die Führungskraft ergänzt das Team in einem wichtigen Bereich, bringt aber eine abweichende Sekundärausrichtung mit. Steuerungsstil und Prioritäten unterscheiden sich dadurch strukturell.",
      },
      secFlip_weak: {
        default: "Die Führungskraft ergänzt das Team, aber die Sekundärstruktur ist unklar. In Drucksituationen kann das Führungsverhalten schwerer einzuschätzen sein.",
      },
      unclearSec: {
        default: "Die Führungskraft ergänzt einen schwächeren Bereich im Team. Die Sekundärstruktur ist aber unklar — unter Druck kann das Führungsverhalten weniger vorhersehbar sein.",
      },
    },
    Spannung: {
      gap: {
        geeignet: "Die Führungslogik weicht in wichtigen Punkten vom Team ab. Ohne bewusste Steuerung können Führungsimpulse und Teamerwartungen gegeneinander wirken.",
        bedingt_low: "Die Führungskraft erzeugt Spannung im Teamsystem. Die Unterschiede sind steuerbar, aber unter Druck steigt der Klärungsbedarf zwischen Führungsanspruch und Teamerwartung.",
        bedingt_high: "Die Spannung zwischen Führungslogik und Team ist deutlich. Ohne klare Führungsrahmung steigt die Wahrscheinlichkeit für Irritationen und Steuerungsverluste.",
        nicht_low: "Die Führungslogik weicht deutlich vom Team ab. Die Spannung ist im Alltag permanent spürbar und erfordert erhöhten Steuerungsaufwand auf beiden Seiten.",
        nicht_high: "Die Führungslogik steht der Teamstruktur in wichtigen Bereichen entgegen. Eine stabile Führung ist nur mit erheblichem Steuerungsaufwand vorstellbar.",
      },
      secFlip_strong: {
        default: "Die Führungslogik erzeugt Spannung zum Team. Die Sekundärausrichtung weicht zusätzlich ab — Steuerungsstil und Prioritätensetzung unterscheiden sich auf mehreren Ebenen.",
      },
      secFlip_weak: {
        default: "Die Führungslogik erzeugt Spannung im Team. Zusätzlich ist die Sekundärstruktur unklar — in Drucksituationen kann das Führungsverhalten schwer einzuschätzen sein.",
      },
      unclearSec: {
        default: "Die Führungslogik erzeugt Spannung im Team. Die zweite und dritte Komponente liegen nah beieinander — unter Druck wird das Führungsverhalten weniger vorhersehbar.",
      },
    },
    Transformation: {
      gap: {
        geeignet: "Die Führungskraft verändert das Teamsystem strukturell. Das ist ein bewusster Eingriff, der konsequente Steuerungsarchitektur und klare Kommunikation erfordert.",
        bedingt_low: "Die Führungskraft setzt einen transformativen Impuls. Die Veränderung ist steuerbar, verlangt aber bewusste Führung und klare Erwartungssteuerung in der Übergangsphase.",
        bedingt_high: "Die Führungskraft verändert die Teamlogik deutlich. Ohne konsequente Steuerungsarchitektur können bestehende Strukturen und Arbeitsweisen destabilisiert werden.",
        nicht_low: "Die Führungskraft greift tief in die bestehende Teamstruktur ein. Die transformative Wirkung erfordert klare Steuerungsarchitektur und eine tragfähige Führungsrahmung.",
        nicht_high: "Die Führungskraft verändert das Teamsystem grundlegend. Ohne massive Führungsintervention und konsequente Steuerung ist eine stabile Integration nicht vorstellbar.",
      },
      secFlip_strong: {
        default: "Die Führungskraft transformiert das Teamsystem und bringt zusätzlich eine abweichende Sekundärausrichtung mit. Der strukturelle Eingriff wirkt auf Führungs- und Teamebene gleichzeitig.",
      },
      secFlip_weak: {
        default: "Die Führungskraft transformiert das Teamsystem. Die Sekundärstruktur ist zusätzlich unklar — die Führungswirkung wird in Drucksituationen schwerer steuerbar.",
      },
      unclearSec: {
        default: "Die Führungskraft transformiert das Teamsystem. Die zweite und dritte Komponente liegen nah beieinander — unter Druck kann das Führungsverhalten schwer einzuschätzen sein.",
      },
    },
  },
};

const STEERING_DESCRIPTIONS: Record<string, Record<number, string>> = {
  teammitglied: {
    3: "Die Integration wird voraussichtlich mit geringem Abstimmungs- und Steuerungsaufwand gelingen.",
    2: "Eine tragfähige Integration ist möglich, benötigt aber bewusste Führung und klare Abstimmung.",
    1: "Eine tragfähige Integration erscheint nur unter massivem Steuerungsaufwand und klarer Gegensteuerung möglich.",
  },
  fuehrung: {
    3: "Das Team kann voraussichtlich mit geringem Führungsaufwand wirksam gesteuert und stabilisiert werden.",
    2: "Eine wirksame Führung ist möglich, braucht jedoch bewusste Rahmung und klare Orientierung.",
    1: "Eine tragfähige Führungswirkung erscheint nur unter massivem Steuerungsaufwand und klarer Gegensteuerung möglich.",
  },
};

function selectIndicatorText(roleType: string, reason: ClassificationReason, fitLabel: string, totalGap: number, swLabel: string): string {
  const swPool = INDICATOR_TEXTS[roleType]?.[swLabel] || INDICATOR_TEXTS.teammitglied[swLabel] || INDICATOR_TEXTS.teammitglied["Spannung"];
  const pool = swPool[reason] || swPool.gap;
  if (reason !== "gap") return pool.default;
  if (fitLabel === "Geeignet") return pool.geeignet;
  if (fitLabel === "Bedingt geeignet") return totalGap <= 35 ? pool.bedingt_low : pool.bedingt_high;
  return totalGap <= 50 ? pool.nicht_low : pool.nicht_high;
}

export default function TeamReport() {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const t = useLocalizedText();

  const [istTriad, setIstTriad] = useState(() => {
    try { const s = sessionStorage.getItem("tc_istTriad"); if (s) return JSON.parse(s); } catch {}
    return { impulsiv: 33, intuitiv: 34, analytisch: 33 };
  });
  const [teamTriad, setTeamTriad] = useState(() => {
    try { const s = sessionStorage.getItem("tc_teamTriad"); if (s) return JSON.parse(s); } catch {}
    return { impulsiv: 33, intuitiv: 34, analytisch: 33 };
  });

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
  const [kontextOpen, setKontextOpen] = useState(true);
  const [ergebnisOpen, setErgebnisOpen] = useState(true);
  const [roleName, setRoleName] = useState(() => sessionStorage.getItem("tc_roleName") || "");
  const [candidateName, setCandidateName] = useState(() => sessionStorage.getItem("tc_candidateName") || "");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [matchCheckOpen, setMatchCheckOpen] = useState(true);
  const [roleTypeForCard, setRoleTypeForCard] = useState<"teammitglied" | "fuehrung">(() => {
    const v = sessionStorage.getItem("tc_roleType");
    return v === "fuehrung" ? "fuehrung" : "teammitglied";
  });
  const [teamGoal, setTeamGoal] = useState<"umsetzung" | "analyse" | "zusammenarbeit" | "">(() => {
    const v = sessionStorage.getItem("tc_teamGoal");
    return (v === "umsetzung" || v === "analyse" || v === "zusammenarbeit") ? v : "";
  });

  useEffect(() => { sessionStorage.setItem("tc_istTriad", JSON.stringify(istTriad)); }, [istTriad]);
  useEffect(() => { sessionStorage.setItem("tc_teamTriad", JSON.stringify(teamTriad)); }, [teamTriad]);
  useEffect(() => { sessionStorage.setItem("tc_roleName", roleName); }, [roleName]);
  useEffect(() => { sessionStorage.setItem("tc_candidateName", candidateName); }, [candidateName]);
  useEffect(() => { sessionStorage.setItem("tc_roleType", roleTypeForCard); }, [roleTypeForCard]);
  useEffect(() => { sessionStorage.setItem("tc_teamGoal", teamGoal); }, [teamGoal]);

  const syncFromLocalStorage = useCallback((force = false) => {
    if (!force && sessionStorage.getItem("tc_istTriad")) return;
    const raw = localStorage.getItem("rollenDnaState");
    if (raw) {
      try {
        const dna = JSON.parse(raw) as RoleDnaState;
        if (dna.beruf) setRoleName(dna.beruf);
        if (dna.fuehrung) {
          const f = dna.fuehrung.toLowerCase();
          if ((f.includes("führung") || f.includes("fachlich") || f.includes("disziplinarisch") || f.includes("projekt") || f.includes("koordination") || f.includes("leiter") || f.includes("lead")) && !f.includes("keine")) {
            setRoleTypeForCard("fuehrung");
          }
        }
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

  useEffect(() => {
    syncFromLocalStorage();
    try {
      const raw = localStorage.getItem("rollenDnaState");
      if (raw) {
        const dna = JSON.parse(raw) as RoleDnaState;
        if (!roleName && dna.beruf) setRoleName(dna.beruf);
        if (dna.fuehrung) {
          const f = dna.fuehrung.toLowerCase();
          const isFuehrung = (f.includes("führung") || f.includes("fachlich") || f.includes("disziplinarisch") || f.includes("projekt") || f.includes("koordination") || f.includes("leiter") || f.includes("lead")) && !f.includes("keine");
          setRoleTypeForCard(isFuehrung ? "fuehrung" : "teammitglied");
        }
      }
    } catch {}

    try {
      const candRaw = localStorage.getItem("jobcheckCandProfile");
      if (candRaw) {
        const cand = JSON.parse(candRaw);
        if (cand.impulsiv != null && cand.intuitiv != null && cand.analytisch != null) {
          setIstTriad({ impulsiv: cand.impulsiv, intuitiv: cand.intuitiv, analytisch: cand.analytisch });
        }
        if (cand.name) setCandidateName(cand.name);
      }
    } catch {}
  }, [syncFromLocalStorage]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "jobcheckCandProfile" || e.key === "jobcheckCandSliders" || e.key === "teamProfile" || e.key === "rollenDnaState") {
        syncFromLocalStorage(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [syncFromLocalStorage]);

  const istProfile = istTriad;
  const teamProfileN = teamTriad;

  const istDomKey = dominanceModeOf(istProfile).top1.key;
  const teamDomKey = dominanceModeOf(teamProfileN).top1.key;

  const istConstLabel = constellationLabel(detectConstellation(istProfile));
  const teamConstLabel = constellationLabel(detectConstellation(teamProfileN));

  const liveResult: TeamReportResult = useMemo(() => {
    return computeTeamReport(roleName || "Rolle", candidateName || "Person", istProfile, teamProfileN);
  }, [roleName, candidateName, istProfile.impulsiv, istProfile.intuitiv, istProfile.analytisch, teamProfileN.impulsiv, teamProfileN.intuitiv, teamProfileN.analytisch]);

  const v4Preview = useMemo(() => {
    try {
      const ERFOLGSFOKUS_DISPLAY_LABELS = [
        "Ergebnisse und Zielerreichung",
        "Zusammenarbeit und Netzwerk",
        "Innovation und Weiterentwicklung",
        "Prozesse und Effizienz",
        "Fachliche Qualit\u00E4t und Expertise",
        "Strategische Wirkung",
      ];
      const AUFGABENCHARAKTER_LABELS: Record<string, string> = {
        "\u00FCberwiegend operativ": "Praktische Umsetzung im Tagesgesch\u00E4ft",
        "\u00FCberwiegend systemisch": "Umsetzung mit strukturiertem Vorgehen",
        "\u00FCberwiegend strategisch": "Analyse, Planung und strategische Steuerung",
        "Gemischt": "Ausgewogene Mischung",
      };
      const ARBEITSLOGIK_LABELS: Record<string, string> = {
        "Umsetzungsorientiert": "Umsetzung und Ergebnisse",
        "Daten-/prozessorientiert": "Analyse und Struktur",
        "Menschenorientiert": "Zusammenarbeit und Kommunikation",
        "Ausgewogen": "Ausgewogene Mischung",
      };
      const FUEHRUNG_LABELS: Record<string, string> = {
        "Keine": "Keine F\u00FChrungsverantwortung",
        "Fachlich": "Fachliche F\u00FChrung",
        "Disziplinarisch": "F\u00FChrung mit Personalverantwortung",
        "Projektleitung": "Projektleitung / Koordination",
      };
      let roleLevel = "Keine F\u00FChrungsverantwortung";
      let taskStructure = "-";
      let workStyle = "-";
      let successFocus: string[] = [];
      try {
        const dnaRaw = localStorage.getItem("rollenDnaState");
        if (dnaRaw) {
          const dna = JSON.parse(dnaRaw) as RoleDnaState;
          if (dna.fuehrung) roleLevel = FUEHRUNG_LABELS[dna.fuehrung] || dna.fuehrung;
          if (dna.aufgabencharakter) taskStructure = AUFGABENCHARAKTER_LABELS[dna.aufgabencharakter] || dna.aufgabencharakter;
          if (dna.arbeitslogik) workStyle = ARBEITSLOGIK_LABELS[dna.arbeitslogik] || dna.arbeitslogik;
          if (Array.isArray(dna.erfolgsfokusIndices)) {
            successFocus = dna.erfolgsfokusIndices.map((i: number) => ERFOLGSFOKUS_DISPLAY_LABELS[i]).filter(Boolean);
          }
        }
      } catch {}
      return computeTeamCheckV4({
        roleTitle: roleName || "",
        roleLevel,
        taskStructure,
        workStyle,
        successFocus,
        teamProfile: teamTriad,
        personProfile: istTriad,
        candidateName: candidateName || "Person",
        teamGoal: teamGoal || null,
        roleType: roleTypeForCard === "fuehrung" ? "fuehrung" : "teammitglied",
      });
    } catch { return null; }
  }, [roleName, candidateName, istTriad.impulsiv, istTriad.intuitiv, istTriad.analytisch, teamTriad.impulsiv, teamTriad.intuitiv, teamTriad.analytisch, teamGoal, roleTypeForCard]);

  const result: TeamReportResult | null = reportGenerated ? liveResult : null;

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

      <div style={{ position: "fixed", top: isMobile ? 48 : 56, left: 0, right: 0, zIndex: 8999, background: "#F1F5F9" }}>
        <div className="dark:!bg-background" style={{ background: "#F1F5F9", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: isMobile ? "4px 0 6px" : "5px 0 10px" }}>
          <div className="w-full mx-auto" style={{ maxWidth: 1100, padding: isMobile ? "0 12px" : "0 24px" }}>
            <div className="text-center">
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#34C759" }} data-testid="text-teamreport-title">
                Teamstruktur analysieren
              </h1>
              <p style={{ fontSize: 14, color: "#48484A", fontWeight: 450, margin: 0 }} data-testid="text-teamreport-subtitle">
                Analysieren Sie die Zusammensetzung des Teams und erkennen Sie systemische Wirkungen, Entscheidungslogiken und mögliche Spannungsfelder.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto" style={{ maxWidth: 1100, paddingTop: isMobile ? 110 : 135, paddingBottom: isMobile ? 100 : 40, paddingLeft: isMobile ? 8 : 24, paddingRight: isMobile ? 8 : 24 }}>

        <div style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden" }} data-testid="accordion-teamcheck">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "14px 14px" : "20px 32px", border: "none", background: "transparent", cursor: "pointer", transition: "background 150ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            data-testid="accordion-teamcheck-toggle"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 15, background: "linear-gradient(135deg, #34C759, #30B350)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Users style={{ width: 15, height: 15, color: "#fff", strokeWidth: 2.5 }} /></div>
              <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}><span style={{ fontSize: 20, fontWeight: 700, color: "#34C759", flexShrink: 0 }} data-testid="text-teamcheck-label">Profilvergleich:</span> <span style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>Person vs. Team</span></span>
            </div>
            <ChevronDown style={{ width: 18, height: 18, color: "#8E8E93", strokeWidth: 2, transition: "transform 300ms ease", transform: configOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>
          {configOpen && (
            <div style={{ padding: isMobile ? "0 14px 14px" : "0 32px 28px" }}>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                <SliderGroup title={<>Ist-Profil <span style={{ fontWeight: 400, color: "#8E8E93" }}>(Person)</span></>} triad={istTriad}
                  onTriadChange={updateIstTriad} testIdPrefix="ist" />
                <SliderGroup title={<>Teamprofil <span style={{ fontWeight: 400, color: "#8E8E93" }}>(Team)</span></>} triad={teamTriad}
                  onTriadChange={updateTeamTriad} testIdPrefix="team" />
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <button
              onClick={() => setKontextOpen(!kontextOpen)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "14px 14px" : "20px 32px", border: "none", background: "transparent", cursor: "pointer", transition: "background 150ms" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              data-testid="accordion-kontext-toggle"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 15, background: "linear-gradient(135deg, #34C759, #30B350)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Settings style={{ width: 15, height: 15, color: "#fff", strokeWidth: 2.5 }} /></div>
                <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}><span style={{ fontSize: 20, fontWeight: 700, color: "#34C759", flexShrink: 0 }}>Team-Kontext:</span> <span style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>Stelle vs. Rolle vs. Teamziel</span></span>
              </div>
              <ChevronDown style={{ width: 18, height: 18, color: "#8E8E93", strokeWidth: 2, transition: "transform 300ms ease", transform: kontextOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>
            {kontextOpen && (
              <div style={{ padding: isMobile ? "0 14px 14px" : "0 32px 28px" }}>

                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#48484A", letterSpacing: "-0.01em" }}>
                      Stelle / Bezeichnung
                    </label>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
                      <input
                        type="text"
                        value={roleName}
                        onChange={e => setRoleName(e.target.value)}
                        placeholder="optional, z.B. Projektleiter"
                        data-testid="input-role-name"
                        style={{
                          width: "100%", height: 34, padding: "0 12px", borderRadius: 8,
                          border: "1px solid rgba(0,0,0,0.1)", fontSize: 13, color: "#1D1D1F",
                          background: "rgba(255, 248, 225, 0.5)", outline: "none",
                        }}
                        onFocus={e => { e.target.style.borderColor = "#007AFF"; e.target.style.background = "#FFFFFF"; }}
                        onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.1)"; e.target.style.background = "rgba(255, 248, 225, 0.5)"; }}
                      />
                      {roleName && (
                        <button
                          onClick={() => setRoleName("")}
                          data-testid="button-clear-role-name"
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "#8E8E93", padding: "0 2px", lineHeight: 1 }}
                          title="Entfernen"
                        >{"\u00D7"}</button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#48484A", letterSpacing: "-0.01em" }}>
                      Rolle
                    </label>
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      {([
                        { value: "teammitglied" as const, label: "Teammitglied" },
                        { value: "fuehrung" as const, label: "F\u00FChrungskraft" },
                      ]).map(opt => {
                        const active = roleTypeForCard === opt.value;
                        return (
                          <button
                            key={opt.value}
                            data-testid={`role-option-${opt.value}`}
                            onClick={() => setRoleTypeForCard(opt.value)}
                            style={{
                              height: 36, padding: "0 16px", borderRadius: 12, cursor: "pointer",
                              fontSize: 13, fontWeight: 600,
                              border: active ? "1.5px solid #0071E3" : "1.5px solid rgba(0,0,0,0.12)",
                              color: active ? "#0071E3" : "#48484A",
                              background: "transparent",
                              boxShadow: active ? "0 2px 8px rgba(0,113,227,0.15)" : "none",
                              transition: "all 200ms ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,113,227,0.04)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                            }}
                          >{opt.label}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 14 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: "#48484A", letterSpacing: "-0.01em" }}>
                    Teamziel <span style={{ fontWeight: 400 }}>(optional)</span>
                  </label>
                  <p style={{ fontSize: 13, color: "#8E8E93", margin: "4px 0 0", lineHeight: 1.5 }}>
                    {"Was braucht das Team aktuell am meisten?"}
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    {([
                      { value: "" as typeof teamGoal, label: "Keins", icon: null },
                      { value: "umsetzung" as typeof teamGoal, label: "Umsetzung", icon: Rocket },
                      { value: "analyse" as typeof teamGoal, label: "Analyse", icon: BarChart3 },
                      { value: "zusammenarbeit" as typeof teamGoal, label: "Zusammenarbeit", icon: Handshake },
                    ]).map(opt => {
                      const active = teamGoal === opt.value;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          data-testid={`goal-option-${opt.value || "none"}`}
                          onClick={() => setTeamGoal(opt.value)}
                          style={{
                            height: 36, padding: "0 16px", borderRadius: 12, cursor: "pointer",
                            fontSize: 13, fontWeight: 600,
                            border: active ? "1.5px solid #0071E3" : "1.5px solid rgba(0,0,0,0.12)",
                            color: active ? "#0071E3" : "#48484A",
                            background: active ? "transparent" : "transparent",
                            boxShadow: active ? "0 2px 8px rgba(0,113,227,0.15)" : "none",
                            transition: "all 200ms ease",
                            display: "flex", alignItems: "center", gap: 6,
                          }}
                          onMouseEnter={(e) => {
                            if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,113,227,0.04)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                          }}
                        >
                          {Icon && <Icon style={{ width: 14, height: 14 }} />}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end">
                  <button onClick={() => {
                    const ERFOLGSFOKUS_DISPLAY_LABELS = [
                      "Ergebnisse und Zielerreichung",
                      "Zusammenarbeit und Netzwerk",
                      "Innovation und Weiterentwicklung",
                      "Prozesse und Effizienz",
                      "Fachliche Qualit\u00E4t und Expertise",
                      "Strategische Wirkung",
                    ];
                    const AUFGABENCHARAKTER_LABELS: Record<string, string> = {
                      "\u00FCberwiegend operativ": "Praktische Umsetzung im Tagesgesch\u00E4ft",
                      "\u00FCberwiegend systemisch": "Umsetzung mit strukturiertem Vorgehen",
                      "\u00FCberwiegend strategisch": "Analyse, Planung und strategische Steuerung",
                      "Gemischt": "Ausgewogene Mischung",
                    };
                    const ARBEITSLOGIK_LABELS: Record<string, string> = {
                      "Umsetzungsorientiert": "Umsetzung und Ergebnisse",
                      "Daten-/prozessorientiert": "Analyse und Struktur",
                      "Menschenorientiert": "Zusammenarbeit und Kommunikation",
                      "Ausgewogen": "Ausgewogene Mischung",
                    };
                    const FUEHRUNG_LABELS: Record<string, string> = {
                      "Keine": "Keine F\u00FChrungsverantwortung",
                      "Fachlich": "Fachliche F\u00FChrung",
                      "Disziplinarisch": "F\u00FChrung mit Personalverantwortung",
                      "Projektleitung": "Projektleitung / Koordination",
                    };
                    const roleTitle = roleName || "";
                    let roleLevel = "Keine F\u00FChrungsverantwortung";
                    let taskStructure = "-";
                    let workStyle = "-";
                    let successFocus: string[] = [];
                    try {
                      const dnaRaw = localStorage.getItem("rollenDnaState");
                      if (dnaRaw) {
                        const dna = JSON.parse(dnaRaw) as RoleDnaState;
                        if (dna.fuehrung) roleLevel = FUEHRUNG_LABELS[dna.fuehrung] || dna.fuehrung;
                        if (dna.aufgabencharakter) taskStructure = AUFGABENCHARAKTER_LABELS[dna.aufgabencharakter] || dna.aufgabencharakter;
                        if (dna.arbeitslogik) workStyle = ARBEITSLOGIK_LABELS[dna.arbeitslogik] || dna.arbeitslogik;
                        if (Array.isArray(dna.erfolgsfokusIndices)) {
                          successFocus = dna.erfolgsfokusIndices.map((i: number) => ERFOLGSFOKUS_DISPLAY_LABELS[i]).filter(Boolean);
                        }
                      }
                    } catch {}
                    sessionStorage.setItem("teamcheckV4Input", JSON.stringify({
                      roleTitle,
                      roleLevel,
                      taskStructure,
                      workStyle,
                      successFocus,
                      teamProfile: teamTriad,
                      personProfile: istTriad,
                      candidateName: candidateName || "Person",
                      teamGoal: teamGoal || null,
                      roleType: roleTypeForCard,
                    }));
                    setLocation("/teamcheck-report-v4");
                  }}
                  style={{
                    height: 48, paddingLeft: 24, paddingRight: 24, fontSize: 15, fontWeight: 600,
                    borderRadius: 14, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFFFFF",
                    boxShadow: "0 4px 16px rgba(0,113,227,0.3)", transition: "all 200ms ease",
                    display: "inline-flex", alignItems: "center", gap: 8,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,113,227,0.35)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,113,227,0.3)"; }}
                  data-testid="button-generate-report">
                    Bericht erstellen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

              {v4Preview && (() => {
                const p = v4Preview;
                const badgeColors: Record<string, { bg: string; text: string; border: string }> = {
                  hoch: { bg: "#E8F5E9", text: "#1B7A3D", border: "#A5D6A7" },
                  mittel: { bg: "#FFF3E0", text: "#CC7700", border: "#FFCC80" },
                  gering: { bg: "#FFEBEE", text: "#C41E3A", border: "#EF9A9A" },
                };
                const badgeLabels: Record<string, string> = { hoch: "Passend", mittel: "Teilweise passend", gering: "Kritisch" };
                const teamFit = p.passungZumTeam;
                const funcFit = p.beitragZurAufgabe;
                const tColors = badgeColors[teamFit] || badgeColors.gering;
                const fColors = funcFit !== "nicht bewertbar" ? (badgeColors[funcFit] || badgeColors.gering) : null;

                const funcText = funcFit === "hoch"
                  ? "Die Person passt gut zum aktuellen Funktionsziel des Teams."
                  : funcFit === "mittel"
                  ? "Eingeschr\u00E4nkte Passung zum Funktionsziel durch Doppeldominanz."
                  : funcFit === "gering"
                  ? "Die Person arbeitet deutlich anders als das aktuelle Funktionsziel des Teams."
                  : "";
                const teamText = teamFit === "hoch"
                  ? "Die Person passt gut zur bestehenden Teamlogik und Arbeitsweise."
                  : teamFit === "mittel"
                  ? "Teilweise Passung zum Team, Doppeldominanz vorhanden."
                  : "Sichtbare Abweichung von der bestehenden Teamlogik und Arbeitsweise.";

                const empfBullets: string[] = [];
                if (p.gesamteinschaetzung === "Gut passend") {
                  empfBullets.push("Die Person kann direkt produktiv eingesetzt werden.");
                  empfBullets.push("Kein besonderer Begleitungsaufwand notwendig.");
                  if (teamFit === "hoch") empfBullets.push("Gute Voraussetzungen für schnelle Integration ins Team.");
                  if (funcFit === "hoch") empfBullets.push("Hohe Übereinstimmung mit dem aktuellen Funktionsziel.");
                } else if (p.gesamteinschaetzung === "Kritisch") {
                  empfBullets.push("Einsatz nur mit klarer Führung und aktiver Begleitung sinnvoll.");
                  empfBullets.push(t("Regelmäßige Abstimmung und enge Führung einplanen."));
                  empfBullets.push("Erwartungen frühzeitig klären und Rückmeldung aktiv einholen.");
                  if (teamFit === "gering") empfBullets.push("Teamdynamik beobachten — Spannungsfelder sind wahrscheinlich.");
                } else {
                  empfBullets.push("Gezielte Begleitung empfohlen, um die Integration zu sichern.");
                  if (teamFit !== "hoch") empfBullets.push("Strukturiertes Onboarding mit klaren Erwartungen planen.");
                  if (teamFit === "gering" || funcFit === "gering") empfBullets.push("Führungskraft sollte die Einarbeitung aktiv begleiten.");
                  if (teamFit !== "hoch" || funcFit === "gering") empfBullets.push("Mentoring durch ein erfahrenes Teammitglied empfohlen.");
                  empfBullets.push(t("Regelmäßige Check-ins in den ersten Wochen einplanen."));
                }

                const empfText = p.gesamteinschaetzung === "Gut passend"
                  ? "Gute Voraussetzungen für eine erfolgreiche Integration."
                  : p.gesamteinschaetzung === "Kritisch"
                  ? "Erhöhter Begleitungsaufwand — nur mit aktiver Führung einsetzen."
                  : t("Teilweise passend — gezielte Maßnahmen empfohlen.");

                const empfColor = p.gesamteinschaetzung === "Gut passend" ? { bg: "#E8F5E9", border: "#A5D6A7", text: "#1B7A3D" }
                  : p.gesamteinschaetzung === "Kritisch" ? { bg: "#FFEBEE", border: "#EF9A9A", text: "#C41E3A" }
                  : { bg: "#FFF3E0", border: "#FFCC80", text: "#CC7700" };

                const bBg = p.begleitungsbedarf === "gering" ? badgeColors.hoch : p.begleitungsbedarf === "mittel" ? badgeColors.mittel : badgeColors.gering;
                const bLabel = p.begleitungsbedarf === "gering" ? "Gering" : p.begleitungsbedarf === "mittel" ? "Mittel" : "Hoch";
                const bDesc = p.begleitungsbedarf === "gering" ? "Wenig Begleitung n\u00F6tig" : p.begleitungsbedarf === "mittel" ? "Begleitung empfohlen" : "Intensiv betreuungsbed\u00FCrftig";

                return (
                  <div style={{ marginTop: 20 }} data-testid="v4-preview">
                    <div style={{ background: "#FFFFFF", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden" }}>
                      <button
                        onClick={() => setErgebnisOpen(!ergebnisOpen)}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "14px 14px" : "20px 32px", border: "none", background: "transparent", cursor: "pointer", transition: "background 150ms" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        data-testid="accordion-ergebnis-toggle"
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 15, background: "linear-gradient(135deg, #34C759, #30B350)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Zap style={{ width: 15, height: 15, color: "#fff", strokeWidth: 2.5 }} /></div>
                          <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F" }}>{"TeamCheck:"} <span style={{ fontWeight: 400 }}>{roleName || "Ergebnis"}</span></span>
                        </div>
                        <ChevronDown style={{ width: 18, height: 18, color: "#8E8E93", strokeWidth: 2, transition: "transform 300ms ease", transform: ergebnisOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                      </button>
                      {ergebnisOpen && (
                      <div style={{ padding: isMobile ? "0 14px 14px" : "0 32px 28px" }}>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div style={{ padding: "16px 18px", borderRadius: 14, border: `1px solid ${tColors.border}`, background: tColors.bg }} data-testid="v4-card-team">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Users style={{ width: 14, height: 14, color: tColors.text }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Teampassung</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: tColors.text, background: `${tColors.text}12`, padding: "2px 10px", borderRadius: 6 }}>{badgeLabels[teamFit]}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#48484A", margin: 0, lineHeight: 1.6 }}>{teamText}</p>
                      </div>
                      <div style={{ padding: "16px 18px", borderRadius: 14, border: `1px solid ${bBg.border}`, background: bBg.bg }} data-testid="v4-card-integration">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Zap style={{ width: 14, height: 14, color: bBg.text }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Integrationsaufwand</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: bBg.text, background: `${bBg.text}12`, padding: "2px 10px", borderRadius: 6 }}>{bLabel}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#48484A", margin: 0, lineHeight: 1.6 }}>{bDesc}</p>
                      </div>
                    </div>

                    {fColors && (
                      <div style={{ padding: "16px 18px", borderRadius: 14, border: `1px solid ${fColors.border}`, background: fColors.bg, marginBottom: 12 }} data-testid="v4-card-func">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Zap style={{ width: 14, height: 14, color: fColors.text }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Passung zum Funktionsziel</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: fColors.text, background: `${fColors.text}12`, padding: "2px 10px", borderRadius: 6 }}>{badgeLabels[funcFit]}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#48484A", margin: 0, lineHeight: 1.6 }}>{funcText}</p>
                      </div>
                    )}

                    <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(0,0,0,0.02)" }} data-testid="v4-card-empfehlung">
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>Empfehlung</p>
                      {empfBullets.map((b, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <CheckCircle2 style={{ width: 15, height: 15, color: "#8E8E93", flexShrink: 0 }} />
                          <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.5 }}>{b}</span>
                        </div>
                      ))}
                    </div>

                      </div>
                      )}
                    </div>
                  </div>
                );
              })()}

        {/* Old V1 Systemwirkung and report sections removed — V4 report is now the only output */}
        {false && (() => {
          const teamDom = dominanceModeOf(teamProfileN);
          const candDom = dominanceModeOf(istProfile);
          const teamDomKeyFit = teamDom.top1.key;
          const candDomKeyFit = candDom.top1.key;
          const sameDom = teamDomKeyFit === candDomKeyFit;
          const totalGap = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).reduce((sum, k) => sum + Math.abs(teamProfileN[k] - istProfile[k]), 0);

          const candSorted = [istProfile.impulsiv, istProfile.intuitiv, istProfile.analytisch].sort((a, b) => b - a);
          const secondaryFlip = sameDom && teamDom.top2.key !== candDom.top2.key;
          const candSecGap = candSorted[1] - candSorted[2];

          const candIsBalFull = candDom.gap1 <= 5 && candDom.gap2 <= 5;
          const teamIsBalFull = teamDom.gap1 <= 5 && teamDom.gap2 <= 5;
          const effectiveSameDom = sameDom || teamIsBalFull;
          const geignetLimit = effectiveSameDom ? 28 : 20;
          const maxGap = Math.max(...(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => Math.abs(teamProfileN[k] - istProfile[k])));
          const candDomGap = candDom.gap1;
          const teamSecGap = teamDom.gap2;
          const candSpread = candSorted[0] - candSorted[2];
          let fitLabel = totalGap > 40 ? "Nicht geeignet" : totalGap > geignetLimit ? "Bedingt geeignet" : "Geeignet";
          if (!effectiveSameDom) fitLabel = "Nicht geeignet";
          if (candIsBalFull && !teamIsBalFull) fitLabel = "Nicht geeignet";
          if (maxGap > 25) fitLabel = "Nicht geeignet";
          if (secondaryFlip && candSecGap > 5 && teamSecGap > 5) fitLabel = "Nicht geeignet";
          if (candIsBalFull && teamIsBalFull && fitLabel === "Geeignet") fitLabel = "Bedingt geeignet";
          if (secondaryFlip && fitLabel === "Geeignet") fitLabel = "Bedingt geeignet";
          if (fitLabel === "Geeignet" && effectiveSameDom && candSecGap <= 5) fitLabel = "Bedingt geeignet";
          if (maxGap > 18 && fitLabel === "Geeignet") fitLabel = "Bedingt geeignet";
          if (candDomGap <= 5 && fitLabel === "Geeignet") fitLabel = "Bedingt geeignet";
          if (teamIsBalFull && candSpread > 20 && fitLabel === "Geeignet") fitLabel = "Bedingt geeignet";
          let classReason: ClassificationReason = "gap";
          if (secondaryFlip && candSecGap > 5 && teamSecGap > 5) classReason = "secFlip_strong";
          else if (secondaryFlip && fitLabel === "Bedingt geeignet") classReason = "secFlip_weak";
          else if (candSecGap <= 5 && fitLabel !== "Nicht geeignet") classReason = "unclearSec";

          const devScore = fitLabel === "Geeignet" ? 3 : fitLabel === "Bedingt geeignet" ? 2 : 1;

          const systemwirkungLabel = getSystemwirkung(teamProfileN, istProfile);
          const indicatorText = selectIndicatorText(roleTypeForCard, classReason, fitLabel, totalGap, systemwirkungLabel);
          const steeringDescription = STEERING_DESCRIPTIONS[roleTypeForCard]?.[devScore] || STEERING_DESCRIPTIONS.teammitglied[devScore] || "";
          const roleChipLabel = roleTypeForCard === "fuehrung" ? "Führungskraft" : "Teammitglied";
          const teamFitLabel = fitLabel === "Geeignet" ? "Stabil" : fitLabel === "Bedingt geeignet" ? "Steuerbar" : "Kritisch";
          const fitColor = fitLabel === "Nicht geeignet" ? "#D64045" : fitLabel === "Bedingt geeignet" ? "#E5A832" : "#3A9A5C";

          const teamIsDualDom = teamDom.gap1 <= 5 && teamDom.gap2 > 5;
          const candIsDualDom = candDom.gap1 <= 5 && candDom.gap2 > 5;
          const teamClearDom = teamDom.gap1 >= 15;

          const teamDomKeys = teamIsBalFull ? [] : teamIsDualDom ? [teamDom.top1.key, teamDom.top2.key] : [teamDom.top1.key];
          const candDomKeys = candIsBalFull ? [] : candIsDualDom ? [candDom.top1.key, candDom.top2.key] : [candDom.top1.key];

          const dualKeysMatch = teamIsDualDom && candIsDualDom
            && [teamDom.top1.key, teamDom.top2.key].includes(candDom.top1.key)
            && [teamDom.top1.key, teamDom.top2.key].includes(candDom.top2.key);

          const candSpreadSt = candDom.top1.value - candDom.top3.value;

          let steuerung: "gering" | "mittel" | "erhöht";

          if (maxGap > 25) {
            steuerung = "erhöht";
          } else if (teamIsBalFull && candIsBalFull) {
            steuerung = "mittel";
          } else if (teamIsBalFull) {
            if (candIsDualDom) {
              steuerung = "mittel";
            } else if (candSpreadSt <= 5 || totalGap <= 8) {
              steuerung = "mittel";
            } else if (candSpreadSt < 12) {
              steuerung = "mittel";
            } else {
              steuerung = "erhöht";
            }
          } else if (candIsBalFull && !teamIsBalFull) {
            steuerung = "erhöht";
          } else if (teamIsDualDom && candIsDualDom) {
            if (dualKeysMatch) {
              steuerung = totalGap > 20 ? "mittel" : "gering";
            } else {
              steuerung = "mittel";
            }
          } else if (teamIsDualDom && !candIsDualDom) {
            const candKeyInDual = teamDomKeys.includes(candDomKeys[0]);
            if (!candKeyInDual) {
              steuerung = "erhöht";
            } else {
              const candValForT1 = istProfile[teamDom.top1.key];
              const candValForT2 = istProfile[teamDom.top2.key];
              const candDualGap = Math.abs(candValForT1 - candValForT2);
              steuerung = candDualGap > 5 ? "mittel" : "gering";
            }
          } else if (!teamIsDualDom && candIsDualDom) {
            if (teamClearDom) {
              const teamKeyInCandDual = candDomKeys.includes(teamDomKeys[0]);
              if (!teamKeyInCandDual) {
                steuerung = "erhöht";
              } else {
                steuerung = "mittel";
              }
            } else {
              const teamKeyInCandDual = candDomKeys.includes(teamDomKeys[0]);
              steuerung = teamKeyInCandDual ? "mittel" : "erhöht";
            }
          } else {
            if (sameDom) {
              const secFlip = teamDom.top2.key !== candDom.top2.key;
              const secGapTeam = teamDom.gap2;
              const secGapCand = candDom.gap2;
              if (secFlip && secGapTeam > 5 && secGapCand > 5) {
                const flipThreshold = teamDom.gap1 <= 5 ? 16 : 30;
                steuerung = totalGap >= flipThreshold ? "erhöht" : "mittel";
              } else if (secFlip) {
                steuerung = "mittel";
              } else {
                steuerung = totalGap > 20 ? "mittel" : "gering";
              }
            } else {
              steuerung = "erhöht";
            }
          }

          if (totalGap > 35 && steuerung !== "erhöht") { steuerung = "erhöht"; }
          else if (totalGap > 25 && steuerung === "gering") { steuerung = "mittel"; }

          const steuerungColor = steuerung === "gering" ? "#3A9A5C" : steuerung === "mittel" ? "#E5A832" : "#D64045";

          const swColor = systemwirkungLabel === "Verstärkung" ? "#3A9A5C" : systemwirkungLabel === "Ergänzung" ? "#0071E3" : systemwirkungLabel === "Spannung" ? "#E5A832" : "#D64045";
          const swDescriptions: Record<string, string> = {
            "Verstärkung": "Die Besetzung bringt eine Arbeitslogik mit, die zum Grundmuster des Teams passt. Bestehende Stärken werden weiter ausgebaut — das fördert Stabilität, Klarheit und eine schnellere Eingliederung.",
            "Ergänzung": "Die Besetzung bringt eine Qualität ins Team, die bisher weniger stark ausgeprägt ist. Das Team kann breiter und leistungsfähiger werden — vorausgesetzt, Unterschiede werden transparent gemacht und gemeinsame Spielregeln verankert.",
            "Spannung": "Die Besetzung weicht in wichtigen Punkten vom Team ab. Die Unterschiede können produktiv sein, wenn sie bewusst gesteuert werden. Ohne klare Rahmung besteht die Gefahr, dass Arbeitsweisen gegeneinander statt miteinander wirken.",
            "Transformation": "Die Besetzung verändert das Teamsystem deutlich. Das ist kein moderater Impuls, sondern ein struktureller Eingriff, der aktive Führung, konsequente Kommunikation und eine klare Steuerungsarchitektur erfordert.",
          };

          return (
            <div style={{ marginTop: 20 }} data-testid="section-matchcheck-team">
              <div style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden" }}>
                <button
                  onClick={() => setMatchCheckOpen(!matchCheckOpen)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "14px 14px" : "20px 32px", border: "none", background: "transparent", cursor: "pointer", transition: "background 150ms" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  data-testid="button-toggle-matchcheck-team"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #34C759, #30B350)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Zap style={{ width: 15, height: 15, color: "#FFF", strokeWidth: 2.2 }} />
                    </div>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: "#34C759", flexShrink: 0 }}>TeamCheck:</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>Systemwirkung</span>
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${matchCheckOpen ? "rotate-180" : ""}`} />
                </button>

                {matchCheckOpen && (
                <div style={{ padding: isMobile ? "0 14px 14px" : "0 32px 28px" }}>
                  {(() => {
                    const cols = "1fr 1fr 1fr";
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, marginBottom: 20 }}>
                        <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#A0A0A5", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Status</p>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 5, background: fitColor, boxShadow: `0 0 0 3px ${fitColor}20` }} />
                            <span style={{ fontSize: 16, fontWeight: 700, color: fitColor }} data-testid="badge-teamcheck-result">{teamFitLabel}</span>
                          </div>
                        </div>
                        <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#A0A0A5", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Systemwirkung</p>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 5, background: swColor, boxShadow: `0 0 0 3px ${swColor}20` }} />
                            <span style={{ fontSize: 16, fontWeight: 700, color: swColor }} data-testid="text-systemwirkung-label">{systemwirkungLabel}</span>
                          </div>
                        </div>
                        <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#A0A0A5", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Integrationsrisiko</p>
                          <span style={{ fontSize: 16, fontWeight: 700, color: steuerungColor }} data-testid="text-integrationsrisiko">{steuerung}</span>
                        </div>
                      </div>
                    );
                  })()}
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de" data-testid="text-teamcheck-indicator">
                    {indicatorText}
                  </p>
                </div>
                )}
              </div>
            </div>
          );
        })()}

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
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Wirkung der Besetzung im Arbeitsalltag</p>
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

            {/* ── Actions ── */}
            <section className="mb-8">
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
            </section>

            {/* ── Final Assessment ── */}
            <section className="mb-8 rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm" data-testid="section-systemfazit">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Gesamtbewertung</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">{t("Abschließende Empfehlung")}</h3>
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
            p, li { orphans: 3; widows: 3; text-align: left !important; word-break: break-word; overflow-wrap: break-word; }
            h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
          }
        `}</style>
      </div>
    </div>
  );
}
