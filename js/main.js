// Conteúdo que depende de dado real vem marcado com data-preencher e hidden.
// Só aparece quando não sobra nenhum [[PREENCHER: ...]] dentro dele (texto ou atributos).
document.querySelectorAll('[data-preencher]').forEach((el) => {
  el.hidden = el.outerHTML.includes('[[PREENCHER');
});

// Marca no menu qual seção está visível durante a rolagem.
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('main section[id], section[id]');
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const linkFor = (id) => document.querySelector(`nav a[href="#${id}"]`);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const link = linkFor(entry.target.id);
      if (!link) return;
      link.classList.toggle('active', entry.isIntersecting);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach((section) => observer.observe(section));
});

// O vídeo só roda enquanto está visível, e não roda sozinho para quem pediu menos movimento.
document.addEventListener('DOMContentLoaded', () => {
  const video = document.querySelector('.brand-video');
  if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) video.play().catch(() => {});
    else video.pause();
  }, { threshold: 0.4 }).observe(video);
});
