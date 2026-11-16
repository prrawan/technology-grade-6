import { stopLessonAudio } from './lesson-audio.js?v=2';
import { awardProgressStar } from './progress.js?v=2';
function awardStar() {
  const message = document.querySelector('#star-message');
  const award = awardProgressStar('pulley');
  if (!award.first) {
    message.textContent = '★ نجمتك محفوظة؛ يمكنك تكرار التجربة كما تشاء.';
    return;
  }
  message.textContent = award.saved ? '★ ربحت نجمة لأنك أكملت التجربة! الاختبار والاكتشاف يستحقان نجمة.' : '★ ربحت نجمة لهذه الجلسة! تعذّر حفظها على الجهاز.';
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    message.animate([{ transform: 'scale(.95)', opacity: .3 }, { transform: 'scale(1.04)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }], { duration: 600, iterations: 1 });
  }
}

const scene = document.querySelector('.pulley-scene');
if (scene) {
  if (new URLSearchParams(location.search).get('from') === 'world-of-wheels') {
    const returnLink = document.createElement('a');
    returnLink.className = 'back-link';
    returnLink.href = 'world-of-wheels.html#apply';
    returnLink.textContent = '← العودة إلى طبّق في الدرس';
    scene.closest('.experiment').prepend(returnLink);
    const resultLink = document.querySelector('#result-actions a');
    resultLink.href = returnLink.href;
    resultLink.textContent = 'العودة إلى طبّق في الدرس ←';
  }
  document.querySelector('#try-pulley').addEventListener('click', () => document.querySelector('#prediction').focus({ preventScroll: true }));
  const lin = scene.querySelector('.scene-lin');
  const characterRoot = new URL('.', new URL(lin.getAttribute('href'), document.baseURI)).href;
  function setLinPose(pointing) {
    // Native SVG image: one figure, fixed shoe baseline, pose-specific horizontal anchor.
    lin.setAttribute('href', `${characterRoot}lin-${pointing ? 'point' : 'welcome'}-3d-scene.png`);
    lin.setAttribute('x', pointing ? '10.26' : '36');
    lin.setAttribute('aria-label', pointing ? 'لين تشير إلى الصندوق المرتفع' : 'لين تراقب الصندوق');
  }
  setLinPose(false);
  const pull = document.querySelector('#pull');
  const reset = document.querySelector('#reset');
  const choices = [...document.querySelectorAll('[name="prediction"]')];
  const summary = document.querySelector('#prediction-summary');
  const feedback = document.querySelector('#feedback');
  const actions = document.querySelector('#result-actions');
  const commentary = document.querySelector('#pulley-audio-commentary');
  const rope = document.querySelector('#rope');
  const load = document.querySelector('#load');
  const arm = document.querySelector('#yazan-forearm');
  let busy = false;
  let predictionValue = null;
  function syncPrediction() {
    if (busy) return;
    const choice = choices.find(input => input.checked);
    predictionValue = choice?.value ?? null;
    pull.disabled = !predictionValue;
    summary.textContent = choice
      ? `توقّعك: الصندوق سيتحرّك ${choice.value === 'up' ? 'إلى أعلى' : 'إلى أسفل'}`
      : 'اختر توقّعك لتبدأ.';
    feedback.textContent = choice ? 'اضغط اسحب الحبل لتجربة توقّعك.' : 'اختر توقّعك أولًا لتفعيل السحب.';
  }
  choices.forEach(choice => {
    for (const event of ['input', 'change', 'click']) choice.addEventListener(event, syncPrediction);
  });
  window.addEventListener('pageshow', syncPrediction);
  syncPrediction();
  function render(progress) {
    // Rotate the extracted forearm around its elbow in source-image coordinates.
    const angle = -110 * progress;
    const radians = angle * Math.PI / 180;
    const elbow = { x: 195, y: 345 };
    const grip = { x: 119, y: 282 };
    const dx = grip.x - elbow.x;
    const dy = grip.y - elbow.y;
    const scale = 240 / 724;
    const reach = 1 + 0.335 * progress;
    const x = 290 + (elbow.x + (dx * Math.cos(radians) - dy * Math.sin(radians)) * reach) * scale;
    const y = 40 + (elbow.y + (dx * Math.sin(radians) + dy * Math.cos(radians)) * reach) * scale;
    const startY = 40 + grip.y * scale;
    // Fixed pulley: the load rises by exactly the downward grip displacement.
    const shift = y - startY;
    arm.setAttribute('transform', `translate(${elbow.x} ${elbow.y}) rotate(${angle}) scale(${reach}) translate(${-elbow.x} ${-elbow.y})`);
    rope.setAttribute('d', `M270 ${300-shift}V105a30 30 0 0 1 60 0L${x} ${y}L${x} ${y+18}`);
    rope.dataset.gripX = x;
    rope.dataset.gripY = y;
    load.setAttribute('transform', `translate(0 ${-shift})`);
    load.dataset.rise = shift;
    rope.dataset.loadY = 300 - shift;
  }
  render(0);
  pull.addEventListener('click', () => {
    syncPrediction();
    const prediction = predictionValue;
    if (busy || !prediction) return;
    busy = true;
    pull.disabled = true;
    choices.forEach(choice => choice.disabled = true);
    const finish = () => {
      render(1);
      setLinPose(true);
      feedback.innerHTML = `توقّعك: <strong>${prediction === 'up' ? 'إلى أعلى' : 'إلى أسفل'}</strong>. النتيجة: <strong>ارتفع الصندوق</strong>. ${prediction === 'up' ? 'أحسنت! وافقت النتيجة توقّعك.' : 'توقّعت نزول الصندوق؛ لاحظ أنه ارتفع.'} عندما نسحب الحبل إلى أسفل، يرتفع الصندوق. <strong>البَكرة الثابتة غيّرت اتجاه السحب</strong>.`;
      if (commentary) {
        commentary.querySelectorAll('[data-commentary]').forEach(panel => { panel.hidden = panel.dataset.commentary !== prediction; });
        commentary.hidden = false;
      }
      actions.hidden = false;
      awardStar();
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now-start)/850, 1);
      render(progress);
      if (progress < 1) requestAnimationFrame(tick); else finish();
    }
    requestAnimationFrame(tick);
  });
  reset.addEventListener('click', () => {
    busy = false;
    predictionValue = null;
    choices.forEach(choice => { choice.checked = false; choice.disabled = false; });
    render(0);
    stopLessonAudio(commentary);
    if (commentary) {
      commentary.hidden = true;
      commentary.querySelectorAll('[data-commentary]').forEach(panel => panel.hidden = true);
    }
    actions.hidden = true;
    document.querySelector('#star-message').textContent = '';
    pull.disabled = true;
    setLinPose(false);
    summary.textContent = 'اختر توقّعك لتبدأ.';
    feedback.textContent = 'اختر توقّعك أولًا لتفعيل السحب.';
    choices[0].focus();
  });
}
