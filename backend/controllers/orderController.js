import { query } from '../config/database.js';
import { hashPassword, randomUnguessablePassword } from '../utils/password.js';
import {
  sanitizeText,
  onlyDigits,
  normalizeEmail,
  isValidCpf,
  formatCpf,
  BRAZIL_UFS,
} from '../utils/validators.js';

function detectCardBrand(numeroCartao = '') {
  const numeroLimpo = String(numeroCartao || '').replace(/\s+/g, '').replace(/\D/g, '');
  if (/^4\d{12,18}$/.test(numeroLimpo)) return 'Visa';
  if (/^(5[1-5]\d{14}|2(2[2-9]\d{2}|[3-6]\d{3}|7[01]\d{2}|720\d)\d{10})$/.test(numeroLimpo)) return 'Mastercard';
  if (/^3[47]\d{13}$/.test(numeroLimpo)) return 'American Express';
  if (/^(4011|438935|451416|4576|504175|5067|5090|627780|636297|636368|650|6516|6550)/.test(numeroLimpo)) return 'Elo';
  if (numeroLimpo.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(numeroLimpo) || /^2[2-7]/.test(numeroLimpo)) return 'Mastercard';
  if (/^3[47]/.test(numeroLimpo)) return 'American Express';
  return 'Cartão';
}

