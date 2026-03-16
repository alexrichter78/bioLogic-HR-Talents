export type PhotoEffectKey = "impulsiv" | "intuitiv" | "analytisch";

export type PhotoFeatures = {
  blickrichtung: number;
  blickintensitaet: number;
  augenfreundlichkeit: number;
  augenbrauenhoehe: number;
  brauenkontraktion: number;
  stirnspannung: number;
  mundwinkel: number;
  laechelnIntensitaet: number;
  duchenneNahe: number;
  lippenpressung: number;
  kieferanspannung: number;
  kopfPitch: number;
  kopfRoll: number;
  kopfYaw: number;
  gesichtsexpressivitaet: number;
  gesichtskontrolle: number;
  fwhRatio: number;
  gesichtsrundung: number;
  lachfalten: number;
  glabellaLinie: number;
  stirnlinien: number;
  kinnprojektion: number;
  mundsymmetrie: number;
  augensymmetrie: number;
  gesamtspannung: number;
};

export type PhotoEffectScores = {
  impulsivScore: number;
  intuitivScore: number;
  analytischScore: number;
};

export type PhotoEffectRanking = {
  primaryEffect: PhotoEffectKey;
  secondaryEffect: PhotoEffectKey;
  tertiaryEffect: PhotoEffectKey;
  gap12: number;
  gap23: number;
};

export type PhotoEffectResult = PhotoEffectScores &
  PhotoEffectRanking & {
    impulsivStrength: "leicht" | "mittel" | "stark";
    intuitivStrength: "leicht" | "mittel" | "stark";
    analytischStrength: "leicht" | "mittel" | "stark";
    effectText: string;
    note: string;
  };

const NOTE_TEXT =
  "Hinweis: Dieses Ergebnis beschreibt die Wirkung des Fotos, nicht die tatsächliche Persönlichkeitsstruktur.";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function normalizeTo10(raw: number, maxRaw: number): number {
  if (maxRaw <= 0) return 0;
  return clamp(round2((raw / maxRaw) * 10), 0, 10);
}

function effectStrength(score: number): "leicht" | "mittel" | "stark" {
  if (score >= 7.5) return "stark";
  if (score >= 4.5) return "mittel";
  return "leicht";
}

function scorePhotoEffect(features: PhotoFeatures): PhotoEffectScores {
  const impulsivRaw =
    (features.blickrichtung === 1 ? 2 : 0) * 1.4 +
    features.blickintensitaet * 1.6 +
    features.brauenkontraktion * 1.5 +
    features.lippenpressung * 1.2 +
    features.kieferanspannung * 1.2 +
    (features.kopfPitch === 1 ? 2 : 0) * 0.9 +
    (features.kopfYaw === 0 ? 2 : 0) * 0.6 +
    features.glabellaLinie * 0.9 +
    features.gesamtspannung * 1.3 +
    features.kinnprojektion * 0.8 +
    features.gesichtsrundung * 0.6 +
    features.fwhRatio * 0.5;

  const intuitivRaw =
    features.augenfreundlichkeit * 1.7 +
    Math.max(0, features.mundwinkel) * 1.7 +
    features.laechelnIntensitaet * 1.8 +
    features.duchenneNahe * 1.4 +
    features.kopfRoll * 1.0 +
    features.lachfalten * 0.7 +
    (2 - features.lippenpressung) * 0.8 +
    (2 - features.kieferanspannung) * 0.6 +
    (2 - features.gesamtspannung) * 0.7 +
    (features.augenbrauenhoehe === 2 ? 2 : 0) * 0.5;

  const analytischRaw =
    features.gesichtskontrolle * 1.9 +
    features.stirnspannung * 1.1 +
    (features.blickintensitaet === 1 ? 2 : 0) * 1.0 +
    (features.mundwinkel === 0 ? 2 : 0) * 1.3 +
    (2 - features.gesichtsexpressivitaet) * 1.5 +
    features.stirnlinien * 0.8 +
    features.augensymmetrie * 0.7 +
    features.mundsymmetrie * 0.7 +
    (features.kopfYaw === 0 ? 2 : 0) * 0.5 +
    (features.kopfPitch === 0 ? 2 : 0) * 0.7 +
    (features.augenbrauenhoehe === 1 ? 2 : 0) * 0.6;

  const impulsivMax =
    2 * 1.4 + 2 * 1.6 + 2 * 1.5 + 2 * 1.2 + 2 * 1.2 +
    2 * 0.9 + 2 * 0.6 + 2 * 0.9 + 2 * 1.3 + 2 * 0.8 +
    2 * 0.6 + 2 * 0.5;

  const intuitivMax =
    2 * 1.7 + 2 * 1.7 + 2 * 1.8 + 2 * 1.4 + 1 * 1.0 +
    2 * 0.7 + 2 * 0.8 + 2 * 0.6 + 2 * 0.7 + 2 * 0.5;

  const analytischMax =
    2 * 1.9 + 2 * 1.1 + 2 * 1.0 + 2 * 1.3 + 2 * 1.5 +
    2 * 0.8 + 2 * 0.7 + 2 * 0.7 + 2 * 0.5 + 2 * 0.7 +
    2 * 0.6;

  return {
    impulsivScore: normalizeTo10(impulsivRaw, impulsivMax),
    intuitivScore: normalizeTo10(intuitivRaw, intuitivMax),
    analytischScore: normalizeTo10(analytischRaw, analytischMax),
  };
}

