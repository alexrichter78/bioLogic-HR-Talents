import { getLogoDataUrl } from "./logo-base64";
import { REPORT_INTRO_DISCLAIMER } from "./report-texts";

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
  impulsiv: hexToRgb("#C41E3A"),
  intuitiv: hexToRgb("#F39200"),
  analytisch: hexToRgb("#1A5DAB"),
  amber: hexToRgb("#E5A832"),
  amberLight: [255, 249, 232] as RGB,
  red: hexToRgb("#D64045"),
  redLight: [254, 237, 237] as RGB,
};

const COMP_MAP: Record<string, { label: string; color: RGB }> = {
  imp: { label: "Impulsiv", color: C.impulsiv },
  int: { label: "Intuitiv", color: C.intuitiv },
  ana: { label: "Analytisch", color: C.analytisch },
};

export interface RollenprofilPdfData {
  beruf: string;
  bereich: string;
  isLeadership: boolean;
  fuehrungstyp: string;
  aufgabencharakter: string;
  profileType: string;
  gesamt: { imp: number; int: number; ana: number };
  dom: { key: string; label: string; value: number };
  sec: { key: string; label: string; value: number };
  wk: { key: string; label: string; value: number };
  einleitung: string;
  topTaetigkeiten: string[];
  rollenBeschreibungIntro: string;
  rollenBeschreibungErgaenzung: string;
  strukturprofilText: string;
  komponentenBedeutung: { key: string; label: string; color: string; text: string; warning: string }[];
  profilherkunft: { label: string; dom: string; pct: number }[];
  profilkonflikt: string | null;
  arbeitslogikText: string;
  rahmenText: string;
  erfolgsfokusLabels: string[];
  erfolgsfokusText: string;
  alltagsverhalten: string;
  stressControlled: string;
  stressUncontrolled: string;
  teamwirkung: string;
  spannungsfelder: string[];
  spannungsfazit: string;
  fehlbesetzung: { label: string; bullets: string[] }[];
  kandidatenText: string;
  fazitTitel: string;
  fazitAbsaetze: string[];
}

