import { ArrowLeft } from "lucide-react";
import logoPath from "@assets/Logo_bioLogic_1774652440525.gif";
import { useLocalizedText, useRegion } from "@/lib/region";

export default function Datenschutz() {
  const t = useLocalizedText();
  const { region } = useRegion();
  const en = region === "EN";
  const fr = region === "FR";
  const it = region === "IT";
  const isIntl = en || fr || it;

  const header = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
      <img src={logoPath} alt="bioLogic" style={{ height: 48, objectFit: "contain", marginBottom: 10 }} data-testid="img-datenschutz-logo" />
      <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, transparent, #D1D5DB, transparent)", marginBottom: 10 }} />
      <span style={{ fontSize: 14, fontWeight: 500, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>HR Talents</span>
    </div>
  );

  return (
    <div className="page-gradient-bg" style={{ fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => window.history.back()}
            data-testid="button-back-datenschutz"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            {en ? "Back" : fr ? "Retour" : it ? "Indietro" : t("Zurück")}
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
          {header}

          {isIntl ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-datenschutz-title">
                {fr ? "Politique de confidentialité" : it ? "Informativa sulla privacy" : "Privacy Policy"}
              </h1>

              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>1. Controller</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The controller responsible for data processing within the meaning of the General Data Protection Regulation (GDPR) is:<br /><br />
                  foresMind® GmbH<br />
                  Sonnenhang 4<br />
                  87674 Ruderatshofen<br />
                  Germany<br />
                  Email: info@foresmind.de<br />
                  Phone: +49 (0)8343 / 338 998 – 1
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>2. General Information</h2>
                <p style={{ margin: "0 0 20px" }}>
                  This software is used for analysing working styles, role requirements, and team constellations. The evaluations do not constitute automated decision-making within the meaning of Art. 22 GDPR and have no legal effect on the persons concerned. The results serve exclusively as a supporting basis for decisions. No profiling within the meaning of the GDPR takes place.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>3. Types of Data Processed</h2>
                <p style={{ margin: "0 0 8px" }}>
                  During use, the following data may be processed:
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li>Login data (username, password in hashed form)</li>
                  <li>Role inputs (e.g. tasks, requirements)</li>
                  <li>Person inputs (e.g. assessments of working styles)</li>
                  <li>System-generated analysis results</li>
                  <li>Technical access data (IP address, browser type, access time)</li>
                </ul>
                <p style={{ margin: "0 0 20px" }}>
                  Analysis inputs and results are not permanently stored on a personal basis unless the user explicitly saves them.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>4. No Permanent Storage of Analysis Data</h2>
                <p style={{ margin: "0 0 20px" }}>
                  Analysis inputs and results are generally processed temporarily (session-based) without permanent storage of personal data. The provider does not identify individual persons based on analysis data.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>5. SSL/TLS Encryption</h2>
                <p style={{ margin: "0 0 20px" }}>
                  For security reasons and to protect the transmission of confidential content, this application uses SSL or TLS encryption. You can recognise an encrypted connection by the fact that the address bar of the browser changes from "http://" to "https://" and by the lock symbol in your browser bar.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>6. Server Log Files</h2>
                <p style={{ margin: "0 0 8px" }}>
                  The hosting provider automatically collects and stores information in so-called server log files, which your browser automatically transmits to us. These are:
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li>Browser type and browser version</li>
                  <li>Operating system used</li>
                  <li>Referrer URL</li>
                  <li>Hostname of the accessing computer</li>
                  <li>Time of the server request</li>
                  <li>IP address</li>
                </ul>
                <p style={{ margin: "0 0 20px" }}>
                  This data is not merged with other data sources. The basis for data processing is Art. 6 para. 1 lit. f GDPR (legitimate interest in technically error-free presentation and optimisation).
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>7. Use of the Software (SaaS)</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The application is designed as Software-as-a-Service (SaaS) and is used independently by customers. Responsibility for entering personal data lies with the respective user or the company using the software. Where the customer uses the software to process personal data of third parties (e.g. employees, applicants), the customer is themselves the data controller responsible for this processing under data protection law.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>8. Use of Artificial Intelligence</h2>
                <p style={{ margin: "0 0 8px" }}>
                  External AI provider services are used to generate evaluations, recommendations, and AI-supported coaching responses. The application uses two providers with clearly separated areas of responsibility:
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li><strong>OpenAI (OpenAI, L.L.C., San Francisco, USA)</strong> – for generating role analyses (Rollen-DNA), comparison reports (MatchCheck), team dynamics evaluations, competency analyses, candidate profiles, and AI-generated images.</li>
                  <li><strong>Anthropic (Anthropic, PBC, San Francisco, USA)</strong> – for the AI coach "Louis", which conducts coaching conversations on leadership, recruiting, team dynamics, and communication.</li>
                </ul>
                <p style={{ margin: "0 0 8px" }}>
                  For both providers the following applies:
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li>No independent profiling takes place by the respective provider</li>
                  <li>Processing serves exclusively to create text suggestions, analyses and coaching responses</li>
                  <li>No automated decisions within the meaning of Art. 22 GDPR are made</li>
                  <li>The transmitted data is not used to train AI models in accordance with the respective providers' terms of use (API usage)</li>
                </ul>
                <p style={{ margin: "0 0 20px" }}>
                  Through the use of both APIs, a transfer of data to the USA may occur (see section "Data Transfer to Third Countries").
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>9. Data Transfer to Third Countries</h2>
                <p style={{ margin: "0 0 20px" }}>
                  Through the use of OpenAI, Anthropic, and where applicable the hosting provider, personal data may be transferred to the USA or other third countries. The transfer is made on the basis of Art. 49 para. 1 lit. a GDPR (consent through use) or Art. 49 para. 1 lit. b GDPR (contract performance) and, where available, on the basis of the EU-US Data Privacy Framework or comparable guarantees (e.g. standard contractual clauses pursuant to Art. 46 para. 2 lit. c GDPR).
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>10. Hosting</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The software is operated via external hosting service providers (e.g. Render, San Francisco, USA, or comparable providers). These process data exclusively within the scope of technically providing the application and act as processors within the meaning of Art. 28 GDPR.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>11. Legal Bases</h2>
                <p style={{ margin: "0 0 8px" }}>
                  The processing of personal data is carried out on the following legal bases:
                </p>
                <ul style={{ margin: "0 0 20px", paddingLeft: 20 }}>
                  <li>Art. 6 para. 1 lit. a GDPR (consent – where given)</li>
                  <li>Art. 6 para. 1 lit. b GDPR (contract performance / use of the software)</li>
                  <li>Art. 6 para. 1 lit. f GDPR (legitimate interest in stable provision and improvement of the application)</li>
                </ul>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>12. Disclosure of Data</h2>
                <p style={{ margin: "0 0 8px" }}>
                  Personal data is disclosed exclusively:
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li>to technically necessary service providers (hosting, AI processing)</li>
                  <li>where required by law or necessary for the enforcement of legal claims</li>
                </ul>
                <p style={{ margin: "0 0 20px" }}>
                  No further disclosure to third parties, in particular for advertising or marketing purposes, takes place.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>13. Cookies and Local Storage</h2>
                <p style={{ margin: "0 0 8px" }}>
                  The application uses only technically necessary cookies and local storage (localStorage) to manage sessions and enable the use of the application. No cookies for tracking, analytics, or marketing purposes are used. Consent is not required for technically necessary cookies pursuant to § 25 para. 2 TDDDG.
                </p>
                <p style={{ margin: "0 0 8px" }}>
                  The following data is stored in local storage:
                </p>
                <ul style={{ margin: "0 0 20px", paddingLeft: 20 }}>
                  <li>User settings (e.g. region selection) – permanently until manually changed</li>
                  <li>Intermediate states of ongoing workflows (e.g. role analysis, JobCheck, TeamCheck) – temporary, deleted when the respective process is reset or completed</li>
                  <li>Cached AI results (e.g. generated texts) – temporary, only for the current session</li>
                </ul>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>14. Retention Periods</h2>
                <p style={{ margin: "0 0 20px" }}>
                  Personal data is only stored for as long as necessary for the respective processing purpose or as required by statutory retention obligations. User accounts can be deleted at any time upon request. Analysis inputs and results are generally not stored permanently.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>15. Rights of Data Subjects</h2>
                <p style={{ margin: "0 0 8px" }}>
                  You have the following rights under the GDPR:
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li>Right of access (Art. 15 GDPR)</li>
                  <li>Right to rectification (Art. 16 GDPR)</li>
                  <li>Right to erasure (Art. 17 GDPR)</li>
                  <li>Right to restriction of processing (Art. 18 GDPR)</li>
                  <li>Right to data portability (Art. 20 GDPR)</li>
                  <li>Right to object (Art. 21 GDPR)</li>
                  <li>Right to withdraw consent (Art. 7 para. 3 GDPR)</li>
                </ul>
                <p style={{ margin: "0 0 20px" }}>
                  To exercise these rights, please contact: info@foresmind.de
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>16. Right to Lodge a Complaint with a Supervisory Authority</h2>
                <p style={{ margin: "0 0 20px" }}>
                  Without prejudice to any other administrative or judicial remedy, you have the right to lodge a complaint with a supervisory authority if you consider that the processing of your personal data infringes the GDPR. The competent supervisory authority is:<br /><br />
                  Bavarian State Office for Data Protection Supervision (BayLDA)<br />
                  Promenade 18<br />
                  91522 Ansbach<br />
                  <a href="https://www.lda.bayern.de" target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", textDecoration: "none" }}>www.lda.bayern.de</a>
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>17. Classification Note</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The analyses provided describe recurring patterns in a work context, are to be understood in a value-neutral way, and do not represent fixed personality profiles. They do not replace individual assessment or decisions but serve exclusively as orientation.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>18. Changes to this Privacy Policy</h2>
                <p style={{ margin: "0 0 20px" }}>
                  We reserve the right to adapt this privacy policy to keep it in line with current legal requirements or to reflect changes to our services. The current privacy policy will apply upon your next visit.
                </p>

                <p style={{ margin: "0 0 0", fontSize: 13, color: "#8E8E93" }}>
                  {fr ? "Mise à jour : avril 2026" : it ? "Aggiornato: aprile 2026" : "As of April 2026"} · © {new Date().getFullYear()} foresMind® GmbH.{" "}
                  {fr ? "Tous droits réservés." : it ? "Tutti i diritti riservati." : "All rights reserved."}
                </p>
              </div>
            </>
          ) : (
            <>
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
                  {t("Diese Software dient der Analyse von Arbeitsweisen, Rollenanforderungen und Teamkonstellationen. Die Auswertungen stellen keine automatisierten Entscheidungen im Sinne von Art. 22 DSGVO dar und entfalten keine rechtliche Wirkung gegenüber betroffenen Personen. Die Ergebnisse dienen ausschliesslich als unterstützende Entscheidungsgrundlage. Es findet kein Profiling im Sinne der DSGVO statt.")}
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
                  {t("Zur Generierung von Auswertungen, Empfehlungen und KI-gestützten Coaching-Antworten werden Dienste externer KI-Anbieter eingesetzt. Die Anwendung nutzt dabei zwei Anbieter mit klar getrennten Aufgabenbereichen:")}
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li><strong>OpenAI (OpenAI, L.L.C., San Francisco, USA)</strong>{t(" – für die Generierung von Rollenanalysen (Rollen-DNA), Vergleichsberichten (MatchCheck), Teamdynamik-Auswertungen, Kompetenzanalysen, Kandidatenprofilen sowie KI-generierten Bildern.")}</li>
                  <li><strong>Anthropic (Anthropic, PBC, San Francisco, USA)</strong>{t(" – für den KI-Coach «Louis», der Coaching-Gespräche zu Führung, Recruiting, Teamdynamik und Kommunikation führt.")}</li>
                </ul>
                <p style={{ margin: "0 0 8px" }}>
                  {t("Für beide Anbieter gilt:")}
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li>{t("Es erfolgt keine eigenständige Profilbildung durch den jeweiligen Anbieter")}</li>
                  <li>{t("Die Verarbeitung dient ausschliesslich der Erstellung von Textvorschlägen, Analysen und Coaching-Antworten")}</li>
                  <li>{t("Es werden keine automatisierten Entscheidungen im Sinne von Art. 22 DSGVO getroffen")}</li>
                  <li>{t("Die übermittelten Daten werden gemäss den jeweiligen Nutzungsbedingungen der Anbieter nicht zum Training von KI-Modellen verwendet (API-Nutzung)")}</li>
                </ul>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Durch die Nutzung beider APIs kann eine Datenübermittlung in die USA erfolgen (siehe Abschnitt «Datenübermittlung in Drittländer»).")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("9. Datenübermittlung in Drittländer")}</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Durch den Einsatz von OpenAI, Anthropic und ggf. des Hosting-Anbieters kann eine Übermittlung personenbezogener Daten in die USA oder andere Drittländer erfolgen. Die Übermittlung erfolgt auf Grundlage von Art. 49 Abs. 1 lit. a DSGVO (Einwilligung durch Nutzung) bzw. Art. 49 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie, soweit vorhanden, auf Grundlage des EU-US Data Privacy Framework oder vergleichbarer Garantien (z.\u00A0B. Standardvertragsklauseln gemäss Art. 46 Abs. 2 lit. c DSGVO).")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>10. Hosting</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Die Software wird über externe Hosting-Dienstleister betrieben (z.\u00A0B. Render, San Francisco, USA, oder vergleichbare Anbieter). Diese verarbeiten Daten ausschliesslich im Rahmen der technischen Bereitstellung der Anwendung und handeln als Auftragsverarbeiter im Sinne von Art. 28 DSGVO.")}
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
                  {t("Eine Weitergabe personenbezogener Daten erfolgt ausschliesslich:")}
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li>{t("an technisch notwendige Dienstleister (Hosting, KI-Verarbeitung)")}</li>
                  <li>{t("soweit gesetzlich vorgeschrieben oder zur Rechtsdurchsetzung erforderlich")}</li>
                </ul>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Eine darüber hinausgehende Weitergabe an Dritte, insbesondere zu Werbe- oder Marketingzwecken, erfolgt nicht.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>13. Cookies und lokaler Speicher</h2>
                <p style={{ margin: "0 0 8px" }}>
                  {t("Die Anwendung verwendet ausschliesslich technisch notwendige Cookies und lokalen Speicher (localStorage), um Sitzungen zu verwalten und die Nutzung der Anwendung zu ermöglichen. Es werden keine Cookies zu Tracking-, Analyse- oder Marketingzwecken eingesetzt. Eine Einwilligung ist für technisch notwendige Cookies gemäss § 25 Abs. 2 TDDDG nicht erforderlich.")}
                </p>
                <p style={{ margin: "0 0 8px" }}>
                  {t("Im lokalen Speicher werden folgende Daten abgelegt:")}
                </p>
                <ul style={{ margin: "0 0 20px", paddingLeft: 20 }}>
                  <li>{t("Benutzereinstellungen (z.\u00A0B. Regionauswahl) – dauerhaft bis zur manuellen Änderung")}</li>
                  <li>{t("Zwischenstände laufender Arbeitsabläufe (z.\u00A0B. Rollenanalyse, JobCheck, TeamCheck) – temporär, werden beim Zurücksetzen oder Abschluss des jeweiligen Vorgangs gelöscht")}</li>
                  <li>{t("Zwischengespeicherte KI-Ergebnisse (z.\u00A0B. generierte Texte) – temporär, nur für die aktuelle Sitzung")}</li>
                </ul>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>14. Aufbewahrungsfristen</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Personenbezogene Daten werden nur so lange gespeichert, wie dies für den jeweiligen Verarbeitungszweck erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen. Benutzerkonten können auf Anfrage jederzeit gelöscht werden. Analyse-Eingaben und -Ergebnisse werden in der Regel nicht dauerhaft gespeichert.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("15. Rechte der betroffenen Personen")}</h2>
                <p style={{ margin: "0 0 8px" }}>
                  {t("Sie haben gemäss DSGVO folgende Rechte:")}
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
                  {t("Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde bei einer Aufsichtsbehörde zu, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstösst. Die zuständige Aufsichtsbehörde ist:")}<br /><br />
                  {t("Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)")}<br />
                  Promenade 18<br />
                  91522 Ansbach<br />
                  <a href="https://www.lda.bayern.de" target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", textDecoration: "none" }}>www.lda.bayern.de</a>
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>17. Einordnungshinweis</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Die bereitgestellten Analysen beschreiben wiederkehrende Muster im Arbeitskontext, sind wertfrei zu verstehen und stellen keine festen Persönlichkeitsprofile dar. Sie ersetzen keine individuelle Bewertung oder Entscheidung, sondern dienen ausschliesslich als Orientierung.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("18. Änderung dieser Datenschutzerklärung")}</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie stets den aktuellen rechtlichen Anforderungen anzupassen oder Änderungen unserer Leistungen umzusetzen. Für Ihren erneuten Besuch gilt dann die jeweils aktuelle Datenschutzerklärung.")}
                </p>

                <p style={{ margin: "0 0 0", fontSize: 13, color: "#8E8E93" }}>
                  {t("Stand: April 2026 · © ")} {new Date().getFullYear()} foresMind® GmbH. Alle Rechte vorbehalten.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
