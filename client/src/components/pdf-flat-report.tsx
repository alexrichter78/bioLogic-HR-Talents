import type { SollIstResult, Severity } from "@/lib/soll-ist-engine";
import type { ComponentKey, Triad } from "@/lib/jobcheck-engine";
import { labelComponent } from "@/lib/jobcheck-engine";

const COMP_LABELS: Record<ComponentKey, string> = {
  impulsiv: "Umsetzung / Tempo",
  intuitiv: "Zusammenarbeit / Kommunikation",
  analytisch: "Struktur / Analyse",
};

const BAR_HEX: Record<ComponentKey, string> = {
  impulsiv: "#C41E3A",
  intuitiv: "#F39200",
  analytisch: "#1A5DAB",
};

function severityLabel(s: Severity) {
  if (s === "critical") return "KRITISCH";
  if (s === "warning") return "BEDINGT";
  return "PASSEND";
}

function biggestGapText(rt: Triad, ct: Triad): string {
  const keys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
  let maxGap = 0, maxKey: ComponentKey = "analytisch";
  for (const k of keys) {
    const g = Math.abs(rt[k] - ct[k]);
    if (g > maxGap) { maxGap = g; maxKey = k; }
  }
  return `Die grösste Abweichung liegt im Bereich ${COMP_LABELS[maxKey]}. Genau dort liegt die Kernanforderung der Rolle.`;
}

