import { awardProgressStar, hasProgressStar } from './progress.js?v=3';
import { bindLessonAudio, stopLessonAudio } from './lesson-audio.js?v=2';
bindLessonAudio();
const componentDescriptions = {
  breadboard: 'لوحة التجارب: نوصّل بها المكوّنات ونجرب الدارة دون لحام.',
  led: 'باعث الضوء LED: يبعث الضوء عند مرور تيار مناسب فيه.',
  fixed: 'المقاومة الثابتة: تحدّ مرور التيار بقيمة مقاومة ثابتة.',
  variable: 'المقاومة المتغيّرة: تتيح تغيير المقاومة للتحكّم في التيار وسطوع LED.',
};
const devices = [...document.querySelectorAll('[data-device]')];
devices.forEach(button => button.addEventListener('click', () => {
  devices.forEach(other => other.setAttribute('aria-pressed', String(button === other)));
  document.querySelector('#device-feedback').textContent = (button.dataset.device === 'remote' ? 'أحسنت! ' : 'لاحظ الفرق: ') + 'جهاز التحكّم فيه دارة إلكترونية ترسل الإشارة، بينما المضرب اليدوي يعمل بحركة اليد.';
}));
const componentButtons = [...document.querySelectorAll('[data-component]')];
componentButtons.forEach(button => button.addEventListener('click', () => {
  componentButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  document.querySelector('#component-feedback').textContent = componentDescriptions[button.dataset.component];
}));
const resistance = document.querySelector('#resistance');
const lighting = document.querySelector('#lighting-led');
function updateLighting(interacted = false) {
  const value = Number(resistance.value);
  const relative = 100 / value;
  const state = value >= 750 ? 'إضاءة خافتة' : value >= 350 ? 'إضاءة متوسطة' : 'إضاءة ساطعة';
  lighting.querySelector('.led-light-core').style.opacity = String(.15 + relative * .85);
  lighting.querySelector('.led-halo').style.opacity = String(relative);
  lighting.setAttribute('aria-label', `باعث ضوء — ${state}`);
  document.querySelector('#resistance-value').textContent = String(value);
  document.querySelector('#brightness-level').textContent = state;
  resistance.setAttribute('aria-valuetext', `${value} أوم — ${state}`);
  if (interacted) {
    document.querySelector('#lighting-feedback').textContent = `${state}. عندما تزيد المقاومة، يقلّ التيار في هذه المحاكاة ويخفت ضوء LED.`;
    document.querySelector('#lighting-audio').hidden = false;
  }
}
resistance.addEventListener('input', () => updateLighting(true));
resistance.addEventListener('change', () => updateLighting(true));
updateLighting();
const sensorButton = document.querySelector('#sensor-button');
const sensorReset = document.querySelector('#sensor-reset');
const sensorDiagram = document.querySelector('.sensor-diagram');
const sensorAudio = document.querySelector('#sensor-audio');
let sensing = false;
sensorButton.addEventListener('click', () => {
  if (sensing) return;
  sensing = true; sensorButton.disabled = true;
  document.querySelector('[data-sensor-step="signal"]').classList.add('active');
  document.querySelector('#sensor-feedback').textContent = 'تصل إشارة من المستشعر إلى الترانزستور…';
  const finish = () => {
    sensorDiagram.classList.add('on');
    sensorDiagram.setAttribute('aria-label', 'وصلت الإشارة، فأغلق الترانزستور المسار وأضاء باعث الضوء');
    document.querySelectorAll('[data-sensor-step]').forEach(step => step.classList.add('active'));
    document.querySelector('#sensor-feedback').textContent = 'وصلت إشارة من المستشعر، فعمل الترانزستور كمفتاح إلكتروني وسمح بمرور التيار إلى باعث الضوء فأضاء.';
    sensorAudio.hidden = false; sensorReset.hidden = false;
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
  else setTimeout(finish, 550);
});
sensorReset.addEventListener('click', () => {
  sensing = false; sensorButton.disabled = false; sensorReset.hidden = true;
  sensorDiagram.classList.remove('on');
  sensorDiagram.setAttribute('aria-label', 'محاكاة إشارة مستشعر تتحكّم بمفتاح ترانزستور وباعث ضوء');
  document.querySelectorAll('[data-sensor-step]').forEach(step => step.classList.remove('active'));
  stopLessonAudio(sensorAudio); sensorAudio.hidden = true;
  document.querySelector('#sensor-feedback').textContent = 'اضغط لتفعيل الاستشعار في المحاكاة.';
});
const question = document.querySelector('#brightness-question');
const choices = [...question.querySelectorAll('input')];
const check = question.querySelector('.answer-check');
const feedback = question.querySelector('.answer-feedback');
const retry = question.querySelector('.answer-retry');
const matchingCards = [...document.querySelectorAll('.matching-card')];
const states = [{ control: choices[0], verified: false, correct: false, answer: '' }, ...matchingCards.map(card => ({ control: card.querySelector('select'), verified: false, correct: false, answer: '' }))];
const result = document.querySelector('#electronics-result');
const congratulations = document.querySelector('#electronics-congratulations');
let resultShown = false;
function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = result.querySelector('.result-stars');
  for (let i = 0; i < 10; i++) {
    const star = document.createElement('span'); star.textContent = '★'; star.style.color = i % 2 ? '#126C70' : '#D6A248'; layer.append(star);
    const animation = star.animate([{ transform: 'translate(0,0) scale(.4)', opacity: 0 }, { opacity: 1, offset: .2 }, { transform: `translate(${(i-4.5)*24}px,${-55-(i%3)*30}px) scale(1)`, opacity: 0 }], { duration: 850, easing: 'ease-out', iterations: 1 });
    animation.onfinish = () => star.remove();
  }
}
function updateResult() {
  const verified = states.filter(state => state.verified).length;
  const correct = states.filter(state => state.verified && state.correct).length;
  if (verified === states.length) resultShown = true;
  if (!resultShown) return;
  result.hidden = false;
  const complete = correct === states.length;
  document.querySelector('#electronics-result-title').textContent = complete ? 'أحسنت! أكملت الدرس' : 'نتيجتك في الدرس';
  document.querySelector('#electronics-score').textContent = `الإجابات الصحيحة: ${correct} من ${states.length}.` + (verified < states.length ? ` تحقّق من المحاولات الجديدة؛ أجبت عن ${verified} من ${states.length}.` : '');
  document.querySelector('#electronics-completion').textContent = complete ? 'ميّزت المكوّنات ووظائفها، وعرفت كيف تغيّر المقاومة شدة الإضاءة وكيف يعمل الترانزستور كمفتاح إلكتروني.' : 'راجع الإجابات التي تحتاج تصحيحًا، ثم تحقّق منها مرة أخرى.';
  document.querySelector('#electronics-review').hidden = complete;
  congratulations.hidden = !complete;
  if (!complete) stopLessonAudio(congratulations);
  const awardText = document.querySelector('#electronics-award');
  if (complete) {
    const award = awardProgressStar('electronics');
    awardText.textContent = award.first ? award.saved ? '★ ربحت نجمة إنجاز الدرس وحُفظت على جهازك!' : '★ ربحت نجمة لهذه الجلسة؛ تعذّر حفظها على الجهاز.' : '★ نجمة الدرس محتسبة؛ لن تضاف مرة أخرى.';
    if (award.first) celebrate();
  } else awardText.textContent = hasProgressStar('electronics') ? '★ نجمة إنجازك السابق محفوظة.' : '';
}
document.querySelector('#electronics-review').addEventListener('click', () => {
  const target = states.find(state => !state.verified || !state.correct)?.control;
  if (!target) return;
  target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});
