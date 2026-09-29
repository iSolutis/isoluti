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
  form.querySelectorAll('[data-politica]').forEach((a) => { a.href = CONFIG.politicaUrl; });

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
    if (form.elements._gotcha.value) {
      form.reset();
      mostrarStatus('sucesso', 'Recebemos sua mensagem. Retornamos em breve.');
      return;
    }

    // Os dados saem antes de travar o formulário: campo desabilitado não entra no FormData.
    const dados = new FormData(form);
    form.setAttribute('aria-busy', 'true');
    fieldset.disabled = true;
    botao.textContent = 'Enviando…';
    mostrarStatus('carregando', 'Enviando sua mensagem…');

    try {
      const resposta = await fetch(CONFIG.formEndpoint, {
        method: 'POST',
        body: dados,
        headers: { Accept: 'application/json' },
      });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      form.reset();
      form.classList.add('is-sent');
      mostrarStatus('sucesso', '<strong>Mensagem enviada.</strong> Retornamos pelo e-mail informado em breve.');
      status.setAttribute('tabindex', '-1');
      status.focus();
      track('submit_form', { local: 'contato' });
    } catch (erro) {
      fieldset.disabled = false;
      mostrarStatus('erro', 'Não conseguimos enviar agora. Tente de novo em instantes ou <a href="https://wa.me/5571992390992?text=Ol%C3%A1!%20Quero%20agendar%20um%20diagn%C3%B3stico%20com%20a%20SOLUTEC." target="_blank" rel="noopener">fale pelo WhatsApp</a>.');
    } finally {
      form.removeAttribute('aria-busy');
      botao.textContent = textoBotao;
    }
  });
})();
