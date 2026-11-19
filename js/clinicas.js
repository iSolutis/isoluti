// Página para clínicas: origem do contato na mensagem do WhatsApp e eventos da campanha.
// Carrega depois de site.js, que cuida do aviso de cookies e só mede depois do "Aceitar".

// Origem do contato (RF02): as UTMs viram um código curto no fim da mensagem, por exemplo
// ?utm_source=instagram&utm_content=reels-01 → "[ref: ig-reels-01]". Também aceita ?ref=.
// O código fica guardado na visita, para não se perder quando a pessoa navega pela página.
(() => {
  const CHAVE = 'aime-ref-clinicas';
  const APELIDOS = { instagram: 'ig', facebook: 'fb', linkedin: 'li', google: 'gg', whatsapp: 'wa' };
  const limpar = (v) => (v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const url = new URLSearchParams(window.location.search);
  let ref = limpar(url.get('ref'));
  if (!ref) {
    const fonte = limpar(url.get('utm_source'));
    const peca = limpar(url.get('utm_content') || url.get('utm_campaign'));
    ref = [APELIDOS[fonte] || fonte, peca].filter(Boolean).join('-');
  }
  ref = ref.slice(0, 40);
  try {
    if (ref) sessionStorage.setItem(CHAVE, ref);
    else ref = sessionStorage.getItem(CHAVE) || '';
  } catch (e) { /* sem armazenamento: vale só para esta página */ }
  window.aimeRefClinicas = ref; // usado pela lista "Você se reconhece?"
  if (!ref) return;

  // encodeURIComponent, e não URLSearchParams: o WhatsApp mostraria "+" no lugar dos espaços.
  document.querySelectorAll('a[data-wa]').forEach((link) => {
    const [base, texto] = link.href.split('?text=');
    link.href = `${base}?text=${encodeURIComponent(`${decodeURIComponent(texto)} [ref: ${ref}]`)}`;
  });
})();

// Eventos (RF03): clique no WhatsApp com a posição do botão, rolagem de 50% e 90%
// e abertura de pergunta frequente. Antes do consentimento, track() descarta tudo.
(() => {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-wa]');
    if (link) track('cta_whatsapp_click', { posicao: link.dataset.local || 'pagina' });
  });

  const marcos = [50, 90];
  const vistos = new Set();
  const checar = () => {
    if (!window.solutecMedicao) return;
    const doc = document.documentElement;
    const pct = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
    marcos.forEach((m) => {
      if (pct >= m && !vistos.has(m)) { vistos.add(m); track(`scroll_${m}`); }
    });
    if (vistos.size === marcos.length) window.removeEventListener('scroll', checar);
  };
  window.addEventListener('scroll', checar, { passive: true });

  document.querySelectorAll('.faq details').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) track('faq_open', { pergunta: item.querySelector('summary').textContent.trim() });
    });
  });
})();

// Demonstração: as mensagens entram uma de cada vez quando a conversa aparece na tela.
// Sem IntersectionObserver, ou para quem pediu menos movimento, a conversa aparece inteira.
(() => {
  const chat = document.querySelector('.lp-chat');
  if (!chat || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('tem-demo');
  const obs = new IntersectionObserver((entradas) => {
    if (!entradas[0].isIntersecting) return;
    chat.classList.add('rodando');
    obs.disconnect();
  }, { threshold: 0.4 });
  obs.observe(chat);
})();

// Abertura: as fotos dos sócios se alternam a cada 4 s, com nome e papel na legenda.
// Pausa fora da tela ou com a aba escondida; para quem pediu menos movimento, fica a primeira foto.
(() => {
  const fig = document.querySelector('[data-socios]');
  if (!fig || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const fotos = [...fig.querySelectorAll('img')];
  const pontos = [...fig.querySelectorAll('.lp-hero-pontos span')];
  const legenda = fig.querySelector('figcaption');
  let atual = 0;
  let visivel = true;

  const mostrar = (i) => {
    fotos[atual].classList.remove('ativo'); fotos[atual].setAttribute('aria-hidden', 'true');
    pontos[atual]?.classList.remove('ativo');
    atual = i;
    const foto = fotos[atual];
    foto.classList.add('ativo'); foto.removeAttribute('aria-hidden');
    pontos[atual]?.classList.add('ativo');
    legenda.classList.add('trocando');
    setTimeout(() => {
      legenda.querySelector('strong').textContent = foto.dataset.nome;
      legenda.querySelector('span').textContent = foto.dataset.papel;
      legenda.classList.remove('trocando');
    }, 300);
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((e) => { visivel = e[0].isIntersecting; }).observe(fig);
  }
  setInterval(() => {
    if (!visivel || document.hidden) return;
    mostrar((atual + 1) % fotos.length);
  }, 4000);
})();

// Celular: listas de cards viram carrosséis (o CSS faz o deslizar). Aqui entram os pontos de posição,
// que também servem de botões. Só aparecem quando a lista de fato passa da largura da tela.
(() => {
  document.querySelectorAll('[data-carrossel]').forEach((lista) => {
    const itens = [...lista.children];
    const pontos = document.createElement('div');
    pontos.className = 'lp-pontos';
    pontos.setAttribute('aria-hidden', 'true'); // atalho visual; quem usa leitor de tela percorre a lista normalmente
    itens.forEach((item, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.tabIndex = -1;
      b.addEventListener('click', () => lista.scrollTo({ left: item.offsetLeft - lista.offsetLeft - parseFloat(getComputedStyle(lista).scrollPaddingLeft || 0), behavior: 'smooth' }));
      pontos.append(b);
    });
    lista.after(pontos);

    const marcar = () => {
      const passo = itens[1] ? itens[1].offsetLeft - itens[0].offsetLeft : 1;
      const fim = lista.scrollLeft + lista.clientWidth >= lista.scrollWidth - 4;
      const atual = fim ? itens.length - 1 : Math.round(lista.scrollLeft / passo);
      [...pontos.children].forEach((b, i) => b.setAttribute('aria-current', String(i === atual)));
      pontos.style.visibility = lista.scrollWidth > lista.clientWidth + 4 ? 'visible' : 'hidden';
    };
    lista.addEventListener('scroll', marcar, { passive: true });
    window.addEventListener('resize', marcar);
    marcar();
  });
})();

// "Você se reconhece?": a pessoa marca o que vive na clínica. Aparece um convite com a contagem,
// e os itens marcados vão na mensagem do WhatsApp, para o comercial já saber a dor do cliente.
(() => {
  const lista = document.querySelector('[data-sinais]');
  const bloco = document.querySelector('[data-sinais-resultado]');
  if (!lista || !bloco) return;
  const caixas = [...lista.querySelectorAll('input[type="checkbox"]')];
  const total = bloco.querySelector('[data-sinais-total]');
  const link = bloco.querySelector('a[data-wa]');
  const base = link.href.split('?text=')[0];
  let medido = false;

  lista.addEventListener('change', () => {
    const marcados = caixas.filter((c) => c.checked).map((c) => c.dataset.curto);
    bloco.hidden = !marcados.length;
    if (!marcados.length) return;
    total.textContent = `Você marcou ${marcados.length} de ${caixas.length}.`;
    const ref = window.aimeRefClinicas ? ` [ref: ${window.aimeRefClinicas}]` : '';
    const texto = `Olá! Vim pela página para clínicas. Na minha clínica acontece: ${marcados.join('; ')}. Quero entender como funciona o diagnóstico.${ref}`;
    link.href = `${base}?text=${encodeURIComponent(texto)}`;
    if (!medido) { medido = true; track('reconhece_marcou'); }
  });
})();
