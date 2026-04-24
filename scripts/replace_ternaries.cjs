const fs = require('fs');
let c = fs.readFileSync('client/src/pages/teamdynamik.tsx', 'utf8');

const simpleReplacements = [
  // Levers count badge
  [
    '{result.leverEffects.enabledCount} {it ? "attivi" : fr ? "actifs" : en ? "active" : "aktiv"} → -{result.leverEffects.reductionLevels} {it ? "livello" : fr ? "niveau" : en ? "level" : "Stufe"}{result.leverEffects.reductionLevels !== 1 ? (it ? "" : fr ? "x" : en ? "s" : "n") : ""}',
    '{result.leverEffects.enabledCount} {ui.teamdynamik.leversActive} → -{result.leverEffects.reductionLevels} {result.leverEffects.reductionLevels !== 1 ? ui.teamdynamik.leversLevelPlural : ui.teamdynamik.leversLevel}'
  ],
  // 30-day integration plan
  ["it ? \"Piano d'integrazione a 30 giorni\" : fr ? \"Plan d'intégration à 30 jours\" : en ? \"30-day integration plan\" : \"30-Tage-Integrationsplan\"", 'ui.teamdynamik.integrationPlan30Title'],
  ["it ? \"Inserimento strutturato del manager nel team esistente\" : fr ? \"Intégration structurée du manager dans l'équipe existante\" : en ? \"Structured onboarding of the leader into the existing team\" : \"Strukturierte Einarbeitung der Führungskraft in das bestehende Team\"", 'ui.teamdynamik.integrationPlan30Sub'],
  // Department fit
  ['it ? "Compatibilità reparto" : fr ? "Compatibilité département" : en ? "Department fit" : "Abteilungs-Fit"', 'ui.teamdynamik.departmentFitTitle'],
  // Team fit label
  ['{ label: it ? "Compatibilità team" : fr ? "Fit équipe" : en ? "Team fit" : "Team-Fit"', '{ label: ui.teamdynamik.teamFitLabel'],
  // Führungskraft-Fit / Person-Fit
  ['isLeading ? (it ? "Compatibilità manager" : fr ? "Fit manager" : en ? "Manager fit" : "Führungskraft-Fit") : (it ? "Compatibilità persona" : fr ? "Fit personne" : en ? "Person fit" : "Person-Fit")', 'isLeading ? ui.teamdynamik.leaderFitLabel : ui.teamdynamik.personFitLabel'],
  // Notes
  ['{it ? "Note" : fr ? "Notes" : en ? "Notes" : "Hinweise"}', '{ui.teamdynamik.notes}'],
  // Report button
  ['{reportLoading ? (it ? "Report in corso..." : fr ? "Rapport en cours..." : en ? "Generating report..." : "Report wird erstellt...") : (it ? "Genera report IA" : fr ? "Générer le rapport IA" : en ? "Generate AI report" : "KI-Report generieren")}', '{reportLoading ? ui.teamdynamik.generatingReport : ui.teamdynamik.generateReport}'],
  // Team system report title
  ['it ? "Report sistema team" : fr ? "Rapport système équipe" : en ? "Team system report" : "Team-Systemreport"', 'ui.teamdynamik.teamSystemReport'],
  // Copy button
  ['copied ? (it ? "Copiato" : fr ? "Copié" : en ? "Copied" : "Kopiert") : (it ? "Copia" : fr ? "Copier" : en ? "Copy" : "Kopieren")', 'copied ? ui.teamdynamik.copied : ui.teamdynamik.copyBtn'],
  // Report generating (inline)
  ['{it ? "Report in corso..." : fr ? "Rapport en cours..." : en ? "Generating report..." : "Report wird erstellt..."}', '{ui.teamdynamik.generatingReport}'],
  // Report error
  ['{it ? "Il report non ha potuto essere generato." : fr ? "Le rapport n\'a pas pu être généré." : en ? "Report could not be generated." : "Report konnte nicht erstellt werden."}', '{ui.teamdynamik.reportError}'],
  // Retry button
  ['{it ? "Riprova" : fr ? "Réessayer" : en ? "Try again" : "Erneut versuchen"}', '{ui.teamdynamik.reportRetry}'],
];

