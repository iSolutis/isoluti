# Melhorias de marketing do site iSolutis (antes SOLUTEC)

Branch `melhorias-marketing`, um commit por tarefa, feito a partir da spec baseada na avaliação de 29/09/2026. Nada foi publicado na `main`.

## Como os placeholders funcionam

- Dado que depende do cliente aparece no código como `[[PREENCHER: ...]]`. Nenhum deles fica visível para o visitante.
- Blocos de texto (Resultados, preços, fontes, FAQ) têm `data-preencher` e `hidden`. O `js/main.js` só mostra o bloco quando não sobra nenhum `[[PREENCHER` dentro dele. Ou seja, basta trocar o texto e publicar.
- Recursos com configuração (formulário, agenda, GA4, Meta Pixel, política de privacidade) ficam em `js/config.js`. Cada recurso só liga quando o valor dele é preenchido.

## O que mudou, tarefa por tarefa

**T1. Auditoria (sem alterações).** Site estático com `index.html`, `css/style.css`, `js/main.js`, 4 imagens (logo PNG de 69 KB exibido a 48 px, 3 fotos JPG) e vídeo MP4 de 2,6 MB no topo, sem poster e com `preload="metadata"`. O título era "SOLUTEC — Tão rápido quanto seguro". Não havia meta description, Open Graph, dados estruturados, favicon, robots nem sitemap. O único script de terceiros era o Google Fonts. Um único `h1`, `lang="pt-BR"` já presente. Âncoras: `#inicio`, `#rapido-seguro`, `#problema`, `#exemplos`, `#como-funciona`, `#investimento`, `#faixas`, `#consultoria`, `#equipe`, `#duvidas`, `#contato`. Todas foram mantidas.

**T2. Resultados (prova social).** Nova seção `#resultados` logo depois de "O tipo de sistema que construímos": uma faixa com 3 números e 3 cartões de case (contexto, problema, solução e resultado com número). Fica oculta até todos os campos terem dado real. O comentário acima da seção explica como ativar.

**T3. Âncora de preço.** Em cada faixa (Simples, Média, Complexa) entram as linhas "Projetos a partir de ..." e "Manutenção a partir de .../mês", ocultas até os valores serem definidos. A nota "Valores apresentados após a conversa de diagnóstico" foi mantida.

**T4. Segundo canal.** Formulário em `#contato` com nome, e-mail, empresa, cargo (opcional), "qual processo está travando?" e consentimento LGPD com link para a política. Também tem honeypot, validação no navegador com mensagens por campo e os estados carregando, sucesso e erro (o erro oferece o WhatsApp). O formulário vem desligado no HTML e mostra "O formulário ainda não está disponível. Fale com a gente pelo WhatsApp". Ele só liga quando `js/config.js` tem o endpoint e a URL da política. Assim, quem está sem JavaScript nunca envia dados pela URL. O botão "Agendar horário" só aparece com o link de agenda configurado. O WhatsApp continua como botão principal.

**T5. FAQ.** Entraram 5 perguntas novas. "Garantia" e "manutenção" já aparecem, respondidas com o que o site já afirma, e o complemento comercial fica oculto. "Código", "encerramento da manutenção" e "LGPD" dependem de decisão jurídica ou comercial e ficam ocultas até terem resposta.

**T6. Linguagem para o decisor.** Frase no topo: "Para empresas de médio porte que ainda operam em planilhas, WhatsApp e e-mail". Cada termo técnico ganhou uma explicação curta na primeira vez que aparece: OWASP Top 10, vulnerabilidades, integrações, ERP, multiempresa, sistemas legados, arquitetura, .NET, dívida técnica, deploy e discovery.

**T7. Dados com fonte.** Os números e textos não mudaram. Há espaço para o link da Veracode e para a origem dos números "R$ 100 mil" e "60%", tudo oculto até ser preenchido.

**T8. Tom.** "Some depois do pagamento" virou "Sem garantia de continuidade".

