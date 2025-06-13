# Detecção de Placas Brasileiras

Este projeto é uma aplicação front-end em React/TypeScript que detecta placas de veículos em imagens ou vídeos, permite correção manual das leituras e consulta informações de veículos via um backend FastAPI.

## Funcionalidades

* Carregamento de imagens ou vídeos
* Detecção automática de placas (endpoint `/detect-plate/`)
* Revisão e edição manual de placas detectadas
* Verificação de dados de veículos (endpoint `/consulta-placa/{placa}`)
* Suporte a modo claro e escuro

## Pré-requisitos

* Node.js (v14 ou superior)
* npm ou yarn
* Backend FastAPI rodando e acessível

## Inicialização

1. **Clone o repositório**

   ```bash
   git clone https://github.com/seu-usuario/detecao-placas.git
   cd detecao-placas
   ```

2. **Instale as dependências**

   Usando npm:

   ```bash
   npm install
   ```

   Ou usando yarn:

   ```bash
   yarn install
   ```

3. **Configure variáveis de ambiente**

   Atualmente o backend está configurado para um backend real em produção. Para rodar localmente, altere a seguinte variável no src/app.tsx:

   ```tsx
   API_BASE=https://api.seu-backend.com
   ```

   Exemplo: Para executar localmente na porta 8000 seguindo o Readme do [backend do projeto](https://github.com/AnandaCampelo/compvis-backend), o tsx deve ser alterado para:

   ```tsx
   API_BASE = 'http://127.0.0.1:8000';
   ``` 

4. **Execute a aplicação em modo de desenvolvimento**

   ```bash
   npm run dev
   # ou
   yarn dev
   ```

   Acesse [http://localhost:5173](http://localhost:5173) no seu navegador.

5. **Build para produção**

   ```bash
   npm run build
   # ou
   yarn build
   ```

   Para pré-visualizar o build:

   ```bash
   npm run preview
   # ou
   yarn preview
   ```

## Tecnologias

* React 18 + TypeScript
* Vite como bundler
* Tailwind CSS para estilos
* lucide-react para ícones
* FastAPI (Python) no backend

## Notas para a correção:

Esse frontend foi desenvolvido para seguir o escopo do projeto ao analisar somente placas brasileiras. Assim, para incluir placas de outros países, além de alterar o backend, é necessário alterar o regex utilizado para validação de placas no frontend em src/App.tsx:

```tsx
const plateRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
```

## Contribuição

Pull requests são bem-vindos! Para mudanças maiores, abra uma issue primeiro para discutirmos o que você gostaria de modificar.

---

Desenvolvido por você. Feel free to adapt conforme necessidade.
