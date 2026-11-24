// Visual-only feedback layer: no grading, media or persisted progress is changed.
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const selector = '#device-feedback,#component-feedback,.part-description,#system-description,.class-status,.match-feedback,.answer-feedback,#force-feedback,#lighting-feedback,#sensor-feedback,#bike-status,#history-message,#feedback,#prediction-summary,.challenge-feedback';
const last = new WeakMap(), choices = new WeakMap(), queued = new Map(), running = new Map();
let frame = 0;
function queue(node, key) {
  if(!node)return;
  if(key)choices.set(node,key);
  queued.set(node,true);
  if(!frame)frame=requestAnimationFrame(flush);
}
function flush() {
  frame=0;
  queued.forEach((_,node)=>{
    if(!node.isConnected||node.closest('[hidden]'))return;
    const text=node.textContent.trim(); if(!text)return;
    const signature=(choices.get(node)||'')+'|'+text;
    if(last.get(node)===signature)return; last.set(node,signature);
    running.get(node)?.cancel(); running.delete(node);
    if(motion.matches||typeof node.animate!=='function')return;
    const animation=node.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,easing:'ease-out'});
    running.set(node,animation);animation.finished.catch(()=>{}).finally(()=>{if(running.get(node)===animation)running.delete(node);});
  });queued.clear();
}
// Initial explanatory text is readable immediately and does not animate on load.
document.querySelectorAll(selector).forEach(node=>last.set(node,'|'+node.textContent.trim()));
function selection(event){
  const history=event.target.closest('.history-cart');
  if(history && event.type==='click')history.dataset.visualSelected='true';
  const target=event.target.closest('[data-component],[data-device],[data-part],[data-system],input[type=radio]');
  if(!target)return;
  let node,key;
  for(const [attr,feedback]of[['component','#component-feedback'],['device','#device-feedback'],['part','.part-description'],['system','#system-description']]){
    if(target.dataset[attr]){node=document.querySelector(feedback);key=attr+':'+target.dataset[attr];break;}
  }
  if(target.matches('input[type=radio]')){
    const card=target.closest('.classification-card,.matching-card,#brightness-question,.force-question');
    node=card?.querySelector('.class-status,.match-feedback,.answer-feedback,#force-feedback');
    key=target.name+':'+target.value;
  }
  queueMicrotask(()=>queue(node,key));
}
for(const event of ['click','input','change'])document.addEventListener(event,selection,true);
new MutationObserver(records=>{
  for(const record of records){
    const element=record.target.nodeType===1?record.target:record.target.parentElement;
    const node=element?.closest(selector);if(node)queue(node);
    for(const added of record.addedNodes){if(added.nodeType!==1)continue;if(added.matches(selector))queue(added);added.querySelectorAll(selector).forEach(node=>queue(node));}
  }
}).observe(document.querySelector('main'),{subtree:true,childList:true,characterData:true});
function finish(){running.forEach(animation=>animation.finish());running.clear();}
motion.addEventListener('change',()=>{if(motion.matches)finish();});
window.addEventListener('beforeprint',finish);
