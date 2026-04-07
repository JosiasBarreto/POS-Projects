# Sistema de POS e Gestão de Inventário

Este é um sistema completo de Ponto de Venda (POS) e Gestão de Inventário desenvolvido com React, Vite, Express e SQLite.

## Tecnologias Utilizadas

- **Frontend:** React 19, Tailwind CSS, Lucide React, Motion (framer-motion), Sonner (toasts).
- **Backend:** Node.js, Express, Better-SQLite3.
- **IA:** Integração com Google Gemini AI (@google/genai).
- **Relatórios:** jsPDF, jsPDF-AutoTable, XLSX (Excel).

## Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (Versão 20 ou superior recomendada)
- [VS Code](https://code.visualstudio.com/)

## Como Rodar o Projeto Localmente

1. **Extrair o Projeto:**
   Extraia o conteúdo do arquivo ZIP em uma pasta de sua preferência.

2. **Abrir no VS Code:**
   Abra a pasta do projeto no VS Code.

3. **Instalar Dependências:**
   Abra o terminal integrado do VS Code (`Ctrl + '` ou `Cmd + '`) e execute:
   ```bash
   npm install
   ```

4. **Configurar Variáveis de Ambiente:**
   Crie um arquivo chamado `.env` na raiz do projeto (baseado no `.env.example`) e adicione sua chave de API do Gemini:
   ```env
   GEMINI_API_KEY="SUA_CHAVE_AQUI"
   ```
   *Nota: Você pode obter uma chave gratuita no [Google AI Studio](https://aistudio.google.com/).*

5. **Iniciar o Servidor de Desenvolvimento:**
   No terminal, execute:
   ```bash
   npm run dev
   ```
   O servidor iniciará em `http://localhost:3000`.

## Estrutura do Projeto

- `/src`: Contém todo o código do frontend (React).
  - `/pages`: Telas principais (POS, Inventário, Histórico, etc).
  - `/components`: Componentes reutilizáveis.
  - `/contexts`: Gerenciamento de estado global (Autenticação, Sessão).
  - `/lib`: Utilitários e lógica de impressão/PDF.
- `server.ts`: Servidor Express que gerencia a API e o banco de dados SQLite.
- `pos_stp.db`: Arquivo do banco de dados SQLite (será criado automaticamente se não existir).

## Sugestões para trabalhar com Gemini no VS Code

Para continuar desenvolvendo este projeto com a ajuda da IA no VS Code, recomendo:

1. **Extensão Google Gemini:**
   Instale a extensão oficial do Gemini para VS Code. Ela permite que você faça perguntas sobre o código, peça refatorações e gere novas funcionalidades diretamente no editor.

2. **GitHub Copilot com Gemini:**
   Se você usa o GitHub Copilot, agora é possível selecionar o modelo **Gemini 1.5 Pro** como o motor de chat, o que oferece uma excelente capacidade de raciocínio para tarefas complexas.

3. **Contexto é Tudo:**
   Ao pedir ajuda ao Gemini no VS Code, sempre mencione que o projeto é um **Full-Stack (Express + Vite)** e que o banco de dados é **SQLite**. Isso ajudará a IA a dar respostas mais precisas.

## Dicas de Desenvolvimento

- **Banco de Dados:** Você pode usar uma extensão como "SQLite Viewer" no VS Code para visualizar os dados da tabela `pos_stp.db` em tempo real.
- **Tailwind CSS:** Use a extensão "Tailwind CSS IntelliSense" para facilitar a estilização.
- **Tipagem:** O projeto está configurado com TypeScript para garantir maior segurança e menos erros em tempo de execução.

---
Desenvolvido com ❤️ para facilitar a gestão do seu negócio.
