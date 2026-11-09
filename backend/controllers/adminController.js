import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  query,
  executeSafeReadOnlyQuery,
  getDatabaseMetadata,
  switchExternalPostgres,
} from '../config/database.js';
import {
  validateAdminCredentials,
  generateAdminToken,
  revokeAdminSession,
  ADMIN_EMAIL,
} from '../middleware/adminAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body || {};

    const authResult = await validateAdminCredentials(email, password, req.ip);
    if (authResult.lockedMs > 0) {
      const waitMin = Math.ceil(authResult.lockedMs / 60000);
      return res.status(429).json({
        error: `Conta temporariamente bloqueada por excesso de tentativas. Aguarde ${waitMin} minuto(s).`,
      });
    }

    if (!authResult.ok) {
      return res.status(401).json({
        error: 'E-mail ou senha incorretos! Acesso restrito à administração Miau & Ponto.',
      });
    }

    const token = generateAdminToken(req, res, authResult.adminEmail);
    return res.json({
      message: 'Autenticação administrativa realizada com sucesso!',
      token,
      adminEmail: authResult.adminEmail || ADMIN_EMAIL,
      database: getDatabaseMetadata(),
    });
  } catch (err) {
    console.error('Erro no login admin:', err.message);
    return res.status(500).json({ error: 'Erro interno ao autenticar administrador.' });
  }
}

export async function adminLogout(req, res) {
  revokeAdminSession(req, res);
  return res.json({ message: 'Sessão administrativa encerrada com sucesso.' });
}

export async function getDatabaseOverview(req, res) {
  try {
    const [
      customersRes,
      productsRes,
      ordersRes,
      orderItemsRes,
      paymentsRes,
      columnsRes,
    ] = await Promise.all([
      query(`
        SELECT id, name, email, phone, cpf, street, address_number, complement,
               neighborhood, address, city, state, zip_code, created_at
        FROM customers
        ORDER BY id DESC
      `),
      query('SELECT * FROM products ORDER BY category ASC, name ASC'),
      query('SELECT * FROM orders ORDER BY id DESC'),
      query('SELECT * FROM order_items ORDER BY id DESC'),
      query('SELECT * FROM payments ORDER BY id DESC'),
      query(`
        SELECT table_name, column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name <> 'password'
        ORDER BY table_name, ordinal_position
      `),
    ]);

    const schemaFilePath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const rawSchemaSql = fs.readFileSync(schemaFilePath, 'utf-8');

    const totalRevenue = ordersRes.rows.reduce((acc, row) => acc + Number(row.total || 0), 0);
    const pixOrders = ordersRes.rows.filter((o) => o.payment_method === 'pix').length;
    const cardOrders = ordersRes.rows.filter((o) => o.payment_method === 'credit_card').length;

    return res.json({
      metadata: getDatabaseMetadata(),
      stats: {
        totalCustomers: customersRes.rowCount,
        totalProducts: productsRes.rowCount,
        totalOrders: ordersRes.rowCount,
        totalOrderItems: orderItemsRes.rowCount,
        totalPayments: paymentsRes.rowCount,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        pixOrders,
        cardOrders,
      },
      tables: {
        customers: customersRes.rows,
        products: productsRes.rows,
        orders: ordersRes.rows,
        order_items: orderItemsRes.rows,
        payments: paymentsRes.rows,
      },
      columns: columnsRes.rows,
      schemaSql: rawSchemaSql,
    });
  } catch (err) {
    console.error('Erro ao obter visão geral do banco PostgreSQL:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar tabelas do PostgreSQL.' });
  }
}

export async function executeAdminQuery(req, res) {
  try {
    const { sql } = req.body || {};
    const startTime = Date.now();
    const result = await executeSafeReadOnlyQuery(sql);
    const durationMs = Date.now() - startTime;

    return res.json({
      rows: result.rows,
      rowCount: result.rowCount,
      durationMs,
    });
  } catch (err) {
    return res.status(400).json({
      error: err.message || 'Não foi possível processar a consulta SQL.',
    });
  }
}

export async function connectExternalServer(req, res) {
  try {
    const { host, port, user, password, database } = req.body || {};
    const info = await switchExternalPostgres({
      host: host || 'localhost',
      port: port || 5432,
      user: user || 'postgres',
      password,
      database: database || 'miau_artesanatos',
    });
    return res.json({
      message: 'Conectado com sucesso ao servidor PostgreSQL dedicado!',
      metadata: info,
    });
  } catch (err) {
    return res.status(400).json({
      error: err.message || 'Não foi possível conectar ao servidor PostgreSQL externo.',
    });
  }
}

// ---------------------------------------------------------------------------
// Gerenciamento Administrativo Protegido (OWASP A01 - Broken Access Control)
// ---------------------------------------------------------------------------

export async function getAllOrders(req, res) {
  try {
    const ordersRes = await query(
      `SELECT 
        o.*,
        COALESCE(
          (
            SELECT string_agg(oi.product_name, ', ')
            FROM order_items oi
            WHERE oi.order_id = o.id
          ),
          'Produtos Diversos'
        ) AS product_names,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal
            ))
            FROM order_items oi
            WHERE oi.order_id = o.id
          ),
          '[]'::json
        ) AS items
      FROM orders o
      ORDER BY o.created_at DESC`
    );
    return res.json(ordersRes.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar pedidos do PostgreSQL.' });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const cleanStatus = String(status || '').trim().slice(0, 40);
    if (!cleanStatus) {
      return res.status(400).json({ error: 'Informe um status válido para o pedido.' });
    }

    const updateRes = await query(
      'UPDATE orders SET payment_status = $1, status = $1 WHERE id = $2 RETURNING *',
      [cleanStatus, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    return res.json({
      message: 'Status do pedido atualizado com sucesso!',
      order: updateRes.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar status do pedido.' });
  }
}

export async function getAllUsers(req, res) {
  try {
    const usersRes = await query(
      'SELECT id, name, email, role, phone, cpf, street, city, state, zip_code, created_at FROM customers ORDER BY id DESC'
    );
    return res.json(usersRes.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const userRes = await query('SELECT id, email, role FROM customers WHERE id = $1', [id]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (userRes.rows[0].email === 'admin@patasartesanatos.com' || userRes.rows[0].role === 'admin') {
      return res.status(400).json({ error: 'Não é permitido excluir contas de administrador.' });
    }

    await query('DELETE FROM customers WHERE id = $1', [id]);
    return res.json({ message: 'Usuário excluído com sucesso do PostgreSQL!' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
}
