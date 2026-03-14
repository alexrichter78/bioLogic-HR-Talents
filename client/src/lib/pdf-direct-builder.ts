import type { SollIstResult, Severity } from "./soll-ist-engine";
import type { ComponentKey, Triad } from "./jobcheck-engine";
import { labelComponent } from "./jobcheck-engine";

const COMP_LABELS: Record<ComponentKey, string> = {
  impulsiv: "Umsetzung / Tempo",
  intuitiv: "Zusammenarbeit / Kommunikation",
  analytisch: "Struktur / Analyse",
};

function severityLabel(s: Severity) {
  if (s === "critical") return "KRITISCH";
  if (s === "warning") return "BEDINGT";
  return "PASSEND";
}

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

const COL = {
  black: [29, 29, 31] as RGB,
  dark: [72, 72, 74] as RGB,
  mid: [110, 110, 115] as RGB,
  light: [142, 142, 147] as RGB,
  faint: [176, 176, 181] as RGB,
  line: [224, 224, 224] as RGB,
  lineFaint: [240, 240, 242] as RGB,
  green: [58, 154, 92] as RGB,
  amber: [229, 168, 50] as RGB,
  red: [214, 64, 69] as RGB,
  redDark: [212, 58, 69] as RGB,
  impulsiv: [196, 30, 58] as RGB,
  intuitiv: [243, 146, 0] as RGB,
  analytisch: [26, 93, 171] as RGB,
  blue: [0, 113, 227] as RGB,
};

const compColor = (k: ComponentKey): RGB => COL[k];

function fitRgb(rating: string): RGB {
  if (rating === "GEEIGNET") return COL.green;
  if (rating === "BEDINGT") return COL.amber;
  return COL.red;
}

function controlRgb(ci: string): RGB {
  if (ci === "hoch") return COL.red;
  if (ci === "mittel") return COL.amber;
  return COL.green;
}

