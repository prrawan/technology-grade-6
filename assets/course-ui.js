import { unitProgress, readCertificate, saveCertificate, starItems } from './course-state.js?v=1';
const catalogNode = document.querySelector('#course-catalog');
const units = JSON.parse(catalogNode.textContent);
const siteRoot = new URL(catalogNode.dataset.root || './', document.baseURI);
const url = path => new URL(path, siteRoot).href;
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function link(text, path, className = 'back-link') { const node = element('a', text, className); node.href = url(path); return node; }
function button(text, handler, className = 'button') { const node = element('button', text, className); node.type = 'button'; node.addEventListener('click', handler); return node; }
function showCertificate(unit, record) {
  let dialog = document.querySelector('dialog.course-certificate-dialog');
  if (!dialog) {
    document.body.append(document.querySelector('#course-certificate-template').content.cloneNode(true));
    dialog = document.querySelector('dialog.course-certificate-dialog');
    dialog.querySelector('.certificate-print').addEventListener('click', () => window.print());
  }
  dialog.querySelector('.certificate-student').textContent = record.name;
  dialog.querySelector('.certificate-unit-name').textContent = unit.title;
  dialog.querySelector('.certificate-date').textContent = 'تاريخ الإصدار: ' + new Intl.DateTimeFormat('ar', { dateStyle: 'long' }).format(new Date(record.issuedAt));
  if (!dialog.open) dialog.showModal();
}
function renderCertificateCards() {
  document.querySelectorAll('[data-unit-certificate]').forEach(card => {
    const unit = units.find(item => item.id === card.dataset.unitCertificate);
    if (!unit) return;
    const state = unitProgress(unit);
    const record = readCertificate(unit);
    const host = card.querySelector('.certificate-state');
    const draft = host.querySelector('input')?.value;
    host.replaceChildren();
    const instructions = element('p', state.complete ? 'أكملت شروط الشهادة! اكتب اسمك لعرضها.' : 'أكمل دروس الوحدة وتحدّيها لتحصل على شهادتك');
    host.append(instructions);
    const detail = unit.lessons.length ? `الدروس المكتملة: ${state.completedLessons} من ${unit.lessons.length}. ` : 'دروس الوحدة قيد الإعداد. ';
    host.append(element('p', detail + (state.challengeComplete ? 'تحدّي الوحدة مكتمل.' : unit.challenge.href ? 'أكمل تحدّي الوحدة.' : 'تحدّي الوحدة قريبًا.'), 'certificate-progress'));
    if (!state.complete) {
      const locked = element('button', '🔒 عرض الشهادة', 'button'); locked.disabled = true; host.append(locked);
      return;
    }
    const form = element('form');
    const id = `certificate-name-${unit.id}`;
    const label = element('label', 'اسم الطالب على الشهادة'); label.htmlFor = id;
    const input = document.createElement('input'); input.id = id; input.name = 'student-name'; input.maxLength = 80; input.required = true; input.autocomplete = 'name'; input.value = draft || record?.name || '';
    const submit = element('button', 'عرض الشهادة', 'button'); submit.type = 'submit';
    const message = element('p'); message.setAttribute('role', 'status');
    form.append(label, input, submit, message);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!unitProgress(unit).complete) { render(); return; }
      if (!input.value.trim()) { input.setCustomValidity('اكتب اسمك أولًا.'); input.reportValidity(); return; }
      input.setCustomValidity('');
      try {
        const { record: certificate, saved } = saveCertificate(unit, input.value);
        message.textContent = saved ? 'حُفظت شهادتك في ملف إنجازي على هذا الجهاز.' : 'تعذّر الحفظ على الجهاز، ويمكنك عرض الشهادة وطباعتها الآن.';
        showCertificate(unit, certificate);
      } catch { message.textContent = 'تعذّر إعداد الشهادة. راجع الاسم وشروط الإنجاز.'; }
    });
    input.addEventListener('input', () => input.setCustomValidity(''));
    host.append(form);
  });
}
function renderPortfolio() {
  const host = document.querySelector('#portfolio-content'); if (!host) return;
  host.replaceChildren();
  const stars = starItems();
  const completed = units.filter(unit => unitProgress(unit).complete);
  const certificates = units.map(unit => ({ unit, record: readCertificate(unit) })).filter(item => item.record);
  const stats = element('div', undefined, 'portfolio-stats');
  for (const [id, number, label] of [['portfolio-stars', stars.filter(item => item.earned).length, 'نجومي'], ['portfolio-units', completed.length, 'الوحدات المكتملة'], ['portfolio-certificates', certificates.length, 'الشهادات المكتسبة']]) {
    const tile = element('div', undefined, 'stat-tile'); const count = element('strong', String(number)); count.id = id; tile.append(count, element('span', label)); stats.append(tile);
  }
  host.append(stats, element('h2', 'نجوم رحلتي'));
  const starList = element('ul', undefined, 'progress-list'); stars.forEach(item => starList.append(element('li', `${item.earned ? '★' : '☆'} ${item.title} — ${item.earned ? 'حصلت عليها' : 'لم تكتمل بعد'}`))); host.append(starList);
  host.append(element('h2', 'الوحدات'));
  const unitList = element('div', undefined, 'course-unit-list');
  units.forEach(unit => {
    const progress = unitProgress(unit); const tile = element('article', undefined, 'course-unit-tile');
    tile.append(element('h3', unit.title), element('p', progress.complete ? '✓ وحدة مكتملة' : unit.lessons.length ? `الدروس المكتملة: ${progress.completedLessons} من ${unit.lessons.length} — ${progress.challengeComplete ? 'التحدّي مكتمل' : unit.challenge.href ? 'التحدّي لم يكتمل بعد' : 'التحدّي قريبًا'}` : 'قيد الإعداد'), link(progress.complete ? 'عرض شهادة الوحدة' : 'صفحة الوحدة', unit.href + '#unit-certificate'));
    unitList.append(tile);
  });
  host.append(unitList, element('h2', 'شهاداتي'));
  if (!certificates.length) host.append(element('p', 'ستظهر شهاداتك هنا بعد إكمال دروس الوحدة وتحدّيها وكتابة اسمك.'));
  else {
    const list = element('div', undefined, 'earned-certificates');
    certificates.forEach(({ unit, record }) => { const tile = element('article', undefined, 'course-unit-tile'); tile.append(element('h3', unit.title), element('p', record.name), button('عرض الشهادة', () => showCertificate(unit, record))); list.append(tile); });
    host.append(list);
  }
}
function renderChallenges() {
  const host = document.querySelector('#challenges-content'); if (!host) return;
  host.replaceChildren();
  units.forEach(unit => {
    const tile = element('article', undefined, 'course-unit-tile'); tile.append(element('h2', unit.title));
    if (unit.challenge.href) tile.append(link('افتح تحدّي الوحدة', unit.challenge.href, 'button'));
    else { const pending = element('button', '🏆 تحدّي الوحدة — قريبًا', 'button'); pending.disabled = true; tile.append(pending); }
    tile.append(link('صفحة الوحدة', unit.href)); host.append(tile);
  });
}
function render() { renderCertificateCards(); renderPortfolio(); renderChallenges(); }
render();
window.addEventListener('pageshow', render);
window.addEventListener('focus', render);
window.addEventListener('storage', render);