**T9. Como revisamos.** Bloco com 5 etapas na faixa "Por que a revisão nunca sai do cronograma": revisão de arquitetura, análise estática, verificação OWASP Top 10, teste de acesso e permissões e revisão final. As ferramentas ficam ocultas até serem confirmadas.

**T10. SEO técnico.**
- Novo título, meta description (132 caracteres), canonical, Open Graph e Twitter Card. A imagem de compartilhamento está comentada até existir a arte.
- JSON-LD `Organization` + `ProfessionalService` (nome, URL, telefone, `areaServed`).
- Novos `robots.txt`, `sitemap.xml` e favicon, que eliminou o erro 404 no console.
- Vídeo com poster e `preload="none"`. O arquivo só é baixado quando o vídeo aparece na tela e depois do carregamento da página. No celular (375 px), nada é baixado antes de rolar.
- Logo e fotos em WebP com `width`/`height`. O logo do cabeçalho caiu de 69 KB para 4 KB.
- Contraste AA nos dourados sobre fundo claro ("Seguro" e os números e preços do "Como funciona").

**T11. Medição.** Aviso de cookies com Aceitar/Recusar. A escolha fica lembrada no navegador e pode ser reaberta em "Preferências de cookies", no rodapé. O aviso só aparece com algum ID configurado. GA4 e Meta Pixel só carregam depois do "Aceitar". Eventos: `click_whatsapp`, `click_agendar`, `submit_form` e `scroll_75`, com o local do clique (`topo`, `faixas`, `contato`, `barra-fixa`, `rodape`). Antes do consentimento, os eventos são descartados.

**T12. Páginas de entrada.** Três páginas: `solucoes/crm-sob-medida.html`, `solucoes/automacao-rotinas-fiscais.html` e `solucoes/sistema-ordens-de-servico.html`. Cada uma tem h1, título e descrição próprios, dores, antes/depois, "Como funciona", FAQ curto e CTA. Estão ligadas pelos cartões da home e incluídas no sitemap. O texto usa só o que o site já afirma, e os complementos ficam ocultos.

## Verificação

- Mobile (375 px) e desktop (1280 px), nas 4 páginas: nenhum placeholder visível, nenhuma rolagem horizontal, um único `h1`, nenhum erro no console e nenhum link ou âncora quebrado.
- Formulário testado com endpoint simulado: validação, carregando, sucesso, erro e o estado desligado.
- Medição testada com IDs falsos e requisições a Google/Meta bloqueadas: nada de terceiros é carregado antes do "Aceitar", os eventos saem com o local depois dele, e "Recusar" mantém tudo desligado.

### Lighthouse (mobile, mediana de 3 execuções, servidor local)

| Página | Desempenho | Acessibilidade | Boas práticas | SEO |
| --- | --- | --- | --- | --- |
| Home, antes | 84 | 95 | 96 | 91 |
| Home, depois | 88 | 96 | 100 | 100 |
| CRM sob medida (nova) | 90 | 92 | 100 | 100 |

A única falha de acessibilidade que restou é o contraste do "TEC" dourado no logotipo. A WCAG isenta logotipos, e mudar essa cor mexeria na identidade visual, então ficou como está.

## Pendências

Todos os `[[PREENCHER: ...]]`, com arquivo e linha.

### Comercial
- `index.html:283-317`: seção Resultados (frase de abertura, 3 números reais e 3 cases com autorização do cliente).
- `index.html:384-385`, `401-402`, `418-419`: valores "a partir de" do projeto e da manutenção nas faixas Simples, Média e Complexa.
- `index.html:589`: prazo de garantia e prazo de resposta para correções.
- `index.html:593`: duração mínima do contrato de manutenção e o que conta como "pequena evolução".
- `index.html:192`: origem dos números "R$ 100 mil" (software house) e "60%" (prateleira): fonte, ou "estimativa da SOLUTEC".
- `solucoes/crm-sob-medida.html:99`: o que um CRM da SOLUTEC costuma incluir.
- `solucoes/sistema-ordens-de-servico.html:99`: faixa típica e o que um sistema de OS inclui.
- `js/config.js:10`: link do Calendly ou Cal.com.
- JSON-LD em `index.html`: confirmar `areaServed` = Brasil.

