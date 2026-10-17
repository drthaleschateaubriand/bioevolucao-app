# PROMPT MESTRE: BIOEVOLUÇÃO, PWA DE BIOIMPEDÂNCIA

Atue como engenheiro de software sênior, especialista em React ou HTML/JS sem build, PWA para iPhone/Safari, OCR de relatórios, UX médica e deploy no GitHub Pages.

## Objetivo

Criar e publicar o aplicativo responsivo **BioEvolução** em `https://drthaleschateaubriand.github.io/bioevolucao-app/`, somente após a URL estar realmente disponível. O projeto deve funcionar no Safari do iPhone, no Android e em computadores. O objetivo clínico é registrar avaliações seriadas de bioimpedância, visualizar curvas evolutivas, importar capturas de tela, corrigir valores e copiar um texto objetivo para o prontuário.

## Fluxos indispensáveis

1. **Dashboard:** gráficos com linha, pontos e valores legíveis para peso (kg), massa muscular estimada (kg), massa gorda (kg), gordura corporal (%), IMC (kg/m²), nível de gordura visceral e metabolismo basal estimado (kcal/dia). Mostrar última, primeira e comparação percentual ou absoluta, conforme apropriado.
2. **Registro manual:** formulário mobile-first para datas e os sete indicadores. Permitir criar, editar ou excluir avaliações sem perder demais datas.
3. **Fotografias:** botão compatível com `input type=file` e iOS Photos/câmera, seleção múltipla JPG/PNG/HEIC quando navegador suportar, pré-visualização e análise de fotos de telas do InBody ou aparelhos semelhantes. Reconhecer rótulo, data, valor e posição horizontal do ponto no gráfico. Evitar confundir data e valor, sobretudo 13.0/13.6, 42.8/43.8, 15.0/15.2. O reconhecimento nunca deve confirmar automaticamente um registro.
4. **Revisão do OCR:** tabela por data × indicador, valores sugeridos editáveis, destaque visual para baixa confiança, campos em branco se ilegíveis, botão de confirmar explicitamente. Mostrar quando uma data já existe e perguntar se deve atualizar ou manter. Não inventar valores ausentes.
5. **Prontuário:** formatos parágrafo único completo, parágrafo único sintético e cronológico por data, incluindo data, valores e variação da primeira para última ou penúltima para última. Português brasileiro, vírgula decimal, unidades e nomenclatura médica correta. Botão "Copiar" com fallback para seleção manual no Safari. **Jamais inferir sarcopenia ou perda de massa magra comprovada a partir de bioimpedância isolada.**
6. **Pacientes:** no protótipo público, utilizar apenas identificadores genéricos/não identificáveis e armazenamento no dispositivo. Permitir exportar/importar JSON para backup e impedir remoção acidental.

## Dados de demonstração

Datas na ordem: 28/08/2026, 04/09/2026, 11/09/2026, 25/09/2026, 01/10/2026, 09/10/2026, 16/10/2026.

- Peso kg: 89,5; 90,0; 90,9; 90,8; 88,3; 88,1; 88,5.
- Massa muscular kg: 44,2; 44,2; 45,2; 44,4; 42,8; 43,1; 42,9.
- Massa gorda kg: 12,2; 12,6; 11,8; 12,8; 13,2; 12,6; 13,5.
- Gordura corporal %: 13,6; 14,0; 13,0; 14,1; 15,0; 14,3; 15,2.
- IMC: 27,9; 28,1; 28,4; 28,3; 27,6; 27,5; 27,6.
- Gordura visceral: 5; 5; 5; 5; 5; 5; 5.
- Metabolismo basal kcal: 2040; 2042; 2079; 2055; 1992; 2001; 1990.

Esses números devem aparecer apenas como **demonstração sem identificação pessoal**, facilmente removível ou desligável.

## Tecnologia e iPhone

- Preferir um PWA estático sem backend para o protótipo. Servir arquivos por HTTPS no GitHub Pages com todos os caminhos relativos ao subdiretório `/bioevolucao-app/`.
- `index.html`, `manifest.webmanifest`, service worker com versionamento e limpeza de cache antigo, ícones PNG 180/192/512 e metatags iOS.
- Layout de 360 a 440 CSS px sem barras horizontais no conteúdo principal. Tabelas amplas podem ter rolagem horizontal controlada.
- Botões com área de toque adequada, labels claros, campos numéricos com `inputmode=decimal`, respeitar `safe-area-inset-*`, compatibilidade com Safari iOS, clique de copiar e importação de imagem.
- Gráficos com SVG ou biblioteca leve. Resiliência offline para registros, mas deixar explícito que OCR externo pode exigir conexão na primeira execução.
- Tratar bloqueio de armazenamento, falhas de rede, imagem sem dados, números ambíguos, ausência de permissão de área de transferência e atualização de cache.
- Interface independente, sem uso de logo ou marca da InBody como se houvesse afiliação.

## Privacidade e segurança

- NÃO enviar fotos, valores ou dados clínicos a servidores de terceiros sem base legal, consentimento e arquitetura apropriada. Não inserir dados reais de pacientes no repositório público, no HTML, em commits, logs de deploy ou exemplos.
- `localStorage`/IndexedDB pode servir APENAS para prototipagem com registros não identificáveis. Avisar claramente que não há login nem sincronização.
- Para fase clínica posterior, implementar autenticação robusta, banco com políticas RLS por clínica/usuário, HTTPS, segregação, auditoria, backups seguros, gestão de acesso e adequação à LGPD. GitHub Pages é hospedagem estática, não banco para prontuários.

## Entrega e testes

- Criar arquivos organizados no repositório `drthaleschateaubriand/bioevolucao-app` sem mexer nos demais repositórios.
- Publicar em **GitHub Pages** (branch `main`, diretório `/ (root)`, ou alternativa GitHub Actions configurada e verificada).
- Abrir a URL real em navegador depois do deploy e verificar resposta HTTP 200, renderização e ausência de erros críticos.
- Testar fluxos no viewport de iPhone: navegação, gráficos, digitação, edição, exclusão, foto, revisão do OCR, copiar texto, exportar/importar dados, recarregar a página, instalar na tela inicial e reabrir sem perder registros.
- Testar que os dados de demonstração aparecem corretamente e que não são gravados resultados de OCR sem revisão.
- Mostrar ao usuário URL do site publicado, URL do repositório e instruções de instalação pelo Safari (`Compartilhar` > `Adicionar à Tela de Início`).
- Não alegar que o site está no ar sem verificar o endereço público.

## Critério de aceitação

O médico abre o link no iPhone, visualiza os sete gráficos, adiciona nova avaliação manual ou por fotografia, corrige os números se necessário, gera um parágrafo clínico e o copia para seu sistema de prontuário em poucos toques. Dados de teste devem permanecer separados de quaisquer dados reais.