// Titlemap block replacement
const titleMapOld = `                    const titleMap: Record<string, string> = it ? {
                      "Systemwirkung": "Impatto sistemico", "Führungsverhalten": "Comportamento di leadership",
                      "Spannungsfeld": "Campo di tensione", "Alltagswirkung": "Effetto quotidiano",
                      "Konkrete Massnahmen": "Misure concrete", "Blinder Fleck": "Punto cieco",
                      "Kurzfazit": "Sintesi breve", "Routinen & Steuerung": "Routine e gestione",
                      "Kultur & Integration": "Cultura e integrazione",
                    } : fr ? {
                      "Systemwirkung": "Impact systémique", "Führungsverhalten": "Comportement de leadership",
                      "Spannungsfeld": "Champ de tension", "Alltagswirkung": "Effet au quotidien",
                      "Konkrete Massnahmen": "Mesures concrètes", "Blinder Fleck": "Angle mort",
                      "Kurzfazit": "Synthèse brève", "Routinen & Steuerung": "Routines & pilotage",
                      "Kultur & Integration": "Culture & intégration",
                    } : en ? {
                      "Systemwirkung": "System impact", "Führungsverhalten": "Leadership behaviour",
                      "Spannungsfeld": "Tension field", "Alltagswirkung": "Day-to-day impact",
                      "Konkrete Massnahmen": "Concrete measures", "Blinder Fleck": "Blind spot",
                      "Kurzfazit": "Short summary", "Routinen & Steuerung": "Routines & steering",
                      "Kultur & Integration": "Culture & integration",
                    } : {};`;
const titleMapNew = `                    const titleMap: Record<string, string> = {
                      "Systemwirkung": ui.teamdynamik.insightSystemwirkung,
                      "Führungsverhalten": ui.teamdynamik.insightFuehrungsverhalten,
                      "Spannungsfeld": ui.teamdynamik.insightSpannungsfeld,
                      "Alltagswirkung": ui.teamdynamik.insightAlltagswirkung,
                      "Konkrete Massnahmen": ui.teamdynamik.insightMassnahmen,
                      "Blinder Fleck": ui.teamdynamik.insightBlindFleck,
                      "Kurzfazit": ui.teamdynamik.insightKurzfazit,
                      "Routinen & Steuerung": ui.teamdynamik.insightRoutinen,
                      "Kultur & Integration": ui.teamdynamik.insightKultur,
                    };`;

