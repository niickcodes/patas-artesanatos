# 🐾 Miau & Amigos — Ateliê Artesanal de Bichinhos (Full-Stack PostgreSQL)

E-commerce artesanal completo organizado em duas pastas independentes (**`backend/`** e **`frontend/`**), desenvolvido com **React 19 + Tailwind CSS + Vite** no frontend e **Node.js + Express + PostgreSQL** no backend.

---

## 🗂️ Estrutura do Projeto (`backend/` e `frontend/`)

```text
miau-artesanatos/
├── backend/                       # Backend Node.js + Express + PostgreSQL (Porta 3001)
│   ├── config/
│   │   ├── database.js            # Conexão PostgreSQL (pg.Pool + PGlite persistente)
│   │   └── seedProducts.js        # Catálogo base sincronizado no PostgreSQL
│   ├── controllers/               # Controllers (produtos, clientes, pedidos, admin)
│   ├── data/pgdata/               # Armazenamento persistente do banco PostgreSQL
│   ├── middleware/adminAuth.js    # Autenticação restrita do painel do banco
│   ├── routes/                    # Rotas da API (/api/products, /customers, /orders, /admin)
│   ├── services/                  # Serviços em background (ex: autoCustomerScheduler.js)
│   ├── sql/schema.sql             # DDL Oficial PostgreSQL (5 tabelas relacionais + índices)
│   ├── .env.example               # Exemplo de variáveis de ambiente do servidor
│   ├── index.js                   # Ponto de entrada do servidor Express
│   └── package.json               # Manifesto e scripts do Backend
│
├── frontend/                      # Frontend React 19 + Vite + Tailwind CSS
│   ├── public/images/             # Fotografias de estúdio dos produtos
│   ├── src/
│   │   ├── components/            # Componentes React (CartDrawer, CustomerModal, DatabaseModal...)
│   │   ├── data/products.js       # Catálogo e categorias do frontend
│   │   ├── services/api.js        # Cliente HTTP integrado à API Backend
│   │   └── utils/formatters.js    # Máscaras de CEP (ViaCEP), CPF, Celular, Preço e UFs
│   ├── index.html                 # HTML principal da aplicação
│   ├── postcss.config.js          # Configuração PostCSS
│   ├── tailwind.config.js         # Tema e paleta Tailwind CSS
│   ├── vite.config.js             # Configuração do Vite + Proxy /api -> localhost:3001
│   └── package.json               # Manifesto e scripts do Frontend
│
└── package.json                   # Workspace raiz para iniciar Backend + Frontend juntos
```

---

## 🚀 Como Executar

### 1. Rodar Backend e Frontend simultaneamente (na raiz):
```bash
npm run dev
```

### 2. Rodar apenas o Backend:
```bash
npm run backend
# ou diretamente na pasta backend:
cd backend && npm run dev
```

### 3. Rodar apenas o Frontend:
```bash
npm run frontend
# ou diretamente na pasta frontend:
cd frontend && npm run dev
```
