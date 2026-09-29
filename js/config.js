// Configuração do site. Troque cada [[PREENCHER: ...]] pelo valor real.
// Enquanto um valor tiver o placeholder, o recurso que depende dele fica desligado.
window.SOLUTEC_CONFIG = {
  // Endpoint do serviço de formulários (ex.: https://formspree.io/f/xxxxxxx).
  // Sem ele (ou sem a política abaixo), o formulário de contato fica desabilitado.
  formEndpoint: '[[PREENCHER: URL do endpoint]]',
  // Endereço da política de privacidade, linkada no consentimento LGPD do formulário.
  politicaUrl: '[[PREENCHER: URL da política de privacidade]]',
  // Link de agendamento (Calendly, Cal.com). Sem ele, o botão "Agendar horário" não aparece.
  agendaUrl: '[[PREENCHER: URL Calendly/Cal.com]]',
  // Medição: só carregam depois que o visitante aceita os cookies.
  ga4Id: '[[PREENCHER: ID G-XXXXXXX]]',
  metaPixelId: '[[PREENCHER: ID do pixel]]'
};
