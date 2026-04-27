import { Sparkles, Target, MessageCircle, BadgeCheck, Wand2, Copy, RefreshCw } from "lucide-react";

type Anteil = "impulsiv" | "intuitiv" | "analytisch";

interface Persona {
  anteil: Anteil;
  anteilLabel: string;
  farbName: string;
  swatch: string;
  bg: string;
  text: string;
  border: string;
  ring: string;
  name: string;
  rolle: string;
  alter: number;
  verteilung: { i: number; n: number; a: number };
  antrieb: string[];
  trigger: string[];
  donts: string[];
  beispielHeadline: string;
  beispielSub: string;
}

const personas: Persona[] = [
  {
    anteil: "impulsiv",
    anteilLabel: "Impulsiv",
    farbName: "Rot",
    swatch: "#DC2626",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    ring: "ring-red-300",
    name: "Markus",
    rolle: "Sales-Director, Mittelstand",
    alter: 47,
    verteilung: { i: 65, n: 20, a: 15 },
    antrieb: [
      "Schnell entscheiden, sofort spüren",
      "Status, Performance, Sichtbarkeit",
      "Konkurrenz schlagen — heute, nicht nächste Woche",
    ],
    trigger: ["Sofort", "Top-Performer", "Marktführer", "Limitiert", "Schluss mit", "Jetzt", "Vorsprung"],
    donts: ["Behutsam", "Wir laden Sie ein", "Schritt für Schritt", "Bedenken Sie"],
    beispielHeadline: "Den Stuhl, auf dem Top-Performer sitzen.",
    beispielSub: "Heute bestellt. Morgen geliefert. Sofort spürbar.",
  },
  {
    anteil: "intuitiv",
    anteilLabel: "Intuitiv",
    farbName: "Gelb",
    swatch: "#EAB308",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    ring: "ring-amber-300",
    name: "Sandra",
    rolle: "HR-Leitung, 280 Mitarbeitende",
    alter: 39,
    verteilung: { i: 15, n: 70, a: 15 },
    antrieb: [
      "Wohlbefinden für sich und das Team",
      "Geschichten, Beziehungen, Wertschätzung",
      "Etwas tun, das man später noch gerne erzählt",
    ],
    trigger: ["Du verdienst", "Gemeinsam", "Wertschätzung", "Wohlfühlen", "Vertrauen", "Geschichten", "Liebevoll"],
    donts: ["97 %", "DIN-Norm", "ROI", "Datenblatt", "Spezifikation"],
    beispielHeadline: "Damit dein Rücken dich auch in 10 Jahren noch trägt.",
    beispielSub: "Wie er es verdient. Mit Liebe gemacht — in Süddeutschland.",
  },
  {
    anteil: "analytisch",
    anteilLabel: "Analytisch",
    farbName: "Blau",
    swatch: "#2563EB",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    ring: "ring-blue-300",
    name: "Dr. Thomas",
    rolle: "Einkaufsleiter, Konzern",
    alter: 53,
    verteilung: { i: 10, n: 15, a: 75 },
    antrieb: [
      "Beweise, Daten, Vergleichbarkeit",
      "Risiko minimieren, Sicherheit maximieren",
      "Entscheidungen, die im Audit standhalten",
    ],
    trigger: ["Geprüft", "Garantie", "Studie zeigt", "97 %", "DIN", "Nachweis", "TÜV", "Zertifiziert"],
    donts: ["Spürbar", "Liebevoll", "Wahnsinn", "Du wirst staunen"],
    beispielHeadline: "Ergonomie nach DIN EN 1335. 15 Jahre Garantie.",
    beispielSub: "Unabhängige Studie: 97 % Wiederkauf-Rate nach 5 Jahren Nutzung.",
  },
];

function AnteilsBalken({ verteilung }: { verteilung: { i: number; n: number; a: number } }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-500">
        <span>Anteils-Verteilung</span>
        <span className="font-mono text-slate-400">
          {verteilung.i}/{verteilung.n}/{verteilung.a}
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div style={{ width: `${verteilung.i}%`, backgroundColor: "#DC2626" }} />
        <div style={{ width: `${verteilung.n}%`, backgroundColor: "#EAB308" }} />
        <div style={{ width: `${verteilung.a}%`, backgroundColor: "#2563EB" }} />
      </div>
    </div>
  );
}

