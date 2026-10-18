# Avaliação Antropométrica — versão profissional

Esta pasta contém a reconstrução profissional do protótipo BioEvolução.

## Objetivo
Criar um módulo clínico de composição corporal utilizável de forma independente e preparado para incorporação futura no Cliniv.

## Estado atual
A interface desta pasta é uma prévia funcional separada do aplicativo antigo. Ela inclui:
- login de demonstração;
- busca e cadastro de paciente;
- resumo da última avaliação;
- bioimpedância manual;
- adipômetro Jackson-Pollock 7 dobras;
- cintura, quadril e panturrilha;
- cálculo automático de IMC;
- cálculo de massa gorda e massa livre de gordura;
- histórico por datas;
- seleção de datas;
- modo de apresentação ao paciente;
- texto para copiar no prontuário;
- impressão / PDF pelo navegador;
- envio por e-mail via cliente local.

Os dados desta prévia ainda usam armazenamento local. NÃO usar esta versão com dados identificáveis de pacientes.

## Próximas conexões obrigatórias antes de produção
1. Supabase/PostgreSQL para banco em nuvem.
2. Supabase Auth ou provedor equivalente para e-mail, senha e recuperação.
3. RLS e permissões por função.
4. OCR de várias imagens com tela de conferência.
5. serviço de geração e envio de PDF por e-mail.
6. auditoria de alterações.
7. integração/SSO com Cliniv.

## Identidade profissional
Responsável: Thales Chateaubriand — CRM 25254.

## Prévia
Após publicação pelo GitHub Pages:
https://drthaleschateaubriand.github.io/bioevolucao-app/professional/
