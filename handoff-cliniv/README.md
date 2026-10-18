# Entrega técnica para integração com o Cliniv

## Projeto
**Avaliação Antropométrica**  
Responsável funcional: **Thales Chateaubriand — CRM 25254**

Aplicação de referência:
https://drthaleschateaubriand.github.io/bioevolucao-app/professional/

Repositório:
https://github.com/drthaleschateaubriand/bioevolucao-app

## Objetivo desta entrega

Este material existe para que a equipe do Cliniv possa incorporar o módulo de Avaliação Antropométrica ao próprio ambiente, preservando as regras clínicas, o fluxo e a experiência já validados na aplicação atual.

A implementação atual deve ser tratada como **referência funcional e de interface**. Para a versão nativa do Cliniv, a recomendação é substituir autenticação, persistência, permissões e contexto de paciente pelos serviços internos do próprio Cliniv.

## Escopo funcional já implementado

- cadastro e busca de paciente;
- composição corporal por bioimpedância;
- entrada manual de dados;
- leitura assistida por OCR de fotografias;
- leitura de PDFs, inclusive páginas escaneadas;
- revisão humana antes de aplicar dados reconhecidos;
- Jackson-Pollock de 7 dobras;
- cálculo de densidade corporal e percentual de gordura;
- cálculo de massa gorda e massa livre de gordura;
- antropometria e circunferências;
- evolução longitudinal por datas;
- gráficos separados para bioimpedância e adipometria;
- tabela comparativa de pregas e circunferências;
- modo de apresentação ao paciente;
- relatório visual/imprimível;
- texto objetivo para copiar ao prontuário;
- controle de acesso por função.

## Estrutura de código mais importante

- `professional/` — aplicação clínica;
- `professional/js/app.js` — fluxo, telas, OCR, evolução e relatórios;
- `professional/js/calculations.js` — fórmulas e cálculos;
- `professional/js/data-store.js` — camada de persistência;
- `shared/firebase-client.js` — adaptador atual de backend;
- `firebase/firestore.rules` — referência da matriz de permissões;
- `professional/docs/` — especificação funcional e integração;
- `handoff-cliniv/` — documentação desta entrega.

## Recomendação de integração

Preferência:

**Cliniv → paciente aberto → Avaliação Antropométrica nativa**

O profissional não deve fazer novo login nem procurar novamente o paciente. O Cliniv deve fornecer o contexto do usuário autenticado e do paciente já selecionado.

## O que não deve ser reaproveitado literalmente

A configuração do Firebase atual serve apenas à aplicação independente. O Cliniv **não deve usar credenciais, banco, usuários ou dados do Firebase do projeto atual**.

No módulo nativo, substituir:
- Firebase Authentication → autenticação/SSO do Cliniv;
- Firestore → banco e repositórios internos do Cliniv;
- membership Firebase → RBAC/permissões Cliniv;
- GitHub Pages → infraestrutura Cliniv.

## Prioridade

Preservar primeiro:
1. regras de cálculo;
2. estrutura dos dados;
3. fluxo de uso;
4. relatório;
5. visual e comportamento;
6. permissões.

A tecnologia interna pode ser adaptada ao padrão da equipe do Cliniv.
