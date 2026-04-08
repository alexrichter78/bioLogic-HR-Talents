import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus, Trash2, Pencil, X, Save, Users, CalendarDays, Shield, Building2, Search, ChevronUp, ChevronDown, Database, KeyRound, Copy, Check, ThumbsUp, ThumbsDown, BookOpen, FileText, MessageSquare, RotateCcw } from "lucide-react";

interface UserWithSub {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role: string;
  isActive: boolean;
  courseAccess: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  organizationId: number | null;
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
  courseAccess: boolean;
  accessUntil: string;
  plan: string;
  notes: string;
  subscriptionStatus: string;
  organizationId: number | null;
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
  courseAccess: false,
  accessUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  plan: "trial",
  notes: "",
  subscriptionStatus: "active",
  organizationId: null,
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
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
  const [activeTab, setActiveTab] = useState<"users" | "feedback" | "knowledge" | "golden" | "topics" | "prompt" | "orgs">("users");
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [knowledgeDocs, setKnowledgeDocs] = useState<any[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [showKnowledgeForm, setShowKnowledgeForm] = useState(false);
  const [knowledgeForm, setKnowledgeForm] = useState({ title: "", content: "", category: "allgemein" });
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [goldenAnswers, setGoldenAnswers] = useState<any[]>([]);
  const [goldenLoading, setGoldenLoading] = useState(false);
  const [topicStats, setTopicStats] = useState<{ topic: string; count: number }[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [orgsList, setOrgsList] = useState<any[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<number | null>(null);
  const [orgForm, setOrgForm] = useState({ name: "", aiRequestLimit: "" });
  const [orgUsage, setOrgUsage] = useState<{ orgId: number; totals: any[]; perUser: any[] } | null>(null);
  const [orgUsageLoading, setOrgUsageLoading] = useState(false);

  const loadOrgs = async () => {
    setOrgsLoading(true);
    try {
      const res = await fetch("/api/admin/organizations", { credentials: "include" });
      if (res.ok) setOrgsList(await res.json());
    } catch {}
    setOrgsLoading(false);
  };

  const saveOrg = async () => {
    if (!orgForm.name) return;
    try {
      const payload: any = { name: orgForm.name };
      if (orgForm.aiRequestLimit) payload.aiRequestLimit = parseInt(orgForm.aiRequestLimit);
      else payload.aiRequestLimit = null;
      if (editingOrgId) {
        await fetch(`/api/admin/organizations/${editingOrgId}`, {
          method: "PATCH", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/organizations", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setShowOrgForm(false);
      setEditingOrgId(null);
      setOrgForm({ name: "", aiRequestLimit: "" });
      loadOrgs();
    } catch {}
  };

  const deleteOrg = async (id: number) => {
    if (!confirm("Organisation wirklich löschen? Alle zugewiesenen Benutzer werden von der Organisation getrennt.")) return;
    await fetch(`/api/admin/organizations/${id}`, { method: "DELETE", credentials: "include" });
    loadOrgs();
  };

  const resetOrgUsage = async (id: number) => {
    if (!confirm("Kontingent zurücksetzen?")) return;
    await fetch(`/api/admin/organizations/${id}/reset-usage`, { method: "POST", credentials: "include" });
    loadOrgs();
  };

  const loadOrgUsage = async (orgId: number) => {
    setOrgUsageLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/usage`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setOrgUsage({ orgId, totals: data.totals, perUser: data.perUser });
      }
    } catch {}
    setOrgUsageLoading(false);
  };

  const loadFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const res = await fetch("/api/coach-feedback", { credentials: "include" });
      if (res.ok) setFeedbackList(await res.json());
    } catch {}
    setFeedbackLoading(false);
  };

  const loadKnowledgeDocs = async () => {
    setKnowledgeLoading(true);
    try {
      const res = await fetch("/api/knowledge-documents", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setKnowledgeDocs(data);
      } else {
        console.error("Knowledge docs load failed:", res.status, await res.text());
      }
    } catch (err) {
      console.error("Knowledge docs fetch error:", err);
    }
    setKnowledgeLoading(false);
  };

  const loadGoldenAnswers = async () => {
    setGoldenLoading(true);
    try {
      const res = await fetch("/api/golden-answers", { credentials: "include" });
      if (res.ok) setGoldenAnswers(await res.json());
    } catch {}
    setGoldenLoading(false);
  };

  const loadTopicStats = async () => {
    setTopicsLoading(true);
    try {
      const res = await fetch("/api/coach-topics", { credentials: "include" });
      if (res.ok) setTopicStats(await res.json());
    } catch {}
    setTopicsLoading(false);
  };

  const loadPrompt = async () => {
    setPromptLoading(true);
    try {
      const res = await fetch("/api/coach-system-prompt", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPromptText(data.prompt || "");
      }
    } catch {}
    setPromptLoading(false);
  };

  const savePrompt = async () => {
    setPromptSaving(true);
    setPromptSaved(false);
    try {
      const res = await fetch("/api/coach-system-prompt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: promptText }),
      });
      if (res.ok) {
        setPromptSaved(true);
        setTimeout(() => setPromptSaved(false), 3000);
      }
    } catch {}
    setPromptSaving(false);
  };

  const resetPrompt = async () => {
    if (!confirm("Prompt auf Standard zurücksetzen? Deine Änderungen gehen verloren.")) return;
    try {
      const res = await fetch("/api/coach-system-prompt/reset", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPromptText(data.prompt || "");
        setPromptSaved(true);
        setTimeout(() => setPromptSaved(false), 3000);
      }
    } catch {}
  };

  const deleteGoldenAnswer = async (id: number) => {
    try {
      const res = await fetch(`/api/golden-answers/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setGoldenAnswers(prev => prev.filter(a => a.id !== id));
      }
    } catch {}
  };

  useEffect(() => {
    if (activeTab === "feedback") loadFeedback();
    if (activeTab === "knowledge") loadKnowledgeDocs();
    if (activeTab === "golden") loadGoldenAnswers();
    if (activeTab === "topics") loadTopicStats();
    if (activeTab === "prompt") loadPrompt();
    if (activeTab === "orgs") loadOrgs();
  }, [activeTab]);

  const saveKnowledgeDoc = async () => {
    if (!knowledgeForm.title || !knowledgeForm.content) return;
    try {
      if (editingDocId) {
        await fetch(`/api/knowledge-documents/${editingDocId}`, {
          method: "PATCH", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(knowledgeForm),
        });
      } else {
        await fetch("/api/knowledge-documents", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(knowledgeForm),
        });
      }
      setShowKnowledgeForm(false);
      setEditingDocId(null);
      setKnowledgeForm({ title: "", content: "", category: "allgemein" });
      loadKnowledgeDocs();
    } catch {}
  };

  const deleteKnowledgeDoc = async (id: number) => {
    if (!confirm("Dokument wirklich löschen?")) return;
    await fetch(`/api/knowledge-documents/${id}`, { method: "DELETE", credentials: "include" });
    loadKnowledgeDocs();
  };

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
    try {
      const orgRes = await fetch("/api/admin/organizations", { credentials: "include" });
      if (orgRes.ok) setOrgsList(await orgRes.json());
    } catch {}
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
      courseAccess: u.courseAccess,
      accessUntil: u.subscription?.accessUntil ? new Date(u.subscription.accessUntil).toISOString().split("T")[0] : "",
      plan: u.subscription?.plan || "premium",
      notes: u.subscription?.notes || "",
      subscriptionStatus: u.subscription?.status || "active",
      organizationId: u.organizationId ?? null,
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
        setResetLink(data.resetUrl);
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
              <option value="subadmin">Subadmin</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Organisation</label>
            <select value={form.organizationId ?? ""} onChange={e => setForm({ ...form, organizationId: e.target.value ? parseInt(e.target.value) : null })} style={inputStyle} data-testid="select-admin-org">
              <option value="">Keine Organisation</option>
              {orgsList.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Zugang bis</label>
            <input type="date" value={form.accessUntil} onChange={e => setForm({ ...form, accessUntil: e.target.value })} style={inputStyle} data-testid="input-admin-access-until" />
          </div>
          <div>
            <label style={labelStyle}>Plan</label>
            <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} style={inputStyle} data-testid="select-admin-plan">
              <option value="trial">Trial</option>
              <option value="basis">Basis</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
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
          <div style={{ display: "flex", alignItems: "end", gap: 16 }}>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} data-testid="input-admin-active" />
              Konto aktiv
            </label>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={form.courseAccess} onChange={e => setForm({ ...form, courseAccess: e.target.checked })} data-testid="input-admin-course-access" />
              Kursfreischaltung
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
    <div className="page-gradient-bg" style={{ fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <GlobalNav />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "64px 12px 80px" : "80px 20px 48px" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(0,0,0,0.03)", borderRadius: 12, padding: 4 }}>
          {[
            { id: "users" as const, label: "Benutzer", icon: Users },
            { id: "orgs" as const, label: "Organisationen", icon: Building2 },
            { id: "topics" as const, label: "Themen", icon: Database },
            { id: "feedback" as const, label: "Feedback", icon: ThumbsUp },
            { id: "golden" as const, label: "Goldene Antworten", icon: Check },
            { id: "knowledge" as const, label: "Wissen", icon: BookOpen },
            { id: "prompt" as const, label: "Prompt", icon: MessageSquare },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px 12px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600,
                background: activeTab === tab.id ? "#fff" : "transparent",
                color: activeTab === tab.id ? "#1D1D1F" : "#8E8E93",
                cursor: "pointer", transition: "all 150ms ease",
                boxShadow: activeTab === tab.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon style={{ width: 15, height: 15 }} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "users" && (
        <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 10 }} data-testid="text-admin-title">
              <Shield style={{ width: 22, height: 22, color: "#1A5DAB" }} />
              Benutzerverwaltung
            </h1>
            <p style={{ fontSize: 14, color: "#6E6E73", margin: 0 }}>{users.length} Benutzer registriert{search && filteredUsers.length !== users.length ? ` · ${filteredUsers.length} angezeigt` : ""}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setLocation("/analyse")} data-testid="button-stammdaten" title="Stammdaten" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", color: "#1D1D1F", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 200ms ease" }}>
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
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: u.role === "admin" ? "linear-gradient(135deg, #1A5DAB, #0071E3)" : u.role === "subadmin" ? "linear-gradient(135deg, #AF52DE, #DA70D6)" : "linear-gradient(135deg, #E5E5EA, #D1D1D6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {u.role === "admin" ? <Shield style={{ width: 16, height: 16, color: "#fff" }} /> : u.role === "subadmin" ? <Building2 style={{ width: 16, height: 16, color: "#fff" }} /> : <Users style={{ width: 16, height: 16, color: "#636366" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>{u.firstName} {u.lastName}</span>
                      {!u.isActive && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "rgba(255,59,48,0.08)", color: "#C41E3A", fontWeight: 600 }}>Deaktiviert</span>}
                      {u.role === "admin" && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "rgba(0,113,227,0.08)", color: "#0071E3", fontWeight: 600 }}>Admin</span>}
                      {u.role === "subadmin" && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "rgba(175,82,222,0.08)", color: "#AF52DE", fontWeight: 600 }}>Subadmin</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#8E8E93" }}>
                      <span style={{ fontWeight: 500 }}>@{u.username}</span>
                      {u.companyName && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Building2 style={{ width: 11, height: 11 }} />{u.companyName}</span>}
                      {u.organizationId && (() => { const org = orgsList.find((o: any) => o.id === u.organizationId); return org ? <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "rgba(0,113,227,0.06)", color: "#0071E3", fontWeight: 500 }}>{org.name}</span> : null; })()}
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
        </>
        )}

        {activeTab === "orgs" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }} data-testid="text-orgs-title">
                  <Building2 style={{ width: 20, height: 20, color: "#1A5DAB" }} />
                  Organisationen
                </h2>
                <p style={{ fontSize: 14, color: "#6E6E73", margin: 0 }}>{orgsList.length} Organisationen</p>
              </div>
              <button
                onClick={() => { setShowOrgForm(true); setEditingOrgId(null); setOrgForm({ name: "", aiRequestLimit: "" }); }}
                data-testid="button-create-org"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, border: "none", background: "#1D1D1F", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                <Plus style={{ width: 16, height: 16 }} />
                Neue Organisation
              </button>
            </div>

            {showOrgForm && (
              <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "1px solid rgba(0,0,0,0.08)", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#1D1D1F" }}>{editingOrgId ? "Organisation bearbeiten" : "Neue Organisation"}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Name *</label>
                    <input value={orgForm.name} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} data-testid="input-org-name" placeholder="z.B. Muster GmbH" />
                  </div>
                  <div>
                    <label style={labelStyle}>KI-Limit (leer = unbegrenzt)</label>
                    <input type="number" value={orgForm.aiRequestLimit} onChange={e => setOrgForm(f => ({ ...f, aiRequestLimit: e.target.value }))} style={inputStyle} data-testid="input-org-limit" placeholder="z.B. 500" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                  <button onClick={() => { setShowOrgForm(false); setEditingOrgId(null); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }} data-testid="button-cancel-org">Abbrechen</button>
                  <button onClick={saveOrg} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#1D1D1F", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} data-testid="button-save-org">
                    <Save style={{ width: 14, height: 14 }} />
                    Speichern
                  </button>
                </div>
              </div>
            )}

            {orgsLoading ? (
              <p style={{ textAlign: "center", color: "#8E8E93", padding: 40 }}>Laden...</p>
            ) : orgsList.length === 0 && !showOrgForm ? (
              <div style={{ textAlign: "center", padding: 60, color: "#8E8E93" }}>
                <Building2 style={{ width: 32, height: 32, marginBottom: 12, opacity: 0.4 }} />
                <p>Noch keine Organisationen vorhanden</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {orgsList.map(org => {
                  const quotaPercent = org.aiRequestLimit ? Math.min(100, Math.round((org.aiRequestsUsed / org.aiRequestLimit) * 100)) : null;
                  const showUsage = orgUsage?.orgId === org.id;
                  return (
                    <div key={org.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }} data-testid={`org-card-${org.id}`}>
                      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1A5DAB, #0071E3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Building2 style={{ width: 16, height: 16, color: "#fff" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F" }}>{org.name}</div>
                          <div style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>
                            {org.aiRequestLimit ? `${org.aiRequestsUsed} / ${org.aiRequestLimit} KI-Anfragen` : `${org.aiRequestsUsed} KI-Anfragen (unbegrenzt)`}
                          </div>
                          {quotaPercent !== null && (
                            <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.06)", marginTop: 6, maxWidth: 200, overflow: "hidden" }}>
                              <div style={{ height: "100%", borderRadius: 2, width: `${quotaPercent}%`, background: quotaPercent >= 90 ? "#FF3B30" : quotaPercent >= 70 ? "#FF9500" : "#34C759" }} />
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => { if (showUsage) { setOrgUsage(null); } else { loadOrgUsage(org.id); } }} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(0,113,227,0.15)", background: showUsage ? "rgba(0,113,227,0.08)" : "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#0071E3", whiteSpace: "nowrap" }} data-testid={`button-usage-org-${org.id}`}>
                            Nutzung
                          </button>
                          <button onClick={() => resetOrgUsage(org.id)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", background: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#636366", display: "flex", alignItems: "center", gap: 4 }} data-testid={`button-reset-org-${org.id}`}>
                            <RotateCcw style={{ width: 11, height: 11 }} />
                            Reset
                          </button>
                          <button onClick={() => { setEditingOrgId(org.id); setOrgForm({ name: org.name, aiRequestLimit: org.aiRequestLimit ? String(org.aiRequestLimit) : "" }); setShowOrgForm(true); }} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} data-testid={`button-edit-org-${org.id}`}>
                            <Pencil style={{ width: 14, height: 14, color: "#636366" }} />
                          </button>
                          <button onClick={() => deleteOrg(org.id)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,59,48,0.1)", background: "rgba(255,59,48,0.03)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} data-testid={`button-delete-org-${org.id}`}>
                            <Trash2 style={{ width: 14, height: 14, color: "#FF3B30" }} />
                          </button>
                        </div>
                      </div>

                      {showUsage && (
                        <div style={{ padding: "0 20px 16px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                          {orgUsageLoading ? (
                            <p style={{ textAlign: "center", color: "#8E8E93", padding: 16, fontSize: 13 }}>Laden...</p>
                          ) : (
                            <>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "12px 0" }}>
                                {(orgUsage?.totals || []).map((t: any) => (
                                  <div key={t.eventType} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(0,113,227,0.06)", fontSize: 12, fontWeight: 600, color: "#0071E3" }}>
                                    {t.eventType}: {t.count}
                                  </div>
                                ))}
                                {(!orgUsage?.totals || orgUsage.totals.length === 0) && (
                                  <span style={{ fontSize: 12, color: "#8E8E93" }}>Keine Nutzung im Zeitraum</span>
                                )}
                              </div>
                              {orgUsage?.perUser && orgUsage.perUser.length > 0 && (
                                <div style={{ fontSize: 12 }}>
                                  <div style={{ fontWeight: 600, color: "#636366", marginBottom: 6 }}>Pro Benutzer:</div>
                                  {(() => {
                                    const uMap = new Map<number, { name: string; events: Record<string, number> }>();
                                    for (const pu of orgUsage.perUser) {
                                      if (!uMap.has(pu.userId)) uMap.set(pu.userId, { name: `${pu.firstName} ${pu.lastName}`, events: {} });
                                      uMap.get(pu.userId)!.events[pu.eventType] = Number(pu.count);
                                    }
                                    return Array.from(uMap.entries()).map(([uid, u]) => (
                                      <div key={uid} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0", flexWrap: "wrap" }}>
                                        <span style={{ fontWeight: 500, color: "#1D1D1F", minWidth: 120 }}>{u.name}</span>
                                        {Object.entries(u.events).map(([evt, cnt]) => (
                                          <span key={evt} style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(0,0,0,0.04)", fontSize: 11, color: "#636366" }}>
                                            {evt}: {cnt}
                                          </span>
                                        ))}
                                      </div>
                                    ));
                                  })()}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "feedback" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
                  <ThumbsUp style={{ width: 20, height: 20, color: "#1A5DAB" }} />
                  Coach-Feedback
                </h2>
                <p style={{ fontSize: 14, color: "#6E6E73", margin: 0 }}>
                  {feedbackList.length} Bewertungen · {feedbackList.filter(f => f.feedbackType === "up").length} positiv · {feedbackList.filter(f => f.feedbackType === "down").length} negativ
                </p>
              </div>
            </div>
            {feedbackLoading ? (
              <p style={{ color: "#8E8E93", textAlign: "center", padding: 40 }}>Wird geladen...</p>
            ) : feedbackList.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#8E8E93" }}>
                <ThumbsUp style={{ width: 32, height: 32, marginBottom: 12, opacity: 0.4 }} />
                <p>Noch kein Feedback vorhanden</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[...feedbackList].reverse().map((f, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8,
                        background: f.feedbackType === "up" ? "rgba(52,199,89,0.1)" : "rgba(255,59,48,0.1)",
                        color: f.feedbackType === "up" ? "#1B7A3D" : "#C41E3A",
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {f.feedbackType === "up" ? <ThumbsUp style={{ width: 12, height: 12 }} /> : <ThumbsDown style={{ width: 12, height: 12 }} />}
                        {f.feedbackType === "up" ? "Positiv" : "Negativ"}
                      </div>
                      <span style={{ fontSize: 11, color: "#8E8E93" }}>
                        {new Date(f.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Nutzerfrage</span>
                      <p style={{ fontSize: 13, color: "#1D1D1F", margin: "2px 0 0", lineHeight: 1.5 }}>{f.userMessage.slice(0, 200)}{f.userMessage.length > 200 ? "..." : ""}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Coach-Antwort</span>
                      <p style={{ fontSize: 13, color: "#48484A", margin: "2px 0 0", lineHeight: 1.5 }}>{f.assistantMessage.slice(0, 300)}{f.assistantMessage.length > 300 ? "..." : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "knowledge" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
                  <BookOpen style={{ width: 20, height: 20, color: "#1A5DAB" }} />
                  Wissensdatenbank
                </h2>
                <p style={{ fontSize: 14, color: "#6E6E73", margin: 0 }}>{knowledgeDocs.length} Dokumente · Der KI-Coach nutzt diese Inhalte für seine Antworten</p>
              </div>
              <button
                onClick={() => { setShowKnowledgeForm(true); setEditingDocId(null); setKnowledgeForm({ title: "", content: "", category: "allgemein" }); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, border: "none", background: "#1D1D1F", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                data-testid="button-add-knowledge"
              >
                <Plus style={{ width: 16, height: 16 }} />
                Neues Dokument
              </button>
            </div>

            {showKnowledgeForm && (
              <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "1px solid rgba(0,0,0,0.08)", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#48484A", marginBottom: 4, display: "block" }}>Titel</label>
                    <input
                      value={knowledgeForm.title}
                      onChange={(e) => setKnowledgeForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="z.B. bioLogic Grundlagen"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, outline: "none" }}
                      data-testid="input-knowledge-title"
                    />
                  </div>
                  <div style={{ width: 180 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#48484A", marginBottom: 4, display: "block" }}>Kategorie</label>
                    <select
                      value={knowledgeForm.category}
                      onChange={(e) => setKnowledgeForm(f => ({ ...f, category: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, outline: "none", background: "#fff" }}
                      data-testid="select-knowledge-category"
                    >
                      <option value="allgemein">Allgemein</option>
                      <option value="methodik">Methodik</option>
                      <option value="fuehrung">Führung</option>
                      <option value="recruiting">Recruiting</option>
                      <option value="teamdynamik">Teamdynamik</option>
                      <option value="kommunikation">Kommunikation</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#48484A", marginBottom: 4, display: "block" }}>Inhalt</label>
                  <textarea
                    value={knowledgeForm.content}
                    onChange={(e) => setKnowledgeForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Hier den Wissensinhalt eingeben, den der KI-Coach nutzen soll..."
                    rows={8}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.6 }}
                    data-testid="textarea-knowledge-content"
                  />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => { setShowKnowledgeForm(false); setEditingDocId(null); }} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    Abbrechen
                  </button>
                  <button onClick={saveKnowledgeDoc} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: "#1D1D1F", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }} data-testid="button-save-knowledge">
                    <Save style={{ width: 14, height: 14, display: "inline", verticalAlign: "middle", marginRight: 6 }} />
                    {editingDocId ? "Aktualisieren" : "Speichern"}
                  </button>
                </div>
              </div>
            )}

            {knowledgeLoading ? (
              <p style={{ color: "#8E8E93", textAlign: "center", padding: 40 }}>Wird geladen...</p>
            ) : knowledgeDocs.length === 0 && !showKnowledgeForm ? (
              <div style={{ textAlign: "center", padding: 60, color: "#8E8E93" }}>
                <BookOpen style={{ width: 32, height: 32, marginBottom: 12, opacity: 0.4 }} />
                <p>Noch keine Dokumente vorhanden</p>
                <p style={{ fontSize: 13 }}>Fügen Sie Wissensartikel hinzu, die der KI-Coach für bessere Antworten nutzen kann.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {knowledgeDocs.map(doc => (
                  <div key={doc.id} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,113,227,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText style={{ width: 16, height: 16, color: "#0071E3" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", margin: 0 }}>{doc.title}</h3>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(0,0,0,0.04)", color: "#636366", fontWeight: 500 }}>{doc.category}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#48484A", margin: 0, lineHeight: 1.5 }}>{doc.content.slice(0, 150)}{doc.content.length > 150 ? "..." : ""}</p>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => { setEditingDocId(doc.id); setKnowledgeForm({ title: doc.title, content: doc.content, category: doc.category }); setShowKnowledgeForm(true); }}
                        style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        data-testid={`button-edit-doc-${doc.id}`}
                      >
                        <Pencil style={{ width: 14, height: 14, color: "#636366" }} />
                      </button>
                      <button
                        onClick={() => deleteKnowledgeDoc(doc.id)}
                        style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,59,48,0.1)", background: "rgba(255,59,48,0.03)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        data-testid={`button-delete-doc-${doc.id}`}
                      >
                        <Trash2 style={{ width: 14, height: 14, color: "#FF3B30" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "golden" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Check style={{ width: 20, height: 20, color: "#34C759" }} />
                  Goldene Antworten
                </h2>
                <p style={{ fontSize: 14, color: "#6E6E73", margin: 0 }}>
                  {goldenAnswers.length} bewährte Antworten · Werden als Qualitäts-Vorbilder für Louis genutzt
                </p>
              </div>
            </div>
            {goldenLoading ? (
              <p style={{ color: "#8E8E93", textAlign: "center", padding: 40 }}>Wird geladen...</p>
            ) : goldenAnswers.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#8E8E93" }}>
                <Check style={{ width: 32, height: 32, marginBottom: 12, opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>Noch keine goldenen Antworten</p>
                <p style={{ fontSize: 13, maxWidth: 400, margin: "0 auto" }}>Wenn Nutzer eine Coach-Antwort mit Daumen hoch bewerten, wird sie automatisch als goldene Antwort gespeichert. Louis nutzt diese dann als Qualitäts-Vorbilder.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[...goldenAnswers].reverse().map((a) => (
                  <div key={a.id} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid rgba(52,199,89,0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8,
                          background: "rgba(52,199,89,0.1)", color: "#1B7A3D", fontSize: 12, fontWeight: 600,
                        }}>
                          <Check style={{ width: 12, height: 12 }} />
                          {a.category}
                        </span>
                        <span style={{ fontSize: 11, color: "#8E8E93" }}>
                          {new Date(a.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteGoldenAnswer(a.id)}
                        style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,59,48,0.1)", background: "rgba(255,59,48,0.03)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        data-testid={`button-delete-golden-${a.id}`}
                      >
                        <Trash2 style={{ width: 12, height: 12, color: "#FF3B30" }} />
                      </button>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Nutzerfrage</span>
                      <p style={{ fontSize: 13, color: "#1D1D1F", margin: "2px 0 0", lineHeight: 1.5 }}>{a.userMessage.slice(0, 200)}{a.userMessage.length > 200 ? "..." : ""}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Goldene Antwort</span>
                      <p style={{ fontSize: 13, color: "#48484A", margin: "2px 0 0", lineHeight: 1.5 }}>{a.assistantMessage.slice(0, 400)}{a.assistantMessage.length > 400 ? "..." : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "prompt" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
                <MessageSquare style={{ width: 20, height: 20, color: "#1A5DAB" }} />
                Louis System-Prompt
              </h2>
              <p style={{ fontSize: 14, color: "#6E6E73", margin: 0 }}>
                Der vollständige Prompt, der Louis' Verhalten, Ton und Regeln steuert. Änderungen wirken sofort.
              </p>
            </div>
            {promptLoading ? (
              <p style={{ color: "#8E8E93", textAlign: "center", padding: 40 }} data-testid="prompt-loading">Wird geladen...</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <textarea
                  data-testid="prompt-textarea"
                  value={promptText}
                  onChange={e => { setPromptText(e.target.value); setPromptSaved(false); }}
                  style={{
                    width: "100%", minHeight: 500, padding: 16, fontSize: 13, lineHeight: 1.6,
                    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                    border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12,
                    background: "#FAFAFA", color: "#1D1D1F", resize: "vertical",
                    outline: "none",
                  }}
                  onFocus={e => { e.target.style.borderColor = "#1A5DAB"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.12)"; }}
                />
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    data-testid="prompt-save"
                    onClick={savePrompt}
                    disabled={promptSaving}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "10px 24px",
                      background: "#1A5DAB", color: "#fff", border: "none", borderRadius: 10,
                      fontSize: 14, fontWeight: 600, cursor: promptSaving ? "wait" : "pointer",
                      opacity: promptSaving ? 0.7 : 1,
                    }}
                  >
                    <Save style={{ width: 16, height: 16 }} />
                    {promptSaving ? "Speichert..." : "Speichern"}
                  </button>
                  <button
                    data-testid="prompt-reset"
                    onClick={resetPrompt}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                      background: "transparent", color: "#8E8E93", border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer",
                    }}
                  >
                    <RotateCcw style={{ width: 15, height: 15 }} />
                    Standard wiederherstellen
                  </button>
                  {promptSaved && (
                    <span style={{ color: "#34C759", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }} data-testid="prompt-saved-indicator">
                      <Check style={{ width: 15, height: 15 }} />
                      Gespeichert
                    </span>
                  )}
                </div>
                <div style={{ padding: 14, background: "rgba(26,93,171,0.06)", borderRadius: 10, fontSize: 13, color: "#6E6E73", lineHeight: 1.5 }}>
                  <strong style={{ color: "#1D1D1F" }}>Hinweis:</strong> Der Prompt-Kopf ("Du bist Louis – der bioLogic Coach...") und dynamische Teile (Region, Modus, Wissensbasis-Dokumente) werden automatisch hinzugefügt. Hier bearbeitest du den Hauptteil mit Ton, Regeln und Verhalten.
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "topics" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
                <Database style={{ width: 20, height: 20, color: "#1A5DAB" }} />
                Themen-Tracking
              </h2>
              <p style={{ fontSize: 14, color: "#6E6E73", margin: 0 }}>
                Welche Themen fragen die Nutzer am häufigsten? · {topicStats.reduce((sum, t) => sum + t.count, 0)} Anfragen gesamt
              </p>
            </div>
            {topicsLoading ? (
              <p style={{ color: "#8E8E93", textAlign: "center", padding: 40 }}>Wird geladen...</p>
            ) : topicStats.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#8E8E93" }}>
                <Database style={{ width: 32, height: 32, marginBottom: 12, opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>Noch keine Daten</p>
                <p style={{ fontSize: 13 }}>Sobald Nutzer mit Louis sprechen, siehst du hier die beliebtesten Themen.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topicStats.map((t, i) => {
                  const maxCount = topicStats[0]?.count || 1;
                  const percentage = Math.round((t.count / maxCount) * 100);
                  const colors = ["#1A5DAB", "#34C759", "#FF9500", "#FF3B30", "#AF52DE", "#5856D6", "#007AFF", "#FF2D55", "#5AC8FA", "#FFD60A"];
                  return (
                    <div key={t.topic} style={{ background: "#fff", borderRadius: 14, padding: "14px 20px", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F" }}>{t.topic}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: colors[i % colors.length] }}>{t.count} Anfragen</span>
                      </div>
                      <div style={{ height: 8, background: "rgba(0,0,0,0.04)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${percentage}%`, background: colors[i % colors.length],
                          borderRadius: 4, transition: "width 300ms ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
