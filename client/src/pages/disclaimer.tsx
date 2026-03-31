import { ArrowLeft } from "lucide-react";
import logoPath from "@assets/Logo_bioLogic_1774652440525.gif";
import { useLocalizedText } from "@/lib/region";

export default function Disclaimer() {
  const t = useLocalizedText();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf3 50%, #f5f7fb 100%)", fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => window.history.back()}
            data-testid="button-back-disclaimer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            {t("Zurück")}
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
            <img src={logoPath} alt="bioLogic" style={{ height: 48, objectFit: "contain", marginBottom: 10 }} data-testid="img-disclaimer-logo" />
            <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, transparent, #D1D5DB, transparent)", marginBottom: 10 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>HR Talents</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-disclaimer-title">Disclaimer / Rechtlicher Hinweis</h1>

          <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>1. Keine individuelle Beratung</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Die Inhalte und Auswertungen dieser Software dienen ausschließlich der allgemeinen, abstrakten Orientierung und stellen weder eine individuelle Personenbewertung noch eine Rechts-, Personal-, psychologische, medizinische oder sonstige Fachberatung dar. Sie begründen keine verbindliche Aussage über Eignung, Leistung, Verhalten, Persönlichkeit, Entwicklungsfähigkeit oder künftige Wirksamkeit einer konkreten Person.")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>2. Typisierte Strukturmodelle</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Die dargestellten Inhalte beschreiben ausschließlich allgemeine, typisierte und wertfrei zu verstehende Struktur- und Tendenzmodelle. Sie ersetzen weder die eigenständige Prüfung des Einzelfalls noch eine sachgerechte Würdigung aller im konkreten Entscheidungszusammenhang relevanten Umstände.")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("3. Ausschluss als alleinige Entscheidungsgrundlage")}</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Eine Verwendung der Inhalte als alleinige Grundlage für personelle, wirtschaftliche, organisatorische, rechtliche oder sonstige Entscheidungen wird ausdrücklich ausgeschlossen. Jede Anwendung auf konkrete Personen, Beschäftigte, Bewerber oder sonstige Einzelfälle erfolgt ausschließlich in der Verantwortung des jeweiligen Anwenders.")}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("4. Keine Gewähr und Haftungsausschluss")}</h2>
            <p style={{ margin: "0 0 20px" }}>
              {t("Der Anbieter übernimmt keine Gewähr dafür, dass die Inhalte für einen bestimmten Einzelfall geeignet, vollständig oder abschließend sind. Eine Haftung für Entscheidungen, Maßnahmen oder Folgewirkungen, die auf einer konkreten Anwendung, Übertragung oder Interpretation der bereitgestellten Inhalte beruhen, ist im gesetzlich zulässigen Umfang ausgeschlossen.")}
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
              {t("Die Software ist darauf ausgelegt, keine diskriminierenden Aussagen zu treffen. Die Analyse bezieht sich ausschließlich auf abstrakte Arbeitsweisen und Rollenmuster. Merkmale wie Geschlecht, Alter, Herkunft, Religion, Behinderung oder sexuelle Orientierung fließen nicht in die Auswertung ein und dürfen auch nicht aus den Ergebnissen abgeleitet werden.")}
            </p>

            <p style={{ margin: "24px 0 0", fontSize: 13, color: "#8E8E93" }}>
              © {new Date().getFullYear()} foresMind® GmbH. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
