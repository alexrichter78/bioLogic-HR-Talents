import type { SollIstResult, Severity } from "./soll-ist-engine";
import type { ComponentKey, Triad } from "./jobcheck-engine";
import { labelComponent } from "./jobcheck-engine";
import { getLogoDataUrl } from "./logo-base64";
import { SECTION_COLORS } from "./bio-design";

const COMP_LABELS: Record<ComponentKey, string> = {
  impulsiv: "Umsetzung / Tempo",
  intuitiv: "Zusammenarbeit / Kommunikation",
  analytisch: "Struktur / Analyse",
};

const COMP_SHORT: Record<ComponentKey, string> = {
  impulsiv: "Impulsiv",
  intuitiv: "Intuitiv",
  analytisch: "Analytisch",
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

const C = {
  black: [40, 40, 42] as RGB,
  dark: [75, 75, 80] as RGB,
  mid: [120, 120, 128] as RGB,
  light: [155, 155, 162] as RGB,
  faint: [185, 185, 192] as RGB,
  line: [220, 220, 225] as RGB,
  lineFaint: [240, 240, 244] as RGB,
  bg: [248, 248, 251] as RGB,
  white: [255, 255, 255] as RGB,
  green: hexToRgb("#3A9A5C"),
  greenLight: [235, 248, 240] as RGB,
  amber: hexToRgb("#E5A832"),
  amberLight: [255, 249, 232] as RGB,
  red: hexToRgb("#D64045"),
  redLight: [254, 237, 237] as RGB,
  impulsiv: hexToRgb("#C41E3A"),
  intuitiv: hexToRgb("#F39200"),
  analytisch: hexToRgb("#1A5DAB"),
  blue: hexToRgb("#1A5DAB"),
  headerBg: [250, 250, 253] as RGB,
  headerAccent: hexToRgb("#1A5DAB"),
};

const compColor = (k: ComponentKey): RGB => C[k];

function fitRgb(rating: string): RGB {
  if (rating === "GEEIGNET") return C.green;
  if (rating === "BEDINGT") return C.amber;
  return C.red;
}
function fitBgRgb(rating: string): RGB {
  if (rating === "GEEIGNET") return C.greenLight;
  if (rating === "BEDINGT") return C.amberLight;
  return C.redLight;
}

function controlRgb(ci: string): RGB {
  if (ci === "hoch") return C.red;
  if (ci === "mittel") return C.amber;
  return C.green;
}

export async function buildAndSavePdf(result: SollIstResult, roleTriad: Triad, candidateProfile: Triad, filename: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let logoDataUrl: string | null = null;
  try { logoDataUrl = await getLogoDataUrl(); } catch (_) {}

  const PW = 210;
  const PH = 297;
  const ML = 16;
  const MR = 16;
  const MT = 14;
  const MB = 18;
  const CW = PW - ML - MR;
  const midX = ML + CW / 2;
  let pageNum = 1;
  let y = MT;

  function setC(rgb: RGB) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
  function setD(rgb: RGB) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }
  function setF(rgb: RGB) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }

  function drawFooter() {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    setC(C.faint);
    doc.text("bioLogic Passungsanalyse", ML, PH - 8);
    doc.text(`Seite ${pageNum}`, PW - MR, PH - 8, { align: "right" });
    setD(C.lineFaint);
    doc.setLineWidth(0.2);
    doc.line(ML, PH - 11, ML + CW, PH - 11);
  }

  drawFooter();

  function newPage() {
    doc.addPage();
    pageNum++;
    y = MT;
    drawFooter();
  }

  function checkPage(needed: number) {
    if (y + needed > PH - MB) { newPage(); }
  }

  function hline(x1: number, yy: number, x2: number, color: RGB = C.line, w = 0.3) {
    setD(color);
    doc.setLineWidth(w);
    doc.line(x1, yy, x2, yy);
  }

  function wrap(text: string, maxW: number, fontSize: number): string[] {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxW) as string[];
  }

  function printText(text: string, x: number, maxW: number, fontSize: number, color: RGB, lineH: number, style: string = "normal"): number {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", style);
    setC(color);
    const lines = wrap(text, maxW, fontSize);
    for (const line of lines) {
      checkPage(lineH);
      doc.text(line, x, y);
      y += lineH;
    }
    return lines.length;
  }

  function sectionHead(num: number, title: string, accentColor: RGB = C.analytisch) {
    checkPage(16);
    y += 2;

    setF(accentColor);
    doc.roundedRect(ML, y - 4.5, CW, 9, 1.5, 1.5, "F");

    setF(C.white);
    doc.roundedRect(ML + 3, y - 3.2, 6.5, 6.5, 1, 1, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setC(accentColor);
    doc.text(String(num), ML + 6.25, y + 1, { align: "center" });

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    setC(C.white);
    doc.text(title.toUpperCase(), ML + 12, y + 1);
    y += 10;
  }

  function separator(nextSectionMinH: number = 10) {
    const lineSpace = 10;
    if (y + lineSpace + nextSectionMinH > PH - MB) {
      newPage();
      return;
    }
    y += 4;
    hline(ML, y, ML + CW, C.lineFaint);
    y += 6;
  }

  function dot(x: number, yy: number, color: RGB, r = 1.2) {
    setF(color);
    doc.circle(x + r, yy - r, r, "F");
  }

  function labelTag(text: string) {
    checkPage(7);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    setC(C.light);
    doc.text(text.toUpperCase(), ML, y);
    y += 4.5;
  }

  function badge(x: number, yy: number, text: string, bgColor: RGB, textColor: RGB, w?: number) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const tw = w || doc.getTextWidth(text) + 6;
    setF(bgColor);
    doc.roundedRect(x, yy - 4, tw, 7, 1.5, 1.5, "F");
    setC(textColor);
    doc.text(text, x + tw / 2, yy + 0.3, { align: "center" });
    return tw;
  }

  function bgBox(x: number, yy: number, w: number, h: number, color: RGB, borderColor?: RGB) {
    setF(color);
    doc.roundedRect(x, yy, w, h, 2, 2, "F");
    if (borderColor) {
      setD(borderColor);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, yy, w, h, 2, 2, "S");
    }
  }

  function drawBar(x: number, yy: number, maxW: number, pct: number, color: RGB, h: number = 5) {
    setF(C.lineFaint);
    doc.roundedRect(x, yy, maxW, h, h / 2, h / 2, "F");
    if (pct > 0) {
      const barW = Math.max(h, (pct / 100) * maxW);
      setF(color);
      doc.roundedRect(x, yy, barW, h, h / 2, h / 2, "F");
    }
  }

  const fitCol = fitRgb(result.fitRating);
  const fitBg = fitBgRgb(result.fitRating);
  const cCol = controlRgb(result.controlIntensity);
  const cLabel = result.controlIntensity === "hoch" ? "Hoch" : result.controlIntensity === "mittel" ? "Mittel" : "Gering";
  const dateStr = new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" });
  const personLabel = result.candidateName !== "Die Person" ? result.candidateName : "Person";

  const roleDomCol = compColor(result.roleDomKey);
  const candDomCol = compColor(result.candDomKey);
  const headerBgRgb: RGB = [52, 58, 72];
  const headerTextDim: RGB = [160, 165, 180];
  const headerTextSubtle: RGB = [130, 135, 148];
  const headerDivider: RGB = [82, 87, 99];
  const badgeBgBlend: RGB = [82, 87, 99];

  const devLevel = result.developmentLevel;
  const devScore = devLevel >= 4 ? 3 : devLevel >= 3 ? 2 : 1;
  const devLabel = devScore === 3 ? "gering" : devScore === 2 ? "mittel" : "hoch";
  const devCol: RGB = devScore === 3 ? C.green : devScore === 2 ? C.amber : C.red;
  const gapCol: RGB = result.totalGap > 40 ? C.red : result.totalGap > 20 ? C.amber : C.green;

  const blockInner = CW;

  const shiftFirst = result.dominanceShiftText.split(/\n\n+/)[0];
  const shiftLines = wrap(shiftFirst, blockInner, 8);
  const summaryFirst = result.summaryText.split(/\n\n+/)[0];
  const fazitLines = wrap(summaryFirst, blockInner - 6, 8);

  const metricW = blockInner / 4 - 1.5;
  const metricH = 14;
  const metricGap = 2;
  const rowH = 5.5;

  const metrics = [
    { label: "Grundpassung", value: result.fitLabel, color: fitCol },
    { label: "Führungsaufwand", value: cLabel, color: cCol },
    { label: "Profilabweichung", value: result.gapLevel, color: gapCol },
    { label: "Entwicklungsaufwand", value: devLabel, color: devCol },
  ];
  const overviewRows = [
    { label: "Rollenprofil", value: result.roleConstellationLabel, color: C.white },
    { label: `${personLabel}profil`, value: result.candConstellationLabel, color: C.white },
    { label: "Soll-Ist-Abweichung", value: `${result.totalGap} Punkte`, color: gapCol },
  ];

  let bulletLines = 0;
  result.executiveBullets.forEach(b => { bulletLines += wrap(b, blockInner - 8, 8).length; });
  let riskLines = 0;
  result.constellationRisks.forEach(r => { riskLines += wrap(r, blockInner - 8, 8).length; });

  let estH = MT + 14 + 10 + 4 + metricH + 5 + 4 + (overviewRows.length * rowH) + 2 + 4 + (2 * rowH) + 2 + (shiftLines.length * 4) + 4 + 4 + (fazitLines.length * 4);
  if (bulletLines > 0) estH += 7 + bulletLines * 4;
  if (riskLines > 0) estH += 7 + riskLines * 4;
  estH += 12;

  setF(headerBgRgb);
  doc.rect(0, 0, PW, estH, "F");

  let hY = MT;

  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, "PNG", ML, hY - 2, 24, 9); } catch (_) {}
  }
  const logoEndX = ML + (logoDataUrl ? 27 : 0);

  setD(headerDivider);
  doc.setLineWidth(0.3);
  const dividerX = logoEndX + 3;
  doc.line(dividerX, hY - 1, dividerX, hY + 6);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  setC(headerTextDim);
  doc.text("PASSUNGSBERICHT", dividerX + 4, hY + 3.5);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  setC(headerTextSubtle);
  doc.text(dateStr, PW - MR, hY + 3.5, { align: "right" });

  hY += 14;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  setC(C.white);
  doc.text(result.roleName, ML, hY);
  hY += 10;

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  setC(headerTextSubtle);
  doc.text("SYSTEMSTATUS", ML, hY);
  hY += 4;

  metrics.forEach((m, i) => {
    const mx = ML + i * (metricW + metricGap);
    setF(badgeBgBlend);
    doc.roundedRect(mx, hY, metricW, metricH, 1.5, 1.5, "F");
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    setC(headerTextSubtle);
    doc.text(m.label.toUpperCase(), mx + 3, hY + 5);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    setC(m.color);
    doc.text(m.value, mx + 3, hY + 11);
  });
  hY += metricH + 5;

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  setC(headerTextSubtle);
  doc.text("SYSTEMÜBERBLICK", ML, hY);
  hY += 4;

  overviewRows.forEach(row => {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setC(headerTextDim);
    doc.text(row.label, ML, hY);
    doc.setFont("helvetica", "bold");
    setC(row.color);
    doc.text(row.value, ML + blockInner, hY, { align: "right" });
    hY += rowH;
  });
  hY += 2;

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  setC(headerTextSubtle);
  doc.text("STRUKTURKONSTELLATION", ML, hY);
  hY += 4;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  setC(headerTextDim);
  doc.text("Dominanz Rolle", ML, hY);
  doc.setFont("helvetica", "bold");
  setC(roleDomCol);
  doc.text(COMP_LABELS[result.roleDomKey], ML + blockInner, hY, { align: "right" });
  hY += rowH;

  doc.setFont("helvetica", "normal");
  setC(headerTextDim);
  doc.text("Dominanz Person", ML, hY);
  doc.setFont("helvetica", "bold");
  setC(candDomCol);
  doc.text(COMP_LABELS[result.candDomKey], ML + blockInner, hY, { align: "right" });
  hY += rowH + 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  shiftLines.forEach(line => {
    setC(headerTextDim);
    doc.text(line, ML, hY);
    hY += 4;
  });
  hY += 4;

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  setC(headerTextSubtle);
  doc.text("MANAGEMENTKURZFAZIT", ML, hY);
  hY += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  fazitLines.forEach(line => {
    setC(headerTextDim);
    doc.text(line, ML + 4, hY);
    hY += 4;
  });

  if (result.executiveBullets.length > 0) {
    hY += 3;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    setC(headerTextSubtle);
    doc.text("WARUM DIESES ERGEBNIS", ML, hY);
    hY += 4;
    result.executiveBullets.forEach(b => {
      const bLines = wrap(b, blockInner - 8, 8);
      setF(fitCol);
      doc.circle(ML + 1.5, hY - 1.2, 1.2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      bLines.forEach((line, li) => {
        setC(headerTextDim);
        doc.text(line, ML + 5, hY);
        hY += 4;
      });
    });
  }

  if (result.constellationRisks.length > 0) {
    hY += 3;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    setC(headerTextSubtle);
    doc.text("RISIKEN DIESER KONSTELLATION", ML, hY);
    hY += 4;
    result.constellationRisks.forEach(r => {
      const rLines = wrap(r, blockInner - 8, 8);
      setF(C.red);
      doc.circle(ML + 1.5, hY - 1.2, 1.2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      rLines.forEach(line => {
        setC(headerTextDim);
        doc.text(line, ML + 5, hY);
        hY += 4;
      });
    });
  }

  y = Math.max(hY + 10, estH + 4);

  separator(70);

  sectionHead(2, "Soll-Ist Profil", hexToRgb(SECTION_COLORS.sollIstProfil));

  const barMaxW = 55;
  const barH = 5.5;
  const halfW = CW / 2 - 4;
  const leftBoxX = ML;
  const rightBoxX = midX + 4;
  const profileTotalH = 52;

  checkPage(profileTotalH + 4);

  bgBox(leftBoxX, y, halfW, profileTotalH, C.bg, C.lineFaint);
  bgBox(rightBoxX, y, halfW, profileTotalH, C.bg, C.lineFaint);

  const boxPad = 6;
  let leftY = y + boxPad;
  let rightY = y + boxPad;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  doc.text("Soll-Profil ", leftBoxX + boxPad, leftY);
  doc.setFont("helvetica", "normal");
  setC(C.mid);
  doc.text("(Rolle)", leftBoxX + boxPad + doc.getTextWidth("Soll-Profil "), leftY);
  leftY += 7;

  doc.setFont("helvetica", "bold");
  setC(C.black);
  doc.text("Ist-Profil ", rightBoxX + boxPad, rightY);
  doc.setFont("helvetica", "normal");
  setC(C.mid);
  doc.text("(Person)", rightBoxX + boxPad + doc.getTextWidth("Ist-Profil "), rightY);
  rightY += 7;

  const keys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];

  for (const k of keys) {
    const rv = Math.round(roleTriad[k]);
    const cv = Math.round(candidateProfile[k]);
    const col = compColor(k);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setC(C.mid);
    doc.text(COMP_SHORT[k], leftBoxX + boxPad, leftY + 1);
    drawBar(leftBoxX + boxPad + 22, leftY - 2.5, barMaxW, rv, col, barH);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    if (rv > 12) {
      setC(C.white);
      doc.text(`${rv} %`, leftBoxX + boxPad + 22 + 3, leftY + 1.2);
    } else {
      setC(col);
      doc.text(`${rv} %`, leftBoxX + boxPad + 22 + Math.max(barH, (rv / 100) * barMaxW) + 2, leftY + 1.2);
    }
    leftY += 11;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setC(C.mid);
    doc.text(COMP_SHORT[k], rightBoxX + boxPad, rightY + 1);
    drawBar(rightBoxX + boxPad + 22, rightY - 2.5, barMaxW, cv, col, barH);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    if (cv > 12) {
      setC(C.white);
      doc.text(`${cv} %`, rightBoxX + boxPad + 22 + 3, rightY + 1.2);
    } else {
      setC(col);
      doc.text(`${cv} %`, rightBoxX + boxPad + 22 + Math.max(barH, (cv / 100) * barMaxW) + 2, rightY + 1.2);
    }
    rightY += 11;
  }

  y += profileTotalH + 6;

  let maxGap = 0; let maxKey: ComponentKey = "analytisch";
  for (const k of keys) { const g = Math.abs(roleTriad[k] - candidateProfile[k]); if (g > maxGap) { maxGap = g; maxKey = k; } }
  printText(`Die grösste Abweichung liegt im Bereich ${COMP_LABELS[maxKey]}. Genau dort liegt die Kernanforderung der Rolle.`, ML, CW, 9, C.dark, 4.5);
  y += 2;
  labelTag("Bedeutung der Komponenten");
  const compMeaning: Record<ComponentKey, string> = {
    intuitiv: "Erkennen, was Gesprächspartner oder Team brauchen und Kommunikation darauf abstimmen.",
    impulsiv: "Aufgaben schnell vorantreiben, Prioritäten setzen und Ergebnisse liefern.",
    analytisch: "Strukturen schaffen, Abläufe organisieren und Entscheidungen nachvollziehbar vorbereiten.",
  };
  for (const k of ["intuitiv", "impulsiv", "analytisch"] as ComponentKey[]) {
    checkPage(8);
    dot(ML, y, compColor(k));
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    setC(C.black);
    const nameStr = labelComponent(k);
    doc.text(nameStr, ML + 5, y);
    const nameW = doc.getTextWidth(nameStr);
    doc.setFont("helvetica", "normal");
    setC(C.mid);
    const descLines = wrap(` – ${compMeaning[k]}`, CW - 5 - nameW, 9);
    doc.text(descLines[0], ML + 5 + nameW, y);
    if (descLines.length > 1) {
      for (let i = 1; i < descLines.length; i++) {
        y += 4.5;
        checkPage(4.5);
        doc.text(descLines[i], ML + 5, y);
      }
    }
    y += 5.5;
  }

  separator(50);

  sectionHead(3, "Wirkung der Besetzung im Arbeitsalltag", hexToRgb(SECTION_COLORS.wirkung));
  result.impactAreas.forEach((area, idx) => {
    const sevCol = area.severity === "critical" ? C.red : area.severity === "warning" ? C.amber : C.green;
    const sevBg = area.severity === "critical" ? C.redLight : area.severity === "warning" ? C.amberLight : C.greenLight;
    checkPage(24);

    dot(ML, y, sevCol, 1.5);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    setC(C.black);
    const labelStr = area.label;
    doc.text(labelStr, ML + 5, y);
    const lw = doc.getTextWidth(labelStr + " ");
    badge(ML + 5 + lw, y, severityLabel(area.severity), sevBg, sevCol, 22);
    y += 6;
    printText(area.roleNeed, ML + 5, CW - 5, 9, C.black, 4.5, "bold");
    printText(area.candidatePattern, ML + 5, CW - 5, 9, C.dark, 4.5);
    printText(area.risk, ML + 5, CW - 5, 9, C.mid, 4.5, "italic");
    if (idx < result.impactAreas.length - 1) {
      y += 2;
      hline(ML + 5, y, ML + CW - 5, C.lineFaint);
      y += 5;
    }
  });

  separator(60);

  sectionHead(4, "Verhalten unter Druck", hexToRgb(SECTION_COLORS.druck));
  checkPage(14);

  setF(C.amberLight);
  doc.roundedRect(ML, y - 1, CW, 0.8, 0.4, 0.4, "F");
  y += 3;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  setC(C.amber);
  doc.text("KONTROLLIERTER DRUCK", ML, y);
  y += 5;
  printText(result.stressBehavior.controlledPressure, ML, CW, 9, C.dark, 4.5);
  y += 3;

  checkPage(14);
  setF(C.redLight);
  doc.roundedRect(ML, y - 1, CW, 0.8, 0.4, 0.4, "F");
  y += 3;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  setC(C.red);
  doc.text("UNKONTROLLIERTER STRESS", ML, y);
  y += 5;
  printText(result.stressBehavior.uncontrolledStress, ML, CW, 9, C.dark, 4.5);
  y += 3;
  printText("Unter zunehmendem Arbeitsdruck können sich diese Verhaltensmuster verstärken. Dadurch entstehen im Arbeitsalltag Risiken für Abstimmung, Führung und Zusammenarbeit.", ML, CW, 9, C.mid, 4.5, "italic");

  separator(50);

  sectionHead(5, "Risikoprognose", hexToRgb(SECTION_COLORS.risiko));
  result.riskTimeline.forEach((phase, i) => {
    const phaseCol = i === 0 ? C.green : i === 1 ? C.amber : C.red;
    const phaseBg = i === 0 ? C.greenLight : i === 1 ? C.amberLight : C.redLight;
    checkPage(16);

    setF(phaseBg);
    doc.roundedRect(ML, y - 3, CW, 7, 1.2, 1.2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setC(phaseCol);
    const phLabel = phase.label;
    doc.text(phLabel, ML + 3, y + 1);
    doc.setFont("helvetica", "normal");
    setC(C.mid);
    doc.text(" - " + phase.period, ML + 3 + doc.getTextWidth(phLabel), y + 1);
    y += 8;
    printText(phase.text, ML, CW, 9, C.dark, 4.5);
    if (i < result.riskTimeline.length - 1) {
      y += 3;
    }
  });

  separator(50);

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
  const rGaugeCol = rDev === 3 ? C.green : rDev === 2 ? C.amber : C.red;
  const rFitColorRgb = hexToRgb(rFitColor);

  sectionHead(6, "Gesamtbewertung", hexToRgb(SECTION_COLORS.gesamtbewertung));

  checkPage(30);

  const summBoxH = 26;
  bgBox(ML, y, CW, summBoxH, C.bg, C.lineFaint);

  const sy = y + 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setC(C.mid);
  doc.text("Rolle", ML + 5, sy);
  setC(C.black);
  doc.text(result.roleName, ML + 42, sy);

  doc.setFont("helvetica", "bold");
  setC(C.mid);
  doc.text("Grundpassung", ML + 5, sy + 8);
  badge(ML + 42, sy + 8, rFitLabel, fitBg, fitCol);

  doc.setFont("helvetica", "bold");
  setC(C.mid);
  doc.text("Entwicklung", ML + 5, sy + 16);
  setC(rGaugeCol);
  doc.setFont("helvetica", "bold");
  doc.text(`${rDev} / 3`, ML + 42, sy + 16);
  doc.setFont("helvetica", "normal");
  setC(C.dark);
  doc.text(rDevLabel, ML + 54, sy + 16);

  y += summBoxH + 6;

  setD(rFitColorRgb);
  doc.setLineWidth(0.7);
  const rFazitLines = wrap(rFazit, CW - 6, 9);
  const fazitH = rFazitLines.length * 4.5 + 2;
  doc.line(ML, y, ML, y + fazitH);
  printText(rFazit, ML + 5, CW - 6, 9, C.dark, 4.5);
  y += 3;
  printText(result.developmentText, ML, CW, 9, C.dark, 4.5);
  y += 4;

  checkPage(20);
  const mgmtText = rFitLabel === "Geeignet"
    ? "Die Arbeitsweise der Person und die Anforderungen der Rolle stimmen gut überein. Eine stabile Besetzung ist ohne erhöhten Führungsaufwand möglich. Aus Managementsicht wird diese Besetzung empfohlen."
    : rFitLabel === "Bedingt geeignet"
    ? "Die Arbeitsweise der Person weicht in einzelnen Bereichen von den Anforderungen der Rolle ab. Eine stabile Besetzung ist mit gezielter Führung und regelmässiger Rückmeldung möglich. Aus Managementsicht ist diese Besetzung unter Voraussetzungen vertretbar."
    : "Die strukturelle Abweichung zwischen Rolle und Person ist deutlich. Eine stabile Besetzung wäre nur mit dauerhaft erhöhtem Führungsaufwand möglich. Aus Managementsicht wird diese Besetzung nicht empfohlen.";

  const mgmtLines = wrap(mgmtText, CW - 10, 9);
  const mgmtBoxH = mgmtLines.length * 4.5 + 12;
  bgBox(ML, y, CW, mgmtBoxH, fitBg);
  y += 5;
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  setC(fitCol);
  doc.text("MANAGEMENTEINSCHÄTZUNG", ML + 5, y);
  y += 4.5;
  printText(mgmtText, ML + 5, CW - 10, 9, C.dark, 4.5);
  y += 4;

  if (result.integrationsplan) {
    separator(40);
    sectionHead(7, "30-Tage-Integrationsplan", hexToRgb(SECTION_COLORS.integrationsplan));
    result.integrationsplan.forEach((phase, idx) => {
      const phaseCol = phase.num === 1 ? C.blue : phase.num === 2 ? C.intuitiv : C.green;
      checkPage(22);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      setC(phaseCol);
      doc.text(`Phase ${phase.num}: ${phase.title}`, ML, y);
      doc.setFont("helvetica", "normal");
      setC(C.light);
      const ptW = doc.getTextWidth(`Phase ${phase.num}: ${phase.title} `);
      doc.text(`(${phase.period})`, ML + ptW, y);
      y += 5;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      setC(C.dark);
      doc.text(`Ziel: ${phase.ziel}`, ML, y);
      y += 6;

      labelTag("Massnahmen");
      phase.items.forEach(item => {
        checkPage(6);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        setC(phaseCol);
        doc.text("–", ML, y);
        doc.setFont("helvetica", "normal");
        setC(C.dark);
        const lines = wrap(item, CW - 6, 9);
        lines.forEach(line => {
          checkPage(4.5);
          doc.text(line, ML + 5, y);
          y += 4.5;
        });
        y += 1;
      });

      checkPage(12);
      y += 2;
      setD(phaseCol);
      doc.setLineWidth(0.5);
      const fokusStartY = y;
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      setC(phaseCol);
      doc.text("INTEGRATIONSFOKUS", ML + 6, y + 2);
      y += 6;
      printText(phase.fokus.intro, ML + 6, CW - 8, 9, C.dark, 4.5);
      phase.fokus.bullets.forEach(b => {
        checkPage(6);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        setC(phaseCol);
        doc.text("–", ML + 6, y);
        doc.setFont("helvetica", "normal");
        setC(C.dark);
        const lines = wrap(b, CW - 14, 9);
        lines.forEach(line => {
          checkPage(4.5);
          doc.text(line, ML + 10, y);
          y += 4.5;
        });
      });
      doc.line(ML + 3, fokusStartY, ML + 3, y);
      if (idx < result.integrationsplan!.length - 1) {
        y += 3;
        hline(ML, y, ML + CW, C.lineFaint);
        y += 5;
      }
    });
  }

  separator(30);

  const finalSecNum = result.integrationsplan ? 8 : 7;
  sectionHead(finalSecNum, "Schlussbewertung", hexToRgb(SECTION_COLORS.schlussbewertung));

  checkPage(16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setC(C.dark);
  doc.text("Grundpassung: ", ML, y);
  const gpW2 = doc.getTextWidth("Grundpassung: ");
  setC(fitCol);
  doc.text(result.fitLabel, ML + gpW2, y);

  const fDevCol = rGaugeCol;
  const fDevLabel = result.developmentLabel === "hoch" ? "Entwicklung sehr wahrscheinlich" : result.developmentLabel === "mittel" ? "Entwicklung mit Unterstützung möglich" : "Entwicklung unwahrscheinlich";
  setC(C.dark);
  doc.text("Entwicklungsprognose: ", midX, y);
  const epW = doc.getTextWidth("Entwicklungsprognose: ");
  setC(fDevCol);
  doc.text(fDevLabel, midX + epW, y);
  y += 3;
  hline(ML, y, ML + CW);
  y += 6;

  printText(result.finalText, ML, CW, 9, C.dark, 4.5);

  doc.save(filename);
}
