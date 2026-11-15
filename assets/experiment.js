// One earned star per completed pulley experiment, independent of prediction.
const progressKey = 'technology-grade-6:pulley-completed:v1';
let completed = false;
try { completed = localStorage.getItem(progressKey) === 'true'; } catch { /* Session fallback when storage is unavailable. */ }
const count = document.querySelector('#star-count');
const updateCount = () => { if (count) count.textContent = completed ? '1' : '0'; };
updateCount();
window.addEventListener('storage', event => {
  if (event.key === progressKey || event.key === null) {
    try { completed = localStorage.getItem(progressKey) === 'true'; } catch { return; }
    updateCount();
  }
});
function awardStar() {
  const message = document.querySelector('#star-message');
  try { completed = completed || localStorage.getItem(progressKey) === 'true'; } catch { /* Keep session state. */ }
  if (completed) {
    message.textContent = '★ نجمتك محفوظة؛ يمكنك تكرار التجربة كما تشاء.';
    updateCount();
    return;
  }
  completed = true;
  let saved = true;
  try { localStorage.setItem(progressKey, 'true'); } catch { saved = false; }
  updateCount();
  message.textContent = saved ? '★ ربحت نجمة لأنك أكملت التجربة! الاختبار والاكتشاف يستحقان نجمة.' : '★ ربحت نجمة لهذه الجلسة! تعذّر حفظها على الجهاز.';
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    message.animate([{ transform: 'scale(.95)', opacity: .3 }, { transform: 'scale(1.04)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }], { duration: 600, iterations: 1 });
  }
}

const scene = document.querySelector('.pulley-scene');
if (scene) {
  document.querySelector('#try-pulley').addEventListener('click', () => document.querySelector('#prediction').focus({ preventScroll: true }));
  const characterRoot = new URL('.', scene.querySelector('.scene-lin').src).href;
  const pull = document.querySelector('#pull');
  const reset = document.querySelector('#reset');
  const choices = [...document.querySelectorAll('[name="prediction"]')];
  const summary = document.querySelector('#prediction-summary');
  const feedback = document.querySelector('#feedback');
  const actions = document.querySelector('#result-actions');
  const rope = document.querySelector('#rope');
  const load = document.querySelector('#load');
  const arm = document.querySelector('#yazan-forearm');
  let busy = false;
  let predictionValue = null;
  choices.forEach(choice => choice.addEventListener('change', () => {
    if (busy) return;
    predictionValue = choice.value;
    pull.disabled = false;
    summary.textContent = `توقّعك: الصندوق سيتحرّك ${choice.value === 'up' ? 'إلى أعلى' : 'إلى أسفل'}`;
    feedback.textContent = 'اضغط اسحب الحبل لتجربة توقّعك.';
  }));
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
    const prediction = predictionValue;
    if (busy || !prediction) return;
    busy = true;
    pull.disabled = true;
    choices.forEach(choice => choice.disabled = true);
    const finish = () => {
      render(1);
      scene.querySelector('.scene-lin').src = `${characterRoot}lin-point-scene.png`;
      scene.querySelector('.scene-lin').alt = 'لين تشير إلى الصندوق المرتفع';
      feedback.innerHTML = `توقّعك: <strong>${prediction === 'up' ? 'إلى أعلى' : 'إلى أسفل'}</strong>. النتيجة: <strong>ارتفع الصندوق</strong>. ${prediction === 'up' ? 'أحسنت! وافقت النتيجة توقّعك.' : 'توقّعت نزول الصندوق؛ لاحظ أنه ارتفع.'} <strong>البَكَرَة الثابتة تغيّر اتجاه السحب</strong>: نسحب إلى أسفل، فترتفع <strong>الحَمولة</strong> إلى أعلى.`;
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
    actions.hidden = true;
    document.querySelector('#star-message').textContent = '';
    pull.disabled = true;
    scene.querySelector('.scene-lin').src = `${characterRoot}lin-welcome-scene.png`;
    scene.querySelector('.scene-lin').alt = 'لين تراقب الصندوق';
    summary.textContent = 'اختر توقّعك لتبدأ.';
    feedback.textContent = 'اختر توقّعك أولًا لتفعيل السحب.';
    choices[0].focus();
  });
}
