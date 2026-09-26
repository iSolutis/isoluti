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
