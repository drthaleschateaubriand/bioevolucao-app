# Especificação Mestre — Avaliação Antropométrica v1.0

## 1. Objetivo
Módulo clínico para registro e acompanhamento longitudinal de composição corporal, bioimpedância, adipometria e perímetros, inicialmente independente e posteriormente incorporável ao Cliniv.

## 2. Fluxo principal
1. Login por e-mail e senha.
2. Busca do paciente pelo nome completo.
3. Resumo da última avaliação.
4. Nova avaliação na mesma página, organizada em três blocos: Bioimpedância, Adipômetro e Antropometria.
5. Finalizar avaliação.
6. Visualizar evolução completa ou selecionar datas específicas.
7. Mostrar resultados ao paciente em modo de apresentação.
8. Copiar texto detalhado para o prontuário.
9. Gerar, imprimir, baixar ou enviar relatório por e-mail.

## 3. Cadastro do paciente
Campos:
- nome completo;
- data de nascimento;
- idade calculada automaticamente;
- sexo;
- e-mail;
- telefone;
- altura em centímetros.

A altura é reaproveitada em avaliações posteriores e pode ser atualizada.

## 4. Bioimpedância
Entrada:
- manual;
- múltiplas fotografias.

Campos:
- peso;
- altura;
- IMC;
- percentual de gordura;
- massa gorda;
- massa muscular;
- massa livre de gordura;
- gordura visceral;
- metabolismo basal.

Automação:
- peso + altura calculam IMC;
- peso + percentual de gordura calculam massa gorda e massa livre de gordura.

Fluxo OCR:
múltiplas imagens → extração → consolidação → conferência humana → correção → salvar.
As imagens originais não precisam ser preservadas após a confirmação.

## 5. Adipômetro
Protocolo único inicial: Jackson-Pollock 7 dobras.
Dobras:
- peitoral;
- axilar média;
- tríceps;
- subescapular;
- abdominal;
- supra-ilíaca;
- coxa.

Resultados:
- somatório das sete dobras;
- densidade corporal;
- percentual de gordura;
- massa gorda quando houver peso;
- massa livre de gordura quando houver peso.

Bioimpedância e adipometria permanecem metodologias distintas nos históricos e gráficos.

## 6. Antropometria
Campos iniciais:
- cintura;
- quadril;
- panturrilha.

Campos vazios não aparecem no relatório.

## 7. Histórico e evolução
- todas as datas selecionadas por padrão;
- possibilidade de desmarcar datas;
- histórico de bioimpedância separado do adipômetro;
- antropometria longitudinal;
- comparação futura de duas datas lado a lado;
- nenhuma interpretação diagnóstica automática.

## 8. Modo paciente
Exibe resultados e evolução em tela limpa, sem campos administrativos ou de edição.
Objetivo: permitir apresentação conjunta durante a consulta.

## 9. Relatório
Título: Avaliação Antropométrica.
Identificação:
- paciente;
- data de nascimento / idade;
- data da avaliação;
- profissional: Thales Chateaubriand;
- CRM 25254;
- logo e identificação da clínica configuráveis.

Saídas:
- impressão;
- PDF;
- download;
- envio por e-mail;
- copiar texto para prontuário.

Somente campos registrados são exibidos.

## 10. Texto para prontuário
Texto detalhado, objetivo e sem diagnóstico ou conduta.
Deve incluir resultados atuais e, quando aplicável, evolução entre datas selecionadas.

## 11. Usuários e permissões
Perfis previstos:
- Administrador/Médico;
- Nutricionista;
- Assistente.

Exemplo:
Assistente pode cadastrar paciente e editar dados administrativos, mas não deve editar avaliações clínicas sem permissão.

## 12. Auditoria
Registrar:
- usuário;
- ação;
- horário;
- entidade;
- valores anteriores e posteriores em alterações relevantes.

Relatórios emitidos devem poder ser rastreados por versão.

## 13. Segurança
Antes de produção:
- TLS;
- autenticação real;
- RLS;
- segregação por organização;
- logs de acesso;
- política de retenção;
- backups;
- revisão LGPD;
- nenhum segredo no frontend público.

## 14. Integração com Cliniv
Objetivo preferencial: módulo embutido dentro do Cliniv, com SSO e contexto automático do paciente.
O sistema independente continua existindo como fallback e ambiente de evolução do produto.