// LeverTitleMap block replacement
const leverTitleMapOld = `                const leverTitleMap: Record<string, string> = it ? {
                  "timebox": "Finestra decisionale definita", "8020": "Standard qualità 80/20 fissato",
                  "weekly_review": "Revisione settimanale delle priorità", "role_boundaries": "Confini di decisione e responsabilità",
                  "comm_rules": "Livello oggettivo/relazionale, regole di feedback", "pulse_check": "Verifica della temperatura del team",
                } : fr ? {
                  "timebox": "Fenêtre décisionnelle définie", "8020": "Standard qualité 80/20 fixé",
                  "weekly_review": "Revue hebdomadaire des priorités", "role_boundaries": "Limites de décision et responsabilités",
                  "comm_rules": "Niveau factuel/relation, règles de feedback", "pulse_check": "Vérification de la température de l'équipe",
                } : en ? {
                  "timebox": "Decision timeframe defined", "8020": "80/20 quality standard set",
                  "weekly_review": "Weekly prioritisation review", "role_boundaries": "Decision and responsibility boundaries",
                  "comm_rules": "Factual/relational level, feedback rules", "pulse_check": "Team temperature check",
                } : {};
                const leverDescMap: Record<string, string> = it ? {
                  "timebox": "Scadenze chiare per le decisioni evitano loop infiniti e il ritardo del consenso.",
                  "8020": "Uno standard di qualità definito evita l'iperperfezionismo e mantiene il ritmo.",
                  "weekly_review": "Una revisione regolare crea certezza di gestione e previene scostamenti silenziosi.",
                  "role_boundaries": "Ruoli e confini decisionali chiari riducono conflitti e doppie attività.",
                  "comm_rules": "Regole di comunicazione fisse separano le questioni di merito dalle dinamiche relazionali.",
                  "pulse_check": "Un controllo regolare del polso rende misurabili clima e carico di lavoro.",
                } : fr ? {
                  "timebox": "Des délais clairs pour les décisions évitent les boucles infinies et les reports de consensus.",
                  "8020": "Un standard qualité défini évite le sur-perfectionnisme et maintient le tempo.",
                  "weekly_review": "Une révision régulière crée de la sécurité de pilotage et prévient les écarts silencieux.",
                  "role_boundaries": "Des rôles et des limites décisionnelles clairs réduisent les conflits et les doublons.",
                  "comm_rules": "Des règles de communication fixes séparent les questions de fond de la dynamique relationnelle.",
                  "pulse_check": "Un pulse-check régulier rend mesurables l'ambiance et la charge.",
                } : en ? {
                  "timebox": "Clear deadlines for decisions prevent endless loops and consensus delays.",
                  "8020": "A defined quality standard prevents over-perfecting and maintains pace.",
                  "weekly_review": "Regular review creates steering reliability and prevents silent deviations.",
                  "role_boundaries": "Clear role and decision boundaries reduce conflicts and duplicate work.",
                  "comm_rules": "Fixed communication rules separate factual issues from relationship dynamics.",
                  "pulse_check": "A regular pulse check makes mood and workload measurable.",
                } : {};
                const prioLabelMap: Record<string, string> = it ? { hoch: "alta", mittel: "media", niedrig: "bassa" }
                  : fr ? { hoch: "haute", mittel: "moyenne", niedrig: "basse" }
                  : en ? { hoch: "high", mittel: "medium", niedrig: "low" }
                  : {};`;

const leverTitleMapNew = `                const leverTitleMap: Record<string, string> = {
                  "timebox": ui.teamdynamik.leverTimebox,
                  "8020": ui.teamdynamik.lever8020,
                  "weekly_review": ui.teamdynamik.leverWeekly,
                  "role_boundaries": ui.teamdynamik.leverRoleBoundaries,
                  "comm_rules": ui.teamdynamik.leverCommRules,
                  "pulse_check": ui.teamdynamik.leverPulseCheck,
                };
                const leverDescMap: Record<string, string> = {
                  "timebox": ui.teamdynamik.leverTimeboxDesc,
                  "8020": ui.teamdynamik.lever8020Desc,
                  "weekly_review": ui.teamdynamik.leverWeeklyDesc,
                  "role_boundaries": ui.teamdynamik.leverRoleBoundariesDesc,
                  "comm_rules": ui.teamdynamik.leverCommRulesDesc,
                  "pulse_check": ui.teamdynamik.leverPulseCheckDesc,
                };
                const prioLabelMap: Record<string, string> = {
                  hoch: ui.teamdynamik.prioHigh,
                  mittel: ui.teamdynamik.prioMedium,
                  niedrig: ui.teamdynamik.prioLow,
                };`;

let count = 0;

// Apply block replacements first
if (c.includes(titleMapOld)) {
  c = c.split(titleMapOld).join(titleMapNew);
  count++;
  console.log('titleMap replaced');
} else {
  console.log('titleMap NOT FOUND');
}

if (c.includes(leverTitleMapOld)) {
  c = c.split(leverTitleMapOld).join(leverTitleMapNew);
  count++;
  console.log('leverTitleMap replaced');
} else {
  console.log('leverTitleMap NOT FOUND');
}

// Apply simple replacements
for (const [from, to] of simpleReplacements) {
  if (c.includes(from)) {
    c = c.split(from).join(to);
    count++;
  } else {
    console.log('NOT FOUND:', JSON.stringify(from).substring(0, 80));
  }
}

fs.writeFileSync('client/src/pages/teamdynamik.tsx', c);
console.log('Done, applied', count, 'replacements');
