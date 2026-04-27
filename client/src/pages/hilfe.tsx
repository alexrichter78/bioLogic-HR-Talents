import { useEffect, useMemo, useRef, useState } from "react";
import GlobalNav from "@/components/global-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  HelpCircle, Search, BookOpen, LogIn, LayoutDashboard, Briefcase, GitCompareArrows,
  Users, Bot, GraduationCap, UserCog, MessageCircleQuestion, LifeBuoy,
  Lightbulb, AlertTriangle, ChevronRight, Image as ImageIcon, ChevronUp,
} from "lucide-react";

type Block =
  | { type: "p"; text: string }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "tip"; text: string }
  | { type: "warn"; text: string }
  | { type: "image"; src: string; caption: string; mock?: { title: string; bullets: string[] } }
  | { type: "list"; items: string[] };

type Section = {
  id: string;
  title: string;
  shortTitle?: string;
  icon: typeof HelpCircle;
  intro: string;
  blocks: Block[];
};

const SECTIONS: Section[] = [
  {
    id: "erste-schritte",
    title: "Erste Schritte",
    icon: LogIn,
    intro:
      "So meldest du dich an, stellst die Sprache ein und findest dich in der Software zurecht.",
    blocks: [
      { type: "p", text: "bioLogic HR-Talents ist deine Software für die biologisch fundierte Analyse von Rollen, Bewerbern und Teams. Du arbeitest komplett im Browser — es muss nichts installiert werden." },
      {
        type: "steps",
        items: [
          { title: "Anmelden", text: "Öffne https://www.my-biologic.de/, gib Benutzername und Passwort ein und klicke auf „Anmelden”. Die Zugangsdaten hast du per E-Mail erhalten." },
          { title: "Passwort ändern", text: "Wir empfehlen, dein Standardpasswort direkt nach dem ersten Login zu ändern. Klicke dazu auf der Anmeldemaske auf „Passwort vergessen?”, trag deine E-Mail-Adresse ein und folge dem Link, den du bekommst." },
          { title: "Sprache wählen", text: "Oben rechts findest du den Globus-Schalter. Dort kannst du zwischen Deutsch (DE/CH/AT), English, Français und Italiano wechseln." },
          { title: "Navigation kennenlernen", text: "Die Hauptnavigation oben enthält alle Bereiche: Home, JobCheck, MatchCheck, TeamCheck und KI-Coach. Wenn du Kursfreischaltung hast, erscheint zusätzlich „Kurs”." },
        ],
      },
      {
        type: "image",
        src: "/help/01-anmeldung.png",
        caption: "Anmelde-Maske",
        mock: { title: "Anmeldung", bullets: ["Logo & „HR Talents”-Schriftzug", "Feld: Benutzername", "Feld: Passwort + Augen-Icon", "Sprach-Auswahl + Link „Passwort vergessen?”", "Blauer Button „Anmelden”"] },
      },
      { type: "tip", text: "Wenn du dein Passwort vergessen hast, klicke einfach auf „Passwort vergessen?” auf der Anmeldemaske. Du bekommst dann einen Link per E-Mail, mit dem du ein neues Passwort vergeben kannst." },
    ],
  },
  {
    id: "startseite",
    title: "Startseite",
    icon: LayoutDashboard,
    intro: "Die Startseite ist dein Einstiegspunkt. Von hier startest du jede Analyse.",
    blocks: [
      { type: "p", text: "Auf der Startseite siehst du die wichtigsten Bereiche als große Karten. Mit einem Klick startest du jede Analyse — alle Schritte führen dich anschließend von links nach rechts durch den Prozess." },
      {
        type: "list",
        items: [
          "JobCheck — Beschreibung einer Rolle (was die Rolle wirklich braucht)",
          "MatchCheck — Vergleich Rolle ↔ Bewerber",
          "TeamCheck — Auswirkung des Bewerbers auf das Team",
          "KI-Coach Louis — Fragen, Gesprächsvorbereitung, Konflikte",
        ],
      },
      {
        type: "image",
        src: "/help/02-startseite.png",
        caption: "Startseite mit Schnellzugriff",
        mock: { title: "Startseite", bullets: ["Begrüßung mit deinem Vornamen", "4 große Karten (JobCheck, MatchCheck, TeamCheck, Coach)", "Letzte Aktivitäten", "Schnellstart-Hinweise"] },
      },
      { type: "tip", text: "Von jeder Seite aus kommst du jederzeit mit Klick auf das bioLogic-Logo oder „Home” oben links zurück zur Startseite." },
    ],
  },
  {
    id: "jobcheck",
    title: "JobCheck — Rolle analysieren",
    shortTitle: "JobCheck",
    icon: Briefcase,
    intro:
      "Mit dem JobCheck erstellst du in vier Schritten die „Rollen-DNA”: ein präzises Anforderungsprofil, das die wirklichen Anforderungen einer Stelle beschreibt — nicht nur die üblichen HR-Floskeln.",
    blocks: [
      { type: "p", text: "Die Rollen-DNA ist die Grundlage für alle weiteren Schritte (MatchCheck und TeamCheck). Plane für eine gute Rollen-DNA etwa 10–15 Minuten konzentrierte Arbeit ein." },
      {
        type: "steps",
        items: [
          { title: "1. Beruf auswählen", text: "Wähle den Beruf aus der Liste oder gib einen freien Titel ein. Dieser Titel erscheint später im Bericht." },
          { title: "2. Führungsspanne festlegen", text: "Hat die Rolle Personalverantwortung? Wenn ja, für wie viele Mitarbeitende? Das beeinflusst die Anforderungen deutlich." },
          { title: "3. Erfolgsfokus angeben", text: "Worauf zahlt die Rolle ein: stabilen Betrieb, Wachstum, Wandel, Konfliktbewältigung? Die Software zieht daraus die DNA." },
          { title: "4. Tätigkeiten priorisieren", text: "Du bekommst eine Liste von Tätigkeitsbausteinen. Ordne sie nach Wichtigkeit. Daraus entsteht das endgültige Profil." },
        ],
      },
      {
        type: "image",
        src: "/help/03-jobcheck.png",
        caption: "JobCheck — Tätigkeiten priorisieren",
        mock: { title: "JobCheck Schritt 4", bullets: ["Fortschrittsbalken oben (Schritt 4 von 4)", "Liste mit Tätigkeitskarten", "Drag-Handles zum Sortieren", "Button „Auswertung starten” unten"] },
      },
      { type: "p", text: "Nach dem letzten Schritt wird die Rollen-DNA berechnet (das dauert ca. 10–20 Sekunden). Du landest direkt im Bericht." },
      {
        type: "image",
        src: "/help/04-rollenprofil.png",
        caption: "Ergebnis: Rollen-Bericht mit Triade",
        mock: { title: "Rollen-Bericht", bullets: ["Triaden-Diagramm (Analytisch · Intuitiv · Impulsiv)", "Kurzbeschreibung der Rolle", "Stärken & Risiken", "Button „Als PDF speichern”"] },
      },
      { type: "tip", text: "Speichere jede fertige Rollen-DNA als PDF, bevor du sie weiterbearbeitest — so hast du immer einen Vergleichsstand." },
      { type: "warn", text: "Beantworte die Fragen so ehrlich wie möglich. Die Methode merkt es, wenn du nur „nett klingende” Antworten anklickst — und das Ergebnis wird ungenau." },
    ],
  },
  {
    id: "matchcheck",
    title: "MatchCheck — Bewerber vergleichen",
    shortTitle: "MatchCheck",
    icon: GitCompareArrows,
    intro:
      "Der MatchCheck zeigt dir, wie gut ein Bewerber wirklich auf die Rolle passt. Nicht „Note 1 bis 6”, sondern eine inhaltliche Begründung mit dem größten Reibungspunkt.",
    blocks: [
      { type: "p", text: "Voraussetzung: Du brauchst eine fertige Rollen-DNA (aus dem JobCheck) und ein Ist-Profil des Bewerbers. Das Ist-Profil kannst du z.B. aus einem BioCheck des Bewerbers übernehmen oder direkt eingeben." },
      {
        type: "steps",
        items: [
          { title: "Rolle auswählen", text: "Wähle die zu besetzende Rolle aus deiner Liste der erstellten Rollen-DNAs." },
          { title: "Bewerber-Profil hinzufügen", text: "Trag das Ist-Profil des Bewerbers ein — entweder per BioCheck-Code oder als manuelle Werte." },
          { title: "Auswertung starten", text: "Mit Klick auf „Vergleich starten” wird der Bericht erzeugt. Das dauert wieder ca. 10–20 Sekunden." },
        ],
      },
      {
        type: "image",
        src: "/help/05-matchcheck.png",
        caption: "MatchCheck — Soll-Ist-Bericht",
        mock: { title: "MatchCheck-Bericht", bullets: ["Zwei überlagerte Triaden (Soll = Rolle, Ist = Bewerber)", "Block „Biggest Gap” — wo passt es am wenigsten", "Begründung in Klartext", "Empfehlungen für das Gespräch", "PDF-Export"] },
      },
      { type: "tip", text: "Den „Biggest Gap”-Block solltest du immer lesen — er nennt dir den wichtigsten Punkt, den du im Vorstellungsgespräch ansprechen oder klären solltest." },
    ],
  },
  {
    id: "teamcheck",
    title: "TeamCheck — Teamdynamik prüfen",
    shortTitle: "TeamCheck",
    icon: Users,
    intro:
      "Der TeamCheck zeigt dir, wie der Bewerber das bestehende Team verändern wird — als Beschleuniger, Bremser oder Stabilisator.",
    blocks: [
      { type: "p", text: "Auch ein fachlich passender Bewerber kann ein Team kippen, wenn die Konstellation nicht stimmt. Der TeamCheck hilft dir, das vor der Einstellung zu erkennen." },
      {
        type: "steps",
        items: [
          { title: "Rolle und Bewerber wählen", text: "Wähle die Rolle und den geprüften Bewerber aus deinen bisherigen Analysen." },
          { title: "Team zusammenstellen", text: "Füge die bestehenden Teammitglieder hinzu (manuell oder per BioCheck). Du brauchst mindestens 2 weitere Teammitglieder, damit die Auswertung sinnvoll ist." },
          { title: "Bericht ansehen", text: "Du bekommst eine Ampel-Bewertung (grün/gelb/rot) plus eine Erklärung, wie der Bewerber das Team beeinflusst." },
        ],
      },
      {
        type: "image",
        src: "/help/06-teamcheck.png",
        caption: "TeamCheck — Ampel-Bewertung",
        mock: { title: "TeamCheck-Bericht", bullets: ["Profilkarten der Teammitglieder", "Ampel oben (Grün / Gelb / Rot)", "Rolle des Bewerbers im Team (Beschleuniger / Bremser / Stabilisator)", "Risiken & Chancen in Stichworten"] },
      },
      { type: "warn", text: "Eine rote Ampel heißt nicht automatisch „nicht einstellen”. Sie heißt: „Bevor du einstellst, schau dir diese Punkte an und plane Gegenmaßnahmen ein.”" },
    ],
  },
  {
    id: "ki-coach",
    title: "KI-Coach Louis",
    shortTitle: "KI-Coach",
    icon: Bot,
    intro:
      "Louis ist dein persönlicher Sparringspartner für HR- und Führungsthemen — direkt im Chat, jederzeit verfügbar.",
    blocks: [
      { type: "p", text: "Louis kennt die bioLogic-Methodik und alle Berichte, die du in deinem Account hast. Du kannst ihm Fragen zu konkreten Personen, Konflikten oder Vorgehensweisen stellen." },
      {
        type: "list",
        items: [
          "Gespräche vorbereiten (Bewerbungsgespräch, Feedback, Konflikt)",
          "Formulierungen prüfen lassen („Schreib das mal nochmal — höflicher”)",
          "Berichte erklären lassen („Was bedeutet eine rote Ampel im TeamCheck?”)",
          "Strategie-Sparring zu Personalfragen",
        ],
      },
      {
        type: "steps",
        items: [
          { title: "Chat öffnen", text: "Klicke in der Hauptnavigation auf „Coach” oder auf die Karte „KI-Coach Louis” auf der Startseite." },
          { title: "Frage stellen", text: "Schreib deine Frage einfach in das Eingabefeld unten. Du kannst auch Beispiel-Themen aus den Vorschlägen wählen." },
          { title: "Dokumente teilen (optional)", text: "Über das Büroklammer-Symbol kannst du Dokumente oder Bilder hochladen — z.B. eine Stellenanzeige oder einen Lebenslauf — und Louis bezieht sie in die Antwort ein." },
        ],
      },
      {
        type: "image",
        src: "/help/07-ki-coach.png",
        caption: "KI-Coach Chat",
        mock: { title: "Louis-Chat", bullets: ["Begrüßung von Louis", "Vorschlags-Karten („Gespräch üben”, „Konflikt klären”…)", "Eingabefeld unten + Upload-Symbol", "Verlauf links (frühere Unterhaltungen)"] },
      },
      { type: "tip", text: "Sag Louis konkret, was du brauchst: „Bereite mich auf ein Konfliktgespräch mit Mitarbeiter X vor” funktioniert besser als „Hilfe mit Konflikt”." },
    ],
  },
  {
    id: "kurs",
    title: "Kurs (E-Learning)",
    icon: GraduationCap,
    intro:
      "Im Kursbereich findest du Lerninhalte zur bioLogic-Methodik. Sichtbar nur für Benutzer mit Kursfreischaltung.",
    blocks: [
      { type: "p", text: "Wenn du in der Hauptnavigation den Reiter „Kurs” siehst, hast du Zugang zu den Lerninhalten. Falls nicht, kannst du die Freischaltung über deinen Administrator beantragen." },
      {
        type: "list",
        items: [
          "Grundlagen der bioLogic-Methodik",
          "So liest du eine Triade richtig",
          "Best Practices für JobCheck und MatchCheck",
          "Fortschritt wird automatisch gespeichert",
        ],
      },
      {
        type: "image",
        src: "/help/08-kurs.png",
        caption: "Kursübersicht",
        mock: { title: "Kursübersicht", bullets: ["Liste der Module mit Fortschrittsbalken", "Aktuelle Lektion oben hervorgehoben", "Button „Fortsetzen”"] },
      },
    ],
  },
  {
    id: "profil",
    title: "Profil & Einstellungen",
    icon: UserCog,
    intro: "So änderst du dein Passwort, deine Sprache und sonstige Einstellungen.",
    blocks: [
      {
        type: "steps",
        items: [
          { title: "Passwort ändern", text: "Logge dich aus, klicke auf der Anmeldemaske auf „Passwort vergessen?”, gib deine E-Mail-Adresse ein und folge dem Link, den du per E-Mail bekommst. Dort kannst du ein neues Passwort vergeben." },
          { title: "Sprache umstellen", text: "Klicke oben rechts auf den Globus-Schalter und wähle deine Sprache (DE/CH/AT/EN/FR/IT). Die Umstellung gilt sofort für alle Bereiche der Software." },
          { title: "Abmelden", text: "Klicke oben rechts auf das Logout-Symbol. Aus Sicherheitsgründen empfehlen wir, dich nach jeder Sitzung abzumelden — vor allem auf geteilten Rechnern." },
        ],
      },
      { type: "warn", text: "Gib deine Zugangsdaten niemals weiter. Wenn jemand anderes ebenfalls die Software nutzen soll, lass deinen Administrator einen eigenen Account anlegen." },
    ],
  },
  {
    id: "faq",
    title: "Häufige Fragen",
    shortTitle: "FAQ",
    icon: MessageCircleQuestion,
    intro: "Antworten auf die häufigsten Fragen unserer Nutzerinnen und Nutzer.",
    blocks: [
      {
        type: "steps",
        items: [
          { title: "Mein Zugang ist abgelaufen — was tun?", text: "Wende dich an deinen Administrator oder direkt an support@foresmind.de. Wir verlängern den Zugang in der Regel innerhalb eines Werktags." },
          { title: "Wie kann ich einen Bericht teilen?", text: "Jeder Bericht (Rollen-DNA, MatchCheck, TeamCheck) hat oben einen Button „Als PDF speichern”. Das PDF kannst du anschließend per E-Mail verschicken." },
          { title: "Funktioniert die Software auf dem Handy?", text: "Ja — die Hauptbereiche sind für Smartphone und Tablet optimiert. Für lange Berichte und für den JobCheck empfehlen wir aber einen Laptop oder Desktop." },
          { title: "Werden meine Daten weitergegeben?", text: "Nein. Deine Daten werden ausschließlich für deine Analysen verwendet. Details findest du im Datenschutz-Hinweis (Link unten auf der Anmeldeseite)." },
          { title: "Was bedeutet die Triade (Analytisch / Intuitiv / Impulsiv)?", text: "Die Triade ist der Kern der bioLogic-Methodik. Sie zeigt, in welchem Modus eine Person typischerweise denkt und entscheidet. Eine ausführliche Erklärung findest du im Kursbereich." },
        ],
      },
    ],
  },
  {
    id: "support",
    title: "Support & Kontakt",
    shortTitle: "Support",
    icon: LifeBuoy,
    intro: "Du kommst nicht weiter? So erreichst du uns.",
    blocks: [
      { type: "p", text: "Es gibt zwei Wege, Hilfe zu bekommen:" },
      {
        type: "list",
        items: [
          "Hilfe-Tool unten rechts in der Software (Sprechblasen-Symbol) — direkter Chat, oft die schnellste Antwort.",
          "E-Mail an support@foresmind.de — wir antworten in der Regel innerhalb eines Werktags.",
        ],
      },
      { type: "tip", text: "Beschreibe dein Problem so konkret wie möglich: In welchem Bereich bist du? Was hast du erwartet, was ist passiert? Ein Screenshot hilft oft enorm." },
      { type: "p", text: "Bei dringenden technischen Störungen wende dich am besten direkt per E-Mail an support@foresmind.de." },
    ],
  },
];

