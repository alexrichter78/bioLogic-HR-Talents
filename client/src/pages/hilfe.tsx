import { useEffect, useMemo, useRef, useState } from "react";
import GlobalNav from "@/components/global-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRegion } from "@/lib/region";
import {
  HELP_SECTIONS, HELP_UI, regionToHelpLang,
  type HelpBlock as Block, type HelpUi,
} from "@/lib/help-content";
import {
  Search, BookOpen,
  Lightbulb, AlertTriangle, ChevronRight, Image as ImageIcon, ChevronUp,
} from "lucide-react";


function HelpImage({ src, caption, mock, previewLabel }: { src: string; caption: string; mock?: { title: string; bullets: string[] }; previewLabel: string }) {
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
              {previewLabel}
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

function TipBox({ text, kind, prefix }: { text: string; kind: "tip" | "warn"; prefix: string }) {
  const isTip = kind === "tip";
  const Icon = isTip ? Lightbulb : AlertTriangle;
  const color = isTip ? "#3B82F6" : "#D97706";
  const bg = isTip ? "rgba(59,130,246,0.06)" : "rgba(245,158,11,0.06)";
  const border = isTip ? "rgba(59,130,246,0.18)" : "rgba(245,158,11,0.22)";
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 14px", borderRadius: 10, background: bg, border: `1px solid ${border}`, margin: "10px 0 16px" }}>
      <Icon style={{ width: 16, height: 16, color, flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: 13, lineHeight: 1.55, color: isTip ? "#1E3A8A" : "#92400E" }}>
        <strong style={{ marginRight: 4 }}>{prefix}</strong>
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

function renderBlock(block: Block, key: number, ui: HelpUi) {
  switch (block.type) {
    case "p":
      return <p key={key} style={{ fontSize: 14, lineHeight: 1.65, color: "#1D1D1F", margin: "0 0 14px" }}>{block.text}</p>;
    case "steps":
      return <StepsList key={key} items={block.items} />;
    case "tip":
      return <TipBox key={key} kind="tip" text={block.text} prefix={ui.tipPrefix} />;
    case "warn":
      return <TipBox key={key} kind="warn" text={block.text} prefix={ui.warnPrefix} />;
    case "image":
      return <HelpImage key={key} src={block.src} caption={block.caption} mock={block.mock} previewLabel={ui.previewLabel} />;
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
  const { region } = useRegion();
  const lang = regionToHelpLang(region);
  const sections = HELP_SECTIONS[lang];
  const ui = HELP_UI[lang];
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>(sections[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(s => {
      const haystack = (s.title + " " + s.intro + " " + s.blocks.map(blockText).join(" ")).toLowerCase();
      return haystack.includes(q);
    });
  }, [query, sections]);

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
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }} data-testid="text-help-title">{ui.title}</h1>
          </div>
          <p style={{ fontSize: 14, color: "#48484A", margin: 0, lineHeight: 1.6, maxWidth: 720 }}>
            {ui.subtitle}
          </p>
        </header>

        <div style={{ position: "relative", marginBottom: 20 }}>
          <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#8E8E93" }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={ui.searchPlaceholder}
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
              <div style={{ padding: "10px 12px", fontSize: 13, color: "#8E8E93" }}>{ui.sidebarNoResults}</div>
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
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1D1D1F", margin: "0 0 6px" }}>{ui.emptyTitle}</h3>
                <p style={{ fontSize: 13, color: "#8E8E93", margin: 0 }}>{ui.emptyBody}</p>
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
                    {section.blocks.map((b, i) => renderBlock(b, i, ui))}
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
              {ui.scrollTop}
            </button>
          </main>
        </div>
      </div>
    </div>
  );
}
