import { ArrowLeft } from "lucide-react";
import logoPath from "@assets/Logo_bioLogic_1774652440525.gif";
import { useLocalizedText, useRegion } from "@/lib/region";

export default function Impressum() {
  const t = useLocalizedText();
  const { region } = useRegion();
  const en = region === "EN";
  const fr = region === "FR";
  const it = region === "IT";
  const isIntl = en || fr || it;

  const header = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
      <img src={logoPath} alt="bioLogic" style={{ height: 48, objectFit: "contain", marginBottom: 10 }} data-testid="img-impressum-logo" />
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
            data-testid="button-back-impressum"
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
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-impressum-title">
                {fr ? "Mentions légales" : it ? "Note legali" : "Legal Notice"}
              </h1>

              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Information according to § 5 TMG</h2>
                <p style={{ margin: "0 0 20px" }}>
                  foresMind® GmbH<br />
                  Sonnenhang 4<br />
                  87674 Ruderatshofen<br />
                  Germany
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Represented by the Managing Directors</h2>
                <p style={{ margin: "0 0 20px" }}>
                  Alexander Richter, Wolfgang Drexler
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Contact</h2>
                <p style={{ margin: "0 0 20px" }}>
                  Phone: +49 (0)8343 / 338 998 – 1<br />
                  Email: info@foresmind.de
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Commercial Register</h2>
                <p style={{ margin: "0 0 20px" }}>
                  Registered in the commercial register<br />
                  Registry court: Amtsgericht Kempten<br />
                  Registration number: HRB 13751
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>VAT Identification Number</h2>
                <p style={{ margin: "0 0 20px" }}>
                  VAT identification number in accordance with § 27 a of the German VAT Act:<br />
                  DE292672216
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Responsible for content pursuant to § 55 para. 2 RStV</h2>
                <p style={{ margin: "0 0 20px" }}>
                  Alexander Richter<br />
                  foresMind® GmbH<br />
                  Sonnenhang 4<br />
                  87674 Ruderatshofen
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Liability for Content</h2>
                <p style={{ margin: "0 0 20px" }}>
                  As a service provider, we are responsible for our own content on these pages in accordance with § 7 para. 1 TMG under the general laws. According to §§ 8 to 10 TMG, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity. Obligations to remove or block the use of information under general laws remain unaffected. Liability in this regard is only possible from the time of knowledge of a specific legal violation. Upon becoming aware of any such infringements, we will remove this content immediately.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Liability for Links</h2>
                <p style={{ margin: "0 0 20px" }}>
                  Our offer contains links to external websites of third parties, on whose contents we have no influence. Therefore, we cannot assume any liability for these external contents. The respective provider or operator of the pages is always responsible for the contents of the linked pages. The linked pages were checked for possible legal violations at the time of linking. Illegal contents were not recognisable at the time of linking. A permanent content control of the linked pages is not reasonable without concrete evidence of a violation of law. Upon becoming aware of legal infringements, we will remove such links immediately.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Copyright</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The content and works created by the site operators on these pages are subject to German copyright law. The reproduction, editing, distribution and any kind of use outside the limits of copyright law require the written consent of the respective author or creator. Downloads and copies of this site are only permitted for private, non-commercial use. Where the content on this site was not created by the operator, the copyrights of third parties are respected. If you nevertheless become aware of a copyright infringement, please notify us accordingly. Upon becoming aware of legal infringements, we will remove such content immediately.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Trademark Law</h2>
                <p style={{ margin: "0 0 20px" }}>
                  bioLogic® and foresMind® are registered trademarks of foresMind® GmbH. Use of these trademarks without express written permission is prohibited.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>EU Dispute Resolution</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The European Commission provides a platform for online dispute resolution (ODR):{" "}
                  <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", textDecoration: "none" }}>https://ec.europa.eu/consumers/odr/</a>.
                  {" "}Our email address can be found above in this legal notice. We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.
                </p>

                <p style={{ margin: "0 0 0", fontSize: 13, color: "#8E8E93" }}>
                  © {new Date().getFullYear()} foresMind® GmbH.{" "}
                  {fr ? "Tous droits réservés." : it ? "Tutti i diritti riservati." : "All rights reserved."}
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-impressum-title">Impressum</h1>

              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("Angaben gemäss § 5 TMG")}</h2>
                <p style={{ margin: "0 0 20px" }}>
                  foresMind® GmbH<br />
                  Sonnenhang 4<br />
                  87674 Ruderatshofen<br />
                  Deutschland
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("Vertreten durch die Geschäftsführer")}</h2>
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
                  {t("Umsatzsteuer-Identifikationsnummer gemäss § 27 a Umsatzsteuergesetz:")}<br />
                  DE292672216
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV")}</h2>
                <p style={{ margin: "0 0 20px" }}>
                  Alexander Richter<br />
                  foresMind® GmbH<br />
                  Sonnenhang 4<br />
                  87674 Ruderatshofen
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("Haftung für Inhalte")}</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Als Diensteanbieter sind wir gemäss § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("Haftung für Links")}</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstösse überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Urheberrecht</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung ausserhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Markenrecht</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("bioLogic® und foresMind® sind eingetragene Marken der foresMind® GmbH. Die Nutzung dieser Marken ohne ausdrückliche schriftliche Genehmigung ist untersagt.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>EU-Streitbeilegung</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: ")}{" "}
                  <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", textDecoration: "none" }}>https://ec.europa.eu/consumers/odr/</a>.
                  {" "}{t("Unsere E-Mail-Adresse finden Sie oben im Impressum. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.")}
                </p>

                <p style={{ margin: "0 0 0", fontSize: 13, color: "#8E8E93" }}>
                  © {new Date().getFullYear()} foresMind® GmbH. Alle Rechte vorbehalten.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
