(() => {
  'use strict';
  const region = document.querySelector('#notice-carousel');
  if (!region) return;
  const slides = document.querySelector('#notice-slides');
  const count = document.querySelector('#notice-count');
  const pause = document.querySelector('#notice-pause');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, items = [], timer, paused = reduced.matches, hovering = false;
  const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const active = item => !item.expires || item.expires >= today();
  function schedule() {
    clearTimeout(timer);
    if (!paused && !hovering && !document.hidden && !region.contains(document.activeElement) && items.length > 1)
      timer = setTimeout(() => show(index + 1), 10000);
  }
  function show(next) {
    items = items.filter(active);
    index = (next + items.length) % items.length;
    const item = items[index];
    if (!item) return;
    const card = document.createElement('article');
    card.className = 'notice-card';
    card.setAttribute('role', 'group');
    card.setAttribute('aria-roledescription', 'slide');
    card.setAttribute('aria-label', `${index + 1} de ${items.length}`);
    for (const [tag, cls, text] of [['p','notice-tag',item.place], ['h3','',item.title], ['p','notice-when',item.when], ['p','notice-body',item.body]]) {
      const node = document.createElement(tag); node.className = cls; node.textContent = text; card.append(node);
    }
    slides.replaceChildren(card);
    count.textContent = `${String(index + 1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
    schedule();
  }
  Promise.all([fetch('content.json').then(r => {if(!r.ok) throw Error(); return r.json();}), fetch('notices.json').then(r => {if(!r.ok) throw Error(); return r.json();})]).then(([content, notices]) => {
    const community = content.schedule.map(s => ({ title:s.title, when:`${s.day} · ${s.time}`, place:'Comunidade São Francisco de Assis · Barra do Saí', body:'Esperamos você e sua família! Rua Benjamin Constant, S/N · Barra do Saí · Itapoá/SC.' }));
    items = [...community, ...notices.filter(active)];
    region.querySelector('.notice-controls').hidden = false;
    pause.textContent = paused ? 'Reproduzir avisos' : 'Pausar avisos';
    show(0);
    document.querySelector('#notice-prev').onclick = () => show(index - 1);
    document.querySelector('#notice-next').onclick = () => show(index + 1);
    pause.onclick = () => { paused = !paused; pause.textContent = paused ? 'Reproduzir avisos' : 'Pausar avisos'; schedule(); };
    region.addEventListener('mouseenter', () => {hovering = true; schedule();});
    region.addEventListener('mouseleave', () => {hovering = false; schedule();});
    region.addEventListener('focusin', schedule);
    region.addEventListener('focusout', () => setTimeout(schedule, 0));
    document.addEventListener('visibilitychange', () => {if(!document.hidden) show(index); else schedule();});
    reduced.addEventListener('change', e => {if(e.matches){paused=true;pause.textContent='Reproduzir avisos';schedule();}});
    let touchX = null;
    slides.addEventListener('touchstart', e => {touchX=e.changedTouches[0].clientX;}, {passive:true});
    slides.addEventListener('touchend', e => {const delta=e.changedTouches[0].clientX-touchX;if(touchX!==null && Math.abs(delta)>55)show(index+(delta<0?1:-1));touchX=null;}, {passive:true});
  }).catch(() => { /* Keep the readable community notice and PDF link available. */ });
})();
