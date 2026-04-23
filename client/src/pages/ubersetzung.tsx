import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, ArrowLeft, Download } from "lucide-react";
import { ALL_TRANSLATIONS, SECTIONS, TranslationEntry } from "@/lib/all-translations";

export default function Ubersetzung() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("Alle");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ALL_TRANSLATIONS.filter(entry => {
      const sectionMatch = selectedSection === "Alle" || entry.section === selectedSection;
      if (!sectionMatch) return false;
      if (!q) return true;
      return (
        entry.key.toLowerCase().includes(q) ||
        entry.de.toLowerCase().includes(q) ||
        entry.en.toLowerCase().includes(q) ||
        entry.fr.toLowerCase().includes(q) ||
        entry.it.toLowerCase().includes(q) ||
        entry.section.toLowerCase().includes(q)
      );
    });
  }, [search, selectedSection]);

  const grouped = useMemo(() => {
    const map: Record<string, TranslationEntry[]> = {};
    for (const entry of filtered) {
      if (!map[entry.section]) map[entry.section] = [];
      map[entry.section].push(entry);
    }
    return map;
  }, [filtered]);

  function exportCsv() {
    const header = "Bereich;Schlüssel;DE;EN;FR;IT\n";
    const rows = ALL_TRANSLATIONS.map(e =>
      [e.section, e.key, e.de, e.en, e.fr, e.it]
        .map(v => `"${v.replace(/"/g, '""')}"`)
        .join(";")
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "biologic-uebersetzungen.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const displaySections = selectedSection === "Alle"
    ? Object.keys(grouped)
    : Object.keys(grouped);

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F7", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.08)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, height: 56 }}>
            <button
              onClick={() => setLocation("/admin")}
              data-testid="button-back-to-admin"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(0,0,0,0.12)", color: "#1D1D1F", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
            >
              <ArrowLeft size={14} />
              Admin
            </button>
            <div style={{ width: 1, height: 20, background: "rgba(0,0,0,0.12)" }} />
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>
              Übersetzungen
            </h1>
            <span style={{ fontSize: 12, color: "#8E8E93", background: "#F2F2F7", borderRadius: 6, padding: "2px 8px" }}>
              {ALL_TRANSLATIONS.length} Einträge
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={exportCsv}
                data-testid="button-export-csv"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: "#1D1D1F", border: "none", color: "#FFFFFF", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              >
                <Download size={13} />
                CSV exportieren
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "12px 24px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 300px" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8E8E93" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Suche in allen Sprachen, Schlüsseln und Bereichen…"
              data-testid="input-search-translations"
              style={{
                width: "100%",
                paddingLeft: 30,
                paddingRight: 12,
                paddingTop: 7,
                paddingBottom: 7,
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.12)",
                fontSize: 13,
                color: "#1D1D1F",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          {/* Section filter */}
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            data-testid="select-section-filter"
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.12)",
              fontSize: 13,
              color: "#1D1D1F",
              background: "#FFFFFF",
              cursor: "pointer",
              outline: "none",
              minWidth: 180,
            }}
          >
            <option value="Alle">Alle Bereiche</option>
            {SECTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {(search || selectedSection !== "Alle") && (
            <span style={{ fontSize: 12, color: "#8E8E93" }}>
              {filtered.length} Treffer
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 24px 48px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8E8E93", fontSize: 14 }}>
            Keine Einträge gefunden.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {displaySections.map(section => (
              <div key={section}>
                {/* Section header */}
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#8E8E93",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                  paddingLeft: 4,
                }}>
                  {section}
                  <span style={{ fontWeight: 400, marginLeft: 8, textTransform: "none", letterSpacing: 0 }}>
                    ({grouped[section]?.length ?? 0})
                  </span>
                </div>

                {/* Table card */}
                <div style={{
                  background: "#FFFFFF",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.06)",
                  overflow: "hidden",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                  {/* Table head */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "200px 1fr 1fr 1fr 120px",
                    gap: 0,
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    background: "#F9F9FB",
                    padding: "0 16px",
                  }}>
                    {["Schlüssel", "DE", "EN", "FR", "IT"].map((col, i) => (
                      <div key={col} style={{
                        padding: "9px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#8E8E93",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        borderRight: i < 4 ? "1px solid rgba(0,0,0,0.06)" : "none",
                      }}>
                        {col}
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  {(grouped[section] ?? []).map((entry, idx) => (
                    <div
                      key={entry.key}
                      data-testid={`row-translation-${entry.key}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "200px 1fr 1fr 1fr 120px",
                        gap: 0,
                        padding: "0 16px",
                        borderBottom: idx < (grouped[section]?.length ?? 0) - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                        background: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#F0F4FF")}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA")}
                    >
                      {/* Key */}
                      <Cell borderRight>
                        <code style={{ fontSize: 11, color: "#636366", background: "#F2F2F7", borderRadius: 4, padding: "1px 5px", wordBreak: "break-all" }}>
                          {entry.key.split(".").slice(1).join(".")}
                        </code>
                      </Cell>

                      {/* DE */}
                      <Cell borderRight highlight={search} value={entry.de}>
                        <LangText text={entry.de} search={search} lang="de" />
                      </Cell>

                      {/* EN */}
                      <Cell borderRight highlight={search} value={entry.en}>
                        <LangText text={entry.en} search={search} lang="en" />
                      </Cell>

                      {/* FR */}
                      <Cell borderRight highlight={search} value={entry.fr}>
                        <LangText text={entry.fr} search={search} lang="fr" />
                      </Cell>

                      {/* IT */}
                      <Cell>
                        {entry.it ? (
                          <LangText text={entry.it} search={search} lang="it" />
                        ) : (
                          <span style={{ color: "#C7C7CC", fontSize: 12, fontStyle: "italic" }}>–</span>
                        )}
                      </Cell>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Cell({ children, borderRight, highlight, value }: {
  children: React.ReactNode;
  borderRight?: boolean;
  highlight?: string;
  value?: string;
}) {
  return (
    <div style={{
      padding: "10px 8px",
      fontSize: 13,
      color: "#1D1D1F",
      lineHeight: 1.5,
      borderRight: borderRight ? "1px solid rgba(0,0,0,0.06)" : "none",
      wordBreak: "break-word",
      minWidth: 0,
    }}>
      {children}
    </div>
  );
}

function LangText({ text, search, lang }: { text: string; search: string; lang: string }) {
  if (!search || !text.toLowerCase().includes(search.toLowerCase())) {
    return <span lang={lang}>{text}</span>;
  }
  const idx = text.toLowerCase().indexOf(search.toLowerCase());
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + search.length);
  const after = text.slice(idx + search.length);
  return (
    <span lang={lang}>
      {before}
      <mark style={{ background: "#FFF176", borderRadius: 2, padding: "0 1px" }}>{match}</mark>
      {after}
    </span>
  );
}
