# Checklist de integração Cliniv

## Contexto e autenticação
- [ ] Abrir o módulo sem novo login.
- [ ] Receber profissional autenticado.
- [ ] Receber paciente atualmente aberto.
- [ ] Não enviar senha por URL, iframe ou API.
- [ ] Validar permissões no backend, não apenas no frontend.

## Paciente
- [ ] Identificar por ID interno do Cliniv.
- [ ] Carregar nome, nascimento, sexo e altura.
- [ ] Definir se altura atualizada no módulo retorna ao cadastro principal.
- [ ] Evitar cadastro duplicado.

## Avaliação
- [ ] Salvar cada avaliação com data/hora e profissional.
- [ ] Preservar bioimpedância e adipometria como métodos distintos.
- [ ] Manter campos opcionais realmente opcionais.
- [ ] Não transformar ausência de dado em zero.
- [ ] Registrar autoria e alterações relevantes.

## Bioimpedância
- [ ] Entrada manual.
- [ ] Upload de múltiplas fotos.
- [ ] Upload de PDF.
- [ ] PDF textual e PDF escaneado.
- [ ] Tela de revisão dos valores reconhecidos.
- [ ] Não salvar automaticamente OCR sem revisão humana.

## Adipometria
- [ ] Jackson-Pollock 7 dobras.
- [ ] Fórmula diferenciada por sexo.
- [ ] Idade calculada na data atual conforme implementação vigente.
- [ ] Fórmula de Siri.
- [ ] Somatório das 7 dobras.
- [ ] Massa gorda e massa livre de gordura quando houver peso.
- [ ] Bíceps e panturrilha medial apenas como medidas adicionais.

## Evolução
- [ ] Todas as datas selecionadas por padrão.
- [ ] Permitir desmarcar datas.
- [ ] Gráfico separado para bioimpedância.
- [ ] Gráfico separado para adipômetro.
- [ ] Tabela longitudinal das pregas.
- [ ] Tabela longitudinal das circunferências.

## Relatório
- [ ] Identificação do paciente.
- [ ] Identificação do profissional.
- [ ] Gráficos.
- [ ] Bioimpedância.
- [ ] Adipometria.
- [ ] Tabela comparativa de medidas aferidas.
- [ ] Campos vazios omitidos.
- [ ] Impressão/PDF.
- [ ] Texto para prontuário em campo separado.

## Segurança e LGPD
- [ ] Criptografia em trânsito.
- [ ] Controle de acesso por usuário e organização.
- [ ] Logs de acesso e alteração.
- [ ] Política de retenção.
- [ ] Backups.
- [ ] Nenhum segredo no frontend.
- [ ] Não incorporar as credenciais/Firebase da demonstração.
- [ ] Validar política Cliniv para arquivos temporários do OCR.

## Aceite
- [ ] Comparar cálculos com a aplicação de referência.
- [ ] Comparar relatório visual.
- [ ] Validar fluxo real com paciente de teste não identificável.
- [ ] Testar permissões por perfil.
- [ ] Validar impressão/PDF.
- [ ] Validar em desktop e mobile.
