# BioEvolução | Bioimpedância para prontuário

Aplicativo web responsivo (PWA) em HTML, CSS e JavaScript. Inclui gráficos de evolução, entrada manual de medidas, histórico, texto para copiar no prontuário, importação de imagens por OCR experimental e backup JSON.

**Site após ativação do Pages:** https://drthaleschateaubriand.github.io/bioevolucao-app/

## Publicação no GitHub Pages
Este repositório usa a branch `Copy-of-MASTER-3-SUPABASE` e o workflow `.github/workflows/deploy.yml`.

**Passo obrigatório do proprietário, uma única vez:** abra **Settings > Pages > Build and deployment > Source**, escolha **GitHub Actions**. O primeiro workflow falhou porque Pages ainda não estava habilitado. Após habilitar, abra **Actions > Publicar BioEvolução**, selecione a execução com falha e **Re-run jobs**. Alternativamente, um novo commit nessa branch dispara a publicação.

## iPhone
Abra o site usando o navegador Safari no iOS. Em **Compartilhar**, selecione **Adicionar à Tela de Início**. Os ícones PNG são gerados automaticamente no workflow a partir do script `scripts/generate_icons.py`; o manifesto e service worker tornam o app instalável.

## Uso
- **Evolução:** gráficos de peso, massa muscular, massa gorda, percentual de gordura, IMC, nível de gordura visceral e taxa metabólica basal estimada.
- **Nova avaliação:** preencher valores e data, salvar, editar ou apagar.
- **Importar foto:** OCR Tesseract.js; validar manualmente os números e a data antes de aceitar a leitura.
- **Prontuário:** comparar as avaliações e copiar o texto clínico.
- **Backup:** exportação/importação JSON.

## Avisos e segurança
Este é um **protótipo demonstrativo**, sem login, banco de dados seguro ou sincronização. Armazena dados apenas no localStorage do aparelho/navegador. Não inclui armazenamento clínico remoto. Não compartilhar a URL, backup ou dispositivo com dados identificáveis de pacientes. A aplicação não está pronta para armazenar dados clínicos identificáveis em produção sob LGPD; requer autenticação, autorização, criptografia, auditoria e política de retenção. Não enviar imagens de pacientes ao repositório público. A leitura por OCR é experimental e exige confirmação integral. Os valores de bioimpedância são estimativas afetadas por hidratação e técnica de mensuração.

## Requisitos de desenvolvimento
Ver [PROMPT_DESENVOLVIMENTO.md](./PROMPT_DESENVOLVIMENTO.md).