export async function buildRollenprofilPdf(data: RollenprofilPdfData, filename: string) {
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
  let pageNum = 1;
  let y = MT;

  function setC(rgb: RGB) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
  function setD(rgb: RGB) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }
  function setF(rgb: RGB) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }

  function drawFooter() {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    setC(C.faint);
    doc.text("bioLogic Talent Navigator · Stellenanalyse", ML, PH - 8);
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

  function labelTag(text: string) {
    checkPage(7);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    setC(C.light);
    doc.text(text.toUpperCase(), ML, y);
    y += 4.5;
  }

  function dot(x: number, yy: number, color: RGB, r = 1.2) {
    setF(color);
    doc.circle(x + r, yy - r, r, "F");
  }

  function drawBar(x: number, yy: number, maxW: number, pct: number, color: RGB, h: number = 5) {
    setF(C.lineFaint);
    doc.roundedRect(x, yy, maxW, h, h / 2, h / 2, "F");
    if (pct > 0) {
      const barW = Math.max(h, (pct / 67) * maxW);
      setF(color);
      doc.roundedRect(x, yy, barW, h, h / 2, h / 2, "F");
    }
  }

  function sectionHead(num: number, title: string, accentColor: RGB) {
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

  const domColor = COMP_MAP[data.dom.key]?.color || C.analytisch;
  const dateStr = new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" });

  const headerH = 58;
  const headerBg1: RGB = [43, 52, 66];
  const headerBg2: RGB = [29, 36, 48];
  const headerKickerColor: RGB = [244, 244, 242];
  const headerTitleColor: RGB = [244, 244, 242];
  const headerSubtitleColor: RGB = [230, 230, 228];
  const ringColor: RGB = [255, 255, 255];

  setF(headerBg1);
  doc.rect(0, 0, PW, headerH, "F");
  setF(headerBg2);
  doc.rect(PW * 0.4, 0, PW * 0.6, headerH, "F");

  // Decorative rings (subtle)
  setD(ringColor);
  doc.setLineWidth(0.15);
  doc.setDrawColor(ringColor[0], ringColor[1], ringColor[2]);
  doc.circle(PW - 20, 28, 22, "S");
  doc.circle(PW - 10, 35, 30, "S");

  let hY = 10;

  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, "PNG", ML, hY, 36, 14.4); } catch (_) {}
  }

  // PDF button area (decorative, top-right)
  setF([255, 255, 255] as RGB);
  doc.roundedRect(PW - MR - 18, hY + 1, 18, 8, 1.5, 1.5, "F");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  setC(headerBg1);
  doc.text("PDF", PW - MR - 9, hY + 6, { align: "center" });

  hY += 20;

  // Orange bar + STELLENANALYSE kicker
  setF([240, 162, 79] as RGB);
  doc.rect(ML, hY, 0.8, 6, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  setC(headerKickerColor);
  doc.text("STELLENANALYSE", ML + 4, hY + 4.2);

  hY += 10;

  // Title: Stellenprofil
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  setC(headerTitleColor);
  doc.text("Stellenprofil", ML, hY);

  hY += 8;

  // Subtitle: Beruf
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  setC(headerSubtitleColor);
  doc.text(data.beruf, ML, hY);

  y = headerH + 8;

  printText(data.einleitung, ML, CW, 8.5, C.dark, 4.3);
  y += 5;
  const introDisclaimerText = REPORT_INTRO_DISCLAIMER;
  const introDiscLines = wrap(introDisclaimerText, CW - 8, 8);
  const introDiscPad = 4;
  const introDiscTotalH = introDiscLines.length * 4.3 + introDiscPad * 2 + 2;
  checkPage(introDiscTotalH + 4);
  doc.setDrawColor(255, 200, 200);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 245, 245);
  doc.roundedRect(ML, y - introDiscPad, CW, introDiscTotalH, 2, 2, "FD");
  y += 2;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setC([255, 59, 48]);
  introDiscLines.forEach(line => {
    doc.text(line, ML + 4, y);
    y += 4.3;
  });
  y += introDiscPad + 4;

  separator(50);

  const SECTION_COLORS_PDF = {
    rollenDna: domColor,
    verhalten: hexToRgb("#6366F1"),
    teamwirkung: hexToRgb("#0EA5E9"),
    fazit: hexToRgb("#10B981"),
  };

  sectionHead(1, "Stellenprofil · Entscheidungsgrundlage", SECTION_COLORS_PDF.rollenDna);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  doc.text("Welche Persönlichkeit braucht diese Stelle?", ML, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  doc.text("1. Kurzbeschreibung der Stelle", ML, y);
  y += 5;

  if (data.topTaetigkeiten.length > 0) {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    setC(C.dark);
    doc.text("Die zentralen Aufgaben dieser Stelle:", ML, y);
    y += 4.5;
    data.topTaetigkeiten.forEach(t => {
      checkPage(5);
      doc.setFontSize(8.5);
      setC(C.dark);
      doc.text(`•  ${t}`, ML + 3, y);
      y += 4.3;
    });
    y += 2;
  }

  printText(data.rollenBeschreibungIntro, ML, CW, 8.5, C.dark, 4.3);
  y += 1;
  printText(data.rollenBeschreibungErgaenzung, ML, CW, 8.5, C.dark, 4.3);
  y += 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  checkPage(8);
  doc.text("2. Strukturprofil der Stelle", ML, y);
  y += 6;

  const barMaxW = 80;
  const barH = 5.5;
  const barKeys = ["imp", "int", "ana"] as const;
  for (const k of barKeys) {
    const val = Math.round(data.gesamt[k]);
    const col = COMP_MAP[k].color;
    const label = COMP_MAP[k].label;
    checkPage(10);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setC(C.mid);
    doc.text(label, ML, y + 1);
    drawBar(ML + 24, y - 2.5, barMaxW, val, col, barH);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    if (val > 12) {
      setC(C.white);
      doc.text(`${val} %`, ML + 24 + 3, y + 1.2);
    } else {
      setC(col);
      doc.text(`${val} %`, ML + 24 + Math.max(barH, (val / 67) * barMaxW) + 2, y + 1.2);
    }
    y += 9;
  }
  y += 2;

  labelTag("Bedeutung der Komponenten");
  data.komponentenBedeutung.forEach(kb => {
    const col = hexToRgb(kb.color);
    checkPage(10);
    dot(ML, y, col);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    setC(C.black);
    doc.text(kb.label, ML + 5, y);
    y += 4.5;
    printText(kb.text, ML + 5, CW - 5, 8.5, C.dark, 4.3);
    y += 1;
    printText(kb.warning, ML + 5, CW - 5, 8, C.mid, 4);
    y += 2;
  });
  y += 2;

  printText(data.strukturprofilText, ML, CW, 8.5, C.dark, 4.3);
  y += 4;

  labelTag("Profilherkunft");
  data.profilherkunft.forEach(p => {
    checkPage(6);
    const pCol = p.dom === "Impulsiv" ? C.impulsiv : p.dom === "Intuitiv" ? C.intuitiv : p.dom === "Analytisch" ? C.analytisch : C.mid;
    dot(ML, y, pCol);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setC(C.dark);
    doc.text(`${p.label}:`, ML + 5, y);
    doc.setFont("helvetica", "normal");
    setC(C.mid);
    doc.text(`${p.dom} (${p.pct} %)`, ML + 5 + doc.getTextWidth(`${p.label}: `), y);
    y += 5;
  });

  if (data.profilkonflikt) {
    y += 3;
    checkPage(14);
    const pLines = wrap(data.profilkonflikt, CW - 8, 8);
    const boxH = pLines.length * 4 + 8;
    setF(C.amberLight);
    doc.roundedRect(ML, y - 3, CW, boxH, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    setC(C.dark);
    pLines.forEach(line => {
      doc.text(line, ML + 4, y + 1);
      y += 4;
    });
    y += 4;
  }
  y += 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  checkPage(8);
  doc.text("3. Arbeitslogik der Stelle", ML, y);
  y += 5;
  printText(data.arbeitslogikText, ML, CW, 8.5, C.dark, 4.3);
  y += 4;

  if (data.rahmenText) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    setC(C.black);
    checkPage(8);
    doc.text("4. Rahmenbedingungen", ML, y);
    y += 5;
    printText(data.rahmenText, ML, CW, 8.5, C.dark, 4.3);
    y += 4;
  }

  if (data.erfolgsfokusText) {
    const efNum = data.rahmenText ? "5." : "4.";
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    setC(C.black);
    checkPage(8);
    doc.text(`${efNum} Erfolgsfokus`, ML, y);
    y += 5;

    if (data.erfolgsfokusLabels.length > 0) {
      let tx = ML;
      data.erfolgsfokusLabels.forEach(l => {
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        const tw = doc.getTextWidth(l) + 8;
        setF(C.bg);
        doc.roundedRect(tx, y - 3, tw, 6, 1, 1, "F");
        setC(C.analytisch);
        doc.text(l, tx + 4, y + 0.5);
        tx += tw + 3;
      });
      y += 6;
    }

    printText(data.erfolgsfokusText, ML, CW, 8.5, C.dark, 4.3);
    y += 2;
  }

  separator(50);

  sectionHead(2, "Verhalten · Alltag und Stress", SECTION_COLORS_PDF.verhalten);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  doc.text("Verhalten im Alltag und unter Druck", ML, y);
  y += 5;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  setC(C.grey);
  const introLines = doc.splitTextToSize("Die folgende Darstellung zeigt, wie sich die Stellenanforderung im regulären Arbeitsalltag, unter Druck und bei starkem Stress typischerweise ausdrückt.", CW);
  doc.text(introLines, ML, y);
  y += introLines.length * 4.3 + 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  doc.text("Verhalten im Alltag", ML, y);
  y += 5;
  printText(data.alltagsverhalten, ML, CW, 8.5, C.dark, 4.3);
  y += 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  checkPage(10);
  doc.text("Verhalten unter Druck", ML, y);
  y += 5;
  printText(data.stressControlled, ML, CW, 8.5, C.dark, 4.3);
  y += 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  checkPage(10);
  doc.text("Verhalten bei starkem Stress", ML, y);
  y += 5;
  printText(data.stressUncontrolled, ML, CW, 8.5, C.dark, 4.3);

  separator(50);

  sectionHead(3, "Teamwirkung & Fehlbesetzungsrisiken", SECTION_COLORS_PDF.teamwirkung);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  doc.text("Wirkung, Spannungsfelder und Risiken", ML, y);
  y += 5;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  setC(C.grey);
  const wirkIntroText = data.isLeadership
    ? "Dieser Abschnitt beschreibt, welche Wirkung von der Stelle im Team ausgeht, welche typischen Spannungsfelder sich ergeben und welche Risiken bei einer Fehlbesetzung entstehen können."
    : "Dieser Abschnitt beschreibt, welche Wirkung die Stelle im Arbeitsumfeld entfaltet, welche typischen Spannungsfelder sich ergeben und welche Risiken bei einer Fehlbesetzung entstehen können.";
  const wirkIntroLines = doc.splitTextToSize(wirkIntroText, CW);
  doc.text(wirkIntroLines, ML, y);
  y += wirkIntroLines.length * 4.3 + 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  doc.text(data.isLeadership ? "Führungswirkung der Stelle" : "Teamwirkung der Stelle", ML, y);
  y += 5;
  printText(data.teamwirkung, ML, CW, 8.5, C.dark, 4.3);
  y += 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  checkPage(10);
  doc.text("Spannungsfelder der Stelle", ML, y);
  y += 5;
  printText("Typische Spannungen dieser Stelle sind:", ML, CW, 8.5, C.dark, 4.3);
  y += 1;
  data.spannungsfelder.forEach(sf => {
    checkPage(6);
    dot(ML, y, C.dark, 1);
    const lines = wrap(sf, CW - 6, 8.5);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    setC(C.dark);
    lines.forEach(line => {
      checkPage(4.3);
      doc.text(line, ML + 5, y);
      y += 4.3;
    });
  });
  y += 2;
  printText(data.spannungsfazit, ML, CW, 8.5, C.dark, 4.3);
  y += 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  checkPage(12);
  doc.text("Fehlbesetzungsrisiken", ML, y);
  y += 6;

  data.fehlbesetzung.forEach((risk, idx) => {
    checkPage(14);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    setC(C.dark);
    doc.text(risk.label, ML, y);
    y += 5;
    risk.bullets.forEach(b => {
      checkPage(6);
      setF(C.red);
      doc.circle(ML + 1.5, y - 1.2, 1.2, "F");
      const lines = wrap(b, CW - 8, 8.5);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      setC(C.dark);
      lines.forEach(line => {
        checkPage(4.3);
        doc.text(line, ML + 5, y);
        y += 4.3;
      });
    });
    if (idx < data.fehlbesetzung.length - 1) {
      y += 2;
      hline(ML + 5, y, ML + CW - 5, C.lineFaint);
      y += 4;
    }
  });

  if (data.kandidatenText) {
    y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    setC(C.black);
    checkPage(10);
    doc.text("Typische Person für diese Stelle", ML, y);
    y += 5;
    printText(data.kandidatenText, ML, CW, 8.5, C.dark, 4.3);
  }

  separator(50);

  sectionHead(4, "Entscheidungsfazit", SECTION_COLORS_PDF.fazit);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setC(C.black);
  doc.text(data.fazitTitel, ML, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  setC(C.dark);
  data.fazitAbsaetze.forEach((a, i) => {
    printText(a, ML, CW, 8.5, C.dark, 4.3);
    if (i < data.fazitAbsaetze.length - 1) y += 2;
  });

  y += 6;

  checkPage(10);
  hline(ML, y, ML + CW, C.lineFaint);
  y += 4;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  setC(C.faint);
  doc.text(`© ${new Date().getFullYear()} bioLogic Talent Navigator · Stellenanalyse · Erstellt am ${new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`, ML + CW / 2, y, { align: "center" });

  doc.save(filename);
}
