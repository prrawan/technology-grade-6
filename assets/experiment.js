const scene = document.querySelector('.pulley-scene');
if (scene) {
  const pull = document.querySelector('#pull');
  const reset = document.querySelector('#reset');
  const choices = [...document.querySelectorAll('[name="prediction"]')];
  const feedback = document.querySelector('#feedback');
  const actions = document.querySelector('#result-actions');
  const rope = document.querySelector('#rope');
  const load = document.querySelector('#load');
  const arm = document.querySelector('#yazan-forearm');
  let busy = false;
  choices.forEach(choice => choice.addEventListener('change', () => { if (!busy) pull.disabled = false; }));
  function render(progress) {
    // Rotate the extracted forearm around its elbow in source-image coordinates.
    const angle = -110 * progress;
    const radians = angle * Math.PI / 180;
    const elbow = { x: 195, y: 345 };
    const grip = { x: 119, y: 282 };
    const dx = grip.x - elbow.x;
    const dy = grip.y - elbow.y;
    const scale = 240 / 724;
    const x = 290 + (elbow.x + dx * Math.cos(radians) - dy * Math.sin(radians)) * scale;
    const y = 40 + (elbow.y + dx * Math.sin(radians) + dy * Math.cos(radians)) * scale;
    const startX = 290 + grip.x * scale;
    const startY = 40 + grip.y * scale;
    // The load rises by the extra length paid out at the pulling end.
    const shift = Math.hypot(x - 330, y - 105) - Math.hypot(startX - 330, startY - 105);
    arm.setAttribute('transform', `rotate(${angle} ${elbow.x} ${elbow.y})`);
    rope.setAttribute('d', `M270 ${300-shift}V105a30 30 0 0 1 60 0L${x} ${y}L${x} ${y+18}`);
    rope.dataset.gripX = x;
    rope.dataset.gripY = y;
    load.setAttribute('transform', `translate(0 ${-shift})`);
  }
  render(0);
  pull.addEventListener('click', () => {
    const prediction = choices.find(choice => choice.checked);
    if (busy || !prediction) return;
    busy = true;
    pull.disabled = true;
    choices.forEach(choice => choice.disabled = true);
    const finish = () => {
      render(1);
      scene.querySelector('.scene-lin').src = 'assets/characters/lin-point-scene.png';
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
    scene.querySelector('.scene-lin').src = 'assets/characters/lin-welcome-scene.png';
    scene.querySelector('.scene-lin').alt = 'لين تراقب الصندوق';
    feedback.textContent = 'اختر توقّعك أولًا لتفعيل السحب.';
    choices[0].focus();
  });
}
