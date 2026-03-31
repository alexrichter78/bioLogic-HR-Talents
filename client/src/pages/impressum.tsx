import { ArrowLeft } from "lucide-react";
import logoPath from "@assets/Logo_bioLogic_1774652440525.gif";

export default function Impressum() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf3 50%, #f5f7fb 100%)", fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => window.history.back()}
            data-testid="button-back-impressum"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Zurück
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
            <img src={logoPath} alt="bioLogic" style={{ height: 48, objectFit: "contain", marginBottom: 10 }} data-testid="img-impressum-logo" />
            <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, transparent, #D1D5DB, transparent)", marginBottom: 10 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>HR Talents</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-impressum-title">Impressum</h1>

          <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Angaben gemäss § 5 TMG</h2>
            <p style={{ margin: "0 0 20px" }}>
              foresMind® GmbH<br />
              Sonnenhang 4<br />
              87674 Ruderatshofen<br />
              Deutschland
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Vertreten durch die Geschäftsführer</h2>
            <p style={{ margin: "0 0 20px" }}>
              Alexander Richter, Wolfgang Drexler
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Kontakt</h2>
            <p style={{ margin: "0 0 20px" }}>
              Telefon: +49 (0)8343 / 338 998 – 1<br />
              E-Mail: info@foresmind.de
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Registereintrag</h2>
            <p style={{ margin: "0 0 20px" }}>
              Eintragung im Handelsregister<br />
              Registergericht: Amtsgericht Kempten<br />
              Registernummer: HRB 13751
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Umsatzsteuer-ID</h2>
            <p style={{ margin: "0 0 20px" }}>
              Umsatzsteuer-Identifikationsnummer gemäss § 27 a Umsatzsteuergesetz:<br />
              DE292672216
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p style={{ margin: "0 0 20px" }}>
              Alexander Richter
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Haftungshinweis</h2>
            <p style={{ margin: "0 0 20px" }}>
              Die bereitgestellten Analysen beschreiben wiederkehrende Muster im Arbeitskontext, sind wertfrei zu verstehen und stellen keine festen Persönlichkeitsprofile dar. Sie ersetzen keine individuelle Bewertung oder Entscheidung, sondern dienen ausschliesslich als Orientierung.
            </p>

            <p style={{ margin: "0 0 0", fontSize: 13, color: "#8E8E93" }}>
              © {new Date().getFullYear()} foresMind® GmbH. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
