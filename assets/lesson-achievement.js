// Presentation only: grading, stored progress and recording paths belong to each lesson.
const previous = new WeakMap();
export function presentAchievement(card, { correct, total, complete, earned, first, saved }) {
  const old = previous.get(card);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  card.classList.toggle('achievement-earned', earned);
  card.classList.toggle('achievement-complete', complete);
  const badge = card.querySelector('.achievement-award');
  badge.textContent = earned ? first ? saved ? 'ربحت نجمة الدرس!' : 'ربحت نجمة لهذه الجلسة' : 'نجمة الدرس محفوظة' : 'صحّح إجاباتك لتحصل على النجمة';
  const checks = card.querySelector('.achievement-checks');
  checks.replaceChildren(...Array.from({ length: total }, (_, index) => {
    const mark = document.createElement('span'); mark.textContent = index < correct ? '✓' : '○';
    mark.className = index < correct ? 'is-correct' : ''; return mark;
  }));
  if (!reduced) {
    if (!old || (complete && !old.complete)) card.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 450, easing: 'ease-out' });
    if (!old || old.correct !== correct) card.querySelector('.achievement-score').animate([{ opacity: .2 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' });
    if (first) card.querySelector('.achievement-star').animate([
      { filter: 'brightness(1)', transform: 'scale(1)' },
      { filter: 'brightness(1.5)', transform: 'scale(1.08)', offset: .45 },
      { filter: 'brightness(1)', transform: 'scale(1)' },
    ], { duration: 800, iterations: 1, easing: 'ease-in-out' });
  }
  previous.set(card, { correct, complete });
}
