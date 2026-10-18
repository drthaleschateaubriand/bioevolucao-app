# Firebase — Avaliação Antropométrica

Esta pasta contém a configuração de segurança do backend Firebase.

## Primeira versão sem custo obrigatório

A arquitetura inicial usa:
- Firebase Authentication;
- Cloud Firestore;
- GitHub Pages para o frontend.

Cloud Functions NÃO é requisito da primeira versão. Isso evita depender do plano Blaze apenas para administrar acessos.

## Como a autorização funciona

1. O proprietário cria um convite no Portal do Proprietário.
2. O convite recebe um token aleatório.
3. O usuário recebe o link.
4. O usuário cria sua própria senha usando o e-mail autorizado.
5. O Firestore só permite criar o membership quando o token, o e-mail e as funções correspondem exatamente ao convite.
6. Sem membership ativo, o usuário não lê pacientes nem avaliações.

Uma pessoa pode criar uma conta no Firebase Authentication fora do fluxo do aplicativo, mas continuará sem qualquer acesso aos dados, porque as regras do Firestore exigem autorização ativa.

## Funções

### OWNER
Controle máximo da organização e do Portal do Proprietário.

### Administrador
Gerencia usuários comuns e acessos permitidos, sem poder alterar o OWNER.

### Médico
Pode registrar e atualizar avaliações clínicas.

### Nutricionista
Pode registrar e atualizar avaliações clínicas.

### Assistente
Pode cadastrar e atualizar dados administrativos do paciente, mas não criar ou alterar avaliações clínicas.

## Proteções importantes

- documentos OWNER não são alteráveis pelo frontend;
- registros clínicos não são apagados pelo frontend;
- usuário bloqueado deixa de acessar os dados;
- organização é validada em todas as leituras/escritas;
- avaliação clínica exige função clínica;
- nenhuma chave administrativa fica no site público.

## Bootstrap do primeiro OWNER

O primeiro OWNER é criado uma única vez pelo Console Firebase:
1. criar o usuário no Firebase Authentication;
2. copiar o UID;
3. criar manualmente `memberships/{UID}` no Firestore com:
   - uid: UID
   - email: e-mail do proprietário
   - displayName: nome
   - organizationId: default
   - globalRole: owner
   - status: active
   - appRoles.anthropometry: owner

Depois disso, todos os demais usuários podem ser administrados pelo Portal do Proprietário.

## Evolução opcional

Se no futuro for desejado:
- desabilitar contas diretamente no Firebase Auth;
- revogar todas as sessões;
- auditoria imutável do lado servidor;
- envio automático de convites por e-mail;

podemos adicionar Firebase Admin SDK em Cloud Functions. Cloud Functions exige plano Blaze, por isso essa camada é opcional e não bloqueia a primeira versão.
