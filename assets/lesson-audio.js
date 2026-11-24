// Sources are rendered from unit.json. Empty paths remain disabled, never autoplay.
export function bindLessonAudio() {
  document.querySelectorAll('.lesson-audio-button').forEach(button => {
    const audio = document.getElementById(button.dataset.audio);
    const note = button.closest('.lesson-audio-control').querySelector('.audio-note');
    const label = button.querySelector('span');
    const original = button.dataset.label;
    if (!audio?.getAttribute('src')) return;
    button.disabled = false;
    button.setAttribute('aria-controls', audio.id);
    button.setAttribute('aria-pressed', 'false');
    const update = () => {
      const playing = !audio.paused && !audio.ended;
      label.textContent = playing ? 'إيقاف مؤقت' : audio.currentTime > 0 && !audio.ended ? 'تابع الاستماع' : original;
      button.setAttribute('aria-label', playing ? `إيقاف مؤقت — ${original}` : `${label.textContent} — ${original}`);
      button.setAttribute('aria-pressed', String(playing));
    };
    button.addEventListener('click', async () => {
      if (!audio.paused) { audio.pause(); return; }
      document.querySelectorAll('.lesson-audio-control audio').forEach(other => { if (other !== audio) other.pause(); });
      if (audio.ended) audio.currentTime = 0;
      try { await audio.play(); note.textContent = 'يمكنك الإيقاف المؤقت والمتابعة من الزر نفسه.'; }
      catch (error) { if (error.name !== 'AbortError') note.textContent = 'تعذّر تشغيل التسجيل. اضغط للمحاولة مرة أخرى.'; }
      update();
    });
    for (const name of ['play', 'pause', 'ended']) audio.addEventListener(name, update);
    audio.addEventListener('error', () => { note.textContent = 'تعذّر تحميل التسجيل.'; audio.pause(); update(); });
  });
}

// Stop context-specific recordings before hiding/resetting their result.
export function stopLessonAudio(container) {
  container?.querySelectorAll('audio').forEach(audio => {
    audio.pause();
    if (audio.readyState > 0) audio.currentTime = 0;
    audio.dispatchEvent(new Event('pause'));
  });
}
