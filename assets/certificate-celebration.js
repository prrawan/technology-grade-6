// Decorative effects only. Replaying never writes progress or certificate records.
const active = new WeakMap();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
export function stopCertificateCelebration(dialog) {
  (active.get(dialog) || []).forEach(animation => animation.cancel());
  active.delete(dialog);
  dialog.querySelector('.certificate-confetti').replaceChildren();
}
export function celebrateCertificate(dialog) {
  stopCertificateCelebration(dialog);
  if (reduced.matches || !dialog.open) return;
  const animations = [];
  const animate = (element, frames, options) => { const animation = element.animate(frames, options); animations.push(animation); return animation; };
  animate(dialog.querySelector('.certificate-display'), [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 450, easing: 'ease-out' });
  animate(dialog.querySelector('.certificate-medal'), [{ filter: 'brightness(1)', transform: 'scale(1)' }, { filter: 'brightness(1.6)', transform: 'scale(1.06)', offset: .45 }, { filter: 'brightness(1)', transform: 'scale(1)' }], { duration: 850, delay: 180, easing: 'ease-in-out' });
  const layer = dialog.querySelector('.certificate-confetti');
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('span');
    piece.style.left = `${4 + (i * 17) % 92}%`;
    piece.style.top = `${8 + (i * 13) % 70}%`;
    piece.style.background = i % 2 ? '#D6A248' : '#f5d787';
    layer.append(piece);
    const animation = animate(piece, [{ opacity: 0, transform: 'translateY(-20px) rotate(0deg)' }, { opacity: 1, offset: .2 }, { opacity: 0, transform: `translate(${i % 2 ? 25 : -25}px, 90px) rotate(${i % 2 ? 230 : -200}deg)` }], { duration: 1100, delay: i % 5 * 55, easing: 'ease-out' });
    animation.onfinish = () => piece.remove();
  }
  active.set(dialog, animations);
}
reduced.addEventListener('change', () => {
  if (reduced.matches) document.querySelectorAll('.course-certificate-dialog').forEach(stopCertificateCelebration);
});
