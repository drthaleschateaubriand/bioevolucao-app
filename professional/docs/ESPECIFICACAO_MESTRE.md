# Especificação Mestre — Avaliação Antropométrica

## Objetivo
Módulo clínico para registro e acompanhamento longitudinal de composição corporal, bioimpedância, adipometria e perímetros, utilizável de forma independente e incorporável ao Cliniv.

## Fluxo principal
1. autenticação;
2. busca ou recebimento do contexto do paciente;
3. resumo da última avaliação;
4. nova avaliação em Bioimpedância, Adipômetro e Antropometria;
5. salvar avaliação;
6. visualizar evolução e selecionar datas;
7. mostrar resultados ao paciente;
8. copiar texto objetivo para prontuário;
9. imprimir/gerar relatório.

## Paciente
- nome completo;
- data de nascimento;
- idade calculada;
- sexo;
- e-mail;
- telefone;
- altura.

Na integração Cliniv, o paciente deve preferencialmente vir do prontuário já aberto.

## Bioimpedância
Entrada:
- manual;
- múltiplas fotos;
- múltiplos PDFs.

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
- peso + altura → IMC;
- peso + percentual de gordura → massa gorda e massa livre de gordura.

OCR:
arquivo → extração/OCR → consolidação → conferência humana → correção → aplicar.

PDF textual é lido diretamente. PDF escaneado é renderizado e enviado ao OCR. Os arquivos não precisam ser persistidos após a conferência.

## Adipômetro
Protocolo: Jackson-Pollock 7 dobras.

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

Pregas adicionais opcionais:
- bíceps;
- panturrilha medial.

Essas duas não entram no Jackson-Pollock 7.

Bioimpedância e adipometria são metodologias distintas e permanecem separadas no histórico e nos gráficos.

## Antropometria
- cintura;
- quadril;
- panturrilha;
- braço/CB;
- pescoço;
- abdome;
- coxa.

Campos vazios são omitidos do relatório.

## Evolução
- todas as datas selecionadas por padrão;
- datas podem ser desmarcadas;
- gráfico da bioimpedância;
- gráfico do adipômetro;
- tabelas longitudinais;
- tabela comparativa de pregas e circunferências.

No adipômetro, o gráfico de composição usa peso + percentual de gordura do Jackson-Pollock para estimar massa gorda e massa livre de gordura.

Não inferir massa muscular a partir da massa livre de gordura.

## Relatório
Título: Avaliação Antropométrica.

Inclui:
- identificação do paciente;
- profissional;
- gráficos;
- bioimpedância;
- composição pelo adipômetro;
- tabela comparativa de medidas aferidas;
- circunferências.

O somatório das 7 dobras aparece na tabela comparativa de medidas.

O relatório visual não contém bloco redundante final chamado “Evolução registrada”.

## Texto para prontuário
Existe separadamente do relatório visual.

Deve ser objetivo, factual e sem diagnóstico/conduta automáticos. Pode resumir avaliação atual e diferenças entre datas selecionadas.

## Usuários e permissões
- OWNER;
- Administrador;
- Médico;
- Nutricionista;
- Assistente.

Assistente pode trabalhar com dados administrativos permitidos, mas não alterar avaliação clínica sem permissão clínica.

## Auditoria
A integração definitiva deve permitir rastrear:
- usuário;
- ação;
- horário;
- entidade;
- mudanças relevantes.

## Segurança
- autenticação;
- autorização no backend;
- segregação por organização;
- logs;
- backups;
- retenção;
- revisão LGPD;
- nenhum segredo administrativo no frontend.

## Cliniv
Modelo preferencial:
**Cliniv → paciente aberto → módulo nativo**

O usuário não deve precisar autenticar novamente ou pesquisar o mesmo paciente.

Ver:
- `INTEGRACAO_CLINIV.md`
- `../../handoff-cliniv/`
