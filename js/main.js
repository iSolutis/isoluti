const CONFIG = window.SOLUTEC_CONFIG || {};
// Um valor de configuração só vale depois que o placeholder foi trocado.
const configurado = (valor) => typeof valor === 'string' && valor.trim() !== '' && !valor.includes('[[PREENCHER');

// Eventos de medição. Só são enviados depois do consentimento (ver "Medição" abaixo).
const track = (nome, params = {}) => {
  if (window.solutecMedicao) window.solutecMedicao(nome, params);
};

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

// O arquivo do vídeo só é pedido quando ele aparece na tela, depois do resto da página.
// Roda só enquanto está visível, e não roda sozinho para quem pediu menos movimento.
window.addEventListener('load', () => {
  const video = document.querySelector('.brand-video');
  if (!video) return;
  const autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) { video.pause(); return; }
    if (!video.src && video.dataset.src) {
      video.preload = 'auto';
      video.src = video.dataset.src;
    }
    if (autoplay && video.muted) video.play().catch(() => {});
  }, { threshold: 0.4 }).observe(video);

  // Narração: o vídeo roda sem som; o botão recomeça do início com som, uma vez.
  // Ao terminar, volta a rodar em silêncio e o botão reaparece.
  const som = document.querySelector('[data-video-som]');
  if (!som) return;
  som.hidden = false;
  som.addEventListener('click', () => {
    if (!video.src && video.dataset.src) video.src = video.dataset.src;
    video.muted = false;
    video.loop = false;
    video.currentTime = 0;
    video.play().catch(() => {});
    som.hidden = true;
  });
  video.addEventListener('ended', () => {
    if (video.muted) return;
    video.muted = true;
    video.loop = true;
    som.hidden = false;
    if (autoplay) video.play().catch(() => {});
  });
  // Se a pessoa ativar o som pelos controles do próprio vídeo, o botão sai do caminho.
  video.addEventListener('volumechange', () => { if (!video.muted) som.hidden = true; });
});

// Links para a política de privacidade (formulário e aviso de cookies).
document.querySelectorAll('[data-politica]').forEach((link) => {
  if (!configurado(CONFIG.politicaUrl)) return;
  link.href = CONFIG.politicaUrl;
  link.hidden = false;
});

// Botão de agendamento: só aparece com o link configurado.
document.querySelectorAll('[data-agenda]').forEach((link) => {
  if (!configurado(CONFIG.agendaUrl)) return;
  link.href = CONFIG.agendaUrl;
  link.hidden = false;
});

