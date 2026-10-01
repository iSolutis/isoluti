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
    if (autoplay) video.play().catch(() => {});
  }, { threshold: 0.4 }).observe(video);
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
    // definem o assunto e o layout do e-mail que chega para a isolutis.
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
      mostrarStatus('erro', 'Não conseguimos enviar agora. Tente de novo em instantes ou <a href="https://wa.me/5571992390992?text=Ol%C3%A1!%20Quero%20agendar%20um%20diagn%C3%B3stico%20com%20a%20isolutis." target="_blank" rel="noopener">fale pelo WhatsApp</a>.');
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
