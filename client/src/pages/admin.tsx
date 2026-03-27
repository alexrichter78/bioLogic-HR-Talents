import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import { Plus, Trash2, Pencil, X, Save, Users, CalendarDays, Shield, Building2, Search, ChevronUp, ChevronDown, Database, KeyRound, Copy, Check } from "lucide-react";

interface UserWithSub {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  subscription: {
    id: number;
    plan: string;
    status: string;
    accessUntil: string;
    notes: string | null;
  } | null;
}

interface UserForm {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role: string;
  isActive: boolean;
  accessUntil: string;
  plan: string;
  notes: string;
  subscriptionStatus: string;
}

const emptyForm: UserForm = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  companyName: "",
  role: "user",
  isActive: true,
  accessUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  plan: "premium",
  notes: "",
  subscriptionStatus: "active",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<UserWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "username" | "company" | "accessUntil" | "status">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = users;
    if (q) {
      list = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.companyName.toLowerCase().includes(q) ||
        (u.subscription?.plan || "").toLowerCase().includes(q) ||
        (u.role === "admin" && "admin".includes(q))
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, "de");
          break;
        case "username":
          cmp = a.username.localeCompare(b.username, "de");
          break;
        case "company":
          cmp = (a.companyName || "").localeCompare(b.companyName || "", "de");
          break;
        case "accessUntil": {
          const da = a.subscription?.accessUntil ? new Date(a.subscription.accessUntil).getTime() : 0;
          const db2 = b.subscription?.accessUntil ? new Date(b.subscription.accessUntil).getTime() : 0;
          cmp = da - db2;
          break;
        }
        case "status": {
          const sa = a.isActive && a.subscription?.status === "active" ? 1 : 0;
          const sb = b.isActive && b.subscription?.status === "active" ? 1 : 0;
          cmp = sa - sb;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [users, search, sortField, sortDir]);

  function toggleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  useEffect(() => {
    if (user?.role !== "admin") {
      setLocation("/");
      return;
    }
    loadUsers();
  }, [user, setLocation]);

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  function startEdit(u: UserWithSub) {
    setEditId(u.id);
    setShowCreate(false);
    setError("");
    setResetLink(null);
    setForm({
      username: u.username,
      email: u.email,
      password: "",
      firstName: u.firstName,
      lastName: u.lastName,
      companyName: u.companyName,
      role: u.role,
      isActive: u.isActive,
      accessUntil: u.subscription?.accessUntil ? new Date(u.subscription.accessUntil).toISOString().split("T")[0] : "",
      plan: u.subscription?.plan || "premium",
      notes: u.subscription?.notes || "",
      subscriptionStatus: u.subscription?.status || "active",
    });
  }

  function startCreate() {
    setEditId(null);
    setShowCreate(true);
    setError("");
    setResetLink(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      if (showCreate) {
        if (!form.username || !form.password) {
          setError("Benutzername und Passwort erforderlich");
          setSaving(false);
          return;
        }
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Fehler beim Erstellen");
          setSaving(false);
          return;
        }
        setShowCreate(false);
      } else if (editId) {
        const payload: any = { ...form };
        if (!payload.password) delete payload.password;
        const res = await fetch(`/api/admin/users/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Fehler beim Speichern");
          setSaving(false);
          return;
        }
        setEditId(null);
      }
      await loadUsers();
    } catch {
      setError("Verbindungsfehler");
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Benutzer wirklich löschen?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    await loadUsers();
  }

  async function handleGenerateResetLink(userId: number) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-link`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const baseUrl = window.location.origin;
        setResetLink(`${baseUrl}/reset-password?token=${data.token}`);
        setCopied(false);
      }
    } catch {
      setError("Fehler beim Erstellen des Reset-Links");
    }
  }

  function copyResetLink() {
    if (resetLink) {
      navigator.clipboard.writeText(resetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.1)",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    background: "#FAFBFC",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#48484A",
    display: "block",
    marginBottom: 4,
  };

  function renderForm() {
    return (
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid rgba(0,0,0,0.06)", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>
            {showCreate ? "Neuen Benutzer anlegen" : "Benutzer bearbeiten"}
          </h3>
          <button onClick={() => { setEditId(null); setShowCreate(false); setResetLink(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} data-testid="button-cancel-form">
            <X style={{ width: 18, height: 18, color: "#8E8E93" }} />
          </button>
        </div>

        {error && (
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.15)", marginBottom: 12, fontSize: 13, color: "#C41E3A", fontWeight: 500 }} data-testid="admin-form-error">
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Benutzername *</label>
            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={inputStyle} data-testid="input-admin-username" placeholder="z.B. jmueller" />
          </div>
          <div>
            <label style={labelStyle}>{showCreate ? "Passwort *" : "Neues Passwort (leer = unverändert)"}</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} data-testid="input-admin-password" />
          </div>
          <div>
            <label style={labelStyle}>E-Mail</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} data-testid="input-admin-email" placeholder="Für Passwort-Reset" />
          </div>
          <div>
            <label style={labelStyle}>Firma</label>
            <input type="text" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} style={inputStyle} data-testid="input-admin-company" />
          </div>
          <div>
            <label style={labelStyle}>Vorname</label>
            <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} style={inputStyle} data-testid="input-admin-firstname" />
          </div>
          <div>
            <label style={labelStyle}>Nachname</label>
            <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={inputStyle} data-testid="input-admin-lastname" />
          </div>
          <div>
            <label style={labelStyle}>Rolle</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inputStyle} data-testid="select-admin-role">
              <option value="user">Benutzer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Zugang bis</label>
            <input type="date" value={form.accessUntil} onChange={e => setForm({ ...form, accessUntil: e.target.value })} style={inputStyle} data-testid="input-admin-access-until" />
          </div>
          <div>
            <label style={labelStyle}>Plan</label>
            <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} style={inputStyle} data-testid="select-admin-plan">
              <option value="premium">Premium</option>
              <option value="basic">Basic</option>
              <option value="trial">Trial</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.subscriptionStatus} onChange={e => setForm({ ...form, subscriptionStatus: e.target.value })} style={inputStyle} data-testid="select-admin-sub-status">
              <option value="active">Aktiv</option>
              <option value="expired">Abgelaufen</option>
              <option value="canceled">Gekündigt</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} data-testid="input-admin-active" />
              Konto aktiv
            </label>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Notizen</label>
            <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inputStyle} placeholder="Optional" data-testid="input-admin-notes" />
          </div>
        </div>

        {editId && (
          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: resetLink ? 8 : 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#48484A" }}>Passwort-Reset-Link</span>
              <button
                onClick={() => handleGenerateResetLink(editId)}
                data-testid="button-generate-reset-link"
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.06)", color: "#3B82F6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                <KeyRound style={{ width: 13, height: 13 }} />
                Link generieren
              </button>
            </div>
            {resetLink && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <input type="text" value={resetLink} readOnly style={{ ...inputStyle, fontSize: 11, flex: 1, color: "#6B7280" }} data-testid="input-reset-link" />
                <button
                  onClick={copyResetLink}
                  data-testid="button-copy-reset-link"
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.1)", background: copied ? "#ECFDF5" : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500, color: copied ? "#059669" : "#374151", whiteSpace: "nowrap" }}
                >
                  {copied ? <Check style={{ width: 13, height: 13 }} /> : <Copy style={{ width: 13, height: 13 }} />}
                  {copied ? "Kopiert" : "Kopieren"}
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button onClick={() => { setEditId(null); setShowCreate(false); setResetLink(null); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }} data-testid="button-cancel">
            Abbrechen
          </button>
          <button onClick={handleSave} disabled={saving} data-testid="button-save-user" style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#1D1D1F", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Save style={{ width: 14, height: 14 }} />
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <GlobalNav />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 20px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 10 }} data-testid="text-admin-title">
              <Shield style={{ width: 22, height: 22, color: "#1A5DAB" }} />
              Benutzerverwaltung
            </h1>
            <p style={{ fontSize: 14, color: "#6E6E73", margin: 0 }}>{users.length} Benutzer registriert{search && filteredUsers.length !== users.length ? ` · ${filteredUsers.length} angezeigt` : ""}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setLocation("/analyse")} data-testid="button-stammdaten" title="Stammdaten" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", color: "#1D1D1F", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 200ms ease" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}>
              <Database style={{ width: 16, height: 16 }} />
              Stammdaten
            </button>
            <button onClick={startCreate} data-testid="button-create-user" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, border: "none", background: "#1D1D1F", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              <Plus style={{ width: 16, height: 16 }} />
              Neuer Benutzer
            </button>
          </div>
        </div>

        {(showCreate || editId) && renderForm()}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#8E8E93", pointerEvents: "none" }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Name, Benutzer, Firma oder Plan suchen..."
              data-testid="input-search-users"
              style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", fontSize: 13, outline: "none", background: "#fff", color: "#1D1D1F", boxSizing: "border-box" }}
            />
          </div>
          {(["name", "username", "company", "accessUntil", "status"] as const).map(f => {
            const labels: Record<string, string> = { name: "Name", username: "Benutzer", company: "Firma", accessUntil: "Zugang", status: "Status" };
            const active = sortField === f;
            return (
              <button
                key={f}
                onClick={() => toggleSort(f)}
                data-testid={`sort-${f}`}
                style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "7px 10px", borderRadius: 8,
                  border: active ? "1px solid rgba(0,113,227,0.2)" : "1px solid rgba(0,0,0,0.06)",
                  background: active ? "rgba(0,113,227,0.06)" : "#fff",
                  cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 500,
                  color: active ? "#0071E3" : "#636366",
                  whiteSpace: "nowrap",
                }}
              >
                {labels[f]}
                {active ? (sortDir === "asc" ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />) : null}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#8E8E93", padding: 40 }}>Laden...</p>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#8E8E93" }}>
            <Search style={{ width: 32, height: 32, color: "#D1D1D6", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, margin: 0 }}>Keine Benutzer gefunden für &laquo;{search}&raquo;</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredUsers.map(u => {
              const isExpired = u.subscription ? new Date(u.subscription.accessUntil) < new Date() : true;
              const subActive = u.subscription?.status === "active" && !isExpired;
              return (
                <div key={u.id} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }} data-testid={`admin-user-row-${u.id}`}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: u.role === "admin" ? "linear-gradient(135deg, #1A5DAB, #0071E3)" : "linear-gradient(135deg, #E5E5EA, #D1D1D6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {u.role === "admin" ? <Shield style={{ width: 16, height: 16, color: "#fff" }} /> : <Users style={{ width: 16, height: 16, color: "#636366" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>{u.firstName} {u.lastName}</span>
                      {!u.isActive && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "rgba(255,59,48,0.08)", color: "#C41E3A", fontWeight: 600 }}>Deaktiviert</span>}
                      {u.role === "admin" && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "rgba(0,113,227,0.08)", color: "#0071E3", fontWeight: 600 }}>Admin</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#8E8E93" }}>
                      <span style={{ fontWeight: 500 }}>@{u.username}</span>
                      {u.companyName && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Building2 style={{ width: 11, height: 11 }} />{u.companyName}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 120 }}>
                    {u.subscription ? (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginBottom: 2 }}>
                          <CalendarDays style={{ width: 12, height: 12, color: subActive ? "#34C759" : "#FF3B30" }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: subActive ? "#1B7A3D" : "#C41E3A" }}>
                            {formatDate(u.subscription.accessUntil)}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: "#8E8E93" }}>{u.subscription.plan}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: "#8E8E93" }}>Kein Abo</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => startEdit(u)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} data-testid={`button-edit-user-${u.id}`}>
                      <Pencil style={{ width: 14, height: 14, color: "#636366" }} />
                    </button>
                    {u.id !== user?.id && (
                      <button onClick={() => handleDelete(u.id)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,59,48,0.1)", background: "rgba(255,59,48,0.03)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} data-testid={`button-delete-user-${u.id}`}>
                        <Trash2 style={{ width: 14, height: 14, color: "#FF3B30" }} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
