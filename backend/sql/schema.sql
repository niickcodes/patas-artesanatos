-- ============================================================================
-- PATAS & PONTO - ATELIÊ AFETIVO ANIMAL
-- Schema Oficial do Banco de Dados PostgreSQL
-- ============================================================================

-- 1. Tabela de Clientes (E-mail e CPF únicos + Hash Bcrypt de Senha + Endereço Completo)
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(40),
  cpf VARCHAR(20) UNIQUE,
  street VARCHAR(120),
  address_number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Produtos do Catálogo Artesanal
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(60) NOT NULL,
  category_label VARCHAR(100) NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  original_price NUMERIC(10, 2),
  rating NUMERIC(3, 2) DEFAULT 5.00,
  reviews_count INTEGER DEFAULT 0,
  image TEXT NOT NULL,
  badge VARCHAR(80),
  description TEXT NOT NULL,
  dimensions VARCHAR(100),
  in_stock INTEGER NOT NULL DEFAULT 1 CHECK (in_stock >= 0),
  created_by_email VARCHAR(180),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_code VARCHAR(32) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(180) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  shipping NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('pix', 'credit_card')),
  payment_status VARCHAR(30) NOT NULL DEFAULT 'aprovado',
  coupon_code VARCHAR(40),
  shipping_address TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(80) REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 5. Tabela de Transações de Pagamento (Cartão de Crédito e PIX)
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method VARCHAR(30) NOT NULL CHECK (method IN ('pix', 'credit_card')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'aprovado',
  installments INTEGER DEFAULT 1 CHECK (installments >= 1 AND installments <= 12),
  card_last4 VARCHAR(4),
  card_holder VARCHAR(150),
  card_brand VARCHAR(40),
  pix_key VARCHAR(255),
  pix_txid VARCHAR(100),
  transaction_code VARCHAR(100) UNIQUE NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance e unicidade no PostgreSQL
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
UPDATE customers
SET cpf = NULL
WHERE cpf IS NOT NULL
  AND id NOT IN (
    SELECT MIN(id)
    FROM customers
    WHERE cpf IS NOT NULL AND cpf <> ''
    GROUP BY cpf
  );
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_cpf_unique ON customers(cpf) WHERE cpf IS NOT NULL AND cpf <> '';
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
