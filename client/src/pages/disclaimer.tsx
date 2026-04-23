import { ArrowLeft } from "lucide-react";
import logoPath from "@assets/Logo_bioLogic_1774652440525.gif";
import { useLocalizedText, useRegion } from "@/lib/region";

export default function Disclaimer() {
  const t = useLocalizedText();
  const { region } = useRegion();
  const en = region === "EN";
  const fr = region === "FR";
  const it = region === "IT";

  const header = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
      <img src={logoPath} alt="bioLogic" style={{ height: 48, objectFit: "contain", marginBottom: 10 }} data-testid="img-disclaimer-logo" />
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
            data-testid="button-back-disclaimer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            {en ? "Back" : fr ? "Retour" : it ? "Indietro" : t("Zurück")}
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
          {header}

          {en ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-disclaimer-title">Disclaimer / Legal Notice</h1>
              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
                <h2 style={h2Style}>1. No Individual Advice</h2>
                <p style={pStyle}>The contents and evaluations of this software serve exclusively as general, abstract orientation and do not constitute an individual assessment of any person, nor do they represent legal, HR-related, psychological, medical, or any other professional advice. They do not constitute a binding statement regarding the suitability, performance, behaviour, personality, development potential, or future effectiveness of any specific individual.</p>
                <h2 style={h2Style}>2. Typified Structural Models</h2>
                <p style={pStyle}>The content presented describes exclusively general, typified, and value-neutral structural and tendency models. It does not replace independent examination of individual cases nor an appropriate consideration of all circumstances relevant in a specific decision-making context.</p>
                <h2 style={h2Style}>3. Exclusion as Sole Basis for Decisions</h2>
                <p style={pStyle}>The use of the contents as the sole basis for personnel, economic, organisational, legal, or other decisions is expressly excluded. Any application to specific individuals, employees, applicants, or other individual cases is the sole responsibility of the respective user.</p>
                <h2 style={h2Style}>4. No Warranty and Limitation of Liability</h2>
                <p style={pStyle}>The provider does not warrant that the contents are suitable, complete, or conclusive for any particular individual case. Liability for decisions, measures, or consequential effects based on a specific application, transfer, or interpretation of the contents provided is excluded to the extent permitted by law.</p>
                <h2 style={h2Style}>5. Note on AI-Supported Evaluation</h2>
                <p style={pStyle}>The evaluations are created using artificial intelligence. Despite careful modelling, AI-generated content may contain inaccuracies, generalisations, or context-inappropriate formulations. The provider assumes no liability for the accuracy, completeness, or appropriateness of AI-generated texts. Critical review by the user is required in all cases.</p>
                <h2 style={h2Style}>6. No Employment Law or Diagnostic Basis</h2>
                <p style={pStyle}>The results of this software do not constitute psychological diagnostics, an employment-law-admissible expert opinion, or an assessment of aptitude within the meaning of the AGG (German General Equal Treatment Act) or comparable regulations. They may not be used as the basis for hiring, termination, or promotion decisions that must withstand legal scrutiny.</p>
                <h2 style={h2Style}>7. User Responsibility</h2>
                <p style={pStyle}>The user is responsible for placing the results in their respective context appropriately and, where necessary, seeking qualified professional advice. The use of the software does not replace the professional, legal, or ethical due diligence obligations of the user.</p>
                <h2 style={h2Style}>8. No Discrimination</h2>
                <p style={pStyle}>The software is designed not to make discriminatory statements. The analysis refers exclusively to abstract working styles and role patterns. Characteristics such as gender, age, origin, religion, disability, or sexual orientation do not factor into the evaluation and may not be derived from the results.</p>
                <p style={{ margin: "24px 0 0", fontSize: 13, color: "#8E8E93" }}>© {new Date().getFullYear()} foresMind® GmbH. All rights reserved.</p>
              </div>
            </>
          ) : fr ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-disclaimer-title">Avertissement / Mentions légales</h1>
              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
                <h2 style={h2Style}>1. Absence de conseil individuel</h2>
                <p style={pStyle}>Les contenus et évaluations de ce logiciel servent exclusivement à l'orientation générale et abstraite et ne constituent ni une évaluation individuelle d'une personne, ni un conseil juridique, RH, psychologique, médical ou professionnel de quelque nature que ce soit. Ils ne constituent pas une déclaration contraignante concernant l'aptitude, la performance, le comportement, la personnalité, le potentiel de développement ou l'efficacité future d'un individu spécifique.</p>
                <h2 style={h2Style}>2. Modèles structurels typifiés</h2>
                <p style={pStyle}>Les contenus présentés décrivent exclusivement des modèles structurels et de tendance généraux, typifiés et à comprendre de manière neutre. Ils ne remplacent ni l'examen indépendant des cas individuels ni une prise en compte appropriée de toutes les circonstances pertinentes dans un contexte décisionnel spécifique.</p>
                <h2 style={h2Style}>3. Exclusion comme unique base de décision</h2>
                <p style={pStyle}>L'utilisation des contenus comme unique base de décisions personnelles, économiques, organisationnelles, juridiques ou autres est expressément exclue. Toute application à des personnes spécifiques, des employés, des candidats ou d'autres cas individuels est de la seule responsabilité de l'utilisateur respectif.</p>
                <h2 style={h2Style}>4. Absence de garantie et limitation de responsabilité</h2>
                <p style={pStyle}>Le prestataire ne garantit pas que les contenus sont adaptés, complets ou concluants pour un cas particulier. La responsabilité pour les décisions, mesures ou effets consécutifs basés sur une application, un transfert ou une interprétation spécifique des contenus fournis est exclue dans la mesure permise par la loi.</p>
                <h2 style={h2Style}>5. Note sur l'évaluation assistée par IA</h2>
                <p style={pStyle}>Les évaluations sont créées à l'aide de l'intelligence artificielle. Malgré une modélisation soignée, les contenus générés par IA peuvent contenir des inexactitudes, des généralisations ou des formulations inappropriées au contexte. Le prestataire n'assume aucune responsabilité quant à l'exactitude, l'exhaustivité ou la pertinence des textes générés par IA. Un examen critique par l'utilisateur est requis dans tous les cas.</p>
                <h2 style={h2Style}>6. Absence de base juridique du travail ou diagnostique</h2>
                <p style={pStyle}>Les résultats de ce logiciel ne constituent pas un diagnostic psychologique, un rapport exploitable en droit du travail ni une évaluation d'aptitude au sens de l'AGG (loi allemande sur l'égalité de traitement) ou de réglementations comparables. Ils ne peuvent pas être utilisés comme base de décisions d'embauche, de licenciement ou de promotion devant résister à un examen juridique.</p>
                <h2 style={h2Style}>7. Responsabilité de l'utilisateur</h2>
                <p style={pStyle}>L'utilisateur est responsable de replacer les résultats dans leur contexte respectif de manière appropriée et, si nécessaire, de consulter des conseils professionnels qualifiés. L'utilisation du logiciel ne remplace pas les obligations de diligence professionnelle, juridique ou éthique de l'utilisateur.</p>
                <h2 style={h2Style}>8. Absence de discrimination</h2>
                <p style={pStyle}>Le logiciel est conçu pour ne pas formuler de déclarations discriminatoires. L'analyse se réfère exclusivement à des styles de travail abstraits et à des modèles de rôles. Des caractéristiques telles que le genre, l'âge, l'origine, la religion, le handicap ou l'orientation sexuelle ne font pas partie de l'évaluation et ne peuvent pas être déduites des résultats.</p>
                <p style={{ margin: "24px 0 0", fontSize: 13, color: "#8E8E93" }}>© {new Date().getFullYear()} foresMind® GmbH. Tous droits réservés.</p>
              </div>
            </>
          ) : it ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-disclaimer-title">Disclaimer / Note legali</h1>
              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
                <h2 style={h2Style}>1. Nessuna consulenza individuale</h2>
                <p style={pStyle}>I contenuti e le valutazioni di questo software servono esclusivamente come orientamento generale e astratto e non costituiscono né una valutazione individuale di alcuna persona, né una consulenza legale, HR, psicologica, medica o professionale di qualsiasi altro tipo. Non costituiscono una dichiarazione vincolante riguardo all'idoneità, alle prestazioni, al comportamento, alla personalità, al potenziale di sviluppo o all'efficacia futura di un individuo specifico.</p>
                <h2 style={h2Style}>2. Modelli strutturali tipizzati</h2>
                <p style={pStyle}>I contenuti presentati descrivono esclusivamente modelli strutturali e di tendenza generali, tipizzati e da intendere in modo neutro rispetto ai valori. Non sostituiscono né l'esame indipendente dei casi individuali né una considerazione appropriata di tutte le circostanze rilevanti in un contesto decisionale specifico.</p>
                <h2 style={h2Style}>3. Esclusione come unica base decisionale</h2>
                <p style={pStyle}>L'utilizzo dei contenuti come unica base per decisioni personali, economiche, organizzative, legali o di altro tipo è espressamente escluso. Qualsiasi applicazione a persone specifiche, dipendenti, candidati o altri casi individuali è di esclusiva responsabilità del rispettivo utente.</p>
                <h2 style={h2Style}>4. Nessuna garanzia e limitazione di responsabilità</h2>
                <p style={pStyle}>Il fornitore non garantisce che i contenuti siano adatti, completi o conclusivi per un caso particolare. La responsabilità per decisioni, misure o effetti consequenziali basati su un'applicazione, trasferimento o interpretazione specifica dei contenuti forniti è esclusa nella misura consentita dalla legge.</p>
                <h2 style={h2Style}>5. Nota sulla valutazione assistita dall'IA</h2>
                <p style={pStyle}>Le valutazioni vengono create utilizzando l'intelligenza artificiale. Nonostante un'attenta modellazione, i contenuti generati dall'IA possono contenere imprecisioni, generalizzazioni o formulazioni inappropriate al contesto. Il fornitore non si assume alcuna responsabilità per l'accuratezza, la completezza o l'adeguatezza dei testi generati dall'IA. In tutti i casi è richiesta una revisione critica da parte dell'utente.</p>
                <h2 style={h2Style}>6. Nessuna base giuridica del lavoro o diagnostica</h2>
                <p style={pStyle}>I risultati di questo software non costituiscono una diagnosi psicologica, una perizia utilizzabile in ambito di diritto del lavoro né una valutazione dell'idoneità ai sensi dell'AGG (legge tedesca sulla parità di trattamento) o di regolamenti comparabili. Non possono essere utilizzati come base per decisioni di assunzione, licenziamento o promozione che devono resistere a un esame legale.</p>
                <h2 style={h2Style}>7. Responsabilità dell'utente</h2>
                <p style={pStyle}>L'utente è responsabile di collocare i risultati nel rispettivo contesto in modo appropriato e, se necessario, di avvalersi di consulenze professionali qualificate. L'utilizzo del software non sostituisce gli obblighi di diligenza professionale, legale o etica dell'utente.</p>
                <h2 style={h2Style}>8. Nessuna discriminazione</h2>
                <p style={pStyle}>Il software è progettato per non formulare dichiarazioni discriminatorie. L'analisi si riferisce esclusivamente a stili di lavoro astratti e modelli di ruolo. Caratteristiche come il genere, l'età, l'origine, la religione, la disabilità o l'orientamento sessuale non rientrano nella valutazione e non possono essere dedotte dai risultati.</p>
                <p style={{ margin: "24px 0 0", fontSize: 13, color: "#8E8E93" }}>© {new Date().getFullYear()} foresMind® GmbH. Tutti i diritti riservati.</p>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-disclaimer-title">Disclaimer / Rechtlicher Hinweis</h1>

              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>

                <h2 style={h2Style}>1. Keine individuelle Beratung</h2>
                <p style={pStyle}>
                  {t("Die Inhalte und Auswertungen dieser Software dienen ausschliesslich der allgemeinen, abstrakten Orientierung und stellen weder eine individuelle Personenbewertung noch eine Rechts-, Personal-, psychologische, medizinische oder sonstige Fachberatung dar. Sie begründen keine verbindliche Aussage über Eignung, Leistung, Verhalten, Persönlichkeit, Entwicklungsfähigkeit oder künftige Wirksamkeit einer konkreten Person.")}
                </p>

                <h2 style={h2Style}>2. Typisierte Strukturmodelle</h2>
                <p style={pStyle}>
                  {t("Die dargestellten Inhalte beschreiben ausschliesslich allgemeine, typisierte und wertfrei zu verstehende Struktur- und Tendenzmodelle. Sie ersetzen weder die eigenständige Prüfung des Einzelfalls noch eine sachgerechte Würdigung aller im konkreten Entscheidungszusammenhang relevanten Umstände.")}
                </p>

                <h2 style={h2Style}>{t("3. Ausschluss als alleinige Entscheidungsgrundlage")}</h2>
                <p style={pStyle}>
                  {t("Eine Verwendung der Inhalte als alleinige Grundlage für personelle, wirtschaftliche, organisatorische, rechtliche oder sonstige Entscheidungen wird ausdrücklich ausgeschlossen. Jede Anwendung auf konkrete Personen, Beschäftigte, Bewerber oder sonstige Einzelfälle erfolgt ausschliesslich in der Verantwortung des jeweiligen Anwenders.")}
                </p>

                <h2 style={h2Style}>{t("4. Keine Gewähr und Haftungsausschluss")}</h2>
                <p style={pStyle}>
                  {t("Der Anbieter übernimmt keine Gewähr dafür, dass die Inhalte für einen bestimmten Einzelfall geeignet, vollständig oder abschliessend sind. Eine Haftung für Entscheidungen, Massnahmen oder Folgewirkungen, die auf einer konkreten Anwendung, Übertragung oder Interpretation der bereitgestellten Inhalte beruhen, ist im gesetzlich zulässigen Umfang ausgeschlossen.")}
                </p>

                <h2 style={h2Style}>{t("5. Hinweis zur KI-gestützten Auswertung")}</h2>
                <p style={pStyle}>
                  {t("Die Auswertungen werden unter Einsatz künstlicher Intelligenz erstellt. KI-generierte Inhalte können trotz sorgfältiger Modellierung Ungenauigkeiten, Verallgemeinerungen oder kontextfremde Formulierungen enthalten. Der Anbieter übernimmt keine Gewähr für die inhaltliche Richtigkeit, Vollständigkeit oder Angemessenheit KI-generierter Texte. Eine kritische Prüfung durch den Anwender ist in jedem Fall erforderlich.")}
                </p>

                <h2 style={h2Style}>6. Keine arbeitsrechtliche oder diagnostische Grundlage</h2>
                <p style={pStyle}>
                  {t("Die Ergebnisse dieser Software stellen keine psychologische Diagnostik, kein arbeitsrechtlich verwertbares Gutachten und keine Eignungsfeststellung im Sinne des AGG (Allgemeines Gleichbehandlungsgesetz) oder vergleichbarer Regelungen dar. Sie dürfen nicht als Grundlage für Einstellungs-, Kündigungs- oder Beförderungsentscheidungen herangezogen werden, die einer rechtlichen Überprüfung standhalten müssen.")}
                </p>

                <h2 style={h2Style}>7. Verantwortung des Anwenders</h2>
                <p style={pStyle}>
                  {t("Der Anwender ist dafür verantwortlich, die Ergebnisse im jeweiligen Kontext sachgerecht einzuordnen und gegebenenfalls qualifizierte Fachberatung hinzuzuziehen. Die Nutzung der Software ersetzt nicht die fachliche, rechtliche oder ethische Sorgfaltspflicht des Anwenders.")}
                </p>

                <h2 style={h2Style}>8. Keine Diskriminierung</h2>
                <p style={pStyle}>
                  {t("Die Software ist darauf ausgelegt, keine diskriminierenden Aussagen zu treffen. Die Analyse bezieht sich ausschliesslich auf abstrakte Arbeitsweisen und Rollenmuster. Merkmale wie Geschlecht, Alter, Herkunft, Religion, Behinderung oder sexuelle Orientierung fliessen nicht in die Auswertung ein und dürfen auch nicht aus den Ergebnissen abgeleitet werden.")}
                </p>

                <p style={{ margin: "24px 0 0", fontSize: 13, color: "#8E8E93" }}>
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