### Jurídico
- `privacidade.html`: revisar a versão inicial publicada em 29/09/2026 (base legal, prazo de guarda, CNPJ e endereço da empresa, e o compromisso de não ceder dados).
- `index.html:577`: a quem pertencem o código e o sistema depois da entrega.
- `index.html:581`: encerramento da manutenção (aviso prévio e o que é entregue).
- `index.html:585`: tratamento de dados pessoais e LGPD.

### Marketing
- `js/config.js:12`: ID do GA4 (G-XXXXXXX).
- `js/config.js:13`: ID do Meta Pixel.
- `index.html:150`: link do relatório da Veracode. **Conferir o ano:** o site diz "Veracode em 2026", mas o levantamento conhecido com o número de 45% é de 2025.

### Engenharia
- `js/config.js`: depois que o FormSubmit for ativado, trocar o e-mail do endpoint pelo código que ele manda por e-mail, para o endereço não ficar exposto no código.
- `index.html:162`: ferramentas usadas na revisão de segurança.
- `solucoes/automacao-rotinas-fiscais.html:99`: rotinas fiscais que a SOLUTEC já automatiza.

## Observações

- O `robots.txt` foi criado como a spec pede, mas o site é uma página de projeto (`/solutec/`) e os buscadores só leem o `robots.txt` da raiz do domínio (`soydeoliveira-create.github.io/robots.txt`). O sitemap deve ser enviado direto no Google Search Console.
- As fotos JPG e o `logo.png` antigos continuam no repositório. O `logo.png` é usado nos dados estruturados; as fotos JPG não são mais usadas pelo site.

## Depois da publicação

- 29/09/2026: formulário ligado com o FormSubmit (os envios chegam em e-mail) e página `privacidade.html` publicada, com link no rodapé de todas as páginas. O envio agora vai em JSON, com assunto "Contato pelo site: <empresa>". O primeiro envio dispara um e-mail de ativação do FormSubmit; enquanto ele não for confirmado, o formulário mostra a mensagem de erro com o link do WhatsApp.
- 01/10/2026: troca de marca de SOLUTEC para **isolutis — Tecnologia que impulsiona**. Novo símbolo "iS" em SVG (`img/logo.svg`), favicon, ícone de celular, `logo.png` e imagem de compartilhamento 1200x630 (`img/og-image.png`) gerados a partir dele. Paleta trocada do dourado para o turquesa da marca (`#22C1CC`, com `#0D727A` em textos sobre fundo claro para manter o contraste AA) e o azul-marinho `#1B2B4B`. O endereço do site e o nome do repositório continuam `solutec`.
- 01/10/2026 (mais tarde): logo oficial aplicada. Wordmark "iSolutis" no cabeçalho e logo principal com slogan no rodapé (versão colorida gerada a partir do arquivo reverso `isolutis_logo_principal_reverso.png`), símbolo oficial em favicon, ícone de celular e `logo.png`, e imagem de compartilhamento com o logo reverso. Grafia passou a ser **iSolutis**. Paleta oficial aplicada em todo o site: Azul Profundo `#01376D`, Ciano Energia `#01CADC`, Branco `#FFFFFF` e Cinza Neutro `#E9EEF2`; tons intermediários são essas cores com transparência. O ciano não é usado como texto sobre fundo claro (contraste 2:1); lá os destaques ficam em Azul Profundo. Única exceção à paleta: o vermelho claro das mensagens de erro do formulário.
- 01/10/2026: domínio próprio isolutis.com.br configurado no GitHub (arquivo `CNAME`). Endereços absolutos (canonical, Open Graph, dados estruturados, sitemap, robots e política) passaram para `https://isolutis.com.br/`. Com o site na raiz do domínio, o `robots.txt` passa a ser lido pelos buscadores. Pendência: DNS do domínio no Registro.br (registros A do GitHub Pages e CNAME do www).