// Formulário de contato: validação no navegador e envio para o serviço de formulários.
(() => {
  const form = document.getElementById('form-contato');
  if (!form) return;
  const fieldset = form.querySelector('fieldset');
  const botao = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');
  const textoBotao = botao.textContent;

  // O HTML já vem com o formulário desligado; só liga com endpoint e política configurados.
  if (!configurado(CONFIG.formEndpoint) || !configurado(CONFIG.politicaUrl)) return;
  fieldset.disabled = false;
  form.classList.remove('is-off');
  form.querySelector('[data-form-off]').hidden = true;

  const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const regras = {
    nome: (v) => v.trim().length >= 2 || 'Informe seu nome.',
    email: (v) => emailValido(v.trim()) || 'Informe um e-mail válido, como nome@empresa.com.br.',
    empresa: (v) => v.trim().length >= 2 || 'Informe o nome da empresa.',
    processo: (v) => v.trim().length >= 10 || 'Conte em poucas palavras qual processo está travando.',
  };

  const marcarErro = (campo, mensagem) => {
    const erro = document.getElementById(`${campo.id}-erro`);
    if (erro) erro.textContent = mensagem || '';
    if (mensagem) campo.setAttribute('aria-invalid', 'true');
    else campo.removeAttribute('aria-invalid');
  };

  const validarCampo = (campo) => {
    let mensagem = '';
    if (campo.type === 'checkbox') {
      mensagem = campo.checked ? '' : 'Para enviar, é preciso autorizar o contato.';
    } else if (regras[campo.name]) {
      const r = regras[campo.name](campo.value);
      mensagem = r === true ? '' : r;
    }
    marcarErro(campo, mensagem);
    return !mensagem;
  };

  const campos = [...form.querySelectorAll('input[required], textarea[required]')];
  // Depois da primeira tentativa, o erro some assim que o campo fica certo.
  campos.forEach((campo) => {
    const evento = campo.type === 'checkbox' ? 'change' : 'input';
    campo.addEventListener(evento, () => { if (campo.hasAttribute('aria-invalid')) validarCampo(campo); });
    campo.addEventListener('blur', () => { if (campo.value || campo.type === 'checkbox') validarCampo(campo); });
  });

  const mostrarStatus = (tipo, html) => {
    status.className = `form-status ${tipo}`;
    status.innerHTML = html;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invalidos = campos.filter((campo) => !validarCampo(campo));
    if (invalidos.length) {
      mostrarStatus('erro', 'Confira os campos destacados.');
      invalidos[0].focus();
      return;
    }

    // Campo invisível preenchido: é robô. Finge sucesso e não envia nada.
    if (form.elements._honey.value) {
      form.reset();
      mostrarStatus('sucesso', 'Recebemos sua mensagem. Retornamos em breve.');
      return;
    }

    // Os dados saem antes de travar o formulário: campo desabilitado não entra no FormData.
    // Vão em JSON, formato aceito pelo FormSubmit e pelo Formspree; _subject e _template
    // definem o assunto e o layout do e-mail que chega para a iSolutis.
    const dados = Object.fromEntries(new FormData(form));
    delete dados._honey;
    dados._subject = `Contato pelo site: ${dados.empresa}`;
    dados._template = 'table';
    form.setAttribute('aria-busy', 'true');
    fieldset.disabled = true;
    botao.textContent = 'Enviando…';
    mostrarStatus('carregando', 'Enviando sua mensagem…');

    try {
      const resposta = await fetch(CONFIG.formEndpoint, {
        method: 'POST',
        body: JSON.stringify(dados),
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      // O FormSubmit responde 200 mesmo quando recusa o envio (ex.: formulário ainda não ativado).
      const retorno = await resposta.json().catch(() => ({}));
      if (retorno.success === false || retorno.success === 'false') throw new Error(retorno.message || 'recusado');
      form.reset();
      form.classList.add('is-sent');
      mostrarStatus('sucesso', '<strong>Mensagem enviada.</strong> Retornamos pelo e-mail informado em breve.');
      status.setAttribute('tabindex', '-1');
      status.focus();
      track('submit_form', { local: 'contato' });
    } catch (erro) {
      fieldset.disabled = false;
      mostrarStatus('erro', 'Não conseguimos enviar agora. Tente de novo em instantes ou <a href="https://wa.me/5571992390992?text=Ol%C3%A1!%20Quero%20agendar%20um%20diagn%C3%B3stico%20com%20a%20iSolutis." target="_blank" rel="noopener">fale pelo WhatsApp</a>.');
    } finally {
      form.removeAttribute('aria-busy');
      botao.textContent = textoBotao;
    }
  });
})();

// Medição (GA4 e Meta Pixel). Nenhum script de terceiros carrega antes do "Aceitar";
// eventos disparados antes disso são descartados.
(() => {
  const ga4 = configurado(CONFIG.ga4Id) ? CONFIG.ga4Id : null;
  const pixel = configurado(CONFIG.metaPixelId) ? CONFIG.metaPixelId : null;
  if (!ga4 && !pixel) return;

  const CHAVE = 'solutec-cookies';
  const lerEscolha = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
  const salvarEscolha = (v) => { try { localStorage.setItem(CHAVE, v); } catch (e) { /* segue só nesta visita */ } };
  const banner = document.getElementById('cookie-banner');
  const abrir = document.querySelector('[data-cookies-abrir]');
  let carregado = false;

  const carregarScript = (src) => {
    const s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  };

  const carregar = () => {
    if (carregado) return;
    carregado = true;
    if (ga4) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', ga4);
      carregarScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`);
    }
    if (pixel) {
      // Trecho oficial do Meta Pixel, sem o carregamento automático.
      const fbq = function fbq() {
        if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
        else fbq.queue.push(arguments);
      };
      if (!window._fbq) window._fbq = fbq;
      fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
      window.fbq = fbq;
      window.fbq('init', pixel);
      window.fbq('track', 'PageView');
      carregarScript('https://connect.facebook.net/en_US/fbevents.js');
    }
    window.solutecMedicao = (nome, params) => {
      if (window.gtag) window.gtag('event', nome, params);
      if (window.fbq) window.fbq('trackCustom', nome, params);
    };
  };

  const escolher = (valor) => {
    const tinhaAceitado = lerEscolha() === 'aceito' || carregado;
    salvarEscolha(valor);
    banner.hidden = true;
    if (valor === 'aceito') carregar();
    // Quem recusa depois de aceitar precisa recarregar para descarregar os scripts.
    else if (tinhaAceitado) window.location.reload();
  };

  banner.querySelectorAll('[data-consentimento]').forEach((botao) => {
    botao.addEventListener('click', () => escolher(botao.dataset.consentimento));
  });
  abrir.hidden = false;
  abrir.addEventListener('click', () => { banner.hidden = false; banner.querySelector('button').focus(); });

  const escolha = lerEscolha();
  if (escolha === 'aceito') carregar();
  else if (escolha !== 'recusado') banner.hidden = false;
})();

// Eventos: cliques no WhatsApp e no agendamento (com o local do clique) e rolagem até 75%.
(() => {
  const localDoClique = (el) => {
    const marcado = el.closest('[data-local]');
    if (marcado) return marcado.dataset.local;
    if (el.closest('header, #inicio')) return 'topo';
    if (el.closest('.sticky-cta')) return 'barra-fixa';
    if (el.closest('footer')) return 'rodape';
    const secao = el.closest('[id]');
    return secao ? secao.id : 'pagina';
  };

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    if (link.href.includes('wa.me/')) track('click_whatsapp', { local: localDoClique(link) });
    else if (link.dataset.evento) track(link.dataset.evento, { local: localDoClique(link) });
  });

  let rolou = false;
  const checarRolagem = () => {
    // Antes do consentimento não conta: o evento sai na primeira rolagem depois do "Aceitar".
    if (rolou || !window.solutecMedicao) return;
    const doc = document.documentElement;
    if (window.scrollY + window.innerHeight >= doc.scrollHeight * 0.75) {
      rolou = true;
      track('scroll_75');
      window.removeEventListener('scroll', checarRolagem);
    }
  };
  window.addEventListener('scroll', checarRolagem, { passive: true });
})();

// Gráficos animam quando aparecem na tela (uma vez só).
(() => {
  const graficos = document.querySelectorAll('.donut, .timeline-chart');
  if (!graficos.length || !('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('anima');
      obs.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  graficos.forEach((g) => obs.observe(g));
})();

// Carrossel: setas andam um cartão por vez e ficam desabilitadas nas pontas.
// Passa sozinho a cada 4 s (volta ao início no fim); pausa com mouse em cima, toque, foco,
// fora da tela ou pelo botão de pausa. Não passa sozinho para quem pediu menos movimento.
document.querySelectorAll('[data-carousel-nav]').forEach((nav) => {
  const faixa = document.getElementById(nav.dataset.carouselNav);
  if (!faixa) return;
  const anterior = nav.querySelector('[data-dir="-1"]');
  const proximo = nav.querySelector('[data-dir="1"]');
  const botaoPlay = nav.querySelector('[data-play]');
  const INTERVALO = 4000;
  const passo = () => {
    const cartao = faixa.firstElementChild;
    const gap = parseFloat(getComputedStyle(faixa).columnGap) || 0;
    return cartao ? cartao.getBoundingClientRect().width + gap : faixa.clientWidth;
  };
  const noFim = () => faixa.scrollLeft + faixa.clientWidth >= faixa.scrollWidth - 2;
  const atualizar = () => {
    anterior.disabled = faixa.scrollLeft <= 2;
    proximo.disabled = noFim();
  };
  const andar = (dir) => faixa.scrollBy({ left: passo() * dir, behavior: 'smooth' });

  // Passagem automática
  const automatico = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pausadoPeloUsuario = false, interagindo = false, visivel = false, timer = null;
  const parar = () => { clearInterval(timer); timer = null; };
  const talvezRodar = () => {
    parar();
    if (!automatico || pausadoPeloUsuario || interagindo || !visivel || document.hidden) return;
    timer = setInterval(() => {
      if (noFim()) faixa.scrollTo({ left: 0, behavior: 'smooth' });
      else andar(1);
    }, INTERVALO);
  };
  if (automatico && botaoPlay) {
    botaoPlay.hidden = false;
    botaoPlay.addEventListener('click', () => {
      pausadoPeloUsuario = !pausadoPeloUsuario;
      botaoPlay.setAttribute('aria-pressed', String(pausadoPeloUsuario));
      botaoPlay.setAttribute('aria-label', pausadoPeloUsuario ? 'Retomar a passagem automática' : 'Pausar a passagem automática');
      talvezRodar();
    });
    const segurar = () => { interagindo = true; talvezRodar(); };
    const soltar = () => { interagindo = false; talvezRodar(); };
    [faixa, nav].forEach((el) => {
      el.addEventListener('mouseenter', segurar);
      el.addEventListener('mouseleave', soltar);
      el.addEventListener('focusin', segurar);
      el.addEventListener('focusout', soltar);
    });
    faixa.addEventListener('touchstart', segurar, { passive: true });
    faixa.addEventListener('touchend', () => setTimeout(soltar, INTERVALO), { passive: true });
    new IntersectionObserver(([e]) => { visivel = e.isIntersecting; talvezRodar(); }, { threshold: 0.4 }).observe(faixa);
    document.addEventListener('visibilitychange', talvezRodar);
  }

  nav.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-dir]');
    if (botao) andar(Number(botao.dataset.dir));
  });
  faixa.addEventListener('scroll', atualizar, { passive: true });
  window.addEventListener('resize', atualizar);
  atualizar();
});

// Equipe: "Ver perfil completo" abre uma janela com tudo da pessoa.
// Sem suporte a <dialog> (ou sem JS), o cartão continua expandindo no lugar.
(() => {
  const cartoes = document.querySelectorAll('.team-card');
  if (!cartoes.length || typeof HTMLDialogElement !== 'function') return;

  const janela = document.createElement('dialog');
  janela.className = 'team-modal';
  janela.setAttribute('aria-labelledby', 'team-modal-nome');
  janela.innerHTML = '<button type="button" class="team-modal-fechar" aria-label="Fechar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="team-modal-corpo"></div>';
  document.body.appendChild(janela);
  const corpo = janela.querySelector('.team-modal-corpo');
  document.documentElement.classList.add('tem-janela');

  const fechar = () => janela.close();
  janela.querySelector('.team-modal-fechar').addEventListener('click', fechar);
  // Clique fora da caixa (no fundo escurecido) fecha.
  janela.addEventListener('click', (e) => { if (e.target === janela) fechar(); });
  janela.addEventListener('close', () => { document.documentElement.classList.remove('modal-aberto'); });

  const copia = (el) => (el ? el.cloneNode(true) : document.createTextNode(''));

  cartoes.forEach((cartao) => {
    const mais = cartao.querySelector('.team-more');
    const resumo = mais && mais.querySelector('summary');
    if (!resumo) return;
    resumo.addEventListener('click', (e) => {
      e.preventDefault();
      corpo.textContent = '';
      const foto = cartao.querySelector('.team-photo img');
      const lado = document.createElement('div');
      lado.className = 'team-modal-foto';
      if (foto) {
        const img = document.createElement('img');
        img.src = foto.currentSrc || foto.src; img.alt = foto.alt; img.width = 640; img.height = 640;
        lado.appendChild(img);
      }
      const info = document.createElement('div');
      info.className = 'team-modal-info';
      info.appendChild(copia(cartao.querySelector('.role-tag')));
      const nome = document.createElement('h2');
      nome.id = 'team-modal-nome';
      nome.textContent = cartao.querySelector('.team-caption h3').textContent;
      info.appendChild(nome);
      info.appendChild(copia(cartao.querySelector('.area-pill')));
      const frase = document.createElement('p');
      frase.className = 'team-quote';
      frase.textContent = cartao.querySelector('.team-quote').textContent;
      info.appendChild(frase);
      [...mais.children].forEach((filho) => { if (filho.tagName !== 'SUMMARY') info.appendChild(copia(filho)); });
      corpo.append(lado, info);
      document.documentElement.classList.add('modal-aberto');
      janela.showModal();
      corpo.scrollTop = 0;
    });
    // Clicar em qualquer parte do cartão (menos em links) também abre a janela.
    cartao.addEventListener('click', (e) => {
      if (e.target.closest('a, summary')) return;
      resumo.click();
    });
  });
})();

// Menu: abaixo de 1080px os links viram uma gaveta aberta pelo botão.
(() => {
  const botao = document.querySelector('.menu-toggle');
  const menu = document.getElementById('menu');
  const header = document.querySelector('header.top');
  if (!botao || !menu || !header) return;
  document.documentElement.classList.add('tem-menu');
  botao.hidden = false;
  const alternar = (abrir) => {
    menu.classList.toggle('aberto', abrir);
    botao.setAttribute('aria-expanded', String(abrir));
    botao.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
  };
  botao.addEventListener('click', () => alternar(!menu.classList.contains('aberto')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) alternar(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('aberto')) { alternar(false); botao.focus(); } });
  document.addEventListener('click', (e) => { if (!header.contains(e.target)) alternar(false); });

  // Sombra no cabeçalho depois que a página começa a rolar.
  const marcar = () => header.classList.toggle('rolou', window.scrollY > 8);
  window.addEventListener('scroll', marcar, { passive: true });
  marcar();
})();

// Blocos entram suavemente quando aparecem na tela (uma vez só).
// Para quem pediu menos movimento, ou sem IntersectionObserver, tudo aparece direto.
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const grupos = [
    '.section-title, .eyebrow, p.section-sub, .compare-heading, .offer-heading, .offer-lead',
    '.flow > *', '.problem-grid > *', '.twin > *', '.paths > *', '.o-tiers > *', '.o-consult > *',
    '.team-grid > *', '.team-integrada li', '.faq details', '.why-grid > *', '.timeline-chart', '.o-strip',
    '.o-table-wrap', '.final .wrap > *', '.results-cases > *', '.marcas-lista li', '#exemplos .case',
  ];
  const alvos = new Set();
  grupos.forEach((sel) => document.querySelectorAll(sel).forEach((el) => {
    if (el.closest('.hero')) return;
    alvos.add(el);
  }));
  if (!alvos.size) return;
  // Itens irmãos entram em sequência curta.
  alvos.forEach((el) => {
    const irmaos = [...el.parentElement.children].filter((x) => alvos.has(x));
    const ordem = irmaos.indexOf(el);
    if (irmaos.length > 1) el.style.setProperty('--atraso', `${Math.min(ordem, 5) * 0.08}s`);
    el.classList.add('revela');
  });
  document.documentElement.classList.add('tem-revelar');
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visivel');
      obs.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  alvos.forEach((el) => obs.observe(el));
})();

// Celular: faixas que deslizam ganham uma dica curta logo abaixo (some na primeira rolagem lateral).
(() => {
  const faixas = document.querySelectorAll('.team-grid, #exemplos .cases');
  faixas.forEach((faixa) => {
    const dica = document.createElement('p');
    dica.className = 'dica-deslize';
    dica.setAttribute('aria-hidden', 'true');
    dica.textContent = 'Deslize para ver mais';
    faixa.after(dica);
    faixa.addEventListener('scroll', () => { if (faixa.scrollLeft > 30) dica.style.visibility = 'hidden'; }, { passive: true });
  });
})();

// Barra fixa do WhatsApp (celular): aparece depois que os botões do topo saem da tela
// e some quando o contato está visível, para não repetir o mesmo convite.
(() => {
  const barra = document.querySelector('.sticky-cta');
  const topo = document.querySelector('.hero-actions');
  const contato = document.getElementById('contato');
  if (!barra || !topo || !contato || !('IntersectionObserver' in window)) return;
  const raiz = document.documentElement;
  raiz.classList.add('tem-barra');
  let passouTopo = false, noContato = false;
  const atualizar = () => raiz.classList.toggle('mostra-barra', passouTopo && !noContato);
  new IntersectionObserver(([e]) => {
    passouTopo = !e.isIntersecting && e.boundingClientRect.top < 0;
    atualizar();
  }).observe(topo);
  new IntersectionObserver(([e]) => { noContato = e.isIntersecting; atualizar(); }, { threshold: 0.15 }).observe(contato);
})();

// Celular: cartões empilhados. O cartão que está sendo coberto pelo próximo encolhe e escurece
// conforme a rolagem. Sem efeito em telas maiores ou para quem pediu menos movimento.
(() => {
  const pilhas = document.querySelectorAll('.problem-grid, .paths, .o-tiers, .o-consult');
  if (!pilhas.length) return;
  const celular = window.matchMedia('(max-width: 640px)');
  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  pilhas.forEach((p) => {
    p.classList.add('empilha');
    [...p.children].forEach((c, i) => c.style.setProperty('--i', i));
  });
  if (calmo) return;

  let pedido = false;
  const desenhar = () => {
    pedido = false;
    pilhas.forEach((p) => {
      const cartoes = [...p.children];
      cartoes.forEach((c, i) => {
        const prox = cartoes[i + 1];
        if (!celular.matches || !prox) { c.style.transform = ''; c.style.filter = ''; return; }
        const a = c.getBoundingClientRect();
        const b = prox.getBoundingClientRect();
        // 0 quando o próximo ainda está abaixo; 1 quando ele cobriu este cartão.
        const cobertura = Math.min(1, Math.max(0, (a.bottom - b.top) / a.height));
        c.style.transform = `scale(${1 - cobertura * 0.06})`;
        c.style.filter = `brightness(${1 - cobertura * 0.18})`;
      });
    });
  };
  const pedir = () => { if (!pedido) { pedido = true; requestAnimationFrame(desenhar); } };
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  celular.addEventListener('change', pedir);
  desenhar();
})();

// Celular: vídeo do topo limpo, sem controles nativos (play, tempo, velocidade, tela cheia).
// Continua rodando sozinho, sem som e em loop; tocar no vídeo pausa e retoma.
// O som segue pelo botão "Ouvir narração", logo abaixo do vídeo.
(() => {
  const video = document.querySelector('.brand-video');
  if (!video) return;
  const celular = window.matchMedia('(max-width: 640px)');
  const aplicar = () => {
    video.controls = !celular.matches;
    video.classList.toggle('sem-controles', celular.matches);
  };
  video.addEventListener('click', () => {
    if (!celular.matches) return;
    if (!video.src && video.dataset.src) video.src = video.dataset.src;
    if (video.paused) video.play().catch(() => {}); else video.pause();
  });
  celular.addEventListener('change', aplicar);
  aplicar();
})();
