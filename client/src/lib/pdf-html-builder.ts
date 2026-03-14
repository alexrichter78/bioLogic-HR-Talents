import type { SollIstResult, Severity } from "./soll-ist-engine";
import type { ComponentKey, Triad } from "./jobcheck-engine";
import { labelComponent } from "./jobcheck-engine";

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

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function severityLabel(s: Severity) {
  if (s === "critical") return "KRITISCH";
  if (s === "warning") return "BEDINGT";
  return "PASSEND";
}

function sectionNum(n: number): string {
  return `<span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:4px;background:#F0F0F2;font-size:11px;font-weight:800;color:#8E8E93;margin-right:8px;">${n}</span>`;
}

const S = {
  text: `font-size:13px;color:#48484A;line-height:1.85;margin:0 0 12px;text-align:left;word-break:break-word;overflow-wrap:break-word;`,
  hr: `border:none;border-top:1px solid #E0E0E0;margin:28px 0;`,
  sectionTitle: `font-size:14px;font-weight:700;color:#1D1D1F;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.06em;`,
  label: `font-size:11px;font-weight:700;color:#8E8E93;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;`,
};

function bullet(color: string): string {
  return `<span style="display:inline-block;width:6px;height:6px;border-radius:3px;background:${color};margin-right:8px;vertical-align:middle;"></span>`;
}

