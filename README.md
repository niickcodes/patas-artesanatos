# 🐾 Patas Artesanatos — E-commerce Seguro (OWASP Top 10)


## 📝 Sobre o Projeto
O **Patas Artesanatos** é um e-commerce full-stack de bichinhos artesanais estruturado em monorepo, auditado sob os critérios do **OWASP Top 10** para resistir a testes de intrusão e falhas de segurança.

Organizado em duas pastas independentes (**`backend/`** e **`frontend/`**), desenvolvido com **React 19 + Tailwind CSS + Vite** no frontend e **Node.js + Express + PostgreSQL** no backend.

---

## 🗂️ Estrutura do Repositório
```text
patas-artesanatos/
├── backend/           # API Node.js + Express + PostgreSQL (Porta 3001)
│   ├── config/        # Conexão e scripts de sementes (seed)
│   ├── controllers/   # Regras de negócio
│   ├── routes/        # Endpoints protegidos
│   └── sql/schema.sql # DDL Oficial PostgreSQL
├── frontend/          # React 19 + Vite + Tailwind CSS
└── package.json       # Orquestração simultânea dos ambientes
```

---

## 🔒 Segurança (OWASP Best Practices)
* **SQL Injection (A03):** Parametrização estrita de queries no PostgreSQL.
* **Broken Authentication (A07):** Hash de senhas via `bcrypt` (Custo = 12).
* **IDOR / BOLA (A01):** Tokens de sessão validados diretamente no backend.
* **XSS & Clickjacking (A03/A05):** Cabeçalhos HTTP de segurança (CSP & X-Frame-Options).
* **CSRF / CORS:** Configurações restritas para o ambiente local.

---

## 💻 Instalação Rápida

1. **Clonar e instalar dependências:**
   ```bash
   git clone https://github.com/niickcodes/patas-artesanatos.git
   cd patas-artesanatos
   npm install
   ```

2. **Configurar o Banco de Dados (`.env`):**
   Duplique o arquivo de exemplo e insira a senha do seu PostgreSQL local:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Abra `backend/.env` e configure:
   ```env
   PG_PASSWORD=sua_senha_do_postgresql
   ```

3. **Iniciar o Sistema:**
   O comando abaixo cria as tabelas, aplica os seeds e sobe a aplicação:
   ```bash
   npm run dev
   ```

---

## 🚀 Perfis e Testes para Avaliação

*   **E-mail:** `teste1@gmail.com`
*   **Senha:** `Teste1234@` *(Credencial genérica de uso público exclusiva para homologação do carrinho).*
* **Administrador:** `admin@patasartesanatos.com` *(senha configurada no `.env` para rota `/admin`)*
* **Cartões de Teste (Algoritmo de Luhn):**
  * Visa: `4111 1111 1111 1234`
  * Mastercard: `5555 5555 5555 4444`
  * Cielo: `6505 2900 0000 2190`

