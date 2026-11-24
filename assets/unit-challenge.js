import { awardProgressStar, hasProgressStar } from './progress.js?v=3';
import { unitProgress, readFlag } from './course-state.js?v=3';
const catalog = JSON.parse(document.querySelector('#course-catalog').textContent);
const unit = catalog.find(item => item.id === 'thinking-technology');
const questions = [
  { title:'إذا سحبنا الحبل إلى أسفل في البَكرة الثابتة، إلى أين يتحرّك الصندوق؟', art:'units/fixed-system.svg', alt:'بكرة ثابتة وحبل متصل بصندوق وطرف حر للسحب', options:['إلى أعلى ↑','إلى أسفل ↓'], correct:0, reason:'عندما نسحب الحبل إلى أسفل، تغيّر البَكرة الثابتة اتجاه السحب فيرتفع الصندوق.', hint:'تتبّع طرفَي الحبل: إذا نزل أحدهما، ماذا يحدث للآخر؟' },
  { title:'أيّ جزء يتحرّك مع الحَمولة في البَكرة المتحرّكة؟', art:'units/moving-system.svg', alt:'بكرة متحركة يرتبط محورها بالصندوق', options:['محور البَكرة','الحامل العلوي'], correct:0, reason:'يتحرّك محور البَكرة المتحرّكة مع الحَمولة عند رفعها.', hint:'راقب موضع المحور المتصل بالصندوق في الرسم.' },
  { title:'معك صندوق ثقيل وتريد رفعه بقوة أقل، أي نظام تختار؟', art:'units/compound-system.svg', alt:'نظام مركّب يجمع بكرة ثابتة وأخرى متحركة', options:['بَكرة ثابتة واحدة','نظام بَكرات مركّب'], correct:1, reason:'في النظام المركّب تتوزّع الحَمولة على أكثر من جزء من الحبل فتقلّ قوة السحب اللازمة.', hint:'ابحث عن نظام يحمل فيه الصندوق أكثر من جزء من الحبل.' },
  { title:'ماذا يحدث لسطوع الـLED عندما تزيد المقاومة في تجربتنا؟', art:'electronics/led.svg', alt:'باعث ضوء LED', options:['يخفت الضوء','يزداد سطوع الضوء'], correct:0, reason:'تحدّ المقاومة الأكبر من التيار في الدارة فيخفت ضوء الـLED.', hint:'تذكّر ما حدث للضوء عندما حرّكت المنزلق نحو مقاومة أعلى.' },
  { title:'أيّ مكوّن يتيح لنا تغيير المقاومة للتحكّم في شدة الإضاءة؟', art:'electronics/variable-resistor.svg', alt:'مقاومة متغيّرة بمسمار للضبط', options:['المقاومة الثابتة','المقاومة المتغيّرة'], correct:1, reason:'تتيح المقاومة المتغيّرة تعديل مقاومتها للتحكّم في التيار وشدة الإضاءة.', hint:'أيّ المكوّنين يمكن ضبط قيمته بدل بقائها ثابتة؟' },
  { title:'ما دور الترانزستور في دارة الاستشعار التي جرّبناها؟', art:'brand-3d/transistor.svg', alt:'ترانزستور ثلاثي الأرجل بخامة كحلية وأرجل معدنية', options:['يعمل كمفتاح إلكتروني','يصدر الضوء بدل الـLED'], correct:0, reason:'يعمل الترانزستور كمفتاح إلكتروني يسمح بمرور التيار إلى الـLED عند وصول إشارة المستشعر.', hint:'من الذي يتحكّم بمرور التيار، ومن الذي يصدر الضوء؟' },
];
const arabicDigits = new Intl.NumberFormat('ar-u-nu-arab', { useGrouping: false });
const states = questions.map(() => ({ selected:null, checked:false }));
let current = 0;
const board = document.querySelector('#challenge-board');
const result = document.querySelector('#challenge-result');
const form = document.querySelector('#challenge-form');
const check = document.querySelector('#challenge-check');
const next = document.querySelector('#challenge-next');
const options = document.querySelector('#challenge-options');
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function moveTo(node) { node.focus({preventScroll:true}); node.scrollIntoView({block:'start',behavior:reduced()?'auto':'smooth'}); }
function showQuestion(focus = true) {
  board.hidden = false; result.hidden = true;
  const q = questions[current], state = states[current];
  document.querySelector('#question-number').textContent = `السؤال ${arabicDigits.format(current + 1)} من ${arabicDigits.format(questions.length)}`;
  const steps = document.querySelector('#question-steps'); steps.replaceChildren();
  states.forEach((answer,index) => { const step = document.createElement('span'); step.className = index===current?'current':answer.checked?'done':''; steps.append(step); });
  const title = document.querySelector('#question-title'); title.textContent = q.title;
  const art = document.querySelector('#question-art'); art.src = new URL(q.art+'?v=challenge-1',new URL('../../assets/',location.href)); art.alt = q.alt;
  options.replaceChildren();
  q.options.forEach((text,index) => {
    const host = document.createElement('div'); host.className = 'answer-option';
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type='radio'; input.name='challenge-answer'; input.value=String(index); input.checked=state.selected===index;
    const caption = document.createElement('span'); caption.textContent=text;
    label.append(input,caption); host.append(label); options.append(host);
    input.addEventListener('change',() => { if(state.checked)return; state.selected=index; check.disabled=false; });
  });
  check.hidden=false; check.disabled=state.selected===null; next.hidden=true;
  if(focus)moveTo(title);
}
form.addEventListener('submit', event => {
  event.preventDefault(); const state=states[current],q=questions[current];
  if(state.selected===null||state.checked)return;
  state.checked=true;
  const correct=state.selected===q.correct;
  options.querySelectorAll('input').forEach(input=>{input.disabled=true;});
  const feedback=document.createElement('div'); feedback.className='challenge-feedback '+(correct?'correct':'needs-review'); feedback.setAttribute('role','status');
  const sentence=document.createElement('p'); sentence.textContent=(correct?'أحسنت! ':'لنراجع الفكرة. ')+q.reason; feedback.append(sentence);
  if(!correct){const hint=document.createElement('p');hint.className='challenge-hint';hint.textContent='تلميح: '+q.hint;feedback.append(hint);}
  options.children[state.selected].append(feedback);
  check.hidden=true;next.hidden=false;
  next.textContent=states.every(answer=>answer.checked)?'اعرض النتيجة ←':'السؤال التالي ←';
});
next.addEventListener('click',()=>{
  if(!states[current].checked)return;
  const remaining=states.findIndex((state,index)=>index>current&&!state.checked);
  const first=states.findIndex(state=>!state.checked);
  if(first===-1){showResult();return;}
  current=remaining===-1?first:remaining;showQuestion();
});
function celebrate() {
  if(reduced())return;
  const layer=document.querySelector('.challenge-stars');
  for(let i=0;i<12;i++){const star=document.createElement('span');star.textContent='★';star.style.color=i%2?'#126C70':'#D6A248';layer.append(star);const animation=star.animate([{opacity:0,transform:'translate(0,0) scale(.4)'},{opacity:1,offset:.2},{opacity:0,transform:`translate(${(i-5.5)*22}px,${-65-(i%3)*25}px) rotate(${i*30}deg)`}],{duration:800,easing:'ease-out'});animation.onfinish=()=>star.remove();}
}
function certificatePath() {
  const host=document.querySelector('#certificate-path');host.replaceChildren();
  const complete=unitProgress(unit).complete;
  const cta=document.createElement(complete?'a':'button');cta.className='button certificate-cta';cta.textContent='احصل على شهادتك';
  if(complete)cta.href='index.html#unit-certificate';else cta.disabled=true;
  host.append(cta);
  const missing=unit.lessons.filter(lesson=>!readFlag(lesson.key));
  if(missing.length){const message=document.createElement('p');message.textContent='أكمل الدروس التالية لتفتح شهادتك:';host.append(message);const list=document.createElement('ul');for(const lesson of missing){const li=document.createElement('li'),a=document.createElement('a');a.textContent=lesson.title;a.href=new URL(lesson.href,new URL('../../',location.href));li.append(a);list.append(li);}host.append(list);}
  if(!unitProgress(unit).challengeComplete){const message=document.createElement('p');message.textContent=`صحّح إجابات التحدّي لتحصل على ${arabicDigits.format(questions.length)} من ${arabicDigits.format(questions.length)} وتفتح شرط إنجازه للشهادة.`;host.append(message);}
}
function showResult() {
  if(!states.every(state=>state.checked))return;
  board.hidden=true;result.hidden=false;
  const score=states.filter((state,index)=>state.selected===questions[index].correct).length;
  document.querySelector('#challenge-score').textContent=`الإجابات الصحيحة: ${arabicDigits.format(score)} من ${arabicDigits.format(questions.length)}`;
  const message=document.querySelector('#challenge-award');
  if(score===6){const award=awardProgressStar('thinkingChallenge');message.textContent=award.first?(award.saved?'أحسنت! أكملت تحدّي الوحدة وربحت نجمة محفوظة على جهازك.':'أحسنت! أكملت التحدّي؛ تعذّر حفظ الإنجاز على هذا الجهاز.'):'أحسنت! نجمة التحدّي محفوظة ولن تُحتسب مرة أخرى.';if(award.first)celebrate();}
  else message.textContent=hasProgressStar('thinkingChallenge')?'إنجازك السابق محفوظ. راجع إجابات هذه المحاولة.':'اقتربت من الإنجاز! راجع التلميحات وصحّح الأسئلة المتبقية.';
  document.querySelector('#challenge-review').textContent=score===6?'جرّب التحدّي مجددًا':'راجع الأسئلة التي تحتاج تصحيحًا';
  certificatePath();moveTo(document.querySelector('#challenge-result-title'));
}
document.querySelector('#challenge-review').addEventListener('click',()=>{
  const perfect=states.every((state,index)=>state.selected===questions[index].correct);
  states.forEach((state,index)=>{if(perfect||state.selected!==questions[index].correct){state.checked=false;state.selected=null;}});
  current=states.findIndex(state=>!state.checked);showQuestion();
});
window.addEventListener('pageshow',()=>{if(!result.hidden)certificatePath();});
window.addEventListener('storage',()=>{if(!result.hidden)certificatePath();});
showQuestion(false);