function HelpImage({ src, caption, mock }: { src: string; caption: string; mock?: { title: string; bullets: string[] } }) {
  const [errored, setErrored] = useState(false);
  return (
    <figure style={{ margin: "12px 0 18px", padding: 0 }}>
      <div style={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", background: "#FAFAFC", overflow: "hidden" }}>
        {!errored ? (
          <img
            src={src}
            alt={caption}
            onError={() => setErrored(true)}
            style={{ display: "block", width: "100%", height: "auto" }}
          />
        ) : (
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#86868B", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <ImageIcon style={{ width: 14, height: 14 }} />
              Vorschau
            </div>
            {mock && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{mock.title}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {mock.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#48484A", display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: "#0071E3", marginTop: 7, flexShrink: 0 }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
      <figcaption style={{ marginTop: 6, fontSize: 12, color: "#8E8E93", fontStyle: "italic" }}>{caption}</figcaption>
    </figure>
  );
}

function StepsList({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol style={{ margin: "8px 0 16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((s, i) => (
        <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", borderRadius: 10, background: "#F9FAFB", border: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 13, background: "#0071E3", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 2 }}>{s.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "#48484A" }}>{s.text}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function TipBox({ text, kind }: { text: string; kind: "tip" | "warn" }) {
  const isTip = kind === "tip";
  const Icon = isTip ? Lightbulb : AlertTriangle;
  const color = isTip ? "#3B82F6" : "#D97706";
  const bg = isTip ? "rgba(59,130,246,0.06)" : "rgba(245,158,11,0.06)";
  const border = isTip ? "rgba(59,130,246,0.18)" : "rgba(245,158,11,0.22)";
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 14px", borderRadius: 10, background: bg, border: `1px solid ${border}`, margin: "10px 0 16px" }}>
      <Icon style={{ width: 16, height: 16, color, flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: 13, lineHeight: 1.55, color: isTip ? "#1E3A8A" : "#92400E" }}>
        <strong style={{ marginRight: 4 }}>{isTip ? "Tipp:" : "Achtung:"}</strong>
        {text}
      </div>
    </div>
  );
}

function PlainList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "8px 0 16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((it, i) => (
        <li key={i} style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.55, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <ChevronRight style={{ width: 14, height: 14, color: "#0071E3", flexShrink: 0, marginTop: 4 }} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case "p":
      return <p key={key} style={{ fontSize: 14, lineHeight: 1.65, color: "#1D1D1F", margin: "0 0 14px" }}>{block.text}</p>;
    case "steps":
      return <StepsList key={key} items={block.items} />;
    case "tip":
      return <TipBox key={key} kind="tip" text={block.text} />;
    case "warn":
      return <TipBox key={key} kind="warn" text={block.text} />;
    case "image":
      return <HelpImage key={key} src={block.src} caption={block.caption} mock={block.mock} />;
    case "list":
      return <PlainList key={key} items={block.items} />;
  }
}

function blockText(b: Block): string {
  switch (b.type) {
    case "p": case "tip": case "warn": return b.text;
    case "steps": return b.items.map(s => `${s.title} ${s.text}`).join(" ");
    case "image": return `${b.caption} ${b.mock ? b.mock.title + " " + b.mock.bullets.join(" ") : ""}`;
    case "list": return b.items.join(" ");
  }
}

export default function Hilfe() {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.filter(s => {
      const haystack = (s.title + " " + s.intro + " " + s.blocks.map(blockText).join(" ")).toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  useEffect(() => {
    if (filtered.length === 0) return;
    if (!filtered.find(s => s.id === activeId)) {
      setActiveId(filtered[0].id);
    }
  }, [filtered, activeId]);

  function scrollToSection(id: string) {
    setActiveId(id);
    const el = sectionRefs.current[id];
    if (el) {
      const offset = isMobile ? 110 : 80;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  useEffect(() => {
    function onScroll() {
      const offset = isMobile ? 130 : 100;
      let current = filtered[0]?.id;
      for (const s of filtered) {
        const el = sectionRefs.current[s.id];
        if (el && el.getBoundingClientRect().top - offset <= 0) {
          current = s.id;
        }
      }
      if (current && current !== activeId) setActiveId(current);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [filtered, activeId, isMobile]);

  return (
    <div className="page-gradient-bg" style={{ fontFamily: "Inter, Arial, Helvetica, sans-serif", minHeight: "100vh" }}>
      <GlobalNav />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "64px 12px 80px" : "80px 24px 64px" }}>
        <header style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <BookOpen style={{ width: 22, height: 22, color: "#0071E3" }} />
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }} data-testid="text-help-title">Benutzerhandbuch</h1>
          </div>
          <p style={{ fontSize: 14, color: "#48484A", margin: 0, lineHeight: 1.6, maxWidth: 720 }}>
            Alles, was du brauchst, um bioLogic HR-Talents im Alltag souverän zu nutzen — Schritt für Schritt erklärt.
          </p>
        </header>

        <div style={{ position: "relative", marginBottom: 20 }}>
          <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#8E8E93" }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="In der Hilfe suchen…"
            data-testid="input-help-search"
            style={{
              width: "100%", padding: "12px 14px 12px 40px", borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
              fontSize: 14, color: "#1D1D1F", outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "240px 1fr", gap: 24, alignItems: "start" }}>
          <aside style={isMobile
            ? { background: "#fff", borderRadius: 12, padding: 6, border: "1px solid rgba(0,0,0,0.05)", display: "flex", overflowX: "auto", gap: 4 }
            : { position: "sticky", top: 80, background: "#fff", borderRadius: 14, padding: 8, border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: 2 }
          }>
            {filtered.length === 0 && (
              <div style={{ padding: "10px 12px", fontSize: 13, color: "#8E8E93" }}>Keine Treffer</div>
            )}
            {filtered.map(s => {
              const Icon = s.icon;
              const active = s.id === activeId;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  data-testid={`nav-help-${s.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: isMobile ? "8px 12px" : "9px 12px",
                    borderRadius: 10, border: "none",
                    background: active ? "rgba(0,113,227,0.08)" : "transparent",
                    color: active ? "#0071E3" : "#1D1D1F",
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    cursor: "pointer", textAlign: "left", whiteSpace: "nowrap",
                    transition: "all 150ms ease",
                  }}
                >
                  <Icon style={{ width: 15, height: 15, color: active ? "#0071E3" : "#86868B", flexShrink: 0 }} />
                  <span>{s.shortTitle ?? s.title}</span>
                </button>
              );
            })}
          </aside>

          <main ref={contentRef} style={{ minWidth: 0 }}>
            {filtered.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: 32, border: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
                <Search style={{ width: 32, height: 32, color: "#C7C7CC", margin: "0 auto 12px" }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1D1D1F", margin: "0 0 6px" }}>Nichts gefunden</h3>
                <p style={{ fontSize: 13, color: "#8E8E93", margin: 0 }}>Versuch es mit einem anderen Suchbegriff.</p>
              </div>
            ) : (
              filtered.map(section => {
                const Icon = section.icon;
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    ref={el => { sectionRefs.current[section.id] = el; }}
                    style={{ background: "#fff", borderRadius: 14, padding: isMobile ? 18 : 24, marginBottom: 16, border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", scrollMarginTop: 80 }}
                    data-testid={`section-help-${section.id}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,113,227,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon style={{ width: 18, height: 18, color: "#0071E3" }} />
                      </div>
                      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.01em" }}>{section.title}</h2>
                    </div>
                    <p style={{ fontSize: 14, color: "#48484A", margin: "0 0 14px", lineHeight: 1.6 }}>{section.intro}</p>
                    {section.blocks.map((b, i) => renderBlock(b, i))}
                  </section>
                );
              })
            )}

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              data-testid="button-scroll-top"
              style={{ display: "flex", alignItems: "center", gap: 6, margin: "16px auto 0", padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", fontSize: 12, fontWeight: 600, color: "#48484A", cursor: "pointer" }}
            >
              <ChevronUp style={{ width: 14, height: 14 }} />
              Nach oben
            </button>
          </main>
        </div>
      </div>
    </div>
  );
}
