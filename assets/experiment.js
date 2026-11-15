const scene = document.querySelector('.pulley-scene');
if (scene) {
  const pull = document.querySelector('#pull');
  const reset = document.querySelector('#reset');
  const choices = [...document.querySelectorAll('[name="prediction"]')];
  const feedback = document.querySelector('#feedback');
  const actions = document.querySelector('#result-actions');
  const rope = document.querySelector('#rope');
  const load = document.querySelector('#load');
  const arm = document.querySelector('#pull-arm');
  let busy = false;
  choices.forEach(choice => choice.addEventListener('change', () => { if (!busy) pull.disabled = false; }));
  function render(progress) {
    const shift = 65 * progress;
    load.setAttribute('transform', `translate(0 ${-shift})`);
    rope.setAttribute('d', `M270 ${300-shift}V105a30 30 0 0 1 60 0v${110+shift}`);
    // Shoulder remains fixed while the independent forearm and hand pull down.
    arm.children[0].setAttribute('d', `M399 205Q373 ${231+shift/2} 330 ${215+shift}`);
    arm.children[1].setAttribute('d', `M363 ${222+shift*.7}L330 ${215+shift}`);
    arm.children[2].setAttribute('cy', 215+shift);
  }
  pull.addEventListener('click', () => {
    const prediction = choices.find(choice => choice.checked);
    if (busy || !prediction) return;
    busy = true;
    pull.disabled = true;
    choices.forEach(choice => choice.disabled = true);
    const finish = () => {
      render(1);
      scene.querySelector('.scene-lin').src = 'assets/characters/lin-point.png';
      scene.querySelector('.scene-lin').alt = 'لين تشير إلى الصندوق المرتفع';
      feedback.innerHTML = `${prediction.value === 'up' ? 'أحسنت! وافقت النتيجة توقّعك.' : 'توقّعت نزول الصندوق؛ لاحظ أنه ارتفع.'} <strong>البَكَرَة الثابتة تغيّر اتجاه السحب</strong>: نسحب إلى أسفل، فترتفع <strong>الحَمولة</strong> إلى أعلى.`;
      actions.hidden = false;
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
    choices.forEach(choice => { choice.checked = false; choice.disabled = false; });
    render(0);
    actions.hidden = true;
    pull.disabled = true;
    scene.querySelector('.scene-lin').src = 'assets/characters/lin-welcome.png';
    scene.querySelector('.scene-lin').alt = 'لين تراقب الصندوق';
    feedback.textContent = 'اختر توقّعك أولًا لتفعيل السحب.';
    choices[0].focus();
  });
}
