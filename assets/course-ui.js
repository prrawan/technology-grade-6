import { unitProgress, readCertificate, saveCertificate, starItems } from './course-state.js?v=3';
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
// Decorative art shares the site's atlas and SVG materials; saved records stay untouched.
function portfolioIcon(name) {
  const node = element('span', undefined, `brand-icon brand-icon-${name}`);
  node.setAttribute('aria-hidden', 'true'); return node;
}
function portfolioImage(path, className = 'portfolio-art') {
  const image = document.createElement('img'); image.src = url(`assets/${path}?v=portfolio-1`); image.alt = ''; image.className = className; image.width = 110; image.height = 110; return image;
}
function portfolioHeading(text, icon) {
  const heading = element('h2', undefined, 'portfolio-section-title');
  const pill = element('span'); pill.append(portfolioIcon(icon), document.createTextNode(text)); heading.append(pill); return heading;
}
function renderPortfolio() {
  const host = document.querySelector('#portfolio-content'); if (!host) return;
  host.replaceChildren();
  const stars = starItems();
  const earned = stars.filter(item => item.earned);
  const completed = units.filter(unit => unitProgress(unit).complete);
  const certificates = units.map(unit => ({ unit, record: readCertificate(unit) })).filter(item => item.record);
  const stats = element('div', undefined, 'portfolio-stats'); stats.setAttribute('aria-label', 'ملخّص الإنجاز');
  for (const [id, number, label, icon] of [['portfolio-stars', earned.length, 'نجومي', 'star'], ['portfolio-units', completed.length, 'الوحدات المكتملة', 'book'], ['portfolio-certificates', certificates.length, 'شهاداتي', 'certificate']]) {
    const tile = element('div', undefined, 'stat-tile');
    const art = icon === 'star' ? portfolioImage('brand-3d/star.svg') : portfolioIcon(icon);
    const copy = element('div', undefined, 'stat-copy'), count = element('strong', String(number)); count.id = id;
    copy.append(element('span', label), count); tile.append(art, copy); stats.append(tile);
  }
  host.append(stats, portfolioHeading('نجوم رحلتي', 'trophy'));
  const starList = element('ul', undefined, 'progress-list portfolio-star-grid');
  const artNames = { pulley:'pulley', wheels:'book', electronics:'led', thinkingChallenge:'trophy' };
  earned.forEach(item => {
    const tile = element('li', undefined, 'portfolio-star-card'); tile.dataset.achievement = item.id;
    const copy = element('div', undefined, 'achievement-copy'); copy.append(element('h3', item.title));
    const badge = element('div', undefined, 'earned-badge'); badge.append(portfolioImage('brand-3d/star.svg'), element('span', 'حصلت عليها'));
    const art = item.id === 'electronics' ? portfolioImage('electronics/led.svg') : portfolioIcon(artNames[item.id]);
    tile.append(art, copy, badge); starList.append(tile);
  });
  if (earned.length) host.append(starList);
  else { const empty = element('div', undefined, 'portfolio-empty'); empty.append(element('p', 'لم تحصل على نجوم بعد. ابدأ الوحدة الأولى لتجرب وتتعلّم وتجمع نجومك.'), link('ابدأ الوحدة الأولى', units[0].href, 'button')); host.append(empty); }
  host.append(portfolioHeading('الوحدات', 'book'));
  const unitList = element('div', undefined, 'course-unit-list portfolio-units');
  units.forEach((unit, index) => {
    const progress = unitProgress(unit), ready = unit.lessons.length > 0;
    const count = stars.filter(star => star.unitId === unit.id && star.earned).length;
    const tile = element('article', undefined, 'course-unit-tile' + (progress.complete ? ' is-complete' : ''));
    tile.dataset.unit = unit.id;
    const copy = element('div', undefined, 'portfolio-unit-copy'); copy.append(element('h3', unit.title));
    const status = element('p', !ready ? 'قيد الإعداد' : progress.complete ? '✓ مكتملة' : count > 0 ? 'قيد التعلّم' : 'لم تبدأ بعد', 'unit-status'); copy.append(status);
    if (ready) {
      copy.append(element('p', `${count} نجوم مكتسبة`, 'unit-star-count'));
      if (!progress.complete) copy.append(element('p', `الدروس المكتملة: ${progress.completedLessons} من ${unit.lessons.length} — ${progress.challengeComplete ? 'التحدّي مكتمل' : 'التحدّي لم يكتمل بعد'}`, 'portfolio-unit-detail'));
      copy.append(link(progress.complete ? 'صفحة الوحدة والشهادة' : 'تابع الوحدة', unit.href + (progress.complete ? '#unit-certificate' : ''), 'portfolio-unit-link'));
    }
    tile.append(portfolioIcon(['gear', 'signal', 'medical'][index]), copy); unitList.append(tile);
  });
  host.append(unitList, portfolioHeading('شهاداتي', 'certificate'));
  if (!certificates.length) host.append(element('p', 'ستظهر شهاداتك هنا بعد إكمال دروس الوحدة وتحدّيها وكتابة اسمك.', 'portfolio-empty'));
  else {
    const list = element('div', undefined, 'earned-certificates');
    certificates.forEach(({ unit, record }) => {
      const tile = element('article', undefined, 'course-unit-tile portfolio-certificate');
      const copy = element('div'); copy.append(element('h3', `شهادة إنجاز وحدة ${unit.title}`), element('p', record.name));
      tile.append(portfolioIcon('certificate'), copy, button('اعرض الشهادة', () => showCertificate(unit, record))); list.append(tile);
    }); host.append(list);
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
