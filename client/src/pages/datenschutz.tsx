import { ArrowLeft } from "lucide-react";
import logoPath from "@assets/Logo_bioLogic_1774652440525.gif";

export default function Datenschutz() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf3 50%, #f5f7fb 100%)", fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => window.history.back()}
            data-testid="button-back-datenschutz"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Zurück
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
            <img src={logoPath} alt="bioLogic" style={{ height: 48, objectFit: "contain", marginBottom: 10 }} data-testid="img-datenschutz-logo" />
            <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, transparent, #D1D5DB, transparent)", marginBottom: 10 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>HR Talents</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-datenschutz-title">Datenschutzerklärung</h1>

          <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>1. Verantwortlicher</h2>
            <p style={{ margin: "0 0 20px" }}>
              Verantwortlich für die Datenverarbeitung ist:<br /><br />
              foresMind® GmbH<br />
              Sonnenhang 4<br />
              87674 Ruderatshofen<br />
              Deutschland<br />
              E-Mail: info@foresmind.de
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>2. Allgemeine Hinweise</h2>
            <p style={{ margin: "0 0 20px" }}>
              Diese Software dient der Analyse von Arbeitsweisen, Rollenanforderungen und Teamkonstellationen. Die Auswertungen stellen keine automatisierten Entscheidungen im rechtlichen Sinne dar und entfalten keine rechtliche Wirkung gegenüber betroffenen Personen. Die Ergebnisse dienen ausschliesslich als unterstützende Entscheidungsgrundlage.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>3. Art der verarbeiteten Daten</h2>
            <p style={{ margin: "0 0 8px" }}>
              Im Rahmen der Nutzung können folgende Daten verarbeitet werden:
            </p>
            <ul style={{ margin: "0 0 20px", paddingLeft: 20 }}>
              <li>Eingaben zur Rolle (z.&nbsp;B. Tätigkeiten, Anforderungen)</li>
              <li>Eingaben zur Person (z.&nbsp;B. Einschätzungen von Arbeitsweisen)</li>
              <li>Systemgenerierte Analyse-Ergebnisse</li>
            </ul>
            <p style={{ margin: "0 0 20px" }}>
              Diese Daten werden nicht personenbezogen gespeichert, sofern keine explizite Speicherung durch den Nutzer erfolgt.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>4. Keine dauerhafte Speicherung</h2>
            <p style={{ margin: "0 0 20px" }}>
              Die Verarbeitung erfolgt in der Regel temporär (Session-basiert) ohne dauerhafte Speicherung personenbezogener Daten. Eine Identifizierung einzelner Personen durch den Anbieter erfolgt nicht.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>5. Nutzung der Software (SaaS)</h2>
            <p style={{ margin: "0 0 20px" }}>
              Die Anwendung ist öffentlich zugänglich und wird von Kunden eigenständig genutzt. Die Verantwortung für die Eingabe personenbezogener Daten liegt beim jeweiligen Nutzer bzw. Unternehmen.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>6. Einsatz von Künstlicher Intelligenz</h2>
            <p style={{ margin: "0 0 8px" }}>
              Zur Generierung von Auswertungen und Empfehlungen wird künstliche Intelligenz eingesetzt, insbesondere Dienste von OpenAI. Dabei gilt:
            </p>
            <ul style={{ margin: "0 0 20px", paddingLeft: 20 }}>
              <li>Es erfolgt keine eigenständige Profilbildung durch den Anbieter</li>
              <li>Die Verarbeitung dient ausschliesslich der Erstellung von Textvorschlägen und Analysen</li>
              <li>Es werden keine Entscheidungen automatisiert getroffen</li>
            </ul>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>7. Hosting</h2>
            <p style={{ margin: "0 0 20px" }}>
              Die Software wird über externe Hosting-Dienstleister betrieben (z.&nbsp;B. Render oder vergleichbare Anbieter). Diese verarbeiten Daten ausschliesslich im Rahmen der technischen Bereitstellung der Anwendung.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>8. Rechtsgrundlagen</h2>
            <p style={{ margin: "0 0 8px" }}>
              Die Verarbeitung erfolgt gemäss Art. 6 DSGVO:
            </p>
            <ul style={{ margin: "0 0 20px", paddingLeft: 20 }}>
              <li>Art. 6 Abs. 1 lit. b DSGVO (Vertrag / Nutzung der Software)</li>
              <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an stabiler Bereitstellung)</li>
            </ul>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>9. Weitergabe von Daten</h2>
            <p style={{ margin: "0 0 20px" }}>
              Eine Weitergabe von Daten erfolgt nur an technisch notwendige Dienstleister und im Rahmen der Nutzung externer Systeme (z.&nbsp;B. KI-Dienste). Eine darüber hinausgehende Weitergabe erfolgt nicht.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>10. Cookies</h2>
            <p style={{ margin: "0 0 20px" }}>
              Die Anwendung kann technisch notwendige Cookies verwenden, um Sitzungen zu verwalten und die Nutzung der Anwendung zu ermöglichen. Es werden keine Cookies zu Marketingzwecken eingesetzt.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>11. Rechte der Nutzer</h2>
            <p style={{ margin: "0 0 8px" }}>
              Nutzer haben das Recht auf:
            </p>
            <ul style={{ margin: "0 0 20px", paddingLeft: 20 }}>
              <li>Auskunft</li>
              <li>Berichtigung</li>
              <li>Löschung</li>
              <li>Einschränkung der Verarbeitung</li>
              <li>Widerspruch</li>
            </ul>
            <p style={{ margin: "0 0 20px" }}>
              Zur Ausübung dieser Rechte wenden Sie sich bitte an: info@foresmind.de
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>12. Einordnungshinweis</h2>
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
