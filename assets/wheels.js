const descriptions = {
  wheel: 'العجلة: تدور عندما يتحرّك الحبل.',
  axle: 'المحور: تدور العجلة حوله.',
  rope: 'الحبل: ينقل السحب إلى الحمل.',
};
const parts = [...document.querySelectorAll('[data-part]')];
function selectPart(name) {
  parts.forEach(part => { const chosen = part.dataset.part === name; part.setAttribute('aria-pressed', String(chosen)); part.classList.toggle('selected', chosen); });
  document.querySelector('.part-description').textContent = descriptions[name];
}
parts.forEach(part => {
  part.addEventListener('click', () => selectPart(part.dataset.part));
  if (part.tagName.toLowerCase() === 'g') part.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectPart(part.dataset.part); }
  });
});
document.querySelector('.history-cart').addEventListener('click', () => {
  document.querySelector('#history-message').textContent = 'ساعدت العجلات الناس على نقل الأشياء من مكان إلى آخر بسهولة أكبر';
});
const systemDescriptions = {
  fixed: 'الثابتة: يبقى محورها في مكانه وتغيّر اتجاه السحب.',
  moving: 'المتحركة: يتحرّك محورها مع الحمل.',
  compound: 'المركّبة: تجمع بين بَكرات ثابتة ومتحركة، ويمكن أن تقلّل القوة اللازمة لرفع الحمل.',
};
const systemNames = { fixed: 'بكرة ثابتة', moving: 'بكرة متحركة', compound: 'بكرات مركّبة' };
const picture = document.querySelector('#system-picture');
const systemRoot = new URL('.', picture.src);
document.querySelectorAll('[data-system]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-system]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  picture.src = new URL(`${button.dataset.system}-system.svg`, systemRoot);
  picture.alt = systemNames[button.dataset.system];
  document.querySelector('#system-description').textContent = systemDescriptions[button.dataset.system];
}));
const axisHint = 'راقب المحور. هل يبقى في مكانه أم يصعد مع الحمل؟';
document.querySelectorAll('.classification-card').forEach(card => {
  const select = card.querySelector('select');
  const status = card.querySelector('.class-status');
  const retry = card.querySelector('button');
  select.addEventListener('change', () => {
    if (!select.value) { status.textContent = 'اختر إجابتك.'; return; }
    status.textContent = select.value === card.dataset.correct
      ? `أحسنت! ${systemDescriptions[select.value]}`
      : `حاول مجددًا. ${axisHint}`;
    retry.hidden = false;
  });
  retry.addEventListener('click', () => { select.value = ''; status.textContent = 'اختر إجابتك.'; retry.hidden = true; select.focus(); });
});
const forceForm = document.querySelector('.force-question');
const forceFeedback = document.querySelector('#force-feedback');
const forceRetry = forceForm.querySelector('button');
const forceChoices = [...forceForm.querySelectorAll('input')];
forceForm.addEventListener('submit', event => event.preventDefault());
forceChoices.forEach(choice => choice.addEventListener('change', () => {
  const selected = forceChoices.find(option => option.checked);
  const explanation = 'عندما يحمل الصندوق أكثر من جزء من الحبل، تتوزّع الحمولة وتقلّ قوة السحب اللازمة.';
  forceFeedback.textContent = selected.value === 'compound'
    ? `أحسنت! النظام المركّب هو الاختيار المتوقع هنا. ${explanation}`
    : selected.value === 'moving'
      ? `البَكرة المتحركة قد تقلّل القوة أيضًا. الاختيار المتوقع في هذا السؤال هو النظام المركّب. ${explanation}`
      : `البَكرة الثابتة تغيّر اتجاه السحب. لهذا الصندوق نختار النظام المركّب. ${explanation}`;
  forceRetry.hidden = false;
}));
forceRetry.addEventListener('click', () => { forceChoices.forEach(choice => choice.checked = false); forceFeedback.textContent = 'اختر النظام المناسب.'; forceRetry.hidden = true; forceChoices[0].focus(); });
const pedalButton = document.querySelector('#pedal-button');
const bikeReset = document.querySelector('#bike-reset');
const pedal = document.querySelector('.bike-pedal');
const chain = document.querySelector('.bike-chain');
const rear = document.querySelector('.rear-wheel');
const bikeStatus = document.querySelector('#bike-status');
let bikeBusy = false;
function bikeFrame(progress) {
  const stage = Math.min(2, Math.floor(progress * 3));
  document.querySelectorAll('[data-step]').forEach(node => node.classList.toggle('active', Number(node.dataset.step) <= stage));
  pedal.setAttribute('transform', `rotate(${progress * 360} 176 162)`);
  chain.style.strokeDashoffset = -Math.max(0, progress - 1 / 3) * 120;
  rear.setAttribute('transform', `rotate(${Math.max(0, progress - 2 / 3) * 900} 75 140)`);
  pedal.classList.add('in-motion');
  chain.classList.toggle('in-motion', stage >= 1);
  rear.classList.toggle('in-motion', stage >= 2);
  bikeStatus.textContent = ['تبدأ الحركة من الدوّاسة.', 'تنتقل الحركة إلى السلسلة.', 'تدور العجلة الخلفية.'][stage];
}
function finishBike() { bikeFrame(1); bikeStatus.textContent = 'تنقل السلسلة الحركة من الدوّاسة إلى العجلة الخلفية فتدور'; bikeReset.hidden = false; }
pedalButton.addEventListener('click', () => {
  if (bikeBusy) return;
  bikeBusy = true; pedalButton.disabled = true;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finishBike(); return; }
  const start = performance.now();
  function tick(now) { const progress = Math.min(1, (now - start) / 1800); bikeFrame(progress); if (progress < 1) requestAnimationFrame(tick); else finishBike(); }
  requestAnimationFrame(tick);
});
bikeReset.addEventListener('click', () => {
  bikeBusy = false; pedalButton.disabled = false; bikeReset.hidden = true;
  pedal.removeAttribute('transform'); rear.removeAttribute('transform'); chain.style.strokeDashoffset = '0';
  [pedal, chain, rear].forEach(node => node.classList.remove('in-motion'));
  document.querySelectorAll('[data-step]').forEach(node => node.classList.remove('active'));
  bikeStatus.textContent = 'اضغط الزر لمتابعة انتقال الحركة.';
});
const tabs = [...document.querySelectorAll('.lesson-tabs a')];
function markSection() { const hash = location.hash === '#pulley-experiment' ? '#try' : location.hash || '#learn'; tabs.forEach(tab => { if (tab.hash === hash) tab.setAttribute('aria-current', 'location'); else tab.removeAttribute('aria-current'); }); }
window.addEventListener('hashchange', markSection); markSection();
