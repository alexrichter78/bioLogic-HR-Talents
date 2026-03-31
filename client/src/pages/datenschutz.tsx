import { ArrowLeft } from "lucide-react";
import logoPath from "@assets/Logo_bioLogic_1774652440525.gif";
import { useLocalizedText } from "@/lib/region";

export default function Datenschutz() {
  const t = useLocalizedText();

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
            {t("Zurück")}
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
            <img src={logoPath} alt="bioLogic" style={{ height: 48, objectFit: "contain", marginBottom: 10 }} data-testid="img-datenschutz-logo" />
            <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, transparent, #D1D5DB, transparent)", marginBottom: 10 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>HR Talents</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-datenschutz-title">{t("Datenschutzerklärung")}</h1>

          <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>1. Verantwortlicher</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Verantwortlich für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:")}<br /><br />
              foresMind® GmbH<br />
              Sonnenhang 4<br />
              87674 Ruderatshofen<br />
              Deutschland<br />
              E-Mail: info@foresmind.de<br />
              Telefon: +49 (0)8343 / 338 998 – 1
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>2. Allgemeine Hinweise</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Diese Software dient der Analyse von Arbeitsweisen, Rollenanforderungen und Teamkonstellationen. Die Auswertungen stellen keine automatisierten Entscheidungen im Sinne von Art. 22 DSGVO dar und entfalten keine rechtliche Wirkung gegenüber betroffenen Personen. Die Ergebnisse dienen ausschließlich als unterstützende Entscheidungsgrundlage. Es findet kein Profiling im Sinne der DSGVO statt.")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>3. Art der verarbeiteten Daten</h2>
            <p style={{ margin: "0 0 8px" }}>
              {t("Im Rahmen der Nutzung können folgende Daten verarbeitet werden:")}
            </p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
              <li>{t("Anmeldedaten (Benutzername, Passwort in gehashter Form)")}</li>
              <li>{t("Eingaben zur Rolle (z.\u00A0B. Tätigkeiten, Anforderungen)")}</li>
              <li>{t("Eingaben zur Person (z.\u00A0B. Einschätzungen von Arbeitsweisen)")}</li>
              <li>{t("Systemgenerierte Analyse-Ergebnisse")}</li>
              <li>{t("Technische Zugriffsdaten (IP-Adresse, Browsertyp, Zugriffszeitpunkt)")}</li>
            </ul>
            <p style={{ margin: "0 0 20px" }}>
              {t("Analyse-Eingaben und -Ergebnisse werden nicht dauerhaft personenbezogen gespeichert, sofern keine explizite Speicherung durch den Nutzer erfolgt.")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>4. Keine dauerhafte Speicherung von Analysedaten</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Die Verarbeitung von Analyse-Eingaben und -Ergebnissen erfolgt in der Regel temporär (Session-basiert) ohne dauerhafte Speicherung personenbezogener Daten. Eine Identifizierung einzelner Personen anhand der Analysedaten durch den Anbieter erfolgt nicht.")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("5. SSL-/TLS-Verschlüsselung")}</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Diese Anwendung nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von «http://» auf «https://» wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>6. Server-Logfiles</h2>
            <p style={{ margin: "0 0 8px" }}>
              {t("Der Hosting-Provider erhebt und speichert automatisch Informationen in sogenannten Server-Logfiles, die Ihr Browser automatisch übermittelt. Dies sind:")}
            </p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
              <li>Browsertyp und Browserversion</li>
              <li>Verwendetes Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Hostname des zugreifenden Rechners</li>
              <li>Uhrzeit der Serveranfrage</li>
              <li>IP-Adresse</li>
            </ul>
            <p style={{ margin: "0 0 20px" }}>
              {t("Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Grundlage für die Datenverarbeitung ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der technisch fehlerfreien Darstellung und Optimierung).")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>7. Nutzung der Software (SaaS)</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Die Anwendung ist als Software-as-a-Service (SaaS) konzipiert und wird von Kunden eigenständig genutzt. Die Verantwortung für die Eingabe personenbezogener Daten liegt beim jeweiligen Nutzer bzw. dem Unternehmen, das die Software einsetzt. Soweit der Kunde die Software zur Verarbeitung personenbezogener Daten Dritter (z.\u00A0B. Mitarbeiter, Bewerber) verwendet, ist der Kunde selbst datenschutzrechtlich Verantwortlicher für diese Verarbeitung.")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("8. Einsatz von Künstlicher Intelligenz")}</h2>
            <p style={{ margin: "0 0 8px" }}>
              {t("Zur Generierung von Auswertungen und Empfehlungen wird künstliche Intelligenz eingesetzt, insbesondere Dienste von OpenAI (OpenAI, L.L.C., San Francisco, USA). Dabei gilt:")}
            </p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
              <li>{t("Es erfolgt keine eigenständige Profilbildung durch den Anbieter")}</li>
              <li>{t("Die Verarbeitung dient ausschließlich der Erstellung von Textvorschlägen und Analysen")}</li>
              <li>{t("Es werden keine automatisierten Entscheidungen im Sinne von Art. 22 DSGVO getroffen")}</li>
              <li>{t("Die an OpenAI übermittelten Daten werden gemäß der OpenAI-Nutzungsbedingungen nicht zum Training von KI-Modellen verwendet (API-Nutzung)")}</li>
            </ul>
            <p style={{ margin: "0 0 20px" }}>
              {t("Durch die Nutzung der OpenAI-API kann eine Datenübermittlung in die USA erfolgen (siehe Abschnitt «Datenübermittlung in Drittländer»).")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("9. Datenübermittlung in Drittländer")}</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Durch den Einsatz von OpenAI und ggf. des Hosting-Anbieters kann eine Übermittlung personenbezogener Daten in die USA oder andere Drittländer erfolgen. Die Übermittlung erfolgt auf Grundlage von Art. 49 Abs. 1 lit. a DSGVO (Einwilligung durch Nutzung) bzw. Art. 49 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie, soweit vorhanden, auf Grundlage des EU-US Data Privacy Framework oder vergleichbarer Garantien (z.\u00A0B. Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO).")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>10. Hosting</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Die Software wird über externe Hosting-Dienstleister betrieben (z.\u00A0B. Render, San Francisco, USA, oder vergleichbare Anbieter). Diese verarbeiten Daten ausschließlich im Rahmen der technischen Bereitstellung der Anwendung und handeln als Auftragsverarbeiter im Sinne von Art. 28 DSGVO.")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>11. Rechtsgrundlagen</h2>
            <p style={{ margin: "0 0 8px" }}>
              {t("Die Verarbeitung personenbezogener Daten erfolgt auf folgenden Rechtsgrundlagen:")}
            </p>
            <ul style={{ margin: "0 0 20px", paddingLeft: 20 }}>
              <li>{t("Art. 6 Abs. 1 lit. a DSGVO (Einwilligung – soweit erteilt)")}</li>
              <li>{t("Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung / Nutzung der Software)")}</li>
              <li>{t("Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an stabiler Bereitstellung und Verbesserung der Anwendung)")}</li>
            </ul>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>12. Weitergabe von Daten</h2>
            <p style={{ margin: "0 0 8px" }}>
              {t("Eine Weitergabe personenbezogener Daten erfolgt ausschließlich:")}
            </p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
              <li>{t("an technisch notwendige Dienstleister (Hosting, KI-Verarbeitung)")}</li>
              <li>{t("soweit gesetzlich vorgeschrieben oder zur Rechtsdurchsetzung erforderlich")}</li>
            </ul>
            <p style={{ margin: "0 0 20px" }}>
              {t("Eine darüber hinausgehende Weitergabe an Dritte, insbesondere zu Werbe- oder Marketingzwecken, erfolgt nicht.")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>13. Cookies und lokaler Speicher</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Die Anwendung verwendet ausschließlich technisch notwendige Cookies und lokalen Speicher (localStorage), um Sitzungen zu verwalten, Benutzereinstellungen (z.\u00A0B. Regionauswahl) zu speichern und die Nutzung der Anwendung zu ermöglichen. Es werden keine Cookies zu Tracking-, Analyse- oder Marketingzwecken eingesetzt. Eine Einwilligung ist für technisch notwendige Cookies gemäß § 25 Abs. 2 TDDDG nicht erforderlich.")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>14. Aufbewahrungsfristen</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Personenbezogene Daten werden nur so lange gespeichert, wie dies für den jeweiligen Verarbeitungszweck erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen. Benutzerkonten können auf Anfrage jederzeit gelöscht werden. Analyse-Eingaben und -Ergebnisse werden in der Regel nicht dauerhaft gespeichert.")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("15. Rechte der betroffenen Personen")}</h2>
            <p style={{ margin: "0 0 8px" }}>
              {t("Sie haben gemäß DSGVO folgende Rechte:")}
            </p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
              <li>{t("Recht auf Auskunft (Art. 15 DSGVO)")}</li>
              <li>{t("Recht auf Berichtigung (Art. 16 DSGVO)")}</li>
              <li>{t("Recht auf Löschung (Art. 17 DSGVO)")}</li>
              <li>{t("Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)")}</li>
              <li>{t("Recht auf Datenübertragbarkeit (Art. 20 DSGVO)")}</li>
              <li>{t("Widerspruchsrecht (Art. 21 DSGVO)")}</li>
              <li>{t("Recht auf Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)")}</li>
            </ul>
            <p style={{ margin: "0 0 20px" }}>
              {t("Zur Ausübung dieser Rechte wenden Sie sich bitte an: info@foresmind.de")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("16. Beschwerderecht bei der Aufsichtsbehörde")}</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde bei einer Aufsichtsbehörde zu, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt. Die zuständige Aufsichtsbehörde ist:")}<br /><br />
              {t("Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)")}<br />
              Promenade 18<br />
              91522 Ansbach<br />
              <a href="https://www.lda.bayern.de" target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", textDecoration: "none" }}>www.lda.bayern.de</a>
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>17. Einordnungshinweis</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Die bereitgestellten Analysen beschreiben wiederkehrende Muster im Arbeitskontext, sind wertfrei zu verstehen und stellen keine festen Persönlichkeitsprofile dar. Sie ersetzen keine individuelle Bewertung oder Entscheidung, sondern dienen ausschließlich als Orientierung.")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("18. Änderung dieser Datenschutzerklärung")}</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie stets den aktuellen rechtlichen Anforderungen anzupassen oder Änderungen unserer Leistungen umzusetzen. Für Ihren erneuten Besuch gilt dann die jeweils aktuelle Datenschutzerklärung.")}
            </p>

            <p style={{ margin: "0 0 0", fontSize: 13, color: "#8E8E93" }}>
              {t("Stand: März 2026 · © ")} {new Date().getFullYear()} foresMind® GmbH. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
