import { ArrowLeft } from "lucide-react";
import logoPath from "@assets/Logo_bioLogic_1774652440525.gif";
import { useLocalizedText, useRegion } from "@/lib/region";

export default function Disclaimer() {
  const t = useLocalizedText();
  const { region } = useRegion();
  const en = region === "EN";

  const header = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
      <img src={logoPath} alt="bioLogic" style={{ height: 48, objectFit: "contain", marginBottom: 10 }} data-testid="img-disclaimer-logo" />
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
            data-testid="button-back-disclaimer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            {en ? "Back" : t("Zurück")}
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
          {header}

          {en ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-disclaimer-title">Disclaimer / Legal Notice</h1>

              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>1. No Individual Advice</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The contents and evaluations of this software serve exclusively as general, abstract orientation and do not constitute an individual assessment of any person, nor do they represent legal, HR-related, psychological, medical, or any other professional advice. They do not constitute a binding statement regarding the suitability, performance, behaviour, personality, development potential, or future effectiveness of any specific individual.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>2. Typified Structural Models</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The content presented describes exclusively general, typified, and value-neutral structural and tendency models. It does not replace independent examination of individual cases nor an appropriate consideration of all circumstances relevant in a specific decision-making context.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>3. Exclusion as Sole Basis for Decisions</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The use of the contents as the sole basis for personnel, economic, organisational, legal, or other decisions is expressly excluded. Any application to specific individuals, employees, applicants, or other individual cases is the sole responsibility of the respective user.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>4. No Warranty and Limitation of Liability</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The provider does not warrant that the contents are suitable, complete, or conclusive for any particular individual case. Liability for decisions, measures, or consequential effects based on a specific application, transfer, or interpretation of the contents provided is excluded to the extent permitted by law.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>5. Note on AI-Supported Evaluation</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The evaluations are created using artificial intelligence. Despite careful modelling, AI-generated content may contain inaccuracies, generalisations, or context-inappropriate formulations. The provider assumes no liability for the accuracy, completeness, or appropriateness of AI-generated texts. Critical review by the user is required in all cases.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>6. No Employment Law or Diagnostic Basis</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The results of this software do not constitute psychological diagnostics, an employment-law-admissible expert opinion, or an assessment of aptitude within the meaning of the AGG (German General Equal Treatment Act) or comparable regulations. They may not be used as the basis for hiring, termination, or promotion decisions that must withstand legal scrutiny.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>7. User Responsibility</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The user is responsible for placing the results in their respective context appropriately and, where necessary, seeking qualified professional advice. The use of the software does not replace the professional, legal, or ethical due diligence obligations of the user.
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>8. No Discrimination</h2>
                <p style={{ margin: "0 0 20px" }}>
                  The software is designed not to make discriminatory statements. The analysis refers exclusively to abstract working styles and role patterns. Characteristics such as gender, age, origin, religion, disability, or sexual orientation do not factor into the evaluation and may not be derived from the results.
                </p>

                <p style={{ margin: "24px 0 0", fontSize: 13, color: "#8E8E93" }}>
                  © {new Date().getFullYear()} foresMind® GmbH. All rights reserved.
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-disclaimer-title">Disclaimer / Rechtlicher Hinweis</h1>

              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>1. Keine individuelle Beratung</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Die Inhalte und Auswertungen dieser Software dienen ausschliesslich der allgemeinen, abstrakten Orientierung und stellen weder eine individuelle Personenbewertung noch eine Rechts-, Personal-, psychologische, medizinische oder sonstige Fachberatung dar. Sie begründen keine verbindliche Aussage über Eignung, Leistung, Verhalten, Persönlichkeit, Entwicklungsfähigkeit oder künftige Wirksamkeit einer konkreten Person.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>2. Typisierte Strukturmodelle</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Die dargestellten Inhalte beschreiben ausschliesslich allgemeine, typisierte und wertfrei zu verstehende Struktur- und Tendenzmodelle. Sie ersetzen weder die eigenständige Prüfung des Einzelfalls noch eine sachgerechte Würdigung aller im konkreten Entscheidungszusammenhang relevanten Umstände.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("3. Ausschluss als alleinige Entscheidungsgrundlage")}</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Eine Verwendung der Inhalte als alleinige Grundlage für personelle, wirtschaftliche, organisatorische, rechtliche oder sonstige Entscheidungen wird ausdrücklich ausgeschlossen. Jede Anwendung auf konkrete Personen, Beschäftigte, Bewerber oder sonstige Einzelfälle erfolgt ausschliesslich in der Verantwortung des jeweiligen Anwenders.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("4. Keine Gewähr und Haftungsausschluss")}</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Der Anbieter übernimmt keine Gewähr dafür, dass die Inhalte für einen bestimmten Einzelfall geeignet, vollständig oder abschliessend sind. Eine Haftung für Entscheidungen, Massnahmen oder Folgewirkungen, die auf einer konkreten Anwendung, Übertragung oder Interpretation der bereitgestellten Inhalte beruhen, ist im gesetzlich zulässigen Umfang ausgeschlossen.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("5. Hinweis zur KI-gestützten Auswertung")}</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Die Auswertungen werden unter Einsatz künstlicher Intelligenz erstellt. KI-generierte Inhalte können trotz sorgfältiger Modellierung Ungenauigkeiten, Verallgemeinerungen oder kontextfremde Formulierungen enthalten. Der Anbieter übernimmt keine Gewähr für die inhaltliche Richtigkeit, Vollständigkeit oder Angemessenheit KI-generierter Texte. Eine kritische Prüfung durch den Anwender ist in jedem Fall erforderlich.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>6. Keine arbeitsrechtliche oder diagnostische Grundlage</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Die Ergebnisse dieser Software stellen keine psychologische Diagnostik, kein arbeitsrechtlich verwertbares Gutachten und keine Eignungsfeststellung im Sinne des AGG (Allgemeines Gleichbehandlungsgesetz) oder vergleichbarer Regelungen dar. Sie dürfen nicht als Grundlage für Einstellungs-, Kündigungs- oder Beförderungsentscheidungen herangezogen werden, die einer rechtlichen Überprüfung standhalten müssen.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>7. Verantwortung des Anwenders</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Der Anwender ist dafür verantwortlich, die Ergebnisse im jeweiligen Kontext sachgerecht einzuordnen und gegebenenfalls qualifizierte Fachberatung hinzuzuziehen. Die Nutzung der Software ersetzt nicht die fachliche, rechtliche oder ethische Sorgfaltspflicht des Anwenders.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>8. Keine Diskriminierung</h2>
                <p style={{ margin: "0 0 20px" }}>
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