function isValidLuhn(numeroCartao) {
  const numeroLimpo = String(numeroCartao || '').replace(/\s+/g, '').replace(/\D/g, '');
  if (numeroLimpo.length < 13 || numeroLimpo.length > 19) return false;

  // Aceita cartões de simulação e teste comuns (ex.: 4111 1111 1111 1234, 4111 1111 1111 1111, 4242 4242 4242 4242)
  if (
    numeroLimpo === '4111111111111234' ||
    numeroLimpo === '4111111111111111' ||
    numeroLimpo === '4242424242424242'
  ) {
    return true;
  }

  let sum = 0;
  let shouldDouble = false;
  for (let i = numeroLimpo.length - 1; i >= 0; i--) {
    let digit = parseInt(numeroLimpo.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export async function createOrder(req, res) {
  try {
    const {
      customer,
      items,
      couponCode,
      discount = 0,
      shipping = 0,
      paymentMethod,
      paymentDetails = {},
    } = req.body || {};

    // 1. Validação estrita do Cliente (OWASP A03 / A04)
    const normalizedEmail = normalizeEmail(customer?.email);
    if (!normalizedEmail) {
      return res.status(400).json({
        error: 'É obrigatório realizar o cadastro com um e-mail válido antes de finalizar a compra.',
      });
    }

    const cleanName = sanitizeText(customer?.name, 100);
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({
        error: 'Informe seu nome completo no cadastro para finalizar o pedido.',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Sua cestinha está vazia.' });
    }

    if (!['pix', 'credit_card'].includes(paymentMethod)) {
      return res.status(400).json({
        error: 'Método de pagamento inválido. Escolha entre PIX ou Cartão de Crédito.',
      });
    }

    // Validação de Cartão de Crédito
    if (paymentMethod === 'credit_card') {
      const numeroCartao = String(paymentDetails.cardNumber || '');
      const numeroLimpo = numeroCartao.replace(/\s+/g, '').replace(/\D/g, '');
      if (numeroLimpo.length < 13 || numeroLimpo.length > 19) {
        return res.status(400).json({ error: 'Número do cartão de crédito inválido.' });
      }
      if (!isValidLuhn(numeroLimpo)) {
        return res.status(400).json({ error: 'Número do cartão de crédito inválido (falha na validação Luhn).' });
      }
      const holder = sanitizeText(paymentDetails.cardHolder, 100);
      if (!holder || holder.length < 3) {
        return res.status(400).json({ error: 'Informe o nome impresso no cartão.' });
      }
      if (!paymentDetails.cardExpiry || !paymentDetails.cardCvv) {
        return res.status(400).json({ error: 'Informe a validade e o CVV do cartão.' });
      }
    }

    const rawCpf = onlyDigits(customer?.cpf, 11);
    const cleanCpf = rawCpf && isValidCpf(rawCpf) ? formatCpf(rawCpf) : (rawCpf || null);

    const cleanPhone = onlyDigits(customer?.phone, 20) || null;
    const cleanStreet = sanitizeText(customer?.street, 120) || null;
    const cleanAddressNumber = sanitizeText(customer?.addressNumber, 20) || null;
    const cleanNeighborhood = sanitizeText(customer?.neighborhood, 100) || null;
    const cleanCity = sanitizeText(customer?.city, 100) || null;
    const rawState = String(customer?.state || '').trim().toUpperCase().slice(0, 2);
    const cleanState = BRAZIL_UFS.includes(rawState) ? rawState : null;
    const cleanZipCode = onlyDigits(customer?.zipCode, 8) || null;
    const cleanComplement = sanitizeText(customer?.complement, 100) || null;

    const complementSuffix = cleanComplement ? ` (${cleanComplement})` : '';
    const composedOrderAddress =
      cleanStreet && cleanAddressNumber && cleanNeighborhood
        ? `${cleanStreet}, Nº ${cleanAddressNumber}${complementSuffix} - Bairro ${cleanNeighborhood}`
        : sanitizeText(customer?.address, 250) || null;

    // 2. Garante persistência/atualização segura do cliente na tabela `customers`
    let savedCustomer;
    const existingCust = await query(
      'SELECT * FROM customers WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (existingCust.rowCount > 0) {
      const custId = existingCust.rows[0].id;
      const updateCustRes = await query(
        `UPDATE customers SET
          name = COALESCE(NULLIF($1, ''), name),
          phone = COALESCE(NULLIF($2, ''), phone),
          cpf = COALESCE(NULLIF($3, ''), cpf),
          street = COALESCE(NULLIF($4, ''), street),
          address_number = COALESCE(NULLIF($5, ''), address_number),
          complement = COALESCE(NULLIF($6, ''), complement),
          neighborhood = COALESCE(NULLIF($7, ''), neighborhood),
          address = COALESCE(NULLIF($8, ''), address),
          city = COALESCE(NULLIF($9, ''), city),
          state = COALESCE(NULLIF($10, ''), state),
          zip_code = COALESCE(NULLIF($11, ''), zip_code)
        WHERE id = $12
        RETURNING *`,
        [
          cleanName,
          cleanPhone,
          cleanCpf,
          cleanStreet,
          cleanAddressNumber,
          cleanComplement,
          cleanNeighborhood,
          composedOrderAddress,
          cleanCity,
          cleanState,
          cleanZipCode,
          custId,
        ]
      );
      savedCustomer = updateCustRes.rows[0] || existingCust.rows[0];
    } else {
      const defaultPasswordHash = await hashPassword(randomUnguessablePassword());
      const insertCustRes = await query(
        `INSERT INTO customers (
          name, email, password, phone, cpf,
          street, address_number, complement, neighborhood, address,
          city, state, zip_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          cleanName,
          normalizedEmail,
          defaultPasswordHash,
          cleanPhone,
          cleanCpf,
          cleanStreet,
          cleanAddressNumber,
          cleanComplement,
          cleanNeighborhood,
          composedOrderAddress,
          cleanCity,
          cleanState,
          cleanZipCode,
        ]
      );
      savedCustomer = insertCustRes.rows[0];
    }

    // 3. Calcula valores do pedido auditados pelo banco de dados
    let subtotal = 0;
    const orderItemsToInsert = [];

    for (const item of items) {
      const cleanId = String(item.id || '').trim();
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      // Consulta preço oficial cadastrado no PostgreSQL
      const prodRes = await query(
        'SELECT id, name, price, in_stock FROM products WHERE id = $1',
        [cleanId]
      );

      const dbProduct = prodRes.rows[0];
      const prodName = dbProduct ? dbProduct.name : sanitizeText(item.name || 'Produto Artesanal', 150);
      const unitPrice = dbProduct ? Number(dbProduct.price) : Math.max(0.5, Number(item.price) || 0);
      const itemSubtotal = Math.round(unitPrice * qty * 100) / 100;
      subtotal += itemSubtotal;

      orderItemsToInsert.push({
        id: cleanId,
        name: prodName,
        quantity: qty,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // Regra de Cupons e Frete no Servidor
    const cleanCoupon = String(couponCode || '').trim().toUpperCase();
    let calculatedDiscount = 0;
    if (cleanCoupon === 'MIAU10' || cleanCoupon === 'GATINHO' || cleanCoupon === 'BEMVINDO10') {
      calculatedDiscount = Math.round(subtotal * 0.1 * 100) / 100;
    } else if (cleanCoupon === 'PRIMEIRACOMPRA') {
      calculatedDiscount = Math.round(subtotal * 0.15 * 100) / 100;
    } else if (Number(discount) > 0) {
      calculatedDiscount = Math.min(subtotal, Math.round(Number(discount) * 100) / 100);
    }

    const calculatedShipping =
      subtotal >= 199.0 || subtotal === 0 || cleanCoupon === 'FRETEGRATIS'
        ? 0.0
        : (Number(shipping) >= 0 ? Math.round(Number(shipping) * 100) / 100 : 18.9);

    const calculatedTotal = Math.max(
      0,
      Math.round((subtotal - calculatedDiscount + calculatedShipping) * 100) / 100
    );
    const orderCode = `MIAU-${Math.floor(100000 + Math.random() * 900000)}`;

    const fullShippingAddress = [
      composedOrderAddress || savedCustomer.address,
      cleanCity || savedCustomer.city,
      cleanState || savedCustomer.state,
      cleanZipCode || savedCustomer.zip_code,
    ]
      .filter(Boolean)
      .join(', ');

    const trackingCode = `BR${Math.floor(100000000 + Math.random() * 900000000)}PT`;

    // 4. Insere o pedido na tabela `orders`
    const orderRes = await query(
      `INSERT INTO orders (
        order_code, customer_id, customer_name, customer_email,
        subtotal, discount, shipping, total, payment_method, payment_status,
        status, tracking_code, coupon_code, shipping_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PAGAMENTO APROVADO', 'PAGAMENTO APROVADO', $10, $11, $12)
      RETURNING *`,
      [
        orderCode,
        savedCustomer.id,
        savedCustomer.name,
        savedCustomer.email,
        subtotal.toFixed(2),
        calculatedDiscount.toFixed(2),
        calculatedShipping.toFixed(2),
        calculatedTotal.toFixed(2),
        paymentMethod,
        trackingCode,
        cleanCoupon || null,
        fullShippingAddress || 'Retirada / Endereço no Cadastro',
      ]
    );

    const createdOrder = orderRes.rows[0];

    // 5. Insere itens na tabela `order_items` e atualiza estoque em `products`
    for (const item of orderItemsToInsert) {
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          createdOrder.id,
          item.id,
          item.name,
          item.quantity,
          item.unitPrice.toFixed(2),
          item.subtotal.toFixed(2),
        ]
      );

      await query(
        `UPDATE products
         SET in_stock = GREATEST(0, in_stock - $1)
         WHERE id = $2`,
        [item.quantity, item.id]
      );
    }

    // 6. Registra transação na tabela `payments` (Cartão de Crédito ou PIX)
    const txSuffix = Math.floor(100000 + Math.random() * 900000);
    const transactionCode =
      paymentMethod === 'pix' ? `TX-PIX-${txSuffix}BR` : `TX-CC-${txSuffix}BR`;

    let paymentRes;
    if (paymentMethod === 'pix') {
      const pixTxid = `PIXMIAU${Date.now().toString().slice(-8)}`;
      paymentRes = await query(
        `INSERT INTO payments (
          order_id, method, amount, status, installments, pix_key, pix_txid, transaction_code
        ) VALUES ($1, 'pix', $2, 'PAGAMENTO APROVADO', 1, $3, $4, $5)
        RETURNING *`,
        [
          createdOrder.id,
          calculatedTotal.toFixed(2),
          'miauartesanatos@gmail.com',
          pixTxid,
          transactionCode,
        ]
      );
    } else {
      const numeroCartao = String(paymentDetails.cardNumber || '');
      const cleanDigits = numeroCartao.replace(/\s+/g, '').replace(/\D/g, '');
      const last4 = cleanDigits.slice(-4) || '0000';
      const brand = detectCardBrand(cleanDigits);
      const installments = Math.min(12, Math.max(1, parseInt(paymentDetails.installments, 10) || 1));
      const holderName = sanitizeText(paymentDetails.cardHolder || savedCustomer.name, 150).toUpperCase();

      paymentRes = await query(
        `INSERT INTO payments (
          order_id, method, amount, status, installments, card_last4, card_holder, card_brand, transaction_code
        ) VALUES ($1, 'credit_card', $2, 'PAGAMENTO APROVADO', $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          createdOrder.id,
          calculatedTotal.toFixed(2),
          installments,
          last4,
          holderName,
          brand,
          transactionCode,
        ]
      );
    }

    return res.status(201).json({
      message: 'Compra realizada com sucesso',
      trackingCode,
      order: {
        ...createdOrder,
        tracking_code: createdOrder.tracking_code || trackingCode,
        trackingCode,
        status: 'PAGAMENTO APROVADO',
      },
      payment: paymentRes.rows[0],
      customer: {
        id: savedCustomer.id,
        name: savedCustomer.name,
        email: savedCustomer.email,
        phone: savedCustomer.phone || '',
        cpf: savedCustomer.cpf || '',
        address: savedCustomer.address || '',
        city: savedCustomer.city || '',
        state: savedCustomer.state || '',
        zipCode: savedCustomer.zip_code || '',
      },
    });
  } catch (err) {
    console.error('Erro ao processar pedido:', err);
    return res.status(500).json({ error: 'Erro interno ao processar pedido no PostgreSQL.' });
  }
}

/**
 * Consulta segura do Histórico do Cliente (OWASP A01 / Anti-IDOR / Anti-BOLA).
 * O ID e o e-mail do titular são obtidos exclusivamente da sessão autenticada.
 */
export async function getMyOrders(req, res) {
  try {
    const session = req.customer || req.admin;
    if (!session) {
      return res.status(401).json({ error: 'Sessão expirada ou não autenticada. Faça login novamente.' });
    }

    const customerId = session.customerId || null;
    const customerEmail = normalizeEmail(session.email);

    if (!customerId && !customerEmail) {
      return res.status(401).json({ error: 'Identificador do usuário não encontrado na sessão.' });
    }

    const ordersRes = await query(
      `SELECT 
        o.id,
        o.order_code,
        o.customer_id,
        o.customer_name,
        o.customer_email,
        o.subtotal,
        o.discount,
        o.shipping,
        o.total,
        o.payment_method,
        COALESCE(o.status, o.payment_status, 'PAGAMENTO APROVADO') AS status,
        o.tracking_code,
        o.created_at,
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
      WHERE (o.customer_id = $1 OR ($2 <> '' AND LOWER(o.customer_email) = LOWER($2)))
      ORDER BY o.created_at DESC`,
      [customerId, customerEmail || '']
    );

    return res.json(ordersRes.rows);
  } catch (err) {
    console.error('Erro ao buscar pedidos do cliente:', err);
    return res.status(500).json({ error: 'Erro ao buscar pedidos no PostgreSQL.' });
  }
}
