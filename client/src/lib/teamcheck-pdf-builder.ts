import type { TeamCheckV3Result } from "./teamcheck-v3-engine";
import type { ComponentKey } from "./jobcheck-engine";
import { getLogoDataUrl } from "./logo-base64";
import { TC_SECTION_COLORS, BIO_COLORS } from "./bio-design";

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
};

const compColor = (k: ComponentKey): RGB => C[k];

function passungRgb(p: string): RGB {
  if (p === "Passend") return C.green;
  if (p === "Bedingt passend") return C.amber;
  return C.red;
}
function passungBgRgb(p: string): RGB {
  if (p === "Passend") return C.greenLight;
  if (p === "Bedingt passend") return C.amberLight;
  return C.redLight;
}
function steuerRgb(s: string): RGB {
  if (s === "gering") return C.green;
  if (s === "mittel") return C.amber;
  return C.red;
}

export async function buildTeamCheckPdf(result: TeamCheckV3Result, filename: string) {
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
    doc.text("bioLogic Talent Navigator · TeamCheck", ML, PH - 8);
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

  const pCol = passungRgb(result.passung);
  const pBg = passungBgRgb(result.passung);
  const sCol = steuerRgb(result.steuerungsaufwand);
  const sLabel = result.steuerungsaufwand.charAt(0).toUpperCase() + result.steuerungsaufwand.slice(1);
  const dateStr = new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" });

  const headerBgRgb: RGB = [52, 58, 72];
  const headerTextDim: RGB = [160, 165, 180];
  const headerTextSubtle: RGB = [130, 135, 148];
  const headerDivider: RGB = [82, 87, 99];
  const badgeBgBlend: RGB = [82, 87, 99];

  const headerH = 56;
  setF(headerBgRgb);
  doc.rect(0, 0, PW, headerH, "F");

  setF(pCol);
  doc.rect(0, headerH, PW, 1.8, "F");

  let hY = MT;

  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, "PNG", ML, hY - 3, 30, 12); } catch (_) {}
  }
  const logoEndX = ML + (logoDataUrl ? 33 : 0);

  setD(headerDivider);
  doc.setLineWidth(0.3);
  const dividerX = logoEndX + 3;
  doc.line(dividerX, hY - 1, dividerX, hY + 6);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  setC(headerTextDim);
  doc.text("TEAMCHECK BERICHT", dividerX + 4, hY + 3.5);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  setC(headerTextSubtle);
  doc.text(dateStr, PW - MR, hY + 3.5, { align: "right" });

  hY += 14;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  setC(C.white);
  doc.text(result.roleTitle || "TeamCheck", ML, hY);
  hY += 8;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");

  const dotR = 1.6;
  const textY = hY;
  const dotCenterY = textY - 1.2;

  setF(C.analytisch);
  doc.circle(ML + dotR, dotCenterY, dotR, "F");
  setC(headerTextDim);
  doc.setFont("helvetica", "bold");
  doc.text("Team:", ML + dotR * 2 + 2.5, textY);
  const teamLabelW = doc.getTextWidth("Team: ");
  doc.setFont("helvetica", "normal");
  doc.text(result.teamLabel, ML + dotR * 2 + 2.5 + teamLabelW, textY);
  const teamBlockW = dotR * 2 + 2.5 + teamLabelW + doc.getTextWidth(result.teamLabel);

  const sepX = ML + teamBlockW + 6;
  setC(headerDivider);
  doc.text("|", sepX, textY);

  const personStartX = sepX + 6;
  setF(C.intuitiv);
  doc.circle(personStartX + dotR, dotCenterY, dotR, "F");
  setC(headerTextDim);
  doc.setFont("helvetica", "bold");
  doc.text("Person:", personStartX + dotR * 2 + 2.5, textY);
  const personLabelW = doc.getTextWidth("Person: ");
  doc.setFont("helvetica", "normal");
  doc.text(result.personLabel, personStartX + dotR * 2 + 2.5 + personLabelW, textY);

  hY += 9;

  const badgeH = 7;
  const badgeR2 = 3.5;
  const badgeTextY = hY;
  const badgeDotCY = badgeTextY - 1.2;
  const badgeBoxY = badgeTextY - 4.2;

  const fitBadgeText = result.passung;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const fitBadgeW = doc.getTextWidth(fitBadgeText) + 16;
  setF(badgeBgBlend);
  doc.roundedRect(ML, badgeBoxY, fitBadgeW, badgeH, badgeR2, badgeR2, "F");
  setF(pCol);
  doc.circle(ML + 5 + dotR, badgeDotCY, dotR, "F");
  setC(C.white);
  doc.text(fitBadgeText, ML + 5 + dotR * 2 + 3, badgeTextY);

  const cBadgeText = `Steuerungsaufwand: ${sLabel}`;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const cBadgeW = doc.getTextWidth(cBadgeText) + 16;
  const cBadgeX = ML + fitBadgeW + 6;
  setF(badgeBgBlend);
  doc.roundedRect(cBadgeX, badgeBoxY, cBadgeW, badgeH, badgeR2, badgeR2, "F");
  setF(sCol);
  doc.circle(cBadgeX + 5 + dotR, badgeDotCY, dotR, "F");
  setC(C.white);
  doc.text(cBadgeText, cBadgeX + 5 + dotR * 2 + 3, badgeTextY);

  y = headerH + 8;

  const tcCol = (i: number): RGB => hexToRgb(TC_SECTION_COLORS[i] || BIO_COLORS.analytisch);
  const rCol = result.integrationsrisiko === "gering" ? C.green : result.integrationsrisiko === "mittel" ? C.amber : C.red;

  labelTag("SYSTEMSTATUS");
  const statusItems = [
    { label: "Gesamtpassung", value: result.passung, color: pCol },
    { label: "Systemwirkung", value: result.systemwirkung, color: C.black },
    { label: "Steuerungsaufwand", value: result.steuerungsaufwand, color: sCol },
    { label: "Integrationsrisiko", value: result.integrationsrisiko, color: rCol },
  ];
  const statusColW = CW / 4;
  for (let i = 0; i < statusItems.length; i++) {
    const mx = ML + i * statusColW + 1;
    const mw = statusColW - 2;
    bgBox(mx, y, mw, 11, C.bg, C.lineFaint);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    setC(C.light);
    doc.text(statusItems[i].label.toUpperCase(), mx + 3, y + 4);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    setC(statusItems[i].color);
    doc.text(statusItems[i].value, mx + 3, y + 8.5);
  }
  y += 15;

  labelTag("SYSTEMÜBERBLICK");
  const overviewItems = [
    { label: "Teamprofil", value: result.teamLabel },
    { label: "Personenprofil", value: result.personLabel },
    { label: "Team–Person-Abweichung", value: `${result.teamPersonAbweichung} Punkte` },
  ];
  overviewItems.forEach(item => {
    checkPage(6);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setC(C.mid);
    doc.text(item.label, ML, y);
    doc.setFont("helvetica", "bold");
    const valCol = item.label === "Team–Person-Abweichung"
      ? (result.teamPersonAbweichung > 40 ? C.red : result.teamPersonAbweichung > 20 ? C.amber : C.green)
      : C.black;
    setC(valCol);
    doc.text(item.value, PW - MR, y, { align: "right" });
    y += 5;
  });
  y += 2;

  labelTag("STRUKTURKONSTELLATION");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  setC(C.mid);
  doc.text("Dominanz Team", ML, y);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  doc.text(result.strukturdiagnose.teamDominant, PW - MR, y, { align: "right" });
  y += 5;
  doc.setFont("helvetica", "normal");
  setC(C.mid);
  doc.text("Dominanz Person", ML, y);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  doc.text(result.strukturdiagnose.personDominant, PW - MR, y, { align: "right" });
  y += 5;
  labelTag("STRUKTURWIRKUNG");
  printText(result.strukturdiagnose.strukturwirkung.split("\n\n")[0], ML, CW, 8, C.dark, 4);
  y += 3;

  labelTag("MANAGEMENTKURZFAZIT");
  setF(pCol);
  doc.roundedRect(ML, y - 1, 1.5, 0.1, 0, 0, "F");
  doc.rect(ML, y - 1, 1.5, 20, "F");
  doc.roundedRect(ML, y - 1, 1.5, 20, 0.5, 0.5, "F");
  printText(result.managementFazit, ML + 4, CW - 4, 8.5, C.dark, 4.3);
  y += 3;

  labelTag("INTEGRATIONSFAKTOR");
  const intPairs = [
    { label: "Integrationsdauer", value: result.integrationsfaktor.integrationsdauer },
    { label: "Führungsaufwand", value: result.steuerungsaufwand },
    { label: "Erfolgsfaktor", value: result.erfolgsfaktor },
  ];
  intPairs.forEach(item => {
    checkPage(6);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setC(C.mid);
    doc.text(item.label, ML, y);
    doc.setFont("helvetica", "bold");
    setC(C.black);
    doc.text(item.value, PW - MR, y, { align: "right" });
    y += 5;
  });
  y += 2;

  separator(30);

  sectionHead(2, "Warum dieses Ergebnis", tcCol(0));
  result.reasonLines.forEach(r => {
    checkPage(6);
    dot(ML, y, pCol);
    printText(r, ML + 5, CW - 5, 8.5, C.dark, 4.3);
    y += 1;
  });

  separator(50);

  sectionHead(3, "Systemwirkung", tcCol(1));
  result.systemwirkungText.split("\n\n").forEach(p => {
    printText(p, ML, CW, 8.5, C.dark, 4.3);
    y += 2;
  });

  checkPage(20);
  labelTag("Teamprofil");
  result.teamText.split("\n\n").forEach(p => {
    printText(p, ML, CW, 8.5, C.mid, 4.3);
  });
  y += 3;
  labelTag("Personenprofil");
  result.personText.split("\n\n").forEach(p => {
    printText(p, ML, CW, 8.5, C.mid, 4.3);
  });

  separator(60);

  sectionHead(4, "Strukturvergleich", tcCol(2));

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
  doc.text("Teamprofil", leftBoxX + boxPad, leftY);
  leftY += 7;

  doc.setFont("helvetica", "bold");
  setC(C.black);
  doc.text("Person", rightBoxX + boxPad, rightY);
  rightY += 7;

  const keys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
  const COMP_SHORT: Record<ComponentKey, string> = { impulsiv: "Impulsiv", intuitiv: "Intuitiv", analytisch: "Analytisch" };

  for (const k of keys) {
    const tv = Math.round(result.teamProfile[k]);
    const pv = Math.round(result.personProfile[k]);
    const col = compColor(k);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setC(C.mid);
    doc.text(COMP_SHORT[k], leftBoxX + boxPad, leftY + 1);
    drawBar(leftBoxX + boxPad + 22, leftY - 2.5, barMaxW, tv, col, barH);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    if (tv > 12) {
      setC(C.white);
      doc.text(`${tv} %`, leftBoxX + boxPad + 22 + 3, leftY + 1.2);
    } else {
      setC(col);
      doc.text(`${tv} %`, leftBoxX + boxPad + 22 + Math.max(barH, (tv / 100) * barMaxW) + 2, leftY + 1.2);
    }
    leftY += 11;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setC(C.mid);
    doc.text(COMP_SHORT[k], rightBoxX + boxPad, rightY + 1);
    drawBar(rightBoxX + boxPad + 22, rightY - 2.5, barMaxW, pv, col, barH);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    if (pv > 12) {
      setC(C.white);
      doc.text(`${pv} %`, rightBoxX + boxPad + 22 + 3, rightY + 1.2);
    } else {
      setC(col);
      doc.text(`${pv} %`, rightBoxX + boxPad + 22 + Math.max(barH, (pv / 100) * barMaxW) + 2, rightY + 1.2);
    }
    rightY += 11;
  }

  y += profileTotalH + 6;

  checkPage(10);
  const abwCol = result.teamPersonAbweichung > 40 ? C.red : result.teamPersonAbweichung > 20 ? C.amber : C.green;
  const abwBg = result.teamPersonAbweichung > 40 ? C.redLight : result.teamPersonAbweichung > 20 ? C.amberLight : C.greenLight;
  bgBox(ML, y, CW, 10, abwBg);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  setC(C.dark);
  doc.text("Team–Person-Abweichung:", ML + 5, y + 6.5);
  const abwLabelW = doc.getTextWidth("Team–Person-Abweichung: ");
  doc.setFontSize(10);
  setC(abwCol);
  doc.text(`${result.teamPersonAbweichung} Punkte`, ML + 5 + abwLabelW, y + 6.5);
  y += 14;

  separator(40);

  sectionHead(5, "Team-Spannungsanalyse", tcCol(3));
  result.tension.forEach((t, idx) => {
    checkPage(30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    setC(C.black);
    doc.text(t.title, ML, y);
    y += 6;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setC(C.mid);
    doc.text("Team", ML, y + 1);
    drawBar(ML + 22, y - 2.5, barMaxW, t.teamValue, [158, 180, 207] as RGB, barH);
    doc.setFont("helvetica", "bold");
    setC(t.teamValue > 12 ? C.white : C.mid);
    doc.text(`${t.teamValue} %`, t.teamValue > 12 ? ML + 22 + 3 : ML + 22 + Math.max(barH, (t.teamValue / 100) * barMaxW) + 2, y + 1.2);
    y += 8;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setC(C.mid);
    doc.text("Person", ML, y + 1);
    drawBar(ML + 22, y - 2.5, barMaxW, t.personValue, C.analytisch, barH);
    doc.setFont("helvetica", "bold");
    setC(t.personValue > 12 ? C.white : C.analytisch);
    doc.text(`${t.personValue} %`, t.personValue > 12 ? ML + 22 + 3 : ML + 22 + Math.max(barH, (t.personValue / 100) * barMaxW) + 2, y + 1.2);
    y += 7;

    printText(t.interpretation, ML, CW, 8.5, C.mid, 4.3);
    if (idx < result.tension.length - 1) {
      y += 2;
      hline(ML, y, ML + CW, C.lineFaint);
      y += 4;
    }
  });

  separator(30);

  sectionHead(6, "Auswirkungen im Arbeitsalltag", tcCol(4));
  result.impacts.forEach((imp, idx) => {
    checkPage(14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    setC(C.black);
    doc.text(imp.title, ML, y);
    y += 5;
    printText(imp.text, ML, CW, 8.5, C.dark, 4.3);
    if (idx < result.impacts.length - 1) {
      y += 2;
      hline(ML, y, ML + CW, C.lineFaint);
      y += 4;
    }
  });

  separator(30);

  sectionHead(7, "Auswirkungen auf Leistung und Ergebnisse", tcCol(5));
  const leistungItems = [
    { label: "Entscheidungsqualität", text: result.leistungswirkung.entscheidungsqualitaet },
    { label: "Umsetzungsgeschwindigkeit", text: result.leistungswirkung.umsetzungsgeschwindigkeit },
    { label: "Prioritätensetzung", text: result.leistungswirkung.prioritaetensetzung },
    { label: "Wirkung auf Ergebnisse", text: result.leistungswirkung.wirkungAufErgebnisse },
  ];
  leistungItems.forEach((item, idx) => {
    checkPage(14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    setC(C.black);
    doc.text(item.label, ML, y);
    y += 5;
    printText(item.text, ML, CW, 8.5, C.dark, 4.3);
    if (idx < leistungItems.length - 1) {
      y += 2;
      hline(ML, y, ML + CW, C.lineFaint);
      y += 4;
    }
  });

  separator(60);

  sectionHead(8, "Verhalten unter Druck", tcCol(6));
  checkPage(14);

  setF(C.amberLight);
  doc.roundedRect(ML, y - 1, CW, 0.8, 0.4, 0.4, "F");
  y += 3;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  setC(C.amber);
  doc.text("KONTROLLIERTER DRUCK", ML, y);
  y += 5;
  result.stress.controlled.split("\n\n").forEach(p => {
    printText(p, ML, CW, 8.5, C.dark, 4.3);
  });
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
  result.stress.uncontrolled.split("\n\n").forEach(p => {
    printText(p, ML, CW, 8.5, C.dark, 4.3);
  });
  y += 3;
  printText("Unter zunehmendem Arbeitsdruck können sich diese Verhaltensmuster verstärken. Dadurch entstehen im Arbeitsalltag Risiken für Abstimmung, Führung und Zusammenarbeit.", ML, CW, 8.5, C.mid, 4.3, "italic");

  separator(50);

  sectionHead(9, "Risikoentwicklung über Zeit", tcCol(7));
  result.riskTimeline.forEach((phase, i) => {
    const phaseCol = i === 0 ? C.amber : i === 1 ? C.blue : C.green;
    const phaseBg = i === 0 ? C.amberLight : i === 1 ? [232, 240, 254] as RGB : C.greenLight;
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
    doc.text(" – " + phase.period, ML + 3 + doc.getTextWidth(phLabel), y + 1);
    y += 8;
    printText(phase.text, ML, CW, 8.5, C.dark, 4.3);
    if (i < result.riskTimeline.length - 1) {
      y += 3;
    }
  });

  separator(30);

  sectionHead(10, "Chancen", tcCol(8));
  result.chances.forEach(c => {
    checkPage(6);
    dot(ML, y, C.green);
    printText(c, ML + 5, CW - 5, 8.5, C.dark, 4.3);
    y += 1;
  });

  separator(30);

  sectionHead(11, "Risiken", tcCol(9));
  result.risks.forEach(r => {
    checkPage(6);
    dot(ML, y, C.red);
    printText(r, ML + 5, CW - 5, 8.5, C.dark, 4.3);
    y += 1;
  });

  separator(30);

  sectionHead(12, "Handlungsempfehlung", tcCol(10));
  result.advice.forEach((a, idx) => {
    checkPage(14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    setC(C.black);
    doc.text(a.title, ML, y);
    y += 5;
    printText(a.text, ML, CW, 8.5, C.dark, 4.3);
    if (idx < result.advice.length - 1) {
      y += 2;
      hline(ML, y, ML + CW, C.lineFaint);
      y += 4;
    }
  });

  separator(30);

  sectionHead(13, "Alternativwirkung", tcCol(11));
  printText("Neben der Frage, wie sich die Besetzung auf das Team auswirkt, ist auch relevant, welche Wirkung ohne diese Besetzung bestehen bleibt.", ML, CW, 8.5, C.mid, 4.3);
  y += 4;
  result.alternativwirkung.split("\n\n").forEach(p => {
    printText(p, ML, CW, 8.5, C.dark, 4.3);
    y += 2;
  });

  doc.save(filename);
}
