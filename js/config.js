// Configuração do site. Troque cada [[PREENCHER: ...]] pelo valor real.
// Enquanto um valor tiver o placeholder, o recurso que depende dele fica desligado.
window.SOLUTEC_CONFIG = {
  // Endpoint do serviço de formulários. FormSubmit: os envios chegam por e-mail.
  // Depois da ativação, trocar o e-mail pelo código que o FormSubmit manda, para ele não ficar exposto.
  // Sem endpoint (ou sem a política abaixo), o formulário de contato fica desabilitado.
  formEndpoint: 'https://formsubmit.co/ajax/soydeoliveira@gmail.com',
  // Endereço da política de privacidade, linkada no consentimento LGPD do formulário.
  // Endereço completo, porque o link também aparece nas páginas de solucoes/.
  politicaUrl: 'https://isolutis.com.br/privacidade.html',
  // Link de agendamento (Calendly, Cal.com). Sem ele, o botão "Agendar horário" não aparece.
  agendaUrl: '[[PREENCHER: URL Calendly/Cal.com]]',
  // Medição: só carregam depois que o visitante aceita os cookies.
  ga4Id: '[[PREENCHER: ID G-XXXXXXX]]',
  metaPixelId: '[[PREENCHER: ID do pixel]]'
};