export async function buildAndSavePdf(result: SollIstResult, roleTriad: Triad, candidateProfile: Triad, filename: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = 210;
  const PH = 297;
  const ML = 18;
  const MR = 18;
  const MT = 18;
  const MB = 16;
  const CW = PW - ML - MR;

  let y = MT;

  function checkPage(needed: number) {
    if (y + needed > PH - MB) {
      doc.addPage();
      y = MT;
    }
  }

  function setColor(rgb: RGB) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
  function setDraw(rgb: RGB) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }
  function setFill(rgb: RGB) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }

  function drawLine(x1: number, yy: number, x2: number, color: RGB = COL.line) {
    setDraw(color);
    doc.setLineWidth(0.3);
    doc.line(x1, yy, x2, yy);
  }

  function wrapText(text: string, maxW: number, fontSize: number): string[] {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxW) as string[];
  }

  function printWrapped(text: string, x: number, maxW: number, fontSize: number, color: RGB, lineH: number, bold = false): number {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    setColor(color);
    const lines = wrapText(text, maxW, fontSize);
    for (const line of lines) {
      checkPage(lineH);
      doc.text(line, x, y);
      y += lineH;
    }
    return lines.length;
  }

  function sectionTitle(num: number, title: string) {
    checkPage(14);
    setFill(COL.lineFaint);
    doc.roundedRect(ML, y - 3.8, 7, 7, 1, 1, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    setColor(COL.light);
    doc.text(String(num), ML + 3.5, y + 0.8, { align: "center" });

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    setColor(COL.black);
    doc.text(title.toUpperCase(), ML + 10, y + 0.5);
    y += 10;
  }

  function separator() {
    checkPage(8);
    y += 3;
    drawLine(ML, y, ML + CW);
    y += 7;
  }

  function bullet(x: number, yy: number, color: RGB) {
    setFill(color);
    doc.circle(x + 1.2, yy - 1.2, 1.2, "F");
  }

  function labelSmall(text: string) {
    checkPage(6);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    setColor(COL.light);
    doc.text(text.toUpperCase(), ML, y);
    y += 5;
  }

  const fitCol = fitRgb(result.fitRating);
  const cCol = controlRgb(result.controlIntensity);
  const cLabel = result.controlIntensity === "hoch" ? "Hoch" : result.controlIntensity === "mittel" ? "Mittel" : "Gering";

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  setColor(COL.faint);
  doc.text("PASSUNGSBERICHT", ML, y);
  const dateStr = new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(dateStr, PW - MR, y, { align: "right" });
  y += 7;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  setColor(COL.black);
  doc.text(result.roleName, ML, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  setColor(COL.mid);
  const personLabel = result.candidateName !== "Die Person" ? result.candidateName : "Person";
  doc.text(`Rolle: ${result.roleConstellationLabel}  |  ${personLabel}: ${result.candConstellationLabel}`, ML, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(COL.dark);
  doc.text("Grundpassung: ", ML, y);
  const gpW = doc.getTextWidth("Grundpassung: ");
  setColor(fitCol);
  doc.text(result.fitLabel, ML + gpW, y);

  const midX = ML + CW / 2;
  setColor(COL.dark);
  doc.text("Führungsaufwand: ", midX, y);
  const faW = doc.getTextWidth("Führungsaufwand: ");
  setColor(cCol);
  doc.text(cLabel, midX + faW, y);
  y += 4;

  setDraw(fitCol);
  doc.setLineWidth(0.8);
  doc.line(ML, y, ML + CW, y);
  y += 8;

  result.summaryText.split("\n\n").forEach(para => {
    printWrapped(para, ML, CW, 8.5, COL.dark, 4.2);
    y += 2;
  });

  if (result.executiveBullets.length > 0) {
    y += 2;
    labelSmall("Warum dieses Ergebnis");
    result.executiveBullets.forEach(b => {
      checkPage(6);
      bullet(ML, y, fitCol);
      printWrapped(b, ML + 5, CW - 5, 8.5, COL.dark, 4.2);
      y += 1;
    });
  }

  if (result.constellationRisks.length > 0) {
    y += 2;
    labelSmall("Risiken dieser Konstellation");
    result.constellationRisks.forEach(r => {
      checkPage(6);
      bullet(ML, y, COL.redDark);
      printWrapped(r, ML + 5, CW - 5, 8.5, COL.dark, 4.2);
      y += 1;
    });
  }

  separator();

  const sameDom = result.roleDomKey === result.candDomKey;
  const candBadges: { key: ComponentKey; label: string }[] = result.candIsEqualDist
    ? (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => ({ key: k, label: COMP_LABELS[k] }))
    : result.candIsDualDom
      ? [{ key: result.candDomKey, label: COMP_LABELS[result.candDomKey] }, { key: result.candDom2Key, label: COMP_LABELS[result.candDom2Key] }]
      : [{ key: result.candDomKey, label: COMP_LABELS[result.candDomKey] }];
  const shiftSymbol = result.candIsEqualDist ? "!=" : result.candIsDualDom ? "<>" : sameDom ? "=" : "->";

  sectionTitle(1, "Unterschied zwischen Rolle und Person");

  checkPage(18);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  setColor(COL.light);
  doc.text("ROLLE", ML + 5, y);
  doc.text("PERSON", ML + CW * 0.6, y);
  y += 2;
  drawLine(ML, y, ML + CW);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(compColor(result.roleDomKey));
  doc.text(COMP_LABELS[result.roleDomKey], ML + 5, y);

  setColor(COL.light);
  doc.setFontSize(12);
  doc.text(shiftSymbol, ML + CW * 0.42, y, { align: "center" });

  doc.setFontSize(9);
  let badgeY = y;
  candBadges.forEach(b => {
    doc.setFont("helvetica", "bold");
    setColor(compColor(b.key));
    doc.text(b.label, ML + CW * 0.6, badgeY);
    badgeY += 5;
  });
  y = Math.max(y + 5, badgeY) + 2;

  printWrapped(result.dominanceShiftText, ML, CW, 8.5, COL.dark, 4.2);

  separator();

  sectionTitle(2, "Vergleich der Profile");

  const keys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
  let maxGap = 0; let maxKey: ComponentKey = "analytisch";
  for (const k of keys) { const g = Math.abs(roleTriad[k] - candidateProfile[k]); if (g > maxGap) { maxGap = g; maxKey = k; } }
  printWrapped(`Die grösste Abweichung liegt im Bereich ${COMP_LABELS[maxKey]}. Genau dort liegt die Kernanforderung der Rolle.`, ML, CW, 8.5, COL.dark, 4.2);
  y += 2;

  checkPage(28);
  const colWidths = [CW * 0.4, CW * 0.15, CW * 0.15, CW * 0.15];
  const colStarts = [ML, ML + colWidths[0], ML + colWidths[0] + colWidths[1], ML + colWidths[0] + colWidths[1] + colWidths[2]];
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  setColor(COL.light);
  doc.text("KOMPONENTE", colStarts[0], y);
  doc.text("ROLLE", colStarts[1] + colWidths[1], y, { align: "right" });
  doc.text("PERSON", colStarts[2] + colWidths[2], y, { align: "right" });
  doc.text("ABWEICHUNG", colStarts[3] + colWidths[3], y, { align: "right" });
  y += 2;
  drawLine(ML, y, ML + CW);
  y += 5;

  for (const k of keys) {
    const rv = Math.round(roleTriad[k]);
    const cv = Math.round(candidateProfile[k]);
    const diff = cv - rv;
    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
    const diffCol = Math.abs(diff) > 10 ? COL.red : Math.abs(diff) > 5 ? COL.amber : COL.dark;

    checkPage(7);
    bullet(colStarts[0], y, compColor(k));
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    setColor(compColor(k));
    doc.text(labelComponent(k), colStarts[0] + 5, y);
    doc.setFont("helvetica", "normal");
    setColor(COL.dark);
    doc.text(`${rv} %`, colStarts[1] + colWidths[1], y, { align: "right" });
    doc.text(`${cv} %`, colStarts[2] + colWidths[2], y, { align: "right" });
    doc.setFont("helvetica", "bold");
    setColor(diffCol);
    doc.text(diffStr, colStarts[3] + colWidths[3], y, { align: "right" });
    y += 3;
    drawLine(ML, y, ML + CW, COL.lineFaint);
    y += 4;
  }

  y += 2;
  labelSmall("Bedeutung der Komponenten");
  const compMeaning: Record<ComponentKey, string> = {
    intuitiv: "Erkennen, was Gesprächspartner oder Team brauchen und Kommunikation darauf abstimmen.",
    impulsiv: "Aufgaben schnell vorantreiben, Prioritäten setzen und Ergebnisse liefern.",
    analytisch: "Strukturen schaffen, Abläufe organisieren und Entscheidungen nachvollziehbar vorbereiten.",
  };
  for (const k of ["intuitiv", "impulsiv", "analytisch"] as ComponentKey[]) {
    checkPage(8);
    bullet(ML, y, compColor(k));
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    setColor(COL.black);
    const nameStr = labelComponent(k);
    doc.text(nameStr, ML + 5, y);
    const nameW = doc.getTextWidth(nameStr);
    doc.setFont("helvetica", "normal");
    setColor(COL.mid);
    doc.text(` – ${compMeaning[k]}`, ML + 5 + nameW, y);
    y += 5;
  }

  separator();

  sectionTitle(3, "Wirkung der Besetzung im Arbeitsalltag");
  result.impactAreas.forEach((area, idx) => {
    const sevCol = area.severity === "critical" ? COL.red : area.severity === "warning" ? COL.amber : COL.green;
    checkPage(22);
    bullet(ML, y, sevCol);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    setColor(COL.black);
    const labelStr = area.label;
    doc.text(labelStr, ML + 5, y);
    const lw = doc.getTextWidth(labelStr);
    doc.setFontSize(7.5);
    setColor(sevCol);
    doc.text(` ${severityLabel(area.severity)}`, ML + 5 + lw, y);
    y += 5;
    printWrapped(area.roleNeed, ML + 5, CW - 5, 8.5, COL.black, 4.2, true);
    printWrapped(area.candidatePattern, ML + 5, CW - 5, 8.5, COL.dark, 4.2);
    doc.setFont("helvetica", "italic");
    printWrapped(area.risk, ML + 5, CW - 5, 8.5, COL.mid, 4.2);
    if (idx < result.impactAreas.length - 1) {
      y += 1;
      drawLine(ML, y, ML + CW, COL.lineFaint);
      y += 4;
    }
  });

  separator();

  sectionTitle(4, "Verhalten unter Druck");
  checkPage(12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COL.amber);
  doc.text("KONTROLLIERTER DRUCK", ML, y);
  y += 5;
  printWrapped(result.stressBehavior.controlledPressure, ML, CW, 8.5, COL.dark, 4.2);
  y += 2;

  checkPage(12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COL.red);
  doc.text("UNKONTROLLIERTER STRESS", ML, y);
  y += 5;
  printWrapped(result.stressBehavior.uncontrolledStress, ML, CW, 8.5, COL.dark, 4.2);
  y += 2;
  doc.setFont("helvetica", "italic");
  printWrapped("Unter zunehmendem Arbeitsdruck können sich diese Verhaltensmuster verstärken. Dadurch entstehen im Arbeitsalltag Risiken für Abstimmung, Führung und Zusammenarbeit.", ML, CW, 8.5, COL.mid, 4.2);

  separator();

  sectionTitle(5, "Risikoprognose");
  result.riskTimeline.forEach((phase, i) => {
    const phaseCol = i === 0 ? COL.green : i === 1 ? COL.amber : COL.red;
    checkPage(14);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(phaseCol);
    const phaseLabel = phase.label;
    doc.text(phaseLabel, ML, y);
    const plW = doc.getTextWidth(phaseLabel + " ");
    doc.setFont("helvetica", "normal");
    setColor(COL.light);
    doc.text(phase.period, ML + plW, y);
    y += 5;
    printWrapped(phase.text, ML, CW, 8.5, COL.dark, 4.2);
    if (i < result.riskTimeline.length - 1) {
      y += 1;
      drawLine(ML, y, ML + CW, COL.lineFaint);
      y += 4;
    }
  });

  separator();

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
  const rGaugeCol = rDev === 3 ? COL.green : rDev === 2 ? COL.amber : COL.red;
  const rFitColorRgb = hexToRgb(rFitColor);

  sectionTitle(6, "Gesamtbewertung");

  checkPage(22);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  setColor(COL.dark);
  doc.text("Rolle", ML, y);
  doc.setFont("helvetica", "bold");
  setColor(COL.black);
  doc.text(result.roleName, ML + 45, y);
  y += 3;
  drawLine(ML, y, ML + CW);
  y += 5;

  doc.setFont("helvetica", "bold");
  setColor(COL.dark);
  doc.text("Grundpassung", ML, y);
  setColor(rFitColorRgb);
  doc.text(rFitLabel, ML + 45, y);
  y += 3;
  drawLine(ML, y, ML + CW);
  y += 5;

  doc.setFont("helvetica", "bold");
  setColor(COL.dark);
  doc.text("Entwicklungsprognose", ML, y);
  setColor(rGaugeCol);
  doc.text(`${rDev} von 3`, ML + 45, y);
  const devNumW = doc.getTextWidth(`${rDev} von 3 `);
  doc.setFont("helvetica", "normal");
  setColor(COL.dark);
  doc.text(rDevLabel, ML + 45 + devNumW, y);
  y += 3;
  drawLine(ML, y, ML + CW);
  y += 6;

  setDraw(rFitColorRgb);
  doc.setLineWidth(0.6);
  doc.line(ML, y, ML, y + 8);
  printWrapped(rFazit, ML + 4, CW - 4, 8.5, COL.dark, 4.2);
  y += 3;
  printWrapped(result.developmentText, ML, CW, 8.5, COL.dark, 4.2);
  y += 3;

  drawLine(ML, y, ML + CW);
  y += 5;
  labelSmall("Managementeinschätzung");
  const mgmtText = rFitLabel === "Geeignet"
    ? "Die Arbeitsweise der Person und die Anforderungen der Rolle stimmen gut überein. Eine stabile Besetzung ist ohne erhöhten Führungsaufwand möglich. Aus Managementsicht wird diese Besetzung empfohlen."
    : rFitLabel === "Bedingt geeignet"
    ? "Die Arbeitsweise der Person weicht in einzelnen Bereichen von den Anforderungen der Rolle ab. Eine stabile Besetzung ist mit gezielter Führung und regelmässiger Rückmeldung möglich. Aus Managementsicht ist diese Besetzung unter Voraussetzungen vertretbar."
    : "Die strukturelle Abweichung zwischen Rolle und Person ist deutlich. Eine stabile Besetzung wäre nur mit dauerhaft erhöhtem Führungsaufwand möglich. Aus Managementsicht wird diese Besetzung nicht empfohlen.";
  printWrapped(mgmtText, ML, CW, 8.5, COL.dark, 4.2);

  if (result.integrationsplan) {
    separator();
    sectionTitle(7, "30-Tage-Integrationsplan");
    result.integrationsplan.forEach((phase, idx) => {
      const phaseCol = phase.num === 1 ? COL.blue : phase.num === 2 ? COL.intuitiv : COL.green;
      checkPage(20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      setColor(phaseCol);
      doc.text(`Phase ${phase.num}: ${phase.title}`, ML, y);
      doc.setFont("helvetica", "normal");
      setColor(COL.light);
      const ptW = doc.getTextWidth(`Phase ${phase.num}: ${phase.title} `);
      doc.text(`(${phase.period})`, ML + ptW, y);
      y += 5;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      setColor(COL.dark);
      doc.text(`Ziel: ${phase.ziel}`, ML, y);
      y += 6;

      labelSmall("Massnahmen");
      phase.items.forEach(item => {
        checkPage(6);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        setColor(phaseCol);
        doc.text("–", ML, y);
        doc.setFont("helvetica", "normal");
        setColor(COL.dark);
        const lines = wrapText(item, CW - 6, 8.5);
        lines.forEach(line => {
          checkPage(4.5);
          doc.text(line, ML + 5, y);
          y += 4.2;
        });
        y += 1;
      });

      checkPage(10);
      y += 2;
      setDraw(phaseCol);
      doc.setLineWidth(0.4);
      doc.line(ML + 3, y, ML + 3, y + 10);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      setColor(phaseCol);
      doc.text("INTEGRATIONSFOKUS", ML + 6, y + 2);
      y += 6;
      printWrapped(phase.fokus.intro, ML + 6, CW - 8, 8.5, COL.dark, 4.2);
      phase.fokus.bullets.forEach(b => {
        checkPage(6);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        setColor(phaseCol);
        doc.text("–", ML + 6, y);
        doc.setFont("helvetica", "normal");
        setColor(COL.dark);
        const lines = wrapText(b, CW - 12, 8.5);
        lines.forEach(line => {
          checkPage(4.5);
          doc.text(line, ML + 10, y);
          y += 4.2;
        });
      });
      if (idx < result.integrationsplan!.length - 1) {
        y += 2;
        drawLine(ML, y, ML + CW, COL.lineFaint);
        y += 5;
      }
    });
  }

  separator();

  const finalSecNum = result.integrationsplan ? 8 : 7;
  sectionTitle(finalSecNum, "Gesamtbewertung");

  checkPage(14);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  setColor(COL.dark);
  doc.text("Grundpassung: ", ML, y);
  const gpW2 = doc.getTextWidth("Grundpassung: ");
  setColor(fitCol);
  doc.text(result.fitLabel, ML + gpW2, y);

  const fDevCol = rGaugeCol;
  const fDevLabel = result.developmentLabel === "hoch" ? "Entwicklung sehr wahrscheinlich" : result.developmentLabel === "mittel" ? "Entwicklung mit Unterstützung möglich" : "Entwicklung unwahrscheinlich";
  setColor(COL.dark);
  doc.text("Entwicklungsprognose: ", midX, y);
  const epW = doc.getTextWidth("Entwicklungsprognose: ");
  setColor(fDevCol);
  doc.text(fDevLabel, midX + epW, y);
  y += 3;
  drawLine(ML, y, ML + CW);
  y += 6;

  printWrapped(result.finalText, ML, CW, 8.5, COL.dark, 4.2);

  y += 6;
  drawLine(ML, y, ML + CW);
  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COL.faint);
  doc.text("bioLogic Passungsanalyse", ML, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(dateStr, PW - MR, y, { align: "right" });

  doc.save(filename);
}
