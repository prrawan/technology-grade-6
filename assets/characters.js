// Stable character identities; actions map only to approved, available artwork.
const poses = {
  lin: { enter: 'welcome', welcome: 'welcome', hint: 'point', point: 'point', success: 'welcome' },
  yazan: { enter: 'welcome', welcome: 'welcome', pulley: 'pulley', hint: 'pulley', success: 'welcome' },
};
export class CharacterGuide extends HTMLElement {
  connectedCallback() {
    this.setPose(this.getAttribute('pose'));
    this.addEventListener('character-action', this.onAction);
  }
  disconnectedCallback() { this.removeEventListener('character-action', this.onAction); }
  onAction = (event) => this.setPose(event.detail?.action, event.detail?.message);
  setPose(action, message) {
    const name = this.getAttribute('character');
    const pose = poses[name]?.[action];
    const image = this.querySelector('img');
    if (!pose || !image) return false;
    image.src = `${this.getAttribute('assets')}${name}-${pose}.png`;
    this.dataset.pose = pose;
    // The caption describes the picture; results must also include meaningful text.
    image.alt = `${name === 'lin' ? 'لين' : 'يزن'} — ${pose === 'point' ? 'تشير إلى الدروس' : pose === 'pulley' ? 'يحمل نموذج بكرة' : 'إيماءة ترحيب'}`;
    if (message) {
      let status = this.querySelector('[role="status"]');
      if (!status) { status = document.createElement('p'); status.setAttribute('role', 'status'); this.append(status); }
      status.textContent = message;
    }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.getAnimations().forEach(animation => animation.cancel());
      this.animate([{ transform: 'translateY(5px)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 550, iterations: 1 });
    }
    return true;
  }
}
customElements.define('character-guide', CharacterGuide);
