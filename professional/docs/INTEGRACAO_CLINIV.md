# Guia de integração com Cliniv

## Objetivo
Permitir que Avaliação Antropométrica seja incorporada ao Cliniv sem reconstruir as regras clínicas e componentes do módulo.

## Modelo preferencial
Cliniv → Paciente → Avaliação Antropométrica

O usuário já autenticado no Cliniv abre o módulo e o paciente correto é carregado automaticamente.

## Formas de integração suportadas
### A. Módulo nativo
A equipe do Cliniv reutiliza os componentes e regras do projeto dentro da aplicação principal.
É a opção preferencial de longo prazo.

### B. Aplicação incorporada
O Cliniv incorpora a aplicação em área própria e envia contexto seguro do paciente e do profissional.

### C. Aplicação externa com SSO
O Cliniv abre a aplicação externa já autenticada e com o paciente selecionado.

## Dados mínimos enviados pelo Cliniv
- external_patient_id;
- nome completo;
- data de nascimento;
- sexo;
- e-mail;
- telefone;
- altura, quando disponível.

## Dados retornados ao Cliniv
- avaliação estruturada;
- bioimpedância;
- adipometria;
- perímetros;
- texto de evolução;
- referência do relatório PDF;
- data/hora;
- profissional responsável.

## Contrato sugerido
### Abrir contexto
POST /integration/cliniv/session

Entrada:
- patient_external_id
- professional_external_id
- nonce
- expires_at
- signature ou token assinado

Saída:
- session_token
- patient_id interno
- redirect_url

### Registrar avaliação
POST /api/v1/patients/{patient_id}/assessments

### Consultar evolução
GET /api/v1/patients/{patient_id}/assessments

### Obter texto para prontuário
GET /api/v1/assessments/{assessment_id}/chart-text

### Obter relatório
GET /api/v1/assessments/{assessment_id}/report

## SSO
Não transmitir senha do Cliniv.
Preferir OIDC/OAuth2, JWT assinado de curta duração ou mecanismo oficial disponibilizado pelo Cliniv.

## Incorporação
Se iframe for utilizado temporariamente:
- liberar apenas origem Cliniv autorizada;
- Content-Security-Policy frame-ancestors restrito;
- tokens curtos;
- nunca usar parâmetros de URL com dados clínicos sensíveis.

## Identidade visual
O frontend foi pensado para aceitar tokens de tema. A equipe do Cliniv poderá substituir:
- cor principal;
- tipografia;
- logotipo;
- espaçamentos;
- cabeçalho.

## Entrega técnica ao Cliniv
- código-fonte;
- esquema do banco;
- documentação das regras de cálculo;
- documentação da API;
- matriz de permissões;
- instruções de implantação;
- variáveis de ambiente necessárias;
- testes dos cálculos;
- checklist de segurança.

## Observação
A integração final depende das APIs, padrões de autenticação e políticas técnicas fornecidas pela equipe do Cliniv.