function changedBrightnessAnswer() {
  const selected = choices.find(choice => choice.checked);
  if (states[0].verified && states[0].answer === selected?.value) return;
  states[0].verified = false; states[0].correct = false; states[0].answer = selected?.value || '';
  check.disabled = !selected; feedback.textContent = selected ? 'تم تسجيل اختيارك. اضغط تحقّق من إجابتي.' : 'اختر إجابتك ثم تحقّق منها.';
  updateResult();
}
choices.forEach(choice => { for (const event of ['input','change','click']) choice.addEventListener(event, changedBrightnessAnswer); });
window.addEventListener('pageshow', changedBrightnessAnswer);
question.addEventListener('submit', event => {
  event.preventDefault(); const selected = choices.find(choice => choice.checked); if (!selected) return;
  states[0].answer = selected.value; states[0].verified = true; states[0].correct = selected.value === 'dim';
  feedback.textContent = states[0].correct ? 'أحسنت! عندما تزيد المقاومة يقلّ التيار ويخفت ضوء LED في هذه الدارة.' : 'جرّب المنزلق مجددًا: عندما تزيد المقاومة، يقلّ التيار فيخفت الضوء ولا يزداد سطوعًا.';
  check.disabled = true; retry.hidden = false; updateResult();
});
retry.addEventListener('click', () => { choices.forEach(choice => choice.checked = false); states[0].verified = false; changedBrightnessAnswer(); retry.hidden = true; choices[0].focus(); });
matchingCards.forEach((card, index) => {
  const select = card.querySelector('select'), button = card.querySelector('.match-check'), message = card.querySelector('.match-feedback'), again = card.querySelector('.match-retry');
  const state = states[index+1];
  function changed() {
    if (state.verified && state.answer === select.value) return;
    state.answer = select.value; state.verified = false; state.correct = false;
    button.disabled = !select.value; message.textContent = select.value ? 'تم تسجيل اختيارك. اضغط تحقّق من إجابتي.' : 'اختر وظيفة المكوّن.'; updateResult();
  }
  select.addEventListener('input', changed); select.addEventListener('change', changed); window.addEventListener('pageshow', changed);
  button.addEventListener('click', () => {
    if (!select.value) return;
    state.answer = select.value; state.verified = true; state.correct = select.value === card.dataset.correct;
    message.textContent = state.correct ? `أحسنت! ${componentDescriptions[card.dataset.correct]}` : `راجع الوظيفة: ${componentDescriptions[card.dataset.correct]} ثم حاول مرة أخرى.`;
    button.disabled = true; again.hidden = false; updateResult();
  });
  again.addEventListener('click', () => { select.value = ''; state.verified = false; changed(); again.hidden = true; select.focus(); });
});
const tabs = [...document.querySelectorAll('.lesson-tabs a')];
function markSection() { tabs.forEach(tab => { if (tab.hash === (location.hash || '#learn')) tab.setAttribute('aria-current','location'); else tab.removeAttribute('aria-current'); }); }
window.addEventListener('hashchange',markSection); markSection();
