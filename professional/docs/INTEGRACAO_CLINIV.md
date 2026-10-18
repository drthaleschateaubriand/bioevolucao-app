# Guia de integração com Cliniv

## Objetivo

Incorporar a Avaliação Antropométrica ao Cliniv preservando regras clínicas, fluxo, relatórios e experiência já validados.

## Modelo preferencial

**Cliniv → paciente já aberto → Avaliação Antropométrica**

O profissional usa a sessão Cliniv existente. O módulo recebe automaticamente o paciente e o profissional.

## Recomendação técnica

A aplicação atual é uma implementação de referência. Na incorporação nativa, substituir:

- Firebase Authentication → autenticação/SSO Cliniv;
- Firestore → persistência Cliniv;
- membership Firebase → RBAC Cliniv;
- GitHub Pages → infraestrutura Cliniv.

Manter:
- cálculos;
- estrutura funcional;
- OCR;
- organização dos dados;
- gráficos;
- tabelas;
- relatório;
- comportamento de campos opcionais.

## Contexto mínimo

Profissional:
- id;
- nome;
- registro profissional;
- papel/permissões.

Paciente:
- patient_id;
- nome;
- nascimento;
- sexo;
- e-mail;
- telefone;
- altura.

## Persistência sugerida

Uma avaliação deve manter:
- patient_id;
- professional_id;
- data/hora;
- bioimpedância;
- adipometria;
- antropometria;
- autoria;
- histórico de alterações quando aplicável.

## OCR

Aceitar:
- múltiplas imagens;
- PDFs textuais;
- PDFs escaneados;
- PDFs multipágina.

Nenhum valor extraído deve ser salvo sem conferência do profissional.

## Prontuário

O módulo gera texto factual para inserção no prontuário.

A integração ideal é o Cliniv receber esse texto de forma estruturada ou por ação explícita do profissional, mantendo rastreabilidade.

## Relatório

O módulo deve permitir relatório/PDF com:
- identificação;
- gráficos;
- tabelas;
- medidas;
- profissional responsável.

## SSO e segurança

Não transmitir senha do Cliniv.

Se for necessário desacoplar temporariamente:
- usar OIDC/OAuth2 ou JWT assinado de curta duração;
- validar origem;
- evitar dados clínicos sensíveis em parâmetros de URL;
- nunca confiar apenas em permissões do frontend.

## Iframe

Pode ser solução temporária, não a preferencial.

Se usado:
- `frame-ancestors` restrito ao Cliniv;
- sessão curta;
- comunicação segura por postMessage com origem validada;
- nada de dados sensíveis expostos na URL.

## Entrega

Pacote técnico:
`handoff-cliniv/`

Aplicação de referência:
https://drthaleschateaubriand.github.io/bioevolucao-app/professional/

Código:
https://github.com/drthaleschateaubriand/bioevolucao-app

## Dependência externa

A integração final depende do padrão de autenticação, APIs, modelo de dados e políticas técnicas disponibilizados pela equipe do Cliniv.
