// Only descriptive captions animate. Forms, feedback and media controls stay visible.
const selectors = ['figure figcaption','.unit-map-heading h3','.about-standard h3','.about-standard p','.unit-lesson > div:last-child h3','.unit-lesson > div:last-child p','.about-card h3','.about-card p','.portfolio-star-card .achievement-copy','.course-unit-tile h3','.classification-card legend','.matching-card legend'];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const seen = new Set(), registered = new WeakSet(), keys = new WeakMap(), pending = new Set(), animations = new Set();
let observer;
function show(node, animate) {
  const key = keys.get(node); const already = seen.has(key); seen.add(key);
  observer?.unobserve(node); pending.delete(node); node.removeAttribute('data-caption-pending');
  if (animate && !already && !motion.matches && typeof node.animate === 'function') {
    const animation = node.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'ease-out'});
    animations.add(animation); animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));
    node.dataset.captionRevealed = 'true';
  }
}
if ('IntersectionObserver' in window) observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if(entry.isIntersecting) show(entry.target,true); });
},{threshold:.12});
function scan() {
  selectors.forEach(selector => document.querySelectorAll(selector).forEach((node,index) => {
    if(registered.has(node))return; registered.add(node);
    const owner=node.closest('[data-achievement], [data-unit]');
    const anchor=owner?.dataset.achievement || owner?.dataset.unit || String(index);
    const key=`${selector}:${anchor}:${node.textContent.trim()}`; keys.set(node,key);
    const rect=node.getBoundingClientRect();
    if(motion.matches||!observer||seen.has(key)||(rect.top<innerHeight&&rect.bottom>0)){show(node,false);return;}
    node.setAttribute('data-caption-pending','');pending.add(node);observer.observe(node);
  }));
  pending.forEach(node=>{if(!node.isConnected){observer?.unobserve(node);pending.delete(node);}});
}
scan();
new MutationObserver(scan).observe(document.querySelector('main'),{childList:true,subtree:true});
motion.addEventListener('change',()=>{if(motion.matches){pending.forEach(node=>show(node,false));animations.forEach(animation=>animation.finish());}});
window.addEventListener('beforeprint',()=>{pending.forEach(node=>show(node,false));animations.forEach(animation=>animation.finish());});
