# Arquitetura e mapeamento para o Cliniv

## 1. Arquitetura atual

Frontend web em JavaScript, publicado no GitHub Pages.

Camadas:
- interface e fluxo: `professional/js/app.js`;
- cálculos: `professional/js/calculations.js`;
- adaptador de dados: `professional/js/data-store.js`;
- backend atual: Firebase Authentication + Cloud Firestore;
- autorização atual: memberships + regras do Firestore;
- OCR de imagens: Tesseract.js;
- PDF: PDF.js + OCR quando necessário.

## 2. Arquitetura recomendada dentro do Cliniv

### Camada de apresentação
Reutilizar ou reconstruir os componentes visuais dentro do framework frontend já usado pelo Cliniv.

### Camada de domínio
Manter as regras de cálculo independentes do banco e da interface.

### Camada de persistência
Criar um adaptador Cliniv com a mesma responsabilidade do `AppDataStore`.

Interface lógica sugerida:

- `searchPatients(query)`
- `getPatient(id)`
- `createPatient(payload)`
- `updatePatient(id, patch)`
- `listAssessments(patientId)`
- `saveAssessment(patientId, assessment)`
- `getCurrentProfessional()`

Se o contexto do paciente já vier do Cliniv, busca/cadastro podem ser reduzidos ou removidos do fluxo principal.

## 3. Contexto mínimo recebido do Cliniv

### Profissional
- professional_id
- nome
- CRM/conselho quando aplicável
- função/permissões

### Paciente
- patient_id interno do Cliniv
- nome completo
- data de nascimento
- sexo
- e-mail, se disponível
- telefone, se disponível
- altura, se disponível

## 4. Estrutura lógica de uma avaliação

```json
{
  "date": "YYYY-MM-DD",
  "bio": {
    "weight": 0,
    "bmi": 0,
    "fatPct": 0,
    "fatMass": 0,
    "muscleMass": 0,
    "leanMass": 0,
    "visceral": 0,
    "bmr": 0
  },
  "skinfold": {
    "fatPct": 0,
    "density": 0,
    "sum": 0,
    "folds": {
      "chest": 0,
      "axillary": 0,
      "triceps": 0,
      "subscapular": 0,
      "abdomen": 0,
      "suprailiac": 0,
      "thigh": 0,
      "biceps": 0,
      "medialCalf": 0
    }
  },
  "anthropometry": {
    "waist": 0,
    "hip": 0,
    "calf": 0,
    "arm": 0,
    "neck": 0,
    "abdomen": 0,
    "thigh": 0
  }
}
```

Campos não aferidos devem permanecer ausentes/nulos e ser omitidos no relatório.

## 5. Regras de cálculo

### IMC
```
IMC = peso_kg / (altura_m²)
```

### Massa gorda
```
massa_gorda = peso × percentual_gordura / 100
```

### Massa livre de gordura
```
massa_livre_gordura = peso - massa_gorda
```

### Jackson-Pollock 7 dobras

Somatório:
```
S = peitoral + axilar_media + triceps + subescapular + abdominal + suprailiaca + coxa
```

Masculino:
```
densidade = 1.112
            - 0.00043499 × S
            + 0.00000055 × S²
            - 0.00028826 × idade
```

Feminino:
```
densidade = 1.097
            - 0.00046971 × S
            + 0.00000056 × S²
            - 0.00012828 × idade
```

Siri:
```
percentual_gordura = 495 / densidade - 450
```

A implementação fonte está em `professional/js/calculations.js`.

## 6. OCR

Fluxo atual:
1. selecionar múltiplas fotos e/ou PDFs;
2. PDF textual: extrair texto diretamente;
3. PDF escaneado: renderizar página e executar OCR;
4. imagem: executar OCR;
5. consolidar valores reconhecidos;
6. mostrar tela de conferência;
7. usuário corrige se necessário;
8. somente depois aplicar ao formulário.

Arquivos originais não precisam ser persistidos.

## 7. Relatório

O relatório visual contém:
- identificação;
- gráfico de composição corporal;
- bioimpedância;
- composição estimada pelo adipômetro;
- tabela comparativa de medidas aferidas;
- circunferências;
- identificação profissional.

O texto longitudinal para prontuário existe separadamente para copiar ao Cliniv.

## 8. Permissões de referência

- OWNER: controle total;
- Administrador: gerencia acessos;
- Médico: avaliações clínicas;
- Nutricionista: avaliações clínicas;
- Assistente: dados administrativos, sem editar avaliação clínica.

A equipe do Cliniv deve mapear esses papéis para o RBAC interno.

## 9. Identificadores

Na integração nativa, usar o `patient_id` do próprio Cliniv como referência principal. Evitar duplicar pacientes apenas para este módulo.
