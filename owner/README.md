# Portal do Proprietário

Painel central de administração dos aplicativos.

## Funções previstas
- listar aplicativos;
- listar usuários;
- convidar usuário por e-mail;
- definir função por aplicativo;
- bloquear / reativar acesso;
- recuperar senha via Firebase Auth;
- manter cada usuário com login individual;
- preparar atividade/auditoria.

## Segurança
Nenhuma chave administrativa do Firebase deve ser colocada neste frontend.

A primeira versão usa somente Firebase Authentication + Firestore e pode funcionar no plano gratuito. Usuários não autorizados podem até criar uma conta no Firebase Authentication se descobrirem o endpoint público, mas as regras do Firestore negam completamente o acesso aos dados sem um convite/membership ativo.

Para operações administrativas mais fortes, como desabilitar a conta no Firebase Authentication, revogar sessões globalmente e gerar auditoria imutável, usar Firebase Admin SDK em backend confiável. Cloud Functions exige plano Blaze, então isso fica como evolução opcional, não como dependência da primeira versão.
