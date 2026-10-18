# Avaliação Antropométrica — versão profissional

Aplicação clínica de composição corporal, bioimpedância, adipometria e antropometria, preparada para uso independente e para incorporação futura no Cliniv.

## Estado atual

A versão profissional já utiliza:
- Firebase Authentication;
- Cloud Firestore;
- GitHub Pages;
- controle de acesso por função;
- busca e cadastro de paciente;
- bioimpedância manual;
- OCR de múltiplas fotos;
- leitura de PDFs, inclusive páginas escaneadas;
- revisão dos dados reconhecidos antes de aplicar;
- adipometria Jackson-Pollock 7 dobras;
- circunferências;
- evolução longitudinal;
- gráficos separados para bioimpedância e adipômetro;
- tabela comparativa de medidas;
- modo paciente;
- texto para prontuário;
- relatório imprimível/PDF.

## Estrutura

- `index.html` — entrada da aplicação;
- `js/app.js` — fluxo clínico, OCR, evolução e relatório;
- `js/calculations.js` — cálculos;
- `js/data-store.js` — abstração de persistência;
- `../shared/firebase-client.js` — backend atual;
- `docs/` — documentação funcional e integração.

## Integração Cliniv

A versão preferencial de longo prazo é nativa no Cliniv:
**Cliniv → paciente aberto → Avaliação Antropométrica**

A equipe do Cliniv pode reutilizar a lógica e os componentes, substituindo Firebase e GitHub Pages pelos serviços internos da plataforma.

Documentação de entrega específica:
`../handoff-cliniv/`

## Segurança

A configuração Firebase Web não é uma credencial administrativa. O acesso aos dados depende de autenticação e regras do Firestore.

Ainda assim, para uma incorporação nativa no Cliniv, não reutilizar o Firebase desta demonstração como backend do produto final. Usar a infraestrutura e governança do próprio Cliniv.

## Identidade

Responsável: Thales Chateaubriand — CRM 25254.

## Aplicação de referência

https://drthaleschateaubriand.github.io/bioevolucao-app/professional/
