# Testes e critérios de aceite

## Princípio
A integração Cliniv é aceita quando preserva os resultados e o fluxo funcional da aplicação de referência, mesmo que a tecnologia interna seja diferente.

## Casos mínimos

### 1. IMC
Entrada:
- peso e altura válidos.

Esperado:
- cálculo automático correto;
- altura em centímetros convertida para metros;
- ausência de peso/altura não gera valor fictício.

### 2. Composição por percentual de gordura
Entrada:
- peso;
- percentual de gordura.

Esperado:
- massa gorda calculada;
- massa livre de gordura calculada;
- massa muscular não deve ser inferida a partir de massa livre de gordura.

### 3. Jackson-Pollock 7
Entrada:
- sexo;
- idade;
- sete dobras positivas.

Esperado:
- somatório;
- densidade;
- percentual de gordura pela fórmula de Siri.

### 4. Dobras incompletas
Entrada:
- menos de sete dobras.

Esperado:
- não calcular Jackson-Pollock;
- manter medidas preenchidas disponíveis para registro se a regra de produto assim permitir;
- não assumir zero para dobra ausente.

### 5. OCR por imagem
Esperado:
- usuário visualiza valores extraídos;
- pode corrigir;
- nada é salvo automaticamente sem confirmação.

### 6. OCR por PDF
Testar:
- PDF com texto selecionável;
- PDF escaneado;
- PDF multipágina.

Esperado:
- leitura das páginas;
- consolidação;
- revisão humana.

### 7. Evolução
Criar pelo menos três datas.

Esperado:
- datas aparecem selecionadas por padrão;
- podem ser desmarcadas;
- gráfico muda conforme seleção;
- bioimpedância e adipômetro não são misturados como um único método.

### 8. Relatório
Esperado:
- campos vazios omitidos;
- tabela comparativa mostra medidas por data;
- somatório das sete dobras aparece na tabela de medidas;
- não existe bloco final redundante chamado "Evolução registrada";
- texto para prontuário permanece disponível separadamente.

### 9. Permissões
Validar pelo menos:
- médico;
- nutricionista;
- assistente;
- administrador.

Assistente:
- pode manipular dados administrativos permitidos;
- não pode criar/alterar avaliação clínica sem autorização correspondente.

### 10. Segurança
- usuário sem permissão não acessa paciente;
- usuário não consegue trocar ID na URL/API e obter outro paciente;
- nenhuma chave administrativa fica no cliente;
- arquivos de OCR temporários não são persistidos sem necessidade.

## Teste de regressão visual

Usar a aplicação atual como referência:
https://drthaleschateaubriand.github.io/bioevolucao-app/professional/

Comparar:
- abas;
- ordem dos blocos;
- gráficos;
- tabelas;
- relatório;
- modo paciente.
