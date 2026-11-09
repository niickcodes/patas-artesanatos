import { query } from '../config/database.js';
import {
  sanitizeText,
  onlyDigits,
  toSafeMoney,
  toSafeInt,
  validateProductImage,
} from '../utils/validators.js';

function mapProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categoryLabel: row.category_label,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : null,
    rating: Number(row.rating),
    reviewsCount: Number(row.reviews_count),
    image: row.image,
    badge: row.badge,
    description: row.description,
    dimensions: row.dimensions,
    inStock: Number(row.in_stock),
    createdByEmail: row.created_by_email || null,
    createdAt: row.created_at,
  };
}

export async function getAllProducts(req, res) {
  try {
    const result = await query('SELECT * FROM products ORDER BY created_at DESC, name ASC');
    return res.json(result.rows.map(mapProductRow));
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    return res.status(500).json({ error: 'Erro ao buscar produtos no PostgreSQL.' });
  }
}

export async function createProduct(req, res) {
  try {
    const {
      id,
      name,
      category,
      categoryLabel,
      price,
      originalPrice,
      badge,
      description,
      dimensions,
      inStock,
      image,
    } = req.body || {};

    // Autenticação estrita por sessão verificada (impede spoofing de cabeçalhos via Kali Linux / Burp)
    const isAdmin = Boolean(req.admin);
    const isCustomer = Boolean(req.customer?.email);

    if (!isAdmin && !isCustomer) {
      return res.status(401).json({
        error: 'Você precisa estar autenticado em uma conta para cadastrar produtos.',
      });
    }

    const userEmail = isAdmin
      ? (req.admin.email || 'admin@miau.com').toLowerCase()
      : req.customer.email.toLowerCase();

    const cleanName = sanitizeText(name, 150);
    if (!cleanName || cleanName.length < 3) {
      return res.status(400).json({ error: 'O nome do produto deve ter pelo menos 3 caracteres.' });
    }

    const validCategories = {
      amigurumis: 'Peça em Crochê',
      quadros: 'Quadro Decorativo',
      chaveiros: 'Chaveiro Artesanal',
      casa: 'Cerâmica & Casa',
    };
    const cleanCategory = String(category || '').trim().toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(validCategories, cleanCategory)) {
      return res.status(400).json({
        error: 'Categoria inválida. Escolha entre: amigurumis, quadros, chaveiros ou casa.',
      });
    }

    const safePrice = toSafeMoney(price, { min: 0.5, max: 99999.99 });
    if (safePrice === null) {
      return res.status(400).json({
        error: 'Preço inválido (deve ser entre R$ 0,50 e R$ 99.999,99).',
      });
    }

    const safeOriginalPrice = originalPrice
      ? toSafeMoney(originalPrice, { min: 0.5, max: 99999.99 })
      : null;

    const allowedBadges = [
      'Feito à Mão',
      'Novo',
      'Mais Vendido',
      'Edição Limitada',
      'Destaque',
      'Exclusivo',
      'Promoção',
    ];
    const finalBadge = allowedBadges.includes(badge) ? badge : 'Feito à Mão';

    const dimDigits = onlyDigits(dimensions, 4);
    const dimNum = Number(dimDigits);
    if (!dimDigits || dimNum < 1 || dimNum > 500) {
      return res.status(400).json({
        error: 'Informe as dimensões em centímetros (entre 1 e 500 cm).',
      });
    }
    const formattedDimensions = `${dimNum} cm`;

    const safeStock = toSafeInt(inStock ?? 5, { min: 0, max: 10000 });
    if (safeStock === null) {
      return res.status(400).json({ error: 'Quantidade de estoque inválida (0 a 10.000).' });
    }

    const cleanDesc = sanitizeText(
      description || 'Peça artesanal feita à mão com carinho.',
      1000
    );
    if (cleanDesc.length < 5) {
      return res.status(400).json({
        error: 'A descrição do produto deve ter pelo menos 5 caracteres.',
      });
    }

    const imgCheck = validateProductImage(image);
    if (!imgCheck.ok) {
      return res.status(400).json({
        error: imgCheck.tooLarge
          ? 'A imagem excede o tamanho máximo de 1.5MB.'
          : 'Imagem inválida. Use caminhos internos (/images/*.jpg|png|webp) ou imagem base64 válida.',
      });
    }
    const finalImage = imgCheck.value || '/images/amigurumi_rosa.jpg';

    // Gera ID seguro tipo slug (sanitizado contra Path Traversal e injeções)
    const baseSlug = cleanName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50);

    const slugId =
      id && /^[a-z0-9_-]{3,80}$/.test(id)
        ? id
        : `${baseSlug || 'artesanato'}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await query(
      `INSERT INTO products (
        id, name, category, category_label, price, original_price,
        rating, reviews_count, image, badge, description, dimensions, in_stock, created_by_email
      ) VALUES ($1, $2, $3, $4, $5, $6, 5.0, 1, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        slugId,
        cleanName,
        cleanCategory,
        sanitizeText(categoryLabel, 80) || validCategories[cleanCategory],
        safePrice,
        safeOriginalPrice,
        finalImage,
        finalBadge,
        cleanDesc,
        formattedDimensions,
        safeStock,
        userEmail,
      ]
    );

    return res.status(201).json(mapProductRow(result.rows[0]));
  } catch (err) {
    console.error('Erro ao criar produto:', err.message);
    return res.status(500).json({ error: 'Erro ao cadastrar produto no PostgreSQL.' });
  }
}

export async function deleteProduct(req, res) {
  try {
    const isAdmin = Boolean(req.admin);
    const isCustomer = Boolean(req.customer?.email);

    if (!isAdmin && !isCustomer) {
      return res.status(401).json({
        error: 'Você precisa estar autenticado em uma conta para excluir um produto.',
      });
    }

    const { id } = req.params;
    const cleanId = sanitizeText(id, 80);
    if (!cleanId || !/^[a-zA-Z0-9_-]+$/.test(cleanId)) {
      return res.status(400).json({ error: 'ID do produto inválido para exclusão.' });
    }

    const existing = await query('SELECT * FROM products WHERE id = $1', [cleanId]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado no banco de dados.' });
    }

    const product = existing.rows[0];
    const userEmail = req.customer?.email?.toLowerCase();

    // Controle de Acesso Quebrado (OWASP A01 / IDOR):
    // Apenas Administrador ou o próprio autor que postou o produto pode excluí-lo
    if (!isAdmin && product.created_by_email?.toLowerCase() !== userEmail) {
      return res.status(403).json({
        error: 'Acesso negado: você não tem permissão para excluir produtos de outros usuários.',
      });
    }

    await query('DELETE FROM products WHERE id = $1', [cleanId]);
    return res.json({
      message: 'Produto excluído com sucesso do PostgreSQL!',
      deletedId: cleanId,
    });
  } catch (err) {
    console.error('Erro ao excluir produto:', err.message);
    return res.status(500).json({ error: 'Erro ao excluir produto no PostgreSQL.' });
  }
}
