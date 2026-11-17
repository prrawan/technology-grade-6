import { hasProgressStar } from './progress.js?v=3';
export const certificateKey = unit => `technology-grade-6:certificate:${unit.id}:v1`;
export function readFlag(key) { try { return localStorage.getItem(key) === 'true'; } catch { return false; } }
export function unitProgress(unit) {
  const completedLessons = unit.lessons.filter(lesson => readFlag(lesson.key)).length;
  const challengeComplete = readFlag(unit.challenge.key);
  return { completedLessons, challengeComplete, complete: unit.lessons.length > 0 && completedLessons === unit.lessons.length && challengeComplete };
}
export function readCertificate(unit) {
  try {
    const record = JSON.parse(localStorage.getItem(certificateKey(unit)) || 'null');
    return record && record.unitId === unit.id && typeof record.name === 'string' && record.name.trim() && record.name.length <= 80 && Number.isFinite(Date.parse(record.issuedAt)) ? record : null;
  } catch { return null; }
}
export function saveCertificate(unit, name) {
  if (!unitProgress(unit).complete) throw new Error('requirements');
  const previous = readCertificate(unit);
  const record = { unitId: unit.id, name: name.trim().replace(/\s+/g, ' '), issuedAt: previous?.issuedAt || new Date().toISOString(), version: 1 };
  if (!record.name || record.name.length > 80) throw new Error('name');
  let saved = true;
  try { localStorage.setItem(certificateKey(unit), JSON.stringify(record)); } catch { saved = false; }
  return { record, saved };
}
export function starItems() {
  return [{ id: 'pulley', title: 'تجربة البَكرة' }, { id: 'wheels', title: 'درس عالم من عجلات' }, { id: 'electronics', title: 'درس إلكترونيات في بيتي' }, { id: 'thinkingChallenge', title: 'تحدّي وحدة نفكّر بالتكنولوجيا' }].map(item => ({ ...item, earned: hasProgressStar(item.id) }));
}