export function buildPdfHtml(result: SollIstResult, roleTriad: Triad, candidateProfile: Triad): string {
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

  const mgmtText = rFitLabel === "Geeignet"
    ? "Die Arbeitsweise der Person und die Anforderungen der Rolle stimmen gut überein. Eine stabile Besetzung ist ohne erhöhten Führungsaufwand möglich. Aus Managementsicht wird diese Besetzung empfohlen."
    : rFitLabel === "Bedingt geeignet"
    ? "Die Arbeitsweise der Person weicht in einzelnen Bereichen von den Anforderungen der Rolle ab. Eine stabile Besetzung ist mit gezielter Führung und regelmässiger Rückmeldung möglich. Aus Managementsicht ist diese Besetzung unter Voraussetzungen vertretbar."
    : "Die strukturelle Abweichung zwischen Rolle und Person ist deutlich. Eine stabile Besetzung wäre nur mit dauerhaft erhöhtem Führungsaufwand möglich. Aus Managementsicht wird diese Besetzung nicht empfohlen.";

  const dateStr = new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" });
  const personLabel = result.candidateName !== "Die Person" ? result.candidateName : "Person";

  let html = `<div style="font-family:system-ui,-apple-system,sans-serif;color:#1D1D1F;line-height:1.6;background:#FFFFFF;padding:40px 36px;">`;

  html += `<div style="border-bottom:3px solid ${fitCol};padding-bottom:20px;margin-bottom:24px;">`;
  html += `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">`;
  html += `<span style="font-size:10px;font-weight:700;color:#A0A0A5;letter-spacing:0.14em;text-transform:uppercase;">Passungsbericht</span>`;
  html += `<span style="font-size:11px;color:#A0A0A5;">${esc(dateStr)}</span>`;
  html += `</div>`;
  html += `<h1 style="font-size:22px;font-weight:700;margin:0 0 4px;letter-spacing:-0.02em;">${esc(result.roleName)}</h1>`;
  html += `<p style="font-size:12px;color:#6E6E73;margin:0 0 24px;">Rolle: ${esc(result.roleConstellationLabel)} &ensp;|&ensp; ${esc(personLabel)}: ${esc(result.candConstellationLabel)}</p>`;
  html += `<table style="width:100%;border-collapse:collapse;font-size:13px;"><tbody><tr>`;
  html += `<td style="padding:8px 0;font-weight:600;color:#48484A;width:50%;">Grundpassung: <span style="color:${fitCol};font-weight:700;">${esc(result.fitLabel)}</span></td>`;
  html += `<td style="padding:8px 0;font-weight:600;color:#48484A;">Führungsaufwand: <span style="color:${cCol};font-weight:700;">${esc(cLabel)}</span></td>`;
  html += `</tr></tbody></table></div>`;

  result.summaryText.split("\n\n").forEach(para => {
    html += `<p style="${S.text}">${esc(para)}</p>`;
  });

  if (result.executiveBullets.length > 0) {
    html += `<div style="margin-top:16px;margin-bottom:8px;"><p style="${S.label}">Warum dieses Ergebnis</p>`;
    result.executiveBullets.forEach(b => {
      html += `<div style="font-size:13px;color:#48484A;line-height:1.85;margin:0 0 6px;">${bullet(fitCol)}${esc(b)}</div>`;
    });
    html += `</div>`;
  }

  if (result.constellationRisks.length > 0) {
    html += `<div style="margin-top:12px;margin-bottom:8px;"><p style="${S.label}">Risiken dieser Konstellation</p>`;
    result.constellationRisks.forEach(r => {
      html += `<div style="font-size:13px;color:#48484A;line-height:1.85;margin:0 0 6px;">${bullet("#D43A45")}${esc(r)}</div>`;
    });
    html += `</div>`;
  }

  html += `<hr style="${S.hr}"/>`;

  html += `<div style="margin-bottom:28px;">`;
  html += `<p style="${S.sectionTitle}">${sectionNum(1)} Unterschied zwischen Rolle und Person</p>`;
  html += `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">`;
  html += `<thead><tr>`;
  html += `<th style="text-align:left;padding:6px 12px;font-size:10px;font-weight:700;color:#8E8E93;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid #E0E0E0;width:40%;">Rolle</th>`;
  html += `<th style="text-align:center;padding:6px 12px;font-size:10px;font-weight:700;color:#8E8E93;width:20%;border-bottom:1px solid #E0E0E0;"></th>`;
  html += `<th style="text-align:left;padding:6px 12px;font-size:10px;font-weight:700;color:#8E8E93;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid #E0E0E0;width:40%;">Person</th>`;
  html += `</tr></thead><tbody><tr>`;
  html += `<td style="padding:10px 12px;font-weight:700;color:${BAR_HEX[result.roleDomKey]};vertical-align:top;">${esc(COMP_LABELS[result.roleDomKey])}</td>`;
  html += `<td style="padding:10px 12px;text-align:center;font-weight:700;font-size:18px;color:#8E8E93;vertical-align:top;">${esc(shiftSymbol)}</td>`;
  html += `<td style="padding:10px 12px;vertical-align:top;">`;
  candBadges.forEach((b, i) => {
    html += `<span style="display:block;font-weight:700;color:${BAR_HEX[b.key]};margin-bottom:${i < candBadges.length - 1 ? 4 : 0}px;">${esc(b.label)}</span>`;
  });
  html += `</td></tr></tbody></table>`;
  html += `<p style="${S.text}">${esc(result.dominanceShiftText)}</p>`;
  html += `</div>`;

  html += `<hr style="${S.hr}"/>`;

  html += `<div style="margin-bottom:28px;">`;
  html += `<p style="${S.sectionTitle}">${sectionNum(2)} Vergleich der Profile</p>`;
  const keys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
  let maxGap = 0; let maxKey: ComponentKey = "analytisch";
  for (const k of keys) { const g = Math.abs(roleTriad[k] - candidateProfile[k]); if (g > maxGap) { maxGap = g; maxKey = k; } }
  html += `<p style="${S.text}">Die grösste Abweichung liegt im Bereich ${esc(COMP_LABELS[maxKey])}. Genau dort liegt die Kernanforderung der Rolle.</p>`;

  html += `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">`;
  html += `<thead><tr style="border-bottom:1px solid #E0E0E0;">`;
  html += `<th style="text-align:left;padding:6px 8px;font-size:10px;font-weight:700;color:#8E8E93;letter-spacing:0.08em;text-transform:uppercase;">Komponente</th>`;
  html += `<th style="text-align:right;padding:6px 8px;font-size:10px;font-weight:700;color:#8E8E93;letter-spacing:0.08em;text-transform:uppercase;">Rolle</th>`;
  html += `<th style="text-align:right;padding:6px 8px;font-size:10px;font-weight:700;color:#8E8E93;letter-spacing:0.08em;text-transform:uppercase;">Person</th>`;
  html += `<th style="text-align:right;padding:6px 8px;font-size:10px;font-weight:700;color:#8E8E93;letter-spacing:0.08em;text-transform:uppercase;">Abweichung</th>`;
  html += `</tr></thead><tbody>`;
  for (const k of keys) {
    const rv = Math.round(roleTriad[k]);
    const cv = Math.round(candidateProfile[k]);
    const diff = cv - rv;
    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
    const diffCol = Math.abs(diff) > 10 ? "#D64045" : Math.abs(diff) > 5 ? "#E5A832" : "#48484A";
    html += `<tr style="border-bottom:1px solid #F0F0F2;">`;
    html += `<td style="padding:8px 8px;font-weight:600;color:${BAR_HEX[k]};">${bullet(BAR_HEX[k])}${esc(labelComponent(k))}</td>`;
    html += `<td style="padding:8px 8px;text-align:right;color:#48484A;">${rv} %</td>`;
    html += `<td style="padding:8px 8px;text-align:right;color:#48484A;">${cv} %</td>`;
    html += `<td style="padding:8px 8px;text-align:right;font-weight:700;color:${diffCol};">${diffStr}</td>`;
    html += `</tr>`;
  }
  html += `</tbody></table>`;

  html += `<p style="${S.label}margin-top:16px;">Bedeutung der Komponenten</p>`;
  for (const k of ["intuitiv", "impulsiv", "analytisch"] as ComponentKey[]) {
    html += `<div style="margin-bottom:8px;"><p style="font-size:13px;margin:0;line-height:1.7;">${bullet(BAR_HEX[k])}<strong style="color:#1D1D1F;">${esc(labelComponent(k))}</strong><span style="color:#6E6E73;"> – ${esc(compMeaning[k])}</span></p></div>`;
  }
  html += `</div>`;

  html += `<hr style="${S.hr}"/>`;

  html += `<div style="margin-bottom:28px;">`;
  html += `<p style="${S.sectionTitle}">${sectionNum(3)} Wirkung der Besetzung im Arbeitsalltag</p>`;
  result.impactAreas.forEach((area, idx) => {
    const sevCol = area.severity === "critical" ? "#D64045" : area.severity === "warning" ? "#E5A832" : "#3A9A5C";
    html += `<div style="margin-bottom:16px;padding-bottom:${idx < result.impactAreas.length - 1 ? 16 : 0}px;border-bottom:${idx < result.impactAreas.length - 1 ? "1px solid #F0F0F2" : "none"};">`;
    html += `<p style="font-size:13px;font-weight:700;color:#1D1D1F;margin:0 0 2px;">${bullet(sevCol)}${esc(area.label)}<span style="font-weight:600;font-size:11px;color:${sevCol};margin-left:8px;letter-spacing:0.04em;">${severityLabel(area.severity)}</span></p>`;
    html += `<p style="font-size:13px;color:#1D1D1F;line-height:1.85;margin:4px 0 2px;font-weight:600;padding-left:14px;">${esc(area.roleNeed)}</p>`;
    html += `<p style="font-size:13px;color:#48484A;line-height:1.85;margin:2px 0;padding-left:14px;">${esc(area.candidatePattern)}</p>`;
    html += `<p style="font-size:13px;color:#6E6E73;line-height:1.85;margin:2px 0 0;font-style:italic;padding-left:14px;">${esc(area.risk)}</p>`;
    html += `</div>`;
  });
  html += `</div>`;

  html += `<hr style="${S.hr}"/>`;

  html += `<div style="margin-bottom:28px;">`;
  html += `<p style="${S.sectionTitle}">${sectionNum(4)} Verhalten unter Druck</p>`;
  html += `<div style="margin-bottom:14px;"><p style="font-size:12px;font-weight:700;color:#E5A832;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">Kontrollierter Druck</p>`;
  html += `<p style="${S.text}">${esc(result.stressBehavior.controlledPressure)}</p></div>`;
  html += `<div style="margin-bottom:14px;"><p style="font-size:12px;font-weight:700;color:#D64045;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">Unkontrollierter Stress</p>`;
  html += `<p style="${S.text}">${esc(result.stressBehavior.uncontrolledStress)}</p></div>`;
  html += `<p style="${S.text}font-style:italic;color:#6E6E73;">Unter zunehmendem Arbeitsdruck können sich diese Verhaltensmuster verstärken. Dadurch entstehen im Arbeitsalltag Risiken für Abstimmung, Führung und Zusammenarbeit.</p>`;
  html += `</div>`;

  html += `<hr style="${S.hr}"/>`;

  html += `<div style="margin-bottom:28px;">`;
  html += `<p style="${S.sectionTitle}">${sectionNum(5)} Risikoprognose</p>`;
  result.riskTimeline.forEach((phase, i) => {
    const phaseCol = i === 0 ? "#3A9A5C" : i === 1 ? "#E5A832" : "#D64045";
    html += `<div style="margin-bottom:14px;padding-bottom:${i < result.riskTimeline.length - 1 ? 14 : 0}px;border-bottom:${i < result.riskTimeline.length - 1 ? "1px solid #F0F0F2" : "none"};">`;
    html += `<p style="font-size:12px;font-weight:700;color:${phaseCol};margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">${esc(phase.label)} <span style="font-weight:500;text-transform:none;letter-spacing:0;color:#8E8E93;">${esc(phase.period)}</span></p>`;
    html += `<p style="${S.text}">${esc(phase.text)}</p>`;
    html += `</div>`;
  });
  html += `</div>`;

  html += `<hr style="${S.hr}"/>`;

  html += `<div style="margin-bottom:28px;">`;
  html += `<p style="${S.sectionTitle}">${sectionNum(6)} Gesamtbewertung</p>`;
  html += `<table style="width:100%;border-collapse:collapse;margin:0 0 16px;font-size:13px;"><tbody>`;
  html += `<tr style="border-bottom:1px solid #E0E0E0;"><td style="padding:8px 0;font-weight:600;color:#48484A;">Rolle</td><td style="padding:8px 0;font-weight:700;color:#1D1D1F;">${esc(result.roleName)}</td></tr>`;
  html += `<tr style="border-bottom:1px solid #E0E0E0;"><td style="padding:8px 0;font-weight:600;color:#48484A;">Grundpassung</td><td style="padding:8px 0;font-weight:700;color:${rFitColor};">${esc(rFitLabel)}</td></tr>`;
  html += `<tr style="border-bottom:1px solid #E0E0E0;"><td style="padding:8px 0;font-weight:600;color:#48484A;">Entwicklungsprognose</td><td style="padding:8px 0;"><span style="font-weight:700;color:${rGaugeCol};">${rDev} von 3</span><span style="color:#48484A;margin-left:6px;">${esc(rDevLabel)}</span></td></tr>`;
  html += `</tbody></table>`;
  html += `<p style="${S.text}border-left:3px solid ${rFitColor};padding-left:12px;">${esc(rFazit)}</p>`;
  html += `<p style="${S.text}">${esc(result.developmentText)}</p>`;
  html += `<div style="margin-top:16px;padding:12px 0;border-top:1px solid #E0E0E0;">`;
  html += `<p style="${S.label}">Managementeinschätzung</p>`;
  html += `<p style="${S.text}">${esc(mgmtText)}</p>`;
  html += `</div></div>`;

  if (result.integrationsplan) {
    html += `<hr style="${S.hr}"/>`;
    html += `<div style="margin-bottom:28px;">`;
    html += `<p style="${S.sectionTitle}">${sectionNum(7)} 30-Tage-Integrationsplan</p>`;
    result.integrationsplan.forEach((phase, idx) => {
      const phaseCol = phase.num === 1 ? "#0071E3" : phase.num === 2 ? "#F39200" : "#3A9A5C";
      html += `<div style="margin-bottom:18px;padding-bottom:${idx < result.integrationsplan!.length - 1 ? 18 : 0}px;border-bottom:${idx < result.integrationsplan!.length - 1 ? "1px solid #F0F0F2" : "none"};">`;
      html += `<p style="font-size:13px;font-weight:700;color:${phaseCol};margin:0 0 4px;">Phase ${phase.num}: ${esc(phase.title)} <span style="font-weight:500;color:#8E8E93;">(${esc(phase.period)})</span></p>`;
      html += `<p style="font-size:12px;font-weight:600;color:#48484A;margin:0 0 8px;">Ziel: ${esc(phase.ziel)}</p>`;
      html += `<p style="${S.label}">Massnahmen</p>`;
      phase.items.forEach(item => {
        html += `<div style="font-size:13px;color:#48484A;line-height:1.85;margin:0 0 4px;"><span style="color:${phaseCol};margin-right:6px;font-weight:700;">–</span>${esc(item)}</div>`;
      });
      html += `<div style="margin-top:10px;padding-left:12px;border-left:2px solid ${phaseCol}40;">`;
      html += `<p style="font-size:11px;font-weight:700;color:${phaseCol};text-transform:uppercase;letter-spacing:0.06em;margin:0 0 4px;">Integrationsfokus</p>`;
      html += `<p style="font-size:13px;color:#48484A;line-height:1.7;margin:0 0 6px;">${esc(phase.fokus.intro)}</p>`;
      phase.fokus.bullets.forEach(b => {
        html += `<div style="font-size:13px;color:#48484A;line-height:1.7;margin:0 0 3px;"><span style="color:${phaseCol};margin-right:6px;font-weight:700;">–</span>${esc(b)}</div>`;
      });
      html += `</div></div>`;
    });
    html += `</div>`;
  }

  html += `<hr style="${S.hr}"/>`;

  const finalSecNum = result.integrationsplan ? 8 : 7;
  html += `<div style="margin-bottom:28px;">`;
  html += `<p style="${S.sectionTitle}">${sectionNum(finalSecNum)} Gesamtbewertung</p>`;
  html += `<table style="width:100%;border-collapse:collapse;margin:0 0 16px;font-size:13px;"><tbody>`;
  html += `<tr style="border-bottom:1px solid #E0E0E0;">`;
  html += `<td style="padding:8px 0;font-weight:600;color:#48484A;width:50%;">Grundpassung: <span style="font-weight:700;color:${fitCol};">${esc(result.fitLabel)}</span></td>`;
  html += `<td style="padding:8px 0;font-weight:600;color:#48484A;">Entwicklungsprognose: <span style="font-weight:700;color:${fDevCol};">${esc(fDevLabel)}</span></td>`;
  html += `</tr></tbody></table>`;
  html += `<p style="${S.text}">${esc(result.finalText)}</p>`;
  html += `</div>`;

  html += `<div style="margin-top:36px;padding-top:16px;border-top:1px solid #E0E0E0;display:flex;justify-content:space-between;align-items:center;">`;
  html += `<span style="font-size:12px;font-weight:600;color:#B0B0B5;letter-spacing:0.02em;">bioLogic Passungsanalyse</span>`;
  html += `<span style="font-size:11px;color:#B0B0B5;">${esc(dateStr)}</span>`;
  html += `</div>`;

  html += `</div>`;
  return html;
}
