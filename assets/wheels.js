import { awardProgressStar, hasProgressStar } from './progress.js?v=2';
import { bindLessonAudio, stopLessonAudio } from './lesson-audio.js?v=2';
bindLessonAudio();
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
  picture.src = new URL(`${button.dataset.system}-system.svg?v=3d-materials-1`, systemRoot);
  picture.alt = systemNames[button.dataset.system];
  document.querySelector('#system-description').textContent = systemDescriptions[button.dataset.system];
}));
const axisHint = 'راقب المحور. هل يبقى في مكانه أم يصعد مع الحمل؟';
const classificationCards = [...document.querySelectorAll('.classification-card')];
const forceForm = document.querySelector('.force-question');
const forceFeedback = document.querySelector('#force-feedback');
const forceRetry = forceForm.querySelector('.force-retry');
const forceCheck = forceForm.querySelector('.force-check');
const forceChoices = [...forceForm.querySelectorAll('input')];
const answers = classificationCards.map(card => ({ verified: false, correct: false, answer: '', control: card.querySelector('select') }));
answers.push({ verified: false, correct: false, answer: '', control: forceChoices[0] });
const resultCard = document.querySelector('#lesson-result');
let resultShown = false;
function celebrateLesson() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = resultCard.querySelector('.result-stars');
  for (let index = 0; index < 10; index++) {
    const star = document.createElement('span');
    star.textContent = '★'; star.style.color = index % 2 ? '#126C70' : '#D6A248';
    layer.append(star);
    const animation = star.animate([
      { transform: 'translate(0, 0) scale(.4)', opacity: 0 },
      { opacity: 1, offset: .2 },
      { transform: `translate(${(index - 4.5) * 24}px, ${-55 - (index % 3) * 30}px) rotate(${index * 30}deg) scale(1)`, opacity: 0 },
    ], { duration: 850, easing: 'ease-out', iterations: 1 });
    animation.onfinish = () => star.remove();
  }
}
function updateResult() {
  const verified = answers.filter(answer => answer.verified).length;
  const correct = answers.filter(answer => answer.verified && answer.correct).length;
  if (verified === answers.length) resultShown = true;
  if (!resultShown) return;
  resultCard.hidden = false;
  const complete = correct === answers.length;
  const congratulationsAudio = document.querySelector('#lesson-congratulations-audio');
  congratulationsAudio.hidden = !complete;
  if (!complete) stopLessonAudio(congratulationsAudio);
  document.querySelector('#lesson-score').textContent = `الإجابات الصحيحة: ${correct} من ${answers.length}.` + (verified < answers.length ? ` أجبت عن ${verified} من ${answers.length} أسئلة؛ تحقّق من المحاولات الجديدة.` : '');
  document.querySelector('#result-title').textContent = complete ? 'أحسنت! أكملت الدرس' : 'نتيجتك في الدرس';
  document.querySelector('#completion-message').textContent = complete ? 'ميّزت بين أنظمة البَكرات واخترت النظام المناسب لرفع الحمل' : 'بعض الإجابات تحتاج إلى المراجعة. يمكنك تصحيحها ثم التحقّق من جديد.';
  document.querySelector('#review-answers').hidden = complete;
  const awardMessage = document.querySelector('#lesson-award-message');
  if (complete) {
    const award = awardProgressStar('wheels');
    awardMessage.textContent = award.first
      ? award.saved ? '★ ربحت نجمة إنجاز الدرس، وحُفظت على جهازك!' : '★ ربحت نجمة إنجاز لهذه الجلسة؛ تعذّر حفظها على الجهاز.'
      : '★ نجمة الدرس محتسبة؛ لن تُضاف مرة أخرى.';
    if (award.first) celebrateLesson();
  } else {
    awardMessage.textContent = hasProgressStar('wheels') ? '★ نجمة إنجازك السابق محفوظة. صحّح المحاولات الحالية لتحديث نتيجتك.' : '';
  }
}
document.querySelector('#review-answers').addEventListener('click', () => {
  const target = answers.find(answer => !answer.verified || !answer.correct)?.control;
  if (!target) return;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});
classificationCards.forEach((card, index) => {
  const select = card.querySelector('select');
  const status = card.querySelector('.class-status');
  const retry = card.querySelector('.classification-retry');
  const check = card.querySelector('.classification-check');
  const state = answers[index];
  function changed() {
    if (state.verified && state.answer === select.value) return;
    state.verified = false; state.correct = false; state.answer = select.value;
    check.disabled = !select.value;
    status.textContent = select.value ? 'تم تسجيل اختيارك. اضغط تحقّق من إجابتي.' : 'اختر إجابتك.';
    updateResult();
  }
  select.addEventListener('change', changed); select.addEventListener('input', changed);
  window.addEventListener('pageshow', changed);
  check.addEventListener('click', () => {
    if (!select.value) return;
    state.answer = select.value; state.verified = true; state.correct = select.value === card.dataset.correct;
    status.textContent = state.correct ? `أحسنت! ${systemDescriptions[select.value]}` : `حاول مجددًا. ${axisHint}`;
    retry.hidden = false; check.disabled = true;
    updateResult();
  });
  retry.addEventListener('click', () => { select.value = ''; state.verified = false; changed(); retry.hidden = true; select.focus(); });
});
const forceState = answers.at(-1);
function forceChanged() {
  const selected = forceChoices.find(choice => choice.checked);
  if (forceState.verified && forceState.answer === selected?.value) return;
  forceState.verified = false; forceState.correct = false; forceState.answer = selected?.value || '';
  forceCheck.disabled = !selected;
  forceFeedback.textContent = selected ? 'تم تسجيل اختيارك. اضغط تحقّق من إجابتي.' : 'اختر النظام المناسب.';
  updateResult();
}
forceChoices.forEach(choice => { choice.addEventListener('input', forceChanged); choice.addEventListener('change', forceChanged); choice.addEventListener('click', forceChanged); });
window.addEventListener('pageshow', forceChanged);
forceForm.addEventListener('submit', event => {
  event.preventDefault();
  const selected = forceChoices.find(choice => choice.checked);
  if (!selected) return;
  forceState.answer = selected.value; forceState.verified = true; forceState.correct = selected.value === 'compound';
  const explanation = 'عندما يحمل الصندوق أكثر من جزء من الحبل، تتوزّع الحمولة وتقلّ قوة السحب اللازمة.';
  forceFeedback.textContent = selected.value === 'compound'
    ? `أحسنت! النظام المركّب هو الاختيار المتوقع هنا. ${explanation}`
    : selected.value === 'moving'
      ? `البَكرة المتحركة قد تقلّل القوة أيضًا. الاختيار المتوقع في هذا السؤال هو النظام المركّب. ${explanation}`
      : `البَكرة الثابتة تغيّر اتجاه السحب. لهذا الصندوق نختار النظام المركّب. ${explanation}`;
  forceRetry.hidden = false; forceCheck.disabled = true;
  updateResult();
});
forceRetry.addEventListener('click', () => { forceChoices.forEach(choice => choice.checked = false); forceState.verified = false; forceChanged(); forceRetry.hidden = true; forceChoices[0].focus(); });

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
