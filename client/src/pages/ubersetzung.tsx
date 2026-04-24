import { useState, useMemo, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, ArrowLeft, Download, Check, Loader2 } from "lucide-react";
import { useTranslationContext, type DbTranslation } from "@/lib/translations-context";
import { ALL_TRANSLATIONS } from "@/lib/all-translations";
import { apiRequest } from "@/lib/queryClient";

const LANG_COLS = ["DE", "EN", "FR", "IT"] as const;
type Lang = "de" | "en" | "fr" | "it";

const SECTIONS = [...new Set(ALL_TRANSLATIONS.map(e => e.section))];

export default function Ubersetzung() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("Alle");
  const { translations, isLoaded, updateField } = useTranslationContext();

  useEffect(() => {
    apiRequest("POST", "/api/translations/sync", ALL_TRANSLATIONS).catch(() => {});
  }, []);

  const allEntries: DbTranslation[] = isLoaded && translations.size > 0
    ? ALL_TRANSLATIONS.map(s => translations.get(s.key) ?? { key: s.key, section: s.section, de: s.de, en: s.en, fr: s.fr, it: s.it, updatedAt: "" })
    : ALL_TRANSLATIONS.map(s => ({ key: s.key, section: s.section, de: s.de, en: s.en, fr: s.fr, it: s.it, updatedAt: "" }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allEntries.filter(entry => {
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
  }, [search, selectedSection, allEntries]);

  const grouped = useMemo(() => {
    const map: Record<string, DbTranslation[]> = {};
    for (const entry of filtered) {
      if (!map[entry.section]) map[entry.section] = [];
      map[entry.section].push(entry);
    }
    return map;
  }, [filtered]);

  function exportCsv() {
    const header = "Bereich;Schlüssel;DE;EN;FR;IT\n";
    const rows = allEntries.map(e =>
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
              {allEntries.length} Einträge
            </span>
            {!isLoaded && (
              <span style={{ fontSize: 12, color: "#8E8E93", display: "flex", alignItems: "center", gap: 4 }}>
                <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                Lade aus Datenbank…
              </span>
            )}
            {isLoaded && (
              <span style={{ fontSize: 12, color: "#34C759", display: "flex", alignItems: "center", gap: 4 }}>
                <Check size={12} />
                Live aus Datenbank
              </span>
            )}
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

      {/* Info banner */}
      <div style={{ background: "#EFF6FF", borderBottom: "1px solid #DBEAFE", padding: "8px 24px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", fontSize: 12, color: "#1D4ED8" }}>
          💡 <strong>Direkt bearbeitbar:</strong> Klicke auf einen Text in DE / EN / FR / IT — ändere ihn und drücke Enter oder verlasse das Feld. Die Änderung wird sofort gespeichert und im gesamten System übernommen.
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "12px 24px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 300px" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8E8E93" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Suche in allen Sprachen, Schlüsseln und Bereichen…"
              data-testid="input-search-translations"
              style={{ width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, color: "#1D1D1F", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            data-testid="select-section-filter"
            style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, color: "#1D1D1F", background: "#FFFFFF", cursor: "pointer", outline: "none", minWidth: 180 }}
          >
            <option value="Alle">Alle Bereiche</option>
            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || selectedSection !== "Alle") && (
            <span style={{ fontSize: 12, color: "#8E8E93" }}>{filtered.length} Treffer</span>
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
            {Object.keys(grouped).map(section => (
              <div key={section}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, paddingLeft: 4 }}>
                  {section}
                  <span style={{ fontWeight: 400, marginLeft: 8, textTransform: "none", letterSpacing: 0 }}>
                    ({grouped[section]?.length ?? 0})
                  </span>
                </div>
                <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  {/* Head */}
                  <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 1fr 1fr", gap: 0, borderBottom: "1px solid rgba(0,0,0,0.08)", background: "#F9F9FB", padding: "0 16px" }}>
                    {["Schlüssel", "DE", "EN", "FR", "IT"].map((col, i) => (
                      <div key={col} style={{ padding: "9px 8px", fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", borderRight: i < 4 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                        {col}
                      </div>
                    ))}
                  </div>
                  {/* Rows */}
                  {(grouped[section] ?? []).map((entry, idx) => (
                    <div
                      key={entry.key}
                      data-testid={`row-translation-${entry.key}`}
                      style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 1fr 1fr", gap: 0, padding: "0 16px", borderBottom: idx < (grouped[section]?.length ?? 0) - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", background: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}
                    >
                      {/* Key */}
                      <div style={{ padding: "10px 8px", fontSize: 13, color: "#1D1D1F", lineHeight: 1.5, borderRight: "1px solid rgba(0,0,0,0.06)", wordBreak: "break-word", minWidth: 0 }}>
                        <code style={{ fontSize: 11, color: "#636366", background: "#F2F2F7", borderRadius: 4, padding: "1px 5px", wordBreak: "break-all" }}>
                          {entry.key.split(".").slice(1).join(".")}
                        </code>
                      </div>
                      {/* Editable lang cells */}
                      {(["de", "en", "fr", "it"] as Lang[]).map((lang, li) => (
                        <EditableCell
                          key={lang}
                          value={entry[lang]}
                          search={search}
                          lang={lang}
                          borderRight={li < 3}
                          onSave={async (newVal) => {
                            await updateField(entry.key, lang, newVal);
                          }}
                        />
                      ))}
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

function EditableCell({
  value,
  search,
  lang,
  borderRight,
  onSave,
}: {
  value: string;
  search: string;
  lang: string;
  borderRight: boolean;
  onSave: (val: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function commitEdit() {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(false);
  }

  const cellStyle: React.CSSProperties = {
    padding: "10px 8px",
    fontSize: 13,
    color: "#1D1D1F",
    lineHeight: 1.5,
    borderRight: borderRight ? "1px solid rgba(0,0,0,0.06)" : "none",
    wordBreak: "break-word",
    minWidth: 0,
    cursor: "pointer",
    position: "relative",
    background: saved ? "#F0FDF4" : editing ? "#EFF6FF" : undefined,
    transition: "background 0.2s",
  };

  if (editing) {
    return (
      <div style={cellStyle}>
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          lang={lang}
          style={{ width: "100%", border: "1.5px solid #3B82F6", borderRadius: 4, padding: "2px 6px", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: "#1D1D1F" }}
        />
      </div>
    );
  }

  return (
    <div
      style={cellStyle}
      onClick={startEdit}
      title="Klicken zum Bearbeiten"
      data-testid={`cell-${lang}-${value?.slice(0, 10)}`}
    >
      {saving ? (
        <span style={{ color: "#8E8E93", display: "flex", alignItems: "center", gap: 4 }}>
          <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
          {draft}
        </span>
      ) : saved ? (
        <span style={{ color: "#16A34A", display: "flex", alignItems: "center", gap: 4 }}>
          <Check size={11} />
          {value || <em style={{ color: "#C7C7CC" }}>–</em>}
        </span>
      ) : value ? (
        <HighlightText text={value} search={search} lang={lang} />
      ) : (
        <span style={{ color: "#C7C7CC", fontSize: 12, fontStyle: "italic" }}>–</span>
      )}
    </div>
  );
}

function HighlightText({ text, search, lang }: { text: string; search: string; lang: string }) {
  if (!search || !text.toLowerCase().includes(search.toLowerCase())) {
    return <span lang={lang}>{text}</span>;
  }
  const idx = text.toLowerCase().indexOf(search.toLowerCase());
  return (
    <span lang={lang}>
      {text.slice(0, idx)}
      <mark style={{ background: "#FFF176", borderRadius: 2, padding: "0 1px" }}>{text.slice(idx, idx + search.length)}</mark>
      {text.slice(idx + search.length)}
    </span>
  );
}
