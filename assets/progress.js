// Independent completion flags. Existing pulley progress is preserved.
const keys = {
  pulley: 'technology-grade-6:pulley-completed:v1',
  wheels: 'technology-grade-6:world-of-wheels-completed:v1',
  electronics: 'technology-grade-6:electronics-at-home-completed:v1',
};
const sessionAwards = new Set();
export function hasProgressStar(activity) {
  if (sessionAwards.has(activity)) return true;
  try { return localStorage.getItem(keys[activity]) === 'true'; } catch { return false; }
}
export function renderStarCount() {
  const count = document.querySelector('#star-count');
  if (count) count.textContent = String(Object.keys(keys).filter(hasProgressStar).length);
}
export function awardProgressStar(activity) {
  if (!Object.hasOwn(keys, activity)) throw new Error('Unknown activity');
  if (hasProgressStar(activity)) { renderStarCount(); return { first: false, saved: true }; }
  sessionAwards.add(activity);
  let saved = true;
  try { localStorage.setItem(keys[activity], 'true'); } catch { saved = false; }
  renderStarCount();
  return { first: true, saved };
}
window.addEventListener('storage', event => {
  if (event.key === null || Object.values(keys).includes(event.key)) renderStarCount();
});
renderStarCount();
