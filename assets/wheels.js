const descriptions = {
  wheel: 'عجلة البَكَرَة: تدور حول محور ويمر الحبل حول حافتها، فتساعد على تغيير اتجاه السحب.',
  rope: 'الحبل: يمر حول العجلة ويتصل بالحَمولة؛ نسحب طرفه الحر فترتفع الحَمولة في الجهة الأخرى.',
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
const form = document.querySelector('.apply-form');
const options = [...form.querySelectorAll('[name="application"]')];
const check = form.querySelector('#check-answer');
const status = form.querySelector('.answer-status');
const hint = form.querySelector('.hint-status');
const retry = form.querySelector('.retry-button');
function syncChoice() { check.disabled = !options.some(option => option.checked); status.textContent = 'تم تسجيل اختيارك. اضغط تحقّق من إجابتي.'; }
options.forEach(option => { option.addEventListener('change', syncChoice); option.addEventListener('input', syncChoice); });
window.addEventListener('pageshow', () => { if (options.some(option => option.checked)) syncChoice(); });
form.addEventListener('submit', event => {
  event.preventDefault();
  const selected = options.find(option => option.checked);
  if (!selected) return;
  status.textContent = selected.value === 'flag'
    ? 'أحسنت! في سارية العلم يمر الحبل حول بكرة في الأعلى؛ نسحب الحبل إلى أسفل ليرتفع العلم.'
    : 'عجلة الدراجة تساعدها على الحركة، لكنها ليست البكرة المقصودة هنا. ابحث عن عجلة يمر حولها حبل لرفع شيء.';
  options.forEach(option => option.disabled = true);
  check.disabled = true;
  retry.hidden = false;
});
form.querySelector('.hint-button').addEventListener('click', () => { hint.textContent = 'تلميح: ابحث عن حبل يمر حول عجلة في الأعلى ويرفع شيئًا عند سحبه.'; });
retry.addEventListener('click', () => {
  options.forEach(option => { option.checked = false; option.disabled = false; });
  check.disabled = true; retry.hidden = true;
  status.textContent = 'اختر صورة، ثم تحقّق من إجابتك.'; hint.textContent = '';
  options[0].focus();
});
const tabs = [...document.querySelectorAll('.lesson-tabs a')];
function markSection() { const hash = location.hash || '#learn'; tabs.forEach(tab => { if (tab.hash === hash) tab.setAttribute('aria-current', 'location'); else tab.removeAttribute('aria-current'); }); }
window.addEventListener('hashchange', markSection); markSection();
