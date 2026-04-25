import { ArrowLeft } from "lucide-react";
import logoPath from "@assets/Logo_bioLogic_1774652440525.gif";
import { useLocalizedText, useRegion } from "@/lib/region";
import { useUI } from "@/lib/ui-texts";

export default function Impressum() {
  const t = useLocalizedText();
  const ui = useUI();
  const { region } = useRegion();
  const en = region === "EN";
  const fr = region === "FR";
  const it = region === "IT";

  const header = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
      <img src={logoPath} alt="bioLogic" style={{ height: 48, objectFit: "contain", marginBottom: 10 }} data-testid="img-impressum-logo" />
      <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, transparent, #D1D5DB, transparent)", marginBottom: 10 }} />
      <span style={{ fontSize: 14, fontWeight: 500, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>HR Talents</span>
    </div>
  );

  const h2Style: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" };
  const pStyle: React.CSSProperties = { margin: "0 0 20px" };

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
            {ui.general.back}
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
          {header}

          {en ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-impressum-title">Legal Notice</h1>
              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
                <h2 style={h2Style}>Information according to § 5 TMG</h2>
                <p style={pStyle}>foresMind® GmbH<br />Sonnenhang 4<br />87674 Ruderatshofen<br />Germany</p>
                <h2 style={h2Style}>Represented by the Managing Directors</h2>
                <p style={pStyle}>Wolfgang Drexler</p>
                <h2 style={h2Style}>Contact</h2>
                <p style={pStyle}>Phone: +49 (0)8343 / 338 998 – 1<br />Email: info@foresmind.de</p>
                <h2 style={h2Style}>Commercial Register</h2>
                <p style={pStyle}>Registered in the commercial register<br />Registry court: Amtsgericht Kempten<br />Registration number: HRB 13751</p>
                <h2 style={h2Style}>VAT Identification Number</h2>
                <p style={pStyle}>VAT identification number in accordance with § 27 a of the German VAT Act:<br />DE292672216</p>
                <h2 style={h2Style}>Responsible for content pursuant to § 55 para. 2 RStV</h2>
                <p style={pStyle}>foresMind® GmbH<br />Sonnenhang 4<br />87674 Ruderatshofen</p>
                <h2 style={h2Style}>Liability for Content</h2>
                <p style={pStyle}>As a service provider, we are responsible for our own content on these pages in accordance with § 7 para. 1 TMG under the general laws. According to §§ 8 to 10 TMG, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity. Obligations to remove or block the use of information under general laws remain unaffected. Liability in this regard is only possible from the time of knowledge of a specific legal violation. Upon becoming aware of any such infringements, we will remove this content immediately.</p>
                <h2 style={h2Style}>Liability for Links</h2>
                <p style={pStyle}>Our offer contains links to external websites of third parties, on whose contents we have no influence. Therefore, we cannot assume any liability for these external contents. The respective provider or operator of the pages is always responsible for the contents of the linked pages. The linked pages were checked for possible legal violations at the time of linking. Illegal contents were not recognisable at the time of linking. A permanent content control of the linked pages is not reasonable without concrete evidence of a violation of law. Upon becoming aware of legal infringements, we will remove such links immediately.</p>
                <h2 style={h2Style}>Copyright</h2>
                <p style={pStyle}>The content and works created by the site operators on these pages are subject to German copyright law. The reproduction, editing, distribution and any kind of use outside the limits of copyright law require the written consent of the respective author or creator. Downloads and copies of this site are only permitted for private, non-commercial use. Where the content on this site was not created by the operator, the copyrights of third parties are respected. If you nevertheless become aware of a copyright infringement, please notify us accordingly. Upon becoming aware of legal infringements, we will remove such content immediately.</p>
                <h2 style={h2Style}>Trademark Law</h2>
                <p style={pStyle}>bioLogic® and foresMind® are registered trademarks of foresMind® GmbH. Use of these trademarks without express written permission is prohibited.</p>
                <h2 style={h2Style}>EU Dispute Resolution</h2>
                <p style={pStyle}>The European Commission provides a platform for online dispute resolution (ODR):{" "}<a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", textDecoration: "none" }}>https://ec.europa.eu/consumers/odr/</a>. Our email address can be found above in this legal notice. We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>
                <p style={{ margin: 0, fontSize: 13, color: "#8E8E93" }}>© {new Date().getFullYear()} foresMind® GmbH. All rights reserved.</p>
              </div>
            </>
          ) : fr ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-impressum-title">Mentions légales</h1>
              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
                <h2 style={h2Style}>Informations conformément à l'article 5 TMG</h2>
                <p style={pStyle}>foresMind® GmbH<br />Sonnenhang 4<br />87674 Ruderatshofen<br />Allemagne</p>
                <h2 style={h2Style}>Représenté par les gérants</h2>
                <p style={pStyle}>Wolfgang Drexler</p>
                <h2 style={h2Style}>Contact</h2>
                <p style={pStyle}>Téléphone : +49 (0)8343 / 338 998 – 1<br />E-mail : info@foresmind.de</p>
                <h2 style={h2Style}>Registre du commerce</h2>
                <p style={pStyle}>Inscription au registre du commerce<br />Tribunal d'enregistrement : Amtsgericht Kempten<br />Numéro d'enregistrement : HRB 13751</p>
                <h2 style={h2Style}>Numéro d'identification TVA</h2>
                <p style={pStyle}>Numéro d'identification TVA conformément à l'article 27 a de la loi allemande sur la TVA :<br />DE292672216</p>
                <h2 style={h2Style}>Responsable du contenu conformément à l'article 55 al. 2 RStV</h2>
                <p style={pStyle}>foresMind® GmbH<br />Sonnenhang 4<br />87674 Ruderatshofen</p>
                <h2 style={h2Style}>Responsabilité pour le contenu</h2>
                <p style={pStyle}>En tant que prestataire de services, nous sommes responsables de nos propres contenus sur ces pages conformément à l'article 7 al. 1 TMG selon les lois générales. Conformément aux articles 8 à 10 TMG, nous ne sommes pas tenus de surveiller les informations transmises ou stockées par des tiers ni de rechercher des circonstances indiquant une activité illégale. Les obligations de supprimer ou de bloquer l'utilisation d'informations en vertu des lois générales restent inaffectées. Une responsabilité n'est possible qu'à partir du moment où la connaissance d'une violation légale spécifique existe. Dès que nous en aurons connaissance, nous supprimerons immédiatement ces contenus.</p>
                <h2 style={h2Style}>Responsabilité pour les liens</h2>
                <p style={pStyle}>Notre offre contient des liens vers des sites web externes de tiers sur lesquels nous n'avons aucune influence. Nous ne pouvons donc pas assumer de responsabilité pour ces contenus. Le prestataire respectif des pages liées est toujours responsable de leur contenu. Les pages liées ont été vérifiées pour d'éventuelles violations légales au moment de la mise en lien. Aucun contenu illégal n'était reconnaissable à ce moment. Un contrôle permanent du contenu des pages liées n'est pas raisonnable sans preuves concrètes d'une violation. Dès que nous en aurons connaissance, nous supprimerons immédiatement ces liens.</p>
                <h2 style={h2Style}>Droit d'auteur</h2>
                <p style={pStyle}>Les contenus et œuvres créés par les exploitants du site sur ces pages sont soumis au droit d'auteur allemand. La reproduction, l'édition, la distribution et toute forme d'exploitation en dehors des limites du droit d'auteur nécessitent le consentement écrit de l'auteur respectif. Les téléchargements et copies de ce site ne sont autorisés que pour un usage privé et non commercial. Dans la mesure où les contenus de ce site n'ont pas été créés par l'exploitant, les droits d'auteur de tiers sont respectés. Si vous prenez connaissance d'une violation, veuillez nous en informer. Dès que nous en aurons connaissance, nous supprimerons immédiatement ces contenus.</p>
                <h2 style={h2Style}>Droit des marques</h2>
                <p style={pStyle}>bioLogic® et foresMind® sont des marques déposées de foresMind® GmbH. L'utilisation de ces marques sans autorisation écrite expresse est interdite.</p>
                <h2 style={h2Style}>Règlement des litiges en ligne (UE)</h2>
                <p style={pStyle}>La Commission européenne met à disposition une plateforme de règlement des litiges en ligne (RLL) :{" "}<a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", textDecoration: "none" }}>https://ec.europa.eu/consumers/odr/</a>. Notre adresse e-mail figure ci-dessus dans les mentions légales. Nous ne sommes pas disposés ni obligés de participer à des procédures de règlement des litiges devant un organe d'arbitrage des consommateurs.</p>
                <p style={{ margin: 0, fontSize: 13, color: "#8E8E93" }}>© {new Date().getFullYear()} foresMind® GmbH. Tous droits réservés.</p>
              </div>
            </>
          ) : it ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-impressum-title">Note legali</h1>
              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
                <h2 style={h2Style}>Informazioni ai sensi del § 5 TMG</h2>
                <p style={pStyle}>foresMind® GmbH<br />Sonnenhang 4<br />87674 Ruderatshofen<br />Germania</p>
                <h2 style={h2Style}>Rappresentato dai soci gerenti</h2>
                <p style={pStyle}>Wolfgang Drexler</p>
                <h2 style={h2Style}>Contatti</h2>
                <p style={pStyle}>Telefono: +49 (0)8343 / 338 998 – 1<br />E-mail: info@foresmind.de</p>
                <h2 style={h2Style}>Iscrizione al registro delle imprese</h2>
                <p style={pStyle}>Iscrizione al registro del commercio<br />Tribunale: Amtsgericht Kempten<br />Numero di iscrizione: HRB 13751</p>
                <h2 style={h2Style}>Partita IVA</h2>
                <p style={pStyle}>Numero di identificazione IVA ai sensi del § 27 a della legge tedesca sull'IVA:<br />DE292672216</p>
                <h2 style={h2Style}>Responsabile dei contenuti ai sensi del § 55 par. 2 RStV</h2>
                <p style={pStyle}>foresMind® GmbH<br />Sonnenhang 4<br />87674 Ruderatshofen</p>
                <h2 style={h2Style}>Responsabilità per i contenuti</h2>
                <p style={pStyle}>In qualità di fornitore di servizi, siamo responsabili dei nostri contenuti su queste pagine ai sensi del § 7 par. 1 TMG secondo le leggi generali. Ai sensi dei §§ 8–10 TMG non siamo obbligati a monitorare le informazioni trasmesse o memorizzate di terzi, né a cercare circostanze che indichino un'attività illegale. Gli obblighi di rimuovere o bloccare l'uso di informazioni ai sensi delle leggi generali rimangono impregiudicati. Una responsabilità è possibile solo dal momento in cui si ha conoscenza di una specifica violazione legale. Non appena venissimo a conoscenza di tali violazioni, rimuoveremo immediatamente questi contenuti.</p>
                <h2 style={h2Style}>Responsabilità per i link</h2>
                <p style={pStyle}>La nostra offerta contiene link a siti web esterni di terzi sui cui contenuti non abbiamo alcuna influenza. Pertanto non possiamo assumerci responsabilità per questi contenuti. Il rispettivo fornitore delle pagine collegate è sempre responsabile del loro contenuto. Le pagine collegate sono state verificate per eventuali violazioni legali al momento del collegamento. Nessun contenuto illegale era riconoscibile in quel momento. Un controllo permanente non è ragionevole senza prove concrete di una violazione. Non appena venissimo a conoscenza di violazioni legali, rimuoveremo immediatamente tali link.</p>
                <h2 style={h2Style}>Diritto d'autore</h2>
                <p style={pStyle}>I contenuti e le opere realizzati dagli operatori del sito su queste pagine sono soggetti al diritto d'autore tedesco. La riproduzione, l'elaborazione, la distribuzione e qualsiasi forma di utilizzo al di fuori dei limiti del diritto d'autore richiedono il consenso scritto del rispettivo autore. I download e le copie di questo sito sono consentiti solo per uso privato e non commerciale. Nella misura in cui i contenuti non sono stati creati dall'operatore, vengono rispettati i diritti d'autore di terzi. Se doveste venire a conoscenza di una violazione, vi preghiamo di comunicarcelo. Non appena ne venissimo a conoscenza, rimuoveremo immediatamente tali contenuti.</p>
                <h2 style={h2Style}>Diritto dei marchi</h2>
                <p style={pStyle}>bioLogic® e foresMind® sono marchi registrati di foresMind® GmbH. L'utilizzo di questi marchi senza esplicita autorizzazione scritta è vietato.</p>
                <h2 style={h2Style}>Risoluzione delle controversie online (UE)</h2>
                <p style={pStyle}>La Commissione europea mette a disposizione una piattaforma per la risoluzione online delle controversie (ODR):{" "}<a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", textDecoration: "none" }}>https://ec.europa.eu/consumers/odr/</a>. Il nostro indirizzo e-mail è indicato sopra nelle note legali. Non siamo disposti né obbligati a partecipare a procedure di risoluzione delle controversie davanti a un organo di conciliazione dei consumatori.</p>
                <p style={{ margin: 0, fontSize: 13, color: "#8E8E93" }}>© {new Date().getFullYear()} foresMind® GmbH. Tutti i diritti riservati.</p>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-impressum-title">Impressum</h1>

              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
                <h2 style={h2Style}>{t("Angaben gemäss § 5 TMG")}</h2>
                <p style={pStyle}>
                  foresMind® GmbH<br />
                  Sonnenhang 4<br />
                  87674 Ruderatshofen<br />
                  Deutschland
                </p>

                <h2 style={h2Style}>{t("Vertreten durch die Geschäftsführer")}</h2>
                <p style={pStyle}>Wolfgang Drexler</p>

                <h2 style={h2Style}>Kontakt</h2>
                <p style={pStyle}>
                  Telefon: +49 (0)8343 / 338 998 – 1<br />
                  E-Mail: info@foresmind.de
                </p>

                <h2 style={h2Style}>Registereintrag</h2>
                <p style={pStyle}>
                  Eintragung im Handelsregister<br />
                  Registergericht: Amtsgericht Kempten<br />
                  Registernummer: HRB 13751
                </p>

                <h2 style={h2Style}>Umsatzsteuer-ID</h2>
                <p style={pStyle}>
                  {t("Umsatzsteuer-Identifikationsnummer gemäss § 27 a Umsatzsteuergesetz:")}<br />
                  DE292672216
                </p>

                <h2 style={h2Style}>{t("Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV")}</h2>
                <p style={pStyle}>
                  foresMind® GmbH<br />
                  Sonnenhang 4<br />
                  87674 Ruderatshofen
                </p>

                <h2 style={h2Style}>{t("Haftung für Inhalte")}</h2>
                <p style={pStyle}>
                  {t("Als Diensteanbieter sind wir gemäss § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.")}
                </p>

                <h2 style={h2Style}>{t("Haftung für Links")}</h2>
                <p style={pStyle}>
                  {t("Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstösse überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.")}
                </p>

                <h2 style={h2Style}>Urheberrecht</h2>
                <p style={pStyle}>
                  {t("Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung ausserhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.")}
                </p>

                <h2 style={h2Style}>Markenrecht</h2>
                <p style={pStyle}>
                  {t("bioLogic® und foresMind® sind eingetragene Marken der foresMind® GmbH. Die Nutzung dieser Marken ohne ausdrückliche schriftliche Genehmigung ist untersagt.")}
                </p>

                <h2 style={h2Style}>EU-Streitbeilegung</h2>
                <p style={pStyle}>
                  {t("Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: ")}{" "}
                  <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", textDecoration: "none" }}>https://ec.europa.eu/consumers/odr/</a>.
                  {" "}{t("Unsere E-Mail-Adresse finden Sie oben im Impressum. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.")}
                </p>

                <p style={{ margin: 0, fontSize: 13, color: "#8E8E93" }}>
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
