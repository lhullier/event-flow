# Event Flow

O **Event Flow** é uma aplicação web moderna para gestão de eventos, incluindo cadastro, gerenciamento de participantes, check-in, gerenciamento de organizadores e painéis administrativos.  
Construído com **React + Vite**, estilizado com **TailwindCSS**, e organizado para fácil manutenção e expansão.

---

## 🚀 Funcionalidades Principais

- Criar e gerenciar eventos
- Registrar participantes
- Gerenciar organizadores e equipes
- Realizar check-in de participantes
- Dashboard com métricas gerais
- Interface responsiva (Desktop e Mobile)

---

## 📦 Tecnologias

- React 18
- Vite
- TailwindCSS
- PostCSS
- ESLint
- JavaScript + JSX

---

## 📁 Estrutura de Pastas

src/
├── components/ # Componentes reutilizáveis

├── hooks/ # Hooks customizados

├── lib/ # Funções auxiliares globais

├── pages/ # Páginas principais do sistema

├── utils/ # Utilidades e helpers

├── App.jsx

└── main.jsx


Guia de Instalação e Configuração

A seguir estão as instruções para instalar e executar o Event Flow localmente.

📌 1. Pré-requisitos

Antes de tudo, instale:

Node.js (versão 18+ recomendada)
Verifique com:

node -v


npm (vem junto com Node)

npm -v

📦 2. Instalar Dependências

Dentro da pasta do projeto:

cd event-flow
npm install


Isso instalará pacotes como React, Vite, Tailwind etc.

▶️ 3. Executar o Servidor de Desenvolvimento
npm run dev


O Vite iniciará o servidor e exibirá algo como:

Local: http://localhost:5173


Abra o link no navegador.

🏗️ 4. Gerar Build de Produção
npm run build


Os arquivos otimizados irão para:

dist/

🌐 5. Servir o Build Localmente (opcional)
npm run preview
