# ZapAI Master Admin

Sistema completo de gestão de atendimento via WhatsApp com inteligência artificial integrada (Google Gemini, OpenAI, Anthropic, etc.).

## 🚀 Funcionalidades

- **Dashboard de Atendimento:** Visualize conversas em tempo real.
- **Integração AI Inteligente:** Respostas automáticas usando os modelos mais modernos.
- **Gestão de Agendamentos:** Sistema de marcação de horários integrado.
- **Multi-Provedor WhatsApp:** Suporte para UltraMsg e Z-API.
- **Login com Google:** Autenticação segura integrada.

## 🛠️ Arquitetura

O projeto é dividido em duas partes principais:
1. **Frontend:** Desenvolvido com React, Vite e Tailwind CSS.
2. **Backend:** Node.js com Express e Prisma (PostgreSQL).

---

## 💻 Configuração Local

### Pré-requisitos
- Node.js (v18+)
- PostgreSQL (ou utilize o Prisma Accelerate para DB na nuvem)

### 1. Clonar o repositório
```bash
git clone <seu-repositorio>
cd Zap-Ai-Master
```

### 2. Configurar o Backend
```bash
cd backend
npm install
```
- Copie o arquivo `.env.example` para `.env` e preencha suas chaves:
  - `DATABASE_URL` (URL do seu banco PostgreSQL)
  - `GOOGLE_API_KEY`, `OPENAI_API_KEY`, etc.
  - `ULTRAMSG_INSTANCE_ID` e `TOKEN` (ou Z-API)

- Sincronize o banco de dados:
```bash
npm run prisma:generate
npm run prisma:push
```

- Inicie o servidor:
```bash
npm run dev
```

### 3. Configurar o Frontend
Retorne para a raiz do projeto:
```bash
cd ..
npm install
```
- Copie o arquivo `.env.example` para `.env.local` e preencha:
  - `VITE_GOOGLE_CLIENT_ID` (Para o login com Google)
  - `VITE_ULTRAMSG_WEBHOOK_URL` (Sua URL do backend ou túnel ngrok)

- Inicie o frontend:
```bash
npm run dev
```

---

## 🌐 Deploy

### Backend
Pode ser hospedado no **Railway**, **Render** ou **Heroku**.
- Certifique-se de configurar todas as variáveis de ambiente no painel do host.
- O comando de inicialização deve ser `cd backend && npm install && npm run prisma:generate && node server.js`.

### Frontend
Recomendamos o **Vercel** ou **Netlify**.
- Conecte seu repositório GitHub.
- Configure o `Build Command` como `npm run build`.
- Configure o `Output Directory` como `dist`.

---

## 📦 Estrutura de Pastas
- `/backend/scripts`: Scripts úteis para testes e depuração.
- `/backend/services`: Lógica de integração com APIs de IA e WhatsApp.
- `/components`: Componentes React do Dashboard.
- `/services`: Serviços frontend (Gemini, localStorage, etc.).