function PersonaCard({ p }: { p: Persona }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1.5 w-full" style={{ backgroundColor: p.swatch }} />

      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${p.bg} ${p.text}`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.swatch }} />
              {p.anteilLabel} · {p.farbName}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            {p.name}, {p.alter}
          </h3>
          <p className="text-sm text-slate-500">{p.rolle}</p>
        </div>
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white text-base font-semibold ring-4 ring-white"
          style={{ backgroundColor: p.swatch }}
        >
          {p.name[0]}
        </div>
      </div>

      <div className="px-5 pt-4">
        <AnteilsBalken verteilung={p.verteilung} />
      </div>

      <div className="space-y-4 px-5 py-5">
        <section>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <Target className="h-3 w-3" />
            Was sie antreibt
          </div>
          <ul className="space-y-1 text-[13px] leading-snug text-slate-700">
            {p.antrieb.map((a, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <Sparkles className="h-3 w-3" />
            Trigger-Wörter
          </div>
          <div className="flex flex-wrap gap-1.5">
            {p.trigger.map((t) => (
              <span
                key={t}
                className={`rounded-md border px-2 py-0.5 text-[11.5px] font-medium ${p.bg} ${p.text} ${p.border}`}
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Don'ts</div>
          <div className="flex flex-wrap gap-1.5">
            {p.donts.map((d) => (
              <span
                key={d}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11.5px] font-medium text-slate-500 line-through"
              >
                {d}
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className={`mt-auto border-t border-slate-100 ${p.bg} px-5 py-4`}>
        <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
          <MessageCircle className="h-3 w-3" />
          Headline-Vorschlag
        </div>
        <p className={`text-sm font-semibold leading-snug ${p.text}`}>{p.beispielHeadline}</p>
        <p className="mt-1 text-[12.5px] leading-snug text-slate-600">{p.beispielSub}</p>
        <button className="mt-3 inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-white">
          <Copy className="h-3 w-3" />
          Kopieren
        </button>
      </div>
    </div>
  );
}

export function PersonaWerkzeug() {
  return (
    <div className="min-h-screen bg-slate-50 px-8 py-7 font-sans text-slate-900">
      <div className="mx-auto max-w-[1300px] space-y-6">
        <header className="flex items-start justify-between gap-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white">
                <Wand2 className="h-3.5 w-3.5" />
              </span>
              <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Persona-Werkzeug</h1>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                Louis · bioLogic
              </span>
            </div>
            <p className="text-[13.5px] text-slate-500">
              Beschreibe dein Produkt — Louis erzeugt drei Käufer-Personas, je eine pro bioLogic-Anteil.
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] text-slate-500 lg:flex">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
            Verbunden mit MatchCheck-Profilen
          </div>
        </header>

        <div className="grid grid-cols-12 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="col-span-12 lg:col-span-9">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Produktbeschreibung
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13.5px] leading-snug text-slate-700">
              Hochwertiger ergonomischer Bürostuhl für hybride Arbeitsplätze. Verstellbare Lordosenstütze,
              atmungsaktives Netzgewebe, 15 Jahre Herstellergarantie, gefertigt in Süddeutschland nach DIN EN 1335.
              Zielgruppe: Unternehmen mit 50–500 Mitarbeitenden, mittlere bis gehobene Preisklasse.
            </div>
          </div>
          <div className="col-span-12 flex items-end gap-2 lg:col-span-3">
            <button className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-[13px] font-semibold text-white hover:bg-slate-800">
              <Sparkles className="h-4 w-4" />
              Personas erzeugen
            </button>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              aria-label="Neu mischen"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {personas.map((p) => (
            <PersonaCard key={p.anteil} p={p} />
          ))}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-[12.5px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Drei Personas decken alle drei bioLogic-Anteile ab — Kommunikation erreicht jeden Käufertyp.
          </div>
          <div className="flex gap-2">
            <button className="rounded-md border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50">
              Als PDF teilen
            </button>
            <button className="rounded-md bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800">
              Mit Louis verfeinern
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