const sty = {
  page: { fontFamily: "system-ui, -apple-system, sans-serif", color: "#1D1D1F", lineHeight: 1.6, background: "#FFFFFF", padding: "40px 36px" } as const,
  h1: { fontSize: 22, fontWeight: 700 as const, margin: "0 0 4px", letterSpacing: "-0.02em" },
  meta: { fontSize: 12, color: "#6E6E73", margin: "0 0 24px" },
  sectionTitle: { fontSize: 14, fontWeight: 700 as const, color: "#1D1D1F", margin: "0 0 10px", textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  text: { fontSize: 13, color: "#48484A", lineHeight: 1.85, margin: "0 0 12px", textAlign: "left" as const, wordBreak: "break-word" as const, overflowWrap: "break-word" as const },
  hr: { border: "none", borderTop: "1px solid #E0E0E0", margin: "28px 0" },
  badge: (color: string) => ({ display: "inline-block" as const, fontSize: 12, fontWeight: 700 as const, color, letterSpacing: "0.04em" }),
  bullet: (color: string) => ({ display: "inline-block" as const, width: 6, height: 6, borderRadius: 3, background: color, marginRight: 8, flexShrink: 0 as const, verticalAlign: "middle" as const }),
  li: { fontSize: 13, color: "#48484A", lineHeight: 1.85, margin: "0 0 6px", display: "flex" as const, alignItems: "baseline" as const, gap: 0 },
  label: { fontSize: 11, fontWeight: 700 as const, color: "#8E8E93", textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 8px" },
  subhead: { fontSize: 13, fontWeight: 700 as const, color: "#1D1D1F", margin: "0 0 4px" },
};

function SectionNum({ n }: { n: number }) {
  return <span style={{ display: "inline-block", width: 22, height: 22, lineHeight: "22px", textAlign: "center", borderRadius: 4, background: "#F0F0F2", fontSize: 11, fontWeight: 800, color: "#8E8E93", marginRight: 8 }}>{n}</span>;
}

export default function PdfFlatReport({ result, roleTriad, candidateProfile }: { result: SollIstResult; roleTriad: Triad; candidateProfile: Triad }) {
  const fitCol = result.fitRating === "GEEIGNET" ? "#3A9A5C" : result.fitRating === "BEDINGT" ? "#E5A832" : "#D64045";
  const cCol = result.controlIntensity === "hoch" ? "#D64045" : result.controlIntensity === "mittel" ? "#E5A832" : "#3A9A5C";
  const cLabel = result.controlIntensity === "hoch" ? "Hoch" : result.controlIntensity === "mittel" ? "Mittel" : "Gering";

  const sameDom = result.roleDomKey === result.candDomKey;

  const rFitLabel = result.fitLabel;
  const rFitColor = result.fitColor;
  const rGapLevel = result.gapLevel;
  let rFazit: string;
  if (rFitLabel === "Geeignet") {
    rFazit = "Die Arbeitsweise der Person passt gut zu den Anforderungen der Rolle. Aufgaben, Entscheidungen und Arbeitsstil stimmen weitgehend überein.";
  } else if (rFitLabel === "Bedingt geeignet" && rGapLevel === "gering") {
    rFazit = "Die Grundausrichtung ist ähnlich, jedoch unterscheidet sich die Gewichtung einzelner Arbeitsbereiche. Im Alltag kann das zu erhöhtem Abstimmungsbedarf und höherem Führungsaufwand führen.";
  } else if (rFitLabel === "Bedingt geeignet") {
    rFazit = "Die Grundausrichtung ist ähnlich. In einzelnen Bereichen zeigt sich jedoch spürbarer Anpassungsbedarf. Im Alltag kann das zu Konflikten im Team und deutlich höherem Führungsaufwand führen.";
  } else if (rFitLabel === "Nicht geeignet" && rGapLevel !== "hoch") {
    rFazit = "Die strukturelle Abweichung zwischen Rolle und Person ist deutlich. Im Alltag kann das zu erhöhtem Abstimmungsbedarf, Konflikten im Team und deutlich höherem Führungsaufwand führen.";
  } else {
    rFazit = "Die Anforderungen der Rolle und die Arbeitsweise der Person unterscheiden sich deutlich. Im Alltag kann das zu erhöhtem Abstimmungsbedarf, Konflikten im Team und deutlich höherem Führungsaufwand führen.";
  }

  const rDevLevel = result.developmentLevel;
  const rDev = rDevLevel >= 4 ? 3 : rDevLevel >= 3 ? 2 : 1;
  const rDevLabel = result.developmentLabel === "hoch" ? "Geringer Entwicklungsaufwand" : result.developmentLabel === "mittel" ? "Entwicklung mit gezielter Führung möglich" : "Hoher Entwicklungsaufwand, Ergebnis unsicher";
  const rGaugeCol = rDev === 3 ? "#3A9A5C" : rDev === 2 ? "#E5A832" : "#D64045";

  const fDev = rDev;
  const fDevCol = rGaugeCol;
  const fDevLabel = result.developmentLabel === "hoch" ? "Entwicklung sehr wahrscheinlich" : result.developmentLabel === "mittel" ? "Entwicklung mit Unterstützung möglich" : "Entwicklung unwahrscheinlich";

  const candBadges: { key: ComponentKey; label: string }[] = result.candIsEqualDist
    ? (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => ({ key: k, label: COMP_LABELS[k] }))
    : result.candIsDualDom
      ? [{ key: result.candDomKey, label: COMP_LABELS[result.candDomKey] }, { key: result.candDom2Key, label: COMP_LABELS[result.candDom2Key] }]
      : [{ key: result.candDomKey, label: COMP_LABELS[result.candDomKey] }];
  const shiftSymbol = result.candIsEqualDist ? "≠" : result.candIsDualDom ? "⇄" : sameDom ? "=" : "→";

  const compMeaning: Record<ComponentKey, string> = {
    intuitiv: "Erkennen, was Gesprächspartner oder Team brauchen und Kommunikation darauf abstimmen.",
    impulsiv: "Aufgaben schnell vorantreiben, Prioritäten setzen und Ergebnisse liefern.",
    analytisch: "Strukturen schaffen, Abläufe organisieren und Entscheidungen nachvollziehbar vorbereiten.",
  };

  return (
    <div style={sty.page}>
      <div style={{ borderBottom: `3px solid ${fitCol}`, paddingBottom: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#A0A0A5", letterSpacing: "0.14em", textTransform: "uppercase" }}>Passungsbericht</span>
          <span style={{ fontSize: 11, color: "#A0A0A5" }}>
            {new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>
        <h1 style={sty.h1}>{result.roleName}</h1>
        <p style={sty.meta}>
          Rolle: {result.roleConstellationLabel} &ensp;|&ensp; {result.candidateName !== "Die Person" ? result.candidateName : "Person"}: {result.candConstellationLabel}
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px 0", fontWeight: 600, color: "#48484A", width: "50%" }}>
                Grundpassung: <span style={{ color: fitCol, fontWeight: 700 }}>{result.fitLabel}</span>
              </td>
              <td style={{ padding: "8px 0", fontWeight: 600, color: "#48484A" }}>
                Führungsaufwand: <span style={{ color: cCol, fontWeight: 700 }}>{cLabel}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {result.summaryText.split("\n\n").map((para, i) => (
        <p key={i} style={sty.text}>{para}</p>
      ))}

      {result.executiveBullets.length > 0 && (
        <div style={{ marginTop: 16, marginBottom: 8 }}>
          <p style={sty.label}>Warum dieses Ergebnis</p>
          {result.executiveBullets.map((b, i) => (
            <div key={i} style={sty.li}>
              <span style={sty.bullet(fitCol)} />
              <span style={{ fontSize: 13, color: "#48484A", lineHeight: 1.85 }}>{b}</span>
            </div>
          ))}
        </div>
      )}

      {result.constellationRisks.length > 0 && (
        <div style={{ marginTop: 12, marginBottom: 8 }}>
          <p style={sty.label}>Risiken dieser Konstellation</p>
          {result.constellationRisks.map((r, i) => (
            <div key={i} style={sty.li}>
              <span style={sty.bullet("#D43A45")} />
              <span style={{ fontSize: 13, color: "#48484A", lineHeight: 1.85 }}>{r}</span>
            </div>
          ))}
        </div>
      )}

      <hr style={sty.hr} />

      <div style={{ marginBottom: 28 }}>
        <p style={sty.sectionTitle}><SectionNum n={1} /> Unterschied zwischen Rolle und Person</p>
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "6px 12px", fontSize: 10, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid #E0E0E0", width: "40%" }}>Rolle</th>
              <th style={{ textAlign: "center", padding: "6px 12px", fontSize: 10, fontWeight: 700, color: "#8E8E93", width: "20%", borderBottom: "1px solid #E0E0E0" }}></th>
              <th style={{ textAlign: "left", padding: "6px 12px", fontSize: 10, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid #E0E0E0", width: "40%" }}>Person</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "10px 12px", fontWeight: 700, color: BAR_HEX[result.roleDomKey], verticalAlign: "top" }}>{COMP_LABELS[result.roleDomKey]}</td>
              <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, fontSize: 18, color: "#8E8E93", verticalAlign: "top" }}>{shiftSymbol}</td>
              <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                {candBadges.map((b, i) => (
                  <span key={b.key} style={{ display: "block", fontWeight: 700, color: BAR_HEX[b.key], marginBottom: i < candBadges.length - 1 ? 4 : 0 }}>{b.label}</span>
                ))}
              </td>
            </tr>
          </tbody>
        </table>
        <p style={sty.text}>{result.dominanceShiftText}</p>
      </div>

      <hr style={sty.hr} />

      <div style={{ marginBottom: 28 }}>
        <p style={sty.sectionTitle}><SectionNum n={2} /> Vergleich der Profile</p>
        <p style={sty.text}>{biggestGapText(result.roleTriad, result.candTriad)}</p>

        <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E0E0E0" }}>
              <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 10, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.08em", textTransform: "uppercase" }}>Komponente</th>
              <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 10, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.08em", textTransform: "uppercase" }}>Rolle</th>
              <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 10, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.08em", textTransform: "uppercase" }}>Person</th>
              <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 10, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.08em", textTransform: "uppercase" }}>Abweichung</th>
            </tr>
          </thead>
          <tbody>
            {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
              const rv = Math.round(roleTriad[k]);
              const cv = Math.round(candidateProfile[k]);
              const diff = cv - rv;
              const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
              const diffCol = Math.abs(diff) > 10 ? "#D64045" : Math.abs(diff) > 5 ? "#E5A832" : "#48484A";
              return (
                <tr key={k} style={{ borderBottom: "1px solid #F0F0F2" }}>
                  <td style={{ padding: "8px 8px", fontWeight: 600, color: BAR_HEX[k] }}>
                    <span style={sty.bullet(BAR_HEX[k])} />
                    {labelComponent(k)}
                  </td>
                  <td style={{ padding: "8px 8px", textAlign: "right", color: "#48484A" }}>{rv} %</td>
                  <td style={{ padding: "8px 8px", textAlign: "right", color: "#48484A" }}>{cv} %</td>
                  <td style={{ padding: "8px 8px", textAlign: "right", fontWeight: 700, color: diffCol }}>{diffStr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p style={{ ...sty.label, marginTop: 16 }}>Bedeutung der Komponenten</p>
        {(["intuitiv", "impulsiv", "analytisch"] as ComponentKey[]).map(k => (
          <div key={k} style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 13, margin: 0, lineHeight: 1.7 }}>
              <span style={sty.bullet(BAR_HEX[k])} />
              <strong style={{ color: "#1D1D1F" }}>{labelComponent(k)}</strong>
              <span style={{ color: "#6E6E73" }}> – {compMeaning[k]}</span>
            </p>
          </div>
        ))}
      </div>

      <hr style={sty.hr} />

      <div style={{ marginBottom: 28 }}>
        <p style={sty.sectionTitle}><SectionNum n={3} /> Wirkung der Besetzung im Arbeitsalltag</p>
        {result.impactAreas.map((area, idx) => {
          const sevCol = area.severity === "critical" ? "#D64045" : area.severity === "warning" ? "#E5A832" : "#3A9A5C";
          return (
            <div key={area.id} style={{ marginBottom: 16, paddingBottom: idx < result.impactAreas.length - 1 ? 16 : 0, borderBottom: idx < result.impactAreas.length - 1 ? "1px solid #F0F0F2" : "none" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: "0 0 2px" }}>
                <span style={sty.bullet(sevCol)} />
                {area.label}
                <span style={{ fontWeight: 600, fontSize: 11, color: sevCol, marginLeft: 8, letterSpacing: "0.04em" }}>{severityLabel(area.severity)}</span>
              </p>
              <p style={{ fontSize: 13, color: "#1D1D1F", lineHeight: 1.85, margin: "4px 0 2px", fontWeight: 600, paddingLeft: 14 }}>{area.roleNeed}</p>
              <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.85, margin: "2px 0", paddingLeft: 14 }}>{area.candidatePattern}</p>
              <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.85, margin: "2px 0 0", fontStyle: "italic", paddingLeft: 14 }}>{area.risk}</p>
            </div>
          );
        })}
      </div>

      <hr style={sty.hr} />

      <div style={{ marginBottom: 28 }}>
        <p style={sty.sectionTitle}><SectionNum n={4} /> Verhalten unter Druck</p>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#E5A832", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Kontrollierter Druck</p>
          <p style={sty.text}>{result.stressBehavior.controlledPressure}</p>
        </div>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#D64045", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Unkontrollierter Stress</p>
          <p style={sty.text}>{result.stressBehavior.uncontrolledStress}</p>
        </div>
        <p style={{ ...sty.text, fontStyle: "italic", color: "#6E6E73" }}>
          Unter zunehmendem Arbeitsdruck können sich diese Verhaltensmuster verstärken. Dadurch entstehen im Arbeitsalltag Risiken für Abstimmung, Führung und Zusammenarbeit.
        </p>
      </div>

      <hr style={sty.hr} />

      <div style={{ marginBottom: 28 }}>
        <p style={sty.sectionTitle}><SectionNum n={5} /> Risikoprognose</p>
        {result.riskTimeline.map((phase, i) => {
          const phaseCol = i === 0 ? "#3A9A5C" : i === 1 ? "#E5A832" : "#D64045";
          return (
            <div key={i} style={{ marginBottom: 14, paddingBottom: i < result.riskTimeline.length - 1 ? 14 : 0, borderBottom: i < result.riskTimeline.length - 1 ? "1px solid #F0F0F2" : "none" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: phaseCol, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {phase.label} <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: "0", color: "#8E8E93" }}>{phase.period}</span>
              </p>
              <p style={sty.text}>{phase.text}</p>
            </div>
          );
        })}
      </div>

      <hr style={sty.hr} />

      <div style={{ marginBottom: 28 }}>
        <p style={sty.sectionTitle}><SectionNum n={6} /> Gesamtbewertung</p>

        <table style={{ width: "100%", borderCollapse: "collapse", margin: "0 0 16px", fontSize: 13 }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #E0E0E0" }}>
              <td style={{ padding: "8px 0", fontWeight: 600, color: "#48484A" }}>Rolle</td>
              <td style={{ padding: "8px 0", fontWeight: 700, color: "#1D1D1F" }}>{result.roleName}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #E0E0E0" }}>
              <td style={{ padding: "8px 0", fontWeight: 600, color: "#48484A" }}>Grundpassung</td>
              <td style={{ padding: "8px 0", fontWeight: 700, color: rFitColor }}>{rFitLabel}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #E0E0E0" }}>
              <td style={{ padding: "8px 0", fontWeight: 600, color: "#48484A" }}>Entwicklungsprognose</td>
              <td style={{ padding: "8px 0" }}>
                <span style={{ fontWeight: 700, color: rGaugeCol }}>{rDev} von 3</span>
                <span style={{ color: "#48484A", marginLeft: 6 }}>{rDevLabel}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <p style={{ ...sty.text, borderLeft: `3px solid ${rFitColor}`, paddingLeft: 12 }}>{rFazit}</p>
        <p style={sty.text}>{result.developmentText}</p>

        <div style={{ marginTop: 16, padding: "12px 0", borderTop: "1px solid #E0E0E0" }}>
          <p style={sty.label}>Managementeinschätzung</p>
          <p style={sty.text}>
            {rFitLabel === "Geeignet"
              ? "Die Arbeitsweise der Person und die Anforderungen der Rolle stimmen gut überein. Eine stabile Besetzung ist ohne erhöhten Führungsaufwand möglich. Aus Managementsicht wird diese Besetzung empfohlen."
              : rFitLabel === "Bedingt geeignet"
              ? "Die Arbeitsweise der Person weicht in einzelnen Bereichen von den Anforderungen der Rolle ab. Eine stabile Besetzung ist mit gezielter Führung und regelmässiger Rückmeldung möglich. Aus Managementsicht ist diese Besetzung unter Voraussetzungen vertretbar."
              : "Die strukturelle Abweichung zwischen Rolle und Person ist deutlich. Eine stabile Besetzung wäre nur mit dauerhaft erhöhtem Führungsaufwand möglich. Aus Managementsicht wird diese Besetzung nicht empfohlen."}
          </p>
        </div>
      </div>

      {result.integrationsplan && (<>
        <hr style={sty.hr} />
        <div style={{ marginBottom: 28 }}>
          <p style={sty.sectionTitle}><SectionNum n={7} /> 30-Tage-Integrationsplan</p>
          {result.integrationsplan.map((phase, idx) => {
            const phaseCol = phase.num === 1 ? "#0071E3" : phase.num === 2 ? "#F39200" : "#3A9A5C";
            return (
              <div key={phase.num} style={{ marginBottom: 18, paddingBottom: idx < result.integrationsplan!.length - 1 ? 18 : 0, borderBottom: idx < result.integrationsplan!.length - 1 ? "1px solid #F0F0F2" : "none" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: phaseCol, margin: "0 0 4px" }}>
                  Phase {phase.num}: {phase.title} <span style={{ fontWeight: 500, color: "#8E8E93" }}>({phase.period})</span>
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#48484A", margin: "0 0 8px" }}>Ziel: {phase.ziel}</p>

                <p style={sty.label}>Massnahmen</p>
                {phase.items.map((item, i) => (
                  <div key={i} style={sty.li}>
                    <span style={{ color: phaseCol, marginRight: 6, fontWeight: 700 }}>–</span>
                    <span style={{ fontSize: 13, color: "#48484A", lineHeight: 1.85 }}>{item}</span>
                  </div>
                ))}

                <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: `2px solid ${phaseCol}40` }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: phaseCol, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Integrationsfokus</p>
                  <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.7, margin: "0 0 6px" }}>{phase.fokus.intro}</p>
                  {phase.fokus.bullets.map((b, bi) => (
                    <div key={bi} style={sty.li}>
                      <span style={{ color: phaseCol, marginRight: 6, fontWeight: 700 }}>–</span>
                      <span style={{ fontSize: 13, color: "#48484A", lineHeight: 1.7 }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </>)}

      <hr style={sty.hr} />

      <div style={{ marginBottom: 28 }}>
        <p style={sty.sectionTitle}><SectionNum n={result.integrationsplan ? 8 : 7} /> Gesamtbewertung</p>
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "0 0 16px", fontSize: 13 }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #E0E0E0" }}>
              <td style={{ padding: "8px 0", fontWeight: 600, color: "#48484A", width: "50%" }}>
                Grundpassung: <span style={{ fontWeight: 700, color: fitCol }}>{result.fitLabel}</span>
              </td>
              <td style={{ padding: "8px 0", fontWeight: 600, color: "#48484A" }}>
                Entwicklungsprognose: <span style={{ fontWeight: 700, color: fDevCol }}>{fDevLabel}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p style={sty.text}>{result.finalText}</p>
      </div>

      <div style={{ marginTop: 36, paddingTop: 16, borderTop: "1px solid #E0E0E0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#B0B0B5", letterSpacing: "0.02em" }}>bioLogic Passungsanalyse</span>
        <span style={{ fontSize: 11, color: "#B0B0B5" }}>
          {new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}