function rankEffects(scores: PhotoEffectScores): PhotoEffectRanking {
  const sorted = [
    { key: "impulsiv" as const, value: scores.impulsivScore },
    { key: "intuitiv" as const, value: scores.intuitivScore },
    { key: "analytisch" as const, value: scores.analytischScore },
  ].sort((a, b) => b.value - a.value);

  return {
    primaryEffect: sorted[0].key,
    secondaryEffect: sorted[1].key,
    tertiaryEffect: sorted[2].key,
    gap12: round2(sorted[0].value - sorted[1].value),
    gap23: round2(sorted[1].value - sorted[2].value),
  };
}

const PHOTO_EFFECT_LABELS: Record<PhotoEffectKey, string> = {
  impulsiv: "impulsiv",
  intuitiv: "intuitiv",
  analytisch: "analytisch",
};

const PHOTO_EFFECT_MAIN_TEXT: Record<PhotoEffectKey, string> = {
  impulsiv:
    "Das Foto vermittelt vor allem Präsenz, Direktheit und Durchsetzung.",
  intuitiv:
    "Das Foto vermittelt vor allem Wärme, Zugänglichkeit und Beziehung.",
  analytisch:
    "Das Foto vermittelt vor allem Kontrolle, Ruhe und sachliche Präsenz.",
};

const PHOTO_EFFECT_PERCEPTION_TEXT: Record<PhotoEffectKey, string> = {
  impulsiv:
    "Andere Menschen nehmen diese Wirkung oft als präsent, entschlossen und direkt wahr.",
  intuitiv:
    "Andere Menschen nehmen diese Wirkung oft als sympathisch, offen und nahbar wahr.",
  analytisch:
    "Andere Menschen nehmen diese Wirkung oft als strukturiert, ruhig und kontrolliert wahr.",
};

const PHOTO_EFFECT_LOW_TEXT: Record<PhotoEffectKey, string> = {
  impulsiv:
    "Impulsive Signale wie starke Dominanz, Tempo oder Durchsetzungsdruck stehen hier nicht im Vordergrund.",
  intuitiv:
    "Intuitive Signale wie Wärme, emotionale Nähe oder starke Beziehungsorientierung stehen hier nicht im Vordergrund.",
  analytisch:
    "Analytische Signale wie Distanz, starke Kontrolle oder sachliche Strenge stehen hier nicht im Vordergrund.",
};

function getScoreByKey(
  scores: PhotoEffectScores,
  key: PhotoEffectKey
): number {
  if (key === "impulsiv") return scores.impulsivScore;
  if (key === "intuitiv") return scores.intuitivScore;
  return scores.analytischScore;
}

function buildEffectText(
  scores: PhotoEffectScores,
  ranking: PhotoEffectRanking
): string {
  const primaryScore = getScoreByKey(scores, ranking.primaryEffect);
  const secondaryScore = getScoreByKey(scores, ranking.secondaryEffect);
  const tertiaryScore = getScoreByKey(scores, ranking.tertiaryEffect);

  const primaryStrength = effectStrength(primaryScore);
  const secondaryStrength = effectStrength(secondaryScore);
  const tertiaryStrength = effectStrength(tertiaryScore);

  let text = "";

  text += `Das Foto wirkt primär ${PHOTO_EFFECT_LABELS[ranking.primaryEffect]}. `;
  text += PHOTO_EFFECT_MAIN_TEXT[ranking.primaryEffect] + " ";
  text += PHOTO_EFFECT_PERCEPTION_TEXT[ranking.primaryEffect] + " ";

  if (primaryStrength === "stark") {
    text += "Die Wirkung ist klar und deutlich ausgeprägt. ";
  } else if (primaryStrength === "mittel") {
    text += "Die Wirkung ist gut erkennbar, ohne überzeichnet zu wirken. ";
  } else {
    text += "Die Wirkung ist eher zurückhaltend ausgeprägt. ";
  }

  if (secondaryScore >= 3) {
    text += `Zusätzlich zeigt das Bild einen ${secondaryStrength}en ${PHOTO_EFFECT_LABELS[ranking.secondaryEffect]}en Anteil. `;

    if (ranking.secondaryEffect === "impulsiv") {
      text +=
        "Dadurch wirkt die Person neben der Grundwirkung auch etwas präsenter, direkter oder energischer. ";
    }

    if (ranking.secondaryEffect === "intuitiv") {
      text +=
        "Dadurch wirkt die Person neben der Grundwirkung auch etwas wärmer, offener und zwischenmenschlich zugänglicher. ";
    }

    if (ranking.secondaryEffect === "analytisch") {
      text +=
        "Dadurch wirkt die Person neben der Grundwirkung auch etwas kontrollierter, ruhiger und sachlicher. ";
    }
  }

  if (tertiaryStrength === "leicht") {
    text += PHOTO_EFFECT_LOW_TEXT[ranking.tertiaryEffect] + " ";
  }

  if (ranking.gap12 <= 1.2) {
    text += `Die primäre und sekundäre Wirkung liegen relativ nahe beieinander. Dadurch entsteht insgesamt ein gemischter Eindruck aus ${PHOTO_EFFECT_LABELS[ranking.primaryEffect]}er und ${PHOTO_EFFECT_LABELS[ranking.secondaryEffect]}er Wirkung. `;
  }

  text += NOTE_TEXT;

  return text.trim();
}

export function runPhotoEffectAnalysis(
  features: PhotoFeatures
): PhotoEffectResult {
  const scores = scorePhotoEffect(features);
  const ranking = rankEffects(scores);
  const effectText = buildEffectText(scores, ranking);

  return {
    ...scores,
    ...ranking,
    impulsivStrength: effectStrength(scores.impulsivScore),
    intuitivStrength: effectStrength(scores.intuitivScore),
    analytischStrength: effectStrength(scores.analytischScore),
    effectText,
    note: NOTE_TEXT,
  };
}
