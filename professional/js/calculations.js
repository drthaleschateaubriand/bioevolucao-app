export function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function bmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function compositionFromFatPercent(weightKg, fatPct) {
  if (weightKg == null || fatPct == null) return { fatMass: null, leanMass: null };
  const fatMass = weightKg * fatPct / 100;
  return { fatMass, leanMass: weightKg - fatMass };
}

export function jacksonPollock7({ sex, age, folds }) {
  if (!age || !Array.isArray(folds) || folds.length !== 7 || folds.some(v => !Number.isFinite(v) || v <= 0)) {
    return null;
  }
  const sum = folds.reduce((a,b)=>a+b,0);
  const density = sex === "female"
    ? 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age
    : 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age;
  const fatPct = 495 / density - 450;
  return { sum, density, fatPct };
}

export function ageFromBirthDate(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate + "T12:00:00");
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age--;
  return age;
}

export function formatNumber(value, digits=1) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}
